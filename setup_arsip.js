const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.zorjwjatbfxzmalpemqa:Delix%40DBDLH1@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres'
});
client.connect().then(async () => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS arsip_kegiatan_bidang (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tim VARCHAR(255) NOT NULL,
      nama_kegiatan VARCHAR(255) NOT NULL,
      tanggal_kegiatan DATE NOT NULL,
      lokasi_kegiatan VARCHAR(255),
      folder_id VARCHAR(255),
      dokumentasi_acara JSONB,
      undangan_acara JSONB,
      berkas_lain JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
  `);
  console.log('Table arsip_kegiatan_bidang created successfully!');
  client.end();
}).catch(console.error);
