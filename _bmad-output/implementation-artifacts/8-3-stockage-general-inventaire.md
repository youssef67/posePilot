# Story 8.3: Stockage général — Inventaire sans emplacement obligatoire

Status: done

## Story

En tant que utilisateur de posePilot sur un chantier,
Je veux pouvoir enregistrer du matériel en "stockage général" sans devoir spécifier un plot et un étage,
Afin de représenter la zone de réception/stockage central du chantier où le matériel est entreposé avant distribution.

## Acceptance Criteria

1. **Given** l'utilisateur ouvre le formulaire d'ajout de matériel **When** il active le switch "Stockage général" **Then** les sélecteurs de plot et d'étage sont masqués et l'item sera créé sans emplacement

2. **Given** l'utilisateur crée un item en mode "Stockage général" **When** il remplit désignation et quantité et soumet **Then** l'item est créé avec `plot_id = NULL` et `etage_id = NULL`

3. **Given** l'utilisateur consulte la liste d'inventaire en mode agrégé **When** des items existent en stockage général **Then** ils apparaissent avec le label "Stockage général" au lieu de "Plot — Étage"

4. **Given** la base de données contient un item d'inventaire **When** `plot_id` est NULL **Then** `etage_id` est aussi NULL (contrainte CHECK : les deux null ou les deux non-null)

5. **Given** un item en stockage général existe **When** l'utilisateur clique supprimer **Then** le dialog de confirmation affiche "Stockage général" au lieu du nom de plot/étage

6. **Given** des items existent en stockage général et sur des étages **When** la page inventaire est affichée **Then** le compteur de matériaux et l'agrégation fonctionnent identiquement pour les deux types

7. **Given** l'utilisateur ouvre le formulaire sans search params `plotId`/`etageId` **When** le switch "Stockage général" est visible **Then** il est désactivé par défaut (mode emplacement précis par défaut)

8. **Given** le formulaire est en mode "Stockage général" **When** l'utilisateur désactive le switch **Then** les sélecteurs de plot et étage réapparaissent avec leurs valeurs précédentes

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : `plot_id` et `etage_id` nullable (AC: #2, #4)
  - [x] 1.1 Créer `supabase/migrations/026_inventaire_stockage_general.sql`
  - [x] 1.2 `ALTER TABLE inventaire ALTER COLUMN plot_id DROP NOT NULL`
  - [x] 1.3 `ALTER TABLE inventaire ALTER COLUMN etage_id DROP NOT NULL`
  - [x] 1.4 `ADD CONSTRAINT chk_inventaire_location CHECK ((plot_id IS NULL) = (etage_id IS NULL))`

- [x] Task 2 — Types TypeScript (AC: #2)
  - [x] 2.1 Mettre à jour `Inventaire` dans `database.ts` : `plot_id: string | null`, `etage_id: string | null`
  - [x] 2.2 Mettre à jour `InventaireWithLocation` dans `useInventaire.ts` : `plots: { nom: string } | null`, `etages: { nom: string } | null`

- [x] Task 3 — Hook `useCreateInventaire` : plotId/etageId optionnels (AC: #1, #2)
  - [x] 3.1 Rendre `plotId` et `etageId` optionnels (`string | null`) dans le type de paramètre
  - [x] 3.2 Passer `null` quand non fournis dans l'insert Supabase
  - [x] 3.3 Adapter l'optimistic update pour gérer `plots: null`, `etages: null`

- [x] Task 4 — UI formulaire : switch "Stockage général" (AC: #1, #7, #8)
  - [x] 4.1 Ajouter un `Switch` dans le Sheet entre Quantité et Plot
  - [x] 4.2 Quand activé : masquer Plot + Étage, envoyer null
  - [x] 4.3 Quand désactivé : afficher Plot + Étage (comportement actuel)
  - [x] 4.4 Supprimer validation plot/étage quand switch activé

- [x] Task 5 — UI liste : affichage "Stockage général" (AC: #3, #5, #6)
  - [x] 5.1 Dans `InventaireList` mode agrégé : afficher "Stockage général" si `plots === null`
  - [x] 5.2 Dans la dialog de suppression : afficher "Stockage général" si pas de location
  - [x] 5.3 Trier : items "Stockage général" en premier dans chaque groupe d'agrégation

- [x] Task 6 — Tests + lint (AC: tous)
  - [x] 6.1 Vérifier lint (`npm run lint`) — 2 erreurs pré-existantes (ThemeProvider, livraisons-page.test)
  - [x] 6.2 Vérifier TypeScript (`npx tsc --noEmit`) — 0 erreurs
  - [x] 6.3 Exécuter 33 tests inventaire — 33/33 passent, 0 régression

## Dev Notes

### Vue d'ensemble

Story simple de **schema + UI**. On rend `plot_id` et `etage_id` nullable dans `inventaire` pour permettre un "stockage général" au niveau chantier. L'UI ajoute un switch dans le formulaire de création et gère l'affichage des items sans emplacement.

### Ce qui existe déjà

| Élément | Fichier | Notes |
|---------|---------|-------|
| Switch UI | `src/components/ui/switch.tsx` | shadcn, déjà utilisé dans 4+ fichiers |
| CRUD inventaire | `src/lib/mutations/useCreate/Update/DeleteInventaire.ts` | À adapter pour null |
| Query inventaire | `src/lib/queries/useInventaire.ts` | Select avec join plots/etages |
| Liste inventaire | `src/components/InventaireList.tsx` | Agrégation + contrôles +/- |
| Page inventaire | `src/routes/.../inventaire.tsx` | Sheet de création |

### Migration SQL

```sql
-- Rendre plot_id et etage_id optionnels
ALTER TABLE public.inventaire ALTER COLUMN plot_id DROP NOT NULL;
ALTER TABLE public.inventaire ALTER COLUMN etage_id DROP NOT NULL;

-- Contrainte : les deux null OU les deux non-null
ALTER TABLE public.inventaire
  ADD CONSTRAINT chk_inventaire_location
  CHECK ((plot_id IS NULL) = (etage_id IS NULL));
```

### Type TypeScript

```typescript
// database.ts — Inventaire
export interface Inventaire {
  id: string
  chantier_id: string
  plot_id: string | null    // ← était string
  etage_id: string | null   // ← était string
  designation: string
  quantite: number
  created_at: string
  created_by: string | null
}

// useInventaire.ts — InventaireWithLocation
export interface InventaireWithLocation extends Inventaire {
  plots: { nom: string } | null   // ← était toujours { nom: string }
  etages: { nom: string } | null  // ← idem
}
```

### UI — Switch dans le formulaire

```tsx
<div className="flex items-center justify-between">
  <label htmlFor="stockage-general" className="text-sm font-medium text-foreground">
    Stockage général
  </label>
  <Switch
    id="stockage-general"
    checked={isStockageGeneral}
    onCheckedChange={setIsStockageGeneral}
  />
</div>
{!isStockageGeneral && (
  <>
    {/* Sélecteurs Plot + Étage existants */}
  </>
)}
```

### UI — Affichage dans la liste

Pour les items sans emplacement (`plots === null`) :
- Mode agrégé sub-item : `"Stockage général : {quantite}"` au lieu de `"Plot — Étage : {quantite}"`
- Dialog suppression : `"{designation} (Stockage général) sera supprimé..."`
- Tri dans les groupes : items stockage général en premier

### Risques et points d'attention

1. **Supabase left join** : Quand `plot_id` est NULL, `select('*, plots(nom), etages(nom)')` retourne `plots: null` et `etages: null` automatiquement — pas de changement côté query nécessaire
2. **Trigger activity log** : Fonctionne déjà car il log `NEW.designation` et `NEW.quantite`, pas plot/étage
3. **computeChantierIndicators** : `computeMetrageVsInventaire()` itère sur `item.designation` et `item.quantite` uniquement — aucun changement nécessaire

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### File List

**Nouveaux fichiers (1) :**
- `supabase/migrations/026_inventaire_stockage_general.sql`

**Fichiers modifiés (5) :**
- `src/types/database.ts`
- `src/lib/queries/useInventaire.ts`
- `src/lib/mutations/useCreateInventaire.ts`
- `src/components/InventaireList.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/inventaire.tsx`
