-- Story 2.3 : Documents par défaut dans les variantes

CREATE TABLE public.variante_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variante_id uuid NOT NULL REFERENCES public.variantes(id) ON DELETE CASCADE,
  nom text NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_variante_documents_variante_id ON public.variante_documents(variante_id);

CREATE UNIQUE INDEX idx_variante_documents_unique_nom ON public.variante_documents(variante_id, lower(nom));

SELECT public.apply_rls_policy('variante_documents');
