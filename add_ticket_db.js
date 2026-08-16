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
  await client.query("ALTER TABLE wa_chats ADD COLUMN IF NOT EXISTS ticket_id text");
  console.log('Ticket ID column added successfully');
  await client.end();
}
run().catch(console.error);
