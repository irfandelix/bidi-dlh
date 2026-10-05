const fs = require('fs');
const filepath = 'src/app/api/generate/route.ts';
let content = fs.readFileSync(filepath, 'utf8');

const logicToReplace = `    let chkStatus = [];
    let chkNotes = [];
    try { if (doc.checklist_status) chkStatus = typeof doc.checklist_status === 'string' ? JSON.parse(doc.checklist_status) : doc.checklist_status; } catch(e) {}
    try { if (doc.checklist_notes) chkNotes = typeof doc.checklist_notes === 'string' ? JSON.parse(doc.checklist_notes) : doc.checklist_notes; } catch(e) {}
    
    let keteranganCounter = 1;
    const keterangan_otomatis = defaultChecklistItems.map((item_nama, index) => {
        const isChecked = chkStatus[index];
        const note = chkNotes[index] || '';
        if (!isChecked && !note) {
            if (item_nama.includes('MOU')) {
                return { no: keteranganCounter++, teks_keterangan: \`\${item_nama}: Kegiatan masih dalam perencanaan.\` };
            }
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

const newLogic = `    let chkStatusRaw = [];
    let chkNotes = [];
    try { if (doc.checklist_status) chkStatusRaw = typeof doc.checklist_status === 'string' ? JSON.parse(doc.checklist_status) : doc.checklist_status; } catch(e) {}
    try { if (doc.checklist_notes) chkNotes = typeof doc.checklist_notes === 'string' ? JSON.parse(doc.checklist_notes) : doc.checklist_notes; } catch(e) {}
    
    let chkStatus = [];
    if (chkStatusRaw.length > 0 && typeof chkStatusRaw[0] === 'boolean') {
        chkStatus = chkStatusRaw.map(b => ({ pl: b, pertek: false, rintek: false }));
    } else if (chkStatusRaw.length > 0 && typeof chkStatusRaw[0] === 'object') {
        chkStatus = chkStatusRaw;
    } else {
        chkStatus = defaultChecklistItems.map(() => ({ pl: false, pertek: false, rintek: false }));
    }
    
    let keteranganCounter = 1;
    const keterangan_otomatis = defaultChecklistItems.map((item_nama, index) => {
        const st = chkStatus[index] || { pl: false, pertek: false, rintek: false };
        const isChecked = st.pl || st.pertek || st.rintek;
        const note = chkNotes[index] || '';
        if (!isChecked && !note) {
            if (item_nama.includes('MOU')) {
                return { no: keteranganCounter++, teks_keterangan: \`\${item_nama}: Kegiatan masih dalam perencanaan.\` };
            }
            return { no: keteranganCounter++, teks_keterangan: \`\${item_nama} belum lengkap.\` };
        } else if (!isChecked && note) {
            return { no: keteranganCounter++, teks_keterangan: \`\${item_nama} belum lengkap. Keterangan: \${note}\` };
        } else if (isChecked && note) {
            return { no: keteranganCounter++, teks_keterangan: \`\${item_nama}: \${note}\` };
        }
        return null;
    }).filter(k => k !== null);

    const persyaratan = defaultChecklistItems.map((item_nama, index) => {
      const st = chkStatus[index] || { pl: false, pertek: false, rintek: false };
      return {
        no: index + 1,
        item_nama: item_nama,
        ada_pl: st.pl ? 'V' : '-',
        ada_pertek: st.pertek ? 'V' : '-',
        ada_rintek: st.rintek ? 'V' : '-'
      };
    });`;

if (content.includes("const isChecked = chkStatus[index];")) {
    content = content.replace(logicToReplace, newLogic);
    fs.writeFileSync(filepath, content, 'utf8');
    console.log("Updated route.ts");
} else {
    console.log("Match failed");
}`;
