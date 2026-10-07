const fs = require('fs');
const file = 'src/app/perizinan/daftar/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("shortTitle: 'Penyerahan BA (MPP)'", "shortTitle: 'Serahkan BA (MPP)'");
content = content.replace("shortTitle: 'Penyerahan Revisi (MPP)'", "shortTitle: 'Serahkan Rev (MPP)'");
content = content.replace("shortTitle: 'Terima Revisi (MPP)'", "shortTitle: 'Terima Rev (MPP)'");

fs.writeFileSync(file, content);
console.log('Short titles updated');
