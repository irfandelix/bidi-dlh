'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Inbox, Upload, Search } from 'lucide-react';
import klasifikasiData from '@/data/klasifikasi.json';

export default function TambahArsipMasukPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [file, setFile] = useState<File | null>(null);
  const [klasifikasiSearch, setKlasifikasiSearch] = useState('');
  const [selectedKlasifikasi, setSelectedKlasifikasi] = useState('');
  const [showKlasifikasiDropdown, setShowKlasifikasiDropdown] = useState(false);

  const filteredKlasifikasi = useMemo(() => {
    if (!klasifikasiSearch) return klasifikasiData.slice(0, 50);
    return klasifikasiData.filter((k: any) => 
      k.name.toLowerCase().includes(klasifikasiSearch.toLowerCase()) || 
      k.code.toLowerCase().includes(klasifikasiSearch.toLowerCase())
    ).slice(0, 50);
  }, [klasifikasiSearch]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData(e.currentTarget);
    
    let fileUrl = '';

    try {
      // 1. Upload File if exists
      if (file) {
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('bucket', 'arsip_dokumen');
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData
        });
        const uploadResult = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadResult.error || 'Gagal mengunggah file');
        fileUrl = uploadResult.url;
      }

      // 2. Submit Data
      const payload = {
        kode_klasifikasi: selectedKlasifikasi,
        nomor_berkas: formData.get('nomor_berkas'),
        nomor_isi_berkas: formData.get('nomor_isi_berkas'),
        nomor_item: formData.get('nomor_item'),
        tanggal_surat: formData.get('tanggal_surat'),
        tanggal_terima: formData.get('tanggal_terima'),
        asal_surat: formData.get('asal_surat'),
        perihal: formData.get('perihal'),
        jumlah: parseInt(formData.get('jumlah') as string || '1'),
        status_surat: formData.get('status_surat') || 'Biasa',
        file_url: fileUrl,
      };

      const res = await fetch('/api/arsip-masuk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Gagal menyimpan data');
      }

      setSuccessMsg('Surat Masuk berhasil dicatat!');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 pb-20 px-4">
      
      <Link href="/arsip/masuk" className="inline-flex items-center gap-2 text-sm text-slate-900 font-black transition-all bg-white border-2 border-slate-900 px-4 py-2 rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Buku Agenda
      </Link>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
        <div className="w-14 h-14 rounded-xl bg-blue-400 border-2 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a] shrink-0">
          <Inbox size={28} className="text-slate-900" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Catat Surat Masuk</h2>
          <p className="text-sm font-bold text-slate-600 mt-1 uppercase">Pencatatan Surat Eksternal Baru</p>
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
          </div>

          <div className="pt-6 border-t-4 border-slate-900 mt-6 flex justify-center gap-4">
            <button 
              type="button"
              onClick={() => { setSuccessMsg(''); setFile(null); setSelectedKlasifikasi(''); }}
              className="px-6 py-4 bg-white text-slate-900 font-black rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all uppercase tracking-widest text-sm"
            >
              Tambah Lagi
            </button>
            <button 
              type="button"
              onClick={() => router.push('/arsip/masuk')}
              className="px-8 py-4 bg-slate-900 text-white font-black rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all uppercase tracking-widest text-sm"
            >
              Lihat Agenda
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border-4 border-slate-900 rounded-3xl p-8 shadow-[8px_8px_0_0_#0f172a]">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* KLASIFIKASI SEARCH */}
            <div className="relative">
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                1. Kode Klasifikasi Arsip
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-4 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Ketik untuk mencari kode (misal: 000, 800, Pegawai)" 
                  value={klasifikasiSearch}
                  onChange={(e) => {
                    setKlasifikasiSearch(e.target.value);
                    setShowKlasifikasiDropdown(true);
                  }}
                  onFocus={() => setShowKlasifikasiDropdown(true)}
                  className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl pl-12 pr-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none"
                />
              </div>
              
              {showKlasifikasiDropdown && (
                <div className="absolute z-20 mt-2 w-full max-h-60 overflow-y-auto bg-white border-4 border-slate-900 rounded-xl shadow-[8px_8px_0_0_#0f172a]">
                  <div className="flex justify-between items-center bg-slate-100 p-2 border-b-2 border-slate-900 sticky top-0">
                    <span className="text-xs font-black uppercase text-slate-500 px-2">Hasil Pencarian</span>
                    <button type="button" onClick={() => setShowKlasifikasiDropdown(false)} className="text-xs font-black text-rose-500 px-2 py-1 bg-white border-2 border-rose-500 rounded-lg">TUTUP</button>
                  </div>
                  {filteredKlasifikasi.map((k: any, i: number) => (
                    <div 
                      key={i} 
                      onClick={() => {
                        setSelectedKlasifikasi(`${k.code} - ${k.name}`);
                        setKlasifikasiSearch(`${k.code} - ${k.name}`);
                        setShowKlasifikasiDropdown(false);
                      }}
                      className="px-4 py-3 border-b-2 border-slate-100 hover:bg-blue-50 cursor-pointer flex flex-col"
                    >
                      <span className="font-black text-slate-900 text-sm">{k.code}</span>
                      <span className="font-bold text-slate-600 text-xs">{k.name}</span>
                    </div>
                  ))}
                  {filteredKlasifikasi.length === 0 && (
                    <div className="p-4 text-center text-sm font-bold text-slate-500">Tidak ditemukan</div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <div className="bg-blue-50 border-4 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0_0_#0f172a]">
                  <div className="flex items-center gap-3 mb-6 border-b-4 border-slate-900 pb-4">
                    <div className="w-10 h-10 bg-white rounded-xl border-4 border-slate-900 flex items-center justify-center font-black text-slate-900 shadow-[2px_2px_0_0_#0f172a]">
                      2
                    </div>
                    <h3 className="font-black text-xl text-slate-900 uppercase tracking-widest">Detail Nomor</h3>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nomor Berkas</label>
                      <input type="text" name="nomor_berkas" placeholder="Contoh: 74" 
                        className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0_0_#0f172a] transition-all bg-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nomor Isi Berkas</label>
                      <input type="text" name="nomor_isi_berkas" placeholder="Contoh: 1" 
                        className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0_0_#0f172a] transition-all bg-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nomor Item</label>
                      <input type="text" name="nomor_item" placeholder="Contoh: 1" 
                        className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none focus:-translate-y-1 focus:shadow-[4px_4px_0_0_#0f172a] transition-all bg-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                  3. Asal Surat (Instansi/Pengirim) <span className="text-rose-500">*</span>
                </label>
                <input type="text" name="asal_surat" required placeholder="Contoh: Bappeda Prov..." 
                  className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                  4. Tanggal Surat <span className="text-rose-500">*</span>
                </label>
                <input type="date" name="tanggal_surat" required 
                  className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none cursor-pointer" />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                  5. Tanggal Diterima <span className="text-rose-500">*</span>
                </label>
                <input type="date" name="tanggal_terima" required defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none cursor-pointer" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                6. Perihal / Ringkasan Surat <span className="text-rose-500">*</span>
              </label>
              <textarea name="perihal" required rows={3} placeholder="Contoh: Undangan Rapat Evaluasi Anggaran..." 
                className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none resize-none"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                  7. Jumlah Lembar / Berkas
                </label>
                <input type="number" name="jumlah" defaultValue={1} min={1}
                  className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                  8. Status Surat
                </label>
                <select name="status_surat" defaultValue="Biasa"
                  className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-4 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none cursor-pointer">
                  <option value="Biasa">Biasa</option>
                  <option value="Terbatas">Terbatas</option>
                  <option value="Rahasia">Rahasia</option>
                  <option value="Segera">Segera</option>
                  <option value="Penting">Penting</option>
                </select>
              </div>
            </div>

            {/* UPLOAD FILE */}
            <div>
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">
                9. Lampiran File (Opsional)
              </label>
              <div className="relative overflow-hidden w-full bg-slate-50 border-2 border-dashed border-slate-900 rounded-xl p-6 text-center hover:bg-slate-100 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 group">
                <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <Upload size={32} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
                <p className="text-sm font-bold text-slate-600">
                  {file ? <span className="text-emerald-600">File terpilih: {file.name}</span> : 'Klik atau seret file ke sini (PDF/Word/Images)'}
                </p>
              </div>
            </div>

            <div className="pt-8 border-t-4 border-slate-900 mt-8 flex justify-end">
              <button type="submit" disabled={loading} 
                className="w-full md:w-auto px-10 py-4 bg-blue-400 hover:bg-blue-300 text-slate-900 font-black rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-70 disabled:hover:translate-y-0">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Simpan Arsip Masuk
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
