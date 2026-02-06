---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - prd.md
  - architecture.md
  - ux-design-specification.md
---

# posePilot - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for posePilot, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**1. Gestion des chantiers & Navigation (FR1-FR12)**

FR1: L'utilisateur peut créer un nouveau chantier avec un nom
FR2: L'utilisateur peut choisir le type de chantier à la création : complet ou léger (choix définitif, non modifiable)
FR3: L'utilisateur peut voir tous les chantiers actifs sur l'écran d'accueil avec indicateur visuel (% avancement pour complet, compteur livraisons pour léger)
FR4: L'utilisateur peut identifier le type de chantier (complet/léger) visuellement sur la carte
FR5: L'utilisateur peut marquer un chantier comme terminé ou supprimé (disparaît de la vue principale)
FR6: L'utilisateur peut naviguer la hiérarchie Chantier → Plot → Étage → Lot → Pièce (chantier complet)
FR7: L'utilisateur peut accéder directement aux besoins et livraisons depuis un chantier léger
FR8: L'utilisateur peut rechercher un lot par son numéro (chantier complet)
FR9: L'utilisateur peut filtrer les vues : Tous / En cours / Terminés / Avec alertes
FR10: L'utilisateur peut swiper entre les pièces d'un lot
FR11: L'utilisateur peut voir chaque niveau hiérarchique sous forme de grille de cartes colorées selon le statut
FR12: Le système agrège automatiquement l'avancement à tous les niveaux (pièce → lot → étage → plot → chantier)

**2. Configuration & Structure (FR13-FR23)**

FR13: L'utilisateur peut créer des plots au sein d'un chantier complet
FR14: L'utilisateur peut définir les tâches disponibles par plot
FR15: L'utilisateur peut créer des variantes d'appartement par plot avec pièces et tâches par défaut
FR16: L'utilisateur peut définir des documents par défaut dans chaque variante
FR17: L'utilisateur peut créer des lots avec un code libre, assignés à une variante et un étage
FR18: L'utilisateur peut ajouter jusqu'à 8 lots en batch (même variante, même étage)
FR19: L'utilisateur peut utiliser des identifiants d'étage libres (RDC, 1, 2, Combles...)
FR20: L'utilisateur peut flag un lot comme TMA
FR21: L'utilisateur peut modifier le flag TMA en cours de chantier
FR22: L'utilisateur peut ajouter des tâches, pièces ou documents supplémentaires à un lot individuel
FR23: Les lots héritent automatiquement des pièces, tâches et documents de leur variante assignée

**3. Suivi d'avancement & Tâches (FR24-FR27)**

FR24: L'utilisateur peut voir toutes les tâches d'une pièce sur un écran unique
FR25: L'utilisateur peut changer le statut d'une tâche d'un seul tap (cycle : pas commencé → en cours → fait)
FR26: L'utilisateur peut revenir en arrière sur un statut de tâche en tapant à nouveau (cycle réversible)
FR27: L'utilisateur peut voir le compteur de tâches affiché en "X faits, Y en cours" (pas de pourcentage)

**4. Notes, Problèmes & Collaboration (FR28-FR34)**

FR28: L'utilisateur peut créer des notes texte libres sur un lot ou une pièce
FR29: L'utilisateur peut marquer une note comme "bloquant"
FR30: L'utilisateur peut attacher des photos prises depuis la caméra à une note
FR31: Le système enregistre l'auteur de chaque note
FR32: L'utilisateur peut partager une photo vers le maître d'ouvrage avec contexte auto-renseigné (chantier/lot/pièce)
FR33: L'utilisateur peut voir un fil "quoi de neuf" des modifications des collègues depuis sa dernière visite
FR34: Le système affiche un indicateur discret pour les nouvelles modifications (pas de popup)

**5. Documents (FR35-FR43)**

FR35: L'utilisateur peut uploader des documents PDF sur un lot
FR36: L'utilisateur peut visualiser, remplacer et télécharger des documents PDF
FR37: L'utilisateur peut définir des types de documents personnalisés (noms libres)
FR38: L'utilisateur peut marquer des types de documents comme obligatoires ou optionnels
FR39: Les documents définis dans la variante sont hérités par les lots
FR40: L'utilisateur peut ajouter des documents supplémentaires à un lot individuel
FR41: L'utilisateur peut voir un récapitulatif des documents obligatoires manquants
FR42: Le système affiche un indicateur visuel sur la carte du lot si des documents obligatoires manquent
FR43: Par défaut, aucun document n'est requis (zéro contrainte par défaut)

**6. Besoins, Livraisons & Inventaire (FR44-FR56)**

FR44: L'utilisateur peut créer un besoin avec description libre
FR45: L'utilisateur peut voir la liste des besoins en attente au niveau chantier
FR46: L'utilisateur peut transformer un besoin en livraison au statut "Commandé"
FR47: L'utilisateur peut créer une livraison directement (sans besoin préalable)
FR48: L'utilisateur peut suivre le cycle de vie d'une livraison : Commandé → Prévu → Livré
FR49: L'utilisateur peut rattacher un bon de commande (BC) à une livraison
FR50: L'utilisateur peut rattacher un bon de livraison (BL) à une livraison
FR51: L'utilisateur peut renseigner une date de livraison prévue
FR52: L'utilisateur peut voir toutes les livraisons filtrées par statut
FR53: L'utilisateur peut enregistrer du matériel avec quantité et localisation (plot + étage)
FR54: Le système pré-remplit la localisation selon le contexte de navigation actuel
FR55: Le système agrège l'inventaire automatiquement (étage → plot → chantier)
FR56: L'utilisateur peut ajuster rapidement les quantités (+/-/supprimer)

**7. Métrés, Plinthes & Indicateurs (FR57-FR64)**

FR57: L'utilisateur peut saisir les m² par pièce (optionnel, jamais bloquant)
FR58: L'utilisateur peut saisir les mètres linéaires plinthes par pièce (optionnel, jamais bloquant)
FR59: Le système agrège les m² et ML par lot et par plot
FR60: L'utilisateur peut suivre le statut des plinthes : commandées / façonnées chez fournisseur
FR61: Le système identifie les lots prêts à carreler (ragréage + phonique faits, pose non commencée)
FR62: Le système croise inventaire et métrés restants pour aide à la décision commande
FR63: Le système affiche le nombre de besoins en attente non commandés
FR64: Le système affiche les livraisons prévues à venir avec dates

**8. Compte & UX (FR65-FR69)**

FR65: L'utilisateur peut s'authentifier avec des identifiants simples (2-3 comptes)
FR66: L'utilisateur peut choisir entre thème clair et sombre avec mémorisation du choix
FR67: L'utilisateur peut installer la PWA sur l'écran d'accueil de son smartphone
FR68: L'app fournit des zones tactiles surdimensionnées adaptées aux conditions de chantier
FR69: L'app affiche des boutons clairs et visibles, sans gestes cachés

### NonFunctional Requirements

**Performance (NFR1-NFR7)**

NFR1: Chaque écran se charge en < 3 secondes sur réseau 3G
NFR2: La navigation entre écrans (SPA) < 1 seconde
NFR3: Le changement de statut d'une tâche (tap) < 300ms de feedback visuel
NFR4: La recherche de lot par numéro < 1 seconde
NFR5: First Contentful Paint < 2 secondes sur réseau 3G
NFR6: Bundle initial optimisé pour réseau variable
NFR7: Compression des photos côté client avant envoi

**Fiabilité (NFR8-NFR12)**

NFR8: Zéro crash en usage normal
NFR9: Aucune perte de données — tout ce qui est saisi est persisté
NFR10: Synchronisation temps réel < 5 secondes de propagation entre utilisateurs
NFR11: Requêtes échouées retentées automatiquement (réseau intermittent)
NFR12: Feedback clair en cas d'erreur réseau (pas de silence)

**Sécurité (NFR13-NFR16)**

NFR13: Authentification requise pour accéder à l'app
NFR14: Données transmises via HTTPS uniquement
NFR15: Sessions expirent après inactivité prolongée
NFR16: Chaque utilisateur identifié par son propre compte (traçabilité des actions)

### Additional Requirements

**Exigences issues de l'Architecture :**

- **Starter template** : Vite 7 + React 19 + TypeScript, shadcn/ui init, Supabase JS, TanStack Router, TanStack Query, vite-plugin-pwa — impacte Epic 1 Story 1
- Modèle de données PostgreSQL hiérarchique avec colonnes d'agrégation et triggers en cascade (pièce → lot → étage → plot → chantier)
- Supabase Auth email/password + Row Level Security (policy simple `authenticated = accès total`)
- Supabase Client SDK direct depuis le front-end (pas d'API REST custom, pas d'Edge Functions)
- Mutations optimistes via TanStack Query (onMutate/onError/onSettled) pour feedback < 300ms
- Subscriptions Supabase Realtime sur les tables critiques (tâches, notes, lots, livraisons, besoins, activity_log)
- Compression photos côté client via browser-image-compression (qualité 0.7, max 1200px)
- Theming dark-first via Tailwind class strategy, sombre par défaut
- CI/CD GitHub Actions minimal : lint + type-check + build avant merge
- Structure projet par domaine : components/, routes/, lib/queries/, lib/mutations/, lib/subscriptions/, types/, utils/
- Types TypeScript miroir du schéma PostgreSQL en snake_case (pas de transformation camelCase)
- Fichiers de migration Supabase structurés (001_enums → 008_storage_buckets)
- Déploiement Vercel en site statique SPA + Supabase cloud en production

**Exigences issues de l'UX Design :**

- Design responsive mobile-first strict : breakpoints à 640/768/1024/1280px
- Conformité WCAG 2.1 AA pragmatique (contraste 4.5:1, zones tactiles, sémantique HTML)
- Zones tactiles : 48px minimum absolu, 56px cible terrain, 64px pour TapCycleButton
- Police Poppins (Google Fonts) — échelle typographique définie (H1: 24px → Caption: 12px)
- 8 composants custom définis avec specs détaillées : StatusCard, TapCycleButton, RoomScreen, SearchBar, BottomNavigation, BreadcrumbNav, ActivityFeed, DeliveryCard
- Thème sombre par défaut (fond #111827, cartes #1E293B, barres de statut avec glow)
- Thème clair alternatif (fond #F5F5F5, cartes #FFFFFF, bordures gauche colorées)
- Navigation gestuelle : swipe H entre pièces/lots, swipe V entre étages (métaphore physique)
- Skeleton loading pour chaque composant (pas de spinner générique)
- Safe areas iPhone : env(safe-area-inset-*) sur bottom nav et header
- Feedback haptique avec fallback : navigator.vibrate(10) si disponible, sinon animation scale
- Formulaires : max 3 champs visibles, auto-save brouillons, validation au submit uniquement
- prefers-reduced-motion : transitions instantanées (0ms)
- Bottom navigation 4 onglets : Chantiers | Livraisons | Activité | Réglages
- Bottom nav masquée sur écrans de détail profond (pièce), réapparaît sur vues liste
- Desktop (>= 1024px) : bottom nav → sidebar, grilles multi-colonnes
- Palette sémantique cohérente : gris (#9CA3AF pas commencé), orange (#F59E0B en cours), vert (#10B981 fait), rouge (#EF4444 bloqué)
- Pas d'onboarding, pas de tutoriel, pas de confirmation sur actions terrain courantes
- Confirmations uniquement pour actions destructives (suppression chantier, lot)

### FR Coverage Map

FR1: Epic 1 — Créer un chantier avec un nom
FR2: Epic 1 — Choisir type complet/léger à la création
FR3: Epic 1 — Voir chantiers actifs avec indicateurs visuels
FR4: Epic 1 — Identifier type complet/léger visuellement
FR5: Epic 1 — Marquer chantier terminé/supprimé
FR6: Epic 3 — Naviguer la hiérarchie Chantier → Plot → Étage → Lot → Pièce
FR7: Epic 6 — Accéder aux besoins/livraisons depuis chantier léger
FR8: Epic 3 — Rechercher un lot par numéro
FR9: Epic 3 — Filtrer les vues (Tous/En cours/Terminés/Alertes)
FR10: Epic 3 — Swiper entre les pièces d'un lot
FR11: Epic 3 — Grille de cartes colorées selon le statut
FR12: Epic 3 — Agrégation automatique de l'avancement
FR13: Epic 2 — Créer des plots
FR14: Epic 2 — Définir les tâches par plot
FR15: Epic 2 — Créer des variantes avec pièces et tâches
FR16: Epic 2 — Définir des documents par défaut dans variante
FR17: Epic 2 — Créer des lots avec code libre
FR18: Epic 2 — Ajouter lots en batch (max 8)
FR19: Epic 2 — Identifiants d'étage libres
FR20: Epic 2 — Flag TMA sur lot
FR21: Epic 2 — Modifier flag TMA en cours de chantier
FR22: Epic 2 — Ajouter tâches/pièces/docs sur lot individuel
FR23: Epic 2 — Héritage automatique variante → lot
FR24: Epic 3 — Voir toutes les tâches d'une pièce
FR25: Epic 3 — Tap-cycle statut (pas commencé → en cours → fait)
FR26: Epic 3 — Cycle réversible
FR27: Epic 3 — Compteur "X faits, Y en cours"
FR28: Epic 4 — Notes texte sur lot ou pièce
FR29: Epic 4 — Marquer note comme bloquant
FR30: Epic 4 — Photos caméra sur note
FR31: Epic 4 — Auteur enregistré par note
FR32: Epic 4 — Partage photo avec contexte auto-renseigné
FR33: Epic 4 — Fil "quoi de neuf"
FR34: Epic 4 — Indicateur discret nouvelles modifications
FR35: Epic 5 — Upload documents PDF sur lot
FR36: Epic 5 — Visualiser, remplacer, télécharger PDF
FR37: Epic 5 — Types de documents personnalisés
FR38: Epic 5 — Documents obligatoires/optionnels
FR39: Epic 5 — Héritage documents variante → lot
FR40: Epic 5 — Documents supplémentaires sur lot individuel
FR41: Epic 5 — Récapitulatif documents obligatoires manquants
FR42: Epic 5 — Indicateur visuel docs manquants sur carte lot
FR43: Epic 5 — Aucun document requis par défaut
FR44: Epic 6 — Créer un besoin avec description libre
FR45: Epic 6 — Liste besoins en attente au niveau chantier
FR46: Epic 6 — Transformer besoin en livraison Commandé
FR47: Epic 6 — Créer livraison directement
FR48: Epic 6 — Cycle de vie livraison (Commandé → Prévu → Livré)
FR49: Epic 6 — Rattacher bon de commande (BC)
FR50: Epic 6 — Rattacher bon de livraison (BL)
FR51: Epic 6 — Date de livraison prévue
FR52: Epic 6 — Livraisons filtrées par statut
FR53: Epic 6 — Enregistrer matériel avec quantité et localisation
FR54: Epic 6 — Pré-remplir localisation selon contexte
FR55: Epic 6 — Agrégation inventaire automatique
FR56: Epic 6 — Ajuster quantités rapidement
FR57: Epic 7 — Saisir m² par pièce
FR58: Epic 7 — Saisir ML plinthes par pièce
FR59: Epic 7 — Agrégation m² et ML par lot et plot
FR60: Epic 7 — Statut plinthes (commandées/façonnées)
FR61: Epic 7 — Lots prêts à carreler
FR62: Epic 7 — Croisement inventaire/métrés
FR63: Epic 7 — Besoins en attente non commandés
FR64: Epic 7 — Livraisons prévues à venir
FR65: Epic 1 — Authentification simple
FR66: Epic 1 — Thème clair/sombre avec mémorisation
FR67: Epic 1 — PWA installable
FR68: Epic 1 — Zones tactiles surdimensionnées
FR69: Epic 1 — Boutons clairs et visibles

## Epic List

### Epic 1: Fondation, Authentification & Gestion des chantiers
L'utilisateur peut installer la PWA, se connecter, créer et gérer ses chantiers depuis l'écran d'accueil avec indicateurs visuels et thème clair/sombre.
**FRs couverts:** FR1, FR2, FR3, FR4, FR5, FR65, FR66, FR67, FR68, FR69

### Epic 2: Configuration & Structure de chantier
Youssef peut configurer un chantier complet de A à Z : plots, tâches, variantes d'appartement, lots en batch, héritage automatique des pièces/tâches/documents.
**FRs couverts:** FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR23

### Epic 3: Navigation terrain & Suivi d'avancement
Bruno navigue dans la hiérarchie avec grilles colorées, recherche par numéro, swipe entre pièces, et valide les tâches d'un tap avec agrégation en temps réel — la boucle terrain complète.
**FRs couverts:** FR6, FR8, FR9, FR10, FR11, FR12, FR24, FR25, FR26, FR27

### Epic 4: Notes, Photos & Collaboration
Les utilisateurs signalent des problèmes avec texte et photos, flaggent les blocages, partagent des infos contextualisées, et suivent l'activité via le fil "quoi de neuf".
**FRs couverts:** FR28, FR29, FR30, FR31, FR32, FR33, FR34

### Epic 5: Gestion des Documents PDF
Les utilisateurs gèrent les plans de pose, fiches de choix et autres documents par lot — upload, visualisation, types personnalisables, obligatoires/optionnels, héritage depuis les variantes.
**FRs couverts:** FR35, FR36, FR37, FR38, FR39, FR40, FR41, FR42, FR43

### Epic 6: Besoins, Livraisons & Inventaire
Cycle complet besoin → commande → livraison avec BC/BL, navigation directe depuis chantier léger, gestion d'inventaire avec localisation et agrégation automatique.
**FRs couverts:** FR7, FR44, FR45, FR46, FR47, FR48, FR49, FR50, FR51, FR52, FR53, FR54, FR55, FR56

### Epic 7: Métrés, Plinthes & Indicateurs intelligents
Métrés optionnels (m² et ML plinthes), suivi des plinthes commandées/façonnées, et indicateurs d'aide à la décision : lots prêts à carreler, croisement inventaire/métrés, besoins en attente, livraisons prévues.
**FRs couverts:** FR57, FR58, FR59, FR60, FR61, FR62, FR63, FR64

---

## Epic 1: Fondation, Authentification & Gestion des chantiers

L'utilisateur peut installer la PWA, se connecter, créer et gérer ses chantiers depuis l'écran d'accueil avec indicateurs visuels et thème clair/sombre.

### Story 1.1: Initialisation du projet et déploiement

En tant que membre de l'équipe posePilot,
Je veux que l'application soit initialisée avec le stack technique défini,
Afin que nous disposions d'une base déployée avec un pipeline CI/CD fonctionnel.

**Acceptance Criteria:**

**Given** le développeur exécute les commandes d'initialisation (Vite 7 + React 19 + TS, shadcn init, dépendances clés)
**When** le projet est créé avec la structure de dossiers définie dans l'architecture (components/, routes/, lib/, types/, utils/)
**Then** le projet compile sans erreur et le dev server démarre

**Given** le projet est poussé sur GitHub
**When** le pipeline CI/CD GitHub Actions s'exécute
**Then** lint, type-check et build passent avec succès

**Given** le build est prêt
**When** il est déployé sur Vercel
**Then** l'app est accessible via HTTPS avec une page minimale

### Story 1.2: Authentification et protection des routes

En tant que utilisateur de posePilot,
Je veux me connecter avec mes identifiants,
Afin que seuls les utilisateurs autorisés accèdent à l'application.

**Acceptance Criteria:**

**Given** l'utilisateur n'est pas connecté
**When** il accède à n'importe quelle page de l'app
**Then** il est redirigé vers la page de connexion

**Given** l'utilisateur est sur la page de connexion
**When** il saisit un email et mot de passe valides et soumet
**Then** il est authentifié et redirigé vers l'écran d'accueil

**Given** l'utilisateur saisit des identifiants invalides
**When** il soumet le formulaire
**Then** un message d'erreur clair s'affiche en français

**Given** l'utilisateur est connecté
**When** sa session expire après inactivité prolongée
**Then** il est redirigé vers la page de connexion

**Given** le projet Supabase
**When** les RLS policies sont configurées
**Then** seuls les utilisateurs authentifiés peuvent accéder aux données

### Story 1.3: Layout principal, bottom navigation et thème

En tant que utilisateur de posePilot,
Je veux voir une interface professionnelle avec navigation claire et choix de thème,
Afin que je puisse naviguer dans l'app et l'utiliser confortablement sur le chantier.

**Acceptance Criteria:**

**Given** l'utilisateur est connecté
**When** l'app se charge
**Then** le layout racine s'affiche avec la BottomNavigation à 4 onglets (Chantiers, Livraisons, Activité, Réglages)

**Given** l'utilisateur est sur n'importe quel écran de niveau liste
**When** il tape sur un onglet de la BottomNavigation
**Then** la navigation est immédiate vers la section correspondante

**Given** l'utilisateur est dans les réglages
**When** il bascule entre thème clair et sombre
**Then** le thème change immédiatement et le choix est mémorisé (persiste entre sessions via localStorage)

**Given** le thème sombre est actif (défaut)
**When** l'app s'affiche
**Then** le fond est #111827, les cartes #1E293B, le texte #F1F5F9, conforme aux specs UX

**Given** n'importe quel écran de l'app
**When** affiché sur mobile
**Then** la police Poppins est chargée, les zones tactiles font minimum 48px, et les boutons sont clairs et visibles sans gestes cachés

### Story 1.4: Création d'un chantier

En tant que utilisateur de posePilot,
Je veux créer un nouveau chantier en choisissant son type,
Afin que je puisse commencer à suivre un nouveau projet de pose.

**Acceptance Criteria:**

**Given** l'utilisateur est sur l'écran d'accueil
**When** il tape sur le bouton d'ajout
**Then** un formulaire de création s'affiche avec un champ nom et un choix de type (Complet / Léger)

**Given** l'utilisateur a saisi un nom et choisi un type
**When** il valide la création
**Then** le chantier est créé en base (table `chantiers` avec enum `chantier_type`) et apparaît dans la liste

**Given** le formulaire de création affiche le choix de type
**When** l'utilisateur lit l'option
**Then** un indicateur clair précise que le choix du type est définitif et non modifiable

**Given** l'utilisateur ne saisit pas de nom
**When** il tente de valider
**Then** un message d'erreur simple en français s'affiche sous le champ

### Story 1.5: Écran d'accueil — Liste et cartes des chantiers

En tant que utilisateur de posePilot,
Je veux voir tous mes chantiers actifs sur l'écran d'accueil avec leur statut,
Afin que je sache d'un coup d'oeil l'état de chaque chantier.

**Acceptance Criteria:**

**Given** l'utilisateur a des chantiers actifs
**When** il ouvre l'app / onglet Chantiers
**Then** la liste de tous les chantiers actifs s'affiche sous forme de StatusCards avec barre de statut latérale

**Given** un chantier de type complet est dans la liste
**When** l'utilisateur regarde la carte
**Then** il voit un indicateur de % d'avancement (0% initialement) et un badge "Complet" discret

**Given** un chantier de type léger est dans la liste
**When** l'utilisateur regarde la carte
**Then** il voit un compteur de livraisons (0 initialement) et un badge "Léger" discret

**Given** l'utilisateur n'a aucun chantier
**When** l'écran d'accueil se charge
**Then** un état vide s'affiche avec "Aucun chantier pour l'instant" et un bouton "Créer un chantier"

**Given** les données changent (autre utilisateur crée un chantier)
**When** la mise à jour est propagée via Supabase Realtime
**Then** la liste se met à jour automatiquement sans rafraîchir

### Story 1.6: Gestion du cycle de vie d'un chantier

En tant que utilisateur de posePilot,
Je veux marquer un chantier comme terminé ou le supprimer,
Afin que mon écran d'accueil ne montre que les chantiers actifs pertinents.

**Acceptance Criteria:**

**Given** l'utilisateur est sur la vue d'un chantier
**When** il accède aux options du chantier
**Then** il voit les options "Marquer comme terminé" et "Supprimer"

**Given** l'utilisateur choisit "Marquer comme terminé"
**When** il confirme l'action
**Then** le chantier disparaît de la vue principale des chantiers actifs

**Given** l'utilisateur choisit "Supprimer"
**When** il confirme via la dialog de confirmation (action destructive)
**Then** le chantier est supprimé et disparaît définitivement

**Given** l'utilisateur veut retrouver ses chantiers terminés
**When** il utilise le filtre "Terminés" sur l'écran d'accueil
**Then** les chantiers archivés s'affichent

### Story 1.7: PWA — Installation et mode standalone

En tant que utilisateur de posePilot,
Je veux installer l'app sur l'écran d'accueil de mon smartphone,
Afin que j'accède à posePilot comme une app native, sans barre d'adresse.

**Acceptance Criteria:**

**Given** l'utilisateur accède à posePilot depuis Chrome Android
**When** le service worker est enregistré et le manifest est valide
**Then** le navigateur propose l'installation sur l'écran d'accueil

**Given** l'utilisateur a installé la PWA
**When** il ouvre posePilot depuis l'écran d'accueil
**Then** l'app s'ouvre en mode standalone (plein écran, sans barre d'adresse)

**Given** l'app est en mode standalone
**When** elle s'affiche
**Then** le theme_color est #0F172A, le background_color est #0F172A, l'orientation est portrait

**Given** l'utilisateur accède depuis Safari iOS
**When** il utilise "Ajouter à l'écran d'accueil"
**Then** la PWA s'installe et fonctionne en mode standalone avec safe areas respectées

---

## Epic 2: Configuration & Structure de chantier

Youssef peut configurer un chantier complet de A à Z : plots, tâches, variantes d'appartement, lots en batch, héritage automatique des pièces/tâches/documents.

### Story 2.1: Création de plots et définition des tâches

En tant que utilisateur de posePilot,
Je veux créer des plots dans un chantier complet et définir les tâches disponibles,
Afin que la structure du chantier reflète l'organisation physique du terrain.

**Acceptance Criteria:**

**Given** l'utilisateur est dans un chantier de type complet
**When** il tape sur "Ajouter un plot" et saisit un nom (ex: "Plot A")
**Then** le plot est créé (table `plots`) et apparaît dans la vue chantier

**Given** un plot existe
**When** l'utilisateur accède à la configuration des tâches du plot
**Then** il peut définir la liste des tâches disponibles (ex: Ragréage, Phonique, Pose, Plinthes, Joints, Silicone)

**Given** les tâches du plot sont définies
**When** l'utilisateur consulte le plot
**Then** la liste des tâches est affichée et modifiable (ajout/suppression/réorganisation)

**Given** l'utilisateur est dans un chantier de type léger
**When** il consulte la vue chantier
**Then** aucune option de création de plot n'est disponible

### Story 2.2: Variantes d'appartement avec pièces et tâches

En tant que utilisateur de posePilot,
Je veux créer des variantes d'appartement avec des pièces et tâches par défaut,
Afin que les lots créés héritent automatiquement de la bonne configuration.

**Acceptance Criteria:**

**Given** un plot existe avec des tâches définies
**When** l'utilisateur crée une variante (ex: "Type A") et définit les pièces (Séjour, Chambre, SDB, WC)
**Then** la variante est créée (tables `variantes`, `variante_pieces`) avec les pièces associées

**Given** une variante a des pièces définies
**When** l'utilisateur consulte la variante
**Then** chaque pièce hérite automatiquement des tâches du plot

**Given** l'utilisateur crée plusieurs variantes (Type A, Type B)
**When** il consulte la liste des variantes du plot
**Then** chaque variante affiche son nom et le nombre de pièces

### Story 2.3: Documents par défaut dans les variantes

En tant que utilisateur de posePilot,
Je veux définir les types de documents attendus par défaut dans chaque variante,
Afin que les lots sachent quels documents sont nécessaires dès leur création.

**Acceptance Criteria:**

**Given** une variante existe
**When** l'utilisateur accède à la configuration des documents de la variante
**Then** il peut ajouter des types de documents avec un nom libre (ex: "Plan de pose", "Fiche de choix")

**Given** un type de document est défini
**When** l'utilisateur configure le document
**Then** il peut le marquer comme obligatoire ou optionnel

**Given** aucun document n'est défini dans la variante
**When** l'utilisateur consulte la configuration
**Then** aucun document n'est requis par défaut (zéro contrainte)

### Story 2.4: Création de lots avec héritage automatique

En tant que utilisateur de posePilot,
Je veux créer des lots assignés à une variante et un étage,
Afin que chaque lot soit immédiatement configuré avec ses pièces, tâches et documents.

**Acceptance Criteria:**

**Given** un plot a au moins une variante
**When** l'utilisateur crée un lot avec un code libre (ex: "203"), choisit une variante et un étage
**Then** le lot est créé (tables `etages` si nécessaire, `lots`) avec le code, la variante et l'étage

**Given** l'utilisateur utilise un identifiant d'étage libre (ex: "RDC", "1", "Combles")
**When** il crée le lot
**Then** l'étage est créé ou réutilisé avec l'identifiant saisi

**Given** un lot vient d'être créé
**When** le système applique l'héritage
**Then** le lot hérite automatiquement des pièces, tâches et documents de sa variante (copie dans tables `pieces`, `taches`, `lot_documents`)

**Given** l'héritage est appliqué
**When** l'utilisateur consulte le lot
**Then** les pièces, tâches et documents hérités sont visibles immédiatement

### Story 2.5: Ajout de lots en batch

En tant que utilisateur de posePilot,
Je veux ajouter jusqu'à 8 lots d'un coup pour la même variante et le même étage,
Afin que la configuration d'un plot avec 80 lots ne soit pas fastidieuse.

**Acceptance Criteria:**

**Given** un plot a au moins une variante
**When** l'utilisateur choisit "Ajouter des lots en batch"
**Then** un formulaire propose la saisie de codes lots (max 8), le choix d'une variante et d'un étage

**Given** l'utilisateur saisit les codes "101, 102, 103, 104, 105, 106, 107, 108"
**When** il valide
**Then** 8 lots sont créés simultanément, chacun avec le bon héritage (pièces, tâches, documents)

**Given** l'utilisateur tente de saisir plus de 8 codes
**When** il dépasse la limite
**Then** un message l'informe de la limite de 8 lots par batch

**Given** un des codes saisi existe déjà dans le plot
**When** l'utilisateur valide
**Then** un message d'erreur indique le code en doublon sans créer aucun lot du batch

### Story 2.6: Flag TMA et personnalisation de lot individuel

En tant que utilisateur de posePilot,
Je veux flagger des lots comme TMA et personnaliser un lot individuel,
Afin que les lots spéciaux soient identifiés et que chaque lot puisse être ajusté selon ses particularités.

**Acceptance Criteria:**

**Given** un lot existe
**When** l'utilisateur active le flag TMA sur ce lot
**Then** le lot est marqué TMA et un indicateur visuel le distingue dans la grille

**Given** un lot est flaggé TMA
**When** l'utilisateur veut modifier le flag en cours de chantier
**Then** il peut désactiver le flag TMA (modification réversible)

**Given** un lot a hérité de sa variante
**When** l'utilisateur ajoute une tâche supplémentaire au lot individuel
**Then** la tâche est ajoutée au lot sans affecter la variante ni les autres lots

**Given** un lot a hérité de sa variante
**When** l'utilisateur ajoute une pièce supplémentaire au lot individuel
**Then** la pièce (avec tâches héritées du plot) est ajoutée au lot uniquement

**Given** un lot a hérité de sa variante
**When** l'utilisateur ajoute un document supplémentaire au lot individuel
**Then** le slot de document est ajouté au lot sans affecter la variante

---

## Epic 3: Navigation terrain & Suivi d'avancement

Bruno navigue dans la hiérarchie avec grilles colorées, recherche par numéro, swipe entre pièces, et valide les tâches d'un tap avec agrégation en temps réel — la boucle terrain complète.

### Story 3.1: Navigation hiérarchique et breadcrumb

En tant que utilisateur de posePilot,
Je veux naviguer dans la hiérarchie Chantier → Plot → Étage → Lot → Pièce,
Afin que j'accède à n'importe quel lot en quelques taps.

**Acceptance Criteria:**

**Given** l'utilisateur est dans un chantier complet
**When** il tape sur un plot
**Then** la vue étages du plot s'affiche (routes `$chantierId/plots/$plotId`)

**Given** l'utilisateur est dans un plot
**When** il tape sur un étage
**Then** la grille de lots de cet étage s'affiche

**Given** l'utilisateur est dans un étage
**When** il tape sur un lot
**Then** la grille de pièces du lot s'affiche

**Given** l'utilisateur est dans un lot
**When** il tape sur une pièce
**Then** l'écran pièce s'affiche

**Given** l'utilisateur est au-delà du 1er niveau de profondeur
**When** il regarde le haut de l'écran
**Then** le BreadcrumbNav affiche le chemin (ex: Oliviers › Plot A › É2 › Lot 203 › Séjour) avec chaque segment tappable pour remonter

**Given** le breadcrumb est affiché sur un petit écran
**When** le chemin est trop long
**Then** seuls les 2-3 derniers niveaux sont visibles, "..." pour le reste

### Story 3.2: Écran pièce, tâches et tap-cycle

En tant que utilisateur terrain de posePilot,
Je veux voir toutes les tâches d'une pièce et changer leur statut d'un tap,
Afin que je valide l'avancement en 1 seconde par tâche.

**Acceptance Criteria:**

**Given** l'utilisateur est sur l'écran d'une pièce
**When** l'écran s'affiche
**Then** toutes les tâches de la pièce sont listées verticalement avec le TapCycleButton pour chacune

**Given** une tâche est au statut "pas commencé" (gris)
**When** l'utilisateur tape sur le TapCycleButton
**Then** le statut passe à "en cours" (orange) avec feedback visuel < 300ms et animation scale

**Given** une tâche est au statut "en cours" (orange)
**When** l'utilisateur tape à nouveau
**Then** le statut passe à "fait" (vert)

**Given** une tâche est au statut "fait" (vert)
**When** l'utilisateur tape à nouveau
**Then** le statut revient à "pas commencé" (gris) — cycle réversible complet

**Given** l'utilisateur a modifié des statuts de tâches
**When** il consulte l'écran pièce
**Then** le compteur affiche "X faits, Y en cours" (pas de pourcentage)

**Given** l'utilisateur change un statut
**When** la mutation est envoyée
**Then** l'UI change immédiatement (mutation optimiste), le serveur synchronise en arrière-plan, et en cas d'échec, le statut revient en arrière avec un toast d'erreur

### Story 3.3: Grilles de cartes colorées et agrégation

En tant que utilisateur de posePilot,
Je veux voir l'avancement par des couleurs à chaque niveau hiérarchique,
Afin que je comprenne d'un coup d'oeil la situation sans lire un seul chiffre.

**Acceptance Criteria:**

**Given** des tâches ont été mises à jour dans des pièces
**When** les triggers PostgreSQL s'exécutent en cascade
**Then** l'avancement est agrégé automatiquement : pièce → lot → étage → plot → chantier (colonnes `progress_done`, `progress_total`)

**Given** l'utilisateur consulte la grille de lots d'un étage
**When** les cartes s'affichent
**Then** chaque StatusCard a une barre de statut latérale colorée (gris si 0%, orange si partiel, vert si 100%) et affiche le compteur "X/Y"

**Given** l'utilisateur consulte les étages d'un plot
**When** les cartes s'affichent
**Then** chaque carte d'étage reflète l'agrégation de ses lots

**Given** l'utilisateur consulte les plots d'un chantier
**When** les cartes s'affichent
**Then** chaque carte de plot reflète l'agrégation de ses étages

**Given** un autre utilisateur modifie des tâches
**When** les changements sont propagés via Supabase Realtime
**Then** les cartes se mettent à jour en temps réel (invalidation TanStack Query) sans rafraîchir

### Story 3.4: Swipe entre pièces

En tant que utilisateur terrain de posePilot,
Je veux swiper entre les pièces d'un lot sans revenir à la grille,
Afin que ma tournée lot par lot soit fluide et rapide.

**Acceptance Criteria:**

**Given** l'utilisateur est sur l'écran d'une pièce dans un lot
**When** il swipe vers la gauche
**Then** l'écran transitionne (slide animation 200ms) vers la pièce suivante du lot

**Given** l'utilisateur est sur une pièce
**When** il swipe vers la droite
**Then** l'écran transitionne vers la pièce précédente

**Given** l'utilisateur est sur la dernière pièce du lot
**When** il swipe vers la gauche
**Then** rien ne se passe (pas de boucle)

**Given** l'utilisateur est sur n'importe quelle pièce
**When** il regarde le bas de l'écran pièce
**Then** des indicateurs de pagination discrets (dots) montrent la position actuelle parmi les pièces

**Given** l'utilisateur a le réglage `prefers-reduced-motion` activé
**When** il swipe entre pièces
**Then** la transition est instantanée (0ms)

### Story 3.5: Recherche par numéro de lot

En tant que utilisateur terrain de posePilot,
Je veux rechercher un lot par son numéro depuis n'importe quel écran du chantier,
Afin que j'accède directement au lot voulu en 2 interactions.

**Acceptance Criteria:**

**Given** l'utilisateur est dans un chantier complet (n'importe quel niveau)
**When** l'écran s'affiche
**Then** la SearchBar est visible en haut avec un clavier numérique par défaut (`inputmode="numeric"`)

**Given** l'utilisateur tape un numéro (ex: "203")
**When** la saisie commence
**Then** les résultats s'affichent en temps réel dès le 1er caractère, filtrant les lots correspondants

**Given** des résultats s'affichent
**When** l'utilisateur consulte un résultat
**Then** chaque résultat montre le numéro de lot + sa localisation complète (ex: "Lot 203 — Plot A › É2")

**Given** l'utilisateur tape sur un résultat
**When** il sélectionne le lot
**Then** la navigation directe vers ce lot s'effectue

**Given** la barre de recherche est focusée mais vide
**When** les suggestions s'affichent
**Then** les 5 dernières recherches sont proposées en accès rapide

**Given** aucun lot ne correspond au numéro saisi
**When** les résultats s'affichent
**Then** un message "Aucun lot trouvé pour « X »" avec suggestion "Vérifiez le numéro" s'affiche

### Story 3.6: Filtres de vues

En tant que utilisateur de posePilot,
Je veux filtrer les vues par statut (Tous / En cours / Terminés / Avec alertes),
Afin que je me concentre sur les éléments qui nécessitent mon attention.

**Acceptance Criteria:**

**Given** l'utilisateur est sur une vue de grille (lots d'un étage, pièces d'un lot)
**When** l'écran s'affiche
**Then** des tabs de filtre sont visibles en haut : Tous | En cours | Terminés | Avec alertes

**Given** l'utilisateur tape sur "En cours"
**When** le filtre s'applique
**Then** seuls les éléments partiellement avancés s'affichent, et le tab actif est visuellement distinct (souligné en bleu)

**Given** l'utilisateur tape sur "Avec alertes"
**When** le filtre s'applique
**Then** seuls les éléments ayant des notes bloquantes ou des documents manquants s'affichent

**Given** un filtre est actif
**When** l'utilisateur consulte les résultats
**Then** un compteur de résultats est visible sur chaque tab

---

## Epic 4: Notes, Photos & Collaboration

Les utilisateurs signalent des problèmes avec texte et photos, flaggent les blocages, partagent des infos contextualisées, et suivent l'activité via le fil "quoi de neuf".

### Story 4.1: Création de notes texte avec flag bloquant

En tant que utilisateur de posePilot,
Je veux créer des notes sur un lot ou une pièce et pouvoir les marquer comme bloquantes,
Afin que les informations terrain soient tracées et que les blocages soient visibles immédiatement.

**Acceptance Criteria:**

**Given** l'utilisateur est sur l'écran d'un lot ou d'une pièce
**When** il tape le bouton flottant "+" puis choisit "Note"
**Then** un écran de saisie s'affiche avec un champ texte libre et une option "Bloquant"

**Given** l'utilisateur saisit du texte et valide
**When** la note est créée (table `notes`)
**Then** la note apparaît dans la liste des notes du lot/pièce avec l'auteur et l'horodatage

**Given** l'utilisateur coche "Bloquant" lors de la création
**When** la note est enregistrée
**Then** la note est visuellement marquée en rouge, et un indicateur de blocage apparaît sur la carte du lot dans les grilles parentes

**Given** une note bloquante existe sur un lot
**When** l'utilisateur consulte la grille d'étage
**Then** la StatusCard du lot affiche un indicateur rouge de blocage

**Given** l'utilisateur consulte une note existante
**When** il regarde les métadonnées
**Then** l'auteur (nom de l'utilisateur connecté) et la date/heure sont affichés

### Story 4.2: Photos depuis la caméra sur les notes

En tant que utilisateur terrain de posePilot,
Je veux prendre une photo et l'attacher à une note,
Afin que les problèmes soient documentés visuellement depuis le chantier.

**Acceptance Criteria:**

**Given** l'utilisateur crée ou édite une note
**When** il tape sur le bouton photo
**Then** l'appareil photo s'ouvre via `<input type="file" capture="environment">`

**Given** l'utilisateur a pris une photo
**When** la photo est sélectionnée
**Then** elle est compressée côté client (browser-image-compression, qualité 0.7, max 1200px) avant upload

**Given** la photo est compressée
**When** l'upload vers Supabase Storage s'effectue
**Then** la photo est stockée dans le bucket `photos` et liée à la note

**Given** la note a des photos attachées
**When** l'utilisateur consulte la note
**Then** les photos s'affichent en miniatures avec possibilité de les agrandir en plein écran

**Given** le réseau est lent (3G)
**When** l'upload est en cours
**Then** une barre de progression s'affiche et la note est déjà sauvegardée (texte d'abord, photo en arrière-plan)

### Story 4.3: Partage photo contextualisé

En tant que utilisateur de posePilot,
Je veux partager une photo vers le maître d'ouvrage avec le contexte auto-renseigné,
Afin que la communication avec le promoteur soit efficace et tracée.

**Acceptance Criteria:**

**Given** l'utilisateur consulte une note avec photo
**When** il tape sur "Partager"
**Then** le système prépare un partage avec la photo et un texte contextuel pré-rempli (ex: "Chantier Les Oliviers — Plot A — Lot 203 — SDB : support fissuré")

**Given** le partage est préparé
**When** l'utilisateur confirme
**Then** la feuille de partage native du système s'ouvre (Web Share API) permettant d'envoyer via WhatsApp, email, etc.

**Given** l'appareil ne supporte pas Web Share API
**When** l'utilisateur tape "Partager"
**Then** la photo est téléchargée et le texte contextuel est copié dans le presse-papiers avec un toast de confirmation

### Story 4.4: Fil d'activité "quoi de neuf"

En tant que utilisateur de posePilot,
Je veux voir les modifications récentes de mes collègues depuis ma dernière visite,
Afin que je sois informé sans avoir à appeler ou demander.

**Acceptance Criteria:**

**Given** des actions ont été effectuées par d'autres utilisateurs (changements de statut, notes, photos, livraisons)
**When** l'utilisateur ouvre l'onglet Activité dans la bottom navigation
**Then** un fil chronologique inversé (plus récent en haut) affiche les entrées groupées par jour (Aujourd'hui, Hier, date)

**Given** une entrée d'activité s'affiche
**When** l'utilisateur la consulte
**Then** elle montre : icône du type d'action + initiale de l'auteur + description + cible + timestamp relatif (ex: "Bruno a terminé Séjour — Lot 203, il y a 2h")

**Given** des modifications ont eu lieu depuis la dernière visite de l'utilisateur
**When** l'utilisateur regarde la bottom navigation
**Then** un badge numérique discret apparaît sur l'onglet Activité (pas de popup)

**Given** l'utilisateur ouvre le fil d'activité
**When** les entrées "nouvelles" sont affichées
**Then** un indicateur "Nouveau" les distingue des entrées déjà vues

**Given** des actions se produisent en temps réel
**When** l'utilisateur est sur le fil d'activité
**Then** les nouvelles entrées apparaissent en haut via Supabase Realtime sans rafraîchir

---

## Epic 5: Gestion des Documents PDF

Les utilisateurs gèrent les plans de pose, fiches de choix et autres documents par lot — upload, visualisation, types personnalisables, obligatoires/optionnels, héritage depuis les variantes.

### Story 5.1: Upload, visualisation et gestion de documents PDF

En tant que utilisateur de posePilot,
Je veux uploader, visualiser, remplacer et télécharger des documents PDF sur un lot,
Afin que les plans de pose et fiches de choix soient accessibles directement depuis l'app.

**Acceptance Criteria:**

**Given** un lot a des slots de documents (hérités ou ajoutés manuellement)
**When** l'utilisateur tape sur un slot vide
**Then** le sélecteur de fichier s'ouvre, limité aux PDF

**Given** l'utilisateur sélectionne un fichier PDF
**When** l'upload vers Supabase Storage (bucket `documents`) se termine
**Then** le PDF est lié au slot du lot, l'icône du slot passe de "vide" à "rempli" avec le nom du fichier

**Given** un slot contient un PDF
**When** l'utilisateur tape dessus
**Then** le PDF s'ouvre via une URL signée Supabase Storage (pas de viewer custom)

**Given** un slot contient un PDF
**When** l'utilisateur choisit "Remplacer"
**Then** un nouveau fichier peut être sélectionné, l'ancien est remplacé

**Given** un slot contient un PDF
**When** l'utilisateur choisit "Télécharger"
**Then** le PDF est téléchargé sur l'appareil

**Given** un upload est en cours sur réseau lent
**When** le transfert progresse
**Then** une barre de progression s'affiche

### Story 5.2: Types de documents personnalisés et gestion par lot

En tant que utilisateur de posePilot,
Je veux définir des types de documents personnalisés et gérer les documents par lot,
Afin que chaque lot ait exactement les documents nécessaires selon sa situation.

**Acceptance Criteria:**

**Given** un lot affiche sa liste de documents
**When** l'utilisateur consulte la vue documents
**Then** les documents hérités de la variante ET les documents ajoutés au lot sont affichés dans une liste unifiée

**Given** l'utilisateur veut ajouter un nouveau type de document au lot
**When** il tape "Ajouter un document"
**Then** il peut saisir un nom libre (ex: "Relevé acoustique") pour créer un nouveau slot

**Given** un slot de document existe
**When** l'utilisateur consulte ses propriétés
**Then** il voit si le document est marqué comme obligatoire ou optionnel

**Given** aucun document n'est défini ni hérité pour un lot
**When** l'utilisateur consulte la vue documents
**Then** aucune contrainte n'est imposée — zéro document requis par défaut

### Story 5.3: Récapitulatif et indicateurs de documents manquants

En tant que utilisateur de posePilot,
Je veux voir un récapitulatif des documents obligatoires manquants et un indicateur visuel sur les lots,
Afin que je sache immédiatement quels lots nécessitent encore des documents avant intervention.

**Acceptance Criteria:**

**Given** un lot a des documents obligatoires sans PDF uploadé
**When** l'utilisateur consulte la vue documents du lot
**Then** un récapitulatif en haut liste les documents obligatoires manquants avec leur nom

**Given** un lot a des documents obligatoires manquants
**When** l'utilisateur consulte la grille d'étage
**Then** la StatusCard du lot affiche un indicateur visuel (icône document) signalant les manquants

**Given** tous les documents obligatoires d'un lot sont uploadés
**When** l'utilisateur consulte la grille d'étage
**Then** aucun indicateur de document manquant n'apparaît sur la carte

**Given** l'utilisateur veut voir tous les lots avec documents manquants
**When** il utilise le filtre "Avec alertes" (implémenté dans Epic 3)
**Then** les lots avec documents obligatoires manquants apparaissent dans les résultats filtrés

---

## Epic 6: Besoins, Livraisons & Inventaire

Cycle complet besoin → commande → livraison avec BC/BL, navigation directe depuis chantier léger, gestion d'inventaire avec localisation et agrégation automatique.

### Story 6.1: Besoins — Création, gestion et transformation en livraison

En tant que utilisateur de posePilot,
Je veux créer des besoins, voir ceux en attente, et les transformer en livraisons,
Afin que les demandes matériel du terrain soient tracées et converties en commandes.

**Acceptance Criteria:**

**Given** l'utilisateur est dans un chantier (complet ou léger)
**When** il tape "Nouveau besoin"
**Then** un formulaire minimaliste s'affiche avec un champ description libre (ex: "Colle pour faïence 20kg")

**Given** l'utilisateur valide le besoin
**When** le besoin est créé (table `besoins`)
**Then** il apparaît dans la liste des besoins en attente du chantier avec un toast "Besoin créé"

**Given** l'utilisateur est dans un chantier de type léger
**When** il tape sur le chantier depuis l'écran d'accueil
**Then** il accède directement à la vue besoins et livraisons (pas de navigation plots/lots)

**Given** des besoins en attente existent
**When** l'utilisateur consulte la liste
**Then** chaque besoin affiche sa description, sa date de création et l'auteur

**Given** l'utilisateur veut commander un besoin
**When** il tape "Commander" sur un besoin en attente
**Then** le besoin est transformé en livraison au statut "Commandé" et disparaît de la liste des besoins en attente

### Story 6.2: Livraisons — Création directe et cycle de vie

En tant que utilisateur de posePilot,
Je veux créer des livraisons directement et suivre leur cycle de vie,
Afin que je suive chaque commande depuis la passation jusqu'à la réception.

**Acceptance Criteria:**

**Given** l'utilisateur est dans la section livraisons d'un chantier
**When** il tape "Nouvelle livraison"
**Then** un formulaire permet de saisir une description et de créer la livraison au statut "Commandé" (table `livraisons`)

**Given** une livraison est au statut "Commandé"
**When** l'utilisateur tape "Marquer comme Prévu"
**Then** le statut passe à "Prévu" et un champ date prévue s'affiche

**Given** l'utilisateur renseigne une date de livraison prévue
**When** il valide
**Then** la date est enregistrée et affichée sur la DeliveryCard

**Given** une livraison est au statut "Prévu"
**When** l'utilisateur tape "Confirmer la livraison"
**Then** le statut passe à "Livré" avec la date du jour

**Given** le statut d'une livraison change
**When** la mutation s'effectue
**Then** le changement est propagé en temps réel via Supabase Realtime aux autres utilisateurs

### Story 6.3: Livraisons — Documents BC et BL

En tant que utilisateur de posePilot,
Je veux rattacher un bon de commande et un bon de livraison à une livraison,
Afin que la traçabilité documentaire des commandes soit assurée.

**Acceptance Criteria:**

**Given** une livraison existe au statut "Commandé" ou supérieur
**When** l'utilisateur tape "Ajouter BC"
**Then** il peut uploader un document (photo ou PDF) comme bon de commande

**Given** une livraison existe au statut "Livré"
**When** l'utilisateur tape "Ajouter BL"
**Then** il peut uploader un document (photo ou PDF) comme bon de livraison

**Given** une livraison a un BC ou BL rattaché
**When** l'utilisateur consulte la DeliveryCard
**Then** les documents sont visibles avec une icône de téléchargement

**Given** l'utilisateur tape sur un BC ou BL
**When** le document s'ouvre
**Then** il est affiché via URL signée Supabase Storage

### Story 6.4: Vue globale des livraisons filtrée par statut

En tant que utilisateur de posePilot,
Je veux voir toutes les livraisons de tous mes chantiers filtrées par statut,
Afin que j'anticipe les prochaines réceptions et identifie les retards.

**Acceptance Criteria:**

**Given** l'utilisateur tape sur l'onglet "Livraisons" de la bottom navigation
**When** la vue s'affiche
**Then** toutes les livraisons de tous les chantiers (complets ET légers) sont listées en DeliveryCards

**Given** la vue globale livraisons s'affiche
**When** l'utilisateur consulte les tabs de filtre
**Then** les filtres "Tous | Commandé | Prévu | Livré" sont disponibles avec un compteur par tab

**Given** l'utilisateur active le filtre "Prévu"
**When** les résultats s'affichent
**Then** seules les livraisons au statut Prévu apparaissent, triées par date de livraison prévue (la plus proche en premier)

**Given** des livraisons ont des dates prévues cette semaine
**When** l'utilisateur consulte la vue
**Then** ces livraisons sont mises en évidence visuellement

**Given** des besoins en attente non commandés existent
**When** l'utilisateur consulte la vue globale
**Then** un badge sur l'onglet "Livraisons" de la bottom nav indique le nombre de besoins non commandés

### Story 6.5: Gestion d'inventaire avec localisation

En tant que utilisateur de posePilot,
Je veux enregistrer du matériel avec quantité et localisation, et ajuster rapidement,
Afin que je sache exactement quel matériel est disponible et où sur le chantier.

**Acceptance Criteria:**

**Given** l'utilisateur est dans un chantier complet
**When** il accède à la section Inventaire
**Then** la liste du matériel enregistré s'affiche avec quantité et localisation (plot + étage)

**Given** l'utilisateur ajoute du matériel
**When** il saisit le nom, la quantité et la localisation
**Then** le matériel est créé (table `inventaire`) avec les informations fournies

**Given** l'utilisateur navigue depuis un plot/étage spécifique
**When** il ajoute du matériel
**Then** le système pré-remplit la localisation (plot + étage) selon le contexte de navigation actuel

**Given** du matériel existe dans l'inventaire
**When** l'utilisateur ajuste la quantité
**Then** des boutons +/- permettent un ajustement rapide, avec possibilité de supprimer (quantité à 0)

**Given** du matériel est enregistré sur plusieurs étages d'un plot
**When** l'utilisateur consulte l'inventaire au niveau plot
**Then** les quantités sont agrégées automatiquement (étage → plot → chantier)

**Given** l'utilisateur consulte l'inventaire au niveau chantier
**When** les données s'affichent
**Then** le total agrégé de chaque matériel est visible avec le détail par localisation

---

## Epic 7: Métrés, Plinthes & Indicateurs intelligents

Métrés optionnels (m² et ML plinthes), suivi des plinthes commandées/façonnées, et indicateurs d'aide à la décision : lots prêts à carreler, croisement inventaire/métrés, besoins en attente, livraisons prévues.

### Story 7.1: Saisie et agrégation des métrés

En tant que utilisateur de posePilot,
Je veux saisir les m² et mètres linéaires plinthes par pièce et voir les totaux agrégés,
Afin que je connaisse les surfaces exactes pour anticiper les commandes de matériel.

**Acceptance Criteria:**

**Given** l'utilisateur est sur l'écran d'une pièce
**When** il consulte les champs de métrés
**Then** deux champs optionnels sont disponibles : m² (surface) et ML plinthes (mètres linéaires)

**Given** les champs de métrés sont vides
**When** l'utilisateur ne les remplit pas
**Then** aucun blocage, aucune alerte — les champs restent optionnels et ne freinent jamais le workflow

**Given** l'utilisateur saisit les m² d'une pièce (ex: 12.5)
**When** il valide
**Then** la valeur est enregistrée et affichée sur l'écran pièce

**Given** l'utilisateur saisit les ML plinthes d'une pièce (ex: 8.2)
**When** il valide
**Then** la valeur est enregistrée et affichée sur l'écran pièce

**Given** des métrés sont saisis sur plusieurs pièces d'un lot
**When** l'utilisateur consulte le lot
**Then** les m² et ML sont agrégés automatiquement au niveau lot (somme des pièces)

**Given** des métrés sont agrégés au niveau lot
**When** l'utilisateur consulte le plot
**Then** les m² et ML sont agrégés automatiquement au niveau plot (somme des lots)

### Story 7.2: Suivi du statut des plinthes

En tant que utilisateur de posePilot,
Je veux suivre le statut des plinthes (commandées / façonnées chez fournisseur),
Afin que je sache où en est la préparation des plinthes pour chaque lot.

**Acceptance Criteria:**

**Given** un lot a des ML plinthes renseignés
**When** l'utilisateur consulte le lot
**Then** un indicateur de statut des plinthes est disponible

**Given** l'utilisateur veut mettre à jour le statut des plinthes
**When** il change le statut
**Then** il peut choisir entre : non commandées / commandées / façonnées chez fournisseur

**Given** le statut des plinthes est mis à jour
**When** l'utilisateur consulte la grille de lots
**Then** un indicateur visuel sur la StatusCard du lot reflète le statut des plinthes

**Given** les plinthes n'ont pas de ML renseigné
**When** l'utilisateur consulte le lot
**Then** aucun indicateur de statut plinthes n'est affiché (fonctionnalité optionnelle)

### Story 7.3: Indicateurs intelligents et aide à la décision

En tant que utilisateur de posePilot,
Je veux voir des indicateurs intelligents qui croisent les données du chantier,
Afin que j'anticipe les besoins et prenne des décisions éclairées.

**Acceptance Criteria:**

**Given** des lots ont ragréage = fait ET phonique = fait ET pose = pas commencé
**When** l'utilisateur consulte la vue chantier ou plot
**Then** un indicateur "X lots prêts à carreler" est affiché avec la liste des lots concernés

**Given** de l'inventaire et des métrés sont renseignés
**When** le système croise les données
**Then** un indicateur compare le matériel disponible (inventaire) aux m² restants à poser, pour aider à décider si une commande est nécessaire

**Given** des besoins en attente existent (non transformés en livraison)
**When** l'utilisateur consulte la vue chantier
**Then** un compteur affiche "X besoins en attente non commandés"

**Given** des livraisons ont le statut "Prévu" avec une date
**When** l'utilisateur consulte la vue chantier
**Then** un indicateur affiche les prochaines livraisons prévues avec leurs dates

**Given** aucun métré, aucun inventaire, aucun besoin n'est renseigné
**When** l'utilisateur consulte les indicateurs
**Then** les indicateurs sont masqués ou affichent "—" — jamais de données erronées ou trompeuses
