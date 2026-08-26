'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer, FilePlus, ClipboardCheck } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function DetailRegistrasiPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  
  // State for Arsip Upload
  const [fileSuratPermohonan, setFileSuratPermohonan] = useState<File | null>(null);
  const [fileRegister, setFileRegister] = useState<File | null>(null);
  const [isUploadingArsip, setIsUploadingArsip] = useState(false);
  const [message, setMessage] = useState('');
  
  // State for Nomor
  const [inputNomorSurat, setInputNomorSurat] = useState('');
  const [inputNomorReg, setInputNomorReg] = useState('');

  useEffect(() => {
    fetch(`/api/perizinan/${unwrappedParams.id}`)
      .then(res => res.json())
      .then(res => {
        setDoc(res.data);
        setInputNomorSurat(res.data.nomor_surat_permohonan || '');
        setInputNomorReg(res.data.nomor_checklist || '');
        setLoading(false);
      });
  }, [unwrappedParams.id]);

  const handleDownload = async (type: string) => {
    if (!doc?.id) return;
    setDownloading(type);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doc.id, type, stage: 'registrasi' })
      });
      if (!res.ok) throw new Error('Gagal generate dokumen');
      
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      let filename = `${type}_${doc.id}.docx`;
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    } finally {
      setDownloading(null);
    }
  };

  const handleUploadArsip = async () => {
    const isNomorChanged = inputNomorSurat !== (doc.nomor_surat_permohonan || '') || inputNomorReg !== (doc.nomor_checklist || '');
    if (!fileSuratPermohonan && !fileRegister && !isNomorChanged) {
      alert('Tidak ada file yang dipilih atau data yang diubah.');
      return;
    }

    setIsUploadingArsip(true);
    setMessage('Menyimpan data dan mengunggah dokumen...');

    try {
      let urlSuratPermohonan = '';
      let urlRegistrasi = '';

      const uploadFile = async (file: File) => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folderName', doc.nama_kegiatan || doc.nama_pemrakarsa || 'Arsip Tanpa Nama');
        const uploadRes = await fetch('/api/perizinan/upload', { method: 'POST', body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload gagal');
        return uploadData.url;
      };

      if (fileSuratPermohonan) urlSuratPermohonan = await uploadFile(fileSuratPermohonan);
      if (fileRegister) urlRegistrasi = await uploadFile(fileRegister);

      let updatedArsipFisik = {};
      try { 
        if (doc.arsip_fisik) updatedArsipFisik = typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc.arsip_fisik; 
      } catch(e) {}
      
      if (urlSuratPermohonan) updatedArsipFisik = { ...updatedArsipFisik, urlSuratPermohonan };
      if (urlRegistrasi) updatedArsipFisik = { ...updatedArsipFisik, urlRegistrasi };

      const payload: any = { 
        arsip_fisik: updatedArsipFisik,
        nomor_surat_permohonan: inputNomorSurat,
        nomor_checklist: inputNomorReg
      };

      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Dokumen dan data berhasil disimpan!');
        setFileSuratPermohonan(null);
        setFileRegister(null);
        // Refresh doc
        const newDoc = await (await fetch(`/api/perizinan/${unwrappedParams.id}`)).json();
        setDoc(newDoc.data);
      } else {
        throw new Error('Gagal menyimpan data ke database.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUploadingArsip(false);
      setMessage('');
    }
  };

  if (loading) return <LottieLoader size={150} text="MEMUAT DATA..." />;
  if (!doc) return <div className="text-center py-20 text-error font-bold bg-error-container text-on-error-container border border-outline-variant m-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">DATA TIDAK DITEMUKAN!</div>;

  const isAmdalnet = doc.sumber_data === 'AMDALNET';

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

      {/* Header */}
      <div className="flex items-center gap-4 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
        <div className="w-14 h-14 rounded-xl bg-slate-200 border border-outline-variant flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
          <FilePlus size={28} className="text-on-surface" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface uppercase">Detail Registrasi</h2>
          <p className="text-sm font-bold text-on-surface-variant mt-1 uppercase">TAHUN {doc.tahun || '2026'} | TAHAP 1: REGISTRASI</p>
        </div>
      </div>
      
      <div className="bg-surface border border-outline-variant rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
        {/* Info Box */}
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Nama Kegiatan</span>
            <p className="font-bold text-on-surface mt-1 uppercase text-sm md:text-base">{doc.nama_kegiatan}</p>
          </div>
          <div>
            <div className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">No Checklist Registrasi</div>
            <p className="font-bold bg-slate-200 text-on-surface px-3 py-1 rounded border border-outline-variant inline-block mt-1 text-sm shadow-sm hover:shadow-md transition-shadow">
              {doc.nomor_checklist || '-'}
            </p>
          </div>

          <div className="md:col-span-2 border-t border-outline-variant pt-4"></div>

          <div>
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Pemrakarsa</span>
            <p className="font-bold text-on-surface mt-1 uppercase text-sm">{doc.nama_pemrakarsa || '-'}</p>
          </div>
          <div>
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Telepon Pemrakarsa</span>
            <p className="font-bold text-on-surface mt-1 uppercase text-sm">{doc.telepon_pemrakarsa || '-'}</p>
          </div>

          <div>
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Jenis Dokumen</span>
            <p className="font-bold text-on-surface mt-1 uppercase text-sm">{doc.jenis_dokumen || '-'}</p>
          </div>
          <div>
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Jenis Kegiatan</span>
            <p className="font-bold text-on-surface mt-1 uppercase text-sm">{doc.jenis_kegiatan || '-'}</p>
          </div>

          <div className="md:col-span-2">
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Lokasi Kegiatan</span>
            <p className="font-bold text-on-surface mt-1 uppercase text-sm">{doc.lokasi_kegiatan || '-'}</p>
          </div>

          <div>
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Besaran / Luasan</span>
            <p className="font-bold text-on-surface mt-1 uppercase text-sm">{doc.besaran_luasan || '-'} {doc.satuan_luasan || ''}</p>
          </div>
          <div>
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Sumber Data</span>
            <p className="font-bold text-on-surface mt-1 uppercase text-sm">{doc.sumber_data || '-'}</p>
          </div>

          <div className="md:col-span-2 border-t border-outline-variant pt-4"></div>

          <div>
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Surat Permohonan</span>
            <p className="font-bold text-on-surface mt-1 uppercase text-sm">{doc.nomor_surat_permohonan || '-'}</p>
            <p className="text-xs text-on-surface-variant uppercase mt-0.5">{doc.tanggal_surat_permohonan || ''}</p>
          </div>
          <div>
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Perihal Permohonan</span>
            <p className="font-bold text-on-surface mt-1 uppercase text-sm">{doc.perihal_surat_permohonan || '-'}</p>
          </div>

          <div>
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Konsultan</span>
            <p className="font-bold text-on-surface mt-1 uppercase text-sm">{doc.nama_konsultan || '-'}</p>
            <p className="text-xs text-on-surface-variant uppercase mt-0.5">{doc.telepon_konsultan || 'Tidak ada no telepon'}</p>
          </div>
          <div>
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Pengirim Berkas</span>
            <p className="font-bold text-on-surface mt-1 uppercase text-sm">{doc.nama_pengirim || '-'} ({doc.pengirim_sebagai || '-'})</p>
          </div>

          <div className="md:col-span-2 border-t border-outline-variant pt-4"></div>

          <div>
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Tanggal Masuk Dokumen</span>
            <p className="font-bold text-on-surface mt-1 uppercase text-sm">{doc.tanggal_masuk_dokumen || '-'}</p>
          </div>
          <div>
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Keterangan / Catatan</span>
            <p className="font-bold text-on-surface mt-1 uppercase text-sm">{doc.keterangan || '-'}</p>
          </div>
        </div>

        {/* Download Cetak */}
        <div className="mb-8 p-6 rounded-2xl border border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase flex items-center gap-2">
            <Printer size={18} /> Cetak Dokumen Registrasi
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            {isAmdalnet ? (
              <button 
                type="button"
                onClick={() => handleDownload('Lembar_Registrasi_Amdalnet')}
                disabled={downloading === 'Lembar_Registrasi_Amdalnet'}
                className="w-full sm:w-auto px-6 py-4 bg-emerald-400 hover:bg-emerald-300 text-slate-900 border border-slate-200 font-black rounded-xl text-xs shadow-sm hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {downloading === 'Lembar_Registrasi_Amdalnet' ? <LottieLoader size={20} /> : <Printer size={16} />}
                Cetak Lembar Registrasi Amdalnet
              </button>
            ) : (
              <>
                <button 
                  type="button"
                  onClick={() => handleDownload('template_tanda_terima_registrasi')}
                  disabled={downloading === 'template_tanda_terima_registrasi'}
                  className="w-full sm:w-auto px-6 py-4 bg-amber-400 hover:bg-amber-300 text-slate-900 border border-slate-200 font-black rounded-xl text-xs shadow-sm hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {downloading === 'template_tanda_terima_registrasi' ? <LottieLoader size={20} /> : <Printer size={16} />}
                  Cetak Tanda Terima
                </button>
                <button 
                  type="button"
                  onClick={() => handleDownload('template_checklist')}
                  disabled={downloading === 'template_checklist'}
                  className="w-full sm:w-auto px-6 py-4 bg-teal-400 hover:bg-teal-300 text-slate-900 border border-slate-200 font-black rounded-xl text-xs shadow-sm hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {downloading === 'template_checklist' ? <LottieLoader size={20} /> : <Printer size={16} />}
                  Cetak Checklist
                </button>
              </>
            )}
          </div>
        </div>

        {/* Upload Arsip */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase flex items-center gap-2">
            <ClipboardCheck size={18} /> Upload Berkas Digital
          </h3>
          <p className="text-xs font-bold text-slate-500 mb-6 uppercase">Sesuaikan nomor surat jika diperlukan dan upload dokumen yang sudah ditandatangani untuk Arsip.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-900 uppercase">Nomor Surat Permohonan</label>
              <input 
                type="text" 
                value={inputNomorSurat} 
                onChange={(e) => setInputNomorSurat(e.target.value)} 
                placeholder="/" 
                className="w-full text-sm px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 font-bold text-slate-700" 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-900 uppercase">Nomor Registrasi / Checklist</label>
              <input 
                type="text" 
                value={inputNomorReg} 
                onChange={(e) => setInputNomorReg(e.target.value)} 
                placeholder="/" 
                className="w-full text-sm px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 font-bold text-slate-700" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Surat Permohonan */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-900 uppercase">1. Surat Permohonan</label>
              {(() => {
                let url = '';
                try { url = (doc?.arsip_fisik && typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc?.arsip_fisik)?.urlSuratPermohonan; } catch(e) {}
                if (url) return <a href={url} target="_blank" className="inline-block bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-lg border border-slate-300">✅ Sudah Diupload</a>;
                return (
                  <input type="file" accept=".pdf" onChange={(e) => setFileSuratPermohonan(e.target.files?.[0] || null)} className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-200 file:text-slate-800 file:font-bold hover:file:bg-slate-300 cursor-pointer bg-white border border-slate-200 rounded-lg" />
                );
              })()}
            </div>
            
            {/* Tanda Terima / Register */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-900 uppercase">2. Lembar Tanda Terima / Registrasi</label>
              {(() => {
                let url = '';
                try { url = (doc?.arsip_fisik && typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc?.arsip_fisik)?.urlRegistrasi; } catch(e) {}
                if (url) return <a href={url} target="_blank" className="inline-block bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-lg border border-slate-300">✅ Sudah Diupload</a>;
                return (
                  <input type="file" accept=".pdf" onChange={(e) => setFileRegister(e.target.files?.[0] || null)} className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-200 file:text-slate-800 file:font-bold hover:file:bg-slate-300 cursor-pointer bg-white border border-slate-200 rounded-lg" />
                );
              })()}
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={handleUploadArsip}
            disabled={isUploadingArsip || (!fileSuratPermohonan && !fileRegister)}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl shadow border border-slate-800 transition-all text-xs uppercase disabled:opacity-50"
          >
            {isUploadingArsip ? 'Mengunggah...' : 'Simpan Berkas ke Arsip'}
          </button>
        </div>

      </div>
    </div>
  );
}
