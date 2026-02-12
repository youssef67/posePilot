# Story 5.2: Types de documents personnalisés et gestion par lot

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux définir des types de documents personnalisés et gérer les documents par lot,
Afin que chaque lot ait exactement les documents nécessaires selon sa situation.

## Acceptance Criteria

1. **Given** un lot affiche sa liste de documents **When** l'utilisateur consulte la vue documents **Then** les documents hérités de la variante ET les documents ajoutés au lot sont affichés dans une liste unifiée

2. **Given** l'utilisateur veut ajouter un nouveau type de document au lot **When** il tape "Ajouter un document" **Then** il peut saisir un nom libre (ex: "Relevé acoustique") pour créer un nouveau slot

3. **Given** un slot de document existe **When** l'utilisateur consulte ses propriétés **Then** il voit si le document est marqué comme obligatoire ou optionnel

4. **Given** l'utilisateur veut modifier le statut obligatoire/optionnel d'un document lot **When** il tape sur le badge "Obligatoire"/"Optionnel" dans le DocumentSlot **Then** le statut bascule (toggle) et la modification est persistée en base

5. **Given** aucun document n'est défini ni hérité pour un lot **When** l'utilisateur consulte la vue documents **Then** aucune contrainte n'est imposée — zéro document requis par défaut

## Tasks / Subtasks

- [x] Task 1 — Mutation useToggleLotDocumentRequired : toggle is_required sur lot_documents (AC: #4)
  - [x] 1.1 Créer `src/lib/mutations/useToggleLotDocumentRequired.ts`
  - [x] 1.2 Input : `{ docId: string, isRequired: boolean, lotId: string }`
  - [x] 1.3 Appeler `supabase.from('lot_documents').update({ is_required: isRequired }).eq('id', docId)`
  - [x] 1.4 Mutation optimiste : mettre à jour le cache `['lot-documents', lotId]` via `onMutate`
  - [x] 1.5 Rollback sur erreur via `onError`, toast d'erreur
  - [x] 1.6 `onSettled` : invalider `['lot-documents', lotId]`
  - [x] 1.7 Créer `src/lib/mutations/useToggleLotDocumentRequired.test.ts` — 4 tests (toggle true→false, false→true, erreur + rollback, query invalidation)

- [x] Task 2 — UI DocumentSlot : badge cliquable pour toggler obligatoire/optionnel (AC: #3, #4)
  - [x] 2.1 Modifier `src/components/DocumentSlot.tsx`
  - [x] 2.2 Ajouter prop optionnelle `onToggleRequired?: (docId: string, isRequired: boolean) => void` OU intégrer `useToggleLotDocumentRequired` directement dans le composant
  - [x] 2.3 Rendre le Badge "Obligatoire"/"Optionnel" cliquable (bouton) avec curseur pointer
  - [x] 2.4 Au tap sur le badge : appeler la mutation toggle avec la valeur inversée (`!doc.is_required`)
  - [x] 2.5 Feedback visuel immédiat (mutation optimiste — le badge change instantanément)
  - [x] 2.6 Zone tactile du badge minimum 32px de hauteur (le badge est petit, envelopper dans un bouton avec padding)
  - [x] 2.7 Mettre à jour `src/components/DocumentSlot.test.tsx` — ajouter 2-3 tests (tap badge toggle, état visuel après toggle, erreur toast)

- [x] Task 3 — Fix texte état vide page lot (AC: #5)
  - [x] 3.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx`
  - [x] 3.2 Remplacer "Aucun document hérité" par "Aucun document" (le lot peut avoir des documents ajoutés manuellement, pas seulement hérités)

- [x] Task 4 — Tests de régression (AC: #1-5)
  - [x] 4.1 Lancer `npm run test` — tous les tests existants + nouveaux passent
  - [x] 4.2 Lancer `npm run lint` — 0 nouvelles erreurs (ThemeProvider.tsx:64 pré-existante tolérée)
  - [x] 4.3 Lancer `npm run build` — build propre

## Dev Notes

### Contexte critique — Ce qui existe DÉJÀ (NE PAS recréer)

Cette story est principalement un **complément** à du code existant. La majorité des AC (1, 2, 3, 5) sont déjà fonctionnels. Le seul travail de dev est l'**AC4 : toggle is_required sur lot_documents**.

**Code existant à NE PAS toucher (sauf modification explicite dans les tasks) :**
- `src/lib/queries/useLotDocuments.ts` — query hook fonctionnel, queryKey `['lot-documents', lotId]`
- `src/lib/mutations/useAddLotDocument.ts` — crée un slot avec `is_required: false` + nom libre
- `src/lib/mutations/useUploadLotDocument.ts` — upload PDF vers Storage
- `src/lib/mutations/useReplaceLotDocument.ts` — remplacement PDF
- `src/lib/utils/documentStorage.ts` — signed URLs + download
- `src/lib/mutations/useToggleDocumentRequired.ts` — **ATTENTION : opère sur variante_documents, PAS lot_documents**. Ne PAS modifier ce fichier. Créer un NOUVEAU hook `useToggleLotDocumentRequired`.

### Architecture du toggle lot_documents

**Pourquoi un nouveau hook plutôt que réutiliser `useToggleDocumentRequired` :**
1. `useToggleDocumentRequired` opère sur la table `variante_documents` (pas `lot_documents`)
2. Il invalide `['variante-documents', varianteId]` (mauvaise query key)
3. La séparation variante vs lot est intentionnelle — modifier un lot ne doit JAMAIS affecter la variante

**Pattern mutation optimiste standard (identique aux autres hooks du projet) :**

```typescript
// src/lib/mutations/useToggleLotDocumentRequired.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface ToggleLotDocumentRequiredInput {
  docId: string
  isRequired: boolean
  lotId: string
}

export function useToggleLotDocumentRequired() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ docId, isRequired }: ToggleLotDocumentRequiredInput) => {
      const { data, error } = await supabase
        .from('lot_documents')
        .update({ is_required: isRequired } as Record<string, unknown>)
        .eq('id', docId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ docId, isRequired, lotId }) => {
      await queryClient.cancelQueries({ queryKey: ['lot-documents', lotId] })
      const previous = queryClient.getQueryData(['lot-documents', lotId])
      queryClient.setQueryData(['lot-documents', lotId], (old: unknown[]) =>
        old?.map((d: { id: string }) =>
          d.id === docId ? { ...d, is_required: isRequired } : d
        )
      )
      return { previous, lotId }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['lot-documents', context.lotId], context.previous)
      }
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la modification')
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lot-documents', variables?.lotId] })
    },
  })
}
```

**Note :** Le cast `as Record<string, unknown>` est nécessaire car `Database.Tables` utilise `Record<string, never>` qui casse l'inférence de types. Pattern établi dans `useUploadLotDocument` et `useReplaceLotDocument`.

### UI DocumentSlot — Modification du badge

**Avant (code actuel dans DocumentSlot.tsx) :**
```tsx
<Badge variant={doc.is_required ? 'default' : 'secondary'} className="text-[10px]">
  {doc.is_required ? 'Obligatoire' : 'Optionnel'}
</Badge>
```

**Après :**
```tsx
<button
  type="button"
  onClick={(e) => {
    e.stopPropagation()
    toggleRequired.mutate({ docId: doc.id, isRequired: !doc.is_required, lotId })
  }}
  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
>
  <Badge variant={doc.is_required ? 'default' : 'secondary'} className="text-[10px] cursor-pointer">
    {doc.is_required ? 'Obligatoire' : 'Optionnel'}
  </Badge>
</button>
```

**Points d'attention UI :**
- `e.stopPropagation()` est CRITIQUE — sans lui, le tap sur le badge déclencherait aussi l'action parent (upload pour slot vide, ouverture PDF pour slot rempli)
- Le bouton wrapper assure l'accessibilité (focus-visible ring)
- La mutation optimiste rend le changement instantané (< 300ms, NFR3)
- Pas de confirmation dialog — c'est une action terrain courante, pas destructive (cf. UX spec : "Pas de confirmation sur actions terrain courantes")

### Fix texte état vide

**Avant (lot page, section documents) :**
```tsx
<p className="text-sm text-muted-foreground">
  Aucun document hérité
</p>
```

**Après :**
```tsx
<p className="text-sm text-muted-foreground">
  Aucun document
</p>
```

### Schéma DB — Aucune migration nécessaire

La table `lot_documents` a déjà :
- `is_required BOOLEAN NOT NULL DEFAULT false` (depuis migration 007)
- `file_url TEXT DEFAULT NULL` (depuis migration 014)
- `file_name TEXT DEFAULT NULL` (depuis migration 014)
- RLS policy `FOR ALL` sur `lot_documents` pour authenticated (couvre SELECT, INSERT, UPDATE, DELETE)

**Aucune migration SQL à ajouter pour cette story.**

### Project Structure Notes

**Nouveaux fichiers (2) :**
- `src/lib/mutations/useToggleLotDocumentRequired.ts` — Mutation toggle
- `src/lib/mutations/useToggleLotDocumentRequired.test.ts` — Tests mutation

**Fichiers modifiés (2) :**
- `src/components/DocumentSlot.tsx` — Badge cliquable + import hook toggle
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx` — Fix texte "Aucun document"

**Tests modifiés (1) :**
- `src/components/DocumentSlot.test.tsx` — Ajout tests badge toggle

### Tests — Pattern mock Supabase pour le toggle

```typescript
// Pattern pour useToggleLotDocumentRequired.test.ts
const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { id: 'doc-1', is_required: true },
        error: null,
      }),
    }),
  }),
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ update: mockUpdate }),
  },
}))
```

**Pour les tests DocumentSlot.test.tsx :**
- Mocker `useToggleLotDocumentRequired` qui retourne `{ mutate: vi.fn(), isPending: false }`
- Simuler le tap sur le badge et vérifier que `mutate` est appelé avec les bons arguments
- Vérifier que `e.stopPropagation()` empêche l'action parent (important pour slots remplis)

### Prérequis et dépendances

- **Aucune dépendance npm externe à ajouter**
- **Tables existantes** : `lot_documents` (007 + 014), `lots`, `etages`, `plots`, `chantiers`
- **Composants shadcn existants** : `Badge` (déjà utilisé dans DocumentSlot)
- **Story 5.1 DOIT être terminée** avant cette story (elle l'est — status: done)

### Risques et points d'attention

1. **`e.stopPropagation()` oubli** : Si le dev oublie le stopPropagation sur le bouton badge, le tap déclenchera AUSSI l'upload (slot vide) ou l'ouverture PDF (slot rempli). Tester manuellement.

2. **Mutation optimiste sur le badge** : Le cache `['lot-documents', lotId]` est un tableau. Le `setQueryData` dans `onMutate` doit mapper sur le bon `doc.id`. Pattern identique à `useUpdateTaskStatus`.

3. **Cast `as Record<string, unknown>`** : Nécessaire pour le `.update()` Supabase à cause des types `Database.Tables` qui utilisent `Record<string, never>`. Ne PAS essayer de contourner avec des types manuels — utiliser le même cast que les autres mutations.

4. **Pre-existing issues** : 16 test failures pré-existants (pwa-config 5, pwa-html 5, hasPointerCapture 6), lint error ThemeProvider.tsx:64 — ne pas s'en inquiéter.

### Learnings des stories précédentes (relevants)

- **Mock supabase chainable API** : `from → update → eq → select → single` chaque appel retourne un mock avec la méthode suivante. Pattern établi dans tous les tests.
- **`data as unknown as Type[]`** : Cast nécessaire car `Database.Tables` utilise `Record<string, never>`.
- **Mutation optimiste standard** : `onMutate` (cancel + snapshot + optimistic update) → `onError` (rollback) → `onSettled` (invalidate). Pattern dans chaque mutation du projet.
- **Badge import** : `// eslint-disable-next-line react-refresh/only-export-components` si nécessaire (voir button.tsx).
- **Sonner toast** : `toast.success()` / `toast.error()` — le projet utilise sonner avec le theme provider custom.
- **Route tests** : `createRouter` + `createMemoryHistory` + `RouterProvider` + `QueryClientProvider` + `AuthContext.Provider`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 5.2, Epic 5, FR37, FR38, FR39, FR40, FR43]
- [Source: _bmad-output/planning-artifacts/architecture.md — Supabase Client SDK direct, TanStack Query mutations optimistes, naming patterns, snake_case DB]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Zones tactiles 48px+, pas de confirmation sur actions terrain courantes]
- [Source: _bmad-output/implementation-artifacts/5-1-upload-visualisation-et-gestion-de-documents-pdf.md — DocumentSlot anatomy, mock patterns, Storage conventions, pre-existing issues]
- [Source: src/lib/mutations/useToggleDocumentRequired.ts — VARIANTE toggle (ne PAS réutiliser pour lot)]
- [Source: src/lib/mutations/useAddLotDocument.ts — Pattern création slot avec is_required: false]
- [Source: src/components/DocumentSlot.tsx — Composant actuel avec Badge non-cliquable]
- [Source: src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx — Page lot, section documents, texte "Aucun document hérité"]
- [Source: supabase/migrations/007_lots.sql — Table lot_documents, héritage create_lot_with_inheritance, RLS FOR ALL]
- [Source: supabase/migrations/014_lot_documents_file.sql — Colonnes file_url/file_name ajoutées]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun problème de debug rencontré.

### Completion Notes List

- ✅ Task 1 : Hook `useToggleLotDocumentRequired` créé — mutation optimiste complète (onMutate/onError/onSettled), cast `as Record<string, unknown>` pour contourner les types Database. 4 tests passent (toggle true→false, false→true, rollback erreur + toast, invalidation query).
- ✅ Task 2 : Badge "Obligatoire"/"Optionnel" rendu cliquable dans DocumentSlot via bouton wrapper. `e.stopPropagation()` empêche déclenchement action parent. `useToggleLotDocumentRequired` intégré directement dans le composant. 3 tests ajoutés (tap toggle, badge bouton présent, stopPropagation).
- ✅ Task 3 : Texte "Aucun document hérité" remplacé par "Aucun document" dans la page lot.
- ✅ Task 4 : Suite complète — 632 tests passent, 16 échecs pré-existants (pwa-config 5, pwa-html 5, hasPointerCapture 6). Lint 0 nouvelles erreurs. TypeScript build propre.

### Change Log

- 2026-02-11 : Story 5.2 implémentée — toggle is_required sur lot_documents, badge cliquable DocumentSlot, fix texte état vide
- 2026-02-11 : Code review — 6 issues corrigées (touch target badge 32px, aria-label/aria-pressed, type safety setQueryData, optional chaining, cursor-pointer redondant, test état vide documents)

### File List

**Nouveaux fichiers :**
- `src/lib/mutations/useToggleLotDocumentRequired.ts`
- `src/lib/mutations/useToggleLotDocumentRequired.test.ts`

**Fichiers modifiés :**
- `src/components/DocumentSlot.tsx`
- `src/components/DocumentSlot.test.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.test.tsx` (ajout test état vide documents)
