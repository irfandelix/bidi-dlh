'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Calendar, MapPin, Building2, User, Edit3, Database } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function BuatAgenda() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dokumens, setDokumens] = useState<any[]>([]);
  const [pegawai, setPegawai] = useState<any[]>([]);
  const [tab, setTab] = useState<'manual' | 'db'>('manual');
  
  const [formData, setFormData] = useState({
    tanggal_kunjungan: new Date().toISOString().split('T')[0],
    kategori: '',
    nama_kegiatan: '',
    nama_pemrakarsa: '',
    alamat_lokasi: '',
    tim_tugas: [] as string[],
    saksi: [] as string[]
  });

  useEffect(() => {
    supabase.from('dokumens').select('id, nama_pemrakarsa, nama_kegiatan, lokasi_kegiatan')
      .then(({ data }) => setDokumens(data || []));

    supabase.from('tim_pengawas').select('nama, kategori, urutan_hierarki').order('urutan_hierarki', { ascending: true })
      .then(({ data }) => setPegawai(data || []));
  }, []);

  const resetForm = () => {
    setFormData(prev => ({
      ...prev,
      nama_kegiatan: '',
      nama_pemrakarsa: '',
      alamat_lokasi: ''
    }));
  };

  const handleTabChange = (newTab: 'manual' | 'db') => {
    setTab(newTab);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sort based on urutan_hierarki before saving
      const sortedTim = [...formData.tim_tugas].sort((a, b) => {
        const pA = pegawai.find(p => p.nama === a);
        const pB = pegawai.find(p => p.nama === b);
        return (pA?.urutan_hierarki || 99) - (pB?.urutan_hierarki || 99);
      });
      
      const sortedSaksi = [...formData.saksi].sort((a, b) => {
        const pA = pegawai.find(p => p.nama === a);
        const pB = pegawai.find(p => p.nama === b);
        return (pA?.urutan_hierarki || 99) - (pB?.urutan_hierarki || 99);
      });

      const payload = {
        ...formData,
        tim_tugas: sortedTim.join('|'),
        saksi: sortedSaksi.join('|')
      };

      const res = await fetch('/api/pengawasan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Gagal menyimpan agenda');

      router.push('/'); // Kembali ke dasbor
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan agenda.');
    } finally {
      setLoading(false);
    }
  };

  const handleTimChange = (nama: string) => {
    setFormData(prev => {
      const isSelected = prev.tim_tugas.includes(nama);
      if (isSelected) {
        return { ...prev, tim_tugas: prev.tim_tugas.filter(n => n !== nama) };
      } else {
        return { ...prev, tim_tugas: [...prev.tim_tugas, nama] };
      }
    });
  };

  const handleSaksiChange = (nama: string) => {
    setFormData(prev => {
      const isSelected = prev.saksi.includes(nama);
      if (isSelected) {
        return { ...prev, saksi: prev.saksi.filter(n => n !== nama) };
      } else {
        return { ...prev, saksi: [...prev.saksi, nama] };
      }
    });
  };

  const handleDokumenSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const docId = e.target.value;
    if (!docId) {
      resetForm();
      return;
    }
    const doc = dokumens.find(d => d.id.toString() === docId);
    if (doc) {
      setFormData(prev => ({
        ...prev,
        nama_kegiatan: doc.nama_kegiatan || '',
        nama_pemrakarsa: doc.nama_pemrakarsa || '',
        alamat_lokasi: doc.lokasi_kegiatan || ''
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href="/pengawasan" className="w-12 h-12 rounded-xl bg-white text-slate-900 border-4 border-slate-900 flex items-center justify-center hover:bg-teal-400 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#0f172a] transition-all">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Buat Agenda Pengawasan</h2>
            <p className="text-sm font-bold text-slate-600 mt-1">Formulir pendaftaran jadwal inspeksi lapangan.</p>
          </div>
        </div>

        <div className="bg-white border-4 border-slate-900 rounded-3xl shadow-[12px_12px_0_0_#0f172a] overflow-hidden">
          
          <div className="flex border-b-4 border-slate-900 bg-slate-100">
            <button type="button" onClick={() => handleTabChange('manual')} 
                    className={`flex-1 py-5 text-sm font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2 ${tab === 'manual' ? 'bg-white border-b-4 border-teal-500 text-teal-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200 border-b-4 border-transparent'}`}>
                <Edit3 size={18} /> Input Manual (Baru)
            </button>
            <button type="button" onClick={() => handleTabChange('db')} 
                    className={`flex-1 py-5 text-sm font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2 border-l-4 border-slate-900 ${tab === 'db' ? 'bg-white border-b-4 border-indigo-500 text-indigo-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200 border-b-4 border-transparent'}`}>
                <Database size={18} /> Pilih dari Database
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            
            {tab === 'db' && (
              <div className="p-5 bg-indigo-100 border-4 border-indigo-900 rounded-2xl mb-8 shadow-[4px_4px_0_0_#312e81]">
                <label className="block text-xs font-black text-indigo-900 uppercase tracking-widest mb-2">Pilih Dokumen Perizinan <span className="text-rose-600">*</span></label>
                <select 
                  onChange={handleDokumenSelect}
                  className="w-full bg-white border-4 border-slate-900 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-300"
                >
                  <option value="">-- Cari Nama Perusahaan / Kegiatan --</option>
                  {dokumens.map(d => (
                    <option key={d.id} value={d.id}>{d.nama_pemrakarsa} - {d.nama_kegiatan}</option>
                  ))}
                </select>
                <p className="text-[10px] text-indigo-700 font-bold mt-2 uppercase tracking-wide">*Pilih dari daftar ini, maka form di bawah akan otomatis terisi.</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Tanggal Kunjungan <span className="text-rose-600">*</span></label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3.5 text-slate-900" size={20} />
                  <input 
                    type="date"
                    required
                    value={formData.tanggal_kunjungan}
                    onChange={e => setFormData({...formData, tanggal_kunjungan: e.target.value})}
                    className="w-full bg-slate-50 border-4 border-slate-900 rounded-xl pl-12 pr-4 py-3 font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-teal-300 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Kategori Usaha <span className="text-rose-600">*</span></label>
                <select 
                  required
                  value={formData.kategori}
                  onChange={e => setFormData({...formData, kategori: e.target.value})}
                  className="w-full bg-slate-50 border-4 border-slate-900 rounded-xl px-4 py-3 font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-teal-300 focus:bg-white transition-colors uppercase"
                >
                  <option value="" disabled>-- Pilih Kategori --</option>
                  <option value="Fasyankes">Fasyankes</option>
                  <option value="Industri">Industri</option>
                  <option value="Perumahan">Perumahan</option>
                  <option value="Toko Modern">Toko Modern</option>
                  <option value="SPPG">SPPG</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Nama Kegiatan/Usaha <span className="text-rose-600">*</span></label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-3.5 text-slate-900" size={20} />
                  <input 
                    type="text"
                    required
                    readOnly={tab === 'db'}
                    value={formData.nama_kegiatan}
                    onChange={e => setFormData({...formData, nama_kegiatan: e.target.value})}
                    className={`w-full border-4 border-slate-900 rounded-xl pl-12 pr-4 py-3 font-black text-slate-900 focus:outline-none transition-colors uppercase ${tab === 'db' ? 'bg-indigo-50 focus:ring-0 text-indigo-900' : 'bg-slate-50 focus:ring-4 focus:ring-teal-300 focus:bg-white'}`}
                    placeholder="Contoh: PEMBANGUNAN KLINIK SEHAT"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Nama Pemrakarsa <span className="text-rose-600">*</span></label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-slate-900" size={20} />
                  <input 
                    type="text"
                    required
                    readOnly={tab === 'db'}
                    value={formData.nama_pemrakarsa}
                    onChange={e => setFormData({...formData, nama_pemrakarsa: e.target.value})}
                    className={`w-full border-4 border-slate-900 rounded-xl pl-12 pr-4 py-3 font-black text-slate-900 focus:outline-none transition-colors uppercase ${tab === 'db' ? 'bg-indigo-50 focus:ring-0 text-indigo-900' : 'bg-slate-50 focus:ring-4 focus:ring-teal-300 focus:bg-white'}`}
                    placeholder="Contoh: PT. MEDIKA KARYA"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Alamat Lokasi</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 text-slate-900" size={20} />
                <textarea 
                  required
                  readOnly={tab === 'db'}
                  rows={2}
                  value={formData.alamat_lokasi}
                  onChange={e => setFormData({...formData, alamat_lokasi: e.target.value})}
                  className={`w-full border-4 border-slate-900 rounded-xl pl-12 pr-4 py-3 font-bold text-slate-900 focus:outline-none transition-colors ${tab === 'db' ? 'bg-indigo-50 focus:ring-0 text-indigo-900' : 'bg-slate-50 focus:ring-4 focus:ring-teal-300 focus:bg-white'}`}
                  placeholder="Detail alamat lapangan..."
                ></textarea>
              </div>
            </div>

            <div className="border-t-4 border-slate-900 pt-6 mt-2">
              <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <User size={18} className="text-teal-600" /> Pilih Tim Bertugas (Pengawas)
              </label>
              
              {pegawai.filter(p => !p.kategori || p.kategori === 'Tim Pengawas').length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {pegawai.filter(p => !p.kategori || p.kategori === 'Tim Pengawas').map(p => (
                    <label key={`tim-${p.nama}`} className={`flex items-center gap-3 p-4 rounded-xl border-4 cursor-pointer transition-all ${formData.tim_tugas.includes(p.nama) ? 'bg-teal-300 border-slate-900 shadow-[4px_4px_0_0_#0f172a]' : 'bg-slate-50 border-slate-900 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#0f172a]'}`}>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-teal-600 rounded border-2 border-slate-900" 
                        checked={formData.tim_tugas.includes(p.nama)}
                        onChange={() => handleTimChange(p.nama)}
                      />
                      <div className="flex flex-col">
                        <span className="block font-black text-sm text-slate-900 leading-tight line-clamp-1 uppercase">{p.nama}</span>
                        <span className="block text-[10px] uppercase font-black text-slate-500 mt-0.5">{p.jabatan_dinas || p.kategori || 'Pengawas'}</span>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-amber-200 rounded-xl border-4 border-slate-900 text-slate-900 font-black flex items-center gap-2 uppercase tracking-wide text-xs">
                  Belum ada data pegawai di database Tim Pengawas.
                </div>
              )}
            </div>

            <div className="border-t-4 border-slate-900 pt-6 mt-2">
              <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <User size={18} className="text-indigo-600" /> Pilih Saksi
              </label>
              <p className="text-xs text-slate-500 mb-4 font-bold">*Opsional. Anda bisa memilih staf dari daftar di bawah ini untuk bertugas sebagai Saksi.</p>
              
              {pegawai.filter(p => p.kategori === 'Saksi').length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {pegawai.filter(p => p.kategori === 'Saksi').map(p => (
                    <label key={`saksi-${p.nama}`} className={`flex items-center gap-3 p-4 rounded-xl border-4 cursor-pointer transition-all ${formData.saksi.includes(p.nama) ? 'bg-indigo-300 border-slate-900 shadow-[4px_4px_0_0_#0f172a]' : 'bg-slate-50 border-slate-900 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#0f172a]'}`}>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-indigo-600 rounded border-2 border-slate-900" 
                        checked={formData.saksi.includes(p.nama)}
                        onChange={() => handleSaksiChange(p.nama)}
                      />
                      <div className="flex flex-col">
                        <span className="block font-black text-sm text-slate-900 leading-tight line-clamp-1 uppercase">{p.nama}</span>
                        <span className="block text-[10px] uppercase font-black text-slate-500 mt-0.5">{p.jabatan_dinas || p.kategori}</span>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-amber-200 rounded-xl border-4 border-slate-900 text-slate-900 font-black flex items-center gap-2 uppercase tracking-wide text-xs">
                  Belum ada data saksi terdaftar. Tambahkan di menu Manajemen Tim.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-6 border-t-4 border-slate-900">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full md:w-auto bg-teal-400 hover:bg-teal-500 text-slate-900 px-10 py-4 rounded-full text-sm font-black uppercase tracking-widest border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] hover:translate-y-1 transition-all disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[6px_6px_0_0_#0f172a] flex items-center justify-center gap-2"
              >
                {loading ? <LottieLoader size={24} /> : <Save size={20} />}
                {loading ? 'Menyimpan...' : 'Simpan Agenda'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
