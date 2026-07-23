'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Archive, Info, CheckCircle2, XCircle, Printer, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import LottieLoader from '@/components/LottieLoader';

export default function ArsipPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const payload = { id: doc.id, type: 'arsip', stage: 'arsip-perizinan' };
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Gagal generate dokumen. Pastikan file src/templates/arsip-perizinan/arsip.docx tersedia.');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Lembar_Arsip_${doc.id}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    } finally {
      setDownloading(false);
    }
  };
  const [doc, setDoc] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchDoc = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('dokumens').select('*').eq('id', unwrappedParams.id).single();
      setDoc(data);
      setLoading(false);
    };
    fetchDoc();
  }, [unwrappedParams.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const getOldUrl = (key: string) => {
      try {
        if (!doc.arsip_fisik) return '';
        let parsed = JSON.parse(doc.arsip_fisik);
        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
        return parsed[key] || '';
      } catch(e) { return ''; }
    };

    const fisik: any = {
      dokumenCetak: formData.get('dokumenCetak') === '1',
      noDokumenCetak: formData.get('noDokumenCetak') || '',
      urlDokumenCetak: getOldUrl('urlDokumenCetak'),
      pkplhArsip: formData.get('pkplhArsip') === '1',
      noPkplhArsip: formData.get('noPkplhArsip') || '',
      urlPkplh: getOldUrl('urlPkplh'),
      suratPermohonan: formData.get('suratPermohonan') === '1',
      noSuratPermohonan: formData.get('noSuratPermohonan') || '',
      urlSuratPermohonan: getOldUrl('urlSuratPermohonan'),
      undanganSidang: formData.get('undanganSidang') === '1',
      noUndanganSidang: formData.get('noUndanganSidang') || '',
      urlUndanganSidang: getOldUrl('urlUndanganSidang'),
      urlUjiAdmin: getOldUrl('urlUjiAdmin'),
      urlBaVerlap: getOldUrl('urlBaVerlap'),
      urlBaSidang: getOldUrl('urlBaSidang'),
      urlRegistrasi: getOldUrl('urlRegistrasi'),
      urlPengembalian: getOldUrl('urlPengembalian'),
      urlPhp: getOldUrl('urlPhp'),
      urlPhp1: getOldUrl('urlPhp1'),
      urlPhp2: getOldUrl('urlPhp2'),
      urlPhp3: getOldUrl('urlPhp3'),
      urlPhp4: getOldUrl('urlPhp4'),
      urlPhp5: getOldUrl('urlPhp5'),
      urlRevisi: getOldUrl('urlRevisi'),
      urlRevisi1: getOldUrl('urlRevisi1'),
      urlRevisi2: getOldUrl('urlRevisi2'),
      urlRevisi3: getOldUrl('urlRevisi3'),
      urlRevisi4: getOldUrl('urlRevisi4'),
      urlRevisi5: getOldUrl('urlRevisi5'),
      rpdArsip: formData.get('rpdArsip') === '1',
      noRpdArsip: formData.get('noRpdArsip') || '',
      urlRpd: getOldUrl('urlRpd'),
      lokasiArsip: formData.get('lokasi_arsip') || '',
    };

    const uploadFile = async (file: File | null) => {
      if (!file || file.size === 0) return null;
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folderName', doc.nama_kegiatan || doc.nama_pemrakarsa || 'Arsip Tanpa Nama');
        const res = await fetch('/api/perizinan/upload', { method: 'POST', body: fd });
        const data = await res.json();
        return data.url;
      } catch (err) {
        console.error('Upload err', err);
        return null;
      }
    };

    const f1 = formData.get('file_dokumen_cetak') as File;
    if (f1 && f1.size > 0) { const url = await uploadFile(f1); if(url) fisik.urlDokumenCetak = url; }
    
    const f2 = formData.get('file_pkplh') as File;
    if (f2 && f2.size > 0) { const url = await uploadFile(f2); if(url) fisik.urlPkplh = url; }
    
    const f3 = formData.get('file_surat_permohonan') as File;
    if (f3 && f3.size > 0) { const url = await uploadFile(f3); if(url) fisik.urlSuratPermohonan = url; }
    
    const f4 = formData.get('file_undangan_sidang') as File;
    if (f4 && f4.size > 0) { const url = await uploadFile(f4); if(url) fisik.urlUndanganSidang = url; }
    
    const f5 = formData.get('file_uji_admin') as File;
    if (f5 && f5.size > 0) { const url = await uploadFile(f5); if(url) fisik.urlUjiAdmin = url; }
    
    const f6 = formData.get('file_ba_verlap') as File;
    if (f6 && f6.size > 0) { const url = await uploadFile(f6); if(url) fisik.urlBaVerlap = url; }
    
    const f7 = formData.get('file_ba_sidang') as File;
    if (f7 && f7.size > 0) { const url = await uploadFile(f7); if(url) fisik.urlBaSidang = url; }
    
    const f8 = formData.get('file_registrasi') as File;
    if (f8 && f8.size > 0) { const url = await uploadFile(f8); if(url) fisik.urlRegistrasi = url; }
    
    const f9 = formData.get('file_pengembalian') as File;
    if (f9 && f9.size > 0) { const url = await uploadFile(f9); if(url) fisik.urlPengembalian = url; }
    
    const f10 = formData.get('file_php') as File;
    if (f10 && f10.size > 0) { const url = await uploadFile(f10); if(url) fisik.urlPhp = url; }
    for(let i=1; i<=5; i++) {
      const fx = formData.get('file_php' + i) as File;
      if (fx && fx.size > 0) { const url = await uploadFile(fx); if(url) fisik['urlPhp'+i] = url; }
    }
    const f12 = formData.get('file_revisi') as File;
    if (f12 && f12.size > 0) { const url = await uploadFile(f12); if(url) fisik.urlRevisi = url; }
    for(let i=1; i<=5; i++) {
      const fy = formData.get('file_revisi' + i) as File;
      if (fy && fy.size > 0) { const url = await uploadFile(fy); if(url) fisik['urlRevisi'+i] = url; }
    }

    const f11 = formData.get('file_rpd') as File;
    if (f11 && f11.size > 0) { const url = await uploadFile(f11); if(url) fisik.urlRpd = url; }

    const action = (e.nativeEvent as any).submitter?.value;
    let status_tahapan = action === 'final' ? 'Diarsipkan' : doc.status_tahapan;

    const payload = {
      latitude: formData.get('latitude') || null,
      longitude: formData.get('longitude') || null,
      status_tahapan,
      arsip_fisik: JSON.stringify(fisik),
    };

    try {
      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if(res.ok) {
        setMessage('Data Arsip Berhasil Disimpan!');
        setTimeout(() => router.push('/perizinan/daftar'), 1500);
      } else {
        const errData = await res.json();
        alert('Gagal menyimpan: ' + (errData.error || 'Server error'));
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LottieLoader size={150} text="MEMUAT DATA..." />;
  if (!doc) return <div className="text-center py-20 text-rose-600 font-black bg-rose-100 border-4 border-slate-900 m-8 rounded-2xl shadow-[4px_4px_0_0_#0f172a]">DATA TIDAK DITEMUKAN!</div>;

  let fisik: any = {};
  try {
    if (doc.arsip_fisik) {
      fisik = JSON.parse(doc.arsip_fisik);
      if (typeof fisik === 'string') {
        fisik = JSON.parse(fisik);
      }
    }
  } catch (e) {}

  let isAmdalnet = false;
  let amdalnetUrl = '';
  try {
    const extra = typeof doc.penandatangan_hua === 'string' ? JSON.parse(doc.penandatangan_hua) : doc.penandatangan_hua;
    if (extra && extra.is_amdalnet) {
      isAmdalnet = true;
      amdalnetUrl = extra.file_amdalnet_url || '';
    }
  } catch (e) {}

  const revisiList = [];
  if (doc.nomor_revisi) revisiList.push({ key: '', nomor: doc.nomor_revisi, title: 'BA Pemeriksaan Revisi' });
  for (let i = 1; i <= 5; i++) {
    if (doc[`nomor_revisi_${i}`]) {
      revisiList.push({ key: i, nomor: doc[`nomor_revisi_${i}`], title: 'BA Pemeriksaan Revisi ' + i });
    }
  }

  const phpList = [];
  if (doc.nomor_php) phpList.push({ key: '', nomor: doc.nomor_php, title: 'Penerimaan Perbaikan / PHP' });
  for (let i = 1; i <= 5; i++) {
    if (doc[`nomor_php${i}`]) {
      phpList.push({ key: i, nomor: doc[`nomor_php${i}`], title: 'Penerimaan Perbaikan / PHP ' + i });
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8 pb-20">
      <Link href="/perizinan/daftar" className="inline-flex items-center gap-2 text-sm text-slate-900 font-black transition-all bg-white border-2 border-slate-900 px-4 py-2 rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Dashboard
      </Link>

      {message && (
        <div className="p-4 bg-emerald-200 text-slate-900 rounded-xl shadow-[4px_4px_0_0_#0f172a] border-2 border-slate-900 font-black uppercase tracking-wide">
          {message}
        </div>
      )}

      {/* Header NeoBrutalism */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-slate-400 border-2 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a]">
            <Archive size={28} className="text-slate-900" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">Verifikasi Berkas Fisik & Digital</h2>
            <p className="text-sm font-bold text-slate-600 mt-1 uppercase">Konfirmasi kelengkapan berkas #{String(doc.no_urut || doc.id).padStart(3, '0')}</p>
          </div>
        </div>
        <button onClick={handleDownload} disabled={downloading} className="px-6 py-3 bg-indigo-300 hover:bg-indigo-400 text-slate-900 font-black border-2 border-slate-900 rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 transition-all uppercase flex items-center gap-2 tracking-wider text-sm whitespace-nowrap disabled:opacity-50">
          {downloading ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />} 
          {downloading ? 'Memproses...' : 'Cetak Lembar Arsip (DOCX)'}
        </button>
      </div>
      
      <div className="bg-white border-4 border-slate-900 rounded-3xl p-8 shadow-[8px_8px_0_0_#0f172a]">
        
        {/* Info Box NeoBrutalism */}
        <div className="bg-slate-100 border-4 border-slate-900 rounded-2xl p-6 mb-8 flex items-start gap-4 shadow-[4px_4px_0_0_#0f172a]">
          <Info className="text-slate-900 mt-1 flex-shrink-0" size={24} />
          <div>
            <h4 className="font-black text-slate-900 uppercase text-sm md:text-base leading-tight">{doc.nama_kegiatan}</h4>
            <p className="text-xs text-slate-700 font-bold mt-2 uppercase">{doc.nama_pemrakarsa} • {doc.jenis_dokumen}</p>
            <p className="text-xs font-black bg-amber-300 text-slate-900 px-2 py-1 rounded border-2 border-slate-900 inline-block mt-2 shadow-[2px_2px_0_0_#0f172a] uppercase">No. Registrasi: {doc.nomor_checklist || 'Belum ada'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* 1. DOKUMEN LINGKUNGAN FINAL */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${fisik.dokumenCetak || fisik.urlDokumenCetak ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                <input type="checkbox" name="dokumenCetak" value="1" defaultChecked={fisik.dokumenCetak} className="mt-1 w-6 h-6 text-emerald-500 bg-white border-2 border-slate-900 rounded focus:ring-emerald-500 cursor-pointer shadow-[2px_2px_0_0_#0f172a]" />
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">1. Dokumen Lingkungan Final</p>
                  <input type="text" name="noDokumenCetak" defaultValue={fisik.noDokumenCetak} placeholder="Input nomor / posisi rak..." className="mt-3 w-full p-3 bg-white border-2 border-slate-900 rounded-xl text-sm text-slate-900 font-bold outline-none focus:shadow-[4px_4px_0_0_#0f172a] transition-all" />
                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-slate-900 font-black uppercase">Upload Softcopy (PDF/ZIP)</label>
                      {fisik.urlDokumenCetak && (
                        <a href={fisik.urlDokumenCetak} target="_blank" rel="noreferrer" className="text-xs font-bold bg-indigo-200 text-slate-900 px-3 py-1 rounded border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#0f172a] transition-all uppercase">Lihat Dokumen</a>
                      )}
                    </div>
                    <input type="file" name="file_dokumen_cetak" accept=".pdf,.zip,.rar" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. PKPLH ARSIP */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${fisik.pkplhArsip || fisik.urlPkplh ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                <input type="checkbox" name="pkplhArsip" value="1" defaultChecked={fisik.pkplhArsip} className="mt-1 w-6 h-6 text-emerald-500 bg-white border-2 border-slate-900 rounded focus:ring-emerald-500 cursor-pointer shadow-[2px_2px_0_0_#0f172a]" />
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">2. PKPLH Arsip</p>
                  <input type="text" name="noPkplhArsip" defaultValue={fisik.noPkplhArsip} placeholder="Input keterangan..." className="mt-3 w-full p-3 bg-white border-2 border-slate-900 rounded-xl text-sm text-slate-900 font-bold outline-none focus:shadow-[4px_4px_0_0_#0f172a] transition-all" />
                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-slate-900 font-black uppercase">Upload Scan PKPLH (PDF)</label>
                      {fisik.urlPkplh && (
                        <a href={fisik.urlPkplh} target="_blank" rel="noreferrer" className="text-xs font-bold bg-indigo-200 text-slate-900 px-3 py-1 rounded border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#0f172a] transition-all uppercase">Lihat Dokumen</a>
                      )}
                    </div>
                    <input type="file" name="file_pkplh" accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. BA UJI ADMINISTRASI */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${doc.nomor_uji_berkas || isAmdalnet || fisik.urlUjiAdmin ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                <div className="mt-1">{doc.nomor_uji_berkas || isAmdalnet ? <CheckCircle2 size={24} className="text-slate-900" /> : <XCircle size={24} className="text-slate-400" />}</div>
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">3. BA Uji Administrasi</p>
                  <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">
                    {isAmdalnet ? 'DIPROSES VIA AMDALNET' : (doc.nomor_uji_berkas || 'Belum terbit')}
                  </p>
                  
                  {isAmdalnet && amdalnetUrl && !fisik.urlUjiAdmin && (
                     <div className="mt-4 p-3 bg-amber-100 border-2 border-slate-900 rounded-xl shadow-[2px_2px_0_0_#0f172a]">
                        <p className="text-xs font-bold text-slate-900">
                           Catatan: Anda memproses via Amdalnet sebelumnya. File upload di tahap Uji Admin mungkin tersimpan di penyimpanan lama (bukan GDrive). 
                           Anda bisa menimpa / mengupload ulang file fisiknya di bawah ini agar tersimpan di GDrive Arsip.
                        </p>
                     </div>
                  )}

                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-slate-900 font-black uppercase">Upload Arsip Scan BA (PDF)</label>
                      {(fisik.urlUjiAdmin || (isAmdalnet ? amdalnetUrl : null)) && (
                        <a href={(fisik.urlUjiAdmin || (isAmdalnet ? amdalnetUrl : null))} target="_blank" rel="noreferrer" className="text-xs font-bold bg-indigo-200 text-slate-900 px-3 py-1 rounded border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#0f172a] transition-all uppercase">Lihat Dokumen</a>
                      )}
                    </div>
                    <input type="file" name="file_uji_admin" accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. BA VERLAP */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${doc.nomor_ba_verlap || fisik.urlBaVerlap ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                <div className="mt-1">{doc.nomor_ba_verlap ? <CheckCircle2 size={24} className="text-slate-900" /> : <XCircle size={24} className="text-slate-400" />}</div>
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">4. BA Verlap</p>
                  <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">{doc.nomor_ba_verlap || 'Belum terbit'}</p>
                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-slate-900 font-black uppercase">Upload Arsip Scan Verlap (PDF)</label>
                      {fisik.urlBaVerlap && (
                        <a href={fisik.urlBaVerlap} target="_blank" rel="noreferrer" className="text-xs font-bold bg-indigo-200 text-slate-900 px-3 py-1 rounded border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#0f172a] transition-all uppercase">Lihat Dokumen</a>
                      )}
                    </div>
                    <input type="file" name="file_ba_verlap" accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. BA PEMERIKSAAN SIDANG */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${doc.nomor_ba_pemeriksaan || fisik.urlBaSidang ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                <div className="mt-1">{doc.nomor_ba_pemeriksaan ? <CheckCircle2 size={24} className="text-slate-900" /> : <XCircle size={24} className="text-slate-400" />}</div>
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">5. BA Pemeriksa/Sidang</p>
                  <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">{doc.nomor_ba_pemeriksaan || 'Belum terbit'}</p>
                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-slate-900 font-black uppercase">Upload Arsip Scan Sidang (PDF)</label>
                      {fisik.urlBaSidang && (
                        <a href={fisik.urlBaSidang} target="_blank" rel="noreferrer" className="text-xs font-bold bg-indigo-200 text-slate-900 px-3 py-1 rounded border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#0f172a] transition-all uppercase">Lihat Dokumen</a>
                      )}
                    </div>
                    <input type="file" name="file_ba_sidang" accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

                        {/* 6. BA PEMERIKSAAN REVISI */}
            {revisiList.length > 0 ? revisiList.map((rev, idx) => (
              <div key={rev.key} className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${fisik['urlRevisi' + rev.key] ? 'bg-emerald-200' : 'bg-slate-50'}`}>
                <div className="flex items-start gap-3 w-full">
                  <div className="mt-1"><CheckCircle2 size={24} className="text-slate-900" /></div>
                  <div className="w-full">
                    <p className="text-sm font-black uppercase tracking-wider text-slate-900">6.{String.fromCharCode(97 + idx)} {rev.title}</p>
                    <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">{rev.nomor}</p>
                    <div className="mt-4 pt-4 border-t-2 border-slate-900">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-slate-900 font-black uppercase">Upload Arsip (PDF)</label>
                        {fisik['urlRevisi' + rev.key] && (
                          <a href={fisik['urlRevisi' + rev.key]} target="_blank" rel="noreferrer" className="text-xs font-bold bg-indigo-200 text-slate-900 px-3 py-1 rounded border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#0f172a] transition-all uppercase">Lihat Dokumen</a>
                        )}
                      </div>
                      <input type="file" name={`file_revisi${rev.key}`} accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors bg-slate-50">
                <div className="flex items-start gap-3 w-full">
                  <div className="mt-1"><XCircle size={24} className="text-slate-400" /></div>
                  <div className="w-full">
                    <p className="text-sm font-black uppercase tracking-wider text-slate-900">6. BA Pemeriksaan Revisi</p>
                    <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">Belum terbit</p>
                  </div>
                </div>
              </div>
            )}

            {/* 7. SURAT PERMOHONAN */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${fisik.suratPermohonan || fisik.urlSuratPermohonan ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                <input type="checkbox" name="suratPermohonan" value="1" defaultChecked={fisik.suratPermohonan} className="mt-1 w-6 h-6 text-emerald-500 bg-white border-2 border-slate-900 rounded focus:ring-emerald-500 cursor-pointer shadow-[2px_2px_0_0_#0f172a]" />
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">7. Surat Permohonan (Awal)</p>
                  <input type="text" name="noSuratPermohonan" defaultValue={fisik.noSuratPermohonan} placeholder="Input letak arsip..." className="mt-3 w-full p-3 bg-white border-2 border-slate-900 rounded-xl text-sm text-slate-900 font-bold outline-none focus:shadow-[4px_4px_0_0_#0f172a] transition-all" />
                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-slate-900 font-black uppercase">Upload Scan Permohonan (PDF)</label>
                      {fisik.urlSuratPermohonan && (
                        <a href={fisik.urlSuratPermohonan} target="_blank" rel="noreferrer" className="text-xs font-bold bg-indigo-200 text-slate-900 px-3 py-1 rounded border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#0f172a] transition-all uppercase">Lihat Dokumen</a>
                      )}
                    </div>
                    <input type="file" name="file_surat_permohonan" accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            {/* 8. LEMBAR REGISTRASI */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${doc.nomor_checklist || fisik.urlRegistrasi ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                <div className="mt-1">{doc.nomor_checklist ? <CheckCircle2 size={24} className="text-slate-900" /> : <XCircle size={24} className="text-slate-400" />}</div>
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">8. Lembar Registrasi</p>
                  <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">{doc.nomor_checklist || 'Belum ada nomor'}</p>
                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-slate-900 font-black uppercase">Upload Arsip Registrasi (PDF)</label>
                      {fisik.urlRegistrasi && (
                        <a href={fisik.urlRegistrasi} target="_blank" rel="noreferrer" className="text-xs font-bold bg-indigo-200 text-slate-900 px-3 py-1 rounded border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#0f172a] transition-all uppercase">Lihat Dokumen</a>
                      )}
                    </div>
                    <input type="file" name="file_registrasi" accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            {/* 9. LEMBAR PENGEMBALIAN */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${doc.tanggal_pengembalian || fisik.urlPengembalian ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                <div className="mt-1">{doc.tanggal_pengembalian ? <CheckCircle2 size={24} className="text-slate-900" /> : <XCircle size={24} className="text-slate-400" />}</div>
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">9. Lembar Pengembalian</p>
                  <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">{doc.tanggal_pengembalian || 'Tidak/Belum ada'}</p>
                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-slate-900 font-black uppercase">Upload Arsip Pengembalian (PDF)</label>
                      {fisik.urlPengembalian && (
                        <a href={fisik.urlPengembalian} target="_blank" rel="noreferrer" className="text-xs font-bold bg-indigo-200 text-slate-900 px-3 py-1 rounded border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#0f172a] transition-all uppercase">Lihat Dokumen</a>
                      )}
                    </div>
                    <input type="file" name="file_pengembalian" accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

                        {/* 10. PHP */}
            {phpList.length > 0 ? phpList.map((php, idx) => (
              <div key={php.key} className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${fisik['urlPhp' + php.key] ? 'bg-emerald-200' : 'bg-slate-50'}`}>
                <div className="flex items-start gap-3 w-full">
                  <div className="mt-1"><CheckCircle2 size={24} className="text-slate-900" /></div>
                  <div className="w-full">
                    <p className="text-sm font-black uppercase tracking-wider text-slate-900">10.{String.fromCharCode(97 + idx)} {php.title}</p>
                    <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">{php.nomor}</p>
                    <div className="mt-4 pt-4 border-t-2 border-slate-900">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-slate-900 font-black uppercase">Upload Arsip (PDF)</label>
                        {fisik['urlPhp' + php.key] && (
                          <a href={fisik['urlPhp' + php.key]} target="_blank" rel="noreferrer" className="text-xs font-bold bg-indigo-200 text-slate-900 px-3 py-1 rounded border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#0f172a] transition-all uppercase">Lihat Dokumen</a>
                        )}
                      </div>
                      <input type="file" name={`file_php${php.key}`} accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors bg-slate-50">
                <div className="flex items-start gap-3 w-full">
                  <div className="mt-1"><XCircle size={24} className="text-slate-400" /></div>
                  <div className="w-full">
                    <p className="text-sm font-black uppercase tracking-wider text-slate-900">10. Penerimaan Perbaikan / PHP</p>
                    <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">Belum terbit</p>
                  </div>
                </div>
              </div>
            )}

            {/* 11. UNDANGAN SIDANG */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${fisik.undanganSidang || fisik.urlUndanganSidang ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                <input type="checkbox" name="undanganSidang" value="1" defaultChecked={fisik.undanganSidang} className="mt-1 w-6 h-6 text-emerald-500 bg-white border-2 border-slate-900 rounded focus:ring-emerald-500 cursor-pointer shadow-[2px_2px_0_0_#0f172a]" />
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">11. Undangan Sidang</p>
                  <input type="text" name="noUndanganSidang" defaultValue={fisik.noUndanganSidang} placeholder="Input nomor surat..." className="mt-3 w-full p-3 bg-white border-2 border-slate-900 rounded-xl text-sm text-slate-900 font-bold outline-none focus:shadow-[4px_4px_0_0_#0f172a] transition-all" />
                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-slate-900 font-black uppercase">Upload Scan Undangan (PDF)</label>
                      {fisik.urlUndanganSidang && (
                        <a href={fisik.urlUndanganSidang} target="_blank" rel="noreferrer" className="text-xs font-bold bg-indigo-200 text-slate-900 px-3 py-1 rounded border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#0f172a] transition-all uppercase">Lihat Dokumen</a>
                      )}
                    </div>
                    <input type="file" name="file_undangan_sidang" accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            {/* 12. RPD */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${doc.nomor_risalah || fisik.rpdArsip || fisik.urlRpd ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                {doc.jenis_dokumen === 'SPPL' ? (
                  <input type="checkbox" name="rpdArsip" value="1" defaultChecked={fisik.rpdArsip} className="mt-1 w-6 h-6 text-emerald-500 bg-white border-2 border-slate-900 rounded focus:ring-emerald-500 cursor-pointer shadow-[2px_2px_0_0_#0f172a]" />
                ) : (
                  <div className="mt-1">{doc.nomor_risalah ? <CheckCircle2 size={24} className="text-slate-900" /> : <XCircle size={24} className="text-slate-400" />}</div>
                )}
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">12. {doc.jenis_dokumen === 'SPPL' ? 'Pengesahan SPPL' : 'Penyusunan RPD'}</p>
                  
                  {doc.jenis_dokumen === 'SPPL' ? (
                    <input type="text" name="noRpdArsip" defaultValue={fisik.noRpdArsip} placeholder="Input nomor surat pengesahan..." className="mt-3 w-full p-3 bg-white border-2 border-slate-900 rounded-xl text-sm text-slate-900 font-bold outline-none focus:shadow-[4px_4px_0_0_#0f172a] transition-all" />
                  ) : (
                    <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">{doc.nomor_risalah || 'Belum terbit'}</p>
                  )}

                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-slate-900 font-black uppercase">Upload Arsip {doc.jenis_dokumen === 'SPPL' ? 'Pengesahan (PDF)' : 'RPD (PDF)'}</label>
                      {fisik.urlRpd && (
                        <a href={fisik.urlRpd} target="_blank" rel="noreferrer" className="text-xs font-bold bg-indigo-200 text-slate-900 px-3 py-1 rounded border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#0f172a] transition-all uppercase">Lihat Dokumen</a>
                      )}
                    </div>
                    <input type="file" name="file_rpd" accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* LOKASI ARSIP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="p-6 bg-slate-100 border-4 border-slate-900 rounded-2xl shadow-[4px_4px_0_0_#0f172a]">
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">Lokasi Arsip / Lemari</label>
              <p className="text-xs font-bold text-slate-600 mb-4 uppercase">Letak fisik dokumen disimpan.</p>
              <input type="text" name="lokasi_arsip" defaultValue={fisik.lokasiArsip || ''} placeholder="Contoh: Lemari A, Rak 3"
                className="w-full bg-white border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl p-3 focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
            </div>

            {/* KOORDINAT PETA */}
            <div className="p-6 bg-amber-100 border-4 border-slate-900 rounded-2xl shadow-[4px_4px_0_0_#0f172a]">
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">Titik Koordinat (Peta)</label>
              <p className="text-xs font-bold text-slate-700 mb-4 uppercase">Untuk kemudahan tim pengawasan.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-900 uppercase">Latitude</label>
                  <input type="text" name="latitude" defaultValue={doc.latitude || ''} placeholder="-7.4245"
                    className="w-full bg-white border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl p-3 focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none mt-1" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-900 uppercase">Longitude</label>
                  <input type="text" name="longitude" defaultValue={doc.longitude || ''} placeholder="111.0234"
                    className="w-full bg-white border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl p-3 focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none mt-1" />
                </div>
              </div>
            </div>
          </div>
  
          {/* TOMBOL AKSI */}
          <div className="pt-8 border-t-4 border-slate-900 flex flex-col sm:flex-row justify-end gap-4 mt-8">
            <button type="submit" name="action" value="draft" disabled={submitting} className="w-full sm:w-auto px-6 py-4 bg-amber-300 hover:bg-amber-400 text-slate-900 border-4 border-slate-900 font-black rounded-xl text-sm shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0">
              {submitting ? <LottieLoader size={24} /> : <Save size={18} />} Simpan Sementara (Belum Selesai)
            </button>
            <button type="submit" name="action" value="final" disabled={submitting} className="w-full sm:w-auto px-6 py-4 bg-emerald-400 hover:bg-emerald-300 text-slate-900 border-4 border-slate-900 font-black rounded-xl text-sm shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0">
              {submitting ? <LottieLoader size={24} /> : <CheckCircle2 size={18} />} Finalisasi & Arsipkan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
