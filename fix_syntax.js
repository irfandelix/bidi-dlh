const fs = require('fs');
let content = fs.readFileSync('src/app/perizinan/daftar/page.tsx', 'utf8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes('                      <div className="flex-1 text-left flex flex-col justify-center min-w-0">'));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('                    </>'));

if (startIndex === -1 || endIndex === -1) {
    console.log('Cannot find content block');
    process.exit(1);
}

const replacementLines = `                      <div className="flex-1 text-left flex flex-col justify-center min-w-0">
                        <div className="flex flex-nowrap items-center justify-between gap-2 mb-1.5 w-full">
                          <h4 className={\`text-xs sm:text-sm font-black uppercase leading-tight truncate \${
                            isCurrent ? 'text-emerald-700' : 
                            isDisabled ? 'text-slate-300' :
                            'text-slate-700 group-hover:text-indigo-700 transition-colors'
                          }\`} title={cleanTitle}>
                            {cleanTitle}
                          </h4>
                          <span className={\`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border shrink-0 \${
                             isMPP 
                               ? 'bg-sky-100 text-sky-700 border-sky-200' 
                               : 'bg-orange-100 text-orange-700 border-orange-200'
                          }\`}>
                            {isMPP ? 'MPP' : 'DLH'}
                          </span>
                        </div>
                        
                        {docNumber ? (
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 truncate" title={docNumber}>
                             <FileText size={12} className="shrink-0 text-indigo-500" /> {docNumber}
                          </p>
                        ) : (
                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                             <CircleDashed size={10} /> Belum Ada Dokumen
                          </p>
                        )}

                        {isDisabled && (
                          <span className="inline-block mt-0.5 text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded tracking-widest w-fit">Belum Tersedia</span>
                        )}
                      </div>`.split('\n');

const before = lines.slice(0, startIndex);
const after = lines.slice(endIndex); // wait, endIndex is `</>`

const newLines = [...before, ...replacementLines, ...after];
fs.writeFileSync('src/app/perizinan/daftar/page.tsx', newLines.join('\n'), 'utf8');
console.log('Update success!');
