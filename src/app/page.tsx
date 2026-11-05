'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from "next/link";
import { 
  ArrowRight, FileText, ShieldCheck, Activity, CheckCircle2, Clock, 
  RotateCcw, AlertTriangle, ChevronRight, ChevronLeft, BarChart3, 
  Database, Calendar as CalendarIcon, Phone, FileSignature, MapPin, 
  Building2, User, Printer, Search, X, ExternalLink, Plus, Sparkles, 
  Map, Archive, FolderKanban, Inbox, Check, Eye
} from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import LottieLoader from '@/components/LottieLoader';

export default function Home() {
  const [stats, setStats] = useState({
    perizinan: { total: 0, selesai: 0, proses: 0, dikembalikan: 0, ditolak: 0 },
    pengawasan: { total: 0, taat: 0, kurang: 0, tidak: 0 },
    pengaduan: { total: 0, belum: 0, proses: 0, selesai: 0 }
  });
  
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [recentPengawasan, setRecentPengawasan] = useState<any[]>([]);
  const [recentAduan, setRecentAduan] = useState<any[]>([]);
  const [allPerizinan, setAllPerizinan] = useState<any[]>([]);
  const [allPengawasan, setAllPengawasan] = useState<any[]>([]);
  const [allPengaduan, setAllPengaduan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal View
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<'perizinan' | 'pengawasan' | 'pengaduan'>('perizinan');
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalSearch, setModalSearch] = useState('');

  // Calendar State & Interactive Selection
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const openModal = (title: string, type: 'perizinan' | 'pengawasan' | 'pengaduan', filterFn: (d: any) => boolean) => {
    setModalTitle(title);
    setModalType(type);
    setModalSearch('');
    if (type === 'perizinan') setModalData(allPerizinan.filter(filterFn));
    if (type === 'pengawasan') setModalData(allPengawasan.filter(filterFn));
    if (type === 'pengaduan') setModalData(allPengaduan.filter(filterFn));
    setIsModalOpen(true);
  };

  // Helper normalisasi status ketaatan pengawasan (case-insensitive)
  const getStatusKetaatan = (status: string | null) => {
    const s = (status || '').toUpperCase().trim();
    if (s === 'TAAT') return 'taat';
    if (s.includes('BERSYARAT') || s.includes('KURANG')) return 'kurang';
    if (s.includes('TIDAK')) return 'tidak';
    return 'belum';
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = createClient();
        
        const [perizinanRes, pengawasanRes, pengaduanRes] = await Promise.all([
          supabase.from('dokumens').select('*').order('created_at', { ascending: false }),
          supabase.from('pengawasan_lapangans').select('*').order('tanggal_kunjungan', { ascending: false }),
          supabase.from('pengaduans').select('*').order('created_at', { ascending: false })
        ]);

        // 1. Data Perizinan
        const pData: any[] = perizinanRes.data || [];
        const pSelesai = pData.filter(d => ['Selesai / SK', 'Menunggu Jilidan', 'Diarsipkan', 'Selesai'].includes(d.status_tahapan)).length;
        const pDikembalikan = pData.filter(d => ['DIKEMBALIKAN', 'Dikembalikan / Ditolak', 'Pengembalian BA', 'Pengembalian Revisi'].includes(d.status_tahapan)).length;
        const pDitolak = pData.filter(d => ['DITOLAK', 'BATAL', 'Ditolak', 'Batal'].includes(d.status_tahapan)).length;
        const pProses = pData.length - pSelesai - pDikembalikan - pDitolak;

        // 2. Data Pengawasan (Case-insensitive)
        const gData: any[] = pengawasanRes.data || [];
        let gTaat = 0;
        let gKurang = 0;
        let gTidak = 0;
        gData.forEach(d => {
          const st = getStatusKetaatan(d.status_ketaatan);
          if (st === 'taat') gTaat++;
          else if (st === 'kurang') gKurang++;
          else if (st === 'tidak') gTidak++;
        });

        // 3. Data Pengaduan (Real-Time)
        let aData: any[] = pengaduanRes.data || [];
        // Fallback jika anon client terhambat
        if (aData.length === 0) {
          try {
            const apiRes = await fetch('/api/pengaduan');
            const json = await apiRes.json();
            if (json.data) aData = json.data;
          } catch (e) {
            console.warn('Fallback pengaduan fetch error', e);
          }
        }

        const aBelum = aData.filter(d => ['Menunggu Isian', 'Belum Diproses', 'Baru', 'Pending'].includes(d.status_tahapan)).length;
        const aSelesai = aData.filter(d => ['Selesai', 'Diarsipkan', 'Tuntas'].includes(d.status_tahapan)).length;
        const aProses = aData.length - aBelum - aSelesai;

        setStats({
          perizinan: { total: pData.length, selesai: pSelesai, proses: pProses, dikembalikan: pDikembalikan, ditolak: pDitolak },
          pengawasan: { total: gData.length, taat: gTaat, kurang: gKurang, tidak: gTidak },
          pengaduan: { total: aData.length, belum: aBelum, proses: aProses, selesai: aSelesai }
        });

        setAllPerizinan(pData);
        setAllPengawasan(gData);
        setAllPengaduan(aData);

        setRecentDocs(pData.slice(0, 5));
        setRecentPengawasan(gData.slice(0, 5));
        setRecentAduan(aData.slice(0, 5));
        
        // Default select today
        const todayStr = new Date().toISOString().split('T')[0];
        setSelectedCalendarDate(todayStr);

        setLoading(false);
      } catch (err) {
        console.error("Gagal memuat data dashboard", err);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Map agenda pengawasan berdasarkan tanggal kunjungan (YYYY-MM-DD)
  const agendasByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    allPengawasan.forEach(item => {
      if (!item.tanggal_kunjungan) return;
      const tgl = item.tanggal_kunjungan.split('T')[0];
      if (!map[tgl]) map[tgl] = [];
      map[tgl].push(item);
    });
    return map;
  }, [allPengawasan]);

  // Calendar calculations
  const calendarYear = currentCalendarDate.getFullYear();
  const calendarMonth = currentCalendarDate.getMonth();
  const currentMonthLabel = currentCalendarDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 = Sun
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blankDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  const prevMonth = () => {
    setCurrentCalendarDate(new Date(calendarYear, calendarMonth - 1, 1));
  };
  const nextMonth = () => {
    setCurrentCalendarDate(new Date(calendarYear, calendarMonth + 1, 1));
  };

  // Selected date agenda items
  const selectedDateAgendas = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return agendasByDate[selectedCalendarDate] || [];
  }, [selectedCalendarDate, agendasByDate]);

  // Filtered items inside modal
  const filteredModalData = useMemo(() => {
    if (!modalSearch.trim()) return modalData;
    const q = modalSearch.toLowerCase();
    return modalData.filter(d => {
      const nama = (d.nama_kegiatan || d.nama_usaha || d.nama_pelapor || d.perihal || '').toLowerCase();
      const pemrakarsa = (d.nama_pemrakarsa || d.nama_penanggung_jawab || d.alamat_lokasi || '').toLowerCase();
      const no = String(d.no_urut || d.id || '').toLowerCase();
      return nama.includes(q) || pemrakarsa.includes(q) || no.includes(q);
    });
  }, [modalData, modalSearch]);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 mt-4 px-4 font-sans">
      
      {/* HERO SECTION WITH INTEGRATED QUICK ACTIONS */}
      <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] shadow-lg relative overflow-hidden">
        {/* Soft Decorative Elements */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-emerald-50 rounded-full border border-slate-200 opacity-60 pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-indigo-50 rounded-full border border-slate-200 opacity-60 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black uppercase tracking-widest rounded-lg mb-3 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Sistem Aktif • DLH Kab. Sragen
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
              BIDI <span className="text-emerald-600">DLH</span>
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm font-bold tracking-wide max-w-xl mt-2 leading-relaxed">
              Sistem Informasi Pelayanan Perizinan, Pengawasan Lapangan, Pengaduan Lingkungan, serta Pemetaan Wilayah Kabupaten Sragen.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link 
              href="/perizinan/registrasi" 
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              <Plus size={15} /> Permohonan Izin
            </Link>
            <Link 
              href="/pengawasan/buat-agenda" 
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              <Plus size={15} /> Agenda Pengawasan
            </Link>
            <Link 
              href="/pengaduan/tambah" 
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              <Plus size={15} /> Catat Aduan
            </Link>
          </div>
        </div>

        {/* 5 MODUL UTAMA PORTAL ACCESS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-8 pt-6 border-t border-slate-100">
          <Link
            href="/perizinan/daftar"
            className="p-4 bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 rounded-2xl transition-all shadow-xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <FileSignature size={20} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 group-hover:text-indigo-700 transition-colors">
              Perizinan
            </h4>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5 line-clamp-1">
              Daftar Dokumen & Uji
            </p>
          </Link>

          <Link
            href="/pengawasan"
            className="p-4 bg-slate-50 hover:bg-rose-50/70 border border-slate-200 hover:border-rose-300 rounded-2xl transition-all shadow-xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <ShieldCheck size={20} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 group-hover:text-rose-700 transition-colors">
              Pengawasan
            </h4>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5 line-clamp-1">
              Agenda & BAP Lapangan
            </p>
          </Link>

          <Link
            href="/pengaduan"
            className="p-4 bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-300 rounded-2xl transition-all shadow-xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <AlertTriangle size={20} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 group-hover:text-amber-700 transition-colors">
              Pengaduan
            </h4>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5 line-clamp-1">
              Laporan Masyarakat
            </p>
          </Link>

          <Link
            href="/peta"
            className="p-4 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-2xl transition-all shadow-xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Map size={20} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 group-hover:text-emerald-700 transition-colors">
              Peta Lokasi
            </h4>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5 line-clamp-1">
              GIS Titik Koordinat
            </p>
          </Link>

          <Link
            href="/arsip/persuratan"
            className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-2xl transition-all shadow-xs group col-span-2 sm:col-span-1"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Archive size={20} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 group-hover:text-slate-800 transition-colors">
              Persuratan
            </h4>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5 line-clamp-1">
              Arsip & Nota Dinas
            </p>
          </Link>
        </div>
      </div>

      {/* STATISTIC CARDS: PERIZINAN */}
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm">
              <FileSignature size={18} />
            </div>
            <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-widest">
              Data Perizinan
            </h2>
          </div>
          <Link href="/perizinan/daftar" className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 uppercase tracking-wider">
            Lihat Modul <ChevronRight size={14} />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div onClick={() => openModal('Total Permohonan Izin', 'perizinan', () => true)} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer block">
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Berkas</p>
            <h3 className="text-3xl md:text-4xl font-black text-slate-900">{loading ? '...' : stats.perizinan.total}</h3>
            <span className="text-[10px] font-bold text-slate-400 mt-1 block">Semua Dokumen</span>
          </div>

          <div onClick={() => openModal('Permohonan Sedang Diproses', 'perizinan', (d) => !['Selesai / SK', 'Menunggu Jilidan', 'Diarsipkan', 'DIKEMBALIKAN', 'Dikembalikan / Ditolak', 'Pengembalian BA', 'Pengembalian Revisi', 'DITOLAK', 'BATAL', 'Ditolak', 'Batal'].includes(d.status_tahapan))} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer block">
            <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest mb-1">Diproses</p>
            <h3 className="text-3xl md:text-4xl font-black text-amber-600">{loading ? '...' : stats.perizinan.proses}</h3>
            <span className="text-[10px] font-bold text-amber-500 mt-1 block">Uji & Verlap</span>
          </div>

          <div onClick={() => openModal('Permohonan Selesai / SK', 'perizinan', (d) => ['Selesai / SK', 'Menunggu Jilidan', 'Diarsipkan', 'Selesai'].includes(d.status_tahapan))} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer block">
            <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest mb-1">Selesai</p>
            <h3 className="text-3xl md:text-4xl font-black text-emerald-600">{loading ? '...' : stats.perizinan.selesai}</h3>
            <span className="text-[10px] font-bold text-emerald-500 mt-1 block">SK Terbit</span>
          </div>

          <div onClick={() => openModal('Permohonan Dikembalikan', 'perizinan', (d) => ['DIKEMBALIKAN', 'Dikembalikan / Ditolak', 'Pengembalian BA', 'Pengembalian Revisi'].includes(d.status_tahapan))} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer block">
            <p className="text-[11px] font-black text-blue-700 uppercase tracking-widest mb-1">Dikembalikan</p>
            <h3 className="text-3xl md:text-4xl font-black text-blue-600">{loading ? '...' : stats.perizinan.dikembalikan}</h3>
            <span className="text-[10px] font-bold text-blue-500 mt-1 block">Perlu Revisi</span>
          </div>

          <div onClick={() => openModal('Permohonan Ditolak / Batal', 'perizinan', (d) => ['DITOLAK', 'BATAL', 'Ditolak', 'Batal'].includes(d.status_tahapan))} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer block">
            <p className="text-[11px] font-black text-rose-700 uppercase tracking-widest mb-1">Ditolak / Batal</p>
            <h3 className="text-3xl md:text-4xl font-black text-rose-600">{loading ? '...' : stats.perizinan.ditolak}</h3>
            <span className="text-[10px] font-bold text-rose-500 mt-1 block">Tidak Memenuhi</span>
          </div>
        </div>
      </div>

      {/* STATISTIC CARDS: PENGAWASAN */}
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 border border-slate-200 flex items-center justify-center text-rose-600 shadow-sm">
              <ShieldCheck size={18} />
            </div>
            <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-widest">
              Data Pengawasan Lapangan
            </h2>
          </div>
          <Link href="/pengawasan" className="text-xs font-black text-rose-600 hover:text-rose-800 flex items-center gap-1 uppercase tracking-wider">
            Lihat Modul <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div onClick={() => openModal('Total Kegiatan Pengawasan', 'pengawasan', () => true)} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer block">
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Kegiatan</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl md:text-4xl font-black text-slate-900">{loading ? '...' : stats.pengawasan.total}</h3>
              <span className="text-slate-500 text-xs font-bold mb-1">Lokasi</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 mt-1 block">Target Pengawasan</span>
          </div>

          <div onClick={() => openModal('Pengawasan Kategori: Taat', 'pengawasan', (d) => getStatusKetaatan(d.status_ketaatan) === 'taat')} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer block">
            <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest mb-1">Ketaatan: Taat</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl md:text-4xl font-black text-emerald-600">{loading ? '...' : stats.pengawasan.taat}</h3>
              <span className="text-slate-500 text-xs font-bold mb-1">Lokasi</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-500 mt-1 block">Memenuhi Baku Mutu</span>
          </div>

          <div onClick={() => openModal('Pengawasan Kategori: Kurang Taat / Bersyarat', 'pengawasan', (d) => getStatusKetaatan(d.status_ketaatan) === 'kurang')} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer block">
            <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest mb-1">Kurang / Bersyarat</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl md:text-4xl font-black text-amber-600">{loading ? '...' : stats.pengawasan.kurang}</h3>
              <span className="text-slate-500 text-xs font-bold mb-1">Lokasi</span>
            </div>
            <span className="text-[10px] font-bold text-amber-500 mt-1 block">Perlu Perbaikan</span>
          </div>

          <div onClick={() => openModal('Pengawasan Kategori: Tidak Taat', 'pengawasan', (d) => getStatusKetaatan(d.status_ketaatan) === 'tidak')} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer block">
            <p className="text-[11px] font-black text-rose-700 uppercase tracking-widest mb-1">Tidak Taat</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl md:text-4xl font-black text-rose-600">{loading ? '...' : stats.pengawasan.tidak}</h3>
              <span className="text-slate-500 text-xs font-bold mb-1">Lokasi</span>
            </div>
            <span className="text-[10px] font-bold text-rose-500 mt-1 block">Sanksi / Teguran</span>
          </div>
        </div>
      </div>

      {/* STATISTIC CARDS: ADUAN (REAL-TIME) */}
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-slate-200 flex items-center justify-center text-amber-600 shadow-sm">
              <AlertTriangle size={18} />
            </div>
            <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-widest">
              Data Pengaduan Masyarakat
            </h2>
          </div>
          <Link href="/pengaduan" className="text-xs font-black text-amber-600 hover:text-amber-800 flex items-center gap-1 uppercase tracking-wider">
            Lihat Modul <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div onClick={() => openModal('Total Pengaduan Masyarakat', 'pengaduan', () => true)} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer block">
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Aduan</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl md:text-4xl font-black text-slate-900">{loading ? '...' : stats.pengaduan.total}</h3>
              <span className="text-slate-500 text-xs font-bold mb-1">Kasus</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 mt-1 block">Semua Tiket</span>
          </div>

          <div onClick={() => openModal('Aduan Belum Diproses', 'pengaduan', (d) => ['Menunggu Isian', 'Belum Diproses', 'Baru', 'Pending'].includes(d.status_tahapan))} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer block">
            <p className="text-[11px] font-black text-rose-700 uppercase tracking-widest mb-1">Menunggu Pelapor</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl md:text-4xl font-black text-rose-600">{loading ? '...' : stats.pengaduan.belum}</h3>
              <span className="text-slate-500 text-xs font-bold mb-1">Kasus</span>
            </div>
            <span className="text-[10px] font-bold text-rose-500 mt-1 block">Belum Isi Form</span>
          </div>

          <div onClick={() => openModal('Aduan Sedang Diproses', 'pengaduan', (d) => !['Menunggu Isian', 'Belum Diproses', 'Baru', 'Pending', 'Selesai', 'Diarsipkan', 'Tuntas'].includes(d.status_tahapan))} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer block">
            <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest mb-1">Sedang Proses</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl md:text-4xl font-black text-amber-600">{loading ? '...' : stats.pengaduan.proses}</h3>
              <span className="text-slate-500 text-xs font-bold mb-1">Kasus</span>
            </div>
            <span className="text-[10px] font-bold text-amber-500 mt-1 block">Verlap / Mediasi</span>
          </div>

          <div onClick={() => openModal('Aduan Selesai Ditangani', 'pengaduan', (d) => ['Selesai', 'Diarsipkan', 'Tuntas'].includes(d.status_tahapan))} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer block">
            <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest mb-1">Selesai</p>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl md:text-4xl font-black text-emerald-600">{loading ? '...' : stats.pengaduan.selesai}</h3>
              <span className="text-slate-500 text-xs font-bold mb-1">Kasus</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-500 mt-1 block">Tindak Lanjut Tuntas</span>
          </div>
        </div>
      </div>

      {/* AKTIVITAS TERBARU (3 SPLIT COLUMNS) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
            <Activity size={18} />
          </div>
          <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-widest">
            Aktivitas Pelayanan Terbaru
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Kolom 1: Perizinan */}
          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-md overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-indigo-50/70">
              <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide text-xs">
                <FileSignature size={15} className="text-indigo-600" /> Perizinan
              </h3>
              <Link href="/perizinan/daftar" className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center">
                LIHAT SEMUA <ChevronRight size={13} />
              </Link>
            </div>

            <div className="p-4 flex-1 bg-white space-y-2.5">
              {loading ? (
                <div className="py-12 flex justify-center"><LottieLoader size={80} text="MEMUAT..." /></div>
              ) : recentDocs.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-slate-400 font-bold uppercase tracking-wider text-xs border-2 border-dashed border-slate-200 rounded-xl">
                  Belum ada berkas perizinan
                </div>
              ) : (
                recentDocs.map((doc, i) => (
                  <Link 
                    key={i} 
                    href={`/perizinan/arsip/${doc.id}`}
                    className="group p-3 bg-white hover:bg-indigo-50/60 rounded-xl transition-all flex flex-col gap-1.5 border border-slate-200 hover:border-indigo-300 shadow-xs block"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-black text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-1 flex-1">
                        {doc.nama_kegiatan}
                      </h4>
                      <span className="shrink-0 text-[9px] font-black uppercase text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                        #{doc.no_urut || doc.id}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <span className="font-bold text-slate-500 line-clamp-1 flex-1">
                        {doc.nama_pemrakarsa || '—'}
                      </span>
                      <span className="shrink-0 px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md font-black uppercase tracking-wider text-[9px] border border-slate-200">
                        {doc.status_tahapan === 'Dikembalikan / Ditolak' ? 'DIKEMBALIKAN' : doc.status_tahapan || 'Antrean'}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Kolom 2: Pengawasan */}
          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-md overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-rose-50/70">
              <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide text-xs">
                <ShieldCheck size={15} className="text-rose-600" /> Pengawasan Lapangan
              </h3>
              <Link href="/pengawasan/agenda" className="text-[10px] font-black text-rose-600 hover:text-rose-800 flex items-center">
                LIHAT SEMUA <ChevronRight size={13} />
              </Link>
            </div>

            <div className="p-4 flex-1 bg-white space-y-2.5">
              {loading ? (
                <div className="py-12 flex justify-center"><LottieLoader size={80} text="MEMUAT..." /></div>
              ) : recentPengawasan.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-slate-400 font-bold uppercase tracking-wider text-xs border-2 border-dashed border-slate-200 rounded-xl">
                  Belum ada data pengawasan
                </div>
              ) : (
                recentPengawasan.map((doc, i) => {
                  const st = getStatusKetaatan(doc.status_ketaatan);
                  let warnaBadge = 'bg-slate-100 text-slate-800 border-slate-200';
                  if (st === 'taat') warnaBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  else if (st === 'kurang') warnaBadge = 'bg-amber-100 text-amber-800 border-amber-300';
                  else if (st === 'tidak') warnaBadge = 'bg-rose-100 text-rose-800 border-rose-300';

                  return (
                    <Link 
                      key={i} 
                      href="/pengawasan/agenda"
                      className="group p-3 bg-white hover:bg-rose-50/60 rounded-xl transition-all flex flex-col gap-1.5 border border-slate-200 hover:border-rose-300 shadow-xs block"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-black text-slate-900 group-hover:text-rose-700 transition-colors line-clamp-1 flex-1">
                          {doc.nama_kegiatan}
                        </h4>
                        <span className="shrink-0 text-[9px] font-black uppercase text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                          {doc.kategori || 'Umum'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[10px]">
                        <span className="font-bold text-slate-500 line-clamp-1 flex-1">
                          {doc.nama_pemrakarsa || '—'}
                        </span>
                        <span className={`shrink-0 px-2 py-0.5 rounded-md font-black uppercase tracking-wider text-[9px] border ${warnaBadge}`}>
                          {doc.status_ketaatan || 'Belum Dinilai'}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Kolom 3: Pengaduan (Real-Time) */}
          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-md overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-amber-50/70">
              <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide text-xs">
                <AlertTriangle size={15} className="text-amber-600" /> Pengaduan Masyarakat
              </h3>
              <Link href="/pengaduan" className="text-[10px] font-black text-amber-600 hover:text-amber-800 flex items-center">
                LIHAT SEMUA <ChevronRight size={13} />
              </Link>
            </div>

            <div className="p-4 flex-1 bg-white space-y-2.5">
              {loading ? (
                <div className="py-12 flex justify-center"><LottieLoader size={80} text="MEMUAT..." /></div>
              ) : recentAduan.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-slate-400 font-bold uppercase tracking-wider text-xs border-2 border-dashed border-slate-200 rounded-xl">
                  Belum ada data pengaduan
                </div>
              ) : (
                recentAduan.map((doc, i) => (
                  <Link 
                    key={i} 
                    href={`/pengaduan/detail/${doc.id}`}
                    className="group p-3 bg-white hover:bg-amber-50/60 rounded-xl transition-all flex flex-col gap-1.5 border border-slate-200 hover:border-amber-300 shadow-xs block"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-black text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1 flex-1">
                        {doc.perihal || 'Aduan Lingkungan'}
                      </h4>
                      <span className="shrink-0 text-[9px] font-black uppercase text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                        {doc.token || `#${doc.id}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <span className="font-bold text-slate-500 line-clamp-1 flex-1">
                        {doc.tanggal ? new Date(doc.tanggal).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '—'}
                      </span>
                      <span className="shrink-0 px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md font-black uppercase tracking-wider text-[9px] border border-slate-200">
                        {doc.status_tahapan || 'Baru'}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* KALENDER INTERAKTIF DENGAN PENANDA AGENDA PENGAWASAN */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-lg overflow-hidden">
        
        {/* Calendar Header with Month Navigation */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 border border-slate-200 flex items-center justify-center shadow-xs">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-wide text-sm md:text-base">
                Jadwal & Kalender Pengawasan
              </h3>
              <p className="text-xs font-bold text-slate-500">
                Memantau tanggal kegiatan inspeksi dan kunjungan lapangan DLH
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevMonth}
              className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-100 rounded-xl shadow-xs transition-colors"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl font-black text-xs uppercase tracking-wider text-slate-800 shadow-xs min-w-[140px] text-center">
              {currentMonthLabel}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-100 rounded-xl shadow-xs transition-colors"
              title="Bulan Berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Kolom Kiri: Grid Kalender Bulan */}
          <div className="lg:col-span-2">
            {/* Header Hari */}
            <div className="grid grid-cols-7 gap-2 text-center mb-3">
              {['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'].map((day, i) => (
                <div key={i} className={`font-black text-xs uppercase tracking-wider ${i === 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Grid Tanggal */}
            <div className="grid grid-cols-7 gap-2">
              {blankDays.map((_, i) => (
                <div key={`blank-${i}`} className="h-14 md:h-16"></div>
              ))}

              {daysArray.map((day) => {
                const dateKey = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = dateKey === todayStr;
                const isSelected = dateKey === selectedCalendarDate;
                const agendasOnDay = agendasByDate[dateKey] || [];
                const hasAgenda = agendasOnDay.length > 0;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedCalendarDate(dateKey)}
                    className={`h-14 md:h-16 flex flex-col items-center justify-between p-1.5 rounded-2xl font-black text-sm border-2 transition-all relative group ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                        : isToday
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                        : 'bg-slate-50/80 border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs leading-none mt-0.5">{day}</span>

                    {/* Penanda Agenda */}
                    {hasAgenda && (
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                          isSelected ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}>
                          {agendasOnDay.length} Lap.
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kolom Kanan: Detail Kegiatan pada Tanggal Terpilih */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col h-full">
            <div className="border-b border-slate-200 pb-3 mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Agenda Pengawasan Tanggal:
              </span>
              <h4 className="font-black text-slate-900 text-sm uppercase mt-0.5">
                {selectedCalendarDate ? new Date(selectedCalendarDate).toLocaleDateString('id-ID', { dateStyle: 'full' }) : 'Pilih Tanggal'}
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[320px] custom-scrollbar pr-1">
              {selectedDateAgendas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400 space-y-2">
                  <CalendarIcon size={32} strokeWidth={1.5} className="text-slate-300" />
                  <p className="text-xs font-bold uppercase tracking-wider">
                    Tidak ada agenda kunjungan lapangan pada tanggal ini.
                  </p>
                </div>
              ) : (
                selectedDateAgendas.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        {item.kategori || 'Umum'}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {item.token || '—'}
                      </span>
                    </div>

                    <h5 className="font-black text-xs text-slate-900 uppercase line-clamp-2">
                      {item.nama_kegiatan}
                    </h5>

                    {item.alamat_lokasi && (
                      <p className="text-[10px] text-slate-500 line-clamp-1 flex items-start gap-1">
                        <MapPin size={11} className="text-rose-500 shrink-0 mt-0.5" />
                        {item.alamat_lokasi}
                      </p>
                    )}

                    <div className="pt-1.5 border-t border-slate-100 flex justify-end">
                      <Link 
                        href="/pengawasan/agenda"
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 uppercase tracking-wider"
                      >
                        Buka di Agenda <ChevronRight size={11} />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* MODAL VIEW DAFTAR BERKAS DENGAN PENCARIAN REAL-TIME */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <h3 className="font-black text-slate-900 text-base uppercase tracking-tight">
                  {modalTitle} ({filteredModalData.length})
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-rose-100 hover:text-rose-700 flex items-center justify-center font-bold text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-3 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama kegiatan, pemrakarsa, atau nomor berkas..."
                  value={modalSearch}
                  onChange={e => setModalSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
            
            {/* Modal Content List */}
            <div className="p-4 flex-1 overflow-y-auto bg-slate-50/50 space-y-2.5 custom-scrollbar">
              {filteredModalData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <div className="font-black text-4xl mb-1">0</div>
                  <div className="text-xs font-bold uppercase tracking-widest">Tidak Ada Data Ditemukan</div>
                </div>
              ) : (
                filteredModalData.map((d, i) => (
                  <div key={i} className="group p-3.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="shrink-0 text-[9px] font-black uppercase text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                          #{d.no_urut || d.id || d.token}
                        </span>
                        <h4 className="text-xs font-black text-slate-900 uppercase">
                          {d.nama_kegiatan || d.nama_usaha || d.nama_pelapor || d.perihal}
                        </h4>
                      </div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase">
                        {d.nama_pemrakarsa || d.nama_penanggung_jawab || d.alamat_lokasi || (d.tanggal ? new Date(d.tanggal).toLocaleDateString('id-ID') : '—')}
                      </p>
                    </div>
                    
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-900 rounded-lg text-[9px] font-black uppercase tracking-wider border border-slate-200">
                        {modalType === 'perizinan' 
                          ? (d.status_tahapan === 'Dikembalikan / Ditolak' ? 'DIKEMBALIKAN' : d.status_tahapan) 
                          : (modalType === 'pengawasan' ? d.status_ketaatan || 'Belum Dinilai' : d.status_tahapan || 'Baru')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
              <Link 
                href={`/${modalType === 'perizinan' ? 'perizinan/daftar' : modalType}`} 
                className="px-6 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-colors uppercase tracking-widest shadow-sm"
              >
                Buka Modul Selengkapnya
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
