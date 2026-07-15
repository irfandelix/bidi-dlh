const fs = require('fs');
const path = require('path');

const dirs = [
  'arsip',
  'finalisasi',
  'pemeriksaan-revisi',
  'pemeriksaan-substansi',
  'penerimaan-perbaikan',
  'pengembalian',
  'uji-administrasi',
  'verifikasi-lapangan'
];

const basePath = 'C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\bidi-dlh-app\\src\\app\\perizinan';

for (const dir of dirs) {
  const filePath = path.join(basePath, dir, '[id]', 'page.tsx');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace the params prop type
    content = content.replace(/\{ params \}: \{ params: \{ id: string \} \}/g, '{ params }: { params: Promise<{ id: string }> }');
    
    // Import `use` from react if not already
    content = content.replace(/import \{ ([^}]+) \} from 'react';/, (match, p1) => {
      const imports = p1.split(',').map(s => s.trim());
      if (!imports.includes('use')) {
        imports.unshift('use');
      }
      return `import { ${imports.join(', ')} } from 'react';`;
    });

    // Add `const unwrappedParams = use(params);` right after the component declaration if not there
    if (!content.includes('const unwrappedParams = use(params);')) {
      content = content.replace(/(export default function [a-zA-Z]+\(.*\) \{)/, '$1\n  const unwrappedParams = use(params);');
    }

    // Replace all `params.id` with `unwrappedParams.id` inside the component body
    content = content.replace(/params\.id/g, 'unwrappedParams.id');

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}
