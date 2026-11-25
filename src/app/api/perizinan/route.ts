import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase: any = await createClient();
    
    const { searchParams } = new URL(request.url);
    const tahun = searchParams.get('tahun');
    const mode = searchParams.get('mode');

    const columns =
      mode === 'map'
        ? 'id, nama_kegiatan, nama_pemrakarsa, lokasi_kegiatan, jenis_dokumen, tahun, latitude, longitude, status_tahapan'
        : mode === 'summary'
          ? 'id, no_urut, tahun, nama_kegiatan, nama_pemrakarsa, status_tahapan, jenis_dokumen, created_at'
          : '*';

    let query = supabase
      .from('dokumens')
      .select(columns)
      .order('tahun', { ascending: false })
      .order('no_urut', { ascending: false });

    if (mode === 'map') {
      query = query.not('latitude', 'is', null).not('longitude', 'is', null).neq('latitude', '').neq('longitude', '');
    }

    if (tahun) {
      query = query.eq('tahun', tahun);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { ids, paket_nama } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Pilih minimal satu dokumen' }, { status: 400 });
    }

    const supabase: any = await createClient();
    const cleanName = typeof paket_nama === 'string' && paket_nama.trim() ? paket_nama.trim() : null;

    const { error } = await supabase
      .from('dokumens')
      .update({ paket_nama: cleanName })
      .in('id', ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, paket_nama: cleanName });
  } catch (error: any) {
    console.error('PATCH /api/perizinan error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
