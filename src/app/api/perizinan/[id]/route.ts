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

    // Fetch existing document to get tahun and jenis_dokumen
    const { data: doc, error: fetchError } = await supabase
      .from('dokumens')
      .select('tahun, jenis_dokumen, seq_pemeriksaan, seq_verlap, no_urut')
      .eq('id', unwrappedParams.id)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json({ error: fetchError?.message || 'Doc not found' }, { status: 400 });
    }

    const jenisAcronym = doc.jenis_dokumen === 'SPPL' ? 'SPPL' : 
                         doc.jenis_dokumen === 'UKL-UPL' ? 'UKL-UPL' : 
                         doc.jenis_dokumen === 'DPLH' ? 'DPLH' : 
                         doc.jenis_dokumen === 'AMDAL' ? 'AMDAL' : 
                         doc.jenis_dokumen === 'DELH' ? 'DELH' : 
                         doc.jenis_dokumen === 'PERTEK AIR LIMBAH' ? 'ST.AL' : 
                         doc.jenis_dokumen === 'PERTEK EMISI' ? 'ST.EM' : 
                         doc.jenis_dokumen === 'PERTEK ANDALALIN' ? 'ANDALALIN' : 
                         doc.jenis_dokumen;

    // Auto-generate nomor_ba_verlap if "AUTO"
    if (body.nomor_ba_verlap === 'AUTO') {
      const tgl = body.tanggal_verlap;
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
          .not('nomor_ba_verlap', 'is', null)
          .order('seq_verlap', { ascending: false })
          .limit(1);
        
        const maxSeq = maxDocs && maxDocs.length > 0 && maxDocs[0].seq_verlap ? maxDocs[0].seq_verlap : 48;
        currentSeq = maxSeq + 1;
      }
      
      const seqPadded = String(currentSeq).padStart(3, '0');
      body.nomor_ba_verlap = `600.4/${seqPadded}.${bulan}/17/BA.V.${jenisAcronym}/${tahun}`;
      body.seq_verlap = currentSeq;
    }

    // Auto-generate nomor_ba_pemeriksaan if "AUTO"
    if (body.nomor_ba_pemeriksaan === 'AUTO') {
      const tgl = body.tanggal_pemeriksaan;
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
          .not('nomor_ba_pemeriksaan', 'is', null)
          .order('seq_pemeriksaan', { ascending: false })
          .limit(1);
        
        const maxSeq = maxDocs && maxDocs.length > 0 && maxDocs[0].seq_pemeriksaan ? maxDocs[0].seq_pemeriksaan : 48;
        currentSeq = maxSeq + 1;
      }
      
      const seqPadded = String(currentSeq).padStart(3, '0');
      // Format based on Laravel assumption
      body.nomor_ba_pemeriksaan = `600.4/${seqPadded}.${bulan}/17/BA.P.${jenisAcronym}/${tahun}`;
      body.seq_pemeriksaan = currentSeq;
    }

    // Auto-generate nomor_php for Penerimaan Perbaikan
    if (body.status_tahapan === 'Penerimaan Perbaikan' && body.revisi_ke) {
      const nomorRevisi = parseInt(body.revisi_ke, 10) || 1;
      const kodeTahapan = nomorRevisi === 1 ? 'PHP' : `PHP${nomorRevisi - 1}`;
      const tgl = body[`tanggal_php_${nomorRevisi}`];
      const tglObj = tgl ? new Date(tgl) : new Date();
      const bulan = tglObj.getMonth() + 1;
      const tahun = doc.tahun || tglObj.getFullYear().toString();
      
      const seqPadded = String(doc.no_urut || doc.id).padStart(3, '0');
      const generatedNomorStr = `600.4/${seqPadded}.${bulan}/17/${kodeTahapan}.${jenisAcronym}/${tahun}`;

      if (nomorRevisi === 1) {
          body.nomor_php = generatedNomorStr;
      } else {
          body[`nomor_php${nomorRevisi - 1}`] = generatedNomorStr;
      }
    }

    // Auto-generate nomor_revisi for Pemeriksaan Revisi
    if (body.status_tahapan === 'Pemeriksaan Selesai' || body.status_tahapan === 'Pemeriksaan Revisi' || body.status_tahapan === 'Revisi Lanjutan' || body.status_tahapan === 'Selesai') {
      // We generate the BA.P.P when doing Pemeriksaan Revisi (Pemeriksaan Perbaikan)
      // Check if we are doing revisi
      if (body.revisi_ke || doc.revisi_ke) {
        let nomorRevisiStr = doc.revisi_ke || '1';
        for (let i = 1; i <= 5; i++) {
          if (body[`tanggal_revisi_${i}`]) {
            nomorRevisiStr = i.toString();
          }
        }
        const nomorRevisi = parseInt(nomorRevisiStr, 10);
        
        const kodeTahapan = "BA.P.P" + nomorRevisi;
        const tgl = body[`tanggal_revisi_${nomorRevisi}`] || doc[`tanggal_revisi_${nomorRevisi}`];
        const tglObj = tgl ? new Date(tgl) : new Date();
        const bulan = tglObj.getMonth() + 1;
        const tahun = doc.tahun || tglObj.getFullYear().toString();
        
        const seqUntukRevisi = doc.seq_pemeriksaan ?? ((doc.no_urut || doc.id) + 48);
        const seqPadded = String(seqUntukRevisi).padStart(3, '0');
        const generatedNomorStr = `600.4/${seqPadded}.${bulan}/17/${kodeTahapan}.${jenisAcronym}/${tahun}`;

        body[`nomor_revisi_${nomorRevisi}`] = generatedNomorStr;
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
