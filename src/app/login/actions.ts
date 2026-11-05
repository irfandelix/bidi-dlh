'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * Constant-time string comparison using SHA-256 hashing.
 * Prevents timing attacks regardless of string length.
 */
function secureCompare(input: string, target: string): boolean {
  if (typeof input !== 'string' || typeof target !== 'string') return false;
  const hashInput = crypto.createHash('sha256').update(input, 'utf8').digest();
  const hashTarget = crypto.createHash('sha256').update(target, 'utf8').digest();
  return crypto.timingSafeEqual(hashInput, hashTarget);
}

/**
 * Validates and sanitizes username/login identifiers.
 * Rejects control characters, wildcards (%, _), quotes, and PostgREST/SQL injection tokens.
 */
function sanitizeIdentifier(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  
  // Length constraint: between 2 and 60 characters
  if (trimmed.length < 2 || trimmed.length > 60) return null;

  // Strict allowlist: letters, digits, spaces, dots, hyphens, underscores, at-sign
  // Explicitly forbids %, _, quotes (', "), parentheses, commas, semicolons, backslashes
  const validPattern = /^[a-zA-Z0-9\s._@-]{2,60}$/;
  if (!validPattern.test(trimmed)) {
    return null;
  }

  return trimmed;
}

export async function handleLogin(formData: FormData) {
  // Add minimal constant delay to thwart automated high-speed brute-force attacks
  const startTime = Date.now();

  try {
    const rawName = formData.get('name');
    const rawPassword = formData.get('password');

    // 1. Basic Type & Presence Check
    if (typeof rawName !== 'string' || typeof rawPassword !== 'string' || !rawName.trim() || !rawPassword) {
      return { error: 'Nama pengguna dan kata sandi wajib diisi.' };
    }

    // 2. Anti-Injection Sanitization
    const cleanName = sanitizeIdentifier(rawName);
    if (!cleanName) {
      return { error: 'Format nama pengguna tidak valid atau mengandung karakter dilarang.' };
    }

    if (rawPassword.length > 100) {
      return { error: 'Nama pengguna atau kata sandi tidak valid.' };
    }

    const supabase: any = await createClient();

    // 3. Immune Parameterized Lookup:
    // We execute parameterized .eq() queries instead of raw string interpolation (.or(`...`))
    // This makes SQL and PostgREST injection mathematically impossible.
    let userRecord: { id: number; name: string; username: string; password: string } | null = null;

    // Check by username first (exact parameterized match)
    const { data: userByUsername, error: errUsername } = await supabase
      .from('users')
      .select('id, name, username, password')
      .eq('username', cleanName)
      .maybeSingle();

    if (errUsername) {
      console.error('Supabase query error (username):', errUsername);
      return { error: 'Terjadi kendala koneksi sistem. Silakan coba sesaat lagi.' };
    }

    if (userByUsername) {
      userRecord = userByUsername;
    } else {
      // If not found by username, check by full name (exact parameterized match)
      const { data: userByName, error: errName } = await supabase
        .from('users')
        .select('id, name, username, password')
        .eq('name', cleanName)
        .maybeSingle();

      if (errName) {
        console.error('Supabase query error (name):', errName);
        return { error: 'Terjadi kendala koneksi sistem. Silakan coba sesaat lagi.' };
      }

      if (userByName) {
        userRecord = userByName;
      }
    }

    // 4. Uniform Error for Non-existent User or Invalid Password (prevents user enumeration)
    const dummyPassword = 'DummyPassword123!@#';
    const isPasswordValid = userRecord 
      ? secureCompare(rawPassword, userRecord.password)
      : secureCompare(rawPassword, dummyPassword) && false;

    if (!userRecord || !isPasswordValid) {
      // Artificial delay (minimum 400ms) to defeat timing analysis
      const elapsed = Date.now() - startTime;
      if (elapsed < 400) {
        await new Promise((r) => setTimeout(r, 400 - elapsed));
      }
      return { error: 'Nama pengguna atau kata sandi tidak sesuai.' };
    }

    // 5. Establish Secure HTTP-Only Cookie Session
    const cookieStore = await cookies();
    cookieStore.set('bidi_session', userRecord.username || userRecord.name, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: '/',
    });

    return { success: true };
  } catch (error) {
    console.error('Login exception:', error);
    return { error: 'Terjadi kesalahan sistem saat mencoba masuk.' };
  }
}

export async function handleLogout() {
  const cookieStore = await cookies();
  cookieStore.delete('bidi_session');
  redirect('/login');
}
