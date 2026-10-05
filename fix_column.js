const fs = require('fs');
let c = fs.readFileSync('src/app/perizinan/daftar/page.tsx', 'utf8');

// Find the second table mapping
let p1 = c.indexOf('// TABEL ARSIP PERIZINAN');
if (p1 > -1) {
  let targetString = `<td className="px-6 py-4 font-bold text-slate-700 text-sm border-r-2 border-slate-200">
                          <div className="flex flex-wrap gap-1.5">
                            {getFiles(d).map(f => (
                               <a key={f.name} href={f.url} onClick={e => e.stopPropagation()} target="_blank" rel="noreferrer" className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-sm">
                                 {f.name}
                               </a>
                            ))}
                            {getFiles(d).length === 0 && <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded border border-slate-200">BELUM ADA FILE UPLOAD</span>}
                          </div>
                        </td>`;
  
  if (c.indexOf(targetString, p1) > -1) {
    c = c.substring(0, p1) + c.substring(p1).replace(targetString, '');
    fs.writeFileSync('src/app/perizinan/daftar/page.tsx', c, 'utf8');
    console.log("Successfully removed the column");
  } else {
    console.log("Target string not found in the second table block");
  }
}
