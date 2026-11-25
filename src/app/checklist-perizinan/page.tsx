'use client';

import React, { useState, useRef } from 'react';
import {
  Check,
  Plus,
  Trash2,
  Send,
  AlertCircle,
  CheckCircle2,
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

interface ManualPermitRow {
  uid: string;
  nama_izin: string;
  tahun: string;
}

export default function ChecklistPerizinanMandiriPage() {
  const currentYear = new Date().getFullYear();

  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [nomorWhatsapp, setNomorWhatsapp] = useState('');
  const [perusahaan, setPerusahaan] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [checkedYears, setCheckedYears] = useState<Record<string, string>>({});
  const [manualRows, setManualRows] = useState<ManualPermitRow[]>([]);
  const [belumAdaIzin, setBelumAdaIzin] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedResult, setSubmittedResult] = useState<ValidatedChecklistSubmission | null>(null);

  const errorBannerRef = useRef<HTMLDivElement>(null);
  const yearInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const manualNameRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const toggleDefaultPermit = (permitName: string) => {
    setErrorMsg('');
    setCheckedYears((prev) => {
      const next = { ...prev };
      if (Object.prototype.hasOwnProperty.call(next, permitName)) {
        delete next[permitName];
      } else {
        next[permitName] = '';
        setBelumAdaIzin(false);
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

  const handleAddManualRow = () => {
    setErrorMsg('');
    setBelumAdaIzin(false);
    const uid = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setManualRows((prev) => [...prev, { uid, nama_izin: '', tahun: '' }]);
    setTimeout(() => {
      const input = manualNameRefs.current[uid];
      input?.focus();
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 40);
  };

  const handleManualChange = (uid: string, field: 'nama_izin' | 'tahun', val: string) => {
    setErrorMsg('');
    setManualRows((prev) =>
      prev.map((row) => {
        if (row.uid !== uid) return row;
        if (field === 'tahun') {
          return { ...row, tahun: val.replace(/\D/g, '').slice(0, 4) };
        }
        return { ...row, nama_izin: val };
      })
    );
  };

  const handleRemoveManualRow = (uid: string) => {
    setErrorMsg('');
    setManualRows((prev) => prev.filter((row) => row.uid !== uid));
  };

  const handleToggleBelumAdaIzin = (checked: boolean) => {
    setErrorMsg('');
    setBelumAdaIzin(checked);
    if (checked) {
      setCheckedYears({});
      setManualRows([]);
    }
  };

  const handleResetForm = () => {
    setNama('');
    setJabatan('');
    setNomorWhatsapp('');
    setPerusahaan('');
    setHoneypot('');
    setCheckedYears({});
    setManualRows([]);
    setBelumAdaIzin(false);
    setErrorMsg('');
    setSubmittedResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeDefaultCount = Object.keys(checkedYears).length;
  const activeManualCount = manualRows.filter((r) => r.nama_izin.trim() !== '' || r.tahun.trim() !== '').length;
  const totalSelectedCount = activeDefaultCount + activeManualCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const combinedPermits = [
      ...DEFAULT_PERMIT_OPTIONS.filter((p) => Object.prototype.hasOwnProperty.call(checkedYears, p)).map((p) => ({
        nama_izin: p,
        tahun: checkedYears[p],
        is_manual: false,
      })),
      ...manualRows.map((r) => ({
        nama_izin: r.nama_izin,
        tahun: r.tahun,
        is_manual: true,
      })),
    ];

    const payload = {
      nama,
      jabatan,
      nomor_whatsapp: nomorWhatsapp,
      perusahaan_fasyankes: perusahaan,
      daftar_perizinan: combinedPermits,
      belum_ada_izin: belumAdaIzin,
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
        <section className="bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-md space-y-5">
          <div className="flex items-start gap-3.5 border-b border-slate-200 pb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-600 flex items-center justify-center shrink-0 text-emerald-800">
              <CheckCircle2 size={26} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-snug">
                Data Perizinan Berhasil Tersimpan
              </h1>
              <p className="text-sm text-slate-700 mt-1 leading-relaxed">
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
            {submittedResult.belum_ada_izin ? (
              <p className="text-sm font-semibold text-slate-700 bg-amber-50 border border-amber-500 rounded-xl px-3.5 py-2.5">
                Tercatat belum memiliki dokumen perizinan.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 border border-slate-300 rounded-xl bg-white overflow-hidden">
                {submittedResult.daftar_perizinan.map((item) => (
                  <li
                    key={`${item.nama_izin}-${item.tahun}`}
                    className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="font-bold text-slate-900">
                      {item.nama_izin}
                      {item.is_manual ? (
                        <span className="ml-2 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-600 rounded-md px-1.5 py-0.5">
                          Manual
                        </span>
                      ) : null}
                    </span>
                    <span className="font-black text-emerald-800 bg-emerald-50 border border-emerald-600 rounded-lg px-2.5 py-0.5 shrink-0">
                      Tahun {item.tahun}
                    </span>
                  </li>
                ))}
              </ul>
            )}
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
              {belumAdaIzin ? 'Belum ada izin' : `${totalSelectedCount} dipilih`}
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

        <section className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm space-y-3.5">
          <div className="border-b border-slate-200 pb-2.5">
            <h2 className="text-base font-black text-slate-900">
              3. Tambah Perizinan Lain (Manual)
            </h2>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              Punya izin lain yang belum ada di daftar di atas? Tekan tombol tambah di bawah ini.
            </p>
          </div>

          {manualRows.length > 0 ? (
            <div className="space-y-3">
              {manualRows.map((row, idx) => {
                const nameId = `${row.uid}-name`;
                const yearId = `${row.uid}-year`;
                return (
                  <div
                    key={row.uid}
                    className="p-3 rounded-xl bg-slate-50 border-2 border-slate-400 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-teal-800">
                        Izin Tambahan #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveManualRow(row.uid)}
                        aria-label={`Hapus izin tambahan nomor ${idx + 1}`}
                        className="w-11 h-11 rounded-xl bg-white hover:bg-red-50 active:bg-red-100 border-2 border-slate-400 hover:border-red-600 text-red-800 flex items-center justify-center transition-colors shrink-0"
                      >
                        <Trash2 size={18} aria-hidden="true" />
                      </button>
                    </div>

                    <div>
                      <label htmlFor={nameId} className="block text-xs font-bold text-slate-800 mb-1">
                        Nama Perizinan :
                      </label>
                      <input
                        ref={(el) => {
                          manualNameRefs.current[row.uid] = el;
                        }}
                        id={nameId}
                        type="text"
                        placeholder="Ketik nama dokumen izin"
                        value={row.nama_izin}
                        onChange={(e) => handleManualChange(row.uid, 'nama_izin', e.target.value)}
                        className="w-full min-h-11 px-3 py-2 text-base font-semibold text-slate-900 placeholder:text-slate-500 placeholder:font-normal bg-white border-2 border-slate-500 rounded-xl focus:border-teal-700"
                      />
                    </div>

                    <div>
                      <label htmlFor={yearId} className="block text-xs font-bold text-slate-800 mb-1">
                        Tahun Terbit :
                      </label>
                      <input
                        id={yearId}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{4}"
                        maxLength={4}
                        placeholder={`Contoh: ${currentYear - 2}`}
                        value={row.tahun}
                        onChange={(e) => handleManualChange(row.uid, 'tahun', e.target.value)}
                        className="w-full min-h-11 px-3 py-2 text-base font-semibold text-slate-900 placeholder:text-slate-500 placeholder:font-normal bg-white border-2 border-slate-500 rounded-xl focus:border-teal-700"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleAddManualRow}
            className="w-full min-h-12 px-4 py-3 rounded-xl border-2 border-dashed border-teal-700 bg-teal-50/60 hover:bg-teal-100 active:bg-teal-200/70 text-teal-900 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
            <span>Tambah Perizinan Manual</span>
          </button>

          <div className="pt-2 border-t border-slate-200">
            <label
              htmlFor="chk-belum-ada-izin"
              className="flex items-center gap-3 px-3 py-2.5 min-h-11 rounded-xl border-2 border-slate-300 hover:border-slate-500 bg-slate-50 cursor-pointer select-none"
            >
              <input
                id="chk-belum-ada-izin"
                type="checkbox"
                checked={belumAdaIzin}
                onChange={(e) => handleToggleBelumAdaIzin(e.target.checked)}
                className="sr-only peer"
              />
              <span
                aria-hidden="true"
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-teal-700 peer-focus-visible:ring-offset-2 ${
                  belumAdaIzin
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-500 text-transparent'
                }`}
              >
                <Check size={16} strokeWidth={3} />
              </span>
              <span className="text-xs font-bold text-slate-800 leading-snug">
                Belum memiliki dokumen perizinan sama sekali
              </span>
            </label>
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
