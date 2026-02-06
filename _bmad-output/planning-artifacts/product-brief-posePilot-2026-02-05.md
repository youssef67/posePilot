---
stepsCompleted: [1, 2, 3, 4, 5, 6]
workflow_completed: true
inputDocuments:
  - brainstorming-session-2026-02-05.md
date: 2026-02-05
author: Youssef
---

# Product Brief: posePilot

## Executive Summary

posePilot est une application mobile de suivi de chantier conçue spécifiquement pour les entreprises de pose de revêtements en dur (carrelage, faïence) travaillant avec des promoteurs immobiliers. L'application remplace un outil V1 surchargé de fonctionnalités parasites par une expérience mobile-first ultra-focalisée : ouvrir l'app, voir ses chantiers, entrer dans un lot en 2-3 taps, et gérer l'avancement, les blocages, les documents et le matériel directement depuis le terrain.

L'application supporte deux types de chantiers : le **chantier complet** (avec gestion des lots, plots, tâches, documents et inventaire) et le **chantier léger** (sans lots ni plots, centré sur le suivi des besoins terrain et des livraisons). Les deux types partagent un système commun de gestion des besoins et livraisons au niveau chantier, permettant de suivre le cycle complet : besoin terrain → commande → livraison prévue → livrée.

Pensée pour 2-3 utilisateurs sur smartphone dans les conditions réelles d'un chantier (froid, réseau variable, peu de temps), posePilot mise sur la simplicité absolue et la rapidité d'exécution. Chaque fonctionnalité répond à un besoin terrain concret, validé par l'expérience quotidienne. Aucune fonctionnalité inutile. Un outil qui suit le professionnel, pas un logiciel qui le dirige.

---

## Core Vision

### Problem Statement

Les entreprises de pose de carrelage/faïence gèrent simultanément plusieurs chantiers de natures différentes. Certains comprennent des dizaines à une centaine de lots nécessitant un suivi d'avancement détaillé, tandis que d'autres sont des interventions plus légères nécessitant principalement un suivi des livraisons et du matériel. Dans les deux cas, le suivi d'avancement, la gestion des blocages, des documents (plans de pose, TMA, fiches de choix), du matériel et des livraisons repose aujourd'hui sur la mémoire, des échanges informels, ou des outils inadaptés. Les besoins remontés par les ouvriers sur le terrain se perdent faute de traçabilité. Ce manque de suivi structuré entraîne des pertes de temps, des oublis et un coût financier indirect.

### Problem Impact

- **Perte de temps** : rechercher des réponses à des questions que l'outil devrait fournir instantanément
- **Oublis** : tâches non réalisées, blocages non suivis, surplus de matériel oubliés sur un étage
- **Surcoûts** : commandes en double faute de visibilité sur l'inventaire terrain, besoins terrain non tracés qui se perdent
- **Frustration** : l'outil V1 existant nécessite 7+ interactions pour accéder à un lot, noyé dans des fonctionnalités parasites (finances, etc.)

### Why Existing Solutions Fall Short

- **Outils BTP génériques** (BatiScript, Fieldwire, PlanRadar) : pensés pour le BTP global, pas pour le métier spécifique de la pose de carrelage. Fonctionnalités superflues qui polluent l'expérience.
- **Coût** : abonnements à ~50 euros/mois/utilisateur, disproportionné pour une équipe de 2-3 personnes.
- **Rigidité** : ne supportent pas les concepts métier spécifiques (variantes d'appartement, TMA, fiches de choix, plinthes façonnées vs posées, métrés par pièce).
- **V1 interne** : surchargée, navigation laborieuse, pas pensée mobile-first.

### Proposed Solution

posePilot est une application mobile-first qui offre :
- **Deux types de chantiers** : chantier complet (lots, plots, tâches détaillées) et chantier léger (suivi besoins et livraisons uniquement). Le type est défini à la création et ne peut pas être changé.
- **Navigation instantanée** : accueil → chantier → plot → étage → lot → pièce en taps fluides (chantier complet), ou accueil → chantier → besoins/livraisons (chantier léger), avec recherche rapide par numéro de lot
- **Suivi d'avancement visuel** : grilles de cartes colorées à chaque niveau, compteurs "X faits, Y en cours", agrégation automatique du bas vers le haut
- **Gestion terrain des tâches** : tâches configurables par plot avec variantes d'appartement, 3 statuts (rien/en cours/fait) changés d'un tap
- **Signalement de blocages** : notes avec photos intégrées, partage contextualisé vers le maître d'ouvrage
- **Documents liés au lot** : PDF attachés (plans, TMA, fiches de choix, bons de commande), types personnalisables, obligatoires ou non
- **Gestion des besoins et livraisons** : remontées terrain des ouvriers transformables en commandes, suivi du cycle complet (commandé → prévu → livré) avec bons de commande et bons de livraison — disponible sur tous les types de chantiers
- **Inventaire matériel** : suivi localisé (plot + étage) avec agrégation automatique et ajustement rapide des quantités (chantier complet)
- **Système d'héritage unifié** : templates de variantes définissant pièces, tâches et documents par défaut - configuré une fois au bureau, utilisé instantanément sur le terrain

### Key Differentiators

1. **Spécialisation métier** : conçu pour la pose de carrelage/faïence, pas pour le BTP générique. Les concepts de TMA, fiches de choix, plinthes façonnées et métrés par pièce sont natifs.
2. **Zéro superflu** : 9 catégories de fonctionnalités consciemment exclues. Chaque écran sert au quotidien.
3. **Mobile-terrain first** : conçu pour les conditions réelles (froid, gants, réseau faible, rapidité). Boutons larges, navigation par tap et swipe entre pièces, thème clair/sombre.
4. **Simplicité testée** : l'app doit être utilisable par un collègue moins à l'aise avec la technologie. Si ce n'est pas évident au premier regard, c'est trop compliqué.
5. **Coût maîtrisé** : outil interne sans abonnement mensuel par utilisateur.
6. **Philosophie du professionnel** : l'app informe sans imposer, suit sans diriger. Champs optionnels, zéro contrainte d'ordre, confiance au savoir-faire du poseur.

## Target Users

### Primary Users

**Persona 1 : Bruno - Le terrain au quotidien**

- **Rôle :** Chef d'équipe terrain / suivi de chantier
- **Contexte :** Sur le chantier tous les jours, smartphone en poche. C'est lui qui visite les lots, vérifie l'avancement, note les problèmes, prend les photos et met à jour l'inventaire matériel.
- **Profil tech :** Basique. Utilise WhatsApp et les emails, mais pas plus. N'est pas à l'aise avec les interfaces complexes ou les menus imbriqués.
- **Motivation :** Avoir un outil simple qui l'aide à ne rien oublier et à savoir où il en est sur chaque lot sans perdre de temps.
- **Frustration actuelle :** L'outil V1 est trop compliqué, trop de clics, trop de fonctionnalités inutiles. Il préfère se fier à sa mémoire plutôt que de se battre avec l'app.
- **Moment "c'est exactement ce qu'il me fallait"** : Il ouvre l'app, tape le numéro du lot, il est dessus. Il valide 3 tâches d'un tap, note un problème avec une photo, et c'est fait en 30 secondes. L'app ne lui pose pas de questions inutiles.
- **Usage estimé :** Quotidien, intensif. C'est L'utilisateur principal de posePilot.

**Persona 2 : Youssef - Le pilote bureau/terrain**

- **Rôle :** Futur conducteur de travaux. Gestion et supervision.
- **Contexte :** Principalement au bureau, se rend sur le terrain de temps en temps avec Bruno. C'est lui qui configure les chantiers, crée les templates, définit les variantes, uploade les documents.
- **Profil tech :** Intermédiaire. À l'aise avec les outils numériques, développeur de la V1.
- **Motivation :** Avoir une vision claire de l'avancement de tous les chantiers sans devoir appeler Bruno. Pouvoir estimer l'avancée et anticiper la fin des travaux depuis le bureau.
- **Frustration actuelle :** Manque de visibilité globale, doit poser des questions pour savoir où en sont les choses. La V1 qu'il a développée n'est pas adaptée.
- **Moment "c'est exactement ce qu'il me fallait"** : Il ouvre l'app au bureau, voit tous les chantiers avec leur pourcentage, identifie immédiatement celui qui a besoin d'attention. Il sait que Bruno a mis à jour 8 lots hier grâce au fil "quoi de neuf".
- **Usage estimé :** Régulier mais moins intensif que Bruno. Configuration + consultation + visites terrain occasionnelles.

**Persona 3 (potentiel) : Profil similaire à Bruno**

- Un futur chef d'équipe terrain avec un profil tech basique
- Mêmes besoins, mêmes contraintes que Bruno
- Confirme que la simplicité doit être le standard, pas l'exception

### Secondary Users

Aucun utilisateur secondaire identifié. posePilot est un outil strictement interne pour l'équipe terrain/supervision. Pas d'accès promoteur, pas de rôle administratif, pas de reporting externe.

### User Journey

**Bruno - Parcours quotidien type :**

| Étape | Action | Besoin posePilot |
|-------|--------|-----------------|
| **7h30 - Arrivée chantier** | Se dirige vers le premier plot | Pas encore besoin de l'app |
| **7h35 - Devant le lot 101** | Sort le téléphone, cherche le lot | Accès en 2-3 taps ou recherche par numéro |
| **7h36 - Dans le séjour** | Vérifie le travail réalisé | Vue pièce : tâches à valider d'un tap |
| **7h37 - Validation** | Coche phonique fait, pose en cours | Tap = changement de statut, rapide |
| **7h38 - Problème SDB** | Support fissuré, prend une photo | Note + photo + flag bloquant |
| **7h39 - Pièce suivante** | Swipe vers la chambre | Navigation swipe entre pièces |
| **7h42 - Lot terminé** | Sort, passe au lot suivant | Retour à la vue étage, lot suivant |
| **9h00 - Matériel** | Voit 5 sacs de colle à l'étage 3 | Saisie inventaire rapide avec localisation auto |
| **12h00 - Pause** | Bruno a mis à jour 15 lots | Tout est synchronisé pour Youssef au bureau |

**Youssef - Parcours de configuration :**

| Étape | Action | Besoin posePilot |
|-------|--------|-----------------|
| **Bureau - Nouveau chantier** | Crée le chantier, plots, variantes | Flux guidé étape par étape |
| **Configuration** | Définit tâches, pièces, documents | Templates + variantes + héritage |
| **Upload documents** | Charge plans, TMA, fiches de choix | PDF par lot, types personnalisables |
| **Suivi à distance** | Consulte l'avancement global | Écran d'accueil avec % par chantier |
| **Visite terrain** | Accompagne Bruno occasionnellement | Même interface simple que Bruno |

**Youssef - Parcours chantier léger :**

| Étape | Action | Besoin posePilot |
|-------|--------|-----------------|
| **Bureau - Appel d'un ouvrier** | "Il me faudrait du joint pour le chantier Résidence X" | Saisie rapide d'un besoin en 2 taps |
| **Bureau - Commande** | Passe la commande chez le fournisseur | Transforme le besoin en livraison "Commandé" + renseigne le BC |
| **Bureau - Confirmation** | Le fournisseur confirme la date | Met à jour le statut "Prévu" + date |
| **Terrain - Réception** | Le matériel est arrivé | Met à jour "Livré" + renseigne le BL |
| **Suivi global** | Voit en un coup d'oeil l'état de toutes les livraisons | Vue filtrée par statut |

**Insight clé :** L'app doit être conçue pour Bruno en premier. Si Bruno peut l'utiliser sans aide, Youssef pourra l'utiliser les yeux fermés. Bruno est le test ultime de la simplicité.

## Success Metrics

### Indicateur ultime de succès

> Quand Youssef et Bruno discutent d'un chantier ou d'un lot, leur premier réflexe est d'ouvrir posePilot pour voir ce qu'il en est. L'app est devenue la référence commune, la source de vérité partagée.

### Métriques utilisateur

| Métrique | Indicateur de succès | Cible à 3 mois |
|----------|---------------------|-----------------|
| **Adoption par Bruno** | Bruno utilise l'app quotidiennement de sa propre initiative, sans qu'on le lui demande | Usage quotidien sur chaque chantier actif |
| **Rapidité d'accès** | Accéder à un lot en moins de 10 secondes (vs 30+ sec en V1) | 2-3 taps max |
| **Couverture du suivi** | Tous les lots actifs sont mis à jour dans l'app | 100% des lots visités = mis à jour |
| **Signalement des problèmes** | Les blocages sont notés dans l'app avec photo, pas juste communiqués oralement | Les discussions sur les problèmes partent de l'app |
| **Zéro friction** | Bruno ne se plaint pas de l'app, ne la contourne pas | Aucun retour à la méthode "de tête" |

### Business Objectives

| Objectif | Mesure | Impact |
|----------|--------|--------|
| **Moins d'oublis** | Réduction des tâches oubliées ou non suivies | Qualité de réalisation en hausse |
| **Meilleur suivi matériel** | Inventaire terrain à jour, moins de commandes en double | Économie directe sur les achats |
| **Visibilité bureau** | Youssef voit l'avancement sans appeler Bruno | Gain de temps, meilleure anticipation |
| **Information partagée** | Les notes et photos servent de base aux échanges sur les problèmes | Communication plus efficace avec le maître d'ouvrage |
| **Estimation de fin de travaux** | Pouvoir estimer l'avancée et la date de fin grâce aux données de l'app | Meilleure planification |

### Key Performance Indicators

1. **Taux d'adoption** : Bruno met à jour l'app à chaque visite de lot (cible : 100%)
2. **Temps d'accès** : < 10 secondes pour arriver sur un lot depuis l'ouverture de l'app
3. **Complétude des données** : > 80% des lots ont leurs tâches, notes et documents à jour
4. **Réflexe app** : Lors des échanges Youssef-Bruno, l'app est consultée systématiquement (cible : premier réflexe)
5. **Satisfaction terrain** : Bruno considère l'app comme une aide, pas une contrainte

## MVP Scope

### Philosophie de livraison

Pas de MVP minimaliste. posePilot sera construit comme un outil complet et fonctionnel dès la première version. L'équipe de 2-3 utilisateurs n'a pas d'urgence de mise en marché - l'objectif est de livrer un outil abouti qui remplace définitivement la V1 et les méthodes manuelles.

### Core Features - Version complète

**1. Navigation & Architecture**
- Écran d'accueil : liste des chantiers avec indicateur visuel (% d'avancement pour les complets, compteur livraisons pour les légers)
- Indicateur du type de chantier visible sur la carte (complet / léger)
- **Chantier complet** : Hiérarchie Chantier → Plot → Étage → Lot → Pièce + accès aux besoins/livraisons au niveau chantier
- **Chantier léger** : Chantier → vue directe besoins et livraisons (pas de lots, pas de plots)
- Vue étage en grille de cartes avec indicateurs visuels (chantier complet)
- Vue lot en grille de cartes par pièce (chantier complet)
- Filtres : Tous / En cours / Terminés / Avec alertes
- Recherche rapide par numéro de lot (chantier complet)
- Swipe entre pièces d'un lot (chantier complet)
- Avancement agrégé automatiquement à tous les niveaux (pièce → lot → étage → plot → chantier) (chantier complet)

**2. Suivi d'avancement & Tâches**
- Tâches configurables par plot (ragréage, phonique, pose, plinthes, joints, silicone, etc.)
- 3 statuts par tâche : pas commencé → en cours → fait (cycle de tap)
- Affichage "X faits, Y en cours" (pas de pourcentage flou)
- Écran pièce tout-en-un : tâches + boutons note/photo + historique notes
- Validation rapide d'un tap par tâche

**3. Configuration & Structure**
- Choix du type de chantier à la création : **complet** (lots, plots, tâches) ou **léger** (besoins et livraisons uniquement). Le type est définitif et ne peut pas être changé après création.
- **Chantier complet** : Création guidée au bureau : chantier → plot → tâches → variantes → lots
- Templates d'appartement par plot avec variantes (Type A, Type B...)
- Héritage unifié : pièces, tâches et documents définis dans la variante, hérités par les lots
- Ajustement individuel par lot (ajout tâches, pièces, documents)
- Code de lot libre (pas de format imposé)
- Étage en identifiant libre (RDC, 1, 2, Combles...)
- Flag TMA sur les lots concernés
- Modification TMA possible en cours de chantier
- **Chantier léger** : Création rapide avec nom du chantier et informations de base, accès immédiat à la gestion des besoins et livraisons
- **Cycle de vie du chantier** (tous types) : un chantier peut être marqué comme **terminé** ou **supprimé**. Un chantier terminé ou supprimé disparaît de la vue principale. Pas d'archivage : terminé = terminé, on passe à autre chose.

**4. Notes, Problèmes & Collaboration**
- Notes avec texte libre par lot et par pièce
- Flag "bloquant" sur une note
- Photos intégrées attachées aux notes et liées à la pièce
- Traçabilité : auteur de chaque note visible
- Partage photo contextualisé vers maître d'ouvrage (chantier/lot/pièce auto-renseignés)
- Fil "quoi de neuf" : modifications des collègues depuis la dernière visite
- Notification discrète (indicateur, pas de popup)

**5. Documents**
- Documents PDF par lot (upload, visualisation, remplacement, téléchargement)
- Types de documents personnalisables (noms définis par l'utilisateur)
- Documents obligatoires ou optionnels (au choix de l'utilisateur)
- Documents définis dans le template de variante avec héritage
- Récap des documents manquants (vue dédiée)
- Indicateur visuel sur la carte du lot si documents obligatoires manquants
- Flexibilité totale : zéro document requis par défaut

**6. Besoins, Livraisons & Inventaire**

*6a. Besoins terrain (chantier complet + chantier léger)*
- Saisie rapide d'un besoin remonté par un ouvrier : description libre
- Liste des besoins en attente visible au niveau chantier
- Transformation d'un besoin en commande/livraison : le besoin disparaît et devient une livraison au statut "Commandé"
- Objectif : ne plus perdre les demandes terrain, tout est tracé

*6b. Suivi des livraisons (chantier complet + chantier léger)*
- Cycle de vie d'une livraison en 3 statuts :
  - **Commandé** : la commande a été passée chez le fournisseur
  - **Prévu** : le fournisseur a confirmé avec une date de livraison prévue
  - **Livré** : le matériel est arrivé sur place
- Informations par livraison : description, date prévue de livraison
- Documents rattachés à chaque livraison :
  - **Bon de commande (BC)** : renseigné lors de la commande
  - **Bon de livraison (BL)** : renseigné à la réception
- Création directe d'une livraison (sans passer par un besoin) possible
- Vue globale des livraisons au niveau chantier avec filtrage par statut
- Sur un chantier léger : c'est la fonctionnalité principale, accessible directement
- Sur un chantier complet : accessible depuis la vue chantier, en complément de la gestion des lots

*6c. Inventaire matériel (chantier complet uniquement)*
- Inventaire matériel par chantier avec localisation (plot + étage)
- Agrégation automatique de l'inventaire (étage → plot → chantier)
- Ajustement rapide des quantités (+/-/supprimer)
- Saisie inventaire avec pré-remplissage de la localisation (contexte de navigation)

**7. Métrés & Plinthes**
- Métrés (m²) par pièce - optionnel, jamais bloquant
- Mètres linéaires plinthes par pièce - optionnel, jamais bloquant
- Agrégation automatique par lot et par plot
- Suivi plinthes : commandées / façonnées chez fournisseur

**8. Indicateurs intelligents**
- Lots prêts à carreler (ragréage + phonique faits, pose pas commencée) (chantier complet)
- Croisement inventaire/métrés restants pour aide à la décision commande (chantier complet)
- Nombre de besoins en attente non encore commandés (tous types de chantiers)
- Livraisons prévues à venir avec dates (tous types de chantiers)

**9. UX & Design**
- Mobile-first, pensé pour le terrain
- Éléments tactiles surdimensionnés (doigts de chantier)
- Thème clair/sombre avec mémorisation du choix
- App légère pour réseau variable (3G zone rurale)
- Boutons visibles et clairs, pas de gestes cachés
- Multi-utilisateur : 2-3 comptes

### Out of Scope (exclusions définitives)

1. Gestion du planning (géré par d'autres outils)
2. Rapports pour les promoteurs (usage interne uniquement)
3. Gestion des finances (erreur de la V1)
4. Type de carrelage dans l'app (documents suffisent)
5. Documents au niveau chantier/plot (stockés ailleurs)
6. Notes au niveau chantier/plot/étage (géré de tête)
7. Mode hors ligne (toujours connecté)
8. Ordre imposé des tâches (confiance au professionnel)
9. Gestion de qui fait quoi / attribution de tâches (pas le but)

### MVP Success Criteria

- Bruno utilise posePilot quotidiennement de sa propre initiative
- Le premier réflexe lors d'une discussion chantier est d'ouvrir l'app
- Accès à un lot en moins de 10 secondes (chantier complet)
- Zéro retour aux méthodes "de tête" ou V1
- Réduction visible des oublis et des commandes en double
- Les besoins terrain sont systématiquement tracés dans l'app, plus rien ne se perd
- Le suivi des livraisons (chantiers légers et complets) est la référence pour savoir ce qui a été commandé et ce qui est arrivé

### Future Vision

Si posePilot s'avère être un succès au sein de l'équipe, des évolutions possibles à long terme pourraient inclure :
- Adaptation pour d'autres corps de métier du bâtiment
- Tableaux de bord statistiques (durée moyenne par lot, productivité par chantier)
- Export de données pour facturation ou reporting
- Version web complémentaire pour la configuration bureau
- Intégrations avec des fournisseurs pour automatiser les commandes
