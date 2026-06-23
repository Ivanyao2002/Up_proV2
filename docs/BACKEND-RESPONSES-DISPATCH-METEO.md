# Réponses backend — Dispatch & Météo (interfaces admin)

> **Document de référence backend UpJunoo Pro**  
> **Généré** : 12 juin 2026  
> **Source** : code source `src/modules/dispatch/` + `src/modules/weather/` + `src/modules/admin/`  
> **Destinataire** : équipe frontend admin (`Up_prov2`)

---

## Sommaire

- [§4.1 Architecture & routes](#41-architecture--routes)
- [§4.2 Fusion des overrides (dispatch)](#42-fusion-des-overrides-dispatch)
- [§4.3 Vagues & offres](#43-vagues--offres-cœur-moteur)
- [§4.4 Matching & priorité chauffeur](#44-matching--priorité-chauffeur)
- [§4.5 File d'attente & réassignation](#45-file-dattente--réassignation)
- [§4.6 Services & typologie commande](#46-services--typologie-commande)
- [§4.7 Comptes dispatchers](#47-comptes-dispatchers)
- [§4.8 Observabilité dispatch](#48-observabilité-dispatch-fiche-commande)
- [§4.9 Capacité & hygiène](#49-capacité--hygiène)
- [§4.10 Météo — configuration](#410-météo--configuration)
- [§4.11 Météo — refresh & scheduler](#411-météo--refresh--scheduler)
- [§4.12 Météo — lien surge, zones, dispatch](#412-météo--lien-surge-zones-dispatch)
- [Exemples JSON complets](#exemples-json-complets)
- [Matrice paramètres](#matrice-paramètres--statut-réel)

---

## §4.1 Architecture & routes

### Q-D01 — Source de vérité : `dispatch-config` vs `settings/dispatch-rules`

**R :** **`/v1/admin/dispatch-config` est la source de vérité.** À utiliser exclusivement.

| Route | Rôle | À utiliser ? |
|-------|------|-------------|
| `GET/PUT /v1/admin/dispatch-config` | Lit/écrit le document complet `dispatch.config` dans `system_settings` | ✅ **Oui — route principale** |
| `GET/PUT /v1/admin/settings/dispatch-rules` | Alias de compatibilité front — lit le même document mais renvoie une **projection simplifiée** à 6 champs mock | ⚠️ **Legacy uniquement** |

`settings/dispatch-rules` appelle `dispatchRulesSettings()` qui projette `dispatch.config.global.RIDE` en 6 champs (`match_radius_km`, `assign_timeout_sec`, etc.). Le `PUT` écrit dans une clé `simplifiedRules` sans impacter le moteur réel. **Ne pas brancher de nouveaux formulaires sur cette route.**

**Recommandation** : conserver `settings/dispatch-rules` en lecture seule pour backward compat, désactiver son PUT côté front.

---

### Q-D02 — Source de vérité : `weather-config` vs `settings/weather`

**R :** **Les deux routes sont strictement identiques** — elles appellent les mêmes fonctions `getWeatherConfigAdminView()` et `upsertWeatherConfigDocument()`. Aucun doublon fonctionnel.

| Route | Comportement |
|-------|-------------|
| `GET /v1/admin/weather-config` | ✅ Identique |
| `PUT /v1/admin/weather-config` | ✅ Identique + déclenche `scheduleNextWeatherRefresh(0)` |
| `GET /v1/admin/settings/weather` | ✅ Identique (alias) |
| `PUT /v1/admin/settings/weather` | ✅ Identique (alias) + déclenche `scheduleNextWeatherRefresh(0)` |

**Recommandation** : standardiser sur `/v1/admin/weather-config` côté front, les deux fonctionnent.

---

### Q-D03 — Pattern de réponse standard

**R :** Oui, le pattern est cohérent pour `dispatch-config` et `weather-config` :

```json
{
  "settingKey": "dispatch.config",
  "schemaVersion": 2,
  "document": { ... },
  "seedTemplate": { ... },
  "effective": { ... },
  "waveSchedule": { ... }
}
```

> **Note** : le champ `generatedAt` et `fromDatabase` sont présents dans `weather-config` mais pas dans `dispatch-config` (version actuelle). À aligner si besoin.

---

### Q-D04 — Champ `effective` dans la réponse GET

**R :** ✅ **Le champ `effective` est déjà présent** dans `GET /v1/admin/dispatch-config`.

```json
"effective": {
  "countryCode": "CI",
  "RIDE": { ... config résolue RIDE ... },
  "DELIVERY_CARGO": { ... config résolue DELIVERY_CARGO ... }
},
"waveSchedule": {
  "RIDE": [
    { "wave": 1, "radiusKm": 2 },
    { "wave": 2, "radiusKm": 4 }
  ],
  "DELIVERY_CARGO": [...]
}
```

Passer `?countryCode=CI` pour résoudre l'`effective` sur un pays donné.

---

### Q-D05 — Audit-log

**R :** Les modifications `dispatch-config` et `weather-config` écrivent dans `system_settings` avec `updated_by = adminId` et `updated_at`. La table `audit_log` est consultable via `GET /v1/admin/audit-log`. Il n'existe pas d'entrée dédiée `dispatch.config.updated` — le suivi se fait via `system_settings.updated_by` + `updated_at`.

---

### Q-D06 — Modifications immédiates ou cache flush

**R :** **Immédiates avec invalidation Redis.**

- Après `PUT /v1/admin/dispatch-config` → `invalidateDispatchConfigCache()` supprime la clé `dispatch:config:document` en Redis.
- Après `PUT /v1/admin/weather-config` → `invalidateWeatherConfigCache()` supprime `weather:config:document` + déclenche `scheduleNextWeatherRefresh(0)`.
- **TTL du cache Redis** : 60 secondes. Sans PUT, l'ancienne config peut subsister jusqu'à 60 s.
- **Aucun redémarrage worker requis.**

---

### Q-D07 — `schemaVersion` actuelle

**R :**

| Config | `schemaVersion` | Politique |
|--------|----------------|-----------|
| `dispatch.config` | **2** (v1 = format legacy `{RIDE:{...}}`, v2 = `{global:{RIDE:{...}}, countries:{...}}`) | Migration automatique via `normalizeLegacyDocument()` |
| `weather.config` | **1** | Pas de migration nécessaire à ce jour |

---

## §4.2 Fusion des overrides (dispatch)

### Q-D10 — Ordre de priorité exact

**R :** L'implémentation actuelle supporte **2 niveaux** : `global` → `country`.

```
code fallback (dispatch.defaults.ts)
  ↑ overridé par
global[serviceType]  (document.global.RIDE)
  ↑ overridé par
countries[countryCode][serviceType]  (document.countries.CI.RIDE)
```

Les niveaux `city`, `franchise`, `partner`, `zone`, `serviceType` **ne sont pas encore implémentés** dans le moteur de fusion. Le document JSON peut les stocker mais ils ne sont pas lus par `mergeServiceLayers()`.

**Niveaux à implémenter (roadmap)** :
- `cities[cityId][serviceType]`
- `franchises[franchiseId][serviceType]`
- `zones[zoneId]`
- `serviceTypes[serviceType]` (override global par service)

---

### Q-D11 — Override remplace ou merge

**R :** **Deep merge** (fusion profonde récursive). `deepMergeRecords()` merge les objets imbriqués. Les tableaux et scalaires sont **remplacés** par la valeur du niveau le plus spécifique. Exemple :

```json
// global.RIDE
{ "wave": { "maxWaves": 2, "waveIntervalSec": 12 }, "offerTtlSeconds": 12 }

// countries.CI.RIDE (override partiel)
{ "offerTtlSeconds": 20 }

// résultat effective.CI.RIDE
{ "wave": { "maxWaves": 2, "waveIntervalSec": 12 }, "offerTtlSeconds": 20 }
```

---

### Q-D12 — Désactiver le dispatch pour une zone

**R :** Pas de champ `enabled` par zone dans l'implémentation actuelle. La désactivation passe par retrait de l'UUID de zone de `active_zone_ids` (champ front mock — non lu par le moteur). **À implémenter côté backend si besoin.**

---

### Q-D13 — Mapping zones réseau ↔ zoneId dispatch

**R :** Le moteur dispatch actuel ne lit pas de `zoneId` pour les overrides. `activeZoneIds` est un champ **front mock uniquement** (non consommé par `mergeServiceLayers`). Les zones réseau sont consultables via `GET /v1/zones`.

---

## §4.3 Vagues & offres (cœur moteur)

### Q-D20 — Noms JSON exacts

**R :** Voici les noms **officiels** tels qu'implémentés dans `dispatch.types.ts` et `dispatch.defaults.ts` :

| Nom front suggéré | Nom JSON réel | Emplacement |
|-------------------|---------------|-------------|
| `waveRadiiKm` | **Calculé** via `radiusIncrementKm` + `maxRadiusKm` | `wave.radiusIncrementKm` |
| `waveIntervalSec` | ✅ `wave.waveIntervalSec` | `wave.waveIntervalSec` |
| `offerTtlSec` | ✅ `offerTtlSeconds` | racine du service config |
| `maxWaves` | ✅ `wave.maxWaves` | `wave.maxWaves` |
| `matchRadiusKm` | ✅ `maxRadiusKm` | racine (= rayon vague 1) |
| `maxDispatchDurationSec` | ✅ `wave.globalTimeoutSec` | `wave.globalTimeoutSec` |

> ⚠️ Il n'y a pas de tableau `waveRadiiKm: [2,4,6,8]`. Le modèle utilise `maxRadiusKm` (rayon initial) + `wave.radiusIncrementKm` (delta par vague). Le frontend peut afficher la liste calculée via le champ `waveSchedule` de la réponse GET.

---

### Q-D21 — Min / max des paramètres

**R :**

| Paramètre | Min | Max | Défaut RIDE | Défaut DELIVERY_CARGO |
|-----------|-----|-----|-------------|----------------------|
| `maxRadiusKm` | — | — | **2** | 2 |
| `wave.radiusIncrementKm` | — | — | **2** | 2 |
| `wave.maxRadiusKmCap` | — | — | **4** (base+increment) | 4 |
| `wave.maxWaves` | 1 | — | **2** | 2 |
| `wave.waveIntervalSec` | — | — | **12** | 12 |
| `wave.globalTimeoutSec` | — | — | **120** | 120 |
| `offerTtlSeconds` | — | — | **12** | 12 |
| `candidateLimit` | — | — | **8** | 10 |
| `driverSearchLimit` | 1 | 5000 | **500** | 500 |
| `minDriverWalletBalanceXof` | 0 | — | **0** | 0 |

---

### Q-D22 — `maxWaves` et comportement après dernière vague

**R :** Champ `wave.maxWaves` (min 1). Après la dernière vague :

1. Si `chain.emergencyEnabled = true` et passe urgence non encore tentée → **passe urgence** (rayon élargi `radiusBonusKm`).
2. Sinon → `finalizeNoDriver()` → statut `no_driver`, reason = `max_waves_reached` ou `emergency_no_candidates`.
3. Si `wave.globalTimeoutSec` atteint avant `maxWaves` → `no_driver`, reason = `global_timeout`.

Pas d'escalade `notify_dispatcher` automatique dans l'implémentation actuelle.

---

### Q-D23 — `offerMode` : lesquels sont implémentés

**R :** Mode d'offre défini dans `strategies.offers.mode` :

| Mode | Implémenté | Comportement |
|------|-----------|-------------|
| `sequential` | ✅ **Oui** | Un chauffeur à la fois (standard actuel) |
| `batch` | ✅ **Oui** (strategies preset) | Envoi groupé `batchSize` chauffeurs |
| `broadcast` | ❌ Non | Non implémenté |

Le preset par défaut est `legacy` → mode `sequential`, `batchSize: 8`, `sequentialQueueSize: 12`.

---

### Q-D24 — Plusieurs offres simultanées au même chauffeur

**R :** Non géré côté backend dispatch. Le set Redis `dispatch:offered:{serviceType}:{orderId}` empêche de ré-envoyer une offre au même chauffeur **pour la même commande**. Aucune protection multi-commandes simultanées.

---

### Q-D25 — Cooldown après refus répétés

**R :** Configurable dans `strategies.penalties` :

```json
"penalties": {
  "enabled": false,
  "scoreReductionPerRefusal": 0,
  "penaltyTtlMinutes": 2,
  "consecutiveRefusalThreshold": 3
}
```

Par défaut `enabled: false`. Quand activé, le score du chauffeur est réduit après `consecutiveRefusalThreshold` refus consécutifs. Pas de blocage total — réduction de score uniquement dans le classement.

---

### Q-D26 — Durée max totale (`maxDispatchDurationSec`)

**R :** Champ `wave.globalTimeoutSec`. **Défaut : 120 secondes.** Au-delà, le dispatch est clôturé `no_driver` quelle que soit la vague en cours.

---

## §4.4 Matching & priorité chauffeur

### Q-D30 — Algorithme `balanced`

**R :** Le scoring est défini par `weights` :

```json
"weights": {
  "distance": 0.7,
  "rating": 0.2,
  "reliability": 0.1
}
```

`score = distance×0.7 + rating×0.2 + reliability×0.1` (mode `legacy`). Le mode `dynamic` (non activé par défaut) inclut `acceptRate`, `idleBonus`, `refusalPenalty`, `chainPenalty`.

Il n'y a pas d'enum `priorityMode: balanced|distance|rating` dans le backend — c'est modélisé par les poids. Le champ `strategies.preset` (`legacy|pro|full`) est le sélecteur réel.

---

### Q-D31 — Filtres chauffeurs

**R :** Filtres **actifs dans l'implémentation** :

| Filtre | Implémenté | Paramètre |
|--------|-----------|-----------|
| Note min | ❌ Non | — |
| Catégorie véhicule | ✅ Oui | `ride_category_code` vs catégorie commande |
| Moyen de paiement | ✅ Oui | `minDriverWalletBalanceXof` |
| Chauffeur hors ligne | ✅ Oui | `availability_status in ('online','available')` |
| Chauffeur en course | ✅ Oui | filtre `busy_on_trip` (via SQL) |
| `acceptsRides` / `acceptsDelivery` | ✅ Oui | `driver_preferences` |
| `driverSearchLimit` | ✅ Oui | limite brute requête géo |
| `candidateLimit` | ✅ Oui | nb max candidats retenus après scoring |

---

### Q-D32 — `matchRadiusKm` : premier rayon ou fixe

**R :** `maxRadiusKm` est le **rayon de la vague 1** (rayon initial). Le rayon grandit à chaque vague :

```
vague N = min(maxRadiusKm + (N-1) × wave.radiusIncrementKm, wave.maxRadiusKmCap)
```

Ce n'est **pas** un rayon fixe — il évolue à chaque vague.

---

### Q-D33 — `maxCandidatesReturned`

**R :** Champ `candidateLimit` (défaut RIDE : **8**, DELIVERY_CARGO : **10**). Correspond au nombre de chauffeurs retenus après scoring géographique + score. Le champ `driverSearchLimit` (défaut 500) est la limite brute de la requête géo initiale avant filtrage.

---

## §4.5 File d'attente & réassignation

### Q-D40 — `autoReassign` : déclencheur

**R :** Le champ `autoAssign` (≠ `autoReassign`) est `false` par défaut. Il n'y a pas de mécanisme `autoReassign` séparé — la "réassignation" est gérée par le cycle vagues :

1. Offre expirée → `offer_timeout` → chauffeur suivant dans la queue séquentielle (`offerNextSequentialCandidate`).
2. Queue épuisée → nouvelle vague (`runDispatchWave` wave+1).

Le champ front `auto_reassign` n'est pas lu par le moteur actuellement.

---

### Q-D41 — `reassignMaxAttempts` et `reassignDelaySec`

**R :** Ces paramètres n'existent pas dans l'implémentation actuelle. La limite est contrôlée par `wave.maxWaves` × `wave.waveIntervalSec` et `wave.globalTimeoutSec`.

---

### Q-D42 — Actions d'escalade

**R :** Actions implémentées après épuisement des vagues :

| Action | Implémentée | Déclencheur |
|--------|-----------|-------------|
| `expand_radius` (passe urgence) | ✅ Oui | `chain.emergencyEnabled = true` |
| `no_driver` | ✅ Oui | Fin des vagues ou timeout global |
| `notify_dispatcher` | ❌ Non | — |
| `cancel` automatique | ❌ Non | — |
| `surge` automatique | ❌ Non | — |

---

## §4.6 Services & typologie commande

### Q-D50 — Liste complète `serviceType` avec dispatch auto

**R :**

| ServiceType | Dispatch auto | Implémenté |
|------------|--------------|-----------|
| `RIDE` | ✅ Oui | ✅ |
| `DELIVERY_CARGO` | ✅ Oui | ✅ |
| `DELIVERY` | Alias de `DELIVERY_CARGO` | ✅ (normalisé) |
| `RIDES` | Alias de `RIDE` | ✅ (normalisé) |
| `FREIGHT` | ❌ Non | ❌ |
| `RENTAL` | ❌ Non | ❌ |

`normalizeServiceType()` accepte : `RIDE`, `RIDES`, `DELIVERY`, `DELIVERIES`, `DELIVERY_CARGO`.

---

### Q-D51 — `autoStartDispatchOnCreate`

**R :** Ce champ n'existe pas dans le document config. Le dispatch est déclenché **manuellement** via `POST /v1/dispatch/{serviceType}/{orderId}/retry` ou **automatiquement** par le worker BullMQ quand une commande passe en statut `requested`.

---

### Q-D52 — Dispatch manuel console

**R :** Route unifiée :

```
POST /v1/dispatch/{serviceType}/{orderId}/retry
```

Fonctionne pour RIDE et DELIVERY_CARGO. Correspond à `startDispatch()` — démarre ou redémarre le dispatch (reset offres + vague 1).

---

## §4.7 Comptes dispatchers

### Q-D60 — Schéma POST/PATCH complet

**R :** Les dispatchers sont stockés dans `system_settings.key = 'admin.dispatchers'` (JSON array, pas de table dédiée).

**Body POST `POST /v1/admin/dispatchers`** :

```json
{
  "name": "Konan Yves",
  "email": "yves@upjunoo.com",
  "phone": "+22507000001",
  "franchise_id": "uuid-franchise",
  "zone_ids": ["uuid-zone-1"],
  "status": "active",
  "permissions": ["assign_trips", "view_live_map"],
  "shift_label": "Matin 06h-14h"
}
```

**Champs obligatoires** : `email` (ou `name`). Tous les autres sont optionnels.  
**Réponse** : objet dispatcher avec `id` (UUID généré), `created_at`, `updated_at`.

---

### Q-D61 — `permissions` : liste exhaustive supportée

**R :** Le backend stocke `permissions` comme un **tableau libre de strings** — pas d'enum validé côté API actuellement. La validation se fait côté front.

Permissions **reconnues côté frontend** à standardiser :

```
assign_trips
view_live_map
cancel_trip
override_dispatch
adjust_surge
```

> ⚠️ **À implémenter** : validation enum côté backend + middleware de vérification permission sur les routes protégées.

---

### Q-D62 — `shiftRequired`

**R :** Non implémenté. Le champ `shift_label` est stocké comme string libre mais le backend ne vérifie pas de créneau actif.

---

### Q-D63 — Dispatcher avec plusieurs franchises

**R :** Le champ `franchise_id` est un **string unique** dans l'implémentation actuelle. Multi-franchise non supporté. Pour contournement : stocker dans un champ `franchise_ids` array (le backend le stocke tel quel, pas de validation).

---

### Q-D64 — Lien dispatcher ↔ user Supabase

**R :** Aucun lien avec `auth.users` Supabase dans l'implémentation actuelle. Les dispatchers sont des entrées JSON dans `system_settings`. **Pas de lien `userId`.**

---

### Q-D65 — Routes `suspend`/`activate` dédiées vs `PATCH { status }`

**R :** Les deux fonctionnent et appellent la même fonction `patchDispatcher(id, { status })`.

```
PATCH /v1/admin/dispatchers/{id}/suspend   → { status: 'suspended' }
PATCH /v1/admin/dispatchers/{id}/activate  → { status: 'active' }
PATCH /v1/admin/dispatchers/{id}           → body libre (inclut status si voulu)
```

**Privilégier les routes dédiées** pour la lisibilité UI.

---

## §4.8 Observabilité dispatch (fiche commande)

### Q-D70 — Schéma `GET /v1/dispatch/{serviceType}/{orderId}/status`

**R :** Réponse réelle de `getDispatchStatus()` :

```json
{
  "orderId": "uuid-commande",
  "serviceType": "RIDE",
  "status": "dispatching",
  "dispatch": {
    "wave": 2,
    "startedAt": "2026-06-12T10:00:00.000Z",
    "updatedAt": "2026-06-12T10:00:24.000Z",
    "offerMode": "sequential",
    "strategiesPreset": "legacy",
    "offers": [
      {
        "offerId": "uuid-offer",
        "driverId": "uuid-driver",
        "vehicleId": "uuid-vehicle",
        "status": "pending",
        "expiresAt": "2026-06-12T10:00:36.000Z",
        "distanceKm": 1.4,
        "score": 0.87,
        "rideCategoryCode": "ECO"
      }
    ],
    "emergencyChainAttempted": false
  }
}
```

> `waveRadiusKm` n'est pas dans la réponse directe — calculable via `maxRadiusKm + (wave-1) × radiusIncrementKm`.

---

### Q-D71 — Schéma `GET /v1/dispatch/{serviceType}/{orderId}/logs`

**R :** Réponse : `{ "logs": [...] }`. Chaque entrée = ligne `dispatch_offer_logs` :

```json
{
  "id": "uuid",
  "service_type": "RIDE",
  "order_id": "uuid-commande",
  "offer_id": "uuid-offer",
  "driver_id": "uuid-driver",
  "vehicle_id": "uuid-vehicle",
  "event_type": "offer_sent",
  "event_status": "recorded",
  "reason": null,
  "distance_km": 1.4,
  "score": 0.87,
  "driver_category": "ECO",
  "order_category": "ECO",
  "wallet_balance_xof": 500,
  "expires_at": "2026-06-12T10:00:36.000Z",
  "actor_user_id": null,
  "metadata": {},
  "created_at": "2026-06-12T10:00:12.000Z"
}
```

**`event_type` possibles** : `offer_sent`, `offer_timeout`, `offer_accepted`, `offer_rejected`, `offer_received`, `dispatch_started`, `dispatch_no_driver`, `wave_started`, `emergency_chain`.

---

### Q-D72 — Body `POST /v1/dispatch/{serviceType}/{orderId}/retry`

**R :** **Aucun body requis.** La route appelle directement `startDispatch(serviceType, orderId)` — reset complet (offres effacées, retour vague 1). Pas de paramètre pour forcer une vague ou élargir le rayon.

---

### Q-D73 — Événements WebSocket dispatch

**R :** Les événements temps réel dispatch sont émis via le système d'events interne. Les events front à écouter côté console :

| Event | Déclencheur |
|-------|------------|
| `dispatch:offer:sent` | Offre envoyée à un chauffeur |
| `dispatch:offer:accepted` | Chauffeur accepte |
| `dispatch:offer:rejected` | Chauffeur refuse |
| `dispatch:offer:timeout` | Offre expirée |
| `dispatch:wave:started` | Nouvelle vague |
| `dispatch:no_driver` | Fin dispatch sans attribution |

> ⚠️ Vérifier le canal WebSocket exact dans `src/modules/realtime/` pour les noms de rooms/events.

---

## §4.9 Capacité & hygiène

### Q-D80 — Contenu `GET /v1/admin/dispatch-capacity`

**R :** Réponse complète de `getDispatchCapacityAudit()` :

```json
{
  "generatedAt": "2026-06-12T10:00:00.000Z",
  "locationMaxAgeSec": 300,
  "filters": {
    "countryCode": "CI",
    "franchiseId": null
  },
  "global": {
    "drivers_total": 450,
    "online_or_available": 120,
    "online_approved": 98,
    "dispatch_base": 72,
    "ride_eco_orders": 55,
    "ride_confort_orders": 30,
    "ride_confort_plus_orders": 12,
    "ride_premium_orders": 5,
    "delivery_orders": 17,
    "with_location": 130,
    "fresh_location": 80,
    "online_approved_without_fresh_location": 18,
    "online_approved_wallet_blocked": 6,
    "online_approved_vehicle_blocked": 4,
    "busy_on_trip": 48
  },
  "byFranchise": [...],
  "byCountryCity": [...],
  "blockers": [
    { "blocker": "missing_fresh_location", "count": 18 },
    { "blocker": "wallet_insufficient", "count": 6 }
  ]
}
```

**Query params** : `locationMaxAgeSec` (30-600s, défaut env), `countryCode`, `franchiseId`.

---

### Q-D81 — `dispatch-fleet-hygiene` vs `fleet/hygiene/scan`

**R :** Ce sont **deux fonctions différentes** :

| Route | Fonction | Périmètre |
|-------|---------|-----------|
| `POST /v1/admin/dispatch-fleet-hygiene` | `runDispatchFleetHygiene()` | Passe chauffeurs **en ligne sans localisation fraîche** → `offline`. Body : `{ dryRun: true, countryCode, franchiseId, locationMaxAgeSec, reason }` |
| `POST /v1/admin/fleet/hygiene/scan` | `runFleetHygieneScan(false)` | Vérifie cohérence **KYC** chauffeurs (documents manquants → statut incohérent). Dry-run |
| `POST /v1/admin/fleet/hygiene/apply` | `runFleetHygieneScan(true)` | Même chose + applique les corrections KYC |

> **`dispatch-fleet-hygiene`** = nettoyage disponibilité GPS  
> **`fleet/hygiene/scan|apply`** = correction statuts KYC

---

### Q-D82 — Résultat hygiene affichable

**R :** Oui. `runDispatchFleetHygiene({ dryRun: true })` retourne :

```json
{
  "dryRun": true,
  "updated": 0,
  "candidates": 12,
  "sampleDriverIds": ["uuid1", "uuid2", "...jusqu'à 20"],
  "locationMaxAgeSec": 300,
  "reason": "stale_driver_location",
  "filters": { "countryCode": "CI", "franchiseId": null }
}
```

Afficher `candidates` (nombre) + `sampleDriverIds` en UI. Bouton « Appliquer » → même call avec `dryRun: false`.

---

## §4.10 Météo — configuration

### Q-W01 — Schéma complet officiel `weather-config.document`

**R :** Type `WeatherConfigDocument` (source de vérité : `weather.config.ts`) :

```typescript
type WeatherConfigDocument = {
  schemaVersion: number;        // 1
  enabled: boolean;
  cacheEnabled: boolean;
  cacheTtlSeconds: number;      // [60, 86400]
  geohashPrecision: number;     // [4, 8]
  heatThresholdCelsius: number; // [30, 50]
  fetchTimeoutMs: number;       // [500, 30000]
  apiBaseUrl: string | null;    // null = utilise WEATHER_API_BASE_URL env
  fallbackCondition: 'clear' | 'rain' | 'storm' | 'heat';
  activeServiceTypes: string[]; // ['RIDE', 'DELIVERY_CARGO']
  refresh: {
    enabled: boolean;
    intervalMinutes: number;      // [1, 1440]
    gridStepKm: number;           // [0.3, 10]
    cityRadiusKmDefault: number;  // [1, 80]
    cityRadiusKmMetro: number;    // [1, 120]
    metroMinZones: number;        // [1, 50]
    batchConcurrency: number;     // [1, 64]
    maxCellsPerCity: number;      // [10, 5000]
    cityOverrides: Record<string, {
      enabled?: boolean;
      radiusKm?: number;
      gridStepKm?: number;
    }>;
  };
}
```

---

### Q-W02 — Champs read-only

**R :** Le champ `scheduler` dans la réponse GET est **calculé** (non stocké) :

```json
"scheduler": {
  "refreshIntervalMs": 900000,
  "refreshEnabled": true
}
```

`scheduler.nextRunAt` **n'est pas exposé** dans l'implémentation actuelle — il est géré par BullMQ en interne. Les champs du document lui-même sont tous éditables via PUT.

---

### Q-W03 — `heatThresholdCelsius` : déclenche quoi

**R :** Seuil de chaleur utilisé par le module météo pour classifier une condition comme `heat`. Impacte :
1. La classification de `fallbackCondition` → condition météo retournée si l'API indisponible.
2. Le profil traffic météo dispatch : si `metadata.weather = 'heat'`, `strategies.traffic.weather.heat` applique `etaMultiplier` + `radiusBonusKm`.

**Ne déclenche pas de surge automatique** dans l'implémentation actuelle.

---

### Q-W04 — `activeServiceTypes`

**R :** Filtre les services pour lesquels les données météo sont calculées et injectées. Défaut : `['RIDE', 'DELIVERY_CARGO']`. Les autres services (FREIGHT, RENTAL) ne reçoivent pas de calcul météo.

---

### Q-W05 — `apiBaseUrl` : quelle API externe

**R :** **Open-Meteo** (`https://api.open-meteo.com`). C'est une API **gratuite** sans clé API. `apiBaseUrl: null` dans le document = utilise `WEATHER_API_BASE_URL` depuis les variables d'environnement (défaut = URL Open-Meteo).

---

### Q-W06 — `fallbackCondition`

**R :** Valeur météo retournée si l'API externe est indisponible ou timeout. Enum : `'clear' | 'rain' | 'storm' | 'heat'`. Défaut : depuis `env.WEATHER_FALLBACK_CONDITION` (généralement `'clear'`).

---

### Q-W07 — `geohashPrecision`

**R :** Précision de la grille geohash pour le cache météo Redis. **[4, 8]**. Valeur plus haute = plus de granularité géographique + plus de clés Redis.

| Précision | Taille cellule approx. | Usage |
|-----------|----------------------|-------|
| 4 | ~39 km × 20 km | Vue région |
| 5 | ~5 km × 5 km | Vue ville (recommandé) |
| 6 | ~1.2 km × 0.6 km | Micro-zone |

Défaut : depuis `env.WEATHER_GEOHASH_PRECISION`.

---

### Q-W08 — `cacheTtlSeconds` vs tuiles Redis

**R :** `cacheTtlSeconds` est le TTL appliqué aux **données météo par geohash** en Redis. Distinct du TTL du document config lui-même (60s). La valeur `[60, 86400]` = entre 1 min et 24h.

---

## §4.11 Météo — refresh & scheduler

### Q-W10 — `POST /v1/admin/weather/refresh` : synchrone ou async

**R :** **Job async** via BullMQ (`scheduleNextWeatherRefresh(0)`). La réponse est immédiate, le job est mis en file. Pas de `jobId` retourné dans la réponse actuelle.

---

### Q-W11 — Durée typique d'un refresh Abidjan

**R :** Dépend de `refresh.gridStepKm` et `cityRadiusKmMetro`. Avec défauts (gridStep 1.1 km, radius 25 km) : environ **200-400 cellules** à fetch. Avec `batchConcurrency: 8` → ~25-50 requêtes HTTP parallèles → **10-30 secondes** en conditions normales.

---

### Q-W12 — Règles métier grille

**R :**

| Paramètre | Rôle | Défaut |
|-----------|------|--------|
| `gridStepKm` | Pas de la grille de points météo (espacement entre cellules) | **1.1 km** |
| `cityRadiusKmDefault` | Rayon de couverture ville standard | **12 km** |
| `cityRadiusKmMetro` | Rayon élargi pour métropoles (`metroMinZones` zones min) | **25 km** |
| `metroMinZones` | Nb min de zones pour qualifier une ville de "métro" | **5** |
| `batchConcurrency` | Requêtes météo parallèles max | **8** |
| `maxCellsPerCity` | Nb max de cellules par ville (sécurité) | **600** |

---

### Q-W13 — Format `refresh.cityOverrides`

**R :** Clé = **slug ville en minuscules** (normalisé automatiquement) :

```json
"cityOverrides": {
  "abidjan": {
    "enabled": true,
    "radiusKm": 35,
    "gridStepKm": 0.8
  },
  "bouake": {
    "radiusKm": 15
  }
}
```

Les clés envoyées avec majuscules (`Abidjan`) sont normalisées en `abidjan`.

---

### Q-W14 — GET jobs/history

**R :** Route **non exposée** dans l'API actuelle. Les logs BullMQ sont accessibles via Redis directement. **À implémenter** si besoin d'un historique visible en admin.

---

### Q-W15 — `scheduler.nextRunAt` : fuseau horaire

**R :** Le champ `scheduler.nextRunAt` **n'est pas dans la réponse actuelle** (voir Q-W02). Le scheduler est géré par BullMQ — les dates sont en **UTC ISO 8601**.

---

## §4.12 Météo — lien surge, zones, dispatch

### Q-W20 — Comment `GET /v1/geo/hot-zones` est alimenté

**R :** Le refresh météo calcule les données météo par geohash. Les hot-zones (`GET /v1/geo/hot-zones`) sont alimentées par la combinaison **météo + demande** (heatmap demand). Le refresh météo seul ne crée pas automatiquement de hot-zones — il fournit la couche météo.

---

### Q-W21 — Champs `heatLevel` et `surge` sur hot-zone

**R :** À vérifier dans `src/modules/geo/`. Ces valeurs sont calculées à partir de la densité de demande + signal météo. Le `surge` n'est pas un multiplicateur de prix mais un indicateur de zone chaude.

---

### Q-W22 — Surge météo : remplace ou combine

**R :** Les profils météo dispatch (`strategies.traffic.weather`) **ajoutent** un `radiusBonusKm` et un `etaMultiplier` au-dessus du comportement normal. Ils ne remplacent pas les zones réseau.

---

### Q-W23 — Le dispatch utilise-t-il le surge

**R :** Via `strategies.traffic.weather` dans le document dispatch config :

```json
"traffic": {
  "enabled": true,
  "weather": {
    "rain": { "etaMultiplier": 1.2, "radiusBonusKm": 1.0 },
    "heat": { "etaMultiplier": 1.1, "radiusBonusKm": 0.5 },
    "storm": { "etaMultiplier": 1.5, "radiusBonusKm": 2.0 }
  }
}
```

La condition météo est lue depuis `order.metadata.weather`. Si le dispatch lit cette condition → le rayon est élargi et l'ETA multiplié.

---

### Q-W24 — `GET /v1/geo/pickup-demand` et `demand-summary`

**R :** Ces routes donnent des indicateurs de densité de demande par zone géographique. Usage admin recommandé : tableau de bord heatmap (identifier zones à fort potentiel). Pas de lien direct avec le dispatch moteur.

---

### Q-W25 — Carte admin dédiée météo

**R :** La **carte live existante** (`/admin/ops/map`) avec couche hot-zones est suffisante pour P0. Une couche heatmap météo dédiée est recommandée en P2.

---

## Exemples JSON complets

### `GET /v1/admin/dispatch-config?countryCode=CI` — 200 OK

```json
{
  "settingKey": "dispatch.config",
  "schemaVersion": 2,
  "document": {
    "schemaVersion": 2,
    "global": {
      "RIDE": {
        "maxRadiusKm": 2,
        "offerTtlSeconds": 12,
        "candidateLimit": 8,
        "driverSearchLimit": 500,
        "minDriverWalletBalanceXof": 0,
        "autoAssign": false,
        "wave": {
          "radiusIncrementKm": 2,
          "maxRadiusKmCap": 4,
          "maxWaves": 2,
          "waveIntervalSec": 12,
          "globalTimeoutSec": 120
        },
        "chain": {
          "tripMinProgress": 0.5,
          "radiusBonusKm": 2,
          "emergencyEnabled": false,
          "emergencyTripMinProgress": 0.35,
          "emergencyRadiusBonusKm": 4
        },
        "weights": {
          "distance": 0.7,
          "rating": 0.2,
          "reliability": 0.1
        },
        "strategies": {
          "preset": "legacy",
          "offers": { "mode": "sequential", "batchSize": 8, "sequentialQueueSize": 12 },
          "penalties": {
            "enabled": false,
            "scoreReductionPerRefusal": 0,
            "penaltyTtlMinutes": 2,
            "consecutiveRefusalThreshold": 3
          }
        }
      },
      "DELIVERY_CARGO": {
        "maxRadiusKm": 2,
        "offerTtlSeconds": 12,
        "candidateLimit": 10,
        "driverSearchLimit": 500,
        "minDriverWalletBalanceXof": 0,
        "autoAssign": false,
        "wave": {
          "radiusIncrementKm": 2,
          "maxRadiusKmCap": 4,
          "maxWaves": 2,
          "waveIntervalSec": 12,
          "globalTimeoutSec": 120
        },
        "chain": {
          "tripMinProgress": 0.5,
          "radiusBonusKm": 2,
          "emergencyEnabled": false,
          "emergencyTripMinProgress": 0.35,
          "emergencyRadiusBonusKm": 4
        },
        "weights": {
          "distance": 0.75,
          "rating": 0.15,
          "reliability": 0.1
        },
        "strategies": {
          "preset": "legacy",
          "offers": { "mode": "sequential", "batchSize": 10, "sequentialQueueSize": 12 }
        }
      }
    },
    "countries": {
      "CI": {
        "RIDE": {},
        "DELIVERY_CARGO": {}
      }
    }
  },
  "seedTemplate": { "...": "template pour 4 pays CI/SN/BF/ML" },
  "effective": {
    "countryCode": "CI",
    "RIDE": {
      "maxRadiusKm": 2,
      "offerTtlSeconds": 12,
      "candidateLimit": 8,
      "wave": { "radiusIncrementKm": 2, "maxRadiusKmCap": 4, "maxWaves": 2, "waveIntervalSec": 12, "globalTimeoutSec": 120 },
      "weights": { "distance": 0.7, "rating": 0.2, "reliability": 0.1 }
    },
    "DELIVERY_CARGO": { "...": "config effective DELIVERY_CARGO" }
  },
  "waveSchedule": {
    "RIDE": [
      { "wave": 1, "radiusKm": 2 },
      { "wave": 2, "radiusKm": 4 }
    ],
    "DELIVERY_CARGO": [
      { "wave": 1, "radiusKm": 2 },
      { "wave": 2, "radiusKm": 4 }
    ]
  }
}
```

---

### `GET /v1/admin/weather-config` — 200 OK

```json
{
  "settingKey": "weather.config",
  "schemaVersion": 1,
  "fromDatabase": true,
  "document": {
    "schemaVersion": 1,
    "enabled": true,
    "cacheEnabled": true,
    "cacheTtlSeconds": 900,
    "geohashPrecision": 5,
    "heatThresholdCelsius": 36,
    "fetchTimeoutMs": 8000,
    "apiBaseUrl": null,
    "fallbackCondition": "clear",
    "activeServiceTypes": ["RIDE", "DELIVERY_CARGO"],
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
        "abidjan": { "radiusKm": 35, "gridStepKm": 0.8 }
      }
    }
  },
  "seedTemplate": { "...": "valeurs défaut" },
  "effective": {
    "enabled": true,
    "cacheEnabled": true,
    "cacheTtlSeconds": 900,
    "geohashPrecision": 5,
    "heatThresholdCelsius": 36,
    "fetchTimeoutMs": 8000,
    "apiBaseUrl": "https://api.open-meteo.com",
    "fallbackCondition": "clear",
    "activeServiceTypes": ["RIDE", "DELIVERY_CARGO"],
    "refresh": { "...": "identique document" }
  },
  "scheduler": {
    "refreshIntervalMs": 900000,
    "refreshEnabled": true
  }
}
```

---

### `GET /v1/dispatch/RIDE/{orderId}/status` — 200 OK

```json
{
  "orderId": "uuid-commande",
  "serviceType": "RIDE",
  "status": "dispatching",
  "dispatch": {
    "wave": 1,
    "startedAt": "2026-06-12T10:00:00.000Z",
    "updatedAt": "2026-06-12T10:00:12.000Z",
    "offerMode": "sequential",
    "strategiesPreset": "legacy",
    "emergencyChainAttempted": false,
    "offers": [
      {
        "offerId": "uuid-offer-1",
        "driverId": "uuid-driver-1",
        "vehicleId": "uuid-vehicle-1",
        "status": "pending",
        "expiresAt": "2026-06-12T10:00:24.000Z",
        "distanceKm": 1.2,
        "score": 0.91,
        "rideCategoryCode": "ECO"
      }
    ]
  }
}
```

---

## Matrice paramètres — statut réel

### Dispatch — paramètres avec statut API

| Paramètre JSON réel | Statut backend | Défaut RIDE | Type |
|--------------------|---------------|-------------|------|
| `maxRadiusKm` | ✅ **Implémenté** | `2` | number (km) |
| `wave.radiusIncrementKm` | ✅ **Implémenté** | `2` | number (km) |
| `wave.maxRadiusKmCap` | ✅ **Implémenté** | `4` | number (km) |
| `wave.maxWaves` | ✅ **Implémenté** | `2` | number (min 1) |
| `wave.waveIntervalSec` | ✅ **Implémenté** | `12` | number (s) |
| `wave.globalTimeoutSec` | ✅ **Implémenté** | `120` | number (s) |
| `offerTtlSeconds` | ✅ **Implémenté** | `12` | number (s) |
| `candidateLimit` | ✅ **Implémenté** | `8` | number |
| `driverSearchLimit` | ✅ **Implémenté** | `500` | number [1-5000] |
| `minDriverWalletBalanceXof` | ✅ **Implémenté** | `0` | number (XOF, min 0) |
| `autoAssign` | ✅ **Implémenté** | `false` | boolean |
| `weights.distance` | ✅ **Implémenté** | `0.7` | number [0-1] |
| `weights.rating` | ✅ **Implémenté** | `0.2` | number [0-1] |
| `weights.reliability` | ✅ **Implémenté** | `0.1` | number [0-1] |
| `strategies.preset` | ✅ **Implémenté** | `"legacy"` | `"legacy"\|"pro"\|"full"` |
| `strategies.offers.mode` | ✅ **Implémenté** | `"sequential"` | `"sequential"\|"batch"` |
| `strategies.offers.batchSize` | ✅ **Implémenté** | `8` | number |
| `strategies.penalties.enabled` | ✅ **Implémenté** | `false` | boolean |
| `strategies.penalties.consecutiveRefusalThreshold` | ✅ **Implémenté** | `3` | number |
| `strategies.penalties.penaltyTtlMinutes` | ✅ **Implémenté** | `2` | number |
| `chain.emergencyEnabled` | ✅ **Implémenté** | `false` | boolean |
| `chain.tripMinProgress` | ✅ **Implémenté** | `0.5` | number [0.1-1] |
| `chain.radiusBonusKm` | ✅ **Implémenté** | `2` | number |
| `priorityMode` (front mock) | 🔧 **Via `weights`** | — | Pas d'enum — utiliser `weights` |
| `matchRadiusKm` (front mock) | 🔧 **= `maxRadiusKm`** | — | Renommer |
| `assignTimeoutSec` (front mock) | 🔧 **= `offerTtlSeconds`** | — | Renommer |
| `autoReassign` (front mock) | ❌ **Non implémenté** | — | — |
| `activeZoneIds` (front mock) | ❌ **Non lu par moteur** | — | — |
| `maxQueueSize` (front mock) | ❌ **= `candidateLimit`?** | — | Clarifier |
| `reassignMaxAttempts` | ❌ **Non implémenté** | — | — |
| `enabledServiceTypes` | ❌ **Non lu** | — | À implémenter |
| `zoneOverrides` | ❌ **Non implémenté** | — | Roadmap |

### Météo — paramètres avec statut API

| Paramètre | Statut backend | Défaut | Min/Max |
|-----------|---------------|--------|---------|
| `enabled` | ✅ Implémenté | env | — |
| `cacheEnabled` | ✅ Implémenté | env | — |
| `cacheTtlSeconds` | ✅ Implémenté | env | [60, 86400] |
| `geohashPrecision` | ✅ Implémenté | env | [4, 8] |
| `heatThresholdCelsius` | ✅ Implémenté | env | [30, 50] |
| `fetchTimeoutMs` | ✅ Implémenté | env | [500, 30000] |
| `apiBaseUrl` | ✅ Implémenté | `null` | string\|null |
| `fallbackCondition` | ✅ Implémenté | env | `clear\|rain\|storm\|heat` |
| `activeServiceTypes` | ✅ Implémenté | `['RIDE','DELIVERY_CARGO']` | string[] |
| `refresh.enabled` | ✅ Implémenté | `true` | — |
| `refresh.intervalMinutes` | ✅ Implémenté | `15` | [1, 1440] |
| `refresh.gridStepKm` | ✅ Implémenté | `1.1` | [0.3, 10] |
| `refresh.cityRadiusKmDefault` | ✅ Implémenté | `12` | [1, 80] |
| `refresh.cityRadiusKmMetro` | ✅ Implémenté | `25` | [1, 120] |
| `refresh.metroMinZones` | ✅ Implémenté | `5` | [1, 50] |
| `refresh.batchConcurrency` | ✅ Implémenté | `8` | [1, 64] |
| `refresh.maxCellsPerCity` | ✅ Implémenté | `600` | [10, 5000] |
| `refresh.cityOverrides` | ✅ Implémenté | `{}` | `Record<slug, {enabled?, radiusKm?, gridStepKm?}>` |
| `scheduler.nextRunAt` | ❌ Non exposé | — | Géré BullMQ interne |

---

## Mapping front mock → API réel

| Champ front mock | Champ API réel | Action |
|-----------------|---------------|--------|
| `match_radius_km` | `global.RIDE.maxRadiusKm` | Renommer |
| `assign_timeout_sec` | `global.RIDE.offerTtlSeconds` | Renommer |
| `max_queue_size` | `global.RIDE.candidateLimit` | Renommer |
| `priority_mode` | `global.RIDE.strategies.preset` | `"balanced"→"legacy"`, `"distance"→preset custom weights` |
| `auto_reassign` | Non implémenté | À supprimer ou garder front-only |
| `active_zone_ids` | Non lu moteur | À garder comme metadata front |
| `heatThresholdCelsius` | `document.heatThresholdCelsius` | ✅ Correct |
| `cacheTtlSeconds` | `document.cacheTtlSeconds` | ✅ Correct |
| `refresh.enabled` | `document.refresh.enabled` | ✅ Correct |
| `refresh.intervalMinutes` | `document.refresh.intervalMinutes` | ✅ Correct |

---

## Actions recommandées (équipe front)

### P0 — Déblocage immédiat

1. **Brancher `DispatchRulesForm`** sur `GET/PUT /v1/admin/dispatch-config` (abandonner le mock MSW).
2. **Remapper les champs** : `match_radius_km` → `global.RIDE.maxRadiusKm`, `assign_timeout_sec` → `global.RIDE.offerTtlSeconds`, `max_queue_size` → `global.RIDE.candidateLimit`.
3. **Valider le schéma météo** : `GET /v1/admin/weather-config` retourne déjà tous les champs — enrichir `SettingsWeatherPage` avec les champs manquants.
4. **Standardiser** sur `/v1/admin/weather-config` (ignorer `settings/weather`).

### P1 — Fonctionnalités avancées

5. **Onglet Preview** : utiliser `effective.RIDE` et `waveSchedule.RIDE` de la réponse dispatch-config.
6. **Fiche course** : brancher `GET /v1/dispatch/{serviceType}/{orderId}/status` + `logs`.
7. **Bouton Retry dispatch** : `POST /v1/dispatch/{serviceType}/{orderId}/retry` (sans body).
8. **Hygiene flotte** : `GET /v1/admin/dispatch-capacity` + `POST /v1/admin/dispatch-fleet-hygiene`.

### P2 — Roadmap backend

9. **Implémenter** les niveaux d'override `cities`, `franchises`, `zones`, `serviceTypes` dans `mergeServiceLayers()`.
10. **Exposer** `scheduler.nextRunAt` depuis BullMQ.
11. **Valider** l'enum `permissions` dispatcher côté API.
12. **Route** `GET /v1/admin/weather/jobs` (historique BullMQ refresh).

---

*Réponses générées à partir du code source `src/modules/dispatch/` et `src/modules/weather/` — Version backend : voir `package.json`. Toute évolution de schéma doit incrémenter `schemaVersion` dans le document stocké.*
