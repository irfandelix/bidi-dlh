import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { use } from 'react';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase: any = await createClient();
    const { id } = await params;

    const { error } = await supabase
      .from('anggota_bidang')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
