import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `manual_${id}_${Date.now()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Upload ke Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('arsip_bap')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (storageError) {
      throw storageError;
    }

    const { data: publicUrlData } = supabase.storage.from('arsip_bap').getPublicUrl(fileName);
    const publicUrl = publicUrlData.publicUrl;

    // 2. Fetch BAP saat ini untuk update JSON
    const { data: bapData, error: bapError } = await supabase
      .from('bap_pengawasans')
      .select('id, data_matriks_c')
      .eq('pengawasan_id', id)
      .single();

    if (bapError || !bapData) {
      return NextResponse.json({ error: 'Data BAP tidak ditemukan' }, { status: 404 });
    }

    let matriks_c = (bapData as any).data_matriks_c;
    if (typeof matriks_c === 'string') {
      try { matriks_c = JSON.parse(matriks_c); } catch (e) { matriks_c = {}; }
    }

    matriks_c = {
      ...matriks_c,
      file_bap_manual: publicUrl
    };

    // 3. Update database
    const { error: updateError } = await supabase
      .from('bap_pengawasans')
      // @ts-ignore
      .update({ data_matriks_c: matriks_c })
      .eq('pengawasan_id', id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: 'Arsip BAP Manual berhasil diunggah'
    });

  } catch (error: any) {
    console.error('API Error (Upload Manual):', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
