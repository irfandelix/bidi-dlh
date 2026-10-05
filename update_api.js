const fs = require('fs');
const filepath = 'src/app/api/generate/route.ts';
let content = fs.readFileSync(filepath, 'utf8');

content = content.replace(/"Perizinan yang Sudah Dimiliki atau Izin yang Lama \(Jika Ada\)",/g, '"Perizinan yang Sudah Dimiliki atau Izin yang Lama (Jika Ada)",\n      "Perjanjian Pengangkutan Sampah (MOU)",\n      "Perjanjian Pengangkutan Limbah B3 (MOU)",');

const newPersyaratan = `    let keteranganCounter = 1;
    const keterangan_otomatis = defaultChecklistItems.map((item_nama, index) => {
        const isChecked = chkStatus[index];
        const note = chkNotes[index] || '';
        if (!isChecked && !note) {
            return { no: keteranganCounter++, teks_keterangan: \`\${item_nama} belum lengkap.\` };
        } else if (!isChecked && note) {
            return { no: keteranganCounter++, teks_keterangan: \`\${item_nama} belum lengkap. Keterangan: \${note}\` };
        } else if (isChecked && note) {
            return { no: keteranganCounter++, teks_keterangan: \`\${item_nama}: \${note}\` };
        }
        return null;
    }).filter(k => k !== null);

    const persyaratan = defaultChecklistItems.map((item_nama, index) => ({
      no: index + 1,
      item_nama: item_nama,
      ada_pl: chkStatus[index] ? 'V' : '-',
      ada_pertek: '-',
      ada_rintek: '-'
    }));`;
    
content = content.replace(/const persyaratan = defaultChecklistItems\.map\(\(item_nama, index\) => \(\{\s*no: index \+ 1,\s*item_nama: item_nama,\s*ada: chkStatus\[index\] \? [^,]+,\s*keterangan: chkNotes\[index\] \|\| ''\s*\}\)\);/, newPersyaratan);

content = content.replace(/\.\.\.checklistData,/g, '...checklistData,\n      keterangan_otomatis: keterangan_otomatis,');

fs.writeFileSync(filepath, content, 'utf8');
console.log('Done mapping tags');
