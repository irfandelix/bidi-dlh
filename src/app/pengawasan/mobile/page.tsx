'use client';

import React, { useState, useEffect } from 'react';
import FormBAP from './FormBAP';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

export default function MobileApp() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [agendaData, setAgendaData] = useState<any>(null);
  const [savedAgendas, setSavedAgendas] = useState<any[]>([]);

  const [screen, setScreen] = useState<'splash' | 'home' | 'login' | 'info' | 'form'>('splash');

  useEffect(() => {
    // Prevent iOS rubber banding white space issue
    document.body.style.backgroundColor = '#0f172a'; // slate-900
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.overscrollBehavior = '';
      document.documentElement.style.overscrollBehavior = '';
    };
  }, []);

  useEffect(() => {
    const initApp = async () => {
      await loadSavedAgendas();
      setTimeout(() => {
        setScreen('home');
      }, 2000);
    };
    initApp();
  }, []);

  const loadSavedAgendas = async () => {
    try {
      const stored = localStorage.getItem('@saved_agendas');
      if (stored) {
        setSavedAgendas(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading agendas', e);
    }
  };

  const removeSavedAgenda = async (idToRemove: string) => {
    try {
      const updated = savedAgendas.filter(a => a.id !== idToRemove);
      setSavedAgendas(updated);
      localStorage.setItem('@saved_agendas', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async () => {
    if (!token.trim()) {
      alert('Silakan masukkan token akses.');
      return;
    }

    setLoading(true);
    try {
      const formattedToken = token.trim().toUpperCase();
      const { data, error } = await supabase
        .from('pengawasan_lapangans')
        .select('*')
        .eq('token', formattedToken)
        .maybeSingle();

      if (error) {
        alert(error.message || 'Unknown error');
        return;
      }
      if (!data) {
        alert('Token tidak valid atau tidak ditemukan');
        return;
      }
      
      const isAlreadySaved = savedAgendas.some(a => a.id === data.id);
      if (!isAlreadySaved) {
        if (savedAgendas.length >= 4) {
          alert('Maksimal 4 agenda tersimpan. Silakan hapus agenda yang sudah selesai.');
          setLoading(false);
          return;
        }
        const updatedAgendas = [...savedAgendas, data];
        setSavedAgendas(updatedAgendas);
        localStorage.setItem('@saved_agendas', JSON.stringify(updatedAgendas));
        alert('Agenda berhasil divalidasi dan disimpan ke HP.');
      }

      setAgendaData(data);
      setToken('');
      setScreen('info');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const openSavedAgenda = (agenda: any) => {
    setAgendaData(agenda);
    setScreen('info');
  };

  const shareToWhatsApp = (agenda: any) => {
    const link = `https://bididlh.vercel.app/pengawasan/link/${agenda.token}`;
    const text = `Berikut adalah BAP Pengawasan Lapangan (${agenda.nama_kegiatan || agenda.nama_pemrakarsa}). Silakan unduh/cetak melalui tautan berikut:\n\n${link}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const renderSplash = () => (
    <div className="flex-1 bg-tertiary-container h-screen flex justify-center items-center">
      <div className="flex flex-row items-center">
        <div className="bg-secondary text-on-secondary px-4 py-2 border-[4px] border-outline-variant rounded-xl mr-3">
          <span className="font-bold text-5xl text-on-surface tracking-tighter">BIDI</span>
        </div>
        <span className="font-bold text-5xl text-on-surface tracking-tight">DLH</span>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="flex-1 bg-tertiary-container h-full w-full flex-1 flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden">
      <div className="p-6 pt-12 flex-1 flex flex-col">
        <div className="flex flex-row items-center mb-8 justify-center">
          <div className="bg-secondary text-on-secondary px-3 py-1 border-[3px] border-outline-variant rounded-lg mr-2">
            <span className="font-bold text-2xl text-on-surface tracking-tighter">BIDI</span>
          </div>
          <span className="font-bold text-3xl text-on-surface tracking-tight">DLH</span>
        </div>

        <h2 className="text-on-surface font-bold text-xl uppercase tracking-tight mb-4">Agenda Tersimpan ({savedAgendas.length}/4)</h2>
        
        <div className="flex-1 overflow-y-auto">
          {savedAgendas.length === 0 ? (
            <div className="flex items-center justify-center py-10 opacity-50">
               <span className="font-bold text-on-surface-variant">Belum ada agenda tersimpan</span>
            </div>
          ) : (
            savedAgendas.map((agenda, idx) => (
              <div key={idx} className="bg-surface border-[3px] border-outline-variant rounded-xl p-4 mb-4">
                <div className="flex flex-row justify-between mb-2">
                  <span className="font-bold text-slate-400 text-xs uppercase">{agenda.token}</span>
                  <button onClick={() => removeSavedAgenda(agenda.id)}>
                    <span className="text-error font-bold text-xs uppercase hover:underline">Hapus</span>
                  </button>
                </div>
                <h3 className="font-bold text-on-surface text-lg mb-1">{agenda.nama_kegiatan || agenda.nama_pemrakarsa}</h3>
                <p className="font-bold text-on-surface-variant text-xs mb-4">{agenda.kategori || '-'}</p>
                
                <div className="flex flex-row gap-2">
                  <button 
                    onClick={() => shareToWhatsApp(agenda)}
                    className="flex-1 bg-green-400 py-3 rounded-lg border-[3px] border-outline-variant flex items-center justify-center hover:bg-green-500 active:translate-y-1 transition-all"
                  >
                    <span className="font-bold text-on-surface uppercase text-[10px] tracking-widest">Kirim WA</span>
                  </button>
                  
                  <button 
                    onClick={() => openSavedAgenda(agenda)}
                    className="flex-1 bg-secondary text-on-secondary py-3 rounded-lg border-[3px] border-outline-variant flex items-center justify-center hover:bg-secondary text-on-secondary active:translate-y-1 transition-all"
                  >
                    <span className="font-bold text-on-surface uppercase text-[10px] tracking-widest">Buka Agenda</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <button 
          className="w-full bg-primary text-on-primary rounded-xl py-4 flex items-center justify-center mt-4 hover:bg-primary-container active:translate-y-1 transition-all"
          onClick={() => setScreen('login')}
        >
          <span className="text-on-primary font-bold text-lg tracking-wider uppercase">+ Tambah Agenda</span>
        </button>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="flex-1 bg-tertiary-container h-full w-full flex-1 flex justify-center items-center p-6 relative max-w-md mx-auto shadow-2xl">
      <button 
        onClick={() => setScreen('home')}
        className="absolute top-6 left-6 px-4 py-2 bg-surface border-[3px] border-outline-variant rounded-lg hover:bg-surface-container-low transition-all"
      >
         <span className="font-bold text-xs uppercase text-on-surface">Kembali</span>
      </button>

      <div className="w-full max-w-sm bg-surface p-8 border-[3px] border-outline-variant rounded-xl flex flex-col items-center">
        <div className="flex flex-row items-center mb-6">
          <div className="bg-secondary text-on-secondary px-3 py-1 border-[3px] border-outline-variant rounded-lg mr-2">
            <span className="font-bold text-4xl text-on-surface tracking-tighter">BIDI</span>
          </div>
          <span className="font-bold text-4xl text-on-surface tracking-tight">DLH</span>
        </div>
        <p className="text-on-surface-variant text-center mb-8 font-bold uppercase tracking-[0.2em] text-[10px]">Pengawasan Mobile Web</p>

        <div className="w-full mb-6">
          <label className="block text-xs font-bold text-on-surface uppercase tracking-widest mb-2 ml-1">Token Akses</label>
          <input
            className="w-full bg-surface border-[3px] border-outline-variant rounded-lg px-4 py-4 text-on-surface font-bold text-lg focus:outline-none focus:ring-4 focus:ring-emerald-200"
            placeholder="Masukkan token..."
            value={token}
            onChange={(e) => setToken(e.target.value.toUpperCase())}
            style={{ textTransform: 'uppercase' }}
          />
        </div>

        <button 
          className="w-full bg-secondary text-on-secondary border-[3px] border-outline-variant rounded-lg py-4 flex items-center justify-center hover:bg-secondary text-on-secondary active:translate-y-1 transition-all disabled:opacity-50"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b border-outline-variant"></div>
          ) : (
            <span className="text-on-surface font-bold text-lg tracking-wider uppercase">Validasi & Simpan</span>
          )}
        </button>
      </div>
    </div>
  );

  const renderInfo = () => {
    const getParsedTim = () => {
      if (!agendaData?.tim_tugas) return [];
      try { return JSON.parse(agendaData.tim_tugas); }
      catch { return agendaData.tim_tugas.split('|').map((t: string) => t.trim()).filter((t: string) => t !== ''); }
    };
    
    return (
      <div className="flex-1 bg-primary-container h-full w-full flex-1 flex flex-col max-w-md mx-auto shadow-2xl overflow-y-auto p-6 pt-12 relative">
        <button 
          onClick={() => setScreen('home')} 
          className="mb-6 self-start bg-surface border border-outline-variant px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow hover:translate-y-0.5 hover:shadow-sm hover:shadow-md transition-shadow transition-all"
        >
          <span className="text-on-surface font-bold uppercase text-xs tracking-wider">← Kembali</span>
        </button>
        
        <h2 className="text-3xl font-bold text-on-surface mb-6 uppercase tracking-tight">Detail Agenda</h2>
        
        <div className="bg-surface p-6 border border-outline-variant rounded-2xl shadow-sm hover:shadow-md transition-shadow mb-8">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Perusahaan / Kegiatan</p>
          <h3 className="text-2xl font-bold text-on-surface mb-6">{agendaData?.nama_kegiatan || agendaData?.nama_pemrakarsa}</h3>
          
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Kategori</p>
          <div className="bg-rose-200 border border-outline-variant inline-block px-3 py-1 rounded-lg mb-6 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-sm font-bold text-on-surface uppercase">{agendaData?.kategori || '-'}</span>
          </div>
          
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Lokasi Kegiatan</p>
          <p className="text-sm font-bold text-on-surface mb-6">{agendaData?.alamat_lokasi || '-'}</p>

          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Waktu Pengawasan</p>
          <p className="text-lg font-bold text-on-surface mb-6">{new Date(agendaData?.tanggal_kunjungan || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Tim Bertugas</p>
          <div className="bg-surface-container-lowest p-4 rounded-xl border-2 border-outline-variant">
            {getParsedTim().length > 0 ? getParsedTim().map((t: string, i: number) => (
              <p key={i} className="font-bold text-on-surface-variant mb-1">• {t}</p>
            )) : <p className="text-slate-400 italic">Belum ada tim yang ditugaskan</p>}
          </div>
        </div>

        <button 
          className="w-full bg-blue-400 border border-outline-variant rounded-xl py-5 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow hover:bg-blue-500 active:shadow-sm hover:shadow-md transition-shadow active:translate-y-1 active:translate-x-1 transition-all"
          onClick={() => setScreen('form')}
        >
          <span className="text-on-surface font-bold text-lg uppercase tracking-wider">Mulai Pengawasan</span>
        </button>
      </div>
    );
  };

  return (
    <div className="bg-primary text-on-primary h-full w-full flex-1 flex justify-center w-full">
      <div className="w-full max-w-md bg-surface shadow-2xl relative h-full w-full flex-1">
        {screen === 'splash' && renderSplash()}
        {screen === 'home' && renderHome()}
        {screen === 'login' && renderLogin()}
        {screen === 'info' && renderInfo()}
        {screen === 'form' && (
          <FormBAP 
            agendaData={agendaData} 
            setScreen={setScreen}
            supabase={supabase}
          />
        )}
      </div>
    </div>
  );
}
