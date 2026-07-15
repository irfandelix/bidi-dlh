import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = params.id;
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await (supabase.from('tim_pengawas') as any)
      .update({
        nama: body.nama,
        nip: body.nip || null,
        pangkat_golongan: body.pangkat_golongan || null,
        jabatan_dinas: body.jabatan_dinas || null,
        kategori: body.kategori || null,
        urutan_hierarki: body.urutan_hierarki || 99,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error updating tim_pengawas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const supabase = await createClient();
    const id = params.id;

    const { error } = await supabase
      .from('tim_pengawas')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting tim_pengawas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
