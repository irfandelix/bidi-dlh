const fs = require('fs');
const path = require('path');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');

const data = {
  foto_baris: [
    {
      foto_1: 'test1',
      ket_1: 'A',
      foto_2: 'test2',
      ket_2: 'B'
    }
  ]
};

const content = fs.readFileSync('public/templates-bap/bap-fasyankes.docx', 'binary');
const zip = new PizZip(content);
const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

doc.render(data);

const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync('temp_result.docx', buf);
console.log('Done rendering temp_result.docx');
