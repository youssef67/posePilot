# Story 2.4: Création de lots avec héritage automatique

Status: done
Story ID: 2.4
Story Key: 2-4-creation-de-lots-avec-heritage-automatique
Epic: 2 — Configuration & Structure de chantier
Date: 2026-02-09
Dependencies: Story 2.1 (done), Story 2.2 (done), Story 2.3 (done)
FRs: FR17, FR19, FR23

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux créer des lots assignés à une variante et un étage,
Afin que chaque lot soit immédiatement configuré avec ses pièces, tâches et documents.

## Acceptance Criteria (BDD)

### AC1: Créer un lot avec code libre, variante et étage

**Given** un plot a au moins une variante
**When** l'utilisateur crée un lot avec un code libre (ex: "203"), choisit une variante et un étage
**Then** le lot est créé (tables `etages` si nécessaire, `lots`) avec le code, la variante et l'étage

### AC2: Identifiants d'étage libres

**Given** l'utilisateur utilise un identifiant d'étage libre (ex: "RDC", "1", "Combles")
**When** il crée le lot
**Then** l'étage est créé ou réutilisé avec l'identifiant saisi

### AC3: Héritage automatique des pièces, tâches et documents

**Given** un lot vient d'être créé
**When** le système applique l'héritage
**Then** le lot hérite automatiquement des pièces, tâches et documents de sa variante (copie dans tables `pieces`, `taches`, `lot_documents`)

### AC4: Vérification de l'héritage

**Given** l'héritage est appliqué
**When** l'utilisateur consulte le lot
**Then** les pièces, tâches et documents hérités sont visibles immédiatement

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : tables `etages`, `lots`, `pieces`, `taches`, `lot_documents` + fonction d'héritage (AC: #1, #2, #3)
  - [x] 1.1 Créer `supabase/migrations/007_lots.sql` avec les 5 tables
  - [x] 1.2 Table `etages` : `id uuid PK`, `plot_id uuid FK → plots(id) ON DELETE CASCADE`, `nom text NOT NULL`, `created_at timestamptz`
  - [x] 1.3 Contrainte d'unicité sur `etages(plot_id, lower(nom))` — empêche les doublons d'étage par plot
  - [x] 1.4 Table `lots` : `id uuid PK`, `etage_id uuid FK → etages(id) ON DELETE CASCADE`, `variante_id uuid FK → variantes(id)` (PAS de CASCADE — la variante est un template), `plot_id uuid FK → plots(id) ON DELETE CASCADE` (dénormalisation pour requêtes et unicité), `code text NOT NULL`, `is_tma boolean NOT NULL DEFAULT false`, `created_at timestamptz`
  - [x] 1.5 Contrainte d'unicité sur `lots(plot_id, lower(code))` — un code de lot est unique par plot (pas par étage)
  - [x] 1.6 Table `pieces` : `id uuid PK`, `lot_id uuid FK → lots(id) ON DELETE CASCADE`, `nom text NOT NULL`, `created_at timestamptz`
  - [x] 1.7 Table `taches` : `id uuid PK`, `piece_id uuid FK → pieces(id) ON DELETE CASCADE`, `nom text NOT NULL`, `status task_status NOT NULL DEFAULT 'not_started'`, `created_at timestamptz`
  - [x] 1.8 Table `lot_documents` : `id uuid PK`, `lot_id uuid FK → lots(id) ON DELETE CASCADE`, `nom text NOT NULL`, `is_required boolean NOT NULL DEFAULT false`, `created_at timestamptz`
  - [x] 1.9 Index sur toutes les FK : `idx_etages_plot_id`, `idx_lots_etage_id`, `idx_lots_plot_id`, `idx_lots_variante_id`, `idx_pieces_lot_id`, `idx_taches_piece_id`, `idx_lot_documents_lot_id`
  - [x] 1.10 Appliquer RLS sur les 5 tables
  - [x] 1.11 Créer la fonction PostgreSQL `create_lot_with_inheritance(p_code, p_variante_id, p_etage_nom, p_plot_id)` — transaction atomique qui crée l'étage si nécessaire, le lot, copie les pièces, crée les tâches, copie les documents

- [x] Task 2 — Types TypeScript (AC: #1, #2, #3)
  - [x] 2.1 Ajouter les 5 tables dans `src/types/database.ts` avec Row/Insert/Update et `Relationships: [...]`
  - [x] 2.2 Ajouter la fonction `create_lot_with_inheritance` dans `Database.public.Functions`
  - [x] 2.3 CRITIQUE : Inclure `Relationships` pour chaque FK — sans elles, supabase-js v2 ne peut pas inférer les types

- [x] Task 3 — Hooks queries (AC: #4)
  - [x] 3.1 Créer `src/lib/queries/useEtages.ts` — `useQuery` avec key `['etages', plotId]`, charge tous les étages du plot triés par `created_at ASC`
  - [x] 3.2 Créer `src/lib/queries/useLots.ts` — `useQuery` avec key `['lots', plotId]`, charge tous les lots du plot avec relations `etages(nom)`, `variantes(nom)`, `pieces(count)` triés par `etages.nom ASC, code ASC`
  - [x] 3.3 Créer `src/lib/queries/usePieces.ts` — `useQuery` avec key `['pieces', lotId]`, charge toutes les pièces du lot avec `taches(*)` imbriquées, triées par `created_at ASC`
  - [x] 3.4 Créer `src/lib/queries/useLotDocuments.ts` — `useQuery` avec key `['lot-documents', lotId]`, charge tous les documents du lot triés par `created_at ASC`
  - [x] 3.5 Tests co-localisés pour chaque hook

- [x] Task 4 — Hook mutation création de lot (AC: #1, #2, #3)
  - [x] 4.1 Créer `src/lib/mutations/useCreateLot.ts` — `useMutation` qui appelle `supabase.rpc('create_lot_with_inheritance', { p_code, p_variante_id, p_etage_nom, p_plot_id })`, invalide `['lots', plotId]` et `['etages', plotId]` on settled
  - [x] 4.2 Tests co-localisés

- [x] Task 5 — Section lots sur la page plot index (AC: #1, #2)
  - [x] 5.1 Installer le composant `Select` de shadcn/ui : `npx shadcn@latest add select`
  - [x] 5.2 Dans `plots.$plotId/index.tsx`, ajouter une section "Lots" sous la section "Variantes"
  - [x] 5.3 Afficher les lots via `useLots(plotId)` groupés par étage — chaque lot en StatusCard avec code, variante, nombre de pièces
  - [x] 5.4 État vide : "Aucun lot créé — Ajoutez des lots pour lancer la pose."
  - [x] 5.5 Bouton "Ajouter un lot" → ouvre un Sheet avec 3 champs : code (Input), variante (Select), étage (Input avec datalist des étages existants)
  - [x] 5.6 Validation : code requis + unique dans le plot, variante requise, étage requis
  - [x] 5.7 Prévention doublons code : vérification case-insensitive côté client avant appel RPC
  - [x] 5.8 Après création : toast "Lot créé" + navigation vers la page du lot
  - [x] 5.9 Taper sur un lot → naviguer vers `plots.$plotId/lots.$lotId`

- [x] Task 6 — Page lot : détail lecture seule avec héritage visible (AC: #4)
  - [x] 6.1 Créer `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/lots.$lotId.tsx` — Page de détail du lot
  - [x] 6.2 Header : bouton retour + "Lot {code}" + info "Type A · Étage 2"
  - [x] 6.3 Section "Pièces" : liste des pièces héritées, chaque pièce affiche son nom + compteur de tâches "X tâches · 0/X fait" (lecture seule)
  - [x] 6.4 Pièces expandables : taper sur une pièce → voir la liste des tâches avec leur statut (toutes `not_started` à la création)
  - [x] 6.5 Section "Documents" : liste des documents hérités avec indicateur "Obligatoire" ou "Optionnel" (lecture seule)
  - [x] 6.6 État vide pièces/documents : textes appropriés si aucun héritage (variante sans pièces/docs)

- [x] Task 7 — Tests (toutes AC)
  - [x] 7.1 Tests section lots sur la page plot index : affichée, état vide, bouton ajouter, formulaire 3 champs, validation, création réussie, prévention doublons
  - [x] 7.2 Tests page lot détail : affiche pièces héritées, tâches visibles en expand, documents affichés, infos lot correctes
  - [x] 7.3 Vérifier que tous les tests existants passent (230 pré-existants + nouveaux = 0 régressions)
  - [x] 7.4 Lint clean (sauf pre-existing ThemeProvider warning)

## Dev Notes

### Architecture & Patterns obligatoires

- **Supabase Client SDK direct** — pas d'API custom, pas d'Edge Functions. L'appel `.rpc()` est du SDK direct. [Source: architecture.md#API & Communication Patterns]
- **Transaction atomique via RPC** — l'héritage DOIT être transactionnel. Si la copie d'une pièce échoue, rien n'est créé. C'est pourquoi on utilise une fonction PostgreSQL plutôt que N appels client. [Source: architecture.md#Data Architecture]
- **Query keys convention** — `['etages', plotId]`, `['lots', plotId]`, `['pieces', lotId]`, `['lot-documents', lotId]` [Source: architecture.md#Communication Patterns]
- **Types snake_case** — miroir exact du schéma PostgreSQL [Source: architecture.md#Naming Patterns]
- **Messages en français** — tous les labels, erreurs, toasts [Source: architecture.md#Enforcement Guidelines]
- **shadcn/ui avant custom** — installer Select pour le formulaire [Source: architecture.md#Enforcement Guidelines]
- **Pas de barrel files** — imports directs [Source: architecture.md#Structure Patterns]
- **Tests co-localisés** — `.test.ts(x)` à côté du fichier testé [Source: architecture.md#Structure Patterns]

### Décision architecturale : Fonction PostgreSQL `create_lot_with_inheritance`

L'héritage est implémenté via une **fonction PostgreSQL** appelée par `supabase.rpc()` plutôt que par des appels multiples côté client. Justification :

1. **Atomicité** — tout ou rien : si une étape échoue, aucune donnée n'est créée (rollback automatique)
2. **Performance** — une seule requête réseau au lieu de 5-20 (étage + lot + N pièces + N×M tâches + K documents)
3. **Cohérence** — impossible d'avoir un lot sans ses pièces/tâches héritées (pas d'état intermédiaire)
4. **Compatibilité SDK** — `supabase.rpc()` fait partie du SDK Supabase standard, pas d'Edge Function nécessaire
5. **Prépare story 2.5** — la même fonction sera réutilisée pour la création batch (boucle côté SQL)

### Décision architecturale : Dénormalisation `plot_id` sur `lots`

La table `lots` a une colonne `plot_id` en plus de `etage_id`, malgré le fait que `etage.plot_id` existe déjà. Justification :

1. **Unicité du code** — le code d'un lot est unique par plot (pas par étage). `UNIQUE(plot_id, lower(code))` est la contrainte naturelle.
2. **Requêtes simplifiées** — `SELECT * FROM lots WHERE plot_id = ?` évite un JOIN avec `etages` pour lister les lots d'un plot
3. **Intégrité** — `ON DELETE CASCADE` sur `plot_id` garantit la suppression en cascade depuis le plot
4. **Pattern courant** — la dénormalisation d'un parent "grand-parent" est un pattern établi quand l'unicité le requiert

### Décision architecturale : Pas de CASCADE sur `variante_id` dans `lots`

La FK `lots.variante_id → variantes(id)` n'a **PAS** de `ON DELETE CASCADE`. Justification :

1. **Le lot est indépendant** — une fois créé, le lot a ses propres pièces, tâches et documents (copiés depuis la variante)
2. **Supprimer une variante ne doit PAS supprimer les lots** — les lots sont des données terrain, la variante est un template de configuration
3. **Si on tente de supprimer une variante qui a des lots**, PostgreSQL lèvera une erreur FK (comportement par défaut `NO ACTION`) — l'UI devra informer l'utilisateur
4. **Alternative future** — `ON DELETE SET NULL` si on veut pouvoir supprimer des variantes sans impacter les lots (rendre `variante_id` nullable)

Pour cette story, on garde le comportement par défaut (`NO ACTION`) — une variante avec des lots ne peut pas être supprimée. L'UI existante de suppression de variante (AlertDialog) restera, mais l'erreur sera catchée et un toast informatif sera affiché.

### Migration SQL cible

```sql
-- supabase/migrations/007_lots.sql
-- Story 2.4 : Lots avec héritage automatique depuis les variantes

-- =====================
-- Table ÉTAGES
-- =====================
CREATE TABLE public.etages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id uuid NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
  nom text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_etages_unique_nom ON public.etages(plot_id, lower(nom));
CREATE INDEX idx_etages_plot_id ON public.etages(plot_id);
SELECT public.apply_rls_policy('etages');

-- =====================
-- Table LOTS
-- =====================
CREATE TABLE public.lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etage_id uuid NOT NULL REFERENCES public.etages(id) ON DELETE CASCADE,
  variante_id uuid NOT NULL REFERENCES public.variantes(id),
  plot_id uuid NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
  code text NOT NULL,
  is_tma boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_lots_unique_code ON public.lots(plot_id, lower(code));
CREATE INDEX idx_lots_etage_id ON public.lots(etage_id);
CREATE INDEX idx_lots_plot_id ON public.lots(plot_id);
CREATE INDEX idx_lots_variante_id ON public.lots(variante_id);
SELECT public.apply_rls_policy('lots');

-- =====================
-- Table PIÈCES (héritées de variante_pieces)
-- =====================
CREATE TABLE public.pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id uuid NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  nom text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pieces_lot_id ON public.pieces(lot_id);
SELECT public.apply_rls_policy('pieces');

-- =====================
-- Table TÂCHES (une par pièce × task_definition du plot)
-- =====================
CREATE TABLE public.taches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id uuid NOT NULL REFERENCES public.pieces(id) ON DELETE CASCADE,
  nom text NOT NULL,
  status task_status NOT NULL DEFAULT 'not_started',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_taches_piece_id ON public.taches(piece_id);
SELECT public.apply_rls_policy('taches');

-- =====================
-- Table LOT_DOCUMENTS (hérités de variante_documents)
-- =====================
CREATE TABLE public.lot_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id uuid NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  nom text NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lot_documents_lot_id ON public.lot_documents(lot_id);
SELECT public.apply_rls_policy('lot_documents');

-- =====================
-- Fonction HÉRITAGE AUTOMATIQUE
-- =====================
-- Crée un lot avec héritage transactionnel : étage (get or create),
-- lot, pièces copiées depuis variante_pieces, tâches créées depuis
-- plot.task_definitions, documents copiés depuis variante_documents.
-- Retourne l'id du lot créé.

CREATE OR REPLACE FUNCTION public.create_lot_with_inheritance(
  p_code text,
  p_variante_id uuid,
  p_etage_nom text,
  p_plot_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_etage_id uuid;
  v_lot_id uuid;
  v_piece_id uuid;
  v_variante_piece RECORD;
  v_task text;
  v_variante_doc RECORD;
  v_task_definitions text[];
BEGIN
  -- 1. Get or create étage
  SELECT id INTO v_etage_id
  FROM public.etages
  WHERE plot_id = p_plot_id AND lower(nom) = lower(p_etage_nom);

  IF v_etage_id IS NULL THEN
    INSERT INTO public.etages (plot_id, nom)
    VALUES (p_plot_id, p_etage_nom)
    RETURNING id INTO v_etage_id;
  END IF;

  -- 2. Create lot
  INSERT INTO public.lots (etage_id, variante_id, plot_id, code)
  VALUES (v_etage_id, p_variante_id, p_plot_id, p_code)
  RETURNING id INTO v_lot_id;

  -- 3. Get task definitions from plot
  SELECT task_definitions INTO v_task_definitions
  FROM public.plots WHERE id = p_plot_id;

  -- 4. Copy variante_pieces → pieces + create taches
  FOR v_variante_piece IN
    SELECT nom FROM public.variante_pieces
    WHERE variante_id = p_variante_id
    ORDER BY created_at ASC
  LOOP
    INSERT INTO public.pieces (lot_id, nom)
    VALUES (v_lot_id, v_variante_piece.nom)
    RETURNING id INTO v_piece_id;

    -- Create a tache for each task_definition
    FOREACH v_task IN ARRAY COALESCE(v_task_definitions, '{}')
    LOOP
      INSERT INTO public.taches (piece_id, nom, status)
      VALUES (v_piece_id, v_task, 'not_started');
    END LOOP;
  END LOOP;

  -- 5. Copy variante_documents → lot_documents
  FOR v_variante_doc IN
    SELECT nom, is_required FROM public.variante_documents
    WHERE variante_id = p_variante_id
    ORDER BY created_at ASC
  LOOP
    INSERT INTO public.lot_documents (lot_id, nom, is_required)
    VALUES (v_lot_id, v_variante_doc.nom, v_variante_doc.is_required);
  END LOOP;

  RETURN v_lot_id;
END;
$$;
```

### Types database.ts — Sections à ajouter

```typescript
etages: {
  Row: {
    id: string
    plot_id: string
    nom: string
    created_at: string
  }
  Insert: {
    id?: string
    plot_id: string
    nom: string
    created_at?: string
  }
  Update: {
    id?: string
    plot_id?: string
    nom?: string
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "etages_plot_id_fkey"
      columns: ["plot_id"]
      isOneToOne: false
      referencedRelation: "plots"
      referencedColumns: ["id"]
    },
  ]
}

lots: {
  Row: {
    id: string
    etage_id: string
    variante_id: string
    plot_id: string
    code: string
    is_tma: boolean
    created_at: string
  }
  Insert: {
    id?: string
    etage_id: string
    variante_id: string
    plot_id: string
    code: string
    is_tma?: boolean
    created_at?: string
  }
  Update: {
    id?: string
    etage_id?: string
    variante_id?: string
    plot_id?: string
    code?: string
    is_tma?: boolean
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "lots_etage_id_fkey"
      columns: ["etage_id"]
      isOneToOne: false
      referencedRelation: "etages"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "lots_variante_id_fkey"
      columns: ["variante_id"]
      isOneToOne: false
      referencedRelation: "variantes"
      referencedColumns: ["id"]
    },
    {
      foreignKeyName: "lots_plot_id_fkey"
      columns: ["plot_id"]
      isOneToOne: false
      referencedRelation: "plots"
      referencedColumns: ["id"]
    },
  ]
}

pieces: {
  Row: {
    id: string
    lot_id: string
    nom: string
    created_at: string
  }
  Insert: {
    id?: string
    lot_id: string
    nom: string
    created_at?: string
  }
  Update: {
    id?: string
    lot_id?: string
    nom?: string
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "pieces_lot_id_fkey"
      columns: ["lot_id"]
      isOneToOne: false
      referencedRelation: "lots"
      referencedColumns: ["id"]
    },
  ]
}

taches: {
  Row: {
    id: string
    piece_id: string
    nom: string
    status: 'not_started' | 'in_progress' | 'done'
    created_at: string
  }
  Insert: {
    id?: string
    piece_id: string
    nom: string
    status?: 'not_started' | 'in_progress' | 'done'
    created_at?: string
  }
  Update: {
    id?: string
    piece_id?: string
    nom?: string
    status?: 'not_started' | 'in_progress' | 'done'
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "taches_piece_id_fkey"
      columns: ["piece_id"]
      isOneToOne: false
      referencedRelation: "pieces"
      referencedColumns: ["id"]
    },
  ]
}

lot_documents: {
  Row: {
    id: string
    lot_id: string
    nom: string
    is_required: boolean
    created_at: string
  }
  Insert: {
    id?: string
    lot_id: string
    nom: string
    is_required?: boolean
    created_at?: string
  }
  Update: {
    id?: string
    lot_id?: string
    nom?: string
    is_required?: boolean
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "lot_documents_lot_id_fkey"
      columns: ["lot_id"]
      isOneToOne: false
      referencedRelation: "lots"
      referencedColumns: ["id"]
    },
  ]
}
```

**Section Functions dans Database.public** — Remplacer `{ [_ in never]: never }` par :

```typescript
Functions: {
  create_lot_with_inheritance: {
    Args: {
      p_code: string
      p_variante_id: string
      p_etage_nom: string
      p_plot_id: string
    }
    Returns: string // uuid du lot créé
  }
}
```

### Pattern mutation — Création de lot via RPC

```typescript
// src/lib/mutations/useCreateLot.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useCreateLot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      code,
      varianteId,
      etageNom,
      plotId,
    }: {
      code: string
      varianteId: string
      etageNom: string
      plotId: string
    }) => {
      const { data, error } = await supabase.rpc('create_lot_with_inheritance', {
        p_code: code,
        p_variante_id: varianteId,
        p_etage_nom: etageNom,
        p_plot_id: plotId,
      })
      if (error) throw error
      return data as string // uuid du lot créé
    },
    onSettled: (_data, _err, { plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
      queryClient.invalidateQueries({ queryKey: ['etages', plotId] })
    },
  })
}
```

**Note : Pas de mutation optimiste pour la création de lot.** La création via RPC implique de multiples insertions server-side (lot + pièces + tâches + documents). Il est impossible de simuler correctement l'état final côté client (on ne connaît pas les IDs générés ni le contenu exact de l'héritage). La mutation est simple et rapide (une seule requête réseau), le feedback sera fourni par le toast post-création + navigation vers le lot.

### Pattern query — Lots d'un plot avec relations

```typescript
// src/lib/queries/useLots.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useLots(plotId: string) {
  return useQuery({
    queryKey: ['lots', plotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lots')
        .select('*, etages(nom), variantes(nom), pieces(count)')
        .eq('plot_id', plotId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!plotId,
  })
}
```

Ce hook retourne les lots avec :
- `etages.nom` — nom de l'étage (ex: "RDC")
- `variantes.nom` — nom de la variante (ex: "Type A")
- `pieces[0].count` — nombre de pièces héritées

### Pattern query — Pièces avec tâches imbriquées

```typescript
// src/lib/queries/usePieces.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function usePieces(lotId: string) {
  return useQuery({
    queryKey: ['pieces', lotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pieces')
        .select('*, taches(*)')
        .eq('lot_id', lotId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!lotId,
  })
}
```

Ce hook charge les pièces avec toutes leurs tâches en une seule requête (pas de N+1). Chaque pièce aura `taches: Array<{ id, nom, status, ... }>`.

### Design de la page plot (mise à jour) — Tâches + Variantes + Lots

```
+--[←]--------[Plot A]--------[⋮]--------+
|                                          |
|  Tâches disponibles                      |
|  ┌──────────────────────────────────┐    |
|  │ ≡  Ragréage                  [×] │    |
|  │ ≡  Phonique                  [×] │    |
|  │ ≡  Pose                      [×] │    |
|  └──────────────────────────────────┘    |
|  ┌────────────────────────┐ [Ajouter]    |
|  │ Nouvelle tâche...      │              |
|  └────────────────────────┘              |
|                                          |
|  ─────────────────────────────────────   |
|                                          |
|  Variantes                               |
|  ┌──────────────────────────────────┐    |
|  │ █ Type A          4 pièces      │    |
|  └──────────────────────────────────┘    |
|                                          |
|  ─────────────────────────────────────   |
|                                          |
|  Lots (6)                                |
|                                          |
|  RDC                                     |
|  ┌──────────────────────────────────┐    |
|  │ █ Lot 001                        │    |
|  │   Type A · 4 pièces              │    |
|  └──────────────────────────────────┘    |
|  ┌──────────────────────────────────┐    |
|  │ █ Lot 002                        │    |
|  │   Type B · 3 pièces              │    |
|  └──────────────────────────────────┘    |
|                                          |
|  Étage 1                                 |
|  ┌──────────────────────────────────┐    |
|  │ █ Lot 101                        │    |
|  │   Type A · 4 pièces              │    |
|  └──────────────────────────────────┘    |
|                                          |
|  [+ Ajouter un lot]                      |
|                                          |
+------------------------------------------+
| [Chantiers] [Livraisons] [Act.] [Reg.]  |
+------------------------------------------+
```

### Design du formulaire de création de lot (Sheet bottom)

```
┌──────────────────────────────────────┐
│  Nouveau lot                    [×]  │
│                                      │
│  Code du lot                         │
│  ┌──────────────────────────────┐    │
│  │ 203                          │    │
│  └──────────────────────────────┘    │
│                                      │
│  Variante                            │
│  ┌──────────────────────────────┐    │
│  │ Type A                    ▾  │    │
│  └──────────────────────────────┘    │
│                                      │
│  Étage                               │
│  ┌──────────────────────────────┐    │
│  │ RDC                          │    │
│  └──────────────────────────────┘    │
│  (saisie libre — créé ou réutilisé)  │
│                                      │
│  ┌──────────────────────────────┐    │
│  │        Créer le lot          │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

- Le Select de variante affiche toutes les variantes du plot
- Le champ étage est un input texte libre. Les étages existants sont proposés via un `<datalist>` HTML natif (simple, accessible, pas de composant custom nécessaire)
- Les messages d'erreur s'affichent sous chaque champ en rouge

### Design de la page lot (lecture seule — AC4)

```
+--[←]--------[Lot 203]-------------------+
|                                          |
|  Type A · RDC                            |
|                                          |
|  ─────────────────────────────────────   |
|                                          |
|  Pièces (4)                              |
|  ┌──────────────────────────────────┐    |
|  │  ▸ Séjour                        │    |
|  │    6 tâches · 0 fait, 0 en cours │    |
|  │                                   │    |
|  │  ▸ Chambre                       │    |
|  │    6 tâches · 0 fait, 0 en cours │    |
|  │                                   │    |
|  │  ▸ SDB                           │    |
|  │    6 tâches · 0 fait, 0 en cours │    |
|  │                                   │    |
|  │  ▸ WC                            │    |
|  │    6 tâches · 0 fait, 0 en cours │    |
|  └──────────────────────────────────┘    |
|                                          |
|  ─────────────────────────────────────   |
|                                          |
|  Documents (2)                           |
|  ┌──────────────────────────────────┐    |
|  │  Plan de pose         Obligatoire│    |
|  │  Fiche de choix       Optionnel  │    |
|  └──────────────────────────────────┘    |
|                                          |
+------------------------------------------+
| [Chantiers] [Livraisons] [Act.] [Reg.]  |
+------------------------------------------+
```

- La page est **lecture seule** dans cette story
- Les pièces sont expandables (comme dans la page variante) pour voir les tâches individuelles
- Chaque tâche affiche son statut visuel (cercle gris = `not_started`)
- Les documents affichent leur caractère obligatoire/optionnel en badge
- Le compteur de tâches suit le format FR27 : "X fait, Y en cours" (pas de pourcentage)
- L'édition (tap-cycle, ajout pièces/docs) viendra dans les stories 2.6 (personnalisation lot) et Epic 3 (navigation terrain)

### Composants shadcn/ui à installer

- **Select** — Nécessaire pour le sélecteur de variante dans le formulaire de création de lot : `npx shadcn@latest add select`

Composants déjà installés et réutilisés :
- **Sheet** — formulaire bottom sheet (installé en story 2.1)
- **Button** — boutons (installé en story 1.1)
- **Input** — champs texte (installé en story 1.2)
- **StatusCard** — cartes de lots (installé en story 1.5)
- **Badge** — indicateurs optionnel/obligatoire (installé en story 1.5)

### Conventions de nommage

- Tables DB : `etages`, `lots`, `pieces`, `taches`, `lot_documents` (snake_case, pluriel)
- Fichiers queries : `useEtages.ts`, `useLots.ts`, `usePieces.ts`, `useLotDocuments.ts`
- Fichier mutation : `useCreateLot.ts`
- Route lot : `lots.$lotId.tsx` (convention TanStack Router)
- Tests co-localisés : `.test.ts(x)` à côté du fichier testé
- Fonction RPC : `create_lot_with_inheritance` (snake_case, convention PostgreSQL)
- Query keys : `['etages', plotId]`, `['lots', plotId]`, `['pieces', lotId]`, `['lot-documents', lotId]`

### Stack technique — Versions exactes (déjà installées)

| Bibliothèque | Version | Utilisation dans cette story |
|---|---|---|
| **@supabase/supabase-js** | 2.x | `.rpc()`, `.from().select().eq().order()`, relations imbriquées `pieces(count)`, `taches(*)` |
| **@tanstack/react-query** | 5.x | `useQuery`, `useMutation`, `useQueryClient`, `invalidateQueries` |
| **@tanstack/react-router** | 1.158.x | `createFileRoute`, `Link`, `useNavigate`, `Route.useParams()` |
| **shadcn/ui** | CLI 3.8.4 | Button, Input, Sheet, StatusCard, Badge (existants), Select (à installer) |
| **lucide-react** | 0.563.x | `Plus`, `ArrowLeft`, `ChevronDown`/`ChevronRight`, `Building2` (étage) |
| **vitest** | 4.0.x | Tests unitaires co-localisés |

### Project Structure Notes

**Nouveaux fichiers à créer :**
- `supabase/migrations/007_lots.sql` — Migration 5 tables + fonction RPC
- `src/lib/queries/useEtages.ts` — Hook query étages
- `src/lib/queries/useEtages.test.ts` — Tests query
- `src/lib/queries/useLots.ts` — Hook query lots avec relations
- `src/lib/queries/useLots.test.ts` — Tests query
- `src/lib/queries/usePieces.ts` — Hook query pièces avec tâches
- `src/lib/queries/usePieces.test.ts` — Tests query
- `src/lib/queries/useLotDocuments.ts` — Hook query documents lot
- `src/lib/queries/useLotDocuments.test.ts` — Tests query
- `src/lib/mutations/useCreateLot.ts` — Mutation création lot via RPC
- `src/lib/mutations/useCreateLot.test.ts` — Tests mutation
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/lots.$lotId.tsx` — Page lot (lecture seule)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/lots.$lotId.test.tsx` — Tests page lot
- `src/components/ui/select.tsx` — Composant shadcn Select (via CLI)

**Fichiers à modifier :**
- `src/types/database.ts` — Ajouter 5 tables + 1 fonction RPC
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` — Ajouter section "Lots" avec formulaire création
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.test.tsx` — Ajouter tests section lots
- `src/routeTree.gen.ts` — Auto-régénéré par TanStack Router

**Fichiers NON touchés :**
- `src/routes/_authenticated/index.tsx` — L'écran d'accueil ne change pas
- `src/routes/_authenticated/chantiers/$chantierId.tsx` — Le layout chantier ne change pas
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — La page index chantier ne change pas
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId.tsx` — Le layout plot ne change pas (Outlet)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/variantes.$varianteId.tsx` — La page variante ne change pas
- `src/components/StatusCard.tsx` — Réutilisé tel quel
- `src/components/BottomNavigation.tsx` — Pas de changement
- `src/lib/queries/usePlots.ts` — Pas de changement
- `src/lib/queries/useVariantes.ts` — Pas de changement
- `src/lib/queries/useVariantePieces.ts` — Pas de changement
- `src/lib/queries/useVarianteDocuments.ts` — Pas de changement
- `src/lib/mutations/useCreateVariante.ts` — Pas de changement
- `src/lib/mutations/useDeleteVariante.ts` — **ATTENTION** — ce hook doit gérer l'erreur FK si la variante a des lots (voir section Pièges)
- `src/types/enums.ts` — `task_status` existe déjà, pas de nouvel enum
- `src/main.tsx` — Pas de changement
- `src/index.css` — Pas de changement

### Attention — Pièges courants

1. **La fonction RPC `SECURITY DEFINER`** — La fonction est déclarée `SECURITY DEFINER` pour s'exécuter avec les droits du propriétaire (postgres) et bypasser les RLS. C'est nécessaire car les INSERT dans la fonction doivent fonctionner même si les RLS policy ne sont pas évaluées dans le contexte de la fonction. Alternative : ne PAS utiliser `SECURITY DEFINER` et s'assurer que les RLS autorisent les insertions — ce qui est déjà le cas avec la policy `auth.uid() IS NOT NULL`. **Recommandation : ne PAS utiliser SECURITY DEFINER** — la RLS standard suffit puisque l'utilisateur est authentifié. Retirer le `SECURITY DEFINER` de la fonction.

2. **`Relationships: []` dans database.ts** — TOUJOURS inclure ce champ. Pour `lots`, inclure les 3 FK (etages, variantes, plots). Sans `Relationships`, supabase-js v2 ne peut pas inférer les types Row via `.select('*')`.

3. **Le `.rpc()` retourne un UUID (string)** — `supabase.rpc('create_lot_with_inheritance', { ... })` retourne `{ data: string, error }` où `data` est l'UUID du lot créé. Le type de retour dans Database.Functions doit être `Returns: string`.

4. **Le composant Select de shadcn/ui** — Doit être installé via la CLI AVANT utilisation : `npx shadcn@latest add select`. Le fichier généré dans `src/components/ui/select.tsx` peut déclencher le lint warning `react-refresh/only-export-components` — ajouter le commentaire `// eslint-disable-next-line` comme pour `button.tsx`, `badge.tsx` et `switch.tsx`.

5. **Le `<datalist>` HTML pour les étages** — C'est un élément HTML natif qui suggère des options sans restreindre la saisie. Pattern :
```tsx
<Input list="etages-list" ... />
<datalist id="etages-list">
  {etages?.map(e => <option key={e.id} value={e.nom} />)}
</datalist>
```
Simple, accessible, pas de composant custom nécessaire.

6. **Grouper les lots par étage dans l'UI** — Les lots retournés par `useLots(plotId)` sont à plat. Il faut les grouper par `etages.nom` côté client avant affichage. Pattern simple :
```typescript
const grouped = lots.reduce((acc, lot) => {
  const etage = lot.etages?.nom ?? 'Sans étage'
  if (!acc[etage]) acc[etage] = []
  acc[etage].push(lot)
  return acc
}, {} as Record<string, typeof lots>)
```

7. **Suppression de variante avec lots existants** — Si l'utilisateur essaie de supprimer une variante qui a des lots assignés, PostgreSQL lèvera une erreur FK (`violates foreign key constraint "lots_variante_id_fkey"`). Le hook `useDeleteVariante` existant doit catcher cette erreur et afficher un toast informatif : "Impossible de supprimer cette variante — des lots l'utilisent." **Ne PAS modifier l'AlertDialog** — juste ajouter la gestion d'erreur dans le `onError` callback.

8. **Pas de Realtime pour les lots dans cette story** — Comme pour les stories précédentes, la configuration est faite par un seul utilisateur au bureau. Pas de subscription Realtime nécessaire pour l'instant (elles viendront dans Epic 3 pour le suivi terrain).

9. **`ON DELETE CASCADE` en cascade complète** — Chaîne : chantier → plot → étage → lot → pièce → tâche, ET lot → lot_documents. Si un plot est supprimé, TOUTES les données descendantes sont nettoyées automatiquement.

10. **Le champ `is_tma`** — Inclus dans la table `lots` mais NON exposé dans cette story. Le flag TMA sera implémenté en story 2.6. Il est déjà en base pour éviter une migration supplémentaire.

11. **Prévention des doublons de code** — Vérification côté client (case-insensitive) + contrainte unique en base (`idx_lots_unique_code`). En cas de race condition (improbable pour 2-3 utilisateurs), l'erreur PostgreSQL sera catchée par le `.rpc()` et affichée via toast.

12. **Le formulaire a 3 champs** — C'est la première fois qu'un formulaire posePilot a plus d'un champ. Respecter la règle UX : "max 3 champs visibles" [Source: ux-design-specification.md#Form Patterns]. Les 3 champs (code, variante, étage) tiennent dans un Sheet sans scroll.

13. **Tests — Mocker le `.rpc()`** — Pour les tests de `useCreateLot`, le mock Supabase doit intercepter `.rpc('create_lot_with_inheritance', ...)` et retourner un UUID fake. Pattern :
```typescript
vi.mocked(supabase.rpc).mockResolvedValue({
  data: 'fake-lot-id',
  error: null,
})
```

14. **La page lot est une route leaf** — `lots.$lotId.tsx` sous `plots.$plotId/` crée la route `/chantiers/:chantierId/plots/:plotId/lots/:lotId`. Pas besoin de layout — c'est une page lecture seule. Si besoin de sous-routes dans le futur (Epic 3 : navigation pièces), on convertira en layout.

### References

- [Source: epics.md#Story 2.4] — User story, acceptance criteria BDD
- [Source: epics.md#FR17] — Créer des lots avec code libre, variante et étage
- [Source: epics.md#FR19] — Identifiants d'étage libres (RDC, 1, Combles...)
- [Source: epics.md#FR23] — Héritage automatique variante → lot (pièces, tâches, documents)
- [Source: architecture.md#Data Architecture] — Héritage avec copie à la création du lot
- [Source: architecture.md#API & Communication Patterns] — SDK Supabase direct, .rpc() inclus
- [Source: architecture.md#Communication Patterns] — Query keys, invalidation ciblée
- [Source: architecture.md#Structure Patterns] — Structure projet par domaine, tests co-localisés
- [Source: architecture.md#Naming Patterns] — snake_case DB, camelCase JS, PascalCase composants
- [Source: architecture.md#Enforcement Guidelines] — shadcn first, messages français
- [Source: architecture.md#Project Structure] — Routes hiérarchiques plots/$plotId/lots/$lotId
- [Source: ux-design-specification.md#Form Patterns] — Max 3 champs visibles
- [Source: ux-design-specification.md#Interaction Patterns] — Saisie minimale terrain
- [Source: prd.md#FR17] — Créer des lots assignés à une variante et un étage
- [Source: prd.md#FR19] — Identifiants d'étage libres
- [Source: prd.md#FR23] — Lots héritent pièces, tâches et documents

## Previous Story Intelligence (Story 2.3)

### Learnings critiques de la story précédente

1. **230 tests existants** — baseline à ne pas régresser (206 pré-story-2.3 + 24 story 2.3)
2. **Prévention doublons** : Pattern maîtrisé — vérification case-insensitive côté client + `toast.error` si doublon + contrainte unique en base. Appliquer pour les codes de lots.
3. **9 issues code review corrigées en 2.3** :
   - AlertDialog mentionne documents (pas juste "pièces")
   - UNIQUE index SQL ajouté sur `variante_documents(variante_id, lower(nom))`
   - `isPending` sur bouton "Ajouter" — appliquer pour le bouton "Créer le lot"
   - Toast error pour doublon — même pattern pour code lot existant
   - Cast `as boolean` retiré — ne pas caster sans raison
   - `?.` redondant retiré — ne pas surprotéger
4. **Page variante complète** : La page `variantes.$varianteId.tsx` (382 lignes) gère pièces + documents avec expand, ajout, suppression, switch. Pattern expandable réutilisable pour la page lot.
5. **Switch shadcn/ui** : Installé et fonctionnel. Pour la page lot, les documents seront en lecture seule (pas de switch, juste un badge "Obligatoire"/"Optionnel").
6. **Mocks test** : Les fichiers test existants mockent déjà tous les hooks variante. Pour les tests de la page lot, il faudra mocker `usePieces`, `useLotDocuments`, `useLots`.

### Code patterns établis (à respecter)

- `createFileRoute('/_authenticated/...')` pour les routes protégées
- `useAuth()` hook pour l'état d'authentification
- `supabase` client singleton dans `src/lib/supabase.ts` (typé `Database`)
- `queryClient` dans `src/lib/queryClient.ts` (staleTime 5min, retry 3)
- Composants shadcn/ui dans `src/components/ui/`
- Composants custom dans `src/components/`
- Tests avec Vitest + Testing Library + mocks Supabase chainable
- Navigation TanStack Router : `Link`, `useNavigate()`, `Route.useParams()`
- Toast via `toast()` de sonner pour le feedback post-action
- StatusCard pour les listes avec indicateur de statut coloré
- Prévention doublons case-insensitive avec `toast.error` sur détection

## Git Intelligence

### Commits récents (5 derniers)

```
e6487b6 feat: auth, route protection & login — Story 1-2 + code review fixes
e1c18ef fix: code review story 1-1 — 7 issues corrigées
61938ec docs: story 1-1 complete — all tasks done, status review
3789f3d docs: update story 1-1 progress — tasks 1-6 implemented
a3719c1 feat: initial project scaffolding — Story 1-1
```

Note : Les stories 1.3 à 2.3 ne sont pas encore commitées (changements en working directory). Le développeur travaillera par-dessus cet état non-commité.

### Patterns de commit à suivre

- Format : `feat:` / `fix:` / `docs:` + description concise + référence story
- Commits atomiques par fonctionnalité

### Technologies déjà en place

- React 19.2 + TypeScript strict
- Tailwind CSS v4 (config inline dans index.css, pas de tailwind.config)
- TanStack Router (file-based routing, route generation automatique, `routeFileIgnorePattern`)
- TanStack Query v5 (staleTime 5min, retry 3, query keys `[entite, ...filtres]`)
- Supabase Auth (email/password, RLS) + Supabase JS Client (typé Database)
- Supabase Realtime (subscription `chantiers-changes`, invalidation query)
- shadcn/ui (button, card, input, label, badge, sonner, alert-dialog, dropdown-menu, tabs, sheet, switch — style "new-york")
- Lucide React (icônes)
- Vitest + Testing Library (setup complet)
- vite-plugin-pwa v1.2.0 (PWA configurée)
- 230 tests existants

## Latest Tech Information

### Supabase .rpc() — Appel de fonctions PostgreSQL

`supabase.rpc()` appelle une fonction PostgreSQL directement depuis le client. La fonction doit être créée dans une migration et exposée dans le schema `public`.

```typescript
const { data, error } = await supabase.rpc('function_name', {
  param1: 'value1',
  param2: 'value2',
})
```

- Le retour dépend de la signature de la fonction PostgreSQL
- Pour un `RETURNS uuid`, le `data` sera un `string`
- Les erreurs de contrainte unique (ex: code lot dupliqué) remontent via `error.code = '23505'`
- Les erreurs FK (ex: variante_id invalide) remontent via `error.code = '23503'`

### Supabase relational queries — Select avec jointures

Supabase permet de sélectionner des relations imbriquées via la syntaxe `select('*, relation(columns)')` :

```typescript
// Lots avec étage, variante et count de pièces
supabase.from('lots')
  .select('*, etages(nom), variantes(nom), pieces(count)')
  .eq('plot_id', plotId)

// Pièces avec tâches imbriquées
supabase.from('pieces')
  .select('*, taches(*)')
  .eq('lot_id', lotId)
```

Pour que les relations fonctionnent, les FK doivent être définies dans le schema PostgreSQL ET dans les types `Relationships` de database.ts.

### HTML datalist — Suggestions d'input sans restriction

Le `<datalist>` HTML natif fournit des suggestions de complétion automatique sur un `<input>` sans restreindre les valeurs saisies. Parfait pour le champ étage qui doit accepter des valeurs libres tout en proposant les étages existants.

```html
<input list="etages-list" placeholder="Étage..." />
<datalist id="etages-list">
  <option value="RDC" />
  <option value="1" />
  <option value="2" />
</datalist>
```

- Supporté par tous les navigateurs modernes (Chrome, Safari, Firefox)
- Accessible nativement (pas besoin d'ARIA custom)
- Pas de JavaScript supplémentaire nécessaire

### shadcn Select — Sélection d'options contrôlée

Le composant Select de shadcn/ui est basé sur Radix UI Select. Installation :

```bash
npx shadcn@latest add select
```

Usage typique :

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

<Select value={selectedVariante} onValueChange={setSelectedVariante}>
  <SelectTrigger>
    <SelectValue placeholder="Sélectionner une variante" />
  </SelectTrigger>
  <SelectContent>
    {variantes?.map((v) => (
      <SelectItem key={v.id} value={v.id}>
        {v.nom}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

- Contrôlé via `value` / `onValueChange`
- `SelectValue` affiche le placeholder ou la valeur sélectionnée
- `SelectItem` prend `value` (la valeur programmatique) et affiche le texte enfant

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Lot detail test : `textContent` matcher nécessaire pour les compteurs de tâches (texte fragmenté par JSX interpolation)
- select.tsx : Le composant shadcn Select ne déclenche pas le lint warning `react-refresh/only-export-components` — pas besoin du eslint-disable

### Completion Notes List

- ✅ Task 1 : Migration SQL `007_lots.sql` — 5 tables (etages, lots, pieces, taches, lot_documents) + fonction RPC `create_lot_with_inheritance` sans SECURITY DEFINER (RLS suffit)
- ✅ Task 2 : Types database.ts — 5 tables + 1 fonction RPC avec Relationships complètes pour chaque FK
- ✅ Task 3 : 4 hooks queries (useEtages, useLots, usePieces, useLotDocuments) + 16 tests co-localisés
- ✅ Task 4 : Hook mutation useCreateLot via supabase.rpc() + 3 tests co-localisés
- ✅ Task 5 : Section Lots sur page plot index — lots groupés par étage en StatusCard, formulaire Sheet 3 champs (code/variante Select/étage avec datalist), validation côté client, prévention doublons case-insensitive, toast + navigation post-création
- ✅ Task 6 : Page lot lecture seule — header avec code/variante/étage, pièces expandables avec compteur tâches, documents avec badges Obligatoire/Optionnel, états vides
- ✅ Task 7 : 41 nouveaux tests + 230 pré-existants = 271/271 passent, 0 régressions, lint clean (seul pré-existant ThemeProvider.tsx:64)

### Change Log

- 2026-02-09 : Story 2.4 implémentée — création de lots avec héritage automatique (7 tasks, 40 nouveaux tests, 270 total)
- 2026-02-09 : Code review — 8 issues trouvées (3H, 3M, 2L), toutes corrigées :
  - [H1] Couleurs hex hardcodées → remplacées par STATUS_COLORS (lots.$lotId.tsx)
  - [H2] useDeleteVariante ne gérait pas l'erreur FK → toast.error ajouté pour code 23503
  - [H3] Type tuple `[{ count: number }]` → array `{ count: number }[]` (useLots.ts)
  - [M1] Test manquant pour createLot mutation → ajouté (vérifie validation sans variante)
  - [M2] Typo `etrageLots` → `etageLots` (plots.$plotId/index.tsx)
  - [M3] useLots dans page lot (perf) → noté, pas de changement (cache suffisant)
  - [L1] Formulaire lot pas reset à la fermeture → onOpenChange avec reset
  - [L2] "0 faits" → "0 fait" (grammaire française, `> 1` au lieu de `!== 1`)

### File List

**Nouveaux fichiers :**
- `supabase/migrations/007_lots.sql`
- `src/lib/queries/useEtages.ts`
- `src/lib/queries/useEtages.test.ts`
- `src/lib/queries/useLots.ts`
- `src/lib/queries/useLots.test.ts`
- `src/lib/queries/usePieces.ts`
- `src/lib/queries/usePieces.test.ts`
- `src/lib/queries/useLotDocuments.ts`
- `src/lib/queries/useLotDocuments.test.ts`
- `src/lib/mutations/useCreateLot.ts`
- `src/lib/mutations/useCreateLot.test.ts`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/lots.$lotId.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/lots.$lotId.test.tsx`
- `src/components/ui/select.tsx`

**Fichiers modifiés :**
- `src/types/database.ts` — 5 tables + 1 fonction RPC ajoutées
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` — Section Lots + formulaire création + fix typo + reset form on close
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.test.tsx` — Tests section Lots ajoutés + test createLot params
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/lots.$lotId.tsx` — Page lot + fix STATUS_COLORS + fix grammaire
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/lots.$lotId.test.tsx` — Fix assertions grammaire "0 fait"
- `src/lib/queries/useLots.ts` — Fix type tuple → array pour pieces
- `src/lib/mutations/useDeleteVariante.ts` — Gestion erreur FK 23503 + toast
- `src/routeTree.gen.ts` — Auto-régénéré (route lots/$lotId)
