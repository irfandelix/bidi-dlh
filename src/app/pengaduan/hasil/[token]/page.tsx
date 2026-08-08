'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { MapPin, Calendar, Clock, FileText, User, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import LottieLoader from '@/components/LottieLoader';

const supabase = createClient();

export default function HasilVerlapPublikPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const { data: fetch, error } = await supabase
          .from('pengaduans')
          .select('*')
          .eq('token', token)
          .single();
          
        if (error || !fetch) {
          setErrorMsg('Data aduan tidak ditemukan atau token tidak valid.');
        } else {
          setData(fetch);
        }
      } catch (err: any) {
        setErrorMsg('Terjadi kesalahan koneksi jaringan.');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <LottieLoader size={24} />
        <h2 className="text-xl font-bold text-gray-700 uppercase mt-4">Memuat Laporan...</h2>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl shadow-sm border border-red-100 flex flex-col items-center text-center max-w-md w-full">
          <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">Terjadi Kesalahan</h2>
          <p>{errorMsg}</p>
        </div>
      </div>
    );
  }

  // Format Dates
  const tglAduan = data.tanggal_aduan ? new Date(data.tanggal_aduan).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) : '-';

  // Get fotos array (handle both old structure and new array structure)
  let fotosToPass = Array.isArray(data.foto_verlap_list) ? [...data.foto_verlap_list] : [];
  if (data.foto1_url && fotosToPass.length === 0) fotosToPass.push({ url: data.foto1_url, keterangan: data.ket_foto1 || '' });
  if (data.foto2_url && fotosToPass.length === 0) fotosToPass.push({ url: data.foto2_url, keterangan: data.ket_foto2 || '' });

  const hasVerlap = data.status_tahapan === 'Sudah Diverifikasi Lapangan' || data.catatan_verlap || data.hasil_verlap;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header / Kop */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-white text-center">
            <h1 className="text-2xl font-bold mb-2">Laporan Hasil Tindak Lanjut</h1>
            <p className="text-emerald-50 text-sm opacity-90 uppercase tracking-wider font-semibold">Dinas Lingkungan Hidup Kabupaten Sragen</p>
          </div>
          
          {/* Status Banner */}
          <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-center gap-2">
            {hasVerlap ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-emerald-800 text-sm uppercase tracking-wide">Telah Diverifikasi Lapangan</span>
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-amber-800 text-sm uppercase tracking-wide">Menunggu Verifikasi Lapangan</span>
              </>
            )}
          </div>

          <div className="p-6 md:p-8 space-y-8">
            
            {/* Informasi Aduan Asli */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                <FileText className="w-5 h-5 text-teal-600" />
                Informasi Aduan Masuk
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase mb-1">Pihak Terlapor</p>
                      <p className="text-sm font-semibold text-gray-900">{data.nama_terlapor || '-'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase mb-1">Tanggal Aduan</p>
                      <p className="text-sm font-semibold text-gray-900">{tglAduan}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 md:col-span-2">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase mb-1">Lokasi Aduan</p>
                      <p className="text-sm font-semibold text-gray-900">{data.lokasi_aduan || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 font-medium uppercase mb-2">Deskripsi Aduan (Perihal)</p>
                <div className="text-sm text-gray-800 font-medium mb-3 pb-3 border-b border-gray-200">
                  {data.perihal || '-'}
                </div>
                <p className="text-xs text-gray-500 font-medium uppercase mb-2">Detail Kronologi dari Pelapor</p>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {data.deskripsi || '-'}
                </div>
              </div>
            </div>

            {/* Hasil Verlap */}
            {hasVerlap && (
              <div className="pt-2">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Catatan Verifikasi Lapangan
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                    <p className="text-xs text-emerald-700 font-semibold uppercase mb-3">Tindak Lanjut & Kronologi</p>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {data.catatan_verlap || <span className="text-gray-400 italic">Tidak ada catatan kronologi.</span>}
                    </div>
                  </div>

                  <div className="bg-teal-50/50 p-5 rounded-2xl border border-teal-100">
                    <p className="text-xs text-teal-700 font-semibold uppercase mb-3">Hasil / Kesimpulan Verifikasi</p>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {data.hasil_verlap || <span className="text-gray-400 italic">Tidak ada hasil/kesimpulan.</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dokumentasi */}
            {fotosToPass.length > 0 && (
              <div className="pt-2">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Camera className="w-5 h-5 text-teal-600" />
                  Lampiran Dokumentasi
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fotosToPass.map((foto, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm group">
                      <div className="aspect-w-4 aspect-h-3 bg-gray-100 relative">
                        <img 
                          src={foto.url} 
                          alt={foto.keterangan || `Dokumentasi ${idx+1}`} 
                          className="object-cover w-full h-48 group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4 bg-gray-50 border-t border-gray-100">
                        <p className="text-sm text-gray-700 text-center font-medium">
                          {foto.keterangan || `Foto Dokumentasi ${idx+1}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
          
          <div className="bg-gray-50 p-4 border-t border-gray-100 text-center text-xs text-gray-400">
            Dihasilkan secara otomatis oleh Sistem BIDI DLH Sragen
          </div>
        </div>
      </div>
    </div>
  );
}
