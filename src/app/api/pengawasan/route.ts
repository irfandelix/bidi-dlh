import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get('bidi_session')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'agenda', 'arsip', 'dashboard'

    // Agenda Hari Ini (atau semua agenda yang belum ada BAP)
    if (type === 'agenda') {
      const { data: agendaData, error: agendaError } = await supabase
        .from('pengawasan_lapangans')
        .select('*, bap_pengawasans(id)')
        .order('tanggal_kunjungan', { ascending: false });
        
      if (agendaError) throw agendaError;
      
      const agendas = agendaData.filter(item => !(item as any).bap_pengawasans || (item as any).bap_pengawasans.length === 0);
      return NextResponse.json({ data: agendas }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }

    if (type === 'arsip') {
      const { data, error } = await supabase
        .from('pengawasan_lapangans')
        .select('*, bap_pengawasans!inner(*)')
        .order('tanggal_kunjungan', { ascending: false });
        
      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (type === 'dashboard') {
      // 1. Riwayat Terbaru (Has BAP)
      const { data: riwayatTerbaru, error: errRiwayat } = await supabase
        .from('pengawasan_lapangans')
        .select('*, bap_pengawasans!inner(*)')
        .order('tanggal_kunjungan', { ascending: false })
        .limit(10);
        
      if (errRiwayat) throw errRiwayat;

      // 2. Agenda Hari Ini (Where tanggal_kunjungan == today)
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: agendaHariIni, error: errAgenda } = await supabase
        .from('pengawasan_lapangans')
        .select('*')
        .eq('tanggal_kunjungan', todayStr)
        .order('tanggal_kunjungan', { ascending: false });

      if (errAgenda) throw errAgenda;

      return NextResponse.json({ 
        data: {
          riwayatTerbaru: riwayatTerbaru || [],
          agendaHariIni: agendaHariIni || []
        }
      });
    }

    // Default: return all with BAP relationship
    const { data, error } = await supabase
      .from('pengawasan_lapangans')
      .select('*, bap_pengawasans(*)')
      .order('tanggal_kunjungan', { ascending: false });
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error fetching pengawasan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get('bidi_session')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const body = await request.json();

    // Cek apakah request berupa multi-lokasi (body.items) atau single agenda
    const items = Array.isArray(body.items) && body.items.length > 0 
      ? body.items 
      : [{
          nama_kegiatan: body.nama_kegiatan,
          nama_pemrakarsa: body.nama_pemrakarsa,
          kategori: body.kategori,
          alamat_lokasi: body.alamat_lokasi,
          latitude: body.latitude,
          longitude: body.longitude,
          saksi: body.saksi
        }];
    
    // Generate 1 Token Bersama (Shared Token)
    let prefix = 'PGW';
    if (items.length === 1) {
      const kat = items[0].kategori;
      if (kat === 'Industri') prefix = 'IND';
      else if (kat === 'Fasyankes') prefix = 'FYK';
      else if (kat === 'Toko Modern') prefix = 'TOM';
      else if (kat === 'Perumahan') prefix = 'RMH';
      else if (kat === 'SPPG') prefix = 'MBG';
    }
    
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const sharedToken = `${prefix}-${randomStr}`;

    // Integrasi dengan Nota Dinas pada Bagian Arsip
    let notaDinasId = body.nota_dinas_id || null;
    let nomorNotaDinas = body.nomor_nota_dinas || null;

    const tanggalNota = body.tanggal_kunjungan || new Date().toISOString().split('T')[0];
    const tahun = new Date(tanggalNota).getFullYear().toString();
    const bulan = new Date(tanggalNota).getMonth() + 1;

    if (!nomorNotaDinas) {
      // Auto-generate nomor urut nota dinas baru di arsip_nota_dinas
      const { data: lastDoc } = await supabaseAdmin
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
      nomorNotaDinas = `600.4.6/${urutStr}.${bulan}/17/PW/${tahun}`;

      // Ringkasan nama objek yang dikunjungi untuk judul nota dinas
      const ringkasanObjek = items.map((it: any) => it.nama_kegiatan || '-').join(', ');
      const namaNota = `Nota Dinas Pengawasan Lapangan - ${ringkasanObjek}`.substring(0, 240);

      // Simpan langsung ke arsip_nota_dinas agar tercatat di modul arsip
      const { data: insertedNota, error: notaErr } = await supabaseAdmin
        .from('arsip_nota_dinas')
        .insert([{
          no_urut: nextUrut,
          nama_nota: namaNota,
          tanggal_nota: tanggalNota,
          dari_bagian: 'Pengawasan',
          nomor_otomatis: nomorNotaDinas,
          file_url: null,
          pemohon_id: null,
          keterangan: `Terintegrasi otomatis dari Jadwal Pengawasan #${sharedToken} (${items.length} lokasi)`
        }])
        .select()
        .single();

      if (!notaErr && insertedNota) {
        notaDinasId = insertedNota.id;
        nomorNotaDinas = insertedNota.nomor_otomatis;
      } else if (notaErr) {
        console.error('Gagal mencatat arsip_nota_dinas otomatis:', notaErr);
      }
    }

    // Susun baris record pengawasan_lapangans (1 s.d. 5 lokasi)
    const recordsToInsert = items.map((it: any) => ({
      tanggal_kunjungan: tanggalNota,
      tim_tugas: body.tim_tugas,
      token: sharedToken,
      nomor_nota_dinas: nomorNotaDinas,
      nota_dinas_id: notaDinasId,
      kategori: it.kategori || 'Lainnya',
      nama_kegiatan: (it.nama_kegiatan || '').trim(),
      nama_pemrakarsa: (it.nama_pemrakarsa || '-').trim(),
      alamat_lokasi: (it.alamat_lokasi || '').trim(),
      latitude: it.latitude || null,
      longitude: it.longitude || null,
      saksi: it.saksi || body.saksi || null
    }));

    const { data, error } = await supabaseAdmin
      .from('pengawasan_lapangans')
      .insert(recordsToInsert)
      .select();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      token: sharedToken,
      nomor_nota_dinas: nomorNotaDinas,
      data 
    });
  } catch (error: any) {
    console.error('Error creating agenda:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get('bidi_session')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID agenda wajib diisi' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from('pengawasan_lapangans')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting agenda:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
