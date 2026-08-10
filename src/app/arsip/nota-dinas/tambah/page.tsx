'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, PenTool, Upload, User, X, Plus } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

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
  const [tanggalNota, setTanggalNota] = useState(new Date().toISOString().split('T')[0]);
  const [petugasList, setPetugasList] = useState<string[]>(['']);

  const addPetugas = () => setPetugasList([...petugasList, '']);
  const removePetugas = (idx: number) => {
    const newArr = [...petugasList];
    newArr.splice(idx, 1);
    setPetugasList(newArr);
  };
  const updatePetugas = (idx: number, val: string) => {
    const newArr = [...petugasList];
    newArr[idx] = val;
    setPetugasList(newArr);
  };

  useEffect(() => {
    fetch('/api/pengaturan/anggota-bidang')
      .then(res => res.json())
      .then(res => {
        setAnggota(res.data || []);
      })
      .catch(console.error);
  }, []);

  const handleTanggalChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTanggalNota(val);
    
    if (val) {
      try {
        const res = await fetch('/api/arsip-nota-dinas/check-backdate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tanggal: val })
        });
        const data = await res.json();
        
        if (data.isBackdate) {
          setIsSisipan(true);
        } else {
          setIsSisipan(false);
        }
      } catch (err) {
        console.error('Failed to check backdate:', err);
      }
    }
  };

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
        yth: formData.get('yth'),
        sifat: formData.get('sifat'),
        lampiran: formData.get('lampiran'),
        petugas: petugasList.filter(p => p.trim() !== ''),
        is_sisipan: isSisipan,
        nomor_sisipan: formData.get('nomor_sisipan'),
        file_url: fileUrl,
      };

      const res = await fetch('/api/arsip-nota-dinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Terjadi kesalahan saat registrasi nota dinas');
      }
      
      const contentType = res.headers.get('Content-Type');
      if (contentType && contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        // Ini respons berupa file DOCX
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const disposition = res.headers.get('Content-Disposition');
        let filename = 'Nota_Dinas.docx';
        if (disposition && disposition.indexOf('filename=') !== -1) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        // Kita tidak tahu nomor pastinya dari JSON karena response-nya file, 
        // tapi kita anggap sukses.
        setSuccessMsg('Nota Dinas berhasil diregistrasi & File template otomatis diunduh!');
        setGeneratedNo('TERDAFTAR');
        setPetugasList(['']);
      } else {
        // Ini respons berupa JSON biasa (mungkin template gagal atau fallback)
        const result = await res.json();
        setGeneratedNo(result.data?.nomor_otomatis || 'TERDAFTAR');
        setSuccessMsg(result.message || 'Nota Dinas berhasil diregistrasi!');
        setPetugasList(['']);
      }

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8 pb-20">
      
      <Link href="/arsip/nota-dinas" className="inline-flex items-center gap-2 text-sm text-on-surface font-bold transition-all bg-surface border border-outline-variant px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Buku Register
      </Link>

      <div className="flex items-center gap-4 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
        <div className="w-14 h-14 rounded-xl bg-fuchsia-400 border border-outline-variant flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
          <PenTool size={28} className="text-on-surface" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface uppercase">Registrasi Nota Dinas</h2>
          <p className="text-sm font-bold text-on-surface-variant mt-1 uppercase">Catat Nota Dinas Baru Untuk Mendapatkan Nomor Urut</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-200 text-on-surface p-4 rounded-xl text-sm font-bold border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
          {errorMsg}
        </div>
      )}

      {successMsg ? (
        <div className="bg-secondary-container border border-outline-variant shadow-sm hover:shadow-md transition-shadow rounded-3xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-secondary text-on-secondary border border-outline-variant rounded-full flex items-center justify-center mx-auto shadow-sm hover:shadow-md transition-shadow">
            <Save size={40} className="text-on-surface" />
          </div>
          <div>
            <h3 className="text-xl font-bold uppercase text-on-surface">{successMsg}</h3>
            <p className="text-sm font-bold text-on-surface-variant mt-2 uppercase tracking-wide">Nomor Register Nota Dinas Anda:</p>
          </div>
          
          <div className="bg-surface border border-outline-variant p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow inline-block mx-auto">
            <span className="text-3xl font-bold text-on-surface tracking-wider">
              {generatedNo}
            </span>
          </div>

          <div className="pt-6 border-t border-outline-variant mt-6">
            <button 
              type="button"
              onClick={() => router.push('/arsip/nota-dinas')}
              className="px-8 py-4 bg-primary text-on-primary text-on-primary font-bold rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all uppercase tracking-widest text-sm"
            >
              Kembali ke Buku Register
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-outline-variant rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                1. Pemohon (Anggota Bidang) <span className="text-error">*</span>
              </label>
              <select name="pemohon_id" required 
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-bold rounded-xl px-4 py-4 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none cursor-pointer">
                <option value="">- Pilih Pemohon -</option>
                {anggota.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nama} {a.jabatan ? `(${a.jabatan})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                2. Isi Nota Dinas (Subjek / Hal) <span className="text-error">*</span>
              </label>
              <textarea name="nama_nota" required placeholder="Contoh: Permohonan izin pelaksanaan rapat..." rows={3}
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-bold rounded-xl px-4 py-4 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none resize-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                  Yth. Tujuan (Template) <span className="text-error">*</span>
                </label>
                <input type="text" name="yth" required defaultValue="Kepala Dinas Lingkungan Hidup Kab. Sragen"
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-bold rounded-xl px-4 py-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                  Sifat (Template)
                </label>
                <input type="text" name="sifat" defaultValue="Biasa"
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-bold rounded-xl px-4 py-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                  Lampiran (Template)
                </label>
                <input type="text" name="lampiran" defaultValue="-"
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-bold rounded-xl px-4 py-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none" />
              </div>
            </div>

            {/* Tim Petugas */}
            <div className="space-y-4 pt-4 border-t border-outline-variant">
              <label className="block text-sm font-bold text-on-surface uppercase tracking-wider">
                Tim Petugas / Yang Melaksanakan Tugas (Template)
              </label>
              {petugasList.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <User size={16} className="absolute left-3 top-3.5 text-on-surface-variant" />
                    <input 
                      type="text" 
                      value={p}
                      onChange={(e) => updatePetugas(idx, e.target.value)}
                      placeholder="Nama Petugas" 
                      className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-bold rounded-xl pl-10 pr-4 py-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-all outline-none" 
                    />
                  </div>
                  {petugasList.length > 1 && (
                    <button type="button" onClick={() => removePetugas(idx)} className="p-3 text-error hover:bg-error-container rounded-xl transition-all border border-transparent hover:border-error">
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addPetugas} className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-dark bg-primary-container px-4 py-2 rounded-xl transition-all uppercase tracking-widest">
                <Plus size={16} /> Tambah Petugas
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-outline-variant">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                  2. Tanggal Nota <span className="text-error">*</span>
                </label>
                <input type="date" name="tanggal_nota" required value={tanggalNota} onChange={handleTanggalChange}
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-bold rounded-xl px-4 py-4 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none cursor-pointer" />
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                  3. Asal Bagian <span className="text-error">*</span>
                </label>
                <select 
                  name="dari_bagian" 
                  required 
                  value={dariBagian}
                  onChange={(e) => setDariBagian(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-bold rounded-xl px-4 py-4 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none cursor-pointer uppercase">
                  <option value="Umum">Umum</option>
                  <option value="Perizinan">Perizinan</option>
                  <option value="Pengaduan">Pengaduan</option>
                  <option value="Pengawasan">Pengawasan</option>
                </select>
              </div>
            </div>

            {/* SISIPAN BLOCK */}
            <div className="bg-sky-50 border border-sky-200 p-6 rounded-2xl space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center w-6 h-6 border border-outline-variant rounded bg-surface group-hover:bg-sky-100 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={isSisipan}
                    onChange={(e) => setIsSisipan(e.target.checked)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {isSisipan && <div className="w-3 h-3 bg-primary text-on-primary rounded-sm"></div>}
                </div>
                <span className="text-sm font-bold text-on-surface uppercase tracking-wider">
                  Gunakan Nomor Sisipan (Manual Backdate)
                </span>
              </label>

              {isSisipan && (
                <div className="pt-2 pl-9 animate-in slide-in-from-top-2">
                  <label className="block text-xs font-bold text-on-surface mb-2 uppercase tracking-wider">
                    Ketik Nomor Urut Sisipan <span className="text-error">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="nomor_sisipan"
                    required={isSisipan}
                    placeholder="Misal: 015.1 atau 001.1.1" 
                    className="w-full bg-surface border border-outline-variant text-on-surface text-sm font-bold rounded-xl px-4 py-3 focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none" 
                  />
                  <p className="text-xs font-bold text-sky-700 mt-2">
                    Nomor ini akan langsung dirangkai dengan klasifikasi dan tahun. Pastikan ketikannya sesuai urutan yang Anda inginkan.
                  </p>
                  <div className="mt-3 p-3 bg-tertiary-container text-on-tertiary-container border border-amber-200 rounded-lg">
                    <p className="text-xs font-bold text-amber-900 uppercase">
                      ⚠️ Peringatan Penting
                    </p>
                    <p className="text-xs font-bold text-on-tertiary-container mt-1">
                      Saat membuat nomor sisipan, harap **periksa kembali isian Tanggal Nota** di atas agar sesuai dengan tanggal sisipan (mundur) yang Anda maksud, bukan tanggal hari ini.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {dariBagian === 'Umum' && (
              <div className="bg-fuchsia-50 border border-fuchsia-200 p-6 rounded-2xl">
                <label className="block text-sm font-bold text-fuchsia-900 mb-2 uppercase tracking-wider">
                  3b. Kode Klasifikasi Surat (Pencarian Pintar) <span className="text-error">*</span>
                </label>
                <input 
                  type="text" 
                  name="kode_klasifikasi" 
                  required 
                  list="kode-klasifikasi-list"
                  placeholder="Ketik kode (misal: 005) atau cari..." 
                  className="w-full bg-surface border border-outline-variant text-on-surface text-sm font-bold rounded-xl px-4 py-4 focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none" 
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
              <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                4. Lampiran Nota Dinas (Opsional)
              </label>
              <div className="relative overflow-hidden w-full bg-surface-container-lowest border-2 border-dashed border-outline-variant rounded-xl p-6 text-center hover:bg-surface-container-low transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 group">
                <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <Upload size={32} className="text-slate-400 group-hover:text-on-surface transition-colors" />
                <p className="text-sm font-bold text-on-surface-variant">
                  {file ? <span className="text-fuchsia-600">File terpilih: {file.name}</span> : 'Klik atau seret file ke sini (PDF/Word/Images)'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-2 uppercase tracking-wider">
                5. Keterangan (Opsional)
              </label>
              <textarea name="keterangan" placeholder="Tambahkan catatan khusus jika ada..." rows={2}
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-bold rounded-xl px-4 py-4 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none resize-none" />
            </div>

            <div className="pt-8 border-t border-outline-variant mt-8 flex justify-end">
              <button type="submit" disabled={loading} 
                className="w-full md:w-auto px-10 py-4 bg-fuchsia-400 hover:bg-fuchsia-300 text-on-surface font-bold rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-70 disabled:hover:translate-y-0">
                {loading ? <LottieLoader size={24} /> : <Save size={18} />}
                Generate Nomor Nota
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
