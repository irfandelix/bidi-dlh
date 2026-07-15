import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase: any = await createClient();
    
    const { searchParams } = new URL(request.url);
    const tahun = searchParams.get('tahun');

    // Ambil data dari tabel dokumens, diurutkan dari yang terbaru
    let query = supabase.from('dokumens').select('*').order('created_at', { ascending: false });
    
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
