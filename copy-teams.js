require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function copyTeams() {
  console.log("Memulai proses penyalinan ke anggota_bidang...");
  
  // 1. Ambil data tim_penilais
  const { data: penilai, error: err1 } = await supabase.from('tim_penilais').select('*');
  if (err1) console.error("Error penilai:", err1);
  
  // 2. Ambil data tim_pengawas
  const { data: pengawas, error: err2 } = await supabase.from('tim_pengawas').select('*');
  if (err2) console.error("Error pengawas:", err2);

  // 3. Ambil data anggota_bidang yang sudah ada
  const { data: anggota, error: err3 } = await supabase.from('anggota_bidang').select('nama');
  const existingNames = new Set(anggota.map(p => p.nama.toLowerCase().trim()));

  const allToInsert = [];

  [...(penilai || []), ...(pengawas || [])].forEach(p => {
    const name = p.nama?.trim();
    if (name && !existingNames.has(name.toLowerCase())) {
      allToInsert.push({
        nama: name,
        nip: p.nip || null,
        jabatan: p.jabatan || null,
        hierarki: p.urutan || p.urutan_hierarki || 99
      });
      existingNames.add(name.toLowerCase()); // cegah duplikat
    }
  });

  if (allToInsert.length > 0) {
    console.log(`Ditemukan ${allToInsert.length} data baru untuk dimasukkan ke anggota_bidang.`);
    const { error: errInsert } = await supabase.from('anggota_bidang').insert(allToInsert);
    if (errInsert) {
      console.error("Gagal insert:", errInsert);
    } else {
      console.log("Berhasil menyalin data!");
    }
  } else {
    console.log("Semua data tim sudah ada di anggota_bidang, tidak ada yang disalin.");
  }
}

copyTeams();
