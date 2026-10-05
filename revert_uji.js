const fs = require('fs');
const filepath = 'src/app/perizinan/uji-administrasi/[id]/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');
content = content.replace(/\n\s*"Perjanjian Pengangkutan Sampah \(MOU\)",/g, '');
content = content.replace(/\n\s*"Perjanjian Pengangkutan Limbah B3 \(MOU\)",/g, '');
fs.writeFileSync(filepath, content, 'utf8');
console.log("Reverted");
