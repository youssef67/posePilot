# Story 2.3: Documents par défaut dans les variantes

Status: done
Story ID: 2.3
Story Key: 2-3-documents-par-defaut-dans-les-variantes
Epic: 2 — Configuration & Structure de chantier
Date: 2026-02-09
Dependencies: Story 2.2 (done)
FRs: FR16, FR43

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux définir les types de documents attendus par défaut dans chaque variante,
Afin que les lots sachent quels documents sont nécessaires dès leur création.

## Acceptance Criteria (BDD)

### AC1: Ajouter des types de documents à une variante

**Given** une variante existe
**When** l'utilisateur accède à la configuration des documents de la variante
**Then** il peut ajouter des types de documents avec un nom libre (ex: "Plan de pose", "Fiche de choix")

### AC2: Marquer un document comme obligatoire ou optionnel

**Given** un type de document est défini
**When** l'utilisateur configure le document
**Then** il peut le marquer comme obligatoire ou optionnel

### AC3: Zéro contrainte par défaut

**Given** aucun document n'est défini dans la variante
**When** l'utilisateur consulte la configuration
**Then** aucun document n'est requis par défaut (zéro contrainte)

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : table `variante_documents` (AC: #1, #2, #3)
  - [x] 1.1 Créer `supabase/migrations/006_variante_documents.sql` avec la table `variante_documents` : `id uuid PK`, `variante_id uuid FK → variantes(id) ON DELETE CASCADE`, `nom text NOT NULL`, `is_required boolean NOT NULL DEFAULT false`, `created_at timestamptz NOT NULL DEFAULT now()`
  - [x] 1.2 Index sur `variante_id` : `CREATE INDEX idx_variante_documents_variante_id ON public.variante_documents(variante_id)`
  - [x] 1.3 Appliquer RLS : `SELECT public.apply_rls_policy('variante_documents')`

- [x] Task 2 — Types TypeScript (AC: #1, #2)
  - [x] 2.1 Ajouter la table `variante_documents` dans `src/types/database.ts` avec Row/Insert/Update et `Relationships: [...]` (FK vers variantes)
  - [x] 2.2 CRITIQUE : Inclure `Relationships` avec le FK pour que supabase-js v2 infère correctement les types via `.select('*')`

- [x] Task 3 — Hooks queries et mutations (AC: #1, #2, #3)
  - [x] 3.1 Créer `src/lib/queries/useVarianteDocuments.ts` — `useQuery` avec key `['variante-documents', varianteId]`, charge tous les documents de la variante triés par `created_at ASC`
  - [x] 3.2 Créer `src/lib/mutations/useAddVarianteDocument.ts` — `useMutation` avec optimistic update, insère un document avec `is_required: false` par défaut
  - [x] 3.3 Créer `src/lib/mutations/useDeleteVarianteDocument.ts` — `useMutation` pour supprimer un document de la variante
  - [x] 3.4 Créer `src/lib/mutations/useToggleDocumentRequired.ts` — `useMutation` avec optimistic update pour toggle `is_required` (true ↔ false)
  - [x] 3.5 Tests co-localisés pour chaque hook : `useVarianteDocuments.test.ts`, `useAddVarianteDocument.test.ts`, `useDeleteVarianteDocument.test.ts`, `useToggleDocumentRequired.test.ts`

- [x] Task 4 — Section documents sur la page variante (AC: #1, #2, #3)
  - [x] 4.1 Dans `variantes.$varianteId.tsx`, ajouter une section "Documents par défaut" sous la section pièces existante
  - [x] 4.2 Afficher la liste des documents via `useVarianteDocuments(varianteId)` — chaque document affiche son nom + un switch/checkbox "Obligatoire"
  - [x] 4.3 Le switch "Obligatoire" toggle `is_required` via `useToggleDocumentRequired` — feedback immédiat (mutation optimiste)
  - [x] 4.4 Bouton de suppression (X) par document — supprime via `useDeleteVarianteDocument`
  - [x] 4.5 Champ d'ajout en bas : input texte + bouton "Ajouter" — ajoute un nouveau document (optionnel par défaut)
  - [x] 4.6 État vide : "Aucun document requis — Les lots hériteront de zéro contrainte documentaire."
  - [x] 4.7 Prévention des doublons : vérification case-insensitive avant ajout, toast d'erreur si doublon

- [x] Task 5 — Tests de la page variante — section documents (toutes AC)
  - [x] 5.1 Tests section documents : affichée, état vide, ajout d'un document, toggle obligatoire, suppression
  - [x] 5.2 Test prévention doublons : tentative d'ajout d'un document existant → toast erreur
  - [x] 5.3 Vérifier que tous les tests existants passent (206 pré-existants + nouveaux = 0 régressions)
  - [x] 5.4 Lint clean (sauf pre-existing ThemeProvider warning)

## Dev Notes

### Architecture & Patterns obligatoires

- **Supabase Client SDK direct** — pas d'API custom, pas d'Edge Functions [Source: architecture.md#API & Communication Patterns]
- **Mutations optimistes standard** — `onMutate` / `onError` / `onSettled` [Source: architecture.md#API & Communication Patterns]
- **Query keys convention** — `['variante-documents', varianteId]` [Source: architecture.md#Communication Patterns]
- **Types snake_case** — miroir exact du schéma PostgreSQL [Source: architecture.md#Naming Patterns]
- **Messages en français** — tous les labels, erreurs, toasts [Source: architecture.md#Enforcement Guidelines]
- **shadcn/ui avant custom** — utiliser les composants existants (Button, Input, Switch/Checkbox) [Source: architecture.md#Enforcement Guidelines]
- **Pas de barrel files** — imports directs [Source: architecture.md#Structure Patterns]
- **Tests co-localisés** — `.test.ts(x)` à côté du fichier testé [Source: architecture.md#Structure Patterns]

### Décision architecturale : Table `variante_documents` séparée

Les documents par défaut d'une variante sont stockés dans une table dédiée `variante_documents`, et NON dans un tableau JSON sur la table `variantes`. Justification :

1. **Champ `is_required`** — Chaque document a un attribut booléen (obligatoire/optionnel), ce qui dépasse la complexité d'un simple `text[]`
2. **Héritage futur** — À la story 2.4, quand un lot est créé avec une variante, les documents seront copiés vers la table `lot_documents`. Une table source normalisée simplifie cette copie
3. **Requêtes individuelles** — Le toggle `is_required` met à jour un seul enregistrement via `.update().eq('id', docId)`, plus propre qu'un remplacement de tableau entier
4. **Cohérence** — Suit le même pattern que `variante_pieces` (table enfant avec FK CASCADE)

### Migration SQL cible

```sql
-- supabase/migrations/006_variante_documents.sql
-- Story 2.3 : Documents par défaut dans les variantes

CREATE TABLE public.variante_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variante_id uuid NOT NULL REFERENCES public.variantes(id) ON DELETE CASCADE,
  nom text NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_variante_documents_variante_id ON public.variante_documents(variante_id);

SELECT public.apply_rls_policy('variante_documents');
```

### Types database.ts — Section à ajouter

```typescript
variante_documents: {
  Row: {
    id: string
    variante_id: string
    nom: string
    is_required: boolean
    created_at: string
  }
  Insert: {
    id?: string
    variante_id: string
    nom: string
    is_required?: boolean
    created_at?: string
  }
  Update: {
    id?: string
    variante_id?: string
    nom?: string
    is_required?: boolean
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "variante_documents_variante_id_fkey"
      columns: ["variante_id"]
      isOneToOne: false
      referencedRelation: "variantes"
      referencedColumns: ["id"]
    },
  ]
}
```

**CRITIQUE** : La propriété `Relationships` DOIT être présente avec le FK pour que supabase-js v2 infère correctement les types via `.select('*')`. Sans elle, l'inférence de type échoue.

### Pattern mutation — Ajout de document

```typescript
// src/lib/mutations/useAddVarianteDocument.ts
export function useAddVarianteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ varianteId, nom }: { varianteId: string; nom: string }) => {
      const { data, error } = await supabase
        .from('variante_documents')
        .insert({ variante_id: varianteId, nom })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ varianteId, nom }) => {
      await queryClient.cancelQueries({ queryKey: ['variante-documents', varianteId] })
      const previous = queryClient.getQueryData(['variante-documents', varianteId])
      queryClient.setQueryData(
        ['variante-documents', varianteId],
        (old: any[] | undefined) => [
          ...(old ?? []),
          {
            id: crypto.randomUUID(),
            variante_id: varianteId,
            nom,
            is_required: false,
            created_at: new Date().toISOString(),
          },
        ],
      )
      return { previous }
    },
    onError: (_err, { varianteId }, context) => {
      queryClient.setQueryData(['variante-documents', varianteId], context?.previous)
    },
    onSettled: (_data, _err, { varianteId }) => {
      queryClient.invalidateQueries({ queryKey: ['variante-documents', varianteId] })
    },
  })
}
```

### Pattern mutation — Toggle obligatoire/optionnel

```typescript
// src/lib/mutations/useToggleDocumentRequired.ts
export function useToggleDocumentRequired() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ docId, isRequired }: { docId: string; isRequired: boolean; varianteId: string }) => {
      const { data, error } = await supabase
        .from('variante_documents')
        .update({ is_required: isRequired })
        .eq('id', docId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ docId, isRequired, varianteId }) => {
      await queryClient.cancelQueries({ queryKey: ['variante-documents', varianteId] })
      const previous = queryClient.getQueryData(['variante-documents', varianteId])
      queryClient.setQueryData(
        ['variante-documents', varianteId],
        (old: any[] | undefined) =>
          (old ?? []).map((doc: any) =>
            doc.id === docId ? { ...doc, is_required: isRequired } : doc,
          ),
      )
      return { previous }
    },
    onError: (_err, { varianteId }, context) => {
      queryClient.setQueryData(['variante-documents', varianteId], context?.previous)
    },
    onSettled: (_data, _err, { varianteId }) => {
      queryClient.invalidateQueries({ queryKey: ['variante-documents', varianteId] })
    },
  })
}
```

### Design de la page variante (mise à jour) — Pièces + Documents

```
+--[←]--------[Type A]--------[⋮]--------+
|                                          |
|  Pièces                                  |
|  ┌──────────────────────────────────┐    |
|  │  Séjour                     [×]  │    |
|  │  └ 6 tâches héritées du plot     │    |
|  │                                   │    |
|  │  Chambre                    [×]  │    |
|  │  └ 6 tâches héritées du plot     │    |
|  └──────────────────────────────────┘    |
|  ┌────────────────────────┐ [Ajouter]    |
|  │ Nouvelle pièce...      │              |
|  └────────────────────────┘              |
|                                          |
|  ─────────────────────────────────────   |
|                                          |
|  Documents par défaut                    |
|  ┌──────────────────────────────────┐    |
|  │  Plan de pose        [Oblig.][×] │    |
|  │  Fiche de choix      [Opt. ][×] │    |
|  │  Relevé acoustique   [Opt. ][×] │    |
|  └──────────────────────────────────┘    |
|                                          |
|  ┌────────────────────────┐ [Ajouter]    |
|  │ Nouveau document...    │              |
|  └────────────────────────┘              |
|                                          |
+------------------------------------------+
| [Chantiers] [Livraisons] [Act.] [Reg.]  |
+------------------------------------------+
```

- Chaque document affiche son nom + un switch compact indiquant "Obligatoire" (activé) ou "Optionnel" (désactivé)
- Le switch toggle `is_required` immédiatement (mutation optimiste)
- Le bouton `[×]` supprime le document sans confirmation (action légère — peut être re-ajouté)
- Le champ en bas permet d'ajouter un document avec un nom libre
- État vide : texte informatif expliquant que zéro document n'est requis par défaut

### Choix UX : Switch vs Checkbox pour is_required

Recommandation : **Switch** (shadcn/ui `Switch` component).

Raisons :
1. Le switch communique visuellement un état binaire on/off mieux qu'une checkbox
2. Cohérent avec les patterns mobile-first (iOS/Android settings pattern)
3. Le label change dynamiquement : "Obligatoire" quand activé, "Optionnel" quand désactivé
4. shadcn/ui fournit le composant Switch — à installer : `npx shadcn@latest add switch`

**Alternative acceptable** : si le switch n'est pas encore installé et qu'on veut éviter l'ajout d'un nouveau composant, une simple checkbox avec label "Obligatoire" fonctionne aussi. Mais le switch est préférable pour la clarté visuelle.

### Conventions de nommage

- Fichier query : `useVarianteDocuments.ts` (camelCase)
- Fichiers mutations : `useAddVarianteDocument.ts`, `useDeleteVarianteDocument.ts`, `useToggleDocumentRequired.ts`
- Table DB : `variante_documents` (snake_case, pluriel)
- Tests co-localisés : `.test.ts(x)` à côté du fichier testé
- Query key : `['variante-documents', varianteId]` (kebab-case pour le nom de l'entité, comme `variante-pieces`)

### Stack technique — Versions exactes (déjà installées)

| Bibliothèque | Version | Utilisation dans cette story |
|---|---|---|
| **@supabase/supabase-js** | 2.x | `.insert()`, `.update()`, `.delete()`, `.eq()`, `.select()`, `.single()`, `.order()` |
| **@tanstack/react-query** | 5.x | `useQuery`, `useMutation`, `useQueryClient`, `invalidateQueries` |
| **@tanstack/react-router** | 1.158.x | `Route.useParams()` (page variante existante) |
| **shadcn/ui** | CLI 3.8.4 | Button, Input (existants), Switch (à installer) |
| **lucide-react** | 0.563.x | `Plus`, `X` (existants), `FileText` (optionnel pour l'icône document) |
| **vitest** | 4.0.x | Tests unitaires co-localisés |

### Composants shadcn/ui à vérifier/installer

- **Switch** — À installer pour le toggle obligatoire/optionnel : `npx shadcn@latest add switch`
- **Button** — déjà installé
- **Input** — déjà installé

### Project Structure Notes

**Nouveaux fichiers à créer :**
- `supabase/migrations/006_variante_documents.sql` — Migration table variante_documents
- `src/lib/queries/useVarianteDocuments.ts` — Hook query documents variante
- `src/lib/queries/useVarianteDocuments.test.ts` — Tests query
- `src/lib/mutations/useAddVarianteDocument.ts` — Mutation ajout document
- `src/lib/mutations/useAddVarianteDocument.test.ts` — Tests mutation
- `src/lib/mutations/useDeleteVarianteDocument.ts` — Mutation suppression document
- `src/lib/mutations/useDeleteVarianteDocument.test.ts` — Tests mutation
- `src/lib/mutations/useToggleDocumentRequired.ts` — Mutation toggle obligatoire
- `src/lib/mutations/useToggleDocumentRequired.test.ts` — Tests mutation
- `src/components/ui/switch.tsx` — Composant shadcn Switch (via CLI)

**Fichiers à modifier :**
- `src/types/database.ts` — Ajouter table `variante_documents`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/variantes.$varianteId.tsx` — Ajouter section "Documents par défaut"
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/variantes.$varianteId.test.tsx` — Ajouter tests section documents

**Fichiers NON touchés :**
- `src/routes/_authenticated/index.tsx` — L'écran d'accueil ne change pas
- `src/routes/_authenticated/chantiers/$chantierId.tsx` — Le layout chantier ne change pas
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — La page index chantier ne change pas
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId.tsx` — Le layout plot ne change pas
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` — La page plot ne change pas
- `src/components/StatusCard.tsx` — Pas de changement
- `src/components/BottomNavigation.tsx` — Pas de changement
- `src/lib/queries/usePlots.ts` — Pas de changement
- `src/lib/queries/useVariantes.ts` — Pas de changement
- `src/lib/queries/useVariantePieces.ts` — Pas de changement
- `src/lib/mutations/useAddVariantePiece.ts` — Pas de changement
- `src/lib/mutations/useDeleteVariantePiece.ts` — Pas de changement
- `src/lib/mutations/useDeleteVariante.ts` — Pas de changement
- `src/types/enums.ts` — Pas de nouvel enum nécessaire
- `src/main.tsx` — Pas de changement
- `src/index.css` — Pas de changement

### Attention — Pièges courants

1. **PAS de restructuration route dans cette story** — La page variante (`variantes.$varianteId.tsx`) existe déjà et n'a pas besoin de devenir un layout. On ajoute simplement une section "Documents par défaut" dans le même composant. Pas de nouvelle route à créer.

2. **`Relationships: []` dans database.ts** — TOUJOURS inclure ce champ. Pour `variante_documents`, inclure la FK vers variantes. Sans `Relationships`, supabase-js v2 ne peut pas inférer les types Row via `.select('*')`.

3. **Le composant Switch de shadcn/ui** — Doit être installé via la CLI AVANT utilisation : `npx shadcn@latest add switch`. Le fichier généré dans `src/components/ui/switch.tsx` peut déclencher le lint warning `react-refresh/only-export-components` — ajouter le commentaire `// eslint-disable-next-line` comme pour `button.tsx` et `badge.tsx`.

4. **`is_required` DEFAULT false** — Cohérent avec FR43 (aucun document requis par défaut). Quand un document est ajouté, il est optionnel par défaut. L'utilisateur doit explicitement activer le switch pour le rendre obligatoire.

5. **Prévention des doublons** — Vérification case-insensitive côté client avant l'insert. Pattern identique à story 2.2 pour les pièces et story 2.1 pour les tâches. Si doublon détecté → `toast.error('Ce document existe déjà')`.

6. **L'ajout de la section documents ne doit PAS casser la section pièces** — Les deux sections coexistent sur la même page. Le séparateur visuel (divider) entre les sections suffit.

7. **Tests existants de `variantes.$varianteId.test.tsx`** — Les 10 tests existants DOIVENT toujours passer après l'ajout de la section documents. Il faudra ajouter les mocks pour `useVarianteDocuments`, `useAddVarianteDocument`, `useDeleteVarianteDocument` et `useToggleDocumentRequired` dans le setup de test existant.

8. **Pas de Realtime pour les documents variante** — Comme pour les pièces et les variantes, la configuration des documents est faite par un seul utilisateur au bureau. Pas de subscription Realtime nécessaire.

9. **`ON DELETE CASCADE` en cascade** — Si une variante est supprimée, ses documents sont supprimés automatiquement (CASCADE). Chaîne complète : chantier → plot → variante → variante_documents.

10. **Scope limité** — Cette story ne gère PAS l'upload de fichiers PDF (c'est Epic 5). Elle ne gère que la définition des **types** de documents attendus (nom + obligatoire/optionnel). Ce sont des "slots" vides qui seront remplis quand les lots seront créés et que les documents seront uploadés.

### References

- [Source: epics.md#Story 2.3] — User story, acceptance criteria BDD
- [Source: epics.md#FR16] — Définir des documents par défaut dans chaque variante
- [Source: epics.md#FR43] — Par défaut, aucun document n'est requis (zéro contrainte)
- [Source: architecture.md#Data Architecture] — Tables de variantes avec copie à la création du lot
- [Source: architecture.md#API & Communication Patterns] — SDK Supabase direct, mutations optimistes
- [Source: architecture.md#Communication Patterns] — Query keys `[entite, ...filtres]`, invalidation
- [Source: architecture.md#Structure Patterns] — Structure projet par domaine, tests co-localisés
- [Source: architecture.md#Enforcement Guidelines] — shadcn first, messages français, snake_case DB
- [Source: prd.md#FR16] — Définir des documents par défaut dans variante
- [Source: prd.md#FR43] — Aucun document n'est requis par défaut

## Previous Story Intelligence (Story 2.2)

### Learnings critiques de la story précédente

1. **206 tests existants** — baseline à ne pas régresser (169 pré-story-2.2 + 37 story 2.2)
2. **Restructuration route → layout** : Pattern maîtrisé en story 2.1 et 2.2. `plots.$plotId.tsx` converti en layout avec `<Outlet />`. **Pas besoin de restructuration dans cette story** — `variantes.$varianteId.tsx` reste une route leaf.
3. **7 issues code review corrigées en 2.2** :
   - Prévention doublons variantes (case-insensitive) — appliquer pour les noms de documents
   - Feedback doublons pièces via `toast.error` — même pattern pour les documents
   - Types propres `VarianteWithPieceCount` — définir un type propre si nécessaire pour les documents
   - Loading state complet (check `plotsLoading || variantesLoading`) — ajouter `documentsLoading` dans la condition
   - État "Variante introuvable" — déjà en place
   - Cache cleanup `removeQueries` sur suppression — appliquer si une suppression orpheline est possible
4. **Page variante (`variantes.$varianteId.tsx`)** — Composant existant de 291 lignes avec sections : header, pièces (expandable), ajout pièce, dialog suppression variante. La section documents s'ajoute APRÈS la section pièces, séparée par un divider.
5. **Mocks test existants** — Le fichier test mock déjà : `useVariantePieces`, `usePlots`, `useVariantes`, `useAddVariantePiece`, `useDeleteVariantePiece`, `useDeleteVariante`. Ajouter les mocks pour les 4 nouveaux hooks documents.
6. **Pattern Switch shadcn/ui** — shadcn Switch n'est pas encore installé. Penser à l'installer et à ajouter le `eslint-disable` si nécessaire (pattern `badge.tsx`, `button.tsx`).

### Code patterns établis (à respecter)

- `createFileRoute('/_authenticated/...')` pour les routes protégées
- `useAuth()` hook pour l'état d'authentification
- `supabase` client singleton dans `src/lib/supabase.ts` (typé `Database`)
- `queryClient` dans `src/lib/queryClient.ts` (staleTime 5min, retry 3)
- Composants shadcn/ui dans `src/components/ui/`
- Composants custom dans `src/components/`
- Tests avec Vitest + Testing Library + mocks Supabase chainable
- Navigation TanStack Router : `Link`, `useNavigate()`, `Route.useParams()`
- Toast via `toast()` de sonner pour le feedback post-action
- StatusCard pour les listes avec indicateur de statut coloré
- Prévention doublons case-insensitive avec `toast.error` sur détection

## Git Intelligence

### Commits récents (5 derniers)

```
e6487b6 feat: auth, route protection & login — Story 1-2 + code review fixes
e1c18ef fix: code review story 1-1 — 7 issues corrigées
61938ec docs: story 1-1 complete — all tasks done, status review
3789f3d docs: update story 1-1 progress — tasks 1-6 implemented
a3719c1 feat: initial project scaffolding — Story 1-1
```

Note : Les stories 1.3 à 2.2 ne sont pas encore commitées (changements en working directory). Le développeur travaillera par-dessus cet état non-commité.

### Patterns de commit à suivre

- Format : `feat:` / `fix:` / `docs:` + description concise + référence story
- Commits atomiques par fonctionnalité

### Technologies déjà en place

- React 19.2 + TypeScript strict
- Tailwind CSS v4 (config inline dans index.css, pas de tailwind.config)
- TanStack Router (file-based routing, route generation automatique, `routeFileIgnorePattern`)
- TanStack Query v5 (staleTime 5min, retry 3, query keys `[entite, ...filtres]`)
- Supabase Auth (email/password, RLS) + Supabase JS Client (typé Database)
- Supabase Realtime (subscription `chantiers-changes`, invalidation query)
- shadcn/ui (button, card, input, label, badge, sonner, alert-dialog, dropdown-menu, tabs, sheet — style "new-york")
- Lucide React (icônes)
- Vitest + Testing Library (setup complet)
- vite-plugin-pwa v1.2.0 (PWA configurée)
- 206 tests existants

## Latest Tech Information

### shadcn/ui Switch — Installation et usage

Le composant Switch de shadcn/ui est basé sur Radix UI Switch. Installation :

```bash
npx shadcn@latest add switch
```

Usage dans le composant :

```tsx
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

<div className="flex items-center gap-2">
  <Switch
    id={`doc-${doc.id}`}
    checked={doc.is_required}
    onCheckedChange={(checked) =>
      toggleRequired.mutate({
        docId: doc.id,
        isRequired: checked,
        varianteId,
      })
    }
  />
  <Label htmlFor={`doc-${doc.id}`} className="text-xs">
    {doc.is_required ? 'Obligatoire' : 'Optionnel'}
  </Label>
</div>
```

Le Switch est un composant controlled via `checked` / `onCheckedChange`. Le label dynamique ("Obligatoire" / "Optionnel") fournit un retour visuel immédiat à l'utilisateur.

### Supabase boolean columns

- PostgreSQL `boolean` est mappé vers TypeScript `boolean` par supabase-js v2
- `DEFAULT false` en SQL → le champ est optionnel en Insert (`is_required?: boolean`)
- `.update({ is_required: true })` fonctionne directement sans conversion

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- 2 tests existants cassés par doublon "Ajouter" button → fixé via `getAllByRole()[0]` pour la section pièces

### Completion Notes List

- Task 1: Migration SQL `006_variante_documents.sql` créée — table, index, RLS
- Task 2: Types `variante_documents` ajoutés dans `database.ts` avec `Relationships` FK vers variantes
- Task 3: 4 hooks créés (1 query + 3 mutations) avec optimistic updates + 14 tests co-localisés (4+3+3+4) — tous passent
- Task 4: Section "Documents par défaut" ajoutée dans `variantes.$varianteId.tsx` — Switch obligatoire/optionnel, ajout, suppression, état vide, prévention doublons case-insensitive. shadcn Switch installé.
- Task 5: 10 tests ajoutés pour la section documents (affichage, état vide, ajout, toggle, suppression, doublons) + 2 tests existants corrigés pour cohabitation avec le nouveau bouton "Ajouter". 230/230 tests passent. Lint clean (sauf ThemeProvider pré-existant).
- Total: 24 nouveaux tests, 0 régressions sur les 206 pré-existants

### Change Log

- 2026-02-09: Story 2.3 implémentée — Documents par défaut dans les variantes (5 tâches, 24 nouveaux tests)
- 2026-02-09: Code review (Opus 4.6) — 9 issues trouvées (1H, 3M, 5L). 4 corrigées auto : AlertDialog mentionne documents, UNIQUE index SQL ajouté, isPending sur bouton Ajouter, test toast.error doublon. 3 LOW corrigées bonus : cast `as boolean` retiré, `?.` redondant retiré. 230/230 tests ✓

### File List

**Nouveaux fichiers:**
- `supabase/migrations/006_variante_documents.sql`
- `src/lib/queries/useVarianteDocuments.ts`
- `src/lib/queries/useVarianteDocuments.test.ts`
- `src/lib/mutations/useAddVarianteDocument.ts`
- `src/lib/mutations/useAddVarianteDocument.test.ts`
- `src/lib/mutations/useDeleteVarianteDocument.ts`
- `src/lib/mutations/useDeleteVarianteDocument.test.ts`
- `src/lib/mutations/useToggleDocumentRequired.ts`
- `src/lib/mutations/useToggleDocumentRequired.test.ts`
- `src/components/ui/switch.tsx`

**Fichiers modifiés:**
- `src/types/database.ts` — Ajout table `variante_documents`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/variantes.$varianteId.tsx` — Section "Documents par défaut"
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/variantes.$varianteId.test.tsx` — Tests section documents + fix bouton "Ajouter"
