import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { validateChecklistSubmission } from '@/lib/checklist-perizinan';

// shortcut: in-memory rate limit per serverless instance, upgrade to Redis if spam exceeds instance limits
const ipSubmissions = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 15;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (ipSubmissions.get(ip) || []).filter((ts) => now - ts < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    ipSubmissions.set(ip, recent);
    return true;
  }
  recent.push(now);
  ipSubmissions.set(ip, recent);
  return false;
}

function getServiceSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get('content-length') || '0');
    if (contentLength > 32768) {
      return NextResponse.json(
        { error: 'Ukuran kiriman data terlalu besar.' },
        { status: 413 }
      );
    }

    const forwarded = request.headers.get('x-forwarded-for') || '';
    const clientIp = forwarded.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: 'Terlalu banyak pengiriman dalam waktu singkat. Silakan coba beberapa menit lagi.' },
        { status: 429 }
      );
    }

    const rawBody = await request.json().catch(() => null);
    const validation = validateChecklistSubmission(rawBody);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('checklist_perizinan_mandiri')
      .insert({
        nama: validation.data.nama,
        jabatan: validation.data.jabatan,
        nomor_whatsapp: validation.data.nomor_whatsapp,
        perusahaan_fasyankes: validation.data.perusahaan_fasyankes,
        daftar_perizinan: validation.data.daftar_perizinan,
        belum_ada_izin: validation.data.belum_ada_izin,
      });

    if (error) {
      console.error('Supabase insert checklist_perizinan_mandiri error:', error);
      return NextResponse.json(
        { error: 'Gagal menyimpan data ke server. Silakan periksa koneksi lalu coba lagi.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        submitted: validation.data,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/checklist-perizinan exception:', err);
    return NextResponse.json(
      { error: 'Terjadi gangguan pada server saat memproses formulir.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get('bidi_session')?.value) {
      return NextResponse.json({ error: 'Tidak memiliki akses.' }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Konfigurasi kunci server database belum tersedia.' },
        { status: 500 }
      );
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('checklist_perizinan_mandiri')
      .select('id, nama, jabatan, nomor_whatsapp, perusahaan_fasyankes, daftar_perizinan, belum_ada_izin, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET /api/checklist-perizinan error:', error);
      return NextResponse.json({ error: 'Gagal memuat data checklist.' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err) {
    console.error('GET /api/checklist-perizinan exception:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan saat membaca data.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get('bidi_session')?.value) {
      return NextResponse.json({ error: 'Tidak memiliki akses.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id') || '';
    if (!/^\d+$/.test(idParam)) {
      return NextResponse.json({ error: 'ID data tidak valid.' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('checklist_perizinan_mandiri')
      .delete()
      .eq('id', Number(idParam));

    if (error) {
      console.error('DELETE /api/checklist-perizinan error:', error);
      return NextResponse.json({ error: 'Gagal menghapus data.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/checklist-perizinan exception:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan saat menghapus data.' }, { status: 500 });
  }
}
