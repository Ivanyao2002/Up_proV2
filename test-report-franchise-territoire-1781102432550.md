# Rapport de Test - FRANCHISE / territoire

**Date:** 2026-06-10T14:40:32.549Z
**API:** https://api.upjunoo-dev.tech
**Total tests:** 12

## Résumé

- ✅ **Fonctionne:** 4
- ⚠️ **Partiel:** 1
- ❌ **Manquant:** 6
- 🐛 **Bugs:** 0
- ⚠️ **Échecs:** 1
- 📊 **Données:** 0

## ✅ Fonctionne correctement (4)

### Info franchise courante
- **Endpoint:** `GET /v1/franchises/me`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:39:49.884Z","franchise":null}`

### Détail franchise
- **Endpoint:** `GET /v1/franchises/{id}`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:39:50.110Z","franchise":{"id":"82781966-5ca5-4a67-9147-1a6dd245e31d","country_id":"f558f905-55ee-4a23-8882`

### Liste courses franchise
- **Endpoint:** `GET /v1/franchises/{id}/orders?page=1&limit=10`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:39:50.625Z","orders":[{"id":"e2e5adb8-a7f6-4fe4-acf8-3719ed7a0fac","order_reference":"TR-E2E5ADB8","client`

### Carte territoire
- **Endpoint:** `GET /v1/franchises/{id}/territory`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:39:51.506Z","franchise":{"id":"82781966-5ca5-4a67-9147-1a6dd245e31d","country_id":"f558f905-55ee-4a23-8882`

## ⚠️ Fonctionnel mais incomplet (1)

### Liste tarifications
- **Endpoint:** `GET /v1/franchise/pricing`
- **Status:** 403
- **Problème:** Accès interdit (403) - problème de permissions
- **Réponse:** `{"status":"error","generatedAt":"2026-06-10T14:39:51.807Z","error":{"code":"FRANCHISE_ACCESS_REQUIRED","message":"Franchise account required"}}`

## ❌ Endpoints manquants (6)

### Dashboard franchise
- **Endpoint:** `GET /v1/franchise/dashboard`
- **Status:** 404
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"status":"error","generatedAt":"2026-06-10T14:39:49.668Z","error":{"code":"FRANCHISE_NOT_FOUND","message":"Franchise membership not found"}}`

### Carte live
- **Endpoint:** `GET /v1/franchise/live-map`
- **Status:** 404
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"message":"Route GET:/v1/franchise/live-map not found","error":"Not Found","statusCode":404}`

### Détail course franchise
- **Endpoint:** `GET /v1/franchises/{id}/orders/{orderId}`
- **Status:** 404
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"status":"error","generatedAt":"2026-06-10T14:39:51.279Z","error":{"code":"ORDER_NOT_FOUND","message":"Order not found for this franchise"}}`

### Extension territoire
- **Endpoint:** `GET /v1/franchises/{id}/territory/extension`
- **Status:** 404
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"message":"Route GET:/v1/franchises/82781966-5ca5-4a67-9147-1a6dd245e31d/territory/extension not found","error":"Not Found","statusCode":404}`

### Détail tarification
- **Endpoint:** `GET /v1/franchise/pricing/{id}`
- **Status:** 404
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"message":"Route GET:/v1/franchise/pricing/82781966-5ca5-4a67-9147-1a6dd245e31d not found","error":"Not Found","statusCode":404}`

### Console dispatch
- **Endpoint:** `GET /v1/franchise/dispatch`
- **Status:** 404
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"message":"Route GET:/v1/franchise/dispatch not found","error":"Not Found","statusCode":404}`

## ⚠️ Échecs (1)

### Créer tarification
- **Endpoint:** `POST /v1/franchise/pricing`
- **Status:** 400
- **Problème:** Erreur 400: Body cannot be empty when content-type is set to 'application/json'
- **Réponse:** `{"error":{"code":"FST_ERR_CTP_EMPTY_JSON_BODY","message":"Body cannot be empty when content-type is set to 'application/json'"}}`

## À implémenter

- Implémenter `/v1/franchise/dashboard` (Dashboard franchise)
- Implémenter `/v1/franchise/live-map` (Carte live)
- Implémenter `/v1/franchises/{id}/orders/{orderId}` (Détail course franchise)
- Implémenter `/v1/franchises/{id}/territory/extension` (Extension territoire)
- Implémenter `/v1/franchise/pricing/{id}` (Détail tarification)
- Implémenter `/v1/franchise/dispatch` (Console dispatch)

