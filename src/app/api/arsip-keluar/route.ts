import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase: any = await createClient();
    
    const { data, error } = await supabase
      .from('arsip_keluar')
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
    
    const { kode_klasifikasi, nomor_surat_keluar, tanggal_surat, tujuan, perihal, file_url } = body;
    
    if (!nomor_surat_keluar || !tanggal_surat || !tujuan || !perihal) {
      return NextResponse.json({ error: 'Data wajib belum lengkap diisi' }, { status: 400 });
    }

    const payload = {
      kode_klasifikasi,
      nomor_surat_keluar,
      tanggal_surat,
      tujuan,
      perihal,
      file_url
    };

    const { data, error } = await supabase
      .from('arsip_keluar')
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
