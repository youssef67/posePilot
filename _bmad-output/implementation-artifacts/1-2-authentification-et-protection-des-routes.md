# Story 1.2: Authentification et protection des routes

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux me connecter avec mes identifiants,
Afin que seuls les utilisateurs autorisés accèdent à l'application.

## Acceptance Criteria

1. **Given** l'utilisateur n'est pas connecté
   **When** il accède à n'importe quelle page de l'app
   **Then** il est redirigé vers la page de connexion

2. **Given** l'utilisateur est sur la page de connexion
   **When** il saisit un email et mot de passe valides et soumet
   **Then** il est authentifié et redirigé vers l'écran d'accueil

3. **Given** l'utilisateur saisit des identifiants invalides
   **When** il soumet le formulaire
   **Then** un message d'erreur clair s'affiche en français

4. **Given** l'utilisateur est connecté
   **When** sa session expire après inactivité prolongée
   **Then** il est redirigé vers la page de connexion

5. **Given** le projet Supabase
   **When** les RLS policies sont configurées
   **Then** seuls les utilisateurs authentifiés peuvent accéder aux données

## Tasks / Subtasks

- [x] Task 1 — Setup Supabase Auth et migrations initiales (AC: #5)
  - [x] 1.1 Initialiser le dossier `supabase/` avec `supabase init` (crée `config.toml`)
  - [x] 1.2 Créer la migration `001_enums.sql` avec les enums PostgreSQL : `chantier_type` ('complet', 'leger'), `task_status` ('not_started', 'in_progress', 'done'), `delivery_status` ('commande', 'prevu', 'livre')
  - [x] 1.3 Créer la migration `002_rls_base.sql` : activer RLS sur toutes les tables futures, créer la policy de base `authenticated = accès total` réutilisable
  - [x] 1.4 Mettre à jour `src/types/enums.ts` avec les types TypeScript miroir des enums PostgreSQL
  - [x] 1.5 Mettre à jour `src/types/database.ts` avec les types générés par Supabase (au minimum le type Database de base)

- [x] Task 2 — Contexte d'authentification et gestion de session (AC: #1, #4)
  - [x] 2.1 Créer `src/lib/auth.ts` : hook `useAuth()` qui expose `{ session, user, isLoading, isAuthenticated, signIn, signOut }`
  - [x] 2.2 Implémenter `onAuthStateChange` dans le hook pour écouter INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED
  - [x] 2.3 Créer `src/components/AuthProvider.tsx` : React Context provider qui wrappe l'app et fournit le contexte auth
  - [x] 2.4 Intégrer `AuthProvider` dans `src/main.tsx` (à l'intérieur de QueryClientProvider, à l'extérieur de RouterProvider)
  - [x] 2.5 Passer le contexte auth au router via `routerContext` pour que `beforeLoad` puisse y accéder

- [x] Task 3 — Protection des routes avec TanStack Router (AC: #1, #4)
  - [x] 3.1 Créer `src/routes/_authenticated.tsx` : layout route avec `beforeLoad` qui vérifie `context.auth.isAuthenticated`, sinon `throw redirect({ to: '/login', search: { redirect: location.href } })`
  - [x] 3.2 Déplacer `src/routes/index.tsx` vers `src/routes/_authenticated/index.tsx` (l'écran d'accueil est protégé)
  - [x] 3.3 Mettre à jour `src/routes/__root.tsx` pour injecter le contexte auth dans le router context
  - [x] 3.4 Vérifier que les routes futures sous `_authenticated/` héritent de la protection automatiquement

- [x] Task 4 — Page de connexion (AC: #2, #3)
  - [x] 4.1 Créer `src/routes/login.tsx` avec le formulaire de connexion (email + mot de passe)
  - [x] 4.2 Installer et utiliser les composants shadcn/ui nécessaires : `button`, `input`, `card`, `label`
  - [x] 4.3 Implémenter `supabase.auth.signInWithPassword({ email, password })` au submit
  - [x] 4.4 Gérer les erreurs : afficher un message en français sous le formulaire (ex: "Email ou mot de passe incorrect")
  - [x] 4.5 Après connexion réussie : rediriger vers le `search.redirect` si présent, sinon vers `/`
  - [x] 4.6 Ajouter un état de chargement sur le bouton pendant la requête (disabled + spinner ou texte "Connexion...")
  - [x] 4.7 Appliquer le style dark-first conforme au thème posePilot : fond #111827, carte centrée #1E293B, logo/titre "posePilot" au-dessus

- [x] Task 5 — Déconnexion (AC: #4)
  - [x] 5.1 Ajouter une fonction `signOut` dans le hook `useAuth()` qui appelle `supabase.auth.signOut()`
  - [x] 5.2 Préparer un bouton de déconnexion dans la page Réglages (placeholder pour la story 1.3)
  - [x] 5.3 Vérifier que la déconnexion redirige bien vers `/login`

- [x] Task 6 — Tests (AC: #1, #2, #3)
  - [x] 6.1 Test unitaire pour `useAuth` : vérifier les états initial, authenticated, unauthenticated
  - [x] 6.2 Test composant pour `login.tsx` : vérifier le rendu du formulaire, l'affichage d'erreur, l'état de chargement
  - [x] 6.3 Test d'intégration : vérifier la redirection vers `/login` quand non authentifié

## Dev Notes

### Architecture & Patterns obligatoires

- **Supabase Auth email/password** — pas de OAuth, pas de magic link, juste email/password simple pour 2-3 comptes [Source: architecture.md#Authentication & Security]
- **RLS policy simple** : `authenticated = accès total` — pas de multi-tenancy, pas de policies par utilisateur [Source: architecture.md#Authentication & Security]
- **JWT géré par Supabase** — refresh automatique, expiration configurable [Source: architecture.md#Authentication & Security]
- **Supabase Client SDK direct** depuis le front-end — PAS d'API REST custom, PAS d'Edge Functions [Source: architecture.md#API & Communication Patterns]
- **TanStack Router `_authenticated` layout** — pattern recommandé pour la protection de routes avec `beforeLoad` + `redirect`
- **Pas de `useEffect` pour fetch de données** — utiliser le hook auth dédié qui encapsule `onAuthStateChange` [Source: architecture.md#Anti-patterns à éviter]
- **Pas de store global (Zustand/Redux)** — le contexte auth utilise React Context car c'est de l'état local UI, pas de l'état serveur [Source: architecture.md#State Boundary]

### Conventions de nommage à respecter

- **Fichiers composants** : `PascalCase.tsx` — `AuthProvider.tsx`
- **Fichiers non-composants** : `camelCase.ts` — `auth.ts`
- **Hook** : `useAuth` (pas `useAuthentication`)
- **Route** : `login.tsx`, `_authenticated.tsx`
- **Types** : `PascalCase` — `Session`, `User`
- **Enums DB** : `snake_case` — `chantier_type`, `task_status`, `delivery_status`
- **Messages utilisateur** : en français [Source: architecture.md#Enforcement Guidelines]

### Stack technique — Versions exactes (février 2026)

| Bibliothèque | Version | Notes |
|---|---|---|
| **@supabase/supabase-js** | 2.95.3 | `signInWithPassword`, `onAuthStateChange`, `getSession` |
| **@tanstack/react-router** | 1.158.x | File-based routing, `beforeLoad`, `redirect`, router context |
| **shadcn/ui** | CLI 3.8.4 | Composants : `button`, `input`, `card`, `label` |
| **React** | 19.2.x | `useContext`, `useState`, `useEffect` pour le provider auth |

### Supabase Auth — Pattern d'implémentation

```typescript
// src/lib/auth.ts — Hook useAuth
// 1. getSession() au mount pour récupérer la session existante
// 2. onAuthStateChange() pour écouter les changements en temps réel
// 3. Expose: { session, user, isLoading, isAuthenticated, signIn, signOut }

// Événements onAuthStateChange à gérer :
// - INITIAL_SESSION : session initiale chargée
// - SIGNED_IN : utilisateur connecté
// - SIGNED_OUT : utilisateur déconnecté → redirect /login
// - TOKEN_REFRESHED : token renouvelé automatiquement
```

### TanStack Router — Pattern de protection des routes

```typescript
// src/routes/_authenticated.tsx
// Layout route qui protège toutes les routes enfants
// beforeLoad vérifie context.auth.isAuthenticated
// Si non authentifié : throw redirect({ to: '/login', search: { redirect: location.href } })

// src/routes/__root.tsx
// Doit passer le contexte auth au router via createRootRouteWithContext
// Le router reçoit { auth: { isAuthenticated, user, session } }
```

### RLS — Politique de base

```sql
-- Policy simple : tout utilisateur authentifié a accès total
-- Appliquée à chaque table au moment de sa création
CREATE POLICY "Authenticated users have full access"
ON {table_name}
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
```

### Page de connexion — Spécifications UX

- **Layout** : carte centrée verticalement et horizontalement sur fond `#111827`
- **Carte** : fond `#1E293B`, bordure `#334155`, arrondi `8px`, padding `24px`
- **Logo/Titre** : "posePilot" en Poppins SemiBold 24px au-dessus du formulaire
- **Champs** : fond `#0F172A`, texte blanc, placeholder gris, arrondi `6px` [Source: ux-design-specification.md#Design System Components]
- **Zones tactiles** : hauteur minimum 48px pour les inputs, bouton 56px [Source: ux-design-specification.md#Spacing & Layout Foundation]
- **Bouton** : variante Primary bleu foncé (#3B82F6), pleine largeur, texte "Se connecter"
- **Erreurs** : message rouge (#EF4444) sous le formulaire, texte simple en français
- **Max 3 champs visibles** (email + mot de passe = 2, parfait) [Source: ux-design-specification.md#Formulaires]
- **Validation au submit uniquement** — pas de validation temps réel [Source: ux-design-specification.md]
- **Pas d'option "Créer un compte"** — les comptes sont créés manuellement dans Supabase Dashboard (2-3 utilisateurs)
- **Pas de "Mot de passe oublié"** — scope minimal, Youssef peut reset via Supabase Dashboard

### Supabase — Configuration des migrations

Le dossier `supabase/` n'existe pas encore (confirmé par la story 1-1 : "Le dossier supabase/ avec les migrations sera créé dans la story 1.2"). Structure attendue :

```
supabase/
├── config.toml          # Config Supabase CLI
├── seed.sql             # Données de seed (optionnel)
└── migrations/
    ├── 001_enums.sql    # Enums PostgreSQL
    └── 002_rls_base.sql # RLS de base
```

**Note** : Les tables métier (chantiers, lots, etc.) seront créées dans les stories suivantes. Cette story ne crée que les enums et la base RLS. Les enums sont créés maintenant car ils sont référencés par l'architecture et doivent exister avant les tables.

### Gestion de la session expirée

- Supabase gère automatiquement le refresh JWT
- Si le refresh échoue (inactivité prolongée), `onAuthStateChange` émet `SIGNED_OUT`
- Le hook `useAuth` met à jour `isAuthenticated = false`
- Le `beforeLoad` du layout `_authenticated` détecte le changement et redirige vers `/login`
- Pas besoin de timer custom pour l'expiration

### Project Structure Notes

- **Nouveaux fichiers** à créer :
  - `supabase/config.toml` — Config Supabase CLI
  - `supabase/migrations/001_enums.sql` — Enums PostgreSQL
  - `supabase/migrations/002_rls_base.sql` — Policies RLS de base
  - `src/lib/auth.ts` — Hook useAuth + contexte
  - `src/components/AuthProvider.tsx` — Provider React Context
  - `src/routes/login.tsx` — Page de connexion
  - `src/routes/_authenticated.tsx` — Layout route protégé
  - `src/routes/_authenticated/index.tsx` — Page d'accueil (déplacée depuis routes/index.tsx)
- **Fichiers modifiés** :
  - `src/main.tsx` — Ajout AuthProvider
  - `src/routes/__root.tsx` — Ajout router context avec auth
  - `src/types/enums.ts` — Types miroir des enums PostgreSQL
  - `src/types/database.ts` — Types Supabase de base
- **Alignement architecture** : structure conforme à `architecture.md#Complete Project Directory Structure`
- **Pas de barrel files** — imports directs [Source: architecture.md#Structure Patterns]
- Le test `src/routes/index.test.tsx` devra être déplacé/adapté pour le nouveau chemin `_authenticated/index.tsx`

### References

- [Source: architecture.md#Authentication & Security] — Supabase Auth email/password, RLS, JWT
- [Source: architecture.md#API & Communication Patterns] — SDK direct, pas d'API custom
- [Source: architecture.md#Frontend Architecture] — Structure par domaine
- [Source: architecture.md#Implementation Patterns] — Naming, anti-patterns
- [Source: architecture.md#Complete Project Directory Structure] — Arborescence fichiers
- [Source: architecture.md#State Boundary] — React Context pour état local UI
- [Source: epics.md#Story 1.2] — User story et acceptance criteria
- [Source: prd.md#FR65] — Authentification simple 2-3 comptes
- [Source: prd.md#NFR13-NFR16] — Auth requise, HTTPS, expiration session, comptes individuels
- [Source: ux-design-specification.md#Design System Components] — Input, Button, Card specs
- [Source: ux-design-specification.md#Spacing & Layout Foundation] — Zones tactiles 48-56px
- [Source: ux-design-specification.md#Color System] — Thème sombre par défaut
- [Source: ux-design-specification.md#Typography System] — Poppins, échelle typographique
- [Source: 1-1-initialisation-du-projet-et-deploiement.md] — Structure actuelle, learnings story précédente
- [Source: TanStack Router docs — authenticated-routes] — Pattern _authenticated layout + beforeLoad + redirect
- [Source: Supabase docs — Auth] — signInWithPassword, onAuthStateChange, getSession, signOut

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Task 1: Supabase init + migrations 001_enums.sql et 002_rls_base.sql + types TS miroir (enums.ts, database.ts)
- Task 2: Hook useAuth() avec AuthContext + AuthProvider avec onAuthStateChange (INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED) + intégration main.tsx avec router context
- Task 3: Route _authenticated avec beforeLoad + redirect vers /login + déplacement index.tsx sous _authenticated/ + createRootRouteWithContext dans __root.tsx
- Task 4: Page login complète — formulaire email/password, shadcn/ui (button, input, card, label), erreurs en français, état de chargement, style dark-first posePilot, redirection post-login
- Task 5: signOut dans useAuth + page Réglages placeholder avec bouton déconnexion + redirection vers /login
- Task 6: 15 tests — auth.test.ts (4 tests useAuth), login.test.tsx (5 tests formulaire/erreur/loading), index.test.tsx (2 tests home/redirect), + tests existants (utils, queryClient)
- Dépendance ajoutée: @testing-library/user-event (dev)

### Senior Developer Review (AI)

**Reviewer:** Youssef — 2026-02-06
**Issues Found:** 3 High, 3 Medium, 2 Low
**Issues Fixed:** 6 (3 High + 3 Medium)
**Outcome:** Approved after fixes

**Corrections appliquées :**
1. **[H1] `002_rls_base.sql` vide** — Ajout d'une fonction SQL `apply_rls_policy(target_table)` réutilisable pour appliquer RLS + policy standard sur chaque table future
2. **[H2] Pas de redirect automatique à l'expiration de session** — Ajout de `router.invalidate()` via `useEffect` dans `InnerApp` (main.tsx) quand `isAuthenticated` change, force la réévaluation des guards `beforeLoad`
3. **[H3] Page login accessible par utilisateur connecté** — Ajout `beforeLoad` dans `login.tsx` qui redirige vers `/` si déjà authentifié
4. **[M1] Warnings `act(...)` dans les tests login** — Wrapping de `resolveSignIn` dans `act()` dans `login.test.tsx`
5. **[M2] Race condition navigate post-login** — Résolu par H2 (invalidation router) + H3 (guard login)
6. **[M3] Double navigation au signOut** — Résolu par H2 (invalidation router gère la redirection)

**Issues LOW non corrigées (cosmétiques) :**
- [L1] Police Poppins non importée pour le titre login
- [L2] Perte d'info AuthError wrappée dans Error générique

### Change Log

- 2026-02-06: Code review — 6 issues corrigées (RLS function, router invalidation, login guard, test act warnings)
- 2026-02-06: Story 1-2 implémentation complète — authentification Supabase, protection routes, page login, déconnexion, 15 tests passants

### File List

**Nouveaux fichiers:**
- supabase/config.toml
- supabase/migrations/001_enums.sql
- supabase/migrations/002_rls_base.sql
- src/lib/auth.ts
- src/lib/auth.test.ts
- src/components/AuthProvider.tsx
- src/components/ui/button.tsx
- src/components/ui/input.tsx
- src/components/ui/card.tsx
- src/components/ui/label.tsx
- src/routes/login.tsx
- src/routes/login.test.tsx
- src/routes/_authenticated.tsx
- src/routes/_authenticated/index.tsx
- src/routes/_authenticated/settings.tsx

**Fichiers modifiés:**
- src/main.tsx
- src/routes/__root.tsx
- src/types/enums.ts
- src/types/database.ts
- src/routeTree.gen.ts (auto-généré)
- src/routes/index.test.tsx
- package.json (ajout @testing-library/user-event)
- package-lock.json

**Fichiers supprimés:**
- src/routes/index.tsx (déplacé vers _authenticated/index.tsx)
- src/components/ui/.gitkeep (remplacé par composants shadcn)
