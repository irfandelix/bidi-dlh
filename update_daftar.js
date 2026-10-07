const fs = require('fs');
const file = 'src/app/perizinan/daftar/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "{ id: 5, title: '5. Pengembalian BA (MPP)', shortTitle: 'Pengembalian (MPP)',",
  "{ id: 5, title: '5. Penyerahan BA Pemeriksaan (MPP)', shortTitle: 'Penyerahan BA (MPP)',"
);

content = content.replace(
  "{ id: 8, title: '8. Pengembalian Revisi (MPP)', shortTitle: 'Kembali Revisi (MPP)',",
  "{ id: 8, title: '8. Penyerahan BA Revisi (MPP)', shortTitle: 'Penyerahan Revisi (MPP)',"
);

// Now update the active progress stage
// Currently: isCurrent ? 'border-indigo-100 bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' :
// Change to: isCurrent ? 'border-amber-200 bg-amber-500 text-white shadow-lg shadow-amber-200 scale-125 ring-4 ring-amber-400 ring-opacity-50 animate-pulse' :
content = content.replace(
  "isCurrent ? 'border-indigo-100 bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' :",
  "isCurrent ? 'border-blue-300 bg-blue-500 text-white shadow-lg shadow-blue-200 scale-125 ring-4 ring-blue-400/50 animate-[pulse_2s_ease-in-out_infinite]' :"
);

// Text styling for current:
content = content.replace(
  "isCurrent ? 'text-indigo-600' :",
  "isCurrent ? 'text-blue-600 scale-110 transition-transform' :"
);

fs.writeFileSync(file, content);
console.log('Update daftar page done');
