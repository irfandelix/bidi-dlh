CREATE POLICY "Allow anon insert" ON public.pengawasan_lapangans FOR INSERT TO anon, authenticated WITH CHECK (true);
