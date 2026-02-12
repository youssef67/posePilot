# Story 4.4: Fil d'activité "quoi de neuf"

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux voir les modifications récentes de mes collègues depuis ma dernière visite,
Afin que je sois informé sans avoir à appeler ou demander.

## Acceptance Criteria

1. **Given** des actions ont été effectuées par d'autres utilisateurs (changements de statut, notes, photos) **When** l'utilisateur ouvre l'onglet Activité dans la bottom navigation **Then** un fil chronologique inversé (plus récent en haut) affiche les entrées groupées par jour (Aujourd'hui, Hier, date)

2. **Given** une entrée d'activité s'affiche **When** l'utilisateur la consulte **Then** elle montre : icône du type d'action + initiale de l'auteur + description + cible + timestamp relatif (ex: "Bruno a terminé Séjour — Lot 203, il y a 2h")

3. **Given** des modifications ont eu lieu depuis la dernière visite de l'utilisateur **When** l'utilisateur regarde la bottom navigation **Then** un badge numérique discret apparaît sur l'onglet Activité (pas de popup)

4. **Given** l'utilisateur ouvre le fil d'activité **When** les entrées "nouvelles" sont affichées **Then** un indicateur "Nouveau" les distingue des entrées déjà vues

5. **Given** des actions se produisent en temps réel **When** l'utilisateur est sur le fil d'activité **Then** les nouvelles entrées apparaissent en haut via Supabase Realtime sans rafraîchir

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : table activity_logs + triggers (AC: #1-5)
  - [x] 1.1 Créer `supabase/migrations/013_activity_log.sql`
  - [x] 1.2 Créer enum `activity_event_type` : `task_status_changed`, `note_added`, `photo_added`, `blocking_noted`
  - [x] 1.3 Créer table `activity_logs` : id (UUID PK), event_type, actor_id (UUID ref auth.users), actor_email (text), chantier_id (UUID ref chantiers ON DELETE CASCADE), target_type (text), target_id (UUID), metadata (JSONB), created_at (timestamptz)
  - [x] 1.4 Créer index `idx_activity_logs_created` (created_at DESC) + `idx_activity_logs_chantier` (chantier_id, created_at DESC)
  - [x] 1.5 Créer RLS policies : SELECT + INSERT pour authenticated
  - [x] 1.6 Créer helper function `resolve_chantier_id(p_piece_id UUID)` qui résout piece → lot → etage → plot → chantier
  - [x] 1.7 Créer trigger function `log_task_status_change()` sur taches AFTER UPDATE OF status — insère event `task_status_changed` avec metadata {piece_nom, lot_code, old_status, new_status}
  - [x] 1.8 Créer trigger function `log_note_event()` sur notes AFTER INSERT — insère event `note_added` (ou `blocking_noted` si is_blocking=true) avec metadata {content_preview, lot_code, piece_nom}
  - [x] 1.9 Créer trigger function `log_photo_added()` sur notes AFTER UPDATE OF photo_url — insère event `photo_added` quand photo_url passe de NULL à non-NULL

- [x] Task 2 — Types TypeScript : ActivityLog (AC: #1-5)
  - [x] 2.1 Ajouter `activity_event_type` aux enums dans `src/types/database.ts`
  - [x] 2.2 Ajouter interface `ActivityLog` dans `src/types/database.ts`

- [x] Task 3 — Hook useActivityLogs : query (AC: #1, #2)
  - [x] 3.1 Créer `src/lib/queries/useActivityLogs.ts`
  - [x] 3.2 Query : `supabase.from('activity_logs').select('*').neq('actor_id', userId).order('created_at', { ascending: false }).limit(100)`
  - [x] 3.3 QueryKey : `['activity_logs', { userId }]`
  - [x] 3.4 Créer `src/lib/queries/useActivityLogs.test.ts`

- [x] Task 4 — Hook useUnreadActivityCount : badge count (AC: #3)
  - [x] 4.1 Créer `src/lib/queries/useUnreadActivityCount.ts`
  - [x] 4.2 Query : `supabase.from('activity_logs').select('*', { count: 'exact', head: true }).gt('created_at', lastSeenAt).neq('actor_id', userId)`
  - [x] 4.3 QueryKey : `['activity_logs', 'unread_count', { lastSeenAt, userId }]`
  - [x] 4.4 `lastSeenAt` lu depuis `localStorage.getItem('posePilot_lastActivitySeenAt')` (fallback '1970-01-01')
  - [x] 4.5 Créer `src/lib/queries/useUnreadActivityCount.test.ts`

- [x] Task 5 — Hook useRealtimeActivityLogs : subscription (AC: #5)
  - [x] 5.1 Créer `src/lib/subscriptions/useRealtimeActivityLogs.ts`
  - [x] 5.2 Souscrire à `postgres_changes` sur table `activity_logs` (event: INSERT)
  - [x] 5.3 Invalider les deux query keys : `['activity_logs']` et `['activity_logs', 'unread_count']`
  - [x] 5.4 Créer `src/lib/subscriptions/useRealtimeActivityLogs.test.ts`

- [x] Task 6 — Utilitaires : formatRelativeTime + groupByDay (AC: #1, #2)
  - [x] 6.1 Créer `src/lib/utils/formatRelativeTime.ts` — utiliser `Intl.RelativeTimeFormat('fr')` pour "il y a 2h", "il y a 3 jours", etc.
  - [x] 6.2 Créer `src/lib/utils/groupByDay.ts` — grouper les entrées par "Aujourd'hui", "Hier", date formatée
  - [x] 6.3 Créer `src/lib/utils/formatRelativeTime.test.ts`
  - [x] 6.4 Créer `src/lib/utils/groupByDay.test.ts`

- [x] Task 7 — Composant ActivityFeed (AC: #1, #2, #4)
  - [x] 7.1 Créer `src/components/ActivityFeed.tsx`
  - [x] 7.2 Recevoir props : `entries: ActivityLog[]`, `lastSeenAt: string`
  - [x] 7.3 Grouper les entrées par jour via `groupByDay()`
  - [x] 7.4 Pour chaque entrée : afficher icône type + avatar/initiale auteur + description + cible + timestamp relatif
  - [x] 7.5 Marquer les entrées "Nouveau" si `created_at > lastSeenAt`
  - [x] 7.6 État vide : "Rien de nouveau" avec icône discrète
  - [x] 7.7 Skeleton loading
  - [x] 7.8 Accessibilité : `role="feed"` sur le conteneur, `role="article"` sur chaque entrée
  - [x] 7.9 Créer `src/components/ActivityFeed.test.tsx`

- [x] Task 8 — Route activite.tsx : écran complet (AC: #1, #4, #5)
  - [x] 8.1 Modifier `src/routes/_authenticated/activite.tsx`
  - [x] 8.2 Utiliser `useActivityLogs` + `useRealtimeActivityLogs`
  - [x] 8.3 Lire `lastSeenAt` depuis localStorage au mount
  - [x] 8.4 Mettre à jour `localStorage.setItem('posePilot_lastActivitySeenAt', new Date().toISOString())` au mount (marque les entrées comme vues)
  - [x] 8.5 Passer `entries` et `lastSeenAt` (valeur AVANT mise à jour) au composant ActivityFeed
  - [x] 8.6 Invalider `['activity_logs', 'unread_count']` après mise à jour du lastSeen pour que le badge disparaisse
  - [x] 8.7 Créer `src/routes/_authenticated/activite.test.tsx` dans `src/__tests__/`

- [x] Task 9 — BottomNavigation : badge numérique (AC: #3)
  - [x] 9.1 Modifier `src/components/BottomNavigation.tsx`
  - [x] 9.2 Appeler `useUnreadActivityCount()` pour obtenir le count
  - [x] 9.3 Appeler `useRealtimeActivityLogs()` pour que le badge se mette à jour en temps réel
  - [x] 9.4 Afficher un badge numérique rouge sur l'onglet Activité si count > 0 (cercle rouge absolu 16px, texte blanc 10px, position top-right de l'icône)
  - [x] 9.5 Mettre à jour `src/components/BottomNavigation.test.tsx`

- [x] Task 10 — Tests de régression (AC: #1-5)
  - [x] 10.1 Lancer `npm run test` — tous les tests existants (544+) + nouveaux passent
  - [x] 10.2 Lancer `npm run lint` — 0 nouvelles erreurs (ThemeProvider.tsx:64 pré-existante tolérée)
  - [x] 10.3 Lancer `npm run build` — build propre

## Dev Notes

### Flow principal — Fil d'activité

```
Utilisateur connecté navigue dans l'app
  → Des actions s'effectuent (tap-cycle, notes, photos)
  → Les TRIGGERS PostgreSQL insèrent automatiquement
    dans activity_logs (pas de code frontend nécessaire)
        ↓
  ┌─ Supabase Realtime ─────────────────────────┐
  │  INSERT sur activity_logs détecté             │
  │  → useRealtimeActivityLogs invalide le cache  │
  │  → Badge BottomNavigation se met à jour       │
  │  → Feed se met à jour si page active          │
  └───────────────────────────────────────────────┘
        ↓
  Utilisateur ouvre l'onglet Activité
  → lastSeenAt lu depuis localStorage (AVANT mise à jour)
  → useActivityLogs charge les 100 dernières entrées
    (exclut actor_id = current user)
  → Entrées groupées par jour (Aujourd'hui, Hier, date)
  → Entrées avec created_at > lastSeenAt marquées "Nouveau"
  → localStorage mis à jour avec now() → badge se réinitialise
```

### Architecture de la table activity_logs

```sql
-- supabase/migrations/013_activity_log.sql

-- Enum pour les types d'événements
CREATE TYPE activity_event_type AS ENUM (
  'task_status_changed',   -- Changement de statut d'une tâche
  'note_added',            -- Note texte créée
  'photo_added',           -- Photo ajoutée à une note
  'blocking_noted'         -- Note bloquante signalée
);
-- Note: 'delivery_updated' sera ajouté dans l'Epic 6

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type activity_event_type NOT NULL,
  actor_id UUID NOT NULL,                        -- auth.uid() capturé par le trigger
  actor_email TEXT,                               -- auth.jwt()->>'email' pour affichage
  chantier_id UUID NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,                      -- 'piece', 'lot', 'note'
  target_id UUID NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',           -- Données dénormalisées pour affichage
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour le fil chronologique (query principale)
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);
-- Index pour filtrage par chantier (optionnel futur)
CREATE INDEX idx_activity_logs_chantier ON activity_logs(chantier_id, created_at DESC);

-- RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_select" ON activity_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert" ON activity_logs
  FOR INSERT TO authenticated WITH CHECK (true);
```

### Structure JSONB metadata par event_type

| event_type | metadata |
|---|---|
| `task_status_changed` | `{ "piece_nom": "Séjour", "lot_code": "203", "old_status": "in_progress", "new_status": "done" }` |
| `note_added` | `{ "content_preview": "Fissure au plaf...", "lot_code": "205", "piece_nom": "SDB" }` |
| `photo_added` | `{ "lot_code": "203", "piece_nom": "Séjour" }` |
| `blocking_noted` | `{ "content_preview": "Support fissuré...", "lot_code": "207", "piece_nom": "SDB" }` |

### Trigger functions — Design détaillé

**Helper : résolution du chantier_id depuis une pièce**

```sql
CREATE OR REPLACE FUNCTION resolve_chantier_id_from_piece(p_piece_id UUID)
RETURNS UUID AS $$
  SELECT p.chantier_id
  FROM pieces pc
    JOIN lots l ON pc.lot_id = l.id
    JOIN etages e ON l.etage_id = e.id
    JOIN plots p ON e.plot_id = p.id
  WHERE pc.id = p_piece_id;
$$ LANGUAGE sql STABLE;
```

**Trigger : changement de statut de tâche**

```sql
CREATE OR REPLACE FUNCTION log_task_status_change()
RETURNS trigger AS $$
DECLARE
  v_piece RECORD;
  v_lot RECORD;
  v_chantier_id UUID;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  SELECT nom, lot_id INTO v_piece FROM pieces WHERE id = NEW.piece_id;
  SELECT code INTO v_lot FROM lots WHERE id = v_piece.lot_id;
  v_chantier_id := resolve_chantier_id_from_piece(NEW.piece_id);

  INSERT INTO activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
  VALUES (
    'task_status_changed',
    auth.uid(),
    (auth.jwt()->>'email')::text,
    v_chantier_id,
    'piece',
    NEW.piece_id,
    jsonb_build_object(
      'piece_nom', v_piece.nom,
      'lot_code', v_lot.code,
      'old_status', OLD.status::text,
      'new_status', NEW.status::text
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_task_status
  AFTER UPDATE OF status ON taches
  FOR EACH ROW
  EXECUTE FUNCTION log_task_status_change();
```

**Trigger : note créée (texte + blocage)**

```sql
CREATE OR REPLACE FUNCTION log_note_event()
RETURNS trigger AS $$
DECLARE
  v_lot RECORD;
  v_piece RECORD;
  v_chantier_id UUID;
  v_lot_code TEXT;
  v_piece_nom TEXT;
  v_event activity_event_type;
BEGIN
  -- Résoudre le contexte
  IF NEW.piece_id IS NOT NULL THEN
    SELECT nom, lot_id INTO v_piece FROM pieces WHERE id = NEW.piece_id;
    SELECT code INTO v_lot FROM lots WHERE id = v_piece.lot_id;
    v_chantier_id := resolve_chantier_id_from_piece(NEW.piece_id);
    v_lot_code := v_lot.code;
    v_piece_nom := v_piece.nom;
  ELSIF NEW.lot_id IS NOT NULL THEN
    SELECT code INTO v_lot FROM lots WHERE id = NEW.lot_id;
    -- Résoudre chantier_id depuis le lot
    SELECT p.chantier_id INTO v_chantier_id
    FROM lots l JOIN etages e ON l.etage_id = e.id JOIN plots p ON e.plot_id = p.id
    WHERE l.id = NEW.lot_id;
    v_lot_code := v_lot.code;
    v_piece_nom := NULL;
  END IF;

  v_event := CASE WHEN NEW.is_blocking THEN 'blocking_noted' ELSE 'note_added' END;

  INSERT INTO activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
  VALUES (
    v_event,
    COALESCE(auth.uid(), NEW.created_by::uuid),
    COALESCE((auth.jwt()->>'email')::text, NEW.created_by_email),
    v_chantier_id,
    CASE WHEN NEW.piece_id IS NOT NULL THEN 'piece' ELSE 'lot' END,
    COALESCE(NEW.piece_id, NEW.lot_id),
    jsonb_build_object(
      'content_preview', LEFT(NEW.content, 50),
      'lot_code', v_lot_code,
      'piece_nom', v_piece_nom
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_note_event
  AFTER INSERT ON notes
  FOR EACH ROW
  EXECUTE FUNCTION log_note_event();
```

**Trigger : photo ajoutée**

```sql
CREATE OR REPLACE FUNCTION log_photo_added()
RETURNS trigger AS $$
DECLARE
  v_lot RECORD;
  v_piece RECORD;
  v_chantier_id UUID;
  v_lot_code TEXT;
  v_piece_nom TEXT;
BEGIN
  IF OLD.photo_url IS NOT NULL OR NEW.photo_url IS NULL THEN RETURN NEW; END IF;

  IF NEW.piece_id IS NOT NULL THEN
    SELECT nom, lot_id INTO v_piece FROM pieces WHERE id = NEW.piece_id;
    SELECT code INTO v_lot FROM lots WHERE id = v_piece.lot_id;
    v_chantier_id := resolve_chantier_id_from_piece(NEW.piece_id);
    v_lot_code := v_lot.code;
    v_piece_nom := v_piece.nom;
  ELSIF NEW.lot_id IS NOT NULL THEN
    SELECT code INTO v_lot FROM lots WHERE id = NEW.lot_id;
    SELECT p.chantier_id INTO v_chantier_id
    FROM lots l JOIN etages e ON l.etage_id = e.id JOIN plots p ON e.plot_id = p.id
    WHERE l.id = NEW.lot_id;
    v_lot_code := v_lot.code;
    v_piece_nom := NULL;
  END IF;

  INSERT INTO activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
  VALUES (
    'photo_added',
    COALESCE(auth.uid(), NEW.created_by::uuid),
    COALESCE((auth.jwt()->>'email')::text, NEW.created_by_email),
    v_chantier_id,
    CASE WHEN NEW.piece_id IS NOT NULL THEN 'piece' ELSE 'lot' END,
    COALESCE(NEW.piece_id, NEW.lot_id),
    jsonb_build_object(
      'lot_code', v_lot_code,
      'piece_nom', v_piece_nom
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_photo_added
  AFTER UPDATE OF photo_url ON notes
  FOR EACH ROW
  EXECUTE FUNCTION log_photo_added();
```

### Interface TypeScript — ActivityLog

```typescript
// Dans src/types/database.ts

export type ActivityEventType = 'task_status_changed' | 'note_added' | 'photo_added' | 'blocking_noted'

export interface ActivityLog {
  id: string
  event_type: ActivityEventType
  actor_id: string
  actor_email: string | null
  chantier_id: string
  target_type: string          // 'piece' | 'lot'
  target_id: string
  metadata: {
    piece_nom?: string | null
    lot_code?: string | null
    old_status?: string        // Pour task_status_changed
    new_status?: string        // Pour task_status_changed
    content_preview?: string   // Pour note_added / blocking_noted
  }
  created_at: string
}
```

### Hook useActivityLogs — Pattern

```typescript
// src/lib/queries/useActivityLogs.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ActivityLog } from '@/types/database'

export function useActivityLogs(userId: string) {
  return useQuery({
    queryKey: ['activity_logs', { userId }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .neq('actor_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as unknown as ActivityLog[]
    },
    enabled: !!userId,
  })
}
```

### Hook useUnreadActivityCount — Badge

```typescript
// src/lib/queries/useUnreadActivityCount.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const LAST_SEEN_KEY = 'posePilot_lastActivitySeenAt'

export function getLastSeenAt(): string {
  return localStorage.getItem(LAST_SEEN_KEY) || '1970-01-01T00:00:00.000Z'
}

export function setLastSeenAt(date: string): void {
  localStorage.setItem(LAST_SEEN_KEY, date)
}

export function useUnreadActivityCount(userId: string) {
  const lastSeenAt = getLastSeenAt()

  return useQuery({
    queryKey: ['activity_logs', 'unread_count', { lastSeenAt, userId }],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', lastSeenAt)
        .neq('actor_id', userId)
      if (error) throw error
      return count ?? 0
    },
    enabled: !!userId,
  })
}
```

### Hook useRealtimeActivityLogs — Subscription

```typescript
// src/lib/subscriptions/useRealtimeActivityLogs.ts
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeActivityLogs() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('activity-logs-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['activity_logs'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
```

### Utilitaire formatRelativeTime

```typescript
// src/lib/utils/formatRelativeTime.ts
const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

const DIVISIONS: { amount: number; name: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, name: 'second' },
  { amount: 60, name: 'minute' },
  { amount: 24, name: 'hour' },
  { amount: 7, name: 'day' },
  { amount: 4.34524, name: 'week' },
  { amount: 12, name: 'month' },
  { amount: Number.POSITIVE_INFINITY, name: 'year' },
]

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  let duration = (date.getTime() - Date.now()) / 1000

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.name)
    }
    duration /= division.amount
  }
  return rtf.format(Math.round(duration), 'year')
}
```

### Utilitaire groupByDay

```typescript
// src/lib/utils/groupByDay.ts

export interface DayGroup<T> {
  label: string        // "Aujourd'hui", "Hier", "10 février 2026"
  entries: T[]
}

export function groupByDay<T extends { created_at: string }>(items: T[]): DayGroup<T>[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)

  const groups = new Map<string, T[]>()

  for (const item of items) {
    const itemDate = new Date(item.created_at)
    const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate())

    let label: string
    if (itemDay.getTime() === today.getTime()) {
      label = "Aujourd'hui"
    } else if (itemDay.getTime() === yesterday.getTime()) {
      label = 'Hier'
    } else {
      label = itemDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    }

    const existing = groups.get(label) || []
    existing.push(item)
    groups.set(label, existing)
  }

  return Array.from(groups.entries()).map(([label, entries]) => ({ label, entries }))
}
```

### Composant ActivityFeed — Anatomie visuelle

```
┌──────────────────────────────────────┐
│ Activité                         h1  │
├──────────────────────────────────────┤
│                                      │
│ Aujourd'hui                          │  ← header jour
│ ┌──────────────────────────────────┐ │
│ │ 🟢 B  Bruno a terminé Séjour    │ │  ← icône statut + avatar initiale
│ │       Lot 203 · il y a 2h  [NEW]│ │  ← cible + timestamp + badge Nouveau
│ ├──────────────────────────────────┤ │
│ │ 💬 B  Bruno a ajouté une note   │ │
│ │       Lot 205 · il y a 4h  [NEW]│ │
│ └──────────────────────────────────┘ │
│                                      │
│ Hier                                 │
│ ┌──────────────────────────────────┐ │
│ │ 📷 B  Bruno a ajouté une photo  │ │
│ │       Lot 203 · hier            │ │
│ ├──────────────────────────────────┤ │
│ │ 🔺 B  Bruno a signalé blocage   │ │
│ │       Lot 207 · hier            │ │
│ └──────────────────────────────────┘ │
│                                      │
└──────────────────────────────────────┘
```

**Mapping icônes par event_type :**

| event_type | Icône lucide-react | Couleur |
|---|---|---|
| `task_status_changed` (→ done) | `CheckCircle2` | `#10B981` vert |
| `task_status_changed` (→ in_progress) | `Clock` | `#F59E0B` orange |
| `task_status_changed` (→ not_started) | `Circle` | `#9CA3AF` gris |
| `note_added` | `MessageSquare` | `#3B82F6` bleu |
| `photo_added` | `Camera` | `#3B82F6` bleu |
| `blocking_noted` | `AlertTriangle` | `#EF4444` rouge |

**Avatar auteur :** Cercle 32px avec initiale (première lettre de l'email avant @), fond `muted`, texte `foreground`.

### Description texte par event_type

Construire la description dans un utilitaire `getActivityDescription(entry: ActivityLog): string` :

| event_type | Template | Exemple |
|---|---|---|
| `task_status_changed` (→ done) | `"{email} a terminé {piece_nom}"` | "bruno@... a terminé Séjour" |
| `task_status_changed` (→ in_progress) | `"{email} a commencé {piece_nom}"` | "bruno@... a commencé SDB" |
| `task_status_changed` (→ not_started) | `"{email} a réinitialisé {piece_nom}"` | "bruno@... a réinitialisé Séjour" |
| `note_added` | `"{email} a ajouté une note"` | "bruno@... a ajouté une note" |
| `photo_added` | `"{email} a ajouté une photo"` | "bruno@... a ajouté une photo" |
| `blocking_noted` | `"{email} a signalé un blocage"` | "bruno@... a signalé un blocage" |

**Ligne cible :** `"Lot {lot_code}"` + ` · {piece_nom}` si présent + ` · {formatRelativeTime(created_at)}`

**Nom d'affichage auteur :** Extraire le prénom depuis l'email (partie avant `@`, première lettre majuscule). Si pas de `@`, utiliser l'email tel quel. Afficher en gras.

### Badge BottomNavigation — Implémentation

```
┌─────────────────────────────────────┐
│  🏠      🚚       🔔        ⚙️     │
│ Chantiers Livraisons Activité  Réglages
│                     ●3               │  ← badge rouge, count 3
└─────────────────────────────────────┘
```

Le badge est un `<span>` positionné en absolute par rapport à l'icône :

```typescript
// Dans BottomNavigation.tsx — rendu conditionnel
{to === '/activite' && unreadCount > 0 && (
  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-medium text-white">
    {unreadCount > 99 ? '99+' : unreadCount}
  </span>
)}
```

Nécessite d'ajouter `relative` au conteneur du lien pour le positionnement absolu.

**Intégration du hook dans BottomNavigation :**
- `useUnreadActivityCount(userId)` — obtient le count
- `useRealtimeActivityLogs()` — maintient le count à jour en temps réel
- `userId` obtenu depuis `useAuth()` ou le context d'authentification du projet

### Mécanisme "last seen" — Détail

```
                    Temps →
  ──────────|──────────|──────────────────
            lastSeen   now
            (stocké)   (visite)

  ← déjà vu →  ← NOUVEAU →
```

1. **Au mount de la page Activité** :
   - Lire `lastSeenAt` depuis localStorage (valeur AVANT mise à jour)
   - Stocker cette valeur pour le rendu (distinguer "Nouveau" vs vu)
   - Immédiatement mettre à jour localStorage avec `new Date().toISOString()`
   - Invalider `['activity_logs', 'unread_count']` pour que le badge se réinitialise

2. **Important — Ordre des opérations** :
   ```typescript
   // Dans activite.tsx
   const [lastSeenAtSnapshot] = useState(() => getLastSeenAt()) // Capture au mount

   useEffect(() => {
     setLastSeenAt(new Date().toISOString())
     queryClient.invalidateQueries({ queryKey: ['activity_logs', 'unread_count'] })
   }, [queryClient])
   ```

3. Le `useState(() => ...)` avec initializer function capture la valeur UNE seule fois au mount. Le `useEffect` met à jour le localStorage après le premier rendu.

### Accessibilité

- Conteneur feed : `<div role="feed" aria-label="Fil d'activité">`
- Chaque entrée : `<article aria-label="Bruno a terminé Séjour — Lot 203, il y a 2h">`
- Badge BottomNavigation : `aria-label="Activité, 3 nouvelles notifications"`
- Headers de jour : `<h2>` sémantique pour structurer le flux

### Auth context — Obtenir le userId

Vérifier comment le userId est accessible dans le projet. Options probables :
- `useAuth()` hook → `auth.user?.id`
- `supabase.auth.getUser()` → `data.user.id`
- `AuthContext` → `user.id`

Le dev agent doit inspecter `src/contexts/AuthContext.tsx` ou l'équivalent pour trouver le bon pattern. **Ne pas appeler `supabase.auth.getUser()` dans un hook TanStack Query** — c'est async et crée un appel réseau à chaque render. Préférer le context qui stocke l'utilisateur en mémoire.

### Project Structure Notes

**Nouveaux fichiers (11) :**
- `supabase/migrations/013_activity_log.sql` — Migration table + triggers
- `src/lib/queries/useActivityLogs.ts` + `.test.ts` — Query feed
- `src/lib/queries/useUnreadActivityCount.ts` + `.test.ts` — Query badge count
- `src/lib/subscriptions/useRealtimeActivityLogs.ts` + `.test.ts` — Subscription
- `src/lib/utils/formatRelativeTime.ts` + `.test.ts` — Formatage temps relatif
- `src/lib/utils/groupByDay.ts` + `.test.ts` — Groupement par jour
- `src/components/ActivityFeed.tsx` + `.test.tsx` — Composant feed

**Fichiers modifiés (3) :**
- `src/types/database.ts` — Ajout ActivityLog interface + enum
- `src/routes/_authenticated/activite.tsx` — De stub à écran complet
- `src/components/BottomNavigation.tsx` — Ajout badge numérique

### Prérequis et dépendances

- **Aucune dépendance npm externe à ajouter** — `Intl.RelativeTimeFormat`, lucide-react (déjà installé)
- **lucide-react** : Icônes `CheckCircle2`, `Clock`, `Circle`, `MessageSquare`, `Camera`, `AlertTriangle` (toutes déjà dans le package)
- **Tables existantes requises** : `taches` (status column), `notes` (content, is_blocking, photo_url), `pieces`, `lots`, `etages`, `plots`, `chantiers`
- **auth.uid() et auth.jwt()** doivent être disponibles dans les triggers (fonctionne avec Supabase Client SDK via PostgREST)

### Risques et points d'attention

1. **`auth.uid()` dans les triggers** : Fonctionne quand la mutation vient via le SDK Supabase (PostgREST injecte le JWT dans la session PostgreSQL). Ne fonctionne PAS pour les modifications directes en base (admin, seed). Mitigation : `COALESCE(auth.uid(), NEW.created_by::uuid)` dans les triggers sur `notes` (qui ont déjà `created_by`). Pour `taches`, si `auth.uid()` est null, le trigger pourrait ne pas insérer d'activity_log — acceptable pour les seeds/admin.

2. **`SECURITY DEFINER` sur les trigger functions** : Nécessaire pour que les triggers puissent lire les tables référencées même si RLS les bloquerait normalement. Les triggers s'exécutent avec les droits du créateur de la fonction, pas de l'utilisateur courant.

3. **Volume de données** : Avec 2-3 utilisateurs, la table activity_logs restera petite. Pas besoin de pagination infinie ni de purge automatique pour le MVP.

4. **Ordre des triggers** : Les triggers d'agrégation (010_aggregation_triggers.sql) s'exécutent AUSSI sur `taches` UPDATE. L'ordre d'exécution dépend de l'ordre alphabétique des noms de trigger. S'assurer que le trigger d'activité ne dépend pas de l'état agrégé.

5. **Tests jsdom** : `localStorage` est disponible en jsdom (vitest). `Intl.RelativeTimeFormat` est disponible dans Node 12+. Pas de problème de polyfill attendu.

6. **BottomNavigation avec hooks** : Actuellement BottomNavigation est un composant pur sans hooks. L'ajout de `useUnreadActivityCount` et `useRealtimeActivityLogs` le rend stateful. S'assurer qu'il est bien wrappé dans les providers nécessaires (QueryClientProvider, AuthContext).

7. **Race condition lastSeen** : Si l'utilisateur ouvre le fil d'activité et qu'une nouvelle entrée arrive via Realtime PENDANT le mount, elle sera marquée "Nouvelle" car `lastSeenAtSnapshot` a été capturé avant. C'est le comportement voulu.

8. **Pre-existing test failures** : 5 pwa-html.test.ts, 5 pwa-config.test.ts, 6 hasPointerCapture jsdom issue — ne pas s'en inquiéter. Erreurs TS pré-existantes dans variantes.$varianteId.tsx et nouveau.tsx — non liées.

### Learnings des stories précédentes (relevants)

- **Mock supabase chainable API** : `from → select → eq → order → neq → limit → gt` — chaque appel retourne un mock avec la méthode suivante. Pattern établi dans tous les tests de queries/mutations.
- **`data as unknown as Type[]`** : Le cast est nécessaire car `Database.Tables` est `Record<string, never>` — ne fournit pas d'inférence de type sur les requêtes.
- **Realtime subscription pattern** : `supabase.channel(name).on('postgres_changes', {...}, callback).subscribe()` + cleanup `supabase.removeChannel(channel)`.
- **Route tests** : Utiliser `createRouter` + `createMemoryHistory` + `RouterProvider` + `QueryClientProvider` + `AuthContext.Provider`.
- **Quand du texte apparaît dans heading ET BottomNavigation** (ex: "Activité"): utiliser `findByRole('heading', { name: 'Activité' })` dans les tests.
- **ThemeProvider.tsx:64 lint error** : pré-existant, ne pas corriger.
- **`useLayoutEffect` vs `useEffect`** : Utiliser `useLayoutEffect` uniquement si le DOM doit être synchrone avant le paint. Pour le lastSeen localStorage update, `useEffect` suffit.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 4.4, Epic 4, FR33, FR34]
- [Source: _bmad-output/planning-artifacts/prd.md — FR33 (fil "quoi de neuf"), FR34 (indicateur discret), NFR10 (sync < 5s)]
- [Source: _bmad-output/planning-artifacts/architecture.md — activity_log table, Supabase Realtime subscriptions, mutations optimistes, TanStack Query keys convention, naming patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — ActivityFeed composant (§7), BottomNavigation badge (§5), types d'entrées, accessibilité role="feed"]
- [Source: _bmad-output/implementation-artifacts/4-3-partage-photo-contextualise.md — Pattern useShareContext (useMatches + queryClient), tests mock navigator/fetch]
- [Source: _bmad-output/implementation-artifacts/epic-3-retro-2026-02-10.md — Prérequis Epic 4 §3 "architecture du fil d'activité"]
- [Source: src/lib/queries/useNotes.ts — Pattern query hook existant]
- [Source: src/lib/subscriptions/useRealtimeNotes.ts — Pattern subscription hook existant]
- [Source: src/components/BottomNavigation.tsx — Structure tabs actuelle, pas de badge]
- [Source: src/routes/_authenticated/activite.tsx — Stub route existant]
- [Source: src/types/database.ts — Types existants, pattern interface + enum]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- ActivityFeed.test: fixed Skeleton import (inlined pulse divs), fixed "Séjour" duplicate text query (regex)
- activite.test: renderRoute needed auth with user — extended route-test-utils to accept auth overrides

### Completion Notes List

- Task 1: Migration SQL 013_activity_log.sql — enum, table, 2 index, RLS, helper function, 3 trigger functions (taches status, notes insert, notes photo_url update). SECURITY DEFINER on triggers. COALESCE fallbacks for notes triggers.
- Task 2: ActivityEventType type alias + ActivityLog interface in database.ts
- Task 3: useActivityLogs hook — excludes current user, ordered desc, limit 100. 4 tests.
- Task 4: useUnreadActivityCount hook + getLastSeenAt/setLastSeenAt helpers. localStorage with fallback. 8 tests.
- Task 5: useRealtimeActivityLogs subscription — INSERT on activity_logs, invalidates ['activity_logs'] prefix. 5 tests.
- Task 6: formatRelativeTime (Intl.RelativeTimeFormat fr) + groupByDay (Aujourd'hui/Hier/date). 13 tests.
- Task 7: ActivityFeed component — grouped entries, icons per event_type, author initials, "Nouveau" badge, empty/skeleton states, role="feed"/role="article". 12 tests.
- Task 8: activite.tsx route — full implementation with lastSeenAt snapshot pattern, realtime subscription, badge reset on mount. 4 tests.
- Task 9: BottomNavigation — added useUnreadActivityCount + useRealtimeActivityLogs, red badge with 99+ cap, aria-label for accessibility. 9 tests (4 new).
- Task 10: Regression — 598 tests pass, 0 new lint errors, 0 new build errors. All 16 failures are pre-existing (pwa-config 5, pwa-html 5, hasPointerCapture 6).

### Change Log

- 2026-02-11: Story 4.4 implemented — all 10 tasks complete, 55 new tests added, 0 regressions.
- 2026-02-11: Code review (AI) — 1 HIGH, 4 MEDIUM, 3 LOW findings. Fixed H1+M4 (SQL trigger NULL guards), M1 (RLS INSERT policy removed), M2 (duplicate piece_nom in target line), M3 (File List counts). All 55 tests pass post-fix. Status → done.

### File List

**New files (14):**
- `supabase/migrations/013_activity_log.sql`
- `src/lib/queries/useActivityLogs.ts`
- `src/lib/queries/useActivityLogs.test.ts`
- `src/lib/queries/useUnreadActivityCount.ts`
- `src/lib/queries/useUnreadActivityCount.test.ts`
- `src/lib/subscriptions/useRealtimeActivityLogs.ts`
- `src/lib/subscriptions/useRealtimeActivityLogs.test.ts`
- `src/lib/utils/formatRelativeTime.ts`
- `src/lib/utils/formatRelativeTime.test.ts`
- `src/lib/utils/groupByDay.ts`
- `src/lib/utils/groupByDay.test.ts`
- `src/components/ActivityFeed.tsx`
- `src/components/ActivityFeed.test.tsx`
- `src/__tests__/activite.test.tsx`

**Modified files (5):**
- `src/types/database.ts` — added ActivityEventType enum + ActivityLog interface
- `src/routes/_authenticated/activite.tsx` — from stub to full activity feed screen
- `src/components/BottomNavigation.tsx` — added unread badge with realtime updates
- `src/components/BottomNavigation.test.tsx` — added badge tests, wrapped in providers
- `src/test/route-test-utils.tsx` — extended renderRoute to accept auth overrides
