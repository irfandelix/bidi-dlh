const fs = require('fs');
let content = fs.readFileSync('src/app/perizinan/daftar/page.tsx', 'utf8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes('{expandedRows.includes(d.id) && ('));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('</React.Fragment>'));

if (startIndex === -1 || endIndex === -1) {
    console.log('Cannot find accordion block');
    process.exit(1);
}

const replacementLines = `                    {expandedRows.includes(d.id) && (
                        <tr className="bg-slate-50 border-b-2 border-slate-200 cursor-default" onClick={e => e.stopPropagation()}>
                            <td colSpan={5} className="p-8 border-r-2 border-l-2 border-slate-200">
                                <div className="w-full mx-auto overflow-x-auto pb-4">
                                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-8 text-center sticky left-0">Progress Dokumen (Tahapan Aktif: {d.status_tahapan || 'Registrasi'})</h4>
                                  <div className="flex items-center justify-between relative mt-4 mb-4 min-w-[800px]">
                                      <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1.5 bg-slate-200 rounded-full z-0"></div>
                                      <div className="absolute left-4 top-1/2 -translate-y-1/2 h-1.5 bg-indigo-500 rounded-full z-0 transition-all duration-500" style={{ width: \`\${Math.min(100, ((getStageForStatus(d.status_tahapan, d).id - 1) / 11) * 100)}%\` }}></div>
                                      
                                      {stages.map(stageData => {
                                          const stepId = stageData.id;
                                          const currentStageId = getStageForStatus(d.status_tahapan, d).id;
                                          
                                          const isPast = currentStageId > stepId;
                                          const isCurrent = currentStageId === stepId;
                                          
                                          return (
                                              <div key={stepId} className="relative z-10 flex flex-col items-center gap-2 group flex-1">
                                                  <div className={\`w-10 h-10 rounded-full flex items-center justify-center border-4 \${isCurrent ? 'border-indigo-100 bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' : isPast ? 'border-indigo-100 bg-indigo-500 text-white' : 'border-slate-100 bg-white text-slate-300'} transition-all\`}>
                                                      {stageData && <stageData.icon size={16} />}
                                                  </div>
                                                  <div className={\`absolute top-12 text-center whitespace-nowrap text-[10px] font-black uppercase tracking-tight \${isCurrent ? 'text-indigo-600' : isPast ? 'text-slate-700' : 'text-slate-400'}\`}>
                                                      {stageData?.shortTitle}
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                                </div>
                            </td>
                        </tr>
                    )}`.split('\n');

const before = lines.slice(0, startIndex);
const after = lines.slice(endIndex);

const newLines = [...before, ...replacementLines, ...after];
fs.writeFileSync('src/app/perizinan/daftar/page.tsx', newLines.join('\n'), 'utf8');
console.log('Update success!');
