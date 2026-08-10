'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Inbox, FileText, ArrowLeft, Plus, Search, Loader2, Download, Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';
import LottieLoader from '@/components/LottieLoader';

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
    return <div className="min-h-[50vh] flex items-center justify-center"><LottieLoader size={150} text="MEMUAT DATA..." /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8 pb-20">
      
      {/* Header Neobrutalism */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow text-on-surface relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-200 rounded-full border border-outline-variant opacity-30"></div>
        <div className="flex items-center gap-4 relative z-10">
          <Link href="/arsip" className="w-12 h-12 rounded-xl bg-surface text-on-surface border border-outline-variant flex items-center justify-center hover:bg-surface-container hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all shrink-0">
            <ArrowLeft size={24} />
          </Link>
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-blue-400 border border-outline-variant flex items-center justify-center text-on-surface shadow-sm hover:shadow-md transition-shadow">
            <Inbox size={28} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface leading-tight uppercase">Buku Agenda Surat Masuk</h2>
            <p className="text-sm text-on-surface-variant font-bold mt-1 uppercase">Pencatatan arsip surat dari pihak eksternal.</p>
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
          <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="bg-amber-300 hover:bg-amber-200 hover:-translate-y-1 text-on-surface px-5 py-3 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-shadow hover:shadow-sm hover:shadow-md transition-shadow border border-outline-variant transition-all flex items-center gap-2 uppercase tracking-widest disabled:opacity-50">
            {isImporting ? <LottieLoader size={24} /> : <Upload size={18} />} Import
          </button>
          <button onClick={handleExportExcel} className="bg-surface hover:bg-surface-container-low hover:-translate-y-1 text-on-surface px-5 py-3 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-shadow hover:shadow-sm hover:shadow-md transition-shadow border border-outline-variant transition-all flex items-center gap-2 uppercase tracking-widest">
            <Download size={18} /> Export
          </button>
          <div className="bg-secondary-container px-5 py-3 rounded-xl border border-outline-variant flex items-center gap-3 text-sm font-bold text-on-surface shadow-sm hover:shadow-md transition-shadow uppercase">
            <FileText size={18} className="text-secondary fill-emerald-500" />
            Total {docs.length} Surat
          </div>
          <Link href="/arsip/masuk/tambah" className="bg-blue-400 hover:bg-blue-300 hover:-translate-y-1 text-on-surface px-5 py-3 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-shadow hover:shadow-sm hover:shadow-md transition-shadow border border-outline-variant transition-all flex items-center gap-2 uppercase tracking-widest">
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
            className="w-full bg-surface border border-outline-variant text-on-surface text-sm font-bold uppercase rounded-2xl pl-12 pr-4 py-4 focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Dynamic Data Table (NeoBrutalism) */}
      <div className="bg-surface border border-outline-variant shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low border-b-4 border-outline-variant">
              <tr>
                <th className="px-6 py-4 font-bold text-on-surface uppercase text-[10px] border-r border-outline-variant min-w-[100px] text-center">No. Berkas</th>
                <th className="px-6 py-4 font-bold text-on-surface uppercase text-[10px] border-r border-outline-variant min-w-[100px] text-center">No. Isi</th>
                <th className="px-6 py-4 font-bold text-on-surface uppercase text-[10px] border-r border-outline-variant min-w-[100px] text-center">No. Item</th>
                <th colSpan={4} className="px-6 py-4 font-bold text-on-surface uppercase text-[10px] border-r border-outline-variant text-center min-w-[320px]">Kode Klasifikasi</th>
                <th className="px-6 py-4 font-bold text-on-surface uppercase text-[10px] border-r border-outline-variant min-w-[400px]">Uraian & Asal Surat</th>
                <th className="px-6 py-4 font-bold text-on-surface uppercase text-[10px] border-r border-outline-variant min-w-[150px]">Tanggal</th>
                <th className="px-6 py-4 font-bold text-on-surface uppercase text-[10px] min-w-[100px]">File</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-900">
              {filteredDocs.length > 0 ? (
                paginatedDocs.map((d) => (
                  <tr key={d.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 border-r border-outline-variant text-center font-bold text-on-surface">{d.nomor_berkas || '-'}</td>
                    <td className="px-6 py-4 border-r border-outline-variant text-center font-bold text-on-surface">{d.nomor_isi_berkas || '-'}</td>
                    <td className="px-6 py-4 border-r border-outline-variant text-center font-bold text-on-surface">{d.nomor_item || '-'}</td>
                    <td className="px-4 py-4 border-r border-outline-variant text-center font-bold text-on-surface-variant text-sm min-w-[80px]">{d.kode_klasifikasi_1 || '-'}</td>
                    <td className="px-4 py-4 border-r border-outline-variant text-center font-bold text-on-surface-variant text-sm min-w-[80px]">{d.kode_klasifikasi_2 || '-'}</td>
                    <td className="px-4 py-4 border-r border-outline-variant text-center font-bold text-on-surface-variant text-sm min-w-[80px]">{d.kode_klasifikasi_3 || '-'}</td>
                    <td className="px-4 py-4 border-r border-outline-variant text-center font-bold text-on-surface-variant text-sm min-w-[80px]">{d.kode_klasifikasi_4 || '-'}</td>
                    <td className="px-6 py-4 border-r border-outline-variant">
                      <p className="font-bold text-on-surface-variant text-[10px] uppercase mb-1">Dari: {d.asal_surat}</p>
                      <p className="font-bold text-on-surface text-sm uppercase">{d.perihal}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-on-surface-variant text-sm border-r border-outline-variant">
                      <div>Surat: {d.tanggal_surat}</div>
                      <div className="text-xs text-on-surface-variant">Terima: {d.tanggal_terima}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-on-surface-variant text-sm">
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
                  <td colSpan={10} className="px-6 py-12 text-center text-on-surface-variant font-bold bg-surface-container-lowest">
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
          <div className="bg-surface-container-low border-t border-outline-variant p-6 flex items-center justify-between">
            <span className="text-sm font-bold text-on-surface-variant uppercase">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex gap-4">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-5 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm font-bold uppercase shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm hover:shadow-md transition-shadow transition-all"
              >
                Sebelumnya
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-5 py-2.5 bg-blue-400 border border-outline-variant rounded-xl text-sm font-bold text-on-surface uppercase shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm hover:shadow-md transition-shadow transition-all"
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
