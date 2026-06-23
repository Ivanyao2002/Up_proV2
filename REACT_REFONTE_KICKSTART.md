# UpJunoo Pro — Guide unique de démarrage refonte React

**Document maître** pour lancer le back-office React.  
Tout ce qu’il faut pour débuter : stack, structure, rôles, routes, permissions, mocks, API, design, ordre de build.

**Références détaillées** (ne pas dupliquer ici) :

| Fichier | Contenu |
|---------|---------|
| `FONCTIONNALITES_PAR_UTILISATEUR.md` | Cahier des charges exhaustif (634 lignes) |
| `ROLES_ADMIN_PARTENAIRE_FRANCHISE.md` | Fonctionnalités par rôle (PDF possible) |
| `USERS_ATTRIBUTIONS_FRONTEND.md` | RBAC, driver lifecycle, modules |
| `pages_par_role.json` | Inventaire legacy routes + permissions |
| `PAGES_BACKEND.md` | URLs prod crawlées |
| `ENDPOINTS_FRONTEND.md` | Endpoints legacy + exemples JSON |
| `BACKOFFICE_VISION_DESIGN.md` | UI premium, Mobbin, animations |
| `DESIGN_SYSTEM_UPJUNOO.md` | Tokens couleurs / typo |
| `mockup/` | Maquettes HTML de référence visuelle |

---

## 1. Objectif de la refonte

| Avant (legacy) | Après (cible) |
|----------------|---------------|
| Laravel + Inertia + Vue monolithique | **React SPA** (ou Next.js App Router) + API REST/JSON |
| ~200 pages admin hétérogènes | Modules par **mission** : Ops · Réseau · Flotte · Finance · Support · Config |
| RBAC flou, menus par permission string | **RBAC granulaire** : rôle + permission + **scope** (platform / franchise_id / owner_id) |
| 3 portails visuellement incohérents | **1 design system**, 3 scopes (Admin / Partenaire / Franchise) |

**Périmètre V1 back-office React :** portails web Admin, Partenaire, Franchise (+ auth). Apps mobile Flutter hors scope de ce repo (API partagée).

**Prod actuelle (référence API) :** `https://upjunoo-server-new.junooapps.com`  
**Code legacy :** `dashboard-web` (Laravel + Inertia/Vue).

---

## 2. Stack technique recommandée

```text
React 18+ · TypeScript · Vite
React Router v6 (routes par portail)
TanStack Query v5 (server state)
Zustand (auth, scope, UI prefs) — ou Context léger
React Hook Form + Zod (formulaires)
Tailwind CSS 3+ (tokens = DESIGN_SYSTEM_UPJUNOO.md)
Recharts ou Tremor (graphiques dashboard)
Mapbox GL ou Leaflet (cartes live / zones)
MSW (Mock Service Worker) — dev sans backend
Vitest + Testing Library (tests ciblés)
ESLint + Prettier
```

**Option API :** commencer en **mock MSW**, brancher legacy `/api/v2` progressivement.

---

## 3. Structure projet suggérée

```text
upjunoo-backoffice/
├── public/
├── src/
│   ├── app/                    # Providers, router root, layout shell
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   ├── features/               # 1 dossier = 1 domaine métier
│   │   ├── auth/
│   │   ├── ops/                # dashboard, trips, live-map, crisis
│   │   ├── network/            # franchises, zones, partners
│   │   ├── fleet/              # drivers, kyc, clients
│   │   ├── finance/
│   │   ├── support/
│   │   ├── marketing/
│   │   └── settings/
│   ├── portals/                # Config navigation par scope
│   │   ├── admin/
│   │   ├── partner/
│   │   └── franchise/
│   ├── shared/
│   │   ├── ui/                 # Button, Card, Table, Modal, Pill…
│   │   ├── hooks/
│   │   ├── lib/                # formatMoney, dates, api client
│   │   └── types/
│   ├── mocks/
│   │   ├── handlers/           # MSW
│   │   └── data/               # JSON fixtures
│   └── styles/
│       ├── tokens.css
│       └── motion.css          # copier depuis output/upjunooV2/mockup/css/
├── .env.example
└── package.json
```

---

## 4. Acteurs, rôles et scopes

### 4.1 Hiérarchie

```text
Administrateur (plateforme)
    └── Franchise (territoire)
            └── Partenaire / Owner (flotte)
                    └── Chauffeur (app mobile)
Client (app mobile) — hors back-office
Dispatch — sous-rôle ops (admin ou franchise)
```

### 4.2 Rôles back-office React (V1)

| Rôle `slug` | Portail | Login legacy | Redirect legacy |
|-------------|---------|--------------|-----------------|
| `admin` | `/admin` | `POST /admin-login` · page `/login/admin` | `/dashboard` |
| `partner` | `/partner` | `POST /owner-login` · `/login/owner-login` | `/owner-dashboard` |
| `franchise` | `/franchise` | `POST /franchise-login` · `/login/franchise-login` | `/individual-franchiseowner-dashboard` |
| `dispatch` | `/admin` ou `/franchise` | `POST /dispatch-login` | `/dispatcher/bookride` |

### 4.3 Scope données (filtre API)

| Scope | Champ typique | Voit |
|-------|---------------|------|
| `platform` | — | Tout (admin) |
| `franchise` | `franchise_id` | Territoire + sous-partenaires + chauffeurs zone |
| `owner` | `owner_id` | Sa flotte uniquement |

### 4.4 Matrice capacités (résumé)

| Capacité | Admin | Franchise | Partenaire |
|----------|:-----:|:---------:|:----------:|
| Config globale (tarifs, zones, intégrations) | ✅ | ❌ | ❌ |
| CRUD franchises | ✅ | ❌ | ❌ |
| CRUD zones (polygone) | ✅ | 👁️ | ❌ |
| CRUD partenaires | ✅ | ✅ territoire | ❌ |
| Chauffeurs : approve KYC | ✅ | ✅ | ✅ flotte |
| Online / offline / pause | ✅ | ✅ | ✅ flotte |
| Suspension | ✅ | ✅ | ❌ |
| Ban définitif | ✅ | ❌ (demande) | ❌ (demande) |
| Dispatch manuel | ✅ | ✅ local | ❌ |
| Mode crise zone | ✅ | ✅ local | ❌ |
| Finance globale | ✅ | ✅ locale | ✅ flotte |

Détail : `USERS_ATTRIBUTIONS_FRONTEND.md` § Matrice + Driver Lifecycle.

---

## 5. Permissions (nomenclature refonte)

Préfixe suggéré : `module.action` ou `resource.action.scope`.

```text
# Exemples à implémenter côté front (guard + menu)
ops.dashboard.view
ops.trips.view | ops.trips.edit | ops.trips.cancel | ops.trips.reassign
ops.map.view
ops.crisis.activate

network.franchises.view | .create | .edit
network.zones.view | .edit
network.partners.view

fleet.drivers.view | fleet.drivers.status.online | fleet.drivers.status.bulk
fleet.drivers.suspend | fleet.drivers.ban
fleet.kyc.approve
fleet.clients.view

finance.transactions.view
finance.withdrawals.approve
finance.wallets.view

support.tickets.view
support.disputes.resolve

marketing.promos.manage
settings.roles.manage
settings.pricing.manage
settings.integrations.manage
settings.audit.view
```

**Chargement :** `GET /user/permissions` (legacy) → migrer vers `GET /api/v2/me` avec `{ user, role, permissions[], scope }`.

---

## 6. Routes React — catalogue complet

Convention :  
- **Route** = path React Router  
- **Priorité** : P0 (MVP) · P1 · P2  
- **Mock** = fichier dans `src/mocks/data/`

### 6.1 Auth (commun)

| Route | Page | P | Mock |
|-------|------|---|------|
| `/login` | Choix portail | P0 | — |
| `/admin/login` | Login admin | P0 | `auth-admin.json` |
| `/partner/login` | Login partenaire | P0 | `auth-partner.json` |
| `/franchise/login` | Login franchise | P0 | `auth-franchise.json` |
| `*/forgot-password` | Mot de passe oublié | P1 | — |

### 6.2 Portail Admin (`/admin/*`)

**Layout :** `AdminShell` — sidebar groupes ci-dessous.

#### Opérations

| Route | Page | P | Mock |
|-------|------|---|------|
| `/admin` | Redirect → dashboard | P0 | — |
| `/admin/dashboard` | Tableau de bord | P0 | `dashboard-admin.json` |
| `/admin/ops/map` | Carte live | P0 | `live-map.json` |
| `/admin/ops/trips` | Liste courses | P0 | `trips-list.json` |
| `/admin/ops/trips/:id` | Détail course | P1 | `trip-detail.json` |
| `/admin/ops/trips/:id/forensic` | Replay GPS | P2 | `trip-forensic.json` |
| `/admin/ops/dispatch` | Dispatch manuel | P1 | — |
| `/admin/ops/crisis` | Mode crise (modal/page) | P2 | — |

#### Réseau

| Route | Page | P | Mock |
|-------|------|---|------|
| `/admin/network/franchises` | Liste franchises | P1 | `franchises-list.json` |
| `/admin/network/franchises/new` | Créer franchise | P1 | — |
| `/admin/network/franchises/:id` | Détail franchise (tabs) | P1 | `franchise-detail.json` |
| `/admin/network/zones` | Liste zones | P0 | `zones-list.json` |
| `/admin/network/zones/new` | Créer zone | P1 | — |
| `/admin/network/zones/:id` | Détail / éditeur carte | P1 | `zone-detail.json` |
| `/admin/network/partners` | Liste partenaires | P1 | `partners-list.json` |
| `/admin/network/partners/:id` | Détail partenaire | P1 | `partner-detail.json` |

#### Flotte

| Route | Page | P | Mock |
|-------|------|---|------|
| `/admin/fleet/drivers` | Liste chauffeurs | P0 | `drivers-list.json` |
| `/admin/fleet/drivers/:id` | Fiche chauffeur | P1 | `driver-detail.json` |
| `/admin/fleet/kyc` | File KYC | P1 | `kyc-queue.json` |
| `/admin/fleet/clients` | Clients B2C/B2B | P2 | `clients-list.json` |
| `/admin/fleet/clients/:id` | Détail client | P2 | — |

#### Finance

| Route | Page | P | Mock |
|-------|------|---|------|
| `/admin/finance/transactions` | Transactions | P1 | `transactions.json` |
| `/admin/finance/withdrawals` | File retraits | P1 | `withdrawals.json` |
| `/admin/finance/wallets` | Portefeuilles | P2 | `wallets.json` |
| `/admin/finance/commissions` | Commissions | P2 | — |
| `/admin/finance/reconciliation` | Rapprochement | P2 | — |

#### Support & marketing

| Route | Page | P | Mock |
|-------|------|---|------|
| `/admin/support/tickets` | Tickets | P2 | `tickets.json` |
| `/admin/support/disputes/:id` | Litige détail | P2 | `dispute-detail.json` |
| `/admin/marketing/promos` | Codes promo | P2 | `promos.json` |
| `/admin/marketing/campaigns` | Campagnes | P2 | — |
| `/admin/marketing/banners` | Bannières app | P2 | — |

#### Paramètres

| Route | Page | P | Mock |
|-------|------|---|------|
| `/admin/settings/pricing` | Tarification | P2 | `pricing.json` |
| `/admin/settings/roles` | Rôles & permissions | P1 | `roles.json` |
| `/admin/settings/integrations` | Intégrations | P2 | — |
| `/admin/settings/audit` | Journal audit | P2 | `audit-log.json` |
| `/admin/settings/general` | Général | P2 | — |

### 6.3 Portail Partenaire (`/partner/*`)

| Route | Page | P | Mock |
|-------|------|---|------|
| `/partner/dashboard` | Dashboard flotte | P0 | `dashboard-partner.json` |
| `/partner/fleet` | Liste véhicules | P1 | `fleet-list.json` |
| `/partner/fleet/new` | Ajouter véhicule | P1 | — |
| `/partner/fleet/:id` | Éditer véhicule | P1 | — |
| `/partner/drivers` | Chauffeurs | P0 | `drivers-list-partner.json` |
| `/partner/drivers/:id` | Détail chauffeur | P1 | `driver-detail.json` |
| `/partner/drivers/pending` | En attente | P1 | — |
| `/partner/shifts` | Plannings | P2 | `shifts.json` |
| `/partner/bookings/new` | Réserver course | P1 | — |
| `/partner/bookings/recurring` | Récurrentes | P2 | — |
| `/partner/reports` | Rapports | P2 | — |
| `/partner/wallet` | Portefeuille | P1 | `wallet-partner.json` |
| `/partner/profile` | Profil | P1 | — |

### 6.4 Portail Franchise (`/franchise/*`)

| Route | Page | P | Mock |
|-------|------|---|------|
| `/franchise/dashboard` | Dashboard territoire | P0 | `dashboard-franchise.json` |
| `/franchise/territory` | Carte territoire | P1 | `territory-map.json` |
| `/franchise/partners` | Sous-partenaires | P1 | `sub-partners.json` |
| `/franchise/partners/:id` | Détail | P1 | — |
| `/franchise/drivers` | Chauffeurs zone | P1 | `drivers-list-franchise.json` |
| `/franchise/drivers/moderation` | Modération | P1 | — |
| `/franchise/finance` | Finance locale | P1 | `finance-franchise.json` |
| `/franchise/promos` | Promos locales | P2 | — |
| `/franchise/support` | Tickets zone | P2 | — |
| `/franchise/territory/extension` | Extension territoire | P2 | — |

---

## 7. Navigation sidebar (config)

### Admin

```ts
export const ADMIN_NAV = [
  { group: "OPÉRATIONS", items: [
    { label: "Tableau de bord", path: "/admin/dashboard", icon: "home", permission: "ops.dashboard.view" },
    { label: "Carte live", path: "/admin/ops/map", icon: "map", permission: "ops.map.view" },
    { label: "Courses", path: "/admin/ops/trips", icon: "route", permission: "ops.trips.view" },
  ]},
  { group: "RÉSEAU", items: [
    { label: "Franchises", path: "/admin/network/franchises", permission: "network.franchises.view" },
    { label: "Zones", path: "/admin/network/zones", permission: "network.zones.view" },
    { label: "Partenaires", path: "/admin/network/partners", permission: "network.partners.view" },
  ]},
  { group: "FLOTTE", items: [
    { label: "Chauffeurs", path: "/admin/fleet/drivers", permission: "fleet.drivers.view" },
    { label: "File KYC", path: "/admin/fleet/kyc", permission: "fleet.kyc.approve" },
    { label: "Clients", path: "/admin/fleet/clients", permission: "fleet.clients.view" },
  ]},
  { group: "FINANCE", items: [
    { label: "Transactions", path: "/admin/finance/transactions", permission: "finance.transactions.view" },
    { label: "Retraits", path: "/admin/finance/withdrawals", permission: "finance.withdrawals.approve" },
  ]},
  // … Support, Marketing, Paramètres
];
```

Partenaire et Franchise : voir `mockup/partenaire-dashboard.html` et `franchise-dashboard.html` pour items.

---

## 8. Design system (implémentation React)

Copier les tokens depuis `mockup/css/tokens.css` et `motion.css` → Tailwind `theme.extend` :

```js
// tailwind.config.js (extrait)
colors: {
  navy: { DEFAULT: "#405189", dark: "#364574", hero: "#2f3d66" },
  teal: { DEFAULT: "#0ab39c", dark: "#099885" },
  canvas: "#f3f3f9",
},
fontFamily: { sans: ["Poppins", "system-ui", "sans-serif"] },
borderRadius: { card: "14px", hero: "20px" },
boxShadow: {
  card: "0 1px 2px rgba(33,37,41,0.04), 0 8px 24px rgba(64,81,137,0.06)",
},
```

**Composants shared/ui à créer en premier :**

`AppShell`, `Sidebar`, `Topbar`, `HeroKpi`, `KpiCard`, `DataTable`, `StatusPill`, `Button`, `Input`, `SearchBar`, `DateRangeChip`, `BulkActionBar`, `EmptyState`, `PageHeader`, `Tabs`, `Drawer`, `ConfirmModal`.

**Vision UI :** `BACKOFFICE_VISION_DESIGN.md` — niveau Linear / Stripe, pas template admin.

---

## 9. Données mockées (MSW)

### 9.1 Activer MSW

```bash
npm i -D msw
npx msw init public/
```

`src/mocks/browser.ts` — enregistrer handlers.  
`VITE_USE_MOCKS=true` dans `.env.development`.

### 9.2 Types TypeScript communs

```ts
// src/shared/types/index.ts

export type Scope = "platform" | "franchise" | "owner";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "partner" | "franchise" | "dispatch";
  scope: Scope;
  franchise_id?: number;
  owner_id?: number;
  permissions: string[];
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; per_page: number; current_page: number; last_page: number };
}

export type TripStatus =
  | "requested" | "matching" | "assigned" | "arrived"
  | "in_progress" | "completed" | "cancelled";

export interface Trip {
  id: string;
  ref: string;
  service: "taxi" | "delivery" | "rental" | "freight";
  from_label: string;
  to_label: string;
  client_name: string;
  driver_name?: string;
  amount_fcfa: number;
  status: TripStatus;
  payment_method: "cash" | "wallet" | "card" | "orange_money";
  created_at: string;
}

export interface Driver {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  rating: number;
  zone: string;
  owner_name?: string;
  vehicle_label?: string;
  account_status: "pending" | "approved" | "suspended" | "banned";
  availability: "offline" | "online" | "on_trip" | "paused";
  franchise_id?: number;
  owner_id?: number;
}

export interface Zone {
  id: number;
  name: string;
  city: string;
  franchise_name: string;
  type: "standard" | "surge" | "airport";
  drivers_active: number;
  polygon_geojson?: GeoJSON.Polygon;
}

export interface DashboardAdminKpi {
  net_profit_today_fcfa: number;
  net_profit_trend_pct: number;
  trips_completed_today: number;
  trips_cancelled_today: number;
  drivers_approved: number;
  drivers_pending_kyc: number;
  users_registered: number;
  chart_flux: { day: string; revenue: number; commission: number }[];
  recent_trips: Trip[];
  active_zone: { name: string; trips_24h: number; drivers_online: number };
}
```

### 9.3 Exemple `mocks/data/dashboard-admin.json`

```json
{
  "net_profit_today_fcfa": 1245800,
  "net_profit_trend_pct": 12.4,
  "trips_completed_today": 847,
  "trips_cancelled_today": 42,
  "drivers_approved": 9252,
  "drivers_pending_kyc": 8,
  "users_registered": 14700,
  "chart_flux": [
    { "day": "Lun", "revenue": 820000, "commission": 310000 },
    { "day": "Mar", "revenue": 650000, "commission": 240000 },
    { "day": "Mer", "revenue": 1100000, "commission": 420000 },
    { "day": "Jeu", "revenue": 780000, "commission": 290000 },
    { "day": "Ven", "revenue": 1350000, "commission": 510000 },
    { "day": "Sam", "revenue": 980000, "commission": 370000 },
    { "day": "Dim", "revenue": 1245800, "commission": 468000 }
  ],
  "recent_trips": [
    {
      "id": "1",
      "ref": "TR-88421",
      "service": "taxi",
      "from_label": "Abidjan, Cocody",
      "to_label": "Cocody, Riviera",
      "client_name": "Aya Koné",
      "driver_name": "Kouassi Jean",
      "amount_fcfa": 4500,
      "status": "completed",
      "payment_method": "wallet",
      "created_at": "2026-06-02T14:32:00Z"
    },
    {
      "id": "2",
      "ref": "TR-88419",
      "service": "delivery",
      "from_label": "Plateau, Immeuble SCIAM",
      "to_label": "Plateau, Zone 4",
      "client_name": "Société BTP CI",
      "driver_name": "Traoré Aminata",
      "amount_fcfa": 2800,
      "status": "in_progress",
      "payment_method": "cash",
      "created_at": "2026-06-02T14:20:00Z"
    }
  ],
  "active_zone": {
    "name": "Cocody — Plateau",
    "trips_24h": 127,
    "drivers_online": 342
  }
}
```

### 9.4 Exemple `mocks/data/drivers-list.json`

```json
{
  "data": [
    {
      "id": 101,
      "first_name": "Kouassi",
      "last_name": "Jean",
      "phone": "+225 07 12 34 56 78",
      "rating": 4.82,
      "zone": "Cocody",
      "owner_name": "Cocody Express",
      "vehicle_label": "Toyota Corolla · AB-452-CI",
      "account_status": "approved",
      "availability": "online"
    },
    {
      "id": 102,
      "first_name": "Traoré",
      "last_name": "Aminata",
      "phone": "+225 05 98 76 54 32",
      "rating": 4.91,
      "zone": "Yopougon",
      "owner_name": "Cocody Express",
      "vehicle_label": "Suzuki Dzire · YK-881-CI",
      "account_status": "approved",
      "availability": "online"
    },
    {
      "id": 103,
      "first_name": "Diabaté",
      "last_name": "Moussa",
      "phone": "+225 01 44 22 11 00",
      "rating": 0,
      "zone": "Plateau",
      "owner_name": "Cocody Express",
      "vehicle_label": null,
      "account_status": "pending",
      "availability": "offline"
    }
  ],
  "meta": { "total": 9252, "per_page": 25, "current_page": 1, "last_page": 371 }
}
```

### 9.5 Exemple `mocks/data/zones-list.json`

```json
{
  "data": [
    {
      "id": 1,
      "name": "Cocody — Plateau",
      "city": "Abidjan",
      "franchise_name": "Abidjan Sud",
      "type": "standard",
      "drivers_active": 342
    },
    {
      "id": 2,
      "name": "Yopougon centre",
      "city": "Abidjan",
      "franchise_name": "Abidjan Ouest",
      "type": "surge",
      "drivers_active": 218
    },
    {
      "id": 3,
      "name": "Aéroport Félix Houphouët",
      "city": "Abidjan",
      "franchise_name": "Abidjan Sud",
      "type": "airport",
      "drivers_active": 89
    }
  ],
  "meta": { "total": 24, "per_page": 25, "current_page": 1, "last_page": 1 }
}
```

### 9.6 Handler MSW exemple

```ts
// src/mocks/handlers/dashboard.ts
import { http, HttpResponse } from "msw";
import adminDashboard from "../data/dashboard-admin.json";

export const dashboardHandlers = [
  http.get("/api/v2/admin/dashboard", () => HttpResponse.json(adminDashboard)),
  http.get("/api/v2/admin/drivers", ({ request }) => {
    // pagination query params…
    return HttpResponse.json(driversList);
  }),
];
```

### 9.7 Liste fichiers mock à créer

| Fichier | Usage |
|---------|--------|
| `auth-admin.json` | Session admin mock |
| `auth-partner.json` | Session partenaire |
| `auth-franchise.json` | Session franchise |
| `dashboard-admin.json` | Dashboard admin |
| `dashboard-partner.json` | Dashboard partenaire |
| `dashboard-franchise.json` | Dashboard franchise |
| `trips-list.json` | Liste courses |
| `trip-detail.json` | Détail + timeline |
| `drivers-list.json` | Chauffeurs admin |
| `driver-detail.json` | Fiche + KYC docs |
| `zones-list.json` | Zones |
| `zone-detail.json` | Zone + polygon |
| `franchises-list.json` | Franchises |
| `franchise-detail.json` | Détail franchise |
| `partners-list.json` | Partenaires |
| `kyc-queue.json` | File validation |
| `withdrawals.json` | Retraits |
| `roles.json` | Matrice RBAC |

---

## 10. API — mapping legacy → cible

### 10.1 Auth

| Action | Legacy | Cible v2 |
|--------|--------|----------|
| Login admin | `POST /admin-login` | `POST /api/v2/auth/login` body `{ portal: "admin", email, password }` |
| Login partner | `POST /owner-login` | `portal: "partner"` |
| Login franchise | `POST /franchise-login` | `portal: "franchise"` |
| Me + permissions | `GET /user/permissions` | `GET /api/v2/me` |
| Logout | `POST /logout` | `POST /api/v2/auth/logout` |

### 10.2 Dashboard

| Legacy | Cible |
|--------|-------|
| `GET /dashboard/data` | `GET /api/v2/admin/dashboard` |
| `GET /dashboard/today-earnings` | inclus dans dashboard ou `GET /api/v2/admin/dashboard/earnings` |
| `GET /owner-dashboard/data` | `GET /api/v2/partner/dashboard` |
| `GET /owner-dashboard/earnings` | idem |

### 10.3 Flotte

| Legacy | Cible |
|--------|-------|
| `GET /fleet-drivers/list` | `GET /api/v2/drivers?scope=&filters` |
| `POST /users/update-status` | `POST /api/v2/drivers/status/*` |

Voir `ENDPOINTS_FRONTEND.md` pour le reste.

### 10.4 Client HTTP

```ts
// src/shared/lib/api.ts
const baseURL = import.meta.env.VITE_API_URL ?? "https://upjunoo-server-new.junooapps.com";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("upjunoo_token");
  const res = await fetch(`${baseURL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    credentials: "include", // legacy session cookie si besoin
  });
  if (!res.ok) throw new ApiError(res.status, await res.json());
  return res.json();
}
```

---

## 11. Auth & guards React

```tsx
// Pseudo-code router
<Route element={<AuthGuard portal="admin" />}>
  <Route element={<AdminShell />}>
    <Route path="/admin/dashboard" element={<DashboardPage />} />
    {/* … */}
  </Route>
</Route>
```

- `AuthGuard` : redirect `/admin/login` si pas de session  
- `PermissionGuard permission="fleet.drivers.view"` : cache route ou 403  
- `useScope()` : injecte `franchise_id` / `owner_id` dans les query keys TanStack Query  

---

## 12. Formatage métier (Côte d’Ivoire)

```ts
// src/shared/lib/format.ts
export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-CI", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount) + " FCFA";
}

export function formatPhoneCI(phone: string): string {
  return phone; // normaliser +225
}
```

---

## 13. Plan de démarrage — 4 sprints

### Sprint 0 — Setup (3–5 j)

- [ ] `npm create vite@latest upjunoo-backoffice -- --template react-ts`
- [ ] Tailwind + tokens + Poppins
- [ ] Router + layouts vides Admin / Partner / Franchise
- [ ] MSW + `dashboard-admin.json` + `drivers-list.json`
- [ ] Copier composants shell depuis `mockup/` (HTML → React)

### Sprint 1 — P0 Admin (2 sem)

- [ ] Login admin + auth store
- [ ] `AdminShell` + navigation
- [ ] Page Dashboard (hero, chart, table activité)
- [ ] Page Drivers list + bulk bar UI
- [ ] Page Zones list

### Sprint 2 — P0 Partner + Franchise (1–2 sem)

- [ ] Logins + dashboards scoped
- [ ] Partner drivers list (filtre owner_id mock)

### Sprint 3 — P1 détails (2 sem)

- [ ] Trip detail, Driver detail, Zone detail (map)
- [ ] KYC queue, Roles matrix

### Sprint 4 — API réelle

- [ ] Remplacer MSW par legacy endpoints progressivement
- [ ] WebSocket / polling carte live

---

## 14. Variables d’environnement

```env
# .env.example
VITE_API_URL=https://upjunoo-server-new.junooapps.com
VITE_USE_MOCKS=true
VITE_MAPBOX_TOKEN=
VITE_APP_NAME=UpJunoo Pro
```

---

## 15. Commandes pour débuter aujourd’hui

```bash
cd C:\Users\c.romaric\Desktop\scraping
mkdir upjunoo-backoffice
cd upjunoo-backoffice
npm create vite@latest . -- --template react-ts
npm i react-router-dom @tanstack/react-query zustand zod react-hook-form
npm i -D tailwindcss postcss autoprefixer msw
npx tailwindcss init -p

# Copier tokens
# cp ../output/upjunooV2/mockup/css/tokens.css src/styles/
# cp ../output/upjunooV2/mockup/css/motion.css src/styles/

mkdir -p src/{app,features,portals,shared/ui,mocks/data}
```

**Premier écran à coder :** `/admin/dashboard` en s’alignant sur `mockup/admin-dashboard.html`.

---

## 16. Checklist avant merge feature

- [ ] Textes UI en **français**
- [ ] Montants en **FCFA** formatés
- [ ] Permission guard sur la route
- [ ] Scope respecté (pas de données hors franchise/owner)
- [ ] Loading skeleton + empty state
- [ ] Responsive min 1280px (desktop ops)
- [ ] `prefers-reduced-motion` respecté

---

## 17. Résumé inventaire pages

| Portail | Routes V1 | P0 | P1 | P2 |
|---------|-----------|----|----|-----|
| Admin | ~35 | 6 | 12 | 17 |
| Partenaire | ~14 | 3 | 6 | 5 |
| Franchise | ~10 | 1 | 5 | 4 |
| Auth | 4 | 4 | — | — |
| **Total** | **~63** | **14** | **23** | **26** |

*(Mobile client/chauffeur = projet Flutter séparé — voir `FONCTIONNALITES_PAR_UTILISATEUR.md`)*

---

*Document généré pour démarrer la refonte React UpJunoo Pro — juin 2026.*
