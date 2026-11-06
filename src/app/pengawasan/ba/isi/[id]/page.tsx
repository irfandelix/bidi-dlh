'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  MapPin, 
  X, 
  Plus, 
  PlusCircle, 
  AlertCircle, 
  RefreshCcw, 
  Trash2, 
  Clock, 
  FileText, 
  Camera, 
  CheckCircle2, 
  PenTool, 
  Building2, 
  ShieldCheck,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { getTemplate } from './templates';
import LottieLoader from '@/components/LottieLoader';

export default function BAPFormPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingText, setSavingText] = useState('Menyimpan Data...');
  
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
  const [komponenPenilaian, setKomponenPenilaian] = useState<{ id: any, nama: string, nilai: string }[]>([]);
  
  const [checklist, setChecklist] = useState<any[]>([]);

  useEffect(() => {
    fetchAgenda();
  }, [id]);

  const generateDefaultScores = (kat: string) => {
    const k = (kat || '').toLowerCase();
    const isInd = k.includes('industri');
    const isFas = k.includes('fasyankes') || k.includes('kesehatan') || k.includes('medis') || k.includes('klinik') || k.includes('rumah sakit');
    
    // Pencemaran Udara:
    // Sektor Industri: dievaluasi (nilai kosong untuk diisi)
    // Sektor Fasyankes, Perumahan, Toko Modern, SPPG/SPBU: tidak ada pencemaran udara, maka otomatis 'N/A'
    const udaraNilai = isInd ? '' : 'N/A';
    const lb3Nama = isFas ? '4. Pemeriksaan Pengelolaan Limbah Bahan Berbahaya dan Beracun (LB3)' : '4. Pemeriksaan Pengelolaan Limbah B3';

    return [
      { id: 'score_dokumen', nama: '1. Dokumen Perizinan Lingkungan', nilai: '' },
      { id: 'score_air', nama: '2. Pemeriksaan Pengelolaan Air Limbah', nilai: '' },
      { id: 'score_udara', nama: '3. Pemeriksaan Pengendalian Pencemaran Udara', nilai: udaraNilai },
      { id: 'score_b3', nama: lb3Nama, nilai: '' },
      { id: 'score_sampah', nama: '5. Pemeriksaan Pengelolaan Sampah Domestik', nilai: '' }
    ];
  };

  const fetchAgenda = async () => {
    try {
      const { data, error } = await supabase
        .from('pengawasan_lapangans')
        .select('*, bap_pengawasans(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      const agendaData = data as any;
      setAgenda(agendaData);
      setKategori(agendaData.kategori || '');
      
      // Initialize checklist based on kategori (atau muat dari checklist tersimpan jika ada)
      const template = getTemplate(agendaData.kategori);
      const existingBap = agendaData.bap_pengawasans && agendaData.bap_pengawasans.length > 0 ? agendaData.bap_pengawasans[0] : null;
      const existingMatriks = existingBap?.data_matriks_c;
      const savedChecklist = existingMatriks?.checklist;

      if (savedChecklist && Array.isArray(savedChecklist) && savedChecklist.length > 0) {
        setChecklist(savedChecklist);
      } else {
        setChecklist(template.map(cat => ({
          bab: cat.bab,
          items: cat.items.map(item => ({ key: item.key || item.point, point: item.point, no: item.no, kondisi: '', keterangan: '', poin: '' }))
        })));
      }

      // Komponen Penilaian otomatis diambil dari standar BAP (Pencemaran udara otomatis N/A untuk non-industri)
      const defaultScores = generateDefaultScores(agendaData.kategori);

      if (existingBap?.rincian_skoring && Array.isArray(existingBap.rincian_skoring) && existingBap.rincian_skoring.length > 0 && existingBap.rincian_skoring.some((r: any) => r.nama && r.nama.trim() !== '')) {
        setKomponenPenilaian(existingBap.rincian_skoring);
      } else {
        setKomponenPenilaian(defaultScores);
      }
      
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

  const handlePoinChange = (catIdx: number, itemIdx: number, val: string) => {
    const newChecklist = [...checklist];
    newChecklist[catIdx].items[itemIdx].poin = val;
    setChecklist(newChecklist);

    // Hitung rata-rata poin untuk bab ini dan otomatis update nilai skor bab di komponenPenilaian
    const catItems = newChecklist[catIdx].items;
    const scoredItems = catItems.filter((it: any) => it.poin !== '' && it.poin !== undefined && it.poin !== null && !isNaN(Number(it.poin)));
    
    if (scoredItems.length > 0) {
      const sum = scoredItems.reduce((acc: number, curr: any) => acc + Number(curr.poin), 0);
      const avg100 = Math.round((sum / scoredItems.length) * 10); // konversi poin 1-10 menjadi skor 10-100
      
      const babTitle = (newChecklist[catIdx].bab || '').toLowerCase();
      const babNum = newChecklist[catIdx].bab.match(/^\d+/)?.[0];
      
      setKomponenPenilaian(prev => prev.map(komp => {
        const kNama = (komp.nama || '').toLowerCase();
        const matchNum = babNum && kNama.startsWith(`${babNum}.`);
        const matchKeyword = (babTitle.includes('air') && kNama.includes('air')) ||
                             (babTitle.includes('udara') && kNama.includes('udara')) ||
                             ((babTitle.includes('b3') || babTitle.includes('lb3')) && (kNama.includes('b3') || kNama.includes('lb3'))) ||
                             (babTitle.includes('sampah') && kNama.includes('sampah'));
        
        if (matchNum || matchKeyword) {
          // Jangan timpa jika komponen ini bertanda N/A
          if (komp.nilai === 'N/A' || komp.nilai === 'NA') return komp;
          return { ...komp, nilai: avg100.toString() };
        }
        return komp;
      }));
    }
  };

  const syncScoresFromChecklist = () => {
    const defaultScores = generateDefaultScores(kategori || agenda?.kategori || '');
    const mergedScores = defaultScores.map(def => {
      // Cari apakah sudah ada nilai sebelumnya untuk komponen ini
      const existing = komponenPenilaian.find(k => {
        const kNama = (k.nama || '').toLowerCase();
        const defKey = (def.nama || '').split('.')[1]?.trim().toLowerCase() || def.nama.toLowerCase();
        return kNama.includes(defKey);
      });
      return {
        ...def,
        id: `score_${def.id}_${Date.now()}`,
        nilai: (existing && existing.nilai !== '') ? existing.nilai : def.nilai
      };
    });
    setKomponenPenilaian(mergedScores);
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
    const validScores = komponenPenilaian.filter(k => {
      const val = (k.nilai ?? '').toString().trim().toUpperCase();
      return val !== '' && val !== 'NA' && val !== 'N/A' && val !== '-' && !isNaN(Number(val));
    });
    if (validScores.length === 0) return 0;
    const sum = validScores.reduce((acc, curr) => acc + Number(curr.nilai), 0);
    return Math.round((sum / validScores.length) * 100) / 100;
  };

  const getScoringStats = () => {
    const validScores = komponenPenilaian.filter(k => {
      const val = (k.nilai ?? '').toString().trim().toUpperCase();
      return val !== '' && val !== 'NA' && val !== 'N/A' && val !== '-' && !isNaN(Number(val));
    });
    const naScores = komponenPenilaian.filter(k => {
      const val = (k.nilai ?? '').toString().trim().toUpperCase();
      return val === 'NA' || val === 'N/A' || val === '-';
    });
    return {
      validCount: validScores.length,
      naCount: naScores.length,
      totalCount: komponenPenilaian.length
    };
  };

  const finalStatus = (): string => {
    const skor = totalSkor();
    if (skor === 0 || isNaN(skor)) return 'Belum Ada Nilai';
    if (skor > 100) return 'CEK INPUT';
    if (skor >= 70) return 'Taat';
    if (skor >= 50) return 'Kurang Taat';
    return 'Tidak Taat';
  };

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

  const stepList = [
    { num: 1, title: 'Identitas & Waktu', sub: 'Lokasi & Batas' },
    { num: 2, title: 'Operasional', sub: 'Kapasitas & Utilitas' },
    { num: 3, title: 'Checklist Ketaatan', sub: 'Evaluasi Lapangan' },
    { num: 4, title: 'Dokumentasi & Saran', sub: 'Foto & Penilaian' },
    { num: 5, title: 'Pengesahan BAP', sub: 'Tanda Tangan & Paraf' }
  ];

  if (loading) return <div className="py-24 flex items-center justify-center"><LottieLoader size={150} text="MEMUAT FORM BAP..." /></div>;
  if (!agenda) return <div className="min-h-screen bg-white p-6 flex items-center justify-center font-bold text-xl text-rose-600 uppercase tracking-widest">Agenda Tidak Ditemukan</div>;

  return (
    <div className="w-full pb-32">
      {/* HEADER CARD DENGAN STEPPER INTERAKTIF (LEBAR & BERJARAK NYAMAN DARI NAVBAR) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5 w-full mb-6">
        {/* BARIS 1: TOMBOL KEMBALI, JUDUL, BADGE SEKTOR, DAN SKOR KETAATAN SEJAJAR SEGARIS */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link 
              href="/pengawasan/agenda" 
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 flex items-center justify-center transition-all shrink-0"
              title="Kembali ke Agenda"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
              <h1 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 tracking-tight truncate">
                {agenda.nama_pemrakarsa}
              </h1>
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200 shrink-0">
                BAP {kategori || 'Sektor'}
              </span>
              <span className="text-xs text-slate-400 font-bold shrink-0 hidden sm:inline">• ID #{id}</span>
            </div>
          </div>

          {/* Status Skor Preview Sejajar */}
          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skor Ketaatan:</span>
            <span className={`text-xs sm:text-sm font-black ${totalSkor() >= 70 ? 'text-emerald-600' : totalSkor() >= 50 ? 'text-amber-600' : 'text-slate-700'}`}>
              {totalSkor()} • {finalStatus()}
            </span>
          </div>
        </div>

        {/* STEPPER TABS (LEBAR, RESPONSIF & SEJAJAR PERSIS) */}
        <div className="mt-4 pt-3.5 border-t border-slate-100">
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {stepList.map((s) => {
              const isActive = step === s.num;
              const isPast = step > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setStep(s.num); }}
                  className={`p-2.5 sm:px-4 sm:py-3 rounded-xl text-left transition-all border flex items-center gap-2.5 sm:gap-3 ${
                    isActive 
                      ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-200'
                      : isPast
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    isActive ? 'bg-white text-teal-800' : isPast ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {isPast ? '✓' : s.num}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] sm:text-xs font-black uppercase tracking-wider truncate leading-tight">
                      {s.title}
                    </div>
                    <div className={`text-[10px] font-medium truncate mt-0.5 hidden lg:block leading-tight ${isActive ? 'text-teal-100' : 'text-slate-400'}`}>
                      {s.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MAIN FORM CONTAINER (LEBAR LEGA & SEJAJAR DENGAN HEADER: w-full space-y-6) */}
      <form onSubmit={handleSubmit} className="w-full space-y-6">
        
        {/* ========================================================================= */}
        {/* STEP 1: IDENTITAS & WAKTU                                                 */}
        {/* ========================================================================= */}
        <div className={`${step === 1 ? 'block' : 'hidden'} animate-in fade-in duration-200 space-y-6`}>
          {/* Tim Pengawas Banner */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg inline-block mb-1">
                Tim Pengawas Lapangan
              </span>
              <p className="font-bold text-slate-800 text-sm md:text-base mt-1">
                {timTugas.join(', ') || 'Tim Teknis DLH'}
              </p>
              <p className="text-xs font-semibold text-slate-400">Dinas Lingkungan Hidup Kab. Sragen</p>
            </div>
            
            {/* Jam Mulai */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl sm:w-64 shrink-0">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                <Clock size={12} className="text-amber-500" /> Jam Mulai Pengawasan
              </label>
              <input 
                type="time" 
                name="waktu_pengawasan" 
                required
                value={formData.waktu_pengawasan} 
                onChange={handleChange} 
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-400" 
              />
            </div>
          </div>

          {/* Identitas Usaha / Kegiatan & Lokasi (Grid 2 Kolom di Laptop) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Kolom Kiri: Info Umum */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                <Building2 size={16} className="text-teal-600" />
                <span>A. Identitas Usaha & Penanggung Jawab</span>
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  {isSPPG ? 'Nama Fasilitas / SPPG' : isTokoModern ? 'Nama Toko Modern / Pasar' : isPerumahan ? 'Nama Perumahan / Pengembang' : 'Nama Usaha / Kegiatan'}
                </label>
                <input 
                  type="text" 
                  value={agenda.nama_pemrakarsa} 
                  readOnly 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-100 text-slate-700" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Kode KBLI</label>
                  <input 
                    type="text" 
                    name="kbli" 
                    value={formData.kbli} 
                    onChange={handleChange} 
                    placeholder="Kode KBLI..." 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tahun Operasi</label>
                  <input 
                    type="number" 
                    name="tahun_operasi" 
                    value={formData.tahun_operasi} 
                    onChange={handleChange} 
                    placeholder="Tahun..." 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Status Permodalan</label>
                <input 
                  type="text" 
                  name="status_permodalan" 
                  value={formData.status_permodalan} 
                  onChange={handleChange} 
                  placeholder={isIndustri ? "PMDN/PMA" : (isPerumahan || isSPPG) ? "PMDN/Swasta" : "Pemerintah/Swasta"} 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Alamat Lengkap</label>
                <textarea 
                  name="alamat" 
                  value={formData.alamat} 
                  onChange={handleChange} 
                  rows={2} 
                  placeholder="Alamat lengkap lokasi..." 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-2">
                  {isSPPG ? 'Penanggung Jawab Fasilitas' : isTokoModern ? 'Penanggung Jawab Usaha' : isPerumahan ? 'Penanggung Jawab Perumahan' : 'Penanggung Jawab'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Lengkap</span>
                    <input 
                      type="text" 
                      name="pj_nama" 
                      value={formData.pj_nama} 
                      onChange={handleChange} 
                      placeholder="Nama Lengkap" 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" 
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Jabatan</span>
                    <input 
                      type="text" 
                      name="pj_jabatan" 
                      value={formData.pj_jabatan} 
                      onChange={handleChange} 
                      placeholder="Jabatan" 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" 
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">No. Telp / Fax</span>
                  <input 
                    type="text" 
                    name="telepon" 
                    value={formData.telepon} 
                    onChange={handleChange} 
                    placeholder="08..." 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" 
                  />
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Koordinat & Batas Wilayah & Luas */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                <MapPin size={16} className="text-teal-600" />
                <span>B. Geospasial, Batas Wilayah & Luas Area</span>
              </h3>

              {/* Koordinat GPS */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Koordinat Titik GPS</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    name="koordinat" 
                    value={formData.koordinat} 
                    readOnly 
                    placeholder="Ketuk pin GPS 👉" 
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-mono font-bold text-slate-800" 
                  />
                  <button 
                    type="button" 
                    onClick={handleLocation} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white w-11 h-11 flex items-center justify-center rounded-xl shadow-sm transition-all shrink-0"
                    title="Ambil Lokasi GPS Saat Ini"
                  >
                    <MapPin size={18} />
                  </button>
                </div>
              </div>

              {/* Batas Wilayah 2x2 Grid */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-2">Batas Wilayah Sekitar</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Batas Utara</span>
                    <input 
                      type="text" 
                      name="batas_utara" 
                      value={formData.batas_utara} 
                      onChange={handleChange} 
                      placeholder="Cth: Jalan Raya..." 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" 
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Batas Selatan</span>
                    <input 
                      type="text" 
                      name="batas_selatan" 
                      value={formData.batas_selatan} 
                      onChange={handleChange} 
                      placeholder="Cth: Pemukiman..." 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" 
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Batas Barat</span>
                    <input 
                      type="text" 
                      name="batas_barat" 
                      value={formData.batas_barat} 
                      onChange={handleChange} 
                      placeholder="Cth: Lahan Kosong..." 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" 
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Batas Timur</span>
                    <input 
                      type="text" 
                      name="batas_timur" 
                      value={formData.batas_timur} 
                      onChange={handleChange} 
                      placeholder="Cth: Sungai..." 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" 
                    />
                  </div>
                </div>
              </div>

              {/* Luas Area */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-2">Luas Area (m²)</label>
                <div className={`grid ${isFasyankes ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Luas Total Lahan</span>
                    <input 
                      type="text" 
                      name="luas_total" 
                      value={formData.luas_total} 
                      onChange={handleChange} 
                      placeholder="Cth: 1000..." 
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" 
                    />
                  </div>
                  {(isPerumahan || isTokoModern || isSPPG) ? (
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Luas Bangunan</span>
                      <input 
                        type="text" 
                        name="luas_bangunan" 
                        value={formData.luas_bangunan} 
                        onChange={handleChange} 
                        placeholder="Cth: 500..." 
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" 
                      />
                    </div>
                  ) : (
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Luas Terbangun</span>
                      <input 
                        type="text" 
                        name="luas_terbangun" 
                        value={formData.luas_terbangun} 
                        onChange={handleChange} 
                        placeholder="Cth: 600..." 
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" 
                      />
                    </div>
                  )}
                  {isFasyankes && (
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Luas Terbuka Hijau</span>
                      <input 
                        type="text" 
                        name="luas_terbuka" 
                        value={formData.luas_terbuka} 
                        onChange={handleChange} 
                        placeholder="Cth: 400..." 
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 2: OPERASIONAL & UTILITAS                                            */}
        {/* ========================================================================= */}
        <div className={`${step === 2 ? 'block' : 'hidden'} animate-in fade-in duration-200 space-y-6`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sisi Kiri: Kapasitas, Tenaga Kerja & Proses */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" />
                <span>1. Kapasitas & Operasional Produksi</span>
              </h3>

              {isIndustri ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Kapasitas Produksi</label>
                    <textarea name="kapasitas_produksi" value={formData.kapasitas_produksi} onChange={handleChange} rows={2} placeholder="Kapasitas Produksi..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"></textarea>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Jenis Produk</label>
                    <textarea name="jenis_produk" value={formData.jenis_produk} onChange={handleChange} rows={2} placeholder="Jenis Produk..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"></textarea>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Jumlah Karyawan</label>
                      <input type="text" name="jumlah_karyawan" value={formData.jumlah_karyawan} onChange={handleChange} placeholder="Total Pekerja" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Jam/Shift Kerja</label>
                      <input type="text" name="shift_kerja" value={formData.shift_kerja} onChange={handleChange} placeholder="Shift Kerja" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Bahan Baku Utama</label>
                    <textarea name="bahan_baku_utama" value={formData.bahan_baku_utama} onChange={handleChange} rows={2} placeholder="Bahan Baku Utama..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"></textarea>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Bahan Baku Penolong</label>
                    <textarea name="bahan_penolong" value={formData.bahan_penolong} onChange={handleChange} rows={2} placeholder="Bahan Baku Penolong..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"></textarea>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Proses Produksi</label>
                    <textarea name="proses_produksi" value={formData.proses_produksi} onChange={handleChange} rows={3} placeholder="Proses Produksi..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"></textarea>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Energi yang Digunakan</label>
                    <textarea name="energi" value={formData.energi} onChange={handleChange} rows={2} placeholder="Energi yang digunakan..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"></textarea>
                  </div>
                </div>
              ) : isPerumahan ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Kapasitas Sesuai Izin</label>
                    <textarea name="kapasitas_izin" value={formData.kapasitas_izin} onChange={handleChange} rows={2} placeholder="Misal: 100 Unit Tipe 36..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"></textarea>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Kondisi Riil Terbangun</label>
                    <textarea name="kapasitas_riil" value={formData.kapasitas_riil} onChange={handleChange} rows={2} placeholder="Kondisi Riil Terbangun..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"></textarea>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Jumlah Pekerja / Penghuni</label>
                    <textarea name="jumlah_pekerja" value={formData.jumlah_pekerja} onChange={handleChange} rows={2} placeholder="Jumlah Pekerja Konstruksi / Penghuni..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"></textarea>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Hari Kerja / Minggu</label>
                      <input type="text" name="hari_kerja_minggu" value={formData.hari_kerja_minggu} onChange={handleChange} placeholder="Cth: 6 hari" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Shift Kerja Konstruksi</label>
                      <input type="text" name="shift_kerja_konstruksi" value={formData.shift_kerja_konstruksi} onChange={handleChange} placeholder="Shift Kerja Konstruksi..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                  </div>
                </div>
              ) : (isTokoModern || isSPPG) ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Kapasitas Kegiatan</label>
                    <input type="text" name="kapasitas_kegiatan" value={formData.kapasitas_kegiatan} onChange={handleChange} placeholder="Kapasitas (Jumlah Kios/Los/Area Belanja)..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Jumlah Karyawan & Pengunjung</label>
                    <input type="text" name="jumlah_karyawan_pengunjung" value={formData.jumlah_karyawan_pengunjung} onChange={handleChange} placeholder="Pekerja & pengunjung per hari..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Jam Operasional / Shift</label>
                      <input type="text" name="shift_kerja" value={formData.shift_kerja} onChange={handleChange} placeholder="Jam operasional/hari..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Hari Kerja / Minggu</label>
                      <input type="number" name="hari_kerja_minggu" value={formData.hari_kerja_minggu} onChange={handleChange} placeholder="Jumlah hari buka..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                  </div>
                </div>
              ) : (
                /* Default Fasyankes / Lainnya */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Kapasitas Izin (TT)</label>
                      <input type="text" name="kapasitas_izin" value={formData.kapasitas_izin} onChange={handleChange} placeholder="Sesuai Izin" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Kondisi Riil (TT)</label>
                      <input type="text" name="kapasitas_riil" value={formData.kapasitas_riil} onChange={handleChange} placeholder="Riil" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Total Pekerja</label>
                      <input type="text" name="jumlah_karyawan" value={formData.jumlah_karyawan} onChange={handleChange} placeholder="Total Pekerja" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Pasien / Hari</label>
                      <input type="text" name="jumlah_pasien" value={formData.jumlah_pasien} onChange={handleChange} placeholder="Pasien/Hari" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Jam/Shift Kerja</label>
                      <input type="text" name="shift_kerja" value={formData.shift_kerja} onChange={handleChange} placeholder="Shift Kerja" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Hari Kerja / Minggu</label>
                      <input type="text" name="hari_kerja_minggu" value={formData.hari_kerja_minggu} onChange={handleChange} placeholder="Jumlah Hari/Minggu" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sisi Kanan: Utilitas & Pengelolaan Lingkungan */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                <ShieldCheck size={16} className="text-teal-600" />
                <span>2. Utilitas, Pengelolaan Limbah & Dokumen</span>
              </h3>

              {isIndustri ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Pembuangan Air Limbah</label>
                    <textarea name="pembuangan_air" value={formData.pembuangan_air} onChange={handleChange} rows={2} placeholder="Pembuangan Air Limbah..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"></textarea>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Debit Inlet (m³/hari)</label>
                      <input type="text" name="debit_inlet" value={formData.debit_inlet} onChange={handleChange} placeholder="Cth: 153,84" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Debit Outlet (m³/hari)</label>
                      <input type="text" name="debit_outlet" value={formData.debit_outlet} onChange={handleChange} placeholder="Cth: 100" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Pengelolaan Sampah Domestik</label>
                    <textarea name="pengelolaan_sampah_umum" value={formData.pengelolaan_sampah_umum} onChange={handleChange} rows={2} placeholder="Sampah Domestik..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"></textarea>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Pengelolaan Limbah B3</label>
                    <textarea name="pengelolaan_b3_umum" value={formData.pengelolaan_b3_umum} onChange={handleChange} rows={2} placeholder="Limbah B3..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"></textarea>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Sumber Air Bersih</label>
                    <textarea name="sumber_air_bersih" value={formData.sumber_air_bersih} onChange={handleChange} rows={2} placeholder="Sumber Air Bersih..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"></textarea>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Teknologi IPAL / Septictank</label>
                    <textarea name="teknologi_air_limbah" value={formData.teknologi_air_limbah} onChange={handleChange} rows={2} placeholder="Teknologi Pengelolaan Air Limbah..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"></textarea>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Volume Air Limbah (m³/hari)</label>
                      <input type="text" name="volume_air_limbah" value={formData.volume_air_limbah} onChange={handleChange} placeholder="Volume Air Limbah..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Penggunaan Air (L/Hari)</label>
                      <input type="text" name="penggunaan_air_liter" value={formData.penggunaan_air_liter} onChange={handleChange} placeholder="Penggunaan Air..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Pemanfaatan Air (Sumur / PDAM)</label>
                    <textarea name="pemanfaatan_air_tanah" value={formData.pemanfaatan_air_tanah} onChange={handleChange} rows={2} placeholder="Pemanfaatan Air Tanah/PDAM..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"></textarea>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Penggunaan Energi (Listrik / Genset)</label>
                    <textarea name="penggunaan_energi" value={formData.penggunaan_energi} onChange={handleChange} rows={2} placeholder="Energi Listrik / Genset..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"></textarea>
                  </div>
                </div>
              )}

              {/* Dokumen Perizinan Shared */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Dokumen Lingkungan Yang Dimiliki</label>
                  <textarea name="dokumen_dimiliki" value={formData.dokumen_dimiliki} onChange={handleChange} rows={2} placeholder={(isPerumahan || isSPPG) ? "Dokumen yang dimiliki (UKL-UPL, SPPL)..." : "Dokumen yang dimiliki..."} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"></textarea>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Persetujuan Lingkungan</label>
                  <textarea name="persetujuan_lingkungan" value={formData.persetujuan_lingkungan} onChange={handleChange} rows={2} placeholder="Persetujuan Lingkungan..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 3: CHECKLIST HASIL PENGAWASAN                                       */}
        {/* ========================================================================= */}
        <div className={`${step === 3 ? 'block' : 'hidden'} animate-in fade-in duration-200 space-y-6`}>
          {/* Dokumen Perizinan Multi-Item (Disamakan dengan gaya Bab Checklist) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider">
                1. Daftar Dokumen Izin Yang Ditunjukkan
              </h4>
              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-md font-bold">
                {listDokumen.length} Dokumen
              </span>
            </div>

            <div className="p-5 md:p-6 space-y-3">
              <div className="space-y-2.5">
                {listDokumen.map((dok, i) => (
                  <div key={dok.id} className="flex gap-2 items-center">
                    <span className="w-6 text-center font-bold text-slate-400 text-xs">{i + 1}.</span>
                    <input 
                      type="text" 
                      value={dok.value} 
                      onChange={(e) => {
                        const l = [...listDokumen]; l[i].value = e.target.value; setListDokumen(l);
                      }} 
                      placeholder="Nama Dokumen / Izin Teknis..." 
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" 
                    />
                    {listDokumen.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => setListDokumen(listDokumen.filter(x => x.id !== dok.id))} 
                        className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition-colors"
                        title="Hapus Baris"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                
                <button 
                  type="button" 
                  onClick={() => setListDokumen([...listDokumen, { id: Date.now(), value: '' }])} 
                  className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-xl font-bold text-slate-600 hover:text-amber-700 hover:bg-amber-50/50 flex items-center justify-center gap-2 uppercase text-xs tracking-wider transition-colors mt-2"
                >
                  <Plus size={15} /> Tambah Baris Izin
                </button>
              </div>
            </div>
          </div>

          {/* Checklist Ketaatan Lapangan */}
          <div className="space-y-6">
            {checklist.map((cat, catIdx) => {
              const babNum = cat.bab?.match(/^\d+/)?.[0] || (catIdx + 2);
              const scoredItems = (cat.items || []).filter((it: any) => it.poin !== '' && it.poin !== undefined && it.poin !== null && !isNaN(Number(it.poin)));
              const hasScores = scoredItems.length > 0;
              const avgPoin = hasScores ? Math.round((scoredItems.reduce((acc: number, curr: any) => acc + Number(curr.poin), 0) / scoredItems.length) * 10) / 10 : null;
              const skorBab = avgPoin !== null ? Math.round(avgPoin * 10) : null;

              return (
                <div key={catIdx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider">{cat.bab}</h4>
                    <div className="flex items-center gap-2">
                      {hasScores && (
                        <span className="text-[10px] bg-teal-500/30 text-teal-200 border border-teal-400/30 px-2.5 py-0.5 rounded-md font-bold">
                          Rata-rata: {avgPoin}/10 (Skor Bab: {skorBab})
                        </span>
                      )}
                      <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-md font-bold">
                        {cat.items.length} Poin Evaluasi
                      </span>
                    </div>
                  </div>

                  <div className="p-5 md:p-6 divide-y divide-slate-100">
                    {cat.items.map((item: any, itemIdx: number) => (
                      <div key={itemIdx} className="py-4 first:pt-0 last:pb-0 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <span className="px-2.5 py-0.5 min-w-[34px] h-6 rounded-lg bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center shrink-0 mt-0.5 font-mono shadow-xs">
                              {babNum}.{item.no}
                            </span>
                            <p className="font-bold text-slate-900 text-sm leading-relaxed">
                              {item.point}
                            </p>
                          </div>

                          {/* Poin Evaluasi (1 - 10) */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto pl-10 sm:pl-0">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                              Poin (1 - 10):
                            </span>
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl focus-within:ring-2 focus-within:ring-teal-400 focus-within:bg-white transition-all">
                              <input 
                                type="number" 
                                min="1" 
                                max="10" 
                                value={item.poin ?? ''} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || (Number(val) >= 0 && Number(val) <= 10)) {
                                    handlePoinChange(catIdx, itemIdx, val);
                                  }
                                }} 
                                placeholder="1-10" 
                                className="w-14 text-center font-mono font-black text-sm text-teal-800 bg-transparent focus:outline-none"
                              />
                              <span className="text-xs font-black text-slate-400">/ 10</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 sm:pl-11">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Kondisi Eksisting Lapangan
                            </label>
                            <textarea 
                              value={item.kondisi} 
                              onChange={(e) => {
                                const c = [...checklist]; c[catIdx].items[itemIdx].kondisi = e.target.value; setChecklist(c);
                              }} 
                              rows={2} 
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" 
                              placeholder="Hasil pengamatan riil di lapangan..."
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Keterangan / Catatan Teknis
                            </label>
                            <textarea 
                              value={item.keterangan} 
                              onChange={(e) => {
                                const c = [...checklist]; c[catIdx].items[itemIdx].keterangan = e.target.value; setChecklist(c);
                              }} 
                              rows={2} 
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" 
                              placeholder="Catatan tambahan / rekomendasi..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 4: DOKUMENTASI, SARAN & PENILAIAN SKOR                                */}
        {/* ========================================================================= */}
        <div className={`${step === 4 ? 'block' : 'hidden'} animate-in fade-in duration-200 space-y-6`}>
          {/* Bukti Foto Lapangan (Grid di Laptop) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Camera size={16} className="text-rose-600" />
                <span>Bukti Foto Dokumentasi Lapangan</span>
              </h4>
              <span className="text-xs text-slate-400 font-bold">{listFoto.length} Foto</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listFoto.map((foto, i) => (
                <div key={foto.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50 relative space-y-3">
                  {listFoto.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => setListFoto(listFoto.filter(x => x.id !== foto.id))} 
                      className="absolute top-2 right-2 p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition-colors z-10"
                      title="Hapus Foto"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">
                      Pilih Foto #{i + 1}
                    </label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => { if(e.target.files) handleFileChange(i, e.target.files[0]); }} 
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-300 file:text-xs file:font-bold file:bg-white file:text-slate-700 hover:file:bg-slate-100" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                      Keterangan Foto
                    </label>
                    <input 
                      type="text" 
                      value={foto.keterangan} 
                      onChange={(e) => {
                        const l = [...listFoto]; l[i].keterangan = e.target.value; setListFoto(l);
                      }} 
                      placeholder={isPerumahan ? "Cth: Tampak Septictank Blok A..." : "Cth: Tampak TPS Limbah B3..."} 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-rose-400" 
                    />
                  </div>
                  {foto.base64 && (
                    <div className="h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={foto.base64} alt="Preview Foto" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button 
              type="button" 
              onClick={() => setListFoto([...listFoto, { id: Date.now(), file: null as any, base64: '', keterangan: '' }])} 
              className="w-full py-3 border-2 border-dashed border-slate-300 hover:border-rose-400 rounded-xl font-bold text-slate-600 hover:text-rose-700 hover:bg-rose-50/50 flex items-center justify-center gap-2 uppercase tracking-wider text-xs transition-colors"
            >
              <PlusCircle size={16} /> Tambah Foto Lapangan
            </button>
          </div>

          {/* Saran & Masukan Lapangan */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Saran & Rekomendasi Perbaikan
            </h4>
            <div className="space-y-2.5">
              {listSaran.map((saran, i) => (
                <div key={saran.id} className="flex gap-2 items-center">
                  <span className="w-6 text-center font-bold text-slate-400 text-xs">{i + 1}.</span>
                  <input 
                    type="text" 
                    value={saran.value} 
                    onChange={(e) => {
                      const l = [...listSaran]; l[i].value = e.target.value; setListSaran(l);
                    }} 
                    placeholder="Ketik saran perbaikan kesling..." 
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" 
                  />
                  {listSaran.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => setListSaran(listSaran.filter(x => x.id !== saran.id))} 
                      className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition-colors"
                      title="Hapus Saran"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                onClick={() => setListSaran([...listSaran, { id: Date.now(), value: '' }])} 
                className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-xl font-bold text-slate-600 hover:text-amber-700 hover:bg-amber-50/50 flex items-center justify-center gap-2 uppercase tracking-wider text-xs transition-colors mt-2"
              >
                <Plus size={15} /> Tambah Saran
              </button>
            </div>
          </div>

          {/* Penilaian Skoring & Hasil Status */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Komponen Penilaian & Skor Ketaatan
                </h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Daftar komponen otomatis diambil dari Checklist Ketaatan. Cukup isi nilai skor (0 - 100) di kolom sebelah kanan.
                </p>
              </div>
              <button
                type="button"
                onClick={syncScoresFromChecklist}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto border border-slate-200 shadow-sm"
                title="Sinkronkan ulang daftar komponen dari Checklist Ketaatan"
              >
                <RefreshCcw size={13} className="text-teal-600" />
                <span>Muat Ulang dari Checklist</span>
              </button>
            </div>

            <div className="space-y-3">
              {komponenPenilaian.map((komp, idx) => {
                const isNA = (komp.nilai ?? '').toString().trim().toUpperCase() === 'N/A' || (komp.nilai ?? '').toString().trim().toUpperCase() === 'NA';
                return (
                  <div 
                    key={komp.id || idx} 
                    className={`flex flex-col sm:flex-row gap-3 p-3.5 rounded-xl border items-center transition-colors ${
                      isNA 
                        ? 'bg-amber-50/70 border-amber-200/80' 
                        : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
                    }`}
                  >
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black shrink-0 ${
                      isNA ? 'bg-amber-600 text-white' : 'bg-slate-900 text-white'
                    }`}>
                      C.{idx + 1}
                    </span>
                    <input 
                      type="text" 
                      value={komp.nama} 
                      onChange={(e) => {
                        const k = [...komponenPenilaian]; k[idx].nama = e.target.value; setKomponenPenilaian(k);
                      }} 
                      placeholder="Nama Komponen Penilaian..." 
                      className={`flex-1 px-3.5 py-2.5 border rounded-lg text-sm font-bold focus:outline-none focus:ring-2 w-full ${
                        isNA 
                          ? 'bg-amber-50/50 border-amber-200 text-amber-900 focus:ring-amber-400' 
                          : 'bg-white border-slate-200 text-slate-800 focus:ring-teal-400'
                      }`}
                    />
                    <div className="flex items-center gap-2 w-full sm:w-56 shrink-0 justify-end">
                      {/* Tombol Toggle N/A */}
                      <button
                        type="button"
                        onClick={() => {
                          const k = [...komponenPenilaian];
                          k[idx].nilai = isNA ? '' : 'N/A';
                          setKomponenPenilaian(k);
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-black transition-all border shrink-0 ${
                          isNA 
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm hover:bg-amber-600' 
                            : 'bg-white hover:bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                        title={isNA ? 'Klik untuk mengisi skor angka' : 'Tandai sebagai N/A (Tidak Ada Objek Pengawasan)'}
                      >
                        {isNA ? '✓ N/A' : 'Set N/A'}
                      </button>

                      {isNA ? (
                        <div className="w-24 px-3 py-2 bg-amber-100 border border-amber-300 rounded-lg text-center font-mono font-black text-amber-900 text-sm">
                          N/A
                        </div>
                      ) : (
                        <input 
                          type="number" 
                          min="0" 
                          max="100"
                          value={komp.nilai} 
                          onChange={(e) => {
                            const k = [...komponenPenilaian]; k[idx].nilai = e.target.value; setKomponenPenilaian(k);
                          }} 
                          placeholder="0" 
                          className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-center font-mono font-bold text-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                        />
                      )}

                      {komponenPenilaian.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => setKomponenPenilaian(komponenPenilaian.filter((_, i) => i !== idx))} 
                          className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors shrink-0"
                          title="Hapus Komponen"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <button 
                type="button" 
                onClick={() => setKomponenPenilaian([...komponenPenilaian, { id: Date.now(), nama: '', nilai: '' }])} 
                className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-teal-400 rounded-xl font-bold text-slate-600 hover:text-teal-700 hover:bg-teal-50/50 flex items-center justify-center gap-2 uppercase tracking-wider text-xs transition-colors"
              >
                <Plus size={15} /> Tambah Komponen Penilaian Lainnya
              </button>
            </div>

            {/* Banner Skor Rata-rata */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Nilai Rata-Rata Ketaatan
                </span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl sm:text-5xl font-black font-mono ${totalSkor() >= 70 ? 'text-emerald-400' : totalSkor() >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {totalSkor()}
                  </span>
                  <span className="text-sm font-bold text-slate-400">/ 100</span>
                </div>
                {(() => {
                  const stats = getScoringStats();
                  return (
                    <>
                      {stats.naCount > 0 && (
                        <p className="text-[11px] text-amber-300 font-semibold mt-1">
                          * {stats.naCount} komponen N/A diabaikan. Rata-rata dihitung dari {stats.validCount} komponen bernilai angka.
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="text-center sm:text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Status Kesimpulan
                </span>
                <span className={`inline-block px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-wider ${
                  finalStatus() === 'Taat' ? 'bg-emerald-500 text-slate-950' :
                  finalStatus() === 'Kurang Taat' ? 'bg-amber-400 text-slate-950' :
                  finalStatus() === 'Tidak Taat' ? 'bg-rose-500 text-white' :
                  'bg-slate-800 text-slate-300'
                }`}>
                  {finalStatus()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 5: PENGESAHAN, TANDA TANGAN & PARAF                                  */}
        {/* ========================================================================= */}
        <div className={`${step === 5 ? 'block' : 'hidden'} animate-in fade-in duration-200 space-y-6`}>
          {/* Bagian Pihak Usaha / Pemrakarsa */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md inline-block mb-1">
                  Pihak {isSPPG ? 'Fasilitas / SPPG' : isTokoModern ? 'Toko Modern / Pasar' : isPerumahan ? 'Pengembang' : kategori || 'Usaha'}
                </span>
                <h4 className="font-black text-sm text-slate-900 uppercase">
                  Tanda Tangan & Paraf Perwakilan Lapangan
                </h4>
              </div>
              <span className="text-xs font-bold text-slate-400">{listPerwakilan.length} Orang</span>
            </div>

            {listPerwakilan.map((perw, idx) => (
              <div key={perw.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 relative">
                {listPerwakilan.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => setListPerwakilan(listPerwakilan.filter(x => x.id !== perw.id))} 
                    className="absolute top-3 right-3 p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition-colors z-10"
                    title="Hapus Perwakilan"
                  >
                    <X size={14} />
                  </button>
                )}

                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  Perwakilan #{idx + 1}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={perw.nama} 
                      onChange={(e) => {
                        const l = [...listPerwakilan]; l[idx].nama = e.target.value; setListPerwakilan(l);
                      }} 
                      placeholder="Nama lengkap..." 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jabatan / Bagian</label>
                    <input 
                      type="text" 
                      value={perw.jabatan} 
                      onChange={(e) => {
                        const l = [...listPerwakilan]; l[idx].jabatan = e.target.value; setListPerwakilan(l);
                      }} 
                      placeholder="Jabatan..." 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nomor HP</label>
                    <input 
                      type="text" 
                      value={perw.telepon} 
                      onChange={(e) => {
                        const l = [...listPerwakilan]; l[idx].telepon = e.target.value; setListPerwakilan(l);
                      }} 
                      placeholder="08..." 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" 
                    />
                  </div>
                </div>

                {/* Kanvas TTD & Paraf (2 Kolom Lebar di Laptop) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                        Tanda Tangan
                      </span>
                      <button 
                        type="button" 
                        onClick={() => sigPerwakilanRefs.current[perw.id]?.clear()} 
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-800"
                      >
                        Hapus / Ulangi
                      </button>
                    </div>
                    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white h-28 shadow-inner">
                      <SignatureCanvas 
                        ref={(ref) => { sigPerwakilanRefs.current[perw.id] = ref }} 
                        penColor="#0f172a" 
                        canvasProps={{ className: 'w-full h-full cursor-crosshair touch-none' }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                        Paraf Singkat
                      </span>
                      <button 
                        type="button" 
                        onClick={() => parafPerwakilanRefs.current[perw.id]?.clear()} 
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-800"
                      >
                        Hapus / Ulangi
                      </button>
                    </div>
                    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white h-28 shadow-inner">
                      <SignatureCanvas 
                        ref={(ref) => { parafPerwakilanRefs.current[perw.id] = ref }} 
                        penColor="#0f172a" 
                        canvasProps={{ className: 'w-full h-full cursor-crosshair touch-none' }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button 
              type="button" 
              onClick={() => setListPerwakilan([...listPerwakilan, { id: Date.now(), nama: '', jabatan: '', telepon: '' }])} 
              className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-xl font-bold text-slate-600 hover:text-amber-700 hover:bg-amber-50/50 flex items-center justify-center gap-2 uppercase tracking-wider text-xs transition-colors"
            >
              <PlusCircle size={15} /> Tambah Perwakilan Pihak Usaha
            </button>

            {/* Paraf Pemrakarsa Footer */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                  Paraf {isSPPG ? 'Fasilitas' : 'Perusahaan'} (Untuk Footer Halaman)
                </label>
                <button 
                  type="button" 
                  onClick={() => parafPemrakarsaRef.current?.clear()} 
                  className="text-[10px] font-bold text-rose-600 hover:text-rose-800"
                >
                  Hapus / Ulangi
                </button>
              </div>
              <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50 h-24 shadow-inner max-w-sm">
                <SignatureCanvas 
                  ref={parafPemrakarsaRef} 
                  penColor="#0f172a" 
                  canvasProps={{ className: 'w-full h-full cursor-crosshair touch-none' }} 
                />
              </div>
            </div>
          </div>

          {/* Bagian Tim Pengawas DLH */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-2.5 py-1 rounded-md inline-block mb-1">
                Tim Pengawas DLH
              </span>
              <h4 className="font-black text-sm text-slate-900 uppercase">
                Tanda Tangan & Paraf Seluruh Anggota Tim
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {timTugas.map((nama, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <span className="font-black text-xs text-slate-900 block truncate border-b border-slate-200 pb-1.5">
                    {idx + 1}. {nama}
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black uppercase text-slate-500">TTD</span>
                        <button 
                          type="button" 
                          onClick={() => sigTimRefs.current[idx]?.clear()} 
                          className="text-[9px] font-bold text-rose-600 hover:text-rose-800"
                        >
                          Hapus
                        </button>
                      </div>
                      <div className="border border-slate-300 rounded-xl overflow-hidden bg-white h-24 shadow-inner">
                        <SignatureCanvas 
                          ref={(ref) => { sigTimRefs.current[idx] = ref }} 
                          penColor="#0f172a" 
                          canvasProps={{ className: 'w-full h-full cursor-crosshair touch-none' }} 
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black uppercase text-slate-500">Paraf</span>
                        <button 
                          type="button" 
                          onClick={() => parafTimRefs.current[idx]?.clear()} 
                          className="text-[9px] font-bold text-rose-600 hover:text-rose-800"
                        >
                          Hapus
                        </button>
                      </div>
                      <div className="border border-slate-300 rounded-xl overflow-hidden bg-white h-24 shadow-inner">
                        <SignatureCanvas 
                          ref={(ref) => { parafTimRefs.current[idx] = ref }} 
                          penColor="#0f172a" 
                          canvasProps={{ className: 'w-full h-full cursor-crosshair touch-none' }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bagian Saksi (Jika ada) */}
          {saksiTugas.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 bg-indigo-100 px-2.5 py-1 rounded-md inline-block mb-1">
                  Pihak Saksi / Pendamping
                </span>
                <h4 className="font-black text-sm text-slate-900 uppercase">
                  Identitas & Tanda Tangan Saksi
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {saksiTugas.map((nama, idx) => (
                  <div key={`saksi-${idx}`} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <span className="font-black text-xs text-slate-900 block truncate border-b border-slate-200 pb-1.5">
                      {idx + 1}. {nama}
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Jabatan / Instansi</label>
                        <input 
                          type="text" 
                          value={saksiDetails[idx]?.jabatan || ''} 
                          onChange={(e) => {
                            const newDetails = [...saksiDetails];
                            newDetails[idx].jabatan = e.target.value;
                            setSaksiDetails(newDetails);
                          }} 
                          placeholder="Jabatan..." 
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Nomor HP</label>
                        <input 
                          type="text" 
                          value={saksiDetails[idx]?.telepon || ''} 
                          onChange={(e) => {
                            const newDetails = [...saksiDetails];
                            newDetails[idx].telepon = e.target.value;
                            setSaksiDetails(newDetails);
                          }} 
                          placeholder="08..." 
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" 
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black uppercase text-slate-500">TTD Saksi</span>
                        <button 
                          type="button" 
                          onClick={() => sigSaksiRefs.current[idx]?.clear()} 
                          className="text-[9px] font-bold text-rose-600 hover:text-rose-800"
                        >
                          Hapus TTD
                        </button>
                      </div>
                      <div className="border border-slate-300 rounded-xl overflow-hidden bg-white h-24 shadow-inner">
                        <SignatureCanvas 
                          ref={(ref) => { sigSaksiRefs.current[idx] = ref }} 
                          penColor="#0f172a" 
                          canvasProps={{ className: 'w-full h-full cursor-crosshair touch-none' }} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </form>

      {/* FIXED BOTTOM NAVIGATION BAR (SEJAJAR PERSIS DENGAN KARTU KONTEN) */}
      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 shadow-lg">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button 
              type="button" 
              onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setStep(step - 1); }} 
              className="px-5 py-3 rounded-xl border border-slate-200 font-black text-xs sm:text-sm text-slate-700 bg-white hover:bg-slate-100 uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
            >
              <ChevronLeft size={16} />
              <span>Kembali</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 hidden sm:inline">
              Tahap {step} dari 5
            </span>

            {step < 5 ? (
              <button 
                type="button" 
                onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setStep(step + 1); }} 
                className="px-6 py-3 rounded-xl font-black text-xs sm:text-sm text-white bg-slate-900 hover:bg-slate-800 uppercase tracking-wider transition-all flex items-center gap-2 shadow-md hover:-translate-y-0.5"
              >
                <span>Lanjut ke Step {step + 1}</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button 
                type="button" 
                onClick={handleSubmit} 
                disabled={saving} 
                className="px-7 py-3 rounded-xl font-black text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/30 hover:-translate-y-0.5 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{savingText}</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Simpan & Upload Drive</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
