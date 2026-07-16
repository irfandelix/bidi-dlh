import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// @ts-ignore
import ImageModule from 'docxtemplater-image-module-free';

async function main() {
  const templates = fs.readdirSync(path.join(process.cwd(), 'public', 'templates-bap')).filter(f => f.endsWith('.docx') && !f.startsWith('~$'));
  
  for (const t of templates) {
    try {
      const templatePath = path.join(process.cwd(), 'public', 'templates-bap', t);
      const content = fs.readFileSync(templatePath, 'binary');
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, modules: [new ImageModule({ getImage: () => Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'), getSize: () => [100, 100] })] });
      doc.render({});
      console.log(t, 'Success');
    } catch(e: any) {
      console.log(t, 'Failed:', e.properties ? e.properties.errors : e);
    }
  }
}
main();
