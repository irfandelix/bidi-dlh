'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import { Loader2, Save, Upload, ShieldCheck, User, MapPin, FileText } from 'lucide-react';
import { use } from 'react';
import LottieLoader from '@/components/LottieLoader';

export default function IsiFormPengaduanPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [pengaduan, setPengaduan] = useState<any>(null);
  const [fileDokumentasi, setFileDokumentasi] = useState<File | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase
        .from('pengaduans')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error || !data) {
        setErrorMsg('Data tiket pengaduan tidak ditemukan.');
      } else {
        setPengaduan(data);
      }
      setLoading(false);
    }
    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData(e.currentTarget);
    const nama_pelapor = formData.get('nama_pelapor') as string;
    const telp_pelapor = formData.get('telp_pelapor') as string;
    const nama_terlapor = formData.get('nama_terlapor') as string;
    const lokasi_aduan = formData.get('lokasi_aduan') as string;
    const deskripsi = formData.get('deskripsi') as string;

    let dokumentasi_url = pengaduan?.dokumentasi_url || '';

    try {
      // 1. Upload Dokumentasi if exists
      if (fileDokumentasi) {
        const uploadData = new FormData();
        uploadData.append('file', fileDokumentasi);
        // Use 'perihal' for folder name
        uploadData.append('folderName', pengaduan.perihal || `ADUAN-${id}`);
        
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
        id,
        nama_pelapor,
        telp_pelapor,
        nama_terlapor,
        lokasi_aduan,
        deskripsi,
        dokumentasi_url,
      };

      const res = await fetch('/api/pengaduan/bap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Gagal menyimpan isian pengaduan');
      }

      setSuccessMsg('Terima kasih, form pengaduan Anda telah berhasil disubmit dan akan segera diproses.');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LottieLoader size={24} />
        <h2 className="text-xl font-black text-slate-900 uppercase">Memuat Form...</h2>
      </div>
    );
  }

  if (errorMsg && !pengaduan) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-rose-100 border-4 border-rose-900 p-8 rounded-3xl text-center shadow-[8px_8px_0_0_#881337]">
          <h2 className="text-2xl font-black text-rose-900 uppercase mb-4">Akses Ditolak</h2>
          <p className="font-bold text-rose-800">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 px-4 pb-20">
      
      {/* HEADER TIKET INFO */}
      <div className="bg-purple-900 text-white p-8 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldCheck size={120} />
        </div>
        <div className="relative z-10">
          <div className="inline-block bg-white text-purple-900 font-black px-4 py-1 rounded-full text-xs uppercase tracking-widest mb-4">
            FORMULIR ISIAN PELAPOR
          </div>
          <h1 className="text-3xl font-black uppercase mb-2">Formulir Pengaduan</h1>
          <p className="text-purple-200 font-bold max-w-xl">
            Silakan lengkapi formulir di bawah ini dengan data yang valid dan dapat dipertanggungjawabkan.
          </p>
          
          <div className="mt-6 bg-purple-950 p-6 rounded-2xl border-2 border-purple-800 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-purple-300 text-xs font-black uppercase tracking-widest">KODE TOKEN TIKET</p>
              <p className="text-2xl font-mono font-black text-white">{pengaduan.token}</p>
            </div>
            <div>
              <p className="text-purple-300 text-xs font-black uppercase tracking-widest">PERIHAL / INDIKASI KASUS</p>
              <p className="text-lg font-bold text-white leading-tight">{pengaduan.perihal}</p>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-200 text-slate-900 p-4 rounded-xl text-sm font-bold border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a]">
          {errorMsg}
        </div>
      )}

      {successMsg ? (
        <div className="bg-emerald-50 border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] rounded-3xl p-10 text-center space-y-6">
          <div className="w-24 h-24 bg-emerald-400 border-4 border-slate-900 rounded-full flex items-center justify-center mx-auto shadow-[4px_4px_0_0_#0f172a]">
            <ShieldCheck size={48} className="text-slate-900" />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase text-slate-900">{successMsg}</h3>
            <p className="text-base font-bold text-slate-600 mt-2">Data pengaduan Anda beserta lampiran dokumentasi telah diamankan di dalam sistem Dinas Lingkungan Hidup.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border-4 border-slate-900 rounded-3xl p-6 md:p-10 shadow-[8px_8px_0_0_#0f172a] space-y-8">
          
          {/* IDENTITAS PELAPOR */}
          <div className="space-y-6">
            <h3 className="flex items-center gap-2 text-xl font-black text-slate-900 border-b-4 border-slate-900 pb-2 uppercase tracking-tight">
              <User size={24} className="text-purple-600" /> A. Identitas Pelapor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                  Nama Lengkap Pelapor <span className="text-rose-500">*</span>
                </label>
                <input type="text" name="nama_pelapor" required defaultValue={pengaduan.nama_pelapor}
                  className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                  No. Telepon / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input type="tel" name="telp_pelapor" required defaultValue={pengaduan.telp_pelapor}
                  className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
              </div>
            </div>
          </div>

          {/* DETAIL KASUS */}
          <div className="space-y-6 pt-6">
            <h3 className="flex items-center gap-2 text-xl font-black text-slate-900 border-b-4 border-slate-900 pb-2 uppercase tracking-tight">
              <MapPin size={24} className="text-purple-600" /> B. Detail Kasus & Terlapor
            </h3>
            <div>
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                Nama Perusahaan / Pihak Terlapor <span className="text-rose-500">*</span>
              </label>
              <input type="text" name="nama_terlapor" required defaultValue={pengaduan.nama_terlapor}
                className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
            </div>
            <div>
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                Lokasi Kejadian / Alamat Terlapor <span className="text-rose-500">*</span>
              </label>
              <textarea name="lokasi_aduan" required rows={3} defaultValue={pengaduan.lokasi_aduan}
                className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                Deskripsi / Kronologi Kejadian <span className="text-rose-500">*</span>
              </label>
              <textarea name="deskripsi" required rows={5} defaultValue={pengaduan.deskripsi}
                className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none resize-none" />
            </div>
          </div>

          {/* DOKUMENTASI */}
          <div className="space-y-6 pt-6">
            <h3 className="flex items-center gap-2 text-xl font-black text-slate-900 border-b-4 border-slate-900 pb-2 uppercase tracking-tight">
              <FileText size={24} className="text-purple-600" /> C. Bukti Lampiran
            </h3>
            
            {pengaduan.dokumentasi_url && (
              <div className="bg-emerald-50 border-2 border-emerald-500 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-emerald-900 uppercase">Dokumentasi Sudah Diunggah</p>
                  <p className="text-xs font-bold text-emerald-700">Anda dapat menimpanya dengan mengunggah file baru di bawah ini jika diperlukan.</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                Unggah File Dokumentasi / Bukti (PDF, Gambar)
              </label>
              <div className="relative overflow-hidden w-full bg-slate-50 border-2 border-dashed border-slate-900 rounded-xl p-8 text-center hover:bg-slate-100 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 group">
                <input type="file" onChange={(e) => setFileDokumentasi(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <Upload size={32} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
                <div>
                  <p className="text-sm font-bold text-slate-600">
                    {fileDokumentasi ? <span className="text-purple-600 font-black">File Terpilih: {fileDokumentasi.name}</span> : 'Klik atau tarik file bukti/dokumentasi ke sini'}
                  </p>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Maks 10MB</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-10 flex justify-end">
            <button type="submit" disabled={submitting} 
              className="w-full md:w-auto px-10 py-5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-[4px_4px_0_0_#0f172a]">
              {submitting ? <LottieLoader size={24} /> : <Save size={20} />}
              Simpan & Kirim Formulir
            </button>
          </div>

        </form>
      )}
    </div>
  );
}
