'use client';

import React, { useState, useRef } from 'react';
import {
  Check,
  Send,
  AlertCircle,
  Loader2,
  RotateCcw,
  Building2,
  FileCheck2,
} from 'lucide-react';
import {
  DEFAULT_PERMIT_OPTIONS,
  validateChecklistSubmission,
  type ValidatedChecklistSubmission,
} from '@/lib/checklist-perizinan';

export default function ChecklistPerizinanMandiriPage() {
  const currentYear = new Date().getFullYear();

  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [nomorWhatsapp, setNomorWhatsapp] = useState('');
  const [perusahaan, setPerusahaan] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [checkedYears, setCheckedYears] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedResult, setSubmittedResult] = useState<ValidatedChecklistSubmission | null>(null);

  const errorBannerRef = useRef<HTMLDivElement>(null);
  const yearInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const toggleDefaultPermit = (permitName: string) => {
    setErrorMsg('');
    setCheckedYears((prev) => {
      const next = { ...prev };
      if (Object.prototype.hasOwnProperty.call(next, permitName)) {
        delete next[permitName];
      } else {
        next[permitName] = '';
        setTimeout(() => {
          yearInputRefs.current[permitName]?.focus();
        }, 30);
      }
      return next;
    });
  };

  const handleDefaultYearChange = (permitName: string, rawVal: string) => {
    const digitsOnly = rawVal.replace(/\D/g, '').slice(0, 4);
    setErrorMsg('');
    setCheckedYears((prev) => ({
      ...prev,
      [permitName]: digitsOnly,
    }));
  };

  const handleResetForm = () => {
    setNama('');
    setJabatan('');
    setNomorWhatsapp('');
    setPerusahaan('');
    setHoneypot('');
    setCheckedYears({});
    setErrorMsg('');
    setSubmittedResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalSelectedCount = Object.keys(checkedYears).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const selectedPermits = DEFAULT_PERMIT_OPTIONS.filter((p) =>
      Object.prototype.hasOwnProperty.call(checkedYears, p)
    ).map((p) => ({
      nama_izin: p,
      tahun: checkedYears[p],
      is_manual: false,
    }));

    const payload = {
      nama,
      jabatan,
      nomor_whatsapp: nomorWhatsapp,
      perusahaan_fasyankes: perusahaan,
      daftar_perizinan: selectedPermits,
      belum_ada_izin: false,
      website_honeypot: honeypot,
    };

    const clientCheck = validateChecklistSubmission(payload, currentYear);
    if (!clientCheck.ok) {
      setErrorMsg(clientCheck.error);
      setTimeout(() => {
        errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 30);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/checklist-perizinan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(json.error || 'Gagal mengirim data perizinan. Silakan coba kembali.');
        setTimeout(() => {
          errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 30);
        return;
      }

      setSubmittedResult(clientCheck.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setErrorMsg('Koneksi terputus saat mengirim data. Pastikan internet HP Anda aktif lalu kirim ulang.');
      setTimeout(() => {
        errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 30);
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedResult) {
    return (
      <div className="w-full max-w-[460px] mx-auto px-3.5 py-6 sm:py-10">
        <section
          role="status"
          aria-live="polite"
          className="checklist-success-card bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-md space-y-5"
        >
          <div className="text-center border-b border-slate-200 pb-5 pt-1 space-y-3">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <span
                aria-hidden="true"
                className="checklist-success-ring absolute inset-0 rounded-full border-2 border-emerald-600 pointer-events-none opacity-0"
              />
              <div className="checklist-success-badge w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
                <svg
                  viewBox="0 0 80 80"
                  width="80"
                  height="80"
                  fill="none"
                  aria-hidden="true"
                  className="w-20 h-20"
                >
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="#047857"
                    strokeWidth="4"
                    className="checklist-success-circle"
                  />
                  <path
                    d="M25 41.5L35.5 52L56 29.5"
                    stroke="#047857"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="checklist-success-check"
                  />
                </svg>
              </div>
            </div>

            <div>
              <h1 className="text-xl font-black text-slate-900 leading-snug">
                Data Perizinan Berhasil Tersimpan
              </h1>
              <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">
                Terima kasih. Isian checklist perizinan dari{' '}
                <span className="font-bold text-slate-900">{submittedResult.perusahaan_fasyankes}</span> telah masuk ke basis data Dinas Lingkungan Hidup Kabupaten Sragen.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-2.5 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-slate-600 font-semibold">Nama Pengisi</span>
              <span className="text-slate-900 font-bold text-right">{submittedResult.nama}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-600 font-semibold">Jabatan</span>
              <span className="text-slate-900 font-bold text-right">{submittedResult.jabatan}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-600 font-semibold">Nomor WhatsApp</span>
              <span className="text-slate-900 font-bold text-right">{submittedResult.nomor_whatsapp}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-black text-slate-900">
              Ringkasan Perizinan Tercatat
            </h2>
            <ul className="divide-y divide-slate-200 border border-slate-300 rounded-xl bg-white overflow-hidden">
              {submittedResult.daftar_perizinan.map((item, idx) => (
                <li
                  key={`${item.nama_izin}-${item.tahun}`}
                  style={{ animationDelay: `${Math.min(380 + idx * 55, 680)}ms` }}
                  className="checklist-success-item px-3.5 py-2.5 flex items-center justify-between gap-3 text-sm"
                >
                  <span className="font-bold text-slate-900">{item.nama_izin}</span>
                  <span className="font-black text-emerald-800 bg-emerald-50 border border-emerald-600 rounded-lg px-2.5 py-0.5 shrink-0">
                    Tahun {item.tahun}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={handleResetForm}
            className="w-full min-h-12 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <RotateCcw size={18} aria-hidden="true" />
            <span>Isi untuk Perusahaan / Fasyankes Lain</span>
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[460px] mx-auto px-3.5 pt-4 pb-12 sm:py-8">
      <header className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm mb-4">
        <div className="flex items-center gap-3.5">
          <img
            src="/BIDIDLH.png"
            alt="Logo BIDI DLH Kabupaten Sragen"
            width={48}
            height={48}
            fetchPriority="high"
            className="w-12 h-12 rounded-xl border border-slate-200 object-contain shrink-0 bg-white p-0.5"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-teal-800">
              Dinas Lingkungan Hidup Kabupaten Sragen
            </p>
            <h1 className="text-lg font-black text-slate-900 leading-tight mt-0.5">
              Checklist Kepemilikan Perizinan
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-700 mt-3 leading-relaxed border-t border-slate-200 pt-2.5">
          Isi identitas usaha atau fasyankes Anda, lalu centang dokumen perizinan yang dimiliki beserta tahun terbitnya.
        </p>
      </header>

      {errorMsg ? (
        <div
          ref={errorBannerRef}
          role="alert"
          className="mb-4 bg-red-50 border-2 border-red-600 rounded-2xl p-3.5 flex items-start gap-3 text-red-900 shadow-xs"
        >
          <AlertCircle size={20} className="text-red-800 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm font-bold leading-snug">{errorMsg}</div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Honeypot anti-bot field hidden from assistive tech and keyboard */}
        <div className="sr-only" aria-hidden="true">
          <label htmlFor="field-website-hp">Jangan diisi</label>
          <input
            id="field-website-hp"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <section className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
            <Building2 size={18} className="text-teal-800 shrink-0" aria-hidden="true" />
            <h2 className="text-base font-black text-slate-900">1. Identitas Pengisi</h2>
          </div>

          <div>
            <label htmlFor="field-nama" className="block text-sm font-bold text-slate-900 mb-1">
              Nama :
            </label>
            <input
              id="field-nama"
              type="text"
              required
              autoComplete="name"
              placeholder="Masukkan nama lengkap Anda"
              value={nama}
              onChange={(e) => {
                setNama(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className="w-full min-h-12 px-3.5 py-2.5 text-base font-semibold text-slate-900 placeholder:text-slate-500 placeholder:font-normal bg-white border-2 border-slate-500 rounded-xl focus:border-teal-700 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="field-jabatan" className="block text-sm font-bold text-slate-900 mb-1">
              Jabatan :
            </label>
            <input
              id="field-jabatan"
              type="text"
              required
              autoComplete="organization-title"
              placeholder="Contoh: Direktur / Penanggung Jawab"
              value={jabatan}
              onChange={(e) => {
                setJabatan(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className="w-full min-h-12 px-3.5 py-2.5 text-base font-semibold text-slate-900 placeholder:text-slate-500 placeholder:font-normal bg-white border-2 border-slate-500 rounded-xl focus:border-teal-700 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="field-whatsapp" className="block text-sm font-bold text-slate-900 mb-1">
              Nomor WhatsApp :
            </label>
            <input
              id="field-whatsapp"
              type="tel"
              inputMode="tel"
              required
              autoComplete="tel"
              placeholder="Contoh: 0812xxxxxxxx"
              value={nomorWhatsapp}
              onChange={(e) => {
                setNomorWhatsapp(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className="w-full min-h-12 px-3.5 py-2.5 text-base font-semibold text-slate-900 placeholder:text-slate-500 placeholder:font-normal bg-white border-2 border-slate-500 rounded-xl focus:border-teal-700 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="field-perusahaan" className="block text-sm font-bold text-slate-900 mb-1">
              Perusahaan / Fasyankes :
            </label>
            <input
              id="field-perusahaan"
              type="text"
              required
              autoComplete="organization"
              placeholder="Masukkan nama PT, CV, RS, atau Klinik"
              value={perusahaan}
              onChange={(e) => {
                setPerusahaan(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className="w-full min-h-12 px-3.5 py-2.5 text-base font-semibold text-slate-900 placeholder:text-slate-500 placeholder:font-normal bg-white border-2 border-slate-500 rounded-xl focus:border-teal-700 transition-colors"
            />
          </div>
        </section>

        <section className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <FileCheck2 size={18} className="text-teal-800 shrink-0" aria-hidden="true" />
              <h2 className="text-base font-black text-slate-900">2. Perizinan yang Dimiliki</h2>
            </div>
            <span
              aria-live="polite"
              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-700 shrink-0"
            >
              {totalSelectedCount} dipilih
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-700 leading-relaxed">
            Ketuk nama dokumen yang sudah dimiliki, lalu isi 4 digit tahun terbitnya.
          </p>

          <div className="space-y-2.5">
            {DEFAULT_PERMIT_OPTIONS.map((permitName, index) => {
              const isChecked = Object.prototype.hasOwnProperty.call(checkedYears, permitName);
              const checkboxId = `permit-chk-${index}`;
              const yearInputId = `permit-year-${index}`;

              return (
                <div
                  key={permitName}
                  className={`rounded-xl border-2 transition-colors ${
                    isChecked
                      ? 'bg-teal-50/70 border-teal-700'
                      : 'bg-white border-slate-400 hover:border-slate-600'
                  }`}
                >
                  <label
                    htmlFor={checkboxId}
                    className="flex items-center gap-3 px-3.5 py-3 min-h-12 cursor-pointer select-none"
                  >
                    <input
                      id={checkboxId}
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleDefaultPermit(permitName)}
                      className="sr-only peer"
                    />
                    <span
                      aria-hidden="true"
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-teal-700 peer-focus-visible:ring-offset-2 ${
                        isChecked
                          ? 'bg-teal-700 border-teal-800 text-white'
                          : 'bg-white border-slate-500 text-transparent'
                      }`}
                    >
                      <Check size={16} strokeWidth={3} />
                    </span>
                    <span className="text-sm font-bold text-slate-900 flex-1 leading-snug">
                      {permitName}
                    </span>
                  </label>

                  {isChecked ? (
                    <div className="px-3.5 pb-3 pt-1.5 border-t border-teal-200 flex items-center justify-between gap-3">
                      <label htmlFor={yearInputId} className="text-xs font-bold text-slate-800">
                        Tahun Terbit<span className="sr-only"> {permitName}</span> :
                      </label>
                      <input
                        ref={(el) => {
                          yearInputRefs.current[permitName] = el;
                        }}
                        id={yearInputId}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{4}"
                        maxLength={4}
                        placeholder={`Contoh: ${currentYear - 1}`}
                        value={checkedYears[permitName] || ''}
                        onChange={(e) => handleDefaultYearChange(permitName, e.target.value)}
                        className="w-32 min-h-11 px-3 py-2 text-base font-bold text-slate-900 text-center placeholder:text-slate-500 placeholder:font-normal placeholder:text-xs bg-white border-2 border-slate-500 rounded-xl focus:border-teal-700"
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-12 px-5 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-black text-base flex items-center justify-center gap-2.5 shadow-md transition-colors"
        >
          {submitting ? (
            <>
              <Loader2 size={20} className="animate-spin" aria-hidden="true" />
              <span>Menyimpan Data Perizinan...</span>
            </>
          ) : (
            <>
              <Send size={18} aria-hidden="true" />
              <span>Kirim Data Perizinan</span>
            </>
          )}
        </button>
      </form>

      <footer className="mt-6 text-center text-xs font-semibold text-slate-600 px-2">
        Formulir Pendataan Mandiri BIDI DLH Kabupaten Sragen
      </footer>
    </div>
  );
}
