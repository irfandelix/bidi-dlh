const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL="(.*)"/)[1];
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="(.*)"/)[1];

const supabase = createClient(url, key);

supabase.from('dokumens').select('*').limit(1).then(res => {
  console.log(Object.keys(res.data[0] || {}));
}).catch(console.error);
