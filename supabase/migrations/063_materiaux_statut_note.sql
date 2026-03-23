-- Story 11.8: Réception matériaux — statut partiel et notes
-- Remplace materiaux_recus (boolean) par materiaux_statut (text enum) + materiaux_note (text)

-- Ajout des nouvelles colonnes
ALTER TABLE lots ADD COLUMN materiaux_statut text NOT NULL DEFAULT 'non_recu';
ALTER TABLE lots ADD COLUMN materiaux_note text;

-- Migration des données existantes
UPDATE lots SET materiaux_statut = 'recu' WHERE materiaux_recus = true;

-- Suppression de l'ancienne colonne
ALTER TABLE lots DROP COLUMN materiaux_recus;

-- Contrainte de validation
ALTER TABLE lots ADD CONSTRAINT lots_materiaux_statut_check
  CHECK (materiaux_statut IN ('non_recu', 'partiel', 'recu'));
