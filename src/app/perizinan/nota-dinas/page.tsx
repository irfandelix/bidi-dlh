'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Send, Building2, User, Plus, X } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function NotaDinasPerizinanPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [petugasList, setPetugasList] = useState<string[]>(['']);
  const [kegiatanList, setKegiatanList] = useState([{ nama_usaha: '', deskripsi: '' }]);

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

  const addKegiatan = () => setKegiatanList([...kegiatanList, { nama_usaha: '', deskripsi: '' }]);
  const removeKegiatan = (idx: number) => {
    const newArr = [...kegiatanList];
    newArr.splice(idx, 1);
    setKegiatanList(newArr);
  };
  const updateKegiatan = (idx: number, field: 'nama_usaha' | 'deskripsi', val: string) => {
    const newArr = [...kegiatanList];
    newArr[idx][field] = val;
    setKegiatanList(newArr);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData(e.currentTarget);
    const payload = {
      hal: formData.get('hal'),
      yth: formData.get('yth'),
      dari: formData.get('dari'),
      sifat: formData.get('sifat'),
      lampiran: formData.get('lampiran'),
      kegiatan: kegiatanList.filter(k => k.nama_usaha.trim() !== '' || k.deskripsi.trim() !== ''),
      petugas: petugasList.filter(p => p.trim() !== '')
    };

    try {
      const res = await fetch('/api/perizinan/generate-nota-dinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || 'Terjadi kesalahan');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const disposition = res.headers.get('Content-Disposition');
      let filename = 'Nota_Dinas_Perizinan.docx';
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
      
      setSuccessMsg('Nota Dinas berhasil dibuat dan diunduh. Tersimpan otomatis di Arsip Nota Dinas!');
      e.currentTarget.reset();
      setPetugasList(['']);
      setKegiatanList([{ nama_usaha: '', deskripsi: '' }]);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/perizinan" className="w-12 h-12 shrink-0 bg-white border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center shadow-sm hover:bg-slate-50 transition-all">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">Buat Nota Dinas</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Modul Perizinan</p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-100 text-rose-800 p-4 rounded-xl font-bold border-2 border-rose-200 uppercase text-sm">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-100 text-emerald-800 p-4 rounded-xl font-bold border-2 border-emerald-200 uppercase text-sm">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-purple-600 p-6 text-white flex items-center gap-4">
            <FileText size={32} />
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest">Formulir Isian Surat</h2>
              <p className="text-purple-200 font-medium text-sm">Penomoran menggunakan format 600.4.1/...</p>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            
            {/* Kop Surat */}
            <div className="space-y-4">
              <h3 className="font-black text-slate-900 uppercase tracking-widest border-b-2 border-slate-100 pb-2">Kepala Surat</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hal / Perihal</label>
                  <input type="text" name="hal" required placeholder="Contoh: Laporan Hasil Verifikasi / Pemeriksaan..." className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Yth. Tujuan</label>
                  <input type="text" name="yth" required defaultValue="Kepala Dinas Lingkungan Hidup Kab. Sragen" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Dari</label>
                  <input type="text" name="dari" required defaultValue="Tim Teknis Perizinan" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Sifat</label>
                    <input type="text" name="sifat" required defaultValue="Biasa" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Lampiran</label>
                    <input type="text" name="lampiran" required defaultValue="1 (Satu) Berkas" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all" />
                  </div>
                </div>
              </div>
            </div>

            {/* Isi Kegiatan */}
            <div className="space-y-4">
              <h3 className="font-black text-slate-900 uppercase tracking-widest border-b-2 border-slate-100 pb-2">Kegiatan Perizinan</h3>
              
              {kegiatanList.map((keg, idx) => (
                <div key={idx} className="bg-slate-100 p-4 rounded-xl border border-slate-200 relative space-y-4">
                  {kegiatanList.length > 1 && (
                    <button type="button" onClick={() => removeKegiatan(idx)} className="absolute -top-3 -right-3 bg-rose-500 text-white p-1.5 rounded-lg shadow-sm hover:bg-rose-600 transition-all">
                      <X size={16} />
                    </button>
                  )}
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Building2 size={16} /> Nama Perusahaan / Objek {idx + 1}</label>
                    <input type="text" required value={keg.nama_usaha} onChange={(e) => updateKegiatan(idx, 'nama_usaha', e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:border-purple-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><FileText size={16} /> Deskripsi Kegiatan / Hasil {idx + 1}</label>
                    <textarea required rows={4} value={keg.deskripsi} onChange={(e) => updateKegiatan(idx, 'deskripsi', e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:border-purple-500 outline-none transition-all resize-y"></textarea>
                  </div>
                </div>
              ))}
              
              <button type="button" onClick={addKegiatan} className="flex items-center gap-2 text-sm font-black text-purple-600 hover:text-purple-700 bg-purple-50 px-4 py-2 rounded-xl transition-all uppercase tracking-widest">
                <Plus size={16} /> Tambah Objek Perizinan
              </button>
            </div>

            {/* Tim Petugas */}
            <div className="space-y-4">
              <h3 className="font-black text-slate-900 uppercase tracking-widest border-b-2 border-slate-100 pb-2">Tim Teknis / Petugas</h3>
              {petugasList.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <User size={16} className="absolute left-3 top-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      value={p}
                      onChange={(e) => updatePetugas(idx, e.target.value)}
                      placeholder="Nama Petugas" 
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-900 focus:border-purple-500 outline-none transition-all" 
                    />
                  </div>
                  {petugasList.length > 1 && (
                    <button type="button" onClick={() => removePetugas(idx)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all border-2 border-transparent hover:border-rose-200">
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addPetugas} className="flex items-center gap-2 text-sm font-black text-purple-600 hover:text-purple-700 bg-purple-50 px-4 py-2 rounded-xl transition-all uppercase tracking-widest">
                <Plus size={16} /> Tambah Petugas
              </button>
            </div>

          </div>

          <div className="bg-slate-50 p-6 md:p-8 border-t border-slate-200 flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-70 disabled:hover:translate-y-0 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all flex items-center gap-3"
            >
              {loading ? <LottieLoader size={24} /> : <Send size={20} />}
              {loading ? 'Memproses...' : 'Generate Surat'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
