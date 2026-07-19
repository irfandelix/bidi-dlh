'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Archive, FileText, ArrowLeft, Plus, Search, Loader2, Download 
} from 'lucide-react';
import * as XLSX from 'xlsx';

type NotaDinas = {
  id: number;
  no_urut: number;
  nama_nota: string;
  tanggal_nota: string;
  dari_bagian: string;
  nomor_otomatis: string;
  created_at: string;
};

export default function DaftarArsipNotaDinasPage() {
  const [docs, setDocs] = useState<NotaDinas[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBagian, setFilterBagian] = useState('Semua');

  useEffect(() => {
    fetch('/api/arsip-nota-dinas')
      .then(res => res.json())
      .then(res => {
        setDocs(res.data || []);
        setLoading(false);
      });
  }, []);

  const filteredDocs = docs.filter(d => {
    const matchSearch = (d.nama_nota || '').toLowerCase().includes(search.toLowerCase()) || 
                        (d.nomor_otomatis || '').toLowerCase().includes(search.toLowerCase());
    const matchBagian = filterBagian === 'Semua' || d.dari_bagian === filterBagian;
    return matchSearch && matchBagian;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
  const paginatedDocs = filteredDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportExcel = () => {
    const dataToExport = filteredDocs.map((d, index) => ({
      "No": index + 1,
      "Nomor Urut": d.no_urut,
      "Nomor Nota Dinas": d.nomor_otomatis,
      "Nama Nota Dinas": d.nama_nota,
      "Tanggal": d.tanggal_nota,
      "Dari Bagian": d.dari_bagian
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nota Dinas");
    XLSX.writeFile(workbook, "Buku_Register_Nota_Dinas.xlsx");
  };

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-fuchsia-600" size={40} /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8 pb-20">
      
      {/* Header Neobrutalism */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] text-slate-900 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-fuchsia-200 rounded-full border-4 border-slate-900 opacity-30"></div>
        <div className="flex items-center gap-4 relative z-10">
          <Link href="/arsip" className="w-12 h-12 rounded-xl bg-white text-slate-900 border-4 border-slate-900 flex items-center justify-center hover:bg-slate-200 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#0f172a] transition-all shrink-0">
            <ArrowLeft size={24} />
          </Link>
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-fuchsia-400 border-2 border-slate-900 flex items-center justify-center text-slate-900 shadow-[4px_4px_0_0_#0f172a]">
            <Archive size={28} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight uppercase">Buku Register Nota Dinas</h2>
            <p className="text-sm text-slate-600 font-bold mt-1 uppercase">Pusat pencatatan & penomoran Nota Dinas otomatis.</p>
          </div>
        </div>
        
        <div className="flex items-center flex-wrap gap-3 relative z-10">
          <button onClick={handleExportExcel} className="bg-white hover:bg-slate-100 hover:-translate-y-1 text-slate-900 px-5 py-3 rounded-xl text-sm font-black shadow-[4px_4px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] border-2 border-slate-900 transition-all flex items-center gap-2 uppercase tracking-widest">
            <Download size={18} /> Export Excel
          </button>
          <div className="bg-emerald-50 px-5 py-3 rounded-xl border-2 border-slate-900 flex items-center gap-3 text-sm font-black text-slate-900 shadow-[4px_4px_0_0_#0f172a] uppercase">
            <FileText size={18} className="text-emerald-500 fill-emerald-500" />
            Total {docs.length} Surat
          </div>
          <Link href="/arsip/nota-dinas/tambah" className="bg-fuchsia-400 hover:bg-fuchsia-300 hover:-translate-y-1 text-slate-900 px-5 py-3 rounded-xl text-sm font-black shadow-[4px_4px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] border-2 border-slate-900 transition-all flex items-center gap-2 uppercase tracking-widest">
            <Plus size={18} /> Tambah Surat
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
            placeholder="CARI NAMA ATAU NOMOR SURAT..." 
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white border-4 border-slate-900 text-slate-900 text-sm font-black uppercase rounded-2xl pl-12 pr-4 py-4 focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none placeholder:text-slate-400"
          />
        </div>
        <select 
          value={filterBagian}
          onChange={e => { setFilterBagian(e.target.value); setCurrentPage(1); }}
          className="bg-white border-4 border-slate-900 text-slate-900 text-sm font-black uppercase tracking-wider rounded-2xl px-6 py-4 focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none cursor-pointer w-full md:w-auto"
        >
          <option value="Semua">SEMUA BAGIAN</option>
          <option value="Umum">UMUM</option>
          <option value="Perizinan">PERIZINAN</option>
          <option value="Pengaduan">PENGADUAN</option>
          <option value="Pengawasan">PENGAWASAN</option>
        </select>
      </div>

      {/* Dynamic Data Table (NeoBrutalism) */}
      <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] rounded-3xl overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-100 border-b-4 border-slate-900">
              <tr>
                <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-900">Nomor Registrasi</th>
                <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-900">Nama Nota Dinas</th>
                <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-900">Tanggal</th>
                <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-900">Dari / Bagian</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-900">
              {filteredDocs.length > 0 ? (
                paginatedDocs.map((d) => (
                  <tr key={d.id} className="hover:bg-fuchsia-50 transition-colors">
                    <td className="px-6 py-4 border-r-2 border-slate-900">
                      <span className="bg-slate-200 text-slate-900 font-black px-3 py-2 rounded-lg border-2 border-slate-900 text-sm shadow-[2px_2px_0_0_#0f172a]">
                        {d.nomor_otomatis}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-r-2 border-slate-900">
                      <p className="font-black text-slate-900 text-sm uppercase">{d.nama_nota}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm border-r-2 border-slate-900">
                      {d.tanggal_nota}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm border-r-2 border-slate-900 uppercase">
                      <span className={`px-3 py-1 rounded-lg border-2 border-slate-900 font-black shadow-[2px_2px_0_0_#0f172a] ${
                        d.dari_bagian === 'Umum' ? 'bg-amber-100 text-amber-900' :
                        d.dari_bagian === 'Perizinan' ? 'bg-blue-100 text-blue-900' :
                        d.dari_bagian === 'Pengaduan' ? 'bg-rose-100 text-rose-900' :
                        'bg-emerald-100 text-emerald-900'
                      }`}>
                        {d.dari_bagian}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-bold bg-slate-50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Archive size={32} className="text-slate-300" />
                      <p className="uppercase tracking-widest">BELUM ADA BUKU REGISTER ATAU TIDAK DITEMUKAN.</p>
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
                className="px-5 py-2.5 bg-fuchsia-400 border-2 border-slate-900 rounded-xl text-sm font-black text-slate-900 uppercase shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_#0f172a] transition-all"
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
