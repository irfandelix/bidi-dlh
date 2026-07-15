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

  return <CetakClient doc={doc} />;
}
