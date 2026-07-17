import { useState, useEffect, useRef } from 'react';





import { decode } from 'base64-arraybuffer';

import { getTemplate } from '../../../lib/templates';

export default function FormBAP({ agendaData, setScreen, supabase }: any) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  
  const [existingBapData, setExistingBapData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    waktu_pengawasan: '',
    kbli: '', alamat: '', tahun_operasi: '', status_permodalan: '',
    pj_nama: '', pj_jabatan: '', pendamping_nama: '', pendamping_jabatan: '', telepon: '', koordinat: '',
    batas_utara: '', batas_selatan: '', batas_barat: '', batas_timur: '',
    luas_total: '', luas_terbangun: '', luas_terbuka: '', luas_bangunan: '',
    kapasitas_izin: '', kapasitas_riil: '', jumlah_karyawan: '', jumlah_pasien: '',
    shift_kerja: '', hari_kerja_minggu: '',
    teknologi_air_limbah: '', volume_air_limbah: '', pemanfaatan_air_tanah: '',
    penggunaan_air_liter: '', penggunaan_energi: '',
    debit_inlet: '', debit_outlet: '',
    kapasitas_produksi: '', jenis_produk: '', bahan_baku_utama: '', bahan_penolong: '',
    proses_produksi: '', energi: '', pembuangan_air: '', pengelolaan_sampah_umum: '',
    pengelolaan_b3_umum: '', sumber_air_bersih: '', persetujuan_teknis: '', slo: '',
    sertifikasi_iso: '', struktur_organisasi: '', jam_produksi: '', hari_kerja: '',
    penggunaan_air_per_hari: '', nilai_investasi: '',
    jumlah_pekerja: '', jumlah_penghuni: '', jam_kerja_hari: '', shift_kerja_konstruksi: '',
    kapasitas_kegiatan: '', jumlah_karyawan_pengunjung: '',
    dokumen_dimiliki: '', persetujuan_lingkungan: '',
    riwayat_ketaatan: '', inspeksi_terakhir: ''
  });

  const [checklist, setChecklist] = useState<any[]>([]);
  const [photos, setPhotos] = useState<{uri: string, base64?: string, keterangan: string, path?: string}[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // New States for Dynamic Lists & Signatures
  const [listPerwakilan, setListPerwakilan] = useState<any[]>([{ id: Date.now(), nama: '', jabatan: '', telepon: '', ttd: null, paraf: null }]);
  const [parafPerusahaan, setParafPerusahaan] = useState<string | null>(null);
  const [timTugas, setTimTugas] = useState<string[]>([]);
  const [ttdTim, setTtdTim] = useState<(string | null)[]>([]);
  const [parafTim, setParafTim] = useState<(string | null)[]>([]);
  
  const [saksiTugas, setSaksiTugas] = useState<string[]>([]);
  const [ttdSaksi, setTtdSaksi] = useState<(string | null)[]>([]);
  const [parafSaksi, setParafSaksi] = useState<(string | null)[]>([]);
  
  const [listDokumen, setListDokumen] = useState<any[]>([{ id: Date.now(), value: '' }]);
  const [listSaran, setListSaran] = useState<any[]>([{ id: Date.now(), value: '' }]);
  const [komponenPenilaian, setKomponenPenilaian] = useState<any[]>([{ id: Date.now(), nama: '', nilai: '' }]);

  const [modalSig, setModalSig] = useState<{ visible: boolean, type: string, index?: number }>({ visible: false, type: '' });
  const signatureRef = useRef<any>(null); // Reused for modal

  const kategoriLow = (agendaData?.kategori || '').toLowerCase();
  const isIndustri = kategoriLow.includes('industri') || kategoriLow.includes('manufaktur') || kategoriLow.includes('tambang');
  const isFasyankes = kategoriLow.includes('fasyankes') || kategoriLow.includes('kesehatan') || kategoriLow.includes('klinik') || kategoriLow.includes('rs');
  const isPerumahan = kategoriLow.includes('perumahan') || kategoriLow.includes('pengembang');
  const isTokoModern = kategoriLow.includes('toko') || kategoriLow.includes('pasar') || kategoriLow.includes('mall');
  const isSPPG = kategoriLow.includes('sppg') || kategoriLow.includes('spbu');

  useEffect(() => {
    if (agendaData) {
      if (agendaData.kategori) {
        const template = getTemplate(agendaData.kategori);
        setChecklist(template.map((cat: any) => ({
          bab: cat.bab,
          items: cat.items.map((item: any) => ({ point: item.point, no: item.no, kondisi: '', keterangan: '' }))
        })));
        
        const initialScores = [
          { id: 'score_dokumen', nama: '1. Dokumen Perizinan', nilai: '' },
          ...template.map((cat: any, idx: number) => ({
            id: `score_${idx}`,
            nama: cat.bab,
            nilai: ''
          }))
        ];
        setKomponenPenilaian(initialScores);
      }
      
      if (agendaData.tim_tugas) {
        let parsedTim: string[] = [];
        try { parsedTim = JSON.parse(agendaData.tim_tugas); } 
        catch { parsedTim = agendaData.tim_tugas.split('|').map((t: string) => t.trim()).filter((t: string) => t !== ''); }
        setTimTugas(parsedTim);
        setTtdTim(parsedTim.map(() => null));
        setParafTim(parsedTim.map(() => null));
      }
      
      if (agendaData.saksi) {
        let parsedSaksi: string[] = [];
        try { parsedSaksi = JSON.parse(agendaData.saksi); } 
        catch { parsedSaksi = agendaData.saksi.split('|').map((s: string) => s.trim()).filter((s: string) => s !== ''); }
        setSaksiTugas(parsedSaksi);
        setTtdSaksi(parsedSaksi.map(() => null));
        setParafSaksi(parsedSaksi.map(() => null));
      }

      loadDraft();
    }
  }, [agendaData]);

  const loadDraft = async () => {
    try {
      const draft = await Promise.resolve(localStorage.getItem(`@draft_${agendaData.id}`));
      if (draft) {
        const parsed = JSON.parse(draft);
        alert("Draft Ditemukan: Ada data draft offline yang belum tersinkronisasi. Data akan dimuat.");
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.checklist) setChecklist(parsed.checklist);
        if (parsed.photos) setPhotos(parsed.photos);
        if (parsed.listPerwakilan) setListPerwakilan(parsed.listPerwakilan);
        if (parsed.parafPerusahaan) setParafPerusahaan(parsed.parafPerusahaan);
        if (parsed.ttdTim) setTtdTim(parsed.ttdTim);
        if (parsed.parafTim) setParafTim(parsed.parafTim);
        if (parsed.ttdSaksi) setTtdSaksi(parsed.ttdSaksi);
        if (parsed.parafSaksi) setParafSaksi(parsed.parafSaksi);
        if (parsed.listDokumen) setListDokumen(parsed.listDokumen);
        if (parsed.listSaran) setListSaran(parsed.listSaran);
        if (parsed.komponenPenilaian) setKomponenPenilaian(parsed.komponenPenilaian);
      } else {
        // Fetch existing BAP from Supabase
        const { data } = await supabase.from('bap_pengawasans').select('data_matriks_c').eq('pengawasan_id', agendaData.id).maybeSingle();
        if (data && data.data_matriks_c) {
          alert("Data BAP Tersimpan: Data BAP dari database berhasil ditarik.\n\nFoto Dokumentasi tidak ditampilkan di sini, tapi otomatis dipertahankan (kecuali Anda menggantinya).");
          let parsed = data.data_matriks_c;
          if (typeof parsed === 'string') {
             try { parsed = JSON.parse(parsed); } catch(e) { parsed = {}; }
          }
          setExistingBapData(parsed);
          
          if (parsed.formData) setFormData(parsed.formData);
          if (parsed.checklist) setChecklist(parsed.checklist);
          if (parsed.dokumenPerizinan) setListDokumen(parsed.dokumenPerizinan);
          if (parsed.saran) setListSaran(parsed.saran);
          if (parsed.rincian_skoring) setKomponenPenilaian(parsed.rincian_skoring);
          if (parsed.perwakilan) {
             const cleanPerwakilan = parsed.perwakilan.map((p: any) => ({ 
                id: p.id || Date.now() + Math.random(), 
                nama: p.nama, jabatan: p.jabatan, telepon: p.telepon 
             }));
             setListPerwakilan(cleanPerwakilan);
          }
          if (parsed.file_dokumentasi) {
             const loadedPhotos = parsed.file_dokumentasi.map((doc: any) => ({
                uri: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dokumentasi/${doc.path}`,
                path: doc.path,
                keterangan: doc.keterangan || ''
             }));
             setPhotos(loadedPhotos);
          }
        }
      }
    } catch (e) {}
  };

  const updateFormData = (key: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const updateChecklist = (babIndex: number, itemIndex: number, field: 'kondisi' | 'keterangan', value: string) => {
    const newChecklist = [...checklist];
    newChecklist[babIndex].items[itemIndex][field] = value;
    setChecklist(newChecklist);
  };

  const getLocation = async () => {
    
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser ini.');
      return;
    }
    
    alert('Mengambil Lokasi... Harap izinkan akses lokasi di browser.');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateFormData('koordinat', `${position.coords.latitude}, ${position.coords.longitude}`);
      },
      (error) => {
        alert('Gagal mengambil lokasi. Pastikan GPS aktif dan izin diberikan.');
      }
    );

  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    updateFormData('waktu_pengawasan', `${hours}.${minutes}`);
  };

  const takePhoto = async () => {
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as any).files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          // Extract base64 part only if needed, but for preview we can just use the data URL
          const base64Str = base64Data.split(',')[1];
          setPhotos((prev: any) => [...prev, { uri: base64Data, base64: base64Str, keterangan: '' }]);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();

  };

  const removePhoto = (index: number) => {
    setPhotos((prev: any) => prev.filter((_: any, i: any) => i !== index));
  };

  const updatePhotoKeterangan = (index: number, text: string) => {
    const newPhotos = [...photos];
    newPhotos[index].keterangan = text;
    setPhotos(newPhotos);
  };



  const handleSignature = (signatureBase64: string) => {
    if (modalSig.type === 'perwakilan_ttd' && modalSig.index !== undefined) {
      const l = [...listPerwakilan]; l[modalSig.index].ttd = signatureBase64; setListPerwakilan(l);
    } else if (modalSig.type === 'perwakilan_paraf' && modalSig.index !== undefined) {
      const l = [...listPerwakilan]; l[modalSig.index].paraf = signatureBase64; setListPerwakilan(l);
    } else if (modalSig.type === 'paraf_perusahaan') {
      setParafPerusahaan(signatureBase64);
    } else if (modalSig.type === 'tim_ttd' && modalSig.index !== undefined) {
      const l = [...ttdTim]; l[modalSig.index] = signatureBase64; setTtdTim(l);
    } else if (modalSig.type === 'tim_paraf' && modalSig.index !== undefined) {
      const l = [...parafTim]; l[modalSig.index] = signatureBase64; setParafTim(l);
    } else if (modalSig.type === 'saksi_ttd' && modalSig.index !== undefined) {
      const l = [...ttdSaksi]; l[modalSig.index] = signatureBase64; setTtdSaksi(l);
    } else if (modalSig.type === 'saksi_paraf' && modalSig.index !== undefined) {
      const l = [...parafSaksi]; l[modalSig.index] = signatureBase64; setParafSaksi(l);
    }
    setModalSig({ visible: false, type: '' });
  };

  const closeSignatureModal = () => {
    setModalSig({ visible: false, type: '' });
  };

  const totalSkor = () => {
    const validScores = komponenPenilaian.filter(k => k.nilai !== '' && !isNaN(Number(k.nilai)));
    if (validScores.length === 0) return 0;
    const sum = validScores.reduce((acc, curr) => acc + Number(curr.nilai), 0);
    return Math.round(sum / validScores.length);
  };

  const finalStatus = () => {
    const skor = totalSkor();
    if (skor === 0 || isNaN(skor)) return 'Belum Ada Nilai';
    if (skor > 100) return 'CEK INPUT';
    if (skor >= 70) return 'Taat';
    if (skor >= 50) return 'Kurang Taat';
    return 'Tidak Taat';
  };

  const submitBAP = async () => {
    // Basic validation
    if (listPerwakilan.some(p => !p.nama || !p.jabatan)) {
      alert("Gagal: Nama dan jabatan perwakilan pemrakarsa harus diisi!");
      return;
    }

    setIsSaving(true);
    
    try {
      const finalPhotos = [];
      // 1. Upload Photos
      for (const photo of photos) {
        if (photo.path) {
           finalPhotos.push({
             path: photo.path,
             keterangan: photo.keterangan
           });
           continue;
        }

        if (!photo.base64) continue;
        const filename = `dokumentasi_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const { data, error } = await supabase.storage
          .from('dokumentasi')
          .upload(filename, decode(photo.base64), { contentType: 'image/jpeg' });
        
        if (error) throw error;
        finalPhotos.push({
          path: data.path,
          keterangan: photo.keterangan
        });
      }

      // 2. Build Web-compatible Payload
      const bapPayload = {
        formData: formData,
        dokumenPerizinan: listDokumen,
        checklist: checklist,
        saran: listSaran,
        rincian_skoring: komponenPenilaian,
        perwakilan: listPerwakilan.map(p => {
           const existingRep = existingBapData?.perwakilan?.find((ep: any) => ep.nama === p.nama);
           return {
              nama: p.nama,
              jabatan: p.jabatan,
              telepon: p.telepon,
              ttd: existingRep?.ttd || null,
              paraf: existingRep?.paraf || null
           };
        }),
        paraf_pemrakarsa: existingBapData?.paraf_pemrakarsa || null,
        ttd_tim: existingBapData?.ttd_tim || ttdTim,
        paraf_tim: existingBapData?.paraf_tim || parafTim,
        saksi_tugas: saksiTugas,
        ttd_saksi: existingBapData?.ttd_saksi || ttdSaksi,
        paraf_saksi: existingBapData?.paraf_saksi || parafSaksi,
        file_dokumentasi: finalPhotos
      };

      // 3. Update pengawasan_lapangans
      const computedStatus = finalStatus();
      const statusToSave = ['Taat', 'Kurang Taat', 'Tidak Taat'].includes(computedStatus) 
        ? computedStatus 
        : null;

      const { error: dbError } = await supabase
        .from('pengawasan_lapangans')
        .update({
          status_ketaatan: statusToSave
        })
        .eq('id', agendaData.id);

      if (dbError) throw dbError;

      // 4. Upsert bap_pengawasans
      const dbBapPayload = {
        pengawasan_id: agendaData.id,
        data_matriks_c: bapPayload,
        total_skor: totalSkor(),
        rincian_skoring: komponenPenilaian,
        saran_masukan: JSON.stringify(bapPayload.saran),
        ttd_tim: JSON.stringify(bapPayload.ttd_tim),
        paraf_tim: JSON.stringify(bapPayload.paraf_tim),
        ttd_pemrakarsa: JSON.stringify(bapPayload.perwakilan),
        paraf_pemrakarsa: bapPayload.paraf_pemrakarsa,
      };

      const { data: existingBap, error: checkError } = await supabase
        .from('bap_pengawasans')
        .select('id')
        .eq('pengawasan_id', agendaData.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingBap) {
        const { error: updateBapError } = await supabase.from('bap_pengawasans').update(dbBapPayload).eq('id', existingBap.id);
        if (updateBapError) throw updateBapError;
      } else {
        const { error: insertBapError } = await supabase.from('bap_pengawasans').insert(dbBapPayload);
        if (insertBapError) throw insertBapError;
      }

      // Trigger Web Dashboard API to Generate DOCX and Upload to GDrive
      let gdriveLink = `https://bididlh.vercel.app/pengawasan/link/${agendaData.token}`;
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://bididlh.vercel.app';
        const uploadRes = await fetch(`${apiUrl}/api/pengawasan/bap/${agendaData.id}/upload`, { method: 'POST' });
        const resData = await uploadRes.json();
        
        if (uploadRes.ok && resData.docxFileId) {
          gdriveLink = `https://drive.google.com/file/d/${resData.docxFileId}/view?usp=sharing`;
        } else {
          console.error('GDrive Error:', resData);
        }
      } catch (apiErr: any) {
        console.error('API Call Error:', apiErr);
      }

      // Hapus draft jika berhasil sinkronisasi
      await Promise.resolve(localStorage.removeItem(`@draft_${agendaData.id}`));

      if (gdriveLink) {
        
    const isShare = window.confirm('Sukses! Form BAP tersimpan dan Link GDrive berhasil dibuat.\n\nKlik OK untuk Bagikan ke WA, atau Cancel untuk tutup.');
    if (isShare) {
        const text = `Berikut adalah BAP Pengawasan Lapangan. Silakan unduh/cetak melalui tautan berikut:\n\n${gdriveLink}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
    setScreen('info');

      } else {
        alert('Sukses: Form BAP berhasil disimpan (namun gagal membuat Link GDrive, silakan cek dashboard web).');
        setScreen('info');
      }
    } catch (e: any) {
      console.error(e);
      // Simpan sebagai draft offline
      try {
        const draftPayload = {
          formData, checklist, photos, listPerwakilan, parafPerusahaan,
          ttdTim, parafTim, ttdSaksi, parafSaksi, listDokumen, listSaran, komponenPenilaian
        };
        await Promise.resolve(localStorage.setItem(`@draft_${agendaData.id}`, JSON.stringify(draftPayload)));
        alert('Mode Offline: Koneksi internet bermasalah. Data BAP telah disimpan sebagai Draft di HP Anda. Harap buka kembali agenda ini saat terhubung ke internet dan klik "Simpan & Selesai" untuk sinkronisasi.');
        setScreen('info');
      } catch (draftErr) {
        
    alert('Error Sinkronisasi: Gagal menyimpan draft: ' + e.message);

      }
    } finally {
      setIsSaving(false);
    }
  };

  const saveDraftLocally = async () => {
    try {
      const draftPayload = {
        formData, checklist, photos, listPerwakilan, parafPerusahaan,
        ttdTim, parafTim, ttdSaksi, parafSaksi, listDokumen, listSaran, komponenPenilaian
      };
      await Promise.resolve(localStorage.setItem(`@draft_${agendaData.id}`, JSON.stringify(draftPayload)));
    } catch (e) {}
  };

  const nextStep = () => {
    saveDraftLocally();
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    saveDraftLocally();
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="flex-1 bg-emerald-50">
      <div className="p-6 pt-12 flex-1">
        <div className="flex-row justify-between items-center mb-6">
          <button 
            onClick={() => step === 1 ? setScreen('info') : prevStep()} 
            className="bg-white border-2 border-slate-900 px-4 py-2 rounded-lg shadow-[2px_2px_0_0_#0f172a]"
          >
            <span className="text-slate-900 font-black uppercase text-xs tracking-wider">← {step === 1 ? 'Info' : 'Kembali'}</span>
          </button>
          <span className="font-black text-slate-900">Langkah {step} dari {totalSteps}</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-3 rounded-full mb-6 border-2 border-slate-900 overflow-hidden">
          <div className="bg-emerald-400 h-full w-[${(step/totalSteps)*100}%] border-r-2 border-slate-900" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === 1 && (
            <div className="bg-white p-6 border-4 border-slate-900 rounded-2xl shadow-[6px_6px_0_0_#0f172a] mb-6">
              <span className="text-2xl font-black text-slate-900 mb-6 uppercase">A. Identitas Lokasi</span>
              
              <div className="mb-4">
                <span className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">Waktu Pengawasan (Misal: 09.00)</span>
                <div className="flex-row gap-2">
                  <input
                    className="flex-1 bg-white border-4 border-slate-900 rounded-xl px-4 py-3 text-slate-900 font-bold shadow-[4px_4px_0_0_#0f172a]"
                    placeholder="Isi Waktu..."
                    
                    value={formData.waktu_pengawasan || ''}
                    onChange={(e: any) => { const v = e.target.value; updateFormData('waktu_pengawasan', v) }}
                  />
                  <button 
                    onClick={getCurrentTime}
                    className="bg-emerald-400 justify-center px-4 rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] active:shadow-[0px_0px_0_0_#0f172a] active:translate-y-1 active:translate-x-1"
                  >
                    <span className="text-slate-900 font-black uppercase text-xs tracking-wider">Saat Ini</span>
                  </button>
                </div>
              </div>

              {[
                { label: 'Kode KBLI', key: 'kbli' },
                { label: 'Alamat Lengkap', key: 'alamat' },
                { label: 'Tahun Operasi', key: 'tahun_operasi' },
                { label: 'Status Permodalan (Misal: PMDN/PMA)', key: 'status_permodalan' },
                { label: 'Nama Penanggung Jawab', key: 'pj_nama' },
                { label: 'Jabatan Penanggung Jawab', key: 'pj_jabatan' },
                { label: 'Nama Pendamping Lapangan', key: 'pendamping_nama' },
                { label: 'Jabatan Pendamping Lapangan', key: 'pendamping_jabatan' },
                { label: 'No. Telepon / Fax', key: 'telepon' },
              ].map((field) => (
                <div key={field.key} className="mb-4">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">{field.label}</span>
                  <input
                    className="w-full bg-white border-4 border-slate-900 rounded-xl px-4 py-3 text-slate-900 font-bold shadow-[4px_4px_0_0_#0f172a]"
                    placeholder={`Isi ${field.label}...`}
                    
                    value={formData[field.key] || ''}
                    onChange={(e: any) => { const v = e.target.value; updateFormData(field.key, v) }}
                  />
                </div>
              ))}

              <div className="mb-4">
                <span className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">Koordinat Lokasi (Lat, Long)</span>
                <div className="flex-row gap-2">
                  <input
                    className="flex-1 bg-white border-4 border-slate-900 rounded-xl px-4 py-3 text-slate-900 font-bold shadow-[4px_4px_0_0_#0f172a]"
                    placeholder="Isi Koordinat..."
                    
                    value={formData.koordinat || ''}
                    onChange={(e: any) => { const v = e.target.value; updateFormData('koordinat', v) }}
                  />
                  <button 
                    onClick={getLocation}
                    className="bg-indigo-400 justify-center px-4 rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] active:shadow-[0px_0px_0_0_#0f172a] active:translate-y-1 active:translate-x-1"
                  >
                    <span className="text-slate-900 font-black uppercase text-xs tracking-wider">Ambil</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t-4 border-slate-900 border-dashed">
                <span className="text-lg font-black text-slate-900 mb-4 uppercase">Batas Wilayah</span>
                {[
                  { label: 'Batas Utara', key: 'batas_utara' },
                  { label: 'Batas Selatan', key: 'batas_selatan' },
                  { label: 'Batas Barat', key: 'batas_barat' },
                  { label: 'Batas Timur', key: 'batas_timur' },
                ].map((field) => (
                  <div key={field.key} className="mb-4">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">{field.label}</span>
                    <input className="w-full bg-slate-50 border-4 border-slate-900 rounded-xl px-4 py-3 text-slate-900 font-bold" placeholder={`Isi ${field.label}...`}  value={formData[field.key] || ''} onChange={(e: any) => { const v = e.target.value; updateFormData(field.key, v) }} />
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t-4 border-slate-900 border-dashed">
                <span className="text-lg font-black text-slate-900 mb-4 uppercase">Luas Lahan & Bangunan (m2)</span>
                {[
                  { label: 'Luas Total Lahan', key: 'luas_total' },
                  { label: 'Luas Bangunan / Terbangun', key: 'luas_bangunan' },
                  { label: 'Luas Terbuka Hijau', key: 'luas_terbuka' },
                ].map((field) => (
                  <div key={field.key} className="mb-4">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">{field.label}</span>
                    <input className="w-full bg-slate-50 border-4 border-slate-900 rounded-xl px-4 py-3 text-slate-900 font-bold" placeholder={`Isi ${field.label}...`}  value={formData[field.key] || ''} onChange={(e: any) => { const v = e.target.value; updateFormData(field.key, v) }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white p-6 border-4 border-slate-900 rounded-2xl shadow-[6px_6px_0_0_#0f172a] mb-6">
              <span className="text-2xl font-black text-slate-900 mb-6 uppercase">B. Operasional & Utilitas</span>
              
              {isIndustri ? (
                <>
                  {[
                    { label: 'Kapasitas Produksi', key: 'kapasitas_produksi' },
                    { label: 'Jenis Produk', key: 'jenis_produk' },
                    { label: 'Bahan Baku Utama', key: 'bahan_baku_utama' },
                    { label: 'Bahan Penolong', key: 'bahan_penolong' },
                    { label: 'Proses Produksi Singkat', key: 'proses_produksi' },
                    { label: 'Jam Produksi', key: 'jam_produksi' },
                    { label: 'Hari Kerja', key: 'hari_kerja' },
                    { label: 'Jumlah Karyawan', key: 'jumlah_karyawan' },
                    { label: 'Energi / Listrik / Genset', key: 'energi' },
                    { label: 'Sumber Air Bersih', key: 'sumber_air_bersih' },
                    { label: 'Penggunaan Air Per Hari', key: 'penggunaan_air_per_hari' },
                    { label: 'Persetujuan Teknis / SLO', key: 'persetujuan_teknis' },
                    { label: 'Pengelolaan Sampah Umum', key: 'pengelolaan_sampah_umum' },
                    { label: 'Pengelolaan B3 Umum', key: 'pengelolaan_b3_umum' },
                  ].map((field) => (
                    <div key={field.key} className="mb-4">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">{field.label}</span>
                      <input className="w-full bg-slate-50 border-4 border-slate-900 rounded-xl px-4 py-3 text-slate-900 font-bold" placeholder={`Isi ${field.label}...`}  value={formData[field.key] || ''} onChange={(e: any) => { const v = e.target.value; updateFormData(field.key, v) }} />
                    </div>
                  ))}
                </>
              ) : isFasyankes ? (
                <>
                  {[
                    { label: 'Kapasitas Izin (Pasien/Bed)', key: 'kapasitas_izin' },
                    { label: 'Kapasitas Riil (Rata-rata)', key: 'kapasitas_riil' },
                    { label: 'Jumlah Karyawan', key: 'jumlah_karyawan' },
                    { label: 'Jumlah Pasien Harian', key: 'jumlah_pasien' },
                    { label: 'Shift Kerja', key: 'shift_kerja' },
                    { label: 'Hari Kerja (Misal: Senin-Sabtu)', key: 'hari_kerja_minggu' },
                    { label: 'Teknologi Pengolahan Air Limbah', key: 'teknologi_air_limbah' },
                    { label: 'Volume Air Limbah (m3/hari)', key: 'volume_air_limbah' },
                    { label: 'Penggunaan Air (Liter/hari)', key: 'penggunaan_air_liter' },
                    { label: 'Debit Inlet & Outlet', key: 'debit_inlet' },
                    { label: 'Penggunaan Energi', key: 'penggunaan_energi' },
                    { label: 'Pengelolaan Sampah Umum', key: 'pengelolaan_sampah_umum' },
                    { label: 'Pengelolaan B3 Umum', key: 'pengelolaan_b3_umum' },
                  ].map((field) => (
                    <div key={field.key} className="mb-4">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">{field.label}</span>
                      <input className="w-full bg-slate-50 border-4 border-slate-900 rounded-xl px-4 py-3 text-slate-900 font-bold" placeholder={`Isi ${field.label}...`}  value={formData[field.key] || ''} onChange={(e: any) => { const v = e.target.value; updateFormData(field.key, v) }} />
                    </div>
                  ))}
                </>
              ) : (isPerumahan || isTokoModern || isSPPG) ? (
                <>
                  {[
                    { label: 'Jumlah Pekerja/Karyawan', key: 'jumlah_pekerja' },
                    { label: 'Jumlah Penghuni / Pengunjung', key: 'jumlah_penghuni' },
                    { label: 'Kapasitas / Tangki Timbun', key: 'kapasitas_kegiatan' },
                    { label: 'Jam Operasional / Shift', key: 'jam_kerja_hari' },
                    ...(isPerumahan ? [
                      { label: 'Shift Kerja Konstruksi', key: 'shift_kerja_konstruksi' },
                      { label: 'Hari Kerja (Misal: Senin-Sabtu)', key: 'hari_kerja_minggu' },
                      { label: 'Teknologi Pengelolaan Air Limbah', key: 'teknologi_air_limbah' },
                      { label: 'Volume Air Limbah (m3/hari)', key: 'volume_air_limbah' },
                      { label: 'Pemanfaatan Air Tanah', key: 'pemanfaatan_air_tanah' },
                      { label: 'Penggunaan Air (Liter/hari)', key: 'penggunaan_air_liter' },
                    ] : []),
                    { label: 'Pengelolaan Sampah Umum', key: 'pengelolaan_sampah_umum' },
                    { label: 'Pengelolaan B3 Umum', key: 'pengelolaan_b3_umum' },
                    { label: 'Sumber Air & Energi', key: 'sumber_air_bersih' },
                  ].map((field) => (
                    <div key={field.key} className="mb-4">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">{field.label}</span>
                      <input className="w-full bg-slate-50 border-4 border-slate-900 rounded-xl px-4 py-3 text-slate-900 font-bold" placeholder={`Isi ${field.label}...`}  value={formData[field.key] || ''} onChange={(e: any) => { const v = e.target.value; updateFormData(field.key, v) }} />
                    </div>
                  ))}
                </>
              ) : (
                <span className="font-bold text-slate-500">Kategori lain belum terdefinisi detil operasinya. Silakan lewati jika tidak relevan.</span>
              )}

              <div className="mt-4 pt-4 border-t-4 border-slate-900 border-dashed">
                <span className="text-lg font-black text-slate-900 mb-4 uppercase">Dokumen & Persetujuan Lingkungan</span>
                {[
                  { label: 'Dokumen yang Dimiliki (Misal: UKL-UPL)', key: 'dokumen_dimiliki' },
                  { label: 'Nomor Persetujuan Lingkungan', key: 'persetujuan_lingkungan' },
                  { label: 'Riwayat Ketaatan', key: 'riwayat_ketaatan' },
                  { label: 'Tanggal Inspeksi Terakhir', key: 'inspeksi_terakhir' },
                ].map((field) => (
                  <div key={field.key} className="mb-4">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">{field.label}</span>
                    <input className="w-full bg-slate-50 border-4 border-slate-900 rounded-xl px-4 py-3 text-slate-900 font-bold" placeholder={`Isi ${field.label}...`}  value={formData[field.key] || ''} onChange={(e: any) => { const v = e.target.value; updateFormData(field.key, v) }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white p-6 border-4 border-slate-900 rounded-2xl shadow-[6px_6px_0_0_#0f172a] mb-6">
              <span className="text-2xl font-black text-slate-900 mb-6 uppercase">Hasil Pengawasan</span>
              
              <div className="mb-8">
                <div className="bg-rose-200 border-2 border-slate-900 px-3 py-2 mb-4 rounded-xl shadow-[2px_2px_0_0_#0f172a]">
                  <span className="font-black text-slate-900 uppercase text-sm">1. Dokumen Perizinan</span>
                </div>
                {listDokumen.map((dok, i) => (
                  <div key={dok.id} className="flex-row gap-2 mb-3 items-center">
                    <span className="font-black text-slate-400">{i + 1}.</span>
                    <input
                      className="flex-1 bg-slate-50 border-2 border-slate-900 rounded-lg px-3 py-2 text-slate-900 font-bold"
                      placeholder="Nama Dokumen/Izin..."
                      
                      value={dok.value}
                      onChange={(e: any) => { const v = e.target.value; 
                        const l = [...listDokumen]; l[i].value = v; setListDokumen(l);
                      }}
                    />
                    {listDokumen.length > 1 && (
                      <button onClick={() => setListDokumen(listDokumen.filter(x => x.id !== dok.id))} className="p-2 bg-rose-500 rounded-lg border-2 border-slate-900">
                        <span className="text-white font-black">X</span>
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => setListDokumen([...listDokumen, { id: Date.now(), value: '' }])} className="py-3 border-2 border-dashed border-slate-900 rounded-lg items-center">
                  <span className="font-black text-slate-600 text-xs uppercase tracking-widest">+ Tambah Izin</span>
                </button>
              </div>

              {checklist.length === 0 && <span className="font-bold text-slate-500">Kategori kegiatan tidak memiliki checklist khusus.</span>}
              
              {checklist.map((bab, bIndex) => (
                <div key={bIndex} className="mb-8">
                  <div className="bg-rose-200 border-2 border-slate-900 px-3 py-2 mb-4 rounded-xl shadow-[2px_2px_0_0_#0f172a]">
                    <span className="font-black text-slate-900 uppercase text-sm">{bab.bab}</span>
                  </div>
                  
                  {bab.items.map((item: any, iIndex: number) => (
                    <div key={iIndex} className="mb-6 pl-2 border-l-4 border-slate-300">
                      <span className="font-bold text-slate-800 mb-2">{item.no}. {item.point}</span>
                      
                      <input
                        className="w-full bg-slate-50 border-2 border-slate-900 rounded-lg px-3 py-2 text-slate-900 font-bold text-sm mb-2"
                        placeholder="Kondisi Eksisting (Hasil Pengamatan)..."
                        
                        value={item.kondisi}
                        onChange={(e: any) => { const v = e.target.value; updateChecklist(bIndex, iIndex, 'kondisi', v) }}
                       
                      />
                      
                      <input
                        className="w-full bg-slate-50 border-2 border-slate-900 rounded-lg px-3 py-2 text-slate-900 font-bold text-sm"
                        placeholder="Keterangan / Temuan..."
                        
                        value={item.keterangan}
                        onChange={(e: any) => { const v = e.target.value; updateChecklist(bIndex, iIndex, 'keterangan', v) }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="bg-white p-6 border-4 border-slate-900 rounded-2xl shadow-[6px_6px_0_0_#0f172a] mb-6">
              <span className="text-2xl font-black text-slate-900 mb-6 uppercase">Dokumentasi Lapangan</span>
              
              {photos.map((photo, idx) => (
                <div key={idx} className="mb-6 border-2 border-slate-300 rounded-xl p-4 bg-slate-50 relative">
                  <button 
                    onClick={() => removePhoto(idx)}
                    className="absolute -top-3 -right-3 bg-rose-500 w-8 h-8 rounded-full border-2 border-slate-900 items-center justify-center z-10 shadow-[2px_2px_0_0_#0f172a]"
                  >
                    <span className="text-white font-black">X</span>
                  </button>
                  <img src={photo.uri} className="w-full h-48 rounded-lg border-2 border-slate-900 mb-4" />
                  <input
                    className="w-full bg-white border-2 border-slate-900 rounded-lg px-3 py-2 text-slate-900 font-bold"
                    placeholder="Keterangan foto..."
                    value={photo.keterangan}
                    onChange={(e: any) => { const v = e.target.value; updatePhotoKeterangan(idx, v) }}
                  />
                </div>
              ))}

              <button 
                onClick={takePhoto}
                className="bg-emerald-400 px-6 py-4 border-4 border-slate-900 rounded-xl shadow-[4px_4px_0_0_#0f172a] items-center active:shadow-[0px_0px_0_0_#0f172a] active:translate-y-1 active:translate-x-1 mb-8"
              >
                <span className="font-black text-slate-900 uppercase">+ Buka Kamera</span>
              </button>

              <div className="mb-8">
                <span className="text-lg font-black text-slate-900 mb-4 uppercase">Saran / Masukan</span>
                {listSaran.map((saran, i) => (
                  <div key={saran.id} className="flex-row gap-2 mb-3 items-center">
                    <span className="font-black text-slate-400">{i + 1}.</span>
                    <input
                      className="flex-1 bg-slate-50 border-2 border-slate-900 rounded-lg px-3 py-2 text-slate-900 font-bold"
                      placeholder="Ketik saran perbaikan kesling..."
                      
                      value={saran.value}
                      onChange={(e: any) => { const v = e.target.value; 
                        const l = [...listSaran]; l[i].value = v; setListSaran(l);
                      }}
                    />
                    {listSaran.length > 1 && (
                      <button onClick={() => setListSaran(listSaran.filter(x => x.id !== saran.id))} className="p-2 bg-rose-500 rounded-lg border-2 border-slate-900">
                        <span className="text-white font-black">X</span>
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => setListSaran([...listSaran, { id: Date.now(), value: '' }])} className="py-3 border-2 border-dashed border-slate-900 rounded-lg items-center">
                  <span className="font-black text-slate-600 text-xs uppercase tracking-widest">+ Tambah Saran</span>
                </button>
              </div>

              <div className="mb-4">
                <span className="text-lg font-black text-slate-900 mb-4 uppercase">Penilaian & Kesimpulan</span>
                {komponenPenilaian.map((komp, idx) => (
                  <div key={komp.id} className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 mb-3 shadow-[2px_2px_0_0_#0f172a]">
                    <div className="flex-row justify-between items-center mb-2">
                      <span className="bg-slate-900 text-white font-black px-2 py-1 rounded-md text-xs">C.{idx + 1}</span>
                    </div>
                    <span className="text-slate-900 font-black mb-3 uppercase">{komp.nama}</span>
                    <div className="flex-row items-center gap-2">
                      <span className="text-xs font-black text-slate-500 uppercase">Skor (0-100):</span>
                      <input
                        className="flex-1 bg-white border-2 border-slate-900 rounded-lg px-3 py-2 text-rose-600 font-black text-center text-lg"
                        placeholder="0"
                        
                        value={komp.nilai}
                        onChange={(e: any) => { const v = e.target.value; 
                          const k = [...komponenPenilaian]; k[idx].nilai = v; setKomponenPenilaian(k);
                        }}
                      />
                    </div>
                  </div>
                ))}

                <div className="bg-slate-900 p-4 rounded-xl border-2 border-slate-900">
                  <div className="flex-row justify-between items-center mb-4 border-b-2 border-slate-700 pb-4">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Nilai Rata-Rata</span>
                    <div className="flex-row items-end gap-1">
                      <span className="text-3xl font-black ${totalSkor() > 100 ? 'text-rose-500' : 'text-teal-400'}">{totalSkor()}</span>
                      <span className="text-sm font-bold text-slate-500 mb-1">/ 100</span>
                    </div>
                  </div>
                  <div className="items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Status Ketaatan</span>
                    <div className="px-6 py-2 rounded-lg border-2 border-slate-900 ${finalStatus() === 'Taat' ? 'bg-emerald-400' : finalStatus() === 'Kurang Taat' ? 'bg-amber-400' : finalStatus() === 'Tidak Taat' ? 'bg-rose-500' : 'bg-slate-200'}">
                      <span className="font-black uppercase tracking-widest ${finalStatus() === 'Tidak Taat' ? 'text-white' : 'text-slate-900'}">{finalStatus()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="bg-white p-6 border-4 border-slate-900 rounded-2xl shadow-[6px_6px_0_0_#0f172a] mb-6">
              <span className="text-2xl font-black text-slate-900 mb-6 uppercase">Data Penandatangan</span>
              
              <div className="mb-8">
                <span className="text-lg font-black text-slate-900 mb-4 uppercase">Pihak Fasyankes / Pemrakarsa</span>
                {listPerwakilan.map((perw, idx) => (
                  <div key={perw.id} className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 mb-4 shadow-[2px_2px_0_0_#0f172a]">
                    <div className="flex-row justify-between mb-2">
                      <span className="font-black text-slate-400">Perwakilan {idx + 1}</span>
                      {listPerwakilan.length > 1 && (
                        <button onClick={() => setListPerwakilan(listPerwakilan.filter(x => x.id !== perw.id))}>
                          <span className="text-rose-500 font-black text-xs uppercase">Hapus</span>
                        </button>
                      )}
                    </div>
                    <input className="w-full bg-white border-2 border-slate-900 rounded-lg px-3 py-2 text-slate-900 font-bold mb-2" placeholder="Nama Lengkap" value={perw.nama} onChange={(e: any) => { const v = e.target.value;  const l = [...listPerwakilan]; l[idx].nama = v; setListPerwakilan(l);  }} />
                    <input className="w-full bg-white border-2 border-slate-900 rounded-lg px-3 py-2 text-slate-900 font-bold mb-2" placeholder="Jabatan" value={perw.jabatan} onChange={(e: any) => { const v = e.target.value;  const l = [...listPerwakilan]; l[idx].jabatan = v; setListPerwakilan(l);  }} />
                    <input className="w-full bg-white border-2 border-slate-900 rounded-lg px-3 py-2 text-slate-900 font-bold" placeholder="No. HP"  value={perw.telepon} onChange={(e: any) => { const v = e.target.value;  const l = [...listPerwakilan]; l[idx].telepon = v; setListPerwakilan(l);  }} />
                  </div>
                ))}
                <button onClick={() => setListPerwakilan([...listPerwakilan, { id: Date.now(), nama: '', jabatan: '', telepon: '', ttd: null, paraf: null }])} className="py-3 border-2 border-dashed border-slate-900 rounded-lg items-center mb-6">
                  <span className="font-black text-slate-600 text-xs uppercase tracking-widest">+ Tambah Perwakilan</span>
                </button>
              </div>

              <div className="mb-4">
                <span className="text-lg font-black text-slate-900 mb-4 uppercase">Tim Pengawas</span>
                {timTugas.map((nama, idx) => (
                  <div key={idx} className="bg-indigo-50 border-2 border-slate-900 rounded-xl p-4 mb-3 shadow-[2px_2px_0_0_#0f172a]">
                    <span className="font-black text-slate-900">{idx + 1}. {nama}</span>
                  </div>
                ))}
              </div>

              {saksiTugas.length > 0 && (
                <div className="mb-4">
                  <span className="text-lg font-black text-slate-900 mb-4 uppercase">Saksi</span>
                  {saksiTugas.map((nama, idx) => (
                    <div key={idx} className="bg-rose-50 border-2 border-slate-900 rounded-xl p-4 mb-3 shadow-[2px_2px_0_0_#0f172a]">
                      <span className="font-black text-slate-900">{idx + 1}. {nama}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button 
            className="w-full ${step === totalSteps ? 'bg-indigo-500' : 'bg-emerald-400'} border-4 border-slate-900 rounded-xl py-4 items-center shadow-[4px_4px_0_0_#0f172a] active:shadow-[0px_0px_0_0_#0f172a] active:translate-y-1 active:translate-x-1 mt-4"
            onClick={step === totalSteps ? submitBAP : nextStep}
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
            ) : (
              <span className="text-slate-900 font-black text-lg uppercase tracking-wider">{step === totalSteps ? 'Simpan & Selesai' : 'Selanjutnya'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
