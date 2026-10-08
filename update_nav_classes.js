const fs = require('fs');
const file = 'src/components/Navbar.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'w-max max-w-[95vw] overflow-x-auto sm:overflow-visible',
  'w-max max-w-[95vw] overflow-x-auto'
);

content = content.replace(
  '<ul className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm font-black text-slate-700 uppercase tracking-widest">',
  '<ul className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm font-black text-slate-700 uppercase tracking-widest shrink-0">'
);

content = content.replace(
  '<BidiLogo />',
  '<div className="shrink-0"><BidiLogo /></div>'
);

content = content.replace(
  '<div className="relative group hidden sm:block">',
  '<div className="relative group hidden sm:block shrink-0">'
);

fs.writeFileSync(file, content);
console.log('Update nav classes done');
