const fs = require('fs');
const file = 'src/app/perizinan/daftar/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Revert short titles
content = content.replace("shortTitle: 'Serahkan BA (MPP)'", "shortTitle: 'Penyerahan BA (MPP)'");
content = content.replace("shortTitle: 'Serahkan Rev (MPP)'", "shortTitle: 'Penyerahan Revisi (MPP)'");
content = content.replace("shortTitle: 'Terima Rev (MPP)'", "shortTitle: 'Terima Revisi (MPP)'");

// Update CSS classes for text wrapping
const oldClassStr = "absolute top-12 text-center whitespace-nowrap text-[10px] font-black uppercase tracking-tight flex flex-col items-center gap-1";
const newClassStr = "absolute top-12 text-center text-[10px] w-24 leading-[1.1] font-black uppercase tracking-tight flex flex-col items-center gap-1.5";

content = content.replace(oldClassStr, newClassStr);

fs.writeFileSync(file, content);
console.log('Update text wrapping done');
