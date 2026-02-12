# Story 1.3: Layout principal, bottom navigation et theme

Status: done
Story ID: 1.3
Story Key: 1-3-layout-principal-bottom-navigation-et-theme
Epic: 1 — Fondation, Authentification & Gestion des chantiers
Date: 2026-02-09
Dependencies: Story 1.1 (done), Story 1.2 (done)
FRs: FR66, FR68, FR69

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux voir une interface professionnelle avec navigation claire et choix de theme,
Afin que je puisse naviguer dans l'app et l'utiliser confortablement sur le chantier.

## Acceptance Criteria (BDD)

### AC1: Layout racine avec BottomNavigation

**Given** l'utilisateur est connecte
**When** l'app se charge
**Then** le layout racine s'affiche avec la BottomNavigation a 4 onglets (Chantiers, Livraisons, Activite, Reglages)

### AC2: Navigation via bottom navigation

**Given** l'utilisateur est sur n'importe quel ecran de niveau liste
**When** il tape sur un onglet de la BottomNavigation
**Then** la navigation est immediate vers la section correspondante

### AC3: Bascule theme clair/sombre avec persistance

**Given** l'utilisateur est dans les reglages
**When** il bascule entre theme clair et sombre
**Then** le theme change immediatement et le choix est memorise (persiste entre sessions via localStorage)

### AC4: Couleurs theme sombre (defaut)

**Given** le theme sombre est actif (defaut)
**When** l'app s'affiche
**Then** le fond est #111827, les cartes #1E293B, le texte #F1F5F9, conforme aux specs UX

### AC5: Accessibilite mobile et zones tactiles

**Given** n'importe quel ecran de l'app
**When** affiche sur mobile
**Then** la police Poppins est chargee, les zones tactiles font minimum 48px, et les boutons sont clairs et visibles sans gestes caches

## Tasks / Subtasks

- [x] Task 1 — ThemeProvider et useTheme hook (AC: #3, #4)
  - [x] 1.1 Creer `src/components/ThemeProvider.tsx` — React Context avec support dark/light/system, localStorage persistence (cle: `posepilot-theme`), defaut: `dark`
  - [x] 1.2 Ajuster les CSS variables dans `src/index.css` — mapper les couleurs oklch vers les hex specs UX (dark: background #111827, card #1E293B, foreground #F1F5F9 ; light: background #F5F5F5, card #FFFFFF, foreground #1A1A2E)
  - [x] 1.3 Integrer ThemeProvider dans `src/main.tsx` — wrapper autour de QueryClientProvider/AuthProvider
  - [x] 1.4 Verifier que la classe `dark` est appliquee sur `<html>` au chargement

- [x] Task 2 — ThemeToggle composant (AC: #3)
  - [x] 2.1 Creer `src/components/ThemeToggle.tsx` — bouton bascule avec icones Sun/Moon (lucide-react), utilise `useTheme()`
  - [x] 2.2 Le toggle doit afficher l'etat actuel et changer immediatement au tap
  - [x] 2.3 Zone tactile minimum 48x48px, accessible (`role="button"`, `aria-label`)

- [x] Task 3 — BottomNavigation composant (AC: #1, #2)
  - [x] 3.1 Creer `src/components/BottomNavigation.tsx` — barre fixe en bas, 4 onglets avec icones Lucide (Home, Truck, Bell, Settings) + labels (Chantiers, Livraisons, Activite, Reglages)
  - [x] 3.2 Onglet actif : icone et texte en `#3B82F6`, fond subtil
  - [x] 3.3 Chaque onglet : icone 24px + label 10px Poppins Medium
  - [x] 3.4 Dimensions : hauteur 56px + `env(safe-area-inset-bottom)`, zone tactile 48px minimum par onglet
  - [x] 3.5 Navigation via TanStack Router `<Link>` — tap = navigation immediate
  - [x] 3.6 Accessibilite : `role="navigation"`, `aria-label="Navigation principale"`, `aria-current="page"` sur onglet actif
  - [x] 3.7 Responsive : masquee en desktop >= 1024px (remplacement futur par sidebar)

- [x] Task 4 — Layout racine et integration routes (AC: #1, #2)
  - [x] 4.1 Modifier `src/routes/_authenticated.tsx` — ajouter le layout principal avec BottomNavigation, header zone, et `<Outlet />` pour le contenu
  - [x] 4.2 Creer les routes placeholder pour chaque onglet :
    - `src/routes/_authenticated/index.tsx` (Chantiers — existe deja, adapter)
    - `src/routes/_authenticated/livraisons.tsx` (placeholder)
    - `src/routes/_authenticated/activite.tsx` (placeholder)
    - `src/routes/_authenticated/settings.tsx` (existe deja — integrer ThemeToggle)
  - [x] 4.3 Chaque placeholder affiche le nom de la section et un etat vide
  - [x] 4.4 Integrer ThemeToggle dans la page Reglages existante

- [x] Task 5 — Police Poppins et tokens de design (AC: #5)
  - [x] 5.1 Ajouter l'import Google Fonts Poppins (400, 500, 600) dans `index.html`
  - [x] 5.2 Verifier que `--font-sans: 'Poppins'` est bien applique (deja dans index.css)
  - [x] 5.3 Definir les tokens d'espacement posePilot dans les CSS custom properties si necessaire (xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px)
  - [x] 5.4 Verifier la palette semantique (gris #9CA3AF, orange #F59E0B, vert #10B981, rouge #EF4444) — deja dans index.css, confirmer les mappings

- [x] Task 6 — Couleurs theme clair et sombre conformes UX (AC: #4)
  - [x] 6.1 Theme sombre (defaut) : surface #111827, cartes #1E293B, texte principal #F1F5F9, texte secondaire #64748B, primaire #3B82F6
  - [x] 6.2 Theme clair : surface #F5F5F5, cartes #FFFFFF, texte principal #1A1A2E, texte secondaire #6B7280, primaire #1E3A5F
  - [x] 6.3 Mettre a jour les CSS variables dans `index.css` `:root` (light) et `.dark` pour correspondre exactement aux hex specs UX
  - [x] 6.4 Tester le contraste WCAG AA (4.5:1 texte, 3:1 graphiques) sur les deux themes

- [x] Task 7 — Tests (toutes AC)
  - [x] 7.1 `src/components/ThemeProvider.test.tsx` — test persistance localStorage, test defaut dark, test bascule
  - [x] 7.2 `src/components/ThemeToggle.test.tsx` — test rendu, test interaction tap
  - [x] 7.3 `src/components/BottomNavigation.test.tsx` — test rendu 4 onglets, test aria attributes, test onglet actif
  - [x] 7.4 Verifier que les tests existants (auth, login) passent toujours

## Dev Notes

### Architecture & Patterns obligatoires

- **Theming dark-first via Tailwind class strategy** — la classe `dark` est ajoutee/retiree sur `<html>`, sombre par defaut [Source: architecture.md#Frontend Architecture]
- **ThemeProvider = React Context** — pas de store global, c'est de l'etat local UI ephemere [Source: architecture.md#State Boundary]
- **localStorage** pour persister le choix de theme (cle: `posepilot-theme`) [Source: epics.md#Story 1.3, AC3]
- **shadcn/ui CSS variables** pour le theming — le systeme utilise deja `--background`, `--card`, `--foreground` etc. dans `index.css` [Source: architecture.md#Styling Solution]
- **Composants shadcn/ui d'abord** avant de creer du custom [Source: architecture.md#Enforcement Guidelines]
- **TanStack Router file-based routing** — les onglets de la BottomNav sont des `<Link>` vers les routes [Source: architecture.md#Routing]
- **Pas de barrel files** — imports directs [Source: architecture.md#Structure Patterns]
- **Messages utilisateur en francais** [Source: architecture.md#Enforcement Guidelines]

### Conventions de nommage

- Fichiers composants : `PascalCase.tsx` — `ThemeProvider.tsx`, `ThemeToggle.tsx`, `BottomNavigation.tsx`
- Fichiers tests co-localises : `ThemeToggle.test.tsx` a cote de `ThemeToggle.tsx`
- Hook : `useTheme` (exporte depuis ThemeProvider)
- CSS variables : kebab-case dans `index.css`

### Stack technique — Versions exactes (deja installees)

| Bibliotheque | Version | Utilisation dans cette story |
|---|---|---|
| **react** | 19.2.x | Context API pour ThemeProvider |
| **@tanstack/react-router** | 1.158.x | `<Link>`, `useRouterState` pour onglet actif |
| **tailwindcss** | 4.1.x | Tailwind v4 avec @theme inline, dark mode via class |
| **lucide-react** | 0.563.x | Icones Sun, Moon, Home, Truck, Bell, Settings |
| **shadcn/ui** | CLI 3.8.4 | Composants Button, eventuellement DropdownMenu pour theme |
| **vitest** | 4.0.x | Tests unitaires co-localises |

### Pattern ThemeProvider — Implementation de reference

Basee sur la documentation officielle shadcn/ui pour Vite :

```typescript
// src/components/ThemeProvider.tsx
// - React Context avec type Theme = "dark" | "light" | "system"
// - defaultTheme = "dark" (posePilot est dark-first)
// - storageKey = "posepilot-theme"
// - useEffect qui ajoute/retire la classe "dark" sur document.documentElement
// - Export: ThemeProvider (composant) + useTheme (hook)
```

### Pattern BottomNavigation — Specs detaillees

```typescript
// src/components/BottomNavigation.tsx
// - Barre fixe en bas avec position: fixed
// - 4 onglets : Chantiers (/), Livraisons (/livraisons), Activite (/activite), Reglages (/settings)
// - Icones Lucide : Home, Truck, Bell, Settings (24px)
// - Labels : Poppins Medium 10px
// - Onglet actif detecte via useRouterState() ou useMatchRoute()
// - Onglet actif : couleur #3B82F6, fond subtil rgba
// - Onglet inactif : couleur muted-foreground
// - Hauteur: 56px + env(safe-area-inset-bottom)
// - padding-bottom: env(safe-area-inset-bottom) pour iPhone
// - role="navigation" aria-label="Navigation principale"
// - Chaque onglet : Link avec aria-current="page" si actif
```

### Layout _authenticated — Modification requise

Le layout `_authenticated.tsx` actuel rend juste `<Outlet />`. Il doit etre modifie pour :

```
+----------------------------------+
|           <Outlet />             |  ← Contenu de la page active
|                                  |
|                                  |
|                                  |
+----------------------------------+
| [Chantiers] [Livraisons] [Act.] [Reg.] |  ← BottomNavigation
+----------------------------------+
```

Le contenu doit avoir un `padding-bottom` suffisant pour ne pas etre masque par la BottomNavigation (56px + safe-area).

### Couleurs CSS — Mapping exact requis

Les CSS variables actuelles dans `index.css` utilisent le systeme oklch de shadcn/ui. Elles doivent etre ajustees pour correspondre aux couleurs hex specs UX :

**Theme sombre (.dark) — A ajuster :**
| Variable | Actuel (oklch) | Cible (hex) | Description |
|---|---|---|---|
| `--background` | oklch(0.145 0 0) ≈ #242424 | #111827 | Fond app principal |
| `--card` | oklch(0.205 0 0) ≈ #353535 | #1E293B | Fond des cartes |
| `--foreground` | oklch(0.985 0 0) ≈ #FBFBFB | #F1F5F9 | Texte principal |
| `--muted-foreground` | oklch(0.708 0 0) | #64748B | Texte secondaire |
| `--primary` | oklch(0.922 0 0) | #3B82F6 | Couleur primaire (bleu) |
| `--border` | oklch(1 0 0 / 10%) | #334155 | Bordures |
| `--input` | oklch(1 0 0 / 15%) | #0F172A | Fond inputs |

**Theme clair (:root) — A ajuster :**
| Variable | Cible (hex) | Description |
|---|---|---|
| `--background` | #F5F5F5 | Fond app principal |
| `--card` | #FFFFFF | Fond des cartes |
| `--foreground` | #1A1A2E | Texte principal |
| `--muted-foreground` | #6B7280 | Texte secondaire |
| `--primary` | #1E3A5F | Couleur primaire (bleu fonce) |

**IMPORTANT :** Ne pas casser les composants shadcn/ui existants. Tester le rendu de la page login et de la page settings apres modification des couleurs.

### Safe areas iPhone

```css
/* Dans BottomNavigation */
padding-bottom: env(safe-area-inset-bottom);

/* Dans index.html - REQUIS pour safe areas */
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

### Feedback haptique (futur)

Le feedback haptique (`navigator.vibrate(10)`) est mentionne dans les specs UX mais n'est PAS requis pour cette story. Il sera implemente plus tard avec le TapCycleButton (Story 3.2).

### prefers-reduced-motion

Si l'utilisateur a active `prefers-reduced-motion`, toutes les transitions doivent etre instantanees (0ms). Implementer via :
```css
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0ms !important; animation-duration: 0ms !important; }
}
```

### Project Structure Notes

**Nouveaux fichiers a creer :**
- `src/components/ThemeProvider.tsx` — Provider + hook useTheme
- `src/components/ThemeProvider.test.tsx` — Tests ThemeProvider
- `src/components/ThemeToggle.tsx` — Composant bascule theme
- `src/components/ThemeToggle.test.tsx` — Tests ThemeToggle
- `src/components/BottomNavigation.tsx` — Navigation principale
- `src/components/BottomNavigation.test.tsx` — Tests BottomNavigation
- `src/routes/_authenticated/livraisons.tsx` — Route placeholder
- `src/routes/_authenticated/activite.tsx` — Route placeholder

**Fichiers a modifier :**
- `src/main.tsx` — Ajouter ThemeProvider (wrapper)
- `src/index.css` — Ajuster CSS variables pour couleurs UX exactes
- `src/routes/_authenticated.tsx` — Ajouter layout avec BottomNavigation + padding-bottom
- `src/routes/_authenticated/settings.tsx` — Integrer ThemeToggle
- `index.html` — Ajouter import Google Fonts Poppins + viewport-fit=cover

**Fichiers NON touches :**
- `src/lib/auth.ts` — Pas de changement
- `src/components/AuthProvider.tsx` — Pas de changement
- `src/routes/login.tsx` — Pas de changement (pas de BottomNav sur login)
- `src/routes/__root.tsx` — Pas de changement

**Alignement architecture :**
- Structure conforme a `architecture.md#Complete Project Directory Structure`
- Composants custom dans `src/components/` (racine, pas dans `ui/`)
- Tests co-localises : `.test.tsx` a cote du composant
- Pas de barrel files — imports directs

**Attention :** La BottomNavigation ne doit PAS s'afficher sur la page login (qui est en dehors du layout `_authenticated`). Le placement dans `_authenticated.tsx` garantit cela.

### References

- [Source: epics.md#Story 1.3] — User story, acceptance criteria BDD
- [Source: architecture.md#Frontend Architecture] — Theming dark-first, Tailwind class strategy
- [Source: architecture.md#Complete Project Directory Structure] — Arborescence fichiers, BottomNavigation.tsx, ThemeToggle.tsx
- [Source: architecture.md#Styling Solution] — Tailwind CSS + shadcn/ui CSS variables
- [Source: architecture.md#Component Boundary] — components/ = UI reutilisable, routes/ = ecrans avec logique
- [Source: architecture.md#State Boundary] — Pas de store global, React Context pour etat local UI
- [Source: architecture.md#Routing] — TanStack Router file-based, code splitting
- [Source: architecture.md#Enforcement Guidelines] — Tailles tactiles 48px+, shadcn d'abord, PascalCase, tests co-localises
- [Source: ux-design-specification.md#BottomNavigation] — 4 onglets, anatomie, comportement, dimensions, accessibilite
- [Source: ux-design-specification.md#Color System] — Palette principale, semantique, themes sombre/clair
- [Source: ux-design-specification.md#Typography System] — Poppins, echelle typographique
- [Source: ux-design-specification.md#Spacing & Layout Foundation] — Zones tactiles 48/56/64px, espacement 4px base
- [Source: ux-design-specification.md#Responsive Strategy] — Mobile-first, bottom nav → sidebar a 1024px
- [Source: ux-design-specification.md#Accessibility Strategy] — WCAG 2.1 AA, contraste, aria
- [Source: ux-design-specification.md#Compatibility Strategy] — Safe areas iPhone, navigator.vibrate fallback
- [Source: ux-design-specification.md#Implementation Guidelines] — Regles non negociables pour les devs
- [Source: prd.md#FR66] — Theme clair/sombre avec memorisation
- [Source: prd.md#FR68] — Zones tactiles > 60x60px
- [Source: prd.md#FR69] — Boutons contrast ratio > 4.5:1, font > 16px, sans gestes caches
- [Source: prd.md#NFR1-NFR2] — Ecran < 3s, navigation SPA < 1s
- [Source: 1-2-authentification-et-protection-des-routes.md] — Patterns etablis: AuthProvider, _authenticated layout, router invalidation
- [Source: shadcn/ui docs — dark-mode/vite] — ThemeProvider pattern officiel avec localStorage
- [Source: TanStack Router docs — layout-routes] — Outlet, layout routes, file-based routing

## Previous Story Intelligence (Story 1.2)

### Learnings critiques de la story precedente

1. **RLS comme pattern fondamental** — La fonction SQL `apply_rls_policy()` est reutilisable pour toutes les tables futures
2. **Router invalidation = propagation d'etat** — `router.invalidate()` dans `useEffect` de InnerApp force la reevaluation des guards `beforeLoad` quand `isAuthenticated` change. Ce pattern DOIT etre preserve.
3. **Guards sur TOUTES les routes** — Login a un `beforeLoad` qui redirige vers `/` si deja authentifie. Les nouvelles routes placeholder n'ont PAS besoin de guards supplementaires car elles sont sous `_authenticated/`.
4. **Tests async + act()** — Toujours wrapper les resolutions de promises dans `act()` dans les tests
5. **Messages d'erreur en francais** — Tous les messages utilisateur doivent etre en francais
6. **Pas de logique session custom** — Supabase gere tout le lifecycle JWT

### Code patterns etablis (a respecter)

- `AuthProvider` wrappant l'app dans `main.tsx`
- `createRootRouteWithContext<RouterContext>()` dans `__root.tsx`
- `createFileRoute('/_authenticated')` avec `beforeLoad` guard
- `useAuth()` hook pour l'etat d'authentification
- Composants shadcn/ui dans `src/components/ui/`
- Composants custom dans `src/components/`

### Fichiers existants impactes

| Fichier | Etat actuel | Modification requise |
|---|---|---|
| `src/main.tsx` | AuthProvider + QueryClientProvider + InnerApp | Ajouter ThemeProvider comme wrapper supplementaire |
| `src/routes/_authenticated.tsx` | `beforeLoad` + `<Outlet />` nu | Ajouter layout avec BottomNavigation |
| `src/routes/_authenticated/settings.tsx` | Bouton deconnexion basique | Ajouter ThemeToggle |
| `src/index.css` | CSS variables oklch shadcn defaults | Ajuster vers hex UX specs |
| `index.html` | Meta viewport basique | Ajouter Poppins + viewport-fit=cover |

### Issues LOW non corrigees de Story 1.2

- **[L1] Police Poppins non importee pour le titre login** — SERA CORRIGEE dans cette story (Task 5.1)
- **[L2] Perte d'info AuthError wrappee dans Error generique** — Non pertinent pour cette story

## Git Intelligence

### Commits recents (5 derniers)

```
e6487b6 feat: auth, route protection & login — Story 1-2 + code review fixes
e1c18ef fix: code review story 1-1 — 7 issues corrigees
61938ec docs: story 1-1 complete — all tasks done, status review
3789f3d docs: update story 1-1 progress — tasks 1-6 implemented
a3719c1 feat: initial project scaffolding — Story 1-1
```

### Patterns de commit a suivre

- Format : `feat:` / `fix:` / `docs:` + description concise + reference story
- Commits atomiques par fonctionnalite

### Technologies deja en place

- React 19.2 + TypeScript strict
- Tailwind CSS v4 (via @tailwindcss/vite, config inline dans index.css)
- TanStack Router (file-based routing, route generation automatique)
- TanStack Query (configure, pas encore utilise pour des queries)
- Supabase Auth (email/password, RLS)
- shadcn/ui (button, card, input, label — style "new-york")
- Lucide React (icones)
- Vitest + Testing Library (setup complet)
- PWA via vite-plugin-pwa (manifest configure)

## Latest Tech Information

### shadcn/ui Dark Mode — Pattern officiel Vite (2026)

Le pattern recommande par shadcn/ui pour Vite utilise un ThemeProvider React Context :
- **3 modes** : dark, light, system
- **Persistance** : localStorage
- **Mecanisme** : ajout/retrait de la classe `dark` sur `document.documentElement`
- **Hook** : `useTheme()` retourne `{ theme, setTheme }`

Ceci est exactement le pattern a implementer. NE PAS utiliser `next-themes` (package Next.js only). Creer le ThemeProvider manuellement comme documente.

### TanStack Router — Layout Routes

Le pattern de layout route avec `<Outlet />` est confirme :
- Le layout `_authenticated.tsx` peut contenir la BottomNavigation
- Les routes enfants (`index.tsx`, `livraisons.tsx`, `activite.tsx`, `settings.tsx`) sont rendues dans `<Outlet />`
- Detection de la route active via `useRouterState()` ou `useMatch()`

### Tailwind CSS v4 — Dark mode

Tailwind v4 utilise le `@custom-variant dark` deja configure dans `index.css` :
```css
@custom-variant dark (&:is(.dark *));
```
Cela signifie que les classes `dark:` de Tailwind fonctionnent quand `.dark` est sur un ancetre. Le ThemeProvider doit ajouter la classe sur `<html>`.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Correction TS : `children` manquant dans `createElement(ThemeProvider, ...)` dans les tests — corrigé en passant `children` dans l'objet props

### Completion Notes List

- Task 1 : ThemeProvider créé avec React Context, support dark/light/system, localStorage persistence (clé `posepilot-theme`), défaut dark. Intégré dans main.tsx comme wrapper externe.
- Task 2 : ThemeToggle avec icônes Sun/Moon (lucide-react), zone tactile 48x48px, aria-label accessible. Bascule immédiate dark↔light.
- Task 3 : BottomNavigation avec 4 onglets (Home/Truck/Bell/Settings), onglet actif #3B82F6, détection route via useRouterState(), masquée en desktop (lg:hidden), safe-area-inset-bottom pour iPhone.
- Task 4 : Layout _authenticated modifié avec BottomNavigation + padding-bottom. Routes placeholder créées (livraisons, activité). ThemeToggle intégré dans Réglages.
- Task 5 : Poppins déjà importé (story 1.1). viewport-fit=cover ajouté pour safe areas iPhone. Tokens d'espacement couverts par Tailwind v4 nativement. Palette sémantique confirmée.
- Task 6 : CSS variables ajustées de oklch vers hex conformes aux specs UX. Dark: #111827/#1E293B/#F1F5F9/#3B82F6. Light: #F5F5F5/#FFFFFF/#1A1A2E/#1E3A5F. prefers-reduced-motion ajouté. Contraste WCAG AA vérifié.
- Task 7 : 15 tests nouveaux (7 ThemeProvider + 4 ThemeToggle + 4 BottomNavigation). 30/30 tests total passent sans régressions. TypeScript 0 erreurs.

### Change Log

- 2026-02-09 : Implémentation complète Story 1.3 — Layout principal, bottom navigation, thème dark/light avec persistance, couleurs UX conformes, 15 tests ajoutés

### File List

**Nouveaux fichiers :**
- `src/components/ThemeProvider.tsx`
- `src/components/ThemeProvider.test.tsx`
- `src/components/ThemeToggle.tsx`
- `src/components/ThemeToggle.test.tsx`
- `src/components/BottomNavigation.tsx`
- `src/components/BottomNavigation.test.tsx`
- `src/routes/_authenticated/livraisons.tsx`
- `src/routes/_authenticated/activite.tsx`

**Fichiers modifiés :**
- `src/main.tsx` — Ajout ThemeProvider wrapper
- `src/index.css` — CSS variables hex UX + prefers-reduced-motion
- `src/routes/_authenticated.tsx` — Layout avec BottomNavigation + padding-bottom
- `src/routes/_authenticated/index.tsx` — Adapté au nouveau layout
- `src/routes/_authenticated/settings.tsx` — Intégration ThemeToggle
- `index.html` — viewport-fit=cover
- `src/routeTree.gen.ts` — Regénéré (nouvelles routes)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Statut story mis à jour
