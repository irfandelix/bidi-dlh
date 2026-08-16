const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const token = 'FYK-Y7A4NN';
  const { data, error } = await supabase
    .from('pengawasan_lapangans')
    .select('*')
    .eq('token', token);
  console.log('Error:', error);
  console.log('Data length:', data ? data.length : 0);
  console.log('Data:', data);
}
run();
