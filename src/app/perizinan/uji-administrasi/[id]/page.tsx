'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ClipboardCheck, Send, Loader2, ListChecks, PenTool } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function UjiAdministrasiPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isAmdalnet, setIsAmdalnet] = useState(false);

  const [daftarPegawai, setDaftarPegawai] = useState<any[]>([]);

  // State for Arsip Uploads
  const [fileSuratPermohonan, setFileSuratPermohonan] = useState<File | null>(null);
  const [fileTandaTerima, setFileTandaTerima] = useState<File | null>(null);
  const [fileFormulirUji, setFileFormulirUji] = useState<File | null>(null);
  const [isUploadingArsip, setIsUploadingArsip] = useState(false);

  const checklistItems = [
    "Surat Permohonan Pemeriksaan Dokumen UKL-UPL / SPPL*", 
    "Pernyataan Pengelolaan dan Pemantauan Lingkungan (Bermaterai)*",
    "Dokumen Lingkungan*", 
    "Peta Tapak Proyek", 
    "Peta Pemantauan dan Pengelolaan",
    "Peta Siteplan di A3", 
    "PKKPR",
    "NIB (Untuk Swasta atau Perorangan)", 
    "Fotocopy Status Lahan (Sertifikat)", 
    "Fotocopy KTP Penanggungjawab Kegiatan",
    "Foto Eksisting Lokasi Rencana Kegiatan Disertai dengan Titik Koordinat", 
    "Lembar Penapisan dari AMDALNET / Arahan dari Instansi Lingkungan Hidup",
    "Surat Kuasa Pekerjaan dari Pemrakarsa ke Konsultan (Bermaterai)", 
    "Perizinan yang Sudah Dimiliki atau Izin yang Lama (Jika Ada)",
    "Pemenuhan Persetujuan Teknis Air Limbah", 
    "Pemenuhan Rincian Teknis Limbah B3 Sementara", 
    "Pemenuhan Persetujuan Teknis Emisi", 
    "Pemenuhan Persetujuan Teknis Andalalin", 
    "Hasil Penapisan Kewajiban Pemenuhan Persetujuan Teknis", 
    "Bukti Upload Permohonan pada AMDALNET dan/atau SIDARLING"
  ];

  useEffect(() => {
    Promise.all([
      fetch(`/api/perizinan/${unwrappedParams.id}`).then(res => res.json()),
      fetch('/api/tim-penilai').then(res => res.json())
    ]).then(([docRes, pegawaiRes]) => {
      setDoc(docRes.data);
      const sortedPegawai = (pegawaiRes.data || []).sort((a: any, b: any) => (a.urutan_hierarki || 0) - (b.urutan_hierarki || 0));
      setDaftarPegawai(sortedPegawai);
      setLoading(false);
    });
  }, [unwrappedParams.id]);

  const handleUploadArsip = async () => {
    if (!fileSuratPermohonan && !fileTandaTerima && !fileFormulirUji) {
      alert('Pilih setidaknya satu file untuk di-upload.');
      return;
    }

    setIsUploadingArsip(true);
    setMessage('Mengunggah dokumen arsip HUA...');

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

      const urlSuratPermohonan = await uploadFile(fileSuratPermohonan);
      const urlRegistrasi = await uploadFile(fileTandaTerima);
      const urlUjiAdmin = await uploadFile(fileFormulirUji);

      let updatedArsipFisik = {};
      try { if (doc.arsip_fisik) updatedArsipFisik = typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc.arsip_fisik; } catch(e) {}
      
      if (urlSuratPermohonan) updatedArsipFisik = { ...updatedArsipFisik, urlSuratPermohonan };
      if (urlRegistrasi) updatedArsipFisik = { ...updatedArsipFisik, urlRegistrasi };
      if (urlUjiAdmin) updatedArsipFisik = { ...updatedArsipFisik, urlUjiAdmin };

      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arsip_fisik: updatedArsipFisik })
      });

      if (res.ok) {
        alert('Dokumen berhasil di-upload dan tersimpan di Arsip Perizinan!');
        setFileSuratPermohonan(null);
        setFileTandaTerima(null);
        setFileFormulirUji(null);
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
    
    let ekstra: any = {};
    try { if (doc.penandatangan_hua) ekstra = typeof doc.penandatangan_hua === 'string' ? JSON.parse(doc.penandatangan_hua) : doc.penandatangan_hua; } catch(e) {}

    let payload: any = {
      status_tahapan: 'Uji Administrasi Selesai',
    };

    if (isAmdalnet) {
      const file = formData.get('file_amdalnet') as File;
      let amdalnetUrl = null;
      if (file && file.size > 0) {
        try {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('folderName', doc.nama_kegiatan || doc.nama_pemrakarsa || 'Arsip Tanpa Nama');
          const uploadRes = await fetch('/api/perizinan/upload', { method: 'POST', body: fd });
          const uploadData = await uploadRes.json();
          if (uploadData.url) amdalnetUrl = uploadData.url;
        } catch (err) {
          console.error('Upload failed', err);
        }
      }

      payload.tanggal_uji_berkas = new Date().toISOString().split('T')[0];
      payload.keterangan = 'Lolos Uji Administrasi via Amdalnet';
      payload.penandatangan_hua = { ...ekstra, is_amdalnet: true, file_amdalnet_url: amdalnetUrl };
    } else {
      const keberadaan = checklistItems.map((_, i) => formData.get(`keberadaan[${i}]`) || '');
      const kesesuaian = checklistItems.map((_, i) => formData.get(`kesesuaian[${i}]`) || '');
      const keterangan_uji = checklistItems.map((_, i) => formData.get(`keterangan_uji[${i}]`) || '');
      
      const penandatangan = formData.getAll('penandatangan[]');

      const updatedEkstra = {
        ...ekstra,
        kewenangan: formData.get('kewenangan'),
        kbli: formData.get('kbli'),
        hasil_verifikasi_uji: formData.get('hasil_verifikasi_uji'),
        keberadaan,
        kesesuaian,
        keterangan_uji
      };

      const jenisAcronym = ({
  'SPPL': 'SPPL', 'UKLUPL': 'UKLUPL', 'UKL-UPL': 'UKLUPL',
  'Rincian Teknis dan Intergrasi Rincian Teknis Limbah B3 ke Persetujuan Lingkungan': 'RT.INT.LB3',
  'Permohonan Perubahan Dokumen Lingkungan': 'PDL',
  'Permohonan Perubahan Lingkungan': 'PPL',
  'RINTEK LB3': 'RT.LB3', 'PERTEK AIR LIMBAH': 'ST.AL', 'PERTEK EMISI': 'ST.EM',
  'KAJIAN TEKNIS AIR LIMBAH': 'KT.AL', 'KAJIAN TEKNIS EMISI': 'KT.EM',
  'KT AL': 'KT.AL', 'KT EM': 'KT.EM', 'SLO': 'SLO', 'DPLH': 'DPLH', 
  'DELH': 'DELH', 'AMDAL': 'AMDAL'
} as Record<string, string>)[doc.jenis_dokumen as string] || doc.jenis_dokumen;
      const noUrutPadded = String(doc.no_urut || doc.id).padStart(3, '0');
      const bulan = new Date().getMonth() + 1;
      const tahun = new Date().getFullYear();
      const nomorUji = `600.4.5/${noUrutPadded}.${bulan}/17/BA.HUA.${jenisAcronym}/${tahun}`;

      payload.nomor_uji_berkas = nomorUji;
      payload.tanggal_uji_berkas = formData.get('tanggal_uji_berkas');
      payload.keterangan = formData.get('catatan_uji_admin');
      payload.penandatangan_uji_admin = JSON.stringify(penandatangan);
      payload.penandatangan_hua = updatedEkstra;
    }

    try {
      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if(res.ok) {
        if (!isAmdalnet) {
          setMessage('Menyiapkan Dokumen BA HUA (Mohon Tunggu)...');
          
          try {
            const downloadUrl = `/api/generate?stage=uji-administrasi&type=template_ba_uji_admin&id=${unwrappedParams.id}`;
            const fileRes = await fetch(downloadUrl);
            
            if (fileRes.ok) {
              const blob = await fileRes.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `BA_UJI_ADMIN_${unwrappedParams.id}.docx`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            } else {
              console.error('Gagal generate dokumen BA HUA');
            }
          } catch (downloadErr) {
            console.error('Error saat download otomatis:', downloadErr);
          }
        }

        setMessage('Uji Administrasi Berhasil Disimpan!');
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
    <div className="max-w-6xl mx-auto py-8 space-y-8 pb-20">
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
        <div className="w-14 h-14 rounded-xl bg-teal-400 border border-outline-variant flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
          <ClipboardCheck size={28} className="text-on-surface" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface uppercase">Input Uji Administrasi</h2>
          <p className="text-sm font-bold text-on-surface-variant mt-1 uppercase">TAHUN {doc.tahun || '2026'} | TAHAP 2: BA HUA</p>
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
            <p className="font-bold bg-teal-300 text-on-surface px-3 py-1 rounded border border-outline-variant inline-block mt-1 text-sm shadow-sm hover:shadow-md transition-shadow">
              #{String(doc.no_urut || doc.id).padStart(3, '0')} / {doc.tahun || '2026'}
            </p>
          </div>
        </div>

        {/* Upload Arsip Fisik Awal (Isolated from main form) */}
        <div className="mb-8 p-6 rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50">
          <h3 className="text-sm font-bold text-teal-800 mb-4 uppercase flex items-center gap-2">
            <ClipboardCheck size={18} /> Upload Berkas Digital (Dicicil)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Surat Permohonan */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-teal-900 uppercase">1. Surat Permohonan</label>
              {(() => {
                let url = '';
                try { url = (doc?.arsip_fisik && typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc?.arsip_fisik)?.urlSuratPermohonan; } catch(e) {}
                if (url) return <a href={url} target="_blank" className="inline-block bg-teal-200 text-teal-800 text-xs font-bold px-3 py-2 rounded-lg border border-teal-300">✅ Sudah Diupload</a>;
                return (
                  <input type="file" accept=".pdf" onChange={(e) => setFileSuratPermohonan(e.target.files?.[0] || null)} className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-teal-200 file:text-teal-800 file:font-bold hover:file:bg-teal-300 cursor-pointer bg-white border border-teal-200 rounded-lg" />
                );
              })()}
            </div>
            
            {/* Tanda Terima / Register */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-teal-900 uppercase">2. Tanda Terima Register</label>
              {(() => {
                let url = '';
                try { url = (doc?.arsip_fisik && typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc?.arsip_fisik)?.urlRegistrasi; } catch(e) {}
                if (url) return <a href={url} target="_blank" className="inline-block bg-teal-200 text-teal-800 text-xs font-bold px-3 py-2 rounded-lg border border-teal-300">✅ Sudah Diupload</a>;
                return (
                  <input type="file" accept=".pdf" onChange={(e) => setFileTandaTerima(e.target.files?.[0] || null)} className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-teal-200 file:text-teal-800 file:font-bold hover:file:bg-teal-300 cursor-pointer bg-white border border-teal-200 rounded-lg" />
                );
              })()}
            </div>
            
            {/* Formulir Uji Admin */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-teal-900 uppercase">3. Formulir Uji Admin</label>
              {(() => {
                let url = '';
                try { url = (doc?.arsip_fisik && typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc?.arsip_fisik)?.urlUjiAdmin; } catch(e) {}
                if (url) return <a href={url} target="_blank" className="inline-block bg-teal-200 text-teal-800 text-xs font-bold px-3 py-2 rounded-lg border border-teal-300">✅ Sudah Diupload</a>;
                return (
                  <input type="file" accept=".pdf" onChange={(e) => setFileFormulirUji(e.target.files?.[0] || null)} className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-teal-200 file:text-teal-800 file:font-bold hover:file:bg-teal-300 cursor-pointer bg-white border border-teal-200 rounded-lg" />
                );
              })()}
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={handleUploadArsip}
            disabled={isUploadingArsip || (!fileSuratPermohonan && !fileTandaTerima && !fileFormulirUji)}
            className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl shadow border border-teal-600 transition-all text-xs uppercase disabled:opacity-50"
          >
            {isUploadingArsip ? 'Mengunggah...' : 'Simpan Berkas ke Arsip'}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Opsi Amdalnet */}
          <div className="mb-6 p-4 rounded-xl border border-outline-variant bg-secondary-container text-on-secondary-container shadow-sm hover:shadow-md transition-shadow">
             <label className="flex items-center gap-3 cursor-pointer">
               <input type="checkbox" checked={isAmdalnet} onChange={(e) => setIsAmdalnet(e.target.checked)} className="w-6 h-6 border border-outline-variant rounded bg-surface text-secondary shadow-sm hover:shadow-md transition-shadow focus:ring-emerald-500" />
               <span className="font-bold text-on-surface uppercase">Sudah melalui AMDALNET (Lewati Uji Administrasi Manual)</span>
             </label>
             {isAmdalnet && (
               <div className="mt-4 pt-4 border-t border-outline-variant">
                 <label className="block text-sm font-bold text-on-surface mb-2 uppercase">Upload Dokumen Hasil Uji Administrasi (PDF)</label>
                 <input type="file" name="file_amdalnet" accept=".pdf" className="w-full text-xs text-on-surface font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-outline-variant file:text-xs file:font-bold file:bg-surface file:text-on-surface hover:file:bg-surface-container-low file:shadow-sm hover:shadow-md transition-shadow file:transition-all cursor-pointer bg-emerald-200 border border-outline-variant rounded-xl p-2 shadow-sm hover:shadow-md transition-shadow" />
               </div>
             )}
          </div>

          {!isAmdalnet && (
            <>
          {/* Tanggal */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-on-surface mb-2 uppercase">Tanggal BA Uji Administrasi <span className="text-error">*</span></label>
            <input type="date" name="tanggal_uji_berkas" required defaultValue={doc.tanggal_uji_berkas || new Date().toISOString().split('T')[0]}
              className="w-full sm:w-1/3 bg-surface-container-lowest border border-outline-variant text-on-surface font-bold text-sm rounded-xl px-4 py-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none cursor-pointer" />
          </div>

          {/* Checklist Uji NeoBrutalism */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-on-surface mb-4 uppercase flex items-center gap-2 bg-teal-200 inline-block px-4 py-2 rounded-lg border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
              <ListChecks size={18} /> Hasil Verifikasi Kelengkapan Administrasi
            </h3>
            <div className="overflow-x-auto rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow bg-surface">
              <table className="w-full text-xs text-left text-on-surface border-collapse">
                <thead className="bg-surface-container text-on-surface font-bold border-b-4 border-outline-variant">
                  <tr>
                    <th rowSpan={2} className="px-3 py-4 text-center border-r border-outline-variant w-10 uppercase">NO</th>
                    <th rowSpan={2} className="px-3 py-4 border-r border-outline-variant uppercase">KELENGKAPAN ADMINISTRASI</th>
                    <th colSpan={2} className="px-3 py-3 text-center border-r border-outline-variant uppercase bg-secondary-container text-on-secondary-container">KEBERADAAN</th>
                    <th colSpan={2} className="px-3 py-3 text-center border-r border-outline-variant uppercase bg-blue-100">KESESUAIAN</th>
                    <th rowSpan={2} className="px-3 py-4 text-center uppercase">KETERANGAN</th>
                  </tr>
                  <tr className="border-t border-outline-variant text-[10px] bg-surface-container-low uppercase">
                    <th className="px-2 py-2 text-center border-r border-outline-variant text-emerald-700 bg-emerald-200">Ada</th>
                    <th className="px-2 py-2 text-center border-r border-outline-variant text-rose-700 bg-rose-200">Tdk Ada</th>
                    <th className="px-2 py-2 text-center border-r border-outline-variant text-blue-700 bg-blue-200">Sesuai</th>
                    <th className="px-2 py-2 text-center border-r border-outline-variant text-rose-700 bg-rose-200">Tdk Sesuai</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-900 font-bold">
                  {checklistItems.map((item, index) => (
                    <tr key={index} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-3 py-3 text-center border-r border-outline-variant bg-surface-container-low">{index + 1}</td>
                      <td className="px-3 py-3 border-r border-outline-variant">{item}</td>
                      <td className="px-2 py-3 text-center border-r border-outline-variant bg-secondary-container">
                        <input type="radio" name={`keberadaan[${index}]`} value="Ada" required className="w-5 h-5 text-secondary border border-outline-variant focus:ring-emerald-500 shadow-sm hover:shadow-md transition-shadow cursor-pointer" />
                      </td>
                      <td className="px-2 py-3 text-center border-r border-outline-variant bg-error-container">
                        <input type="radio" name={`keberadaan[${index}]`} value="Tidak Ada" className="w-5 h-5 text-error border border-outline-variant focus:ring-rose-500 shadow-sm hover:shadow-md transition-shadow cursor-pointer" />
                      </td>
                      <td className="px-2 py-3 text-center border-r border-outline-variant bg-blue-50">
                        <input type="radio" name={`kesesuaian[${index}]`} value="Sesuai" required className="w-5 h-5 text-blue-500 border border-outline-variant focus:ring-blue-500 shadow-sm hover:shadow-md transition-shadow cursor-pointer" />
                      </td>
                      <td className="px-2 py-3 text-center border-r border-outline-variant bg-error-container">
                        <input type="radio" name={`kesesuaian[${index}]`} value="Tidak Sesuai" className="w-5 h-5 text-error border border-outline-variant focus:ring-rose-500 shadow-sm hover:shadow-md transition-shadow cursor-pointer" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="text" name={`keterangan_uji[${index}]`} placeholder="..." className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-xs focus:bg-surface-container-lowest outline-none shadow-sm hover:shadow-md transition-shadow" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data Tambahan BA HUA */}
          <div className="mb-8 p-6 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-sm font-bold text-on-surface mb-6 uppercase flex items-center gap-2">
              <PenTool size={18} /> Data Tambahan BA HUA
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-2 uppercase">Kewenangan</label>
                <input 
                  type="text" 
                  name="kewenangan" 
                  defaultValue={(() => { try { return (typeof doc.penandatangan_hua === 'string' ? JSON.parse(doc.penandatangan_hua) : doc.penandatangan_hua)?.kewenangan || 'Kabupaten'; } catch(e) { return 'Kabupaten'; }})()}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm focus:bg-surface-container-lowest outline-none shadow-sm hover:shadow-md transition-shadow font-bold" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface mb-2 uppercase">KBLI</label>
                <input 
                  type="text" 
                  name="kbli" 
                  placeholder="Contoh: 86105 (Aktivitas Klinik Swasta)"
                  defaultValue={(() => { try { return (typeof doc.penandatangan_hua === 'string' ? JSON.parse(doc.penandatangan_hua) : doc.penandatangan_hua)?.kbli || ''; } catch(e) { return ''; }})()}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm focus:bg-surface-container-lowest outline-none shadow-sm hover:shadow-md transition-shadow font-bold" 
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-on-surface mb-2 uppercase">Hasil Verifikasi Uji Administrasi</label>
              <select 
                name="hasil_verifikasi_uji" 
                defaultValue={(() => { try { return (typeof doc.penandatangan_hua === 'string' ? JSON.parse(doc.penandatangan_hua) : doc.penandatangan_hua)?.hasil_verifikasi_uji || ''; } catch(e) { return ''; }})()}
                className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm focus:bg-surface-container-lowest outline-none shadow-sm hover:shadow-md transition-shadow font-bold cursor-pointer appearance-none" 
              >
                <option value="" disabled>-- Pilih Hasil Verifikasi --</option>
                <option value="Diterima (Lengkap dan Dilanjutkan)">Diterima (Lengkap dan Dilanjutkan)</option>
                <option value="Dikembalikan untuk Diperbaiki">Dikembalikan untuk Diperbaiki</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-2 uppercase">Catatan untuk Pemrakarsa / Konsultan</label>
              <textarea 
                name="catatan_uji_admin" 
                rows={4}
                placeholder={"1. Judul Peta dirubah...\n2. Titik koordinat ditambahkan..."}
                defaultValue={doc.keterangan || ''}
                className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm focus:bg-surface-container-lowest outline-none shadow-sm hover:shadow-md transition-shadow font-bold resize-y" 
              ></textarea>
              <p className="text-[10px] font-bold text-on-surface-variant mt-2 uppercase">* Ketik menurun dengan angka untuk membuatnya menjadi list (1. ..., 2. ...)</p>
            </div>
          </div>

          {/* Tim Pemeriksa */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-on-surface mb-4 uppercase flex items-center gap-2 bg-indigo-200 inline-block px-4 py-2 rounded-lg border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
              <PenTool size={18} /> Tim Pemeriksa (BA HUA)
            </h3>
            <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow max-h-60 overflow-y-auto">
              {daftarPegawai.length === 0 ? (
                <p className="text-sm font-bold text-on-surface-variant">Belum ada data pegawai.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {daftarPegawai.map((pegawai) => {
                    let isChecked = false;
                    try {
                      if (doc.penandatangan_uji_admin) {
                        const parsed = JSON.parse(doc.penandatangan_uji_admin);
                        if (parsed.includes(pegawai.id.toString())) isChecked = true;
                      }
                    } catch(e) {}
                    
                    return (
                      <label key={pegawai.id} className="flex items-start gap-3 p-3 border-2 border-outline-variant rounded-lg hover:border-indigo-400 hover:bg-primary-container cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          name="penandatangan[]" 
                          value={pegawai.id}
                          defaultChecked={isChecked}
                          className="mt-1 w-5 h-5 text-indigo-500 border border-outline-variant rounded focus:ring-indigo-500 shadow-sm hover:shadow-md transition-shadow" 
                        />
                        <div>
                          <p className="text-sm font-bold text-on-surface uppercase leading-tight">{pegawai.nama}</p>
                          <p className="text-xs font-bold text-on-surface-variant mt-0.5">{pegawai.jabatan || 'Staf'}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          </>
          )}

          <div className="flex justify-end pt-8 border-t border-outline-variant mt-8">
            <button type="submit" disabled={submitting} className="w-full sm:w-auto px-10 py-4 bg-teal-400 hover:bg-teal-300 text-on-surface font-bold rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center justify-center gap-2 tracking-widest uppercase text-sm disabled:opacity-70 disabled:hover:translate-y-0">
              {submitting ? <LottieLoader size={24} /> : <Send size={18} />}
              Simpan BA HUA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
