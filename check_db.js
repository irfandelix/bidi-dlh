const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\n]+)/)[1].trim().replace(/['"]/g, '');
const supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=([^\n]+)/)[1].trim().replace(/['"]/g, '');

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('dokumens').select('id, nama_kegiatan, nomor_uji_berkas').not('nomor_uji_berkas', 'is', null);
  if (error) console.log(error);
  else {
    data.forEach(d => console.log(d.id + ' | ' + d.nama_kegiatan + ' => ' + d.nomor_uji_berkas));
  }
}
check();
