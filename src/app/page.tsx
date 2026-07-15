'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck, Activity, CheckCircle, Clock, RotateCcw, AlertTriangle, ChevronRight, BarChart3, Database, Calendar as CalendarIcon, Phone, FileSignature } from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState({
    total: 0,
    selesai: 0,
    proses: 0,
    ditolak: 0
  });
  
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simple calendar logic
  const today = new Date();
  const currentMonth = today.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blankDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  useEffect(() => {
    fetch('/api/perizinan')
      .then(res => res.json())
      .then(res => {
        const data = res.data || [];
        
        let total = data.length;
        let selesai = 0;
        let proses = 0;
        let ditolak = 0;

        data.forEach((doc: any) => {
          const s = doc.status_tahapan;
          if (['Selesai / SK', 'Menunggu Jilidan', 'Diarsipkan'].includes(s)) selesai++;
          else if (['Dikembalikan / Ditolak'].includes(s)) ditolak++;
          else proses++;
        });

        setStats({ total, selesai, proses, ditolak });
        setRecentDocs(data.slice(0, 4));
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load dashboard data", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 mt-4 px-4">
      
      {/* HEADER SECTION (Light Neobrutalism) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white border-4 border-slate-900 p-8 rounded-[2rem] shadow-[8px_8px_0_0_#0f172a] relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-400 rounded-full border-4 border-slate-900 opacity-20"></div>
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-400 rounded-full border-4 border-slate-900 opacity-20"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 border-2 border-slate-900 text-slate-900 text-xs font-black uppercase tracking-widest rounded-lg mb-4 shadow-[2px_2px_0_0_#0f172a]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Sistem Aktif
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 mb-2 drop-shadow-sm">
            BIDI <span className="text-emerald-600">DLH</span>
          </h1>
          <p className="text-slate-600 text-sm font-bold tracking-wide max-w-lg mt-4">
            Sistem Informasi Pelayanan Perizinan & Pengawasan Lingkungan Hidup. Memantau 13 tahapan alur secara Real-Time.
          </p>
        </div>
        
        <div className="flex gap-3 relative z-10 w-full md:w-auto mt-6 md:mt-0">
          <Link href="/perizinan/daftar" className="flex-1 md:flex-none px-6 py-4 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black uppercase tracking-widest text-xs rounded-2xl shadow-[4px_4px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] hover:translate-y-1 transition-all border-2 border-slate-900 flex items-center justify-center gap-2">
            <FileText size={18} /> Buka Papan Kanban
          </Link>
          <Link href="/perizinan/create" className="px-5 py-4 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black rounded-2xl shadow-[4px_4px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] hover:translate-y-1 transition-all border-2 border-slate-900 flex items-center justify-center" title="Registrasi Baru">
            <span className="sr-only">Registrasi Baru</span>
            <div className="text-2xl leading-none font-black">+</div>
          </Link>
        </div>
      </div>

      {/* STATISTIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border-2 border-slate-900 p-6 rounded-2xl shadow-[4px_4px_0_0_#0f172a] relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 bg-blue-100 border-2 border-slate-900 rounded-xl flex items-center justify-center text-blue-600 mb-4 shadow-[2px_2px_0_0_#0f172a]">
            <Database size={24} />
          </div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Total Permohonan</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-black text-slate-900">{loading ? '...' : stats.total}</h3>
            <span className="text-slate-500 text-sm font-bold mb-1">Dok.</span>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-900 p-6 rounded-2xl shadow-[4px_4px_0_0_#0f172a] relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 bg-amber-100 border-2 border-slate-900 rounded-xl flex items-center justify-center text-amber-600 mb-4 shadow-[2px_2px_0_0_#0f172a]">
            <Clock size={24} />
          </div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Sedang Proses</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-black text-slate-900">{loading ? '...' : stats.proses}</h3>
            <span className="text-slate-500 text-sm font-bold mb-1">Dok.</span>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-900 p-6 rounded-2xl shadow-[4px_4px_0_0_#0f172a] relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 bg-emerald-100 border-2 border-slate-900 rounded-xl flex items-center justify-center text-emerald-600 mb-4 shadow-[2px_2px_0_0_#0f172a]">
            <CheckCircle size={24} />
          </div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Selesai / SK</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-black text-slate-900">{loading ? '...' : stats.selesai}</h3>
            <span className="text-slate-500 text-sm font-bold mb-1">Dok.</span>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-900 p-6 rounded-2xl shadow-[4px_4px_0_0_#0f172a] relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 bg-rose-100 border-2 border-slate-900 rounded-xl flex items-center justify-center text-rose-600 mb-4 shadow-[2px_2px_0_0_#0f172a]">
            <AlertTriangle size={24} />
          </div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Ditolak / Batal</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-black text-slate-900">{loading ? '...' : stats.ditolak}</h3>
            <span className="text-slate-500 text-sm font-bold mb-1">Dok.</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* RECENT ACTIVITIES & CALENDAR (Left Col) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Recent Docs */}
          <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-[6px_6px_0_0_#0f172a] overflow-hidden flex flex-col">
            <div className="p-6 border-b-2 border-slate-900 flex justify-between items-center bg-blue-50">
              <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide text-sm">
                <Activity size={20} className="text-blue-600" /> Aktivitas Terbaru
              </h3>
              <Link href="/perizinan/daftar" className="text-xs font-black text-blue-600 hover:text-blue-800 flex items-center">
                LIHAT SEMUA <ChevronRight size={16} />
              </Link>
            </div>
            <div className="p-4 flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-48 text-slate-500 font-bold">Memuat data...</div>
              ) : recentDocs.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-500 font-black uppercase tracking-widest text-sm border-2 border-dashed border-slate-200 rounded-xl m-2">Belum ada data dokumen</div>
              ) : (
                <div className="space-y-3">
                  {recentDocs.map((doc, i) => (
                    <div key={i} className="group p-4 bg-slate-50 hover:bg-emerald-50 rounded-xl transition-colors flex items-center justify-between gap-4 border-2 border-slate-200 hover:border-slate-900 cursor-pointer shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center text-slate-900 font-black text-sm shadow-[2px_2px_0_0_#0f172a]">
                          #{doc.no_urut || doc.id}
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900 line-clamp-1">{doc.nama_kegiatan}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black uppercase text-white bg-slate-800 px-2 py-0.5 rounded-md tracking-wider">{doc.jenis_dokumen}</span>
                            <span className="text-[11px] font-bold text-slate-600 tracking-wide">{doc.nama_pemrakarsa}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1.5 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a]">
                          {doc.status_tahapan || 'Antrean'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Calendar Widget */}
          <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-[6px_6px_0_0_#0f172a] overflow-hidden">
             <div className="p-6 border-b-2 border-slate-900 flex justify-between items-center bg-amber-50">
              <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide text-sm">
                <CalendarIcon size={20} className="text-amber-600" /> Kalender Kerja ({currentMonth})
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-7 gap-2 text-center mb-4">
                {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((day, i) => (
                  <div key={i} className={`font-black text-sm ${i === 0 ? 'text-rose-600' : 'text-slate-600'}`}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {blankDays.map((_, i) => (
                  <div key={`blank-${i}`} className="h-10"></div>
                ))}
                {daysArray.map((day) => {
                  const isToday = day === today.getDate();
                  return (
                    <div key={day} className={`h-10 flex items-center justify-center rounded-lg text-sm font-bold border-2 transition-all ${
                      isToday 
                        ? 'bg-amber-400 border-slate-900 text-slate-900 shadow-[2px_2px_0_0_#0f172a] scale-110' 
                        : 'bg-slate-50 border-transparent text-slate-700 hover:border-slate-300'
                    }`}>
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* QUICK MENUS & EQUIPMENT (Right Col) */}
        <div className="flex flex-col gap-6">
          <Link href="/perizinan/daftar" className="group bg-indigo-50 border-2 border-slate-900 rounded-2xl p-6 shadow-[6px_6px_0_0_#0f172a] hover:shadow-[3px_3px_0_0_#0f172a] relative overflow-hidden transition-all hover:-translate-y-1">
            <div className="bg-indigo-200 text-indigo-700 p-3 rounded-xl border-2 border-slate-900 w-max mb-4 shadow-[2px_2px_0_0_#0f172a] group-hover:scale-110 transition-transform">
              <FileSignature size={28} />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-wide">Pusat Perizinan</h2>
            <p className="text-slate-700 text-sm font-bold leading-relaxed">
              Manajemen 13 tahapan izin lingkungan, dari registrasi hingga arsip final.
            </p>
            <div className="absolute bottom-6 right-6 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all border-2 border-slate-900">
              <ArrowRight size={20} />
            </div>
          </Link>

          <Link href="/pengawasan" className="group bg-rose-50 border-2 border-slate-900 rounded-2xl p-6 shadow-[6px_6px_0_0_#0f172a] hover:shadow-[3px_3px_0_0_#0f172a] relative overflow-hidden transition-all hover:-translate-y-1">
            <div className="bg-rose-200 text-rose-700 p-3 rounded-xl border-2 border-slate-900 w-max mb-4 shadow-[2px_2px_0_0_#0f172a] group-hover:scale-110 transition-transform">
              <ShieldCheck size={28} />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-wide">Pengawasan</h2>
            <p className="text-slate-700 text-sm font-bold leading-relaxed">
              Monitoring, evaluasi, dan pelaporan tindak lanjut aktivitas lapangan perusahaan.
            </p>
            <div className="absolute bottom-6 right-6 w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center text-white opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all border-2 border-slate-900">
              <ArrowRight size={20} />
            </div>
          </Link>


        </div>

      </div>
    </div>
  );
}
