const fs = require('fs');
const filepath = 'src/app/api/generate/route.ts';
let content = fs.readFileSync(filepath, 'utf8');

const oldLogic = `        if (!isChecked && !note) {
            return { no: keteranganCounter++, teks_keterangan: \`\${item_nama} belum lengkap.\` };`;

const newLogic = `        if (!isChecked && !note) {
            if (item_nama.includes('MOU')) {
                return { no: keteranganCounter++, teks_keterangan: \`\${item_nama}: Kegiatan masih dalam perencanaan.\` };
            }
            return { no: keteranganCounter++, teks_keterangan: \`\${item_nama} belum lengkap.\` };`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync(filepath, content, 'utf8');
console.log('MOU condition added!');
