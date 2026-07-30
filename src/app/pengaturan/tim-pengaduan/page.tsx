'use client';
import LottieLoader from '@/components/LottieLoader';


import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';

type TimPengaduan = {
  id: number;
  nama: string;
  nip: string | null;
  pangkat_golongan: string | null;
  jabatan_dinas: string | null;
  kategori: string | null;
  urutan_hierarki: number;
};

export default function TimPengaduanPage() {
  const [personil, setPersonil] = useState<TimPengaduan[]>([]);
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
      const res = await fetch('/api/pengaturan/tim-pengaduan', { cache: 'no-store' });
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

  const handleOpenModal = (item?: TimPengaduan) => {
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
        await fetch(`/api/pengaturan/tim-pengaduan/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch('/api/pengaturan/tim-pengaduan', {
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
      await fetch(`/api/pengaturan/tim-pengaduan/${id}`, {
        method: 'DELETE'
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus data.');
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest p-6 lg:p-12">
      <div className="w-full py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-12 h-12 rounded-xl bg-surface text-on-surface border border-outline-variant flex items-center justify-center hover:bg-teal-400 hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all shrink-0">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-on-surface uppercase">Pengaturan Tim Pengaduan</h2>
              <p className="text-sm font-bold text-on-surface-variant mt-1">Kelola data personil Pengaduan lapangan.</p>
            </div>
          </div>
          
          <button onClick={() => handleOpenModal()} className="bg-teal-400 hover:bg-teal-500 text-on-surface px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest border border-outline-variant shadow-sm hover:shadow-md transition-shadow hover:shadow-sm hover:shadow-md transition-shadow hover:translate-y-1 transition-all flex items-center gap-2">
            <Plus size={20} /> Tambah Personil
          </button>
        </div>

        {/* List Data Pengaduan */}
        <div className="bg-surface rounded-3xl border border-outline-variant overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-teal-400 p-4 border-b-4 border-outline-variant font-bold text-on-surface uppercase tracking-widest text-center">
            Daftar Tim Pengaduan
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low text-on-surface font-bold border-b-4 border-outline-variant">
                <tr>
                  <th className="p-5 uppercase text-xs tracking-widest w-12 text-center whitespace-nowrap">No</th>
                  <th className="p-5 uppercase text-xs tracking-widest whitespace-nowrap">Nama & NIP</th>
                  <th className="p-5 uppercase text-xs tracking-widest whitespace-nowrap">Pangkat / Golongan</th>
                  <th className="p-5 uppercase text-xs tracking-widest whitespace-nowrap">Jabatan</th>
                  <th className="p-5 uppercase text-xs tracking-widest whitespace-nowrap text-center">Hierarki</th>
                  <th className="p-5 uppercase text-xs tracking-widest whitespace-nowrap text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y-4 divide-slate-900">
                {loading ? (
                  <tr><td colSpan={6} className="p-10 text-center font-bold text-on-surface uppercase"><LottieLoader size={150} text="MEMUAT DATA..." /></td></tr>
                ) : personil.length === 0 ? (
                  <tr><td colSpan={6} className="p-10 text-center text-on-surface-variant font-bold uppercase tracking-widest">Belum ada data tim Pengaduan.</td></tr>
                ) : (
                  personil.map((item, index) => (
                    <tr key={item.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="p-5 text-center font-bold text-slate-400 text-base">{index + 1}</td>
                      <td className="p-5">
                        <div className="font-bold text-on-surface">{item.nama}</div>
                        <div className="text-xs font-bold text-on-surface-variant mt-1">{item.nip || '-'}</div>
                      </td>
                      <td className="p-5 font-bold text-on-surface-variant">{item.pangkat_golongan || '-'}</td>
                      <td className="p-5 font-bold text-on-surface-variant">{item.jabatan_dinas || '-'}</td>
                      <td className="p-5 text-center font-bold text-on-surface">{item.urutan_hierarki || '-'}</td>
                      <td className="p-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleOpenModal(item)} className="p-2 bg-indigo-200 text-indigo-900 border border-indigo-200 rounded-xl hover:bg-indigo-400 transition-all">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 bg-rose-200 text-rose-900 border border-rose-200 rounded-xl hover:bg-error text-on-error transition-all">
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

      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary text-on-primary/50 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant rounded-3xl w-full max-w-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-surface-container-low border-b-4 border-outline-variant flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-on-surface uppercase">{editId ? 'Edit Personil' : 'Tambah Personil'}</h3>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-2">Nama Lengkap (beserta gelar) <span className="text-error">*</span></label>
                <input type="text" required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 font-bold text-on-surface focus:outline-none focus:ring-4 focus:ring-teal-300" placeholder="Contoh: Dr. Agus, S.T., M.T." />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-2">NIP</label>
                <input type="text" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 font-bold text-on-surface focus:outline-none focus:ring-4 focus:ring-teal-300" placeholder="Contoh: 19800101 200501 1 001" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-2">Pangkat / Golongan</label>
                <input type="text" value={formData.pangkat_golongan} onChange={e => setFormData({...formData, pangkat_golongan: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 font-bold text-on-surface focus:outline-none focus:ring-4 focus:ring-teal-300" placeholder="Contoh: Pembina / IVa" />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-2">Jabatan</label>
                <input type="text" value={formData.jabatan_dinas} onChange={e => setFormData({...formData, jabatan_dinas: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 font-bold text-on-surface focus:outline-none focus:ring-4 focus:ring-teal-300" placeholder="Contoh: Pengaduan Lingkungan Hidup Ahli Muda" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-2">Urutan Hierarki (1 = Ketua)</label>
                <input type="number" value={formData.urutan_hierarki} onChange={e => setFormData({...formData, urutan_hierarki: parseInt(e.target.value) || 99})} className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 font-bold text-on-surface focus:outline-none focus:ring-4 focus:ring-teal-300" placeholder="Contoh: 1" />
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-teal-400 hover:bg-teal-500 text-on-surface px-6 py-4 rounded-xl text-sm font-bold uppercase tracking-widest border border-outline-variant shadow-sm hover:shadow-md transition-shadow hover:shadow-sm hover:shadow-md transition-shadow hover:translate-y-1 transition-all">
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
