'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';

type TimPenilai = {
  id: number;
  nama: string;
  nip: string | null;
  pangkat_golongan: string | null;
  jabatan_dinas: string | null;
  kategori: string | null;
  urutan_hierarki: number;
};

export default function TimPenilaiPage() {
  const [personil, setPersonil] = useState<TimPenilai[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    nama: '',
    nip: '',
    pangkat_golongan: '',
    jabatan_dinas: '',
    kategori: '',
    urutan_hierarki: 99
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pengaturan/tim-penilai');
      const json = await res.json();
      setPersonil(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item?: TimPenilai) => {
    if (item) {
      setEditId(item.id);
      setFormData({
        nama: item.nama,
        nip: item.nip || '',
        pangkat_golongan: item.pangkat_golongan || '',
        jabatan_dinas: item.jabatan_dinas || '',
        kategori: item.kategori || '',
        urutan_hierarki: item.urutan_hierarki || 99
      });
    } else {
      setEditId(null);
      setFormData({
        nama: '',
        nip: '',
        pangkat_golongan: '',
        jabatan_dinas: '',
        kategori: '',
        urutan_hierarki: 99
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await fetch(`/api/pengaturan/tim-penilai/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch('/api/pengaturan/tim-penilai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan data.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    try {
      await fetch(`/api/pengaturan/tim-penilai/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus data.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8 pb-20 px-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border-4 border-slate-900 p-8 rounded-[2rem] shadow-[8px_8px_0_0_#0f172a] relative overflow-hidden">
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-900 text-xs font-black uppercase tracking-widest rounded-lg mb-4 shadow-[2px_2px_0_0_#0f172a] transition-all">
            <ArrowLeft size={14} /> KEMBALI
          </Link>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-2">
            Tim <span className="text-emerald-600">Penilai</span>
          </h1>
          <p className="text-slate-600 text-sm font-bold tracking-wide">
            Kelola daftar personil Tim Penilai Dokumen Lingkungan Hidup.
          </p>
        </div>
        <div className="relative z-10">
          <button 
            onClick={() => handleOpenModal()}
            className="px-5 py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black uppercase tracking-widest text-xs rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] hover:translate-y-1 transition-all border-2 border-slate-900 flex items-center gap-2"
          >
            <Plus size={18} /> Tambah Personil
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border-4 border-slate-900 rounded-2xl shadow-[6px_6px_0_0_#0f172a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-100 border-b-4 border-slate-900">
                <th className="p-4 font-black text-slate-900 uppercase tracking-widest text-sm border-r-2 border-slate-900 w-16 text-center">No</th>
                <th className="p-4 font-black text-slate-900 uppercase tracking-widest text-sm border-r-2 border-slate-900">Nama & NIP</th>
                <th className="p-4 font-black text-slate-900 uppercase tracking-widest text-sm border-r-2 border-slate-900">Kategori</th>
                <th className="p-4 font-black text-slate-900 uppercase tracking-widest text-sm border-r-2 border-slate-900">Jabatan Dinas</th>
                <th className="p-4 font-black text-slate-900 uppercase tracking-widest text-sm text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center font-bold text-slate-500"><LottieLoader size={150} text="MEMUAT DATA..." /></td></tr>
              ) : personil.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center font-bold text-slate-500">Belum ada personil terdaftar.</td></tr>
              ) : (
                personil.map((p, index) => (
                  <tr key={p.id} className="border-b-2 border-slate-900 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-black text-slate-900 border-r-2 border-slate-900 text-center">{index + 1}</td>
                    <td className="p-4 border-r-2 border-slate-900">
                      <div className="font-bold text-slate-900 text-base">{p.nama}</div>
                      {p.nip && <div className="text-xs font-black text-slate-500 mt-1 uppercase tracking-widest">NIP. {p.nip}</div>}
                    </td>
                    <td className="p-4 font-bold text-slate-700 border-r-2 border-slate-900">{p.kategori || '-'}</td>
                    <td className="p-4 font-bold text-slate-700 border-r-2 border-slate-900">{p.jabatan_dinas || '-'}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenModal(p)} className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg border-2 border-amber-700 transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg border-2 border-rose-700 transition-colors" title="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-slate-900 rounded-2xl shadow-[8px_8px_0_0_#0f172a] w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b-4 border-slate-900 bg-emerald-50">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {editId ? 'Edit Personil' : 'Tambah Personil'}
              </h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">Nama Lengkap (beserta gelar)</label>
                <input required type="text" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-400/20 font-bold" placeholder="Cth: Dr. Ir. Budi Santoso, M.T." />
              </div>
              
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">NIP / NIK (Opsional)</label>
                <input type="text" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-400/20 font-bold" placeholder="Cth: 198001012005011001" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">Kategori (Peran)</label>
                  <input type="text" value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-400/20 font-bold" placeholder="Cth: Katim 1 / Kabid" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">Pangkat/Golongan</label>
                  <input type="text" value={formData.pangkat_golongan} onChange={e => setFormData({...formData, pangkat_golongan: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-400/20 font-bold" placeholder="Cth: Penata Tk. I (III/d)" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">Jabatan Dinas</label>
                <input type="text" value={formData.jabatan_dinas} onChange={e => setFormData({...formData, jabatan_dinas: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-400/20 font-bold" placeholder="Cth: Kepala Bidang Perencanaan..." />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">Urutan Hierarki</label>
                <input type="number" value={formData.urutan_hierarki} onChange={e => setFormData({...formData, urutan_hierarki: parseInt(e.target.value) || 99})} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-400/20 font-bold" placeholder="Angka urutan cetak (cth: 1, 2, 3)" />
              </div>

              <div className="pt-6 flex gap-3 border-t-2 border-slate-200 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black uppercase tracking-widest text-xs rounded-xl border-2 border-slate-900 transition-colors">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-3 px-4 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black uppercase tracking-widest text-xs rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] hover:translate-y-1 border-2 border-slate-900 transition-all">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
