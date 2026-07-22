'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LottieLoader from '@/components/LottieLoader';
import { 
  Archive, FileText, ArrowLeft, Printer, Search, Map, Loader2, Info
} from 'lucide-react';

type Dokumen = any; // Will use proper types later

export default function DaftarArsipPerizinanPage() {
  const [docs, setDocs] = useState<Dokumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('Semua');

  useEffect(() => {
    fetch('/api/perizinan')
      .then(res => res.json())
      .then(res => {
        // Hanya ambil dokumen yang status_tahapan = diarsipkan dll
        const arsipStatuses = ['Arsip', 'Diarsipkan', 'ARSIP', 'Jilidan Selesai'];
        const arsipDocs = (res.data || []).filter((d: any) => arsipStatuses.includes(d.status_tahapan) || d.lokasi_arsip);
        setDocs(arsipDocs);
        setLoading(false);
      });
  }, []);

  const filteredDocs = docs.filter(d => {
    const matchSearch = (d.nama_kegiatan || '').toLowerCase().includes(search.toLowerCase()) || 
                        (d.nama_pemrakarsa || '').toLowerCase().includes(search.toLowerCase()) ||
                        String(d.no_urut || d.id).includes(search);
    const matchJenis = filterJenis === 'Semua' || d.jenis_dokumen === filterJenis;
    return matchSearch && matchJenis;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
  const paginatedDocs = filteredDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><LottieLoader size={24} /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8 pb-20">
      
      {/* Header Neobrutalism */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] text-slate-900 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-200 rounded-full border-4 border-slate-900 opacity-30"></div>
        <div className="flex items-center gap-4 relative z-10">
          <Link href="/arsip" className="w-12 h-12 rounded-xl bg-white text-slate-900 border-4 border-slate-900 flex items-center justify-center hover:bg-slate-200 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#0f172a] transition-all shrink-0">
            <ArrowLeft size={24} />
          </Link>
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-blue-400 border-2 border-slate-900 flex items-center justify-center text-slate-900 shadow-[4px_4px_0_0_#0f172a]">
            <Archive size={28} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight uppercase">Arsip Perizinan</h2>
            <p className="text-sm text-slate-600 font-bold mt-1 uppercase">Daftar Dokumen Lingkungan Yang Selesai Terbit.</p>
          </div>
        </div>
        
        <div className="flex items-center flex-wrap gap-3 relative z-10">
          <div className="bg-emerald-50 px-5 py-3 rounded-xl border-2 border-slate-900 flex items-center gap-3 text-sm font-black text-slate-900 shadow-[4px_4px_0_0_#0f172a] uppercase">
            <FileText size={18} className="text-emerald-500 fill-emerald-500" />
            Total {docs.length} Arsip
          </div>
          <Link href="/peta" className="bg-blue-400 hover:bg-blue-300 hover:-translate-y-1 text-slate-900 px-5 py-3 rounded-xl text-sm font-black shadow-[4px_4px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] border-2 border-slate-900 transition-all flex items-center gap-2 uppercase tracking-widest">
            <Map size={18} /> Peta Lokasi
          </Link>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={20} className="text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="CARI NAMA KEGIATAN ATAU PEMRAKARSA..." 
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white border-4 border-slate-900 text-slate-900 text-sm font-black uppercase rounded-2xl pl-12 pr-4 py-4 focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none placeholder:text-slate-400"
          />
        </div>
        <select 
          value={filterJenis}
          onChange={e => { setFilterJenis(e.target.value); setCurrentPage(1); }}
          className="bg-white border-4 border-slate-900 text-slate-900 text-sm font-black uppercase tracking-wider rounded-2xl px-6 py-4 focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none cursor-pointer w-full md:w-auto"
        >
          <option value="Semua">SEMUA JENIS DOKUMEN</option>
          <option value="SPPL">SPPL</option>
          <option value="UKL-UPL">UKL-UPL</option>
          <option value="AMDAL">AMDAL</option>
        </select>
      </div>

      {/* Dynamic Data Table (NeoBrutalism) */}
      <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] rounded-3xl overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-100 border-b-4 border-slate-900">
              <tr>
                <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-900">URUT / THN</th>
                <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-900">Nama Kegiatan</th>
                <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-900">Pemrakarsa</th>
                <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-900">Letak Lemari/Rak</th>
                <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-900">
              {filteredDocs.length > 0 ? (
                paginatedDocs.map((d) => (
                  <tr key={d.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 border-r-2 border-slate-900">
                      <span className="bg-slate-200 text-slate-900 font-black px-2 py-1 rounded border-2 border-slate-900 text-xs shadow-[2px_2px_0_0_#0f172a]">
                        #{String(d.no_urut || d.id).padStart(3, '0')} / {d.tahun || '2026'}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-r-2 border-slate-900">
                      <p className="font-black text-slate-900 text-sm uppercase">{d.nama_kegiatan}</p>
                      <p className="text-xs font-bold text-slate-500 uppercase mt-1 bg-amber-100 inline-block px-2 py-0.5 rounded border border-slate-900">{d.jenis_dokumen}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm border-r-2 border-slate-900 uppercase">
                      {d.nama_pemrakarsa}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm border-r-2 border-slate-900 uppercase">
                      {d.lokasi_arsip ? (
                        <span className="bg-indigo-100 text-indigo-900 px-3 py-1 rounded-lg border-2 border-slate-900 font-black shadow-[2px_2px_0_0_#0f172a]">
                          {d.lokasi_arsip}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <Link 
                          href={`/perizinan/arsip/${d.id}`}
                          className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 text-xs font-black px-4 py-2 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#0f172a] transition-all flex items-center gap-1 uppercase"
                          title="Buka Detail Arsip"
                        >
                          <Info size={14} /> Detail
                        </Link>
                        <Link 
                          href={`/perizinan/cetak/${d.id}`}
                          className="bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black px-4 py-2 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#0f172a] transition-all flex items-center gap-1 uppercase"
                          title="Pusat Cetak Dokumen"
                        >
                          <Printer size={14} /> Cetak
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-bold bg-slate-50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Archive size={32} className="text-slate-300" />
                      <p className="uppercase tracking-widest">TIDAK ADA DATA ARSIP YANG DITEMUKAN.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-slate-100 border-t-4 border-slate-900 p-6 flex items-center justify-between">
            <span className="text-sm font-black text-slate-700 uppercase">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex gap-4">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-5 py-2.5 bg-white border-2 border-slate-900 rounded-xl text-sm font-black uppercase shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_#0f172a] transition-all"
              >
                Sebelumnya
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-5 py-2.5 bg-indigo-400 border-2 border-slate-900 rounded-xl text-sm font-black text-slate-900 uppercase shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_#0f172a] transition-all"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
