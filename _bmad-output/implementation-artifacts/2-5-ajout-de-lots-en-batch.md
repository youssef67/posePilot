# Story 2.5: Ajout de lots en batch

Status: done
Story ID: 2.5
Story Key: 2-5-ajout-de-lots-en-batch
Epic: 2 — Configuration & Structure de chantier
Date: 2026-02-09
Dependencies: Story 2.4 (done)
FRs: FR18

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux ajouter jusqu'à 8 lots d'un coup pour la même variante et le même étage,
Afin que la configuration d'un plot avec 80 lots ne soit pas fastidieuse.

## Acceptance Criteria (BDD)

### AC1: Formulaire batch avec codes multiples, variante et étage

**Given** un plot a au moins une variante
**When** l'utilisateur choisit "Ajouter des lots en batch"
**Then** un formulaire propose la saisie de codes lots (max 8), le choix d'une variante et d'un étage

### AC2: Création simultanée de 8 lots avec héritage

**Given** l'utilisateur saisit les codes "101, 102, 103, 104, 105, 106, 107, 108"
**When** il valide
**Then** 8 lots sont créés simultanément, chacun avec le bon héritage (pièces, tâches, documents)

### AC3: Limite de 8 lots par batch

**Given** l'utilisateur tente de saisir plus de 8 codes
**When** il dépasse la limite
**Then** un message l'informe de la limite de 8 lots par batch

### AC4: Rejet total si code en doublon

**Given** un des codes saisi existe déjà dans le plot
**When** l'utilisateur valide
**Then** un message d'erreur indique le code en doublon sans créer aucun lot du batch

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : fonction `create_batch_lots_with_inheritance` (AC: #1, #2, #3, #4)
  - [x] 1.1 Créer `supabase/migrations/008_batch_lots.sql`
  - [x] 1.2 Créer la fonction PostgreSQL `create_batch_lots_with_inheritance(p_codes text[], p_variante_id uuid, p_etage_nom text, p_plot_id uuid)` qui boucle sur `p_codes` et appelle `create_lot_with_inheritance()` pour chaque code — transaction atomique (tout ou rien)
  - [x] 1.3 La fonction retourne `uuid[]` — le tableau des IDs des lots créés
  - [x] 1.4 Pas de validation du nombre max côté SQL (gérée côté client) — la contrainte unique `idx_lots_unique_code` suffit pour les doublons

- [x] Task 2 — Types TypeScript (AC: #1, #2)
  - [x] 2.1 Ajouter la fonction `create_batch_lots_with_inheritance` dans `Database.public.Functions` de `src/types/database.ts`
  - [x] 2.2 Args : `{ p_codes: string[], p_variante_id: string, p_etage_nom: string, p_plot_id: string }`
  - [x] 2.3 Returns : `string[]` (tableau d'UUIDs)

- [x] Task 3 — Hook mutation `useCreateBatchLots` + tests (AC: #1, #2, #4)
  - [x] 3.1 Créer `src/lib/mutations/useCreateBatchLots.ts` — `useMutation` qui appelle `supabase.rpc('create_batch_lots_with_inheritance', { p_codes, p_variante_id, p_etage_nom, p_plot_id })`
  - [x] 3.2 `onSettled` : invalider `['lots', plotId]` et `['etages', plotId]`
  - [x] 3.3 Pas de mutation optimiste (même justification que `useCreateLot` — impossible de simuler N héritages côté client)
  - [x] 3.4 Créer `src/lib/mutations/useCreateBatchLots.test.ts` — Tests : appel RPC correct, gestion erreur doublon (code 23505), invalidation queries

- [x] Task 4 — UI : formulaire batch dans la page plot index (AC: #1, #2, #3, #4)
  - [x] 4.1 Dans `plots.$plotId/index.tsx`, ajouter un bouton "Ajouter des lots en batch" à côté du bouton "Ajouter un lot" existant
  - [x] 4.2 Le bouton ouvre un Sheet avec 3 champs : codes lots (Input textarea — séparés par virgule, espace ou retour à la ligne), variante (Select), étage (Input avec datalist)
  - [x] 4.3 Parsing des codes : split par `,` ou espaces/newlines, trim, filtrage des vides
  - [x] 4.4 Validation côté client AVANT soumission :
    - Au moins 1 code saisi
    - Maximum 8 codes (AC3) — message : "Maximum 8 lots par batch"
    - Pas de doublons dans le batch (case-insensitive) — message : "Code « X » en doublon dans le batch"
    - Pas de code déjà existant dans le plot (case-insensitive via `useLots`) (AC4) — message : "Le code « X » existe déjà"
    - Variante requise
    - Étage requis
  - [x] 4.5 Bouton "Créer les lots" avec `isPending` disabled
  - [x] 4.6 Succès : toast "X lots créés" + fermeture Sheet + reset formulaire (PAS de navigation — l'utilisateur reste sur la page plot pour voir les lots ajoutés)
  - [x] 4.7 Erreur serveur (race condition doublon) : toast.error avec message descriptif, aucun lot créé (transaction atomique)
  - [x] 4.8 Indicateur visuel du nombre de codes parsés : "X codes détectés" affiché en temps réel sous le champ codes

- [x] Task 5 — Tests UI page plot (toutes AC)
  - [x] 5.1 Tests du bouton "Ajouter des lots en batch" : présent, ouvre le Sheet
  - [x] 5.2 Tests du formulaire : 3 champs affichés, parsing des codes, compteur "X codes détectés"
  - [x] 5.3 Tests validation : codes vides, > 8 codes, doublons dans batch, doublons existants, variante manquante, étage manquant
  - [x] 5.4 Tests création réussie : toast, fermeture Sheet, reset formulaire
  - [x] 5.5 Tests création erreur : toast.error
  - [x] 5.6 Vérifier que tous les tests existants passent (271 pré-existants + nouveaux = 0 régressions)
  - [x] 5.7 Lint clean (sauf pré-existant ThemeProvider.tsx:64)

## Dev Notes

### Architecture & Patterns obligatoires

- **Supabase Client SDK direct** — `.rpc()` est du SDK direct, pas d'API custom. [Source: architecture.md#API & Communication Patterns]
- **Transaction atomique via RPC** — le batch DOIT être transactionnel. Si un seul code est en doublon, AUCUN lot n'est créé (AC4). C'est pourquoi la boucle est côté SQL, pas côté client. [Source: architecture.md#Data Architecture]
- **Réutilisation de `create_lot_with_inheritance`** — la story 2.4 a été conçue pour que la fonction existante soit appelée en boucle dans une fonction batch. [Source: story 2.4 Dev Notes — "Prépare story 2.5"]
- **Query keys convention** — `['lots', plotId]`, `['etages', plotId]` — mêmes invalidations que `useCreateLot`. [Source: architecture.md#Communication Patterns]
- **Types snake_case** — miroir exact du schéma PostgreSQL. [Source: architecture.md#Naming Patterns]
- **Messages en français** — tous les labels, erreurs, toasts. [Source: architecture.md#Enforcement Guidelines]
- **Tests co-localisés** — `.test.ts(x)` à côté du fichier testé. [Source: architecture.md#Structure Patterns]

### Décision architecturale : Fonction batch via appel en boucle de l'existante

```sql
CREATE OR REPLACE FUNCTION public.create_batch_lots_with_inheritance(
  p_codes text[],
  p_variante_id uuid,
  p_etage_nom text,
  p_plot_id uuid
) RETURNS uuid[]
LANGUAGE plpgsql
AS $$
DECLARE
  v_lot_ids uuid[] := '{}';
  v_lot_id uuid;
  v_code text;
BEGIN
  FOREACH v_code IN ARRAY p_codes
  LOOP
    v_lot_id := public.create_lot_with_inheritance(
      v_code, p_variante_id, p_etage_nom, p_plot_id
    );
    v_lot_ids := v_lot_ids || v_lot_id;
  END LOOP;

  RETURN v_lot_ids;
END;
$$;
```

**Justification :**
1. **Réutilisation** — zéro duplication de la logique d'héritage (pièces, tâches, documents)
2. **Atomicité** — une seule transaction PostgreSQL : si le code "103" viole la contrainte unique, les lots "101" et "102" déjà créés dans la boucle sont rollback automatiquement
3. **Simplicité** — 15 lignes vs. réécriture complète de la logique d'héritage
4. **Maintenabilité** — si la logique d'héritage change (story future), un seul point de modification
5. **Performance** — une seule requête réseau (`.rpc()`) au lieu de N appels

### Décision architecturale : Input texte libre vs champs dynamiques pour les codes

**Choix : Input texte libre (textarea)** avec parsing automatique.

L'AC2 dit explicitement : "l'utilisateur saisit les codes **101, 102, 103, 104, 105, 106, 107, 108**". Le pattern naturel est la saisie en série dans un seul champ.

**Parsing multi-séparateur :** virgule `,`, espace ` `, retour à la ligne `\n` — accepter les 3 pour flexibilité maximale. Regex : `/[\s,]+/` (split sur tout whitespace ou virgule).

**Avantages du texte libre :**
- Plus rapide que 8 champs séparés (un seul focus, copier-coller possible)
- Feedback immédiat : "X codes détectés" affiché en temps réel
- UX minimaliste conforme au principe "max 3 champs visibles" — les 3 champs sont : codes (textarea), variante (Select), étage (Input)

**Pattern de parsing :**
```typescript
function parseCodes(input: string): string[] {
  return input
    .split(/[\s,]+/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0)
}
```

### Décision architecturale : Pas de navigation post-batch

Contrairement à la création unitaire (story 2.4) qui navigue vers le lot créé, le batch **reste sur la page plot** après création. Justification :
- L'utilisateur crée 8 lots d'un coup — naviguer vers un seul n'a pas de sens
- Il veut voir le résultat global : les 8 lots apparaissent dans la section "Lots" groupés par étage
- L'invalidation `['lots', plotId]` déclenche automatiquement le refetch et l'affichage

### Design du formulaire batch (Sheet bottom)

```
┌──────────────────────────────────────┐
│  Ajouter des lots en batch     [×]  │
│                                      │
│  Codes des lots                      │
│  ┌──────────────────────────────┐    │
│  │ 101, 102, 103, 104          │    │
│  │ 105, 106, 107, 108          │    │
│  └──────────────────────────────┘    │
│  4 codes détectés (max 8)            │
│                                      │
│  Variante                            │
│  ┌──────────────────────────────┐    │
│  │ Type A                    ▾  │    │
│  └──────────────────────────────┘    │
│                                      │
│  Étage                               │
│  ┌──────────────────────────────┐    │
│  │ RDC                          │    │
│  └──────────────────────────────┘    │
│  (saisie libre — créé ou réutilisé)  │
│                                      │
│  ┌──────────────────────────────┐    │
│  │     Créer 4 lots             │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

- Le champ codes utilise un `<textarea>` avec `rows={3}` (4 codes par ligne à l'aise)
- Le compteur "X codes détectés (max 8)" est mis à jour en temps réel (onChange)
- Le bouton affiche le nombre de lots à créer : "Créer X lots"
- Le Select de variante et le champ étage reprennent le même pattern que le formulaire unitaire (story 2.4)
- **Pas de composant shadcn supplémentaire à installer** — textarea est du HTML natif, stylé avec les classes Tailwind existantes

### Migration SQL cible

```sql
-- supabase/migrations/008_batch_lots.sql
-- Story 2.5 : Ajout de lots en batch

-- =====================
-- Fonction BATCH avec héritage
-- =====================
-- Crée N lots (max imposé côté client) pour la même variante et le même étage.
-- Appelle create_lot_with_inheritance() en boucle dans une seule transaction.
-- Si un code est en doublon (contrainte unique), TOUT le batch est rollback.
-- Retourne le tableau des UUIDs des lots créés.

CREATE OR REPLACE FUNCTION public.create_batch_lots_with_inheritance(
  p_codes text[],
  p_variante_id uuid,
  p_etage_nom text,
  p_plot_id uuid
) RETURNS uuid[]
LANGUAGE plpgsql
AS $$
DECLARE
  v_lot_ids uuid[] := '{}';
  v_lot_id uuid;
  v_code text;
BEGIN
  FOREACH v_code IN ARRAY p_codes
  LOOP
    v_lot_id := public.create_lot_with_inheritance(
      v_code, p_variante_id, p_etage_nom, p_plot_id
    );
    v_lot_ids := v_lot_ids || v_lot_id;
  END LOOP;

  RETURN v_lot_ids;
END;
$$;
```

### Types database.ts — Section à ajouter

Ajouter dans `Database.public.Functions` à côté de `create_lot_with_inheritance` :

```typescript
create_batch_lots_with_inheritance: {
  Args: {
    p_codes: string[]
    p_variante_id: string
    p_etage_nom: string
    p_plot_id: string
  }
  Returns: string[] // tableau d'UUIDs des lots créés
}
```

### Pattern mutation — Création batch via RPC

```typescript
// src/lib/mutations/useCreateBatchLots.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useCreateBatchLots() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      codes,
      varianteId,
      etageNom,
      plotId,
    }: {
      codes: string[]
      varianteId: string
      etageNom: string
      plotId: string
    }) => {
      const { data, error } = await supabase.rpc(
        'create_batch_lots_with_inheritance',
        {
          p_codes: codes,
          p_variante_id: varianteId,
          p_etage_nom: etageNom,
          p_plot_id: plotId,
        },
      )
      if (error) throw error
      return data as string[] // tableau d'UUIDs
    },
    onSettled: (_data, _err, { plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
      queryClient.invalidateQueries({ queryKey: ['etages', plotId] })
    },
  })
}
```

### Pattern validation côté client — Batch

```typescript
function validateBatchCodes(
  codes: string[],
  existingLots: Array<{ code: string }> | undefined,
): string | null {
  if (codes.length === 0) {
    return 'Saisissez au moins un code de lot'
  }
  if (codes.length > 8) {
    return 'Maximum 8 lots par batch'
  }

  // Doublons dans le batch
  const seen = new Set<string>()
  for (const code of codes) {
    const lower = code.toLowerCase()
    if (seen.has(lower)) {
      return `Code « ${code} » en doublon dans le batch`
    }
    seen.add(lower)
  }

  // Doublons avec les lots existants
  if (existingLots) {
    const existingCodes = new Set(existingLots.map((l) => l.code.toLowerCase()))
    for (const code of codes) {
      if (existingCodes.has(code.toLowerCase())) {
        return `Le code « ${code} » existe déjà`
      }
    }
  }

  return null // pas d'erreur
}
```

### Attention — Pièges courants

1. **L'input textarea pour les codes N'EST PAS un composant shadcn/ui** — c'est un `<textarea>` HTML natif stylé avec les mêmes classes Tailwind que les `<Input>` shadcn (`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm`). Ne pas chercher un composant `Textarea` dans shadcn pour cette story.

2. **Le `.rpc()` avec paramètre array** — Supabase passe les `string[]` TypeScript comme `text[]` PostgreSQL automatiquement. Pas de conversion JSON nécessaire.

3. **Erreur PostgreSQL 23505 (unique violation)** — En cas de race condition (improbable pour 2-3 utilisateurs), l'erreur sera levée par la contrainte `idx_lots_unique_code`. Le catch dans la mutation doit identifier le code problématique si possible. Le message d'erreur PostgreSQL contient le détail : `Key (plot_id, lower(code))=(xxx, 101) already exists`. Parser le code depuis `error.message` ou utiliser un message générique.

4. **L'atomicité est gratuite** — La fonction PostgreSQL s'exécute dans une seule transaction. Si `create_lot_with_inheritance` échoue pour le 5ème lot (ex: code "105" existe déjà), les 4 premiers lots sont rollback automatiquement. Pas besoin de gestion d'erreur partielle.

5. **Le compteur "X codes détectés"** — Doit être mis à jour en temps réel (onChange du textarea). Utiliser `useMemo` ou calcul direct dans le render — pas de `useEffect`.

6. **Le bouton "Créer X lots"** — Le texte dynamique ("Créer 4 lots", "Créer 8 lots") aide l'utilisateur à vérifier avant de soumettre. Si 0 codes détectés : "Créer les lots" (désactivé).

7. **Reset du formulaire** — Comme pour le formulaire unitaire : reset onOpenChange(false) du Sheet. Même pattern que story 2.4.

8. **Le champ étage partage le même `<datalist>`** — Les étages existants viennent de `useEtages(plotId)`, déjà utilisé dans le formulaire unitaire.

9. **La limite de 8 est côté client uniquement** — La fonction SQL n'a pas de limite. C'est un choix de design : si dans le futur la limite change (ex: 16), seul le code client change. La validation "max 8" est dans `validateBatchCodes` + dans le message sous le textarea.

10. **Gestion du textarea multi-ligne** — L'utilisateur peut saisir "101, 102, 103" ou "101\n102\n103" ou un mélange. Le parser `/[\s,]+/` gère tous les cas. Attention : un textarea vide produit `['']` après split — le `.filter(c => c.length > 0)` est crucial.

11. **Tests — Mocker le `.rpc()` pour le batch** — Pattern identique à `useCreateLot` mais avec retour array :
```typescript
vi.mocked(supabase.rpc).mockResolvedValue({
  data: ['lot-id-1', 'lot-id-2', 'lot-id-3'],
  error: null,
})
```

12. **271 tests pré-existants** — Baseline de la story 2.4. Aucune régression autorisée.

13. **Pas de nouveau composant shadcn à installer** — Tout est déjà en place : Sheet, Select, Input, Button, StatusCard. Le textarea est natif HTML.

### Composants shadcn/ui — Rien à installer

Tous les composants nécessaires sont déjà installés :
- **Sheet** — formulaire bottom sheet (installé en story 2.1)
- **Button** — boutons (installé en story 1.1)
- **Input** — champs texte (installé en story 1.2)
- **Select** — sélecteur de variante (installé en story 2.4)
- **StatusCard** — cartes de lots (installé en story 1.5)

### Conventions de nommage

- Fichier migration : `008_batch_lots.sql`
- Fonction RPC : `create_batch_lots_with_inheritance` (snake_case, convention PostgreSQL)
- Fichier mutation : `useCreateBatchLots.ts`
- Test mutation : `useCreateBatchLots.test.ts`
- Query keys : mêmes que story 2.4 (`['lots', plotId]`, `['etages', plotId]`)

### Stack technique — Versions exactes (déjà installées)

| Bibliothèque | Version | Utilisation dans cette story |
|---|---|---|
| **@supabase/supabase-js** | 2.x | `.rpc('create_batch_lots_with_inheritance', { p_codes: [...] })` |
| **@tanstack/react-query** | 5.x | `useMutation`, `useQueryClient`, `invalidateQueries` |
| **@tanstack/react-router** | 1.158.x | `createFileRoute` (page plot existante) |
| **shadcn/ui** | CLI 3.8.4 | Sheet, Select, Button, Input (existants) |
| **vitest** | 4.0.x | Tests unitaires co-localisés |

### Project Structure Notes

**Nouveaux fichiers à créer :**
- `supabase/migrations/008_batch_lots.sql` — Fonction batch RPC
- `src/lib/mutations/useCreateBatchLots.ts` — Mutation batch
- `src/lib/mutations/useCreateBatchLots.test.ts` — Tests mutation

**Fichiers à modifier :**
- `src/types/database.ts` — Ajouter `create_batch_lots_with_inheritance` dans Functions
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` — Bouton batch + Sheet batch + formulaire + validation
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.test.tsx` — Tests section batch
- `src/routeTree.gen.ts` — PAS de changement (aucune nouvelle route)

**Fichiers NON touchés :**
- `src/lib/mutations/useCreateLot.ts` — Le hook unitaire reste inchangé
- `src/lib/queries/useLots.ts` — Pas de changement
- `src/lib/queries/useEtages.ts` — Pas de changement
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/lots.$lotId.tsx` — Page lot inchangée
- Tous les composants : StatusCard, BottomNavigation, etc. — inchangés
- `src/index.css` — Pas de changement
- `src/main.tsx` — Pas de changement

### References

- [Source: epics.md#Story 2.5] — User story, acceptance criteria BDD
- [Source: epics.md#FR18] — Ajouter jusqu'à 8 lots en batch (même variante, même étage)
- [Source: architecture.md#Data Architecture] — Héritage avec copie à la création du lot
- [Source: architecture.md#API & Communication Patterns] — SDK Supabase direct, .rpc() inclus
- [Source: architecture.md#Communication Patterns] — Query keys, invalidation ciblée
- [Source: architecture.md#Structure Patterns] — Structure projet par domaine, tests co-localisés
- [Source: architecture.md#Naming Patterns] — snake_case DB, camelCase JS
- [Source: architecture.md#Enforcement Guidelines] — Messages français, shadcn first
- [Source: ux-design-specification.md#Form Patterns] — Max 3 champs visibles
- [Source: story 2.4 Dev Notes] — "Prépare story 2.5 — la même fonction sera réutilisée pour la création batch"
- [Source: story 2.4 Dev Notes] — Patterns RPC, validation doublons, datalist, Sheet, Select

## Previous Story Intelligence (Story 2.4)

### Learnings critiques de la story précédente

1. **271 tests existants** — baseline à ne pas régresser (230 pré-story-2.4 + 41 story 2.4)
2. **Fonction RPC `create_lot_with_inheritance`** : Fonctionne, testée, sans `SECURITY DEFINER` — prête à être appelée en boucle par la fonction batch.
3. **8 issues code review corrigées en 2.4** :
   - [H1] Couleurs hex hardcodées → `STATUS_COLORS` constants
   - [H2] `useDeleteVariante` ne gérait pas l'erreur FK → toast.error pour code 23503
   - [H3] Type tuple `[{ count: number }]` → array `{ count: number }[]` pour `pieces`
   - [M1] Test manquant pour validation createLot → ajouté
   - [M2] Typo `etrageLots` → `etageLots`
   - [L1] Formulaire lot pas reset à la fermeture → `onOpenChange` avec reset
   - [L2] "0 faits" → "0 fait" (grammaire `> 1`)
4. **Pattern formulaire Sheet** : État local (useState par champ + error), validation côté client pré-soumission, `isPending` sur bouton, reset `onOpenChange(false)`. Réutiliser identique pour le batch.
5. **Pattern prévention doublons** : Comparaison case-insensitive côté client via `.toLowerCase()` + contrainte unique SQL. Étendre au batch (doublons intra-batch + contre existants).
6. **Pattern datalist pour étage** : HTML natif `<datalist>` avec options depuis `useEtages(plotId)`. Réutiliser tel quel.
7. **Mocks test `.rpc()`** : `vi.mocked(supabase.rpc).mockResolvedValue({ data: ..., error: null })` — adapter pour retour array.

### Code patterns établis (à respecter)

- `createFileRoute('/_authenticated/...')` pour les routes protégées
- `supabase` client singleton typé `Database`
- Tests avec Vitest + Testing Library + mocks Supabase
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

Note : Les stories 1.3 à 2.4 ne sont pas encore commitées (changements en working directory). Le développeur travaillera par-dessus cet état non-commité.

### Technologies déjà en place

- React 19.2 + TypeScript strict
- Tailwind CSS v4 (config inline dans index.css)
- TanStack Router (file-based routing, `routeFileIgnorePattern`)
- TanStack Query v5 (staleTime 5min, retry 3)
- Supabase Auth + JS Client (typé Database) + Realtime
- shadcn/ui (button, card, input, label, badge, sonner, alert-dialog, dropdown-menu, tabs, sheet, switch, select — style "new-york")
- Lucide React, Vitest + Testing Library, vite-plugin-pwa
- 271 tests existants
- Fonction RPC `create_lot_with_inheritance` opérationnelle

## Latest Tech Information

### Supabase `.rpc()` avec paramètres array

Supabase JS client passe nativement les tableaux TypeScript (`string[]`) en tant que `text[]` PostgreSQL. Aucune conversion JSON manuelle nécessaire :

```typescript
const { data, error } = await supabase.rpc('create_batch_lots_with_inheritance', {
  p_codes: ['101', '102', '103'],  // string[] → text[]
  p_variante_id: 'uuid-here',
  p_etage_nom: 'RDC',
  p_plot_id: 'uuid-here',
})
// data = string[] (uuid[])
```

Le retour `uuid[]` de PostgreSQL est automatiquement converti en `string[]` côté TypeScript.

### PostgreSQL — Appel de fonction dans une fonction

PostgreSQL permet d'appeler une fonction depuis une autre fonction directement par son nom :

```sql
v_lot_id := public.create_lot_with_inheritance(p1, p2, p3, p4);
```

L'appel s'exécute dans la même transaction que la fonction appelante. Si la fonction interne lève une exception (ex: contrainte unique violée), l'exception remonte à la fonction batch, qui rollback entièrement.

### HTML `<textarea>` — Styling cohérent avec shadcn/ui Input

Pour que le textarea ait le même style visuel que les Input shadcn :

```tsx
<textarea
  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
  rows={3}
  placeholder="101, 102, 103..."
  value={codesInput}
  onChange={(e) => setCodesInput(e.target.value)}
/>
```

Les classes Tailwind sont les mêmes que celles du composant `Input` de shadcn/ui (`src/components/ui/input.tsx`), adaptées au `<textarea>`.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Radix Select `hasPointerCapture` not a function in jsdom — fixed by adding polyfills in `src/test/setup.ts`
- Plural form "0 codes détectés" (French plural includes 0) — fixed test expectation

### Completion Notes List

- ✅ Task 1: Migration SQL `008_batch_lots.sql` — fonction `create_batch_lots_with_inheritance` qui boucle sur `create_lot_with_inheritance` dans une seule transaction
- ✅ Task 2: Types TS ajoutés dans `Database.public.Functions` — Args `string[], string, string, string` → Returns `string[]`
- ✅ Task 3: Hook `useCreateBatchLots` + 4 tests unitaires (RPC params, invalidation queries, erreur doublon 23505, erreur générique)
- ✅ Task 4: UI formulaire batch — bouton "Ajouter en batch", Sheet avec textarea + Select + Input datalist, parseur multi-séparateur, validation complète (vide, >8, doublons intra-batch, doublons existants, variante/étage requis), compteur temps réel, bouton dynamique "Créer X lots"
- ✅ Task 5: 18 nouveaux tests (4 mutation + 14 UI) — total 289 tests, 0 régressions, lint clean
- Décision : ajout de polyfills jsdom (`hasPointerCapture`, `releasePointerCapture`, `setPointerCapture`, `scrollIntoView`) dans le test setup global pour supporter les interactions Radix Select dans les tests

### Change Log

- 2026-02-09: Story 2.5 complète — ajout de lots en batch (5 tasks, 18 nouveaux tests)
- 2026-02-09: Code review — 5 fixes (H1: erreurs per-field batch, H2: test 8 codes boundary, M1: constante MAX_BATCH_LOTS, M2: test multiline parsing, M3: waitFor act() warning)

### File List

**Nouveaux fichiers :**
- `supabase/migrations/008_batch_lots.sql`
- `src/lib/mutations/useCreateBatchLots.ts`
- `src/lib/mutations/useCreateBatchLots.test.ts`

**Fichiers modifiés :**
- `src/types/database.ts` — ajout `create_batch_lots_with_inheritance` dans Functions
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` — bouton batch, Sheet batch, formulaire, validation, parseur codes — [code-review] erreurs per-field, constante MAX_BATCH_LOTS
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.test.tsx` — 16 tests batch + mock useCreateBatchLots + mock sonner toast — [code-review] +2 tests (8 codes boundary, multiline parsing), waitFor act() fix
- `src/test/setup.ts` — polyfills jsdom pour Radix UI (hasPointerCapture, etc.)

