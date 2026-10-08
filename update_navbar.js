const fs = require('fs');
const file = 'src/components/Navbar.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<li className="hidden lg:block">/g, '<li className="hidden lg:block shrink-0">');
content = content.replace(/<li>/g, '<li className="shrink-0">');

fs.writeFileSync(file, content);
