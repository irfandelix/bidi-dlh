'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Database, Inbox, ArrowLeft, Archive, Factory, Building2, 
  Home, ShoppingCart, ChevronLeft, ChevronRight, Layers, Search, 
  ChevronDown, ChevronUp, FileText, X, ExternalLink
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

export default function DatabaseGabungan() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Industri');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [groupByFacility, setGroupByFacility] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState<GroupedFacility | null>(null);
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

  // Group by facility name & pemrakarsa
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

    const groupMap = new Map<string, GroupedFacility>();
    for (const item of filteredData) {
      const rawName = (item.nama_kegiatan || '').trim();
      const rawPem = (item.nama_pemrakarsa || '').trim();
      const key = `${rawName.toLowerCase()}|${rawPem.toLowerCase()}`;

      if (groupMap.has(key)) {
        groupMap.get(key)!.permits.push(item);
      } else {
        groupMap.set(key, {
          key,
          id: item.id,
          nama_kegiatan: rawName || 'Tanpa Nama Kegiatan',
          nama_pemrakarsa: rawPem || '—',
          kategori: item.kategori,
          permits: [item],
        });
      }
    }
    return Array.from(groupMap.values());
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
        
        {/* Header */}
        <div className="bg-white border border-outline-variant rounded-[2rem] p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col md:flex-row items-start gap-6">
          <Link href="/pengawasan" className="w-16 h-16 shrink-0 bg-indigo-500 text-on-primary rounded-2xl border border-outline-variant flex items-center justify-center shadow-sm hover:shadow-md transition-shadow hover:bg-primary text-on-primary hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all">
            <ArrowLeft size={32} />
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-teal-300 border border-outline-variant flex items-center justify-center text-on-surface shadow-sm hover:shadow-md transition-shadow shrink-0">
            <Database size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface uppercase">Database Sasaran</h2>
            <p className="text-sm md:text-base font-bold text-on-surface-variant mt-2 tracking-wide uppercase">Daftar objek pengawasan yang bersumber dari riwayat data Perizinan.</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-[2rem] border border-outline-variant overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b-4 border-outline-variant bg-white custom-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-8 py-5 text-sm md:text-base font-bold uppercase tracking-widest whitespace-nowrap transition-colors border-r-4 border-outline-variant last:border-r-0 ${
                  activeTab === tab.id
                    ? 'bg-amber-300 text-on-surface shadow-md'
                    : 'bg-white text-on-surface-variant hover:text-on-surface hover:bg-slate-50'
                }`}
              >
                {tab.icon} {tab.id}
              </button>
            ))}
          </div>

          {/* Sub-header Toolbar */}
          <div className="p-5 bg-secondary-container text-on-secondary-container border-b-4 border-outline-variant flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-bold text-on-surface uppercase tracking-widest">
                Total Terdata: {loading ? '...' : `${processedData.length} Fasilitas`}
                {groupByFacility && filteredData.length !== processedData.length && (
                  <span className="text-xs font-semibold text-on-surface-variant ml-1.5 lowercase">
                    ({filteredData.length} berkas izin)
                  </span>
                )}
              </span>

              {/* Grouping Toggle */}
              <button
                type="button"
                onClick={() => setGroupByFacility(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl border border-outline-variant text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm ${
                  groupByFacility ? 'bg-indigo-100 text-indigo-900 border-indigo-300' : 'bg-white text-on-surface-variant hover:bg-slate-50'
                }`}
                title="Gabungkan fasilitas yang sama menjadi 1 baris"
              >
                <Layers size={14} />
                <span>{groupByFacility ? 'Gabung Nama: Aktif' : 'Tampilkan Per Izin'}</span>
              </button>

              {/* Search Box */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 text-on-surface-variant" size={16} />
                <input
                  type="text"
                  placeholder="Cari kegiatan / nama..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-outline-variant rounded-xl pl-9 pr-3 py-1.5 text-xs font-bold text-on-surface outline-none focus:ring-2 focus:ring-amber-300 shadow-sm"
                />
              </div>
            </div>
            
            {/* Pagination Controls */}
            {!loading && processedData.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-outline-variant rounded-xl text-on-surface shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:shadow-none hover:bg-slate-100 transition-all active:translate-y-1 active:shadow-none"
                  >
                    <ChevronLeft size={20} strokeWidth={3} />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-outline-variant rounded-xl text-on-surface shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:shadow-none hover:bg-slate-100 transition-all active:translate-y-1 active:shadow-none"
                  >
                    <ChevronRight size={20} strokeWidth={3} />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-indigo-200 text-on-surface font-bold border-b-4 border-outline-variant">
                <tr>
                  <th className="p-5 uppercase text-xs tracking-widest w-16 text-center border-r-4 border-outline-variant whitespace-nowrap">No</th>
                  <th className="p-5 uppercase text-xs tracking-widest border-r-4 border-outline-variant whitespace-nowrap">Nama Fasilitas / Kegiatan</th>
                  <th className="p-5 uppercase text-xs tracking-widest border-r-4 border-outline-variant whitespace-nowrap">Nama Pemrakarsa</th>
                  <th className="p-5 uppercase text-xs tracking-widest text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y-4 divide-slate-900 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-on-surface font-bold uppercase text-lg"><LottieLoader size={150} text="MEMUAT DATA..." /></td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-on-surface-variant font-bold uppercase">
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
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-5 text-center font-bold text-on-surface-variant border-r-4 border-outline-variant">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="p-5 font-bold text-on-surface uppercase text-sm border-r-4 border-outline-variant whitespace-normal break-words min-w-[240px]">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <span className="block font-black text-slate-900">{item.nama_kegiatan}</span>
                                
                                {/* Badges if multiple permits */}
                                {hasMultiplePermits ? (
                                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-950 border border-indigo-300">
                                      📂 {item.permits.length} Izin Terdaftar
                                    </span>
                                    {item.permits.slice(0, 3).map((p: any) => (
                                      <span key={p.id} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300">
                                        {p.jenis_dokumen || 'Dokumen'} {p.tahun ? `(${p.tahun})` : ''}
                                      </span>
                                    ))}
                                    {item.permits.length > 3 && (
                                      <span className="text-[10px] font-bold text-slate-500">
                                        +{item.permits.length - 3} lainnya
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="mt-1">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                                      {item.permits[0]?.jenis_dokumen || 'Dokumen'} {item.permits[0]?.tahun ? `• Tahun ${item.permits[0].tahun}` : ''}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {hasMultiplePermits && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpandRow(item.key)}
                                  className="shrink-0 p-1.5 rounded-lg border border-outline-variant hover:bg-slate-100 text-slate-700 transition-colors"
                                  title={isExpanded ? 'Sembunyikan rincian izin' : 'Tampilkan rincian izin'}
                                >
                                  {isExpanded ? <ChevronUp size={16} strokeWidth={2.5} /> : <ChevronDown size={16} strokeWidth={2.5} />}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-5 font-bold text-on-surface-variant uppercase text-xs border-r-4 border-outline-variant whitespace-normal break-words min-w-[150px]">
                            {item.nama_pemrakarsa}
                          </td>
                          <td className="p-5 text-center whitespace-nowrap">
                            {hasMultiplePermits ? (
                              <button
                                type="button"
                                onClick={() => setSelectedFacility(item)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-200 hover:bg-rose-300 border border-outline-variant rounded-xl text-xs font-bold uppercase tracking-widest text-on-surface shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                              >
                                <Archive size={16} strokeWidth={2.5} />
                                <span>{item.permits.length} Arsip Izin</span>
                                <ChevronDown size={14} strokeWidth={3} />
                              </button>
                            ) : (
                              <Link
                                href={`/pengawasan/database/arsip/${item.permits[0]?.id}`}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-200 hover:bg-error-container border border-outline-variant rounded-xl text-xs font-bold uppercase tracking-widest text-on-surface shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 transition-all"
                              >
                                <Archive size={16} strokeWidth={2.5} /> Arsip Izin
                              </Link>
                            )}
                          </td>
                        </tr>

                        {/* Accordion expansion row if toggled */}
                        {isExpanded && hasMultiplePermits && (
                          <tr className="bg-slate-50/80 border-b-2 border-outline-variant animate-in fade-in">
                            <td colSpan={4} className="p-4 pl-12 md:pl-16">
                              <div className="bg-white border-2 border-outline-variant rounded-2xl p-4 shadow-sm space-y-3">
                                <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                                    Daftar Dokumen Izin ({item.nama_kegiatan})
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                                    {item.permits.length} Berkas
                                  </span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                  {item.permits.map((p: any, pIdx: number) => (
                                    <div key={p.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 text-[10px] font-black flex items-center justify-center shrink-0">
                                          {pIdx + 1}
                                        </span>
                                        <div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold text-slate-900 uppercase">
                                              {p.jenis_dokumen || 'Dokumen Lingkungan'}
                                            </span>
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-200 uppercase">
                                              Tahun {p.tahun || '—'}
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                              #{String(p.no_urut || p.id).padStart(3, '0')}
                                            </span>
                                          </div>
                                          <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                                            Status: <span className="text-slate-800">{p.status_tahapan || 'Dalam Proses'}</span>
                                            {p.nomor_checklist ? ` • No. Reg: ${p.nomor_checklist}` : ''}
                                          </p>
                                        </div>
                                      </div>

                                      <Link
                                        href={`/pengawasan/database/arsip/${p.id}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-200 hover:bg-rose-300 text-on-surface border border-outline-variant rounded-xl text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all self-start sm:self-center shrink-0"
                                      >
                                        <Archive size={14} /> Buka Arsip Ini ↗
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

      {/* Modal Picker for Facility with Multiple Permits */}
      {selectedFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border-4 border-slate-900 p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            
            <div className="flex items-start justify-between gap-4 border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-200 border-2 border-slate-900 flex items-center justify-center shadow-sm shrink-0">
                  <Archive size={24} className="text-slate-900" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight line-clamp-1">
                    Pilih Dokumen Izin
                  </h3>
                  <p className="text-xs font-bold text-slate-600 uppercase mt-0.5 line-clamp-1">
                    {selectedFacility.nama_kegiatan}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFacility(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-200 border-2 border-slate-900 flex items-center justify-center text-slate-800 font-black transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            <p className="text-xs font-bold text-slate-500 uppercase">
              Fasilitas ini memiliki <strong>{selectedFacility.permits.length} berkas izin</strong>. Silakan pilih arsip yang ingin dibuka:
            </p>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {selectedFacility.permits.map((p, idx) => (
                <div 
                  key={p.id}
                  className="p-4 rounded-2xl border-2 border-slate-900 bg-white hover:bg-indigo-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-black text-slate-900 uppercase">
                        {p.jenis_dokumen || 'Dokumen Lingkungan'}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-200 text-amber-950 border border-slate-900 uppercase">
                        Tahun {p.tahun || '—'}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-900">
                        #{String(p.no_urut || p.id).padStart(3, '0')}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-600 uppercase">
                      Status: <span className="text-slate-900">{p.status_tahapan || 'Dalam Proses'}</span>
                    </p>
                    {p.nomor_checklist && (
                      <p className="text-[11px] font-bold text-slate-500 uppercase mt-0.5">
                        Reg: {p.nomor_checklist}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/pengawasan/database/arsip/${p.id}`}
                    onClick={() => setSelectedFacility(null)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-slate-900 shadow-sm transition-all hover:-translate-y-0.5 whitespace-nowrap"
                  >
                    <Archive size={14} /> Buka Arsip Ini ↗
                  </Link>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedFacility(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs uppercase tracking-wider rounded-xl border-2 border-slate-900 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
