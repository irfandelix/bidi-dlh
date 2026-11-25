import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const [
      { count: suratMasuk },
      { count: suratKeluar },
      { count: notaDinas },
      { count: arsipBidang },
    ] = await Promise.all([
      supabase.from('arsip_masuk').select('*', { count: 'exact', head: true }),
      supabase.from('arsip_keluar').select('*', { count: 'exact', head: true }),
      supabase.from('arsip_nota_dinas').select('*', { count: 'exact', head: true }),
      supabase.from('arsip_kegiatan_bidang').select('*', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      suratMasuk: suratMasuk || 0,
      suratKeluar: suratKeluar || 0,
      notaDinas: notaDinas || 0,
      arsipBidang: arsipBidang || 0,
    });
  } catch (error) {
    console.error('Error fetching arsip stats:', error);
    return NextResponse.json({ error: 'Gagal memuat statistik arsip' }, { status: 500 });
  }
}
