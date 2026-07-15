'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function handleLogin(formData: FormData) {
  const name = formData.get('name') as string;
  const password = formData.get('password') as string;

  if (!name || !password) {
    return { error: 'Nama pengguna dan kata sandi wajib diisi.' };
  }

  try {
    const supabase: any = await createClient();
    
    // Periksa ke tabel 'users' kustom
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('name', name)
      .single();

    if (error || !user) {
      return { error: 'Nama pengguna atau kata sandi salah.' };
    }

    // Periksa password (jika plain text sesuai permintaan, bandingkan langsung)
    // Catatan keamanan: idealnya password di-hash menggunakan bcrypt dll.
    if (user.password !== password) {
      return { error: 'Nama pengguna atau kata sandi salah.' };
    }

    // Jika berhasil, set cookie sesi
    const cookieStore = await cookies();
    cookieStore.set('bidi_session', name, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: '/',
    });

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Terjadi kesalahan sistem saat mencoba login.' };
  }
}

export async function handleLogout() {
  const cookieStore = await cookies();
  cookieStore.delete('bidi_session');
  redirect('/login');
}
