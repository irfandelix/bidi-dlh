const fs = require('fs');
const file = 'src/app/perizinan/pemeriksaan-revisi/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add handleGenerateNomor function
const hookBlock = "  const [tanggalRevisi, setTanggalRevisi] = useState<string>('');";
const generateFn = `  const handleGenerateNomor = async () => {
    setMessage('Men-generate Nomor BA Pemeriksaan Revisi...');
    try {
      const payload: any = {
        revisi_ke: revisiKe,
        status_tahapan: 'Pemeriksaan Revisi', // This triggers generation without finalizing
      };
      payload[\`tanggal_revisi_\${revisiKe}\`] = tanggalRevisi || new Date().toISOString().split('T')[0];

      const res = await fetch(\`/api/perizinan/\${unwrappedParams.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newDoc = await (await fetch(\`/api/perizinan/\${unwrappedParams.id}\`)).json();
        setDoc(newDoc.data);
        setMessage('Nomor berhasil di-generate!');
      } else {
        throw new Error('Gagal men-generate nomor');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };`;

content = content.replace(hookBlock, hookBlock + '\n\n' + generateFn);

// Add window.confirm for back button
const backBtnRegex = /<Link href="\/perizinan\/daftar" className="inline-flex items-center gap-2 text-sm text-on-surface font-bold transition-all bg-surface border border-outline-variant px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow uppercase tracking-wide">[\s\S]*?<\/Link>/m;
const newBackBtn = `<button onClick={() => { if(window.confirm('Tekan Tombol "Simpan" Dahulu agar tersimpan di riwayat perizinan. Yakin ingin kembali?')) router.push('/perizinan/daftar'); }} className="inline-flex items-center gap-2 text-sm text-on-surface font-bold transition-all bg-surface border border-outline-variant px-4 py-2 rounded-xl shadow-sm hover:-translate-y-1 hover:shadow-md uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Dashboard
      </button>`;
content = content.replace(backBtnRegex, newBackBtn);

// Add UI for generate button in form
const uiTarget = `            </div>
          </div>

          <div className="pt-8 border-t border-outline-variant mt-8">`;
const newUI = `            </div>
            
            <div className="md:col-span-2 border border-blue-200 bg-blue-50 p-4 rounded-xl shadow-sm">
              <label className="block text-sm font-bold text-blue-900 mb-2 uppercase">Nomor BA Pemeriksaan Revisi (Revisi {revisiKe})</label>
              {doc[\`nomor_revisi_\${revisiKe}\`] ? (
                <div className="w-full bg-white border border-blue-200 text-blue-900 font-bold text-sm rounded-xl px-4 py-3 shadow-sm">
                  {doc[\`nomor_revisi_\${revisiKe}\`]}
                </div>
              ) : (
                <button type="button" onClick={handleGenerateNomor} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-sm transition-colors text-sm uppercase">
                  Generate Nomor Dahulu
                </button>
              )}
            </div>
          </div>

          <div className="pt-8 border-t border-outline-variant mt-8">`;

content = content.replace(uiTarget, newUI);

fs.writeFileSync(file, content);
console.log('Update success!');
