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
  ChevronLeft,
  Lock,
  Download,
  Printer,
  Eye,
  FileCheck
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { getTemplate } from './templates';
import LottieLoader from '@/components/LottieLoader';
import { paginateDocxContainer } from '@/lib/docx-paginator';

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
  const parafSaksiRefs = useRef<any[]>([]);

  // Step 6 Preview States
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

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

  const [listPerwakilan, setListPerwakilan] = useState<Array<{
    id: any;
    nama: string;
    jabatan: string;
    telepon: string;
    savedTtd?: string | null;
    savedParaf?: string | null;
  }>>([
    { id: Date.now(), nama: '', jabatan: '', telepon: '', savedTtd: null, savedParaf: null }
  ]);
  const sigPerwakilanRefs = useRef<any>({});
  const parafPerwakilanRefs = useRef<any>({});
  const savedSignaturesRef = useRef<{
    ttd_pemrakarsa?: string | null;
    paraf_pemrakarsa?: string | null;
    ttd_tim?: (string | null)[];
    paraf_tim?: (string | null)[];
    ttd_saksi?: (string | null)[];
    paraf_saksi?: (string | null)[];
  }>({});

  const [listDokumen, setListDokumen] = useState([{ id: Date.now(), value: '' }]);
  const [poinDokumen, setPoinDokumen] = useState<string>('');
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

  // Fungsi terpusat untuk kalkulasi otomatis nilai C.1 s/d C.5 dari checklist ketaatan & poin dokumen
  const recalculateAllScoresFromChecklist = (
    currentChecklist: any[],
    currentPoinDokumen: string,
    currentKomponen: { id: any, nama: string, nilai: string }[]
  ) => {
    return currentKomponen.map(komp => {
      const kNama = (komp.nama || '').toLowerCase();

      // C.1 Dokumen Perizinan
      if (kNama.startsWith('1.') || kNama.includes('dokumen')) {
        const pdTrim = (currentPoinDokumen || '').trim().toUpperCase();
        if (pdTrim === 'N/A' || pdTrim === 'NA' || komp.nilai === 'N/A' || komp.nilai === 'NA') {
          return { ...komp, nilai: 'N/A' };
        }
        if (currentPoinDokumen !== '' && !isNaN(Number(currentPoinDokumen))) {
          const score100 = Math.round(Number(currentPoinDokumen) * 10);
          return { ...komp, nilai: score100.toString() };
        }
        return komp;
      }

      // C.2 s/d C.5: Cocokkan dengan kategori checklist
      for (const cat of currentChecklist) {
        const babNum = (cat.bab || '').match(/^\d+/)?.[0];
        const babTitle = (cat.bab || '').toLowerCase();
        const matchNum = babNum && kNama.startsWith(`${babNum}.`);
        const matchKeyword = (babTitle.includes('air') && kNama.includes('air')) ||
                             (babTitle.includes('udara') && kNama.includes('udara')) ||
                             ((babTitle.includes('b3') || babTitle.includes('lb3')) && (kNama.includes('b3') || kNama.includes('lb3'))) ||
                             (babTitle.includes('sampah') && kNama.includes('sampah'));

        if (matchNum || matchKeyword) {
          // Jangan timpa jika komponen ini bertanda N/A
          if (komp.nilai === 'N/A' || komp.nilai === 'NA') return komp;

          // Cek jika seluruh butir yang diisi bertanda N/A
          const itemsWithInput = (cat.items || []).filter((it: any) => (it.poin ?? '').toString().trim() !== '');
          const allInputIsNA = itemsWithInput.length > 0 && itemsWithInput.every((it: any) => {
            const p = (it.poin || '').trim().toUpperCase();
            return p === 'N/A' || p === 'NA';
          });
          if (allInputIsNA) {
            return { ...komp, nilai: 'N/A' };
          }

          const scored = (cat.items || []).filter((it: any) => {
            const p = (it.poin ?? '').toString().trim().toUpperCase();
            return p !== '' && p !== 'N/A' && p !== 'NA' && !isNaN(Number(p));
          });
          if (scored.length > 0) {
            const sum = scored.reduce((acc: number, curr: any) => acc + Number(curr.poin), 0);
            const score100 = Math.round((sum / scored.length) * 10);
            return { ...komp, nilai: score100.toString() };
          }
        }
      }
      return komp;
    });
  };

  const getKomponenForBab = (babString: string) => {
    const bLower = (babString || '').toLowerCase();
    const babNum = bLower.match(/^\d+/)?.[0];

    return komponenPenilaian.find(komp => {
      const kNama = (komp.nama || '').toLowerCase();
      const matchNum = babNum && kNama.startsWith(`${babNum}.`);
      const matchKeyword = (babNum === '1' && (kNama.includes('dokumen') || kNama.startsWith('1.'))) ||
                           (bLower.includes('air') && kNama.includes('air')) ||
                           (bLower.includes('udara') && kNama.includes('udara')) ||
                           ((bLower.includes('b3') || bLower.includes('lb3')) && (kNama.includes('b3') || kNama.includes('lb3'))) ||
                           (bLower.includes('sampah') && kNama.includes('sampah'));
      return matchNum || matchKeyword;
    });
  };

  const isBabNA = (babString: string) => {
    const komp = getKomponenForBab(babString);
    if (!komp) return false;
    const val = (komp.nilai ?? '').toString().trim().toUpperCase();
    return val === 'N/A' || val === 'NA';
  };

  const toggleBabNA = (babString: string) => {
    const bLower = (babString || '').toLowerCase();
    const babNum = bLower.match(/^\d+/)?.[0];
    const currentlyNA = isBabNA(babString);

    if (!currentlyNA) {
      // Toggle ON N/A
      if (babNum === '1') setPoinDokumen('N/A');
      setKomponenPenilaian(prev => prev.map(komp => {
        const kNama = (komp.nama || '').toLowerCase();
        const matchNum = babNum && kNama.startsWith(`${babNum}.`);
        const matchKeyword = (babNum === '1' && (kNama.includes('dokumen') || kNama.startsWith('1.'))) ||
                             (bLower.includes('air') && kNama.includes('air')) ||
                             (bLower.includes('udara') && kNama.includes('udara')) ||
                             ((bLower.includes('b3') || bLower.includes('lb3')) && (kNama.includes('b3') || kNama.includes('lb3'))) ||
                             (bLower.includes('sampah') && kNama.includes('sampah'));
        if (matchNum || matchKeyword) {
          return { ...komp, nilai: 'N/A' };
        }
        return komp;
      }));
    } else {
      // Toggle OFF N/A
      const nextPoinDok = (babNum === '1' && (poinDokumen === 'N/A' || poinDokumen === 'NA')) ? '' : poinDokumen;
      if (babNum === '1') setPoinDokumen(nextPoinDok);

      const resetList = komponenPenilaian.map(komp => {
        const kNama = (komp.nama || '').toLowerCase();
        const matchNum = babNum && kNama.startsWith(`${babNum}.`);
        const matchKeyword = (babNum === '1' && (kNama.includes('dokumen') || kNama.startsWith('1.'))) ||
                             (bLower.includes('air') && kNama.includes('air')) ||
                             (bLower.includes('udara') && kNama.includes('udara')) ||
                             ((bLower.includes('b3') || bLower.includes('lb3')) && (kNama.includes('b3') || kNama.includes('lb3'))) ||
                             (bLower.includes('sampah') && kNama.includes('sampah'));
        if (matchNum || matchKeyword) {
          return { ...komp, nilai: '' };
        }
        return komp;
      });

      const recalced = recalculateAllScoresFromChecklist(checklist, nextPoinDok, resetList);
      setKomponenPenilaian(recalced);
    }
  };

  const getComponentChecklistStat = (kompNama: string) => {
    const kNama = (kompNama || '').toLowerCase();
    if (kNama.startsWith('1.') || kNama.includes('dokumen')) {
      const pdUpper = (poinDokumen || '').trim().toUpperCase();
      if (pdUpper === 'N/A' || pdUpper === 'NA') {
        return {
          hasScore: false,
          isNA: true,
          avg: 0,
          count: 0,
          isDokumen: true,
          totalItems: listDokumen.length
        };
      }
      if (poinDokumen !== '' && !isNaN(Number(poinDokumen))) {
        return {
          hasScore: true,
          isNA: false,
          avg: Number(poinDokumen),
          count: listDokumen.filter(d => d.value.trim() !== '').length || 1,
          isDokumen: true,
          totalItems: listDokumen.length
        };
      }
      return {
        hasScore: false,
        isNA: false,
        avg: 0,
        count: 0,
        isDokumen: true,
        totalItems: listDokumen.length
      };
    }

    for (const cat of checklist) {
      const babNum = (cat.bab || '').match(/^\d+/)?.[0];
      const babTitle = (cat.bab || '').toLowerCase();
      const matchNum = babNum && kNama.startsWith(`${babNum}.`);
      const matchKeyword = (babTitle.includes('air') && kNama.includes('air')) ||
                           (babTitle.includes('udara') && kNama.includes('udara')) ||
                           ((babTitle.includes('b3') || babTitle.includes('lb3')) && (kNama.includes('b3') || kNama.includes('lb3'))) ||
                           (babTitle.includes('sampah') && kNama.includes('sampah'));

      if (matchNum || matchKeyword) {
        const scored = (cat.items || []).filter((it: any) => {
          const p = (it.poin ?? '').toString().trim().toUpperCase();
          return p !== '' && p !== 'N/A' && p !== 'NA' && !isNaN(Number(p));
        });
        const naCount = (cat.items || []).filter((it: any) => {
          const p = (it.poin ?? '').toString().trim().toUpperCase();
          return p === 'N/A' || p === 'NA';
        }).length;

        if (scored.length > 0) {
          const sum = scored.reduce((acc: number, curr: any) => acc + Number(curr.poin), 0);
          const avg = Math.round((sum / scored.length) * 10) / 10;
          return {
            hasScore: true,
            isNA: false,
            avg: avg,
            count: scored.length,
            naCount: naCount,
            totalItems: (cat.items || []).length,
            isDokumen: false
          };
        }
        return {
          hasScore: false,
          isNA: false,
          avg: 0,
          count: 0,
          naCount: naCount,
          totalItems: (cat.items || []).length,
          isDokumen: false
        };
      }
    }
    return null;
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
      const savedChecklist = existingMatriks?.checklist || existingBap?.checklist;
      const savedPoinDokumen = existingMatriks?.poin_dokumen || existingBap?.poin_dokumen || '';

      let loadedChecklist: any[] = [];
      if (savedChecklist && Array.isArray(savedChecklist) && savedChecklist.length > 0) {
        loadedChecklist = savedChecklist;
      } else {
        loadedChecklist = template.map(cat => ({
          bab: cat.bab,
          items: cat.items.map(item => ({ key: item.key || item.point, point: item.point, no: item.no, kondisi: '', keterangan: '', poin: '' }))
        }));
      }
      setChecklist(loadedChecklist);

      // Komponen Penilaian otomatis diambil dari standar BAP (Pencemaran udara otomatis N/A untuk non-industri)
      const defaultScores = generateDefaultScores(agendaData.kategori);

      let loadedKomponen = defaultScores;
      if (existingBap?.rincian_skoring && Array.isArray(existingBap.rincian_skoring) && existingBap.rincian_skoring.length > 0 && existingBap.rincian_skoring.some((r: any) => r.nama && r.nama.trim() !== '')) {
        loadedKomponen = existingBap.rincian_skoring;
      }

      let currentPoinDok = savedPoinDokumen ? savedPoinDokumen.toString() : '';
      if (!currentPoinDok) {
        const c1 = loadedKomponen.find((k: any) => (k.nama || '').toLowerCase().startsWith('1.') || (k.nama || '').toLowerCase().includes('dokumen'));
        if (c1 && c1.nilai && !isNaN(Number(c1.nilai)) && Number(c1.nilai) > 0) {
          currentPoinDok = Math.round(Number(c1.nilai) / 10).toString();
        }
      }
      setPoinDokumen(currentPoinDok);

      // Hitung otomatis skor komponen dari checklist
      const calculatedScores = recalculateAllScoresFromChecklist(loadedChecklist, currentPoinDok, loadedKomponen);
      setKomponenPenilaian(calculatedScores);
      
      if (agendaData.tim_tugas) {
        let parsedTim: string[] = [];
        try { parsedTim = JSON.parse(agendaData.tim_tugas); } 
        catch { parsedTim = agendaData.tim_tugas.split('|').map((t: string) => t.trim()).filter((t: string) => t !== ''); }
        setTimTugas(parsedTim);
        sigTimRefs.current = parsedTim.map(() => null);
        parafTimRefs.current = parsedTim.map(() => null);
      }
      
      let parsedSaksi: string[] = [];
      if (existingMatriks?.saksi_names && Array.isArray(existingMatriks.saksi_names) && existingMatriks.saksi_names.length > 0) {
        parsedSaksi = existingMatriks.saksi_names;
      } else if (agendaData.saksi) {
        try { parsedSaksi = JSON.parse(agendaData.saksi); } 
        catch { parsedSaksi = agendaData.saksi.split('|').map((t: string) => t.trim()).filter((t: string) => t !== ''); }
      }
      if (parsedSaksi.length > 0) {
        setSaksiTugas(parsedSaksi);
        sigSaksiRefs.current = parsedSaksi.map(() => null);
        parafSaksiRefs.current = parsedSaksi.map(() => null);
        
        if (existingMatriks?.saksi_details && Array.isArray(existingMatriks.saksi_details) && existingMatriks.saksi_details.length > 0) {
          setSaksiDetails(existingMatriks.saksi_details);
        } else {
          setSaksiDetails(parsedSaksi.map(() => ({ jabatan: '', telepon: '' })));
        }
      }
      
      // Muat identitas eksisting jika ada
      if (existingMatriks?.identitas && typeof existingMatriks.identitas === 'object') {
        setFormData(prev => ({
          ...prev,
          ...existingMatriks.identitas,
          koordinat: existingMatriks.identitas.koordinat || ((agendaData.latitude && agendaData.longitude) ? `${agendaData.latitude}, ${agendaData.longitude}` : '')
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          koordinat: (agendaData.latitude && agendaData.longitude) ? `${agendaData.latitude}, ${agendaData.longitude}` : ''
        }));
      }

      // Muat daftar perwakilan pihak usaha jika sudah pernah disimpan
      if (existingMatriks?.perwakilan && Array.isArray(existingMatriks.perwakilan) && existingMatriks.perwakilan.length > 0) {
        setListPerwakilan(existingMatriks.perwakilan.map((p: any, idx: number) => ({
          id: p.id || (Date.now() + idx),
          nama: p.nama || '',
          jabatan: p.jabatan || '',
          telepon: p.telepon || '',
          savedTtd: p.ttd || null,
          savedParaf: p.paraf || null
        })));
      }

      // Muat daftar dokumen izin yang ditunjukkan
      if (existingMatriks?.dokumen_izin && Array.isArray(existingMatriks.dokumen_izin) && existingMatriks.dokumen_izin.length > 0) {
        setListDokumen(existingMatriks.dokumen_izin.map((docVal: string, idx: number) => ({
          id: Date.now() + idx,
          value: docVal
        })));
      }

      // Muat daftar saran masukan
      if (existingMatriks?.saran && Array.isArray(existingMatriks.saran) && existingMatriks.saran.length > 0) {
        setListSaran(existingMatriks.saran.map((saranVal: string, idx: number) => ({
          id: Date.now() + idx,
          value: saranVal
        })));
      }

      // Muat tanda tangan & paraf tersimpan untuk tim, pemrakarsa, & saksi
      let savedTtdTim: (string | null)[] = [];
      try {
        savedTtdTim = typeof existingBap?.ttd_tim === 'string' ? JSON.parse(existingBap.ttd_tim) : (existingBap?.ttd_tim || existingMatriks?.ttd_tim || []);
      } catch {
        savedTtdTim = existingMatriks?.ttd_tim || [];
      }

      let savedParafTim: (string | null)[] = [];
      try {
        savedParafTim = typeof existingBap?.paraf_tim === 'string' ? JSON.parse(existingBap.paraf_tim) : (existingBap?.paraf_tim || existingMatriks?.paraf_tim || []);
      } catch {
        savedParafTim = existingMatriks?.paraf_tim || [];
      }

      let savedTtdSaksi: (string | null)[] = [];
      try {
        savedTtdSaksi = typeof existingBap?.ttd_saksi === 'string' ? JSON.parse(existingBap.ttd_saksi) : (existingBap?.ttd_saksi || existingMatriks?.ttd_saksi || []);
      } catch {
        savedTtdSaksi = existingMatriks?.ttd_saksi || [];
      }

      let savedParafSaksi: (string | null)[] = [];
      try {
        savedParafSaksi = typeof existingBap?.paraf_saksi === 'string' ? JSON.parse(existingBap.paraf_saksi) : (existingBap?.paraf_saksi || existingMatriks?.paraf_saksi || []);
      } catch {
        savedParafSaksi = existingMatriks?.paraf_saksi || [];
      }

      savedSignaturesRef.current = {
        ttd_pemrakarsa: existingBap?.ttd_pemrakarsa || existingMatriks?.ttd_pemrakarsa || null,
        paraf_pemrakarsa: existingBap?.paraf_pemrakarsa || existingMatriks?.paraf_pemrakarsa || null,
        ttd_tim: savedTtdTim,
        paraf_tim: savedParafTim,
        ttd_saksi: savedTtdSaksi,
        paraf_saksi: savedParafSaksi
      };

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

  const handlePoinDokumenChange = (val: string) => {
    const trimmed = val.trim().toUpperCase();
    if (trimmed === 'NA' || trimmed === 'N/A') {
      setPoinDokumen('N/A');
      setKomponenPenilaian(prev => prev.map(komp => {
        const kNama = (komp.nama || '').toLowerCase();
        if (kNama.startsWith('1.') || kNama.includes('dokumen')) {
          return { ...komp, nilai: 'N/A' };
        }
        return komp;
      }));
      return;
    }

    if (val === '' || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10) || val.endsWith('.')) {
      setPoinDokumen(val);
      setKomponenPenilaian(prev => {
        const updated = prev.map(komp => {
          const kNama = (komp.nama || '').toLowerCase();
          if ((kNama.startsWith('1.') || kNama.includes('dokumen')) && (komp.nilai === 'N/A' || komp.nilai === 'NA')) {
            return { ...komp, nilai: '' };
          }
          return komp;
        });
        return recalculateAllScoresFromChecklist(checklist, val, updated);
      });
    }
  };

  const handlePoinChange = (catIdx: number, itemIdx: number, val: string) => {
    const trimmed = val.trim().toUpperCase();
    let finalVal = val;
    if (trimmed === 'NA' || trimmed === 'N/A') {
      finalVal = 'N/A';
    } else if (val !== '' && (isNaN(Number(val)) || Number(val) < 0 || Number(val) > 10)) {
      if (val !== '.' && !val.endsWith('.')) {
        return;
      }
    }

    const newChecklist = [...checklist];
    newChecklist[catIdx].items[itemIdx].poin = finalVal;
    setChecklist(newChecklist);

    // Otomatis update skor komponen penilaian dari rata-rata poin checklist
    setKomponenPenilaian(prev => recalculateAllScoresFromChecklist(newChecklist, poinDokumen, prev));
  };

  const syncScoresFromChecklist = () => {
    const defaultScores = generateDefaultScores(kategori || agenda?.kategori || '');
    const mergedScores = defaultScores.map(def => {
      // Pertahankan tanda N/A jika sebelumnya diset N/A
      const existing = komponenPenilaian.find(k => {
        const kNama = (k.nama || '').toLowerCase();
        const defKey = (def.nama || '').split('.')[1]?.trim().toLowerCase() || def.nama.toLowerCase();
        return kNama.includes(defKey);
      });
      return {
        ...def,
        id: `score_${def.id}_${Date.now()}`,
        nilai: (existing && (existing.nilai === 'N/A' || existing.nilai === 'NA')) ? 'N/A' : def.nilai
      };
    });
    const calculated = recalculateAllScoresFromChecklist(checklist, poinDokumen, mergedScores);
    setKomponenPenilaian(calculated);
  };

  // Helper untuk menyesuaikan dimensi pixel internal canvas dengan ukuran tampilan fisik layar (DPI aware & responsive)
  const resizeCanvasPad = (padRef: any, fallbackImageUrl?: string | null) => {
    if (!padRef) return;
    try {
      const canvas = padRef.getCanvas();
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const parent = canvas.parentElement;
      const parentRect = parent ? parent.getBoundingClientRect() : null;

      const displayWidth = Math.round(rect.width || parentRect?.width || canvas.offsetWidth || parent?.clientWidth || 300);
      const displayHeight = Math.round(rect.height || parentRect?.height || canvas.offsetHeight || parent?.clientHeight || 112);

      if (displayWidth <= 0 || displayHeight <= 0) return;

      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const targetInternalWidth = Math.round(displayWidth * ratio);
      const targetInternalHeight = Math.round(displayHeight * ratio);

      // Jika ukuran internal canvas sudah pas, jangan timpa / clear ulang
      if (canvas.width === targetInternalWidth && canvas.height === targetInternalHeight) {
        if (padRef.isEmpty() && fallbackImageUrl && typeof fallbackImageUrl === 'string' && fallbackImageUrl.startsWith('data:image')) {
          try {
            padRef.fromDataURL(fallbackImageUrl);
            const sigPad = padRef.getSignaturePad();
            if (sigPad) sigPad._isEmpty = false;
          } catch (e) {
            console.warn('Gagal memuat fallback tanda tangan:', e);
          }
        }
        return;
      }

      // Simpan data goresan jika pengguna sudah menggambar
      const existingData = !padRef.isEmpty() ? padRef.toData() : null;

      canvas.width = targetInternalWidth;
      canvas.height = targetInternalHeight;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.touchAction = 'none';

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
      }

      if (existingData && existingData.length > 0) {
        padRef.fromData(existingData);
      } else if (fallbackImageUrl && typeof fallbackImageUrl === 'string' && fallbackImageUrl.startsWith('data:image')) {
        try {
          padRef.fromDataURL(fallbackImageUrl);
          const sigPad = padRef.getSignaturePad();
          if (sigPad) sigPad._isEmpty = false;
        } catch (e) {
          console.warn('Gagal memuat fallback tanda tangan:', e);
        }
      } else {
        padRef.clear();
      }
    } catch (err) {
      console.warn('Canvas resize warning:', err);
    }
  };

  // Efek ketika pengguna membuka Step 5 (Pengesahan) atau ukuran layar berubah
  useEffect(() => {
    if (step === 5) {
      const resizeAllPads = () => {
        // 1. Perwakilan Usaha
        listPerwakilan.forEach(perw => {
          resizeCanvasPad(sigPerwakilanRefs.current[perw.id], perw.savedTtd);
          resizeCanvasPad(parafPerwakilanRefs.current[perw.id], perw.savedParaf);
        });

        // 2. Paraf Pemrakarsa Footer
        resizeCanvasPad(parafPemrakarsaRef.current, savedSignaturesRef.current?.paraf_pemrakarsa);

        // 3. Tim Pengawas DLH
        timTugas.forEach((_, idx) => {
          resizeCanvasPad(sigTimRefs.current[idx], savedSignaturesRef.current?.ttd_tim?.[idx]);
          resizeCanvasPad(parafTimRefs.current[idx], savedSignaturesRef.current?.paraf_tim?.[idx]);
        });

        // 4. Saksi
        saksiTugas.forEach((_, idx) => {
          resizeCanvasPad(sigSaksiRefs.current[idx], savedSignaturesRef.current?.ttd_saksi?.[idx]);
          resizeCanvasPad(parafSaksiRefs.current[idx], savedSignaturesRef.current?.paraf_saksi?.[idx]);
        });
      };

      // Jalankan segera dan beri jeda 50ms & 250ms agar layout DOM selesai dirender
      resizeAllPads();
      const t1 = setTimeout(resizeAllPads, 50);
      const t2 = setTimeout(resizeAllPads, 250);

      window.addEventListener('resize', resizeAllPads);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        window.removeEventListener('resize', resizeAllPads);
      };
    }
  }, [step, listPerwakilan.length, timTugas.length, saksiTugas.length]);

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

  const cacheCurrentSignatures = () => {
    const updatedPerw = listPerwakilan.map(p => {
      const padTtd = sigPerwakilanRefs.current[p.id];
      const padParaf = parafPerwakilanRefs.current[p.id];
      return {
        ...p,
        savedTtd: padTtd && !padTtd.isEmpty() ? padTtd.getTrimmedCanvas().toDataURL('image/png') : (p.savedTtd || null),
        savedParaf: padParaf && !padParaf.isEmpty() ? padParaf.getTrimmedCanvas().toDataURL('image/png') : (p.savedParaf || null)
      };
    });
    setListPerwakilan(updatedPerw);

    const prfPemrakarsa = parafPemrakarsaRef.current && !parafPemrakarsaRef.current.isEmpty()
      ? parafPemrakarsaRef.current.getTrimmedCanvas().toDataURL('image/png')
      : (savedSignaturesRef.current?.paraf_pemrakarsa || null);

    const ttdTim = timTugas.map((_, idx) => {
      const pad = sigTimRefs.current[idx];
      return pad && !pad.isEmpty() ? pad.getTrimmedCanvas().toDataURL('image/png') : (savedSignaturesRef.current?.ttd_tim?.[idx] || null);
    });

    const prfTim = timTugas.map((_, idx) => {
      const pad = parafTimRefs.current[idx];
      return pad && !pad.isEmpty() ? pad.getTrimmedCanvas().toDataURL('image/png') : (savedSignaturesRef.current?.paraf_tim?.[idx] || null);
    });

    const ttdSaksi = saksiTugas.map((_, idx) => {
      const pad = sigSaksiRefs.current[idx];
      return pad && !pad.isEmpty() ? pad.getTrimmedCanvas().toDataURL('image/png') : (savedSignaturesRef.current?.ttd_saksi?.[idx] || null);
    });

    const prfSaksi = saksiTugas.map((_, idx) => {
      const pad = parafSaksiRefs.current[idx];
      return pad && !pad.isEmpty() ? pad.getTrimmedCanvas().toDataURL('image/png') : (savedSignaturesRef.current?.paraf_saksi?.[idx] || null);
    });

    savedSignaturesRef.current = {
      ...savedSignaturesRef.current,
      paraf_pemrakarsa: prfPemrakarsa,
      ttd_tim: ttdTim,
      paraf_tim: prfTim,
      ttd_saksi: ttdSaksi,
      paraf_saksi: prfSaksi
    };

    return { updatedPerw, prfPemrakarsa, ttdTim, prfTim, ttdSaksi, prfSaksi };
  };

  const buildPayload = () => {
    let currentPerw = listPerwakilan;
    let ttdTim = savedSignaturesRef.current?.ttd_tim || [];
    let prfTim = savedSignaturesRef.current?.paraf_tim || [];
    let ttdSaksi = savedSignaturesRef.current?.ttd_saksi || [];
    let prfSaksi = savedSignaturesRef.current?.paraf_saksi || [];
    let prfPemrakarsa = savedSignaturesRef.current?.paraf_pemrakarsa || null;

    if (step === 5) {
      const cached = cacheCurrentSignatures();
      currentPerw = cached.updatedPerw;
      ttdTim = cached.ttdTim;
      prfTim = cached.prfTim;
      ttdSaksi = cached.ttdSaksi;
      prfSaksi = cached.prfSaksi;
      prfPemrakarsa = cached.prfPemrakarsa;
    }

    const primaryPerwTtd = currentPerw[0]?.savedTtd || null;
    const primaryPerwParaf = currentPerw[0]?.savedParaf || null;

    const ttdPemrakarsa = sigPemrakarsaRef.current && !sigPemrakarsaRef.current.isEmpty() 
      ? sigPemrakarsaRef.current.getTrimmedCanvas().toDataURL('image/png') 
      : (savedSignaturesRef.current?.ttd_pemrakarsa || primaryPerwTtd);

    const finalPrfPemrakarsa = prfPemrakarsa || primaryPerwParaf;

    return {
      bap: {
        identitas: formData,
        dokumen_izin: listDokumen.map(d => d.value).filter(v => v !== ''),
        poin_dokumen: poinDokumen,
        checklist: checklist,
        dokumentasi: listFoto.map(f => ({ keterangan: f.keterangan, file: f.base64 })),
        saran: listSaran.map(s => s.value).filter(v => v !== ''),
        rincian_skoring: komponenPenilaian,
        perwakilan: currentPerw.map(p => ({
          nama: p.nama,
          jabatan: p.jabatan,
          telepon: p.telepon,
          ttd: p.savedTtd || null,
          paraf: p.savedParaf || null
        })),
        ttd_pemrakarsa: ttdPemrakarsa,
        paraf_pemrakarsa: finalPrfPemrakarsa,
        ttd_tim: ttdTim,
        paraf_tim: prfTim,
        saksi_names: saksiTugas,
        saksi_details: saksiDetails,
        ttd_saksi: ttdSaksi,
        paraf_saksi: prfSaksi
      },
      status_ketaatan: finalStatus(),
      total_skor: totalSkor()
    };
  };

  const generateAndRenderPreview = async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const payload = buildPayload();

      // Background draft save to database so nothing is lost
      fetch(`/api/pengawasan/bap/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.warn('Auto-save notice:', err));

      const res = await fetch(`/api/pengawasan/bap/${id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errMsg = 'Gagal membuat file BAP';
        try {
          const errJson = await res.json();
          errMsg = errJson.error || errMsg;
        } catch {
          errMsg += ` (Status: ${res.status})`;
        }
        throw new Error(errMsg);
      }

      const blob = await res.blob();
      setDocxBlob(blob);

      if (previewContainerRef.current) {
        previewContainerRef.current.innerHTML = '';
        const { renderAsync } = await import('docx-preview');
        await renderAsync(blob, previewContainerRef.current, undefined, {
          className: 'docx',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          useBase64URL: true,
          ignoreLastRenderedPageBreak: true,
        });

        // Paginasikan bagian dokumen yang memanjang ke lembar fisik A4
        requestAnimationFrame(() => {
          if (previewContainerRef.current) {
            paginateDocxContainer(previewContainerRef.current);
          }
        });
        setTimeout(() => {
          if (previewContainerRef.current) {
            paginateDocxContainer(previewContainerRef.current);
          }
        }, 120);
        setTimeout(() => {
          if (previewContainerRef.current) {
            paginateDocxContainer(previewContainerRef.current);
          }
        }, 350);
      }
    } catch (err: any) {
      console.error('Preview error:', err);
      setPreviewError(err.message || 'Gagal merender pratinjau dokumen.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadDocx = () => {
    if (!docxBlob) {
      alert('Dokumen belum selesai dimuat.');
      return;
    }
    const url = URL.createObjectURL(docxBlob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (agenda?.nama_pemrakarsa || 'Usaha').replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `BAP_${safeName}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintDocx = () => {
    if (!previewContainerRef.current || !previewContainerRef.current.innerHTML) {
      alert('Pratinjau dokumen belum siap dicetak.');
      return;
    }
    const printContent = previewContainerRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>BAP - ${agenda?.nama_pemrakarsa || 'Dokumen'}</title>
          ${styles}
          <style>
            body { margin: 0; padding: 24px; background: white; font-family: sans-serif; }
            .bap-docx-viewer { width: 100% !important; margin: 0 auto !important; }
            .bap-docx-viewer .docx-wrapper { padding: 0 !important; background: white !important; }
            .bap-docx-viewer section.docx { margin-bottom: 24px !important; box-shadow: none !important; }
            @media print {
              body { padding: 0 !important; }
              @page { margin: 1cm; size: A4 portrait; }
            }
          </style>
        </head>
        <body>
          <div class="bap-docx-viewer">
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 350);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const goToStep = (targetStep: number) => {
    if (step === 5) {
      cacheCurrentSignatures();
    }
    if (targetStep === 4) {
      setKomponenPenilaian(prev => recalculateAllScoresFromChecklist(checklist, poinDokumen, prev));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(targetStep);

    if (targetStep === 6) {
      setTimeout(() => {
        generateAndRenderPreview();
      }, 80);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    setSavingText('Menyimpan ke Database...');
    try {
      const payload = buildPayload();

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
    { num: 5, title: 'Pengesahan BAP', sub: 'Tanda Tangan & Paraf' },
    { num: 6, title: 'Preview Dokumen', sub: 'Pratinjau Hasil BAP' }
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
            {stepList.map((s) => {
              const isActive = step === s.num;
              const isPast = step > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => goToStep(s.num)}
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
          <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
            isBabNA('1. Dokumen Perizinan Lingkungan') ? 'border-amber-300/80 ring-1 ring-amber-300/40' : 'border-slate-200'
          }`}>
            <div className={`px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 ${
              isBabNA('1. Dokumen Perizinan Lingkungan') ? 'bg-amber-950 text-amber-50' : 'bg-slate-900 text-white'
            }`}>
              <div className="flex items-center gap-2.5">
                <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider">
                  1. Daftar Dokumen Izin Yang Ditunjukkan
                </h4>
                {isBabNA('1. Dokumen Perizinan Lingkungan') && (
                  <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md font-black shadow-xs">
                    STATUS N/A
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Tombol Set N/A langsung di Checklist */}
                <button
                  type="button"
                  onClick={() => toggleBabNA('1. Dokumen Perizinan Lingkungan')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all border flex items-center gap-1.5 ${
                    isBabNA('1. Dokumen Perizinan Lingkungan') 
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-sm hover:bg-amber-300' 
                      : 'bg-white/10 hover:bg-white/20 text-slate-300 border-white/20'
                  }`}
                  title={isBabNA('1. Dokumen Perizinan Lingkungan') ? 'Klik untuk mengaktifkan kembali bab ini' : 'Tandai bab ini sebagai N/A (Tidak ada objek pengawasan)'}
                >
                  {isBabNA('1. Dokumen Perizinan Lingkungan') ? '✓ N/A' : 'Set N/A'}
                </button>

                {/* Poin Evaluasi Dokumen Perizinan (1 - 10 / NA) */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all ${
                  isBabNA('1. Dokumen Perizinan Lingkungan')
                    ? 'bg-amber-100/80 border-amber-300 text-amber-950'
                    : 'bg-slate-800 border-slate-700 focus-within:ring-2 focus-within:ring-teal-400'
                }`}>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    isBabNA('1. Dokumen Perizinan Lingkungan') ? 'text-amber-900' : 'text-slate-300'
                  }`}>
                    Poin (1 - 10):
                  </span>
                  <input 
                    type="text" 
                    value={poinDokumen} 
                    onChange={(e) => {
                      handlePoinDokumenChange(e.target.value);
                    }} 
                    placeholder="1-10 / NA" 
                    className={`w-16 text-center font-mono font-black text-xs bg-transparent focus:outline-none ${
                      isBabNA('1. Dokumen Perizinan Lingkungan')
                        ? 'text-amber-950 font-black'
                        : 'text-teal-300 placeholder:text-slate-500'
                    }`}
                  />
                  <span className={`text-[10px] font-black ${
                    isBabNA('1. Dokumen Perizinan Lingkungan') ? 'text-amber-800' : 'text-slate-400'
                  }`}>/ 10</span>
                </div>

                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-md font-bold">
                  {listDokumen.length} Dokumen
                </span>
              </div>
            </div>

            {isBabNA('1. Dokumen Perizinan Lingkungan') && (
              <div className="bg-amber-50 border-b border-amber-200/80 px-5 py-2.5 flex items-center justify-between gap-3 text-amber-900">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Dokumen Perizinan berstatus <b>N/A (Tidak Ada Objek / Tidak Berlaku)</b> • Tidak dihitung dalam rata-rata skor ketaatan.</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleBabNA('1. Dokumen Perizinan Lingkungan')}
                  className="text-[11px] font-black text-amber-800 underline hover:text-amber-950 shrink-0"
                >
                  Aktifkan Kembali
                </button>
              </div>
            )}

            <div className={`p-5 md:p-6 space-y-3 ${isBabNA('1. Dokumen Perizinan Lingkungan') ? 'opacity-60 bg-slate-50/50' : ''}`}>
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
              const scoredItems = (cat.items || []).filter((it: any) => {
                const p = (it.poin ?? '').toString().trim().toUpperCase();
                return p !== '' && p !== 'N/A' && p !== 'NA' && !isNaN(Number(p));
              });
              const naItems = (cat.items || []).filter((it: any) => {
                const p = (it.poin ?? '').toString().trim().toUpperCase();
                return p === 'N/A' || p === 'NA';
              });
              const hasScores = scoredItems.length > 0;
              const avgPoin = hasScores ? Math.round((scoredItems.reduce((acc: number, curr: any) => acc + Number(curr.poin), 0) / scoredItems.length) * 10) / 10 : null;
              const skorBab = avgPoin !== null ? Math.round(avgPoin * 10) : null;
              const babIsNA = isBabNA(cat.bab);

              return (
                <div key={catIdx} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  babIsNA ? 'border-amber-300/80 ring-1 ring-amber-300/40' : 'border-slate-200'
                }`}>
                  <div className={`px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 ${
                    babIsNA ? 'bg-amber-950 text-amber-50' : 'bg-slate-900 text-white'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider">{cat.bab}</h4>
                      {babIsNA && (
                        <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md font-black shadow-xs">
                          STATUS N/A
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Tombol Set N/A langsung di Checklist */}
                      <button
                        type="button"
                        onClick={() => toggleBabNA(cat.bab)}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all border flex items-center gap-1.5 ${
                          babIsNA 
                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-sm hover:bg-amber-300' 
                            : 'bg-white/10 hover:bg-white/20 text-slate-300 border-white/20'
                        }`}
                        title={babIsNA ? 'Klik untuk mengaktifkan kembali bab ini' : 'Tandai bab ini sebagai N/A (Tidak ada objek pengawasan)'}
                      >
                        {babIsNA ? '✓ N/A' : 'Set N/A'}
                      </button>

                      {!babIsNA && hasScores && (
                        <span className="text-[10px] bg-teal-500/30 text-teal-200 border border-teal-400/30 px-2.5 py-0.5 rounded-md font-bold">
                          Rata-rata: {avgPoin}/10 (Skor: {skorBab})
                        </span>
                      )}
                      {!babIsNA && naItems.length > 0 && !hasScores && (
                        <span className="text-[10px] bg-amber-500/30 text-amber-200 border border-amber-400/30 px-2 py-0.5 rounded-md font-bold">
                          {naItems.length} Butir N/A
                        </span>
                      )}
                      <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-md font-bold">
                        {cat.items.length} Poin Evaluasi
                      </span>
                    </div>
                  </div>

                  {babIsNA && (
                    <div className="bg-amber-50 border-b border-amber-200/80 px-5 py-2.5 flex items-center justify-between gap-3 text-amber-900">
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span>Objek pengawasan ini berstatus <b>N/A (Tidak Ada Objek / Tidak Berlaku)</b> • Tidak dihitung dalam rata-rata skor ketaatan.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleBabNA(cat.bab)}
                        className="text-[11px] font-black text-amber-800 underline hover:text-amber-950 shrink-0"
                      >
                        Aktifkan Kembali
                      </button>
                    </div>
                  )}

                  <div className={`p-5 md:p-6 divide-y divide-slate-100 ${babIsNA ? 'opacity-60 bg-slate-50/50' : ''}`}>
                    {cat.items.map((item: any, itemIdx: number) => {
                      const itemIsNA = (item.poin ?? '').toString().toUpperCase() === 'N/A' || (item.poin ?? '').toString().toUpperCase() === 'NA';
                      return (
                        <div key={itemIdx} className="py-4 first:pt-0 last:pb-0 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <span className={`px-2.5 py-0.5 min-w-[34px] h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 mt-0.5 font-mono shadow-xs ${
                                itemIsNA || babIsNA ? 'bg-amber-100 text-amber-950' : 'bg-amber-100 text-amber-900'
                              }`}>
                                {babNum}.{item.no}
                              </span>
                              <p className="font-bold text-slate-900 text-sm leading-relaxed">
                                {item.point}
                              </p>
                            </div>

                            {/* Poin Evaluasi (1 - 10 / N/A) */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto pl-10 sm:pl-0">
                              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                Poin:
                              </span>
                              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all ${
                                itemIsNA 
                                  ? 'bg-amber-100/80 border-amber-300 text-amber-950' 
                                  : 'bg-slate-50 border-slate-200 focus-within:ring-2 focus-within:ring-teal-400 focus-within:bg-white'
                              }`}>
                                <input 
                                  type="text" 
                                  value={item.poin ?? ''} 
                                  onChange={(e) => {
                                    handlePoinChange(catIdx, itemIdx, e.target.value);
                                  }} 
                                  placeholder="1-10" 
                                  className={`w-14 text-center font-mono font-black text-sm bg-transparent focus:outline-none ${
                                    itemIsNA ? 'text-amber-950 font-black' : 'text-teal-800'
                                  }`}
                                />
                                <span className={`text-xs font-black ${itemIsNA ? 'text-amber-800' : 'text-slate-400'}`}>/ 10</span>
                              </div>

                              {/* Tombol Cepat N/A per butir */}
                              <button
                                type="button"
                                onClick={() => {
                                  handlePoinChange(catIdx, itemIdx, itemIsNA ? '' : 'N/A');
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-black border transition-all ${
                                  itemIsNA 
                                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs' 
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                                }`}
                                title="Tandai butir ini N/A atau klik lagi untuk batal"
                              >
                                {itemIsNA ? '✓ N/A' : 'N/A'}
                              </button>
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
                      );
                    })}
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
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Komponen Penilaian & Skor Ketaatan
                  </h4>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1">
                    <Lock size={10} /> Terkunci Otomatis
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Daftar komponen dan nilai skor terisi otomatis dari Checklist Ketaatan di Tahap 3 (tidak dapat diedit manual).
                </p>
              </div>
              <button
                type="button"
                onClick={syncScoresFromChecklist}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto border border-slate-200 shadow-sm"
                title="Sinkronkan ulang daftar komponen dari Checklist Ketaatan"
              >
                <RefreshCcw size={13} className="text-teal-600" />
                <span>Hitung Ulang dari Checklist</span>
              </button>
            </div>

            <div className="space-y-3">
              {komponenPenilaian.map((komp, idx) => {
                const isNA = (komp.nilai ?? '').toString().trim().toUpperCase() === 'N/A' || (komp.nilai ?? '').toString().trim().toUpperCase() === 'NA';
                const stat = getComponentChecklistStat(komp.nama);

                return (
                  <div 
                    key={komp.id || idx} 
                    className={`flex flex-col sm:flex-row gap-3 p-3.5 rounded-xl border items-start sm:items-center transition-colors ${
                      isNA 
                        ? 'bg-amber-50/70 border-amber-200/80' 
                        : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
                    }`}
                  >
                    <div className="flex-1 w-full space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black shrink-0 ${
                          isNA ? 'bg-amber-600 text-white' : 'bg-slate-900 text-white'
                        }`}>
                          C.{idx + 1}
                        </span>
                        <input 
                          type="text" 
                          value={komp.nama} 
                          readOnly 
                          title="Komponen standar pengawasan BAP"
                          className={`flex-1 px-3.5 py-2.5 border rounded-lg text-sm font-bold w-full cursor-default focus:outline-none ${
                            isNA 
                              ? 'bg-amber-50/50 border-amber-200 text-amber-900' 
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>

                      {/* Info Nilai Otomatis dari Checklist */}
                      {!isNA && stat && stat.hasScore && (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-1 rounded-lg ml-0 sm:ml-10 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                          <span>
                            {stat.isDokumen ? (
                              <>✓ Otomatis dari Dokumen: Nilai <b>{stat.avg}/10</b> &rarr; Skor <b>{Math.round(stat.avg * 10)}</b></>
                            ) : (
                              <>✓ Otomatis dari Checklist: Rata-rata <b>{stat.avg}/10</b> ({stat.count} butir dinilai) &rarr; Skor <b>{Math.round(stat.avg * 10)}</b></>
                            )}
                          </span>
                        </div>
                      )}
                      {!isNA && stat && !stat.hasScore && (
                        <div className="text-[11px] font-medium text-slate-400 ml-0 sm:ml-10">
                          * Belum ada poin di checklist ({stat.totalItems} butir belum dinilai di Tahap 3)
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end self-end sm:self-center">
                      {/* Tombol Toggle N/A */}
                      <button
                        type="button"
                        onClick={() => toggleBabNA(komp.nama)}
                        className={`px-3 py-2 rounded-lg text-xs font-black transition-all border shrink-0 ${
                          isNA 
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm hover:bg-amber-400 font-black' 
                            : 'bg-white hover:bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                        title={isNA ? 'Kembalikan ke nilai checklist' : 'Tandai sebagai N/A (Tidak Ada Objek Pengawasan)'}
                      >
                        {isNA ? '✓ N/A' : 'Set N/A'}
                      </button>

                      {isNA ? (
                        <div className="w-24 px-3 py-2 bg-amber-100 border border-amber-300 rounded-lg text-center font-mono font-black text-amber-900 text-sm select-none">
                          N/A
                        </div>
                      ) : (
                        <div 
                          className="w-24 px-3 py-2 bg-slate-100 border border-slate-300/80 rounded-lg text-center font-mono font-black text-lg text-slate-900 select-none shadow-xs flex items-center justify-center gap-1 cursor-default"
                          title="Terkunci: Nilai terisi otomatis dari poin Checklist Ketaatan di Tahap 3"
                        >
                          <span>{komp.nilai !== '' ? komp.nilai : '0'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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

                {/* Kanvas TTD & Paraf: Kolom TTD Luas & Kolom Paraf Ringkas */}
                <div className="flex flex-col sm:flex-row gap-4 pt-2 items-start">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                        Tanda Tangan
                      </span>
                      <button 
                        type="button" 
                        onClick={() => {
                          sigPerwakilanRefs.current[perw.id]?.clear();
                          const l = [...listPerwakilan];
                          if (l[idx]) l[idx].savedTtd = null;
                          setListPerwakilan(l);
                        }} 
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-800"
                      >
                        Hapus / Ulangi
                      </button>
                    </div>
                    <div className="relative border border-slate-300 rounded-xl overflow-hidden bg-white h-28 shadow-inner select-none" style={{ touchAction: 'none' }}>
                      <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-2.5 opacity-25 select-none">
                        <div className="w-full border-b border-dashed border-slate-400"></div>
                        <span className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Area Tanda Tangan</span>
                      </div>
                      <SignatureCanvas 
                        ref={(ref) => { 
                          sigPerwakilanRefs.current[perw.id] = ref;
                          if (ref && step === 5) {
                            setTimeout(() => resizeCanvasPad(ref, perw.savedTtd), 20);
                          }
                        }} 
                        penColor="#0f172a" 
                        minWidth={1.6}
                        maxWidth={2.4}
                        velocityFilterWeight={0.4}
                        canvasProps={{ 
                          className: 'w-full h-full cursor-crosshair block relative z-10',
                          style: { width: '100%', height: '100%', touchAction: 'none' }
                        }} 
                      />
                    </div>
                  </div>

                  <div className="w-full sm:w-48 md:w-56 shrink-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                        Paraf Singkat
                      </span>
                      <button 
                        type="button" 
                        onClick={() => {
                          parafPerwakilanRefs.current[perw.id]?.clear();
                          const l = [...listPerwakilan];
                          if (l[idx]) l[idx].savedParaf = null;
                          setListPerwakilan(l);
                        }} 
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-800"
                      >
                        Hapus / Ulangi
                      </button>
                    </div>
                    <div className="relative border border-slate-300 rounded-xl overflow-hidden bg-white h-28 shadow-inner select-none" style={{ touchAction: 'none' }}>
                      <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-2.5 opacity-25 select-none">
                        <div className="w-full border-b border-dashed border-slate-400"></div>
                        <span className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Area Paraf</span>
                      </div>
                      <SignatureCanvas 
                        ref={(ref) => { 
                          parafPerwakilanRefs.current[perw.id] = ref;
                          if (ref && step === 5) {
                            setTimeout(() => resizeCanvasPad(ref, perw.savedParaf), 20);
                          }
                        }} 
                        penColor="#0f172a" 
                        minWidth={1.6}
                        maxWidth={2.4}
                        velocityFilterWeight={0.4}
                        canvasProps={{ 
                          className: 'w-full h-full cursor-crosshair block relative z-10',
                          style: { width: '100%', height: '100%', touchAction: 'none' }
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button 
              type="button" 
              onClick={() => setListPerwakilan([...listPerwakilan, { id: Date.now(), nama: '', jabatan: '', telepon: '', savedTtd: null, savedParaf: null }])} 
              className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-xl font-bold text-slate-600 hover:text-amber-700 hover:bg-amber-50/50 flex items-center justify-center gap-2 uppercase tracking-wider text-xs transition-colors"
            >
              <PlusCircle size={15} /> Tambah Perwakilan Pihak Usaha
            </button>

            {/* Paraf Pemrakarsa Footer */}
            <div className="pt-4 border-t border-slate-100">
              <div className="w-full sm:w-56">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                    Paraf {isSPPG ? 'Fasilitas' : 'Perusahaan'} (Footer Dokumen)
                  </label>
                  <button 
                    type="button" 
                    onClick={() => {
                      parafPemrakarsaRef.current?.clear();
                      if (savedSignaturesRef.current) savedSignaturesRef.current.paraf_pemrakarsa = null;
                    }} 
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-800"
                  >
                    Hapus / Ulangi
                  </button>
                </div>
                <div className="relative border border-slate-300 rounded-xl overflow-hidden bg-slate-50 h-24 shadow-inner w-full select-none" style={{ touchAction: 'none' }}>
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-2 opacity-25 select-none">
                    <div className="w-full border-b border-dashed border-slate-400"></div>
                    <span className="text-[9px] text-slate-500 mt-0.5 uppercase font-bold tracking-wider">Paraf Footer Dokumen</span>
                  </div>
                  <SignatureCanvas 
                    ref={(ref) => {
                      parafPemrakarsaRef.current = ref;
                      if (ref && step === 5) {
                        setTimeout(() => resizeCanvasPad(ref, savedSignaturesRef.current?.paraf_pemrakarsa), 20);
                      }
                    }} 
                    penColor="#0f172a" 
                    minWidth={1.6}
                    maxWidth={2.4}
                    velocityFilterWeight={0.4}
                    canvasProps={{ 
                      className: 'w-full h-full cursor-crosshair block relative z-10',
                      style: { width: '100%', height: '100%', touchAction: 'none' }
                    }} 
                  />
                </div>
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
                  
                  <div className="flex gap-3 items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black uppercase text-slate-500">TTD</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            sigTimRefs.current[idx]?.clear();
                            if (savedSignaturesRef.current?.ttd_tim) savedSignaturesRef.current.ttd_tim[idx] = null;
                          }} 
                          className="text-[9px] font-bold text-rose-600 hover:text-rose-800"
                        >
                          Hapus
                        </button>
                      </div>
                      <div className="relative border border-slate-300 rounded-xl overflow-hidden bg-white h-24 shadow-inner select-none" style={{ touchAction: 'none' }}>
                        <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-2 opacity-25 select-none">
                          <div className="w-full border-b border-dashed border-slate-400"></div>
                          <span className="text-[9px] text-slate-500 mt-0.5 uppercase font-bold tracking-wider">TTD Petugas</span>
                        </div>
                        <SignatureCanvas 
                          ref={(ref) => { 
                            sigTimRefs.current[idx] = ref;
                            if (ref && step === 5) {
                              setTimeout(() => resizeCanvasPad(ref, savedSignaturesRef.current?.ttd_tim?.[idx]), 20);
                            }
                          }} 
                          penColor="#0f172a" 
                          minWidth={1.6}
                          maxWidth={2.4}
                          velocityFilterWeight={0.4}
                          canvasProps={{ 
                            className: 'w-full h-full cursor-crosshair block relative z-10',
                            style: { width: '100%', height: '100%', touchAction: 'none' }
                          }} 
                        />
                      </div>
                    </div>

                    <div className="w-28 sm:w-32 shrink-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black uppercase text-slate-500">Paraf</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            parafTimRefs.current[idx]?.clear();
                            if (savedSignaturesRef.current?.paraf_tim) savedSignaturesRef.current.paraf_tim[idx] = null;
                          }} 
                          className="text-[9px] font-bold text-rose-600 hover:text-rose-800"
                        >
                          Hapus
                        </button>
                      </div>
                      <div className="relative border border-slate-300 rounded-xl overflow-hidden bg-white h-24 shadow-inner select-none" style={{ touchAction: 'none' }}>
                        <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-2 opacity-25 select-none">
                          <div className="w-full border-b border-dashed border-slate-400"></div>
                          <span className="text-[9px] text-slate-500 mt-0.5 uppercase font-bold tracking-wider">Paraf Petugas</span>
                        </div>
                        <SignatureCanvas 
                          ref={(ref) => { 
                            parafTimRefs.current[idx] = ref;
                            if (ref && step === 5) {
                              setTimeout(() => resizeCanvasPad(ref, savedSignaturesRef.current?.paraf_tim?.[idx]), 20);
                            }
                          }} 
                          penColor="#0f172a" 
                          minWidth={1.6}
                          maxWidth={2.4}
                          velocityFilterWeight={0.4}
                          canvasProps={{ 
                            className: 'w-full h-full cursor-crosshair block relative z-10',
                            style: { width: '100%', height: '100%', touchAction: 'none' }
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bagian Saksi */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 bg-indigo-100 px-2.5 py-1 rounded-md inline-block mb-1">
                  Pihak Saksi / Pendamping
                </span>
                <h4 className="font-black text-sm text-slate-900 uppercase">
                  Identitas, Tanda Tangan & Paraf Saksi
                </h4>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  const newName = `Saksi ${saksiTugas.length + 1}`;
                  setSaksiTugas(prev => [...prev, newName]);
                  setSaksiDetails(prev => [...prev, { jabatan: '', telepon: '' }]);
                  sigSaksiRefs.current.push(null);
                  parafSaksiRefs.current.push(null);
                }} 
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-indigo-200 self-start sm:self-auto shadow-sm"
              >
                <PlusCircle size={14} /> Tambah Saksi
              </button>
            </div>

            {saksiTugas.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500 font-bold mb-3">Belum ada saksi terdaftar untuk agenda ini.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSaksiTugas(['Saksi 1']);
                    setSaksiDetails([{ jabatan: '', telepon: '' }]);
                    sigSaksiRefs.current.push(null);
                    parafSaksiRefs.current.push(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-sm"
                >
                  <PlusCircle size={14} /> Tambah Saksi / Pendamping
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {saksiTugas.map((nama, idx) => (
                  <div key={`saksi-${idx}`} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 gap-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="font-black text-xs text-slate-500 shrink-0">{idx + 1}.</span>
                        <input
                          type="text"
                          value={nama}
                          onChange={(e) => {
                            const updated = [...saksiTugas];
                            updated[idx] = e.target.value;
                            setSaksiTugas(updated);
                          }}
                          placeholder="Nama Saksi..."
                          className="w-full text-xs font-black text-slate-900 bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 px-1 py-0.5"
                        />
                      </div>
                      {saksiTugas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newSaksi = saksiTugas.filter((_, i) => i !== idx);
                            const newDetails = saksiDetails.filter((_, i) => i !== idx);
                            setSaksiTugas(newSaksi);
                            setSaksiDetails(newDetails);
                            if (savedSignaturesRef.current?.ttd_saksi) {
                              savedSignaturesRef.current.ttd_saksi.splice(idx, 1);
                            }
                            if (savedSignaturesRef.current?.paraf_saksi) {
                              savedSignaturesRef.current.paraf_saksi.splice(idx, 1);
                            }
                          }}
                          className="text-[10px] font-bold text-rose-500 hover:text-rose-700 shrink-0"
                        >
                          Hapus Saksi
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Jabatan / Instansi</label>
                        <input 
                          type="text" 
                          value={saksiDetails[idx]?.jabatan || ''} 
                          onChange={(e) => {
                            const newDetails = [...saksiDetails];
                            newDetails[idx] = { ...newDetails[idx], jabatan: e.target.value };
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
                            newDetails[idx] = { ...newDetails[idx], telepon: e.target.value };
                            setSaksiDetails(newDetails);
                          }} 
                          placeholder="08..." 
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400" 
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-black uppercase text-slate-500">TTD Saksi</span>
                          <button 
                            type="button" 
                            onClick={() => {
                              sigSaksiRefs.current[idx]?.clear();
                              if (savedSignaturesRef.current?.ttd_saksi) savedSignaturesRef.current.ttd_saksi[idx] = null;
                            }} 
                            className="text-[9px] font-bold text-rose-600 hover:text-rose-800"
                          >
                            Hapus
                          </button>
                        </div>
                        <div className="relative border border-slate-300 rounded-xl overflow-hidden bg-white h-24 shadow-inner select-none" style={{ touchAction: 'none' }}>
                          <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-2 opacity-25 select-none">
                            <div className="w-full border-b border-dashed border-slate-400"></div>
                            <span className="text-[9px] text-slate-500 mt-0.5 uppercase font-bold tracking-wider">TTD Saksi</span>
                          </div>
                          <SignatureCanvas 
                            ref={(ref) => { 
                              sigSaksiRefs.current[idx] = ref;
                              if (ref && step === 5) {
                                setTimeout(() => resizeCanvasPad(ref, savedSignaturesRef.current?.ttd_saksi?.[idx]), 20);
                              }
                            }} 
                            penColor="#0f172a" 
                            minWidth={1.6}
                            maxWidth={2.4}
                            velocityFilterWeight={0.4}
                            canvasProps={{ 
                              className: 'w-full h-full cursor-crosshair block relative z-10',
                              style: { width: '100%', height: '100%', touchAction: 'none' }
                            }} 
                          />
                        </div>
                      </div>

                      <div className="w-28 sm:w-32 shrink-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-black uppercase text-slate-500">Paraf</span>
                          <button 
                            type="button" 
                            onClick={() => {
                              parafSaksiRefs.current[idx]?.clear();
                              if (savedSignaturesRef.current?.paraf_saksi) savedSignaturesRef.current.paraf_saksi[idx] = null;
                            }} 
                            className="text-[9px] font-bold text-rose-600 hover:text-rose-800"
                          >
                            Hapus
                          </button>
                        </div>
                        <div className="relative border border-slate-300 rounded-xl overflow-hidden bg-white h-24 shadow-inner select-none" style={{ touchAction: 'none' }}>
                          <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-2 opacity-25 select-none">
                            <div className="w-full border-b border-dashed border-slate-400"></div>
                            <span className="text-[9px] text-slate-500 mt-0.5 uppercase font-bold tracking-wider">Paraf Saksi</span>
                          </div>
                          <SignatureCanvas 
                            ref={(ref) => { 
                              parafSaksiRefs.current[idx] = ref;
                              if (ref && step === 5) {
                                setTimeout(() => resizeCanvasPad(ref, savedSignaturesRef.current?.paraf_saksi?.[idx]), 20);
                              }
                            }} 
                            penColor="#0f172a" 
                            minWidth={1.6}
                            maxWidth={2.4}
                            velocityFilterWeight={0.4}
                            canvasProps={{ 
                              className: 'w-full h-full cursor-crosshair block relative z-10',
                              style: { width: '100%', height: '100%', touchAction: 'none' }
                            }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 6: PREVIEW HASIL BAP & PRATINJAU DOKUMEN                             */}
        {/* ========================================================================= */}
        <div className={`${step === 6 ? 'block' : 'hidden'} animate-in fade-in duration-200 space-y-6`}>
          {/* Header & Control Bar Card */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
                  Tahap 6 • Pratinjau Dokumen BAP
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Hasil Otomatis Docx Sesuai Format Resmi
                </span>
              </div>
              <h3 className="font-black text-slate-900 text-base md:text-lg tracking-tight">
                Pratinjau Dokumen Berita Acara Pengawasan (BAP)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dokumen telah terisi otomatis dengan identitas, data operasional, checklist evaluasi, dokumentasi foto, dan tanda tangan digital.
              </p>
            </div>

            {/* Toolbar Buttons */}
            <div className="flex items-center flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={generateAndRenderPreview}
                disabled={previewLoading}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                title="Muat ulang pratinjau dokumen"
              >
                <RefreshCcw size={14} className={previewLoading ? 'animate-spin text-teal-600' : ''} />
                <span>Segarkan</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadDocx}
                disabled={previewLoading || !docxBlob}
                className="px-4 py-2.5 rounded-xl border border-teal-200 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Download size={14} />
                <span>Unduh Word (.docx)</span>
              </button>

              <button
                type="button"
                onClick={handlePrintDocx}
                disabled={previewLoading}
                className="px-4 py-2.5 rounded-xl border border-indigo-200 text-xs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Printer size={14} />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
          </div>

          {/* Alert Panduan */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Periksa Kembali Sebelum Simpan:</span> Pastikan seluruh data, foto, dan tanda tangan pada halaman pratinjau di bawah ini sudah lengkap dan sesuai. Jika ingin mengubah atau menambah data, silakan klik tombol <strong>Kembali</strong> atau pilih nomor tahap di atas. Setelah yakin, klik tombol hijau <strong>Simpan & Upload Drive</strong> di pojok kanan bawah.
            </div>
          </div>

          {/* Document Preview Viewport */}
          <div className="bg-slate-100 p-4 sm:p-6 rounded-2xl border border-slate-300 h-[calc(100vh-270px)] min-h-[600px] max-h-[820px] flex flex-col items-center justify-start overflow-y-auto overflow-x-auto shadow-inner relative custom-scrollbar">
            {previewLoading && (
              <div className="py-24 flex flex-col items-center justify-center">
                <LottieLoader size={120} text="MEMBUAT PRATINJAU DOKUMEN BAP..." />
                <p className="text-xs text-slate-500 font-medium mt-2">Menyusun format tabel, foto dokumentasi, dan tanda tangan digital...</p>
              </div>
            )}

            {previewError && !previewLoading && (
              <div className="py-16 text-center max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle size={24} />
                </div>
                <h4 className="font-black text-slate-800 text-base mb-1">Gagal Menampilkan Pratinjau</h4>
                <p className="text-xs text-slate-500 mb-4">{previewError}</p>
                <button
                  type="button"
                  onClick={generateAndRenderPreview}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-all inline-flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCcw size={14} />
                  <span>Coba Muat Ulang</span>
                </button>
              </div>
            )}

            <div 
              ref={previewContainerRef} 
              className={`bap-docx-viewer w-full flex justify-center transition-all ${previewLoading || previewError ? 'hidden' : 'block'}`}
            />
          </div>
        </div>

      </form>

      {/* FIXED BOTTOM NAVIGATION BAR (SEJAJAR PERSIS DENGAN KARTU KONTEN) */}
      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 shadow-lg">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button 
              type="button" 
              onClick={() => goToStep(step - 1)} 
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
              Tahap {step} dari 6
            </span>

            {step < 6 ? (
              <button 
                type="button" 
                onClick={() => goToStep(step + 1)} 
                className="px-6 py-3 rounded-xl font-black text-xs sm:text-sm text-white bg-slate-900 hover:bg-slate-800 uppercase tracking-wider transition-all flex items-center gap-2 shadow-md hover:-translate-y-0.5"
              >
                <span>{step === 5 ? 'Lanjut ke Preview BAP' : `Lanjut ke Step ${step + 1}`}</span>
                {step === 5 ? <Eye size={16} /> : <ChevronRight size={16} />}
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
