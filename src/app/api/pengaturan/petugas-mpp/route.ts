import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    let query = supabase.from('petugas_mpp').select('*').order('urutan_hierarki', { ascending: true });
    
    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error fetching petugas_mpp:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await (supabase.from('petugas_mpp') as any)
      .insert([
        {
          nama: body.nama,
          nip: body.nip || null,
          pangkat_golongan: body.pangkat_golongan || null,
          jabatan_dinas: body.jabatan_dinas || null,
          kategori: body.kategori || null,
          urutan_hierarki: body.urutan_hierarki || 99,
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error('Error inserting petugas_mpp:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
