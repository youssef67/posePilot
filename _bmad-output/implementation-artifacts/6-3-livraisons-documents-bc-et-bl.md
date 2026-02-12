# Story 6.3: Livraisons — Documents BC et BL

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux rattacher un bon de commande et un bon de livraison à une livraison,
Afin que la traçabilité documentaire des commandes soit assurée.

## Acceptance Criteria

1. **Given** une livraison existe au statut "Commandé" ou supérieur **When** l'utilisateur tape "Ajouter BC" **Then** il peut uploader un document (photo ou PDF) comme bon de commande

2. **Given** une livraison existe au statut "Livré" **When** l'utilisateur tape "Ajouter BL" **Then** il peut uploader un document (photo ou PDF) comme bon de livraison

3. **Given** une livraison a un BC ou BL rattaché **When** l'utilisateur consulte la DeliveryCard **Then** les documents sont visibles avec une icône de téléchargement

4. **Given** l'utilisateur tape sur un BC ou BL **When** le document s'ouvre **Then** il est affiché via URL signée Supabase Storage

## Tasks / Subtasks

- [x] Task 1 — Mutation hook : useUploadLivraisonDocument (AC: #1, #2)
  - [x] 1.1 Créer `src/lib/mutations/useUploadLivraisonDocument.ts`
  - [x] 1.2 Params : `{ livraisonId, chantierId, file: File, documentType: 'bc' | 'bl' }`
  - [x] 1.3 Validation : accepter PDF ET images (application/pdf, image/jpeg, image/png, image/heic), max 50MB
  - [x] 1.4 Upload vers bucket `documents`, path : `${user.id}/${livraisonId}/${type}_${Date.now()}.${ext}`
  - [x] 1.5 Update table `livraisons` : colonnes `${type}_file_url` et `${type}_file_name`
  - [x] 1.6 Progress callback : 0-80% upload, 80-100% DB update
  - [x] 1.7 Nettoyage fichier orphelin en cas d'échec DB update
  - [x] 1.8 Invalidation : `['livraisons', chantierId]` + `['livraisons-count', chantierId]`
  - [x] 1.9 Créer `src/lib/mutations/useUploadLivraisonDocument.test.ts`

- [x] Task 2 — Mutation hook : useReplaceLivraisonDocument (AC: #1, #2)
  - [x] 2.1 Créer `src/lib/mutations/useReplaceLivraisonDocument.ts`
  - [x] 2.2 Params : `{ livraisonId, chantierId, file: File, documentType: 'bc' | 'bl', oldFileUrl: string }`
  - [x] 2.3 Trois phases : Upload nouveau (0-60%), DB update (60-80%), Nettoyage ancien (80-100%)
  - [x] 2.4 Nettoyage non-bloquant de l'ancien fichier
  - [x] 2.5 Même validation que useUploadLivraisonDocument (PDF + images, 50MB)
  - [x] 2.6 Invalidation : `['livraisons', chantierId]` + `['livraisons-count', chantierId]`
  - [x] 2.7 Créer `src/lib/mutations/useReplaceLivraisonDocument.test.ts`

- [x] Task 3 — Composant : LivraisonDocumentSlot (AC: #1, #2, #3, #4)
  - [x] 3.1 Créer `src/components/LivraisonDocumentSlot.tsx`
  - [x] 3.2 Props : `{ type: 'bc' | 'bl', livraison: Livraison, chantierId: string, disabled?: boolean }`
  - [x] 3.3 État vide : bouton "Ajouter BC/BL" avec icône FileText
  - [x] 3.4 État rempli : nom du fichier + icônes (ouvrir, télécharger, remplacer) via DropdownMenu
  - [x] 3.5 Input file masqué : accept `application/pdf,image/jpeg,image/png,image/heic`
  - [x] 3.6 Barre de progression pendant l'upload
  - [x] 3.7 Ouvrir le document via `getDocumentSignedUrl()` + `window.open()`
  - [x] 3.8 Télécharger via `downloadDocument()` de `documentStorage.ts`
  - [x] 3.9 Toast feedback en français : "BC uploadé", "BL remplacé", etc.
  - [x] 3.10 Créer `src/components/LivraisonDocumentSlot.test.tsx`

- [x] Task 4 — Modifier DeliveryCard : indicateurs et section documents (AC: #3, #4)
  - [x] 4.1 Modifier `src/components/DeliveryCard.tsx`
  - [x] 4.2 Ajouter props : `chantierId: string`
  - [x] 4.3 Ajouter une ligne d'indicateurs documents sous la description : badges "BC ✓" / "BL ✓" quand attachés
  - [x] 4.4 Ajouter section documents expandable : afficher LivraisonDocumentSlot pour BC et BL
  - [x] 4.5 BC visible si statut ≥ `commande` (donc toujours)
  - [x] 4.6 BL visible si statut = `livre` uniquement
  - [x] 4.7 Mettre à jour `src/components/DeliveryCard.test.tsx` avec les nouveaux cas

- [x] Task 5 — Intégration : pages chantier léger et livraisons (AC: #1-4)
  - [x] 5.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — passer `chantierId` au LivraisonsList → DeliveryCard
  - [x] 5.2 Modifier `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx` — passer `chantierId` au LivraisonsList → DeliveryCard
  - [x] 5.3 Modifier `src/components/LivraisonsList.tsx` — passer `chantierId` prop à chaque DeliveryCard
  - [x] 5.4 Mettre à jour les tests existants des pages si nécessaire

- [x] Task 6 — Tests de régression (AC: #1-4)
  - [x] 6.1 `npm run test` — tous les tests existants + nouveaux passent
  - [x] 6.2 `npm run lint` — 0 nouvelles erreurs
  - [x] 6.3 `npm run build` — 0 nouvelles erreurs tsc (erreurs pré-existantes: Record<string,never> types, pwa tests Node imports)

## Dev Notes

### Vue d'ensemble — Stratégie d'implémentation

Cette story est la **troisième de l'Epic 6** et ajoute le rattachement de documents (BC et BL) aux livraisons. Story 6.2 a rendu les livraisons pleinement fonctionnelles avec le cycle de vie complet. Cette story ajoute la **traçabilité documentaire** : les bons de commande et de livraison.

**Scope précis :**
- Upload de documents BC (bon de commande) — photo OU PDF
- Upload de documents BL (bon de livraison) — photo OU PDF
- Remplacement de documents existants
- Affichage des indicateurs de présence BC/BL sur la DeliveryCard
- Ouverture et téléchargement via URL signées Supabase Storage

**Hors scope (stories suivantes) :**
- Vue globale des livraisons filtrée par statut (Story 6.4)
- Gestion d'inventaire avec localisation (Story 6.5)

### Ce qui existe déjà (Stories 6.1 + 6.2)

| Élément | Fichier | Notes |
|---------|---------|-------|
| Colonnes `bc_file_url`, `bc_file_name`, `bl_file_url`, `bl_file_name` | `016_besoins_livraisons.sql` | Déjà dans la table `livraisons` |
| Type `Livraison` avec champs BC/BL | `src/types/database.ts` | `bc_file_url: string \| null`, etc. |
| `DeliveryCard` | `src/components/DeliveryCard.tsx` | Affiche description, statut, date, boutons d'action — PAS de documents |
| `LivraisonsList` | `src/components/LivraisonsList.tsx` | Liste de DeliveryCards |
| `LivraisonSheets` | `src/components/LivraisonSheets.tsx` | Sheets création + date prévue |
| `useLivraisonActions` | `src/lib/hooks/useLivraisonActions.ts` | Hook centralisé pour les actions livraisons |
| `useLivraisons(chantierId)` | `src/lib/queries/useLivraisons.ts` | Fetch livraisons avec BC/BL (les données sont déjà retournées) |
| `useRealtimeLivraisons` | `src/lib/subscriptions/useRealtimeLivraisons.ts` | Invalide les queries sur changement |
| `DocumentSlot` | `src/components/DocumentSlot.tsx` | Pattern de référence pour upload/replace/view — PDF uniquement |
| `useUploadLotDocument` | `src/lib/mutations/useUploadLotDocument.ts` | Pattern de référence pour upload avec progression |
| `useReplaceLotDocument` | `src/lib/mutations/useReplaceLotDocument.ts` | Pattern de référence pour replace en 3 phases |
| `documentStorage.ts` | `src/lib/utils/documentStorage.ts` | `getDocumentSignedUrl()`, `downloadDocument()` — réutiliser tel quel |
| Bucket `documents` | `supabase/migrations` | Bucket Storage existant |

**IMPORTANT :** Les données BC/BL sont DÉJÀ retournées par `useLivraisons` puisque `.select('*')` inclut toutes les colonnes. Pas de query supplémentaire à créer.

### ⚠️ Différence clé avec les documents de lot : Photo OU PDF

Les ACs disent explicitement "photo ou PDF" pour les BC/BL. Contrairement aux documents de lot (`useUploadLotDocument`) qui n'acceptent que les PDF, les mutations BC/BL doivent accepter :
- `application/pdf`
- `image/jpeg`
- `image/png`
- `image/heic` (photos iPhone)

**ATTENTION** : Ne pas copier la validation MIME type de `useUploadLotDocument` (PDF only). Utiliser une validation élargie.

### Mutation : useUploadLivraisonDocument

```typescript
// src/lib/mutations/useUploadLivraisonDocument.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
]
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

interface UploadParams {
  livraisonId: string
  chantierId: string
  file: File
  documentType: 'bc' | 'bl'
  onProgress?: (progress: number) => void
}

export function useUploadLivraisonDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ livraisonId, chantierId, file, documentType, onProgress }: UploadParams) => {
      // Validation
      if (!ACCEPTED_TYPES.includes(file.type)) {
        throw new Error('Format non supporté. Utilisez un PDF ou une image (JPEG, PNG).')
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('Fichier trop volumineux (max 50 Mo)')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Determine file extension
      const ext = file.name.split('.').pop() || (file.type.startsWith('image/') ? 'jpg' : 'pdf')
      const filePath = `${user.id}/${livraisonId}/${documentType}_${Date.now()}.${ext}`

      // Phase 1: Upload (0-80%)
      onProgress?.(10)
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { contentType: file.type })

      if (uploadError) throw uploadError
      onProgress?.(80)

      // Phase 2: DB update (80-100%)
      const urlCol = `${documentType}_file_url` as const
      const nameCol = `${documentType}_file_name` as const

      const { error: updateError } = await supabase
        .from('livraisons')
        .update({ [urlCol]: filePath, [nameCol]: file.name })
        .eq('id', livraisonId)

      if (updateError) {
        // Cleanup orphan file
        await supabase.storage.from('documents').remove([filePath])
        throw updateError
      }

      onProgress?.(100)
      return { filePath, fileName: file.name }
    },
    onSettled: (_data, _error, variables) => {
      if (variables) {
        queryClient.invalidateQueries({ queryKey: ['livraisons', variables.chantierId] })
        queryClient.invalidateQueries({ queryKey: ['livraisons-count', variables.chantierId] })
      }
    },
  })
}
```

**Pattern de référence :** `useUploadLotDocument.ts` — même structure en 2 phases (upload → DB update) avec nettoyage orphelin et progression.

### Mutation : useReplaceLivraisonDocument

```typescript
// src/lib/mutations/useReplaceLivraisonDocument.ts
// Pattern identique à useReplaceLotDocument — 3 phases
// Phase 1: Upload nouveau fichier (0-60%)
// Phase 2: DB update avec nouveau path + nom (60-80%)
// Phase 3: Nettoyage ancien fichier non-bloquant (80-100%)

interface ReplaceParams {
  livraisonId: string
  chantierId: string
  file: File
  documentType: 'bc' | 'bl'
  oldFileUrl: string
  onProgress?: (progress: number) => void
}

export function useReplaceLivraisonDocument() {
  // Même validation que useUploadLivraisonDocument (PDF + images, 50MB)
  // Même structure que useReplaceLotDocument (3 phases)
  // oldFileUrl cleanup est non-bloquant (try/catch ignoré)
}
```

### Composant : LivraisonDocumentSlot

Composant réutilisable pour afficher et gérer un document BC ou BL sur une livraison. S'inspire de `DocumentSlot.tsx` mais simplifié (pas de toggle required/optional).

```
SLOT VIDE (BC) :
┌─────────────────────────────────┐
│ 📄 Bon de commande             │
│ [Ajouter un fichier]           │
└─────────────────────────────────┘

SLOT REMPLI (BC) :
┌─────────────────────────────────┐
│ ✅ Bon de commande        [⋮]  │
│ facture-2026-02-12.pdf         │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%    │  ← visible pendant upload uniquement
└─────────────────────────────────┘

DROPDOWN [⋮] :
┌─────────────────┐
│ Ouvrir          │
│ Télécharger     │
│ Remplacer       │
└─────────────────┘
```

**Props :**
```typescript
interface LivraisonDocumentSlotProps {
  type: 'bc' | 'bl'
  livraison: Livraison
  chantierId: string
  disabled?: boolean  // pour BL quand statut ≠ 'livre'
}
```

**Label d'affichage :**
- `type === 'bc'` → "Bon de commande"
- `type === 'bl'` → "Bon de livraison"

**Icônes :**
- Vide : `FileText` (lucide-react)
- Rempli : `FileCheck2` (lucide-react)
- Pattern identique à DocumentSlot.tsx

**Actions :**
- Clic "Ajouter un fichier" → ouvre input file masqué (`accept="application/pdf,image/jpeg,image/png,image/heic"`)
- Clic dropdown "Ouvrir" → `getDocumentSignedUrl(filePath)` + `window.open(url, '_blank')`
- Clic dropdown "Télécharger" → `downloadDocument(filePath, fileName)` de `documentStorage.ts`
- Clic dropdown "Remplacer" → ouvre input file masqué, lance useReplaceLivraisonDocument

**Toasts (sonner) :**
- Upload réussi : `toast('BC uploadé')` / `toast('BL uploadé')`
- Remplacement réussi : `toast('BC remplacé')` / `toast('BL remplacé')`
- Erreur : `toast.error(error.message)`

### Modification : DeliveryCard — Indicateurs et section documents

Le DeliveryCard actuel affiche description, statut, date, initiale auteur et boutons d'action. Il faut ajouter :

1. **Indicateurs compacts** : badges "BC ✓" / "BL ✓" dans la zone info, visibles d'un coup d'oeil
2. **Section documents expandable** : les LivraisonDocumentSlots pour BC et BL

```
DELIVERYCARD APRÈS 6.3 — STATUT COMMANDÉ :
┌──┬──────────────────────────────────────────────┐
│  │ Colle pour faïence 20kg             Commandé │
│O │ Y · il y a 2h                                │
│R │                                               │
│A │ 📄 Bon de commande                           │
│N │ [Ajouter un fichier]                         │
│G │                                               │
│E │                         [Marquer prévu]       │
└──┴──────────────────────────────────────────────┘

DELIVERYCARD APRÈS 6.3 — STATUT LIVRÉ (BC + BL rattachés) :
┌──┬──────────────────────────────────────────────┐
│  │ Colle pour faïence 20kg               Livré  │
│V │ Y · il y a 3j       📅 12 fév. 2026  BC ✓   │
│E │                                               │
│R │ ✅ Bon de commande                      [⋮]  │
│T │ facture-2026-02-12.pdf                        │
│  │                                               │
│  │ ✅ Bon de livraison                      [⋮]  │
│  │ bl-reception.jpg                              │
└──┴──────────────────────────────────────────────┘
```

**Nouvelles props DeliveryCard :**
```typescript
interface DeliveryCardProps {
  livraison: Livraison
  chantierId: string  // ← NOUVEAU — nécessaire pour les mutations document
  onMarquerPrevu?: (id: string) => void
  onConfirmerLivraison?: (id: string) => void
}
```

**Logique de visibilité :**
- **BC** : visible à TOUS les statuts (commande, prevu, livre) — car l'AC dit "Commandé ou supérieur"
- **BL** : visible UNIQUEMENT au statut `livre` — car l'AC dit "au statut Livré"

**Indicateurs compacts** (badges inline) :
- Si `livraison.bc_file_url` existe → badge `BC ✓` (vert, petit)
- Si `livraison.bl_file_url` existe → badge `BL ✓` (vert, petit)
- Les badges sont affichés à côté de la date prévue pour être visibles sans ouvrir la carte

### Propagation de chantierId

Actuellement, `LivraisonsList` et `DeliveryCard` ne reçoivent pas `chantierId`. Il faut le propager :

```
Page (index.tsx / livraisons.tsx)
  └── LivraisonsList  ← ajouter prop chantierId
        └── DeliveryCard  ← ajouter prop chantierId
              └── LivraisonDocumentSlot  ← reçoit chantierId
                    └── useUploadLivraisonDocument  ← utilise chantierId
```

**Fichiers impactés :**
1. `src/components/LivraisonsList.tsx` — ajouter `chantierId` aux props, le passer à chaque DeliveryCard
2. `src/components/DeliveryCard.tsx` — ajouter `chantierId` aux props, intégrer les LivraisonDocumentSlots
3. `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — passer `chantierId` à LivraisonsList
4. `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx` — passer `chantierId` à LivraisonsList

### Utilitaires existants à réutiliser (NE PAS recréer)

| Utilitaire | Fichier | Usage dans 6.3 |
|-----------|---------|----------------|
| `getDocumentSignedUrl(filePath)` | `src/lib/utils/documentStorage.ts` | Ouvrir BC/BL dans un nouvel onglet |
| `downloadDocument(filePath, fileName)` | `src/lib/utils/documentStorage.ts` | Télécharger BC/BL |
| `supabase` client | `src/lib/supabase.ts` | Upload vers Storage |
| `formatRelativeTime(date)` | `src/lib/utils/formatRelativeTime.ts` | Déjà utilisé par DeliveryCard |

### Composants UI existants à utiliser

| Composant | Fichier | Usage dans 6.3 |
|-----------|---------|----------------|
| **DropdownMenu** | `src/components/ui/dropdown-menu.tsx` | Menu actions (Ouvrir, Télécharger, Remplacer) |
| **Badge** | `src/components/ui/badge.tsx` | Indicateurs "BC ✓" / "BL ✓" |
| **Button** | `src/components/ui/button.tsx` | Bouton "Ajouter un fichier" |

### Schéma DB — Rappel colonnes BC/BL (existantes)

| Colonne | Type | Contrainte | Utilisé en 6.3 |
|---------|------|------------|-----------------|
| bc_file_url | text | nullable | Oui — path Storage du BC |
| bc_file_name | text | nullable | Oui — nom original du fichier BC |
| bl_file_url | text | nullable | Oui — path Storage du BL |
| bl_file_name | text | nullable | Oui — nom original du fichier BL |

**Path Storage pattern :** `${user.id}/${livraisonId}/${type}_${Date.now()}.${ext}`
- Exemple BC : `abc123/def456/bc_1707749200000.pdf`
- Exemple BL : `abc123/def456/bl_1707749300000.jpg`

### Project Structure Notes

**Nouveaux fichiers (6+) :**
- `src/lib/mutations/useUploadLivraisonDocument.ts` + test
- `src/lib/mutations/useReplaceLivraisonDocument.ts` + test
- `src/components/LivraisonDocumentSlot.tsx` + test

**Fichiers modifiés (4) :**
- `src/components/DeliveryCard.tsx` — section documents + indicateurs BC/BL
- `src/components/DeliveryCard.test.tsx` — nouveaux cas BC/BL
- `src/components/LivraisonsList.tsx` — ajout prop `chantierId`
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — passer `chantierId` à LivraisonsList
- `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx` — passer `chantierId` à LivraisonsList

### Prérequis et dépendances

- **Aucune migration SQL** — les colonnes BC/BL existent déjà dans la table `livraisons`
- **Aucune dépendance npm à ajouter** — tout est déjà dans le projet
- **Icônes lucide-react** : `FileText`, `FileCheck2`, `Download`, `ExternalLink`, `RefreshCw`, `MoreVertical` — tous déjà utilisés par DocumentSlot
- **Bucket `documents`** : déjà configuré dans Supabase Storage
- **Story 6.2** : `done` — DeliveryCard, LivraisonsList, useLivraisons, etc. existent

### Risques et points d'attention

1. **Accept MIME types mobile** : Sur certains navigateurs mobiles, `image/heic` peut ne pas être reconnu dans l'attribut `accept` de l'input file. Tester avec `image/*,application/pdf` comme fallback si `heic` pose problème.

2. **Bucket permissions** : Vérifier que le bucket `documents` dans Supabase Storage accepte aussi les images (pas seulement les PDF). Si le bucket a des restrictions MIME, elles doivent être étendues. Consulter `supabase/migrations` pour la config du bucket.

3. **Taille des images caméra** : Les photos directement depuis l'appareil photo peuvent être volumineuses (5-10 MB). Contrairement aux photos de notes (Story 4.2) qui sont compressées via `browser-image-compression`, les BC/BL sont des documents "officiels" — pas de compression automatique. La limite de 50MB est suffisante.

4. **Pas de compression automatique** : Les BC/BL sont des documents professionnels (factures, bons). NE PAS compresser les images comme les photos de notes. L'utilisateur upload un scan ou une photo de document, la qualité originale doit être préservée.

5. **Propagation chantierId** : La modification la plus large est l'ajout de `chantierId` à travers la chaîne LivraisonsList → DeliveryCard. Vérifier tous les endroits où ces composants sont instanciés.

6. **Pre-existing issues** : Mêmes que Story 6.2 — 16 test failures pré-existants (pwa-config 5, pwa-html 5, hasPointerCapture 6), lint error ThemeProvider.tsx:64.

### Learnings des stories précédentes (relevants)

- **Pattern upload document** : `useUploadLotDocument.ts` — 2 phases (upload → DB update) avec progression et nettoyage orphelin. Reproduire exactement ce pattern.
- **Pattern replace document** : `useReplaceLotDocument.ts` — 3 phases avec nettoyage non-bloquant de l'ancien fichier.
- **documentStorage.ts** : `getDocumentSignedUrl` (1h expiration) et `downloadDocument` (iOS Safari compatible). Réutiliser sans modifier.
- **DocumentSlot** : Pattern composant complet avec input masqué, dropdown actions, barre de progression. S'en inspirer fortement pour LivraisonDocumentSlot.
- **Mock supabase Storage** : Pattern dans `useUploadLotDocument.test.ts` — mock `.from('documents').upload()` et `.remove()`, File size via `Object.defineProperty`.
- **`data as unknown as Type[]`** : Cast nécessaire — pattern établi.
- **DeliveryCard test patterns** : 16 tests existants. Ajouter des cas pour les indicateurs BC/BL et la section documents.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 6.3, Epic 6, FR49, FR50]
- [Source: _bmad-output/planning-artifacts/architecture.md — Supabase Storage, SDK direct, structure par domaine]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — §8 DeliveryCard : "Documents attachés (BC, BL) avec icône de téléchargement"]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Cycle livraison : "Commandé → BC, Livré → BL"]
- [Source: _bmad-output/implementation-artifacts/6-2-livraisons-creation-directe-et-cycle-de-vie.md — DeliveryCard, LivraisonsList, patterns mutations, debug log]
- [Source: src/components/DocumentSlot.tsx — Pattern upload/replace/view pour LivraisonDocumentSlot]
- [Source: src/lib/mutations/useUploadLotDocument.ts — Pattern mutation upload 2 phases]
- [Source: src/lib/mutations/useReplaceLotDocument.ts — Pattern mutation replace 3 phases]
- [Source: src/lib/utils/documentStorage.ts — getDocumentSignedUrl(), downloadDocument()]
- [Source: src/components/DeliveryCard.tsx — Composant à modifier]
- [Source: src/components/LivraisonsList.tsx — Composant à modifier (ajout chantierId)]
- [Source: src/types/database.ts — Type Livraison avec bc_file_url, bc_file_name, bl_file_url, bl_file_name]
- [Source: supabase/migrations/016_besoins_livraisons.sql — Table livraisons avec colonnes BC/BL]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Lint fix: `_chantierId` unused var in mutations — destructured without alias instead

### Completion Notes List

- Task 1: `useUploadLivraisonDocument` — 2-phase upload (storage → DB) with orphan cleanup, PDF+image validation, progress callback, French toasts (11 tests)
- Task 2: `useReplaceLivraisonDocument` — 3-phase replace (upload → DB → cleanup old) with non-blocking old file deletion, same validation (7 tests)
- Task 3: `LivraisonDocumentSlot` — Composant réutilisable inspiré de DocumentSlot, avec DropdownMenu (Ouvrir/Télécharger/Remplacer), Safari-safe signed URL opening, disabled state pour BL (14 tests)
- Task 4: `DeliveryCard` — Ajout prop `chantierId`, badges inline "BC ✓"/"BL ✓", section documents avec BC toujours visible et BL uniquement au statut `livre` (22 tests, +7 nouveaux)
- Task 5: Propagation `chantierId` à travers LivraisonsList → DeliveryCard depuis index.tsx et livraisons.tsx (6 tests mis à jour)
- Task 6: Régression complète — 768/768 pass (16 failures pré-existantes: pwa 10, hasPointerCapture 6), lint 0 erreurs, tsc 0 nouvelles erreurs (~20 erreurs pré-existantes: Record<string,never> types, pwa Node imports)

### Change Log

- 2026-02-12: Story 6.3 implémentée — documents BC/BL sur livraisons, upload/replace/view/download, indicateurs, propagation chantierId
- 2026-02-12: Code review — 4 issues corrigées (1 HIGH: build claim, 2 MEDIUM: HEIC error msg, 1 MEDIUM: test manquant replace non-blocking + test replace dropdown flow)

### File List

**Nouveaux fichiers :**
- src/lib/mutations/useUploadLivraisonDocument.ts
- src/lib/mutations/useUploadLivraisonDocument.test.ts
- src/lib/mutations/useReplaceLivraisonDocument.ts
- src/lib/mutations/useReplaceLivraisonDocument.test.ts
- src/components/LivraisonDocumentSlot.tsx
- src/components/LivraisonDocumentSlot.test.tsx

**Fichiers modifiés :**
- src/components/DeliveryCard.tsx
- src/components/DeliveryCard.test.tsx
- src/components/LivraisonsList.tsx
- src/components/LivraisonsList.test.tsx
- src/routes/_authenticated/chantiers/$chantierId/index.tsx
- src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx
