ALTER TABLE public.arsip_nota_dinas ADD COLUMN file_url TEXT;

CREATE TABLE IF NOT EXISTS public.pengaduans (
  id BIGSERIAL PRIMARY KEY,
  perihal TEXT NOT NULL,
  tanggal DATE,
  dokumentasi_url TEXT,
  ba_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jika tabel pengaduans sudah ada, tambahkan saja kolomnya:
-- ALTER TABLE public.pengaduans ADD COLUMN dokumentasi_url TEXT;
-- ALTER TABLE public.pengaduans ADD COLUMN ba_url TEXT;
