# Audit Module Franchise - Statut des Onglets

**Date:** 2026-06-09
**Objectif:** Identifier ce qui est consommé, ce qui fonctionne, et ce qui doit être fait.

## 📊 Tableau Récapitulatif

| # | Onglet | Service API | Type API | Queries | Pages | Statut | Problèmes Connus |
|---|--------|-------------|----------|---------|-------|--------|------------------|
| 1 | Dashboard | ✅ dashboard.service.ts | V1 | ✅ | FranchiseDashboardPage.tsx | ⚠️ Partiel | Graphique OK, données à vérifier |
| 2 | Trips (Courses) | ✅ trips.service.ts | V1 | ✅ | FranchiseTripsListPage.tsx, FranchiseTripDetailPage.tsx | ⚠️ Partiel | Filtre partenaire erreur, recherche erreur |
| 3 | Partners (Partenaires) | ✅ partners.service.ts | Admin+filtre | ✅ | FranchisePartnersListPage.tsx, FranchisePartnerDetailPage.tsx | ⚠️ Partiel | Détail partenaire - endpoint franchise créé |
| 4 | Drivers (Chauffeurs) | ✅ drivers.service.ts | Admin+filtre | ✅ | FranchiseDriversListPage.tsx, FranchiseDriverDetailPage.tsx, FranchiseDriverTransfersPage.tsx | ❓ À vérifier | Utilise admin endpoint avec franchiseId |
| 5 | Clients | ✅ clients.service.ts | Legacy | ✅ | (dans app routes) | ❓ À vérifier | Legacy endpoint - non testé |
| 6 | Live Map | ✅ liveMap.service.ts | Admin+filtre | ✅ | FranchiseLiveMapPage.tsx | ❓ À vérifier | Utilise admin liveMap avec franchiseId |
| 7 | Dispatch | ✅ dispatch.service.ts | Legacy | ✅ | (dans app routes) | ❓ À vérifier | Legacy endpoint - non testé |
| 8 | Finance | ✅ finance.service.ts | Legacy | ✅ | FranchiseFinancePage.tsx, FranchiseReconciliationListPage.tsx | 🔴 Legacy | Endpoints legacy `/franchise/finance/*` |
| 9 | Marketing | ✅ marketing.service.ts | Legacy | ✅ | FranchiseBannersListPage.tsx, FranchiseCampaignsListPage.tsx | 🔴 Legacy | Endpoints legacy `/franchise/marketing/*` |
| 10 | Pricing | ✅ pricing.service.ts | Legacy | ✅ | FranchisePricingPage.tsx, FranchisePricingNewPage.tsx | 🔴 Legacy | Endpoints legacy `/franchise/pricing/*` |
| 11 | Promos | ✅ promos.service.ts | Legacy | ✅ | FranchisePromosPage.tsx, FranchisePromoNewPage.tsx | 🔴 Legacy | Endpoints legacy `/franchise/promos/*` |
| 12 | Support | ✅ support.service.ts | Legacy | ✅ | FranchiseSupportTicketsPage.tsx, FranchiseSupportChatListPage.tsx | 🔴 Legacy | Chat désactivé pour V1 |
| 13 | Territory | ✅ territory.service.ts | Legacy | ✅ | FranchiseTerritoryPage.tsx | 🔴 Legacy | Endpoint legacy `/franchise/territory` |
| 14 | Commissions | ✅ commissions.service.ts | Legacy | ✅ | FranchiseCommissionsListPage.tsx | 🔴 Legacy | Non testé |
| 15 | KYC Moderation | ✅ (via drivers) | Admin+filtre | - | FranchiseKycModerationPage.tsx | ❓ À vérifier | Utilise admin KYC endpoints |

**Légende Type API:**
- **V1** = Endpoint API v1 franchise dédié (ex: `/v1/franchise/dashboard`)
- **Admin+filtre** = Endpoint admin avec paramètre franchiseId (ex: `/admin/drivers?franchiseId=xxx`)
- **Legacy** = Endpoint legacy franchise (ex: `/franchise/finance`)

**Légende:**
- ✅ = Existe
- ❓ À vérifier = Existe mais pas testé récemment
- ⚠️ Partiel = Implémenté mais a des problèmes
- 🔴 Non implémenté = Service/queries manquants

---

## 🎯 Plan d'Action

### Phase 1: Vérification des onglets "Partiel" (Priorité Haute)
1. **Dashboard** - Vérifier données et graphiques
2. **Trips** - Corriger/rapporter les bugs identifiés
3. **Partners** - Tester le détail partenaire après fix backend

### Phase 2: Audit des onglets "À vérifier" (Priorité Moyenne)
Pour chaque onglet:
1. Vérifier si les API existent dans Swagger
2. Tester le chargement des données
3. Identifier les problèmes
4. Implémenter si >60% possible, sinon documenter

### Phase 3: Documentation Backend
Mettre à jour `BACKEND_REQUESTS_FRANCHISE.md` avec tous les endpoints manquants.

---

## 📝 Onglets Critiques - Détails

### 1. Trips (Courses) - BUGS ACTIFS
**Problèmes identifiés:**
- Filtre par partenaire: erreur HTTP quand pas de résultats
- Barre de recherche: erreur quand pas de résultats  
- Timeline null: crash "events is not iterable" (corrigé côté frontend)
- Détail course: endpoint `/v1/franchises/{id}/orders/{orderId}` doit retourner `timeline` comme tableau

**Actions:**
- [ ] Tester après corrections backend
- [ ] Vérifier tous les filtres (status, service, partenaire, date)

### 2. Partners (Partenaires)
**Problèmes identifiés:**
- Endpoint détail: `/v1/franchises/{id}/partners/{partnerId}` créé côté frontend, à tester

**Actions:**
- [ ] Tester clic sur partenaire dans la liste
- [ ] Vérifier affichage des informations détaillées

### 3. Drivers (Chauffeurs)
**API Disponibles à vérifier:**
- `drivers.service.ts` existe avec endpoints legacy et v1
- `LINKS.franchise.v1.drivers` - endpoint à vérifier si existe dans Swagger

**Actions:**
- [ ] Vérifier si endpoint franchise drivers existe
- [ ] Tester liste et détail chauffeur

---

**Prochaine étape:** Commencer la vérification systématique par onglet, en commençant par ceux marqués "Partiel".

---

## 📈 Synthèse par Type API

| Type API | Nombre | Onglets | Recommandation |
|----------|--------|---------|----------------|
| **V1** | 2 | Dashboard, Trips | ✅ Priorité haute - maintenir et corriger bugs |
| **Admin+filtre** | 4 | Partners, Drivers, Live Map, KYC | ⚠️ Moyen terme - migrer vers endpoints V1 dédiés |
| **Legacy** | 9 | Clients, Dispatch, Finance, Marketing, Pricing, Promos, Support, Territory, Commissions | 🔴 Court terme - demander création endpoints V1 |

---

## 🎯 Priorités Backend

### 1. Critique (Bloquant) - Dashboard + Trips
- ✅ Dashboard: Vérifier stabilité
- ⚠️ Trips: Corriger erreurs filtre/recherche/timeline

### 2. Haute (Migration V1) - Legacy Endpoints
**À demander au backend:**
- `GET /v1/franchises/{id}/finance` (remplace `/franchise/finance`)
- `GET /v1/franchises/{id}/marketing/campaigns` (remplace `/franchise/marketing/campaigns`)
- `GET /v1/franchises/{id}/marketing/banners` (remplace `/franchise/marketing/banners`)
- `GET /v1/franchises/{id}/pricing` (remplace `/franchise/pricing`)
- `GET /v1/franchises/{id}/territory` (remplace `/franchise/territory`)
- `GET /v1/franchises/{id}/support/tickets` (remplace `/franchise/support/tickets`)
- `GET /v1/franchises/{id}/promos` (remplace `/franchise/promos`)
- `GET /v1/franchises/{id}/commissions` (remplace `/franchise/commissions`)

### 3. Moyenne (Optimisation) - Admin+filtre → V1
**À demander au backend (si legacy pas disponible):**
- `GET /v1/franchises/{id}/drivers` (remplace `/admin/drivers?franchiseId=xxx`)
- `GET /v1/franchises/{id}/livemap` (remplace `/admin/livemap?franchiseId=xxx`)
- `GET /v1/franchises/{id}/kyc` (remplace `/admin/kyc?franchiseId=xxx`)

---

## ✅ Actions Frontend Complétées

| Onglet | Action | Statut |
|--------|--------|--------|
| Trips | Timeline défensive (null → []) | ✅ Corrigé |
| Partners | Endpoint détail franchise | ✅ Créé |
| Partners | Filtre IDs invalides | ✅ Corrigé |

---
