# Demande backend — Routes portail comptable manquantes (`/v1/compta/*`)

> **Date** : 2026-06-17  
> **Contexte** : capture HAR `docs/localhost.har` — compte `ACCOUNTANT` (`comptable@upjunoo-dev.tech`)  
> **Référence existante** : [comptables.md](comptables.md) § B (portail `/v1/compta/*`)

---

## Constat (HAR)

Le front portail `/compta` appelait encore des routes **`/v1/admin/*`** → **403 Forbidden** (comportement attendu : un comptable n’a pas `requireAdmin`).

| Statut | Méthode | Route |
|--------|---------|-------|
| **200** | GET | `/v1/compta/me` |
| **200** | GET | `/v1/compta/periods` |
| **200** | GET | `/v1/compta/ledger/export` |
| **200** | GET | `/v1/auth/me` |
| **403** | GET | `/v1/admin/finance/commissions` |
| **403** | GET | `/v1/admin/filter-options` |
| **403** | GET | `/v1/admin/finance/wallets` |
| **403** | GET | `/v1/admin/finance/reconciliation` |
| **403** | GET | `/v1/admin/finance/transactions` |
| **403** | GET | `/v1/admin/withdrawals` |
| **403** | GET | `/v1/admin/finance/driver-transfers` |
| **403** | GET | `/v1/admin/finance/driver-transfers/stats` |

Routes documentées dans `comptables.md` mais **non présentes dans le HAR** (à valider côté backend) :

- `GET /v1/compta/dashboard`
- `GET /v1/compta/ledger` (liste paginée)
- `GET /v1/compta/ledger/:id`
- `POST /v1/compta/ledger/:id/reverse`
- `POST /v1/compta/periods/close`
- `GET /v1/compta/periods/:id`
- `POST /v1/compta/periods/:id/lock`

---

## Routes déjà spécifiées (à confirmer en prod)

Voir [comptables.md](comptables.md) — le front les utilise :

| Route | Usage front |
|-------|-------------|
| `GET /v1/compta/me` | Topbar, identité pays |
| `GET /v1/compta/dashboard` | KPIs tableau de bord |
| `GET /v1/compta/ledger` | Journal, flux, transactions (lecture) |
| `GET /v1/compta/ledger/export` | Export CSV |
| `POST /v1/compta/ledger/:id/reverse` | Extourne |
| `GET /v1/compta/periods` | Liste périodes |
| `POST /v1/compta/periods/close` | Clôture |
| `GET /v1/compta/periods/:id` | Détail + checks |
| `POST /v1/compta/periods/:id/lock` | Verrouillage |

**Auth** : `authenticate` + `requireAccountant` (ACCOUNTANT ou admin), périmètre **pays** dérivé du rôle.

---

## Routes manquantes à implémenter (équivalents admin scopés pays)

Même logique que ledger : **réutiliser le service finance admin**, filtrer par `country_id` du comptable, exposer sous `/v1/compta/*`.

### 1. Commissions

```
GET /v1/compta/commissions
```

- **Équivalent admin** : `GET /v1/admin/finance/commissions`
- **Query** : `page`, `limit`, `status`, `from`, `to`, `franchiseId` (optionnel, dans le pays)
- **Réponse** : même forme que l’admin (`items[]`, `pagination`) — lignes limitées au pays
- **Permission** : `finance.commissions.view`

### 2. Portefeuilles

```
GET /v1/compta/wallets
```

- **Équivalent admin** : `GET /v1/admin/finance/wallets`
- **Query** : `page`, `limit`, `ownerType`, `ownerId`, `bucket`, `search`
- **Réponse** : `{ items[], pagination }` — wallets dont l’acteur est dans le pays

### 3. Transactions opérationnelles (si distinct du ledger)

```
GET /v1/compta/transactions
GET /v1/compta/transactions/:id
```

- **Équivalent admin** : `GET /v1/admin/finance/transactions`
- **Note front** : en attendant, le portail peut s’appuyer sur `GET /v1/compta/ledger` pour la consultation. Cette route reste utile si le modèle transaction ≠ écriture ledger.

### 4. Réconciliation paiements (mobile money)

```
GET /v1/compta/reconciliation
```

- **Équivalent admin** : `GET /v1/admin/finance/reconciliation`
- **Query** : `page`, `limit`, `status`, `from`, `to`
- Le dashboard compta expose déjà `reconciliation.open_gaps` — la liste détaillée manque.

### 5. Réconciliation cash chauffeurs

```
GET /v1/compta/cash-reconciliations
```

- **Équivalent admin** : `GET /v1/admin/cash-reconciliations`
- **Query** : `page`, `limit`, `status`, `from`, `to`

### 6. Retraits (lecture seule)

```
GET /v1/compta/withdrawals
GET /v1/compta/withdrawals/:id
```

- **Équivalent admin** : `GET /v1/admin/withdrawals`
- **Query** : `page`, `limit`, `status` (ex. `pending`)
- **Pas de POST approve/reject** côté comptable (lecture seule dans le portail).

### 7. Recharges / transferts chauffeurs

```
GET /v1/compta/driver-transfers
GET /v1/compta/driver-transfers/stats
```

- **Équivalent admin** : `GET /v1/admin/finance/driver-transfers` et `.../stats`
- **Query** : mêmes filtres, scopés pays

### 8. Filtres scope (franchises / partenaires du pays)

```
GET /v1/compta/filter-options
```

- **Équivalent admin** : `GET /v1/admin/filter-options`
- **Réponse** : `{ franchises[], partners[] }` — **uniquement** les entités du pays du comptable
- Nécessaire pour les filtres ledger / commissions sans appeler l’admin.

### 9. Export rapports agrégés

```
GET /v1/compta/reports/export
```

- **Équivalent admin** : `GET /v1/admin/reports/export`
- **Query** : filtres date / type — export CSV scopé pays
- **Headers** : `text/csv`, `x-export-rows`, `x-export-truncated` (comme ledger export)

---

## Contrat commun proposé

- **Préfixe** : `/v1/compta`
- **Guard** : `requireAccountant` (déjà en place sur les routes existantes)
- **Scope pays** : jamais via paramètre client pour un comptable ; dérivé de `user_roles.country_id`
- **Admin en preview** : `?countryId=<uuid>` optionnel (déjà documenté dans `comptables.md`)
- **Erreurs** :
  - `403 ACCOUNTANT_REQUIRED`
  - `403 ACCOUNTANT_COUNTRY_UNSET`
  - `404` si ressource hors pays (pas de fuite inter-pays)
- **Pagination** : `{ items[], pagination: { page, limit, total, totalPages } }` (aligné admin)
- **Swagger** : tag **`09b - Comptabilité (portail)`**

---

## Priorisation suggérée

| Priorité | Route | Écran portail |
|----------|-------|----------------|
| P0 | `GET /v1/compta/ledger` (+ dashboard) | Journal, flux, accueil |
| P1 | `GET /v1/compta/filter-options` | Filtres franchise/partenaire |
| P1 | `GET /v1/compta/wallets` | Portefeuilles |
| P1 | `GET /v1/compta/commissions` | Commissions |
| P2 | `GET /v1/compta/reconciliation` + `cash-reconciliations` | Réconciliation |
| P2 | `GET /v1/compta/withdrawals` | Retraits (lecture) |
| P2 | `GET /v1/compta/driver-transfers` (+ stats) | Recharges chauffeurs |
| P3 | `GET /v1/compta/transactions` | Si différent du ledger |
| P3 | `GET /v1/compta/reports/export` | Exports rapports |

---

## Fichier réponse attendu

`docs/REPONSE-BACKEND-COMPTA-PORTAIL-ROUTES-2026-06-17.md` avec :

- routes implémentées / URLs exactes ;
- exemples JSON (liste + pagination) ;
- codes erreur ;
- lien Swagger à jour (`GET /docs/json`).
