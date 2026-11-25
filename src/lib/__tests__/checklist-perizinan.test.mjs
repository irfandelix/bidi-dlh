import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PERMIT_OPTIONS,
  validateChecklistSubmission,
  normalizeWhatsappNumber,
  isChecklistPublicPath,
} from '../checklist-perizinan.ts';

test('DEFAULT_PERMIT_OPTIONS matches the exact 8 official permit items', () => {
  assert.deepEqual(DEFAULT_PERMIT_OPTIONS, [
    'Persetujuan SPPL',
    'PKPLH',
    'Pertek Pemenuhan Baku Mutu Air Limbah',
    'Pertek Pemenuhan Baku Mutu Emisi',
    'Rintek Penyimpanan Limbah B3',
    'SLO',
    'MoU Pengangkutan Sampah Domestik',
    'MoU Pengangkutan Limbah B3',
  ]);
});

test('normalizeWhatsappNumber cleans spaces and dashes and rejects invalid strings', () => {
  assert.equal(normalizeWhatsappNumber('0812-3456-7890'), '081234567890');
  assert.equal(normalizeWhatsappNumber('+62 812 3456 7890'), '+6281234567890');
  assert.equal(normalizeWhatsappNumber('12345'), null);
  assert.equal(normalizeWhatsappNumber('0812abc7890'), null);
});

test('validateChecklistSubmission accepts valid checked and manual permits with years', () => {
  const result = validateChecklistSubmission({
    nama: '  Budi Santoso ',
    jabatan: ' Penanggung Jawab Lingkungan ',
    nomor_whatsapp: '0812-3456-7890',
    perusahaan_fasyankes: ' RS Sehat Sejahtera ',
    belum_ada_izin: false,
    website_honeypot: '',
    daftar_perizinan: [
      { nama_izin: 'NIB', tahun: '2021', is_manual: false },
      { nama_izin: 'UKL-UPL', tahun: 2023, is_manual: false },
      { nama_izin: ' Izin Radiologi BAPETEN ', tahun: '2024', is_manual: true },
      { nama_izin: '   ', tahun: '', is_manual: true }, // blank manual row ignored
    ],
  }, 2026);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.nama, 'Budi Santoso');
    assert.equal(result.data.perusahaan_fasyankes, 'RS Sehat Sejahtera');
    assert.equal(result.data.nomor_whatsapp, '081234567890');
    assert.equal(result.data.daftar_perizinan.length, 3);
    assert.deepEqual(result.data.daftar_perizinan[2], {
      nama_izin: 'Izin Radiologi BAPETEN',
      tahun: 2024,
      is_manual: true,
    });
  }
});

test('validateChecklistSubmission rejects checked permit with missing or invalid year', () => {
  const missingYear = validateChecklistSubmission({
    nama: 'Siti Aminah',
    jabatan: 'Direktur',
    nomor_whatsapp: '081234567890',
    perusahaan_fasyankes: 'Klinik Pratama Melati',
    belum_ada_izin: false,
    daftar_perizinan: [{ nama_izin: 'SPPL', tahun: '', is_manual: false }],
  }, 2026);

  assert.equal(missingYear.ok, false);
  if (!missingYear.ok) {
    assert.match(missingYear.error, /SPPL/);
  }

  const futureYear = validateChecklistSubmission({
    nama: 'Siti Aminah',
    jabatan: 'Direktur',
    nomor_whatsapp: '081234567890',
    perusahaan_fasyankes: 'Klinik Pratama Melati',
    belum_ada_izin: false,
    daftar_perizinan: [{ nama_izin: 'SPPL', tahun: '2099', is_manual: false }],
  }, 2026);

  assert.equal(futureYear.ok, false);
});

test('validateChecklistSubmission rejects half-filled manual permit row', () => {
  const missingName = validateChecklistSubmission({
    nama: 'Andi Wijaya',
    jabatan: 'HRD',
    nomor_whatsapp: '081398765432',
    perusahaan_fasyankes: 'PT Maju Jaya',
    belum_ada_izin: false,
    daftar_perizinan: [{ nama_izin: '  ', tahun: '2022', is_manual: true }],
  }, 2026);

  assert.equal(missingName.ok, false);
});

test('validateChecklistSubmission requires at least one permit unless belum_ada_izin is true', () => {
  const emptyUnchecked = validateChecklistSubmission({
    nama: 'Andi Wijaya',
    jabatan: 'HRD',
    nomor_whatsapp: '081398765432',
    perusahaan_fasyankes: 'PT Maju Jaya',
    belum_ada_izin: false,
    daftar_perizinan: [],
  }, 2026);
  assert.equal(emptyUnchecked.ok, false);

  const explicitNone = validateChecklistSubmission({
    nama: 'Andi Wijaya',
    jabatan: 'HRD',
    nomor_whatsapp: '081398765432',
    perusahaan_fasyankes: 'PT Maju Jaya',
    belum_ada_izin: true,
    daftar_perizinan: [{ nama_izin: 'NIB', tahun: '2022', is_manual: false }],
  }, 2026);
  assert.equal(explicitNone.ok, true);
  if (explicitNone.ok) {
    assert.deepEqual(explicitNone.data.daftar_perizinan, []);
    assert.equal(explicitNone.data.belum_ada_izin, true);
  }
});

test('isChecklistPublicPath isolates only /checklist-perizinan and blocks internal paths', () => {
  assert.equal(isChecklistPublicPath('/checklist-perizinan'), true);
  assert.equal(isChecklistPublicPath('/checklist-perizinan/'), true);
  assert.equal(isChecklistPublicPath('/perizinan/checklist-mandiri'), false);
  assert.equal(isChecklistPublicPath('/perizinan/daftar'), false);
  assert.equal(isChecklistPublicPath('/'), false);
});
