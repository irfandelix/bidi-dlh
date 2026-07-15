import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// @ts-ignore
import ImageModule from 'docxtemplater-image-module-free';

// Helper to translate number to words
function terbilang(angka: number): string {
  const words = [
    '', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'
  ];
  if (angka < 12) return words[angka];
  if (angka < 20) return words[angka - 10] + ' belas';
  if (angka < 100) return words[Math.floor(angka / 10)] + ' puluh ' + words[angka % 10];
  if (angka < 200) return 'seratus ' + terbilang(angka - 100);
  if (angka < 1000) return words[Math.floor(angka / 100)] + ' ratus ' + terbilang(angka % 100);
  if (angka < 2000) return 'seribu ' + terbilang(angka - 1000);
  if (angka < 10000) return words[Math.floor(angka / 1000)] + ' ribu ' + terbilang(angka % 1000);
  return angka.toString(); // Fallback for larger numbers not typically needed for dates
}

function getHari(date: Date): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[date.getDay()];
}

function getBulan(date: Date): string {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return months[date.getMonth()];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch Agenda Data
    const { data: agenda, error: agendaError } = await supabase
      .from('pengawasan_lapangans')
      .select('*')
      .eq('id', id)
      .single();

    if (agendaError || !agenda) {
      return NextResponse.json({ error: 'Agenda tidak ditemukan' }, { status: 404 });
    }

    // 2. Fetch BAP Data
    const { data: bapRec, error: bapError } = await supabase
      .from('bap_pengawasans')
      .select('*')
      .eq('pengawasan_id', id)
      .single();

    if (bapError || !bapRec) {
      return NextResponse.json({ error: 'Data BAP belum diisi. Harap isi form BAP Lapangan terlebih dahulu.' }, { status: 400 });
    }

    // 3. Prepare Data
    const bapData = typeof bapRec.data_matriks_c === 'string' ? JSON.parse(bapRec.data_matriks_c) : bapRec.data_matriks_c;
    const identitas = bapData.identitas || {};
    const checklist = bapData.checklist || [];
    const dokumentasi = bapData.dokumentasi || [];
    const dokumenIzin = bapData.dokumen_izin || [];

    // Parse Tim Tugas
    let timPengawasArr: string[] = [];
    if (agenda.tim_tugas) {
      try { timPengawasArr = JSON.parse(agenda.tim_tugas); } 
      catch { timPengawasArr = agenda.tim_tugas.split('|').map((t: string) => t.trim()).filter((t: string) => t !== ''); }
    }

    // Parse Saksi
    let saksiArr: string[] = [];
    if (agenda.saksi) {
      try { saksiArr = JSON.parse(agenda.saksi); } 
      catch { saksiArr = agenda.saksi.split('|').map((t: string) => t.trim()).filter((t: string) => t !== ''); }
    }

    // Date calculations
    const today = new Date();
    const hari_ini_nama = getHari(today);
    const hari_ini_tanggal_terbilang = terbilang(today.getDate()).trim();
    const hari_ini_bulan = getBulan(today);
    const hari_ini_tahun_terbilang = terbilang(Math.floor(today.getFullYear() / 1000) * 1000) + ' ' + terbilang(today.getFullYear() % 1000); 
    const hari_ini_tahun = today.getFullYear().toString();

    // Convert Checklist Array into Key-Value Object based on point or key
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

    // Formatting Tim Pengawas
    const tim_pengawas = timPengawasArr.map((nama: string, idx: number) => ({
      no: idx + 1,
      nama_pengawas: nama,
      ttd_pengawas: bapData.ttd_tim && bapData.ttd_tim[idx] ? bapData.ttd_tim[idx] : '',
      paraf_pengawas: bapData.paraf_tim && bapData.paraf_tim[idx] ? bapData.paraf_tim[idx] : ''
    }));

    // Formatting Saksi
    const saksi = saksiArr.map((nama: string, idx: number) => ({
      no: idx + 1,
      nama_saksi: nama,
      jabatan_saksi: bapData.saksi_details && bapData.saksi_details[idx]?.jabatan ? bapData.saksi_details[idx].jabatan : '-',
      telepon_saksi: bapData.saksi_details && bapData.saksi_details[idx]?.telepon ? bapData.saksi_details[idx].telepon : '-',
      ttd_saksi: bapData.ttd_saksi && bapData.ttd_saksi[idx] ? bapData.ttd_saksi[idx] : ''
    }));

    // Formatting Dokumen Izin
    const dokumen_izin = dokumenIzin.map((val: string, idx: number) => ({
      nomor_urut: idx + 1,
      nama: val
    }));

    // Formatting Foto (2 per row for table)
    const foto_baris = [];
    for (let i = 0; i < dokumentasi.length; i += 2) {
      foto_baris.push({
        foto_1: dokumentasi[i]?.file || '',
        ket_1: dokumentasi[i]?.keterangan || '',
        foto_2: dokumentasi[i+1]?.file || '',
        ket_2: dokumentasi[i+1]?.keterangan || ''
      });
    }

    // Formatting Saran
    const saran = (bapData.saran || []).map((val: string, idx: number) => ({
      no: idx + 1,
      abjad: String.fromCharCode(97 + idx), // a, b, c, ...
      saran_text: val
    }));

    // Formatting Perwakilan / Pendamping Lapangan
    const perwakilan = (bapData.perwakilan || []).map((val: any, idx: number) => ({
      no: idx + 1,
      nama_perwakilan: val.nama || '',
      jabatan_perwakilan: val.jabatan || '',
      telepon_perwakilan: val.telepon || '',
      ttd_perwakilan: val.ttd || '',
      paraf_perwakilan: val.paraf || ''
    }));

    // Formatting Rincian Skoring
    const skoring = (bapData.rincian_skoring || []).map((val: any, idx: number) => ({
      no: idx + 1,
      nama_komponen: val.nama || '',
      nilai_komponen: val.nilai || ''
    }));

    const data = {
      ...identitas, // contains kbli, alamat, pj_nama, telepon dll.
      ...checklistFlat, // contains air_fisik, ket_air_fisik dll.
      nama_badan_usaha_kegiatan: agenda.nama_pemrakarsa,
      alamat_lokasi: agenda.alamat_lokasi,
      hari_ini_nama,
      hari_ini_tanggal_terbilang,
      hari_ini_bulan,
      hari_ini_tahun_terbilang: hari_ini_tahun_terbilang.replace('  ', ' ').trim(),
      tahun_ini: hari_ini_tahun,
      waktu_pengawasan: identitas.waktu_pengawasan || '........',
      
      ttd_pemrakarsa: bapData.ttd_pemrakarsa || '',
      paraf_pemrakarsa: bapData.paraf_pemrakarsa || '',
      
      tim_pengawas,
      saksi,
      perwakilan,
      dokumen_izin,
      foto_baris,
      saran,
      skoring,
      status_ketaatan: bapRec.status_ketaatan || '',
      total_skor: bapRec.total_skor || ''
    };

    // 4. Determine Template
    let templateName = 'bap-toko.docx';
    const kategori = (agenda.kategori || '').toLowerCase();
    
    if (kategori.includes('industri') && fs.existsSync(path.join(process.cwd(), 'public', 'templates-bap', 'bap-industri.docx'))) {
      templateName = 'bap-industri.docx';
    } else if ((kategori.includes('fasyankes') || kategori.includes('kesehatan')) && fs.existsSync(path.join(process.cwd(), 'public', 'templates-bap', 'bap-fasyankes.docx'))) {
      templateName = 'bap-fasyankes.docx';
    } else if (kategori.includes('perumahan') && fs.existsSync(path.join(process.cwd(), 'public', 'templates-bap', 'bap-perumahan.docx'))) {
      templateName = 'bap-perumahan.docx';
    } else if (!fs.existsSync(path.join(process.cwd(), 'public', 'templates-bap', templateName))) {
      const files = fs.readdirSync(path.join(process.cwd(), 'public', 'templates-bap'));
      const docxFiles = files.filter(f => f.endsWith('.docx'));
      if (docxFiles.length > 0) templateName = docxFiles[0];
      else throw new Error('Tidak ada file template BAP (.docx) di folder public/templates-bap/');
    }

    const templatePath = path.join(process.cwd(), 'public', 'templates-bap', templateName);
    const content = fs.readFileSync(templatePath, 'binary');

    const zip = new PizZip(content);

    const imageOptions = {
      getImage: function(tagValue: string, tagName: string) {
        if (!tagValue) return false;
        const base64Regex = /^data:image\/(png|jpeg|jpg);base64,/;
        if (!base64Regex.test(tagValue)) return false;
        
        const base64Data = tagValue.replace(base64Regex, '');
        return Buffer.from(base64Data, 'base64');
      },
      getSize: function(img: any, tagValue: string, tagName: string) {
        if (tagName.includes('foto_')) return [250, 250]; 
        if (tagName.includes('ttd_')) return [150, 75]; 
        if (tagName.includes('paraf_')) return [50, 30]; 
        return [150, 150];
      }
    };

    const imageModule = new ImageModule(imageOptions);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      modules: [imageModule]
    });

    doc.render(data);

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    const safeName = (agenda.nama_pemrakarsa || 'Usaha').replace(/[^a-zA-Z0-9]/g, '_');

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="BAP_${safeName}.docx"`,
      },
    });

  } catch (error: any) {
    console.error('Error generating BAP:', error);
    return NextResponse.json({ error: error.message || 'Gagal generate dokumen BAP' }, { status: 500 });
  }
}
