const fs = require('fs');
let code = fs.readFileSync('src/app/pengawasan/mobile/FormBAP.tsx', 'utf-8');
code = code.replace(/placeholderTextColor="[^"]*"/g, '');
code = code.replace(/ multiline/g, '');
code = code.replace(/onChangeText=\{v => \{/g, 'onChange={(e: any) => { const v = e.target.value; ');
code = code.replace(/onChangeText=\{\(v\) => \{/g, 'onChange={(e: any) => { const v = e.target.value; ');
code = code.replace(/onChangeText=\{(.*?)\}/g, 'onChange={(e: any) => { const v = e.target.value; $1(v) }}');
fs.writeFileSync('src/app/pengawasan/mobile/FormBAP.tsx', code);
