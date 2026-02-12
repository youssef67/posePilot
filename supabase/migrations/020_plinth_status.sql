-- Story 7.2 : Suivi du statut des plinthes

-- =====================
-- ENUM plinth_status
-- =====================
CREATE TYPE public.plinth_status AS ENUM ('non_commandees', 'commandees', 'faconnees');

-- =====================
-- COLONNE plinth_status sur lots
-- =====================
ALTER TABLE public.lots ADD COLUMN plinth_status public.plinth_status NOT NULL DEFAULT 'non_commandees';
