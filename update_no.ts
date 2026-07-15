import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const envFile = fs.readFileSync('.env.local', 'utf8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim().replace(/"/g, '');
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function updateDb() {
  const { data: doc } = await supabase.from('dokumens').select('*').eq('id', 148).single();
  const jenisAcronym = doc.jenis_dokumen === 'SPPL' ? 'SPPL' : 
                       doc.jenis_dokumen === 'UKL-UPL' ? 'UKL-UPL' : 
                       doc.jenis_dokumen === 'DPLH' ? 'DPLH' : 
                       doc.jenis_dokumen === 'AMDAL' ? 'AMDAL' : 'DOK';
  const noUrutPadded = String(doc.no_urut || doc.id).padStart(3, '0');
  const bulan = new Date().getMonth() + 1;
  const tahun = new Date().getFullYear();
  const nomorUji = `600.4/${noUrutPadded}.${bulan}/17/BA.HUA.${jenisAcronym}/${tahun}`;

  const { error } = await supabase.from('dokumens').update({ nomor_uji_berkas: nomorUji }).eq('id', 148);
  console.log('Updated to:', nomorUji);
}
updateDb();
