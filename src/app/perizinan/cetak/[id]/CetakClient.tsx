'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Printer, Loader2, ArrowLeft, FileText, CheckCircle } from 'lucide-react';

export default function CetakClient({ doc }: { doc: any }) {
  const router = useRouter();
  const [downloading, setDownloading] = useState<string | null>(null);

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
      <div className="flex items-center justify-between gap-4 mb-6 bg-white p-6 rounded-2xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-amber-400 border-2 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a]">
            <Printer className="w-8 h-8 text-slate-900" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Pusat Cetak Dokumen</h2>
            <p className="text-sm font-bold text-slate-600 mt-1 uppercase">Pengarsipan & Pencetakan Berkas Fisik</p>
          </div>
        </div>
        <Link href="/perizinan/daftar" className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-900 border-2 border-slate-900 font-black rounded-xl text-sm shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center gap-2 uppercase">
          <ArrowLeft size={18} /> Kembali
        </Link>
      </div>

      {/* Info Dokumen */}
      <div className="bg-slate-50 border-4 border-slate-900 rounded-3xl p-6 shadow-[8px_8px_0_0_#0f172a]">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div>
            <div className="bg-indigo-200 text-slate-900 text-xs font-black px-3 py-1 rounded uppercase border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] inline-block mb-3">
              NO URUT: #{String(doc.no_urut || doc.id).padStart(3, '0')}/{doc.tahun}
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase">{doc.nama_kegiatan}</h3>
            <p className="text-sm font-bold text-slate-500 mt-1">{doc.nama_pemrakarsa} &bull; {doc.jenis_dokumen}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-500 uppercase">Status Saat Ini</p>
            <p className="text-sm font-black text-indigo-600 uppercase bg-white border-2 border-slate-900 px-3 py-1.5 rounded-lg shadow-[2px_2px_0_0_#0f172a] mt-1 inline-block">
              {doc.status_tahapan}
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Riwayat Informasi Dokumen */}
      <div className="bg-white border-4 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0_0_#0f172a] mb-8">
        <div className="bg-slate-900 px-6 py-4">
          <h4 className="text-lg font-black text-white uppercase">Riwayat & Detail Dokumen Lengkap</h4>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <tbody className="divide-y-2 divide-slate-200">
              
              {/* Data Pemrakarsa & Kegiatan */}
              <tr className="bg-slate-100">
                <td colSpan={2} className="py-2 px-6 font-black text-slate-800 text-xs uppercase tracking-wider">Data Pemrakarsa & Kegiatan</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <th className="py-3 px-6 font-black text-slate-700 w-1/3 uppercase text-xs">Identitas Pemrakarsa</th>
                <td className="py-3 px-6 font-bold text-slate-900 text-sm">
                  Pemrakarsa: {doc.nama_pemrakarsa || '-'} <br/>
                  Nama Usaha/PT: {doc.nama_usaha || '-'} <br/>
                  No. Telepon: {doc.no_telp_pemrakarsa || '-'}
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <th className="py-3 px-6 font-black text-slate-700 w-1/3 uppercase text-xs">Informasi Kegiatan</th>
                <td className="py-3 px-6 font-bold text-slate-900 text-sm">
                  Kegiatan: {doc.nama_kegiatan || '-'} <br/>
                  Lokasi: {doc.lokasi_kegiatan || '-'}
                </td>
              </tr>

              {/* Tahap Registrasi */}
              <tr className="bg-slate-100">
                <td colSpan={2} className="py-2 px-6 font-black text-slate-800 text-xs uppercase tracking-wider">Tahap Registrasi</td>
              </tr>
              {doc.nomor_surat_permohonan && (
                <tr className="hover:bg-slate-50">
                  <th className="py-3 px-6 font-black text-slate-700 w-1/3 uppercase text-xs">Surat Permohonan</th>
                  <td className="py-3 px-6 font-bold text-slate-900 text-sm">
                    No: {doc.nomor_surat_permohonan} <br/>
                    Tgl: {formatDate(doc.tanggal_surat_permohonan)} <br/>
                    Perihal: {doc.perihal_surat_permohonan || '-'}
                  </td>
                </tr>
              )}
              <tr className="hover:bg-slate-50">
                <th className="py-3 px-6 font-black text-slate-700 w-1/3 uppercase text-xs">Checklist Dokumen Masuk</th>
                <td className="py-3 px-6 font-bold text-slate-900 text-sm">
                  {doc.nomor_checklist ? `No: ${doc.nomor_checklist}` : '-'} <br/>
                  Tgl Masuk: {formatDate(doc.tanggal_masuk_dokumen)}
                </td>
              </tr>

              {/* Tahap Proses */}
              {(doc.nomor_uji_berkas || doc.nomor_ba_verlap || doc.nomor_ba_pemeriksaan) && (
                <tr className="bg-slate-100">
                  <td colSpan={2} className="py-2 px-6 font-black text-slate-800 text-xs uppercase tracking-wider">Tahap Proses & Pemeriksaan</td>
                </tr>
              )}
              {doc.nomor_uji_berkas && (
                <tr className="hover:bg-slate-50">
                  <th className="py-3 px-6 font-black text-slate-700 w-1/3 uppercase text-xs">Uji Administrasi</th>
                  <td className="py-3 px-6 font-bold text-slate-900 text-sm">{doc.nomor_uji_berkas} <br/> Tgl: {formatDate(doc.tanggal_uji_berkas)}</td>
                </tr>
              )}
              {doc.nomor_ba_verlap && (
                <tr className="hover:bg-slate-50">
                  <th className="py-3 px-6 font-black text-slate-700 w-1/3 uppercase text-xs">Verifikasi Lapangan</th>
                  <td className="py-3 px-6 font-bold text-slate-900 text-sm">{doc.nomor_ba_verlap} <br/> Tgl: {formatDate(doc.tanggal_verlap)}</td>
                </tr>
              )}
              {doc.nomor_ba_pemeriksaan && (
                <tr className="hover:bg-slate-50">
                  <th className="py-3 px-6 font-black text-slate-700 w-1/3 uppercase text-xs">Pemeriksaan Substansi</th>
                  <td className="py-3 px-6 font-bold text-slate-900 text-sm">{doc.nomor_ba_pemeriksaan} <br/> Tgl: {formatDate(doc.tanggal_pemeriksaan)}</td>
                </tr>
              )}
              {doc.tanggal_pengembalian && (
                <tr className="hover:bg-slate-50 bg-red-50/50">
                  <th className="py-3 px-6 font-black text-red-700 w-1/3 uppercase text-xs">Pengembalian Revisi</th>
                  <td className="py-3 px-6 font-bold text-red-900 text-sm">Tgl: {formatDate(doc.tanggal_pengembalian)}</td>
                </tr>
              )}
              
              {/* Revisi 1 - 5 */}
              {(doc.nomor_php || doc.nomor_revisi_1) && (
                <tr className="bg-indigo-100">
                  <td colSpan={2} className="py-2 px-6 font-black text-indigo-900 text-xs uppercase tracking-wider">Tahap Perbaikan (Revisi)</td>
                </tr>
              )}
              {[1, 2, 3, 4, 5].map((rev) => {
                const phpNum = rev === 1 ? doc.nomor_php : doc[`nomor_php${rev}`];
                const phpDate = doc[`tanggal_php_${rev}`];
                const baNum = doc[`nomor_revisi_${rev}`];
                const baDate = doc[`tanggal_revisi_${rev}`];
                
                if (!phpNum && !baNum) return null;
                
                return (
                  <tr key={rev} className="hover:bg-slate-50 bg-indigo-50/30">
                    <th className="py-3 px-6 font-black text-slate-700 w-1/3 uppercase text-xs">Revisi Putaran {rev}</th>
                    <td className="py-3 px-6 font-bold text-slate-900 text-sm">
                      <div className="flex flex-col gap-1">
                        {phpNum && (
                          <div className="flex justify-between items-start border-b border-indigo-100 pb-1">
                            <span className="text-indigo-600">PHP: {phpNum}</span>
                            <span className="text-xs bg-white px-2 py-0.5 rounded border border-slate-300 ml-4 shrink-0">{formatDate(phpDate)}</span>
                          </div>
                        )}
                        {baNum && (
                          <div className="flex justify-between items-start pt-1">
                            <span className="text-emerald-700">BA: {baNum}</span>
                            <span className="text-xs bg-white px-2 py-0.5 rounded border border-slate-300 ml-4 shrink-0">{formatDate(baDate)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Finalisasi */}
              {(doc.nomor_risalah || doc.nomor_sk || doc.tanggal_penerimaan_jilidan) && (
                <tr className="bg-amber-100">
                  <td colSpan={2} className="py-2 px-6 font-black text-amber-900 text-xs uppercase tracking-wider">Tahap Final & Jilidan</td>
                </tr>
              )}
              {doc.nomor_risalah && (
                <tr className="hover:bg-slate-50">
                  <th className="py-3 px-6 font-black text-slate-700 w-1/3 uppercase text-xs">Risalah (RPD)</th>
                  <td className="py-3 px-6 font-bold text-slate-900 text-sm">{doc.nomor_risalah} <br/> Tgl: {formatDate(doc.tanggal_risalah)}</td>
                </tr>
              )}
              {doc.nomor_sk && (
                <tr className="hover:bg-slate-50">
                  <th className="py-3 px-6 font-black text-slate-700 w-1/3 uppercase text-xs">SK / Rekomendasi</th>
                  <td className="py-3 px-6 font-bold text-slate-900 text-sm">{doc.nomor_sk} <br/> Tgl: {formatDate(doc.tanggal_penyerahan_sk)}</td>
                </tr>
              )}
              {doc.tanggal_penerimaan_jilidan && (
                <tr className="hover:bg-slate-50 bg-amber-50">
                  <th className="py-3 px-6 font-black text-slate-700 w-1/3 uppercase text-xs">Tanda Terima Jilidan</th>
                  <td className="py-3 px-6 font-bold text-slate-900 text-sm">
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
        <h4 className="text-lg font-black text-slate-900 uppercase border-b-4 border-slate-900 pb-2">Daftar Dokumen yang Tersedia</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {doc.nomor_registrasi_amdalnet ? (
            {/* Lembar Registrasi Amdalnet */}
            <div className="bg-white p-6 rounded-2xl border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] flex flex-col justify-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-200 border-2 border-slate-900 flex items-center justify-center">
                    <FileText size={20} className="text-slate-900" />
                  </div>
                  <h5 className="font-black text-slate-900 uppercase">Lembar Registrasi Amdalnet</h5>
                </div>
                <p className="text-xs font-bold text-slate-500 mb-6">Bukti registrasi via sistem Amdalnet.</p>
              </div>
              <button 
                onClick={() => handleDownload('Lembar_Registrasi_Amdalnet', 'registrasi')}
                disabled={downloading === 'Lembar_Registrasi_Amdalnet'}
                className="w-full px-4 py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-900 border-2 border-slate-900 font-black rounded-xl text-sm shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {downloading === 'Lembar_Registrasi_Amdalnet' ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                Cetak Dokumen
              </button>
            </div>
          ) : (
            <>
              {/* Tanda Terima Registrasi */}
              <div className="bg-white p-6 rounded-2xl border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] flex flex-col justify-start">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-200 border-2 border-slate-900 flex items-center justify-center">
                      <FileText size={20} className="text-slate-900" />
                    </div>
                    <h5 className="font-black text-slate-900 uppercase">Tanda Terima Registrasi</h5>
                  </div>
                  <p className="text-xs font-bold text-slate-500 mb-6">Bukti penerimaan awal dokumen masuk (MPP / DLH).</p>
                </div>
                <button 
                  onClick={() => handleDownload('template_tanda_terima_registrasi', 'registrasi')}
                  disabled={downloading === 'template_tanda_terima_registrasi'}
                  className="w-full px-4 py-3 bg-teal-400 hover:bg-teal-300 text-slate-900 border-2 border-slate-900 font-black rounded-xl text-sm shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {downloading === 'template_tanda_terima_registrasi' ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                  Cetak Dokumen
                </button>
              </div>

              {/* Checklist Registrasi */}
              <div className="bg-white p-6 rounded-2xl border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] flex flex-col justify-start">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-200 border-2 border-slate-900 flex items-center justify-center">
                      <CheckCircle size={20} className="text-slate-900" />
                    </div>
                    <h5 className="font-black text-slate-900 uppercase">Checklist Kelengkapan</h5>
                  </div>
                  <p className="text-xs font-bold text-slate-500 mb-6">Daftar periksa kelengkapan berkas administrasi.</p>
                </div>
                <button 
                  onClick={() => handleDownload('template_checklist', 'registrasi')}
                  disabled={downloading === 'template_checklist'}
                  className="w-full px-4 py-3 bg-blue-400 hover:bg-blue-300 text-slate-900 border-2 border-slate-900 font-black rounded-xl text-sm shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {downloading === 'template_checklist' ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                  Cetak Dokumen
                </button>
              </div>
            </>
          )}

          {/* BA Uji Administrasi (Conditional) */}
          {(doc.nomor_uji_berkas || doc.status_tahapan === 'Uji Administrasi Selesai' || doc.status_tahapan === 'Verlap Selesai' || doc.status_tahapan === 'Pemeriksaan Selesai') && (
            <div className="bg-white p-6 rounded-2xl border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] flex flex-col justify-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-200 border-2 border-slate-900 flex items-center justify-center">
                    <FileText size={20} className="text-slate-900" />
                  </div>
                  <h5 className="font-black text-slate-900 uppercase">BA Uji Administrasi</h5>
                </div>
                <p className="text-xs font-bold text-slate-500 mb-6">Berita Acara Hasil Uji Kelengkapan Administrasi (BA HUA).</p>
              </div>
              <button 
                onClick={() => handleDownload('template_ba_uji_admin', 'uji-administrasi')}
                disabled={downloading === 'template_ba_uji_admin'}
                className="w-full px-4 py-3 bg-indigo-400 hover:bg-indigo-300 text-slate-900 border-2 border-slate-900 font-black rounded-xl text-sm shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {downloading === 'template_ba_uji_admin' ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                Cetak Dokumen
              </button>
            </div>
          )}

          {/* BA Verlap (Conditional) */}
          {(doc.nomor_ba_verlap || doc.status_tahapan === 'Verlap Selesai' || doc.status_tahapan === 'Pemeriksaan Selesai') && (
            <div className="bg-white p-6 rounded-2xl border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] flex flex-col justify-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-200 border-2 border-slate-900 flex items-center justify-center">
                    <FileText size={20} className="text-slate-900" />
                  </div>
                  <h5 className="font-black text-slate-900 uppercase">BA Verifikasi Lapangan</h5>
                </div>
                <p className="text-xs font-bold text-slate-500 mb-6">Berita Acara Hasil Verifikasi Lapangan (Verlap).</p>
              </div>
              <button 
                onClick={() => handleDownload('template_ba_verlap', 'verifikasi-lapangan')}
                disabled={downloading === 'template_ba_verlap'}
                className="w-full px-4 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 border-2 border-slate-900 font-black rounded-xl text-sm shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {downloading === 'template_ba_verlap' ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                Cetak Dokumen
              </button>
            </div>
          )}

          {/* BA Pemeriksaan / Rapat (Conditional) */}
          {(doc.nomor_ba_pemeriksaan || doc.status_tahapan === 'Pemeriksaan Selesai' || doc.status_tahapan === 'Menunggu Finalisasi' || doc.status_tahapan === 'Selesai' || doc.status_tahapan === 'Revisi' || doc.status_tahapan === 'Revisi Lanjutan') && (
            <div className="bg-white p-6 rounded-2xl border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] flex flex-col justify-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-200 border-2 border-slate-900 flex items-center justify-center">
                    <FileText size={20} className="text-slate-900" />
                  </div>
                  <h5 className="font-black text-slate-900 uppercase">BA Pemeriksaan</h5>
                </div>
                <p className="text-xs font-bold text-slate-500 mb-6">Berita Acara Hasil Rapat Pemeriksaan Substansi.</p>
              </div>
              <button 
                onClick={() => handleDownload('template_ba_substansi', 'pemeriksaan-substansi')}
                disabled={downloading === 'template_ba_substansi'}
                className="w-full px-4 py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-900 border-2 border-slate-900 font-black rounded-xl text-sm shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {downloading === 'template_ba_substansi' ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                Cetak Dokumen
              </button>
            </div>
          )}

          {/* BA Pemeriksaan Revisi / PHP (Conditional - Multiple Versions) */}
          {(doc.nomor_php || doc.status_tahapan === 'Revisi Lanjutan') && (
            <div className="bg-white p-6 rounded-2xl border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] flex flex-col justify-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-200 border-2 border-slate-900 flex items-center justify-center">
                    <FileText size={20} className="text-slate-900" />
                  </div>
                  <h5 className="font-black text-slate-900 uppercase">BA Pemeriksaan Revisi</h5>
                </div>
                <p className="text-xs font-bold text-slate-500 mb-6">Berita Acara / Pengembalian Hasil Pemeriksaan (Revisi).</p>
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
                        className="w-full px-4 py-3 bg-pink-400 hover:bg-pink-300 text-slate-900 border-2 border-slate-900 font-black rounded-xl text-sm shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
                      >
                        {downloading === `template_ba_pemeriksaan_revisi_${latest}` ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                        Cetak BA.P.P{latest}
                      </button>

                      {prevs.length > 0 && (
                        <div className="mt-4 pt-4 border-t-2 border-slate-200">
                          <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Versi Sebelumnya:</p>
                          <div className="flex flex-wrap gap-2">
                            {prevs.map(rev => (
                              <button
                                key={`php-prev-${rev}`}
                                onClick={() => handleDownload('template_ba_pemeriksaan_revisi', 'pemeriksaan-revisi', rev)}
                                disabled={downloading === `template_ba_pemeriksaan_revisi_${rev}`}
                                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-900 font-bold rounded-lg text-xs shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#0f172a] transition-all flex items-center gap-1 uppercase disabled:opacity-70"
                              >
                                {downloading === `template_ba_pemeriksaan_revisi_${rev}` ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
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
            <div className="bg-white p-6 rounded-2xl border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] flex flex-col justify-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-fuchsia-200 border-2 border-slate-900 flex items-center justify-center">
                    <FileText size={20} className="text-slate-900" />
                  </div>
                  <h5 className="font-black text-slate-900 uppercase">Penerimaan Hasil Perbaikan</h5>
                </div>
                <p className="text-xs font-bold text-slate-500 mb-6">Tanda terima dokumen perbaikan/revisi dari pemrakarsa.</p>
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
                        className="w-full px-4 py-3 bg-fuchsia-400 hover:bg-fuchsia-300 text-slate-900 border-2 border-slate-900 font-black rounded-xl text-sm shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
                      >
                        {downloading === `template_tanda_terima_perbaikan_${latest}` ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                        Cetak PHP{latest}
                      </button>

                      {prevs.length > 0 && (
                        <div className="mt-4 pt-4 border-t-2 border-slate-200">
                          <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Versi Sebelumnya:</p>
                          <div className="flex flex-wrap gap-2">
                            {prevs.map(rev => (
                              <button
                                key={`ttp-prev-${rev}`}
                                onClick={() => handleDownload('template_tanda_terima_perbaikan', 'penerimaan-perbaikan', rev)}
                                disabled={downloading === `template_tanda_terima_perbaikan_${rev}`}
                                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border-2 border-slate-900 font-bold rounded-lg text-xs shadow-[2px_2px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#0f172a] transition-all flex items-center gap-1 uppercase disabled:opacity-70"
                              >
                                {downloading === `template_tanda_terima_perbaikan_${rev}` ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
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
            <div className="bg-white p-6 rounded-2xl border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] flex flex-col justify-start">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-200 border-2 border-slate-900 flex items-center justify-center">
                    <FileText size={20} className="text-slate-900" />
                  </div>
                  <h5 className="font-black text-slate-900 uppercase">Tanda Terima Final</h5>
                </div>
                <p className="text-xs font-bold text-slate-500 mb-6">Bukti penerimaan dokumen fisik jilidan akhir.</p>
              </div>
              <button 
                onClick={() => handleDownload('template_tanda_terima_jilidan', 'jilidan')}
                disabled={downloading === 'template_tanda_terima_jilidan'}
                className="w-full px-4 py-3 bg-orange-400 hover:bg-orange-300 text-slate-900 border-2 border-slate-900 font-black rounded-xl text-sm shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {downloading === 'template_tanda_terima_jilidan' ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                Cetak Dokumen
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
