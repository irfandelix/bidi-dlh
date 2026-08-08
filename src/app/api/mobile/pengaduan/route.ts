import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const body = await request.json();
    const { token, payload } = body;
    
    if (!token || !payload) {
      return NextResponse.json({ error: 'Missing token or payload' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { error: dbError } = await supabase
      .from('pengaduans')
      .update(payload)
      .eq('token', token);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
