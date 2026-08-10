'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarPlus, Calendar, Archive, Map, ShieldCheck, Zap, Plus, Factory, Building2, Home, ShoppingCart, Database, User, FileText } from "lucide-react";

export default function PengawasanHub() {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch('/api/pengawasan?type=arsip')
      .then(res => res.json())
      .then(res => {
        if (res.data) setTotal(res.data.length);
      })
      .catch(err => console.error(err));
  }, []);

  const menus = [
    {
      title: "AGENDA AKTIF",
      icon: <Calendar size={20} strokeWidth={2.5} />,
      link: "/pengawasan/agenda",
      iconBg: "bg-amber-100",
      iconText: "text-amber-700",
    },
    {
      title: "DATABASE SASARAN",
      icon: <Database size={20} strokeWidth={2.5} />,
      link: "/pengawasan/database",
      iconBg: "bg-teal-100",
      iconText: "text-teal-700",
    },
    {
      title: "ARSIP PENGAWASAN",
      icon: <Archive size={20} strokeWidth={2.5} />,
      link: "/pengawasan/arsip",
      iconBg: "bg-indigo-100",
      iconText: "text-indigo-700",
    },
    {
      title: "VERIFIKASI TOKEN",
      icon: <ShieldCheck size={20} strokeWidth={2.5} />,
      link: "/pengawasan/token",
      iconBg: "bg-rose-100",
      iconText: "text-rose-700",
    },
    {
      title: "NOTA DINAS PENGAWASAN",
      icon: <FileText size={20} strokeWidth={2.5} />,
      link: "/pengawasan/nota-dinas",
      iconBg: "bg-fuchsia-100",
      iconText: "text-fuchsia-700",
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER CARD */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-lg relative overflow-hidden">
          {/* Decorative Circle */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full border border-slate-200 opacity-50"></div>
          
          <div className="flex flex-col md:flex-row gap-5 items-start relative z-10">
            <Link href="/" className="w-16 h-16 shrink-0 bg-indigo-500 text-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-md hover:bg-indigo-600 hover:-translate-y-1 hover:shadow-md transition-all">
              <ArrowLeft size={32} />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Dashboard Pengawasan</h1>
              <p className="text-sm font-bold text-slate-600 mt-2 tracking-wide">Pemantauan ketaatan lingkungan hidup fasyankes dan industri.</p>
              
              <div className="flex flex-wrap gap-3 mt-6">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-slate-900 font-black text-sm uppercase tracking-widest border-[3px] border-slate-200 rounded-xl shadow-md">
                  <Zap size={18} className="text-emerald-500" /> Total {total} Dokumen
                </div>
                <Link href="/pengawasan/buat-agenda" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-sm uppercase tracking-widest border-[3px] border-slate-200 rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <Plus size={18} /> Agenda Baru
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* MENU GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menus.map((menu, idx) => (
            <Link 
              href={menu.link} 
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-5 shadow-md hover:-translate-y-1 hover:shadow-md transition-all group"
            >
              <div className={`w-12 h-12 shrink-0 rounded-xl ${menu.iconBg} ${menu.iconText} border-[3px] border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                {menu.icon}
              </div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest">{menu.title}</h2>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
