import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Kebijakan Privasi — BIDI DLH',
  description: 'Kebijakan Privasi Aplikasi Sistem Informasi Bidang Pengendalian dan Pengawasan Lingkungan Hidup (BIDI DLH).',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-10 space-y-6">
        <div className="border-b border-slate-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Dinas Lingkungan Hidup
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Kebijakan Privasi — BIDI DLH
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Terakhir diperbarui: 17 November 2026
          </p>
        </div>

        <section className="space-y-3 text-sm leading-relaxed text-slate-700">
          <h2 className="text-lg font-semibold text-slate-900">1. Informasi Umum</h2>
          <p>
            Aplikasi <strong>BIDI DLH</strong> (<code>https://bididlh.vercel.app</code>) adalah sistem informasi internal untuk pengelolaan administrasi perizinan lingkungan, pengawasan lapangan, penanganan pengaduan, dan pengarsipan dokumen Dinas Lingkungan Hidup.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-700">
          <h2 className="text-lg font-semibold text-slate-900">2. Data yang Dikumpulkan dan Diproses</h2>
          <p>
            Aplikasi hanya memproses data operasional kedinasan yang diinput oleh petugas berwenang, meliputi data pemrakarsa, dokumen permohonan perizinan, berita acara pengawasan, dokumentasi lapangan, serta catatan tindak lanjut pengaduan.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-700">
          <h2 className="text-lg font-semibold text-slate-900">3. Penggunaan Integrasi Google Drive</h2>
          <p>
            BIDI DLH menggunakan Google Drive API semata-mata untuk mengunggah, menyimpan, dan mengelola arsip dokumen resmi (seperti undangan sidang, berita acara pemeriksaan, dan dokumen perizinan) ke folder penyimpanan resmi instansi yang telah ditentukan.
          </p>
          <p>
            Aplikasi tidak mengakses, membaca, menjual, atau membagikan data pribadi pengguna Google lainnya di luar keperluan penyimpanan arsip dokumen aplikasi.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-slate-700">
          <h2 className="text-lg font-semibold text-slate-900">4. Keamanan Data</h2>
          <p>
            Akses ke sistem utama dibatasi melalui autentikasi petugas. Seluruh komunikasi data dilakukan melalui koneksi terenkripsi (HTTPS).
          </p>
        </section>

        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-sm">
          <Link href="/login" className="text-emerald-700 font-medium hover:underline">
            &larr; Kembali ke Halaman Login
          </Link>
          <span className="text-slate-400">BIDI DLH</span>
        </div>
      </div>
    </div>
  );
}
