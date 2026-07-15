const fs = require('fs');
const PizZip = require('pizzip');

try {
  const content = fs.readFileSync('./public/templates-bap/bap-toko.docx', 'binary');
  const zip = new PizZip(content);
  
  // Extract document.xml text directly
  const docXml = zip.files['word/document.xml'].asText();
  const headerXml = zip.files['word/header1.xml'] ? zip.files['word/header1.xml'].asText() : '';
  const footerXml = zip.files['word/footer1.xml'] ? zip.files['word/footer1.xml'].asText() : '';
  const footer2Xml = zip.files['word/footer2.xml'] ? zip.files['word/footer2.xml'].asText() : '';
  const footer3Xml = zip.files['word/footer3.xml'] ? zip.files['word/footer3.xml'].asText() : '';
  
  const fullText = docXml + headerXml + footerXml + footer2Xml + footer3Xml;
  
  // Find everything between { and }
  const regex = /\{([^}]+)\}/g;
  let match;
  const tags = new Set();
  
  while ((match = regex.exec(fullText)) !== null) {
    const cleanTag = match[1].replace(/<[^>]+>/g, '').trim();
    if (cleanTag) tags.add(cleanTag);
  }

  const sortedTags = Array.from(tags).sort();
  console.log('Found tags:');
  console.log(JSON.stringify(sortedTags, null, 2));

} catch (error) {
  console.error('Error reading docx:', error);
}

