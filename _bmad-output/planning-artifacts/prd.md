---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
workflow_completed: true
lastEdited: '2026-02-06'
editHistory:
  - date: '2026-02-06'
    changes: 'Ajout fonctionnalité Caractéristiques Chantier (FR70-FR76) - matériaux/PMO par chantier, 3 catégories extensibles. Levée exclusion type de carrelage.'
inputDocuments:
  - product-brief-posePilot-2026-02-05.md
  - brainstorming-session-2026-02-05.md
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 1
  projectDocs: 0
classification:
  projectType: web_app_pwa
  domain: construction_btp
  complexity: medium
  projectContext: greenfield
workflowType: 'prd'
---

# Product Requirements Document - posePilot

**Author:** Youssef
**Date:** 2026-02-05

## Executive Summary

posePilot est une PWA mobile-first de suivi de chantier conçue pour les entreprises de pose de carrelage/faïence travaillant avec des promoteurs immobiliers. L'application remplace une V1 surchargée et les méthodes manuelles par un outil ultra-focalisé : ouvrir l'app, voir ses chantiers, consulter les caractéristiques matériaux, entrer dans un lot en 2-3 taps, gérer l'avancement, les blocages, les documents et le matériel depuis le terrain.

### Vision produit

Un outil qui suit le professionnel sur le terrain, pas un logiciel qui le dirige depuis le bureau. Chaque fonctionnalité répond à un besoin terrain concret. Aucune fonctionnalité inutile.

### Utilisateurs cibles

- **Bruno** (principal) : Chef d'équipe terrain, profil tech basique, usage quotidien intensif sur smartphone Samsung. C'est le test ultime de la simplicité — si Bruno peut l'utiliser sans aide, le produit est réussi.
- **Youssef** (principal) : Pilote bureau/terrain, profil tech intermédiaire. Configure les chantiers, supervise l'avancement, gère les livraisons.
- **Persona 3** (potentiel) : Futur chef d'équipe, profil similaire à Bruno.

Aucun utilisateur secondaire. Outil strictement interne pour 2-3 personnes.

### Différenciateurs clés

1. **Spécialisation métier** : concepts natifs (TMA, fiches de choix, plinthes façonnées, métrés par pièce)
2. **Zéro superflu** : 9 catégories de fonctionnalités consciemment exclues
3. **Mobile-terrain first** : conçu pour les conditions réelles (froid, gants, réseau faible)
4. **Simplicité testée** : utilisable par un collègue peu à l'aise avec la technologie
5. **Deux types de chantiers** : complet (lots, plots, tâches) et léger (besoins et livraisons uniquement)

## Success Criteria

### User Success

- **Adoption naturelle** : Bruno utilise posePilot quotidiennement de sa propre initiative
- **Zéro explication nécessaire** : chaque écran est évident au premier regard
- **Rapidité d'accès** : accéder à un lot en < 10 secondes (2-3 taps max)
- **Couverture totale** : 100% des lots visités sont mis à jour dans l'app
- **Réflexe app** : les blocages sont notés dans l'app avec photo, plus communiqués juste à l'oral
- **Zéro contournement** : aucun retour aux méthodes "de tête" ou à la V1
- **Traçabilité terrain** : les besoins remontés par les ouvriers sont systématiquement tracés

### Business Success

- **Source de vérité partagée** : le premier réflexe lors d'une discussion chantier est d'ouvrir posePilot
- **Visibilité bureau** : Youssef voit l'avancement de tous les chantiers sans appeler Bruno
- **Réduction des oublis** : moins de tâches oubliées ou non suivies
- **Économies matériel** : moins de commandes en double grâce à l'inventaire et au suivi des livraisons
- **Anticipation** : estimation de l'avancée et de la date de fin grâce aux données de l'app
- **Communication efficace** : les notes et photos servent de base aux échanges avec le maître d'ouvrage

### Technical Success

- **Performance** : chaque écran < 3 secondes, y compris en réseau 3G variable
- **Stabilité** : zéro crash en usage normal
- **Légèreté** : fonctionne sur smartphones standards de chantier
- **Fiabilité des données** : aucune perte de données

### Measurable Outcomes

| Indicateur | Cible | Horizon |
|------------|-------|---------|
| Usage quotidien Bruno | Chaque jour de chantier | Dès le déploiement |
| Temps d'accès à un lot | < 10 secondes | Dès le déploiement |
| Lots mis à jour / lots visités | 100% | 1 mois d'usage |
| Temps de chargement écran | < 3 secondes | Dès le déploiement |
| Crashs en usage normal | 0 | Permanent |
| Questions "c'est quoi ?" de Bruno | 0 | Dès le déploiement |

## Product Scope

### Stratégie de livraison

Livraison complète unique — pas de MVP, pas de phases. Justification : outil interne pour 2-3 utilisateurs, aucune pression de time-to-market, l'adoption par Bruno nécessite un outil complet.

### Périmètre de livraison

1. **Navigation & Architecture** : PWA, 2 types de chantiers, hiérarchie complète, recherche par numéro, swipe entre pièces
2. **Suivi d'avancement & Tâches** : configurables par plot, 3 statuts, tap rapide, agrégation automatique
3. **Configuration & Structure** : templates, variantes, héritage unifié, ajout lots en batch (max 8)
4. **Notes, Problèmes & Collaboration** : photos, flag bloquant, partage contextualisé, fil "quoi de neuf"
5. **Documents** : PDF par lot, types personnalisables, obligatoires/optionnels, récap manquants
6. **Besoins, Livraisons & Inventaire** : cycle complet besoin → commande → livraison, BC/BL, inventaire localisé
7. **Métrés & Plinthes** : optionnels, agrégation automatique
8. **Indicateurs intelligents** : lots prêts à carreler, croisement inventaire/métrés, besoins en attente
9. **UX terrain** : tactile surdimensionné, thème clair/sombre, PWA installable
10. **Caractéristiques Chantier** : consultation des matériaux par chantier (carrelage, faïence, phonique, PMO), texte libre par élément, 3 catégories extensibles

### Exclusions définitives

Planning, rapports promoteurs, finances, documents chantier/plot, notes chantier/plot/étage, mode hors ligne, ordre imposé des tâches, gestion de qui fait quoi.

### Vision future (si succès confirmé)

Adaptation pour d'autres corps de métier, tableaux de bord statistiques, export pour facturation, version web bureau dédiée, intégrations fournisseurs.

### Risk Mitigation

- **Risque technique** : Faible — produit bien défini, concepts métier clairs, pas de technologie expérimentale
- **Risque de durée** : Aucune pression — livraison quand c'est prêt
- **Risque d'adoption** : Mitigé par le design centré sur Bruno et le test de simplicité permanent

## User Journeys

### Journey 1 : Bruno — La tournée quotidienne (parcours principal)

**Opening Scene :** 7h30, Bruno arrive sur le chantier Résidence Les Oliviers. Il fait froid, il a ses gants. Il sort son téléphone de la poche de sa veste.

**Rising Action :** Il ouvre posePilot — la liste des chantiers s'affiche, il tape sur Les Oliviers. Il va au Plot A, étage 2. La grille de lots apparaît avec les couleurs : certains verts, d'autres oranges, quelques gris. Il tape sur le lot 203. Les pièces s'affichent en cartes. Il entre dans le séjour.

**Climax :** L'écran pièce tout-en-un : les tâches sont là. Ragréage fait, phonique fait, pose en cours. Il tape sur "pose" — le statut passe à "fait" en vert. Il swipe vers la SDB. Là, problème : support fissuré. Il tape le bouton note, écrit "support fissuré SDB", prend une photo, coche "bloquant". 30 secondes, c'est fait.

**Resolution :** En 3 heures, Bruno a mis à jour 15 lots. À midi, Youssef au bureau voit l'avancement mis à jour. Quand il appelle Bruno pour parler du problème en SDB du lot 203, il a déjà la photo et le contexte dans l'app.

**Capabilities révélées :** Navigation rapide, grille visuelle avec couleurs, tap statut, notes avec photo, flag bloquant, swipe entre pièces, synchronisation temps réel.

---

### Journey 2 : Bruno — Le premier jour avec posePilot

**Opening Scene :** Youssef a configuré le chantier la veille au bureau. Ce matin, il accompagne Bruno sur le terrain avec l'app déjà installée sur le téléphone de Bruno.

**Rising Action :** Youssef montre : "Regarde, tu ouvres l'app, tu tapes sur le chantier, tu choisis le plot, l'étage, et tu es sur le lot. Pour valider une tâche, tu tapes dessus. Pour une note, tu tapes ici." Bruno essaie sur le lot 101. Il valide deux tâches, prend une photo.

**Climax :** Youssef repart au bureau. Bruno continue seul. Il hésite sur un écran — il ne cherche pas, il s'arrête. Le lendemain, il en parle à Youssef qui lui montre en 10 secondes. Après quelques jours, Bruno est autonome.

**Resolution :** Au bout d'une semaine, Bruno ouvre l'app de lui-même sans qu'on le lui demande. L'app est devenue un réflexe parce qu'elle est plus simple que de tout retenir de tête.

**Capabilities révélées :** Interface auto-explicative, pas d'onboarding intégré nécessaire, design anti-erreur, actions facilement réversibles.

---

### Journey 3 : Bruno — Quand ça ne marche pas

**Opening Scene :** Bruno est dans le lot 305. Il valide "pose fait" sur le séjour, mais il s'est trompé — c'est le lot 304 qu'il voulait mettre à jour.

**Rising Action :** Bruno ne panique pas. Il retape sur "pose" — le statut revient en arrière. Erreur corrigée en 1 seconde. Un autre jour, il cherche un lot par son numéro mais tape "401" au lieu de "410". Aucun résultat. Il efface et retape correctement.

**Climax :** Un matin, l'app met plus de temps à charger — réseau faible en sous-sol. Bruno attend 2-3 secondes, ça passe. Il ne s'énerve pas parce que l'app ne lui a jamais perdu de données.

**Resolution :** Bruno n'a jamais eu besoin de "dépanner" l'app. Les erreurs se corrigent d'un tap, et les données sont toujours là. Quand il est vraiment bloqué, il attend Youssef — mais ça arrive de moins en moins.

**Capabilities révélées :** Cycle de tap réversible, design tolérant aux erreurs, fiabilité réseau dégradé, persistance des données, recherche simple.

---

### Journey 4 : Youssef — Configuration d'un gros chantier

**Opening Scene :** Youssef est au bureau. Nouveau chantier : Résidence Les Cèdres, 3 plots, 80 lots. Il ouvre posePilot et crée le chantier.

**Rising Action :** Il crée le Plot A. Définit les tâches : ragréage, phonique, pose, plinthes, joints, silicone. Crée deux variantes : Type A (séjour, chambre, SDB, WC séparé) et Type B (séjour, chambre, SDB/WC combiné). Il définit les documents par défaut dans chaque variante : plan de pose (obligatoire), fiche de choix (optionnel). Puis il ajoute les lots — **8 lots d'un coup** pour l'étage 1 : lots 101 à 108, tous Type A. Puis 8 lots Type B pour l'étage 2. En quelques minutes, un plot complet est configuré.

**Climax :** Il répète pour les Plots B et C. Certains lots sont TMA — il les flag individuellement. Il uploade les plans de pose PDF. Avant de terminer, il accède aux caractéristiques du chantier : il renseigne le carrelage sol (Grès cérame 60x60 Marazzi), la faïence murs, le type d'isolation phonique, puis dans la catégorie PMO : la colle (Weber Flex S1), le joint, le silicone. Il précise que les plinthes seront façonnées chez le fournisseur. Un après-midi de travail, et les 80 lots sont prêts avec leurs tâches, pièces, documents hérités et les caractéristiques matériaux renseignées.

**Resolution :** Le lendemain, Bruno ouvre l'app et voit le chantier Les Cèdres, tout structuré, prêt à l'emploi. Un après-midi de configuration pour des mois d'utilisation sur le terrain.

**Capabilities révélées :** Création de chantier guidée, templates de variantes avec héritage (pièces + tâches + documents), ajout de lots en batch (max 8), flag TMA, upload PDF, caractéristiques matériaux par chantier (3 catégories extensibles), configuration bureau efficace.

---

### Journey 5 : Youssef — Pilotage bureau et chantier léger

**Opening Scene :** Youssef est au bureau, milieu de matinée. Il a 4 chantiers actifs : 2 complets et 2 légers. Il ouvre posePilot.

**Rising Action :** L'écran d'accueil montre les 4 chantiers. Les complets affichent leur % d'avancement — Les Oliviers à 67%, Les Cèdres à 23%. Les légers montrent le compteur de livraisons. Il voit que Bruno a mis à jour 12 lots hier sur Les Oliviers grâce au fil "quoi de neuf".

Son téléphone sonne : un ouvrier sur le chantier léger "Rénovation Duval" a besoin de joint. Youssef saisit le besoin en 2 taps. Plus tard, il passe la commande chez le fournisseur — il transforme le besoin en livraison "Commandé", renseigne le bon de commande. Le fournisseur confirme une date : il met à jour "Prévu".

**Climax :** En fin de journée, Youssef consulte la vue livraisons de tous les chantiers. Il voit d'un coup d'oeil : 2 livraisons prévues cette semaine, 1 besoin en attente non commandé. Il anticipe, il décide, il ne subit plus.

**Resolution :** Youssef n'appelle plus Bruno pour savoir "où on en est". L'app est la source de vérité. Le suivi des livraisons sur les chantiers légers lui évite les oublis. Les besoins terrain ne se perdent plus.

**Capabilities révélées :** Écran d'accueil multi-chantiers, fil "quoi de neuf", chantier léger (besoins + livraisons sans lots), cycle besoin → commande → livraison, bons de commande/livraison, vue filtrée par statut, indicateur besoins en attente.

---

### Journey Requirements Summary

| Capability | Journeys |
|------------|----------|
| Navigation rapide (2-3 taps) | J1, J2, J3 |
| Grille visuelle avec couleurs/statuts | J1, J4, J5 |
| Tap cycle statut (réversible) | J1, J2, J3 |
| Notes + photos + flag bloquant | J1 |
| Swipe entre pièces | J1 |
| Design anti-erreur / tolérant | J2, J3 |
| Recherche par numéro de lot | J3 |
| Ajout de lots en batch (max 8) | J4 |
| Templates, variantes, héritage | J4 |
| Upload documents PDF | J4 |
| Chantier léger (besoins/livraisons) | J5 |
| Fil "quoi de neuf" | J5 |
| Cycle besoin → commande → livraison | J5 |
| Indicateurs intelligents | J5 |
| Caractéristiques matériaux par chantier | J4 |

## Project-Type Requirements — PWA Mobile-First

### Overview

posePilot est une Progressive Web App (PWA) mobile-first, accessible via navigateur et installable sur l'écran d'accueil. Choix dicté par le contexte : 2-3 utilisateurs, pas de stores, mises à jour instantanées, V1 web existante qui valide l'approche.

### Architecture technique

**SPA (Single Page Application)** — navigation fluide sans rechargement, essentiel pour l'expérience "tap-tap-tap" de Bruno. Décision finale d'architecture laissée à l'architecte.

**PWA :**
- Installable sur l'écran d'accueil (manifest, service worker)
- Plein écran sans barre d'adresse (display: standalone)
- Bruno ne doit pas voir la différence avec une app native

**Navigateurs cibles :**
- Chrome Android (Samsung de Bruno) — priorité absolue
- Safari iOS — support secondaire
- Chrome Desktop (configuration bureau) — support secondaire

**SEO :** Aucun — outil interne

**Temps réel :** Synchronisation multi-utilisateur — les modifications de Bruno sont visibles par Youssef sans rafraîchir.

### Web APIs utilisées

- **Caméra** : `<input type="file" capture>` pour les photos de notes — validé sur la V1
- **Cache PWA** : assets statiques pour performance
- **Notifications push** : non requises
- **Mode hors ligne** : exclu

### Considérations d'implémentation

- **Responsive** : mobile-first, utilisable sur desktop pour la configuration bureau
- **Touch targets** : > 48x48px, posePilot vise plus grand (doigts de chantier)
- **Hébergement** : Vercel actuellement, décision finale par l'architecte
- **Authentification** : simple, 2-3 comptes
- **Upload photos** : compression côté client avant envoi (réseau 3G)

## Functional Requirements

### 1. Gestion des chantiers & Navigation

- **FR1** : L'utilisateur peut créer un nouveau chantier avec un nom
- **FR2** : L'utilisateur peut choisir le type de chantier à la création : complet ou léger (choix définitif, non modifiable)
- **FR3** : L'utilisateur peut voir tous les chantiers actifs sur l'écran d'accueil avec indicateur visuel (% avancement pour complet, compteur livraisons pour léger)
- **FR4** : L'utilisateur peut identifier le type de chantier (complet/léger) visuellement sur la carte
- **FR5** : L'utilisateur peut marquer un chantier comme terminé ou supprimé (disparaît de la vue principale)
- **FR6** : L'utilisateur peut naviguer la hiérarchie Chantier → Plot → Étage → Lot → Pièce (chantier complet)
- **FR7** : L'utilisateur peut accéder directement aux besoins et livraisons depuis un chantier léger
- **FR8** : L'utilisateur peut rechercher un lot par son numéro (chantier complet)
- **FR9** : L'utilisateur peut filtrer les vues : Tous / En cours / Terminés / Avec alertes
- **FR10** : L'utilisateur peut swiper entre les pièces d'un lot
- **FR11** : L'utilisateur peut voir chaque niveau hiérarchique sous forme de grille de cartes colorées selon le statut
- **FR12** : Le système agrège automatiquement l'avancement à tous les niveaux (pièce → lot → étage → plot → chantier)

### 2. Configuration & Structure

- **FR13** : L'utilisateur peut créer des plots au sein d'un chantier complet
- **FR14** : L'utilisateur peut définir les tâches disponibles par plot
- **FR15** : L'utilisateur peut créer des variantes d'appartement par plot avec pièces et tâches par défaut
- **FR16** : L'utilisateur peut définir des documents par défaut dans chaque variante
- **FR17** : L'utilisateur peut créer des lots avec un code libre, assignés à une variante et un étage
- **FR18** : L'utilisateur peut ajouter jusqu'à 8 lots en batch (même variante, même étage)
- **FR19** : L'utilisateur peut utiliser des identifiants d'étage libres (RDC, 1, 2, Combles...)
- **FR20** : L'utilisateur peut flag un lot comme TMA
- **FR21** : L'utilisateur peut modifier le flag TMA en cours de chantier
- **FR22** : L'utilisateur peut ajouter des tâches, pièces ou documents supplémentaires à un lot individuel
- **FR23** : Les lots héritent automatiquement des pièces, tâches et documents de leur variante assignée

### 3. Suivi d'avancement & Tâches

- **FR24** : L'utilisateur peut voir toutes les tâches d'une pièce sur un écran unique
- **FR25** : L'utilisateur peut changer le statut d'une tâche d'un seul tap (cycle : pas commencé → en cours → fait)
- **FR26** : L'utilisateur peut revenir en arrière sur un statut de tâche en tapant à nouveau (cycle réversible)
- **FR27** : L'utilisateur peut voir le compteur de tâches affiché en "X faits, Y en cours" (pas de pourcentage)

### 4. Notes, Problèmes & Collaboration

- **FR28** : L'utilisateur peut créer des notes texte libres sur un lot ou une pièce
- **FR29** : L'utilisateur peut marquer une note comme "bloquant"
- **FR30** : L'utilisateur peut attacher des photos prises depuis la caméra à une note
- **FR31** : Le système enregistre l'auteur de chaque note
- **FR32** : L'utilisateur peut partager une photo vers le maître d'ouvrage avec contexte auto-renseigné (chantier/lot/pièce)
- **FR33** : L'utilisateur peut voir un fil "quoi de neuf" des modifications des collègues depuis sa dernière visite
- **FR34** : Le système affiche un indicateur discret pour les nouvelles modifications (pas de popup)

### 5. Documents

- **FR35** : L'utilisateur peut uploader des documents PDF sur un lot
- **FR36** : L'utilisateur peut visualiser, remplacer et télécharger des documents PDF
- **FR37** : L'utilisateur peut définir des types de documents personnalisés (noms libres)
- **FR38** : L'utilisateur peut marquer des types de documents comme obligatoires ou optionnels
- **FR39** : Les documents définis dans la variante sont hérités par les lots
- **FR40** : L'utilisateur peut ajouter des documents supplémentaires à un lot individuel
- **FR41** : L'utilisateur peut voir un récapitulatif des documents obligatoires manquants
- **FR42** : Le système affiche un indicateur visuel sur la carte du lot si des documents obligatoires manquent
- **FR43** : Par défaut, aucun document n'est requis (zéro contrainte par défaut)

### 6. Besoins, Livraisons & Inventaire

**Besoins (tous types de chantiers) :**
- **FR44** : L'utilisateur peut créer un besoin avec description libre
- **FR45** : L'utilisateur peut voir la liste des besoins en attente au niveau chantier
- **FR46** : L'utilisateur peut transformer un besoin en livraison au statut "Commandé"

**Livraisons (tous types de chantiers) :**
- **FR47** : L'utilisateur peut créer une livraison directement (sans besoin préalable)
- **FR48** : L'utilisateur peut suivre le cycle de vie d'une livraison : Commandé → Prévu → Livré
- **FR49** : L'utilisateur peut rattacher un bon de commande (BC) à une livraison
- **FR50** : L'utilisateur peut rattacher un bon de livraison (BL) à une livraison
- **FR51** : L'utilisateur peut renseigner une date de livraison prévue
- **FR52** : L'utilisateur peut voir toutes les livraisons filtrées par statut

**Inventaire (chantier complet uniquement) :**
- **FR53** : L'utilisateur peut enregistrer du matériel avec quantité et localisation (plot + étage)
- **FR54** : Le système pré-remplit la localisation selon le contexte de navigation actuel
- **FR55** : Le système agrège l'inventaire automatiquement (étage → plot → chantier)
- **FR56** : L'utilisateur peut ajuster rapidement les quantités (+/-/supprimer)

### 7. Métrés, Plinthes & Indicateurs

- **FR57** : L'utilisateur peut saisir les m² par pièce (optionnel, jamais bloquant)
- **FR58** : L'utilisateur peut saisir les mètres linéaires plinthes par pièce (optionnel, jamais bloquant)
- **FR59** : Le système agrège les m² et ML par lot et par plot
- **FR60** : L'utilisateur peut suivre le statut des plinthes : commandées / façonnées chez fournisseur
- **FR61** : Le système identifie les lots prêts à carreler (ragréage + phonique faits, pose non commencée)
- **FR62** : Le système croise inventaire et métrés restants pour aide à la décision commande
- **FR63** : Le système affiche le nombre de besoins en attente non commandés
- **FR64** : Le système affiche les livraisons prévues à venir avec dates

### 8. Compte & UX

- **FR65** : L'utilisateur peut s'authentifier avec des identifiants simples (2-3 comptes)
- **FR66** : L'utilisateur peut choisir entre thème clair et sombre avec mémorisation du choix
- **FR67** : L'utilisateur peut installer la PWA sur l'écran d'accueil de son smartphone
- **FR68** : L'app fournit des zones tactiles > 60x60px adaptées aux conditions de chantier (doigts, gants)
- **FR69** : L'app affiche des boutons avec contrast ratio > 4.5:1 (WCAG AA), font size > 16px, sans gestes cachés

### 9. Caractéristiques Chantier

- **FR70** : L'utilisateur peut définir les caractéristiques matériaux d'un chantier, organisées en trois catégories : Carrelage/Faïence/Phonique, PMO, Autre
- **FR71** : L'utilisateur peut renseigner un texte libre (marque/modèle) pour chaque caractéristique
- **FR72** : L'utilisateur peut préciser le mode d'approvisionnement des plinthes : achetées façonnées, façonnées sur place, ou les deux
- **FR73** : L'utilisateur peut ajouter des éléments supplémentaires à chaque catégorie
- **FR74** : L'utilisateur peut consulter les caractéristiques d'un chantier depuis l'écran chantier
- **FR75** : Le système propose une liste d'éléments par défaut pour les catégories Carrelage/Faïence/Phonique et PMO à la création du chantier
- **FR76** : L'utilisateur peut modifier ou supprimer les caractéristiques à tout moment

## Non-Functional Requirements

### Performance

- **NFR1** : Chaque écran se charge en < 3 secondes sur réseau 3G
- **NFR2** : La navigation entre écrans (SPA) < 1 seconde
- **NFR3** : Le changement de statut d'une tâche (tap) < 300ms de feedback visuel
- **NFR4** : La recherche de lot par numéro < 1 seconde
- **NFR5** : First Contentful Paint < 2 secondes sur réseau 3G
- **NFR6** : Bundle initial optimisé pour réseau variable
- **NFR7** : Compression des photos côté client avant envoi

### Fiabilité

- **NFR8** : Zéro crash en usage normal
- **NFR9** : Aucune perte de données — tout ce qui est saisi est persisté
- **NFR10** : Synchronisation temps réel < 5 secondes de propagation entre utilisateurs
- **NFR11** : Requêtes échouées retentées automatiquement (réseau intermittent)
- **NFR12** : Feedback clair en cas d'erreur réseau (pas de silence)

### Sécurité

- **NFR13** : Authentification requise pour accéder à l'app
- **NFR14** : Données transmises via HTTPS uniquement
- **NFR15** : Sessions expirent après inactivité prolongée
- **NFR16** : Chaque utilisateur identifié par son propre compte (traçabilité des actions)
