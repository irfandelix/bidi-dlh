const fs = require('fs');
const filepath = 'src/app/perizinan/daftar/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// Replace mapping block for all documents table
const startIndex = content.indexOf('{activeGroup.id === 0 ? (');
const endIndex = content.indexOf(') : (', startIndex);
if (startIndex !== -1 && endIndex !== -1) {
    let block = content.substring(startIndex, endIndex);

    // Make tr clickable and use React.Fragment
    block = block.replace(/<tr key=\{d\.id\} className="hover:bg-slate-50 transition-colors">/g, '<React.Fragment key={d.id}>\n<tr onClick={() => toggleRow(d.id)} className="hover:bg-slate-50 transition-colors cursor-pointer group">');

    // Add chevron button inside first td
    block = block.replace(/<span className="bg-slate-200/g, '<div className="flex items-center gap-2"><button className="w-6 h-6 shrink-0 rounded-full bg-slate-200 flex items-center justify-center group-hover:bg-indigo-200 group-hover:text-indigo-700 transition-colors">{expandedRows.includes(d.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button><span className="bg-slate-200');

    // Close the div in the first td
    block = block.replace(/<\/span>\s*<\/td>/g, '</span></div></td>');

    // Prevent propagation on BUKA button
    block = block.replace(/onClick=\{\(\) => \{\n\s*setSelectedDoc\(d\);\n\s*setIsActionModalOpen\(true\);\n\s*\}\}/g, 'onClick={(e) => { e.stopPropagation(); setSelectedDoc(d); setIsActionModalOpen(true); }}');

    // Prevent propagation on CETAK button
    block = block.replace(/<Link \n\s*href=\{\`\/perizinan\/cetak\/\$\{d\.id\}\`\}\n\s*className="bg-amber-400/g, '<Link onClick={(e) => e.stopPropagation()} href={`/perizinan/cetak/${d.id}`} className="bg-amber-400');

    // Add accordion after </tr>
    const accordionStr = `</tr>
                      {expandedRows.includes(d.id) && (
                        <tr className="bg-slate-50 border-b-2 border-slate-200">
                            <td colSpan={5} className="p-8 border-r-2 border-l-2 border-slate-200">
                                <div className="w-full max-w-4xl mx-auto">
                                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-6 text-center">Progress Dokumen (Tahapan Aktif: {d.status_tahapan || 'Registrasi'})</h4>
                                  <div className="flex items-center justify-between relative mt-4 mb-8">
                                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-200 rounded-full z-0"></div>
                                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-indigo-500 rounded-full z-0 transition-all duration-500" style={{ width: \`\${Math.min(100, (getStageForStatus(d.status_tahapan, d).id / 11) * 100)}%\` }}></div>
                                      
                                      {[1, 2, 3, 4, 10].map(stepId => {
                                          const currentStageId = getStageForStatus(d.status_tahapan, d).id;
                                          
                                          let logicalStep = stepId;
                                          if (stepId === 10) logicalStep = 5;

                                          let currentLogicalStep = 1;
                                          if (currentStageId >= 2) currentLogicalStep = 2;
                                          if (currentStageId >= 3) currentLogicalStep = 3;
                                          if (currentStageId >= 4) currentLogicalStep = 4;
                                          if (currentStageId >= 10) currentLogicalStep = 5;

                                          const isPast = currentLogicalStep > logicalStep;
                                          const isCurrent = currentLogicalStep === logicalStep;
                                          const stageData = stages.find(s => s.id === stepId);
                                          
                                          return (
                                              <div key={stepId} className="relative z-10 flex flex-col items-center gap-2 group w-20">
                                                  <div className={\`w-12 h-12 rounded-full flex items-center justify-center border-4 \${isCurrent ? 'border-indigo-100 bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' : isPast ? 'border-indigo-100 bg-indigo-500 text-white' : 'border-slate-100 bg-white text-slate-300'} transition-all\`}>
                                                      {stageData && <stageData.icon size={20} />}
                                                  </div>
                                                  <div className={\`absolute top-14 text-center whitespace-nowrap text-[10px] font-black uppercase tracking-wider \${isCurrent ? 'text-indigo-600' : isPast ? 'text-slate-700' : 'text-slate-400'}\`}>
                                                      {stageData?.shortTitle}
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                                </div>
                            </td>
                        </tr>
                      )}
                      </React.Fragment>`;

    block = block.replace(/<\/tr>\n\s*\)\)/g, accordionStr + '\n                    ))');

    content = content.substring(0, startIndex) + block + content.substring(endIndex);
    fs.writeFileSync(filepath, content, 'utf8');
    console.log('Update success!');
} else {
    console.log('Could not find activeGroup.id === 0 block');
}
