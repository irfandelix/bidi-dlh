import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function GET(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.MOBILE_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized Mobile App' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('bap_pengawasans')
      .select('data_matriks_c, id')
      .eq('pengawasan_id', id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.MOBILE_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized Mobile App' }, { status: 401 });
    }

    const body = await request.json();
    const { agendaDataId, dbBapPayload } = body;
    const supabase = getSupabaseAdmin();

    // 1. Update pengawasan_lapangans to status 'Tindak Lanjut'
    const { error: dbError } = await supabase
      .from('pengawasan_lapangans')
      .update({ status_tahapan: 'Tindak Lanjut' })
      .eq('id', agendaDataId);
    
    if (dbError) throw dbError;

    // 2. Insert or Update bap_pengawasans
    const { data: existingBap, error: checkError } = await supabase
      .from('bap_pengawasans')
      .select('id')
      .eq('pengawasan_id', agendaDataId)
      .maybeSingle();
    
    if (checkError) throw checkError;

    if (existingBap) {
      const { error: updateBapError } = await supabase.from('bap_pengawasans').update(dbBapPayload).eq('id', existingBap.id);
      if (updateBapError) throw updateBapError;
    } else {
      const { error: insertBapError } = await supabase.from('bap_pengawasans').insert(dbBapPayload);
      if (insertBapError) throw insertBapError;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
