'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Award, 
  ShieldCheck, 
  MessageSquareWarning, 
  Users, 
  Store, 
  ArrowLeft,
  Settings,
  Sparkles
} from 'lucide-react';

interface PengaturanNavProps {
  title?: string;
  description?: string;
  badge?: string;
}

const NAV_ITEMS = [
  {
    href: '/pengaturan/tim-penilai',
    label: 'Tim Penilai',
    sub: 'Perizinan',
    icon: Award,
    color: 'emerald',
    activeClass: 'bg-emerald-600 text-white shadow-md shadow-emerald-200 border-emerald-600'
  },
  {
    href: '/pengaturan/tim-pengawas',
    label: 'Tim Pengawas',
    sub: 'Pengawasan',
    icon: ShieldCheck,
    color: 'teal',
    activeClass: 'bg-teal-600 text-white shadow-md shadow-teal-200 border-teal-600'
  },
  {
    href: '/pengaturan/tim-pengaduan',
    label: 'Tim Pengaduan',
    sub: 'Pengaduan',
    icon: MessageSquareWarning,
    color: 'rose',
    activeClass: 'bg-rose-600 text-white shadow-md shadow-rose-200 border-rose-600'
  },
  {
    href: '/pengaturan/anggota-bidang',
    label: 'Anggota Bidang',
    sub: 'Nota Dinas',
    icon: Users,
    color: 'amber',
    activeClass: 'bg-amber-500 text-white shadow-md shadow-amber-200 border-amber-500'
  },
  {
    href: '/pengaturan/petugas-mpp',
    label: 'Petugas MPP',
    sub: 'Piket MPP',
    icon: Store,
    color: 'purple',
    activeClass: 'bg-purple-600 text-white shadow-md shadow-purple-200 border-purple-600'
  }
];

export default function PengaturanNav({
  title = 'Pengaturan Master Data',
  description = 'Kelola personil, tim teknis, pengawas lapangan, dan anggota bidang terpadu DLH.',
  badge = 'Master Personil'
}: PengaturanNavProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Back */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link 
          href="/arsip" 
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl shadow-sm hover:shadow transition-all"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Arsip</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider rounded-lg border border-slate-200">
          <Settings size={12} className="text-slate-500" />
          <span>Panel Konfigurasi Sistem</span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm shrink-0">
            <Settings size={28} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-wider rounded-md mb-1.5">
              <Sparkles size={11} className="text-amber-500" />
              <span>{badge}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
              {title}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5 max-w-2xl">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation Menu (Horizontal Scroll on Mobile) */}
      <div className="bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border ${
                  isActive
                    ? item.activeClass
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-transparent hover:border-slate-200'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500'} />
                <div className="flex flex-col text-left">
                  <span>{item.label}</span>
                  <span className={`text-[9px] font-normal tracking-normal ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                    {item.sub}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
