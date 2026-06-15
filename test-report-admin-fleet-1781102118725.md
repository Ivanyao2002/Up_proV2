# Rapport de Test - ADMIN / fleet

**Date:** 2026-06-10T14:35:18.724Z
**API:** https://api.upjunoo-dev.tech
**Total tests:** 8

## Résumé

- ✅ **Fonctionne:** 6
- ⚠️ **Partiel:** 0
- ❌ **Manquant:** 2
- 🐛 **Bugs:** 0
- ⚠️ **Échecs:** 0
- 📊 **Données:** 0

## ✅ Fonctionne correctement (6)

### Liste chauffeurs
- **Endpoint:** `GET /v1/admin/drivers?page=1&limit=10`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:34:36.061Z","items":[{"id":"e1cdf7a7-8891-4c78-bbe3-35f7e0911239","user_id":"8185f0c1-e190-46fb-9c59-6e46d`

### Recherche chauffeurs
- **Endpoint:** `GET /v1/admin/drivers?search=test&page=1&limit=10`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:34:36.648Z","items":[{"id":"77b681ab-6824-4d7e-9454-09bebbcd94ae","user_id":"c0abe23e-016d-47b2-bd46-5ecce`

### Liste véhicules
- **Endpoint:** `GET /v1/admin/vehicles?page=1&limit=10`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:34:37.357Z","items":[{"id":"1882081a-8808-4e16-b948-c68bbd1a9c25","partner_id":"ebb8737e-e453-4cb5-80ff-be`

### File KYC
- **Endpoint:** `GET /v1/admin/kyc/documents?page=1&limit=10`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:34:37.754Z","items":[{"id":"6d3d5e7b-c035-494d-9fc8-23b9cb887f85","subject_type":"DRIVER","subject_id":"00`

### Queue KYC
- **Endpoint:** `GET /v1/admin/kyc/queue`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:34:38.116Z","items":[{"driverId":"8e7a80a1-6cc8-4940-9db0-daf57025643e","displayName":"Kevine Adel","first`

### Liste clients
- **Endpoint:** `GET /v1/admin/users?page=1&limit=10`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:34:38.376Z","users":[{"id":"79ee9cb5-2c9f-4307-a3c7-8c4d99d4a32c","fullName":"Jean Kouassi","phone":null,"`

## ❌ Endpoints manquants (2)

### Détail chauffeur
- **Endpoint:** `GET /v1/drivers/{id}`
- **Status:** 404
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"status":"error","generatedAt":"2026-06-10T14:34:37.058Z","error":{"code":"DRIVER_NOT_FOUND","message":"Driver not found"}}`

### Détail client
- **Endpoint:** `GET /v1/admin/users/{id}`
- **Status:** 404
- **Problème:** Endpoint non trouvé (404)
- **Réponse:** `{"status":"error","generatedAt":"2026-06-10T14:34:38.577Z","error":{"code":"USER_NOT_FOUND","message":"User not found"}}`

## À implémenter

- Implémenter `/v1/drivers/{id}` (Détail chauffeur)
- Implémenter `/v1/admin/users/{id}` (Détail client)

