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
    const status_tahapan = 'DIKEMBALIKAN';
    const revisiKe = doc?.revisi_ke || '1';

    const payload: any = {
      status_tahapan, 
    };

    let fisik: any = {};
    try { if (doc.arsip_fisik) fisik = typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc.arsip_fisik; } catch(e) {}
    if (typeof fisik === 'string') fisik = JSON.parse(fisik);

    const isRevisi = doc.status_tahapan?.toLowerCase().includes('revisi');
    const keySuffix = isRevisi ? `_revisi_${revisiKe}` : '';

    fisik[`penerima_ba${keySuffix}`] = formData.get('penerima_ba');
    fisik[`penyerah_ba${keySuffix}`] = formData.get('penyerah_ba');

    payload.arsip_fisik = fisik;

    if (isRevisi && ['1', '2', '3', '4', '5'].includes(String(revisiKe))) {
      payload[`tanggal_pengembalian_${revisiKe}`] = formData.get('tanggal_pengembalian');
    } else {
      payload.tanggal_pengembalian = formData.get('tanggal_pengembalian');
    }

    try {
      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if(res.ok) {
        setMessage('Status Penyerahan Berhasil Disimpan!');
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
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface uppercase">Form Penyerahan BA ke Pemrakarsa (MPP)</h2>
          <p className="text-sm font-bold text-on-surface-variant mt-1 uppercase">TAHUN {doc.tahun || '2026'} | PENYERAHAN BERKAS KE PEMRAKARSA</p>
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

        {/* Riwayat Penyerahan BA Revisi */}
        {(() => {
          const revisiNames: Record<string, string> = { '1': 'Revisi 1', '2': 'Revisi 2', '3': 'Revisi 3', '4': 'Revisi 4' };
          const revisiHistory = Object.entries(revisiNames).filter(([key]) => {
            return doc[`tanggal_pengembalian_${key}`] || (key === '1' && doc.tanggal_pengembalian);
          });

          if (revisiHistory.length === 0) return null;

          return (
            <div className="mb-8 p-6 rounded-2xl border border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase flex items-center gap-2">
                Riwayat Penyerahan BA Revisi
              </h3>
              <div className="space-y-3">
                {revisiHistory.map(([key, label]) => {
                  const tanggal = doc[`tanggal_pengembalian_${key}`] || (key === '1' ? doc.tanggal_pengembalian : null);
                  let penerima = '';
                  let penyerah = '';
                  try {
                    const fisik = typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc.arsip_fisik;
                    if (fisik) {
                      penerima = fisik[`penerima_ba_revisi_${key}`] || (key === '1' ? fisik['penerima_ba'] : '');
                      penyerah = fisik[`penyerah_ba_revisi_${key}`] || (key === '1' ? fisik['penyerah_ba'] : '');
                    }
                  } catch(e) {}
                  
                  return (
                    <div key={key} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                      <div>
                        <span className="inline-block bg-error-container text-on-error-container text-xs font-black px-3 py-1 rounded-full border border-error mb-2">{label}</span>
                        {tanggal && <p className="text-sm text-slate-700 font-bold">Penyerahan: {new Date(tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>}
                      </div>
                      {(penerima || penyerah) && (
                        <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col gap-1">
                           {penerima && <p><span className="font-bold">Penerima:</span> {penerima}</p>}
                           {penyerah && <p><span className="font-bold">Penyerah (MPP):</span> {penyerah}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="max-w-md">
            <label className="block text-sm font-bold text-on-surface mb-2 uppercase">Tanggal Penyerahan Berkas <span className="text-error">*</span></label>
            <input type="date" name="tanggal_pengembalian" required defaultValue={doc.tanggal_pengembalian || new Date().toISOString().split('T')[0]}
              className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-bold text-sm rounded-xl p-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none cursor-pointer" />
          </div>

          
          {(() => {
            let fisik: any = {};
            try { if (doc.arsip_fisik) fisik = typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc.arsip_fisik; } catch(e) {}
            if (typeof fisik === 'string') fisik = JSON.parse(fisik);
            const isRevisi = doc?.status_tahapan?.toLowerCase().includes('revisi');
            const keySuffix = isRevisi ? `_revisi_${doc.revisi_ke || 1}` : '';
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2 uppercase">Nama Penerima BA (Pemrakarsa/Konsultan) <span className="text-error">*</span></label>
                  <input type="text" name="penerima_ba" required defaultValue={fisik[`penerima_ba${keySuffix}`] || ''} placeholder="Contoh: Budi Santoso"
                    className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-bold text-sm rounded-xl p-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2 uppercase">Nama Petugas Penyerah BA (MPP) <span className="text-error">*</span></label>
                  <input type="text" name="penyerah_ba" required defaultValue={fisik[`penyerah_ba${keySuffix}`] || ''} placeholder="Contoh: Siti Aminah"
                    className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-bold text-sm rounded-xl p-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-all outline-none" />
                </div>
              </div>
            );
          })()}
          <div className="pt-8 border-t border-outline-variant mt-8 flex justify-end">
            <button type="submit" disabled={submitting} 
              className="w-full sm:w-auto px-10 py-4 bg-error text-on-error hover:bg-error-container text-on-surface font-bold rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0 text-sm">
              {submitting ? <LottieLoader size={24} /> : <Save size={18} />}
              Simpan Penyerahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
