'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, AlertTriangle, Upload, User, MapPin, FileText } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function BuatAgendaPengaduanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fileDokumentasi, setFileDokumentasi] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    const perihal = formData.get('perihal') as string;
    const tanggal = formData.get('tanggal') as string;
    const nama_pelapor = formData.get('nama_pelapor') as string;
    const telp_pelapor = formData.get('telp_pelapor') as string;
    const nama_terlapor = formData.get('nama_terlapor') as string;
    const lokasi_aduan = formData.get('lokasi_aduan') as string;
    const deskripsi = formData.get('deskripsi') as string;

    let dokumentasi_url = '';

    try {
      // 1. Upload Dokumentasi if exists
      if (fileDokumentasi) {
        const uploadData = new FormData();
        uploadData.append('file', fileDokumentasi);
        uploadData.append('folderName', perihal || 'ADUAN-BARU');
        
        const uploadRes = await fetch('/api/pengaduan/upload', {
          method: 'POST',
          body: uploadData
        });
        const uploadResult = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadResult.error || 'Gagal mengunggah file Dokumentasi');
        dokumentasi_url = uploadResult.url;
      }

      // 2. Submit Data
      const payload = {
        perihal,
        tanggal,
        nama_pelapor,
        telp_pelapor,
        nama_terlapor,
        lokasi_aduan,
        deskripsi,
        dokumentasi_url,
        status_tahapan: 'Form Terisi'
      };

      const res = await fetch('/api/pengaduan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Gagal membuat tiket pengaduan');
      }

      router.push('/pengaduan');
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 pb-20 px-4">
      
      <Link href="/pengaduan" className="inline-flex items-center gap-2 text-sm text-on-surface font-bold transition-all bg-surface border border-outline-variant px-4 py-2 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Daftar
      </Link>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm">
        <div className="w-14 h-14 rounded-xl bg-purple-400 border border-outline-variant flex items-center justify-center shrink-0">
          <AlertTriangle size={28} className="text-on-surface" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface uppercase">Catat Pengaduan</h2>
          <p className="text-sm font-bold text-on-surface-variant mt-1 uppercase">Isi formulir pengaduan secara lengkap</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-200 text-on-surface p-4 rounded-xl text-sm font-bold border border-outline-variant shadow-sm">
          {errorMsg}
        </div>
      )}

      <div className="bg-surface border border-outline-variant rounded-3xl p-6 md:p-10 shadow-sm space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* INFORMASI UMUM */}
          <div className="space-y-6">
            <h3 className="flex items-center gap-2 text-xl font-bold text-on-surface border-b-4 border-outline-variant pb-2 uppercase tracking-tight">
              A. Informasi Umum
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                  Perihal / Indikasi Kasus <span className="text-error">*</span>
                </label>
                <input type="text" name="perihal" required placeholder="Contoh: Aduan Pencemaran PT Maju Jaya..." 
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-bold rounded-xl px-4 py-4 focus:bg-surface focus:shadow-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                  Tanggal Pengaduan <span className="text-error">*</span>
                </label>
                <input type="date" name="tanggal" required defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-bold rounded-xl px-4 py-4 focus:bg-surface focus:shadow-sm outline-none cursor-pointer" />
              </div>
            </div>
          </div>

          {/* IDENTITAS PELAPOR */}
          <div className="space-y-6 pt-2">
            <h3 className="flex items-center gap-2 text-xl font-bold text-on-surface border-b-4 border-outline-variant pb-2 uppercase tracking-tight">
              <User size={24} className="text-purple-600" /> B. Identitas Pelapor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                  Nama Lengkap Pelapor <span className="text-error">*</span>
                </label>
                <input type="text" name="nama_pelapor" required 
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-bold rounded-xl px-4 py-4 focus:bg-surface focus:shadow-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                  No. Telepon / WhatsApp <span className="text-error">*</span>
                </label>
                <input type="tel" name="telp_pelapor" required 
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-bold rounded-xl px-4 py-4 focus:bg-surface focus:shadow-sm outline-none" />
              </div>
            </div>
          </div>

          {/* DETAIL KASUS */}
          <div className="space-y-6 pt-2">
            <h3 className="flex items-center gap-2 text-xl font-bold text-on-surface border-b-4 border-outline-variant pb-2 uppercase tracking-tight">
              <MapPin size={24} className="text-purple-600" /> C. Detail Kasus & Terlapor
            </h3>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                Nama Perusahaan / Pihak Terlapor <span className="text-error">*</span>
              </label>
              <input type="text" name="nama_terlapor" required 
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-bold rounded-xl px-4 py-4 focus:bg-surface focus:shadow-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                Lokasi Kejadian / Alamat Terlapor <span className="text-error">*</span>
              </label>
              <textarea name="lokasi_aduan" required rows={3} 
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-bold rounded-xl px-4 py-4 focus:bg-surface focus:shadow-sm outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                Deskripsi / Kronologi Kejadian <span className="text-error">*</span>
              </label>
              <textarea name="deskripsi" required rows={5} 
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-bold rounded-xl px-4 py-4 focus:bg-surface focus:shadow-sm outline-none resize-none" />
            </div>
          </div>

          {/* DOKUMENTASI */}
          <div className="space-y-6 pt-2">
            <h3 className="flex items-center gap-2 text-xl font-bold text-on-surface border-b-4 border-outline-variant pb-2 uppercase tracking-tight">
              <FileText size={24} className="text-purple-600" /> D. Bukti Lampiran
            </h3>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                Unggah File Dokumentasi / Bukti (PDF, Gambar)
              </label>
              <div className="relative overflow-hidden w-full bg-surface-container-lowest border-2 border-dashed border-outline-variant rounded-xl p-8 text-center hover:bg-surface-container-low transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 group">
                <input type="file" onChange={(e) => setFileDokumentasi(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <Upload size={32} className="text-slate-400 group-hover:text-on-surface transition-colors" />
                <div>
                  <p className="text-sm font-bold text-on-surface-variant">
                    {fileDokumentasi ? <span className="text-purple-600 font-bold">File Terpilih: {fileDokumentasi.name}</span> : 'Klik atau tarik file bukti/dokumentasi ke sini'}
                  </p>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Maks 10MB</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-10 flex justify-end">
            <button type="submit" disabled={loading} 
              className="w-full md:w-auto px-10 py-5 bg-primary text-on-primary hover:bg-primary-container font-bold rounded-xl border border-outline-variant shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-70 disabled:hover:translate-y-0">
              {loading ? <LottieLoader size={24} /> : <Save size={20} />}
              Simpan Pengaduan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
