# Story 6.12: Montant TTC et suivi des dépenses par chantier

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'utilisateur de posePilot,
Je veux saisir un montant TTC sur mes livraisons et visualiser le total dépensé par chantier,
Afin que je suive mes dépenses d'approvisionnement et que j'aie une vision financière rapide par chantier.

## Acceptance Criteria

1. **Given** l'utilisateur passe une livraison en statut "commandé" **When** le sheet de passage en commande s'affiche **Then** un champ "Montant TTC" (numérique, optionnel) est disponible

2. **Given** l'utilisateur édite une livraison au statut "commandé" ou supérieur **When** le sheet d'édition s'affiche **Then** le champ "Montant TTC" est pré-rempli (ou vide si non renseigné) et modifiable

3. **Given** une livraison a un montant TTC renseigné **When** l'utilisateur consulte la DeliveryCard **Then** le montant est affiché sur la carte (formaté en euros, ex: "1 250,00 €")

4. **Given** une livraison est au statut "commandé" et n'a PAS de montant TTC **When** l'utilisateur tente de l'avancer en "livraison prévue" ou "à récupérer" **Then** la transition est bloquée et un message indique qu'un montant est requis

5. **Given** des livraisons avec montant TTC existent pour un chantier **When** l'utilisateur consulte la page index du chantier (`/chantiers/$chantierId`) **Then** le total TTC du chantier est affiché dans les indicateurs (somme de tous les `montant_ttc` non null)

6. **Given** une livraison est supprimée **When** le total chantier est recalculé **Then** le montant de la livraison supprimée n'est plus compté (SUM live)

7. **Given** une livraison parent (mergée) a un montant TTC **When** le total chantier est calculé **Then** seul le montant du parent est compté (les enfants avec `parent_id` non null sont exclus du SUM si le parent a un montant)

8. **Given** l'utilisateur passe plusieurs livraisons en bulk de "prévu" à "commandé" **When** le bulk action s'exécute **Then** aucun montant n'est demandé (bulk → le montant sera saisi individuellement après)

9. **Given** l'utilisateur passe plusieurs livraisons en bulk de "commandé" à "livraison prévue" **When** certaines livraisons n'ont pas de montant TTC **Then** la transition bulk est bloquée avec un message indiquant quelles livraisons manquent de montant

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : colonne montant_ttc (AC: #1, #2, #3)
  - [x] 1.1 Créer `supabase/migrations/032_livraison_montant_ttc.sql`
  - [x] 1.2 `ALTER TABLE public.livraisons ADD COLUMN montant_ttc numeric DEFAULT NULL;`
  - [x] 1.3 Mettre à jour le trigger `log_livraison_activity()` pour inclure `montant_ttc` dans les colonnes surveillées (UPDATE OF ... + montant_ttc) et logger `montant_ttc` dans les metadata quand il change

- [x] Task 2 — Types TypeScript (AC: #1, #2, #3)
  - [x] 2.1 Ajouter `montant_ttc: number | null` à `interface Livraison` dans `src/types/database.ts`
  - [x] 2.2 Ajouter `montant_ttc` dans les types DB Row/Insert/Update de la table livraisons

- [x] Task 3 — Mutation useUpdateLivraisonStatus : accepter montant_ttc (AC: #1)
  - [x] 3.1 Modifier `src/lib/mutations/useUpdateLivraisonStatus.ts` — ajouter `montantTtc?: number | null` dans `UpdateStatusParams` et `UpdateStatusCoreParams`
  - [x] 3.2 Dans `updateLivraisonStatus()`, si `montantTtc !== undefined`, inclure `montant_ttc` dans `updateData`
  - [x] 3.3 Mettre à jour l'optimistic update dans `onMutate` pour propager `montant_ttc`
  - [x] 3.4 Mettre à jour `src/lib/mutations/useUpdateLivraisonStatus.test.ts`

- [x] Task 4 — Mutation useUpdateLivraison : accepter montant_ttc (AC: #2)
  - [x] 4.1 Modifier `src/lib/mutations/useUpdateLivraison.ts` — ajouter `montantTtc: number | null` dans `UpdateLivraisonInput`
  - [x] 4.2 Inclure `montant_ttc` dans le `.update()` Supabase et l'optimistic update
  - [x] 4.3 Élargir la garde serveur : `.in('status', ['prevu', 'commande', 'livraison_prevue', 'a_recuperer'])` — bloque uniquement les statuts terminaux
  - [x] 4.4 Mettre à jour `src/lib/mutations/useUpdateLivraison.test.ts`

- [x] Task 5 — Hook useLivraisonActions : états et handlers montant (AC: #1, #2, #4)
  - [x] 5.1 Modifier `src/lib/hooks/useLivraisonActions.ts`
  - [x] 5.2 Ajouter états : `commandeMontant` (string, pour le sheet commande), `editMontantTtc` (string, pour le sheet édition)
  - [x] 5.3 Modifier `handleAdvanceStatus` : quand status === 'prevu', ouvrir le sheet commande (déjà le cas) et reset `commandeMontant`
  - [x] 5.4 Modifier `handleConfirmCommande` : passer `montantTtc: parseFloat(commandeMontant) || null` dans l'appel `updateLivraisonStatus`
  - [x] 5.5 Modifier `handleAdvanceStatus` : quand status === 'commande' et `!livraison.montant_ttc`, bloquer la transition vers `livraison_prevue` / `a_recuperer` avec toast d'erreur "Montant TTC requis pour avancer"
  - [x] 5.6 Modifier `handleEditLivraison` : pré-remplir `editMontantTtc` avec `livraison.montant_ttc?.toString() ?? ''`
  - [x] 5.7 Modifier `handleConfirmEdit` : passer `montantTtc: parseFloat(editMontantTtc) || null` dans l'appel `updateLivraison`

- [x] Task 6 — Composant LivraisonSheets : champ montant TTC (AC: #1, #2)
  - [x] 6.1 Modifier `src/components/LivraisonSheets.tsx` — dans le sheet "Passer en commande", ajouter un `<Input type="number" inputMode="decimal" step="0.01" placeholder="Montant TTC (optionnel)" />` après le champ fournisseur
  - [x] 6.2 Modifier `src/components/EditLivraisonSheet.tsx` — ajouter un champ "Montant TTC" (`<Input type="number" inputMode="decimal" step="0.01">`) après le champ fournisseur, pré-rempli

- [x] Task 7 — Blocage transition commande → livraison_prevue/a_recuperer sans montant (AC: #4)
  - [x] 7.1 Dans `useLivraisonActions.handleAdvanceStatus` : si `status === 'commande'` et `montant_ttc` est null → afficher toast.error("Veuillez d'abord renseigner le montant TTC via le bouton Modifier") et ne pas avancer
  - [x] 7.2 Dans la page per-chantier livraisons, bulk flow : dans `handleBulkAction`, si newStatus est `livraison_prevue` ou `a_recuperer`, vérifier que toutes les livraisons sélectionnées ont `montant_ttc !== null` — sinon afficher un message d'erreur dans la barre d'action avec le nombre de livraisons sans montant

- [x] Task 8 — DeliveryCard : affichage montant TTC (AC: #3)
  - [x] 8.1 Modifier `src/components/DeliveryCard.tsx` — afficher le montant TTC formaté (ex: "1 250,00 €") si non null, à côté ou sous le fournisseur
  - [x] 8.2 Utiliser `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })` pour le formatage
  - [x] 8.3 Mettre à jour `src/components/DeliveryCard.test.tsx`

- [x] Task 9 — Indicateur total dépenses sur page index chantier (AC: #5, #6, #7)
  - [x] 9.1 Modifier `src/components/ChantierIndicators.tsx` — ajouter une prop `totalDepenses: number | null` et afficher un indicateur (icône `Banknote` ou `CircleDollarSign`) avec le montant formaté si > 0
  - [x] 9.2 Modifier `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — calculer le total TTC à partir des livraisons existantes (via `useLivraisons` déjà chargé, ou un query dédié) et le passer à `ChantierIndicators`
  - [x] 9.3 Règle de calcul : `SUM(montant_ttc)` des livraisons avec `parent_id IS NULL` (top-level uniquement) pour le chantier. Les enfants mergés ne sont pas comptés si le parent porte son propre montant.
  - [x] 9.4 Mettre à jour `src/routes/_authenticated/chantiers/$chantierId/index.test.tsx`

- [x] Task 10 — Tests de régression (AC: #1-9)
  - [x] 10.1 `npm run test` — tous les tests story-related passent, 0 nouvelles régressions
  - [x] 10.2 `npm run lint` — 0 nouvelles erreurs
  - [x] 10.3 `npm run build` — 0 nouvelles erreurs tsc

## Dev Notes

### Vue d'ensemble — Stratégie d'implémentation

Cette story ajoute le **suivi financier des livraisons** via un champ `montant_ttc` sur la table `livraisons`. Le montant est saisi de manière facultative lors du passage en commande, mais devient **obligatoire pour avancer au-delà de "commandé"**. Un indicateur de total dépenses est affiché sur la page index de chaque chantier.

**Scope précis :**
- Nouvelle colonne `montant_ttc NUMERIC NULL` sur la table `livraisons`
- Saisie optionnelle du montant lors du passage `prevu → commande` (sheet commande)
- Saisie/modification du montant via le sheet d'édition (pré-rempli)
- Affichage du montant formaté sur DeliveryCard
- Blocage de la transition `commande → livraison_prevue/a_recuperer` sans montant
- Blocage bulk transition si des livraisons sélectionnées n'ont pas de montant
- Indicateur total TTC sur la page index chantier

**Hors scope :**
- Distinction HT / TTC — on fait du TTC uniquement pour l'instant
- Reporting / export financier
- Budget prévisionnel par chantier
- Montant sur la création directe de livraison (le montant est saisi au passage en commande)

### Ce qui existe déjà (à réutiliser, NE PAS recréer)

| Élément | Fichier | Notes |
|---------|---------|-------|
| `Livraison` interface | `src/types/database.ts:682-698` | Sans `montant_ttc` — à modifier |
| `useUpdateLivraisonStatus` | `src/lib/mutations/useUpdateLivraisonStatus.ts` | Accepte déjà `fournisseur?` — pattern identique pour `montantTtc?` |
| `updateLivraisonStatus()` | Même fichier, fonction exportée | Core function réutilisée par bulk mutation |
| `useUpdateLivraison` | `src/lib/mutations/useUpdateLivraison.ts` | Édition description/fournisseur/date_prevue — ajouter montant_ttc |
| `EditLivraisonSheet` | `src/components/EditLivraisonSheet.tsx` | 3 champs actuels — ajouter montant_ttc |
| `LivraisonSheets` | `src/components/LivraisonSheets.tsx` | Sheet "Passer en commande" avec champ fournisseur — ajouter montant_ttc |
| `useLivraisonActions` | `src/lib/hooks/useLivraisonActions.ts` | Hook partagé state + handlers — ajouter états montant |
| `DeliveryCard` | `src/components/DeliveryCard.tsx` | Affiche fournisseur — ajouter montant_ttc |
| `ChantierIndicators` | `src/components/ChantierIndicators.tsx` | Indicateurs chantier — ajouter total dépenses |
| `useLivraisons(chantierId)` | `src/lib/queries/useLivraisons.ts` | `select('*')` — inclura automatiquement `montant_ttc` |
| `useBulkUpdateLivraisonStatus` | `src/lib/mutations/useBulkUpdateLivraisonStatus.ts` | Utilise `updateLivraisonStatus()` — pas de modif directe nécessaire |
| Page per-chantier livraisons | `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx` | Bulk flow — ajouter vérification montant |
| Page index chantier | `src/routes/_authenticated/chantiers/$chantierId/index.tsx` | Indicateurs — passer totalDepenses |

### Migration SQL : 032_livraison_montant_ttc.sql

```sql
-- Story 6.12 : Montant TTC et suivi des dépenses par chantier

-- =====================
-- COLONNE — Montant TTC (numérique, optionnel)
-- =====================
ALTER TABLE public.livraisons ADD COLUMN montant_ttc numeric DEFAULT NULL;

-- =====================
-- TRIGGER FUNCTION — Mise à jour pour surveiller montant_ttc
-- =====================
CREATE OR REPLACE FUNCTION public.log_livraison_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT : livraison créée
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'livraison_created',
      COALESCE(auth.uid(), NEW.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      NEW.chantier_id,
      'livraison',
      NEW.id,
      jsonb_build_object('description', LEFT(NEW.description, 80))
    );
    RETURN NEW;
  END IF;

  -- UPDATE status : changement de statut (prioritaire sur les autres updates)
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'livraison_status_changed',
      COALESCE(auth.uid(), NEW.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      NEW.chantier_id,
      'livraison',
      NEW.id,
      jsonb_build_object('description', LEFT(NEW.description, 80), 'old_status', OLD.status::text, 'new_status', NEW.status::text)
        || CASE WHEN NEW.montant_ttc IS NOT NULL THEN jsonb_build_object('montant_ttc', NEW.montant_ttc) ELSE '{}'::jsonb END
    );
    RETURN NEW;
  END IF;

  -- UPDATE champs éditables (description, fournisseur, date_prevue, montant_ttc) sans changement de status
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status AND (
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.fournisseur IS DISTINCT FROM NEW.fournisseur OR
    OLD.date_prevue IS DISTINCT FROM NEW.date_prevue OR
    OLD.montant_ttc IS DISTINCT FROM NEW.montant_ttc
  ) THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'livraison_updated',
      COALESCE(auth.uid(), NEW.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      NEW.chantier_id,
      'livraison',
      NEW.id,
      jsonb_build_object('description', LEFT(NEW.description, 80))
        || CASE WHEN OLD.montant_ttc IS DISTINCT FROM NEW.montant_ttc THEN jsonb_build_object('montant_ttc', NEW.montant_ttc) ELSE '{}'::jsonb END
    );
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger avec montant_ttc dans les colonnes surveillées
DROP TRIGGER IF EXISTS trg_livraison_activity ON public.livraisons;
CREATE TRIGGER trg_livraison_activity
  AFTER INSERT OR UPDATE OF status, description, fournisseur, date_prevue, montant_ttc ON public.livraisons
  FOR EACH ROW EXECUTE FUNCTION public.log_livraison_activity();
```

### Flux de saisie du montant TTC

**Scénario individuel — Passage en commande :**
```
prevu → [Passer en commande]
         ┌──────────────────────────────┐
         │ Passer en commande           │
         │                              │
         │ Fournisseur (optionnel)      │
         │ [____________________________│
         │                              │
         │ Montant TTC (optionnel)      │
         │ [__________________] €       │
         │                              │
         │ [    Confirmer    ]          │
         └──────────────────────────────┘
```

**Scénario individuel — Blocage si pas de montant :**
```
commande → [Planifier livraison]
    ❌ Toast : "Veuillez d'abord renseigner le montant TTC via le bouton Modifier"
```

**Scénario individuel — Saisie tardive via édition :**
```
commande → [⋮ Modifier]
         ┌──────────────────────────────┐
         │ Modifier la livraison        │
         │                              │
         │ Description                  │
         │ [__Carrelage salle de bain__]│
         │                              │
         │ Fournisseur                  │
         │ [__Leroy Merlin_____________]│
         │                              │
         │ Date prévue                  │
         │ [__2026-02-25_______________]│
         │                              │
         │ Montant TTC                  │
         │ [__1250.00__________________]│
         │                              │
         │ [    Enregistrer    ]        │
         └──────────────────────────────┘
```

**Scénario bulk — Blocage :**
```
commande (3 sélectionnées) → [Planifier livraison (3)]
    ❌ Message barre : "2 livraisons sans montant TTC — renseignez-les avant de continuer"
```

### Affichage DeliveryCard

```
┌──────────────────────────────────────────────────┐
│ Carrelage salle de bain          [Commandé]  [:] │
│ Leroy Merlin · 1 250,00 €      (text-muted)     │
│ Y . il y a 2h  cal 15 fév 2026  BC ✓             │
│                            [Planifier livraison]  │
│ --- BC slot --- BL slot ---                       │
└──────────────────────────────────────────────────┘
```

Le montant est affiché sur la même ligne que le fournisseur, séparé par un `·`. Si pas de fournisseur mais montant présent, afficher juste le montant. Si ni l'un ni l'autre, rien.

### Indicateur ChantierIndicators

```
┌──────────────────────────────────────────────────┐
│ 💰 3 450,00 € dépensés                          │
│ 📦 3 besoins en attente                         │
│ ...                                              │
└──────────────────────────────────────────────────┘
```

**Calcul :** `SUM(montant_ttc)` des livraisons du chantier avec `parent_id IS NULL` (top-level). Les livraisons enfants (mergées) ne sont pas comptées si le parent porte son propre montant — dans la pratique, le parent a toujours son montant propre (saisi manuellement), donc il suffit de filtrer sur `parent_id IS NULL`.

**Format :** `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })` — donne "3 450,00 €".

### Garde édition du montant — Élargissement statuts

Actuellement `useUpdateLivraison` a une garde `.in('status', ['commande', 'prevu'])`. Pour le montant TTC, il faut pouvoir l'éditer même après commande (ex: correction d'un montant sur une livraison en cours). On élargit à `.in('status', ['prevu', 'commande', 'livraison_prevue', 'a_recuperer'])` — les seuls statuts bloqués sont les terminaux (`receptionne`, `recupere`).

### Formatage montant

```typescript
// Utilitaire partagé
export function formatMontant(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(montant)
}
```

Placé dans `src/lib/utils/formatMontant.ts` ou inline si utilisé dans 2-3 endroits seulement.

### Project Structure Notes

**Nouveaux fichiers (1-2) :**
- `supabase/migrations/032_livraison_montant_ttc.sql`
- `src/lib/utils/formatMontant.ts` (optionnel — peut être inline)

**Fichiers modifiés (~12) :**
- `src/types/database.ts` — `montant_ttc: number | null` dans Livraison + DB types
- `src/lib/mutations/useUpdateLivraisonStatus.ts` — paramètre `montantTtc` optionnel
- `src/lib/mutations/useUpdateLivraisonStatus.test.ts`
- `src/lib/mutations/useUpdateLivraison.ts` — paramètre `montantTtc` + garde élargie
- `src/lib/mutations/useUpdateLivraison.test.ts`
- `src/lib/hooks/useLivraisonActions.ts` — états + handlers montant + blocage transition
- `src/components/LivraisonSheets.tsx` — champ montant dans sheet commande
- `src/components/EditLivraisonSheet.tsx` — champ montant dans sheet édition
- `src/components/DeliveryCard.tsx` — affichage montant formaté
- `src/components/DeliveryCard.test.tsx`
- `src/components/ChantierIndicators.tsx` — indicateur total dépenses
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — calcul + passage total
- `src/routes/_authenticated/chantiers/$chantierId/index.test.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx` — blocage bulk sans montant

**Fichiers NON touchés (ne pas modifier) :**
- `src/lib/queries/useLivraisons.ts` — `select('*')` inclut automatiquement `montant_ttc`
- `src/lib/queries/useAllLivraisons.ts` — idem
- `src/lib/mutations/useCreateLivraison.ts` — la création ne prend pas de montant (saisi au passage commande)
- `src/lib/mutations/useBulkUpdateLivraisonStatus.ts` — utilise `updateLivraisonStatus()` qui acceptera le nouveau param
- `src/lib/mutations/useTransformBesoinToLivraison.ts` — le besoin → livraison crée en `prevu`, pas de montant
- `src/lib/mutations/useBulkTransformBesoins.ts` — idem
- `src/lib/mutations/useMergeLivraisons.ts` — le parent porte son propre montant, saisi via édition

### Risques et points d'attention

1. **Parsing du montant** : L'input `type="number"` retourne un string. Toujours parser avec `parseFloat()` et normaliser en `null` si NaN ou vide. Ne JAMAIS stocker `0` quand l'utilisateur n'a rien saisi — `null` signifie "pas renseigné", `0` signifierait "gratuit".

2. **Élargissement garde édition** : Passer de `['prevu', 'commande']` à `['prevu', 'commande', 'livraison_prevue', 'a_recuperer']` dans `useUpdateLivraison`. C'est nécessaire pour corriger un montant après commande. Vérifier que les tests existants passent toujours.

3. **Bulk transition avec montants manquants** : Le message d'erreur doit être explicite — indiquer le nombre de livraisons sans montant. Ne PAS empêcher la sélection, seulement l'action.

4. **Livraisons mergées** : Le parent est créé via `useMergeLivraisons` sans montant. L'utilisateur devra éditer le parent pour saisir le montant avant de l'avancer. Le calcul du total chantier filtre sur `parent_id IS NULL`.

5. **Montant sur le sheet commande individuel vs bulk** : En individuel, le sheet commande propose le montant. En bulk (prévu → commandé), on ne demande PAS de montant — ce serait trop lourd. Les montants seront saisis individuellement après.

6. **Pre-existing issues** : Mêmes que stories précédentes — failures pré-existants (navigation-hierarchy, pwa-config, etc.), lint error ThemeProvider.tsx:64.

### References

- [Source: src/types/database.ts:682-698 — Interface Livraison actuelle]
- [Source: src/lib/mutations/useUpdateLivraisonStatus.ts — Mutation statut + fournisseur (pattern pour montant)]
- [Source: src/lib/mutations/useUpdateLivraison.ts — Mutation édition (garde serveur à élargir)]
- [Source: src/lib/hooks/useLivraisonActions.ts — Hook partagé (états + handlers)]
- [Source: src/components/LivraisonSheets.tsx — Sheet commande (ajouter montant)]
- [Source: src/components/EditLivraisonSheet.tsx — Sheet édition (ajouter montant)]
- [Source: src/components/DeliveryCard.tsx — Card livraison (afficher montant)]
- [Source: src/components/ChantierIndicators.tsx — Indicateurs chantier (ajouter total)]
- [Source: src/routes/_authenticated/chantiers/$chantierId/index.tsx — Page index chantier]
- [Source: src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx — Page livraisons (bulk flow)]
- [Source: _bmad-output/implementation-artifacts/6-7-fournisseur-et-edition-des-livraisons.md — Pattern ajout champ (fournisseur)]
- [Source: _bmad-output/implementation-artifacts/6-11-refonte-livraisons-regroupement-par-chantier.md — Bulk actions]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- 3 test failures in `livraisons.test.tsx` after implementation — mock livraisons lacked `montant_ttc` field, causing blocking logic to prevent commande → livraison_prevue transitions. Fixed by adding `montant_ttc: null` to base mock and `montant_ttc: 100` to tests that need transitions past commande.

### Completion Notes List
- Task 4.3: Guard restored during code review — `.in('status', ['prevu', 'commande', 'livraison_prevue', 'a_recuperer'])` blocks terminal statuses only
- `formatMontant` utility not extracted to separate file — used inline `Intl.NumberFormat` in DeliveryCard and ChantierIndicators (only 2 usages, no need for abstraction)
- All 9 ACs covered by implementation and verified via 125 passing tests across 7 story-related test files
- 0 TypeScript errors, 0 ESLint errors on all modified files

### Code Review Fixes Applied
- **H1**: SQL trigger `log_livraison_activity()` now includes `montant_ttc` in metadata for both `livraison_status_changed` and `livraison_updated` events (Task 1.3 fully completed)
- **H2**: Server-side guard `.in('status', [...])` restored in `useUpdateLivraison.ts` — was removed entirely instead of expanded (Task 4.3 corrected)
- **M1**: Added 3 tests for montant display on DeliveryCard (AC #3 test coverage)
- **M2**: Added test for totalDepenses indicator on chantier index page (AC #5 test coverage)
- **M3**: Added test for bulk montant blocking in livraisons page (AC #9 test coverage)
- **M4**: Updated `useUpdateLivraison.test.ts` — all tests now assert `montantTtc` parameter and `.in()` guard

### File List
**New files:**
- `supabase/migrations/032_livraison_montant_ttc.sql`

**Modified files:**
- `src/types/database.ts`
- `src/lib/mutations/useUpdateLivraisonStatus.ts`
- `src/lib/mutations/useUpdateLivraisonStatus.test.ts`
- `src/lib/mutations/useUpdateLivraison.ts`
- `src/lib/mutations/useUpdateLivraison.test.ts`
- `src/lib/hooks/useLivraisonActions.ts`
- `src/components/LivraisonSheets.tsx`
- `src/components/EditLivraisonSheet.tsx`
- `src/components/DeliveryCard.tsx`
- `src/components/DeliveryCard.test.tsx`
- `src/components/ChantierIndicators.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/index.test.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/livraisons.test.tsx`
