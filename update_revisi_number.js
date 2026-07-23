const fs = require('fs');

// 1. Update src/app/api/perizinan/[id]/route.ts
let apiPath = 'src/app/api/perizinan/[id]/route.ts';
let apiCode = fs.readFileSync(apiPath, 'utf8');

// The block for PHP
apiCode = apiCode.replace(
  /(\/\/ Auto-generate nomor_php for Penerimaan Perbaikan[\s\S]*?)600\.4\/\$\{seqPadded\}/g,
  '$1600.4.5/${seqPadded}'
);

// The block for BA.P.P (Pemeriksaan Revisi)
apiCode = apiCode.replace(
  /(\/\/ Auto-generate nomor_revisi for Pemeriksaan Revisi[\s\S]*?)600\.4\/\$\{seqPadded\}/g,
  '$1600.4.5/${seqPadded}'
);

fs.writeFileSync(apiPath, apiCode);
console.log('Updated', apiPath);

// 2. Update src/app/api/generate/route.ts
let genPath = 'src/app/api/generate/route.ts';
let genCode = fs.readFileSync(genPath, 'utf8');

// The block for nomor_php fallback
genCode = genCode.replace(
  /(nomor_php: \(\(\) => \{[\s\S]*?)600\.4\/\$\{seqPadded\}/g,
  '$1600.4.5/${seqPadded}'
);

// The block for nomor_revisi_1 fallback
genCode = genCode.replace(
  /(nomor_revisi_1: doc\.nomor_revisi_1 \|\| \(\(\) => \{[\s\S]*?)600\.4\/\$\{seqPadded\}/g,
  '$1600.4.5/${seqPadded}'
);

fs.writeFileSync(genPath, genCode);
console.log('Updated', genPath);
