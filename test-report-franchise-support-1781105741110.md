# Rapport de Test - FRANCHISE / support

**Date:** 2026-06-10T15:35:41.110Z
**API:** https://api.upjunoo-dev.tech
**Compte admin:** dev.admin@upjunoo-dev.tech
**Compte franchise:** dev.franchise.bf@upjunoo-dev.tech
**Total tests:** 5

## Résumé

- ✅ **Fonctionne:** 0
- ⚠️ **Partiel:** 0
- ❌ **Manquant:** 3
- 🐛 **Bugs:** 1
- ⚠️ **Échecs:** 2
- 📊 **Données:** 0

## ❌ Endpoints manquants (3)

### Détail ticket support
- **Endpoint:** `GET /v1/franchise/support/tickets/{id}`
- **Status:** 404
- **Token:** franchise
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"message":"Route GET:/v1/franchise/support/tickets/82781966-5ca5-4a67-9147-1a6dd245e31d not found","error":"Not Found","statusCode":404}`

### Liste chats support
- **Endpoint:** `GET /v1/franchise/support/chat`
- **Status:** 404
- **Token:** franchise
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"message":"Route GET:/v1/franchise/support/chat not found","error":"Not Found","statusCode":404}`

### Détail chat
- **Endpoint:** `GET /v1/franchise/support/chat/{id}`
- **Status:** 404
- **Token:** franchise
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"message":"Route GET:/v1/franchise/support/chat/82781966-5ca5-4a67-9147-1a6dd245e31d not found","error":"Not Found","statusCode":404}`

## 🐛 Bugs détectés (1)

### Liste tickets support
- **Endpoint:** `GET /v1/franchise/support/tickets`
- **Status:** 500
- **Token:** franchise
- **Problème:** Erreur serveur (500) - BUG
- **Réponse:** `{"status":"error","generatedAt":"2026-06-10T15:35:00.364Z","error":{"code":"FRANCHISE_SUPPORT_TICKETS_FETCH_FAILED","message":"<html>\r\n<head><title>`

## ⚠️ Échecs (2)

### Répondre ticket
- **Endpoint:** `POST /v1/franchise/support/tickets/{id}/messages`
- **Status:** 400
- **Token:** franchise
- **Problème:** Erreur 400: Body cannot be empty when content-type is set to 'application/json'
- **Réponse:** `{"error":{"code":"FST_ERR_CTP_EMPTY_JSON_BODY","message":"Body cannot be empty when content-type is set to 'application/json'"}}`

### Répondre chat
- **Endpoint:** `POST /v1/franchise/support/chat/{id}/messages`
- **Status:** 400
- **Token:** franchise
- **Problème:** Erreur 400: Body cannot be empty when content-type is set to 'application/json'
- **Réponse:** `{"error":{"code":"FST_ERR_CTP_EMPTY_JSON_BODY","message":"Body cannot be empty when content-type is set to 'application/json'"}}`

## Priorité: Bugs à corriger

- Corriger 500 sur `/v1/franchise/support/tickets` (Liste tickets support)

## À implémenter

- Implémenter `/v1/franchise/support/tickets/{id}` (Détail ticket support)
- Implémenter `/v1/franchise/support/chat` (Liste chats support)
- Implémenter `/v1/franchise/support/chat/{id}` (Détail chat)

