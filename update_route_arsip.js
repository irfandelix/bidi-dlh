const fs = require('fs');
let code = fs.readFileSync('src/app/api/generate/route.ts', 'utf8');

const arsipDataLogic = `
      // Arsip Perizinan specific lists
      revisiList: (() => {
        const list = [];
        if (doc.nomor_revisi) list.push({ key: '', nomor: doc.nomor_revisi, title: 'BA Pemeriksaan Revisi' });
        for (let i = 1; i <= 5; i++) {
          if (doc['nomor_revisi_' + i]) {
            list.push({ key: i, nomor: doc['nomor_revisi_' + i], title: 'BA Pemeriksaan Revisi ' + i });
          }
        }
        return list;
      })(),
      phpList: (() => {
        const list = [];
        if (doc.nomor_php) list.push({ key: '', nomor: doc.nomor_php, title: 'Penerimaan Perbaikan / PHP' });
        for (let i = 1; i <= 5; i++) {
          if (doc['nomor_php' + i]) {
            list.push({ key: i, nomor: doc['nomor_php' + i], title: 'Penerimaan Perbaikan / PHP ' + i });
          }
        }
        return list;
      })(),
`;

if (!code.includes('revisiList: (() => {')) {
  code = code.replace(
    '// Petugas Penerima (Registrasi)',
    arsipDataLogic + '      // Petugas Penerima (Registrasi)'
  );
  fs.writeFileSync('src/app/api/generate/route.ts', code);
  console.log('Modified generate/route.ts');
}
