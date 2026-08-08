const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function fixData() {
  const { data, error } = await supabase
    .from('dokumens')
    .update({ status_tahapan: 'Menunggu Jilidan' })
    .not('nomor_sk', 'is', null)
    .neq('nomor_sk', '')
    .eq('status_tahapan', 'Selesai / SK');
    
  if (error) {
    console.error("Error updating:", error);
  } else {
    console.log("Updated existing docs to Menunggu Jilidan!");
  }
}

fixData();
