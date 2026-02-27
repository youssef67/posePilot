# Story 10.1: Dépôt entreprise — Tables, types et queries de base

Status: done

## Story

En tant qu'utilisateur de posePilot,
Je veux que le système dispose d'un dépôt entreprise avec suivi du stock en temps réel et valorisation au CUMP,
Afin que je puisse enregistrer du matériel acheté pour le dépôt et connaître sa valeur à tout moment.

## Acceptance Criteria

1. **Given** le système **When** les migrations sont appliquées **Then** une table `depot_articles` existe avec : id, designation, quantite, valeur_totale, unite, created_at, created_by

2. **Given** le système **When** les migrations sont appliquées **Then** une table `depot_mouvements` existe avec : id, article_id (FK → depot_articles), type (enum: 'entree', 'sortie', 'transfert_chantier'), quantite, prix_unitaire, montant_total, livraison_id (FK → livraisons, nullable), chantier_id (FK → chantiers, nullable), note, created_at, created_by

3. **Given** un `depot_article` avec quantite=10 et valeur_totale=100 **When** on calcule le CUMP **Then** le prix unitaire moyen = valeur_totale / quantite = 10,00 €

4. **Given** les types TypeScript **When** le développeur importe les types **Then** `DepotArticle` et `DepotMouvement` sont disponibles dans `database.ts` avec `Relationships: []`

5. **Given** le hook `useDepotArticles()` **When** il est appelé **Then** il retourne tous les articles du dépôt triés par designation ASC, avec le CUMP calculé côté client (valeur_totale / quantite)

6. **Given** le hook `useDepotMouvements(articleId)` **When** il est appelé **Then** il retourne l'historique des mouvements pour un article, triés par created_at DESC

7. **Given** un article du dépôt **When** un changement survient (INSERT/UPDATE/DELETE) **Then** la subscription realtime invalide le cache `['depot-articles']`

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : enum `depot_mouvement_type` + table `depot_articles` (AC: #1, #3)
  - [x] 1.1 Créer `supabase/migrations/038_depot_entreprise.sql`
  - [x] 1.2 Créer l'enum `depot_mouvement_type` : `'entree'`, `'sortie'`, `'transfert_chantier'`
  - [x] 1.3 Créer la table `depot_articles` : id (uuid PK), designation (text NOT NULL), quantite (integer NOT NULL DEFAULT 0, CHECK >= 0), valeur_totale (numeric NOT NULL DEFAULT 0, CHECK >= 0), unite (text, nullable), created_at (timestamptz DEFAULT now()), created_by (uuid FK → auth.users)
  - [x] 1.4 Index : `idx_depot_articles_designation`
  - [x] 1.5 Appliquer RLS : `SELECT public.apply_rls_policy('depot_articles');`

- [x] Task 2 — Migration SQL : table `depot_mouvements` (AC: #2)
  - [x] 2.1 Dans le même fichier `038_depot_entreprise.sql`
  - [x] 2.2 Créer la table `depot_mouvements` : id (uuid PK), article_id (uuid FK → depot_articles ON DELETE CASCADE, NOT NULL), type (depot_mouvement_type NOT NULL), quantite (integer NOT NULL, CHECK > 0), prix_unitaire (numeric NOT NULL, CHECK >= 0), montant_total (numeric NOT NULL, CHECK >= 0), livraison_id (uuid FK → livraisons, nullable), chantier_id (uuid FK → chantiers, nullable), note (text, nullable), created_at (timestamptz DEFAULT now()), created_by (uuid FK → auth.users)
  - [x] 2.3 Index : `idx_depot_mouvements_article_id`, `idx_depot_mouvements_type`, `idx_depot_mouvements_livraison_id`
  - [x] 2.4 Appliquer RLS : `SELECT public.apply_rls_policy('depot_mouvements');`

- [x] Task 3 — Migration SQL : activity event types pour dépôt (AC: #7)
  - [x] 3.1 `ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'depot_entree';`
  - [x] 3.2 `ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'depot_sortie';`
  - [x] 3.3 `ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'depot_transfert';`
  - [x] 3.4 Trigger `log_depot_mouvement_activity()` sur INSERT de `depot_mouvements`

- [x] Task 4 — Types TypeScript : DepotArticle et DepotMouvement (AC: #4)
  - [x] 4.1 Ajouter `depot_articles` dans `src/types/database.ts` section Tables avec Row/Insert/Update + `Relationships: []`
  - [x] 4.2 Ajouter `depot_mouvements` dans `src/types/database.ts` section Tables avec Row/Insert/Update + `Relationships: []`
  - [x] 4.3 Ajouter `depot_mouvement_type` dans Enums : `'entree' | 'sortie' | 'transfert_chantier'`
  - [x] 4.4 Ajouter les nouveaux event types dans `activity_event_type`

- [x] Task 5 — Query hook : useDepotArticles (AC: #5)
  - [x] 5.1 Créer `src/lib/queries/useDepotArticles.ts`
  - [x] 5.2 Fetch tous les articles du dépôt, tri `designation ASC`
  - [x] 5.3 QueryKey : `['depot-articles']`
  - [x] 5.4 Exporter un type helper avec CUMP calculé : `DepotArticleWithCump` (extends Row + `cump: number | null`)
  - [x] 5.5 Le CUMP est calculé côté client : `quantite > 0 ? valeur_totale / quantite : null`
  - [x] 5.6 Créer `src/lib/queries/useDepotArticles.test.ts` — 3 tests

- [x] Task 6 — Query hook : useDepotMouvements (AC: #6)
  - [x] 6.1 Créer `src/lib/queries/useDepotMouvements.ts`
  - [x] 6.2 Fetch mouvements par `article_id`, tri `created_at DESC`
  - [x] 6.3 Join `chantiers(nom)` pour afficher le nom du chantier cible dans les transferts
  - [x] 6.4 QueryKey : `['depot-mouvements', articleId]`
  - [x] 6.5 Créer `src/lib/queries/useDepotMouvements.test.ts` — 3 tests

- [x] Task 7 — Subscription realtime : useRealtimeDepotArticles (AC: #7)
  - [x] 7.1 Créer `src/lib/subscriptions/useRealtimeDepotArticles.ts`
  - [x] 7.2 Channel `depot_articles`, events `*`
  - [x] 7.3 Invalide `['depot-articles']`
  - [x] 7.4 Créer `src/lib/subscriptions/useRealtimeDepotArticles.test.ts` — 3 tests

- [x] Task 8 — Tests de régression (AC: #1-7)
  - [x] 8.1 `npm run test` — 9/9 nouveaux tests passent, 0 régression introduite
  - [x] 8.2 `npx tsc --noEmit` — 0 nouvelles erreurs
  - [x] 8.3 `npm run lint` — 0 nouvelles erreurs

## Dev Notes

### Architecture

Première story de l'Epic 10 "Dépôt Entreprise". Pose les fondations BDD et les hooks de lecture. Aucune UI dans cette story — les stories suivantes construiront dessus.

### Modèle de données — Schéma cible

```
depot_articles
├── id (uuid PK)
├── designation (text NOT NULL) — "Sac de colle Mapei", "Carrelage 30x30"
├── quantite (integer NOT NULL DEFAULT 0, CHECK >= 0) — Stock actuel
├── valeur_totale (numeric NOT NULL DEFAULT 0, CHECK >= 0) — Valeur totale pour CUMP
├── unite (text, nullable) — "sac", "m²", "kg", "pièce"
├── created_at (timestamptz)
├── created_by (uuid FK → auth.users)

depot_mouvements
├── id (uuid PK)
├── article_id (uuid FK → depot_articles, NOT NULL)
├── type (depot_mouvement_type) — 'entree', 'sortie', 'transfert_chantier'
├── quantite (integer NOT NULL, CHECK > 0) — Toujours positif
├── prix_unitaire (numeric NOT NULL, CHECK >= 0)
├── montant_total (numeric NOT NULL, CHECK >= 0)
├── livraison_id (uuid FK → livraisons, nullable) — Si entrée via livraison
├── chantier_id (uuid FK → chantiers, nullable) — Si transfert vers chantier
├── note (text, nullable)
├── created_at (timestamptz)
├── created_by (uuid FK → auth.users)
```

### CUMP — Coût Unitaire Moyen Pondéré

Le CUMP est stocké implicitement via `valeur_totale` et `quantite` sur `depot_articles` :
- `CUMP = valeur_totale / quantite` (quand quantite > 0)
- Pas de colonne `cump` en BDD — calculé côté client dans le hook

**Exemple CUMP :**
1. Achat 10 sacs à 10€ → quantite=10, valeur_totale=100, CUMP=10€
2. Achat 10 sacs à 11€ → quantite=20, valeur_totale=210, CUMP=10,50€
3. Transfert 5 sacs vers chantier → quantite=15, valeur_totale=210-(5×10,50)=157,50, CUMP=10,50€

Le CUMP ne change PAS lors d'une sortie/transfert — seuls les achats le modifient.

### Pourquoi `quantite` peut être 0 (CHECK >= 0) et non 1

Contrairement à l'inventaire chantier (quantite >= 1, suppression quand à 0), un article du dépôt peut temporairement avoir quantite=0 si tout le stock a été transféré. L'article reste en base pour conserver l'historique des mouvements et pouvoir être réapprovisionné. La suppression physique sera un choix explicite de l'utilisateur (story 10.3).

### Ce qui existe déjà (à réutiliser)

| Élément | Fichier | Notes |
|---------|---------|-------|
| `apply_rls_policy()` | Fonction SQL existante | Pattern migrations |
| `activity_event_type` enum | Migrations existantes | ADD VALUE IF NOT EXISTS |
| Pattern query hook | `src/lib/queries/useInventaire.ts` | Même structure |
| Pattern subscription | `src/lib/subscriptions/useRealtimeInventaire.ts` | Même structure |
| Pattern types database.ts | `src/types/database.ts` | Avec `Relationships: []` |

### Migration SQL : 038_depot_entreprise.sql

```sql
-- Story 10.1 : Dépôt entreprise — tables de base

-- =====================
-- ENUM — Type de mouvement dépôt
-- =====================
CREATE TYPE public.depot_mouvement_type AS ENUM ('entree', 'sortie', 'transfert_chantier');

-- =====================
-- ENUM — Nouveaux types d'activité
-- =====================
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'depot_entree';
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'depot_sortie';
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'depot_transfert';

-- =====================
-- TABLE depot_articles
-- =====================
CREATE TABLE public.depot_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  designation text NOT NULL,
  quantite integer NOT NULL DEFAULT 0 CHECK (quantite >= 0),
  valeur_totale numeric NOT NULL DEFAULT 0 CHECK (valeur_totale >= 0),
  unite text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_depot_articles_designation ON public.depot_articles(designation);
SELECT public.apply_rls_policy('depot_articles');

-- =====================
-- TABLE depot_mouvements
-- =====================
CREATE TABLE public.depot_mouvements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.depot_articles(id) ON DELETE CASCADE,
  type public.depot_mouvement_type NOT NULL,
  quantite integer NOT NULL CHECK (quantite > 0),
  prix_unitaire numeric NOT NULL CHECK (prix_unitaire >= 0),
  montant_total numeric NOT NULL CHECK (montant_total >= 0),
  livraison_id uuid REFERENCES public.livraisons(id),
  chantier_id uuid REFERENCES public.chantiers(id),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_depot_mouvements_article_id ON public.depot_mouvements(article_id);
CREATE INDEX idx_depot_mouvements_type ON public.depot_mouvements(type);
CREATE INDEX idx_depot_mouvements_livraison_id ON public.depot_mouvements(livraison_id);
SELECT public.apply_rls_policy('depot_mouvements');

-- =====================
-- TRIGGER — Activity log pour mouvements dépôt
-- =====================
CREATE OR REPLACE FUNCTION public.log_depot_mouvement_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type public.activity_event_type;
  v_article_designation text;
BEGIN
  -- activity_logs.chantier_id est NOT NULL — on ne log que si chantier_id est renseigné
  -- Les entrées stock au dépôt (sans chantier) ne génèrent pas d'activity log
  IF NEW.chantier_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT designation INTO v_article_designation FROM public.depot_articles WHERE id = NEW.article_id;

  IF NEW.type = 'entree' THEN
    v_event_type := 'depot_entree';
  ELSIF NEW.type = 'sortie' THEN
    v_event_type := 'depot_sortie';
  ELSE
    v_event_type := 'depot_transfert';
  END IF;

  INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
  VALUES (
    v_event_type,
    COALESCE(auth.uid(), NEW.created_by),
    COALESCE((auth.jwt()->>'email')::text, NULL),
    NEW.chantier_id,
    'depot_mouvement',
    NEW.id,
    jsonb_build_object(
      'designation', LEFT(v_article_designation, 80),
      'quantite', NEW.quantite,
      'prix_unitaire', NEW.prix_unitaire,
      'montant_total', NEW.montant_total,
      'mouvement_type', NEW.type::text
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_depot_mouvement_activity
  AFTER INSERT ON public.depot_mouvements
  FOR EACH ROW EXECUTE FUNCTION public.log_depot_mouvement_activity();
```

## Dev Agent Record

### Implementation Plan

- Tasks 1-3 : Migration SQL unique `038_depot_entreprise.sql` — enum, 2 tables, indexes, RLS, activity event types, trigger
- Task 4 : Types TS dans `database.ts` — Tables Row/Insert/Update + interfaces helper + enum + activity types
- Tasks 5-6 : Query hooks suivant pattern `useInventaire` — TanStack Query avec mock supabase chain
- Task 7 : Subscription realtime suivant pattern `useRealtimeInventaire` — sans filtre (pas de chantierId)

### Completion Notes

- Migration SQL fidèle au SQL fourni dans Dev Notes — aucune déviation
- Types TS : `DepotArticle`, `DepotMouvement` interfaces + Tables dans Database type
- `useDepotArticles` : calcul CUMP côté client `valeur_totale / quantite`, null si quantite=0
- `useDepotMouvements` : join `chantiers(nom)` pour nom chantier dans transferts
- `useRealtimeDepotArticles` : channel global sans filtre, invalide `['depot-articles']`
- 9 tests écrits (3 par hook), tous verts
- `tsc --noEmit` : 0 erreurs, `lint` : 0 nouvelles erreurs

## File List

- `supabase/migrations/038_depot_entreprise.sql` — NEW
- `src/types/database.ts` — MODIFIED
- `src/lib/queries/useDepotArticles.ts` — NEW
- `src/lib/queries/useDepotArticles.test.ts` — NEW
- `src/lib/queries/useDepotMouvements.ts` — NEW
- `src/lib/queries/useDepotMouvements.test.ts` — NEW
- `src/lib/subscriptions/useRealtimeDepotArticles.ts` — NEW
- `src/lib/subscriptions/useRealtimeDepotArticles.test.ts` — NEW

## Senior Developer Review (AI)

**Reviewer :** Youssef (via Code Review Workflow)
**Date :** 2026-02-25
**Verdict :** Approve with fixes applied

### Issues trouvées : 1 Critical, 3 Medium, 2 Low

#### Fixed (2)
1. **[CRITICAL] Trigger `log_depot_mouvement_activity()` : violation NOT NULL** — `activity_logs.chantier_id` est NOT NULL mais le trigger insère `NEW.chantier_id` nullable. Fix : early return `RETURN NEW` si `chantier_id IS NULL` (les entrées stock sans chantier ne génèrent plus d'activity log).
2. **[MEDIUM] `depot_mouvements.type` typé `string`** — Dans `Database.Tables.depot_mouvements`, le champ `type` utilisait `string` au lieu de `'entree' | 'sortie' | 'transfert_chantier'`. Fix : type union explicite dans Row/Insert/Update.

#### Noted (non-fix)
3. **[MEDIUM] Cast `as unknown as`** — Double cast dans les hooks. Pattern récurrent du projet, cohérent avec `useInventaire` et les 27 autres queries. Pas de fix.
4. **[MEDIUM] Pas de subscription realtime pour `depot_mouvements`** — AC #7 ne mentionne que les articles. À prévoir dans une story ultérieure si nécessaire.
5. **[LOW] `placeholderData: []` masque `isLoading`** — Pattern projet. Les stories UI (10.3) devront utiliser `isFetching`.
6. **[LOW] Test `enabled` minimal** — Ne teste que `''`, pas `undefined`. Suffisant pour le scope.

## Change Log

- 2026-02-25 : Story 10.1 implémentée — tables dépôt, types TS, hooks lecture, subscription realtime, 9 tests
- 2026-02-25 : Code review — fix trigger NULL chantier_id + fix type enum depot_mouvements

### References

- Source: `supabase/migrations/018_inventaire.sql` — pattern migration table + triggers
- Source: `src/types/database.ts` — pattern types avec Relationships: []
- Source: `src/lib/queries/useInventaire.ts` — pattern query hook
- Source: `src/lib/subscriptions/useRealtimeInventaire.ts` — pattern subscription
