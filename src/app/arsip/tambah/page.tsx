'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, PenTool } from 'lucide-react';

export default function TambahNotaDinasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [generatedNo, setGeneratedNo] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData(e.currentTarget);
    const payload = {
      nama_nota: formData.get('nama_nota'),
      tanggal_nota: formData.get('tanggal_nota'),
      dari_bagian: formData.get('dari_bagian'),
    };

    try {
      const res = await fetch('/api/arsip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Gagal menyimpan data');
      }

      setGeneratedNo(result.data.nomor_otomatis);
      setSuccessMsg('Nota Dinas berhasil diregistrasi!');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8 pb-20">
      
      <Link href="/arsip" className="inline-flex items-center gap-2 text-sm text-slate-900 font-black transition-all bg-white border-2 border-slate-900 px-4 py-2 rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Buku Register
      </Link>

      <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
        <div className="w-14 h-14 rounded-xl bg-fuchsia-400 border-2 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a]">
          <PenTool size={28} className="text-slate-900" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Registrasi Nota Dinas</h2>
          <p className="text-sm font-bold text-slate-600 mt-1 uppercase">Catat Nota Dinas Baru Untuk Mendapatkan Nomor Urut</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-200 text-slate-900 p-4 rounded-xl text-sm font-bold border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a]">
          {errorMsg}
        </div>
      )}

      {successMsg ? (
        <div className="bg-emerald-50 border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] rounded-3xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-400 border-4 border-slate-900 rounded-full flex items-center justify-center mx-auto shadow-[4px_4px_0_0_#0f172a]">
            <Save size={40} className="text-slate-900" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase text-slate-900">{successMsg}</h3>
            <p className="text-sm font-bold text-slate-600 mt-2 uppercase tracking-wide">Nomor Register Nota Dinas Anda:</p>
          </div>
          
          <div className="bg-white border-4 border-slate-900 p-6 rounded-2xl shadow-[4px_4px_0_0_#0f172a] inline-block mx-auto">
            <span className="text-3xl font-black text-slate-900 tracking-wider">
              {generatedNo}
            </span>
          </div>

          <div className="pt-6 border-t-4 border-slate-900 mt-6">
            <button 
              type="button"
              onClick={() => router.push('/arsip')}
              className="px-8 py-4 bg-slate-900 text-white font-black rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all uppercase tracking-widest text-sm"
            >
              Kembali ke Buku Register
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border-4 border-slate-900 rounded-3xl p-8 shadow-[8px_8px_0_0_#0f172a]">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                1. Nama Nota Dinas <span className="text-rose-500">*</span>
              </label>
              <input type="text" name="nama_nota" required placeholder="Contoh: Undangan Rapat Evaluasi..." 
                className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                  2. Tanggal Nota <span className="text-rose-500">*</span>
                </label>
                <input type="date" name="tanggal_nota" required defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none cursor-pointer" />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                  3. Asal Bagian <span className="text-rose-500">*</span>
                </label>
                <select name="dari_bagian" required 
                  className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-black rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none cursor-pointer uppercase">
                  <option value="Umum">Umum</option>
                  <option value="Perizinan">Perizinan</option>
                  <option value="Pengaduan">Pengaduan</option>
                  <option value="Pengawasan">Pengawasan</option>
                </select>
              </div>
            </div>

            <div className="pt-8 border-t-4 border-slate-900 mt-8 flex justify-end">
              <button type="submit" disabled={loading} 
                className="w-full md:w-auto px-10 py-4 bg-fuchsia-400 hover:bg-fuchsia-300 text-slate-900 font-black rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-70 disabled:hover:translate-y-0">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Generate Nomor Nota
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
