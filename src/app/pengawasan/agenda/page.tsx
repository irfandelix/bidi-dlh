'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import Link from 'next/link';
import { ArrowLeft, Search, CalendarPlus, Edit3, Copy, MapPin, Database, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function DaftarAgenda() {
  const [agendas, setAgendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetch('/api/pengawasan?type=agenda')
      .then(res => res.json())
      .then(res => {
        setAgendas(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filtered = agendas.filter(a => 
    (a.nama_kegiatan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.nama_pemrakarsa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.kategori || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.token || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset pagination when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const copyLink = (token: string) => {
    if (!token) {
      alert('Token belum di-set untuk agenda ini!');
      return;
    }
    const url = `${window.location.origin}/pengawasan/token?token=${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    }).catch(err => {
      console.error('Gagal menyalin teks: ', err);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-12">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/pengawasan" className="w-12 h-12 rounded-xl bg-white text-slate-900 border-4 border-slate-900 flex items-center justify-center hover:bg-teal-400 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#0f172a] transition-all shrink-0">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Agenda Kunjungan</h2>
              <p className="text-sm font-bold text-slate-600 mt-1">Buku induk seluruh riwayat jadwal inspeksi lapangan.</p>
            </div>
          </div>
          
          <div className="shrink-0 mt-2 sm:mt-0">
            <Link href="/pengawasan/buat-agenda" className="bg-teal-400 hover:bg-teal-500 text-slate-900 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] hover:translate-y-1 transition-all flex items-center gap-2">
              <CalendarPlus size={20} /> Buat Agenda Baru
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-3xl border-4 border-slate-900 overflow-hidden shadow-[12px_12px_0_0_#0f172a]">
          
          <div className="p-6 bg-slate-100 border-b-4 border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-3.5 text-slate-900" size={20} />
              <input 
                type="text" 
                placeholder="Cari kegiatan, kategori, token..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border-4 border-slate-900 rounded-xl pl-12 pr-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-colors"
              />
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <div className="text-sm font-black text-slate-900 uppercase tracking-widest bg-emerald-200 border-4 border-slate-900 px-5 py-3 rounded-xl shadow-[4px_4px_0_0_#0f172a]">
                Total: {filtered.length}
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
          
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-900 font-black border-b-4 border-slate-900">
                <tr>
                  <th className="p-5 uppercase text-xs tracking-widest w-12 text-center whitespace-nowrap">No</th>
                  <th className="p-5 uppercase text-xs tracking-widest w-32 whitespace-nowrap">Token</th>
                  <th className="p-5 uppercase text-xs tracking-widest w-32 whitespace-nowrap">Tanggal</th>
                  <th className="p-5 uppercase text-xs tracking-widest whitespace-nowrap">Nama Kegiatan / Perusahaan</th>
                  <th className="p-5 uppercase text-xs tracking-widest whitespace-nowrap">Tim Tugas</th>
                  <th className="p-5 uppercase text-xs tracking-widest w-32 text-center whitespace-nowrap">Status</th>
                  <th className="p-5 uppercase text-xs tracking-widest text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y-4 divide-slate-900">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center font-black text-slate-900 uppercase text-lg"><LottieLoader size={150} text="MEMUAT DATA..." /></td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest">Tidak ada agenda yang ditemukan.</td>
                  </tr>
                ) : (
                  paginated.map((agenda, index) => (
                    <tr key={agenda.id} className="hover:bg-indigo-50 transition-colors group">
                      <td className="p-5 text-center font-black text-slate-400 text-base">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      
                      <td className="p-5">
                        <span className="inline-block whitespace-nowrap font-mono font-black text-sm bg-slate-200 text-slate-900 px-3 py-1.5 rounded-lg border-2 border-slate-900 uppercase tracking-widest shadow-[2px_2px_0_0_#0f172a]">
                          {agenda.token || 'BELUM SET'}
                        </span>
                      </td>
                      
                      <td className="p-5 font-bold text-slate-700 whitespace-nowrap">
                        {new Date(agenda.tanggal_kunjungan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      
                      <td className="p-5 whitespace-normal break-words min-w-[200px]">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 uppercase text-sm leading-tight mb-1">{agenda.nama_kegiatan}</span>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <MapPin size={14} className="text-rose-600" /> {agenda.kategori || 'Umum'}
                          </span>
                        </div>
                      </td>
                      
                      <td className="p-5 text-slate-700 text-xs font-bold leading-relaxed whitespace-normal min-w-[200px]">
                        {agenda.tim_tugas ? (
                          <ol className="list-decimal pl-4 m-0">
                            {agenda.tim_tugas.split('|').map((anggota: string, i: number) => (
                              <li key={i} className="pb-1 uppercase">{anggota.trim()}</li>
                            ))}
                          </ol>
                        ) : (
                          <span className="italic text-slate-400 uppercase tracking-widest">Belum ditugaskan</span>
                        )}
                      </td>
                      
                      <td className="p-5 text-center whitespace-nowrap">
                        {(() => {
                          const st = (agenda.status_ketaatan || '').toUpperCase();
                          if (st === 'TAAT') return <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-200 border-2 border-emerald-900 text-emerald-900 text-xs font-black uppercase tracking-widest rounded-xl shadow-[2px_2px_0_0_#064e3b]"><span className="w-2 h-2 rounded-full bg-emerald-600 border border-emerald-900"></span> TAAT</span>;
                          if (st === 'TAAT BERSYARAT' || st === 'KURANG TAAT') return <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-200 border-2 border-amber-900 text-amber-900 text-xs font-black uppercase tracking-widest rounded-xl shadow-[2px_2px_0_0_#78350f]"><span className="w-2 h-2 rounded-full bg-amber-600 border border-amber-900"></span> BERSYARAT</span>;
                          if (st === 'TIDAK TAAT') return <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-200 border-2 border-rose-900 text-rose-900 text-xs font-black uppercase tracking-widest rounded-xl shadow-[2px_2px_0_0_#881337]"><span className="w-2 h-2 rounded-full bg-rose-600 border border-rose-900"></span> TIDAK TAAT</span>;
                          return <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-200 border-2 border-slate-900 text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl shadow-[2px_2px_0_0_#0f172a]"><span className="w-2 h-2 rounded-full bg-slate-500 border border-slate-900"></span> BELUM</span>;
                        })()}
                      </td>
                      
                      <td className="p-5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          
                          <Link href={`/pengawasan/ba/isi/${agenda.id}`} className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-teal-900 bg-teal-200 border-2 border-teal-900 rounded-xl hover:bg-teal-400 hover:shadow-[2px_2px_0_0_#134e4a] hover:-translate-y-0.5 transition-all">
                            <Edit3 size={16} /> BAP
                          </Link>

                          <button 
                            type="button" 
                            onClick={() => copyLink(agenda.token)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest border-2 border-slate-900 rounded-xl hover:shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 transition-all w-[96px] justify-center ${copiedToken === agenda.token ? 'bg-emerald-400 text-emerald-900' : 'bg-slate-100 text-slate-700 hover:bg-indigo-300 hover:text-indigo-900'}`}
                          >
                            {copiedToken === agenda.token ? <Check size={16} /> : <Copy size={16} />}
                            {copiedToken === agenda.token ? 'Copied' : 'Link'}
                          </button>

                        </div>
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
