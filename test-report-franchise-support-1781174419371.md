# Rapport de Test - FRANCHISE / support

**Date:** 2026-06-11T10:40:19.367Z
**API:** https://api.upjunoo-dev.tech
**Compte admin:** dev.admin@upjunoo-dev.tech
**Compte franchise:** dev.franchise.bf@upjunoo-dev.tech
**Total tests:** 6

## Résumé

- ✅ **Fonctionne:** 2
- ⚠️ **Partiel:** 0
- ❌ **Manquant:** 2
- 🐛 **Bugs:** 0
- ⚠️ **Échecs:** 2
- 📊 **Données:** 2

## ✅ Fonctionne correctement (2)

### Liste tickets support
- **Endpoint:** `GET /v1/franchise/support/tickets`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:38.024Z","items":[],"tickets":[],"pagination":{"page":1,"limit":20,"total":0,"hasMore":false}}`

### Liste chats support
- **Endpoint:** `GET /v1/franchise/support/chat`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:38.593Z","items":[],"tickets":[],"pagination":{"page":1,"limit":20,"total":0,"hasMore":false},"chats":[`

## ❌ Endpoints manquants (2)

### Détail ticket support
- **Endpoint:** `GET /v1/franchise/support/tickets/{id}`
- **Status:** 404
- **Token:** franchise
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"status":"error","generatedAt":"2026-06-11T10:39:38.223Z","error":{"code":"FRANCHISE_SUPPORT_TICKET_NOT_FOUND","message":"Support ticket not found"}}`

### Détail chat
- **Endpoint:** `GET /v1/franchise/support/chat/{id}`
- **Status:** 404
- **Token:** franchise
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"status":"error","generatedAt":"2026-06-11T10:39:38.781Z","error":{"code":"FRANCHISE_SUPPORT_TICKET_NOT_FOUND","message":"Support ticket not found"}}`

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

## 📊 Problèmes de données (2)

### Liste tickets support
- **Endpoint:** `GET /v1/franchise/support/tickets`
- **Status:** 200
- **Token:** franchise
- **Problème:** Liste vide retournée (pas de données en base)
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:38.024Z","items":[],"tickets":[],"pagination":{"page":1,"limit":20,"total":0,"hasMore":false}}`

### Liste chats support
- **Endpoint:** `GET /v1/franchise/support/chat`
- **Status:** 200
- **Token:** franchise
- **Problème:** Liste vide retournée (pas de données en base)
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:38.593Z","items":[],"tickets":[],"pagination":{"page":1,"limit":20,"total":0,"hasMore":false},"chats":[`

## À implémenter

- Implémenter `/v1/franchise/support/tickets/{id}` (Détail ticket support)
- Implémenter `/v1/franchise/support/chat/{id}` (Détail chat)

