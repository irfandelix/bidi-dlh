import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTemplate } from '@/app/pengawasan/ba/isi/[id]/templates';
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
    const { data: agendaRaw, error: agendaError } = await supabase
      .from('pengawasan_lapangans')
      .select('*, bap_pengawasans(*)')
      .eq('id', id)
      .single();

    if (agendaError || !agendaRaw) {
      return NextResponse.json({ error: 'Agenda tidak ditemukan' }, { status: 404 });
    }

    const agenda = agendaRaw as any;
    const bapRow = agenda.bap_pengawasans && agenda.bap_pengawasans.length > 0 ? agenda.bap_pengawasans[0] : null;

    // 2. Fetch BAP Data
    if (!bapRow || !bapRow.data_matriks_c) {
      return NextResponse.json({ error: 'Data BAP belum diisi. Harap isi form BAP Lapangan terlebih dahulu.' }, { status: 400 });
    }
    
    let bapData: any = bapRow.data_matriks_c;
    if (typeof bapData === 'string') {
      try { bapData = JSON.parse(bapData); } catch (e) {}
    }

    const identitas = bapData.formData || bapData.identitas || {};
    const checklist = bapData.checklist || [];
    const dokumentasi = bapData.file_dokumentasi || bapData.dokumentasi || [];
    const dokumenIzin = bapData.dokumenPerizinan || bapData.dokumen_izin || [];

    // Parse Tim Tugas
    let timPengawasArr: string[] = [];
    if (agenda.tim_tugas) {
      try { timPengawasArr = JSON.parse(agenda.tim_tugas); } 
      catch { timPengawasArr = agenda.tim_tugas.split('|').map((t: string) => t.trim()).filter((t: string) => t !== ''); }
    }

    // Parse Saksi (Mobile might not have saksi, but web app might)
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
    const templateDef = getTemplate(agenda.kategori);
    checklist.forEach((bab: any) => {
      if (bab && bab.items) {
        bab.items.forEach((item: any) => {
          if (item.point) {
            // Find key from template definition if missing
            let key = item.key;
            if (!key) {
              for (const tBab of templateDef) {
                const found = tBab.items.find(i => i.point === item.point);
                if (found) {
                  key = found.key;
                  break;
                }
              }
            }
            key = key || item.point; // fallback
            
            checklistFlat[key] = item.kondisi || '';
            checklistFlat[`ket_${key}`] = item.keterangan || '';
          }
        });
      }
    });

    // Formatting Tim Pengawas (used by toko/sppg/industri/fasyankes templates)
    const tim_pengawas = timPengawasArr.map((nama: string, idx: number) => ({
      no: idx + 1,
      nama_pengawas: nama,
      ttd_pengawas: bapData.ttd_tim && bapData.ttd_tim[idx] ? bapData.ttd_tim[idx] : '',
      paraf_pengawas: bapData.paraf_tim && bapData.paraf_tim[idx] ? bapData.paraf_tim[idx] : ''
    }));

    // Formatting Tim Penilai Lengkap (used by perumahan template - same data, different field names)
    const tim_penilai_lengkap = timPengawasArr.map((nama: string, idx: number) => ({
      nomor_urut: idx + 1,
      nama: nama,
      nip: identitas.tim_nip?.[idx] || '-',
      pangkat_golongan: identitas.tim_pangkat?.[idx] || '-',
      jabatan: identitas.tim_jabatan?.[idx] || 'Pengawas Lingkungan Hidup',
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
        foto_2: dokumentasi[i + 1]?.file || '',
        ket_2: dokumentasi[i + 1]?.keterangan || ''
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

    // Extract first perwakilan for root-level tags (used by fasyankes/industri) and fallback for pemrakarsa
    const firstPerwakilan = perwakilan.length > 0 ? perwakilan[0] : null;
    const nama_perwakilan = firstPerwakilan?.nama_perwakilan || identitas.pendamping_nama || '';
    const jabatan_perwakilan = firstPerwakilan?.jabatan_perwakilan || identitas.pendamping_jabatan || '';
    const telepon_perwakilan = firstPerwakilan?.telepon_perwakilan || identitas.telepon || '';
    
    // Use the first perwakilan's signature as ttd_pemrakarsa if the dedicated ttd_pemrakarsa is missing
    const ttd_pemrakarsa_final = bapData.ttd_pemrakarsa || (firstPerwakilan?.ttd_perwakilan || '');
    const ttd_perwakilan_final = firstPerwakilan?.ttd_perwakilan || '';

    // Formatting Rincian Skoring
    const skoring = (bapData.rincian_skoring || []).map((val: any, idx: number) => ({
      no: idx + 1,
      nama_komponen: val.nama || '',
      nilai_komponen: val.nilai || ''
    }));

    // Prepare data payload for docxtemplater
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
      
      ttd_pemrakarsa: ttd_pemrakarsa_final,
      paraf_pemrakarsa: bapData.paraf_pemrakarsa || '',
      // Footer text tags (converted from image tags to avoid VML textbox parsing issues)
      paraf_pengawas_text: '',
      paraf_pemrakarsa_text: '',
      
      // Root-level perwakilan tags
      nama_perwakilan,
      jabatan_perwakilan,
      telepon_perwakilan,
      ttd_perwakilan: ttd_perwakilan_final,
      
      tim_penilai_lengkap,
      tim_pengawas,
      saksi,
      perwakilan,
      dokumen_izin,
      foto_baris,
      saran,
      rincian_skoring: skoring,
      status_ketaatan: agenda.status_ketaatan || '',
      total_skor: agenda.total_skor || ''
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
    } else if (kategori.includes('sppg') && fs.existsSync(path.join(process.cwd(), 'public', 'templates-bap', 'bap-sppg.docx'))) {
      templateName = 'bap-sppg.docx';
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
      getSize: function(img: any, tagValue: string, tagName: string) {
        if (tagName.includes('foto_')) return [300, 225]; // 4:3 ratio for field photos
        if (tagName.includes('ttd_')) return [200, 60]; // Wider aspect ratio for signatures
        if (tagName.includes('paraf_')) return [60, 40]; 
        return [200, 150];
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

    return new NextResponse(buf as any, {
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
