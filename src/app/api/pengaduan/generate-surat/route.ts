import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFileBufferFromDrive } from '@/lib/gdrive_pengawasan';
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
    
    const { id, yth, dari, tembusan, hal, sifat, lampiran, petugas, fotos, kegiatan_aduan, nama_terlapor, lokasi_aduan, deskripsi_aduan, catatan_verlap, hasil_verlap } = body;

    // 1. Dapatkan Nomor Nota Dinas yang sudah terintegrasi atau booking baru jika belum ada
    const tanggal_nota = new Date().toISOString().split('T')[0];
    const tahun = new Date(tanggal_nota).getFullYear().toString();
    const bulan = new Date(tanggal_nota).getMonth() + 1;

    let nomor_otomatis = '';
    let notaDinasId: any = null;

    if (id) {
      const { data: currentPengaduan } = await supabase
        .from('pengaduans')
        .select('id, nomor_nota_dinas, nota_dinas_id')
        .eq('id', id)
        .single();

      if (currentPengaduan?.nomor_nota_dinas) {
        nomor_otomatis = currentPengaduan.nomor_nota_dinas;
        notaDinasId = currentPengaduan.nota_dinas_id;
      }
    }

    // Jika belum ada nomor (misal data pengaduan lama), auto-booking nomor baru
    if (!nomor_otomatis) {
      const { data: lastDoc, error: lastErr } = await supabase
        .from('arsip_nota_dinas')
        .select('no_urut')
        .gte('tanggal_nota', `${tahun}-01-01`)
        .lte('tanggal_nota', `${tahun}-12-31`)
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
      // Format resmi Pengaduan
      nomor_otomatis = `600.4.17.2/${urutStr}.${bulan}/17/PG/${tahun}`;

      // Simpan Nomor ke Database (Booking nomor)
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

      const { data: insertedNota, error: insertErr } = await supabase
        .from('arsip_nota_dinas')
        .insert([payload])
        .select()
        .single();

      if (insertErr) {
        console.error('Error insert nota dinas:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 400 });
      }

      if (insertedNota) {
        notaDinasId = insertedNota.id;
      }
    } else if (notaDinasId && hal) {
      // Jika nomor sudah ada dan user mengubah hal/judul, perbarui nama_nota di arsip
      await supabase
        .from('arsip_nota_dinas')
        .update({ nama_nota: hal })
        .eq('id', notaDinasId);
    }

    // Update status pengaduan menjadi "Ditindaklanjuti" dan pastikan nomor_nota_dinas tersimpan
    if (id) {
      const updatePayload: any = { status_tahapan: 'Ditindaklanjuti' };
      if (nomor_otomatis) updatePayload.nomor_nota_dinas = nomor_otomatis;
      if (notaDinasId) updatePayload.nota_dinas_id = notaDinasId;

      await supabase
        .from('pengaduans')
        .update(updatePayload)
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
      centered: true,
      getImage: async function (tagValue: string, tagName: string) {
        const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
        if (!tagValue || typeof tagValue !== 'string') {
          return transparentPixel;
        }

        // 1. Tangani Base64 Image
        if (tagValue.startsWith('data:image/')) {
          try {
            const base64Data = tagValue.split(',')[1] || tagValue;
            return Buffer.from(base64Data, 'base64');
          } catch (e) {
            console.error('Error parsing base64 image:', e);
            return transparentPixel;
          }
        }

        // 2. Tangani Google Drive ID atau Google Drive URL
        let driveFileId = '';
        if (/^[a-zA-Z0-9_-]{25,55}$/.test(tagValue)) {
          driveFileId = tagValue;
        } else if (tagValue.includes('drive.google.com') || tagValue.includes('id=')) {
          const match = tagValue.match(/\/d\/([a-zA-Z0-9_-]+)/) || tagValue.match(/[?&]id=([a-zA-Z0-9_-]+)/);
          if (match && match[1]) {
            driveFileId = match[1];
          }
        }

        if (driveFileId) {
          try {
            const buffer = await getFileBufferFromDrive(driveFileId);
            if (buffer && buffer.length > 0) {
              return buffer;
            }
          } catch (driveErr) {
            console.warn('Gagal ambil media via Drive API, mencoba fallback ke thumbnail CDN:', driveFileId, driveErr);
            try {
              const thumbUrl = `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w800`;
              const resThumb = await fetch(thumbUrl);
              if (resThumb.ok) {
                const ab = await resThumb.arrayBuffer();
                return Buffer.from(ab);
              }
            } catch (thumbErr) {
              console.error('Fallback thumbnail Drive gagal:', thumbErr);
            }
          }
          return transparentPixel;
        }

        // 3. Tangani standard HTTP/HTTPS URL
        if (tagValue.startsWith('http://') || tagValue.startsWith('https://')) {
          try {
            const res = await fetch(tagValue);
            if (res.ok) {
              const arrayBuffer = await res.arrayBuffer();
              return Buffer.from(arrayBuffer);
            }
          } catch (e) {
            console.error('Gagal fetch URL gambar:', tagValue, e);
          }
        }

        return transparentPixel;
      },
      getSize: function (img: any, tagValue: string, tagName: string) {
        if (!tagValue) return [1, 1]; // pixel kecil jika gambar kosong
        return [320, 220]; // ukuran foto dokumentasi standar Word (lebar 320px, tinggi 220px)
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
      nomor_notadinas: nomor_otomatis,
      tanggal: tanggalFull,
      kegiatan_aduan: kegiatan_aduan || '',
      nama_terlapor: nama_terlapor || '',
      lokasi_aduan: lokasi_aduan || '',
      deskripsi_aduan: deskripsi_aduan || '',
      petugas: petugasArr,
      fotos: Array.isArray(fotos) ? fotos : [],
      catatan_verlap: catatan_verlap || '',
      hasil_verlap: hasil_verlap || ''
    });

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    const safeTerlapor = (nama_terlapor || 'Aduan').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);

    // Return the generated file as response
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="Surat_Tindak_Lanjut_${safeTerlapor}_${nomor_otomatis.replace(/\//g, '_')}.docx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server: ' + error.message }, { status: 500 });
  }
}
