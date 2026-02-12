# Story 2.6: Flag TMA et personnalisation de lot individuel

Status: done
Story ID: 2.6
Story Key: 2-6-flag-tma-et-personnalisation-de-lot-individuel
Epic: 2 — Configuration & Structure de chantier
Date: 2026-02-09
Dependencies: Story 2.5 (done)
FRs: FR20, FR21, FR22

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux flagger des lots comme TMA et personnaliser un lot individuel,
Afin que les lots spéciaux soient identifiés et que chaque lot puisse être ajusté selon ses particularités.

## Acceptance Criteria (BDD)

### AC1: Activer le flag TMA avec indicateur visuel

**Given** un lot existe
**When** l'utilisateur active le flag TMA sur ce lot
**Then** le lot est marqué TMA et un indicateur visuel le distingue dans la grille

### AC2: Désactiver le flag TMA (réversible)

**Given** un lot est flaggé TMA
**When** l'utilisateur veut modifier le flag en cours de chantier
**Then** il peut désactiver le flag TMA (modification réversible)

### AC3: Ajouter une tâche supplémentaire à un lot individuel

**Given** un lot a hérité de sa variante
**When** l'utilisateur ajoute une tâche supplémentaire au lot individuel
**Then** la tâche est ajoutée au lot sans affecter la variante ni les autres lots

### AC4: Ajouter une pièce supplémentaire à un lot individuel

**Given** un lot a hérité de sa variante
**When** l'utilisateur ajoute une pièce supplémentaire au lot individuel
**Then** la pièce (avec tâches héritées du plot) est ajoutée au lot uniquement

### AC5: Ajouter un document supplémentaire à un lot individuel

**Given** un lot a hérité de sa variante
**When** l'utilisateur ajoute un document supplémentaire au lot individuel
**Then** le slot de document est ajouté au lot sans affecter la variante

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : fonction `add_piece_to_lot` (AC: #4)
  - [x] 1.1 Créer `supabase/migrations/009_lot_customization.sql`
  - [x] 1.2 Créer la fonction PostgreSQL `add_piece_to_lot(p_lot_id uuid, p_piece_nom text)` qui crée une pièce + ses tâches héritées depuis `plots.task_definitions` — transaction atomique
  - [x] 1.3 La fonction retourne `uuid` — l'ID de la pièce créée
  - [x] 1.4 Pas de fonction SQL pour tâche/document/TMA — ce sont des INSERT/UPDATE simples gérés côté client

- [x] Task 2 — Types TypeScript (AC: #4)
  - [x] 2.1 Ajouter la fonction `add_piece_to_lot` dans `Database.public.Functions` de `src/types/database.ts`
  - [x] 2.2 Args : `{ p_lot_id: string, p_piece_nom: string }`
  - [x] 2.3 Returns : `string` (UUID de la pièce créée)

- [x] Task 3 — Hook mutation `useToggleLotTma` + tests (AC: #1, #2)
  - [x]3.1 Créer `src/lib/mutations/useToggleLotTma.ts` — `useMutation` qui fait `.update({ is_tma }).eq('id', lotId)` sur la table `lots`
  - [x]3.2 Mutation optimiste : `onMutate` met à jour le cache `['lots', plotId]` immédiatement
  - [x]3.3 `onError` : rollback du cache
  - [x]3.4 `onSettled` : invalider `['lots', plotId]`
  - [x]3.5 Créer `src/lib/mutations/useToggleLotTma.test.ts` — Tests : appel Supabase correct, mutation optimiste, rollback erreur, invalidation queries

- [x]Task 4 — Hook mutation `useAddLotPiece` + tests (AC: #4)
  - [x]4.1 Créer `src/lib/mutations/useAddLotPiece.ts` — `useMutation` qui appelle `supabase.rpc('add_piece_to_lot', { p_lot_id, p_piece_nom })`
  - [x]4.2 `onSettled` : invalider `['pieces', lotId]`
  - [x]4.3 Pas de mutation optimiste (impossible de simuler les tâches héritées côté client)
  - [x]4.4 Créer `src/lib/mutations/useAddLotPiece.test.ts` — Tests : appel RPC correct, invalidation queries, gestion erreur

- [x]Task 5 — Hook mutation `useAddLotTask` + tests (AC: #3)
  - [x]5.1 Créer `src/lib/mutations/useAddLotTask.ts` — `useMutation` qui fait `.insert({ piece_id, nom, status: 'not_started' })` sur la table `taches`
  - [x]5.2 `onSettled` : invalider `['pieces', lotId]` (les tâches sont imbriquées dans la query pieces)
  - [x]5.3 Mutation optimiste possible : ajouter la tâche dans le cache `['pieces', lotId]` sous la bonne pièce
  - [x]5.4 Créer `src/lib/mutations/useAddLotTask.test.ts` — Tests : appel INSERT correct, mutation optimiste, invalidation queries

- [x]Task 6 — Hook mutation `useAddLotDocument` + tests (AC: #5)
  - [x]6.1 Créer `src/lib/mutations/useAddLotDocument.ts` — `useMutation` qui fait `.insert({ lot_id, nom, is_required: false })` sur la table `lot_documents`
  - [x]6.2 Mutation optimiste : ajouter le document dans le cache `['lot-documents', lotId]`
  - [x]6.3 `onSettled` : invalider `['lot-documents', lotId]`
  - [x]6.4 Créer `src/lib/mutations/useAddLotDocument.test.ts` — Tests : appel INSERT correct, mutation optimiste, invalidation queries

- [x]Task 7 — UI : TMA toggle + badge sur la page lot (AC: #1, #2)
  - [x]7.1 Dans `lots.$lotId.tsx`, ajouter une section TMA sous le header avec le composant Switch + label "TMA"
  - [x]7.2 Afficher un Badge "TMA" à côté du titre `Lot {code}` quand `is_tma === true`
  - [x]7.3 Le Switch appelle `useToggleLotTma` au `onCheckedChange`
  - [x]7.4 Feedback visuel immédiat (mutation optimiste)

- [x]Task 8 — UI : Badge TMA dans la grille de lots (AC: #1)
  - [x]8.1 Dans `plots.$plotId/index.tsx`, passer un `badge` prop au StatusCard quand `lot.is_tma === true`
  - [x]8.2 Le badge affiche "TMA" en `variant="outline"` avec bordure orange (#F59E0B)
  - [x]8.3 S'assurer que le badge n'apparaît PAS quand `is_tma === false`

- [x]Task 9 — UI : Ajout de pièce sur la page lot (AC: #4)
  - [x]9.1 Ajouter un bouton "Ajouter une pièce" en bas de la section Pièces
  - [x]9.2 Le bouton ouvre un champ inline (Input + bouton OK) pour saisir le nom de la pièce
  - [x]9.3 Validation : nom non vide, pas de doublon avec les pièces existantes (case-insensitive)
  - [x]9.4 Succès : toast "Pièce « X » ajoutée", la pièce apparaît dans la liste avec ses tâches héritées
  - [x]9.5 Erreur : toast.error

- [x] Task 10 — UI : Ajout de tâche sur une pièce (AC: #3)
  - [x]10.1 Dans chaque pièce expandée, ajouter un petit bouton "+" ou "Ajouter une tâche"
  - [x]10.2 Le bouton ouvre un champ inline (Input + bouton OK) pour saisir le nom de la tâche
  - [x]10.3 Validation : nom non vide, pas de doublon avec les tâches existantes de cette pièce (case-insensitive)
  - [x]10.4 Succès : la tâche apparaît en bas de la liste des tâches de cette pièce (statut "not_started")
  - [x]10.5 Erreur : toast.error

- [x] Task 11 — UI : Ajout de document sur la page lot (AC: #5)
  - [x]11.1 Ajouter un bouton "Ajouter un document" en bas de la section Documents
  - [x]11.2 Le bouton ouvre un champ inline (Input + bouton OK) pour saisir le nom du document
  - [x]11.3 Le document est créé avec `is_required: false` par défaut
  - [x]11.4 Validation : nom non vide, pas de doublon avec les documents existants du lot (case-insensitive)
  - [x]11.5 Succès : toast "Document « X » ajouté", le document apparaît dans la liste avec badge "Optionnel"
  - [x]11.6 Erreur : toast.error

- [x] Task 12 — Tests UI page lot (toutes AC)
  - [x]12.1 Tests TMA toggle : Switch présent, toggle ON affiche badge, toggle OFF retire badge, mutation appelée avec bons params
  - [x]12.2 Tests badge TMA dans la grille : StatusCard affiche badge "TMA" quand `is_tma === true`, pas de badge quand `false`
  - [x]12.3 Tests ajout pièce : bouton présent, champ inline, validation nom vide, validation doublon, création réussie avec toast
  - [x]12.4 Tests ajout tâche : bouton "+" présent dans pièce expandée, champ inline, validation, création réussie
  - [x]12.5 Tests ajout document : bouton présent, champ inline, validation, création réussie avec toast, badge "Optionnel"
  - [x]12.6 Vérifier que tous les tests existants passent (291 pré-existants + nouveaux = 0 régressions)
  - [x]12.7 Lint clean (sauf pré-existant ThemeProvider.tsx:64)

## Dev Notes

### Architecture & Patterns obligatoires

- **Supabase Client SDK direct** — `.from().update()` pour TMA, `.from().insert()` pour tâches/documents, `.rpc()` pour pièces (héritage atomique). [Source: architecture.md#API & Communication Patterns]
- **Mutations optimistes** — TMA toggle, ajout tâche et ajout document utilisent le pattern onMutate/onError/onSettled. L'ajout de pièce via RPC ne peut PAS être optimiste (tâches héritées inconnues côté client). [Source: architecture.md#Communication Patterns]
- **Query keys convention** — `['lots', plotId]` pour TMA, `['pieces', lotId]` pour pièces/tâches, `['lot-documents', lotId]` pour documents. [Source: architecture.md#Communication Patterns]
- **Types snake_case** — miroir exact du schéma PostgreSQL. [Source: architecture.md#Naming Patterns]
- **Messages en français** — tous les labels, erreurs, toasts. [Source: architecture.md#Enforcement Guidelines]
- **Tests co-localisés** — `.test.ts(x)` à côté du fichier testé. [Source: architecture.md#Structure Patterns]
- **shadcn/ui first** — utiliser Switch, Badge, Button, Input existants. [Source: architecture.md#Enforcement Guidelines]

### Décision architecturale : Fonction SQL pour ajout de pièce uniquement

Seule l'ajout de pièce nécessite une fonction RPC car elle implique :
1. Créer la pièce dans `pieces`
2. Lire `task_definitions` depuis le plot du lot
3. Créer une tâche pour chaque `task_definition`

C'est une opération multi-table atomique — exactement le cas d'usage d'une fonction PostgreSQL.

```sql
CREATE OR REPLACE FUNCTION public.add_piece_to_lot(
  p_lot_id uuid,
  p_piece_nom text
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_piece_id uuid;
  v_plot_id uuid;
  v_task_definitions text[];
  v_task text;
BEGIN
  -- 1. Get plot_id from lot
  SELECT plot_id INTO v_plot_id FROM public.lots WHERE id = p_lot_id;

  -- 2. Get task definitions from plot
  SELECT task_definitions INTO v_task_definitions FROM public.plots WHERE id = v_plot_id;

  -- 3. Create piece
  INSERT INTO public.pieces (lot_id, nom)
  VALUES (p_lot_id, p_piece_nom)
  RETURNING id INTO v_piece_id;

  -- 4. Create taches from task_definitions
  FOREACH v_task IN ARRAY COALESCE(v_task_definitions, '{}')
  LOOP
    INSERT INTO public.taches (piece_id, nom, status)
    VALUES (v_piece_id, v_task, 'not_started');
  END LOOP;

  RETURN v_piece_id;
END;
$$;
```

**Les 3 autres opérations sont des INSERT/UPDATE simples** — pas besoin de RPC :
- TMA toggle → `.update({ is_tma }).eq('id', lotId)` sur `lots`
- Ajout tâche → `.insert({ piece_id, nom, status: 'not_started' })` sur `taches`
- Ajout document → `.insert({ lot_id, nom, is_required: false })` sur `lot_documents`

### Décision architecturale : Champs inline au lieu de Sheet/Dialog

Pour l'ajout de pièce, tâche et document, on utilise un **champ inline** (Input + bouton de confirmation) plutôt qu'un Sheet ou Dialog. Justifications :

1. **Simplicité** — un seul champ (le nom), pas besoin d'un formulaire dédié
2. **Rapidité** — l'utilisateur voit immédiatement le résultat dans la liste sans navigation
3. **Cohérence terrain** — principe UX "un tap, un résultat" [Source: ux-design-specification.md#Core UX Principles]
4. **Max 3 champs visibles** — ici c'est 1 seul champ, bien en-dessous de la limite [Source: ux-design-specification.md#Form Patterns]

**Pattern inline :**
```
Pièces (5)
├── Séjour      [▼] 6 tâches · 0 fait, 0 en cours
├── Chambre     [▼] 6 tâches · 0 fait, 0 en cours
├── ...
└── [+ Ajouter une pièce]
    ┌─────────────────────────────┐
    │ Cuisine                [OK] │
    └─────────────────────────────┘
```

L'Input apparaît en-dessous du bouton quand celui-ci est cliqué. Le bouton OK soumet, Escape annule, Enter soumet. L'Input disparaît après soumission réussie.

### Décision architecturale : TMA toggle avec Switch dans le header lot

Le Switch TMA est placé dans la zone de métadonnées sous le header du lot (à côté de "Variante · Étage") :

```
┌──────────────────────────────────────┐
│  ← Lot 203                   [TMA]  │  ← Badge "TMA" visible si activé
│  Type A · É2                         │
│  TMA  ○───────  (Switch)             │  ← Switch pour toggle
├──────────────────────────────────────┤
│  Pièces (5)                          │
│  ...                                 │
```

**Justifications :**
1. **Visibilité** — le flag est visible dès l'ouverture du lot
2. **Réversibilité** — le Switch communique visuellement que c'est un toggle ON/OFF
3. **Pattern existant** — même pattern Switch + Label que dans la variante (documents obligatoire/optionnel) [Source: story 2.3]

### Décision architecturale : Badge TMA dans la grille de lots

Dans le plot index, les StatusCards de lots marqués TMA affichent un badge :

```tsx
<StatusCard
  title={`Lot ${lot.code}`}
  subtitle={`${lot.variantes?.nom} · ${pieceCount} pièce${...}`}
  statusColor={STATUS_COLORS.NOT_STARTED}
  badge={lot.is_tma ? <Badge variant="outline" className="border-amber-500 text-amber-500 text-[10px]">TMA</Badge> : undefined}
  onClick={() => navigate(...)}
/>
```

Le badge utilise `variant="outline"` avec couleur ambre (#F59E0B) — la couleur UX pour "en cours / attention" — car TMA est un statut d'attention spéciale, pas un statut d'erreur. [Source: ux-design-specification.md#Color Palette]

### Migration SQL cible

```sql
-- supabase/migrations/009_lot_customization.sql
-- Story 2.6 : Personnalisation de lot individuel

-- =====================
-- Fonction AJOUT DE PIÈCE avec héritage des tâches
-- =====================
-- Crée une pièce dans un lot + toutes les tâches depuis task_definitions du plot.
-- Retourne l'ID de la pièce créée.

CREATE OR REPLACE FUNCTION public.add_piece_to_lot(
  p_lot_id uuid,
  p_piece_nom text
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_piece_id uuid;
  v_plot_id uuid;
  v_task_definitions text[];
  v_task text;
BEGIN
  SELECT plot_id INTO v_plot_id FROM public.lots WHERE id = p_lot_id;

  SELECT task_definitions INTO v_task_definitions FROM public.plots WHERE id = v_plot_id;

  INSERT INTO public.pieces (lot_id, nom)
  VALUES (p_lot_id, p_piece_nom)
  RETURNING id INTO v_piece_id;

  FOREACH v_task IN ARRAY COALESCE(v_task_definitions, '{}')
  LOOP
    INSERT INTO public.taches (piece_id, nom, status)
    VALUES (v_piece_id, v_task, 'not_started');
  END LOOP;

  RETURN v_piece_id;
END;
$$;
```

### Types database.ts — Section à ajouter

Ajouter dans `Database.public.Functions` :

```typescript
add_piece_to_lot: {
  Args: {
    p_lot_id: string
    p_piece_nom: string
  }
  Returns: string // UUID de la pièce créée
}
```

### Pattern mutation — TMA toggle (optimiste)

```typescript
// src/lib/mutations/useToggleLotTma.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { LotWithRelations } from '@/lib/queries/useLots'

export function useToggleLotTma() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lotId, isTma }: { lotId: string; isTma: boolean; plotId: string }) => {
      const { data, error } = await supabase
        .from('lots')
        .update({ is_tma: isTma })
        .eq('id', lotId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ lotId, isTma, plotId }) => {
      await queryClient.cancelQueries({ queryKey: ['lots', plotId] })
      const previous = queryClient.getQueryData<LotWithRelations[]>(['lots', plotId])
      queryClient.setQueryData<LotWithRelations[]>(
        ['lots', plotId],
        (old) =>
          (old ?? []).map((lot) =>
            lot.id === lotId ? { ...lot, is_tma: isTma } : lot,
          ),
      )
      return { previous }
    },
    onError: (_err, { plotId }, context) => {
      queryClient.setQueryData(['lots', plotId], context?.previous)
    },
    onSettled: (_data, _err, { plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
    },
  })
}
```

### Pattern mutation — Ajout pièce via RPC

```typescript
// src/lib/mutations/useAddLotPiece.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useAddLotPiece() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lotId, nom }: { lotId: string; nom: string }) => {
      const { data, error } = await supabase.rpc('add_piece_to_lot', {
        p_lot_id: lotId,
        p_piece_nom: nom,
      })
      if (error) throw error
      return data as string // UUID de la pièce
    },
    onSettled: (_data, _err, { lotId }) => {
      queryClient.invalidateQueries({ queryKey: ['pieces', lotId] })
    },
  })
}
```

### Pattern mutation — Ajout tâche (optimiste)

```typescript
// src/lib/mutations/useAddLotTask.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PieceWithTaches } from '@/lib/queries/usePieces'

export function useAddLotTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ pieceId, nom }: { pieceId: string; nom: string; lotId: string }) => {
      const { data, error } = await supabase
        .from('taches')
        .insert({ piece_id: pieceId, nom, status: 'not_started' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ pieceId, nom, lotId }) => {
      await queryClient.cancelQueries({ queryKey: ['pieces', lotId] })
      const previous = queryClient.getQueryData<PieceWithTaches[]>(['pieces', lotId])
      queryClient.setQueryData<PieceWithTaches[]>(
        ['pieces', lotId],
        (old) =>
          (old ?? []).map((piece) =>
            piece.id === pieceId
              ? {
                  ...piece,
                  taches: [
                    ...piece.taches,
                    {
                      id: crypto.randomUUID(),
                      piece_id: pieceId,
                      nom,
                      status: 'not_started' as const,
                      created_at: new Date().toISOString(),
                    },
                  ],
                }
              : piece,
          ),
      )
      return { previous }
    },
    onError: (_err, { lotId }, context) => {
      queryClient.setQueryData(['pieces', lotId], context?.previous)
    },
    onSettled: (_data, _err, { lotId }) => {
      queryClient.invalidateQueries({ queryKey: ['pieces', lotId] })
    },
  })
}
```

### Pattern mutation — Ajout document (optimiste)

```typescript
// src/lib/mutations/useAddLotDocument.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type LotDocumentRow = Database['public']['Tables']['lot_documents']['Row']

export function useAddLotDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lotId, nom }: { lotId: string; nom: string }) => {
      const { data, error } = await supabase
        .from('lot_documents')
        .insert({ lot_id: lotId, nom, is_required: false })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ lotId, nom }) => {
      await queryClient.cancelQueries({ queryKey: ['lot-documents', lotId] })
      const previous = queryClient.getQueryData<LotDocumentRow[]>(['lot-documents', lotId])
      queryClient.setQueryData<LotDocumentRow[]>(
        ['lot-documents', lotId],
        (old) => [
          ...(old ?? []),
          {
            id: crypto.randomUUID(),
            lot_id: lotId,
            nom,
            is_required: false,
            created_at: new Date().toISOString(),
          },
        ],
      )
      return { previous }
    },
    onError: (_err, { lotId }, context) => {
      queryClient.setQueryData(['lot-documents', lotId], context?.previous)
    },
    onSettled: (_data, _err, { lotId }) => {
      queryClient.invalidateQueries({ queryKey: ['lot-documents', lotId] })
    },
  })
}
```

### Pattern composant inline — Ajout avec validation

```typescript
// Pattern réutilisable pour les 3 champs inline (pièce, tâche, document)
function InlineAddField({
  label,
  placeholder,
  existingNames,
  onAdd,
  isPending,
}: {
  label: string
  placeholder: string
  existingNames: string[]
  onAdd: (nom: string) => void
  isPending: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed) {
      setError('Le nom est requis')
      return
    }
    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      setError(`« ${trimmed} » existe déjà`)
      return
    }
    onAdd(trimmed)
    setValue('')
    setError('')
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
        + {label}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => { setValue(e.target.value); setError('') }}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') setIsOpen(false) }}
        placeholder={placeholder}
        autoFocus
        className="h-8 text-sm"
      />
      <Button size="sm" onClick={handleSubmit} disabled={isPending}>
        OK
      </Button>
    </div>
  )
  // Afficher error sous l'input si non vide
}
```

**NOTE IMPORTANTE :** Ce pattern inline N'EST PAS un composant séparé dans un fichier dédié. Il est défini directement dans `lots.$lotId.tsx` comme fonction locale. Pas de sur-ingénierie — c'est utilisé uniquement dans cette page.

### Attention — Pièges courants

1. **Le champ `is_tma` est déjà dans la table `lots`** — La colonne existe depuis la migration `007_lots.sql` (ligne 28). Elle est déjà dans les types `database.ts`. Pas de migration d'ALTER TABLE nécessaire. La seule migration est la fonction `add_piece_to_lot`.

2. **Le `useLots` query retourne déjà `is_tma`** — La query fait `select('*, etages(nom), variantes(nom), pieces(count)')` — le `*` inclut `is_tma`. Mais le type `LotWithRelations` dans `useLots.ts` ne le mentionne pas explicitement car il étend `LotRow` qui inclut `is_tma`. Vérifier que c'est bien le cas et accessible dans les composants.

3. **Le StatusCard a déjà un prop `badge?: ReactNode`** — Pas besoin de modifier le composant StatusCard. Il suffit de passer un `<Badge>` dans ce prop. [Source: StatusCard.tsx lines 17, 57]

4. **Le Switch est déjà installé** — `src/components/ui/switch.tsx` existe. Utilisé dans la page variante (story 2.3).

5. **Query key pour lot_documents** — La query `useLotDocuments` utilise `['lot-documents', lotId]` comme key. Le mutation `useAddLotDocument` doit invalider cette même clé. Vérifier la cohérence.

6. **Mutation optimiste pour `useAddLotTask`** — La query `usePieces` retourne `PieceWithTaches[]` avec les tâches imbriquées. La mutation optimiste doit ajouter la tâche **dans le tableau `taches` de la bonne pièce**, pas à la racine.

7. **Ajout de pièce NON optimiste** — Contrairement aux tâches et documents, l'ajout de pièce passe par RPC parce que la pièce doit hériter des `task_definitions` du plot. Le client ne peut pas prédire le résultat (il faudrait fetch le plot en plus). Après succès, le `invalidateQueries` déclenche le refetch et la pièce apparaît avec ses tâches.

8. **Validation doublons case-insensitive** — Même pattern que dans les stories précédentes (2.4, 2.5). Comparaison via `.toLowerCase()` côté client.

9. **291 tests pré-existants** — Baseline de la story 2.5. Aucune régression autorisée.

10. **Pas de nouveau composant shadcn à installer** — Tout est déjà en place : Switch, Badge, Button, Input. Pas de Sheet nécessaire (on utilise des champs inline).

11. **Le champ inline utilise Enter pour soumettre et Escape pour annuler** — Pattern standard de saisie rapide. Le focus doit être mis automatiquement sur l'input à l'ouverture (`autoFocus`).

12. **Le document ajouté est toujours `is_required: false`** — Par cohérence avec AC5 ("slot de document ajouté") et le principe "zéro contrainte par défaut" (FR43). L'utilisateur pourra changer le flag dans une story future si nécessaire.

13. **Toast de succès pour pièce et document, PAS pour tâche** — L'ajout de pièce et document justifie un toast car ils modifient une section différente de celle où l'utilisateur interagit. L'ajout de tâche est visible immédiatement sous les yeux de l'utilisateur (mutation optimiste dans la liste expandée), un toast serait redondant.

### Composants shadcn/ui — Rien à installer

Tous les composants nécessaires sont déjà installés :
- **Switch** — toggle TMA (installé en story 2.3)
- **Badge** — indicateur TMA (installé en story 1.5)
- **Button** — boutons (installé en story 1.1)
- **Input** — champs texte (installé en story 1.2)
- **StatusCard** — grille de lots avec prop `badge` (installé en story 1.5)

### Conventions de nommage

- Fichier migration : `009_lot_customization.sql`
- Fonction RPC : `add_piece_to_lot` (snake_case, convention PostgreSQL)
- Fichier mutation TMA : `useToggleLotTma.ts`
- Fichier mutation pièce : `useAddLotPiece.ts`
- Fichier mutation tâche : `useAddLotTask.ts`
- Fichier mutation document : `useAddLotDocument.ts`
- Tests : `*.test.ts` co-localisés à côté
- Query keys : `['lots', plotId]`, `['pieces', lotId]`, `['lot-documents', lotId]`

### Stack technique — Versions exactes (déjà installées)

| Bibliothèque | Version | Utilisation dans cette story |
|---|---|---|
| **@supabase/supabase-js** | 2.x | `.from().update()`, `.from().insert()`, `.rpc()` |
| **@tanstack/react-query** | 5.x | `useMutation`, `useQueryClient`, mutations optimistes |
| **@tanstack/react-router** | 1.158.x | `createFileRoute`, `Route.useParams()` |
| **shadcn/ui** | CLI 3.8.4 | Switch, Badge, Button, Input (existants) |
| **vitest** | 4.0.x | Tests unitaires co-localisés |

### Project Structure Notes

**Nouveaux fichiers à créer :**
- `supabase/migrations/009_lot_customization.sql` — Fonction `add_piece_to_lot`
- `src/lib/mutations/useToggleLotTma.ts` — Mutation toggle TMA
- `src/lib/mutations/useToggleLotTma.test.ts` — Tests mutation TMA
- `src/lib/mutations/useAddLotPiece.ts` — Mutation ajout pièce
- `src/lib/mutations/useAddLotPiece.test.ts` — Tests mutation pièce
- `src/lib/mutations/useAddLotTask.ts` — Mutation ajout tâche
- `src/lib/mutations/useAddLotTask.test.ts` — Tests mutation tâche
- `src/lib/mutations/useAddLotDocument.ts` — Mutation ajout document
- `src/lib/mutations/useAddLotDocument.test.ts` — Tests mutation document

**Fichiers à modifier :**
- `src/types/database.ts` — Ajouter `add_piece_to_lot` dans Functions
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/lots.$lotId.tsx` — TMA switch + badge, boutons ajout pièce/tâche/document, champs inline
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/lots.$lotId.test.tsx` — Tests TMA, tests ajout pièce/tâche/document (CRÉER ce fichier s'il n'existe pas)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` — Badge TMA sur les StatusCards de lots
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.test.tsx` — Tests badge TMA dans grille

**Fichiers NON touchés :**
- `src/lib/mutations/useCreateLot.ts` — Inchangé
- `src/lib/mutations/useCreateBatchLots.ts` — Inchangé
- `src/lib/queries/useLots.ts` — Inchangé (is_tma déjà dans les types via LotRow)
- `src/lib/queries/usePieces.ts` — Inchangé
- `src/lib/queries/useLotDocuments.ts` — Inchangé
- `src/components/StatusCard.tsx` — Inchangé (prop badge déjà supporté)
- `src/components/ui/switch.tsx` — Inchangé
- `src/components/ui/badge.tsx` — Inchangé
- `src/index.css` — Pas de changement
- `src/main.tsx` — Pas de changement

### References

- [Source: epics.md#Story 2.6] — User story, acceptance criteria BDD
- [Source: epics.md#FR20] — Flag TMA sur lot
- [Source: epics.md#FR21] — Modifier flag TMA en cours de chantier
- [Source: epics.md#FR22] — Ajouter tâches/pièces/docs sur lot individuel
- [Source: architecture.md#Data Architecture] — Héritage avec copie, triggers
- [Source: architecture.md#API & Communication Patterns] — SDK Supabase direct, .rpc(), mutations optimistes
- [Source: architecture.md#Communication Patterns] — Query keys, invalidation ciblée, pattern onMutate/onError/onSettled
- [Source: architecture.md#Structure Patterns] — Structure projet par domaine, tests co-localisés
- [Source: architecture.md#Naming Patterns] — snake_case DB, camelCase JS
- [Source: architecture.md#Enforcement Guidelines] — Messages français, shadcn first, Switch pour toggles
- [Source: ux-design-specification.md#Core UX Principles] — "Un tap, un résultat"
- [Source: ux-design-specification.md#Form Patterns] — Max 3 champs visibles
- [Source: ux-design-specification.md#Color Palette] — Orange #F59E0B pour attention/en cours
- [Source: ux-design-specification.md#StatusCard] — Badge prop, barre de statut latérale
- [Source: story 2.5 Dev Notes] — Patterns RPC, polyfills jsdom, 291 tests baseline

## Previous Story Intelligence (Story 2.5)

### Learnings critiques de la story précédente

1. **291 tests existants** — baseline à ne pas régresser (271 pré-story-2.5 + 20 story 2.5 incluant code review fixes)
2. **Polyfills jsdom ajoutés** — `hasPointerCapture`, `releasePointerCapture`, `setPointerCapture`, `scrollIntoView` dans `src/test/setup.ts` pour Radix UI. Déjà en place, pas besoin de les rajouter.
3. **Pattern formulaire inline** — Pas de Sheet nécessaire pour un seul champ. Story 2.5 utilisait un textarea dans un Sheet (batch = 3 champs). Story 2.6 = 1 seul champ par opération → inline plus approprié.
4. **Mock `.rpc()` pour les fonctions PostgreSQL** — `vi.mocked(supabase.rpc).mockResolvedValue({ data: ..., error: null })` — réutiliser pour `add_piece_to_lot` avec retour string unique (pas array).
5. **Mock `.from().update()` et `.from().insert()`** — Patterns existants dans les tests de mutations (useToggleDocumentRequired, useAddVariantePiece). Réutiliser le pattern chaîné `from → update/insert → eq → select → single`.
6. **Erreur pluriel français** — "0 fait" (pas "0 faits"), "1 pièce" (pas "1 pièces"). Vérifier les formulations ajoutées.
7. **Le prop badge de StatusCard** — Disponible depuis story 1.5 (défini dans StatusCard.tsx:17, rendu dans StatusCard.tsx:57). Jamais utilisé jusqu'ici — story 2.6 sera la première utilisation.

### Code patterns établis (à respecter)

- `createFileRoute('/_authenticated/...')` pour les routes protégées
- `supabase` client singleton typé `Database`
- Tests avec Vitest + Testing Library + mocks Supabase
- Toast via `toast()` et `toast.error()` de sonner pour le feedback
- StatusCard avec `badge` prop pour les indicateurs
- Switch + Label pour les toggles booléens
- Mutation optimiste complète (onMutate/onError/onSettled) pour les opérations simples
- Pas de mutation optimiste pour les RPC multi-tables

## Git Intelligence

### Commits récents (5 derniers)

```
e6487b6 feat: auth, route protection & login — Story 1-2 + code review fixes
e1c18ef fix: code review story 1-1 — 7 issues corrigées
61938ec docs: story 1-1 complete — all tasks done, status review
3789f3d docs: update story 1-1 progress — tasks 1-6 implemented
a3719c1 feat: initial project scaffolding — Story 1-1
```

Note : Les stories 1.3 à 2.5 ne sont pas encore commitées (changements en working directory). Le développeur travaillera par-dessus cet état non-commité.

### Technologies déjà en place

- React 19.2 + TypeScript strict
- Tailwind CSS v4 (config inline dans index.css)
- TanStack Router (file-based routing, `routeFileIgnorePattern`)
- TanStack Query v5 (staleTime 5min, retry 3)
- Supabase Auth + JS Client (typé Database) + Realtime
- shadcn/ui (button, card, input, label, badge, sonner, alert-dialog, dropdown-menu, tabs, sheet, switch, select — style "new-york")
- Lucide React, Vitest + Testing Library, vite-plugin-pwa
- 291 tests existants
- Fonctions RPC `create_lot_with_inheritance` et `create_batch_lots_with_inheritance` opérationnelles

## Latest Tech Information

### Supabase `.from().update()` avec `.select().single()`

Pattern standard pour les mutations unitaires avec retour de données :

```typescript
const { data, error } = await supabase
  .from('lots')
  .update({ is_tma: true })
  .eq('id', lotId)
  .select()
  .single()
```

Le `.select().single()` est requis pour obtenir la ligne mise à jour en retour. Sans `.select()`, `data` est `null`.

### Supabase `.from().insert()` avec `.select().single()`

Pattern standard pour les insertions avec retour :

```typescript
const { data, error } = await supabase
  .from('taches')
  .insert({ piece_id: pieceId, nom: 'Ragréage', status: 'not_started' })
  .select()
  .single()
```

Le `.select().single()` retourne l'objet créé avec l'UUID généré par PostgreSQL.

### Mutation optimiste avec données imbriquées

Pour `useAddLotTask`, la query `usePieces` retourne `PieceWithTaches[]` où chaque pièce contient un array `taches`. La mutation optimiste doit modifier la bonne pièce :

```typescript
queryClient.setQueryData<PieceWithTaches[]>(['pieces', lotId], (old) =>
  (old ?? []).map((piece) =>
    piece.id === pieceId
      ? { ...piece, taches: [...piece.taches, newTache] }
      : piece,
  ),
)
```

Ce pattern est plus complexe que les mutations optimistes "à plat" (comme TMA) car il modifie un sous-array imbriqué. Le spread `[...piece.taches, newTache]` assure l'immutabilité.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun problème rencontré — implémentation fluide.

### Completion Notes List

- Task 1: Migration SQL `009_lot_customization.sql` — fonction `add_piece_to_lot` avec héritage atomique des tâches
- Task 2: Type `add_piece_to_lot` ajouté dans `Database.public.Functions`
- Task 3: Hook `useToggleLotTma` — mutation optimiste complète (onMutate/onError/onSettled) + 4 tests
- Task 4: Hook `useAddLotPiece` — mutation RPC sans optimisme + 4 tests
- Task 5: Hook `useAddLotTask` — mutation optimiste avec données imbriquées + 4 tests
- Task 6: Hook `useAddLotDocument` — mutation optimiste + 4 tests
- Task 7: UI TMA switch + badge ambre dans header lot
- Task 8: UI Badge TMA `variant="outline"` ambre dans grille StatusCard
- Task 9: UI ajout pièce inline — validation nom vide/doublon, toast succès/erreur
- Task 10: UI ajout tâche inline dans pièce expandée — validation, pas de toast (visible immédiatement)
- Task 11: UI ajout document inline — validation, toast succès/erreur, badge "Optionnel"
- Task 12: 37 tests page lot (TMA toggle, ajout pièce/tâche/document) + 2 tests badge TMA grille — 334 total, 0 régression, lint clean

### Senior Developer Review (AI)

**Reviewer:** Youssef (via Claude Opus 4.6)
**Date:** 2026-02-09
**Outcome:** Approved with fixes applied

**Issues found and fixed:**
1. **[HIGH] Double-submit via Enter key** — Added `isPending` guard at start of `handleAddPiece`, `handleAddTask`, `handleAddDocument` in `lots.$lotId.tsx`
2. **[MEDIUM] SQL `add_piece_to_lot` missing NOT FOUND handling** — Added `IF NOT FOUND THEN RAISE EXCEPTION` after lot lookup in `009_lot_customization.sql`
3. **[MEDIUM] Missing error toast test for task addition** — Added test `shows error toast on failure` in `lots.$lotId.test.tsx` add task describe block
4. **[MEDIUM] No server-side UNIQUE constraints** — Added unique indexes on `(lot_id, lower(nom))` for pieces/lot_documents and `(piece_id, lower(nom))` for taches in migration
5. **[LOW] SQL function SECURITY INVOKER not documented** — Added comment explaining the choice
6. **[LOW] Lot detail fetches all lots for one** — Noted, not fixed (mitigated by TanStack Query cache)

**Post-fix results:** 335 tests passing, 0 failures, lint clean (pre-existing ThemeProvider only)

### Change Log

- 2026-02-09: Code review — 4 fixes applied (isPending guards, SQL NOT FOUND, missing test, UNIQUE constraints), status → done
- 2026-02-09: Story 2.6 complète — Flag TMA et personnalisation de lot individuel (12 tâches, 43 nouveaux tests, 334 total)

### File List

**Nouveaux fichiers :**
- `supabase/migrations/009_lot_customization.sql`
- `src/lib/mutations/useToggleLotTma.ts`
- `src/lib/mutations/useToggleLotTma.test.ts`
- `src/lib/mutations/useAddLotPiece.ts`
- `src/lib/mutations/useAddLotPiece.test.ts`
- `src/lib/mutations/useAddLotTask.ts`
- `src/lib/mutations/useAddLotTask.test.ts`
- `src/lib/mutations/useAddLotDocument.ts`
- `src/lib/mutations/useAddLotDocument.test.ts`

**Fichiers modifiés :**
- `src/types/database.ts` — ajout `add_piece_to_lot` dans Functions
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/lots.$lotId.tsx` — TMA switch+badge, ajout pièce/tâche/document inline + isPending guards (review fix)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/lots.$lotId.test.tsx` — 38 tests (TMA, ajout pièce/tâche/document + error toast test review fix)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` — Badge TMA sur StatusCard
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.test.tsx` — 2 tests badge TMA grille + mocks mutations
