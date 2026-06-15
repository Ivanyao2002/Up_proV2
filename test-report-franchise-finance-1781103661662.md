# Rapport de Test - FRANCHISE / finance

**Date:** 2026-06-10T15:01:01.661Z
**API:** https://api.upjunoo-dev.tech
**Compte admin:** dev.admin@upjunoo-dev.tech
**Compte franchise:** dev.franchise.bf@upjunoo-dev.tech
**Total tests:** 11

## Résumé

- ✅ **Fonctionne:** 9
- ⚠️ **Partiel:** 0
- ❌ **Manquant:** 2
- 🐛 **Bugs:** 0
- ⚠️ **Échecs:** 0
- 📊 **Données:** 5

## ✅ Fonctionne correctement (9)

### Dashboard finance franchise
- **Endpoint:** `GET /v1/franchise/finance`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:00:19.445Z","wallet":{"id":"76c4b5d7-66b7-4b3d-93db-ca739649266e","owner_type":"FRANCHISE","owner_id":"827`

### Wallet franchise
- **Endpoint:** `GET /v1/franchises/{id}/wallet`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:00:19.655Z","wallet":{"id":"76c4b5d7-66b7-4b3d-93db-ca739649266e","owner_type":"FRANCHISE","owner_id":"827`

### Ledger franchise
- **Endpoint:** `GET /v1/franchises/{id}/ledger?limit=5`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:00:19.857Z","wallet":{"id":"76c4b5d7-66b7-4b3d-93db-ca739649266e","owner_type":"FRANCHISE","owner_id":"827`

### Liste commissions franchise
- **Endpoint:** `GET /v1/franchise/finance/commissions`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:00:20.094Z","items":[],"pagination":{"page":1,"limit":20,"total":0,"hasMore":false}}`

### Liste réconciliation franchise
- **Endpoint:** `GET /v1/franchise/finance/reconciliation`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:00:20.429Z","items":[],"entries":[],"pagination":{"page":1,"limit":20,"total":0,"hasMore":false},"wallet":`

### Recharges partenaires
- **Endpoint:** `GET /v1/franchise/finance/partner-transfers`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:00:20.779Z","items":[],"transfers":[],"pagination":{"page":1,"limit":20,"total":0,"hasMore":false}}`

### Recharges chauffeurs
- **Endpoint:** `GET /v1/franchise/finance/driver-transfers`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:00:21.018Z","items":[{"id":"8fcda16c-d4d6-4a4b-83f5-2c40607eaa98","wallet_id":"3d07aa55-215e-4486-9b66-0d9`

### Wallet partenaire (pour recharges)
- **Endpoint:** `GET /v1/partners/{partnerId}/wallet`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:00:21.291Z","wallet":{"id":"1794317e-3794-40d9-a287-22f206501eae","owner_type":"PARTNER","owner_id":"3ffa6`

### Ledger partenaire
- **Endpoint:** `GET /v1/partners/{partnerId}/ledger?limit=5`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:00:21.528Z","items":[],"pagination":{"page":1,"limit":5,"total":0,"hasMore":false}}`

## ❌ Endpoints manquants (2)

### Détail commission
- **Endpoint:** `GET /v1/franchise/finance/commissions/{id}`
- **Status:** 404
- **Token:** franchise
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"message":"Route GET:/v1/franchise/finance/commissions/82781966-5ca5-4a67-9147-1a6dd245e31d not found","error":"Not Found","statusCode":404}`

### Détail réconciliation
- **Endpoint:** `GET /v1/franchise/finance/reconciliation/{id}`
- **Status:** 404
- **Token:** franchise
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"message":"Route GET:/v1/franchise/finance/reconciliation/82781966-5ca5-4a67-9147-1a6dd245e31d not found","error":"Not Found","statusCode":404}`

## 📊 Problèmes de données (5)

### Ledger franchise
- **Endpoint:** `GET /v1/franchises/{id}/ledger?limit=5`
- **Status:** 200
- **Token:** admin
- **Problème:** Liste vide retournée (pas de données en base)
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:00:19.857Z","wallet":{"id":"76c4b5d7-66b7-4b3d-93db-ca739649266e","owner_type":"FRANCHISE","owner_id":"827`

### Liste commissions franchise
- **Endpoint:** `GET /v1/franchise/finance/commissions`
- **Status:** 200
- **Token:** franchise
- **Problème:** Liste vide retournée (pas de données en base)
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:00:20.094Z","items":[],"pagination":{"page":1,"limit":20,"total":0,"hasMore":false}}`

### Liste réconciliation franchise
- **Endpoint:** `GET /v1/franchise/finance/reconciliation`
- **Status:** 200
- **Token:** franchise
- **Problème:** Liste vide retournée (pas de données en base)
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:00:20.429Z","items":[],"entries":[],"pagination":{"page":1,"limit":20,"total":0,"hasMore":false},"wallet":`

### Recharges partenaires
- **Endpoint:** `GET /v1/franchise/finance/partner-transfers`
- **Status:** 200
- **Token:** franchise
- **Problème:** Liste vide retournée (pas de données en base)
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:00:20.779Z","items":[],"transfers":[],"pagination":{"page":1,"limit":20,"total":0,"hasMore":false}}`

### Ledger partenaire
- **Endpoint:** `GET /v1/partners/{partnerId}/ledger?limit=5`
- **Status:** 200
- **Token:** admin
- **Problème:** Liste vide retournée (pas de données en base)
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T15:00:21.528Z","items":[],"pagination":{"page":1,"limit":5,"total":0,"hasMore":false}}`

## À implémenter

- Implémenter `/v1/franchise/finance/commissions/{id}` (Détail commission)
- Implémenter `/v1/franchise/finance/reconciliation/{id}` (Détail réconciliation)

