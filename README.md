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
- Liste réservations : http://localhost:3000/partner/bookings

### Portail Franchise

- Login : http://localhost:3000/franchise/login — `franchise@abidjansud.ci` / `demo`
- Dashboard : http://localhost:3000/franchise/dashboard
- Sous-partenaires : http://localhost:3000/franchise/partners
- Chauffeurs : http://localhost:3000/franchise/drivers
- Modération KYC : http://localhost:3000/franchise/drivers/moderation
- Finance : http://localhost:3000/franchise/finance

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

- `CONTEXTE.md` — état d’avancement (fait / reste à faire, dispatchers P0)
- `REACT_REFONTE_KICKSTART.md` — cahier technique
- `BACKOFFICE_VISION_DESIGN.md` — vision UI / motion
"# Up_proV2" 
