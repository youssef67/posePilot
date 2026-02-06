---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Outil mobile de gestion de chantier carrelage/faïence'
session_goals: 'Vision complète des fonctionnalités + Organisation optimale interface mobile'
selected_approach: 'ai-recommended'
techniques_used: ['Role Playing', 'Morphological Analysis', 'SCAMPER Method']
ideas_generated: 74
context_file: '_bmad/bmm/data/project-context-template.md'
session_active: false
workflow_completed: true
facilitation_notes: 'Utilisateur très pragmatique, orienté terrain. Excellente capacité à recadrer les propositions trop ambitieuses. Philosophie claire: simplicité > fonctionnalités.'
---

# Brainstorming Session Results

**Facilitateur:** Youssef
**Date:** 2026-02-05
**Projet:** posePilot - Outil mobile de gestion de chantier carrelage/faïence

## Session Overview

**Sujet:** Outil mobile de gestion de chantier pour entreprise de pose de carrelage/faïence
**Objectifs:** Vision complète et détaillée de toutes les fonctionnalités + Organisation optimale de l'interface mobile

### Contexte Projet

- **Domaine :** Pose de revêtements en dur (carrelage, faïence) pour promoteurs immobiliers
- **Utilisateurs :** 2-3 personnes terrain (smartphone)
- **Structure :** Chantier → Plot(s) (nommés) → Étages → Lots/Appartements → Pièces/Tâches
- **Contraintes :** Mobile-first, usage chantier (froid, rapidité), navigation ultra-intuitive
- **V1 existante :** Outil surchargé avec fonctionnalités parasites (finances, etc.) - à repenser entièrement

### Contexte métier

- Travail exclusivement avec des promoteurs immobiliers (B2B)
- Chantiers pouvant durer plusieurs mois
- Chantiers avec ou sans TMA (Travaux Modificatifs Acquéreurs)
- Chantiers avec ou sans fiches de choix (choix proposés par le promoteur sans surcoût)
- Différents corps de métier interviennent sur le même chantier
- Le maître d'ouvrage est l'interlocuteur principal pour les problèmes hors responsabilité

### Configuration Session

- **Approche :** Recommandation IA
- **Phase 1 :** Role Playing (collaborative) - Exploration des perspectives utilisateur
- **Phase 2 :** Morphological Analysis (deep) - Cartographie systématique des fonctionnalités
- **Phase 3 :** SCAMPER Method (structured) - Optimisation mobile et raffinement

---

## Technique Execution Results

### Phase 1 : Role Playing

**Personas explorés :**
- Youssef arrivant sur le chantier à 7h30 (accès rapide, visite d'appartement)
- L'utilisateur en tournée de visite (validation tâches, notes, photos)
- L'utilisateur gérant une livraison
- L'utilisateur configurant un nouveau chantier au bureau
- Le collègue moins à l'aise avec la technologie

**Découvertes clés :**
- Le parcours V1 nécessite 7+ étapes pour accéder à un lot - inacceptable
- La visite suit un flux physique pièce par pièce
- Les photos sont essentielles pour communiquer avec le maître d'ouvrage
- La configuration initiale se fait au bureau, pas sur le terrain
- L'inventaire matériel est un besoin fort mais souvent négligé

### Phase 2 : Morphological Analysis

**Matrice fonctionnalités × niveaux structurels :**

|                        | Chantier     | Plot         | Étage          | Lot           | Pièce        |
|------------------------|--------------|--------------|----------------|---------------|--------------|
| **Avancement**         | Agrégé       | Agrégé       | Agrégé         | Central       | Tâches       |
| **Commandes/Livraisons** | -          | Clé          | -              | TMA seulement | -            |
| **Inventaire**         | Consolidé    | Agrégé       | Localisation   | -             | -            |
| **Documents**          | -            | -            | -              | PDF           | -            |
| **Notes/Problèmes**   | -            | -            | -              | Oui + photos  | Oui          |
| **Plinthes/Métrés**    | -            | Agrégé       | -              | Agrégé        | Saisie       |
| **Configuration**      | Nom          | Tâches+Var.  | Identifiant    | Code+Var+Flags| Héritée      |

**Découvertes clés :**
- Beaucoup de cases volontairement vides = app focalisée
- L'inventaire a besoin de localisation (plot + étage) avec agrégation vers le haut
- Les documents ne sont pertinents qu'au niveau lot
- Les notes/problèmes n'ont de sens qu'au niveau lot et pièce

### Phase 3 : SCAMPER

| Lense | Résultat |
|-------|----------|
| **Substituer** | Pas de gestes cachés (swipe statut) → boutons clairs |
| **Combiner** | Écran pièce tout-en-un (tâches + notes + photos) |
| **Adapter** | Swipe entre pièces uniquement (navigation, pas action) |
| **Modifier** | Thème clair/sombre + éléments tactiles surdimensionnés |
| **Put to use** | Indicateurs intelligents (lots prêts à carreler, matériel suffisant) |
| **Éliminer** | 9 fonctionnalités exclues consciemment |
| **Reverse** | Fil "quoi de neuf" entre collègues |

---

## Inventaire complet des 66 idées

### Thème 1 : Navigation & Architecture de l'app

| # | Idée | Description | Priorité |
|---|------|-------------|----------|
| #1 | Accès express au lot | 2-3 taps max pour accéder à n'importe quel lot (vs 7+ en V1) | Fondamental |
| #39 | Écran d'accueil = chantiers + % | Ouvrir l'app → voir tous les chantiers actifs avec avancement | Fondamental |
| #31 | Vue hybride grille + filtres + recherche | Option C : grille de cartes + filtres (Tous/En cours/Terminés/Alertes) + recherche | Fondamental |
| #30 | Recherche rapide par numéro | Barre de recherche toujours accessible pour accès direct par numéro de lot | Fondamental |
| #4 | Vue étage visuelle | Sélectionner un étage → voir tous les lots avec indicateur d'avancement | Fondamental |
| #56 | Vue lot = grille de cartes pièces | Entrer dans un lot → voir toutes les pièces en cartes avec mini avancement | Fondamental |
| #58 | Swipe entre les pièces | Une fois dans une pièce, swipe gauche/droite pour la suivante/précédente | Important |
| #59 | Liberté d'entrée + fluidité | Choisir par quelle pièce commencer (tap) puis enchaîner par swipe | Important |
| #15 | Flux de visite naturel | L'app reflète le mouvement physique dans l'appartement | Important |
| #38 | Avancement agrégé tous niveaux | % remonte auto : pièce → lot → étage → plot → chantier | Fondamental |

**Flux de navigation validé :**
```
Accueil (liste chantiers avec %)
  → Chantier (liste plots)
    → Plot (liste étages)
      → Étage (grille cartes lots avec % + filtres + recherche)
        → Lot (grille cartes pièces avec %)
          → Pièce (écran unique : tâches + notes + photos)
              ↔ Swipe entre pièces
```

### Thème 2 : Suivi d'avancement & Tâches

| # | Idée | Description | Priorité |
|---|------|-------------|----------|
| #8 | Tâches configurables par plot | Chaque plot a son propre jeu de tâches modifiable | Fondamental |
| #16 | Trois statuts par tâche | Pas commencé → En cours → Fait | Fondamental |
| #17 | Cycle de tap pour statut | Un tap fait tourner le statut. Code couleur : gris → orange → vert | Fondamental |
| #9 | Avancement multi-tâches par pièce | Chaque pièce a ses tâches, % calculé automatiquement | Fondamental |
| #5 | Affichage "X faits, Y en cours" | Pas de pourcentage flou - compteur clair à deux chiffres | Fondamental |
| #57 | Écran pièce tout-en-un | Tâches en haut + boutons note/photo au milieu + historique notes en bas | Fondamental |
| #12 | Validation rapide - un tap | Un seul tap pour valider une tâche, pas de formulaire | Fondamental |
| #6 | Périmètre variable par chantier | Chaque chantier définit quelles pièces sont dans le scope | Important |
| #3 | Vue d'avancement global | Vision d'ensemble : combien en cours, combien finalisés | Important |

**Tâches types identifiées (configurables) :** Ragréage, Isolation phonique, Pose carrelage, Plinthes, Joints, Silicone (et toute autre tâche spécifique au plot).

| #74 | Tâches ajustables par lot individuel | Les tâches héritent de la variante mais on peut ajouter une tâche spécifique à un lot particulier | Important |

**Pattern d'héritage unifié (tâches, pièces, documents) :** Définis dans la variante → hérités par les lots → ajustables individuellement par lot. Toujours la même logique partout.

### Thème 3 : Configuration & Structure de données

| # | Idée | Description | Priorité |
|---|------|-------------|----------|
| #34 | Template d'appartement par plot | Définir une fois la composition standard (pièces + tâches), tous les lots héritent | Fondamental |
| #36 | Variantes d'appartement | Plusieurs types par plot (Type A = SDB + WC séparé, Type B = SDB/WC combiné, etc.) | Fondamental |
| #35 | Création guidée au bureau | Flux étape par étape : chantier → plot → tâches → variantes → lots | Important |
| #37 | Code de lot libre | Pas de format imposé pour les identifiants de lot | Fondamental |
| #51 | Flag TMA sur le lot | Seuls les lots TMA sont marqués (les fiches de choix concernent tout le chantier) | Important |
| #53 | Étage = identifiant libre | Simple nom/numéro saisi librement (RDC, 1, 2, Combles...) | Simple |
| #11 | Modification TMA en cours de route | Pouvoir modifier le périmètre d'un lot même après démarrage du chantier | Important |

**Flux de configuration :**
```
1. Créer le chantier (nom)
2. Ajouter un plot (nom)
3. Définir les tâches du plot (ragréage, phonique, pose, plinthes, joints, silicone...)
4. Créer les variantes d'appartement (Type A, Type B...)
5. Créer les lots avec code libre + assigner variante + étage
6. Marquer les lots TMA et ajuster individuellement si besoin
```

### Thème 4 : Matériel, Livraisons & Inventaire

| # | Idée | Description | Priorité |
|---|------|-------------|----------|
| #40 | Suivi commandes au niveau plot | Tracer : date, fournisseur, quoi, statut (commandé → livré) | Fondamental |
| #18 | Validation livraison plot ou lot | Standard = par plot, TMA = par lot | Fondamental |
| #42 | Inventaire localisé + agrégation | Saisir quoi + quantité + où (plot + étage). Agrégation auto vers le haut | Fondamental |
| #23 | Ajustement rapide quantités | +/- pour modifier, tap pour supprimer. 3 secondes pour mettre à jour | Fondamental |
| #21 | Inventaire par chantier | Vision globale de tout le matériel présent sur le chantier | Fondamental |
| #43 | Saisie inventaire en marchant | L'app pré-remplit la localisation selon la navigation actuelle | Important |
| #19 | Date de livraison prévue | Enregistrer une date attendue par commande | Important |
| #41 | Livraison lot uniquement TMA | Le suivi descend au lot seulement pour les TMA | Important |
| #26 | Commandes liées à l'avancement | L'app donne la visibilité, le pro décide quand commander | Secondaire |
| #22 | Lien surplus → commandes | Consulter l'inventaire avant de commander pour éviter les doublons | Secondaire |
| #20 | Dispatch matériel post-livraison | Indiquer où le matériel a été dispatché après livraison | Secondaire |

### Thème 5 : Notes, Problèmes & Collaboration

| # | Idée | Description | Priorité |
|---|------|-------------|----------|
| #2 | Signalement de blocage | Texte libre + flag "bloquant" sur un lot. Pas de catégorisation rigide | Fondamental |
| #13 | Note avec photo intégrée | Prendre une photo depuis l'app, attachée à la note et à la pièce | Fondamental |
| #14 | Partage photo contextualisé | Envoyer la photo au maître d'ouvrage avec contexte auto (chantier/lot/pièce) | Important |
| #64 | Fil "quoi de neuf" | Voir les modifications des collègues depuis la dernière visite | Secondaire |
| #65 | Notification discrète | Indicateur discret sur l'accueil, jamais de popup intrusive | Secondaire |

**Traçabilité :** Chaque note enregistre l'auteur (qui a écrit) pour le suivi multi-utilisateur.

### Thème 6 : Documents, Métrés & Plinthes

| # | Idée | Description | Priorité |
|---|------|-------------|----------|
| #24 | Documents PDF par lot | Upload, visualisation, remplacement, téléchargement | Fondamental |
| #66 | Bons de commande fournisseurs | Rattacher les bons de commande au lot concerné | Fondamental |
| #46 | Métrés par pièce (optionnel) | m² par pièce pour calcul de commande. Non bloquant si non renseigné | Important |
| #47 | ML plinthes par pièce (optionnel) | Mètres linéaires par pièce. Non bloquant si non renseigné | Important |
| #48 | Agrégation métrés et ML par plot | Total auto pour aide à la commande | Important |
| #25 | Suivi plinthes | Commandées ou façonnées chez fournisseur. ML par appartement | Important |
| #28 | Métrés pour calcul commande | Croiser métrés avec inventaire pour commander la bonne quantité | Important |

**Types de documents par lot :** Personnalisables par l'utilisateur (ex: plans de pose, fiches de choix, documents TMA, bons de commande fournisseurs, etc.)

| # | Idée | Description | Priorité |
|---|------|-------------|----------|
| #67 | Types de documents personnalisables | L'utilisateur définit les noms des documents attendus - pas de liste figée | Fondamental |
| #68 | Documents obligatoires / optionnels | Certains documents peuvent être marqués obligatoires - le lot ne devrait pas être démarré sans | Fondamental |
| #69 | Récap des documents manquants | Vue dédiée listant tous les lots avec documents obligatoires manquants | Important |
| #70 | Indicateur visuel document incomplet | Sur la carte du lot, signal si des documents obligatoires manquent | Important |

**Règles documentaires :**

| # | Idée | Description | Priorité |
|---|------|-------------|----------|
| #71 | Documents obligatoires en couches cumulatives | Base (tous les lots) + TMA (en supplément). Les exigences se cumulent | Important |
| #72 | Flexibilité totale - zéro par défaut | Aucun document requis par défaut. Zéro, libre, obligatoire ou mix = tout est valide. L'utilisateur choisit son niveau de rigueur | Fondamental |

| #73 | Documents dans le template de variante | Définir une liste de documents par défaut dans la variante. Chaque lot hérite et peut ajouter des docs supplémentaires | Fondamental |

**Principe d'héritage unifié (tâches, pièces, documents) :**
- Définis dans le template/variante → hérités automatiquement par les lots → ajustables individuellement par lot
- Par défaut, rien n'est imposé - un chantier peut fonctionner avec zéro document
- Les exigences se cumulent : base (variante) + spécifiques (lot) + TMA (si applicable)

### Thème 7 : Principes UX & Design

| # | Principe | Impact |
|---|---------|--------|
| #33 | **Focus unique** : suivi de chantier, rien d'autre | Architecture |
| #32 | **Simplicité absolue** : test du collègue non-tech | Toutes les interfaces |
| #55 | **Rapidité ≠ sacrifier la clarté** : boutons visibles, pas de gestes cachés | Interactions |
| #10 | **Confiance au professionnel** : zéro contrainte d'ordre sur les tâches | Suivi tâches |
| #50 | **Champs optionnels, jamais bloquants** | Formulaires |
| #52 | **L'app marque, les documents détaillent** | TMA, fiches de choix |
| #61 | **Éléments tactiles surdimensionnés** | Design mobile |
| #60 | **Thème clair/sombre** avec mémorisation du choix | Design mobile |
| #27 | **App légère** pour réseau variable (3G en zone rurale) | Architecture technique |
| #44 | **Documents uniquement au niveau lot** | Périmètre |
| #45 | **Notes uniquement au niveau lot/pièce** | Périmètre |
| #62 | **Indicateurs intelligents** automatiques (lots prêts, matériel suffisant) | Aide à la décision |

### Liste d'exclusion (Thème 7 - #63)

Fonctionnalités consciemment éliminées :

1. Gestion du planning (géré par d'autres outils)
2. Rapports pour les promoteurs (usage interne uniquement)
3. Gestion des finances (erreur de la V1)
4. Type de carrelage dans l'app (documents suffisent)
5. Documents au niveau chantier/plot (stockés ailleurs)
6. Notes au niveau chantier/plot/étage (géré de tête)
7. Mode hors ligne (toujours connecté)
8. Ordre imposé des tâches (confiance au professionnel)
9. Gestion de qui fait quoi (pas le but de l'app)

---

## Prioritisation

### P1 - Critique (sans ça, pas d'app)

**Suivi d'avancement :** Tâches configurables (#8), 3 statuts (#16), tap rapide (#17), écran pièce tout-en-un (#57), affichage X faits / Y en cours (#5), avancement agrégé (#38).

**Navigation :** Accès express 2-3 taps (#1), écran d'accueil chantiers (#39), vue étage en grille (#4, #31), vue lot en cartes pièces (#56), recherche rapide (#30).

**Configuration :** Templates par plot (#34), variantes (#36), code lot libre (#37).

### P2 - Important (valeur forte, implémentation phase 2)

**Blocages & Notes :** Signalement blocage (#2), notes avec photo (#13), partage contextualisé (#14).

**Documents :** PDF par lot (#24), bons de commande (#66).

**Matériel :** Suivi commandes (#40), validation livraison (#18), inventaire localisé (#42), ajustement rapide (#23).

**UX :** Swipe entre pièces (#58, #59), thème clair/sombre (#60), éléments tactiles grands (#61).

### P3 - Secondaire (valeur ajoutée, implémentation phase 3)

Fil "quoi de neuf" (#64), indicateurs intelligents (#62), dispatch matériel (#20), lien surplus-commandes (#22), métrés et plinthes détaillés (#46, #47, #48, #25).

---

## Prochaines étapes recommandées

1. **Créer le Product Brief** : Formaliser la vision produit à partir de cette session (workflow [CB] disponible)
2. **Définir le PRD** : Transformer les idées priorisées en exigences détaillées
3. **Concevoir les wireframes mobiles** : Matérialiser le flux de navigation validé
4. **Valider avec le collègue** : Tester les concepts UX avec l'utilisateur non-tech

---

## Session Insights

### Philosophie produit découverte

> **"Un outil qui suit le professionnel sur le terrain, pas un logiciel qui le dirige depuis le bureau."**

Chaque décision renforce ce principe : l'app informe sans imposer, s'adapte au réel sans le contraindre, est rapide sans être risquée.

### Pépite de la session

La navigation swipe entre les pièces d'un appartement - un flux qui mime le parcours physique, naturel et fluide, exactement comme marcher d'une pièce à l'autre.

### Forces créatives de l'utilisateur

- Excellente capacité à recadrer les propositions trop ambitieuses (swipe statut → non, type carrelage → overkill)
- Vision très pragmatique ancrée dans le réel du terrain
- Pensée en couches : accepte la complexité structurelle (chantier → plot → étage → lot → pièce) tout en exigeant la simplicité d'usage

### Creative Facilitation Narrative

Session riche et productive menée avec un utilisateur qui connaît intimement son métier. La technique du Role Playing a permis de vivre le quotidien terrain et de découvrir les vrais irritants (7 taps pour accéder à un lot !). L'Analyse Morphologique a révélé que beaucoup de croisements fonctionnalité/niveau sont volontairement vides - signe d'une app focalisée. Le SCAMPER a affiné l'UX mobile avec des choix forts (pas de gestes cachés, boutons clairs, thème adaptatif) et a fait émerger le concept de "quoi de neuf" entre collègues.
