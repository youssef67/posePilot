# Story 7.1: Saisie et agrégation des métrés

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux saisir les m² et mètres linéaires plinthes par pièce et voir les totaux agrégés,
Afin que je connaisse les surfaces exactes pour anticiper les commandes de matériel.

## Acceptance Criteria

1. **Given** l'utilisateur est sur l'écran d'une pièce **When** il consulte les champs de métrés **Then** deux champs optionnels sont disponibles : m² (surface) et ML plinthes (mètres linéaires)

2. **Given** les champs de métrés sont vides **When** l'utilisateur ne les remplit pas **Then** aucun blocage, aucune alerte — les champs restent optionnels et ne freinent jamais le workflow

3. **Given** l'utilisateur saisit les m² d'une pièce (ex: 12.5) **When** il valide **Then** la valeur est enregistrée et affichée sur l'écran pièce

4. **Given** l'utilisateur saisit les ML plinthes d'une pièce (ex: 8.2) **When** il valide **Then** la valeur est enregistrée et affichée sur l'écran pièce

5. **Given** des métrés sont saisis sur plusieurs pièces d'un lot **When** l'utilisateur consulte le lot **Then** les m² et ML sont agrégés automatiquement au niveau lot (somme des pièces)

6. **Given** des métrés sont agrégés au niveau lot **When** l'utilisateur consulte le plot **Then** les m² et ML sont agrégés automatiquement au niveau plot (somme des lots)

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : colonnes métrés + triggers agrégation (AC: #3, #4, #5, #6)
  - [x] 1.1 Créer `supabase/migrations/019_metrage.sql`
  - [x] 1.2 Ajouter `metrage_m2 NUMERIC(10,2)` et `metrage_ml NUMERIC(10,2)` à `pieces` (nullable, optionnel)
  - [x] 1.3 Ajouter `metrage_m2_total NUMERIC(10,2) DEFAULT 0` et `metrage_ml_total NUMERIC(10,2) DEFAULT 0` à `lots`, `etages`, `plots`
  - [x] 1.4 Créer trigger function `update_lot_metrage()` — SUM depuis pieces, suivant pattern de `update_lot_progress()` dans 010_aggregation_triggers.sql
  - [x] 1.5 Créer trigger function `update_etage_metrage()` — SUM depuis lots
  - [x] 1.6 Créer trigger function `update_plot_metrage()` — SUM depuis etages
  - [x] 1.7 Créer triggers AFTER INSERT/UPDATE OF metrage_m2, metrage_ml/DELETE sur pieces, lots, etages
  - [x] 1.8 Backfill bottom-up pour les données existantes (lots ← pieces, etages ← lots, plots ← etages)

- [x] Task 2 — Types TypeScript : colonnes métrés (AC: #1)
  - [x] 2.1 Mettre à jour `pieces` dans `src/types/database.ts` : ajouter `metrage_m2: number | null` et `metrage_ml: number | null` dans Row, Insert, Update
  - [x] 2.2 Mettre à jour `lots` dans `src/types/database.ts` : ajouter `metrage_m2_total: number` et `metrage_ml_total: number` dans Row
  - [x] 2.3 Mettre à jour `etages` dans `src/types/database.ts` : ajouter `metrage_m2_total: number` et `metrage_ml_total: number` dans Row
  - [x] 2.4 Mettre à jour `plots` dans `src/types/database.ts` : ajouter `metrage_m2_total: number` et `metrage_ml_total: number` dans Row

- [x] Task 3 — Mutation hook : useUpdatePieceMetrage (AC: #3, #4)
  - [x] 3.1 Créer `src/lib/mutations/useUpdatePieceMetrage.ts`
  - [x] 3.2 mutationFn : `supabase.from('pieces').update({ metrage_m2, metrage_ml }).eq('id', pieceId).select().single()`
  - [x] 3.3 onMutate : optimistic update sur cache `['pieces', lotId]` — mettre à jour la pièce ciblée
  - [x] 3.4 onError : rollback + `toast.error('Impossible de sauvegarder les métrés')`
  - [x] 3.5 onSettled : `invalidateQueries(['pieces', lotId])` + `invalidateQueries(['lots', plotId])`
  - [x] 3.6 Créer `src/lib/mutations/useUpdatePieceMetrage.test.ts`

- [x] Task 4 — UI Pièce : champs de saisie métrés (AC: #1, #2, #3, #4)
  - [x] 4.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/$pieceId.tsx`
  - [x] 4.2 Ajouter une section "Métrés" entre BreadcrumbNav et la section Tâches
  - [x] 4.3 Deux champs Input number : "Surface (m²)" et "Plinthes (ML)" avec `inputMode="decimal"`
  - [x] 4.4 Valeurs pré-remplies depuis `piece.metrage_m2` et `piece.metrage_ml` (null → vide)
  - [x] 4.5 Sauvegarde sur blur ou Enter — appeler `useUpdatePieceMetrage`
  - [x] 4.6 Feedback : toast.success discret après sauvegarde réussie (pas si valeur inchangée)
  - [x] 4.7 Validation : nombre >= 0, max 2 décimales — message d'erreur simple sous le champ si invalide
  - [x] 4.8 Style : labels fixes au-dessus, inline layout (2 champs côte à côte), touch target 48px minimum
  - [x] 4.9 Mettre à jour les tests existants de la page pièce

- [x] Task 5 — Affichage agrégé sur les cartes de lots (AC: #5)
  - [x] 5.1 Modifier `StatusCard.tsx` ou la vue lot dans la route étage pour afficher m²/ML totaux sous le compteur progress quand > 0
  - [x] 5.2 Format : "12.5 m² · 8.2 ML" en texte secondaire gris
  - [x] 5.3 Masquer si les deux valeurs sont 0 ou null (jamais de données trompeuses)
  - [x] 5.4 Mettre à jour les tests

- [x] Task 6 — Affichage agrégé sur les cartes de plots (AC: #6)
  - [x] 6.1 Modifier la vue plot dans la route chantier pour afficher m²/ML totaux quand > 0
  - [x] 6.2 Format identique à Task 5 : "125.0 m² · 82.0 ML" en texte secondaire gris
  - [x] 6.3 Masquer si les deux valeurs sont 0
  - [x] 6.4 Mettre à jour les tests

- [x] Task 7 — Tests de régression (AC: #1-6)
  - [x] 7.1 `npm run test` — tous les tests existants + nouveaux passent
  - [x] 7.2 `npm run lint` — 0 nouvelles erreurs
  - [x] 7.3 `npm run build` — 0 nouvelles erreurs tsc

## Dev Notes

### Vue d'ensemble — Stratégie d'implémentation

Cette story est la **première de l'Epic 7** et implémente la **saisie et agrégation des métrés** (FR57, FR58, FR59). Elle étend le modèle de données existant en ajoutant des colonnes numériques optionnelles aux pièces, avec agrégation en cascade via triggers PostgreSQL — le même pattern éprouvé que `progress_done/progress_total` (migration 010).

**Scope précis :**
- Colonnes `metrage_m2` et `metrage_ml` sur `pieces` (nullable, optionnelles)
- Colonnes agrégées `metrage_m2_total` et `metrage_ml_total` sur `lots`, `etages`, `plots`
- Triggers cascade pour agrégation automatique (pieces → lots → etages → plots)
- UI de saisie sur l'écran pièce (2 champs numériques)
- Affichage des totaux agrégés sur les cartes de lots et plots

**Hors scope (Story 7.2 et 7.3) :**
- Suivi du statut des plinthes commandées/façonnées (Story 7.2 — FR60)
- Indicateurs intelligents : lots prêts à carreler, croisement inventaire/métrés (Story 7.3 — FR61-FR64)

**Décision architecturale — Agrégation par triggers SQL, pas côté client :**
Contrairement à l'inventaire (Story 6.5) qui agrège côté client car il s'agit d'agrégation multi-lignes par designation, les métrés sont un **champ numérique simple par pièce** avec une **somme directe** par parent. C'est le cas d'usage idéal pour les triggers SQL cascade, exactement comme `progress_done/progress_total`.

**Décision — Pas d'agrégation au niveau chantier :**
Le PRD (FR59) dit "agrège par lot et par plot". On n'ajoute PAS de colonnes métrés à la table `chantiers` — ce n'est pas demandé et le total m² d'un chantier entier a peu de sens opérationnel (les commandes de matériel se font par plot/étage). Si besoin futur, il suffira d'ajouter un trigger étage → chantier.

### Ce qui existe déjà (à réutiliser, NE PAS recréer)

| Élément | Fichier | Notes |
|---------|---------|-------|
| Pattern trigger agrégation | `supabase/migrations/010_aggregation_triggers.sql` | Pattern exact à reproduire : `update_lot_progress()`, `update_etage_progress()`, etc. |
| `usePieces(lotId)` | `src/lib/queries/usePieces.ts` | `.select('*, taches(*)')` — les colonnes `metrage_m2/ml` seront incluses automatiquement par `*` |
| `useLots(plotId)` | `src/lib/queries/useLots.ts` | `.select('*, etages(nom), variantes(nom), pieces(count)')` — `metrage_m2_total/ml_total` inclus par `*` |
| `usePlots(chantierId)` | `src/lib/queries/usePlots.ts` | Idem — `metrage_m2_total/ml_total` inclus par `*` |
| `useUpdateTaskStatus` | `src/lib/mutations/useUpdateTaskStatus.ts` | Pattern de référence pour mutation optimiste sur la pièce |
| `StatusCard` | `src/components/StatusCard.tsx` | Carte avec barre statut — ajouter affichage métrés |
| `Input` | `src/components/ui/input.tsx` | Champ de saisie shadcn — pour les inputs métrés |
| `toast` | `sonner` via `src/components/ui/sonner.tsx` | Feedback sauvegarde |
| Écran pièce | `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/$pieceId.tsx` | Écran cible — ajouter section Métrés |
| `PieceWithTaches` | `src/lib/queries/usePieces.ts` | Type existant — enrichi par les nouvelles colonnes via `*` |
| `LotWithRelations` | `src/lib/queries/useLots.ts` | Type existant — enrichi par les nouvelles colonnes via `*` |

### Migration SQL : 019_metrage.sql

```sql
-- Story 7.1 : Saisie et agrégation des métrés (m² et ML plinthes)

-- =====================
-- COLONNES MÉTRÉS — pieces (source)
-- =====================
ALTER TABLE public.pieces ADD COLUMN metrage_m2 NUMERIC(10,2);
ALTER TABLE public.pieces ADD COLUMN metrage_ml NUMERIC(10,2);

-- =====================
-- COLONNES AGRÉGÉES — lots, etages, plots
-- =====================
ALTER TABLE public.lots ADD COLUMN metrage_m2_total NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.lots ADD COLUMN metrage_ml_total NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.etages ADD COLUMN metrage_m2_total NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.etages ADD COLUMN metrage_ml_total NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.plots ADD COLUMN metrage_m2_total NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.plots ADD COLUMN metrage_ml_total NUMERIC(10,2) NOT NULL DEFAULT 0;

-- =====================
-- TRIGGER FUNCTION Level 1 : pieces → lots
-- =====================
CREATE OR REPLACE FUNCTION public.update_lot_metrage()
RETURNS TRIGGER AS $$
DECLARE
  target_lot_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_lot_id := OLD.lot_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.lot_id IS DISTINCT FROM NEW.lot_id THEN
    -- If lot_id changed, update both old and new parent
    UPDATE public.lots SET
      metrage_m2_total = COALESCE((SELECT SUM(COALESCE(metrage_m2, 0)) FROM public.pieces WHERE lot_id = OLD.lot_id), 0),
      metrage_ml_total = COALESCE((SELECT SUM(COALESCE(metrage_ml, 0)) FROM public.pieces WHERE lot_id = OLD.lot_id), 0)
    WHERE id = OLD.lot_id;
    target_lot_id := NEW.lot_id;
  ELSE
    target_lot_id := COALESCE(NEW.lot_id, OLD.lot_id);
  END IF;

  UPDATE public.lots SET
    metrage_m2_total = COALESCE((SELECT SUM(COALESCE(metrage_m2, 0)) FROM public.pieces WHERE lot_id = target_lot_id), 0),
    metrage_ml_total = COALESCE((SELECT SUM(COALESCE(metrage_ml, 0)) FROM public.pieces WHERE lot_id = target_lot_id), 0)
  WHERE id = target_lot_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_lot_metrage
  AFTER INSERT OR UPDATE OF metrage_m2, metrage_ml OR DELETE
  ON public.pieces
  FOR EACH ROW EXECUTE FUNCTION public.update_lot_metrage();

-- =====================
-- TRIGGER FUNCTION Level 2 : lots → etages
-- =====================
CREATE OR REPLACE FUNCTION public.update_etage_metrage()
RETURNS TRIGGER AS $$
DECLARE
  target_etage_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_etage_id := OLD.etage_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.etage_id IS DISTINCT FROM NEW.etage_id THEN
    UPDATE public.etages SET
      metrage_m2_total = COALESCE((SELECT SUM(COALESCE(metrage_m2_total, 0)) FROM public.lots WHERE etage_id = OLD.etage_id), 0),
      metrage_ml_total = COALESCE((SELECT SUM(COALESCE(metrage_ml_total, 0)) FROM public.lots WHERE etage_id = OLD.etage_id), 0)
    WHERE id = OLD.etage_id;
    target_etage_id := NEW.etage_id;
  ELSE
    target_etage_id := COALESCE(NEW.etage_id, OLD.etage_id);
  END IF;

  UPDATE public.etages SET
    metrage_m2_total = COALESCE((SELECT SUM(COALESCE(metrage_m2_total, 0)) FROM public.lots WHERE etage_id = target_etage_id), 0),
    metrage_ml_total = COALESCE((SELECT SUM(COALESCE(metrage_ml_total, 0)) FROM public.lots WHERE etage_id = target_etage_id), 0)
  WHERE id = target_etage_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_etage_metrage
  AFTER INSERT OR UPDATE OF metrage_m2_total, metrage_ml_total OR DELETE
  ON public.lots
  FOR EACH ROW EXECUTE FUNCTION public.update_etage_metrage();

-- =====================
-- TRIGGER FUNCTION Level 3 : etages → plots
-- =====================
CREATE OR REPLACE FUNCTION public.update_plot_metrage()
RETURNS TRIGGER AS $$
DECLARE
  target_plot_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_plot_id := OLD.plot_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.plot_id IS DISTINCT FROM NEW.plot_id THEN
    UPDATE public.plots SET
      metrage_m2_total = COALESCE((SELECT SUM(COALESCE(metrage_m2_total, 0)) FROM public.etages WHERE plot_id = OLD.plot_id), 0),
      metrage_ml_total = COALESCE((SELECT SUM(COALESCE(metrage_ml_total, 0)) FROM public.etages WHERE plot_id = OLD.plot_id), 0)
    WHERE id = OLD.plot_id;
    target_plot_id := NEW.plot_id;
  ELSE
    target_plot_id := COALESCE(NEW.plot_id, OLD.plot_id);
  END IF;

  UPDATE public.plots SET
    metrage_m2_total = COALESCE((SELECT SUM(COALESCE(metrage_m2_total, 0)) FROM public.etages WHERE plot_id = target_plot_id), 0),
    metrage_ml_total = COALESCE((SELECT SUM(COALESCE(metrage_ml_total, 0)) FROM public.etages WHERE plot_id = target_plot_id), 0)
  WHERE id = target_plot_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_plot_metrage
  AFTER INSERT OR UPDATE OF metrage_m2_total, metrage_ml_total OR DELETE
  ON public.etages
  FOR EACH ROW EXECUTE FUNCTION public.update_plot_metrage();

-- =====================
-- BACKFILL bottom-up
-- =====================
UPDATE public.lots l SET
  metrage_m2_total = COALESCE((SELECT SUM(COALESCE(metrage_m2, 0)) FROM public.pieces WHERE lot_id = l.id), 0),
  metrage_ml_total = COALESCE((SELECT SUM(COALESCE(metrage_ml, 0)) FROM public.pieces WHERE lot_id = l.id), 0);

UPDATE public.etages e SET
  metrage_m2_total = COALESCE((SELECT SUM(COALESCE(metrage_m2_total, 0)) FROM public.lots WHERE etage_id = e.id), 0),
  metrage_ml_total = COALESCE((SELECT SUM(COALESCE(metrage_ml_total, 0)) FROM public.lots WHERE etage_id = e.id), 0);

UPDATE public.plots p SET
  metrage_m2_total = COALESCE((SELECT SUM(COALESCE(metrage_m2_total, 0)) FROM public.etages WHERE plot_id = p.id), 0),
  metrage_ml_total = COALESCE((SELECT SUM(COALESCE(metrage_ml_total, 0)) FROM public.etages WHERE plot_id = p.id), 0);
```

**Points clés migration :**
- `pieces.metrage_m2` et `pieces.metrage_ml` sont **nullable** — jamais bloquants (FR57, FR58)
- `lots/etages/plots.*_total` sont **NOT NULL DEFAULT 0** — toujours un nombre valide pour l'affichage
- Triggers sur `INSERT OR UPDATE OF metrage_m2, metrage_ml OR DELETE` — ne se déclenchent pas sur les updates de `progress_done/total` (colonnes différentes)
- Cascade 3 niveaux : pieces → lots → etages → plots (pas chantiers, hors scope FR59)
- `NUMERIC(10,2)` : précision suffisante (jusqu'à 99 999 999.99 m²), 2 décimales pour les mesures terrain
- Pattern de triggers identique à `010_aggregation_triggers.sql` — gère UPDATE avec changement de parent, DELETE, INSERT

### Types TypeScript — Modifications

```typescript
// Dans src/types/database.ts — mise à jour pieces Row/Insert/Update
pieces: {
  Row: {
    // ... colonnes existantes (id, lot_id, nom, created_at, progress_done, progress_total)
    metrage_m2: number | null    // ← NOUVEAU
    metrage_ml: number | null    // ← NOUVEAU
  }
  Insert: {
    // ... champs existants
    metrage_m2?: number | null   // ← NOUVEAU (optionnel)
    metrage_ml?: number | null   // ← NOUVEAU (optionnel)
  }
  Update: {
    // ... champs existants
    metrage_m2?: number | null   // ← NOUVEAU
    metrage_ml?: number | null   // ← NOUVEAU
  }
  Relationships: []
}

// Dans src/types/database.ts — mise à jour lots Row
lots: {
  Row: {
    // ... colonnes existantes
    metrage_m2_total: number    // ← NOUVEAU
    metrage_ml_total: number    // ← NOUVEAU
  }
  // Insert et Update : ajouter en optionnel si nécessaire
  Relationships: []
}

// Même ajout pour etages et plots Row
```

**IMPORTANT** : inclure `Relationships: []` sur chaque table pour que supabase-js v2 infère les types Row via `.select('*')`. Voir MEMORY.md.

### Mutation : useUpdatePieceMetrage

```typescript
// src/lib/mutations/useUpdatePieceMetrage.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { PieceWithTaches } from '@/lib/queries/usePieces'

interface UpdatePieceMetrageParams {
  pieceId: string
  lotId: string
  plotId: string
  metrage_m2: number | null
  metrage_ml: number | null
}

export function useUpdatePieceMetrage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ pieceId, metrage_m2, metrage_ml }: UpdatePieceMetrageParams) => {
      const { data, error } = await supabase
        .from('pieces')
        .update({ metrage_m2, metrage_ml })
        .eq('id', pieceId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ pieceId, lotId, metrage_m2, metrage_ml }) => {
      await queryClient.cancelQueries({ queryKey: ['pieces', lotId] })
      const previous = queryClient.getQueryData<PieceWithTaches[]>(['pieces', lotId])
      queryClient.setQueryData<PieceWithTaches[]>(
        ['pieces', lotId],
        (old) => (old ?? []).map((p) =>
          p.id === pieceId ? { ...p, metrage_m2, metrage_ml } : p,
        ),
      )
      return { previous }
    },
    onError: (_err, { lotId }, context) => {
      queryClient.setQueryData(['pieces', lotId], context?.previous)
      toast.error('Impossible de sauvegarder les métrés')
    },
    onSettled: (_data, _err, { lotId, plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['pieces', lotId] })
      // Les triggers SQL cascade ont mis à jour lots/etages/plots
      queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
    },
  })
}
```

**Points clés :**
- `plotId` passé en param pour invalider le cache lots (agrégation trigger mis à jour côté serveur)
- Mutation optimiste sur `pieces` seulement — les totaux lot/plot seront rafraîchis par invalidation
- Les subscriptions realtime sur `lots`/`plots` propagent les changements aux autres utilisateurs

### UI Pièce — Placement et design des champs métrés

**Layout actuel de l'écran pièce :**
```
[← Retour]  Nom Pièce
<BreadcrumbNav />
                        ← INSERTION ICI
Tâches (X)
[Y fait, Z en cours]
[Tâche 1]    [TapCycle]
[Tâche 2]    [TapCycle]
...

Notes
<NotesList />

<PaginationDots />
<Fab />
```

**Section Métrés à insérer :**
```
┌─────────────────────────────────────────────────┐
│ Métrés                                          │
│ ┌──────────────────┐  ┌──────────────────┐      │
│ │ Surface (m²)     │  │ Plinthes (ML)    │      │
│ │ [___12.5____]    │  │ [___8.2_____]    │      │
│ └──────────────────┘  └──────────────────┘      │
└─────────────────────────────────────────────────┘
```

**Comportement :**
- 2 champs `Input` côte à côte (grid 2 colonnes)
- `inputMode="decimal"` — clavier numérique avec virgule sur mobile
- `type="number"` avec `step="0.01"` pour la précision 2 décimales
- Labels fixes au-dessus ("Surface (m²)" et "Plinthes (ML)")
- Sauvegarde sur `onBlur` ou `Enter` — pas de bouton "Sauvegarder" séparé
- Si la valeur est identique à l'existante, ne pas envoyer de mutation
- Champs vides → `null` en base (pas 0)
- Toast discret "Métrés sauvegardés" uniquement si la valeur change

**Style :**
- `text-sm text-muted-foreground` pour le titre "Métrés"
- `h-10` pour les inputs (40px > 48px avec padding)
- `gap-3` entre les deux champs
- Séparation visuelle légère avec les tâches en dessous (pas de divider lourd)

### Affichage agrégé sur les cartes

**Sur les cartes de lots (vue étage) :**
```
┌─────────────────────────────────────────┐
│ ▎ Lot 203                     3/6      │ ← Progress existant
│ ▎ Type A · TMA               🔴 📄     │ ← Badges existants
│ ▎ 12.5 m² · 8.2 ML                    │ ← NOUVEAU (si > 0)
└─────────────────────────────────────────┘
```

**Règles d'affichage :**
- Afficher uniquement si `metrage_m2_total > 0` OU `metrage_ml_total > 0`
- Si un seul est > 0, afficher uniquement celui-ci (ex: "12.5 m²" sans ML)
- Format : nombre avec max 1 décimale si entier non exact (12.5), pas de trailing zeros (12.0 → 12)
- Style : `text-xs text-muted-foreground` — info secondaire, non intrusive

**Sur les cartes de plots (vue chantier) :**
- Même pattern : "125.0 m² · 82.0 ML" sous les infos existantes
- Même règles de masquage si 0

### Project Structure Notes

**Nouveaux fichiers (4+) :**
- `supabase/migrations/019_metrage.sql`
- `src/lib/mutations/useUpdatePieceMetrage.ts`
- `src/lib/mutations/useUpdatePieceMetrage.test.ts`

**Fichiers modifiés (5+) :**
- `src/types/database.ts` — ajout colonnes métrés dans pieces, lots, etages, plots
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/$pieceId.tsx` — section Métrés
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId.tsx` — affichage m²/ML sur cartes lots (si c'est ici)
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — affichage m²/ML sur cartes plots (si c'est ici)
- Tests associés à mettre à jour

**Alignement structure :**
- Mutation dans `lib/mutations/` — convention respectée
- Pas de nouveau query hook — les colonnes sont déjà incluses dans le `select('*')` des queries existantes
- Pas de subscription spécifique — les métrés changent rarement, l'invalidation via `onSettled` suffit. Les subscriptions realtime existantes sur `lots` et `plots` propagent les changements d'agrégation.

### Prérequis et dépendances

- **Migration SQL** : `019_metrage.sql` — doit être créée (ALTER TABLE + triggers)
- **Aucune dépendance npm** à ajouter — tout est dans le projet
- **Stories 1-6** : toutes `done` — patterns établis, triggers d'agrégation en place
- **Composants shadcn** : Input déjà installé
- **Pas de nouveau composant custom** — modification de composants existants uniquement

### Risques et points d'attention

1. **NUMERIC vs FLOAT en PostgreSQL** : Utiliser `NUMERIC(10,2)` et non `REAL`/`FLOAT`. Les types flottants ont des problèmes de précision (12.5 peut devenir 12.4999...). NUMERIC est exact pour les valeurs financières/mesures.

2. **Supabase JS retourne les NUMERIC comme number** : Supabase convertit automatiquement les `NUMERIC` PostgreSQL en `number` JavaScript. Pas de conversion manuelle nécessaire. Attention : pour les très grandes valeurs, il peut y avoir une perte de précision, mais avec `NUMERIC(10,2)` et des métrés de pièce (<1000 m²), aucun risque.

3. **Triggers existants de progress** : Les nouveaux triggers de métrage opèrent sur des **colonnes différentes** (`metrage_m2/ml`) que les triggers de progress (`progress_done/total`). Aucun conflit. Les triggers `UPDATE OF metrage_m2, metrage_ml` ne déclenchent pas les triggers `UPDATE OF progress_done, progress_total`.

4. **Performance triggers cascade** : Avec le nombre de pièces/lots du projet (< 500), la cascade de 3 niveaux de triggers est instantanée. Pas d'optimisation nécessaire.

5. **Input number sur mobile** : `inputMode="decimal"` ouvre le clavier numérique avec le point décimal sur Android. Sur iOS, `type="number"` + `inputMode="decimal"` donne un clavier avec virgule. Le séparateur décimal peut être `.` ou `,` selon la locale — utiliser `parseFloat()` en JS qui gère les deux via un nettoyage préalable (remplacer `,` par `.`).

6. **Sauvegarde onBlur** : Quand l'utilisateur tape un nombre et quitte le champ (blur), la mutation est envoyée. Si l'utilisateur navigue (swipe) avant le blur, le blur est déclenché automatiquement par le navigateur. Pas de perte de données.

7. **Pre-existing issues** : Mêmes que stories précédentes — 16 test failures pré-existants (pwa-config 5, pwa-html 5, hasPointerCapture 6), lint error ThemeProvider.tsx:64, erreurs TS pré-existantes database.ts.

### Learnings des stories précédentes (relevants)

- **Aggregation triggers (010)** : Pattern cascade éprouvé sur 5 niveaux pour progress. Reproduire exactement pour métrés sur 3 niveaux (pieces → lots → etages → plots).
- **useUpdateTaskStatus (story 3.2)** : Pattern mutation optimiste de référence pour la pièce. Le `useUpdatePieceMetrage` suit le même pattern.
- **StatusCard (story 3.3)** : Carte avec barre latérale + compteur. Ajouter métrés comme info secondaire.
- **Types database.ts** : TOUJOURS inclure `Relationships: []` (MEMORY.md).
- **Cast pattern** : `data as unknown as Type[]` pour contourner les types Supabase quand les jointures ne sont pas typées.
- **inputMode="numeric"** utilisé dans LotSearchBar — pour les métrés utiliser `inputMode="decimal"` car les valeurs ont des décimales.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 7.1, Epic 7, FR57-FR59]
- [Source: _bmad-output/planning-artifacts/prd.md — FR57 m² optionnel jamais bloquant, FR58 ML plinthes optionnel, FR59 agrégation par lot et plot]
- [Source: _bmad-output/planning-artifacts/architecture.md — §Data Architecture aggregation triggers, §Frontend patterns, §Naming patterns snake_case DB]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — §Form patterns max 3 champs, §Labels fixes au-dessus, §Validation au submit/blur uniquement]
- [Source: _bmad-output/implementation-artifacts/6-5-gestion-d-inventaire-avec-localisation.md — Learnings mutations, subscriptions, types avec Relationships: []]
- [Source: supabase/migrations/010_aggregation_triggers.sql — Pattern complet triggers cascade 5 niveaux]
- [Source: src/lib/mutations/useUpdateTaskStatus.ts — Pattern mutation optimiste référence]
- [Source: src/lib/queries/usePieces.ts — Query pièces avec select('*')]
- [Source: src/lib/queries/useLots.ts — Query lots avec colonnes agrégées]
- [Source: src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/$pieceId.tsx — Écran pièce actuel, layout cible]
- [Source: src/components/StatusCard.tsx — Carte avec barre statut, affichage info secondaire]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun problème de debug rencontré.

### Completion Notes List

- **Task 1** : Migration `019_metrage.sql` créée — ALTER TABLE pieces/lots/etages/plots, 3 trigger functions cascade (pieces→lots→etages→plots), backfill bottom-up. Pattern identique à 010_aggregation_triggers.sql.
- **Task 2** : `database.ts` enrichi avec types complets pour pieces (Row/Insert/Update), lots, etages, plots incluant colonnes métrés. Views/Functions/CompositeTypes corrigés vers `{ [_ in never]: never }` (per MEMORY.md). Index signature ajouté pour backward compat des tables non-typées.
- **Task 3** : `useUpdatePieceMetrage` mutation hook — optimistic update sur cache pieces, rollback on error, invalidation pieces+lots. 5 tests unitaires (params, optimistic, null values, rollback, invalidation).
- **Task 4** : Section "Métrés" ajoutée sur l'écran pièce entre BreadcrumbNav et Tâches. 2 inputs numériques côte à côte (grid-cols-2), inputMode=decimal, sauvegarde onBlur/Enter, validation >= 0 max 2 décimales, toast success. 5 nouveaux tests + 19 existants mis à jour (metrage_m2/ml dans mock data).
- **Task 5** : `StatusCard` enrichi avec prop `secondaryInfo` (text-xs text-muted-foreground). Affichage métrés agrégés sur cartes lots dans vue étage via `formatMetrage()`. 3 nouveaux tests StatusCard + 2 tests etage index.
- **Task 6** : `PlotRow` enrichi avec `metrage_m2_total`/`metrage_ml_total`. Affichage métrés agrégés sur cartes plots dans vue chantier via `formatMetrage()`. 2 nouveaux tests chantier index.
- **Task 7** : 865 tests passent (16 failures pré-existants : pwa-config 5, pwa-html 5, hasPointerCapture 6). 0 nouvelles erreurs lint (2 pré-existantes). 0 erreurs tsc.

### Change Log

- 2026-02-12 : Story 7.1 implémentée — saisie et agrégation des métrés (m² et ML plinthes)
- 2026-02-12 : Code review — 3 MEDIUM corrigés : (M1) formatMetrage extrait en utilitaire partagé, (M2) ajout chantierId à mutation + invalidation plots, (M3) key MetrageSection inclut valeurs métrés pour sync externe

### File List

**Nouveaux fichiers :**
- `supabase/migrations/019_metrage.sql`
- `src/lib/mutations/useUpdatePieceMetrage.ts`
- `src/lib/mutations/useUpdatePieceMetrage.test.ts`
- `src/lib/utils/formatMetrage.ts`

**Fichiers modifiés :**
- `src/types/database.ts` — types complets pour pieces/lots/etages/plots + colonnes métrés
- `src/lib/queries/usePlots.ts` — ajout metrage_m2_total/metrage_ml_total dans PlotRow
- `src/components/StatusCard.tsx` — ajout prop secondaryInfo
- `src/components/StatusCard.test.tsx` — 3 tests secondaryInfo
- `src/lib/mutations/useUpdatePieceMetrage.ts` — ajout chantierId au params + invalidation plots
- `src/lib/mutations/useUpdatePieceMetrage.test.ts` — ajout chantierId aux appels + test invalidation plots
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/$pieceId.tsx` — section Métrés (MetrageSection) + chantierId prop + key sync
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/$pieceId.test.tsx` — 5 tests métrés + mock data mis à jour + chantierId
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx` — import formatMetrage depuis utilitaire partagé
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.test.tsx` — 2 tests métrés lots + mock data mis à jour
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — import formatMetrage depuis utilitaire partagé
- `src/routes/_authenticated/chantiers/$chantierId/index.test.tsx` — 2 tests métrés plots + mock data mis à jour
