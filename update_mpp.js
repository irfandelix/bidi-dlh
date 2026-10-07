const fs = require('fs');
let content = fs.readFileSync('src/app/perizinan/daftar/page.tsx', 'utf8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes('  const stages = ['));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes('  ];'));

if (startIndex === -1 || endIndex === -1) {
    console.log('Cannot find stages block');
    process.exit(1);
}

const replacementLines = `  const stages = [
    { id: 1, title: '1. Registrasi (MPP)', shortTitle: 'Registrasi', statuses: ['Registrasi', 'PROSES'], color: 'slate', icon: FileText, link: '/perizinan/registrasi' },
    { id: 2, title: '2. Uji Admin (DLH)', shortTitle: 'Uji Admin', statuses: ['Uji Administrasi'], color: 'teal', icon: ClipboardCheck, link: '/perizinan/uji-administrasi' },
    { id: 3, title: '3. Verlap (DLH)', shortTitle: 'Verlap', statuses: ['Verifikasi Lapangan', 'Uji Administrasi Selesai'], color: 'amber', icon: MapPin, link: '/perizinan/verifikasi-lapangan' },
    { id: 4, title: '4. Pemeriksaan (DLH)', shortTitle: 'Pemeriksaan', statuses: ['Pemeriksaan Substansi', 'PEMERIKSAAN-SUBSTANSI', 'DIPERIKSA', 'Verlap Selesai'], color: 'indigo', icon: FileText, link: '/perizinan/pemeriksaan-substansi' },
    { id: 5, title: '5. Pengembalian BA (MPP)', shortTitle: 'Pengembalian', statuses: ['Pengembalian BA', 'Dikembalikan / Ditolak', 'DIKEMBALIKAN'], color: 'rose', icon: RotateCcw, link: '/perizinan/pengembalian' },
    { id: 6, title: '6. Terima Perbaikan (MPP)', shortTitle: 'Terima BA', statuses: [], color: 'emerald', icon: CheckCircle, link: '/perizinan/penerimaan-perbaikan' },
    { id: 7, title: '7. Pemeriksaan Revisi (DLH)', shortTitle: 'Revisi', statuses: ['Pemeriksaan Revisi', 'Revisi', 'REVISI', 'Pemeriksaan Selesai', 'Penerimaan Perbaikan'], color: 'blue', icon: FileEdit, link: '/perizinan/pemeriksaan-revisi' },
    { id: 8, title: '8. Pengembalian Revisi (MPP)', shortTitle: 'Kembali Revisi', statuses: ['Pengembalian Revisi'], color: 'rose', icon: RotateCcw, link: '/perizinan/pengembalian' },
    { id: 9, title: '9. Terima Revisi (MPP)', shortTitle: 'Terima Revisi', statuses: [], color: 'emerald', icon: CheckCircle, link: '/perizinan/penerimaan-perbaikan' },
    { id: 10, title: '10. Finalisasi (RPD & SK) (DLH)', shortTitle: 'Finalisasi', statuses: ['Penyerahan SK', 'Selesai / SK', 'Selesai', 'Revisi Selesai', 'Penerimaan Revisi', 'Revisi Lanjutan'], color: 'purple', icon: FileText, link: '/perizinan/finalisasi' },
    { id: 11, title: '11. Jilidan Final (MPP)', shortTitle: 'Jilidan', statuses: ['Penerimaan Jilidan', 'Menunggu Jilidan'], color: 'orange', icon: FileText, link: '/perizinan/jilidan' },
    { id: 12, title: '12. Arsip (DLH)', shortTitle: 'Arsip', statuses: ['Arsip', 'Diarsipkan', 'ARSIP', 'Jilidan Selesai'], color: 'slate', icon: Archive, link: '/perizinan/arsip' },
  ];`.split('\n');

const before = lines.slice(0, startIndex);
const after = lines.slice(endIndex + 1);

const newLines = [...before, ...replacementLines, ...after];
fs.writeFileSync('src/app/perizinan/daftar/page.tsx', newLines.join('\n'), 'utf8');
console.log('Update success!');
