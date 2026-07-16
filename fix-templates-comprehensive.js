/**
 * Comprehensive template fixer for docxtemplater - v3
 * Direct XML text manipulation approach
 */

const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const dir = path.join(__dirname, 'public', 'templates-bap');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.docx'));

function extractAndMergeTexts(xml) {
  // Step 1: Remove proofErr
  xml = xml.replace(/<w:proofErr[^>]*\/>/g, '');
  
  // Step 2: Iteratively merge consecutive <w:r> runs where text contains unclosed braces
  let prevXml = '';
  let safety = 0;
  while (xml !== prevXml && safety < 200) {
    prevXml = xml;
    safety++;
    
    // Match: <w:t...>text_with_unclosed_brace</w:t></w:r> followed by <w:r...><w:rPr>...</w:rPr><w:t...>more_text
    // The key insight: we need to handle ANY XML between </w:t></w:r> and the next <w:t>
    // This includes <w:proofErr>, <w:bookmarkStart/End>, etc.
    xml = xml.replace(
      /(<w:t(?:\s[^>]*)?>)([^<]*\{[^}<]*)<\/w:t>\s*<\/w:r>\s*(?:<w:bookmarkStart[^>]*\/>\s*)*(?:<w:bookmarkEnd[^>]*\/>\s*)*<w:r(?:\s[^>]*)?>(?:\s*<w:rPr>[\s\S]*?<\/w:rPr>\s*)?<w:t(?:\s[^>]*)?>([^<]*)/g,
      (match, openTag, text1, text2) => {
        const opens = (text1.match(/\{/g) || []).length;
        const closes = (text1.match(/\}/g) || []).length;
        if (opens > closes) {
          return openTag + text1 + text2;
        }
        return match;
      }
    );
  }
  
  return xml;
}

function fixKnownBrokenTags(xml) {
  // Fix: ket_lb3_jenis} missing opening brace -> {ket_lb3_jenis}
  xml = xml.replace(/>ket_lb3_jenis\}<\/w:t>/g, '>{ket_lb3_jenis}</w:t>');
  
  // Fix: {ket_udara_pantau}} double closing brace
  xml = xml.replace(/\{ket_udara_pantau\}\}/g, '{ket_udara_pantau}');
  
  // Fix: {#saksi} {n: -> {#saksi} {no}. (bap-fasyankes typo)
  xml = xml.replace(/\{#saksi\} \{n:/g, '{#saksi} {no}.');
  
  // Fix: {udara_pantau. (dot instead of })
  xml = xml.replace(/\{udara_pantau\.\s/g, '{udara_pantau} ');
  xml = xml.replace(/\{udara_pantau\}\./g, '{udara_pantau}');
  
  // Fix: {ket_udara_pantau.e.Pengaduan...} 
  xml = xml.replace(/\{ket_udara_pantau\.e\.[^}]*\}/g, '{ket_udara_pantau}');
  xml = xml.replace(/\{ket_udara_pantau\.[^}<]*/g, '{ket_udara_pantau}');
  
  return xml;
}

function fixFooterImageTags(xml) {
  // Convert image tags in footer to regular text tags
  // Footer VML textboxes don't support docxtemplater image module
  xml = xml.replace(/\{%paraf_pengawas\}/g, '{paraf_pengawas_text}');
  xml = xml.replace(/\{%paraf_pemrakarsa\}/g, '{paraf_pemrakarsa_text}');
  return xml;
}

// Main processing
files.forEach(f => {
  console.log(`\n📄 Processing: ${f}`);
  const filePath = path.join(dir, f);
  const content = fs.readFileSync(filePath, 'binary');
  const zip = new PizZip(content);
  let modified = false;
  
  Object.keys(zip.files).forEach(key => {
    if (!key.endsWith('.xml')) return;
    const original = zip.files[key].asText();
    let xml = original;
    
    // Step 1: Merge split tags
    xml = extractAndMergeTexts(xml);
    
    // Step 2: Fix known broken tags (only in document.xml)
    if (key.includes('document')) {
      xml = fixKnownBrokenTags(xml);
    }
    
    // Step 3: Fix footer image tags
    if (key.includes('footer')) {
      xml = fixFooterImageTags(xml);
    }
    
    if (xml !== original) {
      zip.file(key, xml);
      modified = true;
      console.log(`  ✏️ Modified: ${key}`);
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }));
    console.log(`  ✅ Saved`);
  }
});

// Verification
console.log('\n\n========== VERIFICATION (without image module) ==========');
const Docxtemplater = require('docxtemplater');
let allOk = true;

files.forEach(f => {
  const filePath = path.join(dir, f);
  const content = fs.readFileSync(filePath, 'binary');
  const zip = new PizZip(content);
  
  try {
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.render({});
    console.log(`✅ ${f}: OK`);
  } catch (e) {
    allOk = false;
    if (e.properties && e.properties.errors) {
      console.log(`❌ ${f}: ${e.properties.errors.length} errors`);
      e.properties.errors.forEach(err => {
        console.log(`   - [${err.properties.id}] ${err.properties.explanation}`);
        if (err.properties.context) console.log(`     context: "${err.properties.context}"`);
      });
    } else {
      console.log(`❌ ${f}: ${e.message}`);
    }
  }
});

// Now verify with image module too
console.log('\n\n========== VERIFICATION (with image module) ==========');
const ImageModule = require('docxtemplater-image-module-free');

files.forEach(f => {
  const filePath = path.join(dir, f);
  const content = fs.readFileSync(filePath, 'binary');
  const zip = new PizZip(content);
  
  try {
    const imageOpts = {
      centered: false,
      getImage: () => fs.readFileSync(path.join(__dirname, 'public', 'placeholder.png')),
      getSize: () => [100, 100],
    };
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      modules: [new ImageModule(imageOpts)],
    });
    doc.render({});
    console.log(`✅ ${f}: OK (with images)`);
  } catch (e) {
    allOk = false;
    if (e.properties && e.properties.errors) {
      console.log(`❌ ${f}: ${e.properties.errors.length} errors`);
      e.properties.errors.forEach(err => {
        console.log(`   - [${err.properties.id}] ${err.properties.explanation} (${err.properties.file})`);
      });
    } else {
      console.log(`❌ ${f}: ${e.message}`);
    }
  }
});

console.log(allOk ? '\n🎉 ALL TEMPLATES VALID!' : '\n⚠️ Some templates still have errors.');
