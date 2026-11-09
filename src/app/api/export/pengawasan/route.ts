import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import ExcelJS from 'exceljs';

function formatTimTugas(tim: any): string {
  if (!tim) return '-';
  if (Array.isArray(tim)) return tim.join(', ');
  if (typeof tim === 'string') {
    try {
      const parsed = JSON.parse(tim);
      if (Array.isArray(parsed)) return parsed.join(', ');
    } catch {}
    if (tim.includes('|')) {
      return tim.split('|').map(s => s.trim()).filter(Boolean).join(', ');
    }
    return tim;
  }
  return String(tim);
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get('bidi_session')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const kategori = searchParams.get('kategori') || 'Semua';
    const status = searchParams.get('status') || 'Semua';
    const tahun = searchParams.get('tahun') || 'Semua';
    const q = (searchParams.get('q') || '').toLowerCase().trim();

    // 1. Ambil data pengawasan lengkap beserta BAP
    const { data: rawData, error } = await supabase
      .from('pengawasan_lapangans')
      .select('*, bap_pengawasans(*)')
      .order('tanggal_kunjungan', { ascending: false });

    if (error) {
      console.error('Supabase error saat export pengawasan:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let list = (rawData as any[]) || [];

    // 2. Filter data
    list = list.filter(item => {
      // Filter Kategori
      if (kategori !== 'Semua') {
        const itemKat = (item.kategori || '').toLowerCase();
        if (kategori === 'Lainnya') {
          const standardKats = ['fasyankes', 'industri', 'perumahan', 'toko modern', 'sppg'];
          if (standardKats.includes(itemKat)) return false;
        } else if (itemKat !== kategori.toLowerCase()) {
          return false;
        }
      }

      // Filter Status Ketaatan
      if (status !== 'Semua') {
        const hasBap = Array.isArray(item.bap_pengawasans) && item.bap_pengawasans.length > 0;
        const itemStatus = (item.status_ketaatan || item.bap_pengawasans?.[0]?.status_ketaatan || '').toLowerCase();

        if (status === 'selesai' && !hasBap) return false;
        if (status === 'agenda' && hasBap) return false;
        if (status === 'taat' && !itemStatus.includes('taat')) return false;
        if (status === 'tidak_taat' && !itemStatus.includes('tidak')) return false;
      }

      // Filter Tahun
      if (tahun !== 'Semua' && item.tanggal_kunjungan) {
        if (!item.tanggal_kunjungan.startsWith(tahun)) return false;
      }

      // Filter Search Query
      if (q) {
        const matchNama = (item.nama_kegiatan || '').toLowerCase().includes(q);
        const matchPem = (item.nama_pemrakarsa || '').toLowerCase().includes(q);
        const matchAlamat = (item.alamat_lokasi || '').toLowerCase().includes(q);
        const matchTim = (item.tim_tugas || '').toLowerCase().includes(q);
        const matchNota = (item.nomor_nota_dinas || '').toLowerCase().includes(q);
        const matchToken = (item.token || '').toLowerCase().includes(q);
        if (!matchNama && !matchPem && !matchAlamat && !matchTim && !matchNota && !matchToken) {
          return false;
        }
      }

      return true;
    });

    // 3. Bangun Dokumen Excel dengan ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BIDI DLH Kabupaten Sragen';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Rekapitulasi Pengawasan', {
      views: [{ showGridLines: true }],
      pageSetup: { orientation: 'landscape', paperSize: 9 }
    });

    // Kop Judul Dokumen
    worksheet.mergeCells('A1:L1');
    worksheet.getCell('A1').value = 'PEMERINTAH KABUPATEN SRAGEN';
    worksheet.getCell('A1').font = { name: 'Arial', size: 11, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A2:L2');
    worksheet.getCell('A2').value = 'DINAS LINGKUNGAN HIDUP';
    worksheet.getCell('A2').font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF065F46' } };
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A3:L3');
    worksheet.getCell('A3').value = 'REKAPITULASI LAPORAN PENGAWASAN KETAATAN LINGKUNGAN HIDUP';
    worksheet.getCell('A3').font = { name: 'Arial', size: 12, bold: true };
    worksheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A4:L4');
    const subtitleTahun = tahun !== 'Semua' ? `TAHUN ${tahun}` : `TAHUN ${new Date().getFullYear()}`;
    const subtitleFilter = kategori !== 'Semua' ? ` | KATEGORI: ${kategori.toUpperCase()}` : '';
    worksheet.getCell('A4').value = `KABUPATEN SRAGEN - ${subtitleTahun}${subtitleFilter}`;
    worksheet.getCell('A4').font = { name: 'Arial', size: 10, italic: true };
    worksheet.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };

    // Header Kolom Tabel (Baris 6)
    const headerRowIndex = 6;
    const headers = [
      { key: 'no', title: 'NO', width: 6 },
      { key: 'tanggal', title: 'TANGGAL KUNJUNGAN', width: 18 },
      { key: 'nama_kegiatan', title: 'NAMA USAHA / KEGIATAN', width: 34 },
      { key: 'pemrakarsa', title: 'PENANGGUNG JAWAB / PEMRAKARSA', width: 30 },
      { key: 'kategori', title: 'KATEGORI', width: 16 },
      { key: 'alamat', title: 'LOKASI / ALAMAT', width: 36 },
      { key: 'tim_tugas', title: 'TIM PENGAWAS DLH', width: 32 },
      { key: 'status_ketaatan', title: 'STATUS KETAATAN', width: 18 },
      { key: 'total_skor', title: 'SKOR', width: 10 },
      { key: 'nomor_bap', title: 'NO. BAP', width: 24 },
      { key: 'nomor_nota_dinas', title: 'NO. NOTA DINAS', width: 28 },
      { key: 'status_bap', title: 'STATUS DOKUMEN', width: 18 }
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

    // Injeksi Data (Mulai Baris 7)
    let currentRowIndex = headerRowIndex + 1;
    let countTaat = 0;
    let countKurangTaat = 0;
    let countTidakTaat = 0;
    let countBelumDinilai = 0;

    list.forEach((item, index) => {
      const row = worksheet.getRow(currentRowIndex);
      row.height = 24;

      const bap = Array.isArray(item.bap_pengawasans) && item.bap_pengawasans.length > 0 
        ? item.bap_pengawasans[0] 
        : null;

      // Status ketaatan
      let statusKetaatan = item.status_ketaatan || bap?.status_ketaatan || '';
      if (!statusKetaatan) {
        statusKetaatan = bap ? 'Belum Dinilai' : 'Terjadwal (Belum BAP)';
        countBelumDinilai++;
      } else {
        const lowerSt = statusKetaatan.toLowerCase();
        if (lowerSt.includes('tidak')) countTidakTaat++;
        else if (lowerSt.includes('kurang')) countKurangTaat++;
        else countTaat++;
      }

      // Tanggal format
      const tglFormatted = item.tanggal_kunjungan 
        ? new Date(item.tanggal_kunjungan).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
        : '-';

      const rowValues = [
        index + 1,
        tglFormatted,
        item.nama_kegiatan || '-',
        item.nama_pemrakarsa || '-',
        item.kategori || '-',
        item.alamat_lokasi || '-',
        formatTimTugas(item.tim_tugas),
        statusKetaatan,
        bap?.total_skor !== null && bap?.total_skor !== undefined ? `${bap.total_skor}%` : '-',
        bap?.nomor_bap || item.token || '-',
        item.nomor_nota_dinas || '-',
        bap ? 'BAP Terbit' : 'Agenda Terjadwal'
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
        if ([1, 2, 5, 8, 9, 10, 12].includes(colNum)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        }

        // Highlight Status Ketaatan
        if (colNum === 8) {
          const lower = String(val).toLowerCase();
          if (lower.includes('tidak')) {
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF991B1B' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          } else if (lower.includes('kurang')) {
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF92400E' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
          } else if (lower.includes('taat')) {
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF065F46' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
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
      { label: 'Total Usaha/Kegiatan Diawasi', val: list.length },
      { label: 'Jumlah Taat', val: countTaat },
      { label: 'Jumlah Kurang Taat', val: countKurangTaat },
      { label: 'Jumlah Tidak Taat', val: countTidakTaat },
      { label: 'Belum Dinilai / Terjadwal', val: countBelumDinilai }
    ];

    stats.forEach((st, idx) => {
      const r = statStartRow + 1 + idx;
      worksheet.mergeCells(`B${r}:C${r}`);
      worksheet.getCell(`B${r}`).value = `• ${st.label}`;
      worksheet.getCell(`B${r}`).font = { name: 'Arial', size: 9 };
      worksheet.getCell(`D${r}`).value = `${st.val} Kegiatan`;
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
    worksheet.getCell(`H${ttdRow + 2}`).value = 'Kepala Bidang Perencanaan, Pengaduan dan';
    worksheet.getCell(`H${ttdRow + 2}`).font = { name: 'Arial', size: 9, bold: true };
    worksheet.getCell(`H${ttdRow + 2}`).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`H${ttdRow + 3}:L${ttdRow + 3}`);
    worksheet.getCell(`H${ttdRow + 3}`).value = 'Peningkatan Kapasitas Lingkungan Hidup';
    worksheet.getCell(`H${ttdRow + 3}`).font = { name: 'Arial', size: 9, bold: true };
    worksheet.getCell(`H${ttdRow + 3}`).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`H${ttdRow + 7}:L${ttdRow + 7}`);
    worksheet.getCell(`H${ttdRow + 7}`).value = 'Dinas Lingkungan Hidup Kabupaten Sragen';
    worksheet.getCell(`H${ttdRow + 7}`).font = { name: 'Arial', size: 9, bold: true, underline: true };
    worksheet.getCell(`H${ttdRow + 7}`).alignment = { horizontal: 'center' };

    // 6. Tulis Buffer dan Kembalikan sebagai Response
    const buffer = await workbook.xlsx.writeBuffer();
    const safeDate = new Date().toISOString().split('T')[0];
    const filename = `Rekapitulasi_Pengawasan_DLH_${safeDate}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error: any) {
    console.error('API Error saat generate Excel pengawasan:', error);
    return NextResponse.json({ error: 'Gagal men-generate berkas Excel: ' + error.message }, { status: 500 });
  }
}
