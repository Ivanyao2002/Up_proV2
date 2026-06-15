# Rapport de Test - FRANCHISE / flotte

**Date:** 2026-06-11T10:40:30.611Z
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
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:48.207Z","partners":[{"id":"3ffa62ce-ba9e-43ce-bb8d-18dddb889774","franchise_id":"82781966-5ca5-4a67-91`

### Détail partenaire franchise
- **Endpoint:** `GET /v1/franchises/{id}/partners/{partnerId}`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:48.507Z","partner":{"id":"3ffa62ce-ba9e-43ce-bb8d-18dddb889774","franchise_id":"82781966-5ca5-4a67-9147`

### Liste chauffeurs franchise
- **Endpoint:** `GET /v1/franchises/{id}/drivers?page=1&limit=10`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:48.796Z","drivers":[{"id":"b07c0d86-38b8-4940-9185-79e4bc010b34","user_id":"112a272b-8301-4832-a8fe-948`

### Détail chauffeur franchise
- **Endpoint:** `GET /v1/franchises/{id}/drivers/{driverId}`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:49.228Z","driver":{"id":"b07c0d86-38b8-4940-9185-79e4bc010b34","user_id":"112a272b-8301-4832-a8fe-948f0`

### Modération KYC
- **Endpoint:** `GET /v1/franchise/drivers/moderation?page=1&limit=10`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:49.524Z","items":[{"driverId":"41dd93b5-6009-45b9-bcbf-175d5cfee885","displayName":"Dev Driver BF","fir`

### Clients franchise
- **Endpoint:** `GET /v1/franchise/clients?page=1&limit=10`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:49.940Z","items":[{"id":"bc2a9dc6-0aa3-4c35-8b3a-54bb85c24ad5","display_name":null,"first_name":"Seed",`

### Documents KYC chauffeur
- **Endpoint:** `GET /v1/admin/kyc/documents?subject_id={driverId}&subject_type=DRIVER`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-11T10:39:50.141Z","items":[{"id":"88845191-717b-45ba-9af7-f0670de0ebc7","subject_type":"DRIVER","subject_id":"b0`

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

