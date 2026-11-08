'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import Link from 'next/link';
import { 
  ArrowLeft, Save, Calendar, MapPin, Building2, User, 
  Edit3, Database, CalendarPlus, CheckCircle2, Copy, Check, 
  ExternalLink, Search, X, AlertCircle, Sparkles, Shield, UserCheck,
  FileText, Archive
} from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function BuatAgenda() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dokumens, setDokumens] = useState<any[]>([]);
  const [pegawai, setPegawai] = useState<any[]>([]);
  const [tab, setTab] = useState<'manual' | 'db'>('manual');
  
  // Document search & selection state for 'db' tab
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  // Search filter for staff
  const [pegawaiSearch, setPegawaiSearch] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    tanggal_kunjungan: new Date().toISOString().split('T')[0],
    kategori: '',
    nama_kegiatan: '',
    nama_pemrakarsa: '',
    alamat_lokasi: '',
    latitude: '',
    longitude: '',
    catatan_khusus: '',
    tim_tugas: [] as string[],
    saksi: [] as string[]
  });

  // Validation error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Integrasi Nota Dinas (Arsip)
  const [notaMode, setNotaMode] = useState<'auto' | 'pilih'>('auto');
  const [previewNota, setPreviewNota] = useState<{
    nomor_otomatis: string;
    nomor_bap: string;
    nextUrut: number;
    tahun: string;
    bulan: number;
  } | null>(null);
  const [loadingNota, setLoadingNota] = useState(false);
  const [arsipNotaList, setArsipNotaList] = useState<any[]>([]);
  const [selectedNota, setSelectedNota] = useState<any | null>(null);
  const [searchNotaQuery, setSearchNotaQuery] = useState('');

  // Success modal state
  const [createdAgenda, setCreatedAgenda] = useState<{
    token: string;
    nama_kegiatan: string;
    tanggal_kunjungan: string;
    nomor_nota_dinas?: string;
    nomor_bap?: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch nomor nota dinas preview real-time
  const fetchNextNotaNumber = async (tgl: string) => {
    try {
      setLoadingNota(true);
      const res = await fetch(`/api/arsip-nota-dinas?action=next-number&bagian=Pengawasan&tanggal=${tgl}`);
      const data = await res.json();
      if (data && data.nomor_otomatis) {
        const parts = data.nomor_otomatis.split('/');
        const urut = parts[1] || `${String(data.nextUrut).padStart(3, '0')}.${data.bulan}`;
        setPreviewNota({
          ...data,
          nomor_bap: `600.4/${urut}/BAP/17/${data.tahun}`
        });
      }
    } catch (e) {
      console.error('Gagal mengambil preview nomor nota dinas:', e);
    } finally {
      setLoadingNota(false);
    }
  };

  useEffect(() => {
    fetchNextNotaNumber(formData.tanggal_kunjungan);
  }, [formData.tanggal_kunjungan]);

  useEffect(() => {
    if (notaMode === 'pilih' && arsipNotaList.length === 0) {
      fetch('/api/arsip-nota-dinas')
        .then(res => res.json())
        .then(res => {
          const list = res.data || [];
          setArsipNotaList(list.filter((n: any) => n.dari_bagian === 'Pengawasan' || n.dari_bagian === 'Umum'));
        })
        .catch(err => console.error(err));
    }
  }, [notaMode]);

  useEffect(() => {
    // Fetch documents for picker
    supabase
      .from('dokumens')
      .select('id, nama_pemrakarsa, nama_kegiatan, lokasi_kegiatan, jenis_dokumen, tahun, jenis_kegiatan, latitude, longitude')
      .order('id', { ascending: false })
      .then(({ data }) => setDokumens(data || []));

    // Fetch team members with complete official titles & hierarchy
    supabase
      .from('tim_pengawas')
      .select('id, nama, nip, pangkat_golongan, jabatan_dinas, kategori, urutan_hierarki')
      .order('urutan_hierarki', { ascending: true })
      .then(({ data }) => setPegawai(data || []));
  }, []);

  // Category detection helper
  const detectKategori = (nama: string, pemrakarsa: string, jenisKegiatan?: string) => {
    const text = `${nama || ''} ${pemrakarsa || ''} ${jenisKegiatan || ''}`.toLowerCase();
    if (text.includes('klinik') || text.includes('rs') || text.includes('rumah sakit') || text.includes('apotek') || text.includes('puskesmas') || text.includes('fasyankes') || text.includes('laboratorium medis')) {
      return 'Fasyankes';
    }
    if (text.includes('perumahan') || text.includes('cluster') || text.includes('kavling') || text.includes('residence')) {
      return 'Perumahan';
    }
    if (text.includes('toko') || text.includes('minimarket') || text.includes('supermarket') || text.includes('swalayan') || text.includes('mart') || text.includes('alfamart') || text.includes('indomaret')) {
      return 'Toko Modern';
    }
    if (text.includes('sppg') || text.includes('makan bergizi') || text.includes('mbg')) {
      return 'SPPG';
    }
    if (text.includes('industri') || text.includes('pabrik') || text.includes('pt') || text.includes('cv') || text.includes('textil') || text.includes('baterai') || text.includes('bengkel')) {
      return 'Industri';
    }
    return 'Lainnya';
  };

  const resetForm = () => {
    setFormData(prev => ({
      ...prev,
      nama_kegiatan: '',
      nama_pemrakarsa: '',
      alamat_lokasi: '',
      latitude: '',
      longitude: '',
      catatan_khusus: '',
      kategori: ''
    }));
    setSelectedDoc(null);
    setDocSearchQuery('');
  };

  const handleTabChange = (newTab: 'manual' | 'db') => {
    setTab(newTab);
    resetForm();
    setErrorMessage(null);
  };

  // Filtered documents for autocomplete search
  const filteredDokumens = useMemo(() => {
    if (!docSearchQuery.trim()) return dokumens.slice(0, 15);
    const q = docSearchQuery.toLowerCase();
    return dokumens.filter(d => 
      (d.nama_kegiatan || '').toLowerCase().includes(q) ||
      (d.nama_pemrakarsa || '').toLowerCase().includes(q) ||
      (d.lokasi_kegiatan || '').toLowerCase().includes(q) ||
      (d.jenis_dokumen || '').toLowerCase().includes(q)
    ).slice(0, 20);
  }, [dokumens, docSearchQuery]);

  const handleSelectDoc = (doc: any) => {
    setSelectedDoc(doc);
    setIsDropdownOpen(false);
    setDocSearchQuery(`${doc.nama_pemrakarsa || 'Tanpa Pemrakarsa'} - ${doc.nama_kegiatan || ''}`);
    
    // Auto-detect category
    const autoKat = detectKategori(doc.nama_kegiatan, doc.nama_pemrakarsa, doc.jenis_kegiatan);

    setFormData(prev => ({
      ...prev,
      nama_kegiatan: doc.nama_kegiatan || '',
      nama_pemrakarsa: doc.nama_pemrakarsa || '',
      alamat_lokasi: doc.lokasi_kegiatan || prev.alamat_lokasi || '',
      kategori: autoKat,
      latitude: doc.latitude ? String(doc.latitude) : prev.latitude,
      longitude: doc.longitude ? String(doc.longitude) : prev.longitude,
    }));
  };

  const handleClearSelectedDoc = () => {
    setSelectedDoc(null);
    setDocSearchQuery('');
    setFormData(prev => ({
      ...prev,
      nama_kegiatan: '',
      nama_pemrakarsa: '',
      alamat_lokasi: '',
      kategori: ''
    }));
  };

  const handleTimChange = (nama: string) => {
    setFormData(prev => {
      const isSelected = prev.tim_tugas.includes(nama);
      const nextTim = isSelected 
        ? prev.tim_tugas.filter(n => n !== nama) 
        : [...prev.tim_tugas, nama];
      return { ...prev, tim_tugas: nextTim };
    });
    setErrorMessage(null);
  };

  const handleSaksiChange = (nama: string) => {
    setFormData(prev => {
      const isSelected = prev.saksi.includes(nama);
      const nextSaksi = isSelected 
        ? prev.saksi.filter(n => n !== nama) 
        : [...prev.saksi, nama];
      return { ...prev, saksi: nextSaksi };
    });
  };

  // Find leader (highest hierarchy selected)
  const ketuaTim = useMemo(() => {
    if (formData.tim_tugas.length === 0) return null;
    const selectedOfficers = pegawai.filter(p => formData.tim_tugas.includes(p.nama));
    if (selectedOfficers.length === 0) return formData.tim_tugas[0];
    return selectedOfficers[0].nama;
  }, [formData.tim_tugas, pegawai]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validation: Minimal 1 orang Tim Pengawas
    if (formData.tim_tugas.length === 0) {
      setErrorMessage('Wajib memilih minimal 1 orang anggota Tim Pengawas yang bertugas.');
      const el = document.getElementById('section-tim-pengawas');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (!formData.nama_kegiatan.trim()) {
      setErrorMessage('Nama kegiatan/usaha wajib diisi.');
      return;
    }

    if (!formData.kategori) {
      setErrorMessage('Kategori usaha wajib dipilih.');
      return;
    }

    setLoading(true);

    try {
      // Sort based on official urutan_hierarki
      const sortedTim = [...formData.tim_tugas].sort((a, b) => {
        const pA = pegawai.find(p => p.nama === a);
        const pB = pegawai.find(p => p.nama === b);
        return (pA?.urutan_hierarki || 99) - (pB?.urutan_hierarki || 99);
      });
      
      const sortedSaksi = [...formData.saksi].sort((a, b) => {
        const pA = pegawai.find(p => p.nama === a);
        const pB = pegawai.find(p => p.nama === b);
        return (pA?.urutan_hierarki || 99) - (pB?.urutan_hierarki || 99);
      });

      const finalNomorNota = notaMode === 'pilih' && selectedNota 
        ? selectedNota.nomor_otomatis 
        : (previewNota?.nomor_otomatis || null);

      const finalNotaId = notaMode === 'pilih' && selectedNota 
        ? selectedNota.id 
        : null;

      const payload: any = {
        tanggal_kunjungan: formData.tanggal_kunjungan,
        kategori: formData.kategori,
        nama_kegiatan: formData.nama_kegiatan.trim(),
        nama_pemrakarsa: formData.nama_pemrakarsa.trim(),
        alamat_lokasi: formData.alamat_lokasi.trim(),
        tim_tugas: sortedTim.join(' | '),
        saksi: sortedSaksi.length > 0 ? sortedSaksi.join(' | ') : null,
        nomor_nota_dinas: finalNomorNota,
        nota_dinas_id: finalNotaId
      };

      if (formData.latitude) payload.latitude = formData.latitude;
      if (formData.longitude) payload.longitude = formData.longitude;

      const res = await fetch('/api/pengawasan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal menyimpan agenda pengawasan');

      const created = Array.isArray(resData.data) ? resData.data[0] : resData.data;
      const tokenGenerated = created?.token || 'DLH-SUCCESS';

      // Open Success Modal
      setCreatedAgenda({
        token: tokenGenerated,
        nama_kegiatan: formData.nama_kegiatan,
        tanggal_kunjungan: formData.tanggal_kunjungan,
        nomor_nota_dinas: created?.nomor_nota_dinas || finalNomorNota || undefined,
        nomor_bap: previewNota?.nomor_bap || `600.4/${(created?.nomor_nota_dinas || finalNomorNota || '').split('/')[1] || '001'}/BAP/17/${new Date().getFullYear()}`
      });

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat menyimpan agenda.');
    } finally {
      setLoading(false);
    }
  };

  const copyTokenLink = () => {
    if (!createdAgenda?.token) return;
    const url = `${window.location.origin}/pengawasan/token?token=${createdAgenda.token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6 font-sans pb-24">
        
        {/* HEADER CARD - IDENTIK DENGAN DASHBOARD PENGAWASAN */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-lg relative overflow-hidden">
          {/* Decorative Circle */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full border border-slate-200 opacity-50"></div>
          
          <div className="flex flex-col md:flex-row gap-5 items-start relative z-10">
            <Link 
              href="/pengawasan" 
              className="w-16 h-16 shrink-0 bg-indigo-500 text-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-md hover:bg-indigo-600 hover:-translate-y-1 hover:shadow-md transition-all"
              title="Kembali ke Dashboard Pengawasan"
            >
              <ArrowLeft size={32} />
            </Link>

            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 border-[3px] border-slate-200 flex items-center justify-center shadow-sm shrink-0">
              <CalendarPlus size={32} strokeWidth={2.5} />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                  Buat Agenda Pengawasan
                </h1>
                <span className="text-[11px] font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border-[2px] border-emerald-200 uppercase shadow-sm flex items-center gap-1.5">
                  <Sparkles size={12} className="text-emerald-600" /> Terpadu
                </span>
              </div>
              <p className="text-sm font-bold text-slate-600 mt-2 tracking-wide">
                Pendaftaran jadwal inspeksi dan penugasan tim verifikasi lapangan.
              </p>
            </div>
          </div>
        </div>

        {/* ERROR NOTIFICATION ALERT */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border-2 border-rose-200 text-rose-800 rounded-2xl font-bold flex items-center gap-3 shadow-sm animate-in fade-in duration-200">
            <AlertCircle size={20} className="shrink-0 text-rose-600" />
            <span className="text-sm">{errorMessage}</span>
          </div>
        )}

        {/* MAIN CARD CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-lg overflow-hidden">
          
          {/* TAB PILIHAN INPUT: MANUAL VS DATABASE */}
          <div className="flex border-b border-slate-200 bg-slate-50/70 p-2.5 gap-2">
            <button 
              type="button" 
              onClick={() => handleTabChange('manual')} 
              className={`flex-1 py-3.5 px-4 text-xs md:text-sm font-black uppercase tracking-wider rounded-xl transition-all flex justify-center items-center gap-2 ${
                tab === 'manual' 
                  ? 'bg-white text-slate-900 border-[2px] border-slate-200 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Edit3 size={18} className={tab === 'manual' ? 'text-teal-600' : 'text-slate-400'} />
              <span>Input Manual (Kegiatan Baru)</span>
            </button>
            <button 
              type="button" 
              onClick={() => handleTabChange('db')} 
              className={`flex-1 py-3.5 px-4 text-xs md:text-sm font-black uppercase tracking-wider rounded-xl transition-all flex justify-center items-center gap-2 ${
                tab === 'db' 
                  ? 'bg-white text-slate-900 border-[2px] border-slate-200 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Database size={18} className={tab === 'db' ? 'text-indigo-600' : 'text-slate-400'} />
              <span>Pilih Dari Riwayat Perizinan</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-7">
            
            {/* PENCARIAN & AUTOCOMPLETE DOKUMEN PERIZINAN */}
            {tab === 'db' && (
              <div className="p-5 md:p-6 bg-indigo-50/60 border-2 border-indigo-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-black text-indigo-950 uppercase tracking-widest flex items-center gap-2">
                    <Database size={16} className="text-indigo-600" />
                    Cari & Pilih Objek Perizinan
                  </label>
                  <span className="text-[11px] font-bold text-indigo-600 uppercase">
                    Tersedia {dokumens.length} data
                  </span>
                </div>

                {/* Selected Card or Search Input */}
                {selectedDoc ? (
                  <div className="p-4 bg-white border-2 border-indigo-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-indigo-900 uppercase">
                          {selectedDoc.nama_kegiatan}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                          {selectedDoc.jenis_dokumen || 'Dokumen'} {selectedDoc.tahun ? `(${selectedDoc.tahun})` : ''}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 uppercase">
                          Auto: {detectKategori(selectedDoc.nama_kegiatan, selectedDoc.nama_pemrakarsa, selectedDoc.jenis_kegiatan)}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-600 uppercase">
                        Pemrakarsa: <span className="text-slate-900">{selectedDoc.nama_pemrakarsa || '—'}</span>
                      </p>
                      {selectedDoc.lokasi_kegiatan && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin size={12} className="text-rose-500" /> {selectedDoc.lokasi_kegiatan}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleClearSelectedDoc}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-colors self-end sm:self-center"
                    >
                      <X size={14} /> Ganti Pilihan
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Ketik nama kegiatan, nama PT, atau pemrakarsa..."
                      value={docSearchQuery}
                      onChange={e => {
                        setDocSearchQuery(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      className="w-full bg-white border-2 border-indigo-200 rounded-xl pl-11 pr-4 py-3 text-xs md:text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all uppercase"
                    />

                    {/* Autocomplete Dropdown List */}
                    {isDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsDropdownOpen(false)}
                        />
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-indigo-200 rounded-xl shadow-xl max-h-72 overflow-y-auto z-20 custom-scrollbar divide-y divide-slate-100">
                          {filteredDokumens.length === 0 ? (
                            <div className="p-4 text-center text-xs font-bold text-slate-500 uppercase">
                              Tidak ada dokumen perizinan yang cocok dengan &quot;{docSearchQuery}&quot;
                            </div>
                          ) : (
                            filteredDokumens.map(d => (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => handleSelectDoc(d)}
                                className="w-full text-left p-3.5 hover:bg-indigo-50/70 transition-colors flex flex-col gap-1"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-black text-slate-900 uppercase">
                                    {d.nama_kegiatan}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0 uppercase">
                                    {d.jenis_dokumen || 'Dokumen'} {d.tahun ? `'${d.tahun}` : ''}
                                  </span>
                                </div>
                                <span className="text-[11px] font-bold text-slate-600 uppercase">
                                  Pemrakarsa: {d.nama_pemrakarsa || '—'}
                                </span>
                                {d.lokasi_kegiatan && (
                                  <span className="text-[10px] text-slate-400 line-clamp-1">
                                    {d.lokasi_kegiatan}
                                  </span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">
                  💡 Saat memilih dokumen, nama kegiatan, pemrakarsa, alamat, dan kategori usaha akan otomatis terisi dan tetap dapat disesuaikan.
                </p>
              </div>
            )}

            {/* INTEGRASI NOTA DINAS (BAGIAN ARSIP) */}
            <div className="p-5 md:p-6 bg-gradient-to-br from-indigo-50/70 via-white to-teal-50/70 border-2 border-indigo-200/80 rounded-2xl space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span>Integrasi Nota Dinas & Nomor BAP</span>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200">
                        Modul Arsip
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      Nomor nota dinas otomatis tersemat saat agenda dibuat dan terhubung ke Berita Acara (BAP).
                    </p>
                  </div>
                </div>

                {/* Mode Switcher */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
                  <button
                    type="button"
                    onClick={() => { setNotaMode('auto'); setSelectedNota(null); }}
                    className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                      notaMode === 'auto'
                        ? 'bg-white text-indigo-700 shadow-sm font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Otomatis Arsip
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotaMode('pilih')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                      notaMode === 'pilih'
                        ? 'bg-white text-indigo-700 shadow-sm font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pilih Dari Arsip
                  </button>
                </div>
              </div>

              {notaMode === 'auto' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-xs space-y-1">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">
                      Nomor Nota Dinas Pengawasan (Arsip)
                    </span>
                    <div className="font-mono text-sm md:text-base font-black text-slate-900 tracking-wide flex items-center gap-2">
                      {loadingNota ? (
                        <span className="text-xs text-slate-400 font-sans font-semibold">Memuat nomor urut...</span>
                      ) : (
                        <span>{previewNota?.nomor_otomatis || '600.4.6/....../17/PW/2026'}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Tercatat langsung di Bagian Arsip • Seksi Pengawasan
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-teal-100 shadow-xs space-y-1">
                    <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest block">
                      Nomor Berita Acara (BAP Terintegrasi)
                    </span>
                    <div className="font-mono text-sm md:text-base font-black text-slate-900 tracking-wide flex items-center gap-2">
                      {loadingNota ? (
                        <span className="text-xs text-slate-400 font-sans font-semibold">Memuat nomor BAP...</span>
                      ) : (
                        <span>{previewNota?.nomor_bap || '600.4/....../BAP/17/2026'}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Otomatis dicetak pada judul Berita Acara Lapangan
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">
                    Pilih Nota Dinas Yang Sudah Terdaftar di Arsip:
                  </label>
                  {selectedNota ? (
                    <div className="p-3.5 bg-white border-2 border-indigo-200 rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <span className="font-mono text-xs font-black text-indigo-900 block">
                          {selectedNota.nomor_otomatis}
                        </span>
                        <p className="text-xs text-slate-700 font-bold mt-0.5">
                          {selectedNota.nama_nota}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Tanggal: {selectedNota.tanggal_nota} • Bagian: {selectedNota.dari_bagian}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedNota(null)}
                        className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-black uppercase hover:bg-rose-100 transition-colors"
                      >
                        Ganti
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Ketik untuk mencari nomor atau perihal nota dinas di arsip..."
                        value={searchNotaQuery}
                        onChange={e => setSearchNotaQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-inner">
                        {arsipNotaList
                          .filter(n => {
                            if (!searchNotaQuery.trim()) return true;
                            const q = searchNotaQuery.toLowerCase();
                            return (n.nomor_otomatis || '').toLowerCase().includes(q) || (n.nama_nota || '').toLowerCase().includes(q);
                          })
                          .slice(0, 10)
                          .map(item => (
                            <div
                              key={item.id}
                              onClick={() => setSelectedNota(item)}
                              className="p-3 hover:bg-indigo-50/60 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-xs font-black text-indigo-700">
                                  {item.nomor_otomatis}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                  {item.tanggal_nota}
                                </span>
                              </div>
                              <p className="text-xs text-slate-800 font-semibold mt-0.5 truncate">
                                {item.nama_nota}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* BARIS 1: TANGGAL KUNJUNGAN & KATEGORI USAHA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Calendar size={15} className="text-amber-600" />
                  Tanggal Kunjungan Lapangan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="date"
                    required
                    value={formData.tanggal_kunjungan}
                    onChange={e => setFormData({...formData, tanggal_kunjungan: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Building2 size={15} className="text-teal-600" />
                  Kategori Sasaran Pengawasan <span className="text-rose-500">*</span>
                </label>
                <select 
                  required
                  value={formData.kategori}
                  onChange={e => setFormData({...formData, kategori: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase text-sm"
                >
                  <option value="" disabled>-- PILIH KATEGORI --</option>
                  <option value="Fasyankes">Fasyankes (Rumah Sakit / Klinik / Puskesmas)</option>
                  <option value="Industri">Industri / Pabrik</option>
                  <option value="Perumahan">Perumahan / Pemukiman</option>
                  <option value="Toko Modern">Toko Modern / Pasar Modern</option>
                  <option value="SPPG">SPPG (Satuan Pelayanan Pangan Bergizi)</option>
                  <option value="Lainnya">Lainnya (Hotel, Restoran, Gudang, Jasa, dll.)</option>
                </select>
              </div>
            </div>

            {/* BARIS 2: NAMA KEGIATAN & PEMRAKARSA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Building2 size={15} className="text-indigo-600" />
                  Nama Kegiatan / Objek Pengawasan <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={formData.nama_kegiatan}
                  onChange={e => setFormData({...formData, nama_kegiatan: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase text-sm"
                  placeholder="Contoh: PEMBANGUNAN KLINIK SEHAT PRATAMA"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <User size={15} className="text-indigo-600" />
                  Nama Pemrakarsa / Penanggung Jawab <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={formData.nama_pemrakarsa}
                  onChange={e => setFormData({...formData, nama_pemrakarsa: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase text-sm"
                  placeholder="Contoh: PT. MEDIKA KARYA SEJAHTERA / SUGIMIN"
                />
              </div>
            </div>

            {/* BARIS 3: ALAMAT LOKASI & TITIK KOORDINAT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <MapPin size={15} className="text-rose-500" />
                  Alamat / Lokasi Kunjungan Lapangan
                </label>
                <textarea 
                  rows={2}
                  value={formData.alamat_lokasi}
                  onChange={e => setFormData({...formData, alamat_lokasi: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs md:text-sm"
                  placeholder="Detail alamat, jalan, kelurahan, kecamatan, atau patokan lokasi..."
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2">
                  Titik Koordinat (Opsional)
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.latitude}
                    onChange={e => setFormData({...formData, latitude: e.target.value})}
                    placeholder="Latitude: -7.4249"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={formData.longitude}
                    onChange={e => setFormData({...formData, longitude: e.target.value})}
                    placeholder="Longitude: 111.0366"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* SEKSI: PILIH TIM PENGAWAS */}
            <div id="section-tim-pengawas" className="border-t border-slate-200 pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Shield size={16} className="text-teal-600" />
                    Pilih Tim Bertugas (Pengawas Lapangan) <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                    Centang pegawai yang ditugaskan. Urutan hierarki dan ketua tim otomatis diatur sistem.
                  </p>
                </div>

                {/* Filter Pegawai */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Cari nama pengawas..."
                    value={pegawaiSearch}
                    onChange={e => setPegawaiSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Status Tim Terpilih */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black px-3 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                  {formData.tim_tugas.length} Petugas Terpilih
                </span>
                {ketuaTim && (
                  <span className="text-xs font-black px-3 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 uppercase flex items-center gap-1.5">
                    👑 Ketua Tim: {ketuaTim}
                  </span>
                )}
              </div>

              {/* Grid Daftar Petugas Pengawas */}
              {pegawai.filter(p => !p.kategori || p.kategori === 'Tim Pengawas').length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {pegawai
                    .filter(p => !p.kategori || p.kategori === 'Tim Pengawas')
                    .filter(p => !pegawaiSearch.trim() || p.nama.toLowerCase().includes(pegawaiSearch.toLowerCase()))
                    .map(p => {
                      const isSelected = formData.tim_tugas.includes(p.nama);
                      const isLeader = ketuaTim === p.nama;

                      return (
                        <label 
                          key={`tim-${p.id || p.nama}`} 
                          className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-teal-50/80 border-teal-500 shadow-sm' 
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 mt-0.5 accent-teal-600 rounded border-slate-300" 
                            checked={isSelected}
                            onChange={() => handleTimChange(p.nama)}
                          />
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-black text-xs text-slate-900 uppercase leading-snug truncate">
                                {p.nama}
                              </span>
                              {isLeader && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 uppercase shrink-0">
                                  Ketua
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 mt-0.5 line-clamp-1">
                              {p.jabatan_dinas || 'Pengawas Lingkungan Hidup'}
                            </span>
                            {p.nip && p.nip !== '-' && (
                              <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                                NIP. {p.nip}
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                </div>
              ) : (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 font-bold text-xs uppercase">
                  Belum ada data pegawai di database Tim Pengawas.
                </div>
              )}
            </div>

            {/* SEKSI: PILIH SAKSI (OPSIONAL) */}
            <div className="border-t border-slate-200 pt-6 space-y-3">
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <UserCheck size={16} className="text-indigo-600" />
                  Pilih Saksi Kunjungan (Opsional)
                </label>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                  Pilih staf pendamping atau saksi perwakilan jika diperlukan.
                </p>
              </div>

              {pegawai.filter(p => p.kategori === 'Saksi').length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {pegawai
                    .filter(p => p.kategori === 'Saksi')
                    .map(p => {
                      const isSelected = formData.saksi.includes(p.nama);
                      return (
                        <label 
                          key={`saksi-${p.id || p.nama}`} 
                          className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-indigo-50/80 border-indigo-500 shadow-sm' 
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 mt-0.5 accent-indigo-600 rounded border-slate-300" 
                            checked={isSelected}
                            onChange={() => handleSaksiChange(p.nama)}
                          />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-black text-xs text-slate-900 uppercase leading-snug truncate">
                              {p.nama}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-slate-500 mt-0.5 line-clamp-1">
                              {p.jabatan_dinas || 'Saksi Lapangan'}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs">
                  Tidak ada pegawai khusus yang bertanda kategori Saksi. Anda dapat menambahkannya di Pengaturan Tim.
                </div>
              )}
            </div>

            {/* TOMBOL SIMPAN AGENDA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">
                {formData.tim_tugas.length === 0 ? (
                  <span className="text-rose-600 font-black">⚠️ Wajib pilih minimal 1 pengawas</span>
                ) : (
                  <span>✅ Siap disimpan ({formData.tim_tugas.length} pengawas ditugaskan)</span>
                )}
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/pengawasan/agenda"
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider text-center hover:bg-slate-50 transition-colors"
                >
                  Batal
                </Link>

                <button 
                  type="submit" 
                  disabled={loading || formData.tim_tugas.length === 0}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? <LottieLoader size={20} /> : <Save size={16} />}
                  <span>{loading ? 'Menyimpan...' : 'Simpan Agenda Pengawasan'}</span>
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>

      {/* SUCCESS MODAL POP-UP */}
      {createdAgenda && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-slate-200 rounded-[2rem] max-w-md w-full p-6 md:p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
            
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={36} strokeWidth={2.5} />
            </div>

            <div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Agenda Berhasil Dibuat!
              </h3>
              <p className="text-xs font-bold text-slate-600 mt-1 uppercase">
                {createdAgenda.nama_kegiatan}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Kunjungan: {new Date(createdAgenda.tanggal_kunjungan).toLocaleDateString('id-ID', { dateStyle: 'long' })}
              </p>
            </div>

            {/* Token Card */}
            <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl space-y-2">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">
                Kode Token Kunjungan Lapangan
              </span>
              <div className="font-mono text-2xl font-black text-slate-900 tracking-wider">
                {createdAgenda.token}
              </div>
              <p className="text-[10px] text-slate-400">
                Gunakan token ini untuk mengisi BAP melalui smartphone pengawas.
              </p>
              
              <button
                type="button"
                onClick={copyTokenLink}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-black uppercase tracking-wider transition-colors mt-2"
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Tautan Disalin!' : 'Salin Tautan Form Lapangan'}</span>
              </button>
            </div>

            {/* Integrasi Arsip & BAP Card */}
            {(createdAgenda.nomor_nota_dinas || createdAgenda.nomor_bap) && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-left space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Archive size={13} className="text-indigo-600" />
                    Terintegrasi Arsip
                  </span>
                  <Link
                    href="/arsip/nota-dinas"
                    className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 underline"
                  >
                    <span>Buka Arsip</span>
                    <ExternalLink size={10} />
                  </Link>
                </div>
                {createdAgenda.nomor_nota_dinas && (
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Nomor Nota Dinas</span>
                    <span className="font-mono text-xs font-black text-slate-900">{createdAgenda.nomor_nota_dinas}</span>
                  </div>
                )}
                {createdAgenda.nomor_bap && (
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Nomor Berita Acara (BAP)</span>
                    <span className="font-mono text-xs font-black text-teal-900">{createdAgenda.nomor_bap}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <Link
                href="/pengawasan/agenda"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
              >
                <span>Lihat di Agenda Aktif</span>
                <ExternalLink size={14} />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setCreatedAgenda(null);
                  resetForm();
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                + Buat Agenda Lainnya
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
