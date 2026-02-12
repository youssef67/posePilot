# Story 4.3: Partage photo contextualisé

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux partager une photo vers le maître d'ouvrage avec le contexte auto-renseigné,
Afin que la communication avec le promoteur soit efficace et tracée.

## Acceptance Criteria

1. **Given** l'utilisateur consulte une note avec photo **When** il tape sur "Partager" **Then** le système prépare un partage avec la photo et un texte contextuel pré-rempli (ex: "Chantier Les Oliviers — Plot A — Lot 203 — SDB : support fissuré")

2. **Given** le partage est préparé **When** l'utilisateur confirme **Then** la feuille de partage native du système s'ouvre (Web Share API) permettant d'envoyer via WhatsApp, email, etc.

3. **Given** l'appareil ne supporte pas Web Share API **When** l'utilisateur tape "Partager" **Then** la photo est téléchargée et le texte contextuel est copié dans le presse-papiers avec un toast de confirmation

## Tasks / Subtasks

- [x] Task 1 — Utilitaire `useShareContext` : résolution du contexte hiérarchique (AC: #1)
  - [x] 1.1 Créer `src/lib/utils/useShareContext.ts`
  - [x] 1.2 Hook utilisant `useMatches()` + `useQueryClient()` (même pattern que BreadcrumbNav)
  - [x] 1.3 Résoudre la hiérarchie : chantier.nom → plot.nom → "Lot {lot.code}" → piece.nom
  - [x] 1.4 Retourner une chaîne formatée : `"Chantier X — Plot Y — Lot Z — Pièce W"` (niveaux présents seulement)
  - [x] 1.5 Créer `src/lib/utils/useShareContext.test.ts`

- [x] Task 2 — Utilitaire `sharePhoto` : Web Share API + fallback (AC: #2, #3)
  - [x] 2.1 Créer `src/lib/utils/sharePhoto.ts`
  - [x] 2.2 Signature : `sharePhoto({ photoUrl, shareText }: SharePhotoParams): Promise<'shared' | 'downloaded' | 'cancelled'>`
  - [x] 2.3 Path principal — Web Share API avec fichier :
    - Fetch l'image comme blob depuis `photoUrl` (Supabase Storage URL publique)
    - Créer un `File` depuis le blob : `new File([blob], 'photo.jpg', { type: 'image/jpeg' })`
    - Vérifier `navigator.canShare({ files: [file] })` avant d'appeler `share()`
    - `navigator.share({ files: [file], text: shareText })`
    - Gérer `AbortError` (utilisateur annule) → retourner `'cancelled'`
  - [x] 2.4 Fallback — Téléchargement + presse-papiers :
    - Si `canShare` ne supporte pas les fichiers OU `navigator.share` n'existe pas
    - Télécharger la photo : créer un `<a href={blobUrl} download="photo.jpg">` invisible, click(), cleanup
    - Copier le texte contextuel dans le presse-papiers via `navigator.clipboard.writeText(shareText)`
    - Retourner `'downloaded'`
  - [x] 2.5 Créer `src/lib/utils/sharePhoto.test.ts` — mocker `navigator.share`, `navigator.canShare`, `navigator.clipboard`, `fetch`, `URL.createObjectURL`

- [x] Task 3 — Modifier `NotesList` : bouton Partager sur les notes avec photo (AC: #1, #2, #3)
  - [x] 3.1 Modifier `src/components/NotesList.tsx`
  - [x] 3.2 Pour chaque note avec `photo_url` non null : ajouter un bouton icône `Share2` (lucide-react) à droite de la ligne métadonnées (auteur · date)
  - [x] 3.3 Style : `ghost` button, taille 32px, icône `Share2` taille 16px, couleur `muted-foreground`
  - [x] 3.4 `onClick` : appeler `sharePhoto({ photoUrl: note.photo_url, shareText })` où `shareText` = `contextString + " : " + note.content`
  - [x] 3.5 Utiliser `useShareContext()` pour obtenir le `contextString`
  - [x] 3.6 Toast feedback :
    - Si `'shared'` → `toast("Photo partagée")`
    - Si `'downloaded'` → `toast("Photo téléchargée — texte copié dans le presse-papiers")`
    - Si `'cancelled'` → pas de toast (l'utilisateur a annulé volontairement)
  - [x] 3.7 Mettre à jour `src/components/NotesList.test.tsx` — tests bouton partage visible/caché, appel sharePhoto

- [x] Task 4 — Modifier `PhotoPreview` : bouton Partager en plein écran (AC: #1)
  - [x] 4.1 Modifier `src/components/PhotoPreview.tsx`
  - [x] 4.2 Ajouter prop optionnelle `onShare?: () => void`
  - [x] 4.3 Dans le Dialog plein écran : ajouter un bouton `Share2` en haut à droite (position absolute, bg blanc/noir semi-transparent, z-50)
  - [x] 4.4 Le bouton n'apparaît que si `onShare` est fourni
  - [x] 4.5 `onClick` → appelle `onShare()`
  - [x] 4.6 Mettre à jour `src/components/PhotoPreview.test.tsx` — test bouton share visible quand onShare fourni

- [x] Task 5 — Tests de bout en bout et régression (AC: #1-3)
  - [x] 5.1 Lancer `npm run test` — tous les tests existants (525+) + nouveaux passent
  - [x] 5.2 Lancer `npm run lint` — 0 nouvelles erreurs (ThemeProvider.tsx:64 pré-existante tolérée)
  - [x] 5.3 Lancer `npm run build` — build propre (erreurs TS pré-existantes dans variantes.$varianteId.tsx et nouveau.tsx — non liées)

## Dev Notes

### Flow principal — Partage photo contextualisé

```
Utilisateur sur écran lot ou pièce
  → Voit une note avec photo dans NotesList
  → Tape le bouton "Partager" (icône Share2)
        ↓
  sharePhoto() est appelé avec :
    - photoUrl : URL publique Supabase Storage
    - shareText : "Chantier Les Oliviers — Plot A — Lot 203 — SDB : support fissuré"
        ↓
  ┌─ Web Share API supporté ? ──────────────────────┐
  │  OUI                                             │
  │  → fetch(photoUrl) → blob                        │
  │  → new File([blob], 'photo.jpg', { type })       │
  │  → navigator.canShare({ files: [file] }) ?       │
  │    OUI → navigator.share({ files, text })        │
  │           → Feuille de partage native (WhatsApp,  │
  │             email, Messages, etc.)                │
  │    NON → Fallback ci-dessous                     │
  │                                                   │
  │  NON (ou canShare échoue)                        │
  │  → Télécharger la photo (<a download>)           │
  │  → Copier le texte dans le presse-papiers        │
  │  → Toast : "Photo téléchargée — texte copié"     │
  └───────────────────────────────────────────────────┘
```

### Construction du texte contextuel — `useShareContext()`

Le hook `useShareContext()` réutilise **exactement le même pattern** que `BreadcrumbNav.tsx` :

```typescript
// src/lib/utils/useShareContext.ts
import { useMatches } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'

export function useShareContext(): string {
  const matches = useMatches()
  const queryClient = useQueryClient()

  // Résoudre les params de la route (shallowest-first)
  // Même logique que BreadcrumbNav : chantierId → plotId → etageId → lotId → pieceId
  // Construire la chaîne : "Chantier X — Plot Y — Lot Z — Pièce W"
  // Niveaux présents seulement (sur écran lot : pas de pièce)
}
```

**Pattern de résolution des noms** (identique à BreadcrumbNav) :
- `queryClient.getQueryData(['chantiers', chantierId])` → `chantier.nom`
- `queryClient.getQueryData(['plots', chantierId])` → trouver le plot par ID → `plot.nom`
- `queryClient.getQueryData(['etages', plotId])` → trouver l'étage par ID → `etage.nom`
- `queryClient.getQueryData(['lots', plotId])` → trouver le lot par ID → `"Lot " + lot.code`
- `queryClient.getQueryData(['pieces', lotId])` → trouver la pièce par ID → `piece.nom`

**Important — TanStack Router Gotcha** : `match.params` à TOUT niveau contient TOUS les params du full URL (child params propagated to parents). Résoudre shallowest-first.

### Web Share API — Détails techniques

**Support navigateur (cibles posePilot)** :
| Navigateur | `navigator.share()` | `share({ files })` | Notes |
|---|---|---|---|
| **iOS Safari 15+** | ✅ | ✅ | Cible principale (Bruno sur iPhone en chantier) |
| **Chrome Android 75+** | ✅ | ✅ | Cible secondaire |
| **Chrome Desktop 128+** | ✅ | ✅ | Youssef au bureau |
| **Firefox Desktop** | ❌ | ❌ | ~7% desktop, fallback nécessaire |

**Contraintes** :
- `navigator.share()` DOIT être appelé dans un handler d'événement utilisateur (tap/click) — sinon erreur `NotAllowedError`
- `navigator.canShare()` peut être appelé à tout moment (pas besoin de geste)
- HTTPS requis — déjà satisfait (PWA)
- Les types TypeScript sont inclus dans `lib.dom.d.ts` (`ShareData`, `Navigator.share`, `Navigator.canShare`) — aucun `@types/*` à installer

**Pattern `sharePhoto` recommandé** :

```typescript
// src/lib/utils/sharePhoto.ts

interface SharePhotoParams {
  photoUrl: string
  shareText: string
}

type ShareResult = 'shared' | 'downloaded' | 'cancelled'

export async function sharePhoto({ photoUrl, shareText }: SharePhotoParams): Promise<ShareResult> {
  // 1. Essayer Web Share API avec fichier
  if (navigator.share) {
    try {
      const response = await fetch(photoUrl)
      const blob = await response.blob()
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText })
        return 'shared'
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return 'cancelled'
      }
      // Fallback ci-dessous
    }
  }

  // 2. Fallback : télécharger + copier texte
  // Télécharger la photo
  const response = await fetch(photoUrl)
  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = 'photo.jpg'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)

  // Copier le texte dans le presse-papiers
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(shareText)
  }

  return 'downloaded'
}
```

### Bouton Partager dans NotesList

```
┌─────────────────────────────────────┐
│ 🔴 Fissure au plafond SDB          │
│    support fissuré                   │
│    ┌──────┐                          │
│    │ 📷   │  ← tap pour plein écran │
│    └──────┘                          │
│    bruno · il y a 2h · Bloquant  [↗]│  ← bouton Share2 (nouveau)
├─────────────────────────────────────┤
│    Joints vérifiés, RAS             │  ← pas de photo → pas de bouton
│    youssef · hier                    │
└─────────────────────────────────────┘
```

- Le bouton `Share2` n'apparaît **que** sur les notes ayant un `photo_url`
- Positionné à droite de la ligne métadonnées (auteur · date · badges)
- Style : `ghost` button, compact, icône `Share2` (16px) en `muted-foreground`
- Sur mobile : zone tactile minimum 44px (padding supplémentaire si nécessaire)

### Bouton Partager dans PhotoPreview (plein écran)

```
┌─────────────────────────────────────┐
│                              [↗] [×]│  ← Share + Close en haut à droite
│                                     │
│                                     │
│           [  📷 photo  ]            │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

- Bouton `Share2` en haut à droite du Dialog plein écran, à côté du bouton fermer
- `bg-black/50` avec `text-white` pour contraste sur fond noir
- Apparaît **seulement** si `onShare` prop est fourni
- `onShare` est passé depuis NotesList → PhotoPreview

### Interaction NotesList ↔ PhotoPreview ↔ sharePhoto

```typescript
// Dans NotesList.tsx — pour chaque note avec photo :
const contextString = useShareContext()

const handleShare = async (note: Note) => {
  const shareText = contextString + ' : ' + note.content
  const result = await sharePhoto({ photoUrl: note.photo_url!, shareText })

  if (result === 'shared') toast('Photo partagée')
  if (result === 'downloaded') toast('Photo téléchargée — texte copié dans le presse-papiers')
  // 'cancelled' → pas de toast
}

// Render :
<PhotoPreview
  url={note.photo_url}
  onShare={() => handleShare(note)}  // ← nouveau prop
/>
// + bouton Share2 séparé dans la note card
```

### Gestion des erreurs

- **Fetch échoue** (photo inaccessible, réseau coupé) : `try/catch` autour du fetch, toast `"Erreur lors du partage de la photo"` via Sonner
- **Clipboard non disponible** (HTTP, iframe sandboxé) : pas critique, le téléchargement de la photo est le comportement principal du fallback
- **AbortError** : l'utilisateur a annulé la feuille de partage — comportement normal, pas de toast

### Tests — Stratégie de mock

Les tests jsdom ne supportent pas `navigator.share`, `navigator.canShare`, `navigator.clipboard`, ni `fetch` pour les blobs. Mocker tout :

```typescript
// Mocks nécessaires dans les tests :
const mockShare = vi.fn()
const mockCanShare = vi.fn()
const mockClipboardWriteText = vi.fn()

Object.defineProperty(navigator, 'share', { value: mockShare, configurable: true })
Object.defineProperty(navigator, 'canShare', { value: mockCanShare, configurable: true })
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: mockClipboardWriteText },
  configurable: true,
})

// Mock fetch pour retourner un blob :
global.fetch = vi.fn().mockResolvedValue({
  blob: () => Promise.resolve(new Blob(['fake-image'], { type: 'image/jpeg' })),
})

// Mock URL.createObjectURL / revokeObjectURL :
URL.createObjectURL = vi.fn(() => 'blob:fake-url')
URL.revokeObjectURL = vi.fn()
```

**Cas de test `sharePhoto`** :
1. Web Share API supporté + canShare files → appelle `navigator.share({ files, text })` → retourne `'shared'`
2. Utilisateur annule (AbortError) → retourne `'cancelled'`
3. Web Share API non supporté → télécharge photo + copie texte → retourne `'downloaded'`
4. Web Share API supporté mais canShare files false → fallback téléchargement
5. Fetch échoue → lance une erreur (gérée par le composant appelant)

**Cas de test `useShareContext`** :
1. Sur écran lot → retourne `"Chantier X — Plot Y — Lot Z"`
2. Sur écran pièce → retourne `"Chantier X — Plot Y — Lot Z — Pièce W"`
3. Cache vide → retourne chaîne partielle ou vide

**Cas de test NotesList** :
1. Note avec photo → bouton Share2 visible
2. Note sans photo → pas de bouton Share2
3. Tap sur Share2 → appelle sharePhoto avec bon contexte
4. Résultat 'shared' → toast "Photo partagée"
5. Résultat 'downloaded' → toast avec message fallback

### Aucune migration SQL nécessaire

Cette story est **front-end pure**. Pas de modification de base de données, pas de nouveau bucket Storage, pas de nouvelle table. Toutes les données nécessaires existent déjà :
- `notes.photo_url` (Story 4.2)
- `notes.content` (Story 4.1)
- Hiérarchie chantier/plot/étage/lot/pièce (Epics 1-3)

### Prérequis et dépendances

- **Aucune dépendance npm externe à ajouter** — Web Share API, Clipboard API, et fetch sont natifs
- **lucide-react** : Déjà installé — icône `Share2` (pas `Share` qui est le share iOS, `Share2` est le share Android/universel)
- **Sonner** : Déjà installé — toasts de feedback
- **Tous les composants modifiés** existent déjà (PhotoPreview, NotesList)

### Risques et points d'attention

1. **CORS sur fetch photo** : Les URLs Supabase Storage publiques sont accessibles en CORS (bucket `note-photos` public = true). Pas de problème attendu pour le fetch blob. Mais vérifier que le serveur Supabase retourne les headers `Access-Control-Allow-Origin: *`.
2. **`navigator.share` en PWA standalone iOS** : Fonctionne correctement depuis iOS 15+. Pas de bug connu en mode standalone.
3. **Taille des fichiers partagés** : Les photos sont déjà compressées à ~200-500 KB (Story 4.2, `maxSizeMB: 1`). Pas de problème de taille pour le partage.
4. **Double fetch** : Le blob est fetch une seule fois dans `sharePhoto()`. Si le fallback est nécessaire, le même blob est réutilisé. Éviter de fetcher deux fois.
5. **Tests jsdom** : `navigator.share` et `navigator.clipboard` n'existent pas en jsdom. Mocker avec `Object.defineProperty` + `configurable: true` pour cleanup.
6. **User gesture requirement** : `navigator.share()` doit être appelé dans un handler click synchrone. Le `async` est ok tant qu'il est dans la chaîne de l'événement tap.
7. **Firefox Desktop** : ~7% des utilisateurs desktop. Le fallback (téléchargement + clipboard) est fonctionnel et suffisant pour Youssef au bureau.

### Learnings des stories précédentes (relevants)

- **FAB menu** : Story 4.2 a refactoré le FAB en menu (Note / Photo). Le bouton Partager est **dans la note**, pas dans le FAB. Pas d'impact sur le FAB.
- **PhotoPreview Dialog** : Story 4.2 a créé le Dialog plein écran avec `DialogTitle` sr-only pour l'accessibilité. Ajouter le bouton Share à côté du bouton fermer existant.
- **BreadcrumbNav pattern** : Résolution des noms via `useMatches()` + `queryClient.getQueryData()`. Pattern à copier pour `useShareContext()`.
- **TanStack Router Gotcha** : `match.params` à ANY level contient ALL params du full URL. Résoudre shallowest-first.
- **`Relationships: []`** dans `database.ts` : obligatoire pour l'inférence de types (pas d'impact ici, pas de changement DB).
- **Sonner** : utiliser `useTheme` custom du projet, pas `next-themes`.
- **Erreur lint ThemeProvider.tsx:64** : pré-existante, ne pas corriger.
- **Pre-existing test failures** : 5 pwa-html.test.ts, 5 pwa-config.test.ts, 6 hasPointerCapture jsdom issue — ne pas s'en inquiéter.
- **URL.createObjectURL cleanup** : Toujours appeler `URL.revokeObjectURL()` pour éviter les memory leaks (Story 4.2 learning).

### Project Structure Notes

- **Nouveaux fichiers** dans `src/lib/utils/` : `useShareContext.ts`, `sharePhoto.ts` + tests
- **Fichiers modifiés** : `NotesList.tsx`, `PhotoPreview.tsx` + tests
- Aucune nouvelle route, aucun changement au `routeTree.gen.ts`
- Aucune migration SQL, aucun changement à `database.ts`
- Story front-end pure — la plus légère de l'Epic 4

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 4.3, Epic 4]
- [Source: _bmad-output/planning-artifacts/prd.md — FR32 (partage photo contextualisé), NFR7, NFR12]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Architecture (Storage buckets, compression), PWA standalone]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Photo intégrée pattern, contexte auto-renseigné, FAB, "chaque action = 1 tap"]
- [Source: _bmad-output/implementation-artifacts/4-2-photos-depuis-la-camera-sur-les-notes.md — PhotoPreview, NotesList+photo, Supabase Storage bucket note-photos, compression pipeline, FAB menu]
- [Source: _bmad-output/implementation-artifacts/4-1-creation-de-notes-texte-avec-flag-bloquant.md — NoteForm, NotesList, FAB, useCreateNote, notes table schema]
- [Source: _bmad-output/implementation-artifacts/epic-3-retro-2026-02-10.md — Prérequis Epic 4, centraliser polyfills jsdom]
- [Source: src/components/PhotoPreview.tsx — Dialog plein écran, miniature, DialogTitle sr-only]
- [Source: src/components/NotesList.tsx — Affichage notes, photo_url → PhotoPreview, auteur, date relative]
- [Source: src/components/BreadcrumbNav.tsx — Pattern useMatches() + queryClient pour résolution noms hiérarchie]
- [Source: MDN Web Docs — Web Share API, navigator.share(), navigator.canShare(), ShareData]
- [Source: Can I Use — web-share (~92.5% support global)]
- [Source: TypeScript lib.dom.d.ts — ShareData interface, Navigator.share/canShare types natifs]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun problème rencontré.

### Completion Notes List

- Task 1: Créé `useShareContext` hook — réutilise le pattern exact de BreadcrumbNav (useMatches + queryClient.getQueryData). Résout shallowest-first. Étage exclu du contexte partagé (niveau interne). 5 tests.
- Task 2: Créé `sharePhoto` utilitaire — Web Share API path principal avec File + canShare check. Fallback: download via `<a download>` + clipboard. AbortError → 'cancelled'. 5 tests.
- Task 3: Modifié NotesList — bouton Share2 ghost (h-8 w-8) dans la ligne métadonnées, visible seulement si photo_url. Appelle sharePhoto + toasts Sonner. PhotoPreview reçoit onShare prop. 3 nouveaux tests (13 total).
- Task 4: Modifié PhotoPreview — nouvelle prop `onShare?`, bouton Share2 en absolute top-right dans le Dialog plein écran, bg-black/50, z-50, visible seulement si onShare fourni. 3 nouveaux tests (12 total).
- Task 5: Régression — 544 passed, 16 failed (tous pré-existants: pwa-html 5, pwa-config 5, hasPointerCapture 6). Lint: seul ThemeProvider.tsx:64 pré-existant. Build TS: erreurs pré-existantes dans variantes.$varianteId.tsx et nouveau.tsx uniquement. 0 régression.

### Change Log

- 2026-02-10: Story 4.3 implémentée — partage photo contextualisé (Web Share API + fallback download/clipboard). 4 fichiers créés, 4 fichiers modifiés. 35 tests story total.
- 2026-02-11: Code review (Opus 4.6) — 8 issues trouvés (2H, 3M, 3L). 5 corrigés : double fetch éliminé (H1), response.ok check ajouté (H2), tests toast ajoutés (M1), isSharing disabled state (M2), blob.type MIME fix (M3). Types exportés (L1). 39 tests total.

### File List

- `src/lib/utils/useShareContext.ts` — NOUVEAU — hook résolution contexte hiérarchique
- `src/lib/utils/useShareContext.test.ts` — NOUVEAU — 5 tests
- `src/lib/utils/sharePhoto.ts` — NOUVEAU — utilitaire Web Share API + fallback
- `src/lib/utils/sharePhoto.test.ts` — NOUVEAU — 5 tests
- `src/components/NotesList.tsx` — MODIFIÉ — bouton Share2, imports sharePhoto/useShareContext/toast
- `src/components/NotesList.test.tsx` — MODIFIÉ — 3 nouveaux tests partage
- `src/components/PhotoPreview.tsx` — MODIFIÉ — prop onShare, bouton Share2 en plein écran
- `src/components/PhotoPreview.test.tsx` — MODIFIÉ — 3 nouveaux tests onShare
