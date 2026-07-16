const fs = require('fs');
const PizZip = require('pizzip');
const path = require('path');

const templates = [
  'bap-fasyankes.docx',
  'bap-industri.docx',
  'bap-perumahan.docx',
  'bap-sppg.docx',
  'bap-toko.docx'
];

templates.forEach(templateName => {
  const templatePath = path.join('public', 'templates-bap', templateName);
  if (!fs.existsSync(templatePath)) return;
  
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  
  let modified = false;
  
  // Go through all footer files
  Object.keys(zip.files).forEach(fileName => {
    if (fileName.startsWith('word/footer') && fileName.endsWith('.xml')) {
      let xml = zip.files[fileName].asText();
      
      if (xml.includes('{paraf_pemrakarsa_text}')) {
        xml = xml.replace(/\{paraf_pemrakarsa_text\}/g, '{%paraf_pemrakarsa}');
        modified = true;
      }
      
      if (xml.includes('{paraf_pengawas_text}')) {
        xml = xml.replace(/\{paraf_pengawas_text\}/g, '{%paraf_pengawas}');
        modified = true;
      }
      
      if (modified) {
        zip.file(fileName, xml);
      }
    }
  });
  
  if (modified) {
    const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(templatePath, buf);
    console.log(`Fixed footers in ${templateName}`);
  }
});
