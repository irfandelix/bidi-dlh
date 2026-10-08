const fs = require('fs');
const file = 'src/components/Navbar.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('<div className="h-6 w-1 bg-slate-900 rounded-full"></div>', '<div className="h-6 w-1 bg-slate-900 rounded-full shrink-0"></div>');
content = content.replace('<div className="h-6 w-1 bg-slate-900 rounded-full hidden sm:block"></div>', '<div className="h-6 w-1 bg-slate-900 rounded-full hidden sm:block shrink-0"></div>');

fs.writeFileSync(file, content);
console.log('Update separator done');
