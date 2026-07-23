const fs = require('fs');
let code = fs.readFileSync('src/app/perizinan/arsip/[id]/page.tsx', 'utf8');

// Replace urlRevisi and urlPhp in `fisik` initialization
code = code.replace(
  "      urlPhp: getOldUrl('urlPhp'),\n      urlRevisi: getOldUrl('urlRevisi'),",
  "      urlPhp: getOldUrl('urlPhp'),\n      urlPhp1: getOldUrl('urlPhp1'),\n      urlPhp2: getOldUrl('urlPhp2'),\n      urlPhp3: getOldUrl('urlPhp3'),\n      urlPhp4: getOldUrl('urlPhp4'),\n      urlPhp5: getOldUrl('urlPhp5'),\n      urlRevisi: getOldUrl('urlRevisi'),\n      urlRevisi1: getOldUrl('urlRevisi1'),\n      urlRevisi2: getOldUrl('urlRevisi2'),\n      urlRevisi3: getOldUrl('urlRevisi3'),\n      urlRevisi4: getOldUrl('urlRevisi4'),\n      urlRevisi5: getOldUrl('urlRevisi5'),"
);

// Add loop to upload revisions and PHP
code = code.replace(
  "    const f10 = formData.get('file_php') as File;\n    if (f10 && f10.size > 0) { const url = await uploadFile(f10); if(url) fisik.urlPhp = url; }\n\n    const f12 = formData.get('file_revisi') as File;\n    if (f12 && f12.size > 0) { const url = await uploadFile(f12); if(url) fisik.urlRevisi = url; }",
  `    const f10 = formData.get('file_php') as File;
    if (f10 && f10.size > 0) { const url = await uploadFile(f10); if(url) fisik.urlPhp = url; }
    for(let i=1; i<=5; i++) {
      const fx = formData.get('file_php' + i) as File;
      if (fx && fx.size > 0) { const url = await uploadFile(fx); if(url) fisik['urlPhp'+i] = url; }
    }
    const f12 = formData.get('file_revisi') as File;
    if (f12 && f12.size > 0) { const url = await uploadFile(f12); if(url) fisik.urlRevisi = url; }
    for(let i=1; i<=5; i++) {
      const fy = formData.get('file_revisi' + i) as File;
      if (fy && fy.size > 0) { const url = await uploadFile(fy); if(url) fisik['urlRevisi'+i] = url; }
    }`
);

// Add revisiList and phpList mapping
code = code.replace(
  `  let latestNomorRevisi = '';
  for (let i = 5; i >= 1; i--) {
    if (doc[\`nomor_revisi_\${i}\`]) {
      latestNomorRevisi = doc[\`nomor_revisi_\${i}\`];
      break;
    }
  }
  
  let latestNomorPhp = doc.nomor_php || '';
  for (let i = 5; i >= 1; i--) {
    if (doc[\`nomor_php\${i}\`]) {
      latestNomorPhp = doc[\`nomor_php\${i}\`];
      break;
    }
  }`,
  `  const revisiList = [];
  if (doc.nomor_revisi) revisiList.push({ key: '', nomor: doc.nomor_revisi, title: 'BA Pemeriksaan Revisi' });
  for (let i = 1; i <= 5; i++) {
    if (doc[\`nomor_revisi_\${i}\`]) {
      revisiList.push({ key: i, nomor: doc[\`nomor_revisi_\${i}\`], title: 'BA Pemeriksaan Revisi ' + i });
    }
  }

  const phpList = [];
  if (doc.nomor_php) phpList.push({ key: '', nomor: doc.nomor_php, title: 'Penerimaan Perbaikan / PHP' });
  for (let i = 1; i <= 5; i++) {
    if (doc[\`nomor_php\${i}\`]) {
      phpList.push({ key: i, nomor: doc[\`nomor_php\${i}\`], title: 'Penerimaan Perbaikan / PHP ' + i });
    }
  }`
);

// Replace the UI block for BA Pemeriksaan Revisi
const revisiUi = `            {/* 6. BA PEMERIKSAAN REVISI */}
            {revisiList.length > 0 ? revisiList.map((rev, idx) => (
              <div key={rev.key} className={\`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors \${fisik['urlRevisi' + rev.key] ? 'bg-emerald-200' : 'bg-slate-50'}\`}>
                <div className="flex items-start gap-3 w-full">
                  <div className="mt-1"><CheckCircle2 size={24} className="text-slate-900" /></div>
                  <div className="w-full">
                    <p className="text-sm font-black uppercase tracking-wider text-slate-900">6.{String.fromCharCode(97 + idx)} {rev.title}</p>
                    <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">{rev.nomor}</p>
                    <div className="mt-4 pt-4 border-t-2 border-slate-900">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-slate-900 font-black uppercase">Upload Arsip (PDF)</label>
                        {fisik['urlRevisi' + rev.key] && (
                          <a href={fisik['urlRevisi' + rev.key]} target="_blank" rel="noreferrer" className="text-xs font-bold bg-indigo-200 text-slate-900 px-3 py-1 rounded border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#0f172a] transition-all uppercase">Lihat Dokumen</a>
                        )}
                      </div>
                      <input type="file" name={\`file_revisi\${rev.key}\`} accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors bg-slate-50">
                <div className="flex items-start gap-3 w-full">
                  <div className="mt-1"><XCircle size={24} className="text-slate-400" /></div>
                  <div className="w-full">
                    <p className="text-sm font-black uppercase tracking-wider text-slate-900">6. BA Pemeriksaan Revisi</p>
                    <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">Belum terbit</p>
                  </div>
                </div>
              </div>
            )}`;

const regexRevisi = /\{\/\* 6\. BA PEMERIKSAAN REVISI \*\/\}.*?(?=\{\/\* 7\. SURAT PERMOHONAN \*\/\})/s;
code = code.replace(regexRevisi, revisiUi + '\n\n            ');

// Replace the UI block for PHP
const phpUi = `            {/* 10. PHP */}
            {phpList.length > 0 ? phpList.map((php, idx) => (
              <div key={php.key} className={\`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors \${fisik['urlPhp' + php.key] ? 'bg-emerald-200' : 'bg-slate-50'}\`}>
                <div className="flex items-start gap-3 w-full">
                  <div className="mt-1"><CheckCircle2 size={24} className="text-slate-900" /></div>
                  <div className="w-full">
                    <p className="text-sm font-black uppercase tracking-wider text-slate-900">10.{String.fromCharCode(97 + idx)} {php.title}</p>
                    <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">{php.nomor}</p>
                    <div className="mt-4 pt-4 border-t-2 border-slate-900">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-slate-900 font-black uppercase">Upload Arsip (PDF)</label>
                        {fisik['urlPhp' + php.key] && (
                          <a href={fisik['urlPhp' + php.key]} target="_blank" rel="noreferrer" className="text-xs font-bold bg-indigo-200 text-slate-900 px-3 py-1 rounded border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#0f172a] transition-all uppercase">Lihat Dokumen</a>
                        )}
                      </div>
                      <input type="file" name={\`file_php\${php.key}\`} accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors bg-slate-50">
                <div className="flex items-start gap-3 w-full">
                  <div className="mt-1"><XCircle size={24} className="text-slate-400" /></div>
                  <div className="w-full">
                    <p className="text-sm font-black uppercase tracking-wider text-slate-900">10. Penerimaan Perbaikan / PHP</p>
                    <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">Belum terbit</p>
                  </div>
                </div>
              </div>
            )}`;

const regexPhp = /\{\/\* 10\. PHP \*\/\}.*?(?=\{\/\* 11\. UNDANGAN SIDANG \*\/\})/s;
code = code.replace(regexPhp, phpUi + '\n\n            ');

fs.writeFileSync('src/app/perizinan/arsip/[id]/page.tsx', code);
console.log('Modified page.tsx');
