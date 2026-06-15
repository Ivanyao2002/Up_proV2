# Rapport de Test - ADMIN / operations

**Date:** 2026-06-10T14:34:27.275Z
**API:** https://api.upjunoo-dev.tech
**Total tests:** 4

## Résumé

- ✅ **Fonctionne:** 4
- ⚠️ **Partiel:** 0
- ❌ **Manquant:** 0
- 🐛 **Bugs:** 0
- ⚠️ **Échecs:** 0
- 📊 **Données:** 0

## ✅ Fonctionne correctement (4)

### Tableau de bord
- **Endpoint:** `GET /v1/admin/dashboard`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:33:45.559Z","dashboard":{"generatedAt":"2026-06-10T14:33:45.559Z","filters":{"applied":{"franchiseId":null`

### Carte live
- **Endpoint:** `GET /v1/admin/live-map`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:33:45.934Z","drivers":[{"id":"49dbed34-145b-4016-aadd-d66dcc6fb2a3","userId":"336dca87-a712-4c9f-80c7-e428`

### Liste des courses
- **Endpoint:** `GET /v1/admin/orders?page=1&limit=10`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:33:46.636Z","rides":[{"id":"f121e9e0-f8ce-48b1-8d43-45a7baa64ed9","order_reference":"TR-F121E9E0","client_`

### Détail course
- **Endpoint:** `GET /v1/admin/orders/{orderId}`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:33:47.126Z","order":{"serviceType":"RIDE","orderId":"f121e9e0-f8ce-48b1-8d43-45a7baa64ed9","ride":{"id":"f`

