'use client';

import Link from 'next/link';
import { Archive, LayoutDashboard, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function ArsipHub() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-slate-700 hover:text-slate-900 bg-white px-4 py-2 rounded-xl border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] hover:translate-y-[2px] transition-all mb-4">
              <ArrowLeft size={20} /> Kembali ke Beranda
            </Link>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <Archive size={32} className="text-slate-900" />
              Pusat Arsip Dokumen
            </h1>
            <p className="text-slate-600 font-bold mt-2">Pilih kategori arsip yang ingin Anda lihat.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Arsip Perizinan */}
          <Link href="/perizinan/daftar" className="group bg-white border-4 border-slate-900 rounded-3xl p-8 shadow-[8px_8px_0_0_#0f172a] hover:shadow-[4px_4px_0_0_#0f172a] hover:translate-y-2 transition-all flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-blue-100 border-4 border-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-[4px_4px_0_0_#0f172a]">
              <LayoutDashboard size={40} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wide mb-2">Arsip Perizinan</h2>
            <p className="text-sm font-bold text-slate-600">Dokumen lingkungan (SPPL, UKL-UPL, AMDAL) yang sudah selesai diproses dan diarsipkan.</p>
          </Link>

          {/* Arsip Pengawasan */}
          <Link href="/pengawasan/arsip" className="group bg-white border-4 border-slate-900 rounded-3xl p-8 shadow-[8px_8px_0_0_#0f172a] hover:shadow-[4px_4px_0_0_#0f172a] hover:translate-y-2 transition-all flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-emerald-100 border-4 border-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-[4px_4px_0_0_#0f172a]">
              <ShieldCheck size={40} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wide mb-2">Arsip Pengawasan</h2>
            <p className="text-sm font-bold text-slate-600">Berita Acara Pengawasan (BAP) lapangan yang telah ditandatangani dan selesai direkap.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
