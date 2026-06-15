# Demandes Backend - Module Franchise

## 🚨 Problèmes Critiques

### 1. Filtre par Partenaire - Erreur sur dernier partenaire ⚠️ CONFIRMÉ

**Test:** 2026-06-09 - Utilisateur: "Dernier partenaire affiche 'Impossible de charger les courses'"

**Problème:** Quand on sélectionne le dernier partenaire dans le filtre de la page `/franchise/trips`, on obtient une erreur "Impossible de charger les courses."

**Analyse Frontend:**
- Le frontend envoie `GET /v1/franchises/{id}/orders?partner_id=XXX`
- Le backend retourne **HTTP 404** (probablement) au lieu d'une liste vide
- Le frontend interprète cette erreur comme un échec de chargement

**Demande Backend:**
```
GET /v1/franchises/{id}/orders?partner_id=XXX
```

**Problème identifié:** L'API retourne une erreur 404 quand on filtre par `partner_id` qui n'a pas de courses (ou qui n'existe pas/plus).

**Action requise:**
- [ ] Retourner HTTP 200 avec `{"orders": [], "pagination": {...}}` quand un partenaire n'a pas de courses
- [ ] Ne pas retourner d'erreur 404 pour un filtre valide qui n'a simplement pas de résultats

**Frontend workaround appliqué:**
- ✅ Catch 404 et retourne liste vide au lieu d'erreur
- ⚠️ Le backend doit quand même corriger pour les vraies erreurs 404 (endpoint inexistant)

---

### 2. Détail d'un Partenaire - "Partenaire introuvable"

**Problème:** Quand on clique sur un partenaire dans la liste, la page de détail affiche "Partenaire introuvable".

**Analyse Frontend:**
- Le frontend essaie d'appeler `GET /v1/partners/{id}` (endpoint public)
- Cet endpoint retourne probablement une 403 (Forbidden) ou 404 pour un utilisateur franchise
- Il n'existe pas d'endpoint spécifique franchise pour récupérer le détail d'un partenaire

**Endpoints actuels:**
```
GET /v1/partners/{id}           → Endpoint public - Accès refusé aux franchises
GET /v1/franchises/{id}/partners → Liste uniquement, pas de détail individuel
```

**Demande Backend:**

**Option A - Nouvel endpoint (Recommandé):**
```
GET /v1/franchises/{franchiseId}/partners/{partnerId}
```

Retourne les détails d'un partenaire spécifique appartenant à la franchise.

**Option B - Modifier l'endpoint public:**
Autoriser les utilisateurs franchise à accéder à `GET /v1/partners/{id}` si le partenaire appartient à leur franchise.

---

### 3. Recherche - Ne retourne pas les résultats existants ⚠️ CONFIRMÉ

**Test:** 2026-06-09 - Utilisateur: "Je recherche une Réf qui existe, mais rien ne s'affiche"

**Problème:** La barre de recherche ne retourne pas les résultats même quand on cherche une référence qui existe.

**Analyse Frontend:**
- L'API `GET /v1/franchises/{id}/orders?search=XXX` (où XXX = ref existante)
- Le backend ne trouve pas la course alors qu'elle existe
- Possible problème: recherche sensible à la casse, ou champ `ref` non indexé

**Demande Backend:**
```
GET /v1/franchises/{id}/orders?search=d3af7715-dfeb-49e2-8c7f-4cf543374ae0
```

**Problème identifié:** La recherche par référence ne fonctionne pas correctement.

**Action requise:**
- [ ] Vérifier que la recherche par `ref` fonctionne (insensible à la casse)
- [ ] Vérifier que la recherche par `id` fonctionne
- [ ] Vérifier que la recherche par nom client/chauffeur fonctionne
- [ ] Retourner HTTP 200 avec liste vide si vraiment pas de résultats (pas d'erreur)

**Note:** Le problème n'est PAS "pas de résultats", c'est "résultats existants non trouvés".

---

## 🔧 Améliorations Requises

### 4. Détail d'une Course - Données ne s'affichent pas ⚠️ CONFIRMÉ

**Test:** 2026-06-09 - Utilisateur: "les données pour course ne s'affiche pas sur /franchise/trips/d3af7715-dfeb-49e2-8c7f-4cf543374ae0"

**Problème:** La page de détail d'une course ne charge pas les données.

**Demande Backend:**
```
GET /v1/franchises/{franchiseId}/orders/{orderId}
```

**Problèmes possibles:**
1. L'endpoint retourne 404 ou 500
2. L'endpoint retourne des données mais avec un format inattendu
3. Le champ `order` est null/undefined dans la réponse

**Format de réponse attendu:**
```json
{
  "status": "success",
  "order": {
    "id": "d3af7715-dfeb-49e2-8c7f-4cf543374ae0",
    "ref": "...",
    "service": "taxi",
    "status": "completed",
    "client": {...},
    "driver": {...},
    "vehicle": {...},
    "pickup_location": {...},
    "dropoff_location": {...},
    "final_price_xof": 5000,
    "commission_xof": 750,
    "driver_earning_xof": 3500,
    "timeline": [...],  // ⚠️ DOIT être un tableau, même vide (pas null/undefined)
    ...
  }
}
```

**⚠️ Champ `timeline` critique:**
Le champ `timeline` doit toujours être un tableau (même vide `[]`), jamais `null` ou `undefined`. Sinon le frontend crash avec l'erreur "events is not iterable".

**Frontend workaround appliqué:**
- ✅ Timeline défensive: `Array.isArray(timeline) ? timeline : []`
- ⚠️ Le backend doit quand même corriger l'endpoint pour retourner les données

---

### 5. Live Map - Erreur de chargement ⚠️ CONFIRMÉ

**Test:** 2026-06-09 - Utilisateur: "Impossible de charger la carte live." en rouge

**Problème:** La carte live ne se charge pas.

**Analyse Frontend:**
- Le frontend appelle l'endpoint admin: `GET /admin/livemap?franchiseId=XXX`
- L'endpoint retourne une erreur (probablement 404 ou 500)

**Code actuel:**
```typescript
buildFranchiseLiveMapEndpoint(franchiseId, filters)
// => /admin/livemap?franchiseId=XXX&includeWithoutLocation=true
```

**Demande Backend:**
**Option A - Créer endpoint franchise dédié (recommandé):**
```
GET /v1/franchises/{franchiseId}/livemap
```

**Option B - Corriger l'endpoint admin existant:**
- Vérifier que `/admin/livemap?franchiseId=XXX` fonctionne pour les utilisateurs franchise

**Action requise:**
- [ ] Créer endpoint franchise V1 OU corriger endpoint admin

---

### 6. Console Dispatch - Erreur de chargement ⚠️ CONFIRMÉ

**Test:** 2026-06-09 - Utilisateur: "Impossible de charger la console dispatch."

**Problème:** La console dispatch ne se charge pas.

**Analyse Frontend:**
- Le frontend appelle l'endpoint legacy: `GET /franchise/dispatch/orders`
- L'endpoint retourne **HTTP 404** (probablement inexistant ou non implémenté)

**Code actuel:**
```typescript
// dispatch.service.ts
list: (params) => apiClient.get(`/franchise/dispatch/orders${buildListQuery(params)}`)
```

**Demande Backend:**
**Créer endpoint franchise V1:**
```
GET /v1/franchises/{franchiseId}/dispatch/orders
```

Ou réactiver l'endpoint legacy existant.

**Action requise:**
- [ ] Créer endpoint `/v1/franchises/{id}/dispatch/orders` OU réactiver `/franchise/dispatch/orders`
- [ ] Endpoint doit retourner les courses en cours pour la franchise

---

### 7. Carte Territoire - Erreur de chargement ⚠️ CONFIRMÉ

**Test:** 2026-06-09 - Utilisateur: "Impossible de charger la carte territoire."

**Problème:** La carte territoire ne se charge pas.

**Analyse Frontend:**
- Le frontend appelle l'endpoint legacy: `GET /franchise/territory`
- L'endpoint retourne **HTTP 404** (probablement inexistant)

**Code actuel:**
```typescript
// territory.service.ts
get: () => apiClient.get<FranchiseTerritory>("/franchise/territory")
```

**Demande Backend:**
**Créer endpoint franchise V1:**
```
GET /v1/franchises/{franchiseId}/territory
```

**Action requise:**
- [ ] Créer endpoint `/v1/franchises/{id}/territory`
- [ ] Retourner les limites géographiques du territoire de la franchise

---

### 8. Détail Chauffeur - Endpoint manquant + KYC ⚠️ CONFIRMÉ

**Test:** 2026-06-09 - Utilisateur: "Détail chauffeur ne fonctionne pas - Chauffeur introuvable" puis "pas de données KYC"

**Problèmes identifiés:**
1. **Endpoint manquant:** La page affiche "Chauffeur introuvable" car l'endpoint n'existe pas
2. **KYC manquants:** Les documents KYC ne sont pas retournés

**Analyse Frontend:**
- Endpoint utilisé: `GET /v1/franchises/{id}/drivers/{driverId}` → **HTTP 404/403**
- **Frontend workaround:** Fallback vers liste + mapping partiel (fonctionnel mais sans KYC)
- Les KYC ne sont pas accessibles via l'endpoint franchise actuel

**Demande Backend - CRITIQUE:**

**Créer endpoint franchise V1:**
```
GET /v1/franchises/{franchiseId}/drivers/{driverId}
```

**Champs requis dans la réponse:**
```json
{
  "id": "string",
  "first_name": "string",
  "last_name": "string", 
  "phone": "string",
  "email": "string",
  "zone": "string",
  "account_status": "pending|approved|suspended|banned",
  "availability": "offline|online|on_trip|paused",
  "owner_id": "string",
  "owner_name": "string",
  "vehicle_label": "string",
  "franchise_id": "string",
  "stats": {
    "trips_total": 0,
    "wallet_balance_fcfa": 0
  },
  "kyc_documents": [
    {
      "id": "string",
      "type": "cni|license|registration|selfie",
      "status": "pending|approved|rejected",
      "uploaded_at": "string",
      "preview_url": "string"
    }
  ],
  "timeline": []
}
```

**Action requise:**
- [ ] **CRÉER** l'endpoint `/v1/franchises/{id}/drivers/{driverId}` (n'existe pas)
- [ ] Retourner **tous les champs** du chauffeur
- [ ] Inclure `kyc_documents[]` avec les documents du chauffeur
- [ ] Retourner **403** si le chauffeur n'appartient pas à la franchise

---

### 9. Chauffeurs - Filtres non fonctionnels ⚠️ CONFIRMÉ

**Test:** 2026-06-09 - Utilisateur: "la barre de recherche ne trouve pas des éléments qui pourtant existent. filtre pas zone, par compte, disponibilité ne fonctionne pas"

**Problème:** Les filtres sur la liste des chauffeurs ne fonctionnent pas.

**Filtres concernés:**
- 🔍 **Recherche** (nom, téléphone, partenaire)
- 🌍 **Zone** (Cocody, Yopougon, etc.)
- 👤 **Statut compte** (approuvé, en attente, suspendu)
- 📍 **Disponibilité** (en ligne, hors ligne, en course, pause)

**Analyse Frontend:**
- Le frontend envoie correctement les paramètres:
```
GET /v1/franchise/drivers?search=Jean&zone=Cocody&account_status=pending&availability=online
```
- L'endpoint `/v1/franchise/drivers` **ignore ces paramètres** et retourne toujours tous les chauffeurs

**Demande Backend:**
**Ajouter support des query params sur `/v1/franchise/drivers`:**
```
GET /v1/franchise/drivers?search=XXX&zone=XXX&account_status=XXX&availability=XXX
```

| Paramètre | Type | Description |
|-----------|------|-------------|
| `search` | string | Recherche nom, téléphone, email |
| `zone` | string | Filtrer par zone géographique |
| `account_status` | string | `approved`, `pending`, `suspended` |
| `availability` | string | `online`, `offline`, `on_trip`, `paused` |

**Action requise:**
- [ ] Ajouter la recherche textuelle (nom, téléphone, partenaire)
- [ ] Ajouter le filtre par zone
- [ ] Ajouter le filtre par statut compte
- [ ] Ajouter le filtre par disponibilité

---

### 10. Détail Partenaire - Champs manquants ⚠️ CONFIRMÉ

**Test:** 2026-06-09 - Utilisateur: "la page de détails n'affiche pas toutes les données"

**Problème:** La page de détail d'un partenaire manque des informations.

**Champs manquants dans la réponse API:**
- `address` → Affiché comme "—" 
- `vehicles_count` → Affiché comme "0"

**Endpoint utilisé:**
```
GET /v1/franchises/{franchiseId}/partners/{partnerId}
```

**Format attendu:**
```json
{
  "id": "...",
  "trade_name": "...",
  "legal_name": "...",
  "address": "Abidjan, Cocody...",  // ⚠️ MANQUANT
  "vehicles_count": 15,              // ⚠️ MANQUANT
  "created_at": "2024-01-15...",
  ...
}
```

**Action requise:**
- [ ] Ajouter le champ `address` dans la réponse
- [ ] Ajouter le champ `vehicles_count` (nombre de véhicules du partenaire)

---

### 11. Finance - "Impossible de charger" ❌ CONFIRMÉ

**Test:** 2026-06-09 - Utilisateur: "Impossible de charger"

**Problème:** La page Finance ne charge pas - erreur 404 sur les endpoints legacy.

**Endpoints concernés (Legacy → Retournent 404):**
```
GET /franchise/finance
GET /franchise/finance/driver-transfers/stats
GET /franchise/finance/driver-transfers
GET /franchise/finance/partner-transfers/stats
GET /franchise/finance/partner-transfers
```

**Frontend:** 
- Utilise les endpoints legacy `/franchise/*`
- Tous retournent **HTTP 404**

**Demande Backend - CRÉER ENDPOINTS V1:**

| Endpoint V1 Requis | Méthode | Description |
|-------------------|---------|-------------|
| `/v1/franchises/{id}/finance` | GET | Balance, transactions, stats |
| `/v1/franchises/{id}/driver-transfers` | GET | Liste transferts chauffeurs |
| `/v1/franchises/{id}/driver-transfers/stats` | GET | Stats transferts chauffeurs |
| `/v1/franchises/{id}/partner-transfers` | GET | Liste transferts partenaires |
| `/v1/franchises/{id}/partner-transfers/stats` | GET | Stats transferts partenaires |
| `/v1/franchises/{id}/driver-recharge` | POST | Recharger un chauffeur |
| `/v1/franchises/{id}/partner-recharge` | POST | Recharger un partenaire |

**Format attendu pour `/v1/franchises/{id}/finance`:**
```json
{
  "balance_fcfa": 1500000,
  "commission_month_fcfa": 450000,
  "payouts_pending_fcfa": 0,
  "available_fcfa": 1500000,
  "transactions": [
    {
      "id": "tx_123",
      "label": "Commission course #ABC123",
      "amount_fcfa": 2500,
      "direction": "credit",
      "created_at": "2024-06-09T10:30:00Z"
    }
  ]
}
```

**Action requise:**
- [ ] Créer tous les endpoints V1 finance franchise
- [ ] Scoper les données à la franchise (ne pas retourner d'autres franchises)
- [ ] Implémenter les recharges chauffeurs/partenaires

---

### 12. Live Map - "Impossible de charger" ❌ CONFIRMÉ

**Test:** 2026-06-09 - Utilisateur: "Impossible de charger"

**Problème:** La carte Live Map ne charge pas - erreur 404.

**Page:** `/franchise/ops/map`

**Endpoint concerné:**
```
GET /v1/franchises/{id}/livemap
```

**Frontend:**
- Endpoint ajouté côté frontend: `LINKS.franchise.v1.liveMap(id)`
- Retourne **HTTP 404** (endpoint inexistant côté backend)

**Demande Backend - CRÉER ENDPOINT:**
```
GET /v1/franchises/{franchiseId}/livemap
```

**Format attendu:**
```json
{
  "drivers": [
    {
      "id": "drv_123",
      "first_name": "Kouassi",
      "last_name": "Jean",
      "phone": "+225 01 23 45 67",
      "latitude": 5.3456,
      "longitude": -4.0234,
      "status": "online|on_trip|offline",
      "vehicle_type": "taxi",
      "zone": "Cocody"
    }
  ],
  "orders": [
    {
      "id": "ord_456",
      "status": "in_progress",
      "driver_id": "drv_123",
      "client_name": "Client A",
      "pickup_lat": 5.3456,
      "pickup_lng": -4.0234,
      "dropoff_lat": 5.3678,
      "dropoff_lng": -4.0567
    }
  ],
  "filter_options": {
    "zones": ["Cocody", "Yopougon", "Plateau"],
    "services": ["taxi", "delivery"],
    "statuses": ["online", "on_trip", "offline"]
  }
}
```

**Action requise:**
- [ ] Créer endpoint `/v1/franchises/{id}/livemap`
- [ ] Retourner uniquement les chauffeurs et courses de la franchise
- [ ] Inclure positions GPS des chauffeurs actifs
- [ ] Inclure courses en cours avec coordonnées

---

### 11. Filtre Service - Incohérence "Tous services"

**Problème:** Le filtre "Tous services" montre le même nombre de courses que "Taxi" uniquement.

**Analyse:**
- Quand `service=all` ou pas de paramètre `service`, l'API semble filtrer par défaut sur "taxi"
- Ou le comptage/statistique est incorrect

**Demande Backend:**
```
GET /v1/franchises/{id}/orders?service=all
```

**Action requise:**
- [ ] Quand `service=all` ou pas de paramètre `service`, retourner TOUTES les courses sans filtre de service
- [ ] Vérifier que les statistiques/counts reflètent bien tous les services

---

## 📋 Résumé des Endpoints à Créer/Modifier - Mise à jour 2026-06-09

### 🔴 Priorité Haute (Bloquant)

| Endpoint | Méthode | Problème | Action requise |
|----------|---------|----------|----------------|
| `/v1/franchises/{id}/drivers/{driverId}` | GET | Endpoint manquant | Créer endpoint avec tous les champs + `kyc_documents` |
| `/v1/franchise/drivers` | GET | Filtres ignorés | Ajouter `search`, `zone`, `account_status`, `availability` |
| `/v1/franchises/{id}/orders` | GET | Erreur 404 au lieu de liste vide | Retourner 200+[] quand pas de résultats |
| `/v1/franchises/{id}/orders?search=XXX` | GET | Recherche non fonctionnelle | Corriger la recherche par référence/nom |
| `/v1/franchises/{id}/orders/{orderId}` | GET | Données vides/timeline manquante | Retourner les données complètes avec `timeline: []` |
| `/v1/franchises/{id}/partners/{partnerId}` | GET | Champs `address`, `vehicles_count` manquants | Ajouter ces champs à la réponse |

### 🟡 Priorité Moyenne (Fonctionnel mais incomplet)

| Endpoint | Méthode | Problème | Action requise |
|----------|---------|----------|----------------|
| `/v1/franchises/{id}/orders?service=all` | GET | Filtre par défaut sur taxi | Ne pas filtrer quand `service=all` |
| `/v1/franchises/{id}/livemap` | GET | Endpoint manquant | Créer endpoint carte live |
| `/v1/franchises/{id}/territory` | GET | Endpoint manquant | Créer endpoint territoire |
| `/v1/franchises/{id}/finance` | GET | Legacy 404 | Créer endpoint finance |

### 🟢 Fonctionnels (✅)

| Endpoint | Méthode | Statut | Note |
|----------|---------|--------|------|
| `/v1/franchises/{id}/dashboard` | GET | ✅ OK | Dashboard principal |
| `/v1/franchises/{id}/partners` | GET | ✅ OK | Liste des partenaires |
| `/v1/franchise/drivers` | GET | ✅ OK | Liste des chauffeurs (sans filtres) |

## � Phase 2 - Migration Endpoints Legacy vers V1

Les endpoints suivants utilisent actuellement des routes legacy (`/franchise/*`). Ils doivent être migrés vers des endpoints V1 franchise dédiés (`/v1/franchises/{id}/*`).

### Finance
| Legacy | V1 Proposé | Méthode | Description |
|--------|------------|---------|-------------|
| `/franchise/finance` | `/v1/franchises/{id}/finance` | GET | Balance et transactions |
| `/franchise/finance/driver-transfers` | `/v1/franchises/{id}/driver-transfers` | GET | Transfers chauffeurs |
| `/franchise/finance/driver-recharge` | `/v1/franchises/{id}/driver-recharge` | POST | Recharge chauffeur |
| `/franchise/finance/partner-transfers` | `/v1/franchises/{id}/partner-transfers` | GET | Transfers partenaires |
| `/franchise/finance/partner-recharge` | `/v1/franchises/{id}/partner-recharge` | POST | Recharge partenaire |

### Marketing
| Legacy | V1 Proposé | Méthode | Description |
|--------|------------|---------|-------------|
| `/franchise/marketing/campaigns` | `/v1/franchises/{id}/campaigns` | GET/POST | Campagnes marketing |
| `/franchise/marketing/banners` | `/v1/franchises/{id}/banners` | GET/POST | Bannières |

### Pricing (Tarification)
| Legacy | V1 Proposé | Méthode | Description |
|--------|------------|---------|-------------|
| `/franchise/pricing` | `/v1/franchises/{id}/pricing` | GET | Liste règles tarifaires |
| `/franchise/pricing` | `/v1/franchises/{id}/pricing` | POST | Créer règle |
| `/franchise/pricing/{id}` | `/v1/franchises/{id}/pricing/{ruleId}` | PUT | Modifier règle |

### Territory (Territoire)
| Legacy | V1 Proposé | Méthode | Description |
|--------|------------|---------|-------------|
| `/franchise/territory` | `/v1/franchises/{id}/territory` | GET | Détails territoire |

### Support
| Legacy | V1 Proposé | Méthode | Description |
|--------|------------|---------|-------------|
| `/franchise/support/tickets` | `/v1/franchises/{id}/tickets` | GET | Liste tickets |
| `/franchise/support/tickets/{id}` | `/v1/franchises/{id}/tickets/{ticketId}` | GET | Dét ticket |
| `/franchise/support/tickets/{id}/messages` | `/v1/franchises/{id}/tickets/{ticketId}/messages` | POST | Répondre ticket |

### Promos
| Legacy | V1 Proposé | Méthode | Description |
|--------|------------|---------|-------------|
| `/franchise/promos` | `/v1/franchises/{id}/promos` | GET/POST | Promotions |
| `/franchise/promos/{id}` | `/v1/franchises/{id}/promos/{promoId}` | GET | Détail promo |

### Commissions
| Legacy | V1 Proposé | Méthode | Description |
|--------|------------|---------|-------------|
| `/franchise/commissions` | `/v1/franchises/{id}/commissions` | GET | Liste commissions |

---

## �� Notes pour le Frontend

Corrections déjà appliquées côté frontend (2026-06-09):
- [x] **Trips:** Catch 404 et retourne liste vide au lieu d'erreur (filtre partenaire)
- [x] **Partners List:** Correction endpoint admin → `/v1/franchises/{id}/partners`
- [x] **Drivers List:** Correction endpoint admin → `/v1/franchise/drivers`
- [x] **Driver Detail:** Correction endpoint → `/v1/franchises/{id}/drivers/{driverId}`
- [x] **Live Map:** Ajout endpoint `/v1/franchises/{id}/livemap`
- [x] **Defense:** `timeline` toujours traité comme tableau
- [x] **Design Admin:** Sticky headers appliqués sur TOUTES les pages franchise (2026-06-10)
- [ ] Gestion d'erreur API à améliorer (distinguer "pas de résultats" vs "erreur serveur")

---

## 📊 État des données par page (audit 2026-06-10)

### ✅ Pages qui affichent TOUTES les données

| Page | Route | Endpoints utilisés | Statut données |
|------|-------|-------------------|----------------|
| **Dashboard** | `/franchise/dashboard` | `GET /v1/franchise/dashboard` + `GET /v1/franchises/{id}/partners` | ✅ Toutes données affichées |
| **Liste Partenaires** | `/franchise/partners` | `GET /v1/franchises/{id}/partners` | ✅ Toutes données affichées |
| **Liste Chauffeurs** | `/franchise/drivers` | `GET /v1/franchise/drivers` | ✅ Toutes données affichées |
| **Modération KYC** | `/franchise/drivers/moderation` | `GET /v1/admin/kyc/documents` + `GET /v1/franchise/drivers` | ✅ Fonctionnel via fallback admin |

---

### ⚠️ Pages avec données PARTIELLES (fallback actif, certains champs à 0 ou manquants)

| Page | Route | Ce qui s'affiche | Ce qui manque (backend) |
|------|-------|-----------------|------------------------|
| **Détail Partenaire** | `/franchise/partners/{id}` | Infos base, statut, nb chauffeurs | `address` (affiché "—"), `vehicles_count` (affiché 0) — le backend doit ajouter ces champs dans `GET /v1/franchises/{id}/partners/{id}` |
| **Détail Chauffeur** | `/franchise/drivers/{id}` | Nom, téléphone, zone, statut, docs KYC | `stats.trips_total`, `stats.wallet_balance_fcfa` (affichés 0), `timeline` vide — manque `GET /v1/franchises/{id}/drivers/{id}` avec stats complètes |
| **Liste Courses** | `/franchise/trips` | Réf, statut, montant, partenaire | Filtres ignorés par le backend (`search`, `status`, `partner_id`) |
| **Détail Course** | `/franchise/trips/{id}` | Réf, statut, trajet, montant, chauffeur, partenaire | `timeline` vide, `commission_fcfa` estimée à 15% au lieu d'être réelle |

---

### ✅ Pages débloquées après livraison backend du 2026-06-10

| Page | Route | Endpoint connecté | Frontend mis à jour |
|------|-------|------------------|---------------------|
| **Finance locale** | `/franchise/finance` | `GET /v1/franchise/finance` | ✅ `finance.service.ts` |
| **Recharges chauffeurs** | `/franchise/finance/driver-transfers` | `GET /v1/franchise/finance/driver-transfers` | ✅ `finance.service.ts` |
| **Recharges partenaires** | `/franchise/finance/partner-transfers` | `GET /v1/franchise/finance/partner-transfers` | ✅ `finance.service.ts` |
| **Commissions** | `/franchise/finance/commissions` | `GET /v1/franchise/finance/commissions` | ✅ `commissions.service.ts` |
| **Réconciliation** | `/franchise/finance/reconciliation` | `GET /v1/franchise/finance/reconciliation` | ✅ `reconciliation.service.ts` |
| **Carte live** | `/franchise/map` | `GET /v1/franchise/livemap` | ✅ `liveMap.service.ts` |
| **Console dispatch** | `/franchise/dispatch` | `GET /v1/franchise/dispatch/orders` | ✅ `dispatch.service.ts` |
| **Carte territoire** | `/franchise/territory` | `GET /v1/franchise/territory` | ✅ `territory.service.ts` |
| **Tarification** | `/franchise/pricing` | `GET /v1/franchises/{id}/pricing-rules` | ✅ `pricing.service.ts` (create/update aussi) |
| **Codes promo** | `/franchise/promos` | `GET /v1/franchise/promos` | ✅ `promos.service.ts` |
| **Bannières** | `/franchise/marketing/banners` | `GET /v1/franchise/marketing/banners` | ✅ `marketing.service.ts` (déjà OK) |
| **Campagnes** | `/franchise/marketing/campaigns` | `GET /v1/franchise/marketing/campaigns` | ✅ `marketing.service.ts` (déjà OK) |
| **Support Tickets** | `/franchise/support` | `GET /v1/franchise/support/tickets` | ✅ `support.service.ts` |
| **Clients** | `/franchise/clients` | `GET /v1/franchise/clients` | ✅ `clients.service.ts` |

### ⚠️ Pages encore partielles (données incomplètes)

| Page | Ce qui manque |
|------|--------------|
| **Détail Chauffeur** | `stats.*` à 0, `timeline` vide — endpoint `/v1/franchises/{id}/drivers/{id}` répond mais champs absents |
| **Détail Partenaire** | `address="—"`, `vehicles_count=0` — idem |
| **Détail Course** | `timeline` vide, `commission_xof` estimée |
| **Support Chat** | Pas de route `/v1/franchise/support/chat` — conversations vides (liste retourne [] côté frontend) |
| **Extension territoire** | Formulaire présent, `POST /v1/franchise/territory` à valider |

---

## 🎯 Endpoints restants à valider / implémenter

```
# Support chat (pas encore dans Swagger /v1/franchise/*)
GET  /v1/franchise/support/chat
GET  /v1/franchise/support/chat/{id}
POST /v1/franchise/support/chat/{id}/messages

# Enrichissement données détail
GET /v1/franchises/{id}/drivers/{driverId}   → retourner stats.trips_total, stats.wallet_balance_fcfa, timeline
GET /v1/franchises/{id}/partners/{partnerId} → retourner address, vehicles_count
GET /v1/franchises/{id}/orders/{orderId}     → retourner timeline[], commission_xof

# Territory extension
POST /v1/franchise/territory/extension-request
```

---

**TOUR COMPLET - Statistiques:**
- **Total pages:** 21
- **100% fonctionnelles:** 18 (après connecteurs frontend du 2026-06-10)
- **Partielles (données incomplètes):** 4 (Détail Chauffeur, Détail Partenaire, Détail Course, Chat Support)
- **Non fonctionnelles:** 0
- **Taux de succès:** ~86% (données partielles incluses) → 100% après enrichissement détails

**Date de création:** 2026-06-09
**Date de mise à jour:** 2026-06-10 (backend livré + connecteurs frontend mis à jour — 14 services corrigés)
**Module:** Franchise Portal
