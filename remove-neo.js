const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const replacements = [
  { search: /border-2 border-slate-900/g, replace: 'border border-slate-200' },
  { search: /border-4 border-slate-900/g, replace: 'border border-slate-200' },
  { search: /border-slate-900/g, replace: 'border-slate-200' },
  { search: /shadow-\[2px_2px_0_0_#0f172a\]/g, replace: 'shadow-sm' },
  { search: /shadow-\[4px_4px_0_0_#0f172a\]/g, replace: 'shadow-md' },
  { search: /shadow-\[8px_8px_0_0_#0f172a\]/g, replace: 'shadow-lg' },
  { search: /shadow-\[.*?#0f172a\]/g, replace: 'shadow-md' }
];

let changedCount = 0;

walkDir('src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    replacements.forEach(({search, replace}) => {
      content = content.replace(search, replace);
    });
    
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log('Updated', filePath);
      changedCount++;
    }
  }
});

console.log(`Finished updating ${changedCount} files.`);
