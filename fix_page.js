const fs = require('fs');
let code = fs.readFileSync('src/app/pengawasan/mobile/page.tsx', 'utf-8');
code = code.replace(/min-h-screen/g, 'h-full w-full flex-1');
fs.writeFileSync('src/app/pengawasan/mobile/page.tsx', code);
