const fs = require('fs');
let content = fs.readFileSync('src/app/perizinan/daftar/page.tsx', 'utf8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes('                  const content = ('));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('                  if (isDisabled) {'));

if (startIndex === -1 || endIndex === -1) {
    console.log('Cannot find content block');
    process.exit(1);
}

const replacementLines = `                  const isMPP = stage.title.includes('(MPP)');
                  const cleanTitle = stage.title.replace(' (MPP)', '').replace(' (DLH)', '');
                  const stageColor = stage.color || 'slate';

                  const iconBg = isCurrent ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 
                               isDisabled ? 'bg-slate-50 text-slate-300 border-slate-200' : 
                               'bg-slate-100 text-slate-500 border-slate-200 group-hover:bg-indigo-100 group-hover:text-indigo-600 group-hover:border-indigo-200 shadow-sm';
                               
                  const content = (
                    <>
                      <div className={\`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300 \${iconBg}\`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 text-left flex flex-col justify-center min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <h4 className={\`text-xs sm:text-sm font-black uppercase leading-tight truncate \${
                            isCurrent ? 'text-emerald-700' : 
                            isDisabled ? 'text-slate-300' :
                            'text-slate-700 group-hover:text-indigo-700 transition-colors'
                          }\`} title={cleanTitle}>
                            {cleanTitle}
                          </h4>
                          <span className={\`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border shrink-0 \${
                             isMPP 
                               ? 'bg-blue-50 text-blue-600 border-blue-200' 
                               : 'bg-amber-50 text-amber-600 border-amber-200'
                          }\`}>
                            {isMPP ? 'MPP' : 'DLH'}
                          </span>
                        </div>
                        {docNumber ? (
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 truncate" title={docNumber}>
                             <FileText size={10} className="shrink-0" /> {docNumber}
                          </p>
                        ) : (
                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                             <CircleDashed size={10} /> Belum Ada Dokumen
                          </p>
                        )}
                        {isDisabled && (
                          <span className="inline-block mt-0.5 text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded tracking-widest w-fit">Belum Tersedia</span>
                        )}
                      </div>
                    </>
                  );

`.split('\n');

const before = lines.slice(0, startIndex);
const after = lines.slice(endIndex);

const newLines = [...before, ...replacementLines, ...after];
fs.writeFileSync('src/app/perizinan/daftar/page.tsx', newLines.join('\n'), 'utf8');
console.log('Update success!');
