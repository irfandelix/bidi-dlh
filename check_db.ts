import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const envFile = fs.readFileSync('.env.local', 'utf8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim().replace(/"/g, '');
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function checkDb() {
  const { data, error } = await supabase.from('dokumens').select('penandatangan_uji_admin').eq('id', 148).single();
  console.log('Error:', error);
  console.log('penandatangan_uji_admin:', data?.penandatangan_uji_admin);
  
  if (data?.penandatangan_uji_admin) {
    const parsed = JSON.parse(data.penandatangan_uji_admin);
    const { data: pegawai } = await supabase.from('tim_penilais').select('id, nama').in('id', parsed);
    console.log('Pegawai terpilih:', pegawai);
  }
}
checkDb();
