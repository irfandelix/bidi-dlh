import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase: any = await createClient();
    const { data, error } = await supabase.from('anggota_bidang').select('*');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Sort numerically on backend since column might be text
    const sortedData = data.sort((a: any, b: any) => {
      const hA = parseInt(a.hierarki) || 999;
      const hB = parseInt(b.hierarki) || 999;
      return hA - hB;
    });

    return NextResponse.json({ data: sortedData }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase: any = await createClient();
    const body = await request.json();
    const { nama, nip, jabatan, hierarki } = body;

    if (!nama) {
      return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('anggota_bidang')
      .insert([
        { nama, nip, jabatan, hierarki }
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
