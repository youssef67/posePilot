# Story 6.5: Gestion d'inventaire avec localisation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux enregistrer du matériel avec quantité et localisation, et ajuster rapidement,
Afin que je sache exactement quel matériel est disponible et où sur le chantier.

## Acceptance Criteria

1. **Given** l'utilisateur est dans un chantier complet **When** il accède à la section Inventaire **Then** la liste du matériel enregistré s'affiche avec quantité et localisation (plot + étage)

2. **Given** l'utilisateur ajoute du matériel **When** il saisit le nom, la quantité et la localisation **Then** le matériel est créé (table `inventaire`) avec les informations fournies

3. **Given** l'utilisateur navigue depuis un plot/étage spécifique **When** il ajoute du matériel **Then** le système pré-remplit la localisation (plot + étage) selon le contexte de navigation actuel

4. **Given** du matériel existe dans l'inventaire **When** l'utilisateur ajuste la quantité **Then** des boutons +/- permettent un ajustement rapide, avec possibilité de supprimer (quantité à 0)

5. **Given** du matériel est enregistré sur plusieurs étages d'un plot **When** l'utilisateur consulte l'inventaire au niveau plot **Then** les quantités sont agrégées automatiquement (étage → plot → chantier)

6. **Given** l'utilisateur consulte l'inventaire au niveau chantier **When** les données s'affichent **Then** le total agrégé de chaque matériel est visible avec le détail par localisation

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : table `inventaire` + triggers (AC: #2, #5, #6)
  - [x] 1.1 Créer `supabase/migrations/018_inventaire.sql`
  - [x] 1.2 Table `inventaire` : id, chantier_id, plot_id, etage_id, designation, quantite, created_at, created_by
  - [x] 1.3 Index sur chantier_id, plot_id, etage_id
  - [x] 1.4 Appliquer RLS via `apply_rls_policy('inventaire')`
  - [x] 1.5 Ajouter event types `'inventaire_added'` et `'inventaire_updated'` à `activity_event_type`
  - [x] 1.6 Trigger `log_inventaire_activity()` pour activity_logs (INSERT + UPDATE quantite)

- [x] Task 2 — Type TypeScript : Inventaire (AC: #1)
  - [x] 2.1 Ajouter l'interface `Inventaire` dans `src/types/database.ts` avec `Relationships: []`
  - [x] 2.2 Ajouter un type helper `InventaireWithLocation` (étend `Inventaire` + `plots: { nom: string }`, `etages: { nom: string }`)

- [x] Task 3 — Query hook : useInventaire (AC: #1, #5, #6)
  - [x] 3.1 Créer `src/lib/queries/useInventaire.ts`
  - [x] 3.2 Fetch inventaire par chantier_id avec join `plots(nom)`, `etages(nom)`
  - [x] 3.3 QueryKey : `['inventaire', chantierId]`
  - [x] 3.4 Tri par `designation ASC` puis `created_at DESC`
  - [x] 3.5 Créer `src/lib/queries/useInventaire.test.ts`

- [x] Task 4 — Mutation hooks : create, update, delete inventaire (AC: #2, #4)
  - [x] 4.1 Créer `src/lib/mutations/useCreateInventaire.ts` — insert avec optimistic update
  - [x] 4.2 Créer `src/lib/mutations/useUpdateInventaire.ts` — update quantité avec optimistic
  - [x] 4.3 Créer `src/lib/mutations/useDeleteInventaire.ts` — delete (quand quantité = 0)
  - [x] 4.4 Chaque mutation invalide `['inventaire', chantierId]` dans onSettled
  - [x] 4.5 Créer tests correspondants (3 fichiers .test.ts)

- [x] Task 5 — Subscription realtime : useRealtimeInventaire (AC: #1)
  - [x] 5.1 Créer `src/lib/subscriptions/useRealtimeInventaire.ts`
  - [x] 5.2 Channel `inventaire:chantier_id=eq.{chantierId}`, events `*`
  - [x] 5.3 Invalide `['inventaire', chantierId]`
  - [x] 5.4 Créer `src/lib/subscriptions/useRealtimeInventaire.test.ts`

- [x] Task 6 — Composant InventaireList (AC: #1, #4, #5, #6)
  - [x] 6.1 Créer `src/components/InventaireList.tsx`
  - [x] 6.2 Affiche chaque item : designation, quantité, localisation (Plot X — Étage Y)
  - [x] 6.3 Boutons +/- pour ajustement rapide de quantité (min 56px touch target)
  - [x] 6.4 Suppression automatique quand quantité atteint 0 (avec confirmation AlertDialog)
  - [x] 6.5 État loading : skeleton × 3
  - [x] 6.6 État vide : icône Boxes + "Aucun matériel enregistré" + bouton CTA
  - [x] 6.7 Mode agrégé : grouper par designation, afficher total + détail par localisation quand `aggregated` prop est `true`
  - [x] 6.8 Créer `src/components/InventaireList.test.tsx`

- [x] Task 7 — Route inventaire page (AC: #1, #2, #3)
  - [x] 7.1 Créer `src/routes/_authenticated/chantiers/$chantierId/inventaire.tsx`
  - [x] 7.2 Header avec ArrowLeft retour + titre "Inventaire — {chantier.nom}"
  - [x] 7.3 InventaireList (mode agrégé au niveau chantier)
  - [x] 7.4 Fab "+" pour ouvrir le Sheet de création
  - [x] 7.5 Sheet création : designation (Input text), quantité (Input number), plot (Select), étage (Select filtré par plot)
  - [x] 7.6 Pré-remplir plot et étage depuis search params `?plotId=...&etageId=...` (AC: #3)
  - [x] 7.7 Validation : designation et quantité requis, quantité > 0
  - [x] 7.8 Créer `src/__tests__/inventaire-page.test.tsx`

- [x] Task 8 — Modifier chantier index : bouton Inventaire (AC: #1)
  - [x] 8.1 Ajouter un bouton "Inventaire" dans la barre de raccourcis du chantier complet (à côté de Besoins et Livraisons)
  - [x] 8.2 Icône : `Boxes` de lucide-react
  - [x] 8.3 Lien vers `/chantiers/$chantierId/inventaire`
  - [x] 8.4 Mettre à jour les tests existants de la page chantier

- [x] Task 9 — Tests de régression (AC: #1-6)
  - [x] 9.1 `npm run test` — tous les tests existants + nouveaux passent
  - [x] 9.2 `npm run lint` — 0 nouvelles erreurs
  - [x] 9.3 `npm run build` — 0 nouvelles erreurs tsc

## Dev Notes

### Vue d'ensemble — Stratégie d'implémentation

Cette story est la **cinquième et dernière de l'Epic 6** et implémente la **gestion d'inventaire avec localisation** (FR53-FR56). Les stories 6.1-6.4 ont construit le cycle complet besoins/livraisons. Cette story ajoute un **module d'inventaire indépendant** pour tracker le matériel sur le chantier.

**Scope précis :**
- Table `inventaire` avec localisation (plot + étage) pour chantiers complets uniquement
- Page inventaire au niveau chantier avec liste, création, ajustement rapide (+/-)
- Pré-remplissage de la localisation depuis le contexte de navigation
- Agrégation affichée : grouper par designation avec total + détail localisation
- Subscription realtime pour sync entre utilisateurs

**Hors scope (Epic 7) :**
- Croisement inventaire/métrés pour aide à la décision (Story 7.3)
- Saisie des m² et ML plinthes (Story 7.1)

**Décision architecturale — Agrégation côté client, pas triggers SQL :**
Contrairement aux tasks (progress_done/progress_total agrégés par triggers SQL cascade), l'inventaire n'a PAS de colonnes d'agrégation dans etages/plots/chantiers. La raison :
- L'agrégation progress est sur **un seul champ numérique par entité** (done/total), simple à maintenir par trigger.
- L'agrégation inventaire est **par designation** (grouper "Colle faïence 20kg" de 3 étages différents en un total). C'est une agrégation dynamique multi-lignes, pas un compteur simple.
- Solution : l'agrégation est faite **côté client** dans le composant `InventaireList` (mode `aggregated`). La query récupère tous les items du chantier et les groupe par designation en JS.
- Ce choix est valide car le volume est faible (50-200 items max par chantier, 2-3 utilisateurs).

### Ce qui existe déjà (à réutiliser, NE PAS recréer)

| Élément | Fichier | Notes |
|---------|---------|-------|
| `Fab` | `src/components/Fab.tsx` | Bouton flottant + menu — réutiliser directement |
| `BesoinsList` | `src/components/BesoinsList.tsx` | Pattern de référence pour la liste inventaire (loading, empty, items) |
| `StatusCard` | `src/components/StatusCard.tsx` | Pourrait être réutilisé pour les items d'inventaire — mais un design simple liste est plus adapté |
| `Sheet` / `SheetContent` | `src/components/ui/sheet.tsx` | Bottom sheet pour formulaire création |
| `Select` / `SelectTrigger` / `SelectContent` / `SelectItem` | `src/components/ui/select.tsx` | Dropdowns plot et étage dans le formulaire |
| `Input` | `src/components/ui/input.tsx` | Champs formulaire |
| `AlertDialog` | `src/components/ui/alert-dialog.tsx` | Confirmation suppression (quantité → 0) |
| `Button` | `src/components/ui/button.tsx` | Boutons +/- et CTA |
| `Badge` | `src/components/ui/badge.tsx` | Badge quantité |
| `usePlots(chantierId)` | `src/lib/queries/usePlots.ts` | Liste plots pour le Select — type `PlotRow` |
| `useEtages(plotId)` | `src/lib/queries/useEtages.ts` | Liste étages pour le Select filtré — type `EtageRow` |
| `useChantier(chantierId)` | `src/lib/queries/useChantier.ts` | Nom du chantier pour le header |
| `formatRelativeTime(date)` | `src/lib/utils/formatRelativeTime.ts` | Timestamps affichage |
| `apply_rls_policy()` | Fonction SQL existante | Applique les RLS policies standard |
| Type `Besoin` | `src/types/database.ts` | Pattern de référence pour le type `Inventaire` |

### Pourquoi PAS de vue inventaire au niveau plot ou étage

Le PRD (FR53-FR56) parle de "consulter l'inventaire au niveau plot" et "au niveau chantier". La story spécifie une **seule page inventaire au niveau chantier** avec :
- Mode agrégé (groupé par designation avec total) comme vue par défaut
- Détail de localisation visible pour chaque item (Plot X — Étage Y)

On ne crée PAS de page inventaire séparée par plot ou par étage. La page chantier-level suffit car :
1. Le volume est faible (50-200 items)
2. L'utilisateur peut voir la localisation de chaque item
3. Le groupement par designation donne la vue agrégée automatiquement
4. Ajouter des pages inventaire à chaque niveau hiérarchique serait du over-engineering pour ce MVP

### Migration SQL : 018_inventaire.sql

```sql
-- Story 6.5 : Gestion d'inventaire avec localisation

-- =====================
-- ENUM — Nouveaux types d'activité
-- =====================
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'inventaire_added';
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'inventaire_updated';

-- =====================
-- TABLE inventaire
-- =====================
CREATE TABLE public.inventaire (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id uuid NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  plot_id uuid NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
  etage_id uuid NOT NULL REFERENCES public.etages(id) ON DELETE CASCADE,
  designation text NOT NULL,
  quantite integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_inventaire_chantier_id ON public.inventaire(chantier_id);
CREATE INDEX idx_inventaire_plot_id ON public.inventaire(plot_id);
CREATE INDEX idx_inventaire_etage_id ON public.inventaire(etage_id);
SELECT public.apply_rls_policy('inventaire');

-- =====================
-- TRIGGER FUNCTION — Activity log pour inventaire
-- =====================
CREATE OR REPLACE FUNCTION public.log_inventaire_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'inventaire_added',
      COALESCE(auth.uid(), NEW.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      NEW.chantier_id,
      'inventaire',
      NEW.id,
      jsonb_build_object('designation', LEFT(NEW.designation, 80), 'quantite', NEW.quantite)
    );
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.quantite IS DISTINCT FROM NEW.quantite THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'inventaire_updated',
      COALESCE(auth.uid(), NEW.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      NEW.chantier_id,
      'inventaire',
      NEW.id,
      jsonb_build_object('designation', LEFT(NEW.designation, 80), 'quantite', NEW.quantite, 'old_quantite', OLD.quantite)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_inventaire_activity
  AFTER INSERT OR UPDATE OF quantite ON public.inventaire
  FOR EACH ROW EXECUTE FUNCTION public.log_inventaire_activity();
```

**Points clés migration :**
- `plot_id` et `etage_id` sont NOT NULL — l'inventaire a TOUJOURS une localisation (c'est le point de la feature)
- `quantite` défaut à 1 (ajout de 1 unité par défaut)
- Pas de colonnes d'agrégation dans les tables parentes — agrégation côté client
- Trigger activité sur INSERT et UPDATE de quantité uniquement (pas de DELETE trigger car suppression = quantité 0 puis DELETE)

### Type TypeScript : Inventaire

```typescript
// Ajouter dans src/types/database.ts, section Tables
inventaire: {
  Row: {
    id: string
    chantier_id: string
    plot_id: string
    etage_id: string
    designation: string
    quantite: number
    created_at: string
    created_by: string | null
  }
  Insert: {
    id?: string
    chantier_id: string
    plot_id: string
    etage_id: string
    designation: string
    quantite?: number
    created_at?: string
    created_by?: string | null
  }
  Update: {
    id?: string
    chantier_id?: string
    plot_id?: string
    etage_id?: string
    designation?: string
    quantite?: number
    created_at?: string
    created_by?: string | null
  }
  Relationships: []
}
```

**IMPORTANT** : inclure `Relationships: []` pour que supabase-js v2 infère correctement les types Row via `.select('*')`. Voir MEMORY.md.

### Helper type avec noms de localisation

```typescript
// Dans src/lib/queries/useInventaire.ts
export interface InventaireWithLocation extends Inventaire {
  plots: { nom: string }
  etages: { nom: string }
}
```

### Query : useInventaire

```typescript
// src/lib/queries/useInventaire.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Inventaire } from '@/types/database'

export interface InventaireWithLocation extends Inventaire {
  plots: { nom: string }
  etages: { nom: string }
}

export function useInventaire(chantierId: string) {
  return useQuery({
    queryKey: ['inventaire', chantierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventaire')
        .select('*, plots(nom), etages(nom)')
        .eq('chantier_id', chantierId)
        .order('designation', { ascending: true })

      if (error) throw error
      return data as unknown as InventaireWithLocation[]
    },
    enabled: !!chantierId,
  })
}
```

**Points clés :**
- Join `.select('*, plots(nom), etages(nom)')` — Supabase auto-join via FK `plot_id` et `etage_id`
- Tri par `designation ASC` pour grouper visuellement les mêmes matériaux
- QueryKey : `['inventaire', chantierId]` — convention établie

### Mutations — Patterns

**useCreateInventaire :**
```typescript
// src/lib/mutations/useCreateInventaire.ts
mutationFn: async ({ chantierId, plotId, etageId, designation, quantite }) => {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('inventaire')
    .insert({
      chantier_id: chantierId,
      plot_id: plotId,
      etage_id: etageId,
      designation: designation.trim(),
      quantite,
      created_by: user?.id ?? null,
    })
    .select('*, plots(nom), etages(nom)')
    .single()
  if (error) throw error
  return data
}
// onMutate: optimistic insert dans cache ['inventaire', chantierId]
// onError: rollback
// onSettled: invalidateQueries(['inventaire', chantierId])
```

**useUpdateInventaire :**
```typescript
// src/lib/mutations/useUpdateInventaire.ts
mutationFn: async ({ id, quantite }) => {
  const { data, error } = await supabase
    .from('inventaire')
    .update({ quantite })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
// Optimistic update sur quantité dans le cache
```

**useDeleteInventaire :**
```typescript
// src/lib/mutations/useDeleteInventaire.ts
mutationFn: async ({ id }) => {
  const { error } = await supabase
    .from('inventaire')
    .delete()
    .eq('id', id)
  if (error) throw error
}
// Optimistic remove du cache
```

### Subscription : useRealtimeInventaire

```typescript
// src/lib/subscriptions/useRealtimeInventaire.ts
// Channel: 'inventaire:chantier_id=eq.{chantierId}'
// Events: '*' (INSERT, UPDATE, DELETE)
// Invalidation: ['inventaire', chantierId]
```

**Pattern identique** à `useRealtimeBesoins` — même structure exacte.

### Composant InventaireList — Design

```
MODE LISTE (par défaut) :
┌──────────────────────────────────────────────────┐
│ Colle pour faïence 20kg                          │
│ Plot A — RDC                    [-]  12  [+]     │
├──────────────────────────────────────────────────┤
│ Colle pour faïence 20kg                          │
│ Plot A — É1                     [-]   8  [+]     │
├──────────────────────────────────────────────────┤
│ Croisillons 2mm                                  │
│ Plot B — RDC                    [-]   5  [+]     │
└──────────────────────────────────────────────────┘

MODE AGRÉGÉ (prop aggregated=true, vue chantier) :
┌──────────────────────────────────────────────────┐
│ Colle pour faïence 20kg              Total: 20   │
│   Plot A — RDC : 12                              │
│   Plot A — É1 : 8                                │
├──────────────────────────────────────────────────┤
│ Croisillons 2mm                      Total: 5    │
│   Plot B — RDC : 5                               │
└──────────────────────────────────────────────────┘
```

**Interactions +/- :**
- Boutons `-` et `+` : taille 48px minimum (56px cible)
- `-` quand quantité = 1 → ouvre AlertDialog "Supprimer ce matériel ?" (action destructive)
- `-` quand quantité > 1 → décrémente de 1 directement (pas de confirmation, action terrain courante)
- `+` → incrémente de 1 directement
- Mutation optimiste pour feedback < 300ms

**Mode agrégé :**
- Grouper les items par `designation` (case-insensitive trim)
- Afficher total = somme des quantités de tous les items avec la même designation
- Sous chaque groupe, lister les localisations avec quantité individuelle
- Les boutons +/- sont sur chaque item individuel (pas sur le total)

### Page inventaire — Architecture

```
┌─────────────────────────────────────────────────┐
│ ← Inventaire — Résidence Les Oliviers      (h1) │
├─────────────────────────────────────────────────┤
│ X matériaux enregistrés                     (h2) │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Colle pour faïence 20kg]          Total: 20    │
│   Plot A — RDC : 12          [-] [12] [+]       │
│   Plot A — É1 : 8            [-] [ 8] [+]       │
│                                                 │
│ [Croisillons 2mm]                  Total: 5     │
│   Plot B — RDC : 5           [-] [ 5] [+]       │
│                                                 │
├─────────────────────────────────────────────────┤
│ [État vide: icône Boxes + "Aucun matériel"]     │
├─────────────────────────────────────────────────┤
│                                         [+ FAB] │
└─────────────────────────────────────────────────┘
```

### Formulaire création — Sheet bottom

```
┌─────────────────────────────────────────────────┐
│ Nouveau matériel                                │
│ Ajoutez du matériel à l'inventaire du chantier. │
├─────────────────────────────────────────────────┤
│ Désignation                                     │
│ ┌─────────────────────────────────────────────┐ │
│ │ Ex: Colle pour faïence 20kg                 │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Quantité                                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ 1                               (inputmode) │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Plot                                            │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Select: Plot A ▼]                          │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Étage                                           │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Select: RDC ▼]         (filtré par plot)   │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [         Ajouter le matériel        ]          │
└─────────────────────────────────────────────────┘
```

**Règles formulaire (UX spec) :**
- Max 3 champs visibles → 4 champs ici mais les selects sont compacts et c'est un formulaire de création complet. Acceptable.
- `inputmode="numeric"` sur le champ quantité
- Labels fixes au-dessus de chaque champ (pas de labels flottants)
- Bouton de validation toujours actif visuellement, validation au submit
- Plot et Étage : `Select` shadcn, chargés via `usePlots(chantierId)` et `useEtages(plotId)`
- Étage filtré dynamiquement quand le plot change

### Pré-remplissage localisation (AC: #3)

**Approche : search params sur le lien**

Quand l'utilisateur navigue vers la page inventaire depuis un contexte de plot/étage, le lien inclut des search params :
```typescript
// Depuis n'importe quelle page de plot/étage — futur possible
<Link
  to="/chantiers/$chantierId/inventaire"
  params={{ chantierId }}
  search={{ plotId: 'xxx', etageId: 'yyy' }}
>
```

La page inventaire lit ces search params et pré-remplit les selects dans le Sheet de création :
```typescript
const { plotId: defaultPlotId, etageId: defaultEtageId } = Route.useSearch()
```

**Pour le MVP**, l'accès principal est le bouton "Inventaire" sur la page chantier index (pas de contexte plot/étage). Le pré-remplissage est donc documenté et prêt mais sera activé quand on ajoutera des liens "Inventaire" depuis les vues plot/étage (hors scope de cette story). Le code de lecture des search params doit être présent et fonctionnel.

### Modification chantier index — bouton Inventaire

**Avant (actuel) :**
```jsx
<Badge variant="secondary">Complet</Badge>
<Button variant="outline" size="sm">Besoins</Button>
<Button variant="outline" size="sm">Livraisons</Button>
```

**Après :**
```jsx
<Badge variant="secondary">Complet</Badge>
<Button variant="outline" size="sm">Besoins</Button>
<Button variant="outline" size="sm">Livraisons</Button>
<Button variant="outline" size="sm">Inventaire</Button>  ← NOUVEAU
```

**Icône** : `Boxes` de `lucide-react` (cohérent avec le thème matériel/stockage)

### Utilitaires d'agrégation côté client

```typescript
// Dans InventaireList.tsx ou un helper dédié
interface AggregatedGroup {
  designation: string
  totalQuantite: number
  items: InventaireWithLocation[]
}

function aggregateByDesignation(items: InventaireWithLocation[]): AggregatedGroup[] {
  const groups = new Map<string, InventaireWithLocation[]>()
  for (const item of items) {
    const key = item.designation.trim().toLowerCase()
    const existing = groups.get(key) ?? []
    existing.push(item)
    groups.set(key, existing)
  }
  return Array.from(groups.entries()).map(([, items]) => ({
    designation: items[0].designation, // Garder la casse originale du premier item
    totalQuantite: items.reduce((sum, i) => sum + i.quantite, 0),
    items: items.sort((a, b) => `${a.plots.nom} ${a.etages.nom}`.localeCompare(`${b.plots.nom} ${b.etages.nom}`)),
  }))
}
```

### Schéma DB — Table inventaire

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | gen_random_uuid() |
| chantier_id | uuid FK → chantiers | Chantier parent |
| plot_id | uuid FK → plots | Plot de localisation |
| etage_id | uuid FK → etages | Étage de localisation |
| designation | text NOT NULL | Nom libre du matériel (ex: "Colle faïence 20kg") |
| quantite | integer NOT NULL DEFAULT 1 | Quantité en unités |
| created_at | timestamptz NOT NULL | Date de création |
| created_by | uuid FK → auth.users | Auteur |

### Project Structure Notes

**Nouveaux fichiers (12+) :**
- `supabase/migrations/018_inventaire.sql`
- `src/lib/queries/useInventaire.ts` + test
- `src/lib/mutations/useCreateInventaire.ts` + test
- `src/lib/mutations/useUpdateInventaire.ts` + test
- `src/lib/mutations/useDeleteInventaire.ts` + test
- `src/lib/subscriptions/useRealtimeInventaire.ts` + test
- `src/components/InventaireList.tsx` + test
- `src/routes/_authenticated/chantiers/$chantierId/inventaire.tsx`
- `src/__tests__/inventaire-page.test.tsx`

**Fichiers modifiés (2) :**
- `src/types/database.ts` — ajout type `Inventaire` dans Tables
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — ajout bouton Inventaire

### Prérequis et dépendances

- **Migration SQL** : Nécessaire — créer la table `inventaire` (018_inventaire.sql)
- **Aucune dépendance npm** à ajouter — tout est dans le projet
- **Stories 6.1-6.4** : `done` — patterns établis, composants réutilisables en place
- **Composants shadcn** : Select, Sheet, Input, AlertDialog, Button, Badge — tous déjà installés
- **usePlots** et **useEtages** : existent déjà — fournissent les données pour les dropdowns de localisation

### Risques et points d'attention

1. **Select étage filtré par plot** : Le hook `useEtages(plotId)` existe mais nécessite un `plotId`. Dans le formulaire de création, quand l'utilisateur change le plot sélectionné, il faut recharger les étages. Gérer le `plotId` en state local et passer à `useEtages()`. Si le plot change, reset l'étage sélectionné.

2. **Agrégation case-insensitive** : "Colle faïence 20kg" et "colle faïence 20kg" doivent être groupés. Normaliser avec `.trim().toLowerCase()` pour la clé de groupement, mais afficher le texte original (premier item du groupe).

3. **Quantité minimum** : La quantité minimum est 1. Quand l'utilisateur tap `-` à quantité = 1, ouvrir un AlertDialog de confirmation de suppression. Ne PAS permettre quantité = 0 en base (supprimer le row).

4. **Chantier complet uniquement** : La page inventaire n'est accessible que pour les chantiers complets (type `'complet'`). Les chantiers légers n'ont pas de plots/étages donc pas de localisation possible. Le bouton "Inventaire" n'apparaît que pour `chantier.type === 'complet'`.

5. **Pre-existing issues** : Mêmes que stories précédentes — 16 test failures pré-existants (pwa-config 5, pwa-html 5, hasPointerCapture 6), lint error ThemeProvider.tsx:64, erreurs TS pré-existantes database.ts.

6. **Route tree gen** : Après création de `inventaire.tsx`, exécuter le dev server ou `npx tsr generate` pour mettre à jour `routeTree.gen.ts`. Le routeFileIgnorePattern exclut les `*.test.tsx`.

7. **Search params typing** : Pour le pré-remplissage, déclarer les search params dans la route :
```typescript
export const Route = createFileRoute('/_authenticated/chantiers/$chantierId/inventaire')({
  validateSearch: (search: Record<string, unknown>) => ({
    plotId: typeof search.plotId === 'string' ? search.plotId : undefined,
    etageId: typeof search.etageId === 'string' ? search.etageId : undefined,
  }),
  component: InventairePage,
})
```

### Learnings des stories précédentes (relevants)

- **Besoins page pattern** : Header avec ArrowLeft, liste, Fab, Sheet création. Reproduire exactement pour la page inventaire.
- **Mutation pattern** : `useCreateBesoin` montre le pattern complet (optimistic insert, rollback, invalidation). Reproduire pour `useCreateInventaire`.
- **Subscription pattern** : `useRealtimeBesoins(chantierId)` — channel avec filtre, invalidation. Pattern identique pour inventaire.
- **Select component** : `src/components/ui/select.tsx` est installé — utiliser `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` de shadcn.
- **Cast pattern** : `data as unknown as InventaireWithLocation[]` — pattern établi pour contourner les types Supabase (voir Story 6.4 learnings).
- **Mock supabase chainable** : `from → select → eq → order` chacun retourne mock avec méthode suivante.
- **Route tests** : `createRouter` + `createMemoryHistory` + wrappers (AuthContext, QueryClient).
- **Chantier index buttons** : Les boutons Besoins/Livraisons montrent le pattern exact pour ajouter Inventaire (icône + label + Link).

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 6.5, Epic 6, FR53-FR56]
- [Source: _bmad-output/planning-artifacts/prd.md — FR53 enregistrer matériel, FR54 pré-remplir localisation, FR55 agrégation, FR56 ajustement rapide]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — §Formulaires max 3 champs, §Contexte voyage avec utilisateur, §Actions terrain sans confirmation]
- [Source: _bmad-output/planning-artifacts/architecture.md — Route inventaire.tsx, table inventaire dans 004_besoins_livraisons.sql (prévue), patterns mutations/subscriptions]
- [Source: _bmad-output/implementation-artifacts/6-4-vue-globale-des-livraisons-filtree-par-statut.md — Learnings subscriptions globales, DeliveryCard, BottomNavigation badge]
- [Source: src/routes/_authenticated/chantiers/$chantierId/besoins.tsx — Pattern page complet avec header, sheet, list, fab]
- [Source: src/routes/_authenticated/chantiers/$chantierId/index.tsx — Boutons raccourcis Besoins/Livraisons (pattern pour ajout Inventaire)]
- [Source: src/components/BesoinsList.tsx — Pattern liste avec loading/empty/items]
- [Source: src/lib/queries/useBesoins.ts — Pattern query per-chantier]
- [Source: src/lib/mutations/useCreateBesoin.ts — Pattern mutation optimiste]
- [Source: src/lib/subscriptions/useRealtimeBesoins.ts — Pattern subscription per-chantier]
- [Source: src/lib/queries/usePlots.ts — Données plots pour dropdown formulaire]
- [Source: src/lib/queries/useEtages.ts — Données étages pour dropdown formulaire filtré]
- [Source: src/types/database.ts — Pattern types avec Relationships: []]
- [Source: supabase/migrations/016_besoins_livraisons.sql — Pattern migration table + triggers activité]
- [Source: supabase/migrations/010_aggregation_triggers.sql — Pattern triggers cascade (référence, non utilisé ici)]
- [Source: src/components/ui/select.tsx — Composant shadcn Select]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun problème bloquant rencontré.

### Completion Notes List

- **Task 1** : Migration SQL `018_inventaire.sql` créée — table `inventaire` avec FK cascade, 3 index, RLS, 2 event types ajoutés à `activity_event_type`, trigger `log_inventaire_activity()` sur INSERT + UPDATE quantite.
- **Task 2** : Interface `Inventaire` ajoutée dans `database.ts` + event types enum mis à jour. `InventaireWithLocation` défini dans `useInventaire.ts`.
- **Task 3** : `useInventaire(chantierId)` — query avec join `plots(nom)`, `etages(nom)`, tri `designation ASC`. 3 tests.
- **Task 4** : 3 mutations optimistes (`useCreateInventaire`, `useUpdateInventaire`, `useDeleteInventaire`). Chacune invalide `['inventaire', chantierId]` dans `onSettled`. 9 tests.
- **Task 5** : `useRealtimeInventaire(chantierId)` — subscription postgres_changes sur table `inventaire`. 5 tests.
- **Task 6** : `InventaireList` — modes liste et agrégé, boutons +/- (h-9 w-9 touch target), AlertDialog confirmation suppression, skeleton loading, état vide avec CTA. 10 tests.
- **Task 7** : Route `/chantiers/$chantierId/inventaire` avec header, InventaireList agrégé, Fab, Sheet création (4 champs), search params pré-remplissage, validation. 5 tests.
- **Task 8** : Bouton "Inventaire" (icône Boxes) ajouté dans barre raccourcis chantier complet. 2 tests ajoutés.
- **Task 9** : Régression OK — 844 tests passent (16 pré-existants échouent), 0 nouvelles erreurs lint, 0 nouvelles erreurs TS.
- **Décision** : `chantierId` non destructuré dans `mutationFn` de `useUpdateInventaire` et `useDeleteInventaire` (utilisé uniquement dans `onMutate`/`onError`/`onSettled`) pour éviter erreur lint `no-unused-vars`.

### Change Log

- 2026-02-12 : Story 6.5 implémentée — gestion d'inventaire avec localisation (9 tasks, 34 tests)
- 2026-02-12 : Code review adversariale — 7 issues trouvées (2 HIGH, 3 MEDIUM, 2 LOW), toutes corrigées :
  - [H1] Ajout validation plot/étage dans le formulaire de création (inventaire.tsx)
  - [H2] Ajout champs metadata inventaire dans type ActivityLog (database.ts)
  - [M1] Touch target +/- buttons augmenté de h-9 (36px) à h-12 (48px) (InventaireList.tsx)
  - [M2] Ajout tri secondaire `created_at DESC` dans useInventaire (useInventaire.ts)
  - [M3] Ajout 4 tests formulaire création (inventaire-page.test.tsx) — total: 9 tests page
  - [L1] Dédupliqué AlertDialog dans InventaireList (suppression code dupliqué)
  - [L2] Corrigé compteur fichiers dans File List (14 → 15)
  - Tests: 848 passed (+4 nouveaux), 16 failed (tous pré-existants)

### File List

**Nouveaux fichiers (15) :**
- `supabase/migrations/018_inventaire.sql`
- `src/lib/queries/useInventaire.ts`
- `src/lib/queries/useInventaire.test.ts`
- `src/lib/mutations/useCreateInventaire.ts`
- `src/lib/mutations/useCreateInventaire.test.ts`
- `src/lib/mutations/useUpdateInventaire.ts`
- `src/lib/mutations/useUpdateInventaire.test.ts`
- `src/lib/mutations/useDeleteInventaire.ts`
- `src/lib/mutations/useDeleteInventaire.test.ts`
- `src/lib/subscriptions/useRealtimeInventaire.ts`
- `src/lib/subscriptions/useRealtimeInventaire.test.ts`
- `src/components/InventaireList.tsx`
- `src/components/InventaireList.test.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/inventaire.tsx`
- `src/__tests__/inventaire-page.test.tsx`

**Fichiers modifiés (4) :**
- `src/types/database.ts` — ajout interface `Inventaire` + event types enum
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — ajout bouton Inventaire (Boxes icon + Link)
- `src/routes/_authenticated/chantiers/$chantierId/index.test.tsx` — 2 tests ajoutés pour bouton Inventaire
- `src/routeTree.gen.ts` — régénéré automatiquement (nouvelle route inventaire)
