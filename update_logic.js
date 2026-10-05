const fs = require('fs');

let c = fs.readFileSync('src/app/perizinan/daftar/page.tsx', 'utf8');

const oldLogic = `  // Filter docs based on active group
  const activeDocs = docs.filter(d => {
    const matchesGroup = activeGroup.filterFn(d);
    if (!searchQuery) return matchesGroup;
    
    const query = searchQuery.toLowerCase();
    const matchNama = d.nama_kegiatan?.toLowerCase().includes(query);
    const matchLokasi = d.lokasi_kegiatan?.toLowerCase().includes(query);
    const matchTanggal = d.tanggal_masuk_dokumen?.toLowerCase().includes(query) || d.created_at?.toLowerCase().includes(query);
    
    return matchesGroup && (matchNama || matchLokasi || matchTanggal);
  });`;

const newLogic = `  // Filter docs based on active group
  const activeDocs = docs.filter(d => {
    const matchesGroup = activeGroup.filterFn(d);
    if (!matchesGroup) return false;
    
    if (filterTahun && String(d.tahun) !== String(filterTahun)) return false;
    if (filterJenis && d.jenis_dokumen !== filterJenis) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchNama = d.nama_kegiatan?.toLowerCase().includes(query);
      const matchLokasi = d.lokasi_kegiatan?.toLowerCase().includes(query);
      const matchTanggal = d.tanggal_masuk_dokumen?.toLowerCase().includes(query) || d.created_at?.toLowerCase().includes(query);
      const matchPemrakarsa = d.nama_pemrakarsa?.toLowerCase().includes(query);
      
      if (!matchNama && !matchLokasi && !matchTanggal && !matchPemrakarsa) return false;
    }
    
    return true;
  });

  const handleExportExcel = () => {
    const dataToExport = activeDocs.map((d, index) => {
      let fisik: any = {};
      try {
        if (d.arsip_fisik) {
          fisik = typeof d.arsip_fisik === 'string' ? JSON.parse(d.arsip_fisik) : d.arsip_fisik;
          if (typeof fisik === 'string') fisik = JSON.parse(fisik);
        }
      } catch(e) {}
      
      return {
        "NO": index + 1,
        "TAHUN": d.tahun || '-',
        "NO URUT": d.no_urut || d.id,
        "NAMA PEMRAKARSA": d.nama_pemrakarsa || '-',
        "JENIS KEGIATAN": d.jenis_kegiatan || '-',
        "LOKASI KEGIATAN": d.lokasi_kegiatan || '-',
        "JENIS DOKUMEN": d.jenis_dokumen || '-',
        "STATUS TAHAPAN": d.status_tahapan || '-',
        "TANGGAL MASUK": d.tanggal_masuk_dokumen || '-',
        "TANGGAL UJI ADMIN": d.tanggal_uji_berkas || '-',
        "TANGGAL VERLAP": d.tanggal_ba_verlap || '-',
        "TANGGAL SIDANG": d.tanggal_ba_pemeriksaan || '-',
        "NOMOR CHECKLIST": d.nomor_checklist || '-',
        "NOMOR BA UJI": d.nomor_uji_berkas || '-',
        "NOMOR BA VERLAP": d.nomor_ba_verlap || '-',
        "NOMOR BA SIDANG": d.nomor_ba_pemeriksaan || '-',
        "LOKASI ARSIP": d.lokasi_arsip || '-',
        "KOORDINAT": (d.latitude && d.longitude) ? \`\${d.latitude}, \${d.longitude}\` : '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Arsip Perizinan");
    
    const fileName = \`Laporan_Arsip_Perizinan_\${new Date().toISOString().split('T')[0]}.xlsx\`;
    XLSX.writeFile(workbook, fileName);
  };`;

// Also update UI for export and filters
const oldUI = `<div className="flex items-center flex-wrap gap-3 w-full xl:w-auto">
            <div className="relative flex-1 md:min-w-[300px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari nama, lokasi, tanggal..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border-2 border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-400 shadow-sm transition-colors"
              />
            </div>
          </div>`;

const newUI = `<div className="flex items-center flex-wrap gap-3 w-full xl:w-auto">
            <select 
              value={filterTahun}
              onChange={(e) => { setFilterTahun(e.target.value); setCurrentPage(1); }}
              className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-400 cursor-pointer shadow-sm"
            >
              <option value="">Semua Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>

            <select 
              value={filterJenis}
              onChange={(e) => { setFilterJenis(e.target.value); setCurrentPage(1); }}
              className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-400 cursor-pointer shadow-sm"
            >
              <option value="">Semua Dokumen</option>
              <option value="SPPL">SPPL</option>
              <option value="UKL-UPL">UKL-UPL</option>
              <option value="AMDAL">AMDAL</option>
              <option value="DELH">DELH</option>
              <option value="DPLH">DPLH</option>
            </select>

            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari nama, lokasi..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border-2 border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-400 shadow-sm transition-colors"
              />
            </div>

            <button 
              onClick={handleExportExcel}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm border border-emerald-600"
            >
              <Download size={18} /> Ekspor Excel
            </button>
          </div>`;

c = c.replace(oldLogic.replace(/\r\n/g, '\n'), newLogic.replace(/\r\n/g, '\n'));
// If the exact match fails due to CR/LF issues:
let startLogic = c.indexOf('  // Filter docs based on active group');
let endLogic = c.indexOf('  });', startLogic);
if (startLogic > -1 && endLogic > -1) {
    c = c.substring(0, startLogic) + newLogic + c.substring(endLogic + 5);
}

let startUI = c.indexOf('<div className="flex items-center flex-wrap gap-3 w-full xl:w-auto">');
let endUI = c.indexOf('</div>\n          </div>', startUI);
if (startUI > -1 && endUI > -1) {
    c = c.substring(0, startUI) + newUI + c.substring(endUI + 6);
}

fs.writeFileSync('src/app/perizinan/daftar/page.tsx', c, 'utf8');
console.log("Done");
