-- Story 8.3 : Stockage général — Inventaire sans emplacement obligatoire
-- Permet de créer des items d'inventaire au niveau "stockage général" du chantier
-- (sans plot ni étage), pour le matériel en zone de réception/stockage central.

-- =====================
-- ALTER — plot_id et etage_id nullable
-- =====================
ALTER TABLE public.inventaire ALTER COLUMN plot_id DROP NOT NULL;
ALTER TABLE public.inventaire ALTER COLUMN etage_id DROP NOT NULL;

-- Contrainte : les deux null OU les deux non-null (cohérence)
ALTER TABLE public.inventaire
  ADD CONSTRAINT chk_inventaire_location
  CHECK ((plot_id IS NULL) = (etage_id IS NULL));
