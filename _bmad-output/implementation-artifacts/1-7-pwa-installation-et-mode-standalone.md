# Story 1.7: PWA — Installation et mode standalone

Status: done
Story ID: 1.7
Story Key: 1-7-pwa-installation-et-mode-standalone
Epic: 1 — Fondation, Authentification & Gestion des chantiers
Date: 2026-02-09
Dependencies: Story 1.1 (done), Story 1.2 (done), Story 1.3 (done)
FRs: FR67

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux installer l'app sur l'écran d'accueil de mon smartphone,
Afin que j'accède à posePilot comme une app native, sans barre d'adresse.

## Acceptance Criteria (BDD)

### AC1: Chrome Android — Service worker et manifest valides déclenchent l'installation

**Given** l'utilisateur accède à posePilot depuis Chrome Android
**When** le service worker est enregistré et le manifest est valide
**Then** le navigateur propose l'installation sur l'écran d'accueil

### AC2: Mode standalone — Plein écran sans barre d'adresse

**Given** l'utilisateur a installé la PWA
**When** il ouvre posePilot depuis l'écran d'accueil
**Then** l'app s'ouvre en mode standalone (plein écran, sans barre d'adresse)

### AC3: Manifest — Couleurs et orientation correctes

**Given** l'app est en mode standalone
**When** elle s'affiche
**Then** le theme_color est #0F172A, le background_color est #0F172A, l'orientation est portrait

### AC4: Safari iOS — Add to Home Screen fonctionne avec safe areas

**Given** l'utilisateur accède depuis Safari iOS
**When** il utilise "Ajouter à l'écran d'accueil"
**Then** la PWA s'installe et fonctionne en mode standalone avec safe areas respectées

## Tasks / Subtasks

- [x] Task 1 — Compléter les meta tags Apple dans index.html (AC: #1, #4)
  - [x] 1.1 Ajouter `<link rel="apple-touch-icon" href="/icons/icon-192.png" sizes="180x180">` — requis pour que Safari iOS affiche la bonne icône sur l'écran d'accueil
  - [x] 1.2 Ajouter `<meta name="apple-mobile-web-app-capable" content="yes">` — requis pour le mode standalone sur Safari iOS
  - [x] 1.3 Ajouter `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` — barre de statut iOS cohérente avec le thème sombre (#0F172A)
  - [x] 1.4 Ajouter `<meta name="description" content="Suivi de chantier carrelage/faïence">` — exigence PWA minimale pour l'installabilité

- [x] Task 2 — Enrichir la configuration vite-plugin-pwa (AC: #1, #2, #3)
  - [x] 2.1 Ajouter `start_url: '/'` dans le manifest — explicitement défini pour l'install prompt
  - [x] 2.2 Ajouter `scope: '/'` dans le manifest — délimite le périmètre de la PWA
  - [x] 2.3 Ajouter `purpose: 'any maskable'` à l'icône 512x512 — permet aux appareils Android de découper l'icône en forme adaptative (cercle, carré arrondi, etc.)
  - [x] 2.4 Ajouter `includeAssets: ['icons/icon-192.png']` à la config VitePWA — s'assure que le favicon/apple-touch-icon est inclus dans le precache du service worker
  - [x] 2.5 Ajouter `workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'] }` — précache les assets statiques du build pour chargement rapide. **IMPORTANT** : NE PAS ajouter de runtime caching pour les API Supabase (pas de mode offline, requirement PRD)

- [x] Task 3 — Vérifier les safe areas en mode standalone (AC: #4)
  - [x] 3.1 Confirmer que `index.html` a bien `viewport-fit=cover` dans la balise viewport (déjà présent — validation uniquement)
  - [x] 3.2 Confirmer que `BottomNavigation.tsx` applique `paddingBottom: 'env(safe-area-inset-bottom)'` (déjà en place — validation uniquement)
  - [x] 3.3 Vérifier que le layout `_authenticated.tsx` a un padding-bottom suffisant pour la BottomNavigation (déjà `pb-14` + safe area — validation uniquement)
  - [x] 3.4 Si le header/layout racine n'applique pas `env(safe-area-inset-top)` → l'ajouter dans `_authenticated.tsx` pour les appareils à notch en mode standalone

- [x] Task 4 — Tests (toutes AC)
  - [x] 4.1 Créer `src/__tests__/pwa-config.test.ts` — test unitaire qui importe `vite.config.ts` et valide :
    - Le plugin VitePWA est présent
    - `manifest.display === 'standalone'`
    - `manifest.theme_color === '#0F172A'`
    - `manifest.background_color === '#0F172A'`
    - `manifest.orientation === 'portrait'`
    - `manifest.start_url === '/'`
    - `manifest.scope === '/'`
    - Les icônes 192x192 et 512x512 sont déclarées
    - Au moins une icône a `purpose` contenant `maskable`
  - [x] 4.2 Créer `src/__tests__/pwa-html.test.ts` — test qui lit `index.html` via fs et valide :
    - `<meta name="theme-color" content="#0F172A">` présent
    - `<meta name="apple-mobile-web-app-capable" content="yes">` présent
    - `<meta name="apple-mobile-web-app-status-bar-style">` présent
    - `<link rel="apple-touch-icon">` présent
    - `viewport-fit=cover` dans le viewport meta
    - `<meta name="description">` présent
  - [x] 4.3 Vérifier que tous les tests existants passent (114 baseline + nouveaux = 0 régressions)
  - [x] 4.4 Lint clean (sauf ThemeProvider pre-existing warning)

## Dev Notes

### Architecture & Patterns obligatoires

- **vite-plugin-pwa v1.2.0** — déjà installé et configuré dans `vite.config.ts`. Le plugin gère automatiquement : génération du `manifest.webmanifest`, enregistrement du service worker, injection du lien manifest dans le HTML [Source: architecture.md#Starter Template Evaluation]
- **registerType: 'autoUpdate'** — le service worker se met à jour automatiquement sans prompt utilisateur. C'est le comportement souhaité pour posePilot (2-3 utilisateurs, pas de gestion manuelle des updates) [Source: architecture.md#Gap Analysis]
- **Pas de mode offline** — exclu explicitement du PRD. Ne PAS ajouter de runtime caching pour les API Supabase ni de stratégie offline-first. Seul le precache des assets statiques du build est acceptable [Source: prd.md#Exclusions définitives]
- **Safe areas iPhone** — `env(safe-area-inset-bottom)` sur la BottomNavigation, `env(safe-area-inset-top)` sur le header si nécessaire en standalone [Source: ux-design-specification.md#Cross-Device Adaptation]
- **Pas d'Apple splash screen** — Non requis pour le MVP. Les splash screens iOS nécessitent des images à résolutions multiples. À envisager dans une itération future si l'UX le justifie.

### Ce qui est DÉJÀ en place (Story 1.1)

| Élément | Statut | Fichier |
|---|---|---|
| vite-plugin-pwa installé | ✓ | `package.json` (v1.2.0) |
| Plugin configuré dans Vite | ✓ | `vite.config.ts` |
| Manifest de base (name, short_name, display, theme_color, background_color, orientation, icons) | ✓ | `vite.config.ts` |
| Icônes 192x192 et 512x512 | ✓ | `public/icons/` |
| Meta viewport avec `viewport-fit=cover` | ✓ | `index.html:6` |
| Meta `theme-color` | ✓ | `index.html:7` |
| `paddingBottom: env(safe-area-inset-bottom)` sur BottomNavigation | ✓ | `BottomNavigation.tsx:25` |
| Service worker auto-registered | ✓ | Via `registerType: 'autoUpdate'` |

### Ce qui MANQUE (à implémenter dans cette story)

| Élément | Pourquoi c'est nécessaire |
|---|---|
| `<link rel="apple-touch-icon">` | Safari iOS ignore les icônes du manifest — il faut un tag HTML explicite pour l'icône home screen |
| `<meta name="apple-mobile-web-app-capable" content="yes">` | Active le mode standalone sur Safari iOS (sans ce tag, l'app s'ouvre dans Safari normal) |
| `<meta name="apple-mobile-web-app-status-bar-style">` | Contrôle l'apparence de la barre de statut iOS en standalone |
| `<meta name="description">` | Requis par les PWA minimal requirements pour l'installabilité |
| `start_url` et `scope` dans le manifest | Explicitement requis pour que l'install prompt fonctionne correctement sur tous les navigateurs |
| `purpose: 'any maskable'` sur l'icône 512 | Permet les icônes adaptatives Android (cercle, carré arrondi, etc.) |
| `includeAssets` dans VitePWA config | Précache les assets statiques pour améliorer le chargement |
| `workbox.globPatterns` | Configure le précache des fichiers buildés |
| Tests PWA | Valider que la configuration est complète et correcte |

### Conventions de nommage

- Tests PWA dans `src/__tests__/` (pas co-localisés car testent des fichiers de config, pas des composants)
- Pas de nouveaux composants React — cette story est purement configuration
- Pas de nouvelles routes
- Pas de nouvelles migrations SQL

### Stack technique — Versions exactes (déjà installées)

| Bibliothèque | Version | Utilisation dans cette story |
|---|---|---|
| **vite-plugin-pwa** | 1.2.0 | Configuration manifest, service worker, workbox |
| **vite** | 7.2.x | Build avec plugin PWA |
| **vitest** | 4.0.x | Tests de configuration |

### Configuration cible vite.config.ts

```typescript
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['icons/icon-192.png'],
  manifest: {
    name: 'posePilot',
    short_name: 'posePilot',
    description: 'Suivi de chantier carrelage/faïence',
    start_url: '/',
    scope: '/',
    theme_color: '#0F172A',
    background_color: '#0F172A',
    display: 'standalone',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  },
})
```

### index.html cible

```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/png" href="/icons/icon-192.png" />
  <link rel="apple-touch-icon" href="/icons/icon-192.png" sizes="180x180" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#0F172A" />
  <meta name="description" content="Suivi de chantier carrelage/faïence" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <title>posePilot</title>
</head>
```

### Project Structure Notes

**Nouveaux fichiers à créer :**
- `src/__tests__/pwa-config.test.ts` — Tests config vite-plugin-pwa
- `src/__tests__/pwa-html.test.ts` — Tests meta tags HTML

**Fichiers à modifier :**
- `index.html` — Ajouter apple-touch-icon, apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style, meta description
- `vite.config.ts` — Ajouter start_url, scope, includeAssets, workbox.globPatterns, purpose maskable sur icon 512

**Fichiers potentiellement à modifier (vérification) :**
- `src/routes/_authenticated.tsx` — Ajouter `env(safe-area-inset-top)` si absent pour les appareils à notch en standalone

**Fichiers NON touchés :**
- `src/components/BottomNavigation.tsx` — Safe area bottom déjà en place
- `src/main.tsx` — Aucune modification
- `src/index.css` — Aucune modification
- `package.json` — Aucune nouvelle dépendance (tout est déjà installé)
- `supabase/migrations/` — Pas de migration
- `src/types/` — Pas de changement
- `src/lib/` — Pas de changement
- `src/routes/` (autres que _authenticated.tsx si safe-area-top) — Pas de changement

### Attention — Pièges courants

1. **Ne PAS ajouter de caching API** — Le PRD exclut explicitement le mode offline. Le workbox doit UNIQUEMENT précacher les assets statiques du build. Pas de `runtimeCaching` sur les URLs Supabase.
2. **`purpose: 'any maskable'` pas `'maskable'` seul** — Si on met `purpose: 'maskable'` sans `'any'`, l'icône ne sera PAS utilisée comme icône standard sur les appareils qui ne supportent pas les masquables. Toujours `'any maskable'` ou deux entrées séparées.
3. **apple-touch-icon utilise 180x180** — Safari iOS attend idéalement 180x180. On pointe vers l'icône 192x192 qui sera redimensionnée automatiquement par le système — acceptable.
4. **`black-translucent` et non `default`** — Le style `black-translucent` permet au contenu de l'app de s'étendre sous la barre de statut iOS, ce qui est cohérent avec `viewport-fit=cover` et le thème sombre.
5. **Les tests de config importent `vite.config.ts`** — Vitest peut importer le fichier de config Vite car c'est du TypeScript standard. Le test valide la configuration statiquement sans lancer un build.
6. **Le `routeTree.gen.ts` ne devrait PAS changer** — Cette story ne touche ni les routes ni les composants.
7. **Pas de changement visible pour l'utilisateur en dev** — Le service worker n'est actif qu'en production (build). Les tests et la validation se font via `npm run build` + `npm run preview`.

### References

- [Source: epics.md#Story 1.7] — User story, acceptance criteria BDD
- [Source: architecture.md#Gap Analysis] — vite-plugin-pwa registerType autoUpdate, display standalone, theme_color #0F172A
- [Source: architecture.md#Starter Template Evaluation] — vite-plugin-pwa dans le stack
- [Source: architecture.md#Infrastructure & Deployment] — Vercel deploiement statique SPA
- [Source: ux-design-specification.md#Platform Strategy] — PWA installable, Chrome Android priorité, Safari iOS secondaire
- [Source: ux-design-specification.md#Cross-Device Adaptation] — safe-area-inset-bottom/top, display standalone
- [Source: ux-design-specification.md#Developer Technical Guidelines] — PWA manifest specs, viewport-fit=cover
- [Source: prd.md#FR67] — L'utilisateur peut installer la PWA sur l'écran d'accueil
- [Source: prd.md#Project-Type Requirements] — PWA architecture, no offline mode
- [Source: vite-plugin-pwa docs] — Minimal requirements: apple-touch-icon, description meta, maskable icons

## Previous Story Intelligence (Story 1.6)

### Learnings critiques de la story précédente

1. **114 tests existants** — baseline à ne pas régresser (82 pré-story-1.6 + 32 story 1.6)
2. **shadcn/ui eslint-disable pattern** — `tabs.tsx`, `button.tsx` ont le commentaire `eslint-disable react-refresh/only-export-components`. Les fichiers shadcn générés qui exportent des variants cva nécessitent ce commentaire.
3. **Pre-existing lint warning** — `ThemeProvider.tsx:64` (react-refresh/only-export-components) — toujours ignoré.
4. **useUpdateChantierStatus pattern** — Mutation optimiste avec `getQueriesData` pour snapshot complet, rollback via boucle, navigation `onSuccess` (pas `onSettled`). Pattern mature à réutiliser si besoin.
5. **useChantiers accepte un paramètre `status`** — Query key `['chantiers', { status }]`, défaut `'active'`.
6. **AlertDialog + DropdownMenu pattern** — État contrôlé `open/onOpenChange` quand le trigger est dans un DropdownMenu.
7. **Tabs shadcn/ui déjà installés** — Disponibles pour usage futur.

### Code patterns établis (à respecter)

- Tests avec Vitest + Testing Library + mocks Supabase
- `createFileRoute('/_authenticated/...')` pour les routes protégées
- Composants shadcn/ui dans `src/components/ui/`
- Pas de barrel files — imports directs
- Messages en français
- Types snake_case pour les données DB

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
- Tailwind CSS v4 (config inline dans index.css)
- TanStack Router (file-based routing, route generation automatique)
- TanStack Query (configuré, query keys `['chantiers', { status }]`)
- Supabase Auth (email/password, RLS) + Supabase JS Client (typé Database)
- Supabase Realtime (subscription `chantiers-changes`, invalidation query)
- shadcn/ui (button, card, input, label, badge, sonner, alert-dialog, dropdown-menu, tabs — style "new-york")
- Lucide React (icônes)
- Vitest + Testing Library (setup complet)
- vite-plugin-pwa v1.2.0 (configuré avec registerType autoUpdate)
- 114 tests existants

## Latest Tech Information

### vite-plugin-pwa v1.2.0 — PWA Minimal Requirements

D'après la documentation officielle, les exigences minimales pour une PWA installable sont :

**index.html `<head>` :**
```html
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>App Name</title>
<meta name="description" content="App description">
<link rel="icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
<meta name="theme-color" content="#ffffff">
```

**Manifest icons :**
- `pwa-192x192.png` (192x192) — requis
- `pwa-512x512.png` (512x512) — requis
- Optionnel : une icône 512x512 avec `purpose: 'any maskable'` pour les icônes adaptatives Android

**Chrome install criteria (2026) :**
- HTTPS (fourni par Vercel)
- Service worker enregistré avec fetch handler
- Manifest valide avec : `name` ou `short_name`, `start_url`, `display` (standalone/fullscreen/minimal-ui), icône 192x192 et 512x512
- L'app n'est pas déjà installée

**Safari iOS (2026) :**
- Pas de prompt automatique — l'utilisateur utilise "Ajouter à l'écran d'accueil" depuis le menu partage
- `<meta name="apple-mobile-web-app-capable" content="yes">` requis pour le standalone
- Safari ignore le manifest pour les icônes — utilise `<link rel="apple-touch-icon">`
- `<meta name="apple-mobile-web-app-status-bar-style">` contrôle l'apparence de la barre de statut

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

(aucun problème rencontré)

### Completion Notes List

- Task 1: Ajouté 4 meta tags Apple/PWA dans `index.html` — apple-touch-icon, apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style, meta description
- Task 2: Enrichi la config VitePWA dans `vite.config.ts` — start_url, scope, purpose 'any maskable', includeAssets, workbox.globPatterns. Pas de runtimeCaching (PRD: pas de mode offline)
- Task 3: Safe areas vérifiées — viewport-fit=cover ✓, BottomNavigation safe-area-inset-bottom ✓, _authenticated.tsx pb safe-area-inset-bottom ✓. Ajouté pt-[env(safe-area-inset-top)] pour les appareils à notch en mode standalone
- Task 4: 18 tests PWA (12 pwa-config + 6 pwa-html). 132 tests total, 0 régressions. Lint clean (sauf ThemeProvider pré-existant)

### Change Log

- 2026-02-09: Story 1.7 complète — PWA installation et mode standalone
- 2026-02-09: Code review — 4 issues corrigées (1 HIGH, 3 MEDIUM): strip commentaires dans tests config, ajout tests includeAssets/globPatterns/no-runtimeCaching, renforcement test status-bar-style

### File List

**Modifiés:**
- `index.html` — Ajout apple-touch-icon, apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style, meta description
- `vite.config.ts` — Ajout start_url, scope, purpose maskable, includeAssets, workbox.globPatterns
- `src/routes/_authenticated.tsx` — Ajout pt-[env(safe-area-inset-top)] pour notch devices

**Créés:**
- `src/__tests__/pwa-config.test.ts` — 12 tests validant la config vite-plugin-pwa (avec strip commentaires et tests défensifs)
- `src/__tests__/pwa-html.test.ts` — 6 tests validant les meta tags HTML (avec vérification valeur status-bar-style)
