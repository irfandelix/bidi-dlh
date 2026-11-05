'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Inbox, 
  Send, 
  FileText, 
  ArrowRight, 
  Sparkles,
  Download,
  Upload,
  Plus
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ArsipPersuratanPage() {
  const supabase = createClient();
  const [counts, setCounts] = useState({
    suratMasuk: 0,
    suratKeluar: 0,
    notaDinas: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [
          { count: masukCount },
          { count: keluarCount },
          { count: notaCount }
        ] = await Promise.all([
          supabase.from('arsip_masuk').select('*', { count: 'exact', head: true }),
          supabase.from('arsip_keluar').select('*', { count: 'exact', head: true }),
          supabase.from('arsip_nota_dinas').select('*', { count: 'exact', head: true })
        ]);

        setCounts({
          suratMasuk: masukCount || 0,
          suratKeluar: keluarCount || 0,
          notaDinas: notaCount || 0
        });
      } catch (err) {
        console.error('Gagal memuat statistik persuratan:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8 pb-24 px-4">
      
      {/* Tombol Kembali ke Pusat Arsip */}
      <Link 
        href="/arsip" 
        className="inline-flex items-center gap-2 text-sm text-slate-800 font-bold transition-all bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 uppercase tracking-wide"
      >
        <ArrowLeft size={16} /> Kembali ke Pusat Arsip
      </Link>

      {/* Header Halaman (NeoBrutalism Konsisten) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-md">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-500 border border-slate-200 flex items-center justify-center text-white shadow-sm shrink-0">
            <Inbox size={32} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 border border-blue-300 text-blue-900 text-[10px] font-black uppercase tracking-widest rounded-lg mb-2">
              <Sparkles size={12} />
              <span>Manajemen Persuratan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 uppercase">
              Arsip Persuratan
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm font-bold mt-1 uppercase">
              Pusat Pengelolaan Buku Agenda Surat Masuk, Surat Keluar, dan Register Nota Dinas Internal DLH
            </p>
          </div>
        </div>
      </div>

      {/* Main Menu Grid: 3 Kolom Simetris */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Buku Agenda Surat Masuk */}
        <Link 
          href="/arsip/masuk" 
          className="group flex flex-col bg-white border border-slate-200 hover:border-blue-500 p-7 rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Inbox size={28} />
            </div>
            <span className="text-xs font-black font-mono px-3 py-1 bg-blue-50 text-blue-800 rounded-full border border-blue-200">
              {loading ? '...' : `${counts.suratMasuk} Surat`}
            </span>
          </div>

          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
            Surat Masuk
          </h2>
          <p className="text-slate-600 text-xs font-bold leading-relaxed flex-1 uppercase">
            Buku agenda pencatatan, pengklasifikasian, dan pengarsipan berkas surat yang diterima dari pihak eksternal.
          </p>

          <div className="flex flex-wrap gap-1.5 my-5">
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Buku Agenda</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Kode Klasifikasi</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Import / Export</span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-black text-blue-600 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
            <span>Buka Surat Masuk</span>
            <ArrowRight size={16} />
          </div>
        </Link>

        {/* 2. Buku Agenda Surat Keluar */}
        <Link 
          href="/arsip/keluar" 
          className="group flex flex-col bg-white border border-slate-200 hover:border-emerald-500 p-7 rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Send size={28} />
            </div>
            <span className="text-xs font-black font-mono px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
              {loading ? '...' : `${counts.suratKeluar} Surat`}
            </span>
          </div>

          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
            Surat Keluar
          </h2>
          <p className="text-slate-600 text-xs font-bold leading-relaxed flex-1 uppercase">
            Buku agenda pencatatan surat resmi yang diterbitkan dan dikirimkan oleh dinas kepada instansi luar.
          </p>

          <div className="flex flex-wrap gap-1.5 my-5">
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Surat Eksternal</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Tujuan Surat</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Export Excel</span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-black text-emerald-600 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
            <span>Buka Surat Keluar</span>
            <ArrowRight size={16} />
          </div>
        </Link>

        {/* 3. Buku Register Nota Dinas */}
        <Link 
          href="/arsip/nota-dinas" 
          className="group flex flex-col bg-white border border-slate-200 hover:border-amber-500 p-7 rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <FileText size={28} />
            </div>
            <span className="text-xs font-black font-mono px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
              {loading ? '...' : `${counts.notaDinas} Nota`}
            </span>
          </div>

          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
            Register Nota Dinas
          </h2>
          <p className="text-slate-600 text-xs font-bold leading-relaxed flex-1 uppercase">
            Pusat pembuatan memo internal dan penomoran otomatis nota dinas per seksi / bagian di lingkungan DLH.
          </p>

          <div className="flex flex-wrap gap-1.5 my-5">
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Nomor Otomatis</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Filter Bagian</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Import / Export</span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-black text-amber-600 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
            <span>Buka Nota Dinas</span>
            <ArrowRight size={16} />
          </div>
        </Link>

      </div>

    </div>
  );
}
