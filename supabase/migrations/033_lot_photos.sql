-- Galerie photos autonome pour les lots (indépendante des notes)
-- Bucket réutilisé : note-photos (public, déjà configuré)

CREATE TABLE public.lot_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requêtes par lot
CREATE INDEX idx_lot_photos_lot_id ON public.lot_photos(lot_id);

-- RLS
ALTER TABLE public.lot_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lot photos"
  ON public.lot_photos FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert lot photos"
  ON public.lot_photos FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete own lot photos"
  ON public.lot_photos FOR DELETE TO authenticated
  USING (created_by = auth.uid());
