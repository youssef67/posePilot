# Story 7.2: Suivi du statut des plinthes

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux suivre le statut des plinthes (commandées / façonnées chez fournisseur),
Afin que je sache où en est la préparation des plinthes pour chaque lot.

## Acceptance Criteria

1. **Given** un lot a des ML plinthes renseignés (`metrage_ml_total > 0`) **When** l'utilisateur consulte le lot **Then** un indicateur de statut des plinthes est disponible avec le statut actuel affiché

2. **Given** l'utilisateur veut mettre à jour le statut des plinthes **When** il change le statut via le sélecteur **Then** il peut choisir entre : non commandées / commandées / façonnées chez fournisseur — et le changement est immédiat (mutation optimiste)

3. **Given** le statut des plinthes est mis à jour **When** l'utilisateur consulte la grille de lots (vue étage) **Then** un badge visuel coloré sur la StatusCard du lot reflète le statut des plinthes (rouge = non commandées, orange = commandées, vert = façonnées)

4. **Given** les plinthes n'ont pas de ML renseigné (`metrage_ml_total = 0` ou null) **When** l'utilisateur consulte le lot **Then** aucun indicateur de statut plinthes n'est affiché — ni dans la vue détail lot, ni sur la StatusCard dans la grille

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : enum plinth_status + colonne sur lots (AC: #1, #2)
  - [x] 1.1 Créer `supabase/migrations/020_plinth_status.sql`
  - [x] 1.2 Créer le type enum PostgreSQL `plinth_status` avec valeurs : `non_commandees`, `commandees`, `faconnees`
  - [x] 1.3 Ajouter `plinth_status plinth_status NOT NULL DEFAULT 'non_commandees'` à la table `lots`

- [x] Task 2 — Types TypeScript : enum PlinthStatus + colonne lots (AC: #1)
  - [x] 2.1 Ajouter `PlinthStatus` dans `src/types/enums.ts` (pattern const + type existant)
  - [x] 2.2 Mettre à jour `lots` dans `src/types/database.ts` : ajouter `plinth_status: string` dans Row, Insert, Update
  - [x] 2.3 Ajouter `plinth_status` dans la section Enums de `database.ts` si elle existe

- [x] Task 3 — Mutation hook : useUpdatePlinthStatus (AC: #2)
  - [x] 3.1 Créer `src/lib/mutations/useUpdatePlinthStatus.ts` — copier le pattern de `useToggleLotTma`
  - [x] 3.2 mutationFn : `supabase.from('lots').update({ plinth_status }).eq('id', lotId).select().single()`
  - [x] 3.3 onMutate : optimistic update sur cache `['lots', plotId]` — mettre à jour le lot ciblé
  - [x] 3.4 onError : rollback vers le previous
  - [x] 3.5 onSettled : `invalidateQueries({ queryKey: ['lots', plotId] })`
  - [x] 3.6 Créer `src/lib/mutations/useUpdatePlinthStatus.test.ts` — 4 tests minimum (mutationFn, optimistic, rollback, invalidation)

- [x] Task 4 — UI vue détail lot : sélecteur statut plinthes (AC: #1, #2, #4)
  - [x] 4.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx`
  - [x] 4.2 Ajouter un sélecteur `Select` pour le statut plinthes, placé après le switch TMA, dans la section px-4 py-2
  - [x] 4.3 Sélecteur conditionnel : uniquement affiché si `lot.metrage_ml_total > 0`
  - [x] 4.4 Options du Select : "Non commandées" / "Commandées" / "Façonnées" — labels en français lisibles
  - [x] 4.5 onChange : appeler `useUpdatePlinthStatus` avec le nouveau statut
  - [x] 4.6 Mettre à jour les tests de la page lot detail

- [x] Task 5 — UI grille lots : badge statut plinthes sur StatusCard (AC: #3, #4)
  - [x] 5.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx`
  - [x] 5.2 Ajouter un badge conditionnel sur la StatusCard de chaque lot : affiché uniquement si `lot.metrage_ml_total > 0`
  - [x] 5.3 Couleurs du badge par statut : rouge (`border-red-500 text-red-500`) = non commandées, orange (`border-amber-500 text-amber-500`) = commandées, vert (`border-green-500 text-green-500`) = façonnées
  - [x] 5.4 Label du badge : "Plinthes: Non cmd" / "Plinthes: Cmd" / "Plinthes: Faç." — compact pour la carte
  - [x] 5.5 Combiner avec le badge TMA existant (les deux peuvent coexister via un fragment React)
  - [x] 5.6 Mettre à jour les tests de la vue étage

- [x] Task 6 — Tests de régression (AC: #1-4)
  - [x] 6.1 `npm run test` — tous les tests existants + nouveaux passent
  - [x] 6.2 `npm run lint` — 0 nouvelles erreurs
  - [x] 6.3 `npm run build` — 0 nouvelles erreurs tsc

## Dev Notes

### Vue d'ensemble — Stratégie d'implémentation

Cette story est la **deuxième de l'Epic 7** et implémente le **suivi du statut des plinthes** (FR60). Elle ajoute un champ enum `plinth_status` sur la table `lots`, avec un sélecteur dans la vue détail lot et un badge coloré dans la grille de lots.

**Scope précis :**
- Enum PostgreSQL `plinth_status` avec 3 valeurs : `non_commandees`, `commandees`, `faconnees`
- Colonne `plinth_status` sur `lots` (NOT NULL, DEFAULT `non_commandees`)
- Sélecteur Select dans la vue détail lot (conditionnel : uniquement si `metrage_ml_total > 0`)
- Badge visuel coloré sur la StatusCard dans la grille de lots (même condition)
- Mutation optimiste suivant le pattern exact de `useToggleLotTma`

**Hors scope (Story 7.3) :**
- Indicateurs intelligents : lots prêts à carreler, croisement inventaire/métrés (FR61-FR64)

**Décision architecturale — Pas de triggers, pas d'agrégation :**
Contrairement aux métrés (Story 7.1) qui agrègent de pieces → lots → plots via triggers, le `plinth_status` est un **attribut direct du lot** défini manuellement par l'utilisateur. Pas de cascade, pas de trigger. C'est le même pattern que `is_tma` (Story 2.6) — un champ simple mis à jour via mutation optimiste.

**Décision — Enum PostgreSQL vs TEXT :**
Utiliser un **type enum PostgreSQL** (et non un TEXT avec CHECK constraint). Les 3 valeurs sont fixes et métier. Un enum assure l'intégrité côté DB et permet une évolution contrôlée (ALTER TYPE ... ADD VALUE). C'est cohérent avec les enums existants (`chantier_type`, `task_status`, `delivery_status`).

### Ce qui existe déjà (à réutiliser, NE PAS recréer)

| Élément | Fichier | Notes |
|---------|---------|-------|
| Pattern mutation lot (référence) | `src/lib/mutations/useToggleLotTma.ts` | **Pattern EXACT à reproduire** : mutation optimiste sur `['lots', plotId]`, rollback, invalidation |
| Test mutation lot (référence) | `src/lib/mutations/useToggleLotTma.test.ts` | **Structure EXACTE à reproduire** : 4 tests (mutationFn, optimistic, rollback, invalidation) |
| `useLots(plotId)` | `src/lib/queries/useLots.ts` | `.select('*, etages(nom), variantes(nom), pieces(count)')` — `plinth_status` sera inclus automatiquement par `*` |
| `LotWithRelations` | `src/lib/queries/useLots.ts` | Type existant — enrichi par `LotRow` via `database.ts`. Pas de modification nécessaire. |
| `StatusCard` | `src/components/StatusCard.tsx` | Prop `badge?: ReactNode` déjà supportée — utilisée pour TMA. Pas de modification du composant. |
| `Badge` | `src/components/ui/badge.tsx` | Badge shadcn avec `variant="outline"` — pattern TMA existant |
| `Select` / `SelectContent` / `SelectItem` | `src/components/ui/select.tsx` | Composant Select shadcn déjà installé — utilisé dans la vue lot detail pour "Ajouter une tâche" |
| `Switch` + TMA toggle | Vue lot detail `$lotId/index.tsx` lignes ~283-297 | Placement de référence — le Select plinthes va juste après |
| Enums TS | `src/types/enums.ts` | Pattern : `const + as const` + type extraction via `typeof`. Ex: `TaskStatus`, `ChantierType`, `DeliveryStatus` |
| `formatMetrage()` | `src/lib/utils/formatMetrage.ts` | Utilitaire story 7.1 — pour vérifier si ML > 0 sur les cartes |
| Vue lot detail | `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx` | Écran cible — ajouter Select plinthes après le Switch TMA |
| Vue étage (grille lots) | `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx` | Écran cible — ajouter badge plinthes sur StatusCard |

### Migration SQL : 020_plinth_status.sql

```sql
-- Story 7.2 : Suivi du statut des plinthes

-- =====================
-- ENUM plinth_status
-- =====================
CREATE TYPE public.plinth_status AS ENUM ('non_commandees', 'commandees', 'faconnees');

-- =====================
-- COLONNE plinth_status sur lots
-- =====================
ALTER TABLE public.lots ADD COLUMN plinth_status public.plinth_status NOT NULL DEFAULT 'non_commandees';
```

**Points clés migration :**
- `NOT NULL DEFAULT 'non_commandees'` — tous les lots existants reçoivent la valeur par défaut. Pas de backfill nécessaire.
- Pas d'index sur `plinth_status` — pas de requête qui filtre par ce champ (contrairement à `task_status` utilisé dans les agrégations).
- Enum créé dans le namespace `public` — cohérent avec les types existants.
- Migration volontairement minimaliste — pas de trigger, pas d'agrégation.

### Types TypeScript — Modifications

**`src/types/enums.ts` — ajouter :**
```typescript
export const PlinthStatus = {
  NON_COMMANDEES: 'non_commandees',
  COMMANDEES: 'commandees',
  FACONNEES: 'faconnees',
} as const

export type PlinthStatus = (typeof PlinthStatus)[keyof typeof PlinthStatus]
```

**`src/types/database.ts` — modifier lots :**
```typescript
lots: {
  Row: {
    // ... colonnes existantes (id, etage_id, variante_id, plot_id, code, is_tma, ...)
    plinth_status: string  // ← NOUVEAU — 'non_commandees' | 'commandees' | 'faconnees'
  }
  Insert: {
    // ... champs existants
    plinth_status?: string  // ← NOUVEAU (optionnel, DEFAULT côté DB)
  }
  Update: {
    // ... champs existants
    plinth_status?: string  // ← NOUVEAU
  }
  Relationships: []  // CRITICAL: ne pas oublier (MEMORY.md)
}
```

**IMPORTANT** : Utiliser `string` dans database.ts (pas le type union) car Supabase retourne un string brut. Le typage précis se fait via `PlinthStatus` dans le code applicatif.

### Mutation : useUpdatePlinthStatus

```typescript
// src/lib/mutations/useUpdatePlinthStatus.ts
// Copie EXACTE du pattern useToggleLotTma — seule la propriété change

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { LotWithRelations } from '@/lib/queries/useLots'
import type { PlinthStatus } from '@/types/enums'

interface UpdatePlinthStatusParams {
  lotId: string
  plinthStatus: PlinthStatus
  plotId: string
}

export function useUpdatePlinthStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lotId, plinthStatus }: UpdatePlinthStatusParams) => {
      const { data, error } = await supabase
        .from('lots')
        .update({ plinth_status: plinthStatus })
        .eq('id', lotId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ lotId, plinthStatus, plotId }) => {
      await queryClient.cancelQueries({ queryKey: ['lots', plotId] })
      const previous = queryClient.getQueryData<LotWithRelations[]>(['lots', plotId])
      queryClient.setQueryData<LotWithRelations[]>(
        ['lots', plotId],
        (old) =>
          (old ?? []).map((lot) =>
            lot.id === lotId ? { ...lot, plinth_status: plinthStatus } : lot,
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

**Points clés :**
- Pattern **identique** à `useToggleLotTma` — même structure, même query key, même rollback
- Pas de toast dans la mutation — le changement de Select est son propre feedback visuel
- `PlinthStatus` importé de `enums.ts` pour typage strict des params

### UI Vue détail lot — Sélecteur statut plinthes

**Fichier :** `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx`

**Placement dans le layout existant :**
```
<header> Lot {code} [Badge TMA] </header>
<BreadcrumbNav />
<div className="px-4 py-2">
  <p> Variante · Étage </p>
  <div> TMA <Switch /> </div>
  ── INSERTION ICI ──────────────
  <div> Statut plinthes <Select /> </div>   ← NOUVEAU (conditionnel)
  ────────────────────────────────
</div>
<div className="border-t" />
<div> Pièces (...) </div>
```

**Code à ajouter après le Switch TMA (~ligne 297) :**
```tsx
{lot.metrage_ml_total > 0 && (
  <div className="flex items-center gap-2 mt-2">
    <label
      htmlFor="plinth-select"
      className="text-sm font-medium text-foreground"
    >
      Plinthes
    </label>
    <Select
      value={lot.plinth_status}
      onValueChange={(value) =>
        updatePlinthStatus.mutate({
          lotId,
          plinthStatus: value as PlinthStatus,
          plotId,
        })
      }
    >
      <SelectTrigger id="plinth-select" className="w-[180px] h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="non_commandees">Non commandées</SelectItem>
        <SelectItem value="commandees">Commandées</SelectItem>
        <SelectItem value="faconnees">Façonnées</SelectItem>
      </SelectContent>
    </Select>
  </div>
)}
```

**Points clés UI lot detail :**
- **Conditionnel** sur `lot.metrage_ml_total > 0` — masqué complètement sinon (AC #4)
- `Select` déjà importé dans le fichier (utilisé pour "Ajouter une tâche" → sélection pièce)
- `PlinthStatus` à importer depuis `@/types/enums`
- `useUpdatePlinthStatus` à importer et instancier : `const updatePlinthStatus = useUpdatePlinthStatus()`
- Style cohérent avec le Switch TMA : même `flex items-center gap-2 mt-2`, label en `text-sm font-medium`
- `w-[180px]` pour le trigger — largeur suffisante pour "Non commandées" (le plus long label)
- `h-9` (36px) — compact mais tactile (zone touch 48px avec padding)

### UI Grille lots — Badge statut plinthes sur StatusCard

**Fichier :** `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx`

**Code actuel du badge TMA (~lignes 155-162) :**
```tsx
badge={
  lot.is_tma ? (
    <Badge variant="outline" className="border-amber-500 text-amber-500 text-[10px]">
      TMA
    </Badge>
  ) : undefined
}
```

**Code à remplacer — combinaison TMA + Plinthes :**
```tsx
badge={
  <>
    {lot.is_tma && (
      <Badge variant="outline" className="border-amber-500 text-amber-500 text-[10px]">
        TMA
      </Badge>
    )}
    {lot.metrage_ml_total > 0 && lot.plinth_status !== 'non_commandees' && (
      <Badge
        variant="outline"
        className={`text-[10px] ${
          lot.plinth_status === 'commandees'
            ? 'border-amber-500 text-amber-500'
            : 'border-green-500 text-green-500'
        }`}
      >
        {lot.plinth_status === 'commandees' ? 'Cmd' : 'Faç.'}
      </Badge>
    )}
  </>
}
```

**Mapping des couleurs par statut :**

| Statut | Couleur | Classe Tailwind | Badge label | Affiché ? |
|--------|---------|----------------|-------------|-----------|
| `non_commandees` | — | — | — | **NON** (pas de badge — c'est l'état par défaut, pas d'info utile) |
| `commandees` | Orange | `border-amber-500 text-amber-500` | `Cmd` | OUI si ML > 0 |
| `faconnees` | Vert | `border-green-500 text-green-500` | `Faç.` | OUI si ML > 0 |

**Décision UX — Pas de badge pour `non_commandees` :**
Le statut par défaut "non commandées" ne donne aucune information utile sur la carte — c'est l'absence de commande. Seuls les statuts actifs (commandées, façonnées) méritent un indicateur visuel. Cela réduit le bruit sur la grille et met en valeur les lots où une action a été prise.

**Points clés UI grille :**
- Fragment React `<>...</>` pour combiner TMA + plinthes (les deux badges peuvent coexister)
- Badge plinthes conditionnel : `metrage_ml_total > 0` ET `plinth_status !== 'non_commandees'`
- Labels compacts : "Cmd" et "Faç." — la grille a peu d'espace horizontal
- Même `variant="outline"` et `text-[10px]` que TMA pour cohérence visuelle
- Pas besoin de modifier `StatusCard.tsx` — la prop `badge` accepte déjà un `ReactNode`

### Tests — Stratégie et patterns

**Nouveaux fichiers de test (1) :**
- `src/lib/mutations/useUpdatePlinthStatus.test.ts`

**Fichiers de test à modifier (2) :**
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.test.tsx` — tests Select plinthes
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.test.tsx` — tests badge plinthes

**Test mutation `useUpdatePlinthStatus.test.ts` — copier `useToggleLotTma.test.ts` :**

Structure exacte à reproduire (4 tests) :
```typescript
describe('useUpdatePlinthStatus', () => {
  it('calls supabase update with correct params', async () => {
    // Vérifie: .from('lots').update({ plinth_status: 'commandees' }).eq('id', lotId)
  })

  it('optimistically updates cache', async () => {
    // Vérifie: queryClient.getQueryData(['lots', plotId]) a le lot mis à jour
  })

  it('rolls back cache on error', async () => {
    // Vérifie: après erreur, le cache revient à l'état précédent
  })

  it('invalidates lots query on settled', async () => {
    // Vérifie: invalidateQueries appelé avec ['lots', plotId]
  })
})
```

**Pattern de mock Supabase (identique à useToggleLotTma.test.ts) :**
```typescript
function mockSupabaseUpdate(data: unknown) {
  const mockSingle = vi.fn().mockResolvedValue({ data, error: null })
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
  const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)
  return { mockUpdate, mockEq, mockSelect, mockSingle }
}
```

**Mock data lot — ajouter `plinth_status` dans TOUS les mocks lots existants :**
```typescript
// Dans chaque test qui mock des lots, ajouter :
{
  id: 'lot-1',
  code: '101',
  // ... champs existants
  plinth_status: 'non_commandees',  // ← NOUVEAU — valeur par défaut
  metrage_ml_total: 8.2,            // ← déjà présent depuis story 7.1
  metrage_m2_total: 12.5,           // ← déjà présent depuis story 7.1
}
```

**Tests vue lot detail — ajouter :**
```typescript
it('shows plinth status selector when metrage_ml_total > 0', async () => {
  // Mock lot avec metrage_ml_total: 8.2
  // Vérifier que le Select "Plinthes" est rendu
})

it('hides plinth status selector when metrage_ml_total is 0', async () => {
  // Mock lot avec metrage_ml_total: 0
  // Vérifier que le Select "Plinthes" n'est PAS rendu
})

it('calls updatePlinthStatus on select change', async () => {
  // Mock lot avec metrage_ml_total: 8.2, plinth_status: 'non_commandees'
  // Simuler changement Select → 'commandees'
  // Vérifier mutation appelée
})
```

**Tests vue étage (grille) — ajouter :**
```typescript
it('shows plinth badge when metrage_ml_total > 0 and status is not non_commandees', async () => {
  // Mock lot avec metrage_ml_total: 8.2, plinth_status: 'commandees'
  // Vérifier badge "Cmd" présent
})

it('hides plinth badge when metrage_ml_total is 0', async () => {
  // Mock lot avec metrage_ml_total: 0, plinth_status: 'commandees'
  // Vérifier badge plinthes absent
})

it('hides plinth badge when status is non_commandees', async () => {
  // Mock lot avec metrage_ml_total: 8.2, plinth_status: 'non_commandees'
  // Vérifier badge plinthes absent
})
```

**Pre-existing test failures** (ne PAS essayer de corriger) :
- pwa-config : 5 failures
- pwa-html : 5 failures
- hasPointerCapture : 6 failures
- Total pré-existant : 16 failures

### Learnings de la Story 7.1 (précédente)

- **Triggers agrégation (019_metrage.sql)** : Pattern cascade éprouvé pieces → lots → etages → plots. Story 7.2 n'a PAS besoin de triggers — le `plinth_status` est un champ direct du lot, pas une valeur agrégée.
- **Types database.ts** : TOUJOURS inclure `Relationships: []` sur chaque table (MEMORY.md). Story 7.1 a aussi corrigé `Views/Functions/CompositeTypes` vers `{ [_ in never]: never }` — s'assurer que c'est toujours en place.
- **Cast pattern** : `data as unknown as LotWithRelations[]` dans `useLots.ts` — le `plinth_status` sera automatiquement inclus dans le cast via `LotRow` enrichi.
- **`formatMetrage()`** extrait en utilitaire partagé (`src/lib/utils/formatMetrage.ts`) lors du code review 7.1 — réutilisable pour vérifier `metrage_ml_total > 0`.
- **Code review 7.1** : 3 MEDIUM corrigés — (M1) extraction utilitaire partagé, (M2) ajout `chantierId` à mutation + invalidation plots, (M3) key MetrageSection. Pour story 7.2, le `useUpdatePlinthStatus` n'a pas besoin de `chantierId` car il invalide seulement `['lots', plotId]` (pas de cascade).
- **Pre-existing issues** : 16 test failures pré-existants (pwa 10, hasPointerCapture 6), lint error ThemeProvider.tsx:64, erreurs TS pré-existantes database.ts.
- **Input decimals mobile** : `inputMode="decimal"` story 7.1. Non applicable à story 7.2 (Select, pas Input).

### Project Structure Notes

**Nouveaux fichiers (2) :**
- `supabase/migrations/020_plinth_status.sql`
- `src/lib/mutations/useUpdatePlinthStatus.ts`
- `src/lib/mutations/useUpdatePlinthStatus.test.ts`

**Fichiers modifiés (4+) :**
- `src/types/enums.ts` — ajout `PlinthStatus` const + type
- `src/types/database.ts` — ajout `plinth_status` dans lots Row/Insert/Update
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx` — Select statut plinthes conditionnel
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx` — badge plinthes sur StatusCard
- Tests associés à mettre à jour (mock data lots + nouveaux tests)

**Fichiers NON modifiés (important — ne PAS toucher) :**
- `src/components/StatusCard.tsx` — la prop `badge` est déjà suffisante, pas de nouvelle prop
- `src/lib/queries/useLots.ts` — le `select('*')` inclut déjà `plinth_status` automatiquement
- `src/lib/subscriptions/useRealtimeLots.ts` — les subscriptions existantes propagent les changements
- `supabase/migrations/010_aggregation_triggers.sql` — pas de trigger à ajouter

**Alignement structure :**
- Mutation dans `lib/mutations/` — convention respectée
- Enum dans `types/enums.ts` — convention respectée
- Pas de nouveau query hook — le champ est inclus dans le `select('*')` existant
- Pas de subscription spécifique — les changements de statut sont rares, l'invalidation via `onSettled` suffit

### Risques et points d'attention

1. **Enum PostgreSQL et Supabase JS** : Supabase retourne les valeurs d'enum comme `string`. Le type dans `database.ts` doit être `string` (pas `PlinthStatus`). Le typage strict se fait dans le code applicatif via cast `as PlinthStatus` ou import du type.

2. **Migration enum PostgreSQL** : Les enums Postgres ne permettent pas de supprimer des valeurs facilement. Les 3 valeurs choisies (`non_commandees`, `commandees`, `faconnees`) sont définitives. Si besoin futur d'ajouter un statut, c'est possible via `ALTER TYPE plinth_status ADD VALUE 'nouveau_statut'`.

3. **Badge overflow sur StatusCard** : Avec TMA + plinthes, deux badges côte à côte sur la carte. La StatusCard a suffisamment d'espace horizontal (testé avec les badges existants TMA + docs manquants). Si la largeur est insuffisante sur très petits écrans, les badges wrappent naturellement grâce au flex layout.

4. **Cohérence metrage_ml_total** : Le champ `metrage_ml_total` sur `lots` est `NOT NULL DEFAULT 0` (migration 019). La condition `lot.metrage_ml_total > 0` est fiable — jamais `null`, toujours un nombre.

5. **Select value initiale** : `lot.plinth_status` est `NOT NULL DEFAULT 'non_commandees'` — le Select a toujours une valeur définie, pas besoin de placeholder ni de gestion du cas `null`.

6. **Pre-existing issues** : Mêmes que story 7.1 — 16 test failures pré-existants, lint error ThemeProvider.tsx:64.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 7.2, Epic 7, FR60]
- [Source: _bmad-output/planning-artifacts/prd.md — FR60 suivi statut plinthes commandées/façonnées]
- [Source: _bmad-output/planning-artifacts/architecture.md — §Naming conventions snake_case DB, §Mutation optimiste pattern, §Query keys convention]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — §StatusCard anatomie, §Couleurs sémantiques, §Badge outline pattern]
- [Source: _bmad-output/implementation-artifacts/7-1-saisie-et-agregation-des-metres.md — Learnings mutations, types Relationships:[], formatMetrage utility, pre-existing issues]
- [Source: src/lib/mutations/useToggleLotTma.ts — Pattern EXACT mutation lot optimiste]
- [Source: src/lib/mutations/useToggleLotTma.test.ts — Pattern EXACT test mutation lot]
- [Source: src/types/enums.ts — Pattern const + as const + type extraction]
- [Source: src/types/database.ts — Types lots Row/Insert/Update avec Relationships:[]]
- [Source: src/lib/queries/useLots.ts — Query lots avec select('*'), type LotWithRelations]
- [Source: src/components/StatusCard.tsx — Prop badge?: ReactNode, prop secondaryInfo]
- [Source: src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx — Vue lot detail, Switch TMA placement]
- [Source: src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx — Vue étage, badge TMA sur StatusCard]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Radix UI Select nécessite polyfills JSDOM (`hasPointerCapture`, `setPointerCapture`, `releasePointerCapture`, `scrollIntoView`) pour les tests d'interaction — ajoutés dans le fichier de test lot detail.

### Completion Notes List

- ✅ Task 1: Migration SQL `020_plinth_status.sql` — enum `plinth_status` + colonne sur `lots` avec DEFAULT `non_commandees`
- ✅ Task 2: Types TS — `PlinthStatus` const/type dans `enums.ts`, `plinth_status: string` dans `database.ts` (Row/Insert/Update + Enums)
- ✅ Task 3: Mutation `useUpdatePlinthStatus` — pattern identique à `useToggleLotTma`, 4 tests passent (mutationFn, optimistic, rollback, invalidation)
- ✅ Task 4: Vue détail lot — Select conditionnel (`metrage_ml_total > 0`) après Switch TMA, 3 nouveaux tests (affichage, masquage, changement statut), 22/22 tests passent
- ✅ Task 5: Grille lots — Badge conditionnel (Fragment React TMA + plinthes), 3 couleurs AC#3 (rouge/orange/vert), 4 nouveaux tests, 23/23 tests passent
- ✅ Task 6: Régression — 876 tests passent, 16 failures pré-existants (pwa 10, hasPointerCapture 6), 0 nouvelle erreur lint, 0 nouvelle erreur tsc

### Change Log

- 2026-02-12: Story 7.2 implémentée — suivi statut plinthes (enum, mutation, Select détail lot, badge grille)
- 2026-02-12: Code review — 3 fixes appliqués (H1: badge rouge AC#3, M1: constantes PlinthStatus, M2: mocks test complets)

### File List

**Nouveaux fichiers :**
- `supabase/migrations/020_plinth_status.sql`
- `src/lib/mutations/useUpdatePlinthStatus.ts`
- `src/lib/mutations/useUpdatePlinthStatus.test.ts`

**Fichiers modifiés :**
- `src/types/enums.ts` — ajout PlinthStatus
- `src/types/database.ts` — ajout plinth_status dans lots Row/Insert/Update + Enums section
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx` — Select plinthes conditionnel
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.test.tsx` — 3 tests plinthes + polyfills JSDOM
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx` — badge plinthes sur StatusCard
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.test.tsx` — 4 tests badge plinthes + plinth_status dans mocks
