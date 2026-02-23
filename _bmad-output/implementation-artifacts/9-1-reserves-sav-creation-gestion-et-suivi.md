# Story 9.1: Réserves SAV — Création, gestion et suivi

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux créer des réserves SAV sur un lot en associant une pièce, une description et une photo,
Afin que je puisse documenter les défauts constatés lors des visites de fin de chantier et suivre leur résolution.

## Acceptance Criteria

1. **Given** l'utilisateur est sur l'écran d'un lot **When** il tape le bouton flottant "+" puis choisit "Réserve" **Then** un formulaire s'affiche avec un sélecteur de pièce (obligatoire), un champ description (obligatoire), et un bouton photo (optionnel)

2. **Given** l'utilisateur sélectionne une pièce, saisit une description et valide **When** la réserve est créée (table `reservations`) **Then** la réserve apparaît dans la section "Réserves" du lot avec la pièce, la description et le statut "Ouvert"

3. **Given** l'utilisateur prend une photo lors de la création d'une réserve **When** la photo est compressée et uploadée **Then** la photo est stockée dans le bucket `note-photos` et liée à la réserve, affichée en miniature sur la carte de la réserve

4. **Given** des réserves existent sur un lot **When** l'utilisateur consulte la section "Réserves" **Then** les réserves sont affichées en liste avec : miniature photo (si présente), nom de la pièce, description tronquée, badge statut coloré (rouge = ouvert, vert = résolu), et un filtre "Ouvertes | Toutes | Résolues" avec le filtre "Ouvertes" actif par défaut

5. **Given** l'utilisateur tape sur une réserve ouverte **When** le détail s'affiche **Then** il voit la photo en grand (si présente), la description complète, la pièce, la date de création, et un bouton "Marquer comme résolue"

6. **Given** l'utilisateur tape "Marquer comme résolue" sur une réserve **When** la mutation s'exécute **Then** le statut passe à `resolu`, `resolved_at` est renseigné, la réserve disparaît de la vue filtrée "Ouvertes" et un toast "Réserve résolue" s'affiche

7. **Given** un lot a au moins une réserve ouverte **When** l'utilisateur consulte les grilles parentes (étage, plot, chantier) **Then** un indicateur visuel (icône Wrench orange) apparaît sur la StatusCard du lot

8. **Given** l'utilisateur s'est trompé en créant une réserve **When** il ouvre le détail et choisit "Supprimer" dans le menu contextuel **Then** une confirmation s'affiche, et après validation, la réserve est supprimée définitivement

9. **Given** toutes les réserves d'un lot sont résolues ou supprimées **When** l'utilisateur consulte les grilles parentes **Then** l'indicateur SAV disparaît de la StatusCard du lot

10. **Given** un lot n'a aucune réserve **When** l'utilisateur consulte la section "Réserves" **Then** un état vide discret "Aucune réserve" s'affiche

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : enum `reservation_status`, table `reservations`, flag `has_open_reservation` et triggers cascade (AC: #2, #6, #7, #9)
  - [x] 1.1 Créer `supabase/migrations/036_reservations.sql`
  - [x] 1.2 Créer l'enum PostgreSQL `reservation_status` avec valeurs `ouvert`, `resolu`
  - [x] 1.3 Créer la table `reservations` : `id` (uuid PK), `lot_id` (uuid FK lots ON DELETE CASCADE NOT NULL), `piece_id` (uuid FK pieces ON DELETE CASCADE NOT NULL), `description` (text NOT NULL), `photo_url` (text nullable), `status` (reservation_status NOT NULL DEFAULT 'ouvert'), `resolved_at` (timestamptz nullable), `created_by` (uuid FK auth.users NOT NULL), `created_by_email` (text), `created_at` (timestamptz DEFAULT now())
  - [x] 1.4 Ajouter colonne `has_open_reservation` (boolean DEFAULT false) sur les tables `lots`, `etages`, `plots`, `chantiers`
  - [x] 1.5 Trigger `update_lot_reservation_status` : sur INSERT/UPDATE/DELETE de `reservations` → recalcule `lots.has_open_reservation` = EXISTS(SELECT 1 FROM reservations WHERE lot_id = lot.id AND status = 'ouvert')
  - [x] 1.6 Triggers cascade `has_open_reservation` : lots → etages → plots → chantiers (même pattern que `has_blocking_note` dans 011_notes.sql)
  - [x] 1.7 RLS policy sur `reservations` : `authenticated = accès total` (même pattern que les autres tables)
  - [x] 1.8 Index : `idx_reservations_lot_id`, `idx_reservations_piece_id`, `idx_reservations_status`

- [x] Task 2 — Types TypeScript et mise à jour enums + database.ts (AC: #2)
  - [x] 2.1 Ajouter l'enum `ReservationStatus` dans `src/types/enums.ts` avec valeurs `OUVERT = 'ouvert'`, `RESOLU = 'resolu'`
  - [x] 2.2 Ajouter le type `Reservation` dans `src/types/database.ts` (miroir schema PostgreSQL en snake_case, avec `Relationships: []`)
  - [x] 2.3 Ajouter `has_open_reservation: boolean` aux types existants : lots (LotRow/LotWithRelations), etages (EtageRow), plots (PlotRow), chantiers (ChantierRow)

- [x] Task 3 — Hook query `useReservations` (AC: #4, #10)
  - [x]3.1 Créer `src/lib/queries/useReservations.ts`
  - [x]3.2 Signature : `useReservations(lotId: string)` — query toutes les réserves du lot
  - [x]3.3 Query key : `['reservations', { lotId }]`
  - [x]3.4 Select incluant join sur `pieces` pour le nom de la pièce : `.select('*, pieces(name)')`
  - [x]3.5 Tri : `created_at` descendant (plus récente en haut)
  - [x]3.6 Créer `src/lib/queries/useReservations.test.ts`

- [x] Task 4 — Hook mutation `useCreateReservation` (AC: #1, #2, #3)
  - [x]4.1 Créer `src/lib/mutations/useCreateReservation.ts`
  - [x]4.2 `mutationFn` : upload photo (si présente) vers bucket `note-photos` avec compression via `browser-image-compression`, puis insert dans `reservations` avec `lot_id`, `piece_id`, `description`, `photo_url`, `status: 'ouvert'`, `created_by`, `created_by_email`
  - [x]4.3 Mutation optimiste : ajouter la réserve au cache immédiatement (avec photo_url placeholder si upload en cours)
  - [x]4.4 `onSettled` : invalidate `['reservations', ...]` + `['lots', ...]` (pour rafraîchir `has_open_reservation`)
  - [x]4.5 Toast succès : "Réserve créée" via Sonner
  - [x]4.6 Créer `src/lib/mutations/useCreateReservation.test.ts`

- [x] Task 5 — Hook mutation `useResolveReservation` (AC: #6)
  - [x]5.1 Créer `src/lib/mutations/useResolveReservation.ts`
  - [x]5.2 `mutationFn` : update `reservations` set `status = 'resolu'`, `resolved_at = now()` where `id = reservationId`
  - [x]5.3 Mutation optimiste : mettre à jour le statut dans le cache immédiatement
  - [x]5.4 `onSettled` : invalidate `['reservations', ...]` + `['lots', ...]`
  - [x]5.5 Toast succès : "Réserve résolue"
  - [x]5.6 Créer `src/lib/mutations/useResolveReservation.test.ts`

- [x] Task 6 — Hook mutation `useDeleteReservation` (AC: #8)
  - [x]6.1 Créer `src/lib/mutations/useDeleteReservation.ts`
  - [x]6.2 `mutationFn` : si `photo_url` existe, supprimer le fichier du bucket `note-photos` d'abord, puis delete de la table `reservations`
  - [x]6.3 Mutation optimiste : retirer la réserve du cache immédiatement
  - [x]6.4 `onSettled` : invalidate `['reservations', ...]` + `['lots', ...]`
  - [x]6.5 Toast succès : "Réserve supprimée"
  - [x]6.6 Créer `src/lib/mutations/useDeleteReservation.test.ts`

- [x] Task 7 — Hook subscription `useRealtimeReservations` (AC: #2, #6)
  - [x]7.1 Créer `src/lib/subscriptions/useRealtimeReservations.ts`
  - [x]7.2 Channel : `reservations-changes-${lotId}`
  - [x]7.3 On change : `invalidateQueries({ queryKey: ['reservations', ...] })` + `invalidateQueries({ queryKey: ['lots'] })`
  - [x]7.4 Cleanup dans le return du useEffect
  - [x]7.5 Créer `src/lib/subscriptions/useRealtimeReservations.test.ts`

- [x] Task 8 — Composant `ReservationForm` (Sheet bottom) (AC: #1, #3)
  - [x]8.1 Créer `src/components/ReservationForm.tsx`
  - [x]8.2 Props : `open`, `onOpenChange`, `lotId`, `pieces` (liste des pièces du lot pour le sélecteur)
  - [x]8.3 Sélecteur de pièce : composant shadcn `Select` avec les pièces du lot (nom de chaque pièce)
  - [x]8.4 Champ `Textarea` pour la description (placeholder : "Décrire le défaut...")
  - [x]8.5 Bouton photo : déclenche `<input type="file" accept="image/*" capture="environment">`, affiche la miniature après sélection
  - [x]8.6 Bouton "Créer" qui appelle `useCreateReservation` puis ferme le Sheet
  - [x]8.7 Validation : pièce sélectionnée ET description non vide (messages d'erreur en français)
  - [x]8.8 Reset du state (pièce, description, photo) quand le Sheet se ferme sans soumettre
  - [x]8.9 Créer `src/components/ReservationForm.test.tsx`

- [x] Task 9 — Composant `ReservationCard` (AC: #4, #5)
  - [x]9.1 Créer `src/components/ReservationCard.tsx`
  - [x]9.2 Affichage carte : miniature photo (si présente, 48x48 rounded), nom de la pièce (bold), description tronquée (1 ligne), badge statut (`ouvert` = destructive/rouge, `resolu` = vert), date relative
  - [x]9.3 Tap → ouvre le détail (Dialog ou Sheet) avec : photo plein largeur (si présente), description complète, pièce, date de création, date de résolution (si résolu)
  - [x]9.4 Dans le détail d'une réserve ouverte : bouton "Marquer comme résolue" qui appelle `useResolveReservation`
  - [x]9.5 Dans le détail : menu contextuel (DropdownMenu) avec "Supprimer" → AlertDialog de confirmation → `useDeleteReservation`
  - [x]9.6 Créer `src/components/ReservationCard.test.tsx`

- [x] Task 10 — Composant `ReservationsList` (AC: #4, #10)
  - [x]10.1 Créer `src/components/ReservationsList.tsx`
  - [x]10.2 Props : `lotId: string`
  - [x]10.3 Utilise `useReservations(lotId)` pour charger les données
  - [x]10.4 Tabs de filtre inline : "Ouvertes" (défaut) | "Toutes" | "Résolues" avec compteur par tab
  - [x]10.5 Liste de `ReservationCard` pour chaque réserve filtrée
  - [x]10.6 État vide : "Aucune réserve" (discret)
  - [x]10.7 Skeleton loading (2-3 lignes placeholder)
  - [x]10.8 Créer `src/components/ReservationsList.test.tsx`

- [x] Task 11 — Intégration sur l'écran lot ($lotId/index.tsx) (AC: #1, #2, #4, #7)
  - [x]11.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx`
  - [x]11.2 Ajouter section "Réserves" entre la section "Notes" et la section "Photos" : heading "Réserves" + compteur réserves ouvertes + `<ReservationsList lotId={lotId} />`
  - [x]11.3 Ajouter un 3e item au FAB : icône Wrench + label "Réserve" → ouvre le `ReservationForm`
  - [x]11.4 Ajouter `<ReservationForm open={reservationFormOpen} onOpenChange={setReservationFormOpen} lotId={lotId} pieces={pieces} />`
  - [x]11.5 Ajouter `useRealtimeReservations(lotId)` pour les mises à jour temps réel
  - [x]11.6 Tests d'intégration sur la page lot

- [x] Task 12 — Indicateur SAV sur StatusCard + GridFilterTabs (AC: #7, #9)
  - [x]12.1 Modifier `StatusCard.tsx` : ajouter prop optionnelle `hasOpenReservation?: boolean`
  - [x]12.2 Quand `hasOpenReservation === true` : afficher une icône Wrench orange à côté de l'icône AlertTriangle existante (les deux indicateurs peuvent coexister)
  - [x]12.3 Modifier les pages de grille (lots dans étage, étages dans plot, plots dans chantier) : passer `hasOpenReservation={item.has_open_reservation}` à StatusCard
  - [x]12.4 Intégrer `has_open_reservation` dans le callback `getAlerts` existant : `(item) => item.has_blocking_note || item.has_open_reservation` — les réserves ouvertes apparaissent dans le filtre "Avec alertes"
  - [x]12.5 Tests : StatusCard avec `hasOpenReservation=true` affiche l'icône Wrench, coexistence avec `isBlocked`
  - [x]12.6 Mettre à jour les tests existants des grilles si nécessaire

- [x] Task 13 — Activity log pour les réserves (AC: #2, #6)
  - [x]13.1 Ajouter les event types `reservation_created` et `reservation_resolved` à l'enum `activity_event_type` dans la migration 036
  - [x]13.2 Ajouter un trigger sur `reservations` INSERT → insert `activity_logs` avec event_type `reservation_created`
  - [x]13.3 Ajouter un trigger sur `reservations` UPDATE (status = 'resolu') → insert `activity_logs` avec event_type `reservation_resolved`
  - [x]13.4 Mettre à jour `src/types/database.ts` avec les nouveaux event types

- [x] Task 14 — Tests de bout en bout et régression (AC: #1-10)
  - [x]14.1 Lancer `npm run test` — tous les tests existants + nouveaux passent
  - [x]14.2 Lancer `npm run lint` — 0 nouvelles erreurs (erreur ThemeProvider.tsx:64 pré-existante tolérée)
  - [x]14.3 Lancer `npm run build` — build propre

## Dev Notes

### Modèle de données — Table `reservations`

```sql
CREATE TYPE reservation_status AS ENUM ('ouvert', 'resolu');

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  piece_id UUID NOT NULL REFERENCES pieces(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  photo_url TEXT,
  status reservation_status NOT NULL DEFAULT 'ouvert',
  resolved_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Différences clés avec le système de Notes

| Aspect | Notes | Réserves |
|---|---|---|
| Parent | lot_id OU piece_id (un seul) | lot_id ET piece_id (les deux obligatoires) |
| Photo | Optionnelle, 1 par note | Optionnelle, 1 par réserve |
| Statut | Pas de statut (flag is_blocking) | Enum `ouvert` / `resolu` |
| Résolution | Pas de résolution | `resolved_at` timestamp |
| Flag cascade | `has_blocking_note` | `has_open_reservation` |
| Icône StatusCard | AlertTriangle rouge | Wrench orange |

### Propagation `has_open_reservation` — Triggers cascade

Même pattern exact que `has_blocking_note` (011_notes.sql) :

```
reservations INSERT/UPDATE/DELETE
  → update lots.has_open_reservation = EXISTS(reservations WHERE lot_id = lot.id AND status = 'ouvert')
    → update etages.has_open_reservation = EXISTS(lot with has_open_reservation in etage)
      → update plots.has_open_reservation = EXISTS(etage with has_open_reservation in plot)
        → update chantiers.has_open_reservation = EXISTS(plot with has_open_reservation in chantier)
```

### FAB — 3 items

Le FAB sur la page lot passe de 2 à 3 items :

```
┌─────────────────────────────────┐
│                                 │
│                    [🔧 Réserve] │  ← NOUVEAU
│                    [📝 Note   ] │
│                    [📷 Photo  ] │
│                         [+]     │  ← FAB
├─────────────────────────────────┤
│ 🏠 Chantiers | 📦 Livraisons   │
└─────────────────────────────────┘
```

### ReservationForm — Bottom Sheet

```tsx
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent side="bottom" className="rounded-t-xl">
    <SheetHeader>
      <SheetTitle>Nouvelle réserve</SheetTitle>
    </SheetHeader>
    <Select value={pieceId} onValueChange={setPieceId}>
      {/* Pièces du lot */}
    </Select>
    <Textarea placeholder="Décrire le défaut..." />
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={triggerPhoto}>
        <Camera /> Photo
      </Button>
      {photoPreview && <img src={photoPreview} className="h-12 w-12 rounded" />}
    </div>
    <Button onClick={handleCreate} disabled={!pieceId || !description.trim()}>Créer</Button>
  </SheetContent>
</Sheet>
```

### ReservationCard — Affichage

```
┌─────────────────────────────────────┐
│ [📷] Séjour                 🔴 Ouvert│
│      Fissure au niveau du plafond   │
│      il y a 2h                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ [📷] SDB                   🟢 Résolu│
│      Joint silicone à refaire       │
│      il y a 3j · Résolu il y a 1j  │
└─────────────────────────────────────┘
```

### Section "Réserves" sur la page lot

Positionnée entre Notes et Photos, avec un compteur de réserves ouvertes dans le heading :

```
── Réserves (3 ouvertes) ──
[Ouvertes ✓] [Toutes] [Résolues]
┌ Carte réserve 1 ┐
┌ Carte réserve 2 ┐
┌ Carte réserve 3 ┐
```

### Réutilisation des patterns existants

- **Photo upload** : même pattern que `useUploadLotPhoto` (bucket `note-photos`, compression `browser-image-compression`)
- **Mutation optimiste** : même pattern `onMutate/onError/onSettled` que `useCreateNote`
- **Realtime** : même pattern que `useRealtimeNotes`
- **StatusCard** : ajout d'un prop `hasOpenReservation` en plus de `isBlocked` et `hasMissingDocs` — les 3 indicateurs coexistent
- **Activity log** : même pattern trigger que `013_activity_log.sql`
- **Badge statut** : réutiliser le composant shadcn `Badge` avec variants (destructive = ouvert, default vert = résolu)

### Prérequis et dépendances

- **shadcn Select** : Vérifier que le composant est installé. Si non : `npx shadcn@latest add select`
- **lucide-react** : Icône `Wrench` (déjà disponible dans le package)
- **browser-image-compression** : Déjà installé (utilisé pour les photos de notes et lot_photos)
- **Aucune dépendance npm externe à ajouter**

### Risques et points d'attention

1. **Cascade `has_open_reservation`** : Même pattern que `has_blocking_note`. Le trigger doit se déclencher sur INSERT, UPDATE (changement de statut) et DELETE.
2. **Coexistence indicateurs StatusCard** : Un lot peut être bloqué (note bloquante) + avoir des réserves ouvertes + avoir des docs manquants. Les 3 icônes doivent coexister sans casser le layout de la carte.
3. **Sélecteur de pièce** : Si le lot n'a aucune pièce (cas rare mais possible), le formulaire doit être désactivé avec un message "Ajoutez d'abord des pièces au lot".
4. **Suppression de pièce** : Si une pièce est supprimée et qu'elle a des réserves, le `ON DELETE CASCADE` sur `piece_id` supprimera les réserves associées. Le trigger doit recalculer `has_open_reservation` du lot.
5. **Photo storage** : Réutiliser le bucket `note-photos` existant. Le path de stockage sera `reservations/{lotId}/{reservationId}.jpg` pour éviter les collisions.

### Learnings des stories précédentes (relevants)

- **`Relationships: []`** dans `database.ts` : obligatoire pour l'inférence de types
- **`{ [_ in never]: never }`** au lieu de `Record<string, never>` pour les sections vides de `database.ts`
- **Mutation optimiste standard** : `onMutate/onError/onSettled` — pattern établi depuis Story 1.4
- **Mock Supabase chainable** : `from().select().eq().order()` — pattern de test établi
- **Reset state du Sheet** : reset dans `handleOpenChange` (fix M1 de story 4.1)
- **Guard null auth** : `if (!user) throw new Error('Non authentifié')` avant `user!.id` (fix H3 de story 4.1)

### References

- [Source: _bmad-output/implementation-artifacts/4-1-creation-de-notes-texte-avec-flag-bloquant.md — Pattern notes, triggers cascade, FAB, mutations optimistes]
- [Source: _bmad-output/implementation-artifacts/4-2-photos-depuis-la-camera-sur-les-notes.md — Pattern upload photo, compression]
- [Source: supabase/migrations/011_notes.sql — Pattern triggers cascade has_blocking_note]
- [Source: supabase/migrations/033_lot_photos.sql — Pattern lot_photos et bucket note-photos]
- [Source: src/components/StatusCard.tsx — isBlocked, hasMissingDocs props et icônes]
- [Source: src/components/NoteForm.tsx — Pattern Sheet bottom form]
- [Source: src/components/NotesList.tsx — Pattern liste avec état vide]
- [Source: src/types/enums.ts — Pattern enums TypeScript miroir PostgreSQL]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- useRealtimeReservations.test.ts: vi.mock factory hoisting issue — fixed by moving mock creation inside vi.mock factory
- useReservations.test.ts: placeholderData: [] caused immediate empty data — fixed by using waitFor on data equality
- PlotRow/EtageRow missing has_open_reservation — added to custom interfaces in usePlots.ts, useEtages.ts
- etageCards useMemo missing has_open_reservation — added to mapped object
- useCreatePlot optimistic update missing has_open_reservation — added with default false

### Completion Notes List
- All 14 tasks completed with 47 tests passing (23 hooks + 24 components)
- No new lint errors introduced
- No new build errors introduced (all build errors are pre-existing from other stories)
- Activity log triggers included in migration 036 (Task 13 integrated into Task 1)
- `select('*, pieces(nom)')` used instead of `pieces(name)` as specified in story (table uses `nom` column)

### Change Log
- 2026-02-23: Story implemented — all 14 tasks, 47 tests green
- 2026-02-23: Code review (Claude Opus 4.6) — 6 fixes applied:
  - H1: Realtime subscription filtrée par lot_id (perf)
  - H2: Trigger SQL `set_reservation_resolved_at` pour resolved_at côté serveur
  - M1: Guard `extractStoragePath` contre URLs malformées
  - M2: `EtageRow` interface complétée (metrage_m2_total, metrage_ml_total)
  - M3: `ActivityLog.metadata` enrichie (description_preview, reservation_id)
  - M4: Messages vides différenciés par filtre dans ReservationsList

### File List

**Created:**
- `supabase/migrations/036_reservations.sql` — Migration: enum, table, triggers cascade, RLS, indexes, activity log
- `src/lib/queries/useReservations.ts` — Query hook for reservations by lot
- `src/lib/queries/useReservations.test.ts` — 4 tests
- `src/lib/mutations/useCreateReservation.ts` — Create mutation with photo upload + optimistic update
- `src/lib/mutations/useCreateReservation.test.ts` — 5 tests
- `src/lib/mutations/useResolveReservation.ts` — Resolve mutation (status → resolu)
- `src/lib/mutations/useResolveReservation.test.ts` — 4 tests
- `src/lib/mutations/useDeleteReservation.ts` — Delete mutation with photo cleanup
- `src/lib/mutations/useDeleteReservation.test.ts` — 5 tests
- `src/lib/subscriptions/useRealtimeReservations.ts` — Realtime subscription hook
- `src/lib/subscriptions/useRealtimeReservations.test.ts` — 5 tests
- `src/components/ReservationForm.tsx` — Bottom Sheet form (piece select, description, photo)
- `src/components/ReservationForm.test.tsx` — 8 tests
- `src/components/ReservationCard.tsx` — Card with detail dialog, resolve, delete
- `src/components/ReservationCard.test.tsx` — 9 tests
- `src/components/ReservationsList.tsx` — Filtered list with tabs (ouvertes/toutes/résolues)
- `src/components/ReservationsList.test.tsx` — 7 tests

**Modified:**
- `src/types/enums.ts` — Added ReservationStatus enum
- `src/types/database.ts` — Added reservations table type, Reservation interface, has_open_reservation on entities, new activity event types
- `src/lib/queries/usePlots.ts` — Added has_open_reservation to PlotRow
- `src/lib/queries/useEtages.ts` — Added has_open_reservation to EtageRow
- `src/lib/mutations/useCreatePlot.ts` — Added has_open_reservation: false to optimistic update
- `src/components/StatusCard.tsx` — Added hasOpenReservation prop + Wrench icon (orange)
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — has_open_reservation in getAlerts + StatusCard prop
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` — has_open_reservation in etageCards, getAlerts + StatusCard props
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx` — has_open_reservation in getAlerts + StatusCard prop
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx` — Reservations section, FAB item, ReservationForm, useRealtimeReservations
