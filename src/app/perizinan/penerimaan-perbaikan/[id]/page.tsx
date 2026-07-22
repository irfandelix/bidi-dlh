'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, FileCheck2, UserCheck } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function PenerimaanPerbaikanPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [petugasGerai, setPetugasGerai] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/perizinan/${unwrappedParams.id}`).then(res => res.json()),
      fetch('/api/tim-penilai?hierarki=13').then(res => res.json())
    ]).then(([docRes, petugasRes]) => {
      setDoc(docRes.data);
      if (petugasRes.data) {
        setPetugasGerai(petugasRes.data);
      }
      setLoading(false);
    });
  }, [unwrappedParams.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const status_tahapan = 'Penerimaan Perbaikan'; // Ubah dari Selesai / SK menjadi Penerimaan Perbaikan
    const nomor_revisi = formData.get('nomor_revisi') as string;
    const tanggal_penyerahan = formData.get('tanggal_penyerahan_perbaikan') as string;

    const payload: any = {
      revisi_ke: nomor_revisi,
      petugas_mpp_id: formData.get('petugas_mpp_id'),
      status_tahapan, 
    };

    if (['1', '2', '3', '4', '5'].includes(nomor_revisi as string)) {
      payload[`tanggal_php_${nomor_revisi}`] = tanggal_penyerahan;
    } else {
      payload.tanggal_php_1 = tanggal_penyerahan;
    }

    try {
      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if(res.ok) {
        setMessage('Data Penerimaan Perbaikan Berhasil Disimpan! Sedang mengunduh dokumen...');
        
        try {
          const docUrl = `/api/generate?stage=penerimaan-perbaikan&type=template_tanda_terima_perbaikan&id=${unwrappedParams.id}`;
          const a = document.createElement('a');
          a.href = docUrl;
          a.download = `Tanda_Terima_Perbaikan_${doc.nama_kegiatan?.replace(/\s+/g, '_') || 'KGT'}.docx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (e) {
          console.error('Download error:', e);
        }

        setTimeout(() => router.push('/perizinan/daftar'), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-900 font-black flex items-center justify-center gap-2"><LottieLoader size={24} /> MEMUAT...</div>;
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
        <div className="w-14 h-14 rounded-xl bg-emerald-400 border-2 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a]">
          <FileCheck2 size={28} className="text-slate-900" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">Input Penerimaan Perbaikan</h2>
          <p className="text-sm font-bold text-slate-600 mt-1 uppercase">TAHUN {doc.tahun || '2026'} | TAHAP 6: PHP</p>
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
            <p className="font-black bg-emerald-300 text-slate-900 px-3 py-1 rounded border-2 border-slate-900 inline-block mt-1 text-sm shadow-[2px_2px_0_0_#0f172a]">
              #{String(doc.no_urut || doc.id).padStart(3, '0')} / {doc.tahun || '2026'}
            </p>
          </div>
          <div className="md:col-span-2 border-t-4 border-slate-900 pt-4 mt-2">
            <span className="font-black text-slate-500 text-xs uppercase tracking-wider">Pemrakarsa</span>
            <p className="font-black text-slate-900 mt-1 uppercase text-sm">{doc.nama_pemrakarsa || '-'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase">Penerimaan Revisi Ke-</label>
              <select name="nomor_revisi" defaultValue="1"
                className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl p-3 text-sm text-slate-900 font-black focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none cursor-pointer">
                <option value="1">Revisi 1 (PHP1)</option>
                <option value="2">Revisi 2 (PHP2)</option>
                <option value="3">Revisi 3 (PHP3)</option>
                <option value="4">Revisi 4 (PHP4)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase">Tanggal Penyerahan Berkas <span className="text-rose-500">*</span></label>
              <input type="date" name="tanggal_penyerahan_perbaikan" required defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-sm rounded-xl p-3 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none cursor-pointer" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase">Petugas Penerima (MPP/Loket) <span className="text-rose-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCheck className="w-5 h-5 text-slate-900" />
                </div>
                <select name="petugas_mpp_id" required defaultValue=""
                  className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 text-sm rounded-xl pl-10 p-3 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none appearance-none font-black cursor-pointer">
                  <option value="" disabled>-- Pilih Petugas Gerai --</option>
                  {petugasGerai.map(petugas => (
                    <option key={petugas.id} value={petugas.id}>
                      {petugas.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t-4 border-slate-900 mt-8 flex justify-end">
            <button type="submit" disabled={submitting} 
              className="w-full sm:w-auto px-10 py-4 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-black rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0 text-sm">
              {submitting ? <LottieLoader size={24} /> : <FileCheck2 size={18} />}
              Simpan Data Penerimaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
