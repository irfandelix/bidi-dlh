'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Printer, Loader2, ArrowLeft, FileText, CheckCircle } from 'lucide-react';
import LottieLoader from '@/components/LottieLoader';

export default function CetakClient({ doc }: { doc: any }) {
  const router = useRouter();
  const [downloading, setDownloading] = useState<string | null>(null);

  const isAmdalnet = !!doc.nomor_registrasi_amdalnet || (() => {
    try {
      if (!doc.extra_data) return false;
      const extra = typeof doc.extra_data === 'string' ? JSON.parse(doc.extra_data) : doc.extra_data;
      return !!extra?.is_amdalnet;
    } catch { return false; }
  })();

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleDownload = async (type: string, stage: string, targetRevisi?: number) => {
    const downloadKey = targetRevisi ? `${type}_${targetRevisi}` : type;
    setDownloading(downloadKey);
    try {
      const payload = { id: doc.id, type, stage, target_revisi: targetRevisi };
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Gagal generate dokumen');
      
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      let filename = `${type}_${doc.id}.docx`;
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-tertiary text-on-tertiary border border-outline-variant flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
            <Printer className="w-8 h-8 text-on-surface" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-on-surface uppercase">Pusat Cetak Dokumen</h2>
            <p className="text-sm font-bold text-on-surface-variant mt-1 uppercase">Pengarsipan & Pencetakan Berkas Fisik</p>
          </div>
        </div>
        <Link href="/perizinan/daftar" className="px-5 py-2.5 bg-surface-container hover:bg-slate-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center gap-2 uppercase">
          <ArrowLeft size={18} /> Kembali
        </Link>
      </div>

      {/* Info Dokumen */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div>
            <div className="bg-indigo-200 text-on-surface text-xs font-bold px-3 py-1 rounded uppercase border border-outline-variant shadow-sm hover:shadow-md transition-shadow inline-block mb-3">
              NO URUT: #{String(doc.no_urut || doc.id).padStart(3, '0')}/{doc.tahun}
            </div>
            <h3 className="text-xl font-bold text-on-surface uppercase">{doc.nama_kegiatan}</h3>
            <p className="text-sm font-bold text-on-surface-variant mt-1">{doc.nama_pemrakarsa} &bull; {doc.jenis_dokumen}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-on-surface-variant uppercase">Status Saat Ini</p>
            <p className="text-sm font-bold text-primary uppercase bg-surface border border-outline-variant px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-shadow mt-1 inline-block">
              {doc.status_tahapan}
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Riwayat Informasi Dokumen */}
      <div className="bg-surface border border-outline-variant rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-8">
        <div className="bg-primary text-on-primary px-6 py-4">
          <h4 className="text-lg font-bold text-on-primary uppercase">Riwayat & Detail Dokumen Lengkap</h4>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <tbody className="divide-y-2 divide-slate-200">
              
              {/* Data Pemrakarsa & Kegiatan */}
              <tr className="bg-surface-container-low">
                <td colSpan={2} className="py-2 px-6 font-bold text-on-surface text-xs uppercase tracking-wider">Data Pemrakarsa & Kegiatan</td>
              </tr>
              <tr className="hover:bg-surface-container-lowest">
                <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs">Identitas Pemrakarsa</th>
                <td className="py-3 px-6 font-bold text-on-surface text-sm">
                  Pemrakarsa: {doc.nama_pemrakarsa || '-'} <br/>
                  Nama Usaha/PT: {doc.nama_usaha || '-'} <br/>
                  No. Telepon: {doc.no_telp_pemrakarsa || '-'}
                </td>
              </tr>
              <tr className="hover:bg-surface-container-lowest">
                <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs">Informasi Kegiatan</th>
                <td className="py-3 px-6 font-bold text-on-surface text-sm">
                  Kegiatan: {doc.nama_kegiatan || '-'} <br/>
                  Lokasi: {doc.lokasi_kegiatan || '-'}
                </td>
              </tr>

              {/* Tahap Registrasi */}
              <tr className="bg-surface-container-low">
                <td colSpan={2} className="py-2 px-6 font-bold text-on-surface text-xs uppercase tracking-wider">Tahap Registrasi</td>
              </tr>
              {doc.nomor_surat_permohonan && (
                <tr className="hover:bg-surface-container-lowest">
                  <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs">Surat Permohonan</th>
                  <td className="py-3 px-6 font-bold text-on-surface text-sm">
                    No: {doc.nomor_surat_permohonan} <br/>
                    Tgl: {formatDate(doc.tanggal_surat_permohonan)} <br/>
                    Perihal: {doc.perihal_surat_permohonan || '-'}
                  </td>
                </tr>
              )}
              <tr className="hover:bg-surface-container-lowest">
                <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs">Checklist Dokumen Masuk</th>
                <td className="py-3 px-6 font-bold text-on-surface text-sm">
                  {doc.nomor_checklist ? `No: ${doc.nomor_checklist}` : '-'} <br/>
                  Tgl Masuk: {formatDate(doc.tanggal_masuk_dokumen)}
                </td>
              </tr>

              {/* Tahap Proses */}
              {(doc.nomor_uji_berkas || doc.nomor_ba_verlap || doc.nomor_ba_pemeriksaan) && (
                <tr className="bg-surface-container-low">
                  <td colSpan={2} className="py-2 px-6 font-bold text-on-surface text-xs uppercase tracking-wider">Tahap Proses & Pemeriksaan</td>
                </tr>
              )}
              {doc.nomor_uji_berkas && (
                <tr className="hover:bg-surface-container-lowest">
                  <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs">Uji Administrasi</th>
                  <td className="py-3 px-6 font-bold text-on-surface text-sm">{doc.nomor_uji_berkas} <br/> Tgl: {formatDate(doc.tanggal_uji_berkas)}</td>
                </tr>
              )}
              {doc.nomor_ba_verlap && (
                <tr className="hover:bg-surface-container-lowest">
                  <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs">Verifikasi Lapangan</th>
                  <td className="py-3 px-6 font-bold text-on-surface text-sm">{doc.nomor_ba_verlap} <br/> Tgl: {formatDate(doc.tanggal_verlap)}</td>
                </tr>
              )}
              {doc.nomor_ba_pemeriksaan && (
                <tr className="hover:bg-surface-container-lowest">
                  <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs">Pemeriksaan Substansi</th>
                  <td className="py-3 px-6 font-bold text-on-surface text-sm">{doc.nomor_ba_pemeriksaan} <br/> Tgl: {formatDate(doc.tanggal_pemeriksaan)}</td>
                </tr>
              )}
              {doc.tanggal_pengembalian && (
                <tr className="hover:bg-surface-container-lowest bg-red-50/50">
                  <th className="py-3 px-6 font-bold text-red-700 w-1/3 uppercase text-xs">Pengembalian Revisi</th>
                  <td className="py-3 px-6 font-bold text-red-900 text-sm">Tgl: {formatDate(doc.tanggal_pengembalian)}</td>
                </tr>
              )}
              
              {/* Revisi 1 - 5 */}
              {(doc.nomor_php || doc.nomor_revisi_1) && (
                <tr className="bg-primary-container text-on-primary-container">
                  <td colSpan={2} className="py-2 px-6 font-bold text-indigo-900 text-xs uppercase tracking-wider">Tahap Perbaikan (Revisi)</td>
                </tr>
              )}
              {[1, 2, 3, 4, 5].map((rev) => {
                const phpNum = rev === 1 ? doc.nomor_php : doc[`nomor_php${rev}`];
                const phpDate = doc[`tanggal_php_${rev}`];
                const baNum = doc[`nomor_revisi_${rev}`];
                const baDate = doc[`tanggal_revisi_${rev}`];
                
                if (!phpNum && !baNum) return null;
                
                return (
                  <tr key={rev} className="hover:bg-surface-container-lowest bg-primary-container/30">
                    <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs">Revisi Putaran {rev}</th>
                    <td className="py-3 px-6 font-bold text-on-surface text-sm">
                      <div className="flex flex-col gap-1">
                        {phpNum && (
                          <div className="flex justify-between items-start border-b border-indigo-100 pb-1">
                            <span className="text-primary">PHP: {phpNum}</span>
                            <span className="text-xs bg-surface px-2 py-0.5 rounded border border-outline-variant ml-4 shrink-0">{formatDate(phpDate)}</span>
                          </div>
                        )}
                        {baNum && (
                          <div className="flex justify-between items-start pt-1">
                            <span className="text-emerald-700">BA: {baNum}</span>
                            <span className="text-xs bg-surface px-2 py-0.5 rounded border border-outline-variant ml-4 shrink-0">{formatDate(baDate)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Finalisasi */}
              {(doc.nomor_risalah || doc.nomor_sk || doc.tanggal_penerimaan_jilidan) && (
                <tr className="bg-tertiary-container text-on-tertiary-container">
                  <td colSpan={2} className="py-2 px-6 font-bold text-amber-900 text-xs uppercase tracking-wider">Tahap Final & Jilidan</td>
                </tr>
              )}
              {doc.nomor_risalah && (
                <tr className="hover:bg-surface-container-lowest">
                  <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs">Risalah (RPD)</th>
                  <td className="py-3 px-6 font-bold text-on-surface text-sm">{doc.nomor_risalah} <br/> Tgl: {formatDate(doc.tanggal_risalah)}</td>
                </tr>
              )}
              {doc.nomor_sk && (
                <tr className="hover:bg-surface-container-lowest">
                  <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs">SK / Rekomendasi</th>
                  <td className="py-3 px-6 font-bold text-on-surface text-sm">{doc.nomor_sk} <br/> Tgl: {formatDate(doc.tanggal_penyerahan_sk)}</td>
                </tr>
              )}
              {doc.tanggal_penerimaan_jilidan && (
                <tr className="hover:bg-surface-container-lowest bg-tertiary-container">
                  <th className="py-3 px-6 font-bold text-on-surface-variant w-1/3 uppercase text-xs">Tanda Terima Jilidan</th>
                  <td className="py-3 px-6 font-bold text-on-surface text-sm">
                    Tgl Diterima: {formatDate(doc.tanggal_penerimaan_jilidan)} <br/>
                    Pengirim: {doc.nama_pengirim || '-'} <br/>
                    Penerima: {doc.petugas_mpp?.nama || '-'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Opsi Cetak */}
      <div className="space-y-6">
        <h4 className="text-lg font-bold text-on-surface uppercase border-b-4 border-outline-variant pb-2">Daftar Dokumen yang Tersedia</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {isAmdalnet ? (
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col justify-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-200 border border-outline-variant flex items-center justify-center">
                    <FileText size={20} className="text-on-surface" />
                  </div>
                  <h5 className="font-bold text-on-surface uppercase">Lembar Registrasi Amdalnet</h5>
                </div>
                <p className="text-xs font-bold text-on-surface-variant mb-6">Bukti registrasi via sistem Amdalnet.</p>
              </div>
              <button 
                onClick={() => handleDownload('Lembar_Registrasi_Amdalnet', 'registrasi')}
                disabled={downloading === 'Lembar_Registrasi_Amdalnet'}
                className="w-full px-4 py-3 bg-secondary text-on-secondary hover:bg-emerald-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {downloading === 'Lembar_Registrasi_Amdalnet' ? <LottieLoader size={24} /> : <Printer size={18} />}
                Cetak Dokumen
              </button>
            </div>
          ) : (
            <>
              {/* Tanda Terima Registrasi */}
              <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col justify-start">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-200 border border-outline-variant flex items-center justify-center">
                      <FileText size={20} className="text-on-surface" />
                    </div>
                    <h5 className="font-bold text-on-surface uppercase">Tanda Terima Registrasi</h5>
                  </div>
                  <p className="text-xs font-bold text-on-surface-variant mb-6">Bukti penerimaan awal dokumen masuk (MPP / DLH).</p>
                </div>
                <button 
                  onClick={() => handleDownload('template_tanda_terima_registrasi', 'registrasi')}
                  disabled={downloading === 'template_tanda_terima_registrasi'}
                  className="w-full px-4 py-3 bg-teal-400 hover:bg-teal-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {downloading === 'template_tanda_terima_registrasi' ? <LottieLoader size={24} /> : <Printer size={18} />}
                  Cetak Dokumen
                </button>
              </div>

              {/* Checklist Registrasi */}
              <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col justify-start">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-200 border border-outline-variant flex items-center justify-center">
                      <CheckCircle size={20} className="text-on-surface" />
                    </div>
                    <h5 className="font-bold text-on-surface uppercase">Checklist Kelengkapan</h5>
                  </div>
                  <p className="text-xs font-bold text-on-surface-variant mb-6">Daftar periksa kelengkapan berkas administrasi.</p>
                </div>
                <button 
                  onClick={() => handleDownload('template_checklist', 'registrasi')}
                  disabled={downloading === 'template_checklist'}
                  className="w-full px-4 py-3 bg-blue-400 hover:bg-blue-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {downloading === 'template_checklist' ? <LottieLoader size={24} /> : <Printer size={18} />}
                  Cetak Dokumen
                </button>
              </div>
            </>
          )}

          {/* BA Uji Administrasi (Conditional) */}
          {(doc.nomor_uji_berkas || doc.status_tahapan === 'Uji Administrasi Selesai' || doc.status_tahapan === 'Verlap Selesai' || doc.status_tahapan === 'Pemeriksaan Selesai') && (
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col justify-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-200 border border-outline-variant flex items-center justify-center">
                    <FileText size={20} className="text-on-surface" />
                  </div>
                  <h5 className="font-bold text-on-surface uppercase">BA Uji Administrasi</h5>
                </div>
                <p className="text-xs font-bold text-on-surface-variant mb-6">Berita Acara Hasil Uji Kelengkapan Administrasi (BA HUA).</p>
              </div>
              <button 
                onClick={() => handleDownload('template_ba_uji_admin', 'uji-administrasi')}
                disabled={downloading === 'template_ba_uji_admin'}
                className="w-full px-4 py-3 bg-indigo-400 hover:bg-indigo-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {downloading === 'template_ba_uji_admin' ? <LottieLoader size={24} /> : <Printer size={18} />}
                Cetak Dokumen
              </button>
            </div>
          )}

          {/* BA Verlap (Conditional) */}
          {(doc.nomor_ba_verlap || doc.status_tahapan === 'Verlap Selesai' || doc.status_tahapan === 'Pemeriksaan Selesai') && (
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col justify-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-200 border border-outline-variant flex items-center justify-center">
                    <FileText size={20} className="text-on-surface" />
                  </div>
                  <h5 className="font-bold text-on-surface uppercase">BA Verifikasi Lapangan</h5>
                </div>
                <p className="text-xs font-bold text-on-surface-variant mb-6">Berita Acara Hasil Verifikasi Lapangan (Verlap).</p>
              </div>
              <button 
                onClick={() => handleDownload('template_ba_verlap', 'verifikasi-lapangan')}
                disabled={downloading === 'template_ba_verlap'}
                className="w-full px-4 py-3 bg-tertiary text-on-tertiary hover:bg-amber-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {downloading === 'template_ba_verlap' ? <LottieLoader size={24} /> : <Printer size={18} />}
                Cetak Dokumen
              </button>
            </div>
          )}

          {/* BA Pemeriksaan / Rapat (Conditional) */}
          {(doc.nomor_ba_pemeriksaan || doc.status_tahapan === 'Pemeriksaan Selesai' || doc.status_tahapan === 'Menunggu Finalisasi' || doc.status_tahapan === 'Selesai' || doc.status_tahapan === 'Revisi' || doc.status_tahapan === 'Revisi Lanjutan') && (
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col justify-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-200 border border-outline-variant flex items-center justify-center">
                    <FileText size={20} className="text-on-surface" />
                  </div>
                  <h5 className="font-bold text-on-surface uppercase">BA Pemeriksaan</h5>
                </div>
                <p className="text-xs font-bold text-on-surface-variant mb-6">Berita Acara Hasil Rapat Pemeriksaan Substansi.</p>
              </div>
              <button 
                onClick={() => handleDownload('template_ba_substansi', 'pemeriksaan-substansi')}
                disabled={downloading === 'template_ba_substansi'}
                className="w-full px-4 py-3 bg-secondary text-on-secondary hover:bg-emerald-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {downloading === 'template_ba_substansi' ? <LottieLoader size={24} /> : <Printer size={18} />}
                Cetak Dokumen
              </button>
            </div>
          )}

          {/* BA Pemeriksaan Revisi / PHP (Conditional - Multiple Versions) */}
          {(doc.nomor_php || doc.status_tahapan === 'Revisi Lanjutan') && (
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col justify-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-200 border border-outline-variant flex items-center justify-center">
                    <FileText size={20} className="text-on-surface" />
                  </div>
                  <h5 className="font-bold text-on-surface uppercase">BA Pemeriksaan Revisi</h5>
                </div>
                <p className="text-xs font-bold text-on-surface-variant mb-6">Berita Acara / Pengembalian Hasil Pemeriksaan (Revisi).</p>
              </div>
              <div className="flex flex-col">
                {(() => {
                  const maxRev = parseInt(doc.revisi_ke || '1');
                  const revs = Array.from({ length: maxRev }).map((_, i) => i + 1);
                  const latest = revs[revs.length - 1];
                  const prevs = revs.slice(0, -1);
                  return (
                    <>
                      <button 
                        onClick={() => handleDownload('template_ba_pemeriksaan_revisi', 'pemeriksaan-revisi', latest)}
                        disabled={downloading === `template_ba_pemeriksaan_revisi_${latest}`}
                        className="w-full px-4 py-3 bg-pink-400 hover:bg-pink-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
                      >
                        {downloading === `template_ba_pemeriksaan_revisi_${latest}` ? <LottieLoader size={24} /> : <Printer size={18} />}
                        Cetak BA.P.P{latest}
                      </button>

                      {prevs.length > 0 && (
                        <div className="mt-4 pt-4 border-t-2 border-outline-variant">
                          <p className="text-xs font-bold text-on-surface-variant mb-2 uppercase">Versi Sebelumnya:</p>
                          <div className="flex flex-wrap gap-2">
                            {prevs.map(rev => (
                              <button
                                key={`php-prev-${rev}`}
                                onClick={() => handleDownload('template_ba_pemeriksaan_revisi', 'pemeriksaan-revisi', rev)}
                                disabled={downloading === `template_ba_pemeriksaan_revisi_${rev}`}
                                className="px-3 py-1.5 bg-surface hover:bg-surface-container-low text-on-surface-variant border border-outline-variant font-bold rounded-lg text-xs shadow-sm hover:shadow-md transition-shadow hover:-translate-y-0.5 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center gap-1 uppercase disabled:opacity-70"
                              >
                                {downloading === `template_ba_pemeriksaan_revisi_${rev}` ? <LottieLoader size={24} /> : <Printer size={14} />}
                                BA.P.P{rev}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Tanda Terima Penerimaan Perbaikan (Conditional - Multiple Versions) */}
          {(doc.tanggal_revisi_1 || doc.tanggal_revisi_2 || doc.status_tahapan === 'Penerimaan Perbaikan' || doc.status_tahapan === 'Pemeriksaan Revisi') && (
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col justify-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-fuchsia-200 border border-outline-variant flex items-center justify-center">
                    <FileText size={20} className="text-on-surface" />
                  </div>
                  <h5 className="font-bold text-on-surface uppercase">Penerimaan Hasil Perbaikan</h5>
                </div>
                <p className="text-xs font-bold text-on-surface-variant mb-6">Tanda terima dokumen perbaikan/revisi dari pemrakarsa.</p>
              </div>
              <div className="flex flex-col">
                {(() => {
                  const maxRev = parseInt(doc.revisi_ke || '1');
                  const revs = Array.from({ length: maxRev }).map((_, i) => i + 1);
                  const latest = revs[revs.length - 1];
                  const prevs = revs.slice(0, -1);
                  return (
                    <>
                      <button 
                        onClick={() => handleDownload('template_tanda_terima_perbaikan', 'penerimaan-perbaikan', latest)}
                        disabled={downloading === `template_tanda_terima_perbaikan_${latest}`}
                        className="w-full px-4 py-3 bg-fuchsia-400 hover:bg-fuchsia-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
                      >
                        {downloading === `template_tanda_terima_perbaikan_${latest}` ? <LottieLoader size={24} /> : <Printer size={18} />}
                        Cetak PHP{latest}
                      </button>

                      {prevs.length > 0 && (
                        <div className="mt-4 pt-4 border-t-2 border-outline-variant">
                          <p className="text-xs font-bold text-on-surface-variant mb-2 uppercase">Versi Sebelumnya:</p>
                          <div className="flex flex-wrap gap-2">
                            {prevs.map(rev => (
                              <button
                                key={`ttp-prev-${rev}`}
                                onClick={() => handleDownload('template_tanda_terima_perbaikan', 'penerimaan-perbaikan', rev)}
                                disabled={downloading === `template_tanda_terima_perbaikan_${rev}`}
                                className="px-3 py-1.5 bg-surface hover:bg-surface-container-low text-on-surface-variant border border-outline-variant font-bold rounded-lg text-xs shadow-sm hover:shadow-md transition-shadow hover:-translate-y-0.5 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center gap-1 uppercase disabled:opacity-70"
                              >
                                {downloading === `template_tanda_terima_perbaikan_${rev}` ? <LottieLoader size={24} /> : <Printer size={14} />}
                                PHP{rev}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Tanda Terima Penerimaan Final / Jilidan (Conditional) */}
          {(doc.tanggal_penerimaan_jilidan || doc.status_tahapan === 'Penerimaan Jilidan') && (
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col justify-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-200 border border-outline-variant flex items-center justify-center">
                    <FileText size={20} className="text-on-surface" />
                  </div>
                  <h5 className="font-bold text-on-surface uppercase">Tanda Terima Final</h5>
                </div>
                <p className="text-xs font-bold text-on-surface-variant mb-6">Bukti penerimaan dokumen fisik jilidan akhir.</p>
              </div>
              <button 
                onClick={() => handleDownload('template_tanda_terima_jilidan', 'jilidan')}
                disabled={downloading === 'template_tanda_terima_jilidan'}
                className="w-full px-4 py-3 bg-orange-400 hover:bg-orange-300 text-on-surface border border-outline-variant font-bold rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 hover:shadow-sm hover:shadow-md transition-shadow transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {downloading === 'template_tanda_terima_jilidan' ? <LottieLoader size={24} /> : <Printer size={18} />}
                Cetak Dokumen
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
