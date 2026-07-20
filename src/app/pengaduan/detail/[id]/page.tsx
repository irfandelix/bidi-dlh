'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, FileText, CheckCircle2, Clock, User, MapPin, ExternalLink, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { use } from 'react';

const supabase = createClient();

export default function DetailPengaduanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      const { data: fetch, error } = await supabase
        .from('pengaduans')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error || !fetch) {
        setErrorMsg('Data tiket pengaduan tidak ditemukan.');
      } else {
        setData(fetch);
      }
      setLoading(false);
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-slate-900 animate-spin mb-4" />
        <h2 className="text-xl font-black text-slate-900 uppercase">Memuat Data...</h2>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <h2 className="text-2xl font-black text-rose-900 uppercase mb-4">Error</h2>
        <p className="font-bold text-rose-800">{errorMsg}</p>
        <Link href="/pengaduan" className="mt-8 inline-block px-6 py-3 bg-slate-900 text-white font-black rounded-xl uppercase">Kembali</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8 px-4 pb-20">
      <Link href="/pengaduan" className="inline-flex items-center gap-2 text-sm text-slate-900 font-black transition-all bg-white border-2 border-slate-900 px-4 py-2 rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Daftar
      </Link>

      <div className="bg-white border-4 border-slate-900 rounded-3xl overflow-hidden shadow-[12px_12px_0_0_#0f172a]">
        
        {/* HEADER */}
        <div className="bg-slate-900 p-8 text-white relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-purple-500 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-widest border-2 border-purple-300">
                  TIKET PENGADUAN
                </span>
                <span className="bg-slate-800 text-slate-300 font-black text-xs px-3 py-1 rounded-full uppercase tracking-widest border-2 border-slate-700 flex items-center gap-1">
                  <Clock size={12} /> {new Date(data.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black uppercase leading-tight mb-1">{data.perihal}</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2 mt-2">
                Token Akses: <span className="text-white bg-slate-800 px-2 py-1 rounded font-mono">{data.token}</span>
              </p>
            </div>

            <div className="bg-white text-slate-900 p-6 rounded-2xl border-4 border-slate-200 shrink-0 text-center shadow-[4px_4px_0_0_#cbd5e1] transform md:rotate-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Status Saat Ini</p>
              {data.status_tahapan === 'Menunggu Isian' ? (
                <div className="flex items-center gap-2 justify-center text-amber-600">
                  <Clock size={24} />
                  <span className="font-black text-lg uppercase">Menunggu Pelapor</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center text-emerald-600">
                  <CheckCircle2 size={24} />
                  <span className="font-black text-lg uppercase">Formulir Terisi</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-8 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* KOLOM KIRI */}
            <div className="space-y-8">
              <section>
                <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 border-b-4 border-slate-900 pb-2 uppercase tracking-tight mb-4">
                  <User size={20} className="text-purple-600" /> Identitas Pelapor
                </h3>
                <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-5 space-y-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Nama Pelapor</p>
                    <p className="font-bold text-slate-900 text-lg">{data.nama_pelapor || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Kontak (Telp/WA)</p>
                    <p className="font-bold text-slate-900 text-lg">{data.telp_pelapor || '-'}</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 border-b-4 border-slate-900 pb-2 uppercase tracking-tight mb-4">
                  <MapPin size={20} className="text-purple-600" /> Detail Kasus
                </h3>
                <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-5 space-y-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Pihak Terlapor</p>
                    <p className="font-bold text-slate-900 text-lg">{data.nama_terlapor || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Lokasi Kejadian</p>
                    <p className="font-bold text-slate-900 text-base">{data.lokasi_aduan || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Deskripsi / Kronologi</p>
                    <p className="font-bold text-slate-900 text-sm whitespace-pre-wrap leading-relaxed border-l-4 border-purple-400 pl-4 py-1 mt-1 bg-white">{data.deskripsi || '-'}</p>
                  </div>
                </div>
              </section>
            </div>

            {/* KOLOM KANAN */}
            <div className="space-y-8">
              <section>
                <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 border-b-4 border-slate-900 pb-2 uppercase tracking-tight mb-4">
                  <FileText size={20} className="text-purple-600" /> Dokumen & Lampiran
                </h3>
                <div className="space-y-4">
                  
                  <div className="border-2 border-slate-200 rounded-xl p-4 flex items-center justify-between bg-slate-50">
                    <div>
                      <p className="font-black text-slate-900 uppercase">Dokumentasi Pelapor</p>
                      <p className="text-xs font-bold text-slate-500">Diunggah saat mengisi form</p>
                    </div>
                    {data.dokumentasi_url ? (
                      <a href={data.dokumentasi_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 font-black text-xs uppercase tracking-widest rounded-lg transition-colors border-2 border-purple-300">
                        Lihat <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-xs font-black text-slate-400 bg-slate-200 px-3 py-1 rounded-lg">Belum Ada</span>
                    )}
                  </div>

                  <div className="border-2 border-slate-200 rounded-xl p-4 flex items-center justify-between bg-slate-50">
                    <div>
                      <p className="font-black text-slate-900 uppercase">Berita Acara (BA)</p>
                      <p className="text-xs font-bold text-slate-500">Arsip akhir penanganan aduan</p>
                    </div>
                    {data.ba_url ? (
                      <a href={data.ba_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-900 font-black text-xs uppercase tracking-widest rounded-lg transition-colors border-2 border-blue-300">
                        Lihat <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-xs font-black text-slate-400 bg-slate-200 px-3 py-1 rounded-lg">Belum Ada</span>
                    )}
                  </div>

                </div>
              </section>

              <section className="bg-purple-50 border-4 border-purple-200 rounded-2xl p-6 text-center space-y-4 shadow-[4px_4px_0_0_#d8b4fe]">
                <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center mx-auto text-purple-600 border-4 border-white shadow-inner">
                  <Download size={28} />
                </div>
                <div>
                  <h4 className="font-black text-lg text-purple-900 uppercase">Generate Berita Acara</h4>
                  <p className="text-xs font-bold text-purple-700 mt-1 px-4">Fitur ini belum aktif. Menunggu ketersediaan Template Docx Pengaduan dari Admin.</p>
                </div>
                <button disabled className="w-full py-4 bg-slate-300 text-slate-500 font-black uppercase tracking-widest text-sm rounded-xl border-4 border-slate-400 cursor-not-allowed">
                  Fitur Segera Hadir
                </button>
              </section>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
