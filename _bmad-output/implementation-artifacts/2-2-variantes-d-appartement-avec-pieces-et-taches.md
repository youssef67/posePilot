# Story 2.2: Variantes d'appartement avec pièces et tâches

Status: done
Story ID: 2.2
Story Key: 2-2-variantes-d-appartement-avec-pieces-et-taches
Epic: 2 — Configuration & Structure de chantier
Date: 2026-02-09
Dependencies: Story 2.1 (done)
FRs: FR15

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux créer des variantes d'appartement avec des pièces et tâches par défaut,
Afin que les lots créés héritent automatiquement de la bonne configuration.

## Acceptance Criteria (BDD)

### AC1: Créer une variante avec des pièces

**Given** un plot existe avec des tâches définies
**When** l'utilisateur crée une variante (ex: "Type A") et définit les pièces (Séjour, Chambre, SDB, WC)
**Then** la variante est créée (tables `variantes`, `variante_pieces`) avec les pièces associées

### AC2: Héritage automatique des tâches du plot

**Given** une variante a des pièces définies
**When** l'utilisateur consulte la variante
**Then** chaque pièce hérite automatiquement des tâches du plot

### AC3: Liste des variantes avec compteur de pièces

**Given** l'utilisateur crée plusieurs variantes (Type A, Type B)
**When** il consulte la liste des variantes du plot
**Then** chaque variante affiche son nom et le nombre de pièces

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : tables `variantes` et `variante_pieces` (AC: #1)
  - [x] 1.1 Créer `supabase/migrations/005_variantes.sql` avec la table `variantes` : `id uuid PK`, `plot_id uuid FK → plots(id) ON DELETE CASCADE`, `nom text NOT NULL`, `created_at timestamptz NOT NULL DEFAULT now()`
  - [x] 1.2 Créer la table `variante_pieces` dans le même fichier : `id uuid PK`, `variante_id uuid FK → variantes(id) ON DELETE CASCADE`, `nom text NOT NULL`, `created_at timestamptz NOT NULL DEFAULT now()`
  - [x] 1.3 Index sur `plot_id` : `CREATE INDEX idx_variantes_plot_id ON public.variantes(plot_id)`
  - [x] 1.4 Index sur `variante_id` : `CREATE INDEX idx_variante_pieces_variante_id ON public.variante_pieces(variante_id)`
  - [x] 1.5 Appliquer RLS : `SELECT public.apply_rls_policy('variantes')` et `SELECT public.apply_rls_policy('variante_pieces')`

- [x] Task 2 — Types TypeScript (AC: #1, #2, #3)
  - [x] 2.1 Ajouter la table `variantes` dans `src/types/database.ts` avec Row/Insert/Update et `Relationships: [...]` (FK vers plots)
  - [x] 2.2 Ajouter la table `variante_pieces` dans `src/types/database.ts` avec Row/Insert/Update et `Relationships: [...]` (FK vers variantes)

- [x] Task 3 — Hooks queries et mutations (AC: #1, #2, #3)
  - [x] 3.1 Créer `src/lib/queries/useVariantes.ts` — `useQuery` avec key `['variantes', plotId]`, charge toutes les variantes du plot triées par `created_at ASC`
  - [x] 3.2 Créer `src/lib/queries/useVariantePieces.ts` — `useQuery` avec key `['variante-pieces', varianteId]`, charge toutes les pièces de la variante triées par `created_at ASC`
  - [x] 3.3 Créer `src/lib/mutations/useCreateVariante.ts` — `useMutation` avec optimistic update, insère une variante
  - [x] 3.4 Créer `src/lib/mutations/useDeleteVariante.ts` — `useMutation` pour supprimer une variante (avec AlertDialog de confirmation)
  - [x] 3.5 Créer `src/lib/mutations/useAddVariantePiece.ts` — `useMutation` avec optimistic update, ajoute une pièce à une variante
  - [x] 3.6 Créer `src/lib/mutations/useDeleteVariantePiece.ts` — `useMutation` pour supprimer une pièce d'une variante
  - [x] 3.7 Tests co-localisés pour chaque hook : `useVariantes.test.ts`, `useVariantePieces.test.ts`, `useCreateVariante.test.ts`, `useDeleteVariante.test.ts`, `useAddVariantePiece.test.ts`, `useDeleteVariantePiece.test.ts`

- [x] Task 4 — Restructuration route plot pour navigation imbriquée (AC: #1, #3)
  - [x] 4.1 Convertir `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId.tsx` en route LAYOUT avec `<Outlet />` — même pattern que story 2.1 Task 4 (conversion de $chantierId.tsx)
  - [x] 4.2 Créer `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` — Déplacer le contenu actuel du plot (header, tâches, dropdown, dialogs) dans ce fichier index
  - [x] 4.3 Vérifier que les tests existants de `plots.$plotId.test.tsx` passent toujours après restructuration

- [x] Task 5 — Section variantes sur la page plot index (AC: #3)
  - [x] 5.1 Dans `plots.$plotId/index.tsx`, ajouter une section "Variantes" sous la section tâches
  - [x] 5.2 Afficher la liste des variantes via `useVariantes(plotId)` en StatusCards (nom de la variante, nombre de pièces en sous-titre)
  - [x] 5.3 Bouton "Ajouter une variante" en bas de la section
  - [x] 5.4 Taper sur une variante → naviguer vers `plots.$plotId/variantes.$varianteId`
  - [x] 5.5 État vide : "Aucune variante configurée" + bouton "Ajouter votre première variante"

- [x] Task 6 — Création de variante (AC: #1)
  - [x] 6.1 Le bouton "Ajouter une variante" ouvre un Sheet (bottom sheet, pattern identique à la création de plot)
  - [x] 6.2 Champ unique : nom de la variante (texte, required)
  - [x] 6.3 Validation : nom requis, message d'erreur en français si vide
  - [x] 6.4 Après création : toast "Variante créée" + navigation vers la page de la variante pour définir les pièces

- [x] Task 7 — Page variante : pièces et tâches héritées (AC: #1, #2)
  - [x] 7.1 Créer `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/variantes.$varianteId.tsx` — Page de détail de la variante
  - [x] 7.2 Header : bouton retour + nom de la variante + bouton "Supprimer la variante" (DropdownMenu ⋮)
  - [x] 7.3 Section "Pièces" : liste des pièces de la variante, chaque pièce affiche son nom + le nombre de tâches héritées du plot en sous-texte (ex: "6 tâches")
  - [x] 7.4 Taper sur une pièce → expandable ou inline : afficher la liste des tâches héritées du plot (lecture seule, affichage informatif)
  - [x] 7.5 Champ d'ajout en bas : input texte + bouton "Ajouter une pièce" — permet d'ajouter une nouvelle pièce
  - [x] 7.6 Bouton de suppression (X) par pièce — supprime la pièce via `useDeleteVariantePiece`
  - [x] 7.7 Suppression de la variante : AlertDialog "Supprimer cette variante ?" / "La variante {nom} et toutes ses pièces seront supprimées définitivement." + bouton destructif rouge
  - [x] 7.8 Après suppression variante : toast "Variante supprimée" + navigation retour vers la page plot

- [x] Task 8 — Tests (toutes AC)
  - [x] 8.1 Tests `plots.$plotId/index.tsx` — section variantes affichée, état vide, bouton ajouter, navigation vers variante
  - [x] 8.2 Tests page variante — affiche pièces, tâches héritées visibles, ajout d'une pièce, suppression d'une pièce, suppression de la variante avec dialog
  - [x] 8.3 Vérifier que tous les tests existants passent (169 pré-existants + nouveaux = 0 régressions)
  - [x] 8.4 Lint clean (sauf pre-existing ThemeProvider warning)

## Dev Notes

### Architecture & Patterns obligatoires

- **Supabase Client SDK direct** — pas d'API custom, pas d'Edge Functions [Source: architecture.md#API & Communication Patterns]
- **Mutations optimistes standard** — `onMutate` / `onError` / `onSettled` [Source: architecture.md#API & Communication Patterns]
- **Query keys convention** — `['variantes', plotId]`, `['variante-pieces', varianteId]` [Source: architecture.md#Communication Patterns]
- **Types snake_case** — miroir exact du schéma PostgreSQL [Source: architecture.md#Naming Patterns]
- **Messages en français** — tous les labels, erreurs, toasts [Source: architecture.md#Enforcement Guidelines]
- **shadcn/ui avant custom** — utiliser les composants existants (Card, Button, Input, Sheet, AlertDialog, DropdownMenu) [Source: architecture.md#Enforcement Guidelines]
- **Pas de barrel files** — imports directs [Source: architecture.md#Structure Patterns]
- **Tests co-localisés** — `.test.ts(x)` à côté du fichier testé [Source: architecture.md#Structure Patterns]

### Décision architecturale : Héritage des tâches en lecture seule

Les pièces d'une variante n'ont PAS de colonne `task_definitions` propre. L'héritage des tâches est **implicite** :

1. La variante appartient à un plot (`plot_id` FK)
2. Le plot a des `task_definitions: string[]`
3. Quand on affiche une pièce de la variante, on lit les `task_definitions` du plot parent
4. C'est un affichage en lecture seule — l'utilisateur ne modifie pas les tâches au niveau variante

Ce choix est cohérent avec l'architecture qui prévoit la copie des tâches uniquement à la création des lots (story 2.4). Pas de table `variante_taches` nécessaire.

**Implication pour le hook `useVariantePieces`** : Ce hook charge les pièces, mais le composant doit AUSSI charger le plot (via `usePlots` existant ou un paramètre passé) pour afficher les tâches héritées à côté de chaque pièce.

### Migration SQL cible

```sql
-- supabase/migrations/005_variantes.sql
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
```

### Types database.ts — Sections à ajouter

```typescript
variantes: {
  Row: {
    id: string
    plot_id: string
    nom: string
    created_at: string
  }
  Insert: {
    id?: string
    plot_id: string
    nom: string
    created_at?: string
  }
  Update: {
    id?: string
    plot_id?: string
    nom?: string
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "variantes_plot_id_fkey"
      columns: ["plot_id"]
      isOneToOne: false
      referencedRelation: "plots"
      referencedColumns: ["id"]
    },
  ]
}

variante_pieces: {
  Row: {
    id: string
    variante_id: string
    nom: string
    created_at: string
  }
  Insert: {
    id?: string
    variante_id: string
    nom: string
    created_at?: string
  }
  Update: {
    id?: string
    variante_id?: string
    nom?: string
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "variante_pieces_variante_id_fkey"
      columns: ["variante_id"]
      isOneToOne: false
      referencedRelation: "variantes"
      referencedColumns: ["id"]
    },
  ]
}
```

**CRITIQUE** : La propriété `Relationships` DOIT être présente avec le FK pour que supabase-js v2 infère correctement les types via `.select('*')`. Sans elle, l'inférence de type échoue.

### Restructuration des routes — De leaf à layout (plots.$plotId)

Le fichier `plots.$plotId.tsx` actuel est une route LEAF. Pour supporter les sous-routes `variantes/$varianteId`, il doit devenir un LAYOUT — identique au pattern appliqué à `$chantierId.tsx` en story 2.1.

**Avant (route leaf) :**
```
src/routes/_authenticated/chantiers/$chantierId/
  plots.$plotId.tsx          ← page complète
  plots.$plotId.test.tsx     ← tests
```

**Après (layout + index + enfants) :**
```
src/routes/_authenticated/chantiers/$chantierId/
  plots.$plotId.tsx          ← LAYOUT (simple Outlet wrapper)
  plots.$plotId.test.tsx     ← tests du layout (si nécessaire)
  plots.$plotId/
    index.tsx                ← contenu principal (tâches + variantes)
    index.test.tsx           ← tests du contenu
    variantes.$varianteId.tsx    ← page détail variante + pièces
    variantes.$varianteId.test.tsx ← tests variante
```

**Le layout `plots.$plotId.tsx` garde :**
- Juste `<Outlet />` — le layout plot actuel est un simple wrapper (pattern établi par story 2.1 pour `$chantierId.tsx`)

**Le contenu `plots.$plotId/index.tsx` contient :**
- Le header (bouton retour, nom du plot, dropdown menu suppression)
- La section tâches (liste, ajout, suppression)
- LA NOUVELLE section variantes (liste StatusCards + bouton ajouter)
- Les dialogs (AlertDialog suppression plot, Sheet création variante)

**IMPORTANT — Convention TanStack Router :**
- `plots.$plotId/variantes.$varianteId.tsx` crée la route `/chantiers/:chantierId/plots/:plotId/variantes/:varianteId`
- Le `routeFileIgnorePattern: '.*\\.test\\.tsx?$'` dans `vite.config.ts` exclut les fichiers de test

### Pattern mutation — Création de variante

```typescript
// src/lib/mutations/useCreateVariante.ts
export function useCreateVariante() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ plotId, nom }: { plotId: string; nom: string }) => {
      const { data, error } = await supabase
        .from('variantes')
        .insert({ plot_id: plotId, nom })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ plotId, nom }) => {
      await queryClient.cancelQueries({ queryKey: ['variantes', plotId] })
      const previous = queryClient.getQueryData<VarianteRow[]>(['variantes', plotId])
      queryClient.setQueryData<VarianteRow[]>(
        ['variantes', plotId],
        (old) => [
          ...(old ?? []),
          {
            id: crypto.randomUUID(),
            plot_id: plotId,
            nom,
            created_at: new Date().toISOString(),
          },
        ],
      )
      return { previous }
    },
    onError: (_err, { plotId }, context) => {
      queryClient.setQueryData(['variantes', plotId], context?.previous)
    },
    onSettled: (_data, _err, { plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['variantes', plotId] })
    },
  })
}
```

### Pattern mutation — Ajout de pièce à une variante

```typescript
// src/lib/mutations/useAddVariantePiece.ts
export function useAddVariantePiece() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ varianteId, nom }: { varianteId: string; nom: string }) => {
      const { data, error } = await supabase
        .from('variante_pieces')
        .insert({ variante_id: varianteId, nom })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ varianteId, nom }) => {
      await queryClient.cancelQueries({ queryKey: ['variante-pieces', varianteId] })
      const previous = queryClient.getQueryData<VariantePieceRow[]>(['variante-pieces', varianteId])
      queryClient.setQueryData<VariantePieceRow[]>(
        ['variante-pieces', varianteId],
        (old) => [
          ...(old ?? []),
          {
            id: crypto.randomUUID(),
            variante_id: varianteId,
            nom,
            created_at: new Date().toISOString(),
          },
        ],
      )
      return { previous }
    },
    onError: (_err, { varianteId }, context) => {
      queryClient.setQueryData(['variante-pieces', varianteId], context?.previous)
    },
    onSettled: (_data, _err, { varianteId }) => {
      queryClient.invalidateQueries({ queryKey: ['variante-pieces', varianteId] })
      // Aussi invalider les variantes pour mettre à jour le compteur de pièces
    },
  })
}
```

**Note sur le compteur de pièces (AC3)** : La liste des variantes affiche le nombre de pièces en sous-titre. Deux approches possibles :

1. **Approche simple (recommandée)** : Le hook `useVariantes` fait un `.select('*, variante_pieces(count)')` — Supabase supporte les aggregates dans les selects relationnels
2. **Approche alternative** : Charger les variantes, puis pour chaque variante charger les pièces séparément — éviter cette approche (N+1 queries)

L'approche 1 est préférable car elle évite les requêtes N+1. Le hook `useVariantes` peut retourner les variantes avec leur count de pièces en une seule requête :

```typescript
// src/lib/queries/useVariantes.ts
export function useVariantes(plotId: string) {
  return useQuery({
    queryKey: ['variantes', plotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('variantes')
        .select('*, variante_pieces(count)')
        .eq('plot_id', plotId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!plotId,
  })
}
```

Cela retourne chaque variante avec `variante_pieces: [{ count: N }]` — le composant extrait `variante.variante_pieces[0].count` pour le sous-titre.

### Design de la page plot (mise à jour) — Tâches + Variantes

```
+--[←]--------[Plot A]--------[⋮]--------+
|                                          |
|  Tâches disponibles                      |
|  ┌──────────────────────────────────┐    |
|  │ ≡  Ragréage                  [×] │    |
|  │ ≡  Phonique                  [×] │    |
|  │ ≡  Pose                      [×] │    |
|  │ ≡  Plinthes                  [×] │    |
|  │ ≡  Joints                    [×] │    |
|  │ ≡  Silicone                  [×] │    |
|  └──────────────────────────────────┘    |
|  ┌────────────────────────┐ [Ajouter]    |
|  │ Nouvelle tâche...      │              |
|  └────────────────────────┘              |
|                                          |
|  ─────────────────────────────────────   |
|                                          |
|  Variantes                               |
|  ┌──────────────────────────────────┐    |
|  │ █ Type A                        │    |   ← StatusCard
|  │   4 pièces                      │    |
|  └──────────────────────────────────┘    |
|  ┌──────────────────────────────────┐    |
|  │ █ Type B                        │    |
|  │   3 pièces                      │    |
|  └──────────────────────────────────┘    |
|                                          |
|  [+ Ajouter une variante]               |
|                                          |
+------------------------------------------+
| [Chantiers] [Livraisons] [Act.] [Reg.]  |
+------------------------------------------+
```

### Design de la page variante — Pièces et tâches héritées

```
+--[←]--------[Type A]--------[⋮]--------+
|                                          |
|  Pièces                                  |
|                                          |
|  ┌──────────────────────────────────┐    |
|  │  Séjour                     [×]  │    |
|  │  └ 6 tâches héritées du plot     │    |
|  │                                   │    |
|  │  Chambre                    [×]  │    |
|  │  └ 6 tâches héritées du plot     │    |
|  │                                   │    |
|  │  SDB                        [×]  │    |
|  │  └ 6 tâches héritées du plot     │    |
|  │                                   │    |
|  │  WC                         [×]  │    |
|  │  └ 6 tâches héritées du plot     │    |
|  └──────────────────────────────────┘    |
|                                          |
|  ┌────────────────────────┐ [Ajouter]    |
|  │ Nouvelle pièce...      │              |
|  └────────────────────────┘              |
|                                          |
+------------------------------------------+
| [Chantiers] [Livraisons] [Act.] [Reg.]  |
+------------------------------------------+
```

- Chaque pièce affiche son nom + le sous-texte "X tâches héritées du plot"
- Taper sur une pièce → optionnel : expand pour voir la liste des tâches (Ragréage, Phonique, Pose, etc.) en lecture seule
- Le bouton `[×]` supprime la pièce immédiatement (sans confirmation — action légère)
- Le champ en bas permet d'ajouter une pièce personnalisée

### Conventions de nommage

- Fichier query : `useVariantes.ts`, `useVariantePieces.ts` (camelCase)
- Fichiers mutations : `useCreateVariante.ts`, `useDeleteVariante.ts`, `useAddVariantePiece.ts`, `useDeleteVariantePiece.ts`
- Route variante : `variantes.$varianteId.tsx` (convention TanStack Router, `.` = `/`)
- Tests co-localisés : `.test.ts(x)` à côté du fichier testé
- Tables DB : `variantes`, `variante_pieces` (snake_case, pluriel)

### Stack technique — Versions exactes (déjà installées)

| Bibliothèque | Version | Utilisation dans cette story |
|---|---|---|
| **@supabase/supabase-js** | 2.x | `.insert()`, `.select('*, variante_pieces(count)')`, `.eq()`, `.delete()`, `.single()`, `.order()` |
| **@tanstack/react-query** | 5.x | `useQuery`, `useMutation`, `useQueryClient`, `invalidateQueries` |
| **@tanstack/react-router** | 1.158.x | `createFileRoute`, `Outlet`, `Link`, `useNavigate`, `Route.useParams()` |
| **shadcn/ui** | CLI 3.8.4 | Button, Card, Input, Sheet (existant), AlertDialog, DropdownMenu (existants) |
| **lucide-react** | 0.563.x | `Plus`, `ArrowLeft`, `X`, `GripVertical`, `EllipsisVertical`, `Trash2`, `ChevronDown`/`ChevronRight` |
| **vitest** | 4.0.x | Tests unitaires co-localisés |

### Composants shadcn/ui — Tous déjà installés

Aucun nouveau composant shadcn/ui à installer. Tout est déjà en place depuis les stories précédentes :
- **Sheet** — installé en story 2.1 (formulaire création plot)
- **AlertDialog** — installé en story 1.6
- **DropdownMenu** — installé en story 1.6
- **Input** — installé en story 1.2
- **Button** — installé en story 1.1
- **Card** — installé en story 1.5

### Project Structure Notes

**Nouveaux fichiers à créer :**
- `supabase/migrations/005_variantes.sql` — Migration tables variantes et variante_pieces
- `src/lib/queries/useVariantes.ts` — Hook query variantes (avec count pièces)
- `src/lib/queries/useVariantes.test.ts` — Tests query
- `src/lib/queries/useVariantePieces.ts` — Hook query pièces d'une variante
- `src/lib/queries/useVariantePieces.test.ts` — Tests query
- `src/lib/mutations/useCreateVariante.ts` — Mutation création variante
- `src/lib/mutations/useCreateVariante.test.ts` — Tests mutation
- `src/lib/mutations/useDeleteVariante.ts` — Mutation suppression variante
- `src/lib/mutations/useDeleteVariante.test.ts` — Tests mutation
- `src/lib/mutations/useAddVariantePiece.ts` — Mutation ajout pièce
- `src/lib/mutations/useAddVariantePiece.test.ts` — Tests mutation
- `src/lib/mutations/useDeleteVariantePiece.ts` — Mutation suppression pièce
- `src/lib/mutations/useDeleteVariantePiece.test.ts` — Tests mutation
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` — Contenu plot (tâches + variantes)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.test.tsx` — Tests
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/variantes.$varianteId.tsx` — Page variante
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/variantes.$varianteId.test.tsx` — Tests

**Fichiers à modifier :**
- `src/types/database.ts` — Ajouter tables `variantes` et `variante_pieces`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId.tsx` — Convertir en layout (juste `<Outlet />`)
- `src/routeTree.gen.ts` — Auto-régénéré par TanStack Router

**Fichiers NON touchés :**
- `src/routes/_authenticated/index.tsx` — L'écran d'accueil ne change pas
- `src/routes/_authenticated/chantiers/$chantierId.tsx` — Le layout chantier ne change pas
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — La page index chantier ne change pas
- `src/components/StatusCard.tsx` — Réutilisé tel quel
- `src/components/BottomNavigation.tsx` — Pas de changement
- `src/lib/queries/usePlots.ts` — Pas de changement (le plot est chargé dans la page variante via les params)
- `src/lib/queries/useChantier.ts` — Pas de changement
- `src/lib/mutations/useCreatePlot.ts` — Pas de changement
- `src/lib/mutations/useUpdatePlotTasks.ts` — Pas de changement
- `src/lib/mutations/useDeletePlot.ts` — Pas de changement
- `src/types/enums.ts` — Pas de nouvel enum nécessaire

### Attention — Pièges courants

1. **La restructuration route plots.$plotId EST la partie la plus délicate** — Même pattern que story 2.1 Task 4. Le contenu existant du fichier `plots.$plotId.tsx` doit migrer intégralement vers `plots.$plotId/index.tsx`. Le layout ne garde que `<Outlet />`. Vérifier que le `routeTree.gen.ts` se régénère correctement.

2. **`Relationships: []` dans database.ts** — TOUJOURS inclure ce champ. Pour `variantes`, inclure la FK vers plots. Pour `variante_pieces`, inclure la FK vers variantes. Sans `Relationships`, supabase-js v2 ne peut pas inférer les types Row via `.select('*')`.

3. **Le `.select('*, variante_pieces(count)')` et les types** — Supabase retourne `variante_pieces: [{ count: N }]` pour le count relationnel. Le type inféré peut nécessiter un cast ou un type helper. Tester le retour exact et ajuster le type si nécessaire.

4. **Invalidation croisée après ajout/suppression de pièce** — Après ajout ou suppression d'une pièce, invalider AUSSI `['variantes', plotId]` pour que le compteur de pièces se rafraîchisse dans la liste des variantes. Le `plotId` doit être passé en paramètre de la mutation ou déduit via la variante.

5. **Les tests existants de `plots.$plotId.test.tsx`** — Après conversion en layout, les tests doivent mocker `<Outlet />`. Les assertions sur le header, les tâches et les dialogs doivent toujours passer depuis le nouveau `index.test.tsx`.

6. **Le paramètre route `$varianteId`** — Dans le fichier `variantes.$varianteId.tsx`, accéder aux paramètres via `Route.useParams()` qui retournera `{ chantierId, plotId, varianteId }`.

7. **Pas de Realtime pour les variantes** — Comme pour les plots, la configuration est faite par un seul utilisateur au bureau. Pas de subscription Realtime nécessaire.

8. **`ON DELETE CASCADE` en cascade** — Si un plot est supprimé, ses variantes sont supprimées (CASCADE), et les pièces des variantes aussi (CASCADE). Chaîne : chantier → plot → variante → variante_pieces.

9. **Prévention des doublons de pièces** — Comme pour les tâches du plot, empêcher l'ajout d'une pièce avec un nom déjà existant dans la variante (vérification case-insensitive côté client avant insert).

10. **Le hook `useVariantePieces` vs le count dans `useVariantes`** — Ce sont deux hooks distincts : `useVariantes` charge la liste avec count (pour la liste), `useVariantePieces` charge les pièces complètes (pour la page détail). Ne pas les confondre.

### References

- [Source: epics.md#Story 2.2] — User story, acceptance criteria BDD
- [Source: architecture.md#Data Architecture] — Tables de variantes avec copie à la création du lot
- [Source: architecture.md#API & Communication Patterns] — SDK Supabase direct, mutations optimistes
- [Source: architecture.md#Communication Patterns] — Query keys `[entite, ...filtres]`, invalidation
- [Source: architecture.md#Structure Patterns] — Structure projet par domaine, tests co-localisés
- [Source: architecture.md#Enforcement Guidelines] — shadcn first, messages français, snake_case DB
- [Source: architecture.md#Project Structure] — Routes et structure des fichiers
- [Source: ux-design-specification.md#Journey 4] — Configuration chantier : plots, tâches, variantes
- [Source: ux-design-specification.md#Design Direction] — Compact Cards, StatusCard, densité
- [Source: ux-design-specification.md#Interaction Patterns] — Saisie minimale, pas de formulaire multi-champs terrain
- [Source: prd.md#FR15] — Créer des variantes avec pièces et tâches

## Previous Story Intelligence (Story 2.1)

### Learnings critiques de la story précédente

1. **169 tests existants** — baseline à ne pas régresser (132 pré-story-2.1 + 37 story 2.1)
2. **Restructuration route → layout** : Pattern maîtrisé. `$chantierId.tsx` converti en layout avec `<Outlet />`, contenu déplacé dans `$chantierId/index.tsx`. Appliquer le même pattern pour `plots.$plotId.tsx`.
3. **6 issues code review corrigées en 2.1** :
   - Double header refactoré (layout → thin wrapper) — ne PAS reproduire ce problème
   - Sheet sr-only "Fermer" — penser à l'accessibilité sur le nouveau Sheet
   - Duplicate task prevention (case-insensitive) — appliquer pour les noms de pièces
   - `useUpdatePlotTasks` invalidation systématique — modèle pour les invalidations croisées
4. **`text[]` PostgreSQL → `string[]` TS** : Mapping automatique validé. Pas pertinent ici (pas de colonnes array dans cette story).
5. **StatusCard réutilisable** : Accepte `title`, `subtitle`, `statusColor`, `onClick`. Pattern identique pour les variantes dans la liste.
6. **Sheet pattern** : Bottom sheet pour formulaire de création avec champ unique, validation, toast de succès, navigation post-création. Réutiliser exactement ce pattern pour la création de variante.
7. **AlertDialog + DropdownMenu** : État contrôlé `open/onOpenChange` quand trigger dans DropdownMenu. Pattern identique pour le menu de suppression de variante.
8. **Tests route** : `createRouter` + `createMemoryHistory` + `RouterProvider` avec mocks Supabase chainable. Pattern identique pour les nouvelles routes.

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

## Git Intelligence

### Commits récents (5 derniers)

```
e6487b6 feat: auth, route protection & login — Story 1-2 + code review fixes
e1c18ef fix: code review story 1-1 — 7 issues corrigées
61938ec docs: story 1-1 complete — all tasks done, status review
3789f3d docs: update story 1-1 progress — tasks 1-6 implemented
a3719c1 feat: initial project scaffolding — Story 1-1
```

Note : Les stories 1.3 à 2.1 ne sont pas encore commitées (changements en working directory). Le développeur devra travailler par-dessus cet état non-commité.

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
- 169 tests existants

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Existing plot tests had button selector collision after adding variantes section — fixed by changing `/Ajouter/i` regex to exact string `'Ajouter'`
- Added mocks for `useVariantes` and `useCreateVariante` in existing `plots.$plotId.test.tsx`

### Completion Notes List

- Task 1: Migration SQL `005_variantes.sql` — tables `variantes` et `variante_pieces` avec FK CASCADE, index, RLS
- Task 2: Types database.ts — `variantes` et `variante_pieces` avec `Relationships` FK complètes
- Task 3: 6 hooks créés (2 queries, 4 mutations) + 6 fichiers tests co-localisés = 20 tests
- Task 4: `plots.$plotId.tsx` converti en layout (Outlet), contenu déplacé vers `plots.$plotId/index.tsx`, tests existants adaptés et passent
- Task 5: Section "Variantes" ajoutée dans `index.tsx` — StatusCards avec compteur pièces, état vide, bouton ajouter, navigation
- Task 6: Sheet bottom pour création variante — champ nom, validation, toast, navigation post-création
- Task 7: Page variante — header, pièces expandables avec tâches héritées du plot, ajout/suppression pièce, suppression variante avec AlertDialog
- Task 8: 7 tests index (section variantes) + 10 tests variante page = 17 tests. Full suite: 206/206 passent, lint clean (sauf ThemeProvider pre-existing)
- Invalidation croisée implémentée : ajout/suppression pièce invalide aussi `['variantes', plotId]` pour le compteur
- Prévention doublons : nom de pièce case-insensitive vérifié côté client

### Change Log

- 2026-02-09: Story 2.2 complète — variantes d'appartement avec pièces et tâches héritées (8 tasks, 206 tests, 0 régressions)
- 2026-02-09: Code review — 7 issues (1H, 4M, 2L) trouvées et corrigées : prévention doublons variantes, feedback doublons pièces, types propres, loading state complet, état "Variante introuvable", cache cleanup

### Senior Developer Review (AI)

**Reviewer:** Youssef — 2026-02-09
**Outcome:** Approved with fixes applied

**Issues Found:** 1 High, 4 Medium, 2 Low — all 7 fixed

| # | Severity | Description | File | Fix Applied |
|---|----------|-------------|------|-------------|
| H1 | HIGH | Aucune prévention des doublons de nom de variante | `plots.$plotId/index.tsx` | Ajout vérification case-insensitive + message d'erreur |
| M1 | MEDIUM | Rejet silencieux des pièces en doublon — aucun feedback | `variantes.$varianteId.tsx` | Ajout `toast.error('Cette pièce existe déjà')` |
| M2 | MEDIUM | Cast de type sale pour le count de pièces | `useVariantes.ts`, `index.tsx`, `useCreateVariante.ts`, `useDeleteVariante.ts` | Type `VarianteWithPieceCount` exporté, casts supprimés |
| M3 | MEDIUM | Loading state incomplet (flash "0 tâches") | `variantes.$varianteId.tsx` | Ajout check `plotsLoading \|\| variantesLoading` |
| M4 | MEDIUM | Pas d'état "Variante introuvable" | `variantes.$varianteId.tsx` | Ajout état erreur avec bouton retour (pattern Plot) |
| L1 | LOW | `useDeleteVariantePiece` retourne undefined au lieu de `[]` | `useDeleteVariantePiece.ts` | `old?.filter()` → `(old ?? []).filter()` |
| L2 | LOW | `useDeleteVariante` ne nettoie pas le cache variante-pieces | `useDeleteVariante.ts` | Ajout `removeQueries(['variante-pieces', varianteId])` |

**Post-fix:** 206/206 tests pass, lint clean (sauf pre-existing ThemeProvider)

### File List

**Nouveaux fichiers :**
- `supabase/migrations/005_variantes.sql`
- `src/lib/queries/useVariantes.ts`
- `src/lib/queries/useVariantes.test.ts`
- `src/lib/queries/useVariantePieces.ts`
- `src/lib/queries/useVariantePieces.test.ts`
- `src/lib/mutations/useCreateVariante.ts`
- `src/lib/mutations/useCreateVariante.test.ts`
- `src/lib/mutations/useDeleteVariante.ts`
- `src/lib/mutations/useDeleteVariante.test.ts`
- `src/lib/mutations/useAddVariantePiece.ts`
- `src/lib/mutations/useAddVariantePiece.test.ts`
- `src/lib/mutations/useDeleteVariantePiece.ts`
- `src/lib/mutations/useDeleteVariantePiece.test.ts`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.test.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/variantes.$varianteId.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/variantes.$varianteId.test.tsx`

**Fichiers modifiés :**
- `src/types/database.ts` — ajout tables variantes et variante_pieces
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId.tsx` — converti en layout (Outlet)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId.test.tsx` — ajout mocks useVariantes/useCreateVariante, fix sélecteurs
- `src/routeTree.gen.ts` — auto-régénéré par TanStack Router
