import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// @ts-ignore
import ImageModule from 'docxtemplater-image-module-free';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
  const id = 3;
  const { data: agendaRaw, error: agendaError } = await supabase
    .from('pengawasan_lapangans')
    .select('*, bap_pengawasans(*)')
    .eq('id', id)
    .single();

  if (agendaError || !agendaRaw) {
    console.error('Agenda error', agendaError);
    return;
  }

  const agenda = agendaRaw as any;
  const bapRow = agenda.bap_pengawasans && agenda.bap_pengawasans.length > 0 ? agenda.bap_pengawasans[0] : null;

  if (!bapRow || !bapRow.data_matriks_c) {
    console.error('No bap data');
    return;
  }
  
  let bapData = bapRow.data_matriks_c;
  if (typeof bapData === 'string') {
    bapData = JSON.parse(bapData);
  }

  const identitas = bapData.formData || bapData.identitas || {};
  const checklist = bapData.checklist || [];
  const dokumentasi = bapData.file_dokumentasi || bapData.dokumentasi || [];
  const dokumenIzin = bapData.dokumenPerizinan || bapData.dokumen_izin || [];

  let timPengawasArr = [];
  if (agenda.tim_tugas) {
    try { timPengawasArr = JSON.parse(agenda.tim_tugas); } 
    catch { timPengawasArr = agenda.tim_tugas.split('|').map((t: string) => t.trim()).filter((t: string) => t !== ''); }
  }

  let saksiArr = [];
  if (agenda.saksi) {
    try { saksiArr = JSON.parse(agenda.saksi); } 
    catch { saksiArr = agenda.saksi.split('|').map((t: string) => t.trim()).filter((t: string) => t !== ''); }
  }

  const checklistFlat: Record<string, string> = {};
  checklist.forEach((bab: any) => {
    if (bab && bab.items) {
      bab.items.forEach((item: any) => {
        if (item.point) {
          const key = item.key || item.point;
          checklistFlat[key] = item.kondisi || '';
          checklistFlat[`ket_${key}`] = item.keterangan || '';
        }
      });
    }
  });

  const tim_pengawas = timPengawasArr.map((nama: string, idx: number) => ({
    no: idx + 1,
    nama_pengawas: nama,
    ttd_pengawas: bapData.ttd_tim && bapData.ttd_tim[idx] ? bapData.ttd_tim[idx] : '',
    paraf_pengawas: bapData.paraf_tim && bapData.paraf_tim[idx] ? bapData.paraf_tim[idx] : ''
  }));

  const perwakilan = (bapData.perwakilan || []).map((val: any, idx: number) => ({
    no: idx + 1,
    nama_perwakilan: val.nama || '',
    jabatan_perwakilan: val.jabatan || '',
    telepon_perwakilan: val.telepon || '',
    ttd_perwakilan: val.ttd || '',
    paraf_perwakilan: val.paraf || ''
  }));
  
  const data = {
    ...identitas,
    ...checklistFlat,
    nama_badan_usaha_kegiatan: agenda.nama_pemrakarsa,
    alamat_lokasi: agenda.alamat_lokasi,
    tim_pengawas,
    perwakilan,
    ttd_pemrakarsa: bapData.ttd_pemrakarsa || '',
    paraf_pemrakarsa: bapData.paraf_pemrakarsa || '',
  };

  const templatePath = path.join(process.cwd(), 'public', 'templates-bap', 'bap-perumahan.docx');
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);

  const imageOptions = {
    getImage: function(tagValue: string, tagName: string) {
      const emptyImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
      if (!tagValue || typeof tagValue !== 'string') return emptyImageBuffer;
      const base64Regex = /^data:image\/(png|jpeg|jpg);base64,/;
      if (!base64Regex.test(tagValue)) return emptyImageBuffer;
      try {
        const base64Data = tagValue.replace(base64Regex, '');
        return Buffer.from(base64Data, 'base64');
      } catch (e) {
        return emptyImageBuffer;
      }
    },
    getSize: function() { return [100, 100]; }
  };

  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, modules: [new ImageModule(imageOptions)] });

  try {
    doc.render(data);
    console.log("Success!");
  } catch (error: any) {
    if (error.properties && error.properties.errors) {
      console.log("Multi Error Details:", JSON.stringify(error.properties.errors, null, 2));
    } else {
      console.error(error);
    }
  }
}

main();
