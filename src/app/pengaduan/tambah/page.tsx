'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  AlertTriangle, 
  Key, 
  Copy, 
  Check, 
  ExternalLink, 
  PlusCircle, 
  FileCheck, 
  User, 
  MapPin, 
  Phone, 
  Calendar,
  FileText,
  Sparkles,
  Smartphone,
  Send
} from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

// Generator token ADN-XXXXXX (pasti 6 karakter kapital tanpa karakter ambigu)
function generateToken(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ADN-${code}`;
}

export default function BuatAgendaPengaduanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  // Mode: 'token_only' (cepat buat token untuk mobile BIDIDLH.apk) vs 'lengkap' (input langsung semua data di web)
  const [mode, setMode] = useState<'token_only' | 'lengkap'>('token_only');

  // Copy feedback states
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessData(null);

    const formData = new FormData(e.currentTarget);
    const perihal = (formData.get('perihal') as string || '').trim();
    const tanggal = formData.get('tanggal') as string;

    if (!perihal) {
      setErrorMsg('Perihal atau judul pengaduan wajib diisi!');
      setLoading(false);
      return;
    }

    try {
      const tokenStr = generateToken();

      let payload: any = {
        perihal,
        tanggal: tanggal || new Date().toISOString().split('T')[0],
        token: tokenStr,
        status_tahapan: 'Menunggu Isian'
      };

      if (mode === 'lengkap') {
        const nama_pelapor = (formData.get('nama_pelapor') as string || '').trim();
        const telp_pelapor = (formData.get('telp_pelapor') as string || '').trim();
        const nama_terlapor = (formData.get('nama_terlapor') as string || '').trim();
        const lokasi_aduan = (formData.get('lokasi_aduan') as string || '').trim();
        const deskripsi = (formData.get('deskripsi') as string || '').trim();

        payload = {
          ...payload,
          nama_pelapor: nama_pelapor || null,
          telp_pelapor: telp_pelapor || null,
          nama_terlapor: nama_terlapor || null,
          lokasi_aduan: lokasi_aduan || null,
          deskripsi: deskripsi || null,
          status_tahapan: nama_pelapor ? 'Form Terisi' : 'Menunggu Isian'
        };
      }

      const res = await fetch('/api/pengaduan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Gagal membuat tiket pengaduan');
      }

      setSuccessData({ 
        ...result.data, 
        token: tokenStr,
        perihal,
        tanggal: payload.tanggal,
        telp_pelapor: payload.telp_pelapor
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem saat menyimpan tiket.');
    } finally {
      setLoading(false);
    }
  };

  // Helper Copy Link
  const handleCopyLink = () => {
    if (!successData?.token) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/pengaduan/token?token=${successData.token}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Helper Copy Token Saja
  const handleCopyToken = () => {
    if (!successData?.token) return;
    navigator.clipboard.writeText(successData.token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  // Helper Kirim Penugasan ke WhatsApp Petugas
  const handleShareWhatsApp = () => {
    if (!successData?.token) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/pengaduan/token?token=${successData.token}`;
    
    const message = 
      `*DINAS LINGKUNGAN HIDUP*\n` +
      `*PENUGASAN ADUAN LAPANGAN (BIDIDLH.apk)*\n\n` +
      `Halo Rekan Petugas DLH,\n` +
      `Berikut rincian tiket aduan masyarakat untuk verifikasi lapangan:\n\n` +
      `📌 *Perihal:* ${successData.perihal || '-'}\n` +
      `🔑 *Token BIDIDLH.apk:* *${successData.token}*\n` +
      `📅 *Tanggal:* ${successData.tanggal || '-'}\n\n` +
      `Silakan buka aplikasi *BIDIDLH.apk* di perangkat Anda, lalu masukkan kode token di atas untuk input verifikasi & BAP lapangan.\n\n` +
      `Akses Web Alternatif: ${link}`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 pb-24 px-4">
      
      {/* Tombol Kembali ke Daftar Pengaduan */}
      <Link 
        href="/pengaduan" 
        className="inline-flex items-center gap-2 text-sm text-slate-800 font-bold transition-all bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 uppercase tracking-wide"
      >
        <ArrowLeft size={16} /> Kembali ke Daftar Pengaduan
      </Link>

      {/* Header Halaman (NeoBrutalism Konsisten) */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
        <div className="w-14 h-14 rounded-2xl bg-purple-400 border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
          <AlertTriangle size={28} className="text-slate-900" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">
            Catat Pengaduan Baru
          </h2>
          <p className="text-sm font-bold text-slate-600 mt-1 uppercase">
            Terbitkan Tiket Terintegrasi BIDIDLH.apk atau Rekam Langsung Laporan Masyarakat
          </p>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 p-5 rounded-2xl text-sm font-bold shadow-sm flex items-center gap-3">
          <AlertTriangle size={20} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SUCCESS CARD (Boarding Pass / E-Ticket View) */}
      {successData ? (
        <div className="bg-white border-2 border-slate-300 shadow-xl rounded-3xl overflow-hidden">
          
          {/* Header Tiket */}
          <div className="bg-purple-600 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30 shrink-0">
                <Smartphone size={30} className="text-white" />
              </div>
              <div>
                <span className="inline-block bg-white/20 text-white font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                  Terintegrasi BIDIDLH.apk ✓
                </span>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                  Tiket Berhasil Diterbitkan!
                </h3>
              </div>
            </div>
            <div className="text-right sm:text-right">
              <span className="text-[11px] uppercase font-bold text-purple-200 block">Status Tahapan</span>
              <span className="text-xs font-black uppercase bg-white text-purple-900 px-3 py-1 rounded-full shadow-sm inline-block mt-0.5">
                {successData.status_tahapan || 'Menunggu Isian'}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Ringkasan Perihal & Tanggal */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Perihal Kasus Aduan:</span>
                <span className="text-sm sm:text-base font-black text-slate-900 text-left sm:text-right">
                  {successData.perihal}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 pt-1">
                <span>Tanggal Terbit:</span>
                <span className="font-mono text-slate-900">{successData.tanggal}</span>
              </div>
            </div>

            {/* Kotak Token Besar - Khusus BIDIDLH.apk */}
            <div className="text-center p-6 bg-purple-50/70 border-2 border-purple-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-purple-700">
                <Key size={16} />
                <span>Kode Token Integrasi BIDIDLH.apk</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl sm:text-4xl font-black font-mono text-purple-950 tracking-wider bg-white px-6 py-3 rounded-2xl border-2 border-purple-300 shadow-inner">
                  {successData.token}
                </span>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="p-3.5 bg-white hover:bg-purple-100 text-purple-800 border-2 border-purple-300 rounded-2xl shadow-sm hover:shadow transition-all"
                  title="Salin kode token"
                >
                  {copiedToken ? <Check size={20} className="text-emerald-600" /> : <Copy size={20} />}
                </button>
              </div>
              <p className="text-xs font-bold text-slate-600 max-w-md mx-auto">
                {copiedToken ? (
                  <span className="text-emerald-600 font-black">Kode token berhasil disalin ke papan klip!</span>
                ) : (
                  'Buka aplikasi BIDIDLH.apk di ponsel petugas lapangan, lalu input kode token di atas untuk mengisi data verlap dan BAP.'
                )}
              </p>
            </div>

            {/* Kotak Tautan Alternatif Web */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider">
                Tautan Form Web (Alternatif Tanpa Aplikasi Mobile):
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="bg-slate-50 border-2 border-slate-200 p-3 rounded-xl break-all text-xs font-mono font-bold text-slate-700 flex-1">
                  {typeof window !== 'undefined' ? `${window.location.origin}/pengaduan/token?token=${successData.token}` : ''}
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl border border-slate-900 shadow-sm hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check size={16} className="text-emerald-400" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>Salin Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tombol Aksi Distribusi Tiket & Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Kirim Tugas ke WhatsApp Petugas */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl border border-emerald-700 shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
              >
                <Send size={16} />
                <span>Kirim Tugas ke WA Petugas</span>
              </button>

              {/* Buka Form Isian Sekarang di Web */}
              {successData.id && (
                <Link
                  href={`/pengaduan/isi/${successData.id}`}
                  className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl border border-purple-700 shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-center"
                >
                  <ExternalLink size={16} />
                  <span>Isi di Web Sekarang</span>
                </Link>
              )}
            </div>

            {/* Navigasi Lanjutan */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => { setSuccessData(null); }}
                className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-100 text-slate-800 font-black rounded-xl border border-slate-300 shadow-sm hover:-translate-y-0.5 transition-all uppercase tracking-wider text-xs text-center flex items-center justify-center gap-2"
              >
                <PlusCircle size={16} />
                <span>Buat Tiket Baru</span>
              </button>

              <button
                type="button"
                onClick={() => router.push('/pengaduan')}
                className="w-full sm:w-auto px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black rounded-xl border border-slate-300 shadow-sm hover:-translate-y-0.5 transition-all uppercase tracking-wider text-xs text-center"
              >
                Kembali ke Daftar Pengaduan
              </button>
            </div>

          </div>
        </div>
      ) : (
        /* FORM PEMBUATAN TIKET */
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          
          {/* Mode Selector Tabs */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              Pilih Metode Pencatatan:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Tab 1: Token Cepat untuk BIDIDLH.apk */}
              <button
                type="button"
                onClick={() => setMode('token_only')}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  mode === 'token_only'
                    ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-100'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    mode === 'token_only' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900 uppercase">
                      Integrasi BIDIDLH.apk
                    </h4>
                    <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                      Cukup perihal & tanggal, diisi oleh petugas lapangan via aplikasi
                    </p>
                  </div>
                </div>
              </button>

              {/* Tab 2: Input Lengkap di Web */}
              <button
                type="button"
                onClick={() => setMode('lengkap')}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  mode === 'lengkap'
                    ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-100'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    mode === 'lengkap' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <FileCheck size={18} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900 uppercase">
                      Input Lengkap di Web
                    </h4>
                    <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                      Rekam langsung data pelapor, terlapor, dan lokasi di kantor
                    </p>
                  </div>
                </div>
              </button>

            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            
            {/* Field Wajib Utama */}
            <div className="space-y-4">
              
              {/* 1. Perihal / Kasus */}
              <div>
                <label className="block text-xs font-black text-slate-900 mb-2 uppercase tracking-wider">
                  1. Perihal / Indikasi Kasus Aduan <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="perihal" 
                  required 
                  placeholder="Contoh: Dugaan Pembuangan Limbah Cair ke Saluran Irigasi PT XYZ..." 
                  className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3.5 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none transition-all placeholder:text-slate-400" 
                />
              </div>

              {/* 2. Tanggal */}
              <div>
                <label className="block text-xs font-black text-slate-900 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={14} className="text-purple-600" />
                  <span>2. Tanggal Pembuatan Tiket</span> <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="date" 
                  name="tanggal" 
                  required 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3.5 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none transition-all cursor-pointer" 
                />
              </div>

            </div>

            {/* Field Tambahan Jika Mode Lengkap */}
            {mode === 'lengkap' && (
              <div className="pt-4 border-t-2 border-slate-100 space-y-5 animate-in fade-in duration-200">
                
                <div className="flex items-center gap-2 text-xs font-black text-purple-700 uppercase tracking-wider bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
                  <Sparkles size={14} />
                  <span>Rincian Informasi Tambahan (Opsional)</span>
                </div>

                {/* Identitas Pelapor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                      <User size={13} className="text-purple-600" />
                      <span>Nama Pelapor</span>
                    </label>
                    <input 
                      type="text" 
                      name="nama_pelapor" 
                      placeholder="Nama lengkap warga/pelapor..." 
                      className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:border-purple-600 outline-none transition-all placeholder:text-slate-400" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone size={13} className="text-purple-600" />
                      <span>No. WhatsApp / HP Pelapor</span>
                    </label>
                    <input 
                      type="text" 
                      name="telp_pelapor" 
                      placeholder="Contoh: 081234567890" 
                      className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:border-purple-600 outline-none transition-all placeholder:text-slate-400 font-mono" 
                    />
                  </div>
                </div>

                {/* Terlapor & Lokasi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-2 uppercase tracking-wider">
                      Pihak Terlapor (Usaha / Pelaku)
                    </label>
                    <input 
                      type="text" 
                      name="nama_terlapor" 
                      placeholder="Nama usaha, pabrik, atau perorangan terlapor..." 
                      className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:border-purple-600 outline-none transition-all placeholder:text-slate-400" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin size={13} className="text-rose-500" />
                      <span>Lokasi Kejadian Aduan</span>
                    </label>
                    <input 
                      type="text" 
                      name="lokasi_aduan" 
                      placeholder="Contoh: Desa Karanganyar RT 02/03, Kec. Sambungmacan" 
                      className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:border-purple-600 outline-none transition-all placeholder:text-slate-400" 
                    />
                  </div>
                </div>

                {/* Deskripsi Kronologi Singkat */}
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={13} className="text-purple-600" />
                    <span>Uraian / Kronologi Kasus Singkat</span>
                  </label>
                  <textarea 
                    name="deskripsi" 
                    rows={3}
                    placeholder="Tuliskan keterangan ringkas mengenai bau, asap, atau pencemaran yang diadukan warga..." 
                    className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:bg-white focus:border-purple-600 outline-none transition-all placeholder:text-slate-400" 
                  />
                </div>

              </div>
            )}

            {/* Tombol Simpan */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs font-bold text-slate-500">
                {mode === 'token_only' 
                  ? 'Tiket akan otomatis menerbitkan kode unik ADN-XXXXXX yang terintegrasi langsung dengan aplikasi mobile BIDIDLH.apk.' 
                  : 'Data laporan akan langsung tersimpan dengan status Form Terisi.'}
              </p>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl border border-slate-900 shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs sm:text-sm disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? <LottieLoader size={24} /> : <Save size={18} />}
                <span>{mode === 'token_only' ? 'Terbitkan Token BIDIDLH.apk' : 'Simpan & Terbitkan Tiket'}</span>
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
