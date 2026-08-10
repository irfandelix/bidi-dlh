import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export async function GET(request: Request) {
  try {
    const supabase: any = await createClient();
    
    // Ambil data dari tabel arsip_nota_dinas beserta relasi ke anggota_bidang (pemohon_id)
    const { data, error } = await supabase
      .from('arsip_nota_dinas')
      .select('*, pemohon:anggota_bidang(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase: any = await createClient();
    const body = await request.json();
    
    const { nama_nota, tanggal_nota, dari_bagian, kode_klasifikasi, file_url, pemohon_id, keterangan, is_sisipan, nomor_sisipan, yth, sifat, lampiran, petugas } = body;
    
    if (!nama_nota || !tanggal_nota || !dari_bagian) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }

    const tahun = new Date(tanggal_nota).getFullYear().toString();

    // Cari no_urut terakhir di tahun yang sama
    // Catatan: Karena supabase tidak memiliki fungsi max() bawaan sederhana di client, 
    // kita urutkan no_urut descending dan ambil 1 teratas.
    // Kita filter juga by tahun (menggunakan ilike tanggal_nota atau ekstract string)
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
    let finalUrutToSave = nextUrut;

    // Jika ini adalah nomor sisipan, kita timpa urutStr dengan input manual (nomor_sisipan)
    // dan set no_urut (angka di database) ke 0 agar tidak mengganggu auto-increment normal.
    if (is_sisipan && nomor_sisipan && nomor_sisipan.trim() !== '') {
      urutStr = nomor_sisipan.trim();
      finalUrutToSave = 0; 
    }

    const bagianUpper = dari_bagian.toUpperCase();
    
    // Ambil bulan dari tanggal nota (1-12)
    const tglObj = new Date(tanggal_nota);
    const bulan = tglObj.getMonth() + 1;
    
    let nomor_otomatis = '';

    if (dari_bagian === 'Pengaduan' || dari_bagian === 'Aduan') {
      nomor_otomatis = `600.4.17.2/${urutStr}.${bulan}/17/PG/${tahun}`;
    } else if (dari_bagian === 'Pengawasan') {
      nomor_otomatis = `600.4.6/${urutStr}.${bulan}/17/PW/${tahun}`;
    } else if (dari_bagian === 'Perizinan') {
      nomor_otomatis = `600.4.1/${urutStr}.${bulan}/17/PL/${tahun}`;
    } else {
      // Default (Umum)
      const kodeAwal = kode_klasifikasi && kode_klasifikasi.trim() !== '' ? kode_klasifikasi.trim() : '600.4';
      nomor_otomatis = `${kodeAwal}/${urutStr}.${bulan}/17/${tahun}`;
    }

    const payload = {
      no_urut: finalUrutToSave,
      nama_nota,
      tanggal_nota,
      dari_bagian,
      nomor_otomatis,
      file_url,
      pemohon_id,
      keterangan
    };

    const { data, error } = await supabase
      .from('arsip_nota_dinas')
      .insert([payload])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Generate Template Word
    try {
      const templatePath = path.resolve('./public/templates/template-umum.docx');
      if (!fs.existsSync(templatePath)) {
        // Jika template tidak ada, kembalikan JSON biasa (hanya booking nomor)
        return NextResponse.json({ 
          success: true, 
          message: 'Nomor berhasil didaftarkan, namun template-umum.docx belum ada di server.',
          data: data[0] 
        }, { status: 201 });
      }

      const content = fs.readFileSync(templatePath, 'binary');
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Format Tanggal
      const tglObj = new Date(tanggal_nota);
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      const tanggalIndo = tglObj.toLocaleDateString('id-ID', options);
      const hari = tglObj.toLocaleDateString('id-ID', { weekday: 'long' });
      const tanggalFull = `${hari}, ${tanggalIndo}`;

      // Format Data Petugas
      const petugasArr = Array.isArray(petugas) ? petugas.map((p, idx) => ({ nomor: idx + 1, nama: p })) : [];

      doc.render({
        nomor_notadinas: nomor_otomatis,
        tanggal: tanggalFull,
        dari_bagian: dari_bagian,
        nama_nota: nama_nota,
        hal: nama_nota,
        yth: yth || '',
        sifat: sifat || 'Biasa',
        lampiran: lampiran || '-',
        petugas: petugasArr
      });

      const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="Nota_Dinas_${dari_bagian}_${nomor_otomatis.replace(/\//g, '_')}.docx"`,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      });
    } catch (docxErr) {
      console.error('Docx generation error:', docxErr);
      // Fallback jika gagal generate file, tetap sukses booking DB
      return NextResponse.json({ success: true, warning: 'Gagal membuat file template', data: data[0] }, { status: 201 });
    }
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
