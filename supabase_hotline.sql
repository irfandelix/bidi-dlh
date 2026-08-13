-- Skema Database Supabase untuk Sistem Hotline WhatsApp DLH
-- Silakan jalankan script ini di menu SQL Editor pada Dashboard Supabase Anda.

-- 1. Tabel untuk menyimpan daftar Katim dan nomor telepon mereka
CREATE TABLE IF NOT EXISTS public.hotline_katim (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    nomor_wa VARCHAR(50) NOT NULL UNIQUE, -- Format nomor WA (contoh: '628123456789@c.us')
    divisi VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel untuk menyimpan sesi obrolan aktif (Warga <-> Katim)
CREATE TABLE IF NOT EXISTS public.hotline_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor_warga VARCHAR(50) NOT NULL, -- Nomor WA Warga ('628xxxxx@c.us')
    katim_id INTEGER REFERENCES public.hotline_katim(id) ON DELETE SET NULL, 
    status VARCHAR(50) DEFAULT 'open', -- 'open' (sedang ngobrol), 'closed' (sudah selesai)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk mempercepat pencarian sesi aktif berdasarkan nomor warga
CREATE INDEX IF NOT EXISTS idx_active_session_warga ON public.hotline_sessions(nomor_warga) WHERE status = 'open';

-- 3. Tabel untuk menyimpan riwayat chat (Untuk ditampilkan di Dashboard Next.js)
CREATE TABLE IF NOT EXISTS public.hotline_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.hotline_sessions(id) ON DELETE CASCADE,
    pengirim VARCHAR(20) NOT NULL, -- 'WARGA', 'KATIM', 'BOT'
    nomor_pengirim VARCHAR(50) NOT NULL,
    isi_pesan TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aktifkan Realtime untuk memantau pesan baru dari Dashboard Next.js
ALTER PUBLICATION supabase_realtime ADD TABLE public.hotline_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hotline_messages;

-- Insert Data Dummy Awal (Silakan Edit Nomor WA dengan nomor asli Katim)
-- PENTING: Akhiran @c.us wajib digunakan oleh library whatsapp-web.js
INSERT INTO public.hotline_katim (nama, nomor_wa, divisi) VALUES
('Katim 1 (Kebersihan)', '6281111111111@c.us', 'Tim Pengelolaan Sampah'),
('Katim 2 (Limbah)', '6282222222222@c.us', 'Tim Pengendalian Limbah'),
('Katim 3 (Perizinan)', '6283333333333@c.us', 'Tim Perizinan')
ON CONFLICT (nomor_wa) DO NOTHING;
