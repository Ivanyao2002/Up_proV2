# Rapport de Test - FRANCHISE / territoire

**Date:** 2026-06-10T15:40:45.931Z
**API:** https://api.upjunoo-dev.tech
**Compte admin:** dev.admin@upjunoo-dev.tech
**Compte franchise:** dev.franchise.bf@upjunoo-dev.tech
**Total tests:** 10

## Résumé

- ✅ **Fonctionne:** 9
- ⚠️ **Partiel:** 0
- ❌ **Manquant:** 0
- 🐛 **Bugs:** 0
- ⚠️ **Échecs:** 1
- 📊 **Données:** 0

## ✅ Fonctionne correctement (9)

### Dashboard franchise
- **Endpoint:** `GET /v1/franchise/dashboard`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:40:01.276Z","dashboard":{"franchiseId":"82781966-5ca5-4a67-9147-1a6dd245e31d","partners":9,"drivers":36,"v`

### Info franchise courante
- **Endpoint:** `GET /v1/franchises/me`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:40:01.986Z","franchise":{"id":"82781966-5ca5-4a67-9147-1a6dd245e31d","country_id":"f558f905-55ee-4a23-8882`

### Détail franchise
- **Endpoint:** `GET /v1/franchises/{id}`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:40:02.512Z","franchise":{"id":"82781966-5ca5-4a67-9147-1a6dd245e31d","country_id":"f558f905-55ee-4a23-8882`

### Carte live
- **Endpoint:** `GET /v1/franchise/livemap`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:40:03.091Z","drivers":[{"id":"1c0fa2c0-3291-449c-a47f-36c7431653f7","userId":"2e283308-8775-4206-815e-6d5e`

### Liste courses franchise
- **Endpoint:** `GET /v1/franchises/{id}/orders?page=1&limit=10`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:40:03.964Z","orders":[{"id":"0a84d8d6-8ac7-49f8-afa4-57d9c4e94a4d","order_reference":"TR-0A84D8D6","client`

### Détail course franchise
- **Endpoint:** `GET /v1/franchises/{id}/orders/{orderId}`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:40:04.671Z","order":{"serviceType":"RIDE","orderId":"0a84d8d6-8ac7-49f8-afa4-57d9c4e94a4d","ride":{"id":"0`

### Carte territoire
- **Endpoint:** `GET /v1/franchises/{id}/territory`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:40:04.992Z","franchise":{"id":"82781966-5ca5-4a67-9147-1a6dd245e31d","country_id":"f558f905-55ee-4a23-8882`

### Tarification franchise
- **Endpoint:** `GET /v1/franchise/pricing`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:40:05.210Z","pricing":{"schemaVersion":3,"countryCode":"CI","enabled":true,"competitorUndercutPct":20,"rou`

### Console dispatch
- **Endpoint:** `GET /v1/franchise/dispatch/orders`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:40:05.523Z","drivers":[{"id":"1c0fa2c0-3291-449c-a47f-36c7431653f7","user_id":"2e283308-8775-4206-815e-6d5`

## ⚠️ Échecs (1)

### Créer tarification
- **Endpoint:** `POST /v1/franchise/pricing`
- **Status:** 400
- **Token:** franchise
- **Problème:** Erreur 400: Body cannot be empty when content-type is set to 'application/json'
- **Réponse:** `{"error":{"code":"FST_ERR_CTP_EMPTY_JSON_BODY","message":"Body cannot be empty when content-type is set to 'application/json'"}}`

