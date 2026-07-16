const fs = require('fs');
const PizZip = require('pizzip');

function check(filename) {
  const content = fs.readFileSync(filename, 'binary');
  const zip = new PizZip(content);
  const xml = zip.files['word/document.xml'].asText();
  const idx = xml.indexOf('foto_baris');
  if (idx > -1) {
    console.log(xml.substring(Math.max(0, idx - 200), idx + 200));
  }
}

check('public/templates-bap/bap-fasyankes.docx');
