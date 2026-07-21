'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, ArrowLeft, Loader2, Trash2, Users } from 'lucide-react';

export default function AnggotaBidangPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAnggota = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pengaturan/anggota-bidang');
      const json = await res.json();
      setData(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnggota();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    const payload = {
      nama: formData.get('nama'),
      nip: formData.get('nip'),
      jabatan: formData.get('jabatan'),
      hierarki: formData.get('hierarki'),
    };

    try {
      const res = await fetch('/api/pengaturan/anggota-bidang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Gagal menambah anggota');
      
      e.currentTarget.reset();
      fetchAnggota();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus anggota ini? Data Arsip Nota Dinas yang sudah menggunakan pemohon ini akan kehilangan relasinya (nama menjadi kosong). Lanjutkan?')) return;
    
    try {
      await fetch(`/api/pengaturan/anggota-bidang/${id}`, { method: 'DELETE' });
      fetchAnggota();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8 px-4">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-900 font-black transition-all bg-white border-2 border-slate-900 px-4 py-2 rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Beranda
      </Link>

      <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
        <div className="w-14 h-14 rounded-xl bg-orange-400 border-2 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a]">
          <Users size={28} className="text-slate-900" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">Pengaturan Anggota Bidang</h2>
          <p className="text-sm font-bold text-slate-600 mt-1 uppercase">Kelola daftar pemohon untuk Nota Dinas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white border-4 border-slate-900 rounded-3xl p-6 shadow-[8px_8px_0_0_#0f172a] space-y-4">
            <h3 className="font-black text-slate-900 uppercase border-b-2 border-slate-900 pb-2 mb-4">Tambah Anggota</h3>
            
            {errorMsg && (
              <div className="bg-rose-100 text-rose-900 p-3 rounded-lg text-sm font-bold border-2 border-rose-900">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-900 mb-1 uppercase tracking-wider">Nama Lengkap <span className="text-rose-500">*</span></label>
              <input type="text" name="nama" required className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
            </div>
            
            <div>
              <label className="block text-xs font-black text-slate-900 mb-1 uppercase tracking-wider">NIP</label>
              <input type="text" name="nip" className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 mb-1 uppercase tracking-wider">Jabatan</label>
              <input type="text" name="jabatan" placeholder="Cth: Analis Lingkungan" className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 mb-1 uppercase tracking-wider">Hierarki (Opsional)</label>
              <input type="number" name="hierarki" placeholder="1, 2, 3..." className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
            </div>

            <button type="submit" disabled={submitting} className="w-full mt-4 px-6 py-4 bg-slate-900 text-white font-black rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Simpan Anggota
            </button>
          </form>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white border-4 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0_0_#0f172a]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-4 border-slate-900">
                  <th className="p-4 text-xs font-black text-slate-900 uppercase tracking-widest border-r-2 border-slate-200">Nama / NIP</th>
                  <th className="p-4 text-xs font-black text-slate-900 uppercase tracking-widest border-r-2 border-slate-200">Jabatan</th>
                  <th className="p-4 text-xs font-black text-slate-900 uppercase tracking-widest w-24">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest">
                      <Loader2 size={24} className="animate-spin mx-auto mb-2 text-slate-900" /> Memuat...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest">
                      Belum ada data anggota.
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} className="border-b-2 border-slate-100 hover:bg-slate-50">
                      <td className="p-4 border-r-2 border-slate-100">
                        <p className="font-black text-slate-900 uppercase text-sm">{item.nama}</p>
                        <p className="font-bold text-slate-500 text-xs mt-1">NIP: {item.nip || '-'}</p>
                      </td>
                      <td className="p-4 border-r-2 border-slate-100">
                        <p className="font-bold text-slate-900 text-sm">{item.jabatan || '-'}</p>
                      </td>
                      <td className="p-4">
                        <button onClick={() => handleDelete(item.id)} className="w-8 h-8 flex items-center justify-center bg-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
