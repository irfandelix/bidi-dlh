'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, AlertTriangle, Key } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function BuatAgendaPengaduanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessData(null);

    const formData = new FormData(e.currentTarget);
    const perihal = formData.get('perihal') as string;
    const tanggal = formData.get('tanggal') as string;

    try {
      // 1. Generate Token ADN-XXXXXX
      const tokenStr = 'ADN-' + Math.random().toString(36).substring(2, 8).toUpperCase();

      // 2. Submit Data
      const payload = {
        perihal,
        tanggal,
        token: tokenStr,
        status_tahapan: 'Menunggu Isian'
      };

      // Kita bisa buat route POST khusus, atau menggunakan /api/pengaduan yang ada dengan modifikasi
      const res = await fetch('/api/pengaduan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Gagal membuat tiket pengaduan');
      }

      setSuccessData({ ...result.data, token: tokenStr });
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8 pb-20 px-4">
      
      <Link href="/pengaduan" className="inline-flex items-center gap-2 text-sm text-slate-900 font-black transition-all bg-white border-2 border-slate-900 px-4 py-2 rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Daftar
      </Link>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
        <div className="w-14 h-14 rounded-xl bg-purple-400 border-2 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a] shrink-0">
          <AlertTriangle size={28} className="text-slate-900" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Buat Tiket Pengaduan</h2>
          <p className="text-sm font-bold text-slate-600 mt-1 uppercase">Buat tiket dan dapatkan token akses untuk Pelapor</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-200 text-slate-900 p-4 rounded-xl text-sm font-bold border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a]">
          {errorMsg}
        </div>
      )}

      {successData ? (
        <div className="bg-emerald-50 border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] rounded-3xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-400 border-4 border-slate-900 rounded-full flex items-center justify-center mx-auto shadow-[4px_4px_0_0_#0f172a]">
            <Key size={40} className="text-slate-900" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase text-slate-900">Tiket Berhasil Dibuat!</h3>
            <p className="text-sm font-bold text-slate-600 mt-2 uppercase">Bagikan token atau tautan ini kepada pelapor untuk mengisi data.</p>
          </div>

          <div className="bg-white border-4 border-slate-900 p-6 rounded-2xl shadow-[4px_4px_0_0_#0f172a] inline-block mx-auto">
            <span className="text-3xl font-black text-slate-900 tracking-wider">
              {successData.token}
            </span>
          </div>
          
          <div className="mt-4">
             <div className="bg-slate-100 p-3 rounded-lg border-2 border-slate-200 break-all text-xs font-bold text-slate-600">
               {typeof window !== 'undefined' ? `${window.location.origin}/pengaduan/token?token=${successData.token}` : ''}
             </div>
          </div>

          <div className="pt-6 border-t-4 border-slate-900 mt-6 flex justify-center gap-4">
            <button 
              type="button"
              onClick={() => { setSuccessData(null); }}
              className="px-6 py-4 bg-white text-slate-900 font-black rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all uppercase tracking-widest text-sm"
            >
              Buat Tiket Lain
            </button>
            <button 
              type="button"
              onClick={() => router.push('/pengaduan')}
              className="px-8 py-4 bg-slate-900 text-white font-black rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all uppercase tracking-widest text-sm"
            >
              Kembali ke Daftar
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border-4 border-slate-900 rounded-3xl p-8 shadow-[8px_8px_0_0_#0f172a]">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                1. Perihal / Indikasi Kasus <span className="text-rose-500">*</span>
              </label>
              <input type="text" name="perihal" required placeholder="Contoh: Aduan Pencemaran PT Maju Jaya..." 
                className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                2. Tanggal Pembuatan Tiket <span className="text-rose-500">*</span>
              </label>
              <input type="date" name="tanggal" required defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none cursor-pointer" />
            </div>

            <div className="pt-8 border-t-4 border-slate-900 mt-8 flex justify-end">
              <button type="submit" disabled={loading} 
                className="w-full md:w-auto px-10 py-4 bg-purple-400 hover:bg-purple-300 text-slate-900 font-black rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-70 disabled:hover:translate-y-0">
                {loading ? <LottieLoader size={24} /> : <Save size={18} />}
                Generate Token Akses
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
