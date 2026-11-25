import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';
import type { PermitEntry } from '@/lib/checklist-perizinan';

interface ChecklistRow {
  id: number;
  nama: string;
  jabatan: string;
  nomor_whatsapp: string;
  perusahaan_fasyankes: string;
  daftar_perizinan: PermitEntry[];
  belum_ada_izin: boolean;
  created_at: string;
}

function formatPermitsForExcel(row: ChecklistRow): string {
  if (row.belum_ada_izin || !Array.isArray(row.daftar_perizinan) || row.daftar_perizinan.length === 0) {
    return 'Belum memiliki perizinan';
  }
  return row.daftar_perizinan
    .map((item) => `${item.nama_izin} (${item.tahun})${item.is_manual ? ' [Tambahan]' : ''}`)
    .join('; ');
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get('bidi_session')?.value) {
      return NextResponse.json({ error: 'Tidak memiliki akses.' }, { status: 401 });
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').toLowerCase().trim();

    const { data, error } = await supabase
      .from('checklist_perizinan_mandiri')
      .select('id, nama, jabatan, nomor_whatsapp, perusahaan_fasyankes, daftar_perizinan, belum_ada_izin, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Gagal mengunduh data checklist.' }, { status: 500 });
    }

    let rows = (data || []) as ChecklistRow[];
    if (q) {
      rows = rows.filter((r) => {
        const permitStr = formatPermitsForExcel(r).toLowerCase();
        return (
          r.perusahaan_fasyankes.toLowerCase().includes(q) ||
          r.nama.toLowerCase().includes(q) ||
          r.jabatan.toLowerCase().includes(q) ||
          r.nomor_whatsapp.toLowerCase().includes(q) ||
          permitStr.includes(q)
        );
      });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Checklist Perizinan');

    sheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Waktu Pengisian', key: 'waktu', width: 22 },
      { header: 'Perusahaan / Fasyankes', key: 'perusahaan', width: 32 },
      { header: 'Nama Pengisi', key: 'nama', width: 24 },
      { header: 'Jabatan', key: 'jabatan', width: 24 },
      { header: 'Nomor WhatsApp', key: 'wa', width: 18 },
      { header: 'Jumlah Izin', key: 'jumlah', width: 14 },
      { header: 'Rincian Perizinan & Tahun Terbit', key: 'rincian', width: 55 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F766E' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
    headerRow.height = 26;

    rows.forEach((r, idx) => {
      const waktu = new Date(r.created_at).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Jakarta',
      });
      const permitCount = r.belum_ada_izin || !Array.isArray(r.daftar_perizinan) ? 0 : r.daftar_perizinan.length;
      sheet.addRow({
        no: idx + 1,
        waktu,
        perusahaan: r.perusahaan_fasyankes,
        nama: r.nama,
        jabatan: r.jabatan,
        wa: r.nomor_whatsapp,
        jumlah: permitCount,
        rincian: formatPermitsForExcel(r),
      });
    });

    sheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        };
        if (rowNumber > 1) {
          cell.alignment = { vertical: 'top', wrapText: true };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const dateStamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Rekap_Checklist_Perizinan_${dateStamp}.xlsx"`,
      },
    });
  } catch (err) {
    console.error('GET /api/export/checklist-perizinan exception:', err);
    return NextResponse.json({ error: 'Gagal membuat file Excel.' }, { status: 500 });
  }
}
