'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, Lock, Eye, EyeOff, LogIn, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { handleLogin } from './actions';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await handleLogin(formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Terjadi kendala sistem. Silakan muat ulang halaman.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-100 via-emerald-50/40 to-teal-100/30 px-4 py-12 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card (NeoBrutalism Style) */}
      <div className="relative w-full max-w-md bg-white border-2 border-slate-900 rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] p-7 sm:p-10 transition-all">
        {/* Header & Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 p-2 bg-slate-50 border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center">
              <Image
                src="/logo-sragen.png"
                alt="Logo Sragen"
                width={38}
                height={38}
                className="object-contain"
                priority
              />
            </div>
            <div className="w-14 h-14 p-2 bg-emerald-500 border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center">
              <Image
                src="/BIDIDLH.png"
                alt="Logo BIDI DLH"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-950 text-[10px] font-black uppercase tracking-widest rounded-lg mb-2">
            <Sparkles size={11} className="text-emerald-700" />
            <span>Kabupaten Sragen</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
            BIDI <span className="text-emerald-600">DLH</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">
            Sistem Informasi Lingkungan Hidup Terpadu
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3 text-rose-800 animate-in fade-in duration-200">
            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs font-bold leading-snug">
              {error}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Username Input */}
          <div>
            <label 
              htmlFor="name" 
              className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2"
            >
              Nama Pengguna (Username)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="username"
                maxLength={60}
                placeholder="Masukkan username atau nama"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-900 transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                maxLength={100}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-900 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                title={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:translate-x-1 active:translate-y-1 text-white border-2 border-slate-900 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all flex items-center justify-center gap-2 ${
                loading ? 'opacity-80 cursor-wait' : ''
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Masuk ke Sistem</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security Badge Footer */}
        <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Autentikasi Terenkripsi & Anti-Injection Terproteksi
          </span>
        </div>
      </div>
    </div>
  );
}
