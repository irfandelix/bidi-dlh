const fs = require('fs');
const file = 'src/app/perizinan/pemeriksaan-substansi/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add handleGenerateNomor function
const hookBlock = '  const [isUploadingBaSidang, setIsUploadingBaSidang] = useState(false);';
const generateFn = `  const handleGenerateNomor = async () => {
    setMessage('Men-generate Nomor BA Pemeriksaan...');
    try {
      const res = await fetch(\`/api/perizinan/\${unwrappedParams.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomor_ba_pemeriksaan: 'AUTO' })
      });
      if (res.ok) {
        const newDoc = await (await fetch(\`/api/perizinan/\${unwrappedParams.id}\`)).json();
        setDoc(newDoc.data);
        setMessage('Nomor berhasil di-generate!');
      } else {
        throw new Error('Gagal men-generate nomor');
      }
    } catch (err) {
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
const targetUI = '<div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">';
const newTargetUI = targetUI + `
            <div className="md:col-span-2 border border-indigo-200 bg-indigo-50 p-4 rounded-xl shadow-sm mb-2">
              <label className="block text-sm font-bold text-indigo-900 mb-2 uppercase">Nomor BA Pemeriksaan</label>
              {doc.nomor_ba_pemeriksaan ? (
                <div className="w-full bg-white border border-indigo-200 text-indigo-900 font-bold text-sm rounded-xl px-4 py-3 shadow-sm">
                  {doc.nomor_ba_pemeriksaan}
                </div>
              ) : (
                <button type="button" onClick={handleGenerateNomor} className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-sm transition-colors text-sm uppercase">
                  Generate Nomor Dahulu
                </button>
              )}
            </div>`;

content = content.replace(targetUI, newTargetUI);

// Fix payload AUTO
content = content.replace("nomor_ba_pemeriksaan: 'AUTO'", "nomor_ba_pemeriksaan: doc.nomor_ba_pemeriksaan || 'AUTO'");

fs.writeFileSync(file, content);
console.log('Update success!');
