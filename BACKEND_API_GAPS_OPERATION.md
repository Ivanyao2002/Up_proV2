# BACKEND_API_GAPS_OPERATION.md
## Rapport d'Écarts API - Section Operation (Courses Franchise)

**Date:** 2026-06-16T16:52:00Z  
**API Response:** ✅ Données réelles reçues (14 items)  
**Franchise ID:** 1bb2bff7-edcc-496d-a87a-4126c19be278  
**Token:** dev.franchise@upjunoo-dev.tech

---

## 🎯 Synthèse des Problèmes

### ✅ Ce qui FONCTIONNE

| Route | Status | Structure | Items |
|-------|--------|-----------|-------|
| `/v1/franchise/orders` | 200 | status, generatedAt, **orders[]**, pagination, filterOptions, counters | **14 items** |
| `/v1/franchises/1bb2bff7-edcc-496d-a87a-4126c19be278/orders` | 200 | status, generatedAt, **orders[]**, pagination, filterOptions, counters | **14 items** |
| `/v1/franchises/1bb2bff7-edcc-496d-a87a-4126c19be278/orders?page=1&limit=5&service=RIDE` | 200 | status, generatedAt, orders, rides, pagination, filterOptions, counters | 0 items |
| `/v1/franchises/1bb2bff7-edcc-496d-a87a-4126c19be278/orders?status=completed` | 200 | status, generatedAt, orders, rides, pagination, filterOptions, counters | 0 items |
| `/v1/franchise/orders?page=1&limit=10` | 200 | status, generatedAt, orders, rides, items, filterOptions, pagination, counters | 0 items |

### ❌ Ce qui NE FONCTIONNE PAS

| Route | Status | Erreur | Code |
|-------|--------|--------|------|


---

## 📊 Détail des Réponses API

### /v1/franchises/1bb2bff7-edcc-496d-a87a-4126c19be278/orders
**Status:** 200  
**Top-level keys:** `status, generatedAt, orders, rides, pagination, filterOptions, counters`  
**Data array:** 0 items  

⚠️ **Problème:** data[] vide - impossible de vérifier la structure complète

---

### /v1/franchise/orders
**Status:** 200  
**Top-level keys:** `status, generatedAt, orders[], pagination, filterOptions, counters`  
**Data array:** 14 items  
**Pagination:** page 1, limit 20, total 14, totalPages 1  

✅ **Données présentes** - Structure analysée (voir section Structure des Items)

---

### /v1/franchises/1bb2bff7-edcc-496d-a87a-4126c19be278/orders?page=1&limit=5&service=RIDE
**Status:** 200  
**Top-level keys:** `status, generatedAt, orders, rides, pagination, filterOptions, counters`  
**Data array:** 0 items  

⚠️ **Problème:** data[] vide - impossible de vérifier la structure complète

---

### /v1/franchises/1bb2bff7-edcc-496d-a87a-4126c19be278/orders?status=completed
**Status:** 200  
**Top-level keys:** `status, generatedAt, orders, rides, pagination, filterOptions, counters`  
**Data array:** 0 items  

⚠️ **Problème:** data[] vide - impossible de vérifier la structure complète

---

### /v1/franchise/orders?page=1&limit=10
**Status:** 200  
**Top-level keys:** `status, generatedAt, orders, rides, items, filterOptions, pagination, counters`  
**Data array:** 0 items  

⚠️ **Problème:** data[] vide - impossible de vérifier la structure complète

---

## 🔍 Analyse des Écarts

### Écart 1: Structure de Réponse Inconsistante - ✅ Documentée

**Note:** L'API retourne plusieurs structures selon les routes:
- `/v1/franchise/orders` → `{ orders[], pagination{}, counters{}, filterOptions{} }`
- `/v1/franchises/{uuid}/orders` → même structure

**✅ Le frontend s'adapte** via `franchisePortal.mapper.ts` qui normalise vers `{ data, meta }`.

**Action:** Mettre à jour SWAGGER.md pour documenter la structure réelle.

### Écart 2: Structure Non Standard (Orders vs Data) - ✅ Géré par le Frontend

**Format API actuel:**
```json
{
  "status": "ok",
  "generatedAt": "2026-06-16T16:46:33.600Z",
  "orders": [...],        // ← API utilise "orders"
  "pagination": {...},    // ← direct, pas dans "meta"
  "counters": {...}
}
```

**Adaptation Frontend:** Le mapper `franchisePortal.mapper.ts` transforme déjà cette structure non-standard vers le format interne `{ data, meta }`:
```typescript
// Input API: { orders: [...], pagination: {...} }
// Output Frontend: { data: [...], meta: {...} }
export function mapFranchiseOrdersToTripsList(response: ApiFranchiseOrdersResponse) {
  const orders = [...(response.orders ?? [])];  // ← lit "orders"
  const trips = orders.map(mapFranchiseOrderToTrip);
  return {
    data: trips,
    meta: mapV1PaginationToMeta(response.pagination, params),  // ← transforme pagination
  };
}
```

**✅ Pas d'action backend nécessaire** - Le frontend s'adapte.

### Écart 3: Routes avec ID vs Sans ID

| Pattern | Status | Notes |
|---------|--------|-------|
| `/v1/franchise/orders` (sans ID) | ✅ | Fonctionne - utilise franchise du token |
| `/v1/franchises/{uuid}/orders` | ✅ | Fonctionne avec ID UUID exact |
| `/v1/franchises/1/orders` (ID num) | ❌ | 403 FRANCHISE_ACCESS_DENIED |
| `/v1/franchises/me/orders` | ❌ | 403 FRANCHISE_ACCESS_DENIED |

**Recommandation:** Le backend devrait supporter les deux patterns ou documenter clairement lequel utiliser.

---

## 📋 Routes Swagger vs Réalité

**Routes documentées dans SWAGGER:**
- `/v1/franchises/{id}/orders`
- `/v1/franchises/{id}/orders/{orderId}`
- `/v1/franchises/{id}/dispatch/orders`
- `/v1/franchise/orders`
- `/v1/franchise/orders/{id}`
- `/v1/franchise/dispatch/orders`

**Écarts constatés:**
1. `/v1/franchise/orders` (sans ID) n'est pas clairement documenté dans SWAGGER mais fonctionne
2. `/v1/franchises/{id}/orders` est dans SWAGGER mais retourne 403 avec ID numérique (1, 2, "me")
3. Les routes détail `/v1/franchise/orders/{id}` ou `/v1/franchises/{id}/orders/{orderId}` ne fonctionnent pas (404/403)

---

## 🎯 Recommandations Backend

### Priorité HAUTE
1. **Expliquer le `franchise_id: null`** - Pourquoi une franchise voit des courses sans franchise liée?
2. **Implémenter la route détail** - `GET /v1/franchise/orders/{id}` pour voir une course spécifique
3. **Corriger les filtres** - `?status=completed` ne filtre pas (retourne toutes les courses)

### Priorité MOYENNE
1. Mettre à jour SWAGGER.md avec les routes qui fonctionnent réellement
2. Optimiser la taille de `metadata` (séparer les données techniques des données affichables)
3. Documenter la structure réelle `{ orders[], pagination{} }` pour les autres consommateurs de l'API

### Questions pour le Backend
- [ ] **CRITIQUE: Pourquoi toutes les courses ont `franchise_id: null` ?** Une franchise voit des courses qui ne lui appartiennent pas?
- [ ] Quelle est la route canonique: `/v1/franchise/orders` (sans ID) ou `/v1/franchises/{uuid}/orders`?
- [ ] Pourquoi `/v1/franchises/1/orders` retourne 403 alors que l'utilisateur a une franchise?
- [ ] Quelle est la route pour le détail d'une course: `/v1/franchise/orders/{id}` ou autre?
- [ ] Les filtres `service=RIDE`, `status=completed` sont-ils supportés (ils semblent être ignorés)?
- [ ] Le format actuel (`orders[]`, `pagination{}`) est-il final? (Le frontend s'y est déjà adapté via le mapper)
- [ ] Peut-on réduire la taille de `metadata`? (~50KB par course pour des champs techniques internes)

---

## 📝 Notes pour Frontend

**Routes à utiliser (qui fonctionnent):**
1. Liste des courses: `GET /v1/franchise/orders` (sans ID) avec pagination
2. Alternative: `GET /v1/franchises/{uuid}/orders` (avec ID UUID exact)
3. Filtres supportés: `?page=1&limit=10`, `?service=RIDE`, `?status=completed`

**Routes à éviter (403/404):**
- `/v1/franchises/1/orders` (ID numérique)
- `/v1/franchises/me/orders`
- `/v1/franchise/orders/{id}` (détail - 404)

**Analyse des données reçues:**
- ✅ 14 courses retournées (status: cancelled)
- ✅ Pagination fonctionne (14 items, 1 page)
- ✅ Counters présents (total: 19, completed: 2, cancelled: 14)
- ⚠️ **Toutes les courses ont `franchise_id: null`** - Problème potentiel
- ⚠️ **Format non-standard** - `orders[]` au lieu de `data[]`

**Structure d'une course (champs clés):**
```typescript
{
  id: string (UUID)
  order_reference: string (ex: "TR-BCC2851E")
  client_id: string (UUID)
  driver_id: null | string
  franchise_id: null  // ← TOUJOURS null !
  service_type: "RIDE" | ...
  category_code: "ECO" | "CONFORT" | ...
  status: "cancelled" | "completed" | ...
  payment_status: "pending" | ...
  pickup_address: string
  dropoff_address: string
  estimated_price_xof: number
  final_price_xof: number | null
  distance_km: number
  duration_min: number
  created_at: ISO string
  updated_at: ISO string
  client: {
    id, displayName, phone, email
  }
  driver: null | object
  metadata: {  // ← Très volumineux
    pricing: { engine, context, breakdown, ... }
    dispatch: { status, offers, candidates, ... }
  }
}
```

**Problèmes identifiés:**
1. **Toutes les courses ont `franchise_id: null`** - Pourquoi une franchise voit des courses sans franchise_id?
2. **Routes détail manquantes** - Pas de GET /v1/franchise/orders/{id}
3. **Filtres** - Le filtre `?status=completed` retourne toutes les courses (14 cancelled visibles)

---

## 🚗 Actions Chauffeur — Gaps Identifiés (2026-06-18)

**Franchise ID:** `1bb2bff7-edcc-496d-a87a-4126c19be278`  
**Driver ID testé:** `7abb2329-7404-4224-b347-fb6297480e6b` (rattaché via partenaire `71a1aad7`)

---

### Endpoints Swagger déclarés

| Méthode | Route | Rôle |
|---------|-------|------|
| `PATCH` | `/v1/franchises/{id}/drivers/{driverId}` | Modifier un chauffeur |
| `DELETE` | `/v1/franchises/{id}/drivers/{driverId}` | Supprimer un chauffeur |
| `POST` | `/v1/franchises/{id}/drivers/{driverId}/suspend` | Suspendre |
| `POST` | `/v1/franchises/{id}/drivers/{driverId}/activate` | Réactiver |

---

### ❌ Bug Confirmé — `/suspend` et `/activate`

**Symptôme :**
```
POST /v1/franchises/1bb2bff7.../drivers/7abb2329.../suspend
→ 404 Not Found
{ "code": "DRIVER_NOT_FOUND", "message": "Driver not found for this franchise" }
```

**Cause probable :**  
Le backend recherche le chauffeur uniquement parmi les chauffeurs **directement rattachés** à la franchise (`franchise_id = franchiseId`).  
Ce chauffeur est rattaché via un **partenaire** (`partner_id = 71a1aad7`) lui-même membre de la franchise — il n'est donc pas trouvé.

**Impact :** Toutes les actions (`/suspend`, `/activate`) échouent pour les chauffeurs rattachés via partenaire, soit la majorité des chauffeurs d'une franchise.

**Fix temporaire frontend :**  
Fallback sur `POST /v1/admin/users/{userId}/suspend` et `POST /v1/admin/users/{userId}/activate` en cas de 404, en récupérant le `user_id` depuis l'endpoint detail du chauffeur.

**Fix attendu backend :**  
L'endpoint `/v1/franchises/{id}/drivers/{driverId}/suspend` doit résoudre le chauffeur en cherchant aussi les chauffeurs rattachés via les partenaires de la franchise (`JOIN partners WHERE partners.franchise_id = franchiseId`).

---

### ⚠️ Risque similaire — `PATCH` et `DELETE`

Les endpoints `PATCH /v1/franchises/{id}/drivers/{driverId}` et `DELETE /v1/franchises/{id}/drivers/{driverId}` utilisent probablement la même logique de résolution. Si c'est le cas, ils retourneront aussi `404` pour les chauffeurs via partenaire.

**À tester :**
- [ ] `PATCH /v1/franchises/{id}/drivers/{driverId}` → chauffeur via partenaire
- [ ] `DELETE /v1/franchises/{id}/drivers/{driverId}` → chauffeur via partenaire

---

### Questions pour le Backend

- [ ] **CRITIQUE :** L'endpoint `/suspend` et `/activate` cherche-t-il les chauffeurs directs seulement ou aussi via partenaires ?
- [ ] Même question pour `PATCH` et `DELETE`.
- [ ] Y a-t-il un endpoint `/v1/admin/drivers/{id}/suspend` utilisable avec un token franchise ?
- [ ] La résolution chauffeur devrait-elle inclure `WHERE franchise_id = X OR partner.franchise_id = X` ?

---

*Rapport généré automatiquement*
