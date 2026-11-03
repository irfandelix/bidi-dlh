'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Users, Loader2, ClipboardCheck, RotateCcw, CheckCircle2, Zap, Copy, Check, RefreshCw, Download } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function PemeriksaanSubstansiPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submittingAction, setSubmittingAction] = useState<'acc' | 'revisi' | null>(null);
  const [isGeneratingNomor, setIsGeneratingNomor] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [copiedNomor, setCopiedNomor] = useState(false);
  const [message, setMessage] = useState('');

  const [daftarPegawai, setDaftarPegawai] = useState<any[]>([]);
  const [includeUndangan, setIncludeUndangan] = useState(false);
  const [undanganFile, setUndanganFile] = useState<File | null>(null);
  const [nomorUndangan, setNomorUndangan] = useState('');
  const [isUploadingUndangan, setIsUploadingUndangan] = useState(false);

  const [fileBaSidang, setFileBaSidang] = useState<File | null>(null);
  const [isUploadingBaSidang, setIsUploadingBaSidang] = useState(false);

  const handleSimpanTanggalDanGenerateNomor = async () => {
    const dateInput = document.querySelector('input[name="tanggal_pemeriksaan"]') as HTMLInputElement;
    const tgl = dateInput?.value;
    if (!tgl) {
      alert('Pilih Tanggal BA Pemeriksaan terlebih dahulu!');
      return;
    }

    setIsGeneratingNomor(true);
    setMessage('Menyimpan tanggal & men-generate Nomor BA Pemeriksaan...');
    try {
      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal_pemeriksaan: tgl, nomor_ba_pemeriksaan: 'AUTO' })
      });
      if (res.ok) {
        const resData = await res.json();
        const updatedDoc = resData.data || (await (await fetch(`/api/perizinan/${unwrappedParams.id}`)).json()).data;
        setDoc(updatedDoc);
        if (updatedDoc?.nomor_ba_pemeriksaan) {
          try {
            await navigator.clipboard.writeText(updatedDoc.nomor_ba_pemeriksaan);
            setCopiedNomor(true);
            setTimeout(() => setCopiedNomor(false), 2000);
          } catch {}
        }
        setMessage('Tanggal berhasil disimpan & Nomor BA Pemeriksaan berhasil di-generate!');
      } else {
        throw new Error('Gagal menyimpan tanggal & men-generate nomor');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGeneratingNomor(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleCopyNomor = async () => {
    if (!doc?.nomor_ba_pemeriksaan) return;
    try {
      await navigator.clipboard.writeText(doc.nomor_ba_pemeriksaan);
      setCopiedNomor(true);
      setTimeout(() => setCopiedNomor(false), 2000);
    } catch {}
  };

  const handleDownloadTemplate = async () => {
    if (!doc?.nomor_ba_pemeriksaan) {
      alert('Simpan tanggal & generate Nomor BA Pemeriksaan terlebih dahulu!');
      return;
    }
    setDownloadingTemplate(true);
    try {
      const downloadUrl = `/api/generate?stage=pemeriksaan-substansi&type=template_ba_substansi&id=${unwrappedParams.id}`;
      const fileRes = await fetch(downloadUrl);
      if (!fileRes.ok) throw new Error('Gagal men-generate berkas BA Pemeriksaan');

      const blob = await fileRes.blob();
      const disposition = fileRes.headers.get('Content-Disposition');
      let filename = `BA_Pemeriksaan_Substansi_${unwrappedParams.id}.docx`;
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
    } catch (err: any) {
      alert(err.message || 'Gagal mengunduh berkas');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch(`/api/perizinan/${unwrappedParams.id}`).then(res => res.json()),
      fetch('/api/tim-penilai').then(res => res.json())
    ]).then(([docRes, pegawaiRes]) => {
      setDoc(docRes.data);
      
      let af: any = {};
      try { 
        if (docRes.data?.arsip_fisik) {
          af = typeof docRes.data.arsip_fisik === 'string' ? JSON.parse(docRes.data.arsip_fisik) : docRes.data.arsip_fisik; 
        }
      } catch(e) {}
      
      if (af.undanganSidang) {
        setIncludeUndangan(true);
        if (af.noUndanganSidang) setNomorUndangan(af.noUndanganSidang);
      }

      // Urutkan berdasarkan urutan_hierarki
      const sortedPegawai = (pegawaiRes.data || []).sort((a: any, b: any) => (a.urutan_hierarki || 0) - (b.urutan_hierarki || 0));
      setDaftarPegawai(sortedPegawai);
      setLoading(false);
    });
  }, [unwrappedParams.id]);

  const handleSimpanUndangan = async () => {
    if (!undanganFile || !nomorUndangan) {
      alert('Mohon isi nomor surat dan pilih file undangan terlebih dahulu.');
      return;
    }
    
    setIsUploadingUndangan(true);
    setMessage('Mengunggah file undangan...');
    
    try {
      const uploadData = new FormData();
      uploadData.append('file', undanganFile);
      uploadData.append('folderName', doc.nama_kegiatan || doc.nama_pemrakarsa || 'Arsip Tanpa Nama');

      const uploadRes = await fetch('/api/perizinan/upload', {
        method: 'POST',
        body: uploadData
      });
      
      if (!uploadRes.ok) {
        throw new Error('Gagal mengunggah file undangan.');
      }

      const uploadResult = await uploadRes.json();
      
      let updatedArsipFisik = {};
      try { if (doc.arsip_fisik) updatedArsipFisik = typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc.arsip_fisik; } catch(e) {}
      
      updatedArsipFisik = {
        ...updatedArsipFisik,
        undanganSidang: true,
        noUndanganSidang: nomorUndangan,
        urlUndanganSidang: uploadResult.url || uploadResult.id
      };

      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arsip_fisik: updatedArsipFisik })
      });

      if (res.ok) {
        alert('Undangan berhasil di-upload dan tersimpan di Arsip Perizinan!');
        setIncludeUndangan(false);
      } else {
        throw new Error('Gagal menyimpan data undangan ke database.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUploadingUndangan(false);
      setMessage('');
    }
  };

  const handleSimpanBaSidang = async () => {
    if (!fileBaSidang) {
      alert('Mohon pilih file BA Sidang terlebih dahulu.');
      return;
    }
    
    setIsUploadingBaSidang(true);
    setMessage('Mengunggah file BA Sidang...');
    
    try {
      const uploadData = new FormData();
      uploadData.append('file', fileBaSidang);
      uploadData.append('folderName', doc.nama_kegiatan || doc.nama_pemrakarsa || 'Arsip Tanpa Nama');

      const uploadRes = await fetch('/api/perizinan/upload', {
        method: 'POST',
        body: uploadData
      });
      
      if (!uploadRes.ok) {
        throw new Error('Gagal mengunggah file BA Sidang.');
      }

      const uploadResult = await uploadRes.json();
      
      let updatedArsipFisik = {};
      try { if (doc.arsip_fisik) updatedArsipFisik = typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc.arsip_fisik; } catch(e) {}
      
      updatedArsipFisik = {
        ...updatedArsipFisik,
        urlBaSidang: uploadResult.url || uploadResult.id
      };

      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arsip_fisik: updatedArsipFisik })
      });

      if (res.ok) {
        alert('BA Sidang berhasil di-upload dan tersimpan di Arsip Perizinan!');
        setFileBaSidang(null);
        // Refresh doc
        const newDoc = await (await fetch(`/api/perizinan/${unwrappedParams.id}`)).json();
        setDoc(newDoc.data);
      } else {
        throw new Error('Gagal menyimpan data BA Sidang ke database.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUploadingBaSidang(false);
      setMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
    const actionType = (submitter?.value as 'acc' | 'revisi') || 'revisi';
    
    setSubmittingAction(actionType);
    
    const formData = new FormData(e.currentTarget);
    const penandatangan = formData.getAll('penandatangan[]');

    const status_tahapan = 'Pengembalian BA';

    // Get existing ekstra to merge
    let ekstra = {};
    try { if (doc.penandatangan_hua) ekstra = typeof doc.penandatangan_hua === 'string' ? JSON.parse(doc.penandatangan_hua) : doc.penandatangan_hua; } catch(e) {}

    const updatedEkstra = {
      ...ekstra,
      nama_perusahaan: formData.get('nama_perusahaan'),
      tambahan_kolom_kosong: formData.get('tambahan_kolom_kosong')
    };

    const payload = {
      nomor_ba_pemeriksaan: 'AUTO',
      tanggal_pemeriksaan: formData.get('tanggal_pemeriksaan'),
      penandatangan_pemeriksaan: JSON.stringify(penandatangan),
      status_tahapan, 
      penandatangan_hua: updatedEkstra
    };

    try {
      setMessage('Memproses Data Pemeriksaan...');
      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if(res.ok) {
        const resData = await res.json();
        setDoc(resData.data);
        setMessage('Data & Nomor BA Pemeriksaan berhasil disimpan! Silakan klik tombol Unduh Berkas BA Pemeriksaan.');
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAction(null);
    }
  };

  if (loading) return <LottieLoader size={150} text="MEMUAT DATA..." />;
  if (!doc) return <div className="text-center py-20 text-error font-bold bg-error-container text-on-error-container border border-outline-variant m-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">DATA TIDAK DITEMUKAN!</div>;

  let arsipFisik: any = {};
  try {
    if (doc?.arsip_fisik) {
      arsipFisik = typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc.arsip_fisik;
    }
  } catch (e) {}
  const hasUndangan = arsipFisik?.undanganSidang === true;

  let ekstraData: any = {};
  try {
    if (doc?.penandatangan_hua) {
      ekstraData = typeof doc.penandatangan_hua === 'string' ? JSON.parse(doc.penandatangan_hua) : doc.penandatangan_hua;
    }
  } catch(e) {}

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8 pb-20">
      <Link href="/perizinan/daftar" className="inline-flex items-center gap-2 text-sm text-on-surface font-bold transition-all bg-surface border border-outline-variant px-4 py-2 rounded-xl shadow-sm hover:-translate-y-1 hover:shadow-md uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Dashboard
      </Link>

      {message && (
        <div className="p-4 bg-emerald-200 text-on-surface rounded-xl shadow-sm hover:shadow-md transition-shadow border border-outline-variant font-bold uppercase tracking-wide">
          {message}
        </div>
      )}

      {/* Header NeoBrutalism */}
      <div className="flex items-center gap-4 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
        <div className="w-14 h-14 rounded-xl bg-indigo-400 border border-outline-variant flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
          <Users size={28} className="text-on-surface" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface uppercase">Input Pemeriksaan Substansi</h2>
          <p className="text-sm font-bold text-on-surface-variant mt-1 uppercase">TAHUN {doc.tahun || '2026'} | TAHAP 4: RAPAT SIDANG</p>
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
            <div className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">No. BA Pemeriksaan Substansi</div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="font-bold bg-indigo-300 text-on-surface px-3 py-1 rounded border border-outline-variant inline-block text-sm font-mono shadow-sm">
                {doc.nomor_ba_pemeriksaan || 'Belum di-generate'}
              </p>
              {doc.nomor_ba_pemeriksaan && (
                <button
                  type="button"
                  onClick={handleCopyNomor}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-300 font-bold rounded text-xs uppercase flex items-center gap-1 shadow-sm"
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

        <div className={`border rounded-2xl p-6 mb-8 shadow-sm hover:shadow-md transition-shadow ${hasUndangan ? 'bg-emerald-50 border-emerald-500' : 'bg-surface border-outline-variant'}`}>
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input 
              type="checkbox" 
              checked={includeUndangan}
              onChange={(e) => setIncludeUndangan(e.target.checked)}
              className={`w-5 h-5 border rounded focus:ring-indigo-500 cursor-pointer shadow-sm ${hasUndangan ? 'text-emerald-600 border-emerald-500 bg-emerald-100' : 'text-indigo-500 border-outline-variant bg-surface'}`} 
            />
            <span className={`font-bold uppercase tracking-wide ${hasUndangan ? 'text-emerald-800' : 'text-on-surface'}`}>UNDANGAN PEMERIKSAAN {hasUndangan && <CheckCircle2 className="inline ml-2 text-emerald-600" size={18} />}</span>
          </label>

          {includeUndangan && (
            <div className="pl-8 space-y-4">
              {hasUndangan && arsipFisik?.urlUndanganSidang && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-800 text-sm mb-4">
                  ✅ Undangan telah diupload: 
                  <a href={arsipFisik.urlUndanganSidang} target="_blank" rel="noopener noreferrer" className="ml-2 font-bold underline hover:text-emerald-900">
                    Lihat Dokumen
                  </a>
                </div>
              )}
              
              <input 
                type="text" 
                placeholder="Input nomor surat..." 
                value={nomorUndangan}
                onChange={(e) => setNomorUndangan(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-bold text-sm rounded-xl px-4 py-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-all outline-none"
                required={includeUndangan && !hasUndangan}
              />
              
              <div className="pt-4 border-t border-outline-variant flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">UPLOAD SCAN UNDANGAN (PDF)</label>
                  <input 
                    type="file" 
                    accept="application/pdf"
                    onChange={(e) => setUndanganFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-on-surface file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-outline-variant file:text-sm file:font-bold file:bg-[#ffd149] file:text-black hover:file:bg-[#e5bc41] cursor-pointer"
                  />
                </div>
                
                <button 
                  type="button" 
                  onClick={handleSimpanUndangan}
                  disabled={isUploadingUndangan || !undanganFile || !nomorUndangan}
                  className="px-6 py-2 bg-indigo-500 text-white font-bold rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center min-w-[120px]"
                >
                  {isUploadingUndangan ? <LottieLoader size={20} /> : 'Simpan'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Upload Arsip Fisik BA Sidang (Isolated from main form) */}
        <div className="mb-8 p-6 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50">
          <h3 className="text-sm font-bold text-indigo-800 mb-4 uppercase flex items-center gap-2">
            <ClipboardCheck size={18} /> Upload Berkas Digital
          </h3>
          
          <div className="grid grid-cols-1 gap-4 mb-4">
            {/* BA Sidang */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-indigo-900 uppercase">Berita Acara Sidang / Pemeriksaan Ter-Tanda Tangan</label>
              {(() => {
                let url = '';
                try { url = (doc?.arsip_fisik && typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc?.arsip_fisik)?.urlBaSidang; } catch(e) {}
                if (url) return <a href={url} target="_blank" className="inline-block bg-indigo-200 text-indigo-800 text-xs font-bold px-3 py-2 rounded-lg border border-indigo-300">✅ Sudah Diupload</a>;
                return (
                  <input type="file" accept=".pdf" onChange={(e) => setFileBaSidang(e.target.files?.[0] || null)} className="w-full md:w-1/3 text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-200 file:text-indigo-800 file:font-bold hover:file:bg-indigo-300 cursor-pointer bg-white border border-indigo-200 rounded-lg" />
                );
              })()}
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={handleSimpanBaSidang}
            disabled={isUploadingBaSidang || !fileBaSidang}
            className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow border border-indigo-600 transition-all text-xs uppercase disabled:opacity-50"
          >
            {isUploadingBaSidang ? 'Mengunggah...' : 'Simpan BA Sidang ke Arsip'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Langkah 1: Tanggal -> Langkah 2: Simpan Tanggal & Generate Nomor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl border border-indigo-200 bg-indigo-50/70 shadow-sm">
            <div>
              <label className="block text-sm font-bold text-indigo-950 mb-2 uppercase">
                1. Tanggal BA Pemeriksaan <span className="text-error">*</span>
              </label>
              <input type="date" name="tanggal_pemeriksaan" required defaultValue={doc.tanggal_pemeriksaan || new Date().toISOString().split('T')[0]}
                className="w-full bg-white border border-indigo-300 text-on-surface font-bold text-sm rounded-xl px-4 py-3 focus:bg-surface focus:shadow-sm transition-all outline-none cursor-pointer" />
              <p className="text-[11px] text-indigo-900 mt-1.5 font-bold">
                * Tentukan tanggal terlebih dahulu, lalu klik tombol di samping untuk menyimpan tanggal & menerbitkan nomor.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-indigo-950 mb-2 uppercase">
                2. Nomor BA Pemeriksaan Substansi
              </label>
              {doc.nomor_ba_pemeriksaan ? (
                <div className="space-y-2.5">
                  <div className="w-full bg-white border border-indigo-300 text-indigo-950 font-bold text-sm rounded-xl px-4 py-3 shadow-sm font-mono break-all">
                    {doc.nomor_ba_pemeriksaan}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyNomor}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold rounded-xl shadow-sm transition-colors text-xs uppercase flex items-center justify-center gap-1.5"
                      title="Salin Nomor"
                    >
                      {copiedNomor ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                      <span>{copiedNomor ? 'Tersalin' : 'Salin'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSimpanTanggalDanGenerateNomor}
                      disabled={isGeneratingNomor}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors text-xs uppercase flex items-center justify-center gap-1.5 disabled:opacity-50"
                      title="Simpan perubahan tanggal & perbarui nomor"
                    >
                      <RefreshCw size={15} className={isGeneratingNomor ? 'animate-spin' : ''} />
                      <span>{isGeneratingNomor ? 'Proses...' : 'Update Tanggal'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-800 font-bold">
                    ✅ {doc.tanggal_pemeriksaan ? `Tanggal (${doc.tanggal_pemeriksaan}) & Nomor sudah tersimpan.` : 'Nomor sudah tersimpan.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    disabled={downloadingTemplate}
                    className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors text-xs uppercase flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Download size={14} />
                    <span>{downloadingTemplate ? 'Mengunduh...' : 'Unduh Berkas BA Pemeriksaan (.docx)'}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSimpanTanggalDanGenerateNomor}
                  disabled={isGeneratingNomor}
                  className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors text-sm uppercase flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Zap size={16} />
                  {isGeneratingNomor ? 'Menyimpan & Generate...' : 'Simpan Tanggal & Generate Nomor'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2 uppercase">Nama PT / Instansi</label>
              <input type="text" name="nama_perusahaan" defaultValue={ekstraData?.nama_perusahaan || ''} placeholder="Contoh: PT Kasoma Properti Indonesia"
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-bold text-sm rounded-xl px-4 py-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none" />
              <p className="text-[10px] text-on-surface-variant mt-1 uppercase font-bold">* Bedakan dengan nama pemrakarsa (nama orang) saat awal pendaftaran</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-2 uppercase">Tambahan Baris Tanda Tangan Kosong</label>
              <input type="number" name="tambahan_kolom_kosong" min="0" max="10" defaultValue={ekstraData?.tambahan_kolom_kosong || '0'}
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-bold text-sm rounded-xl px-4 py-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none" />
              <p className="text-[10px] text-on-surface-variant mt-1 uppercase font-bold">* Isi angka (misal: 2) jika butuh baris ekstra untuk ditandatangani manual.</p>
            </div>
          </div>

          <div className="pt-8 border-t border-outline-variant mt-8">
            <label className="block text-sm font-bold text-on-surface mb-4 uppercase bg-indigo-200 inline-block px-4 py-2 rounded-lg border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex items-center gap-2">
              <ClipboardCheck size={18} className="text-on-surface" /> Pilih Anggota Tim Pemeriksa
            </label>
            <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-sm text-on-surface">
                  <thead className="text-xs uppercase bg-surface-container font-bold border-b-4 border-outline-variant sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="p-4 w-12 text-center border-r border-outline-variant">#</th>
                      <th scope="col" className="px-4 py-3 border-r border-outline-variant">Nama Pegawai</th>
                      <th scope="col" className="px-4 py-3">Jabatan / Kategori</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-900 font-bold">
                    {daftarPegawai.map((pegawai) => {
                      let isChecked = false;
                      try {
                        if (doc.penandatangan_pemeriksaan) {
                          const parsed = JSON.parse(doc.penandatangan_pemeriksaan);
                          if (parsed.includes(pegawai.id.toString())) isChecked = true;
                        }
                      } catch(e) {}
                      return (
                        <tr key={pegawai.id} className="hover:bg-primary-container transition-colors">
                          <td className="w-4 p-4 text-center border-r border-outline-variant">
                            <input type="checkbox" name="penandatangan[]" value={pegawai.id} defaultChecked={isChecked}
                                   className="w-5 h-5 text-indigo-500 bg-surface border border-outline-variant rounded focus:ring-indigo-500 cursor-pointer shadow-sm hover:shadow-md transition-shadow" />
                          </td>
                          <td className="px-4 py-3 font-bold text-on-surface border-r border-outline-variant">{pegawai.nama}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded bg-surface-container text-on-surface border border-outline-variant shadow-sm hover:shadow-md transition-shadow text-xs font-bold uppercase tracking-wide">
                              {pegawai.jabatan_dinas || pegawai.kategori || '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-3 font-bold uppercase">* Kepala Bidang akan otomatis menjadi Penandatangan Utama (Kiri Bawah).</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-outline-variant mt-8">
            <Link
              href={`/perizinan/pengembalian/${doc.id}`}
              className="w-full sm:w-auto px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl border border-indigo-700 shadow-sm hover:-translate-y-1 transition-all flex items-center justify-center gap-2 tracking-wider uppercase text-sm"
            >
              Lanjut ke Tahap 5: Penyerahan BA <ArrowRight size={18} />
            </Link>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-end">
              {doc.nomor_ba_pemeriksaan && (
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl border border-emerald-700 shadow-sm hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-70"
                >
                  {downloadingTemplate ? <LottieLoader size={24} /> : <Download size={18} />}
                  Unduh Berkas BA Pemeriksaan (.docx)
                </button>
              )}
              <button type="submit" name="action" value="revisi" disabled={submittingAction !== null}
                className="w-full sm:w-auto px-8 py-4 bg-error text-on-error hover:bg-error-container text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0">
                {submittingAction !== null ? <LottieLoader size={24} /> : <RotateCcw size={18} />}
                Simpan Data BA Rapat & Kembalikan Ke Pemrakarsa
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
