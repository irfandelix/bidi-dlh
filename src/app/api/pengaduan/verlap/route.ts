import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase: any = await createClient();
    const body = await request.json();
    
    const { 
      token, 
      catatan_verlap, 
      hasil_verlap, 
      foto_verlap_list
    } = body;
    
    if (!token) {
      return NextResponse.json({ error: 'Token wajib diisi' }, { status: 400 });
    }

    const payload = {
      catatan_verlap,
      hasil_verlap,
      foto_verlap_list,
      status_tahapan: 'Sudah Diverifikasi Lapangan'
    };

    const { data, error } = await supabase
      .from('pengaduans')
      .update(payload)
      .eq('token', token)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Data dengan token tersebut tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ data: data[0] }, { status: 200 });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
