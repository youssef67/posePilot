-- Caractéristiques libres par chantier (clé/valeur)
CREATE TABLE IF NOT EXISTS chantier_caracteristiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  valeur TEXT NOT NULL DEFAULT '',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chantier_caracteristiques_chantier
  ON chantier_caracteristiques(chantier_id);

-- RLS
ALTER TABLE chantier_caracteristiques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read chantier_caracteristiques"
  ON chantier_caracteristiques FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert chantier_caracteristiques"
  ON chantier_caracteristiques FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update chantier_caracteristiques"
  ON chantier_caracteristiques FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete chantier_caracteristiques"
  ON chantier_caracteristiques FOR DELETE
  TO authenticated USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chantier_caracteristiques;
