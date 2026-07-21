'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Archive, FileText, ArrowLeft, Plus, Search, Loader2, Download, Upload 
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
  keterangan?: string;
  pemohon?: {
    nama: string;
    jabatan: string;
  };
};

export default function DaftarArsipNotaDinasPage() {
  const [docs, setDocs] = useState<NotaDinas[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBagian, setFilterBagian] = useState('Semua');
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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
      "Pemohon": d.pemohon ? d.pemohon.nama : 'Tanpa Pemohon',
      "Jabatan Pemohon": d.pemohon ? d.pemohon.jabatan : '',
      "Tanggal": d.tanggal_nota,
      "Nomor Nota Dinas": d.nomor_otomatis,
      "Isi": d.nama_nota,
      "Keterangan": d.keterangan || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nota Dinas");
    XLSX.writeFile(workbook, "Buku_Register_Nota_Dinas.xlsx");
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const payload = jsonData.map(row => {
        let tgl = row['Tanggal'];
        if (tgl instanceof Date) {
          // Adjust for timezone offset to prevent date shifting
          const offset = tgl.getTimezoneOffset();
          tgl = new Date(tgl.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
        } else if (typeof tgl === 'number') {
          // Fallback if cellDates didn't work for some reason
          const excelDate = new Date(Math.round((tgl - 25569) * 86400 * 1000));
          tgl = excelDate.toISOString().split('T')[0];
        } else if (!tgl) {
          tgl = new Date().toISOString().split('T')[0];
        }

        const nomorOtomatis = row['Nomor Otomatis'] || row['Nomor Nota Dinas'] || '';
        let bagian = row['Bagian'] || 'Umum';
        
        // Auto-detect Bagian if missing
        if (!row['Bagian']) {
          if (nomorOtomatis.includes('/PG/')) bagian = 'Pengaduan';
          else if (nomorOtomatis.includes('/PW/')) bagian = 'Pengawasan';
          else if (nomorOtomatis.includes('/PL/')) bagian = 'Perizinan';
        }

        return {
          nama_nota: row['Nama Nota Dinas'] || row['Isi'] || 'Tanpa Subjek',
          tanggal_nota: tgl,
          dari_bagian: bagian,
          nomor_otomatis: nomorOtomatis,
          keterangan: row['Keterangan'] || null
        };
      });

      const res = await fetch('/api/import/nota-dinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      
      alert(`Berhasil mengimpor ${resData.count} data!`);
      window.location.reload();
    } catch (error: any) {
      alert(`Gagal mengimpor data: ${error.message}`);
      console.error(error);
    } finally {
      setIsImporting(false);
      setShowImportModal(false);
    }
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
          <button onClick={() => setShowImportModal(true)} className="bg-sky-400 hover:bg-sky-300 hover:-translate-y-1 text-slate-900 px-5 py-3 rounded-xl text-sm font-black shadow-[4px_4px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] border-2 border-slate-900 transition-all flex items-center gap-2 uppercase tracking-widest">
            <Upload size={18} /> Import Excel
          </button>
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
                <th className="px-4 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-900 w-16 text-center">No</th>
                <th className="px-4 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-900">Pemohon</th>
                <th className="px-4 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-900">Tanggal</th>
                <th className="px-4 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-900">Nomor Nota Dinas</th>
                <th className="px-4 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-900">Isi</th>
                <th className="px-4 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-900">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-900">
              {filteredDocs.length > 0 ? (
                paginatedDocs.map((d, index) => (
                  <tr key={d.id} className="hover:bg-fuchsia-50 transition-colors">
                    <td className="px-4 py-4 border-r-2 border-slate-900 text-center font-bold text-sm">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-4 py-4 border-r-2 border-slate-900">
                      {d.pemohon ? (
                        <>
                          <p className="font-black text-slate-900 text-sm uppercase">{d.pemohon.nama}</p>
                          {d.pemohon.jabatan && <p className="font-bold text-slate-500 text-xs">{d.pemohon.jabatan}</p>}
                        </>
                      ) : (
                        <p className="font-bold text-slate-500 text-xs italic">Tanpa Pemohon</p>
                      )}
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-700 text-sm border-r-2 border-slate-900">
                      {d.tanggal_nota}
                    </td>
                    <td className="px-4 py-4 border-r-2 border-slate-900">
                      <span className="bg-slate-200 text-slate-900 font-black px-3 py-2 rounded-lg border-2 border-slate-900 text-sm shadow-[2px_2px_0_0_#0f172a]">
                        {d.nomor_otomatis}
                      </span>
                    </td>
                    <td className="px-4 py-4 border-r-2 border-slate-900">
                      <p className="font-black text-slate-900 text-sm uppercase">{d.nama_nota}</p>
                    </td>
                    <td className="px-4 py-4 border-r-2 border-slate-900">
                      <p className="font-bold text-slate-700 text-sm">{d.keterangan || '-'}</p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-bold bg-slate-50">
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

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border-4 border-slate-900 rounded-2xl p-6 shadow-[8px_8px_0_0_#0f172a] max-w-md w-full animate-in zoom-in-95">
            <h3 className="text-xl font-black text-slate-900 uppercase mb-2">Import Excel</h3>
            <p className="text-sm font-bold text-slate-600 mb-6">
              Pastikan file Excel Anda memiliki kolom: <strong>Nama Nota Dinas, Tanggal, Bagian, Nomor Otomatis</strong>
            </p>
            
            <div className="space-y-4">
              <label className="block w-full border-2 border-dashed border-slate-900 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  disabled={isImporting}
                />
                {isImporting ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-sky-500" size={32} />
                    <span className="text-sm font-bold text-slate-900 uppercase">Mengimpor Data...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="text-sky-500" size={32} />
                    <span className="text-sm font-bold text-slate-900 uppercase">Pilih File Excel</span>
                  </div>
                )}
              </label>

              <button 
                onClick={() => setShowImportModal(false)}
                disabled={isImporting}
                className="w-full px-5 py-3 bg-rose-400 border-2 border-slate-900 rounded-xl text-sm font-black text-slate-900 uppercase shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
