'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, PenTool, Upload } from 'lucide-react';

export default function TambahNotaDinasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [generatedNo, setGeneratedNo] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dariBagian, setDariBagian] = useState('Umum');
  const [anggota, setAnggota] = useState<any[]>([]);
  const [isSisipan, setIsSisipan] = useState(false);

  useEffect(() => {
    fetch('/api/pengaturan/anggota-bidang')
      .then(res => res.json())
      .then(res => {
        setAnggota(res.data || []);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData(e.currentTarget);
    
    let fileUrl = '';

    try {
      if (file) {
        const uploadData = new FormData();
        uploadData.append('file', file);
        
        const uploadRes = await fetch('/api/arsip-nota-dinas/upload', {
          method: 'POST',
          body: uploadData
        });
        const uploadResult = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadResult.error || 'Gagal mengunggah file nota dinas');
        fileUrl = uploadResult.url;
      }

      const payload = {
        nama_nota: formData.get('nama_nota'),
        tanggal_nota: formData.get('tanggal_nota'),
        dari_bagian: dariBagian,
        kode_klasifikasi: formData.get('kode_klasifikasi'),
        pemohon_id: formData.get('pemohon_id'),
        keterangan: formData.get('keterangan'),
        is_sisipan: isSisipan,
        nomor_sisipan: formData.get('nomor_sisipan'),
        file_url: fileUrl,
      };

      const res = await fetch('/api/arsip-nota-dinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Gagal menyimpan data');
      }

      setGeneratedNo(result.data.nomor_otomatis);
      setSuccessMsg('Nota Dinas berhasil diregistrasi!');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8 pb-20">
      
      <Link href="/arsip/nota-dinas" className="inline-flex items-center gap-2 text-sm text-slate-900 font-black transition-all bg-white border-2 border-slate-900 px-4 py-2 rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Buku Register
      </Link>

      <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
        <div className="w-14 h-14 rounded-xl bg-fuchsia-400 border-2 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a]">
          <PenTool size={28} className="text-slate-900" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Registrasi Nota Dinas</h2>
          <p className="text-sm font-bold text-slate-600 mt-1 uppercase">Catat Nota Dinas Baru Untuk Mendapatkan Nomor Urut</p>
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
            <p className="text-sm font-bold text-slate-600 mt-2 uppercase tracking-wide">Nomor Register Nota Dinas Anda:</p>
          </div>
          
          <div className="bg-white border-4 border-slate-900 p-6 rounded-2xl shadow-[4px_4px_0_0_#0f172a] inline-block mx-auto">
            <span className="text-3xl font-black text-slate-900 tracking-wider">
              {generatedNo}
            </span>
          </div>

          <div className="pt-6 border-t-4 border-slate-900 mt-6">
            <button 
              type="button"
              onClick={() => router.push('/arsip/nota-dinas')}
              className="px-8 py-4 bg-slate-900 text-white font-black rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all uppercase tracking-widest text-sm"
            >
              Kembali ke Buku Register
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border-4 border-slate-900 rounded-3xl p-8 shadow-[8px_8px_0_0_#0f172a]">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                1. Pemohon (Anggota Bidang) <span className="text-rose-500">*</span>
              </label>
              <select name="pemohon_id" required 
                className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none cursor-pointer">
                <option value="">- Pilih Pemohon -</option>
                {anggota.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nama} {a.jabatan ? `(${a.jabatan})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                2. Isi Nota Dinas (Subjek) <span className="text-rose-500">*</span>
              </label>
              <textarea name="nama_nota" required placeholder="Contoh: Permohonan izin pelaksanaan rapat..." rows={3}
                className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none resize-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                  2. Tanggal Nota <span className="text-rose-500">*</span>
                </label>
                <input type="date" name="tanggal_nota" required defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none cursor-pointer" />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                  3. Asal Bagian <span className="text-rose-500">*</span>
                </label>
                <select 
                  name="dari_bagian" 
                  required 
                  value={dariBagian}
                  onChange={(e) => setDariBagian(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-black rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none cursor-pointer uppercase">
                  <option value="Umum">Umum</option>
                  <option value="Perizinan">Perizinan</option>
                  <option value="Pengaduan">Pengaduan</option>
                  <option value="Pengawasan">Pengawasan</option>
                </select>
              </div>
            </div>

            {/* SISIPAN BLOCK */}
            <div className="bg-sky-50 border-4 border-sky-200 p-6 rounded-2xl space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center w-6 h-6 border-2 border-slate-900 rounded bg-white group-hover:bg-sky-100 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={isSisipan}
                    onChange={(e) => setIsSisipan(e.target.checked)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {isSisipan && <div className="w-3 h-3 bg-slate-900 rounded-sm"></div>}
                </div>
                <span className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Gunakan Nomor Sisipan (Manual Backdate)
                </span>
              </label>

              {isSisipan && (
                <div className="pt-2 pl-9 animate-in slide-in-from-top-2">
                  <label className="block text-xs font-black text-slate-900 mb-2 uppercase tracking-wider">
                    Ketik Nomor Urut Sisipan <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="nomor_sisipan"
                    required={isSisipan}
                    placeholder="Misal: 015.1 atau 001.1.1" 
                    className="w-full bg-white border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" 
                  />
                  <p className="text-xs font-bold text-sky-700 mt-2">
                    Nomor ini akan langsung dirangkai dengan klasifikasi dan tahun. Pastikan ketikannya sesuai urutan yang Anda inginkan.
                  </p>
                </div>
              )}
            </div>

            {dariBagian === 'Umum' && (
              <div className="bg-fuchsia-50 border-4 border-fuchsia-200 p-6 rounded-2xl">
                <label className="block text-sm font-black text-fuchsia-900 mb-2 uppercase tracking-wider">
                  3b. Kode Klasifikasi Surat (Pencarian Pintar) <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="kode_klasifikasi" 
                  required 
                  list="kode-klasifikasi-list"
                  placeholder="Ketik kode (misal: 005) atau cari..." 
                  className="w-full bg-white border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-4 focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" 
                />
                <p className="text-xs font-bold text-fuchsia-700 mt-2">
                  Ketik kode atau nama klasifikasi. Jika tidak ada di daftar, Anda tetap bisa mengetik kode kustom.
                </p>
                <datalist id="kode-klasifikasi-list">
                  <option value="000">000 - Umum</option>
                  <option value="005">005 - Undangan</option>
                  <option value="090">090 - Perjalanan Dinas</option>
                  <option value="100">100 - Pemerintahan</option>
                  <option value="600">600 - Pekerjaan Umum dan Ketenagaan</option>
                  <option value="660">660 - Lingkungan Hidup</option>
                  <option value="800">800 - Kepegawaian (Umum)</option>
                  <option value="900">900 - Keuangan</option>
                  
                  {/* Contoh 4 Ruang (a.b.c.d) */}
                  <option value="600.4.17.2">600.4.17.2 - Pengaduan Lingkungan</option>
                  <option value="600.4.1">600.4.1 - Perizinan Lingkungan</option>
                  <option value="600.4.6">600.4.6 - Pengawasan Lingkungan</option>
                </datalist>
              </div>
            )}

            {/* UPLOAD FILE NOTA DINAS */}
            <div>
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                4. Lampiran Nota Dinas (Opsional)
              </label>
              <div className="relative overflow-hidden w-full bg-slate-50 border-2 border-dashed border-slate-900 rounded-xl p-6 text-center hover:bg-slate-100 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 group">
                <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <Upload size={32} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
                <p className="text-sm font-bold text-slate-600">
                  {file ? <span className="text-fuchsia-600">File terpilih: {file.name}</span> : 'Klik atau seret file ke sini (PDF/Word/Images)'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                5. Keterangan (Opsional)
              </label>
              <textarea name="keterangan" placeholder="Tambahkan catatan khusus jika ada..." rows={2}
                className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none resize-none" />
            </div>

            <div className="pt-8 border-t-4 border-slate-900 mt-8 flex justify-end">
              <button type="submit" disabled={loading} 
                className="w-full md:w-auto px-10 py-4 bg-fuchsia-400 hover:bg-fuchsia-300 text-slate-900 font-black rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-70 disabled:hover:translate-y-0">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Generate Nomor Nota
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
