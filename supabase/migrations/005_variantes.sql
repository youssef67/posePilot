-- Story 2.2 : Tables variantes et pièces de variante

CREATE TABLE public.variantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id uuid NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
  nom text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_variantes_plot_id ON public.variantes(plot_id);
SELECT public.apply_rls_policy('variantes');

CREATE TABLE public.variante_pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variante_id uuid NOT NULL REFERENCES public.variantes(id) ON DELETE CASCADE,
  nom text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_variante_pieces_variante_id ON public.variante_pieces(variante_id);
SELECT public.apply_rls_policy('variante_pieces');
