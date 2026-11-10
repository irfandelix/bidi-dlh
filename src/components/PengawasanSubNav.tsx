'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Database, 
  Archive, 
  FileText, 
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';

export default function PengawasanSubNav() {
  const pathname = usePathname();

  const isHub = pathname === '/pengawasan';
  const isAgenda = pathname === '/pengawasan/agenda';
  const isDatabase = pathname.startsWith('/pengawasan/database');
  const isArsip = pathname.startsWith('/pengawasan/arsip');
  const isNotaDinas = pathname === '/pengawasan/nota-dinas';
  const isToken = pathname === '/pengawasan/token';

  const navItems = [
    {
      href: '/pengawasan/agenda',
      label: 'Agenda Aktif',
      icon: Calendar,
      isActive: isAgenda,
      iconColor: 'text-amber-600',
      activeStyle: 'bg-amber-50 text-amber-900 border-amber-300 shadow-sm font-black ring-1 ring-amber-200'
    },
    {
      href: '/pengawasan/database',
      label: 'Database Sasaran',
      icon: Database,
      isActive: isDatabase,
      iconColor: 'text-teal-600',
      activeStyle: 'bg-teal-50 text-teal-900 border-teal-300 shadow-sm font-black ring-1 ring-teal-200'
    },
    {
      href: '/pengawasan/arsip',
      label: 'Arsip BAP',
      icon: Archive,
      isActive: isArsip,
      iconColor: 'text-indigo-600',
      activeStyle: 'bg-indigo-50 text-indigo-900 border-indigo-300 shadow-sm font-black ring-1 ring-indigo-200'
    },
    {
      href: '/pengawasan/nota-dinas',
      label: 'Nota Dinas',
      icon: FileText,
      isActive: isNotaDinas,
      iconColor: 'text-fuchsia-600',
      activeStyle: 'bg-fuchsia-50 text-fuchsia-900 border-fuchsia-300 shadow-sm font-black ring-1 ring-fuchsia-200'
    },
    {
      href: '/pengawasan/token',
      label: 'Verifikasi Token',
      icon: ShieldCheck,
      isActive: isToken,
      iconColor: 'text-rose-600',
      activeStyle: 'bg-rose-50 text-rose-900 border-rose-300 shadow-sm font-black ring-1 ring-rose-200'
    }
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 w-full">
      {/* Sisi Kiri: Tombol Kembali ke Beranda & Hub */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-800 font-bold transition-all bg-white border border-slate-200 px-3.5 sm:px-4 py-2 rounded-xl shadow-xs hover:shadow-md hover:-translate-y-0.5 uppercase tracking-wide shrink-0"
        >
          <ArrowLeft size={16} /> KEMBALI KE BERANDA
        </Link>

        {!isHub && (
          <Link
            href="/pengawasan"
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-bold bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-xs hover:shadow-sm transition-all uppercase tracking-wider shrink-0"
            title="Buka Hub Pengawasan Utama"
          >
            <LayoutDashboard size={14} className="text-teal-600" />
            <span>Hub Pengawasan</span>
          </Link>
        )}
      </div>

      {/* Sisi Kanan: Quick Links Sub-Modul Pengawasan */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar max-w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                item.isActive 
                  ? item.activeStyle 
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs hover:-translate-y-0.5'
              }`}
            >
              <Icon size={14} className={item.isActive ? '' : item.iconColor} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
