const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

try {
  const templatePath = path.join(process.cwd(), 'src', 'templates', 'uji-administrasi', 'template_ba_uji_admin.docx');
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  const dummyData = {
    nomor_uji_berkas: '123/UJI/2026',
    hari_ini_nama: 'Senin',
    hari_ini_tanggal: 'Tiga Belas',
    hari_ini_bulan: 'Juli',
    hari_ini_tahun: 'Dua Ribu Dua Puluh Enam',
    lokasi_kegiatan: 'Desa Duyungan',
    nama_kegiatan: 'Kegiatan Perdagangan Beras',
    jenis_kegiatan: 'Perdagangan',
    telepon_pemrakarsa: '08123456789',
    nama_pemrakarsa: 'Ambar',
    jabatan_pemrakarsa: 'Direktur',
    email_pemrakarsa: 'ambar@test.com',
    jenis_dokumen: 'SPPL',
    ketua_tim_nama: 'Ketua',
    ketua_tim_instansi: 'DLH',
    ketua_tim_nip: '1234',
    ketua_tim_jabatan: 'Kepala',
    tim_penilai_anggota: [
      { nama: 'Anggota 1', nip: '111', jabatan: 'Staf' },
      { nama: 'Anggota 2', nip: '222', jabatan: 'Staf' }
    ]
  };

  doc.render(dummyData);

  const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
  });

  fs.writeFileSync(path.resolve(process.cwd(), 'test_output.docx'), buf);
  console.log('SUCCESS');
} catch (error) {
  console.error('ERROR:', JSON.stringify({
    message: error.message,
    name: error.name,
    properties: error.properties,
  }, null, 2));
}
