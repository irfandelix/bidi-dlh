import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase: any = await createClient();
    
    const { data, error } = await supabase
      .from('arsip_masuk')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase: any = await createClient();
    const body = await request.json();
    
    const { 
      kode_klasifikasi, 
      nomor_berkas, 
      nomor_isi_berkas, 
      nomor_item, 
      tanggal_surat, 
      tanggal_terima, 
      asal_surat, 
      perihal, 
      file_url, 
      jumlah, 
      status_surat 
    } = body;
    
    if (!tanggal_surat || !asal_surat || !perihal) {
      return NextResponse.json({ error: 'Data wajib belum lengkap diisi' }, { status: 400 });
    }

    // Split kode_klasifikasi automatically
    let kode1 = null, kode2 = null, kode3 = null, kode4 = null;
    if (kode_klasifikasi) {
      const parts = kode_klasifikasi.split('.');
      kode1 = parts[0] || null;
      kode2 = parts[1] || null;
      kode3 = parts[2] || null;
      kode4 = parts[3] || null;
    }

    const payload = {
      kode_klasifikasi, // Tetap simpan aslinya untuk cadangan
      nomor_berkas,
      nomor_isi_berkas,
      nomor_item,
      kode_klasifikasi_1: kode1,
      kode_klasifikasi_2: kode2,
      kode_klasifikasi_3: kode3,
      kode_klasifikasi_4: kode4,
      tanggal_surat,
      tanggal_terima,
      asal_surat,
      perihal,
      file_url,
      jumlah: jumlah || 1,
      status_surat: status_surat || 'Biasa'
    };

    const { data, error } = await supabase
      .from('arsip_masuk')
      .insert([payload])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: data[0] }, { status: 201 });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
