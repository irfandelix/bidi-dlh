'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle2, Award, BookCopy, FileText } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function FinalisasiPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/perizinan/${unwrappedParams.id}`)
      .then(res => res.json())
      .then(res => {
        setDoc(res.data);
        setLoading(false);
      });
  }, [unwrappedParams.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    // Jika semua tanggal diisi, statusnya menjadi "Diarsipkan"
    // Jika hanya SK, statusnya "Menunggu Jilidan"
    const tglSK = formData.get('tanggal_penyerahan_sk');
    
    let status_tahapan = 'Selesai / SK';
    if (tglSK) status_tahapan = 'Menunggu Jilidan';

    const payload = {
      tanggal_risalah: formData.get('tanggal_risalah'),
      nomor_risalah: formData.get('nomor_risalah'),
      nomor_sk: formData.get('nomor_sk'),
      tanggal_penyerahan_sk: tglSK,
      arsip_fisik: formData.get('lokasi_arsip'),
      status_tahapan, 
    };

    try {
      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if(res.ok) {
        setMessage('Data Finalisasi & Arsip Berhasil Disimpan!');
        setTimeout(() => router.push('/perizinan/daftar'), 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LottieLoader size={150} text="MEMUAT DATA..." />;
  if (!doc) return <div className="text-center py-20 text-rose-600 font-black bg-rose-100 border-4 border-slate-900 m-8 rounded-2xl shadow-[4px_4px_0_0_#0f172a]">DATA TIDAK DITEMUKAN!</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8 pb-20">
      <Link href="/perizinan/daftar" className="inline-flex items-center gap-2 text-sm text-slate-900 font-black transition-all bg-white border-2 border-slate-900 px-4 py-2 rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Dashboard
      </Link>

      {message && (
        <div className="p-4 bg-emerald-200 text-slate-900 rounded-xl shadow-[4px_4px_0_0_#0f172a] border-2 border-slate-900 font-black uppercase tracking-wide">
          {message}
        </div>
      )}

      {/* Header NeoBrutalism */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
        <div className="w-14 h-14 rounded-xl bg-amber-400 border-2 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a]">
          <Award size={28} className="text-slate-900" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">Tahap Finalisasi (RPD, SK & Arsip)</h2>
          <p className="text-sm font-bold text-slate-600 mt-1 uppercase">TAHUN {doc.tahun || '2026'} | RISALAH, SK & JILIDAN FINAL</p>
        </div>
      </div>
      
      <div className="bg-white border-4 border-slate-900 rounded-3xl p-8 shadow-[8px_8px_0_0_#0f172a]">
        {/* Info Box NeoBrutalism */}
        <div className="bg-slate-100 border-4 border-slate-900 rounded-2xl p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-[4px_4px_0_0_#0f172a]">
          <div>
            <span className="font-black text-slate-500 text-xs uppercase tracking-wider">Nama Kegiatan</span>
            <p className="font-black text-slate-900 mt-1 uppercase text-sm md:text-base">{doc.nama_kegiatan}</p>
          </div>
          <div>
            <div className="font-black text-slate-500 text-xs uppercase tracking-wider">No Urut / Tahun</div>
            <p className="font-black bg-amber-300 text-slate-900 px-3 py-1 rounded border-2 border-slate-900 inline-block mt-1 text-sm shadow-[2px_2px_0_0_#0f172a]">
              #{String(doc.no_urut || doc.id).padStart(3, '0')} / {doc.tahun || '2026'}
            </p>
          </div>
          <div className="md:col-span-2 border-t-4 border-slate-900 pt-4 mt-2">
            <span className="font-black text-slate-500 text-xs uppercase tracking-wider">Pemrakarsa</span>
            <p className="font-black text-slate-900 mt-1 uppercase text-sm">{doc.nama_pemrakarsa || '-'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bagian RPD */}
            <div className="space-y-4 p-6 border-4 border-slate-900 bg-rose-100 rounded-2xl shadow-[4px_4px_0_0_#0f172a] relative overflow-hidden">
              <div className="absolute -top-4 -right-4 p-3 text-rose-200/50 transform rotate-12"><BookCopy size={100} /></div>
              <h3 className="font-black text-slate-900 flex items-center gap-2 relative z-10 text-lg uppercase tracking-wide">
                <span className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-[2px_2px_0_0_#ffffff]">1</span> Finalisasi Risalah
              </h3>
              
              <div className="relative z-10">
                <label className="block text-xs font-black text-slate-900 mb-2 uppercase tracking-wider">Tanggal Pembuatan Risalah</label>
                <input type="date" name="tanggal_risalah" defaultValue={doc.tanggal_risalah || new Date().toISOString().split('T')[0]}
                  className="w-full bg-white border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl p-3 focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
              </div>

              <div className="relative z-10">
                <label className="block text-xs font-black text-slate-900 mb-2 uppercase tracking-wider">Nomor Risalah (RPD)</label>
                <div className="flex gap-2">
                  <input type="text" id="nomor_risalah_input" name="nomor_risalah" defaultValue={doc.nomor_risalah || ''} placeholder="Klik generate..."
                    readOnly
                    className="w-full bg-slate-100 border-2 border-slate-900 text-slate-600 text-sm font-bold rounded-xl p-3 focus:outline-none cursor-not-allowed" />
                  <button type="button" 
                    onClick={() => {
                      const input = document.getElementById('nomor_risalah_input') as HTMLInputElement;
                      const dateInput = document.querySelector('input[name="tanggal_risalah"]') as HTMLInputElement;
                      if (input) {
                        const dateVal = dateInput ? dateInput.value : '';
                        const dateObj = dateVal ? new Date(dateVal) : new Date();
                        const bulan = dateObj.getMonth() + 1;
                        const jenisAcronym = ({
  'SPPL': 'SPPL', 'UKLUPL': 'UKLUPL', 'UKL-UPL': 'UKLUPL',
  'RINTEK LB3': 'RT.LB3', 'PERTEK AIR LIMBAH': 'ST.AL', 'PERTEK EMISI': 'ST.EM',
  'KAJIAN TEKNIS AIR LIMBAH': 'KT.AL', 'KAJIAN TEKNIS EMISI': 'KT.EM',
  'KT AL': 'KT.AL', 'KT EM': 'KT.EM', 'SLO': 'SLO', 'DPLH': 'DPLH', 
  'DELH': 'DELH', 'AMDAL': 'AMDAL'
} as Record<string, string>)[doc.jenis_dokumen as string] || doc.jenis_dokumen;
                        input.value = `600.4/${String(doc.no_urut || doc.id).padStart(3, '0')}.${bulan}/17/RPD.${jenisAcronym}/${doc.tahun || dateObj.getFullYear()}`;
                      }
                    }}
                    className="px-4 py-3 bg-indigo-200 text-slate-900 font-black rounded-xl border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#0f172a] transition-all uppercase tracking-wider text-xs whitespace-nowrap flex items-center gap-2">
                    <FileText size={16} /> Generate
                  </button>
                </div>
              </div>
            </div>

            {/* Bagian SK */}
            <div className="space-y-4 p-6 border-4 border-slate-900 bg-blue-100 rounded-2xl shadow-[4px_4px_0_0_#0f172a] relative overflow-hidden">
              <div className="absolute -top-4 -right-4 p-3 text-blue-200/50 transform -rotate-12"><Award size={100} /></div>
              <h3 className="font-black text-slate-900 flex items-center gap-2 relative z-10 text-lg uppercase tracking-wide">
                <span className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-[2px_2px_0_0_#ffffff]">2</span> Penyerahan SK
              </h3>
              
              <div className="relative z-10">
                <label className="block text-xs font-black text-slate-900 mb-2 uppercase tracking-wider">Nomor SK / Rekomendasi</label>
                <input type="text" name="nomor_sk" defaultValue={doc.nomor_sk || ''} placeholder="Contoh: 660.1/123/DLH/2026"
                  className="w-full bg-white border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl p-3 focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
              </div>

              <div className="relative z-10">
                <label className="block text-xs font-black text-slate-900 mb-2 uppercase tracking-wider">Tanggal Penyerahan SK</label>
                <input type="date" name="tanggal_penyerahan_sk" defaultValue={doc.tanggal_penyerahan_sk || ''}
                  className="w-full bg-white border-2 border-slate-900 text-slate-900 text-sm font-bold rounded-xl p-3 focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t-4 border-slate-900 mt-8 flex justify-end">
            <button type="submit" disabled={submitting} 
              className="w-full sm:w-auto px-10 py-4 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0 text-sm">
              {submitting ? <LottieLoader size={24} /> : <CheckCircle2 size={18} />}
              Simpan Data Finalisasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
