-- Story 10.5: Livraison mixte — colonne is_depot sur besoins
-- Permet de distinguer les lignes dépôt des lignes chantier au sein d'une même livraison
ALTER TABLE public.besoins ADD COLUMN is_depot boolean NOT NULL DEFAULT false;
