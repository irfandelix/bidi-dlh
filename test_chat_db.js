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
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'wa_chats'");
  console.log(res.rows);
  await client.end();
}
run().catch(console.error);
