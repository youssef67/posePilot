-- Enums PostgreSQL pour posePilot
-- Story 1.2 : types de base référencés par l'architecture

CREATE TYPE chantier_type AS ENUM ('complet', 'leger');
CREATE TYPE task_status AS ENUM ('not_started', 'in_progress', 'done');
CREATE TYPE delivery_status AS ENUM ('commande', 'prevu', 'livre');
