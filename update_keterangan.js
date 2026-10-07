const fs = require('fs');
const file = 'src/app/api/generate/route.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /let keteranganCounter = 1;\s*const keterangan_otomatis = defaultChecklistItems\.map\(\(item_nama, index\) => \{[\s\S]*?\}\)\.filter\(k => k !== null\);/m;

const replacement = `let keteranganCounter = 1;
    const keterangan_otomatis: any[] = [];
    
    // 1. Masukkan catatan dari tiap item checklist
    defaultChecklistItems.forEach((item_nama, index) => {
        const note = chkNotes[index] || '';
        if (typeof note === 'string' && note.trim()) {
            keterangan_otomatis.push({ no: keteranganCounter++, teks_keterangan: note.trim() });
        }
    });

    // 2. Masukkan keterangan tambahan (KETERANGAN TAMBAHAN UI)
    if (doc.keterangan && typeof doc.keterangan === 'string' && doc.keterangan.trim()) {
        keterangan_otomatis.push({ no: keteranganCounter++, teks_keterangan: doc.keterangan.trim() });
    }`;

content = content.replace(regex, replacement);

fs.writeFileSync(file, content);
console.log('Update success!');
