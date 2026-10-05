const fs = require('fs');

let content = fs.readFileSync('src/app/perizinan/daftar/page.tsx', 'utf8');

// Find the second table by finding "// TABEL ARSIP PERIZINAN"
let split = content.split('// TABEL ARSIP PERIZINAN');
if (split.length > 1) {
  let table2 = split[1];

  // Remove the header
  table2 = table2.replace(
    '<th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-200">File Tersimpan</th>',
    ''
  );

  // Remove the td for File Tersimpan
  const oldTd = `<td className="px-6 py-4 font-bold text-slate-700 text-sm border-r-2 border-slate-200">
                          <div className="flex flex-wrap gap-1.5">
                            {getFiles(d).map(f => (
                               <a key={f.name} href={f.url} onClick={e => e.stopPropagation()} target="_blank" rel="noreferrer" className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-sm">
                                 {f.name}
                               </a>
                            ))}
                            {getFiles(d).length === 0 && <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded border border-slate-200">BELUM ADA FILE UPLOAD</span>}
                          </div>
                        </td>`;
  table2 = table2.replace(oldTd, '');

  // Change colSpan={5} to colSpan={4}
  table2 = table2.replace(/colSpan=\{5\}/g, 'colSpan={4}');

  content = split[0] + '// TABEL ARSIP PERIZINAN' + table2;
}

fs.writeFileSync('src/app/perizinan/daftar/page.tsx', content, 'utf8');
console.log('Removed File Tersimpan and adjusted colSpan in second table');
