'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Archive, Info, CheckCircle2, XCircle, Printer, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ArsipPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchDoc = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('dokumens').select('*').eq('id', unwrappedParams.id).single();
      setDoc(data);
      setLoading(false);
    };
    fetchDoc();
  }, [unwrappedParams.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const fisik = {
      dokumenCetak: formData.get('dokumenCetak') === '1',
      noDokumenCetak: formData.get('noDokumenCetak') || '',
      pkplhArsip: formData.get('pkplhArsip') === '1',
      noPkplhArsip: formData.get('noPkplhArsip') || '',
      suratPermohonan: formData.get('suratPermohonan') === '1',
      noSuratPermohonan: formData.get('noSuratPermohonan') || '',
      undanganSidang: formData.get('undanganSidang') === '1',
      noUndanganSidang: formData.get('noUndanganSidang') || '',
    };

    let status_tahapan = 'Diarsipkan';

    const payload = {
      lokasi_arsip: formData.get('lokasi_arsip'),
      status_tahapan,
      arsip_fisik: JSON.stringify(fisik),
    };

    try {
      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if(res.ok) {
        setMessage('Data Arsip Berhasil Disimpan!');
        setTimeout(() => router.push('/perizinan/daftar'), 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-900 font-black flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> MEMUAT...</div>;
  if (!doc) return <div className="text-center py-20 text-rose-600 font-black bg-rose-100 border-4 border-slate-900 m-8 rounded-2xl shadow-[4px_4px_0_0_#0f172a]">DATA TIDAK DITEMUKAN!</div>;

  let fisik: any = {};
  try {
    fisik = doc.arsip_fisik ? JSON.parse(doc.arsip_fisik) : {};
  } catch (e) {}

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8 pb-20">
      <Link href="/perizinan/daftar" className="inline-flex items-center gap-2 text-sm text-slate-900 font-black transition-all bg-white border-2 border-slate-900 px-4 py-2 rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Dashboard
      </Link>

      {message && (
        <div className="p-4 bg-emerald-200 text-slate-900 rounded-xl shadow-[4px_4px_0_0_#0f172a] border-2 border-slate-900 font-black uppercase tracking-wide">
          {message}
        </div>
      )}

      {/* Header NeoBrutalism */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-slate-400 border-2 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a]">
            <Archive size={28} className="text-slate-900" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">Verifikasi Berkas Fisik & Digital</h2>
            <p className="text-sm font-bold text-slate-600 mt-1 uppercase">Konfirmasi kelengkapan berkas #{String(doc.no_urut || doc.id).padStart(3, '0')}</p>
          </div>
        </div>
        <button onClick={() => window.open(`/api/perizinan/cetak-arsip?id=${doc.id}`, '_blank')} className="px-6 py-3 bg-indigo-300 hover:bg-indigo-400 text-slate-900 font-black border-2 border-slate-900 rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 transition-all uppercase flex items-center gap-2 tracking-wider text-sm whitespace-nowrap">
          <Printer size={18} /> Cetak Lembar Arsip
        </button>
      </div>
      
      <div className="bg-white border-4 border-slate-900 rounded-3xl p-8 shadow-[8px_8px_0_0_#0f172a]">
        
        {/* Info Box NeoBrutalism */}
        <div className="bg-slate-100 border-4 border-slate-900 rounded-2xl p-6 mb-8 flex items-start gap-4 shadow-[4px_4px_0_0_#0f172a]">
          <Info className="text-slate-900 mt-1 flex-shrink-0" size={24} />
          <div>
            <h4 className="font-black text-slate-900 uppercase text-sm md:text-base leading-tight">{doc.nama_kegiatan}</h4>
            <p className="text-xs text-slate-700 font-bold mt-2 uppercase">{doc.nama_pemrakarsa} • {doc.jenis_dokumen}</p>
            <p className="text-xs font-black bg-amber-300 text-slate-900 px-2 py-1 rounded border-2 border-slate-900 inline-block mt-2 shadow-[2px_2px_0_0_#0f172a] uppercase">No. Registrasi: {doc.nomor_checklist || 'Belum ada'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* 1. DOKUMEN LINGKUNGAN FINAL */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${fisik.dokumenCetak ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                <input type="checkbox" name="dokumenCetak" value="1" defaultChecked={fisik.dokumenCetak} className="mt-1 w-6 h-6 text-emerald-500 bg-white border-2 border-slate-900 rounded focus:ring-emerald-500 cursor-pointer shadow-[2px_2px_0_0_#0f172a]" />
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">1. Dokumen Lingkungan Final</p>
                  <input type="text" name="noDokumenCetak" defaultValue={fisik.noDokumenCetak} placeholder="Input nomor / posisi rak..." className="mt-3 w-full p-3 bg-white border-2 border-slate-900 rounded-xl text-sm text-slate-900 font-bold outline-none focus:shadow-[4px_4px_0_0_#0f172a] transition-all" />
                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <label className="text-xs text-slate-900 font-black mb-2 block uppercase">Upload Softcopy (PDF/ZIP)</label>
                    <input type="file" name="file_dokumen_cetak" accept=".pdf,.zip,.rar" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. PKPLH ARSIP */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${fisik.pkplhArsip ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                <input type="checkbox" name="pkplhArsip" value="1" defaultChecked={fisik.pkplhArsip} className="mt-1 w-6 h-6 text-emerald-500 bg-white border-2 border-slate-900 rounded focus:ring-emerald-500 cursor-pointer shadow-[2px_2px_0_0_#0f172a]" />
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">2. PKPLH Arsip</p>
                  <input type="text" name="noPkplhArsip" defaultValue={fisik.noPkplhArsip} placeholder="Input keterangan..." className="mt-3 w-full p-3 bg-white border-2 border-slate-900 rounded-xl text-sm text-slate-900 font-bold outline-none focus:shadow-[4px_4px_0_0_#0f172a] transition-all" />
                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <label className="text-xs text-slate-900 font-black mb-2 block uppercase">Upload Scan PKPLH (PDF)</label>
                    <input type="file" name="file_pkplh" accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. BA UJI ADMINISTRASI */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${doc.nomor_uji_berkas ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                <div className="mt-1">{doc.nomor_uji_berkas ? <CheckCircle2 size={24} className="text-slate-900" /> : <XCircle size={24} className="text-slate-400" />}</div>
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">3. BA Uji Administrasi</p>
                  <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">{doc.nomor_uji_berkas || 'Belum terbit'}</p>
                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <label className="text-xs text-slate-900 font-black mb-2 block uppercase">Upload Arsip Scan BA (PDF)</label>
                    <input type="file" name="file_uji_admin" accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. BA VERLAP */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${doc.nomor_ba_verlap ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                <div className="mt-1">{doc.nomor_ba_verlap ? <CheckCircle2 size={24} className="text-slate-900" /> : <XCircle size={24} className="text-slate-400" />}</div>
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">4. BA Verlap</p>
                  <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">{doc.nomor_ba_verlap || 'Belum terbit'}</p>
                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <label className="text-xs text-slate-900 font-black mb-2 block uppercase">Upload Arsip Scan Verlap (PDF)</label>
                    <input type="file" name="file_ba_verlap" accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. BA PEMERIKSAAN SIDANG */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${doc.nomor_ba_pemeriksaan ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                <div className="mt-1">{doc.nomor_ba_pemeriksaan ? <CheckCircle2 size={24} className="text-slate-900" /> : <XCircle size={24} className="text-slate-400" />}</div>
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">5. BA Pemeriksa/Sidang</p>
                  <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">{doc.nomor_ba_pemeriksaan || 'Belum terbit'}</p>
                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <label className="text-xs text-slate-900 font-black mb-2 block uppercase">Upload Arsip Scan Sidang (PDF)</label>
                    <input type="file" name="file_ba_sidang" accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            {/* 6. SURAT PERMOHONAN */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${fisik.suratPermohonan ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                <input type="checkbox" name="suratPermohonan" value="1" defaultChecked={fisik.suratPermohonan} className="mt-1 w-6 h-6 text-emerald-500 bg-white border-2 border-slate-900 rounded focus:ring-emerald-500 cursor-pointer shadow-[2px_2px_0_0_#0f172a]" />
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">6. Surat Permohonan (Awal)</p>
                  <input type="text" name="noSuratPermohonan" defaultValue={fisik.noSuratPermohonan} placeholder="Input letak arsip..." className="mt-3 w-full p-3 bg-white border-2 border-slate-900 rounded-xl text-sm text-slate-900 font-bold outline-none focus:shadow-[4px_4px_0_0_#0f172a] transition-all" />
                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <label className="text-xs text-slate-900 font-black mb-2 block uppercase">Upload Scan Permohonan (PDF)</label>
                    <input type="file" name="file_surat_permohonan" accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            {/* 7. LEMBAR REGISTRASI */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${doc.nomor_checklist ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                <div className="mt-1">{doc.nomor_checklist ? <CheckCircle2 size={24} className="text-slate-900" /> : <XCircle size={24} className="text-slate-400" />}</div>
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">7. Lembar Registrasi</p>
                  <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">{doc.nomor_checklist || 'Belum ada nomor'}</p>
                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <label className="text-xs text-slate-900 font-black mb-2 block uppercase">Upload Arsip Registrasi (PDF)</label>
                    <input type="file" name="file_registrasi" accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            {/* 8. LEMBAR PENGEMBALIAN */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${doc.tanggal_pengembalian ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                <div className="mt-1">{doc.tanggal_pengembalian ? <CheckCircle2 size={24} className="text-slate-900" /> : <XCircle size={24} className="text-slate-400" />}</div>
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">8. Lembar Pengembalian</p>
                  <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">{doc.tanggal_pengembalian || 'Tidak/Belum ada'}</p>
                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <label className="text-xs text-slate-900 font-black mb-2 block uppercase">Upload Arsip Pengembalian (PDF)</label>
                    <input type="file" name="file_pengembalian" accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            {/* 9. PHP */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${doc.nomor_php ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                <div className="mt-1">{doc.nomor_php ? <CheckCircle2 size={24} className="text-slate-900" /> : <XCircle size={24} className="text-slate-400" />}</div>
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">9. Penerimaan Perbaikan / PHP</p>
                  <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">{doc.nomor_php || 'Belum terbit'}</p>
                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <label className="text-xs text-slate-900 font-black mb-2 block uppercase">Upload Arsip PHP (PDF)</label>
                    <input type="file" name="file_php" accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            {/* 10. UNDANGAN SIDANG */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${fisik.undanganSidang ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                <input type="checkbox" name="undanganSidang" value="1" defaultChecked={fisik.undanganSidang} className="mt-1 w-6 h-6 text-emerald-500 bg-white border-2 border-slate-900 rounded focus:ring-emerald-500 cursor-pointer shadow-[2px_2px_0_0_#0f172a]" />
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">10. Undangan Sidang</p>
                  <input type="text" name="noUndanganSidang" defaultValue={fisik.noUndanganSidang} placeholder="Input nomor surat..." className="mt-3 w-full p-3 bg-white border-2 border-slate-900 rounded-xl text-sm text-slate-900 font-bold outline-none focus:shadow-[4px_4px_0_0_#0f172a] transition-all" />
                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <label className="text-xs text-slate-900 font-black mb-2 block uppercase">Upload Scan Undangan (PDF)</label>
                    <input type="file" name="file_undangan_sidang" accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

            {/* 11. RPD */}
            <div className={`p-6 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] transition-colors ${doc.nomor_risalah ? 'bg-emerald-200' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3 w-full">
                <div className="mt-1">{doc.nomor_risalah ? <CheckCircle2 size={24} className="text-slate-900" /> : <XCircle size={24} className="text-slate-400" />}</div>
                <div className="w-full">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-900">11. Penyusunan RPD</p>
                  <p className="text-xs font-bold mt-2 text-slate-700 bg-white inline-block px-3 py-1 rounded border-2 border-slate-900 uppercase shadow-[2px_2px_0_0_#0f172a]">{doc.nomor_risalah || 'Belum terbit'}</p>
                  <div className="mt-4 pt-4 border-t-2 border-slate-900">
                    <label className="text-xs text-slate-900 font-black mb-2 block uppercase">Upload Arsip RPD (PDF)</label>
                    <input type="file" name="file_rpd" accept=".pdf" className="w-full text-xs text-slate-900 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-amber-300 file:text-slate-900 hover:file:bg-amber-400 file:shadow-[2px_2px_0_0_#0f172a] file:transition-all cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* LOKASI ARSIP */}
          <div className="mt-8 p-6 bg-slate-100 border-4 border-slate-900 rounded-2xl shadow-[4px_4px_0_0_#0f172a]">
            <label className="block text-sm font-black text-slate-900 mb-2 uppercase tracking-wider">Lokasi Arsip / Lemari</label>
            <input type="text" name="lokasi_arsip" defaultValue={doc.lokasi_arsip || ''} placeholder="Contoh: Lemari A, Rak 3"
              className="w-full bg-white border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl p-3 focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
          </div>
  
          {/* TOMBOL AKSI */}
          <div className="pt-8 border-t-4 border-slate-900 flex justify-end gap-4 mt-8">
            <button type="submit" disabled={submitting} className="w-full sm:w-auto px-10 py-4 bg-emerald-400 hover:bg-emerald-300 text-slate-900 border-4 border-slate-900 font-black rounded-xl text-sm shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Simpan Arsip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
