import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Ambil Data dari Database (Diurutkan berdasarkan Kode Klasifikasi, lalu Tanggal)
    const { data: arsip, error } = await supabase
      .from('arsip_masuk')
      .select('*')
      .order('kode_klasifikasi', { ascending: true })
      .order('tanggal_surat', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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
        row.getCell(8).value = st === 'Biasa' ? 'v' : ''; // H: Biasa
        row.getCell(9).value = st === 'Terbatas' ? 'v' : ''; // I: Terbatas
        row.getCell(10).value = st === 'Rahasia' ? 'v' : ''; // J: Rahasia
        row.getCell(11).value = st === 'Segera' ? 'v' : ''; // K: Segera
        row.getCell(12).value = st === 'Penting' ? 'v' : ''; // L: Penting

        row.commit();
      });

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
