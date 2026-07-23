const fs = require('fs');

const replacement = `const jenisAcronym = ({
  'SPPL': 'SPPL', 'UKLUPL': 'UKLUPL', 'UKL-UPL': 'UKLUPL',
  'RINTEK LB3': 'RT.LB3', 'PERTEK AIR LIMBAH': 'ST.AL', 'PERTEK EMISI': 'ST.EM',
  'KAJIAN TEKNIS AIR LIMBAH': 'KT.AL', 'KAJIAN TEKNIS EMISI': 'KT.EM',
  'KT AL': 'KT.AL', 'KT EM': 'KT.EM', 'SLO': 'SLO', 'DPLH': 'DPLH', 
  'DELH': 'DELH', 'AMDAL': 'AMDAL'
})[doc.jenis_dokumen] || doc.jenis_dokumen;`;

['src/app/api/perizinan/[id]/route.ts', 'src/app/api/generate/route.ts', 'src/app/perizinan/uji-administrasi/[id]/page.tsx', 'src/app/perizinan/finalisasi/[id]/page.tsx'].forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/const jenisAcronym\s*=\s*doc\.jenis_dokumen === 'SPPL'[^;]+;/g, replacement);
  fs.writeFileSync(f, content);
  console.log(`Replaced in ${f}`);
});
