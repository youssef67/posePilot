-- Fix PGRST203 : deux signatures `add_piece_to_lot` coexistent en base
-- (créée en 009 avec 2 params, puis en 043/056 avec 3 params via CREATE OR REPLACE,
-- qui crée une nouvelle fonction au lieu de remplacer car la signature diffère).
-- PostgREST ne peut plus choisir → on supprime l'ancienne signature à 2 params.

DROP FUNCTION IF EXISTS public.add_piece_to_lot(uuid, text);
