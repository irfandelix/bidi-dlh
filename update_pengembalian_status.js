const fs = require('fs');
const file = 'src/app/perizinan/pengembalian/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const status_tahapan = 'DIKEMBALIKAN';",
  "const isRevisi = doc?.status_tahapan?.toLowerCase().includes('revisi');\n    const status_tahapan = isRevisi ? 'Dikembalikan Revisi' : 'DIKEMBALIKAN';"
);
content = content.replace(
  "const isRevisi = doc.status_tahapan?.toLowerCase().includes('revisi');",
  "// isRevisi already declared above"
);

fs.writeFileSync(file, content);
console.log('Update status done');
