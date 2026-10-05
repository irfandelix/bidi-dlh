const fs = require('fs');
let c = fs.readFileSync('src/app/perizinan/daftar/page.tsx', 'utf8');

let startUI = c.indexOf('<div className="flex items-center flex-wrap gap-3 w-full xl:w-auto">');
let regexEnd = /<\/div>\s*<\/div>\s*<\/div>\s*<div className="overflow-x-auto">/;
let match = c.substring(startUI).match(regexEnd);

if (startUI > -1 && match) {
    let endUI = startUI + match.index + 6; // 6 is length of </div>
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
              <option value="">Semua Jenis</option>
              <option value="SPPL">SPPL</option>
              <option value="UKL-UPL">UKL-UPL</option>
              <option value="AMDAL">AMDAL</option>
            </select>

            <div className="relative flex-1 md:min-w-[200px]">
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

    c = c.substring(0, startUI) + newUI + c.substring(endUI);
    fs.writeFileSync('src/app/perizinan/daftar/page.tsx', c, 'utf8');
    console.log("Done regex");
} else {
    console.log("UI block not found");
}
