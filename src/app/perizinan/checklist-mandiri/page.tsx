'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  Copy,
  Check,
  Download,
  ExternalLink,
  Search,
  Trash2,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Loader2,
  QrCode,
  X,
} from 'lucide-react';
import { CHECKLIST_PUBLIC_URL, type PermitEntry } from '@/lib/checklist-perizinan';
import { generateChecklistQrWithLogo, downloadQrPng } from '@/lib/checklist-qr-client';

interface ChecklistRecord {
  id: number;
  nama: string;
  jabatan: string;
  nomor_whatsapp: string;
  perusahaan_fasyankes: string;
  daftar_perizinan: PermitEntry[];
  belum_ada_izin: boolean;
  created_at: string;
}

export default function RekapChecklistMandiriPage() {
  const [records, setRecords] = useState<ChecklistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ChecklistRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/checklist-perizinan');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(json.error || 'Gagal memuat data rekap checklist perizinan.');
        return;
      }
      setRecords(Array.isArray(json.data) ? json.data : []);
    } catch {
      setErrorMsg('Koneksi ke server gagal saat mengambil rekap data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteTarget && !deleting) setDeleteTarget(null);
        if (qrModalOpen) setQrModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteTarget, deleting, qrModalOpen]);

  const handleOpenQrModal = async () => {
    setQrModalOpen(true);
    if (qrDataUrl) return;
    setQrLoading(true);
    try {
      const generated = await generateChecklistQrWithLogo(CHECKLIST_PUBLIC_URL, 640);
      setQrDataUrl(generated);
    } finally {
      setQrLoading(false);
    }
  };

  const handleCopyPublicLink = async () => {
    await navigator.clipboard.writeText(CHECKLIST_PUBLIC_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/checklist-perizinan?id=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErrorMsg(json.error || 'Gagal menghapus baris data.');
        return;
      }
      setRecords((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setErrorMsg('Gagal menghubungi server saat menghapus data.');
    } finally {
      setDeleting(false);
    }
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredRecords = records.filter((r) => {
    if (!q) return true;
    const permitsText = (r.daftar_perizinan || [])
      .map((p) => `${p.nama_izin} ${p.tahun}`)
      .join(' ')
      .toLowerCase();
    return (
      r.perusahaan_fasyankes.toLowerCase().includes(q) ||
      r.nama.toLowerCase().includes(q) ||
      r.jabatan.toLowerCase().includes(q) ||
      r.nomor_whatsapp.toLowerCase().includes(q) ||
      permitsText.includes(q)
    );
  });

  const exportHref = `/api/export/checklist-perizinan${
    searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : ''
  }`;

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/perizinan/daftar"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:underline mb-1 min-h-9"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Kembali ke Dashboard Perizinan</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-700 text-teal-800 flex items-center justify-center shrink-0">
              <ClipboardCheck size={22} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Rekap Checklist Perizinan Mandiri
              </h1>
              <p className="text-sm font-semibold text-slate-600">
                Data kiriman dari tautan publik khusus HP (`/checklist-perizinan`).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenQrModal}
            className="min-h-11 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <QrCode size={17} aria-hidden="true" />
            <span>Tampilkan &amp; Unduh QR</span>
          </button>

          <button
            type="button"
            onClick={handleCopyPublicLink}
            className="min-h-11 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            {copiedLink ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
            <span>{copiedLink ? 'Tautan Disalin' : 'Salin Link Formulir HP'}</span>
          </button>

          <Link
            href="/checklist-perizinan"
            target="_blank"
            className="min-h-11 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-400 text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <ExternalLink size={17} aria-hidden="true" />
            <span>Lihat Formulir</span>
          </Link>

          <a
            href={exportHref}
            className="min-h-11 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Download size={17} aria-hidden="true" />
            <span>Ekspor Excel</span>
          </a>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-md overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm font-black text-slate-900">
            {loading ? 'Memuat data...' : `${filteredRecords.length} kiriman ditampilkan`}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <label htmlFor="search-rekap-checklist" className="sr-only">
                Cari perusahaan, nama pengisi, atau jenis izin
              </label>
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="search-rekap-checklist"
                type="text"
                placeholder="Cari perusahaan, pengisi, WA, atau izin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-11 pl-10 pr-3.5 py-2 bg-white border-2 border-slate-400 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-500 focus:border-teal-700"
              />
            </div>

            <button
              type="button"
              onClick={loadRecords}
              aria-label="Muat ulang data checklist"
              className="w-11 h-11 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-400 text-slate-800 flex items-center justify-center shrink-0 transition-colors"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            </button>
          </div>
        </div>

        {errorMsg ? (
          <div role="alert" className="m-5 p-4 rounded-2xl bg-red-50 border-2 border-red-600 flex items-center justify-between gap-3 text-red-900">
            <div className="flex items-center gap-2.5 text-sm font-bold">
              <AlertCircle size={19} aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={loadRecords}
              className="min-h-11 px-3.5 py-2 rounded-xl bg-white border border-red-600 text-xs font-black text-red-900 hover:bg-red-100"
            >
              Coba Lagi
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-700">
            <Loader2 size={28} className="animate-spin text-teal-700" aria-hidden="true" />
            <p className="text-sm font-bold">Memuat data checklist perizinan mandiri...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-10 text-center max-w-md mx-auto space-y-3">
            <p className="text-base font-black text-slate-900">
              {records.length === 0
                ? 'Belum ada kiriman checklist perizinan'
                : 'Tidak ada data yang cocok dengan pencarian'}
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              {records.length === 0
                ? 'Salin dan bagikan tautan formulir khusus HP kepada perwakilan perusahaan atau fasyankes untuk mulai menerima data.'
                : 'Ubah kata kunci pencarian atau tampilkan kembali seluruh data kiriman.'}
            </p>
            {records.length === 0 ? (
              <button
                type="button"
                onClick={handleCopyPublicLink}
                className="min-h-11 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold inline-flex items-center gap-2"
              >
                <Copy size={16} aria-hidden="true" />
                <span>Salin Link Formulir HP</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="min-h-11 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold inline-flex items-center gap-2"
              >
                <span>Reset Pencarian</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredRecords.map((item) => {
              const formattedDate = new Date(item.created_at).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              });
              const waDigits = item.nomor_whatsapp.replace(/^\+/, '').replace(/^0/, '62');

              return (
                <article
                  key={item.id}
                  className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-start justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-black text-slate-900">
                        {item.perusahaan_fasyankes}
                      </h2>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-300 rounded-lg px-2 py-0.5">
                        {formattedDate}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 font-semibold">
                      {item.nama} ({item.jabatan}) · WA:{' '}
                      <a
                        href={`https://wa.me/${waDigits}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-800 underline font-bold"
                      >
                        {item.nomor_whatsapp}
                      </a>
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {item.belum_ada_izin || !item.daftar_perizinan?.length ? (
                        <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-500 rounded-lg px-2.5 py-1">
                          Belum memiliki dokumen perizinan
                        </span>
                      ) : (
                        item.daftar_perizinan.map((p) => (
                          <span
                            key={`${item.id}-${p.nama_izin}-${p.tahun}`}
                            className={`text-xs font-bold rounded-lg px-2.5 py-1 border ${
                              p.is_manual
                                ? 'bg-teal-50 text-teal-900 border-teal-700'
                                : 'bg-emerald-50 text-emerald-900 border-emerald-700'
                            }`}
                          >
                            {p.nama_izin} · {p.tahun}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      aria-label={`Hapus kiriman ${item.perusahaan_fasyankes}`}
                      className="w-11 h-11 rounded-xl bg-white hover:bg-red-50 border-2 border-slate-300 hover:border-red-600 text-red-800 flex items-center justify-center transition-colors"
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {qrModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-qr-judul"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
        >
          <div className="bg-white border-2 border-slate-300 rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-4 text-center">
            <div className="flex items-start justify-between gap-3 text-left">
              <div>
                <h2 id="dialog-qr-judul" className="text-base font-black text-slate-900">
                  Kode QR Checklist Perizinan
                </h2>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                  Scan menggunakan kamera HP untuk membuka formulir.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                aria-label="Tutup dialog QR"
                className="w-11 h-11 -mt-2 -mr-2 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-700 shrink-0"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-1">
              {qrLoading || !qrDataUrl ? (
                <div className="w-60 h-60 rounded-2xl border-2 border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2.5 text-slate-700">
                  <Loader2 size={26} className="animate-spin text-teal-700" aria-hidden="true" />
                  <span className="text-xs font-bold">Membuat kode QR...</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-2xl border-2 border-teal-700 bg-white inline-block">
                  <img
                    src={qrDataUrl}
                    alt="Kode QR Checklist Perizinan dengan logo BIDI DLH di tengah"
                    width={240}
                    height={240}
                    className="w-60 h-60 object-contain block"
                  />
                </div>
              )}
              <p className="mt-2.5 text-xs font-black text-slate-800 bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 break-all">
                bididlh.vercel.app/checklist-perizinan
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                type="button"
                disabled={!qrDataUrl}
                onClick={() => downloadQrPng(qrDataUrl)}
                className="w-full min-h-11 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-400 text-white text-sm font-bold flex items-center justify-center gap-2"
              >
                <Download size={16} aria-hidden="true" />
                <span>Unduh Gambar QR (PNG)</span>
              </button>
              <Link
                href="/checklist-perizinan/qr"
                target="_blank"
                className="w-full min-h-11 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-400 text-slate-900 text-sm font-bold flex items-center justify-center gap-2"
              >
                <ExternalLink size={16} aria-hidden="true" />
                <span>Buka Layar Penuh / Cetak QR</span>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-hapus-judul"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
        >
          <div className="bg-white border-2 border-slate-300 rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h2 id="dialog-hapus-judul" className="text-base font-black text-slate-900">
                Hapus Data Kiriman?
              </h2>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                aria-label="Tutup dialog"
                className="w-11 h-11 -mt-2 -mr-2 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-700"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Data checklist dari <span className="font-bold text-slate-900">{deleteTarget.perusahaan_fasyankes}</span> ({deleteTarget.nama}) akan dihapus permanen.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="min-h-11 px-4 py-2 rounded-xl border-2 border-slate-400 text-slate-800 text-sm font-bold hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="min-h-11 px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-sm font-bold flex items-center gap-2"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
                <span>Hapus Permanen</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
