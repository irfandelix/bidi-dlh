'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import Link from 'next/link';
import { ArrowLeft, Clock, Search, ExternalLink, Calendar, MapPin, Building2, CheckCircle, Printer, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ArsipPengawasan() {
  const [arsip, setArsip] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 9 is good for 3 column grid

  useEffect(() => {
    fetch('/api/pengawasan?type=arsip')
      .then(res => res.json())
      .then(res => {
        setArsip(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filtered = arsip.filter(a => 
    (a.nama_kegiatan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.nama_pemrakarsa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.kategori || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset pagination when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <Link href="/pengawasan" className="inline-flex items-center gap-2 font-bold text-slate-700 hover:text-slate-900 bg-white px-4 py-2 rounded-xl border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] hover:translate-y-[2px] transition-all mb-4">
              <ArrowLeft size={20} /> Hub Pengawasan
            </Link>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Arsip BAP Pengawasan</h1>
            <p className="text-slate-600 font-bold">Daftar kunjungan lapangan yang sudah selesai dan memiliki Berita Acara.</p>
          </div>
        </div>

        <div className="bg-white border-4 border-slate-900 rounded-3xl p-6 lg:p-8 shadow-[12px_12px_0_0_#0f172a]">
          
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-8">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Cari kegiatan, pemrakarsa, kategori..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl pl-12 pr-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-200"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
              <div className="text-sm font-black text-slate-900 uppercase bg-emerald-100 border-2 border-slate-900 px-4 py-3 rounded-xl flex items-center gap-2 shadow-[2px_2px_0_0_#0f172a]">
                <CheckCircle size={18} className="text-emerald-700" />
                Total: {filtered.length} Arsip
              </div>

              {/* Pagination Controls */}
              {!loading && filtered.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider hidden sm:inline">
                    Hal {currentPage} / {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="w-12 h-12 flex items-center justify-center bg-white border-4 border-slate-900 rounded-xl text-slate-900 shadow-[2px_2px_0_0_#0f172a] disabled:opacity-50 disabled:shadow-none hover:bg-slate-200 transition-all active:translate-y-1 active:shadow-none"
                    >
                      <ChevronLeft size={24} strokeWidth={3} />
                    </button>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="w-12 h-12 flex items-center justify-center bg-white border-4 border-slate-900 rounded-xl text-slate-900 shadow-[2px_2px_0_0_#0f172a] disabled:opacity-50 disabled:shadow-none hover:bg-slate-200 transition-all active:translate-y-1 active:shadow-none"
                    >
                      <ChevronRight size={24} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center font-bold text-slate-500">Memuat data arsip...</div>
          ) : paginated.length === 0 ? (
            <div className="py-20 text-center font-bold text-slate-500 border-4 border-dashed border-slate-300 rounded-2xl bg-slate-50">
              Tidak ada arsip yang ditemukan.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map(agenda => (
                <div key={agenda.id} className="group bg-white border-4 border-slate-900 rounded-2xl p-6 shadow-[6px_6px_0_0_#0f172a] hover:shadow-[3px_3px_0_0_#0f172a] hover:translate-y-1 transition-all relative overflow-hidden flex flex-col justify-between">
                  
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg border-2 border-emerald-800 text-xs font-black uppercase tracking-widest">
                        {agenda.kategori}
                      </span>
                      <span className={`text-xs font-black uppercase px-2 py-1 rounded border-2 ${
                        agenda.status_ketaatan === 'Taat' 
                          ? 'bg-green-100 text-green-800 border-green-800' 
                          : agenda.status_ketaatan === 'Tidak Taat'
                          ? 'bg-rose-100 text-rose-800 border-rose-800'
                          : 'bg-slate-100 text-slate-800 border-slate-800'
                      }`}>
                        {agenda.status_ketaatan || 'Selesai'}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-900 mb-1 line-clamp-2">{agenda.nama_kegiatan}</h3>
                    <p className="text-sm font-bold text-slate-600 mb-4 line-clamp-1">{agenda.nama_pemrakarsa}</p>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-sm text-slate-700 font-bold">
                        <Calendar size={16} className="text-emerald-600" />
                        <span>{new Date(agenda.tanggal_kunjungan).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/pengawasan/detail/${encodeURIComponent(agenda.kategori)}/${agenda.id}`} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black uppercase tracking-widest p-3 rounded-xl border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] hover:translate-y-[2px] transition-all">
                      Detail
                    </Link>
                    <a href={`/api/pengawasan/bap/${agenda.id}/generate`} target="_blank" rel="noreferrer" title="Cetak BAP (Word)" className="flex items-center justify-center gap-2 bg-indigo-400 hover:bg-indigo-500 text-slate-900 font-black uppercase tracking-widest p-3 rounded-xl border-2 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] hover:translate-y-[2px] transition-all">
                      <Printer size={20} />
                    </a>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
