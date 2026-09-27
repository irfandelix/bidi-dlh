import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get('bidi_session')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Unwrap params in Next 15
    const unwrappedParams = await params;

    const { error } = await supabaseAdmin
      .from('arsip_kegiatan_bidang')
      .delete()
      .eq('id', unwrappedParams.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting arsip:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get('bidi_session')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Unwrap params in Next 15
    const unwrappedParams = await params;
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('arsip_kegiatan_bidang')
      // @ts-ignore
      .update(body)
      .eq('id', unwrappedParams.id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating arsip:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
