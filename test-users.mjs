import 'dotenv/config.js';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function test() {
  console.log("Querying users table...");
  const { data, error } = await supabase.from('users').select('*');
  console.log("Result:", JSON.stringify({ data, error }, null, 2));
}

test();
