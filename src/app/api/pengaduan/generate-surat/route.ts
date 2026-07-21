import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// @ts-ignore
import ImageModule from 'docxtemplater-image-module-free';

export async function POST(request: Request) {
  try {
    const supabase: any = await createClient();
    const body = await request.json();
    
    const { id, yth, dari, tembusan, hal, sifat, lampiran, petugas, foto1_url, foto2_url, ket1, ket2, kegiatan_aduan, nama_terlapor, lokasi_aduan, deskripsi_aduan } = body;

    // 1. Dapatkan Nomor Nota Dinas terbaru untuk Pengaduan
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
    // Format Pengaduan
    const nomor_otomatis = `600.4.17.2/${urutStr}.${bulan}/17/PG/${tahun}`;

    // 2. Simpan Nomor ke Database (Booking nomor)
    const payload = {
      no_urut: nextUrut,
      nama_nota: hal || 'Surat Tindak Lanjut Pengaduan',
      tanggal_nota,
      dari_bagian: 'Pengaduan',
      nomor_otomatis,
      file_url: null,
      pemohon_id: null,
      keterangan: `Dibuat otomatis dari Modul Pengaduan (ID: ${id})`
    };

    const { error: insertErr } = await supabase
      .from('arsip_nota_dinas')
      .insert([payload]);

    if (insertErr) {
      console.error('Error insert nota dinas:', insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    // Update status pengaduan menjadi "Ditindaklanjuti" jika diperlukan
    if (id) {
      await supabase
        .from('pengaduan')
        .update({ status: 'ditindaklanjuti' })
        .eq('id', id);
    }

    // 3. Generate DOCX
    // Pastikan user sudah menyimpan file template-pengaduan.docx di dalam folder public/templates
    const templatePath = path.resolve('./public/templates/template-pengaduan.docx');
    
    if (!fs.existsSync(templatePath)) {
      // Jika template belum diupload user
      return NextResponse.json({ 
        error: 'TEMPLATE_MISSING',
        message: 'File template-pengaduan.docx belum ada di server (public/templates). Harap upload template terlebih dahulu.',
        nomor: nomor_otomatis 
      }, { status: 404 });
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    
    // Konfigurasi Image Module
    const imageOptions = {
      centered: false,
      getImage: async function (tagValue: string, tagName: string) {
        if (!tagValue) {
          // Jika tidak ada gambar, berikan gambar transparan 1x1 pixel
          const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
          return transparentPixel;
        }
        try {
          const res = await fetch(tagValue);
          const arrayBuffer = await res.arrayBuffer();
          return Buffer.from(arrayBuffer);
        } catch (e) {
          console.error("Gagal load gambar", tagValue, e);
          const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
          return transparentPixel;
        }
      },
      getSize: function (img: any, tagValue: string, tagName: string) {
        if (!tagValue) return [1, 1]; // pixel kecil
        return [250, 200]; // ukuran default foto (lebar, tinggi) dalam pixel
      },
    };

    const imageModule = new ImageModule(imageOptions);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      modules: [imageModule]
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

    // Proses render async untuk gambar
    await doc.renderAsync({
      yth: yth || '',
      dari: dari || 'Kepala Dinas Lingkungan Hidup Kabupaten Sragen',
      tembusan: tembusan || '',
      hal: hal || '',
      sifat: sifat || 'Biasa',
      lampiran: lampiran || '-',
      nomor: nomor_otomatis,
      tanggal: tanggalFull,
      kegiatan_aduan: kegiatan_aduan || '',
      nama_terlapor: nama_terlapor || '',
      lokasi_aduan: lokasi_aduan || '',
      deskripsi_aduan: deskripsi_aduan || '',
      petugas: petugasArr,
      foto1: foto1_url || '',
      foto2: foto2_url || '',
      ket_foto1: foto1_url ? (ket1 || '-') : '',
      ket_foto2: foto2_url ? (ket2 || '-') : ''
    });

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // Return the generated file as response
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="Surat_Tindak_Lanjut_${nomor_otomatis.replace(/\//g, '_')}.docx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server: ' + error.message }, { status: 500 });
  }
}
