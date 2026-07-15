'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ClipboardCheck, Send, Loader2, ListChecks, PenTool } from 'lucide-react';

export default function UjiAdministrasiPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const [daftarPegawai, setDaftarPegawai] = useState<any[]>([]);

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

  useEffect(() => {
    Promise.all([
      fetch(`/api/perizinan/${unwrappedParams.id}`).then(res => res.json()),
      fetch('/api/tim-penilai').then(res => res.json())
    ]).then(([docRes, pegawaiRes]) => {
      setDoc(docRes.data);
      const sortedPegawai = (pegawaiRes.data || []).sort((a: any, b: any) => (a.urutan_hierarki || 0) - (b.urutan_hierarki || 0));
      setDaftarPegawai(sortedPegawai);
      setLoading(false);
    });
  }, [unwrappedParams.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    
    // Process complex checklist arrays
    const keberadaan = checklistItems.map((_, i) => formData.get(`keberadaan[${i}]`) || '');
    const kesesuaian = checklistItems.map((_, i) => formData.get(`kesesuaian[${i}]`) || '');
    const keterangan_uji = checklistItems.map((_, i) => formData.get(`keterangan_uji[${i}]`) || '');
    
    // Simulated saving Data Uji Admin JSON
    const data_uji_admin = JSON.stringify({ keberadaan, kesesuaian, keterangan: keterangan_uji });

    // Process Tim Penilai array
    const penandatangan = formData.getAll('penandatangan[]');

    // Get existing ekstra_baris to merge
    let ekstra = {};
    try { if (doc.penandatangan_hua) ekstra = typeof doc.penandatangan_hua === 'string' ? JSON.parse(doc.penandatangan_hua) : doc.penandatangan_hua; } catch(e) {}

    const updatedEkstra = {
      ...ekstra,
      kewenangan: formData.get('kewenangan'),
      kbli: formData.get('kbli'),
      hasil_verifikasi_uji: formData.get('hasil_verifikasi_uji'),
      keberadaan,
      kesesuaian,
      keterangan_uji
    };

    const jenisAcronym = doc.jenis_dokumen === 'SPPL' ? 'SPPL' : 
                         doc.jenis_dokumen === 'UKL-UPL' ? 'UKL-UPL' : 
                         doc.jenis_dokumen === 'DPLH' ? 'DPLH' : 
                         doc.jenis_dokumen === 'AMDAL' ? 'AMDAL' : 'DOK';
    const noUrutPadded = String(doc.no_urut || doc.id).padStart(3, '0');
    const bulan = new Date().getMonth() + 1;
    const tahun = new Date().getFullYear();
    const nomorUji = `600.4/${noUrutPadded}.${bulan}/17/BA.HUA.${jenisAcronym}/${tahun}`;

    const payload = {
      nomor_uji_berkas: nomorUji,
      tanggal_uji_berkas: formData.get('tanggal_uji_berkas'),
      keterangan: formData.get('catatan_uji_admin'),
      penandatangan_uji_admin: JSON.stringify(penandatangan),
      status_tahapan: 'Uji Administrasi Selesai', // Pindah ke Verlap
      penandatangan_hua: updatedEkstra
    };

    try {
      const res = await fetch(`/api/perizinan/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if(res.ok) {
        setMessage('Menyiapkan Dokumen BA HUA (Mohon Tunggu)...');
        
        // Auto Download File via Fetch to prevent cancellation
        try {
          const downloadUrl = `/api/generate?stage=uji-administrasi&type=template_ba_uji_admin&id=${unwrappedParams.id}`;
          const fileRes = await fetch(downloadUrl);
          
          if (fileRes.ok) {
            const blob = await fileRes.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `BA_UJI_ADMIN_${unwrappedParams.id}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          } else {
            console.error('Gagal generate dokumen BA HUA');
          }
        } catch (downloadErr) {
          console.error('Error saat download otomatis:', downloadErr);
        }

        setMessage('Uji Administrasi Berhasil Disimpan!');
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
      <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
        <div className="w-14 h-14 rounded-xl bg-teal-400 border-2 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a]">
          <ClipboardCheck size={28} className="text-slate-900" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">Input Uji Administrasi</h2>
          <p className="text-sm font-bold text-slate-600 mt-1 uppercase">TAHUN {doc.tahun || '2026'} | TAHAP 2: BA HUA</p>
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
            <p className="font-black bg-teal-300 text-slate-900 px-3 py-1 rounded border-2 border-slate-900 inline-block mt-1 text-sm shadow-[2px_2px_0_0_#0f172a]">
              #{String(doc.no_urut || doc.id).padStart(3, '0')} / {doc.tahun || '2026'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tanggal */}
          <div className="mb-8">
            <label className="block text-sm font-black text-slate-900 mb-2 uppercase">Tanggal BA Uji Administrasi <span className="text-rose-500">*</span></label>
            <input type="date" name="tanggal_uji_berkas" required defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full sm:w-1/3 bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-sm rounded-xl px-4 py-3 focus:bg-white focus:shadow-[4px_4px_0_0_#0f172a] transition-all outline-none cursor-pointer" />
          </div>

          {/* Checklist Uji NeoBrutalism */}
          <div className="mb-8">
            <h3 className="text-sm font-black text-slate-900 mb-4 uppercase flex items-center gap-2 bg-teal-200 inline-block px-4 py-2 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a]">
              <ListChecks size={18} /> Hasil Verifikasi Kelengkapan Administrasi
            </h3>
            <div className="overflow-x-auto rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] bg-white">
              <table className="w-full text-xs text-left text-slate-900 border-collapse">
                <thead className="bg-slate-200 text-slate-900 font-black border-b-4 border-slate-900">
                  <tr>
                    <th rowSpan={2} className="px-3 py-4 text-center border-r-2 border-slate-900 w-10 uppercase">NO</th>
                    <th rowSpan={2} className="px-3 py-4 border-r-2 border-slate-900 uppercase">KELENGKAPAN ADMINISTRASI</th>
                    <th colSpan={2} className="px-3 py-3 text-center border-r-2 border-slate-900 uppercase bg-emerald-100">KEBERADAAN</th>
                    <th colSpan={2} className="px-3 py-3 text-center border-r-2 border-slate-900 uppercase bg-blue-100">KESESUAIAN</th>
                    <th rowSpan={2} className="px-3 py-4 text-center uppercase">KETERANGAN</th>
                  </tr>
                  <tr className="border-t-2 border-slate-900 text-[10px] bg-slate-100 uppercase">
                    <th className="px-2 py-2 text-center border-r-2 border-slate-900 text-emerald-700 bg-emerald-200">Ada</th>
                    <th className="px-2 py-2 text-center border-r-2 border-slate-900 text-rose-700 bg-rose-200">Tdk Ada</th>
                    <th className="px-2 py-2 text-center border-r-2 border-slate-900 text-blue-700 bg-blue-200">Sesuai</th>
                    <th className="px-2 py-2 text-center border-r-2 border-slate-900 text-rose-700 bg-rose-200">Tdk Sesuai</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-900 font-bold">
                  {checklistItems.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-3 text-center border-r-2 border-slate-900 bg-slate-100">{index + 1}</td>
                      <td className="px-3 py-3 border-r-2 border-slate-900">{item}</td>
                      <td className="px-2 py-3 text-center border-r-2 border-slate-900 bg-emerald-50">
                        <input type="radio" name={`keberadaan[${index}]`} value="Ada" required className="w-5 h-5 text-emerald-500 border-2 border-slate-900 focus:ring-emerald-500 shadow-[1px_1px_0_0_#0f172a] cursor-pointer" />
                      </td>
                      <td className="px-2 py-3 text-center border-r-2 border-slate-900 bg-rose-50">
                        <input type="radio" name={`keberadaan[${index}]`} value="Tidak Ada" className="w-5 h-5 text-rose-500 border-2 border-slate-900 focus:ring-rose-500 shadow-[1px_1px_0_0_#0f172a] cursor-pointer" />
                      </td>
                      <td className="px-2 py-3 text-center border-r-2 border-slate-900 bg-blue-50">
                        <input type="radio" name={`kesesuaian[${index}]`} value="Sesuai" required className="w-5 h-5 text-blue-500 border-2 border-slate-900 focus:ring-blue-500 shadow-[1px_1px_0_0_#0f172a] cursor-pointer" />
                      </td>
                      <td className="px-2 py-3 text-center border-r-2 border-slate-900 bg-rose-50">
                        <input type="radio" name={`kesesuaian[${index}]`} value="Tidak Sesuai" className="w-5 h-5 text-rose-500 border-2 border-slate-900 focus:ring-rose-500 shadow-[1px_1px_0_0_#0f172a] cursor-pointer" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="text" name={`keterangan_uji[${index}]`} placeholder="..." className="w-full bg-white border-2 border-slate-900 rounded-lg px-3 py-2 text-xs focus:bg-slate-50 outline-none shadow-[2px_2px_0_0_#0f172a]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data Tambahan BA HUA */}
          <div className="mb-8 p-6 bg-slate-50 border-4 border-slate-900 rounded-2xl shadow-[4px_4px_0_0_#0f172a]">
            <h3 className="text-sm font-black text-slate-900 mb-6 uppercase flex items-center gap-2">
              <PenTool size={18} /> Data Tambahan BA HUA
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-black text-slate-900 mb-2 uppercase">Kewenangan</label>
                <input 
                  type="text" 
                  name="kewenangan" 
                  defaultValue={(() => { try { return (typeof doc.penandatangan_hua === 'string' ? JSON.parse(doc.penandatangan_hua) : doc.penandatangan_hua)?.kewenangan || 'Kabupaten'; } catch(e) { return 'Kabupaten'; }})()}
                  className="w-full bg-white border-2 border-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-slate-50 outline-none shadow-[2px_2px_0_0_#0f172a] font-bold" 
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-900 mb-2 uppercase">KBLI</label>
                <input 
                  type="text" 
                  name="kbli" 
                  placeholder="Contoh: 86105 (Aktivitas Klinik Swasta)"
                  defaultValue={(() => { try { return (typeof doc.penandatangan_hua === 'string' ? JSON.parse(doc.penandatangan_hua) : doc.penandatangan_hua)?.kbli || ''; } catch(e) { return ''; }})()}
                  className="w-full bg-white border-2 border-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-slate-50 outline-none shadow-[2px_2px_0_0_#0f172a] font-bold" 
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-black text-slate-900 mb-2 uppercase">Hasil Verifikasi Uji Administrasi</label>
              <select 
                name="hasil_verifikasi_uji" 
                defaultValue={(() => { try { return (typeof doc.penandatangan_hua === 'string' ? JSON.parse(doc.penandatangan_hua) : doc.penandatangan_hua)?.hasil_verifikasi_uji || ''; } catch(e) { return ''; }})()}
                className="w-full bg-white border-2 border-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-slate-50 outline-none shadow-[2px_2px_0_0_#0f172a] font-bold cursor-pointer appearance-none" 
              >
                <option value="" disabled>-- Pilih Hasil Verifikasi --</option>
                <option value="Diterima (Lengkap dan Dilanjutkan)">Diterima (Lengkap dan Dilanjutkan)</option>
                <option value="Dikembalikan untuk Diperbaiki">Dikembalikan untuk Diperbaiki</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 mb-2 uppercase">Catatan untuk Pemrakarsa / Konsultan</label>
              <textarea 
                name="catatan_uji_admin" 
                rows={4}
                placeholder={"1. Judul Peta dirubah...\n2. Titik koordinat ditambahkan..."}
                defaultValue={doc.keterangan || ''}
                className="w-full bg-white border-2 border-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-slate-50 outline-none shadow-[2px_2px_0_0_#0f172a] font-bold resize-y" 
              ></textarea>
              <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase">* Ketik menurun dengan angka untuk membuatnya menjadi list (1. ..., 2. ...)</p>
            </div>
          </div>

          {/* Tim Pemeriksa */}
          <div className="mb-8">
            <h3 className="text-sm font-black text-slate-900 mb-4 uppercase flex items-center gap-2 bg-indigo-200 inline-block px-4 py-2 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a]">
              <PenTool size={18} /> Tim Pemeriksa (BA HUA)
            </h3>
            <div className="bg-white border-4 border-slate-900 rounded-xl p-4 shadow-[4px_4px_0_0_#0f172a] max-h-60 overflow-y-auto">
              {daftarPegawai.length === 0 ? (
                <p className="text-sm font-bold text-slate-500">Belum ada data pegawai.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {daftarPegawai.map((pegawai) => {
                    let isChecked = false;
                    try {
                      if (doc.penandatangan_uji_admin) {
                        const parsed = JSON.parse(doc.penandatangan_uji_admin);
                        if (parsed.includes(pegawai.id.toString())) isChecked = true;
                      }
                    } catch(e) {}
                    
                    return (
                      <label key={pegawai.id} className="flex items-start gap-3 p-3 border-2 border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          name="penandatangan[]" 
                          value={pegawai.id}
                          defaultChecked={isChecked}
                          className="mt-1 w-5 h-5 text-indigo-500 border-2 border-slate-900 rounded focus:ring-indigo-500 shadow-[1px_1px_0_0_#0f172a]" 
                        />
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase leading-tight">{pegawai.nama}</p>
                          <p className="text-xs font-bold text-slate-500 mt-0.5">{pegawai.jabatan || 'Staf'}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-8 border-t-4 border-slate-900 mt-8">
            <button type="submit" disabled={submitting} className="w-full sm:w-auto px-10 py-4 bg-teal-400 hover:bg-teal-300 text-slate-900 font-black rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 tracking-widest uppercase text-sm disabled:opacity-70 disabled:hover:translate-y-0">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Simpan BA HUA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
