const fs = require('fs');
const filepath = 'src/app/perizinan/registrasi/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

const uiRegex = /<th className="px-4 py-3 border-b-2 border-r border-slate-200 w-24">ADA \(V\)<\/th>/;
const newUi = `<th className="px-4 py-3 border-b-2 border-r border-slate-200 w-16">PL</th>
                              <th className="px-4 py-3 border-b-2 border-r border-slate-200 w-16">PERTEK</th>
                              <th className="px-4 py-3 border-b-2 border-r border-slate-200 w-16">RINTEK</th>`;
content = content.replace(uiRegex, newUi);

const bodyRegex = /<td className="px-4 py-3 text-center border-r border-slate-200">\s*<input type="checkbox" name=\{\`checklistStatus\[\$\{index\}\]\`\} value="true" className="w-5 h-5 rounded border border-slate-200 text-indigo-600 focus:ring-indigo-600 cursor-pointer shadow-sm" \/>\s*<\/td>/;
const newBody = `<td className="px-4 py-3 text-center border-r border-slate-200">
                                <input type="checkbox" name={\`checklistStatusPL[\${index}]\`} value="true" className="w-5 h-5 rounded border border-slate-200 text-indigo-600 focus:ring-indigo-600 cursor-pointer shadow-sm" />
                              </td>
                              <td className="px-4 py-3 text-center border-r border-slate-200">
                                <input type="checkbox" name={\`checklistStatusPertek[\${index}]\`} value="true" className="w-5 h-5 rounded border border-slate-200 text-indigo-600 focus:ring-indigo-600 cursor-pointer shadow-sm" />
                              </td>
                              <td className="px-4 py-3 text-center border-r border-slate-200">
                                <input type="checkbox" name={\`checklistStatusRintek[\${index}]\`} value="true" className="w-5 h-5 rounded border border-slate-200 text-indigo-600 focus:ring-indigo-600 cursor-pointer shadow-sm" />
                              </td>`;
content = content.replace(bodyRegex, newBody);

const logicRegex = /const checklistStatus = checklistItems\.map\(\(_, i\) => formData\.get\(\`checklistStatus\[\$\{i\}\]\`\) === 'true'\);/;
const newLogic = `const checklistStatus = checklistItems.map((_, i) => ({
          pl: formData.get(\`checklistStatusPL[\${i}]\`) === 'true',
          pertek: formData.get(\`checklistStatusPertek[\${i}]\`) === 'true',
          rintek: formData.get(\`checklistStatusRintek[\${i}]\`) === 'true'
        }));`;
content = content.replace(logicRegex, newLogic);

fs.writeFileSync(filepath, content, 'utf8');
console.log("Updated registrasi/page.tsx");
