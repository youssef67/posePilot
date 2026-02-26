-- Story 10.4 : Livraison vers le dépôt — colonne destination

-- =====================
-- ENUM — Destination de livraison
-- =====================
CREATE TYPE public.livraison_destination AS ENUM ('chantier', 'depot');

-- =====================
-- ALTER — Ajout colonne destination sur livraisons
-- =====================
ALTER TABLE public.livraisons
  ADD COLUMN destination public.livraison_destination NOT NULL DEFAULT 'chantier';

-- Toutes les livraisons existantes auront destination = 'chantier' (valeur par défaut)

-- =====================
-- ALTER — besoins.chantier_id nullable pour livraisons dépôt
-- =====================
ALTER TABLE public.besoins ALTER COLUMN chantier_id DROP NOT NULL;
