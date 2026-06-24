# Demande backend — Calibrage météo, surge pricing & pilotage dispatcher

> **Document de transmission équipe API / IA backend**  
> **Projet** : UpJunoo Pro — backoffice admin & portails franchise (`Up_prov2`)  
> **Date** : 16 juin 2026  
> **Objectif** : obtenir la **liste exhaustive**, les **schémas JSON**, les **règles de calibrage** et les **routes CRUD** de tout ce qui concerne le **service météo** et son impact sur le **surge pricing**, afin que le **dispatcher** (et les rôles autorisés) puissent **tout configurer, calibrer et auditer** sans redeployer le front ni le backend.

**Document lié** : `docs/dispatcher_caracteristique_for_front.md` (dispatch-config, payment-methods) — la météo y est citée uniquement comme pattern `weather-config`, sans spec métier.

---

## Contexte métier

Le moteur de dispatch et la tarification peuvent appliquer un **multiplicateur surge** selon :

- la **zone** (`surgeMultiplier` dans `dispatch-config` / fiche zone),
- les **règles tarifaires** (nuit, aéroport, etc.),
- les **conditions météo** (chaleur, pluie, orage…) récupérées périodiquement et mises en cache par cellule géographique (geohash).

**Attente produit** : le **dispatcher** est le rôle opérationnel qui doit pouvoir **piloter l’ensemble** des paramètres impactant l’offre (dispatch + surge météo + ajustements manuels). Le backoffice doit exposer ces réglages de façon **explicite, calibrable et traçable**.

---

## Contexte côté front (état actuel)

| Zone | Fichiers / routes front | API branchée aujourd’hui | Limite |
|------|-------------------------|---------------------------|--------|
| Météo admin | `SettingsWeatherPage` | `GET/PUT /v1/admin/weather-config` · `POST /v1/admin/weather/refresh` | **5 champs UI** sur ~20+ champs Swagger |
| Météo franchise | `FranchiseSettingsWeatherPage` | `GET/PUT /v1/franchise/settings/weather-config` · `POST …/weather/refresh` | Même formulaire minimal |
| Intégrations | `SettingsIntegrationsPage` | Lien vers page météo | Pas de détail provider |
| Comptes dispatchers | `DispatchersListPage`, `DispatcherForm` | `GET/POST/PATCH /v1/admin/dispatchers` | Permission `adjust_surge` sans API d’ajustement documentée |
| Console dispatch | `DispatchConsolePage` | Legacy `/admin/ops/dispatch` | Pas de bloc météo / surge live |
| Surge zones | `ZoneCreatePage`, fiches zones | `PATCH` zones (surge manuel) | Séparé de la météo |
| Tarification | `PricingForm`, règles franchise | `GET/POST/PATCH pricing-rules` | Lien météo ↔ tarif **non documenté** |
| Types front | `adminPlatformConfig.api.types.ts` → `WeatherConfigDocument` | Partiellement aligné Swagger | **Pas de règles de calibrage surge** dans le type |

**Constat** : l’API expose un document `weather.config` (`system_settings`) et un worker BullMQ de refresh, mais le Swagger **ne documente pas** :

1. comment une condition météo (`clear`, `rain`, `storm`, `heat`) se traduit en **multiplicateur surge** ;
2. quels **seuils numériques** calibrer (mm/h pluie, vent, humidité, etc.) au-delà de `heatThresholdCelsius` ;
3. comment le dispatcher **ajuste** le surge en opération (`permissions.adjust_surge`) ;
4. la **fusion** global ← pays ← ville ← franchise ← zone pour la météo.

---

## Demande générale à l’équipe backend

Merci de fournir pour **chaque paramètre** listé ci-dessous :

1. **Nom du champ** (camelCase JSON), **type**, **unité**, **valeur par défaut**, **min / max**, **nullable ou non**
2. **Périmètre d’application** : `global` | `country` | `city` | `franchise` | `zone` | `serviceType`
3. **Priorité de fusion** (ex. global ← pays ← ville ← franchise ← zone)
4. **Route(s)** : lecture + écriture (GET, PUT, PATCH) + **exemple de réponse 200 complète**
5. **Règles métier** et **formules de calibrage** (comment un seuil → un multiplicateur)
6. **Événement d’audit** émis à chaque modification (`audit-log`)
7. Indication si le paramètre est **utilisé en temps réel** ou nécessite un **refresh météo / cache flush**
8. **Permissions RBAC** requises (admin, franchise, dispatcher)

Format de réponse attendu : document JSON versionné (`schemaVersion`), aligné sur le pattern `weather-config` / `dispatch-config` / `paydunya-config`.

---

## WEATHER-CONF-01 — Document `weather.config` complet

### Routes existantes (à documenter + compléter)

| Méthode | Route | Usage backoffice |
|---------|-------|------------------|
| `GET` | `/v1/admin/weather-config` | Lire `document` + `effective` + `scheduler` |
| `PUT` | `/v1/admin/weather-config` | Remplacer le document global · replanifie le worker |
| `POST` | `/v1/admin/weather/refresh` | Refresh manuel (BullMQ) |
| `GET` | `/v1/franchise/settings/weather-config` | Config météo scope franchise (JWT franchise) |
| `PUT` | `/v1/franchise/settings/weather-config` | Override franchise |
| `POST` | `/v1/franchise/settings/weather/refresh` | Refresh scope franchise |
| `GET` | `/v1/franchises/{id}/settings/weather-config` | Admin lit config d’une franchise |
| `PUT` | `/v1/franchises/{id}/settings/weather-config` | Admin écrit config franchise |
| `POST` | `/v1/franchises/{id}/settings/weather/refresh` | Admin déclenche refresh franchise |

### Routes supplémentaires demandées

| Méthode | Route | Besoin |
|---------|-------|--------|
| `PATCH` | `/v1/admin/weather-config/countries/{countryCode}` | Override pays (CI, SN, BF…) |
| `PATCH` | `/v1/admin/weather-config/cities/{cityId}` | Override ville (rayon grille, seuils) |
| `PATCH` | `/v1/admin/weather-config/zones/{zoneId}` | Override zone (seuils + multiplicateurs locaux) |
| `GET` | `/v1/admin/weather-config/effective?countryCode=&cityId=&franchiseId=&zoneId=` | **Preview** config résolue |
| `GET` | `/v1/admin/weather/cells?lat=&lng=` ou `geohash=` | Lire cache météo + surge calculé pour un point |
| `POST` | `/v1/admin/weather/simulate` | Simuler condition + multiplicateur pour lat/lng + serviceType |
| `GET` | `/v1/admin/weather/jobs` | Historique jobs refresh (statut, durée, cellules) |
| `GET` | `/v1/dispatcher/weather-config` | **Portail dispatcher** — config effective sur ses zones |
| `PATCH` | `/v1/dispatcher/surge/adjust` | Ajustement manuel surge (si `adjust_surge`) |
| `GET` | `/v1/dispatcher/weather/live?zoneId=` | Conditions météo + surge actuel par zone assignée |

> **Question** : le portail dispatcher doit-il utiliser les routes admin avec RBAC, ou un namespace `/v1/dispatcher/*` dédié ?

### Champs déjà visibles dans Swagger (PUT body) — à confirmer / compléter

| Paramètre | Type (Swagger) | Rôle supposé | Exposé UI front |
|-----------|----------------|--------------|-----------------|
| `schemaVersion` | integer | Version schéma | Non |
| `enabled` | boolean | Activer service météo | Oui |
| `cacheEnabled` | boolean | Activer cache geohash | Non |
| `cacheTtlSeconds` | integer | TTL cache (s) | Oui |
| `geohashPrecision` | integer 4–8 | Granularité cellules | Non |
| `heatThresholdCelsius` | number | Seuil chaleur | Oui |
| `fetchTimeoutMs` | integer | Timeout appel provider | Non |
| `apiBaseUrl` | string \| null | URL provider météo | Non |
| `fallbackCondition` | enum `clear` \| `rain` \| `storm` \| `heat` | Condition si API indispo | Non |
| `activeServiceTypes` | string[] | Services impactés | Non |
| `refresh.enabled` | boolean | Worker BullMQ actif | Oui |
| `refresh.intervalMinutes` | integer 1–1440 | Intervalle refresh | Oui |
| `refresh.gridStepKm` | number | Pas grille (km) | Non |
| `refresh.cityRadiusKmDefault` | number | Rayon ville standard | Non |
| `refresh.cityRadiusKmMetro` | number | Rayon métropole | Non |
| `refresh.metroMinZones` | integer | Seuil zones pour mode métro | Non |
| `refresh.batchConcurrency` | integer | Parallélisme fetch | Non |
| `refresh.maxCellsPerCity` | integer | Plafond cellules / ville | Non |
| `refresh.cityOverrides` | Record\<cityId, { enabled?, radiusKm?, gridStepKm? }\> | Surcharges par ville | Non |

**Manquant côté Swagger (demande explicite)** : tout le bloc **calibrage surge** (voir section WEATHER-CALIB-01).

---

## WEATHER-CALIB-01 — Paramètres de calibrage météo → surge

> **Cœur de la demande** : le dispatcher doit pouvoir **régler finement** comment la météo influence le prix / le dispatch, pas seulement activer le refresh.

### A. Conditions météo & détection

Merci de documenter la **source** (Open-Meteo, OpenWeather, autre) et les **champs bruts** utilisés.

| Paramètre suggéré | Description | Question backend |
|-------------------|-------------|------------------|
| `weatherProvider` | `open_meteo` \| `openweather` \| `custom` | Quel provider en prod ? |
| `providerApiKey` | Clé si nécessaire | Stockage sécurisé ? variable env ? |
| `conditions` | Liste des conditions reconnues | Liste exhaustive ? |
| `rainIntensityThresholds` | ex. `{ light: 0.5, moderate: 2, heavy: 7 }` mm/h | Seuils réels utilisés ? |
| `windSpeedThresholdKmh` | Seuil vent fort → `storm` | Existe ? |
| `heatThresholdCelsius` | Déjà dans Swagger | Confirmé comme seul seuil chaleur ? |
| `coldThresholdCelsius` | Seuil froid | Existe ? |
| `humidityThresholdPercent` | Impact surge humidité | Existe ? |
| `visibilityThresholdMeters` | Brouillard / visibilité | Existe ? |
| `fallbackCondition` | Déjà dans Swagger | Quand exactement appliqué ? |
| `staleDataMaxAgeSeconds` | Âge max données avant fallback | Existe ? |

### B. Règles de multiplicateur surge (calibrage)

| Paramètre suggéré | Description | Exemple attendu |
|-------------------|-------------|-----------------|
| `surgeRules` | Table de règles ordonnées par priorité | Voir JSON ci-dessous |
| `surgeRules[].condition` | `clear` \| `rain_light` \| `rain` \| `storm` \| `heat` \| … | |
| `surgeRules[].minMultiplier` | Plancher | `1.0` |
| `surgeRules[].maxMultiplier` | Plafond | `2.5` |
| `surgeRules[].defaultMultiplier` | Valeur par défaut | `1.3` |
| `surgeRules[].curve` | `fixed` \| `linear` \| `step` | Comment varie le coef ? |
| `surgeRules[].intensityBands` | Paliers selon intensité (pluie, chaleur) | `{ from: 35, to: 40, multiplier: 1.2 }` |
| `globalSurgeCap` | Plafond absolu toutes sources confondues | `3.0` |
| `combineMode` | `max` \| `sum` \| `product` | Fusion météo + zone + nuit |
| `roundingMode` | `ceil_0.1` \| `nearest_0.05` | Arrondi affiché client |
| `minTripSurgeXof` | Surge minimum en XOF | Optionnel |

**Proposition de schéma `surgeRules` (à valider / corriger par le backend)** :

```json
{
  "surgeRules": [
    {
      "id": "heat_default",
      "condition": "heat",
      "priority": 10,
      "enabled": true,
      "defaultMultiplier": 1.15,
      "maxMultiplier": 1.8,
      "intensityBands": [
        { "metric": "temperatureCelsius", "from": 35, "to": 39, "multiplier": 1.15 },
        { "metric": "temperatureCelsius", "from": 40, "to": null, "multiplier": 1.5 }
      ],
      "eligibleServiceTypes": ["RIDE", "DELIVERY"]
    },
    {
      "id": "rain_moderate",
      "condition": "rain",
      "priority": 20,
      "enabled": true,
      "defaultMultiplier": 1.25,
      "maxMultiplier": 2.0,
      "intensityBands": [
        { "metric": "precipitationMmPerHour", "from": 0, "to": 2, "multiplier": 1.1 },
        { "metric": "precipitationMmPerHour", "from": 2, "to": 7, "multiplier": 1.25 },
        { "metric": "precipitationMmPerHour", "from": 7, "to": null, "multiplier": 1.6 }
      ]
    }
  ],
  "combineMode": "max",
  "globalSurgeCap": 2.5
}
```

### C. Périmètre géographique du refresh

| Paramètre | Déjà Swagger | Question |
|-----------|--------------|----------|
| `refresh.gridStepKm` | Oui | Impact perf vs précision — valeurs recommandées par contexte ? |
| `refresh.cityRadiusKmDefault` | Oui | Comment lié au catalogue villes ? |
| `refresh.cityOverrides` | Oui | Clé = `cityId` UUID ou slug `abidjan` ? |
| `geohashPrecision` | Oui | Correspondance precision ↔ taille cellule ? |

### D. Lien météo ↔ dispatch ↔ tarification

| Question | Réponse attendue |
|----------|------------------|
| Le surge météo s’applique-t-il au **devis** (`POST /v1/.../quote`) ? | Oui / non — moment du calcul |
| S’applique-t-il au **dispatch** (priorisation, `escalationAction: surge`) ? | Oui / non |
| Comment se combine-t-il avec `zoneOverrides.surgeMultiplier` (`dispatch-config`) ? | `max`, `product`, override manuel gagne ? |
| Comment se combine-t-il avec `pricing-rules.surge_multiplier` (nuit) ? | Formule exacte |
| Le client voit-il la **raison** du surge (météo) dans l’app ? | Champ `surgeReason` ? |
| `activeServiceTypes` exclut-il certains services du surge météo ? | Comportement si hors liste |

---

## DISPATCHER-WEATHER-01 — Rôle dispatcher : pilotage opérationnel

Le compte **dispatcher** (`GET/POST/PATCH /v1/admin/dispatchers`) dispose déjà de permissions granulaires côté front :

| Permission front | Champ API (mapper) | Besoin backend |
|------------------|-------------------|----------------|
| Assigner des courses | `assign_trips` | Existant (dispatch) |
| Carte live | `view_live_map` | Existant |
| Annuler une course | `cancel_trip` | À documenter |
| Forcer dispatch hors règles | `override_dispatch` | À documenter |
| **Ajuster le surge** | `adjust_surge` | **Route + schéma manquants** |

### Demandes spécifiques dispatcher

1. **Quelles actions** `adjust_surge` autorise-t-il ?
   - Multiplicateur manuel temporaire sur une zone ?
   - Override sur une course en cours ?
   - Désactivation surge météo sur une zone pour X minutes ?
2. **Durée de vie** d’un ajustement manuel (TTL, audit, qui peut révoquer).
3. Le dispatcher peut-il **modifier la config météo** (seuils, règles) ou seulement **ajuster en live** ?
4. **Scope géographique** : limité aux `zone_ids` du compte dispatcher ?
5. Faut-il de nouvelles permissions ?
   - `settings.weather.view` / `settings.weather.edit`
   - `ops.surge.adjust` (distinct de config)
   - `ops.weather.refresh` (déclencher refresh sur ses zones)

### Écrans backoffice cibles (après réponse backend)

| Écran | Route | Rôle | Contenu |
|-------|-------|------|---------|
| Météo & calibrage (admin) | `/admin/settings/weather` | Admin | Formulaire complet `weather.config` + règles surge |
| Overrides ville | Onglet page météo | Admin | `cityOverrides` + seuils locaux |
| Météo franchise | `/franchise/settings/weather` | Franchise | Config effective + règles autorisées |
| Fiche dispatcher | `/admin/settings/dispatchers/[id]` | Admin | Lier zones + permissions météo/surge |
| Console dispatch | `/admin/ops/dispatch` | Dispatcher | Bandeau météo zone + surge actuel + bouton ajustement |
| Détail course | Fiche commande | Dispatcher | `surgeMultiplier`, `surgeSources: ["weather","zone","manual"]` |

---

## WEATHER-OPS-01 — Observabilité & refresh

| Besoin | Route / mécanisme demandé |
|--------|---------------------------|
| Statut scheduler | Déjà partiel (`scheduler.enabled`, `nextRunAt`) — documenter |
| Dernier refresh réussi / échoué | `GET /v1/admin/weather/status` |
| Nombre de cellules en cache | Métrique dans status |
| Logs erreurs provider | `GET /v1/admin/weather/jobs?page=` |
| Refresh manuel scope | Global (admin) · franchise · ville · zone |
| Coût / rate limit provider | Alertes si quota dépassé |

**Permissions RBAC demandées** :

- `settings.weather.view`
- `settings.weather.edit`
- `settings.weather.refresh`
- `ops.surge.view`
- `ops.surge.adjust` (dispatcher)
- `ops.weather.view` (dispatcher — lecture conditions live)

---

## SWAGGER-WEATHER-01 — Documentation OpenAPI exigée

Pour **chaque route** citée dans ce document :

1. **Request body** complet (PUT/PATCH) avec tous les champs de calibrage
2. **Response 200** avec exemple JSON réel incluant `document`, `effective`, `scheduler`
3. **Enums** : `fallbackCondition`, conditions surge, `combineMode`, `curve`
4. **Exemple `GET /v1/admin/weather-config`** copiable dans les mocks front
5. **Exemple `POST /v1/admin/weather/simulate`** avec entrée lat/lng et sortie multiplicateur détaillé
6. Champs **read-only** vs **writable** vs **dispatcher-only**
7. Politique `schemaVersion` et migration

---

## Exemple de réponse GET attendue (proposition front)

```json
{
  "status": "ok",
  "generatedAt": "2026-06-16T10:00:00.000Z",
  "settingKey": "weather.config",
  "schemaVersion": 2,
  "document": {
    "schemaVersion": 2,
    "enabled": true,
    "cacheEnabled": true,
    "cacheTtlSeconds": 900,
    "geohashPrecision": 6,
    "heatThresholdCelsius": 35,
    "fetchTimeoutMs": 3000,
    "apiBaseUrl": null,
    "fallbackCondition": "clear",
    "activeServiceTypes": ["RIDE", "DELIVERY", "DELIVERY_CARGO"],
    "refresh": {
      "enabled": true,
      "intervalMinutes": 15,
      "gridStepKm": 1.1,
      "cityRadiusKmDefault": 12,
      "cityRadiusKmMetro": 25,
      "metroMinZones": 5,
      "batchConcurrency": 8,
      "maxCellsPerCity": 600,
      "cityOverrides": {
        "abidjan": { "enabled": true, "radiusKm": 25, "gridStepKm": 0.8 }
      }
    },
    "surgeRules": [],
    "combineMode": "max",
    "globalSurgeCap": 2.5
  },
  "effective": {
    "countryCode": "CI",
    "cityId": "uuid-abidjan",
    "resolvedFrom": ["global", "cities.abidjan"],
    "heatThresholdCelsius": 35,
    "surgeRules": []
  },
  "scheduler": {
    "enabled": true,
    "refreshIntervalMs": 900000,
    "nextRunAt": "2026-06-16T10:15:00.000Z",
    "lastRunAt": "2026-06-16T10:00:00.000Z",
    "lastRunStatus": "ok",
    "cellsRefreshed": 412
  }
}
```

---

## Priorisation suggérée

| ID | Priorité | Sujet | Bloquant front |
|----|----------|-------|----------------|
| **WEATHER-CALIB-01** | **P0** | Schéma `surgeRules` + formules seuils → multiplicateur | Page calibrage météo |
| **WEATHER-CONF-01** | **P0** | Document `weather.config` complet + `effective` | Formulaire admin / franchise |
| **SWAGGER-WEATHER-01** | **P0** | Exemples JSON Swagger | Intégration fiable |
| **DISPATCHER-WEATHER-01** | **P0** | API `adjust_surge` + scope dispatcher | Console dispatch |
| **WEATHER-OPS-01** | P1 | Status jobs / simulate / cells | Debug opérationnel |
| Overrides pays / ville / zone | P1 | PATCH hiérarchiques | Multi-pays |

---

## Livrables attendus de l’équipe backend

1. **Réponse structurée** (markdown ou JSON Schema) listant **tous** les paramètres météo réels, y compris calibrage surge encore en dur dans le code.
2. **Formule documentée** : condition météo brute → condition normalisée → multiplicateur → fusion avec zone / tarif / ajustement dispatcher.
3. **Exemple `GET /v1/admin/weather-config`** complet (copiable mocks).
4. **Spécification** routes dispatcher (`adjust_surge`, lecture live) + matrice RBAC.
5. **Guide de calibrage** recommandé (valeurs initiales CI / Abidjan) pour mise en prod.
6. **Confirmation** du lien avec `dispatch-config` (`escalationAction: surge`, `zoneOverrides.surgeMultiplier`).

---

## Références front (pour implémentation après réponse backend)

| Sujet | Fichiers |
|-------|----------|
| Types météo | `src/features/settings/api/adminPlatformConfig.api.types.ts` |
| Page météo admin | `src/features/settings/pages/SettingsWeatherPage.tsx` |
| Page météo franchise | `src/features/franchise/pages/FranchiseSettingsWeatherPage.tsx` |
| Services API | `adminPlatformConfig.service.ts`, `franchiseSettings.service.ts` |
| Dispatchers | `src/features/settings/components/DispatcherForm.tsx` |
| Liens API | `src/core/api/links.ts` (`weatherConfig`, `weatherRefresh`) |
| Nav franchise | `src/portals/franchise/franchiseNav.ts` → `/franchise/settings/weather` |
| Document dispatch | `docs/dispatcher_caracteristique_for_front.md` |

---

*Document rédigé pour transmission à l’IA / équipe backend UpJunoo. Toute modification de schéma doit incrémenter `schemaVersion` et être rétrocompatible ou accompagnée d’un guide de migration.*
