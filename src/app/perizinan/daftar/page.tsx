'use client';

import LottieLoader from '@/components/LottieLoader';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { 
  LayoutDashboard, Zap, Plus, FileText, MapPin, 
  ClipboardCheck, FileEdit, CheckCircle, History, 
  Printer, Kanban, CircleDashed, Archive, RotateCcw, Clock, Search, Info, ChevronDown, ChevronUp, Download, Filter
} from 'lucide-react';

type Dokumen = any; // Will use proper types later

export default function DaftarPerizinanPage() {
  const [docs, setDocs] = useState<Dokumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Dokumen | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  const toggleRow = (id: number) => {
    setExpandedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
  };

  useEffect(() => {
    fetch('/api/perizinan')
      .then(res => res.json())
      .then(res => {
        setDocs(res.data || []);
        setLoading(false);
      });
  }, []);

  const stats = {
    total: docs.length,
    ujiAdmin: docs.filter(d => d.status_tahapan === 'Registrasi').length,
    verlap: docs.filter(d => d.status_tahapan === 'Uji Administrasi Selesai').length,
    substansi: docs.filter(d => d.status_tahapan === 'Verlap Selesai').length,
    revisi: docs.filter(d => d.status_tahapan === 'Revisi').length,
    selesai: docs.filter(d => d.status_tahapan === 'Selesai').length,
  };

  const stages = [
    { id: 1, title: '1. Registrasi', shortTitle: 'Registrasi', statuses: ['Registrasi', 'PROSES'], color: 'slate', icon: FileText, link: '/perizinan/registrasi' },
    { id: 2, title: '2. Uji Admin', shortTitle: 'Uji Admin', statuses: ['Uji Administrasi'], color: 'teal', icon: ClipboardCheck, link: '/perizinan/uji-administrasi' },
    { id: 3, title: '3. Verlap', shortTitle: 'Verlap', statuses: ['Verifikasi Lapangan', 'Uji Administrasi Selesai'], color: 'amber', icon: MapPin, link: '/perizinan/verifikasi-lapangan' },
    { id: 4, title: '4. Pemeriksaan', shortTitle: 'Pemeriksaan', statuses: ['Pemeriksaan Substansi', 'PEMERIKSAAN-SUBSTANSI', 'DIPERIKSA', 'Verlap Selesai'], color: 'indigo', icon: FileText, link: '/perizinan/pemeriksaan-substansi' },
    { id: 5, title: '5. Pengembalian BA', shortTitle: 'Pengembalian', statuses: ['Pengembalian BA', 'Dikembalikan / Ditolak', 'DIKEMBALIKAN'], color: 'rose', icon: RotateCcw, link: '/perizinan/pengembalian' },
    { id: 6, title: '6. Terima Perbaikan', shortTitle: 'Terima BA', statuses: [], color: 'emerald', icon: CheckCircle, link: '/perizinan/penerimaan-perbaikan' },
    { id: 7, title: '7. Pemeriksaan Revisi', shortTitle: 'Revisi', statuses: ['Pemeriksaan Revisi', 'Revisi', 'REVISI', 'Pemeriksaan Selesai', 'Penerimaan Perbaikan'], color: 'blue', icon: FileEdit, link: '/perizinan/pemeriksaan-revisi' },
    { id: 8, title: '8. Pengembalian Revisi', shortTitle: 'Kembali Revisi', statuses: ['Pengembalian Revisi'], color: 'rose', icon: RotateCcw, link: '/perizinan/pengembalian' },
    { id: 9, title: '9. Terima Revisi', shortTitle: 'Terima Revisi', statuses: [], color: 'emerald', icon: CheckCircle, link: '/perizinan/penerimaan-perbaikan' },
    { id: 10, title: '10. Finalisasi (RPD & SK)', shortTitle: 'Finalisasi', statuses: ['Penyerahan SK', 'Selesai / SK', 'Selesai', 'Revisi Selesai', 'Penerimaan Revisi', 'Revisi Lanjutan'], color: 'purple', icon: FileText, link: '/perizinan/finalisasi' },
    { id: 11, title: '11. Jilidan Final', shortTitle: 'Jilidan', statuses: ['Penerimaan Jilidan', 'Menunggu Jilidan'], color: 'orange', icon: FileText, link: '/perizinan/jilidan' },
    { id: 12, title: '12. Arsip', shortTitle: 'Arsip', statuses: ['Arsip', 'Diarsipkan', 'ARSIP', 'Jilidan Selesai'], color: 'slate', icon: Archive, link: '/perizinan/arsip' },
  ];

  const colorMap: Record<string, any> = {
    slate: { light: 'bg-slate-50', text: 'text-slate-700', solid: 'bg-slate-500', icon: 'text-slate-500', hover: 'hover:text-slate-600', cardBg: 'bg-slate-100', cardText: 'text-slate-600' },
    emerald: { light: 'bg-emerald-50', text: 'text-emerald-700', solid: 'bg-emerald-500', icon: 'text-emerald-500', hover: 'hover:text-emerald-600', cardBg: 'bg-emerald-100', cardText: 'text-emerald-600' },
  };

  const groupTabs = [
    { id: 0, title: 'Semua Dokumen', shortTitle: 'Semua', color: 'slate', icon: LayoutDashboard, filterFn: (d: any) => true },
    { id: 1, title: 'Tabel Arsip Perizinan', shortTitle: 'Arsip', color: 'emerald', icon: Archive, filterFn: (d: any) => true },
  ];

  const [activeGroup, setActiveGroup] = useState<any>(groupTabs[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  const renderAccordionContent = (d: any) => {
    let fisik: any = {};
    try {
      if (d.arsip_fisik) {
        fisik = typeof d.arsip_fisik === 'string' ? JSON.parse(d.arsip_fisik) : d.arsip_fisik;
        if (typeof fisik === 'string') fisik = JSON.parse(fisik);
      }
    } catch (e) {}

    const sections = [
      { title: '1. Dokumen Lingkungan Final', number: fisik?.noDokumenCetak, url: fisik?.urlDokumenCetak, status: fisik?.dokumenCetak || fisik?.urlDokumenCetak },
      { title: '2. PKPLH Arsip', number: fisik?.noPkplhArsip, url: fisik?.urlPkplh, status: fisik?.pkplhArsip || fisik?.urlPkplh },
      { title: '3. BA Uji Administrasi', number: d.nomor_uji_berkas, url: fisik?.urlUjiAdmin, status: d.nomor_uji_berkas || fisik?.urlUjiAdmin },
      { title: '4. BA Verlap', number: d.nomor_ba_verlap, url: fisik?.urlBaVerlap, status: d.nomor_ba_verlap || fisik?.urlBaVerlap },
      { title: '5. BA Pemeriksaan/Sidang', number: d.nomor_ba_pemeriksaan, url: fisik?.urlBaSidang, status: d.nomor_ba_pemeriksaan || fisik?.urlBaSidang },
      { title: '6. BA Pemeriksaan Revisi', number: d.nomor_revisi, url: fisik?.urlRevisi, status: d.nomor_revisi || fisik?.urlRevisi },
      { title: '7. Surat Permohonan (Awal)', number: fisik?.noSuratPermohonan, url: fisik?.urlSuratPermohonan, status: fisik?.suratPermohonan || fisik?.urlSuratPermohonan },
      { title: '8. Lembar Registrasi', number: d.nomor_checklist, url: fisik?.urlRegistrasi, status: d.nomor_checklist || fisik?.urlRegistrasi },
      { title: '9. Lembar Pengembalian', number: d.tanggal_pengembalian, url: fisik?.urlPengembalian, status: d.tanggal_pengembalian || fisik?.urlPengembalian },
      { title: '10. Penerimaan Perbaikan / PHP', number: d.nomor_php, url: fisik?.urlPhp, status: d.nomor_php || fisik?.urlPhp },
      { title: '11. Undangan Sidang', number: fisik?.noUndanganSidang, url: fisik?.urlUndanganSidang, status: fisik?.undanganSidang || fisik?.urlUndanganSidang },
      { title: d.jenis_dokumen === 'SPPL' ? '12. Pengesahan SPPL' : '12. Penyusunan RPD', number: d.jenis_dokumen === 'SPPL' ? fisik?.noRpdArsip : d.nomor_risalah, url: fisik?.urlRpd, status: d.nomor_risalah || fisik?.rpdArsip || fisik?.urlRpd },
    ];

    return (
      <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 shadow-sm text-left">
        <div className="bg-white p-5 rounded-xl border border-slate-200 mb-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <div className="space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Status Tahapan Saat Ini</h4>
                <p className="text-sm font-bold text-slate-900 uppercase">
                  <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-lg border border-amber-200 shadow-sm">{d.status_tahapan || '-'}</span>
                </p>
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Nama Pemrakarsa</h4>
                <p className="text-sm font-bold text-slate-900 uppercase">{d.nama_pemrakarsa || '-'}</p>
              </div>
           </div>

           <div className="space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Lokasi Kegiatan</h4>
                <p className="text-sm font-bold text-slate-900 uppercase">{d.lokasi_kegiatan || '-'}</p>
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Jenis Kegiatan</h4>
                <p className="text-sm font-bold text-slate-900 uppercase">{d.jenis_kegiatan || '-'}</p>
              </div>
           </div>

           <div className="space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Lokasi Arsip / Lemari</h4>
                <p className="text-sm font-bold text-slate-900">{d.lokasi_arsip || '-'}</p>
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Titik Koordinat (Peta)</h4>
                <p className="text-sm font-bold text-slate-900">{d.latitude && d.longitude ? `${d.latitude}, ${d.longitude}` : '-'}</p>
              </div>
           </div>

           <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Riwayat Tanggal Penting</h4>
              <ul className="space-y-1.5">
                <li className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tgl Masuk</span>
                  <span className="text-[10px] font-black text-slate-900">{d.tanggal_masuk_dokumen || '-'}</span>
                </li>
                <li className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tgl Uji Admin</span>
                  <span className="text-[10px] font-black text-slate-900">{d.tanggal_uji_berkas || '-'}</span>
                </li>
                <li className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tgl Verlap</span>
                  <span className="text-[10px] font-black text-slate-900">{d.tanggal_ba_verlap || '-'}</span>
                </li>
                <li className="flex justify-between items-center border-b border-slate-100 pb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tgl Sidang</span>
                  <span className="text-[10px] font-black text-slate-900">{d.tanggal_ba_pemeriksaan || '-'}</span>
                </li>
              </ul>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map(s => (
             <div key={s.title} className={`p-4 rounded-xl border ${s.status ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                <div className="flex items-start gap-3">
                   <div className="mt-0.5">{s.status ? <CheckCircle size={16} className="text-emerald-600"/> : <CircleDashed size={16} className="text-slate-300"/>}</div>
                   <div className="flex-1">
                      <p className="text-xs font-black uppercase text-slate-800 leading-tight mb-2">{s.title}</p>
                      <div className="bg-white/60 px-2 py-1.5 rounded border border-slate-200/60 min-h-7 flex items-center">
                         {s.number ? <p className="text-[10px] font-bold text-slate-700 uppercase break-all">{s.number}</p> : <p className="text-[10px] font-bold text-slate-400 uppercase">BELUM ADA NOMOR</p>}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-slate-200/50">
                        {s.url ? (
                          <a href={s.url} onClick={e => e.stopPropagation()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-black bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors border border-emerald-200 shadow-sm w-fit">
                             <FileText size={12}/> LIHAT DOKUMEN
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 w-fit">
                             <FileText size={12}/> BELUM UPLOAD
                          </span>
                        )}
                      </div>
                   </div>
                </div>
             </div>
          ))}
        </div>
      </div>
    );
  };



  if (loading) {
    return <LottieLoader size={150} text="MEMUAT DATA..." />;
  }

  const getStageForStatus = (status: string, d?: any) => {
    if (d && d.nomor_sk && !['Arsip', 'Diarsipkan', 'ARSIP', 'Jilidan Selesai', 'Penerimaan Jilidan'].includes(status)) {
      return stages.find(s => s.id === 11) || stages[10];
    }
    return stages.find(s => s.statuses.includes(status)) || stages[1]; // default to Uji Admin if not found
  };

  const getFiles = (d: any) => {
    if (!d.arsip_fisik) return [];
    let parsed: any = {};
    try {
      parsed = JSON.parse(d.arsip_fisik);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    } catch(e) { return []; }
    
    const files = [];
    if (parsed.urlDokumenCetak) files.push({ name: 'Dok. Final', url: parsed.urlDokumenCetak });
    if (parsed.urlPkplh) files.push({ name: 'PKPLH', url: parsed.urlPkplh });
    if (parsed.urlUjiAdmin) files.push({ name: 'Uji Admin', url: parsed.urlUjiAdmin });
    if (parsed.urlBaVerlap) files.push({ name: 'BA Verlap', url: parsed.urlBaVerlap });
    if (parsed.urlBaSidang) files.push({ name: 'BA Sidang', url: parsed.urlBaSidang });
    if (parsed.urlRpd) files.push({ name: 'RPD', url: parsed.urlRpd });
    return files;
  };

  // Filter docs based on active group
  const activeDocs = docs.filter(d => {
    const matchesGroup = activeGroup.filterFn(d);
    if (!matchesGroup) return false;
    
    if (filterTahun && String(d.tahun) !== String(filterTahun)) return false;
    if (filterJenis && d.jenis_dokumen !== filterJenis) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchNama = d.nama_kegiatan?.toLowerCase().includes(query);
      const matchLokasi = d.lokasi_kegiatan?.toLowerCase().includes(query);
      const matchTanggal = d.tanggal_masuk_dokumen?.toLowerCase().includes(query) || d.created_at?.toLowerCase().includes(query);
      const matchPemrakarsa = d.nama_pemrakarsa?.toLowerCase().includes(query);
      
      if (!matchNama && !matchLokasi && !matchTanggal && !matchPemrakarsa) return false;
    }
    
    return true;
  });

  const handleExportExcel = () => {
    const dataToExport = activeDocs.map((d, index) => {
      let fisik: any = {};
      try {
        if (d.arsip_fisik) {
          fisik = typeof d.arsip_fisik === 'string' ? JSON.parse(d.arsip_fisik) : d.arsip_fisik;
          if (typeof fisik === 'string') fisik = JSON.parse(fisik);
        }
      } catch(e) {}
      
      return {
        "NO": index + 1,
        "TAHUN": d.tahun || '-',
        "NO URUT": d.no_urut || d.id,
        "NAMA PEMRAKARSA": d.nama_pemrakarsa || '-',
        "JENIS KEGIATAN": d.jenis_kegiatan || '-',
        "LOKASI KEGIATAN": d.lokasi_kegiatan || '-',
        "JENIS DOKUMEN": d.jenis_dokumen || '-',
        "STATUS TAHAPAN": d.status_tahapan || '-',
        "TANGGAL MASUK": d.tanggal_masuk_dokumen || '-',
        "TANGGAL UJI ADMIN": d.tanggal_uji_berkas || '-',
        "TANGGAL VERLAP": d.tanggal_ba_verlap || '-',
        "TANGGAL SIDANG": d.tanggal_ba_pemeriksaan || '-',
        "NOMOR CHECKLIST": d.nomor_checklist || '-',
        "NOMOR BA UJI": d.nomor_uji_berkas || '-',
        "NOMOR BA VERLAP": d.nomor_ba_verlap || '-',
        "NOMOR BA SIDANG": d.nomor_ba_pemeriksaan || '-',
        "LOKASI ARSIP": d.lokasi_arsip || '-',
        "KOORDINAT": (d.latitude && d.longitude) ? `${d.latitude}, ${d.longitude}` : '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Arsip Perizinan");
    
    const fileName = `Laporan_Arsip_Perizinan_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };
  // Pagination
  const totalPages = Math.ceil(activeDocs.length / itemsPerPage);
  const paginatedDocs = activeDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8 pb-20 px-4">
      
      {/* Header Neobrutalism Style (Light Variant) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-lg text-slate-900 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-200 rounded-full border border-slate-200 opacity-30"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-indigo-400 border border-slate-200 flex items-center justify-center text-slate-900 shadow-md">
            <LayoutDashboard size={28} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight">Dashboard Perizinan</h2>
            <p className="text-sm text-slate-600 font-bold mt-1">Ringkasan aktivitas dan pergerakan dokumen lingkungan hidup.</p>
          </div>
        </div>
        
        <div className="flex items-center flex-wrap gap-3 relative z-10">
          <div className="bg-emerald-50 px-5 py-3 rounded-xl border border-slate-200 flex items-center gap-3 text-sm font-black text-slate-900 shadow-md">
            <Zap size={18} className="text-emerald-500 fill-emerald-500" />
            Total {stats.total} Dokumen
          </div>
          <Link href="/perizinan/nota-dinas" className="bg-amber-400 hover:bg-amber-300 hover:-translate-y-1 text-slate-900 px-5 py-3 rounded-xl text-sm font-black shadow-md hover:shadow-sm border border-slate-200 transition-all flex items-center gap-2">
            <FileText size={18} /> Nota Dinas
          </Link>
          <Link href="/perizinan/registrasi" className="bg-indigo-400 hover:bg-indigo-300 hover:-translate-y-1 text-slate-900 px-5 py-3 rounded-xl text-sm font-black shadow-md hover:shadow-sm border border-slate-200 transition-all flex items-center gap-2">
            <Plus size={18} /> Berkas Baru
          </Link>
        </div>
      </div>

      {/* 2 Group Tabs (Minimalist) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {groupTabs.map((group) => {
          const theme = colorMap[group.color];
          const Icon = group.icon;
          const isActive = activeGroup.id === group.id;

          return (
            <button 
              onClick={() => { setActiveGroup(group); setCurrentPage(1); }}
              key={group.id} 
              className={`p-4 rounded-xl border border-slate-200 transition-all group flex flex-row items-center justify-center gap-4 cursor-pointer w-full ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-sm translate-y-1' 
                  : 'bg-white shadow-md hover:-translate-y-1 hover:shadow-md'
              }`}
            >
              <div className={`w-12 h-12 shrink-0 rounded-xl border border-slate-200 flex items-center justify-center shadow-sm transition-transform ${
                isActive ? 'bg-white text-slate-900 scale-110' : `${theme.cardBg} ${theme.cardText} group-hover:scale-110`
              }`}>
                <Icon size={20} />
              </div>
              <p className={`text-sm font-black tracking-wide uppercase text-left ${isActive ? 'text-white' : 'text-slate-800'}`}>
                {group.title}
              </p>
            </button>
          );
        })}
      </div>

      {/* Dynamic Data Table (NeoBrutalism) */}
      <div className="bg-white border border-slate-200 shadow-lg rounded-3xl overflow-hidden mt-8">
        <div className="bg-slate-100 border-b-4 border-slate-200 p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
              {(() => {
                const ActiveIcon = activeGroup.icon;
                return <ActiveIcon size={20} className="text-slate-900" />;
              })()}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase">{activeGroup.id === 1 ? 'Daftar Arsip Perizinan' : 'Daftar Semua Dokumen'}</h3>
              <p className="text-sm font-bold text-slate-500">{activeDocs.length} dokumen {activeGroup.id === 0 && !searchQuery ? 'keseluruhan' : 'ditemukan'}</p>
            </div>
          </div>
          
          <div className="flex items-center flex-wrap gap-3 w-full xl:w-auto">
            <select 
              value={filterTahun}
              onChange={(e) => { setFilterTahun(e.target.value); setCurrentPage(1); }}
              className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-400 cursor-pointer shadow-sm"
            >
              <option value="">Semua Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>

            <select 
              value={filterJenis}
              onChange={(e) => { setFilterJenis(e.target.value); setCurrentPage(1); }}
              className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-400 cursor-pointer shadow-sm"
            >
              <option value="">Semua Jenis</option>
              <option value="SPPL">SPPL</option>
              <option value="UKL-UPL">UKL-UPL</option>
              <option value="AMDAL">AMDAL</option>
            </select>

            <div className="relative flex-1 md:min-w-[200px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari nama, lokasi..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border-2 border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-400 shadow-sm transition-colors"
              />
            </div>
            
            <button 
              onClick={handleExportExcel}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm border border-emerald-600"
            >
              <Download size={18} /> Ekspor Excel
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {activeGroup.id === 0 ? (
            // TABEL SEMUA DOKUMEN
            <table className="w-full text-left">
              <thead className="bg-white border-b-4 border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-200">NO URUT / THN</th>
                  <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-200">Nama Kegiatan</th>
                  <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-200">Pemrakarsa</th>
                  <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-200">Tanggal Masuk</th>
                  <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-900">
                {activeDocs.length > 0 ? (
                  paginatedDocs.map((d) => (
                    <React.Fragment key={d.id}>
<tr onClick={() => toggleRow(d.id)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                      <td className="px-6 py-4 border-r-2 border-slate-200">
                        <span className="bg-slate-200 text-slate-900 font-black px-2 py-1 rounded border border-slate-200 text-xs shadow-sm">
                          #{d.no_urut || d.id}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-r-2 border-slate-200">
                        <p className="font-bold text-slate-900 text-sm uppercase">{d.nama_kegiatan}</p>
                        <p className="text-xs font-bold text-slate-500">{d.jenis_dokumen}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm border-r-2 border-slate-200">
                          {d.nama_pemrakarsa || '-'}
                        </td>
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm border-r-2 border-slate-200">
                        {d.tanggal_masuk_dokumen}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDoc(d);
                              setIsActionModalOpen(true);
                            }}
                            className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 text-xs font-black px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all uppercase"
                          >
                            BUKA
                          </button>
                          <Link 
                            onClick={(e) => e.stopPropagation()}
                            href={`/perizinan/cetak/${d.id}`}
                            className="bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all flex items-center gap-1 uppercase"
                            title="Pusat Cetak Dokumen"
                          >
                            <Printer size={14} /> Cetak
                          </Link>
                          <button className="w-8 h-8 shrink-0 rounded-lg bg-slate-200 flex items-center justify-center group-hover:bg-indigo-200 group-hover:text-indigo-700 transition-colors shadow-sm border border-slate-300">
                            {expandedRows.includes(d.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows.includes(d.id) && (
                        <tr className="bg-slate-50 border-b-2 border-slate-200 cursor-default" onClick={e => e.stopPropagation()}>
                            <td colSpan={5} className="p-8 border-r-2 border-l-2 border-slate-200">
                                <div className="w-full mx-auto overflow-x-auto pb-4">
                                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-8 text-center sticky left-0">Progress Dokumen (Tahapan Aktif: {d.status_tahapan || 'Registrasi'})</h4>
                                  <div className="flex items-center justify-between relative mt-4 mb-4 min-w-[800px]">
                                      <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1.5 bg-slate-200 rounded-full z-0"></div>
                                      <div className="absolute left-4 top-1/2 -translate-y-1/2 h-1.5 bg-indigo-500 rounded-full z-0 transition-all duration-500" style={{ width: `${Math.min(100, ((getStageForStatus(d.status_tahapan, d).id - 1) / 11) * 100)}%` }}></div>
                                      
                                      {stages.map(stageData => {
                                          const stepId = stageData.id;
                                          const currentStageId = getStageForStatus(d.status_tahapan, d).id;
                                          
                                          const isPast = currentStageId > stepId;
                                          const isCurrent = currentStageId === stepId;
                                          
                                          return (
                                              <div key={stepId} className="relative z-10 flex flex-col items-center gap-2 group flex-1">
                                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${isCurrent ? 'border-indigo-100 bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' : isPast ? 'border-indigo-100 bg-indigo-500 text-white' : 'border-slate-100 bg-white text-slate-300'} transition-all`}>
                                                      {stageData && <stageData.icon size={16} />}
                                                  </div>
                                                  <div className={`absolute top-12 text-center whitespace-nowrap text-[10px] font-black uppercase tracking-tight ${isCurrent ? 'text-indigo-600' : isPast ? 'text-slate-700' : 'text-slate-400'}`}>
                                                      {stageData?.shortTitle}
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                                </div>
                            </td>
                        </tr>
                    )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-bold bg-slate-50">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CircleDashed size={32} className="text-slate-300" />
                        <p>Tidak ada dokumen di tahap ini.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            // TABEL ARSIP PERIZINAN
            <table className="w-full text-left">
              <thead className="bg-white border-b-4 border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-200 w-32">NO URUT</th>
                  <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-200">Nama Kegiatan</th>
                  <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-200 w-40">Tanggal Masuk</th>
                  
                  <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-900">
                {activeDocs.length > 0 ? (
                  paginatedDocs.map((d) => (
                    <React.Fragment key={d.id}>
                      <tr onClick={() => toggleRow(d.id)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                        <td className="px-6 py-4 border-r-2 border-slate-200">
                          <div className="flex items-center gap-2">
                            <button className="w-6 h-6 shrink-0 rounded-full bg-slate-200 flex items-center justify-center group-hover:bg-indigo-200 group-hover:text-indigo-700 transition-colors">
                              {expandedRows.includes(d.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <span className="bg-emerald-100 text-emerald-800 font-black px-2 py-1 rounded border border-emerald-200 text-xs shadow-sm">
                              #{String(d.no_urut || d.id).padStart(3, '0')} / {d.tahun || '2026'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 border-r-2 border-slate-200">
                          <p className="font-bold text-slate-900 text-sm uppercase">{d.nama_kegiatan}</p>
                          <p className="text-xs font-bold text-slate-600 uppercase mt-1 flex items-center gap-2">
                             <span className="bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300">{d.jenis_dokumen}</span> 
                             
                          </p>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700 text-sm border-r-2 border-slate-200">
                          {d.tanggal_masuk_dokumen || '-'}
                        </td>
                        
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col gap-2">
                            <Link 
                              href={`/perizinan/arsip/${d.id}`}
                              onClick={e => e.stopPropagation()}
                              className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 text-xs font-black px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all flex items-center justify-center gap-1 uppercase"
                              title="Buka Detail Arsip"
                            >
                              <Info size={14} /> Detail
                            </Link>
                            <Link 
                              href={`/perizinan/cetak/${d.id}`}
                              onClick={e => e.stopPropagation()}
                              className="bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all flex items-center justify-center gap-1 uppercase"
                              title="Pusat Cetak Dokumen"
                            >
                              <Printer size={14} /> Cetak
                            </Link>
                          </div>
                        </td>
                      </tr>
                      {expandedRows.includes(d.id) && (
                        <tr className="bg-slate-50 border-b-2 border-slate-200">
                          <td colSpan={4} className="p-4 border-r-2 border-l-2 border-slate-200">
                            {renderAccordionContent(d)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-bold bg-slate-50">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Archive size={32} className="text-slate-300" />
                        <p>Tidak ada arsip perizinan.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-slate-100 border-t-4 border-slate-200 p-6 flex items-center justify-between">
            <span className="text-sm font-black text-slate-700 uppercase">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex gap-4">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black uppercase shadow-md hover:-translate-y-1 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md transition-all"
              >
                Sebelumnya
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-5 py-2.5 bg-indigo-400 border border-slate-200 rounded-xl text-sm font-black text-slate-900 uppercase shadow-md hover:-translate-y-1 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md transition-all"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Pilih Tahapan */}
      {isActionModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border-4 border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b-4 border-slate-200 bg-emerald-50 flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-900 text-lg uppercase tracking-wide flex items-center gap-2">
                  <LayoutDashboard size={20} className="text-emerald-600" /> BUKA TAHAPAN DOKUMEN
                </h3>
                <p className="text-xs font-bold text-slate-500 mt-1 uppercase">#{selectedDoc.no_urut || selectedDoc.id} - {selectedDoc.nama_kegiatan}</p>
              </div>
              <button onClick={() => { setIsActionModalOpen(false); setSelectedDoc(null); }} className="w-8 h-8 rounded-full bg-slate-200 hover:bg-rose-200 hover:text-rose-700 flex items-center justify-center font-bold text-slate-600 transition-colors shrink-0">
                ✕
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto bg-slate-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stages.map((stage) => {
                  const Icon = stage.icon;
                  const isCurrent = stage.statuses.includes(selectedDoc.status_tahapan);
                  const currentStageId = getStageForStatus(selectedDoc.status_tahapan, selectedDoc).id;
                  let isDisabled = false; // Membuka semua tombol agar bisa diinput tidak urut
                  
                  let docNumber = '';
                  if (stage.id === 1 && selectedDoc.nomor_checklist) docNumber = selectedDoc.nomor_checklist;
                  if (stage.id === 2 && selectedDoc.nomor_uji_berkas) docNumber = selectedDoc.nomor_uji_berkas;
                  if (stage.id === 3 && selectedDoc.nomor_ba_verlap) docNumber = selectedDoc.nomor_ba_verlap;
                  if (stage.id === 4 && selectedDoc.nomor_ba_pemeriksaan) docNumber = selectedDoc.nomor_ba_pemeriksaan;
                  if (stage.id === 10) {
                    if (selectedDoc.nomor_risalah) docNumber = selectedDoc.nomor_risalah;
                    else if (selectedDoc.nomor_sk) docNumber = selectedDoc.nomor_sk;
                  }

                  const content = (
                    <>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                        isCurrent ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 
                        isDisabled ? 'bg-slate-50 border-slate-200 text-slate-300' :
                        'bg-slate-100 border-slate-200 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 group-hover:border-indigo-200'
                      }`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-black uppercase ${
                            isCurrent ? 'text-emerald-700' : 
                            isDisabled ? 'text-slate-300' :
                            'text-slate-700 group-hover:text-indigo-700'
                          }`}>
                            {stage.title}
                          </h4>
                        </div>
                        {docNumber && (
                          <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wide">
                            {docNumber}
                          </p>
                        )}
                        {isDisabled && (
                          <span className="inline-block mt-1 text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded tracking-widest">Belum Tersedia</span>
                        )}
                      </div>
                    </>
                  );

                  if (isDisabled) {
                    return (
                      <div 
                        key={stage.id}
                        className="p-4 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 flex items-center gap-3 cursor-not-allowed opacity-70"
                      >
                        {content}
                      </div>
                    );
                  }

                  return (
                    <Link 
                      key={stage.id}
                      href={`${stage.link}/${selectedDoc.id}`}
                      className={`group p-4 bg-white rounded-xl border-2 transition-all flex items-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-1 ${
                        isCurrent 
                          ? 'border-emerald-400 bg-emerald-50/50 ring-2 ring-emerald-400/20' 
                          : 'border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {content}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
