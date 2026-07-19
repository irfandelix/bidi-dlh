'use client';

import Link from 'next/link';
import { ArrowLeft, Inbox, Send, FileText, ArrowRight } from 'lucide-react';

export default function ArsipHubPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 space-y-12 pb-20 mt-4 px-4">
      
      {/* Header Neobrutalism */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white border-4 border-slate-900 p-8 rounded-[2rem] shadow-[8px_8px_0_0_#0f172a] relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-400 rounded-full border-4 border-slate-900 opacity-20"></div>
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-fuchsia-400 rounded-full border-4 border-slate-900 opacity-20"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <Link href="/" className="w-14 h-14 rounded-2xl bg-white text-slate-900 border-4 border-slate-900 flex items-center justify-center hover:bg-slate-200 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#0f172a] transition-all shrink-0">
            <ArrowLeft size={28} />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-100 border-2 border-slate-900 text-slate-900 text-xs font-black uppercase tracking-widest rounded-lg mb-4 shadow-[2px_2px_0_0_#0f172a]">
              E-Office Terpusat
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 mb-2 drop-shadow-sm uppercase">
              Pusat Persuratan
            </h1>
            <p className="text-slate-600 text-sm font-bold tracking-wide max-w-lg mt-2 uppercase">
              Pilih modul persuratan yang ingin Anda kelola.
            </p>
          </div>
        </div>
      </div>

      {/* Main Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        
        {/* Modul Surat Masuk */}
        <Link href="/arsip/masuk" className="group flex flex-col bg-white border-4 border-slate-900 p-8 rounded-[2rem] shadow-[8px_8px_0_0_#0f172a] hover:-translate-y-2 hover:shadow-[12px_12px_0_0_#0f172a] transition-all relative overflow-hidden h-full">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-200 rounded-full border-4 border-slate-900 group-hover:scale-150 transition-transform duration-500"></div>
          
          <div className="w-16 h-16 rounded-2xl bg-blue-400 border-4 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a] mb-6 relative z-10 group-hover:-rotate-12 transition-transform">
            <Inbox size={32} className="text-slate-900" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest mb-3 relative z-10">Buku Agenda<br/>Surat Masuk</h2>
          <p className="text-slate-600 text-sm font-bold flex-1 relative z-10 uppercase">
            Pencatatan dan pengarsipan surat/dokumen yang diterima dari instansi luar.
          </p>

          <div className="mt-8 flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest relative z-10 group-hover:text-blue-600">
            Buka Modul <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
          </div>
        </Link>

        {/* Modul Surat Keluar */}
        <Link href="/arsip/keluar" className="group flex flex-col bg-white border-4 border-slate-900 p-8 rounded-[2rem] shadow-[8px_8px_0_0_#0f172a] hover:-translate-y-2 hover:shadow-[12px_12px_0_0_#0f172a] transition-all relative overflow-hidden h-full">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-200 rounded-full border-4 border-slate-900 group-hover:scale-150 transition-transform duration-500"></div>
          
          <div className="w-16 h-16 rounded-2xl bg-emerald-400 border-4 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a] mb-6 relative z-10 group-hover:-rotate-12 transition-transform">
            <Send size={32} className="text-slate-900" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest mb-3 relative z-10">Buku Agenda<br/>Surat Keluar</h2>
          <p className="text-slate-600 text-sm font-bold flex-1 relative z-10 uppercase">
            Pencatatan surat yang diterbitkan dan dikirimkan ke pihak eksternal.
          </p>

          <div className="mt-8 flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest relative z-10 group-hover:text-emerald-600">
            Buka Modul <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
          </div>
        </Link>

        {/* Modul Nota Dinas */}
        <Link href="/arsip/nota-dinas" className="group flex flex-col bg-white border-4 border-slate-900 p-8 rounded-[2rem] shadow-[8px_8px_0_0_#0f172a] hover:-translate-y-2 hover:shadow-[12px_12px_0_0_#0f172a] transition-all relative overflow-hidden h-full">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-200 rounded-full border-4 border-slate-900 group-hover:scale-150 transition-transform duration-500"></div>
          
          <div className="w-16 h-16 rounded-2xl bg-amber-400 border-4 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a] mb-6 relative z-10 group-hover:-rotate-12 transition-transform">
            <FileText size={32} className="text-slate-900" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest mb-3 relative z-10">Buku Register<br/>Nota Dinas</h2>
          <p className="text-slate-600 text-sm font-bold flex-1 relative z-10 uppercase">
            Pusat pembuatan dan penomoran memo / surat internal otomatis.
          </p>

          <div className="mt-8 flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest relative z-10 group-hover:text-amber-600">
            Buka Modul <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
          </div>
        </Link>

      </div>

    </div>
  );
}
