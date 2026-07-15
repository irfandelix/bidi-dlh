const fs = require('fs');
const path = require('path');
const filePath = 'C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\bidi-dlh-app\\src\\app\\perizinan\\registrasi\\page.tsx';

let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add createdDocId state
content = content.replace(
  "const [successMsg, setSuccessMsg] = useState('');",
  "const [successMsg, setSuccessMsg] = useState('');\n  const [createdDocId, setCreatedDocId] = useState<string | null>(null);\n  const [downloading, setDownloading] = useState<string | null>(null);"
);

// 2. Add handleDownload
const handleDownloadFn = `
  const handleDownload = async (type: string) => {
    if (!createdDocId) return;
    setDownloading(type);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: createdDocId, type, stage: 'registrasi' })
      });
      if (!res.ok) throw new Error('Gagal generate dokumen');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`\${type}_\${createdDocId}.docx\`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    } finally {
      setDownloading(null);
    }
  };
`;
content = content.replace(
  "const handleSubmit = async",
  handleDownloadFn + "\n  const handleSubmit = async"
);

// 3. Remove setTimeout redirect, set createdDocId
content = content.replace(
  /setSuccessMsg\('Registrasi berhasil disubmit!'\);\s*setTimeout\(\(\) => \{\s*router\.push\('\/perizinan\/daftar'\);\s*\}, 2000\);/g,
  "setSuccessMsg('Registrasi berhasil disubmit!');\n      setCreatedDocId(result.data.id);"
);

// 4. Update success rendering with buttons, hide form when success
const successUI = `
      {successMsg && (
        <div className="bg-emerald-50 text-slate-900 p-8 rounded-3xl mb-6 border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-400 border-4 border-slate-900 rounded-full flex items-center justify-center mx-auto shadow-[4px_4px_0_0_#0f172a]">
            <CheckCircle size={40} className="text-slate-900" />
          </div>
          <h3 className="text-2xl font-black uppercase text-slate-900">{successMsg}</h3>
          <p className="text-sm font-bold text-slate-600">Silakan cetak Tanda Terima dan Checklist pendaftaran berikut:</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => handleDownload('template_tanda_terima_registrasi')}
              disabled={downloading === 'template_tanda_terima_registrasi'}
              className="w-full sm:w-auto px-6 py-4 bg-amber-400 hover:bg-amber-300 text-slate-900 border-4 border-slate-900 font-black rounded-xl text-sm shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {downloading === 'template_tanda_terima_registrasi' ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
              Cetak Tanda Terima
            </button>
            <button 
              onClick={() => handleDownload('template_checklist')}
              disabled={downloading === 'template_checklist'}
              className="w-full sm:w-auto px-6 py-4 bg-teal-400 hover:bg-teal-300 text-slate-900 border-4 border-slate-900 font-black rounded-xl text-sm shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {downloading === 'template_checklist' ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
              Cetak Checklist
            </button>
          </div>

          <div className="pt-6 mt-6 border-t-4 border-slate-900">
            <button 
              onClick={() => router.push('/perizinan/daftar')}
              className="px-8 py-3 bg-slate-900 text-white border-4 border-slate-900 font-black rounded-xl text-sm shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all uppercase"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      )}

      {!successMsg && (
        <form onSubmit={handleSubmit} className="space-y-8">
`;

content = content.replace(
  /\{successMsg && \([\s\S]*?\}\)/,
  successUI
);

// Make sure to add CheckCircle, Printer to imports if missing
if (!content.includes('CheckCircle,')) {
  content = content.replace(/FilePlus, MapPin, UserCheck \}/, 'FilePlus, MapPin, UserCheck, CheckCircle, Printer }');
}

// Close the conditional form rendering
content = content.replace(
  /<\/form>/,
  '</form>\n      )}'
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('UI injected');
