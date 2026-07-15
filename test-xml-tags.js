const fs = require('fs');
const PizZip = require('pizzip');

const content = fs.readFileSync('src/templates/registrasi/template_checklist.docx', 'binary');
const zip = new PizZip(content);
const xml = zip.file("word/document.xml").asText();

const matches = xml.match(/\{[^}]+\}/g);
console.log([...new Set(matches)]);
