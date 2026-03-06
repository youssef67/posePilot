-- Story 8.8 : Suppression du support memos au niveau plot
-- Les memos ne sont plus creables au niveau plot, seulement chantier et etage.
-- La page plot affichera une vue agregee des memos des etages.

-- =====================
-- 1. Supprimer les memos plot existants
-- =====================
DELETE FROM public.memos WHERE plot_id IS NOT NULL;

-- =====================
-- 2. Supprimer les triggers plot memo_count
-- =====================
DROP TRIGGER IF EXISTS trg_plot_memo_count_insert ON public.memos;
DROP TRIGGER IF EXISTS trg_plot_memo_count_delete ON public.memos;

-- =====================
-- 3. Supprimer la fonction trigger
-- =====================
DROP FUNCTION IF EXISTS update_plot_memo_count();

-- =====================
-- 4. Supprimer la colonne memo_count de plots
-- =====================
ALTER TABLE public.plots DROP COLUMN IF EXISTS memo_count;

-- =====================
-- 5. Supprimer la contrainte CHECK existante, retirer plot_id, ajouter nouvelle contrainte
-- =====================
ALTER TABLE public.memos DROP CONSTRAINT IF EXISTS memos_parent_check;

DROP INDEX IF EXISTS idx_memos_plot_id;

ALTER TABLE public.memos DROP COLUMN IF EXISTS plot_id;

ALTER TABLE public.memos ADD CONSTRAINT memos_parent_check CHECK (
  num_nonnulls(chantier_id, etage_id) = 1
);
