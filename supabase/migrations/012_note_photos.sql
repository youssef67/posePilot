-- Story 4.2 : Photos depuis la caméra sur les notes
-- Colonne photo_url sur notes + bucket Supabase Storage note-photos

-- =====================
-- COLONNE photo_url
-- =====================
ALTER TABLE public.notes ADD COLUMN photo_url TEXT;

-- =====================
-- BUCKET STORAGE note-photos
-- =====================
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-photos', 'note-photos', true)
ON CONFLICT (id) DO NOTHING;

-- =====================
-- RLS POLICIES — storage.objects pour note-photos
-- =====================
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'note-photos');

CREATE POLICY "Authenticated users can view photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'note-photos');

CREATE POLICY "Authenticated users can delete own photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'note-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
