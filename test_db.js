const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('pengawasan_lapangans').insert([{
    tanggal_kunjungan: '2026-08-14',
    kategori: 'Industri',
    nama_kegiatan: 'TEST',
    nama_pemrakarsa: 'TEST',
    alamat_lokasi: 'TEST',
    tim_tugas: 'A|B',
    saksi: 'C|D',
    token: 'IND-TEST12'
  }]);
  console.log('Error:', error);
}
run();
