'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Printer, 
  Loader2, 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  Copy, 
  Check, 
  ExternalLink,
  Building2,
  User,
  Phone,
  MapPin,
  Calendar,
  Layers,
  Briefcase,
  FileCheck,
  Eye,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function CetakClient({ doc, timPenilai = [] }: { doc: any; timPenilai?: any[] }) {
  const router = useRouter();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showAllStages, setShowAllStages] = useState(false);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(prev => (prev === key ? null : prev));
    }, 2000);
  };

  const renderCopyableNumber = (text: string | null | undefined, key: string) => {
    if (!text) return <span className="text-on-surface-variant/50 font-normal italic">-</span>;
    const isCopied = copiedKey === key;
    return (
      <div className="inline-flex items-center gap-2 flex-wrap">
        <span className="font-mono font-bold text-on-surface bg-surface-container px-2 py-0.5 rounded border border-outline-variant text-xs break-all">
          {text}
        </span>
        <button
          type="button"
          onClick={() => handleCopy(text, key)}
          className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-bold border transition-colors inline-flex items-center gap-1 uppercase ${
            isCopied
              ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
              : 'bg-surface hover:bg-surface-container-high text-on-surface border-outline-variant shadow-sm'
          }`}
          title="Salin Nomor"
        >
          {isCopied ? <Check size={12} /> : <Copy size={12} />}
          <span>{isCopied ? 'Tersalin' : 'Salin'}</span>
        </button>
      </div>
    );
  };

  const renderFileLink = (fileUrl: string | null | undefined, label: string = 'Lihat Berkas') => {
    if (!fileUrl) return null;
    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg border border-primary/20 transition-colors uppercase ml-2"
      >
        <ExternalLink size={12} />
        <span>{label}</span>
      </a>
    );
  };

  const getOfficerNames = (idsInput: any): string[] => {
    if (!idsInput) return [];
    let ids: (number | string)[] = [];
    try {
      if (typeof idsInput === 'string') {
        const parsed = JSON.parse(idsInput);
        ids = Array.isArray(parsed) ? parsed : [parsed];
      } else if (Array.isArray(idsInput)) {
        ids = idsInput;
      } else {
        ids = [idsInput];
      }
    } catch {
      ids = [idsInput];
    }
    return ids
      .map(id => {
        const found = timPenilai.find((t: any) => String(t.id) === String(id));
        return found ? `${found.nama}${found.jabatan_dinas ? ` (${found.jabatan_dinas})` : ''}` : null;
      })
      .filter(Boolean) as string[];
  };

  const extra = (() => {
    try {
      if (!doc.penandatangan_hua) return {};
      return typeof doc.penandatangan_hua === 'string' ? JSON.parse(doc.penandatangan_hua) : doc.penandatangan_hua;
    } catch {
      return {};
    }
  })();

  const petugasPenerimaNama = (() => {
    if (doc.petugas_mpp_id) {
      const found = timPenilai.find((t: any) => String(t.id) === String(doc.petugas_mpp_id));
      if (found) return `${found.nama}${found.jabatan_dinas ? ` (${found.jabatan_dinas})` : ''}`;
    }
    return doc.nama_petugas || null;
  })();

  const petugasJilidanNama = (() => {
    if (doc.petugas_mpp) {
      const found = timPenilai.find((t: any) => String(t.id) === String(doc.petugas_mpp));
      if (found) return `${found.nama}${found.jabatan_dinas ? ` (${found.jabatan_dinas})` : ''}`;
      if (typeof doc.petugas_mpp === 'object' && doc.petugas_mpp?.nama) return doc.petugas_mpp.nama;
      return String(doc.petugas_mpp);
    }
    return null;
  })();

  const renderNumberBadge = (numberText: string | null | undefined, copyKey: string) => {
    if (!numberText) return null;
    const isCopied = copiedKey === copyKey;
    return (
      <div className="mb-4 p-2.5 bg-surface-container-low border border-outline-variant rounded-xl flex items-center justify-between gap-2">
        <span className="text-xs font-bold font-mono text-on-surface break-all">{numberText}</span>
        <button
          type="button"
          onClick={() => handleCopy(numberText, copyKey)}
          className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold uppercase border flex items-center gap-1 transition-colors ${
            isCopied
              ? 'bg-emerald-500 text-white border-emerald-600'
              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
          }`}
        >
          {isCopied ? <Check size={13} /> : <Copy size={13} />}
          <span>{isCopied ? 'Tersalin' : 'Salin'}</span>
        </button>
      </div>
    );
  };

  const isAmdalnet = !!doc.nomor_registrasi_amdalnet || doc.sumber_data === 'AMDALNET' || (() => {
    try {
      if (!doc.extra_data) return false;
      const extraD = typeof doc.extra_data === 'string' ? JSON.parse(doc.extra_data) : doc.extra_data;
      return !!extraD?.is_amdalnet;
    } catch { return false; }
  })();

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const stagesPipeline = [
    { id: 1, name: 'Registrasi', done: !!doc.nomor_checklist, active: doc.status_tahapan === 'Registrasi' || doc.status_tahapan === 'Draft' },
    { id: 2, name: 'Uji Administrasi', done: !!doc.nomor_uji_berkas, active: doc.status_tahapan === 'Uji Administrasi' },
    { id: 3, name: 'Verlap', done: !!doc.nomor_ba_verlap, active: doc.status_tahapan === 'Verifikasi Lapangan' || doc.status_tahapan === 'Verlap Selesai' },
    { id: 4, name: 'Pemeriksaan', done: !!doc.nomor_ba_pemeriksaan, active: doc.status_tahapan === 'Pemeriksaan Substansi' || doc.status_tahapan === 'Pemeriksaan Selesai' },
    { id: 5, name: 'Penyerahan BA', done: !!doc.tanggal_pengembalian, active: doc.status_tahapan === 'Pengembalian' },
    { id: 6, name: 'Terima PHP', done: !!doc.nomor_php || !!doc.nomor_php1, active: doc.status_tahapan === 'Penerimaan Perbaikan' },
    { id: 7, name: 'Sidang Revisi', done: !!doc.nomor_revisi || !!doc.nomor_revisi_1, active: doc.status_tahapan === 'Pemeriksaan Revisi' },
    { id: 8, name: 'Serah BA Revisi', done: !!doc.tanggal_pengembalian && (!!doc.nomor_revisi || !!doc.nomor_revisi_1), active: doc.status_tahapan === 'Penyerahan BA Revisi' },
    { id: 9, name: 'Revisi Lanjut', done: !!doc.nomor_revisi_2 || !!doc.nomor_php2, active: doc.status_tahapan === 'Revisi Lanjutan' },
    { id: 10, name: 'RPD & SK', done: !!doc.nomor_sk || !!doc.nomor_risalah, active: doc.status_tahapan === 'Menunggu Finalisasi' || doc.status_tahapan === 'Finalisasi' },
    { id: 11, name: 'Jilidan', done: !!doc.tanggal_penerimaan_jilidan, active: doc.status_tahapan === 'Penerimaan Jilidan' || doc.status_tahapan === 'Jilidan' },
    { id: 12, name: 'Arsip', done: !!doc.arsip_fisik || doc.status_tahapan === 'Selesai', active: doc.status_tahapan === 'Arsip' || doc.status_tahapan === 'Selesai' }
  ];

  const handleDownload = async (type: string, stage: string, targetRevisi?: number) => {
    const downloadKey = targetRevisi ? `${type}_${targetRevisi}` : type;
    setDownloading(downloadKey);
    try {
      const payload = { id: doc.id, type, stage, target_revisi: targetRevisi };
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Gagal generate dokumen');
      
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      let filename = `${type}_${doc.id}.docx`;
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

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-tertiary text-on-tertiary border border-outline-variant flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
            <Printer className="w-8 h-8 text-on-surface" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-on-surface uppercase">Pusat Cetak Dokumen</h2>
            <p className="text-sm font-bold text-on-surface-variant mt-1 uppercase">Pengarsipan & Pencetakan Berkas Fisik</p>
          </div>
        </div>
        <Link href="/perizinan/daftar" className="px-5 py-2.5 bg-surface-container hover:bg-slate-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 transition-all flex items-center gap-2 uppercase">
          <ArrowLeft size={18} /> Kembali
        </Link>
      </div>

      {/* Info Dokumen */}
      <div className="bg-white border border-outline-variant rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div>
            <div className="bg-indigo-200 text-on-surface text-xs font-bold px-3 py-1 rounded uppercase border border-outline-variant shadow-sm hover:shadow-md transition-shadow inline-block mb-3">
              NO URUT: #{String(doc.no_urut || doc.id).padStart(3, '0')}/{doc.tahun || new Date().getFullYear()}
            </div>
            <h3 className="text-xl font-bold text-on-surface uppercase">{doc.nama_kegiatan}</h3>
            <p className="text-sm font-bold text-on-surface-variant mt-1">{doc.nama_pemrakarsa} &bull; {doc.jenis_dokumen}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-on-surface-variant uppercase">Status Saat Ini</p>
            <p className="text-sm font-bold text-primary uppercase bg-surface border border-outline-variant px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-shadow mt-1 inline-block">
              {doc.status_tahapan}
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Riwayat Informasi Dokumen Lengkap */}
      <div className="bg-surface border border-outline-variant rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-8">
        <div className="bg-primary text-on-primary px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-lg font-black text-on-primary uppercase tracking-wide">Riwayat & Detail Dokumen Lengkap</h4>
            <p className="text-xs text-on-primary/80 font-medium">Informasi menyeluruh permohonan, pemrakarsa, kegiatan, nomor surat, dan riwayat setiap tahapan</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAllStages(!showAllStages)}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-sm transition-all flex items-center gap-1.5 uppercase"
          >
            {showAllStages ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{showAllStages ? 'Tahapan Berisi Saja' : 'Lihat Semua 12 Tahap'}</span>
          </button>
        </div>

        {/* Stepper Progress 12 Tahapan */}
        <div className="p-4 bg-surface-container-low border-b border-outline-variant">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2.5 flex items-center gap-1.5">
            <Clock size={13} /> Alur Perjalanan Dokumen (12 Tahap):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {stagesPipeline.map(st => (
              <div 
                key={st.id} 
                className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
                  st.done
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 font-bold'
                    : st.active
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-900 font-black shadow-sm ring-1 ring-indigo-400'
                    : 'bg-surface border-outline-variant text-on-surface-variant/70 font-medium'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                  st.done
                    ? 'bg-emerald-600 text-white'
                    : st.active
                    ? 'bg-indigo-600 text-white animate-pulse'
                    : 'bg-surface-container text-on-surface-variant'
                }`}>
                  {st.done ? '✓' : st.id}
                </span>
                <span className="truncate" title={st.name}>{st.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <tbody className="divide-y-2 divide-slate-200">
              
              {/* 1. DATA PEMRAKARSA & KONTAK */}
              <tr className="bg-slate-100">
                <td colSpan={2} className="w-full bg-slate-100 py-2.5 px-6 font-black text-on-surface text-xs uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-primary shrink-0" />
                    <span>Data Pemrakarsa & Kontak</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-white">
                <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs align-top">Identitas Pemrakarsa</th>
                <td className="py-3 px-6 font-bold text-on-surface text-sm">
                  <div className="space-y-1">
                    <p><span className="text-on-surface-variant font-medium">Pemrakarsa:</span> {doc.nama_pemrakarsa || '-'}</p>
                    {extra.nama_perusahaan && (
                      <p><span className="text-on-surface-variant font-medium">Perusahaan / Badan Usaha:</span> {extra.nama_perusahaan}</p>
                    )}
                    {extra.jabatan_pemrakarsa && (
                      <p><span className="text-on-surface-variant font-medium">Jabatan:</span> {extra.jabatan_pemrakarsa}</p>
                    )}
                    <p><span className="text-on-surface-variant font-medium">No. Telepon / WA:</span> {doc.telepon_pemrakarsa || doc.no_telp_pemrakarsa || '-'}</p>
                    {extra.email_pemrakarsa && (
                      <p><span className="text-on-surface-variant font-medium">Email:</span> {extra.email_pemrakarsa}</p>
                    )}
                  </div>
                </td>
              </tr>
              {(doc.nama_konsultan || doc.telepon_konsultan || showAllStages) && (
                <tr className="hover:bg-white">
                  <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs align-top">Konsultan Lingkungan</th>
                  <td className="py-3 px-6 font-bold text-on-surface text-sm">
                    <div className="space-y-1">
                      <p><span className="text-on-surface-variant font-medium">Konsultan:</span> {doc.nama_konsultan || '-'}</p>
                      <p><span className="text-on-surface-variant font-medium">Kontak Konsultan:</span> {doc.telepon_konsultan || '-'}</p>
                    </div>
                  </td>
                </tr>
              )}
              {(doc.nama_pengirim || doc.pengirim_sebagai || showAllStages) && (
                <tr className="hover:bg-white">
                  <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs align-top">Pengirim Berkas</th>
                  <td className="py-3 px-6 font-bold text-on-surface text-sm">
                    <p><span className="text-on-surface-variant font-medium">Nama Pengirim:</span> {doc.nama_pengirim || '-'}</p>
                    <p><span className="text-on-surface-variant font-medium">Sebagai / Hubungan:</span> {doc.pengirim_sebagai || '-'}</p>
                  </td>
                </tr>
              )}

              {/* 2. DATA USAHA & KEGIATAN */}
              <tr className="bg-slate-100">
                <td colSpan={2} className="w-full bg-slate-100 py-2.5 px-6 font-black text-on-surface text-xs uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-primary shrink-0" />
                    <span>Data Usaha & Rencana Kegiatan</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-white">
                <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs align-top">Nama & Jenis Kegiatan</th>
                <td className="py-3 px-6 font-bold text-on-surface text-sm">
                  <div className="space-y-1">
                    <p className="text-base text-primary font-black uppercase">{doc.nama_kegiatan || '-'}</p>
                    {doc.jenis_kegiatan && (
                      <p><span className="text-on-surface-variant font-medium">Bidang / Jenis:</span> {doc.jenis_kegiatan}</p>
                    )}
                    {(doc.besaran_luasan || doc.satuan_luasan) && (
                      <p><span className="text-on-surface-variant font-medium">Skala / Besaran:</span> {doc.besaran_luasan || ''} {doc.satuan_luasan || ''}</p>
                    )}
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-white">
                <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs align-top">Lokasi Kegiatan</th>
                <td className="py-3 px-6 font-bold text-on-surface text-sm">
                  <p>{doc.lokasi_kegiatan || '-'}</p>
                  {(extra.kbli || extra.kewenangan) && (
                    <div className="mt-1 pt-1 border-t border-slate-100 flex flex-wrap gap-4 text-xs font-semibold text-on-surface-variant">
                      {extra.kbli && <span>KBLI: <strong className="text-on-surface">{extra.kbli}</strong></span>}
                      {extra.kewenangan && <span>Kewenangan: <strong className="text-on-surface">{extra.kewenangan}</strong></span>}
                    </div>
                  )}
                </td>
              </tr>

              {/* 3. ADMINISTRASI & KLASIFIKASI DOKUMEN */}
              <tr className="bg-slate-100">
                <td colSpan={2} className="w-full bg-slate-100 py-2.5 px-6 font-black text-on-surface text-xs uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FileCheck size={14} className="text-primary shrink-0" />
                    <span>Administrasi & Klasifikasi Dokumen</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-white">
                <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs align-top">Klasifikasi & Buku Kendali</th>
                <td className="py-3 px-6 font-bold text-on-surface text-sm">
                  <div className="space-y-1">
                    <p><span className="text-on-surface-variant font-medium">Jenis Dokumen Lingkungan:</span> <span className="bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded font-mono text-xs uppercase">{doc.jenis_dokumen || '-'}</span></p>
                    <p><span className="text-on-surface-variant font-medium">Buku Kendali:</span> #{String(doc.no_urut || doc.id).padStart(3, '0')}/{doc.tahun || new Date().getFullYear()}</p>
                    <p><span className="text-on-surface-variant font-medium">Jalur Pendaftaran:</span> {doc.sumber_data || (isAmdalnet ? 'AMDALNET' : 'MANUAL (LOKET MPP / DLH)')}</p>
                    {doc.nomor_registrasi_amdalnet && (
                      <div className="flex items-center gap-2">
                        <span className="text-on-surface-variant font-medium">No. Registrasi Amdalnet:</span>
                        {renderCopyableNumber(doc.nomor_registrasi_amdalnet, 'tbl-amdalnet-reg')}
                      </div>
                    )}
                    {doc.keterangan && (
                      <p className="text-xs text-on-surface-variant bg-white p-2 rounded-lg border border-outline-variant mt-1">
                        <span className="font-bold text-on-surface">Catatan Umum:</span> {doc.keterangan}
                      </p>
                    )}
                  </div>
                </td>
              </tr>

              {/* 4. TAHAP 1 - REGISTRASI & PENERIMAAN */}
              <tr className="bg-slate-100">
                <td colSpan={2} className="w-full bg-slate-100 py-2.5 px-6 font-black text-on-surface text-xs uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-primary shrink-0" />
                    <span>Tahap 1: Registrasi Dokumen Masuk</span>
                  </div>
                </td>
              </tr>
              {doc.nomor_surat_permohonan && (
                <tr className="hover:bg-white">
                  <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs align-top">Surat Permohonan</th>
                  <td className="py-3 px-6 font-bold text-on-surface text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-on-surface-variant font-medium">Nomor:</span>
                        {renderCopyableNumber(doc.nomor_surat_permohonan, 'tbl-permohonan')}
                      </div>
                      <p><span className="text-on-surface-variant font-medium">Tanggal Surat:</span> {formatDate(doc.tanggal_surat_permohonan)}</p>
                      <p><span className="text-on-surface-variant font-medium">Perihal:</span> {doc.perihal_surat_permohonan || '-'}</p>
                    </div>
                  </td>
                </tr>
              )}
              <tr className="hover:bg-white">
                <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs align-top">Checklist & Tanda Terima Masuk</th>
                <td className="py-3 px-6 font-bold text-on-surface text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-on-surface-variant font-medium">Nomor Checklist:</span>
                      {renderCopyableNumber(doc.nomor_checklist, 'tbl-reg-checklist')}
                    </div>
                    <p><span className="text-on-surface-variant font-medium">Tanggal Masuk:</span> {formatDate(doc.tanggal_masuk_dokumen)}</p>
                    {doc.status_verifikasi && (
                      <p><span className="text-on-surface-variant font-medium">Status Verifikasi:</span> <span className="text-emerald-700">{doc.status_verifikasi}</span></p>
                    )}
                    {petugasPenerimaNama && (
                      <p><span className="text-on-surface-variant font-medium">Petugas Penerima Loket:</span> {petugasPenerimaNama}</p>
                    )}
                    {renderFileLink(doc.file_checklist_url || doc.file_tanda_terima_url || doc.file_registrasi_url, 'Unduh Checklist / Tanda Terima')}
                  </div>
                </td>
              </tr>

              {/* 5. TAHAP 2 - UJI ADMINISTRASI (HUA) */}
              {(doc.nomor_uji_berkas || doc.tanggal_uji_berkas || showAllStages) && (
                <>
                  <tr className="bg-slate-100">
                    <td colSpan={2} className="w-full bg-slate-100 py-2.5 px-6 font-black text-on-surface text-xs uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-primary shrink-0" />
                        <span>Tahap 2: Uji Kelengkapan Administrasi (BA HUA)</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-white">
                    <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs align-top">BA Uji Administrasi</th>
                    <td className="py-3 px-6 font-bold text-on-surface text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-on-surface-variant font-medium">Nomor BA:</span>
                          {renderCopyableNumber(doc.nomor_uji_berkas, 'tbl-ujiadmin')}
                          {renderFileLink(doc.file_uji_admin_url, 'Unduh Berkas BA')}
                        </div>
                        <p><span className="text-on-surface-variant font-medium">Tanggal Uji:</span> {formatDate(doc.tanggal_uji_berkas)}</p>
                        {extra.hasil_verifikasi_uji && (
                          <p><span className="text-on-surface-variant font-medium">Hasil Verifikasi:</span> <strong className="text-primary">{extra.hasil_verifikasi_uji}</strong></p>
                        )}
                        {(() => {
                          const names = getOfficerNames(doc.penandatangan_uji_admin);
                          if (names.length === 0) return null;
                          return (
                            <div>
                              <span className="text-on-surface-variant font-medium">Tim Penilai / Pemeriksa:</span>
                              <ul className="list-disc list-inside ml-2 mt-0.5 text-xs text-on-surface font-semibold space-y-0.5">
                                {names.map((n, i) => <li key={i}>{n}</li>)}
                              </ul>
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                </>
              )}

              {/* 6. TAHAP 3 - VERIFIKASI LAPANGAN (VERLAP) */}
              {(doc.nomor_ba_verlap || doc.tanggal_verlap || showAllStages) && (
                <>
                  <tr className="bg-slate-100">
                    <td colSpan={2} className="w-full bg-slate-100 py-2.5 px-6 font-black text-on-surface text-xs uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-primary shrink-0" />
                        <span>Tahap 3: Verifikasi Lapangan (Verlap)</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-white">
                    <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs align-top">BA Verifikasi Lapangan</th>
                    <td className="py-3 px-6 font-bold text-on-surface text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-on-surface-variant font-medium">Nomor BA:</span>
                          {renderCopyableNumber(doc.nomor_ba_verlap, 'tbl-verlap')}
                          {renderFileLink(doc.file_verlap_url, 'Unduh Berkas Verlap')}
                        </div>
                        <p><span className="text-on-surface-variant font-medium">Tanggal Verlap:</span> {formatDate(doc.tanggal_verlap)}</p>
                        {(() => {
                          const names = getOfficerNames(doc.penandatangan_verlap);
                          if (names.length === 0) return null;
                          return (
                            <div>
                              <span className="text-on-surface-variant font-medium">Tim Verifikasi Lapangan:</span>
                              <ul className="list-disc list-inside ml-2 mt-0.5 text-xs text-on-surface font-semibold space-y-0.5">
                                {names.map((n, i) => <li key={i}>{n}</li>)}
                              </ul>
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                </>
              )}

              {/* 7. TAHAP 4 & 5 - PEMERIKSAAN SUBSTANSI & PENGEMBALIAN */}
              {(doc.nomor_ba_pemeriksaan || doc.tanggal_pemeriksaan || doc.tanggal_pengembalian || showAllStages) && (
                <>
                  <tr className="bg-slate-100">
                    <td colSpan={2} className="w-full bg-slate-100 py-2.5 px-6 font-black text-on-surface text-xs uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-primary shrink-0" />
                        <span>Tahap 4 & 5: Pemeriksaan Substansi & Penyerahan BA</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-white">
                    <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs align-top">BA Pemeriksaan Substansi</th>
                    <td className="py-3 px-6 font-bold text-on-surface text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-on-surface-variant font-medium">Nomor BA:</span>
                          {renderCopyableNumber(doc.nomor_ba_pemeriksaan, 'tbl-ba-pemeriksaan')}
                          {renderFileLink(doc.file_ba_substansi_url || doc.file_ba_word_url, 'Unduh Berkas Sidang')}
                        </div>
                        <p><span className="text-on-surface-variant font-medium">Tanggal Sidang:</span> {formatDate(doc.tanggal_pemeriksaan)}</p>
                        {(() => {
                          const names = getOfficerNames(doc.penandatangan_pemeriksaan);
                          if (names.length === 0) return null;
                          return (
                            <div>
                              <span className="text-on-surface-variant font-medium">Tim Penilai / Pemeriksa:</span>
                              <ul className="list-disc list-inside ml-2 mt-0.5 text-xs text-on-surface font-semibold space-y-0.5">
                                {names.map((n, i) => <li key={i}>{n}</li>)}
                              </ul>
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                  {doc.tanggal_pengembalian && (
                    <tr className="hover:bg-white bg-red-50/50">
                      <th className="py-3 px-6 font-bold text-red-700 w-1/3 uppercase text-xs align-top">Penyerahan BA & Pengembalian</th>
                      <td className="py-3 px-6 font-bold text-red-950 text-sm">
                        <div className="space-y-1">
                          <p><span className="text-red-700 font-medium">Tanggal Pengembalian:</span> {formatDate(doc.tanggal_pengembalian)}</p>
                          {doc.keterangan_pengembalian && (
                            <p><span className="text-red-700 font-medium">Catatan / Arahan Revisi:</span> {doc.keterangan_pengembalian}</p>
                          )}
                          {renderFileLink(doc.file_pengembalian_url, 'Unduh Lembar Pengembalian')}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}

              {/* 8. TAHAP 6 s/d 9 - RIWAYAT PERBAIKAN DOKUMEN (REVISI 1 - 5) */}
              {(doc.nomor_php || doc.nomor_php1 || doc.nomor_revisi_1 || doc.nomor_revisi || doc.tanggal_php_1 || doc.tanggal_revisi_1 || showAllStages) && (
                <>
                  <tr className="bg-primary-container text-on-primary-container">
                    <td colSpan={2} className="w-full py-2.5 px-6 font-black text-indigo-900 text-xs uppercase tracking-wider bg-indigo-100">
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-indigo-900 shrink-0" />
                        <span>Tahap 6–9: Riwayat Perbaikan Dokumen (Revisi)</span>
                      </div>
                    </td>
                  </tr>
                  {[1, 2, 3, 4, 5].map((rev) => {
                    const phpNum = rev === 1 ? doc.nomor_php : doc[`nomor_php${rev - 1}`];
                    const phpDate = doc[`tanggal_php_${rev}`];
                    const phpFile = rev === 1 ? doc.file_php_url : doc[`file_php${rev - 1}_url`];
                    
                    const baNum = doc[`nomor_revisi_${rev}`] || (rev === 1 ? doc.nomor_revisi : null);
                    const baDate = doc[`tanggal_revisi_${rev}`] || (rev === 1 ? doc.tanggal_revisi : null);
                    
                    if (!phpNum && !baNum && !phpDate && !baDate && !showAllStages) return null;
                    
                    return (
                      <tr key={rev} className="hover:bg-white bg-primary-container/20">
                        <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs align-top">
                          Revisi Putaran {rev}
                        </th>
                        <td className="py-3 px-6 font-bold text-on-surface text-sm">
                          <div className="space-y-2">
                            {/* Baris PHP */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-indigo-100">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-indigo-800 uppercase">Tanda Terima PHP{rev}:</span>
                                {renderCopyableNumber(phpNum, `tbl-php-${rev}`)}
                                {renderFileLink(phpFile, `Berkas PHP${rev}`)}
                              </div>
                              <span className="text-xs bg-surface px-2.5 py-0.5 rounded border border-outline-variant font-mono text-on-surface-variant shrink-0">
                                {formatDate(phpDate)}
                              </span>
                            </div>

                            {/* Baris BA Pemeriksaan Revisi */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-emerald-800 uppercase">BA Pemeriksaan (BA.P.P{rev}):</span>
                                {renderCopyableNumber(baNum, `tbl-ba-rev-${rev}`)}
                              </div>
                              <span className="text-xs bg-surface px-2.5 py-0.5 rounded border border-outline-variant font-mono text-on-surface-variant shrink-0">
                                {formatDate(baDate)}
                              </span>
                            </div>

                            {/* Tim Penandatangan Revisi */}
                            {(() => {
                              const revOfficers = getOfficerNames(doc.penandatangan_revisi);
                              if (revOfficers.length === 0) return null;
                              return (
                                <p className="text-xs text-on-surface-variant font-medium">
                                  Pemeriksa Revisi: <strong className="text-on-surface">{revOfficers.join(', ')}</strong>
                                </p>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </>
              )}

              {/* 9. TAHAP 10 - FINALISASI (RPD & SK) */}
              {(doc.nomor_risalah || doc.nomor_sk || doc.tanggal_risalah || doc.tanggal_penyerahan_sk || showAllStages) && (
                <>
                  <tr className="bg-amber-100 text-amber-900">
                    <td colSpan={2} className="w-full py-2.5 px-6 font-black text-amber-900 text-xs uppercase tracking-wider bg-amber-100">
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-amber-900 shrink-0" />
                        <span>Tahap 10: Finalisasi (Risalah RPD & SK)</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-white">
                    <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs align-top">Risalah Pembahasan (RPD)</th>
                    <td className="py-3 px-6 font-bold text-on-surface text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-on-surface-variant font-medium">Nomor Risalah:</span>
                          {renderCopyableNumber(doc.nomor_risalah, 'tbl-risalah')}
                        </div>
                        <p><span className="text-on-surface-variant font-medium">Tanggal Risalah:</span> {formatDate(doc.tanggal_risalah)}</p>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-white">
                    <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs align-top">SK / Rekomendasi / PKPLH</th>
                    <td className="py-3 px-6 font-bold text-on-surface text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-on-surface-variant font-medium">Nomor SK:</span>
                          {renderCopyableNumber(doc.nomor_sk, 'tbl-sk')}
                        </div>
                        <p><span className="text-on-surface-variant font-medium">Tanggal SK / Penyerahan:</span> {formatDate(doc.tanggal_penyerahan_sk || doc.tanggal_sk)}</p>
                      </div>
                    </td>
                  </tr>
                </>
              )}

              {/* 10. TAHAP 11 - PENERIMAAN JILIDAN */}
              {(doc.tanggal_penerimaan_jilidan || doc.pengirim_jilidan || showAllStages) && (
                <>
                  <tr className="bg-slate-100">
                    <td colSpan={2} className="w-full bg-slate-100 py-2.5 px-6 font-black text-on-surface text-xs uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-primary shrink-0" />
                        <span>Tahap 11: Penerimaan Dokumen Fisik Jilidan</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-white bg-tertiary-container/30">
                    <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs align-top">Tanda Terima Jilidan</th>
                    <td className="py-3 px-6 font-bold text-on-surface text-sm">
                      <div className="space-y-1">
                        <p><span className="text-on-surface-variant font-medium">Tanggal Diterima:</span> {formatDate(doc.tanggal_penerimaan_jilidan)}</p>
                        <p><span className="text-on-surface-variant font-medium">Pengirim Berkas:</span> {doc.pengirim_jilidan || doc.nama_pengirim || '-'}</p>
                        <p><span className="text-on-surface-variant font-medium">Petugas Penerima Jilidan MPP:</span> {petugasJilidanNama || '-'}</p>
                        {renderFileLink(doc.file_penerimaan_url, 'Unduh Tanda Terima Jilidan')}
                      </div>
                    </td>
                  </tr>
                </>
              )}

              {/* 11. TAHAP 12 - PENGARSIPAN */}
              {(doc.arsip_fisik || doc.file_arsip_url || showAllStages) && (
                <>
                  <tr className="bg-slate-100">
                    <td colSpan={2} className="w-full bg-slate-100 py-2.5 px-6 font-black text-on-surface text-xs uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-primary shrink-0" />
                        <span>Tahap 12: Pengarsipan Berkas</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-white">
                    <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs align-top">Arsip Fisik & Digital</th>
                    <td className="py-3 px-6 font-bold text-on-surface text-sm">
                      <div className="space-y-1">
                        <p><span className="text-on-surface-variant font-medium">Status Arsip:</span> <span className={doc.arsip_fisik ? "text-emerald-700 font-bold" : "text-amber-700"}>{doc.arsip_fisik ? 'Telah Diarsipkan Fisik' : 'Belum Diarsipkan'}</span></p>
                        <p><span className="text-on-surface-variant font-medium">Nomor Box / Rak Lemari:</span> <span className="font-mono bg-surface-container px-2 py-0.5 rounded border border-outline-variant">{doc.arsip_fisik || '-'}</span></p>
                        {renderFileLink(doc.file_arsip_url, 'Unduh Dokumen Arsip Digital')}
                      </div>
                    </td>
                  </tr>
                </>
              )}

            </tbody>
          </table>
        </div>
      </div>

      {/* Opsi Cetak */}
      <div className="space-y-6">
        <h4 className="text-lg font-bold text-on-surface uppercase border-b-4 border-outline-variant pb-2">Daftar Dokumen yang Tersedia</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {isAmdalnet ? (
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-200 border border-outline-variant flex items-center justify-center">
                    <FileText size={20} className="text-on-surface" />
                  </div>
                  <h5 className="font-bold text-on-surface uppercase">Lembar Registrasi Amdalnet</h5>
                </div>
                <p className="text-xs font-bold text-on-surface-variant mb-4">Bukti registrasi via sistem Amdalnet.</p>
                {renderNumberBadge(doc.nomor_checklist, 'reg-amdalnet')}
              </div>
              <button 
                onClick={() => handleDownload('Lembar_Registrasi_Amdalnet', 'registrasi')}
                disabled={downloading === 'Lembar_Registrasi_Amdalnet'}
                className="w-full px-4 py-3 bg-secondary text-on-secondary hover:bg-emerald-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {downloading === 'Lembar_Registrasi_Amdalnet' ? <LottieLoader size={24} /> : <Printer size={18} />}
                Cetak Dokumen
              </button>
            </div>
          ) : (
            <>
              {/* Tanda Terima Registrasi */}
              <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-200 border border-outline-variant flex items-center justify-center">
                      <FileText size={20} className="text-on-surface" />
                    </div>
                    <h5 className="font-bold text-on-surface uppercase">Tanda Terima Registrasi</h5>
                  </div>
                  <p className="text-xs font-bold text-on-surface-variant mb-4">Bukti penerimaan awal dokumen masuk (MPP / DLH).</p>
                  {renderNumberBadge(doc.nomor_checklist, 'reg-tt')}
                </div>
                <button 
                  onClick={() => handleDownload('template_tanda_terima_registrasi', 'registrasi')}
                  disabled={downloading === 'template_tanda_terima_registrasi'}
                  className="w-full px-4 py-3 bg-teal-400 hover:bg-teal-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {downloading === 'template_tanda_terima_registrasi' ? <LottieLoader size={24} /> : <Printer size={18} />}
                  Cetak Dokumen
                </button>
              </div>

              {/* Checklist Registrasi */}
              <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-200 border border-outline-variant flex items-center justify-center">
                      <CheckCircle size={20} className="text-on-surface" />
                    </div>
                    <h5 className="font-bold text-on-surface uppercase">Checklist Kelengkapan</h5>
                  </div>
                  <p className="text-xs font-bold text-on-surface-variant mb-4">Daftar periksa kelengkapan berkas administrasi.</p>
                  {renderNumberBadge(doc.nomor_checklist, 'reg-chk')}
                </div>
                <button 
                  onClick={() => handleDownload('template_checklist', 'registrasi')}
                  disabled={downloading === 'template_checklist'}
                  className="w-full px-4 py-3 bg-blue-400 hover:bg-blue-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {downloading === 'template_checklist' ? <LottieLoader size={24} /> : <Printer size={18} />}
                  Cetak Dokumen
                </button>
              </div>
            </>
          )}

          {/* BA Uji Administrasi (Conditional) */}
          {(doc.nomor_uji_berkas || doc.status_tahapan === 'Uji Administrasi Selesai' || doc.status_tahapan === 'Verlap Selesai' || doc.status_tahapan === 'Pemeriksaan Selesai') && (
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-200 border border-outline-variant flex items-center justify-center">
                    <FileText size={20} className="text-on-surface" />
                  </div>
                  <h5 className="font-bold text-on-surface uppercase">BA Uji Administrasi</h5>
                </div>
                <p className="text-xs font-bold text-on-surface-variant mb-4">Berita Acara Hasil Uji Kelengkapan Administrasi (BA HUA).</p>
                {renderNumberBadge(doc.nomor_uji_berkas, 'uji-admin')}
              </div>
              <button 
                onClick={() => handleDownload('template_ba_uji_admin', 'uji-administrasi')}
                disabled={downloading === 'template_ba_uji_admin'}
                className="w-full px-4 py-3 bg-indigo-400 hover:bg-indigo-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {downloading === 'template_ba_uji_admin' ? <LottieLoader size={24} /> : <Printer size={18} />}
                Cetak Dokumen
              </button>
            </div>
          )}

          {/* BA Verlap (Conditional) */}
          {(doc.nomor_ba_verlap || doc.status_tahapan === 'Verlap Selesai' || doc.status_tahapan === 'Pemeriksaan Selesai') && (
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-200 border border-outline-variant flex items-center justify-center">
                    <FileText size={20} className="text-on-surface" />
                  </div>
                  <h5 className="font-bold text-on-surface uppercase">BA Verifikasi Lapangan</h5>
                </div>
                <p className="text-xs font-bold text-on-surface-variant mb-4">Berita Acara Hasil Verifikasi Lapangan (Verlap).</p>
                {renderNumberBadge(doc.nomor_ba_verlap, 'ba-verlap')}
              </div>
              <button 
                onClick={() => handleDownload('template_ba_verlap', 'verifikasi-lapangan')}
                disabled={downloading === 'template_ba_verlap'}
                className="w-full px-4 py-3 bg-tertiary text-on-tertiary hover:bg-amber-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {downloading === 'template_ba_verlap' ? <LottieLoader size={24} /> : <Printer size={18} />}
                Cetak Dokumen
              </button>
            </div>
          )}

          {/* BA Pemeriksaan / Rapat (Conditional) */}
          {(doc.nomor_ba_pemeriksaan || doc.status_tahapan === 'Pemeriksaan Selesai' || doc.status_tahapan === 'Menunggu Finalisasi' || doc.status_tahapan === 'Selesai' || doc.status_tahapan === 'Revisi' || doc.status_tahapan === 'Revisi Lanjutan') && (
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-200 border border-outline-variant flex items-center justify-center">
                    <FileText size={20} className="text-on-surface" />
                  </div>
                  <h5 className="font-bold text-on-surface uppercase">BA Pemeriksaan</h5>
                </div>
                <p className="text-xs font-bold text-on-surface-variant mb-4">Berita Acara Hasil Rapat Pemeriksaan Substansi.</p>
                {renderNumberBadge(doc.nomor_ba_pemeriksaan, 'ba-sidang')}
              </div>
              <button 
                onClick={() => handleDownload('template_ba_substansi', 'pemeriksaan-substansi')}
                disabled={downloading === 'template_ba_substansi'}
                className="w-full px-4 py-3 bg-secondary text-on-secondary hover:bg-emerald-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {downloading === 'template_ba_substansi' ? <LottieLoader size={24} /> : <Printer size={18} />}
                Cetak Dokumen
              </button>
            </div>
          )}

          {/* Tanda Terima Penerimaan Perbaikan / PHP (Conditional - Multiple Versions) */}
          {(doc.nomor_php || doc.nomor_php1 || doc.tanggal_php_1 || doc.status_tahapan === 'Penerimaan Perbaikan') && (
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-fuchsia-200 border border-outline-variant flex items-center justify-center">
                    <FileText size={20} className="text-on-surface" />
                  </div>
                  <h5 className="font-bold text-on-surface uppercase">Penerimaan Hasil Perbaikan (PHP)</h5>
                </div>
                <p className="text-xs font-bold text-on-surface-variant mb-4">Tanda terima dokumen perbaikan/revisi dari pemrakarsa.</p>
                {(() => {
                  const maxRev = parseInt(doc.revisi_ke || '1');
                  const latestPhp = maxRev === 1 ? doc.nomor_php : (doc[`nomor_php${maxRev - 1}`] || doc.nomor_php);
                  return renderNumberBadge(latestPhp, 'php-latest');
                })()}
              </div>
              <div className="flex flex-col">
                {(() => {
                  const maxRev = parseInt(doc.revisi_ke || '1');
                  const revs = Array.from({ length: maxRev }).map((_, i) => i + 1);
                  const latest = revs[revs.length - 1];
                  const prevs = revs.slice(0, -1);
                  return (
                    <>
                      <button 
                        onClick={() => handleDownload('template_tanda_terima_perbaikan', 'penerimaan-perbaikan', latest)}
                        disabled={downloading === `template_tanda_terima_perbaikan_${latest}`}
                        className="w-full px-4 py-3 bg-fuchsia-400 hover:bg-fuchsia-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
                      >
                        {downloading === `template_tanda_terima_perbaikan_${latest}` ? <LottieLoader size={24} /> : <Printer size={18} />}
                        Cetak PHP{latest}
                      </button>

                      {prevs.length > 0 && (
                        <div className="mt-4 pt-4 border-t-2 border-outline-variant">
                          <p className="text-xs font-bold text-on-surface-variant mb-2 uppercase">Versi Sebelumnya:</p>
                          <div className="flex flex-wrap gap-2">
                            {prevs.map(rev => (
                              <button
                                key={`ttp-prev-${rev}`}
                                onClick={() => handleDownload('template_tanda_terima_perbaikan', 'penerimaan-perbaikan', rev)}
                                disabled={downloading === `template_tanda_terima_perbaikan_${rev}`}
                                className="px-3 py-1.5 bg-surface hover:bg-surface-container-low text-on-surface-variant border border-outline-variant font-bold rounded-lg text-xs shadow-sm hover:shadow-md transition-shadow hover:-translate-y-0.5 transition-all flex items-center gap-1 uppercase disabled:opacity-70"
                              >
                                {downloading === `template_tanda_terima_perbaikan_${rev}` ? <LottieLoader size={24} /> : <Printer size={14} />}
                                PHP{rev}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* BA Pemeriksaan Revisi (Conditional - Multiple Versions) */}
          {(doc.nomor_revisi_1 || doc.nomor_revisi || doc.tanggal_revisi_1 || doc.status_tahapan === 'Pemeriksaan Revisi' || doc.status_tahapan === 'Revisi Lanjutan') && (
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-200 border border-outline-variant flex items-center justify-center">
                    <FileText size={20} className="text-on-surface" />
                  </div>
                  <h5 className="font-bold text-on-surface uppercase">BA Pemeriksaan Revisi</h5>
                </div>
                <p className="text-xs font-bold text-on-surface-variant mb-4">Berita Acara Hasil Pemeriksaan Revisi (BA.P.P).</p>
                {(() => {
                  const maxRev = parseInt(doc.revisi_ke || '1');
                  const latestBaRev = doc[`nomor_revisi_${maxRev}`] || doc.nomor_revisi_1 || doc.nomor_revisi;
                  return renderNumberBadge(latestBaRev, 'ba-rev-latest');
                })()}
              </div>
              <div className="flex flex-col">
                {(() => {
                  const maxRev = parseInt(doc.revisi_ke || '1');
                  const revs = Array.from({ length: maxRev }).map((_, i) => i + 1);
                  const latest = revs[revs.length - 1];
                  const prevs = revs.slice(0, -1);
                  return (
                    <>
                      <button 
                        onClick={() => handleDownload('template_ba_pemeriksaan_revisi', 'pemeriksaan-revisi', latest)}
                        disabled={downloading === `template_ba_pemeriksaan_revisi_${latest}`}
                        className="w-full px-4 py-3 bg-pink-400 hover:bg-pink-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
                      >
                        {downloading === `template_ba_pemeriksaan_revisi_${latest}` ? <LottieLoader size={24} /> : <Printer size={18} />}
                        Cetak BA.P.P{latest}
                      </button>

                      {prevs.length > 0 && (
                        <div className="mt-4 pt-4 border-t-2 border-outline-variant">
                          <p className="text-xs font-bold text-on-surface-variant mb-2 uppercase">Versi Sebelumnya:</p>
                          <div className="flex flex-wrap gap-2">
                            {prevs.map(rev => (
                              <button
                                key={`php-prev-${rev}`}
                                onClick={() => handleDownload('template_ba_pemeriksaan_revisi', 'pemeriksaan-revisi', rev)}
                                disabled={downloading === `template_ba_pemeriksaan_revisi_${rev}`}
                                className="px-3 py-1.5 bg-surface hover:bg-surface-container-low text-on-surface-variant border border-outline-variant font-bold rounded-lg text-xs shadow-sm hover:shadow-md transition-shadow hover:-translate-y-0.5 transition-all flex items-center gap-1 uppercase disabled:opacity-70"
                              >
                                {downloading === `template_ba_pemeriksaan_revisi_${rev}` ? <LottieLoader size={24} /> : <Printer size={14} />}
                                BA.P.P{rev}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Tanda Terima Penerimaan Final / Jilidan (Conditional) */}
          {(doc.tanggal_penerimaan_jilidan || doc.status_tahapan === 'Penerimaan Jilidan') && (
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-200 border border-outline-variant flex items-center justify-center">
                    <FileText size={20} className="text-on-surface" />
                  </div>
                  <h5 className="font-bold text-on-surface uppercase">Tanda Terima Final</h5>
                </div>
                <p className="text-xs font-bold text-on-surface-variant mb-6">Bukti penerimaan dokumen fisik jilidan akhir.</p>
              </div>
              <button 
                onClick={() => handleDownload('template_tanda_terima_jilidan', 'jilidan')}
                disabled={downloading === 'template_tanda_terima_jilidan'}
                className="w-full px-4 py-3 bg-orange-400 hover:bg-orange-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {downloading === 'template_tanda_terima_jilidan' ? <LottieLoader size={24} /> : <Printer size={18} />}
                Cetak Dokumen
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
