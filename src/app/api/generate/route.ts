import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { uploadFileToDrive } from '@/lib/gdrive';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, type, stage, target_revisi } = body;

    if (!id || !type || !stage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch document data from Supabase
    const supabase = await createClient();
    const { data: doc, error } = await supabase
      .from('dokumens')
      .select('*')
      .eq('id', id)
      .single() as any;

    if (error || !doc) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }

    // Prepare data for templating
    // Parse JSON string fields if they exist
    let tim_penilai: any[] = [];
    let petugas_jilidan: any = null;
    let petugas_penerima: any = null;
    
    try {
      let pIdsStr = '';
      if (stage === 'uji-administrasi') pIdsStr = doc.penandatangan_uji_admin;
      else if (stage === 'verifikasi-lapangan') pIdsStr = doc.penandatangan_verlap;
      else if (stage === 'pemeriksaan-revisi') pIdsStr = doc.penandatangan_revisi;
      else pIdsStr = doc.penandatangan_pemeriksaan;

      let pIds: number[] = [];
      if (pIdsStr) {
        if (typeof pIdsStr === 'string') pIds = JSON.parse(pIdsStr);
        else if (Array.isArray(pIdsStr)) pIds = pIdsStr;
      }
      if (pIds.length > 0) {
        const { data: tpData } = await supabase.from('tim_penilais').select('*').in('id', pIds);
        if (tpData) tim_penilai = tpData;
      }
      
      // Always fetch petugas MPP automatically (urutan_hierarki 13)
      const { data: pData } = await supabase.from('tim_penilais').select('*').eq('urutan_hierarki', 13).limit(1).single();
      if (pData) {
        petugas_jilidan = pData;
      }
      
      // Fetch petugas penerima (for registrasi)
      if (doc.petugas_mpp_id) {
        const { data: pPenerimaData } = await supabase.from('tim_penilais').select('*').eq('id', doc.petugas_mpp_id).maybeSingle();
        petugas_penerima = pPenerimaData;
      }
    } catch (e) {}

    const terbilang = (angka: number): string => {
      const huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
      if (angka < 12) return huruf[angka];
      if (angka < 20) return terbilang(angka - 10) + " Belas";
      if (angka < 100) return terbilang(Math.floor(angka / 10)) + " Puluh " + terbilang(angka % 10);
      if (angka < 200) return "Seratus " + terbilang(angka - 100);
      if (angka < 1000) return terbilang(Math.floor(angka / 100)) + " Ratus " + terbilang(angka % 100);
      if (angka < 2000) return "Seribu " + terbilang(angka - 1000);
      if (angka < 1000000) return terbilang(Math.floor(angka / 1000)) + " Ribu " + terbilang(angka % 1000);
      return angka.toString();
    };

    const d = new Date();
    const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    
    // Sort tim_penilai by urutan_hierarki ascending
    tim_penilai.sort((a, b) => (a.urutan_hierarki || 99) - (b.urutan_hierarki || 99));

    // Handle extra empty rows for signatures
    let ekstra: any = {};
    try { if (doc.ekstra_baris) ekstra = typeof doc.ekstra_baris === 'string' ? JSON.parse(doc.ekstra_baris) : doc.ekstra_baris; } catch(e) {}
    try { if (doc.penandatangan_hua) ekstra = { ...ekstra, ...(typeof doc.penandatangan_hua === 'string' ? JSON.parse(doc.penandatangan_hua) : doc.penandatangan_hua) }; } catch(e) {}
    
    const tambahanKosong = parseInt(ekstra.tambahan_kolom_kosong || '0', 10);
    if (!isNaN(tambahanKosong) && tambahanKosong > 0 && stage === 'pemeriksaan-substansi') {
      const maxUrutan = tim_penilai.length > 0 ? Math.max(...tim_penilai.map(p => p.urutan_hierarki || 0)) : 0;
      for (let i = 0; i < tambahanKosong; i++) {
        tim_penilai.push({
          nama: '',
          jabatan: '',
          jabatan_dinas: '',
          urutan_hierarki: maxUrutan + i + 1
        });
      }
    }

    // Ketua tim is the one with urutan_hierarki === 3, or the first one if not found
    const ketuaIndex = tim_penilai.findIndex(p => p.urutan_hierarki === 3);
    const ketua_tim = ketuaIndex !== -1 ? tim_penilai[ketuaIndex] : (tim_penilai.length > 0 ? tim_penilai[0] : {});
    
    const cleanJabatan = (item: any) => {
        let j = item.jabatan || item.jabatan_dinas || item.kategori || '-';
        if (j.toLowerCase().startsWith('jabatan : ')) j = j.substring(10).trim();
        else if (j.toLowerCase().startsWith('jabatan: ')) j = j.substring(9).trim();
        return j;
    };

    // Semua anggota dimasukkan tanpa menyembunyikan siapapun sesuai permintaan
    const tim_penilai_anggota = tim_penilai
        .map((item, idx) => ({ 
            ...item, 
            nomor_urut: idx + 1, 
            nomor_urut_anggota: idx + 1,
            jabatan: cleanJabatan(item)
        }));

    const tim_penilai_lengkap = tim_penilai.map((item, idx) => ({ 
        ...item, 
        nomor_urut: idx + 1,
        jabatan: cleanJabatan(item)
    }));


    const checklistData: any = {};
    for (let i = 0; i < 20; i++) {
       checklistData[`ada_${i+1}`] = ekstra?.keberadaan?.[i] === 'Ada' ? '✓' : '';
       checklistData[`tdk_ada_${i+1}`] = ekstra?.keberadaan?.[i] === 'Tidak Ada' ? '✓' : '';
       checklistData[`sesuai_${i+1}`] = ekstra?.kesesuaian?.[i] === 'Sesuai' ? '✓' : '';
       checklistData[`tdk_sesuai_${i+1}`] = ekstra?.kesesuaian?.[i] === 'Tidak Sesuai' ? '✓' : '';
       checklistData[`ket_${i+1}`] = ekstra?.keterangan_uji?.[i] || '';
    }

    // Parse Checklist items for "persyaratan" table loop
    const defaultChecklistItems = [
      "Surat Permohonan Pemeriksaan Dokumen UKL-UPL / SPPL*", 
      "Pernyataan Pengelolaan dan Pemantauan Lingkungan (Bermaterai)*",
      "Dokumen Lingkungan*", 
      "Peta Tapak Proyek - Siteplan di Kertas A3", 
      "Peta Pengelolaan Lingkungan - Siteplan di Kertas A3",
      "Peta Pemantauan Lingkungan - Siteplan di Kertas A3", 
      "PKKPR",
      "NIB (Untuk Swasta atau Perorangan)", 
      "Fotocopy Status Lahan (Sertifikat)", 
      "Fotocopy KTP Penanggungjawab Kegiatan",
      "Foto Eksisting Lokasi Rencana Kegiatan Disertai dengan Titik Koordinat", 
      "Lembar Penapisan dari AMDALNET / Arahan dari Instansi Lingkungan Hidup",
      "Surat Kuasa Pekerjaan dari Pemrakarsa ke Konsultan (Bermaterai)", 
      "Perizinan yang Sudah Dimiliki atau Izin yang Lama (Jika Ada)",
      "Pemenuhan Persetujuan Teknis Air Limbah", 
      "Pemenuhan Rincian Teknis Limbah B3 Sementara", 
      "Pemenuhan Persetujuan Teknis Emisi", 
      "Pemenuhan Persetujuan Teknis Andalalin", 
      "Hasil Penapisan Kewajiban Pemenuhan Persetujuan Teknis", 
      "Bukti Upload Permohonan pada AMDALNET dan/atau SIDARLING"
    ];
    
    let chkStatus = [];
    let chkNotes = [];
    try { if (doc.checklist_status) chkStatus = typeof doc.checklist_status === 'string' ? JSON.parse(doc.checklist_status) : doc.checklist_status; } catch(e) {}
    try { if (doc.checklist_notes) chkNotes = typeof doc.checklist_notes === 'string' ? JSON.parse(doc.checklist_notes) : doc.checklist_notes; } catch(e) {}
    
    const persyaratan = defaultChecklistItems.map((item_nama, index) => ({
      no: index + 1,
      item_nama: item_nama,
      ada: chkStatus[index] ? '✓' : '-',
      keterangan: chkNotes[index] || ''
    }));

    const targetRevisi = target_revisi ? String(target_revisi) : doc.revisi_ke;

    const templateData = {
      ...doc,
      ...ekstra,
      ...checklistData,
      nama_kegiatan_upper: doc.nama_kegiatan?.toUpperCase() || '',
      lokasi_kegiatan_upper: doc.lokasi_kegiatan?.toUpperCase() || '',
      nama_pemrakarsa_upper: doc.nama_pemrakarsa?.toUpperCase() || '',
      alamat_pemrakarsa_upper: doc.alamat_pemrakarsa?.toUpperCase() || '',
      persyaratan: persyaratan,
      no_urut: String(doc.no_urut || doc.id).padStart(3, '0'),
      tim_penilai: tim_penilai_lengkap,
      ketua_tim_nama: ketua_tim.nama || '-',
      ketua_tim_instansi: 'Dinas Lingkungan Hidup Kabupaten Sragen', // Hardcoded DLH or get from db if available
      ketua_tim_nip: ketua_tim.nip || '-',
      ketua_tim_jabatan: ketua_tim.jabatan || ketua_tim.jabatan_dinas || '-',
      tim_penilai_anggota: tim_penilai_anggota,
      tim_penilai_lengkap: tim_penilai_lengkap,
      hari_ini: new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      hari_ini_nama: namaHari[d.getDay()],
      hari_ini_tanggal: d.getDate().toString(),
      hari_ini_tanggal_terbilang: terbilang(d.getDate()).replace(/\s+/g, ' ').trim(),
      hari_ini_bulan: namaBulan[d.getMonth()],
      hari_ini_tahun: d.getFullYear().toString(),
      hari_ini_tanggal_huruf: terbilang(d.getDate()).trim(),
      hari_ini_tahun_huruf: terbilang(d.getFullYear()).trim(),
      tahun: d.getFullYear().toString(),
      tahun_terbilang: terbilang(d.getFullYear()).replace(/\s+/g, ' ').trim(),
      email_pemrakarsa: ekstra.email_pemrakarsa || doc.email_pemrakarsa || '-',
      jabatan_pemrakarsa: ekstra.jabatan_pemrakarsa || doc.jabatan_pemrakarsa || 'Penanggungjawab Kegiatan',
      tanggal_masuk: doc.tanggal_masuk_dokumen ? new Date(doc.tanggal_masuk_dokumen).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      tanggal_masuk_dokumen_format: doc.tanggal_masuk_dokumen ? new Date(doc.tanggal_masuk_dokumen).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      tanggal_surat_permohonan_format: doc.tanggal_surat_permohonan ? new Date(doc.tanggal_surat_permohonan).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      tanggal_pemeriksaan_format: doc.tanggal_pemeriksaan ? new Date(doc.tanggal_pemeriksaan).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      nomor_php: (() => {
        const jenisAcronym = ({
  'SPPL': 'SPPL', 'UKLUPL': 'UKLUPL', 'UKL-UPL': 'UKLUPL',
  'RINTEK LB3': 'RT.LB3', 'PERTEK AIR LIMBAH': 'ST.AL', 'PERTEK EMISI': 'ST.EM',
  'KAJIAN TEKNIS AIR LIMBAH': 'KT.AL', 'KAJIAN TEKNIS EMISI': 'KT.EM',
  'KT AL': 'KT.AL', 'KT EM': 'KT.EM', 'SLO': 'SLO', 'DPLH': 'DPLH', 
  'DELH': 'DELH', 'AMDAL': 'AMDAL'
} as Record<string, string>)[doc.jenis_dokumen as string] || doc.jenis_dokumen;
        const targetPhp = targetRevisi === '1' ? doc.nomor_php : doc[`nomor_php${parseInt(targetRevisi) - 1}`];
        if (targetPhp) return targetPhp;
        
        // Smart fallback for PHP
        const tglObj = new Date();
        const seqPadded = String(doc.no_urut || doc.id).padStart(3, '0');
        const kodeTahapan = targetRevisi === '1' ? 'PHP' : `PHP${parseInt(targetRevisi) - 1}`;
        return `600.4/${seqPadded}.${tglObj.getMonth()+1}/17/${kodeTahapan}.${jenisAcronym}/${doc.tahun || tglObj.getFullYear()}`;
      })(),
      nomor_revisi_1: doc.nomor_revisi_1 || (() => {
        if(targetRevisi !== '1') return '';
        const jenisAcronym = ({
  'SPPL': 'SPPL', 'UKLUPL': 'UKLUPL', 'UKL-UPL': 'UKLUPL',
  'RINTEK LB3': 'RT.LB3', 'PERTEK AIR LIMBAH': 'ST.AL', 'PERTEK EMISI': 'ST.EM',
  'KAJIAN TEKNIS AIR LIMBAH': 'KT.AL', 'KAJIAN TEKNIS EMISI': 'KT.EM',
  'KT AL': 'KT.AL', 'KT EM': 'KT.EM', 'SLO': 'SLO', 'DPLH': 'DPLH', 
  'DELH': 'DELH', 'AMDAL': 'AMDAL'
} as Record<string, string>)[doc.jenis_dokumen as string] || doc.jenis_dokumen;
        const tglObj = new Date();
        const seqUntukRevisi = doc.seq_pemeriksaan ?? ((doc.no_urut || doc.id) + 48);
        const seqPadded = String(seqUntukRevisi).padStart(3, '0');
        return `600.4/${seqPadded}.${tglObj.getMonth()+1}/17/BA.P.P1.${jenisAcronym}/${doc.tahun || tglObj.getFullYear()}`;
      })(),
      tanggal_revisi_format: doc[`tanggal_revisi_${targetRevisi}`] 
        ? new Date(doc[`tanggal_revisi_${targetRevisi}`]).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) 
        : '',
      tanggal_revisi_1_format: doc.tanggal_revisi_1 ? new Date(doc.tanggal_revisi_1).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      tanggal_revisi_2_format: doc.tanggal_revisi_2 ? new Date(doc.tanggal_revisi_2).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      tanggal_revisi_3_format: doc.tanggal_revisi_3 ? new Date(doc.tanggal_revisi_3).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      tanggal_revisi_4_format: doc.tanggal_revisi_4 ? new Date(doc.tanggal_revisi_4).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      tanggal_revisi_5_format: doc.tanggal_revisi_5 ? new Date(doc.tanggal_revisi_5).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      tanggal_php_1_format: doc.tanggal_php_1 ? new Date(doc.tanggal_php_1).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      tanggal_php_2_format: doc.tanggal_php_2 ? new Date(doc.tanggal_php_2).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      tanggal_php_3_format: doc.tanggal_php_3 ? new Date(doc.tanggal_php_3).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      tanggal_php_4_format: doc.tanggal_php_4 ? new Date(doc.tanggal_php_4).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      tanggal_php_5_format: doc.tanggal_php_5 ? new Date(doc.tanggal_php_5).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      tanggal_pengembalian_format: doc.tanggal_pengembalian ? new Date(doc.tanggal_pengembalian).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      tanggal_uji_berkas_format: doc.tanggal_uji_berkas ? new Date(doc.tanggal_uji_berkas).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      tanggal_verlap_format: doc.tanggal_verlap ? new Date(doc.tanggal_verlap).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      tanggal_risalah_format: doc.tanggal_risalah ? new Date(doc.tanggal_risalah).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      tanggal_penyerahan_sk_format: doc.tanggal_penyerahan_sk ? new Date(doc.tanggal_penyerahan_sk).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      tanggal_penerimaan_jilidan_format: doc.tanggal_penerimaan_jilidan ? new Date(doc.tanggal_penerimaan_jilidan).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
      // Aliases for old template variables
      telp_pemrakarsa: doc.telepon_pemrakarsa || '',
      telp_konsultan: doc.telepon_konsultan || '',
      // Petugas MPP / Jilidan
      nama_petugas_mpp: petugas_jilidan ? petugas_jilidan.nama : '-',
      jabatan_petugas_mpp: petugas_jilidan ? petugas_jilidan.jabatan_dinas : '-',
      nama_petugas_jilidan: petugas_jilidan ? petugas_jilidan.nama : '-',
      jabatan_petugas_jilidan: petugas_jilidan ? petugas_jilidan.jabatan_dinas : '-',
      // Petugas Penerima (Registrasi)
      petugas_penerima: petugas_penerima ? petugas_penerima.nama : '-',
      // Amdalnet
      has_amdalnet: !!doc.nomor_registrasi_amdalnet
    };

    // 2. Read template file
    const templatePath = path.join(process.cwd(), 'src', 'templates', stage, `${type}.docx`);
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: `Template tidak ditemukan di path: ${templatePath}` }, { status: 404 });
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    
    // 3. Render document
    const docxtemplater = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: (part: any) => {
        return part.module ? "" : "-";
      }
    });

    // Replace empty strings with a dash so they render as "-" instead of blank space
    const finalTemplateData = { ...templateData };
    for (const key in finalTemplateData) {
      if (finalTemplateData[key] === "" || finalTemplateData[key] === null || finalTemplateData[key] === undefined) {
        finalTemplateData[key] = "-";
      }
    }

    docxtemplater.render(finalTemplateData);

    const buf = docxtemplater.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    const fileName = `${type}_${(doc.nama_kegiatan || 'kegiatan').replace(/\s+/g, '_')}_${(doc.nama_pemrakarsa || 'pemrakarsa').replace(/\s+/g, '_')}.docx`;

    // Upload to Google Drive
    try {
      const folderName = doc.nama_kegiatan || 'Dokumen Tanpa Nama Kegiatan';
      const fileUrl = await uploadFileToDrive(buf as Buffer, fileName, folderName);
      
      // Update DB with the URL
      const typeToColumnMap: Record<string, string> = {
        'checklist': 'file_checklist_url',
        'tanda_terima_registrasi': 'file_tanda_terima_url',
        'berita_acara': 'file_ba_word_url',
        'php': 'file_php_url',
        'tanda_terima_uji_admin': 'file_uji_admin_url',
        'template_ba_uji_admin': 'file_uji_admin_url',
        'template_ba_substansi': 'file_ba_substansi_url',
        'template_tanda_terima_perbaikan': 'file_penerimaan_url',
        'template_ba_pemeriksaan_revisi': 'file_php1_url',
      };
      
      const columnToUpdate = typeToColumnMap[type];
      if (columnToUpdate) {
        await supabase
          .from('dokumens')
          // @ts-ignore
          .update({ [columnToUpdate]: fileUrl })
          .eq('id', id);
      }
    } catch (uploadError) {
      console.error('Failed to upload to Google Drive:', uploadError);
      // We don't throw here because we still want to return the downloaded file to the user
    }

    // 4. Return the file as a response
    return new NextResponse(buf as any, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${type}_${(doc.nama_kegiatan || 'kegiatan').replace(/\\s+/g, '_')}_${(doc.nama_pemrakarsa || 'pemrakarsa').replace(/\\s+/g, '_')}.docx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    });

  } catch (error: any) {
    console.error('Docx Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type');
  const stage = searchParams.get('stage');
  
  if (!id || !type || !stage) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Reuse the exact same logic as POST by passing a fake request object
  const fakeRequest = new Request(request.url, {
    method: 'POST',
    body: JSON.stringify({ id, type, stage })
  });
  
  return POST(fakeRequest);
}

