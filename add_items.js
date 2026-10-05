const fs = require('fs');

function addItems(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  if (content.includes('Perjanjian Pengangkutan Sampah (MOU)')) return;
  content = content.replace(
    /"Perizinan yang Sudah Dimiliki atau Izin yang Lama \(Jika Ada\)",/g,
    `"Perizinan yang Sudah Dimiliki atau Izin yang Lama (Jika Ada)",\n    "Perjanjian Pengangkutan Sampah (MOU)",\n    "Perjanjian Pengangkutan Limbah B3 (MOU)",`
  );
  fs.writeFileSync(filepath, content, 'utf8');
}

addItems('src/app/perizinan/registrasi/page.tsx');
addItems('src/app/perizinan/uji-administrasi/[id]/page.tsx');
console.log("Items added!");
