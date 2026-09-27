'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, FolderOpen, Upload, Trash2, CheckCircle2 } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function TambahArsipBidangPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [namaKegiatan, setNamaKegiatan] = useState('');

  // State for multiple files
  const [dokFiles, setDokFiles] = useState<File[]>([]);
  const [undanganFiles, setUndanganFiles] = useState<File[]>([]);
  const [berkasFiles, setBerkasFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File[]>>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setter(prev => [...prev, ...filesArr]);
    }
  };

  const removeFile = (index: number, setter: React.Dispatch<React.SetStateAction<File[]>>) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (files: File[], namakegiatan: string) => {
    const uploadedUrls: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('nama_kegiatan', namakegiatan);

      const res = await fetch('/api/arsip-bidang/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Gagal upload file ${file.name}`);
      }

      const data = await res.json();
      if (data.url) {
        uploadedUrls.push(data.url);
      }
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData(e.currentTarget);
    const kegiatan = formData.get('nama_kegiatan') as string;
    
    try {
      // Upload all files first
      const dokumentasiUrls = await uploadFiles(dokFiles, kegiatan);
      const undanganUrls = await uploadFiles(undanganFiles, kegiatan);
      const berkasLainUrls = await uploadFiles(berkasFiles, kegiatan);

      // Submit Data
      const payload = {
        tim: formData.get('tim'),
        nama_kegiatan: kegiatan,
        tanggal_kegiatan: formData.get('tanggal_kegiatan'),
        lokasi_kegiatan: formData.get('lokasi_kegiatan'),
        dokumentasi_acara: dokumentasiUrls.length > 0 ? dokumentasiUrls : null,
        undangan_acara: undanganUrls.length > 0 ? undanganUrls : null,
        berkas_lain: berkasLainUrls.length > 0 ? berkasLainUrls : null,
      };

      const res = await fetch('/api/arsip-bidang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Gagal menyimpan data');
      }

      setSuccessMsg('Arsip Bidang berhasil dicatat!');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 pb-20 px-4">
      
      <Link href="/arsip/bidang" className="inline-flex items-center gap-2 text-sm text-on-surface font-bold transition-all bg-surface border border-outline-variant px-4 py-2 rounded-xl shadow-sm hover:shadow-md uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Arsip Bidang
      </Link>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
        <div className="w-14 h-14 rounded-xl bg-amber-300 border border-outline-variant flex items-center justify-center shadow-sm shrink-0">
          <FolderOpen size={28} className="text-on-surface" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface uppercase">Tambah Arsip Kegiatan</h2>
          <p className="text-sm font-bold text-on-surface-variant mt-1 uppercase">Penyimpanan Berkas Kegiatan Bidang</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-200 text-on-surface p-4 rounded-xl text-sm font-bold border border-outline-variant shadow-sm">
          {errorMsg}
        </div>
      )}

      {successMsg ? (
        <div className="bg-secondary-container border border-outline-variant shadow-sm rounded-3xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-400 text-on-surface border border-outline-variant rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={40} />
          </div>
          <div>
            <h3 className="text-xl font-bold uppercase text-on-surface">{successMsg}</h3>
          </div>

          <div className="pt-6 border-t border-outline-variant mt-6 flex justify-center gap-4">
            <button 
              type="button"
              onClick={() => { 
                setSuccessMsg(''); 
                setDokFiles([]); 
                setUndanganFiles([]); 
                setBerkasFiles([]); 
                setNamaKegiatan('');
              }}
              className="px-6 py-4 bg-surface text-on-surface font-bold rounded-xl border border-outline-variant shadow-sm hover:-translate-y-1 transition-all uppercase tracking-widest text-sm"
            >
              Tambah Lagi
            </button>
            <button 
              type="button"
              onClick={() => router.push('/arsip/bidang')}
              className="px-8 py-4 bg-amber-300 text-on-surface font-bold rounded-xl border border-outline-variant shadow-sm hover:-translate-y-1 transition-all uppercase tracking-widest text-sm"
            >
              Lihat Arsip
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-outline-variant rounded-3xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                  1. Tim <span className="text-error">*</span>
                </label>
                <select name="tim" required
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-bold rounded-xl px-4 py-4 focus:bg-surface focus:shadow-sm outline-none cursor-pointer">
                  <option value="">-- Pilih Tim --</option>
                  <option value="Tim Perencanaan">Tim Perencanaan</option>
                  <option value="Tim Pengaduan">Tim Pengaduan</option>
                  <option value="Tim Pengawasan">Tim Pengawasan</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                  2. Nama Kegiatan <span className="text-error">*</span>
                </label>
                <input type="text" name="nama_kegiatan" required placeholder="Contoh: Rapat Koordinasi Tahunan" 
                  value={namaKegiatan} onChange={(e) => setNamaKegiatan(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-bold rounded-xl px-4 py-4 focus:bg-surface focus:shadow-sm outline-none" />
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                  3. Tanggal Kegiatan <span className="text-error">*</span>
                </label>
                <input type="date" name="tanggal_kegiatan" required 
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-bold rounded-xl px-4 py-4 focus:bg-surface focus:shadow-sm outline-none cursor-pointer" />
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                  4. Lokasi Kegiatan <span className="text-error">*</span>
                </label>
                <input type="text" name="lokasi_kegiatan" required placeholder="Contoh: Ruang Rapat Lt.2" 
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-bold rounded-xl px-4 py-4 focus:bg-surface focus:shadow-sm outline-none" />
              </div>
            </div>

            <div className="pt-6 border-t border-outline-variant">
              <h3 className="font-bold text-lg text-on-surface uppercase mb-4">Upload Berkas</h3>
              <p className="text-xs text-on-surface-variant font-bold uppercase mb-6 bg-blue-50 p-3 rounded-lg border border-blue-200">
                Penting: Isi "Nama Kegiatan" terlebih dahulu sebelum upload agar file tersimpan di folder yang tepat.
              </p>
              
              <div className="space-y-6">
                {/* Upload Dokumentasi */}
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                    Dokumentasi Acara (Foto/Video)
                  </label>
                  <div className="relative overflow-hidden w-full bg-surface-container-lowest border-2 border-dashed border-outline-variant rounded-xl p-6 text-center hover:bg-surface-container-low transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 group">
                    <input type="file" multiple accept="image/*,video/*" disabled={!namaKegiatan} onChange={(e) => handleFileChange(e, setDokFiles)} className="absolute inset-0 opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" />
                    <Upload size={24} className="text-slate-400 group-hover:text-on-surface transition-colors" />
                    <p className="text-sm font-bold text-on-surface-variant">
                      {!namaKegiatan ? 'Isi Nama Kegiatan dulu' : 'Klik atau seret file dokumentasi ke sini'}
                    </p>
                  </div>
                  {dokFiles.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {dokFiles.map((file, i) => (
                        <li key={i} className="text-xs font-bold bg-surface border border-outline-variant px-3 py-2 rounded-lg flex justify-between items-center">
                          <span className="truncate pr-4">{file.name}</span>
                          <button type="button" onClick={() => removeFile(i, setDokFiles)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Upload Undangan */}
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                    Undangan Acara (PDF/Word/Images)
                  </label>
                  <div className="relative overflow-hidden w-full bg-surface-container-lowest border-2 border-dashed border-outline-variant rounded-xl p-6 text-center hover:bg-surface-container-low transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 group">
                    <input type="file" multiple disabled={!namaKegiatan} onChange={(e) => handleFileChange(e, setUndanganFiles)} className="absolute inset-0 opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" />
                    <Upload size={24} className="text-slate-400 group-hover:text-on-surface transition-colors" />
                    <p className="text-sm font-bold text-on-surface-variant">
                      {!namaKegiatan ? 'Isi Nama Kegiatan dulu' : 'Klik atau seret file undangan ke sini'}
                    </p>
                  </div>
                  {undanganFiles.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {undanganFiles.map((file, i) => (
                        <li key={i} className="text-xs font-bold bg-surface border border-outline-variant px-3 py-2 rounded-lg flex justify-between items-center">
                          <span className="truncate pr-4">{file.name}</span>
                          <button type="button" onClick={() => removeFile(i, setUndanganFiles)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Upload Berkas Lain */}
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                    Berkas Lain (Materi/Laporan/dll)
                  </label>
                  <div className="relative overflow-hidden w-full bg-surface-container-lowest border-2 border-dashed border-outline-variant rounded-xl p-6 text-center hover:bg-surface-container-low transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 group">
                    <input type="file" multiple disabled={!namaKegiatan} onChange={(e) => handleFileChange(e, setBerkasFiles)} className="absolute inset-0 opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" />
                    <Upload size={24} className="text-slate-400 group-hover:text-on-surface transition-colors" />
                    <p className="text-sm font-bold text-on-surface-variant">
                      {!namaKegiatan ? 'Isi Nama Kegiatan dulu' : 'Klik atau seret berkas lain ke sini'}
                    </p>
                  </div>
                  {berkasFiles.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {berkasFiles.map((file, i) => (
                        <li key={i} className="text-xs font-bold bg-surface border border-outline-variant px-3 py-2 rounded-lg flex justify-between items-center">
                          <span className="truncate pr-4">{file.name}</span>
                          <button type="button" onClick={() => removeFile(i, setBerkasFiles)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>
            </div>

            <div className="pt-8 border-t border-outline-variant mt-8 flex justify-end">
              <button type="submit" disabled={loading} 
                className="w-full md:w-auto px-10 py-4 bg-amber-400 hover:bg-amber-300 text-on-surface font-bold rounded-xl border border-outline-variant shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-70 disabled:hover:translate-y-0">
                {loading ? <LottieLoader size={24} /> : <Save size={18} />}
                Simpan Arsip Kegiatan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
