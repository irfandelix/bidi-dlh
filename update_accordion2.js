const fs = require('fs');
const filepath = 'src/app/perizinan/daftar/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

const target = `                        </span></div></td>
                      <td className="px-6 py-4 border-r-2 border-slate-200">
                        <p className="font-bold text-slate-900 text-sm uppercase">{d.nama_kegiatan}</p>
                        <p className="text-xs font-bold text-slate-500">{d.jenis_dokumen}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm border-r-2 border-slate-200">
                          {d.nama_pemrakarsa || '-'}
                        </td>
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm border-r-2 border-slate-200">
                        {d.tanggal_masuk_dokumen}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => {
                              setSelectedDoc(d);
                              setIsActionModalOpen(true);
                            }}
                            className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 text-xs font-black px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all uppercase"
                          >
                            BUKA
                          </button>
                          <Link 
                            href={\`/perizinan/cetak/\${d.id}\`}
                            className="bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all flex items-center gap-1 uppercase"
                            title="Pusat Cetak Dokumen"
                          >
                            <Printer size={14} /> Cetak
                          </Link>
                        </div>
                      </td>
                    </tr>
                    </React.Fragment>
                  ))`;

const replacement = `                        </span>
                      </td>
                      <td className="px-6 py-4 border-r-2 border-slate-200">
                        <p className="font-bold text-slate-900 text-sm uppercase">{d.nama_kegiatan}</p>
                        <p className="text-xs font-bold text-slate-500">{d.jenis_dokumen}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm border-r-2 border-slate-200">
                          {d.nama_pemrakarsa || '-'}
                        </td>
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm border-r-2 border-slate-200">
                        {d.tanggal_masuk_dokumen}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDoc(d);
                              setIsActionModalOpen(true);
                            }}
                            className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 text-xs font-black px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all uppercase"
                          >
                            BUKA
                          </button>
                          <Link 
                            onClick={(e) => e.stopPropagation()}
                            href={\`/perizinan/cetak/\${d.id}\`}
                            className="bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all flex items-center gap-1 uppercase"
                            title="Pusat Cetak Dokumen"
                          >
                            <Printer size={14} /> Cetak
                          </Link>
                          <button className="w-8 h-8 shrink-0 rounded-lg bg-slate-200 flex items-center justify-center group-hover:bg-indigo-200 group-hover:text-indigo-700 transition-colors shadow-sm border border-slate-300">
                            {expandedRows.includes(d.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows.includes(d.id) && (
                        <tr className="bg-slate-50 border-b-2 border-slate-200 cursor-default" onClick={e => e.stopPropagation()}>
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
                    </React.Fragment>
                  ))`;

content = content.replace(target, replacement);

// Clean up the leftover button from the first td that was added previously
const targetBtn = `<div className="flex items-center gap-2"><button className="w-6 h-6 shrink-0 rounded-full bg-slate-200 flex items-center justify-center group-hover:bg-indigo-200 group-hover:text-indigo-700 transition-colors">{expandedRows.includes(d.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button><span className="bg-slate-200 text-slate-900 font-black px-2 py-1 rounded border border-slate-200 text-xs shadow-sm">
                          #{d.no_urut || d.id}`;
const replacementBtn = `<span className="bg-slate-200 text-slate-900 font-black px-2 py-1 rounded border border-slate-200 text-xs shadow-sm">
                          #{d.no_urut || d.id}`;
content = content.replace(targetBtn, replacementBtn);

fs.writeFileSync(filepath, content, 'utf8');
console.log('Update success!');
