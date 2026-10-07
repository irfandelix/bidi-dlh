const fs = require('fs');
const file = 'src/app/perizinan/daftar/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<td colSpan={5} className="p-8 border-r-2 border-l-2 border-slate-200">',
  '<td colSpan={5} className="p-8 border-r-2 border-l-2 border-slate-200 max-w-0">'
);

fs.writeFileSync(file, content);
console.log('Update max-w-0 done');
