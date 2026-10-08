const fs = require('fs');
const file = 'src/app/perizinan/daftar/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStyle1 = "isCurrent ? 'border-blue-300 bg-blue-500 text-white shadow-lg shadow-blue-200 scale-125 ring-4 ring-blue-400/50 animate-[pulse_2s_ease-in-out_infinite]' :";
const replaceStyle1 = "isCurrent ? 'border-emerald-300 bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-125 ring-4 ring-emerald-400/50 animate-[pulse_2s_ease-in-out_infinite]' :";

const targetStyle2 = "isCurrent ? 'text-blue-600 scale-110 transition-transform' :";
const replaceStyle2 = "isCurrent ? 'text-emerald-600 scale-110 transition-transform' :";

content = content.replace(targetStyle1, replaceStyle1);
content = content.replace(targetStyle2, replaceStyle2);

fs.writeFileSync(file, content);
console.log('Update pulse color done');
