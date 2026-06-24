# Routes backend absentes ou mal alignées — Finance admin

> Audit du **2026-06-16** contre le Swagger live : [https://api.upjunoo-dev.tech/docs](https://api.upjunoo-dev.tech/docs)  
> OpenAPI : [https://api.upjunoo-dev.tech/docs/json](https://api.upjunoo-dev.tech/docs/json) (v **0.4.0**)  
> Contexte : travaux front admin finance (2 soldes, ledger, plafonds, bonus, fiches chauffeur/course/partenaire/franchise).

---

## 1. Routes absentes (HTTP 404 + absentes du Swagger)

Ces routes sont **utilisées ou déclarées côté front** mais **n'existent pas** (ou plus) sur `api.upjunoo-dev.tech`.

| Méthode | Route | Usage front | Fichier / écran |
|---------|-------|-------------|-----------------|
| `GET` | `/v1/admin/finance/ledger` | Ancien chemin ledger (doit pointer sur `/v1/admin/ledger`) | `links.ts` (historique) |
| `GET` | `/v1/admin/franchises/{id}/wallet` | Wallet franchise (chemin admin hypothétique) | Non branché — fiche franchise sans appel wallet dédié |

**Comportement front actuel :**

- **Plafonds finance** : branchés sur `GET/PUT /v1/admin/settings/finance-caps` (routes présentes dans le Swagger v0.4.0, réponses 401/403 documentées uniquement).
- **Ledger** : la page `/admin/finance/ledger` réutilise `GET /v1/admin/finance/transactions` ; le backend expose `/v1/admin/ledger`.
- **Franchise wallet** : pas d'appel API wallet ; fallback sur revenus du mois.

---

## 2. Route mal alignée (front ≠ backend)

| Route front (incorrecte) | Route backend (Swagger + HTTP 401) | Action |
|--------------------------|-------------------------------------|--------|
| `GET /v1/admin/finance/ledger` | `GET /v1/admin/ledger` | **FAIT côté front** : `LINKS.admin.v1.finance.ledger` mis à jour vers `/v1/admin/ledger` |

**Routes ledger complémentaires présentes côté backend** (non branchées front) :

| Méthode | Route |
|---------|-------|
| `GET` | `/v1/admin/ledger/export` |
| `POST` | `/v1/admin/ledger/{id}/reverse` |

---

## 3. Champs absents des schémas Swagger (payloads)

Recherche dans tout l'OpenAPI v0.4.0 : **aucune occurrence** des champs suivants, alors que le front les consomme en option (fallback solde unique si absents).

### Wallets (2 soldes)

| Champ attendu | Écrans concernés |
|---------------|------------------|
| `withdrawable_balance_xof` / `withdrawableBalanceXof` | Portefeuilles, fiche chauffeur, partenaire, franchise |
| `non_withdrawable_balance_xof` / `nonWithdrawableBalanceXof` | Idem |

**Endpoints wallet existants** (route OK, champs split manquants dans la doc et probablement dans les réponses) :

- `GET /v1/admin/finance/wallets`
- `GET /v1/drivers/{driverId}/wallet`
- `GET /v1/partners/{id}/wallet`
- `GET /v1/franchises/{id}/wallet`

### Détail course (finance)

| Champ attendu | Écran |
|---------------|-------|
| `commissionBreakdown` / `commission_breakdown` | `TripFinancePanel` |
| `walletBeforeXof` / `wallet_before_xof` | `TripFinancePanel` |
| `walletAfterXof` / `wallet_after_xof` | `TripFinancePanel` |
| `cashReceivedXof` / `cash_received_xof` | `TripFinancePanel` |
| `commissionStatus` / `commission_status` | `TripFinancePanel` |

**Endpoint course existant** (route OK, enrichissement `receipt` / `pricing` non documenté) :

- `GET /v1/admin/orders/{id}`

### Plafonds finance

| Champ attendu | Écran |
|---------------|-------|
| `driver_withdrawal_daily_cap_xof` | `FinanceCapsPage` |
| `partner_withdrawal_daily_cap_xof` | `FinanceCapsPage` |
| `driver_wallet_dispatch_min_xof` | `FinanceCapsPage` |
| `driver_wallet_low_balance_alert_xof` | `FinanceCapsPage` |

---

## 4. Routes présentes (référence — rien à demander côté création)

Pour éviter les doublons avec les demandes backend :

| Méthode | Route | Usage front |
|---------|-------|-------------|
| `GET` | `/v1/admin/bonus-rules` | `BonusRulesListPage` |
| `POST` | `/v1/admin/bonus-rules` | *(CRUD non implémenté UI)* |
| `PATCH` | `/v1/admin/bonus-rules/{id}` | *(CRUD non implémenté UI)* |
| `GET` | `/v1/admin/bonus-awards` | *(prévu, pas branché UI)* |
| `GET` | `/v1/admin/finance/wallets` | `WalletsListPage` |
| `GET` | `/v1/admin/finance/transactions` | `TransactionsListPage`, fallback ledger |
| `GET` | `/v1/admin/finance/commissions` | Commissions |
| `GET` | `/v1/admin/finance/reconciliation` | Réconciliation |
| `GET` | `/v1/admin/finance/driver-transfers` | Recharges chauffeurs |
| `GET` | `/v1/drivers/{driverId}/wallet` | Fiche chauffeur |
| `GET` | `/v1/drivers/{driverId}/ledger` | Fiche chauffeur |
| `GET` | `/v1/partners/{id}/wallet` | Fiche partenaire |
| `GET` | `/v1/partners/{id}/ledger` | Fiche partenaire |
| `GET` | `/v1/franchises/{id}/wallet` | À brancher sur fiche franchise |
| `GET` | `/v1/admin/orders/{id}` | Détail course |

---

## 5. Priorisation demandes backend

| Priorité | Demande |
|----------|---------|
| **P1** | Documenter correctement `GET/PUT /v1/admin/settings/finance-caps` (schémas 200, champs `driver_withdrawal_daily_cap_xof`, etc.) |
| **P1** | Confirmer que `/v1/admin/ledger` est bien la source de vérité du ledger comptable (et exposer les schémas 200 / export / reverse) |
| **P2** | Exposer `withdrawable_balance_xof` et `non_withdrawable_balance_xof` sur tous les wallets admin |
| **P2** | Enrichir `GET /v1/admin/orders/{id}` avec snapshot finance (`receipt` : breakdown, wallet avant/après, statut commission) |
| **P3** | Brancher fiche franchise sur `GET /v1/franchises/{id}/wallet` (et/ou supprimer la route admin hypothétique) |
| **P3** | Documenter les schémas de réponse **200** dans le Swagger (aujourd'hui souvent seulement 401/403) |

---

## 6. Vérification locale

Scripts utiles pour re-auditer :

```bash
node scripts/check-finance-swagger.mjs
```

Probe HTTP sans auth (404 = absente, 401/403 = présente) :

```bash
node -e "/* voir scripts/probe-finance-routes.mjs */"
```

Référence doc métier : `docs/FINANCE-CONTEXT.md`, `docs/module_finance/05-admin-centrale.md`.
