-- SKRIP KEAMANAN: MENGAKTIFKAN ROW LEVEL SECURITY (RLS)
-- Jalankan skrip ini di SQL Editor Supabase Anda untuk mengunci database dari akses anonim.

-- 1. Aktifkan RLS pada tabel utama
ALTER TABLE public.pengawasan_lapangans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengaduans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bap_pengawasans ENABLE ROW LEVEL SECURITY;

-- 2. Hapus policy lama (jika ada policy anonim yang mengizinkan akses terbuka)
-- Catatan: Jika ada error 'policy does not exist', abaikan saja.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.pengawasan_lapangans;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.pengaduans;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.bap_pengawasans;

-- 3. Buat Policy khusus Service Role (Backend Next.js)
-- Policy ini hanya mengizinkan modifikasi jika dilakukan menggunakan SUPABASE_SERVICE_ROLE_KEY
CREATE POLICY "Enable all access for service role only" ON public.pengawasan_lapangans 
AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for service role only" ON public.pengaduans 
AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for service role only" ON public.bap_pengawasans 
AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Kesimpulan: 
-- Sekarang akses anonim (termasuk dari SUPABASE_ANON_KEY di HP/Web) tidak akan bisa membaca/menulis data secara langsung ke tabel ini.
-- Segala operasi CRUD harus melalui Next.js Proxy API yang menggunakan Service Role Key.
