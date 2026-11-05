'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  FolderOpen, 
  ArrowLeft, 
  Plus, 
  Search, 
  FileText, 
  Trash2, 
  Calendar, 
  MapPin, 
  Image as ImageIcon, 
  ExternalLink,
  Users,
  Paperclip
} from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

type ArsipBidang = {
  id: string;
  tim: string;
  nama_kegiatan: string;
  tanggal_kegiatan: string;
  lokasi_kegiatan: string;
  dokumentasi_acara?: string[] | string;
  dokumentasi_urls?: string[] | string;
  undangan_acara?: string[] | string;
  undangan_urls?: string[] | string;
  berkas_lain?: string[] | string;
  berkas_lain_urls?: string[] | string;
  created_at: string;
};

// Helper untuk mengekstrak array URL dari beragam format database (Array, JSON string, atau comma-separated)
const extractUrls = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // bukan JSON, mungkin comma-separated atau single URL
      return val.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [val.trim()].filter(Boolean);
  }
  return [];
};

const resolveFileUrl = (item: string): string => {
  if (!item) return '#';
  if (item.startsWith('http://') || item.startsWith('https://')) return item;
  // Jika ID Google Drive
  return `https://drive.google.com/file/d/${item}/view`;
};

export default function DaftarArsipBidangPage() {
  const [docs, setDocs] = useState<ArsipBidang[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTim, setFilterTim] = useState('Semua');
  const [selectedYear, setSelectedYear] = useState('Semua');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  useEffect(() => {
    fetchData();
  }, []);

  // Ekstrak daftar tahun unik dari kegiatan
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    docs.forEach(d => {
      if (d.tanggal_kegiatan) {
        const y = d.tanggal_kegiatan.substring(0, 4);
        if (y && !isNaN(Number(y))) years.add(y);
      }
    });
    return Array.from(years).sort().reverse();
  }, [docs]);

  const filteredDocs = useMemo(() => {
    return docs.filter(d => {
      const matchSearch = 
        (d.nama_kegiatan || '').toLowerCase().includes(search.toLowerCase()) || 
        (d.tim || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.lokasi_kegiatan || '').toLowerCase().includes(search.toLowerCase());

      const matchTim = filterTim === 'Semua' || (d.tim || '').toLowerCase().includes(filterTim.toLowerCase());

      const docYear = d.tanggal_kegiatan ? d.tanggal_kegiatan.substring(0, 4) : '';
      const matchYear = selectedYear === 'Semua' || docYear === selectedYear;

      return matchSearch && matchTim && matchYear;
    });
  }, [docs, search, filterTim, selectedYear]);

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage) || 1;
  const paginatedDocs = useMemo(() => {
    return filteredDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredDocs, currentPage, itemsPerPage]);

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus arsip kegiatan ini secara permanen?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/arsip-bidang/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocs(prev => prev.filter(d => d.id !== id));
      } else {
        const errData = await res.json();
        alert(`Gagal menghapus: ${errData.error || 'Terjadi kesalahan'}`);
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan jaringan: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const getTimBadgeClass = (tim: string) => {
    const t = (tim || '').toLowerCase();
    if (t.includes('perizinan')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (t.includes('pengawasan')) return 'bg-blue-50 text-blue-800 border-blue-200';
    if (t.includes('pengaduan') || t.includes('aduan')) return 'bg-purple-50 text-purple-800 border-purple-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><LottieLoader size={150} text="MEMUAT ARSIP BIDANG..." /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6 pb-20">
      
      {/* Header NeoBrutalism */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-md text-slate-900 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <Link 
            href="/arsip" 
            className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-700 border border-slate-200 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 transition-all shrink-0"
            title="Kembali ke Hub Pusat Arsip"
          >
            <ArrowLeft size={22} />
          </Link>
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center shadow-sm">
            <FolderOpen size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">
              Arsip Bidang & Kegiatan
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
              Penyimpanan dokumentasi foto, undangan, dan berkas lampiran kegiatan per tim bidang.
            </p>
          </div>
        </div>
        
        <div className="flex items-center flex-wrap gap-3 relative z-10">
          <div className="bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-700">
            <FileText size={16} className="text-amber-500" />
            Total {docs.length} Kegiatan
          </div>
          <Link 
            href="/arsip/bidang/tambah" 
            className="bg-amber-400 hover:bg-amber-500 text-amber-950 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all border border-amber-300 flex items-center gap-2 uppercase tracking-wider"
          >
            <Plus size={16} /> Tambah Arsip
          </Link>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Cari nama kegiatan, tim pelaksana, atau lokasi kegiatan..." 
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl pl-10 pr-4 py-2.5 focus:bg-white focus:border-amber-500 transition-all outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Filter Tim */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-52">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Users size={16} />
            </div>
            <select 
              value={filterTim}
              onChange={e => { setFilterTim(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold uppercase rounded-xl pl-9 pr-8 py-2.5 focus:bg-white focus:border-amber-500 transition-all outline-none cursor-pointer appearance-none"
            >
              <option value="Semua">Semua Tim</option>
              <option value="Perizinan">Tim Perizinan</option>
              <option value="Pengawasan">Tim Pengawasan</option>
              <option value="Pengaduan">Tim Pengaduan & PKLH</option>
              <option value="Sekretariat">Sekretariat / Umum</option>
            </select>
          </div>

          {/* Filter Tahun */}
          <div className="relative w-full md:w-40">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Calendar size={16} />
            </div>
            <select 
              value={selectedYear}
              onChange={e => { setSelectedYear(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold uppercase rounded-xl pl-9 pr-8 py-2.5 focus:bg-white focus:border-amber-500 transition-all outline-none cursor-pointer appearance-none"
            >
              <option value="Semua">Semua Tahun</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Count */}
        <div className="text-xs font-bold text-slate-500 whitespace-nowrap px-3 py-2 bg-slate-100 rounded-xl">
          Hasil: <span className="text-slate-900">{filteredDocs.length}</span> Arsip
        </div>
      </div>

      {/* Dynamic Data Table */}
      <div className="bg-white border border-slate-200 shadow-md rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <th className="px-5 py-4 w-14 text-center">No</th>
                <th className="px-5 py-4 min-w-[150px]">Tim Pelaksana</th>
                <th className="px-5 py-4 min-w-[260px]">Nama Kegiatan</th>
                <th className="px-5 py-4 min-w-[140px]">Tanggal</th>
                <th className="px-5 py-4 min-w-[180px]">Lokasi</th>
                <th className="px-5 py-4 min-w-[200px]">Lampiran Berkas</th>
                <th className="px-5 py-4 min-w-[100px] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedDocs.length > 0 ? (
                paginatedDocs.map((d, index) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                  const dokUrls = extractUrls(d.dokumentasi_acara || d.dokumentasi_urls);
                  const undUrls = extractUrls(d.undangan_acara || d.undangan_urls);
                  const berkasUrls = extractUrls(d.berkas_lain || d.berkas_lain_urls);

                  return (
                    <tr key={d.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-5 py-4 text-center font-bold text-slate-400 text-xs">
                        {globalIndex}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${getTimBadgeClass(d.tim)}`}>
                          {d.tim || 'Tim Bidang'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900 leading-snug">
                          {d.nama_kegiatan}
                        </p>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          {d.tanggal_kegiatan || '-'}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-600">
                        {d.lokasi_kegiatan ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-slate-400 shrink-0" />
                            <span className="line-clamp-2">{d.lokasi_kegiatan}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {dokUrls.length > 0 && (
                            <a
                              href={resolveFileUrl(dokUrls[0])}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-bold hover:bg-blue-100 transition-colors"
                              title="Buka Dokumentasi Foto"
                            >
                              <ImageIcon size={11} /> Foto ({dokUrls.length})
                            </a>
                          )}
                          {undUrls.length > 0 && (
                            <a
                              href={resolveFileUrl(undUrls[0])}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[11px] font-bold hover:bg-purple-100 transition-colors"
                              title="Buka Undangan Acara"
                            >
                              <FileText size={11} /> Undangan ({undUrls.length})
                            </a>
                          )}
                          {berkasUrls.length > 0 && (
                            <a
                              href={resolveFileUrl(berkasUrls[0])}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-bold hover:bg-emerald-100 transition-colors"
                              title="Buka Berkas Lain"
                            >
                              <Paperclip size={11} /> Berkas ({berkasUrls.length})
                            </a>
                          )}
                          {dokUrls.length === 0 && undUrls.length === 0 && berkasUrls.length === 0 && (
                            <span className="text-xs text-slate-300 italic">Tanpa Lampiran</span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button 
                          onClick={() => handleDelete(d.id)}
                          disabled={deletingId === d.id}
                          className="px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                          title="Hapus Arsip Kegiatan"
                        >
                          <Trash2 size={13} />
                          <span>Hapus</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500 bg-white">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                        <FolderOpen size={28} />
                      </div>
                      <p className="font-bold text-sm text-slate-700 uppercase tracking-wider">
                        Tidak ada arsip kegiatan yang ditemukan.
                      </p>
                      <p className="text-xs text-slate-400">
                        Belum ada kegiatan yang dicatat atau kata kunci pencarian tidak cocok.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-slate-50 border-t border-slate-200 p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-600 uppercase">
              Menampilkan {paginatedDocs.length} dari {filteredDocs.length} kegiatan (Halaman {currentPage} dari {totalPages})
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase shadow-sm hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-all"
              >
                Sebelumnya
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-amber-400 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold uppercase shadow-sm hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-400 transition-all"
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
