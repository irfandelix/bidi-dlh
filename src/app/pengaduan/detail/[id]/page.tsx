'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, FileText, CheckCircle2, Clock, User, MapPin, ExternalLink, Download, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { use } from 'react';

const supabase = createClient();

export default function DetailPengaduanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suratData, setSuratData] = useState({
    yth: '',
    dari: 'Kepala Dinas Lingkungan Hidup Kabupaten Sragen',
    tembusan: '',
    hal: 'Tindak Lanjut Pengaduan Masyarakat',
    sifat: 'Biasa',
    lampiran: '-'
  });
  const [petugas, setPetugas] = useState<string[]>(['']);
  const [foto1, setFoto1] = useState<File | null>(null);
  const [ketFoto1, setKetFoto1] = useState('');
  const [foto2, setFoto2] = useState<File | null>(null);
  const [ketFoto2, setKetFoto2] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function fetchData() {
    const { data: fetch, error } = await supabase
      .from('pengaduans')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !fetch) {
      setErrorMsg('Data tiket pengaduan tidak ditemukan.');
    } else {
      setData(fetch);
      setSuratData(prev => ({ ...prev, hal: `Hasil Tindak Lanjut Aduan Masyarakat terkait ${(fetch as any).perihal}` }));
    }
  }

  useEffect(() => {
    async function loadData() {
      await fetchData();
      setLoading(false);
    }
    loadData();
  }, [id]);

  const handleGenerateSurat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      // Upload photos first if they exist
      let foto1_url = '';
      let foto2_url = '';

      if (foto1) {
        const fd = new FormData();
        fd.append('file', foto1);
        fd.append('folderName', data.nama_terlapor || 'Surat');
        const r1 = await fetch('/api/pengaduan/upload', { method: 'POST', body: fd });
        const d1 = await r1.json();
        if (d1.error) throw new Error('Gagal upload foto 1: ' + d1.error);
        foto1_url = d1.url;
      }

      if (foto2) {
        const fd = new FormData();
        fd.append('file', foto2);
        fd.append('folderName', data.nama_terlapor || 'Surat');
        const r2 = await fetch('/api/pengaduan/upload', { method: 'POST', body: fd });
        const d2 = await r2.json();
        if (d2.error) throw new Error('Gagal upload foto 2: ' + d2.error);
        foto2_url = d2.url;
      }

      const response = await fetch('/api/pengaduan/generate-surat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id,
          ...suratData,
          kegiatan_aduan: data.perihal || '',
          nama_terlapor: data.nama_terlapor || '',
          lokasi_aduan: data.lokasi_aduan || '',
          deskripsi_aduan: data.deskripsi || '',
          petugas: petugas.filter(p => p.trim() !== ''),
          foto1_url,
          foto2_url,
          ket1: ketFoto1,
          ket2: ketFoto2
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Gagal generate surat');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'Surat_Tindak_Lanjut.docx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      setShowGenerateModal(false);
      alert('Surat berhasil dibuat dan diunduh. Nomor urut otomatis terbooking di Arsip Nota Dinas!');
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-slate-900 animate-spin mb-4" />
        <h2 className="text-xl font-black text-slate-900 uppercase">Memuat Data...</h2>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <h2 className="text-2xl font-black text-rose-900 uppercase mb-4">Error</h2>
        <p className="font-bold text-rose-800">{errorMsg}</p>
        <Link href="/pengaduan" className="mt-8 inline-block px-6 py-3 bg-slate-900 text-white font-black rounded-xl uppercase">Kembali</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8 px-4 pb-20">
      <Link href="/pengaduan" className="inline-flex items-center gap-2 text-sm text-slate-900 font-black transition-all bg-white border-2 border-slate-900 px-4 py-2 rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Daftar
      </Link>

      <div className="bg-white border-4 border-slate-900 rounded-3xl overflow-hidden shadow-[12px_12px_0_0_#0f172a]">
        
        {/* HEADER */}
        <div className="bg-slate-900 p-8 text-white relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-purple-500 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-widest border-2 border-purple-300">
                  TIKET PENGADUAN
                </span>
                <span className="bg-slate-800 text-slate-300 font-black text-xs px-3 py-1 rounded-full uppercase tracking-widest border-2 border-slate-700 flex items-center gap-1">
                  <Clock size={12} /> {new Date(data.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black uppercase leading-tight mb-1">{data.perihal}</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2 mt-2">
                Token Akses: <span className="text-white bg-slate-800 px-2 py-1 rounded font-mono">{data.token}</span>
              </p>
            </div>

            <div className="bg-white text-slate-900 p-6 rounded-2xl border-4 border-slate-200 shrink-0 text-center shadow-[4px_4px_0_0_#cbd5e1] transform md:rotate-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Status Saat Ini</p>
              {data.status_tahapan === 'Menunggu Isian' ? (
                <div className="flex items-center gap-2 justify-center text-amber-600">
                  <Clock size={24} />
                  <span className="font-black text-lg uppercase">Menunggu Pelapor</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center text-emerald-600">
                  <CheckCircle2 size={24} />
                  <span className="font-black text-lg uppercase">Formulir Terisi</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-8 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* KOLOM KIRI */}
            <div className="space-y-8">
              <section>
                <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 border-b-4 border-slate-900 pb-2 uppercase tracking-tight mb-4">
                  <User size={20} className="text-purple-600" /> Identitas Pelapor
                </h3>
                <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-5 space-y-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Nama Pelapor</p>
                    <p className="font-bold text-slate-900 text-lg">{data.nama_pelapor || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Kontak (Telp/WA)</p>
                    <p className="font-bold text-slate-900 text-lg">{data.telp_pelapor || '-'}</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 border-b-4 border-slate-900 pb-2 uppercase tracking-tight mb-4">
                  <MapPin size={20} className="text-purple-600" /> Detail Kasus
                </h3>
                <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-5 space-y-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Pihak Terlapor</p>
                    <p className="font-bold text-slate-900 text-lg">{data.nama_terlapor || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Lokasi Kejadian</p>
                    <p className="font-bold text-slate-900 text-base">{data.lokasi_aduan || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Deskripsi / Kronologi</p>
                    <p className="font-bold text-slate-900 text-sm whitespace-pre-wrap leading-relaxed border-l-4 border-purple-400 pl-4 py-1 mt-1 bg-white">{data.deskripsi || '-'}</p>
                  </div>
                </div>
              </section>
            </div>

            {/* KOLOM KANAN */}
            <div className="space-y-8">
              <section>
                <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 border-b-4 border-slate-900 pb-2 uppercase tracking-tight mb-4">
                  <FileText size={20} className="text-purple-600" /> Dokumen & Lampiran
                </h3>
                <div className="space-y-4">
                  
                  <div className="border-2 border-slate-200 rounded-xl p-4 flex items-center justify-between bg-slate-50">
                    <div>
                      <p className="font-black text-slate-900 uppercase">Dokumentasi Pelapor</p>
                      <p className="text-xs font-bold text-slate-500">Diunggah saat mengisi form</p>
                    </div>
                    {data.dokumentasi_url ? (
                      <a href={data.dokumentasi_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 font-black text-xs uppercase tracking-widest rounded-lg transition-colors border-2 border-purple-300">
                        Lihat <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-xs font-black text-slate-400 bg-slate-200 px-3 py-1 rounded-lg">Belum Ada</span>
                    )}
                  </div>

                  <div className="border-2 border-slate-200 rounded-xl p-4 flex items-center justify-between bg-slate-50">
                    <div>
                      <p className="font-black text-slate-900 uppercase">Berita Acara (BA)</p>
                      <p className="text-xs font-bold text-slate-500">Arsip akhir penanganan aduan</p>
                    </div>
                    {data.ba_url ? (
                      <a href={data.ba_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-900 font-black text-xs uppercase tracking-widest rounded-lg transition-colors border-2 border-blue-300">
                        Lihat <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-xs font-black text-slate-400 bg-slate-200 px-3 py-1 rounded-lg">Belum Ada</span>
                    )}
                  </div>

                </div>
              </section>

              <section className="bg-purple-50 border-4 border-purple-200 rounded-2xl p-6 text-center space-y-4 shadow-[4px_4px_0_0_#d8b4fe]">
                <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center mx-auto text-purple-600 border-4 border-white shadow-inner">
                  <Download size={28} />
                </div>
                <div>
                  <h4 className="font-black text-lg text-purple-900 uppercase">Generate Surat Tugas</h4>
                  <p className="text-xs font-bold text-purple-700 mt-1 px-4">Buat dokumen tindak lanjut dengan penomoran otomatis dari Buku Register Nota Dinas.</p>
                </div>
                <button 
                  onClick={() => setShowGenerateModal(true)}
                  className="w-full py-4 bg-purple-500 hover:bg-purple-600 hover:-translate-y-1 transition-all text-white font-black uppercase tracking-widest text-sm rounded-xl border-4 border-purple-700 shadow-[4px_4px_0_0_#581c87] hover:shadow-[2px_2px_0_0_#581c87]"
                >
                  Generate Surat
                </button>
              </section>

            </div>
          </div>
          
        </div>
      </div>

      {/* Generate Surat Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border-4 border-slate-900 rounded-2xl p-0 shadow-[8px_8px_0_0_#0f172a] max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b-4 border-slate-900 bg-purple-100">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase">Generate Surat Tindak Lanjut</h3>
                <p className="text-xs font-bold text-slate-600 uppercase mt-1">Nomor otomatis akan ditarik dari Arsip Nota Dinas</p>
              </div>
              <button 
                onClick={() => setShowGenerateModal(false)}
                className="w-10 h-10 bg-white border-2 border-slate-900 rounded-xl flex items-center justify-center hover:bg-rose-100 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#0f172a] transition-all"
              >
                <X size={20} className="text-slate-900" />
              </button>
            </div>
            
            <form onSubmit={handleGenerateSurat} className="p-6 overflow-y-auto space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-widest">Sifat Surat</label>
                  <select 
                    value={suratData.sifat}
                    onChange={(e) => setSuratData({...suratData, sifat: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-purple-500/20"
                  >
                    <option value="Biasa">Biasa</option>
                    <option value="Terbatas">Terbatas</option>
                    <option value="Rahasia">Rahasia</option>
                    <option value="Sangat Rahasia">Sangat Rahasia</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-widest">Lampiran</label>
                  <input 
                    type="text" 
                    value={suratData.lampiran}
                    onChange={(e) => setSuratData({...suratData, lampiran: e.target.value})}
                    className="w-full bg-white border-2 border-slate-900 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-purple-500/20"
                    placeholder="Contoh: 1 (satu) berkas"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 uppercase tracking-widest">Tujuan (Yth.)</label>
                <input 
                  type="text" 
                  value={suratData.yth}
                  onChange={(e) => setSuratData({...suratData, yth: e.target.value})}
                  required
                  className="w-full bg-white border-2 border-slate-900 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-purple-500/20"
                  placeholder="Contoh: Asisten II (Perekonomian dan Pembangunan)"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 uppercase tracking-widest">Dari</label>
                <input 
                  type="text" 
                  value={suratData.dari}
                  onChange={(e) => setSuratData({...suratData, dari: e.target.value})}
                  required
                  className="w-full bg-white border-2 border-slate-900 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-purple-500/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 uppercase tracking-widest">Perihal (Hal)</label>
                <textarea 
                  value={suratData.hal}
                  onChange={(e) => setSuratData({...suratData, hal: e.target.value})}
                  required
                  rows={2}
                  className="w-full bg-white border-2 border-slate-900 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-purple-500/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 uppercase tracking-widest">Tembusan</label>
                <textarea 
                  value={suratData.tembusan}
                  onChange={(e) => setSuratData({...suratData, tembusan: e.target.value})}
                  rows={2}
                  className="w-full bg-white border-2 border-slate-900 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-purple-500/20"
                  placeholder="Contoh: Kepala Kepolisian Resor Sragen Polda Jateng"
                />
              </div>

              {/* TIM PETUGAS */}
              <div className="pt-4 border-t-4 border-dashed border-slate-200">
                <label className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3 block">Yang Melaksanakan Tugas</label>
                <div className="space-y-3">
                  {petugas.map((p, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="w-10 h-10 bg-slate-100 border-2 border-slate-900 rounded-xl flex items-center justify-center font-black text-slate-500 shrink-0">
                        {index + 1}
                      </div>
                      <input 
                        type="text" 
                        value={p}
                        onChange={(e) => {
                          const newPetugas = [...petugas];
                          newPetugas[index] = e.target.value;
                          setPetugas(newPetugas);
                        }}
                        className="flex-1 bg-white border-2 border-slate-900 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-purple-500/20"
                        placeholder="Nama Petugas"
                      />
                      {petugas.length > 1 && (
                        <button type="button" onClick={() => setPetugas(petugas.filter((_, i) => i !== index))} className="w-10 h-10 bg-rose-100 text-rose-600 border-2 border-slate-900 rounded-xl flex items-center justify-center hover:bg-rose-200 transition-colors">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setPetugas([...petugas, ''])} className="w-full py-2 bg-slate-100 border-2 border-dashed border-slate-900 rounded-xl text-xs font-black text-slate-600 uppercase hover:bg-slate-200 transition-colors">
                    + Tambah Petugas
                  </button>
                </div>
              </div>

              {/* DOKUMENTASI FOTO */}
              <div className="pt-4 border-t-4 border-dashed border-slate-200">
                <label className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3 block">Dokumentasi Lapangan</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Foto 1 */}
                  <div className="bg-slate-50 p-4 border-2 border-slate-900 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase text-center">Foto 1</p>
                    <label className="block w-full border-2 border-dashed border-slate-400 bg-white rounded-lg p-4 text-center cursor-pointer hover:bg-purple-50 hover:border-purple-400 transition-colors">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setFoto1(e.target.files?.[0] || null)} />
                      {foto1 ? (
                        <div className="text-xs font-bold text-purple-600 truncate">{foto1.name}</div>
                      ) : (
                        <div className="text-xs font-bold text-slate-400">Pilih Foto 1...</div>
                      )}
                    </label>
                    <input 
                      type="text" 
                      value={ketFoto1}
                      onChange={(e) => setKetFoto1(e.target.value)}
                      placeholder="Keterangan Foto 1"
                      className="w-full bg-white border-2 border-slate-900 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  {/* Foto 2 */}
                  <div className="bg-slate-50 p-4 border-2 border-slate-900 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase text-center">Foto 2</p>
                    <label className="block w-full border-2 border-dashed border-slate-400 bg-white rounded-lg p-4 text-center cursor-pointer hover:bg-purple-50 hover:border-purple-400 transition-colors">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setFoto2(e.target.files?.[0] || null)} />
                      {foto2 ? (
                        <div className="text-xs font-bold text-purple-600 truncate">{foto2.name}</div>
                      ) : (
                        <div className="text-xs font-bold text-slate-400">Pilih Foto 2...</div>
                      )}
                    </label>
                    <input 
                      type="text" 
                      value={ketFoto2}
                      onChange={(e) => setKetFoto2(e.target.value)}
                      placeholder="Keterangan Foto 2"
                      className="w-full bg-white border-2 border-slate-900 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                </div>
              </div>

              <div className="pt-4 border-t-2 border-slate-200 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-5 py-4 bg-slate-100 border-2 border-slate-900 rounded-xl text-sm font-black text-slate-900 uppercase hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isGenerating}
                  className="flex-[2] px-5 py-4 bg-purple-400 border-2 border-slate-900 rounded-xl text-sm font-black text-slate-900 uppercase shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_#0f172a] flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <><Loader2 className="animate-spin" size={20} /> Memproses...</>
                  ) : (
                    <><Download size={20} /> Generate DOCX</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
