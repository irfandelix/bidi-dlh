const fs = require('fs');
const filepath = 'src/app/perizinan/registrasi/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

const regex = /<th className="px-4 py-4 w-24 text-center border-r border-slate-200">Ada \(V\)<\/th>/;
const replacement = `<th className="px-4 py-4 w-16 text-center border-r border-slate-200">PL</th>
                            <th className="px-4 py-4 w-16 text-center border-r border-slate-200">PERTEK</th>
                            <th className="px-4 py-4 w-16 text-center border-r border-slate-200">RINTEK</th>`;

content = content.replace(regex, replacement);
fs.writeFileSync(filepath, content, 'utf8');
console.log("Headers replaced");
