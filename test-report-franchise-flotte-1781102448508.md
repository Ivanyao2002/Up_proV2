# Rapport de Test - FRANCHISE / flotte

**Date:** 2026-06-10T14:40:48.505Z
**API:** https://api.upjunoo-dev.tech
**Total tests:** 9

## Résumé

- ✅ **Fonctionne:** 3
- ⚠️ **Partiel:** 2
- ❌ **Manquant:** 2
- 🐛 **Bugs:** 0
- ⚠️ **Échecs:** 2
- 📊 **Données:** 0

## ✅ Fonctionne correctement (3)

### Liste partenaires franchise
- **Endpoint:** `GET /v1/franchises/{id}/partners?page=1&limit=10`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:40:06.649Z","partners":[{"id":"3ffa62ce-ba9e-43ce-bb8d-18dddb889774","franchise_id":"82781966-5ca5-4a67-91`

### Liste chauffeurs franchise
- **Endpoint:** `GET /v1/franchises/{id}/drivers?page=1&limit=10`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:40:07.239Z","drivers":[{"id":"cd1ff889-1e39-46d5-8414-f0eaa6823415","user_id":"cd3ce70f-81f6-412a-878d-73d`

### Documents KYC chauffeur
- **Endpoint:** `GET /v1/admin/kyc/documents?subject_id={driverId}&subject_type=DRIVER`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:40:08.352Z","items":[{"id":"954a3c6d-4430-4747-9ef4-574a6397bb83","subject_type":"DRIVER","subject_id":"47`

## ⚠️ Fonctionnel mais incomplet (2)

### Modération KYC
- **Endpoint:** `GET /v1/franchise/drivers/moderation?page=1&limit=10`
- **Status:** 403
- **Problème:** Accès interdit (403) - problème de permissions
- **Réponse:** `{"status":"error","generatedAt":"2026-06-10T14:40:07.737Z","error":{"code":"FRANCHISE_ACCESS_REQUIRED","message":"Franchise account required"}}`

### Clients franchise
- **Endpoint:** `GET /v1/franchise/clients?page=1&limit=10`
- **Status:** 403
- **Problème:** Accès interdit (403) - problème de permissions
- **Réponse:** `{"status":"error","generatedAt":"2026-06-10T14:40:08.136Z","error":{"code":"FRANCHISE_ACCESS_REQUIRED","message":"Franchise account required"}}`

## ❌ Endpoints manquants (2)

### Détail partenaire franchise
- **Endpoint:** `GET /v1/franchises/{id}/partners/{partnerId}`
- **Status:** 404
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"status":"error","generatedAt":"2026-06-10T14:40:06.934Z","error":{"code":"PARTNER_NOT_FOUND","message":"Partner not found for this franchise"}}`

### Détail chauffeur franchise
- **Endpoint:** `GET /v1/franchises/{id}/drivers/{driverId}`
- **Status:** 404
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"status":"error","generatedAt":"2026-06-10T14:40:07.547Z","error":{"code":"DRIVER_NOT_FOUND","message":"Driver not found for this franchise"}}`

## ⚠️ Échecs (2)

### Approuver KYC chauffeur
- **Endpoint:** `POST /v1/admin/drivers/{driverId}/approve`
- **Status:** 400
- **Problème:** Erreur 400: Body cannot be empty when content-type is set to 'application/json'
- **Réponse:** `{"error":{"code":"FST_ERR_CTP_EMPTY_JSON_BODY","message":"Body cannot be empty when content-type is set to 'application/json'"}}`

### Rejeter KYC chauffeur
- **Endpoint:** `POST /v1/admin/drivers/{driverId}/reject`
- **Status:** 400
- **Problème:** Erreur 400: Body cannot be empty when content-type is set to 'application/json'
- **Réponse:** `{"error":{"code":"FST_ERR_CTP_EMPTY_JSON_BODY","message":"Body cannot be empty when content-type is set to 'application/json'"}}`

## À implémenter

- Implémenter `/v1/franchises/{id}/partners/{partnerId}` (Détail partenaire franchise)
- Implémenter `/v1/franchises/{id}/drivers/{driverId}` (Détail chauffeur franchise)

