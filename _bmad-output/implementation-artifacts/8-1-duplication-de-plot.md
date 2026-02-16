# Story 8.1: Duplication de plot

Status: done

## Story

En tant que utilisateur de posePilot sur un chantier complet,
Je veux dupliquer un plot existant avec l'ensemble de ses données (variantes, étages, lots, pièces, tâches, documents),
Afin que je puisse configurer rapidement un nouveau plot identique sans tout recréer manuellement.

## Acceptance Criteria

1. **Given** l'utilisateur est sur la page détail d'un plot **When** il ouvre le menu d'options (⋮) **Then** l'option "Dupliquer le plot" est disponible avant l'option "Supprimer"

2. **Given** l'utilisateur tape "Dupliquer le plot" **When** le Sheet s'ouvre **Then** un champ de saisie pour le nom du nouveau plot est affiché, pré-rempli avec "" (vide), et un bouton "Dupliquer" est présent

3. **Given** l'utilisateur saisit un nom et confirme **When** la mutation s'exécute **Then** un nouveau plot est créé dans le même chantier avec toutes les données dupliquées

4. **Given** la duplication réussit **When** le nouveau plot est créé **Then** les variantes (avec variante_pieces et variante_documents), étages, lots (avec code, is_tma, plinth_status), pièces (avec metrage_m2, metrage_ml), tâches et lot_documents (structure sans fichier) sont tous dupliqués

5. **Given** le plot est dupliqué **When** l'utilisateur consulte les tâches du nouveau plot **Then** toutes les tâches sont au statut "not_started" (remise à zéro)

6. **Given** le plot est dupliqué **When** l'utilisateur consulte les documents des lots **Then** les slots de documents existent (nom, is_required) mais sans fichier attaché (file_url et file_name à null)

7. **Given** le plot source a des notes sur ses lots ou pièces **When** la duplication s'exécute **Then** les notes ne sont PAS copiées dans le nouveau plot

8. **Given** la duplication réussit **When** le toast s'affiche **Then** l'utilisateur est redirigé vers la page détail du nouveau plot avec un toast "Plot dupliqué"

9. **Given** l'utilisateur ne saisit pas de nom (champ vide) **When** il tape "Dupliquer" **Then** une erreur de validation s'affiche "Le nom du plot est requis"

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : fonction RPC `duplicate_plot` (AC: #3, #4, #5, #6, #7)
  - [x] 1.1 Créer `supabase/migrations/024_duplicate_plot.sql`
  - [x] 1.2 Fonction `duplicate_plot(p_source_plot_id uuid, p_new_plot_nom text)` retourne uuid
  - [x] 1.3 Copier le plot (nom = p_new_plot_nom, task_definitions copiées, agrégats à 0)
  - [x] 1.4 Copier les variantes avec mapping old_id → new_id
  - [x] 1.5 Copier les variante_pieces avec mapping
  - [x] 1.6 Copier les variante_documents via variante mapping
  - [x] 1.7 Copier les étages avec mapping
  - [x] 1.8 Copier les lots (etage_id, variante_id remappés, plot_id = nouveau plot)
  - [x] 1.9 Copier les pièces (lot_id remappé, metrage_m2 et metrage_ml conservés)
  - [x] 1.10 Copier les tâches (status forcé à 'not_started')
  - [x] 1.11 Copier les lot_documents (file_url et file_name à NULL)

- [x] Task 2 — Type TypeScript : RPC duplicate_plot (AC: #3)
  - [x] 2.1 Ajouter la signature RPC `duplicate_plot` dans `src/types/database.ts` → Functions

- [x] Task 3 — Mutation hook : useDuplicatePlot (AC: #3, #8)
  - [x] 3.1 Créer `src/lib/mutations/useDuplicatePlot.ts`
  - [x] 3.2 Input : `{ sourcePlotId: string, chantierId: string, newPlotNom: string }`
  - [x] 3.3 mutationFn : `supabase.rpc('duplicate_plot', { p_source_plot_id, p_new_plot_nom })`
  - [x] 3.4 onSettled : invalider `['plots', chantierId]`
  - [x] 3.5 Créer `src/lib/mutations/useDuplicatePlot.test.ts` (3 tests minimum)

- [x] Task 4 — UI : bouton "Dupliquer" + Sheet dans la page plot détail (AC: #1, #2, #8, #9)
  - [x] 4.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx`
  - [x] 4.2 Ajouter `DropdownMenuItem` "Dupliquer le plot" avec icône `Copy` avant "Supprimer le plot"
  - [x] 4.3 Ajouter état : `showDuplicateSheet`, `duplicatePlotName`, `duplicateNameError`
  - [x] 4.4 Sheet avec Input pour le nom + bouton "Dupliquer" (disabled si mutation pending)
  - [x] 4.5 Validation : nom requis (trim), sinon erreur
  - [x] 4.6 onSuccess : fermer Sheet, toast "Plot dupliqué", naviguer vers le nouveau plot

- [x] Task 5 — Tests de régression (AC: #1-9)
  - [x] 5.1 `npm run test` — tous les tests passent, 0 nouvelles régressions
  - [x] 5.2 `npm run lint` — 0 nouvelles erreurs
  - [x] 5.3 `npm run build` — 0 nouvelles erreurs tsc

## Dev Notes

### Vue d'ensemble — Stratégie d'implémentation

Cette story est la **première de l'Epic 8** (Améliorations de productivité) et ajoute la **duplication complète d'un plot** avec l'ensemble de sa hiérarchie : variantes → variante_pieces → variante_documents → étages → lots → pièces → tâches → lot_documents. Les notes ne sont PAS copiées, les tâches sont remises à `not_started`, et les documents sont créés en structure seule (sans fichier).

**Scope précis :**
- Fonction RPC PostgreSQL `duplicate_plot` exécutée en une seule transaction
- Mutation TanStack Query `useDuplicatePlot` appelant le RPC
- Bouton "Dupliquer le plot" dans le DropdownMenu de la page plot détail
- Sheet de saisie du nom pour le nouveau plot
- Navigation vers le nouveau plot après succès

**Hors scope :**
- Copie des notes (décision utilisateur)
- Copie des fichiers de documents (décision utilisateur)
- Conservation de l'avancement des tâches (décision utilisateur)
- Duplication depuis la liste des plots (page chantier)

**Complexité : MOYENNE** — La logique principale est côté SQL (fonction RPC avec mapping d'IDs). Côté React, c'est un pattern classique (DropdownMenuItem + Sheet + mutation).

### Ce qui existe déjà (à réutiliser, NE PAS recréer)

| Élément | Fichier | Notes |
|---------|---------|-------|
| `useCreatePlot` | `src/lib/mutations/useCreatePlot.ts` | Pattern mutation plot — modèle pour `useDuplicatePlot` |
| `create_lot_with_inheritance` | `supabase/migrations/007_lots.sql` | Pattern RPC avec boucles et mapping — modèle pour `duplicate_plot` |
| Page plot détail | `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` | DropdownMenu avec "Supprimer le plot" — ajouter "Dupliquer" avant |
| `Sheet` | `src/components/ui/sheet.tsx` | Bottom sheet — déjà utilisé partout |
| `Input` | `src/components/ui/input.tsx` | Champ texte — déjà utilisé pour le nom de plot dans la page chantier |
| `DropdownMenu` | `src/components/ui/dropdown-menu.tsx` | Menu d'options — déjà installé et utilisé |
| `usePlots(chantierId)` | `src/lib/queries/usePlots.ts` | Query plots — key: `['plots', chantierId]` |
| `useRealtimePlots` | `src/lib/subscriptions/useRealtimePlots.ts` | Realtime INSERT — détectera le nouveau plot |

### Migration SQL : 024_duplicate_plot.sql

```sql
-- Story 8.1 : Duplication de plot
-- Fonction RPC qui duplique un plot avec toute sa hiérarchie

CREATE OR REPLACE FUNCTION public.duplicate_plot(
  p_source_plot_id uuid,
  p_new_plot_nom text
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_source_plot RECORD;
  v_new_plot_id uuid;
  -- Variante mapping
  v_variante RECORD;
  v_new_variante_id uuid;
  v_variante_map jsonb := '{}';
  -- Variante pieces mapping
  v_vp RECORD;
  -- Variante documents
  v_vd RECORD;
  -- Etage mapping
  v_etage RECORD;
  v_new_etage_id uuid;
  v_etage_map jsonb := '{}';
  -- Lot mapping
  v_lot RECORD;
  v_new_lot_id uuid;
  -- Piece + tache
  v_piece RECORD;
  v_new_piece_id uuid;
  v_tache RECORD;
  -- Lot documents
  v_lot_doc RECORD;
BEGIN
  -- 1. Récupérer le plot source
  SELECT * INTO v_source_plot FROM public.plots WHERE id = p_source_plot_id;
  IF v_source_plot IS NULL THEN
    RAISE EXCEPTION 'Plot source introuvable: %', p_source_plot_id;
  END IF;

  -- 2. Créer le nouveau plot
  INSERT INTO public.plots (chantier_id, nom, task_definitions)
  VALUES (v_source_plot.chantier_id, p_new_plot_nom, v_source_plot.task_definitions)
  RETURNING id INTO v_new_plot_id;

  -- 3. Copier les variantes
  FOR v_variante IN
    SELECT * FROM public.variantes WHERE plot_id = p_source_plot_id ORDER BY created_at
  LOOP
    INSERT INTO public.variantes (plot_id, nom)
    VALUES (v_new_plot_id, v_variante.nom)
    RETURNING id INTO v_new_variante_id;

    v_variante_map := v_variante_map || jsonb_build_object(v_variante.id::text, v_new_variante_id::text);

    -- 3a. Copier les variante_pieces
    FOR v_vp IN
      SELECT * FROM public.variante_pieces WHERE variante_id = v_variante.id ORDER BY created_at
    LOOP
      INSERT INTO public.variante_pieces (variante_id, nom)
      VALUES (v_new_variante_id, v_vp.nom);
    END LOOP;

    -- 3b. Copier les variante_documents
    FOR v_vd IN
      SELECT * FROM public.variante_documents WHERE variante_id = v_variante.id ORDER BY created_at
    LOOP
      INSERT INTO public.variante_documents (variante_id, nom, is_required)
      VALUES (v_new_variante_id, v_vd.nom, v_vd.is_required);
    END LOOP;
  END LOOP;

  -- 4. Copier les étages
  FOR v_etage IN
    SELECT * FROM public.etages WHERE plot_id = p_source_plot_id ORDER BY created_at
  LOOP
    INSERT INTO public.etages (plot_id, nom)
    VALUES (v_new_plot_id, v_etage.nom)
    RETURNING id INTO v_new_etage_id;

    v_etage_map := v_etage_map || jsonb_build_object(v_etage.id::text, v_new_etage_id::text);
  END LOOP;

  -- 5. Copier les lots
  FOR v_lot IN
    SELECT * FROM public.lots WHERE plot_id = p_source_plot_id ORDER BY created_at
  LOOP
    INSERT INTO public.lots (etage_id, variante_id, plot_id, code, is_tma, plinth_status)
    VALUES (
      (v_etage_map->>v_lot.etage_id::text)::uuid,
      (v_variante_map->>v_lot.variante_id::text)::uuid,
      v_new_plot_id,
      v_lot.code,
      v_lot.is_tma,
      v_lot.plinth_status
    )
    RETURNING id INTO v_new_lot_id;

    -- 5a. Copier les pièces du lot
    FOR v_piece IN
      SELECT * FROM public.pieces WHERE lot_id = v_lot.id ORDER BY created_at
    LOOP
      INSERT INTO public.pieces (lot_id, nom, metrage_m2, metrage_ml)
      VALUES (v_new_lot_id, v_piece.nom, v_piece.metrage_m2, v_piece.metrage_ml)
      RETURNING id INTO v_new_piece_id;

      -- 5b. Copier les tâches de la pièce (status reset)
      FOR v_tache IN
        SELECT * FROM public.taches WHERE piece_id = v_piece.id ORDER BY created_at
      LOOP
        INSERT INTO public.taches (piece_id, nom, status)
        VALUES (v_new_piece_id, v_tache.nom, 'not_started');
      END LOOP;
    END LOOP;

    -- 5c. Copier les lot_documents (structure seule, sans fichier)
    FOR v_lot_doc IN
      SELECT * FROM public.lot_documents WHERE lot_id = v_lot.id ORDER BY created_at
    LOOP
      INSERT INTO public.lot_documents (lot_id, nom, is_required)
      VALUES (v_new_lot_id, v_lot_doc.nom, v_lot_doc.is_required);
    END LOOP;
  END LOOP;

  RETURN v_new_plot_id;
END;
$$;
```

**Points clés migration :**
- Pas de `SECURITY DEFINER` — la RLS standard suffit (même pattern que `create_lot_with_inheritance`)
- Mapping via `jsonb_build_object` pour mapper les anciens IDs vers les nouveaux
- `plinth_status` copié tel quel (état des plinthes conservé)
- `metrage_m2` et `metrage_ml` copiés sur les pièces (les agrégats se recalculeront via triggers)
- `taches.status` forcé à `'not_started'`
- `lot_documents` créés sans `file_url` ni `file_name` (défaut NULL)
- Notes et activity_logs non copiés (intentionnel)
- Les triggers d'agrégation se déclenchent automatiquement à chaque INSERT

### Type TypeScript : signature RPC

```typescript
// Dans database.ts → Functions
duplicate_plot: {
  Args: {
    p_source_plot_id: string
    p_new_plot_nom: string
  }
  Returns: string
}
```

### Mutation : useDuplicatePlot

```typescript
// src/lib/mutations/useDuplicatePlot.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface DuplicatePlotInput {
  sourcePlotId: string
  chantierId: string
  newPlotNom: string
}

export function useDuplicatePlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sourcePlotId, newPlotNom }: DuplicatePlotInput) => {
      const { data, error } = await supabase.rpc('duplicate_plot', {
        p_source_plot_id: sourcePlotId,
        p_new_plot_nom: newPlotNom,
      })
      if (error) throw error
      return data as string // new plot id
    },
    onSettled: (_data, _err, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['plots', chantierId] })
    },
  })
}
```

**Points clés mutation :**
- Pas d'optimistic update (la duplication est une opération lourde, pas besoin d'UI optimiste)
- `chantierId` dans l'input pour l'invalidation de cache (pas envoyé au RPC)
- Le RPC retourne le nouvel `id` du plot — utilisé pour la navigation

### Page plot détail — Modifications

**Nouveau DropdownMenuItem (AVANT "Supprimer") :**
```tsx
<DropdownMenuItem
  onSelect={(e) => {
    e.preventDefault()
    handleOpenDuplicateSheet()
  }}
>
  <Copy className="mr-2 size-4" />
  Dupliquer le plot
</DropdownMenuItem>
```

**Nouvel état :**
```typescript
const [showDuplicateSheet, setShowDuplicateSheet] = useState(false)
const [duplicatePlotName, setDuplicatePlotName] = useState('')
const [duplicateNameError, setDuplicateNameError] = useState('')
const duplicatePlot = useDuplicatePlot()
```

**Handlers :**
```typescript
function handleOpenDuplicateSheet() {
  setDuplicatePlotName('')
  setDuplicateNameError('')
  setShowDuplicateSheet(true)
}

function handleDuplicatePlot() {
  const trimmed = duplicatePlotName.trim()
  if (!trimmed) {
    setDuplicateNameError('Le nom du plot est requis')
    return
  }
  duplicatePlot.mutate(
    { sourcePlotId: plotId, chantierId, newPlotNom: trimmed },
    {
      onSuccess: (newPlotId) => {
        setShowDuplicateSheet(false)
        toast('Plot dupliqué')
        navigate({
          to: '/chantiers/$chantierId/plots/$plotId',
          params: { chantierId, plotId: newPlotId },
        })
      },
      onError: () => toast.error('Erreur lors de la duplication'),
    },
  )
}
```

**Sheet :**
```tsx
<Sheet open={showDuplicateSheet} onOpenChange={setShowDuplicateSheet}>
  <SheetContent side="bottom">
    <SheetHeader>
      <SheetTitle>Dupliquer le plot</SheetTitle>
      <SheetDescription>
        Toutes les données seront copiées. Les tâches seront remises à zéro.
      </SheetDescription>
    </SheetHeader>
    <div className="px-4">
      <Input
        placeholder="Nom du nouveau plot"
        value={duplicatePlotName}
        onChange={(e) => {
          setDuplicatePlotName(e.target.value)
          if (duplicateNameError) setDuplicateNameError('')
        }}
        onKeyDown={(e) => { if (e.key === 'Enter') handleDuplicatePlot() }}
        aria-label="Nom du nouveau plot"
        aria-invalid={!!duplicateNameError}
      />
      {duplicateNameError && (
        <p className="text-sm text-destructive mt-1">{duplicateNameError}</p>
      )}
    </div>
    <SheetFooter>
      <Button
        onClick={handleDuplicatePlot}
        disabled={duplicatePlot.isPending}
        className="w-full"
      >
        Dupliquer
      </Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

### Project Structure Notes

**Nouveaux fichiers (3) :**
- `supabase/migrations/024_duplicate_plot.sql`
- `src/lib/mutations/useDuplicatePlot.ts`
- `src/lib/mutations/useDuplicatePlot.test.ts`

**Fichiers modifiés (2) :**
- `src/types/database.ts` — signature RPC `duplicate_plot` dans Functions
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` — DropdownMenuItem + Sheet + handler

### Tests — Stratégie

**useDuplicatePlot.test.ts (3 tests) :**
- Appelle `supabase.rpc('duplicate_plot', ...)` avec les bons paramètres
- Invalide `['plots', chantierId]` après succès
- Propage l'erreur Supabase en cas d'échec

**Mock patterns :**
```typescript
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}))

// Mock succès
vi.mocked(supabase.rpc).mockResolvedValue({ data: 'new-plot-id', error: null })

// Mock erreur
vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: new Error('RPC failed') })
```

### Risques et points d'attention

1. **Performance RPC** : Pour un plot avec beaucoup de lots (100+), la fonction RPC fait N×M inserts (lots × pièces × tâches). Acceptable car c'est une opération ponctuelle côté serveur, exécutée en une seule transaction.

2. **Triggers d'agrégation** : Chaque INSERT de tâche déclenche le trigger de propagation progress. Pour un plot avec 500 tâches, cela fait 500 recalculs en cascade. PostgreSQL gère cela efficacement car c'est dans la même transaction, mais si la perf est un problème, on pourrait désactiver les triggers temporairement dans la fonction. Non implémenté pour la v1 (KISS).

3. **plinth_status** : Copié tel quel du lot source. Si un lot avait des plinthes "commandées" ou "façonnées", le nouveau lot aura le même statut. C'est voulu — l'utilisateur duplique pour gagner du temps, il ajustera si besoin.

4. **Unique constraints** : Les noms d'étages et codes de lots sont unique par plot. Comme le nouveau plot a un ID différent, il n'y a pas de conflit de contraintes d'unicité.

5. **`chantier_id` dans le RPC** : Pas besoin de le passer en paramètre — on le récupère depuis le plot source. Cela évite une incohérence si l'utilisateur passait un mauvais chantier_id.

6. **Pre-existing issues** : Mêmes que stories précédentes — failures pré-existants (pwa-config, hasPointerCapture, placeholderData queries), lint error ThemeProvider.tsx:64.

### Previous Story Intelligence

**Story 2.1 (création de plots) :**
- `useCreatePlot` pattern — mutation avec optimistic update, invalidation `['plots', chantierId]`
- Page chantier index → Sheet avec Input nom + Button "Créer le plot"

**Story 2.4 (lots avec héritage) :**
- `create_lot_with_inheritance` RPC — pattern de boucles FOR + INSERT dans fonction plpgsql
- Mapping entre tables parents (variante_pieces → pieces)
- `v_task_definitions` extrait du plot

**Story 2.5 (batch lots) :**
- `create_batch_lots_with_inheritance` — pattern de wrapping d'une opération unitaire en batch

### References

- [Source: src/lib/mutations/useCreatePlot.ts — Pattern mutation plot, DEFAULT_TASK_DEFINITIONS]
- [Source: src/lib/mutations/useCreatePlot.test.ts — Pattern test mutation avec mock supabase]
- [Source: supabase/migrations/007_lots.sql — Tables etages, lots, pieces, taches, lot_documents + create_lot_with_inheritance]
- [Source: supabase/migrations/005_variantes.sql — Tables variantes, variante_pieces]
- [Source: supabase/migrations/006_variante_documents.sql — Table variante_documents]
- [Source: supabase/migrations/019_metrage.sql — Colonnes metrage_m2, metrage_ml sur pieces]
- [Source: supabase/migrations/020_plinth_status.sql — Colonne plinth_status sur lots]
- [Source: src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx — Page plot détail, DropdownMenu avec "Supprimer"]
- [Source: src/types/database.ts — Types Plot, Tables, Functions]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

(aucun)

### Completion Notes List

- Task 1: Migration SQL `024_duplicate_plot.sql` — fonction RPC `duplicate_plot` avec mapping JSONB des IDs (variantes, étages) pour remapper les FK. Copie complète de la hiérarchie : plot → variantes → variante_pieces → variante_documents → étages → lots → pièces → tâches → lot_documents. Tâches reset à `not_started`, documents sans fichier, notes non copiées.
- Task 2: Signature RPC `duplicate_plot` ajoutée dans `database.ts` → Functions (Args: p_source_plot_id + p_new_plot_nom, Returns: string)
- Task 3: `useDuplicatePlot` mutation — appel `supabase.rpc('duplicate_plot', ...)`, invalidation `['plots', chantierId]`. 3 tests passing (paramètres RPC, invalidation, propagation erreur).
- Task 4: Page plot détail — `DropdownMenuItem` "Dupliquer le plot" avec icône `Copy` ajouté avant "Supprimer". Sheet bottom avec Input nom, validation required, navigation vers nouveau plot onSuccess.
- Task 5: 0 erreurs tsc, 0 erreurs lint. Tests story 8.1: 3/3 passing. Failures pré-existantes (pwa-config, navigation-hierarchy, livraisons-page, etc.) non liées.

### File List

**Nouveaux fichiers (3) :**
- `supabase/migrations/024_duplicate_plot.sql`
- `src/lib/mutations/useDuplicatePlot.ts`
- `src/lib/mutations/useDuplicatePlot.test.ts`

**Fichiers modifiés (2) :**
- `src/types/database.ts`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx`

### Change Log

- 2026-02-16: Story 8.1 implémentée — duplication complète de plot avec hiérarchie (variantes, étages, lots, pièces, tâches, documents), RPC PostgreSQL transactionnelle, mutation TanStack Query, UI bouton + Sheet dans page plot détail
