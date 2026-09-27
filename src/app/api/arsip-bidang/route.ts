import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get('bidi_session')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('arsip_kegiatan_bidang')
      .select('*')
      .order('tanggal_kegiatan', { ascending: false });

    if (error) throw error;
    
    return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error: any) {
    console.error('Error fetching arsip bidang:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get('bidi_session')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('arsip_kegiatan_bidang')
      // @ts-ignore
      .insert([body])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating arsip bidang:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
