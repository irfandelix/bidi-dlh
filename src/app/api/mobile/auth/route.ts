import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the Service Role Key to bypass RLS
const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.MOBILE_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized Mobile App' }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const formattedToken = token.trim().toUpperCase();

    // 1. Check pengawasan_lapangans
    let { data, error } = await supabase
      .from('pengawasan_lapangans')
      .select('*')
      .eq('token', formattedToken)
      .maybeSingle();

    let tipe = 'pengawasan';

    // 2. Check pengaduans if not found
    if (!data) {
      const { data: aduanData, error: aduanError } = await supabase
        .from('pengaduans')
        .select('*')
        .eq('token', formattedToken)
        .maybeSingle();
      
      if (aduanError) {
        return NextResponse.json({ error: aduanError.message }, { status: 500 });
      }
      if (aduanData) {
        data = aduanData;
        tipe = 'pengaduan';
      }
    }

    if (!data) {
      return NextResponse.json({ error: 'Token tidak valid atau tidak ditemukan' }, { status: 404 });
    }

    data._bidi_type = tipe;
    
    return NextResponse.json({ data }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
