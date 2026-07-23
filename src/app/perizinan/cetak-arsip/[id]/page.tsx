'use client';

import { use, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function CetakArsipPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('dokumens').select('*').eq('id', unwrappedParams.id).single();
      setDoc(data);
      setLoading(false);
      // Auto print after a small delay
      setTimeout(() => {
        window.print();
      }, 1000);
    };
    fetchDoc();
  }, [unwrappedParams.id]);

  if (loading) return <div className="p-10 text-center">Memuat dokumen...</div>;
  if (!doc) return <div className="p-10 text-center">Dokumen tidak ditemukan</div>;

  let fisik: any = {};
  try {
    if (doc.arsip_fisik) {
      fisik = JSON.parse(doc.arsip_fisik);
      if (typeof fisik === 'string') fisik = JSON.parse(fisik);
    }
  } catch (e) {}

  let isAmdalnet = false;
  try {
    const extra = typeof doc.penandatangan_hua === 'string' ? JSON.parse(doc.penandatangan_hua) : doc.penandatangan_hua;
    if (extra && extra.is_amdalnet) isAmdalnet = true;
  } catch (e) {}

  const revisiList = [];
  if (doc.nomor_revisi) revisiList.push({ key: '', nomor: doc.nomor_revisi, title: 'BA Pemeriksaan Revisi' });
  for (let i = 1; i <= 5; i++) {
    if (doc[`nomor_revisi_${i}`]) {
      revisiList.push({ key: i, nomor: doc[`nomor_revisi_${i}`], title: 'BA Pemeriksaan Revisi ' + i });
    }
  }

  const phpList = [];
  if (doc.nomor_php) phpList.push({ key: '', nomor: doc.nomor_php, title: 'Penerimaan Perbaikan / PHP' });
  for (let i = 1; i <= 5; i++) {
    if (doc[`nomor_php${i}`]) {
      phpList.push({ key: i, nomor: doc[`nomor_php${i}`], title: 'Penerimaan Perbaikan / PHP ' + i });
    }
  }

  const items = [
    { label: 'Dokumen Lingkungan Final', value: fisik.noDokumenCetak || '-', checked: fisik.dokumenCetak || fisik.urlDokumenCetak },
    { label: 'PKPLH Arsip', value: fisik.noPkplhArsip || '-', checked: fisik.pkplhArsip || fisik.urlPkplh },
    { label: 'BA Uji Administrasi', value: isAmdalnet ? 'DIPROSES VIA AMDALNET' : (doc.nomor_uji_berkas || '-'), checked: doc.nomor_uji_berkas || isAmdalnet || fisik.urlUjiAdmin },
    { label: 'BA Verlap', value: doc.nomor_ba_verlap || '-', checked: doc.nomor_ba_verlap || fisik.urlBaVerlap },
    { label: 'BA Pemeriksa/Sidang', value: doc.nomor_ba_pemeriksaan || '-', checked: doc.nomor_ba_pemeriksaan || fisik.urlBaSidang },
    ...revisiList.map(r => ({ label: r.title, value: r.nomor || '-', checked: true })),
    { label: 'Surat Permohonan (Awal)', value: fisik.noSuratPermohonan || '-', checked: fisik.suratPermohonan || fisik.urlSuratPermohonan },
    { label: 'Lembar Registrasi', value: doc.nomor_checklist || '-', checked: doc.nomor_checklist || fisik.urlRegistrasi },
    { label: 'Lembar Pengembalian', value: doc.tanggal_pengembalian || '-', checked: doc.tanggal_pengembalian || fisik.urlPengembalian },
    ...phpList.map(p => ({ label: p.title, value: p.nomor || '-', checked: true })),
    { label: 'Undangan Sidang', value: fisik.noUndanganSidang || '-', checked: fisik.undanganSidang || fisik.urlUndanganSidang },
    { label: doc.jenis_dokumen === 'SPPL' ? 'Pengesahan SPPL' : 'Penyusunan RPD', value: doc.jenis_dokumen === 'SPPL' ? (fisik.noRpdArsip || '-') : (doc.nomor_risalah || '-'), checked: doc.nomor_risalah || fisik.rpdArsip || fisik.urlRpd },
  ];

  return (
    <div className="max-w-3xl mx-auto p-10 bg-white min-h-screen text-black">
      <div className="text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold uppercase">Lembar Arsip Dokumen Lingkungan</h1>
        <p className="text-sm mt-1">Dinas Lingkungan Hidup Kabupaten Bojonegoro</p>
      </div>

      <div className="grid grid-cols-[150px_10px_1fr] gap-2 mb-8 text-sm">
        <div className="font-bold">No. Registrasi</div><div>:</div><div>{doc.nomor_checklist || '-'}</div>
        <div className="font-bold">Nama Kegiatan</div><div>:</div><div>{doc.nama_kegiatan}</div>
        <div className="font-bold">Pemrakarsa</div><div>:</div><div>{doc.nama_pemrakarsa}</div>
        <div className="font-bold">Jenis Dokumen</div><div>:</div><div>{doc.jenis_dokumen}</div>
        <div className="font-bold">Tahun</div><div>:</div><div>{doc.tahun || '-'}</div>
      </div>

      <h2 className="font-bold text-lg border-b border-black mb-4 pb-1">Daftar Kelengkapan Arsip</h2>
      <table className="w-full text-sm mb-8 border-collapse border border-black">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black py-2 px-3 text-left w-10 text-center">No</th>
            <th className="border border-black py-2 px-3 text-left w-12 text-center">Cek</th>
            <th className="border border-black py-2 px-3 text-left">Nama Dokumen</th>
            <th className="border border-black py-2 px-3 text-left">Nomor / Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="border border-black py-2 px-3 text-center">{idx + 1}</td>
              <td className="border border-black py-2 px-3 text-center text-lg font-bold">
                {item.checked ? '✓' : ''}
              </td>
              <td className="border border-black py-2 px-3">{item.label}</td>
              <td className="border border-black py-2 px-3">{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="font-bold text-lg border-b border-black mb-4 pb-1">Lokasi Penyimpanan Arsip Fisik</h2>
      <div className="grid grid-cols-[150px_10px_1fr] gap-2 mb-8 text-sm">
        <div className="font-bold">Letak / Lemari</div><div>:</div><div>{fisik.lokasiArsip || '-'}</div>
        <div className="font-bold">Koordinat Maps</div><div>:</div>
        <div>
          Lat: {doc.latitude || '-'} <br/>
          Long: {doc.longitude || '-'}
        </div>
      </div>

      <div className="flex justify-between mt-16 text-sm">
        <div className="text-center w-48">
          <p>Bojonegoro, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p>Petugas Arsip,</p>
          <br /><br /><br /><br />
          <p className="border-b border-black inline-block min-w-[150px]">(......................................)</p>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: \`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
          .max-w-3xl { max-width: 100% !important; margin: 0 !important; padding: 20px !important; }
          @page { size: A4; margin: 20mm; }
        }
      \`}} />
    </div>
  );
}
