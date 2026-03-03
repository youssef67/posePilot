-- Story 11.2 : Réception matériaux par lot
-- Booléen simple pour marquer qu'un lot a ses matériaux sur site

ALTER TABLE public.lots ADD COLUMN materiaux_recus BOOLEAN NOT NULL DEFAULT false;
