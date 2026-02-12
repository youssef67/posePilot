# Story 2.1: Création de plots et définition des tâches

Status: done
Story ID: 2.1
Story Key: 2-1-creation-de-plots-et-definition-des-taches
Epic: 2 — Configuration & Structure de chantier
Date: 2026-02-09
Dependencies: Story 1.1 (done), Story 1.2 (done), Story 1.3 (done), Story 1.4 (done), Story 1.5 (done), Story 1.6 (done), Story 1.7 (done)
FRs: FR13, FR14

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux créer des plots dans un chantier complet et définir les tâches disponibles,
Afin que la structure du chantier reflète l'organisation physique du terrain.

## Acceptance Criteria (BDD)

### AC1: Créer un plot dans un chantier complet

**Given** l'utilisateur est dans un chantier de type complet
**When** il tape sur "Ajouter un plot" et saisit un nom (ex: "Plot A")
**Then** le plot est créé (table `plots`) et apparaît dans la vue chantier

### AC2: Configurer les tâches d'un plot

**Given** un plot existe
**When** l'utilisateur accède à la configuration des tâches du plot
**Then** il peut définir la liste des tâches disponibles (ex: Ragréage, Phonique, Pose, Plinthes, Joints, Silicone)

### AC3: Liste des tâches affichée et modifiable

**Given** les tâches du plot sont définies
**When** l'utilisateur consulte le plot
**Then** la liste des tâches est affichée et modifiable (ajout/suppression)

### AC4: Pas de plots pour les chantiers légers

**Given** l'utilisateur est dans un chantier de type léger
**When** il consulte la vue chantier
**Then** aucune option de création de plot n'est disponible

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : table `plots` (AC: #1)
  - [x] 1.1 Créer `supabase/migrations/004_plots.sql` avec la table `plots` : `id uuid PK`, `chantier_id uuid FK → chantiers(id) ON DELETE CASCADE`, `nom text NOT NULL`, `task_definitions text[] NOT NULL DEFAULT '{}'`, `created_at timestamptz NOT NULL DEFAULT now()`
  - [x] 1.2 Index sur `chantier_id` : `CREATE INDEX idx_plots_chantier_id ON public.plots(chantier_id)`
  - [x] 1.3 Appliquer RLS via `SELECT public.apply_rls_policy('plots')`

- [x] Task 2 — Types TypeScript (AC: #1, #2, #3)
  - [x] 2.1 Ajouter la table `plots` dans `src/types/database.ts` avec Row/Insert/Update et `Relationships: [...]` (FK vers chantiers)
  - [x] 2.2 CRITIQUE : Inclure `Relationships` avec le foreign key pour que supabase-js v2 infère correctement les types via `.select('*')`

- [x] Task 3 — Hooks queries et mutations (AC: #1, #2, #3)
  - [x] 3.1 Créer `src/lib/queries/usePlots.ts` — `useQuery` avec key `['plots', chantierId]`, charge tous les plots du chantier triés par `created_at ASC`
  - [x] 3.2 Créer `src/lib/mutations/useCreatePlot.ts` — `useMutation` avec optimistic update, insère un plot avec `task_definitions` par défaut (liste de tâches courantes)
  - [x] 3.3 Créer `src/lib/mutations/useUpdatePlotTasks.ts` — `useMutation` pour remplacer le tableau `task_definitions` complet (add/remove/reorder côté client, envoyer le tableau final)
  - [x] 3.4 Créer `src/lib/mutations/useDeletePlot.ts` — `useMutation` pour supprimer un plot (avec AlertDialog de confirmation)
  - [x] 3.5 Tests co-localisés pour chaque hook : `usePlots.test.ts`, `useCreatePlot.test.ts`, `useUpdatePlotTasks.test.ts`, `useDeletePlot.test.ts`

- [x] Task 4 — Restructuration route chantier pour navigation imbriquée (AC: #1, #4)
  - [x] 4.1 Convertir `src/routes/_authenticated/chantiers/$chantierId.tsx` en route LAYOUT avec `<Outlet />` — Déplacer le contenu actuel (header, menu options, dialogs) dans le layout, ajouter `<Outlet />` pour le contenu enfant
  - [x] 4.2 Créer `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — Contenu principal : pour un chantier **complet**, afficher la liste des plots (StatusCards) + bouton "Ajouter un plot" ; pour un chantier **léger**, afficher le placeholder existant "Détails du chantier à venir"
  - [x] 4.3 Mettre à jour `src/routeTree.gen.ts` si nécessaire (auto-généré par TanStack Router)
  - [x] 4.4 Vérifier que les tests existants de `$chantierId.test.tsx` passent toujours après restructuration — adapter les mocks si les imports changent

- [x] Task 5 — Page index chantier : liste des plots (AC: #1, #4)
  - [x] 5.1 Dans `$chantierId/index.tsx`, pour un chantier `complet` : afficher la liste des plots via `usePlots(chantierId)` en StatusCards (nom du plot, nombre de tâches définies en sous-titre)
  - [x] 5.2 Bouton "Ajouter un plot" en bas de la liste (pas de FAB — simple bouton pleine largeur avec icône Plus)
  - [x] 5.3 Taper sur un plot → naviguer vers `/chantiers/$chantierId/plots/$plotId`
  - [x] 5.4 État vide : "Aucun plot configuré" + bouton "Ajouter votre premier plot"
  - [x] 5.5 Pour un chantier `leger` : afficher un message "Les besoins et livraisons seront disponibles prochainement" (placeholder Epic 6)
  - [x] 5.6 StatusCard : `statusColor` = `STATUS_COLORS.NOT_STARTED` par défaut (pas d'avancement calculé pour l'instant)

- [x] Task 6 — Création de plot (AC: #1, #2)
  - [x] 6.1 Le bouton "Ajouter un plot" ouvre un formulaire simple — soit un Sheet (shadcn/ui), soit un formulaire inline
  - [x] 6.2 Champ unique : nom du plot (texte, required)
  - [x] 6.3 À la création, les `task_definitions` sont initialisées avec les tâches par défaut : `['Ragréage', 'Phonique', 'Pose', 'Plinthes', 'Joints', 'Silicone']`
  - [x] 6.4 Validation : nom requis, message d'erreur en français si vide
  - [x] 6.5 Après création : toast "Plot créé" + navigation vers la page du plot pour configurer les tâches
  - [x] 6.6 Installer le composant `Sheet` de shadcn/ui si utilisé : `npx shadcn@latest add sheet`

- [x] Task 7 — Page plot : affichage et gestion des tâches (AC: #2, #3)
  - [x] 7.1 Créer `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId.tsx` — Page de détail du plot
  - [x] 7.2 Header : bouton retour + nom du plot + bouton "Supprimer le plot" (DropdownMenu ⋮)
  - [x] 7.3 Section "Tâches disponibles" : liste ordonnée des `task_definitions` du plot, chaque item affiché comme un élément de liste avec icône GripVertical (indicateur d'ordre) et bouton X pour supprimer
  - [x] 7.4 Champ d'ajout en bas de la liste : input texte + bouton "Ajouter" — permet d'ajouter une nouvelle tâche à la fin de la liste
  - [x] 7.5 Suppression d'une tâche : retirer du tableau `task_definitions` via `useUpdatePlotTasks` (pas de confirmation — action légère, la tâche peut être re-ajoutée)
  - [x] 7.6 **PAS de drag-and-drop pour le MVP** — l'ordre initial (tâches par défaut) convient. Si besoin de réordonner, supprimer et re-ajouter dans l'ordre voulu. Le drag-and-drop mobile est complexe à implémenter correctement et peut être ajouté plus tard.
  - [x] 7.7 Suppression du plot : AlertDialog de confirmation "Supprimer ce plot ?" / "Le plot {nom} et toutes ses données seront supprimés définitivement. Cette action est irréversible." + bouton destructif rouge
  - [x] 7.8 Après suppression : toast "Plot supprimé" + navigation retour vers la page chantier

- [x] Task 8 — Tests (toutes AC)
  - [x] 8.1 Tests `$chantierId/index.tsx` — chantier complet affiche plots, chantier léger n'affiche pas de plots, état vide, bouton ajouter
  - [x] 8.2 Tests page plot — affiche tâches, ajout d'une tâche, suppression d'une tâche, suppression du plot avec dialog
  - [x] 8.3 Vérifier que tous les tests existants passent (132 pré-existants + nouveaux = 0 régressions)
  - [x] 8.4 Lint clean (sauf pre-existing ThemeProvider warning)

## Dev Notes

### Architecture & Patterns obligatoires

- **Supabase Client SDK direct** — pas d'API custom, pas d'Edge Functions [Source: architecture.md#API & Communication Patterns]
- **Mutations optimistes standard** — `onMutate` / `onError` / `onSettled` [Source: architecture.md#API & Communication Patterns]
- **Query keys convention** — `['plots', chantierId]`, `['plot', plotId]` [Source: architecture.md#Communication Patterns]
- **Types snake_case** — miroir exact du schéma PostgreSQL [Source: architecture.md#Naming Patterns]
- **Messages en français** — tous les labels, erreurs, toasts [Source: architecture.md#Enforcement Guidelines]
- **shadcn/ui avant custom** — utiliser les composants existants (Card, Button, Input, Sheet, AlertDialog, DropdownMenu) [Source: architecture.md#Enforcement Guidelines]
- **Pas de barrel files** — imports directs [Source: architecture.md#Structure Patterns]
- **Tests co-localisés** — `.test.ts(x)` à côté du fichier testé [Source: architecture.md#Structure Patterns]

### Décision architecturale : `text[]` pour les tâches

Les `task_definitions` sont stockées comme un tableau PostgreSQL `text[]` directement sur la table `plots`, et NON dans une table de jointure séparée. Justification :

1. **Données simples** — juste des noms de tâches (chaînes de caractères), pas d'objets complexes
2. **Liste courte** — typiquement 3-10 éléments, bien dans la zone de confort des arrays PostgreSQL
3. **Ordre préservé** — les arrays PostgreSQL maintiennent l'ordre nativement
4. **Code plus simple** — pas de JOIN, pas de colonne `order`, pas de table intermédiaire
5. **TypeScript naturel** — supabase-js v2 mappe `text[]` vers `string[]` automatiquement
6. **Opérations côté client** — on remplace le tableau entier à chaque modification (add/remove). Pas de risque de race condition pour 2-3 utilisateurs.

### Migration SQL cible

```sql
-- supabase/migrations/004_plots.sql
-- Story 2.1 : Table des plots avec définition des tâches par plot

CREATE TABLE public.plots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id uuid NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  nom text NOT NULL,
  task_definitions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_plots_chantier_id ON public.plots(chantier_id);

SELECT public.apply_rls_policy('plots');
```

### Types database.ts — Section plots à ajouter

```typescript
plots: {
  Row: {
    id: string
    chantier_id: string
    nom: string
    task_definitions: string[]
    created_at: string
  }
  Insert: {
    id?: string
    chantier_id: string
    nom: string
    task_definitions?: string[]
    created_at?: string
  }
  Update: {
    id?: string
    chantier_id?: string
    nom?: string
    task_definitions?: string[]
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "plots_chantier_id_fkey"
      columns: ["chantier_id"]
      isOneToOne: false
      referencedRelation: "chantiers"
      referencedColumns: ["id"]
    },
  ]
}
```

**CRITIQUE** : La propriété `Relationships` DOIT être présente avec le FK pour que supabase-js v2 infère correctement les types via `.select('*')`. Sans elle, l'inférence de type échoue.

### Restructuration des routes — De leaf à layout

Le fichier `$chantierId.tsx` actuel est une route LEAF (pas d'enfants). Pour supporter les sous-routes `plots/$plotId`, il doit devenir un LAYOUT :

**Avant (route leaf) :**
```
src/routes/_authenticated/chantiers/
  $chantierId.tsx          ← page complète
  $chantierId.test.tsx     ← tests
```

**Après (layout + index + enfants) :**
```
src/routes/_authenticated/chantiers/
  $chantierId.tsx          ← LAYOUT (header commun + Outlet)
  $chantierId.test.tsx     ← tests du layout
  $chantierId/
    index.tsx              ← contenu principal (plots list ou placeholder léger)
    index.test.tsx         ← tests du contenu
    plots.$plotId.tsx      ← page détail plot + tâches
    plots.$plotId.test.tsx ← tests plot
```

**Le layout `$chantierId.tsx` garde :**
- Le header avec bouton retour, nom du chantier, dropdown menu (terminer/supprimer)
- Les AlertDialogs de confirmation
- `<Outlet />` pour le contenu enfant

**Le contenu `$chantierId/index.tsx` contient :**
- La liste des plots (chantier complet) ou le placeholder (chantier léger)
- Le badge type + avancement
- Le bouton "Ajouter un plot"

**IMPORTANT — Convention TanStack Router :**
- `$chantierId/plots.$plotId.tsx` (avec le `.` et pas `/`) crée la route `/chantiers/:chantierId/plots/:plotId` sans nécessiter un dossier `plots/`
- Vérifier que `routeFileIgnorePattern: '.*\\.test\\.tsx?$'` dans `vite.config.ts` exclut bien les fichiers de test

### Tâches par défaut à la création d'un plot

Quand un plot est créé, il est initialisé avec les tâches courantes de pose de carrelage :

```typescript
const DEFAULT_TASK_DEFINITIONS = [
  'Ragréage',
  'Phonique',
  'Pose',
  'Plinthes',
  'Joints',
  'Silicone',
]
```

L'utilisateur peut ensuite ajouter, supprimer ou modifier cette liste depuis la page du plot. Cette constante est définie dans le fichier de mutation `useCreatePlot.ts` ou dans un fichier utilitaire dédié.

### Pattern mutation — Création de plot

```typescript
// src/lib/mutations/useCreatePlot.ts
export function useCreatePlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ chantierId, nom }: { chantierId: string; nom: string }) => {
      const { data, error } = await supabase
        .from('plots')
        .insert({
          chantier_id: chantierId,
          nom,
          task_definitions: DEFAULT_TASK_DEFINITIONS,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ chantierId, nom }) => {
      await queryClient.cancelQueries({ queryKey: ['plots', chantierId] })
      const previous = queryClient.getQueryData(['plots', chantierId])
      queryClient.setQueryData(
        ['plots', chantierId],
        (old: any[] | undefined) => [
          ...(old ?? []),
          {
            id: crypto.randomUUID(),
            chantier_id: chantierId,
            nom,
            task_definitions: DEFAULT_TASK_DEFINITIONS,
            created_at: new Date().toISOString(),
          },
        ]
      )
      return { previous }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['plots', chantierId], context?.previous)
    },
    onSettled: (_data, _err, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['plots', chantierId] })
    },
  })
}
```

### Pattern mutation — Mise à jour des tâches

```typescript
// src/lib/mutations/useUpdatePlotTasks.ts
export function useUpdatePlotTasks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ plotId, taskDefinitions }: { plotId: string; taskDefinitions: string[] }) => {
      const { data, error } = await supabase
        .from('plots')
        .update({ task_definitions: taskDefinitions })
        .eq('id', plotId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['plots', data.chantier_id] })
      }
    },
  })
}
```

### Design de la page chantier (complet) — Liste des plots

```
+--[←]--------[Les Oliviers]--------[⋮]--+   ← Layout $chantierId.tsx
|                                          |
|  [Complet]                    0%         |   ← index.tsx
|                                          |
|  Plots                                   |
|  ┌──────────────────────────────────┐    |
|  │ █ Plot A                         │    |   ← StatusCard
|  │   6 tâches définies              │    |
|  └──────────────────────────────────┘    |
|  ┌──────────────────────────────────┐    |
|  │ █ Plot B                         │    |
|  │   6 tâches définies              │    |
|  └──────────────────────────────────┘    |
|                                          |
|  [+ Ajouter un plot]                     |   ← Bouton pleine largeur
|                                          |
+------------------------------------------+
| [Chantiers] [Livraisons] [Act.] [Reg.]  |   ← BottomNavigation
+------------------------------------------+
```

### Design de la page plot — Configuration des tâches

```
+--[←]--------[Plot A]--------[⋮]--------+
|                                          |
|  Tâches disponibles                      |
|                                          |
|  ┌──────────────────────────────────┐    |
|  │ ≡  Ragréage                  [×] │    |
|  │ ≡  Phonique                  [×] │    |
|  │ ≡  Pose                      [×] │    |
|  │ ≡  Plinthes                  [×] │    |
|  │ ≡  Joints                    [×] │    |
|  │ ≡  Silicone                  [×] │    |
|  └──────────────────────────────────┘    |
|                                          |
|  ┌────────────────────────┐ [Ajouter]    |
|  │ Nouvelle tâche...      │              |
|  └────────────────────────┘              |
|                                          |
+------------------------------------------+
| [Chantiers] [Livraisons] [Act.] [Reg.]  |
+------------------------------------------+
```

- L'icône `≡` (GripVertical) est purement indicative de l'ordre — pas de drag-and-drop pour le MVP
- Le bouton `[×]` (X) supprime la tâche du tableau immédiatement (sans confirmation — action légère)
- Le champ en bas permet d'ajouter une tâche personnalisée

### Design chantier léger — Pas de plots

```
+--[←]--------[Rénovation Duval]--------[⋮]--+
|                                              |
|  [Léger]                                     |
|                                              |
|  Les besoins et livraisons seront            |
|  disponibles prochainement.                  |
|                                              |
+----------------------------------------------+
| [Chantiers] [Livraisons] [Act.] [Reg.]      |
+----------------------------------------------+
```

Aucune option plot/lot pour les chantiers légers — conformément à l'architecture (FR7, FR13).

### Conventions de nommage

- Fichier query : `usePlots.ts` (camelCase, pluriel)
- Fichiers mutations : `useCreatePlot.ts`, `useUpdatePlotTasks.ts`, `useDeletePlot.ts`
- Route plot : `plots.$plotId.tsx` (convention TanStack Router, `.` = `/`)
- Tests co-localisés : `.test.ts(x)` à côté du fichier testé
- Constante : `DEFAULT_TASK_DEFINITIONS` (UPPER_SNAKE_CASE)

### Stack technique — Versions exactes (déjà installées)

| Bibliothèque | Version | Utilisation dans cette story |
|---|---|---|
| **@supabase/supabase-js** | 2.x | `.insert()`, `.update()`, `.eq()`, `.select()`, `.single()`, `.order()` |
| **@tanstack/react-query** | 5.x | `useQuery`, `useMutation`, `useQueryClient`, `invalidateQueries` |
| **@tanstack/react-router** | 1.158.x | `createFileRoute`, `Outlet`, `Link`, `useNavigate`, `Route.useParams()` |
| **shadcn/ui** | CLI 3.8.4 | Button, Card, Input, Sheet (à installer si pas présent), AlertDialog, DropdownMenu (existants) |
| **lucide-react** | 0.563.x | `Plus`, `ArrowLeft`, `X`, `GripVertical`, `EllipsisVertical`, `Trash2` |
| **vitest** | 4.0.x | Tests unitaires co-localisés |

### Composants shadcn/ui à vérifier/installer

- **Sheet** — peut être nécessaire pour le formulaire de création de plot. Vérifier s'il est déjà installé : `npx shadcn@latest add sheet` si absent
- **AlertDialog** — déjà installé (story 1.6)
- **DropdownMenu** — déjà installé (story 1.6)
- **Input** — déjà installé (story 1.2)
- **Button** — déjà installé (story 1.1)

### Project Structure Notes

**Nouveaux fichiers à créer :**
- `supabase/migrations/004_plots.sql` — Migration table plots
- `src/lib/queries/usePlots.ts` — Hook query plots
- `src/lib/queries/usePlots.test.ts` — Tests query
- `src/lib/mutations/useCreatePlot.ts` — Mutation création
- `src/lib/mutations/useCreatePlot.test.ts` — Tests mutation
- `src/lib/mutations/useUpdatePlotTasks.ts` — Mutation tâches
- `src/lib/mutations/useUpdatePlotTasks.test.ts` — Tests mutation
- `src/lib/mutations/useDeletePlot.ts` — Mutation suppression
- `src/lib/mutations/useDeletePlot.test.ts` — Tests mutation
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — Page contenu chantier
- `src/routes/_authenticated/chantiers/$chantierId/index.test.tsx` — Tests
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId.tsx` — Page plot + tâches
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId.test.tsx` — Tests

**Fichiers à modifier :**
- `src/types/database.ts` — Ajouter table `plots`
- `src/routes/_authenticated/chantiers/$chantierId.tsx` — Convertir en layout (ajouter `<Outlet />`, garder header/menu)
- `src/routes/_authenticated/chantiers/$chantierId.test.tsx` — Adapter pour le layout refactoré

**Fichiers NON touchés :**
- `src/routes/_authenticated/index.tsx` — L'écran d'accueil ne change pas
- `src/components/StatusCard.tsx` — Réutilisé tel quel
- `src/components/BottomNavigation.tsx` — Pas de changement
- `src/lib/queries/useChantiers.ts` — Pas de changement
- `src/lib/queries/useChantier.ts` — Pas de changement
- `src/lib/mutations/useCreateChantier.ts` — Pas de changement
- `src/lib/mutations/useUpdateChantierStatus.ts` — Pas de changement
- `src/lib/subscriptions/useRealtimeChantiers.ts` — Pas de changement
- `src/types/enums.ts` — `TaskStatus` existe déjà
- `src/main.tsx` — Pas de changement
- `src/index.css` — Pas de changement

### Attention — Pièges courants

1. **La restructuration route EST la partie la plus délicate** — Quand `$chantierId.tsx` devient un layout avec `<Outlet />`, TanStack Router attend un `$chantierId/index.tsx` pour le contenu à `/chantiers/:chantierId`. Sans cet index, la page sera vide. Vérifier que le routeTree.gen.ts se régénère correctement.

2. **`Relationships: []` dans database.ts** — TOUJOURS inclure ce champ, même vide. Pour la table `plots`, inclure la FK vers chantiers. Sans `Relationships`, supabase-js v2 ne peut pas inférer les types Row via `.select('*')`. Ceci est un bug connu documenté dans MEMORY.md.

3. **Le `text[]` PostgreSQL et TypeScript** — Supabase JS v2 mappe `text[]` vers `string[]` automatiquement dans les types générés. En insert/update, passer un `string[]` JavaScript directement fonctionne. Ne PAS sérialiser en JSON.

4. **Ne PAS créer de table `plot_taches` séparée** — Les tâches sont des noms (strings) stockés dans `task_definitions text[]` sur la table `plots`. Pas de table de jointure. La table `taches` (avec statuts par pièce) viendra dans les stories 2.4+ quand les lots et pièces seront créés.

5. **Les tests existants de `$chantierId.test.tsx`** — Après conversion en layout, le test doit mocker `<Outlet />` ou rendre le layout seul. Les assertions sur le header, le dropdown et les dialogs doivent toujours passer.

6. **`routeFileIgnorePattern: '.*\\.test\\.tsx?$'`** — Déjà configuré dans `vite.config.ts`. Les fichiers `.test.tsx` dans `$chantierId/` ne seront PAS traités comme des routes.

7. **Le paramètre route `$plotId`** — Dans le fichier `plots.$plotId.tsx`, accéder au paramètre via `Route.useParams()` qui retournera `{ chantierId, plotId }`.

8. **Pas de Realtime pour les plots dans cette story** — Les subscriptions Realtime ne sont pas nécessaires pour la configuration (faite par un seul utilisateur au bureau). À ajouter plus tard si nécessaire.

9. **`ON DELETE CASCADE` sur le FK chantier** — Si un chantier est supprimé, ses plots sont supprimés automatiquement. Cohérent avec le soft delete existant (`chantier_status = 'supprime'`).

10. **Le composant Sheet de shadcn/ui** — S'il n'est pas installé, l'installer AVANT de l'utiliser. Alternativement, un formulaire inline (visible directement dans la page) peut être plus simple et plus accessible sur mobile.

### References

- [Source: epics.md#Story 2.1] — User story, acceptance criteria BDD
- [Source: architecture.md#Data Architecture] — Modélisation hiérarchique, tables relationnelles normalisées
- [Source: architecture.md#API & Communication Patterns] — SDK Supabase direct, mutations optimistes
- [Source: architecture.md#Communication Patterns] — Query keys `[entite, ...filtres]`, invalidation
- [Source: architecture.md#Structure Patterns] — Structure projet par domaine, tests co-localisés
- [Source: architecture.md#Enforcement Guidelines] — shadcn first, messages français, snake_case DB
- [Source: architecture.md#Project Structure] — Routes `$chantierId/plots/$plotId.tsx`
- [Source: ux-design-specification.md#Journey 4] — Configuration chantier : plots, tâches, variantes
- [Source: ux-design-specification.md#Design Direction] — Compact Cards A+F, StatusCard, densité
- [Source: ux-design-specification.md#Interaction Patterns] — Saisie minimale, pas de formulaire multi-champs terrain
- [Source: prd.md#FR13] — Créer des plots au sein d'un chantier complet
- [Source: prd.md#FR14] — Définir les tâches disponibles par plot

## Previous Story Intelligence (Story 1.7)

### Learnings critiques de la story précédente

1. **132 tests existants** — baseline à ne pas régresser (114 pré-story-1.7 + 18 story 1.7)
2. **vite-plugin-pwa v1.2.0** — configuré, ne pas toucher dans cette story
3. **Safe areas** — `env(safe-area-inset-top/bottom)` déjà en place sur le layout authentifié
4. **shadcn eslint-disable pattern** — `tabs.tsx`, `button.tsx` ont le commentaire. Les nouveaux composants shadcn qui exportent des variants `cva` nécessitent ce commentaire.
5. **Pre-existing lint warning** — `ThemeProvider.tsx:64` (react-refresh/only-export-components) — toujours ignoré
6. **useUpdateChantierStatus pattern mature** — Rollback complet via `getQueriesData`, navigation `onSuccess` (pas `onSettled`). Réutiliser pour `useDeletePlot`.
7. **AlertDialog + DropdownMenu** — État contrôlé `open/onOpenChange` quand trigger dans DropdownMenu. Pattern identique pour le menu du plot.
8. **useChantiers** accepte un paramètre `status` — query key `['chantiers', { status }]`, défaut `'active'`.
9. **useChantier(chantierId)** — query key `['chantiers', chantierId]`, utilisé sur la page détail.

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
- shadcn/ui (button, card, input, label, badge, sonner, alert-dialog, dropdown-menu, tabs — style "new-york")
- Lucide React (icônes)
- Vitest + Testing Library (setup complet)
- vite-plugin-pwa v1.2.0 (PWA configurée)
- 132 tests existants

## Latest Tech Information

### PostgreSQL text[] — Bonnes pratiques 2026

- `text[]` est un type natif PostgreSQL, supporté par Supabase et supabase-js v2
- Les arrays préservent l'ordre d'insertion (indexation 1-based en SQL, 0-based en JS)
- L'approche recommandée pour les petites listes (< 100 éléments) : remplacer le tableau entier plutôt que des opérations atomiques (array_append, array_remove)
- Supabase JS v2 mappe `text[]` vers `string[]` dans les types TypeScript générés
- Pas de GIN index nécessaire pour cette utilisation (pas de recherche dans les tableaux)

### TanStack Router — Layout routes avec Outlet

Pour convertir une route leaf en layout :
1. Le fichier `$chantierId.tsx` exporte un composant qui rend `<Outlet />` de `@tanstack/react-router`
2. Créer un dossier `$chantierId/` avec `index.tsx` pour le contenu par défaut
3. Les routes enfants (ex: `plots.$plotId.tsx`) dans le dossier sont rendues à la place de `<Outlet />`
4. Le `routeTree.gen.ts` se régénère automatiquement au build

```typescript
// $chantierId.tsx (layout)
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/chantiers/$chantierId')({
  component: ChantierLayout,
})

function ChantierLayout() {
  // ... header, menu, dialogs communs ...
  return (
    <div>
      {/* header commun */}
      <Outlet />
    </div>
  )
}
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun problème rencontré.

### Completion Notes List

- Task 1: Migration SQL `004_plots.sql` créée — table `plots` avec FK CASCADE, index, RLS
- Task 2: Types `plots` ajoutés dans `database.ts` avec `Relationships` FK vers chantiers
- Task 3: 4 hooks créés (`usePlots`, `useCreatePlot`, `useUpdatePlotTasks`, `useDeletePlot`) + 4 fichiers tests (15 tests)
- Task 4: `$chantierId.tsx` converti en layout avec `<Outlet />`, index.tsx créé, routeTree regeneré, 14 tests existants passent
- Task 5: Page index affiche plots en StatusCards (complet) ou placeholder (léger), état vide, bouton ajout
- Task 6: Sheet (bottom) pour création de plot — validation nom requis, toast "Plot créé", navigation vers page plot
- Task 7: Page plot avec liste des tâches, ajout/suppression de tâches, suppression du plot avec AlertDialog destructif
- Task 8: 22 tests route (12 index + 10 plot), suite complète 169/169, lint clean

### Change Log

- 2026-02-09: Story 2.1 implémentée — 8 tasks, 37 nouveaux tests, 0 régressions (169 total)
- 2026-02-09: Code review — 6 issues corrigées (1H, 3M, 2L) : double header refactoré (layout → thin wrapper), sheet sr-only "Fermer", duplicate task prevention, useUpdatePlotTasks invalidation systématique, describe test renommé

### File List

**Nouveaux fichiers :**
- `supabase/migrations/004_plots.sql`
- `src/lib/queries/usePlots.ts`
- `src/lib/queries/usePlots.test.ts`
- `src/lib/mutations/useCreatePlot.ts`
- `src/lib/mutations/useCreatePlot.test.ts`
- `src/lib/mutations/useUpdatePlotTasks.ts`
- `src/lib/mutations/useUpdatePlotTasks.test.ts`
- `src/lib/mutations/useDeletePlot.ts`
- `src/lib/mutations/useDeletePlot.test.ts`
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/index.test.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId.test.tsx`
- `src/components/ui/sheet.tsx`

**Fichiers modifiés :**
- `src/types/database.ts` — ajout table plots
- `src/routes/_authenticated/chantiers/$chantierId.tsx` — converti en layout avec Outlet
- `src/routeTree.gen.ts` — auto-régénéré
