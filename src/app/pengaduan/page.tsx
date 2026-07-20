'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, ArrowLeft, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';

export default function PengaduanListPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pengaduan')
      .then(res => res.json())
      .then(res => {
        setData(res.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8 px-4">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-900 font-black transition-all bg-white border-2 border-slate-900 px-4 py-2 rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Beranda
      </Link>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] flex-1 w-full">
          <div className="w-14 h-14 rounded-xl bg-purple-400 border-2 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a] shrink-0">
            <AlertTriangle size={28} className="text-slate-900" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight uppercase">Daftar Pengaduan</h2>
            <p className="text-sm font-bold text-slate-600 mt-1 uppercase">Rekap Data & Dokumentasi Aduan</p>
          </div>
        </div>

        <Link href="/pengaduan/tambah" className="w-full md:w-auto px-8 py-6 bg-slate-900 text-white font-black rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[10px_10px_0_0_#0f172a] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm shrink-0 whitespace-nowrap group">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={20} className="text-white" />
          </div>
          Catat Pengaduan
        </Link>
      </div>

      <div className="bg-white border-4 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0_0_#0f172a]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-4 border-slate-900">
                <th className="p-4 text-xs font-black text-slate-900 uppercase tracking-widest border-r-2 border-slate-200">No</th>
                <th className="p-4 text-xs font-black text-slate-900 uppercase tracking-widest border-r-2 border-slate-200">Perihal / Nama Kegiatan</th>
                <th className="p-4 text-xs font-black text-slate-900 uppercase tracking-widest border-r-2 border-slate-200">Tanggal</th>
                <th className="p-4 text-xs font-black text-slate-900 uppercase tracking-widest">Lampiran GDrive</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-slate-900" />
                    Memuat data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest border-b-2 border-slate-100">
                    Belum ada data pengaduan.
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={item.id} className="border-b-2 border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm font-black text-slate-900 border-r-2 border-slate-100">{index + 1}</td>
                    <td className="p-4 text-sm font-bold text-slate-900 border-r-2 border-slate-100">
                      {item.perihal}
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-600 border-r-2 border-slate-100 whitespace-nowrap">
                      {item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                    </td>
                    <td className="p-4 text-xs font-black text-slate-600 space-y-2 whitespace-nowrap">
                      {item.dokumentasi_url ? (
                        <a href={item.dokumentasi_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-purple-600 hover:text-purple-800 bg-purple-50 px-3 py-2 rounded-lg border-2 border-purple-200 hover:border-purple-600 transition-colors">
                          <ExternalLink size={14} /> Lihat Dokumentasi
                        </a>
                      ) : (
                        <div className="text-slate-400 bg-slate-50 px-3 py-2 rounded-lg border-2 border-slate-200">Tidak ada dokumentasi</div>
                      )}
                      
                      {item.ba_url ? (
                        <a href={item.ba_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-lg border-2 border-blue-200 hover:border-blue-600 transition-colors">
                          <ExternalLink size={14} /> Lihat Berita Acara
                        </a>
                      ) : (
                        <div className="text-slate-400 bg-slate-50 px-3 py-2 rounded-lg border-2 border-slate-200">Tidak ada BA</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
