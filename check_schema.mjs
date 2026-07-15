import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: p, error: pe } = await supabase.from('pengawasan_lapangans').select('*').limit(1);
  console.log('pengawasan_lapangans:', pe ? pe.message : 'exists');
  if (p && p.length > 0) console.log('Columns:', Object.keys(p[0]));
  
  const { data: b, error: be } = await supabase.from('bap_pengawasans').select('*').limit(1);
  console.log('bap_pengawasans:', be ? be.message : 'exists');
  if (b && b.length > 0) console.log('Columns:', Object.keys(b[0]));
}

check();
