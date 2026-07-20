'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, AlertTriangle, Upload } from 'lucide-react';

export default function TambahPengaduanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [fileDokumentasi, setFileDokumentasi] = useState<File | null>(null);
  const [fileBA, setFileBA] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData(e.currentTarget);
    const perihal = formData.get('perihal') as string;
    
    let dokumentasi_url = '';
    let ba_url = '';

    try {
      // 1. Upload Dokumentasi if exists
      if (fileDokumentasi) {
        const uploadData = new FormData();
        uploadData.append('file', fileDokumentasi);
        uploadData.append('folderName', perihal);
        
        const uploadRes = await fetch('/api/pengaduan/upload', {
          method: 'POST',
          body: uploadData
        });
        const uploadResult = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadResult.error || 'Gagal mengunggah file Dokumentasi');
        dokumentasi_url = uploadResult.url;
      }

      // 2. Upload Berita Acara if exists
      if (fileBA) {
        const uploadData = new FormData();
        uploadData.append('file', fileBA);
        uploadData.append('folderName', perihal);
        
        const uploadRes = await fetch('/api/pengaduan/upload', {
          method: 'POST',
          body: uploadData
        });
        const uploadResult = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadResult.error || 'Gagal mengunggah file Berita Acara (BA)');
        ba_url = uploadResult.url;
      }

      // 3. Submit Data
      const payload = {
        perihal,
        tanggal: formData.get('tanggal'),
        dokumentasi_url,
        ba_url,
      };

      const res = await fetch('/api/pengaduan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Gagal menyimpan data pengaduan');
      }

      setSuccessMsg('Pengaduan berhasil dicatat beserta lampirannya!');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8 pb-20 px-4">
      
      <Link href="/peta" className="inline-flex items-center gap-2 text-sm text-slate-900 font-black transition-all bg-white border-2 border-slate-900 px-4 py-2 rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Peta / Beranda
      </Link>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
        <div className="w-14 h-14 rounded-xl bg-purple-400 border-2 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a] shrink-0">
          <AlertTriangle size={28} className="text-slate-900" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Catat Pengaduan</h2>
          <p className="text-sm font-bold text-slate-600 mt-1 uppercase">Pencatatan Berita Acara dan Dokumentasi Pengaduan Lingkungan</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-200 text-slate-900 p-4 rounded-xl text-sm font-bold border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a]">
          {errorMsg}
        </div>
      )}

      {successMsg ? (
        <div className="bg-emerald-50 border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] rounded-3xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-400 border-4 border-slate-900 rounded-full flex items-center justify-center mx-auto shadow-[4px_4px_0_0_#0f172a]">
            <Save size={40} className="text-slate-900" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase text-slate-900">{successMsg}</h3>
            <p className="text-sm font-bold text-slate-600 mt-2">File Anda telah berhasil diunggah dan ditata rapi ke dalam sub-folder Google Drive Pengaduan.</p>
          </div>

          <div className="pt-6 border-t-4 border-slate-900 mt-6 flex justify-center gap-4">
            <button 
              type="button"
              onClick={() => { setSuccessMsg(''); setFileDokumentasi(null); setFileBA(null); }}
              className="px-6 py-4 bg-white text-slate-900 font-black rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all uppercase tracking-widest text-sm"
            >
              Catat Pengaduan Lain
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border-4 border-slate-900 rounded-3xl p-8 shadow-[8px_8px_0_0_#0f172a]">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                1. Nama Kegiatan / Perihal Aduan <span className="text-rose-500">*</span>
              </label>
              <input type="text" name="perihal" required placeholder="Contoh: Aduan Pencemaran PT Maju Jaya..." 
                className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
              <p className="text-xs font-bold text-slate-500 mt-1 uppercase">Nama ini akan digunakan sebagai nama sub-folder di Google Drive.</p>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                2. Tanggal Pengaduan / Pemeriksaan <span className="text-rose-500">*</span>
              </label>
              <input type="date" name="tanggal" required defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none cursor-pointer" />
            </div>

            <div className="pt-6 border-t-2 border-slate-200">
              <h3 className="font-black text-lg text-slate-900 uppercase tracking-widest mb-4">Lampiran Berkas GDrive</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* UPLOAD FILE DOKUMENTASI */}
                <div>
                  <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                    3. Dokumentasi (Foto/PDF)
                  </label>
                  <div className="relative overflow-hidden w-full bg-purple-50 border-2 border-dashed border-purple-900 rounded-xl p-6 text-center hover:bg-purple-100 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 group h-32">
                    <input type="file" onChange={(e) => setFileDokumentasi(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <Upload size={24} className="text-purple-400 group-hover:text-purple-900 transition-colors" />
                    <p className="text-xs font-bold text-slate-600">
                      {fileDokumentasi ? <span className="text-purple-600 font-black">{fileDokumentasi.name}</span> : 'Pilih File Dokumentasi'}
                    </p>
                  </div>
                </div>

                {/* UPLOAD FILE BERITA ACARA */}
                <div>
                  <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                    4. Berita Acara (BA)
                  </label>
                  <div className="relative overflow-hidden w-full bg-blue-50 border-2 border-dashed border-blue-900 rounded-xl p-6 text-center hover:bg-blue-100 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 group h-32">
                    <input type="file" onChange={(e) => setFileBA(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <Upload size={24} className="text-blue-400 group-hover:text-blue-900 transition-colors" />
                    <p className="text-xs font-bold text-slate-600">
                      {fileBA ? <span className="text-blue-600 font-black">{fileBA.name}</span> : 'Pilih File BA'}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            <div className="pt-8 border-t-4 border-slate-900 mt-8 flex justify-end">
              <button type="submit" disabled={loading} 
                className="w-full md:w-auto px-10 py-4 bg-purple-400 hover:bg-purple-300 text-slate-900 font-black rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-70 disabled:hover:translate-y-0">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Simpan & Unggah
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
