import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase: any = await createClient();
    const { data } = await request.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
    }

    const payload = data.map((item: any) => {
      // Ekstrak no_urut dari Nomor Otomatis (misal: 600.4.1/015.1/17...) -> ambil 015
      let noUrut = 0;
      if (item.nomor_otomatis) {
        const parts = item.nomor_otomatis.split('/');
        if (parts.length >= 2) {
          // Biasanya formatnya: KODE/URUT.BULAN/... -> kita ambil bagian URUT.BULAN
          const urutBulan = parts[1]; // misal "015.1.7" atau "015.7"
          const urutStr = urutBulan.split('.')[0]; // misal "015"
          const parsed = parseInt(urutStr, 10);
          if (!isNaN(parsed)) {
            noUrut = parsed;
          }
        }
      }

      return {
        nama_nota: item.nama_nota || 'Tanpa Subjek',
        tanggal_nota: item.tanggal_nota || new Date().toISOString().split('T')[0],
        dari_bagian: item.dari_bagian || 'Umum',
        nomor_otomatis: item.nomor_otomatis || '',
        keterangan: item.keterangan || null,
        no_urut: noUrut,
      };
    });

    const { error } = await supabase.from('arsip_nota_dinas').insert(payload);

    if (error) {
      console.error('Import error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Import berhasil', count: payload.length });
  } catch (error: any) {
    console.error('Import exception:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
