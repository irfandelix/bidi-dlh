import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export async function POST(request: Request) {
  try {
    const supabase: any = await createClient();
    const body = await request.json();
    
    const { yth, dari, hal, sifat, lampiran, kegiatan, petugas } = body;

    // 1. Dapatkan Nomor Nota Dinas terbaru
    const tanggal_nota = new Date().toISOString().split('T')[0];
    const tahun = new Date(tanggal_nota).getFullYear().toString();
    const bulan = new Date(tanggal_nota).getMonth() + 1;

    const { data: lastDoc, error: lastErr } = await supabase
      .from('arsip_nota_dinas')
      .select('no_urut')
      .ilike('tanggal_nota', `${tahun}-%`)
      .order('no_urut', { ascending: false })
      .limit(1);

    if (lastErr) {
      console.error('Supabase error saat cari urut:', lastErr);
      return NextResponse.json({ error: lastErr.message }, { status: 400 });
    }

    let nextUrut = 1;
    if (lastDoc && lastDoc.length > 0) {
      nextUrut = (lastDoc[0].no_urut || 0) + 1;
    }

    let urutStr = String(nextUrut).padStart(3, '0');
    // Format Perizinan Lingkungan (600.4.1)
    const nomor_otomatis = `600.4.1/${urutStr}.${bulan}/17/PI/${tahun}`;

    // 2. Simpan Nomor ke Database (Booking nomor)
    const payload = {
      no_urut: nextUrut,
      nama_nota: hal || 'Nota Dinas Perizinan',
      tanggal_nota,
      dari_bagian: 'Perizinan',
      nomor_otomatis,
      file_url: null,
      pemohon_id: null,
      keterangan: `Dibuat otomatis dari Modul Perizinan: ${kegiatan && kegiatan.length > 0 ? kegiatan[0].nama_usaha + (kegiatan.length > 1 ? ' dkk' : '') : '-'}`
    };

    const { error: insertErr } = await supabase
      .from('arsip_nota_dinas')
      .insert([payload]);

    if (insertErr) {
      console.error('Error insert nota dinas:', insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    // 3. Generate DOCX
    const templatePath = path.resolve('./public/templates/template-perizinan.docx');
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ 
        error: 'TEMPLATE_MISSING',
        message: 'File template-perizinan.docx belum ada di server (public/templates). Silakan buat template tersebut terlebih dahulu. Nomor Nota Dinas tetap ter-booking di arsip.',
        nomor: nomor_otomatis 
      }, { status: 404 });
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Format Tanggal untuk Surat (contoh: 22 April 2026)
    const tglObj = new Date(tanggal_nota);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const tanggalIndo = tglObj.toLocaleDateString('id-ID', options);
    
    // Nama Hari
    const hari = tglObj.toLocaleDateString('id-ID', { weekday: 'long' });
    const tanggalFull = `${hari}, ${tanggalIndo}`;

    // Format Data Petugas
    const petugasArr = Array.isArray(petugas) ? petugas.map((p, idx) => ({ nomor: idx + 1, nama: p })) : [];

    // Format Data Kegiatan (array of objects)
    const kegiatanArr = Array.isArray(kegiatan) ? kegiatan.map((k, idx) => ({
      no: idx + 1,
      nama_usaha: k.nama_usaha || '-',
      deskripsi: k.deskripsi || '-'
    })) : [];

    // Render Data
    doc.render({
      yth: yth || '',
      dari: dari || '',
      hal: hal || '',
      sifat: sifat || 'Biasa',
      lampiran: lampiran || '-',
      nomor_notadinas: nomor_otomatis,
      tanggal: tanggalFull,
      kegiatan: kegiatanArr,
      petugas: petugasArr
    });

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // Return the generated file as response
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="Nota_Dinas_Perizinan_${nomor_otomatis.replace(/\//g, '_')}.docx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server: ' + error.message }, { status: 500 });
  }
}
