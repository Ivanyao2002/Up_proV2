# Contexte intégration API — Swagger en ligne

> **À lire avant toute intégration** `/v1/...` dans le back-office UpJunoo Pro.

## Source de vérité

| Ressource | URL | Usage |
|-----------|-----|--------|
| **Swagger UI (prioritaire)** | [https://api.upjunoo-dev.tech/docs](https://api.upjunoo-dev.tech/docs) | Vérifier routes, params, auth, tester live |
| Export local | `SWAGGER.md` (racine repo) | Miroir **périmé possible** — ne pas s'y fier seul |
| Chemins front | `src/core/api/links.ts` | Constantes `LINKS.*` |
| Écarts mock/API/UI | `docs/ECARTS-API-V1-BACKOFFICE.md` | Comparaison données |

**Règle** : avant d'ajouter ou modifier un service `*.service.ts`, ouvrir le Swagger en ligne, section tag correspondante, et confirmer que la route existe et répond en dev.

---

## Environnement & auth

```env
NEXT_PUBLIC_API_URL=https://api.upjunoo-dev.tech
NEXT_PUBLIC_USE_REAL_AUTH=true
NEXT_PUBLIC_USE_MOCKS=false
```

Compte admin test : `dev.admin@upjunoo-dev.tech` / `Upjunoo@Dev2026!`

1. `POST /v1/auth/login` → `accessToken` ou `session.access_token`
2. Header : `Authorization: Bearer <token>` + `X-Client-Type: back-office`

Smoke test : `node scripts/test-v1-api.mjs`

---

## Workflow d'intégration (checklist)

1. **Swagger en ligne** — trouver la route exacte (méthode, path, query, body).
2. **Tester** — curl, Swagger « Try it out », ou script `scripts/`.
3. **`links.ts`** — ajouter le chemin sous `LINKS.admin.v1` (ou `auth.v1`, etc.).
4. **Types** — `*.api.types.ts` depuis la réponse JSON réelle (pas le mock).
5. **Mapper** — `*.mapper.ts` vers types UI (`src/shared/types`).
6. **Service** — bascule `useLegacyAdminApi()` : mock `/api/v2` vs v1.
7. **Documenter** — `docs/API-INTEGRATION-BACKOFFICE.md` + écarts si besoin.

Pattern mode mock/v1 : `src/core/api/v1AdminMode.ts` → `useLegacyAdminApi()`.

---

## Routes admin back-office — référence rapide (juin 2026)

### Auth (§ 02)
| Route | Page |
|-------|------|
| `POST /v1/auth/login` | Connexion tous portails |
| `GET /v1/auth/me` | Session / AuthGuard |
| `POST /v1/auth/logout` | Déconnexion |
| `POST /v1/auth/forgot-password` | Mot de passe oublié |

### Opérations (§ 10 - Admin)
| Route | Page | Fichier |
|-------|------|---------|
| `GET /v1/admin/dashboard` | Dashboard | `dashboard.service.ts` |
| `GET /v1/admin/live-map` | Carte live | `liveMap.service.ts` |
| `GET /v1/admin/orders` | Liste courses | `trips.service.ts` |
| **`GET /v1/admin/orders/{orderId}`** | **Détail course** | `tripDetail.service.ts` |
| `GET /v1/admin/live-orders` | Stats carte (P1) | — |
| `GET /v1/admin/dashboard/recent-activity` | Activité récente (P2) | — |

### Compléments détail course (§ 05 Dispatch / § 99)
| Route | Usage |
|-------|--------|
| `GET /v1/orders/RIDE/{orderId}/events` | Événements seuls (redondant si détail admin) |
| `GET /v1/dispatch/RIDE/{orderId}/status` | Statut dispatch |
| `GET /v1/dispatch/RIDE/{orderId}/logs` | Logs dispatch / forensic |
| `GET /v1/commissions/orders/RIDE/{orderId}` | Commission course |

> Le détail admin `GET /v1/admin/orders/{id}` agrège déjà `ride`, `events`, `timeline`, `dispatch`, `clientName`, `commissionXof`.

### Flotte (§ 10)
| Route | Page |
|-------|------|
| `GET /v1/admin/drivers` | Liste chauffeurs |
| `GET /v1/drivers/{id}` | Fiche chauffeur |
| `GET /v1/admin/kyc/documents` | File KYC |
| `POST /v1/admin/kyc/documents/{id}/approve\|reject` | Actions KYC |

### Réseau & finance (§ 10)
| Route | Page |
|-------|------|
| `GET /v1/admin/partners` | Partenaires |
| `GET /v1/admin/users` | Clients admin |
| `GET /v1/admin/withdrawals` | Retraits |
| `POST /v1/admin/withdrawals/{id}/approve\|reject` | Actions retraits |
| `GET /v1/admin/vehicles` | Véhicules (P3, non branché) |

### À éviter pour l'admin back-office
| Route | Raison |
|-------|--------|
| `GET /v1/rides/{id}` | Scope **client** — 404 avec JWT admin sur courses admin |
| `GET /v1/orders/{serviceType}/{orderId}` | Module 99 — souvent 404 ; préférer admin |

---

## Tags Swagger utiles

| Tag | Contenu |
|-----|---------|
| `10 - Admin` | Back-office : orders, drivers, dashboard, KYC… |
| `05 - Dispatch` | Statut / logs dispatch |
| `04 - Client · Course VTC` | Apps passager (pas admin) |
| `99 - Autres modules` | Routes génériques, parfois 501 |

---

## Fichiers front de référence

| Rôle | Chemin |
|------|--------|
| Liens API | `src/core/api/links.ts` |
| Détail course v1 | `adminOrderDetail.mapper.ts`, `tripDetail.service.ts` |
| Lookup entités | `adminEntityLookup.service.ts` |
| Mode mock/v1 | `v1AdminMode.ts` |

---

*Dernière mise à jour : 5 juin 2026*
