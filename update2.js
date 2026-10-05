const fs = require('fs');

let content = fs.readFileSync('src/app/perizinan/daftar/page.tsx', 'utf8');

// 1. Rename table header
content = content.replace(
  '<th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-200">Kegiatan & Pemrakarsa</th>',
  '<th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-200">Nama Kegiatan</th>'
);

// 2. Remove pemrakarsa from main row
content = content.replace(
  '{d.nama_pemrakarsa}',
  ''
);

// 3. Define the accordion render function
const renderAccordionFunc = `
  const renderAccordionContent = (d: any) => {
    let fisik: any = {};
    try {
      if (d.arsip_fisik) {
        fisik = typeof d.arsip_fisik === 'string' ? JSON.parse(d.arsip_fisik) : d.arsip_fisik;
        if (typeof fisik === 'string') fisik = JSON.parse(fisik);
      }
    } catch (e) {}

    const sections = [
      { title: '1. Dokumen Lingkungan Final', number: fisik?.noDokumenCetak, url: fisik?.urlDokumenCetak, status: fisik?.dokumenCetak || fisik?.urlDokumenCetak },
      { title: '2. PKPLH Arsip', number: fisik?.noPkplhArsip, url: fisik?.urlPkplh, status: fisik?.pkplhArsip || fisik?.urlPkplh },
      { title: '3. BA Uji Administrasi', number: d.nomor_uji_berkas, url: fisik?.urlUjiAdmin, status: d.nomor_uji_berkas || fisik?.urlUjiAdmin },
      { title: '4. BA Verlap', number: d.nomor_ba_verlap, url: fisik?.urlBaVerlap, status: d.nomor_ba_verlap || fisik?.urlBaVerlap },
      { title: '5. BA Pemeriksaan/Sidang', number: d.nomor_ba_pemeriksaan, url: fisik?.urlBaSidang, status: d.nomor_ba_pemeriksaan || fisik?.urlBaSidang },
      { title: '6. BA Pemeriksaan Revisi', number: d.nomor_revisi, url: fisik?.urlRevisi, status: d.nomor_revisi || fisik?.urlRevisi },
      { title: '7. Surat Permohonan (Awal)', number: fisik?.noSuratPermohonan, url: fisik?.urlSuratPermohonan, status: fisik?.suratPermohonan || fisik?.urlSuratPermohonan },
      { title: '8. Lembar Registrasi', number: d.nomor_checklist, url: fisik?.urlRegistrasi, status: d.nomor_checklist || fisik?.urlRegistrasi },
      { title: '9. Lembar Pengembalian', number: d.tanggal_pengembalian, url: fisik?.urlPengembalian, status: d.tanggal_pengembalian || fisik?.urlPengembalian },
      { title: '10. Penerimaan Perbaikan / PHP', number: d.nomor_php, url: fisik?.urlPhp, status: d.nomor_php || fisik?.urlPhp },
      { title: '11. Undangan Sidang', number: fisik?.noUndanganSidang, url: fisik?.urlUndanganSidang, status: fisik?.undanganSidang || fisik?.urlUndanganSidang },
      { title: d.jenis_dokumen === 'SPPL' ? '12. Pengesahan SPPL' : '12. Penyusunan RPD', number: d.jenis_dokumen === 'SPPL' ? fisik?.noRpdArsip : d.nomor_risalah, url: fisik?.urlRpd, status: d.nomor_risalah || fisik?.rpdArsip || fisik?.urlRpd },
    ];

    return (
      <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 shadow-sm text-left">
        <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex flex-col sm:flex-row gap-6 justify-between items-start">
           <div className="flex-1">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Nama Pemrakarsa</h4>
              <p className="text-sm font-bold text-slate-900 uppercase">{d.nama_pemrakarsa || '-'}</p>
           </div>
           <div className="flex-1">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Lokasi Arsip / Lemari</h4>
              <p className="text-sm font-bold text-slate-900">{d.lokasi_arsip || '-'}</p>
           </div>
           <div className="flex-1">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Titik Koordinat (Peta)</h4>
              <p className="text-sm font-bold text-slate-900">{d.latitude && d.longitude ? \`\${d.latitude}, \${d.longitude}\` : '-'}</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sections.map(s => (
             <div key={s.title} className={\`p-4 rounded-xl border \${s.status ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}\`}>
                <div className="flex items-start gap-3">
                   <div className="mt-0.5">{s.status ? <CheckCircle size={16} className="text-emerald-600"/> : <CircleDashed size={16} className="text-slate-300"/>}</div>
                   <div className="flex-1">
                      <p className="text-xs font-black uppercase text-slate-800 leading-tight mb-2">{s.title}</p>
                      <div className="bg-white/60 px-2 py-1.5 rounded border border-slate-200/60 min-h-7 flex items-center">
                         {s.number ? <p className="text-[10px] font-bold text-slate-700 uppercase">{s.number}</p> : <p className="text-[10px] font-bold text-slate-400 uppercase">BELUM ADA NOMOR</p>}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-slate-200/50">
                        {s.url ? (
                          <a href={s.url} onClick={e => e.stopPropagation()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-black bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors border border-emerald-200 shadow-sm w-fit">
                             <FileText size={12}/> LIHAT DOKUMEN
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 w-fit">
                             <FileText size={12}/> BELUM UPLOAD
                          </span>
                        )}
                      </div>
                   </div>
                </div>
             </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {`;

content = content.replace("if (loading) {", renderAccordionFunc);

// 4. Replace the old accordion HTML with a call to renderAccordionContent
let regexAccordion = /<td colSpan=\{5\}.*?<\/td>/s;
content = content.replace(regexAccordion, "<td colSpan={5} className=\"p-6 border-r-2 border-l-2 border-slate-200\">\n                            {renderAccordionContent(d)}\n                          </td>");

fs.writeFileSync('src/app/perizinan/daftar/page.tsx', content, 'utf8');

console.log("Updated page.tsx!");
