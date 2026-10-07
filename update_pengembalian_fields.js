const fs = require('fs');
const file = 'src/app/perizinan/pengembalian/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update Payload Logic
const payloadLogicRegex = /const payload: any = \{\s*status_tahapan,\s*\};\s*if \(\['1', '2', '3', '4', '5'\]\.includes\(String\(revisiKe\)\)\) \{[\s\S]*?\} else \{[\s\S]*?\}/;
const newPayloadLogic = `const payload: any = {
      status_tahapan, 
    };

    let fisik: any = {};
    try { if (doc.arsip_fisik) fisik = typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc.arsip_fisik; } catch(e) {}
    if (typeof fisik === 'string') fisik = JSON.parse(fisik);

    const isRevisi = doc.status_tahapan?.toLowerCase().includes('revisi');
    const keySuffix = isRevisi ? \`_revisi_\${revisiKe}\` : '';

    fisik[\`penerima_ba\${keySuffix}\`] = formData.get('penerima_ba');
    fisik[\`penyerah_ba\${keySuffix}\`] = formData.get('penyerah_ba');

    payload.arsip_fisik = fisik;

    if (isRevisi && ['1', '2', '3', '4', '5'].includes(String(revisiKe))) {
      payload[\`tanggal_pengembalian_\${revisiKe}\`] = formData.get('tanggal_pengembalian');
    } else {
      payload.tanggal_pengembalian = formData.get('tanggal_pengembalian');
    }`;

content = content.replace(payloadLogicRegex, newPayloadLogic);

// Add form fields before the submit button container
const formFieldsRegex = /<div className="pt-8 border-t border-outline-variant mt-8 flex justify-end">/;

const getFisikStr = `
          {(() => {
            let fisik: any = {};
            try { if (doc.arsip_fisik) fisik = typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc.arsip_fisik; } catch(e) {}
            if (typeof fisik === 'string') fisik = JSON.parse(fisik);
            const isRevisi = doc?.status_tahapan?.toLowerCase().includes('revisi');
            const keySuffix = isRevisi ? \`_revisi_\${doc.revisi_ke || 1}\` : '';
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2 uppercase">Nama Penerima BA (Pemrakarsa/Konsultan) <span className="text-error">*</span></label>
                  <input type="text" name="penerima_ba" required defaultValue={fisik[\`penerima_ba\${keySuffix}\`] || ''} placeholder="Contoh: Budi Santoso"
                    className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-bold text-sm rounded-xl p-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2 uppercase">Nama Petugas Penyerah BA (MPP) <span className="text-error">*</span></label>
                  <input type="text" name="penyerah_ba" required defaultValue={fisik[\`penyerah_ba\${keySuffix}\`] || ''} placeholder="Contoh: Siti Aminah"
                    className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-bold text-sm rounded-xl p-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-all outline-none" />
                </div>
              </div>
            );
          })()}
          <div className="pt-8 border-t border-outline-variant mt-8 flex justify-end">`;

content = content.replace(formFieldsRegex, getFisikStr);

fs.writeFileSync(file, content);
console.log('Update pengembalian fields done');
