const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');

const templatesDir = path.join(__dirname, '..', 'public', 'templates-bap');
const files = ['bap-fasyankes.docx', 'bap-industri.docx', 'bap-perumahan.docx', 'bap-sppg.docx', 'bap-toko.docx'];

// Sample mock red 10x10 PNG data URL
const mockPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC';

files.forEach(filename => {
  console.log('========================================================');
  console.log('Processing template: ' + filename);
  console.log('========================================================');

  // 1. Fetch clean original template from commit 8bb12d1bcd22e39d2dc4d2be435ae40b8487eb52
  const gitCmd = `git show 8bb12d1bcd22e39d2dc4d2be435ae40b8487eb52:public/templates-bap/${filename}`;
  const originalBuf = execSync(gitCmd, { cwd: path.join(__dirname, '..') });
  const zip = new PizZip(originalBuf);
  let xml = zip.file('word/document.xml').asText();

  // 2. Find all matches of 'tangan'
  let pos = 0;
  const matches = [];
  while ((pos = xml.indexOf('tangan', pos)) !== -1) {
    matches.push(pos);
    pos += 6;
  }
  console.log(`Found ${matches.length} matches for 'tangan' in ${filename}`);

  // Match indices:
  // matches[0] = usually header/heading
  // matches[1] = Pihak 1 (Pemrakarsa)
  // matches[2] = Pihak 2 (Perwakilan)
  // matches[3] = Tim Pengawas ({/tim_pengawas})
  // matches[4] = Saksi ({/saksi})

  const posPemrakarsa = matches[1];
  const posPerwakilan = matches[2];
  const posPengawas = matches[3];
  const posSaksi = matches[4];

  // Helper to extract table row bounding indices
  function getRowBounds(fullXml, matchIndex) {
    const trStart = fullXml.lastIndexOf('<w:tr ', matchIndex);
    const trEnd = fullXml.indexOf('</w:tr>', matchIndex) + 7;
    return { trStart, trEnd, trXml: fullXml.substring(trStart, trEnd) };
  }

  // Inject tag into 4th <w:tc> of a row
  function injectIntoCell4(trXml, tag) {
    let tcPos = 0;
    for (let i = 0; i < 4; i++) {
      const match = trXml.substring(tcPos).match(/<w:tc[\s>]/);
      if (!match) break;
      tcPos += match.index;
      if (i < 3) tcPos += 5;
    }
    const endTc = trXml.indexOf('</w:tc>', tcPos);
    const tcContent = trXml.substring(tcPos, endTc);
    const tagParagraph = `<w:p><w:r><w:rPr><w:rFonts w:ascii="Arial Nova Cond" w:hAnsi="Arial Nova Cond"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>${tag}</w:t></w:r></w:p>`;
    return trXml.substring(0, tcPos) + tcContent + tagParagraph + trXml.substring(endTc);
  }

  // Inject tag before the <w:p> that closes the loop inside 4th <w:tc>
  function injectBeforeLoopClose(trXml, tag, loopName) {
    if (trXml.includes(tag)) {
      console.log(`Row already has tag ${tag}`);
      return trXml;
    }
    const loopIdx = trXml.indexOf(loopName);
    if (loopIdx === -1) {
      console.warn(`Loop ${loopName} not found in row! Falling back to injectIntoCell4.`);
      return injectIntoCell4(trXml, tag);
    }
    // Find the <w:p that contains the loop closing tag (use regex or '<w:p ' to avoid matching <w:proofErr)
    const beforeLoop = trXml.substring(0, loopIdx);
    const pStartMatch = beforeLoop.lastIndexOf('<w:p ') !== -1 
      ? beforeLoop.lastIndexOf('<w:p ') 
      : beforeLoop.lastIndexOf('<w:p>');
    
    if (pStartMatch === -1) {
      return injectIntoCell4(trXml, tag);
    }
    
    const tagParagraph = `<w:p><w:r><w:rPr><w:rFonts w:ascii="Arial Nova Cond" w:hAnsi="Arial Nova Cond"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>${tag}</w:t></w:r></w:p>`;
    return trXml.substring(0, pStartMatch) + tagParagraph + trXml.substring(pStartMatch);
  }

  // Perform replacements from bottom to top so string indices remain valid
  // 1. Saksi (matches[4])
  if (posSaksi) {
    const { trStart, trEnd, trXml } = getRowBounds(xml, posSaksi);
    const updated = injectBeforeLoopClose(trXml, '{%ttd_saksi}', 'saksi');
    xml = xml.substring(0, trStart) + updated + xml.substring(trEnd);
  }

  // 2. Tim Pengawas (matches[3])
  if (posPengawas) {
    const { trStart, trEnd, trXml } = getRowBounds(xml, posPengawas);
    const updated = injectBeforeLoopClose(trXml, '{%ttd_pengawas}', 'tim_pengawas');
    xml = xml.substring(0, trStart) + updated + xml.substring(trEnd);
  }

  // 3. Perwakilan (matches[2])
  if (posPerwakilan) {
    const { trStart, trEnd, trXml } = getRowBounds(xml, posPerwakilan);
    const updated = injectIntoCell4(trXml, '{%ttd_perwakilan}');
    xml = xml.substring(0, trStart) + updated + xml.substring(trEnd);
  }

  // 4. Pemrakarsa (matches[1])
  if (posPemrakarsa) {
    const { trStart, trEnd, trXml } = getRowBounds(xml, posPemrakarsa);
    const updated = injectIntoCell4(trXml, '{%ttd_pemrakarsa}');
    xml = xml.substring(0, trStart) + updated + xml.substring(trEnd);
  }

  zip.file('word/document.xml', xml);

  // 3. Verification Render Test
  const imageModule = new ImageModule({
    getImage: () => Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'),
    getSize: () => [150, 60]
  });

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    modules: [imageModule]
  });

  const testPayload = {
    tahun_ini: '2026',
    hari_ini_nama: 'Senin',
    hari_ini_tanggal_terbilang: 'Tujuh',
    hari_ini_bulan: 'November',
    hari_ini_tahun_terbilang: 'Dua Ribu Dua Puluh Enam',
    waktu_pengawasan: '09.00 WIB',
    nama_badan_usaha_kegiatan: 'Usaha Uji Coba',
    alamat_lokasi: 'Sragen',
    pj_nama: 'Budi Santoso',
    pj_jabatan: 'Direktur',
    telepon: '08123456789',
    nama_perwakilan: 'Andi Saputra',
    jabatan_perwakilan: 'Manager HSE',
    telepon_perwakilan: '08987654321',
    ttd_pemrakarsa: mockPng,
    ttd_perwakilan: mockPng,
    tim_pengawas: [
      { no: 1, nama_pengawas: 'Pengawas 1', ttd_pengawas: mockPng }
    ],
    saksi: [
      { no: 1, nama_saksi: 'Saksi 1', jabatan_saksi: 'Staff', ttd_saksi: mockPng }
    ],
    foto_baris: []
  };

  doc.render(testPayload);
  const outDoc = doc.getZip().generate({ type: 'nodebuffer' });
  const outZip = new PizZip(outDoc);
  const mediaCount = Object.keys(outZip.files).filter(k => k.startsWith('word/media/')).length;

  console.log(`Render OK for ${filename}! Media images rendered: ${mediaCount}`);

  // Write updated template (the one with tags intact) to public/templates-bap/
  const targetZip = new PizZip(originalBuf);
  targetZip.file('word/document.xml', xml);
  const finalTemplateBuf = targetZip.generate({ type: 'nodebuffer' });
  const targetPath = path.join(templatesDir, filename);
  fs.writeFileSync(targetPath, finalTemplateBuf);
  console.log(`Saved updated template with tags to ${targetPath} (${finalTemplateBuf.length} bytes)\n`);
});

console.log('ALL 5 TEMPLATES SUCCESSFULLY UPDATED AND VERIFIED!');
