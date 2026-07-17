import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request, { params }: { params: { token: string } }) {
  const token = params.token.toUpperCase();
  
  const { data, error } = await supabase
    .from('pengawasan_lapangans')
    .select('id')
    .eq('token', token)
    .single();
    
  if (error || !data) {
    // If not found, redirect to home
    return NextResponse.redirect(new URL('/pengawasan', request.url));
  }
  
  return NextResponse.redirect(new URL(`/pengawasan/ba/isi/${data.id}`, request.url));
}
