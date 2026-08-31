'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

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
    kategori: 'Petugas MPP',
    urutan_hierarki: 13
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pengaturan/tim-penilai?hierarki=13');
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
        kategori: item.kategori || 'Petugas MPP',
        urutan_hierarki: item.urutan_hierarki || 13
      });
    } else {
      setEditId(null);
      setFormData({
        nama: '',
        nip: '',
        pangkat_golongan: '',
        jabatan_dinas: '',
        kategori: 'Petugas MPP',
        urutan_hierarki: 13
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-surface border border-outline-variant p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-low hover:bg-surface-container border border-outline-variant text-on-surface text-xs font-bold uppercase tracking-widest rounded-lg mb-4 shadow-sm hover:shadow-md transition-shadow transition-all">
            <ArrowLeft size={14} /> KEMBALI
          </Link>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-on-surface mb-2">
            Petugas <span className="text-secondary">MPP</span>
          </h1>
          <p className="text-on-surface-variant text-sm font-bold tracking-wide">
            Kelola daftar personil jaga loket Mal Pelayanan Publik (MPP).
          </p>
        </div>
        <div className="relative z-10">
          <button 
            onClick={() => handleOpenModal()}
            className="px-5 py-3 bg-secondary text-on-secondary hover:bg-emerald-300 text-on-surface font-bold uppercase tracking-widest text-xs rounded-xl shadow-sm hover:shadow-md transition-shadow hover:shadow-sm hover:shadow-md transition-shadow hover:translate-y-1 transition-all border border-outline-variant flex items-center gap-2"
          >
            <Plus size={18} /> Tambah Personil
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low border-b-4 border-outline-variant">
                <th className="p-4 font-bold text-on-surface uppercase tracking-widest text-sm border-r border-outline-variant w-16 text-center">No</th>
                <th className="p-4 font-bold text-on-surface uppercase tracking-widest text-sm border-r border-outline-variant">Nama & NIP</th>
                <th className="p-4 font-bold text-on-surface uppercase tracking-widest text-sm border-r border-outline-variant">Kategori</th>
                <th className="p-4 font-bold text-on-surface uppercase tracking-widest text-sm border-r border-outline-variant">Jabatan Dinas</th>
                <th className="p-4 font-bold text-on-surface uppercase tracking-widest text-sm text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center font-bold text-on-surface-variant"><LottieLoader size={150} text="MEMUAT DATA..." /></td></tr>
              ) : personil.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center font-bold text-on-surface-variant">Belum ada personil terdaftar.</td></tr>
              ) : (
                personil.map((p, index) => (
                  <tr key={p.id} className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors">
                    <td className="p-4 font-bold text-on-surface border-r border-outline-variant text-center">{index + 1}</td>
                    <td className="p-4 border-r border-outline-variant">
                      <div className="font-bold text-on-surface text-base">{p.nama}</div>
                      {p.nip && <div className="text-xs font-bold text-on-surface-variant mt-1 uppercase tracking-widest">NIP. {p.nip}</div>}
                    </td>
                    <td className="p-4 font-bold text-on-surface-variant border-r border-outline-variant">{p.kategori || '-'}</td>
                    <td className="p-4 font-bold text-on-surface-variant border-r border-outline-variant">{p.jabatan_dinas || '-'}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenModal(p)} className="p-2 bg-tertiary-container text-on-tertiary-container hover:bg-amber-200 text-amber-700 rounded-lg border border-amber-200 transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 bg-error-container text-on-error-container hover:bg-rose-200 text-rose-700 rounded-lg border border-rose-200 transition-colors" title="Hapus">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary text-on-primary/50 backdrop-blur-sm p-4">
          <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm hover:shadow-md transition-shadow w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b-4 border-outline-variant bg-secondary-container">
              <h2 className="text-2xl font-bold text-on-surface tracking-tight">
                {editId ? 'Edit Personil' : 'Tambah Personil'}
              </h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Nama Lengkap (beserta gelar)</label>
                <input required type="text" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-400/20 font-bold" placeholder="Cth: Dr. Ir. Budi Santoso, M.T." />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">NIP / NIK (Opsional)</label>
                <input type="text" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-400/20 font-bold" placeholder="Cth: 198001012005011001" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Kategori (Peran)</label>
                  <input type="text" value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})} className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-400/20 font-bold" placeholder="Cth: Katim 1 / Kabid" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Pangkat/Golongan</label>
                  <input type="text" value={formData.pangkat_golongan} onChange={e => setFormData({...formData, pangkat_golongan: e.target.value})} className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-400/20 font-bold" placeholder="Cth: Penata Tk. I (III/d)" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Jabatan Dinas</label>
                <input type="text" value={formData.jabatan_dinas} onChange={e => setFormData({...formData, jabatan_dinas: e.target.value})} className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-400/20 font-bold" placeholder="Cth: Kepala Bidang Perencanaan..." />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Urutan Hierarki</label>
                <input type="number" value={formData.urutan_hierarki} onChange={e => setFormData({...formData, urutan_hierarki: parseInt(e.target.value) || 99})} className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-400/20 font-bold" placeholder="Angka urutan cetak (cth: 1, 2, 3)" />
              </div>

              <div className="pt-6 flex gap-3 border-t-2 border-outline-variant mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 px-4 bg-surface-container-low hover:bg-surface-container text-on-surface font-bold uppercase tracking-widest text-xs rounded-xl border border-outline-variant transition-colors">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-3 px-4 bg-secondary text-on-secondary hover:bg-emerald-300 text-on-surface font-bold uppercase tracking-widest text-xs rounded-xl shadow-sm hover:shadow-md transition-shadow hover:shadow-sm hover:shadow-md transition-shadow hover:translate-y-1 border border-outline-variant transition-all">
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
