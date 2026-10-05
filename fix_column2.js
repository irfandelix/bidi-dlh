const fs = require('fs');
let c = fs.readFileSync('src/app/perizinan/daftar/page.tsx', 'utf8');

let p1 = c.indexOf('// TABEL ARSIP PERIZINAN');
if (p1 > -1) {
  let table2 = c.substring(p1);
  
  // Find the td that contains getFiles(d).map
  let regex = /<td className="px-6 py-4 font-bold text-slate-700 text-sm border-r-2 border-slate-200">\s*<div className="flex flex-wrap gap-1\.5">\s*\{getFiles\(d\)\.map[\s\S]*?<\/td>/;
  
  table2 = table2.replace(regex, '');
  
  c = c.substring(0, p1) + table2;
  fs.writeFileSync('src/app/perizinan/daftar/page.tsx', c, 'utf8');
  console.log("Regex replaced successfully");
}
