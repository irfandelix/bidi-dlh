const fs = require('fs');
let content = fs.readFileSync('src/app/perizinan/daftar/page.tsx', 'utf8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes('                                      {stages.map(stageData => {'));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('                                      })}'));

if (startIndex === -1 || endIndex === -1) {
    console.log('Cannot find map block');
    process.exit(1);
}

const replacementLines = `                                      {stages.map(stageData => {
                                          const stepId = stageData.id;
                                          const currentStageId = getStageForStatus(d.status_tahapan, d).id;
                                          
                                          let hasData = false;
                                          let fisik: any = {};
                                          try { if (d.arsip_fisik) fisik = typeof d.arsip_fisik === 'string' ? JSON.parse(d.arsip_fisik) : d.arsip_fisik; } catch(e) {}
                                          
                                          if (stepId === 1) hasData = true;
                                          if (stepId === 2) hasData = !!(d.nomor_uji_berkas || d.tanggal_uji_berkas || fisik?.urlUjiAdmin);
                                          if (stepId === 3) hasData = !!(d.nomor_ba_verlap || d.tanggal_verlap || d.tanggal_ba_verlap || fisik?.urlBaVerlap);
                                          if (stepId === 4) hasData = !!(d.nomor_ba_pemeriksaan || d.tanggal_pemeriksaan || fisik?.urlBaSidang);
                                          if (stepId === 5) hasData = !!(d.tanggal_pengembalian || fisik?.urlPengembalian);
                                          if (stepId === 6) hasData = !!(d.nomor_php || d.tanggal_php_1 || d.nomor_php1 || d.tanggal_php || fisik?.urlPhp);
                                          if (stepId === 7) hasData = !!(d.nomor_revisi || d.nomor_revisi_1 || d.tanggal_revisi_1 || d.tanggal_revisi || fisik?.urlRevisi);
                                          if (stepId === 8) hasData = !!(d.tanggal_pengembalian_1 || d.tanggal_pengembalian_2);
                                          if (stepId === 9) hasData = !!(d.nomor_php_1 || d.nomor_php_2 || d.tanggal_php_2);
                                          if (stepId === 10) hasData = !!(d.nomor_risalah || d.nomor_sk || fisik?.rpdArsip || fisik?.urlRpd);
                                          if (stepId === 11) hasData = !!(d.tanggal_penerimaan_jilidan || fisik?.dokumenCetak || fisik?.urlDokumenCetak);
                                          if (stepId === 12) hasData = !!(fisik?.pkplhArsip || fisik?.urlPkplh);

                                          const isPast = currentStageId > stepId;
                                          const isCurrent = currentStageId === stepId;
                                          const isSkipped = isPast && !hasData;
                                          
                                          return (
                                              <div key={stepId} className="relative z-10 flex flex-col items-center gap-2 group flex-1" title={isSkipped ? 'Dilewati / Belum ada data' : ''}>
                                                  <div className={\`w-10 h-10 rounded-full flex items-center justify-center border-4 \${
                                                    isCurrent ? 'border-indigo-100 bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' : 
                                                    isSkipped ? 'border-slate-200 bg-slate-200 text-slate-400' :
                                                    isPast ? 'border-indigo-100 bg-indigo-500 text-white' : 
                                                    'border-slate-100 bg-white text-slate-300'
                                                  } transition-all\`}>
                                                      {stageData && <stageData.icon size={16} />}
                                                  </div>
                                                  <div className={\`absolute top-12 text-center whitespace-nowrap text-[10px] font-black uppercase tracking-tight \${
                                                    isCurrent ? 'text-indigo-600' : 
                                                    isSkipped ? 'text-slate-400' :
                                                    isPast ? 'text-slate-700' : 
                                                    'text-slate-400'
                                                  }\`}>
                                                      {stageData?.shortTitle}
                                                  </div>
                                              </div>
                                          );
                                      })}`.split('\n');

const before = lines.slice(0, startIndex);
const after = lines.slice(endIndex + 1);

const newLines = [...before, ...replacementLines, ...after];
fs.writeFileSync('src/app/perizinan/daftar/page.tsx', newLines.join('\n'), 'utf8');
console.log('Update success!');
