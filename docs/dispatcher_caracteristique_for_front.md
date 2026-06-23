# Demande backend — Caractéristiques dispatch & moyens de paiement (backoffice)

> **Document de transmission équipe API / IA backend**  
> **Projet** : UpJunoo Pro — backoffice admin (`Up_prov2`)  
> **Date** : 2 juin 2026  
> **Objectif** : obtenir la **liste exhaustive**, les **schémas JSON** et les **routes CRUD** de tout ce qui est configurable côté **moteur de dispatch** et côté **moyens de paiement**, afin que le backoffice puisse **lire, modifier et auditer** ces paramètres sans redeployer le front ni le backend.

---

## Contexte côté front (état actuel)

| Zone | Fichiers / routes front | API branchée aujourd’hui | Limite |
|------|-------------------------|---------------------------|--------|
| Règles dispatch (mock) | `DispatchRulesPage`, `DispatchRulesForm` | `GET/PUT /admin/settings/dispatch-rules` (legacy mock) | 6 champs seulement, pas de v1 |
| Config dispatch réelle | Non branchée | `GET/PUT /v1/admin/dispatch-config`, `PATCH …/countries/{countryCode}` | **Schéma `document` non documenté** dans Swagger |
| Defaults dispatch | Non branchée | `GET /v1/dispatch/config/defaults` | Fallback code, non exposé en UI |
| Comptes dispatchers | `DispatchersListPage`, `DispatcherForm` | `GET/POST/PATCH /v1/admin/dispatchers` | Partiellement intégré |
| Console dispatch | `DispatchConsolePage` | Legacy `/admin/ops/dispatch` | Pas la vraie API dispatch v1 |
| Moyens de paiement | Listes hardcodées (`cash`, `wallet`, `card`, `orange_money`) | `GET /v1/catalog/payment-methods` (lecture seule) | **Aucune admin CRUD** |
| PayDunya | Page intégrations | `GET/PATCH /v1/admin/paydunya-config` | Canaux séparés du catalogue paiement |

**Constat** : le Swagger décrit le comportement dispatch en prose (*« Vagues 2→4→6→8 km · offre 120 s · intervalle vague 120 s »*) mais **ne fournit pas le contrat JSON** permettant au backoffice de tout piloter.

---

## Demande générale à l’équipe backend

Merci de fournir pour **chaque paramètre** listé ci-dessous :

1. **Nom du champ** (camelCase JSON), **type**, **unité**, **valeur par défaut**, **min / max**, **nullable ou non**
2. **Périmètre d’application** : `global` | `country` | `city` | `franchise` | `partner` | `zone` | `serviceType`
3. **Priorité de fusion** (ex. global ← pays ← ville ← franchise ← partenaire)
4. **Route(s)** : lecture + écriture (GET, PUT, PATCH) + **exemple de réponse 200 complète**
5. **Règles métier** (ex. « si `offerTtlSec` < 30, refuser la sauvegarde »)
6. **Événement d’audit** émis à chaque modification (`audit-log`)
7. Indication si le paramètre est **utilisé en temps réel** ou nécessite un **redémarrage / cache flush**

Format de réponse attendu : **un seul document JSON versionné** (`schemaVersion`) aligné sur le pattern déjà utilisé pour `paydunya-config`, `weather-config`, `dispatch-config`.

---

## DISPATCH-CONF-01 — Document `dispatch.config` complet

### Routes existantes (à documenter + compléter)

| Méthode | Route | Usage backoffice |
|---------|-------|------------------|
| `GET` | `/v1/admin/dispatch-config?countryCode=CI` | Lire config fusionnée (global + override pays) |
| `PUT` | `/v1/admin/dispatch-config` | Remplacer le document global |
| `PATCH` | `/v1/admin/dispatch-config/countries/{countryCode}` | Override par pays (CI, SN, BF, ML…) |
| `GET` | `/v1/dispatch/config/defaults` | Valeurs fallback (lecture seule, pour afficher les défauts code) |

### Routes supplémentaires demandées

| Méthode | Route | Besoin |
|---------|-------|--------|
| `PATCH` | `/v1/admin/dispatch-config/franchises/{franchiseId}` | Override franchise |
| `PATCH` | `/v1/admin/dispatch-config/partners/{partnerId}` | Override partenaire |
| `PATCH` | `/v1/admin/dispatch-config/cities/{cityId}` | Override ville |
| `PATCH` | `/v1/admin/dispatch-config/zones/{zoneId}` | Override zone (surge + rayon) |
| `PATCH` | `/v1/admin/dispatch-config/service-types/{serviceType}` | Override par service (`RIDE`, `DELIVERY`, …) |
| `GET` | `/v1/admin/dispatch-config/effective?countryCode=&cityId=&franchiseId=&partnerId=&serviceType=` | **Preview** de la config résolue (debug admin) |
| `POST` | `/v1/admin/dispatch-config/simulate` | Simuler une course (position, service, paiement) → candidats + vagues |

---

## DISPATCH-PARAMS-01 — Paramètres configurables du moteur de dispatch

> **Merci de confirmer lesquels existent déjà**, lesquels sont en dur dans le code, et lesquels peuvent être exposés.

### A. Vagues & offres (cœur moteur)

| Paramètre suggéré | Description | Exemple actuel (doc Swagger) |
|-------------------|-------------|------------------------------|
| `waveRadiiKm` | Rayons successifs des vagues (km), ordre croissant | `[2, 4, 6, 8]` |
| `waveIntervalSec` | Délai entre deux vagues (secondes) | `120` |
| `offerTtlSec` | Durée de validité d’une offre chauffeur (secondes) | `120` |
| `maxWaves` | Nombre max de vagues avant échec / escalade | ? |
| `maxDispatchDurationSec` | Durée max totale d’un dispatch avant timeout global | ? |
| `maxOffersPerDriver` | Nombre max d’offres simultanées par chauffeur | ? |
| `maxRejectionsBeforeCooldown` | Refus avant mise en cooldown chauffeur | ? |
| `rejectionCooldownSec` | Durée du cooldown après refus répétés | ? |
| `offerMode` | `sequential` \| `broadcast` \| `batch` | ? |
| `batchSize` | Taille d’un lot d’offres en mode batch | ? |

### B. Matching & priorité chauffeur

| Paramètre suggéré | Description | Déjà dans le front mock |
|-------------------|-------------|-------------------------|
| `matchRadiusKm` | Rayon initial de recherche (km) | Oui (`match_radius_km`) |
| `assignTimeoutSec` | Timeout assignation manuelle / auto | Oui (`assign_timeout_sec`) |
| `priorityMode` | `distance` \| `rating` \| `balanced` | Oui (`priority_mode`) |
| `minDriverRating` | Note minimale pour être éligible | Non |
| `maxDriverActiveTrips` | Courses simultanées max | Non |
| `requireVehicleCategoryMatch` | Filtrer par catégorie véhicule / ride category | Non |
| `requirePaymentMethodSupport` | Filtrer chauffeurs selon moyen de paiement accepté | Non |
| `excludeOfflineDrivers` | Exclure chauffeurs hors ligne | Non |
| `excludeBusyDrivers` | Exclure chauffeurs en course | Non |
| `distanceWeight` / `ratingWeight` | Poids du score en mode `balanced` | Non |
| `maxCandidatesReturned` | Nb max de candidats renvoyés à la console | Non |

### C. File d’attente & réassignation

| Paramètre suggéré | Description | Déjà dans le front mock |
|-------------------|-------------|-------------------------|
| `maxQueueSize` | Taille max file d’attente dispatch | Oui (`max_queue_size`) |
| `autoReassign` | Réassignation auto si timeout offre | Oui (`auto_reassign`) |
| `reassignMaxAttempts` | Nombre max de tentatives | Non |
| `reassignDelaySec` | Délai entre deux réassignations | Non |
| `escalationAction` | `expand_radius` \| `notify_dispatcher` \| `cancel` \| `surge` | Non |

### D. Périmètre géographique & zones

| Paramètre suggéré | Description | Déjà dans le front mock |
|-------------------|-------------|-------------------------|
| `activeZoneIds` | Zones où le dispatch auto est actif | Oui (`active_zone_ids`) |
| `zoneOverrides` | Par zone : `{ radiusKm, surgeMultiplier, enabled }` | Partiel (surge en UI zones) |
| `crossZoneAssignAllowed` | Autoriser assignation hors zone | Non |
| `countryCode` | Contexte pays pour fusion config | Query existante |

### E. Services & typologie de commande

| Paramètre suggéré | Description |
|-------------------|-------------|
| `enabledServiceTypes` | `RIDE`, `DELIVERY`, `DELIVERY_CARGO`, `FREIGHT`, `RENTAL` |
| `autoStartDispatchOnCreate` | Lancer le dispatch à la création commande |
| `manualDispatchAllowed` | Autoriser démarrage manuel (`POST …/dispatch/.../start`) |
| `perServiceOverrides` | Sous-document par `serviceType` (rayons, TTL, priorité) |

---

## DISPATCH-ZONES-SERVICES-01 — Explication : « Zones actives et services »

> Section du formulaire backoffice : `DispatchRulesForm` → bloc **« Zones actives et services »**  
> Sous-titre UI : *« Zones où le dispatch auto est actif + services autorisés. »*

Cette section définit **où** le moteur de dispatch automatique peut tourner (périmètre géographique) et **quels types de commandes** il est autorisé à traiter. Ce sont deux filtres **indépendants mais cumulatifs** : une commande n’est dispatchée automatiquement que si **les deux conditions** sont remplies.

### Vue d’ensemble

```
Commande créée
      │
      ▼
┌─────────────────────────────────────┐
│ 1. Type de service autorisé ?       │  ← enabledServiceTypes
│    (RIDE, DELIVERY, …)              │
└──────────────┬──────────────────────┘
               │ oui
               ▼
┌─────────────────────────────────────┐
│ 2. Zone de prise en charge active ? │  ← activeZoneIds
│    (point pickup ∈ zone cochée)     │
└──────────────┬──────────────────────┘
               │ oui
               ▼
      Dispatch auto démarre
      (si autoStartDispatchOnCreate = true)
```

Si l’une des deux conditions échoue, le dispatch automatique **ne démarre pas** pour cette commande (sauf dispatch manuel si `manualDispatchAllowed` est activé).

---

### 1. Zones actives (`activeZoneIds` / `active_zone_ids`)

#### Rôle métier

Une **zone** est un découpage géographique du réseau (quartier, commune, aéroport, etc.), rattachée à une ville et une franchise. La liste affichée dans le formulaire provient du catalogue zones (`GET /v1/admin/zones` ou équivalent).

Cocher une zone signifie : **le dispatch automatique est autorisé pour les commandes dont le point de prise en charge (pickup) se situe dans cette zone**.

| État zone | Comportement attendu |
|-----------|----------------------|
| **Cochée** (`id` présent dans `active_zone_ids`) | Le moteur peut lancer vagues, offres et matching pour les courses/deliveries démarrant dans cette zone |
| **Décochée** | Aucun dispatch auto dans cette zone ; la commande reste en attente ou passe en file / dispatch manuel |
| **Aucune zone cochée** | Comportement à confirmer backend — le front autorise la sauvegarde mais le dispatch auto est probablement **désactivé partout** |

#### Champs API

| Champ JSON (camelCase) | Alias snake_case (front actuel) | Type | Description |
|------------------------|----------------------------------|------|-------------|
| `activeZoneIds` | `active_zone_ids` | `string[]` (UUID) | IDs des zones où le dispatch auto est actif |
| `zoneOverrides` | `zone_overrides` | `Record<zoneId, ZoneOverride>` | Surcharges par zone (rayon, surge, enabled) |
| `crossZoneAssignAllowed` | `cross_zone_assign_allowed` | `boolean` | Autoriser l’assignation d’un chauffeur situé **hors** de la zone de la commande |

#### `zoneOverrides` (complément)

Pour chaque zone, le backend peut surcharger les paramètres globaux :

```json
{
  "zoneOverrides": {
    "uuid-zone-aeroport": {
      "enabled": true,
      "radiusKm": 5,
      "surgeMultiplier": 1.5
    }
  }
}
```

| Sous-champ | Effet |
|------------|-------|
| `enabled` | Active/désactive le dispatch pour cette zone **même si** elle est dans `activeZoneIds` (priorité à confirmer) |
| `radiusKm` | Rayon de matching spécifique à la zone |
| `surgeMultiplier` | Multiplicateur tarifaire zone (affiché en UI si > 1, ex. `×1.5`) |

> **Question backend** : si une zone est dans `activeZoneIds` mais `zoneOverrides[zoneId].enabled = false`, quelle règle prime ?

#### Lien avec `crossZoneAssignAllowed`

Paramètre voisin (section « Réassignation et file d’attente » du même formulaire) :

- **`crossZoneAssignAllowed = false`** (défaut) : seuls les chauffeurs **géolocalisés dans la zone active** de la commande sont candidats.
- **`crossZoneAssignAllowed = true`** : un chauffeur d’une zone voisine peut recevoir l’offre, utile en bordure de zone ou zones peu denses.

Ce n’est **pas** la même chose que « zone active » :
- **Zone active** = où les commandes **peuvent être dispatchées**.
- **Cross-zone** = d’où peuvent venir les **chauffeurs** candidats.

#### Exemple

Configuration :

```json
{
  "activeZoneIds": ["zone-cocody", "zone-plateau"],
  "crossZoneAssignAllowed": false,
  "enabledServiceTypes": ["RIDE", "DELIVERY"]
}
```

| Commande | Résultat |
|----------|----------|
| Course taxi, pickup Cocody | Dispatch auto OK |
| Livraison, pickup Plateau | Dispatch auto OK |
| Course taxi, pickup Yopougon (zone non cochée) | Pas de dispatch auto |
| Course taxi, pickup Cocody mais type `FREIGHT` | Pas de dispatch auto (service non autorisé) |

#### UI front (`DispatchRulesForm`)

- Liste de cases à cocher : une ligne par zone (`z.name`).
- Badge `×{surge}` si `z.surge_multiplier > 1`.
- Les IDs sont stockés tels quels (number ou string UUID selon la source API).

---

### 2. Services autorisés (`enabledServiceTypes` / `enabled_service_types`)

#### Rôle métier

Définit **quels types de commandes** le moteur de dispatch automatique est autorisé à traiter. Même si une commande est dans une zone active, elle ne sera pas dispatchée automatiquement si son `serviceType` n’est pas dans la liste.

#### Valeurs possibles

| Code API | Signification | App / usage |
|----------|---------------|-------------|
| `RIDE` | Course VTC / taxi | Transport passagers |
| `DELIVERY` | Livraison standard | Colis, repas, etc. |
| `DELIVERY_CARGO` | Livraison cargo / colis volumineux | Livraison marchandises |
| `FREIGHT` | Fret / transport lourd | Camions, palettes |
| `RENTAL` | Location véhicule avec chauffeur | Mise à disposition |

Valeurs par défaut côté front (`dispatchRules.service.ts`) :

```json
["RIDE", "DELIVERY", "DELIVERY_CARGO"]
```

`FREIGHT` et `RENTAL` sont **désactivés par défaut** — à activer explicitement si le réseau les propose.

#### Validation front

Au moins **un** service doit rester coché, sinon erreur à l’enregistrement :

> *« Sélectionnez au moins un service activé. »*

#### `perServiceOverrides` (complément)

Permet d’affiner les règles **par type de service** sans dupliquer toute la config :

```json
{
  "enabledServiceTypes": ["RIDE", "DELIVERY", "DELIVERY_CARGO"],
  "perServiceOverrides": {
    "DELIVERY": {
      "waveRadiiKm": [1, 2, 3, 5],
      "offerTtlSec": 90,
      "priorityMode": "distance"
    },
    "RIDE": {
      "waveRadiiKm": [2, 4, 6, 8],
      "priorityMode": "balanced"
    }
  }
}
```

Exemple métier : les livraisons peuvent avoir des **rayons de vague plus courts** et un **TTL d’offre plus court** que les courses taxi, car le client attend souvent moins longtemps.

> **État UI actuel** : `perServiceOverrides` est dans le type `DispatchRules` mais **pas encore exposé** dans le formulaire — à brancher quand le backend confirme le schéma.

---

### 3. Interaction avec les autres paramètres du formulaire

| Paramètre | Lien avec zones / services |
|-----------|----------------------------|
| `autoStartDispatchOnCreate` | Si `true`, le dispatch démarre à la création **uniquement** si zone + service OK |
| `manualDispatchAllowed` | Permet au dispatcher de forcer une assignation **hors** dispatch auto (zone inactive ou service désactivé) |
| `requireVehicleCategoryMatch` | Filtre chauffeurs **après** que zone et service ont validé l’éligibilité |
| `enabledServiceTypes` + catalogue paiement | Un service désactivé ici ne doit pas apparaître comme « auto-dispatchable » même si le moyen de paiement est actif |

---

### 4. Schéma JSON minimal (section zones + services)

```json
{
  "global": {
    "activeZoneIds": [
      "d80a0f88-fea5-41e4-8fb8-4e82a8a2758c-zone-cocody",
      "d80a0f88-fea5-41e4-8fb8-4e82a8a2758c-zone-plateau"
    ],
    "zoneOverrides": {
      "d80a0f88-fea5-41e4-8fb8-4e82a8a2758c-zone-aeroport": {
        "enabled": true,
        "radiusKm": 4,
        "surgeMultiplier": 1.3
      }
    },
    "crossZoneAssignAllowed": false,
    "enabledServiceTypes": ["RIDE", "DELIVERY", "DELIVERY_CARGO"],
    "perServiceOverrides": {
      "DELIVERY": {
        "waveRadiiKm": [1, 2, 3, 5],
        "priorityMode": "distance"
      }
    },
    "autoStartDispatchOnCreate": true,
    "manualDispatchAllowed": true
  }
}
```

---

### 5. Questions ouvertes pour le backend

| # | Question |
|---|----------|
| 1 | Comment déterminer la **zone d’une commande** ? Pickup GPS ? Adresse géocodée ? Ville seule ? |
| 2 | Si `activeZoneIds` est **vide**, le dispatch auto est-il global ou totalement bloqué ? |
| 3 | Priorité `activeZoneIds` vs `zoneOverrides[].enabled` ? |
| 4 | Un override **pays / franchise / partenaire** peut-il restreindre `enabledServiceTypes` localement ? |
| 5 | La route `PATCH …/dispatch-config/zones/{zoneId}` remplace-t-elle `zoneOverrides` ou fusionne-t-elle ? |
| 6 | Faut-il renvoyer les zones avec **libellé** (`{ id, name, city, surgeMultiplier }`) dans `GET dispatch-config` pour éviter un second appel catalogue ? |

---

### F. Console dispatch & rôle dispatcher (comptes)

| Paramètre suggéré | Description |
|-------------------|-------------|
| `consolePollIntervalSec` | Intervalle refresh console (front utilise 15 s) |
| `permissions.assignTrips` | Déjà sur fiche dispatcher |
| `permissions.viewLiveMap` | Déjà sur fiche dispatcher |
| `permissions.cancelTrip` | À ajouter ? |
| `permissions.overrideDispatch` | Forcer assignation hors règles |
| `permissions.adjustSurge` | Modifier surge depuis console |
| `shiftRequired` | Exiger un créneau horaire actif |
| `allowedFranchiseIds` / `allowedZoneIds` | Périmètre du dispatcher |

### G. Observabilité & exploitation

| Paramètre / route | Description |
|-------------------|-------------|
| `GET /v1/dispatch/{serviceType}/{orderId}/status` | Déjà existant — **documenter champs** (`wave`, `radiusKm`, `offerExpiresAt`, …) |
| `GET /v1/dispatch/{serviceType}/{orderId}/logs` | Journal audit — **documenter format lignes** |
| `POST /v1/dispatch/{serviceType}/{orderId}/retry` | Relance — paramètres optionnels body ? |
| WebSockets `dispatch:*` | Liste des événements + payload pour live map / console |

### H. Schéma JSON attendu (proposition front)

```json
{
  "status": "ok",
  "generatedAt": "2026-06-02T12:00:00.000Z",
  "settingKey": "dispatch.config",
  "schemaVersion": 1,
  "fromDatabase": true,
  "document": {
    "schemaVersion": 1,
    "global": {
      "waveRadiiKm": [2, 4, 6, 8],
      "waveIntervalSec": 120,
      "offerTtlSec": 120,
      "matchRadiusKm": 3,
      "assignTimeoutSec": 45,
      "maxQueueSize": 12,
      "priorityMode": "balanced",
      "autoReassign": true,
      "activeZoneIds": [],
      "enabledServiceTypes": ["RIDE", "DELIVERY", "DELIVERY_CARGO"]
    },
    "countries": {
      "CI": {
        "waveRadiiKm": [2, 4, 6, 8],
        "offerTtlSec": 90
      }
    },
    "cities": {},
    "franchises": {},
    "partners": {},
    "zones": {},
    "serviceTypes": {
      "DELIVERY": {
        "waveRadiiKm": [1, 2, 3, 5],
        "priorityMode": "distance"
      }
    }
  },
  "effective": {
    "countryCode": "CI",
    "resolvedFrom": ["global", "countries.CI"],
    "waveRadiiKm": [2, 4, 6, 8],
    "offerTtlSec": 90
  }
}
```

> **Question backend** : le champ `effective` peut-il être renvoyé par `GET /v1/admin/dispatch-config?countryCode=CI` pour éviter une route dédiée ?

---

## DISPATCH-UI-01 — Écrans backoffice à alimenter (côté front)

Une fois le schéma validé, le front implémentera :

| Écran | Route admin | Contenu |
|-------|-------------|---------|
| Règles dispatch (v1) | `/admin/settings/dispatch-rules` | Formulaire complet basé sur `dispatch-config` (remplace le mock) |
| Overrides pays | Onglet dans la même page | Sélecteur pays + PATCH pays |
| Overrides franchise / partenaire | Fiche franchise / partenaire | Section « Dispatch » |
| Console dispatch | `/admin/ops/dispatch` | Brancher API v1 + actions `start` / `retry` / `assign` |
| Fiche course | Détail commande | Bloc `dispatch` (statut, vague, offres, logs) |

**Permissions RBAC demandées** :

- `settings.dispatch_rules.view`
- `settings.dispatch_rules.edit`
- `ops.dispatch.view`
- `ops.dispatch.assign`
- `ops.dispatch.override` (optionnel)

---

## PAY-METHOD-01 — Système des moyens de paiement (catalogue + admin)

### Contexte

Aujourd’hui :

- `GET /v1/catalog/payment-methods` — catalogue public (non administrable)
- `GET/POST /v1/payment-methods/me` — moyens enregistrés **côté client**
- `GET/PATCH /v1/admin/paydunya-config` — config passerelle (canaux PayDunya)
- Le front **hardcode** les codes : `cash`, `wallet`, `card`, `orange_money`

**Besoin** : le backoffice doit pouvoir **créer, activer/désactiver, ordonner et restreindre** les moyens de paiement sans modification du code front.

### Routes admin demandées

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/v1/admin/payment-methods` | Liste paginée + filtres |
| `GET` | `/v1/admin/payment-methods/{id}` | Détail |
| `POST` | `/v1/admin/payment-methods` | Création |
| `PATCH` | `/v1/admin/payment-methods/{id}` | Mise à jour |
| `DELETE` | `/v1/admin/payment-methods/{id}` | Désactivation logique (soft delete) |
| `PUT` | `/v1/admin/payment-methods/reorder` | Ordre d’affichage apps |
| `GET` | `/v1/admin/payment-methods/effective?countryCode=&serviceType=` | Catalogue résolu pour un contexte |

### Paramètres configurables par moyen de paiement

| Paramètre | Type | Description |
|-----------|------|-------------|
| `code` | string | Identifiant stable (`cash`, `wallet`, `orange_money`, `wave`, …) |
| `label` | `{ fr, en }` | Libellés i18n |
| `description` | `{ fr, en }` | Aide utilisateur |
| `iconUrl` | string \| null | Icône |
| `type` | enum | `cash` \| `wallet` \| `card` \| `mobile_money` \| `bank_transfer` |
| `provider` | string \| null | `paydunya`, `internal`, `manual`, … |
| `providerChannelCode` | string \| null | Lien vers `paydunya-config.enabledChannels` |
| `enabled` | boolean | Actif globalement |
| `visibleToClient` | boolean | App client |
| `visibleToDispatcher` | boolean | Portail dispatch (prise de commande) |
| `visibleToPartner` | boolean | Portail partenaire |
| `requiresOnlinePayment` | boolean | Paiement en ligne obligatoire |
| `allowsPostTripSettlement` | boolean | Règlement après course (espèces) |
| `minAmountXof` | number | Montant minimum |
| `maxAmountXof` | number \| null | Plafond |
| `feeFixedXof` | number | Frais fixes |
| `feePercent` | number | Frais proportionnels |
| `eligibleServiceTypes` | string[] | `RIDE`, `DELIVERY`, … |
| `eligibleCountryCodes` | string[] | `CI`, `SN`, … |
| `eligibleCityIds` | string[] | Restriction ville |
| `eligibleFranchiseIds` | string[] | Restriction franchise |
| `eligiblePartnerIds` | string[] | Restriction partenaire |
| `dispatchFilter` | object | Impact sur le matching dispatch (voir ci-dessous) |
| `sortOrder` | number | Ordre UI |
| `metadata` | object | Extensions |

### Lien moyen de paiement ↔ dispatch

Merci de documenter comment le **moyen de paiement choisi sur une commande** influence le dispatch :

| Question | Réponse attendue |
|----------|------------------|
| Un chauffeur peut-il accepter toutes les méthodes ? | Oui / non — champ chauffeur ? |
| Faut-il filtrer les candidats si `cash` vs `wallet` ? | Règle + paramètre |
| Le dispatch manuel console doit-il afficher le paiement ? | Déjà partiellement en mock |
| Paramètre `requirePaymentMethodSupport` (dispatch) + liste codes acceptés par chauffeur ? | Schéma |

### Schéma JSON attendu (proposition front)

```json
{
  "status": "ok",
  "items": [
    {
      "id": "uuid",
      "code": "orange_money",
      "label": { "fr": "Orange Money", "en": "Orange Money" },
      "type": "mobile_money",
      "provider": "paydunya",
      "providerChannelCode": "orange_money_ci",
      "enabled": true,
      "visibleToClient": true,
      "visibleToDispatcher": true,
      "visibleToPartner": true,
      "eligibleServiceTypes": ["RIDE", "DELIVERY"],
      "eligibleCountryCodes": ["CI"],
      "minAmountXof": 100,
      "maxAmountXof": null,
      "feeFixedXof": 0,
      "feePercent": 0,
      "dispatchFilter": {
        "restrictDriversByAcceptedMethods": true,
        "acceptedDriverMethodCodes": ["cash", "wallet", "orange_money"]
      },
      "sortOrder": 10,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-06-02T00:00:00.000Z"
    }
  ]
}
```

### Cohérence avec PayDunya

| Demande | Détail |
|---------|--------|
| Lien explicite | `providerChannelCode` ↔ clés de `paydunya-config.document.enabledChannels` |
| Validation | Refuser l’activation d’un moyen en ligne si le canal PayDunya correspondant est désactivé |
| Webhooks | Documenter `GET /v1/admin/payment-webhooks` et son lien avec le statut paiement commande |

---

## PAY-UI-01 — Écrans backoffice moyens de paiement

| Écran | Route admin proposée | Actions |
|-------|----------------------|---------|
| Liste moyens de paiement | `/admin/settings/payment-methods` | CRUD, tri, filtres pays / service |
| Détail / édition | `/admin/settings/payment-methods/[id]` | Tous les champs ci-dessus |
| Lien intégrations | `/admin/settings/integrations` | Lien vers PayDunya + état canaux |

**Permissions RBAC demandées** :

- `settings.payment_methods.view`
- `settings.payment_methods.edit`

---

## SWAGGER-DISPATCH-01 — Documentation OpenAPI exigée

Pour **chaque route** citée dans ce document, merci d’ajouter dans Swagger :

1. **Request body** complet (PUT/PATCH/POST)
2. **Response 200** avec exemple JSON réel (pas seulement `401` / `403`)
3. **Enums** documentés (`priorityMode`, `offerMode`, `serviceType`, …)
4. **Query params** de fusion (`countryCode`, `cityId`, `franchiseId`, …)
5. Mention des champs **read-only** vs **writable**
6. Version du schéma (`schemaVersion`) et politique de migration

---

## Priorisation suggérée

| ID | Priorité | Sujet | Bloquant front |
|----|----------|-------|----------------|
| **DISPATCH-CONF-01** | **P0** | Schéma `dispatch.config` + GET/PUT documenté | Page règles dispatch v1 |
| **DISPATCH-PARAMS-01** | **P0** | Liste exhaustive paramètres vagues / offres / matching | Formulaire complet |
| **SWAGGER-DISPATCH-01** | **P0** | Exemples JSON Swagger | Intégration fiable |
| **DISPATCH-UI-01** | P1 | Routes simulate / effective | Debug & overrides |
| **PAY-METHOD-01** | **P0** | CRUD admin payment-methods | Fin du hardcode front |
| **PAY-UI-01** | P1 | Écrans settings | Après schéma validé |

---

## Livrables attendus de l’équipe backend

1. **Réponse structurée** (markdown ou JSON Schema) listant **tous** les paramètres dispatch réels (y compris ceux encore en dur dans le code).
2. **Exemple `GET /v1/admin/dispatch-config?countryCode=CI`** copiable dans les mocks front.
3. **Spécification CRUD** `/v1/admin/payment-methods` + alignement catalogue public `GET /v1/catalog/payment-methods`.
4. **Matrice de fusion** des overrides (global → pays → ville → franchise → partenaire → zone → service).
5. **Confirmation RBAC** (permissions admin nécessaires).

---

## Références front (pour implémentation après réponse backend)

| Sujet | Fichiers |
|-------|----------|
| Types dispatch mock | `src/shared/types/index.ts` → `DispatchRules`, `DispatcherAccount` |
| Formulaire règles | `src/features/settings/components/DispatchRulesForm.tsx` |
| Service legacy | `src/features/settings/api/dispatchRules.service.ts` |
| Console dispatch | `src/features/ops/pages/DispatchConsolePage.tsx` |
| Liens API | `src/core/api/links.ts` (à compléter : `dispatch-config`, `payment-methods`) |
| Intégration cible | `docs/API-INTEGRATION-BACKOFFICE.md` § Paramètres — `/v1/admin/dispatch-config` |

---

*Document rédigé pour transmission à l’IA / équipe backend UpJunoo. Toute modification de schéma doit incrémenter `schemaVersion` et être rétrocompatible ou accompagnée d’un guide de migration.*
