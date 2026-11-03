'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Loader2, FileCheck2, UserCheck, ClipboardCheck, Zap, Copy, Check, RefreshCw, Download } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function PenerimaanPerbaikanPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isGeneratingNomor, setIsGeneratingNomor] = useState(false);
  const [downloadingRev, setDownloadingRev] = useState<string | null>(null);
  const [copiedNomor, setCopiedNomor] = useState(false);
  const [message, setMessage] = useState('');
  const [petugasGerai, setPetugasGerai] = useState<any[]>([]);

  // State for Arsip Upload
  const [fileTandaTerimaRevisi, setFileTandaTerimaRevisi] = useState<File | null>(null);
  const [fileSuratPerbaikan, setFileSuratPerbaikan] = useState<File | null>(null);
  const [isUploadingArsip, setIsUploadingArsip] = useState(false);
  const [nomorSuratPerbaikan, setNomorSuratPerbaikan] = useState('');
  const [tanggalSuratPerbaikan, setTanggalSuratPerbaikan] = useState('');
  
  // Track selected revision
  const [revisiKe, setRevisiKe] = useState<string>('1');

  useEffect(() => {
    Promise.all([
      fetch(`/api/perizinan/${unwrappedParams.id}`).then(res => res.json()),
      fetch('/api/tim-penilai?hierarki=13').then(res => res.json())
    ]).then(([docRes, petugasRes]) => {
      setDoc(docRes.data);
      if (petugasRes.data) {
        setPetugasGerai(petugasRes.data);
      }
      
      const initialRevisi = docRes.data?.revisi_ke || '1';
      setRevisiKe(String(initialRevisi));
      
      setLoading(false);
    });
  }, [unwrappedParams.id]);

  useEffect(() => {
    if (!doc) return;
    let arsip: any = {};
    try {
      if (doc?.arsip_fisik) {
        arsip = typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc.arsip_fisik;
      }
    } catch (e) {}
    
    setNomorSuratPerbaikan(arsip[`nomorSuratPerbaikan_${revisiKe}`] || '');
    setTanggalSuratPerbaikan(arsip[`tanggalSuratPerbaikan_${revisiKe}`] || '');
    
    // Clear selected files when revision changes
    setFileTandaTerimaRevisi(null);
    setFileSuratPerbaikan(null);
  }, [revisiKe, doc]);

  const currentNomorPhp = revisiKe === '1' ? doc?.nomor_php : doc?.[`nomor_php${parseInt(revisiKe, 10) - 1}`];
  const currentTanggalPhp = doc?.[`tanggal_php_${revisiKe}`] || (revisiKe === '1' ? doc?.tanggal_penyerahan_perbaikan : '');

  const handleSimpanTanggalDanGenerateNomor = async () => {
    const dateInput = document.querySelector('input[name="tanggal_penyerahan_perbaikan"]') as HTMLInputElement;
    const tgl = dateInput?.value;
    if (!tgl) {
      alert('Pilih Tanggal Penyerahan Berkas terlebih dahulu!');
      return;
    }

    setIsGeneratingNomor(true);
    setMessage(`Menyimpan tanggal & men-generate Nomor Tanda Terima Perbaikan (PHP ${revisiKe})...`);
    try {
      const payload: any = {
        nomor_php: 'AUTO',
        revisi_ke: revisiKe,
        [`tanggal_php_${revisiKe}`]: tgl,
      };
      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const resData = await res.json();
        const updatedDoc = resData.data || (await (await fetch(`/api/perizinan/${unwrappedParams.id}`)).json()).data;
        setDoc(updatedDoc);
        const generatedNo = revisiKe === '1' ? updatedDoc?.nomor_php : updatedDoc?.[`nomor_php${parseInt(revisiKe, 10) - 1}`];
        if (generatedNo) {
          try {
            await navigator.clipboard.writeText(generatedNo);
            setCopiedNomor(true);
            setTimeout(() => setCopiedNomor(false), 2000);
          } catch {}
        }
        setMessage(`Tanggal berhasil disimpan & Nomor PHP ${revisiKe} berhasil di-generate!`);
      } else {
        throw new Error('Gagal menyimpan tanggal & men-generate nomor PHP');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGeneratingNomor(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleCopyNomor = async () => {
    if (!currentNomorPhp) return;
    try {
      await navigator.clipboard.writeText(currentNomorPhp);
      setCopiedNomor(true);
      setTimeout(() => setCopiedNomor(false), 2000);
    } catch {}
  };

  const handleDownloadTemplate = async (targetRev: string = revisiKe) => {
    setDownloadingRev(targetRev);
    try {
      const docUrl = `/api/generate?stage=penerimaan-perbaikan&type=template_tanda_terima_perbaikan&id=${unwrappedParams.id}&target_revisi=${targetRev}`;
      const fileRes = await fetch(docUrl);
      if (!fileRes.ok) throw new Error('Gagal men-generate berkas Tanda Terima Perbaikan');

      const blob = await fileRes.blob();
      const disposition = fileRes.headers.get('Content-Disposition');
      let filename = `Tanda_Terima_Perbaikan_PHP${targetRev}_${doc.nama_kegiatan?.replace(/\s+/g, '_') || unwrappedParams.id}.docx`;
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches && matches[1]) filename = matches[1].replace(/['"]/g, '');
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error('Download error:', e);
      alert(e.message || 'Gagal mengunduh berkas');
    } finally {
      setDownloadingRev(null);
    }
  };

  const handleUploadArsip = async () => {
    let arsipFisik: any = {};
    try { if (doc.arsip_fisik) arsipFisik = typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc.arsip_fisik; } catch(e) {}
    
    const isFieldsChanged = nomorSuratPerbaikan !== (arsipFisik[`nomorSuratPerbaikan_${revisiKe}`] || '') || tanggalSuratPerbaikan !== (arsipFisik[`tanggalSuratPerbaikan_${revisiKe}`] || '');
    
    if (!fileTandaTerimaRevisi && !fileSuratPerbaikan && !isFieldsChanged) {
      alert('Pilih setidaknya satu file untuk di-upload atau ubah data surat.');
      return;
    }

    setIsUploadingArsip(true);
    setMessage('Menyimpan data dan mengunggah dokumen...');

    try {
      const uploadFile = async (file: File) => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folderName', doc.nama_kegiatan || doc.nama_pemrakarsa || 'Arsip Tanpa Nama');
        const uploadRes = await fetch('/api/perizinan/upload', { method: 'POST', body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload gagal');
        return uploadData.url;
      };

      let urlTandaTerima = arsipFisik[`urlTandaTerimaRevisi_${revisiKe}`];
      let urlSuratPerbaikan = arsipFisik[`urlSuratPerbaikan_${revisiKe}`];

      if (fileTandaTerimaRevisi) urlTandaTerima = await uploadFile(fileTandaTerimaRevisi);
      if (fileSuratPerbaikan) urlSuratPerbaikan = await uploadFile(fileSuratPerbaikan);

      const updatedArsipFisik = { 
        ...arsipFisik, 
        [`urlTandaTerimaRevisi_${revisiKe}`]: urlTandaTerima,
        [`urlSuratPerbaikan_${revisiKe}`]: urlSuratPerbaikan,
        [`nomorSuratPerbaikan_${revisiKe}`]: nomorSuratPerbaikan,
        [`tanggalSuratPerbaikan_${revisiKe}`]: tanggalSuratPerbaikan
      };

      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arsip_fisik: updatedArsipFisik })
      });

      if (res.ok) {
        alert('Dokumen dan data berhasil disimpan di Arsip Perizinan!');
        setFileTandaTerimaRevisi(null);
        setFileSuratPerbaikan(null);
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
    const status_tahapan = 'Penerimaan Perbaikan';
    const nomor_revisi = formData.get('nomor_revisi') as string;
    const tanggal_penyerahan = formData.get('tanggal_penyerahan_perbaikan') as string;

    const payload: any = {
      nomor_php: 'AUTO',
      revisi_ke: nomor_revisi,
      petugas_mpp_id: formData.get('petugas_mpp_id'),
      status_tahapan, 
    };

    if (['1', '2', '3', '4', '5'].includes(nomor_revisi as string)) {
      payload[`tanggal_php_${nomor_revisi}`] = tanggal_penyerahan;
    } else {
      payload.tanggal_php_1 = tanggal_penyerahan;
    }

    try {
      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if(res.ok) {
        const resData = await res.json();
        setDoc(resData.data);
        setMessage(`Data & Nomor Penerimaan Perbaikan (PHP ${nomor_revisi}) berhasil disimpan! Silakan klik tombol Unduh Berkas.`);
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
        <div className="w-14 h-14 rounded-xl bg-secondary text-on-secondary border border-outline-variant flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
          <FileCheck2 size={28} className="text-on-surface" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface uppercase">
            {doc?.status_tahapan === 'Pengembalian Revisi' ? 'Input Terima Revisi' : 'Input Penerimaan Perbaikan'}
          </h2>
          <p className="text-sm font-bold text-on-surface-variant mt-1 uppercase">
            TAHUN {doc?.tahun || '2026'} | {doc?.status_tahapan === 'Pengembalian Revisi' ? 'TAHAP 9: TERIMA REVISI' : 'TAHAP 6: PHP'}
          </p>
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
            <div className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">No. Tanda Terima Perbaikan (PHP {revisiKe})</div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="font-bold bg-emerald-300 text-on-surface px-3 py-1 rounded border border-outline-variant inline-block text-sm font-mono shadow-sm">
                {currentNomorPhp || 'Belum di-generate'}
              </p>
              {currentNomorPhp && (
                <button
                  type="button"
                  onClick={handleCopyNomor}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold rounded text-xs uppercase flex items-center gap-1 shadow-sm"
                >
                  {copiedNomor ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  {copiedNomor ? 'Tersalin' : 'Salin'}
                </button>
              )}
            </div>
          </div>
          <div className="md:col-span-2 border-t border-outline-variant pt-4 mt-2">
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Pemrakarsa</span>
            <p className="font-bold text-on-surface mt-1 uppercase text-sm">{doc.nama_pemrakarsa || '-'}</p>
          </div>
        </div>

        {/* Riwayat PHP */}
        {(() => {
          let arsip: any = {};
          try { arsip = doc?.arsip_fisik && typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : (doc?.arsip_fisik || {}); } catch(e) {}
          
          const revisiNames: Record<string, string> = { '1': 'PHP 1', '2': 'PHP 2', '3': 'PHP 3', '4': 'PHP 4' };
          const revisiHistory = Object.entries(revisiNames).filter(([key]) => {
            const officialPhp = key === '1' ? doc?.nomor_php : doc?.[`nomor_php${parseInt(key, 10) - 1}`];
            const hasData = officialPhp || arsip[`nomorSuratPerbaikan_${key}`] || arsip[`tanggalSuratPerbaikan_${key}`] || arsip[`urlSuratPerbaikan_${key}`] || arsip[`urlTandaTerimaRevisi_${key}`] || doc[`tanggal_php_${key}`];
            if (key === '1' && !hasData) {
              return arsip['nomorSuratPerbaikan'] || arsip['tanggalSuratPerbaikan'] || arsip['urlSuratPerbaikan'] || arsip['urlTandaTerimaRevisi'] || doc['tanggal_php_1'];
            }
            return hasData;
          });

          if (revisiHistory.length === 0) return null;

          return (
            <div className="mb-8 p-6 rounded-2xl border border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase flex items-center gap-2">
                Riwayat Penerimaan Perbaikan
              </h3>
              <div className="space-y-3">
                {revisiHistory.map(([key, label]) => {
                  const officialPhp = key === '1' ? doc?.nomor_php : doc?.[`nomor_php${parseInt(key, 10) - 1}`];
                  const nomor = arsip[`nomorSuratPerbaikan_${key}`] || (key === '1' ? arsip.nomorSuratPerbaikan : '');
                  const tanggal = arsip[`tanggalSuratPerbaikan_${key}`] || (key === '1' ? arsip.tanggalSuratPerbaikan : '');
                  const urlSurat = arsip[`urlSuratPerbaikan_${key}`] || (key === '1' ? arsip.urlSuratPerbaikan : '');
                  const urlTandaTerima = arsip[`urlTandaTerimaRevisi_${key}`] || (key === '1' ? arsip.urlTandaTerimaRevisi : '');
                  const tanggalPhp = doc[`tanggal_php_${key}`];
                  return (
                    <div key={key} className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                      <div>
                        <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full border border-emerald-200 mb-2">{label}</span>
                        {officialPhp && <p className="text-xs font-bold text-emerald-900 font-mono">{officialPhp}</p>}
                        {nomor && <p className="text-xs font-bold text-slate-700 uppercase">Surat: {nomor}</p>}
                        {tanggal && <p className="text-xs text-slate-500 mt-0.5">{new Date(tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>}
                        {tanggalPhp && <p className="text-xs text-slate-500 mt-0.5">Penyerahan: {new Date(tanggalPhp).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Surat Permohonan</span>
                        {urlSurat
                          ? <a href={urlSurat} target="_blank" className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-200 transition-colors w-fit">Lihat File</a>
                          : <span className="text-xs text-slate-400 italic">Belum diupload</span>
                        }
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Tanda Terima (Scan)</span>
                        {urlTandaTerima
                          ? <a href={urlTandaTerima} target="_blank" className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-200 transition-colors w-fit">Lihat File</a>
                          : <span className="text-xs text-slate-400 italic">Belum diupload</span>
                        }
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Template (.docx)</span>
                        {officialPhp ? (
                          <button
                            type="button"
                            onClick={() => handleDownloadTemplate(key)}
                            disabled={downloadingRev === key}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 w-fit disabled:opacity-50"
                          >
                            <Download size={13} />
                            {downloadingRev === key ? 'Mengunduh...' : `Unduh ${label}`}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Nomor belum ada</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Upload Arsip Tanda Terima Revisi (Isolated from main form) */}
        <div className="mb-8 p-6 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50">
          <h3 className="text-sm font-bold text-emerald-800 mb-4 uppercase flex items-center gap-2">
            <ClipboardCheck size={18} /> Upload Berkas Digital
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-emerald-900 uppercase">Nomor Surat Permohonan Perbaikan</label>
              <input 
                type="text" 
                value={nomorSuratPerbaikan} 
                onChange={(e) => setNomorSuratPerbaikan(e.target.value)} 
                placeholder="-" 
                className="w-full text-sm px-4 py-2 rounded-xl border border-emerald-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold text-slate-700 bg-white" 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-emerald-900 uppercase">Tanggal Surat Permohonan Perbaikan</label>
              <input 
                type="date" 
                value={tanggalSuratPerbaikan} 
                onChange={(e) => setTanggalSuratPerbaikan(e.target.value)} 
                className="w-full text-sm px-4 py-2 rounded-xl border border-emerald-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold text-slate-700 bg-white cursor-pointer" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Surat Permohonan Perbaikan */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-emerald-900 uppercase">Surat Permohonan Perbaikan</label>
              {(() => {
                let url = '';
                try { url = (doc?.arsip_fisik && typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc?.arsip_fisik)?.[`urlSuratPerbaikan_${revisiKe}`]; } catch(e) {}
                if (url) return <a href={url} target="_blank" className="inline-block bg-emerald-200 text-emerald-800 text-xs font-bold px-3 py-2 rounded-lg border border-emerald-300">✅ Sudah Diupload</a>;
                return (
                  <input type="file" accept=".pdf" onChange={(e) => setFileSuratPerbaikan(e.target.files?.[0] || null)} className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-200 file:text-emerald-800 file:font-bold hover:file:bg-emerald-300 cursor-pointer bg-white border border-emerald-200 rounded-lg" />
                );
              })()}
            </div>

            {/* Tanda Terima Revisi */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-emerald-900 uppercase">Tanda Terima Perbaikan (Revisi) Ter-Tanda Tangan</label>
              {(() => {
                let url = '';
                try { url = (doc?.arsip_fisik && typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc?.arsip_fisik)?.[`urlTandaTerimaRevisi_${revisiKe}`]; } catch(e) {}
                if (url) return <a href={url} target="_blank" className="inline-block bg-emerald-200 text-emerald-800 text-xs font-bold px-3 py-2 rounded-lg border border-emerald-300">✅ Sudah Diupload</a>;
                return (
                  <input type="file" accept=".pdf" onChange={(e) => setFileTandaTerimaRevisi(e.target.files?.[0] || null)} className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-200 file:text-emerald-800 file:font-bold hover:file:bg-emerald-300 cursor-pointer bg-white border border-emerald-200 rounded-lg" />
                );
              })()}
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={handleUploadArsip}
            disabled={isUploadingArsip}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow border border-emerald-600 transition-all text-xs uppercase disabled:opacity-50"
          >
            {isUploadingArsip ? 'Mengunggah...' : 'Simpan Berkas ke Arsip'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Langkah 1: Pilih Revisi & Tanggal -> Langkah 2: Simpan Tanggal & Generate Nomor */}
          <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 shadow-sm space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-emerald-950 mb-2 uppercase">1. Penerimaan Revisi Ke-</label>
                <select 
                  name="nomor_revisi" 
                  value={revisiKe}
                  onChange={(e) => setRevisiKe(e.target.value)}
                  className="w-full bg-white border border-emerald-300 rounded-xl p-3 text-sm text-on-surface font-bold focus:bg-surface focus:shadow-sm transition-all outline-none cursor-pointer">
                  <option value="1">Revisi 1 (PHP1)</option>
                  <option value="2">Revisi 2 (PHP2)</option>
                  <option value="3">Revisi 3 (PHP3)</option>
                  <option value="4">Revisi 4 (PHP4)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-emerald-950 mb-2 uppercase">2. Tanggal Penyerahan Berkas <span className="text-error">*</span></label>
                <input type="date" name="tanggal_penyerahan_perbaikan" required key={revisiKe} defaultValue={currentTanggalPhp || new Date().toISOString().split('T')[0]}
                  className="w-full bg-white border border-emerald-300 text-on-surface font-bold text-sm rounded-xl p-3 focus:bg-surface focus:shadow-sm transition-all outline-none cursor-pointer" />
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-200/80">
              <label className="block text-sm font-bold text-emerald-950 mb-2 uppercase">
                3. Nomor Tanda Terima Perbaikan (PHP {revisiKe})
              </label>
              {currentNomorPhp ? (
                <div className="space-y-2.5">
                  <div className="w-full bg-white border border-emerald-300 text-emerald-950 font-bold text-sm rounded-xl px-4 py-3 shadow-sm font-mono break-all">
                    {currentNomorPhp}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyNomor}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold rounded-xl shadow-sm transition-colors text-xs uppercase flex items-center justify-center gap-1.5"
                      title="Salin Nomor"
                    >
                      {copiedNomor ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                      <span>{copiedNomor ? 'Tersalin' : 'Salin'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSimpanTanggalDanGenerateNomor}
                      disabled={isGeneratingNomor}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors text-xs uppercase flex items-center justify-center gap-1.5 disabled:opacity-50"
                      title="Simpan perubahan tanggal & perbarui nomor"
                    >
                      <RefreshCw size={15} className={isGeneratingNomor ? 'animate-spin' : ''} />
                      <span>{isGeneratingNomor ? 'Proses...' : 'Update Tanggal'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-800 font-bold">
                    ✅ {currentTanggalPhp ? `Tanggal (${currentTanggalPhp}) & Nomor PHP ${revisiKe} sudah tersimpan.` : `Nomor PHP ${revisiKe} sudah tersimpan.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate(revisiKe)}
                    disabled={downloadingRev === revisiKe}
                    className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors text-xs uppercase flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Download size={14} />
                    <span>{downloadingRev === revisiKe ? 'Mengunduh...' : `Unduh Berkas Tanda Terima PHP ${revisiKe} (.docx)`}</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSimpanTanggalDanGenerateNomor}
                    disabled={isGeneratingNomor}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors text-sm uppercase flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Zap size={16} />
                    {isGeneratingNomor ? 'Menyimpan & Generate...' : `Simpan Tanggal & Generate Nomor PHP ${revisiKe}`}
                  </button>
                  <span className="text-xs font-bold text-emerald-800/90">
                    * Pilih tanggal penyerahan di atas, lalu klik untuk menyimpan tanggal & menerbitkan nomor PHP {revisiKe}.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-on-surface mb-2 uppercase">Petugas Penerima (MPP/Loket) <span className="text-error">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCheck className="w-5 h-5 text-on-surface" />
                </div>
                <select name="petugas_mpp_id" required defaultValue={doc.petugas_mpp_id || ''}
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm rounded-xl pl-10 p-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none appearance-none font-bold cursor-pointer">
                  <option value="" disabled>-- Pilih Petugas Gerai --</option>
                  {petugasGerai.map(petugas => (
                    <option key={petugas.id} value={petugas.id}>
                      {petugas.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-outline-variant mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link
              href={`/perizinan/pemeriksaan-revisi/${doc.id}`}
              className="w-full sm:w-auto px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl border border-indigo-700 shadow-sm hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
            >
              Lanjut ke Tahap 7: Pemeriksaan Revisi <ArrowRight size={18} />
            </Link>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-end">
              {currentNomorPhp && (
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate(revisiKe)}
                  disabled={downloadingRev === revisiKe}
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl border border-emerald-700 shadow-sm hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-70"
                >
                  {downloadingRev === revisiKe ? <LottieLoader size={24} /> : <Download size={18} />}
                  Unduh Berkas Tanda Terima PHP {revisiKe} (.docx)
                </button>
              )}
              <button type="submit" disabled={submitting} 
                className="w-full sm:w-auto px-10 py-4 bg-secondary text-on-secondary hover:bg-emerald-300 text-on-surface font-bold rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0 text-sm">
                {submitting ? <LottieLoader size={24} /> : <FileCheck2 size={18} />}
                Simpan Data Penerimaan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
