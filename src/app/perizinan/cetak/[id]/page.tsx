import { createClient } from '@/lib/supabase/server';
import CetakClient from './CetakClient';
import { notFound } from 'next/navigation';

export default async function CetakPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  const id = unwrappedParams.id;
  const supabase = await createClient();

  const { data: doc, error } = await supabase
    .from('dokumens')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !doc) {
    notFound();
  }

  // Fetch tim_penilais to resolve officer names for penandatangan & petugas
  const { data: timPenilai } = await supabase
    .from('tim_penilais')
    .select('id, nama, nip, pangkat_gol, jabatan_dinas, peran, urutan_hierarki');

  return <CetakClient doc={doc} timPenilai={timPenilai || []} />;
}
