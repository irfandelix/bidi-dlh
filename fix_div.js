const fs = require('fs');
let c = fs.readFileSync('src/app/perizinan/daftar/page.tsx', 'utf8');

c = c.replace(/          <\/div>\r?\n          <\/div>\r?\n        <\/div>\r?\n        \r?\n        <div className="overflow-x-auto">/, '          </div>\n        </div>\n        \n        <div className="overflow-x-auto">');

fs.writeFileSync('src/app/perizinan/daftar/page.tsx', c, 'utf8');
console.log("Done");
