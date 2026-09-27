'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FolderOpen, ArrowLeft, Plus, Search, Loader2, FileText, Trash2
} from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

type ArsipBidang = {
  id: string;
  tim: string;
  nama_kegiatan: string;
  tanggal_kegiatan: string;
  lokasi_kegiatan: string;
  dokumentasi_urls?: string;
  undangan_urls?: string;
  berkas_lain_urls?: string;
  created_at: string;
};

export default function DaftarArsipBidangPage() {
  const [docs, setDocs] = useState<ArsipBidang[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/arsip-bidang');
      const json = await res.json();
      setDocs(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus arsip kegiatan ini?')) return;
    try {
      const res = await fetch(`/api/arsip-bidang/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        alert('Gagal menghapus data');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan');
    }
  };

  const filteredDocs = docs.filter(d => {
    return (d.nama_kegiatan || '').toLowerCase().includes(search.toLowerCase()) || 
           (d.tim || '').toLowerCase().includes(search.toLowerCase()) ||
           (d.lokasi_kegiatan || '').toLowerCase().includes(search.toLowerCase());
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
  const paginatedDocs = filteredDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><LottieLoader size={150} text="MEMUAT DATA..." /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8 pb-20 px-4">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow text-on-surface relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-200 rounded-full border border-outline-variant opacity-30"></div>
        <div className="flex items-center gap-4 relative z-10">
          <Link href="/arsip" className="w-12 h-12 rounded-xl bg-surface text-on-surface border border-outline-variant flex items-center justify-center hover:bg-surface-container hover:-translate-y-1 hover:shadow-sm transition-all shrink-0">
            <ArrowLeft size={24} />
          </Link>
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-amber-300 border border-outline-variant flex items-center justify-center text-on-surface shadow-sm hover:shadow-md transition-shadow">
            <FolderOpen size={28} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface leading-tight uppercase">Arsip Bidang</h2>
            <p className="text-sm text-on-surface-variant font-bold mt-1 uppercase">Pencatatan Dokumen Kegiatan Bidang.</p>
          </div>
        </div>
        
        <div className="flex items-center flex-wrap gap-3 relative z-10">
          <div className="bg-secondary-container px-5 py-3 rounded-xl border border-outline-variant flex items-center gap-3 text-sm font-bold text-on-surface shadow-sm hover:shadow-md transition-shadow uppercase">
            <FileText size={18} className="text-secondary fill-emerald-500" />
            Total {docs.length} Kegiatan
          </div>
          <Link href="/arsip/bidang/tambah" className="bg-blue-400 hover:bg-blue-300 hover:-translate-y-1 text-on-surface px-5 py-3 rounded-xl text-sm font-bold shadow-sm transition-all border border-outline-variant flex items-center gap-2 uppercase tracking-widest">
            <Plus size={18} /> Tambah Arsip
          </Link>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={20} className="text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="CARI NAMA KEGIATAN, TIM, ATAU LOKASI..." 
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-surface border border-outline-variant text-on-surface text-sm font-bold uppercase rounded-2xl pl-12 pr-4 py-4 focus:shadow-sm hover:shadow-md transition-shadow outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Dynamic Data Table */}
      <div className="bg-surface border border-outline-variant shadow-sm rounded-xl overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className="px-6 py-4 font-bold text-on-surface uppercase text-[10px] min-w-[150px]">Tim</th>
                <th className="px-6 py-4 font-bold text-on-surface uppercase text-[10px] min-w-[250px]">Nama Kegiatan</th>
                <th className="px-6 py-4 font-bold text-on-surface uppercase text-[10px] min-w-[150px]">Tanggal</th>
                <th className="px-6 py-4 font-bold text-on-surface uppercase text-[10px] min-w-[200px]">Lokasi</th>
                <th className="px-6 py-4 font-bold text-on-surface uppercase text-[10px] min-w-[150px] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filteredDocs.length > 0 ? (
                paginatedDocs.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-sm text-on-surface">{d.tim}</td>
                    <td className="px-6 py-4 font-medium text-sm text-on-surface">{d.nama_kegiatan}</td>
                    <td className="px-6 py-4 font-medium text-sm text-on-surface-variant">{d.tanggal_kegiatan}</td>
                    <td className="px-6 py-4 font-medium text-sm text-on-surface-variant">{d.lokasi_kegiatan}</td>
                    <td className="px-6 py-4 text-sm flex items-center justify-center gap-2">
                      <button onClick={() => handleDelete(d.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs hover:bg-red-100 transition-colors flex items-center gap-1 font-medium">
                        <Trash2 size={14} /> Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FolderOpen size={32} className="text-slate-300 mb-2" />
                      <p>Belum ada data Arsip Bidang.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-surface-container-low border-t border-outline-variant p-6 flex items-center justify-between">
            <span className="text-sm font-bold text-on-surface-variant uppercase">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex gap-4">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-5 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm font-bold uppercase shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-5 py-2.5 bg-amber-300 border border-outline-variant rounded-xl text-sm font-bold text-on-surface uppercase shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
