'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShieldCheck, ArrowRight, Building2, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';

export default function LacakArusPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = keyword.trim();
    if (!q) return;

    setLoading(true);
    setErrorMsg('');

    try {
      // Cari dokumen via API
      const res = await fetch(`/api/perizinan?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      const list = json.data || [];

      if (list.length === 0) {
        setErrorMsg('Nomor registrasi atau nama kegiatan tidak ditemukan.');
      } else if (list.length === 1) {
        // Langsung redirect jika hanya 1 cocok
        router.push(`/perizinan/arus/${list[0].id}`);
      } else {
        // Jika ada yang sama persis nomor checklist/registrasi
        const exact = list.find((d: any) => 
          (d.nomor_checklist || '').toLowerCase() === q.toLowerCase() ||
          (d.nomor_registrasi_amdalnet || '').toLowerCase() === q.toLowerCase() ||
          String(d.id) === q
        );
        if (exact) {
          router.push(`/perizinan/arus/${exact.id}`);
        } else {
          router.push(`/perizinan/arus/${list[0].id}`);
        }
      }
    } catch (err: any) {
      setErrorMsg('Gagal melakukan pencarian: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-7 sm:p-9 max-w-lg w-full shadow-lg space-y-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-50 rounded-full border border-emerald-100 opacity-60"></div>

        <div className="text-center space-y-2 relative z-10">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
            <ShieldCheck size={28} />
          </div>
          <span className="text-[10px] font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-widest inline-block">
            Layanan Publik Resmi
          </span>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Lacak Arus Perizinan
          </h1>
          <p className="text-xs font-bold text-slate-600 leading-relaxed">
            Pindai QR Code pada Tanda Terima Registrasi atau masukkan nomor registrasi berkas Anda di bawah ini.
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4 relative z-10">
          <div>
            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider block mb-1.5">
              Nomor Registrasi / Checklist / Nama Kegiatan:
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="Contoh: 600.4.5/012... atau Nama PT"
                required
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-11 pr-4 py-3 text-xs md:text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all uppercase"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search size={16} />
            <span>{loading ? 'Mencari Berkas...' : 'Lacak Progres Dokumen'}</span>
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center relative z-10 space-y-1">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Dinas Lingkungan Hidup Kabupaten Sragen
          </p>
          <a
            href="https://wa.me/6282257740385?text=Halo%20Admin%20DLH%20Sragen,%20saya%20ingin%20konsultasi%20perizinan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[11px] font-black text-emerald-600 hover:text-emerald-700"
          >
            Hotline WhatsApp: +62 822-5774-0385
          </a>
        </div>
      </div>
    </div>
  );
}
