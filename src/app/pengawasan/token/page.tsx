'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import Link from 'next/link';
import { 
  ShieldCheck, ArrowRight, AlertTriangle, ArrowLeft, 
  ClipboardPaste, Calendar, MapPin, CheckCircle2,
  Building2, Users, FileText, Clock, ExternalLink, Check
} from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';
import PengawasanSubNav from '@/components/PengawasanSubNav';

function TokenForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agendas, setAgendas] = useState<any[]>([]);
  const [copiedToken, setCopiedToken] = useState(false);

  const verifyToken = async (tokenToVerify: string, autoRedirect = false) => {
    const cleanToken = tokenToVerify.trim().toUpperCase();
    if (!cleanToken) return;

    setLoading(true);
    setError('');
    setAgendas([]);

    try {
      const { data, error: sbError } = await supabase
        .from('pengawasan_lapangans')
        .select(`
          id, 
          nama_kegiatan, 
          nama_pemrakarsa, 
          kategori, 
          alamat_lokasi, 
          tim_tugas, 
          tanggal_kunjungan, 
          token,
          status_ketaatan,
          file_bap,
          nomor_nota_dinas,
          bap_pengawasans ( id, data_matriks_c, created_at )
        `)
        .eq('token', cleanToken)
        .order('id', { ascending: true });

      if (sbError || !data || data.length === 0) {
        throw new Error('Token tidak ditemukan! Periksa kembali kode token atau tautan yang diberikan.');
      }

      // Jika hanya ada 1 lokasi dan dibuka via URL param, langsung buka BAP
      if (data.length === 1 && autoRedirect) {
        router.push(`/pengawasan/ba/isi/${data[0].id}`);
        return;
      }

      setAgendas(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memverifikasi token.');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Ambil token dari URL jika ada dan otomatis verifikasi
    const urlToken = searchParams.get('token');
    if (urlToken && urlToken.trim()) {
      const clean = urlToken.trim().toUpperCase();
      setToken(clean);
      verifyToken(clean, true);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyToken(token, false);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const clean = text.trim().toUpperCase();
        setToken(clean);
        setError('');
      }
    } catch (err) {
      console.warn('Cannot read clipboard', err);
    }
  };

  const copyTokenToClipboard = (tok: string) => {
    navigator.clipboard.writeText(tok);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const isMulti = agendas.length > 1;
  const singleAgenda = agendas.length === 1 ? agendas[0] : null;

  return (
    <div className={`w-full ${isMulti ? 'max-w-2xl' : 'max-w-sm md:max-w-md'} bg-white border border-slate-200 rounded-[2rem] p-5 md:p-6 shadow-xl text-center relative overflow-hidden z-10 space-y-4 transition-all duration-300`}>
      
      {/* Icon Perisai khas Menu Verifikasi Token */}
      <div className="w-14 h-14 md:w-16 md:h-16 bg-rose-100 text-rose-700 border-[3px] border-slate-200 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
        <ShieldCheck size={32} strokeWidth={2.5} />
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">
          {isMulti ? 'Rombongan Pengawasan' : 'Verifikasi Token'}
        </h2>
        <p className="text-[11px] md:text-xs font-bold text-slate-500 mt-1 px-1 leading-relaxed">
          {isMulti
            ? `Token ini memuat ${agendas.length} titik lokasi pengawasan lapangan.`
            : 'Masukkan kode unik agenda untuk membuka formulir BAP inspeksi lapangan.'}
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border-2 border-rose-200 text-rose-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2.5 text-left shadow-sm animate-in fade-in duration-200">
          <AlertTriangle size={18} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAMPILAN 1: MULTI-LOKASI (2 - 5 TITIK LOKASI DALAM 1 TOKEN) */}
      {isMulti ? (
        <div className="space-y-4 text-left animate-in zoom-in-95 duration-200">
          {/* Header Ringkasan Rombongan */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm space-y-2.5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="font-mono text-xs font-black text-emerald-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700 tracking-wider">
                #{agendas[0]?.token}
              </span>
              <button
                type="button"
                onClick={() => copyTokenToClipboard(agendas[0]?.token)}
                className="text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                {copiedToken ? <Check size={13} className="text-emerald-400" /> : <ClipboardPaste size={13} />}
                <span>{copiedToken ? 'Tersalin' : 'Salin Token'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Calendar size={13} className="text-indigo-400 shrink-0" />
                <span className="font-bold text-white">
                  {new Date(agendas[0]?.tanggal_kunjungan).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                </span>
              </div>
              {agendas[0]?.nomor_nota_dinas && (
                <div className="flex items-center gap-1.5 text-slate-300 truncate">
                  <FileText size={13} className="text-amber-400 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-300 truncate font-mono">
                    {agendas[0]?.nomor_nota_dinas}
                  </span>
                </div>
              )}
            </div>

            {agendas[0]?.tim_tugas && (
              <div className="flex items-start gap-1.5 text-slate-300 border-t border-slate-800/80 pt-2">
                <Users size={13} className="text-teal-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-300 leading-snug">
                  <span className="font-bold text-white">Tim Pengawas: </span>
                  {agendas[0]?.tim_tugas.replace(/\|/g, ', ')}
                </p>
              </div>
            )}
          </div>

          {/* List Kartu Tiap Lokasi Kunjungan */}
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-600 px-1">
              Pilih Lokasi Usaha yang Diinspeksi:
            </p>

            <div className="space-y-2.5">
              {agendas.map((loc, idx) => {
                const hasBap = (loc.bap_pengawasans && loc.bap_pengawasans.length > 0) || loc.file_bap;
                return (
                  <div 
                    key={loc.id}
                    className="p-4 bg-slate-50 hover:bg-slate-100/90 border-2 border-slate-200 rounded-2xl transition-all shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                          {loc.kategori || 'Sektor'}
                        </span>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        hasBap 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {hasBap ? 'BAP Terisi' : 'Belum Diisi'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-black text-slate-900 text-sm uppercase leading-tight">
                        {loc.nama_kegiatan}
                      </h4>
                      <p className="text-xs font-bold text-slate-600 mt-0.5">
                        Pemrakarsa: {loc.nama_pemrakarsa || '—'}
                      </p>
                    </div>

                    {loc.alamat_lokasi && (
                      <div className="flex items-start gap-1 text-[11px] font-medium text-slate-500">
                        <MapPin size={12} className="text-rose-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{loc.alamat_lokasi}</span>
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => router.push(`/pengawasan/ba/isi/${loc.id}`)}
                        className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all ${
                          hasBap
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <span>{hasBap ? 'Lihat / Perbarui BAP' : 'Mulai Isi BAP Lokasi Ini'}</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tombol Ganti Token */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => { setAgendas([]); setToken(''); }}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
            >
              &larr; Masukkan Token Lain
            </button>
          </div>
        </div>
      ) : singleAgenda ? (
        /* TAMPILAN 2: SINGLE AGENDA PREVIEW (1 LOKASI) */
        <div className="bg-slate-50 border-2 border-emerald-200 rounded-2xl p-4 text-left space-y-3 animate-in zoom-in-95 duration-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <CheckCircle2 size={12} /> Agenda Terverifikasi
            </span>
            <span className="font-mono text-xs font-black text-slate-700">
              {singleAgenda.token}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Objek Pengawasan
            </span>
            <h4 className="font-black text-xs md:text-sm text-slate-900 uppercase leading-snug">
              {singleAgenda.nama_kegiatan}
            </h4>
            <p className="text-[11px] font-bold text-slate-600 uppercase">
              Pemrakarsa: {singleAgenda.nama_pemrakarsa || '—'}
            </p>
          </div>

          <div className="space-y-1 text-xs text-slate-600 border-t border-slate-200 pt-2">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-indigo-600" />
              <span className="font-bold text-slate-700">
                {new Date(singleAgenda.tanggal_kunjungan).toLocaleDateString('id-ID', { dateStyle: 'long' })}
              </span>
            </div>
            {singleAgenda.alamat_lokasi && (
              <div className="flex items-start gap-1.5">
                <MapPin size={13} className="text-rose-500 shrink-0 mt-0.5" />
                <span className="text-[11px] font-medium text-slate-600 line-clamp-1">
                  {singleAgenda.alamat_lokasi}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => router.push(`/pengawasan/ba/isi/${singleAgenda.id}`)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>Buka Formulir BAP Lapangan</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        /* FORM INPUT TOKEN */
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <div className="relative">
              <input 
                type="text" 
                required 
                placeholder="CONTOH: PGW-A8B9C2" 
                value={token}
                onChange={(e) => {
                  setToken(e.target.value.toUpperCase());
                  setError('');
                }}
                className="w-full text-center px-4 py-3 md:py-3.5 rounded-xl border-2 border-slate-200 bg-slate-50 font-mono font-black text-lg md:text-xl uppercase tracking-[0.2em] text-slate-900 placeholder:text-slate-300 placeholder:normal-case placeholder:tracking-normal placeholder:font-sans placeholder:text-xs focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner"
              />
            </div>

            {/* Tombol Tempel dari Clipboard */}
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider py-0.5"
            >
              <ClipboardPaste size={14} />
              <span>Tempel dari Clipboard</span>
            </button>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !token.trim()}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black py-3 md:py-3.5 rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <LottieLoader size={18} /> Memverifikasi...
              </span>
            ) : (
              <>
                <span>Lanjut Verifikasi</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      )}

      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-1">
        Sistem Informasi Pengawasan Lingkungan Hidup DLH
      </p>
    </div>
  );
}

export default function VerifikasiToken() {
  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto space-y-6 relative py-2">
      {/* SUB NAV PENGAWASAN */}
      <PengawasanSubNav />

      {/* Decorative Blur Background Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-50/70 rounded-full blur-3xl pointer-events-none -z-0"></div>

      <Suspense fallback={<LottieLoader size={120} text="MEMUAT FORM TOKEN..." />}>
        <TokenForm />
      </Suspense>
    </div>
  );
}
