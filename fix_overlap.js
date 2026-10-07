const fs = require('fs');
let content = fs.readFileSync('src/app/perizinan/daftar/page.tsx', 'utf8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes('                                                  <div className={`absolute top-12 text-center whitespace-nowrap text-[10px] font-black uppercase tracking-tight ${'));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('                                                  </div>'));

if (startIndex === -1 || endIndex === -1) {
    console.log('Cannot find progress text block');
    process.exit(1);
}

const replacementLines = `                                                  <div className={\`absolute top-12 text-center whitespace-nowrap text-[10px] font-black uppercase tracking-tight flex flex-col items-center gap-1 \${
                                                    isCurrent ? 'text-indigo-600' : 
                                                    isSkipped ? 'text-slate-400' :
                                                    isPast ? 'text-slate-700' : 
                                                    'text-slate-400'
                                                  }\`}>
                                                      <span>{stageData?.shortTitle?.replace(' (MPP)', '').replace(' (DLH)', '')}</span>
                                                      <span className={\`text-[8px] px-1.5 py-0.5 rounded leading-none border \${stageData?.shortTitle?.includes('(MPP)') ? 'bg-sky-50 text-sky-600 border-sky-200' : 'bg-orange-50 text-orange-600 border-orange-200'}\`}>
                                                          {stageData?.shortTitle?.includes('(MPP)') ? 'MPP' : 'DLH'}
                                                      </span>
                                                  </div>`.split('\n');

const before = lines.slice(0, startIndex);
const after = lines.slice(endIndex + 1);

const newLines = [...before, ...replacementLines, ...after];
fs.writeFileSync('src/app/perizinan/daftar/page.tsx', newLines.join('\n'), 'utf8');
console.log('Update success!');
