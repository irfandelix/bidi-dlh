import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { 
  CheckCircle2, Clock, FileText, Building2, MapPin, 
  Calendar, ShieldCheck, ArrowRight, Phone, AlertCircle, 
  Sparkles, ExternalLink, ArrowLeft, RefreshCw, Check
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return String(dateStr);
  }
}

export default async function PelacakanArusPerizinanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase: any = await createClient();

  const { data: doc, error } = await supabase
    .from('dokumens')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-lg space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-xl font-black text-slate-900 uppercase">Dokumen Tidak Ditemukan</h1>
          <p className="text-xs font-bold text-slate-600 leading-relaxed">
            Data perizinan lingkungan dengan ID atau nomor registrasi tersebut tidak ditemukan pada basis data resmi BIDI DLH Kabupaten Sragen.
          </p>
          <div className="pt-2">
            <Link
              href="/perizinan/arus"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-sm"
            >
              <ArrowLeft size={14} />
              <span>Cari Nomor Registrasi Lain</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Tentukan Status Terkini & Posisi Berkas (Bola di Siapa?)
  const st = (doc.status_tahapan || '').toLowerCase();
  
  const isSelesai = st.includes('selesai') || st.includes('sk') || st.includes('diarsipkan') || !!doc.nomor_sk;
  const isBolaDiPemohon = st.includes('dikembalikan') || st.includes('pengembalian') || st.includes('perbaikan') || (st.includes('revisi') && !st.includes('pemeriksaan revisi') && !st.includes('revisi selesai'));

  // Cek ketersediaan data tiap tahapan
  const hasUjiData = !!doc.nomor_uji_berkas || !!doc.tanggal_uji_berkas;
  const hasVerlapData = !!doc.nomor_ba_verlap || !!doc.tanggal_verlap;
  const hasPemeriksaanData = !!doc.nomor_ba_pemeriksaan || !!doc.tanggal_pemeriksaan;
  const hasPhpData = !!doc.nomor_php || !!doc.tanggal_php_1 || !!doc.tanggal_pengembalian;
  const hasRevisiData = !!doc.nomor_revisi_1 || !!doc.tanggal_revisi_1 || doc.is_final_revisi;
  const hasSkData = isSelesai || !!doc.nomor_sk || !!doc.tanggal_risalah || !!doc.nomor_risalah;

  // Status aktif per tahapan
  const isUjiActive = st.includes('uji administrasi') && !st.includes('selesai');
  const isVerlapActive = st.includes('verlap') && !st.includes('selesai');
  const isPemeriksaanActive = (st.includes('pemeriksaan-substansi') || st.includes('pemeriksaan substansi') || st.includes('sidang') || st === 'diperiksa');
  const isRevisiPemohonActive = isBolaDiPemohon || st === 'revisi' || st === 'revisi lanjutan';
  const isPemeriksaanRevisiActive = st.includes('pemeriksaan revisi') || (st.includes('revisi') && !isBolaDiPemohon && !st.includes('selesai'));
  const isSkActive = st.includes('jilidan') || st.includes('finalisasi') || (isSelesai && !doc.nomor_sk);
  const isRegistrasiActive = (st === 'registrasi' || st === 'proses') && !hasUjiData && !hasVerlapData && !hasPemeriksaanData && !hasSkData;

  // Tentukan Alur Gerbang Tahapan
  const allSteps = [
    {
      id: 1,
      title: 'Penerimaan & Registrasi Berkas',
      deskripsi: 'Penerimaan berkas permohonan di loket pelayanan / MPP.',
      tgl: doc.tanggal_masuk_dokumen || doc.created_at,
      nomor: doc.nomor_checklist || doc.nomor_registrasi_amdalnet,
      isDone: true,
      isActive: isRegistrasiActive,
    },
    {
      id: 2,
      title: 'Uji Kelengkapan Administrasi',
      deskripsi: 'Pemeriksaan kesesuaian dan kelengkapan dokumen persyaratan administrasi.',
      tgl: doc.tanggal_uji_berkas,
      nomor: doc.nomor_uji_berkas,
      isDone: hasUjiData || st.includes('uji administrasi selesai') || hasVerlapData || hasPemeriksaanData || hasPhpData || hasRevisiData || hasSkData,
      isActive: isUjiActive,
    },
    {
      id: 3,
      title: 'Verifikasi Lapangan (Jika Diperlukan)',
      deskripsi: 'Inspeksi kesesuaian lokasi dan rona lingkungan hidup awal oleh Tim DLH.',
      tgl: doc.tanggal_verlap,
      nomor: doc.nomor_ba_verlap,
      isRelevant: hasVerlapData || isVerlapActive || st.includes('verlap'),
      isDone: hasVerlapData || st.includes('verlap selesai'),
      isActive: isVerlapActive,
    },
    {
      id: 4,
      title: 'Pemeriksaan Substansi Teknis / Sidang',
      deskripsi: 'Pembahasan dokumen oleh Tim Penilai / Komisi Teknis Lingkungan Hidup.',
      tgl: doc.tanggal_pemeriksaan,
      nomor: doc.nomor_ba_pemeriksaan,
      isDone: hasPemeriksaanData || hasPhpData || hasRevisiData || hasSkData,
      isActive: isPemeriksaanActive,
    },
    {
      id: 5,
      title: 'Masa Perbaikan / Revisi oleh Pemohon',
      deskripsi: 'Penyempurnaan dokumen oleh pemohon sesuai Berita Acara catatan teknis.',
      tgl: doc.tanggal_php_1 || doc.tanggal_pengembalian,
      nomor: doc.nomor_php ? `Catatan BA: ${doc.nomor_php}` : null,
      isRelevant: hasPhpData || isRevisiPemohonActive || hasRevisiData,
      isDone: hasRevisiData || st.includes('penerimaan perbaikan') || st.includes('revisi selesai') || hasSkData,
      isActive: isRevisiPemohonActive,
    },
    {
      id: 6,
      title: 'Pemeriksaan Ulang Revisi Dokumen',
      deskripsi: 'Pemeriksaan kesesuaian revisi dokumen lingkungan hingga dinyatakan final.',
      tgl: doc.tanggal_revisi_1 || doc.tanggal_php_2,
      nomor: doc.nomor_revisi_1 ? `BA.P: ${doc.nomor_revisi_1}` : null,
      isRelevant: hasRevisiData || isPemeriksaanRevisiActive,
      isDone: doc.is_final_revisi || st.includes('revisi selesai') || st.includes('jilidan') || hasSkData,
      isActive: isPemeriksaanRevisiActive,
    },
    {
      id: 7,
      title: 'Penerbitan Persetujuan Lingkungan / SK',
      deskripsi: 'Penerbitan Rekomendasi / Surat Keputusan (SK) Persetujuan Lingkungan Hidup.',
      tgl: doc.tanggal_risalah || doc.tanggal_penerimaan_jilidan,
      nomor: doc.nomor_sk || doc.nomor_risalah,
      isDone: isSelesai || !!doc.nomor_sk,
      isActive: isSkActive,
    }
  ];

  // Filter HANYA tahapan yang benar-benar SUDAH SELESAI divalidasi
  const steps = allSteps.filter(s => {
    if (s.isRelevant === false) return false;
    return s.isDone;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-6 md:p-10 pb-20">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* HEADER BRANDING KEDINASAN */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-50 rounded-full border border-emerald-100 opacity-60"></div>
          
          <div className="flex items-center justify-center gap-3 mb-2 relative z-10">
            <span className="text-[11px] font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-widest">
              Layanan Pelacakan Resmi
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase relative z-10">
            Arus Proses Dokumen Perizinan Lingkungan
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider relative z-10">
            Dinas Lingkungan Hidup Kabupaten Sragen
          </p>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 text-xs font-mono">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">
              Nomor Registrasi:
            </span>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-900 rounded-xl border border-slate-200 font-black tracking-wide text-xs sm:text-sm break-all text-center max-w-full shadow-xs">
              {doc.nomor_checklist || doc.nomor_registrasi_amdalnet || `REG-${doc.id}`}
            </span>
          </div>
        </div>

        {/* KARTU STATUS UTAMA (BOLA DI SIAPA?) */}
        <div className={`border-2 rounded-3xl p-6 shadow-sm transition-all ${
          isSelesai
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
            : isBolaDiPemohon
            ? 'bg-amber-50/80 border-amber-300 text-amber-950'
            : 'bg-indigo-50/80 border-indigo-300 text-indigo-950'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border ${
              isSelesai
                ? 'bg-emerald-600 text-white border-emerald-700'
                : isBolaDiPemohon
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-indigo-600 text-white border-indigo-700'
            }`}>
              {isSelesai ? <CheckCircle2 size={24} /> : isBolaDiPemohon ? <Clock size={24} /> : <RefreshCw size={24} className="animate-spin-slow" />}
            </div>

            <div className="flex-1">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border inline-block mb-1.5 ${
                isSelesai
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : isBolaDiPemohon
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-indigo-100 text-indigo-800 border-indigo-300'
              }`}>
                {isSelesai ? 'Status: Selesai' : isBolaDiPemohon ? 'Posisi: Di Pihak Pemohon' : 'Posisi: Di Tim Teknis DLH'}
              </span>

              <h2 className="text-lg sm:text-xl font-black tracking-tight leading-snug">
                {isSelesai
                  ? 'Persetujuan Lingkungan Selesai Diterbitkan'
                  : isBolaDiPemohon
                  ? 'Menunggu Perbaikan Berkas dari Pemohon'
                  : 'Sedang Dalam Proses Penanganan Tim Teknis DLH'}
              </h2>

              <p className="text-xs font-semibold mt-1.5 opacity-90 leading-relaxed">
                {isSelesai
                  ? 'Dokumen persetujuan lingkungan hidup telah selesai diproses dan siap diserahkan / telah diarsipkan resmi.'
                  : isBolaDiPemohon
                  ? 'Berkas saat ini berada di pihak Pemohon / Pemrakarsa untuk dilakukan penyempurnaan dokumen lingkungan sesuai Berita Acara catatan teknis DLH.'
                  : 'Berkas permohonan saat ini sedang dalam antrean dan pemeriksaan teknis oleh Tim Teknis Dinas Lingkungan Hidup Kabupaten Sragen.'}
              </p>
            </div>
          </div>
        </div>

        {/* IDENTITAS KEGIATAN & PEMRAKARSA */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 size={18} className="text-emerald-700" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Identitas Permohonan Izin
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Nama Usaha / Kegiatan</p>
              <p className="font-black text-slate-900 text-sm mt-0.5">{doc.nama_kegiatan || '-'}</p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Penanggung Jawab / Pemrakarsa</p>
              <p className="font-black text-slate-900 text-sm mt-0.5">{doc.nama_pemrakarsa || '-'}</p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Jenis Dokumen Lingkungan</p>
              <span className="inline-block mt-1 px-3 py-1 bg-emerald-100 text-emerald-950 font-black rounded-lg border border-emerald-300 text-xs">
                {doc.jenis_dokumen || 'UKL-UPL'}
              </span>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Lokasi Kegiatan</p>
              <p className="font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                <MapPin size={13} className="text-slate-600 shrink-0" />
                <span>{doc.lokasi_kegiatan || '-'}</span>
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Tanggal Masuk Dokumen</p>
              <p className="font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                <Calendar size={13} className="text-slate-600 shrink-0" />
                <span>{formatDate(doc.tanggal_masuk_dokumen || doc.created_at)}</span>
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Nomor Surat Permohonan</p>
              <p className="font-bold text-slate-800 mt-0.5 font-mono">{doc.nomor_surat_permohonan || '-'}</p>
            </div>
          </div>
        </div>

        {/* TIMELINE ARUS TAHAPAN (STEPPER VISUAL) */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-700" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Garis Waktu Arus Perizinan
              </h3>
            </div>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
              {isSelesai 
                ? 'Semua Tahap Selesai' 
                : `${steps.length} Tahapan Selesai Divalidasi`}
            </span>
          </div>

          <div className={`relative pl-6 space-y-8 ${steps.length > 1 ? 'before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[3px] before:bg-slate-200' : ''}`}>
            {steps.map((stItem) => {
              return (
                <div key={stItem.id} className="relative flex items-start gap-4 group">
                  {/* Icon Indicator Selesai */}
                  <div className="absolute -left-[27px] top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 bg-emerald-600 text-white border-emerald-700 shadow-xs transition-all">
                    <Check size={14} className="stroke-[3]" />
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 p-4 rounded-2xl border bg-slate-50/70 border-slate-200 transition-all">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight text-slate-900">
                        {stItem.title}
                      </h4>

                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                        Selesai
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-600 mt-1 leading-relaxed">
                      {stItem.deskripsi}
                    </p>

                    {(stItem.tgl || stItem.nomor) && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold text-slate-600">
                        {stItem.tgl && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <Calendar size={12} className="text-slate-500" />
                            {formatDate(stItem.tgl)}
                          </span>
                        )}
                        {stItem.nomor && (
                          <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {stItem.nomor}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!isSelesai && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 text-xs text-slate-600 font-semibold shadow-2xs">
              <Sparkles size={16} className="text-emerald-600 shrink-0" />
              <p className="leading-relaxed">
                Tahapan berikutnya akan otomatis muncul pada linimasa ini setelah selesai diverifikasi dan diterbitkan dokumen resminya oleh Tim Teknis DLH Kabupaten Sragen.
              </p>
            </div>
          )}
        </div>

        {/* FOOTER INFORMASI & PUSAT BANTUAN */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="text-sm font-black uppercase tracking-wider">
              Pusat Pelayanan & Informasi DLH Sragen
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Jika terdapat kendala atau pertanyaan terkait berkas perizinan Anda, silakan hubungi layanan resmi kami.
            </p>
            <p className="text-[11px] font-bold text-emerald-400 mt-1.5 flex items-center justify-center sm:justify-start gap-1.5">
              <span>Hotline WhatsApp Resmi:</span>
              <span className="font-mono tracking-wider font-black text-white">+62 822-5774-0385</span>
            </p>
          </div>

          <a
            href={`https://wa.me/6282257740385?text=${encodeURIComponent(
              `Halo Admin DLH Sragen, saya ingin menanyakan perkembangan proses dokumen perizinan:\n` +
              `• Kegiatan: ${doc.nama_kegiatan || '-'}\n` +
              `• Pemrakarsa: ${doc.nama_pemrakarsa || '-'}\n` +
              `• No. Registrasi: #${doc.no_urut || doc.id}\n\n` +
              `Mohon informasinya. Terima kasih.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md transition-all shrink-0 hover:-translate-y-0.5"
          >
            <Phone size={14} />
            <span>Hubungi Hotline</span>
          </a>
        </div>

        <p className="text-center text-[11px] font-bold text-slate-600 uppercase tracking-widest">
          Sistem Informasi BIDI DLH &bull; Pemerintah Kabupaten Sragen
        </p>
      </div>
    </div>
  );
}
