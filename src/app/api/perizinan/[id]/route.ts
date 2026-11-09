import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase: any = await createClient();
    const unwrappedParams = await params;
    const { data, error } = await supabase
      .from('dokumens')
      .select('*')
      .eq('id', unwrappedParams.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase: any = await createClient();
    const body = await request.json();
    const unwrappedParams = await params;

    // Fetch existing document to get tahun, jenis_dokumen, existing dates, and sequences
    const { data: doc, error: fetchError } = await supabase
      .from('dokumens')
      .select('*')
      .eq('id', unwrappedParams.id)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json({ error: fetchError?.message || 'Doc not found' }, { status: 400 });
    }

    const jenisAcronym = ({
      'SPPL': 'SPPL', 'UKLUPL': 'UKLUPL', 'UKL-UPL': 'UKLUPL',
      'Rincian Teknis dan Intergrasi Rincian Teknis Limbah B3 ke Persetujuan Lingkungan': 'RT.INT.LB3',
      'RINTEK LB3': 'RT.LB3', 'PERTEK AIR LIMBAH': 'ST.AL', 'PERTEK EMISI': 'ST.EM',
      'STANDAR TEKNIS AIR LIMBAH': 'ST.AL', 'STANDAR TEKNIS EMISI': 'ST.EM',
      'Standar Teknis Air Limbah': 'ST.AL', 'Standar Teknis Emisi': 'ST.EM',
      'Standar Teknis Pemenuhan Baku Mutu Air Limbah': 'ST.AL', 'Standar Teknis Pemenuhan Baku Mutu Emisi': 'ST.EM',
      'STANDAR TEKNIS PEMENUHAN BAKU MUTU AIR LIMBAH': 'ST.AL', 'STANDAR TEKNIS PEMENUHAN BAKU MUTU EMISI': 'ST.EM',
      'Persetujuan Teknis Air Limbah': 'ST.AL', 'Persetujuan Teknis Emisi': 'ST.EM',
      'KAJIAN TEKNIS AIR LIMBAH': 'KT.AL', 'KAJIAN TEKNIS EMISI': 'KT.EM',
      'Kajian Teknis Air Limbah': 'KT.AL', 'Kajian Teknis Emisi': 'KT.EM',
      'Kajian Teknis Pemenuhan Baku Mutu Air Limbah': 'KT.AL', 'Kajian Teknis Pemenuhan Baku Mutu Emisi': 'KT.EM',
      'KAJIAN TEKNIS PEMENUHAN BAKU MUTU AIR LIMBAH': 'KT.AL', 'KAJIAN TEKNIS PEMENUHAN BAKU MUTU EMISI': 'KT.EM',
      'KT AL': 'KT.AL', 'KT EM': 'KT.EM', 'SLO': 'SLO', 'DPLH': 'DPLH', 
      'DELH': 'DELH', 'AMDAL': 'AMDAL',
      'Permohonan Perubahan Dokumen Lingkungan': 'PDL',
      'Permohonan Perubahan Lingkungan': 'PPL',
      'Permohonan Arahan': 'ARH',
      'Integrasi RINTEK LB3 ke Persetujuan Lingkungan': 'INT.LB3',
      'INTEGRASI RINTEK LB3 KE PERSETUJUAN LINGKUNGAN': 'INT.LB3',
      'INTERGRASI RINTEK LB3 KE PERSETUJUAN LINGKUNGAN': 'INT.LB3',
      'Permohonan Integrasi RINTEK LB3': 'INT.LB3',
      'Permohonan Intergrasi RINTEK LB3': 'INT.LB3',
    } as Record<string, string>)[doc.jenis_dokumen as string] || doc.jenis_dokumen;

    // 1. Auto-generate nomor_checklist (Registrasi) if "AUTO"
    if (body.nomor_checklist === 'AUTO') {
      const tgl = body.tanggal_masuk_dokumen || doc.tanggal_masuk_dokumen;
      const tglObj = tgl ? new Date(tgl) : new Date();
      const bulan = tglObj.getMonth() + 1;
      const tahun = doc.tahun || tglObj.getFullYear().toString();
      const seqPadded = String(doc.no_urut || doc.id).padStart(3, '0');
      body.nomor_checklist = `600.4.5/${seqPadded}.${bulan}/17/REG.${jenisAcronym}/${tahun}`;
    }

    // 2. Auto-generate nomor_uji_berkas (BA Uji Administrasi / HUA) if "AUTO"
    if (body.nomor_uji_berkas === 'AUTO') {
      const tgl = body.tanggal_uji_berkas || doc.tanggal_uji_berkas;
      const tglObj = tgl ? new Date(tgl) : new Date();
      const bulan = tglObj.getMonth() + 1;
      const tahun = doc.tahun || tglObj.getFullYear().toString();
      const seqPadded = String(doc.no_urut || doc.id).padStart(3, '0');
      body.nomor_uji_berkas = `600.4.5/${seqPadded}.${bulan}/17/BA.HUA.${jenisAcronym}/${tahun}`;
    }

    // 3. Auto-generate nomor_ba_verlap if "AUTO"
    if (body.nomor_ba_verlap === 'AUTO') {
      const tgl = body.tanggal_verlap || doc.tanggal_verlap;
      const tglObj = tgl ? new Date(tgl) : new Date();
      const bulan = tglObj.getMonth() + 1;
      const tahun = doc.tahun || tglObj.getFullYear().toString();
      
      let currentSeq = doc.seq_verlap;
      if (!currentSeq) {
        // Find max seq_verlap for this year
        const { data: maxDocs } = await supabase
          .from('dokumens')
          .select('seq_verlap')
          .eq('tahun', tahun)
          .not('seq_verlap', 'is', null)
          .order('seq_verlap', { ascending: false, nullsFirst: false })
          .limit(1);
        
        const maxSeq = maxDocs && maxDocs.length > 0 && maxDocs[0].seq_verlap ? maxDocs[0].seq_verlap : 48;
        currentSeq = maxSeq + 1;
      }
      
      const seqPadded = String(currentSeq).padStart(3, '0');
      body.nomor_ba_verlap = `600.4.5/${seqPadded}.${bulan}/17/BA.V.${jenisAcronym}/${tahun}`;
      body.seq_verlap = currentSeq;
    }

    // 4. Auto-generate nomor_ba_pemeriksaan if "AUTO"
    if (body.nomor_ba_pemeriksaan === 'AUTO') {
      const tgl = body.tanggal_pemeriksaan || doc.tanggal_pemeriksaan;
      const tglObj = tgl ? new Date(tgl) : new Date();
      const bulan = tglObj.getMonth() + 1;
      const tahun = doc.tahun || tglObj.getFullYear().toString();
      
      let currentSeq = doc.seq_pemeriksaan;
      if (!currentSeq) {
        // Find max seq_pemeriksaan for this year
        const { data: maxDocs } = await supabase
          .from('dokumens')
          .select('seq_pemeriksaan')
          .eq('tahun', tahun)
          .not('seq_pemeriksaan', 'is', null)
          .order('seq_pemeriksaan', { ascending: false, nullsFirst: false })
          .limit(1);
        
        const maxSeq = maxDocs && maxDocs.length > 0 && maxDocs[0].seq_pemeriksaan ? maxDocs[0].seq_pemeriksaan : 48;
        currentSeq = maxSeq + 1;
      }
      
      const seqPadded = String(currentSeq).padStart(3, '0');
      body.nomor_ba_pemeriksaan = `600.4.5/${seqPadded}.${bulan}/17/BA.P.${jenisAcronym}/${tahun}`;
      body.seq_pemeriksaan = currentSeq;
    }

    // 5. Auto-generate nomor_php for Penerimaan Perbaikan
    if (body.nomor_php === 'AUTO' || (body.status_tahapan === 'Penerimaan Perbaikan' && body.revisi_ke)) {
      const nomorRevisi = parseInt(body.revisi_ke || doc.revisi_ke || '1', 10) || 1;
      const kodeTahapan = nomorRevisi === 1 ? 'PHP' : `PHP${nomorRevisi - 1}`;
      const tgl = body[`tanggal_php_${nomorRevisi}`] || doc[`tanggal_php_${nomorRevisi}`];
      const tglObj = tgl ? new Date(tgl) : new Date();
      const bulan = tglObj.getMonth() + 1;
      const tahun = doc.tahun || tglObj.getFullYear().toString();
      
      const seqPadded = String(doc.no_urut || doc.id).padStart(3, '0');
      const generatedNomorStr = `600.4.5/${seqPadded}.${bulan}/17/${kodeTahapan}.${jenisAcronym}/${tahun}`;

      if (nomorRevisi === 1) {
        body.nomor_php = generatedNomorStr;
      } else {
        if (body.nomor_php === 'AUTO') delete body.nomor_php;
        body[`nomor_php${nomorRevisi - 1}`] = generatedNomorStr;
      }
    }

    // 6. Auto-generate nomor_revisi for Pemeriksaan Revisi
    if (
      body.generate_nomor_revisi === true ||
      body.status_tahapan === 'Pemeriksaan Selesai' ||
      body.status_tahapan === 'Pemeriksaan Revisi' ||
      body.status_tahapan === 'Revisi Lanjutan' ||
      body.status_tahapan === 'Selesai'
    ) {
      delete body.generate_nomor_revisi;
      if (body.revisi_ke || doc.revisi_ke) {
        let nomorRevisiStr = body.revisi_ke || doc.revisi_ke || '1';
        if (!body.revisi_ke) {
          for (let i = 1; i <= 5; i++) {
            if (body[`tanggal_revisi_${i}`]) {
              nomorRevisiStr = i.toString();
            }
          }
        }
        const nomorRevisi = parseInt(nomorRevisiStr, 10) || 1;
        
        // Deteksi apakah dokumen revisi ini sudah final (BA.P.FINAL)
        const isFinal = body.is_final === true || body.is_final === 'true' || body.is_final_revisi === true;
        const kodeTahapan = isFinal ? "BA.P.FINAL" : ("BA.P.P" + nomorRevisi);
        
        const tgl = body[`tanggal_revisi_${nomorRevisi}`] || doc[`tanggal_revisi_${nomorRevisi}`];
        const tglObj = tgl ? new Date(tgl) : new Date();
        const bulan = tglObj.getMonth() + 1;
        const tahun = doc.tahun || tglObj.getFullYear().toString();
        
        const seqUntukRevisi = doc.seq_pemeriksaan ?? ((doc.no_urut || doc.id) + 48);
        const seqPadded = String(seqUntukRevisi).padStart(3, '0');
        const generatedNomorStr = `600.4.5/${seqPadded}.${bulan}/17/${kodeTahapan}.${jenisAcronym}/${tahun}`;

        body[`nomor_revisi_${nomorRevisi}`] = generatedNomorStr;
        body.is_final_revisi = isFinal;
        delete body.is_final;
      }
    }

    // 7. Auto-generate nomor_risalah (RPD) if "AUTO"
    if (body.nomor_risalah === 'AUTO') {
      const tgl = body.tanggal_risalah || doc.tanggal_risalah;
      const tglObj = tgl ? new Date(tgl) : new Date();
      const bulan = tglObj.getMonth() + 1;
      const tahun = doc.tahun || tglObj.getFullYear().toString();
      const seqPadded = String(doc.no_urut || doc.id).padStart(3, '0');
      body.nomor_risalah = `600.4.5/${seqPadded}.${bulan}/17/RPD.${jenisAcronym}/${tahun}`;
    }

    // Convert empty string dates to null
    const dateFields = [
      'tanggal_uji_berkas', 'tanggal_verlap', 'tanggal_pemeriksaan', 'tanggal_masuk_dokumen',
      'tanggal_revisi_1', 'tanggal_revisi_2', 'tanggal_revisi_3', 'tanggal_revisi_4', 'tanggal_revisi_5',
      'tanggal_php_1', 'tanggal_php_2', 'tanggal_php_3', 'tanggal_php_4', 'tanggal_php_5',
      'tanggal_risalah', 'tanggal_pengembalian', 'tanggal_penyerahan_sk', 'tanggal_penerimaan_jilidan',
      'tanggal_surat_permohonan'
    ];
    for (const field of dateFields) {
      if (body[field] === '') {
        body[field] = null;
      }
    }

    const { data, error } = await supabase
      .from('dokumens')
      // @ts-ignore
      .update(body)
      .eq('id', unwrappedParams.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Data berhasil diupdate', data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
