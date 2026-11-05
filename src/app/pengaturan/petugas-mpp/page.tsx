'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Store, Search, X, Check } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';
import PengaturanNav from '@/components/PengaturanNav';

interface PetugasMPP {
  id: number;
  nama: string;
  nip: string | null;
  jabatan_dinas: string | null;
  updated_at?: string;
}

export default function PengaturanPetugasMppPage() {
  const [personil, setPersonil] = useState<PetugasMPP[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    nama: '',
    nip: '',
    jabatan_dinas: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pengaturan/petugas-mpp');
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

  const handleOpenModal = (item?: PetugasMPP) => {
    if (item) {
      setEditId(item.id);
      setFormData({
        nama: item.nama,
        nip: item.nip || '',
        jabatan_dinas: item.jabatan_dinas || ''
      });
    } else {
      setEditId(null);
      setFormData({
        nama: '',
        nip: '',
        jabatan_dinas: ''
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        const res = await fetch(`/api/pengaturan/petugas-mpp/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error('Gagal memperbarui data');
      } else {
        const res = await fetch('/api/pengaturan/petugas-mpp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error('Gagal menyimpan data');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan data petugas.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus petugas "${nama}" dari daftar jaga MPP?`)) return;
    try {
      const res = await fetch(`/api/pengaturan/petugas-mpp/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus data.');
    }
  };

  const filteredPersonil = personil.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.nama.toLowerCase().includes(q) ||
      (p.nip && p.nip.toLowerCase().includes(q)) ||
      (p.jabatan_dinas && p.jabatan_dinas.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8 pb-20 px-4">
      {/* Tab Navigasi Pengaturan Terpadu */}
      <PengaturanNav
        title="Pengaturan Petugas MPP"
        description="Kelola daftar personil piket loket DLH pada Mal Pelayanan Publik (MPP) untuk jadwal pelayanan bulanan."
        badge="Master Piket Loket MPP"
      />

      {/* Main Content Card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header Aksi: Cari & Tambah */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, NIP, atau jabatan dinas..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 text-slate-800 placeholder-slate-400 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 hidden md:inline">
              Total: <strong className="text-slate-700">{filteredPersonil.length}</strong> Petugas
            </span>
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-purple-200 transition-all"
            >
              <Plus size={16} />
              <span>Tambah Petugas</span>
            </button>
          </div>
        </div>

        {/* Tabel Data Petugas MPP */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider">
                  <th className="px-5 py-4 w-14 text-center">No</th>
                  <th className="px-5 py-4 min-w-[220px]">Nama Petugas & NIP</th>
                  <th className="px-5 py-4 min-w-[220px]">Jabatan Dinas</th>
                  <th className="px-5 py-4 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <LottieLoader size={120} text="MEMUAT DATA PETUGAS MPP..." />
                    </td>
                  </tr>
                ) : filteredPersonil.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Store size={32} className="text-slate-300" />
                        <p className="font-bold text-sm text-slate-600">
                          {searchQuery ? 'Tidak ada petugas yang cocok dengan kata kunci.' : 'Belum ada data petugas MPP.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPersonil.map((p, index) => (
                    <tr key={p.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="px-5 py-4 text-center font-bold text-slate-400 text-xs">
                        {index + 1}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900 text-sm">{p.nama}</p>
                        <p className="text-xs font-bold text-slate-500 mt-0.5 font-mono">
                          {p.nip ? `NIP. ${p.nip}` : 'NIP. -'}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-700 text-xs sm:text-sm">
                          {p.jabatan_dinas || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(p)}
                            className="p-2 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                            title="Edit Petugas"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.nama)}
                            className="p-2 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                            title="Hapus Petugas"
                          >
                            <Trash2 size={14} />
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
      </div>

      {/* Modal Popup: Tambah / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-purple-50/70 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                  {editId ? 'Edit Personil' : 'Tambah Baru'}
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                  {editId ? 'Ubah Petugas Jaga MPP' : 'Tambah Petugas Jaga MPP'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap (Beserta Gelar) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Cth: Suwandi, S.Sos."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  NIP / Identitas Pegawai (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  placeholder="Cth: 198205152006041009"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Jabatan Kedinasan
                </label>
                <input
                  type="text"
                  value={formData.jabatan_dinas}
                  onChange={(e) => setFormData({ ...formData, jabatan_dinas: e.target.value })}
                  placeholder="Cth: Pengelola Data Pelayanan Lingkungan"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 text-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider text-xs rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black uppercase tracking-wider text-xs rounded-xl shadow-md shadow-purple-200 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <LottieLoader size={20} /> : <Check size={16} />}
                  <span>{editId ? 'Simpan Perubahan' : 'Tambah Petugas'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
