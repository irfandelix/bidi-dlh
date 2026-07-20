import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Ambil Data dari Database (Diurutkan berdasarkan Kode Klasifikasi, lalu Tanggal)
    // 1. Ambil Data dari Database
    const { data: arsip, error } = await supabase
      .from('arsip_masuk')
      .select('*');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Lakukan Natural Sort di JavaScript agar 600.10 muncul setelah 600.4
    arsip.sort((a, b) => {
      const kodeA = a.kode_klasifikasi || '';
      const kodeB = b.kode_klasifikasi || '';
      const cmp = kodeA.localeCompare(kodeB, undefined, { numeric: true, sensitivity: 'base' });
      
      // Jika kode sama, urutkan berdasarkan tanggal
      if (cmp === 0) {
        return new Date(a.tanggal_surat).getTime() - new Date(b.tanggal_surat).getTime();
      }
      return cmp;
    });

    // 2. Siapkan path template Excel
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'template_arsip_masuk.xlsx');

    const workbook = new ExcelJS.Workbook();

    // Cek apakah file template ada
    if (fs.existsSync(templatePath)) {
      await workbook.xlsx.readFile(templatePath);
      const worksheet = workbook.getWorksheet(1); // Ambil sheet pertama

      if (!worksheet) {
        return NextResponse.json({ error: 'Sheet pertama tidak ditemukan di dalam template.' }, { status: 500 });
      }

      // ASUMSI SEMENTARA (Sambil Menunggu Template Asli):
      // - Baris 1 sampai 6 adalah Header
      // - Baris 7 dan seterusnya adalah tempat injeksi data
      const startRow = 7; 

      arsip.forEach((d, index) => {
        const rowNum = startRow + index;
        const row = worksheet.getRow(rowNum);

        const st = d.status_surat || 'Biasa';

        // Ini mapping kolom sesuai susunan standar (A=1, B=2, dst)
        row.getCell(1).value = index + 1; // A: No
        row.getCell(2).value = '-';       // B: Nomor Isi Berkas
        row.getCell(3).value = '-';       // C: Nomor Item
        row.getCell(4).value = d.kode_klasifikasi || '-'; // D: Kode Klasifikasi
        row.getCell(5).value = d.perihal; // E: Uraian
        row.getCell(6).value = d.tanggal_surat; // F: Tanggal
        row.getCell(7).value = d.jumlah || 1; // G: Jumlah
        row.getCell(8).value = st === 'Biasa' ? 'Biasa' : ''; // H: Biasa
        row.getCell(9).value = st === 'Terbatas' ? 'Terbatas' : ''; // I: Terbatas
        row.getCell(10).value = st === 'Rahasia' ? 'Rahasia' : ''; // J: Rahasia
        row.getCell(11).value = st === 'Segera' ? 'Segera' : ''; // K: Segera
        row.getCell(12).value = st === 'Penting' ? 'Penting' : ''; // L: Penting

        row.commit();
      });

      // Menambahkan Blok Tanda Tangan secara Dinamis di akhir tabel
      const lastRow = startRow + arsip.length + 2; 
      
      // Gabungkan kolom H sampai L untuk area tanda tangan agar teksnya rapi di tengah
      worksheet.mergeCells(`H${lastRow}:L${lastRow}`);
      worksheet.getCell(`H${lastRow}`).value = 'Mengetahui';
      worksheet.getCell(`H${lastRow}`).alignment = { horizontal: 'center' };

      worksheet.mergeCells(`H${lastRow + 1}:L${lastRow + 1}`);
      worksheet.getCell(`H${lastRow + 1}`).value = 'Kepala Bidang Perencanaan, Pengaduan Dan Peningkatan Kapasitas Lingkungan Hidup';
      worksheet.getCell(`H${lastRow + 1}`).alignment = { horizontal: 'center', wrapText: true };
      // Atur tinggi baris agar teks jabatan yang panjang bisa terlihat utuh (wrap text)
      worksheet.getRow(lastRow + 1).height = 30; 

      // Baris kosong untuk ruang tanda tangan asli (lastRow + 2, 3, 4)
      
      worksheet.mergeCells(`H${lastRow + 5}:L${lastRow + 5}`);
      worksheet.getCell(`H${lastRow + 5}`).value = 'LUKMAN FARID, S.HUT., M.T';
      worksheet.getCell(`H${lastRow + 5}`).font = { bold: true };
      worksheet.getCell(`H${lastRow + 5}`).alignment = { horizontal: 'center' };

      worksheet.mergeCells(`H${lastRow + 6}:L${lastRow + 6}`);
      worksheet.getCell(`H${lastRow + 6}`).value = 'NIP. 19710426 199903 008';
      worksheet.getCell(`H${lastRow + 6}`).alignment = { horizontal: 'center' };

    } else {
      // Jika template tidak ada, return error informatif
      return NextResponse.json(
        { error: 'File template (template_arsip_masuk.xlsx) belum ditemukan di folder public/templates.' }, 
        { status: 404 }
      );
    }

    // 3. Generate file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // 4. Return sebagai file download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="Export_Surat_Masuk.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error: any) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
