const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function fixData() {
  const { data, error } = await supabase
    .from('dokumens')
    .update({ jenis_dokumen: 'Integrasi RINTEK LB3 ke Persetujuan Lingkungan' })
    .ilike('jenis_dokumen', '%LB3%')
    .neq('jenis_dokumen', 'RINTEK LB3');
    
  if (error) {
    console.error("Error updating:", error);
  } else {
    console.log("Updated existing docs to title case!");
  }
}

fixData();
