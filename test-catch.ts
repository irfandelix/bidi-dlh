import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ImageModule from 'docxtemplater-image-module-free';

const templateName = 'bap-perumahan.docx';
const templatePath = path.join(process.cwd(), 'public', 'templates-bap', templateName);
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

const imageOptions = {
  getImage: function(tagValue: string, tagName: string) {
    const emptyImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    if (!tagValue || typeof tagValue !== 'string') return emptyImageBuffer;
    
    const base64Regex = /^data:image\/(png|jpeg|jpg);base64,/;
    if (!base64Regex.test(tagValue)) return emptyImageBuffer;
    
    try {
      const base64Data = tagValue.replace(base64Regex, '');
      return Buffer.from(base64Data, 'base64');
    } catch (e) {
      return emptyImageBuffer;
    }
  },
  getSize: function(img: any, tagValue: string, tagName: string) {
    return [200, 150];
  }
};

const imageModule = new ImageModule(imageOptions);

try {
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    modules: [imageModule]
  });
  
  const data = {
    paraf_pemrakarsa: '',
    paraf_pengawas: '',
    tim_pengawas: [{ paraf_pengawas: '' }],
    foto_baris: [{ foto_1: '', foto_2: '' }]
  };
  
  doc.render(data);
  console.log('Rendered successfully');
} catch (error: any) {
  console.log('RENDER ERROR:');
  console.log(JSON.stringify({
    error: error.message,
    properties: error.properties
  }, null, 2));
}
