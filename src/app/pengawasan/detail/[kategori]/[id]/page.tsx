import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, Building2, User, FileText, ArrowLeft, Printer, CheckCircle, Database } from 'lucide-react';

export default async function DetailArsipPage({ params }: { params: Promise<{ kategori: string, id: string }> }) {
  const { id, kategori } = await params;
  const decodedKategori = decodeURIComponent(kategori);
  const supabase = await createClient();

  // Fetch data
  const { data, error } = await supabase
    .from('pengawasan_lapangans')
    .select('*, bap_pengawasans(*)')
    .eq('id', id)
    .single();

  const agenda = data as any;

  if (error || !agenda) {
    console.error('Error fetching detail:', error);
    notFound();
  }

  const isTaat = agenda.status_ketaatan === 'Taat';
  const isTidakTaat = agenda.status_ketaatan === 'Tidak Taat';

  const bapRow = agenda.bap_pengawasans && agenda.bap_pengawasans.length > 0 ? agenda.bap_pengawasans[0] : null;
  let bapData: any = null;
  if (bapRow && bapRow.data_matriks_c) {
    bapData = bapRow.data_matriks_c;
    if (typeof bapData === 'string') {
      try { bapData = JSON.parse(bapData); } catch (e) {}
    }
  }
  const identitas = bapData?.formData || bapData?.identitas || {};

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER CARD */}
        <div className="bg-white border-4 border-slate-900 rounded-[2rem] p-6 md:p-8 shadow-[8px_8px_0_0_#0f172a] relative overflow-hidden">
          {/* Decorative Circle */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full border-4 border-slate-900 opacity-50"></div>
          
          <div className="flex flex-col md:flex-row gap-5 items-start relative z-10">
            <Link href="/pengawasan/arsip" className="w-16 h-16 shrink-0 bg-indigo-500 text-white rounded-2xl border-4 border-slate-900 flex items-center justify-center shadow-[4px_4px_0_0_#0f172a] hover:bg-indigo-600 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#0f172a] transition-all">
              <ArrowLeft size={32} />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-slate-900 text-amber-400 px-4 py-1 rounded-lg border-2 border-slate-900 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0_0_rgba(255,255,255,0.3)]">
                  {decodedKategori}
                </span>
                {agenda.status_ketaatan && (
                  <span className={`px-4 py-1 rounded-lg border-2 text-xs font-black uppercase tracking-widest ${
                    isTaat 
                      ? 'bg-emerald-400 text-slate-900 border-slate-900 shadow-[2px_2px_0_0_#0f172a]' 
                      : isTidakTaat
                      ? 'bg-rose-400 text-slate-900 border-slate-900 shadow-[2px_2px_0_0_#0f172a]'
                      : 'bg-white text-slate-900 border-slate-900 shadow-[2px_2px_0_0_#0f172a]'
                  }`}>
                    {agenda.status_ketaatan}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{agenda.nama_kegiatan}</h1>
              <p className="text-sm font-bold text-slate-600 mt-2 tracking-wide">{agenda.nama_pemrakarsa}</p>
              
              <div className="flex flex-wrap gap-3 mt-6">
                <a 
                  href={`/api/pengawasan/bap/${agenda.id}/generate`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-sm uppercase tracking-widest border-[3px] border-slate-900 rounded-xl shadow-[4px_4px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#0f172a] transition-all"
                >
                  <Printer size={18} /> Cetak BAP
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card Info Utama */}
          <div className="bg-white border-4 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0_0_#0f172a] relative overflow-hidden">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 border-[3px] border-slate-900 flex items-center justify-center shadow-[2px_2px_0_0_#0f172a]">
                <FileText size={18} className="text-emerald-700" />
              </div>
              Informasi Utama
            </h2>

            <div className="space-y-4 relative z-10">
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal Kunjungan</div>
                <div className="flex items-center gap-2 text-slate-800 font-bold bg-slate-50 border-2 border-slate-200 p-2.5 rounded-xl text-sm">
                  <Calendar size={16} className="text-emerald-500" />
                  {new Date(agenda.tanggal_kunjungan).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alamat Lokasi</div>
                <div className="flex items-start gap-2 text-slate-800 font-bold bg-slate-50 border-2 border-slate-200 p-2.5 rounded-xl text-sm">
                  <MapPin size={16} className="text-rose-500 mt-0.5 shrink-0" />
                  <span>{agenda.alamat_lokasi || '-'}</span>
                </div>
              </div>

              {agenda.latitude && agenda.longitude && (
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Koordinat GPS</div>
                  <div className="flex items-center gap-2 text-slate-800 font-bold bg-slate-50 border-2 border-slate-200 p-2.5 rounded-xl text-sm">
                    <MapPin size={16} className="text-indigo-500 shrink-0" />
                    <span>{agenda.latitude}, {agenda.longitude}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card Tim & Detail */}
          <div className="bg-white border-4 border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0_0_#0f172a] relative overflow-hidden">
             <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-sky-100 border-[3px] border-slate-900 flex items-center justify-center shadow-[2px_2px_0_0_#0f172a]">
                <User size={18} className="text-sky-700" />
              </div>
              Tim & Personal
            </h2>

            <div className="space-y-4 relative z-10">
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pemrakarsa / Penanggung Jawab</div>
                <div className="flex items-center gap-2 text-slate-800 font-bold bg-slate-50 border-2 border-slate-200 p-2.5 rounded-xl text-sm">
                  <Building2 size={16} className="text-sky-500" />
                  {agenda.nama_pemrakarsa}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saksi (Jika ada)</div>
                <div className="flex items-center gap-2 text-slate-800 font-bold bg-slate-50 border-2 border-slate-200 p-2.5 rounded-xl text-sm">
                  <User size={16} className="text-slate-400" />
                  {agenda.saksi || <span className="text-slate-400 italic font-normal">Tidak ada saksi</span>}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tim Pengawas</div>
                <div className="bg-slate-50 border-2 border-slate-200 p-3 rounded-xl">
                  <ul className="space-y-1.5">
                    {agenda.tim_tugas ? agenda.tim_tugas.split('|').map((person: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-xs font-bold text-slate-700">
                        <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{person.trim()}</span>
                      </li>
                    )) : (
                      <span className="text-slate-400 italic font-normal text-xs">Tim belum ditentukan</span>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* TABEL IDENTITAS */}
        {Object.keys(identitas).length > 0 && (
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
                    <th className="px-6 py-4 border-r-4 border-slate-900 w-1/3">Variabel</th>
                    <th className="px-6 py-4">Nilai Data</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(identitas).map(([key, value], idx) => (
                    <tr key={key} className={`border-b-2 border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} last:border-b-0`}>
                      <td className="px-6 py-4 font-bold text-slate-700 border-r-4 border-slate-900 bg-slate-100">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </td>
                      <td className="px-6 py-4 text-slate-900 font-medium">
                        {value ? String(value) : <span className="text-slate-400 italic">Kosong</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Tambahan */}
        <div className="bg-slate-900 text-white rounded-[2rem] p-6 md:p-8 shadow-[8px_8px_0_0_#cbd5e1] relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10">
            <Building2 size={200} />
          </div>
          
          <h2 className="text-xl font-black mb-6 flex items-center gap-3 relative z-10 text-amber-400">
            Status Data
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Token Verifikasi</div>
              <div className="font-mono text-base font-bold text-white">{agenda.token || '-'}</div>
            </div>
            
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dibuat Pada</div>
              <div className="text-sm font-bold text-white">
                {agenda.created_at ? new Date(agenda.created_at).toLocaleString('id-ID') : '-'}
              </div>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Diperbarui Pada</div>
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
