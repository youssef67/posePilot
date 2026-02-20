-- Migration partie 1 : Ajouter les nouvelles valeurs à l'enum delivery_status
-- (ALTER TYPE ADD VALUE est non-transactionnel, doit être dans un fichier séparé)
ALTER TYPE delivery_status ADD VALUE IF NOT EXISTS 'livraison_prevue';
ALTER TYPE delivery_status ADD VALUE IF NOT EXISTS 'a_recuperer';
ALTER TYPE delivery_status ADD VALUE IF NOT EXISTS 'receptionne';
ALTER TYPE delivery_status ADD VALUE IF NOT EXISTS 'recupere';
