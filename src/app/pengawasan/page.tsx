'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  ArrowLeft, 
  ShieldCheck, 
  Search, 
  Copy, 
  Check, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Layers, 
  MapPin, 
  Building2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet, 
  FileText, 
  ExternalLink,
  Smartphone,
  Eye,
  Database,
  Archive,
  Zap,
  Sparkles
} from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function PengawasanHubPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'agenda' | 'hari_ini' | 'selesai'>('semua');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Detail Modal State
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchData = () => {
    setLoading(true);
    fetch('/api/pengawasan', { cache: 'no-store' })
      .then(res => res.json())
      .then(res => {
        setData(res.data || []);
      })
      .catch(err => console.error('Gagal mengambil data pengawasan:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const total = data.length;
    
    let hariIni = 0;
    let agenda = 0;
    let selesai = 0;

    data.forEach(item => {
      const hasBap = Array.isArray(item.bap_pengawasans) && item.bap_pengawasans.length > 0;
      const visitDate = (item.tanggal_kunjungan || '').split('T')[0];

      if (hasBap) {
        selesai++;
      } else {
        agenda++;
      }

      if (visitDate === today) {
        hariIni++;
      }
    });

    return { total, agenda, hariIni, selesai };
  }, [data]);

  // Helper date urgency
  const getUrgency = (dateStr: string) => {
    if (!dateStr) return { type: 'upcoming', label: 'Terjadwal', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    
    const today = new Date().toISOString().split('T')[0];
    const visitDate = dateStr.split('T')[0];

    if (visitDate === today) {
      return { type: 'today', label: 'Hari Ini', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
    if (visitDate > today) {
      return { type: 'upcoming', label: 'Mendatang', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    return { type: 'past', label: 'Lewat Tanggal', color: 'bg-slate-100 text-slate-600 border-slate-200' };
  };

  // Filtered & Searched Data
  const filteredData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return data.filter(item => {
      const hasBap = Array.isArray(item.bap_pengawasans) && item.bap_pengawasans.length > 0;
      const visitDate = (item.tanggal_kunjungan || '').split('T')[0];

      // 1. Status Filter
      if (statusFilter === 'agenda') {
        if (hasBap) return false;
      } else if (statusFilter === 'hari_ini') {
        if (visitDate !== today) return false;
      } else if (statusFilter === 'selesai') {
        if (!hasBap) return false;
      }

      // 2. Category Filter
      if (categoryFilter !== 'Semua') {
        const itemCat = (item.kategori || '').toLowerCase();
        if (categoryFilter === 'Lainnya') {
          const known = ['industri', 'fasyankes', 'perumahan', 'toko modern', 'sppg'];
          if (known.some(k => itemCat.includes(k))) return false;
        } else {
          if (!itemCat.includes(categoryFilter.toLowerCase())) return false;
        }
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nama = (item.nama_kegiatan || item.nama_usaha || '').toLowerCase();
        const pemrakarsa = (item.nama_pemrakarsa || '').toLowerCase();
        const lokasi = (item.lokasi_kegiatan || item.lokasi || '').toLowerCase();
        const token = (item.token || '').toLowerCase();
        const kategori = (item.kategori || '').toLowerCase();
        return (
          nama.includes(q) ||
          pemrakarsa.includes(q) ||
          lokasi.includes(q) ||
          token.includes(q) ||
          kategori.includes(q)
        );
      }

      return true;
    });
  }, [data, statusFilter, categoryFilter, searchQuery]);

  // Reset pagination when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter]);

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
    const link = `${origin}/pengawasan/token?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert('Tidak ada data pengawasan untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'Token',
      'Tanggal Kunjungan',
      'Nama Usaha / Kegiatan',
      'Kategori',
      'Pemrakarsa',
      'Lokasi Kegiatan',
      'Status BAP',
      'Jumlah BAP Terisi'
    ];

    const rows = filteredData.map((item, index) => {
      const hasBap = Array.isArray(item.bap_pengawasans) && item.bap_pengawasans.length > 0;
      return [
        index + 1,
        `"${item.token || '-'}"`,
        `"${item.tanggal_kunjungan || '-'}"`,
        `"${(item.nama_kegiatan || item.nama_usaha || '').replace(/"/g, '""')}"`,
        `"${item.kategori || 'Umum'}"`,
        `"${(item.nama_pemrakarsa || '-').replace(/"/g, '""')}"`,
        `"${(item.lokasi_kegiatan || item.lokasi || '-').replace(/"/g, '""')}"`,
        `"${hasBap ? 'BAP Selesai' : 'Belum Ada BAP'}"`,
        `"${item.bap_pengawasans?.length || 0}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rekap_Pengawasan_DLH_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const categories = ['Semua', 'Industri', 'Fasyankes', 'Perumahan', 'Toko Modern', 'SPPG', 'Lainnya'];

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8 px-4 pb-24">
      
      {/* Tombol Kembali ke Beranda */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-slate-800 font-bold transition-all bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 uppercase tracking-wide"
        >
          <ArrowLeft size={16} /> Kembali ke Beranda
        </Link>

        {/* Quick Links Navigasi Sub-Modul Pengawasan */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <Link
            href="/pengawasan/agenda"
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Calendar size={13} className="text-amber-600" />
            <span>Agenda Aktif</span>
          </Link>
          <Link
            href="/pengawasan/database"
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Database size={13} className="text-teal-600" />
            <span>Database Sasaran</span>
          </Link>
          <Link
            href="/pengawasan/arsip"
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Archive size={13} className="text-indigo-600" />
            <span>Arsip BAP</span>
          </Link>
          <Link
            href="/pengawasan/nota-dinas"
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <FileText size={13} className="text-fuchsia-600" />
            <span>Nota Dinas</span>
          </Link>
          <Link
            href="/pengawasan/token"
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <ShieldCheck size={13} className="text-rose-600" />
            <span>Verifikasi Token</span>
          </Link>
        </div>
      </div>

      {/* Header Halaman (Seragam dengan Pengaduan & Perizinan) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-md flex-1 w-full">
          <div className="w-14 h-14 rounded-xl bg-teal-400 border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
            <ShieldCheck size={28} className="text-slate-900" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight uppercase">
              Daftar Pengawasan
            </h2>
            <p className="text-sm font-bold text-slate-600 mt-1 uppercase">
              Pemantauan Ketaatan Lingkungan Hidup, Agenda Inspeksi Lapangan & Integrasi BIDIDLH.apk
            </p>
          </div>
        </div>

        <Link 
          href="/pengawasan/buat-agenda" 
          className="w-full md:w-auto px-7 py-5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-3xl border border-slate-200 shadow-md hover:-translate-y-1 transition-all flex items-center justify-center gap-3 uppercase tracking-wider text-xs sm:text-sm shrink-0 whitespace-nowrap group"
        >
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={18} className="text-white" />
          </div>
          Buat Agenda Baru
        </Link>
      </div>

      {/* Kartu Ringkasan Metrik (Seragam 4 Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Pengawasan */}
        <div 
          onClick={() => setStatusFilter('semua')}
          className={`bg-white p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
            statusFilter === 'semua' ? 'border-teal-500 ring-2 ring-teal-100 bg-teal-50/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Total Data</span>
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-mono">{metrics.total}</p>
          <p className="text-[11px] font-bold text-slate-500 mt-1">Seluruh agenda & riwayat BAP</p>
        </div>

        {/* Belum Ada BAP (Agenda) */}
        <div 
          onClick={() => setStatusFilter('agenda')}
          className={`bg-white p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
            statusFilter === 'agenda' ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Agenda Terjadwal</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Calendar size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-2 font-mono">{metrics.agenda}</p>
          <p className="text-[11px] font-bold text-slate-500 mt-1">Belum ada dokumen BAP</p>
        </div>

        {/* Kunjungan Hari Ini */}
        <div 
          onClick={() => setStatusFilter('hari_ini')}
          className={`bg-white p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
            statusFilter === 'hari_ini' ? 'border-amber-500 ring-2 ring-amber-100 bg-amber-50/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-2 font-mono">{metrics.hariIni}</p>
          <p className="text-[11px] font-bold text-slate-500 mt-1">Jadwal inspeksi hari ini</p>
        </div>

        {/* Selesai / Ada BAP */}
        <div 
          onClick={() => setStatusFilter('selesai')}
          className={`bg-white p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-sm hover:shadow-md ${
            statusFilter === 'selesai' ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">BAP Selesai</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2 font-mono">{metrics.selesai}</p>
          <p className="text-[11px] font-bold text-slate-500 mt-1">BAP pengawasan tersedia</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar & Export (Seragam) */}
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
              onClick={() => setStatusFilter('agenda')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all border ${
                statusFilter === 'agenda' 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
              }`}
            >
              Belum BAP ({metrics.agenda})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('hari_ini')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all border ${
                statusFilter === 'hari_ini' 
                  ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-sm' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
              }`}
            >
              Hari Ini ({metrics.hariIni})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('selesai')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all border ${
                statusFilter === 'selesai' 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
              }`}
            >
              Ada BAP ({metrics.selesai})
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black uppercase tracking-wider rounded-xl border border-slate-200 transition-colors"
          >
            <FileSpreadsheet size={15} className="text-emerald-700" />
            <span>Ekspor CSV</span>
          </button>
        </div>

        {/* Kategori Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Kategori:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                categoryFilter === cat
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar Input */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari usaha, kegiatan, nama pemrakarsa, lokasi, atau token..."
            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tabel Data Pengawasan (Seragam dengan Pengaduan) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider">
                <th className="px-5 py-4 w-12 text-center">No</th>
                <th className="px-5 py-4 min-w-[130px]">Tanggal Kunjungan</th>
                <th className="px-5 py-4 min-w-[240px]">Usaha / Kegiatan & Lokasi</th>
                <th className="px-5 py-4 min-w-[180px]">Pemrakarsa</th>
                <th className="px-5 py-4 min-w-[140px] text-center">Token BIDIDLH.apk</th>
                <th className="px-5 py-4 min-w-[130px] text-center">Status BAP</th>
                <th className="px-5 py-4 min-w-[130px] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <LottieLoader size={130} text="MEMUAT DATA PENGAWASAN..." />
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldCheck size={36} className="text-slate-300" />
                      <p className="font-bold text-sm text-slate-700 uppercase">
                        Tidak ada agenda atau pengawasan yang cocok.
                      </p>
                      <p className="text-xs text-slate-400">
                        Coba sesuaikan kata kunci pencarian atau ganti filter status.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => {
                  const hasBap = Array.isArray(item.bap_pengawasans) && item.bap_pengawasans.length > 0;
                  const urgency = getUrgency(item.tanggal_kunjungan);
                  const isCopied = copiedToken === item.token;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* No */}
                      <td className="px-5 py-4 text-center font-bold text-slate-400 text-xs">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      {/* Tanggal & Urgensi */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800 text-xs sm:text-sm">
                          {item.tanggal_kunjungan ? item.tanggal_kunjungan.split('T')[0] : '-'}
                        </div>
                        <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md border mt-1 ${urgency.color}`}>
                          {urgency.label}
                        </span>
                      </td>

                      {/* Usaha/Kegiatan & Lokasi */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black uppercase rounded-md border border-slate-200">
                            {item.kategori || 'Umum'}
                          </span>
                          {item.nomor_nota_dinas && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black font-mono rounded-md border border-indigo-200" title="Nomor Nota Dinas Terintegrasi Arsip">
                              Nota: {item.nomor_nota_dinas}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-slate-900 text-sm leading-snug">
                          {item.nama_kegiatan || item.nama_usaha || '-'}
                        </p>
                        {item.lokasi_kegiatan || item.lokasi ? (
                          <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                            <MapPin size={11} className="text-slate-400 shrink-0" />
                            <span className="truncate max-w-[260px]">{item.lokasi_kegiatan || item.lokasi}</span>
                          </p>
                        ) : null}
                      </td>

                      {/* Pemrakarsa */}
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800 text-xs sm:text-sm">
                          {item.nama_pemrakarsa || '-'}
                        </p>
                      </td>

                      {/* Token BIDIDLH.apk */}
                      <td className="px-5 py-4 text-center">
                        {item.token ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg">
                            <span className="font-mono text-xs font-black text-slate-800">
                              {item.token}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyLink(item.token)}
                              className="p-1 hover:bg-white rounded transition-colors text-slate-400 hover:text-teal-700"
                              title="Salin Tautan Token Form"
                            >
                              {isCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-bold">-</span>
                        )}
                      </td>

                      {/* Status BAP */}
                      <td className="px-5 py-4 text-center">
                        {hasBap ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black rounded-lg">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>BAP Selesai</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 text-xs font-black rounded-lg">
                            <Calendar size={13} className="text-blue-600" />
                            <span>Agenda Menunggu</span>
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedDetail(item)}
                            className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors inline-flex items-center gap-1"
                            title="Lihat Detail Pengawasan"
                          >
                            <Eye size={13} />
                            <span>Detail</span>
                          </button>

                          {hasBap ? (
                            <Link
                              href="/pengawasan/arsip"
                              className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1"
                              title="Buka Berkas BAP di Arsip"
                            >
                              <FileText size={13} />
                              <span>Lihat BAP</span>
                            </Link>
                          ) : (
                            <Link
                              href={`/pengawasan/ba/isi/${item.id}`}
                              className="px-2.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1 shadow-sm"
                              title="Isi Berita Acara (BAP)"
                            >
                              <Plus size={13} />
                              <span>Isi BAP</span>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
            <div>
              Halaman {currentPage} dari {totalPages} ({filteredData.length} data)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Popup Detail Pengawasan */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center border border-teal-200 font-black">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">
                    Rincian Pengawasan
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">
                    ID #{selectedDetail.id} • Kategori {selectedDetail.kategori || 'Umum'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Nama Usaha / Kegiatan:
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {selectedDetail.nama_kegiatan || selectedDetail.nama_usaha || '-'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Pemrakarsa:
                  </span>
                  <p className="font-bold text-slate-800 text-sm">
                    {selectedDetail.nama_pemrakarsa || '-'}
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Tanggal Kunjungan:
                  </span>
                  <p className="font-bold text-slate-800 text-sm">
                    {selectedDetail.tanggal_kunjungan ? selectedDetail.tanggal_kunjungan.split('T')[0] : '-'}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Lokasi Kegiatan:
                </span>
                <p className="font-bold text-slate-800">
                  {selectedDetail.lokasi_kegiatan || selectedDetail.lokasi || '-'}
                </p>
              </div>

              {/* Integrasi Nota Dinas (Arsip) */}
              <div className="p-4 bg-gradient-to-r from-indigo-50/70 to-teal-50/70 border border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <Archive size={13} className="text-indigo-600" />
                    Terintegrasi Modul Arsip
                  </span>
                  <Link
                    href="/arsip/nota-dinas"
                    className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1"
                  >
                    <span>Buka Arsip</span>
                    <ExternalLink size={10} />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Nomor Nota Dinas</span>
                    <span className="font-mono font-black text-slate-900">{selectedDetail.nomor_nota_dinas || 'Otomatis di-generate sistem'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Nomor Berita Acara (BAP)</span>
                    <span className="font-mono font-black text-teal-800">
                      {`600.4/${(selectedDetail.nomor_nota_dinas || '').split('/')[1] || '001'}/BAP/17/${new Date(selectedDetail.tanggal_kunjungan || new Date()).getFullYear()}`}
                    </span>
                  </div>
                </div>
              </div>

              {selectedDetail.token && (
                <div className="bg-teal-50/60 p-4 rounded-xl border border-teal-200 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-teal-800 tracking-wider block">
                      Token Akses BIDIDLH.apk / Form Mobile:
                    </span>
                    <span className="font-mono text-base font-black text-slate-900 mt-0.5 block">
                      {selectedDetail.token}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(selectedDetail.token)}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 shrink-0"
                  >
                    {copiedToken === selectedDetail.token ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedToken === selectedDetail.token ? 'Tersalin' : 'Salin Tautan'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
              >
                Tutup
              </button>

              {Array.isArray(selectedDetail.bap_pengawasans) && selectedDetail.bap_pengawasans.length > 0 ? (
                <Link
                  href="/pengawasan/arsip"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
                >
                  <FileText size={14} />
                  <span>Buka di Arsip BAP</span>
                </Link>
              ) : (
                <Link
                  href={`/pengawasan/ba/isi/${selectedDetail.id}`}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Isi BAP Sekarang</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
