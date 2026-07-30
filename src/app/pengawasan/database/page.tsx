'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Database, Inbox, ArrowLeft, Archive, Factory, Building2, Home, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function DatabaseGabungan() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Industri');
  const [currentPage, setCurrentPage] = useState(1);
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

  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Filter Data based on activeTab
  const filteredData = data.filter((item: any) => {
    const nama = (item.nama_kegiatan || '').toLowerCase();
    const pemrakarsa = (item.nama_pemrakarsa || '').toLowerCase();
    const kategori = (item.kategori || '').toLowerCase();

    if (activeTab === 'Industri') {
      return nama.includes('industri') || nama.includes('pabrik') || nama.includes('pt') || nama.includes('cv') || pemrakarsa.includes('pt') || pemrakarsa.includes('cv') || kategori.includes('industri');
    }
    if (activeTab === 'Fasyankes') {
      return nama.includes('klinik') || nama.includes('rs') || nama.includes('rumah sakit') || nama.includes('apotek') || nama.includes('puskesmas') || kategori.includes('fasyankes');
    }
    if (activeTab === 'Perumahan') {
      return nama.includes('perumahan') || nama.includes('cluster') || nama.includes('kavling') || kategori.includes('perumahan');
    }
    if (activeTab === 'Toko Modern') {
      return nama.includes('toko') || nama.includes('minimarket') || nama.includes('supermarket') || nama.includes('swalayan') || nama.includes('mart') || kategori.includes('toko');
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const tabs = [
    { id: 'Industri', icon: <Factory size={20} strokeWidth={2.5} /> },
    { id: 'Fasyankes', icon: <Building2 size={20} strokeWidth={2.5} /> },
    { id: 'Perumahan', icon: <Home size={20} strokeWidth={2.5} /> },
    { id: 'Toko Modern', icon: <ShoppingCart size={20} strokeWidth={2.5} /> },
  ];

  return (
    <div className="min-h-screen bg-surface-container-lowest p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8 font-sans pb-20">
        
        {/* Header */}
        <div className="bg-surface border border-outline-variant rounded-[2rem] p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col md:flex-row items-start gap-6">
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
        <div className="bg-surface rounded-[2rem] border border-outline-variant overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b-4 border-outline-variant bg-surface-container-low custom-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-8 py-5 text-sm md:text-base font-bold uppercase tracking-widest whitespace-nowrap transition-colors border-r-4 border-outline-variant last:border-r-0 ${
                  activeTab === tab.id
                    ? 'bg-amber-300 text-on-surface shadow-md'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {tab.icon} {tab.id}
              </button>
            ))}
          </div>

          <div className="p-5 bg-secondary-container text-on-secondary-container border-b-4 border-outline-variant flex justify-between items-center flex-wrap gap-4">
            <span className="text-sm font-bold text-on-surface uppercase tracking-widest">Total Terdata: {loading ? '...' : filteredData.length} Lokasi</span>
            
            {/* Pagination Controls */}
            {!loading && filteredData.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center bg-surface border border-outline-variant rounded-xl text-on-surface shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:shadow-none hover:bg-surface-container-low transition-all active:translate-y-1 active:shadow-none"
                  >
                    <ChevronLeft size={20} strokeWidth={3} />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 flex items-center justify-center bg-surface border border-outline-variant rounded-xl text-on-surface shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:shadow-none hover:bg-surface-container-low transition-all active:translate-y-1 active:shadow-none"
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
              <tbody className="divide-y-4 divide-slate-900 bg-surface">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-on-surface font-bold uppercase text-lg"><LottieLoader size={150} text="MEMUAT DATA..." /></td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-on-surface-variant font-bold uppercase">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <Inbox className="w-12 h-12 opacity-50" />
                        Tidak ada data {activeTab} yang ditemukan di riwayat perizinan.
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="p-5 text-center font-bold text-on-surface-variant border-r-4 border-outline-variant">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="p-5 font-bold text-on-surface uppercase text-sm border-r-4 border-outline-variant whitespace-normal break-words min-w-[200px]">
                        {item.nama_kegiatan}
                      </td>
                      <td className="p-5 font-bold text-on-surface-variant uppercase text-xs border-r-4 border-outline-variant whitespace-normal break-words min-w-[150px]">
                        {item.nama_pemrakarsa}
                      </td>
                      <td className="p-5 text-center whitespace-nowrap">
                        <Link href={`/perizinan/arsip/${item.id}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-200 hover:bg-error-container border border-outline-variant rounded-xl text-xs font-bold uppercase tracking-widest text-on-surface shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all">
                          <Archive size={16} strokeWidth={2.5} /> Arsip Izin
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
