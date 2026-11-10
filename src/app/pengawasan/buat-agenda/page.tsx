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
  FileText, Archive, Plus, Trash2, Navigation, Layers
} from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';
import PengawasanSubNav from '@/components/PengawasanSubNav';

interface LocationItem {
  id: string;
  nama_kegiatan: string;
  nama_pemrakarsa: string;
  kategori: string;
  alamat_lokasi: string;
  latitude: string;
  longitude: string;
  mode: 'manual' | 'db';
  docSearchQuery: string;
  selectedDoc: any | null;
  isDropdownOpen?: boolean;
}

export default function BuatAgenda() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dokumens, setDokumens] = useState<any[]>([]);
  const [pegawai, setPegawai] = useState<any[]>([]);
  
  // Search filter for staff
  const [pegawaiSearch, setPegawaiSearch] = useState('');

  // Trip Shared State
  const [formData, setFormData] = useState({
    tanggal_kunjungan: new Date().toISOString().split('T')[0],
    tim_tugas: [] as string[],
    saksi: [] as string[]
  });

  // Multi-Location Stops (1 to 5 locations)
  const [locations, setLocations] = useState<LocationItem[]>([
    {
      id: 'loc-1',
      nama_kegiatan: '',
      nama_pemrakarsa: '',
      kategori: '',
      alamat_lokasi: '',
      latitude: '',
      longitude: '',
      mode: 'manual',
      docSearchQuery: '',
      selectedDoc: null,
      isDropdownOpen: false
    }
  ]);

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
    locations: { id?: number; nama_kegiatan: string; kategori: string; alamat_lokasi?: string }[];
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

  // Helper Location Manipulation
  const updateLocation = (index: number, patch: Partial<LocationItem>) => {
    setLocations(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  const addLocation = () => {
    if (locations.length >= 5) return;
    setLocations(prev => [
      ...prev,
      {
        id: `loc-${Date.now()}-${prev.length + 1}`,
        nama_kegiatan: '',
        nama_pemrakarsa: '',
        kategori: '',
        alamat_lokasi: '',
        latitude: '',
        longitude: '',
        mode: 'manual',
        docSearchQuery: '',
        selectedDoc: null,
        isDropdownOpen: false
      }
    ]);
  };

  const removeLocation = (index: number) => {
    if (locations.length <= 1) return;
    setLocations(prev => prev.filter((_, i) => i !== index));
  };

  const handleSelectDoc = (index: number, doc: any) => {
    const autoKat = detectKategori(doc.nama_kegiatan, doc.nama_pemrakarsa, doc.jenis_kegiatan);
    updateLocation(index, {
      selectedDoc: doc,
      isDropdownOpen: false,
      docSearchQuery: `${doc.nama_pemrakarsa || 'Tanpa Pemrakarsa'} - ${doc.nama_kegiatan || ''}`,
      nama_kegiatan: doc.nama_kegiatan || '',
      nama_pemrakarsa: doc.nama_pemrakarsa || '',
      alamat_lokasi: doc.lokasi_kegiatan || '',
      kategori: autoKat,
      latitude: doc.latitude ? String(doc.latitude) : '',
      longitude: doc.longitude ? String(doc.longitude) : ''
    });
  };

  const handleClearSelectedDoc = (index: number) => {
    updateLocation(index, {
      selectedDoc: null,
      docSearchQuery: '',
      isDropdownOpen: false,
      nama_kegiatan: '',
      nama_pemrakarsa: '',
      alamat_lokasi: '',
      kategori: '',
      latitude: '',
      longitude: ''
    });
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

    // Validate each location
    for (let i = 0; i < locations.length; i++) {
      const loc = locations[i];
      if (!loc.nama_kegiatan.trim()) {
        setErrorMessage(`Nama kegiatan/objek pada Lokasi ${i + 1} wajib diisi.`);
        return;
      }
      if (!loc.kategori) {
        setErrorMessage(`Kategori usaha pada Lokasi ${i + 1} wajib dipilih.`);
        return;
      }
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

      const itemsPayload = locations.map(loc => ({
        nama_kegiatan: loc.nama_kegiatan.trim(),
        nama_pemrakarsa: loc.nama_pemrakarsa.trim() || '-',
        kategori: loc.kategori || 'Lainnya',
        alamat_lokasi: loc.alamat_lokasi.trim(),
        latitude: loc.latitude ? loc.latitude.trim() : null,
        longitude: loc.longitude ? loc.longitude.trim() : null
      }));

      const payload = {
        tanggal_kunjungan: formData.tanggal_kunjungan,
        tim_tugas: sortedTim.join(' | '),
        saksi: sortedSaksi.length > 0 ? sortedSaksi.join(' | ') : null,
        nomor_nota_dinas: finalNomorNota,
        nota_dinas_id: finalNotaId,
        items: itemsPayload
      };

      const res = await fetch('/api/pengawasan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal menyimpan agenda pengawasan');

      const createdItems = Array.isArray(resData.data) ? resData.data : [resData.data];
      const tokenGenerated = resData.shared_token || createdItems[0]?.token || 'PGW-SUCCESS';

      // Open Success Modal
      setCreatedAgenda({
        token: tokenGenerated,
        locations: createdItems.map((c: any) => ({
          id: c.id,
          nama_kegiatan: c.nama_kegiatan,
          kategori: c.kategori,
          alamat_lokasi: c.alamat_lokasi
        })),
        tanggal_kunjungan: formData.tanggal_kunjungan,
        nomor_nota_dinas: resData.nomor_nota_dinas || finalNomorNota || undefined,
        nomor_bap: previewNota?.nomor_bap || `600.4/${(resData.nomor_nota_dinas || finalNomorNota || '').split('/')[1] || '001'}/BAP/17/${new Date().getFullYear()}`
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

  const resetAll = () => {
    setLocations([
      {
        id: `loc-${Date.now()}-1`,
        nama_kegiatan: '',
        nama_pemrakarsa: '',
        kategori: '',
        alamat_lokasi: '',
        latitude: '',
        longitude: '',
        mode: 'manual',
        docSearchQuery: '',
        selectedDoc: null,
        isDropdownOpen: false
      }
    ]);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6 font-sans pb-28">
        
        {/* SUB NAV PENGAWASAN */}
        <PengawasanSubNav />

        {/* HEADER CARD */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-indigo-50/70 rounded-full border border-indigo-100 opacity-60"></div>
          
          <div className="flex flex-col md:flex-row gap-5 items-start relative z-10">
            <Link 
              href="/pengawasan" 
              className="w-14 h-14 md:w-16 md:h-16 shrink-0 bg-indigo-600 text-white rounded-2xl border border-indigo-500 flex items-center justify-center shadow-md hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
              title="Kembali ke Dashboard Pengawasan"
            >
              <ArrowLeft size={30} />
            </Link>

            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-amber-100 text-amber-800 border-2 border-amber-200 flex items-center justify-center shadow-sm shrink-0">
              <CalendarPlus size={30} strokeWidth={2.5} />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  Buat Agenda Pengawasan
                </h1>
                <span className="text-[11px] font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase shadow-xs flex items-center gap-1.5">
                  <Sparkles size={12} className="text-emerald-600" /> Multi-Lokasi (1-5 Stop)
                </span>
              </div>
              <p className="text-xs md:text-sm font-bold text-slate-600 mt-1.5">
                Daftarkan 1 sampai 5 lokasi kunjungan dalam 1 surat tugas/perjalanan dengan 1 token bersama.
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

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SEKSI 1: INFORMASI PERJALANAN & NOTA DINAS (BERSAMA) */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                1
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  Jadwal & Administrasi Surat Tugas
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  Tanggal kunjungan dan nomor nota dinas yang menaungi seluruh lokasi pada perjalanan ini.
                </p>
              </div>
            </div>

            {/* BARIS TANGGAL */}
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Calendar size={15} className="text-amber-600" />
                Tanggal Kunjungan Lapangan <span className="text-rose-500">*</span>
              </label>
              <input 
                type="date"
                required
                value={formData.tanggal_kunjungan}
                onChange={e => setFormData({...formData, tanggal_kunjungan: e.target.value})}
                className="w-full md:w-72 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              />
            </div>

            {/* INTEGRASI NOTA DINAS (BAGIAN ARSIP) */}
            <div className="p-5 bg-gradient-to-br from-indigo-50/70 via-white to-teal-50/70 border-2 border-indigo-200/80 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
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
                      1 Nota Dinas bersama menaungi {locations.length} lokasi kunjungan pada agenda ini.
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
                        ? 'bg-white text-indigo-700 shadow-xs'
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
                        ? 'bg-white text-indigo-700 shadow-xs'
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
                      Tercatat otomatis di Bagian Arsip • Seksi Pengawasan
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
                      Otomatis dicetak pada setiap dokumen Berita Acara Lapangan
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
          </div>

          {/* SEKSI 2: DAFTAR LOKASI SASARAN PENGAWASAN (1 S.D. 5 LOKASI) */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xs">
                  2
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <span>Sasaran Lokasi Kunjungan Lapangan</span>
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                      {locations.length} / 5 Lokasi
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Setiap lokasi memiliki BAP checklist mandiri sesuai dengan kategori usahanya.
                  </p>
                </div>
              </div>

              {locations.length < 5 && (
                <button
                  type="button"
                  onClick={addLocation}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all hover:-translate-y-0.5 self-start sm:self-auto"
                >
                  <Plus size={16} />
                  <span>Tambah Lokasi Lain ({locations.length + 1})</span>
                </button>
              )}
            </div>

            {/* LIST OF LOCATION CARDS */}
            <div className="space-y-6">
              {locations.map((loc, idx) => {
                const filteredDocs = !loc.docSearchQuery.trim()
                  ? dokumens.slice(0, 15)
                  : dokumens.filter(d => {
                      const q = loc.docSearchQuery.toLowerCase();
                      return (
                        (d.nama_kegiatan || '').toLowerCase().includes(q) ||
                        (d.nama_pemrakarsa || '').toLowerCase().includes(q) ||
                        (d.lokasi_kegiatan || '').toLowerCase().includes(q)
                      );
                    }).slice(0, 15);

                return (
                  <div 
                    key={loc.id} 
                    className="border-2 border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden transition-all hover:border-slate-300"
                  >
                    {/* Header Card Lokasi */}
                    <div className="bg-slate-50/80 px-4 md:px-6 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                            Lokasi {idx + 1} {loc.nama_kegiatan ? `• ${loc.nama_kegiatan}` : '(Pemberhentian ' + (idx + 1) + ')'}
                          </span>
                          {loc.kategori && (
                            <span className="text-[10px] font-bold text-teal-700 uppercase">
                              Kategori: {loc.kategori}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {/* Tab Toggle Manual vs Database */}
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
                          <button
                            type="button"
                            onClick={() => updateLocation(idx, { mode: 'manual', selectedDoc: null, docSearchQuery: '' })}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                              loc.mode === 'manual'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Edit3 size={12} />
                            <span>Manual</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateLocation(idx, { mode: 'db' })}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                              loc.mode === 'db'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Database size={12} />
                            <span>Riwayat Perizinan</span>
                          </button>
                        </div>

                        {/* Tombol Hapus Lokasi (jika > 1) */}
                        {locations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLocation(idx)}
                            className="p-1.5 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                            title="Hapus Lokasi Ini"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Body Form Lokasi */}
                    <div className="p-4 md:p-6 space-y-5">
                      
                      {/* PENCARIAN & AUTOCOMPLETE DOKUMEN PERIZINAN JIKA MODE DB */}
                      {loc.mode === 'db' && (
                        <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                              <Database size={14} className="text-indigo-600" />
                              Pilih Dari Database Dokumen Lingkungan
                            </label>
                            <span className="text-[10px] font-bold text-indigo-600">
                              {dokumens.length} Dokumen Tersedia
                            </span>
                          </div>

                          {loc.selectedDoc ? (
                            <div className="p-3 bg-white border border-indigo-200 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-black text-indigo-900 uppercase">
                                    {loc.selectedDoc.nama_kegiatan}
                                  </span>
                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                                    {loc.selectedDoc.jenis_dokumen || 'Dokumen'} {loc.selectedDoc.tahun ? `(${loc.selectedDoc.tahun})` : ''}
                                  </span>
                                </div>
                                <p className="text-[11px] font-bold text-slate-600 uppercase">
                                  Pemrakarsa: <span className="text-slate-900">{loc.selectedDoc.nama_pemrakarsa || '—'}</span>
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleClearSelectedDoc(idx)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0"
                              >
                                <X size={12} /> Ganti
                              </button>
                            </div>
                          ) : (
                            <div className="relative">
                              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                              <input
                                type="text"
                                placeholder="Ketik nama kegiatan, nama PT, atau pemrakarsa..."
                                value={loc.docSearchQuery}
                                onChange={e => updateLocation(idx, { docSearchQuery: e.target.value, isDropdownOpen: true })}
                                onFocus={() => updateLocation(idx, { isDropdownOpen: true })}
                                className="w-full bg-white border border-indigo-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 uppercase"
                              />

                              {loc.isDropdownOpen && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => updateLocation(idx, { isDropdownOpen: false })}
                                  />
                                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-indigo-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-20 divide-y divide-slate-100">
                                    {filteredDocs.length === 0 ? (
                                      <div className="p-3 text-center text-xs font-bold text-slate-500 uppercase">
                                        Tidak ditemukan hasil untuk &quot;{loc.docSearchQuery}&quot;
                                      </div>
                                    ) : (
                                      filteredDocs.map(d => (
                                        <button
                                          key={d.id}
                                          type="button"
                                          onClick={() => handleSelectDoc(idx, d)}
                                          className="w-full text-left p-3 hover:bg-indigo-50/70 transition-colors flex flex-col gap-0.5"
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-black text-slate-900 uppercase">
                                              {d.nama_kegiatan}
                                            </span>
                                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 shrink-0 uppercase">
                                              {d.jenis_dokumen || 'Dokumen'}
                                            </span>
                                          </div>
                                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                                            Pemrakarsa: {d.nama_pemrakarsa || '—'}
                                          </span>
                                        </button>
                                      ))
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* BARIS FORM LOKASI: NAMA KEGIATAN & PEMRAKARSA */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Building2 size={13} className="text-indigo-600" />
                            Nama Kegiatan / Objek Pengawasan <span className="text-rose-500">*</span>
                          </label>
                          <input 
                            type="text"
                            required
                            value={loc.nama_kegiatan}
                            onChange={e => updateLocation(idx, { nama_kegiatan: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase text-xs md:text-sm"
                            placeholder="Contoh: PEMBANGUNAN KLINIK SEHAT PRATAMA"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <User size={13} className="text-indigo-600" />
                            Nama Pemrakarsa / Penanggung Jawab <span className="text-rose-500">*</span>
                          </label>
                          <input 
                            type="text"
                            required
                            value={loc.nama_pemrakarsa}
                            onChange={e => updateLocation(idx, { nama_pemrakarsa: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase text-xs md:text-sm"
                            placeholder="Contoh: PT. MEDIKA KARYA SEJAHTERA / SUGIMIN"
                          />
                        </div>
                      </div>

                      {/* BARIS KATEGORI & ALAMAT */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Layers size={13} className="text-teal-600" />
                            Kategori Sasaran Pengawasan <span className="text-rose-500">*</span>
                          </label>
                          <select 
                            required
                            value={loc.kategori}
                            onChange={e => updateLocation(idx, { kategori: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-black text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase text-xs"
                          >
                            <option value="" disabled>-- PILIH KATEGORI --</option>
                            <option value="Fasyankes">Fasyankes (Rumah Sakit / Klinik / Puskesmas)</option>
                            <option value="Industri">Industri / Pabrik</option>
                            <option value="Perumahan">Perumahan / Pemukiman</option>
                            <option value="Toko Modern">Toko Modern / Minimarket</option>
                            <option value="SPPG">SPPG (Satuan Pelayanan Pangan Bergizi)</option>
                            <option value="Lainnya">Lainnya (Hotel, Gudang, Jasa, Restoran)</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <MapPin size={13} className="text-rose-500" />
                            Alamat / Lokasi Kunjungan Lapangan
                          </label>
                          <input 
                            type="text"
                            value={loc.alamat_lokasi}
                            onChange={e => updateLocation(idx, { alamat_lokasi: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                            placeholder="Alamat, kelurahan, kecamatan, atau patokan..."
                          />
                        </div>
                      </div>

                      {/* KOORDINAT (OPSIONAL) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Titik Latitude (Opsional)
                          </label>
                          <input
                            type="text"
                            value={loc.latitude}
                            onChange={e => updateLocation(idx, { latitude: e.target.value })}
                            placeholder="-7.4249"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Titik Longitude (Opsional)
                          </label>
                          <input
                            type="text"
                            value={loc.longitude}
                            onChange={e => updateLocation(idx, { longitude: e.target.value })}
                            placeholder="111.0366"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* BUTTON TAMBAH LOKASI JIKA MASIH < 5 */}
            {locations.length < 5 ? (
              <button
                type="button"
                onClick={addLocation}
                className="w-full py-4 border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-2xl bg-teal-50/50 hover:bg-teal-50 text-teal-800 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <Plus size={18} />
                <span>Tambah Lokasi Kunjungan Lapangan Berikutnya ({locations.length + 1} dari 5)</span>
              </button>
            ) : (
              <div className="p-3 bg-slate-100 rounded-xl text-center text-xs font-black text-slate-600 uppercase">
                Maksimal 5 lokasi kunjungan per token telah tercapai.
              </div>
            )}
          </div>

          {/* SEKSI 3: TIM PENGAWAS & SAKSI (BERSAMA) */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs">
                3
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  Penugasan Tim Pengawas Lingkungan Hidup
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  Tim yang ditugaskan akan bertugas di seluruh lokasi rombongan pengawasan ini.
                </p>
              </div>
            </div>

            {/* FILTER & STATUS TIM */}
            <div id="section-tim-pengawas" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

              {/* GRID DAFTAR TIM PENGAWAS */}
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
                            ? 'bg-teal-50/80 border-teal-500 shadow-xs' 
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
            </div>

            {/* SEKSI SAKSI (OPSIONAL) */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div>
                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <UserCheck size={15} className="text-indigo-600" />
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
                              ? 'bg-indigo-50/80 border-indigo-500 shadow-xs' 
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
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs font-semibold">
                  Tidak ada pegawai khusus kategori Saksi.
                </div>
              )}
            </div>

            {/* TOMBOL SIMPAN AGENDA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">
                {formData.tim_tugas.length === 0 ? (
                  <span className="text-rose-600 font-black">⚠️ Wajib pilih minimal 1 pengawas</span>
                ) : (
                  <span>✅ Siap disimpan ({locations.length} lokasi • {formData.tim_tugas.length} pengawas)</span>
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
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  {loading ? <LottieLoader size={20} /> : <Save size={16} />}
                  <span>{loading ? 'Menyimpan...' : `Simpan Agenda (${locations.length} Lokasi)`}</span>
                </button>
              </div>
            </div>

          </div>

        </form>
      </div>

      {/* SUCCESS MODAL POP-UP */}
      {createdAgenda && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-slate-200 rounded-[2rem] max-w-lg w-full p-6 md:p-8 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 size={36} strokeWidth={2.5} />
            </div>

            <div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Agenda Rombongan Berhasil Dibuat!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kunjungan: {new Date(createdAgenda.tanggal_kunjungan).toLocaleDateString('id-ID', { dateStyle: 'long' })}
              </p>
            </div>

            {/* Token Card */}
            <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl space-y-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                Kode Token Kunjungan Lapangan (Bersama)
              </span>
              <div className="font-mono text-2xl md:text-3xl font-black text-slate-900 tracking-wider">
                {createdAgenda.token}
              </div>
              <p className="text-[10px] text-slate-400">
                1 kode token ini dapat digunakan tim pengawas di lapangan untuk membuka seluruh {createdAgenda.locations.length} lokasi kunjungan.
              </p>
              
              <button
                type="button"
                onClick={copyTokenLink}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-black uppercase tracking-wider transition-colors mt-2"
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Tautan Disalin!' : 'Salin Tautan Dashboard Lapangan'}</span>
              </button>
            </div>

            {/* Daftar Lokasi Dalam Token */}
            <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-left space-y-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                Daftar Lokasi Terdaftar ({createdAgenda.locations.length} Lokasi):
              </span>
              <div className="space-y-1.5">
                {createdAgenda.locations.map((loc, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-teal-100 text-teal-800 font-black text-[10px] flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-bold text-slate-800 truncate uppercase">
                        {loc.nama_kegiatan}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase shrink-0">
                      {loc.kategori}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Integrasi Arsip & BAP Card */}
            {(createdAgenda.nomor_nota_dinas || createdAgenda.nomor_bap) && (
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-left space-y-2">
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
                href={`/pengawasan/token?token=${createdAgenda.token}`}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
              >
                <span>Buka Dashboard Lapangan Token Ini</span>
                <ExternalLink size={14} />
              </Link>

              <Link
                href="/pengawasan/agenda"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                <span>Lihat di Agenda Aktif</span>
                <ExternalLink size={14} />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setCreatedAgenda(null);
                  resetAll();
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                + Buat Agenda Baru
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
