const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function fixData() {
  const { data, error } = await supabase
    .from('dokumens')
    .select('id, status_tahapan')
    .not('nomor_sk', 'is', null)
    .neq('nomor_sk', '');
    
  if (error) {
    console.error("Error fetching:", error);
    return;
  }
  
  const toUpdate = data.filter(d => !['Arsip', 'Diarsipkan', 'ARSIP', 'Jilidan Selesai', 'Penerimaan Jilidan', 'Menunggu Jilidan'].includes(d.status_tahapan));
  
  console.log(`Found ${toUpdate.length} documents to force update to Menunggu Jilidan`);
  
  for(const doc of toUpdate) {
    await supabase.from('dokumens').update({ status_tahapan: 'Menunggu Jilidan' }).eq('id', doc.id);
    console.log(`Updated ID: ${doc.id}`);
  }
}

fixData();
