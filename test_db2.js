const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabaseAdmin.from('pengawasan_lapangans').insert([{
    tanggal_kunjungan: '2026-08-14',
    kategori: 'Industri',
    nama_kegiatan: 'TEST-3',
    nama_pemrakarsa: 'TEST-3',
    alamat_lokasi: 'TEST',
    tim_tugas: 'A|B',
    saksi: 'C|D',
    token: 'IND-TEST33'
  }]).select();
  console.log('Error:', error);
  console.log('Data:', data);
}
run();
