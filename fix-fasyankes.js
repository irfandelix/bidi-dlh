const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

function cleanXmlString(xml) {
  // Remove proofErr tags
  let cleaned = xml.replace(/<w:proofErr[^>]*\/>/g, '');
  
  // Fix tag splits like { </w:t> ... <w:t> % }
  // A generic way to fix this is to find \{ and \} or \% and pull them together
  // Actually, we can just remove formatting inside docxtemplater tags if possible
  // For docxtemplater, if the tag is split across multiple <w:t> elements, it causes unopened_tag.
  // We can just aggressively replace known broken tags for fasyankes.
  
  // Example broken tag: }ket_lb3_jenis
  // We know it should be {%ket_lb3_jenis} or {ket_lb3_jenis}
  cleaned = cleaned.replace(/}ket_lb3_jenis/g, '{ket_lb3_jenis}'); // Wait, if it's missing the opening, we can just replace the specific text!
  
  // But wait, the raw_tag_outerxml_invalid is about %paraf_pengawas not being in a paragraph,
  // OR the XML around it being broken.
  // In `bap-fasyankes.docx`, `%paraf_pengawas` in footer1.xml had:
  // `<w:t xml:space="preserve"> %paraf_pengawas</w:t>` with other stuff around it, or it lost its <w:p> tags.
  // Actually, the previous script `fix-all-templates.js` was very good at fixing docxtemplater tags!
  // I will just use the logic from before!
  
  // Fix split tags (simple version):
  // Find { and } and remove any XML tags between them, BUT this is risky.
  // Instead, the best way to fix docxtemplater tags is to remove `w:proofErr` and any `w:r` splits in the middle of tags.
  
  return cleaned;
}

async function fixFasyankes() {
  const t = 'bap-fasyankes.docx';
  const filePath = path.join(process.cwd(), 'public', 'templates-bap', t);
  console.log(`Processing ${t}...`);
  try {
    const content = fs.readFileSync(filePath, 'binary');
    const zip = new PizZip(content);
    
    // Fix all XML files in the docx
    for (const key of Object.keys(zip.files)) {
      if (key.endsWith('.xml')) {
        let xml = zip.files[key].asText();
        
        // 1. Remove proofErr
        xml = xml.replace(/<w:proofErr[^>]*\/>/g, '');
        
        // 2. Fix the specific unopened tag error: `}ket_lb3_jenis`
        // It's probably `{%ket_lb3_jenis}` or something similar split across tags.
        // Let's use a regex to find any tag that starts with { and ends with } and remove all XML tags inside it.
        // A simple approach: we know docxtemplater tags usually don't contain XML themselves.
        // But doing it generally is hard with regex.
        
        // Let's specifically fix known bad strings in fasyankes:
        xml = xml.replace(/<w:t>\{<\/w:t><w:r[^>]*><w:t>ket_lb3_jenis\}<\/w:t>/g, '<w:t>{ket_lb3_jenis}</w:t>');
        xml = xml.replace(/<w:t>\{%<\/w:t><w:r[^>]*><w:t>paraf_pengawas\}<\/w:t>/g, '<w:t>{%paraf_pengawas}</w:t>');
        
        // The safest general fix for docxtemplater tags split by Word's spellchecker/formatting:
        // Replace occurrences of docxtemplater tags that got split.
        // Since we are not 100% sure how they are split, let's use the robust `xml = xml.replace(/(<w:t[^>]*>)(.*?)(<\/w:t>)/g, ...)` 
        // No, let's just strip all XML between { and }.
        // We can do this by finding `{` and `}` and removing any `<...>` inside.
        let inTag = false;
        let result = '';
        for (let i = 0; i < xml.length; i++) {
          if (xml[i] === '{') inTag = true;
          if (xml[i] === '}') { inTag = false; result += '}'; continue; }
          
          if (inTag && xml[i] === '<') {
            // Skip until '>'
            while (xml[i] !== '>' && i < xml.length) i++;
            continue;
          }
          result += xml[i];
        }
        xml = result;
        
        zip.file(key, xml);
      }
    }
    
    const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(filePath, buf);
    console.log(`Successfully fixed ${t}`);
  } catch (err) {
    console.error(`Error fixing ${t}:`, err);
  }
}

fixFasyankes();
