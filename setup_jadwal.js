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
    await client.query("CREATE TABLE IF NOT EXISTS jadwal_mpp (id SERIAL PRIMARY KEY, officer_id INTEGER NOT NULL REFERENCES petugas_mpp(id) ON DELETE CASCADE, tanggal DATE NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), UNIQUE(officer_id, tanggal));");
    console.log('Table jadwal_mpp created successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
