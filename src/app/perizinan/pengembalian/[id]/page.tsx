'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, RotateCcw, Save } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function PengembalianPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/perizinan/${unwrappedParams.id}`)
      .then(res => res.json())
      .then(res => {
        setDoc(res.data);
        setLoading(false);
      });
  }, [unwrappedParams.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const status_tahapan = 'Dikembalikan / Ditolak'; 

    const payload = {
      tanggal_pengembalian: formData.get('tanggal_pengembalian'),
      status_tahapan, 
    };

    try {
      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if(res.ok) {
        setMessage('Status Pengembalian Berhasil Disimpan!');
        setTimeout(() => router.push('/perizinan/daftar'), 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-900 font-black flex items-center justify-center gap-2"><LottieLoader size={24} /> MEMUAT...</div>;
  if (!doc) return <div className="text-center py-20 text-rose-600 font-black bg-rose-100 border-4 border-slate-900 m-8 rounded-2xl shadow-[4px_4px_0_0_#0f172a]">DATA TIDAK DITEMUKAN!</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8 pb-20">
      <Link href="/perizinan/daftar" className="inline-flex items-center gap-2 text-sm text-slate-900 font-black transition-all bg-white border-2 border-slate-900 px-4 py-2 rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Dashboard
      </Link>

      {message && (
        <div className="p-4 bg-emerald-200 text-slate-900 rounded-xl shadow-[4px_4px_0_0_#0f172a] border-2 border-slate-900 font-black uppercase tracking-wide">
          {message}
        </div>
      )}

      {/* Header NeoBrutalism */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
        <div className="w-14 h-14 rounded-xl bg-rose-400 border-2 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a]">
          <RotateCcw size={28} className="text-slate-900" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">Form Pengembalian Dokumen</h2>
          <p className="text-sm font-bold text-slate-600 mt-1 uppercase">TAHUN {doc.tahun || '2026'} | BERKAS DIKEMBALIKAN / DITOLAK</p>
        </div>
      </div>
      
      <div className="bg-white border-4 border-slate-900 rounded-3xl p-8 shadow-[8px_8px_0_0_#0f172a]">
        {/* Info Box NeoBrutalism */}
        <div className="bg-slate-100 border-4 border-slate-900 rounded-2xl p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-[4px_4px_0_0_#0f172a]">
          <div>
            <span className="font-black text-slate-500 text-xs uppercase tracking-wider">Nama Kegiatan</span>
            <p className="font-black text-slate-900 mt-1 uppercase text-sm md:text-base">{doc.nama_kegiatan}</p>
          </div>
          <div>
            <div className="font-black text-slate-500 text-xs uppercase tracking-wider">No Urut / Tahun</div>
            <p className="font-black bg-rose-300 text-slate-900 px-3 py-1 rounded border-2 border-slate-900 inline-block mt-1 text-sm shadow-[2px_2px_0_0_#0f172a]">
              #{String(doc.no_urut || doc.id).padStart(3, '0')} / {doc.tahun || '2026'}
            </p>
          </div>
          <div className="md:col-span-2 border-t-4 border-slate-900 pt-4 mt-2">
            <span className="font-black text-slate-500 text-xs uppercase tracking-wider">Pemrakarsa</span>
            <p className="font-black text-slate-900 mt-1 uppercase text-sm">{doc.nama_pemrakarsa || '-'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="max-w-md">
            <label className="block text-sm font-black text-slate-900 mb-2 uppercase">Tanggal Dikembalikan <span className="text-rose-500">*</span></label>
            <input type="date" name="tanggal_pengembalian" required defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-sm rounded-xl p-3 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none cursor-pointer" />
          </div>

          <div className="pt-8 border-t-4 border-slate-900 mt-8 flex justify-end">
            <button type="submit" disabled={submitting} 
              className="w-full sm:w-auto px-10 py-4 bg-rose-400 hover:bg-rose-300 text-slate-900 font-black rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0 text-sm">
              {submitting ? <LottieLoader size={24} /> : <Save size={18} />}
              Simpan Pengembalian
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
