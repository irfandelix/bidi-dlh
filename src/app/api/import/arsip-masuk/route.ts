import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import ExcelJS from 'exceljs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = new ExcelJS.Workbook();
    // Gunakan xlsx.load untuk file excel biasa
    // Tapi karena user mungkin upload CSV (dari google sheet download), kita perlu antisipasi
    const filename = file.name.toLowerCase();
    
    if (filename.endsWith('.csv')) {
      // exceljs butuh stream untuk read csv, tapi kita bisa pakai trick ini:
      // Karena kita punya buffer, lebih baik kita paksa parse sebagai csv
      // workbook.csv.read(stream) -> Tapi kita di Edge/Serverless Next.js (tidak punya native stream)
      // Kita pakai CSV parse manual atau biarkan exceljs handle buffer jika mendukung
    }
    
    // Kita anggap user mengunggah .xlsx asli sesuai format template mereka (bukan CSV).
    // Karena CSV tadi hanya dari trik google sheets export url saya.
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0]; // Ambil sheet pertama

    const supabase: any = await createClient();
    const payloads: any[] = [];

    // Map nama bulan bahasa Indonesia ke angka bulan
    const monthMap: Record<string, string> = {
      'januari': '01', 'februari': '02', 'maret': '03', 'april': '04',
      'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08',
      'september': '09', 'oktober': '10', 'november': '11', 'desember': '12'
    };

    const parseIndonesianDate = (dateStr: string | null) => {
      if (!dateStr) return new Date().toISOString().split('T')[0];
      const str = dateStr.toString().trim().toLowerCase();
      // Format ex: "02 januari 2026"
      const parts = str.split(' ');
      if (parts.length >= 3) {
        const day = parts[0].padStart(2, '0');
        const monthStr = parts[1];
        const year = parts[2];
        const monthNum = monthMap[monthStr] || '01';
        return `${year}-${monthNum}-${day}`;
      }
      return new Date().toISOString().split('T')[0];
    };

    worksheet.eachRow((row, rowNumber) => {
      // Kita anggap baris data jika Kolom A adalah sebuah angka
      const colA = row.getCell(1).value;
      
      // Bisa jadi string atau angka
      let isDataRow = false;
      if (typeof colA === 'number') {
        isDataRow = true;
      } else if (typeof colA === 'string' && !isNaN(parseInt(colA.trim(), 10))) {
        isDataRow = true;
      }

      if (isDataRow) {
        // Ambil Kode Klasifikasi (gabungan Kolom D, E, F, G sesuai format Excel)
        const d = row.getCell(4).value;
        const e = row.getCell(5).value;
        const f = row.getCell(6).value;
        const g = row.getCell(7).value;

        let kodeStr = '';
        if (d !== null && d !== undefined && d !== '') kodeStr += d;
        if (e !== null && e !== undefined && e !== '') kodeStr += '.' + e;
        if (f !== null && f !== undefined && f !== '') kodeStr += '.' + f;
        if (g !== null && g !== undefined && g !== '') kodeStr += '.' + g;

        if (!kodeStr) {
            // Coba ambil satu sel D saja jika nyatanya merge jadi 1 (di beberapa template)
            const singleVal = row.getCell(4).value;
            if (singleVal) kodeStr = singleVal.toString();
        }

        const perihalCell = row.getCell(8).value;
        let uraian = perihalCell ? perihalCell.toString().trim() : '-';
        let asalSurat = '-';

        // Ekstrak Asal Surat dari kata pertama Uraian (contoh: "DPMPTSP Permohonan...")
        if (uraian !== '-' && uraian.includes(' ')) {
          const uraianParts = uraian.split(' ');
          asalSurat = uraianParts[0].trim();
          uraian = uraianParts.slice(1).join(' ').trim();
        }

        const tanggalCell = row.getCell(9).value;
        // ExcelJS kadang menerjemahkan tanggal asli Excel sebagai object Date, kadang string
        let tglStr = '';
        if (tanggalCell instanceof Date) {
          tglStr = tanggalCell.toISOString().split('T')[0];
        } else {
          tglStr = parseIndonesianDate(tanggalCell as string);
        }

        // Jumlah dari J
        const jumlahCell = row.getCell(10).value;
        let jumlah = 1;
        if (jumlahCell) {
          const numMatch = jumlahCell.toString().match(/\d+/);
          if (numMatch) {
            jumlah = parseInt(numMatch[0], 10);
          }
        }

        // Status Surat dari kolom Biasa(11), Terbatas(12), Rahasia(13), Segera(14), Penting(15)
        let statusSurat = 'Biasa';
        if (row.getCell(15).value) statusSurat = 'Penting';
        else if (row.getCell(14).value) statusSurat = 'Segera';
        else if (row.getCell(13).value) statusSurat = 'Rahasia';
        else if (row.getCell(12).value) statusSurat = 'Terbatas';

        payloads.push({
          kode_klasifikasi: kodeStr || '-',
          nomor_surat_masuk: '-', // Tidak ada di excel, isi default
          tanggal_surat: tglStr,
          tanggal_terima: tglStr, // Default ke tgl surat
          asal_surat: asalSurat, // Otomatis diekstrak dari kata pertama Uraian
          perihal: uraian,
          jumlah: jumlah,
          status_surat: statusSurat
        });
      }
    });

    if (payloads.length === 0) {
      return NextResponse.json({ error: 'Tidak ada baris data valid yang ditemukan (Pastikan kolom A berisi angka urut)' }, { status: 400 });
    }

    // Insert ke database (bulk)
    const { error } = await supabase
      .from('arsip_masuk')
      .insert(payloads);

    if (error) {
      console.error('Supabase bulk insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Success', count: payloads.length }, { status: 201 });

  } catch (error: any) {
    console.error('API Import error:', error);
    return NextResponse.json({ error: 'Gagal memproses file Excel. Pastikan file berformat .xlsx' }, { status: 500 });
  }
}
