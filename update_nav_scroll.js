const fs = require('fs');
const file = 'src/components/Navbar.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove overflow-x-auto and webkit scrollbar hides
content = content.replace('w-max max-w-[95vw] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]', 'w-max max-w-[95vw]');

// Reduce gaps so it fits better
content = content.replace('gap-4 sm:gap-6 w-max', 'gap-3 sm:gap-4 w-max');
content = content.replace('<ul className="flex items-center gap-2 sm:gap-6', '<ul className="flex items-center gap-2 sm:gap-4');

// Revert shrink-0 because we want it to gracefully handle space if really needed, but keep whitespace-nowrap
content = content.replace(/shrink-0/g, '');
// Restore the hidden block classes cleanly
content = content.replace(/<div className="h-6 w-1 bg-slate-900 rounded-full "><\/div>/g, '<div className="h-6 w-1 bg-slate-900 rounded-full"></div>');
content = content.replace(/<div className="h-6 w-1 bg-slate-900 rounded-full hidden sm:block "><\/div>/g, '<div className="h-6 w-1 bg-slate-900 rounded-full hidden sm:block"></div>');


fs.writeFileSync(file, content);
console.log('Update nav scroll done');
