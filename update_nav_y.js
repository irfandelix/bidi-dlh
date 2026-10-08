const fs = require('fs');
const file = 'src/components/Navbar.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add overflow-x-auto and overflow-y-hidden
content = content.replace(
  '<nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-200 shadow-md rounded-2xl px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4 w-max max-w-[95vw]">',
  '<nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-200 shadow-md rounded-2xl px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4 w-max max-w-[95vw] overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">'
);

// We must make sure the nav has enough height or padding so it doesn't clip its own content, but we'll leave it as is.
fs.writeFileSync(file, content);
console.log('Update Y axis hidden done');
