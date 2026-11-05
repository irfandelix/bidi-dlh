'use client';

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { LayoutDashboard, ShieldCheck, Map, Settings, LogOut, MessageSquareWarning, Archive, PhoneCall, Award, Users, Store } from 'lucide-react'
import { handleLogout } from '@/app/login/actions'
import { usePathname } from 'next/navigation'
import BidiLogo from './BidiLogo'

export default function Navbar() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isKegiatanOpen, setIsKegiatanOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const kegiatanRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    setIsSettingsOpen(false);
    setIsKegiatanOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (kegiatanRef.current && !kegiatanRef.current.contains(event.target as Node)) {
        setIsKegiatanOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (pathname === '/login') {
    return null;
  }

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-200 shadow-md rounded-2xl px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4 w-max max-w-[95vw] overflow-visible">
      <div className=""><BidiLogo /></div>
      <div className="h-6 w-1 bg-slate-900 rounded-full"></div>
      <ul className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-black text-slate-700 uppercase tracking-widest ">
        {/* Kegiatan Dropdown - Only visible on smaller screens (below lg) */}
        <li ref={kegiatanRef} className="relative group block lg:hidden">
          <button
            type="button"
            onClick={() => setIsKegiatanOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-200 hover:text-slate-900 hover:shadow-sm hover:border-slate-200 border-2 border-transparent transition-all"
          >
            <LayoutDashboard size={18} />
            <span className="hidden sm:inline">KEGIATAN</span>
          </button>
          <div className={`absolute left-0 top-full pt-2 w-48 transition-all z-50 ${isKegiatanOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
            <div className="bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col overflow-hidden">
              <Link href="/perizinan/daftar" onClick={() => setIsKegiatanOpen(false)} className="px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 hover:bg-amber-100 border-b-2 border-slate-200 flex items-center gap-2">
                <LayoutDashboard size={16} /> Perizinan
              </Link>
              <Link href="/pengawasan" onClick={() => setIsKegiatanOpen(false)} className="px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 hover:bg-rose-100 border-b-2 border-slate-200 flex items-center gap-2">
                <ShieldCheck size={16} /> Pengawasan
              </Link>
              <Link href="/pengaduan" onClick={() => setIsKegiatanOpen(false)} className="px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 hover:bg-fuchsia-100 flex items-center gap-2">
                <MessageSquareWarning size={16} /> Pengaduan
              </Link>
            </div>
          </div>
        </li>

        {/* Individual Items - Only visible on large screens (lg and above) */}
        <li className="hidden lg:block ">
          <Link href="/perizinan/daftar" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-amber-100 hover:text-slate-900 hover:shadow-sm hover:border-slate-200 border-2 border-transparent transition-all">
            <LayoutDashboard size={18} />
            <span>Perizinan</span>
          </Link>
        </li>
        <li className="hidden lg:block ">
          <Link href="/pengawasan" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-100 hover:text-slate-900 hover:shadow-sm hover:border-slate-200 border-2 border-transparent transition-all">
            <ShieldCheck size={18} />
            <span>Pengawasan</span>
          </Link>
        </li>
        <li className="hidden lg:block ">
          <Link href="/pengaduan" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-fuchsia-100 hover:text-slate-900 hover:shadow-sm hover:border-slate-200 border-2 border-transparent transition-all">
            <MessageSquareWarning size={18} />
            <span>Pengaduan</span>
          </Link>
        </li>
        <li className="">
          <Link href="/peta" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-blue-100 hover:text-slate-900 hover:shadow-sm hover:border-slate-200 border-2 border-transparent transition-all">
            <Map size={18} />
            <span className="hidden md:inline">Peta Lokasi</span>
          </Link>
        </li>
        <li className="">
          <Link href="/arsip" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-200 hover:text-slate-900 hover:shadow-sm hover:border-slate-200 border-2 border-transparent transition-all">
            <Archive size={18} />
            <span className="hidden sm:inline">Arsip</span>
          </Link>
        </li>
      </ul>
      <div className="h-6 w-0.5 bg-slate-300 rounded-full block"></div>
      <div ref={settingsRef} className="relative group block">
        <button
          type="button"
          onClick={() => setIsSettingsOpen((prev) => !prev)}
          className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 shadow-sm transition-all"
          title="Pengaturan"
        >
          <Settings size={18} className="text-slate-900" />
        </button>
        <div className={`absolute right-0 top-full pt-2 w-52 transition-all z-50 ${isSettingsOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden p-1.5 space-y-0.5">
            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
              Pengaturan Master
            </div>
            <Link href="/pengaturan/tim-penilai" onClick={() => setIsSettingsOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors">
              <Award size={15} className="text-emerald-600 shrink-0" />
              <span>Tim Penilai</span>
            </Link>
            <Link href="/pengaturan/tim-pengawas" onClick={() => setIsSettingsOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors">
              <ShieldCheck size={15} className="text-teal-600 shrink-0" />
              <span>Tim Pengawas</span>
            </Link>
            <Link href="/pengaturan/tim-pengaduan" onClick={() => setIsSettingsOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors">
              <MessageSquareWarning size={15} className="text-rose-600 shrink-0" />
              <span>Tim Pengaduan</span>
            </Link>
            <Link href="/pengaturan/anggota-bidang" onClick={() => setIsSettingsOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors">
              <Users size={15} className="text-amber-600 shrink-0" />
              <span>Anggota Bidang</span>
            </Link>
            <Link href="/pengaturan/petugas-mpp" onClick={() => setIsSettingsOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors">
              <Store size={15} className="text-purple-600 shrink-0" />
              <span>Petugas MPP</span>
            </Link>
          </div>
        </div>
      </div>
      
      <form action={handleLogout} className="hidden sm:block">
        <button type="submit" className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-300 hover:bg-rose-400 border border-slate-200 shadow-sm transition-all" title="Keluar (Logout)">
          <LogOut size={18} className="text-slate-900" />
        </button>
      </form>
    </nav>
  )
}
