'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, MapPin, Send, Loader2, MapPinned, ClipboardCheck, Zap, Copy, Check, RefreshCw, Download } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function VerlapPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isGeneratingNomor, setIsGeneratingNomor] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [copiedNomor, setCopiedNomor] = useState(false);
  const [message, setMessage] = useState('');
  const [daftarPegawai, setDaftarPegawai] = useState<any[]>([]);

  // State for Arsip Upload
  const [fileBaVerlap, setFileBaVerlap] = useState<File | null>(null);
  const [isUploadingArsip, setIsUploadingArsip] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/perizinan/${unwrappedParams.id}`).then(res => res.json()),
      fetch('/api/tim-penilai').then(res => res.json())
    ]).then(([docRes, pegawaiRes]) => {
      setDoc(docRes.data);
      // Urutkan berdasarkan urutan_hierarki
      const sortedPegawai = (pegawaiRes.data || []).sort((a: any, b: any) => (a.urutan_hierarki || 0) - (b.urutan_hierarki || 0));
      setDaftarPegawai(sortedPegawai);
      setLoading(false);
    });
  }, [unwrappedParams.id]);

  const handleSimpanTanggalDanGenerateNomor = async () => {
    const dateInput = document.querySelector('input[name="tanggal_verlap"]') as HTMLInputElement;
    const tgl = dateInput?.value;
    if (!tgl) {
      alert('Pilih Tanggal Verifikasi Lapangan terlebih dahulu!');
      return;
    }

    setIsGeneratingNomor(true);
    setMessage('Menyimpan tanggal & men-generate Nomor BA Verifikasi Lapangan...');
    try {
      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal_verlap: tgl, nomor_ba_verlap: 'AUTO' })
      });
      if (res.ok) {
        const resData = await res.json();
        const updatedDoc = resData.data || (await (await fetch(`/api/perizinan/${unwrappedParams.id}`)).json()).data;
        setDoc(updatedDoc);
        if (updatedDoc?.nomor_ba_verlap) {
          try {
            await navigator.clipboard.writeText(updatedDoc.nomor_ba_verlap);
            setCopiedNomor(true);
            setTimeout(() => setCopiedNomor(false), 2000);
          } catch {}
        }
        setMessage('Tanggal berhasil disimpan & Nomor BA Verlap berhasil di-generate!');
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
    if (!doc?.nomor_ba_verlap) return;
    try {
      await navigator.clipboard.writeText(doc.nomor_ba_verlap);
      setCopiedNomor(true);
      setTimeout(() => setCopiedNomor(false), 2000);
    } catch {}
  };

  const handleDownloadTemplate = async () => {
    if (!doc?.nomor_ba_verlap) {
      alert('Simpan tanggal & generate Nomor BA Verlap terlebih dahulu!');
      return;
    }
    setDownloadingTemplate(true);
    try {
      const downloadUrl = `/api/generate?stage=verifikasi-lapangan&type=template_ba_verlap&id=${unwrappedParams.id}`;
      const fileRes = await fetch(downloadUrl);
      if (!fileRes.ok) throw new Error('Gagal men-generate berkas BA Verlap');

      const blob = await fileRes.blob();
      const disposition = fileRes.headers.get('Content-Disposition');
      let filename = `BA_Verlap_${unwrappedParams.id}.docx`;
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

  const handleUploadArsip = async () => {
    if (!fileBaVerlap) {
      alert('Pilih file BA Verlap untuk di-upload.');
      return;
    }

    setIsUploadingArsip(true);
    setMessage('Mengunggah dokumen arsip BA Verlap...');

    try {
      const fd = new FormData();
      fd.append('file', fileBaVerlap);
      fd.append('folderName', doc.nama_kegiatan || doc.nama_pemrakarsa || 'Arsip Tanpa Nama');
      const uploadRes = await fetch('/api/perizinan/upload', { method: 'POST', body: fd });
      const uploadData = await uploadRes.json();
      
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload gagal');

      let updatedArsipFisik = {};
      try { if (doc.arsip_fisik) updatedArsipFisik = typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc.arsip_fisik; } catch(e) {}
      
      updatedArsipFisik = { ...updatedArsipFisik, urlBaVerlap: uploadData.url };

      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arsip_fisik: updatedArsipFisik })
      });

      if (res.ok) {
        alert('Dokumen berhasil di-upload dan tersimpan di Arsip Perizinan!');
        setFileBaVerlap(null);
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
    const penandatangan = formData.getAll('penandatangan[]');

    let ekstra: any = {};
    try { if (doc.penandatangan_hua) ekstra = typeof doc.penandatangan_hua === 'string' ? JSON.parse(doc.penandatangan_hua) : doc.penandatangan_hua; } catch(e) {}

    const updatedEkstra = {
      ...ekstra,
      email_pemrakarsa: formData.get('email_pemrakarsa'),
      jabatan_pemrakarsa: formData.get('jabatan_pemrakarsa'),
    };
    
    const payload = {
      nomor_ba_verlap: 'AUTO',
      tanggal_verlap: formData.get('tanggal_verlap'),
      penandatangan_verlap: JSON.stringify(penandatangan),
      status_tahapan: doc.jenis_dokumen === 'Integrasi RINTEK LB3 ke Persetujuan Lingkungan' ? 'Revisi Selesai' : 'Verlap Selesai',
      penandatangan_hua: updatedEkstra
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
        setMessage('Data & Nomor Verifikasi Lapangan berhasil disimpan! Silakan klik tombol Unduh Berkas BA Verlap.');
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

  let ekstraData: any = {};
  try { if (doc.penandatangan_hua) ekstraData = typeof doc.penandatangan_hua === 'string' ? JSON.parse(doc.penandatangan_hua) : doc.penandatangan_hua; } catch(e) {}

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
          <MapPinned size={28} className="text-on-surface" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface uppercase">Input Verifikasi Lapangan</h2>
          <p className="text-sm font-bold text-on-surface-variant mt-1 uppercase">TAHUN {doc.tahun || '2026'} | TAHAP 3: VERLAP</p>
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
            <div className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">No. BA Verifikasi Lapangan</div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="font-bold bg-amber-300 text-on-surface px-3 py-1 rounded border border-outline-variant inline-block text-sm font-mono shadow-sm">
                {doc.nomor_ba_verlap || 'Belum di-generate'}
              </p>
              {doc.nomor_ba_verlap && (
                <button
                  type="button"
                  onClick={handleCopyNomor}
                  className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-bold rounded text-xs uppercase flex items-center gap-1 shadow-sm"
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

        {/* Upload Arsip Fisik Awal (Isolated from main form) */}
        <div className="mb-8 p-6 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50">
          <h3 className="text-sm font-bold text-amber-800 mb-4 uppercase flex items-center gap-2">
            <ClipboardCheck size={18} /> Upload Berkas Digital
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* BA Verlap */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-amber-900 uppercase">Berita Acara Verlap Ter-Tanda Tangan</label>
              {(() => {
                let url = '';
                try { url = (doc?.arsip_fisik && typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc?.arsip_fisik)?.urlBaVerlap; } catch(e) {}
                if (url) return <a href={url} target="_blank" className="inline-block bg-amber-200 text-amber-800 text-xs font-bold px-3 py-2 rounded-lg border border-amber-300">✅ Sudah Diupload</a>;
                return (
                  <input type="file" accept=".pdf" onChange={(e) => setFileBaVerlap(e.target.files?.[0] || null)} className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-amber-200 file:text-amber-800 file:font-bold hover:file:bg-amber-300 cursor-pointer bg-white border border-amber-200 rounded-lg" />
                );
              })()}
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={handleUploadArsip}
            disabled={isUploadingArsip || !fileBaVerlap}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow border border-amber-600 transition-all text-xs uppercase disabled:opacity-50"
          >
            {isUploadingArsip ? 'Mengunggah...' : 'Simpan Berkas ke Arsip'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Langkah 1: Tanggal -> Langkah 2: Simpan Tanggal & Generate Nomor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl border border-amber-200 bg-amber-50/70 shadow-sm">
            <div>
              <label className="block text-sm font-bold text-amber-950 mb-2 uppercase">
                1. Tanggal Verifikasi Lapangan <span className="text-error">*</span>
              </label>
              <input type="date" name="tanggal_verlap" required defaultValue={doc.tanggal_verlap || new Date().toISOString().split('T')[0]}
                className="w-full bg-white border border-amber-300 text-on-surface font-bold text-sm rounded-xl px-4 py-3 focus:bg-surface focus:shadow-sm transition-all outline-none cursor-pointer" />
              <p className="text-[11px] text-amber-900 mt-1.5 font-bold">
                * Tentukan tanggal terlebih dahulu, lalu klik tombol di samping untuk menyimpan tanggal & menerbitkan nomor.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-amber-950 mb-2 uppercase">
                2. Nomor BA Verifikasi Lapangan (BA Verlap)
              </label>
              {doc.nomor_ba_verlap ? (
                <div className="space-y-2.5">
                  <div className="w-full bg-white border border-amber-300 text-amber-950 font-bold text-sm rounded-xl px-4 py-3 shadow-sm font-mono break-all">
                    {doc.nomor_ba_verlap}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyNomor}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl shadow-sm transition-colors text-xs uppercase flex items-center justify-center gap-1.5"
                      title="Salin Nomor"
                    >
                      {copiedNomor ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                      <span>{copiedNomor ? 'Tersalin' : 'Salin'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSimpanTanggalDanGenerateNomor}
                      disabled={isGeneratingNomor}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-sm transition-colors text-xs uppercase flex items-center justify-center gap-1.5 disabled:opacity-50"
                      title="Simpan perubahan tanggal & perbarui nomor"
                    >
                      <RefreshCw size={15} className={isGeneratingNomor ? 'animate-spin' : ''} />
                      <span>{isGeneratingNomor ? 'Proses...' : 'Update Tanggal'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-800 font-bold">
                    ✅ {doc.tanggal_verlap ? `Tanggal (${doc.tanggal_verlap}) & Nomor sudah tersimpan.` : 'Nomor sudah tersimpan.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    disabled={downloadingTemplate}
                    className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors text-xs uppercase flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Download size={14} />
                    <span>{downloadingTemplate ? 'Mengunduh...' : 'Unduh Berkas BA Verlap (.docx)'}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSimpanTanggalDanGenerateNomor}
                  disabled={isGeneratingNomor}
                  className="w-full px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-sm transition-colors text-sm uppercase flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Zap size={16} />
                  {isGeneratingNomor ? 'Menyimpan & Generate...' : 'Simpan Tanggal & Generate Nomor'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Tambahan Data Pemrakarsa */}
            <div className="md:col-span-2 pt-4 border-t border-outline-variant">
              <h4 className="text-sm font-bold text-on-surface mb-4 uppercase bg-blue-200 inline-block px-3 py-1 rounded border border-outline-variant shadow-sm hover:shadow-md transition-shadow">Lengkapi Data Pemrakarsa (Untuk BA)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2 uppercase">Email Pemrakarsa</label>
                  <input type="email" name="email_pemrakarsa" defaultValue={ekstraData?.email_pemrakarsa || ''} placeholder="Contoh: info@pt-abc.com"
                    className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-bold text-sm rounded-xl px-4 py-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2 uppercase">Jabatan Pemrakarsa <span className="text-error">*</span></label>
                  <input type="text" name="jabatan_pemrakarsa" required defaultValue={ekstraData?.jabatan_pemrakarsa || 'Penanggungjawab Kegiatan'} placeholder="Contoh: Direktur Utama"
                    className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-bold text-sm rounded-xl px-4 py-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none" />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-on-surface mb-4 uppercase bg-amber-200 inline-block px-4 py-2 rounded-lg border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
                Tim Verifikasi Lapangan (Pilih Petugas) <span className="text-error">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-inner">
                {daftarPegawai.map((pegawai) => {
                  let isChecked = false;
                  try {
                    if (doc.penandatangan_verlap) {
                      const parsed = JSON.parse(doc.penandatangan_verlap);
                      if (parsed.includes(pegawai.id.toString())) isChecked = true;
                    }
                  } catch(e) {}
                  return (
                    <label key={pegawai.id} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-tertiary-container text-on-tertiary-container border-2 border-transparent hover:border-outline-variant hover:shadow-sm hover:shadow-md transition-shadow transition-all cursor-pointer group bg-surface">
                      <input type="checkbox" name="penandatangan[]" value={pegawai.id} defaultChecked={isChecked}
                             className="w-5 h-5 rounded border border-outline-variant text-amber-500 focus:ring-amber-500 cursor-pointer shadow-sm hover:shadow-md transition-shadow" />
                      <div className="flex flex-col">
                        <span className="text-sm text-on-surface group-hover:text-amber-700 font-bold">{pegawai.nama}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-outline-variant mt-8">
            <Link
              href={`/perizinan/pemeriksaan-substansi/${doc.id}`}
              className="w-full sm:w-auto px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl border border-indigo-700 shadow-sm hover:-translate-y-1 transition-all flex items-center justify-center gap-2 tracking-wider uppercase text-sm"
            >
              Lanjut ke Tahap 4: Pemeriksaan <ArrowRight size={18} />
            </Link>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-end">
              {doc.nomor_ba_verlap && (
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl border border-emerald-700 shadow-sm hover:-translate-y-1 transition-all flex items-center justify-center gap-2 tracking-widest uppercase text-sm disabled:opacity-70"
                >
                  {downloadingTemplate ? <LottieLoader size={24} /> : <Download size={18} />}
                  Unduh Berkas BA Verlap (.docx)
                </button>
              )}
              <button type="submit" disabled={submitting} className="w-full sm:w-auto px-10 py-4 bg-tertiary text-on-tertiary hover:bg-amber-300 text-on-surface font-bold rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center justify-center gap-2 tracking-widest uppercase text-sm disabled:opacity-70 disabled:hover:translate-y-0">
                {submitting ? <LottieLoader size={24} /> : <Send size={18} />}
                Simpan Data BA Verlap
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
