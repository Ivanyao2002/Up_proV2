# Rapport de Test - FRANCHISE / territoire

**Date:** 2026-06-10T15:39:32.737Z
**API:** https://api.upjunoo-dev.tech
**Compte admin:** dev.admin@upjunoo-dev.tech
**Compte franchise:** dev.franchise.bf@upjunoo-dev.tech
**Total tests:** 12

## Résumé

- ✅ **Fonctionne:** 7
- ⚠️ **Partiel:** 0
- ❌ **Manquant:** 4
- 🐛 **Bugs:** 0
- ⚠️ **Échecs:** 1
- 📊 **Données:** 0

## ✅ Fonctionne correctement (7)

### Dashboard franchise
- **Endpoint:** `GET /v1/franchise/dashboard`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:38:50.543Z","dashboard":{"franchiseId":"82781966-5ca5-4a67-9147-1a6dd245e31d","partners":9,"drivers":36,"v`

### Info franchise courante
- **Endpoint:** `GET /v1/franchises/me`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:38:50.732Z","franchise":{"id":"82781966-5ca5-4a67-9147-1a6dd245e31d","country_id":"f558f905-55ee-4a23-8882`

### Détail franchise
- **Endpoint:** `GET /v1/franchises/{id}`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:38:50.909Z","franchise":{"id":"82781966-5ca5-4a67-9147-1a6dd245e31d","country_id":"f558f905-55ee-4a23-8882`

### Liste courses franchise
- **Endpoint:** `GET /v1/franchises/{id}/orders?page=1&limit=10`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:38:51.265Z","orders":[{"id":"0a84d8d6-8ac7-49f8-afa4-57d9c4e94a4d","order_reference":"TR-0A84D8D6","client`

### Détail course franchise
- **Endpoint:** `GET /v1/franchises/{id}/orders/{orderId}`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:38:51.735Z","order":{"serviceType":"RIDE","orderId":"0a84d8d6-8ac7-49f8-afa4-57d9c4e94a4d","ride":{"id":"0`

### Carte territoire
- **Endpoint:** `GET /v1/franchises/{id}/territory`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:38:52.025Z","franchise":{"id":"82781966-5ca5-4a67-9147-1a6dd245e31d","country_id":"f558f905-55ee-4a23-8882`

### Liste tarifications
- **Endpoint:** `GET /v1/franchise/pricing`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:38:52.335Z","pricing":{"schemaVersion":3,"countryCode":"CI","enabled":true,"competitorUndercutPct":20,"rou`

## ❌ Endpoints manquants (4)

### Carte live
- **Endpoint:** `GET /v1/franchise/live-map`
- **Status:** 404
- **Token:** franchise
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"message":"Route GET:/v1/franchise/live-map not found","error":"Not Found","statusCode":404}`

### Extension territoire
- **Endpoint:** `GET /v1/franchises/{id}/territory/extension`
- **Status:** 404
- **Token:** admin
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"message":"Route GET:/v1/franchises/82781966-5ca5-4a67-9147-1a6dd245e31d/territory/extension not found","error":"Not Found","statusCode":404}`

### Détail tarification
- **Endpoint:** `GET /v1/franchise/pricing/{id}`
- **Status:** 404
- **Token:** franchise
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"message":"Route GET:/v1/franchise/pricing/82781966-5ca5-4a67-9147-1a6dd245e31d not found","error":"Not Found","statusCode":404}`

### Console dispatch
- **Endpoint:** `GET /v1/franchise/dispatch`
- **Status:** 404
- **Token:** franchise
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"message":"Route GET:/v1/franchise/dispatch not found","error":"Not Found","statusCode":404}`

## ⚠️ Échecs (1)

### Créer tarification
- **Endpoint:** `POST /v1/franchise/pricing`
- **Status:** 400
- **Token:** franchise
- **Problème:** Erreur 400: Body cannot be empty when content-type is set to 'application/json'
- **Réponse:** `{"error":{"code":"FST_ERR_CTP_EMPTY_JSON_BODY","message":"Body cannot be empty when content-type is set to 'application/json'"}}`

## À implémenter

- Implémenter `/v1/franchise/live-map` (Carte live)
- Implémenter `/v1/franchises/{id}/territory/extension` (Extension territoire)
- Implémenter `/v1/franchise/pricing/{id}` (Détail tarification)
- Implémenter `/v1/franchise/dispatch` (Console dispatch)

