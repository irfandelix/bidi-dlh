import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('pengaduans')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Data pengaduan tidak ditemukan atau token tidak valid' }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
