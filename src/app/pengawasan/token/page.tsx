'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { ShieldCheck, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

function TokenForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Ambil token dari URL jika ada
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: sbError } = await supabase
        .from('pengawasan_lapangans')
        .select('id')
        .eq('token', token.trim().toUpperCase())
        .single();

      if (sbError || !data) {
        throw new Error('Token tidak ditemukan! Cek kembali link atau kode tokennya.');
      }
      
      const agendaData = data as any;

      // Jika ketemu, arahkan ke form pengisian
      router.push(`/pengawasan/ba/isi/${agendaData.id}`);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat verifikasi token.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-[12px_12px_0_0_#0f172a] border-4 border-slate-900 text-center relative overflow-hidden">
      
      <div className="w-20 h-20 bg-teal-400 text-slate-900 border-4 border-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0_0_#0f172a]">
        <ShieldCheck size={40} />
      </div>

      <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Verifikasi Token</h2>
      <p className="text-sm font-bold text-slate-600 mb-8 px-4 leading-relaxed">
        Masukkan kode unik agenda untuk mengakses form BAP lapangan.
      </p>

      {error && (
        <div className="animate-bounce bg-rose-200 text-rose-900 text-xs font-black p-4 rounded-xl border-2 border-rose-900 mb-6 flex items-center justify-center gap-2 shadow-[2px_2px_0_0_#881337] uppercase tracking-widest">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input 
            type="text" 
            required 
            placeholder="CONTOH: FYK-A8B9C2" 
            value={token}
            onChange={(e) => setToken(e.target.value.toUpperCase())}
            className="w-full text-center px-6 py-6 rounded-2xl border-4 border-slate-900 bg-teal-50 font-mono font-black text-xl md:text-2xl uppercase tracking-[0.2em] text-slate-900 focus:outline-none focus:ring-4 focus:ring-teal-400 focus:bg-white transition-all shadow-inner"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading || !token}
          className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-slate-300 disabled:translate-y-0 disabled:shadow-[6px_6px_0_0_#0f172a] text-slate-900 font-black py-4 rounded-2xl border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] hover:translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
        >
          {loading ? (
            <><LottieLoader size={24} /> Memverifikasi...</>
          ) : (
            <>Lanjut Isi BAP <ArrowRight size={20} /></>
          )}
        </button>
      </form>
    </div>
  );
}

export default function VerifikasiToken() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-teal-50">
      <Suspense fallback={<LottieLoader size={150} text="MEMUAT DATA..." />}>
        <TokenForm />
      </Suspense>
      <p className="mt-8 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">SI-DLH Field Module v1.0</p>
    </div>
  );
}
