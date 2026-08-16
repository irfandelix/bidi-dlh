const fs = require('fs');
const xml = fs.readFileSync('temp_docx/word/document.xml', 'utf8');
const cleanText = xml.replace(/<[^>]+>/g, '');
const idx = cleanText.indexOf('Tanggal Masuk Dokumen Revisi');
if (idx !== -1) {
  console.log('Found surrounding text:');
  console.log(cleanText.substring(Math.max(0, idx - 50), idx + 200));
} else {
  console.log('Text not found in document.xml');
}
