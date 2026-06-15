# Rapport de Consommation API - Module Franchise

**Date de génération** : 9 juin 2026  
**Version API** : v1  
**Base URL** : `https://api.upjunoo-dev.tech`

---

## Vue d'ensemble

Le module Franchise consomme les endpoints API suivants pour récupérer les données du tableau de bord, des courses, des partenaires et des chauffeurs.

---

## Endpoints Consommés

### 1. Dashboard Franchise

| Endpoint | Méthode | Utilisé dans | Description |
|----------|---------|--------------|-------------|
| `/v1/franchise/dashboard` | GET | `dashboard.service.ts` | Récupère les données du tableau de bord (KPIs, graphiques) |
| `/v1/franchise/partners` | GET | `dashboard.service.ts` | Liste des partenaires récents (limité à 5) |

**Champs attendus dans la réponse** (d'après `BACKEND_REQUESTS.md`) :
```json
{
  "territory_name": "string",
  "drivers_online": number,
  "trips_completed_today": number,
  "trips_today_trend_pct": number,
  "revenue_today_xof": number,
  "revenue_trend_pct": number,
  "pending_kyc": number,
  "pending_withdrawals": {
    "total_xof": number,
    "partners_xof": number,
    "partners_requests_count": number,
    "drivers_xof": number,
    "drivers_requests_count": number
  },
  "weekly_flow": {
    "labels": ["Lun", "Mar", ...],
    "revenue": [120000, 95000, ...],
    "trips": [42, 38, ...]
  }
}
```

**Fichiers concernés** :
- `src/features/franchise/api/dashboard.service.ts`
- `src/features/franchise/api/dashboard.queries.ts`
- `src/features/franchise/api/franchiseDashboard.mapper.ts`
- `src/features/franchise/pages/FranchiseDashboardPage.tsx`

---

### 2. Courses (Trips)

| Endpoint | Méthode | Utilisé dans | Description |
|----------|---------|--------------|-------------|
| `/v1/franchises/{id}/orders` | GET | `trips.service.ts` | Liste paginée des courses de la franchise |
| `/v1/admin/orders/{orderId}` | GET | `tripDetail.service.ts` | Détails d'une course spécifique |

**Fichiers concernés** :
- `src/features/franchise/api/trips.service.ts`
- `src/features/franchise/api/trips.queries.ts`
- `src/features/franchise/pages/FranchiseTripsListPage.tsx`
- `src/features/franchise/pages/FranchiseTripDetailPage.tsx`

**Problème connu** :
- Le filtre par `service` (taxi, delivery, rental, freight) n'est pas correctement supporté par le backend sur `/v1/franchises/{id}/orders`
- Voir `FRANCHISE_TRIPS_SERVICE_FILTER.md` pour les détails

---

### 3. Partenaires

| Endpoint | Méthode | Utilisé dans | Description |
|----------|---------|--------------|-------------|
| `/v1/franchise/partners` | GET | `dashboard.service.ts` | Liste des partenaires (utilisé pour le dashboard) |
| `/v1/franchise/partners` | GET | Live Map / Filtrage | Liste complète avec filtres |

**Fichiers concernés** :
- `src/features/franchise/api/dashboard.service.ts`
- `src/features/franchise/components/FranchiseLiveMapPartnerFilter.tsx`

---

### 4. Chauffeurs

| Endpoint | Méthode | Utilisé dans | Description |
|----------|---------|--------------|-------------|
| `/v1/franchise/drivers` | GET | `drivers.queries.ts` | Liste des chauffeurs de la franchise |
| `/v1/franchise/drivers/{id}/kyc/approve` | PATCH | `drivers.service.ts` | Approuver un KYC |
| `/v1/franchise/drivers/{id}/kyc/reject` | PATCH | `drivers.service.ts` | Rejeter un KYC |
| `/v1/franchise/drivers/{id}/documents/{docId}/approve` | PATCH | `drivers.service.ts` | Approuver un document |
| `/v1/franchise/drivers/{id}/documents/{docId}/reject` | PATCH | `drivers.service.ts` | Rejeter un document |

**Fichiers concernés** :
- `src/features/franchise/api/drivers.queries.ts`
- `src/features/franchise/api/drivers.service.ts`

---

### 5. Contexte Franchise

| Endpoint | Méthode | Utilisé dans | Description |
|----------|---------|--------------|-------------|
| `/v1/franchises/me` | GET | `franchiseContext.service.ts` | Récupère l'ID de la franchise connectée |

**Fichiers concernés** :
- `src/core/api/franchiseContext.service.ts`

---

### 6. Legacy API (à migrer)

| Endpoint | Méthode | Utilisé dans | Statut |
|----------|---------|--------------|--------|
| `/franchise/dashboard` | GET | `dashboard.service.ts` (legacy mode) | **Legacy** - À migrer vers v1 |
| `/franchise/ops/trips` | GET | `trips.service.ts` (legacy mode) | **Legacy** - À migrer vers v1 |
| `/franchise/ops/trips/{id}` | GET | `trips.service.ts` (legacy mode) | **Legacy** - À migrer vers v1 |

---

## État des Intégrations

### ✅ Fonctionnels

| Feature | Endpoint | État |
|---------|----------|------|
| Dashboard KPIs | `/v1/franchise/dashboard` | ✅ (Erreur 500 côté backend - en cours de résolution) |
| Liste partenaires | `/v1/franchise/partners` | ✅ |
| Liste courses | `/v1/franchises/{id}/orders` | ✅ |
| Détail course | `/v1/admin/orders/{id}` | ✅ |
| Contexte franchise | `/v1/franchises/me` | ✅ |

### ⚠️ Problèmes connus

| Feature | Problème | Solution proposée |
|---------|----------|-------------------|
| Filtre service (courses) | Paramètre non supporté par backend | Vérifier nom du paramètre avec backend ou filtrer côté client |
| Dashboard | Erreur 500 sur `/v1/franchise/dashboard` | Backend en cours de résolution |

### ⏳ À implémenter / Vérifier

| Feature | Endpoint attendu | Statut |
|---------|-----------------|--------|
| Retraits en attente | Vérifier si présent dans `/v1/franchise/dashboard` | À confirmer |
| KYC pending | Vérifier si présent dans `/v1/franchise/dashboard` | À confirmer |
| Flux 7 jours | Vérifier format `weekly_flow` | À confirmer |

---

## Architecture Frontend

```
src/features/franchise/
├── api/
│   ├── dashboard.service.ts      # Appels API dashboard
│   ├── dashboard.queries.ts      # React Query hooks
│   ├── franchiseDashboard.mapper.ts  # Mapping données
│   ├── trips.service.ts         # Appels API courses
│   ├── trips.queries.ts         # React Query hooks courses
│   ├── drivers.service.ts       # Appels API chauffeurs
│   ├── drivers.queries.ts       # React Query hooks chauffeurs
│   └── franchisePortal.mapper.ts # Mapping legacy
├── components/
│   ├── FranchisePendingWithdrawalsKpi.tsx
│   └── FranchiseLiveMapPartnerFilter.tsx
└── pages/
    ├── FranchiseDashboardPage.tsx
    ├── FranchiseTripsListPage.tsx
    └── FranchiseTripDetailPage.tsx
```

---

## Mappers et Types

### FranchiseDashboard (interface)

**Fichier** : `src/features/franchise/api/dashboard.service.ts`

```typescript
interface FranchiseDashboard {
  territory_name: string;
  partners_count: number;
  drivers_total: number;
  drivers_online: number;
  trips_today: number;
  trips_today_trend_pct: number;
  trips_completed_today: number;
  revenue_today_fcfa: number;
  revenue_trend_pct: number;
  pending_kyc: number;
  pending_withdrawals: {
    total_fcfa: number;
    partners_fcfa: number;
    partners_requests_count: number;
    drivers_fcfa: number;
    drivers_requests_count: number;
  };
  chart_flux: { day: string; revenue: number; trips: number }[];
  recent_partners: {
    id: string;
    name: string;
    drivers_count: number;
    status: "active" | "pending" | "suspended";
  }[];
}
```

### Fonctions de mapping

| Fonction | Fichier | Description |
|----------|---------|-------------|
| `mapFranchiseDashboard()` | `franchiseDashboard.mapper.ts` | Transforme la réponse API en format Frontend |
| `mapFranchiseOrdersToTripsList()` | `franchisePortal.mapper.ts` | Transforme les orders en liste de courses |

---

## Recommandations

1. **Dashboard** : Attendre la résolution de l'erreur 500 côté backend sur `/v1/franchise/dashboard`

2. **Filtre service** : 
   - Vérifier avec le backend le nom exact du paramètre (`service` vs `service_type` vs autre)
   - Si le backend ne supporte pas ce filtre, implémenter un filtrage côté client

3. **Tests** : Une fois le backend corrigé, tester :
   - Affichage correct de tous les KPIs
   - Graphique "Flux 7 jours" avec données réelles
   - Tooltip au survol des barres
   - Liste des partenaires récents

---

## Références

- **BACKEND_REQUESTS.md** : Spécifications des données attendues
- **SWAGGER.md** : Documentation API (à vérifier pour les paramètres de filtre)
- **FRANCHISE_TRIPS_SERVICE_FILTER.md** : Détails du problème de filtrage

---

*Document généré automatiquement - Dernière mise à jour : 9 juin 2026*
