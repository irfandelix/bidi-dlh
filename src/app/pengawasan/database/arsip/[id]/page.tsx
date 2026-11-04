'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Archive, FileText, CheckCircle2, XCircle, AlertCircle, 
  ExternalLink, Copy, Check, ChevronDown, ChevronUp, MapPin, 
  Building2, Calendar, FileEdit, FolderCheck, HardDrive, Layers,
  Compass, Eye
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import LottieLoader from '@/components/LottieLoader';

interface DocumentItem {
  id: string;
  title: string;
  category: string;
  nomor?: string;
  keterangan?: string;
  url?: string | null;
  statusFisik?: boolean;
  tanggal?: string;
  icon?: any;
}

export default function ArsipIzinDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Accordion state (category key => boolean is open)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    dokumen_utama: true,
    berita_acara: true,
    administrasi: true,
    perbaikan: false,
    lokasi_fisik: true,
  });

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('dokumens')
          .select('*')
          .eq('id', unwrappedParams.id)
          .single();

        if (error) {
          console.error('Error fetching doc:', error);
        } else {
          setDoc(data);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [unwrappedParams.id]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(prev => (prev === key ? null : prev));
    }, 2000);
  };

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAllSections = (open: boolean) => {
    setOpenSections({
      dokumen_utama: open,
      berita_acara: open,
      administrasi: open,
      perbaikan: open,
      lokasi_fisik: open,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <LottieLoader size={160} text="MEMUAT BERKAS ARSIP IZIN..." />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center">
        <div className="bg-surface border border-outline-variant p-8 rounded-3xl max-w-lg text-center shadow-sm">
          <Archive size={48} className="mx-auto text-error mb-4" />
          <h2 className="text-2xl font-bold uppercase text-on-surface mb-2">Data Tidak Ditemukan</h2>
          <p className="text-sm text-on-surface-variant font-bold mb-6">
            Dokumen arsip perizinan dengan ID #{unwrappedParams.id} tidak ditemukan di database.
          </p>
          <Link
            href="/pengawasan/database"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-primary text-on-primary font-bold rounded-xl text-sm uppercase tracking-wider transition-all"
          >
            <ArrowLeft size={18} /> Kembali ke Database
          </Link>
        </div>
      </div>
    );
  }

  // Parse arsip_fisik JSON safely
  let fisik: any = {};
  try {
    if (doc.arsip_fisik) {
      fisik = typeof doc.arsip_fisik === 'string' ? JSON.parse(doc.arsip_fisik) : doc.arsip_fisik;
      if (typeof fisik === 'string') {
        fisik = JSON.parse(fisik);
      }
    }
  } catch (e) {
    console.error('Error parsing arsip_fisik:', e);
  }

  // Check AMDALNET extra metadata
  let isAmdalnet = false;
  let amdalnetUrl = '';
  try {
    const extra = typeof doc.penandatangan_hua === 'string' ? JSON.parse(doc.penandatangan_hua) : doc.penandatangan_hua;
    if (extra && extra.is_amdalnet) {
      isAmdalnet = true;
      amdalnetUrl = extra.file_amdalnet_url || '';
    }
  } catch (e) {}

  // 1. Dokumen Utama & Izin Lingkungan
  const itemsDokumenUtama: DocumentItem[] = [
    {
      id: 'dokumenCetak',
      title: 'Dokumen Lingkungan Final (Softcopy / Cetak)',
      category: 'dokumen_utama',
      nomor: fisik.noDokumenCetak || undefined,
      keterangan: fisik.noDokumenCetak ? `Posisi / Letak Rak: ${fisik.noDokumenCetak}` : undefined,
      url: fisik.urlDokumenCetak || null,
      statusFisik: fisik.dokumenCetak,
    },
    {
      id: 'pkplhArsip',
      title: 'Surat Keputusan / PKPLH Arsip',
      category: 'dokumen_utama',
      nomor: fisik.noPkplhArsip || doc.nomor_sk || undefined,
      keterangan: fisik.noPkplhArsip ? `Keterangan: ${fisik.noPkplhArsip}` : undefined,
      url: fisik.urlPkplh || null,
      statusFisik: fisik.pkplhArsip,
    },
    {
      id: 'rpdArsip',
      title: doc.jenis_dokumen === 'SPPL' ? 'Surat Pengesahan SPPL' : 'Penyusunan Risalah RPD',
      category: 'dokumen_utama',
      nomor: doc.jenis_dokumen === 'SPPL' ? (fisik.noRpdArsip || undefined) : (doc.nomor_risalah || undefined),
      url: fisik.urlRpd || null,
      statusFisik: fisik.rpdArsip,
    },
  ];

  // 2. Berita Acara (BA)
  const itemsBeritaAcara: DocumentItem[] = [
    {
      id: 'baUjiAdmin',
      title: 'Berita Acara (BA) Uji Administrasi / HUA',
      category: 'berita_acara',
      nomor: isAmdalnet ? 'Diproses via AMDALNET' : (doc.nomor_uji_berkas || undefined),
      url: fisik.urlUjiAdmin || (isAmdalnet && amdalnetUrl ? amdalnetUrl : null),
      tanggal: doc.tanggal_uji_berkas || undefined,
    },
    {
      id: 'baVerlap',
      title: 'Berita Acara (BA) Verifikasi Lapangan (Verlap)',
      category: 'berita_acara',
      nomor: doc.nomor_ba_verlap || undefined,
      url: fisik.urlBaVerlap || null,
      tanggal: doc.tanggal_verlap || undefined,
    },
    {
      id: 'baSidang',
      title: 'Berita Acara (BA) Pemeriksaan Substantif / Sidang Komisi',
      category: 'berita_acara',
      nomor: doc.nomor_ba_pemeriksaan || undefined,
      url: fisik.urlBaSidang || null,
      tanggal: doc.tanggal_sidang || undefined,
    },
  ];

  // Tambahkan Berita Acara Revisi (Utama & 1-5)
  if (doc.nomor_revisi || fisik.urlRevisi) {
    itemsBeritaAcara.push({
      id: 'baRevisiUtama',
      title: 'Berita Acara (BA) Pemeriksaan Revisi',
      category: 'berita_acara',
      nomor: doc.nomor_revisi || undefined,
      url: fisik.urlRevisi || null,
    });
  }
  for (let i = 1; i <= 5; i++) {
    if (doc[`nomor_revisi_${i}`] || fisik[`urlRevisi${i}`]) {
      itemsBeritaAcara.push({
        id: `baRevisi${i}`,
        title: `Berita Acara (BA) Pemeriksaan Revisi ${i}`,
        category: 'berita_acara',
        nomor: doc[`nomor_revisi_${i}`] || undefined,
        url: fisik[`urlRevisi${i}`] || null,
      });
    }
  }

  // 3. Surat & Administrasi
  const itemsAdministrasi: DocumentItem[] = [
    {
      id: 'suratPermohonan',
      title: 'Surat Permohonan Pemrakarsa (Awal)',
      category: 'administrasi',
      nomor: fisik.noSuratPermohonan || undefined,
      keterangan: fisik.noSuratPermohonan ? `Letak berkas: ${fisik.noSuratPermohonan}` : undefined,
      url: fisik.urlSuratPermohonan || null,
      statusFisik: fisik.suratPermohonan,
    },
    {
      id: 'lembarRegistrasi',
      title: 'Lembar Registrasi & Tanda Terima',
      category: 'administrasi',
      nomor: doc.nomor_checklist || undefined,
      url: fisik.urlRegistrasi || null,
      tanggal: doc.tanggal_masuk_dokumen || undefined,
    },
    {
      id: 'undanganSidang',
      title: 'Surat Undangan Sidang / Rapat Tim Teknis',
      category: 'administrasi',
      nomor: fisik.noUndanganSidang || undefined,
      url: fisik.urlUndanganSidang || null,
      statusFisik: fisik.undanganSidang,
    },
  ];

  if (doc.tanggal_pengembalian || fisik.urlPengembalian) {
    itemsAdministrasi.push({
      id: 'lembarPengembalian',
      title: 'Lembar Pengembalian Berkas',
      category: 'administrasi',
      nomor: doc.tanggal_pengembalian ? `Tanggal: ${doc.tanggal_pengembalian}` : undefined,
      url: fisik.urlPengembalian || null,
    });
  }

  // 4. Perbaikan Hasil Pemeriksaan (PHP)
  const itemsPerbaikan: DocumentItem[] = [];
  if (doc.nomor_php || fisik.urlPhp) {
    itemsPerbaikan.push({
      id: 'phpUtama',
      title: 'Penerimaan Perbaikan / PHP Utama',
      category: 'perbaikan',
      nomor: doc.nomor_php || undefined,
      url: fisik.urlPhp || null,
    });
  }
  for (let i = 1; i <= 5; i++) {
    if (doc[`nomor_php${i}`] || fisik[`urlPhp${i}`]) {
      itemsPerbaikan.push({
        id: `php${i}`,
        title: `Penerimaan Perbaikan / PHP ${i}`,
        category: 'perbaikan',
        nomor: doc[`nomor_php${i}`] || undefined,
        url: fisik[`urlPhp${i}`] || null,
      });
    }
  }

  // Kumpulan semua dokumen untuk kalkulasi total
  const allItems = [
    ...itemsDokumenUtama,
    ...itemsBeritaAcara,
    ...itemsAdministrasi,
    ...itemsPerbaikan,
  ];

  const totalUploaded = allItems.filter(item => Boolean(item.url)).length;
  const totalCount = allItems.length;
  const percentageUploaded = Math.round((totalUploaded / Math.max(1, totalCount)) * 100);

  const sections = [
    {
      key: 'dokumen_utama',
      title: 'Dokumen Lingkungan Final & Izin',
      subtitle: 'Softcopy dokumen lingkungan, SK PKPLH, dan SPPL/RPD',
      icon: <FolderCheck size={22} className="text-emerald-600" />,
      items: itemsDokumenUtama,
      color: 'emerald',
    },
    {
      key: 'berita_acara',
      title: 'Berita Acara (BA) & Uji Kelayakan',
      subtitle: 'BA Uji Administrasi, BA Verlap, BA Sidang Komisi, dan BA Revisi',
      icon: <FileText size={22} className="text-indigo-600" />,
      items: itemsBeritaAcara,
      color: 'indigo',
    },
    {
      key: 'administrasi',
      title: 'Surat Menyurat & Registrasi',
      subtitle: 'Surat permohonan awal, lembar registrasi, dan undangan rapat',
      icon: <Layers size={22} className="text-amber-600" />,
      items: itemsAdministrasi,
      color: 'amber',
    },
    ...(itemsPerbaikan.length > 0 ? [{
      key: 'perbaikan',
      title: 'Penerimaan Perbaikan / PHP',
      subtitle: 'Tanda terima perbaikan hasil pemeriksaan dokumen',
      icon: <Layers size={22} className="text-rose-600" />,
      items: itemsPerbaikan,
      color: 'rose',
    }] : []),
  ];

  const hasCoordinates = Boolean(doc.latitude && doc.longitude);

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6 font-sans pb-24">
        
        {/* NAVIGASI & HEADER */}
        <div className="bg-surface border border-outline-variant rounded-[2rem] p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <Link 
                href="/pengawasan/database" 
                className="w-14 h-14 shrink-0 bg-indigo-500 hover:bg-primary text-on-primary rounded-2xl border border-outline-variant flex items-center justify-center shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
                title="Kembali ke Database Sasaran"
              >
                <ArrowLeft size={28} />
              </Link>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest bg-rose-200 text-on-surface px-3 py-1 rounded-lg border border-outline-variant shadow-sm">
                    🗃️ ARSIP IZIN LINGKUNGAN
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider bg-surface-container-low text-on-surface-variant px-3 py-1 rounded-lg border border-outline-variant">
                    #{String(doc.no_urut || doc.id).padStart(3, '0')} • TAHUN {doc.tahun || '—'}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-900 px-3 py-1 rounded-lg border border-outline-variant">
                    {doc.jenis_dokumen || 'DOKUMEN'}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-on-surface uppercase">
                  {doc.nama_kegiatan || 'Tanpa Nama Kegiatan'}
                </h1>
                <p className="text-sm md:text-base font-bold text-on-surface-variant mt-1 uppercase flex items-center gap-2 flex-wrap">
                  <Building2 size={16} className="shrink-0" />
                  <span>{doc.nama_pemrakarsa || '—'}</span>
                  {doc.kategori && (
                    <span className="text-xs bg-amber-200 text-on-surface px-2 py-0.5 rounded border border-outline-variant font-bold">
                      {doc.kategori}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS (EDIT FORM / GOOGLE MAPS) */}
            <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
              {hasCoordinates && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${doc.latitude},${doc.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-teal-100 hover:bg-teal-200 text-on-surface border border-outline-variant rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                >
                  <MapPin size={16} /> Buka Peta
                </a>
              )}
              <Link
                href={`/perizinan/arsip/${doc.id}`}
                className="px-4 py-2.5 bg-amber-300 hover:bg-amber-400 text-on-surface border border-outline-variant rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                title="Unggah berkas baru atau edit data arsip fisik"
              >
                <FileEdit size={16} /> Kelola / Upload Arsip
              </Link>
            </div>
          </div>

          {/* STATS & METADATA BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t-2 border-outline-variant">
            <div className="p-4 bg-surface-container-low border border-outline-variant rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Status Arsip</span>
              <span className="text-sm font-bold text-on-surface uppercase mt-1 inline-flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${doc.status_tahapan === 'Diarsipkan' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                {doc.status_tahapan || 'Dalam Proses'}
              </span>
            </div>

            <div className="p-4 bg-surface-container-low border border-outline-variant rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Kelengkapan Digital</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-on-surface uppercase">
                  {totalUploaded} dari {totalCount} Berkas
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 border border-outline-variant">
                  {percentageUploaded}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-2 border border-outline-variant overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${percentageUploaded}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-surface-container-low border border-outline-variant rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Lokasi Fisik / Rak</span>
              <span className="text-sm font-bold text-on-surface uppercase mt-1 block truncate">
                {fisik.lokasiArsip ? `📂 ${fisik.lokasiArsip}` : 'Belum Ditentukan'}
              </span>
            </div>

            <div className="p-4 bg-surface-container-low border border-outline-variant rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">No. Registrasi / Agenda</span>
              <span className="text-sm font-bold text-on-surface uppercase mt-1 block truncate">
                {doc.nomor_checklist || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* CONTROLS (EXPAND/COLLAPSE ALL) */}
        <div className="flex justify-between items-center px-2 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Archive size={20} className="text-on-surface" />
            <h2 className="text-lg font-bold text-on-surface uppercase tracking-wider">
              Daftar Dokumen & Berkas Digital
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleAllSections(true)}
              className="px-3 py-1.5 bg-surface hover:bg-surface-container border border-outline-variant rounded-xl text-xs font-bold uppercase tracking-wider text-on-surface shadow-sm transition-all"
            >
              Buka Semua
            </button>
            <button
              onClick={() => toggleAllSections(false)}
              className="px-3 py-1.5 bg-surface hover:bg-surface-container border border-outline-variant rounded-xl text-xs font-bold uppercase tracking-wider text-on-surface shadow-sm transition-all"
            >
              Tutup Semua
            </button>
          </div>
        </div>

        {/* ACCORDION SECTIONS */}
        <div className="space-y-4">
          {sections.map((section) => {
            const isOpen = Boolean(openSections[section.key]);
            const uploadedInSection = section.items.filter(item => Boolean(item.url)).length;
            const totalInSection = section.items.length;

            return (
              <div 
                key={section.key}
                className="bg-surface rounded-3xl border border-outline-variant overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* ACCORDION HEADER */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className="w-full p-5 md:p-6 flex items-center justify-between text-left transition-colors bg-surface hover:bg-surface-container-low border-b-2 border-outline-variant select-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-low border border-outline-variant flex items-center justify-center shadow-sm shrink-0">
                      {section.icon}
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-on-surface uppercase tracking-tight">
                        {section.title}
                      </h3>
                      <p className="text-xs md:text-sm font-bold text-on-surface-variant uppercase mt-0.5">
                        {section.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-xl border border-outline-variant uppercase tracking-wider ${
                      uploadedInSection === totalInSection && totalInSection > 0
                        ? 'bg-emerald-200 text-emerald-950'
                        : uploadedInSection > 0
                        ? 'bg-amber-200 text-amber-950'
                        : 'bg-slate-200 text-slate-800'
                    }`}>
                      {uploadedInSection} / {totalInSection} Berkas
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-surface border border-outline-variant flex items-center justify-center text-on-surface shadow-sm">
                      {isOpen ? <ChevronUp size={18} strokeWidth={2.5} /> : <ChevronDown size={18} strokeWidth={2.5} />}
                    </div>
                  </div>
                </button>

                {/* ACCORDION CONTENT */}
                {isOpen && (
                  <div className="p-5 md:p-6 bg-surface-container-lowest/50 divide-y divide-outline-variant">
                    {section.items.length === 0 ? (
                      <div className="py-6 text-center text-xs font-bold text-on-surface-variant uppercase">
                        Tidak ada berkas di bagian ini.
                      </div>
                    ) : (
                      section.items.map((item, idx) => {
                        const hasFile = Boolean(item.url);
                        const isDriveUrl = item.url && (item.url.includes('drive.google.com') || item.url.includes('drive.usercontent'));

                        return (
                          <div 
                            key={item.id} 
                            className={`py-5 first:pt-0 last:pb-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                              hasFile ? 'hover:bg-surface-container-low/60' : 'opacity-85'
                            } rounded-2xl px-3`}
                          >
                            <div className="flex items-start gap-4 flex-1">
                              {/* STATUS ICON */}
                              <div className="mt-1 shrink-0">
                                {hasFile ? (
                                  <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-outline-variant flex items-center justify-center text-emerald-700 shadow-sm">
                                    <CheckCircle2 size={20} strokeWidth={2.5} />
                                  </div>
                                ) : item.nomor ? (
                                  <div className="w-9 h-9 rounded-xl bg-amber-100 border border-outline-variant flex items-center justify-center text-amber-700 shadow-sm" title="Nomor terbit, softcopy belum diunggah">
                                    <AlertCircle size={20} strokeWidth={2.5} />
                                  </div>
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-slate-100 border border-outline-variant flex items-center justify-center text-slate-400 shadow-sm">
                                    <XCircle size={20} strokeWidth={2.5} />
                                  </div>
                                )}
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-bold text-on-surface uppercase tracking-wide">
                                    {item.title}
                                  </span>
                                  {hasFile ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-950 border border-outline-variant">
                                      <CheckCircle2 size={12} /> SUDAH DIUNGGAH
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 border border-outline-variant">
                                      BELUM DIUNGGAH
                                    </span>
                                  )}
                                  {isDriveUrl && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 border border-outline-variant">
                                      <HardDrive size={12} /> GOOGLE DRIVE
                                    </span>
                                  )}
                                </div>

                                {/* NOMOR DOKUMEN / KETERANGAN */}
                                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-bold text-on-surface-variant">
                                  {item.nomor && (
                                    <span className="bg-surface px-2.5 py-1 rounded-lg border border-outline-variant text-on-surface uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                      <span>Nomor: <strong>{item.nomor}</strong></span>
                                      <button 
                                        onClick={() => handleCopy(item.nomor!, item.id)}
                                        className="text-on-surface-variant hover:text-on-surface transition-colors"
                                        title="Salin nomor dokumen"
                                      >
                                        {copiedKey === item.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                      </button>
                                    </span>
                                  )}

                                  {item.tanggal && (
                                    <span className="bg-surface px-2.5 py-1 rounded-lg border border-outline-variant text-on-surface uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                      <Calendar size={12} /> {item.tanggal}
                                    </span>
                                  )}

                                  {item.keterangan && (
                                    <span className="text-on-surface-variant uppercase text-xs">
                                      • {item.keterangan}
                                    </span>
                                  )}

                                  {item.statusFisik !== undefined && (
                                    <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded border border-outline-variant ${
                                      item.statusFisik ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                      Fisik: {item.statusFisik ? 'Tersedia' : 'Belum Ada'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* ACTION BUTTONS (VIEW / DOWNLOAD / COPY LINK) */}
                            <div className="flex items-center gap-2 self-start lg:self-center shrink-0 pt-2 lg:pt-0">
                              {hasFile ? (
                                <>
                                  <a
                                    href={item.url!}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-primary text-on-primary border border-outline-variant rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                                  >
                                    <ExternalLink size={14} strokeWidth={2.5} />
                                    <span>Buka Dokumen</span>
                                  </a>
                                  <button
                                    onClick={() => handleCopy(item.url!, `url-${item.id}`)}
                                    className="p-2 bg-surface hover:bg-surface-container border border-outline-variant rounded-xl text-on-surface shadow-sm transition-all"
                                    title="Salin tautan file"
                                  >
                                    {copiedKey === `url-${item.id}` ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                                  </button>
                                </>
                              ) : (
                                <div className="text-xs font-bold uppercase text-on-surface-variant bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant">
                                  Softcopy belum diupload
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* SECTION: LOKASI PENYIMPANAN ARSIP & KOORDINAT */}
          <div className="bg-surface rounded-3xl border border-outline-variant overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <button
              type="button"
              onClick={() => toggleSection('lokasi_fisik')}
              className="w-full p-5 md:p-6 flex items-center justify-between text-left transition-colors bg-surface hover:bg-surface-container-low border-b-2 border-outline-variant select-none"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 border border-outline-variant flex items-center justify-center shadow-sm shrink-0">
                  <Compass size={22} className="text-teal-700" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-on-surface uppercase tracking-tight">
                    Lokasi Fisik & Titik Geografis
                  </h3>
                  <p className="text-xs md:text-sm font-bold text-on-surface-variant uppercase mt-0.5">
                    Informasi penempatan rak lemari arsip dan koordinat lokasi kegiatan
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-xl bg-surface border border-outline-variant flex items-center justify-center text-on-surface shadow-sm">
                {openSections.lokasi_fisik ? <ChevronUp size={18} strokeWidth={2.5} /> : <ChevronDown size={18} strokeWidth={2.5} />}
              </div>
            </button>

            {openSections.lokasi_fisik && (
              <div className="p-6 bg-surface-container-lowest/50 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* LOKASI RAK FISIK */}
                <div className="p-5 bg-surface border border-outline-variant rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <HardDrive size={20} className="text-indigo-600" />
                    <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                      Lokasi Penyimpanan Fisik (Lemari / Rak)
                    </h4>
                  </div>
                  <p className="text-xs font-bold text-on-surface-variant mb-4 uppercase">
                    Letak fisik berkas hardcopy disimpan di ruang arsip perizinan.
                  </p>
                  <div className="p-4 bg-surface-container-low border border-outline-variant rounded-xl">
                    <span className="text-base font-black text-on-surface uppercase">
                      {fisik.lokasiArsip ? `📂 ${fisik.lokasiArsip}` : 'Belum Ada Keterangan Lokasi Rak'}
                    </span>
                  </div>
                </div>

                {/* TITIK KOORDINAT */}
                <div className="p-5 bg-surface border border-outline-variant rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin size={20} className="text-teal-600" />
                    <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                      Titik Koordinat Lokasi Kegiatan
                    </h4>
                  </div>
                  <p className="text-xs font-bold text-on-surface-variant mb-4 uppercase">
                    Untuk pemetaan dan referensi tim verifikasi lapangan / pengawasan.
                  </p>
                  
                  {hasCoordinates ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-surface-container-low border border-outline-variant rounded-xl">
                          <span className="text-[10px] font-bold uppercase text-on-surface-variant block">Latitude</span>
                          <span className="text-sm font-bold text-on-surface">{doc.latitude}</span>
                        </div>
                        <div className="p-3 bg-surface-container-low border border-outline-variant rounded-xl">
                          <span className="text-[10px] font-bold uppercase text-on-surface-variant block">Longitude</span>
                          <span className="text-sm font-bold text-on-surface">{doc.longitude}</span>
                        </div>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${doc.latitude},${doc.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-200 hover:bg-teal-300 text-on-surface border border-outline-variant rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
                      >
                        <ExternalLink size={14} /> Buka di Google Maps
                      </a>
                    </div>
                  ) : (
                    <div className="p-4 bg-surface-container-low border border-outline-variant rounded-xl text-center">
                      <span className="text-xs font-bold text-on-surface-variant uppercase">
                        Koordinat belum diisi di berkas arsip.
                      </span>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>

        {/* BOTTOM NAV BAR */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t-2 border-outline-variant">
          <Link
            href="/pengawasan/database"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-surface hover:bg-surface-container text-on-surface border border-outline-variant rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <ArrowLeft size={16} /> Kembali ke Database Sasaran
          </Link>

          <Link
            href={`/perizinan/arsip/${doc.id}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-rose-200 hover:bg-rose-300 text-on-surface border border-outline-variant rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <FileEdit size={16} /> Buka Halaman Kelola / Upload Arsip
          </Link>
        </div>

      </div>
    </div>
  );
}
