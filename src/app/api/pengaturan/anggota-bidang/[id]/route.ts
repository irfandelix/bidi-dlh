import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = params.id;
    const supabase: any = await createClient();
    const body = await request.json();
    const { nama, nip, jabatan, hierarki } = body;

    if (!nama) {
      return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('anggota_bidang')
      .update({
        nama,
        nip: nip || null,
        jabatan: jabatan || null,
        hierarki: hierarki || '99',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating anggota_bidang:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = params.id;
    const supabase: any = await createClient();

    const { error } = await supabase
      .from('anggota_bidang')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting anggota_bidang:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
