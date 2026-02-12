# Story 1.4: Création d'un chantier

Status: done
Story ID: 1.4
Story Key: 1-4-creation-d-un-chantier
Epic: 1 — Fondation, Authentification & Gestion des chantiers
Date: 2026-02-09
Dependencies: Story 1.1 (done), Story 1.2 (done), Story 1.3 (done)
FRs: FR1, FR2

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux créer un nouveau chantier en choisissant son type,
Afin que je puisse commencer à suivre un nouveau projet de pose.

## Acceptance Criteria (BDD)

### AC1: Formulaire de création accessible depuis l'accueil

**Given** l'utilisateur est sur l'écran d'accueil
**When** il tape sur le bouton d'ajout
**Then** un formulaire de création s'affiche avec un champ nom et un choix de type (Complet / Léger)

### AC2: Création réussie avec apparition dans la liste

**Given** l'utilisateur a saisi un nom et choisi un type
**When** il valide la création
**Then** le chantier est créé en base (table `chantiers` avec enum `chantier_type`) et apparaît dans la liste

### AC3: Indicateur de choix définitif du type

**Given** le formulaire de création affiche le choix de type
**When** l'utilisateur lit l'option
**Then** un indicateur clair précise que le choix du type est définitif et non modifiable

### AC4: Validation du nom obligatoire

**Given** l'utilisateur ne saisit pas de nom
**When** il tente de valider
**Then** un message d'erreur simple en français s'affiche sous le champ

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : Table `chantiers` (AC: #2)
  - [x] 1.1 Créer `supabase/migrations/003_chantiers.sql` — table `chantiers` avec colonnes id, nom, type, status, progress_done, progress_total, created_at, created_by
  - [x] 1.2 Ajouter le type enum `chantier_status` (`active`, `termine`, `supprime`) — ou utiliser CHECK constraint si préféré
  - [x] 1.3 Appliquer RLS via `SELECT public.apply_rls_policy('chantiers')`
  - [x] 1.4 Exécuter la migration en local : `npx supabase db push` ou `npx supabase migration up`

- [x] Task 2 — Types TypeScript : Mettre à jour `database.ts` et ajouter le type `Chantier` (AC: #2)
  - [x] 2.1 Mettre à jour `src/types/database.ts` — ajouter la table `chantiers` dans `Tables` avec Row, Insert, Update
  - [x] 2.2 Vérifier la cohérence avec les enums existants dans `src/types/enums.ts`

- [x] Task 3 — Query hook : `useChantiers.ts` (AC: #2)
  - [x] 3.1 Créer `src/lib/queries/useChantiers.ts` — `useQuery` qui fetch tous les chantiers actifs ordonnés par `created_at` desc
  - [x] 3.2 Query key : `['chantiers']`
  - [x] 3.3 Filtre Supabase : `.eq('status', 'active')` pour ne montrer que les chantiers actifs

- [x] Task 4 — Mutation hook : `useCreateChantier.ts` (AC: #2)
  - [x] 4.1 Créer `src/lib/mutations/useCreateChantier.ts` — `useMutation` qui insère un chantier avec nom, type, created_by
  - [x] 4.2 Pattern optimiste : `onMutate` ajoute le chantier au cache `['chantiers']` immédiatement
  - [x] 4.3 `onError` : rollback vers le snapshot précédent
  - [x] 4.4 `onSettled` : `invalidateQueries({ queryKey: ['chantiers'] })`
  - [x] 4.5 Retourner `isPending` et `error` pour le feedback UI

- [x] Task 5 — Route et formulaire de création (AC: #1, #3, #4)
  - [x] 5.1 Créer `src/routes/_authenticated/chantiers/nouveau.tsx` — route `/chantiers/nouveau`
  - [x] 5.2 Champ nom : `<Input>` shadcn/ui, label "Nom du chantier", placeholder "ex: Résidence Les Oliviers"
  - [x] 5.3 Sélecteur de type : 2 cartes tappables (Complet / Léger) avec description courte et icône
  - [x] 5.4 Avertissement : texte sous le sélecteur "Ce choix est définitif et ne pourra pas être modifié"
  - [x] 5.5 Bouton "Créer le chantier" (primaire, pleine largeur) — en bas de l'écran (zone du pouce)
  - [x] 5.6 Validation au submit : nom requis → message "Ce champ est requis" sous le champ
  - [x] 5.7 Type requis → message "Choisissez un type de chantier" si aucun sélectionné
  - [x] 5.8 On success : `router.navigate({ to: '/' })` + toast "Chantier créé"
  - [x] 5.9 On error : toast rouge "Impossible de créer le chantier"
  - [x] 5.10 Pendant la mutation : bouton disabled avec état loading

- [x] Task 6 — Page d'accueil : Intégrer la liste des chantiers et le bouton d'ajout (AC: #1, #2)
  - [x] 6.1 Modifier `src/routes/_authenticated/index.tsx` — utiliser `useChantiers()` pour afficher la liste
  - [x] 6.2 Afficher chaque chantier en carte simple : nom + badge type ("Complet" / "Léger")
  - [x] 6.3 État vide : "Aucun chantier pour l'instant" + bouton "Créer un chantier" (conforme UX specs)
  - [x] 6.4 Bouton FAB "+" fixe en bas à droite (au-dessus de la BottomNavigation) → `Link` vers `/chantiers/nouveau`
  - [x] 6.5 État de chargement : skeleton des cartes
  - [x] 6.6 État d'erreur : message "Impossible de charger les chantiers" + bouton "Réessayer"

- [x] Task 7 — Tests (toutes AC)
  - [x] 7.1 Test `useChantiers` — mock Supabase, vérifie le fetch avec filtre status='active'
  - [x] 7.2 Test `useCreateChantier` — mock Supabase, vérifie l'insertion et l'invalidation du cache
  - [x] 7.3 Test formulaire de création — rendu, validation (nom vide, type non sélectionné), soumission
  - [x] 7.4 Test page d'accueil — état vide, liste avec chantiers, bouton FAB
  - [x] 7.5 Vérifier que les tests existants (auth, theme, navigation) passent toujours

## Dev Notes

### Architecture & Patterns obligatoires

- **Supabase Client SDK direct** — pas d'API custom, pas de wrapper autour de Supabase [Source: architecture.md#API & Communication Patterns]
- **TanStack Query pour tout état serveur** — jamais de `useState` pour des données DB [Source: architecture.md#State Boundary]
- **Mutations optimistes** — pattern `onMutate/onError/onSettled` standard [Source: architecture.md#Communication Patterns]
- **Query keys convention** — `['chantiers']` pour la liste [Source: architecture.md#TanStack Query keys]
- **Types snake_case** — les types miroir du schéma PostgreSQL restent en `snake_case`, pas de transformation [Source: architecture.md#Naming Patterns]
- **shadcn/ui d'abord** avant de créer du custom [Source: architecture.md#Enforcement Guidelines]
- **Messages utilisateur en français** [Source: architecture.md#Enforcement Guidelines]
- **Validation au submit uniquement** — pas de validation en temps réel agressive [Source: ux-design-specification.md#Form Patterns]
- **Jamais de modal pour la saisie** — écran dédié avec navigation [Source: ux-design-specification.md#Modal & Overlay Patterns]

### Conventions de nommage

- Fichiers composants : `PascalCase.tsx`
- Fichiers hooks/lib : `camelCase.ts` — `useChantiers.ts`, `useCreateChantier.ts`
- Tests co-localisés : `.test.ts` ou `.test.tsx` à côté du fichier testé
- Table PostgreSQL : `snake_case` pluriel — `chantiers`
- Colonnes : `snake_case` — `created_at`, `created_by`, `progress_done`
- Pas de barrel files — imports directs

### Stack technique — Versions exactes (déjà installées)

| Bibliothèque | Version | Utilisation dans cette story |
|---|---|---|
| **@supabase/supabase-js** | 2.x | Insert, select, filtre sur table `chantiers` |
| **@tanstack/react-query** | 5.x | `useQuery`, `useMutation`, `useQueryClient`, `invalidateQueries` |
| **@tanstack/react-router** | 1.158.x | `createFileRoute`, `Link`, `useNavigate` |
| **shadcn/ui** | CLI 3.8.4 | `Input`, `Button`, `Card`, `Badge` (ajouter si manquant via `npx shadcn@latest add`) |
| **lucide-react** | 0.563.x | Icônes `Plus`, `Building2`, `Package` (ou similaires pour les types) |
| **vitest** | 4.0.x | Tests unitaires co-localisés |

### Migration SQL — Schéma table `chantiers`

```sql
-- supabase/migrations/003_chantiers.sql
-- Story 1.4 : Table principale des chantiers

-- Enum pour le statut du chantier (cycle de vie)
CREATE TYPE chantier_status AS ENUM ('active', 'termine', 'supprime');

CREATE TABLE public.chantiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  type chantier_type NOT NULL,          -- enum créé dans 001_enums.sql
  status chantier_status NOT NULL DEFAULT 'active',
  progress_done integer NOT NULL DEFAULT 0,
  progress_total integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_chantiers_status ON public.chantiers(status);
CREATE INDEX idx_chantiers_created_by ON public.chantiers(created_by);

-- Appliquer RLS (fonction créée dans 002_rls_base.sql)
SELECT public.apply_rls_policy('chantiers');
```

**IMPORTANT :** Les colonnes `progress_done` et `progress_total` sont prévues pour l'agrégation future (Story 3.3). Elles restent à 0 dans cette story. Ne PAS les utiliser dans l'UI pour l'instant.

### Types TypeScript — Mise à jour requise

```typescript
// src/types/database.ts — Ajouter la table chantiers dans Tables
export type Database = {
  public: {
    Tables: {
      chantiers: {
        Row: {
          id: string
          nom: string
          type: 'complet' | 'leger'
          status: 'active' | 'termine' | 'supprime'
          progress_done: number
          progress_total: number
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          nom: string
          type: 'complet' | 'leger'
          status?: 'active' | 'termine' | 'supprime'
          progress_done?: number
          progress_total?: number
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          nom?: string
          type?: 'complet' | 'leger'
          status?: 'active' | 'termine' | 'supprime'
          progress_done?: number
          progress_total?: number
          created_at?: string
          created_by?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      chantier_type: 'complet' | 'leger'
      chantier_status: 'active' | 'termine' | 'supprime'
      task_status: 'not_started' | 'in_progress' | 'done'
      delivery_status: 'commande' | 'prevu' | 'livre'
    }
    CompositeTypes: Record<string, never>
  }
}
```

### Pattern Query hook — Implémentation de référence

```typescript
// src/lib/queries/useChantiers.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useChantiers() {
  return useQuery({
    queryKey: ['chantiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chantiers')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}
```

### Pattern Mutation hook — Implémentation de référence

```typescript
// src/lib/mutations/useCreateChantier.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type ChantierInsert = Database['public']['Tables']['chantiers']['Insert']

export function useCreateChantier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newChantier: Pick<ChantierInsert, 'nom' | 'type'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('chantiers')
        .insert({
          nom: newChantier.nom,
          type: newChantier.type,
          created_by: user?.id ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async (newChantier) => {
      await queryClient.cancelQueries({ queryKey: ['chantiers'] })
      const previous = queryClient.getQueryData(['chantiers'])
      queryClient.setQueryData(['chantiers'], (old: any[] | undefined) => [
        {
          id: crypto.randomUUID(),
          nom: newChantier.nom,
          type: newChantier.type,
          status: 'active' as const,
          progress_done: 0,
          progress_total: 0,
          created_at: new Date().toISOString(),
          created_by: null,
        },
        ...(old ?? []),
      ])
      return { previous }
    },
    onError: (_err, _newChantier, context) => {
      queryClient.setQueryData(['chantiers'], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chantiers'] })
    },
  })
}
```

### Route de création — Structure attendue

Le formulaire est sur une route dédiée (pas une modale) conformément aux UX specs :
- URL : `/chantiers/nouveau`
- Fichier : `src/routes/_authenticated/chantiers/nouveau.tsx`
- Layout parent : `_authenticated.tsx` (BottomNavigation visible)
- Navigation retour : bouton retour ou swipe-back vers `/`

```
+----------------------------------+
|  ← Retour     Nouveau chantier   |
+----------------------------------+
|                                  |
|  Nom du chantier                 |
|  [________________________]      |
|                                  |
|  Type de chantier                |
|                                  |
|  +----------------------------+  |
|  | 🏗️ Complet                 |  |
|  | Lots, plots, tâches,       |  |
|  | documents, inventaire      |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | 📦 Léger                   |  |
|  | Besoins et livraisons      |  |
|  | uniquement                 |  |
|  +----------------------------+  |
|                                  |
|  ⚠️ Ce choix est définitif et   |
|  ne pourra pas être modifié      |
|                                  |
|                                  |
|  [    Créer le chantier    ]     |  ← Bouton primaire pleine largeur
|                                  |
+----------------------------------+
| [Chantiers] [Livraisons] [Act.] [Reg.] |
+----------------------------------+
```

### Page d'accueil — Modification requise

Le `_authenticated/index.tsx` actuel est un placeholder. Il doit être enrichi :

```
+----------------------------------+
|           Chantiers              |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | Résidence Les Oliviers     |  |  ← Carte simple
|  | [Complet]                  |  |  ← Badge type
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | Rénovation Duval           |  |
|  | [Léger]                    |  |
|  +----------------------------+  |
|                                  |
|                           [+]   |  ← FAB en bas à droite
+----------------------------------+
| [Chantiers] [Livraisons] [Act.] [Reg.] |
+----------------------------------+
```

**État vide :**
```
+----------------------------------+
|           Chantiers              |
+----------------------------------+
|                                  |
|                                  |
|       📋 (icône discrète)        |
|                                  |
|    Aucun chantier pour           |
|    l'instant                     |
|                                  |
|    [ Créer un chantier ]         |  ← Bouton secondaire
|                                  |
|                           [+]   |  ← FAB aussi présent
+----------------------------------+
| [Chantiers] [Livraisons] [Act.] [Reg.] |
+----------------------------------+
```

**IMPORTANT :** Pour cette story, les cartes de la liste sont SIMPLES (nom + badge type). Le composant `StatusCard` complet avec barre de statut latérale, indicateurs de progression et compteurs sera implémenté dans la **Story 1.5**. Ne PAS anticiper la StatusCard ici — une `Card` shadcn/ui basique avec le nom et un `Badge` suffisent.

### Composants shadcn/ui à vérifier/ajouter

Les composants suivants doivent être disponibles. Si manquants, les ajouter via CLI :

```bash
npx shadcn@latest add badge    # Pour les badges "Complet" / "Léger"
npx shadcn@latest add toast    # Pour les feedbacks "Chantier créé" / erreur
npx shadcn@latest add sonner   # Alternative toast — vérifier lequel est installé
```

**Composants déjà installés (Story 1.1/1.2) :** button, card, input, label

### FAB (Floating Action Button) — Specs

Le FAB n'est pas un composant shadcn/ui. Il sera créé inline dans la page d'accueil :

```typescript
// Bouton flottant "+"
// Position : fixed, bottom-right, au-dessus de la BottomNavigation
// Dimensions : 56x56px (zone tactile OK)
// Couleur : bg-primary (#3B82F6 dark, #1E3A5F light)
// Icône : Plus (lucide-react), 24px, blanc
// z-index : au-dessus du contenu mais sous les modales
// bottom : calc(56px + env(safe-area-inset-bottom) + 16px) — au-dessus de la BottomNav
```

### Accessibilité — Règles pour cette story

- Formulaire : labels explicites au-dessus des champs (jamais en placeholder seul)
- Sélecteur de type : `role="radiogroup"` avec `role="radio"` pour chaque option, `aria-checked` sur la sélection
- FAB : `aria-label="Créer un nouveau chantier"`, icône décorative `aria-hidden="true"`
- Badge type : texte lisible, pas uniquement un indicateur couleur
- Zones tactiles : cartes de type 48px minimum de hauteur, FAB 56px, bouton submit pleine largeur
- Messages d'erreur : liés au champ via `aria-describedby`

### Sélecteur de type — Design

Les 2 options de type doivent être des cartes tappables clairement différenciées :

| Type | Icône | Description courte | Couleur bordure quand sélectionné |
|---|---|---|---|
| **Complet** | `Building2` (lucide) | "Lots, plots, tâches, documents, inventaire" | `border-primary` (#3B82F6) |
| **Léger** | `Package` (lucide) | "Besoins et livraisons uniquement" | `border-primary` (#3B82F6) |

- Au repos : bordure `border` neutre, fond `card`
- Sélectionné : bordure `border-primary` (2px), fond légèrement teinté, icône check en overlay
- Zones tactiles : toute la carte est cliquable, hauteur minimum 72px

### Project Structure Notes

**Nouveaux fichiers à créer :**
- `supabase/migrations/003_chantiers.sql` — Migration table chantiers
- `src/lib/queries/useChantiers.ts` — Hook query liste chantiers
- `src/lib/queries/useChantiers.test.ts` — Tests query
- `src/lib/mutations/useCreateChantier.ts` — Hook mutation création
- `src/lib/mutations/useCreateChantier.test.ts` — Tests mutation
- `src/routes/_authenticated/chantiers/nouveau.tsx` — Formulaire de création
- `src/routes/_authenticated/chantiers/nouveau.test.tsx` — Tests formulaire

**Fichiers à modifier :**
- `src/types/database.ts` — Ajouter table chantiers dans Types
- `src/types/enums.ts` — Ajouter `ChantierStatus` enum TypeScript
- `src/routes/_authenticated/index.tsx` — Intégrer liste chantiers + FAB + état vide
- `src/routeTree.gen.ts` — Regénéré automatiquement (nouvelle route)

**Fichiers NON touchés :**
- `src/main.tsx` — Pas de changement
- `src/components/ThemeProvider.tsx` — Pas de changement
- `src/components/BottomNavigation.tsx` — Pas de changement
- `src/routes/_authenticated.tsx` — Pas de changement (le layout avec BottomNav couvre la nouvelle sous-route)
- `src/routes/login.tsx` — Pas de changement
- `src/lib/auth.ts` — Pas de changement (mais `supabase.auth.getUser()` est appelé dans la mutation)

**Alignement architecture :**
- Structure conforme à `architecture.md#Complete Project Directory Structure`
- Queries dans `src/lib/queries/` — hooks TanStack Query lecture
- Mutations dans `src/lib/mutations/` — hooks TanStack Query écriture
- Route de création dans `src/routes/_authenticated/chantiers/nouveau.tsx`
- Tests co-localisés : `.test.ts` à côté du hook
- Pas de barrel files — imports directs
- Types dans `src/types/database.ts` — miroir du schéma PostgreSQL

### Supprimer les .gitkeep

Les dossiers `src/lib/queries/`, `src/lib/mutations/`, `src/lib/subscriptions/` contiennent des `.gitkeep` placeholder. Supprimer le `.gitkeep` dans `queries/` et `mutations/` une fois les premiers fichiers créés.

### Attention — Pièges courants

1. **Ne PAS oublier `.select()` après `.insert()`** — sans cela, Supabase ne retourne pas les données insérées
2. **Ne PAS oublier `.single()`** — pour obtenir un objet unique plutôt qu'un tableau
3. **Ne PAS utiliser `useEffect` pour fetch** — utiliser `useQuery` exclusivement
4. **Ne PAS stocker le résultat de `useQuery` dans un `useState`** — utiliser `data` directement
5. **Ne PAS créer de fichier `api.ts` ou `services.ts`** — Supabase SDK directement dans les hooks
6. **Ne PAS transformer `snake_case` en `camelCase`** — garder les noms de colonnes tels quels
7. **Le type de chantier est `'complet' | 'leger'` (sans accent)** — conforme à l'enum PostgreSQL
8. **La validation est au submit uniquement** — pas de bordure rouge pendant la saisie
9. **Le routeTree.gen.ts sera regénéré** — ne pas le modifier manuellement
10. **Penser à `auth.getUser()`** pour le `created_by` dans la mutation — le user ID vient de Supabase Auth

### References

- [Source: epics.md#Story 1.4] — User story, acceptance criteria BDD
- [Source: architecture.md#Data Architecture] — Table chantiers, PostgreSQL, migrations Supabase
- [Source: architecture.md#API & Communication Patterns] — Supabase SDK direct, mutations optimistes
- [Source: architecture.md#Communication Patterns] — Pattern onMutate/onError/onSettled, query keys
- [Source: architecture.md#Naming Patterns] — snake_case DB, PascalCase composants, camelCase hooks
- [Source: architecture.md#Structure Patterns] — lib/queries/, lib/mutations/, imports directs
- [Source: architecture.md#Enforcement Guidelines] — shadcn d'abord, pas de wrapper API, messages français
- [Source: architecture.md#Complete Project Directory Structure] — Arborescence fichiers
- [Source: ux-design-specification.md#Form Patterns] — Max 3 champs, validation au submit, labels au-dessus
- [Source: ux-design-specification.md#Modal & Overlay Patterns] — Jamais de modale pour saisie → route dédiée
- [Source: ux-design-specification.md#Empty States & Loading] — État vide chantiers : "Aucun chantier pour l'instant" + CTA
- [Source: ux-design-specification.md#Action Hierarchy] — Bouton primaire 1 par écran, FAB pour création rapide
- [Source: ux-design-specification.md#Feedback Patterns] — Toast succès 2s auto-dismiss, toast erreur persistant
- [Source: ux-design-specification.md#Journey 4] — Flux création chantier : accueil → type → nom → créé
- [Source: ux-design-specification.md#Color System] — Badge couleurs, palette sémantique
- [Source: ux-design-specification.md#Accessibility Considerations] — Zones tactiles 48px+, contraste WCAG AA
- [Source: prd.md#FR1] — Créer un chantier avec un nom
- [Source: prd.md#FR2] — Choisir type complet/léger, choix définitif
- [Source: 1-3-layout-principal-bottom-navigation-et-theme.md] — Patterns établis: ThemeProvider, BottomNavigation, layout _authenticated, CSS variables

## Previous Story Intelligence (Story 1.3)

### Learnings critiques de la story précédente

1. **Layout `_authenticated.tsx` avec BottomNavigation** — les sous-routes comme `chantiers/nouveau` hériteront automatiquement du layout avec BottomNavigation et padding-bottom
2. **ThemeProvider avec dark-first** — tous les nouveaux composants doivent respecter les deux thèmes via les CSS variables (`bg-background`, `bg-card`, `text-foreground`, etc.)
3. **TanStack Router file-based routing** — créer le fichier dans le bon dossier suffit, le routeTree est regénéré automatiquement
4. **shadcn/ui composants disponibles** — Button, Card, Input, Label déjà installés. Vérifier Badge et Toast.
5. **Tests async + act()** — wrapper les résolutions de promises dans `act()` dans les tests
6. **Messages d'erreur en français** — tous les messages utilisateur doivent être en français
7. **CSS variables hex UX** — dark: background #111827, card #1E293B, foreground #F1F5F9 ; light: background #F5F5F5, card #FFFFFF

### Code patterns établis (à respecter)

- `AuthProvider` + `ThemeProvider` + `QueryClientProvider` wrapping l'app dans `main.tsx`
- `createFileRoute('/_authenticated/...')` pour les routes protégées
- `useAuth()` hook pour l'état d'authentification
- `supabase` client singleton dans `src/lib/supabase.ts`
- `queryClient` dans `src/lib/queryClient.ts` (staleTime 5min, retry 3)
- Composants shadcn/ui dans `src/components/ui/`
- Composants custom dans `src/components/`
- Tests avec Vitest + Testing Library

### Fichiers existants impactés

| Fichier | État actuel | Modification requise |
|---|---|---|
| `src/types/database.ts` | Tables vides (`Record<string, never>`) | Ajouter table `chantiers` |
| `src/types/enums.ts` | ChantierType, TaskStatus, DeliveryStatus | Ajouter ChantierStatus |
| `src/routes/_authenticated/index.tsx` | Placeholder "Aucun chantier" centré | Liste chantiers + FAB + état vide |
| `src/lib/queries/.gitkeep` | Placeholder | Supprimer (remplacé par useChantiers.ts) |
| `src/lib/mutations/.gitkeep` | Placeholder | Supprimer (remplacé par useCreateChantier.ts) |

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
- Tailwind CSS v4 (via @tailwindcss/vite, config inline dans index.css)
- TanStack Router (file-based routing, route generation automatique)
- TanStack Query (configuré, pas encore utilisé pour des queries — **PREMIER USAGE dans cette story**)
- Supabase Auth (email/password, RLS) + Supabase JS Client
- shadcn/ui (button, card, input, label — style "new-york")
- Lucide React (icônes)
- Vitest + Testing Library (setup complet)
- PWA via vite-plugin-pwa (manifest configuré)

## Latest Tech Information

### Supabase JS Client — Pattern insert + select

Pattern confirmé pour l'insertion avec retour des données :
```typescript
const { data, error } = await supabase
  .from('chantiers')
  .insert({ nom, type, created_by: user?.id })
  .select()
  .single()
```
- `.select()` est OBLIGATOIRE pour obtenir les données insérées (sinon `data` est `null`)
- `.single()` retourne un objet unique plutôt qu'un tableau

### TanStack Query v5 — Pattern mutation optimiste

Le pattern standard pour les mutations optimistes est confirmé :
```typescript
useMutation({
  mutationFn: ...,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: [...] })
    const previous = queryClient.getQueryData([...])
    queryClient.setQueryData([...], (old) => /* update */)
    return { previous }
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData([...], context?.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: [...] })
  },
})
```

### Supabase Migrations — Exécution locale

```bash
# Si Supabase CLI est installé et le projet local est configuré :
npx supabase db push

# Alternative si Supabase local est en cours d'exécution :
npx supabase migration up

# Pour vérifier la migration :
npx supabase db diff
```

**Note :** Si le développeur n'a pas Supabase en local, la migration peut être exécutée directement via le dashboard Supabase en collant le SQL. L'important est que le fichier `.sql` existe dans le repo pour la traçabilité.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Supabase `Database` type nécessite `Relationships: []` dans la table + `[_ in never]: never` pour Views/Functions/CompositeTypes (au lieu de `Record<string, never>` qui écrase les types via intersection)
- Sonner shadcn/ui utilise `next-themes` par défaut — remplacé par `@/components/ThemeProvider` + `resolvedTheme`

### Completion Notes List

- Task 1: Migration SQL `003_chantiers.sql` créée avec enum `chantier_status`, table `chantiers`, index, RLS. Migration à exécuter manuellement via dashboard Supabase.
- Task 2: `database.ts` enrichi avec table `chantiers` (Row/Insert/Update/Relationships). `enums.ts` enrichi avec `ChantierStatus`.
- Task 3: Hook `useChantiers` — fetch actifs ordonnés par date desc, query key `['chantiers']`.
- Task 4: Hook `useCreateChantier` — mutation optimiste complète (onMutate/onError/onSettled), `auth.getUser()` pour `created_by`.
- Task 5: Route `/chantiers/nouveau` — formulaire avec Input nom, sélecteur type radiogroup, validation submit-only, avertissement choix définitif, toast succès/erreur, bouton loading.
- Task 6: Page d'accueil — liste chantiers avec cartes+badges, état vide avec CTA, skeleton loading, erreur+retry, FAB fixe au-dessus de BottomNavigation.
- Task 7: 54 tests passent (11 fichiers). Tests hooks (mock Supabase chaîné), tests formulaire (validation, soumission, toast succès, toast erreur), tests page d'accueil (8 tests: heading, redirect, empty, list, FAB, skeleton, error, retry).
- Bonus: Badge et Sonner (toast) installés via shadcn CLI. Toaster ajouté dans `main.tsx`.
- Code Review: aria-describedby ajouté sur erreur type, tests toast success/error ajoutés, test rollback onError ajouté, dépendance next-themes supprimée.

### Change Log

- 2026-02-09: Story 1.4 implémentée — création chantier, migration SQL, types, hooks query/mutation, formulaire, page d'accueil, tests complets
- 2026-02-09: Code review — 4 fixes appliqués: aria-describedby erreur type (H1), tests toast/erreur mutation ajoutés (H2), next-themes supprimé (M2), test rollback onError ajouté (M4). 54 tests passent.

### File List

**Nouveaux fichiers :**
- `supabase/migrations/003_chantiers.sql`
- `src/lib/queries/useChantiers.ts`
- `src/lib/queries/useChantiers.test.ts`
- `src/lib/mutations/useCreateChantier.ts`
- `src/lib/mutations/useCreateChantier.test.ts`
- `src/routes/_authenticated/chantiers/nouveau.tsx`
- `src/routes/_authenticated/chantiers/nouveau.test.tsx`
- `src/components/ui/badge.tsx` (shadcn)
- `src/components/ui/sonner.tsx` (shadcn, adapté ThemeProvider)

**Fichiers modifiés :**
- `src/types/database.ts` — table chantiers ajoutée
- `src/types/enums.ts` — ChantierStatus ajouté
- `src/routes/_authenticated/index.tsx` — liste chantiers + FAB + états
- `src/main.tsx` — Toaster ajouté
- `src/routeTree.gen.ts` — regénéré (nouvelle route chantiers/nouveau)
- `src/routes/index.test.tsx` — tests mis à jour pour nouvelle page d'accueil
- `package.json` — sonner ajouté, next-themes supprimé (code review)

**Fichiers supprimés :**
- `src/lib/queries/.gitkeep`
- `src/lib/mutations/.gitkeep`
