import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase: any = await createClient();
    const body = await request.json();
    
    const { 
      id,
      nama_pelapor, 
      telp_pelapor, 
      nama_terlapor, 
      lokasi_aduan, 
      deskripsi,
      dokumentasi_url 
    } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID Pengaduan tidak valid' }, { status: 400 });
    }

    const payload = {
      nama_pelapor,
      telp_pelapor,
      nama_terlapor,
      lokasi_aduan,
      deskripsi,
      dokumentasi_url,
      status_tahapan: 'Form Diisi Pelapor'
    };

    const { data, error } = await supabase
      .from('pengaduans')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: data[0] }, { status: 200 });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
