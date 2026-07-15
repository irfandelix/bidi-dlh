import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase: any = await createClient();
    const body = await request.json();

    const tahun = new Date().getFullYear().toString();

    // Get max no_urut for this year
    const { data: urutList } = await supabase
      .from('dokumens')
      .select('no_urut')
      .eq('tahun', tahun)
      .order('no_urut', { ascending: false })
      .limit(1);
      
    const nextUrut = urutList && urutList.length > 0 ? ((urutList[0] as any).no_urut || 0) + 1 : 1;

    // Set default value for registration
    const bulan = new Date().getMonth() + 1;
    const noUrutPadded = String(nextUrut).padStart(3, '0');
    const jenisDokumen = body.jenis_dokumen || 'UKL-UPL';
    
    const dataToInsert = {
      ...body,
      status_tahapan: 'Uji Administrasi',
      tahun: tahun,
      no_urut: nextUrut,
      nomor_checklist: body.nomor_checklist || `600.4/${noUrutPadded}.${bulan}/17/REG.${jenisDokumen}/${tahun}`,
    };

    // Insert data to supabase (table: dokumens)
    const { data, error } = await supabase
      .from('dokumens')
      // @ts-ignore
      .insert([dataToInsert])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Registrasi berhasil dibuat', data }, { status: 201 });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
