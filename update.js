const fs = require('fs');

let content = fs.readFileSync('src/app/perizinan/daftar/page.tsx', 'utf8');

// 1. Add imports
content = content.replace("import { useEffect, useState } from 'react';", "import React, { useEffect, useState } from 'react';");
content = content.replace("Search, Info", "Search, Info, ChevronDown, ChevronUp");

// 2. Add state
content = content.replace("const [searchQuery, setSearchQuery] = useState('');", "const [searchQuery, setSearchQuery] = useState('');\n  const [expandedRows, setExpandedRows] = useState<number[]>([]);\n  const toggleRow = (id: number) => setExpandedRows(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);");

// 3. Update filterFn
content = content.replace(
  "filterFn: (d: any) => ['Arsip', 'Diarsipkan', 'ARSIP', 'Jilidan Selesai'].includes(d.status_tahapan) || d.lokasi_arsip",
  "filterFn: (d: any) => true"
);

// 4. Update the archive row mapping
let oldTrStart = "<tr key={d.id} className=\"hover:bg-slate-50 transition-colors\">";
let newTrStart = "<React.Fragment key={d.id}>\n                    <tr onClick={() => toggleRow(d.id)} className=\"hover:bg-slate-50 transition-colors cursor-pointer group\">";
content = content.replace(oldTrStart, newTrStart);

let oldTdUrut = "<span className=\"bg-emerald-100 text-emerald-800 font-black px-2 py-1 rounded border border-emerald-200 text-xs shadow-sm\">";
let newTdUrut = "<div className=\"flex items-center gap-2\">\n                          <button className=\"w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center group-hover:bg-indigo-200 group-hover:text-indigo-700 transition-colors\">\n                            {expandedRows.includes(d.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}\n                          </button>\n                          <span className=\"bg-emerald-100 text-emerald-800 font-black px-2 py-1 rounded border border-emerald-200 text-xs shadow-sm\">";
content = content.replace(oldTdUrut, newTdUrut);

let closeSpan = "</span>\n                      </td>";
content = content.replace(closeSpan, "</span>\n                        </div>\n                      </td>");

let oldAksiTd = "<td className=\"px-6 py-4 text-center\">\n                        <div className=\"flex flex-col gap-2\">\n                          <Link \n                            href={/perizinan/arsip/}\n                            className=\"bg-emerald-400 hover:bg-emerald-300 text-slate-900 text-xs font-black px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all flex items-center justify-center gap-1 uppercase\"\n                            title=\"Buka Detail Arsip\"\n                          >\n                            <Info size={14} /> Detail\n                          </Link>\n                          <Link \n                            href={/perizinan/cetak/}\n                            className=\"bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all flex items-center justify-center gap-1 uppercase\"\n                            title=\"Pusat Cetak Dokumen\"\n                          >\n                            <Printer size={14} /> Cetak\n                          </Link>\n                        </div>\n                      </td>\n                    </tr>";
let newAksiTd = oldAksiTd + 
                    {expandedRows.includes(d.id) && (
                      <tr className="bg-slate-50 border-b-2 border-slate-200">
                        <td colSpan={5} className="px-6 py-6 border-r-2 border-l-2 border-slate-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Status Tahapan Saat Ini</h4>
                                <p className="text-sm font-bold text-slate-900 uppercase">
                                  <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 rounded border border-amber-200 shadow-sm mr-2">{d.status_tahapan}</span>
                                </p>
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Lokasi Kegiatan</h4>
                                <p className="text-sm font-bold text-slate-900 uppercase">{d.lokasi_kegiatan || '-'}</p>
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Bidang Usaha</h4>
                                <p className="text-sm font-bold text-slate-900 uppercase">{d.bidang_usaha || '-'}</p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Nomor Registrasi / Checklist</h4>
                                <p className="text-sm font-bold text-slate-900">{d.nomor_checklist || '-'}</p>
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Lokasi Arsip / Letak Rak</h4>
                                <p className="text-sm font-bold text-slate-900">{d.lokasi_arsip || '-'}</p>
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Titik Koordinat (Map)</h4>
                                <p className="text-sm font-bold text-slate-900">{d.latitude && d.longitude ? \\, \\ : '-'}</p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Riwayat Tanggal Penting</h4>
                              <ul className="space-y-2">
                                <li className="flex justify-between items-center border-b border-slate-200 pb-1">
                                  <span className="text-xs font-bold text-slate-500 uppercase">Tgl Masuk</span>
                                  <span className="text-xs font-black text-slate-900">{d.tanggal_masuk_dokumen || '-'}</span>
                                </li>
                                <li className="flex justify-between items-center border-b border-slate-200 pb-1">
                                  <span className="text-xs font-bold text-slate-500 uppercase">Tgl Uji Admin</span>
                                  <span className="text-xs font-black text-slate-900">{d.tanggal_uji_berkas || '-'}</span>
                                </li>
                                <li className="flex justify-between items-center border-b border-slate-200 pb-1">
                                  <span className="text-xs font-bold text-slate-500 uppercase">Tgl Verlap</span>
                                  <span className="text-xs font-black text-slate-900">{d.tanggal_ba_verlap || '-'}</span>
                                </li>
                                <li className="flex justify-between items-center border-b border-slate-200 pb-1">
                                  <span className="text-xs font-bold text-slate-500 uppercase">Tgl Sidang</span>
                                  <span className="text-xs font-black text-slate-900">{d.tanggal_ba_pemeriksaan || '-'}</span>
                                </li>
                              </ul>
                            </div>
                            
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
;
content = content.replace(oldAksiTd, newAksiTd);

fs.writeFileSync('src/app/perizinan/daftar/page.tsx', content, 'utf8');
