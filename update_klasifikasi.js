const fs = require('fs');
const content = fs.readFileSync('public/kodeklarifikasi.csv', 'utf8');
const lines = content.split('\n');
const results = [];

for (let i = 1; i < lines.length; i++) {
  let line = lines[i].trim();
  if (!line || line.startsWith('KLASIFIKASI') || /^;+$/.test(line)) continue;
  
  let parts = [];
  let inQuote = false;
  let curr = '';
  for (let c of line) {
    if (c === '"') inQuote = !inQuote;
    else if (c === ';' && !inQuote) { parts.push(curr); curr = ''; }
    else curr += c;
  }
  parts.push(curr);
  
  let a = parts[0] ? parts[0].trim() : '';
  let b = parts[1] ? parts[1].trim() : '';
  let c = parts[2] ? parts[2].trim() : '';
  let d = parts[3] ? parts[3].trim() : '';
  let name = parts.slice(4).join(';').trim();
  
  if (!a.match(/^\d{3}$/)) {
     if (results.length > 0) {
       let extraText = line.replace(/"/g, '').replace(/;/g, ' ').trim();
       results[results.length - 1].name += ' ' + extraText;
     }
     continue;
  }
  
  let code = a + b + c + d;
  if (code) {
    results.push({ code, name: name.replace(/"/g, '').trim() });
  }
}
if (!fs.existsSync('src/data')) fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/klasifikasi.json', JSON.stringify(results, null, 2));
console.log('Parsed ' + results.length + ' classification codes.');
