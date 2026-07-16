import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// @ts-ignore
import ImageModule from 'docxtemplater-image-module-free';

const templateDir = path.join(process.cwd(), 'public', 'templates-bap');
const files = fs.readdirSync(templateDir).filter(f => f.endsWith('.docx') && !f.startsWith('~$'));

for (const file of files) {
  try {
    const content = fs.readFileSync(path.join(templateDir, file), 'binary');
    const zip = new PizZip(content);
    
    const imageOptions = {
      centered: false,
      getImage: function (tagValue: string) {
        return Buffer.from('');
      },
      getSize: function (img: any, tagValue: string, tagName: string) {
        return [150, 150];
      },
    };
    const imageModule = new ImageModule(imageOptions);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      modules: [imageModule]
    });
    
    // Try to render with empty object to see if it throws
    doc.render({});
    
    console.log(file, 'Success');
  } catch (e: any) {
    console.log(file, 'Error');
    if (e.properties && e.properties.errors) {
      console.log(e.properties.errors);
    } else {
      console.log(e);
    }
  }
}
