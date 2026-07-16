'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import Link from 'next/link';
import { ArrowLeft, Save, MapPin, X, Plus, PlusCircle, AlertCircle, RefreshCcw, Trash2 } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { getTemplate } from './templates';

export default function BAPFormPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [agenda, setAgenda] = useState<any>(null);
  const [timTugas, setTimTugas] = useState<string[]>([]);
  const [saksiTugas, setSaksiTugas] = useState<string[]>([]);
  const [kategori, setKategori] = useState('');
  const isIndustri = kategori.toLowerCase().includes('industri');
  const isFasyankes = kategori.toLowerCase().includes('fasyankes') || kategori.toLowerCase().includes('kesehatan');
  const isPerumahan = kategori.toLowerCase().includes('perumahan');
  const isTokoModern = kategori.toLowerCase().includes('toko') || kategori.toLowerCase().includes('pasar');
  const isSPPG = kategori.toLowerCase().includes('sppg');

  // Refs for signatures
  const sigPemrakarsaRef = useRef<any>(null);
  const parafPemrakarsaRef = useRef<any>(null);
  const sigTimRefs = useRef<any[]>([]);
  const parafTimRefs = useRef<any[]>([]);
  const sigSaksiRefs = useRef<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    waktu_pengawasan: '',
    kbli: '', alamat: '', tahun_operasi: '', status_permodalan: '',
    pj_nama: '', pj_jabatan: '', telepon: '', koordinat: '',
    batas_utara: '', batas_selatan: '', batas_barat: '', batas_timur: '',
    luas_total: '', luas_terbangun: '', luas_terbuka: '', luas_bangunan: '',
    // Fasyankes Operational
    kapasitas_izin: '', kapasitas_riil: '', jumlah_karyawan: '', jumlah_pasien: '',
    shift_kerja: '', hari_kerja_minggu: '',
    teknologi_air_limbah: '', volume_air_limbah: '', pemanfaatan_air_tanah: '',
    penggunaan_air_liter: '', penggunaan_energi: '',
    debit_inlet: '', debit_outlet: '',
    // Industri Operational
    kapasitas_produksi: '', jenis_produk: '', bahan_baku_utama: '', bahan_penolong: '',
    proses_produksi: '', energi: '', pembuangan_air: '', pengelolaan_sampah_umum: '',
    pengelolaan_b3_umum: '', sumber_air_bersih: '', persetujuan_teknis: '', slo: '',
    sertifikasi_iso: '', struktur_organisasi: '', jam_produksi: '', hari_kerja: '',
    penggunaan_air_per_hari: '', nilai_investasi: '',
    // Perumahan Operational
    jumlah_pekerja: '', jumlah_penghuni: '', jam_kerja_hari: '', shift_kerja_konstruksi: '',
    // Toko Modern Operational
    kapasitas_kegiatan: '', jumlah_karyawan_pengunjung: '',
    // Shared
    dokumen_dimiliki: '', persetujuan_lingkungan: '',
    riwayat_ketaatan: '', inspeksi_terakhir: ''
  });

  const [saksiDetails, setSaksiDetails] = useState<{jabatan: string, telepon: string}[]>([]);

  const [listPerwakilan, setListPerwakilan] = useState([{ id: Date.now(), nama: '', jabatan: '', telepon: '' }]);
  const sigPerwakilanRefs = useRef<any>({});
  const parafPerwakilanRefs = useRef<any>({});

  const [listDokumen, setListDokumen] = useState([{ id: Date.now(), value: '' }]);
  const [listFoto, setListFoto] = useState([{ id: Date.now(), file: null as any, base64: '', keterangan: '' }]);
  const [listSaran, setListSaran] = useState([{ id: Date.now(), value: '' }]);
  const [komponenPenilaian, setKomponenPenilaian] = useState([{ id: Date.now(), nama: '', nilai: '' }]);
  
  const [checklist, setChecklist] = useState<any[]>([]);

  useEffect(() => {
    fetchAgenda();
  }, [id]);

  const fetchAgenda = async () => {
    try {
      const { data, error } = await supabase
        .from('pengawasan_lapangans')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      const agendaData = data as any;
      setAgenda(agendaData);
      setKategori(agendaData.kategori || '');
      
      // Initialize checklist based on kategori
      const template = getTemplate(agendaData.kategori);
      setChecklist(template.map(cat => ({
        bab: cat.bab,
        items: cat.items.map(item => ({ key: item.key || item.point, point: item.point, no: item.no, kondisi: '', keterangan: '' }))
      })));
      
      if (agendaData.tim_tugas) {
        let parsedTim: string[] = [];
        try { parsedTim = JSON.parse(agendaData.tim_tugas); } 
        catch { parsedTim = agendaData.tim_tugas.split('|').map((t: string) => t.trim()).filter((t: string) => t !== ''); }
        setTimTugas(parsedTim);
        sigTimRefs.current = parsedTim.map(() => null);
        parafTimRefs.current = parsedTim.map(() => null);
      }
      
      if (agendaData.saksi) {
        let parsedSaksi: string[] = [];
        try { parsedSaksi = JSON.parse(agendaData.saksi); } 
        catch { parsedSaksi = agendaData.saksi.split('|').map((t: string) => t.trim()).filter((t: string) => t !== ''); }
        setSaksiTugas(parsedSaksi);
        sigSaksiRefs.current = parsedSaksi.map(() => null);
        setSaksiDetails(parsedSaksi.map(() => ({ jabatan: '', telepon: '' })));
      }
      
      setFormData(prev => ({
        ...prev,
        koordinat: (agendaData.latitude && agendaData.longitude) ? `${agendaData.latitude}, ${agendaData.longitude}` : ''
      }));

    } catch (error) {
      console.error('Error fetching agenda:', error);
      alert('Gagal memuat data agenda.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => { setFormData({ ...formData, koordinat: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}` }); },
        () => alert('Gagal akses GPS. Pastikan izin lokasi aktif.'),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else { alert('GPS Tidak didukung.'); }
  };

  const handleFileChange = (index: number, file: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);

          const newList = [...listFoto];
          newList[index].file = file;
          newList[index].base64 = compressedBase64;
          setListFoto(newList);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const totalSkor = () => {
    const validScores = komponenPenilaian.filter(k => k.nilai !== '' && !isNaN(Number(k.nilai)));
    if (validScores.length === 0) return 0;
    const sum = validScores.reduce((acc, curr) => acc + Number(curr.nilai), 0);
    return Math.round((sum / validScores.length) * 100) / 100;
  };

  const finalStatus = () => {
    const skor = totalSkor();
    if (skor === 0 || isNaN(skor)) return 'Belum Ada Nilai';
    if (skor > 100) return 'CEK INPUT';
    if (skor >= 70) return 'Taat';
    if (skor >= 50) return 'Taat dengan Catatan';
    return 'Tidak Taat';
  };

    const [savingText, setSavingText] = useState('Menyimpan Data...');

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setSavingText('Menyimpan ke Database...');
      try {
        const ttdPemrakarsa = sigPemrakarsaRef.current && !sigPemrakarsaRef.current.isEmpty() ? sigPemrakarsaRef.current.getTrimmedCanvas().toDataURL('image/png') : null;
        const prfPemrakarsa = parafPemrakarsaRef.current && !parafPemrakarsaRef.current.isEmpty() ? parafPemrakarsaRef.current.getTrimmedCanvas().toDataURL('image/png') : null;
        const ttdTim = sigTimRefs.current.map(ref => ref && !ref.isEmpty() ? ref.getTrimmedCanvas().toDataURL('image/png') : null);
        const prfTim = parafTimRefs.current.map(ref => ref && !ref.isEmpty() ? ref.getTrimmedCanvas().toDataURL('image/png') : null);
  
        const payload = {
          bap: {
            identitas: formData,
            dokumen_izin: listDokumen.map(d => d.value).filter(v => v !== ''),
            checklist: checklist,
            dokumentasi: listFoto.map(f => ({ keterangan: f.keterangan, file: f.base64 })),
            saran: listSaran.map(s => s.value).filter(v => v !== ''),
            rincian_skoring: komponenPenilaian,
            perwakilan: listPerwakilan.map(p => ({
              nama: p.nama,
              jabatan: p.jabatan,
              telepon: p.telepon,
              ttd: sigPerwakilanRefs.current[p.id] && !sigPerwakilanRefs.current[p.id].isEmpty() ? sigPerwakilanRefs.current[p.id].getTrimmedCanvas().toDataURL('image/png') : null,
              paraf: parafPerwakilanRefs.current[p.id] && !parafPerwakilanRefs.current[p.id].isEmpty() ? parafPerwakilanRefs.current[p.id].getTrimmedCanvas().toDataURL('image/png') : null
            })),
            ttd_pemrakarsa: ttdPemrakarsa,
            paraf_pemrakarsa: prfPemrakarsa,
            ttd_tim: ttdTim,
            paraf_tim: prfTim,
            saksi_details: saksiDetails,
            ttd_saksi: sigSaksiRefs.current.map(ref => ref && !ref.isEmpty() ? ref.getTrimmedCanvas().toDataURL('image/png') : null)
          },
          status_ketaatan: finalStatus(),
          total_skor: totalSkor()
        };
  
        const res = await fetch(`/api/pengawasan/bap/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
  
        if (!res.ok) {
          let errMessage = 'Gagal menyimpan BAP';
          try {
            const errData = await res.json();
            errMessage = errData.error || errData.message || errMessage;
          } catch {
            errMessage += ` (Status Code: ${res.status})`;
          }
          throw new Error(errMessage);
        }

        // --- GOOGLE DRIVE UPLOAD ---
        setSavingText('Mengunggah BAP & Foto ke Google Drive...');
        const uploadRes = await fetch(`/api/pengawasan/bap/${id}/upload`, {
          method: 'POST'
        });

        if (!uploadRes.ok) {
          let errMessage = 'Gagal mengunggah ke Google Drive';
          try {
            const errData = await uploadRes.json();
            errMessage = errData.error || errData.message || errMessage;
          } catch {
            errMessage += ` (Status Code: ${uploadRes.status})`;
          }
          alert(`BAP berhasil disimpan di database, namun GAGAL diunggah ke Google Drive: ${errMessage}`);
        } else {
          alert('BAP Lapangan berhasil disimpan dan diunggah ke Google Drive!');
        }
  
        router.push('/pengawasan/arsip');
      } catch (error: any) {
        console.error(error);
        alert(error.message);
      } finally {
        setSaving(false);
      }
    };

  if (loading) return <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center font-black text-xl animate-pulse text-slate-400 uppercase tracking-widest">Memuat Form...</div>;
  if (!agenda) return <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center font-black text-xl text-rose-500 uppercase tracking-widest">Agenda Tidak Ditemukan</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 relative">
      <div className="sticky top-0 z-40 bg-white border-b-4 border-slate-900 px-4 py-4 shadow-[0_4px_0_0_#0f172a]">
        <div className="flex items-center gap-4 mb-3 max-w-3xl mx-auto">
          <Link href="/pengawasan/agenda" className="w-10 h-10 rounded-xl bg-white text-slate-900 border-4 border-slate-900 flex items-center justify-center hover:bg-teal-400 hover:-translate-y-1 hover:shadow-[2px_2px_0_0_#0f172a] transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">BAP {kategori || 'Sektor'}</h2>
            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{agenda.nama_pemrakarsa}</p>
          </div>
          <span className="text-xs font-black px-3 py-1.5 bg-indigo-100 text-indigo-900 rounded-lg border-4 border-indigo-900 shadow-[2px_2px_0_0_#312e81]">
            STEP {step}/5
          </span>
        </div>
        <div className="w-full max-w-3xl mx-auto bg-slate-200 rounded-full h-3 border-2 border-slate-900 overflow-hidden mt-2">
          <div className="bg-teal-500 h-full transition-all duration-500 ease-out border-r-2 border-slate-900" style={{ width: `${(step / 5) * 100}%` }}></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 md:p-6 max-w-3xl mx-auto">
        
        {/* STEP 1 */}
        <div className={`${step === 1 ? 'block' : 'hidden'} animate-in fade-in slide-in-from-right-4 duration-300`}>
          <div className="bg-indigo-50 border-4 border-indigo-900 p-4 rounded-2xl mb-6 shadow-[4px_4px_0_0_#312e81]">
            <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-2">Tim Pengawas Lapangan</h3>
            <div className="bg-white p-3 rounded-xl border-2 border-indigo-900">
              <p className="font-black text-slate-900 text-sm">{timTugas.join(', ')}</p>
              <p className="text-indigo-600 text-xs font-bold mt-1 uppercase tracking-wider">DLH Kab. Sragen</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] mb-6">
            <label className="block text-[10px] font-black text-slate-900 uppercase mb-2 tracking-widest flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-500" /> Jam Mulai Pengawasan
            </label>
            <input 
              type="time" 
              name="waktu_pengawasan" 
              required
              value={formData.waktu_pengawasan} 
              onChange={handleChange} 
              className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-lg font-black focus:bg-teal-50 focus:outline-none" 
            />
            <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-widest">*Waktu ini akan dicetak pada kalimat pembuka BAP.</p>
          </div>

          <h3 className="font-black text-slate-900 mb-4 border-l-8 border-teal-500 pl-3 uppercase tracking-widest text-lg">A & B. Identitas Lokasi</h3>
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-900 uppercase mb-1 tracking-widest">{isSPPG ? 'Nama Fasilitas / SPPG' : isTokoModern ? 'Nama Toko Modern / Pasar' : isPerumahan ? 'Nama Perumahan / Pengembang' : 'Nama Usaha / Kegiatan'}</label>
                <input type="text" value={agenda.nama_pemrakarsa} readOnly className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold bg-slate-100 mb-4" />
                
                <label className="block text-[10px] font-black text-slate-900 uppercase mb-1 tracking-widest">Kode KBLI</label>
                <input type="text" name="kbli" value={formData.kbli} onChange={handleChange} placeholder="Ketik Kode KBLI..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm mb-3 font-bold focus:bg-teal-50 focus:outline-none" />
                
                <label className="block text-[10px] font-black text-slate-900 uppercase mb-1 tracking-widest">Alamat Lengkap</label>
                <textarea name="alamat" value={formData.alamat} onChange={handleChange} rows={2} placeholder="Alamat lengkap lokasi..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-teal-50 focus:outline-none"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-900 uppercase mb-1 tracking-widest">Tahun Operasi</label>
                  <input type="number" name="tahun_operasi" value={formData.tahun_operasi} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-teal-50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-900 uppercase mb-1 tracking-widest">Permodalan</label>
                  <input type="text" name="status_permodalan" value={formData.status_permodalan} onChange={handleChange} placeholder={isIndustri ? "PMDN/PMA" : (isPerumahan || isSPPG) ? "PMDN/Swasta" : "Pemerintah/Swasta"} className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-teal-50 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-900 uppercase mb-1 tracking-widest">{isSPPG ? 'Penanggung Jawab Fasilitas' : isTokoModern ? 'Penanggung Jawab Usaha' : isPerumahan ? 'Penanggung Jawab Perumahan' : 'Penanggung Jawab'}</label>
                <div className="flex gap-3">
                  <div className="w-2/3">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nama Lengkap</label>
                    <input type="text" name="pj_nama" value={formData.pj_nama} onChange={handleChange} placeholder="Nama Lengkap" className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-teal-50 focus:outline-none" />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jabatan</label>
                    <input type="text" name="pj_jabatan" value={formData.pj_jabatan} onChange={handleChange} placeholder="Jabatan" className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-teal-50 focus:outline-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-900 uppercase mb-1 tracking-widest">No. Telp / Fax</label>
                <input type="text" name="telepon" value={formData.telepon} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-teal-50 focus:outline-none" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] space-y-4">
              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest">Koordinat & Batas Wilayah</label>
              <div className="flex gap-3">
                <input type="text" name="koordinat" value={formData.koordinat} readOnly placeholder="Ketuk pin GPS 👉" className="flex-1 px-4 py-3 rounded-xl border-4 border-slate-900 bg-slate-100 text-xs font-mono font-bold" />
                <button type="button" onClick={handleLocation} className="bg-indigo-500 hover:bg-indigo-600 border-4 border-slate-900 text-white w-12 h-12 flex items-center justify-center rounded-xl shadow-[4px_4px_0_0_#0f172a] transition-all active:translate-y-1 active:shadow-none">
                  <MapPin size={20} />
                </button>
              </div>
              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mt-4">Batas Wilayah Sekitar</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Batas Utara</label>
                  <input type="text" name="batas_utara" value={formData.batas_utara} onChange={handleChange} placeholder="Misal: Jalan Raya..." className="w-full px-4 py-3 border-4 border-slate-900 rounded-xl text-xs font-bold focus:bg-teal-50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Batas Selatan</label>
                  <input type="text" name="batas_selatan" value={formData.batas_selatan} onChange={handleChange} placeholder="Misal: Pemukiman..." className="w-full px-4 py-3 border-4 border-slate-900 rounded-xl text-xs font-bold focus:bg-teal-50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Batas Barat</label>
                  <input type="text" name="batas_barat" value={formData.batas_barat} onChange={handleChange} placeholder="Misal: Lahan Kosong..." className="w-full px-4 py-3 border-4 border-slate-900 rounded-xl text-xs font-bold focus:bg-teal-50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Batas Timur</label>
                  <input type="text" name="batas_timur" value={formData.batas_timur} onChange={handleChange} placeholder="Misal: Sungai..." className="w-full px-4 py-3 border-4 border-slate-900 rounded-xl text-xs font-bold focus:bg-teal-50 focus:outline-none" />
                </div>
              </div>
              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mt-4">Luas Area (m2)</label>
              <div className={`grid ${isFasyankes ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Luas Total Lahan</label>
                  <input type="text" name="luas_total" value={formData.luas_total} onChange={handleChange} placeholder="Misal: 1000..." className="w-full px-3 py-3 border-4 border-slate-900 rounded-xl text-xs font-bold focus:bg-teal-50 focus:outline-none" />
                </div>
                {(isPerumahan || isTokoModern || isSPPG) ? (
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Luas Bangunan</label>
                    <input type="text" name="luas_bangunan" value={formData.luas_bangunan} onChange={handleChange} placeholder="Misal: 500..." className="w-full px-3 py-3 border-4 border-slate-900 rounded-xl text-xs font-bold focus:bg-teal-50 focus:outline-none" />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Luas Terbangun</label>
                    <input type="text" name="luas_terbangun" value={formData.luas_terbangun} onChange={handleChange} placeholder="Misal: 600..." className="w-full px-3 py-3 border-4 border-slate-900 rounded-xl text-xs font-bold focus:bg-teal-50 focus:outline-none" />
                  </div>
                )}
                {isFasyankes && (
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Luas Terbuka Hijau</label>
                    <input type="text" name="luas_terbuka" value={formData.luas_terbuka} onChange={handleChange} placeholder="Misal: 400..." className="w-full px-3 py-3 border-4 border-slate-900 rounded-xl text-xs font-bold focus:bg-teal-50 focus:outline-none" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2 */}
        <div className={`${step === 2 ? 'block' : 'hidden'} animate-in fade-in slide-in-from-right-4 duration-300`}>
          <h3 className="font-black text-slate-900 mb-4 border-l-8 border-indigo-500 pl-3 uppercase tracking-widest text-lg">B. Operasional & Utilitas</h3>
          <div className="space-y-6">
            
            {/* KAPASITAS FASYANKES VS INDUSTRI */}
            <div className="bg-white p-5 rounded-2xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] space-y-4">
              {isIndustri ? (
                <div>
                  <label className="block text-[10px] font-black text-slate-900 uppercase mb-1 tracking-widest">Kapasitas Produksi</label>
                  <textarea name="kapasitas_produksi" value={formData.kapasitas_produksi} onChange={handleChange} rows={2} placeholder="Kapasitas Produksi..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none mb-3"></textarea>
                  <label className="block text-[10px] font-black text-slate-900 uppercase mb-1 tracking-widest">Jenis Produk</label>
                  <textarea name="jenis_produk" value={formData.jenis_produk} onChange={handleChange} rows={2} placeholder="Jenis Produk..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                </div>
              ) : isPerumahan ? (
                <div>
                  <label className="block text-[10px] font-black text-slate-900 uppercase mb-1 tracking-widest">Kapasitas (Jumlah & Tipe Rumah)</label>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Sesuai Izin</label>
                      <textarea name="kapasitas_izin" value={formData.kapasitas_izin} onChange={handleChange} rows={2} placeholder="Misal: 100 Unit Tipe 36..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Kondisi Riil Terbangun</label>
                      <textarea name="kapasitas_riil" value={formData.kapasitas_riil} onChange={handleChange} rows={2} placeholder="Kondisi Riil Terbangun..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                    </div>
                  </div>
                </div>
              ) : (isTokoModern || isSPPG) ? (
                <div>
                  <label className="block text-[10px] font-black text-slate-900 uppercase mb-1 tracking-widest">Kapasitas Kegiatan</label>
                  <input type="text" name="kapasitas_kegiatan" value={formData.kapasitas_kegiatan} onChange={handleChange} placeholder="Kapasitas (Jumlah Kios/Los/Area Belanja)..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none" />
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-black text-slate-900 uppercase mb-1 tracking-widest">Kapasitas (TT)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Sesuai Izin</label>
                      <input type="text" name="kapasitas_izin" value={formData.kapasitas_izin} onChange={handleChange} placeholder="Sesuai Izin" className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Kondisi Riil</label>
                      <input type="text" name="kapasitas_riil" value={formData.kapasitas_riil} onChange={handleChange} placeholder="Riil" className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {isIndustri ? (
                <div>
                  <label className="block text-[10px] font-black text-slate-900 uppercase mb-1 tracking-widest">Populasi & Operasional</label>
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jumlah Karyawan</label>
                        <input type="text" name="jumlah_karyawan" value={formData.jumlah_karyawan} onChange={handleChange} placeholder="Total Pekerja" className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jam/Shift Kerja</label>
                        <input type="text" name="shift_kerja" value={formData.shift_kerja} onChange={handleChange} placeholder="Jam/Shift Kerja" className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none" />
                      </div>
                    </div>
                  </div>
                  <label className="block text-[10px] font-black text-slate-900 uppercase mb-1 tracking-widest">Proses & Energi</label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Bahan Baku Utama</label>
                      <textarea name="bahan_baku_utama" value={formData.bahan_baku_utama} onChange={handleChange} rows={2} placeholder="Bahan Baku Utama..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Bahan Baku Penolong</label>
                      <textarea name="bahan_penolong" value={formData.bahan_penolong} onChange={handleChange} rows={2} placeholder="Bahan Baku Penolong..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Proses Produksi</label>
                      <textarea name="proses_produksi" value={formData.proses_produksi} onChange={handleChange} rows={3} placeholder="Proses Produksi..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Energi yang Digunakan</label>
                      <textarea name="energi" value={formData.energi} onChange={handleChange} rows={2} placeholder="Energi yang digunakan..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                    </div>
                  </div>
                </div>
              ) : isPerumahan ? (
                <div>
                  <label className="block text-[10px] font-black text-slate-900 uppercase mb-1 tracking-widest">Pekerja (Konstruksi) & Penghuni</label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jumlah Pekerja (Fase Konstruksi)</label>
                      <textarea name="jumlah_pekerja" value={formData.jumlah_pekerja} onChange={handleChange} rows={2} placeholder="Jumlah Pekerja (Fase Konstruksi)..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jumlah Penghuni (Pasca Konstruksi)</label>
                      <textarea name="jumlah_penghuni" value={formData.jumlah_penghuni} onChange={handleChange} rows={2} placeholder="Jumlah Penghuni (Pasca Konstruksi)..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jam Kerja/Hari</label>
                        <input type="number" name="jam_kerja_hari" value={formData.jam_kerja_hari} onChange={handleChange} placeholder="Misal: 8" className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Hari Kerja/Minggu</label>
                        <input type="number" name="hari_kerja_minggu" value={formData.hari_kerja_minggu} onChange={handleChange} placeholder="Misal: 6" className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Shift Kerja Konstruksi</label>
                      <textarea name="shift_kerja_konstruksi" value={formData.shift_kerja_konstruksi} onChange={handleChange} rows={2} placeholder="Jam Shift Kerja untuk Konstruksi..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                    </div>
                  </div>
                </div>
              ) : (isTokoModern || isSPPG) ? (
                <div>
                  <label className="block text-[10px] font-black text-slate-900 uppercase mb-1 tracking-widest">Populasi (Pekerja & Pengunjung)</label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jumlah Karyawan & Pengunjung</label>
                      <input type="text" name="jumlah_karyawan_pengunjung" value={formData.jumlah_karyawan_pengunjung} onChange={handleChange} placeholder="Jumlah Pekerja dan Pengunjung per hari..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jam Operasional / Shift</label>
                        <textarea name="shift_kerja" value={formData.shift_kerja} onChange={handleChange} rows={2} placeholder="Jam Operasional / Jam Shift Kerja / Hari..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Hari Kerja / Minggu</label>
                        <input type="number" name="hari_kerja_minggu" value={formData.hari_kerja_minggu} onChange={handleChange} placeholder="Jumlah hari buka dalam 1 minggu..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-black text-slate-900 uppercase mb-1 tracking-widest">Populasi & Waktu</label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Total Pekerja</label>
                        <input type="text" name="jumlah_karyawan" value={formData.jumlah_karyawan} onChange={handleChange} placeholder="Total Pekerja" className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Pasien / Hari</label>
                        <input type="text" name="jumlah_pasien" value={formData.jumlah_pasien} onChange={handleChange} placeholder="Pasien/Hari" className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jam/Shift Kerja</label>
                      <input type="text" name="shift_kerja" value={formData.shift_kerja} onChange={handleChange} placeholder="Jam/Shift Kerja" className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Hari Kerja / Minggu</label>
                      <input type="text" name="hari_kerja_minggu" value={formData.hari_kerja_minggu} onChange={handleChange} placeholder="Jumlah Hari Kerja/Minggu" className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* UTILITAS / LINGKUNGAN */}
            <div className="bg-white p-5 rounded-2xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] space-y-4">
              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest">Pengelolaan Lingkungan (Umum)</label>
              <div className="space-y-3">
              {isIndustri ? (
                <>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Pembuangan Air Limbah</label>
                    <textarea name="pembuangan_air" value={formData.pembuangan_air} onChange={handleChange} rows={2} placeholder="Pembuangan Air Limbah..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Debit Inlet (m3/hari)</label>
                      <input type="text" name="debit_inlet" value={formData.debit_inlet} onChange={handleChange} placeholder="Misal: 153,84" className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Debit Outlet (m3/hari)</label>
                      <input type="text" name="debit_outlet" value={formData.debit_outlet} onChange={handleChange} placeholder="Misal: 100" className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Pengelolaan Sampah Domestik</label>
                    <textarea name="pengelolaan_sampah_umum" value={formData.pengelolaan_sampah_umum} onChange={handleChange} rows={2} placeholder="Sampah Domestik..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Pengelolaan Limbah B3</label>
                    <textarea name="pengelolaan_b3_umum" value={formData.pengelolaan_b3_umum} onChange={handleChange} rows={2} placeholder="Limbah B3..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Sumber Air Bersih</label>
                    <textarea name="sumber_air_bersih" value={formData.sumber_air_bersih} onChange={handleChange} rows={2} placeholder="Sumber Air Bersih..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Teknologi Pengelolaan Air Limbah (IPAL/Septictank)</label>
                    <textarea name="teknologi_air_limbah" value={formData.teknologi_air_limbah} onChange={handleChange} rows={2} placeholder="Teknologi IPAL/Septictank..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Volume Air Limbah</label>
                    <input type="text" name="volume_air_limbah" value={formData.volume_air_limbah} onChange={handleChange} placeholder="Volume Air Limbah (m3/hari)" className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Pemanfaatan Air (Sumur/PDAM)</label>
                    <textarea name="pemanfaatan_air_tanah" value={formData.pemanfaatan_air_tanah} onChange={handleChange} rows={2} placeholder="Pemanfaatan Air (Sumur/PDAM)..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Penggunaan Air (Liter/Hari)</label>
                    <input type="text" name="penggunaan_air_liter" value={formData.penggunaan_air_liter} onChange={handleChange} placeholder="Penggunaan Air (L/Hari)" className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Penggunaan Energi (Listrik/Genset)</label>
                    <textarea name="penggunaan_energi" value={formData.penggunaan_energi} onChange={handleChange} rows={2} placeholder="Energi Listrik / Genset..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                  </div>
                </>
              )}
              </div>
            </div>

            {/* DOKUMEN & PERIZINAN */}
            <div className="bg-white p-5 rounded-2xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] space-y-4">
              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest">Dokumen, Perizinan & Tenaga Kerja</label>
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Dokumen Yang Dimiliki</label>
                  <textarea name="dokumen_dimiliki" value={formData.dokumen_dimiliki} onChange={handleChange} rows={2} placeholder={(isPerumahan || isSPPG) ? "Dokumen yang dimiliki (UKL-UPL, SPPL)..." : "Dokumen yang dimiliki..."} className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Persetujuan Lingkungan</label>
                  <textarea name="persetujuan_lingkungan" value={formData.persetujuan_lingkungan} onChange={handleChange} rows={2} placeholder="Persetujuan Lingkungan..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                </div>
                
                {isIndustri && (
                  <>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Persetujuan Teknis</label>
                      <textarea name="persetujuan_teknis" value={formData.persetujuan_teknis} onChange={handleChange} rows={2} placeholder="Persetujuan Teknis..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">SLO</label>
                      <input type="text" name="slo" value={formData.slo} onChange={handleChange} placeholder="SLO..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Sertifikasi ISO</label>
                      <textarea name="sertifikasi_iso" value={formData.sertifikasi_iso} onChange={handleChange} rows={2} placeholder="Sertifikasi ISO..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                    </div>
                    
                    <div className="pt-4 mt-4 border-t-4 border-slate-900 space-y-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Struktur Organisasi (Jabatan & Nama)</label>
                        <textarea name="struktur_organisasi" value={formData.struktur_organisasi} onChange={handleChange} rows={2} placeholder="Struktur Organisasi (Jabatan & Nama)..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jumlah Karyawan</label>
                        <textarea name="jumlah_karyawan" value={formData.jumlah_karyawan} onChange={handleChange} rows={2} placeholder="Jumlah Karyawan..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jam Shift Kerja / Hari</label>
                        <textarea name="shift_kerja" value={formData.shift_kerja} onChange={handleChange} rows={2} placeholder="Jam Shift Kerja / Hari..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jam Produksi / Hari</label>
                        <textarea name="jam_produksi" value={formData.jam_produksi} onChange={handleChange} rows={2} placeholder="Jumlah jam produksi / hari..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Hari Kerja / Minggu</label>
                        <textarea name="hari_kerja" value={formData.hari_kerja} onChange={handleChange} rows={2} placeholder="Jumlah hari kerja / minggu..." className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none"></textarea>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Penggunaan Air (m3/hari)</label>
                        <input type="number" name="penggunaan_air_per_hari" value={formData.penggunaan_air_per_hari} onChange={handleChange} placeholder="Penggunaan Air (m3/hari)" className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-indigo-50 focus:outline-none" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3 */}
        <div className={`${step === 3 ? 'block' : 'hidden'} animate-in fade-in slide-in-from-right-4 duration-300`}>
          <h3 className="font-black text-slate-900 mb-4 border-l-8 border-amber-500 pl-3 uppercase tracking-widest text-lg">C. Hasil Pengawasan</h3>

          <div className="bg-white p-5 rounded-2xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] mb-6">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3">1. Dokumen Perizinan</h4>
            <div className="space-y-3">
              {listDokumen.map((dok, i) => (
                <div key={dok.id} className="flex gap-2 items-center">
                  <span className="font-black text-slate-400">{i + 1}.</span>
                  <input type="text" value={dok.value} onChange={(e) => {
                    const l = [...listDokumen]; l[i].value = e.target.value; setListDokumen(l);
                  }} placeholder="Nama Dokumen/Izin..." className="flex-1 px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-amber-50 focus:outline-none" />
                  {listDokumen.length > 1 && (
                    <button type="button" onClick={() => setListDokumen(listDokumen.filter(x => x.id !== dok.id))} className="p-3 bg-rose-500 text-white rounded-xl border-4 border-slate-900 hover:bg-rose-600 active:translate-y-1">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setListDokumen([...listDokumen, { id: Date.now(), value: '' }])} className="w-full py-3 border-4 border-dashed border-slate-900 rounded-xl font-black text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-2 uppercase text-xs tracking-widest mt-2">
                <Plus size={16} /> Tambah Izin
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {checklist.map((cat, catIdx) => (
              <div key={catIdx} className="bg-white rounded-2xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] overflow-hidden">
                <div className="bg-slate-900 px-4 py-3">
                  <h4 className="font-black text-white text-sm uppercase tracking-widest">{cat.bab}</h4>
                </div>
                <div className="p-4 md:p-5 space-y-6">
                  {cat.items.map((item: any, itemIdx: number) => (
                    <div key={itemIdx} className="border-b-4 border-dashed border-slate-200 pb-5 last:border-0 last:pb-0">
                      <div className="flex gap-3 mb-3">
                        <span className="font-black text-amber-500 text-lg">{item.no}.</span>
                        <p className="font-black text-slate-900 mt-1">{item.point}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Kondisi Eksisting</label>
                          <textarea value={item.kondisi} onChange={(e) => {
                            const c = [...checklist]; c[catIdx].items[itemIdx].kondisi = e.target.value; setChecklist(c);
                          }} rows={2} className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-amber-50 focus:outline-none" placeholder="Hasil pengamatan riil..."></textarea>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Keterangan</label>
                          <textarea value={item.keterangan} onChange={(e) => {
                            const c = [...checklist]; c[catIdx].items[itemIdx].keterangan = e.target.value; setChecklist(c);
                          }} rows={2} className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-amber-50 focus:outline-none" placeholder="Catatan tambahan..."></textarea>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 4 */}
        <div className={`${step === 4 ? 'block' : 'hidden'} animate-in fade-in slide-in-from-right-4 duration-300`}>
          <h3 className="font-black text-slate-900 mb-4 border-l-8 border-rose-500 pl-3 uppercase tracking-widest text-lg">D. Dokumentasi & Penutup</h3>

          <div className="bg-white p-5 rounded-2xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] mb-6">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4">Bukti Foto Lapangan</h4>
            <div className="space-y-4">
              {listFoto.map((foto, i) => (
                <div key={foto.id} className="p-4 border-4 border-slate-900 rounded-xl bg-rose-50 relative shadow-[4px_4px_0_0_#0f172a]">
                  {listFoto.length > 1 && (
                    <button type="button" onClick={() => setListFoto(listFoto.filter(x => x.id !== foto.id))} className="absolute -top-3 -right-3 p-2 bg-rose-500 text-white rounded-xl border-4 border-slate-900 hover:bg-rose-600 hover:-translate-y-1 transition-all z-10">
                      <X size={16} />
                    </button>
                  )}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-black text-rose-800 uppercase mb-2 tracking-widest">Pilih Foto</label>
                      <input type="file" accept="image/*" onChange={(e) => { if(e.target.files) handleFileChange(i, e.target.files[0]); }} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-4 file:border-slate-900 file:text-[10px] file:font-black file:uppercase file:bg-white file:text-slate-900 hover:file:bg-slate-100" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-rose-800 uppercase mb-1 tracking-widest">Keterangan Foto</label>
                      <input type="text" value={foto.keterangan} onChange={(e) => {
                        const l = [...listFoto]; l[i].keterangan = e.target.value; setListFoto(l);
                      }} placeholder={isPerumahan ? "Contoh: Tampak Septictank Blok A..." : "Contoh: Tampak TPS Limbah..."} className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold bg-white focus:bg-rose-50 focus:outline-none" />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setListFoto([...listFoto, { id: Date.now(), file: null as any, base64: '', keterangan: '' }])} className="w-full py-4 border-4 border-dashed border-slate-900 rounded-xl font-black text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-2 uppercase tracking-widest text-xs mt-4">
                <PlusCircle size={18} /> Tambah Foto
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] mb-6 space-y-4">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Informasi Tambahan</h4>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Riwayat Ketaatan</label>
              <textarea name="riwayat_ketaatan" value={formData.riwayat_ketaatan} onChange={handleChange} rows={2} placeholder={isPerumahan ? "Jelaskan riwayat ketaatan pengembang..." : ""} className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-rose-50 focus:outline-none"></textarea>
            </div>
            {(isIndustri || isPerumahan) && (
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Nilai Investasi</label>
                <textarea name="nilai_investasi" value={formData.nilai_investasi} onChange={handleChange} rows={2} className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-rose-50 focus:outline-none"></textarea>
              </div>
            )}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Inspeksi Terakhir</label>
              <textarea name="inspeksi_terakhir" value={formData.inspeksi_terakhir} onChange={handleChange} rows={2} className="w-full px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-rose-50 focus:outline-none"></textarea>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] mb-6">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3">Saran / Masukan</h4>
            <div className="space-y-3">
              {listSaran.map((saran, i) => (
                <div key={saran.id} className="flex gap-2 items-center">
                  <span className="font-black text-slate-400">{i + 1}.</span>
                  <input type="text" value={saran.value} onChange={(e) => {
                    const l = [...listSaran]; l[i].value = e.target.value; setListSaran(l);
                  }} placeholder="Ketik saran perbaikan kesling..." className="flex-1 px-4 py-3 rounded-xl border-4 border-slate-900 text-sm font-bold focus:bg-rose-50 focus:outline-none" />
                  {listSaran.length > 1 && (
                    <button type="button" onClick={() => setListSaran(listSaran.filter(x => x.id !== saran.id))} className="p-3 bg-rose-500 text-white rounded-xl border-4 border-slate-900 hover:bg-rose-600 active:translate-y-1">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setListSaran([...listSaran, { id: Date.now(), value: '' }])} className="w-full py-3 border-4 border-dashed border-slate-900 rounded-xl font-black text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-2 uppercase tracking-widest text-xs mt-2">
                <Plus size={16} /> Tambah Saran
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] mb-6">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4">Penilaian & Kesimpulan</h4>
            
            <div className="space-y-4 mb-8">
              {komponenPenilaian.map((komp, idx) => (
                <div key={komp.id} className="flex flex-col md:flex-row gap-3 p-4 bg-slate-50 border-4 border-slate-900 rounded-xl shadow-[4px_4px_0_0_#0f172a]">
                  <div className="flex-none bg-slate-900 text-white font-black px-3 py-2 rounded-lg text-sm flex items-center justify-center min-w-[50px]">
                    C.{idx + 1}
                  </div>
                  <div className="flex-1">
                    <input type="text" value={komp.nama} onChange={(e) => {
                      const k = [...komponenPenilaian]; k[idx].nama = e.target.value; setKomponenPenilaian(k);
                    }} className="w-full bg-transparent border-0 border-b-4 border-dashed border-slate-900 focus:outline-none px-0 py-2 text-sm font-bold text-slate-900 placeholder-slate-400" placeholder="Rincian penilaian (misal: Pengelolaan Limbah)..." />
                  </div>
                  <div className="w-full md:w-40 flex items-center gap-2 shrink-0">
                    <input type="number" min="0" value={komp.nilai} onChange={(e) => {
                      const k = [...komponenPenilaian]; k[idx].nilai = e.target.value; setKomponenPenilaian(k);
                    }} className="w-full min-w-0 px-2 py-2 border-4 border-slate-900 rounded-xl text-center font-black text-rose-600 focus:bg-rose-50 focus:outline-none text-xl" placeholder="0" />
                    {komponenPenilaian.length > 1 && (
                      <button type="button" onClick={() => setKomponenPenilaian(komponenPenilaian.filter(x => x.id !== komp.id))} className="text-rose-500 hover:text-rose-700 p-2 border-4 border-transparent hover:border-slate-900 rounded-xl hover:bg-rose-50">
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setKomponenPenilaian([...komponenPenilaian, { id: Date.now(), nama: '', nilai: '' }])} className="w-full py-3 border-4 border-dashed border-slate-900 rounded-xl font-black text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                <Plus size={16} /> Tambah Nilai Baru
              </button>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-xl border-4 border-slate-900 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-inner">
              <div className="relative z-10 text-center md:text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nilai Rata-Rata</p>
                <div className="flex items-end gap-2 justify-center md:justify-start">
                  <span className={`text-5xl font-black ${totalSkor() > 100 ? 'text-rose-500' : 'text-teal-400'}`}>{totalSkor()}</span>
                  <span className="text-sm font-bold text-slate-500 mb-2">/ 100</span>
                </div>
                {totalSkor() > 100 && (
                  <p className="text-[10px] font-black text-slate-900 mt-2 bg-rose-500 px-3 py-1.5 rounded-lg inline-block uppercase tracking-widest border-2 border-slate-900">
                    <AlertCircle size={12} className="inline mr-1 pb-0.5" /> Invalid Skor &gt; 100
                  </p>
                )}
              </div>
              <div className="text-center md:text-right relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status Ketaatan</p>
                <div className={`px-6 py-3 rounded-xl font-black text-lg uppercase tracking-widest border-4 border-slate-900 ${finalStatus() === 'Taat' ? 'bg-emerald-400 text-slate-900 shadow-[4px_4px_0_0_#064e3b]' : finalStatus() === 'Taat dengan Catatan' ? 'bg-amber-400 text-slate-900 shadow-[4px_4px_0_0_#78350f]' : finalStatus() === 'Tidak Taat' ? 'bg-rose-500 text-white shadow-[4px_4px_0_0_#4c0519]' : 'bg-slate-200 text-slate-500'}`}>
                  {finalStatus()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 5 */}
        <div className={`${step === 5 ? 'block' : 'hidden'} animate-in fade-in slide-in-from-right-4 duration-300`}>
          <h3 className="font-black text-slate-900 mb-4 border-l-8 border-teal-500 pl-3 uppercase tracking-widest text-lg">E. Pengesahan BAP</h3>
          
          <div className="bg-white p-5 rounded-2xl border-4 border-slate-900 shadow-[8px_8px_0_0_#0f172a] mb-6">
            <div className="mb-6">
              <span className="text-xs font-black text-slate-900 uppercase tracking-widest bg-amber-200 px-3 py-1 rounded-lg border-2 border-slate-900">Pihak {isSPPG ? 'Fasilitas / SPPG' : isTokoModern ? 'Toko Modern / Pasar' : isPerumahan ? 'Pengembang / Perumahan' : kategori || 'Usaha'}</span>
              <p className="text-[10px] font-bold text-slate-500 mt-3 uppercase tracking-widest">Tanda tangan & paraf perwakilan / pendamping lapangan.</p>
            </div>

            {listPerwakilan.map((perw, idx) => (
              <div key={perw.id} className="bg-amber-50 p-4 rounded-xl border-4 border-amber-900 mb-4 shadow-[4px_4px_0_0_#78350f] relative">
                {listPerwakilan.length > 1 && (
                  <button type="button" onClick={() => setListPerwakilan(listPerwakilan.filter(x => x.id !== perw.id))} className="absolute -top-3 -right-3 p-2 bg-rose-500 text-white rounded-xl border-4 border-slate-900 hover:bg-rose-600 hover:-translate-y-1 transition-all z-10">
                    <X size={16} />
                  </button>
                )}
                <label className="block text-sm font-black text-amber-900 mb-3 uppercase tracking-widest border-b-2 border-amber-900 pb-2">Perwakilan {idx + 1}</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[9px] font-bold text-amber-800 uppercase mb-1">Nama Lengkap</label>
                    <input type="text" value={perw.nama} onChange={(e) => {
                      const l = [...listPerwakilan]; l[idx].nama = e.target.value; setListPerwakilan(l);
                    }} placeholder="Nama..." className="w-full px-4 py-3 rounded-xl border-4 border-amber-900 text-sm font-bold focus:bg-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-amber-800 uppercase mb-1">Jabatan / Instansi</label>
                    <input type="text" value={perw.jabatan} onChange={(e) => {
                      const l = [...listPerwakilan]; l[idx].jabatan = e.target.value; setListPerwakilan(l);
                    }} placeholder="Jabatan..." className="w-full px-4 py-3 rounded-xl border-4 border-amber-900 text-sm font-bold focus:bg-white focus:outline-none" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-[9px] font-bold text-amber-800 uppercase mb-1">Nomor HP</label>
                  <input type="text" value={perw.telepon} onChange={(e) => {
                    const l = [...listPerwakilan]; l[idx].telepon = e.target.value; setListPerwakilan(l);
                  }} placeholder="08..." className="w-full px-4 py-3 rounded-xl border-4 border-amber-900 text-sm font-bold focus:bg-white focus:outline-none" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-amber-800 uppercase mb-2 tracking-widest">Tanda Tangan</label>
                    <div className="border-4 border-amber-900 rounded-lg overflow-hidden bg-white h-24">
                      <SignatureCanvas ref={(ref) => { sigPerwakilanRefs.current[perw.id] = ref }} penColor="#78350f" canvasProps={{ className: 'w-full h-full cursor-crosshair touch-none' }} />
                    </div>
                    <button type="button" onClick={() => sigPerwakilanRefs.current[perw.id]?.clear()} className="text-[9px] font-black text-rose-600 mt-2 uppercase tracking-widest hover:underline">Hapus TTD</button>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-800 uppercase mb-2 tracking-widest">Paraf</label>
                    <div className="border-4 border-amber-900 rounded-lg overflow-hidden bg-white h-24">
                      <SignatureCanvas ref={(ref) => { parafPerwakilanRefs.current[perw.id] = ref }} penColor="#78350f" canvasProps={{ className: 'w-full h-full cursor-crosshair touch-none' }} />
                    </div>
                    <button type="button" onClick={() => parafPerwakilanRefs.current[perw.id]?.clear()} className="text-[9px] font-black text-rose-600 mt-2 uppercase tracking-widest hover:underline">Hapus Paraf</button>
                  </div>
                </div>
              </div>
            ))}
            
            <button type="button" onClick={() => setListPerwakilan([...listPerwakilan, { id: Date.now(), nama: '', jabatan: '', telepon: '' }])} className="w-full py-4 border-4 border-dashed border-slate-900 rounded-xl font-black text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-2 uppercase tracking-widest text-xs mb-8">
              <PlusCircle size={18} /> Tambah Perwakilan
            </button>

            <label className="block text-[10px] font-black text-slate-900 uppercase mb-2 tracking-widest">Paraf {isSPPG ? 'Fasilitas' : 'Perusahaan'} (Footer Halaman)</label>
            <div className="border-4 border-slate-900 rounded-xl overflow-hidden mb-2 bg-slate-100 shadow-inner">
              <SignatureCanvas ref={parafPemrakarsaRef} penColor="black" canvasProps={{ className: 'w-full h-24 cursor-crosshair touch-none' }} />
            </div>
            <button type="button" onClick={() => parafPemrakarsaRef.current?.clear()} className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1 hover:text-rose-800 mb-6 border-b-2 border-transparent hover:border-rose-600 w-max pb-0.5">
              <RefreshCcw size={12} /> Hapus/Ulangi Paraf
            </button>

            <hr className="border-t-4 border-dashed border-slate-300 my-8" />

            <div className="mb-6">
              <span className="text-xs font-black text-slate-900 uppercase tracking-widest bg-teal-200 px-3 py-1 rounded-lg border-2 border-slate-900">Tim Pengawas</span>
              <p className="text-[10px] font-bold text-slate-500 mt-3 uppercase tracking-widest">Tanda tangan & paraf anggota tim.</p>
            </div>

            {timTugas.map((nama, idx) => (
              <div key={idx} className="bg-teal-50 p-4 rounded-xl border-4 border-teal-900 mb-4 shadow-[4px_4px_0_0_#134e4a]">
                <label className="block text-sm font-black text-teal-900 mb-3 uppercase tracking-widest border-b-2 border-teal-900 pb-2">{idx + 1}. {nama}</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-teal-800 uppercase mb-2 tracking-widest">TTD</label>
                    <div className="border-4 border-teal-900 rounded-lg overflow-hidden bg-white h-24">
                      <SignatureCanvas ref={(ref) => { sigTimRefs.current[idx] = ref }} penColor="#115e59" canvasProps={{ className: 'w-full h-full cursor-crosshair touch-none' }} />
                    </div>
                    <button type="button" onClick={() => sigTimRefs.current[idx]?.clear()} className="text-[9px] font-black text-rose-600 mt-2 uppercase tracking-widest hover:underline">Hapus TTD</button>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-teal-800 uppercase mb-2 tracking-widest">Paraf</label>
                    <div className="border-4 border-teal-900 rounded-lg overflow-hidden bg-white h-24">
                      <SignatureCanvas ref={(ref) => { parafTimRefs.current[idx] = ref }} penColor="#115e59" canvasProps={{ className: 'w-full h-full cursor-crosshair touch-none' }} />
                    </div>
                    <button type="button" onClick={() => parafTimRefs.current[idx]?.clear()} className="text-[9px] font-black text-rose-600 mt-2 uppercase tracking-widest hover:underline">Hapus Paraf</button>
                  </div>
                </div>
              </div>
            ))}

            {saksiTugas.length > 0 && (
              <>
                <hr className="border-t-4 border-dashed border-slate-300 my-8" />
                <div className="mb-6">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest bg-indigo-200 px-3 py-1 rounded-lg border-2 border-slate-900">Saksi</span>
                  <p className="text-[10px] font-bold text-slate-500 mt-3 uppercase tracking-widest">Tanda tangan pihak saksi (pendamping).</p>
                </div>

                {saksiTugas.map((nama, idx) => (
                  <div key={`saksi-${idx}`} className="bg-indigo-50 p-4 rounded-xl border-4 border-indigo-900 mb-4 shadow-[4px_4px_0_0_#312e81]">
                    <label className="block text-sm font-black text-indigo-900 mb-3 uppercase tracking-widest border-b-2 border-indigo-900 pb-2">{idx + 1}. {nama}</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[9px] font-bold text-indigo-800 uppercase mb-1">Jabatan / Instansi</label>
                        <input type="text" value={saksiDetails[idx]?.jabatan || ''} onChange={(e) => {
                          const newDetails = [...saksiDetails];
                          newDetails[idx].jabatan = e.target.value;
                          setSaksiDetails(newDetails);
                        }} placeholder="Jabatan / Instansi..." className="w-full px-4 py-3 rounded-xl border-4 border-indigo-900 text-sm font-bold focus:bg-white focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-indigo-800 uppercase mb-1">Nomor HP</label>
                        <input type="text" value={saksiDetails[idx]?.telepon || ''} onChange={(e) => {
                          const newDetails = [...saksiDetails];
                          newDetails[idx].telepon = e.target.value;
                          setSaksiDetails(newDetails);
                        }} placeholder="Nomor HP..." className="w-full px-4 py-3 rounded-xl border-4 border-indigo-900 text-sm font-bold focus:bg-white focus:outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-indigo-800 uppercase mb-2 tracking-widest">TTD Saksi</label>
                        <div className="border-4 border-indigo-900 rounded-lg overflow-hidden bg-white h-24">
                          <SignatureCanvas ref={(ref) => { sigSaksiRefs.current[idx] = ref }} penColor="#312e81" canvasProps={{ className: 'w-full h-full cursor-crosshair touch-none' }} />
                        </div>
                        <button type="button" onClick={() => sigSaksiRefs.current[idx]?.clear()} className="text-[9px] font-black text-rose-600 mt-2 uppercase tracking-widest hover:underline">Hapus TTD</button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

      </form>

      {/* FIXED BOTTOM NAVIGATION */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t-4 border-slate-900 p-4 z-50 shadow-[0_-4px_0_0_rgba(0,0,0,0.1)]">
        <div className="max-w-3xl mx-auto flex gap-4">
          {step > 1 && (
            <button type="button" onClick={() => setStep(step - 1)} className="w-1/3 py-4 rounded-xl border-4 border-slate-900 font-black text-sm text-slate-900 bg-white hover:bg-slate-100 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#0f172a] transition-all uppercase tracking-widest">
              Kembali
            </button>
          )}
          {step < 5 ? (
            <button type="button" onClick={() => { window.scrollTo(0,0); setStep(step + 1); }} className="flex-1 py-4 rounded-xl border-4 border-slate-900 font-black text-sm text-slate-900 bg-amber-400 hover:bg-amber-500 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#0f172a] transition-all uppercase tracking-widest">
              Lanjut Step {step + 1}
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={saving} className="flex-1 py-4 rounded-xl border-4 border-slate-900 font-black text-sm text-white bg-teal-600 hover:bg-teal-700 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#0f172a] transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none disabled:shadow-none">
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {savingText}
                </span>
              ) : <><Save size={20} /> Simpan & Upload Drive</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
