const fs = require('fs');
let code = fs.readFileSync('src/app/perizinan/arsip/[id]/page.tsx', 'utf8');

if (!code.includes('const [downloading, setDownloading] = useState(false)')) {
  code = code.replace(
    'const [doc, setDoc] = useState<any>(null);',
    'const [doc, setDoc] = useState<any>(null);\n  const [downloading, setDownloading] = useState(false);'
  );

  const downloadLogic = `  const handleDownload = async () => {
    setDownloading(true);
    try {
      const payload = { id: doc.id, type: 'arsip', stage: 'arsip-perizinan' };
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Gagal generate dokumen. Pastikan file src/templates/arsip-perizinan/arsip.docx tersedia.');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`Lembar_Arsip_\${doc.id}.docx\`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    } finally {
      setDownloading(false);
    }
  };`;

  code = code.replace(
    'const router = useRouter();',
    'const router = useRouter();\n' + downloadLogic
  );
}

// Replace the button
code = code.replace(
  /<button onClick=\{\(\) => window\.open\(\`\/perizinan\/cetak-arsip\/\$\{doc\.id\}\`, '_blank'\)\} className=\"px-6 py-3 bg-indigo-300[\s\S]*?<\/button>/,
  `<button onClick={handleDownload} disabled={downloading} className="px-6 py-3 bg-indigo-300 hover:bg-indigo-400 text-slate-900 font-black border-2 border-slate-900 rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 transition-all uppercase flex items-center gap-2 tracking-wider text-sm whitespace-nowrap disabled:opacity-50">
          {downloading ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />} 
          {downloading ? 'Memproses...' : 'Cetak Lembar Arsip (DOCX)'}
        </button>`
);

fs.writeFileSync('src/app/perizinan/arsip/[id]/page.tsx', code);
console.log('Modified arsip/[id]/page.tsx');
