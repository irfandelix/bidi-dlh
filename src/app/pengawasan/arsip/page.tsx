'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Archive, ArrowLeft, Search, Calendar, MapPin, Building2, 
  CheckCircle2, AlertCircle, XCircle, Printer, ChevronLeft, 
  ChevronRight, Upload, FileCheck, LayoutGrid, List, Zap, 
  ExternalLink, User, Shield, Check, Eye, Clock, FileText,
  FileSpreadsheet
} from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function ArsipPengawasan() {
  const [arsip, setArsip] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState<'all' | 'taat' | 'bersyarat' | 'tidak_taat'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 9 : 10;

  const fetchArsip = () => {
    setLoading(true);
    fetch('/api/pengawasan?type=arsip', { cache: 'no-store' })
      .then(res => res.json())
      .then(res => {
        setArsip(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchArsip();
  }, []);

  const handleUploadManual = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingId(id);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`/api/pengawasan/bap/${id}/upload-manual`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        alert('Berhasil mengunggah BAP fisik / bertanda tangan!');
        fetchArsip();
      } else {
        const err = await res.json();
        alert('Gagal: ' + (err.error || 'Terjadi kesalahan'));
      }
    } catch(err) {
      alert('Error saat mengunggah file.');
    } finally {
      setUploadingId(null);
    }
  };

  // Helper status normalization
  const getStatusType = (status: string | null) => {
    const s = (status || '').toUpperCase();
    if (s === 'TAAT') return 'taat';
    if (s.includes('BERSYARAT') || s.includes('KURANG')) return 'bersyarat';
    if (s.includes('TIDAK')) return 'tidak_taat';
    return 'selesai';
  };

  // Statistics
  const stats = useMemo(() => {
    let taat = 0;
    let bersyarat = 0;
    let tidakTaat = 0;

    arsip.forEach(a => {
      const st = getStatusType(a.status_ketaatan);
      if (st === 'taat') taat++;
      else if (st === 'bersyarat') bersyarat++;
      else if (st === 'tidak_taat') tidakTaat++;
    });

    return { total: arsip.length, taat, bersyarat, tidakTaat };
  }, [arsip]);

  // Filter Data
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return arsip.filter(a => {
      // 1. Search Query
      const matchSearch = !q || (
        (a.nama_kegiatan || '').toLowerCase().includes(q) ||
        (a.nama_pemrakarsa || '').toLowerCase().includes(q) ||
        (a.kategori || '').toLowerCase().includes(q) ||
        (a.token || '').toLowerCase().includes(q) ||
        (a.tim_tugas || '').toLowerCase().includes(q)
      );

      if (!matchSearch) return false;

      // 2. Category Filter
      if (activeCategory !== 'Semua') {
        const kat = (a.kategori || '').toLowerCase();
        if (activeCategory === 'Lainnya') {
          const standardKats = ['fasyankes', 'industri', 'perumahan', 'toko modern', 'sppg'];
          if (standardKats.includes(kat)) return false;
        } else if (kat !== activeCategory.toLowerCase()) {
          return false;
        }
      }

      // 3. Status Filter
      if (statusFilter !== 'all') {
        const st = getStatusType(a.status_ketaatan);
        if (statusFilter !== st) return false;
      }

      return true;
    });
  }, [arsip, searchTerm, activeCategory, statusFilter]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeCategory, statusFilter, viewMode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const categories = ['Semua', 'Industri', 'Fasyankes', 'Perumahan', 'Toko Modern', 'SPPG', 'Lainnya'];

  const getManualUrl = (agenda: any) => {
    if (agenda.bap_pengawasans && agenda.bap_pengawasans[0]) {
      const matriks = agenda.bap_pengawasans[0].data_matriks_c;
      if (typeof matriks === 'string') {
        try { return JSON.parse(matriks).file_bap_manual; } catch(e){}
      } else if (matriks) {
        return matriks.file_bap_manual;
      }
    }
    return null;
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (activeCategory !== 'Semua') params.set('kategori', activeCategory);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    else params.set('status', 'selesai');
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    window.location.href = `/api/export/pengawasan?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6 font-sans pb-24">
        
        {/* HEADER CARD - SAMA DENGAN DASHBOARD PENGAWASAN */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-lg relative overflow-hidden">
          {/* Decorative Circle */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full border border-slate-200 opacity-50"></div>
          
          <div className="flex flex-col md:flex-row gap-5 items-start relative z-10">
            <Link 
              href="/pengawasan" 
              className="w-16 h-16 shrink-0 bg-indigo-500 text-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-md hover:bg-indigo-600 hover:-translate-y-1 hover:shadow-md transition-all"
              title="Kembali ke Dashboard Pengawasan"
            >
              <ArrowLeft size={32} />
            </Link>

            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 border-[3px] border-slate-200 flex items-center justify-center shadow-sm shrink-0">
              <Archive size={32} strokeWidth={2.5} />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                  Arsip BAP Pengawasan
                </h1>
                <span className="text-[11px] font-black px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border-[2px] border-indigo-200 uppercase shadow-sm flex items-center gap-1.5">
                  <FileCheck size={14} className="text-indigo-600" /> Dokumen Selesai
                </span>
              </div>
              <p className="text-sm font-bold text-slate-600 mt-2 tracking-wide">
                Buku induk riwayat kunjungan lapangan yang telah selesai dan memiliki Berita Acara resmi.
              </p>
              
              {/* Quick Compliance Statistics Pills */}
              <div className="mt-5 flex items-center gap-2.5 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 text-slate-800 font-black text-xs uppercase tracking-wider border border-slate-200 rounded-xl shadow-sm">
                  <Archive size={14} className="text-slate-500" /> Total {stats.total} Berkas
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 font-black text-xs uppercase tracking-wider border border-emerald-200 rounded-xl shadow-sm">
                  <CheckCircle2 size={14} className="text-emerald-600" /> {stats.taat} Taat
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 text-amber-800 font-black text-xs uppercase tracking-wider border border-amber-200 rounded-xl shadow-sm">
                  <AlertCircle size={14} className="text-amber-600" /> {stats.bersyarat} Bersyarat
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-rose-50 text-rose-800 font-black text-xs uppercase tracking-wider border border-rose-200 rounded-xl shadow-sm">
                  <XCircle size={14} className="text-rose-600" /> {stats.tidakTaat} Tidak Taat
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CARD CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-lg overflow-hidden">
          
          {/* CATEGORY TABS (PILLS) */}
          <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/70 p-3 gap-2 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-white text-slate-900 border-[2px] border-slate-200 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* SUB-HEADER TOOLBAR: SEARCH, STATUS FILTER & VIEW MODE TOGGLE */}
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
            
            <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari kegiatan, pemrakarsa..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase"
                />
              </div>

              {/* Status Ketaatan Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('taat')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border ${
                    statusFilter === 'taat'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  🟢 Taat
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('bersyarat')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border ${
                    statusFilter === 'bersyarat'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  🟡 Bersyarat
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('tidak_taat')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border ${
                    statusFilter === 'tidak_taat'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  🔴 Tidak Taat
                </button>
              </div>
            </div>

            {/* View Mode Toggle & Pagination */}
            <div className="flex items-center gap-3 self-end md:self-auto">
              {/* Export Excel Button */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:shadow transition-all"
                title="Unduh Rekapitulasi Arsip BAP ke format Excel (.xlsx)"
              >
                <FileSpreadsheet size={15} />
                <span className="hidden sm:inline">Export Excel</span>
              </button>

              {/* Grid / Table Toggle */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Tampilan Grid Kartu"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'table' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Tampilan Tabel Rapi"
                >
                  <List size={16} />
                </button>
              </div>

              {/* Pagination Controls */}
              {!loading && filtered.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider hidden sm:inline">
                    Hal {currentPage} / {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-700 shadow-sm hover:bg-slate-50 transition-all disabled:opacity-40"
                    >
                      <ChevronLeft size={16} strokeWidth={2.5} />
                    </button>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-700 shadow-sm hover:bg-slate-50 transition-all disabled:opacity-40"
                    >
                      <ChevronRight size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* BODY: GRID OR TABLE */}
          <div className="p-6">
            {loading ? (
              <div className="p-16 text-center text-slate-500 font-bold text-sm">
                <LottieLoader size={140} text="MEMUAT ARSIP PENGAWASAN..." />
              </div>
            ) : paginated.length === 0 ? (
              <div className="py-16 text-center text-slate-500 font-bold text-xs uppercase border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
                <Archive size={32} className="mx-auto text-slate-300" />
                <p>Tidak ada arsip pengawasan yang cocok dengan filter.</p>
              </div>
            ) : viewMode === 'grid' ? (
              
              /* GRID VIEW (KARTU MODERN) */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginated.map(agenda => {
                  const manualUrl = getManualUrl(agenda);
                  const st = getStatusType(agenda.status_ketaatan);
                  const officers = (agenda.tim_tugas || '').split('|').map((o: string) => o.trim()).filter(Boolean);
                  const leader = officers[0] || null;

                  return (
                    <div 
                      key={agenda.id} 
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 hover:border-slate-300"
                    >
                      <div className="space-y-3">
                        {/* Header Badges: Kategori & Status Ketaatan */}
                        <div className="flex justify-between items-center gap-2">
                          <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {agenda.kategori || 'Umum'}
                          </span>

                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg border ${
                            st === 'taat' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                              : st === 'tidak_taat'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : st === 'bersyarat'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {agenda.status_ketaatan || 'Selesai'}
                          </span>
                        </div>

                        {/* Title & Pemrakarsa */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                              #{agenda.token || String(agenda.id).padStart(4, '0')}
                            </span>
                          </div>
                          <h3 className="text-base font-black text-slate-900 uppercase leading-snug line-clamp-2">
                            {agenda.nama_kegiatan}
                          </h3>
                          <p className="text-xs font-bold text-slate-500 uppercase mt-0.5 line-clamp-1">
                            {agenda.nama_pemrakarsa || '—'}
                          </p>
                        </div>

                        {/* Tanggal & Tim Pengawas */}
                        <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                          <div className="flex items-center gap-2 font-bold text-slate-700">
                            <Calendar size={14} className="text-indigo-600 shrink-0" />
                            <span>
                              {new Date(agenda.tanggal_kunjungan).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                            </span>
                          </div>

                          {leader && (
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 truncate">
                              <Shield size={13} className="text-teal-600 shrink-0" />
                              <span className="truncate">Ketua: {leader}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-3 border-t border-slate-100">
                        <div className="flex gap-2">
                          <Link 
                            href={`/pengawasan/detail/${encodeURIComponent(agenda.kategori || 'Umum')}/${agenda.id}`} 
                            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider py-2.5 px-3 rounded-xl shadow-sm transition-all"
                          >
                            <Eye size={13} />
                            <span>Detail BAP</span>
                          </Link>

                          <a 
                            href={`/api/pengawasan/bap/${agenda.id}/generate`} 
                            target="_blank" 
                            rel="noreferrer" 
                            title="Unduh BAP Resmi (Format Word)" 
                            className="inline-flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 p-2.5 rounded-xl shadow-sm transition-colors"
                          >
                            <Printer size={16} />
                          </a>
                        </div>
                        
                        {/* Manual Signed BAP Upload/View */}
                        {manualUrl ? (
                          <a 
                            href={manualUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-black text-[11px] uppercase tracking-wider py-2 px-3 rounded-xl transition-colors"
                          >
                            <FileCheck size={14} />
                            <span>Lihat BAP Bertanda Tangan</span>
                          </a>
                        ) : (
                          <label className={`w-full inline-flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-dashed border-slate-300 font-bold text-[11px] uppercase tracking-wider py-2 px-3 rounded-xl transition-colors cursor-pointer ${uploadingId === agenda.id ? 'opacity-50 pointer-events-none' : ''}`}>
                            <Upload size={14} className="text-slate-500" />
                            <span>{uploadingId === agenda.id ? 'Mengunggah...' : 'Unggah BAP Scan Fisik'}</span>
                            <input 
                              type="file" 
                              accept="image/*,.pdf" 
                              className="hidden" 
                              onChange={(e) => handleUploadManual(e, agenda.id)} 
                            />
                          </label>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (

              /* TABLE VIEW (TABEL RAPI) */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest">
                    <tr>
                      <th className="py-3.5 px-4 text-center w-12">No</th>
                      <th className="py-3.5 px-4 w-40">Token & Tanggal</th>
                      <th className="py-3.5 px-5">Objek Pengawasan</th>
                      <th className="py-3.5 px-5">Tim Pengawas</th>
                      <th className="py-3.5 px-4 text-center w-36">Status</th>
                      <th className="py-3.5 px-4 text-center w-56">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paginated.map((agenda, index) => {
                      const manualUrl = getManualUrl(agenda);
                      const st = getStatusType(agenda.status_ketaatan);
                      const officers = (agenda.tim_tugas || '').split('|').map((o: string) => o.trim()).filter(Boolean);
                      const leader = officers[0] || null;

                      return (
                        <tr key={agenda.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-4 text-center font-bold text-slate-400 text-xs">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 uppercase block w-fit mb-1">
                              {agenda.token || 'NO-TOKEN'}
                            </span>
                            <span className="text-xs font-bold text-slate-600">
                              {new Date(agenda.tanggal_kunjungan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </td>

                          <td className="py-4 px-5 whitespace-normal break-words min-w-[200px]">
                            <span className="font-black text-slate-900 text-sm block leading-snug uppercase">
                              {agenda.nama_kegiatan}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                                {agenda.kategori || 'Umum'}
                              </span>
                              <span className="text-xs font-bold text-slate-600 uppercase">
                                {agenda.nama_pemrakarsa || '—'}
                              </span>
                            </div>
                          </td>

                          <td className="py-4 px-5 whitespace-normal break-words min-w-[180px]">
                            {leader ? (
                              <div className="space-y-0.5">
                                <span className="text-xs font-black text-slate-900 uppercase block">
                                  {leader}
                                </span>
                                {officers.length > 1 && (
                                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                                    +{officers.length - 1} anggota lainnya
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Tidak tercatat</span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg border inline-block ${
                              st === 'taat' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                                : st === 'tidak_taat'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : st === 'bersyarat'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {agenda.status_ketaatan || 'Selesai'}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <Link 
                                href={`/pengawasan/detail/${encodeURIComponent(agenda.kategori || 'Umum')}/${agenda.id}`} 
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-black uppercase text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all"
                              >
                                <Eye size={12} />
                                <span>Detail</span>
                              </Link>

                              <a 
                                href={`/api/pengawasan/bap/${agenda.id}/generate`} 
                                target="_blank" 
                                rel="noreferrer" 
                                title="Unduh BAP Word" 
                                className="inline-flex items-center justify-center p-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                              >
                                <Printer size={14} />
                              </a>

                              {manualUrl ? (
                                <a 
                                  href={manualUrl} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  title="Lihat BAP Final"
                                  className="inline-flex items-center justify-center p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                                >
                                  <FileCheck size={14} />
                                </a>
                              ) : (
                                <label 
                                  title="Unggah Scan BAP Manual"
                                  className="inline-flex items-center justify-center p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Upload size={14} />
                                  <input 
                                    type="file" 
                                    accept="image/*,.pdf" 
                                    className="hidden" 
                                    onChange={(e) => handleUploadManual(e, agenda.id)} 
                                  />
                                </label>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
