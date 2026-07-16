const fs = require('fs');
const PizZip = require('pizzip');

function inspectSaran(filename) {
  const content = fs.readFileSync(filename, 'binary');
  const zip = new PizZip(content);
  const xml = zip.files['word/document.xml'].asText();
  const idx = xml.indexOf('{#saran}');
  if (idx > -1) {
    console.log(filename, ':', xml.substring(Math.max(0, idx - 100), idx + 200));
  } else {
    console.log(filename, ': {#saran} not found');
  }
}

inspectSaran('public/templates-bap/bap-perumahan.docx');
inspectSaran('public/templates-bap/bap-sppg.docx');
inspectSaran('public/templates-bap/bap-fasyankes.docx');
