# Rapport de Test - FRANCHISE / flotte

**Date:** 2026-06-10T16:48:56.818Z
**API:** https://api.upjunoo-dev.tech
**Compte admin:** dev.admin@upjunoo-dev.tech
**Compte franchise:** dev.franchise.bf@upjunoo-dev.tech
**Total tests:** 9

## Résumé

- ✅ **Fonctionne:** 7
- ⚠️ **Partiel:** 0
- ❌ **Manquant:** 0
- 🐛 **Bugs:** 0
- ⚠️ **Échecs:** 2
- 📊 **Données:** 0

## ✅ Fonctionne correctement (7)

### Liste partenaires franchise
- **Endpoint:** `GET /v1/franchises/{id}/partners?page=1&limit=10`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T16:48:14.837Z","partners":[{"id":"3ffa62ce-ba9e-43ce-bb8d-18dddb889774","franchise_id":"82781966-5ca5-4a67-91`

### Détail partenaire franchise
- **Endpoint:** `GET /v1/franchises/{id}/partners/{partnerId}`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T16:48:15.165Z","partner":{"id":"3ffa62ce-ba9e-43ce-bb8d-18dddb889774","franchise_id":"82781966-5ca5-4a67-9147`

### Liste chauffeurs franchise
- **Endpoint:** `GET /v1/franchises/{id}/drivers?page=1&limit=10`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T16:48:15.461Z","drivers":[{"id":"cd1ff889-1e39-46d5-8414-f0eaa6823415","user_id":"cd3ce70f-81f6-412a-878d-73d`

### Détail chauffeur franchise
- **Endpoint:** `GET /v1/franchises/{id}/drivers/{driverId}`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T16:48:15.782Z","driver":{"id":"cd1ff889-1e39-46d5-8414-f0eaa6823415","user_id":"cd3ce70f-81f6-412a-878d-73d3f`

### Modération KYC
- **Endpoint:** `GET /v1/franchise/drivers/moderation?page=1&limit=10`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T16:48:16.082Z","items":[{"driverId":"41dd93b5-6009-45b9-bcbf-175d5cfee885","displayName":"Dev Driver BF","fir`

### Clients franchise
- **Endpoint:** `GET /v1/franchise/clients?page=1&limit=10`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T16:48:16.526Z","items":[{"id":"bc2a9dc6-0aa3-4c35-8b3a-54bb85c24ad5","display_name":null,"first_name":"Seed",`

### Documents KYC chauffeur
- **Endpoint:** `GET /v1/admin/kyc/documents?subject_id={driverId}&subject_type=DRIVER`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T16:48:16.746Z","items":[{"id":"48ec839e-8a36-4761-a5f3-190910459aec","subject_type":"DRIVER","subject_id":"cd`

## ⚠️ Échecs (2)

### Approuver KYC chauffeur
- **Endpoint:** `POST /v1/admin/drivers/{driverId}/approve`
- **Status:** 400
- **Token:** admin
- **Problème:** Erreur 400: Body cannot be empty when content-type is set to 'application/json'
- **Réponse:** `{"error":{"code":"FST_ERR_CTP_EMPTY_JSON_BODY","message":"Body cannot be empty when content-type is set to 'application/json'"}}`

### Rejeter KYC chauffeur
- **Endpoint:** `POST /v1/admin/drivers/{driverId}/reject`
- **Status:** 400
- **Token:** admin
- **Problème:** Erreur 400: Body cannot be empty when content-type is set to 'application/json'
- **Réponse:** `{"error":{"code":"FST_ERR_CTP_EMPTY_JSON_BODY","message":"Body cannot be empty when content-type is set to 'application/json'"}}`

