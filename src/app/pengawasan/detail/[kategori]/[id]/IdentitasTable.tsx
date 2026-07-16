'use client';

import { useState } from 'react';
import { Database, ChevronLeft, ChevronRight } from 'lucide-react';

const labelMap: Record<string, string> = {
  kbli: "KBLI (Klasifikasi Baku Lapangan Usaha Indonesia)",
  alamat: "Alamat Lengkap",
  tahun_operasi: "Tahun Beroperasi",
  status_permodalan: "Status Permodalan",
  pj_nama: "Nama Penanggung Jawab",
  pj_jabatan: "Jabatan Penanggung Jawab",
  telepon: "Nomor Telepon",
  koordinat: "Titik Koordinat Lokasi",
  batas_utara: "Batas Utara Lokasi",
  batas_selatan: "Batas Selatan Lokasi",
  batas_barat: "Batas Barat Lokasi",
  batas_timur: "Batas Timur Lokasi",
  luas_total: "Luas Area Total",
  luas_terbangun: "Luas Area Terbangun",
  luas_terbuka: "Luas Area Terbuka Hijau",
  luas_bangunan: "Luas Bangunan",
  kapasitas_izin: "Kapasitas Berdasarkan Izin",
  kapasitas_riil: "Kapasitas Riil / Aktual",
  jumlah_karyawan: "Jumlah Karyawan",
  jumlah_pasien: "Jumlah Pasien (Kapasitas)",
  shift_kerja: "Pembagian Shift Kerja",
  hari_kerja_minggu: "Jumlah Hari Kerja Per Minggu",
  teknologi_air_limbah: "Teknologi Pengelolaan Air Limbah",
  volume_air_limbah: "Volume Air Limbah Dihasilkan",
  pemanfaatan_air_tanah: "Pemanfaatan Air Tanah",
  penggunaan_air_liter: "Penggunaan Air (Liter)",
  penggunaan_energi: "Detail Penggunaan Energi",
  debit_inlet: "Debit Air Limbah (Inlet)",
  debit_outlet: "Debit Air Limbah (Outlet)",
  kapasitas_produksi: "Kapasitas Produksi",
  jenis_produk: "Jenis Produk yang Dihasilkan",
  bahan_baku_utama: "Bahan Baku Utama",
  bahan_penolong: "Bahan Penolong",
  proses_produksi: "Penjelasan Proses Produksi",
  energi: "Sumber Energi Utama",
  pembuangan_air: "Saluran Pembuangan Air Limbah",
  pengelolaan_sampah_umum: "Sistem Pengelolaan Sampah",
  pengelolaan_b3_umum: "Sistem Pengelolaan Limbah B3",
  sumber_air_bersih: "Sumber Pemenuhan Air Bersih",
  persetujuan_teknis: "Dokumen Persetujuan Teknis",
  slo: "Surat Kelayakan Operasional (SLO)",
  sertifikasi_iso: "Sertifikasi Lingkungan (ISO dll)",
  struktur_organisasi: "Struktur Organisasi Pengelolaan Lingkungan",
  jam_produksi: "Jam Produksi",
  hari_kerja: "Hari Kerja",
  penggunaan_air_per_hari: "Penggunaan Air Per Hari",
  nilai_investasi: "Nilai Investasi",
  jumlah_pekerja: "Jumlah Pekerja",
  jumlah_penghuni: "Jumlah Penghuni",
  jam_kerja_hari: "Jam Kerja Dalam 1 Hari",
  shift_kerja_konstruksi: "Shift Kerja (Konstruksi)",
  kapasitas_kegiatan: "Kapasitas Kegiatan",
  jumlah_karyawan_pengunjung: "Jumlah Karyawan & Pengunjung",
  dokumen_dimiliki: "Dokumen Lingkungan yang Dimiliki",
  persetujuan_lingkungan: "Persetujuan Lingkungan",
  riwayat_ketaatan: "Riwayat Ketaatan",
  inspeksi_terakhir: "Tanggal Inspeksi Terakhir"
};

export default function IdentitasTable({ identitas }: { identitas: any }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const entries = Object.entries(identitas).filter(([_, value]) => value !== '' && value !== null && value !== undefined);
  
  if (entries.length === 0) return null;

  const totalPages = Math.ceil(entries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEntries = entries.slice(startIndex, startIndex + itemsPerPage);

  const formatLabel = (key: string) => {
    if (labelMap[key]) return labelMap[key];
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="bg-white border-4 border-slate-900 rounded-[2rem] p-6 md:p-8 shadow-[8px_8px_0_0_#0f172a]">
      <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-amber-100 border-[3px] border-slate-900 flex items-center justify-center shadow-[2px_2px_0_0_#0f172a]">
          <Database size={24} className="text-amber-700" />
        </div>
        Detail Data Identitas
      </h2>
      
      <div className="overflow-x-auto border-4 border-slate-900 rounded-xl shadow-[4px_4px_0_0_#0f172a]">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-900 uppercase bg-amber-300 border-b-4 border-slate-900 font-black tracking-widest">
            <tr>
              <th className="px-6 py-4 border-r-4 border-slate-900 w-1/3">Variabel Pengawasan</th>
              <th className="px-6 py-4">Nilai Data</th>
            </tr>
          </thead>
          <tbody>
            {currentEntries.map(([key, value], idx) => (
              <tr key={key} className={`border-b-2 border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} last:border-b-0`}>
                <td className="px-6 py-4 font-bold text-slate-700 border-r-4 border-slate-900 bg-slate-100">
                  {formatLabel(key)}
                </td>
                <td className="px-6 py-4 text-slate-900 font-medium">
                  {String(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm font-bold text-slate-500">
            Menampilkan <span className="text-slate-900">{startIndex + 1}</span> - <span className="text-slate-900">{Math.min(startIndex + itemsPerPage, entries.length)}</span> dari <span className="text-slate-900">{entries.length}</span> data
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border-2 border-slate-900 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white shadow-[2px_2px_0_0_#0f172a] transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-10 h-10 rounded-lg border-2 border-slate-900 font-black text-sm flex items-center justify-center shadow-[2px_2px_0_0_#0f172a] transition-all ${
                    currentPage === idx + 1 
                      ? 'bg-amber-400 text-slate-900' 
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border-2 border-slate-900 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white shadow-[2px_2px_0_0_#0f172a] transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
