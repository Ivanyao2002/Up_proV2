# Rapport de Test - FRANCHISE / territoire

**Date:** 2026-06-11T10:40:00.239Z
**API:** https://api.upjunoo-dev.tech
**Compte admin:** dev.admin@upjunoo-dev.tech
**Compte franchise:** dev.franchise.bf@upjunoo-dev.tech
**Total tests:** 10

## Résumé

- ✅ **Fonctionne:** 9
- ⚠️ **Partiel:** 0
- ❌ **Manquant:** 0
- 🐛 **Bugs:** 1
- ⚠️ **Échecs:** 1
- 📊 **Données:** 0

## ✅ Fonctionne correctement (9)

### Dashboard franchise
- **Endpoint:** `GET /v1/franchise/dashboard`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:15.236Z","dashboard":{"franchiseId":"82781966-5ca5-4a67-9147-1a6dd245e31d","partners":9,"drivers":36,"v`

### Info franchise courante
- **Endpoint:** `GET /v1/franchises/me`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:15.456Z","franchise":{"id":"82781966-5ca5-4a67-9147-1a6dd245e31d","country_id":"f558f905-55ee-4a23-8882`

### Détail franchise
- **Endpoint:** `GET /v1/franchises/{id}`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:15.647Z","franchise":{"id":"82781966-5ca5-4a67-9147-1a6dd245e31d","country_id":"f558f905-55ee-4a23-8882`

### Carte live
- **Endpoint:** `GET /v1/franchise/livemap`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:15.889Z","drivers":[{"id":"1c0fa2c0-3291-449c-a47f-36c7431653f7","userId":"2e283308-8775-4206-815e-6d5e`

### Liste courses franchise
- **Endpoint:** `GET /v1/franchises/{id}/orders?page=1&limit=10`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:16.838Z","orders":[{"id":"ea3d1e15-8785-4172-82a7-751bad78c927","order_reference":"TR-EA3D1E15","client`

### Détail course franchise
- **Endpoint:** `GET /v1/franchises/{id}/orders/{orderId}`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:17.697Z","order":{"serviceType":"RIDE","orderId":"ea3d1e15-8785-4172-82a7-751bad78c927","ride":{"id":"e`

### Carte territoire
- **Endpoint:** `GET /v1/franchises/{id}/territory`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:18.055Z","franchise":{"id":"82781966-5ca5-4a67-9147-1a6dd245e31d","country_id":"f558f905-55ee-4a23-8882`

### Tarification franchise
- **Endpoint:** `GET /v1/franchise/pricing`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:18.367Z","pricing":{"schemaVersion":3,"countryCode":"CI","enabled":true,"competitorUndercutPct":20,"rou`

### Console dispatch
- **Endpoint:** `GET /v1/franchise/dispatch/orders`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:18.828Z","drivers":[{"id":"1c0fa2c0-3291-449c-a47f-36c7431653f7","user_id":"2e283308-8775-4206-815e-6d5`

## 🐛 Bugs détectés (1)

### Demande extension territoire
- **Endpoint:** `POST /v1/franchise/territory/extension-request`
- **Status:** 500
- **Token:** franchise
- **Problème:** Erreur serveur (500) - BUG
- **Réponse:** `{"status":"error","generatedAt":"2026-06-11T10:39:19.660Z","error":{"code":"TERRITORY_EXTENSION_REQUEST_FAILED","message":"Could not find the table 'p`

## ⚠️ Échecs (1)

### Créer tarification
- **Endpoint:** `POST /v1/franchise/pricing`
- **Status:** 400
- **Token:** franchise
- **Problème:** Erreur 400: Body cannot be empty when content-type is set to 'application/json'
- **Réponse:** `{"error":{"code":"FST_ERR_CTP_EMPTY_JSON_BODY","message":"Body cannot be empty when content-type is set to 'application/json'"}}`

## Priorité: Bugs à corriger

- Corriger 500 sur `/v1/franchise/territory/extension-request` (Demande extension territoire)

