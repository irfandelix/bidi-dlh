'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Inbox, 
  Send, 
  FileText, 
  ArrowRight, 
  Calendar, 
  Archive, 
  Layers, 
  FolderOpen,
  Sparkles,
  ExternalLink,
  Clock
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ArsipHubPage() {
  const supabase = createClient();
  const [counts, setCounts] = useState({
    suratMasuk: 0,
    suratKeluar: 0,
    notaDinas: 0,
    arsipBidang: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [
          { count: masukCount },
          { count: keluarCount },
          { count: notaCount },
          { count: bidangCount }
        ] = await Promise.all([
          supabase.from('arsip_masuk').select('*', { count: 'exact', head: true }),
          supabase.from('arsip_keluar').select('*', { count: 'exact', head: true }),
          supabase.from('arsip_nota_dinas').select('*', { count: 'exact', head: true }),
          supabase.from('arsip_bidang').select('*', { count: 'exact', head: true })
        ]);

        setCounts({
          suratMasuk: masukCount || 0,
          suratKeluar: keluarCount || 0,
          notaDinas: notaCount || 0,
          arsipBidang: bidangCount || 0
        });
      } catch (err) {
        console.error('Gagal memuat statistik arsip:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8 pb-24 px-4">
      
      {/* Tombol Kembali ke Beranda */}
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-sm text-slate-800 font-bold transition-all bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 uppercase tracking-wide"
      >
        <ArrowLeft size={16} /> Kembali ke Beranda
      </Link>

      {/* Header Halaman (NeoBrutalism Konsisten) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-md">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-400 border border-slate-200 flex items-center justify-center text-slate-900 shadow-sm shrink-0">
            <Archive size={32} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-black uppercase tracking-widest rounded-lg mb-2">
              <Sparkles size={12} />
              <span>E-Office Terpusat</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 uppercase">
              Pusat Arsip DLH
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm font-bold mt-1 uppercase">
              Sistem Manajemen Persuratan Resmi, Agenda Nota Dinas, dan Dokumentasi Bidang Tata Lingkungan
            </p>
          </div>
        </div>
      </div>

      {/* Kartu Ringkasan Metrik Statistik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Surat Masuk */}
        <Link 
          href="/arsip/masuk" 
          className="bg-white p-5 rounded-2xl border-2 border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Surat Masuk</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Inbox size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
            {loading ? '-' : counts.suratMasuk}
          </p>
          <p className="text-[11px] font-bold text-slate-500 mt-1">Buku Agenda Masuk</p>
        </Link>

        {/* Surat Keluar */}
        <Link 
          href="/arsip/keluar" 
          className="bg-white p-5 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Surat Keluar</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Send size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
            {loading ? '-' : counts.suratKeluar}
          </p>
          <p className="text-[11px] font-bold text-slate-500 mt-1">Buku Agenda Keluar</p>
        </Link>

        {/* Nota Dinas */}
        <Link 
          href="/arsip/nota-dinas" 
          className="bg-white p-5 rounded-2xl border-2 border-slate-200 hover:border-amber-500 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Nota Dinas</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
            {loading ? '-' : counts.notaDinas}
          </p>
          <p className="text-[11px] font-bold text-slate-500 mt-1">Register Otomatis</p>
        </Link>

        {/* Arsip Bidang */}
        <Link 
          href="/arsip/bidang" 
          className="bg-white p-5 rounded-2xl border-2 border-slate-200 hover:border-purple-500 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Arsip Bidang</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">
            {loading ? '-' : counts.arsipBidang}
          </p>
          <p className="text-[11px] font-bold text-slate-500 mt-1">Dokumentasi Kegiatan</p>
        </Link>
      </div>

      {/* Main Menu Grid (3 Kolom Simetris) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Modul 1: Arsip Persuratan */}
        <Link 
          href="/arsip/persuratan" 
          className="group flex flex-col bg-white border border-slate-200 hover:border-blue-500 p-7 rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Inbox size={28} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-blue-50 text-blue-800 rounded-full border border-blue-200">
              Persuratan Resmi
            </span>
          </div>

          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
            Arsip Persuratan
          </h2>
          <p className="text-slate-600 text-xs font-bold leading-relaxed flex-1 uppercase">
            Pusat pengelolaan dan penyimpanan Surat Masuk, Surat Keluar, dan penomoran otomatis Nota Dinas internal DLH.
          </p>

          <div className="flex flex-wrap gap-1.5 my-5">
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Surat Masuk</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Surat Keluar</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Nota Dinas</span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-black text-blue-600 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
            <span>Buka Modul Persuratan</span>
            <ArrowRight size={16} />
          </div>
        </Link>

        {/* Modul 2: Jadwal Jaga Petugas MPP */}
        <Link 
          href="/arsip/jadwal-mpp" 
          className="group flex flex-col bg-white border border-slate-200 hover:border-purple-500 p-7 rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Calendar size={28} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-purple-50 text-purple-800 rounded-full border border-purple-200">
              Pelayanan Publik
            </span>
          </div>

          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
            Jadwal Petugas MPP
          </h2>
          <p className="text-slate-600 text-xs font-bold leading-relaxed flex-1 uppercase">
            Penjadwalan giliran petugas piket DLH di Mal Pelayanan Publik (MPP) beserta kalender dan fitur cetak jadwal bulanan.
          </p>

          <div className="flex flex-wrap gap-1.5 my-5">
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Kalender Petugas</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Hari Libur</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Cetak Jadwal</span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-black text-purple-600 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
            <span>Buka Jadwal MPP</span>
            <ArrowRight size={16} />
          </div>
        </Link>

        {/* Modul 3: Arsip Bidang */}
        <Link 
          href="/arsip/bidang" 
          className="group flex flex-col bg-white border border-slate-200 hover:border-emerald-500 p-7 rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Layers size={28} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
              Tata Lingkungan
            </span>
          </div>

          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
            Arsip Bidang
          </h2>
          <p className="text-slate-600 text-xs font-bold leading-relaxed flex-1 uppercase">
            Penyimpanan dan pencatatan dokumentasi seluruh kegiatan rapat, berita acara, notulensi, dan penugasan bidang terpusat.
          </p>

          <div className="flex flex-wrap gap-1.5 my-5">
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Dokumentasi Foto</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Surat Undangan</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">Berkas Kegiatan</span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-black text-emerald-600 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
            <span>Buka Arsip Bidang</span>
            <ArrowRight size={16} />
          </div>
        </Link>

      </div>

    </div>
  );
}
