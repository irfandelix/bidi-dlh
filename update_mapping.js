const fs = require('fs');
const file = 'src/app/perizinan/daftar/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Move DIKEMBALIKAN from 5 to 6
content = content.replace(
  "statuses: ['Pengembalian BA', 'Dikembalikan / Ditolak', 'DIKEMBALIKAN']",
  "statuses: ['Pengembalian BA', 'Dikembalikan / Ditolak']"
);
content = content.replace(
  "title: '6. Terima Perbaikan (MPP)', shortTitle: 'Terima BA (MPP)', statuses: [],",
  "title: '6. Terima Perbaikan (MPP)', shortTitle: 'Terima BA (MPP)', statuses: ['DIKEMBALIKAN'],"
);

// Map Dikembalikan Revisi to 9
content = content.replace(
  "title: '9. Terima Revisi (MPP)', shortTitle: 'Terima Revisi (MPP)', statuses: [],",
  "title: '9. Terima Revisi (MPP)', shortTitle: 'Terima Revisi (MPP)', statuses: ['Dikembalikan Revisi'],"
);

fs.writeFileSync(file, content);
console.log('Update stages mapping done');
