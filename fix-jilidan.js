const fs = require('fs');
const path = require('path');
const basePath = 'C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\bidi-dlh-app\\src';

const finalisasiPath = path.join(basePath, 'app', 'perizinan', 'finalisasi', '[id]', 'page.tsx');
if (fs.existsSync(finalisasiPath)) {
  let content = fs.readFileSync(finalisasiPath, 'utf-8');
  
  // Find where the form ends and remove any trailing Jilidan fields and buttons.
  // Actually, I can just rewrite the whole return block for Finalisasi.
  // But let's just use string replace.
  content = content.replace(/<div className="relative z-10">\s*<label className="block text-xs font-black text-slate-900 mb-2 uppercase tracking-wider">Tanggal Penerimaan Jilidan[\s\S]*?<\/form>/, '</form>');
  
  // Remove the old save button that was replaced above
  content = content.replace(/<div className="pt-8 border-t-4 border-slate-900 mt-8 flex justify-end">\s*<button type="submit" disabled=\{submitting\}[\s\S]*?<\/button>\s*<\/div>/, '');

  // Wait, I messed up the JSX structure. I will just restore the closing tags.
  content = content.replace(/<\/div>\s*<\/form>/, `
          </div>
          <div className="pt-8 border-t-4 border-slate-900 mt-8 flex justify-end">
            <button type="submit" disabled={submitting} 
              className="w-full sm:w-auto px-10 py-4 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0 text-sm">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              Simpan Data Finalisasi
            </button>
          </div>
        </form>
  `.trim());

  // Update status logic in FinalisasiPage since jilidan is moved
  content = content.replace(/const tglJilidan = formData.get\('tanggal_penerimaan_jilidan'\);[\s\S]*?const payload = \{/, `
    let status_tahapan = 'Selesai / SK';
    if (tglSK) status_tahapan = 'Menunggu Jilidan';

    const payload = {`);
    
  fs.writeFileSync(finalisasiPath, content, 'utf-8');
  console.log('Fixed Finalisasi');
}

const arsipPath = path.join(basePath, 'app', 'perizinan', 'arsip', '[id]', 'page.tsx');
if (fs.existsSync(arsipPath)) {
  let content = fs.readFileSync(arsipPath, 'utf-8');
  
  // Add Jilidan Final section before the grid
  const jilidanUI = `
          {/* Bagian Jilidan */}
          <div className="space-y-4 p-6 border-4 border-slate-900 bg-emerald-100 rounded-2xl shadow-[4px_4px_0_0_#0f172a] mb-8">
            <h3 className="font-black text-slate-900 flex items-center gap-2 text-lg uppercase tracking-wide">
              <span className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-[2px_2px_0_0_#ffffff]">1</span> Jilidan Final
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-900 mb-2 uppercase tracking-wider">Tanggal Penerimaan Jilidan</label>
                <input type="date" name="tanggal_penerimaan_jilidan" defaultValue={doc.tanggal_penerimaan_jilidan || ''}
                  className="w-full bg-white border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl p-3 focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
                <p className="text-[10px] text-slate-700 mt-2 font-bold uppercase">* Kosongkan jika belum menyerahkan jilidan buku final.</p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 mb-2 uppercase tracking-wider">Lokasi Arsip / Lemari (Opsional)</label>
                <input type="text" name="lokasi_arsip" defaultValue={doc.lokasi_arsip || ''} placeholder="Contoh: Lemari A, Rak 3"
                  className="w-full bg-white border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl p-3 focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
              </div>
            </div>
          </div>
  `.trim();

  if (!content.includes('Jilidan Final')) {
    content = content.replace(/<form onSubmit=\{handleSubmit\} className="space-y-6">/, `<form onSubmit={handleSubmit} className="space-y-6">\n${jilidanUI}`);
  }

  // Update handleSubmit payload
  if (!content.includes('tanggal_penerimaan_jilidan')) {
    const payloadUpdate = `
    const tglJilidan = formData.get('tanggal_penerimaan_jilidan');
    let status_tahapan = 'Menunggu Jilidan';
    if (tglJilidan && fisik.dokumenCetak && fisik.pkplhArsip && fisik.suratPermohonan && fisik.undanganSidang) {
      status_tahapan = 'Diarsipkan';
    }

    const payload = {
      tanggal_penerimaan_jilidan: tglJilidan,
      lokasi_arsip: formData.get('lokasi_arsip'),
      status_tahapan,
      arsip_fisik: JSON.stringify(fisik),
    };
    `;
    content = content.replace(/const payload = \{\s*arsip_fisik: JSON\.stringify\(fisik\),\s*\};/, payloadUpdate);
  }

  fs.writeFileSync(arsipPath, content, 'utf-8');
  console.log('Fixed Arsip');
}
