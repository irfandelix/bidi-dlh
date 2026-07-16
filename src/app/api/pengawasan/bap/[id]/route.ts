import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'ID Agenda tidak ditemukan' }, { status: 400 });
    }

    const body = await request.json();

    const supabase = await createClient();
    
    // 1. Update status ketaatan di pengawasan_lapangans
    const { error: errorPengawasan } = await supabase
      .from('pengawasan_lapangans')
      // @ts-ignore
      .update({
        status_ketaatan: body.status_ketaatan
      } as any)
      .eq('id', id);

    if (errorPengawasan) throw errorPengawasan;

    // 2. Cek apakah bap_pengawasans sudah ada
    const { data: existingBap } = await supabase
      .from('bap_pengawasans')
      .select('id')
      .eq('pengawasan_id', id)
      .maybeSingle();

    const bapPayload = {
      pengawasan_id: id,
      data_matriks_c: body.bap, // Simpan semua JSON payload kesini sebagai fallback
      total_skor: body.total_skor,
      rincian_skoring: body.bap.rincian_skoring,
      saran_masukan: typeof body.bap.saran === 'string' ? body.bap.saran : JSON.stringify(body.bap.saran),
      ttd_tim: typeof body.bap.ttd_tim === 'string' ? body.bap.ttd_tim : JSON.stringify(body.bap.ttd_tim),
      paraf_tim: typeof body.bap.paraf_tim === 'string' ? body.bap.paraf_tim : JSON.stringify(body.bap.paraf_tim),
      ttd_pemrakarsa: body.bap.ttd_pemrakarsa,
      paraf_pemrakarsa: body.bap.paraf_pemrakarsa,
    };

    let errorBap;
    if (existingBap) {
      // @ts-ignore
      const res = await supabase.from('bap_pengawasans').update(bapPayload as any).eq('id', existingBap.id);
      errorBap = res.error;
    } else {
      // @ts-ignore
      const res = await supabase.from('bap_pengawasans').insert(bapPayload as any);
      errorBap = res.error;
    }

    if (errorBap) throw errorBap;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('BAP API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
