'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, FilePen, RotateCcw, CheckCircle2, ClipboardList } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function PemeriksaanRevisiPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submittingAction, setSubmittingAction] = useState<'acc' | 'revisi' | null>(null);
  const [message, setMessage] = useState('');

  const [daftarPegawai, setDaftarPegawai] = useState<any[]>([]);
  
  const [revisiKe, setRevisiKe] = useState<string>('1');
  const [tanggalRevisi, setTanggalRevisi] = useState<string>('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/perizinan/${unwrappedParams.id}`).then(res => res.json()),
      fetch('/api/tim-penilai').then(res => res.json())
    ]).then(([docRes, pegawaiRes]) => {
      setDoc(docRes.data);
      
      const initialRevisi = docRes.data?.revisi_ke || '1';
      setRevisiKe(String(initialRevisi));
      
      // Urutkan berdasarkan urutan_hierarki
      const sortedPegawai = (pegawaiRes.data || []).sort((a: any, b: any) => (a.urutan_hierarki || 0) - (b.urutan_hierarki || 0));
      setDaftarPegawai(sortedPegawai);
      
      setLoading(false);
    });
  }, [unwrappedParams.id]);

  useEffect(() => {
    if (!doc) return;
    const dateKey = revisiKe === '1' ? 'tanggal_revisi_1' : `tanggal_revisi_${revisiKe}`;
    const initialDate = doc[dateKey] || doc.tanggal_revisi || new Date().toISOString().split('T')[0];
    setTanggalRevisi(initialDate);
  }, [revisiKe, doc]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
    const actionType = submitter.value as 'acc' | 'revisi';
    
    setSubmittingAction(actionType);
    
    const formData = new FormData(e.currentTarget);
    const penandatangan = formData.getAll('penandatangan[]');

    const status_tahapan = actionType === 'revisi' ? 'Revisi Lanjutan' : 'Selesai';

    const nomor_revisi = formData.get('nomor_revisi') as string;
    const tanggal_revisi = formData.get('tanggal_revisi') as string;

    const payload: any = {
      revisi_ke: nomor_revisi,
      penandatangan_revisi: JSON.stringify(penandatangan),
      nomor_registrasi_amdalnet: formData.get('nomor_registrasi_amdalnet'),
      status_tahapan, 
    };

    if (['1', '2', '3', '4', '5'].includes(nomor_revisi as string)) {
      payload[`tanggal_revisi_${nomor_revisi}`] = tanggal_revisi;
    } else {
      payload.tanggal_revisi_1 = tanggal_revisi;
    }

    try {
      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if(res.ok) {
        setMessage(`Revisi berhasil di-${actionType === 'acc' ? 'ACC (Selesai)' : 'Kembalikan untuk Revisi Lanjutan'}.`);
        setTimeout(() => router.push('/perizinan/daftar'), 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAction(null);
    }
  };

  if (loading) return <LottieLoader size={150} text="MEMUAT DATA..." />;
  if (!doc) return <div className="text-center py-20 text-error font-bold bg-error-container text-on-error-container border border-outline-variant m-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">DATA TIDAK DITEMUKAN!</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8 pb-20">
      <Link href="/perizinan/daftar" className="inline-flex items-center gap-2 text-sm text-on-surface font-bold transition-all bg-surface border border-outline-variant px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Dashboard
      </Link>

      {message && (
        <div className="p-4 bg-emerald-200 text-on-surface rounded-xl shadow-sm hover:shadow-md transition-shadow border border-outline-variant font-bold uppercase tracking-wide">
          {message}
        </div>
      )}

      {/* Header NeoBrutalism */}
      <div className="flex items-center gap-4 bg-surface p-6 rounded-3xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
        <div className="w-14 h-14 rounded-xl bg-blue-400 border border-outline-variant flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
          <FilePen size={28} className="text-on-surface" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface uppercase">Input Pemeriksaan Revisi</h2>
          <p className="text-sm font-bold text-on-surface-variant mt-1 uppercase">TAHUN {doc.tahun || '2026'} | TAHAP 5: PERBAIKAN</p>
        </div>
      </div>
      
      <div className="bg-surface border border-outline-variant rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
        {/* Info Box NeoBrutalism */}
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Nama Kegiatan</span>
            <p className="font-bold text-on-surface mt-1 uppercase text-sm md:text-base">{doc.nama_kegiatan}</p>
          </div>
          <div>
            <div className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">No Urut / Tahun</div>
            <p className="font-bold bg-blue-300 text-on-surface px-3 py-1 rounded border border-outline-variant inline-block mt-1 text-sm shadow-sm hover:shadow-md transition-shadow">
              #{String(doc.no_urut || doc.id).padStart(3, '0')} / {doc.tahun || '2026'}
            </p>
          </div>
          <div className="md:col-span-2 border-t border-outline-variant pt-4 mt-2">
            <span className="font-bold text-on-surface-variant text-xs uppercase tracking-wider">Pemrakarsa</span>
            <p className="font-bold text-on-surface mt-1 uppercase text-sm">{doc.nama_pemrakarsa || '-'}</p>
          </div>
        </div>

        {/* Riwayat Pemeriksaan Revisi */}
        {(() => {
          const revisiNames: Record<string, string> = { '1': 'Revisi 1', '2': 'Revisi 2', '3': 'Revisi 3', '4': 'Revisi 4' };
          const revisiHistory = Object.entries(revisiNames).filter(([key]) => {
            return doc[`tanggal_revisi_${key}`] || (key === '1' && doc.tanggal_revisi);
          });

          if (revisiHistory.length === 0) return null;

          return (
            <div className="mb-8 p-6 rounded-2xl border border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase flex items-center gap-2">
                Riwayat Pemeriksaan Revisi
              </h3>
              <div className="space-y-3">
                {revisiHistory.map(([key, label]) => {
                  const tanggal = doc[`tanggal_revisi_${key}`] || (key === '1' ? doc.tanggal_revisi : null);
                  return (
                    <div key={key} className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-center">
                      <div>
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-black px-3 py-1 rounded-full border border-blue-200 mb-2">{label}</span>
                        {tanggal && <p className="text-sm text-slate-700 font-bold">Pemeriksaan: {new Date(tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2 uppercase">Dokumen Revisi Ke- <span className="text-error">*</span></label>
              <select 
                name="nomor_revisi" 
                required 
                value={revisiKe}
                onChange={(e) => setRevisiKe(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-sm text-on-surface font-bold focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none cursor-pointer">
                <option value="1">Revisi 1 (PHP1)</option>
                <option value="2">Revisi 2 (PHP2)</option>
                <option value="3">Revisi 3 (PHP3)</option>
                <option value="4">Revisi 4 (PHP4)</option>
                <option value="5">Revisi 5 (PHP5)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-2 uppercase">Tanggal Pengembalian Revisi <span className="text-error">*</span></label>
              <input 
                type="date" 
                name="tanggal_revisi" 
                required 
                value={tanggalRevisi}
                onChange={(e) => setTanggalRevisi(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-sm text-on-surface font-bold focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none cursor-pointer" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2 uppercase">Nomor Registrasi Amdalnet (Opsional)</label>
              <input type="text" name="nomor_registrasi_amdalnet" defaultValue={doc.nomor_registrasi_amdalnet || ''} placeholder="Contoh: 698E43852228D"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-sm text-on-surface font-bold focus:bg-surface focus:shadow-sm hover:shadow-md transition-shadow transition-all outline-none" />
              <p className="text-[10px] text-on-surface-variant mt-1 uppercase font-bold">* Kosongkan jika tidak memakai sistem Amdalnet.</p>
            </div>
          </div>

          <div className="pt-8 border-t border-outline-variant mt-8">
            <label className="block text-sm font-bold text-on-surface mb-4 uppercase bg-blue-200 inline-block px-4 py-2 rounded-lg border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex items-center gap-2">
              <ClipboardList size={18} className="text-on-surface" /> Pilih Anggota Tim Pemeriksa
            </label>
            <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-sm text-on-surface">
                  <thead className="text-xs uppercase bg-surface-container font-bold border-b-4 border-outline-variant sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="p-4 w-12 text-center border-r border-outline-variant">#</th>
                      <th scope="col" className="px-4 py-3 border-r border-outline-variant">Nama Pegawai</th>
                      
                      <th scope="col" className="px-4 py-3">Jabatan / Kategori</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-900 font-bold">
                    {daftarPegawai.map((pegawai) => (
                      <tr key={pegawai.id} className="hover:bg-blue-50 transition-colors">
                        <td className="w-4 p-4 text-center border-r border-outline-variant">
                          <input type="checkbox" name="penandatangan[]" value={pegawai.id} 
                                 className="w-5 h-5 text-blue-500 bg-surface border border-outline-variant rounded focus:ring-blue-500 cursor-pointer shadow-sm hover:shadow-md transition-shadow" />
                        </td>
                        <td className="px-4 py-3 font-bold text-on-surface border-r border-outline-variant">{pegawai.nama}</td>
                        
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded bg-surface-container text-on-surface border border-outline-variant shadow-sm hover:shadow-md transition-shadow text-xs font-bold uppercase tracking-wide">
                            {pegawai.jabatan_dinas || pegawai.kategori || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-3 font-bold uppercase">* Kepala Bidang akan otomatis menjadi Penandatangan Utama (Kiri Bawah).</p>
          </div>

          <div className="pt-8 border-t border-outline-variant flex flex-col sm:flex-row justify-end gap-4 mt-8">
            <button type="submit" name="action" value="revisi" disabled={submittingAction !== null}
              className="w-full sm:w-auto px-6 py-4 bg-error text-on-error hover:bg-error-container text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0">
              {submittingAction === 'revisi' ? <LottieLoader size={24} /> : <RotateCcw size={18} />}
              Terbitkan BA Revisi
            </button>

            <button type="submit" name="action" value="acc" disabled={submittingAction !== null}
              className="w-full sm:w-auto px-8 py-4 bg-teal-400 hover:bg-teal-300 text-on-surface font-bold rounded-xl border border-outline-variant text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-70 disabled:hover:translate-y-0">
              {submittingAction === 'acc' ? <LottieLoader size={24} /> : <CheckCircle2 size={18} />}
              ACC & Lanjut Selesai
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
