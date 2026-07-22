'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Loader2, ClipboardCheck, RotateCcw, CheckCircle2 } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function PemeriksaanSubstansiPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submittingAction, setSubmittingAction] = useState<'acc' | 'revisi' | null>(null);
  const [message, setMessage] = useState('');

  const [daftarPegawai, setDaftarPegawai] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/perizinan/${unwrappedParams.id}`).then(res => res.json()),
      fetch('/api/tim-penilai').then(res => res.json())
    ]).then(([docRes, pegawaiRes]) => {
      setDoc(docRes.data);
      // Urutkan berdasarkan urutan_hierarki
      const sortedPegawai = (pegawaiRes.data || []).sort((a: any, b: any) => (a.urutan_hierarki || 0) - (b.urutan_hierarki || 0));
      setDaftarPegawai(sortedPegawai);
      setLoading(false);
    });
  }, [unwrappedParams.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // In standard HTML, we can't reliably get the clicked submit button from FormData directly
    // in the onSubmit handler without tracking it. But we can use nativeEvent.submitter.
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
    const actionType = submitter.value as 'acc' | 'revisi';
    
    setSubmittingAction(actionType);
    
    const formData = new FormData(e.currentTarget);
    const penandatangan = formData.getAll('penandatangan[]');

    const status_tahapan = 'Pengembalian BA';

    // Get existing ekstra to merge
    let ekstra = {};
    try { if (doc.penandatangan_hua) ekstra = typeof doc.penandatangan_hua === 'string' ? JSON.parse(doc.penandatangan_hua) : doc.penandatangan_hua; } catch(e) {}

    const updatedEkstra = {
      ...ekstra,
      nama_perusahaan: formData.get('nama_perusahaan'),
      tambahan_kolom_kosong: formData.get('tambahan_kolom_kosong')
    };

    const payload = {
      nomor_ba_pemeriksaan: 'AUTO',
      tanggal_pemeriksaan: formData.get('tanggal_pemeriksaan'),
      penandatangan_pemeriksaan: JSON.stringify(penandatangan),
      status_tahapan, 
      penandatangan_hua: updatedEkstra
    };

    try {
      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if(res.ok) {
        setMessage('Menyiapkan Dokumen BA Rapat...');
        // Auto Download File
        const downloadUrl = `/api/generate?stage=pemeriksaan-substansi&type=template_ba_substansi&id=${unwrappedParams.id}`;
        
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          setMessage('Dokumen Dikembalikan untuk Revisi!');
          setTimeout(() => router.push('/perizinan/daftar'), 1500);
        }, 1000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAction(null);
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
        <div className="w-14 h-14 rounded-xl bg-indigo-400 border-2 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a]">
          <Users size={28} className="text-slate-900" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">Input Pemeriksaan Substansi</h2>
          <p className="text-sm font-bold text-slate-600 mt-1 uppercase">TAHUN {doc.tahun || '2026'} | TAHAP 4: RAPAT SIDANG</p>
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
            <p className="font-black bg-indigo-300 text-slate-900 px-3 py-1 rounded border-2 border-slate-900 inline-block mt-1 text-sm shadow-[2px_2px_0_0_#0f172a]">
              #{String(doc.no_urut || doc.id).padStart(3, '0')} / {doc.tahun || '2026'}
            </p>
          </div>
          <div className="md:col-span-2 border-t-4 border-slate-900 pt-4 mt-2">
            <span className="font-black text-slate-500 text-xs uppercase tracking-wider">Pemrakarsa</span>
            <p className="font-black text-slate-900 mt-1 uppercase text-sm">{doc.nama_pemrakarsa || '-'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <div>
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase">Tanggal BA Pemeriksaan <span className="text-rose-500">*</span></label>
              <input type="date" name="tanggal_pemeriksaan" required defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-sm rounded-xl px-4 py-3 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none cursor-pointer" />
            </div>
            
            <div>
              <label className="block text-sm font-black text-slate-900 mb-2 uppercase">Nama PT / Instansi</label>
              <input type="text" name="nama_perusahaan" defaultValue={(() => { try { return JSON.parse(doc.ekstra_baris).nama_perusahaan || ''; } catch(e) { return ''; }})()} placeholder="Contoh: PT Kasoma Properti Indonesia"
                className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-sm rounded-xl px-4 py-3 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">* Bedakan dengan nama pemrakarsa (nama orang) saat awal pendaftaran</p>
            </div>
          </div>

          <div className="max-w-md">
            <label className="block text-sm font-black text-slate-900 mb-2 uppercase">Tambahan Baris Tanda Tangan Kosong</label>
            <input type="number" name="tambahan_kolom_kosong" min="0" max="10" defaultValue={(() => { try { return JSON.parse(doc.ekstra_baris).tambahan_kolom_kosong || '0'; } catch(e) { return '0'; }})()}
              className="w-full bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-sm rounded-xl px-4 py-3 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none" />
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">* Isi angka (misal: 2) jika butuh baris ekstra untuk ditandatangani manual.</p>
          </div>

          <div className="pt-8 border-t-4 border-slate-900 mt-8">
            <label className="block text-sm font-black text-slate-900 mb-4 uppercase bg-indigo-200 inline-block px-4 py-2 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] flex items-center gap-2">
              <ClipboardCheck size={18} className="text-slate-900" /> Pilih Anggota Tim Pemeriksa
            </label>
            <div className="bg-white border-4 border-slate-900 rounded-xl overflow-hidden shadow-[4px_4px_0_0_#0f172a]">
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-sm text-slate-900">
                  <thead className="text-xs uppercase bg-slate-200 font-black border-b-4 border-slate-900 sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="p-4 w-12 text-center border-r-2 border-slate-900">#</th>
                      <th scope="col" className="px-4 py-3 border-r-2 border-slate-900">Nama Pegawai</th>
                      
                      <th scope="col" className="px-4 py-3">Jabatan / Kategori</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-900 font-bold">
                    {daftarPegawai.map((pegawai) => (
                      <tr key={pegawai.id} className="hover:bg-indigo-50 transition-colors">
                        <td className="w-4 p-4 text-center border-r-2 border-slate-900">
                          <input type="checkbox" name="penandatangan[]" value={pegawai.id} 
                                 className="w-5 h-5 text-indigo-500 bg-white border-2 border-slate-900 rounded focus:ring-indigo-500 cursor-pointer shadow-[1px_1px_0_0_#0f172a]" />
                        </td>
                        <td className="px-4 py-3 font-black text-slate-900 border-r-2 border-slate-900">{pegawai.nama}</td>
                        
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded bg-slate-200 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] text-xs font-black uppercase tracking-wide">
                            {pegawai.jabatan_dinas || pegawai.kategori || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 font-black uppercase">* Kepala Bidang akan otomatis menjadi Penandatangan Utama (Kiri Bawah).</p>
          </div>

            <button type="submit" name="action" value="revisi" disabled={submittingAction !== null}
              className="w-full px-8 py-4 bg-rose-400 hover:bg-rose-300 text-slate-900 border-4 border-slate-900 font-black rounded-xl text-sm shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0">
              {submittingAction !== null ? <LottieLoader size={24} /> : <RotateCcw size={18} />}
              Simpan BA Rapat & Kembalikan Ke Pemrakarsa
            </button>
        </form>
      </div>
    </div>
  );
}
