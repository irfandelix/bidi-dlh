'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Send, 
  Loader2, 
  Monitor, 
  Globe, 
  FilePlus, 
  MapPin, 
  UserCheck, 
  CheckCircle2, 
  Printer, 
  ArrowRight, 
  ArrowLeft, 
  Copy, 
  Check, 
  Download,
  RotateCcw,
  Sparkles,
  Building2,
  Phone,
  Calendar,
  Hash,
  FileText,
  ShieldCheck,
  User,
  Info,
  ChevronRight,
  ClipboardList,
  Layers
} from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function RegistrasiPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'manual' | 'amdalnet'>('manual');
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);
  const [createdNomorChecklist, setCreatedNomorChecklist] = useState<string>('');
  const [copiedNomor, setCopiedNomor] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [timPenilais, setTimPenilais] = useState<any[]>([]);
  
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchTimPenilai = async () => {
      try {
        const res = await fetch('/api/tim-penilai?hierarki=13');
        if (res.ok) {
          const { data } = await res.json();
          setTimPenilais(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch tim penilai', err);
      }
    };
    fetchTimPenilai();
  }, []);

  // Reset step when changing tab
  useEffect(() => {
    setCurrentStep(1);
  }, [activeTab]);

  // Format nomor WhatsApp / Telepon otomatis ke format 08...
  const formatPhoneNumber = (val: string) => {
    if (!val) return '';
    let cleaned = val.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+62')) {
      cleaned = '0' + cleaned.slice(3);
    } else if (cleaned.startsWith('62')) {
      cleaned = '0' + cleaned.slice(2);
    }
    return cleaned;
  };

  const handlePhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.value = formatPhoneNumber(e.target.value);
  };

  const checklistItems = [
    "Surat Permohonan Pemeriksaan Dokumen*", 
    "Pernyataan Pengelolaan dan Pemantauan Lingkungan (Bermaterai)*",
    "Dokumen Lingkungan*", 
    "Peta Tapak Proyek", 
    "Peta Pemantauan dan Pengelolaan",
    "Peta Siteplan di A3", 
    "PKKPR",
    "NIB (Untuk Swasta atau Perorangan)", 
    "Fotocopy Status Lahan (Sertifikat)", 
    "Fotocopy KTP Penanggungjawab Kegiatan", 
    "Foto Eksisting Lokasi Rencana Kegiatan Disertai dengan Titik Koordinat", 
    "Lembar Penapisan dari AMDALNET / Arahan dari Instansi Lingkungan Hidup", 
    "Surat Kuasa Pekerjaan dari Pemrakarsa ke Konsultan (Bermaterai)", 
    "Perizinan yang Sudah Dimiliki atau Izin yang Lama (Jika Ada)",
    "Perjanjian Pengangkutan Sampah (MOU)",
    "Perjanjian Pengangkutan Limbah B3 (MOU)",
    "Pemenuhan Standar Teknis Pemenuhan Baku Mutu Air Limbah", 
    "Pemenuhan Rincian Teknis Limbah B3 Sementara", 
    "Pemenuhan Standar Teknis Pemenuhan Baku Mutu Emisi", 
    "Pemenuhan Persetujuan Teknis Andalalin", 
    "Hasil Penapisan Kewajiban Pemenuhan Persetujuan Teknis", 
    "Bukti Upload Permohonan pada AMDALNET dan/atau SIDARLING"
  ];

  const validateStep = (stepNum: number) => {
    const stepContainer = document.getElementById(`step-${stepNum}`);
    if (stepContainer) {
      const inputs = stepContainer.querySelectorAll('input[required], select[required], textarea[required]');
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i] as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        if (!input.checkValidity()) {
          input.reportValidity();
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(c => Math.min(c + 1, 3));
    }
  };

  const handlePrev = () => {
    setCurrentStep(c => Math.max(c - 1, 1));
  };

  const goToStep = (targetStep: number) => {
    if (targetStep === currentStep) return;
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      return;
    }
    // Jika maju ke depan, pastikan step sebelumnya tervalidasi
    for (let s = currentStep; s < targetStep; s++) {
      if (!validateStep(s)) return;
    }
    setCurrentStep(targetStep);
  };

  const handleResetForm = () => {
    setSuccessMsg('');
    setCreatedDocId(null);
    setCreatedNomorChecklist('');
    setErrorMsg('');
    setCopiedNomor(false);
    setCurrentStep(1);
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  const handleDownload = async (type: string) => {
    if (!createdDocId) return;
    setDownloading(type);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: createdDocId, type, stage: 'registrasi' })
      });
      if (!res.ok) throw new Error('Gagal generate dokumen');
      
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      let filename = `${type}_${createdDocId}.docx`;
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    } finally {
      setDownloading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData(e.currentTarget);
    const rawData: any = Object.fromEntries(formData.entries());
    
    const data: any = {};
    
    // Set sumber data based on tab
    data.sumber_data = activeTab.toUpperCase();

    // Map fields matching database.ts
    data.nama_kegiatan = rawData.nama_kegiatan;
    data.jenis_dokumen = rawData.jenis_dokumen;
    data.nama_pemrakarsa = rawData.nama_pemrakarsa;
    data.lokasi_kegiatan = rawData.lokasi_kegiatan;
    data.jenis_kegiatan = rawData.jenis_kegiatan;
    data.besaran_luasan = rawData.besaran_luasan;
    data.satuan_luasan = rawData.satuan_luasan;
    data.alamat_pemrakarsa = rawData.alamat_pemrakarsa;
    
    data.nomor_registrasi_amdalnet = rawData.nomor_registrasi_amdalnet;
    data.nomor_surat_permohonan = rawData.nomor_surat_permohonan;
    data.tanggal_surat_permohonan = rawData.tanggal_surat_permohonan;
    data.perihal_surat_permohonan = rawData.perihal_surat_permohonan;
    data.tanggal_masuk_dokumen = rawData.tanggal_masuk_dokumen;
    
    data.telepon_pemrakarsa = formatPhoneNumber(rawData.telepon_pemrakarsa || '');
    data.nama_konsultan = rawData.nama_konsultan;
    data.telepon_konsultan = formatPhoneNumber(rawData.telepon_konsultan || '');
    
    data.pengirim_sebagai = rawData.pengirim_sebagai;
    data.nama_pengirim = rawData.nama_pengirim;
    data.keterangan = rawData.keterangan;
    data.petugas_mpp_id = rawData.penerima_id ? parseInt(rawData.penerima_id) : null;
    
    data.nomor_checklist = rawData.nomor_checklist;
    data.status_verifikasi = rawData.status_verifikasi;

    // Map checklist items if manual tab
    if (activeTab === 'manual') {
      const checklistStatus = checklistItems.map((_, i) => ({
          pl: formData.get(`checklistStatusPL[${i}]`) === 'true',
          pertek: formData.get(`checklistStatusPertek[${i}]`) === 'true',
          rintek: formData.get(`checklistStatusRintek[${i}]`) === 'true'
        }));
      const checklistNotes = checklistItems.map((_, i) => formData.get(`checklistNotes[${i}]`) || '');
      data.checklist_status = JSON.stringify(checklistStatus);
      data.checklist_notes = JSON.stringify(checklistNotes);
    }

    try {
      const res = await fetch('/api/perizinan/registrasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Terjadi kesalahan saat registrasi.');
      }

      setSuccessMsg('Registrasi berhasil disimpan!');
      setCreatedDocId(result.data.id);
      setCreatedNomorChecklist(result.data.nomor_checklist || '');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = (stepNum: number) => {
    if (activeTab === 'manual') {
      return stepNum === 1 ? 'Data Registrasi Utama' : stepNum === 2 ? 'Checklist Kelengkapan' : 'Kesimpulan Verifikasi';
    } else {
      return stepNum === 1 ? 'Data Dokumen Amdalnet' : stepNum === 2 ? 'Detail Usaha / Kegiatan' : 'Data Pemrakarsa';
    }
  };

  const getStepSubtitle = (stepNum: number) => {
    if (activeTab === 'manual') {
      return stepNum === 1 ? 'Identitas berkas & kontak' : stepNum === 2 ? 'Verifikasi 22 persyaratan' : 'Status & petugas loket';
    } else {
      return stepNum === 1 ? 'No. registrasi & permohonan' : stepNum === 2 ? 'Nama, skala & alamat' : 'Identitas penanggungjawab';
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8 pb-24">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
        <Link href="/perizinan/daftar" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
          <ArrowLeft size={14} /> Daftar Perizinan
        </Link>
        <ChevronRight size={14} className="text-slate-400" />
        <span className="text-slate-800 font-black">Registrasi Dokumen Masuk</span>
      </div>

      {/* Modern Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-xl text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 border border-indigo-400/30 flex items-center justify-center shadow-lg shadow-indigo-950/40 shrink-0">
              <FilePlus className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black tracking-wider uppercase mb-1">
                <Sparkles size={12} /> Pelayanan Terpadu Satu Pintu
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                Registrasi Dokumen Masuk
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-300 mt-1">
                Penerimaan, pencatatan agenda, dan checklist administrasi perizinan lingkungan hidup
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl backdrop-blur-sm shrink-0">
            <Layers className="text-indigo-400" size={24} />
            <div className="text-left text-xs font-bold">
              <p className="text-slate-400 uppercase tracking-wider">Tahap 1 dari 12</p>
              <p className="text-white font-black text-sm uppercase">Penerimaan Berkas</p>
            </div>
          </div>
        </div>

        {/* Decorative backdrop light */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Tabs Switcher */}
      {!successMsg && (
        <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shadow-inner flex flex-col sm:flex-row gap-1.5 w-fit">
          <button 
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-3.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2.5 ${
              activeTab === 'manual' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-[1.01]' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Monitor size={18} />
            <div className="text-left">
              <span className="block leading-tight uppercase tracking-wider">Loket MPP (Manual)</span>
              <span className={`text-[10px] block font-semibold ${activeTab === 'manual' ? 'text-indigo-200' : 'text-slate-400'}`}>Penerimaan berkas fisik & checklist</span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('amdalnet')}
            className={`px-6 py-3.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2.5 ${
              activeTab === 'amdalnet' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-[1.01]' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Globe size={18} />
            <div className="text-left">
              <span className="block leading-tight uppercase tracking-wider">Sistem Amdalnet</span>
              <span className={`text-[10px] block font-semibold ${activeTab === 'amdalnet' ? 'text-emerald-200' : 'text-slate-400'}`}>Integrasi digital KLHK</span>
            </div>
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="bg-rose-50 border-2 border-rose-200 text-rose-900 p-5 rounded-2xl text-sm font-bold shadow-sm flex items-start gap-3 animate-in fade-in duration-200">
          <div className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center shrink-0 mt-0.5">!</div>
          <div className="flex-1">
            <h4 className="font-black text-rose-950 uppercase tracking-wide">Peringatan Registrasi Gagal</h4>
            <p className="mt-1 text-xs text-rose-800 font-semibold">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Enhanced Success Screen (Poin 4: Tombol Registrasi Berkas Baru) */}
      {successMsg && (
        <div className="bg-white border-2 border-emerald-300 rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-8 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-100 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-md shadow-emerald-100">
            <CheckCircle2 size={44} className="text-emerald-600 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <span className="inline-block px-3.5 py-1 bg-emerald-100 border border-emerald-200 rounded-full text-emerald-800 font-black text-xs uppercase tracking-wider">
              Tahap Registrasi Selesai
            </span>
            <h3 className="text-2xl sm:text-3xl font-black uppercase text-slate-900">
              {successMsg}
            </h3>
            <p className="text-sm font-semibold text-slate-600 max-w-lg mx-auto">
              Dokumen telah tercatat di basis data perizinan DLH. Nomor registrasi resmi diterbitkan berikut ini:
            </p>
          </div>

          {createdNomorChecklist && (
            <div className="max-w-xl mx-auto p-5 bg-gradient-to-br from-emerald-50 to-slate-50 border-2 border-emerald-200 rounded-2xl shadow-sm space-y-3">
              <p className="text-xs font-black text-emerald-900 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <Hash size={14} /> Nomor Registrasi / Checklist DLH
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <span className="font-mono font-black text-lg sm:text-xl text-emerald-950 bg-white px-4 py-2 rounded-xl border border-emerald-300 shadow-sm tracking-wide select-all">
                  {createdNomorChecklist}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(createdNomorChecklist);
                    setCopiedNomor(true);
                    setTimeout(() => setCopiedNomor(false), 2000);
                  }}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all"
                >
                  {copiedNomor ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  {copiedNomor ? 'Tersalin!' : 'Salin Nomor'}
                </button>
              </div>
            </div>
          )}

          {/* Unduh Berkas Action Cards */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Unduh Berkas Cetak Hasil Registrasi
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
              {activeTab === 'amdalnet' ? (
                <button 
                  type="button"
                  onClick={() => handleDownload('Lembar_Registrasi_Amdalnet')}
                  disabled={downloading === 'Lembar_Registrasi_Amdalnet'}
                  className="w-full sm:w-auto flex-1 p-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-600/30 font-black rounded-2xl text-xs sm:text-sm shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2.5 uppercase tracking-wider disabled:opacity-70"
                >
                  {downloading === 'Lembar_Registrasi_Amdalnet' ? <LottieLoader size={22} /> : <Download size={20} />}
                  Lembar Registrasi Amdalnet (.docx)
                </button>
              ) : (
                <>
                  <button 
                    type="button"
                    onClick={() => handleDownload('template_tanda_terima_registrasi')}
                    disabled={downloading === 'template_tanda_terima_registrasi'}
                    className="w-full sm:w-auto flex-1 p-4 bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-500/30 font-black rounded-2xl text-xs sm:text-sm shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2.5 uppercase tracking-wider disabled:opacity-70"
                  >
                    {downloading === 'template_tanda_terima_registrasi' ? <LottieLoader size={22} /> : <Download size={20} />}
                    Tanda Terima Berkas (.docx)
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleDownload('template_checklist')}
                    disabled={downloading === 'template_checklist'}
                    className="w-full sm:w-auto flex-1 p-4 bg-teal-400 hover:bg-teal-300 text-slate-950 border border-teal-500/30 font-black rounded-2xl text-xs sm:text-sm shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2.5 uppercase tracking-wider disabled:opacity-70"
                  >
                    {downloading === 'template_checklist' ? <LottieLoader size={22} /> : <Download size={20} />}
                    Checklist Kelengkapan (.docx)
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons: Next Stage, Reset New File, or Back */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button 
              type="button"
              onClick={handleResetForm}
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-2 border-emerald-300 font-black rounded-xl text-xs sm:text-sm shadow-sm hover:scale-[1.02] active:scale-95 transition-all uppercase flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} /> Daftarkan Berkas Lainnya (+)
            </button>

            {createdDocId && (
              <Link
                href={`/perizinan/uji-administrasi/${createdDocId}`}
                className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all uppercase flex items-center justify-center gap-2"
              >
                Lanjut ke Tahap 2: Uji Administrasi <ArrowRight size={16} />
              </Link>
            )}

            <button 
              type="button"
              onClick={() => router.push('/perizinan/daftar')}
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-black rounded-xl text-xs sm:text-sm shadow-sm transition-all uppercase flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} /> Ke Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Main Wizard Form */}
      {!successMsg && (
        <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-lg shadow-slate-100 space-y-8">
          
          {/* Enhanced Stepper / Wizard (Poin 5: Step Bisa Diklik Langsung) */}
          <div className="relative mb-10 pt-2">
            {/* Progress line */}
            <div className="absolute left-[16.666667%] right-[16.666667%] top-7 -translate-y-1/2 h-1.5 bg-slate-100 rounded-full z-0 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ease-out ${activeTab === 'manual' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'}`}
                style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
              ></div>
            </div>
            
            <div className="flex items-start justify-between relative z-10">
              {[1, 2, 3].map((step) => {
                const isPassed = currentStep > step;
                const isCurrent = currentStep === step;

                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => goToStep(step)}
                    className="flex flex-col items-center gap-2 w-1/3 group text-center focus:outline-none"
                    title={`Klik untuk ke Step ${step}`}
                  >
                    <div className={`w-13 h-13 rounded-2xl flex items-center justify-center font-black text-base transition-all duration-300 border-2 ${
                      isCurrent 
                        ? (activeTab === 'manual' 
                            ? 'bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-100 shadow-md scale-110' 
                            : 'bg-emerald-600 text-white border-emerald-600 ring-4 ring-emerald-100 shadow-md scale-110')
                        : isPassed
                          ? (activeTab === 'manual'
                              ? 'bg-indigo-100 text-indigo-900 border-indigo-300 group-hover:bg-indigo-200'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300 group-hover:bg-emerald-200')
                          : 'bg-slate-50 text-slate-400 border-slate-200 group-hover:border-slate-300'
                    }`}>
                      {isPassed ? <Check size={20} strokeWidth={3} /> : step}
                    </div>

                    <div className="space-y-0.5">
                      <span className={`text-xs font-black uppercase tracking-wider block transition-colors ${
                        isCurrent 
                          ? (activeTab === 'manual' ? 'text-indigo-600' : 'text-emerald-600') 
                          : isPassed ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
                      }`}>
                        {getStepTitle(step)}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 hidden sm:block">
                        {getStepSubtitle(step)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
            
            {/* MANUAL TAB CONTENT */}
            {activeTab === 'manual' && (
              <>
                {/* Step 1: Data Registrasi Utama */}
                <div id="step-1" className={currentStep === 1 ? 'block animate-in fade-in slide-in-from-right-4 duration-300 space-y-8' : 'hidden'}>
                  
                  {/* Bagian Surat & Permohonan */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 text-indigo-600 border-b border-slate-200 pb-3 font-black text-base uppercase tracking-wide">
                      <FileText size={18} /> Informasi Surat & Tanggal Masuk
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                          Nomor Surat Permohonan
                        </label>
                        <input 
                          type="text" 
                          name="nomor_surat_permohonan" 
                          placeholder="Contoh: 600.4.1/123/2026..." 
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder:text-slate-400" 
                        />
                      </div>

                      <div>
                        <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                          Tanggal Surat Permohonan
                        </label>
                        <input 
                          type="date" 
                          name="tanggal_surat_permohonan" 
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all cursor-pointer" 
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                          Perihal Surat
                        </label>
                        <input 
                          type="text" 
                          name="perihal_surat_permohonan" 
                          placeholder="Contoh: Permohonan Pemeriksaan Dokumen Lingkungan..." 
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder:text-slate-400" 
                        />
                      </div>

                      <div>
                        <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                          <span>Tanggal Masuk Dokumen (DLH)</span>
                          <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-black border border-rose-200">Wajib</span>
                        </label>
                        <input 
                          type="date" 
                          name="tanggal_masuk_dokumen" 
                          required 
                          defaultValue={new Date().toISOString().split('T')[0]} 
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all cursor-pointer" 
                        />
                      </div>

                      <div>
                        <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                          <span>Jenis Dokumen</span>
                          <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-black border border-rose-200">Wajib</span>
                        </label>
                        <select 
                          name="jenis_dokumen" 
                          required 
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all cursor-pointer"
                        >
                          <option value="UKL-UPL">UKL-UPL</option>
                          <option value="AMDAL">AMDAL</option>
                          <option value="SPPL">SPPL</option>
                          <option value="KAJIAN TEKNIS AIR LIMBAH">Kajian Teknis Pemenuhan Baku Mutu Air Limbah</option>
                          <option value="KAJIAN TEKNIS EMISI">Kajian Teknis Pemenuhan Baku Mutu Emisi</option>
                          <option value="Rincian Teknis dan Intergrasi Rincian Teknis Limbah B3 ke Persetujuan Lingkungan">Rincian Teknis dan Intergrasi Rincian Teknis Limbah B3 ke Persetujuan Lingkungan</option>
                          <option value="PERTEK AIR LIMBAH">Standar Teknis Pemenuhan Baku Mutu Air Limbah</option>
                          <option value="PERTEK EMISI">Standar Teknis Pemenuhan Baku Mutu Emisi</option>
                          <option value="SLO">SLO</option>
                          <option value="DPLH">DPLH</option>
                          <option value="DELH">DELH</option>
                          <option value="Permohonan Arahan">Permohonan Arahan</option>
                          <option value="Permohonan Perubahan Dokumen Lingkungan">Permohonan Perubahan Dokumen Lingkungan</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Bagian Kegiatan */}
                  <div className="space-y-5 pt-4">
                    <div className="flex items-center gap-2 text-indigo-600 border-b border-slate-200 pb-3 font-black text-base uppercase tracking-wide">
                      <Building2 size={18} /> Detail Rencana Usaha / Kegiatan
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                          <span>Nama Kegiatan / Usaha</span>
                          <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-black border border-rose-200">Wajib</span>
                        </label>
                        <input 
                          type="text" 
                          name="nama_kegiatan" 
                          required 
                          placeholder="Contoh: Pembangunan Fasilitas Pabrik Tekstil..." 
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder:text-slate-400" 
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                          Kategori / Jenis Kegiatan
                        </label>
                        <select 
                          name="jenis_kegiatan" 
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all cursor-pointer"
                        >
                          <option value="Perumahan">Perumahan</option>
                          <option value="Industri">Industri</option>
                          <option value="Perdagangan">Perdagangan</option>
                          <option value="Kesehatan">Fasilitas Kesehatan</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                          Lokasi Kegiatan (Alamat Proyek)
                        </label>
                        <textarea 
                          name="lokasi_kegiatan" 
                          rows={2} 
                          placeholder="Alamat lengkap lokasi rencana kegiatan/proyek..." 
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder:text-slate-400"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                  
                  {/* Kontak & Pengirim (Poin 6: Normalisasi No. WhatsApp Otomatis) */}
                  <div className="space-y-5 pt-4">
                    <div className="flex items-center gap-2 text-indigo-600 border-b border-slate-200 pb-3 font-black text-base uppercase tracking-wide">
                      <User size={18} /> Data Pemrakarsa, Konsultan & Pengirim
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="space-y-4">
                        <div>
                          <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                            <span>Nama Pemrakarsa</span>
                            <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-black border border-rose-200">Wajib</span>
                          </label>
                          <input 
                            type="text" 
                            name="nama_pemrakarsa" 
                            required 
                            placeholder="PT / CV / Nama Pribadi..." 
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder:text-slate-400" 
                          />
                        </div>
                        <div>
                          <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                            No. WhatsApp / Telp Pemrakarsa
                          </label>
                          <input 
                            type="text" 
                            name="telepon_pemrakarsa" 
                            onBlur={handlePhoneBlur}
                            placeholder="0812xxxx (Otomatis format 08)" 
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder:text-slate-400" 
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                            Nama Konsultan (Jika Ada)
                          </label>
                          <input 
                            type="text" 
                            name="nama_konsultan" 
                            placeholder="Nama PT / CV Konsultan..." 
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder:text-slate-400" 
                          />
                        </div>
                        <div>
                          <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                            No. WhatsApp / Telp Konsultan
                          </label>
                          <input 
                            type="text" 
                            name="telepon_konsultan" 
                            onBlur={handlePhoneBlur}
                            placeholder="0812xxxx" 
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder:text-slate-400" 
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                            Status Pengirim Berkas
                          </label>
                          <select 
                            name="pengirim_sebagai" 
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all cursor-pointer"
                          >
                            <option value="Pemrakarsa">Pemrakarsa</option>
                            <option value="Konsultan">Konsultan</option>
                            <option value="Kuasa">Kuasa Hukum</option>
                          </select>
                        </div>
                        <div>
                          <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                            Nama Pengirim Fisik
                          </label>
                          <input 
                            type="text" 
                            name="nama_pengirim" 
                            placeholder="Nama orang yang mengantar berkas..." 
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder:text-slate-400" 
                          />
                        </div>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                          Keterangan Tambahan (Opsional)
                        </label>
                        <input 
                          type="text" 
                          name="keterangan" 
                          placeholder="Catatan khusus dari pemohon atau petugas loket..." 
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder:text-slate-400" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Checklist (Poin 1: Penamaan Baru Standar Teknis Pemenuhan Baku Mutu) */}
                <div id="step-2" className={currentStep === 2 ? 'block animate-in fade-in slide-in-from-right-4 duration-300 space-y-6' : 'hidden'}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-indigo-600 font-black text-xl uppercase tracking-wide flex items-center gap-2">
                        <ClipboardList size={22} /> Checklist Kelengkapan Dokumen
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        Centang berkas yang dilampirkan oleh pemohon untuk Persetujuan Lingkungan (PL), Standar Teknis (PERTEK), atau Rincian Teknis (RINTEK)
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border-2 border-slate-200 shadow-sm max-h-[560px] overflow-y-auto">
                    <table className="w-full text-xs text-left text-slate-900">
                      <thead className="bg-slate-100/95 sticky top-0 uppercase font-black border-b-2 border-slate-200 backdrop-blur-sm z-10">
                        <tr>
                          <th className="px-3.5 py-3.5 w-12 text-center border-r border-slate-200">No</th>
                          <th className="px-4 py-3.5 border-r border-slate-200">Persyaratan Dokumen</th>
                          <th className="px-3 py-3.5 w-20 text-center border-r border-slate-200 bg-indigo-50/70 text-indigo-950">PL</th>
                          <th className="px-3 py-3.5 w-20 text-center border-r border-slate-200 bg-amber-50/70 text-amber-950">PERTEK</th>
                          <th className="px-3 py-3.5 w-20 text-center border-r border-slate-200 bg-teal-50/70 text-teal-950">RINTEK</th>
                          <th className="px-4 py-3.5 w-1/3">Catatan / Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white font-bold">
                        {checklistItems.map((item, index) => (
                          <tr key={index} className="hover:bg-indigo-50/40 transition-colors">
                            <td className="px-3.5 py-3 text-center border-r border-slate-200 text-slate-500 font-mono">{index + 1}</td>
                            <td className="px-4 py-3 border-r border-slate-200 text-slate-900 font-bold leading-relaxed">{item}</td>
                            <td className="px-3 py-3 text-center border-r border-slate-200 bg-indigo-50/30">
                              <input 
                                type="checkbox" 
                                name={`checklistStatusPL[${index}]`} 
                                value="true" 
                                className="w-5 h-5 rounded-md border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shadow-sm transition-all" 
                              />
                            </td>
                            <td className="px-3 py-3 text-center border-r border-slate-200 bg-amber-50/30">
                              <input 
                                type="checkbox" 
                                name={`checklistStatusPertek[${index}]`} 
                                value="true" 
                                className="w-5 h-5 rounded-md border-2 border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer shadow-sm transition-all" 
                              />
                            </td>
                            <td className="px-3 py-3 text-center border-r border-slate-200 bg-teal-50/30">
                              <input 
                                type="checkbox" 
                                name={`checklistStatusRintek[${index}]`} 
                                value="true" 
                                className="w-5 h-5 rounded-md border-2 border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer shadow-sm transition-all" 
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                type="text" 
                                name={`checklistNotes[${index}]`} 
                                placeholder="Catatan berkas..." 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:bg-white focus:border-indigo-400 outline-none placeholder:text-slate-400 transition-all" 
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Step 3: Kesimpulan & Petugas */}
                <div id="step-3" className={currentStep === 3 ? 'block animate-in fade-in slide-in-from-right-4 duration-300 space-y-8' : 'hidden'}>
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-indigo-600 font-black text-xl uppercase tracking-wide flex items-center gap-2">
                      <ShieldCheck size={22} /> Kesimpulan & Petugas Penerima Loket
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Tetapkan status kelengkapan berkas dan pilih staf/petugas loket MPP yang memproses pendaftaran ini
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-w-3xl">
                    <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3">
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                        Status Kelengkapan Berkas
                      </label>
                      <select 
                        name="status_verifikasi" 
                        className="block w-full p-3.5 text-sm rounded-xl border-2 border-slate-300 bg-white font-black text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none cursor-pointer transition-all shadow-sm"
                      >
                        <option value="Lengkap / Diterima">LENGKAP / DITERIMA</option>
                        <option value="Diterima dengan Catatan">DITERIMA DENGAN CATATAN</option>
                        <option value="Ditolak / Dikembalikan">DITOLAK / DIKEMBALIKAN</option>
                      </select>
                      <p className="text-[11px] text-slate-500 font-semibold">
                        Pilih &quot;Lengkap / Diterima&quot; jika dokumen dapat langsung diproses ke Tahap Uji Administrasi.
                      </p>
                    </div>

                    <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3">
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                        <span>Petugas Penerima (Loket MPP/DLH)</span>
                        <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-black border border-rose-200">Wajib</span>
                      </label>
                      <select 
                        name="penerima_id" 
                        required 
                        className="block w-full p-3.5 text-sm rounded-xl border-2 border-slate-300 bg-white font-black text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none cursor-pointer transition-all shadow-sm"
                      >
                        <option value="">PILIH PETUGAS PENERIMA...</option>
                        {timPenilais.map((tp) => (
                          <option key={tp.id} value={tp.id}>{tp.nama} {tp.jabatan_dinas ? `(${tp.jabatan_dinas})` : ''}</option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500 font-semibold">
                        Nama petugas ini akan tercantum di lembar Tanda Terima dan Checklist berkas.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-r from-indigo-50 to-slate-50 border-2 border-indigo-100 rounded-2xl flex items-start gap-4">
                     <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                       <ShieldCheck size={20} />
                     </div>
                     <div>
                       <h4 className="font-black text-slate-900 text-sm uppercase">Konfirmasi Penyimpanan Registrasi</h4>
                       <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                         Pastikan seluruh data registrasi manual dan checklist kelengkapan telah terisi dengan benar. Nomor registrasi resmi sistem DLH akan diterbitkan secara otomatis dan berkas tanda terima dapat langsung diunduh.
                       </p>
                     </div>
                  </div>
                </div>
              </>
            )}

            {/* AMDALNET TAB CONTENT */}
            {activeTab === 'amdalnet' && (
              <>
                {/* Step 1: Data Dokumen Amdalnet */}
                <div id="step-1" className={currentStep === 1 ? 'block animate-in fade-in slide-in-from-right-4 duration-300 space-y-6' : 'hidden'}>
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-emerald-600 font-black text-xl uppercase tracking-wide flex items-center gap-2">
                      <Globe size={22} /> Data Dokumen Sistem Amdalnet KLHK
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Masukkan nomor registrasi digital dari sistem Amdalnet dan informasi permohonan
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                        1. Nomor Checklist (Sistem DLH)
                      </label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-100 border-2 border-slate-200 text-slate-500 italic rounded-xl px-4 py-3 text-sm cursor-not-allowed outline-none font-bold" 
                        value="Diterbitkan otomatis saat disimpan (Format: 600.4.5/...)" 
                        disabled 
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                        <span>2. Nomor Registrasi Amdalnet</span>
                        <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-black border border-rose-200">Wajib</span>
                      </label>
                      <input 
                        type="text" 
                        name="nomor_registrasi_amdalnet" 
                        required 
                        placeholder="Contoh: AMDALNET/2026/..." 
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all placeholder:text-slate-400" 
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                        <span>3. Tanggal Masuk Dokumen</span>
                        <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-black border border-rose-200">Wajib</span>
                      </label>
                      <input 
                        type="date" 
                        name="tanggal_masuk_dokumen" 
                        required 
                        defaultValue={new Date().toISOString().split('T')[0]} 
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all cursor-pointer" 
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                        <span>4. Jenis Dokumen</span>
                        <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-black border border-rose-200">Wajib</span>
                      </label>
                      <select 
                        name="jenis_dokumen" 
                        required 
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all cursor-pointer"
                      >
                        <option value="UKL-UPL">UKL-UPL</option>
                        <option value="AMDAL">AMDAL</option>
                        <option value="SPPL">SPPL</option>
                        <option value="KAJIAN TEKNIS AIR LIMBAH">Kajian Teknis Pemenuhan Baku Mutu Air Limbah</option>
                        <option value="KAJIAN TEKNIS EMISI">Kajian Teknis Pemenuhan Baku Mutu Emisi</option>
                        <option value="Rincian Teknis dan Intergrasi Rincian Teknis Limbah B3 ke Persetujuan Lingkungan">Rincian Teknis dan Intergrasi Rincian Teknis Limbah B3 ke Persetujuan Lingkungan</option>
                        <option value="PERTEK AIR LIMBAH">Standar Teknis Pemenuhan Baku Mutu Air Limbah</option>
                        <option value="PERTEK EMISI">Standar Teknis Pemenuhan Baku Mutu Emisi</option>
                        <option value="SLO">SLO</option>
                        <option value="DPLH">DPLH</option>
                        <option value="DELH">DELH</option>
                        <option value="Permohonan Arahan">Permohonan Arahan</option>
                        <option value="Permohonan Perubahan Dokumen Lingkungan">Permohonan Perubahan Dokumen Lingkungan</option>
                      </select>
                    </div>
      
                    <div className="md:col-span-2">
                      <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                        <span>5. Nomor Surat Permohonan</span>
                        <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-black border border-rose-200">Wajib</span>
                      </label>
                      <input 
                        type="text" 
                        name="nomor_surat_permohonan" 
                        required 
                        placeholder="Contoh: 660.1/123/2026..." 
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all placeholder:text-slate-400" 
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                        <span>6. Tanggal Surat Permohonan</span>
                        <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-black border border-rose-200">Wajib</span>
                      </label>
                      <input 
                        type="date" 
                        name="tanggal_surat_permohonan" 
                        required 
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all cursor-pointer" 
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                        <span>7. Perihal Surat Permohonan</span>
                        <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-black border border-rose-200">Wajib</span>
                      </label>
                      <input 
                        type="text" 
                        name="perihal_surat_permohonan" 
                        required 
                        placeholder="Permohonan Arahan / Pemeriksaan..." 
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all placeholder:text-slate-400" 
                      />
                    </div>
                  </div>
                </div>

                {/* Step 2: Detail Kegiatan Amdalnet */}
                <div id="step-2" className={currentStep === 2 ? 'block animate-in fade-in slide-in-from-right-4 duration-300 space-y-6' : 'hidden'}>
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-emerald-600 font-black text-xl uppercase tracking-wide flex items-center gap-2">
                      <Building2 size={22} /> Detail Rencana Usaha / Kegiatan
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Informasi skala, kategori bidang, dan alamat lokasi proyek kegiatan
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                       <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                         <span>8. Nama Usaha / Kegiatan</span>
                         <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-black border border-rose-200">Wajib</span>
                       </label>
                       <input 
                         type="text" 
                         name="nama_kegiatan" 
                         required 
                         placeholder="Nama kegiatan atau proyek sesuai berkas..."
                         className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all placeholder:text-slate-400" 
                       />
                    </div>

                    <div>
                      <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                        <span>9. Jenis Kegiatan (Bidang)</span>
                        <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-black border border-rose-200">Wajib</span>
                      </label>
                      <input 
                        type="text" 
                        name="jenis_kegiatan" 
                        required 
                        placeholder="Contoh: Kesehatan / Industri / Perumahan..." 
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all placeholder:text-slate-400" 
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                        <span>10. Besaran Luasan</span>
                        <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-black border border-rose-200">Wajib</span>
                      </label>
                      <div className="flex">
                        <input 
                          type="number" 
                          name="besaran_luasan" 
                          required 
                          placeholder="Angka luasan..." 
                          className="w-2/3 bg-slate-50 border-2 border-slate-200 rounded-l-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all border-r-0 placeholder:text-slate-400" 
                        />
                        <select 
                          name="satuan_luasan" 
                          className="w-1/3 bg-slate-100 border-2 border-slate-200 rounded-r-xl px-4 py-3 text-sm font-black text-slate-900 outline-none cursor-pointer"
                        >
                            <option value="m2">m²</option>
                            <option value="Ha">Ha</option>
                        </select>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                        <span>11. Lokasi Kegiatan (Alamat Lengkap)</span>
                        <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-black border border-rose-200">Wajib</span>
                      </label>
                      <textarea 
                        name="lokasi_kegiatan" 
                        required 
                        rows={2} 
                        placeholder="Alamat lengkap lokasi rencana kegiatan..." 
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all placeholder:text-slate-400"
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Step 3: Data Pemrakarsa Amdalnet */}
                <div id="step-3" className={currentStep === 3 ? 'block animate-in fade-in slide-in-from-right-4 duration-300 space-y-6' : 'hidden'}>
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-emerald-600 font-black text-xl uppercase tracking-wide flex items-center gap-2">
                      <UserCheck size={22} /> Data Pemrakarsa & Konsultan Penyusun
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Identitas penanggungjawab usaha dan narahubung penyusun dokumen
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                        <span>12. Pemrakarsa / Penanggungjawab</span>
                        <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-black border border-rose-200">Wajib</span>
                      </label>
                      <input 
                        type="text" 
                        name="nama_pemrakarsa" 
                        required 
                        placeholder="Nama Instansi / Perusahaan / Pribadi..." 
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all placeholder:text-slate-400" 
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                        <span>13. No. WhatsApp / Telp Pemrakarsa</span>
                        <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-black border border-rose-200">Wajib</span>
                      </label>
                      <input 
                        type="text" 
                        name="telepon_pemrakarsa" 
                        required 
                        onBlur={handlePhoneBlur}
                        placeholder="0812xxxx (Otomatis format 08)" 
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all placeholder:text-slate-400" 
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                        <span>14. Alamat Penanggungjawab</span>
                        <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-black border border-rose-200">Wajib</span>
                      </label>
                      <textarea 
                        name="alamat_pemrakarsa" 
                        required 
                        rows={2} 
                        placeholder="Alamat domisili atau kantor pusat penanggungjawab..." 
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all placeholder:text-slate-400"
                      ></textarea>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block mb-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                        15. Nama Konsultan Penyusun (Opsional)
                      </label>
                      <input 
                        type="text" 
                        name="nama_konsultan" 
                        placeholder="Nama PT / CV Konsultan..." 
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all placeholder:text-slate-400" 
                      />
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-r from-emerald-50 to-slate-50 border-2 border-emerald-100 rounded-2xl flex items-start gap-4">
                     <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                       <Globe size={20} />
                     </div>
                     <div>
                       <h4 className="font-black text-slate-900 text-sm uppercase">Konfirmasi Data Amdalnet</h4>
                       <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                         Pastikan data yang dimasukkan telah sesuai dengan berkas di sistem Amdalnet KLHK. Setelah disimpan, nomor checklist resmi DLH akan diterbitkan dan lembar registrasi dapat langsung diunduh.
                       </p>
                     </div>
                  </div>
                </div>
              </>
            )}

            {/* Navigation Buttons (Bawah Wizard) */}
            <div className="mt-10 pt-6 border-t-2 border-slate-100 flex justify-between items-center">
              <div>
                {currentStep > 1 && (
                  <button 
                    type="button" 
                    onClick={handlePrev} 
                    className="px-6 py-3 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-sm"
                  >
                    <ArrowLeft size={16} /> Sebelumnya
                  </button>
                )}
              </div>

              <div>
                {currentStep < 3 ? (
                  <button 
                    type="button" 
                    onClick={handleNext} 
                    className={`px-8 py-3.5 rounded-xl font-black text-xs sm:text-sm shadow-md hover:shadow-lg flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 transition-all uppercase tracking-wider text-white ${
                      activeTab === 'manual' 
                        ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30' 
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                    }`}
                  >
                    Selanjutnya <ArrowRight size={16} />
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className={`px-9 py-3.5 rounded-xl font-black text-xs sm:text-sm shadow-md hover:shadow-lg flex items-center gap-2.5 hover:-translate-y-0.5 active:translate-y-0 transition-all uppercase tracking-wider text-white disabled:opacity-70 disabled:hover:translate-y-0 ${
                      activeTab === 'manual' 
                        ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30' 
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                    }`}
                  >
                    {loading ? <LottieLoader size={22} /> : <Send size={16} />}
                    {activeTab === 'manual' ? 'Simpan Registrasi' : 'Simpan Amdalnet'}
                  </button>
                )}
              </div>
            </div>

          </form>
        </div>
      )}
    </div>
  );
}
