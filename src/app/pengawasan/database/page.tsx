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
        // Update display name to the more complete/standard name
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
    { id: 'Industri', icon: <Factory size={16} /> },
    { id: 'Fasyankes', icon: <Building2 size={16} /> },
    { id: 'Perumahan', icon: <Home size={16} /> },
    { id: 'Toko Modern', icon: <ShoppingCart size={16} /> },
    { id: 'Lainnya', icon: <Layers size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6 font-sans pb-20">
        
        {/* Header - Modern Minimalist */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/pengawasan" 
              className="w-11 h-11 shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center transition-colors"
              title="Kembali ke Pengawasan"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Database Sasaran Pengawasan</h1>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <Sparkles size={11} /> Auto-Grouped
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500">Daftar objek pengawasan terintegrasi dari riwayat data Perizinan.</p>
            </div>
          </div>
        </div>

        {/* Main Card - Clean Modern UI */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-slate-200 bg-white custom-scrollbar p-2 gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.icon} <span>{tab.id}</span>
              </button>
            ))}
          </div>

          {/* Sub-header Toolbar */}
          <div className="p-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-3 bg-white">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-slate-700">
                Total: <strong className="text-slate-900 font-bold">{loading ? '...' : `${processedData.length} Fasilitas`}</strong>
                {groupByFacility && filteredData.length !== processedData.length && (
                  <span className="text-slate-500 font-normal ml-1">
                    ({filteredData.length} berkas izin)
                  </span>
                )}
              </span>

              {/* Grouping Toggle */}
              <button
                type="button"
                onClick={() => setGroupByFacility(prev => !prev)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  groupByFacility 
                    ? 'bg-slate-100 text-slate-800 border-slate-300' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title="Gabungkan izin fasilitas yang sama menjadi 1 baris"
              >
                <Layers size={13} />
                <span>{groupByFacility ? 'Gabung Fasilitas: Aktif' : 'Tampilkan Per Izin'}</span>
              </button>

              {/* Search Box */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Cari kegiatan atau pemrakarsa..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
            
            {/* Pagination Controls */}
            {!loading && processedData.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 text-center w-14">No</th>
                  <th className="py-3.5 px-4">Nama Fasilitas / Kegiatan</th>
                  <th className="py-3.5 px-4">Pemrakarsa</th>
                  <th className="py-3.5 px-4 text-center w-48">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-500 font-medium text-sm">
                      <LottieLoader size={120} text="MEMUAT DATA..." />
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-500 font-medium text-sm">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Inbox className="w-10 h-10 text-slate-300" />
                        <span>
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
                              ? 'cursor-pointer hover:bg-slate-50' 
                              : 'hover:bg-slate-50/70'
                          } ${isExpanded ? 'bg-slate-50/60' : ''}`}
                          onClick={() => {
                            if (hasMultiplePermits) {
                              toggleExpandRow(item.key);
                            }
                          }}
                        >
                          <td className="py-4 px-4 text-center font-medium text-slate-400 text-xs">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="py-4 px-4 whitespace-normal break-words min-w-[260px]">
                            <div className="space-y-1">
                              <span className="font-semibold text-slate-900 text-sm block leading-snug">
                                {item.nama_kegiatan}
                              </span>
                              
                              {/* Badges for permits */}
                              {hasMultiplePermits ? (
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                                    📁 {item.permits.length} Izin Terdaftar
                                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                  </span>
                                  {item.permits.slice(0, 3).map((p: any) => (
                                    <span key={p.id} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                      {p.jenis_dokumen || 'Dokumen'} {p.tahun ? `(${p.tahun})` : ''}
                                    </span>
                                  ))}
                                  {item.permits.length > 3 && (
                                    <span className="text-[10px] text-slate-400">
                                      +{item.permits.length - 3} lainnya
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-500 font-normal block">
                                  {item.permits[0]?.jenis_dokumen || 'Dokumen'} {item.permits[0]?.tahun ? `• Tahun ${item.permits[0].tahun}` : ''}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-xs font-medium text-slate-600 whitespace-normal break-words min-w-[160px]">
                            {item.nama_pemrakarsa}
                          </td>
                          <td className="py-4 px-4 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                            {hasMultiplePermits ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpandRow(item.key);
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                                  isExpanded
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                                }`}
                              >
                                <Archive size={14} />
                                <span>{item.permits.length} Arsip Izin</span>
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            ) : (
                              <Link
                                href={`/pengawasan/database/arsip/${item.permits[0]?.id}`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-all shadow-sm"
                              >
                                <Archive size={14} />
                                <span>Arsip Izin</span>
                              </Link>
                            )}
                          </td>
                        </tr>

                        {/* Accordion Expansion Row (In-Place, No Pop Out!) */}
                        {isExpanded && hasMultiplePermits && (
                          <tr className="bg-slate-50/60 border-b border-slate-200/80 animate-in fade-in duration-150">
                            <td colSpan={4} className="p-4 pl-12 md:pl-16">
                              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    Daftar Berkas Izin Terdaftar ({item.permits.length})
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    Pilih arsip izin yang ingin dilihat
                                  </span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                  {item.permits.map((p: any, pIdx: number) => (
                                    <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <div className="flex items-start gap-3">
                                        <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                          {pIdx + 1}
                                        </span>
                                        <div>
                                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                            <span className="text-xs font-bold text-slate-900">
                                              {p.jenis_dokumen || 'Dokumen Lingkungan'}
                                            </span>
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                                              Tahun {p.tahun || '—'}
                                            </span>
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                              #{String(p.no_urut || p.id).padStart(3, '0')}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-slate-500">
                                            Status: <strong className="text-slate-700 font-medium">{p.status_tahapan || 'Dalam Proses'}</strong>
                                            {p.nomor_checklist ? ` • No. Reg: ${p.nomor_checklist}` : ''}
                                          </p>
                                          <p className="text-[11px] text-slate-400 mt-0.5">
                                            Nama tercatat: {p.nama_kegiatan}
                                          </p>
                                        </div>
                                      </div>

                                      <Link
                                        href={`/pengawasan/database/arsip/${p.id}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-all shadow-sm shrink-0 self-start sm:self-center"
                                      >
                                        <Archive size={13} />
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
