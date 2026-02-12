# Story 3.3: Grilles de cartes colorées et agrégation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux voir l'avancement par des couleurs à chaque niveau hiérarchique,
Afin que je comprenne d'un coup d'oeil la situation sans lire un seul chiffre.

## Acceptance Criteria

1. **Given** des tâches ont été mises à jour dans des pièces **When** les triggers PostgreSQL s'exécutent en cascade **Then** l'avancement est agrégé automatiquement : pièce → lot → étage → plot → chantier (colonnes `progress_done`, `progress_total`)

2. **Given** l'utilisateur consulte la grille de lots d'un étage **When** les cartes s'affichent **Then** chaque StatusCard a une barre de statut latérale colorée (gris si 0%, orange si partiel, vert si 100%) et affiche le compteur "X/Y"

3. **Given** l'utilisateur consulte les étages d'un plot **When** les cartes s'affichent **Then** chaque carte d'étage reflète l'agrégation de ses lots

4. **Given** l'utilisateur consulte les plots d'un chantier **When** les cartes s'affichent **Then** chaque carte de plot reflète l'agrégation de ses étages

5. **Given** un autre utilisateur modifie des tâches **When** les changements sont propagés via Supabase Realtime **Then** les cartes se mettent à jour en temps réel (invalidation TanStack Query) sans rafraîchir

## Tasks / Subtasks

- [x] Task 1 — Migration PostgreSQL : colonnes progress et triggers d'agrégation (AC: #1)
  - [x] 1.1 Créer `supabase/migrations/010_aggregation_triggers.sql`
  - [x] 1.2 Ajouter colonnes `progress_done INTEGER NOT NULL DEFAULT 0` et `progress_total INTEGER NOT NULL DEFAULT 0` aux tables : `pieces`, `lots`, `etages`, `plots`
  - [x] 1.3 Créer les fonctions trigger de cascade (5 niveaux) : `update_piece_progress()`, `update_lot_progress()`, `update_etage_progress()`, `update_plot_progress()`, `update_chantier_progress()`
  - [x] 1.4 Créer les triggers associés sur chaque table : `taches` → `pieces`, `pieces` → `lots`, `lots` → `etages`, `etages` → `plots`, `plots` → `chantiers`
  - [x] 1.5 Backfill les données existantes : requêtes UPDATE pour recalculer les progress de toutes les lignes existantes (bottom-up)

- [x] Task 2 — Mise à jour des types TypeScript (AC: #1)
  - [x] 2.1 Ajouter `progress_done` et `progress_total` aux types Row/Insert/Update de `pieces`, `lots`, `etages`, `plots` dans `src/types/database.ts`

- [x] Task 3 — Extraire `computeStatus` en utilitaire partagé (AC: #2, #3, #4)
  - [x] 3.1 Créer `src/lib/utils/computeStatus.ts` en extrayant la fonction depuis `$lotId/index.tsx`
  - [x] 3.2 Signature : `computeStatus(done: number, total: number): keyof typeof STATUS_COLORS`
  - [x] 3.3 Mettre à jour `$lotId/index.tsx` pour importer depuis le fichier partagé
  - [x] 3.4 Créer `src/lib/utils/computeStatus.test.ts`

- [x] Task 4 — Grille de lots colorée dans la page étage (AC: #2)
  - [x] 4.1 Modifier `$etageId/index.tsx` : lire `progress_done` et `progress_total` depuis les données `useLots()` (déjà inclus via `SELECT *`)
  - [x] 4.2 StatusCard de chaque lot : `statusColor={STATUS_COLORS[computeStatus(lot.progress_done, lot.progress_total)]}` + `indicator={`${lot.progress_done}/${lot.progress_total}`}`
  - [x] 4.3 Supprimer le `TODO(story 3.3)` existant (ligne ~123)
  - [x] 4.4 Mettre à jour `$etageId/index.test.tsx` : vérifier l'affichage du compteur "X/Y" et la couleur correcte

- [x] Task 5 — Grille d'étages colorée dans la page plot (AC: #3)
  - [x] 5.1 Modifier `plots.$plotId/index.tsx` : lire `progress_done` et `progress_total` depuis `useEtages()` (inclus via `SELECT *`)
  - [x] 5.2 StatusCard de chaque étage : `statusColor={STATUS_COLORS[computeStatus(etage.progress_done, etage.progress_total)]}` + `indicator={`${etage.progress_done}/${etage.progress_total}`}`
  - [x] 5.3 Supprimer le `TODO(story 3.3)` existant (ligne ~428)
  - [x] 5.4 Mettre à jour `plots.$plotId/index.test.tsx` : vérifier indicateurs d'avancement

- [x] Task 6 — Grille de plots colorée dans la page chantier (AC: #4)
  - [x] 6.1 Modifier `$chantierId/index.tsx` : lire `progress_done` et `progress_total` depuis `usePlots()`
  - [x] 6.2 Si la page utilise StatusCard pour les plots : ajouter couleur + indicateur "X/Y"
  - [x] 6.3 Si pas de StatusCards plots actuellement : ajouter une grille de StatusCards pour les plots avec agrégation

- [x] Task 7 — Mise à jour de la page lot : pièces avec progress serveur (AC: #2)
  - [x] 7.1 Modifier `$lotId/index.tsx` : utiliser `piece.progress_done` et `piece.progress_total` (depuis `usePieces()`, SELECT * inclut les nouvelles colonnes)
  - [x] 7.2 Remplacer le calcul client-side des tâches par les colonnes progress serveur pour les StatusCards de pièces
  - [x] 7.3 Supprimer l'ancienne `computeStatus` locale (remplacée par l'import partagé en Task 3)

- [x] Task 8 — Subscriptions Realtime pour propagation multi-utilisateur (AC: #5)
  - [x] 8.1 Créer `src/lib/subscriptions/useRealtimeLots.ts` : subscribe table `lots`, invalide `['lots', plotId]`
  - [x] 8.2 Créer `src/lib/subscriptions/useRealtimeEtages.ts` : subscribe table `etages`, invalide `['etages', plotId]`
  - [x] 8.3 Créer `src/lib/subscriptions/useRealtimePlots.ts` : subscribe table `plots`, invalide `['plots', chantierId]`
  - [x] 8.4 Créer `src/lib/subscriptions/useRealtimePieces.ts` : subscribe table `pieces`, invalide `['pieces', lotId]`
  - [x] 8.5 Intégrer `useRealtimeLots(plotId)` dans la page étage (`$etageId/index.tsx`)
  - [x] 8.6 Intégrer `useRealtimeEtages(plotId)` dans la page plot (`plots.$plotId/index.tsx`)
  - [x] 8.7 Intégrer `useRealtimePlots(chantierId)` dans la page chantier (`$chantierId/index.tsx`)
  - [x] 8.8 Intégrer `useRealtimePieces(lotId)` dans la page lot (`$lotId/index.tsx`)

- [x] Task 9 — Tests des hooks Realtime (AC: #5)
  - [x] 9.1 Créer `src/lib/subscriptions/useRealtimeLots.test.ts` (même pattern que `useRealtimeChantiers.test.ts`)
  - [x] 9.2 Créer `src/lib/subscriptions/useRealtimeEtages.test.ts`
  - [x] 9.3 Créer `src/lib/subscriptions/useRealtimePlots.test.ts`
  - [x] 9.4 Créer `src/lib/subscriptions/useRealtimePieces.test.ts`

- [x] Task 10 — Tests d'intégration et vérification 0 régression (AC: #1-5)
  - [x] 10.1 Vérifier que tous les tests existants (353+) passent sans régression
  - [x] 10.2 Mettre à jour `navigation-hierarchy.test.tsx` si nécessaire pour vérifier les indicateurs d'avancement
  - [x] 10.3 Lint clean (0 nouvelles erreurs)

## Dev Notes

### Contexte architectural

- **Agrégation serveur via triggers PostgreSQL** : les colonnes `progress_done` / `progress_total` sont maintenues automatiquement par des triggers en cascade. Zéro calcul côté client pour l'avancement.
- **Cascade complète** : `taches` → `pieces` → `lots` → `etages` → `plots` → `chantiers` — chaque UPDATE d'un niveau déclenche le recalcul du parent.
- **Supabase Realtime** : quand le trigger cascade s'exécute dans une transaction, toutes les tables touchées émettent un événement `postgres_changes`. Souscrire à la table qu'on affiche suffit.
- **Queries inchangées** : `useLots`, `useEtages`, `usePlots`, `usePieces` utilisent `SELECT *` — les nouvelles colonnes `progress_done`/`progress_total` sont incluses automatiquement. **Aucune modification de query nécessaire.**
- **Pattern de données** : TanStack Query hooks dans les composants (PAS de `loader`/`beforeLoad`)
- **Convention Supabase** : toutes les colonnes en `snake_case`, miroir exact dans `database.ts`

### Migration PostgreSQL — `010_aggregation_triggers.sql`

#### Colonnes à ajouter

```sql
-- pieces : agrège depuis taches
ALTER TABLE pieces ADD COLUMN progress_done INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pieces ADD COLUMN progress_total INTEGER NOT NULL DEFAULT 0;

-- lots : agrège depuis pieces
ALTER TABLE lots ADD COLUMN progress_done INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lots ADD COLUMN progress_total INTEGER NOT NULL DEFAULT 0;

-- etages : agrège depuis lots
ALTER TABLE etages ADD COLUMN progress_done INTEGER NOT NULL DEFAULT 0;
ALTER TABLE etages ADD COLUMN progress_total INTEGER NOT NULL DEFAULT 0;

-- plots : agrège depuis etages
ALTER TABLE plots ADD COLUMN progress_done INTEGER NOT NULL DEFAULT 0;
ALTER TABLE plots ADD COLUMN progress_total INTEGER NOT NULL DEFAULT 0;

-- chantiers : colonnes DÉJÀ EXISTANTES (progress_done, progress_total) — ne PAS re-créer
```

#### Trigger functions — Pattern exact

Chaque fonction suit le même pattern : recompter les enfants et UPDATE le parent.

```sql
-- Niveau 1 : taches → pieces
CREATE OR REPLACE FUNCTION update_piece_progress()
RETURNS TRIGGER AS $$
DECLARE
  target_piece_id UUID;
BEGIN
  -- Déterminer le piece_id affecté
  IF TG_OP = 'DELETE' THEN
    target_piece_id := OLD.piece_id;
  ELSE
    target_piece_id := NEW.piece_id;
  END IF;

  -- Aussi recalculer l'ancien parent si piece_id a changé (UPDATE)
  IF TG_OP = 'UPDATE' AND OLD.piece_id IS DISTINCT FROM NEW.piece_id THEN
    UPDATE pieces SET
      progress_done = (SELECT COUNT(*) FROM taches WHERE piece_id = OLD.piece_id AND status = 'done'),
      progress_total = (SELECT COUNT(*) FROM taches WHERE piece_id = OLD.piece_id)
    WHERE id = OLD.piece_id;
  END IF;

  UPDATE pieces SET
    progress_done = (SELECT COUNT(*) FROM taches WHERE piece_id = target_piece_id AND status = 'done'),
    progress_total = (SELECT COUNT(*) FROM taches WHERE piece_id = target_piece_id)
  WHERE id = target_piece_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Niveau 2 : pieces → lots
CREATE OR REPLACE FUNCTION update_lot_progress()
RETURNS TRIGGER AS $$
DECLARE
  target_lot_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_lot_id := OLD.lot_id;
  ELSE
    target_lot_id := NEW.lot_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.lot_id IS DISTINCT FROM NEW.lot_id THEN
    UPDATE lots SET
      progress_done = COALESCE((SELECT SUM(progress_done) FROM pieces WHERE lot_id = OLD.lot_id), 0),
      progress_total = COALESCE((SELECT SUM(progress_total) FROM pieces WHERE lot_id = OLD.lot_id), 0)
    WHERE id = OLD.lot_id;
  END IF;

  UPDATE lots SET
    progress_done = COALESCE((SELECT SUM(progress_done) FROM pieces WHERE lot_id = target_lot_id), 0),
    progress_total = COALESCE((SELECT SUM(progress_total) FROM pieces WHERE lot_id = target_lot_id), 0)
  WHERE id = target_lot_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Niveau 3 : lots → etages
CREATE OR REPLACE FUNCTION update_etage_progress()
RETURNS TRIGGER AS $$
DECLARE
  target_etage_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_etage_id := OLD.etage_id;
  ELSE
    target_etage_id := NEW.etage_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.etage_id IS DISTINCT FROM NEW.etage_id THEN
    UPDATE etages SET
      progress_done = COALESCE((SELECT SUM(progress_done) FROM lots WHERE etage_id = OLD.etage_id), 0),
      progress_total = COALESCE((SELECT SUM(progress_total) FROM lots WHERE etage_id = OLD.etage_id), 0)
    WHERE id = OLD.etage_id;
  END IF;

  UPDATE etages SET
    progress_done = COALESCE((SELECT SUM(progress_done) FROM lots WHERE etage_id = target_etage_id), 0),
    progress_total = COALESCE((SELECT SUM(progress_total) FROM lots WHERE etage_id = target_etage_id), 0)
  WHERE id = target_etage_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Niveau 4 : etages → plots
CREATE OR REPLACE FUNCTION update_plot_progress()
RETURNS TRIGGER AS $$
DECLARE
  target_plot_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_plot_id := OLD.plot_id;
  ELSE
    target_plot_id := NEW.plot_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.plot_id IS DISTINCT FROM NEW.plot_id THEN
    UPDATE plots SET
      progress_done = COALESCE((SELECT SUM(progress_done) FROM etages WHERE plot_id = OLD.plot_id), 0),
      progress_total = COALESCE((SELECT SUM(progress_total) FROM etages WHERE plot_id = OLD.plot_id), 0)
    WHERE id = OLD.plot_id;
  END IF;

  UPDATE plots SET
    progress_done = COALESCE((SELECT SUM(progress_done) FROM etages WHERE plot_id = target_plot_id), 0),
    progress_total = COALESCE((SELECT SUM(progress_total) FROM etages WHERE plot_id = target_plot_id), 0)
  WHERE id = target_plot_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Niveau 5 : plots → chantiers
CREATE OR REPLACE FUNCTION update_chantier_progress()
RETURNS TRIGGER AS $$
DECLARE
  target_chantier_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_chantier_id := OLD.chantier_id;
  ELSE
    target_chantier_id := NEW.chantier_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.chantier_id IS DISTINCT FROM NEW.chantier_id THEN
    UPDATE chantiers SET
      progress_done = COALESCE((SELECT SUM(progress_done) FROM plots WHERE chantier_id = OLD.chantier_id), 0),
      progress_total = COALESCE((SELECT SUM(progress_total) FROM plots WHERE chantier_id = OLD.chantier_id), 0)
    WHERE id = OLD.chantier_id;
  END IF;

  UPDATE chantiers SET
    progress_done = COALESCE((SELECT SUM(progress_done) FROM plots WHERE chantier_id = target_chantier_id), 0),
    progress_total = COALESCE((SELECT SUM(progress_total) FROM plots WHERE chantier_id = target_chantier_id), 0)
  WHERE id = target_chantier_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

#### Triggers à créer

```sql
-- Niveau 1 : taches → pieces
CREATE TRIGGER trg_taches_progress
  AFTER INSERT OR UPDATE OF status OR DELETE ON taches
  FOR EACH ROW EXECUTE FUNCTION update_piece_progress();

-- Niveau 2 : pieces → lots (déclenché quand progress change)
CREATE TRIGGER trg_pieces_progress
  AFTER INSERT OR UPDATE OF progress_done, progress_total OR DELETE ON pieces
  FOR EACH ROW EXECUTE FUNCTION update_lot_progress();

-- Niveau 3 : lots → etages
CREATE TRIGGER trg_lots_progress
  AFTER INSERT OR UPDATE OF progress_done, progress_total OR DELETE ON lots
  FOR EACH ROW EXECUTE FUNCTION update_etage_progress();

-- Niveau 4 : etages → plots
CREATE TRIGGER trg_etages_progress
  AFTER INSERT OR UPDATE OF progress_done, progress_total OR DELETE ON etages
  FOR EACH ROW EXECUTE FUNCTION update_plot_progress();

-- Niveau 5 : plots → chantiers
CREATE TRIGGER trg_plots_progress
  AFTER INSERT OR UPDATE OF progress_done, progress_total OR DELETE ON plots
  FOR EACH ROW EXECUTE FUNCTION update_chantier_progress();
```

#### Backfill des données existantes

```sql
-- Bottom-up : pieces d'abord, puis lots, etages, plots, chantiers
UPDATE pieces p SET
  progress_done = (SELECT COUNT(*) FROM taches t WHERE t.piece_id = p.id AND t.status = 'done'),
  progress_total = (SELECT COUNT(*) FROM taches t WHERE t.piece_id = p.id);

UPDATE lots l SET
  progress_done = COALESCE((SELECT SUM(progress_done) FROM pieces p WHERE p.lot_id = l.id), 0),
  progress_total = COALESCE((SELECT SUM(progress_total) FROM pieces p WHERE p.lot_id = l.id), 0);

UPDATE etages e SET
  progress_done = COALESCE((SELECT SUM(progress_done) FROM lots l WHERE l.etage_id = e.id), 0),
  progress_total = COALESCE((SELECT SUM(progress_total) FROM lots l WHERE l.etage_id = e.id), 0);

UPDATE plots pl SET
  progress_done = COALESCE((SELECT SUM(progress_done) FROM etages e WHERE e.plot_id = pl.id), 0),
  progress_total = COALESCE((SELECT SUM(progress_total) FROM etages e WHERE e.plot_id = pl.id), 0);

UPDATE chantiers c SET
  progress_done = COALESCE((SELECT SUM(progress_done) FROM plots pl WHERE pl.chantier_id = c.id), 0),
  progress_total = COALESCE((SELECT SUM(progress_total) FROM plots pl WHERE pl.chantier_id = c.id), 0);
```

### Mise à jour `database.ts` — Colonnes à ajouter

Les tables `pieces`, `lots`, `etages`, `plots` doivent avoir `progress_done` et `progress_total` dans leurs types Row, Insert, et Update.

**Attention :** `chantiers` a DÉJÀ ces colonnes dans le type — ne pas dupliquer.

```typescript
// Exemple pour la table pieces (même pattern pour lots, etages, plots)
pieces: {
  Row: {
    id: string
    lot_id: string
    nom: string
    progress_done: number    // NOUVEAU
    progress_total: number   // NOUVEAU
    created_at: string
  }
  Insert: {
    id?: string
    lot_id: string
    nom: string
    progress_done?: number   // NOUVEAU (DEFAULT 0 en DB)
    progress_total?: number  // NOUVEAU (DEFAULT 0 en DB)
    created_at?: string
  }
  Update: {
    id?: string
    lot_id?: string
    nom?: string
    progress_done?: number   // NOUVEAU
    progress_total?: number  // NOUVEAU
    created_at?: string
  }
  Relationships: [...]
}
```

### `computeStatus` — Utilitaire partagé

Extraire depuis `$lotId/index.tsx` vers `src/lib/utils/computeStatus.ts` :

```typescript
import { STATUS_COLORS } from '@/components/StatusCard'

export function computeStatus(done: number, total: number): keyof typeof STATUS_COLORS {
  if (total === 0) return 'NOT_STARTED'
  if (done === total) return 'DONE'
  if (done > 0) return 'IN_PROGRESS'
  return 'NOT_STARTED'
}
```

Utilisé dans : page étage (lots), page plot (étages), page chantier (plots), page lot (pièces).

### Mise à jour des StatusCards — Pattern exact par niveau

#### Page étage (`$etageId/index.tsx`) — Grille de lots

```typescript
// AVANT (story 3.1) :
// TODO(story 3.3): compute status from aggregated task data via server triggers
statusColor={STATUS_COLORS.NOT_STARTED}

// APRÈS :
import { computeStatus } from '@/lib/utils/computeStatus'

// Pour chaque lot dans lotsOfEtage :
<StatusCard
  title={lot.code}
  subtitle={lot.variantes?.nom ?? ''}
  statusColor={STATUS_COLORS[computeStatus(lot.progress_done, lot.progress_total)]}
  indicator={`${lot.progress_done}/${lot.progress_total}`}
  badge={lot.is_tma ? 'TMA' : undefined}
  onClick={() => navigate({ to: '...' })}
/>
```

#### Page plot (`plots.$plotId/index.tsx`) — Grille d'étages

```typescript
// AVANT (story 3.1) :
// TODO(story 3.3): compute status from aggregated task data via server triggers
// Currently NOT_STARTED because useLots only returns piece counts, not task statuses
statusColor={STATUS_COLORS.NOT_STARTED}

// APRÈS :
import { computeStatus } from '@/lib/utils/computeStatus'

// Pour chaque étage :
<StatusCard
  title={etage.nom}
  subtitle={`${lotsCount} lot${lotsCount > 1 ? 's' : ''}`}
  statusColor={STATUS_COLORS[computeStatus(etage.progress_done, etage.progress_total)]}
  indicator={`${etage.progress_done}/${etage.progress_total}`}
  onClick={() => navigate({ to: '...' })}
/>
```

#### Page chantier (`$chantierId/index.tsx`) — Grille de plots

```typescript
import { computeStatus } from '@/lib/utils/computeStatus'

// Pour chaque plot :
<StatusCard
  title={plot.nom}
  statusColor={STATUS_COLORS[computeStatus(plot.progress_done, plot.progress_total)]}
  indicator={`${plot.progress_done}/${plot.progress_total}`}
  onClick={() => navigate({ to: '...' })}
/>
```

#### Page lot (`$lotId/index.tsx`) — Grille de pièces

```typescript
// AVANT : calcul client depuis piece.taches
const doneTaches = piece.taches.filter(t => t.status === 'done').length
const totalTaches = piece.taches.length

// APRÈS : colonnes serveur
<StatusCard
  title={piece.nom}
  subtitle={`${piece.progress_done}/${piece.progress_total} tâche${piece.progress_total > 1 ? 's' : ''}`}
  statusColor={STATUS_COLORS[computeStatus(piece.progress_done, piece.progress_total)]}
  indicator={`${piece.progress_done}/${piece.progress_total}`}
  onClick={() => navigate({ to: '...' })}
/>
```

**Note :** La page pièce (`$pieceId.tsx`) continue d'utiliser `piece.taches[]` pour le TapCycleButton — elle n'est PAS modifiée.

### Hooks Realtime — Pattern exact

Suivre le pattern existant de `useRealtimeChantiers.ts` :

```typescript
// src/lib/subscriptions/useRealtimeLots.ts
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeLots(plotId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(`lots-changes-${plotId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lots' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [plotId, queryClient])
}
```

**Même pattern pour :** `useRealtimeEtages(plotId)`, `useRealtimePlots(chantierId)`, `useRealtimePieces(lotId)`.

**Noms de channels uniques :** inclure l'ID parent pour éviter les collisions (`lots-changes-${plotId}`).

**Intégration dans les pages :**

```typescript
// Page étage — en haut du composant
useRealtimeLots(plotId)

// Page plot
useRealtimeEtages(plotId)

// Page chantier
useRealtimePlots(chantierId)

// Page lot
useRealtimePieces(lotId)
```

### Tests Realtime — Pattern exact (copier `useRealtimeChantiers.test.ts`)

```typescript
// Pattern de test pour chaque hook Realtime
describe('useRealtimeLots', () => {
  it('should subscribe to lots channel', () => { ... })
  it('should invalidate lots query on change', () => { ... })
  it('should cleanup channel on unmount', () => { ... })
})
```

Mock chainable : `channel() → on() → subscribe()` — même setup que le test existant.

### Queries existantes — Pas de modification nécessaire

| Hook | `SELECT *` ? | progress_done/total inclus ? |
|------|-------------|------------------------------|
| `useEtages(plotId)` | Oui (`.select('*')`) | Oui, automatiquement |
| `useLots(plotId)` | Oui (`.select('*, etages(nom), ...')`) | Oui, automatiquement |
| `usePieces(lotId)` | Oui (`.select('*, taches(*)')`) | Oui, automatiquement |
| `usePlots(chantierId)` | Oui (`.select('*')`) | Oui, automatiquement |
| `useChantiers(status)` | Oui (`.select('*')`) | Déjà existant |

**Aucune modification de query requise.** Le `SELECT *` récupère automatiquement les nouvelles colonnes après la migration.

### Interaction avec les mutations optimistes existantes

`useUpdateTaskStatus` (story 3.2) fait un optimistic update sur `['pieces', lotId]` en modifiant `tache.status` dans le cache. Après cette story :

1. L'optimistic update continue de fonctionner pour le TapCycleButton (page pièce)
2. Le trigger met à jour `pieces.progress_done` en DB
3. `onSettled` invalide `['pieces', lotId]` → le cache se rafraîchit avec les colonnes progress serveur
4. Le hook Realtime `useRealtimePieces` gère le cas multi-utilisateur (autre user modifie une tâche)

**Aucune modification de `useUpdateTaskStatus` requise.**

### Impact sur la page d'accueil (`_authenticated/index.tsx`)

La page d'accueil utilise déjà `chantier.progress_done` et `chantier.progress_total` (existants depuis la migration 003). La fonction `getChantierStatusColor()` fonctionne déjà. Après les triggers, ces colonnes seront maintenues automatiquement — **aucune modification sur la page d'accueil.**

Le hook `useRealtimeChantiers()` est déjà intégré et gère les mises à jour temps réel des chantiers.

### Couleurs de statut — Rappel

```typescript
STATUS_COLORS = {
  NOT_STARTED: '#64748B',  // gris — 0% (progress_done === 0 et progress_total === 0 ou > 0)
  IN_PROGRESS: '#F59E0B',  // orange — partiel (0 < progress_done < progress_total)
  DONE: '#10B981',          // vert — 100% (progress_done === progress_total et > 0)
  BLOCKED: '#EF4444',       // rouge — non utilisé dans cette story
}
```

En theme tokens CSS (story 3.2) : `--tap-not-started`, `--tap-in-progress`, `--tap-done` — utilisés par TapCycleButton uniquement. Les StatusCards utilisent les hex directement via `STATUS_COLORS`.

### Grammaire française pour les indicateurs

L'indicateur "X/Y" est numérique et universel — pas de traduction nécessaire. Le format est simplement `${progress_done}/${progress_total}`.

Pour les subtitles contextuels (si nécessaire) :
- "0 lot" / "1 lot" / "2 lots"
- "0 tâche" / "1 tâche" / "2 tâches"

### Project Structure Notes

- Nouvelle migration `supabase/migrations/010_aggregation_triggers.sql`
- Nouveau utilitaire `src/lib/utils/computeStatus.ts` + test
- 4 nouveaux hooks Realtime dans `src/lib/subscriptions/` + tests
- Modifications de 4 pages existantes (étage, plot, lot, chantier) — pas de nouvelles routes
- Types mis à jour dans `src/types/database.ts`
- Pas de conflit détecté avec les routes ou composants existants
- Pas de nouveau composant UI — réutilisation de StatusCard existant

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.3, Epic 3]
- [Source: _bmad-output/planning-artifacts/architecture.md — Aggregation triggers, Data Flow, StatusCard specs]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — StatusCard anatomie, Palette sémantique, Cascade d'agrégation, Grid layouts]
- [Source: _bmad-output/planning-artifacts/prd.md — FR11 (grilles colorées), FR12 (agrégation automatique)]
- [Source: src/components/StatusCard.tsx — STATUS_COLORS, StatusCard props]
- [Source: src/lib/subscriptions/useRealtimeChantiers.ts — Pattern Realtime de référence]
- [Source: src/lib/mutations/useUpdateTaskStatus.ts — Mutation optimiste existante]
- [Source: src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx — computeStatus() existant]
- [Source: supabase/migrations/003_chantiers.sql — progress_done/progress_total existants]
- [Source: supabase/migrations/007_lots.sql — Schema taches/pieces/lots/etages]

### Learnings des stories précédentes (Epic 2 + Stories 3.1, 3.2)

- **StatusCard réutilisable** : passer `statusColor`, `indicator`, `badge`, `onClick` — ne PAS créer de nouveau composant
- **Mock Supabase** : chaînable `from().select().eq().order()` chacun retourne mock avec méthode suivante
- **Mock Realtime** : chaînable `channel().on().subscribe()` — voir `useRealtimeChantiers.test.ts` comme pattern exact
- **Skeleton loading** : utiliser `StatusCardSkeleton` existant pour tous les états de chargement
- **computeStatus()** : déjà testé dans `$lotId/index.tsx` — extraire plutôt que réécrire
- **Lint** : erreur préexistante `ThemeProvider.tsx:64` (react-refresh) — ne pas corriger dans cette story
- **TypeScript strict** : `Relationships: []` OBLIGATOIRE dans database.ts (sinon inference casse)
- **`Record<string, never>` interdit** dans database.ts — utiliser `{ [_ in never]: never }` pour les sections vides
- **BreadcrumbNav** : shallowest-first pour les params (TanStack Router propage les params enfants aux parents)
- **Tests route** : quand un texte apparaît dans heading + breadcrumb, utiliser `findByRole('heading', { name: /.../ })`
- **Grammar française** : "0 lot" (pas "0 lots"), "1 tâche" (pas "1 tâches")

### Prérequis Supabase — CRITIQUE

**Supabase Realtime requiert que la réplication soit activée** sur chaque table qu'on souhaite écouter. Dans le Dashboard Supabase :
1. Aller dans **Database → Replication**
2. Activer la réplication pour les tables : `lots`, `etages`, `plots`, `pieces`
3. La table `chantiers` est probablement déjà activée (story 1.5 utilise `useRealtimeChantiers`)

Sans cette activation, les hooks `useRealtimeLots`, `useRealtimeEtages`, etc. **ne recevront aucun événement**.

### Performance des triggers en cascade

Lors de la création d'un lot via `create_lot_with_inheritance` (migration 007), la fonction insère N pièces × M tâches. Chaque INSERT tache déclenche la cascade complète. Pour un lot typique (5-10 pièces, 3-10 tâches), cela génère ~50-100 trigger firings — **acceptable pour l'échelle MVP** (chantiers de construction).

Si des problèmes de performance apparaissent à l'avenir, envisager :
- Désactiver temporairement les triggers dans la fonction `create_lot_with_inheritance` et faire un seul UPDATE bulk à la fin
- Ou utiliser `pg_trigger_depth()` pour ne cascader qu'au niveau final

**Pour cette story : ne PAS optimiser prématurément. Implémenter les triggers simples.**

### Informations techniques récentes

- **Supabase Realtime** : `postgres_changes` events sont émis APRÈS le commit de la transaction — les triggers cascade sont donc tous terminés quand l'événement arrive au client
- **Triggers conditionnels** : `AFTER INSERT OR UPDATE OF col1, col2 OR DELETE` — le `OF` limite le déclenchement aux colonnes spécifiées (évite les boucles infinies)
- **TanStack Query v5** : `invalidateQueries({ queryKey: [...] })` invalide toutes les queries dont la clé commence par le préfixe donné
- **Supabase channels** : noms uniques obligatoires — si 2 composants utilisent le même nom de channel, le second écrase le premier

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

### Completion Notes List

- All 10 tasks and 47 subtasks completed
- 385/385 tests passing across 58 test files — 0 regressions
- Lint clean (0 new errors; pre-existing ThemeProvider.tsx:64 unchanged)
- Regression fix: added progress_done/progress_total to navigation-hierarchy.test.tsx mocks
- computeStatus extracted from $lotId/index.tsx to shared utility, reused across 4 pages
- Client-side task counting replaced by server-side progress columns in lot page
- 4 realtime hooks created following useRealtimeChantiers pattern

### Senior Developer Review (AI) — 2026-02-09

**Reviewer:** Claude Opus 4.6 (adversarial code review)

**Issues found:** 3 HIGH, 3 MEDIUM, 1 LOW

**Fixes applied (3 HIGH + 1 MEDIUM):**

1. **[HIGH] FIXED** — Page plot lot cards hardcoded `NOT_STARTED` → replaced with `computeStatus(lot.progress_done, lot.progress_total)` + added `indicator` prop
2. **[HIGH] FIXED** — Page plot missing `useRealtimeLots(plotId)` → added import + call for realtime lot updates
3. **[HIGH → became test fix] FIXED** — Added 2 tests for lot card progress indicators and status colors in plot page test
4. **[MEDIUM] FIXED** — Existing etage progress test used `getByText('0/4')` which now collides with lot cards → updated to `getAllByText`

**Issues accepted / deferred:**

5. **[MEDIUM] Accepted** — Variante cards show `NOT_STARTED` status bar — correct behavior since variantes are templates without progress tracking
6. **[MEDIUM] Deferred** — Chantier page test missing color/realtime coverage — low risk, plot cards work correctly
7. **[LOW] Deferred** — Realtime hook tests only cover happy path — acceptable for MVP

**Post-review results:** 385/385 tests passing, lint clean (0 new errors)

### Change Log

- Task 1: Created `supabase/migrations/010_aggregation_triggers.sql` — ALTER TABLE x4, 5 trigger functions, 5 triggers, backfill queries
- Task 2: Updated `src/types/database.ts` — progress_done/progress_total on plots, etages, lots, pieces (Row/Insert/Update)
- Task 3: Created `src/lib/utils/computeStatus.ts` + `computeStatus.test.ts` (6 tests); updated $lotId/index.tsx import
- Task 4: Updated `$etageId/index.tsx` + test — colored lot cards with progress indicators
- Task 5: Updated `plots.$plotId/index.tsx` + test — colored etage cards with progress indicators
- Task 6: Updated `$chantierId/index.tsx` + test — colored plot cards with progress indicators
- Task 7: Updated `$lotId/index.tsx` + test — server-side progress for piece cards
- Task 8: Created 4 realtime hooks + integrated into 4 pages
- Task 9: Created 4 realtime test files (20 tests total)
- Task 10: Full regression pass + navigation-hierarchy mock fix + lint clean
- Code Review Fix: Lot cards on plot page — computeStatus + indicator + useRealtimeLots + 2 tests added

### File List

**New files:**
- `supabase/migrations/010_aggregation_triggers.sql`
- `src/lib/utils/computeStatus.ts`
- `src/lib/utils/computeStatus.test.ts`
- `src/lib/subscriptions/useRealtimeLots.ts`
- `src/lib/subscriptions/useRealtimeLots.test.ts`
- `src/lib/subscriptions/useRealtimeEtages.ts`
- `src/lib/subscriptions/useRealtimeEtages.test.ts`
- `src/lib/subscriptions/useRealtimePlots.ts`
- `src/lib/subscriptions/useRealtimePlots.test.ts`
- `src/lib/subscriptions/useRealtimePieces.ts`
- `src/lib/subscriptions/useRealtimePieces.test.ts`

**Modified files:**
- `src/types/database.ts` — progress_done/progress_total on 4 tables
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — computeStatus + useRealtimePlots
- `src/routes/_authenticated/chantiers/$chantierId/index.test.tsx` — progress mocks + test
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` — computeStatus + useRealtimeEtages
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.test.tsx` — progress mocks + test
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx` — computeStatus + useRealtimeLots
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.test.tsx` — progress mocks + tests
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx` — shared computeStatus + useRealtimePieces + server progress
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.test.tsx` — progress mocks
- `src/__tests__/navigation-hierarchy.test.tsx` — progress mocks added to fix regression
