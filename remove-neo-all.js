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
  // shadows
  { search: /shadow-\[[^\]]+#[a-f0-9]+\]/gi, replace: 'shadow-sm' },
  { search: /shadow-\[[^\]]+rgba[^\]]+\]/gi, replace: 'shadow-sm' },
  
  // borders
  { search: /border-4 border-outline-variant/g, replace: 'border border-outline-variant' },
  { search: /border-t-4 border-outline-variant/g, replace: 'border-t border-outline-variant' },
  { search: /border-4 border-([a-z]+)-([0-9]+)/g, replace: 'border border-$1-200' },
  { search: /border-2 border-([a-z]+)-([0-9]+)/g, replace: 'border border-$1-200' },
  
  // also fix the inner dots for the badges
  { search: /border border-([a-z]+)-900/g, replace: 'border border-$1-300' }
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
