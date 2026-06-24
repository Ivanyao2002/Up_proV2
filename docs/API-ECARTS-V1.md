# Écarts API v1 — index rapide

> **À envoyer au backend (demandes API uniquement)** :  
> **[BACKEND-DEMANDES-V1.md](./BACKEND-DEMANDES-V1.md)** ← **fichier unique**  
> **Document complet avec exemples mock / API / rendu UI** :  
> **[ECARTS-API-V1-BACKOFFICE.md](./ECARTS-API-V1-BACKOFFICE.md)**  
> **Dernière revue** : 8 juin 2026

---

## Routes intégrées (API v1 réelle)

| Route | Page | Statut |
|-------|------|--------|
| `POST /v1/auth/login`, `GET /v1/auth/me` | Connexion | OK |
| `GET /v1/admin/dashboard` | Dashboard | OK + filtres franchise |
| `GET /v1/admin/live-map` + socket | Carte live | OK |
| `GET /v1/admin/orders` | Liste courses | OK (noms client) |
| `GET /v1/admin/orders/{orderId}` | Détail course | OK (timeline, commission) |
| `GET /v1/admin/drivers` | Liste chauffeurs | OK (profile enrichi) |
| `GET /v1/drivers/:id` | Fiche chauffeur | Partiel |
| `GET /v1/admin/kyc/documents` | File KYC | OK (regroupement front) |
| `GET /v1/admin/franchises` | Franchises liste | OK |
| `GET /v1/admin/franchises/{id}` | Franchise détail (en-tête) | OK — + sous-routes module 99 |
| `GET /v1/franchises/{id}` (+ sous-routes) | Franchise détail (onglets) | **Composé** (partners/drivers/revenue/zones) |
| `GET /v1/admin/filter-options` | Filtres courses + carte live | OK |
| `GET /v1/admin/paydunya-config` | Intégrations PayDunya | OK |
| `GET /v1/admin/weather-config` | Paramètres météo | OK |
| `POST /v1/admin/weather/refresh` | Refresh météo manuel | OK |
| `POST /v1/admin/payments/reconcile-batch` | Réconciliation PayDunya | OK (bouton batch) |
| `GET /v1/geo/hot-zones` | Zones chaudes carte live | OK |
| `GET /v1/zones` | Zones réseau | OK |
| `GET /v1/admin/partners` | Partenaires | Partiel (+ bootstrap villes) |
| `GET /v1/partners/{id}` | Partenaire détail | **Partiel** — branché |
| `GET /v1/admin/withdrawals` | Retraits | OK (beneficiaryName) |
| `GET /v1/admin/users` | Clients admin | **Liste OK** — détail mock |

**Activation** : `.env.local` → `NEXT_PUBLIC_USE_REAL_AUTH=true`, `NEXT_PUBLIC_USE_MOCKS=false`

**Test** : `node scripts/test-v1-api.mjs`

---

## Top 5 écarts restants (juin 2026)

1. **Orders incomplets** — `driver.displayName`, `partnerName`, `franchiseName` souvent null sur la course.
2. **Liste réconciliation** — pas de `GET /v1/admin/payments` ; tableau encore mock v2.
3. **Partenaires partiels** — `franchiseName`, `driversCount` souvent null/0 en seed.
4. **CRUD réseau** — pas de POST/DELETE franchises/partners admin.
5. **Permissions auth** — toujours codées en dur côté front.

---

## Écarts résolus récemment

- ~~Noms absents (client, chauffeur)~~ → `client.displayName`, `profile.displayName`
- ~~`GET /v1/admin/users` en 500~~ → 200, liste intégrée
- ~~Filtres périmètre vides~~ → `dashboard.filters.options`
- ~~Pagination absente (principales listes)~~ → `page` + `limit` API branchés (juin 2026)
- ~~Retraits UUID~~ → `beneficiaryName`
- ~~Redirection login échoué~~ → reste sur portail courant

---

*Voir [ECARTS-API-V1-BACKOFFICE.md](./ECARTS-API-V1-BACKOFFICE.md) pour les exemples JSON complets.*
