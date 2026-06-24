# UpJunoo Pro — Écarts API v1 / Back-office (avec exemples)

> **Environnement** : `https://api.upjunoo-dev.tech`  
> **Swagger** : [api.upjunoo-dev.tech/docs](https://api.upjunoo-dev.tech/docs)  
> **Auth test** : `dev.admin@upjunoo-dev.tech` / `Upjunoo@Dev2026!`  
> **Activation front** : `NEXT_PUBLIC_USE_REAL_AUTH=true` + `NEXT_PUBLIC_USE_MOCKS=false` dans `.env.local`  
> **Date initiale** : juin 2026  
> **Dernière revue** : 2 juin 2026 — smoke test `node scripts/test-v1-api.mjs` (13/14 routes OK)

Ce document compare, **pour chaque écran intégré**, ce que le back-office attendait (mocks MSW `/api/v2`), ce que l’API v1 renvoie réellement, et ce que l’interface affiche aujourd’hui après mapping.

### Journal des changements

| Date | Évolution | Avant | Maintenant |
|------|-----------|-------|------------|
| 2 juin 2026 | **Cartes KYC fiche chauffeur** | Grille vide (`kyc_documents: []`) | Jointure `GET /kyc/documents` + `KycDocumentCard` + actions v1 |
| 2 juin 2026 | **Doc backend KYC** | Écarts dispersés | § 7–8 enrichis + liste transmissible équipe backend |
| 2 juin 2026 | **Pagination serveur** | Client (`per_page`, lot ~20) | `page` + `limit` API branchés (drivers, partners, orders, users, withdrawals) |
| 2 juin 2026 | **§9 Franchises** | Non documenté | Liste/détail admin vs routes `/v1/franchises/*` |
| 5 juin 2026 | `GET /v1/admin/users` | HTTP **500** | **200** — intégré liste clients admin |
| 5 juin 2026 | Drivers list API | Champs techniques seuls | `profile`, `zoneName`, `partnerName`, `vehicleLabel` |
| 5 juin 2026 | Orders API | `client_id` seul | `client.displayName`, `order_reference` |
| 5 juin 2026 | Dashboard API | Pas de `franchise_options` | `dashboard.filters.options.franchises/partners` |
| 5 juin 2026 | Withdrawals API | Champs bruts | `beneficiaryName`, `summary.pendingCount` |
| 5 juin 2026 | Front mappers | UUID tronqués | Mappers mis à jour (voir fichiers référence) |
| 5 juin 2026 | Filtres UUID | IDs numériques mock | Support `string \| number` (UUID franchise/partenaire) |

---

## Comment lire ce document

Chaque section suit le même schéma :

1. **Attendu UI (mock)** — données de démo utilisées pendant la phase écrans.
2. **Reçu API v1 (réel)** — extrait typique observé sur l’API de dev.
3. **Rendu actuel (front mappé)** — objet affiché dans les tableaux / fiches.
4. **Tableau des écarts** — synthèse pour l’équipe backend.
5. **Impact utilisateur** — ce que voit un admin / partenaire.

---

## Sommaire

| # | Module | Route v1 | Page admin |
|---|--------|----------|------------|
| 1 | [Auth](#1-auth) | `POST /v1/auth/login` | Connexion |
| 2 | [Dashboard](#2-dashboard) | `GET /v1/admin/dashboard` | Tableau de bord |
| 3 | [Carte live](#3-carte-live) | `GET /v1/admin/live-map` + socket | Carte live |
| 4 | [Liste courses](#4-liste-courses) | `GET /v1/admin/orders` | Courses |
| 5 | [Détail course](#5-détail-course) | lookup orders + live-map | Détail TR-… |
| 6 | [Liste chauffeurs](#6-liste-chauffeurs) | `GET /v1/admin/drivers` | Chauffeurs |
| 7 | [Fiche chauffeur](#7-fiche-chauffeur) | `GET /v1/drivers/:id` | Fiche chauffeur |
| 8 | [File KYC](#8-file-kyc) | `GET /v1/admin/kyc/documents` | File KYC |
| 9 | [Franchises](#9-franchises) | `GET /v1/franchises/{id}` (partiel) | Réseau franchises |
| 10 | [Partenaires](#10-partenaires) | `GET /v1/admin/partners` | Réseau partenaires |
| 11 | [Retraits](#11-retraits) | `GET /v1/admin/withdrawals` | Finance retraits |
| 12 | [Clients admin](#12-clients-admin) | `GET /v1/admin/users` | Clients |
| 13 | [Non intégré / restant](#13-routes-non-intégrées-ou-restantes) | — | — |

---

## 1. Auth

**Route** : `POST /v1/auth/login` · `GET /v1/auth/me`

### Attendu UI (mock `/api/v2/auth/login`)

```json
{
  "token": "mock-jwt-admin",
  "refreshToken": "mock-refresh",
  "user": {
    "id": 1,
    "name": "Admin UpJunoo",
    "email": "admin@upjunoo.ci",
    "role": "admin",
    "scope": "platform",
    "permissions": [
      "ops.dashboard.view",
      "ops.trips.view",
      "fleet.drivers.view"
    ]
  }
}
```

### Reçu API v1 (réel)

```json
{
  "status": "ok",
  "role": "ADMIN",
  "userType": "ADMIN",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "lqj3eedzjb3y",
  "expiresIn": 3600,
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 3600
  },
  "profile": {
    "id": "1aed72f8-5ac4-4f68-a152-3705551006c5",
    "user_type": "ADMIN",
    "email": "dev.admin@upjunoo-dev.tech",
    "first_name": "Dev",
    "last_name": "Admin",
    "display_name": "Dev Admin"
  }
}
```

### Rendu actuel (front mappé)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "lqj3eedzjb3y",
  "user": {
    "id": "1aed72f8-5ac4-4f68-a152-3705551006c5",
    "name": "Dev Admin",
    "email": "dev.admin@upjunoo-dev.tech",
    "role": "admin",
    "scope": "platform",
    "permissions": ["ops.dashboard.view", "ops.trips.view", "..."]
  }
}
```

### Tableau des écarts

| Champ | Attendu mock | Reçu API | Contournement front | Fix backend |
|-------|--------------|----------|---------------------|-------------|
| `permissions` | Liste métier | **Absent** | Liste **codée en dur** (`auth.permissions.ts`) | Retourner `permissions[]` dans login/me |
| Enveloppe | `{ token, user }` | `{ accessToken, profile, session }` | Mapper `auth.mapper.ts` | Documenter schema Swagger |
| `user.id` | `number` | UUID `string` | Types élargis | OK |
| Mot de passe oublié | `/v1/auth/forgot-password` | Alias `/v1/auth/password/forgot` | `links.ts` → `/v1/auth/forgot-password` | OK (les deux chemins existent) |
| Erreur login 401 | Message anglais | `AUTH_LOGIN_FAILED` | Traduction FR (`errorHandler.ts`) | OK côté front |
| Échec login portail | Redirection `/login` | Reste sur `/partner/login` etc. | `fetchClient` + validation rôle | OK côté front |

### Impact utilisateur

Connexion fonctionnelle sur tous les portails. Message d’erreur en français. Les droits affichés ne reflètent pas forcément le rôle réel tant que les permissions ne viennent pas de l’API. Le refresh token n’est pas encore utilisé sur 401 session expirée.

---

## 2. Dashboard

**Route** : `GET /v1/admin/dashboard`

### Attendu UI (mock `/api/v2/admin/dashboard`)

```json
{
  "trips_today": 912,
  "trips_today_trend_pct": 9.8,
  "drivers_approved": 1030,
  "drivers_total": 1036,
  "kyc_pending": 1,
  "franchise_options": [
    { "id": 1, "name": "Côte d'Ivoire", "city": "Abidjan" }
  ],
  "recent_trips": [
    {
      "ref": "TR-88421",
      "from_label": "Cocody, Angré",
      "to_label": "Riviera 2",
      "client_name": "Koné Aicha",
      "amount_fcfa": 4500,
      "status": "completed"
    }
  ]
}
```

### Reçu API v1 (réel)

```json
{
  "status": "ok",
  "dashboard": {
    "summary": {
      "ridesToday": {
        "total": 5,
        "vsYesterday": { "value": 28.8, "direction": "down" }
      },
      "drivers": { "approved": 1030, "total": 1036 },
      "kyc": { "pendingReview": 1 },
      "networkActivity": {
        "driversOnline": 823,
        "ridesLast24h": 5,
        "label": "Bingerville"
      }
    },
    "recentActivity": {
      "items": [
        {
          "id": "a96f92ff-...",
          "ref": "TR-A96F92FF",
          "service": "RIDE",
          "route": { "from": "Plateau", "to": "Cocody" },
          "client": { "displayName": "Dev Client" },
          "amountXof": 1900,
          "status": "completed",
          "createdAt": "2026-06-04T13:04:08Z"
        }
      ]
    },
    "alerts": [
      {
        "code": "KYC_PENDING",
        "count": 1,
        "actionUrl": "/admin/kyc/pending"
      }
    ]
  }
}
```

### Reçu API v1 — filtres périmètre (nouveau, juin 2026)

```json
{
  "dashboard": {
    "filters": {
      "options": {
        "franchises": [
          {
            "id": "fe97586a-9766-45c3-b397-fb8a3419b7e6",
            "name": "Franchise Cote d'Ivoire Test Grandeur Nature",
            "city": null
          }
        ],
        "partners": [
          {
            "id": "82214755-93d3-4b64-9311-c1747ceacb96",
            "name": "AL BARAKAH",
            "franchiseId": null
          }
        ]
      }
    }
  }
}
```

### Rendu actuel (front mappé)

Les KPIs s’affichent correctement. Le sélecteur **Périmètre** est **actif** : 2 franchises et ~46 partenaires observés en dev. Les liens d’alertes sont remappés vers `/admin/fleet/kyc`. Les IDs franchise sont des UUID (plus des `number` mock).

### Tableau des écarts

| Champ UI | Attendu mock | Reçu API | Contournement | Statut |
|----------|--------------|----------|---------------|--------|
| `franchise_options` | Liste franchises | `filters.options.franchises[]` | Mapper `dashboard.mapper.ts` | **Résolu** |
| `trips_today` | Nombre plat | `ridesToday.total` | Mapper OK | OK |
| `recent_trips[].client_name` | Texte | `client.displayName` | Mapper OK | OK |
| `actionUrl` alertes | `/admin/kyc/pending` | Chemins backend | Remap front | OK |
| IDs franchise | `number` | UUID | Types `string \| number` | **Écart résiduel** (mock vs prod) |
| `franchise_options[].city` | `Abidjan` | Souvent `null` | Affiché `—` | **Écart P2** |

### Impact utilisateur

Dashboard utilisable avec filtre franchise. La ville affichée dans le sélecteur peut être vide si l’API ne renvoie pas `city`.

---

## 3. Carte live

**Routes** : `GET /v1/admin/live-map` + socket `admin:live:locations`

### Attendu UI (mock)

```json
{
  "drivers": [
    {
      "id": 101,
      "name": "Kouassi Jean",
      "lat": 5.3599,
      "lng": -3.9872,
      "availability": "on_trip",
      "heading": 45,
      "active_trip": {
        "ref": "TR-88421",
        "from_label": "Cocody",
        "to_label": "Plateau"
      }
    }
  ],
  "stats": {
    "online": 42,
    "on_trip": 8,
    "active_trips": 12
  }
}
```

### Reçu API v1 (réel — extrait)

```json
{
  "status": "ok",
  "drivers": [
    {
      "id": "2b82e602-244f-46b2-9d36-8161fd78af0b",
      "driverCode": null,
      "availabilityStatus": "online",
      "profile": { "displayName": "Dev Driver" },
      "location": {
        "latitude": 5.3224,
        "longitude": -4.0245,
        "heading": 120,
        "speedKmh": 32,
        "recordedAt": "2026-06-04T18:05:00Z"
      },
      "partnerName": "Cocody Express",
      "rideCategoryCode": "ECO"
    }
  ],
  "meta": {
    "realtime": {
      "enabled": true,
      "channel": "admin:live:locations",
      "url": "wss://api.upjunoo-dev.tech"
    }
  },
  "orders": {
    "rides": [
      {
        "id": "7803ab02-...",
        "order_reference": "TR-7803AB02",
        "status": "arrived",
        "pickup_address": "Plateau",
        "dropoff_address": "Cocody",
        "final_price_xof": 1900
      }
    ]
  }
}
```

### Rendu actuel

Carte Mapbox + badge **« Temps réel actif »** + marqueurs animés. Popups course avec ref, trajet, montant FCFA.

### Tableau des écarts

| Champ | Attendu mock | Reçu API | Contournement | Fix backend |
|-------|--------------|----------|---------------|-------------|
| `drivers[].name` | Nom simple | `profile.displayName` | Mapper live-map | OK |
| `availability` | `on_trip` | `availabilityStatus` + statut course | Mapper + labels | OK |
| `stats.avg_wait_min` | Minutes | Absent | Affiché **0** | Champ KPI carte |
| Socket | — | Irrégulier (2–13 s) | Extrapolation GPS front | Flux régulier |
| `GET /v1/admin/live-orders` | Stats temps réel | Non branché | Recharge live-map | Endpoint léger P1 |

### Impact utilisateur

Carte opérationnelle. Mouvement véhicule amélioré côté front (vitesse GPS, throttle Directions).

---

## 4. Liste courses

**Route** : `GET /v1/admin/orders`  
**Page** : `/admin/ops/trips`

### Attendu UI (mock `/api/v2/admin/ops/trips`)

```json
{
  "data": [
    {
      "id": "1",
      "ref": "TR-88421",
      "service": "taxi",
      "from_label": "Abidjan, Cocody",
      "to_label": "Cocody, Riviera",
      "client_name": "Aya Koné",
      "driver_name": "Kouassi Jean",
      "amount_fcfa": 4500,
      "status": "completed",
      "payment_method": "wallet",
      "created_at": "2026-06-02T14:32:00Z",
      "franchise_name": "Côte d'Ivoire",
      "partner_name": "Cocody Express"
    }
  ],
  "filter_options": {
    "franchises": [{ "id": 1, "name": "Côte d'Ivoire" }],
    "partners": [{ "id": 12, "name": "Cocody Express" }]
  },
  "meta": { "total": 48, "per_page": 20, "current_page": 1 }
}
```

### Reçu API v1 (réel — juin 2026)

```json
{
  "status": "ok",
  "rides": [
    {
      "id": "005b1b9d-85c6-4aaf-a3ec-da1583a6f879",
      "order_reference": "TR-005B1B9D",
      "client_id": "791c763a-4785-4c3a-be89-9de1eadb418b",
      "client": {
        "id": "791c763a-4785-4c3a-be89-9de1eadb418b",
        "displayName": "Dev Client",
        "phone": "+2250700000001",
        "email": "dev.client@upjunoo-dev.tech"
      },
      "driver_id": null,
      "driver": null,
      "partnerName": null,
      "franchiseName": null,
      "service_type": "RIDE",
      "status": "cancelled",
      "payment_method_code": "CASH",
      "pickup_address": "Dispatch test pickup",
      "dropoff_address": "Dispatch test dropoff",
      "estimated_price_xof": 1900,
      "created_at": "2026-06-04T19:14:18Z"
    }
  ]
}
```

> **Note** : 20 rides observées en dev, 0 deliveries. Pagination absente — tout le lot est renvoyé.

### Rendu actuel (front mappé)

```json
{
  "data": [
    {
      "id": "005b1b9d-85c6-4aaf-a3ec-da1583a6f879",
      "ref": "TR-005B1B9D",
      "service": "taxi",
      "from_label": "Dispatch test pickup",
      "to_label": "Dispatch test dropoff",
      "client_name": "Dev Client",
      "driver_name": null,
      "amount_fcfa": 1900,
      "status": "cancelled",
      "payment_method": "cash",
      "created_at": "2026-06-04T19:14:18Z"
    }
  ],
  "filter_options": {
    "franchises": [
      { "id": "fe97586a-...", "name": "Franchise Cote d'Ivoire...", "city": "—" }
    ],
    "partners": [
      { "id": "82214755-...", "name": "AL BARAKAH", "franchise_id": "", "franchise_name": "—", "city": "—" }
    ]
  },
  "meta": { "total": 20, "per_page": 20, "current_page": 1 }
}
```

Les `filter_options` sont chargées via un appel parallèle à `GET /v1/admin/dashboard` (pas inclus dans la réponse `orders` elle-même).

### Tableau des écarts

| Champ UI | Exemple mock | Exemple API | Rendu actuel | Statut |
|----------|-------------|-------------|--------------|--------|
| `ref` | `TR-88421` | `order_reference` | `TR-005B1B9D` | **Résolu** |
| `client_name` | `Aya Koné` | `client.displayName` | `Dev Client` | **Résolu** |
| `driver_name` | `Kouassi Jean` | `driver.displayName` souvent `null` | Nom via liste drivers si assigné | **Partiel** |
| `status` | `completed` | `cancelled`, `dispatching`… | Mappé FR (`matching`, etc.) | OK |
| `franchise_name` / `partner_name` | Libellés | Souvent `null` sur order | Colonnes non remplies | **Écart P1** |
| `filter_options` | Dans réponse trips | Dans dashboard | Jointure front | **Contournement** |
| Pagination | serveur | tout le lot (~20) | **client** (`clientList.ts`) | **Écart P2** |

### Impact utilisateur

Liste lisible pour le client et la référence course. Filtres franchise/partenaire disponibles. Le nom chauffeur reste vide si `driver.displayName` est null et qu’aucun enrichissement drivers n’est possible.

---

## 5. Détail course

**Route principale** : `GET /v1/admin/orders/{orderId}` (Swagger § 10 - Admin)  
**Fallback front** : lookup `GET /v1/admin/live-map` + `GET /v1/admin/orders` si la route détail échoue

### Attendu UI (mock `/api/v2/admin/ops/trips/:id`)

```json
{
  "id": "1",
  "ref": "TR-88421",
  "from_label": "Cocody, Angré",
  "to_label": "Plateau, BCEAO",
  "client_name": "Koné Aicha",
  "client_phone": "+225 07 55 44 33 22",
  "driver_name": "Kouassi Jean",
  "driver_phone": "+225 07 12 34 56 78",
  "amount_fcfa": 4500,
  "commission_fcfa": 450,
  "driver_earning_fcfa": 4050,
  "timeline": [
    { "type": "requested", "label": "Course créée", "at": "2026-06-02T14:32:00Z" },
    { "type": "assigned", "label": "Chauffeur assigné", "at": "2026-06-02T14:38:00Z" },
    { "type": "completed", "label": "Course terminée", "at": "2026-06-02T15:00:00Z" }
  ]
}
```

### Reçu API v1 (`GET /v1/admin/orders/{orderId}` — juin 2026)

```json
{
  "status": "ok",
  "order": {
    "orderId": "005b1b9d-85c6-4aaf-a3ec-da1583a6f879",
    "ref": "TR-005B1B9D",
    "clientName": "Dev Client",
    "clientPhone": "+2250700000001",
    "driverName": null,
    "amountXof": 1900,
    "commissionXof": 285,
    "driverEarningXof": null,
    "ride": { "pickup_address": "...", "status": "cancelled" },
    "events": [
      { "event_type": "ride.created", "created_at": "2026-06-04T19:14:14Z" },
      { "event_type": "dispatch.started", "created_at": "2026-06-04T19:14:15Z" }
    ],
    "timeline": { "current": "cancelled", "steps": [] },
    "dispatch": { "dispatch": { "offers": [] } }
  }
}
```

### Rendu actuel (front mappé)

Une requête `GET /v1/admin/orders/{id}` via `tripDetail.service.ts` + `adminOrderDetail.mapper.ts` :
- `client_name` / `client_phone` depuis l'API
- `commission_fcfa` depuis `commissionXof` (plus estimation 15 %)
- `timeline` depuis `events[]` (sinon `timeline.steps`)
- `matching_drivers` depuis `dispatch.offers`

### Tableau des écarts

| Champ | Mock | API détail admin | Statut |
|-------|------|------------------|--------|
| `client_phone` | Oui | `clientPhone` | **Résolu** |
| `commission_fcfa` | Oui | `commissionXof` | **Résolu** |
| `timeline` | Riche | `events` + `timeline` | **Résolu** |
| `driver_name` | Oui | `driverName` (null si pas assigné) | **Partiel** |
| Forensic GPS | Mock dédié | `GET /v1/dispatch/RIDE/{id}/logs` | Non branché (P2) |

### Impact utilisateur

Fiche course admin nettement plus complète qu'avec le lookup liste + live-map.

---

## 6. Liste chauffeurs

**Route** : `GET /v1/admin/drivers`  
**Page** : `/admin/fleet/drivers`

### Attendu UI (mock)

```json
{
  "data": [
    {
      "id": 101,
      "first_name": "Kouassi",
      "last_name": "Jean",
      "phone": "+225 07 12 34 56 78",
      "rating": 4.82,
      "zone": "Cocody",
      "owner_name": "Cocody Express",
      "vehicle_label": "Toyota Corolla · AB-452-CI",
      "account_status": "approved",
      "availability": "online"
    }
  ]
}
```

### Reçu API v1 (réel — juin 2026)

```json
{
  "status": "ok",
  "items": [
    {
      "id": "29c04f7f-fbfc-4b3f-acb4-d5e88f47a5b0",
      "driver_code": "GN-CI-0013",
      "profile": {
        "displayName": "Chauffeur GN 13",
        "phone": "+2250501    13",
        "email": "gn-ci-driver-0013@upjunoo.test"
      },
      "zoneName": "Abidjan",
      "partnerName": "Fleet GN CI 1000",
      "vehicleLabel": "CONFORT",
      "rating_avg": 4.7,
      "availability_status": "online",
      "approval_status": "approved",
      "ride_category_code": "CONFORT"
    }
  ]
}
```

> **Note** : certains chauffeurs seed plus anciens peuvent encore avoir `driver_code: null` et pas de `profile` — le front retombe sur `Chauffeur {uuid}`.

### Rendu actuel (front mappé)

```json
{
  "data": [
    {
      "id": "29c04f7f-fbfc-4b3f-acb4-d5e88f47a5b0",
      "first_name": "Chauffeur",
      "last_name": "GN 13",
      "phone": "+2250501    13",
      "rating": 4.7,
      "zone": "Abidjan",
      "owner_name": "Fleet GN CI 1000",
      "vehicle_label": "CONFORT",
      "account_status": "approved",
      "availability": "online"
    }
  ]
}
```

### Tableau des écarts

| Champ UI | Mock | API (juin 2026) | Rendu actuel | Statut |
|----------|------|-----------------|--------------|--------|
| Nom | `Kouassi` / `Jean` | `profile.displayName` | Prénom/nom splittés | **Résolu** (si profile présent) |
| `phone` | `+225 07…` | `profile.phone` | Affiché | **Résolu** |
| `zone` | `Cocody` | `zoneName` | `Abidjan` (ville, pas quartier) | **Partiel** |
| `owner_name` | `Cocody Express` | `partnerName` | `Fleet GN CI 1000` | **Résolu** |
| `vehicle_label` | `Toyota Corolla…` | `vehicleLabel` | `CONFORT` (catégorie, pas plaque) | **Partiel** |
| `rating` | `4.82` | `rating_avg` | `4.7` | **Résolu** |
| Pagination | serveur | ~20 items / requête | **client** | **Écart P2** |

### Exemple visuel comparé

| Colonne | Maquette (mock) | Aujourd’hui (API v1 mappé) |
|---------|-----------------|----------------------------|
| Chauffeur | Kouassi Jean | Chauffeur GN 13 |
| Téléphone | +225 07 12 34 56 78 | +2250501    13 |
| Zone | Cocody | Abidjan |
| Partenaire | Cocody Express | Fleet GN CI 1000 |
| Véhicule | Toyota Corolla · AB-452-CI | CONFORT |

---

## 7. Fiche chauffeur — KYC & documents

**Routes** :
- `GET /v1/drivers/:driverId` — profil, stats, véhicule ([Swagger §06](https://api.upjunoo-dev.tech/docs#/06%20-%20Chauffeur/get_v1_drivers__driverId_))
- `GET /v1/admin/kyc/documents` — documents KYC (jointure front par `subject_id`)
- `POST /v1/admin/kyc/documents/{id}/approve` · `POST .../reject` — validation par carte

**Page** : `/admin/fleet/drivers/:id` — onglet **KYC & documents**

### Éléments UI essentiels (à ne pas supprimer lors de l’intégration)

Ces composants existent dans le front et constituent l’expérience cible. L’intégration API ne doit pas les retirer, seulement les alimenter.

| Composant | Fichier | Rôle UX |
|-----------|---------|---------|
| **Grille de cartes document** | `KycDocumentCard.tsx` | Une carte par type : CNI, permis, selfie (+ carte grise véhicule) |
| **Aperçu + lightbox** | `DocumentPreviewThumbnail.tsx`, `DocumentLightbox.tsx` | Clic sur la carte → zoom image / lien PDF |
| **Placeholders visuels** | `public/document-previews/*.svg` | Fallback si pas d’URL fichier valide |
| **Actions par document** | Boutons Valider / Rejeter sur chaque carte | Modération granulaire (comme franchise mock) |
| **Actions compte** | Approuver / Rejeter le chauffeur (header) | Validation globale du dossier |
| **File KYC** | `KycQueuePage.tsx` | Table agrégée → lien « Examiner » vers la fiche |

**Référence mock (UX cible)** : `src/mocks/data/driver-detail-pending.json` — 3 cartes (CNI, permis, carte grise) avec statuts `pending` / `rejected` + `status_note`.

### Attendu UI (mock)

```json
{
  "kyc_documents": [
    {
      "id": "doc-cni",
      "type": "cni",
      "label": "Carte nationale d'identité",
      "status": "pending",
      "uploaded_at": "2026-06-01T16:40:00Z",
      "preview_url": "/document-previews/cni.svg"
    },
    {
      "id": "doc-permis",
      "type": "license",
      "label": "Permis de conduire",
      "status": "pending",
      "uploaded_at": "2026-06-01T16:42:00Z"
    },
    {
      "id": "doc-grise",
      "type": "registration",
      "label": "Carte grise",
      "status": "rejected",
      "status_note": "Photo illisible — merci de resoumettre"
    }
  ]
}
```

### Reçu API v1 (juin 2026 — test live)

`GET /v1/drivers/:id` **ne contient pas** de tableau `kyc_documents` / `documents`.

Documents dans un endpoint **séparé** — 1 item observé en dev :

```json
{
  "id": "f5546550-e13a-42dc-a3d2-cad42bb5668a",
  "subject_type": "DRIVER",
  "subject_id": "11beb1f7-63bc-45a9-a6ad-dd7dc491a3a5",
  "document_type_code": "DRIVER_LICENSE",
  "file_url": "kyc/test-license-v2.png",
  "status": "pending",
  "submitted_at": "2026-06-03T16:29:04Z",
  "cityLabel": null,
  "rejection_reason": null
}
```

**Test fichier** : `file_url` relatif → `GET https://api…/kyc/test-license-v2.png` = **404**. Aperçu image impossible sans URL signée.

### Rendu actuel (front mappé — juin 2026)

Le front joint `GET /v1/admin/kyc/documents` filtré par `subject_id`, mappe vers `KycDocument[]`, et complète les emplacements manquants (CNI, permis, selfie) pour les comptes `pending` :

| Carte | Source API | Aperçu | Actions |
|-------|------------|--------|---------|
| Permis de conduire | `DRIVER_LICENSE` → `license` | Placeholder SVG (URL fichier 404) | Valider / Rejeter → `POST …/approve\|reject` |
| CNI | Non soumis en seed | Emplacement vide « Document requis » | — |
| Selfie | Non soumis en seed | Emplacement vide | — |

Mapper : `src/features/fleet/api/kycDocument.mapper.ts`  
Service : `driverDetail.service.ts` → `attachDriverKycDocuments()`

### Tableau des écarts

| Champ / UX | Mock | API v1 | Rendu actuel | Statut |
|------------|------|--------|--------------|--------|
| Grille cartes KYC | 3 cartes toujours | 0–N docs, endpoint séparé | Jointure front + slots manquants si pending | **Contournement** |
| `document_type_code` | `cni`, `license`… | `DRIVER_LICENSE`, etc. | Mappé côté front | **Contournement** |
| `document_type_label` | Libellé FR | Absent | Mappé en dur front | **Écart P1** |
| `file_url` / preview | URL accessible | Chemin relatif **404** | Placeholder SVG | **Écart P0** |
| `kyc_documents` dans fiche | Inclus | Absent de `GET /v1/drivers/:id` | 2e requête KYC | **Écart P1** |
| Approve/reject **document** | Mock MSW | Routes v1 existent | Branché `kyc.service.ts` | **Résolu** (front) |
| Approve/reject **compte** | Mock POST | Pas de route v1 admin claire | Encore legacy `/admin/drivers/:id/kyc/*` | **Écart P1** |
| Stats wallet | Demo | Souvent `0` | KPI vide | **Écart P2** |

### Impact utilisateur

- L’admin retrouve la **grille de cartes** sur la fiche chauffeur (plus une page vide).
- Le **permis** soumis apparaît en carte avec statut ; l’aperçu photo reste un placeholder tant que `file_url` n’est pas servi.
- Les documents **non soumis** (CNI, selfie) restent visibles comme emplacements à compléter — comme en maquette.
- Valider / Rejeter une carte appelle l’API v1 ; valider le compte entier reste sur route legacy.

---

## 8. File KYC

**Route** : `GET /v1/admin/kyc/documents`  
**Page** : `/admin/fleet/kyc`

### Attendu UI (mock — 1 ligne = 1 chauffeur)

```json
{
  "data": [
    {
      "driver_id": 103,
      "first_name": "Diabaté",
      "last_name": "Moussa",
      "phone": "+225 01 44 22 11 00",
      "zone": "Plateau",
      "owner_name": "Cocody Express",
      "documents_pending": 2,
      "documents_rejected": 1,
      "submitted_at": "2026-06-01T16:45:00Z",
      "waiting_hours": 18
    }
  ]
}
```

### Reçu API v1 (réel — 1 ligne = 1 document)

```json
{
  "status": "ok",
  "items": [
    {
      "id": "f5546550-e13a-42dc-a3d2-cad42bb5668a",
      "subject_type": "DRIVER",
      "subject_id": "11beb1f7-63bc-45a9-a6ad-dd7dc491a3a5",
      "document_type_code": "DRIVER_LICENSE",
      "status": "pending",
      "submitted_at": "2026-06-03T16:29:04Z",
      "file_url": "kyc/test-license-v2.png"
    }
  ]
}
```

**Volume dev** : 1 document KYC pour 1 chauffeur (seed minimal).

### Rendu actuel (après regroupement front + enrichissement drivers)

```json
{
  "data": [
    {
      "driver_id": "11beb1f7-63bc-45a9-a6ad-dd7dc491a3a5",
      "first_name": "Chauffeur GN 07",
      "last_name": "",
      "phone": "+2250501    07",
      "zone": "Abidjan",
      "owner_name": "Fleet GN CI 1000",
      "documents_pending": 1,
      "documents_rejected": 0,
      "submitted_at": "2026-06-03T16:29:04Z",
      "waiting_hours": 48
    }
  ]
}
```

> Si le chauffeur KYC n’est pas dans `GET /v1/admin/drivers`, le front affiche `Chauffeur {uuid}`.

### Tableau des écarts

| Aspect | Mock | API | Contournement front | Statut |
|--------|------|-----|---------------------|--------|
| Granularité | 1 ligne / chauffeur | 1 ligne / document | `groupKycDocumentsByDriver()` | **Écart P1** |
| Nom / téléphone | Complets | Absents sur item KYC | Jointure liste drivers | **Partiel** |
| `document_type_label` | Libellé FR | Seulement `document_type_code` | Mapping front | **Écart P1** |
| Preview dans file | — | `file_url` 404 | Non affiché (table seulement) | **Écart P0** |
| Filtres | Statut, zone | Aucun query param | Filtre client | **Écart P2** |
| Pagination | Serveur | Lot complet | Client | **Écart P2** |

### Demandes backend — KYC & documents (à transmettre)

Liste priorisée pour l’équipe API. Chaque point décrit **pourquoi** le front en a besoin.

#### P0 — Bloquant UX (aperçu & modération)

| # | Demande | Détail technique | Bénéfice UI |
|---|---------|------------------|-------------|
| KYC-01 | **URLs fichiers accessibles** | `file_url` doit être une URL HTTPS signée ou servie (`GET /v1/files/…` ou CDN). Aujourd’hui `kyc/test-license-v2.png` → **404**. | Aperçu permis / CNI dans la carte + lightbox |
| KYC-02 | **`document_type_label` (FR)** | Ex. `DRIVER_LICENSE` → `"Permis de conduire"`. Éviter mapping en dur côté front. | Libellés cohérents partout (file + fiche) |

#### P1 — Forte valeur (réduire contournements front)

| # | Demande | Détail technique | Bénéfice UI |
|---|---------|------------------|-------------|
| KYC-03 | **`kyc_documents[]` dans `GET /v1/drivers/:id`** | Même structure que les items KYC (id, type, status, file_url, dates). | 1 requête au lieu de 2 ; fiche plus rapide |
| KYC-04 | **Queue agrégée `GET /v1/admin/kyc/queue`** | 1 item / chauffeur avec `documents_pending`, `documents_rejected`, profil embarqué. | Supprimer regroupement front fragile |
| KYC-05 | **Profil sur chaque document KYC** | `driver.displayName`, `phone`, `zone`, `partnerName` sur l’item ou via expand. | File KYC lisible sans jointure drivers |
| KYC-06 | **Filtres query** | `?subject_id=`, `?status=pending`, `?subject_type=DRIVER` sur `/kyc/documents`. | Charger uniquement les docs d’un chauffeur |
| KYC-07 | **Approve/reject compte chauffeur v1** | `POST /v1/admin/drivers/{id}/approve` ou équivalent KYC compte. | Fin des routes legacy mock |
| KYC-08 | **Seed multi-documents** | Chauffeurs pending avec CNI + permis + selfie (pas seulement `DRIVER_LICENSE`). | Grille cartes réaliste en dev |

#### P2 — Confort

| # | Demande | Détail technique | Bénéfice UI |
|---|---------|------------------|-------------|
| KYC-09 | **`reviewed_by` + nom modérateur** | Sur item document après validation. | Traçabilité dans timeline |
| KYC-10 | **`expires_at` permis** | Date expiration sur `DRIVER_LICENSE`. | Alerte expiration sur carte |
| KYC-11 | **Pagination serveur** | `page`, `limit`, `total` sur documents et queue. | Perf avec volume réel |
| KYC-12 | **Documents véhicule** | Carte grise / assurance sur `subject_type=VEHICLE` | Onglet documents véhicule partenaire |

#### Mapping types document (référence front)

| `document_type_code` API | Type UI | Libellé attendu |
|--------------------------|---------|-----------------|
| `NATIONAL_ID` / `ID_CARD` / `CNI` | `cni` | Carte nationale d'identité |
| `DRIVER_LICENSE` | `license` | Permis de conduire |
| `SELFIE` / `DRIVER_SELFIE` | `selfie` | Photo selfie |
| `VEHICLE_REGISTRATION` | `registration` | Carte grise |

Swagger : tag **10 - Admin** → `GET/POST /v1/admin/kyc/documents…`

---

## 9. Franchises

**Pages** : `/admin/network/franchises` (liste) · `/admin/network/franchises/:id` (détail)  
**Statut front (juin 2026)** : **mock `/api/v2` uniquement** — `franchises.service.ts` et `franchiseDetail.service.ts` non branchés v1.

### Routes API v1 — inventaire (test live)

| Route | HTTP dev | Usage maquette | Statut |
|-------|----------|----------------|--------|
| `GET /v1/admin/franchises` | **404** | Liste admin paginée | **Absent** |
| `GET /v1/franchises` (liste) | **404** | — | **Absent** |
| `GET /v1/franchises/{id}` | **200** | Fiche détail (partielle) | **Partiel** (tag Swagger **99**) |
| `GET /v1/franchises/{id}/partners` | **200** + `pagination` | Onglet Partenaires | **OK** (à mapper) |
| `GET /v1/franchises/{id}/drivers` | **200** + `pagination` | Compteur chauffeurs | **OK** |
| `GET /v1/franchises/{id}/orders` | **200** | Stats courses | **Partiel** |
| `GET /v1/franchises/{id}/revenue` | **200** | KPI revenus | **Partiel** (`totalXof`, `ordersCount`) |
| `GET /v1/franchises/{id}/members` | **200** | Équipe franchise | Non branché front |
| `GET /v1/admin/dashboard` → `filters.options.franchises[]` | **200** | Contournement liste (2 items) | **Contournement** |

> Pas de route zones ni transactions récentes pour la fiche franchise admin.

### Attendu UI — liste (mock)

```json
{
  "data": [
    {
      "id": 1,
      "name": "Côte d'Ivoire",
      "city": "Abidjan",
      "status": "active",
      "partners_count": 24,
      "drivers_count": 4120,
      "zones_count": 12,
      "revenue_month_fcfa": 185000000
    }
  ],
  "meta": { "total": 4, "per_page": 25, "current_page": 1, "last_page": 1 }
}
```

**Colonnes** : Pays/région, Statut, Partenaires, Chauffeurs, Zones, Revenus/mois.

### Reçu API v1 — liste (aucune route dédiée)

Seul extrait disponible via le dashboard :

```json
{
  "dashboard": {
    "filters": {
      "options": {
        "franchises": [
          {
            "id": "fe97586a-9766-45c3-b397-fb8a3419b7e6",
            "name": "Franchise Cote d'Ivoire Test Grandeur Nature",
            "city": null
          }
        ]
      }
    }
  }
}
```

**Volume dev** : 2 franchises dans le sélecteur périmètre — sans `partners_count`, `drivers_count`, `zones_count`, `revenue_month_fcfa`, ni pagination.

### Attendu UI — détail (mock)

```json
{
  "id": 1,
  "name": "Côte d'Ivoire",
  "city": "Abidjan",
  "status": "active",
  "contact_email": "contact@upjunoo.ci",
  "contact_phone": "+225 07 00 00 00 01",
  "stats": {
    "partners_count": 24,
    "drivers_count": 4120,
    "zones_count": 12,
    "trips_month": 8420,
    "revenue_month_fcfa": 185000000,
    "commission_month_fcfa": 18500000
  },
  "partners": [{ "id": 12, "name": "Cocody Express", "drivers_count": 186, "status": "active" }],
  "zones": [{ "id": 1, "name": "Cocody", "type": "standard", "drivers_active": 420 }],
  "recent_transactions": [{ "id": "tx-1", "label": "Commission course", "amount_fcfa": 1200 }]
}
```

**Onglets** : Aperçu (KPIs), Partenaires, Zones · panneau latéral transactions récentes.

### Reçu API v1 — détail (`GET /v1/franchises/{id}` — juin 2026)

```json
{
  "status": "ok",
  "franchise": {
    "id": "fe97586a-9766-45c3-b397-fb8a3419b7e6",
    "code": "GN-CI-TEST",
    "name": "Franchise Cote d'Ivoire Test Grandeur Nature",
    "legal_name": "UPJUNOO PRO Cote d'Ivoire Test",
    "currency": "XOF",
    "timezone": "Africa/Abidjan",
    "status": "active",
    "support_email": "support-ci-test@upjunoo.test",
    "support_phone": "+2250100000000",
    "created_at": "2026-06-03T18:05:50.257686+00:00"
  }
}
```

**Sous-routes testées** :

```json
// GET /v1/franchises/{id}/revenue
{ "revenue": { "totalXof": 340050, "ordersCount": 100 } }

// GET /v1/franchises/{id}/partners?page=1&limit=5
{ "items": [/* 1 partenaire */], "pagination": { "total": 1 } }

// GET /v1/franchises/{id}/drivers?page=1&limit=3
{ "items": [/* 3 chauffeurs */], "pagination": { "total": 1000, "hasMore": true } }
```

### Rendu actuel

| Écran | Mode `USE_MOCKS=false` | Ce que voit l’admin |
|-------|------------------------|---------------------|
| Liste franchises | Appel `/api/v2/admin/network/franchises` | **Erreur** — route v2 absente sur API réelle |
| Détail franchise | Appel `/api/v2/admin/network/franchises/:id` | **Erreur** — idem |
| Sélecteur dashboard | `filters.options.franchises` | 2 noms, ville souvent `—` |

### Tableau des écarts

| Champ / UX | Mock | API v1 | Statut |
|------------|------|--------|--------|
| **Liste admin** | `GET …/franchises` paginée | **404** `GET /v1/admin/franchises` | **Écart P1** |
| `name` | Côte d'Ivoire | `name` sur détail + dashboard | **Partiel** (liste absente) |
| `city` | Abidjan | Souvent `null` (dashboard) | **Écart P1** |
| `partners_count` / `drivers_count` / `zones_count` | Compteurs liste | Absents liste ; drivers via sous-route | **Écart P1** |
| `revenue_month_fcfa` | KPI liste + détail | `revenue.totalXof` (période à clarifier) | **Écart P1** |
| **Détail admin unifié** | 1 réponse mock | Profil + sous-routes séparées | **Écart P1** |
| Onglet **Partenaires** | Tableau embarqué | `GET …/partners` | **Mappable** |
| Onglet **Zones** | Tableau zones | **Pas de route** | **Écart P1** |
| `commission_month_fcfa` | KPI détail | Absent de `/revenue` | **Écart P2** |
| `recent_transactions` | Panneau latéral | **Pas de route** | **Écart P2** |
| Création franchise `POST` | Mock v2 | Non testé admin v1 | **Écart P2** |
| IDs | `number` mock | UUID | Types front `string \| number` OK |

### Demandes backend — Franchises (à transmettre)

#### P1 — Bloquant écrans Réseau > Franchises

| # | Demande | Bénéfice UI |
|---|---------|-------------|
| FR-01 | `GET /v1/admin/franchises?page=&limit=` | Liste admin paginée (comme partners/drivers) |
| FR-02 | Champs liste : `name`, `cityLabel`, `status`, `partnersCount`, `driversCount`, `zonesCount`, `revenueMonthXof` | Colonnes tableau = maquette |
| FR-03 | `GET /v1/admin/franchises/{id}` — fiche agrégée **ou** contrat documenté pour composer les sous-routes | Détail admin sans mock v2 |

#### P2 — Compléter la fiche

| # | Demande | Bénéfice UI |
|---|---------|-------------|
| FR-04 | `GET /v1/franchises/{id}/zones` ou `zones[]` dans le détail | Onglet Zones |
| FR-05 | `commissionMonthXof`, `tripsMonth` dans stats/revenue | KPIs onglet Aperçu |
| FR-06 | `recentTransactions[]` ou endpoint finance filtré par franchise | Panneau latéral |
| FR-07 | `city` / `cityLabel` sur dashboard + liste | Fin des `—` dans sélecteur et tableau |

#### Contournement front possible (en attendant FR-01)

1. Liste dégradée depuis `dashboard.filters.options.franchises` (sans compteurs ni pagination).
2. Détail composé : `GET /v1/franchises/{id}` + `/partners` + `/drivers` + `/revenue` (sans zones ni transactions).

Fichiers front : `franchises.service.ts`, `franchiseDetail.service.ts`, `FranchisesListPage.tsx`, `FranchiseDetailPage.tsx`.

---

## 10. Partenaires

**Route** : `GET /v1/admin/partners`  
**Page** : `/admin/network/partners`

### Attendu UI (mock)

```json
{
  "data": [
    {
      "id": 12,
      "name": "Cocody Express",
      "franchise_name": "Côte d'Ivoire",
      "franchise_id": 1,
      "city": "Abidjan",
      "drivers_count": 186,
      "status": "active",
      "contact_email": "contact@cocodyexpress.ci",
      "contact_phone": "+225 07 00 00 12 12"
    }
  ]
}
```

### Reçu API v1 (réel — juin 2026)

```json
{
  "status": "ok",
  "items": [
    {
      "id": "82214755-93d3-4b64-9311-c1747ceacb96",
      "legal_name": "AL BARAKAH SARL",
      "trade_name": "AL BARAKAH",
      "name": "AL BARAKAH",
      "franchise_id": null,
      "franchiseName": null,
      "city_id": "d80a0f88-fea5-41e4-8fb8-4e82a8a2758c",
      "cityLabel": null,
      "driversCount": 0,
      "contact_phone": "+2250700000101",
      "contact_email": null,
      "status": "active"
    }
  ]
}
```

### Rendu actuel (front mappé)

```json
{
  "data": [
    {
      "id": "82214755-93d3-4b64-9311-c1747ceacb96",
      "name": "AL BARAKAH",
      "franchise_name": "—",
      "franchise_id": "—",
      "city": "—",
      "drivers_count": 0,
      "status": "active",
      "contact_email": "—",
      "contact_phone": "+2250700000101"
    }
  ]
}
```

### Tableau des écarts

| Champ UI | Mock | API | Rendu | Statut |
|----------|------|-----|-------|--------|
| `name` | Cocody Express | `name` / `trade_name` | AL BARAKAH | **Résolu** |
| `franchise_name` | Côte d'Ivoire | Souvent `null` | — | **Écart P1** |
| `city` | Abidjan | `cityLabel` souvent `null` | — | **Écart P1** |
| `drivers_count` | 186 | Souvent `0` en seed | 0 | **Écart P1** (données seed) |
| `contact_email` | email | souvent `null` | — | **Écart P2** |

### Exemple visuel comparé

| Colonne | Maquette | API v1 mappé (juin 2026) |
|---------|----------|--------------------------|
| Partenaire | Cocody Express | AL BARAKAH |
| Franchise | Côte d'Ivoire | — |
| Ville | Abidjan | — |
| Chauffeurs | 186 | 0 |
| Email | contact@cocody… | — |

---

## 11. Retraits

**Route** : `GET /v1/admin/withdrawals`  
**Page** : `/admin/finance/withdrawals`

### Attendu UI (mock)

```json
{
  "data": [
    {
      "id": "WD-4401",
      "owner_name": "Cocody Express",
      "owner_id": 12,
      "franchise_name": "Côte d'Ivoire",
      "amount_fcfa": 450000,
      "method": "orange_money",
      "account_label": "OM · 07 ** ** 12 12",
      "status": "pending",
      "wallet_balance_fcfa": 520000
    }
  ],
  "summary": {
    "pending_count": 3,
    "pending_amount_fcfa": 705000
  }
}
```

### Reçu API v1 (réel — juin 2026)

```json
{
  "status": "ok",
  "items": [
    {
      "id": "6c8f366f-196f-463c-b8d1-a48fa6c647e5",
      "requested_by": "21ace9a4-eafd-4e11-903e-d8afc070e6d0",
      "amount_xof": 1000,
      "destination_type": "MOBILE_MONEY",
      "destination_identifier": "0700000000",
      "status": "pending",
      "beneficiaryName": "Independent Driver",
      "ownerName": "Independent Driver",
      "ownerId": "b835a76f-3ad7-4d6c-9ccf-e4889a2ab5ec",
      "franchiseName": null,
      "walletBalanceXof": 0,
      "created_at": "2026-06-03T16:33:48Z"
    }
  ],
  "summary": {
    "pendingCount": 1,
    "pendingAmountXof": 1000
  }
}
```

### Rendu actuel (front mappé)

```json
{
  "data": [
    {
      "id": "6c8f366f-196f-463c-b8d1-a48fa6c647e5",
      "owner_name": "Independent Driver",
      "owner_id": "b835a76f-3ad7-4d6c-9ccf-e4889a2ab5ec",
      "franchise_name": "—",
      "amount_fcfa": 1000,
      "method": "orange_money",
      "account_label": "0700000000",
      "status": "pending",
      "wallet_balance_fcfa": 0
    }
  ],
  "summary": {
    "pending_count": 1,
    "pending_amount_fcfa": 1000
  }
}
```

### Tableau des écarts

| Champ UI | Mock | API | Rendu | Statut |
|----------|------|-----|-------|--------|
| `owner_name` | Cocody Express | `beneficiaryName` | Independent Driver | **Résolu** |
| `summary` | Calculé front | `summary.pendingCount` | API directe | **Résolu** |
| `franchise_name` | Côte d'Ivoire | `null` en seed | — | **Écart P1** |
| `wallet_balance_fcfa` | 520 000 | `0` en seed | 0 | **Écart P2** (données) |
| `account_label` masqué | OM · 07 ** ** 12 12 | Numéro brut | 0700000000 | **Écart P2** (UI) |

### Exemple visuel comparé

| Colonne | Maquette | API v1 mappé (juin 2026) |
|---------|----------|--------------------------|
| Bénéficiaire | Cocody Express | Independent Driver |
| Franchise | Côte d'Ivoire | — |
| Montant | 450 000 FCFA | 1 000 FCFA (données seed) |
| Compte | OM · 07 ** ** 12 12 | 0700000000 |
| Solde portefeuille | 520 000 FCFA | 0 |

Les actions **Approuver / Rejeter** utilisent bien `POST /v1/admin/withdrawals/{id}/approve|reject`.

---

## 12. Clients admin

**Route** : `GET /v1/admin/users`  
**Page** : `/admin/fleet/clients`  
**Statut** : **Intégré** (juin 2026 — anciennement HTTP 500)

### Attendu UI (mock)

```json
{
  "id": 501,
  "full_name": "Koné Aicha",
  "phone": "+225 07 55 44 33 22",
  "trips_count": 24,
  "wallet_balance_fcfa": 12500,
  "type": "b2c",
  "status": "active"
}
```

### Reçu API v1 (réel)

```json
{
  "status": "ok",
  "users": [
    {
      "id": "791c763a-4785-4c3a-be89-9de1eadb418b",
      "fullName": "Dev Client",
      "phone": "+2250700000001",
      "email": "dev.client@upjunoo-dev.tech",
      "tripsCount": 39,
      "walletBalanceXof": 5000,
      "userType": "CLIENT",
      "status": "active",
      "createdAt": "2026-06-03T20:41:26Z"
    }
  ]
}
```

### Rendu actuel (front mappé)

```json
{
  "data": [
    {
      "id": "791c763a-4785-4c3a-be89-9de1eadb418b",
      "full_name": "Dev Client",
      "phone": "+2250700000001",
      "email": "dev.client@upjunoo-dev.tech",
      "type": "b2c",
      "status": "active",
      "trips_count": 39,
      "wallet_balance_fcfa": 5000,
      "registered_at": "2026-06-03T20:41:26Z",
      "last_trip_at": null
    }
  ]
}
```

Fichiers : `adminUsers.mapper.ts`, `clients.service.ts` (branche v1 via `useLegacyAdminApi()`).

### Tableau des écarts

| Champ / aspect | Mock | API | Rendu | Statut |
|----------------|------|-----|-------|--------|
| Liste clients | OK | `users[]` camelCase | Mapper OK | **Résolu** |
| Filtre `userType=CLIENT` | — | Tous types mélangés | Filtre front | Contournement |
| `type` b2c/b2b | Distinction | Absent | Toujours `b2c` | **Écart P2** |
| `last_trip_at` | Date | Absent | `null` | **Écart P2** |
| Détail client | `GET /clients/:id` mock | **Pas de route v1** | Legacy mock | **Écart P1** |
| Suspend / activate | Mock POST | **Pas branché v1** | Legacy mock | **Écart P1** |
| Pagination | serveur | Lot complet | **client** | **Écart P2** |

---

## 13. Routes non intégrées ou restantes

| Route | Test dev (juin 2026) | Statut front | Action |
|-------|----------------------|--------------|--------|
| `GET /v1/admin/franchises` | **404** | Liste = mock v2 | **Demander route admin** (§9 FR-01) |
| `GET /v1/franchises/{id}` | **200** | Détail = mock v2 | Composer ou `GET /v1/admin/franchises/{id}` |
| `GET /v1/franchises/{id}/partners` | **200** | Non branché | Onglet partenaires fiche franchise |
| `GET /v1/franchises/{id}/drivers` | **200** | Non branché | Compteur / liste chauffeurs franchise |
| `GET /v1/franchises/{id}/revenue` | **200** | Non branché | KPI revenus fiche franchise |
| `GET /v1/admin/users` | **200 OK** | Liste intégrée | Détail + actions à brancher |
| `GET /v1/admin/users/:id` | Non exposé / non branché | Fiche client = mock | Route dédiée ou enrichir liste |
| `GET /v1/admin/vehicles` | 200 OK (100 items) | Non branché | Écran admin véhicules |
| `GET /v1/admin/live-orders` | Non testé front | — | Stats carte sans reload live-map |
| `GET /v1/admin/approval-requests` | 200, `items: []` | Non branché | Véhicules à valider |
| `GET /v1/admin/finance/dashboard` | — | **Mock** `/api/v2` | Dashboard finance admin |
| `/v1/partner/*` | Tag Swagger **99** | Portail partenaire = **mock** | Routes partenaire P2 |
| Refresh token | `POST /v1/auth/refresh` | Non utilisé sur 401 | Session : redirect login |

---

## Synthèse — état des écarts (5 juin 2026)

### Résolus depuis la version initiale du document

| Module | Ce qui fonctionne maintenant |
|--------|------------------------------|
| **Auth** | Messages FR, reste sur page login portail, validation rôle |
| **Dashboard** | Filtre franchise via `filters.options` |
| **Courses** | `client.displayName`, `order_reference`, filtres périmètre |
| **Chauffeurs** | Noms, téléphone, zone, partenaire, note (si `profile` présent) |
| **KYC** | Cartes document fiche chauffeur + actions `approve/reject` par doc v1 |
| **Partenaires** | Nom commercial (`name`) |
| **Retraits** | `beneficiaryName`, `summary` API |
| **Clients** | Liste via `GET /v1/admin/users` |
| **Pagination** | `page` + `limit` branchés (drivers, partners, orders, users, withdrawals) |

### Écarts restants — priorités backend

| Priorité | Module | Champ(s) encore manquant(s) ou partiels | Bénéfice |
|----------|--------|-------------------------------------------|----------|
| **P1** | **Franchises** | `GET /v1/admin/franchises` + détail admin (FR-01 à FR-03) | Écrans Réseau > Franchises utilisables |
| **P1** | Orders | `driver.displayName`, `partnerName`, `franchiseName` sur chaque order | Colonnes courses complètes |
| **P1** | Partners | `franchiseName`, `cityLabel`, `driversCount` réels (souvent null/0) | Réseau = maquette |
| **P0** | KYC | `file_url` accessible (URLs signées) | Aperçu permis/CNI dans les cartes |
| **P1** | KYC | `kyc_documents[]` dans fiche driver + queue agrégée | Fin jointure/regroupement front |
| **P1** | KYC | `document_type_label` FR + seed multi-docs | Libellés + grille réaliste |
| **P1** | Clients | `GET /users/:id`, suspend/activate v1 | Fiche client réelle |
| **P1** | Withdrawals | `franchiseName`, solde wallet réel | Finance complète |
| **P2** | Auth | `permissions[]` dans login/me | Droits réels |
| **P2** | Drivers | `vehicleLabel` = plaque/modèle (pas seulement catégorie) | Colonne véhicule |
| **P2** | Drivers / zones | `zoneName` = quartier (pas seulement ville) | Filtre zone précis |
| **P2** | Franchises | Zones + transactions récentes + `commissionMonthXof` (FR-04 à FR-06) | Fiche détail = maquette |
| **P2** | Listes restantes | Pagination serveur (KYC file, véhicules…) | Perf + taille page réelle |
| **P2** | Dashboard | `filters.options.franchises[].city` | Libellé sélecteur |
| **P3** | Véhicules | Brancher `GET /v1/admin/vehicles` | Écran flotte véhicules |
| **P3** | Portail partenaire | Routes `/v1/partner/*` | Fin des mocks partenaire |

---

## Fichiers front de référence

| Rôle | Chemin |
|------|--------|
| Mappers courses liste | `src/features/ops/api/adminOrders.mapper.ts` |
| Mappers course détail | `src/features/ops/api/adminOrderDetail.mapper.ts` |
| Contexte Swagger live | `docs/API-SWAGGER-CONTEXT.md` |
| Mappers chauffeurs | `src/features/fleet/api/adminDrivers.mapper.ts` |
| Mappers KYC file | `src/features/fleet/api/adminKyc.mapper.ts` |
| Mappers KYC cartes | `src/features/fleet/api/kycDocument.mapper.ts` |
| Composant carte doc | `src/shared/ui/KycDocumentCard.tsx` |
| Mappers partenaires | `src/features/network/api/adminPartners.mapper.ts` |
| Franchises (mock v2) | `src/features/network/api/franchises.service.ts`, `franchiseDetail.service.ts` |
| Pagination v1 | `src/core/api/v1Pagination.ts` |
| Mappers retraits | `src/features/finance/api/adminWithdrawals.mapper.ts` |
| Mappers clients | `src/features/fleet/api/adminUsers.mapper.ts` |
| Filtres dashboard → courses | `src/features/ops/api/dashboard.mapper.ts` (`mapDashboardFilterOptions`) |
| IDs UUID filtres | `src/shared/lib/scopeId.ts` |
| Smoke test API | `scripts/test-v1-api.mjs` |
| Mode mock / v1 | `src/core/api/v1AdminMode.ts` |
| Synthèse courte | `docs/API-ECARTS-V1.md` |
| Intégration globale | `docs/API-INTEGRATION-BACKOFFICE.md` |

---

*Document rédigé pour partage équipe produit / backend — UpJunoo Pro Back-office v2.*
