'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Database, Inbox, ArrowLeft, Archive, Factory, Building2, 
  Home, ShoppingCart, ChevronLeft, ChevronRight, Layers, Search, 
  ChevronDown, ChevronUp, Zap, Sparkles
} from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

interface GroupedFacility {
  key: string;
  id: string; // primary permit ID
  nama_kegiatan: string;
  nama_pemrakarsa: string;
  kategori: string;
  permits: any[];
}

// Levenshtein distance for fuzzy typo comparison
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function stringSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;
  return (longer.length - levenshtein(longer, shorter)) / longer.length;
}

function cleanTokens(str: string): string[] {
  const stopWords = new Set([
    'pt', 'cv', 'ud', 'tbk', 'oleh', 'kegiatan', 'pembangunan', 
    'operasional', 'rencana', 'dan', 'di', 'ke', 'yang', 'pada', 
    'untuk', 'sarana', 'prasarana', 'fasilitas', 'titik'
  ]);
  
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w));
}

// Intelligent matching that detects typos & corporate variations
function areFacilitiesMatching(itemA: any, itemB: any): boolean {
  const nameA = (itemA.nama_kegiatan || '').toLowerCase();
  const nameB = (itemB.nama_kegiatan || '').toLowerCase();
  
  if (nameA.trim() === nameB.trim() && nameA.trim().length > 0) return true;

  const pemA = (itemA.nama_pemrakarsa || '').toLowerCase().trim();
  const pemB = (itemB.nama_pemrakarsa || '').toLowerCase().trim();
  
  // Clean PT, CV, UD
  const pemCleanA = pemA.replace(/^(pt|cv|ud)\.?\s+/i, '');
  const pemCleanB = pemB.replace(/^(pt|cv|ud)\.?\s+/i, '');
  if (pemCleanA.length > 5 && pemCleanA === pemCleanB) {
    return true;
  }

  // Cross check company name appearing in activity name
  if (pemCleanA.length > 5 && nameB.includes(pemCleanA)) return true;
  if (pemCleanB.length > 5 && nameA.includes(pemCleanB)) return true;

  // Token-based fuzzy matching
  const tokensA = cleanTokens(nameA);
  const tokensB = cleanTokens(nameB);

  if (tokensA.length === 0 || tokensB.length === 0) return false;

  let matchedA = 0;
  for (const tA of tokensA) {
    let bestSim = 0;
    for (const tB of tokensB) {
      if (tA === tB) {
        bestSim = 1.0;
        break;
      }
      const sim = stringSimilarity(tA, tB);
      if (sim > bestSim) bestSim = sim;
    }
    if (bestSim >= 0.8) matchedA++;
  }

  let matchedB = 0;
  for (const tB of tokensB) {
    let bestSim = 0;
    for (const tA of tokensA) {
      if (tA === tB) {
        bestSim = 1.0;
        break;
      }
      const sim = stringSimilarity(tA, tB);
      if (sim > bestSim) bestSim = sim;
    }
    if (bestSim >= 0.8) matchedB++;
  }

  const scoreA = matchedA / tokensA.length;
  const scoreB = matchedB / tokensB.length;
  const avgScore = (scoreA + scoreB) / 2;

  const commonCount = Math.min(matchedA, matchedB);
  if (commonCount >= 3 && avgScore >= 0.72) return true;
  if (tokensA.length <= 3 && tokensB.length <= 3 && avgScore >= 0.8) return true;

  return false;
}

export default function DatabaseGabungan() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Industri');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [groupByFacility, setGroupByFacility] = useState(true);
  const [expandedRowKeys, setExpandedRowKeys] = useState<Record<string, boolean>>({});
  const itemsPerPage = 10;

  useEffect(() => {
    fetch('/api/perizinan')
      .then(res => res.json())
      .then(res => {
        if (res.data) {
          setData(res.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Reset pagination when tab or search or group changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, groupByFacility]);

  // Helper matching functions
  const isFasyankes = (nama: string, pemrakarsa: string, kategori: string) => {
    return (
      nama.includes('klinik') ||
      nama.includes('rs') ||
      nama.includes('rumah sakit') ||
      nama.includes('apotek') ||
      nama.includes('puskesmas') ||
      kategori.includes('fasyankes')
    );
  };

  const isPerumahan = (nama: string, pemrakarsa: string, kategori: string) => {
    return (
      nama.includes('perumahan') ||
      nama.includes('cluster') ||
      nama.includes('kavling') ||
      kategori.includes('perumahan')
    );
  };

  const isTokoModern = (nama: string, pemrakarsa: string, kategori: string) => {
    return (
      nama.includes('toko') ||
      nama.includes('minimarket') ||
      nama.includes('supermarket') ||
      nama.includes('swalayan') ||
      nama.includes('mart') ||
      kategori.includes('toko')
    );
  };

  const isIndustri = (nama: string, pemrakarsa: string, kategori: string) => {
    return (
      nama.includes('industri') ||
      nama.includes('pabrik') ||
      nama.includes('pt') ||
      nama.includes('cv') ||
      pemrakarsa.includes('pt') ||
      pemrakarsa.includes('cv') ||
      kategori.includes('industri')
    );
  };

  // Filter Data based on activeTab and searchQuery
  const filteredData = useMemo(() => {
    return data.filter((item: any) => {
      const nama = (item.nama_kegiatan || '').toLowerCase();
      const pemrakarsa = (item.nama_pemrakarsa || '').toLowerCase();
      const kategori = (item.kategori || '').toLowerCase();

      let matchTab = false;
      if (activeTab === 'Industri') {
        matchTab = isIndustri(nama, pemrakarsa, kategori);
      } else if (activeTab === 'Fasyankes') {
        matchTab = isFasyankes(nama, pemrakarsa, kategori);
      } else if (activeTab === 'Perumahan') {
        matchTab = isPerumahan(nama, pemrakarsa, kategori);
      } else if (activeTab === 'Toko Modern') {
        matchTab = isTokoModern(nama, pemrakarsa, kategori);
      } else if (activeTab === 'Lainnya') {
        matchTab =
          kategori.includes('lain') ||
          kategori.includes('sppg') ||
          (!isIndustri(nama, pemrakarsa, kategori) &&
            !isFasyankes(nama, pemrakarsa, kategori) &&
            !isPerumahan(nama, pemrakarsa, kategori) &&
            !isTokoModern(nama, pemrakarsa, kategori));
      } else {
        matchTab = true;
      }

      if (!matchTab) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return nama.includes(q) || pemrakarsa.includes(q) || kategori.includes(q);
      }

      return true;
    });
  }, [data, activeTab, searchQuery]);

  // Group by facility with Smart Fuzzy Matching
  const processedData: GroupedFacility[] = useMemo(() => {
    if (!groupByFacility) {
      return filteredData.map(item => ({
        key: String(item.id),
        id: item.id,
        nama_kegiatan: item.nama_kegiatan || 'Tanpa Nama Kegiatan',
        nama_pemrakarsa: item.nama_pemrakarsa || '—',
        kategori: item.kategori,
        permits: [item],
      }));
    }

    const groups: GroupedFacility[] = [];

    for (const item of filteredData) {
      let matchedGroup: GroupedFacility | null = null;

      for (const g of groups) {
        const isMatch = g.permits.some(existingPermit => areFacilitiesMatching(item, existingPermit));
        if (isMatch) {
          matchedGroup = g;
          break;
        }
      }

      if (matchedGroup) {
        matchedGroup.permits.push(item);
        // Prefer more complete and accurate name
        const currentName = matchedGroup.nama_kegiatan;
        const candidateName = (item.nama_kegiatan || '').trim();
        if (
          candidateName.length > currentName.length && 
          !candidateName.toLowerCase().includes('pertama') // prefer 'pratama' over typo 'pertama'
        ) {
          matchedGroup.nama_kegiatan = candidateName;
        }
        if (item.nama_pemrakarsa && !matchedGroup.nama_pemrakarsa.startsWith('PT') && item.nama_pemrakarsa.startsWith('PT')) {
          matchedGroup.nama_pemrakarsa = item.nama_pemrakarsa;
        }
      } else {
        groups.push({
          key: `group-${item.id}`,
          id: item.id,
          nama_kegiatan: (item.nama_kegiatan || '').trim() || 'Tanpa Nama Kegiatan',
          nama_pemrakarsa: (item.nama_pemrakarsa || '').trim() || '—',
          kategori: item.kategori,
          permits: [item],
        });
      }
    }

    return groups;
  }, [filteredData, groupByFacility]);

  const totalPages = Math.max(1, Math.ceil(processedData.length / itemsPerPage));
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleExpandRow = (key: string) => {
    setExpandedRowKeys(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const tabs = [
    { id: 'Industri', icon: <Factory size={18} strokeWidth={2.5} /> },
    { id: 'Fasyankes', icon: <Building2 size={18} strokeWidth={2.5} /> },
    { id: 'Perumahan', icon: <Home size={18} strokeWidth={2.5} /> },
    { id: 'Toko Modern', icon: <ShoppingCart size={18} strokeWidth={2.5} /> },
    { id: 'Lainnya', icon: <Layers size={18} strokeWidth={2.5} /> },
  ];

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6 font-sans pb-20">
        
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

            <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-700 border-[3px] border-slate-200 flex items-center justify-center shadow-sm shrink-0">
              <Database size={32} strokeWidth={2.5} />
            </div>

            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Database Sasaran</h1>
              <p className="text-sm font-bold text-slate-600 mt-2 tracking-wide">Daftar objek pengawasan yang bersumber dari riwayat data Perizinan.</p>
              
              <div className="flex flex-wrap gap-3 mt-6">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-slate-900 font-black text-sm uppercase tracking-widest border-[3px] border-slate-200 rounded-xl shadow-md">
                  <Zap size={18} className="text-emerald-500" /> Total {loading ? '...' : `${processedData.length} Lokasi`}
                  {groupByFacility && filteredData.length !== processedData.length && (
                    <span className="text-slate-600 font-bold ml-1 text-xs">
                      ({filteredData.length} Berkas)
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setGroupByFacility(prev => !prev)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 font-black text-sm uppercase tracking-widest border-[3px] rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-md transition-all ${
                    groupByFacility 
                      ? 'bg-teal-50 text-teal-800 border-teal-300' 
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                  title="Satukan izin dari perusahaan/fasilitas yang sama menjadi 1 baris"
                >
                  <Layers size={18} />
                  <span>{groupByFacility ? 'Gabung Fasilitas: Aktif' : 'Per Izin: Aktif'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CARD - SAMA DENGAN GAYA DASHBOARD PENGAWASAN */}
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-lg">
          
          {/* TABS MENU */}
          <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/70 p-3 gap-2 custom-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-6 py-3.5 text-xs md:text-sm font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 border-[2px] border-slate-200 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-teal-700' : 'text-slate-400'}>
                  {tab.icon}
                </span>
                <span>{tab.id}</span>
              </button>
            ))}
          </div>

          {/* SUB-HEADER TOOLBAR */}
          <div className="p-5 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4 bg-white">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari kegiatan atau pemrakarsa..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            
            {/* Pagination Controls */}
            {!loading && processedData.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow-md transition-all disabled:opacity-40"
                  >
                    <ChevronLeft size={18} strokeWidth={2.5} />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow-md transition-all disabled:opacity-40"
                  >
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* TABEL DATA */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest">
                <tr>
                  <th className="py-4 px-5 text-center w-16">No</th>
                  <th className="py-4 px-5">Nama Fasilitas / Kegiatan</th>
                  <th className="py-4 px-5">Nama Pemrakarsa</th>
                  <th className="py-4 px-5 text-center w-52">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-500 font-bold text-sm">
                      <LottieLoader size={140} text="MEMUAT DATABASE SASARAN..." />
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-500 font-bold text-sm">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Inbox className="w-12 h-12 text-slate-300" />
                        <span className="uppercase tracking-wider">
                          {searchQuery 
                            ? `Tidak ada data ${activeTab} yang cocok dengan pencarian "${searchQuery}".`
                            : `Tidak ada data ${activeTab} yang ditemukan di riwayat perizinan.`}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => {
                    const isExpanded = Boolean(expandedRowKeys[item.key]);
                    const hasMultiplePermits = item.permits.length > 1;

                    return (
                      <React.Fragment key={item.key}>
                        <tr 
                          className={`transition-colors ${
                            hasMultiplePermits 
                              ? 'cursor-pointer hover:bg-slate-50/80' 
                              : 'hover:bg-slate-50/60'
                          } ${isExpanded ? 'bg-slate-50/90' : ''}`}
                          onClick={() => {
                            if (hasMultiplePermits) {
                              toggleExpandRow(item.key);
                            }
                          }}
                        >
                          <td className="py-4 px-5 text-center font-bold text-slate-400 text-xs">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="py-4 px-5 whitespace-normal break-words min-w-[260px]">
                            <div className="space-y-1.5">
                              <span className="font-black text-slate-900 text-sm block leading-snug uppercase">
                                {item.nama_kegiatan}
                              </span>
                              
                              {/* Badges for permits */}
                              {hasMultiplePermits ? (
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                  <span className="text-[11px] font-black px-3 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 uppercase inline-flex items-center gap-1.5 shadow-sm">
                                    📁 {item.permits.length} Izin Terdaftar
                                    {isExpanded ? <ChevronUp size={13} strokeWidth={2.5} /> : <ChevronDown size={13} strokeWidth={2.5} />}
                                  </span>
                                  {item.permits.slice(0, 3).map((p: any) => (
                                    <span key={p.id} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                      {p.jenis_dokumen || 'Dokumen'} {p.tahun ? `(${p.tahun})` : ''}
                                    </span>
                                  ))}
                                  {item.permits.length > 3 && (
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                      +{item.permits.length - 3} lainnya
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-500 font-bold uppercase block">
                                  {item.permits[0]?.jenis_dokumen || 'Dokumen'} {item.permits[0]?.tahun ? `• Tahun ${item.permits[0].tahun}` : ''}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-5 text-xs font-bold text-slate-700 uppercase whitespace-normal break-words min-w-[160px]">
                            {item.nama_pemrakarsa}
                          </td>
                          <td className="py-4 px-5 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                            {hasMultiplePermits ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpandRow(item.key);
                                }}
                                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all shadow-md hover:-translate-y-0.5 hover:shadow-lg ${
                                  isExpanded
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                }`}
                              >
                                <Archive size={16} strokeWidth={2.5} />
                                <span>{item.permits.length} Arsip Izin</span>
                                {isExpanded ? <ChevronUp size={16} strokeWidth={2.5} /> : <ChevronDown size={16} strokeWidth={2.5} />}
                              </button>
                            ) : (
                              <Link
                                href={`/pengawasan/database/arsip/${item.permits[0]?.id}`}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all"
                              >
                                <Archive size={16} strokeWidth={2.5} />
                                <span>Arsip Izin</span>
                              </Link>
                            )}
                          </td>
                        </tr>

                        {/* ACCORDION IN-PLACE ROW */}
                        {isExpanded && hasMultiplePermits && (
                          <tr className="bg-slate-50/60 border-b border-slate-200/80 animate-in fade-in duration-150">
                            <td colSpan={4} className="p-4 pl-8 md:pl-16">
                              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Archive size={16} strokeWidth={2.5} className="text-teal-600" />
                                    Daftar Berkas Izin Terdaftar ({item.permits.length} Dokumen)
                                  </span>
                                  <span className="text-xs font-bold text-slate-500 uppercase">
                                    Pilih arsip izin yang ingin dilihat
                                  </span>
                                </div>

                                <div className="space-y-3">
                                  {item.permits.map((p: any, pIdx: number) => (
                                    <div 
                                      key={p.id} 
                                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-teal-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                                    >
                                      <div className="flex items-start gap-3">
                                        <span className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 border border-teal-200 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                          {pIdx + 1}
                                        </span>
                                        <div>
                                          <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className="text-sm font-black text-slate-900 uppercase">
                                              {p.jenis_dokumen || 'Dokumen Lingkungan'}
                                            </span>
                                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                                              Tahun {p.tahun || '—'}
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                              #{String(p.no_urut || p.id).padStart(3, '0')}
                                            </span>
                                          </div>
                                          <p className="text-xs font-bold text-slate-600 uppercase">
                                            Status: <span className="text-slate-900 font-black">{p.status_tahapan || 'Dalam Proses'}</span>
                                            {p.nomor_checklist ? ` • No. Reg: ${p.nomor_checklist}` : ''}
                                          </p>
                                          <p className="text-[11px] font-bold text-slate-500 uppercase mt-0.5 line-clamp-1">
                                            Kegiatan: {p.nama_kegiatan}
                                          </p>
                                        </div>
                                      </div>

                                      <Link
                                        href={`/pengawasan/database/arsip/${p.id}`}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl border border-slate-200 shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all shrink-0 self-start sm:self-center"
                                      >
                                        <Archive size={14} strokeWidth={2.5} />
                                        <span>Buka Arsip ↗</span>
                                      </Link>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
