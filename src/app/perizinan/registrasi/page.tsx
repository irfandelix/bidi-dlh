'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, Monitor, Globe, FilePlus, MapPin, UserCheck, CheckCircle, Printer, ArrowRight, ArrowLeft } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function RegistrasiPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'manual' | 'amdalnet'>('manual');
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);
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

  const checklistItems = [
    "Surat Permohonan Pemeriksaan Dokumen UKL-UPL / SPPL*", 
    "Pernyataan Pengelolaan dan Pemantauan Lingkungan (Bermaterai)*",
    "Dokumen Lingkungan*", 
    "Peta (Peta Tapak, Peta Pengelolaan, Peta Pemantauan, dll) - Siteplan di Kertas A3", 
    "PKKPR",
    "NIB (Untuk Swasta atau Perorangan)", 
    "Fotocopy Status Lahan (Sertifikat)", 
    "Fotocopy KTP Penanggungjawab Kegiatan",
    "Foto Eksisting Lokasi Rencana Kegiatan Disertai dengan Titik Koordinat", 
    "Lembar Penapisan dari AMDALNET / Arahan dari Instansi Lingkungan Hidup",
    "Surat Kuasa Pekerjaan dari Pemrakarsa ke Konsultan (Bermaterai)", 
    "Perizinan yang Sudah Dimiliki atau Izin yang Lama (Jika Ada)",
    "Pemenuhan Persetujuan Teknis Air Limbah", 
    "Pemenuhan Rincian Teknis Limbah B3 Sementara", 
    "Pemenuhan Persetujuan Teknis Emisi", 
    "Pemenuhan Persetujuan Teknis Andalalin", 
    "Hasil Penapisan Kewajiban Pemenuhan Persetujuan Teknis", 
    "Bukti Upload Permohonan pada AMDALNET dan/atau SIDARLING"
  ];

  const handleNext = () => {
    // Validate current step fields before proceeding
    const stepContainer = document.getElementById(`step-${currentStep}`);
    if (stepContainer) {
      const inputs = stepContainer.querySelectorAll('input[required], select[required], textarea[required]');
      let isValid = true;
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i] as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        if (!input.checkValidity()) {
          input.reportValidity();
          isValid = false;
          break;
        }
      }
      if (isValid) {
        setCurrentStep(c => Math.min(c + 1, 3));
      }
    } else {
      setCurrentStep(c => Math.min(c + 1, 3));
    }
  };

  const handlePrev = () => {
    setCurrentStep(c => Math.max(c - 1, 1));
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
    
    data.nomor_surat_permohonan = rawData.nomor_surat_permohonan;
    data.tanggal_surat_permohonan = rawData.tanggal_surat_permohonan;
    data.perihal_surat_permohonan = rawData.perihal_surat_permohonan;
    data.tanggal_masuk_dokumen = rawData.tanggal_masuk_dokumen;
    
    data.telepon_pemrakarsa = rawData.telepon_pemrakarsa;
    data.nama_konsultan = rawData.nama_konsultan;
    data.telepon_konsultan = rawData.telepon_konsultan;
    
    data.pengirim_sebagai = rawData.pengirim_sebagai;
    data.nama_pengirim = rawData.nama_pengirim;
    data.keterangan = rawData.keterangan;
    data.petugas_mpp_id = rawData.penerima_id ? parseInt(rawData.penerima_id) : null;
    
    data.nomor_checklist = rawData.nomor_checklist;
    data.status_verifikasi = rawData.status_verifikasi;

    // Map checklist items if manual tab
    if (activeTab === 'manual') {
      const checklistStatus = checklistItems.map((_, i) => formData.get(`checklistStatus[${i}]`) === 'true');
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

      setSuccessMsg('Registrasi berhasil disubmit!');
      setCreatedDocId(result.data.id);
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
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
        <div className="w-14 h-14 rounded-xl bg-indigo-400 border border-slate-200 flex items-center justify-center shadow-sm">
          <FilePlus className="w-8 h-8 text-slate-900" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Registrasi Dokumen Masuk</h2>
          <p className="text-sm font-bold text-slate-600 mt-1 uppercase">Penerimaan MPP / DLH</p>
        </div>
      </div>

      {/* Tabs */}
      {!successMsg && (
        <div className="flex space-x-3 w-fit mb-6">
          <button 
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 border border-slate-200 ${
              activeTab === 'manual' ? 'bg-indigo-400 text-slate-900 shadow-sm translate-y-0' : 'bg-white text-slate-700 shadow-sm hover:-translate-y-1'
            }`}
          >
            <Monitor size={18} /> MANUAL (MPP)
          </button>
          <button 
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

      {successMsg && (
        <div className="bg-emerald-50 text-slate-900 p-8 rounded-3xl mb-6 border border-slate-200 shadow-md text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-400 border border-slate-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle size={40} className="text-slate-900" />
          </div>
          <h3 className="text-2xl font-black uppercase text-slate-900">{successMsg}</h3>
          <p className="text-sm font-bold text-slate-600">Silakan cetak Tanda Terima dan Checklist pendaftaran berikut:</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {activeTab === 'amdalnet' ? (
              <button 
                type="button"
                onClick={() => handleDownload('Lembar_Registrasi_Amdalnet')}
                disabled={downloading === 'Lembar_Registrasi_Amdalnet'}
                className="w-full sm:w-auto px-6 py-4 bg-emerald-400 hover:bg-emerald-300 text-slate-900 border border-slate-200 font-black rounded-xl text-sm shadow-sm hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {downloading === 'Lembar_Registrasi_Amdalnet' ? <LottieLoader size={24} /> : <Printer size={18} />}
                Cetak Lembar Registrasi Amdalnet
              </button>
            ) : (
              <>
                <button 
                  type="button"
                  onClick={() => handleDownload('template_tanda_terima_registrasi')}
                  disabled={downloading === 'template_tanda_terima_registrasi'}
                  className="w-full sm:w-auto px-6 py-4 bg-amber-400 hover:bg-amber-300 text-slate-900 border border-slate-200 font-black rounded-xl text-sm shadow-sm hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {downloading === 'template_tanda_terima_registrasi' ? <LottieLoader size={24} /> : <Printer size={18} />}
                  Cetak Tanda Terima
                </button>
                <button 
                  type="button"
                  onClick={() => handleDownload('template_checklist')}
                  disabled={downloading === 'template_checklist'}
                  className="w-full sm:w-auto px-6 py-4 bg-teal-400 hover:bg-teal-300 text-slate-900 border border-slate-200 font-black rounded-xl text-sm shadow-sm hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {downloading === 'template_checklist' ? <LottieLoader size={24} /> : <Printer size={18} />}
                  Cetak Checklist
                </button>
              </>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-slate-200">
            <button 
              type="button"
              onClick={() => router.push('/perizinan/daftar')}
              className="px-8 py-3 bg-slate-900 text-white border border-slate-200 font-black rounded-xl text-sm shadow-sm hover:-translate-y-1 transition-all uppercase"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      )}

      {!successMsg && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-md">
          {/* Progress Indicator */}
          <div className="flex items-start justify-between mb-8 relative px-4 sm:px-8">
            {/* The connecting line - centered on the 48px (h-12) circles, so top-6 */}
            <div className="absolute left-[16.666667%] right-[16.666667%] top-6 -translate-y-1/2 h-1 bg-slate-200 z-0">
              <div 
                className={`h-full transition-all duration-300 ease-in-out ${activeTab === 'manual' ? 'bg-indigo-400' : 'bg-emerald-400'}`}
                style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
              ></div>
            </div>
            
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center gap-2 relative z-10 w-1/3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg transition-colors border ${
                  currentStep >= step 
                    ? (activeTab === 'manual' ? 'bg-indigo-400 text-slate-900 border-slate-200 shadow-sm' : 'bg-emerald-400 text-slate-900 border-slate-200 shadow-sm')
                    : 'bg-white text-slate-400 border-slate-200'
                }`}>
                  {step}
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest hidden sm:block text-center ${currentStep >= step ? 'text-slate-900' : 'text-slate-400'}`}>
                  {getStepTitle(step)}
                </span>
              </div>
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
                        <input type="text" name="nomor_surat_permohonan" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm transition-all outline-none" />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Tanggal Surat Permohonan</label>
                        <input type="date" name="tanggal_surat_permohonan" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm transition-all outline-none" />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Perihal</label>
                        <input type="text" name="perihal_surat_permohonan" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm transition-all outline-none" />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Nama Kegiatan <span className="text-rose-500">*</span></label>
                        <input type="text" name="nama_kegiatan" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm transition-all outline-none" />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Lokasi Kegiatan</label>
                        <textarea name="lokasi_kegiatan" rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm transition-all outline-none"></textarea>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Jenis Dokumen <span className="text-rose-500">*</span></label>
                        <select name="jenis_dokumen" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-900 focus:bg-white focus:shadow-sm transition-all outline-none">
                          <option value="UKL-UPL">UKL-UPL</option>
                          <option value="AMDAL">AMDAL</option>
                          <option value="SPPL">SPPL</option>
                          <option value="KAJIAN TEKNIS AIR LIMBAH">Kajian Teknis Air Limbah</option>
                          <option value="KAJIAN TEKNIS EMISI">Kajian Teknis Emisi</option>
                          <option value="RINTEK LB3">Rincian Teknis Limbah B3</option>
                          <option value="PERTEK AIR LIMBAH">Persetujuan Teknis Air Limbah</option>
                          <option value="PERTEK EMISI">Persetujuan Teknis Emisi</option>
                          <option value="SLO">SLO</option>
                          <option value="DPLH">DPLH</option>
                          <option value="DELH">DELH</option>
                          <option value="Permohonan Arahan">Permohonan Arahan</option>
                          <option value="Integrasi RINTEK LB3 ke Persetujuan Lingkungan">Permohonan Integrasi RINTEK LB3 ke Persetujuan Lingkungan</option>
                          <option value="Permohonan Perubahan Lingkungan">Permohonan Perubahan Lingkungan</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Jenis Kegiatan</label>
                        <select name="jenis_kegiatan" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm transition-all outline-none">
                          <option value="Perumahan">Perumahan</option>
                          <option value="Industri">Industri</option>
                          <option value="Perdagangan">Perdagangan</option>
                          <option value="Kesehatan">Fasilitas Kesehatan</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Tanggal Masuk Dokumen <span className="text-rose-500">*</span></label>
                        <input type="date" name="tanggal_masuk_dokumen" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm transition-all outline-none" />
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
                          <input type="text" name="nama_pemrakarsa" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
                        </div>
                        <div>
                          <label className="block mb-2 text-sm font-black text-slate-900 uppercase">No. Telp Pemrakarsa</label>
                          <input type="text" name="telepon_pemrakarsa" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Nama Konsultan</label>
                          <input type="text" name="nama_konsultan" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
                        </div>
                        <div>
                          <label className="block mb-2 text-sm font-black text-slate-900 uppercase">No. Telp Konsultan</label>
                          <input type="text" name="telepon_konsultan" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Status Pengirim</label>
                          <select name="pengirim_sebagai" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all">
                            <option value="Pemrakarsa">Pemrakarsa</option>
                            <option value="Konsultan">Konsultan</option>
                            <option value="Kuasa">Kuasa Hukum</option>
                          </select>
                        </div>
                        <div>
                          <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Nama Pengirim</label>
                          <input type="text" name="nama_pengirim" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block mb-2 text-sm font-black text-slate-900 uppercase">Keterangan Tambahan</label>
                        <input type="text" name="keterangan" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
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
                          <th className="px-4 py-4 w-24 text-center border-r border-slate-200">Ada (V)</th>
                          <th className="px-4 py-4 w-1/3">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white font-bold">
                        {checklistItems.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-center border-r border-slate-200">{index + 1}</td>
                            <td className="px-4 py-3 border-r border-slate-200">{item}</td>
                            <td className="px-4 py-3 text-center border-r border-slate-200">
                              <input type="checkbox" name={`checklistStatus[${index}]`} value="true" className="w-5 h-5 rounded border border-slate-200 text-indigo-600 focus:ring-indigo-600 cursor-pointer shadow-sm" />
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
                          <option key={tp.id} value={tp.id}>{tp.nama}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-8 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-4">
                     <Monitor className="text-indigo-400 shrink-0 mt-1" size={24} />
                     <div>
                       <h4 className="font-bold text-slate-900">Konfirmasi Penyimpanan</h4>
                       <p className="text-sm text-slate-600 mt-1">Pastikan kembali data registrasi manual dan kelengkapan checklist sudah benar. Tanda terima akan dapat dicetak setelah data disimpan.</p>
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
                    <div className="md:col-span-2">
                      <label className="block mb-2 text-sm font-black text-slate-900 uppercase">4. Jenis Dokumen <span className="text-rose-500">*</span></label>
                      <select name="jenis_dokumen" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all cursor-pointer">
                        <option value="UKL-UPL">UKL-UPL</option>
                        <option value="AMDAL">AMDAL</option>
                        <option value="SPPL">SPPL</option>
                        <option value="KAJIAN TEKNIS AIR LIMBAH">Kajian Teknis Air Limbah</option>
                        <option value="KAJIAN TEKNIS EMISI">Kajian Teknis Emisi</option>
                        <option value="RINTEK LB3">Rincian Teknis Limbah B3</option>
                        <option value="PERTEK AIR LIMBAH">Persetujuan Teknis Air Limbah</option>
                        <option value="PERTEK EMISI">Persetujuan Teknis Emisi</option>
                        <option value="SLO">SLO</option>
                        <option value="DPLH">DPLH</option>
                        <option value="DELH">DELH</option>
                        <option value="Permohonan Arahan">Permohonan Arahan</option>
                        <option value="Integrasi RINTEK LB3 ke Persetujuan Lingkungan">Permohonan Integrasi RINTEK LB3 ke Persetujuan Lingkungan</option>
                        <option value="Permohonan Perubahan Lingkungan">Permohonan Perubahan Lingkungan</option>
                      </select>
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
                      <input type="text" name="telepon_pemrakarsa" required placeholder="0812xxxx..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:shadow-sm outline-none transition-all" />
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
                       <p className="text-sm text-slate-600 mt-1">Pastikan data yang dimasukkan sesuai dengan dokumen di sistem Amdalnet. Jika sesuai, silakan simpan dan cetak lembar registrasinya.</p>
                     </div>
                  </div>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
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
