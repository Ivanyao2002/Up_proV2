# Architecture — Feature-Based

L'architecture **Feature-Based** repose sur une règle simple :
**tout ce qui concerne une fonctionnalité vit ensemble**.

Avec l'architecture Feature-Based, tout est colocalisé dans un même dossier :

```
✅ Architecture Feature-Based — tout au même endroit
src/features/invoices/
├── components/    ← composants UI de la feature
├── hooks/         ← logique métier
├── store/         ← état local
├── pages/         ← pages React
└── utils/         ← helpers spécifiques
```

### Les trois niveaux d'organisation

L'architecture s'organise en **trois couches imbriquées** :

```
src/
│
├── core/        Niveau 1 — Infrastructure technique
│               Ce qui est purement technique et sans logique métier.
│               (client HTTP, auth, gestion d'erreurs)
│               Personne ne modifie core/ au quotidien.
│
├── shared/      Niveau 2 — Ressources partagées entre features
│               Composants, hooks et utilitaires utilisés
│               par PLUSIEURS features.
│               Règle : un fichier n'entre ici que s'il est réellement
│               réutilisé (au moins 2 features).
│
└── features/    Niveau 3 — Features autonomes
                Une feature = une fonctionnalité complète.
                Tout ce qui concerne une feature vit dans son dossier.
                Les features ne s'importent pas entre elles.
```

## 1. Couche `core/` — Infrastructure globale

La couche `core/` contient tout ce qui est **technique et indépendant du
métier**. Elle ne sait pas ce qu'est une feature — elle
sait gérer le HTTP, les tokens JWT et les erreurs. Les développeurs
n'ont quasiment jamais à modifier ces fichiers une fois en place.

### 1.1 Client HTTP (`core/http/`)

**Pourquoi une instance centralisée ?**

Si chaque feature créait son propre `axios.create()`, on devrait répliquer
la `baseURL`, les headers et les intercepteurs dans chaque fichier. Une
modification (changer l'URL de l'API, ajouter un header global) impacterait
des dizaines de fichiers.

### 1.2 Intercepteurs HTTP

Les intercepteurs sont des **middlewares HTTP** : ils s'exécutent
automatiquement avant chaque requête envoyée ou après chaque réponse reçue.

#### Intercepteur de requête — `http/interceptors/request.js`

#### Intercepteur de réponse — `http/interceptors/response.js`

## 2. Couche `shared/` — Ressources partagées

Le `shared/` contient tout ce qui est **partagé entre plusieurs features**.
C'est la zone intermédiaire entre `core/` (technique pur) et `features/`
(local à une feature).

### Règle d'entrée dans `shared/`

Un fichier rejoint `shared/` uniquement s'il est utilisé par
**au moins deux features différentes**. Si un composant n'est utilisé
que dans **une seule feature**, il reste dans `<ma-feature>/components/`.

```
Question à se poser avant de créer un fichier :

  "Ce composant / hook / utilitaire sera-t-il utilisé dans
   au moins 2 features différentes ?"

  Oui → src/shared/
  Non → src/features/<ma-feature>/
```

## 3. Couche `features/` — Features autonomes

Une **feature** est une unité fonctionnelle complète. Elle contient tout
ce dont elle a besoin : ses composants, sa logique, ses appels API, ses
tests et ses données de test.

**Règle fondamentale : les features ne s'importent pas entre elles.**

### Anatomie d'une feature

Chaque feature suit la même structure interne, ce qui rend le projet
**prévisible** : un développeur qui connaît `<feature-A>/` comprend
immédiatement `<feature-B>/`.

```
feature-name/
│
├── api/              Toute la communication réseau de la feature
│   ├── queries/      Opérations de lecture (GET)
│   └── mutations/    Opérations d'écriture (POST, PUT, PATCH, DELETE)
│
├── components/       Composants UI locaux à la feature
├── pages/            Pages React (assemblent les composants)
├── hooks/            Logique métier encapsulée
├── store/            État local (pagination, sélection, filtres…)
├── routes/           Définition des routes React Router
├── guards/           Protection d'accès (vérification des permissions)
├── utils/            Fonctions utilitaires locales à la feature
├── schemas/          Schémas de validation Zod
├── constants/        Constantes métier
└── index.js          Seuls exports publics de la feature
```

## 4. Règles d'imports et dépendances

### Le principe fondamental

Les dépendances vont **du général vers le spécifique**, jamais l'inverse.

```
core/       ← peut être importé par tout le monde
   ↑
shared/     ← peut importer depuis core/ uniquement
   ↑
features/   ← peut importer depuis core/ et shared/
              NE PEUT PAS importer depuis une autre feature
```

## 5. Guide de contribution — Comment ajouter une feature

### Checklist nouvelle feature

Exemple : ajout d'une feature `souscription/`

```
Création de la structure
────────────────────────
□  Créer src/features/souscription/ avec tous les sous-dossiers
□  Créer src/features/souscription/index.js (vide au départ)

Constantes et schema
────────────────────────
□  Écrire les constantes dans constants/souscription.constants.js
□  Écrire les schémas Zod dans schemas/souscription.schema.js

Couche API
──────────
□  Implémenter les queries (api/queries/)
□  Implémenter les mutations (api/mutations/)

Logique métier
──────────────
□  Créer les hooks (hooks/)
□  Créer le store si état local nécessaire (store/)

Interface utilisateur
─────────────────────
□  Créer les composants (components/)
□  Créer les pages (pages/)
□  Configurer les routes (routes/souscription.routes.jsx)
□  Créer les guards si permissions spécifiques (guards/)

Intégration
───────────
□  Exporter via index.js
□  Enregistrer les routes dans App.jsx
```
