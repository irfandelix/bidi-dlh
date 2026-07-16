'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';

type TimPengawas = {
  id: number;
  nama: string;
  nip: string | null;
  pangkat_golongan: string | null;
  jabatan_dinas: string | null;
  kategori: string | null;
  urutan_hierarki: number;
};

export default function TimPengawasPage() {
  const [personil, setPersonil] = useState<TimPengawas[]>([]);
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
      const res = await fetch('/api/pengaturan/tim-pengawas');
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

  const handleOpenModal = (item?: TimPengawas) => {
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
        await fetch(`/api/pengaturan/tim-pengawas/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch('/api/pengaturan/tim-pengawas', {
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
      await fetch(`/api/pengaturan/tim-pengawas/${id}`, {
        method: 'DELETE'
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus data.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-12">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-12 h-12 rounded-xl bg-white text-slate-900 border-4 border-slate-900 flex items-center justify-center hover:bg-teal-400 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#0f172a] transition-all shrink-0">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Pengaturan Tim Pengawas</h2>
              <p className="text-sm font-bold text-slate-600 mt-1">Kelola data personil pengawas lapangan.</p>
            </div>
          </div>
          
          <button onClick={() => handleOpenModal()} className="bg-teal-400 hover:bg-teal-500 text-slate-900 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] hover:translate-y-1 transition-all flex items-center gap-2">
            <Plus size={20} /> Tambah Personil
          </button>
        </div>

        {/* List Data Pengawas */}
        <div className="bg-white rounded-3xl border-4 border-slate-900 overflow-hidden shadow-[12px_12px_0_0_#0f172a]">
          <div className="bg-teal-400 p-4 border-b-4 border-slate-900 font-black text-slate-900 uppercase tracking-widest text-center">
            Daftar Tim Pengawas
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-900 font-black border-b-4 border-slate-900">
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
                  <tr><td colSpan={6} className="p-10 text-center font-black text-slate-900 uppercase">Memuat...</td></tr>
                ) : personil.filter(p => !p.kategori || p.kategori === 'Tim Pengawas').length === 0 ? (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest">Belum ada data tim pengawas.</td></tr>
                ) : (
                  personil.filter(p => !p.kategori || p.kategori === 'Tim Pengawas').map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-5 text-center font-black text-slate-400 text-base">{index + 1}</td>
                      <td className="p-5">
                        <div className="font-black text-slate-900">{item.nama}</div>
                        <div className="text-xs font-bold text-slate-500 mt-1">{item.nip || '-'}</div>
                      </td>
                      <td className="p-5 font-bold text-slate-700">{item.pangkat_golongan || '-'}</td>
                      <td className="p-5 font-bold text-slate-700">{item.jabatan_dinas || '-'}</td>
                      <td className="p-5 text-center font-black text-slate-900">{item.urutan_hierarki || '-'}</td>
                      <td className="p-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleOpenModal(item)} className="p-2 bg-indigo-200 text-indigo-900 border-2 border-indigo-900 rounded-xl hover:bg-indigo-400 transition-all">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 bg-rose-200 text-rose-900 border-2 border-rose-900 rounded-xl hover:bg-rose-400 transition-all">
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

        {/* List Data Saksi */}
        <div className="bg-white rounded-3xl border-4 border-slate-900 overflow-hidden shadow-[12px_12px_0_0_#0f172a]">
          <div className="bg-indigo-300 p-4 border-b-4 border-slate-900 font-black text-slate-900 uppercase tracking-widest text-center">
            Daftar Saksi
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-900 font-black border-b-4 border-slate-900">
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
                  <tr><td colSpan={6} className="p-10 text-center font-black text-slate-900 uppercase">Memuat...</td></tr>
                ) : personil.filter(p => p.kategori === 'Saksi').length === 0 ? (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest">Belum ada data saksi.</td></tr>
                ) : (
                  personil.filter(p => p.kategori === 'Saksi').map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-5 text-center font-black text-slate-400 text-base">{index + 1}</td>
                      <td className="p-5">
                        <div className="font-black text-slate-900">{item.nama}</div>
                        <div className="text-xs font-bold text-slate-500 mt-1">{item.nip || '-'}</div>
                      </td>
                      <td className="p-5 font-bold text-slate-700">{item.pangkat_golongan || '-'}</td>
                      <td className="p-5 font-bold text-slate-700">{item.jabatan_dinas || '-'}</td>
                      <td className="p-5 text-center font-black text-slate-900">{item.urutan_hierarki || '-'}</td>
                      <td className="p-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleOpenModal(item)} className="p-2 bg-indigo-200 text-indigo-900 border-2 border-indigo-900 rounded-xl hover:bg-indigo-400 transition-all">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 bg-rose-200 text-rose-900 border-2 border-rose-900 rounded-xl hover:bg-rose-400 transition-all">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border-4 border-slate-900 rounded-3xl w-full max-w-lg shadow-[12px_12px_0_0_#0f172a] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-100 border-b-4 border-slate-900 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-black text-slate-900 uppercase">{editId ? 'Edit Personil' : 'Tambah Personil'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-900 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase mb-2">Kategori <span className="text-rose-500">*</span></label>
                <select required value={formData.kategori || 'Tim Pengawas'} onChange={e => setFormData({...formData, kategori: e.target.value})} className="w-full bg-white border-4 border-slate-900 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-teal-300">
                  <option value="Tim Pengawas">Tim Pengawas</option>
                  <option value="Saksi">Saksi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 uppercase mb-2">Nama Lengkap (beserta gelar) <span className="text-rose-500">*</span></label>
                <input type="text" required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full bg-white border-4 border-slate-900 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-teal-300" placeholder="Contoh: Dr. Agus, S.T., M.T." />
              </div>
              
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase mb-2">NIP</label>
                <input type="text" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} className="w-full bg-white border-4 border-slate-900 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-teal-300" placeholder="Contoh: 19800101 200501 1 001" />
              </div>
              
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase mb-2">Pangkat / Golongan</label>
                <input type="text" value={formData.pangkat_golongan} onChange={e => setFormData({...formData, pangkat_golongan: e.target.value})} className="w-full bg-white border-4 border-slate-900 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-teal-300" placeholder="Contoh: Pembina / IVa" />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 uppercase mb-2">Jabatan</label>
                <input type="text" value={formData.jabatan_dinas} onChange={e => setFormData({...formData, jabatan_dinas: e.target.value})} className="w-full bg-white border-4 border-slate-900 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-teal-300" placeholder="Contoh: Pengawas Lingkungan Hidup Ahli Muda" />
              </div>
              
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase mb-2">Urutan Hierarki (1 = Ketua)</label>
                <input type="number" value={formData.urutan_hierarki} onChange={e => setFormData({...formData, urutan_hierarki: parseInt(e.target.value) || 99})} className="w-full bg-white border-4 border-slate-900 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-teal-300" placeholder="Contoh: 1" />
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-teal-400 hover:bg-teal-500 text-slate-900 px-6 py-4 rounded-xl text-sm font-black uppercase tracking-widest border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] hover:translate-y-1 transition-all">
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
