-- Add quantite column to besoins table
ALTER TABLE besoins ADD COLUMN quantite integer NOT NULL DEFAULT 1;

-- Ensure quantite is always >= 1
ALTER TABLE besoins ADD CONSTRAINT besoins_quantite_positive CHECK (quantite >= 1);
