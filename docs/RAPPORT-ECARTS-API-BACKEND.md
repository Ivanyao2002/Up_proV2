# Rapport écarts API — Back-office Admin & Compta

> **Date :** 2026-06-18 11:36  
> **API :** https://api.upjunoo-dev.tech  
> **Swagger :** https://api.upjunoo-dev.tech/docs  
> **Généré par :** `node scripts/audit-api-ecarts-admin-compta.mjs`

---

## Comptes utilisés

| Portail | Email | Login |
|---------|-------|-------|
| Admin | `dev.admin@upjunoo-dev.tech` | ✅ OK |
| Compta | `comptable@upjunoo-dev.tech` | ✅ OK |

---

## Synthèse

| Indicateur | Valeur |
|------------|--------|
| Pages auditées | 52 (41 admin + 11 compta) |
| Anomalies totales | 5 |
| Anomalies haute gravité | 2 |

**Méthode :** analyse des **payloads JSON bruts** renvoyés par l'API (HTTP, envelope, cohérence interne, intégrité des listes).  
Les `null` dans les filtres non appliqués (`filters.applied.*`) et les relations optionnelles (`franchise_id`, etc.) ne sont **pas** signalés.

**Légende gravité :**
- 🔴 haute — réponse invalide, incohérence bloquante, entité sans `id`
- 🟠 moyenne — route legacy absente, compteurs incohérents dans le même JSON
- 🟡 basse — structure dupliquée, content-type

---

## Portail Admin

### ✅ Tableau de bord ops

- **Route UI :** `/admin/dashboard`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/dashboard` | 200 | ok | status: string, generatedAt: string, dashboard: object{8} |

**Tableaux dans la réponse**

- `/v1/admin/dashboard` : `dashboard.filters.options.franchises` (1), `dashboard.filters.options.partners` (3), `dashboard.filters.options.cities` (22), `dashboard.summary.weeklyFlow.labels` (7), `dashboard.summary.weeklyFlow.series` (2), `dashboard.recentActivity.items` (0), `dashboard.alerts` (3)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Dashboard finance

- **Route UI :** `/admin/finance`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/finance/dashboard` | 200 | ok | status: string, generatedAt: string, summary: object{8}, chart_weekly: array[0], by_franch… |

**Tableaux dans la réponse**

- `/v1/admin/finance/dashboard` : `chart_weekly` (0), `by_franchise` (1), `payment_mix` (0), `alerts` (1), `recent_movements` (0), `franchise_options` (1)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Transactions

- **Route UI :** `/admin/finance/transactions`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/finance/transactions?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, items: array[10], summary: object{3}, pagination: obj… |

**Tableaux dans la réponse**

- `/v1/admin/finance/transactions?page=1&limit=10` : `items` (10), `filterOptions.franchises` (1), `filterOptions.partners` (3)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Wallets

- **Route UI :** `/admin/finance/wallets`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/finance/wallets?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, items: array[10], wallets: array[10], pagination: obj… |

**Tableaux dans la réponse**

- `/v1/admin/finance/wallets?page=1&limit=10` : `items` (10), `wallets` (10)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Commissions

- **Route UI :** `/admin/finance/commissions`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/finance/commissions?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, items: array[4], commissions: array[4], filter_option… |
| GET | `/v1/admin/filter-options` | 200 | ok | status: string, generatedAt: string, filterOptions: object{3} |

**Tableaux dans la réponse**

- `/v1/admin/finance/commissions?page=1&limit=10` : `items` (4), `commissions` (4), `filter_options.franchises` (0)
- `/v1/admin/filter-options` : `filterOptions.franchises` (1), `filterOptions.partners` (3), `filterOptions.cities` (22)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Retraits

- **Route UI :** `/admin/finance/withdrawals`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/withdrawals?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, items: array[2], summary: object{2}, pagination: obje… |

**Tableaux dans la réponse**

- `/v1/admin/withdrawals?page=1&limit=10` : `items` (2)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Réconciliation

- **Route UI :** `/admin/finance/reconciliation`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/finance/reconciliation` | 200 | ok | status: string, generatedAt: string, items: array[0], reconciliations: array[0], paginatio… |

**Tableaux dans la réponse**

- `/v1/admin/finance/reconciliation` : `items` (0), `reconciliations` (0)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Grand livre

- **Route UI :** `/admin/finance/ledger`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/ledger?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, entries: array[10], pagination: object{7} |

**Tableaux dans la réponse**

- `/v1/admin/ledger?page=1&limit=10` : `entries` (10)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Virements chauffeurs

- **Route UI :** `/admin/finance/driver-transfers`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/finance/driver-transfers/stats` | 200 | ok | status: string, generatedAt: string, total_count: number, total_amount_fcfa: number, pendi… |
| GET | `/v1/admin/finance/driver-transfers?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, items: array[10], transfers: array[10], pagination: o… |

**Tableaux dans la réponse**

- `/v1/admin/finance/driver-transfers?page=1&limit=10` : `items` (10), `transfers` (10)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Règles commission

- **Route UI :** `/admin/finance/commission-rules`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/commission-rules` | 200 | ok | status: string, generatedAt: string, items: array[12] |

**Tableaux dans la réponse**

- `/v1/admin/commission-rules` : `items` (12)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Règles bonus

- **Route UI :** `/admin/finance/bonus-rules`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/bonus-rules` | 200 | ok | status: string, generatedAt: string, rules: array[1] |

**Tableaux dans la réponse**

- `/v1/admin/bonus-rules` : `rules` (1)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Liste chauffeurs

- **Route UI :** `/admin/fleet/drivers`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/drivers?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, items: array[7], filterOptions: object{5}, pagination… |

**Tableaux dans la réponse**

- `/v1/admin/drivers?page=1&limit=10` : `items` (7), `filterOptions.franchises` (1), `filterOptions.partners` (3), `filterOptions.cities` (22), `filterOptions.complianceStatuses` (5), `filterOptions.documentTypes` (7)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Fiche chauffeur

- **Route UI :** `/admin/fleet/drivers/{id}`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/drivers?page=1&limit=1` | 200 | ok | status: string, generatedAt: string, items: array[1], filterOptions: object{5}, pagination… |
| GET | `/v1/drivers/7abb2329-7404-4224-b347-fb6297480e6b` | 200 | ok | status: string, generatedAt: string, viewerRole: string, driver: object{31}, profile: obje… |
| GET | `/v1/admin/kyc/documents?page=1&limit=5` | 200 | ok | status: string, generatedAt: string, items: array[5], pagination: object{7} |

**Tableaux dans la réponse**

- `/v1/admin/drivers?page=1&limit=1` : `items` (1), `filterOptions.franchises` (1), `filterOptions.partners` (3), `filterOptions.cities` (22), `filterOptions.complianceStatuses` (5), `filterOptions.documentTypes` (7)
- `/v1/drivers/7abb2329-7404-4224-b347-fb6297480e6b` : `driver.driver_preferences.blocked_zones` (0), `driver.driver_preferences.preferred_zones` (0), `driver.driver_preferences.service_classes` (0), `driver.driver_preferences.accepted_payment_methods` (0), `driver.driver_service_classes` (0), `vehicles` (0), `wallet.recentMovements` (4), `preferences.blocked_zones` (0), `preferences.preferred_zones` (0), `preferences.service_classes` (0), `preferences.accepted_payment_methods` (0), `serviceClasses` (0)
- `/v1/admin/kyc/documents?page=1&limit=5` : `items` (5)

_Aucune anomalie détectée dans les payloads bruts._

---

### ⚠️ File KYC

- **Route UI :** `/admin/fleet/kyc`
- **Statut :** partiel

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/kyc/queue` | 200 | ok | status: string, generatedAt: string, items: array[1], pagination: object{7} |
| GET | `/v1/admin/kyc/documents?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, items: array[10], pagination: object{7} |

**Tableaux dans la réponse**

- `/v1/admin/kyc/queue` : `items` (1)
- `/v1/admin/kyc/documents?page=1&limit=10` : `items` (10)

**Anomalies (payload brut)**

| Gravité | Type | Détail | Action suggérée |
|---------|------|--------|------------------|
| 🔴 haute | integrite | items : 1/1 ligne(s) sans `id` | Toute entité listée doit avoir un identifiant |

---

### ✅ Clients B2C/B2B

- **Route UI :** `/admin/fleet/clients`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/users?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, users: array[10], items: array[10], pagination: objec… |

**Tableaux dans la réponse**

- `/v1/admin/users?page=1&limit=10` : `users` (10), `items` (10)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Véhicules

- **Route UI :** `/admin/fleet/vehicles`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/vehicles?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, items: array[8], filterOptions: object{5}, pagination… |

**Tableaux dans la réponse**

- `/v1/admin/vehicles?page=1&limit=10` : `items` (8), `filterOptions.franchises` (1), `filterOptions.partners` (3), `filterOptions.cities` (22), `filterOptions.complianceStatuses` (5), `filterOptions.documentTypes` (7)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Courses

- **Route UI :** `/admin/ops/trips`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/orders?page=1&limit=10&service=taxi` | 200 | ok | status: string, generatedAt: string, rides: array[10], items: array[10], filterOptions: ob… |
| GET | `/v1/admin/filter-options` | 200 | ok | status: string, generatedAt: string, filterOptions: object{3} |

**Tableaux dans la réponse**

- `/v1/admin/orders?page=1&limit=10&service=taxi` : `rides` (10), `items` (10), `filterOptions.franchises` (1), `filterOptions.partners` (3), `filterOptions.cities` (22)
- `/v1/admin/filter-options` : `filterOptions.franchises` (1), `filterOptions.partners` (3), `filterOptions.cities` (22)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Détail course

- **Route UI :** `/admin/ops/trips/{id}`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/orders?page=1&limit=1&service=taxi` | 200 | ok | status: string, generatedAt: string, rides: array[1], items: array[1], filterOptions: obje… |
| GET | `/v1/admin/orders/e4c437cc-d07c-41c7-8349-de633a675c8d` | 200 | ok | status: string, generatedAt: string, order: object{25} |

**Tableaux dans la réponse**

- `/v1/admin/orders?page=1&limit=1&service=taxi` : `rides` (1), `items` (1), `filterOptions.franchises` (1), `filterOptions.partners` (3), `filterOptions.cities` (22)
- `/v1/admin/orders/e4c437cc-d07c-41c7-8349-de633a675c8d` : `order.ride.option_codes` (0), `order.events` (5), `order.dispatch.dispatch.offers` (1), `order.dispatch.dispatch.candidates` (0), `order.dispatch.dispatch.sequentialQueue` (0), `order.timeline.steps` (7), `order.timeline.statusChain` (6), `order.tracking.stops` (0)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Carte live

- **Route UI :** `/admin/ops/map`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/live-map` | 200 | ok | status: string, generatedAt: string, drivers: array[0], meta: object{12}, orders: object{2… |
| GET | `/v1/catalog/vehicle-colors` | 200 | ok | status: string, generatedAt: string, items: array[10], meta: object{4} |

**Tableaux dans la réponse**

- `/v1/admin/live-map` : `drivers` (0), `meta.realtime.clientOptions.transports` (2), `meta.realtime.notes` (5), `orders.rides` (2), `orders.deliveries` (4)
- `/v1/catalog/vehicle-colors` : `items` (10)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ SOS Guardian dashboard

- **Route UI :** `/admin/ops/sos`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/safety/sos/dashboard` | 200 | ok | status: string, generatedAt: string, dashboard: object{3} |

**Tableaux dans la réponse**

- `/v1/admin/safety/sos/dashboard` : `dashboard.activeIncidents` (1)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Liste incidents SOS

- **Route UI :** `/admin/ops/sos/incidents`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/safety/sos?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, incidents: array[3], pagination: object{7} |

**Tableaux dans la réponse**

- `/v1/admin/safety/sos?page=1&limit=10` : `incidents` (3)

_Aucune anomalie détectée dans les payloads bruts._

---

### ❌ Console dispatch

- **Route UI :** `/admin/ops/dispatch`
- **Statut :** ko

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/admin/ops/dispatch` _(legacy)_ | 404 | 404 | — |

**Anomalies (payload brut)**

| Gravité | Type | Détail | Action suggérée |
|---------|------|--------|------------------|
| 🟠 moyenne | legacy_absent | Route legacy MSW absente du backend : HTTP 404 | Migrer vers /v1/... ou implémenter sur l'API live |

---

### ❌ Mode crise

- **Route UI :** `/admin/ops/crisis`
- **Statut :** ko

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/admin/ops/crisis` _(legacy)_ | 404 | 404 | — |

**Anomalies (payload brut)**

| Gravité | Type | Détail | Action suggérée |
|---------|------|--------|------------------|
| 🟠 moyenne | legacy_absent | Route legacy MSW absente du backend : HTTP 404 | Migrer vers /v1/... ou implémenter sur l'API live |

---

### ✅ Franchises

- **Route UI :** `/admin/network/franchises`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/franchises?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, items: array[1], franchises: array[1], filterOptions:… |

**Tableaux dans la réponse**

- `/v1/admin/franchises?page=1&limit=10` : `items` (1), `franchises` (1), `filterOptions.franchises` (1), `filterOptions.partners` (3), `filterOptions.cities` (22)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Partenaires

- **Route UI :** `/admin/network/partners`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/partners?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, items: array[3], filterOptions: object{3}, suggestedP… |

**Tableaux dans la réponse**

- `/v1/admin/partners?page=1&limit=10` : `items` (3), `filterOptions.franchises` (1), `filterOptions.partners` (3), `filterOptions.cities` (22)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Zones

- **Route UI :** `/admin/network/zones`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/zones` | 200 | ok | status: string, generatedAt: string, zones: array[25] |
| GET | `/v1/geo/hot-zones` | 200 | ok | status: string, generatedAt: string, items: array[25], meta: object{3} |

**Tableaux dans la réponse**

- `/v1/zones` : `zones` (25)
- `/v1/geo/hot-zones` : `items` (25)

_Aucune anomalie détectée dans les payloads bruts._

---

### ⚠️ Comptables

- **Route UI :** `/admin/network/accountants`
- **Statut :** partiel

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/accountants?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, items: array[1], accountants: array[1], pagination: o… |

**Tableaux dans la réponse**

- `/v1/admin/accountants?page=1&limit=10` : `items` (1), `accountants` (1)

**Anomalies (payload brut)**

| Gravité | Type | Détail | Action suggérée |
|---------|------|--------|------------------|
| 🔴 haute | integrite | items : 1/1 ligne(s) sans `id` | Toute entité listée doit avoir un identifiant |

---

### ✅ Promos marketing

- **Route UI :** `/admin/marketing/promos`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/marketing/promos` | 200 | ok | status: string, generatedAt: string, items: array[3], pagination: object{7} |

**Tableaux dans la réponse**

- `/v1/admin/marketing/promos` : `items` (3)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Campagnes

- **Route UI :** `/admin/marketing/campaigns`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/marketing/campaigns` | 200 | ok | status: string, generatedAt: string, items: array[0], campaigns: array[0], pagination: obj… |

**Tableaux dans la réponse**

- `/v1/admin/marketing/campaigns` : `items` (0), `campaigns` (0)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Bannières

- **Route UI :** `/admin/marketing/banners`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/marketing/banners` | 200 | ok | status: string, generatedAt: string, items: array[0], banners: array[0], pagination: objec… |

**Tableaux dans la réponse**

- `/v1/admin/marketing/banners` : `items` (0), `banners` (0)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Dispatchers

- **Route UI :** `/admin/settings/dispatchers`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/dispatchers` | 200 | ok | status: string, generatedAt: string, items: array[1], dispatchers: array[1], pagination: o… |

**Tableaux dans la réponse**

- `/v1/admin/dispatchers` : `items` (1), `dispatchers` (1)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Règles dispatch

- **Route UI :** `/admin/settings/dispatch-rules`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/dispatch-config?countryCode=CI` | 200 | ok | status: string, generatedAt: string, settingKey: string, schemaVersion: number, document: … |

**Tableaux dans la réponse**

- `/v1/admin/dispatch-config?countryCode=CI` : `document.global.wave_radii_km` (4), `document.global.active_zone_ids` (20), `document.global.enabled_service_types` (3), `waveSchedule.RIDE` (2), `waveSchedule.DELIVERY_CARGO` (2)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Tarification

- **Route UI :** `/admin/settings/pricing`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/pricing-rules` | 200 | ok | status: string, generatedAt: string, items: array[17] |
| GET | `/v1/admin/pricing-config` | 200 | ok | status: string, generatedAt: string, settingKey: string, schemaVersion: number, document: … |

**Tableaux dans la réponse**

- `/v1/admin/pricing-rules` : `items` (17)
- `/v1/admin/pricing-config` : `document.global.hotZonePolicy.liveHeatRatioTiers` (5), `document.global.supplyDemandPolicy.ratioTiers` (5), `document.global.trafficPolicy.peakHourProfiles` (6), `document.global.tripBands` (4), `document.countries.CI.tripBands` (4), `document.countries.SN.tripBands` (4), `document.countries.BF.tripBands` (4), `document.countries.ML.tripBands` (4), `document.countries.GN.tripBands` (4), `document.countries.TG.tripBands` (4), `document.countries.BJ.tripBands` (4), `seedTemplate.global.hotZonePolicy.liveHeatRatioTiers` (5)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Rôles

- **Route UI :** `/admin/settings/roles`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/roles` | 200 | ok | status: string, generatedAt: string, items: array[6] |

**Tableaux dans la réponse**

- `/v1/admin/roles` : `items` (6)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Config météo

- **Route UI :** `/admin/settings/weather`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/weather-config` | 200 | ok | status: string, generatedAt: string, settingKey: string, schemaVersion: number, document: … |

**Tableaux dans la réponse**

- `/v1/admin/weather-config` : `document.activeServiceTypes` (2), `seedTemplate.activeServiceTypes` (2), `effective.activeServiceTypes` (2)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Paramètres généraux

- **Route UI :** `/admin/settings/general`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/settings/general` | 200 | ok | status: string, generatedAt: string, key: string, setting: null, value: object{5} |

**Tableaux dans la réponse**

- `/v1/admin/settings/general` : `value.locales` (1)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Intégrations

- **Route UI :** `/admin/settings/integrations`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/paydunya-config` | 200 | ok | status: string, generatedAt: string, settingKey: string, schemaVersion: number, document: … |
| GET | `/admin/settings/integrations` _(legacy)_ | 404 | 404 | — |

**Tableaux dans la réponse**

- `/v1/admin/paydunya-config` : `document.enabledChannels.BF` (2), `document.enabledChannels.BJ` (2), `document.enabledChannels.CI` (5), `document.enabledChannels.CM` (1), `document.enabledChannels.ML` (2), `document.enabledChannels.SN` (6), `document.enabledChannels.TG` (2), `seedTemplate.enabledChannels.BF` (2), `seedTemplate.enabledChannels.BJ` (2), `seedTemplate.enabledChannels.CI` (5), `seedTemplate.enabledChannels.CM` (1), `seedTemplate.enabledChannels.ML` (2)

**Anomalies (payload brut)**

| Gravité | Type | Détail | Action suggérée |
|---------|------|--------|------------------|
| 🟠 moyenne | legacy_absent | Route legacy MSW absente du backend : HTTP 404 | Migrer vers /v1/... ou implémenter sur l'API live |

---

### ✅ Journal audit

- **Route UI :** `/admin/settings/audit`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/audit-log?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, items: array[0] |

**Tableaux dans la réponse**

- `/v1/admin/audit-log?page=1&limit=10` : `items` (0)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Plafonds finance

- **Route UI :** `/admin/settings/finance-caps`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/admin/settings/finance-caps` | 200 | ok | status: string, generatedAt: string, driver_withdrawal_daily_cap_xof: number, driverWithdr… |

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Tickets support

- **Route UI :** `/admin/support/tickets`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/support/tickets?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, items: array[0], pagination: object{4} |

**Tableaux dans la réponse**

- `/v1/support/tickets?page=1&limit=10` : `items` (0)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Chat support

- **Route UI :** `/admin/support/chat`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/chat/conversations` | 200 | ok | status: string, generatedAt: string, items: array[0], pagination: object{4} |

**Tableaux dans la réponse**

- `/v1/chat/conversations` : `items` (0)

_Aucune anomalie détectée dans les payloads bruts._

---

## Portail Compta

### ✅ Dashboard compta

- **Route UI :** `/compta`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/compta/me` | 200 | ok | status: string, generatedAt: string, accountant: object{11} |
| GET | `/v1/compta/dashboard` | 200 | ok | status: string, generatedAt: string, period: object{4}, entries_today: object{3}, commissi… |

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Grand livre compta

- **Route UI :** `/compta/ledger`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/compta/ledger?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, entries: array[10], pagination: object{7} |
| GET | `/v1/compta/filter-options` | 200 | ok | status: string, generatedAt: string, filterOptions: object{3} |

**Tableaux dans la réponse**

- `/v1/compta/ledger?page=1&limit=10` : `entries` (10)
- `/v1/compta/filter-options` : `filterOptions.franchises` (1), `filterOptions.partners` (3), `filterOptions.cities` (10)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Flux compta

- **Route UI :** `/compta/flows`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/compta/ledger?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, entries: array[10], pagination: object{7} |

**Tableaux dans la réponse**

- `/v1/compta/ledger?page=1&limit=10` : `entries` (10)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Transactions compta

- **Route UI :** `/compta/transactions`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/compta/ledger?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, entries: array[10], pagination: object{7} |

**Tableaux dans la réponse**

- `/v1/compta/ledger?page=1&limit=10` : `entries` (10)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Wallets compta

- **Route UI :** `/compta/wallets`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/compta/wallets?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, items: array[10], wallets: array[10], pagination: obj… |

**Tableaux dans la réponse**

- `/v1/compta/wallets?page=1&limit=10` : `items` (10), `wallets` (10)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Commissions compta

- **Route UI :** `/compta/commissions`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/compta/commissions?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, items: array[4], commissions: array[4], filter_option… |

**Tableaux dans la réponse**

- `/v1/compta/commissions?page=1&limit=10` : `items` (4), `commissions` (4), `filter_options.franchises` (0)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Retraits compta

- **Route UI :** `/compta/withdrawals`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/compta/withdrawals?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, items: array[2], summary: object{2}, pagination: obje… |

**Tableaux dans la réponse**

- `/v1/compta/withdrawals?page=1&limit=10` : `items` (2)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Réconciliation compta

- **Route UI :** `/compta/reconciliation`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/compta/reconciliation` | 200 | ok | status: string, generatedAt: string, items: array[0], reconciliations: array[0], paginatio… |
| GET | `/v1/compta/cash-reconciliations?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, items: array[0], pagination: object{7} |

**Tableaux dans la réponse**

- `/v1/compta/reconciliation` : `items` (0), `reconciliations` (0)
- `/v1/compta/cash-reconciliations?page=1&limit=10` : `items` (0)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Recharges / virements

- **Route UI :** `/compta/recharges`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/compta/driver-transfers/stats` | 200 | ok | status: string, generatedAt: string, total_count: number, total_amount_fcfa: number, pendi… |
| GET | `/v1/compta/driver-transfers?page=1&limit=10` | 200 | ok | status: string, generatedAt: string, items: array[10], transfers: array[10], pagination: o… |

**Tableaux dans la réponse**

- `/v1/compta/driver-transfers?page=1&limit=10` : `items` (10), `transfers` (10)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Périodes comptables

- **Route UI :** `/compta/periods`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/compta/periods` | 200 | ok | status: string, generatedAt: string, periods: array[0] |
| GET | `/v1/compta/dashboard` | 200 | ok | status: string, generatedAt: string, period: object{4}, entries_today: object{3}, commissi… |

**Tableaux dans la réponse**

- `/v1/compta/periods` : `periods` (0)

_Aucune anomalie détectée dans les payloads bruts._

---

### ✅ Exports

- **Route UI :** `/compta/exports`
- **Statut :** ok

**Endpoints testés**

| Méthode | Endpoint | HTTP | Statut | Payload (racine) |
|---------|----------|------|--------|------------------|
| GET | `/v1/compta/ledger/export?format=csv` | 200 | ok | text/csv; charset=utf-8 |
| GET | `/v1/compta/reports/export` | 200 | ok | text/csv; charset=utf-8 |

_Aucune anomalie détectée dans les payloads bruts._

---

## Actions prioritaires backend

1. **items : 1/1 ligne(s) sans `id`** — `/admin/fleet/kyc`
2. **items : 1/1 ligne(s) sans `id`** — `/admin/network/accountants`

---

## Notes méthodologie

- Audit **lecture seule** (GET) sur `https://api.upjunoo-dev.tech`.
- Chaque ligne du tableau « Payload (racine) » décrit les **clés réellement renvoyées** (ex. `status: string, dashboard: object{9}`).
- Les `null` dans `filters.applied` (aucun filtre actif) sont **normaux** — voir exemple `GET /v1/admin/dashboard`.
- Routes `/admin/...` sans `/v1` = appels legacy MSW encore présents dans le front ; marquées _(legacy)_ si 404.
- Relancer : `node scripts/audit-api-ecarts-admin-compta.mjs`
