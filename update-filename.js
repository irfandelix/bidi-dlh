const fs = require('fs');
const path = require('path');
const basePath = 'C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\bidi-dlh-app\\src';

// 1. Update backend API route
const apiPath = path.join(basePath, 'app', 'api', 'generate', 'route.ts');
if (fs.existsSync(apiPath)) {
  let content = fs.readFileSync(apiPath, 'utf-8');
  // From: filename="${type}_${(doc.nama_pemrakarsa || 'dokumen').replace(/\\s+/g, '_')}.docx"
  // To: filename="${type}_${(doc.nama_kegiatan || 'kegiatan').replace(/\\s+/g, '_')}_${(doc.nama_pemrakarsa || 'pemrakarsa').replace(/\\s+/g, '_')}.docx"
  content = content.replace(
    /filename=\"\$\{type\}_\$\{\(doc\.nama_pemrakarsa \|\| 'dokumen'\)\.replace\(\/\\\\s\+\/g, '_'\)\}\.docx\"/g,
    'filename="${type}_${(doc.nama_kegiatan || \'kegiatan\').replace(/\\\\s+/g, \'_\')}_${(doc.nama_pemrakarsa || \'pemrakarsa\').replace(/\\\\s+/g, \'_\')}.docx"'
  );
  fs.writeFileSync(apiPath, content, 'utf-8');
  console.log('Updated ' + apiPath);
}

// 2. Update CetakClient.tsx
const cetakClientPath = path.join(basePath, 'app', 'perizinan', 'cetak', '[id]', 'CetakClient.tsx');
if (fs.existsSync(cetakClientPath)) {
  let content = fs.readFileSync(cetakClientPath, 'utf-8');
  // From: a.download = `${type}_${doc.nama_pemrakarsa?.replace(/\s+/g, '_') || 'dokumen'}.docx`;
  // To: a.download = `${type}_${doc.nama_kegiatan?.replace(/\s+/g, '_') || 'kegiatan'}_${doc.nama_pemrakarsa?.replace(/\s+/g, '_') || 'pemrakarsa'}.docx`;
  content = content.replace(
    /a\.download = `\$\{type\}_\$\{doc\.nama_pemrakarsa\?\.replace\(\/\\\\s\+\/g, '_'\) \|\| 'dokumen'\}\.docx`;/g,
    'a.download = `${type}_${doc.nama_kegiatan?.replace(/\\\\s+/g, \'_\') || \'kegiatan\'}_${doc.nama_pemrakarsa?.replace(/\\\\s+/g, \'_\') || \'pemrakarsa\'}.docx`;'
  );
  fs.writeFileSync(cetakClientPath, content, 'utf-8');
  console.log('Updated ' + cetakClientPath);
}

// 3. Update registrasi page.tsx (doesn't have doc data in handleDownload, so we just use the ID there since it's an immediate download after form submission, or we can fetch it. Actually, wait! The registrasi page handleDownload uses createdDocId. It doesn't have nama_kegiatan!)
const registrasiPath = path.join(basePath, 'app', 'perizinan', 'registrasi', 'page.tsx');
if (fs.existsSync(registrasiPath)) {
  let content = fs.readFileSync(registrasiPath, 'utf-8');
  // The API will send the proper filename in Content-Disposition header.
  // When using a.download in fetch, if we just use a default name it might override it, 
  // but let's try to extract filename from Content-Disposition if possible, or just let it be.
  // Actually, we can just leave it as type_id.docx for the registrasi page fallback, 
  // or parse the header. Let's parse the header to be perfect!
  const betterDownload = `
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      let filename = \\\`\\\${type}_\\\${createdDocId}.docx\\\`;
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const filenameRegex = /filename[^;=\\n]*=((['"]).*?\\2|[^;\\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
`;
  content = content.replace(
    /const blob = await res\.blob\(\);\s+const url = window\.URL\.createObjectURL\(blob\);\s+const a = document\.createElement\('a'\);\s+a\.href = url;\s+a\.download = `\$\{type\}_\$\{createdDocId\}\.docx`;/,
    betterDownload.trim()
  );
  fs.writeFileSync(registrasiPath, content, 'utf-8');
  console.log('Updated ' + registrasiPath);
}

// 4. Also update CetakClient to use Content-Disposition parsing so it's perfectly consistent
if (fs.existsSync(cetakClientPath)) {
  let content = fs.readFileSync(cetakClientPath, 'utf-8');
  const betterDownloadCetak = `
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      let filename = \\\`\\\${type}_\\\${doc.id}.docx\\\`;
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const filenameRegex = /filename[^;=\\n]*=((['"]).*?\\2|[^;\\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
`;
  content = content.replace(
    /const blob = await res\.blob\(\);\s+const url = window\.URL\.createObjectURL\(blob\);\s+const a = document\.createElement\('a'\);\s+a\.href = url;\s+a\.download = `\$\{type\}_\$\{doc\.nama_kegiatan\?\.replace[^\n]+`;/,
    betterDownloadCetak.trim()
  );
  fs.writeFileSync(cetakClientPath, content, 'utf-8');
  console.log('Updated ' + cetakClientPath + ' to use header parsing');
}
