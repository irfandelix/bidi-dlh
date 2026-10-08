const fs = require('fs');
const file = 'src/app/perizinan/daftar/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetText = "d.status_tahapan === 'Pengembalian BA' ? 'MENUNGGU PENYERAHAN BA OLEH MPP' : d.status_tahapan === 'Pengembalian Revisi' ? 'MENUNGGU PENYERAHAN BA REVISI OLEH MPP' : d.status_tahapan || 'Registrasi'";
const replaceText = "d.status_tahapan === 'Pengembalian BA' ? 'MENUNGGU PENYERAHAN BA OLEH MPP' : d.status_tahapan === 'Pengembalian Revisi' ? 'MENUNGGU PENYERAHAN BA REVISI OLEH MPP' : d.status_tahapan === 'DIKEMBALIKAN' ? 'MENUNGGU TERIMA PERBAIKAN BA OLEH MPP' : d.status_tahapan === 'Dikembalikan Revisi' ? 'MENUNGGU TERIMA PERBAIKAN REVISI OLEH MPP' : d.status_tahapan || 'Registrasi'";

content = content.replace(targetText, replaceText);

fs.writeFileSync(file, content);
console.log('Update progress header text done');
