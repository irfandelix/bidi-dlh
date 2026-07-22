'use client';

import LottieLoader from '@/components/LottieLoader';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, Zap, Plus, FileText, MapPin, 
  ClipboardCheck, FileEdit, CheckCircle, History, 
  Printer, Kanban, CircleDashed, Archive, RotateCcw, Clock 
} from 'lucide-react';

type Dokumen = any; // Will use proper types later

export default function DaftarPerizinanPage() {
  const [docs, setDocs] = useState<Dokumen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/perizinan')
      .then(res => res.json())
      .then(res => {
        setDocs(res.data || []);
        setLoading(false);
      });
  }, []);

  const stats = {
    total: docs.length,
    ujiAdmin: docs.filter(d => d.status_tahapan === 'Registrasi').length,
    verlap: docs.filter(d => d.status_tahapan === 'Uji Administrasi Selesai').length,
    substansi: docs.filter(d => d.status_tahapan === 'Verlap Selesai').length,
    revisi: docs.filter(d => d.status_tahapan === 'Revisi').length,
    selesai: docs.filter(d => d.status_tahapan === 'Selesai').length,
  };

  const stages = [
    { id: 1, title: '1. Registrasi', shortTitle: 'Registrasi', statuses: ['Registrasi', 'PROSES'], color: 'slate', icon: FileText, link: '/perizinan/registrasi' },
    { id: 2, title: '2. Uji Admin', shortTitle: 'Uji Admin', statuses: ['Uji Administrasi'], color: 'teal', icon: ClipboardCheck, link: '/perizinan/uji-administrasi' },
    { id: 3, title: '3. Verlap', shortTitle: 'Verlap', statuses: ['Verifikasi Lapangan', 'Verlap Selesai', 'Uji Administrasi Selesai'], color: 'amber', icon: MapPin, link: '/perizinan/verifikasi-lapangan' },
    { id: 4, title: '4. Pemeriksaan', shortTitle: 'Pemeriksaan', statuses: ['Pemeriksaan Substansi', 'PEMERIKSAAN-SUBSTANSI', 'DIPERIKSA', 'Verlap Selesai', 'Uji Administrasi Selesai'], color: 'indigo', icon: FileText, link: '/perizinan/pemeriksaan-substansi' },
    { id: 5, title: '5. Pengembalian BA', shortTitle: 'Pengembalian', statuses: ['Pengembalian BA', 'Dikembalikan / Ditolak', 'DIKEMBALIKAN'], color: 'rose', icon: RotateCcw, link: '/perizinan/pengembalian' },
    { id: 6, title: '6. Terima Perbaikan', shortTitle: 'Terima BA', statuses: ['Penerimaan Perbaikan', 'Pengembalian BA', 'Dikembalikan / Ditolak', 'DIKEMBALIKAN'], color: 'emerald', icon: CheckCircle, link: '/perizinan/penerimaan-perbaikan' },
    { id: 7, title: '7. Pemeriksaan Revisi', shortTitle: 'Revisi', statuses: ['Pemeriksaan Revisi', 'Revisi', 'REVISI', 'Pemeriksaan Selesai', 'Penerimaan Perbaikan'], color: 'blue', icon: FileEdit, link: '/perizinan/pemeriksaan-revisi' },
    { id: 8, title: '8. Pengembalian Revisi', shortTitle: 'Kembali Revisi', statuses: ['Pengembalian Revisi'], color: 'rose', icon: RotateCcw, link: '/perizinan/pengembalian' },
    { id: 9, title: '9. Terima Revisi', shortTitle: 'Terima Revisi', statuses: ['Penerimaan Revisi', 'Revisi Lanjutan', 'Pengembalian Revisi'], color: 'emerald', icon: CheckCircle, link: '/perizinan/penerimaan-perbaikan' },
    { id: 10, title: '10. Finalisasi (RPD & SK)', shortTitle: 'Finalisasi', statuses: ['Penyerahan SK', 'Selesai / SK', 'Selesai', 'Revisi Selesai'], color: 'purple', icon: FileText, link: '/perizinan/finalisasi' },
    { id: 11, title: '11. Jilidan Final', shortTitle: 'Jilidan', statuses: ['Penerimaan Jilidan', 'Menunggu Jilidan'], color: 'orange', icon: FileText, link: '/perizinan/jilidan' },
    { id: 12, title: '12. Arsip', shortTitle: 'Arsip', statuses: ['Arsip', 'Diarsipkan', 'ARSIP', 'Jilidan Selesai'], color: 'slate', icon: Archive, link: '/perizinan/arsip' },
  ];

  const colorMap: Record<string, any> = {
    slate: { light: 'bg-slate-50', text: 'text-slate-700', solid: 'bg-slate-500', icon: 'text-slate-500', hover: 'hover:text-slate-600', cardBg: 'bg-slate-100', cardText: 'text-slate-600' },
    teal: { light: 'bg-teal-50', text: 'text-teal-700', solid: 'bg-teal-500', icon: 'text-teal-600', hover: 'hover:text-teal-600', cardBg: 'bg-teal-100', cardText: 'text-teal-600' },
    amber: { light: 'bg-amber-50', text: 'text-amber-700', solid: 'bg-amber-500', icon: 'text-amber-500', hover: 'hover:text-amber-600', cardBg: 'bg-amber-100', cardText: 'text-amber-600' },
    indigo: { light: 'bg-indigo-50', text: 'text-indigo-700', solid: 'bg-indigo-600', icon: 'text-indigo-600', hover: 'hover:text-indigo-600', cardBg: 'bg-indigo-100', cardText: 'text-indigo-600' },
    rose: { light: 'bg-rose-50', text: 'text-rose-700', solid: 'bg-rose-600', icon: 'text-rose-600', hover: 'hover:text-rose-600', cardBg: 'bg-rose-100', cardText: 'text-rose-600' },
    emerald: { light: 'bg-emerald-50', text: 'text-emerald-700', solid: 'bg-emerald-500', icon: 'text-emerald-500', hover: 'hover:text-emerald-600', cardBg: 'bg-emerald-100', cardText: 'text-emerald-600' },
    blue: { light: 'bg-blue-50', text: 'text-blue-700', solid: 'bg-blue-500', icon: 'text-blue-500', hover: 'hover:text-blue-600', cardBg: 'bg-blue-100', cardText: 'text-blue-600' },
    purple: { light: 'bg-purple-50', text: 'text-purple-700', solid: 'bg-purple-500', icon: 'text-purple-500', hover: 'hover:text-purple-600', cardBg: 'bg-purple-100', cardText: 'text-purple-600' },
    orange: { light: 'bg-orange-50', text: 'text-orange-700', solid: 'bg-orange-500', icon: 'text-orange-500', hover: 'hover:text-orange-600', cardBg: 'bg-orange-100', cardText: 'text-orange-600' },
  };

  const allStage = { id: 0, title: 'Semua Dokumen', shortTitle: 'Semua', statuses: [], color: 'slate', icon: LayoutDashboard, link: '' };
  const [activeStage, setActiveStage] = useState<any>(allStage);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (loading) {
    return <LottieLoader size={150} text="MEMUAT DATA..." />;
  }

  const getStageForStatus = (status: string) => {
    return stages.find(s => s.statuses.includes(status)) || stages[1]; // default to Uji Admin if not found
  };

  // Filter docs based on active stage
  const activeDocs = activeStage.id === 0 ? docs : docs.filter(d => {
    // Tampilkan semua dokumen di menu Arsip (ID 12) agar pemrakarsa bisa mencicil upload file arsip kapan saja
    if (activeStage.id === 12) return true;

    const currentStage = getStageForStatus(d.status_tahapan);
    // Jika dokumen sedang berada di tahap yang dipilih, tampilkan
    if (activeStage.statuses.includes(d.status_tahapan)) return true;
    
    // Jika dokumen SUDAH MELEWATI tahap yang dipilih (id tahap saat ini >= id tahap yang difilter)
    // Maka tetap tampilkan (misal: filter Uji Admin (2), dokumen di Pemeriksaan (4) -> tampilkan)
    if (currentStage.id >= activeStage.id) return true;

    return false;
  });

  
  // Pagination
  const totalPages = Math.ceil(activeDocs.length / itemsPerPage);
  const paginatedDocs = activeDocs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8 pb-20">
      
      {/* Header Neobrutalism Style (Light Variant) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] text-slate-900 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-200 rounded-full border-4 border-slate-900 opacity-30"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-indigo-400 border-2 border-slate-900 flex items-center justify-center text-slate-900 shadow-[4px_4px_0_0_#0f172a]">
            <LayoutDashboard size={28} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight">Dashboard Perizinan</h2>
            <p className="text-sm text-slate-600 font-bold mt-1">Ringkasan aktivitas dan pergerakan dokumen lingkungan hidup.</p>
          </div>
        </div>
        
        <div className="flex items-center flex-wrap gap-3 relative z-10">
          <div className="bg-emerald-50 px-5 py-3 rounded-xl border-2 border-slate-900 flex items-center gap-3 text-sm font-black text-slate-900 shadow-[4px_4px_0_0_#0f172a]">
            <Zap size={18} className="text-emerald-500 fill-emerald-500" />
            Total {stats.total} Dokumen
          </div>
          <Link href="/perizinan/registrasi" className="bg-indigo-400 hover:bg-indigo-300 hover:-translate-y-1 text-slate-900 px-5 py-3 rounded-xl text-sm font-black shadow-[4px_4px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] border-2 border-slate-900 transition-all flex items-center gap-2">
            <Plus size={18} /> Berkas Baru
          </Link>
        </div>
      </div>

      {/* 12 Stages Buttons (Light Neobrutalism) - Grid 3 Kolom */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stages.map((stage) => {
          const theme = colorMap[stage.color];
          const Icon = stage.icon;
          const isActive = activeStage.id === stage.id;

          if (stage.id === 1) {
            return (
              <Link 
                href={stage.link}
                key={stage.id} 
                className={`text-left p-4 rounded-xl border-2 border-slate-900 transition-all group flex items-center gap-4 cursor-pointer bg-white shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a]`}
              >
                <div className={`w-12 h-12 shrink-0 rounded-xl border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0_0_#0f172a] transition-transform ${theme.cardBg} ${theme.cardText} group-hover:scale-110`}>
                  <Icon size={20} />
                </div>
                <p className="text-sm font-black tracking-wide uppercase text-slate-800">
                  {stage.title}
                </p>
              </Link>
            );
          }

          return (
            <button 
              onClick={() => { setActiveStage(stage); setCurrentPage(1); }}
              key={stage.id} 
              className={`text-left p-4 rounded-xl border-2 border-slate-900 transition-all group flex items-center gap-4 cursor-pointer ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-[2px_2px_0_0_#0f172a] translate-y-1' 
                  : 'bg-white shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a]'
              }`}
            >
              <div className={`w-12 h-12 shrink-0 rounded-xl border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0_0_#0f172a] transition-transform ${
                isActive ? 'bg-white text-slate-900 scale-110' : `${theme.cardBg} ${theme.cardText} group-hover:scale-110`
              }`}>
                <Icon size={20} />
              </div>
              <p className={`text-sm font-black tracking-wide uppercase ${isActive ? 'text-white' : 'text-slate-800'}`}>
                {stage.title}
              </p>
            </button>
          );
        })}
      </div>

      {/* Dynamic Data Table (NeoBrutalism) */}
      <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] rounded-3xl overflow-hidden mt-8">
        <div className="bg-slate-100 border-b-4 border-slate-900 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0_0_#0f172a]">
              {(() => {
                const ActiveIcon = activeStage.icon;
                return <ActiveIcon size={20} className="text-slate-900" />;
              })()}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase">Daftar Dokumen: {activeStage.shortTitle}</h3>
              <p className="text-sm font-bold text-slate-500">{activeDocs.length} dokumen {activeStage.id === 0 ? 'keseluruhan' : 'dalam tahap ini'}</p>
            </div>
          </div>
          {activeStage.id !== 0 && (
            <button onClick={() => { setActiveStage(allStage); setCurrentPage(1); }} className="bg-slate-900 text-white px-4 py-2 rounded-xl border-2 border-slate-900 text-xs font-black uppercase shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all">
              Lihat Semua Dokumen
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b-4 border-slate-900">
              <tr>
                <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-900">NO URUT / THN</th>
                <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-900">Nama Kegiatan</th>
                <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-900">Pemrakarsa</th>
                <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs border-r-2 border-slate-900">Tanggal Masuk</th>
                <th className="px-6 py-4 font-black text-slate-900 uppercase text-xs text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-900">
              {activeDocs.length > 0 ? (
                paginatedDocs.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 border-r-2 border-slate-900">
                      <span className="bg-slate-200 text-slate-900 font-black px-2 py-1 rounded border-2 border-slate-900 text-xs shadow-[2px_2px_0_0_#0f172a]">
                        #{d.no_urut || d.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-r-2 border-slate-900">
                      <p className="font-bold text-slate-900 text-sm uppercase">{d.nama_kegiatan}</p>
                      <p className="text-xs font-bold text-slate-500">{d.jenis_dokumen}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm border-r-2 border-slate-900">
                      {d.nama_pemrakarsa}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm border-r-2 border-slate-900">
                      {d.tanggal_masuk_dokumen}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <Link 
                          href={activeStage.id !== 0 && activeStage.id !== 1 ? `${activeStage.link}/${d.id}` : `${getStageForStatus(d.status_tahapan).link}/${d.id}`}
                          className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 text-xs font-black px-4 py-2 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#0f172a] transition-all uppercase"
                        >
                          {activeStage.id !== 0 && activeStage.id !== 1 ? `Buka ${activeStage.shortTitle}` : 'Buka'}
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
                      <CircleDashed size={32} className="text-slate-300" />
                      <p>Tidak ada dokumen di tahap ini.</p>
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
