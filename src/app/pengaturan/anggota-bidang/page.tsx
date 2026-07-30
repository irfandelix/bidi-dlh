'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, ArrowLeft, Loader2, Trash2, Users } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

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
    <div className="w-full py-8 space-y-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-on-surface font-bold transition-all bg-surface border border-outline-variant px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Beranda
      </Link>

      <div className="flex items-center gap-4 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
        <div className="w-14 h-14 rounded-xl bg-orange-400 border border-outline-variant flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
          <Users size={28} className="text-on-surface" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface uppercase">Pengaturan Anggota Bidang</h2>
          <p className="text-sm font-bold text-on-surface-variant mt-1 uppercase">Kelola daftar pemohon untuk Nota Dinas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <form onSubmit={handleSubmit} className="bg-surface border border-outline-variant rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <h3 className="font-bold text-on-surface uppercase border-b border-outline-variant pb-2 mb-4">Tambah Anggota</h3>
            
            {errorMsg && (
              <div className="bg-error-container text-on-error-container text-rose-900 p-3 rounded-lg text-sm font-bold border border-rose-200">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1 uppercase tracking-wider">Nama Lengkap <span className="text-error">*</span></label>
              <input type="text" name="nama" required className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-bold rounded-xl px-4 py-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1 uppercase tracking-wider">NIP</label>
              <input type="text" name="nip" className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-bold rounded-xl px-4 py-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1 uppercase tracking-wider">Jabatan</label>
              <input type="text" name="jabatan" placeholder="Cth: Analis Lingkungan" className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-bold rounded-xl px-4 py-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1 uppercase tracking-wider">Hierarki (Opsional)</label>
              <input type="number" name="hierarki" placeholder="1, 2, 3..." className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface text-sm font-bold rounded-xl px-4 py-3 focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none" />
            </div>

            <button type="submit" disabled={submitting} className="w-full mt-4 px-6 py-4 bg-primary text-on-primary text-on-primary font-bold rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
              {submitting ? <LottieLoader size={24} /> : <Plus size={16} />}
              Simpan Anggota
            </button>
          </form>
        </div>

        <div className="md:col-span-2">
          <div className="bg-surface border border-outline-variant rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b-4 border-outline-variant">
                  <th className="p-4 text-xs font-bold text-on-surface uppercase tracking-widest border-r-2 border-outline-variant">Nama / NIP</th>
                  <th className="p-4 text-xs font-bold text-on-surface uppercase tracking-widest border-r-2 border-outline-variant">Jabatan</th>
                  <th className="p-4 text-xs font-bold text-on-surface uppercase tracking-widest w-24">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-on-surface-variant font-bold uppercase tracking-widest"><LottieLoader size={150} text="MEMUAT DATA..." /></td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-on-surface-variant font-bold uppercase tracking-widest">
                      Belum ada data anggota.
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} className="border-b-2 border-slate-100 hover:bg-surface-container-lowest">
                      <td className="p-4 border-r-2 border-slate-100">
                        <p className="font-bold text-on-surface uppercase text-sm">{item.nama}</p>
                        <p className="font-bold text-on-surface-variant text-xs mt-1">NIP: {item.nip || '-'}</p>
                      </td>
                      <td className="p-4 border-r-2 border-slate-100">
                        <p className="font-bold text-on-surface text-sm">{item.jabatan || '-'}</p>
                      </td>
                      <td className="p-4">
                        <button onClick={() => handleDelete(item.id)} className="w-8 h-8 flex items-center justify-center bg-error-container text-on-error-container text-error hover:bg-rose-600 hover:text-on-primary rounded-lg transition-colors">
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
