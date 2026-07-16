'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, ShieldCheck, User, Save, Loader2, X } from 'lucide-react';

const supabase = createClient();

type Pegawai = {
  id: number;
  nama: string;
  nip: string;
  pangkat_golongan: string;
  jabatan_dinas: string;
  kategori: string | null;
};

export default function ManajemenTim() {
  const [pegawai, setPegawai] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Pegawai>>({
    nama: '',
    nip: '',
    pangkat_golongan: '',
    jabatan_dinas: '',
    kategori: 'Tim Pengawas'
  });

  const fetchPegawai = async () => {
    setLoading(true);
    const { data } = await supabase.from('tim_pengawas').select('*').order('nama');
    if (data) setPegawai(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPegawai();
  }, []);

  const handleOpenModal = (p?: Pegawai) => {
    if (p) {
      setFormData(p);
    } else {
      setFormData({
        nama: '',
        nip: '',
        pangkat_golongan: '',
        jabatan_dinas: '',
        kategori: 'Tim Pengawas'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (formData.id) {
        // Update
        await supabase.from('tim_pengawas').update(formData as any).eq('id', formData.id);
      } else {
        // Insert
        await supabase.from('tim_pengawas').insert([formData as any]);
      }
      await fetchPegawai();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, nama: string) => {
    if (confirm(`Yakin ingin menghapus ${nama}?`)) {
      await supabase.from('tim_pengawas').delete().eq('id', id);
      await fetchPegawai();
    }
  };

  const pengawas = pegawai.filter(p => !p.kategori || p.kategori === 'Tim Pengawas');
  const saksi = pegawai.filter(p => p.kategori === 'Saksi');

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="bg-white border-4 border-slate-900 rounded-[2rem] p-6 md:p-8 shadow-[8px_8px_0_0_#0f172a] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Link href="/pengawasan" className="w-14 h-14 shrink-0 bg-teal-400 text-slate-900 rounded-2xl border-4 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a] hover:bg-teal-500 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all">
              <ArrowLeft size={28} />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Manajemen Tim</h1>
              <p className="text-sm font-bold text-slate-600 mt-1">Kelola data pegawai DLH untuk Pengawas dan Saksi.</p>
            </div>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-sm uppercase tracking-widest border-[3px] border-slate-900 rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all whitespace-nowrap"
          >
            <Plus size={20} /> Tambah Pegawai
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 font-black text-slate-400 animate-pulse">Memuat data...</div>
        ) : (
          <div className="space-y-8">
            
            {/* TABEL TIM PENGAWAS */}
            <div className="bg-white border-4 border-slate-900 rounded-[2rem] shadow-[8px_8px_0_0_#0f172a] overflow-hidden">
              <div className="bg-teal-400 p-6 border-b-4 border-slate-900 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white border-[3px] border-slate-900 flex items-center justify-center shadow-[2px_2px_0_0_#0f172a]">
                  <ShieldCheck size={24} className="text-teal-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Daftar Tim Pengawas</h2>
              </div>
              
              <div className="overflow-x-auto p-6 md:p-8">
                <table className="w-full text-sm text-left border-4 border-slate-900 rounded-xl">
                  <thead className="text-xs text-slate-900 uppercase bg-slate-100 border-b-4 border-slate-900 font-black tracking-widest">
                    <tr>
                      <th className="px-6 py-4 border-r-4 border-slate-900">Nama</th>
                      <th className="px-6 py-4 border-r-4 border-slate-900">NIP</th>
                      <th className="px-6 py-4 border-r-4 border-slate-900">Golongan / Jabatan</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pengawas.length > 0 ? pengawas.map((p, idx) => (
                      <tr key={p.id} className={`border-b-2 border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} last:border-b-0`}>
                        <td className="px-6 py-4 font-bold text-slate-900 border-r-4 border-slate-900 uppercase">{p.nama}</td>
                        <td className="px-6 py-4 font-medium text-slate-700 border-r-4 border-slate-900">{p.nip || '-'}</td>
                        <td className="px-6 py-4 text-slate-700 border-r-4 border-slate-900">
                          <div className="font-bold">{p.pangkat_golongan || '-'}</div>
                          <div className="text-xs mt-1">{p.jabatan_dinas || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleOpenModal(p)} className="p-2 bg-amber-300 hover:bg-amber-400 border-2 border-slate-900 rounded-lg shadow-[2px_2px_0_0_#0f172a] transition-all">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(p.id, p.nama)} className="p-2 bg-rose-400 hover:bg-rose-500 text-white border-2 border-slate-900 rounded-lg shadow-[2px_2px_0_0_#0f172a] transition-all">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="px-6 py-10 text-center font-bold text-slate-400">Belum ada data Pengawas.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TABEL SAKSI */}
            <div className="bg-white border-4 border-slate-900 rounded-[2rem] shadow-[8px_8px_0_0_#0f172a] overflow-hidden">
              <div className="bg-indigo-300 p-6 border-b-4 border-slate-900 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white border-[3px] border-slate-900 flex items-center justify-center shadow-[2px_2px_0_0_#0f172a]">
                  <User size={24} className="text-indigo-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Daftar Saksi</h2>
              </div>
              
              <div className="overflow-x-auto p-6 md:p-8">
                <table className="w-full text-sm text-left border-4 border-slate-900 rounded-xl">
                  <thead className="text-xs text-slate-900 uppercase bg-slate-100 border-b-4 border-slate-900 font-black tracking-widest">
                    <tr>
                      <th className="px-6 py-4 border-r-4 border-slate-900">Nama</th>
                      <th className="px-6 py-4 border-r-4 border-slate-900">NIP</th>
                      <th className="px-6 py-4 border-r-4 border-slate-900">Golongan / Jabatan</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saksi.length > 0 ? saksi.map((p, idx) => (
                      <tr key={p.id} className={`border-b-2 border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} last:border-b-0`}>
                        <td className="px-6 py-4 font-bold text-slate-900 border-r-4 border-slate-900 uppercase">{p.nama}</td>
                        <td className="px-6 py-4 font-medium text-slate-700 border-r-4 border-slate-900">{p.nip || '-'}</td>
                        <td className="px-6 py-4 text-slate-700 border-r-4 border-slate-900">
                          <div className="font-bold">{p.pangkat_golongan || '-'}</div>
                          <div className="text-xs mt-1">{p.jabatan_dinas || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleOpenModal(p)} className="p-2 bg-amber-300 hover:bg-amber-400 border-2 border-slate-900 rounded-lg shadow-[2px_2px_0_0_#0f172a] transition-all">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(p.id, p.nama)} className="p-2 bg-rose-400 hover:bg-rose-500 text-white border-2 border-slate-900 rounded-lg shadow-[2px_2px_0_0_#0f172a] transition-all">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="px-6 py-10 text-center font-bold text-slate-400">Belum ada data Saksi.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border-4 border-slate-900 rounded-[2rem] shadow-[12px_12px_0_0_#0f172a] w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b-4 border-slate-900 flex justify-between items-center bg-slate-100">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">{formData.id ? 'Edit Pegawai' : 'Tambah Pegawai'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-rose-100 text-slate-900 hover:text-rose-600 rounded-xl transition-colors">
                <X size={24} strokeWidth={3} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Pilih Kategori <span className="text-rose-600">*</span></label>
                <select 
                  required
                  value={formData.kategori || 'Tim Pengawas'}
                  onChange={e => setFormData({...formData, kategori: e.target.value})}
                  className="w-full bg-slate-50 border-4 border-slate-900 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-amber-300"
                >
                  <option value="Tim Pengawas">Tim Pengawas</option>
                  <option value="Saksi">Saksi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Nama Lengkap & Gelar <span className="text-rose-600">*</span></label>
                <input 
                  type="text" required
                  value={formData.nama}
                  onChange={e => setFormData({...formData, nama: e.target.value})}
                  className="w-full bg-slate-50 border-4 border-slate-900 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-amber-300"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2">NIP</label>
                <input 
                  type="text"
                  value={formData.nip || ''}
                  onChange={e => setFormData({...formData, nip: e.target.value})}
                  className="w-full bg-slate-50 border-4 border-slate-900 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-amber-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Pangkat / Golongan</label>
                  <input 
                    type="text"
                    value={formData.pangkat_golongan || ''}
                    onChange={e => setFormData({...formData, pangkat_golongan: e.target.value})}
                    className="w-full bg-slate-50 border-4 border-slate-900 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-amber-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Jabatan</label>
                  <input 
                    type="text"
                    value={formData.jabatan_dinas || ''}
                    onChange={e => setFormData({...formData, jabatan_dinas: e.target.value})}
                    className="w-full bg-slate-50 border-4 border-slate-900 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-amber-300"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-black text-sm uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-colors">Batal</button>
                <button type="submit" disabled={saving} className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl font-black text-sm uppercase tracking-widest border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:translate-y-1 hover:shadow-[2px_2px_0_0_#0f172a] transition-all disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
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
