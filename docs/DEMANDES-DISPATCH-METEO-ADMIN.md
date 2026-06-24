# Demandes backend — Dispatch & Météo (interfaces admin)

> **Document de transmission équipe API / IA backend UpJunoo**  
> **Projet** : UpJunoo Pro — backoffice admin (`Up_prov2`)  
> **Date** : 12 juin 2026  
> **Périmètre** : uniquement le **moteur de dispatch**, les **comptes dispatchers** et le **système météo / surge** — pour permettre au backoffice de **lire, modifier, simuler et auditer** ces paramètres sans redéploiement.  
> **Hors périmètre** : moyens de paiement (voir `dispatcher_caracteristique_for_front.md` § PAY-METHOD).

---

## 1. Objectif produit

L’admin UpJunoo doit pouvoir :

1. **Configurer** toutes les règles du dispatch (vagues, offres, matching, zones, services).
2. **Gérer** les comptes dispatchers (périmètre, permissions, statut).
3. **Piloter** la météo et son impact sur le surge / la carte live.
4. **Observer** le dispatch en cours sur une commande (statut, logs, retry).
5. **Prévisualiser** la config effective (fusion global → pays → ville → franchise → zone).

Sans schéma JSON documenté par le backend, le front ne peut construire que des **formulaires partiels** (6 champs mock aujourd’hui).

---

## 2. État actuel côté front (juin 2026)

### 2.1 Ce qui existe déjà

| Zone | Route admin | Fichiers front | API utilisée |
|------|-------------|----------------|--------------|
| Règles dispatch | `/admin/settings/dispatch-rules` | `DispatchRulesPage`, `DispatchRulesForm` | **Mock** `GET/PUT /admin/settings/dispatch-rules` (legacy MSW) — **pas la v1** |
| Comptes dispatchers | `/admin/settings/dispatchers` | `DispatchersListPage`, `DispatcherForm` | `GET/POST/PATCH /v1/admin/dispatchers` (+ suspend/activate) |
| Console dispatch admin | `/admin/ops/dispatch` | `DispatchConsolePage` | Legacy `/admin/ops/dispatch` ou franchise |
| Portail dispatcher | `/dispatch/console`, `/dispatch/map` | `DispatchShell`, `DispatchLiveMapPage` | `/dispatch/ops/...` (legacy v2) |
| Météo & surge | `/admin/settings/weather` | `SettingsWeatherPage` | `GET/PUT /v1/admin/weather-config`, `POST /v1/admin/weather/refresh` |
| Zones chaudes (carte) | (carte live) | `liveMapHotZones.service.ts` | `GET /v1/geo/hot-zones` (lecture) |
| Détail course dispatch | `/admin/ops/trips/[id]` | partiel | `GET /v1/dispatch/{serviceType}/{orderId}/status` + `logs` |

### 2.2 Champs UI déjà prévus (à valider avec l’API)

**DispatchRules (mock — 6 champs)** :

| Champ front | Type UI | Validation front |
|-------------|---------|------------------|
| `match_radius_km` | number | > 0 |
| `assign_timeout_sec` | number | > 0 |
| `max_queue_size` | number | > 0 |
| `priority_mode` | `distance` \| `balanced` \| `rating` | enum |
| `auto_reassign` | boolean | — |
| `active_zone_ids` | checkbox multi | IDs zones réseau |

**DispatcherAccount (v1 partiel)** :

| Champ front | Type UI |
|-------------|---------|
| `name`, `email`, `phone` | texte |
| `franchise_id` | select |
| `zone_ids` | checkbox multi |
| `shift_label` | texte |
| `status` | `active` \| `suspended` |
| `permissions.assign_trips` | boolean |
| `permissions.view_live_map` | boolean |

**WeatherConfigDocument (v1 — champs devinés)** :

| Champ front | Type UI |
|-------------|---------|
| `enabled` | boolean |
| `heatThresholdCelsius` | number (°C) |
| `cacheTtlSeconds` | number |
| `cacheEnabled` | boolean (type TS, pas encore en UI) |
| `geohashPrecision` | number (type TS, pas en UI) |
| `fetchTimeoutMs` | number (type TS, pas en UI) |
| `apiBaseUrl` | string (type TS, pas en UI) |
| `fallbackCondition` | string (type TS, pas en UI) |
| `activeServiceTypes` | string[] (type TS, pas en UI) |
| `refresh.enabled` | boolean |
| `refresh.intervalMinutes` | number |
| `refresh.gridStepKm` | number (type TS, pas en UI) |
| `refresh.cityRadiusKmDefault` | number (type TS, pas en UI) |
| `refresh.cityOverrides` | object (type TS, pas en UI) |
| `scheduler.nextRunAt` | read-only (réponse GET) |

### 2.3 Constats bloquants

| Problème | Impact |
|----------|--------|
| Swagger décrit le dispatch en **prose** (*« Vagues 2→4→6→8 km · offre 120 s »*) sans **request/response JSON** | Impossible de brancher le formulaire v1 |
| **Deux routes** possibles pour dispatch : `/v1/admin/dispatch-config` **et** `/v1/admin/settings/dispatch-rules` | Le front ne sait pas laquelle utiliser |
| **Deux routes** météo : `/v1/admin/weather-config` **et** `/v1/admin/settings/weather` | Risque de divergence |
| `GET /v1/admin/dispatch-config` sans exemple `document` | Mapper front impossible |
| Lien météo → `hot-zones` → surge → dispatch **non documenté** | UI incohérente |
| Permissions dispatcher incomplètes vs besoins console | Pas de `cancel_trip`, `override_dispatch`, etc. |

---

## 3. Inventaire routes Swagger v0.4.0 (dispatch & météo)

### 3.1 Config & règles

| Méthode | Route | Statut front | Question backend |
|---------|-------|--------------|------------------|
| `GET` | `/v1/admin/dispatch-config` | Non branché | Schéma `document` ? Query `countryCode` ? |
| `PUT` | `/v1/admin/dispatch-config` | Non branché | Body complet ? |
| `PATCH` | `/v1/admin/dispatch-config/countries/{countryCode}` | Non branché | Merge ou replace ? |
| `GET` | `/v1/admin/settings/dispatch-rules` | Non branché (mock legacy) | **Doublon avec dispatch-config ?** |
| `PUT` | `/v1/admin/settings/dispatch-rules` | Non branché | Idem |
| `GET` | `/v1/dispatch/config/defaults` | Non branché | Usage : afficher défauts code en lecture seule ? |

### 3.2 Capacité & hygiène flotte

| Méthode | Route | Statut front | Question backend |
|---------|-------|--------------|------------------|
| `GET` | `/v1/admin/dispatch-capacity` | Non branché | Contenu ? Lien avec règles ? |
| `POST` | `/v1/admin/dispatch-fleet-hygiene` | Non branché | Action unique ou scan ? |
| `POST` | `/v1/admin/fleet/hygiene/scan` | Non branché | Différence avec route ci-dessus ? |
| `POST` | `/v1/admin/fleet/hygiene/apply` | Non branché | Corrections automatiques ? |

### 3.3 Comptes dispatchers

| Méthode | Route | Statut front |
|---------|-------|--------------|
| `GET` | `/v1/admin/dispatchers` | Branché (liste) |
| `POST` | `/v1/admin/dispatchers` | Branché (création) |
| `PATCH` | `/v1/admin/dispatchers/{id}` | Branché (édition) |
| `PATCH` | `/v1/admin/dispatchers/{id}/suspend` | À confirmer (front utilise PATCH body) |
| `PATCH` | `/v1/admin/dispatchers/{id}/activate` | Idem |

### 3.4 Exécution dispatch (par commande)

| Méthode | Route | Statut front |
|---------|-------|--------------|
| `GET` | `/v1/dispatch/{serviceType}/{orderId}/status` | Partiel (forensic / trips) |
| `GET` | `/v1/dispatch/{serviceType}/{orderId}/logs` | Partiel |
| `POST` | `/v1/dispatch/{serviceType}/{orderId}/retry` | Non branché UI admin |
| `POST` | `/v1/dispatch/rides/{rideId}/start` | Non branché |
| `POST` | `/v1/dispatch/deliveries/{deliveryId}/start` | Non branché |
| `POST` | `/v1/dispatch/offers/{offerId}/accept` | App chauffeur |
| `POST` | `/v1/dispatch/offers/{offerId}/reject` | App chauffeur |
| `POST` | `/v1/dispatch/offers/{offerId}/received` | App chauffeur |

### 3.5 Météo

| Méthode | Route | Statut front |
|---------|-------|--------------|
| `GET` | `/v1/admin/weather-config` | Branché |
| `PUT` | `/v1/admin/weather-config` | Branché |
| `POST` | `/v1/admin/weather/refresh` | Branché (bouton manuel) |
| `GET` | `/v1/admin/settings/weather` | **Non utilisé** — doublon ? |
| `PUT` | `/v1/admin/settings/weather` | **Non utilisé** |
| `GET` | `/v1/geo/hot-zones` | Branché (carte live) |
| `GET` | `/v1/geo/hot-zones/nearby` | Non branché |
| `GET` | `/v1/geo/pickup-demand` | Non branché |
| `GET` | `/v1/geo/demand-summary` | Non branché |

### 3.6 Routes demandées (absentes du Swagger)

| Méthode | Route | Besoin UI |
|---------|-------|-----------|
| `PATCH` | `/v1/admin/dispatch-config/franchises/{franchiseId}` | Override fiche franchise |
| `PATCH` | `/v1/admin/dispatch-config/partners/{partnerId}` | Override fiche partenaire |
| `PATCH` | `/v1/admin/dispatch-config/cities/{cityId}` | Override ville |
| `PATCH` | `/v1/admin/dispatch-config/zones/{zoneId}` | Override zone (rayon + surge) |
| `PATCH` | `/v1/admin/dispatch-config/service-types/{serviceType}` | Override par service |
| `GET` | `/v1/admin/dispatch-config/effective?...` | Panneau « preview » config résolue |
| `POST` | `/v1/admin/dispatch-config/simulate` | Simulateur dispatch (debug) |
| `PATCH` | `/v1/admin/weather-config/cities/{cityId}` | Override météo par ville |
| `GET` | `/v1/admin/weather-config/effective?...` | Preview météo résolue |
| `GET` | `/v1/admin/weather/jobs` | Historique jobs refresh (BullMQ) |

---

## 4. Questions ouvertes au backend (réponses attendues)

> Merci de répondre **point par point** (copier-coller Q→R). Format idéal : exemple JSON + règles de validation.

### 4.1 Architecture & routes

| ID | Question |
|----|----------|
| **Q-D01** | Quelle est la **source de vérité** : `dispatch-config` ou `settings/dispatch-rules` ? Faut-il déprécier l’une des deux ? |
| **Q-D02** | Même question pour **`weather-config`** vs **`settings/weather`**. |
| **Q-D03** | Le pattern de réponse est-il toujours `{ status, generatedAt, settingKey, schemaVersion, document, fromDatabase }` comme PayDunya / météo ? |
| **Q-D04** | Faut-il un champ **`effective`** dans la réponse GET (config déjà fusionnée) ou une route dédiée ? |
| **Q-D05** | Chaque modification émet-elle une entrée **`audit-log`** ? Quel `action` / `resource` ? |
| **Q-D06** | Les changements sont-ils **immédiats** ou faut-il un **cache flush** / redémarrage worker ? |
| **Q-D07** | Quelle **`schemaVersion`** actuelle pour `dispatch.config` et `weather.config` ? Politique de migration ? |

### 4.2 Fusion des overrides (dispatch)

| ID | Question |
|----|----------|
| **Q-D10** | Ordre de priorité exact : `global` ← `country` ← `city` ← `franchise` ← `partner` ← `zone` ← `serviceType` ? |
| **Q-D11** | Un override **remplace** ou **merge** les champs (ex. seul `offerTtlSec` sur pays CI) ? |
| **Q-D12** | Peut-on **désactiver** le dispatch pour une zone sans la retirer de `activeZoneIds` ? |
| **Q-D13** | Comment les **zones réseau** (`GET /v1/zones`) se mappent aux `zoneId` du dispatch ? UUID ? |

### 4.3 Vagues & offres (cœur moteur)

Documentation Swagger actuelle : *« Vagues 2→4→6→8 km · offre 120 s · intervalle vague 120 s »*.

| ID | Question |
|----|----------|
| **Q-D20** | Confirmer les noms JSON : `waveRadiiKm`, `waveIntervalSec`, `offerTtlSec` ? |
| **Q-D21** | Valeurs **min / max** acceptées pour chaque paramètre ? |
| **Q-D22** | `maxWaves` existe-t-il ? Que se passe-t-il après la dernière vague (escalade, annulation, notify dispatcher) ? |
| **Q-D23** | `offerMode` : `sequential`, `broadcast`, `batch` — lesquels sont implémentés ? |
| **Q-D24** | Plusieurs offres simultanées au **même chauffeur** : autorisé ? |
| **Q-D25** | Cooldown après refus répétés : paramètres et comportement ? |
| **Q-D26** | Durée max totale d’un dispatch (`maxDispatchDurationSec`) avant timeout global ? |

### 4.4 Matching & priorité chauffeur

| ID | Question |
|----|----------|
| **Q-D30** | `priorityMode` : algorithme exact pour `balanced` (poids distance vs rating) ? |
| **Q-D31** | Filtres : note min, catégorie véhicule, moyen de paiement, chauffeur occupé/hors ligne ? |
| **Q-D32** | Le paramètre `matchRadiusKm` front mock est-il le **premier rayon de vague** ou un rayon fixe hors vagues ? |
| **Q-D33** | `maxCandidatesReturned` pour la console dispatch : valeur défaut ? |

### 4.5 File d’attente & réassignation

| ID | Question |
|----|----------|
| **Q-D40** | `autoReassign` : déclenché à l’expiration offre, timeout assignation, ou les deux ? |
| **Q-D41** | `reassignMaxAttempts` et `reassignDelaySec` ? |
| **Q-D42** | Actions d’escalade possibles (`expand_radius`, `notify_dispatcher`, `cancel`, `surge`) ? |

### 4.6 Services & typologie commande

| ID | Question |
|----|----------|
| **Q-D50** | Liste complète `serviceType` : `RIDE`, `DELIVERY`, `DELIVERY_CARGO`, `FREIGHT`, `RENTAL` — lesquels ont un dispatch auto ? |
| **Q-D51** | `autoStartDispatchOnCreate` par service ? |
| **Q-D52** | Dispatch **manuel** console : quelle route appeler (`start` ride vs delivery) ? |

### 4.7 Comptes dispatchers

| ID | Question |
|----|----------|
| **Q-D60** | Schéma **POST/PATCH** complet d’un dispatcher (champs obligatoires, enums). |
| **Q-D61** | `permissions` : liste exhaustive supportée par l’API (pas seulement `assign_trips`, `view_live_map`). |
| **Q-D62** | `shiftRequired` : le backend vérifie-t-il un créneau actif (`/v1/partners/{id}/shifts`) ? |
| **Q-D63** | Un dispatcher peut-il avoir **plusieurs franchises** ou une seule ? |
| **Q-D64** | Lien compte dispatcher ↔ **user Supabase** / `userId` ? |
| **Q-D65** | Routes `suspend` / `activate` dédiées vs `PATCH { status }` — laquelle privilégier ? |

### 4.8 Observabilité dispatch (fiche commande)

| ID | Question |
|----|----------|
| **Q-D70** | Schéma complet **`GET …/status`** : `wave`, `radiusKm`, `offerExpiresAt`, `candidates`, `assignedDriverId`, … ? |
| **Q-D71** | Schéma **`GET …/logs`** : format lignes (timestamp, level, message, metadata) ? |
| **Q-D72** | Body optionnel de **`POST …/retry`** (forcer vague, élargir rayon) ? |
| **Q-D73** | Événements **WebSocket** dispatch pour console temps réel (`dispatch:offer:*`, …) ? |

### 4.9 Capacité & hygiène

| ID | Question |
|----|----------|
| **Q-D80** | Contenu de **`GET /v1/admin/dispatch-capacity`** (chauffeurs dispo, charge file, …) ? |
| **Q-D81** | **`dispatch-fleet-hygiene`** vs **`fleet/hygiene/scan`** : quand utiliser quoi ? |
| **Q-D82** | Le résultat hygiene est-il affichable dans l’admin (liste anomalies) ? |

### 4.10 Météo — configuration

| ID | Question |
|----|----------|
| **Q-W01** | Schéma **complet et officiel** de `weather-config.document` (tous champs, types, défauts). |
| **Q-W02** | Quels champs sont **read-only** (ex. `scheduler`) ? |
| **Q-W03** | `heatThresholdCelsius` : déclenche quoi exactement (surge, alerte, exclusion dispatch) ? |
| **Q-W04** | `activeServiceTypes` : restreint le calcul météo à certains services ? |
| **Q-W05** | `apiBaseUrl` : quelle API météo externe (OpenWeather, autre) ? Clé API où ? |
| **Q-W06** | `fallbackCondition` : valeur si API indisponible ? |
| **Q-W07** | `geohashPrecision` : impact sur granularité carte / perf ? |
| **Q-W08** | `cacheTtlSeconds` vs durée réelle des tuiles en Redis ? |

### 4.11 Météo — refresh & scheduler

| ID | Question |
|----|----------|
| **Q-W10** | `POST /v1/admin/weather/refresh` : synchrone ou job async (`queued`, `jobId`) ? |
| **Q-W11** | Durée typique d’un refresh complet Abidjan ? |
| **Q-W12** | `refresh.gridStepKm`, `cityRadiusKmDefault`, `cityRadiusKmMetro`, `maxCellsPerCity` : règles métier ? |
| **Q-W13** | Format exact de `refresh.cityOverrides` (ex. `{ "abidjan": { radiusKm, gridStepKm } }`) ? |
| **Q-W14** | Peut-on avoir un **GET jobs/history** (succès, erreurs, durée) ? |
| **Q-W15** | `scheduler.nextRunAt` : fuseau horaire ? |

### 4.12 Météo — lien surge, zones, dispatch

| ID | Question |
|----|----------|
| **Q-W20** | Comment `GET /v1/geo/hot-zones` est alimenté par le refresh météo ? |
| **Q-W21** | Champs `heatLevel`, `surge` sur hot-zone : formules de calcul ? |
| **Q-W22** | Le surge météo **remplace** ou **combine** avec le surge zone réseau (`/v1/zones`) ? |
| **Q-W23** | Le dispatch utilise-t-il le surge (rayon élargi, priorité) ? Paramètre dans `dispatch-config` ? |
| **Q-W24** | `GET /v1/geo/pickup-demand` et `demand-summary` : usage admin recommandé ? |
| **Q-W25** | Faut-il une **carte admin dédiée** météo (couche heatmap) ou la carte live suffit ? |

---

## 5. Paramètres configurables — référence exhaustive demandée

> Pour **chaque ligne** : confirmer ✅ existant API | 🔧 en dur code | ❌ non implémenté | + type JSON, défaut, min/max, périmètre.

### 5.1 Dispatch — vagues & offres

| Paramètre JSON suggéré | Description | Doc Swagger / mock |
|------------------------|-------------|-------------------|
| `waveRadiiKm` | Rayons km par vague, ordre croissant | `[2, 4, 6, 8]` |
| `waveIntervalSec` | Délai entre vagues | `120` |
| `offerTtlSec` | TTL offre chauffeur | `120` |
| `maxWaves` | Nb max vagues | ? |
| `maxDispatchDurationSec` | Timeout global dispatch | ? |
| `maxOffersPerDriver` | Offres simultanées / chauffeur | ? |
| `maxRejectionsBeforeCooldown` | Refus avant cooldown | ? |
| `rejectionCooldownSec` | Durée cooldown | ? |
| `offerMode` | `sequential` \| `broadcast` \| `batch` | ? |
| `batchSize` | Taille lot mode batch | ? |

### 5.2 Dispatch — matching

| Paramètre | Description | Front mock |
|-----------|-------------|------------|
| `matchRadiusKm` | Rayon recherche initial | ✅ |
| `assignTimeoutSec` | Timeout assignation | ✅ |
| `priorityMode` | `distance` \| `rating` \| `balanced` | ✅ |
| `minDriverRating` | Note min | ❌ |
| `maxDriverActiveTrips` | Courses simultanées max | ❌ |
| `requireVehicleCategoryMatch` | Filtre catégorie | ❌ |
| `requirePaymentMethodSupport` | Filtre paiement | ❌ |
| `excludeOfflineDrivers` | Exclure hors ligne | ❌ |
| `excludeBusyDrivers` | Exclure en course | ❌ |
| `distanceWeight` / `ratingWeight` | Poids mode balanced | ❌ |
| `maxCandidatesReturned` | Candidats console | ❌ |

### 5.3 Dispatch — file & réassignation

| Paramètre | Front mock |
|-----------|------------|
| `maxQueueSize` | ✅ |
| `autoReassign` | ✅ |
| `reassignMaxAttempts` | ❌ |
| `reassignDelaySec` | ❌ |
| `escalationAction` | ❌ |

### 5.4 Dispatch — géographie & services

| Paramètre | Front mock |
|-----------|------------|
| `activeZoneIds` | ✅ |
| `zoneOverrides.{zoneId}.radiusKm` | partiel (surge UI zones) |
| `zoneOverrides.{zoneId}.surgeMultiplier` | partiel |
| `zoneOverrides.{zoneId}.enabled` | ❌ |
| `crossZoneAssignAllowed` | ❌ |
| `enabledServiceTypes` | ❌ |
| `autoStartDispatchOnCreate` | ❌ |
| `manualDispatchAllowed` | ❌ |
| `perServiceOverrides` | ❌ |

### 5.5 Dispatch — console & dispatchers

| Paramètre | Front |
|-----------|-------|
| `consolePollIntervalSec` | 15 s (hardcodé front) |
| `permissions.assignTrips` | ✅ |
| `permissions.viewLiveMap` | ✅ |
| `permissions.cancelTrip` | ❌ |
| `permissions.overrideDispatch` | ❌ |
| `permissions.adjustSurge` | ❌ |
| `shiftRequired` | ❌ |
| `allowedFranchiseIds` | partiel (`franchise_id`) |
| `allowedZoneIds` | ✅ (`zone_ids`) |

### 5.6 Météo — document `weather.config`

| Paramètre | Front UI | Type TS |
|-----------|----------|---------|
| `enabled` | ✅ | boolean |
| `cacheEnabled` | ❌ | boolean |
| `cacheTtlSeconds` | ✅ | number |
| `geohashPrecision` | ❌ | number |
| `heatThresholdCelsius` | ✅ | number |
| `fetchTimeoutMs` | ❌ | number |
| `apiBaseUrl` | ❌ | string \| null |
| `fallbackCondition` | ❌ | string |
| `activeServiceTypes` | ❌ | string[] |
| `refresh.enabled` | ✅ | boolean |
| `refresh.intervalMinutes` | ✅ | number |
| `refresh.gridStepKm` | ❌ | number |
| `refresh.cityRadiusKmDefault` | ❌ | number |
| `refresh.cityRadiusKmMetro` | ❌ | number |
| `refresh.metroMinZones` | ❌ | number |
| `refresh.batchConcurrency` | ❌ | number |
| `refresh.maxCellsPerCity` | ❌ | number |
| `refresh.cityOverrides` | ❌ | Record |

---

## 6. Schémas JSON proposés (cibles front)

### 6.1 `dispatch.config` (réponse GET)

```json
{
  "status": "ok",
  "generatedAt": "2026-06-12T10:00:00.000Z",
  "settingKey": "dispatch.config",
  "schemaVersion": 1,
  "fromDatabase": true,
  "document": {
    "schemaVersion": 1,
    "global": {
      "waveRadiiKm": [2, 4, 6, 8],
      "waveIntervalSec": 120,
      "offerTtlSec": 120,
      "maxWaves": 4,
      "maxDispatchDurationSec": 600,
      "matchRadiusKm": 3,
      "assignTimeoutSec": 45,
      "maxQueueSize": 12,
      "priorityMode": "balanced",
      "autoReassign": true,
      "activeZoneIds": [],
      "enabledServiceTypes": ["RIDE", "DELIVERY", "DELIVERY_CARGO"],
      "autoStartDispatchOnCreate": true,
      "manualDispatchAllowed": true
    },
    "countries": {
      "CI": {
        "offerTtlSec": 90,
        "waveRadiiKm": [2, 4, 6, 8]
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

### 6.2 `weather.config` (réponse GET — à valider)

```json
{
  "status": "ok",
  "generatedAt": "2026-06-12T10:00:00.000Z",
  "settingKey": "weather.config",
  "schemaVersion": 1,
  "fromDatabase": true,
  "document": {
    "schemaVersion": 1,
    "enabled": true,
    "cacheEnabled": true,
    "cacheTtlSeconds": 900,
    "geohashPrecision": 6,
    "heatThresholdCelsius": 35,
    "fetchTimeoutMs": 8000,
    "apiBaseUrl": null,
    "fallbackCondition": "clear",
    "activeServiceTypes": ["RIDE", "DELIVERY"],
    "refresh": {
      "enabled": true,
      "intervalMinutes": 15,
      "gridStepKm": 2,
      "cityRadiusKmDefault": 25,
      "cityRadiusKmMetro": 40,
      "metroMinZones": 3,
      "batchConcurrency": 4,
      "maxCellsPerCity": 500,
      "cityOverrides": {
        "abidjan": { "radiusKm": 35, "gridStepKm": 1.5 }
      }
    }
  },
  "scheduler": {
    "enabled": true,
    "nextRunAt": "2026-06-12T10:15:00.000Z"
  }
}
```

### 6.3 Statut dispatch commande (bloc UI fiche course)

```json
{
  "status": "ok",
  "serviceType": "RIDE",
  "orderId": "uuid",
  "dispatch": {
    "state": "offering",
    "waveIndex": 2,
    "waveRadiusKm": 4,
    "maxWaves": 4,
    "offerTtlSec": 120,
    "offerExpiresAt": "2026-06-12T10:01:30.000Z",
    "candidatesCount": 8,
    "offersSent": 3,
    "assignedDriverId": null,
    "lastError": null
  }
}
```

---

## 7. Maquettes écrans admin proposés

### 7.1 Hub paramètres dispatch & météo

**Route** : `/admin/settings/operations` (nouveau hub) ou entrées séparées existantes.

```
┌─────────────────────────────────────────────────────────────┐
│ Paramètres opérationnels                                     │
├─────────────────┬─────────────────┬─────────────────────────┤
│ Règles dispatch │ Météo & surge   │ Comptes dispatchers     │
│ (dispatch-conf) │ (weather-conf)  │ (dispatchers CRUD)      │
├─────────────────┴─────────────────┴─────────────────────────┤
│ Capacité live │ Hygiène flotte │ Simulateur dispatch        │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Règles dispatch v1 (remplace mock)

**Route** : `/admin/settings/dispatch-rules` (conserver URL).

**Onglets** :

| Onglet | Contenu |
|--------|---------|
| **Global** | Vagues, offres, matching, file, services |
| **Pays** | Select `CI`, `SN`, … → PATCH pays |
| **Villes** | Select ville → overrides |
| **Franchises** | Lien vers fiche ou select |
| **Zones** | Carte + liste zones actives + surge |
| **Services** | Table `RIDE` / `DELIVERY` / … |
| **Preview** | Panneau `effective` (lecture seule) |
| **Simulateur** | Lat/lng + service → candidats (POST simulate) |

**Sections formulaire Global** :

1. **Vagues** — éditeur tableau `waveRadiiKm`, `waveIntervalSec`, `offerTtlSec`, `maxWaves`
2. **Matching** — rayon, timeout, mode priorité, filtres chauffeurs
3. **File d’attente** — taille max, auto-reassign, escalade
4. **Services** — checkboxes types + auto-start
5. **Zones actives** — multi-select (données `GET /v1/zones`)

**Actions** : Enregistrer (PUT global), Enregistrer override (PATCH), Réinitialiser aux défauts (GET defaults).

### 7.3 Météo & surge (enrichir page existante)

**Route** : `/admin/settings/weather`

**Onglets** :

| Onglet | Contenu |
|--------|---------|
| **Général** | enabled, seuil chaleur, cache, services actifs |
| **API & perf** | apiBaseUrl (masqué), timeout, geohash, fallback |
| **Refresh** | intervalle, grille, rayons villes, overrides par ville |
| **Scheduler** | nextRunAt, bouton refresh manuel, historique jobs |
| **Impact** | Lien preview hot-zones, explication surge |

**Widgets** :

- Jauge dernier refresh (âge cache)
- Carte mini heatmap Abidjan (optionnel P1)
- Table `cityOverrides` éditable

### 7.4 Comptes dispatchers (enrichir)

**Route** : `/admin/settings/dispatchers`, `/admin/settings/dispatchers/[id]`

**Ajouts** :

- Permissions étendues (checkboxes depuis enum API)
- Périmètre : franchises multiples ?, zones
- Historique connexions / dernière action
- Lien « Voir console » → impersonation ou doc

### 7.5 Console dispatch admin

**Route** : `/admin/ops/dispatch`

- Brancher API v1 franchise ou plateforme
- Afficher config effective en sidebar (lecture seule)
- Actions : assign manuel, retry, start dispatch
- Polling configurable (`consolePollIntervalSec`)

### 7.6 Bloc dispatch — fiche commande

**Route** : `/admin/ops/trips/[id]`

```
┌─ Dispatch ─────────────────────────────────────┐
│ État : En offre (vague 2/4, rayon 4 km)         │
│ Expire : 10:01:30 · 3 offres envoyées          │
│ [Voir logs] [Relancer dispatch]                 │
└────────────────────────────────────────────────┘
```

### 7.7 Capacité & hygiène (nouveau P1)

**Routes** : `/admin/settings/dispatch-capacity`, `/admin/settings/fleet-hygiene`

- KPIs charge dispatch
- Bouton scan hygiene + liste anomalies + apply

---

## 8. Matrice paramètre → composant UI

| Paramètre | Composant UI suggéré | Section |
|-----------|----------------------|---------|
| `waveRadiiKm` | Tag input / liste nombres | Vagues |
| `waveIntervalSec`, `offerTtlSec` | Input number + unité « s » | Vagues |
| `priorityMode` | Radio group | Matching |
| `activeZoneIds` | Multi-select + carte | Zones |
| `zoneOverrides.*.surgeMultiplier` | Slider 1.0–3.0 | Zones |
| `enabledServiceTypes` | Checkbox group | Services |
| `heatThresholdCelsius` | Slider + °C | Météo |
| `refresh.cityOverrides` | Table éditable | Météo |
| `permissions.*` | Checkbox group | Dispatcher |
| `effective.*` | Card read-only JSON / résumé | Preview |

---

## 9. Permissions RBAC demandées

| Permission | Écran |
|------------|-------|
| `settings.dispatch_rules.view` | Lire règles dispatch |
| `settings.dispatch_rules.edit` | Modifier règles + overrides |
| `settings.dispatch_simulate.run` | Simulateur |
| `settings.weather.view` | Lire météo |
| `settings.weather.edit` | Modifier météo |
| `settings.weather.refresh` | POST refresh manuel |
| `settings.dispatchers.view` | Liste dispatchers |
| `settings.dispatchers.edit` | CRUD dispatchers |
| `ops.dispatch.view` | Console dispatch |
| `ops.dispatch.assign` | Assignation manuelle |
| `ops.dispatch.retry` | Relancer dispatch |
| `ops.dispatch.override` | Forcer hors règles |

---

## 10. Priorisation implémentation (front après réponses backend)

| Priorité | ID | Livrable backend | Écran front |
|----------|-----|------------------|-------------|
| **P0** | DISPATCH-SCHEMA | Exemple GET `dispatch-config` + clarification vs `dispatch-rules` | Brancher `DispatchRulesForm` sur v1 |
| **P0** | DISPATCH-PARAMS | Liste paramètres vagues/matching validée | Formulaire complet onglet Global |
| **P0** | WEATHER-SCHEMA | Schéma officiel `weather-config` + doublon `settings/weather` | Enrichir `SettingsWeatherPage` |
| **P0** | SWAGGER | Request/response bodies documentés | Mappers + mocks |
| **P1** | DISPATCH-EFFECTIVE | GET effective ou champ `effective` | Onglet Preview |
| **P1** | DISPATCH-STATUS | Schéma status/logs/retry | Bloc fiche course |
| **P1** | WEATHER-HOTZONES | Doc lien refresh → hot-zones | Carte + explication surge |
| **P1** | DISPATCH-OVERRIDES | PATCH franchise/zone/service | Onglets overrides |
| **P2** | DISPATCH-SIMULATE | POST simulate | Outil debug admin |
| **P2** | DISPATCH-CAPACITY | GET capacity + hygiene | Pages monitoring |
| **P2** | DISPATCHER-PERMS | Enum permissions complet | Formulaire dispatcher |

---

## 11. Livrables attendus du backend

1. **Réponse markdown** à toutes les questions § 4 (Q-D* et Q-W*).
2. **Exemple JSON copiable** : `GET /v1/admin/dispatch-config?countryCode=CI` (200).
3. **Exemple JSON copiable** : `GET /v1/admin/weather-config` (200) — **schéma validé**.
4. **Clarification** `dispatch-config` vs `settings/dispatch-rules` et `weather-config` vs `settings/weather`.
5. **Matrice de fusion** overrides dispatch (et météo si applicable).
6. **Schémas** `dispatch/.../status` et `.../logs` pour la fiche commande.
7. **Enum** `permissions` dispatcher et `serviceType` dispatch.
8. **Politique** : modification immédiate vs cache ; entrées audit-log.
9. Mise à jour **Swagger** avec exemples 200 (pas seulement 401/403).

---

## 12. Références code front (implémentation)

| Sujet | Fichiers |
|-------|----------|
| Types dispatch mock | `src/shared/types/index.ts` → `DispatchRules`, `DispatcherAccount` |
| Formulaire règles | `src/features/settings/components/DispatchRulesForm.tsx` |
| Service legacy règles | `src/features/settings/api/dispatchRules.service.ts` |
| Dispatchers v1 | `src/features/settings/api/dispatchers.service.ts`, `adminDispatchers.mapper.ts` |
| Météo v1 | `src/features/settings/pages/SettingsWeatherPage.tsx`, `adminPlatformConfig.service.ts` |
| Types météo | `src/features/settings/api/adminPlatformConfig.api.types.ts` |
| Hot zones | `src/features/ops/api/liveMapHotZones.service.ts` |
| Console dispatch | `src/features/ops/pages/DispatchConsolePage.tsx` |
| Liens API | `src/core/api/links.ts` (à compléter : `dispatch-config`, `dispatch-capacity`) |

---

## 13. Checklist validation (équipe front)

Avant de considérer l’intégration terminée :

- [ ] `PUT dispatch-config` puis `GET` renvoie les mêmes valeurs
- [ ] Override pays CI modifie bien `effective.offerTtlSec`
- [ ] `PUT weather-config` + `POST weather/refresh` met à jour `hot-zones`
- [ ] Création dispatcher visible sur portail `/dispatch/login`
- [ ] Fiche course affiche statut dispatch cohérent avec logs
- [ ] Permissions RBAC respectées sur chaque écran
- [ ] Aucun champ critique resté en dur dans le front

---

*Document rédigé pour transmission à l’équipe / IA backend UpJunoo. Toute évolution de schéma doit incrémenter `schemaVersion` et inclure un guide de migration.*
