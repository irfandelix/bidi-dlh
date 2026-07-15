const fs = require('fs');
const filePath = 'C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\bidi-dlh-app\\src\\app\\perizinan\\finalisasi\\[id]\\page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Replace \` with `
content = content.replace(/\\`/g, '`');
// Replace \${ with ${
content = content.replace(/\\\$\{/g, '${');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed escape characters');
