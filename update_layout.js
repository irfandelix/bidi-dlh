const fs = require('fs');
let content = fs.readFileSync('src/app/perizinan/daftar/page.tsx', 'utf8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes('                        <div className="flex flex-wrap items-center gap-1.5 mb-1">'));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">'));

if (startIndex === -1 || endIndex === -1) {
    console.log('Cannot find content block');
    process.exit(1);
}

const replacementLines = `                        <h4 className={\`text-xs sm:text-sm font-black uppercase leading-tight truncate w-full mb-1.5 \${
                          isCurrent ? 'text-emerald-700' : 
                          isDisabled ? 'text-slate-300' :
                          'text-slate-700 group-hover:text-indigo-700 transition-colors'
                        }\`} title={cleanTitle}>
                          {cleanTitle}
                        </h4>
                        
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={\`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border shrink-0 \${
                             isMPP 
                               ? 'bg-sky-100 text-sky-700 border-sky-200' 
                               : 'bg-orange-100 text-orange-700 border-orange-200'
                          }\`}>
                            {isMPP ? 'MPP' : 'DLH'}
                          </span>
                          
                          {docNumber ? (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 truncate" title={docNumber}>
                               <FileText size={10} className="shrink-0" /> {docNumber}
                            </p>
                          ) : (
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">`.split('\n');

const before = lines.slice(0, startIndex);
const after = lines.slice(endIndex);

const newLines = [...before, ...replacementLines, ...after];
fs.writeFileSync('src/app/perizinan/daftar/page.tsx', newLines.join('\n'), 'utf8');
console.log('Update success!');
