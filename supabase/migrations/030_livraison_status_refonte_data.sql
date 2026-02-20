-- Migration partie 2 : Colonnes, backfill et RLS pour la refonte des statuts

-- 1. Ajouter la colonne retrait (retrait sur place)
ALTER TABLE livraisons
  ADD COLUMN IF NOT EXISTS retrait boolean NOT NULL DEFAULT false;

-- 2. Ajouter la colonne status_history (historique des changements de statut)
ALTER TABLE livraisons
  ADD COLUMN IF NOT EXISTS status_history jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 3. Backfill : initialiser status_history pour les livraisons existantes
UPDATE livraisons
SET status_history = jsonb_build_array(
  jsonb_build_object('status', status::text, 'date', created_at)
)
WHERE status_history = '[]'::jsonb;

-- 4. Migrer les livraisons existantes au statut 'prevu' vers le nouveau sens
-- Ancien 'prevu' = "livraison planifiée avec date" → nouveau = 'livraison_prevue'
UPDATE livraisons
SET status = 'livraison_prevue'
WHERE status = 'prevu'
  AND date_prevue IS NOT NULL;

-- 5. Mettre à jour la politique RLS de suppression pour les nouveaux statuts
DROP POLICY IF EXISTS "Users can delete own livraisons" ON livraisons;
CREATE POLICY "Users can delete own livraisons" ON livraisons
  FOR DELETE
  USING (
    auth.uid() = created_by
    AND status IN ('prevu', 'commande', 'livraison_prevue', 'a_recuperer')
  );
