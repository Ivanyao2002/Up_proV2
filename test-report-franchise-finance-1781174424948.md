# Rapport de Test - FRANCHISE / finance

**Date:** 2026-06-11T10:40:24.945Z
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
- 📊 **Données:** 4

## ✅ Fonctionne correctement (9)

### Dashboard finance franchise
- **Endpoint:** `GET /v1/franchise/finance`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:42.326Z","wallet":{"id":"76c4b5d7-66b7-4b3d-93db-ca739649266e","owner_type":"FRANCHISE","owner_id":"827`

### Wallet franchise
- **Endpoint:** `GET /v1/franchises/{id}/wallet`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:42.509Z","wallet":{"id":"76c4b5d7-66b7-4b3d-93db-ca739649266e","owner_type":"FRANCHISE","owner_id":"827`

### Ledger franchise
- **Endpoint:** `GET /v1/franchises/{id}/ledger?limit=5`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:42.701Z","wallet":{"id":"76c4b5d7-66b7-4b3d-93db-ca739649266e","owner_type":"FRANCHISE","owner_id":"827`

### Liste commissions franchise
- **Endpoint:** `GET /v1/franchise/finance/commissions`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:42.901Z","items":[],"pagination":{"page":1,"limit":20,"total":0,"hasMore":false}}`

### Liste réconciliation franchise
- **Endpoint:** `GET /v1/franchise/finance/reconciliation`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:43.328Z","items":[],"entries":[],"pagination":{"page":1,"limit":20,"total":0,"hasMore":false},"wallet":`

### Recharges partenaires
- **Endpoint:** `GET /v1/franchise/finance/partner-transfers`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:43.774Z","items":[{"id":"c0b47f7f-bc87-4ea0-962b-8fe00933fd74","wallet_id":"d6b6d5b5-d55f-4af4-803a-6cf`

### Recharges chauffeurs
- **Endpoint:** `GET /v1/franchise/finance/driver-transfers`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:44.076Z","items":[{"id":"a9c233e9-e19b-4d71-a467-859c130d7452","wallet_id":"ad41cf05-47f5-44cd-af4e-2b1`

### Wallet partenaire (pour recharges)
- **Endpoint:** `GET /v1/partners/{partnerId}/wallet`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:44.274Z","wallet":{"id":"1794317e-3794-40d9-a287-22f206501eae","owner_type":"PARTNER","owner_id":"3ffa6`

### Ledger partenaire
- **Endpoint:** `GET /v1/partners/{partnerId}/ledger?limit=5`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:44.471Z","items":[],"pagination":{"page":1,"limit":5,"total":0,"hasMore":false}}`

## ❌ Endpoints manquants (2)

### Détail commission
- **Endpoint:** `GET /v1/franchise/finance/commissions/{id}`
- **Status:** 404
- **Token:** franchise
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"status":"error","generatedAt":"2026-06-11T10:39:43.091Z","error":{"code":"FRANCHISE_COMMISSION_NOT_FOUND","message":"Commission not found"}}`

### Détail réconciliation
- **Endpoint:** `GET /v1/franchise/finance/reconciliation/{id}`
- **Status:** 404
- **Token:** franchise
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"status":"error","generatedAt":"2026-06-11T10:39:43.565Z","error":{"code":"FRANCHISE_RECONCILIATION_ENTRY_NOT_FOUND","message":"Reconciliation entry `

## 📊 Problèmes de données (4)

### Ledger franchise
- **Endpoint:** `GET /v1/franchises/{id}/ledger?limit=5`
- **Status:** 200
- **Token:** admin
- **Problème:** Liste vide retournée (pas de données en base)
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:42.701Z","wallet":{"id":"76c4b5d7-66b7-4b3d-93db-ca739649266e","owner_type":"FRANCHISE","owner_id":"827`

### Liste commissions franchise
- **Endpoint:** `GET /v1/franchise/finance/commissions`
- **Status:** 200
- **Token:** franchise
- **Problème:** Liste vide retournée (pas de données en base)
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:42.901Z","items":[],"pagination":{"page":1,"limit":20,"total":0,"hasMore":false}}`

### Liste réconciliation franchise
- **Endpoint:** `GET /v1/franchise/finance/reconciliation`
- **Status:** 200
- **Token:** franchise
- **Problème:** Liste vide retournée (pas de données en base)
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:43.328Z","items":[],"entries":[],"pagination":{"page":1,"limit":20,"total":0,"hasMore":false},"wallet":`

### Ledger partenaire
- **Endpoint:** `GET /v1/partners/{partnerId}/ledger?limit=5`
- **Status:** 200
- **Token:** admin
- **Problème:** Liste vide retournée (pas de données en base)
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:44.471Z","items":[],"pagination":{"page":1,"limit":5,"total":0,"hasMore":false}}`

## À implémenter

- Implémenter `/v1/franchise/finance/commissions/{id}` (Détail commission)
- Implémenter `/v1/franchise/finance/reconciliation/{id}` (Détail réconciliation)

