'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck, Activity, CheckCircle, Clock, RotateCcw, AlertTriangle, ChevronRight, BarChart3, Database, Calendar as CalendarIcon, Phone, FileSignature, MapPin, Building2, User, Printer } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import LottieLoader from '@/components/LottieLoader';

export default function Home() {
  const [stats, setStats] = useState({
    perizinan: { total: 0, selesai: 0, proses: 0, dikembalikan: 0, ditolak: 0 },
    pengawasan: { total: 0, taat: 0, kurang: 0, tidak: 0 },
    pengaduan: { total: 0, belum: 0, proses: 0, selesai: 0 }
  });
  
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [recentPengawasan, setRecentPengawasan] = useState<any[]>([]);
  const [recentAduan, setRecentAduan] = useState<any[]>([]);
  const [allPerizinan, setAllPerizinan] = useState<any[]>([]);
  const [allPengawasan, setAllPengawasan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<'perizinan'|'pengawasan'|'pengaduan'>('perizinan');
  const [modalData, setModalData] = useState<any[]>([]);

  const openModal = (title: string, type: 'perizinan'|'pengawasan'|'pengaduan', filterFn: (d: any) => boolean) => {
    setModalTitle(title);
    setModalType(type);
    if (type === 'perizinan') setModalData(allPerizinan.filter(filterFn));
    if (type === 'pengawasan') setModalData(allPengawasan.filter(filterFn));
    setIsModalOpen(true);
  };

  // Simple calendar logic
  const today = new Date();
  const currentMonth = today.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blankDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = createClient();
        
        const [perizinanRes, pengawasanRes] = await Promise.all([
          supabase.from('dokumens').select('*').order('created_at', { ascending: false }),
          supabase.from('pengawasan_lapangans').select('*').order('created_at', { ascending: false })
        ]);

        const pData: any[] = perizinanRes.data || [];
        const pSelesai = pData.filter(d => ['Selesai / SK', 'Menunggu Jilidan', 'Diarsipkan', 'Selesai'].includes(d.status_tahapan)).length;
        const pDikembalikan = pData.filter(d => ['DIKEMBALIKAN', 'Dikembalikan / Ditolak', 'Pengembalian BA', 'Pengembalian Revisi'].includes(d.status_tahapan)).length;
        const pDitolak = pData.filter(d => ['DITOLAK', 'BATAL', 'Ditolak', 'Batal'].includes(d.status_tahapan)).length;
        const pProses = pData.length - pSelesai - pDikembalikan - pDitolak;

        const gData: any[] = pengawasanRes.data || [];
        const gTaat = gData.filter(d => d.status_ketaatan === 'Taat').length;
        const gKurang = gData.filter(d => ['Kurang Taat', 'Taat Bersyarat'].includes(d.status_ketaatan)).length;
        const gTidak = gData.filter(d => d.status_ketaatan === 'Tidak Taat').length;

        setStats({
          perizinan: { total: pData.length, selesai: pSelesai, proses: pProses, dikembalikan: pDikembalikan, ditolak: pDitolak },
          pengawasan: { total: gData.length, taat: gTaat, kurang: gKurang, tidak: gTidak },
          pengaduan: { total: 0, belum: 0, proses: 0, selesai: 0 } // Mocked until API is ready
        });

        setAllPerizinan(pData);
        setAllPengawasan(gData);
        setRecentDocs(pData.slice(0, 4));
        setRecentPengawasan(gData.slice(0, 4));
        setRecentAduan([]); // Mocked until API is ready
        setLoading(false);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 mt-4 px-4">
      
      {/* HEADER SECTION (Light Neobrutalism) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white border border-slate-200 p-8 rounded-[2rem] shadow-lg relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-400 rounded-full border border-slate-200 opacity-20"></div>
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-400 rounded-full border border-slate-200 opacity-20"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 border border-slate-200 text-slate-900 text-xs font-black uppercase tracking-widest rounded-lg mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Sistem Aktif
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 mb-2 drop-shadow-sm">
            BIDI <span className="text-emerald-600">DLH</span>
          </h1>
          <p className="text-slate-600 text-sm font-bold tracking-wide max-w-lg mt-4">
            Sistem Informasi Pelayanan Perizinan & Pengawasan Lingkungan Hidup. Memantau seluruh tahapan dan evaluasi secara Real-Time.
          </p>
        </div>
      </div>

      {/* STATISTIC CARDS: PERIZINAN */}
      <div>
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm">
            <FileSignature size={18} />
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Data Perizinan</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div onClick={() => openModal('Total Permohonan', 'perizinan', () => true)} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-pointer block">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Total</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-slate-900">{loading ? '...' : stats.perizinan.total}</h3>
            </div>
          </div>
          <div onClick={() => openModal('Sedang Proses', 'perizinan', (d) => !['Selesai / SK', 'Menunggu Jilidan', 'Diarsipkan', 'DIKEMBALIKAN', 'Dikembalikan / Ditolak', 'Pengembalian BA', 'Pengembalian Revisi', 'DITOLAK', 'BATAL', 'Ditolak', 'Batal'].includes(d.status_tahapan))} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-pointer block">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Diproses</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-amber-600">{loading ? '...' : stats.perizinan.proses}</h3>
            </div>
          </div>
          <div onClick={() => openModal('Selesai / SK', 'perizinan', (d) => ['Selesai / SK', 'Menunggu Jilidan', 'Diarsipkan', 'Selesai'].includes(d.status_tahapan))} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-pointer block">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Selesai</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-emerald-600">{loading ? '...' : stats.perizinan.selesai}</h3>
            </div>
          </div>
          <div onClick={() => openModal('Dikembalikan', 'perizinan', (d) => ['DIKEMBALIKAN', 'Dikembalikan / Ditolak', 'Pengembalian BA', 'Pengembalian Revisi'].includes(d.status_tahapan))} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-pointer block">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Kembali</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-blue-600">{loading ? '...' : stats.perizinan.dikembalikan}</h3>
            </div>
          </div>
          <div onClick={() => openModal('Ditolak / Batal', 'perizinan', (d) => ['DITOLAK', 'BATAL', 'Ditolak', 'Batal'].includes(d.status_tahapan))} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-pointer block">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Ditolak</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-rose-600">{loading ? '...' : stats.perizinan.ditolak}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* STATISTIC CARDS: PENGAWASAN */}
      <div>
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-lg bg-rose-100 border border-slate-200 flex items-center justify-center text-rose-600 shadow-sm">
            <ShieldCheck size={18} />
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Data Pengawasan</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div onClick={() => openModal('Total Kegiatan Pengawasan', 'pengawasan', () => true)} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-pointer block">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Total Kegiatan</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-slate-900">{loading ? '...' : stats.pengawasan.total}</h3>
              <span className="text-slate-500 text-sm font-bold mb-1">Lap.</span>
            </div>
          </div>
          <div onClick={() => openModal('Pengawasan Taat', 'pengawasan', (d) => d.status_ketaatan === 'Taat')} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-pointer block">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Taat</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-emerald-600">{loading ? '...' : stats.pengawasan.taat}</h3>
              <span className="text-slate-500 text-sm font-bold mb-1">Lap.</span>
            </div>
          </div>
          <div onClick={() => openModal('Pengawasan Kurang Taat', 'pengawasan', (d) => ['Kurang Taat', 'Taat Bersyarat'].includes(d.status_ketaatan))} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-pointer block">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Kurang Taat</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-amber-600">{loading ? '...' : stats.pengawasan.kurang}</h3>
              <span className="text-slate-500 text-sm font-bold mb-1">Lap.</span>
            </div>
          </div>
          <div onClick={() => openModal('Pengawasan Tidak Taat', 'pengawasan', (d) => d.status_ketaatan === 'Tidak Taat')} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-pointer block">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Tidak Taat</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-rose-600">{loading ? '...' : stats.pengawasan.tidak}</h3>
              <span className="text-slate-500 text-sm font-bold mb-1">Lap.</span>
            </div>
          </div>
        </div>
      </div>

      {/* STATISTIC CARDS: ADUAN */}
      <div>
        <div className="flex items-center gap-3 mb-4 px-2 mt-8">
          <div className="w-8 h-8 rounded-lg bg-amber-100 border border-slate-200 flex items-center justify-center text-amber-600 shadow-sm">
            <AlertTriangle size={18} />
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Data Aduan</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div onClick={() => openModal('Total Aduan', 'pengaduan', () => true)} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-pointer block">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Total Aduan</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-slate-900">{loading ? '...' : stats.pengaduan.total}</h3>
              <span className="text-slate-500 text-sm font-bold mb-1">Lap.</span>
            </div>
          </div>
          <div onClick={() => openModal('Aduan Belum Diproses', 'pengaduan', (d) => d.status === 'Belum Diproses')} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-pointer block">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Belum Diproses</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-rose-600">{loading ? '...' : stats.pengaduan.belum}</h3>
              <span className="text-slate-500 text-sm font-bold mb-1">Lap.</span>
            </div>
          </div>
          <div onClick={() => openModal('Aduan Sedang Proses', 'pengaduan', (d) => d.status === 'Proses')} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-pointer block">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Sedang Proses</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-amber-600">{loading ? '...' : stats.pengaduan.proses}</h3>
              <span className="text-slate-500 text-sm font-bold mb-1">Lap.</span>
            </div>
          </div>
          <div onClick={() => openModal('Aduan Selesai', 'pengaduan', (d) => d.status === 'Selesai')} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-md relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-pointer block">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Selesai</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-emerald-600">{loading ? '...' : stats.pengaduan.selesai}</h3>
              <span className="text-slate-500 text-sm font-bold mb-1">Lap.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-12 mt-12">
        
        {/* RECENT ACTIVITIES (Split) */}
        <div>
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
              <Activity size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Aktivitas Terbaru</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Recent Perizinan */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b-2 border-slate-200 flex justify-between items-center bg-indigo-50">
                <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide text-xs">
                  <FileSignature size={16} className="text-indigo-600" /> Perizinan
                </h3>
                <Link href="/perizinan/daftar" className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center">
                  LIHAT SEMUA <ChevronRight size={14} />
                </Link>
              </div>
              <div className="p-4 flex-1 bg-slate-50">
                {loading ? (
                  <LottieLoader size={150} text="MEMUAT DATA..." />
                ) : recentDocs.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-slate-500 font-black uppercase tracking-widest text-[10px] border-2 border-dashed border-slate-200 rounded-xl m-2">Belum ada data dokumen</div>
                ) : (
                  <div className="space-y-3">
                    {recentDocs.map((doc, i) => (
                      <div key={i} className="group p-3 bg-white hover:bg-indigo-50 rounded-xl transition-colors flex flex-col gap-2 border border-slate-200 hover:border-slate-200 cursor-pointer shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-black text-slate-900 line-clamp-1 flex-1">{doc.nama_kegiatan}</h4>
                          <span className="shrink-0 text-[9px] font-black uppercase text-white bg-slate-800 px-2 py-0.5 rounded-md tracking-wider">#{doc.no_urut || doc.id}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-600 tracking-wide line-clamp-1 flex-1">{doc.nama_pemrakarsa}</span>
                          <span className="shrink-0 inline-block px-2 py-1 bg-white text-slate-900 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200 shadow-sm">
                            {doc.status_tahapan === 'Dikembalikan / Ditolak' ? 'DIKEMBALIKAN' : doc.status_tahapan || 'Antrean'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Pengawasan */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b-2 border-slate-200 flex justify-between items-center bg-rose-50">
                <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide text-xs">
                  <ShieldCheck size={16} className="text-rose-600" /> Pengawasan
                </h3>
                <Link href="/pengawasan" className="text-[10px] font-black text-rose-600 hover:text-rose-800 flex items-center">
                  LIHAT SEMUA <ChevronRight size={14} />
                </Link>
              </div>
              <div className="p-4 flex-1 bg-slate-50">
                {loading ? (
                  <LottieLoader size={150} text="MEMUAT DATA..." />
                ) : recentPengawasan.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-slate-500 font-black uppercase tracking-widest text-[10px] border-2 border-dashed border-slate-200 rounded-xl m-2">Belum ada data pengawasan</div>
                ) : (
                  <div className="space-y-3">
                    {recentPengawasan.map((doc, i) => {
                       let warnaB = 'text-slate-900';
                       if (doc.status_ketaatan === 'Taat') warnaB = 'text-emerald-600';
                       if (doc.status_ketaatan === 'Kurang Taat' || doc.status_ketaatan === 'Taat Bersyarat') warnaB = 'text-amber-600';
                       if (doc.status_ketaatan === 'Tidak Taat') warnaB = 'text-rose-600';

                       return (
                        <div key={i} className="group p-3 bg-white hover:bg-rose-50 rounded-xl transition-colors flex flex-col gap-2 border border-slate-200 hover:border-slate-200 cursor-pointer shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-black text-slate-900 line-clamp-1 flex-1">{doc.nama_kegiatan}</h4>
                            <span className="shrink-0 text-[9px] font-black uppercase text-white bg-slate-800 px-2 py-0.5 rounded-md tracking-wider">{doc.kategori || 'Umum'}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-slate-600 tracking-wide line-clamp-1 flex-1">{doc.nama_pemrakarsa}</span>
                            <span className={`shrink-0 inline-block px-2 py-1 bg-white ${warnaB} rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200 shadow-sm`}>
                              {doc.status_ketaatan || 'Belum Dinilai'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Pengaduan */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b-2 border-slate-200 flex justify-between items-center bg-amber-50">
                <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide text-xs">
                  <AlertTriangle size={16} className="text-amber-600" /> Pengaduan
                </h3>
                <Link href="/pengaduan" className="text-[10px] font-black text-amber-600 hover:text-amber-800 flex items-center">
                  LIHAT SEMUA <ChevronRight size={14} />
                </Link>
              </div>
              <div className="p-4 flex-1 bg-slate-50">
                {loading ? (
                  <LottieLoader size={150} text="MEMUAT DATA..." />
                ) : recentAduan.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-slate-500 font-black uppercase tracking-widest text-[10px] border-2 border-dashed border-slate-200 rounded-xl m-2">Belum ada data pengaduan</div>
                ) : (
                  <div className="space-y-3">
                    {recentAduan.map((doc, i) => (
                      <div key={i} className="group p-3 bg-white hover:bg-amber-50 rounded-xl transition-colors flex flex-col gap-2 border border-slate-200 hover:border-slate-200 cursor-pointer shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-black text-slate-900 line-clamp-1 flex-1">{doc.judul_aduan || 'Aduan Baru'}</h4>
                          <span className="shrink-0 text-[9px] font-black uppercase text-white bg-slate-800 px-2 py-0.5 rounded-md tracking-wider">#{doc.id}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-600 tracking-wide line-clamp-1 flex-1">{doc.nama_pelapor || 'Anonim'}</span>
                          <span className="shrink-0 inline-block px-2 py-1 bg-white text-slate-900 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200 shadow-sm">
                            {doc.status || 'Baru'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* CALENDAR (Bottom) */}
        <div>
          {/* Calendar Widget */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden w-full">
             <div className="p-6 border-b-2 border-slate-200 flex justify-between items-center bg-amber-50">
              <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide text-sm">
                <CalendarIcon size={20} className="text-amber-600" /> Kalender ({currentMonth})
              </h3>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-7 gap-4 text-center mb-6">
                {['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'].map((day, i) => (
                  <div key={i} className={`font-black text-lg ${i === 0 ? 'text-rose-600' : 'text-slate-600'}`}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-4">
                {blankDays.map((_, i) => (
                  <div key={`blank-${i}`} className="h-16"></div>
                ))}
                {daysArray.map((day) => {
                  const isToday = day === today.getDate();
                  return (
                    <div key={day} className={`h-16 flex items-center justify-center rounded-2xl text-lg font-bold border-4 transition-all ${
                      isToday 
                        ? 'bg-amber-400 border-slate-200 text-slate-900 shadow-md scale-110' 
                        : 'bg-slate-50 border-transparent text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                    }`}>
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal View for Lists */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border-4 border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b-4 border-slate-200 bg-indigo-50 flex justify-between items-center">
              <h3 className="font-black text-slate-900 text-lg uppercase tracking-wide flex items-center gap-2">
                <FileText size={20} className="text-indigo-600" /> {modalTitle}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-200 hover:bg-rose-200 hover:text-rose-700 flex items-center justify-center font-bold text-slate-600 transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-2 flex-1 overflow-y-auto bg-slate-50 space-y-2">
              {modalData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <div className="font-black text-4xl mb-2">0</div>
                  <div className="text-sm font-bold uppercase tracking-widest">Tidak Ada Data</div>
                </div>
              ) : (
                modalData.map((d, i) => (
                  <div key={i} className="group p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="shrink-0 text-[10px] font-black uppercase text-white bg-slate-800 px-2 py-0.5 rounded-md tracking-wider">
                          #{d.no_urut || d.id}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 uppercase">{d.nama_kegiatan || d.nama_usaha || d.nama_pelapor}</h4>
                      </div>
                      <p className="text-xs font-bold text-slate-500 uppercase">{d.nama_pemrakarsa || d.nama_penanggung_jawab || d.alamat}</p>
                    </div>
                    
                    <div className="shrink-0 text-right sm:text-left">
                      <span className="inline-block px-3 py-1 bg-slate-100 text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
                        {modalType === 'perizinan' ? d.status_tahapan : (modalType === 'pengawasan' ? d.status_ketaatan : d.status_aduan)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t-4 border-slate-200 bg-white flex justify-end">
              <Link 
                href={`/${modalType === 'perizinan' ? 'perizinan/daftar' : modalType}`} 
                className="px-6 py-2 bg-slate-900 text-white text-sm font-black rounded-xl hover:bg-indigo-600 transition-colors uppercase tracking-widest"
              >
                Lihat Selengkapnya
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
