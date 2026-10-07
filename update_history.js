const fs = require('fs');
const file = 'src/app/perizinan/pengembalian/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regexHistory = /const tanggal = doc\[\`tanggal_pengembalian_\$\{key\}\`\] \|\| \(key === '1' \? doc\.tanggal_pengembalian : null\);\s*return \([\s\S]*?<\/div>\s*\);\s*\}\)/;

const newHistory = `const tanggal = doc[\`tanggal_pengembalian_\${key}\`] || (key === '1' ? doc.tanggal_pengembalian : null);
                  let penerima = '';
                  let penyerah = '';
                  try {
                    const fisik = typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc.arsip_fisik;
                    if (fisik) {
                      penerima = fisik[\`penerima_ba_revisi_\${key}\`] || (key === '1' ? fisik['penerima_ba'] : '');
                      penyerah = fisik[\`penyerah_ba_revisi_\${key}\`] || (key === '1' ? fisik['penyerah_ba'] : '');
                    }
                  } catch(e) {}
                  
                  return (
                    <div key={key} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                      <div>
                        <span className="inline-block bg-error-container text-on-error-container text-xs font-black px-3 py-1 rounded-full border border-error mb-2">{label}</span>
                        {tanggal && <p className="text-sm text-slate-700 font-bold">Penyerahan: {new Date(tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>}
                      </div>
                      {(penerima || penyerah) && (
                        <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col gap-1">
                           {penerima && <p><span className="font-bold">Penerima:</span> {penerima}</p>}
                           {penyerah && <p><span className="font-bold">Penyerah (MPP):</span> {penyerah}</p>}
                        </div>
                      )}
                    </div>
                  );
                })`;

content = content.replace(regexHistory, newHistory);
content = content.replace('Riwayat Pengembalian Revisi', 'Riwayat Penyerahan BA Revisi');

fs.writeFileSync(file, content);
console.log('History updated');
