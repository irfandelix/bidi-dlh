'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import Link from 'next/link';
import { 
  ShieldCheck, ArrowRight, AlertTriangle, ArrowLeft, 
  ClipboardPaste, Building2, MapPin, Calendar, User, 
  CheckCircle2, Sparkles, ExternalLink
} from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

function TokenForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewAgenda, setPreviewAgenda] = useState<any | null>(null);

  const verifyToken = async (tokenToVerify: string, autoRedirect = false) => {
    const cleanToken = tokenToVerify.trim().toUpperCase();
    if (!cleanToken) return;

    setLoading(true);
    setError('');
    setPreviewAgenda(null);

    try {
      const { data, error: sbError } = await supabase
        .from('pengawasan_lapangans')
        .select('id, nama_kegiatan, nama_pemrakarsa, kategori, alamat_lokasi, tim_tugas, tanggal_kunjungan, token')
        .eq('token', cleanToken)
        .single();

      if (sbError || !data) {
        throw new Error('Token tidak ditemukan! Periksa kembali kode token atau tautan yang diberikan.');
      }
      
      const agenda = data as any;

      if (autoRedirect) {
        // Auto-redirect directly if token came from URL param
        router.push(`/pengawasan/ba/isi/${agenda.id}`);
      } else {
        // Show preview confirmation card
        setPreviewAgenda(agenda);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memverifikasi token.');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Ambil token dari URL jika ada dan otomatis verifikasi
    const urlToken = searchParams.get('token');
    if (urlToken && urlToken.trim()) {
      const clean = urlToken.trim().toUpperCase();
      setToken(clean);
      verifyToken(clean, true);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyToken(token, false);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const clean = text.trim().toUpperCase();
        setToken(clean);
        setError('');
      }
    } catch (err) {
      console.warn('Cannot read clipboard', err);
    }
  };

  const handleProceedToBAP = () => {
    if (previewAgenda) {
      router.push(`/pengawasan/ba/isi/${previewAgenda.id}`);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200 rounded-[2rem] p-7 md:p-8 shadow-xl text-center relative overflow-hidden z-10 space-y-6">
      
      {/* Icon Perisai khas Menu Verifikasi Token */}
      <div className="w-20 h-20 bg-rose-100 text-rose-700 border-[3px] border-slate-200 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
        <ShieldCheck size={40} strokeWidth={2.5} />
      </div>

      <div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">
          Verifikasi Token
        </h2>
        <p className="text-xs md:text-sm font-bold text-slate-500 mt-1.5 px-2 leading-relaxed">
          Masukkan kode unik agenda untuk membuka formulir BAP inspeksi lapangan.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border-2 border-rose-200 text-rose-800 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2.5 text-left shadow-sm animate-in fade-in duration-200">
          <AlertTriangle size={18} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* CONFIRMATION PREVIEW JIKA TOKEN VALID */}
      {previewAgenda ? (
        <div className="bg-slate-50 border-2 border-emerald-200 rounded-2xl p-5 text-left space-y-4 animate-in zoom-in-95 duration-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <CheckCircle2 size={12} /> Agenda Terverifikasi
            </span>
            <span className="font-mono text-xs font-black text-slate-700">
              {previewAgenda.token}
            </span>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Objek Pengawasan
            </span>
            <h4 className="font-black text-sm text-slate-900 uppercase leading-snug">
              {previewAgenda.nama_kegiatan}
            </h4>
            <p className="text-xs font-bold text-slate-600 uppercase">
              Pemrakarsa: {previewAgenda.nama_pemrakarsa || '—'}
            </p>
          </div>

          <div className="space-y-1 text-xs text-slate-600 border-t border-slate-200 pt-2.5">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-indigo-600" />
              <span className="font-bold text-slate-700">
                {new Date(previewAgenda.tanggal_kunjungan).toLocaleDateString('id-ID', { dateStyle: 'long' })}
              </span>
            </div>
            {previewAgenda.alamat_lokasi && (
              <div className="flex items-start gap-1.5">
                <MapPin size={13} className="text-rose-500 shrink-0 mt-0.5" />
                <span className="text-[11px] font-medium text-slate-600 line-clamp-2">
                  {previewAgenda.alamat_lokasi}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleProceedToBAP}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>Buka Formulir BAP Lapangan</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <input 
                type="text" 
                required 
                placeholder="CONTOH: FYK-A8B9C2" 
                value={token}
                onChange={(e) => {
                  setToken(e.target.value.toUpperCase());
                  setError('');
                }}
                className="w-full text-center px-4 py-4 rounded-xl border-2 border-slate-200 bg-slate-50 font-mono font-black text-xl md:text-2xl uppercase tracking-[0.2em] text-slate-900 placeholder:text-slate-300 placeholder:normal-case placeholder:tracking-normal placeholder:font-sans placeholder:text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner"
              />
            </div>

            {/* Tombol Tempel dari Clipboard */}
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider py-1"
            >
              <ClipboardPaste size={14} />
              <span>Tempel dari Clipboard</span>
            </button>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !token.trim()}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black py-4 rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <LottieLoader size={20} /> Memverifikasi...
              </span>
            ) : (
              <>
                <span>Lanjut Verifikasi</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}

      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2">
        Sistem Informasi Pengawasan Lingkungan Hidup DLH
      </p>
    </div>
  );
}

export default function VerifikasiToken() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white relative">
      {/* Decorative Blur Background Element */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-50/70 rounded-full blur-3xl pointer-events-none -z-0"></div>

      {/* Back Link to Hub */}
      <div className="mb-6 z-10">
        <Link 
          href="/pengawasan" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-200 transition-colors shadow-sm"
        >
          <ArrowLeft size={16} /> Hub Pengawasan
        </Link>
      </div>

      <Suspense fallback={<LottieLoader size={150} text="MEMUAT FORM TOKEN..." />}>
        <TokenForm />
      </Suspense>
    </div>
  );
}
