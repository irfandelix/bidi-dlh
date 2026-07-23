const fs = require('fs');
const PizZip = require('pizzip');

try {
  const content = fs.readFileSync('src/templates/arsip-perizinan/arsip.docx', 'binary');
  const zip = new PizZip(content);
  
  const docXml = zip.file('word/document.xml').asText();
  
  // A naive regex to find all docxtemplater tags {something} or {#something}
  // docxtemplater tags might be split across XML nodes, so we first strip all XML tags
  // to get the plain text of the document.
  const plainText = docXml.replace(/<[^>]+>/g, '');
  
  const tags = plainText.match(/\{[^}]+\}/g);
  
  if (tags) {
    // Deduplicate tags
    const uniqueTags = [...new Set(tags)];
    console.log("Variabel yang terdeteksi di arsip.docx:");
    uniqueTags.forEach(tag => console.log(tag));
  } else {
    console.log("Tidak ditemukan variabel {} di dalam dokumen.");
  }
} catch (e) {
  console.error("Gagal membaca arsip.docx:", e.message);
}
