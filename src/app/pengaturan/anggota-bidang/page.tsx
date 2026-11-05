'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Search, X, Check, ArrowUpDown } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';
import PengaturanNav from '@/components/PengaturanNav';

interface AnggotaBidang {
  id: string | number;
  nama: string;
  nip: string | null;
  jabatan: string | null;
  hierarki?: string | number | null;
}

export default function AnggotaBidangPage() {
  const [data, setData] = useState<AnggotaBidang[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State untuk Tambah / Edit
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<AnggotaBidang | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    nip: '',
    jabatan: '',
    hierarki: '99'
  });

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

  const handleOpenAdd = () => {
    setEditItem(null);
    setFormData({
      nama: '',
      nip: '',
      jabatan: '',
      hierarki: String(data.length + 1)
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (item: AnggotaBidang) => {
    setEditItem(item);
    setFormData({
      nama: item.nama || '',
      nip: item.nip || '',
      jabatan: item.jabatan || '',
      hierarki: String(item.hierarki || '99')
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      if (editItem) {
        // Mode Update
        const res = await fetch(`/api/pengaturan/anggota-bidang/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Gagal memperbarui data anggota');
        }
      } else {
        // Mode Tambah
        const res = await fetch('/api/pengaturan/anggota-bidang', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Gagal menambah anggota');
        }
      }

      setShowModal(false);
      fetchAnggota();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number, nama: string) => {
    if (!confirm(`Hapus anggota "${nama}"? Catatan: Jika anggota ini sudah pernah digunakan sebagai pemohon Nota Dinas, nama pemohon pada arsip terkait akan terputus relasinya. Lanjutkan?`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/pengaturan/anggota-bidang/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus anggota');
      fetchAnggota();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data');
      console.error(err);
    }
  };

  const filteredData = data.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.nama?.toLowerCase().includes(q) ||
      item.nip?.toLowerCase().includes(q) ||
      item.jabatan?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8 pb-20 px-4">
      {/* Tab Navigasi Pengaturan Terpadu */}
      <PengaturanNav
        title="Pengaturan Anggota Bidang"
        description="Kelola daftar pegawai/personil bidang tata lingkungan sebagai pemohon resmi Nota Dinas & register arsip."
        badge="Master Pemohon Nota Dinas"
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
              placeholder="Cari nama, NIP, atau jabatan anggota..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 placeholder-slate-400 transition-all"
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
              Total: <strong className="text-slate-700">{filteredData.length}</strong> Personil
            </span>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-amber-200 transition-all"
            >
              <Plus size={16} />
              <span>Tambah Anggota</span>
            </button>
          </div>
        </div>

        {/* Tabel Data Anggota Bidang */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider">
                  <th className="px-5 py-4 w-14 text-center">No</th>
                  <th className="px-5 py-4 min-w-[220px]">Nama Lengkap & NIP</th>
                  <th className="px-5 py-4 min-w-[220px]">Jabatan Kedinasan</th>
                  <th className="px-5 py-4 w-28 text-center">Urutan</th>
                  <th className="px-5 py-4 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <LottieLoader size={120} text="MEMUAT DATA ANGGOTA..." />
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users size={32} className="text-slate-300" />
                        <p className="font-bold text-sm text-slate-600">
                          {searchQuery ? 'Tidak ada anggota yang cocok dengan kata kunci.' : 'Belum ada data anggota bidang.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-5 py-4 text-center font-bold text-slate-400 text-xs">
                        {index + 1}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900 text-sm">{item.nama}</p>
                        <p className="text-xs font-bold text-slate-500 mt-0.5 font-mono">
                          {item.nip ? `NIP. ${item.nip}` : 'NIP. -'}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-700 text-xs sm:text-sm">
                          {item.jabatan || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-xs font-bold rounded-md">
                          #{item.hierarki ?? index + 1}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-2 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                            title="Edit Data Anggota"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.nama)}
                            className="p-2 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                            title="Hapus Anggota"
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

      {/* Modal Popup: Tambah / Edit Anggota */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-amber-50/70 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                  {editItem ? 'Edit Personil' : 'Tambah Baru'}
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                  {editItem ? 'Ubah Data Anggota Bidang' : 'Tambah Anggota Bidang'}
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap (Beserta Gelar) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Cth: Ir. Bambang Hermanto, M.Si."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900"
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
                  placeholder="Cth: 198402122008011002"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Jabatan Kedinasan
                </label>
                <input
                  type="text"
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  placeholder="Cth: Analis Kebijakan Ahli Muda / Pengendali Dampak Lingkungan"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Urutan Prioritas / Hierarki
                </label>
                <input
                  type="number"
                  value={formData.hierarki}
                  onChange={(e) => setFormData({ ...formData, hierarki: e.target.value })}
                  placeholder="1, 2, 3..."
                  className="w-32 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900"
                />
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  Urutan angka lebih kecil ditampilkan lebih atas di pilihan Nota Dinas.
                </p>
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
                  className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black uppercase tracking-wider text-xs rounded-xl shadow-md shadow-amber-200 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <LottieLoader size={20} /> : <Check size={16} />}
                  <span>{editItem ? 'Simpan Perubahan' : 'Tambah Anggota'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
