-- Membuat tabel Anggota Bidang
CREATE TABLE IF NOT EXISTS public.anggota_bidang (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  nip TEXT,
  jabatan TEXT,
  hierarki TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memastikan kolom terhubung (relasi) dengan arsip_nota_dinas
-- Catatan: Jika ada data arsip lama, pemohon_id akan bernilai null.
ALTER TABLE public.arsip_nota_dinas
ADD COLUMN IF NOT EXISTS pemohon_id UUID REFERENCES public.anggota_bidang(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS keterangan TEXT;

-- Anda perlu menjalankan ini di menu SQL Editor Supabase
