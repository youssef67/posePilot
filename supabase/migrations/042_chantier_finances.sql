-- Ajout des champs financiers manuels sur chantiers
ALTER TABLE chantiers
  ADD COLUMN ajustement_depenses numeric NOT NULL DEFAULT 0,
  ADD COLUMN cout_sous_traitance numeric NOT NULL DEFAULT 0;
