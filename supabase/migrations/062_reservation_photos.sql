-- Multi-photos pour reservations
-- Table reservation_photos (relation 1-N), migration des donnees existantes, suppression photo_url

-- =====================
-- TABLE reservation_photos
-- =====================
CREATE TABLE public.reservation_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservation_photos_reservation_id ON public.reservation_photos(reservation_id);

-- =====================
-- RLS
-- =====================
SELECT public.apply_rls_policy('reservation_photos');

-- =====================
-- MIGRATION DONNEES EXISTANTES
-- =====================
INSERT INTO public.reservation_photos (reservation_id, photo_url, position)
SELECT id, photo_url, 0 FROM public.reservations WHERE photo_url IS NOT NULL;

-- =====================
-- SUPPRESSION COLONNE photo_url
-- =====================
ALTER TABLE public.reservations DROP COLUMN photo_url;
