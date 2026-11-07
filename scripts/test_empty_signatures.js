const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');

const templatesDir = path.join(__dirname, '..', 'public', 'templates-bap');
const files = ['bap-fasyankes.docx', 'bap-industri.docx', 'bap-perumahan.docx', 'bap-sppg.docx', 'bap-toko.docx'];

const imageModule = new ImageModule({
  getImage: (tagValue) => {
    const emptyImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    if (!tagValue || typeof tagValue !== 'string') return emptyImageBuffer;
    const base64Regex = /^data:image\/(png|jpeg|jpg);base64,/;
    if (!base64Regex.test(tagValue)) return emptyImageBuffer;
    try {
      return Buffer.from(tagValue.replace(base64Regex, ''), 'base64');
    } catch {
      return emptyImageBuffer;
    }
  },
  getSize: (img, tagValue, tagName) => {
    if (!tagValue || typeof tagValue !== 'string' || !tagValue.startsWith('data:image')) {
      return [1, 1];
    }
    return [150, 60];
  }
});

files.forEach(filename => {
  const content = fs.readFileSync(path.join(templatesDir, filename));
  const zip = new PizZip(content);
  
  const imageModule = new ImageModule({
    getImage: (tagValue) => {
      const emptyImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
      if (!tagValue || typeof tagValue !== 'string') return emptyImageBuffer;
      const base64Regex = /^data:image\/(png|jpeg|jpg);base64,/;
      if (!base64Regex.test(tagValue)) return emptyImageBuffer;
      try {
        return Buffer.from(tagValue.replace(base64Regex, ''), 'base64');
      } catch {
        return emptyImageBuffer;
      }
    },
    getSize: (img, tagValue, tagName) => {
      if (!tagValue || typeof tagValue !== 'string' || !tagValue.startsWith('data:image')) {
        return [1, 1];
      }
      return [150, 60];
    }
  });

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    modules: [imageModule]
  });

  doc.render({
    tahun_ini: '2026',
    hari_ini_nama: 'Senin',
    hari_ini_tanggal_terbilang: 'Tujuh',
    hari_ini_bulan: 'November',
    hari_ini_tahun_terbilang: 'Dua Ribu Dua Puluh Enam',
    waktu_pengawasan: '09.00 WIB',
    nama_badan_usaha_kegiatan: 'Usaha Uji Coba Tanpa TTD',
    alamat_lokasi: 'Sragen',
    pj_nama: 'Budi Santoso',
    pj_jabatan: 'Direktur',
    telepon: '08123456789',
    nama_perwakilan: '',
    jabatan_perwakilan: '',
    telepon_perwakilan: '',
    ttd_pemrakarsa: '',
    ttd_perwakilan: '',
    tim_pengawas: [
      { no: 1, nama_pengawas: 'Pengawas 1', ttd_pengawas: '' }
    ],
    saksi: [],
    foto_baris: []
  });

  const out = doc.getZip().generate({ type: 'nodebuffer' });
  console.log(`Success rendering ${filename} without signatures! Buffer size: ${out.length}`);
});

console.log('ALL TESTS PASSED WITH EMPTY SIGNATURES!');
