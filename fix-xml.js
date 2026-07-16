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
  
  // Go through all files (footers, headers, document) just in case
  Object.keys(zip.files).forEach(fileName => {
    if (fileName.endsWith('.xml')) {
      let xml = zip.files[fileName].asText();
      
      const newXml = xml.replace(/<w:t>\{#tim_pengawas\}\s*\{%paraf_pengawas\}\s*\{\/tim_pengawas\}<\/w:t>/g, '<w:t>{%paraf_pengawas}</w:t>');
      
      if (xml !== newXml) {
        xml = newXml;
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
    console.log(`Fixed paraf_pengawas in ${templateName}`);
  }
});
