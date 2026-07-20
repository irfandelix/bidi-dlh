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

    const dataArsip = (arsip as any[]) || [];
    // Lakukan Natural Sort di JavaScript agar 600.10 muncul setelah 600.4
    dataArsip.sort((a, b) => {
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

      dataArsip.forEach((d: any, index: number) => {
        const rowNum = startRow + index;
        const row = worksheet.getRow(rowNum);

        const st = d.status_surat || 'Biasa';

        // Menyesuaikan mapping kolom dari template (berdasarkan screenshot)
        // A=1(No), B=2(Isi), C=3(Item), D=4(Kode), H=8(Uraian), I=9(Tanggal), J=10(Jumlah)
        // K=11(Biasa), L=12(Terbatas), M=13(Rahasia), N=14(Segera), O=15(Penting)
        row.getCell(1).value = index + 1; // A: Nomor Berkas
        row.getCell(2).value = '-';       // B: Nomor Isi Berkas
        row.getCell(3).value = '-';       // C: Nomor Item
        // Kode Klasifikasi ditaruh di D (kolom 4) 
        row.getCell(4).value = d.kode_klasifikasi || '-'; 
        
        row.getCell(8).value = d.perihal; // H: Uraian Informasi Berkas
        row.getCell(9).value = d.tanggal_surat; // I: Tanggal
        row.getCell(10).value = d.jumlah || 1; // J: Jumlah
        
        row.getCell(11).value = st === 'Biasa' ? 'Biasa' : ''; // K: Biasa
        row.getCell(12).value = st === 'Terbatas' ? 'Terbatas' : ''; // L: Terbatas
        row.getCell(13).value = st === 'Rahasia' ? 'Rahasia' : ''; // M: Rahasia
        row.getCell(14).value = st === 'Segera' ? 'Segera' : ''; // N: Segera
        row.getCell(15).value = st === 'Penting' ? 'Penting' : ''; // O: Penting

        row.commit();
      });

      // Menambahkan Blok Tanda Tangan secara Dinamis di akhir tabel
      const lastRow = startRow + dataArsip.length + 2; 
      
      // Tanda tangan diletakkan di sebelah kanan (Kolom K sampai O / Keterangan)
      worksheet.mergeCells(`K${lastRow}:O${lastRow}`);
      worksheet.getCell(`K${lastRow}`).value = 'Mengetahui,';
      worksheet.getCell(`K${lastRow}`).alignment = { horizontal: 'center' };

      worksheet.mergeCells(`K${lastRow + 1}:O${lastRow + 1}`);
      worksheet.getCell(`K${lastRow + 1}`).value = 'Kepala Bidang Perencanaan, Pengaduan Dan Peningkatan Kapasitas Lingkungan Hidup';
      worksheet.getCell(`K${lastRow + 1}`).alignment = { horizontal: 'center', wrapText: true };
      worksheet.getRow(lastRow + 1).height = 30; 

      // Baris kosong untuk tanda tangan
      
      worksheet.mergeCells(`K${lastRow + 5}:O${lastRow + 5}`);
      worksheet.getCell(`K${lastRow + 5}`).value = 'LUKMAN FARID, S.HUT., M.T';
      worksheet.getCell(`K${lastRow + 5}`).font = { bold: true };
      worksheet.getCell(`K${lastRow + 5}`).alignment = { horizontal: 'center' };

      worksheet.mergeCells(`K${lastRow + 6}:O${lastRow + 6}`);
      worksheet.getCell(`K${lastRow + 6}`).value = 'NIP. 19710426 199903 008';
      worksheet.getCell(`K${lastRow + 6}`).alignment = { horizontal: 'center' };

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
