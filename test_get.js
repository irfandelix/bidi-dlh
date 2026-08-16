const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
// simulate what happens in GET
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: agendaData, error: agendaError } = await supabase
    .from('pengawasan_lapangans')
    .select('*, bap_pengawasans(id)')
    .order('tanggal_kunjungan', { ascending: false });
  console.log('Error:', agendaError);
  console.log('Data length:', agendaData ? agendaData.length : 0);
  if (agendaData) {
      const agendas = agendaData.filter(item => !item.bap_pengawasans || item.bap_pengawasans.length === 0);
      console.log('Filtered length:', agendas.length);
      console.log(agendas[0]);
  }
}
run();
