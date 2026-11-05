'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  PenTool, 
  Upload, 
  User, 
  X, 
  Plus, 
  Search, 
  Check, 
  Copy, 
  CheckCircle2, 
  FileText, 
  Download,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';
import klasifikasiData from '@/data/klasifikasi.json';

export default function TambahNotaDinasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSavingNomor, setIsSavingNomor] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Data Form
  const [pemohonId, setPemohonId] = useState('');
  const [namaNota, setNamaNota] = useState('');
  const [yth, setYth] = useState('Kepala Dinas Lingkungan Hidup Kab. Sragen');
  const [sifat, setSifat] = useState('Biasa');
  const [lampiran, setLampiran] = useState('-');
  const [tanggalNota, setTanggalNota] = useState(new Date().toISOString().split('T')[0]);
  const [dariBagian, setDariBagian] = useState('Umum');
  const [isSisipan, setIsSisipan] = useState(false);
  const [nomorSisipan, setNomorSisipan] = useState('');
  const [petugasList, setPetugasList] = useState<string[]>(['']);
  const [keterangan, setKeterangan] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Klasifikasi (khusus Umum)
  const [klasifikasiSearch, setKlasifikasiSearch] = useState('');
  const [selectedKlasifikasi, setSelectedKlasifikasi] = useState('600.4 - Pengelolaan Lingkungan Hidup');
  const [categoryFilter, setCategoryFilter] = useState('600');

  // Anggota list
  const [anggota, setAnggota] = useState<any[]>([]);

  // State Nomor Terbit & Tersimpan
  const [previewNomor, setPreviewNomor] = useState('');
  const [savedNotaId, setSavedNotaId] = useState<number | null>(null);
  const [savedNomor, setSavedNomor] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const filteredKlasifikasi = useMemo(() => {
    let list = klasifikasiData as any[];
    if (categoryFilter !== 'SEMUA') {
      list = list.filter(k => k.code.startsWith(categoryFilter));
    }
    if (!klasifikasiSearch.trim()) {
      return list.slice(0, 100);
    }
    const q = klasifikasiSearch.toLowerCase().trim();
    return list.filter((k: any) => 
      k.name.toLowerCase().includes(q) || 
      k.code.toLowerCase().includes(q)
    ).slice(0, 100);
  }, [klasifikasiSearch, categoryFilter]);

  const totalMatchesCount = useMemo(() => {
    let list = klasifikasiData as any[];
    if (categoryFilter !== 'SEMUA') {
      list = list.filter(k => k.code.startsWith(categoryFilter));
    }
    if (!klasifikasiSearch.trim()) return list.length;
    const q = klasifikasiSearch.toLowerCase().trim();
    return list.filter((k: any) => 
      k.name.toLowerCase().includes(q) || 
      k.code.toLowerCase().includes(q)
    ).length;
  }, [klasifikasiSearch, categoryFilter]);

  const addPetugas = () => setPetugasList([...petugasList, '']);
  const removePetugas = (idx: number) => {
    const newArr = [...petugasList];
    newArr.splice(idx, 1);
    setPetugasList(newArr);
  };
  const updatePetugas = (idx: number, val: string) => {
    const newArr = [...petugasList];
    newArr[idx] = val;
    setPetugasList(newArr);
  };

  useEffect(() => {
    fetch('/api/pengaturan/anggota-bidang')
      .then(res => res.json())
      .then(res => setAnggota(res.data || []))
      .catch(console.error);
  }, []);

  // Fetch / kalkulasi pratinjau nomor otomatis secara real-time
  const fetchPreviewNomor = useCallback(async () => {
    if (savedNotaId) return; // Jika sudah tersimpan permanen, tidak perlu ganti preview

    try {
      const params = new URLSearchParams({
        action: 'next-number',
        tanggal: tanggalNota,
        bagian: dariBagian,
        kode_klasifikasi: selectedKlasifikasi || klasifikasiSearch,
        is_sisipan: isSisipan ? 'true' : 'false',
        nomor_sisipan: nomorSisipan
      });
      const res = await fetch(`/api/arsip-nota-dinas?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.nomor_otomatis) {
          setPreviewNomor(json.nomor_otomatis);
        }
      }
    } catch (err) {
      console.error('Failed to fetch preview nomor:', err);
    }
  }, [tanggalNota, dariBagian, selectedKlasifikasi, klasifikasiSearch, isSisipan, nomorSisipan, savedNotaId]);

  useEffect(() => {
    fetchPreviewNomor();
  }, [fetchPreviewNomor]);

  const handleTanggalChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTanggalNota(val);
    
    if (val) {
      try {
        const res = await fetch('/api/arsip-nota-dinas/check-backdate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tanggal: val })
        });
        const data = await res.json();
        setIsSisipan(Boolean(data.isBackdate));
      } catch (err) {
        console.error('Failed to check backdate:', err);
      }
    }
  };

  // 1. Simpan Data & Terbitkan Nomor Resmi SEBELUM Upload
  const handleSaveAndGenerateNomor = async () => {
    if (!pemohonId) {
      alert('Pilih Pemohon (Anggota Bidang) terlebih dahulu!');
      return;
    }
    if (!namaNota.trim()) {
      alert('Isi Nota Dinas (Subjek / Hal) wajib diisi!');
      return;
    }
    if (!tanggalNota) {
      alert('Tanggal Nota wajib diisi!');
      return;
    }
    if (dariBagian === 'Umum' && !selectedKlasifikasi && !klasifikasiSearch) {
      alert('Pilih atau ketik Kode Klasifikasi untuk Bagian Umum!');
      return;
    }

    setIsSavingNomor(true);
    setErrorMsg('');

    try {
      const payload = {
        pemohon_id: pemohonId,
        nama_nota: namaNota,
        tanggal_nota: tanggalNota,
        dari_bagian: dariBagian,
        kode_klasifikasi: selectedKlasifikasi || klasifikasiSearch,
        yth,
        sifat,
        lampiran,
        petugas: petugasList.filter(p => p.trim() !== ''),
        is_sisipan: isSisipan,
        nomor_sisipan: nomorSisipan,
        keterangan: keterangan || null,
        file_url: null // belum di-upload pada tahap ini
      };

      const res = await fetch('/api/arsip-nota-dinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Gagal menyimpan dan menerbitkan nomor');
      }

      const returnedId = res.headers.get('X-Nota-Id');
      const returnedNomorRaw = res.headers.get('X-Nomor-Otomatis');
      const returnedNomor = returnedNomorRaw ? decodeURIComponent(returnedNomorRaw) : previewNomor;

      // Handle file download jika berupa DOCX
      const contentType = res.headers.get('Content-Type');
      if (contentType && contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Nota_Dinas_${dariBagian}_${returnedNomor.replace(/\//g, '_')}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }

      if (returnedId) {
        setSavedNotaId(Number(returnedId));
      }
      setSavedNomor(returnedNomor);
      setSuccessMsg(`Nomor resmi berhasil diterbitkan: ${returnedNomor}. File template Word otomatis diunduh!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan');
    } finally {
      setIsSavingNomor(false);
    }
  };

  // 2. Simpan Lampiran (setelah nomor sudah disimpan) atau Simpan Semua Sekaligus
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      let fileUrl = '';
      if (file) {
        const uploadData = new FormData();
        uploadData.append('file', file);
        const uploadRes = await fetch('/api/arsip-nota-dinas/upload', {
          method: 'POST',
          body: uploadData
        });
        const uploadResult = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadResult.error || 'Gagal mengunggah file lampiran');
        fileUrl = uploadResult.url;
      }

      // Kasus A: Jika nomor sudah pernah disimpan sebelumnya, kita cukup UPDATE data lampiran & keterangan
      if (savedNotaId) {
        if (fileUrl || keterangan) {
          const updateRes = await fetch('/api/arsip-nota-dinas', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: savedNotaId,
              file_url: fileUrl || undefined,
              keterangan: keterangan || undefined
            })
          });
          if (!updateRes.ok) {
            const errData = await updateRes.json().catch(() => ({}));
            throw new Error(errData.error || 'Gagal memperbarui lampiran nota dinas');
          }
        }
        alert('Data Nota Dinas dan Lampiran berhasil disimpan lengkap!');
        router.push('/arsip/nota-dinas');
        return;
      }

      // Kasus B: Pengguna belum klik simpan nomor di atas, langsung klik simpan di bawah
      const payload = {
        pemohon_id: pemohonId,
        nama_nota: namaNota,
        tanggal_nota: tanggalNota,
        dari_bagian: dariBagian,
        kode_klasifikasi: selectedKlasifikasi || klasifikasiSearch,
        yth,
        sifat,
        lampiran,
        petugas: petugasList.filter(p => p.trim() !== ''),
        is_sisipan: isSisipan,
        nomor_sisipan: nomorSisipan,
        keterangan: keterangan || null,
        file_url: fileUrl || null
      };

      const res = await fetch('/api/arsip-nota-dinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Terjadi kesalahan saat registrasi nota dinas');
      }

      const contentType = res.headers.get('Content-Type');
      if (contentType && contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Nota_Dinas_${dariBagian}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }

      alert('Nota Dinas berhasil diregistrasi!');
      router.push('/arsip/nota-dinas');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNomor = () => {
    const textToCopy = savedNomor || previewNomor;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-md">
        <Link 
          href="/arsip/nota-dinas" 
          className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-700 border border-slate-200 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 transition-all shrink-0"
          title="Kembali ke Buku Register"
        >
          <ArrowLeft size={22} />
        </Link>
        <div className="w-14 h-14 shrink-0 rounded-2xl bg-fuchsia-500 text-white flex items-center justify-center shadow-sm">
          <PenTool size={28} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">
            Registrasi Nota Dinas
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Terbitkan nomor resmi otomatis, unduh template surat, dan unggah berkas arsip.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs md:text-sm font-bold flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs md:text-sm font-bold flex items-center gap-2">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* CARD 1: INFORMASI UTAMA NOTA DINAS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-fuchsia-100 text-fuchsia-700 text-xs flex items-center justify-center font-black">1</span>
              Informasi Pemohon & Isi Nota Dinas
            </h2>
            <span className="text-xs font-semibold text-slate-400">Wajib Diisi</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Pemohon (Anggota Bidang) <span className="text-red-500">*</span>
            </label>
            <select 
              value={pemohonId} 
              onChange={e => setPemohonId(e.target.value)}
              required 
              disabled={Boolean(savedNotaId)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-4 py-3 focus:bg-white focus:border-fuchsia-500 transition-all outline-none cursor-pointer disabled:opacity-60"
            >
              <option value="">- Pilih Pemohon -</option>
              {anggota.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama} {a.jabatan ? `(${a.jabatan})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Isi Nota Dinas (Subjek / Hal Ringkas) <span className="text-red-500">*</span>
            </label>
            <textarea 
              value={namaNota} 
              onChange={e => setNamaNota(e.target.value)}
              required 
              disabled={Boolean(savedNotaId)}
              placeholder="Contoh: Permohonan izin pelaksanaan koordinasi lapangan pengawasan..." 
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl p-4 focus:bg-white focus:border-fuchsia-500 transition-all outline-none resize-none disabled:opacity-60" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Yth. Tujuan (Template) <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={yth} 
                onChange={e => setYth(e.target.value)}
                disabled={Boolean(savedNotaId)}
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-xl px-4 py-3 focus:bg-white focus:border-fuchsia-500 transition-all outline-none disabled:opacity-60" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Sifat (Template)
              </label>
              <input 
                type="text" 
                value={sifat} 
                onChange={e => setSifat(e.target.value)}
                disabled={Boolean(savedNotaId)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-xl px-4 py-3 focus:bg-white focus:border-fuchsia-500 transition-all outline-none disabled:opacity-60" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Lampiran (Template)
              </label>
              <input 
                type="text" 
                value={lampiran} 
                onChange={e => setLampiran(e.target.value)}
                disabled={Boolean(savedNotaId)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-xl px-4 py-3 focus:bg-white focus:border-fuchsia-500 transition-all outline-none disabled:opacity-60" 
              />
            </div>
          </div>

          {/* Tim Petugas */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tim Petugas / Yang Melaksanakan Tugas (Template Word)
            </label>
            {petugasList.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <User size={16} className="absolute left-3 top-3 text-slate-400" />
                  <select 
                    value={p}
                    onChange={(e) => updatePetugas(idx, e.target.value)}
                    disabled={Boolean(savedNotaId)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-xl pl-9 pr-4 py-2.5 focus:bg-white focus:border-fuchsia-500 transition-all outline-none cursor-pointer disabled:opacity-60" 
                  >
                    <option value="">- Pilih Petugas -</option>
                    {anggota.map((a) => (
                      <option key={a.id} value={a.nama}>
                        {a.nama}
                      </option>
                    ))}
                  </select>
                </div>
                {petugasList.length > 1 && !savedNotaId && (
                  <button 
                    type="button" 
                    onClick={() => removePetugas(idx)} 
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-slate-200"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            {!savedNotaId && (
              <button 
                type="button" 
                onClick={addPetugas} 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100 border border-fuchsia-200 px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider"
              >
                <Plus size={14} /> Tambah Petugas
              </button>
            )}
          </div>

          {/* Tanggal & Bagian */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Tanggal Nota <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                value={tanggalNota} 
                onChange={handleTanggalChange}
                disabled={Boolean(savedNotaId)}
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-4 py-3 focus:bg-white focus:border-fuchsia-500 transition-all outline-none cursor-pointer disabled:opacity-60" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Asal Bagian <span className="text-red-500">*</span>
              </label>
              <select 
                value={dariBagian}
                onChange={(e) => setDariBagian(e.target.value)}
                disabled={Boolean(savedNotaId)}
                required 
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-4 py-3 focus:bg-white focus:border-fuchsia-500 transition-all outline-none cursor-pointer uppercase disabled:opacity-60"
              >
                <option value="Umum">Umum / Sekretariat</option>
                <option value="Perizinan">Perizinan (PL)</option>
                <option value="Pengaduan">Pengaduan (PG)</option>
                <option value="Pengawasan">Pengawasan (PW)</option>
              </select>
            </div>
          </div>

          {/* SISIPAN BLOCK */}
          <div className="bg-sky-50/60 border border-sky-200 p-4 rounded-2xl space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={isSisipan}
                onChange={(e) => !savedNotaId && setIsSisipan(e.target.checked)}
                disabled={Boolean(savedNotaId)}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Gunakan Nomor Sisipan (Manual Backdate)
              </span>
            </label>

            {isSisipan && (
              <div className="pt-1 pl-7 space-y-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Ketik Nomor Urut Sisipan (Misal: 015.1 atau 001.1.1) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={nomorSisipan}
                  onChange={e => setNomorSisipan(e.target.value)}
                  disabled={Boolean(savedNotaId)}
                  required={isSisipan}
                  placeholder="Misal: 015.1" 
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-4 py-2.5 outline-none focus:border-sky-500" 
                />
              </div>
            )}
          </div>

          {/* PENGATURAN KODE KLASIFIKASI (BAGIAN UMUM) - PANEL INLINE TERBUKA TANPA DROPDOWN */}
          {dariBagian === 'Umum' && (
            <div className="bg-fuchsia-50/50 border border-fuchsia-200 p-5 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-fuchsia-200/70 pb-3">
                <div>
                  <label className="block text-xs font-black text-fuchsia-950 uppercase tracking-wider">
                    Kode Klasifikasi Surat (Bagian Umum) <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Daftar master klasifikasi kearsipan terbuka langsung di bawah ini. Anda dapat mencari, memfilter per kategori, atau klik baris untuk memilih.
                  </p>
                </div>

                {/* Badge Kode Terpilih */}
                {selectedKlasifikasi && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-fuchsia-100 border border-fuchsia-300 rounded-lg text-xs font-bold text-fuchsia-900 shrink-0">
                    <CheckCircle2 size={13} className="text-fuchsia-700" />
                    <span>Terpilih: {selectedKlasifikasi.split(' - ')[0]}</span>
                  </div>
                )}
              </div>

              {/* Kolom Pencarian Langsung */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Cari kode atau nama klasifikasi (misal: 600, sampah, limbah, izin, 800, pegawai)..." 
                  value={klasifikasiSearch}
                  onChange={(e) => setKlasifikasiSearch(e.target.value)}
                  disabled={Boolean(savedNotaId)}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs font-medium rounded-xl pl-9 pr-4 py-2.5 focus:border-fuchsia-500 outline-none shadow-sm"
                />
              </div>

              {/* Tombol Kategori Cepat */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Kelompok:</span>
                {[
                  { label: '600 LH & PU (277)', val: '600' },
                  { label: 'Semua (2.578)', val: 'SEMUA' },
                  { label: '800 Kepegawaian (188)', val: '800' },
                  { label: '000 Umum & Perlengkapan', val: '000' },
                  { label: '900 Keuangan Daerah', val: '900' }
                ].map((cat) => (
                  <button
                    key={cat.val}
                    type="button"
                    onClick={() => setCategoryFilter(cat.val)}
                    disabled={Boolean(savedNotaId)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                      categoryFilter === cat.val
                        ? 'bg-fuchsia-600 text-white border-fuchsia-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* DAFTAR MASTER KLASIFIKASI INLINE (TIDAK DROPDOWN MELAYANG) */}
              <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center text-[11px] font-bold text-slate-600 uppercase">
                  <span>Daftar Klasifikasi ({totalMatchesCount} data)</span>
                  <span className="text-slate-400 font-normal">Klik baris untuk memilih</span>
                </div>

                <div className="h-64 overflow-y-auto divide-y divide-slate-100">
                  {filteredKlasifikasi.map((k: any, i: number) => {
                    const isSelected = selectedKlasifikasi.startsWith(k.code);
                    return (
                      <div 
                        key={i} 
                        onClick={() => {
                          if (savedNotaId) return;
                          setSelectedKlasifikasi(`${k.code} - ${k.name}`);
                        }}
                        className={`px-4 py-2.5 cursor-pointer flex flex-col transition-colors ${
                          isSelected 
                            ? 'bg-fuchsia-100/70 border-l-4 border-fuchsia-600' 
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                            isSelected 
                              ? 'bg-fuchsia-600 text-white' 
                              : 'bg-slate-100 text-fuchsia-700 border border-slate-200'
                          }`}>
                            {k.code}
                          </span>
                          {isSelected && (
                            <span className="text-[11px] font-bold text-fuchsia-700 flex items-center gap-1">
                              <Check size={12} /> Terpilih
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-1 leading-snug ${
                          isSelected ? 'font-semibold text-slate-900' : 'text-slate-600'
                        }`}>
                          {k.name}
                        </p>
                      </div>
                    );
                  })}
                  {filteredKlasifikasi.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Tidak ada kode klasifikasi yang cocok dengan kata kunci & kategori.
                    </div>
                  )}
                </div>
              </div>

              {/* Rincian Pilihan & Tombol Reset */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="font-bold text-slate-500 uppercase shrink-0">Kode Aktif:</span>
                  <span className="font-bold text-slate-900 truncate">
                    {selectedKlasifikasi || 'Belum Dipilih'}
                  </span>
                </div>
                {selectedKlasifikasi && !savedNotaId && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setSelectedKlasifikasi('600.4 - Pengelolaan Lingkungan Hidup');
                      setKlasifikasiSearch('');
                      setCategoryFilter('600');
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-fuchsia-700 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0 text-left sm:text-right"
                  >
                    Kembalikan ke Default (600.4)
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* CARD 2: KOLOM MENAMPILKAN NOMOR SEBELUM DI UPLOAD & TOMBOL SIMPAN NOMOR */}
        <div className={`p-6 md:p-8 rounded-3xl border shadow-md transition-all ${
          savedNotaId 
            ? 'bg-emerald-50/40 border-emerald-300 shadow-emerald-100' 
            : 'bg-white border-fuchsia-300 ring-2 ring-fuchsia-100 shadow-md'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-black ${
                  savedNotaId ? 'bg-emerald-600 text-white' : 'bg-fuchsia-600 text-white'
                }`}>
                  2
                </span>
                <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  Nomor Nota Dinas (Terbitkan & Simpan Nomor)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {savedNotaId 
                  ? 'Nomor nota dinas telah resmi tersimpan di Buku Register database.' 
                  : 'Lihat pratinjau nomor resmi dan simpan ke database sebelum mengunggah berkas lampiran.'}
              </p>
            </div>

            {/* Status Badge */}
            <div>
              {savedNotaId ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  TERDAFTAR DI DATABASE (ID #{savedNotaId})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Sparkles size={13} className="text-amber-600" />
                  Pratinjau Nomor Otomatis
                </span>
              )}
            </div>
          </div>

          {/* Display Nomor Field & Actions */}
          <div className="mt-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FileText size={18} />
                </div>
                <input 
                  type="text" 
                  readOnly
                  value={savedNomor || previewNomor || 'Menghitung nomor otomatis...'} 
                  className={`w-full font-mono text-sm sm:text-base font-bold rounded-2xl pl-11 pr-4 py-3.5 border outline-none select-all transition-all ${
                    savedNotaId 
                      ? 'bg-emerald-50/80 border-emerald-400 text-emerald-900 font-black' 
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  placeholder="600.4.x/..."
                />
              </div>

              <button 
                type="button" 
                onClick={handleCopyNomor}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-2xl text-xs font-bold border border-slate-300 flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider shrink-0"
                title="Salin Nomor Nota Dinas"
              >
                {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                <span>{copied ? 'Tersalin' : 'Salin Nomor'}</span>
              </button>

              {/* Tombol Simpan & Terbitkan Nomor (SEBELUM UPLOAD) */}
              {!savedNotaId && (
                <button 
                  type="button"
                  onClick={handleSaveAndGenerateNomor}
                  disabled={isSavingNomor}
                  className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-6 py-3.5 rounded-2xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 uppercase tracking-wider shrink-0 disabled:opacity-60"
                >
                  {isSavingNomor ? <LottieLoader size={18} /> : <Save size={16} />}
                  <span>Simpan & Terbitkan Nomor</span>
                </button>
              )}
            </div>

            {savedNotaId ? (
              <div className="bg-emerald-100/60 border border-emerald-300 p-3.5 rounded-xl text-xs text-emerald-900 font-medium leading-relaxed">
                🎉 <strong>Nomor nota dinas telah berhasil dicatat!</strong> Template Word (.docx) dengan nomor resmi ini telah diunduh otomatis. Silakan cetak/tandatangani berkas tersebut, lalu Anda dapat langsung mengunggah file hasil scan/PDF di bawah ini (opsional).
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-medium">
                💡 <strong>Tips:</strong> Klik tombol <strong>Simpan & Terbitkan Nomor</strong> di atas untuk memesan nomor urut secara permanen di buku register. Nomor akan langsung tercatat dan template Word otomatis diunduh untuk dapat langsung dipakai.
              </p>
            )}
          </div>
        </div>

        {/* CARD 3: LAMPIRAN NOTA DINAS (OPSIONAL) & KETERANGAN */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs flex items-center justify-center font-black">3</span>
              Lampiran Dokumen & Keterangan (Opsional)
            </h2>
            <span className="text-xs font-semibold text-slate-400">Dapat Diunggah Sekarang atau Nanti</span>
          </div>

          {/* 4. LAMPIRAN NOTA DINAS (OPSIONAL) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              4. Lampiran Nota Dinas (Opsional)
            </label>
            <div className="relative overflow-hidden w-full bg-slate-50 border-2 border-dashed border-slate-300 hover:border-fuchsia-500 rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group">
              <input 
                type="file" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
              />
              <Upload size={32} className="text-slate-400 group-hover:text-fuchsia-600 transition-colors" />
              <p className="text-xs md:text-sm font-bold text-slate-700">
                {file ? (
                  <span className="text-fuchsia-600 font-bold">Berkas terpilih: {file.name}</span>
                ) : (
                  'Klik atau seret file ke sini (PDF/Word/Images)'
                )}
              </p>
              <p className="text-[11px] text-slate-400">Format yang didukung: PDF, DOCX, JPG, PNG</p>
            </div>
          </div>

          {/* 5. KETERANGAN (OPSIONAL) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              5. Keterangan (Opsional)
            </label>
            <textarea 
              value={keterangan} 
              onChange={e => setKeterangan(e.target.value)}
              placeholder="Tambahkan catatan khusus jika ada..." 
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs md:text-sm font-medium rounded-xl p-4 focus:bg-white focus:border-fuchsia-500 transition-all outline-none resize-none" 
            />
          </div>
        </div>

        {/* TOMBOL AKSI BAWAH */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <Link 
            href="/arsip/nota-dinas" 
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold uppercase tracking-wider text-center transition-all"
          >
            Kembali ke Buku Register
          </Link>

          {savedNotaId ? (
            <button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <LottieLoader size={18} /> : <CheckCircle2 size={16} />}
              <span>{file ? 'Unggah Lampiran & Selesai' : 'Selesai & Tutup Form'}</span>
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full sm:w-auto px-8 py-3.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <LottieLoader size={18} /> : <Save size={16} />}
              <span>Simpan Lengkap & Terbitkan Nomor</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
