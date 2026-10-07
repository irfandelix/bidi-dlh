const fs = require('fs');
const file = 'src/app/perizinan/pengembalian/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('Form Pengembalian Dokumen', 'Form Penyerahan BA ke Pemrakarsa (MPP)');
content = content.replace('BERKAS DIKEMBALIKAN', 'PENYERAHAN BERKAS KE PEMRAKARSA');
content = content.replace('Riwayat Pengembalian Revisi', 'Riwayat Penyerahan BA Revisi');
content = content.replace('Pengembalian: {new Date(tanggal)', 'Penyerahan: {new Date(tanggal)');
content = content.replace('Tanggal Dikembalikan', 'Tanggal Penyerahan Berkas');
content = content.replace('Simpan Pengembalian', 'Simpan Penyerahan');
content = content.replace('Status Pengembalian Berhasil Disimpan!', 'Status Penyerahan Berhasil Disimpan!');

fs.writeFileSync(file, content);
console.log('Update pengembalian page done');
