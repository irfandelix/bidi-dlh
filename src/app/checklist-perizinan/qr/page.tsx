'use client';

import React, { useEffect, useState } from 'react';
import {
  Download,
  Printer,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { CHECKLIST_PUBLIC_URL, DEFAULT_PERMIT_OPTIONS } from '@/lib/checklist-perizinan';
import { generateChecklistQrWithLogo, downloadQrPng } from '@/lib/checklist-qr-client';

export default function ChecklistQrPosterPage() {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const buildQr = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const url = await generateChecklistQrWithLogo(CHECKLIST_PUBLIC_URL, 1000);
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

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(CHECKLIST_PUBLIC_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore if browser blocks fullscreen in embedded frame
    }
  };

  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-8 print:p-0 print:bg-white">
      <section className="w-full max-w-md sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl bg-white border-2 border-slate-300 rounded-3xl p-6 sm:p-8 lg:p-10 xl:p-12 shadow-lg print:shadow-none print:border-slate-400 print:max-w-xl lg:grid lg:grid-cols-[1.08fr_auto] lg:items-center lg:gap-10 xl:gap-14 space-y-6 lg:space-y-0">
        {/* Left column on PC: Header, guidance, 8 permits, and action controls */}
        <div className="space-y-5 lg:space-y-6 text-center lg:text-left print:text-center">
          <header className="space-y-3 border-b border-slate-200 pb-5">
            <div className="flex items-center justify-center lg:justify-start print:justify-center gap-3.5 lg:gap-4">
              <img
                src="/BIDIDLH.png"
                alt="Logo BIDI DLH Kabupaten Sragen"
                width={64}
                height={64}
                fetchPriority="high"
                className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl border border-slate-200 object-contain bg-white p-1 shrink-0 shadow-xs"
              />
              <div className="text-left">
                <p className="text-xs sm:text-sm lg:text-base font-bold text-teal-800">
                  Dinas Lingkungan Hidup Kabupaten Sragen
                </p>
                <h1 className="text-xl sm:text-2xl lg:text-4xl xl:text-[42px] font-black text-slate-900 leading-tight tracking-tight">
                  Scan Checklist Perizinan
                </h1>
              </div>
            </div>
            <p className="text-sm sm:text-base lg:text-lg font-semibold text-slate-700 leading-relaxed pt-1">
              Arahkan kamera HP Anda ke kode QR untuk mengisi daftar kepemilikan dokumen perizinan perusahaan atau fasyankes secara mandiri.
            </p>
          </header>

          <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 sm:p-5 text-left space-y-2.5">
            <h2 className="text-xs sm:text-sm font-black text-slate-900">
              Dokumen yang Didata pada Formulir:
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1.5 text-xs sm:text-sm font-semibold text-slate-800">
              {DEFAULT_PERMIT_OPTIONS.map((item) => (
                <li key={item} className="flex items-start gap-2 leading-snug">
                  <span className="text-teal-800 font-black" aria-hidden="true">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2.5 pt-1 print:hidden">
            <button
              type="button"
              disabled={!qrDataUrl}
              onClick={() => downloadQrPng(qrDataUrl)}
              className="min-h-11 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
            >
              <Download size={17} aria-hidden="true" />
              <span>Unduh PNG</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-11 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
            >
              <Printer size={17} aria-hidden="true" />
              <span>Cetak QR</span>
            </button>

            <button
              type="button"
              onClick={handleCopyUrl}
              className="min-h-11 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-400 text-slate-900 text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
            >
              {copied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
              <span>{copied ? 'Disalin' : 'Salin Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="hidden lg:flex min-h-11 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border-2 border-slate-400 text-slate-900 text-sm font-bold items-center justify-center gap-2 whitespace-nowrap transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 size={17} aria-hidden="true" />
              ) : (
                <Maximize2 size={17} aria-hidden="true" />
              )}
              <span>{isFullscreen ? 'Keluar Penuh' : 'Layar Penuh'}</span>
            </button>
          </div>
        </div>

        {/* Right column on PC: Prominent oversized QR code for effortless room/desk scanning */}
        <div className="order-first lg:order-last flex flex-col items-center justify-center shrink-0">
          {loading ? (
            <div className="w-60 h-60 sm:w-80 sm:h-80 lg:w-[400px] lg:h-[400px] xl:w-[440px] xl:h-[440px] rounded-3xl border-2 border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-700">
              <Loader2 size={34} className="animate-spin text-teal-700" aria-hidden="true" />
              <span className="text-sm font-bold">Menyiapkan kode QR...</span>
            </div>
          ) : errorMsg ? (
            <div
              role="alert"
              className="w-full max-w-sm p-5 rounded-2xl border-2 border-red-600 bg-red-50 text-red-900 space-y-3 text-center"
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
            <div className="p-3 sm:p-4 lg:p-5 rounded-3xl border-3 border-teal-700 bg-white shadow-sm inline-block">
              <img
                src={qrDataUrl}
                alt="Kode QR formulir Checklist Kepemilikan Perizinan dengan logo BIDI DLH di tengah"
                width={440}
                height={440}
                className="w-56 h-56 sm:w-80 sm:h-80 lg:w-[390px] lg:h-[390px] xl:w-[440px] xl:h-[440px] print:w-80 print:h-80 aspect-square object-contain block"
              />
            </div>
          )}

          <p className="mt-3.5 text-xs sm:text-sm lg:text-base font-black text-slate-900 bg-slate-100 border border-slate-300 rounded-xl px-4 py-2 break-all text-center">
            bididlh.vercel.app/checklist-perizinan
          </p>
        </div>
      </section>
    </div>
  );
}
