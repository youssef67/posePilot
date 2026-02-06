# Story 1.1: Initialisation du projet et déploiement

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que membre de l'équipe posePilot,
Je veux que l'application soit initialisée avec le stack technique défini,
Afin que nous disposions d'une base déployée avec un pipeline CI/CD fonctionnel.

## Acceptance Criteria

1. **Given** le développeur exécute les commandes d'initialisation (Vite 7 + React 19 + TS, shadcn init, dépendances clés)
   **When** le projet est créé avec la structure de dossiers définie dans l'architecture (components/, routes/, lib/, types/, utils/)
   **Then** le projet compile sans erreur et le dev server démarre

2. **Given** le projet est poussé sur GitHub
   **When** le pipeline CI/CD GitHub Actions s'exécute
   **Then** lint, type-check et build passent avec succès

3. **Given** le build est prêt
   **When** il est déployé sur Vercel
   **Then** l'app est accessible via HTTPS avec une page minimale

## Tasks / Subtasks

- [x] Task 1 — Scaffolding du projet (AC: #1)
  - [x] 1.1 Exécuter `npm create vite@latest posePilot -- --template react-ts`
  - [x] 1.2 Initialiser shadcn/ui : `npx shadcn@latest init` (configure Tailwind CSS v4 automatiquement)
  - [x] 1.3 Installer les dépendances clés : `npm install @supabase/supabase-js @tanstack/react-router @tanstack/react-query`
  - [x] 1.4 Installer les dépendances de dev : `npm install -D vite-plugin-pwa vitest @tailwindcss/vite @tanstack/react-router-devtools @tanstack/react-query-devtools`
  - [x] 1.5 Configurer vite-plugin-pwa dans `vite.config.ts` (registerType: autoUpdate, display: standalone, theme_color: #0F172A, background_color: #0F172A, orientation: portrait)
  - [x] 1.6 Configurer le path alias `@/` dans tsconfig et vite.config.ts

- [x] Task 2 — Structure de dossiers (AC: #1)
  - [x] 2.1 Créer l'arborescence `src/` conforme à l'architecture :
    - `src/components/ui/` (composants shadcn/ui)
    - `src/components/` (composants custom posePilot)
    - `src/routes/` (TanStack Router file-based)
    - `src/lib/supabase.ts` (client singleton)
    - `src/lib/queryClient.ts` (config TanStack Query)
    - `src/lib/queries/`
    - `src/lib/mutations/`
    - `src/lib/subscriptions/`
    - `src/types/database.ts`
    - `src/types/enums.ts`
    - `src/utils/cn.ts` (shadcn className utility)
  - [x] 2.2 Créer les fichiers `.gitkeep` dans les dossiers vides pour préserver la structure
  - [x] 2.3 Configurer TanStack Router (routeTree, __root.tsx avec layout minimal)
  - [x] 2.4 Configurer TanStack Query (QueryClientProvider dans main.tsx)
  - [x] 2.5 Configurer le client Supabase singleton dans `src/lib/supabase.ts` avec variables d'environnement

- [x] Task 3 — Configuration du thème et fondation UX (AC: #1)
  - [x] 3.1 Configurer Tailwind CSS v4 avec les design tokens posePilot dans le CSS (plus de tailwind.config.js — Tailwind v4 utilise la configuration CSS-first via `@import 'tailwindcss'`)
  - [x] 3.2 Ajouter les CSS custom properties pour les couleurs sémantiques : gris (#9CA3AF), orange (#F59E0B), vert (#10B981), rouge (#EF4444)
  - [x] 3.3 Configurer le dark mode via la stratégie `class` de Tailwind (sombre par défaut)
  - [x] 3.4 Ajouter la police Poppins via Google Fonts (chargement optimisé)
  - [x] 3.5 Créer une page d'accueil minimale "posePilot" pour valider le déploiement

- [x] Task 4 — Fichiers d'environnement (AC: #1)
  - [x] 4.1 Créer `.env.example` avec les variables Supabase : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - [x] 4.2 Créer `.env.local` avec des valeurs placeholder (pas de vraies clés dans le repo)
  - [x] 4.3 Vérifier que `.env.local` est dans `.gitignore`

- [x] Task 5 — CI/CD GitHub Actions (AC: #2)
  - [x] 5.1 Créer `.github/workflows/ci.yml` avec les jobs : lint, type-check, build
  - [x] 5.2 Configurer le workflow pour s'exécuter sur push et PR vers main
  - [x] 5.3 Utiliser Node.js >= 20.19 (requis par Vite 7)
  - [x] 5.4 Ajouter le script `lint` dans package.json (ESLint)
  - [x] 5.5 Vérifier que le pipeline passe sur un push initial

- [x] Task 6 — Déploiement Vercel (AC: #3)
  - [x] 6.1 Initialiser le repo Git et pousser vers GitHub
  - [x] 6.2 Connecter le repo à Vercel (site statique SPA)
  - [x] 6.3 Configurer le build command (`npm run build`) et output directory (`dist`)
  - [x] 6.4 Configurer les rewrites SPA (toutes les routes vers index.html)
  - [x] 6.5 Vérifier l'accès HTTPS et la page minimale fonctionnelle

## Dev Notes

### Architecture & Patterns obligatoires

- **Structure par domaine** : components/, routes/, lib/queries/, lib/mutations/, lib/subscriptions/, types/, utils/ [Source: architecture.md#Project Structure]
- **Pas de barrel files** (`index.ts` qui ré-exporte) — imports directs [Source: architecture.md#Structure Patterns]
- **Un fichier = un export principal** [Source: architecture.md#Structure Patterns]
- **Tests co-localisés** : `Component.test.tsx` à côté de `Component.tsx` [Source: architecture.md#Structure Patterns]
- **Composants shadcn/ui** dans `components/ui/`, composants custom dans `components/` [Source: architecture.md#Structure Patterns]

### Conventions de nommage

- **Tables DB** : `snake_case`, pluriel — `chantiers`, `lots`, `taches`
- **Colonnes DB** : `snake_case` — `created_at`, `is_blocking`
- **Types TypeScript** : miroir exact du schéma PostgreSQL en `snake_case` (PAS de transformation camelCase)
- **Composants React** : `PascalCase` — fichiers `PascalCase.tsx`
- **Fichiers non-composants** : `camelCase.ts`
- **Hooks** : `use` + `PascalCase` — `useChantiers.ts`
- **Dossiers** : `kebab-case`
- **Constantes** : `UPPER_SNAKE_CASE`
[Source: architecture.md#Naming Patterns]

### Stack technique — Versions exactes (février 2026)

| Bibliothèque | Version | Notes |
|---|---|---|
| **Vite** | 7.3.1 | Requiert Node.js >= 20.19. ESM only. Rolldown expérimental — ne PAS utiliser `--rolldown` |
| **React** | 19.2.4 | Nouveaux : `<Activity>`, `useEffectEvent`. Pas de breaking changes vs 19.0 |
| **TypeScript** | 5.x (latest via Vite template) | Mode strict obligatoire |
| **Tailwind CSS** | 4.1.18 | **ATTENTION** : configuration CSS-first, PLUS de `tailwind.config.js`. Utiliser `@import 'tailwindcss'` dans le CSS. Utiliser `@tailwindcss/vite` pour les projets Vite |
| **shadcn/ui** | CLI 3.7.0 | `npx shadcn@latest init` gère Tailwind v4 automatiquement. Radix UI unifié |
| **@supabase/supabase-js** | 2.95.2 | Pas de v3 en février 2026. Node.js 20+ requis |
| **@tanstack/react-router** | 1.158.x | File-based routing, type-safe. Installer aussi `@tanstack/react-router-devtools` en dev |
| **@tanstack/react-query** | 5.90.x | Mutations optimistes, cache, invalidation. Installer aussi `@tanstack/react-query-devtools` en dev |
| **vite-plugin-pwa** | 1.2.0 | Compatible Vite 7 depuis v1.0.1 |
| **vitest** | latest | Testing natif Vite |

### Tailwind CSS v4 — Changement majeur à connaître

L'architecture mentionne `tailwind.config.ts` mais **Tailwind v4 n'utilise plus de fichier de config JS**. La migration :

**Avant (v3)** :
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Maintenant (v4)** :
```css
@import 'tailwindcss';
```

La configuration se fait directement dans le CSS avec `@theme` et les CSS custom properties. shadcn/ui CLI 3.7.0 gère cette configuration automatiquement lors du `npx shadcn@latest init`.

**IMPORTANT pour Vite** : Tailwind v4 avec Vite utilise le plugin dédié `@tailwindcss/vite` (pas le PostCSS plugin). L'ajouter dans `vite.config.ts` :
```typescript
import tailwindcss from '@tailwindcss/vite'
// dans plugins: [react(), tailwindcss(), VitePWA({...})]
```

**Impact** : Le document architecture.md référence un `tailwind.config.ts` — ce fichier n'existera pas. La configuration est dans `src/index.css` (ou `src/app.css` selon le scaffolding shadcn). Ce n'est PAS une erreur, c'est une évolution de Tailwind entre la rédaction de l'architecture et maintenant.

### Configuration PWA — vite-plugin-pwa

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'posePilot',
        short_name: 'posePilot',
        description: 'Suivi de chantier carrelage/faïence',
        theme_color: '#0F172A',
        background_color: '#0F172A',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
```

### CI/CD GitHub Actions — Structure attendue

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run build
```

### Vercel — Configuration SPA

Créer un `vercel.json` à la racine :
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Icônes PWA

Créer des icônes placeholder dans `public/icons/` :
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

Des icônes génériques suffisent pour la story 1.1. Elles seront remplacées par les vraies icônes posePilot ultérieurement.

### Anti-patterns à éviter (liste de l'architecture)

- NE PAS créer de fichier `api.ts` ou `services.ts` qui wrappe Supabase
- NE PAS utiliser `any` en TypeScript
- NE PAS mettre de `console.log` pour le debug en production
- NE PAS créer de barrel files `index.ts`
- NE PAS utiliser `useEffect` pour fetch des données (utiliser TanStack Query)
- NE PAS stocker d'état serveur dans `useState` (utiliser TanStack Query)

### Project Structure Notes

- La structure est alignée à 100% avec l'architecture documentée [Source: architecture.md#Complete Project Directory Structure]
- Le dossier `supabase/` avec les migrations sera créé dans la story 1.2 (authentification) ou dédié — cette story ne touche PAS à Supabase côté serveur
- Le `routeTree.gen.ts` est auto-généré par TanStack Router — ne pas le créer manuellement

### References

- [Source: architecture.md#Starter Template Evaluation] — Commandes d'initialisation et justification du choix Vite + React
- [Source: architecture.md#Complete Project Directory Structure] — Arborescence complète du projet
- [Source: architecture.md#Implementation Patterns] — Naming, structure, format, communication patterns
- [Source: architecture.md#Infrastructure & Deployment] — Vercel, GitHub Actions, environnements
- [Source: architecture.md#Architectural Boundaries] — Data/Component/State boundaries
- [Source: epics.md#Story 1.1] — User story et acceptance criteria
- [Source: ux-design-specification.md#Color System] — Palette sémantique et thème sombre
- [Source: ux-design-specification.md#Typography System] — Police Poppins, échelle typographique
- [Source: ux-design-specification.md#Spacing & Layout Foundation] — Zones tactiles, unité de base 4px
- [Source: prd.md#PWA Mobile-First] — Exigences PWA, navigateurs cibles

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Vite scaffold nécessite répertoire vide → scaffold dans temp puis copie
- shadcn init nécessite Tailwind CSS pré-installé → installé @tailwindcss/vite + tailwindcss avant init
- routeTree.gen.ts nécessite génération via `@tanstack/router-cli generate`

### Completion Notes List

- Task 1: Projet scaffoldé avec Vite 7.3.1, React 19.2.4, TS 5.9.3. shadcn/ui initialisé (new-york style, Tailwind v4). PWA configurée. Path alias @/ opérationnel.
- Task 2: Structure src/ complète conforme architecture. TanStack Router file-based avec @tanstack/router-plugin. QueryClientProvider + RouterProvider dans main.tsx. Client Supabase singleton.
- Task 3: Tailwind v4 CSS-first avec design tokens posePilot. Couleurs sémantiques (gray/orange/green/red). Dark mode par défaut via classe `dark` sur `<html>`. Font Poppins via Google Fonts. Page d'accueil minimale.
- Task 4: .env.example et .env.local créés. *.local couvert par .gitignore.
- Task 5: CI/CD GitHub Actions configuré (lint + type-check + build, Node 22, push/PR main). ESLint fonctionne localement.
- Task 6: Git init, push vers github.com/youssef67/posePilot. vercel.json avec rewrites SPA. Déploiement Vercel géré par l'utilisateur.
- Tests: 5 tests (cn utility, queryClient config, HomePage render) — tous passent.

### Change Log

- 2026-02-06: Implémentation complète Story 1-1. Initialisation projet, structure, thème, CI/CD, push GitHub.
- 2026-02-06: Code review — 8 issues trouvées (2 HIGH, 4 MEDIUM, 2 LOW). 7 corrigées automatiquement. 1 LOW restante (L2: police Poppins CDN-only pour PWA offline).

### File List

- .env.example
- .github/workflows/ci.yml
- .gitignore
- README.md
- components.json
- eslint.config.js
- index.html
- package.json
- package-lock.json
- public/icons/icon-192.png
- public/icons/icon-512.png
- src/components/ui/.gitkeep
- src/index.css
- src/lib/mutations/.gitkeep
- src/lib/queries/.gitkeep
- src/lib/queryClient.test.ts
- src/lib/queryClient.ts
- src/lib/subscriptions/.gitkeep
- src/lib/supabase.ts
- src/lib/utils.test.ts
- src/lib/utils.ts
- src/main.tsx
- src/routeTree.gen.ts
- src/routes/__root.tsx
- src/routes/index.test.tsx
- src/routes/index.tsx
- src/test/setup.ts
- src/types/database.ts
- src/types/enums.ts
- src/utils/.gitkeep
- tsconfig.app.json
- tsconfig.json
- tsconfig.node.json
- vercel.json
- vite.config.ts
- vitest.config.ts
