# Rapport de Test - ADMIN / settings

**Date:** 2026-06-10T14:34:54.327Z
**API:** https://api.upjunoo-dev.tech
**Total tests:** 12

## Résumé

- ✅ **Fonctionne:** 12
- ⚠️ **Partiel:** 0
- ❌ **Manquant:** 0
- 🐛 **Bugs:** 0
- ⚠️ **Échecs:** 0
- 📊 **Données:** 2

## ✅ Fonctionne correctement (12)

### Dispatchers
- **Endpoint:** `GET /v1/admin/dispatchers?page=1&limit=10`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:34:11.852Z","items":[{"id":"c138f2a5-bc8b-4767-a8f1-8998b8d9f1b2","name":"DISPATCHER CO-MA-PLA","email":"d`

### Règles dispatch (mock)
- **Endpoint:** `GET /v1/admin/settings/dispatch-rules`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:34:12.045Z","key":"dispatch.config","setting":{"id":"cb69be44-e5c4-4782-a899-3fadb6627197","key":"dispatch`

### Config dispatch
- **Endpoint:** `GET /v1/admin/dispatch-config`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:34:12.243Z","settingKey":"dispatch.config","schemaVersion":2,"document":{"schemaVersion":2,"global":{"RIDE`

### Rôles
- **Endpoint:** `GET /v1/admin/roles?page=1&limit=10`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:34:12.439Z","items":[{"id":"f4cf3ce5-dfd4-4767-9611-933a40996666","code":"SUPER_ADMIN","label":"Super admi`

### Rôles (mock)
- **Endpoint:** `GET /v1/admin/settings/roles?page=1&limit=10`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:34:12.652Z","items":[{"id":"ad729780-bc3f-43c6-8dee-e9584ed5c1d1","code":"CLIENT","label":"Client","scope"`

### Règles tarification
- **Endpoint:** `GET /v1/admin/pricing-rules?page=1&limit=10`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:34:12.858Z","items":[{"id":"2ed387a1-e7ee-4f48-9c36-132a7986c7d7","franchise_id":"1bb2bff7-edcc-496d-a87a-`

### Intégrations (mock)
- **Endpoint:** `GET /v1/admin/settings/integrations`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:34:13.179Z","items":[{"id":"paydunya","name":"PayDunya","status":"active","config":{"mode":"test","store":`

### Config Paydunya
- **Endpoint:** `GET /v1/admin/paydunya-config`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:34:13.384Z","settingKey":"paydunya.config","schemaVersion":1,"document":{"schemaVersion":1,"enabled":true,`

### Config météo
- **Endpoint:** `GET /v1/admin/weather-config`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:34:13.576Z","settingKey":"weather.config","schemaVersion":1,"document":{"schemaVersion":1,"enabled":true,"`

### Audit log
- **Endpoint:** `GET /v1/admin/audit-log?page=1&limit=10`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:34:13.784Z","items":[]}`

### Audit (mock)
- **Endpoint:** `GET /v1/admin/settings/audit?page=1&limit=10`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:34:13.988Z","items":[],"audit":[],"pagination":{"page":1,"limit":10,"total":0,"totalPages":0,"hasMore":fal`

### Paramètres généraux
- **Endpoint:** `GET /v1/admin/settings/general`
- **Status:** 200
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:34:14.181Z","key":"platform.general","setting":null,"value":{"platform_name":"UPJUNOO","support_email":"su`

## 📊 Problèmes de données (2)

### Audit log
- **Endpoint:** `GET /v1/admin/audit-log?page=1&limit=10`
- **Status:** 200
- **Problème:** Liste vide retournée (pas de données en base)
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:34:13.784Z","items":[]}`

### Audit (mock)
- **Endpoint:** `GET /v1/admin/settings/audit?page=1&limit=10`
- **Status:** 200
- **Problème:** Liste vide retournée (pas de données en base)
- **Réponse:** `{"status":"ok","generatedAt":"2026-06-10T14:34:13.988Z","items":[],"audit":[],"pagination":{"page":1,"limit":10,"total":0,"totalPages":0,"hasMore":fal`

