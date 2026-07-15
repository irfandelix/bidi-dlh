import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// @ts-ignore
import ImageModule from 'docxtemplater-image-module-free';
import { getOrCreateFolder, uploadFileToDrive } from '@/lib/gdrive_pengawasan';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function terbilang(angka: number): string {
  const huruf = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  let hasil = "";
  if (angka < 12) {
    hasil = huruf[angka];
  } else if (angka < 20) {
    hasil = terbilang(angka - 10) + " belas";
  } else if (angka < 100) {
    hasil = terbilang(Math.floor(angka / 10)) + " puluh " + terbilang(angka % 10);
  } else if (angka < 200) {
    hasil = "seratus " + terbilang(angka - 100);
  } else if (angka < 1000) {
    hasil = terbilang(Math.floor(angka / 100)) + " ratus " + terbilang(angka % 100);
  } else if (angka < 2000) {
    hasil = "seribu " + terbilang(angka - 1000);
  } else if (angka < 1000000) {
    hasil = terbilang(Math.floor(angka / 1000)) + " ribu " + terbilang(angka % 1000);
  }
  return hasil;
}

function getHari(date: Date) {
  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return hari[date.getDay()];
}

function getBulan(date: Date) {
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return bulan[date.getMonth()];
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data: agenda, error } = await supabase
      .from('agenda')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !agenda) {
      return NextResponse.json({ error: 'Agenda tidak ditemukan' }, { status: 404 });
    }

    let bapData: any = {};
    if (agenda.bap_data) {
      bapData = typeof agenda.bap_data === 'string' ? JSON.parse(agenda.bap_data) : agenda.bap_data;
    } else {
      return NextResponse.json({ error: 'Data BAP belum diisi. Silakan isi form BAP terlebih dahulu.' }, { status: 400 });
    }

    const {
      identitas = {},
      dokumen_izin = [],
      checklist = [],
      dokumentasi = [],
      saran = [],
      rincian_skoring = [],
      tim_pengawas = [],
      ttd_pemrakarsa = '',
      paraf_pemrakarsa = '',
      ttd_tim = [],
      paraf_tim = [],
      perwakilan = []
    } = bapData;

    let timPengawasArr: string[] = [];
    if (agenda.tim_pengawas) {
      try { timPengawasArr = JSON.parse(agenda.tim_pengawas); } 
      catch { timPengawasArr = agenda.tim_pengawas.split('|').map((t: string) => t.trim()).filter((t: string) => t !== ''); }
    }

    let saksiArr: string[] = [];
    if (agenda.saksi) {
      try { saksiArr = JSON.parse(agenda.saksi); } 
      catch { saksiArr = agenda.saksi.split('|').map((t: string) => t.trim()).filter((t: string) => t !== ''); }
    }

    const today = new Date();
    const hari_ini_nama = getHari(today);
    const hari_ini_tanggal_terbilang = terbilang(today.getDate()).trim();
    const hari_ini_bulan = getBulan(today);
    const hari_ini_tahun_terbilang = terbilang(Math.floor(today.getFullYear() / 1000) * 1000) + ' ' + terbilang(today.getFullYear() % 1000); 
    const hari_ini_tahun = today.getFullYear().toString();

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

    const tim_pengawas_formatted = timPengawasArr.map((nama: string, idx: number) => ({
      no: idx + 1,
      nama_pengawas: nama,
      ttd_pengawas: ttd_tim[idx] || '',
      paraf_pengawas: paraf_tim[idx] || ''
    }));

    const tim_penilai_lengkap = [
      ...tim_pengawas_formatted,
      ...perwakilan.map((val: any, idx: number) => ({
        no: tim_pengawas_formatted.length + idx + 1,
        nama_pengawas: val.nama || '',
        ttd_pengawas: val.ttd || '',
        paraf_pengawas: val.paraf || ''
      }))
    ];

    const saksi = saksiArr.map((nama: string, idx: number) => ({
      no: idx + 1,
      nama_saksi: nama,
      jabatan_saksi: bapData.saksi_details && bapData.saksi_details[idx]?.jabatan ? bapData.saksi_details[idx].jabatan : '',
      telepon_saksi: bapData.saksi_details && bapData.saksi_details[idx]?.telepon ? bapData.saksi_details[idx].telepon : '',
      ttd_saksi: bapData.ttd_saksi && bapData.ttd_saksi[idx] ? bapData.ttd_saksi[idx] : ''
    }));

    const dokumen_izin_formatted = dokumen_izin.map((val: string, idx: number) => ({
      no: idx + 1,
      abjad: String.fromCharCode(97 + idx), 
      nama_dokumen: val
    }));

    const saran_formatted = saran.map((val: string, idx: number) => ({
      no: idx + 1,
      isi_saran: val
    }));

    const perwakilan_formatted = perwakilan.map((val: any, idx: number) => ({
      no: idx + 1,
      nama_perwakilan: val.nama || '',
      jabatan_perwakilan: val.jabatan || '',
      telepon_perwakilan: val.telepon || '',
      ttd_perwakilan: val.ttd || '',
      paraf_perwakilan: val.paraf || ''
    }));

    const rincian_skoring_formatted = rincian_skoring.map((val: any, idx: number) => ({
      no: idx + 1,
      komponen: val.komponen || '',
      nilai: val.nilai || ''
    }));

    const foto_baris: any[] = [];
    for (let i = 0; i < dokumentasi.length; i += 2) {
      foto_baris.push({
        foto_1: dokumentasi[i]?.file || '',
        ket_1: dokumentasi[i]?.keterangan || '',
        foto_2: dokumentasi[i + 1]?.file || '',
        ket_2: dokumentasi[i + 1]?.keterangan || ''
      });
    }

    const data = {
      ...identitas,
      ...checklistFlat,
      hari_ini_nama,
      hari_ini_tanggal_terbilang,
      hari_ini_bulan,
      hari_ini_tahun_terbilang,
      hari_ini_tahun,
      nama_usaha: agenda.nama_pemrakarsa,
      alamat_usaha: agenda.alamat_lokasi,
      tim_pengawas: tim_pengawas_formatted,
      tim_penilai_lengkap: tim_penilai_lengkap,
      saksi: saksi,
      dokumen_izin: dokumen_izin_formatted,
      saran: saran_formatted,
      rincian_skoring: rincian_skoring_formatted,
      perwakilan: perwakilan_formatted,
      ttd_pemrakarsa,
      paraf_pemrakarsa,
      foto_baris,
      total_skor: agenda.total_skor || '',
      status_ketaatan: agenda.status_ketaatan || '',
    };

    const kategori = (agenda.kategori || '').toLowerCase();
    let templateName = 'bap-industri.docx';
    
    if (kategori.includes('fasyankes') && fs.existsSync(path.join(process.cwd(), 'public', 'templates-bap', 'bap-fasyankes.docx'))) {
      templateName = 'bap-fasyankes.docx';
    } else if (kategori.includes('toko') && fs.existsSync(path.join(process.cwd(), 'public', 'templates-bap', 'bap-toko.docx'))) {
      templateName = 'bap-toko.docx';
    } else if (kategori.includes('sppg') && fs.existsSync(path.join(process.cwd(), 'public', 'templates-bap', 'bap-sppg.docx'))) {
      templateName = 'bap-sppg.docx';
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

    // ----------------------------------------------------
    // GOOGLE DRIVE UPLOAD LOGIC
    // ----------------------------------------------------
    const safeUsahaName = (agenda.nama_pemrakarsa || 'Usaha').replace(/[^a-zA-Z0-9 _-]/g, '_');
    
    // 1. Create/Get Main Folder for this enterprise
    const enterpriseFolderId = await getOrCreateFolder(safeUsahaName);

    // 2. Upload DOCX file to Main Folder
    const docxName = `BAP_${safeUsahaName}_${hari_ini_tanggal_terbilang}_${hari_ini_bulan}_${hari_ini_tahun}.docx`;
    await uploadFileToDrive(buf, docxName, enterpriseFolderId, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    // 3. Create/Get "Dokumentasi" subfolder
    const dokumentasiFolderId = await getOrCreateFolder('Dokumentasi', enterpriseFolderId);

    // 4. Upload all photos
    for (let i = 0; i < dokumentasi.length; i++) {
      const img = dokumentasi[i];
      if (img.file) {
        const base64Data = img.file.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Extract extension from base64 (usually jpeg)
        let ext = 'jpg';
        const mimeMatch = img.file.match(/^data:image\/(\w+);base64,/);
        if (mimeMatch && mimeMatch[1]) ext = mimeMatch[1];
        if (ext === 'jpeg') ext = 'jpg';

        const customName = img.keterangan ? img.keterangan.replace(/[^a-zA-Z0-9 _-]/g, '_') : `Foto Kegiatan ${i + 1}`;
        const fileName = `${customName}.${ext}`;

        await uploadFileToDrive(imageBuffer, fileName, dokumentasiFolderId, `image/${ext}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      folderId: enterpriseFolderId,
      message: 'Upload ke Google Drive berhasil!' 
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
