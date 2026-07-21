import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase: any = await createClient();
    const { tanggal } = await request.json();

    if (!tanggal) {
      return NextResponse.json({ error: 'Tanggal wajib diisi' }, { status: 400 });
    }

    const tahun = new Date(tanggal).getFullYear().toString();

    // Cek apakah ada record di tahun yang sama dengan tanggal_nota > tanggal input
    const { data, error, count } = await supabase
      .from('arsip_nota_dinas')
      .select('id', { count: 'exact', head: true })
      .ilike('tanggal_nota', `${tahun}-%`)
      .gt('tanggal_nota', tanggal);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const isBackdate = (count || 0) > 0;

    return NextResponse.json({ isBackdate, count }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
