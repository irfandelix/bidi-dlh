'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Database, Inbox, ArrowLeft, Archive, Factory, Building2, 
  Home, ShoppingCart, ChevronLeft, ChevronRight, Layers, Search, 
  ChevronDown, ChevronUp, Sparkles, ExternalLink
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
    { id: 'Industri', icon: <Factory size={20} strokeWidth={2.5} /> },
    { id: 'Fasyankes', icon: <Building2 size={20} strokeWidth={2.5} /> },
    { id: 'Perumahan', icon: <Home size={20} strokeWidth={2.5} /> },
    { id: 'Toko Modern', icon: <ShoppingCart size={20} strokeWidth={2.5} /> },
    { id: 'Lainnya', icon: <Layers size={20} strokeWidth={2.5} /> },
  ];

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8 font-sans pb-20">
        
        {/* Header - Iconic Neo-Brutalist Card */}
        <div className="bg-white border-4 border-slate-900 rounded-[2rem] p-6 md:p-8 shadow-[8px_8px_0_0_#0f172a] relative overflow-hidden flex flex-col md:flex-row items-start gap-6">
          <Link 
            href="/pengawasan" 
            className="w-16 h-16 shrink-0 bg-indigo-500 text-white rounded-2xl border-4 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a] hover:bg-indigo-600 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all"
            title="Kembali ke Dashboard Pengawasan"
          >
            <ArrowLeft size={32} />
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-teal-300 border-4 border-slate-900 flex items-center justify-center text-slate-900 shadow-[4px_4px_0_0_#0f172a] shrink-0">
            <Database size={32} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 uppercase">
                Database Sasaran
              </h2>
              <span className="text-[11px] font-black px-3 py-1 rounded-full bg-emerald-200 text-slate-900 border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a] flex items-center gap-1.5">
                <Sparkles size={12} strokeWidth={3} /> Terpadu
              </span>
            </div>
            <p className="text-sm md:text-base font-bold text-slate-600 mt-2 tracking-wide uppercase">
              Daftar objek pengawasan yang bersumber dari riwayat data Perizinan.
            </p>
          </div>
        </div>

        {/* Main Card - Neo-Brutalist Frame */}
        <div className="bg-white rounded-[2rem] border-4 border-slate-900 overflow-hidden shadow-[8px_8px_0_0_#0f172a]">
          
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b-4 border-slate-900 bg-slate-100 custom-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 md:px-8 py-5 text-sm md:text-base font-black uppercase tracking-widest whitespace-nowrap transition-all border-r-4 border-slate-900 last:border-r-0 ${
                  activeTab === tab.id
                    ? 'bg-amber-300 text-slate-900 shadow-[inset_0_-4px_0_0_#0f172a]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {tab.icon} {tab.id}
              </button>
            ))}
          </div>

          {/* Subheader Toolbar */}
          <div className="p-5 bg-emerald-100 border-b-4 border-slate-900 flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-black text-slate-900 uppercase tracking-widest">
                Total Terdata: {loading ? '...' : `${processedData.length} Lokasi`}
                {groupByFacility && filteredData.length !== processedData.length && (
                  <span className="text-slate-700 font-bold ml-1.5 text-xs">
                    ({filteredData.length} berkas izin)
                  </span>
                )}
              </span>

              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-500" size={16} strokeWidth={2.5} />
                <input
                  type="text"
                  placeholder="Cari kegiatan / nama..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-white border-2 border-slate-900 rounded-xl pl-9 pr-4 py-1.5 text-xs font-bold text-slate-900 uppercase tracking-wide placeholder:text-slate-400 placeholder:normal-case shadow-[2px_2px_0_0_#0f172a] outline-none focus:ring-2 focus:ring-slate-900 w-56 md:w-64"
                />
              </div>

              {/* Grouping Toggle Button */}
              <button
                type="button"
                onClick={() => setGroupByFacility(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl border-2 border-slate-900 text-xs font-black uppercase tracking-wider transition-all shadow-[2px_2px_0_0_#0f172a] flex items-center gap-1.5 ${
                  groupByFacility 
                    ? 'bg-amber-200 text-slate-900' 
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
                title="Satukan izin dari perusahaan/fasilitas yang sama menjadi 1 baris"
              >
                <Layers size={14} strokeWidth={2.5} />
                <span>{groupByFacility ? 'Gabung Fasilitas: On' : 'Per Izin: On'}</span>
              </button>
            </div>
            
            {/* Pagination Controls */}
            {!loading && processedData.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center bg-white border-4 border-slate-900 rounded-xl text-slate-900 shadow-[2px_2px_0_0_#0f172a] disabled:opacity-50 disabled:shadow-none hover:bg-slate-100 transition-all active:translate-y-1 active:shadow-none"
                  >
                    <ChevronLeft size={20} strokeWidth={3} />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 flex items-center justify-center bg-white border-4 border-slate-900 rounded-xl text-slate-900 shadow-[2px_2px_0_0_#0f172a] disabled:opacity-50 disabled:shadow-none hover:bg-slate-100 transition-all active:translate-y-1 active:shadow-none"
                  >
                    <ChevronRight size={20} strokeWidth={3} />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-indigo-200 text-slate-900 font-black border-b-4 border-slate-900">
                <tr>
                  <th className="p-5 uppercase text-xs tracking-widest w-16 text-center border-r-4 border-slate-900 whitespace-nowrap">No</th>
                  <th className="p-5 uppercase text-xs tracking-widest border-r-4 border-slate-900 whitespace-nowrap">Nama Fasilitas / Kegiatan</th>
                  <th className="p-5 uppercase text-xs tracking-widest border-r-4 border-slate-900 whitespace-nowrap">Nama Pemrakarsa</th>
                  <th className="p-5 uppercase text-xs tracking-widest text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y-4 divide-slate-900 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-900 font-black uppercase text-lg">
                      <LottieLoader size={150} text="MEMUAT DATA..." />
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-600 font-black uppercase">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Inbox className="w-12 h-12 opacity-50" />
                        {searchQuery 
                          ? `Tidak ada data ${activeTab} yang cocok dengan pencarian "${searchQuery}".`
                          : `Tidak ada data ${activeTab} yang ditemukan di riwayat perizinan.`}
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
                              ? 'cursor-pointer hover:bg-amber-50/50' 
                              : 'hover:bg-slate-50'
                          } ${isExpanded ? 'bg-amber-50/40' : ''}`}
                          onClick={() => {
                            if (hasMultiplePermits) {
                              toggleExpandRow(item.key);
                            }
                          }}
                        >
                          <td className="p-5 text-center font-black text-slate-600 border-r-4 border-slate-900">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="p-5 font-black text-slate-900 uppercase text-sm border-r-4 border-slate-900 whitespace-normal break-words min-w-[200px]">
                            <div>
                              <span className="block leading-snug">
                                {item.nama_kegiatan}
                              </span>

                              {/* Badges for permits */}
                              {hasMultiplePermits ? (
                                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                  <span className="text-[10px] font-black px-2.5 py-1 rounded-md bg-amber-200 text-slate-900 border-2 border-slate-900 uppercase inline-flex items-center gap-1 shadow-[2px_2px_0_0_#0f172a]">
                                    📁 {item.permits.length} Izin Terdaftar
                                    {isExpanded ? <ChevronUp size={12} strokeWidth={3} /> : <ChevronDown size={12} strokeWidth={3} />}
                                  </span>
                                  {item.permits.slice(0, 3).map((p: any) => (
                                    <span key={p.id} className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-900 uppercase">
                                      {p.jenis_dokumen || 'Dokumen'} {p.tahun ? `(${p.tahun})` : ''}
                                    </span>
                                  ))}
                                  {item.permits.length > 3 && (
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                                      +{item.permits.length - 3} lainnya
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] font-bold text-slate-500 uppercase block mt-1">
                                  {item.permits[0]?.jenis_dokumen || 'Dokumen'} {item.permits[0]?.tahun ? `• Tahun ${item.permits[0].tahun}` : ''}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-5 font-bold text-slate-700 uppercase text-xs border-r-4 border-slate-900 whitespace-normal break-words min-w-[150px]">
                            {item.nama_pemrakarsa}
                          </td>
                          <td className="p-5 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                            {hasMultiplePermits ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpandRow(item.key);
                                }}
                                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all ${
                                  isExpanded
                                    ? 'bg-amber-300 text-slate-900'
                                    : 'bg-rose-200 hover:bg-rose-300 text-slate-900'
                                }`}
                              >
                                <Archive size={16} strokeWidth={2.5} />
                                <span>{item.permits.length} Arsip Izin</span>
                                {isExpanded ? <ChevronUp size={16} strokeWidth={3} /> : <ChevronDown size={16} strokeWidth={3} />}
                              </button>
                            ) : (
                              <Link 
                                href={`/pengawasan/database/arsip/${item.permits[0]?.id}`}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-200 hover:bg-rose-300 border-4 border-slate-900 rounded-xl text-xs font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all"
                              >
                                <Archive size={16} strokeWidth={2.5} /> Arsip Izin
                              </Link>
                            )}
                          </td>
                        </tr>

                        {/* Accordion In-Place Row */}
                        {isExpanded && hasMultiplePermits && (
                          <tr className="bg-slate-50 border-b-4 border-slate-900 animate-in fade-in duration-150">
                            <td colSpan={4} className="p-5 pl-8 md:pl-16">
                              <div className="bg-white border-4 border-slate-900 rounded-2xl p-5 shadow-[6px_6px_0_0_#0f172a] space-y-4">
                                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 flex-wrap gap-2">
                                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Archive size={16} strokeWidth={2.5} className="text-indigo-600" />
                                    Daftar Berkas Izin Terdaftar ({item.permits.length} Dokumen)
                                  </span>
                                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                    Pilih arsip izin yang ingin dilihat
                                  </span>
                                </div>

                                <div className="space-y-3">
                                  {item.permits.map((p: any, pIdx: number) => (
                                    <div 
                                      key={p.id} 
                                      className="p-4 rounded-xl border-2 border-slate-900 bg-slate-50 hover:bg-indigo-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[2px_2px_0_0_#0f172a]"
                                    >
                                      <div className="flex items-start gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-amber-300 border-2 border-slate-900 text-slate-900 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-[1px_1px_0_0_#0f172a]">
                                          {pIdx + 1}
                                        </span>
                                        <div>
                                          <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className="text-sm font-black text-slate-900 uppercase">
                                              {p.jenis_dokumen || 'Dokumen Lingkungan'}
                                            </span>
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-200 text-slate-900 border border-slate-900 uppercase">
                                              Tahun {p.tahun || '—'}
                                            </span>
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-100 text-slate-900 border border-slate-900 uppercase">
                                              #{String(p.no_urut || p.id).padStart(3, '0')}
                                            </span>
                                          </div>
                                          <p className="text-xs font-bold text-slate-600 uppercase">
                                            Status: <span className="text-slate-900">{p.status_tahapan || 'Dalam Proses'}</span>
                                            {p.nomor_checklist ? ` • No. Reg: ${p.nomor_checklist}` : ''}
                                          </p>
                                          <p className="text-[11px] font-bold text-slate-500 uppercase mt-0.5 line-clamp-1">
                                            Nama Kegiatan: {p.nama_kegiatan}
                                          </p>
                                        </div>
                                      </div>

                                      <Link
                                        href={`/pengawasan/database/arsip/${p.id}`}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-slate-900 shadow-[3px_3px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#0f172a] transition-all shrink-0 self-start sm:self-center"
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
