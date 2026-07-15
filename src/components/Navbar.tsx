'use client';

import Link from 'next/link'
import { LayoutDashboard, ShieldCheck, Map, Settings, LogOut } from 'lucide-react'
import { handleLogout } from '@/app/login/actions'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname();

  if (pathname === '/login') {
    return null;
  }

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] rounded-2xl px-6 py-3 flex items-center gap-8 w-max max-w-[90vw] overflow-x-auto">
      <Link href="/" className="font-black text-xl text-slate-900 tracking-tight flex items-center gap-2">
        <span className="bg-emerald-400 text-slate-900 px-2 py-0.5 border-2 border-slate-900 rounded-lg shadow-[2px_2px_0_0_#0f172a]">BIDI</span> 
        DLH
      </Link>
      <div className="h-6 w-1 bg-slate-900 rounded-full"></div>
      <ul className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm font-black text-slate-700 uppercase tracking-widest">
        <li>
          <Link href="/perizinan/daftar" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-amber-100 hover:text-slate-900 hover:shadow-[2px_2px_0_0_#0f172a] hover:border-slate-900 border-2 border-transparent transition-all">
            <LayoutDashboard size={18} />
            <span className="hidden sm:inline">Perizinan</span>
          </Link>
        </li>
        <li>
          <Link href="/pengawasan" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-100 hover:text-slate-900 hover:shadow-[2px_2px_0_0_#0f172a] hover:border-slate-900 border-2 border-transparent transition-all">
            <ShieldCheck size={18} />
            <span className="hidden sm:inline">Pengawasan</span>
          </Link>
        </li>
        <li>
          <Link href="/peta" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-blue-100 hover:text-slate-900 hover:shadow-[2px_2px_0_0_#0f172a] hover:border-slate-900 border-2 border-transparent transition-all">
            <Map size={18} />
            <span className="hidden md:inline">Peta Lokasi</span>
          </Link>
        </li>
      </ul>
      <div className="h-6 w-1 bg-slate-900 rounded-full hidden sm:block"></div>
      <Link href="/pengaturan/tim-penilai" className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] transition-all" title="Pengaturan Tim Penilai">
        <Settings size={18} className="text-slate-900" />
      </Link>
      
      <form action={handleLogout} className="hidden sm:block">
        <button type="submit" className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-300 hover:bg-rose-400 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] transition-all" title="Keluar (Logout)">
          <LogOut size={18} className="text-slate-900" />
        </button>
      </form>
    </nav>
  )
}

