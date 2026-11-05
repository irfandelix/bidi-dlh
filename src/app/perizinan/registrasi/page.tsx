'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Send, Loader2, Monitor, Globe, FilePlus, MapPin, UserCheck, CheckCircle, Printer, ArrowRight, ArrowLeft, Copy, Check, Download, RotateCcw } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

const OPSI_JENIS_DOKUMEN = [
  { value: "UKL-UPL", label: "UKL-UPL" },
  { value: "AMDAL", label: "AMDAL" },
  { value: "SPPL", label: "SPPL" },
  { value: "PERTEK AIR LIMBAH", label: "Standar Teknis Pemenuhan Baku Mutu Air Limbah" },
  { value: "PERTEK EMISI", label: "Standar Teknis Pemenuhan Baku Mutu Emisi" },
  { value: "KAJIAN TEKNIS AIR LIMBAH", label: "Kajian Teknis Pemenuhan Baku Mutu Air Limbah" },
  { value: "KAJIAN TEKNIS EMISI", label: "Kajian Teknis Pemenuhan Baku Mutu Emisi" },
  { value: "Rincian Teknis dan Intergrasi Rincian Teknis Limbah B3 ke Persetujuan Lingkungan", label: "Rincian Teknis dan Intergrasi Rincian Teknis Limbah B3 ke Persetujuan Lingkungan" },
  { value: "SLO", label: "SLO" },
  { value: "DPLH", label: "DPLH" },
  { value: "DELH", label: "DELH" },
  { value: "Permohonan Arahan", label: "Permohonan Arahan" },
  { value: "Permohonan Perubahan Dokumen Lingkungan", label: "Permohonan Perubahan Dokumen Lingkungan" },
];

export default function RegistrasiPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'manual' | 'amdalnet'>('manual');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedJenisDokumen, setSelectedJenisDokumen] = useState<string>('UKL-UPL');
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
    setSelectedJenisDokumen('UKL-UPL');
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
    data.jenis_dokumen = rawData.jenis_dokumen || selectedJenisDokumen;
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

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8 pb-20">
      
      {/* Tombol Kembali ke Dashboard (Konsisten dengan tahap lainnya) */}
      <Link href="/perizinan/daftar" className="inline-flex items-center gap-2 text-sm text-slate-800 font-bold transition-all bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Dashboard
      </Link>

      {/* Header NeoBrutalism (Sama persis dengan tahap lainnya) */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
        <div className="w-14 h-14 rounded-xl bg-indigo-400 border border-slate-200 flex items-center justify-center shadow-sm">
          <FilePlus className="w-8 h-8 text-slate-900" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">Registrasi Dokumen Masuk</h2>
          <p className="text-sm font-bold text-slate-600 mt-1 uppercase">Penerimaan MPP / DLH | TAHAP 1: REGISTRASI</p>
        </div>
      </div>

      {/* Tabs */}
      {!successMsg && (
        <div className="flex space-x-3 w-fit mb-6">
          <button 
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 border border-slate-200 ${
              activeTab === 'manual' ? 'bg-indigo-400 text-slate-900 shadow-sm translate-y-0' : 'bg-white text-slate-700 shadow-sm hover:-translate-y-1'
            }`}
          >
            <Monitor size={18} /> MANUAL (MPP)
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('amdalnet')}
            className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 border border-slate-200 ${
              activeTab === 'amdalnet' ? 'bg-emerald-400 text-slate-900 shadow-sm translate-y-0' : 'bg-white text-slate-700 shadow-sm hover:-translate-y-1'
            }`}
          >
            <Globe size={18} /> AMDALNET
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-200 text-slate-900 p-4 rounded-xl mb-6 text-sm font-bold border border-slate-200 shadow-sm">
          {errorMsg}
        </div>
      )}

      {/* Layar Sukses */}
      {successMsg && (
        <div className="bg-emerald-50 text-slate-900 p-8 rounded-3xl mb-6 border border-slate-200 shadow-md text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-400 border border-slate-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle size={40} className="text-slate-900" />
          </div>
          <h3 className="text-2xl font-black uppercase text-slate-900">{successMsg}</h3>
          {createdNomorChecklist && (
            <div className="max-w-lg mx-auto p-4 bg-white border border-emerald-300 rounded-2xl shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nomor Registrasi / Checklist Tersimpan</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="font-mono font-black text-base text-emerald-950 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200">
                  {createdNomorChecklist}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(createdNomorChecklist);
                    setCopiedNomor(true);
                    setTimeout(() => setCopiedNomor(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs uppercase flex items-center gap-1"
                >
                  {copiedNomor ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copiedNomor ? 'Tersalin' : 'Salin'}
                </button>
              </div>
            </div>
          )}
          <p className="text-sm font-bold text-slate-600">Silakan unduh berkas Tanda Terima dan Checklist pendaftaran berikut:</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {activeTab === 'amdalnet' ? (
              <button 
                type="button"
                onClick={() => handleDownload('Lembar_Registrasi_Amdalnet')}
                disabled={downloading === 'Lembar_Registrasi_Amdalnet'}
                className="w-full sm:w-auto px-6 py-4 bg-emerald-400 hover:bg-emerald-300 text-slate-900 border border-slate-200 font-black rounded-xl text-sm shadow-sm hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {downloading === 'Lembar_Registrasi_Amdalnet' ? <LottieLoader size={24} /> : <Download size={18} />}
                Unduh Lembar Registrasi Amdalnet (.docx)
              </button>
            ) : (
              <>
                <button 
                  type="button"
                  onClick={() => handleDownload('template_tanda_terima_registrasi')}
                  disabled={downloading === 'template_tanda_terima_registrasi'}
                  className="w-full sm:w-auto px-6 py-4 bg-amber-400 hover:bg-amber-300 text-slate-900 border border-slate-200 font-black rounded-xl text-sm shadow-sm hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {downloading === 'template_tanda_terima_registrasi' ? <LottieLoader size={24} /> : <Download size={18} />}
                  Unduh Berkas Tanda Terima (.docx)
                </button>
                <button 
                  type="button"
                  onClick={() => handleDownload('template_checklist')}
                  disabled={downloading === 'template_checklist'}
                  className="w-full sm:w-auto px-6 py-4 bg-teal-400 hover:bg-teal-300 text-slate-900 border border-slate-200 font-black rounded-xl text-sm shadow-sm hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {downloading === 'template_checklist' ? <LottieLoader size={24} /> : <Download size={18} />}
                  Unduh Berkas Checklist (.docx)
                </button>
              </>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button 
              type="button"
              onClick={handleResetForm}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 font-black rounded-xl text-sm shadow-sm hover:-translate-y-0.5 transition-all uppercase flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} /> Daftarkan Berkas Lainnya (+)
            </button>

            {createdDocId && (
              <Link
                href={`/perizinan/uji-administrasi/${createdDocId}`}
                className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 font-black rounded-xl text-sm shadow-sm hover:-translate-y-0.5 transition-all uppercase flex items-center justify-center gap-2"
              >
                Lanjut ke Tahap 2: Uji Administrasi <ArrowRight size={16} />
              </Link>
            )}

            <button 
              type="button"
              onClick={() => router.push('/perizinan/daftar')}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-black rounded-xl text-sm shadow-sm hover:-translate-y-0.5 transition-all uppercase flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} /> Kembali ke Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Main Form Container NeoBrutalism */}
      {!successMsg && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-md">
          
          {/* Progress Indicator (Interaktif & Bisa Diklik) */}
          <div className="flex items-start justify-between mb-8 relative px-4 sm:px-8">
            <div className="absolute left-[16.666667%] right-[16.666667%] top-6 -translate-y-1/2 h-1 bg-slate-200 z-0">
              <div 
                className={`h-full transition-all duration-300 ease-in-out ${activeTab === 'manual' ? 'bg-indigo-400' : 'bg-emerald-400'}`}
                style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
              ></div>
            </div>
            
            {[1, 2, 3].map((step) => (
              <button 
                key={step} 
                type="button"
                onClick={() => goToStep(step)}
                className="flex flex-col items-center gap-2 relative z-10 w-1/3 cursor-pointer group focus:outline-none"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg transition-all border ${
                  currentStep >= step 
                    ? (activeTab === 'manual' ? 'bg-indigo-400 text-slate-900 border-slate-200 shadow-sm' : 'bg-emerald-400 text-slate-900 border-slate-200 shadow-sm')
                    : 'bg-white text-slate-400 border-slate-200 group-hover:border-slate-300'
                }`}>
                  {step}
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest hidden sm:block text-center ${currentStep >= step ? 'text-slate-900' : 'text-slate-400'}`}>
                  {getStepTitle(step)}
                </span>
              </button>
            ))}
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
            
            {/* MANUAL TAB CONTENT */}
            {activeTab === 'manual' && (
              <>
                {/* Step 1: Data Registrasi Utama */}
                <div id="step-1" className={currentStep === 1 ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}>
                  <h3 className="text-indigo-600 font-black text-xl mb-6 flex items-center border-b border-slate-200 pb-4 uppercase">
                    Data Registrasi Utama
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Nomor Surat Permohonan</label>
                        <input type="text" name="nomor_surat_permohonan" placeholder="Contoh: 600.4.1/123/2026..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm transition-all outline-none" />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Tanggal Surat Permohonan</label>
                        <input type="date" name="tanggal_surat_permohonan" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm transition-all outline-none cursor-pointer" />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Perihal</label>
                        <input type="text" name="perihal_surat_permohonan" placeholder="Permohonan Pemeriksaan Dokumen..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm transition-all outline-none" />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Nama Kegiatan <span className="text-rose-500">*</span></label>
                        <input type="text" name="nama_kegiatan" required placeholder="Nama kegiatan atau proyek..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm transition-all outline-none" />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Lokasi Kegiatan</label>
                        <textarea name="lokasi_kegiatan" rows={2} placeholder="Alamat lengkap kegiatan..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm transition-all outline-none"></textarea>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Jenis Kegiatan</label>
                        <select name="jenis_kegiatan" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm transition-all outline-none cursor-pointer">
                          <option value="Perumahan">Perumahan</option>
                          <option value="Industri">Industri</option>
                          <option value="Perdagangan">Perdagangan</option>
                          <option value="Kesehatan">Fasilitas Kesehatan</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Tanggal Masuk Dokumen <span className="text-rose-500">*</span></label>
                        <input type="date" name="tanggal_masuk_dokumen" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm transition-all outline-none cursor-pointer" />
                      </div>
                    </div>

                    {/* JENIS DOKUMEN: Kartu Pilihan (Bisa langsung diklik 1) */}
                    <div className="md:col-span-2 pt-2 border-t border-slate-200">
                      <label className="block mb-3 text-sm font-black text-slate-900 uppercase flex items-center justify-between">
                        <span>Pilih Jenis Dokumen <span className="text-rose-500">*</span></span>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">Klik untuk memilih</span>
                      </label>
                      
                      <input type="hidden" name="jenis_dokumen" value={selectedJenisDokumen} required />

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {OPSI_JENIS_DOKUMEN.map((doc) => {
                          const isSelected = selectedJenisDokumen === doc.value;
                          return (
                            <button
                              key={doc.value}
                              type="button"
                              onClick={() => setSelectedJenisDokumen(doc.value)}
                              className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-400 text-slate-900 border-slate-300 shadow-sm font-black scale-[1.01]'
                                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-white font-bold hover:shadow-sm'
                              }`}
                            >
                              <span className="text-xs uppercase leading-snug">
                                {doc.label}
                              </span>
                              {isSelected && (
                                <Check size={18} strokeWidth={3} className="shrink-0 text-slate-900" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Kontak & Pengirim */}
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <p className="text-sm font-black text-slate-900 mb-6 uppercase bg-emerald-100 inline-block px-3 py-1 rounded border border-slate-200">Informasi Kontak & Pengirim</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Pemrakarsa <span className="text-rose-500">*</span></label>
                          <input type="text" name="nama_pemrakarsa" required placeholder="PT / CV / Pribadi..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
                        </div>
                        <div>
                          <label className="block mb-2 text-sm font-black text-slate-900 uppercase">No. Telp Pemrakarsa</label>
                          <input type="text" name="telepon_pemrakarsa" onBlur={handlePhoneBlur} placeholder="0812xxxx" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Nama Konsultan</label>
                          <input type="text" name="nama_konsultan" placeholder="Nama konsultan..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
                        </div>
                        <div>
                          <label className="block mb-2 text-sm font-black text-slate-900 uppercase">No. Telp Konsultan</label>
                          <input type="text" name="telepon_konsultan" onBlur={handlePhoneBlur} placeholder="0812xxxx" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Status Pengirim</label>
                          <select name="pengirim_sebagai" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all cursor-pointer">
                            <option value="Pemrakarsa">Pemrakarsa</option>
                            <option value="Konsultan">Konsultan</option>
                            <option value="Kuasa">Kuasa Hukum</option>
                          </select>
                        </div>
                        <div>
                          <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Nama Pengirim</label>
                          <input type="text" name="nama_pengirim" placeholder="Nama orang pengantar berkas..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Keterangan Tambahan</label>
                        <input type="text" name="keterangan" placeholder="Catatan tambahan..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Checklist */}
                <div id="step-2" className={currentStep === 2 ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}>
                  <h3 className="text-indigo-600 font-black text-xl mb-6 flex items-center border-b border-slate-200 pb-4 uppercase">
                    Checklist Kelengkapan
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                    <table className="w-full text-xs text-left text-slate-900">
                      <thead className="bg-slate-100 uppercase font-black border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-4 w-12 text-center border-r border-slate-200">No</th>
                          <th className="px-4 py-4 border-r border-slate-200">Persyaratan Dokumen</th>
                          <th className="px-4 py-4 w-16 text-center border-r border-slate-200">PL</th>
                          <th className="px-4 py-4 w-16 text-center border-r border-slate-200">PERTEK</th>
                          <th className="px-4 py-4 w-16 text-center border-r border-slate-200">RINTEK</th>
                          <th className="px-4 py-4 w-1/3">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white font-bold">
                        {checklistItems.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-center border-r border-slate-200">{index + 1}</td>
                            <td className="px-4 py-3 border-r border-slate-200">{item}</td>
                            <td className="px-4 py-3 text-center border-r border-slate-200">
                              <input type="checkbox" name={`checklistStatusPL[${index}]`} value="true" className="w-5 h-5 rounded border border-slate-200 text-indigo-600 focus:ring-indigo-600 cursor-pointer shadow-sm" />
                            </td>
                            <td className="px-4 py-3 text-center border-r border-slate-200">
                              <input type="checkbox" name={`checklistStatusPertek[${index}]`} value="true" className="w-5 h-5 rounded border border-slate-200 text-indigo-600 focus:ring-indigo-600 cursor-pointer shadow-sm" />
                            </td>
                            <td className="px-4 py-3 text-center border-r border-slate-200">
                              <input type="checkbox" name={`checklistStatusRintek[${index}]`} value="true" className="w-5 h-5 rounded border border-slate-200 text-indigo-600 focus:ring-indigo-600 cursor-pointer shadow-sm" />
                            </td>
                            <td className="px-4 py-2">
                              <input type="text" name={`checklistNotes[${index}]`} placeholder="..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white outline-none" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Step 3: Kesimpulan */}
                <div id="step-3" className={currentStep === 3 ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}>
                  <h3 className="text-indigo-600 font-black text-xl mb-6 flex items-center border-b border-slate-200 pb-4 uppercase">
                    Kesimpulan Verifikasi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-w-3xl">
                    <div>
                      <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Status Kelengkapan</label>
                      <select name="status_verifikasi" className="block w-full p-4 text-sm rounded-xl border border-slate-200 bg-slate-50 font-black text-slate-900 focus:bg-white outline-none cursor-pointer hover:shadow-sm transition-all">
                        <option value="Lengkap / Diterima">LENGKAP / DITERIMA</option>
                        <option value="Diterima dengan Catatan">DITERIMA DENGAN CATATAN</option>
                        <option value="Ditolak / Dikembalikan">DITOLAK / DIKEMBALIKAN</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Penerima (Petugas) <span className="text-rose-500">*</span></label>
                      <select name="penerima_id" required className="block w-full p-4 text-sm rounded-xl border border-slate-200 bg-slate-50 font-black text-slate-900 focus:bg-white outline-none cursor-pointer hover:shadow-sm transition-all">
                        <option value="">PILIH PENERIMA...</option>
                        {timPenilais.map((tp) => (
                          <option key={tp.id} value={tp.id}>{tp.nama} {tp.jabatan_dinas ? `(${tp.jabatan_dinas})` : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-8 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-4">
                     <Monitor className="text-indigo-400 shrink-0 mt-1" size={24} />
                     <div>
                       <h4 className="font-bold text-slate-900">Konfirmasi Penyimpanan</h4>
                       <p className="text-sm text-slate-600 mt-1">Pastikan kembali data registrasi manual dan kelengkapan checklist sudah benar. Nomor registrasi akan muncul dan berkas tanda terima dapat diunduh setelah data disimpan.</p>
                     </div>
                  </div>
                </div>
              </>
            )}

            {/* AMDALNET TAB CONTENT */}
            {activeTab === 'amdalnet' && (
              <>
                {/* Step 1: Data Dokumen Amdalnet */}
                <div id="step-1" className={currentStep === 1 ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}>
                  <h3 className="text-emerald-500 font-black text-xl mb-6 flex items-center border-b border-slate-200 pb-4 uppercase">
                    Data Dokumen Sistem Amdalnet
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="md:col-span-2">
                      <label className="block mb-2 text-sm font-black text-slate-900 uppercase">1. Nomor Checklist (Sistem DLH)</label>
                      <input type="text" className="w-full bg-slate-100 border border-slate-200 text-slate-500 italic rounded-xl px-4 py-3 text-sm cursor-not-allowed outline-none font-bold" value="Otomatis dibuat saat disimpan (Format: 600.4.5/...)" disabled />
                    </div>
                    
                    <div>
                      <label className="block mb-2 text-sm font-black text-slate-900 uppercase">2. Nomor Registrasi Amdalnet <span className="text-rose-500">*</span></label>
                      <input type="text" name="nomor_registrasi_amdalnet" required placeholder="Contoh: AMDALNET/2026/..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-black text-slate-900 uppercase">3. Tanggal Masuk Dokumen <span className="text-rose-500">*</span></label>
                      <input type="date" name="tanggal_masuk_dokumen" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all cursor-pointer" />
                    </div>

                    {/* JENIS DOKUMEN AMDALNET: Kartu Pilihan (Bisa langsung diklik 1) */}
                    <div className="md:col-span-2 pt-2 border-t border-slate-200">
                      <label className="block mb-3 text-sm font-black text-slate-900 uppercase flex items-center justify-between">
                        <span>4. Pilih Jenis Dokumen <span className="text-rose-500">*</span></span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">Klik untuk memilih</span>
                      </label>
                      
                      <input type="hidden" name="jenis_dokumen" value={selectedJenisDokumen} required />

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {OPSI_JENIS_DOKUMEN.map((doc) => {
                          const isSelected = selectedJenisDokumen === doc.value;
                          return (
                            <button
                              key={doc.value}
                              type="button"
                              onClick={() => setSelectedJenisDokumen(doc.value)}
                              className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-400 text-slate-900 border-slate-300 shadow-sm font-black scale-[1.01]'
                                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-white font-bold hover:shadow-sm'
                              }`}
                            >
                              <span className="text-xs uppercase leading-snug">
                                {doc.label}
                              </span>
                              {isSelected && (
                                <Check size={18} strokeWidth={3} className="shrink-0 text-slate-900" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
      
                    <div className="md:col-span-2">
                      <label className="block mb-2 text-sm font-black text-slate-900 uppercase">5. Nomor Surat Permohonan <span className="text-rose-500">*</span></label>
                      <input type="text" name="nomor_surat_permohonan" required placeholder="Contoh: 660.1/123/2026..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-black text-slate-900 uppercase">6. Tanggal Surat Permohonan <span className="text-rose-500">*</span></label>
                      <input type="date" name="tanggal_surat_permohonan" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all cursor-pointer" />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-black text-slate-900 uppercase">7. Perihal Surat Permohonan <span className="text-rose-500">*</span></label>
                      <input type="text" name="perihal_surat_permohonan" required placeholder="Permohonan Arahan..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
                    </div>
                  </div>
                </div>

                {/* Step 2: Detail Kegiatan */}
                <div id="step-2" className={currentStep === 2 ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}>
                  <h3 className="text-emerald-500 font-black text-xl mb-6 flex items-center border-b border-slate-200 pb-4 uppercase">
                    Detail Usaha / Kegiatan
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="md:col-span-2">
                       <label className="block mb-2 text-sm font-black text-slate-900 uppercase">8. Nama Kegiatan <span className="text-rose-500">*</span></label>
                       <input type="text" name="nama_kegiatan" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-black text-slate-900 uppercase">9. Jenis Kegiatan (Bidang) <span className="text-rose-500">*</span></label>
                      <input type="text" name="jenis_kegiatan" required placeholder="Kesehatan / Industri..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-black text-slate-900 uppercase">10. Besaran Luasan <span className="text-rose-500">*</span></label>
                      <div className="flex">
                        <input type="number" name="besaran_luasan" required placeholder="Angka luasan..." className="w-2/3 bg-slate-50 border border-slate-200 rounded-l-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all border-r-0" />
                        <select name="satuan_luasan" className="w-1/3 bg-slate-100 border border-slate-200 rounded-r-xl px-4 py-3 text-sm font-black text-slate-900 outline-none cursor-pointer">
                            <option value="m2">m²</option>
                            <option value="Ha">Ha</option>
                        </select>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block mb-2 text-sm font-black text-slate-900 uppercase">11. Lokasi Kegiatan (Alamat) <span className="text-rose-500">*</span></label>
                      <textarea name="lokasi_kegiatan" required rows={2} placeholder="Alamat lengkap..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all"></textarea>
                    </div>
                  </div>
                </div>

                {/* Step 3: Data Pemrakarsa */}
                <div id="step-3" className={currentStep === 3 ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden'}>
                  <h3 className="text-emerald-500 font-black text-xl mb-6 flex items-center border-b border-slate-200 pb-4 uppercase">
                    Data Pemrakarsa & Konsultan
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <label className="block mb-2 text-sm font-black text-slate-900 uppercase">12. Pemrakarsa / Penanggungjawab <span className="text-rose-500">*</span></label>
                      <input type="text" name="nama_pemrakarsa" required placeholder="Nama Instansi / Pribadi..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-black text-slate-900 uppercase">13. No. Telp Pemrakarsa <span className="text-rose-500">*</span></label>
                      <input type="text" name="telepon_pemrakarsa" required onBlur={handlePhoneBlur} placeholder="0812xxxx" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block mb-2 text-sm font-black text-slate-900 uppercase">14. Alamat Penanggungjawab <span className="text-rose-500">*</span></label>
                      <textarea name="alamat_pemrakarsa" required rows={2} placeholder="Alamat domisili/kantor..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all"></textarea>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block mb-2 text-sm font-black text-slate-900 uppercase">15. Nama Konsultan Penyusun (Opsional)</label>
                      <input type="text" name="nama_konsultan" placeholder="Nama PT / CV Konsultan..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
                    </div>
                  </div>
                  
                  <div className="mt-8 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-4">
                     <Globe className="text-emerald-500 shrink-0 mt-1" size={24} />
                     <div>
                       <h4 className="font-bold text-slate-900">Konfirmasi Amdalnet</h4>
                       <p className="text-sm text-slate-600 mt-1">Pastikan data yang dimasukkan sesuai dengan dokumen di sistem Amdalnet. Jika sesuai, silakan simpan dan unduh lembar registrasinya.</p>
                     </div>
                  </div>
                </div>
              </>
            )}

            {/* Navigation Buttons (Sesuai gaya asli) */}
            <div className="mt-10 pt-6 border-t border-slate-200 flex justify-between items-center">
              <div>
                {currentStep > 1 && (
                  <button type="button" onClick={handlePrev} className="px-6 py-3 rounded-xl font-black flex items-center gap-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:-translate-y-0.5 transition-all shadow-sm">
                    <ArrowLeft size={18} /> Sebelumnya
                  </button>
                )}
              </div>
              <div>
                {currentStep < 3 ? (
                  <button type="button" onClick={handleNext} className={`px-8 py-3 rounded-xl font-black shadow-sm hover:shadow-md flex items-center gap-2 border border-slate-200 hover:-translate-y-0.5 transition-all text-slate-900 uppercase tracking-widest ${activeTab === 'manual' ? 'bg-indigo-300 hover:bg-indigo-200' : 'bg-emerald-300 hover:bg-emerald-200'}`}>
                    Selanjutnya <ArrowRight size={18} />
                  </button>
                ) : (
                  <button type="submit" disabled={loading} className={`px-8 py-3 rounded-xl font-black shadow-sm hover:shadow-md flex items-center gap-2 border border-slate-200 hover:-translate-y-0.5 transition-all text-slate-900 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0 ${activeTab === 'manual' ? 'bg-indigo-400 hover:bg-indigo-300' : 'bg-emerald-400 hover:bg-emerald-300'}`}>
                    {loading ? <LottieLoader size={24} /> : <Send size={18} />}
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
