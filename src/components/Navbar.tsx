'use client';

import Link from 'next/link'
import { LayoutDashboard, ShieldCheck, Map, Settings, LogOut, MessageSquareWarning, Archive } from 'lucide-react'
import { handleLogout } from '@/app/login/actions'
import { usePathname } from 'next/navigation'
import BidiLogo from './BidiLogo'

export default function Navbar() {
  const pathname = usePathname();

  if (pathname === '/login') {
    return null;
  }

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] rounded-2xl px-4 sm:px-6 py-3 flex items-center gap-4 sm:gap-6 w-max max-w-[95vw] overflow-x-auto sm:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <BidiLogo />
      <div className="h-6 w-1 bg-slate-900 rounded-full"></div>
      <ul className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm font-black text-slate-700 uppercase tracking-widest">
        {/* Kegiatan Dropdown - Only visible on smaller screens (below lg) */}
        <li className="relative group block lg:hidden">
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-200 hover:text-slate-900 hover:shadow-[2px_2px_0_0_#0f172a] hover:border-slate-900 border-2 border-transparent transition-all">
            <LayoutDashboard size={18} />
            <span className="hidden sm:inline">Kegiatan</span>
          </button>
          <div className="absolute left-0 top-full pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="bg-white border-4 border-slate-900 rounded-xl shadow-[4px_4px_0_0_#0f172a] flex flex-col overflow-hidden">
              <Link href="/perizinan/daftar" className="px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 hover:bg-amber-100 border-b-2 border-slate-200 flex items-center gap-2">
                <LayoutDashboard size={16} /> Perizinan
              </Link>
              <Link href="/pengawasan" className="px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 hover:bg-rose-100 border-b-2 border-slate-200 flex items-center gap-2">
                <ShieldCheck size={16} /> Pengawasan
              </Link>
              <Link href="/pengaduan" className="px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 hover:bg-fuchsia-100 flex items-center gap-2">
                <MessageSquareWarning size={16} /> Pengaduan
              </Link>
            </div>
          </div>
        </li>

        {/* Individual Items - Only visible on large screens (lg and above) */}
        <li className="hidden lg:block">
          <Link href="/perizinan/daftar" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-amber-100 hover:text-slate-900 hover:shadow-[2px_2px_0_0_#0f172a] hover:border-slate-900 border-2 border-transparent transition-all">
            <LayoutDashboard size={18} />
            <span>Perizinan</span>
          </Link>
        </li>
        <li className="hidden lg:block">
          <Link href="/pengawasan" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-100 hover:text-slate-900 hover:shadow-[2px_2px_0_0_#0f172a] hover:border-slate-900 border-2 border-transparent transition-all">
            <ShieldCheck size={18} />
            <span>Pengawasan</span>
          </Link>
        </li>
        <li className="hidden lg:block">
          <Link href="/pengaduan" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-fuchsia-100 hover:text-slate-900 hover:shadow-[2px_2px_0_0_#0f172a] hover:border-slate-900 border-2 border-transparent transition-all">
            <MessageSquareWarning size={18} />
            <span>Pengaduan</span>
          </Link>
        </li>
        <li>
          <Link href="/peta" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-blue-100 hover:text-slate-900 hover:shadow-[2px_2px_0_0_#0f172a] hover:border-slate-900 border-2 border-transparent transition-all">
            <Map size={18} />
            <span className="hidden md:inline">Peta Lokasi</span>
          </Link>
        </li>
        <li>
          <Link href="/arsip" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-200 hover:text-slate-900 hover:shadow-[2px_2px_0_0_#0f172a] hover:border-slate-900 border-2 border-transparent transition-all">
            <Archive size={18} />
            <span className="hidden sm:inline">Arsip</span>
          </Link>
        </li>
      </ul>
      <div className="h-6 w-1 bg-slate-900 rounded-full hidden sm:block"></div>
      <div className="relative group hidden sm:block">
        <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] transition-all" title="Pengaturan">
          <Settings size={18} className="text-slate-900" />
        </button>
        <div className="absolute right-0 top-full pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
          <div className="bg-white border-4 border-slate-900 rounded-xl shadow-[4px_4px_0_0_#0f172a] flex flex-col overflow-hidden">
            <Link href="/pengaturan/tim-penilai" className="px-4 py-3 text-sm font-bold text-slate-900 hover:bg-emerald-100 border-b-2 border-slate-200">
              Tim Penilai
            </Link>
            <Link href="/pengaturan/tim-pengawas" className="px-4 py-3 text-sm font-bold text-slate-900 hover:bg-emerald-100 border-b-2 border-slate-200">
              Tim Pengawas
            </Link>
            <Link href="/pengaturan/tim-pengaduan" className="px-4 py-3 text-sm font-bold text-slate-900 hover:bg-emerald-100">
              Tim Pengaduan
            </Link>
          </div>
        </div>
      </div>
      
      <form action={handleLogout} className="hidden sm:block">
        <button type="submit" className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-300 hover:bg-rose-400 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] transition-all" title="Keluar (Logout)">
          <LogOut size={18} className="text-slate-900" />
        </button>
      </form>
    </nav>
  )
}

