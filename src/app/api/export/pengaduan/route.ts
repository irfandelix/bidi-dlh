import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import ExcelJS from 'exceljs';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get('bidi_session')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase: any = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'semua';
    const tahun = searchParams.get('tahun') || 'Semua';
    const q = (searchParams.get('q') || '').toLowerCase().trim();

    // 1. Ambil seluruh data pengaduan
    const { data: rawData, error } = await supabase
      .from('pengaduans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error saat export pengaduan:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let list = (rawData as any[]) || [];

    // 2. Filter data
    list = list.filter(item => {
      // Filter Status
      if (status !== 'semua') {
        const isSelesai = !!item.ba_url || item.status_tahapan === 'Selesai' || item.status_tahapan === 'BA Selesai';
        const isTerisi = (item.status_tahapan === 'Form Terisi' || item.status_tahapan?.includes('Verifikasi') || !!item.nama_pelapor) && !item.ba_url;
        const isMenunggu = item.status_tahapan === 'Menunggu Isian' || (!item.nama_pelapor && !item.ba_url);

        if (status === 'selesai' && !isSelesai) return false;
        if ((status === 'terisi' || status === 'verlap') && !isTerisi) return false;
        if (status === 'menunggu' && !isMenunggu) return false;
      }

      // Filter Tahun
      const dateStr = item.tanggal || item.created_at || '';
      if (tahun !== 'Semua' && dateStr) {
        if (!dateStr.startsWith(tahun)) return false;
      }

      // Filter Search Query
      if (q) {
        const matchPerihal = (item.perihal || '').toLowerCase().includes(q);
        const matchPelapor = (item.nama_pelapor || '').toLowerCase().includes(q);
        const matchTerlapor = (item.nama_terlapor || '').toLowerCase().includes(q);
        const matchLokasi = (item.lokasi_aduan || '').toLowerCase().includes(q);
        const matchToken = (item.token || '').toLowerCase().includes(q);
        const matchNota = (item.nomor_nota_dinas || '').toLowerCase().includes(q);
        const matchHp = (item.no_hp || item.telepon || item.telp_pelapor || '').toLowerCase().includes(q);
        if (!matchPerihal && !matchPelapor && !matchTerlapor && !matchLokasi && !matchToken && !matchNota && !matchHp) {
          return false;
        }
      }

      return true;
    });

    // 3. Bangun Dokumen Excel dengan ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BIDI DLH Kabupaten Sragen';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Rekapitulasi Pengaduan', {
      views: [{ showGridLines: true }],
      pageSetup: { orientation: 'landscape', paperSize: 9 }
    });

    // Kop Judul Dokumen Resmi
    worksheet.mergeCells('A1:L1');
    worksheet.getCell('A1').value = 'PEMERINTAH KABUPATEN SRAGEN';
    worksheet.getCell('A1').font = { name: 'Arial', size: 11, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A2:L2');
    worksheet.getCell('A2').value = 'DINAS LINGKUNGAN HIDUP';
    worksheet.getCell('A2').font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF065F46' } };
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A3:L3');
    worksheet.getCell('A3').value = 'REKAPITULASI LAPORAN PENGADUAN PENCEMARAN / PERUSAKAN LINGKUNGAN HIDUP';
    worksheet.getCell('A3').font = { name: 'Arial', size: 12, bold: true };
    worksheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A4:L4');
    const subtitleTahun = tahun !== 'Semua' ? `TAHUN ${tahun}` : `TAHUN ${new Date().getFullYear()}`;
    const subtitleStatus = status !== 'semua' ? ` | STATUS: ${status.toUpperCase()}` : '';
    worksheet.getCell('A4').value = `KABUPATEN SRAGEN - ${subtitleTahun}${subtitleStatus}`;
    worksheet.getCell('A4').font = { name: 'Arial', size: 10, italic: true };
    worksheet.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };

    // Header Kolom Tabel (Baris 6)
    const headerRowIndex = 6;
    const headers = [
      { key: 'no', title: 'NO', width: 6 },
      { key: 'token', title: 'NO. TIKET (TOKEN)', width: 16 },
      { key: 'tanggal', title: 'TANGGAL LAPOR', width: 18 },
      { key: 'perihal', title: 'PERIHAL DUGAAN PENCEMARAN', width: 34 },
      { key: 'pelapor', title: 'NAMA PELAPOR', width: 22 },
      { key: 'kontak', title: 'NO. TELP / WA', width: 16 },
      { key: 'terlapor', title: 'PIHAK TERLAPOR', width: 24 },
      { key: 'lokasi', title: 'LOKASI / KECAMATAN', width: 30 },
      { key: 'status', title: 'STATUS PENANGANAN', width: 22 },
      { key: 'nomor_nota', title: 'NO. NOTA DINAS / SURAT', width: 28 },
      { key: 'tgl_verlap', title: 'STATUS DOKUMEN BA', width: 20 },
      { key: 'catatan', title: 'HASIL VERLAP / TINDAK LANJUT', width: 36 }
    ];

    const headerRow = worksheet.getRow(headerRowIndex);
    headerRow.height = 26;

    headers.forEach((h, idx) => {
      const colNum = idx + 1;
      const cell = headerRow.getCell(colNum);
      cell.value = h.title;
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF065F46' } // Emerald 800
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF043F2E' } },
        bottom: { style: 'medium', color: { argb: 'FF043F2E' } },
        left: { style: 'thin', color: { argb: 'FF043F2E' } },
        right: { style: 'thin', color: { argb: 'FF043F2E' } }
      };
      worksheet.getColumn(colNum).width = h.width;
    });

    // Injeksi Data Baris
    let currentRowIndex = headerRowIndex + 1;
    let countSelesai = 0;
    let countVerlap = 0;
    let countMenunggu = 0;

    list.forEach((item, index) => {
      const row = worksheet.getRow(currentRowIndex);
      row.height = 24;

      // Status text normalization
      const isSelesai = !!item.ba_url || item.status_tahapan === 'Selesai' || item.status_tahapan === 'BA Selesai';
      const isTerisi = (item.status_tahapan === 'Form Terisi' || item.status_tahapan?.includes('Verifikasi') || !!item.nama_pelapor) && !item.ba_url;
      
      let statusLabel = 'Menunggu Isian';
      if (isSelesai) {
        statusLabel = 'Selesai Ditindaklanjuti';
        countSelesai++;
      } else if (isTerisi) {
        statusLabel = item.status_tahapan || 'Sudah Diverifikasi Lapangan';
        countVerlap++;
      } else {
        countMenunggu++;
      }

      // Format Tanggal
      const rawDate = item.tanggal || item.created_at;
      const tglFormatted = rawDate 
        ? new Date(rawDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
        : '-';

      const rowValues = [
        index + 1,
        item.token || '-',
        tglFormatted,
        item.perihal || '-',
        item.nama_pelapor || 'Masyarakat (Anonim)',
        item.no_hp || item.telepon || item.telp_pelapor || '-',
        item.nama_terlapor || '-',
        item.lokasi_aduan || '-',
        statusLabel,
        item.nomor_nota_dinas || '-',
        item.ba_url ? 'BA Selesai Terbit' : 'Belum Ada BA',
        item.hasil_verlap || item.catatan_verlap || item.deskripsi || '-'
      ];

      const isEven = index % 2 === 1;

      rowValues.forEach((val, idx) => {
        const colNum = idx + 1;
        const cell = row.getCell(colNum);
        cell.value = val;
        cell.font = { name: 'Arial', size: 9 };
        
        // Background striping
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFF8FAFC' : 'FFFFFFFF' }
        };

        // Alignment per kolom
        if ([1, 2, 3, 6, 9, 10, 11].includes(colNum)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        }

        // Highlight Status Penanganan
        if (colNum === 9) {
          if (isSelesai) {
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF065F46' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
          } else if (isTerisi) {
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF92400E' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
          } else {
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF1E40AF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
          }
        }

        // Border tipis
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });

      row.commit();
      currentRowIndex++;
    });

    // 4. Baris Rekapitulasi Statistik di Bawah Tabel
    currentRowIndex += 1;
    const statStartRow = currentRowIndex;

    worksheet.mergeCells(`B${statStartRow}:D${statStartRow}`);
    worksheet.getCell(`B${statStartRow}`).value = 'RINGKASAN REKAPITULASI:';
    worksheet.getCell(`B${statStartRow}`).font = { name: 'Arial', size: 9, bold: true };

    const stats = [
      { label: 'Total Pengaduan Masuk', val: list.length },
      { label: 'Selesai Ditindaklanjuti / Ada BA', val: countSelesai },
      { label: 'Proses Verifikasi Lapangan (Verlap)', val: countVerlap },
      { label: 'Menunggu Pengisian / Tiket Baru', val: countMenunggu }
    ];

    stats.forEach((st, idx) => {
      const r = statStartRow + 1 + idx;
      worksheet.mergeCells(`B${r}:C${r}`);
      worksheet.getCell(`B${r}`).value = `• ${st.label}`;
      worksheet.getCell(`B${r}`).font = { name: 'Arial', size: 9 };
      worksheet.getCell(`D${r}`).value = `${st.val} Aduan`;
      worksheet.getCell(`D${r}`).font = { name: 'Arial', size: 9, bold: true };
      worksheet.getCell(`D${r}`).alignment = { horizontal: 'right' };
    });

    // 5. Tanda Tangan Kanan Bawah
    const ttdRow = statStartRow + 1;
    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    worksheet.mergeCells(`H${ttdRow}:L${ttdRow}`);
    worksheet.getCell(`H${ttdRow}`).value = `Sragen, ${todayStr}`;
    worksheet.getCell(`H${ttdRow}`).font = { name: 'Arial', size: 9 };
    worksheet.getCell(`H${ttdRow}`).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`H${ttdRow + 1}:L${ttdRow + 1}`);
    worksheet.getCell(`H${ttdRow + 1}`).value = 'Mengetahui,';
    worksheet.getCell(`H${ttdRow + 1}`).font = { name: 'Arial', size: 9 };
    worksheet.getCell(`H${ttdRow + 1}`).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`H${ttdRow + 2}:L${ttdRow + 2}`);
    worksheet.getCell(`H${ttdRow + 2}`).value = 'Kepala Bidang Pengendalian Pencemaran dan';
    worksheet.getCell(`H${ttdRow + 2}`).font = { name: 'Arial', size: 9, bold: true };
    worksheet.getCell(`H${ttdRow + 2}`).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`H${ttdRow + 3}:L${ttdRow + 3}`);
    worksheet.getCell(`H${ttdRow + 3}`).value = 'Pengaduan Lingkungan Hidup';
    worksheet.getCell(`H${ttdRow + 3}`).font = { name: 'Arial', size: 9, bold: true };
    worksheet.getCell(`H${ttdRow + 3}`).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`H${ttdRow + 7}:L${ttdRow + 7}`);
    worksheet.getCell(`H${ttdRow + 7}`).value = 'Dinas Lingkungan Hidup Kabupaten Sragen';
    worksheet.getCell(`H${ttdRow + 7}`).font = { name: 'Arial', size: 9, bold: true, underline: true };
    worksheet.getCell(`H${ttdRow + 7}`).alignment = { horizontal: 'center' };

    // 6. Generate Buffer Excel & Kembalikan Respons
    const buffer = await workbook.xlsx.writeBuffer();
    const safeDate = new Date().toISOString().split('T')[0];
    const filename = `Rekapitulasi_Pengaduan_DLH_${safeDate}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error: any) {
    console.error('API Error saat generate Excel pengaduan:', error);
    return NextResponse.json({ error: 'Gagal men-generate berkas Excel pengaduan: ' + error.message }, { status: 500 });
  }
}
