const fs = require('fs');
const file = 'src/app/perizinan/daftar/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "{d.status_tahapan || 'Registrasi'}",
  "{d.status_tahapan === 'Pengembalian BA' ? 'MENUNGGU PENYERAHAN BA OLEH MPP' : d.status_tahapan === 'Pengembalian Revisi' ? 'MENUNGGU PENYERAHAN BA REVISI OLEH MPP' : d.status_tahapan || 'Registrasi'}"
);

fs.writeFileSync(file, content);
console.log('Update status text done');
