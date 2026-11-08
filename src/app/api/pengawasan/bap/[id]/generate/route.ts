import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTemplate } from '@/app/pengawasan/ba/isi/[id]/templates';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// @ts-ignore
import ImageModule from 'docxtemplater-image-module-free';
import { combineParafImages } from '@/lib/image-stitcher';

// Helper to translate number to words
function terbilang(angka: number): string {
  const words = [
    '', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'
  ];
  if (angka < 12) return words[angka];
  if (angka < 20) return words[angka - 10] + ' belas';
  if (angka < 100) return words[Math.floor(angka / 10)] + ' puluh ' + words[angka % 10];
  if (angka < 200) return 'seratus ' + terbilang(angka - 100);
  if (angka < 1000) return words[Math.floor(angka / 100)] + ' ratus ' + terbilang(angka % 100);
  if (angka < 2000) return 'seribu ' + terbilang(angka - 1000);
  if (angka < 10000) return words[Math.floor(angka / 1000)] + ' ribu ' + terbilang(angka % 1000);
  return angka.toString(); // Fallback for larger numbers not typically needed for dates
}

function getHari(date: Date): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[date.getDay()];
}

function getBulan(date: Date): string {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return months[date.getMonth()];
}

async function buildBapDocx(id: string, payloadOverride?: any) {
  const supabase = await createClient();

  // 1. Fetch Agenda Data
  const { data: agendaRaw, error: agendaError } = await supabase
    .from('pengawasan_lapangans')
    .select('*, bap_pengawasans(*)')
    .eq('id', id)
    .single();

  if (agendaError || !agendaRaw) {
    throw new Error('Agenda tidak ditemukan');
  }

  const agenda = agendaRaw as any;
  const bapRow = agenda.bap_pengawasans && agenda.bap_pengawasans.length > 0 ? agenda.bap_pengawasans[0] : null;

  // 2. Fetch BAP Data (gunakan payloadOverride jika ada, atau data tersimpan di DB)
  let bapData: any = payloadOverride?.bap || bapRow?.data_matriks_c;
  if (!bapData) {
    throw new Error('Data BAP belum diisi. Harap isi form BAP Lapangan terlebih dahulu.');
  }
  
  if (typeof bapData === 'string') {
    try { bapData = JSON.parse(bapData); } catch (e) {}
  }

  const identitas = bapData.formData || bapData.identitas || {};
  const checklist = bapData.checklist || [];
  const dokumentasi = bapData.file_dokumentasi || bapData.dokumentasi || [];
  const dokumenIzin = bapData.dokumenPerizinan || bapData.dokumen_izin || [];

  // Parse Tim Tugas
  let timPengawasArr: string[] = [];
  if (agenda.tim_tugas) {
    try { timPengawasArr = JSON.parse(agenda.tim_tugas); } 
    catch { timPengawasArr = agenda.tim_tugas.split('|').map((t: string) => t.trim()).filter((t: string) => t !== ''); }
  }

  // Parse Saksi (Mendukung saksi_names dari payload web/mobile atau agenda.saksi)
  let saksiArr: string[] = [];
  if (Array.isArray(bapData.saksi_names) && bapData.saksi_names.length > 0) {
    saksiArr = bapData.saksi_names;
  } else if (agenda.saksi) {
    try { saksiArr = JSON.parse(agenda.saksi); } 
    catch { saksiArr = agenda.saksi.split('|').map((t: string) => t.trim()).filter((t: string) => t !== ''); }
  }

  // Pastikan saksiArr mencakup seluruh data saksi jika bapData memiliki saksi lebih banyak
  const maxSaksiLen = Math.max(
    saksiArr.length,
    Array.isArray(bapData.saksi_details) ? bapData.saksi_details.length : 0,
    Array.isArray(bapData.paraf_saksi) ? bapData.paraf_saksi.length : 0,
    Array.isArray(bapData.ttd_saksi) ? bapData.ttd_saksi.length : 0
  );
  while (saksiArr.length < maxSaksiLen) {
    saksiArr.push(`Saksi ${saksiArr.length + 1}`);
  }

  // Date calculations
  const today = new Date();
  const hari_ini_nama = getHari(today);
  const hari_ini_tanggal_terbilang = terbilang(today.getDate()).trim();
  const hari_ini_bulan = getBulan(today);
  const hari_ini_tahun_terbilang = terbilang(Math.floor(today.getFullYear() / 1000) * 1000) + ' ' + terbilang(today.getFullYear() % 1000); 
  const hari_ini_tahun = today.getFullYear().toString();

  // Convert Checklist Array into Key-Value Object based on point or key
  const checklistFlat: Record<string, string> = {};
  const templateDef = getTemplate(agenda.kategori);
  checklist.forEach((bab: any) => {
    if (bab && bab.items) {
      bab.items.forEach((item: any) => {
        if (item.point) {
          // Find key from template definition if missing
          let key = item.key;
          if (!key) {
            for (const tBab of templateDef) {
              const found = tBab.items.find(i => i.point === item.point);
              if (found) {
                key = found.key;
                break;
              }
            }
          }
          key = key || item.point; // fallback
          
          checklistFlat[key] = item.kondisi || '';
          checklistFlat[`ket_${key}`] = item.keterangan || '';
        }
      });
    }
  });

  // Fetch Tim Pengawas Details from the DB
  const { data: listPengawas } = await supabase.from('tim_pengawas').select('*');
  const pengawasMap = new Map();
  if (listPengawas) {
    listPengawas.forEach((p: any) => pengawasMap.set(p.nama, p));
  }

  // Formatting Tim Pengawas (used by toko/sppg/industri/fasyankes templates)
  const tim_pengawas = timPengawasArr.map((nama: string, idx: number) => {
    const p = pengawasMap.get(nama) || {};
    return {
      no: idx + 1,
      nama_pengawas: nama,
      nip_pengawas: p.nip || '-',
      pangkat_pengawas: p.pangkat_golongan || '-',
      jabatan_pengawas: p.jabatan_dinas || p.jabatan || 'Pengawas Lingkungan Hidup',
      instansi_pengawas: 'Dinas Lingkungan Hidup Kabupaten Sragen',
      ttd_pengawas: bapData.ttd_tim && bapData.ttd_tim[idx] ? bapData.ttd_tim[idx] : '',
      paraf_pengawas: bapData.paraf_tim && bapData.paraf_tim[idx] ? bapData.paraf_tim[idx] : ''
    };
  });
  if (tim_pengawas.length === 0) {
    tim_pengawas.push({
      no: 1,
      nama_pengawas: '',
      nip_pengawas: '',
      pangkat_pengawas: '',
      jabatan_pengawas: '',
      instansi_pengawas: 'Dinas Lingkungan Hidup Kabupaten Sragen',
      ttd_pengawas: '',
      paraf_pengawas: ''
    });
  }

  // Formatting Tim Penilai Lengkap (used by perumahan template - same data, different field names)
  const tim_penilai_lengkap = timPengawasArr.map((nama: string, idx: number) => {
    const p = pengawasMap.get(nama) || {};
    return {
      nomor_urut: idx + 1,
      nama: nama,
      nip: p.nip || '-',
      pangkat_golongan: p.pangkat_golongan || '-',
      jabatan: p.jabatan_dinas || 'Pengawas Lingkungan Hidup',
      ttd_pengawas: bapData.ttd_tim && bapData.ttd_tim[idx] ? bapData.ttd_tim[idx] : '',
      paraf_pengawas: bapData.paraf_tim && bapData.paraf_tim[idx] ? bapData.paraf_tim[idx] : ''
    };
  });
  if (tim_penilai_lengkap.length === 0) {
    tim_penilai_lengkap.push({
      nomor_urut: 1,
      nama: '',
      nip: '',
      pangkat_golongan: '',
      jabatan: '',
      ttd_pengawas: '',
      paraf_pengawas: ''
    });
  }

  // Formatting Saksi
  const saksi = saksiArr.map((nama: string, idx: number) => ({
    no: idx + 1,
    nama_saksi: nama,
    jabatan_saksi: bapData.saksi_details && bapData.saksi_details[idx]?.jabatan ? bapData.saksi_details[idx].jabatan : '-',
    telepon_saksi: bapData.saksi_details && bapData.saksi_details[idx]?.telepon ? bapData.saksi_details[idx].telepon : '-',
    ttd_saksi: bapData.ttd_saksi && bapData.ttd_saksi[idx] ? bapData.ttd_saksi[idx] : '',
    paraf_saksi: bapData.paraf_saksi && bapData.paraf_saksi[idx] ? bapData.paraf_saksi[idx] : ''
  }));
  if (saksi.length === 0) {
    saksi.push({
      no: 1,
      nama_saksi: '',
      jabatan_saksi: '',
      telepon_saksi: '',
      ttd_saksi: '',
      paraf_saksi: ''
    });
  }

  // Formatting Dokumen Izin (Templates use {#dokumen_izin}{.}{/dokumen_izin})
  const dokumen_izin = (dokumenIzin || []).map((val: any) => {
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object' && val.value) return val.value;
    if (val && typeof val === 'object' && val.nama) return val.nama;
    return String(val);
  }).filter((val: string) => val.trim() !== '');

  // Formatting Foto (2 per row for table)
  const resolveImage = async (docObj: any) => {
     if (!docObj) return '';
     if (docObj.file) return docObj.file;
     if (docObj.path) {
        const url = `https://zorjwjatbfxzmalpemqa.supabase.co/storage/v1/object/public/dokumentasi/${docObj.path}`;
        try {
           const res = await fetch(url);
           const arrayBuffer = await res.arrayBuffer();
           return `data:image/jpeg;base64,${Buffer.from(arrayBuffer).toString('base64')}`;
        } catch (e) {
           return '';
        }
     }
     return '';
  };

  const foto_baris = [];
  for (let i = 0; i < dokumentasi.length; i += 2) {
    foto_baris.push({
      foto_1: await resolveImage(dokumentasi[i]),
      ket_1: dokumentasi[i]?.keterangan || '',
      foto_2: await resolveImage(dokumentasi[i + 1]),
      ket_2: dokumentasi[i + 1]?.keterangan || ''
    });
  }
  if (foto_baris.length === 0) {
    foto_baris.push({
      foto_1: '__EMPTY_PHOTO__',
      ket_1: '',
      foto_2: '__EMPTY_PHOTO__',
      ket_2: ''
    });
  }

  // Formatting Saran
  const saran = (bapData.saran || []).map((val: string, idx: number) => ({
    no: idx + 1,
    abjad: String.fromCharCode(97 + idx), // a, b, c, ...
    saran_text: val
  }));

  // Formatting Perwakilan / Pendamping Lapangan
  const perwakilan = (bapData.perwakilan || []).map((val: any, idx: number) => ({
    no: idx + 1,
    nama_perwakilan: val.nama || '',
    jabatan_perwakilan: val.jabatan || '',
    telepon_perwakilan: val.telepon || '',
    ttd_perwakilan: val.ttd || '',
    paraf_perwakilan: val.paraf || ''
  }));

  // Extract perwakilan for root-level tags and signature mapping
  const firstPerw = perwakilan.length > 0 ? perwakilan[0] : null;
  const secondPerw = perwakilan.length > 1 ? perwakilan[1] : null;

  let nama_perwakilan = '';
  let jabatan_perwakilan = '';
  let telepon_perwakilan = '';
  let ttd_pemrakarsa_final = bapData.ttd_pemrakarsa || '';
  let paraf_pemrakarsa_final = bapData.paraf_pemrakarsa || '';
  let ttd_perwakilan_final = '';
  let paraf_perwakilan_final = '';

  if (perwakilan.length >= 2) {
    // 2 atau lebih perwakilan: perwakilan 1 ke pemrakarsa, perwakilan 2 ke perwakilan
    nama_perwakilan = secondPerw?.nama_perwakilan || '';
    jabatan_perwakilan = secondPerw?.jabatan_perwakilan || '';
    telepon_perwakilan = secondPerw?.telepon_perwakilan || '';
    ttd_pemrakarsa_final = ttd_pemrakarsa_final || firstPerw?.ttd_perwakilan || '';
    paraf_pemrakarsa_final = paraf_pemrakarsa_final || firstPerw?.paraf_perwakilan || '';
    ttd_perwakilan_final = secondPerw?.ttd_perwakilan || '';
    paraf_perwakilan_final = secondPerw?.paraf_perwakilan || '';
  } else if (perwakilan.length === 1 && firstPerw) {
    // 1 perwakilan: isi data pendamping dan pasang tanda tangan agar muncul di kedua slot
    nama_perwakilan = firstPerw.nama_perwakilan || identitas.pendamping_nama || '';
    jabatan_perwakilan = firstPerw.jabatan_perwakilan || identitas.pendamping_jabatan || '';
    telepon_perwakilan = firstPerw.telepon_perwakilan || identitas.telepon || '';
    const sig = ttd_pemrakarsa_final || firstPerw.ttd_perwakilan || '';
    ttd_pemrakarsa_final = sig;
    ttd_perwakilan_final = sig;
    const prf = paraf_pemrakarsa_final || firstPerw.paraf_perwakilan || '';
    paraf_pemrakarsa_final = prf;
    paraf_perwakilan_final = prf;
  } else {
    nama_perwakilan = identitas.pendamping_nama || '';
    jabatan_perwakilan = identitas.pendamping_jabatan || '';
    telepon_perwakilan = identitas.telepon || '';
  }

  // Formatting Rincian Skoring
  const skoring = (bapData.rincian_skoring || []).map((val: any, idx: number) => ({
    no: idx + 1,
    nama_komponen: val.nama || '',
    nilai_komponen: val.nilai || ''
  }));

  let formatted_waktu = identitas.waktu_pengawasan || '........';
  if (/^\d{4}$/.test(formatted_waktu)) formatted_waktu = formatted_waktu.substring(0, 2) + '.' + formatted_waktu.substring(2) + ' WIB';
  else if (formatted_waktu.includes(':')) formatted_waktu = formatted_waktu.replace(':', '.') + ' WIB';

  // Construct combined fields for specific templates
  const jumlah_pekerja_penghuni = identitas.jumlah_pekerja_penghuni || (identitas.jumlah_pekerja || identitas.jumlah_penghuni ? `Pekerja: ${identitas.jumlah_pekerja || '-'}, Penghuni: ${identitas.jumlah_penghuni || '-'}` : '');
  const jumlah_pasien_pekerja = `Pasien: ${identitas.jumlah_pasien || '-'}, Pekerja: ${identitas.jumlah_karyawan || identitas.jumlah_pekerja || '-'}`;

    // Gabungkan paraf seluruh tim pengawas dan saksi secara horizontal agar seluruhnya tampil di footer
    let rawParafTim = bapData.paraf_tim;
    if (typeof rawParafTim === 'string') {
      try { rawParafTim = JSON.parse(rawParafTim); } catch (e) {}
    }
    if (!Array.isArray(rawParafTim) || rawParafTim.length === 0) {
      rawParafTim = tim_pengawas.map((t: any) => t.paraf_pengawas).filter(Boolean);
    }

    let rawParafSaksi = bapData.paraf_saksi;
    if (typeof rawParafSaksi === 'string') {
      try { rawParafSaksi = JSON.parse(rawParafSaksi); } catch (e) {}
    }
    if (!Array.isArray(rawParafSaksi) || rawParafSaksi.length === 0) {
      rawParafSaksi = saksi.map((s: any) => s.paraf_saksi).filter(Boolean);
    }

    const allParafPengawasDanSaksi = [
      ...(Array.isArray(rawParafTim) ? rawParafTim : []),
      ...(Array.isArray(rawParafSaksi) ? rawParafSaksi : [])
    ];
    const paraf_pengawas_final = await combineParafImages(allParafPengawasDanSaksi, 45, 10);
    const paraf_saksi_combined = await combineParafImages(rawParafSaksi, 45, 10);

    // Gabungkan paraf pihak pemrakarsa jika ada lebih dari 1 perwakilan
    let rawParafPemrakarsa = perwakilan.map((p: any) => p.paraf_perwakilan).filter(Boolean);
    if (rawParafPemrakarsa.length === 0 && paraf_pemrakarsa_final) {
      rawParafPemrakarsa = [paraf_pemrakarsa_final];
    }
    const paraf_pemrakarsa_combined = await combineParafImages(rawParafPemrakarsa, 45, 10);

    // Integrasi Nota Dinas Arsip & Nomor Berita Acara (BAP)
    let nomorNotaDinas = agenda.nomor_nota_dinas || identitas.nomor_nota_dinas || '';
    let nomorUrutNota = '';

    if (!nomorNotaDinas) {
      // Cari apakah sudah ada di arsip_nota_dinas berdasarkan token agenda atau nama kegiatan
      const { data: matchedNota } = await supabase
        .from('arsip_nota_dinas')
        .select('*')
        .or(`keterangan.ilike.%${agenda.token || agenda.nama_kegiatan}%,nama_nota.ilike.%${agenda.nama_kegiatan}%`)
        .order('id', { ascending: false })
        .limit(1);

      if (matchedNota && matchedNota.length > 0) {
        nomorNotaDinas = matchedNota[0].nomor_otomatis;
        // Simpan balik ke agenda agar persisten
        await supabase
          .from('pengawasan_lapangans')
          .update({ nomor_nota_dinas: nomorNotaDinas, nota_dinas_id: matchedNota[0].id })
          .eq('id', id);
      } else {
        // Jika belum ada arsip nota dinas sama sekali, generate nomor urut otomatis
        const visitDate = agenda.tanggal_kunjungan || today.toISOString().split('T')[0];
        const vYear = new Date(visitDate).getFullYear().toString();
        const vMonth = new Date(visitDate).getMonth() + 1;

        const { data: lastDoc } = await supabase
          .from('arsip_nota_dinas')
          .select('no_urut')
          .gte('tanggal_nota', `${vYear}-01-01`)
          .lte('tanggal_nota', `${vYear}-12-31`)
          .order('no_urut', { ascending: false })
          .limit(1);

        let nextUrut = 1;
        if (lastDoc && lastDoc.length > 0) {
          nextUrut = (lastDoc[0].no_urut || 0) + 1;
        }

        const urutStr = String(nextUrut).padStart(3, '0');
        nomorNotaDinas = `600.4.6/${urutStr}.${vMonth}/17/PW/${vYear}`;

        // Auto-book di arsip_nota_dinas
        const { data: insertedNota } = await supabase
          .from('arsip_nota_dinas')
          .insert([{
            no_urut: nextUrut,
            nama_nota: `Nota Dinas Pengawasan Lingkungan Hidup - ${agenda.nama_kegiatan || 'Pengawasan Lapangan'} (${agenda.nama_pemrakarsa || '-'})`,
            tanggal_nota: visitDate,
            dari_bagian: 'Pengawasan',
            nomor_otomatis: nomorNotaDinas,
            keterangan: `Terintegrasi otomatis dari Pengawasan #${agenda.token || id}: ${agenda.nama_kegiatan}`
          }])
          .select()
          .single();

        if (insertedNota) {
          await supabase
            .from('pengawasan_lapangans')
            .update({ nomor_nota_dinas: nomorNotaDinas, nota_dinas_id: insertedNota.id })
            .eq('id', id);
        }
      }
    }

    // Ekstrak bagian nomor urut dari format nota dinas (misal "600.4.6/033.11/17/PW/2026" -> "033.11")
    if (nomorNotaDinas) {
      const parts = nomorNotaDinas.split('/');
      if (parts.length >= 2) {
        nomorUrutNota = parts[1];
      } else {
        nomorUrutNota = nomorNotaDinas;
      }
    } else {
      nomorUrutNota = `001.${today.getMonth() + 1}`;
    }

    const nomorBapFinal = identitas.nomor_bap || `600.4/${nomorUrutNota}/BAP/17/${hari_ini_tahun}`;

    // Prepare data payload for docxtemplater
    const data = {
      nomor_bap_urut: nomorUrutNota,
      nomor_bap: nomorBapFinal,
      nomor_urut_bap: nomorUrutNota,
      nomor_nota_dinas: nomorNotaDinas,
      ...identitas, // contains kbli, alamat, pj_nama, telepon dll.
      ...checklistFlat, // contains air_fisik, ket_air_fisik dll.
      // Template specific fallbacks mapping
      luas_lahan: identitas.luas_lahan || identitas.luas_total || '',
      hari_kerja: identitas.hari_kerja || identitas.hari_kerja_minggu || '',
      hari_kerja_minggu: identitas.hari_kerja_minggu || identitas.hari_kerja || '',
      jumlah_pekerja_penghuni, // For perumahan
      jumlah_karyawan_pengunjung: identitas.jumlah_karyawan_pengunjung || (identitas.jumlah_penghuni ? `Pengunjung: ${identitas.jumlah_penghuni}, Pekerja: ${identitas.jumlah_pekerja || '-'}` : jumlah_pasien_pekerja), // For fasyankes/sppg
      kapasitas_kegiatan: identitas.kapasitas_kegiatan || (identitas.kapasitas_izin ? `Izin: ${identitas.kapasitas_izin}, Riil: ${identitas.kapasitas_riil || '-'}` : ''),
      jam_operasional: identitas.jam_operasional || identitas.shift_kerja || identitas.jam_kerja_hari || identitas.jam_produksi || '',
      shift_kerja_konstruksi: identitas.shift_kerja_konstruksi || '',
      shift_kerja: identitas.shift_kerja || identitas.jam_kerja_hari || identitas.shift_kerja_konstruksi || '',

      nama_badan_usaha_kegiatan: agenda.nama_pemrakarsa || identitas.nama_usaha || identitas.nama_kegiatan || '',
      alamat_lokasi: agenda.alamat_lokasi || identitas.alamat || '',
      hari_ini_nama,
      hari_ini_tanggal_terbilang,
      hari_ini_bulan,
      hari_ini_tahun_terbilang: hari_ini_tahun_terbilang.replace('  ', ' ').trim(),
      tahun_ini: hari_ini_tahun,
      waktu_pengawasan: formatted_waktu,
      
      ttd_pemrakarsa: ttd_pemrakarsa_final,
      paraf_pemrakarsa: paraf_pemrakarsa_combined,
      paraf_pengawas: paraf_pengawas_final,
      paraf_saksi: paraf_saksi_combined,
    
    // Root-level perwakilan tags
    nama_perwakilan,
    jabatan_perwakilan,
    telepon_perwakilan,
    ttd_perwakilan: ttd_perwakilan_final,
    paraf_perwakilan: paraf_perwakilan_final,
    
    tim_penilai_lengkap,
    tim_pengawas,
    saksi,
    perwakilan,
    dokumen_izin,
    foto_baris,
    saran,
    rincian_skoring: skoring,
    status_ketaatan: payloadOverride?.status_ketaatan || agenda.status_ketaatan || '',
    total_skor: (payloadOverride?.total_skor !== undefined ? payloadOverride.total_skor : agenda.total_skor) || ''
  };

  // 4. Determine Template
  let templateName = 'bap-toko.docx';
  const kategori = (agenda.kategori || '').toLowerCase();
  
  if (kategori.includes('industri') && fs.existsSync(path.join(process.cwd(), 'public', 'templates-bap', 'bap-industri.docx'))) {
    templateName = 'bap-industri.docx';
  } else if ((kategori.includes('fasyankes') || kategori.includes('kesehatan')) && fs.existsSync(path.join(process.cwd(), 'public', 'templates-bap', 'bap-fasyankes.docx'))) {
    templateName = 'bap-fasyankes.docx';
  } else if (kategori.includes('perumahan') && fs.existsSync(path.join(process.cwd(), 'public', 'templates-bap', 'bap-perumahan.docx'))) {
    templateName = 'bap-perumahan.docx';
  } else if (kategori.includes('sppg') && fs.existsSync(path.join(process.cwd(), 'public', 'templates-bap', 'bap-sppg.docx'))) {
    templateName = 'bap-sppg.docx';
  } else if (!fs.existsSync(path.join(process.cwd(), 'public', 'templates-bap', templateName))) {
    const files = fs.readdirSync(path.join(process.cwd(), 'public', 'templates-bap'));
    const docxFiles = files.filter(f => f.endsWith('.docx'));
    if (docxFiles.length > 0) templateName = docxFiles[0];
    else throw new Error('Tidak ada file template BAP (.docx) di folder public/templates-bap/');
  }

  const templatePath = path.join(process.cwd(), 'public', 'templates-bap', templateName);
  const content = fs.readFileSync(templatePath, 'binary');

  const zip = new PizZip(content);

  function getPngDimensions(buffer: Buffer) {
    if (buffer.length > 24 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20)
      };
    }
    return null;
  }

  const imageOptions = {
    getImage: function(tagValue: string, tagName: string) {
      const emptyImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
      if (!tagValue || typeof tagValue !== 'string') return emptyImageBuffer;
      
      const base64Regex = /^data:image\/(png|jpeg|jpg);base64,/;
      if (!base64Regex.test(tagValue)) return emptyImageBuffer;
      
      try {
        const base64Data = tagValue.replace(base64Regex, '');
        return Buffer.from(base64Data, 'base64');
      } catch (e) {
        return emptyImageBuffer;
      }
    },
    getSize: function(img: any, tagValue: string, tagName: string) {
      if (tagValue === '__EMPTY_PHOTO__') {
        return [1, 140]; // Preserve empty bordered photo table row in Dokumentasi
      }
      if (!tagValue || typeof tagValue !== 'string' || !tagValue.startsWith('data:image')) {
        return [1, 1]; // Return 1x1 if not signed so it stays clean
      }
      if (tagName.includes('foto_')) return [300, 225]; // 4:3 ratio for field photos
      
      let maxWidth = 160;
      let maxHeight = 60;
      
      if (tagName.includes('paraf_pengawas')) {
        maxWidth = 240;
        maxHeight = 34;
      } else if (tagName.includes('paraf_')) {
        maxWidth = 95;
        maxHeight = 34;
      }

      if (img instanceof Buffer) {
        const dims = getPngDimensions(img);
        if (dims && dims.width > 0 && dims.height > 0) {
          const ratio = Math.min(maxWidth / dims.width, maxHeight / dims.height);
          return [Math.round(dims.width * ratio), Math.round(dims.height * ratio)];
        }
      }
      
      return [maxWidth, maxHeight];
    }
  };

  const imageModule = new ImageModule(imageOptions);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => '',
    modules: [imageModule]
  });

  doc.render(data);

  const buf = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  const safeName = (agenda.nama_pemrakarsa || 'Usaha').replace(/[^a-zA-Z0-9]/g, '_');

  return { buf, safeName };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { buf, safeName } = await buildBapDocx(id);

    return new NextResponse(buf as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="BAP_${safeName}.docx"`,
      },
    });

  } catch (error: any) {
    console.error('Error generating BAP:', error);
    return NextResponse.json({ error: error.message || 'Gagal generate dokumen BAP' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { buf, safeName } = await buildBapDocx(id, body);

    return new NextResponse(buf as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `inline; filename="BAP_${safeName}.docx"`,
      },
    });

  } catch (error: any) {
    console.error('Error previewing BAP:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat pratinjau dokumen BAP' }, { status: 500 });
  }
}
