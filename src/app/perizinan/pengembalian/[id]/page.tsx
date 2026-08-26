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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const status_tahapan = 'DIKEMBALIKAN';

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

  if (loading) return <LottieLoader size={150} text="MEMUAT DATA..." />;
  if (!doc) return <div className="text-center py-20 text-error font-bold bg-error-container text-on-error-container border border-outline-variant m-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">DATA TIDAK DITEMUKAN!</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8 pb-20">
      <Link href="/perizinan/daftar" className="inline-flex items-center gap-2 text-sm text-on-surface font-bold transition-all bg-surface border border-outline-variant px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Dashboard
      </Link>

      {message && (
        <div className="p-4 bg-emerald-200 text-on-surface rounded-xl shadow-sm hover:shadow-md transition-shadow border border-outline-variant font-bold uppercase tracking-wide">
          {message}
        </div>
      )}

      {/* Header NeoBrutalism */}
      <div className="flex items-center gap-4 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
        <div className="w-14 h-14 rounded-xl bg-error text-on-error border border-outline-variant flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
          <RotateCcw size={28} className="text-on-surface" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface uppercase">Form Pengembalian Dokumen</h2>
          <p className="text-sm font-bold text-on-surface-variant mt-1 uppercase">TAHUN {doc.tahun || '2026'} | BERKAS DIKEMBALIKAN</p>
        </div>
      </div>
      
      <div className="bg-surface border border-outline-variant rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
        {/* Info Box NeoBrutalism */}
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Nama Kegiatan</span>
            <p className="font-bold text-on-surface mt-1 uppercase text-sm md:text-base">{doc.nama_kegiatan}</p>
          </div>
          <div>
            <div className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">No Urut / Tahun</div>
            <p className="font-bold bg-error-container text-on-surface px-3 py-1 rounded border border-outline-variant inline-block mt-1 text-sm shadow-sm hover:shadow-md transition-shadow">
              #{String(doc.no_urut || doc.id).padStart(3, '0')} / {doc.tahun || '2026'}
            </p>
          </div>
          <div className="md:col-span-2 border-t border-outline-variant pt-4 mt-2">
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Pemrakarsa</span>
            <p className="font-bold text-on-surface mt-1 uppercase text-sm">{doc.nama_pemrakarsa || '-'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="max-w-md">
            <label className="block text-sm font-bold text-on-surface mb-2 uppercase">Tanggal Dikembalikan <span className="text-error">*</span></label>
            <input type="date" name="tanggal_pengembalian" required defaultValue={doc.tanggal_pengembalian || new Date().toISOString().split('T')[0]}
              className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-bold text-sm rounded-xl p-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none cursor-pointer" />
          </div>

          <div className="pt-8 border-t border-outline-variant mt-8 flex justify-end">
            <button type="submit" disabled={submitting} 
              className="w-full sm:w-auto px-10 py-4 bg-error text-on-error hover:bg-error-container text-on-surface font-bold rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0 text-sm">
              {submitting ? <LottieLoader size={24} /> : <Save size={18} />}
              Simpan Pengembalian
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
