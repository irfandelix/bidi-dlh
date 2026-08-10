import Link from "next/link";
import { FilePlus, List, FileText } from "lucide-react";

export default function PerizinanPage() {
  return (
    <div className="py-10 flex flex-col items-center">
      <div className="text-center space-y-4 mb-10 max-w-xl">
        <h1 className="text-3xl font-bold text-gray-900">Modul Perizinan</h1>
        <p className="text-gray-500">
          Silakan pilih menu untuk mendaftar perizinan baru atau melihat daftar proses perizinan yang sedang berjalan.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 w-full max-w-3xl">
        <Link 
          href="/perizinan/registrasi"
          className="flex items-start gap-4 p-6 bg-surface border border-gray-200 rounded-2xl hover:border-green-500 hover:shadow-lg transition-all"
        >
          <div className="bg-green-100 text-green-600 p-3 rounded-xl">
            <FilePlus size={28} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Registrasi Baru</h2>
            <p className="text-sm text-gray-500">Mulai tahap 1 permohonan perizinan baru (Pendaftaran Pemrakarsa).</p>
          </div>
        </Link>

        <Link 
          href="/perizinan/daftar"
          className="flex items-start gap-4 p-6 bg-surface border border-gray-200 rounded-2xl hover:border-green-500 hover:shadow-lg transition-all"
        >
          <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
            <List size={28} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Daftar Perizinan</h2>
            <p className="text-sm text-gray-500">Lihat dan proses perizinan (Uji Admin, Verlap, Pemeriksaan, dsb).</p>
          </div>
        </Link>

        <Link 
          href="/perizinan/nota-dinas"
          className="flex items-start gap-4 p-6 bg-surface border border-gray-200 rounded-2xl hover:border-purple-500 hover:shadow-lg transition-all md:col-span-2 lg:col-span-1"
        >
          <div className="bg-purple-100 text-purple-600 p-3 rounded-xl">
            <FileText size={28} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Nota Dinas</h2>
            <p className="text-sm text-gray-500">Buat Nota Dinas / Surat Tugas terkait kegiatan perizinan lingkungan.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
