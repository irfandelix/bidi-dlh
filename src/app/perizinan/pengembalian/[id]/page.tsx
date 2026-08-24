'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, RotateCcw, Save, ClipboardCheck } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function PengembalianPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // State for Arsip Upload
  const [fileSuratPengembalian, setFileSuratPengembalian] = useState<File | null>(null);
  const [isUploadingArsip, setIsUploadingArsip] = useState(false);

  useEffect(() => {
    fetch(`/api/perizinan/${unwrappedParams.id}`)
      .then(res => res.json())
      .then(res => {
        setDoc(res.data);
        setLoading(false);
      });
  }, [unwrappedParams.id]);

  const handleUploadArsip = async () => {
    if (!fileSuratPengembalian) {
      alert('Pilih Surat Pengembalian untuk di-upload.');
      return;
    }

    setIsUploadingArsip(true);
    setMessage('Mengunggah dokumen Surat Pengembalian...');

    try {
      const fd = new FormData();
      fd.append('file', fileSuratPengembalian);
      fd.append('folderName', doc.nama_kegiatan || doc.nama_pemrakarsa || 'Arsip Tanpa Nama');
      const uploadRes = await fetch('/api/perizinan/upload', { method: 'POST', body: fd });
      const uploadData = await uploadRes.json();
      
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload gagal');

      let updatedArsipFisik = {};
      try { if (doc.arsip_fisik) updatedArsipFisik = typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc.arsip_fisik; } catch(e) {}
      
      updatedArsipFisik = { ...updatedArsipFisik, urlSuratPengembalian: uploadData.url };

      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arsip_fisik: updatedArsipFisik })
      });

      if (res.ok) {
        alert('Dokumen berhasil di-upload dan tersimpan di Arsip Perizinan!');
        setFileSuratPengembalian(null);
        // Refresh doc
        const newDoc = await (await fetch(`/api/perizinan/${unwrappedParams.id}`)).json();
        setDoc(newDoc.data);
      } else {
        throw new Error('Gagal menyimpan url ke database.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUploadingArsip(false);
      setMessage('');
    }
  };

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

        {/* Upload Arsip Surat Pengembalian (Isolated from main form) */}
        <div className="mb-8 p-6 rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50">
          <h3 className="text-sm font-bold text-rose-800 mb-4 uppercase flex items-center gap-2">
            <ClipboardCheck size={18} /> Upload Berkas Digital (Dicicil)
          </h3>
          
          <div className="grid grid-cols-1 gap-4 mb-4">
            {/* Surat Pengembalian */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-rose-900 uppercase">Surat Pengembalian Dokumen Ter-Tanda Tangan</label>
              {(() => {
                let url = '';
                try { url = (doc?.arsip_fisik && typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc?.arsip_fisik)?.urlSuratPengembalian; } catch(e) {}
                if (url) return <a href={url} target="_blank" className="inline-block bg-rose-200 text-rose-800 text-xs font-bold px-3 py-2 rounded-lg border border-rose-300">✅ Sudah Diupload</a>;
                return (
                  <input type="file" accept=".pdf" onChange={(e) => setFileSuratPengembalian(e.target.files?.[0] || null)} className="w-full md:w-1/3 text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-rose-200 file:text-rose-800 file:font-bold hover:file:bg-rose-300 cursor-pointer bg-white border border-rose-200 rounded-lg" />
                );
              })()}
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={handleUploadArsip}
            disabled={isUploadingArsip || !fileSuratPengembalian}
            className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow border border-rose-600 transition-all text-xs uppercase disabled:opacity-50"
          >
            {isUploadingArsip ? 'Mengunggah...' : 'Simpan Surat ke Arsip'}
          </button>
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
