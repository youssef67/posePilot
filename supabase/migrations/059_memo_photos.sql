-- Story 8.7 : Multi-photos pour memos
-- Table memo_photos (relation 1-N), migration des donnees existantes, suppression photo_url

-- =====================
-- TABLE memo_photos
-- =====================
CREATE TABLE public.memo_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memo_id uuid NOT NULL REFERENCES public.memos(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_memo_photos_memo_id ON public.memo_photos(memo_id);

-- =====================
-- RLS
-- =====================
SELECT public.apply_rls_policy('memo_photos');

-- =====================
-- MIGRATION DONNEES EXISTANTES
-- =====================
INSERT INTO public.memo_photos (memo_id, photo_url, position)
SELECT id, photo_url, 0 FROM public.memos WHERE photo_url IS NOT NULL;

-- =====================
-- SUPPRESSION COLONNE photo_url
-- =====================
ALTER TABLE public.memos DROP COLUMN photo_url;
