import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, Building2, User, FileText, ArrowLeft, Printer, CheckCircle, XCircle } from 'lucide-react';

export default async function DetailArsipPage({ params }: { params: Promise<{ kategori: string, id: string }> }) {
  const { id, kategori } = await params;
  const decodedKategori = decodeURIComponent(kategori);
  const supabase = await createClient();

  // Fetch data
  const { data: agenda, error } = await supabase
    .from('pengawasan_lapangans')
    .select('*, bap_pengawasans(*)')
    .eq('id', id)
    .single();

  if (error || !agenda) {
    console.error('Error fetching detail:', error);
    notFound();
  }

  const isTaat = agenda.status_ketaatan === 'Taat';
  const isTidakTaat = agenda.status_ketaatan === 'Tidak Taat';

  return (
    <div className="min-h-screen bg-amber-50 selection:bg-amber-200 selection:text-amber-900 font-sans pb-20">
      
      {/* HEADER */}
      <div className="bg-amber-400 border-b-4 border-slate-900 pt-20 pb-10 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-20 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <Link 
            href="/pengawasan/arsip" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-900 rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:shadow-[2px_2px_0_0_#0f172a] hover:translate-y-[2px] transition-all font-black uppercase text-sm tracking-widest mb-8"
          >
            <ArrowLeft size={16} />
            Kembali ke Arsip
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-slate-900 text-amber-400 px-4 py-1 rounded-lg border-2 border-slate-900 text-sm font-black uppercase tracking-widest shadow-[4px_4px_0_0_rgba(255,255,255,0.3)]">
                  {decodedKategori}
                </span>
                {agenda.status_ketaatan && (
                  <span className={`px-4 py-1 rounded-lg border-2 text-sm font-black uppercase tracking-widest ${
                    isTaat 
                      ? 'bg-emerald-400 text-slate-900 border-slate-900 shadow-[4px_4px_0_0_#0f172a]' 
                      : isTidakTaat
                      ? 'bg-rose-400 text-slate-900 border-slate-900 shadow-[4px_4px_0_0_#0f172a]'
                      : 'bg-white text-slate-900 border-slate-900 shadow-[4px_4px_0_0_#0f172a]'
                  }`}>
                    {agenda.status_ketaatan}
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 drop-shadow-sm leading-tight">
                {agenda.nama_kegiatan}
              </h1>
              <p className="text-xl font-bold text-amber-900/80">
                {agenda.nama_pemrakarsa}
              </p>
            </div>

            <a 
              href={`/api/pengawasan/bap/${agenda.id}/generate`} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-indigo-400 hover:bg-indigo-500 text-slate-900 font-black uppercase tracking-widest px-6 py-4 rounded-xl border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a] hover:shadow-[3px_3px_0_0_#0f172a] hover:translate-y-[3px] transition-all whitespace-nowrap"
            >
              <Printer size={20} />
              Cetak BAP
            </a>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-4xl mx-auto px-6 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card Info Utama */}
          <div className="bg-white border-4 border-slate-900 rounded-3xl p-6 md:p-8 shadow-[8px_8px_0_0_#0f172a] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-bl-full -z-0 opacity-50"></div>
            
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-emerald-200 border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0_0_#0f172a]">
                <FileText size={20} className="text-slate-900" />
              </div>
              Informasi Utama
            </h2>

            <div className="space-y-6 relative z-10">
              <div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal Kunjungan</div>
                <div className="flex items-center gap-2 text-slate-800 font-bold bg-slate-50 border-2 border-slate-200 p-3 rounded-xl">
                  <Calendar size={18} className="text-emerald-500" />
                  {new Date(agenda.tanggal_kunjungan).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              <div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Alamat Lokasi</div>
                <div className="flex items-start gap-2 text-slate-800 font-bold bg-slate-50 border-2 border-slate-200 p-3 rounded-xl">
                  <MapPin size={18} className="text-rose-500 mt-0.5 shrink-0" />
                  <span>{agenda.alamat_lokasi || '-'}</span>
                </div>
              </div>

              {agenda.latitude && agenda.longitude && (
                <div>
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Koordinat GPS</div>
                  <div className="flex items-center gap-2 text-slate-800 font-bold bg-slate-50 border-2 border-slate-200 p-3 rounded-xl">
                    <MapPin size={18} className="text-indigo-500 shrink-0" />
                    <span>{agenda.latitude}, {agenda.longitude}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card Tim & Detail */}
          <div className="bg-white border-4 border-slate-900 rounded-3xl p-6 md:p-8 shadow-[8px_8px_0_0_#0f172a] relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100 rounded-bl-full -z-0 opacity-50"></div>
             
             <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-sky-200 border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0_0_#0f172a]">
                <User size={20} className="text-slate-900" />
              </div>
              Tim & Personal
            </h2>

            <div className="space-y-6 relative z-10">
              <div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pemrakarsa / Penanggung Jawab</div>
                <div className="flex items-center gap-2 text-slate-800 font-bold bg-slate-50 border-2 border-slate-200 p-3 rounded-xl">
                  <Building2 size={18} className="text-sky-500" />
                  {agenda.nama_pemrakarsa}
                </div>
              </div>

              <div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Saksi (Jika ada)</div>
                <div className="flex items-center gap-2 text-slate-800 font-bold bg-slate-50 border-2 border-slate-200 p-3 rounded-xl">
                  <User size={18} className="text-slate-400" />
                  {agenda.saksi || <span className="text-slate-400 italic font-normal">Tidak ada saksi</span>}
                </div>
              </div>

              <div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Tim Pengawas</div>
                <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-xl">
                  <ul className="space-y-2">
                    {agenda.tim_tugas ? agenda.tim_tugas.split('|').map((person: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm font-bold text-slate-700">
                        <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{person.trim()}</span>
                      </li>
                    )) : (
                      <span className="text-slate-400 italic font-normal text-sm">Tim belum ditentukan</span>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Info Tambahan */}
        <div className="mt-6 bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-[8px_8px_0_0_#cbd5e1] relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10">
            <Building2 size={200} />
          </div>
          
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3 relative z-10 text-amber-400">
            Status Data
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Token Verifikasi</div>
              <div className="font-mono text-lg font-bold text-white">{agenda.token || '-'}</div>
            </div>
            
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Dibuat Pada</div>
              <div className="text-sm font-bold text-white">
                {agenda.created_at ? new Date(agenda.created_at).toLocaleString('id-ID') : '-'}
              </div>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Diperbarui Pada</div>
              <div className="text-sm font-bold text-white">
                {agenda.updated_at ? new Date(agenda.updated_at).toLocaleString('id-ID') : '-'}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
