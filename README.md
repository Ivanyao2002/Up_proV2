# UpJunoo Pro — Back-office

Next.js App Router · TypeScript · Tailwind · TanStack Query · MSW · Zustand.

## Démarrage

```bash
npm install
npx msw init public/ --save
npm run dev
```

- Choix portail : http://localhost:3000/login
- Admin (mock) : http://localhost:3000/admin/login — `admin@upjunoo.ci` / n’importe quel mot de passe
- Dashboard : http://localhost:3000/admin/dashboard
- Chauffeurs : http://localhost:3000/admin/fleet/drivers
- Zones : http://localhost:3000/admin/network/zones
- Courses : http://localhost:3000/admin/ops/trips
- Carte live : http://localhost:3000/admin/ops/map
- Fiche chauffeur : http://localhost:3000/admin/fleet/drivers/101 (approuvé) · `/103` (KYC en attente)
- File KYC : http://localhost:3000/admin/fleet/kyc
- Détail course : http://localhost:3000/admin/ops/trips/2
- Franchises : http://localhost:3000/admin/network/franchises
- Partenaires : http://localhost:3000/admin/network/partners
- Transactions : http://localhost:3000/admin/finance/transactions
- Retraits : http://localhost:3000/admin/finance/withdrawals
- Détail franchise : http://localhost:3000/admin/network/franchises/1
- Détail partenaire : http://localhost:3000/admin/network/partners/12
- Détail zone : http://localhost:3000/admin/network/zones/1
- Dispatchers : http://localhost:3000/admin/settings/dispatchers
- Règles de dispatch : http://localhost:3000/admin/settings/dispatch-rules
- Nouveau dispatcher : http://localhost:3000/admin/settings/dispatchers/new
- Console dispatch : http://localhost:3000/admin/ops/dispatch
- Rôles : http://localhost:3000/admin/settings/roles
- Tarification : http://localhost:3000/admin/settings/pricing · édition `/admin/settings/pricing/1`
- Clients B2C/B2B : http://localhost:3000/admin/fleet/clients
- Forensic GPS : http://localhost:3000/admin/ops/trips/2/forensic
- Mode crise : http://localhost:3000/admin/ops/crisis
- Wallets : http://localhost:3000/admin/finance/wallets
- Commissions : http://localhost:3000/admin/finance/commissions
- Réconciliation : http://localhost:3000/admin/finance/reconciliation
- Support tickets : http://localhost:3000/admin/support/tickets
- Litige : http://localhost:3000/admin/support/disputes/DSP-501
- Marketing promos : http://localhost:3000/admin/marketing/promos
- Intégrations : http://localhost:3000/admin/settings/integrations
- Audit : http://localhost:3000/admin/settings/audit
- Paramètres généraux : http://localhost:3000/admin/settings/general
- Nouvelle franchise : http://localhost:3000/admin/network/franchises/new
- Nouvelle zone : http://localhost:3000/admin/network/zones/new
- Nouveau partenaire : http://localhost:3000/admin/network/partners/new
- Franchise territoire : http://localhost:3000/franchise/territory
- Franchise modération KYC : http://localhost:3000/franchise/drivers/moderation

### Portail Partenaire

- Login : http://localhost:3000/partner/login — `contact@cocodyexpress.ci` / `demo`
- Dashboard : http://localhost:3000/partner/dashboard
- Chauffeurs : http://localhost:3000/partner/drivers
- Portefeuille : http://localhost:3000/partner/wallet
- Profil : http://localhost:3000/partner/profile
- Véhicules : http://localhost:3000/partner/fleet
- Véhicule (carte grise) : http://localhost:3000/partner/fleet/204 (brouillon) · `/203` (rejeté) · `/202` (en validation)
- Ajouter chauffeur : http://localhost:3000/partner/drivers/new
- Réserver course : http://localhost:3000/partner/bookings/new
- Liste réservations : http://localhost:3000/partner/bookings · détail `/partner/bookings/3` (annulable)
- Shifts : http://localhost:3000/partner/shifts
- Récurrentes : http://localhost:3000/partner/bookings/recurring
- Rapports : http://localhost:3000/partner/reports

### Portail Franchise

- Login : http://localhost:3000/franchise/login — `franchise@abidjansud.ci` / `demo`
- Dashboard : http://localhost:3000/franchise/dashboard
- Sous-partenaires : http://localhost:3000/franchise/partners
- Chauffeurs : http://localhost:3000/franchise/drivers
- Modération KYC : http://localhost:3000/franchise/drivers/moderation
- Finance : http://localhost:3000/franchise/finance
- Promos : http://localhost:3000/franchise/promos
- Support : http://localhost:3000/franchise/support
- Extension territoire : http://localhost:3000/franchise/territory/extension

## Variables d’environnement

Copier `.env.example` → `.env.local` :

- `NEXT_PUBLIC_USE_MOCKS=true` — active MSW
- `NEXT_PUBLIC_API_URL` — base API (utilisée aussi par les handlers MSW `*/api/v2/...`)

## Structure

```text
src/
├── app/           # Routes Next.js
├── core/          # HTTP, auth, config
├── features/      # Domaines métier (auth, ops, …)
├── portals/       # Shells & navigation par portail
├── shared/        # UI, types, utils
└── mocks/         # MSW + JSON fixtures
```

## Docs projet

- `CONTEXTE.md` — état d’avancement (fait / reste à faire)
- `BACKOFFICE_VISION_DESIGN.md` — vision UI / motion
