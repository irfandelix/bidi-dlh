const fs = require('fs');
let code = fs.readFileSync('src/app/pengawasan/mobile/FormBAP.tsx', 'utf-8');
code = code.replace(/className=\"flex-row/g, 'className=\"flex flex-row');
code = code.replace(/className=\"flex-1 bg-emerald-50\"/g, 'className=\"flex flex-col h-screen bg-emerald-50\"');
code = code.replace(/className=\"p-6 pt-12 flex-1\"/g, 'className=\"p-6 pt-12 flex-1 flex flex-col\"');
code = code.replace(/className=\"flex-1 overflow-y-auto\"/g, 'className=\"flex-1 flex flex-col overflow-y-auto\"');
fs.writeFileSync('src/app/pengawasan/mobile/FormBAP.tsx', code);
