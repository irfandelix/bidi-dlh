const fs = require('fs');

const files = [
    'src/app/perizinan/registrasi/page.tsx',
    'src/app/api/generate/route.ts',
    'src/app/perizinan/uji-administrasi/[id]/page.tsx'
];

for (const filepath of files) {
    if (fs.existsSync(filepath)) {
        let content = fs.readFileSync(filepath, 'utf8');
        content = content.replace(/"Surat Permohonan Pemeriksaan Dokumen UKL-UPL \/ SPPL\*"/g, '"Surat Permohonan Pemeriksaan Dokumen*"');
        fs.writeFileSync(filepath, content, 'utf8');
        console.log("Updated", filepath);
    }
}
