import React from 'react';
import { PhoneCall, MessageSquare, Settings2, ShieldCheck, Users } from 'lucide-react';

export default function HotlineDashboard() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <PhoneCall className="text-emerald-500" size={32} />
            Hotline WhatsApp
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Pusat kendali proxy WhatsApp antara Masyarakat, Admin, dan Ketua Tim.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Chat List */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <MessageSquare size={18} />
              Daftar Pesan Masuk
            </h2>
          </div>
          <div className="p-6 flex-1 flex flex-col items-center justify-center text-center text-slate-400">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">Belum ada obrolan ditarik dari Database.</p>
            <p className="text-xs mt-1">Jalankan bot WA Baileys untuk mulai menerima pesan.</p>
          </div>
        </div>

        {/* Right Column: Chat View & Transfer Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-slate-700">Detail Percakapan</h2>
            <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100 flex items-center gap-2 opacity-50 cursor-not-allowed">
              <ShieldCheck size={14} />
              Transfer ke Katim
            </button>
          </div>
          <div className="p-6 flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <p className="text-sm font-medium">Pilih obrolan di sebelah kiri untuk melihat detail.</p>
          </div>
        </div>

      </div>

      {/* Settings Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
          <Settings2 size={18} className="text-slate-600" />
          <h2 className="font-bold text-slate-700">Pengaturan Nomor Staff (Katim & Admin)</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-4 font-medium">
            Di sinilah Anda bisa menambah, mengedit, atau menghapus nomor WA para Katim dan Admin yang bertugas.
          </p>
          <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm font-medium border border-amber-100 flex items-center gap-3">
            <Users size={20} className="shrink-0" />
            Modul pengelolaan Katim sedang dibangun (Under Construction).
          </div>
        </div>
      </div>

    </div>
  );
}
