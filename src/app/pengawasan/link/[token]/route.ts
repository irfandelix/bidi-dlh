import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
  const token = resolvedParams.token.toUpperCase();
  
  const { data, error } = await supabase
    .from('pengawasan_lapangans')
    .select(`
      id,
      bap_pengawasans ( data_matriks_c )
    `)
    .eq('token', token)
    .single();
    
  if (error || !data) {
    // If not found, redirect to home
    return NextResponse.redirect(new URL('/pengawasan', request.url));
  }
  
  // Try to redirect directly to Google Drive docx if it was already generated
  if (data.bap_pengawasans && data.bap_pengawasans.length > 0) {
    let bapData = (data.bap_pengawasans[0] as any).data_matriks_c;
    if (typeof bapData === 'string') {
      try { bapData = JSON.parse(bapData); } catch (e) {}
    }
    if (bapData && bapData.docxFileId) {
      return NextResponse.redirect(`https://drive.google.com/file/d/${bapData.docxFileId}/view?usp=sharing`);
    }
  }
  
  // Fallback to web form if docx not generated yet
  return NextResponse.redirect(new URL(`/pengawasan/ba/isi/${data.id}`, request.url));
}
