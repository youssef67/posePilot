-- Story 8.4 : Badges personnalisés sur les lots
-- Tables : lot_badges, lot_badge_assignments
-- Migration : is_tma → badge "TMA"

-- =====================
-- Table LOT_BADGES (badges définis par chantier)
-- =====================
CREATE TABLE public.lot_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id uuid NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  nom text NOT NULL,
  couleur text NOT NULL DEFAULT 'amber',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chantier_id, nom)
);

CREATE INDEX idx_lot_badges_chantier_id ON public.lot_badges(chantier_id);
SELECT public.apply_rls_policy('lot_badges');

-- =====================
-- Table LOT_BADGE_ASSIGNMENTS (relation N↔N lots/badges)
-- =====================
CREATE TABLE public.lot_badge_assignments (
  lot_id uuid NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.lot_badges(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lot_id, badge_id)
);

CREATE INDEX idx_lot_badge_assignments_badge_id ON public.lot_badge_assignments(badge_id);
SELECT public.apply_rls_policy('lot_badge_assignments');

-- =====================
-- Migration is_tma → badges
-- =====================

-- 1. Créer un badge "TMA" amber par chantier concerné
INSERT INTO public.lot_badges (chantier_id, nom, couleur)
SELECT DISTINCT p.chantier_id, 'TMA', 'amber'
FROM public.lots l
JOIN public.plots p ON l.plot_id = p.id
WHERE l.is_tma = true;

-- 2. Assigner le badge aux lots TMA
INSERT INTO public.lot_badge_assignments (lot_id, badge_id)
SELECT l.id, lb.id
FROM public.lots l
JOIN public.plots p ON l.plot_id = p.id
JOIN public.lot_badges lb ON lb.chantier_id = p.chantier_id AND lb.nom = 'TMA'
WHERE l.is_tma = true;

-- 3. Supprimer la colonne is_tma
ALTER TABLE public.lots DROP COLUMN is_tma;
