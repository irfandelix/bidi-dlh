'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, FileText, Send, Building2, User, Plus, X, 
  Archive, Sparkles, CheckCircle2, Download, Search, Calendar, 
  MapPin, Check, ExternalLink, Zap
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import LottieLoader from '@/components/LottieLoader';
import PengawasanSubNav from '@/components/PengawasanSubNav';

export default function NotaDinasPengawasanPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Form Data State
  const [formData, setFormData] = useState({
    hal: '',
    yth: 'Kepala Dinas Lingkungan Hidup Kab. Sragen',
    dari: 'Tim Pengawas Lingkungan Hidup',
    sifat: 'Biasa',
    lampiran: '1 (Satu) Berkas'
  });

  const [petugasList, setPetugasList] = useState<string[]>(['']);
  const [kegiatanList, setKegiatanList] = useState([{ nama_usaha: '', hasil_pengawasan: '' }]);
  const [selectedAgendaId, setSelectedAgendaId] = useState<number | null>(null);

  // Data for Auto-Pickers
  const [agendas, setAgendas] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [searchAgendaQuery, setSearchAgendaQuery] = useState('');
  const [loadingPickers, setLoadingPickers] = useState(true);

  // Success Modal State
  const [generatedDoc, setGeneratedDoc] = useState<{
    nomor: string;
    hal: string;
    filename: string;
  } | null>(null);

  useEffect(() => {
    // 1. Fetch Agendas for quick fill
    supabase
      .from('pengawasan_lapangans')
      .select('id, nama_kegiatan, nama_pemrakarsa, kategori, alamat_lokasi, tim_tugas, tanggal_kunjungan')
      .order('tanggal_kunjungan', { ascending: false })
      .limit(60)
      .then(({ data, error }) => {
        if (!error && data) {
          setAgendas(data);
        }
        setLoadingPickers(false);
      });

    // 2. Fetch Master Official Team
    supabase
      .from('tim_pengawas')
      .select('id, nama, nip, pangkat_golongan, jabatan_dinas, kategori, urutan_hierarki')
      .order('urutan_hierarki', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          setOfficers(data);
        }
      });
  }, []);

  // Kegiatan Helpers
  const addKegiatan = () => setKegiatanList(prev => [...prev, { nama_usaha: '', hasil_pengawasan: '' }]);
  const removeKegiatan = (idx: number) => {
    setKegiatanList(prev => prev.filter((_, i) => i !== idx));
  };
  const updateKegiatan = (idx: number, field: 'nama_usaha' | 'hasil_pengawasan', val: string) => {
    setKegiatanList(prev => {
      const updated = [...prev];
      updated[idx][field] = val;
      return updated;
    });
  };

  // Petugas Helpers
  const addPetugas = () => setPetugasList(prev => [...prev, '']);
  const removePetugas = (idx: number) => {
    setPetugasList(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      return updated.length > 0 ? updated : [''];
    });
  };
  const updatePetugas = (idx: number, val: string) => {
    setPetugasList(prev => {
      const updated = [...prev];
      updated[idx] = val;
      return updated;
    });
  };

  // Toggle officer from master chips
  const handleToggleOfficer = (name: string) => {
    if (petugasList.includes(name)) {
      setPetugasList(prev => {
        const filtered = prev.filter(p => p !== name);
        return filtered.length > 0 ? filtered : [''];
      });
    } else {
      setPetugasList(prev => {
        const filtered = prev.filter(p => p.trim() !== '');
        return [...filtered, name];
      });
    }
  };

  // Auto-fill from selected agenda
  const handleSelectAgenda = (agenda: any) => {
    const namaUsahaFormatted = `${agenda.nama_kegiatan || ''}${agenda.nama_pemrakarsa ? ` (${agenda.nama_pemrakarsa})` : ''}`.trim();
    
    // Fill subject if empty
    setFormData(prev => ({
      ...prev,
      hal: `Laporan Hasil Pengawasan Lingkungan Hidup terhadap ${agenda.nama_kegiatan || 'Objek Pengawasan'}`
    }));

    // Fill object and description
    const formattedTgl = agenda.tanggal_kunjungan 
      ? new Date(agenda.tanggal_kunjungan).toLocaleDateString('id-ID', { dateStyle: 'long' }) 
      : 'waktu yang ditentukan';
    
    setKegiatanList([
      {
        nama_usaha: namaUsahaFormatted,
        hasil_pengawasan: `Telah dilaksanakan verifikasi dan pengawasan ketaatan lingkungan hidup pada tanggal ${formattedTgl} di lokasi ${agenda.alamat_lokasi || '-'}.`
      }
    ]);

    // Fill officers if present in agenda
    if (Array.isArray(agenda.tim_tugas) && agenda.tim_tugas.length > 0) {
      setPetugasList(agenda.tim_tugas);
    }

    setSelectedAgendaId(agenda.id || null);
    setShowPickerModal(false);
  };

  const resetForm = () => {
    setFormData({
      hal: '',
      yth: 'Kepala Dinas Lingkungan Hidup Kab. Sragen',
      dari: 'Tim Pengawas Lingkungan Hidup',
      sifat: 'Biasa',
      lampiran: '1 (Satu) Berkas'
    });
    setPetugasList(['']);
    setKegiatanList([{ nama_usaha: '', hasil_pengawasan: '' }]);
    setSelectedAgendaId(null);
    setGeneratedDoc(null);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const payload = {
      agenda_id: selectedAgendaId,
      hal: formData.hal,
      yth: formData.yth,
      dari: formData.dari,
      sifat: formData.sifat,
      lampiran: formData.lampiran,
      kegiatan: kegiatanList.filter(k => k.nama_usaha.trim() !== '' || k.hasil_pengawasan.trim() !== ''),
      petugas: petugasList.filter(p => p.trim() !== '')
    };

    try {
      const res = await fetch('/api/pengawasan/generate-surat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || 'Terjadi kesalahan saat memproses surat');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const disposition = res.headers.get('Content-Disposition');
      let filename = 'Nota_Dinas_Pengawasan.docx';
      let nomorExtracted = 'Tercatat di Database';

      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
          const nomorMatch = filename.match(/Nota_Dinas_Pengawasan_(.*?)\.docx/);
          if (nomorMatch && nomorMatch[1]) {
            nomorExtracted = nomorMatch[1].replace(/_/g, '/');
          }
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      setGeneratedDoc({
        nomor: nomorExtracted,
        hal: formData.hal,
        filename
      });

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Agendas for Picker
  const filteredAgendas = agendas.filter(item => {
    if (!searchAgendaQuery.trim()) return true;
    const q = searchAgendaQuery.toLowerCase();
    const nama = (item.nama_kegiatan || '').toLowerCase();
    const pemrakarsa = (item.nama_pemrakarsa || '').toLowerCase();
    const alamat = (item.alamat_lokasi || '').toLowerCase();
    return nama.includes(q) || pemrakarsa.includes(q) || alamat.includes(q);
  });

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        
        {/* SUB NAV PENGAWASAN */}
        <PengawasanSubNav />

        {/* HEADER CARD - SAMA DENGAN GAYA DASHBOARD PENGAWASAN */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-lg relative overflow-hidden">
          {/* Decorative Circle */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-fuchsia-50 rounded-full border border-slate-200 opacity-60 pointer-events-none"></div>

          <div className="flex flex-col md:flex-row gap-5 items-start relative z-10">
            <Link 
              href="/pengawasan" 
              className="w-16 h-16 shrink-0 bg-indigo-500 text-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-md hover:bg-indigo-600 hover:-translate-y-1 hover:shadow-md transition-all"
              title="Kembali ke Dashboard Pengawasan"
            >
              <ArrowLeft size={32} />
            </Link>

            <div className="w-16 h-16 rounded-2xl bg-fuchsia-100 text-fuchsia-700 border-[3px] border-slate-200 flex items-center justify-center shadow-sm shrink-0">
              <FileText size={32} strokeWidth={2.5} />
            </div>

            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                Buat Nota Dinas
              </h1>
              <p className="text-sm font-bold text-slate-600 mt-2 tracking-wide">
                Penerbitan surat nota dinas laporan hasil pengawasan ketaatan lingkungan hidup.
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 font-black text-xs uppercase tracking-wider border-[2px] border-slate-200 rounded-xl shadow-sm">
                  <Sparkles size={15} className="text-fuchsia-600" />
                  <span>Pola Nomor: 600.4.6 / [No] / [Bulan] / 17 / PW / 2026</span>
                </div>

                <Link
                  href="/arsip/nota-dinas"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-black text-xs uppercase tracking-wider border-[2px] border-slate-200 rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all"
                >
                  <Archive size={15} />
                  <span>Lihat Arsip Nota Dinas</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 text-rose-800 p-4 rounded-2xl font-bold border-2 border-rose-200 text-xs md:text-sm shadow-sm flex items-center justify-between gap-3">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="p-1 hover:bg-rose-100 rounded-lg">
              <X size={16} />
            </button>
          </div>
        )}

        {/* MAIN FORM CARD */}
        <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] shadow-lg border border-slate-200 overflow-hidden">
          
          {/* TOOLBAR ATAS: TARIK DATA CEPAT */}
          <div className="p-5 md:p-6 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-700 bg-fuchsia-100 px-2.5 py-1 rounded-md border border-fuchsia-200">
                Otomasi Data
              </span>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide mt-1">
                Tarik Data Dari Agenda Pengawasan
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setShowPickerModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              <Zap size={16} />
              <span>Pilih Dari Agenda Lapangan</span>
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            
            {/* SEKSI 1: INFORMASI KEPALA SURAT */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 border-b-2 border-slate-100 pb-3">
                <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center border border-indigo-200">
                  1
                </span>
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">
                  Informasi Kepala Surat
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                    Hal / Perihal <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="hal" 
                    required 
                    value={formData.hal}
                    onChange={e => setFormData({ ...formData, hal: e.target.value })}
                    placeholder="Contoh: Laporan Hasil Pengawasan Lingkungan Hidup terhadap PT..." 
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                    Yth. Tujuan <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="yth" 
                    required 
                    value={formData.yth}
                    onChange={e => setFormData({ ...formData, yth: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                    Dari <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="dari" 
                    required 
                    value={formData.dari}
                    onChange={e => setFormData({ ...formData, dari: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                    Sifat Surat <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {['Biasa', 'Penting', 'Segera', 'Rahasia'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, sifat: s })}
                        className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl border transition-all ${
                          formData.sifat === s
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                    Lampiran <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="lampiran" 
                    required 
                    value={formData.lampiran}
                    onChange={e => setFormData({ ...formData, lampiran: e.target.value })}
                    placeholder="Contoh: 1 (Satu) Berkas" 
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-all" 
                  />
                </div>
              </div>
            </div>

            {/* SEKSI 2: KONTEN / OBJEK PENGAWASAN */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 font-black text-xs flex items-center justify-center border border-teal-200">
                    2
                  </span>
                  <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">
                    Objek & Hasil Pengawasan
                  </h3>
                </div>

                <button 
                  type="button" 
                  onClick={addKegiatan} 
                  className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition-all uppercase tracking-wider shadow-sm"
                >
                  <Plus size={14} /> Tambah Objek
                </button>
              </div>
              
              <div className="space-y-4">
                {kegiatanList.map((keg, idx) => (
                  <div key={idx} className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-200 relative space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs flex items-center gap-1.5">
                        <Building2 size={13} className="text-teal-600" /> Objek Pengawasan #{idx + 1}
                      </span>

                      {kegiatanList.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeKegiatan(idx)} 
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-200 transition-all"
                          title="Hapus objek ini"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                        Nama Usaha / Kegiatan / Objek <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        required 
                        value={keg.nama_usaha} 
                        onChange={(e) => updateKegiatan(idx, 'nama_usaha', e.target.value)} 
                        placeholder="Contoh: PT. Sumber Makmur Abadi / RSUD Sragen"
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                        Ringkasan / Hasil Pengawasan Lapangan <span className="text-rose-500">*</span>
                      </label>
                      <textarea 
                        required 
                        rows={3} 
                        value={keg.hasil_pengawasan} 
                        onChange={(e) => updateKegiatan(idx, 'hasil_pengawasan', e.target.value)} 
                        placeholder="Tuliskan temuan atau hasil inspeksi lapangan..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-y"
                      ></textarea>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SEKSI 3: TIM PETUGAS PENGAWAS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 font-black text-xs flex items-center justify-center border border-violet-200">
                    3
                  </span>
                  <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">
                    Tim Petugas Pengawas
                  </h3>
                </div>

                <button 
                  type="button" 
                  onClick={addPetugas} 
                  className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition-all uppercase tracking-wider shadow-sm"
                >
                  <Plus size={14} /> Tambah Petugas Manual
                </button>
              </div>

              {/* QUICK CHIPS MASTER TIM PENGAWAS */}
              {officers.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Klik untuk memilih cepat petugas dari Master DLH:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {officers.map(officer => {
                      const isSelected = petugasList.includes(officer.nama);
                      return (
                        <button
                          key={officer.id}
                          type="button"
                          onClick={() => handleToggleOfficer(officer.nama)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected ? <Check size={12} className="text-emerald-400" /> : <User size={12} className="text-slate-400" />}
                          <span>{officer.nama}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DAFTAR NAMA PETUGAS YANG MASUK SURAT */}
              <div className="space-y-2.5">
                {petugasList.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-8 h-8 shrink-0 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200">
                      {idx + 1}
                    </span>
                    <div className="flex-1 relative">
                      <User size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input 
                        type="text" 
                        value={p}
                        onChange={(e) => updatePetugas(idx, e.target.value)}
                        placeholder="Nama Lengkap Petugas & Gelar" 
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                      />
                    </div>
                    {petugasList.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removePetugas(idx)} 
                        className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-200"
                        title="Hapus baris ini"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* FOOTER FORM ACTION */}
          <div className="bg-slate-50/80 p-6 md:p-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-500">
              * Dokumen .docx akan otomatis terunduh dan nomor surat tercatat di database.
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-3.5 bg-white hover:bg-slate-100 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl border border-slate-200 transition-all shadow-sm"
              >
                Reset Form
              </button>

              <button 
                type="submit" 
                disabled={loading || !formData.hal.trim()}
                className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all flex items-center gap-2.5"
              >
                {loading ? (
                  <>
                    <LottieLoader size={20} />
                    <span>Memproses Surat...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Terbitkan & Unduh Surat</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>

      {/* MODAL 1: PICKER AGENDA PENGAWASAN */}
      {showPickerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[2rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 border border-slate-200 flex items-center justify-center shadow-xs">
                  <Zap size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">
                    Pilih Dari Agenda Lapangan
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    Otomatis mengisi hal surat, nama kegiatan, dan tim petugas
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPickerModal(false)}
                className="p-2 hover:bg-slate-200 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama kegiatan atau pemrakarsa..."
                  value={searchAgendaQuery}
                  onChange={e => setSearchAgendaQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Agenda List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
              {loadingPickers ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <LottieLoader size={100} text="MEMUAT AGENDA..." />
                </div>
              ) : filteredAgendas.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-bold">
                  Tidak ada agenda pengawasan yang cocok dengan kata kunci.
                </div>
              ) : (
                filteredAgendas.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectAgenda(item)}
                    className="w-full p-4 text-left bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 rounded-2xl transition-all shadow-xs group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-indigo-100 group-hover:text-indigo-800">
                          {item.kategori || 'Umum'}
                        </span>
                        <h4 className="font-black text-sm text-slate-900 mt-1 uppercase group-hover:text-indigo-600 transition-colors">
                          {item.nama_kegiatan}
                        </h4>
                        <p className="text-xs font-bold text-slate-600 uppercase">
                          Pemrakarsa: {item.nama_pemrakarsa || '—'}
                        </p>
                      </div>

                      <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
                        <Calendar size={13} className="text-indigo-500" />
                        {item.tanggal_kunjungan ? new Date(item.tanggal_kunjungan).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '—'}
                      </span>
                    </div>

                    {item.alamat_lokasi && (
                      <p className="text-[11px] text-slate-500 font-medium mt-2 flex items-start gap-1 line-clamp-1">
                        <MapPin size={12} className="text-rose-500 shrink-0 mt-0.5" />
                        {item.alamat_lokasi}
                      </p>
                    )}

                    {Array.isArray(item.tim_tugas) && item.tim_tugas.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                        {item.tim_tugas.map((t: string, idx: number) => (
                          <span key={idx} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPickerModal(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SUKSES TERBIT SURAT */}
      {generatedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[2rem] w-full max-w-md p-7 text-center shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 border-[3px] border-slate-200 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={36} strokeWidth={2.5} />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300">
                Surat Berhasil Diterbitkan
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase mt-2">
                Nota Dinas Terbit!
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-1">
                File .docx telah otomatis diunduh ke perangkat Anda.
              </p>
            </div>

            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-left space-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Nomor Otomatis
                </span>
                <span className="font-mono text-xs font-black text-slate-900">
                  {generatedDoc.nomor}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Perihal
                </span>
                <p className="text-xs font-bold text-slate-700 leading-snug">
                  {generatedDoc.hal}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <Link
                href="/arsip/nota-dinas"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Archive size={16} />
                <span>Buka di Arsip Nota Dinas</span>
              </Link>

              <button
                type="button"
                onClick={resetForm}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase tracking-widest py-3 rounded-xl transition-all"
              >
                Buat Nota Dinas Lainnya
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
