# Déploiement Vercel — UpJunoo Pro (back-office)

Guide de déploiement du front Next.js sur Vercel, avec vérification Swagger/API avant mise en prod.

## URLs

| Environnement | URL |
|---------------|-----|
| API (Swagger live) | https://api.upjunoo-dev.tech/docs |
| OpenAPI JSON | https://api.upjunoo-dev.tech/docs/json |
| Front (Vercel) | À configurer après 1er `vercel link` |

## Prérequis

```bash
npm install
```

**Windows PowerShell** : utiliser `npm.cmd` / `npx.cmd` (ExecutionPolicy bloque `npm.ps1` / `npx.ps1`).

```powershell
npm.cmd run vercel:login    # connexion (ouvre le navigateur)
npm.cmd run vercel:link     # lier le projet — une fois
npm.cmd run deploy:vercel   # déploiement prod
```

Équivalent sans scripts npm :

```powershell
npx.cmd vercel login
npx.cmd vercel link
```

## Variables d'environnement Vercel

Copier depuis `.env.example` dans **Project → Settings → Environment Variables** :

| Variable | Production | Notes |
|----------|------------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.upjunoo-dev.tech` | Base API v1 |
| `NEXT_PUBLIC_USE_MOCKS` | `false` | MSW désactivé en prod |
| `NEXT_PUBLIC_USE_REAL_AUTH` | `true` | Login Supabase réel |
| `NEXT_PUBLIC_APP_NAME` | `UpJunoo Pro` | |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | `pk.eyJ…` | Carte live (optionnel) |

Ne **jamais** committer de secrets dans le repo.

## Workflow recommandé

```text
1. Vérifier Swagger live (scripts ci-dessous)
2. npm run build          # build local OK
3. git commit + push      # ou commit manuel
4. npm run deploy:vercel  # déploiement prod (--prod)
```

### Déploiement CLI

```bash
# Preview (branche courante)
npx vercel

# Production
npm run deploy:vercel
# équivalent : npx vercel --prod --yes
```

### Déploiement automatique (Git)

Connecter le repo GitHub à Vercel : chaque push sur `main` déclenche un build.
La règle Cursor `.cursor/rules/vercel-deploy-on-commit.mdc` demande en plus un déploiement explicite après commit si le CLI est disponible.

---

## Vérification Swagger / API (avant deploy)

Scripts dans `scripts/` — à lancer **contre l'API live** :

```bash
# Comparer SWAGGER.md local vs OpenAPI en ligne
npm run audit:swagger

# Vérifier les demandes backend (KYC, orders, franchises…)
npm run audit:backend
```

Comptes dev (`.env.local` ou variables CI) :

```env
NEXT_PUBLIC_API_URL=https://api.upjunoo-dev.tech
TEST_ADMIN_EMAIL=dev.admin@upjunoo-dev.tech
TEST_ADMIN_PASSWORD=Upjunoo@Dev2026!
TEST_FRANCHISE_EMAIL=dev.franchise@upjunoo-dev.tech
```

### Dernière audit — 6 juin 2026

Source : `node scripts/audit-backend-demandes.mjs` + `node scripts/diff-swagger-live.mjs`

#### Bilan demandes backend

| Statut | Nombre | Détail |
|--------|--------|--------|
| OK | 11 | Corrections prises en compte |
| Partiel | 9 | Enrichissements présents mais incomplets |
| Manquant | 1 | Encore à livrer côté API |

**Livré / OK (corrections intégrées)** :

- `AU-01` — `permissions[]` dans `GET /v1/auth/me`
- `KYC-02` — `document_type_label` en français
- `KYC-03` — `kyc_documents[]` embarqué dans `GET /v1/drivers/{id}`
- `DR-01` — objet `partner` (tradeName) sur fiche chauffeur
- `DR-03` — `vehicleLabel` (plaque + modèle)
- `OR-01` — `driver.displayName` sur liste orders (10/10)
- `FR-01` — `GET /v1/admin/franchises`
- `FR-DASH-01` — `GET /v1/franchise/dashboard`
- `CL-01` — `GET /v1/admin/users/{id}`
- `BUG-DR-SEARCH` — recherche chauffeurs (`?search=`) corrigée
- `DB-01` — `dashboard.franchises[].city` peuplé

**Partiel (utilisable, perfectible)** :

- `KYC-01` — URLs HTTPS présentes mais bucket public retourne HTTP 400 au HEAD
- `DR-02` — `zoneName` = ville, pas quartier
- `OR-02` / `OR-03` — partner/franchise enrichis mais pas d'objet complet partout
- `OR-05` — filtres `dateFrom`/`dateTo` acceptés (effet réel à valider)
- `PA-01` à `PA-03` — labels franchise/ville/driversCount présents
- `KYC-06` — filtre `?subject_id=` répond 200 mais 0 doc pour l'échantillon testé

**Encore manquant côté API** :

- `WD-01` — `franchiseName` sur les retraits (`/v1/admin/withdrawals`)

#### Écarts Swagger live vs SWAGGER.md local

- OpenAPI live : **v0.3.0**, **372 paths**
- SWAGGER.md local : **330 paths**
- **43 routes nouvelles** sur le live (non exportées localement), dont :
  - `GET /v1/admin/filter-options` ✅ 200
  - `GET /v1/admin/franchises` ✅ 200
  - `GET /v1/admin/kyc/queue` ✅ 200
  - `GET /v1/admin/users/{id}/activate|suspend`
  - `GET /v1/franchise/me`, `/v1/partner/me`, etc.
- **1 route locale absente du live** : `/v1/admin/orders/{orderId}` → utiliser `/v1/admin/orders/{serviceType}/{id}` ou `/v1/admin/orders/{id}` sur le live

> Mettre à jour `SWAGGER.md` via export Swagger ou régénération après chaque sprint backend.

---

## Checklist post-déploiement

- [ ] Login admin : `/admin/login` avec compte dev
- [ ] Dashboard charge sans erreur réseau
- [ ] Liste courses `/admin/ops/trips` (API v1 orders)
- [ ] Carte live (si token Mapbox configuré)
- [ ] Console réseau : appels vers `NEXT_PUBLIC_API_URL`, pas de MSW en prod

## Dépannage

| Problème | Action |
|----------|--------|
| Build Vercel échoue | `npm run build` en local, corriger TS/ESLint |
| 401 sur toutes les routes | `NEXT_PUBLIC_USE_REAL_AUTH=true`, cookies/CORS API |
| MSW actif en prod | `NEXT_PUBLIC_USE_MOCKS=false` sur Vercel |
| Routes 404 admin | Consulter Swagger live, pas SWAGGER.md seul |

## Fichiers liés

- `.cursor/rules/api-swagger-online.mdc` — intégration API
- `.cursor/rules/vercel-deploy-on-commit.mdc` — deploy après commit
- `scripts/audit-backend-demandes.mjs`
- `scripts/diff-swagger-live.mjs`
- `SWAGGER.md` — export local (peut être en retard)
