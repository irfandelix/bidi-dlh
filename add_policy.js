const { Client } = require('pg');
const client = new Client({
  host: 'aws-1-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.zorjwjatbfxzmalpemqa',
  password: 'Delix@DBDLH1',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  try {
    await client.query('CREATE POLICY "Allow anon insert" ON public.pengawasan_lapangans FOR INSERT TO anon, authenticated WITH CHECK (true);');
    console.log('Policy added successfully');
  } catch (err) {
    if (err.message.includes('already exists')) {
       console.log('Policy already exists');
    } else {
       console.error('Error:', err);
    }
  }
  await client.end();
}
run();
