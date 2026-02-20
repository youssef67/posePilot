ALTER TABLE public.livraisons
  ADD COLUMN parent_id uuid REFERENCES public.livraisons(id) ON DELETE SET NULL;
CREATE INDEX idx_livraisons_parent_id ON public.livraisons(parent_id);
