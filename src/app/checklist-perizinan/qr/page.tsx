'use client';

import React, { useEffect, useState } from 'react';
import { Download, Printer, Copy, Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { CHECKLIST_PUBLIC_URL, DEFAULT_PERMIT_OPTIONS } from '@/lib/checklist-perizinan';
import { generateChecklistQrWithLogo, downloadQrPng } from '@/lib/checklist-qr-client';

export default function ChecklistQrPosterPage() {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const buildQr = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const url = await generateChecklistQrWithLogo(CHECKLIST_PUBLIC_URL, 680);
      setQrDataUrl(url);
    } catch {
      setErrorMsg('Gagal membuat gambar kode QR. Silakan muat ulang.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buildQr();
  }, []);

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(CHECKLIST_PUBLIC_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-center px-4 py-6 sm:py-10 print:p-0 print:bg-white">
      <section className="w-full max-w-lg bg-white border-2 border-slate-300 rounded-3xl p-6 sm:p-8 shadow-md print:shadow-none print:border-slate-400 space-y-6 text-center">
        <header className="space-y-2 border-b border-slate-200 pb-5">
          <div className="flex items-center justify-center gap-3">
            <img
              src="/BIDIDLH.png"
              alt="Logo BIDI DLH Kabupaten Sragen"
              width={48}
              height={48}
              fetchPriority="high"
              className="w-12 h-12 rounded-xl border border-slate-200 object-contain bg-white p-0.5 shrink-0"
            />
            <div className="text-left">
              <p className="text-xs font-bold text-teal-800">
                Dinas Lingkungan Hidup Kabupaten Sragen
              </p>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                Scan Checklist Perizinan
              </h1>
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-700 leading-relaxed pt-1">
            Arahkan kamera HP Anda ke kode QR di bawah ini untuk mengisi daftar kepemilikan dokumen perizinan perusahaan atau fasyankes.
          </p>
        </header>

        <div className="flex flex-col items-center justify-center">
          {loading ? (
            <div className="w-72 h-72 rounded-2xl border-2 border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-700">
              <Loader2 size={30} className="animate-spin text-teal-700" aria-hidden="true" />
              <span className="text-sm font-bold">Menyiapkan kode QR...</span>
            </div>
          ) : errorMsg ? (
            <div
              role="alert"
              className="w-full p-5 rounded-2xl border-2 border-red-600 bg-red-50 text-red-900 space-y-3"
            >
              <div className="flex items-center justify-center gap-2 text-sm font-bold">
                <AlertCircle size={18} aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={buildQr}
                className="min-h-11 px-4 py-2 rounded-xl bg-white border-2 border-red-700 text-red-900 text-xs font-black inline-flex items-center gap-2 hover:bg-red-100"
              >
                <RefreshCw size={15} aria-hidden="true" />
                <span>Coba Lagi</span>
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl border-2 border-teal-700 bg-white shadow-xs inline-block">
              <img
                src={qrDataUrl}
                alt="Kode QR formulir Checklist Kepemilikan Perizinan dengan logo BIDI DLH di tengah"
                width={280}
                height={280}
                className="w-64 h-64 sm:w-72 sm:h-72 object-contain block"
              />
            </div>
          )}

          <p className="mt-3 text-xs sm:text-sm font-black text-slate-900 bg-slate-100 border border-slate-300 rounded-xl px-3.5 py-2 break-all">
            bididlh.vercel.app/checklist-perizinan
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 text-left space-y-2">
          <h2 className="text-xs font-black text-slate-900">
            Dokumen yang Didata pada Formulir:
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs font-semibold text-slate-700">
            {DEFAULT_PERMIT_OPTIONS.map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <span className="text-teal-800 font-black" aria-hidden="true">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 print:hidden">
          <button
            type="button"
            disabled={!qrDataUrl}
            onClick={() => downloadQrPng(qrDataUrl)}
            className="min-h-11 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Download size={17} aria-hidden="true" />
            <span>Unduh PNG</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-11 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Printer size={17} aria-hidden="true" />
            <span>Cetak QR</span>
          </button>

          <button
            type="button"
            onClick={handleCopyUrl}
            className="min-h-11 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-400 text-slate-900 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
            <span>{copied ? 'Disalin' : 'Salin Link'}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
