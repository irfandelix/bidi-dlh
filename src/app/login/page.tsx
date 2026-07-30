'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleLogin } from './actions';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      }
    } catch (err) {
      setError('Terjadi kesalahan yang tidak terduga.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full flex items-center justify-center bg-secondary-container px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-surface border border-outline-variant shadow-sm hover:shadow-md transition-shadow rounded-3xl p-8 sm:p-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <span className="bg-secondary text-on-secondary text-on-surface px-3 py-1 font-bold text-2xl border border-outline-variant rounded-xl shadow-sm hover:shadow-md transition-shadow">BIDI</span> 
            <span className="font-bold text-3xl text-on-surface tracking-tight">DLH</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface uppercase tracking-widest mt-4">
            Masuk ke Sistem
          </h2>
        </div>
        
        {error && (
          <div className="bg-error-container border border-outline-variant shadow-sm hover:shadow-md transition-shadow rounded-xl p-4 mb-8">
            <p className="text-sm text-on-surface font-bold text-center">
              ⚠️ {error}
            </p>
          </div>
        )}

        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-on-surface uppercase tracking-wider mb-2">
                Nama Pengguna
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none block w-full px-4 py-3 bg-tertiary-container border border-outline-variant rounded-xl shadow-sm hover:shadow-md transition-shadow text-on-surface font-bold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-400/50 transition-all"
                placeholder="Admin Bidi"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-on-surface uppercase tracking-wider mb-2">
                Kata Sandi
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none block w-full px-4 py-3 bg-blue-50 border border-outline-variant rounded-xl shadow-sm hover:shadow-md transition-shadow text-on-surface font-bold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-400/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-4 px-4 border border-outline-variant text-lg font-bold uppercase tracking-widest rounded-xl text-on-surface ${
                loading ? 'bg-emerald-300 translate-y-1 shadow-sm hover:shadow-md transition-shadow cursor-not-allowed' : 'bg-secondary text-on-secondary hover:bg-emerald-300 hover:translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow shadow-sm hover:shadow-md transition-shadow'
              } transition-all`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-on-surface" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </span>
              ) : (
                'MASUK SEKARANG'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
