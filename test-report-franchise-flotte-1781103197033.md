# Rapport de Test - FRANCHISE / flotte

**Date:** 2026-06-10T14:53:17.031Z
**API:** https://api.upjunoo-dev.tech
**Compte admin:** dev.admin@upjunoo-dev.tech
**Compte franchise:** dev.franchise.bf@upjunoo-dev.tech
**Total tests:** 8

## Résumé

- ✅ **Fonctionne:** 4
- ⚠️ **Partiel:** 0
- ❌ **Manquant:** 2
- 🐛 **Bugs:** 1
- ⚠️ **Échecs:** 2
- 📊 **Données:** 0

## ✅ Fonctionne correctement (4)

### Liste partenaires franchise
- **Endpoint:** `GET /v1/franchises/{id}/partners?page=1&limit=10`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:52:35.034Z","partners":[{"id":"3ffa62ce-ba9e-43ce-bb8d-18dddb889774","franchise_id":"82781966-5ca5-4a67-91`

### Liste chauffeurs franchise
- **Endpoint:** `GET /v1/franchises/{id}/drivers?page=1&limit=10`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:52:35.719Z","drivers":[{"id":"cd1ff889-1e39-46d5-8414-f0eaa6823415","user_id":"cd3ce70f-81f6-412a-878d-73d`

### Clients franchise
- **Endpoint:** `GET /v1/franchise/clients?page=1&limit=10`
- **Status:** 200
- **Token:** franchise
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:52:36.680Z","items":[{"id":"bc2a9dc6-0aa3-4c35-8b3a-54bb85c24ad5","display_name":null,"first_name":"Seed",`

### Documents KYC chauffeur
- **Endpoint:** `GET /v1/admin/kyc/documents?subject_id={driverId}&subject_type=DRIVER`
- **Status:** 200
- **Token:** admin
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:52:36.895Z","items":[{"id":"fae46a4f-a3cc-440a-8226-a0b3f83ad38b","subject_type":"DRIVER","subject_id":"1c`

## ❌ Endpoints manquants (2)

### Détail partenaire franchise
- **Endpoint:** `GET /v1/franchises/{id}/partners/{partnerId}`
- **Status:** 404
- **Token:** admin
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"status":"error","generatedAt":"2026-06-10T14:52:35.316Z","error":{"code":"PARTNER_NOT_FOUND","message":"Partner not found for this franchise"}}`

### Détail chauffeur franchise
- **Endpoint:** `GET /v1/franchises/{id}/drivers/{driverId}`
- **Status:** 404
- **Token:** admin
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"status":"error","generatedAt":"2026-06-10T14:52:36.034Z","error":{"code":"DRIVER_NOT_FOUND","message":"Driver not found for this franchise"}}`

## 🐛 Bugs détectés (1)

### Modération KYC
- **Endpoint:** `GET /v1/franchise/drivers/moderation?page=1&limit=10`
- **Status:** 500
- **Token:** franchise
- **Problème:** Erreur serveur (500) - BUG
- **Réponse:** `{"status":"error","generatedAt":"2026-06-10T14:52:36.230Z","error":{"code":"FRANCHISE_DRIVER_FETCH_FAILED","message":"invalid input syntax for type uu`

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

## Priorité: Bugs à corriger

- Corriger 500 sur `/v1/franchise/drivers/moderation?page=1&limit=10` (Modération KYC)

## À implémenter

- Implémenter `/v1/franchises/{id}/partners/{partnerId}` (Détail partenaire franchise)
- Implémenter `/v1/franchises/{id}/drivers/{driverId}` (Détail chauffeur franchise)

