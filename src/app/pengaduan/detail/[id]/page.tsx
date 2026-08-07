'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, FileText, CheckCircle2, Clock, User, MapPin, ExternalLink, Download, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { use } from 'react';
import LottieLoader from '@/components/LottieLoader';

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
      if ((fetch as any).ket_foto1) setKetFoto1((fetch as any).ket_foto1);
      if ((fetch as any).ket_foto2) setKetFoto2((fetch as any).ket_foto2);
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

      let fotosToPass = Array.isArray(data.foto_verlap_list) ? [...data.foto_verlap_list] : [];
      if (foto1_url) fotosToPass.push({ url: foto1_url, keterangan: ketFoto1 });
      if (foto2_url) fotosToPass.push({ url: foto2_url, keterangan: ketFoto2 });

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
          fotos: fotosToPass,
          catatan_verlap: data.catatan_verlap || '',
          hasil_verlap: data.hasil_verlap || ''
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
        <LottieLoader size={24} />
        <h2 className="text-xl font-bold text-on-surface uppercase">Memuat Data...</h2>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <h2 className="text-2xl font-bold text-rose-900 uppercase mb-4">Error</h2>
        <p className="font-bold text-on-error-container">{errorMsg}</p>
        <Link href="/pengaduan" className="mt-8 inline-block px-6 py-3 bg-primary text-on-primary text-on-primary font-bold rounded-xl uppercase">Kembali</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8 px-4 pb-20">
      <Link href="/pengaduan" className="inline-flex items-center gap-2 text-sm text-on-surface font-bold transition-all bg-surface border border-outline-variant px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow uppercase tracking-wide">
        <ArrowLeft size={16} /> Kembali ke Daftar
      </Link>

      <div className="bg-surface border border-outline-variant rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        
        {/* HEADER */}
        <div className="bg-primary text-on-primary p-8 text-on-primary relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-purple-500 text-on-primary font-bold text-xs px-3 py-1 rounded-full uppercase tracking-widest border border-purple-200">
                  TIKET PENGADUAN
                </span>
                <span className="bg-slate-800 text-slate-300 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200 flex items-center gap-1">
                  <Clock size={12} /> {new Date(data.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold uppercase leading-tight mb-1">{data.perihal}</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2 mt-2">
                Token Akses: <span className="text-on-primary bg-slate-800 px-2 py-1 rounded font-mono">{data.token}</span>
              </p>
            </div>

            <div className="bg-surface text-on-surface p-6 rounded-2xl border border-outline-variant shrink-0 text-center shadow-sm transform md:rotate-2">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Status Saat Ini</p>
              {data.status_tahapan === 'Menunggu Isian' ? (
                <div className="flex items-center gap-2 justify-center text-tertiary">
                  <Clock size={24} />
                  <span className="font-bold text-lg uppercase">Menunggu Pelapor</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center text-secondary">
                  <CheckCircle2 size={24} />
                  <span className="font-bold text-lg uppercase">Formulir Terisi</span>
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
                <h3 className="flex items-center gap-2 text-lg font-bold text-on-surface border-b-4 border-outline-variant pb-2 uppercase tracking-tight mb-4">
                  <User size={20} className="text-purple-600" /> Identitas Pelapor
                </h3>
                <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-5 space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Nama Pelapor</p>
                    <p className="font-bold text-on-surface text-lg">{data.nama_pelapor || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Kontak (Telp/WA)</p>
                    <p className="font-bold text-on-surface text-lg">{data.telp_pelapor || '-'}</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-on-surface border-b-4 border-outline-variant pb-2 uppercase tracking-tight mb-4">
                  <MapPin size={20} className="text-purple-600" /> Detail Kasus
                </h3>
                <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-5 space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Pihak Terlapor</p>
                    <p className="font-bold text-on-surface text-lg">{data.nama_terlapor || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Lokasi Kejadian</p>
                    <p className="font-bold text-on-surface text-base">{data.lokasi_aduan || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Deskripsi / Kronologi</p>
                    <p className="font-bold text-on-surface text-sm whitespace-pre-wrap leading-relaxed border-l-4 border-purple-400 pl-4 py-1 mt-1 bg-surface">{data.deskripsi || '-'}</p>
                  </div>
                </div>
              </section>
            </div>

            {/* KOLOM KANAN */}
            <div className="space-y-8">
              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-on-surface border-b-4 border-outline-variant pb-2 uppercase tracking-tight mb-4">
                  <FileText size={20} className="text-purple-600" /> Dokumen & Lampiran
                </h3>
                <div className="space-y-4">
                  
                  <div className="border-2 border-outline-variant rounded-xl p-4 flex items-center justify-between bg-surface-container-lowest">
                    <div>
                      <p className="font-bold text-on-surface uppercase">Dokumentasi Pelapor</p>
                      <p className="text-xs font-bold text-on-surface-variant">Diunggah saat mengisi form</p>
                    </div>
                    {data.dokumentasi_url ? (
                      <a href={data.dokumentasi_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 font-bold text-xs uppercase tracking-widest rounded-lg transition-colors border border-purple-200">
                        Lihat <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 bg-surface-container px-3 py-1 rounded-lg">Belum Ada</span>
                    )}
                  </div>

                  <div className="border-2 border-outline-variant rounded-xl p-4 flex items-center justify-between bg-surface-container-lowest">
                    <div>
                      <p className="font-bold text-on-surface uppercase">Berita Acara (BA)</p>
                      <p className="text-xs font-bold text-on-surface-variant">Arsip akhir penanganan aduan</p>
                    </div>
                    {data.ba_url ? (
                      <a href={data.ba_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-900 font-bold text-xs uppercase tracking-widest rounded-lg transition-colors border border-blue-200">
                        Lihat <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 bg-surface-container px-3 py-1 rounded-lg">Belum Ada</span>
                    )}
                  </div>

                </div>
              </section>

              <section className="bg-purple-50 border border-purple-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center mx-auto text-purple-600 border-4 border-white shadow-inner">
                  <Download size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-purple-900 uppercase">Generate Surat Tugas</h4>
                  <p className="text-xs font-bold text-purple-700 mt-1 px-4">Buat dokumen tindak lanjut dengan penomoran otomatis dari Buku Register Nota Dinas.</p>
                </div>
                <button 
                  onClick={() => setShowGenerateModal(true)}
                  className="w-full py-4 bg-purple-500 hover:bg-purple-600 hover:-translate-y-1 transition-all text-on-primary font-bold uppercase tracking-widest text-sm rounded-xl border border-purple-200 shadow-sm hover:shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary text-on-primary/50 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant rounded-2xl p-0 shadow-sm hover:shadow-md transition-shadow max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b-4 border-outline-variant bg-purple-100">
              <div>
                <h3 className="text-2xl font-bold text-on-surface uppercase">Generate Surat Tindak Lanjut</h3>
                <p className="text-xs font-bold text-on-surface-variant uppercase mt-1">Nomor otomatis akan ditarik dari Arsip Nota Dinas</p>
              </div>
              <button 
                onClick={() => setShowGenerateModal(false)}
                className="w-10 h-10 bg-surface border border-outline-variant rounded-xl flex items-center justify-center hover:bg-error-container text-on-error-container hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all"
              >
                <X size={20} className="text-on-surface" />
              </button>
            </div>
            
            <form onSubmit={handleGenerateSurat} className="p-6 overflow-y-auto space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-widest">Sifat Surat</label>
                  <select 
                    value={suratData.sifat}
                    onChange={(e) => setSuratData({...suratData, sifat: e.target.value})}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-sm font-bold text-on-surface focus:outline-none focus:ring-4 focus:ring-purple-500/20"
                  >
                    <option value="Biasa">Biasa</option>
                    <option value="Terbatas">Terbatas</option>
                    <option value="Rahasia">Rahasia</option>
                    <option value="Sangat Rahasia">Sangat Rahasia</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-widest">Lampiran</label>
                  <input 
                    type="text" 
                    value={suratData.lampiran}
                    onChange={(e) => setSuratData({...suratData, lampiran: e.target.value})}
                    className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm font-bold text-on-surface focus:outline-none focus:ring-4 focus:ring-purple-500/20"
                    placeholder="Contoh: 1 (satu) berkas"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-widest">Tujuan (Yth.)</label>
                <input 
                  type="text" 
                  value={suratData.yth}
                  onChange={(e) => setSuratData({...suratData, yth: e.target.value})}
                  required
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm font-bold text-on-surface focus:outline-none focus:ring-4 focus:ring-purple-500/20"
                  placeholder="Contoh: Asisten II (Perekonomian dan Pembangunan)"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-widest">Dari</label>
                <input 
                  type="text" 
                  value={suratData.dari}
                  onChange={(e) => setSuratData({...suratData, dari: e.target.value})}
                  required
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm font-bold text-on-surface focus:outline-none focus:ring-4 focus:ring-purple-500/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-widest">Perihal (Hal)</label>
                <textarea 
                  value={suratData.hal}
                  onChange={(e) => setSuratData({...suratData, hal: e.target.value})}
                  required
                  rows={2}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm font-bold text-on-surface focus:outline-none focus:ring-4 focus:ring-purple-500/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface uppercase tracking-widest">Tembusan</label>
                <textarea 
                  value={suratData.tembusan}
                  onChange={(e) => setSuratData({...suratData, tembusan: e.target.value})}
                  rows={2}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm font-bold text-on-surface focus:outline-none focus:ring-4 focus:ring-purple-500/20"
                  placeholder="Contoh: Kepala Kepolisian Resor Sragen Polda Jateng"
                />
              </div>

              {/* TIM PETUGAS */}
              <div className="pt-4 border-t-4 border-dashed border-outline-variant">
                <label className="text-sm font-bold text-on-surface uppercase tracking-widest mb-3 block">Yang Melaksanakan Tugas</label>
                <div className="space-y-3">
                  {petugas.map((p, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="w-10 h-10 bg-surface-container-low border border-outline-variant rounded-xl flex items-center justify-center font-bold text-on-surface-variant shrink-0">
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
                        className="flex-1 bg-surface border border-outline-variant rounded-xl px-4 py-2 text-sm font-bold text-on-surface focus:outline-none focus:ring-4 focus:ring-purple-500/20"
                        placeholder="Nama Petugas"
                      />
                      {petugas.length > 1 && (
                        <button type="button" onClick={() => setPetugas(petugas.filter((_, i) => i !== index))} className="w-10 h-10 bg-error-container text-on-error-container text-error border border-outline-variant rounded-xl flex items-center justify-center hover:bg-rose-200 transition-colors">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setPetugas([...petugas, ''])} className="w-full py-2 bg-surface-container-low border-2 border-dashed border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant uppercase hover:bg-surface-container transition-colors">
                    + Tambah Petugas
                  </button>
                </div>
              </div>

              {/* DOKUMENTASI FOTO */}
              <div className="pt-4 border-t-4 border-dashed border-outline-variant">
                <label className="text-sm font-bold text-on-surface uppercase tracking-widest mb-3 block">Dokumentasi Lapangan</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Foto 1 */}
                  <div className="bg-surface-container-lowest p-4 border border-outline-variant rounded-xl space-y-3">
                    <p className="text-xs font-bold text-on-surface-variant uppercase text-center">Foto 1</p>
                    <label className="block w-full border-2 border-dashed border-slate-400 bg-surface rounded-lg p-4 text-center cursor-pointer hover:bg-purple-50 hover:border-purple-400 transition-colors">
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
                      className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  {/* Foto 2 */}
                  <div className="bg-surface-container-lowest p-4 border border-outline-variant rounded-xl space-y-3">
                    <p className="text-xs font-bold text-on-surface-variant uppercase text-center">Foto 2</p>
                    <label className="block w-full border-2 border-dashed border-slate-400 bg-surface rounded-lg p-4 text-center cursor-pointer hover:bg-purple-50 hover:border-purple-400 transition-colors">
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
                      className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                </div>
              </div>

              <div className="pt-4 border-t-2 border-outline-variant flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-5 py-4 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-bold text-on-surface uppercase hover:bg-surface-container transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isGenerating}
                  className="flex-[2] px-5 py-4 bg-purple-400 border border-outline-variant rounded-xl text-sm font-bold text-on-surface uppercase shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm hover:shadow-md transition-shadow flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <><LottieLoader size={24} /> Memproses...</>
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
