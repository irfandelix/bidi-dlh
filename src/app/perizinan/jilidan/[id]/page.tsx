'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, BookCopy, Info, CheckCircle2, ClipboardCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import LottieLoader from '@/components/LottieLoader';

export default function JilidanPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [petugasList, setPetugasList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // State for Arsip Upload
  const [fileDokumenCetak, setFileDokumenCetak] = useState<File | null>(null);
  const [isUploadingArsip, setIsUploadingArsip] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      
      // Fetch doc
      const { data: docData } = await supabase.from('dokumens').select('*').eq('id', unwrappedParams.id).single();
      setDoc(docData);

      // Fetch petugas (urutan_hierarki 13)
      const { data: petugasData } = await supabase.from('tim_penilais').select('*').eq('urutan_hierarki', 13);
      if (petugasData) {
        setPetugasList(petugasData);
      }

      setLoading(false);
    };
    fetchData();
  }, [unwrappedParams.id]);

  const handleUploadArsip = async () => {
    if (!fileDokumenCetak) {
      alert('Pilih Dokumen Cetak Jilidan untuk di-upload.');
      return;
    }

    setIsUploadingArsip(true);
    setMessage('Mengunggah dokumen cetak jilidan...');

    try {
      const fd = new FormData();
      fd.append('file', fileDokumenCetak);
      fd.append('folderName', doc.nama_kegiatan || doc.nama_pemrakarsa || 'Arsip Tanpa Nama');
      const uploadRes = await fetch('/api/perizinan/upload', { method: 'POST', body: fd });
      const uploadData = await uploadRes.json();
      
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload gagal');

      let updatedArsipFisik = {};
      try { if (doc.arsip_fisik) updatedArsipFisik = typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc.arsip_fisik; } catch(e) {}
      
      updatedArsipFisik = { ...updatedArsipFisik, urlDokumenCetak: uploadData.url };

      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arsip_fisik: updatedArsipFisik })
      });

      if (res.ok) {
        alert('Dokumen berhasil di-upload dan tersimpan di Arsip Perizinan!');
        setFileDokumenCetak(null);
        // Refresh doc
        const supabase = createClient();
        const { data: newDoc } = await supabase.from('dokumens').select('*').eq('id', unwrappedParams.id).single();
        setDoc(newDoc);
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
    const tglJilidan = formData.get('tanggal_penerimaan_jilidan');
    const petugasMpp = formData.get('petugas_mpp');
    const pengirimJilidan = formData.get('pengirim_jilidan');
    
    let status_tahapan = 'Menunggu Jilidan';
    if (tglJilidan && petugasMpp) {
      status_tahapan = 'Penerimaan Jilidan';
    }

    const payload = {
      tanggal_penerimaan_jilidan: tglJilidan,
      petugas_mpp: petugasMpp,
      pengirim_jilidan: pengirimJilidan,
      status_tahapan,
    };

    try {
      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if(res.ok) {
        setMessage('Menyiapkan Dokumen Tanda Terima...');
        // Auto Download File
        const downloadUrl = `/api/generate?stage=jilidan&type=template_tanda_terima_jilidan&id=${unwrappedParams.id}`;
        
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          setMessage('Data Jilidan Berhasil Disimpan!');
          setTimeout(() => router.push('/perizinan/daftar'), 1500);
        }, 1000);
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
    <div className="max-w-4xl mx-auto py-8 space-y-8 pb-20">
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
        <div className="w-14 h-14 rounded-xl bg-orange-400 border border-outline-variant flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
          <BookCopy size={28} className="text-on-surface" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface uppercase">Penerimaan Jilidan Final</h2>
          <p className="text-sm font-bold text-on-surface-variant mt-1 uppercase">Konfirmasi penerimaan dokumen fisik jilidan #{String(doc.no_urut || doc.id).padStart(3, '0')}</p>
        </div>
      </div>
      
      <div className="bg-surface border border-outline-variant rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
        
        {/* Info Box NeoBrutalism */}
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 mb-8 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
          <Info className="text-on-surface mt-1" size={24} />
          <div>
            <h4 className="font-bold text-on-surface uppercase text-sm md:text-base leading-tight">{doc.nama_kegiatan}</h4>
            <p className="text-xs text-on-surface-variant font-bold mt-2 uppercase">{doc.nama_pemrakarsa} • {doc.jenis_dokumen}</p>
            <p className="text-xs font-bold bg-amber-300 text-on-surface px-2 py-1 rounded border border-outline-variant inline-block mt-2 shadow-sm hover:shadow-md transition-shadow uppercase">No. Registrasi: {doc.nomor_checklist || 'Belum ada'}</p>
          </div>
        </div>

        {/* Upload Arsip Dokumen Cetak (Isolated from main form) */}
        <div className="mb-8 p-6 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50">
          <h3 className="text-sm font-bold text-orange-800 mb-4 uppercase flex items-center gap-2">
            <ClipboardCheck size={18} /> Upload Berkas Digital (Dicicil)
          </h3>
          
          <div className="grid grid-cols-1 gap-4 mb-4">
            {/* Dokumen Cetak / Jilidan */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-orange-900 uppercase">Dokumen Cetak (Jilidan Final) / Dokumen Lingkungan</label>
              {(() => {
                let url = '';
                try { url = (doc?.arsip_fisik && typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc?.arsip_fisik)?.urlDokumenCetak; } catch(e) {}
                if (url) return <a href={url} target="_blank" className="inline-block bg-orange-200 text-orange-800 text-xs font-bold px-3 py-2 rounded-lg border border-orange-300">✅ Sudah Diupload</a>;
                return (
                  <input type="file" accept=".pdf" onChange={(e) => setFileDokumenCetak(e.target.files?.[0] || null)} className="w-full md:w-1/3 text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-orange-200 file:text-orange-800 file:font-bold hover:file:bg-orange-300 cursor-pointer bg-white border border-orange-200 rounded-lg" />
                );
              })()}
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={handleUploadArsip}
            disabled={isUploadingArsip || !fileDokumenCetak}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow border border-orange-600 transition-all text-xs uppercase disabled:opacity-50"
          >
            {isUploadingArsip ? 'Mengunggah...' : 'Simpan Berkas ke Arsip'}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-6 border border-outline-variant bg-secondary-container text-on-secondary-container rounded-2xl shadow-sm hover:shadow-md transition-shadow mb-8">
            <h3 className="font-bold text-on-surface flex items-center gap-2 text-lg uppercase tracking-wide">
              <span className="bg-primary text-on-primary text-on-primary w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-sm">1</span> Jilidan Final
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-2 uppercase tracking-wider">Tanggal Penerimaan Jilidan</label>
                <input type="date" name="tanggal_penerimaan_jilidan" defaultValue={doc.tanggal_penerimaan_jilidan || new Date().toISOString().split('T')[0]}
                  className="w-full bg-surface border border-outline-variant text-on-surface text-sm font-bold rounded-xl p-3 focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none" />
                <p className="text-[10px] text-on-surface-variant mt-2 font-bold uppercase">* Kosongkan jika belum menyerahkan jilidan buku final.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-2 uppercase tracking-wider">Siapa Menerima</label>
                <select name="petugas_mpp" defaultValue={doc.petugas_mpp || ''} className="w-full bg-surface border border-outline-variant text-on-surface text-sm font-bold rounded-xl p-3 focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none appearance-none cursor-pointer">
                  <option value="">-- Pilih Petugas MPP --</option>
                  {petugasList.map(p => (
                    <option key={p.id} value={p.nama}>{p.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-2 uppercase tracking-wider">Siapa Mengirimkan</label>
                <input type="text" name="pengirim_jilidan" defaultValue={doc.pengirim_jilidan || ''} placeholder="Ketik nama pengirim..."
                  className="w-full bg-surface border border-outline-variant text-on-surface text-sm font-bold rounded-xl p-3 focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none" />
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-outline-variant flex justify-end mt-8">
            <button type="submit" disabled={submitting} className="w-full sm:w-auto px-10 py-4 bg-orange-400 hover:bg-orange-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0">
              {submitting ? <LottieLoader size={24} /> : <CheckCircle2 size={18} />}
              Simpan Penerimaan Jilidan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
