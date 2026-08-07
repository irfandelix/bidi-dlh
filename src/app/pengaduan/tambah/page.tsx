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
      
      <Link href="/pengaduan" className="inline-flex items-center gap-2 text-sm text-on-surface font-bold transition-all bg-surface border border-outline-variant px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Daftar
      </Link>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
        <div className="w-14 h-14 rounded-xl bg-purple-400 border border-outline-variant flex items-center justify-center shadow-sm hover:shadow-md transition-shadow shrink-0">
          <AlertTriangle size={28} className="text-on-surface" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface uppercase">Buat Tiket Pengaduan</h2>
          <p className="text-sm font-bold text-on-surface-variant mt-1 uppercase">Buat tiket dan dapatkan token akses untuk Pelapor</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-200 text-on-surface p-4 rounded-xl text-sm font-bold border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          {errorMsg}
        </div>
      )}

      {successData ? (
        <div className="bg-secondary-container border border-outline-variant shadow-sm hover:shadow-md transition-shadow rounded-3xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-secondary text-on-secondary border border-outline-variant rounded-full flex items-center justify-center mx-auto shadow-sm hover:shadow-md transition-shadow">
            <Key size={40} className="text-on-surface" />
          </div>
          <div>
            <h3 className="text-xl font-bold uppercase text-on-surface">Tiket Berhasil Dibuat!</h3>
            <p className="text-sm font-bold text-on-surface-variant mt-2 uppercase">Bagikan token atau tautan ini kepada pelapor untuk mengisi data.</p>
          </div>

          <div className="bg-surface border border-outline-variant p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow inline-block mx-auto">
            <span className="text-3xl font-bold text-on-surface tracking-wider">
              {successData.token}
            </span>
          </div>
          
          <div className="mt-4">
             <div className="bg-surface-container-low p-3 rounded-lg border-2 border-outline-variant break-all text-xs font-bold text-on-surface-variant">
               {typeof window !== 'undefined' ? `${window.location.origin}/pengaduan/token?token=${successData.token}` : ''}
             </div>
          </div>

          <div className="pt-6 border-t border-outline-variant mt-6 flex justify-center gap-4">
            <button 
              type="button"
              onClick={() => { setSuccessData(null); }}
              className="px-6 py-4 bg-surface text-on-surface font-bold rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all uppercase tracking-widest text-sm"
            >
              Buat Tiket Lain
            </button>
            <button 
              type="button"
              onClick={() => router.push('/pengaduan')}
              className="px-8 py-4 bg-primary text-on-primary text-on-primary font-bold rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all uppercase tracking-widest text-sm"
            >
              Kembali ke Daftar
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-outline-variant rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                1. Perihal / Indikasi Kasus <span className="text-error">*</span>
              </label>
              <input type="text" name="perihal" required placeholder="Contoh: Aduan Pencemaran PT Maju Jaya..." 
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-bold rounded-xl px-4 py-4 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                2. Tanggal Pembuatan Tiket <span className="text-error">*</span>
              </label>
              <input type="date" name="tanggal" required defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-bold rounded-xl px-4 py-4 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none cursor-pointer" />
            </div>

            <div className="pt-8 border-t border-outline-variant mt-8 flex justify-end">
              <button type="submit" disabled={loading} 
                className="w-full md:w-auto px-10 py-4 bg-purple-400 hover:bg-purple-300 text-on-surface font-bold rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-70 disabled:hover:translate-y-0">
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
