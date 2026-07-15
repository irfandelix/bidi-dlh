import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'agenda', 'arsip', 'dashboard'

    // Agenda Hari Ini (atau semua agenda yang belum ada BAP)
    if (type === 'agenda') {
      const { data, error } = await supabase
        .from('pengawasan_lapangans')
        .select('*')
        .order('tanggal_kunjungan', { ascending: false });
        
      if (error) throw error;
      
      // Filter manually for "doesn't have BAP" since Supabase JS doesn't have `doesntHave` easily without a join
      // Actually we can do a join: `*, bap_pengawasans!inner(*)` to get those with BAP.
      // To get those WITHOUT BAP, it's easier to fetch all, and then fetch all BAPs, or just fetch `bap_pengawasans(id)` and filter where it's null.
      const { data: agendaData, error: agendaError } = await supabase
        .from('pengawasan_lapangans')
        .select('*, bap_pengawasans(id)')
        .order('tanggal_kunjungan', { ascending: false });
        
      if (agendaError) throw agendaError;
      
      const agendas = agendaData.filter(item => !(item as any).bap_pengawasans || (item as any).bap_pengawasans.length === 0);
      return NextResponse.json({ data: agendas });
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
      // For simplicity, we just fetch all and filter by today's date string
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

    // Default: return all
    const { data, error } = await supabase.from('pengawasan_lapangans').select('*').order('tanggal_kunjungan', { ascending: false });
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error fetching pengawasan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    // Generate Token (e.g. FYK-A8B9C2)
    let prefix = 'DLH';
    if (body.kategori === 'Industri') prefix = 'IND';
    else if (body.kategori === 'Fasyankes') prefix = 'FYK';
    else if (body.kategori === 'Toko Modern') prefix = 'TOM';
    else if (body.kategori === 'Perumahan') prefix = 'RMH';
    else if (body.kategori === 'SPPG') prefix = 'MBG';
    
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    body.token = `${prefix}-${randomStr}`;

    const { data, error } = await supabase
      .from('pengawasan_lapangans')
      // @ts-ignore
      .insert([body])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating agenda:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
