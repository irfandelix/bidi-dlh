const fs = require('fs');
const PizZip = require('pizzip');

try {
  const content = fs.readFileSync('./public/templates/template-pengaduan.docx', 'binary');
  const zip = new PizZip(content);
  
  const docXml = zip.file('word/document.xml').asText();
  
  const tags = [...docXml.matchAll(/\{([^}]+)\}/g)].map(m => m[1]);
  
  console.log("=== TAGS FOUND IN DOCX ===");
  const uniqueTags = [...new Set(tags)];
  uniqueTags.forEach(tag => console.log(`{${tag}}`));
  
  const plainText = docXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  console.log("\n=== PLAIN TEXT PREVIEW ===");
  console.log(plainText.substring(0, 1500)); 

} catch (e) {
  console.error("Error reading docx:", e);
}
