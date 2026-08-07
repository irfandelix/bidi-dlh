import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase: any = await createClient();
    
    const { data, error } = await supabase
      .from('pengaduans')
      .select('*')
      .order('created_at', { ascending: false });

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

export async function POST(request: Request) {
  try {
    const supabase: any = await createClient();
    const body = await request.json();
    
    const { perihal, tanggal, dokumentasi_url, ba_url } = body;
    
    if (!perihal) {
      return NextResponse.json({ error: 'Perihal/Judul pengaduan wajib diisi' }, { status: 400 });
    }

    const payload = {
      perihal,
      tanggal: tanggal || new Date().toISOString().split('T')[0],
      dokumentasi_url: dokumentasi_url || null,
      ba_url: ba_url || null
    };

    const { data, error } = await supabase
      .from('pengaduans')
      .insert([payload])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: data[0] }, { status: 201 });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
