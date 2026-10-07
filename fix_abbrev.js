const fs = require('fs');
const filepath = 'src/app/api/generate/route.ts';
let content = fs.readFileSync(filepath, 'utf8');

const target = `    formattedJenisDokumen = formattedJenisDokumen.replace(/^SPPL$/gi, 'Surat Pernyataan Kesanggupan Pengelolaan dan Pemantauan Lingkungan Hidup');
    formattedJenisDokumen = formattedJenisDokumen.replace(/^UKLUPL$|^UKL-UPL$/gi, 'Upaya Pengelolaan Lingkungan Hidup dan Upaya Pemantauan Lingkungan Hidup');
    formattedJenisDokumen = formattedJenisDokumen.replace(/^AMDAL$/gi, 'Analisis Mengenai Dampak Lingkungan Hidup');
    formattedJenisDokumen = formattedJenisDokumen.replace(/^DELH$/gi, 'Dokumen Evaluasi Lingkungan Hidup');
    formattedJenisDokumen = formattedJenisDokumen.replace(/^DPLH$/gi, 'Dokumen Pengelolaan Lingkungan Hidup');`;

const replacement = `    // formattedJenisDokumen = formattedJenisDokumen.replace(/^SPPL$/gi, 'Surat Pernyataan Kesanggupan Pengelolaan dan Pemantauan Lingkungan Hidup');
    // formattedJenisDokumen = formattedJenisDokumen.replace(/^UKLUPL$|^UKL-UPL$/gi, 'Upaya Pengelolaan Lingkungan Hidup dan Upaya Pemantauan Lingkungan Hidup');
    // formattedJenisDokumen = formattedJenisDokumen.replace(/^AMDAL$/gi, 'Analisis Mengenai Dampak Lingkungan Hidup');
    // formattedJenisDokumen = formattedJenisDokumen.replace(/^DELH$/gi, 'Dokumen Evaluasi Lingkungan Hidup');
    // formattedJenisDokumen = formattedJenisDokumen.replace(/^DPLH$/gi, 'Dokumen Pengelolaan Lingkungan Hidup');`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filepath, content, 'utf8');
    console.log("Fixed abbreviations!");
} else {
    console.log("Not found");
}
