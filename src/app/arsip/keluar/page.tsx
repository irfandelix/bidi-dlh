'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Send, 
  FileText, 
  ArrowLeft, 
  Plus, 
  Search, 
  Download, 
  Calendar,
  Building2,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import LottieLoader from '@/components/LottieLoader';

type ArsipKeluar = {
  id: number;
  kode_klasifikasi: string;
  nomor_surat_keluar: string;
  tanggal_surat: string;
  tujuan: string;
  perihal: string;
  jumlah?: number;
  status_surat?: string;
  file_url?: string;
  created_at: string;
};

export default function DaftarArsipKeluarPage() {
  const [docs, setDocs] = useState<ArsipKeluar[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('semua');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchDocs = () => {
    setLoading(true);
    fetch('/api/arsip-keluar')
      .then(res => res.json())
      .then(res => {
        setDocs(res.data || []);
      })
      .catch(err => console.error('Gagal mengambil data surat keluar:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  // Ambil daftar tahun unik dari tanggal_surat
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    docs.forEach(d => {
      if (d.tanggal_surat) {
        const y = d.tanggal_surat.split('-')[0];
        if (y && y.length === 4) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [docs]);

  // Filter Data
  const filteredDocs = useMemo(() => {
    return docs.filter(d => {
      // Filter Tahun
      if (selectedYear !== 'semua') {
        const tgl = d.tanggal_surat || '';
        if (!tgl.startsWith(selectedYear)) return false;
      }

      // Filter Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const perihal = (d.perihal || '').toLowerCase();
        const noSurat = (d.nomor_surat_keluar || '').toLowerCase();
        const tujuan = (d.tujuan || '').toLowerCase();
        const kode = (d.kode_klasifikasi || '').toLowerCase();

        return perihal.includes(q) || 
               noSurat.includes(q) || 
               tujuan.includes(q) || 
               kode.includes(q);
      }

      return true;
    });
  }, [docs, selectedYear, search]);

  // Reset pagination when search/year changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedYear]);

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage) || 1;
  const paginatedDocs = filteredDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportExcel = () => {
    if (filteredDocs.length === 0) {
      alert('Tidak ada data surat keluar untuk diekspor.');
      return;
    }

    const dataToExport = filteredDocs.map((d, index) => ({
      "No": index + 1,
      "Nomor Surat Keluar": d.nomor_surat_keluar,
      "Tanggal Surat": d.tanggal_surat,
      "Tujuan Surat": d.tujuan,
      "Perihal": d.perihal,
      "Kode Klasifikasi": d.kode_klasifikasi || '-',
      "Link File": d.file_url || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Surat Keluar");
    XLSX.writeFile(workbook, `Buku_Agenda_Surat_Keluar_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus arsip surat keluar ini?')) return;
    try {
      const res = await fetch(`/api/arsip-keluar?id=${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (res.ok) {
        fetchDocs();
      } else {
        alert(result.error || 'Gagal menghapus data');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan saat menghapus');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8 pb-24 px-4">
      
      {/* Tombol Kembali ke Hub Persuratan */}
      <Link 
        href="/arsip/persuratan" 
        className="inline-flex items-center gap-2 text-sm text-slate-800 font-bold transition-all bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 uppercase tracking-wide"
      >
        <ArrowLeft size={16} /> Kembali ke Persuratan
      </Link>

      {/* Header Halaman (NeoBrutalism Konsisten) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-sm">
            <Send size={28} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">
              Buku Agenda Surat Keluar
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-bold mt-1 uppercase">
              Pencatatan Surat Resmi yang Diterbitkan dan Dikirimkan ke Pihak Eksternal
            </p>
          </div>
        </div>
        
        {/* Tombol Aksi Header */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button 
            type="button"
            onClick={handleExportExcel} 
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-black border border-emerald-300 shadow-sm hover:-translate-y-0.5 transition-all flex items-center gap-2 uppercase tracking-wider"
            title="Unduh seluruh data dalam format Excel"
          >
            <Download size={16} /> 
            <span>Export Excel</span>
          </button>

          <div className="bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
            <FileText size={16} className="text-emerald-600" />
            <span>Total {docs.length} Surat</span>
          </div>

          <Link 
            href="/arsip/keluar/tambah" 
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 uppercase tracking-wider"
          >
            <Plus size={16} /> 
            <span>Catat Surat Keluar</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Real-time Search Box */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari perihal, nomor surat, tujuan surat, atau kode klasifikasi..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 text-sm font-bold rounded-xl pl-11 pr-10 py-3 focus:bg-white focus:border-emerald-600 outline-none transition-all placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Tahun Surat */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider shrink-0">
              Tahun:
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-50 border-2 border-slate-200 text-slate-900 text-xs font-black rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-emerald-600 cursor-pointer uppercase"
            >
              <option value="semua">Semua Tahun</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Tabel Data Surat Keluar (Modern NeoBrutalism) */}
      <div className="bg-white border border-slate-200 shadow-md rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-200 text-xs font-black text-slate-900 uppercase tracking-wider">
                <th className="p-4 border-r border-slate-200 w-12 text-center">No</th>
                <th className="p-4 border-r border-slate-200 w-52">Nomor Surat & Klasifikasi</th>
                <th className="p-4 border-r border-slate-200">Tujuan & Perihal Surat</th>
                <th className="p-4 border-r border-slate-200 w-36">Tanggal Surat</th>
                <th className="p-4 border-r border-slate-200 w-24 text-center">File</th>
                <th className="p-4 w-20 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                    <LottieLoader size={120} text="MEMUAT SURAT KELUAR..." />
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                    <div className="max-w-md mx-auto space-y-2">
                      <Send size={32} className="mx-auto text-slate-300" />
                      <p className="text-base font-black text-slate-800">Tidak ada data surat keluar.</p>
                      <p className="text-xs text-slate-400 font-semibold normal-case">
                        {search ? `Tidak ada hasil dengan kata kunci "${search}".` : 'Belum ada surat keluar yang tercatat pada filter ini.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((d, index) => {
                  const itemIndex = (currentPage - 1) * itemsPerPage + index + 1;

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Nomor Urut */}
                      <td className="p-4 border-r border-slate-100 text-center font-mono font-black text-slate-800">
                        {itemIndex}
                      </td>

                      {/* Nomor Surat & Klasifikasi */}
                      <td className="p-4 border-r border-slate-100 space-y-1.5">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 border border-slate-300 px-2.5 py-1 rounded-lg block w-fit">
                          {d.nomor_surat_keluar}
                        </span>
                        {d.kode_klasifikasi && (
                          <span className="inline-block text-[10px] font-mono font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded">
                            {d.kode_klasifikasi.split(' - ')[0]}
                          </span>
                        )}
                      </td>

                      {/* Tujuan & Perihal */}
                      <td className="p-4 border-r border-slate-100 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 uppercase">
                          <Building2 size={13} className="text-emerald-600 shrink-0" />
                          <span>Tujuan: <strong className="text-slate-900">{d.tujuan}</strong></span>
                        </div>
                        <p className="font-bold text-slate-900 text-sm leading-snug">
                          {d.perihal}
                        </p>
                      </td>

                      {/* Tanggal */}
                      <td className="p-4 border-r border-slate-100 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                          <Calendar size={13} className="text-slate-400 shrink-0" />
                          <span className="font-mono">{d.tanggal_surat || '-'}</span>
                        </div>
                      </td>

                      {/* File */}
                      <td className="p-4 border-r border-slate-100 text-center">
                        {d.file_url ? (
                          <a 
                            href={d.file_url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
                            title="Buka dokumen surat"
                          >
                            <ExternalLink size={12} />
                            <span>Lihat</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs italic">-</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(d.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Hapus arsip surat ini"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginasi Data */}
        {!loading && filteredDocs.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-600">
            <div>
              Menampilkan <span className="font-black text-slate-900 font-mono">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-black text-slate-900 font-mono">{Math.min(currentPage * itemsPerPage, filteredDocs.length)}</span> dari <span className="font-black text-slate-900 font-mono">{filteredDocs.length}</span> surat keluar
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 shadow-sm"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1 px-2 font-mono">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-black transition-colors ${
                      currentPage === page 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 shadow-sm"
                title="Halaman Selanjutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
