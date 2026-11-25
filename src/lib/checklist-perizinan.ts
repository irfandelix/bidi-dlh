export const DEFAULT_PERMIT_OPTIONS = [
  'Persetujuan SPPL',
  'PKPLH',
  'Pertek Pemenuhan Baku Mutu Air Limbah',
  'Pertek Pemenuhan Baku Mutu Emisi',
  'Rintek Penyimpanan Limbah B3',
  'SLO',
  'MoU Pengangkutan Sampah Domestik',
  'MoU Pengangkutan Limbah B3',
] as const;

const ALLOWED_PERMIT_SET = new Set<string>(DEFAULT_PERMIT_OPTIONS);

export interface PermitEntry {
  nama_izin: string;
  tahun: number;
  is_manual: boolean;
}

export interface RawPermitInput {
  nama_izin?: unknown;
  tahun?: unknown;
  is_manual?: unknown;
}

export interface ValidatedChecklistSubmission {
  nama: string;
  jabatan: string;
  nomor_whatsapp: string;
  perusahaan_fasyankes: string;
  daftar_perizinan: PermitEntry[];
  belum_ada_izin: boolean;
}

export type ValidationResult =
  | { ok: true; data: ValidatedChecklistSubmission }
  | { ok: false; error: string };

export function isChecklistPublicPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === '/checklist-perizinan' || pathname.startsWith('/checklist-perizinan/');
}

export function normalizeWhatsappNumber(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().replace(/[\s\-().]/g, '');
  if (!/^\+?\d{8,20}$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

export function validateChecklistSubmission(
  raw: unknown,
  currentYear: number = new Date().getFullYear()
): ValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Format data formulir tidak valid.' };
  }

  const body = raw as Record<string, unknown>;

  if (typeof body.website_honeypot === 'string' && body.website_honeypot.trim() !== '') {
    return { ok: false, error: 'Permintaan tidak dapat diproses.' };
  }

  const nama = typeof body.nama === 'string' ? body.nama.trim() : '';
  if (nama.length < 2 || nama.length > 150) {
    return { ok: false, error: 'Nama wajib diisi (2 sampai 150 karakter).' };
  }

  const jabatan = typeof body.jabatan === 'string' ? body.jabatan.trim() : '';
  if (jabatan.length < 2 || jabatan.length > 150) {
    return { ok: false, error: 'Jabatan wajib diisi (2 sampai 150 karakter).' };
  }

  const nomorWhatsapp = normalizeWhatsappNumber(body.nomor_whatsapp);
  if (!nomorWhatsapp) {
    return { ok: false, error: 'Nomor WhatsApp wajib berupa angka yang valid (8 sampai 20 digit).' };
  }

  const perusahaan = typeof body.perusahaan_fasyankes === 'string' ? body.perusahaan_fasyankes.trim() : '';
  if (perusahaan.length < 2 || perusahaan.length > 200) {
    return { ok: false, error: 'Nama Perusahaan atau Fasyankes wajib diisi (2 sampai 200 karakter).' };
  }

  if (!Array.isArray(body.daftar_perizinan)) {
    return { ok: false, error: 'Daftar perizinan tidak valid.' };
  }

  if (body.daftar_perizinan.length > DEFAULT_PERMIT_OPTIONS.length) {
    return { ok: false, error: 'Jumlah item perizinan melebihi daftar yang tersedia.' };
  }

  const maxYear = currentYear + 1;
  const cleanedPermits: PermitEntry[] = [];
  const seenNames = new Set<string>();

  for (const rawItem of body.daftar_perizinan as RawPermitInput[]) {
    if (!rawItem || typeof rawItem !== 'object') continue;

    const namaIzin = typeof rawItem.nama_izin === 'string' ? rawItem.nama_izin.trim() : '';
    const rawTahunStr = rawItem.tahun === undefined || rawItem.tahun === null ? '' : String(rawItem.tahun).trim();

    if (!ALLOWED_PERMIT_SET.has(namaIzin)) {
      return { ok: false, error: 'Jenis perizinan tidak sesuai dengan daftar resmi.' };
    }

    if (!/^\d{4}$/.test(rawTahunStr)) {
      return {
        ok: false,
        error: `Tahun terbit untuk "${namaIzin}" wajib diisi 4 digit angka (1950 sampai ${maxYear}).`,
      };
    }

    const tahunNum = Number(rawTahunStr);
    if (!Number.isInteger(tahunNum) || tahunNum < 1950 || tahunNum > maxYear) {
      return {
        ok: false,
        error: `Tahun terbit untuk "${namaIzin}" harus berada di rentang 1950 sampai ${maxYear}.`,
      };
    }

    const lowerKey = namaIzin.toLowerCase();
    if (seenNames.has(lowerKey)) {
      return {
        ok: false,
        error: `Perizinan "${namaIzin}" tertulis lebih dari satu kali.`,
      };
    }
    seenNames.add(lowerKey);

    cleanedPermits.push({
      nama_izin: namaIzin,
      tahun: tahunNum,
      is_manual: false,
    });
  }

  if (cleanedPermits.length === 0) {
    return {
      ok: false,
      error: 'Pilih minimal satu perizinan yang dimiliki beserta tahun terbitnya.',
    };
  }

  return {
    ok: true,
    data: {
      nama,
      jabatan,
      nomor_whatsapp: nomorWhatsapp,
      perusahaan_fasyankes: perusahaan,
      daftar_perizinan: cleanedPermits,
      belum_ada_izin: false,
    },
  };
}
