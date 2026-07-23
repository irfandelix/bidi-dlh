const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\n]+)/)[1].trim().replace(/['"]/g, '');
const supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=([^\n]+)/)[1].trim().replace(/['"]/g, '');

const supabase = createClient(supabaseUrl, supabaseKey);

async function revert() {
  await supabase.from('dokumens').update({
    nomor_uji_berkas: '600.4/037.9/BA.HUA.PERTEK.AL/17/2025',
    nomor_ba_verlap: '600.4.25/141.9/BA.V.PERTEK.AL/17/2025',
    nomor_ba_pemeriksaan: '600.4.25/154.10/BA.P.PERTEK.AL/17/2025'
  }).eq('id', 9);

  await supabase.from('dokumens').update({
    nomor_uji_berkas: '600.4/069.1/17/BA.HUA.PERTEK.AL/2026',
    nomor_ba_verlap: '600.4.25/167.1/17/BA.V.PERTEK.AL/2026'
  }).eq('id', 112);

  await supabase.from('dokumens').update({
    nomor_uji_berkas: '600.4/070.1/17/BA.HUA.PERTEK.EM/2026',
    nomor_ba_verlap: '600.4.25/165.1/17/BA.V.PERTEK.EM/2026'
  }).eq('id', 113);

  console.log("Revert Done");
}
revert();
