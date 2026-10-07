const fs = require('fs');
const filepath = 'src/app/perizinan/daftar/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

const regex = /<td className="px-6 py-4 font-bold text-slate-700 text-sm border-r-2 border-slate-200">\s*<\/td>/g;
const replacement = `<td className="px-6 py-4 font-bold text-slate-700 text-sm border-r-2 border-slate-200">
                          {d.nama_pemrakarsa || '-'}
                        </td>`;

if (content.match(regex)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(filepath, content, 'utf8');
    console.log("Fixed empty Pemrakarsa column with Regex!");
} else {
    console.log("Regex match failed.");
}
