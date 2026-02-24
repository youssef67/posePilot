-- Story 6.13 : Ajout montant_unitaire sur besoins
-- Permet le suivi du prix unitaire par besoin pour calculer le montant_ttc des livraisons

ALTER TABLE public.besoins ADD COLUMN montant_unitaire numeric DEFAULT NULL;

ALTER TABLE public.besoins ADD CONSTRAINT besoins_montant_unitaire_positive
  CHECK (montant_unitaire IS NULL OR montant_unitaire >= 0);
