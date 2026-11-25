import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PERMIT_OPTIONS,
  CHECKLIST_PUBLIC_URL,
  getQrLogoGeometry,
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

test('validateChecklistSubmission accepts valid official permits with years', () => {
  const result = validateChecklistSubmission({
    nama: '  Budi Santoso ',
    jabatan: ' Penanggung Jawab Lingkungan ',
    nomor_whatsapp: '0812-3456-7890',
    perusahaan_fasyankes: ' RS Sehat Sejahtera ',
    website_honeypot: '',
    daftar_perizinan: [
      { nama_izin: 'Persetujuan SPPL', tahun: '2021' },
      { nama_izin: 'PKPLH', tahun: 2023 },
      { nama_izin: 'MoU Pengangkutan Limbah B3', tahun: '2024' },
    ],
  }, 2026);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.nama, 'Budi Santoso');
    assert.equal(result.data.perusahaan_fasyankes, 'RS Sehat Sejahtera');
    assert.equal(result.data.nomor_whatsapp, '081234567890');
    assert.equal(result.data.belum_ada_izin, false);
    assert.equal(result.data.daftar_perizinan.length, 3);
    assert.deepEqual(result.data.daftar_perizinan[2], {
      nama_izin: 'MoU Pengangkutan Limbah B3',
      tahun: 2024,
      is_manual: false,
    });
  }
});

test('validateChecklistSubmission rejects permits outside the 8 official items', () => {
  const unknownPermit = validateChecklistSubmission({
    nama: 'Andi Wijaya',
    jabatan: 'HRD',
    nomor_whatsapp: '081398765432',
    perusahaan_fasyankes: 'PT Maju Jaya',
    daftar_perizinan: [{ nama_izin: 'Izin Tambahan Manual', tahun: '2022', is_manual: true }],
  }, 2026);

  assert.equal(unknownPermit.ok, false);
});

test('validateChecklistSubmission rejects checked permit with missing or invalid year', () => {
  const missingYear = validateChecklistSubmission({
    nama: 'Siti Aminah',
    jabatan: 'Direktur',
    nomor_whatsapp: '081234567890',
    perusahaan_fasyankes: 'Klinik Pratama Melati',
    daftar_perizinan: [{ nama_izin: 'Persetujuan SPPL', tahun: '' }],
  }, 2026);

  assert.equal(missingYear.ok, false);
  if (!missingYear.ok) {
    assert.match(missingYear.error, /Persetujuan SPPL/);
  }

  const futureYear = validateChecklistSubmission({
    nama: 'Siti Aminah',
    jabatan: 'Direktur',
    nomor_whatsapp: '081234567890',
    perusahaan_fasyankes: 'Klinik Pratama Melati',
    daftar_perizinan: [{ nama_izin: 'PKPLH', tahun: '2099' }],
  }, 2026);

  assert.equal(futureYear.ok, false);
});

test('validateChecklistSubmission requires at least one selected permit without mentioning removed checkbox', () => {
  const emptyUnchecked = validateChecklistSubmission({
    nama: 'Andi Wijaya',
    jabatan: 'HRD',
    nomor_whatsapp: '081398765432',
    perusahaan_fasyankes: 'PT Maju Jaya',
    daftar_perizinan: [],
  }, 2026);

  assert.equal(emptyUnchecked.ok, false);
  if (!emptyUnchecked.ok) {
    assert.equal(
      emptyUnchecked.error,
      'Pilih minimal satu perizinan yang dimiliki beserta tahun terbitnya.'
    );
  }
});

test('isChecklistPublicPath isolates only /checklist-perizinan and blocks internal paths', () => {
  assert.equal(isChecklistPublicPath('/checklist-perizinan'), true);
  assert.equal(isChecklistPublicPath('/checklist-perizinan/'), true);
  assert.equal(isChecklistPublicPath('/perizinan/checklist-mandiri'), false);
  assert.equal(isChecklistPublicPath('/perizinan/daftar'), false);
  assert.equal(isChecklistPublicPath('/'), false);
});

test('CHECKLIST_PUBLIC_URL and getQrLogoGeometry keep center logo safely under QR level H limit', () => {
  assert.equal(CHECKLIST_PUBLIC_URL, 'https://bididlh.vercel.app/checklist-perizinan');
  const geom = getQrLogoGeometry(560);
  assert.ok(geom.padSize > geom.logoSize);
  assert.equal(geom.padX, (560 - geom.padSize) / 2);
  assert.equal(geom.logoX, (560 - geom.logoSize) / 2);
  const occludedRatio = (geom.padSize * geom.padSize) / (560 * 560);
  assert.ok(occludedRatio < 0.06, `Expected <6% area occluded for reliable scan, got ${occludedRatio}`);
});
