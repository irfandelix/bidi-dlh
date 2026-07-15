const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const InspectModule = require('docxtemplater/js/inspect-module');

const iModule = InspectModule();
const content = fs.readFileSync('src/templates/registrasi/template_tanda_terima_registrasi.docx', 'binary');
const zip = new PizZip(content);
const doc = new Docxtemplater(zip, { modules: [iModule] });

const tags = iModule.getAllTags();
console.log('Tanda Terima Tags:', Object.keys(tags));

const content2 = fs.readFileSync('src/templates/registrasi/template_checklist.docx', 'binary');
const zip2 = new PizZip(content2);
const doc2 = new Docxtemplater(zip2, { modules: [iModule] });

const tags2 = doc2.modules.find(m => m.name === 'InspectModule').getAllTags();
console.log('Checklist Tags:', Object.keys(tags2));
