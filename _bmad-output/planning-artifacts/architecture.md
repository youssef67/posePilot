---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-02-05'
inputDocuments:
  - product-brief-posePilot-2026-02-05.md
  - prd.md
  - ux-design-specification.md
workflowType: 'architecture'
project_name: 'posePilot'
user_name: 'Youssef'
date: '2026-02-05'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
69 exigences fonctionnelles en 8 categories :
- **Navigation & Architecture (FR1-FR12)** : Deux types de chantiers (complet/leger), hierarchie a 5 niveaux, recherche par numero de lot, navigation gestuelle (swipe), agregation automatique ascendante
- **Configuration & Structure (FR13-FR23)** : Templates de variantes avec heritage (pieces + taches + documents), creation de lots en batch (max 8), codes libres, flag TMA modifiable
- **Suivi d'avancement & Taches (FR24-FR27)** : Tap-cycle a 3 etats reversible, compteurs "X faits / Y en cours", ecran piece tout-en-un
- **Notes & Collaboration (FR28-FR34)** : Notes avec photos, flag bloquant, fil "quoi de neuf", partage contextualise, tracabilite auteur
- **Documents (FR35-FR43)** : Upload/visualisation/remplacement PDF, types personnalisables, obligatoires/optionnels, heritage depuis variantes
- **Besoins, Livraisons & Inventaire (FR44-FR56)** : Cycle besoin → commande → livraison, BC/BL rattaches, inventaire localise avec agregation
- **Metres & Indicateurs (FR57-FR64)** : m² et ML plinthes optionnels, indicateurs intelligents (lots prets a carreler, croisement inventaire/metres)
- **Compte & UX (FR65-FR69)** : Auth simple 2-3 comptes, theme clair/sombre, PWA installable, zones tactiles surdimensionnees

**Non-Functional Requirements:**
16 NFRs en 3 categories :
- **Performance** : Ecran < 3s sur 3G (NFR1), navigation SPA < 1s (NFR2), feedback tap < 300ms (NFR3), FCP < 2s (NFR5), compression photos client (NFR7)
- **Fiabilite** : Zero crash (NFR8), zero perte de donnees (NFR9), sync temps reel < 5s (NFR10), retry automatique (NFR11), feedback erreur reseau (NFR12)
- **Securite** : Auth requise (NFR13), HTTPS (NFR14), expiration session (NFR15), comptes individuels (NFR16)

**Scale & Complexity:**
- Domaine principal : Full-stack PWA mobile-first
- Niveau de complexite : Moyen-haut
- Composants architecturaux estimes : 6-8 (Front-end SPA, Backend API/temps reel, Base de donnees, Stockage fichiers, Service worker/PWA, Auth, Aggregation engine, Activity tracking)

### Technical Constraints & Dependencies

- **PWA obligatoire** : manifest, service worker, display standalone — Bruno ne doit pas voir la difference avec une app native
- **Chrome Android priorite P0** : Samsung de Bruno, Safari iOS en P1
- **Reseau 3G variable** : compression photos cote client, bundle optimise, retry automatique
- **2-3 utilisateurs max** : pas de multi-tenancy, pas de scalabilite horizontale necessaire
- **Pas de mode hors ligne** : exclu explicitement du scope
- **Design system** : Tailwind CSS + shadcn/ui impose par l'UX spec
- **Camera** : `<input type="file" capture>` valide sur V1
- **Temps reel** : sync < 5s entre utilisateurs sans rafraichir

### Cross-Cutting Concerns Identified

1. **Synchronisation temps reel** : chaque mutation de donnees doit etre propagee a tous les clients connectes en < 5s
2. **Agregation automatique** : les compteurs et pourcentages a chaque niveau hierarchique doivent refleter les changements en temps reel (piece → lot → etage → plot → chantier)
3. **Mises a jour optimistes** : changement UI immediat, reconciliation serveur en arriere-plan, gestion des conflits
4. **Gestion de fichiers** : photos compressees cote client + PDFs a stocker, servir et previsualiser
5. **Tracabilite** : chaque action liee a un utilisateur pour le fil d'activite et l'auteur des notes
6. **Heritage et templates** : systeme de variantes avec override possible par lot individuel
7. **Resilience reseau** : retry transparent, feedback d'erreur explicite, pas de perte de donnees silencieuse
8. **Theming** : dark/light mode coherent a travers toute l'app avec memorisation du choix

## Starter Template Evaluation

### Primary Technology Domain

SPA/PWA React avec BaaS Supabase — base sur l'analyse des exigences projet : outil interne mobile-first, pas de SEO, pas de SSR, temps reel, stockage fichiers, 2-3 utilisateurs.

### Starter Options Considered

**Option A : Next.js 15 + Supabase (Ecartee)**
- Ecosysteme riche avec starters pre-integres Supabase
- SSR par defaut et complexite App Router injustifiees pour un SPA interne sans SEO
- Configuration PWA plus lourde qu'avec Vite
- Verdict : surcharge technique pour le cas d'usage de posePilot

**Option B : Vite 7 + React 19 + TypeScript (Retenue)**
- SPA pure, build ultra-rapide, PWA native via vite-plugin-pwa
- Simplicite du modele mental, bundle leger ideal pour reseau 3G
- Deploiement Vercel en site statique
- Verdict : zero complexite inutile, exactement adapte aux contraintes

### Selected Starter: Setup officiel Vite + shadcn/ui

**Rationale for Selection:**
Le setup officiel garantit des versions a jour et une configuration propre sans dependances superflues. Les templates communautaires risquent d'etre desalignes ou de forcer des choix non desires. Deux commandes suffisent pour obtenir une base solide.

**Initialization Command:**

```bash
# 1. Creer le projet Vite + React + TypeScript
npm create vite@latest posePilot -- --template react-ts

# 2. Initialiser shadcn/ui (configure Tailwind automatiquement)
cd posePilot && npx shadcn@latest init

# 3. Ajouter les dependances cles
npm install @supabase/supabase-js @tanstack/react-router @tanstack/react-query
npm install -D vite-plugin-pwa
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
- TypeScript strict — React 19.2.x, Vite 7.x
- ESM natif, zero configuration CJS

**Styling Solution:**
- Tailwind CSS configure par shadcn/ui init
- CSS variables pour le theming dark/light
- shadcn/ui composants accessibles (Radix UI sous le capot)

**Build Tooling:**
- Vite 7 — HMR instantane, build production avec Rollup
- Bundle optimise et code-split automatique (ideal pour reseau 3G)
- vite-plugin-pwa genere le service worker et le manifest PWA

**Routing:**
- TanStack Router — type-safety complete sur les routes et parametres, code splitting automatique, gestion native des search params

**State Management:**
- TanStack Query — cache, revalidation, mutations optimistes (ideal pour le tap-cycle < 300ms)
- Supabase Realtime — subscriptions PostgreSQL pour la sync < 5s entre utilisateurs

**Backend (Supabase):**
- PostgreSQL — base relationnelle, adaptee au modele hierarchique (chantier → plot → etage → lot → piece)
- Auth — email/password simple pour 2-3 comptes
- Realtime — subscriptions sur les changements de tables (INSERT/UPDATE/DELETE)
- Storage — buckets pour photos compressees et PDFs
- Row Level Security — securisation des donnees par utilisateur

**Deployment:**
- Vercel — deploiement statique SPA, CDN global, HTTPS automatique

**Note:** L'initialisation du projet avec ces commandes sera la premiere story d'implementation.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Bloquent l'implementation) :**
1. Modele de donnees hierarchique PostgreSQL avec colonnes d'agregation et triggers
2. Supabase Auth email/password + RLS
3. Supabase Client SDK direct (pas d'API custom)
4. Mises a jour optimistes via TanStack Query
5. Subscriptions Supabase Realtime sur les tables critiques

**Important Decisions (Faconnent l'architecture) :**
6. Structure projet par domaine (components, routes, lib/queries, lib/mutations, lib/subscriptions)
7. Compression photos cote client (browser-image-compression)
8. Theming dark-first via Tailwind class strategy
9. CI/CD GitHub Actions minimal

**Decisions differees (Post-implementation initiale) :**
10. Strategie de cache avancee (stale-while-revalidate, prefetch)
11. Monitoring avance (si problemes detectes en usage)
12. Tests E2E (apres stabilisation fonctionnelle)

### Data Architecture

- **Base** : PostgreSQL via Supabase
- **Modelisation** : tables relationnelles normalisees avec cles etrangeres pour la hierarchie chantier → plot → etage → lot → piece
- **Heritage** : tables de variantes (variante_pieces, variante_taches, variante_documents) avec copie a la creation du lot
- **Agregation** : colonnes cachees (progress_done, progress_total, has_blocking_note, has_missing_docs) mises a jour par triggers PostgreSQL en cascade (piece → lot → etage → plot → chantier)
- **Activite** : table activity_log pour le fil "quoi de neuf" avec timestamp et user_id
- **Migrations** : Supabase CLI (supabase migration new, supabase db push)

### Authentication & Security

- **Methode** : Supabase Auth, email/password
- **Autorisation** : Row Level Security — policy simple `authenticated = acces total` (pas de multi-tenancy)
- **Sessions** : JWT gere par Supabase, refresh automatique, expiration configurable
- **Transport** : HTTPS garanti par Vercel

### API & Communication Patterns

- **Pattern** : Supabase Client SDK direct depuis le front-end (pas d'API REST custom)
- **Temps reel** : Supabase Realtime — subscriptions sur taches, notes, lots, livraisons, besoins, activity_log
- **Mutations optimistes** : TanStack Query useMutation avec onMutate (update UI), onError (rollback), onSettled (revalidation)
- **Resilience** : retry automatique (3 tentatives via TanStack Query), toast d'erreur si echec definitif

### Frontend Architecture

- **Structure** : par domaine — components/, routes/, lib/queries/, lib/mutations/, lib/subscriptions/, types/, utils/
- **Photos** : compression cote client via browser-image-compression (qualite 0.7, max 1200px) avant upload Supabase Storage
- **PDFs** : ouverture via URL signee Supabase Storage (pas de viewer custom)
- **Theming** : Tailwind darkMode class, toggle persiste dans localStorage, sombre par defaut

### Infrastructure & Deployment

- **Supabase** : projet unique, plan Free (500 MB base, 1 GB storage — largement suffisant)
- **Vercel** : deploiement automatique depuis GitHub main, plan Hobby, CDN global, HTTPS
- **Environments** : development (Supabase local) + production (Supabase cloud + Vercel)
- **CI/CD** : GitHub Actions — lint + type-check + build avant merge
- **Monitoring** : Vercel Analytics + logs Supabase (pas de monitoring avance au lancement)

### Decision Impact Analysis

**Sequence d'implementation :**
1. Init projet (Vite + shadcn + deps)
2. Setup Supabase (schema, migrations, RLS, triggers d'agregation)
3. Auth (login, session, protection routes)
4. Navigation & structure (routes, layout, bottom nav, breadcrumb)
5. Chantiers + Plots + Etages + Lots + Pieces (CRUD + vues grilles)
6. Taches + tap-cycle + agregation temps reel
7. Notes + photos + flag bloquant
8. Documents PDF
9. Besoins + Livraisons
10. Inventaire + Metres
11. Indicateurs intelligents
12. Fil d'activite "quoi de neuf"
13. PWA (manifest, service worker, install)

**Dependances inter-composants :**
- Les triggers d'agregation dependent du schema de donnees (etape 2)
- Le temps reel depend de l'auth (Supabase Realtime requiert un utilisateur authentifie)
- Les mises a jour optimistes dependent de TanStack Query (configure a l'etape 1)
- La compression photos depend de l'upload Supabase Storage (configure a l'etape 2)

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Base de donnees (PostgreSQL/Supabase) :**
- Tables : `snake_case`, pluriel — `chantiers`, `lots`, `taches`, `activity_logs`
- Colonnes : `snake_case` — `created_at`, `is_blocking`, `plot_id`, `progress_done`
- Cles etrangeres : `{table_singulier}_id` — `chantier_id`, `lot_id`, `piece_id`
- Index : `idx_{table}_{colonnes}` — `idx_lots_etage_id`, `idx_taches_piece_id`
- Enums PostgreSQL : `snake_case` — `chantier_type`, `task_status`
- Valeurs d'enum : `snake_case` — `not_started`, `in_progress`, `done`, `commande`, `prevu`, `livre`

**Code TypeScript/React :**
- Variables et fonctions : `camelCase` — `chantierType`, `getChantiers()`, `isBlocking`
- Composants React : `PascalCase` — `StatusCard`, `TapCycleButton`, `RoomScreen`
- Fichiers composants : `PascalCase.tsx` — `StatusCard.tsx`, `BottomNavigation.tsx`
- Fichiers non-composants : `camelCase.ts` — `supabase.ts`, `useChantiers.ts`, `compressImage.ts`
- Dossiers : `kebab-case` — `lib/`, `components/`, `routes/`
- Types/Interfaces : `PascalCase` — `Chantier`, `Lot`, `TaskStatus`
- Hooks custom : `use` + `PascalCase` — `useChantiers`, `useLotTasks`, `useRealtimeSubscription`
- Constantes : `UPPER_SNAKE_CASE` — `MAX_BATCH_LOTS`, `PHOTO_MAX_WIDTH`

**Transformation a la frontiere :**
- Supabase retourne du `snake_case` (colonnes PostgreSQL)
- Pas de transformation — on garde `snake_case` dans les types TypeScript pour les entites DB
- Exemple : `chantier.progress_done` et non `chantier.progressDone`
- Les variables locales et parametres de fonctions restent en `camelCase`

```typescript
// Types = miroir exact du schema PostgreSQL (snake_case)
type Chantier = {
  id: string
  nom: string
  type: 'complet' | 'leger'
  progress_done: number
  progress_total: number
  created_at: string
  created_by: string
}

// Hooks et fonctions = camelCase
function useChantiers() { ... }
const isComplete = chantier.type === 'complet'
```

### Structure Patterns

**Organisation du projet :**
```
src/
  components/
    ui/                 # Composants shadcn/ui generes (Button, Card, etc.)
    StatusCard.tsx       # Composants custom posePilot
    StatusCard.test.tsx  # Test co-localise
    TapCycleButton.tsx
    TapCycleButton.test.tsx
    ...
  routes/               # Ecrans/pages (TanStack Router)
    __root.tsx           # Layout racine (bottom nav, theme provider)
    index.tsx            # Ecran d'accueil (liste chantiers)
    chantiers/
      $chantierId.tsx
      $chantierId/
        plots.$plotId.tsx
        ...
  lib/
    supabase.ts          # Client Supabase singleton
    queries/             # Hooks TanStack Query (lecture)
      useChantiers.ts
      useLots.ts
      useTaches.ts
      ...
    mutations/           # Hooks TanStack Query (ecriture optimiste)
      useUpdateTaskStatus.ts
      useCreateNote.ts
      ...
    subscriptions/       # Hooks Supabase Realtime
      useRealtimeTaches.ts
      useRealtimeChantier.ts
      ...
  types/
    database.ts          # Types generes depuis le schema Supabase
    enums.ts             # Enums metier (TaskStatus, ChantierType, etc.)
  utils/
    compressImage.ts
    formatDate.ts
    ...
```

**Regles de structure :**
- Tests co-localises : `Component.test.tsx` a cote de `Component.tsx`
- Un fichier = un export principal (un composant, un hook, un utilitaire)
- Les composants shadcn/ui generes vont dans `components/ui/` (convention shadcn)
- Les composants custom posePilot vont dans `components/` (racine)
- Pas de barrel files (`index.ts` qui re-exporte) — imports directs pour la clarte

### Format Patterns

**Reponses Supabase :**
- Supabase retourne `{ data, error }` — utilise directement
- TanStack Query encapsule : `{ data, error, isLoading, isError }`
- Pas de wrapper custom supplementaire

**Dates :**
- Stockage : `timestamptz` PostgreSQL (ISO 8601 avec timezone)
- Affichage : format francais relatif quand possible ("il y a 2h", "hier"), date complete sinon
- Pas de librairie de dates lourde — `Intl.RelativeTimeFormat` natif

**IDs :**
- UUID v4 generes par PostgreSQL (`gen_random_uuid()`)
- Jamais d'IDs auto-increment

**Null handling :**
- `null` en base = absence de donnee (pas `undefined`, pas de string vide)
- En TypeScript : `| null` explicite dans les types, jamais `| undefined` pour les donnees DB
- Affichage : "-" ou champ masque si `null`

### Communication Patterns

**Subscriptions temps reel :**
- Convention channels : `{table}:{filter}` — ex: `taches:piece_id=eq.{id}`
- Subscribe au niveau le plus granulaire possible
- Cleanup systematique dans le `useEffect` return (unsubscribe)

**TanStack Query keys :**
- Convention : `[entite, ...filtres]` — ex: `['chantiers']`, `['lots', chantierId]`, `['taches', pieceId]`
- Invalidation ciblee apres mutation : `queryClient.invalidateQueries({ queryKey: ['lots', chantierId] })`

**Mutations optimistes — pattern standard :**
```typescript
useMutation({
  mutationFn: (data) => supabase.from('taches').update(data).eq('id', id),
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['taches', pieceId] })
    const previous = queryClient.getQueryData(['taches', pieceId])
    queryClient.setQueryData(['taches', pieceId], (old) => /* update */)
    return { previous }
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['taches', pieceId], context?.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['taches', pieceId] })
  },
})
```

### Process Patterns

**Gestion d'erreurs :**
- Erreurs reseau : retry automatique (TanStack Query, 3 tentatives, backoff exponentiel)
- Erreurs apres retries : toast rouge persistant avec message simple en francais
- Erreurs de validation : message sous le champ concerne, jamais de toast
- Erreurs critiques (auth expiree) : redirect vers login
- Jamais de `console.log` en production

**Etats de chargement :**
- Chargement initial : skeleton screen (forme du composant final)
- Navigation entre ecrans : transition immediate, contenu en skeleton
- Mutation optimiste : changement UI immediat, pas de loader
- Upload photo/PDF : barre de progression

**Validation :**
- Cote client : minimale, au submit uniquement
- Cote serveur : contraintes PostgreSQL (NOT NULL, CHECK, FK) + RLS
- Messages : francais, langage simple

### Enforcement Guidelines

**Tout agent AI travaillant sur posePilot DOIT :**
1. Utiliser `snake_case` pour toute interaction avec la base de donnees (types, colonnes, tables)
2. Utiliser `PascalCase` pour les composants React et leurs fichiers
3. Co-localiser les tests a cote du fichier teste (`*.test.tsx`)
4. Implementer les mutations avec le pattern optimiste standard (onMutate/onError/onSettled)
5. Utiliser les query keys avec la convention `[entite, ...filtres]`
6. Ne jamais creer d'API custom — utiliser le SDK Supabase directement
7. Ne jamais transformer snake_case → camelCase pour les donnees DB
8. Utiliser les composants shadcn/ui existants avant de creer du custom
9. Respecter les tailles tactiles minimum (48px, cible 56px+)
10. Ecrire les messages utilisateur en francais

**Anti-patterns a eviter :**
- Creer un fichier `api.ts` ou `services.ts` qui wrappe Supabase
- Utiliser `any` en TypeScript
- Mettre des `console.log` pour le debug en production
- Creer des barrel files `index.ts`
- Utiliser `useEffect` pour fetch des donnees (utiliser TanStack Query)
- Stocker de l'etat serveur dans `useState` (utiliser TanStack Query)

## Project Structure & Boundaries

### Complete Project Directory Structure

```
posePilot/
├── .env.local                          # Variables Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
├── .env.example                        # Template des variables d'env
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml                      # Lint + type-check + build
├── package.json
├── vite.config.ts                      # Vite + vite-plugin-pwa config
├── tailwind.config.ts                  # Tokens design posePilot
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── components.json                     # Config shadcn/ui
│
├── public/
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
│
├── supabase/
│   ├── config.toml
│   ├── seed.sql
│   └── migrations/
│       ├── 001_enums.sql               # Enums : chantier_type, task_status, delivery_status
│       ├── 002_schema.sql              # Tables : chantiers → plots → etages → lots → pieces → taches
│       ├── 003_notes_documents.sql     # Tables : notes, photos, documents, variantes
│       ├── 004_besoins_livraisons.sql  # Tables : besoins, livraisons, inventaire
│       ├── 005_activity_log.sql        # Table : activity_log
│       ├── 006_aggregation_triggers.sql # Triggers cascade agregation
│       ├── 007_rls_policies.sql        # Row Level Security
│       └── 008_storage_buckets.sql     # Buckets : photos, documents
│
└── src/
    ├── main.tsx                        # Entry point : providers setup
    ├── index.css                       # Tailwind imports + tokens custom
    ├── routeTree.gen.ts                # TanStack Router (auto-genere)
    │
    ├── components/
    │   ├── ui/                         # shadcn/ui (generes via CLI)
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── badge.tsx
    │   │   ├── dialog.tsx
    │   │   ├── sheet.tsx
    │   │   ├── tabs.tsx
    │   │   ├── toast.tsx
    │   │   ├── toaster.tsx
    │   │   ├── input.tsx
    │   │   ├── skeleton.tsx
    │   │   └── scroll-area.tsx
    │   │
    │   ├── StatusCard.tsx              # Carte avec barre statut laterale
    │   ├── StatusCard.test.tsx
    │   ├── TapCycleButton.tsx          # Bouton tap-cycle 3 etats
    │   ├── TapCycleButton.test.tsx
    │   ├── RoomScreen.tsx              # Vue piece tout-en-un + swipe
    │   ├── RoomScreen.test.tsx
    │   ├── SearchBar.tsx               # Recherche par numero de lot
    │   ├── SearchBar.test.tsx
    │   ├── BottomNavigation.tsx        # Navigation 4 onglets
    │   ├── BottomNavigation.test.tsx
    │   ├── BreadcrumbNav.tsx           # Fil d'Ariane hierarchique
    │   ├── BreadcrumbNav.test.tsx
    │   ├── ActivityFeed.tsx            # Fil "quoi de neuf"
    │   ├── ActivityFeed.test.tsx
    │   ├── DeliveryCard.tsx            # Carte livraison cycle de vie
    │   ├── DeliveryCard.test.tsx
    │   ├── PhotoCapture.tsx            # Capture photo + compression
    │   ├── PhotoCapture.test.tsx
    │   └── ThemeToggle.tsx             # Bascule dark/light
    │
    ├── routes/                         # TanStack Router file-based
    │   ├── __root.tsx                  # Layout racine
    │   ├── index.tsx                   # Accueil : liste chantiers
    │   ├── login.tsx                   # Connexion
    │   ├── livraisons.tsx              # Vue globale livraisons
    │   ├── activite.tsx                # Fil d'activite global
    │   ├── reglages.tsx                # Reglages : theme, compte
    │   │
    │   └── chantiers/
    │       ├── nouveau.tsx             # Creation chantier
    │       ├── $chantierId.tsx         # Detail chantier
    │       └── $chantierId/
    │           ├── besoins.tsx         # Besoins du chantier
    │           ├── livraisons.tsx      # Livraisons du chantier
    │           ├── inventaire.tsx      # Inventaire chantier complet
    │           ├── config/
    │           │   ├── plot-nouveau.tsx
    │           │   ├── variante.tsx
    │           │   └── lots-batch.tsx
    │           └── plots/
    │               ├── $plotId.tsx
    │               └── $plotId/
    │                   ├── $etageId.tsx
    │                   └── $etageId/
    │                       ├── $lotId.tsx
    │                       └── $lotId/
    │                           └── $pieceId.tsx
    │
    ├── lib/
    │   ├── supabase.ts                 # Client Supabase singleton
    │   ├── queryClient.ts              # Config TanStack Query
    │   │
    │   ├── queries/
    │   │   ├── useChantiers.ts
    │   │   ├── usePlots.ts
    │   │   ├── useEtages.ts
    │   │   ├── useLots.ts
    │   │   ├── usePieces.ts
    │   │   ├── useTaches.ts
    │   │   ├── useNotes.ts
    │   │   ├── useDocuments.ts
    │   │   ├── useDocumentsManquants.ts
    │   │   ├── useBesoins.ts
    │   │   ├── useLivraisons.ts
    │   │   ├── useInventaire.ts
    │   │   ├── useIndicateurs.ts
    │   │   ├── useActivityLog.ts
    │   │   └── useSearchLot.ts
    │   │
    │   ├── mutations/
    │   │   ├── useCreateChantier.ts
    │   │   ├── useDeleteChantier.ts
    │   │   ├── useCreatePlot.ts
    │   │   ├── useCreateVariante.ts
    │   │   ├── useCreateLotsBatch.ts
    │   │   ├── useUpdateTaskStatus.ts
    │   │   ├── useCreateNote.ts
    │   │   ├── useUploadPhoto.ts
    │   │   ├── useUploadDocument.ts
    │   │   ├── useCreateBesoin.ts
    │   │   ├── useTransformBesoin.ts
    │   │   ├── useUpdateLivraison.ts
    │   │   ├── useUpdateInventaire.ts
    │   │   ├── useUpdateMetres.ts
    │   │   └── useToggleTMA.ts
    │   │
    │   └── subscriptions/
    │       ├── useRealtimeTaches.ts
    │       ├── useRealtimeLots.ts
    │       ├── useRealtimeNotes.ts
    │       ├── useRealtimeLivraisons.ts
    │       ├── useRealtimeBesoins.ts
    │       └── useRealtimeActivity.ts
    │
    ├── types/
    │   ├── database.ts                 # Types miroir schema PostgreSQL
    │   └── enums.ts                    # TaskStatus, ChantierType, DeliveryStatus
    │
    └── utils/
        ├── compressImage.ts            # browser-image-compression
        ├── formatDate.ts               # Intl.RelativeTimeFormat francais
        └── cn.ts                       # shadcn className utility
```

### Architectural Boundaries

**Data Boundary — Supabase :**
- Toutes les donnees passent par le SDK Supabase
- Pas de couche intermediaire (pas d'API REST, pas d'Edge Functions)
- RLS protege chaque table — seuls les utilisateurs authentifies ont acces
- Les triggers PostgreSQL gerent l'agregation — le front-end ne calcule pas les totaux

**Component Boundary — React :**
- `components/` = composants UI reutilisables, sans logique metier, props-driven
- `routes/` = ecrans avec logique metier, orchestrent composants + hooks
- `lib/queries/` = seule couche qui lit les donnees Supabase
- `lib/mutations/` = seule couche qui ecrit les donnees Supabase
- `lib/subscriptions/` = seule couche qui gere les subscriptions temps reel

**State Boundary :**
- Etat serveur = TanStack Query (cache, revalidation, invalidation)
- Etat local = React useState uniquement pour l'UI ephemere (modales, formulaires en cours)
- Pas de store global (pas de Zustand, pas de Redux)

### Requirements to Structure Mapping

| Categorie FR | Routes | Queries | Mutations | Composants |
|---|---|---|---|---|
| Navigation (FR1-FR12) | index, $chantierId, $plotId, $etageId, $lotId, $pieceId | useChantiers, usePlots, useEtages, useLots, usePieces, useSearchLot | — | StatusCard, SearchBar, BottomNavigation, BreadcrumbNav |
| Configuration (FR13-FR23) | config/plot-nouveau, config/variante, config/lots-batch | usePlots, useLots | useCreatePlot, useCreateVariante, useCreateLotsBatch | ui/ (formulaires shadcn) |
| Taches (FR24-FR27) | $pieceId | useTaches | useUpdateTaskStatus | TapCycleButton, RoomScreen |
| Notes (FR28-FR34) | $lotId, $pieceId | useNotes, useActivityLog | useCreateNote, useUploadPhoto | PhotoCapture, ActivityFeed |
| Documents (FR35-FR43) | $lotId | useDocuments, useDocumentsManquants | useUploadDocument | StatusCard (indicateur docs) |
| Besoins/Livraisons (FR44-FR52) | besoins, livraisons | useBesoins, useLivraisons | useCreateBesoin, useTransformBesoin, useUpdateLivraison | DeliveryCard |
| Inventaire/Metres (FR53-FR64) | inventaire | useInventaire, useIndicateurs | useUpdateInventaire, useUpdateMetres | StatusCard |
| Compte/UX (FR65-FR69) | login, reglages | — | — | ThemeToggle, BottomNavigation |

### Data Flow

```
Bruno (terrain)                              Youssef (bureau)
     │                                            │
     │ tap tache                                   │
     ▼                                             │
TapCycleButton                                     │
     │                                             │
     ▼                                             │
useUpdateTaskStatus (mutation optimiste)            │
     │── UI update immediat (< 300ms)              │
     │── supabase.from('taches').update()           │
     ▼                                             │
PostgreSQL                                         │
     │── trigger: update pieces.tasks_done          │
     │── trigger: update lots.progress_done         │
     │── trigger: update etages.progress_done       │
     │── trigger: update plots.progress_done        │
     │── trigger: update chantiers.progress_done    │
     │── insert activity_log                        │
     ▼                                             ▼
Supabase Realtime ──────────────────────────► useRealtimeTaches
                                              useRealtimeLots
                                              useRealtimeActivity
                                                   │
                                                   ▼
                                              invalidateQueries
                                                   │
                                                   ▼
                                              UI mise a jour
```

## Architecture Validation Results

### Coherence Validation

**Compatibilite des decisions :**
- Vite 7 + React 19.2 + TypeScript : combo mature et bien teste
- shadcn/ui + Tailwind CSS : dependance coherente
- TanStack Router + TanStack Query : meme ecosysteme, interoperabilite native
- Supabase SDK + React : SDK JavaScript universel
- vite-plugin-pwa + Vite : plugin dedie
- Vercel + SPA Vite : deploiement statique natif
- Aucun conflit de version detecte

**Consistance des patterns :**
- snake_case DB → pas de transformation → types TypeScript coherents
- Mutations optimistes via TanStack Query : pattern unique partout
- Naming : PascalCase composants, camelCase hooks/fonctions, snake_case DB — non contradictoire
- Subscriptions Realtime + invalidation TanStack Query : complementaires

**Alignement de la structure :**
- Routes TanStack Router refletent la hierarchie metier
- queries/mutations/subscriptions separes par responsabilite
- Composants custom mapent 1:1 avec les specifications UX

### Requirements Coverage Validation

**Couverture fonctionnelle : 69/69 FR couvertes**

| Categorie | FRs | Couvertes |
|---|---|---|
| Navigation (FR1-FR12) | 12 | 12/12 |
| Configuration (FR13-FR23) | 11 | 11/11 |
| Taches (FR24-FR27) | 4 | 4/4 |
| Notes (FR28-FR34) | 7 | 7/7 |
| Documents (FR35-FR43) | 9 | 9/9 |
| Besoins/Livraisons (FR44-FR52) | 9 | 9/9 |
| Inventaire/Metres (FR53-FR64) | 12 | 12/12 |
| Compte/UX (FR65-FR69) | 5 | 5/5 |

**Couverture non-fonctionnelle : 16/16 NFR couvertes**

| NFR | Exigence | Support architectural |
|---|---|---|
| NFR1-NFR6 | Performance | Vite code splitting, mutations optimistes, SPA, CDN |
| NFR7 | Compression photos | browser-image-compression cote client |
| NFR8 | Zero crash | React Error Boundaries + TanStack error handling |
| NFR9 | Zero perte donnees | Mutations optimistes avec rollback + retry |
| NFR10 | Sync < 5s | Supabase Realtime subscriptions |
| NFR11-NFR12 | Resilience reseau | TanStack Query retry + toast d'erreur |
| NFR13-NFR16 | Securite | Supabase Auth + RLS + HTTPS Vercel + JWT |

### Gap Analysis

**Gaps identifies et resolus :**

1. **Framework de test** : Vitest — natif pour Vite, ajouter aux devDependencies
2. **React Error Boundaries** : Ajouter `ErrorBoundary.tsx` dans components/
3. **Generation types Supabase** : `supabase gen types typescript --local > src/types/database.ts` apres chaque migration
4. **Activity log et auth dans triggers** : Utiliser `auth.uid()` via `current_setting('request.jwt.claims', true)::json->>'sub'`
5. **Config PWA** : vite-plugin-pwa avec registerType autoUpdate, display standalone, theme_color #0F172A

Aucun gap critique. Tous les gaps importants resolus.

### Architecture Completeness Checklist

- [x] Contexte projet analyse (3 documents, 69 FR, 16 NFR)
- [x] Complexite evaluee (moyenne-haute)
- [x] Contraintes techniques identifiees
- [x] Preoccupations transversales mappees (8 concerns)
- [x] Decisions critiques documentees avec versions
- [x] Stack technique complet
- [x] Patterns d'integration definis
- [x] Performance adressee
- [x] Conventions de nommage etablies
- [x] Patterns de structure definis
- [x] Patterns de communication specifies
- [x] Patterns de process documentes
- [x] Arborescence complete definie
- [x] Boundaries etablis
- [x] Points d'integration mappes
- [x] Mapping FR → structure complete

### Architecture Readiness Assessment

**Statut : PRET POUR L'IMPLEMENTATION**
**Confiance : Elevee**

**Forces cles :**
- Stack coherent et pragmatique — zero surcharge
- Supabase fournit 80% de l'infrastructure en une seule plateforme
- Mutations optimistes garantissent les NFRs de performance
- Structure concrete avec mapping explicite FR → fichiers
- Patterns detailles pour guider les agents AI

**Ameliorations futures :**
- Tests E2E (Playwright) apres stabilisation
- Monitoring avance (Sentry) si necessaire
- Cache avance (prefetch, stale-while-revalidate)
- PWA cache strategies plus fines

### Implementation Handoff

**Premiere priorite :**
```bash
npm create vite@latest posePilot -- --template react-ts
cd posePilot && npx shadcn@latest init
npm install @supabase/supabase-js @tanstack/react-router @tanstack/react-query
npm install -D vite-plugin-pwa vitest
```

**Guidelines agents AI :**
- Suivre toutes les decisions architecturales exactement comme documentees
- Utiliser les patterns d'implementation de maniere consistante
- Respecter la structure du projet et les boundaries
- Consulter ce document pour toute question architecturale
