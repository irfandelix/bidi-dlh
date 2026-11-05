'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  ArrowLeft, 
  Plus, 
  Search, 
  Download, 
  Upload, 
  Calendar,
  Trash2,
  ExternalLink,
  Building2,
  Filter,
  Sparkles,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import LottieLoader from '@/components/LottieLoader';

type NotaDinas = {
  id: number;
  no_urut: number;
  nama_nota: string;
  tanggal_nota: string;
  dari_bagian: string;
  nomor_otomatis: string;
  created_at: string;
  keterangan?: string;
  file_url?: string;
  pemohon?: {
    nama: string;
    jabatan: string;
  };
};

const resolveFileUrl = (url?: string): string => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://drive.google.com/file/d/${url}/view`;
};

export default function DaftarArsipNotaDinasPage() {
  const [docs, setDocs] = useState<NotaDinas[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBagian, setFilterBagian] = useState('Semua');
  const [selectedYear, setSelectedYear] = useState('Semua');
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // State untuk modal unggah berkas susulan
  const [uploadModalDoc, setUploadModalDoc] = useState<NotaDinas | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const fetchDocs = () => {
    fetch('/api/arsip-nota-dinas')
      .then(res => res.json())
      .then(res => {
        setDocs(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  // Ekstrak daftar tahun unik dari data nota dinas
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    docs.forEach(d => {
      if (d.tanggal_nota) {
        const y = d.tanggal_nota.substring(0, 4);
        if (y && !isNaN(Number(y))) years.add(y);
      }
    });
    return Array.from(years).sort().reverse();
  }, [docs]);

  const filteredDocs = useMemo(() => {
    return docs.filter(d => {
      const matchSearch = 
        (d.nama_nota || '').toLowerCase().includes(search.toLowerCase()) || 
        (d.nomor_otomatis || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.pemohon?.nama || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.keterangan || '').toLowerCase().includes(search.toLowerCase());

      const matchBagian = filterBagian === 'Semua' || d.dari_bagian?.toLowerCase() === filterBagian.toLowerCase();
      
      const docYear = d.tanggal_nota ? d.tanggal_nota.substring(0, 4) : '';
      const matchYear = selectedYear === 'Semua' || docYear === selectedYear;

      return matchSearch && matchBagian && matchYear;
    });
  }, [docs, search, filterBagian, selectedYear]);

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage) || 1;
  const paginatedDocs = useMemo(() => {
    return filteredDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredDocs, currentPage, itemsPerPage]);

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data nota dinas ini secara permanen?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/arsip-nota-dinas?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocs(prev => prev.filter(d => d.id !== id));
      } else {
        const errData = await res.json();
        alert(`Gagal menghapus: ${errData.error || 'Terjadi kesalahan'}`);
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Upload berkas susulan untuk nota dinas yang belum ada lampirannya
  const handleUploadSusulan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalDoc || !uploadFile) return;

    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const upRes = await fetch('/api/arsip-nota-dinas/upload', {
        method: 'POST',
        body: formData
      });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error || 'Gagal mengunggah file');

      const patchRes = await fetch('/api/arsip-nota-dinas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uploadModalDoc.id,
          file_url: upData.url
        })
      });
      if (!patchRes.ok) throw new Error('Gagal memperbarui tautan berkas');

      // Update state lokal
      setDocs(prev => prev.map(item => item.id === uploadModalDoc.id ? { ...item, file_url: upData.url } : item));
      setUploadModalDoc(null);
      setUploadFile(null);
      alert('Berkas nota dinas berhasil diunggah!');
    } catch (err: any) {
      alert(`Gagal upload: ${err.message}`);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredDocs.map((d, index) => ({
      "No": index + 1,
      "Pemohon": d.pemohon ? d.pemohon.nama : 'Tanpa Pemohon',
      "Jabatan Pemohon": d.pemohon ? d.pemohon.jabatan : '',
      "Bagian": d.dari_bagian || 'Umum',
      "Tanggal": d.tanggal_nota,
      "Nomor Nota Dinas": d.nomor_otomatis,
      "Perihal / Isi": d.nama_nota,
      "Keterangan": d.keterangan || '-',
      "Link File": resolveFileUrl(d.file_url)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nota Dinas");
    XLSX.writeFile(workbook, `Buku_Register_Nota_Dinas_${selectedYear !== 'Semua' ? selectedYear : 'Semua_Tahun'}.xlsx`);
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
          const offset = tgl.getTimezoneOffset();
          tgl = new Date(tgl.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
        } else if (typeof tgl === 'number') {
          const excelDate = new Date(Math.round((tgl - 25569) * 86400 * 1000));
          tgl = excelDate.toISOString().split('T')[0];
        } else if (!tgl) {
          tgl = new Date().toISOString().split('T')[0];
        }

        const nomorOtomatis = row['Nomor Otomatis'] || row['Nomor Nota Dinas'] || '';
        let bagian = row['Bagian'] || 'Umum';
        
        if (!row['Bagian']) {
          if (nomorOtomatis.includes('/PG/')) bagian = 'Pengaduan';
          else if (nomorOtomatis.includes('/PW/')) bagian = 'Pengawasan';
          else if (nomorOtomatis.includes('/PL/')) bagian = 'Perizinan';
        }

        return {
          nama_nota: row['Nama Nota Dinas'] || row['Perihal / Isi'] || row['Isi'] || 'Tanpa Subjek',
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
      fetchDocs();
    } catch (error: any) {
      alert(`Gagal mengimpor data: ${error.message}`);
      console.error(error);
    } finally {
      setIsImporting(false);
      setShowImportModal(false);
    }
  };

  const getBagianBadgeClass = (bagian: string) => {
    const b = (bagian || '').toLowerCase();
    if (b.includes('pengaduan') || b.includes('aduan')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (b.includes('pengawasan')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (b.includes('perizinan')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><LottieLoader size={150} text="MEMUAT REGISTER NOTA DINAS..." /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6 pb-20">
      
      {/* Header NeoBrutalism */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-md text-slate-900 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <Link 
            href="/arsip/persuratan" 
            className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-700 border border-slate-200 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 transition-all shrink-0"
            title="Kembali ke Hub Persuratan"
          >
            <ArrowLeft size={22} />
          </Link>
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-fuchsia-500 text-white flex items-center justify-center shadow-sm">
            <FileText size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">
                Buku Register Nota Dinas
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200">
                <Sparkles size={12} /> Auto Format
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
              Pusat pencatatan, penomoran terpadu, dan penerbitan template resmi Nota Dinas DLH Kab. Sragen.
            </p>
          </div>
        </div>
        
        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-3 relative z-10">
          <button 
            onClick={() => setShowImportModal(true)} 
            className="bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 shadow-sm transition-all flex items-center gap-2 uppercase tracking-wider"
          >
            <Upload size={16} /> Import
          </button>

          <button 
            onClick={handleExportExcel} 
            className="bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 shadow-sm transition-all flex items-center gap-2 uppercase tracking-wider"
          >
            <Download size={16} /> Export
          </button>

          <Link 
            href="/arsip/nota-dinas/tambah" 
            className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 uppercase tracking-wider"
          >
            <Plus size={16} /> Buat Nota Dinas
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Cari perihal, nomor nota dinas, pemohon, atau keterangan..." 
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl pl-10 pr-4 py-2.5 focus:bg-white focus:border-fuchsia-500 transition-all outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Filter Bagian */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Building2 size={16} />
            </div>
            <select 
              value={filterBagian}
              onChange={e => { setFilterBagian(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold uppercase rounded-xl pl-9 pr-8 py-2.5 focus:bg-white focus:border-fuchsia-500 transition-all outline-none cursor-pointer appearance-none"
            >
              <option value="Semua">Semua Bagian</option>
              <option value="Pengaduan">Pengaduan</option>
              <option value="Pengawasan">Pengawasan</option>
              <option value="Perizinan">Perizinan</option>
              <option value="Umum">Umum / Sekretariat</option>
            </select>
          </div>

          {/* Filter Tahun */}
          <div className="relative w-full md:w-40">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Calendar size={16} />
            </div>
            <select 
              value={selectedYear}
              onChange={e => { setSelectedYear(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold uppercase rounded-xl pl-9 pr-8 py-2.5 focus:bg-white focus:border-fuchsia-500 transition-all outline-none cursor-pointer appearance-none"
            >
              <option value="Semua">Semua Tahun</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Result Stat */}
        <div className="text-xs font-bold text-slate-500 whitespace-nowrap px-3 py-2 bg-slate-100 rounded-xl">
          Total: <span className="text-slate-900">{filteredDocs.length}</span> Arsip
        </div>
      </div>

      {/* Dynamic Data Table */}
      <div className="bg-white border border-slate-200 shadow-md rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <th className="px-5 py-4 w-14 text-center">No</th>
                <th className="px-5 py-4 min-w-[140px]">Tanggal</th>
                <th className="px-5 py-4 min-w-[200px]">Nomor Nota Dinas</th>
                <th className="px-5 py-4 min-w-[130px]">Bagian</th>
                <th className="px-5 py-4 min-w-[260px]">Perihal / Isi Ringkas</th>
                <th className="px-5 py-4 min-w-[180px]">Pemohon</th>
                <th className="px-5 py-4 min-w-[120px] text-center">Berkas Lampiran</th>
                <th className="px-5 py-4 min-w-[100px] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedDocs.length > 0 ? (
                paginatedDocs.map((d, index) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <tr key={d.id} className="hover:bg-fuchsia-50/30 transition-colors">
                      <td className="px-5 py-4 text-center font-bold text-slate-400 text-xs">
                        {globalIndex}
                      </td>

                      <td className="px-5 py-4 text-slate-600 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <Calendar size={13} className="text-slate-400" />
                          {d.tanggal_nota || '-'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-md">
                          {d.nomor_otomatis || '-'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${getBagianBadgeClass(d.dari_bagian)}`}>
                          {d.dari_bagian || 'Umum'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900 leading-snug line-clamp-2">
                          {d.nama_nota || '-'}
                        </p>
                        {d.keterangan && (
                          <p className="text-xs text-slate-500 mt-1 italic line-clamp-1">
                            Ket: {d.keterangan}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {d.pemohon ? (
                          <div>
                            <p className="font-bold text-slate-900 text-xs uppercase">{d.pemohon.nama}</p>
                            {d.pemohon.jabatan && (
                              <p className="text-[11px] text-slate-500 leading-tight">{d.pemohon.jabatan}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Tanpa Pemohon</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        {d.file_url ? (
                          <a 
                            href={resolveFileUrl(d.file_url)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 rounded-lg text-xs font-bold hover:bg-fuchsia-100 transition-colors"
                            title="Buka Dokumen Nota Dinas"
                          >
                            <ExternalLink size={12} /> Buka File
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setUploadModalDoc(d)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-600 hover:text-fuchsia-700 border border-slate-200 hover:border-fuchsia-200 rounded-lg text-xs font-medium hover:bg-fuchsia-50/50 transition-colors"
                            title="Unggah berkas untuk nota dinas ini"
                          >
                            <Upload size={12} /> Unggah
                          </button>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button 
                          onClick={() => handleDelete(d.id)}
                          disabled={deletingId === d.id}
                          className="px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                          title="Hapus Nota Dinas"
                        >
                          <Trash2 size={13} />
                          <span>Hapus</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-500 bg-white">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <FileText size={28} />
                      </div>
                      <p className="font-bold text-sm text-slate-700 uppercase tracking-wider">
                        Tidak ada register nota dinas yang cocok.
                      </p>
                      <p className="text-xs text-slate-400">
                        Coba sesuaikan kata kunci pencarian, filter bagian, atau tahun.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-slate-50 border-t border-slate-200 p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-600 uppercase">
              Menampilkan {paginatedDocs.length} dari {filteredDocs.length} nota dinas (Halaman {currentPage} dari {totalPages})
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase shadow-sm hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-all"
              >
                Sebelumnya
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-fuchsia-600 text-white rounded-xl text-xs font-bold uppercase shadow-sm hover:bg-fuchsia-700 disabled:opacity-40 disabled:hover:bg-fuchsia-600 transition-all"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Unggah Berkas Susulan */}
      {uploadModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-md w-full animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-100 text-fuchsia-700 flex items-center justify-center">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase">Unggah Berkas Nota Dinas</h3>
                  <p className="text-xs text-slate-500 font-mono">{uploadModalDoc.nomor_otomatis}</p>
                </div>
              </div>
              <button 
                onClick={() => setUploadModalDoc(null)} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 line-clamp-2">
              <strong>Perihal:</strong> {uploadModalDoc.nama_nota}
            </p>

            <form onSubmit={handleUploadSusulan} className="space-y-4">
              <label className="block w-full border-2 border-dashed border-slate-300 hover:border-fuchsia-500 rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50/50 transition-all">
                <input 
                  type="file" 
                  accept=".pdf, .docx, .doc, .jpg, .png" 
                  className="hidden" 
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  disabled={isUploadingFile}
                  required
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="text-fuchsia-500" size={28} />
                  <span className="text-xs font-bold text-slate-700">
                    {uploadFile ? uploadFile.name : 'Pilih Berkas Lampiran / PDF'}
                  </span>
                  <span className="text-[11px] text-slate-400">PDF, DOCX, atau Gambar</span>
                </div>
              </label>

              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setUploadModalDoc(null)}
                  disabled={isUploadingFile}
                  className="w-1/2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isUploadingFile || !uploadFile}
                  className="w-1/2 px-4 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isUploadingFile ? <LottieLoader size={16} /> : <Upload size={14} />}
                  <span>Unggah</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-md w-full animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 uppercase">Import Data Excel</h3>
                  <p className="text-xs text-slate-500 font-medium">Buku Register Nota Dinas</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5 text-xs text-slate-600 leading-relaxed">
              Pastikan kolom file Excel memuat: <strong className="text-slate-800">Nama Nota Dinas / Perihal, Tanggal, Bagian, Nomor Otomatis</strong>.
            </div>
            
            <div className="space-y-4">
              <label className="block w-full border-2 border-dashed border-slate-300 hover:border-fuchsia-500 rounded-2xl p-8 text-center cursor-pointer hover:bg-slate-50/50 transition-all">
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  disabled={isImporting}
                />
                {isImporting ? (
                  <div className="flex flex-col items-center gap-3">
                    <LottieLoader size={30} />
                    <span className="text-xs font-bold text-slate-700 uppercase">Mengimpor Berkas...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="text-fuchsia-500" size={32} />
                    <span className="text-xs font-bold text-slate-700 uppercase">Pilih Berkas Excel</span>
                    <span className="text-[11px] text-slate-400">Format .xlsx atau .xls</span>
                  </div>
                )}
              </label>

              <button 
                onClick={() => setShowImportModal(false)}
                disabled={isImporting}
                className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase transition-all disabled:opacity-50"
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
