# Story 3.2: Écran pièce, tâches et tap-cycle

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur terrain de posePilot,
Je veux voir toutes les tâches d'une pièce et changer leur statut d'un tap,
Afin que je valide l'avancement en 1 seconde par tâche.

## Acceptance Criteria

1. **Given** l'utilisateur est sur l'écran d'une pièce **When** l'écran s'affiche **Then** toutes les tâches de la pièce sont listées verticalement avec le TapCycleButton pour chacune

2. **Given** une tâche est au statut "pas commencé" (gris) **When** l'utilisateur tape sur le TapCycleButton **Then** le statut passe à "en cours" (orange) avec feedback visuel < 300ms et animation scale

3. **Given** une tâche est au statut "en cours" (orange) **When** l'utilisateur tape à nouveau **Then** le statut passe à "fait" (vert)

4. **Given** une tâche est au statut "fait" (vert) **When** l'utilisateur tape à nouveau **Then** le statut revient à "pas commencé" (gris) — cycle réversible complet

5. **Given** l'utilisateur a modifié des statuts de tâches **When** il consulte l'écran pièce **Then** le compteur affiche "X fait(s), Y en cours" (pas de pourcentage)

6. **Given** l'utilisateur change un statut **When** la mutation est envoyée **Then** l'UI change immédiatement (mutation optimiste), le serveur synchronise en arrière-plan, et en cas d'échec, le statut revient en arrière avec un toast d'erreur

## Tasks / Subtasks

- [x] Task 1 — Créer le composant `TapCycleButton` (AC: #1, #2, #3, #4)
  - [x] 1.1 Créer `src/components/TapCycleButton.tsx` avec cycle 3 états : `not_started → in_progress → done → not_started`
  - [x] 1.2 Cercle 44×44px (zone tactile 48×48px minimum via padding invisible)
  - [x] 1.3 Icônes : cercle vide (gris `#64748B`), demi-cercle / hourglass (orange `#F59E0B`), check (vert `#10B981`)
  - [x] 1.4 Animation transition : `scale(0.95) → scale(1.05) → scale(1.0)` avec changement de couleur
  - [x] 1.5 Feedback haptique : `navigator.vibrate(10)` si disponible, sinon animation scale uniquement
  - [x] 1.6 `prefers-reduced-motion` : pas d'animation scale, changement instantané
  - [x] 1.7 Accessibilité : `role="button"`, `aria-label="Statut : [état actuel]. Taper pour passer à [état suivant]"`, support clavier (Entrée/Espace)
  - [x] 1.8 Props : `status: TaskStatus`, `onCycle: (newStatus: TaskStatus) => void`, `disabled?: boolean`
  - [x] 1.9 Créer `src/components/TapCycleButton.test.tsx` — tests unitaires (cycle, accessibilité, feedback)

- [x] Task 2 — Créer la mutation `useUpdateTaskStatus` (AC: #6)
  - [x] 2.1 Créer `src/lib/mutations/useUpdateTaskStatus.ts`
  - [x] 2.2 Mutation optimiste standard : `onMutate` (update UI immédiat), `onError` (rollback), `onSettled` (invalidation)
  - [x] 2.3 `mutationFn` : `supabase.from('taches').update({ status }).eq('id', tacheId).select().single()`
  - [x] 2.4 Cache key : `['pieces', lotId]` — modifier la tâche dans le tableau `pieces[].taches[]`
  - [x] 2.5 En cas d'échec : rollback + `toast.error('Impossible de mettre à jour le statut')`
  - [x] 2.6 Créer `src/lib/mutations/useUpdateTaskStatus.test.ts`

- [x] Task 3 — Réécrire la page pièce complète (AC: #1, #5)
  - [x] 3.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/$pieceId.tsx`
  - [x] 3.2 Supprimer le placeholder "Détail complet en story 3.2"
  - [x] 3.3 Liste verticale des tâches : chaque ligne = nom de la tâche + `TapCycleButton` à droite
  - [x] 3.4 Compteur en haut sous le nom de la pièce : "X fait(s), Y en cours" — grammaire française correcte
  - [x] 3.5 Conserver le header existant (bouton retour + nom pièce + BreadcrumbNav)
  - [x] 3.6 Conserver les squelettes de chargement existants
  - [x] 3.7 Conserver l'état "pièce introuvable" avec bouton retour

- [x] Task 4 — Intégrer TapCycleButton + mutation dans la page pièce (AC: #2, #3, #4, #6)
  - [x] 4.1 Connecter chaque `TapCycleButton` à `useUpdateTaskStatus` via `onCycle`
  - [x] 4.2 Calculer `nextStatus()` dans le handler : `not_started → in_progress → done → not_started`
  - [x] 4.3 Passer `lotId` à la mutation pour la clé de cache `['pieces', lotId]`
  - [x] 4.4 Afficher toast.error sur échec de mutation

- [x] Task 5 — Tests de la page pièce (AC: #1-6)
  - [x] 5.1 Mettre à jour `$pieceId.test.tsx` : vérifier l'affichage des tâches avec TapCycleButton
  - [x] 5.2 Test tap-cycle : cliquer sur le TapCycleButton change le statut visuellement
  - [x] 5.3 Test compteur : vérifier le format "X fait(s), Y en cours"
  - [x] 5.4 Test état vide : "Aucune tâche"
  - [x] 5.5 Vérifier le skeleton loading et l'état "pièce introuvable"

## Dev Notes

### Contexte architectural

- **TanStack Router file-based routing** : la page pièce existe déjà comme placeholder à `$pieceId.tsx`
- **Pattern de données** : TanStack Query hooks dans les composants (PAS de `loader`/`beforeLoad`)
- **Mutations optimistes** : pattern standard `onMutate/onError/onSettled` (voir `useAddLotTask.ts` comme référence)
- **Supabase direct** : pas d'API REST custom, SDK directement depuis le front-end
- **snake_case** pour les types DB, `camelCase` pour les variables locales

### Queries et mutations existantes à réutiliser

| Hook | Fichier | Usage |
|------|---------|-------|
| `usePieces(lotId)` | `src/lib/queries/usePieces.ts` | Retourne `PieceWithTaches[]` — chaque pièce a `.taches: TacheRow[]` |
| `useAddLotTask()` | `src/lib/mutations/useAddLotTask.ts` | **Référence pattern** — même cache key `['pieces', lotId]`, même structure optimiste |

### Mutation `useUpdateTaskStatus` — Pattern exact

```typescript
// Référence : useAddLotTask.ts pour le pattern cache
// Cache key : ['pieces', lotId]
// onMutate : trouver la pièce contenant la tâche, modifier le status dans le tableau .taches
// onError : restaurer le tableau pieces précédent
// onSettled : invalidateQueries(['pieces', lotId])

useMutation({
  mutationFn: async ({ tacheId, status }: { tacheId: string; status: TaskStatus; lotId: string }) => {
    const { data, error } = await supabase
      .from('taches')
      .update({ status })
      .eq('id', tacheId)
      .select()
      .single()
    if (error) throw error
    return data
  },
  onMutate: async ({ tacheId, status, lotId }) => {
    await queryClient.cancelQueries({ queryKey: ['pieces', lotId] })
    const previous = queryClient.getQueryData<PieceWithTaches[]>(['pieces', lotId])
    queryClient.setQueryData<PieceWithTaches[]>(
      ['pieces', lotId],
      (old) =>
        (old ?? []).map((piece) => ({
          ...piece,
          taches: piece.taches.map((t) =>
            t.id === tacheId ? { ...t, status } : t,
          ),
        })),
    )
    return { previous }
  },
  onError: (_err, { lotId }, context) => {
    queryClient.setQueryData(['pieces', lotId], context?.previous)
    toast.error('Impossible de mettre à jour le statut')
  },
  onSettled: (_data, _err, { lotId }) => {
    queryClient.invalidateQueries({ queryKey: ['pieces', lotId] })
  },
})
```

### Composant TapCycleButton — Spécifications UX exactes

**Cycle :** `not_started` (gris) → `in_progress` (orange) → `done` (vert) → retour `not_started`

**Dimensions :**
- Cercle visuel : 44×44px
- Zone tactile effective : 48×48px minimum (padding invisible autour)
- Utiliser `min-h-12 min-w-12` (48px) comme conteneur avec `flex items-center justify-center`

**Icônes (lucide-react) :**
- `not_started` : `Circle` (cercle vide) en `#64748B`
- `in_progress` : `Clock` ou `Loader` (demi-cercle) en `#F59E0B`
- `done` : `CheckCircle2` (check dans cercle) en `#10B981`

**Animation de transition :**
```css
@keyframes tap-cycle {
  0% { transform: scale(0.95); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1.0); }
}
/* Durée : 200ms ease-out */
/* prefers-reduced-motion : duration 0ms */
```

**Feedback haptique :**
```typescript
if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
  navigator.vibrate(10)
}
```

**Accessibilité :**
```typescript
const statusLabels: Record<TaskStatus, string> = {
  not_started: 'pas commencé',
  in_progress: 'en cours',
  done: 'fait',
}
const nextLabels: Record<TaskStatus, string> = {
  not_started: 'en cours',
  in_progress: 'fait',
  done: 'pas commencé',
}
// aria-label={`Statut : ${statusLabels[status]}. Taper pour passer à ${nextLabels[status]}`}
```

### Calcul du compteur (format français correct)

```typescript
const doneTaches = taches.filter(t => t.status === 'done').length
const enCoursTaches = taches.filter(t => t.status === 'in_progress').length

// Grammaire française :
// "0 fait" (pas "0 faits")
// "1 fait" (pas "1 faits")
// "2 faits"
// "1 en cours"
// "3 en cours" (pas de pluriel sur "en cours")
const parts: string[] = []
if (doneTaches > 0 || enCoursTaches > 0) {
  parts.push(`${doneTaches} fait${doneTaches > 1 ? 's' : ''}`)
  if (enCoursTaches > 0) {
    parts.push(`${enCoursTaches} en cours`)
  }
}
const counter = parts.length > 0 ? parts.join(', ') : 'Aucune tâche commencée'
```

### Page pièce — Structure cible

```
┌─────────────────────────────────┐
│  ← [Retour]   Séjour           │  ← Header existant
├─────────────────────────────────┤
│  Oliviers › Plot A › É2 › ...  │  ← BreadcrumbNav existant
├─────────────────────────────────┤
│  Tâches (6)                     │
│  2 faits, 1 en cours            │  ← Compteur nouveau
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │ Ragréage           [🟢] │    │  ← TapCycleButton
│  ├─────────────────────────┤    │
│  │ Phonique           [🟢] │    │
│  ├─────────────────────────┤    │
│  │ Pose               [🟠] │    │
│  ├─────────────────────────┤    │
│  │ Plinthes           [⚪] │    │
│  ├─────────────────────────┤    │
│  │ Joints             [⚪] │    │
│  ├─────────────────────────┤    │
│  │ Silicone           [⚪] │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

### Fichier pièce existant — Ce qu'il faut garder vs remplacer

**Garder :**
- Header avec bouton retour + titre pièce
- BreadcrumbNav
- Skeleton loading (état isLoading)
- État "pièce introuvable" avec bouton retour
- Route createFileRoute + staticData

**Remplacer :**
- La liste statique de tâches avec dots → liste avec TapCycleButton
- Le texte "Détail complet en story 3.2" → compteur "X fait(s), Y en cours"
- Ajouter le hook `useUpdateTaskStatus`

### Project Structure Notes

- Nouveau composant `TapCycleButton` dans `src/components/` — composant custom posePilot (comme StatusCard)
- Nouvelle mutation `useUpdateTaskStatus` dans `src/lib/mutations/` — pattern optimiste standard
- Modification de `$pieceId.tsx` — même fichier, pas de nouvelle route
- Tests co-localisés à côté des fichiers source

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.2, Epic 3]
- [Source: _bmad-output/planning-artifacts/architecture.md — Mutations optimistes, Communication Patterns, Implementation Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — TapCycleButton specs (§2), RoomScreen specs (§3), Palette sémantique, Feedback haptique]
- [Source: _bmad-output/planning-artifacts/prd.md — FR24 (tâches d'une pièce), FR25 (tap-cycle), FR26 (cycle réversible), FR27 (compteur)]
- [Source: src/lib/mutations/useAddLotTask.ts — Pattern de référence mutation optimiste avec cache ['pieces', lotId]]
- [Source: src/components/StatusCard.tsx — STATUS_COLORS constants]
- [Source: src/types/enums.ts — TaskStatus enum]

### Learnings des stories précédentes (Epic 2 + Story 3.1)

- **Grammaire française** : "0 fait" (pas "0 faits"), "1 pièce" (pas "1 pièces") — appliquer au compteur
- **Toast feedback** : `toast()` pour succès, `toast.error()` pour erreurs (depuis sonner)
- **Loading states** : toujours vérifier `isLoading` avant d'accéder aux données
- **Mock Supabase** : chaînable `from().update().eq().select().single()` chacun retourne mock avec méthode suivante
- **Lint** : erreur préexistante `ThemeProvider.tsx:64` (react-refresh) — ne pas corriger dans cette story
- **BreadcrumbNav** : shallowest-first pour les params (TanStack Router propage les params enfants aux parents)
- **computeStatus()** : helper existant dans `$lotId/index.tsx` — peut servir de référence
- **StatusCardSkeleton** : utilisé pour les loading states des grilles — adapter le même pattern pour la liste de tâches

### Informations techniques récentes

- **TanStack Query v5** : `useMutation` accepte `mutationFn` comme propriété (pas en premier argument)
- **lucide-react** : icônes `Circle`, `Clock`, `CheckCircle2` disponibles — import nommé
- **navigator.vibrate()** : supporté Chrome Android, PAS supporté Safari iOS — fallback visuel seulement
- **CSS `prefers-reduced-motion`** : utiliser `@media (prefers-reduced-motion: reduce)` ou la classe Tailwind `motion-reduce:*`
- **Tailwind v4** : les classes `motion-reduce:` sont disponibles nativement

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Test skeleton fixé : `findByLabelText` (async) au lieu de `getByLabelText` pour attendre le rendu routeur
- Supprimé `NEXT_STATUS` inutilisé dans `$pieceId.tsx` (lint error)
- Mis à jour `navigation-hierarchy.test.tsx` : ajout mock `useUpdateTaskStatus` + remplacement assertion "Détail complet" par vérification TapCycleButtons

### Completion Notes List

- ✅ Task 1 : `TapCycleButton` créé — cycle 3 états, icônes lucide-react, animation tap-cycle CSS, feedback haptique, a11y complète (aria-label, clavier), prefers-reduced-motion via `motion-safe:`. 15 tests unitaires.
- ✅ Task 2 : `useUpdateTaskStatus` — mutation optimiste standard, rollback + toast.error sur erreur, invalidation cache `['pieces', lotId]`. 4 tests unitaires.
- ✅ Task 3 : Page pièce réécrite — placeholder supprimé, compteur "X fait(s), Y en cours", header/skeleton/introuvable conservés.
- ✅ Task 4 : Intégration TapCycleButton + mutation — chaque bouton connecté à `useUpdateTaskStatus.mutate()`, cycle calculé dans TapCycleButton via `NEXT_STATUS`.
- ✅ Task 5 : Tests page pièce — 8 tests (affichage tâches, tap-cycle mutate, compteur, état vide, skeleton, introuvable, absence placeholder).
- 353/353 tests pass (351 original + 2 ajoutés par code review), 0 régression, lint clean.

### Senior Developer Review (AI)

**Reviewer:** Youssef — 2026-02-09
**Model:** Claude Opus 4.6

**Résultat:** Approuvé avec corrections appliquées (5 MEDIUM fixes, 4 LOW notés)

**Issues corrigées :**
- **M1** — Test gap : ajout test "Aucune tâche commencée" (counter quand toutes tâches not_started)
- **M2** — Test gap : ajout test animation `motion-safe:animate-tap-cycle` après clic
- **M3** — Couleurs hardcodées (`#64748B`, `#F59E0B`, `#10B981`) migrées vers tokens CSS thème (`--tap-not-started`, `--tap-in-progress`, `--tap-done`) avec classes Tailwind `text-tap-*`
- **M4** — Skeleton loading mis à jour : dots 10px remplacés par cercles 44px (size-11), ajout skeleton compteur, layout `justify-between` aligné avec le rendu réel
- **M5** — Test skeleton renforcé : vérification des éléments `.animate-pulse` (≥5) et `.size-11.rounded-full` (3 cercles)

**Issues LOW notées (non corrigées) :**
- L1 — `role="button"` redondant sur `<button>` natif
- L2 — `onKeyDown` Enter/Space redondant (natif sur `<button>`)
- L3 — Mock `navigator.vibrate` pas nettoyé dans test
- L4 — Double mécanisme `prefers-reduced-motion` (CSS global + Tailwind `motion-safe:`)

**353/353 tests, lint clean, 0 régression.**

### File List

- `src/components/TapCycleButton.tsx` (nouveau)
- `src/components/TapCycleButton.test.tsx` (nouveau)
- `src/lib/mutations/useUpdateTaskStatus.ts` (nouveau)
- `src/lib/mutations/useUpdateTaskStatus.test.ts` (nouveau)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/$pieceId.tsx` (modifié)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/$pieceId.test.tsx` (modifié)
- `src/__tests__/navigation-hierarchy.test.tsx` (modifié — ajout mock useUpdateTaskStatus, mise à jour assertion)
- `src/index.css` (modifié — ajout animation tap-cycle + theme token)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modifié)
- `_bmad-output/implementation-artifacts/3-2-ecran-piece-taches-et-tap-cycle.md` (modifié)
