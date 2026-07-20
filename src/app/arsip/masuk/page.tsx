'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Inbox, FileText, ArrowLeft, Plus, Search, Loader2, Download, Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';

type ArsipMasuk = {
  id: number;
  kode_klasifikasi: string;
  nomor_berkas: string;
  nomor_isi_berkas: string;
  nomor_item: string;
  kode_klasifikasi_1: string;
  kode_klasifikasi_2: string;
  kode_klasifikasi_3: string;
  kode_klasifikasi_4: string;
  nomor_surat_masuk: string;
  tanggal_surat: string;
  tanggal_terima: string;
  asal_surat: string;
  perihal: string;
  jumlah?: number;
  status_surat?: string;
  file_url?: string;
  created_at: string;
};

export default function DaftarArsipMasukPage() {
  const [docs, setDocs] = useState<ArsipMasuk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/arsip-masuk')
      .then(res => res.json())
      .then(res => {
        setDocs(res.data || []);
        setLoading(false);
      });
  }, []);

  const filteredDocs = docs.filter(d => {
    return (d.perihal || '').toLowerCase().includes(search.toLowerCase()) || 
           (d.nomor_berkas || '').toLowerCase().includes(search.toLowerCase()) ||
           (d.nomor_isi_berkas || '').toLowerCase().includes(search.toLowerCase()) ||
           (d.nomor_item || '').toLowerCase().includes(search.toLowerCase()) ||
           (d.asal_surat || '').toLowerCase().includes(search.toLowerCase());
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
  const paginatedDocs = filteredDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportExcel = () => {
    // Arahkan browser ke endpoint API export
    window.location.href = '/api/export/arsip-masuk';
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/import/arsip-masuk', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.error || 'Gagal mengimpor file');
      } else {
        alert(`Berhasil mengimpor ${result.count} baris data!`);
        // Refresh data
        window.location.reload();
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan saat impor');
    } finally {
      setIsImporting(false);
      // Reset input agar bisa upload file yang sama lagi jika perlu
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
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
            <Inbox size={28} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight uppercase">Buku Agenda Surat Masuk</h2>
            <p className="text-sm text-slate-600 font-bold mt-1 uppercase">Pencatatan arsip surat dari pihak eksternal.</p>
          </div>
        </div>
        
        <div className="flex items-center flex-wrap gap-3 relative z-10">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportExcel} 
            accept=".xlsx,.csv" 
            className="hidden" 
          />
          <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="bg-amber-300 hover:bg-amber-200 hover:-translate-y-1 text-slate-900 px-5 py-3 rounded-xl text-sm font-black shadow-[4px_4px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] border-2 border-slate-900 transition-all flex items-center gap-2 uppercase tracking-widest disabled:opacity-50">
            {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />} Import
          </button>
          <button onClick={handleExportExcel} className="bg-white hover:bg-slate-100 hover:-translate-y-1 text-slate-900 px-5 py-3 rounded-xl text-sm font-black shadow-[4px_4px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] border-2 border-slate-900 transition-all flex items-center gap-2 uppercase tracking-widest">
            <Download size={18} /> Export
          </button>
          <div className="bg-emerald-50 px-5 py-3 rounded-xl border-2 border-slate-900 flex items-center gap-3 text-sm font-black text-slate-900 shadow-[4px_4px_0_0_#0f172a] uppercase">
            <FileText size={18} className="text-emerald-500 fill-emerald-500" />
            Total {docs.length} Surat
          </div>
          <Link href="/arsip/masuk/tambah" className="bg-blue-400 hover:bg-blue-300 hover:-translate-y-1 text-slate-900 px-5 py-3 rounded-xl text-sm font-black shadow-[4px_4px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] border-2 border-slate-900 transition-all flex items-center gap-2 uppercase tracking-widest">
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
            placeholder="CARI PERIHAL, NOMOR SURAT, ATAU ASAL SURAT..." 
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white border-4 border-slate-900 text-slate-900 text-sm font-black uppercase rounded-2xl pl-12 pr-4 py-4 focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Dynamic Data Table (NeoBrutalism) */}
      <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] rounded-3xl overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-100 border-b-4 border-slate-900">
              <tr>
                <th className="px-6 py-4 font-black text-slate-900 uppercase text-[10px] border-r-2 border-slate-900 min-w-[100px] text-center">No. Berkas</th>
                <th className="px-6 py-4 font-black text-slate-900 uppercase text-[10px] border-r-2 border-slate-900 min-w-[100px] text-center">No. Isi</th>
                <th className="px-6 py-4 font-black text-slate-900 uppercase text-[10px] border-r-2 border-slate-900 min-w-[100px] text-center">No. Item</th>
                <th colSpan={4} className="px-6 py-4 font-black text-slate-900 uppercase text-[10px] border-r-2 border-slate-900 text-center min-w-[320px]">Kode Klasifikasi</th>
                <th className="px-6 py-4 font-black text-slate-900 uppercase text-[10px] border-r-2 border-slate-900 min-w-[400px]">Uraian & Asal Surat</th>
                <th className="px-6 py-4 font-black text-slate-900 uppercase text-[10px] border-r-2 border-slate-900 min-w-[150px]">Tanggal</th>
                <th className="px-6 py-4 font-black text-slate-900 uppercase text-[10px] min-w-[100px]">File</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-900">
              {filteredDocs.length > 0 ? (
                paginatedDocs.map((d) => (
                  <tr key={d.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 border-r-2 border-slate-900 text-center font-black text-slate-900">{d.nomor_berkas || '-'}</td>
                    <td className="px-6 py-4 border-r-2 border-slate-900 text-center font-black text-slate-900">{d.nomor_isi_berkas || '-'}</td>
                    <td className="px-6 py-4 border-r-2 border-slate-900 text-center font-black text-slate-900">{d.nomor_item || '-'}</td>
                    <td className="px-4 py-4 border-r-2 border-slate-900 text-center font-bold text-slate-700 text-sm min-w-[80px]">{d.kode_klasifikasi_1 || '-'}</td>
                    <td className="px-4 py-4 border-r-2 border-slate-900 text-center font-bold text-slate-700 text-sm min-w-[80px]">{d.kode_klasifikasi_2 || '-'}</td>
                    <td className="px-4 py-4 border-r-2 border-slate-900 text-center font-bold text-slate-700 text-sm min-w-[80px]">{d.kode_klasifikasi_3 || '-'}</td>
                    <td className="px-4 py-4 border-r-2 border-slate-900 text-center font-bold text-slate-700 text-sm min-w-[80px]">{d.kode_klasifikasi_4 || '-'}</td>
                    <td className="px-6 py-4 border-r-2 border-slate-900">
                      <p className="font-bold text-slate-700 text-[10px] uppercase mb-1">Dari: {d.asal_surat}</p>
                      <p className="font-black text-slate-900 text-sm uppercase">{d.perihal}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm border-r-2 border-slate-900">
                      <div>Surat: {d.tanggal_surat}</div>
                      <div className="text-xs text-slate-500">Terima: {d.tanggal_terima}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm">
                      {d.file_url ? (
                        <a href={d.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                           <FileText size={16} /> Lihat
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs italic">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-500 font-bold bg-slate-50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox size={32} className="text-slate-300" />
                      <p className="uppercase tracking-widest">TIDAK ADA DATA SURAT MASUK.</p>
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
                className="px-5 py-2.5 bg-blue-400 border-2 border-slate-900 rounded-xl text-sm font-black text-slate-900 uppercase shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_#0f172a] transition-all"
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
