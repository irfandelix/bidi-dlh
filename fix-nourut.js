const fs = require('fs');
const path = require('path');

const dirs = [
  'arsip',
  'finalisasi',
  'pemeriksaan-revisi',
  'pemeriksaan-substansi',
  'penerimaan-perbaikan',
  'pengembalian',
  'uji-administrasi',
  'verifikasi-lapangan'
];

const basePath = 'C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\bidi-dlh-app\\src\\app\\perizinan';

for (const dir of dirs) {
  const filePath = path.join(basePath, dir, '[id]', 'page.tsx');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Change span to div for No Urut / Tahun
    content = content.replace(/<span className="font-black text-slate-500 text-xs uppercase tracking-wider">No Urut \/ Tahun<\/span>/g, '<div className="font-black text-slate-500 text-xs uppercase tracking-wider">No Urut / Tahun</div>');

    // Change doc.id to doc.no_urut
    // #{String(doc.id).padStart(3, '0')}
    content = content.replace(/#\{String\(doc\.id\)\.padStart\(3, '0'\)\}/g, '#{String(doc.no_urut || doc.id).padStart(3, \'0\')}');

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}
