# Story 5.1: Upload, visualisation et gestion de documents PDF

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux uploader, visualiser, remplacer et télécharger des documents PDF sur un lot,
Afin que les plans de pose et fiches de choix soient accessibles directement depuis l'app.

## Acceptance Criteria

1. **Given** un lot a des slots de documents (hérités ou ajoutés manuellement) **When** l'utilisateur tape sur un slot vide **Then** le sélecteur de fichier s'ouvre, limité aux PDF

2. **Given** l'utilisateur sélectionne un fichier PDF **When** l'upload vers Supabase Storage (bucket `documents`) se termine **Then** le PDF est lié au slot du lot, l'icône du slot passe de "vide" à "rempli" avec le nom du fichier

3. **Given** un slot contient un PDF **When** l'utilisateur tape dessus **Then** le PDF s'ouvre dans un nouvel onglet via une URL signée Supabase Storage (pas de viewer custom)

4. **Given** un slot contient un PDF **When** l'utilisateur choisit "Remplacer" **Then** un nouveau fichier peut être sélectionné, l'ancien est supprimé du storage et remplacé

5. **Given** un slot contient un PDF **When** l'utilisateur choisit "Télécharger" **Then** le PDF est téléchargé sur l'appareil

6. **Given** un upload est en cours sur réseau lent **When** le transfert progresse **Then** une barre de progression s'affiche

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : ajout colonnes fichier + bucket Storage (AC: #1-6)
  - [x] 1.1 Créer `supabase/migrations/014_lot_documents_file.sql`
  - [x] 1.2 Ajouter colonne `file_url TEXT DEFAULT NULL` à `lot_documents`
  - [x] 1.3 Ajouter colonne `file_name TEXT DEFAULT NULL` à `lot_documents`
  - [x] 1.4 Créer le bucket Supabase Storage `documents` (public: false — fichiers privés, accès via signed URLs)
  - [x] 1.5 Créer les RLS policies Storage pour `documents` : authenticated peut upload (INSERT), lire (SELECT), supprimer ses propres fichiers (DELETE)
  - [x] 1.6 Ajouter RLS policy UPDATE sur `lot_documents` pour authenticated (nécessaire pour mettre à jour file_url/file_name)

- [x] Task 2 — Types TypeScript : LotDocument mis à jour (AC: #1-6)
  - [x] 2.1 Ajouter ou mettre à jour l'interface `LotDocument` dans `src/types/database.ts` avec les champs `file_url: string | null` et `file_name: string | null`

- [x] Task 3 — Hook useUploadLotDocument : mutation upload PDF (AC: #1, #2, #6)
  - [x] 3.1 Créer `src/lib/mutations/useUploadLotDocument.ts`
  - [x] 3.2 Input : `{ file: File, documentId: string, lotId: string, onProgress?: (percent: number) => void }`
  - [x] 3.3 Valider que le fichier est un PDF (vérifier `file.type === 'application/pdf'`) — toast d'erreur sinon
  - [x] 3.4 Phase 1 — Upload vers Storage (0–80%) : chemin `{user.id}/{lotId}/{documentId}_{Date.now()}.pdf`, contentType `application/pdf`
  - [x] 3.5 Phase 2 — Mettre à jour `lot_documents` (80–100%) : `file_url` = chemin Storage (PAS l'URL signée, juste le path), `file_name` = nom original du fichier
  - [x] 3.6 onError : si upload Storage réussi mais DB échoue → supprimer le fichier orphelin du storage
  - [x] 3.7 onSuccess : toast "Document uploadé"
  - [x] 3.8 onSettled : invalider `['lot-documents', lotId]`
  - [x] 3.9 Créer `src/lib/mutations/useUploadLotDocument.test.ts` — 5-6 tests (success, pdf validation, storage error, DB error + cleanup, progress)

- [x] Task 4 — Hook useReplaceLotDocument : mutation remplacement (AC: #4)
  - [x] 4.1 Créer `src/lib/mutations/useReplaceLotDocument.ts`
  - [x] 4.2 Input : `{ file: File, documentId: string, lotId: string, oldFileUrl: string, onProgress?: (percent: number) => void }`
  - [x] 4.3 Valider PDF (même check que Task 3)
  - [x] 4.4 Phase 1 — Upload nouveau fichier (0–60%)
  - [x] 4.5 Phase 2 — Mettre à jour `lot_documents` avec nouveau file_url + file_name (60–80%)
  - [x] 4.6 Phase 3 — Supprimer l'ancien fichier du storage (80–100%) — ne pas échouer si suppression échoue (ancien fichier orphelin acceptable)
  - [x] 4.7 onSuccess : toast "Document remplacé"
  - [x] 4.8 onSettled : invalider `['lot-documents', lotId]`
  - [x] 4.9 Créer `src/lib/mutations/useReplaceLotDocument.test.ts` — 4-5 tests

- [x] Task 5 — Utilitaire : fonctions Storage signedUrl + download (AC: #3, #5)
  - [x] 5.1 Créer `src/lib/utils/documentStorage.ts`
  - [x] 5.2 `getDocumentSignedUrl(filePath: string): Promise<string>` — appelle `supabase.storage.from('documents').createSignedUrl(filePath, 3600)` (1h d'expiration)
  - [x] 5.3 `downloadDocument(filePath: string, fileName: string): Promise<void>` — appelle `supabase.storage.from('documents').download(filePath)`, crée un blob URL, déclenche le téléchargement via `<a>` temporaire avec `download` attribute
  - [x] 5.4 Créer `src/lib/utils/documentStorage.test.ts` — 4 tests (signed URL success/error, download success/error)

- [x] Task 6 — Composant DocumentSlot : UI de chaque slot document (AC: #1-6)
  - [x] 6.1 Créer `src/components/DocumentSlot.tsx`
  - [x] 6.2 Props : `document: LotDocument`, `lotId: string`, `onUploadProgress?: (docId: string, percent: number) => void`
  - [x] 6.3 **État vide** (file_url === null) : afficher icône document vide + nom + badge Obligatoire/Optionnel + la zone entière est cliquable pour déclencher l'upload (input file hidden, accept=".pdf,application/pdf")
  - [x] 6.4 **État rempli** (file_url !== null) : afficher icône document rempli (vert) + nom + file_name + badge. Tap sur la zone → ouvrir le PDF (signed URL dans un nouvel onglet via `window.open`)
  - [x] 6.5 **Actions rempli** : menu contextuel (DropdownMenu shadcn) avec 3 options : "Ouvrir", "Remplacer", "Télécharger"
  - [x] 6.6 **Barre de progression** : quand un upload est en cours, afficher une barre de progression (div avec width en %, bg-primary, h-1, transition)
  - [x] 6.7 Utiliser `useUploadLotDocument` pour l'upload initial et `useReplaceLotDocument` pour le remplacement
  - [x] 6.8 Utiliser `getDocumentSignedUrl` pour ouvrir et `downloadDocument` pour télécharger
  - [x] 6.9 Zones tactiles minimum 48px de hauteur pour chaque slot
  - [x] 6.10 Créer `src/components/DocumentSlot.test.tsx` — 8-10 tests (render vide, render rempli, click upload, click ouvrir, menu actions, progression, validation PDF, erreurs)

- [x] Task 7 — Modifier la page lot : intégrer DocumentSlot (AC: #1-6)
  - [x] 7.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx`
  - [x] 7.2 Remplacer la liste statique de documents actuelle (lignes ~463-481) par une liste de `<DocumentSlot>` pour chaque document
  - [x] 7.3 Conserver le bouton "+ Ajouter un document" existant tel quel (il crée un slot vide via `useAddLotDocument`)
  - [x] 7.4 Importer `DocumentSlot` et le type `LotDocument`

- [x] Task 8 — Tests de régression (AC: #1-6)
  - [x] 8.1 Lancer `npm run test` — tous les tests existants + nouveaux passent
  - [x] 8.2 Lancer `npm run lint` — 0 nouvelles erreurs (ThemeProvider.tsx:64 pré-existante tolérée)
  - [x] 8.3 Lancer `npm run build` — build propre

## Dev Notes

### Flow principal — Upload de document PDF

```
Utilisateur sur la page Lot
  → Voit la section Documents avec les slots hérités/ajoutés
  → Slot vide : icône grisée + nom "Plan de pose" + badge "Obligatoire"
  → Tap sur le slot vide
      ↓
  <input type="file" accept=".pdf,application/pdf"> s'ouvre
  → Utilisateur sélectionne un PDF
      ↓
  useUploadLotDocument.mutate()
  → Phase 1: Upload vers Supabase Storage bucket "documents"
     Chemin: {userId}/{lotId}/{docId}_{timestamp}.pdf
     Progression: 0–80%
  → Phase 2: Update lot_documents avec file_url + file_name
     Progression: 80–100%
  → Barre de progression visible sur le slot
      ↓
  Slot rempli : icône verte + nom + file_name
  → Tap ouvre le PDF via signed URL (nouvel onglet)
  → Menu ⋮ propose : Ouvrir | Remplacer | Télécharger
```

### Architecture du Storage bucket `documents`

```sql
-- supabase/migrations/014_lot_documents_file.sql

-- Ajout des colonnes fichier à lot_documents
ALTER TABLE public.lot_documents
  ADD COLUMN file_url TEXT DEFAULT NULL,
  ADD COLUMN file_name TEXT DEFAULT NULL;

-- Bucket privé pour les documents PDF
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Storage : authenticated peut upload
CREATE POLICY "authenticated_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- RLS Storage : authenticated peut lire
CREATE POLICY "authenticated_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

-- RLS Storage : authenticated peut supprimer ses propres fichiers
CREATE POLICY "authenticated_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS table : allow UPDATE on lot_documents (pour file_url/file_name)
-- Vérifier si une policy UPDATE existe déjà via apply_rls_policy
-- Si non, ajouter :
CREATE POLICY "authenticated_update_lot_documents" ON public.lot_documents
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
```

**Bucket privé vs public :**
- Le bucket `note-photos` est public (photos partagées via URL directe)
- Le bucket `documents` est **privé** — les PDFs sont des documents professionnels (plans de pose, fiches de choix) qui nécessitent une URL signée avec expiration
- URL signée = 1h de validité, générée à la demande via `createSignedUrl(path, 3600)`

### Interface TypeScript — LotDocument

```typescript
// Dans src/types/database.ts — ajouter ou mettre à jour

export interface LotDocument {
  id: string
  lot_id: string
  nom: string
  is_required: boolean
  file_url: string | null   // Chemin dans le Storage (pas l'URL signée)
  file_name: string | null  // Nom original du fichier uploadé
  created_at: string
}
```

### Hook useUploadLotDocument — Pattern

```typescript
// src/lib/mutations/useUploadLotDocument.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface UploadLotDocumentInput {
  file: File
  documentId: string
  lotId: string
  onProgress?: (percent: number) => void
}

export function useUploadLotDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, documentId, lotId, onProgress }: UploadLotDocumentInput) => {
      // Validate PDF
      if (file.type !== 'application/pdf') {
        throw new Error('Seuls les fichiers PDF sont acceptés')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Phase 1: Upload to storage (0–80%)
      onProgress?.(0)
      const filePath = `${user.id}/${lotId}/${documentId}_${Date.now()}.pdf`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { contentType: 'application/pdf' })
      if (uploadError) throw uploadError

      onProgress?.(80)

      // Phase 2: Update lot_documents (80–100%)
      const { error: updateError } = await supabase
        .from('lot_documents')
        .update({ file_url: filePath, file_name: file.name } as Record<string, unknown>)
        .eq('id', documentId)
      if (updateError) {
        // Cleanup orphan file
        await supabase.storage.from('documents').remove([filePath])
        throw updateError
      }

      onProgress?.(100)
      return filePath
    },
    onSuccess: () => {
      toast.success('Document uploadé')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'upload")
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lot-documents', variables?.lotId] })
    },
  })
}
```

### Hook useReplaceLotDocument — Pattern

```typescript
// src/lib/mutations/useReplaceLotDocument.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface ReplaceLotDocumentInput {
  file: File
  documentId: string
  lotId: string
  oldFileUrl: string
  onProgress?: (percent: number) => void
}

export function useReplaceLotDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, documentId, lotId, oldFileUrl, onProgress }: ReplaceLotDocumentInput) => {
      if (file.type !== 'application/pdf') {
        throw new Error('Seuls les fichiers PDF sont acceptés')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Phase 1: Upload new file (0–60%)
      onProgress?.(0)
      const filePath = `${user.id}/${lotId}/${documentId}_${Date.now()}.pdf`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { contentType: 'application/pdf' })
      if (uploadError) throw uploadError

      onProgress?.(60)

      // Phase 2: Update lot_documents (60–80%)
      const { error: updateError } = await supabase
        .from('lot_documents')
        .update({ file_url: filePath, file_name: file.name } as Record<string, unknown>)
        .eq('id', documentId)
      if (updateError) {
        await supabase.storage.from('documents').remove([filePath])
        throw updateError
      }

      onProgress?.(80)

      // Phase 3: Delete old file (80–100%) — non-blocking
      await supabase.storage.from('documents').remove([oldFileUrl]).catch(() => {})

      onProgress?.(100)
      return filePath
    },
    onSuccess: () => {
      toast.success('Document remplacé')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur lors du remplacement')
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lot-documents', variables?.lotId] })
    },
  })
}
```

### Utilitaire documentStorage — Fonctions

```typescript
// src/lib/utils/documentStorage.ts
import { supabase } from '@/lib/supabase'

export async function getDocumentSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 3600) // 1h expiration
  if (error) throw error
  return data.signedUrl
}

export async function downloadDocument(filePath: string, fileName: string): Promise<void> {
  const { data, error } = await supabase.storage
    .from('documents')
    .download(filePath)
  if (error) throw error

  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

### Composant DocumentSlot — Anatomie visuelle

```
SLOT VIDE (file_url === null):
┌────────────────────────────────────────────┐
│ 📄  Plan de pose            [Obligatoire]  │  ← cliquable, ouvre input file
│     Aucun fichier                          │
└────────────────────────────────────────────┘

SLOT EN COURS D'UPLOAD:
┌────────────────────────────────────────────┐
│ 📄  Plan de pose            [Obligatoire]  │
│     plan-pose-lot203.pdf                   │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░  72%               │  ← barre progression
└────────────────────────────────────────────┘

SLOT REMPLI (file_url !== null):
┌────────────────────────────────────────────┐
│ ✅  Plan de pose            [Obligatoire] ⋮│  ← tap = ouvrir PDF, ⋮ = menu
│     plan-pose-lot203.pdf                   │
└────────────────────────────────────────────┘
     Menu ⋮: Ouvrir | Remplacer | Télécharger
```

**Icônes lucide-react :**
- Slot vide : `FileText` (couleur `muted-foreground`)
- Slot rempli : `FileCheck2` (couleur `#10B981` vert)
- Menu : `MoreVertical`
- Actions menu : `ExternalLink` (Ouvrir), `RefreshCw` (Remplacer), `Download` (Télécharger)

### Modification de la page Lot — Section Documents actuelle vs nouvelle

**Avant (code actuel lignes ~463-481) :**
```tsx
{documents.map((doc) => (
  <div key={doc.id} className="flex items-center justify-between px-3 py-2.5">
    <span className="text-sm text-foreground">{doc.nom}</span>
    <Badge variant={doc.is_required ? 'default' : 'secondary'}>
      {doc.is_required ? 'Obligatoire' : 'Optionnel'}
    </Badge>
  </div>
))}
```

**Après :**
```tsx
{documents.map((doc) => (
  <DocumentSlot key={doc.id} document={doc} lotId={lotId} />
))}
```

Le bouton "+ Ajouter un document" reste tel quel — il crée un slot vide (lot_document sans file_url).

### Accès au PDF — Signed URL (bucket privé)

- **Pas de `getPublicUrl`** — le bucket est privé
- Utiliser `createSignedUrl(path, 3600)` pour générer une URL temporaire (1h)
- Ouvrir dans un nouvel onglet : `window.open(signedUrl, '_blank')`
- Le navigateur affiche le PDF natif (pas besoin de viewer custom, cf. architecture)

### Convention de nommage des fichiers Storage

Format : `{userId}/{lotId}/{documentId}_{timestamp}.pdf`
- `userId` : isolement par utilisateur dans le bucket (RLS delete cohérent)
- `lotId` : organisation logique
- `documentId` : liaison avec le slot
- `timestamp` : évite les collisions et permet le versioning implicite

### Tests — Pattern mock Supabase Storage

```typescript
// Pattern pour mocker les opérations Storage dans les tests
const mockUpload = vi.fn().mockResolvedValue({ error: null })
const mockRemove = vi.fn().mockResolvedValue({ error: null })
const mockCreateSignedUrl = vi.fn().mockResolvedValue({
  data: { signedUrl: 'https://signed.url/doc.pdf' },
  error: null,
})
const mockDownload = vi.fn().mockResolvedValue({
  data: new Blob(['pdf content'], { type: 'application/pdf' }),
  error: null,
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    storage: {
      from: () => ({
        upload: mockUpload,
        remove: mockRemove,
        createSignedUrl: mockCreateSignedUrl,
        download: mockDownload,
      }),
    },
    from: () => ({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
}))
```

### Project Structure Notes

**Nouveaux fichiers (8) :**
- `supabase/migrations/014_lot_documents_file.sql` — Migration colonnes + bucket + RLS
- `src/lib/mutations/useUploadLotDocument.ts` + `.test.ts` — Upload initial
- `src/lib/mutations/useReplaceLotDocument.ts` + `.test.ts` — Remplacement
- `src/lib/utils/documentStorage.ts` + `.test.ts` — Signed URL + download
- `src/components/DocumentSlot.tsx` + `.test.tsx` — Composant slot document

**Fichiers modifiés (2) :**
- `src/types/database.ts` — Ajout interface LotDocument
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx` — Remplacement liste statique par DocumentSlot

### Prérequis et dépendances

- **Aucune dépendance npm externe à ajouter** — tout est couvert par Supabase Storage SDK déjà installé
- **Tables existantes requises** : `lot_documents` (from 007_lots.sql), `lots`, `etages`, `plots`, `chantiers`
- **Composants shadcn existants** : `Badge`, `Button`, `DropdownMenu` (déjà installé), `Input`
- **Lucide-react** : `FileText`, `FileCheck2`, `MoreVertical`, `ExternalLink`, `RefreshCw`, `Download` (toutes dans le package)
- **Pattern existant à suivre** : `useUploadNotePhoto` dans `src/lib/mutations/useUploadNotePhoto.ts` — même flow (upload → DB update → cleanup)

### Risques et points d'attention

1. **Bucket privé vs public** : Contrairement à `note-photos` (public), le bucket `documents` est privé. Les signed URLs expirent après 1h. Si l'utilisateur laisse l'onglet ouvert plus d'1h, le lien ne fonctionnera plus — acceptable pour le MVP, on peut augmenter la durée si nécessaire.

2. **Taille des fichiers PDF** : Pas de limite explicite côté client. Supabase Free plan autorise 50MB par fichier. Les plans de pose font typiquement 2-10MB. Pas besoin de compression côté client pour les PDFs (contrairement aux photos).

3. **`as Record<string, unknown>`** : Le cast est nécessaire pour l'update car `Database.Tables` est `Record<string, never>` et ne fournit pas d'inférence sur les colonnes. Pattern établi dans `useUploadNotePhoto`.

4. **RLS Storage delete** : La policy de delete vérifie que le premier dossier du chemin correspond à `auth.uid()`. Ceci fonctionne grâce à la convention de nommage `{userId}/{lotId}/{docId}_{timestamp}.pdf`.

5. **apply_rls_policy** : La function helper `apply_rls_policy` crée des policies SELECT et INSERT pour authenticated. Il faut vérifier si elle crée aussi UPDATE. Si non, ajouter manuellement une policy UPDATE sur `lot_documents` dans la migration.

6. **DropdownMenu sur mobile** : Le composant shadcn `DropdownMenu` (Radix) fonctionne bien sur mobile avec touch events. Pas besoin de Sheet/ActionSheet custom.

7. **Pre-existing issues** : 16 test failures pré-existants (pwa-config 5, pwa-html 5, hasPointerCapture 6), lint error ThemeProvider.tsx:64 — ne pas s'en inquiéter.

8. **`window.open` sur iOS** : Safari iOS bloque les `window.open` dans les callbacks async. Solution : obtenir la signed URL AVANT d'ouvrir la fenêtre, ou mieux, utiliser un lien `<a target="_blank">` avec l'URL. Le composant DocumentSlot devra gérer ce cas (pré-fetch la signed URL puis ouvrir).

### Learnings des stories précédentes (relevants)

- **Mock supabase chainable API** : `from → select → eq → order` chaque appel retourne un mock avec la méthode suivante. Pattern établi dans tous les tests de queries/mutations.
- **`data as unknown as Type[]`** : Le cast est nécessaire car `Database.Tables` est `Record<string, never>`.
- **Pattern upload existant** : `useUploadNotePhoto` — compression → storage upload → DB update → cleanup on failure. Adapter pour les PDFs (pas de compression, mais même flow storage → DB).
- **Route tests** : Utiliser `createRouter` + `createMemoryHistory` + `RouterProvider` + `QueryClientProvider` + `AuthContext.Provider`.
- **ThemeProvider.tsx:64 lint error** : pré-existant, ne pas corriger.
- **Badge import** : ajouter `// eslint-disable-next-line react-refresh/only-export-components` si nécessaire.
- **Query key convention** : `['lot-documents', lotId]` — existant, ne pas changer.
- **Sonner toast** : utiliser `toast.success()` et `toast.error()` — project uses sonner with custom theme provider.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 5.1, Epic 5, FR35, FR36]
- [Source: _bmad-output/planning-artifacts/prd.md — FR35 (upload PDF), FR36 (visualiser/remplacer/télécharger), NFR7 (compression photos — pas applicable aux PDFs)]
- [Source: _bmad-output/planning-artifacts/architecture.md — Supabase Storage buckets, PDFs via URL signée, Supabase Client SDK direct, TanStack Query mutations, naming patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Journey 4 étape 10 (Upload PDF), zones tactiles 48px+, formulaires max 3 champs]
- [Source: supabase/migrations/007_lots.sql — Table lot_documents existante (id, lot_id, nom, is_required)]
- [Source: supabase/migrations/012_note_photos.sql — Pattern bucket + RLS Storage existant (note-photos)]
- [Source: src/lib/mutations/useUploadNotePhoto.ts — Pattern upload : phases, progress, cleanup orphan]
- [Source: src/lib/queries/useLotDocuments.ts — Query hook existant, queryKey ['lot-documents', lotId]]
- [Source: src/lib/mutations/useAddLotDocument.ts — Mutation existante pour créer un slot (métadonnées)]
- [Source: src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx — Page lot actuelle avec section documents]
- [Source: _bmad-output/implementation-artifacts/4-4-fil-d-activite-quoi-de-neuf.md — Learnings, test patterns, mock supabase]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun problème de debug rencontré.

### Completion Notes List

- Task 1 : Migration `014_lot_documents_file.sql` — colonnes `file_url`/`file_name` sur `lot_documents`, bucket privé `documents`, 3 RLS policies Storage (INSERT, SELECT, DELETE). La policy UPDATE sur `lot_documents` est déjà couverte par `apply_rls_policy` (FOR ALL).
- Task 2 : Interface `LotDocument` ajoutée dans `database.ts` avec `file_url: string | null` et `file_name: string | null`.
- Task 3 : `useUploadLotDocument` — validation PDF, upload 2 phases (Storage 0-80%, DB 80-100%), cleanup orphelin si DB échoue. 6 tests passent.
- Task 4 : `useReplaceLotDocument` — upload 3 phases (Storage 0-60%, DB 60-80%, delete ancien 80-100%), delete non-bloquant. 5 tests passent.
- Task 5 : `documentStorage.ts` — `getDocumentSignedUrl` (1h expiration) + `downloadDocument` (blob + anchor download). 4 tests passent.
- Task 6 : `DocumentSlot.tsx` — états vide/rempli/uploading, icônes lucide-react, DropdownMenu (Ouvrir/Remplacer/Télécharger), barre de progression, zones tactiles min-h-12. 9 tests passent.
- Task 7 : Page lot modifiée — import `DocumentSlot`, remplacement de la liste statique par `<DocumentSlot>`. Bouton "+ Ajouter un document" conservé.
- Task 8 : Régression — 0 nouveaux échecs (16 pré-existants). Lint — 1 erreur pré-existante (ThemeProvider.tsx:64). tsc --noEmit : 0 erreurs.

### Change Log

- 2026-02-11 : Implémentation complète story 5.1 — Upload, visualisation, remplacement et téléchargement de documents PDF sur les lots.
- 2026-02-11 : Code review (AI) — 7 issues trouvées (2H/3M/2L), 5 corrigées automatiquement. Fixes : Safari popup blocker pour window.open (H1), downloadDocument iOS via signed URL avec Content-Disposition (H2), barre de progression indéterminée honnête (M1), test progress bar renforcé (M2), validation taille fichier 50Mo (M3), commentaire database.ts repositionné (L1). Tests 24→27 (tous passent). Status → done.

### File List

**Nouveaux fichiers :**
- `supabase/migrations/014_lot_documents_file.sql`
- `src/lib/mutations/useUploadLotDocument.ts`
- `src/lib/mutations/useUploadLotDocument.test.ts`
- `src/lib/mutations/useReplaceLotDocument.ts`
- `src/lib/mutations/useReplaceLotDocument.test.ts`
- `src/lib/utils/documentStorage.ts`
- `src/lib/utils/documentStorage.test.ts`
- `src/components/DocumentSlot.tsx`
- `src/components/DocumentSlot.test.tsx`

**Fichiers modifiés :**
- `src/types/database.ts` — ajout interface `LotDocument`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx` — import `DocumentSlot`, remplacement liste statique
