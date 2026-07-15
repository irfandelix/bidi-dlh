const fs = require('fs');
const path = require('path');
const basePath = 'C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\bidi-dlh-app\\src\\app\\perizinan';

const dirsTable = ['pemeriksaan-revisi', 'pemeriksaan-substansi'];
for (const dir of dirsTable) {
  const filePath = path.join(basePath, dir, '[id]', 'page.tsx');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    // Remove TH
    content = content.replace(/<th scope="col" className="px-4 py-3 border-r-2 border-slate-900">NIP<\/th>/, '');
    // Remove TD
    content = content.replace(/<td className="px-4 py-3 font-mono text-xs text-slate-500 border-r-2 border-slate-900">\{pegawai\.nip\}<\/td>/, '');
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Updated ' + filePath);
  }
}

const dirCard = 'verifikasi-lapangan';
const filePathCard = path.join(basePath, dirCard, '[id]', 'page.tsx');
if (fs.existsSync(filePathCard)) {
  let content = fs.readFileSync(filePathCard, 'utf-8');
  content = content.replace(/<span className="text-\[10px\] text-slate-500 font-bold">NIP\. \{pegawai\.nip\}<\/span>/, '');
  fs.writeFileSync(filePathCard, content, 'utf-8');
  console.log('Updated ' + filePathCard);
}
