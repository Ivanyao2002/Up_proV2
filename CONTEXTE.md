# UpJunoo Pro — Contexte projet

> Document de référence pour l’état d’avancement du back-office React/Next.js.  
> Dernière mise à jour : juin 2026.

---

## 1. Vision produit

**UpJunoo Pro** est le back-office multi-portails pour la mobilité à Abidjan (Côte d’Ivoire).

| Portail | Rôle | Périmètre |
|---------|------|-----------|
| **Admin** | Plateforme UpJunoo | Ops, réseau, flotte, finance, **paramétrage** (dispatchers, règles, rôles, tarifs) |
| **Partenaire** | Owner / flotte locale | Véhicules, chauffeurs, réservations manuelles, portefeuille |
| **Franchise** | Territoire | Sous-partenaires, modération KYC locale, finance territoire |

**Charte UI** : navy / teal, interface épurée premium — pas de clone Bootstrap admin générique.  
**Données locales** : format FCFA (`1 245 800 FCFA`), noms et lieux ivoiriens (Cocody, Yopougon, Plateau…).

---

## 2. Stack & conventions

| Élément | Valeur |
|---------|--------|
| Framework | **Next.js 15** App Router (note : spec initiale mentionnait Vite — le repo est Next.js) |
| Langage | TypeScript |
| Styles | Tailwind CSS |
| Data fetching | TanStack Query |
| État global | Zustand (`authStore`) |
| Mocks dev | MSW — `NEXT_PUBLIC_USE_MOCKS=true` |
| API | `*/api/v2/...` via `apiClient` / `fetchClient` |
| RBAC | Guard route + menu filtré par permissions |
| Scope API | `platform` \| `franchise_id` \| `owner_id` injecté dans les queries |

### Logins mock

| Portail | Email | Mot de passe | URL |
|---------|-------|--------------|-----|
| Admin | `admin@upjunoo.ci` | `demo` | `/admin/login` |
| Partenaire | `contact@cocodyexpress.ci` | `demo` | `/partner/login` |
| Franchise | `franchise@abidjansud.ci` | `demo` | `/franchise/login` |

### Structure repo

```text
src/
├── app/           # Routes Next.js (App Router)
├── core/          # HTTP, auth, config
├── features/      # Domaines métier (auth, ops, partner, …)
├── portals/       # Shells & navigation par portail
├── shared/        # UI, types, utils
└── mocks/         # MSW handlers + fixtures JSON
```

### Docs complémentaires

- `REACT_REFONTE_KICKSTART.md` — cahier technique routes & priorités
- `BACKOFFICE_VISION_DESIGN.md` — vision UI / motion
- `README.md` — démarrage rapide & URLs de test

---

## 3. Priorités d’implémentation

### P0 — Critique ✅ livré

| Route | Description |
|-------|-------------|
| `/admin/settings/dispatchers` | ✅ Liste + fiche comptes dispatchers |
| `/admin/settings/dispatch-rules` | ✅ Règles de dispatch (matching, timeout, priorités) |

### P1 — Important ✅ (juin 2026)

| Route | Description |
|-------|-------------|
| `/admin/settings/roles` | ✅ Rôles & permissions (liste + détail) |
| `/admin/settings/pricing` | ✅ Tarification (liste) |
| `/admin/network/zones` | ✅ Déjà fait (liste + détail) |
| `/admin/ops/dispatch` | ✅ Console dispatch manuel (assigner course) |

### P2 — Backlog

Intégrations, audit, marketing, forensic GPS, mode crise, clients B2C/B2B, promos franchise, etc.

---

## 4. Ce qui est déjà fait

### 4.1 Infrastructure transverse

- [x] Auth 3 portails (`/login`, admin / partner / franchise login)
- [x] `AuthGuard`, cookie `upjunoo_auth`, `middleware.ts`
- [x] `apiClient`, `fetchClient`, `notificationService`
- [x] MSW : handlers `auth`, `dashboard`, `ops`, `fleet`, `network`, `finance`, `partner`, `franchise`
- [x] Shells portails : `AdminShell`, `PartnerShell`, `FranchiseShell`, `PortalSidebar`
- [x] Design system : `Button`, `PageHeader`, `KpiCard`, `StatusPill`, `Timeline`, `Tabs`, `ConfirmModal`, `EmptyState`, pills métier…
- [x] **`DataTable`** : pagination client (10/25/50/100), hauteur fixe + scroll, en-tête sticky
- [x] **Export CSV + Excel** (`tableExport.ts`, dépendance `xlsx`) — exporte toutes les lignes filtrées
- [x] Types métier principaux : `User`, `Trip`, `Driver`, `Zone`, `Paginated<T>`, etc.
- [x] Helpers labels export : `tripLabels`, `driverLabels`, `vehicleLabels`

### 4.2 Portail Admin

| Route | Statut | Mock / notes |
|-------|--------|--------------|
| `/admin/dashboard` | ✅ | `dashboard-admin.json` |
| `/admin/ops/map` | ✅ | `live-map.json` |
| `/admin/ops/trips` | ✅ | `trips-list.json` |
| `/admin/ops/trips/[id]` | ✅ | `trip-detail.json` — timeline, route |
| `/admin/network/franchises` | ✅ | `franchises-list.json` |
| `/admin/network/franchises/[id]` | ✅ | `franchise-detail.json` |
| `/admin/network/zones` | ✅ | `zones-list.json` |
| `/admin/network/zones/new` | ✅ | Création + tracé polygone sur carte |
| `/admin/network/zones/[id]` | ✅ | Détail + édition polygone sur carte |
| `/admin/network/partners` | ✅ | `partners-list.json` |
| `/admin/network/partners/[id]` | ✅ | `partner-detail.json` |
| `/admin/fleet/drivers` | ✅ | `drivers-list.json` |
| `/admin/fleet/drivers/[id]` | ✅ | `driver-detail.json` — KYC approve/reject mock |
| `/admin/fleet/kyc` | ✅ | `kyc-queue.json` |
| `/admin/finance/transactions` | ✅ | `transactions.json` |
| `/admin/finance/withdrawals` | ✅ | `withdrawals.json` — approve/reject mock |
| `/admin/finance/wallets` | ✅ | Portefeuilles plateforme (chauffeurs, partenaires, franchises) |
| `/admin/support/tickets` | ✅ | Tickets support admin |

**Navigation admin** (`src/portals/admin/adminNav.ts`) : OPÉRATIONS · RÉSEAU · FLOTTE · FINANCE · **PARAMÈTRES** (dispatchers, règles de dispatch).

### 4.3 Portail Partenaire

| Route | Statut | Notes |
|-------|--------|-------|
| `/partner/dashboard` | ✅ | |
| `/partner/fleet` | ✅ | Liste véhicules |
| `/partner/fleet/pending` | ✅ | En attente validation |
| `/partner/fleet/new` | ✅ | Création véhicule + pièces jointes optionnelles + chauffeur optionnel + docs KYC |
| `/partner/fleet/[id]` | ✅ | Détail + upload carte grise |
| `/partner/drivers` | ✅ | |
| `/partner/drivers/pending` | ✅ | |
| `/partner/drivers/new` | ✅ | Création chauffeur standalone |
| `/partner/drivers/[id]` | ✅ | Détail + upload KYC |
| `/partner/bookings` | ✅ | Liste réservations |
| `/partner/bookings/new` | ✅ | Carte GPS départ + recherche/pin arrivée (`BookingLocationPicker`) |
| `/partner/bookings/[id]` | ✅ | Détail + timeline mock |
| `/partner/bookings/recurring` | ✅ | Réservations récurrentes (mock) |
| `/partner/shifts` | ✅ | Planning shifts chauffeurs (mock) |
| `/partner/reports` | ✅ | Rapports mensuels (mock) |
| `/partner/wallet` | ✅ | Retrait wallet mock (`POST /partner/wallet/withdraw`) |
| `/partner/profile` | ✅ | |

**Fichiers clés partenaire** :
- `PartnerVehicleCreatePage.tsx`, `VehicleCreatePiecesSection`, `VehicleCreateDriverSection`, `VehicleCreateDriverDocumentsSection`
- `PartnerBookingsNewPage.tsx`, `BookingLocationPicker.tsx`, `abidjanPlaces.ts`, `mapProjection.ts`
- `src/mocks/handlers/partner.handlers.ts`

**Sidebar** : correction double sélection « Réservations » / « Nouvelle réservation » (match exact par path).

### 4.4 Portail Franchise

| Route | Statut | Notes |
|-------|--------|-------|
| `/franchise/dashboard` | ✅ | |
| `/franchise/partners` | ✅ | Sous-partenaires |
| `/franchise/partners/[id]` | ✅ | |
| `/franchise/drivers` | ✅ | |
| `/franchise/drivers/moderation` | ✅ | Review UI — actions approve/reject partielles |
| `/franchise/drivers/[id]` | ✅ | |
| `/franchise/finance` | ✅ | |
| `/franchise/territory` | ✅ | Carte territoire |
| `/franchise/promos` | ✅ | Codes promo territoire (mock) |
| `/franchise/support` | ✅ | Tickets support partenaires (mock) |

Mocks : `auth-franchise.json`, `dashboard-franchise.json`, `sub-partners-franchise.json`, `drivers-list-franchise.json`, `finance-franchise.json`, `franchise-promos.json`, `franchise-support-tickets.json`.

---

## 5. Ce qui reste à faire

### 5.1 P0 — Configuration dispatchers ✅ (juin 2026)

| Livrable | Statut |
|----------|--------|
| Types `DispatcherAccount`, `DispatchRules` | ✅ `src/shared/types/index.ts` |
| Mocks `dispatchers-list.json`, `dispatch-rules.json` | ✅ `src/mocks/data/` |
| Handlers MSW `/api/v2/admin/dispatchers` | ✅ `settings.handlers.ts` |
| Handlers MSW `/api/v2/admin/settings/dispatch-rules` | ✅ |
| Routes Next.js settings | ✅ `/admin/settings/dispatchers`, `…/new`, `…/[id]`, `…/dispatch-rules` |
| Nav admin section PARAMÈTRES | ✅ |
| Pages + formulaires + validations | ✅ `src/features/settings/` |

#### Spec écrans P0

| Écran | Route | Champs / comportement |
|-------|-------|----------------------|
| **Liste dispatchers** | `/admin/settings/dispatchers` | Nom, email, téléphone, franchise/zone, statut (actif/suspendu), dernière connexion, actions (voir / éditer / suspendre) |
| **Fiche dispatcher** | `/admin/settings/dispatchers/new` · `/[id]` | Identité, credentials (création), zones autorisées (multi-select), horaires/shift, permissions dispatch, statut |
| **Règles de dispatch** | `/admin/settings/dispatch-rules` | Rayon matching (km), timeout assignation, priorité (proximité / rating / charge), zones actives, surge lié aux zones, file d’attente max |

**Validations** : email unique, au moins 1 zone, règles numériques > 0.

#### Structure React proposée

```text
src/features/settings/
├── api/
│   ├── dispatchers.service.ts
│   ├── dispatchers.queries.ts
│   ├── dispatchRules.service.ts
│   └── dispatchRules.queries.ts
├── pages/
│   ├── DispatchersListPage.tsx
│   ├── DispatcherDetailPage.tsx
│   └── DispatchRulesPage.tsx
└── components/
    ├── DispatcherForm.tsx
    └── DispatchRulesForm.tsx

src/app/(admin)/admin/settings/
├── dispatchers/page.tsx
├── dispatchers/new/page.tsx
├── dispatchers/[id]/page.tsx
└── dispatch-rules/page.tsx
```

#### Types TypeScript à créer

```typescript
interface DispatcherAccount {
  id: number;
  name: string;
  email: string;
  phone: string;
  franchise_id?: number;
  zone_ids: number[];
  status: "active" | "suspended";
  last_login_at?: string;
}

interface DispatchRules {
  match_radius_km: number;
  assign_timeout_sec: number;
  max_queue_size: number;
  priority_mode: "distance" | "rating" | "balanced";
  auto_reassign: boolean;
  updated_at: string;
}
```

#### Navigation admin à ajouter

```text
PARAMÈTRES
  ├── Dispatchers          → /admin/settings/dispatchers      (permission: settings.dispatchers.view)
  ├── Règles de dispatch   → /admin/settings/dispatch-rules   (permission: settings.dispatch_rules.view)
  └── (P1) Rôles, Tarifs…
```

#### Permissions RBAC suggérées

- `settings.dispatchers.view`
- `settings.dispatchers.create`
- `settings.dispatchers.edit`
- `settings.dispatch_rules.view`
- `settings.dispatch_rules.edit`

---

### 5.2 P1 — Admin restant

| Route | Statut | Notes |
|-------|--------|-------|
| `/admin/ops/dispatch` | ✅ | File d'attente, candidats, carte, assignation mock |
| `/admin/settings/roles` | ✅ | Liste + détail + création + édition permissions (mock) |
| `/admin/settings/pricing` | ✅ | Grilles par zone/service + création (mock) |
| `/admin/network/franchises/new` | ✅ | Formulaire création + mock POST |
| `/admin/network/zones/new` | ✅ | Formulaire création + mock POST |
| `/admin/network/partners/new` | ✅ | Formulaire création + mock POST |
| `*/forgot-password` | ✅ | Admin, partenaire, franchise |
| `/admin/ops/trips/[id]` réassignation | ✅ | Modal + candidats online (mock) |
| `/admin/fleet/drivers/[id]` suspension | ✅ | Suspendre / réactiver (mock) |

**Exclu volontairement** : branchement API Laravel (MSW reste actif).

---

### 5.3 P2 — Backlog admin ✅ (juin 2026)

| Domaine | Routes | Statut |
|---------|--------|--------|
| Ops | `/admin/ops/trips/[id]/forensic`, `/admin/ops/crisis` | ✅ |
| Finance | `/admin/finance/wallets`, `…/commissions`, `…/reconciliation` | ✅ |
| Flotte | `/admin/fleet/clients`, `/admin/fleet/clients/[id]` | ✅ |
| Support | `/admin/support/tickets`, `/admin/support/disputes/[id]` | ✅ |
| Marketing | `/admin/marketing/promos`, `…/campaigns`, `…/banners` | ✅ |
| Settings | `/admin/settings/integrations`, `…/audit`, `…/general` | ✅ |

---

### 5.4 Portail Partenaire — reste

| Route | Priorité | Statut |
|-------|----------|--------|
| `/partner/shifts` | P2 | ✅ |
| `/partner/bookings/recurring` | P2 | ✅ |
| `/partner/reports` | P2 | ✅ |
| Retrait wallet (action) | P1 | ✅ |
| Branchement API Laravel | — | ❌ Exclu (MSW actif) |

---

### 5.5 Portail Franchise — reste

| Route | Priorité | Statut |
|-------|----------|--------|
| `/franchise/territory` | P1 | ✅ Carte territoire (polygones zones) |
| `/franchise/promos` | P2 | ✅ |
| `/franchise/support` | P2 | ✅ |
| `/franchise/territory/extension` | ✅ | Demande extension territoire (carte + tracé mock) |
| Actions KYC approve/reject | P1 | ✅ File + fiche + documents (mock) |

---

### 5.6 Technique / dette

| Sujet | Statut |
|-------|--------|
| Branchement API Laravel réelle | ❌ **Reporté** — MSW actif en dev |
| Pagination serveur DataTable | ✅ Toutes les listes DataTable (admin, partenaire, franchise) |
| Filtres listes (recherche + statuts) | ✅ `TableFiltersBar`, `SelectFilter`, `FilterChips` + query MSW |
| `useScope()` dans query keys | ✅ `scopeQueryKey` + headers `X-Scope` / `X-Franchise-Id` / `X-Owner-Id` |
| Portail dispatch (`role: dispatch`) | ✅ `/dispatch/login`, console, réserver, carte live |
| Tests automatisés | ❌ Non configurés (vitest/jest) |
| Build Next intermittent (`_document`) | `tsc --noEmit` OK |

---

## 6. Wireframes textuels P0 — Dispatchers

### 6.1 Liste dispatchers

```
┌─────────────────────────────────────────────────────────────┐
│  Dispatchers                              [+ Nouveau]       │
├─────────────────────────────────────────────────────────────┤
│  🔍 Rechercher…    [Zone ▼]  [Statut ▼]                     │
├─────────────────────────────────────────────────────────────┤
│  Nom          Email              Zones        Statut  Conn. │
│  ─────────────────────────────────────────────────────────  │
│  Aya Koné     aya@…              Cocody       ● Actif  2h   │
│  Jean Traoré  jean@…             Yopougon     ○ Suspendu —  │
├─────────────────────────────────────────────────────────────┤
│  Pagination · Export CSV / Excel                            │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Fiche dispatcher

```
┌─────────────────────────────────────────────────────────────┐
│  ← Retour    Dispatcher · Aya Koné              [Suspendre] │
├──────────────────────────┬──────────────────────────────────┤
│  Identité                │  Zones autorisées                │
│  Nom, email, téléphone   │  ☑ Cocody  ☑ Plateau  ☐ Yop.   │
│  Mot de passe (création) │                                  │
│                          │  Permissions                     │
│  Statut : Actif          │  ☑ Assigner courses              │
│  Franchise : Abidjan Sud │  ☑ Voir carte live               │
├──────────────────────────┴──────────────────────────────────┤
│                              [Annuler]  [Enregistrer]       │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Règles de dispatch

```
┌─────────────────────────────────────────────────────────────┐
│  Règles de dispatch                                         │
├─────────────────────────────────────────────────────────────┤
│  Rayon de matching        [ 3 ] km                          │
│  Timeout assignation      [ 45 ] sec                        │
│  Taille max file d’attente [ 12 ]                           │
│  Mode priorité            ( ) Distance  (•) Équilibré  ( ) Note │
│  Réassignation auto       [✓]                               │
├─────────────────────────────────────────────────────────────┤
│  Dernière modification : 12 mai 2026, 14:32                 │
│                              [Enregistrer]                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Fichiers clés pour la suite

```
src/shared/ui/DataTable.tsx
src/shared/lib/tableExport.ts
src/portals/admin/adminNav.ts          ← à étendre (PARAMÈTRES)
src/features/partner/pages/PartnerVehicleCreatePage.tsx
src/features/partner/components/BookingLocationPicker.tsx
src/features/partner/pages/PartnerBookingsListPage.tsx
src/features/partner/pages/PartnerBookingDetailPage.tsx
src/features/partner/api/vehicles.service.ts
src/mocks/handlers/partner.handlers.ts
src/mocks/handlers/franchise.handlers.ts
src/mocks/handlers/index.ts            ← enregistrer settings.handlers.ts
```

---

## 8. Ordre de travail recommandé

1. **Branchement API Laravel** — remplacer MSW écran par écran (reporté)
2. **Étendre pagination serveur** — courses, transactions, autres listes volumineuses
3. **Tests** — vitest + tests critiques (auth, pagination, dispatch)
4. **Stabiliser build Next** — si erreur `_document` réapparaît

---

## 9. Synthèse

| Zone | Avancement |
|------|------------|
| Infrastructure | ✅ Solide |
| Admin ops / réseau / flotte / finance | ✅ MVP mock |
| Partenaire | ✅ Quasi complet P0/P1/P2 |
| Franchise | ✅ Socle P0/P1/P2 |
| Admin settings / dispatchers | ✅ P0 livré (mock) |
| Admin ops dispatch manuel | ✅ P1 |
| Admin settings rôles & tarifs | ✅ CRUD mock (création + édition) |
| P2 admin (audit, marketing, intégrations…) | ✅ |
| Actions métier mock (Phase A) | ✅ Juin 2026 |
| Branchement API Laravel | ❌ Exclu volontairement |

**En une phrase** : Back-office mock quasi complet (dont portail dispatch) ; prochain chantier : **API Laravel** (reporté), pagination serveur sur les autres listes, tests.
