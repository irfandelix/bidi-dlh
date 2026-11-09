import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get('bidi_session')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase: any = await createClient();
    
    const { data, error } = await supabase
      .from('pengaduans')
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
    const cookieStore = await cookies();
    if (!cookieStore.get('bidi_session')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase: any = await createClient();
    const body = await request.json();
    
    const { 
      perihal, 
      tanggal, 
      dokumentasi_url, 
      ba_url, 
      token, 
      status_tahapan,
      nama_pelapor,
      telp_pelapor,
      no_hp,
      nama_terlapor,
      lokasi_aduan,
      deskripsi
    } = body;
    
    if (!perihal) {
      return NextResponse.json({ error: 'Perihal/Judul pengaduan wajib diisi' }, { status: 400 });
    }

    // Integrasi Otomatis dengan Nota Dinas pada Bagian Arsip
    const tanggalNota = tanggal || new Date().toISOString().split('T')[0];
    const tahun = new Date(tanggalNota).getFullYear().toString();
    const bulan = new Date(tanggalNota).getMonth() + 1;

    let notaDinasId = body.nota_dinas_id || null;
    let nomorNotaDinas = body.nomor_nota_dinas || null;

    if (!nomorNotaDinas) {
      // Auto-generate nomor urut nota dinas baru di arsip_nota_dinas
      const { data: lastDoc } = await supabase
        .from('arsip_nota_dinas')
        .select('no_urut')
        .gte('tanggal_nota', `${tahun}-01-01`)
        .lte('tanggal_nota', `${tahun}-12-31`)
        .order('no_urut', { ascending: false })
        .limit(1);

      let nextUrut = 1;
      if (lastDoc && lastDoc.length > 0) {
        nextUrut = (lastDoc[0].no_urut || 0) + 1;
      }

      const urutStr = String(nextUrut).padStart(3, '0');
      // Format resmi Pengaduan DLH Sragen: 600.4.17.2/XXX.Bulan/17/PG/Tahun
      nomorNotaDinas = `600.4.17.2/${urutStr}.${bulan}/17/PG/${tahun}`;

      // Simpan langsung ke arsip_nota_dinas agar tercatat di modul arsip
      const { data: insertedNota, error: notaErr } = await supabase
        .from('arsip_nota_dinas')
        .insert([{
          no_urut: nextUrut,
          nama_nota: `Surat Tindak Lanjut Pengaduan - ${perihal} (${nama_terlapor || 'Masyarakat'})`,
          tanggal_nota: tanggalNota,
          dari_bagian: 'Pengaduan',
          nomor_otomatis: nomorNotaDinas,
          file_url: null,
          pemohon_id: null,
          keterangan: `Terintegrasi otomatis dari Tiket Pengaduan #${token || '-'}: ${perihal}`
        }])
        .select()
        .single();

      if (!notaErr && insertedNota) {
        notaDinasId = insertedNota.id;
        nomorNotaDinas = insertedNota.nomor_otomatis;
      } else if (notaErr) {
        console.error('Gagal mencatat arsip_nota_dinas otomatis untuk Pengaduan:', notaErr);
      }
    }

    const payload: any = {
      perihal,
      tanggal: tanggalNota,
      dokumentasi_url: dokumentasi_url || null,
      ba_url: ba_url || null,
      token: token || null,
      status_tahapan: status_tahapan || (nama_pelapor ? 'Form Terisi' : 'Menunggu Isian'),
      nama_pelapor: nama_pelapor || null,
      telp_pelapor: telp_pelapor || no_hp || null,
      nama_terlapor: nama_terlapor || null,
      lokasi_aduan: lokasi_aduan || null,
      deskripsi: deskripsi || null,
      nomor_nota_dinas: nomorNotaDinas,
      nota_dinas_id: notaDinasId
    };

    const { data, error } = await supabase
      .from('pengaduans')
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
