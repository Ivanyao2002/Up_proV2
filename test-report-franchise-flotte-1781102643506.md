# Rapport de Test - FRANCHISE / flotte

**Date:** 2026-06-10T14:44:03.504Z
**API:** https://api.upjunoo-dev.tech
**Total tests:** 9

## Résumé

- ✅ **Fonctionne:** 5
- ⚠️ **Partiel:** 2
- ❌ **Manquant:** 0
- 🐛 **Bugs:** 0
- ⚠️ **Échecs:** 2
- 📊 **Données:** 0

## ✅ Fonctionne correctement (5)

### Liste partenaires franchise
- **Endpoint:** `GET /v1/franchises/{id}/partners?page=1&limit=10`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:43:21.685Z","partners":[{"id":"3ffa62ce-ba9e-43ce-bb8d-18dddb889774","franchise_id":"82781966-5ca5-4a67-91`

### Détail partenaire franchise
- **Endpoint:** `GET /v1/franchises/{id}/partners/{partnerId}`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:43:21.998Z","partner":{"id":"74dc7fab-33e9-4a95-b2a8-281d7841d1e9","franchise_id":"82781966-5ca5-4a67-9147`

### Liste chauffeurs franchise
- **Endpoint:** `GET /v1/franchises/{id}/drivers?page=1&limit=10`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:43:22.262Z","drivers":[{"id":"cd1ff889-1e39-46d5-8414-f0eaa6823415","user_id":"cd3ce70f-81f6-412a-878d-73d`

### Détail chauffeur franchise
- **Endpoint:** `GET /v1/franchises/{id}/drivers/{driverId}`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:43:22.576Z","driver":{"id":"f0c530c1-4612-43dc-bc3b-391e4de94f00","user_id":"b26cad82-4f29-439b-9a78-e0a76`

### Documents KYC chauffeur
- **Endpoint:** `GET /v1/admin/kyc/documents?subject_id={driverId}&subject_type=DRIVER`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:43:23.351Z","items":[{"id":"aff581eb-875f-4c0b-90ab-31c480af273a","subject_type":"DRIVER","subject_id":"f0`

## ⚠️ Fonctionnel mais incomplet (2)

### Modération KYC
- **Endpoint:** `GET /v1/franchise/drivers/moderation?page=1&limit=10`
- **Status:** 403
- **Problème:** Accès interdit (403) - problème de permissions
- **Réponse:** `{"status":"error","generatedAt":"2026-06-10T14:43:22.751Z","error":{"code":"FRANCHISE_ACCESS_REQUIRED","message":"Franchise account required"}}`

### Clients franchise
- **Endpoint:** `GET /v1/franchise/clients?page=1&limit=10`
- **Status:** 403
- **Problème:** Accès interdit (403) - problème de permissions
- **Réponse:** `{"status":"error","generatedAt":"2026-06-10T14:43:23.138Z","error":{"code":"FRANCHISE_ACCESS_REQUIRED","message":"Franchise account required"}}`

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

