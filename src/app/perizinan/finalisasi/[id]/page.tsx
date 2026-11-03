'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle2, Award, BookCopy, FileText, ClipboardCheck, Zap, Copy, Check, RefreshCw } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function FinalisasiPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isGeneratingNomor, setIsGeneratingNomor] = useState(false);
  const [copiedNomor, setCopiedNomor] = useState(false);
  const [nomorRisalah, setNomorRisalah] = useState('');
  const [message, setMessage] = useState('');

  // State for Arsip Upload
  const [fileRpd, setFileRpd] = useState<File | null>(null);
  const [fileSk, setFileSk] = useState<File | null>(null);
  const [isUploadingArsip, setIsUploadingArsip] = useState(false);

  useEffect(() => {
    fetch(`/api/perizinan/${unwrappedParams.id}`)
      .then(res => res.json())
      .then(res => {
        setDoc(res.data);
        setNomorRisalah(res.data?.nomor_risalah || '');
        setLoading(false);
      });
  }, [unwrappedParams.id]);

  const handleSimpanTanggalDanGenerateNomorRisalah = async () => {
    const dateInput = document.querySelector('input[name="tanggal_risalah"]') as HTMLInputElement;
    const tgl = dateInput?.value;
    if (!tgl) {
      alert('Pilih Tanggal Pembuatan Risalah terlebih dahulu!');
      return;
    }

    setIsGeneratingNomor(true);
    setMessage('Menyimpan tanggal & men-generate Nomor Risalah (RPD)...');
    try {
      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal_risalah: tgl, nomor_risalah: 'AUTO' })
      });
      if (res.ok) {
        const resData = await res.json();
        const updatedDoc = resData.data || (await (await fetch(`/api/perizinan/${unwrappedParams.id}`)).json()).data;
        setDoc(updatedDoc);
        const generated = updatedDoc?.nomor_risalah || '';
        setNomorRisalah(generated);
        if (generated) {
          try {
            await navigator.clipboard.writeText(generated);
            setCopiedNomor(true);
            setTimeout(() => setCopiedNomor(false), 2000);
          } catch {}
        }
        setMessage('Tanggal berhasil disimpan & Nomor Risalah (RPD) berhasil di-generate!');
      } else {
        throw new Error('Gagal menyimpan tanggal & men-generate nomor RPD');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGeneratingNomor(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleCopyNomorRisalah = async () => {
    const val = doc?.nomor_risalah || nomorRisalah;
    if (!val) return;
    try {
      await navigator.clipboard.writeText(val);
      setCopiedNomor(true);
      setTimeout(() => setCopiedNomor(false), 2000);
    } catch {}
  };

  const handleUploadArsip = async () => {
    if (!fileRpd && !fileSk) {
      alert('Pilih setidaknya satu file untuk di-upload.');
      return;
    }

    setIsUploadingArsip(true);
    setMessage('Mengunggah dokumen arsip finalisasi...');

    try {
      const uploadFile = async (file: File | null) => {
        if (!file || file.size === 0) return null;
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folderName', doc.nama_kegiatan || doc.nama_pemrakarsa || 'Arsip Tanpa Nama');
        const res = await fetch('/api/perizinan/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload gagal');
        return data.url;
      };

      const urlRpd = await uploadFile(fileRpd);
      const urlSk = await uploadFile(fileSk);

      let updatedArsipFisik = {};
      try { if (doc.arsip_fisik) updatedArsipFisik = typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc.arsip_fisik; } catch(e) {}
      
      if (urlRpd) updatedArsipFisik = { ...updatedArsipFisik, urlRpd };
      if (urlSk) updatedArsipFisik = { ...updatedArsipFisik, urlSk };

      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arsip_fisik: updatedArsipFisik })
      });

      if (res.ok) {
        alert('Dokumen berhasil di-upload dan tersimpan di Arsip Perizinan!');
        setFileRpd(null);
        setFileSk(null);
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
    const tglSK = formData.get('tanggal_penyerahan_sk');
    const nomorSK = formData.get('nomor_sk');
    
    let status_tahapan = 'Selesai / SK';
    if (nomorSK || tglSK) status_tahapan = 'Menunggu Jilidan';

    const payload: any = {
      tanggal_risalah: formData.get('tanggal_risalah'),
      nomor_risalah: formData.get('nomor_risalah') || 'AUTO',
      nomor_sk: formData.get('nomor_sk'),
      tanggal_penyerahan_sk: tglSK,
      status_tahapan, 
    };

    try {
      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if(res.ok) {
        const resData = await res.json();
        setDoc(resData.data);
        setNomorRisalah(resData.data?.nomor_risalah || '');
        setMessage('Data Finalisasi, Nomor RPD & SK berhasil disimpan!');
        setTimeout(() => setMessage(''), 5000);
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
        <div className="w-14 h-14 rounded-xl bg-tertiary text-on-tertiary border border-outline-variant flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
          <Award size={28} className="text-on-surface" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface uppercase">Tahap Finalisasi (RPD, SK & Arsip)</h2>
          <p className="text-sm font-bold text-on-surface-variant mt-1 uppercase">TAHUN {doc.tahun || '2026'} | RISALAH, SK & JILIDAN FINAL</p>
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
            <div className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">No. Risalah (RPD)</div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="font-bold bg-amber-300 text-on-surface px-3 py-1 rounded border border-outline-variant inline-block text-sm font-mono shadow-sm">
                {doc.nomor_risalah || 'Belum di-generate'}
              </p>
              {doc.nomor_risalah && (
                <button
                  type="button"
                  onClick={handleCopyNomorRisalah}
                  className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-bold rounded text-xs uppercase flex items-center gap-1 shadow-sm"
                >
                  {copiedNomor ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  {copiedNomor ? 'Tersalin' : 'Salin'}
                </button>
              )}
            </div>
          </div>
          <div className="border-t border-outline-variant pt-4 mt-2">
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Pemrakarsa</span>
            <p className="font-bold text-on-surface mt-1 uppercase text-sm">{doc.nama_pemrakarsa || '-'}</p>
          </div>
          <div className="border-t border-outline-variant pt-4 mt-2">
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Nomor SK / Rekomendasi</span>
            <p className="font-bold text-on-surface mt-1 font-mono text-sm">{doc.nomor_sk || '-'}</p>
          </div>
        </div>

        {/* Upload Arsip Finalisasi (Isolated from main form) */}
        <div className="mb-8 p-6 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50">
          <h3 className="text-sm font-bold text-blue-800 mb-4 uppercase flex items-center gap-2">
            <ClipboardCheck size={18} /> Upload Berkas Digital
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Lembar RPD */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-blue-900 uppercase">1. Lembar Risalah (RPD) Ter-Tanda Tangan</label>
              {(() => {
                let url = '';
                try { url = (doc?.arsip_fisik && typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc?.arsip_fisik)?.urlRpd; } catch(e) {}
                if (url) return <a href={url} target="_blank" className="inline-block bg-blue-200 text-blue-800 text-xs font-bold px-3 py-2 rounded-lg border border-blue-300">✅ Sudah Diupload</a>;
                return (
                  <input type="file" accept=".pdf" onChange={(e) => setFileRpd(e.target.files?.[0] || null)} className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-200 file:text-blue-800 file:font-bold hover:file:bg-blue-300 cursor-pointer bg-white border border-blue-200 rounded-lg" />
                );
              })()}
            </div>
            
            {/* SK / Persetujuan */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-blue-900 uppercase">2. Surat Keputusan / Rekomendasi Ter-Tanda Tangan</label>
              {(() => {
                let url = '';
                try { url = (doc?.arsip_fisik && typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc?.arsip_fisik)?.urlSk; } catch(e) {}
                if (url) return <a href={url} target="_blank" className="inline-block bg-blue-200 text-blue-800 text-xs font-bold px-3 py-2 rounded-lg border border-blue-300">✅ Sudah Diupload</a>;
                return (
                  <input type="file" accept=".pdf" onChange={(e) => setFileSk(e.target.files?.[0] || null)} className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-200 file:text-blue-800 file:font-bold hover:file:bg-blue-300 cursor-pointer bg-white border border-blue-200 rounded-lg" />
                );
              })()}
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={handleUploadArsip}
            disabled={isUploadingArsip || (!fileRpd && !fileSk)}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow border border-blue-600 transition-all text-xs uppercase disabled:opacity-50"
          >
            {isUploadingArsip ? 'Mengunggah...' : 'Simpan Berkas ke Arsip'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bagian RPD */}
            <div className="space-y-4 p-6 border border-outline-variant bg-error-container text-on-error-container rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute -top-4 -right-4 p-3 text-rose-200/50 transform rotate-12"><BookCopy size={100} /></div>
              <h3 className="font-bold text-on-surface flex items-center gap-2 relative z-10 text-lg uppercase tracking-wide">
                <span className="bg-primary text-on-primary text-on-primary w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-sm">1</span> Finalisasi Risalah
              </h3>
              
              <div className="relative z-10">
                <label className="block text-xs font-bold text-on-surface mb-2 uppercase tracking-wider">1. Tanggal Pembuatan Risalah</label>
                <input type="date" name="tanggal_risalah" defaultValue={doc.tanggal_risalah || new Date().toISOString().split('T')[0]}
                  className="w-full bg-surface border border-outline-variant text-on-surface text-sm font-bold rounded-xl p-3 focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none" />
              </div>

              <div className="relative z-10 space-y-2.5">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">2. Nomor Risalah (RPD)</label>
                <input type="hidden" id="nomor_risalah_input" name="nomor_risalah" value={nomorRisalah} />
                {nomorRisalah ? (
                  <div className="space-y-2.5">
                    <div className="w-full bg-white border border-outline-variant text-on-surface text-sm font-bold font-mono rounded-xl p-3 shadow-sm break-all">
                      {nomorRisalah}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyNomorRisalah}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-slate-100 text-on-surface font-bold rounded-xl border border-outline-variant shadow-sm transition-all uppercase text-xs flex items-center justify-center gap-1.5"
                        title="Salin Nomor Risalah"
                      >
                        {copiedNomor ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                        <span>{copiedNomor ? 'Tersalin' : 'Salin'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSimpanTanggalDanGenerateNomorRisalah}
                        disabled={isGeneratingNomor}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-200 hover:bg-indigo-300 text-on-surface font-bold rounded-xl border border-outline-variant shadow-sm transition-all uppercase text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                        title="Simpan perubahan tanggal & perbarui nomor RPD"
                      >
                        <RefreshCw size={15} className={isGeneratingNomor ? 'animate-spin' : ''} />
                        <span>{isGeneratingNomor ? 'Proses...' : 'Update Tanggal'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-on-surface font-bold">
                      ✅ {doc.tanggal_risalah ? `Tanggal (${doc.tanggal_risalah}) & Nomor RPD sudah tersimpan.` : 'Nomor RPD sudah tersimpan.'}
                    </p>
                  </div>
                ) : (
                  <button type="button" 
                    onClick={handleSimpanTanggalDanGenerateNomorRisalah}
                    disabled={isGeneratingNomor}
                    className="w-full px-4 py-3 bg-indigo-200 hover:bg-indigo-300 text-on-surface font-bold rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 disabled:opacity-50">
                    <Zap size={16} /> {isGeneratingNomor ? 'Menyimpan & Generate...' : 'Simpan Tanggal & Generate Nomor RPD'}
                  </button>
                )}
              </div>
            </div>

            {/* Bagian SK */}
            <div className="space-y-4 p-6 border border-outline-variant bg-blue-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute -top-4 -right-4 p-3 text-blue-200/50 transform -rotate-12"><Award size={100} /></div>
              <h3 className="font-bold text-on-surface flex items-center gap-2 relative z-10 text-lg uppercase tracking-wide">
                <span className="bg-primary text-on-primary text-on-primary w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-sm">2</span> Penyerahan SK
              </h3>
              
              <div className="relative z-10">
                <label className="block text-xs font-bold text-on-surface mb-2 uppercase tracking-wider">Nomor SK / Rekomendasi</label>
                <input type="text" name="nomor_sk" defaultValue={doc.nomor_sk || ''} placeholder="Contoh: 660.1/123/DLH/2026"
                  className="w-full bg-surface border border-outline-variant text-on-surface text-sm font-bold rounded-xl p-3 focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none" />
              </div>

              <div className="relative z-10">
                <label className="block text-xs font-bold text-on-surface mb-2 uppercase tracking-wider">Tanggal Penyerahan SK</label>
                <input type="date" name="tanggal_penyerahan_sk" defaultValue={doc.tanggal_penyerahan_sk || ''}
                  className="w-full bg-surface border border-outline-variant text-on-surface text-sm font-bold rounded-xl p-3 focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none" />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-outline-variant mt-8 flex justify-end">
            <button type="submit" disabled={submitting} 
              className="w-full sm:w-auto px-10 py-4 bg-tertiary text-on-tertiary hover:bg-amber-300 text-on-surface font-bold rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0 text-sm">
              {submitting ? <LottieLoader size={24} /> : <CheckCircle2 size={18} />}
              Simpan Data Finalisasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
