const fs = require('fs');
let content = fs.readFileSync('src/app/perizinan/daftar/page.tsx', 'utf8');

// The string was removed from the first table. Let's put it back in the first table.
// And remove it from the second table.

// Find the first table row:
let firstTableTr = content.indexOf('<tr key={d.id} className="hover:bg-slate-50 transition-colors">');
let secondTableTr = content.indexOf('<tr onClick={() => toggleRow(d.id)}');

console.log({firstTableTr, secondTableTr});

// Replace in first table:
content = content.replace(
  '<span className="bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300">{d.jenis_dokumen}</span> \n                           \n                        </p>',
  '<span className="bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300">{d.jenis_dokumen}</span> \n                           {d.nama_pemrakarsa}\n                        </p>'
);

// Replace in second table:
content = content.replace(
  '<span className="bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300">{d.jenis_dokumen}</span> \n                             {d.nama_pemrakarsa}\n                          </p>',
  '<span className="bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300">{d.jenis_dokumen}</span> \n                          </p>'
);

fs.writeFileSync('src/app/perizinan/daftar/page.tsx', content, 'utf8');
