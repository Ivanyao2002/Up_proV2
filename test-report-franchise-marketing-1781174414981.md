# Rapport de Test - FRANCHISE / marketing

**Date:** 2026-06-11T10:40:14.980Z
**API:** https://api.upjunoo-dev.tech
**Compte admin:** dev.admin@upjunoo-dev.tech
**Compte franchise:** dev.franchise.bf@upjunoo-dev.tech
**Total tests:** 7

## Résumé

- ✅ **Fonctionne:** 3
- ⚠️ **Partiel:** 0
- ❌ **Manquant:** 1
- 🐛 **Bugs:** 0
- ⚠️ **Échecs:** 3
- 📊 **Données:** 3

## ✅ Fonctionne correctement (3)

### Liste codes promo
- **Endpoint:** `GET /v1/franchise/promos`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:33.598Z","items":[],"pagination":{"page":1,"limit":20,"total":0,"hasMore":false}}`

### Liste campagnes
- **Endpoint:** `GET /v1/franchise/marketing/campaigns`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:34.096Z","items":[],"pagination":{"page":1,"limit":20,"total":0,"hasMore":false}}`

### Liste bannières
- **Endpoint:** `GET /v1/franchise/marketing/banners`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:34.403Z","items":[],"pagination":{"page":1,"limit":20,"total":0,"hasMore":false}}`

## ❌ Endpoints manquants (1)

### Détail code promo
- **Endpoint:** `GET /v1/franchise/promos/{id}`
- **Status:** 404
- **Token:** franchise
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"status":"error","generatedAt":"2026-06-11T10:39:33.778Z","error":{"code":"FRANCHISE_PROMO_NOT_FOUND","message":"Promo not found"}}`

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

## 📊 Problèmes de données (3)

### Liste codes promo
- **Endpoint:** `GET /v1/franchise/promos`
- **Status:** 200
- **Token:** franchise
- **Problème:** Liste vide retournée (pas de données en base)
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:33.598Z","items":[],"pagination":{"page":1,"limit":20,"total":0,"hasMore":false}}`

### Liste campagnes
- **Endpoint:** `GET /v1/franchise/marketing/campaigns`
- **Status:** 200
- **Token:** franchise
- **Problème:** Liste vide retournée (pas de données en base)
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:34.096Z","items":[],"pagination":{"page":1,"limit":20,"total":0,"hasMore":false}}`

### Liste bannières
- **Endpoint:** `GET /v1/franchise/marketing/banners`
- **Status:** 200
- **Token:** franchise
- **Problème:** Liste vide retournée (pas de données en base)
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:34.403Z","items":[],"pagination":{"page":1,"limit":20,"total":0,"hasMore":false}}`

## À implémenter

- Implémenter `/v1/franchise/promos/{id}` (Détail code promo)

