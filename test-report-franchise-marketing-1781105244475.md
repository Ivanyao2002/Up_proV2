# Rapport de Test - FRANCHISE / marketing

**Date:** 2026-06-10T15:27:24.474Z
**API:** https://api.upjunoo-dev.tech
**Compte admin:** dev.admin@upjunoo-dev.tech
**Compte franchise:** dev.franchise.bf@upjunoo-dev.tech
**Total tests:** 4

## Résumé

- ✅ **Fonctionne:** 0
- ⚠️ **Partiel:** 0
- ❌ **Manquant:** 1
- 🐛 **Bugs:** 3
- ⚠️ **Échecs:** 3
- 📊 **Données:** 0

## ❌ Endpoints manquants (1)

### Détail code promo
- **Endpoint:** `GET /v1/franchise/promos/{id}`
- **Status:** 404
- **Token:** franchise
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"message":"Route GET:/v1/franchise/promos/82781966-5ca5-4a67-9147-1a6dd245e31d not found","error":"Not Found","statusCode":404}`

## 🐛 Bugs détectés (3)

### Liste codes promo
- **Endpoint:** `GET /v1/franchise/promos`
- **Status:** 500
- **Token:** franchise
- **Problème:** Erreur serveur (500) - BUG
- **Réponse:** `{"status":"error","generatedAt":"2026-06-10T15:26:43.505Z","error":{"code":"PROMOTIONS_FETCH_FAILED","message":"column promotions.franchise_id does no`

### Liste campagnes
- **Endpoint:** `GET /v1/franchise/marketing/campaigns`
- **Status:** 500
- **Token:** franchise
- **Problème:** Erreur serveur (500) - BUG
- **Réponse:** `{"status":"error","generatedAt":"2026-06-10T15:26:43.917Z","error":{"code":"CAMPAIGNS_FETCH_FAILED","message":"column campaigns.franchise_id does not `

### Liste bannières
- **Endpoint:** `GET /v1/franchise/marketing/banners`
- **Status:** 500
- **Token:** franchise
- **Problème:** Erreur serveur (500) - BUG
- **Réponse:** `{"status":"error","generatedAt":"2026-06-10T15:26:44.234Z","error":{"code":"APP_BANNERS_FETCH_FAILED","message":"column app_banners.franchise_id does `

## ⚠️ Échecs (3)

### Créer code promo
- **Endpoint:** `POST /v1/franchise/promos`
- **Status:** 400
- **Token:** franchise
- **Problème:** Erreur 400: Body cannot be empty when content-type is set to 'application/json'
- **Réponse:** `{"error":{"code":"FST_ERR_CTP_EMPTY_JSON_BODY","message":"Body cannot be empty when content-type is set to 'application/json'"}}`

### Créer campagne
- **Endpoint:** `POST /v1/franchise/marketing/campaigns`
- **Status:** 400
- **Token:** franchise
- **Problème:** Erreur 400: Body cannot be empty when content-type is set to 'application/json'
- **Réponse:** `{"error":{"code":"FST_ERR_CTP_EMPTY_JSON_BODY","message":"Body cannot be empty when content-type is set to 'application/json'"}}`

### Créer bannière
- **Endpoint:** `POST /v1/franchise/marketing/banners`
- **Status:** 400
- **Token:** franchise
- **Problème:** Erreur 400: Body cannot be empty when content-type is set to 'application/json'
- **Réponse:** `{"error":{"code":"FST_ERR_CTP_EMPTY_JSON_BODY","message":"Body cannot be empty when content-type is set to 'application/json'"}}`

## Priorité: Bugs à corriger

- Corriger 500 sur `/v1/franchise/promos` (Liste codes promo)
- Corriger 500 sur `/v1/franchise/marketing/campaigns` (Liste campagnes)
- Corriger 500 sur `/v1/franchise/marketing/banners` (Liste bannières)

## À implémenter

- Implémenter `/v1/franchise/promos/{id}` (Détail code promo)

