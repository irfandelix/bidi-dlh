-- Tabel wa_staff untuk mendata nomor WA pribadi para Admin dan Katim
CREATE TABLE public.wa_staff (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL UNIQUE, -- Contoh format: 6281234567890@s.whatsapp.net
    role TEXT CHECK (role IN ('admin', 'katim')),
    department TEXT
);

-- Buat tabel wa_chats untuk menyimpan log nomor pengirim
CREATE TABLE public.wa_chats (
    phone_number TEXT PRIMARY KEY,
    name TEXT,
    assigned_staff_id INTEGER REFERENCES public.wa_staff(id), -- Null berarti ditangani Admin/Belum ada
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Buat tabel wa_messages untuk merekam log detail (Arsip)
CREATE TABLE public.wa_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wa_chat_id TEXT REFERENCES public.wa_chats(phone_number) ON DELETE CASCADE,
    sender_type TEXT CHECK (sender_type IN ('public', 'staff', 'system')),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

GRANT ALL ON TABLE public.wa_staff TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.wa_chats TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.wa_messages TO anon, authenticated, service_role;

-- Contoh data (nanti bisa Anda ubah / hapus lewat Dashboard Supabase)
INSERT INTO public.wa_staff (name, phone_number, role, department) VALUES 
('Admin Utama', '6280000000000@s.whatsapp.net', 'admin', 'Frontdesk'),
('Katim 1', '6280000000001@s.whatsapp.net', 'katim', 'Pemeriksaan'),
('Katim 2', '6280000000002@s.whatsapp.net', 'katim', 'Revisi');
