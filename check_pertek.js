const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\n]+)/)[1].trim().replace(/['"]/g, '');
const supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=([^\n]+)/)[1].trim().replace(/['"]/g, '');

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('dokumens').select('*').or('nomor_revisi_1.ilike.%PERTEK AIR LIMBAH%,nomor_revisi_2.ilike.%PERTEK AIR LIMBAH%,nomor_revisi_3.ilike.%PERTEK AIR LIMBAH%');
  if (error) console.log(error);
  else {
    console.log(data);
  }
}
check();
