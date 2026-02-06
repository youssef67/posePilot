-- RLS de base pour posePilot
-- Fonction réutilisable : applique RLS + policy "authenticated = accès total" sur une table
-- Story 1.2 : base de sécurité pour toutes les tables futures

-- Fonction helper : active RLS et crée la policy standard sur une table donnée
-- Usage dans les migrations futures : SELECT public.apply_rls_policy('chantiers');
CREATE OR REPLACE FUNCTION public.apply_rls_policy(target_table text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_table);
  EXECUTE format(
    'CREATE POLICY "Authenticated users have full access" ON public.%I FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)',
    target_table
  );
END;
$$;
