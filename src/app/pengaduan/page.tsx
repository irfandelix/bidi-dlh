'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  ArrowLeft, 
  AlertTriangle, 
  ExternalLink, 
  Search, 
  Download, 
  Copy, 
  Check, 
  Clock, 
  CheckCircle2, 
  FileCheck, 
  MapPin, 
  User, 
  Phone, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet,
  Layers,
  FileText
} from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function PengaduanListPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'menunggu' | 'terisi' | 'selesai'>('semua');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetch('/api/pengaduan')
      .then(res => res.json())
      .then(res => {
        setData(res.data || []);
      })
      .catch(err => console.error('Gagal mengambil data pengaduan:', err))
      .finally(() => setLoading(false));
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = data.length;
    const menunggu = data.filter(d => d.status_tahapan === 'Menunggu Isian' || (!d.nama_pelapor && !d.ba_url)).length;
    const terisi = data.filter(d => (d.status_tahapan === 'Form Terisi' || d.nama_pelapor) && !d.ba_url).length;
    const selesai = data.filter(d => !!d.ba_url || d.status_tahapan === 'Selesai' || d.status_tahapan === 'BA Selesai').length;
    return { total, menunggu, terisi, selesai };
  }, [data]);

  // Filtered & Searched Data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Filter Status
      if (statusFilter === 'menunggu') {
        const isMenunggu = item.status_tahapan === 'Menunggu Isian' || (!item.nama_pelapor && !item.ba_url);
        if (!isMenunggu) return false;
      } else if (statusFilter === 'terisi') {
        const isTerisi = (item.status_tahapan === 'Form Terisi' || item.nama_pelapor) && !item.ba_url;
        if (!isTerisi) return false;
      } else if (statusFilter === 'selesai') {
        const isSelesai = !!item.ba_url || item.status_tahapan === 'Selesai' || item.status_tahapan === 'BA Selesai';
        if (!isSelesai) return false;
      }

      // Filter Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchPerihal = (item.perihal || '').toLowerCase().includes(q);
        const matchPelapor = (item.nama_pelapor || '').toLowerCase().includes(q);
        const matchTerlapor = (item.nama_terlapor || '').toLowerCase().includes(q);
        const matchLokasi = (item.lokasi_aduan || '').toLowerCase().includes(q);
        const matchToken = (item.token || '').toLowerCase().includes(q);
        const matchHp = (item.no_hp || item.telepon || '').toLowerCase().includes(q);
        return matchPerihal || matchPelapor || matchTerlapor || matchLokasi || matchToken || matchHp;
      }

      return true;
    });
  }, [data, statusFilter, searchQuery]);

  // Reset pagination when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Paginated Data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  // Copy Token or Form Link
  const handleCopyLink = (token: string) => {
    if (!token) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/pengaduan/token?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert('Tidak ada data aduan untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'Token Aduan',
      'Tanggal',
      'Perihal / Judul Aduan',
      'Nama Pelapor',
      'No Telp Pelapor',
      'Pihak Terlapor',
      'Lokasi Kejadian',
      'Status Tahapan',
      'Status Dokumen BA'
    ];

    const rows = filteredData.map((item, index) => [
      index + 1,
      `"${item.token || '-'}"`,
      `"${item.tanggal || '-'}"`,
      `"${(item.perihal || '').replace(/"/g, '""')}"`,
      `"${(item.nama_pelapor || '-').replace(/"/g, '""')}"`,
      `"${(item.no_hp || item.telepon || '-').replace(/"/g, '""')}"`,
      `"${(item.nama_terlapor || '-').replace(/"/g, '""')}"`,
      `"${(item.lokasi_aduan || '-').replace(/"/g, '""')}"`,
      `"${item.status_tahapan || 'Menunggu Isian'}"`,
      `"${item.ba_url ? 'Ada Berita Acara' : 'Belum Ada BA'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rekap_Pengaduan_DLH_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8 px-4 pb-24">
      
      {/* Tombol Kembali ke Beranda */}
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-sm text-slate-800 font-bold transition-all bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 uppercase tracking-wide"
      >
        <ArrowLeft size={16} /> Kembali ke Beranda
      </Link>

      {/* Header Halaman (Konsisten dengan gaya NeoBrutalism DLH) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-md flex-1 w-full">
          <div className="w-14 h-14 rounded-xl bg-purple-400 border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
            <AlertTriangle size={28} className="text-slate-900" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight uppercase">
              Daftar Pengaduan
            </h2>
            <p className="text-sm font-bold text-slate-600 mt-1 uppercase">
              Rekap Data, Registrasi Tiket & Dokumentasi Aduan Lingkungan Hidup
            </p>
          </div>
        </div>

        <Link 
          href="/pengaduan/tambah" 
          className="w-full md:w-auto px-7 py-5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-3xl border border-slate-200 shadow-md hover:-translate-y-1 transition-all flex items-center justify-center gap-3 uppercase tracking-wider text-xs sm:text-sm shrink-0 whitespace-nowrap group"
        >
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={18} className="text-white" />
          </div>
          Catat Pengaduan
        </Link>
      </div>

      {/* Kartu Ringkasan Metrik (Poin 3) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Aduan */}
        <div 
          onClick={() => setStatusFilter('semua')}
          className={`bg-white p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
            statusFilter === 'semua' ? 'border-purple-500 ring-2 ring-purple-100 bg-purple-50/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Total Aduan</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">{metrics.total}</p>
          <p className="text-[11px] font-bold text-slate-500 mt-1">Semua laporan terdaftar</p>
        </div>

        {/* Menunggu Pelapor */}
        <div 
          onClick={() => setStatusFilter('menunggu')}
          className={`bg-white p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
            statusFilter === 'menunggu' ? 'border-amber-500 ring-2 ring-amber-100 bg-amber-50/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Menunggu Pelapor</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-2 font-mono">{metrics.menunggu}</p>
          <p className="text-[11px] font-bold text-slate-500 mt-1">Token terbit / belum isi</p>
        </div>

        {/* Form Terisi */}
        <div 
          onClick={() => setStatusFilter('terisi')}
          className={`bg-white p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
            statusFilter === 'terisi' ? 'border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Form Terisi</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FileCheck size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-indigo-600 mt-2 font-mono">{metrics.terisi}</p>
          <p className="text-[11px] font-bold text-slate-500 mt-1">Siap verlap / tindak lanjut</p>
        </div>

        {/* Selesai / Ada BA */}
        <div 
          onClick={() => setStatusFilter('selesai')}
          className={`bg-white p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
            statusFilter === 'selesai' ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Selesai / Ada BA</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2 font-mono">{metrics.selesai}</p>
          <p className="text-[11px] font-bold text-slate-500 mt-1">BA penanganan tersedia</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar & Export (Poin 2 & Poin 6) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('semua')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all border ${
                statusFilter === 'semua' 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
              }`}
            >
              Semua ({metrics.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('menunggu')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all border ${
                statusFilter === 'menunggu' 
                  ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-sm' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
              }`}
            >
              Menunggu Pelapor ({metrics.menunggu})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('terisi')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all border ${
                statusFilter === 'terisi' 
                  ? 'bg-indigo-400 text-slate-900 border-indigo-500 shadow-sm' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
              }`}
            >
              Form Terisi ({metrics.terisi})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('selesai')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all border ${
                statusFilter === 'selesai' 
                  ? 'bg-emerald-400 text-slate-900 border-emerald-500 shadow-sm' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
              }`}
            >
              Selesai ({metrics.selesai})
            </button>
          </div>

          {/* Export to CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-sm hover:-translate-y-0.5 active:translate-y-0"
            title="Unduh data dalam format CSV/Excel"
          >
            <FileSpreadsheet size={16} />
            <span>Ekspor CSV</span>
          </button>
        </div>

        {/* Real-time Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari perihal, nama pelapor, nama terlapor, lokasi kejadian, atau token aduan..."
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-11 pr-10 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tabel Data Pengaduan (Poin 1 Fix colSpan & Poin 4 Informasi Lengkap) */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-200">
                <th className="p-4 text-xs font-black text-slate-900 uppercase tracking-widest border-r border-slate-200 w-12 text-center">No</th>
                <th className="p-4 text-xs font-black text-slate-900 uppercase tracking-widest border-r border-slate-200 w-44">Token & Tanggal</th>
                <th className="p-4 text-xs font-black text-slate-900 uppercase tracking-widest border-r border-slate-200">Perihal & Rincian Aduan</th>
                <th className="p-4 text-xs font-black text-slate-900 uppercase tracking-widest border-r border-slate-200 w-40 text-center">Status</th>
                <th className="p-4 text-xs font-black text-slate-900 uppercase tracking-widest w-36 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  {/* Fixed colSpan={5} (Poin 1) */}
                  <td colSpan={5} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                    <LottieLoader size={120} text="MEMUAT DATA PENGADUAN..." />
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  {/* Fixed colSpan={5} (Poin 1) */}
                  <td colSpan={5} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                        <AlertTriangle size={28} />
                      </div>
                      <p className="text-base font-black text-slate-800">Tidak ada data pengaduan yang cocok.</p>
                      <p className="text-xs text-slate-400 font-semibold normal-case">
                        {searchQuery ? `Tidak ditemukan hasil dengan kata kunci "${searchQuery}". Coba ganti kata pencarian.` : 'Belum ada pengaduan tercatat pada filter ini.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => {
                  const itemIndex = (currentPage - 1) * pageSize + index + 1;
                  const isSelesai = !!item.ba_url || item.status_tahapan === 'Selesai' || item.status_tahapan === 'BA Selesai';
                  const isMenunggu = item.status_tahapan === 'Menunggu Isian' || (!item.nama_pelapor && !item.ba_url);
                  const isCopied = copiedToken === item.token;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Nomor */}
                      <td className="p-4 text-sm font-mono font-black text-slate-900 border-r border-slate-100 text-center">
                        {itemIndex}
                      </td>

                      {/* Token & Tanggal */}
                      <td className="p-4 border-r border-slate-100 space-y-1.5">
                        {item.token ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-xs bg-purple-100 text-purple-900 px-2 py-0.5 rounded-lg border border-purple-200">
                              {item.token}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyLink(item.token)}
                              className="p-1 text-slate-400 hover:text-purple-600 rounded transition-colors"
                              title="Salin tautan formulir pelapor"
                            >
                              {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic font-mono">-</span>
                        )}

                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 whitespace-nowrap">
                          <Clock size={12} className="text-slate-400 shrink-0" />
                          <span>
                            {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                          </span>
                        </div>
                      </td>

                      {/* Perihal & Rincian */}
                      <td className="p-4 border-r border-slate-100 space-y-2">
                        <p className="text-sm font-black text-slate-900 leading-snug">
                          {item.perihal || 'Pengaduan Tanpa Judul'}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-600">
                          {item.nama_pelapor && (
                            <span className="inline-flex items-center gap-1">
                              <User size={13} className="text-purple-600" />
                              <span className="font-bold text-slate-800">{item.nama_pelapor}</span>
                              {(item.no_hp || item.telepon) && (
                                <span className="text-slate-400 font-mono">({item.no_hp || item.telepon})</span>
                              )}
                            </span>
                          )}

                          {item.nama_terlapor && (
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              <span className="text-slate-400">Terlapor:</span>
                              <span className="font-bold text-slate-800">{item.nama_terlapor}</span>
                            </span>
                          )}

                          {item.lokasi_aduan && (
                            <span className="inline-flex items-center gap-1 text-slate-500">
                              <MapPin size={13} className="text-rose-500 shrink-0" />
                              <span className="line-clamp-1">{item.lokasi_aduan}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4 border-r border-slate-100 text-center whitespace-nowrap">
                        <div className="space-y-1">
                          {isSelesai ? (
                            <span className="inline-block bg-emerald-100 text-emerald-800 font-black text-xs px-3 py-1 rounded-full border border-emerald-300">
                              Selesai (Ada BA)
                            </span>
                          ) : isMenunggu ? (
                            <span className="inline-block bg-amber-100 text-amber-800 font-black text-xs px-3 py-1 rounded-full border border-amber-300">
                              Menunggu Pelapor
                            </span>
                          ) : (
                            <span className="inline-block bg-indigo-100 text-indigo-800 font-black text-xs px-3 py-1 rounded-full border border-indigo-300">
                              Form Terisi
                            </span>
                          )}

                          {/* Lampiran Flags */}
                          <div className="flex items-center justify-center gap-1 text-[10px] font-bold">
                            {item.dokumentasi_url && (
                              <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                Foto ✓
                              </span>
                            )}
                            {item.ba_url && (
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                BA ✓
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <Link 
                          href={`/pengaduan/detail/${item.id}`} 
                          className="inline-flex items-center justify-center gap-1.5 text-xs font-black text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-3.5 py-2 rounded-xl transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
                        >
                          <ExternalLink size={13} />
                          <span>Detail</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginasi (Poin 5) */}
        {!loading && filteredData.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-600">
            <div>
              Menampilkan <span className="font-black text-slate-900 font-mono">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-black text-slate-900 font-mono">{Math.min(currentPage * pageSize, filteredData.length)}</span> dari <span className="font-black text-slate-900 font-mono">{filteredData.length}</span> pengaduan
              {searchQuery && <span className="text-slate-400 ml-1">(difilter dari total {data.length})</span>}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white shadow-sm"
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
                        ? 'bg-purple-500 text-white shadow-sm' 
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
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white shadow-sm"
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
