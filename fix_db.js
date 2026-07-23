const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\n]+)/)[1].trim().replace(/['"]/g, '');
const supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=([^\n]+)/)[1].trim().replace(/['"]/g, '');

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('dokumens').select('*').like('jenis_dokumen', '%PERTEK%');
  if (error) console.log(error);
  else {
    for (const doc of data) {
      const updates = {};
      
      const fields = [
        'nomor_uji_berkas', 'nomor_ba_verlap', 'nomor_ba_pemeriksaan', 
        'nomor_php', 'nomor_php1', 'nomor_php2', 'nomor_php3', 'nomor_php4', 'nomor_php5',
        'nomor_revisi_1', 'nomor_revisi_2', 'nomor_revisi_3', 'nomor_revisi_4', 'nomor_revisi_5',
        'nomor_tanda_terima_perbaikan'
      ];

      for (const field of fields) {
        if (doc[field] && typeof doc[field] === 'string') {
          if (doc[field].includes('PERTEK AIR LIMBAH')) {
            updates[field] = doc[field].replace('PERTEK AIR LIMBAH', 'PERTEK.AL');
          }
          if (doc[field].includes('PERTEK EMISI')) {
            updates[field] = doc[field].replace('PERTEK EMISI', 'PERTEK.EM');
          }
          if (doc[field].includes('PERTEK ANDALALIN')) {
            updates[field] = doc[field].replace('PERTEK ANDALALIN', 'ANDALALIN');
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        console.log(`Updating document ID ${doc.id}...`, updates);
        await supabase.from('dokumens').update(updates).eq('id', doc.id);
      }
    }
    console.log("Done");
  }
}
check();
