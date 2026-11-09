'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Search, CalendarPlus, Edit3, Copy, MapPin, 
  Database, Check, ChevronLeft, ChevronRight, Calendar, 
  Zap, Clock, AlertCircle, Trash2, ExternalLink, User, 
  Shield, CheckCircle2, X, Eye, Compass, Layers, FileText, Archive,
  FileSpreadsheet
} from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function DaftarAgenda() {
  const [agendas, setAgendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue'>('all');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  // Modals state
  const [selectedAgenda, setSelectedAgenda] = useState<any | null>(null);
  const [agendaToDelete, setAgendaToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAgendas = () => {
    setLoading(true);
    fetch('/api/pengawasan?type=agenda', { cache: 'no-store' })
      .then(res => res.json())
      .then(res => {
        setAgendas(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAgendas();
  }, []);

  // Helper date urgency
  const getUrgency = (dateStr: string) => {
    if (!dateStr) return { type: 'upcoming', label: 'Mendatang', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    
    const today = new Date().toISOString().split('T')[0];
    const visitDate = dateStr.split('T')[0];

    if (visitDate === today) {
      return { type: 'today', label: 'Hari Ini', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    }
    if (visitDate > today) {
      return { type: 'upcoming', label: 'Mendatang', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    return { type: 'overdue', label: 'Terlewat', color: 'bg-amber-100 text-amber-800 border-amber-300' };
  };

  // Filter Data
  const filtered = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const q = searchTerm.toLowerCase().trim();

    return agendas.filter(a => {
      // 1. Search Query
      const matchSearch = !q || (
        (a.nama_kegiatan || '').toLowerCase().includes(q) ||
        (a.nama_pemrakarsa || '').toLowerCase().includes(q) ||
        (a.kategori || '').toLowerCase().includes(q) ||
        (a.token || '').toLowerCase().includes(q) ||
        (a.tim_tugas || '').toLowerCase().includes(q) ||
        (a.alamat_lokasi || '').toLowerCase().includes(q)
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

      // 3. Time / Schedule Filter
      if (timeFilter !== 'all') {
        const visitDate = (a.tanggal_kunjungan || '').split('T')[0];
        if (timeFilter === 'today' && visitDate !== today) return false;
        if (timeFilter === 'upcoming' && visitDate <= today) return false;
        if (timeFilter === 'overdue' && visitDate >= today) return false;
      }

      return true;
    });
  }, [agendas, searchTerm, activeCategory, timeFilter]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeCategory, timeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const copyLink = (token: string) => {
    if (!token) return;
    const url = `${window.location.origin}/pengawasan/token?token=${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2500);
    });
  };

  const handleDeleteAgenda = async () => {
    if (!agendaToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/pengawasan?id=${agendaToDelete.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Gagal menghapus agenda');
      setAgendas(prev => prev.filter(a => a.id !== agendaToDelete.id));
      setAgendaToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat menghapus');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (activeCategory !== 'Semua') params.set('kategori', activeCategory);
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    window.location.href = `/api/export/pengawasan?${params.toString()}`;
  };

  const categories = ['Semua', 'Industri', 'Fasyankes', 'Perumahan', 'Toko Modern', 'SPPG', 'Lainnya'];

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

            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 border-[3px] border-slate-200 flex items-center justify-center shadow-sm shrink-0">
              <Calendar size={32} strokeWidth={2.5} />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                  Agenda Kunjungan
                </h1>
                <span className="text-[11px] font-black px-3 py-1 rounded-full bg-emerald-50 text-slate-900 border-[3px] border-slate-200 uppercase shadow-md flex items-center gap-1.5">
                  <Zap size={14} className="text-emerald-500" /> Total {agendas.length} Jadwal
                </span>
              </div>
              <p className="text-sm font-bold text-slate-600 mt-2 tracking-wide">
                Buku induk riwayat dan jadwal inspeksi lapangan pengawasan lingkungan hidup.
              </p>
              
              <div className="mt-5 flex items-center gap-3 flex-wrap">
                <Link
                  href="/pengawasan/buat-agenda"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all"
                >
                  <CalendarPlus size={16} />
                  <span>+ Buat Agenda Baru</span>
                </Link>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all"
                  title="Unduh rekapitulasi data pengawasan ke format Excel (.xlsx)"
                >
                  <FileSpreadsheet size={16} />
                  <span>Export Excel</span>
                </button>
                <Link
                  href="/pengawasan/database"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl border border-slate-200 transition-colors"
                >
                  <Database size={16} />
                  <span>Lihat Database Sasaran</span>
                </Link>
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

          {/* SUB-HEADER TOOLBAR & TIME FILTERS */}
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
            
            {/* Search Box & Time Filter Pills */}
            <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari kegiatan, PT, token, tim..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase"
                />
              </div>

              {/* Quick Time Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setTimeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border ${
                    timeFilter === 'all'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semua Waktu
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('today')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border ${
                    timeFilter === 'today'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  🟢 Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('upcoming')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border ${
                    timeFilter === 'upcoming'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  🗓️ Mendatang
                </button>
                <button
                  type="button"
                  onClick={() => setTimeFilter('overdue')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border ${
                    timeFilter === 'overdue'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  ⚠️ Terlewat
                </button>
              </div>
            </div>

            {/* Pagination Controls */}
            {!loading && filtered.length > 0 && (
              <div className="flex items-center gap-3 self-end md:self-auto">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Hal {currentPage} / {totalPages} ({filtered.length} Data)
                </span>
                <div className="flex gap-1.5">
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
          
          {/* TABEL DATA AGENDA */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest">
                <tr>
                  <th className="py-4 px-4 text-center w-12">No</th>
                  <th className="py-4 px-4 w-44">Token & Jadwal</th>
                  <th className="py-4 px-5">Objek Pengawasan</th>
                  <th className="py-4 px-5">Tim Pengawas</th>
                  <th className="py-4 px-4 text-center w-36">Status</th>
                  <th className="py-4 px-4 text-center w-52">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500 font-bold text-sm">
                      <LottieLoader size={140} text="MEMUAT AGENDA KUNJUNGAN..." />
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500 font-bold text-sm">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Calendar className="w-12 h-12 text-slate-300" />
                        <span className="uppercase tracking-wider">
                          {searchTerm || activeCategory !== 'Semua' || timeFilter !== 'all'
                            ? 'Tidak ada agenda kunjungan yang cocok dengan filter aktif.'
                            : 'Belum ada agenda kunjungan lapangan yang dijadwalkan.'}
                        </span>
                        <Link
                          href="/pengawasan/buat-agenda"
                          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                        >
                          + Buat Jadwal Baru
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((agenda, index) => {
                    const urgency = getUrgency(agenda.tanggal_kunjungan);
                    const officers = (agenda.tim_tugas || '').split('|').map((o: string) => o.trim()).filter(Boolean);
                    const leader = officers[0] || null;
                    const otherOfficers = officers.slice(1);

                    return (
                      <tr 
                        key={agenda.id} 
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                        onClick={() => setSelectedAgenda(agenda)}
                      >
                        {/* 1. NO */}
                        <td className="py-4 px-4 text-center font-bold text-slate-400 text-xs">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>

                        {/* 2. TOKEN & JADWAL */}
                        <td className="py-4 px-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-900 border border-slate-200 uppercase tracking-wider shadow-sm">
                                {agenda.token || 'NO-TOKEN'}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyLink(agenda.token)}
                                title="Salin Link Token BAP"
                                className="p-1 rounded hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors"
                              >
                                {copiedToken === agenda.token ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-700">
                                {new Date(agenda.tanggal_kunjungan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase ${urgency.color}`}>
                                {urgency.label}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. OBJEK PENGAWASAN */}
                        <td className="py-4 px-5 whitespace-normal break-words min-w-[220px]">
                          <div className="space-y-1">
                            <span className="font-black text-slate-900 text-sm block leading-snug uppercase">
                              {agenda.nama_kegiatan}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                                {agenda.kategori || 'Umum'}
                              </span>
                              <span className="text-xs font-bold text-slate-600 uppercase">
                                {agenda.nama_pemrakarsa || '—'}
                              </span>
                              {agenda.nomor_nota_dinas && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono tracking-tight" title="Nomor Nota Dinas Terintegrasi Arsip">
                                  Nota: {agenda.nomor_nota_dinas}
                                </span>
                              )}
                            </div>
                            {agenda.alamat_lokasi && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1">
                                <MapPin size={11} className="text-rose-500 shrink-0" />
                                {agenda.alamat_lokasi}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* 4. TIM PENGAWAS & SAKSI */}
                        <td className="py-4 px-5 whitespace-normal break-words min-w-[200px]">
                          <div className="space-y-1">
                            {leader ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-slate-900 uppercase">
                                  {leader}
                                </span>
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-300 uppercase">
                                  Ketua
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-slate-400 italic">Belum ditugaskan</span>
                            )}

                            {otherOfficers.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                {otherOfficers.slice(0, 2).map((off, i) => (
                                  <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                                    {off}
                                  </span>
                                ))}
                                {otherOfficers.length > 2 && (
                                  <span className="text-[10px] font-bold text-slate-400">
                                    +{otherOfficers.length - 2} lainnya
                                  </span>
                                )}
                              </div>
                            )}

                            {agenda.saksi && (
                              <p className="text-[10px] font-bold text-indigo-700 uppercase pt-0.5">
                                Saksi: {agenda.saksi.replace(/\|/g, ', ')}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* 5. STATUS KETAATAN / BAP */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {(() => {
                            const st = (agenda.status_ketaatan || '').toUpperCase();
                            if (st === 'TAAT') return (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black uppercase rounded-lg shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> TAAT
                              </span>
                            );
                            if (st === 'TAAT BERSYARAT' || st === 'KURANG TAAT') return (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black uppercase rounded-lg shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> BERSYARAT
                              </span>
                            );
                            if (st === 'TIDAK TAAT') return (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 text-xs font-black uppercase rounded-lg shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> TIDAK TAAT
                              </span>
                            );
                            return (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-xs font-black uppercase rounded-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> BELUM BAP
                              </span>
                            );
                          })()}
                        </td>

                        {/* 6. AKSI (TOMBOL KONSISTEN & RAPI) */}
                        <td className="py-4 px-4 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Tombol Isi / Buka BAP */}
                            <Link 
                              href={`/pengawasan/ba/isi/${agenda.id}`} 
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg shadow-sm transition-all hover:-translate-y-0.5"
                              title="Buka / Isi Berita Acara Pengawasan"
                            >
                              <Edit3 size={13} />
                              <span>BAP</span>
                            </Link>

                            {/* Tombol Form Lapangan Langsung via Token */}
                            <Link
                              href={`/pengawasan/token?token=${agenda.token}`}
                              target="_blank"
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-sm transition-all"
                              title="Buka Tautan Form Petugas Lapangan"
                            >
                              <span>Token</span>
                              <ExternalLink size={12} />
                            </Link>

                            {/* Tombol Detail Agenda Modal */}
                            <button
                              type="button"
                              onClick={() => setSelectedAgenda(agenda)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="Lihat Detail Lengkap Agenda"
                            >
                              <Eye size={14} />
                            </button>

                            {/* Tombol Hapus Agenda */}
                            <button
                              type="button"
                              onClick={() => setAgendaToDelete(agenda)}
                              className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                              title="Hapus / Batalkan Agenda"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DETAIL AGENDA */}
      {selectedAgenda && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-slate-200 rounded-[2rem] max-w-xl w-full p-6 md:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                  {selectedAgenda.kategori || 'Pengawasan Lingkungan'}
                </span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase mt-1">
                  {selectedAgenda.nama_kegiatan}
                </h3>
                <p className="text-xs font-bold text-slate-500 uppercase">
                  Pemrakarsa: {selectedAgenda.nama_pemrakarsa || '—'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAgenda(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Info Grid */}
            <div className="space-y-4 text-xs">
              
              {/* Token & Jadwal Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    Token Kunjungan
                  </span>
                  <span className="font-mono text-lg font-black text-slate-900">
                    {selectedAgenda.token}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    Tanggal Jadwal
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {new Date(selectedAgenda.tanggal_kunjungan).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyLink(selectedAgenda.token)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-black uppercase text-[10px] flex items-center gap-1"
                >
                  {copiedToken === selectedAgenda.token ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedToken === selectedAgenda.token ? 'Disalin' : 'Salin Tautan'}</span>
                </button>
              </div>

              {/* Integrasi Nota Dinas (Arsip) & Nomor BAP */}
              <div className="p-4 bg-gradient-to-r from-indigo-50/70 to-teal-50/70 border border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <FileText size={13} className="text-indigo-600" />
                    Integrasi Modul Arsip
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
                    <span className="font-mono font-black text-slate-900">{selectedAgenda.nomor_nota_dinas || 'Otomatis di-generate sistem'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Nomor Berita Acara (BAP)</span>
                    <span className="font-mono font-black text-teal-800">
                      {`600.4/${(selectedAgenda.nomor_nota_dinas || '').split('/')[1] || '001'}/BAP/17/${new Date(selectedAgenda.tanggal_kunjungan || new Date()).getFullYear()}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Alamat & Titik Lokasi */}
              <div>
                <span className="font-black text-slate-700 uppercase tracking-wider block mb-1">
                  Alamat / Lokasi:
                </span>
                <p className="text-slate-900 font-bold bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {selectedAgenda.alamat_lokasi || 'Tidak ada catatan alamat spesifik.'}
                </p>
                {selectedAgenda.latitude && selectedAgenda.longitude && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-600">
                      {selectedAgenda.latitude}, {selectedAgenda.longitude}
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${selectedAgenda.latitude},${selectedAgenda.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-600 font-bold hover:underline"
                    >
                      <Compass size={12} /> Buka Google Maps ↗
                    </a>
                  </div>
                )}
              </div>

              {/* Tim Pengawas */}
              <div>
                <span className="font-black text-slate-700 uppercase tracking-wider block mb-1.5">
                  Daftar Petugas Pengawas:
                </span>
                <div className="space-y-1.5">
                  {(selectedAgenda.tim_tugas || '').split('|').map((petugas: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-800 text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 uppercase">
                        {petugas.trim()}
                      </span>
                      {idx === 0 && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 uppercase ml-auto">
                          Ketua Tim
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Saksi */}
              {selectedAgenda.saksi && (
                <div>
                  <span className="font-black text-slate-700 uppercase tracking-wider block mb-1">
                    Saksi Pendamping:
                  </span>
                  <p className="font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {selectedAgenda.saksi.replace(/\|/g, ', ')}
                  </p>
                </div>
              )}

            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Link
                href={`/pengawasan/token?token=${selectedAgenda.token}`}
                target="_blank"
                className="w-full sm:w-auto px-4 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-indigo-100 transition-colors"
              >
                <span>Buka Form Token</span>
                <ExternalLink size={14} />
              </Link>
              
              <Link
                href={`/pengawasan/ba/isi/${selectedAgenda.id}`}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Edit3 size={14} />
                <span>Isi / Buka BAP</span>
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS AGENDA */}
      {agendaToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-slate-200 rounded-[2rem] max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div>
              <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Hapus Jadwal Agenda?
              </h4>
              <p className="text-xs font-bold text-slate-600 mt-1 uppercase">
                {agendaToDelete.nama_kegiatan}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Agenda ini akan dihapus dari sistem pengawasan. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAgendaToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteAgenda}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider transition-colors shadow-sm"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
