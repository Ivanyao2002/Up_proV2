# Routes backend — Interface comptable

> **Date :** 2026-06-16  
> **Émetteur :** équipe front UpJunoo  
> **Destinataire :** équipe backend / API  
> **Objectif :** inventorier les routes nécessaires au portail comptable (`/compta`, `/franchise/compta`), distinguer **existant**, **à brancher**, **à créer** et **à enrichir**.  
> **Swagger :** [https://api.upjunoo-dev.tech/docs](https://api.upjunoo-dev.tech/docs) — OpenAPI v **0.4.0**  
> **Contexte produit :** `docs/INTERFACE-COMPTABLE-CONTEXT.md`

---

## 1. Résumé exécutif

| Catégorie | Nombre (approx.) | Action |
|-----------|------------------|--------|
| Routes **présentes** Swagger, non branchées compta | ~12 | Brancher front `/compta` |
| Routes **présentes**, partiellement utilisées admin | ~8 | Réutiliser en lecture seule |
| Routes **absentes**, nécessaires compta complète | ~15 | Créer + documenter schémas 200 |
| Champs payload **manquants** sur routes existantes | ~10 | Enrichir réponses |

**Point critique :** la page admin « Ledger comptable » (`/admin/finance/ledger`) utilise encore `GET /v1/admin/finance/transactions` en fallback. La source de vérité comptable est **`GET /v1/admin/ledger`**.

---

## 2. Légende

| Statut | Signification |
|--------|---------------|
| ✅ **EXISTANT** | Présent dans Swagger v0.4.0 (souvent schéma 200 générique) |
| 🔌 **À BRANCHER** | API OK, portail `/compta` pas encore implémenté |
| 🟡 **PARTIEL** | Route existe mais payload incomplet ou schéma non documenté |
| ❌ **MANQUANT** | Absent du Swagger — à créer |
| 🚫 **INTERDIT compta** | Route admin opérationnelle — comptable en lecture seule uniquement |

---

## 3. Routes par écran comptable

### 3.1 Tableau de bord (`/compta`)

| Méthode | Route | Statut | Usage |
|---------|-------|--------|-------|
| `GET` | `/v1/admin/accounting/dashboard` | ❌ MANQUANT | KPI : écritures jour, écarts, période, incidents commission |
| `GET` | `/v1/admin/finance/dashboard` | ✅ EXISTANT | Fallback partiel (dashboard finance ops, pas compta) |
| `GET` | `/v1/franchise/finance` | ✅ EXISTANT | Dashboard franchise (fallback territoire) |

**Demande P1 :** créer `GET /v1/admin/accounting/dashboard` avec payload :

```json
{
  "period": { "id": "uuid", "label": "2026-06", "status": "open|closed|locked" },
  "entries_today": { "credit_xof": 0, "debit_xof": 0, "count": 0 },
  "commissions": { "debited": 0, "pending": 0, "failed": 0 },
  "reconciliation": { "open_gaps": 0, "unjustified_gaps": 0 },
  "withdrawals_pending_count": 0,
  "wallets_below_dispatch_min": 0,
  "reversals_this_month": 0
}
```

---

### 3.2 Flux entrées / sorties (`/compta/flows`)

| Méthode | Route | Statut | Usage |
|---------|-------|--------|-------|
| `GET` | `/v1/admin/accounting/flows` | ❌ MANQUANT | Agrégation par `entry_type` + période + franchise |
| `GET` | `/v1/admin/ledger` | ✅ EXISTANT | Fallback : agrégation côté front (coûteux) |

**Query params suggérés pour `/v1/admin/accounting/flows` :**

`from`, `to`, `franchise_id`, `entry_type`, `balance_bucket`, `group_by` (`day|week|month|entry_type`)

**Demande P2 :** endpoint d’agrégation serveur (évite de paginer tout le ledger).

---

### 3.3 Journal comptable (`/compta/ledger`)

| Méthode | Route | Statut | Usage |
|---------|-------|--------|-------|
| `GET` | `/v1/admin/ledger` | ✅ EXISTANT 🔌 | Liste écritures `ledger_entries` |
| `GET` | `/v1/admin/ledger/{id}` | ❌ MANQUANT | Détail écriture + liens course/chauffeur/partenaire |
| `GET` | `/v1/admin/ledger/export` | ✅ EXISTANT 🔌 | Export CSV/Excel |
| `POST` | `/v1/admin/ledger/{id}/reverse` | ✅ EXISTANT 🔌 | Extourne |
| `GET` | `/v1/admin/finance/transactions` | ✅ EXISTANT 🟡 | **Ne pas utiliser** comme source ledger compta |
| `GET` | `/v1/admin/finance/ledger` | ❌ MANQUANT | Ancien chemin — **ne pas créer**, utiliser `/v1/admin/ledger` |

**Query params attendus sur `GET /v1/admin/ledger` :**

| Param | Type | Description |
|-------|------|-------------|
| `page`, `per_page` | int | Pagination |
| `from`, `to` | ISO date | Période |
| `franchise_id` | uuid | Filtre franchise |
| `partner_id` | uuid | Filtre partenaire |
| `driver_id` | uuid | Filtre chauffeur |
| `wallet_id` | uuid | Filtre wallet |
| `entry_type` | string | `ride_commission`, `wallet_recharge`, … |
| `balance_bucket` | string | `WITHDRAWABLE` \| `NON_WITHDRAWABLE` |
| `direction` | string | `debit` \| `credit` |
| `txn_id` | string | Regroupement transaction |
| `status` | string | Statut écriture |

**Item ledger attendu (schéma 200) :**

```json
{
  "id": "uuid",
  "txn_id": "uuid",
  "wallet_id": "uuid",
  "owner_type": "driver|partner|franchise|platform",
  "owner_id": "uuid",
  "owner_name": "string",
  "franchise_id": "uuid",
  "direction": "debit|credit",
  "amount_xof": 1500,
  "balance_bucket": "WITHDRAWABLE|NON_WITHDRAWABLE",
  "entry_type": "ride_commission",
  "service_type": "RIDE",
  "source_type": "order",
  "source_id": "uuid",
  "source_ref": "ORD-12345",
  "idempotency_key": "string",
  "status": "posted|reversed|pending",
  "posted_at": "2026-06-16T10:00:00Z",
  "description": "string",
  "metadata": {}
}
```

**Demande P0 :** documenter schéma 200 complet + exposer `balance_bucket`.

---

### 3.4 Commissions & bénéfices (`/compta/commissions`)

| Méthode | Route | Statut | Usage |
|---------|-------|--------|-------|
| `GET` | `/v1/admin/finance/commissions` | ✅ EXISTANT 🔌 | Liste commissions par course/période |
| `GET` | `/v1/admin/orders/{id}` | ✅ EXISTANT 🟡 | Breakdown commission sur détail course |
| `GET` | `/v1/franchise/finance/commissions` | ✅ EXISTANT | Scope franchise |
| `GET` | `/v1/franchise/finance/commissions/{id}` | ✅ EXISTANT | Détail commission franchise |

**Champs manquants sur `GET /v1/admin/orders/{id}` (bloc `receipt` ou `finance`) :**

| Champ | Description |
|-------|-------------|
| `cash_received_xof` | Cash reçu chauffeur (= montant brut course cash) |
| `commission_total_xof` | Commission totale prélevée |
| `commission_status` | `COMMISSION_DEBITED`, `COMMISSION_FAILED`, … |
| `wallet_before_xof` | Solde wallet avant débit |
| `wallet_after_xof` | Solde wallet après débit |
| `commission_breakdown` | `{ fiscality, franchise, partner, platform }` en XOF |
| `commission_from_service_xof` | Part prélevée sur solde service |
| `commission_from_withdrawable_xof` | Part prélevée sur solde retirable |

**Demande P1 :** enrichir réponse order + documenter dans Swagger.

---

### 3.5 Portefeuilles (`/compta/wallets`)

| Méthode | Route | Statut | Usage |
|---------|-------|--------|-------|
| `GET` | `/v1/admin/finance/wallets` | ✅ EXISTANT 🔌 | Liste tous wallets |
| `GET` | `/v1/drivers/{driverId}/wallet` | ✅ EXISTANT 🟡 | Wallet chauffeur |
| `GET` | `/v1/partners/{id}/wallet` | ✅ EXISTANT 🟡 | Wallet partenaire |
| `GET` | `/v1/franchises/{id}/wallet` | ✅ EXISTANT 🟡 | Wallet franchise |
| `GET` | `/v1/drivers/{driverId}/ledger` | ✅ EXISTANT | Ledger filtré chauffeur |
| `GET` | `/v1/partners/{id}/ledger` | ✅ EXISTANT | Ledger filtré partenaire |
| `GET` | `/v1/franchises/{id}/ledger` | ✅ EXISTANT | Ledger filtré franchise |

**Champs manquants sur toutes les réponses wallet :**

| Champ | Description |
|-------|-------------|
| `withdrawable_balance_xof` | Solde retirable |
| `non_withdrawable_balance_xof` | Solde service (non retirable) |
| `balance_cached_xof` | Total (= somme des deux) |
| `pending_withdrawal_xof` | Retraits en attente |

**Demande P0 :** exposer les 2 soldes sur tous les endpoints wallet.

---

### 3.6 Réconciliation (`/compta/reconciliation`)

#### Paiements (PayDunya / payment_transactions)

| Méthode | Route | Statut | Usage |
|---------|-------|--------|-------|
| `GET` | `/v1/admin/finance/reconciliation` | ✅ EXISTANT 🔌 | Liste rapprochements paiements |
| `POST` | `/v1/admin/payments/{id}/reconcile` | ✅ EXISTANT | 🚫 Action trésorerie — pas compta |
| `POST` | `/v1/admin/payments/reconcile-batch` | ✅ EXISTANT | 🚫 Action trésorerie |

#### Cash

| Méthode | Route | Statut | Usage |
|---------|-------|--------|-------|
| `GET` | `/v1/admin/cash-reconciliations` | ✅ EXISTANT 🔌 | Liste admin |
| `POST` | `/v1/admin/cash-reconciliations/{id}/review` | ✅ EXISTANT 🔌 | Valider / rejeter avec motif |
| `GET` | `/v1/cash-reconciliations` | ✅ EXISTANT | Liste générique |
| `POST` | `/v1/cash-reconciliations` | ✅ EXISTANT | Création |
| `GET` | `/v1/cash-reconciliations/{id}` | ✅ EXISTANT | Détail |
| `GET` | `/v1/partners/{id}/cash-reconciliations` | ✅ EXISTANT | Scope partenaire |

#### Mobile Money (relevé ↔ compte local franchise)

| Méthode | Route | Statut | Usage |
|---------|-------|--------|-------|
| `GET` | `/v1/admin/accounting/reconciliation/mm` | ❌ MANQUANT | Matching relevé MM ↔ ledger franchise |
| `POST` | `/v1/admin/accounting/reconciliation/mm/{id}/justify` | ❌ MANQUANT | Justifier un écart |
| `POST` | `/v1/admin/accounting/reconciliation/mm/{id}/validate` | ❌ MANQUANT | Valider rapprochement |

#### Carte / sous-compte Canada

| Méthode | Route | Statut | Usage |
|---------|-------|--------|-------|
| `GET` | `/v1/admin/accounting/reconciliation/card` | ❌ MANQUANT | Matching carte ↔ ledger central pays |
| `POST` | `/v1/admin/accounting/reconciliation/card/{id}/justify` | ❌ MANQUANT | Justifier écart |
| `POST` | `/v1/admin/accounting/reconciliation/card/{id}/validate` | ❌ MANQUANT | Valider |

#### Franchise

| Méthode | Route | Statut | Usage |
|---------|-------|--------|-------|
| `GET` | `/v1/franchise/finance/reconciliation` | ✅ EXISTANT | Liste territoire |
| `GET` | `/v1/franchise/finance/reconciliation/{id}` | ✅ EXISTANT | Détail |
| `GET` | `/v1/franchises/{id}/reconciliation` | ✅ EXISTANT | Par franchise ID |

**Demande P1 :** routes MM + carte avec workflow `open → justified → validated → locked`.

---

### 3.7 Clôtures & verrouillage (`/compta/periods`)

| Méthode | Route | Statut | Usage |
|---------|-------|--------|-------|
| `GET` | `/v1/admin/accounting/periods` | ✅ EXISTANT 🔌 | Liste périodes (jour/mois) |
| `POST` | `/v1/admin/accounting/periods/close` | ✅ EXISTANT 🔌 | Clôturer période en cours |
| `GET` | `/v1/admin/accounting/periods/{id}` | ❌ MANQUANT | Détail période + contrôles |
| `POST` | `/v1/admin/accounting/periods/{id}/lock` | ❌ MANQUANT | Verrouillage définitif |
| `GET` | `/v1/franchise/accounting/periods` | ❌ MANQUANT | Périodes scope franchise |
| `POST` | `/v1/franchise/accounting/periods/close` | ❌ MANQUANT | Clôture locale |

**Body `POST /v1/admin/accounting/periods/close` (attendu) :**

```json
{
  "period_type": "daily|monthly",
  "period_end": "2026-06-16",
  "franchise_id": "uuid|null",
  "force": false,
  "note": "Clôture mensuelle juin"
}
```

**Réponse attendue :**

```json
{
  "period_id": "uuid",
  "status": "closed",
  "checks": {
    "unreconciled_entries": 0,
    "unjustified_gaps": 0,
    "open_withdrawals": 0
  },
  "blocked": false,
  "blockers": []
}
```

**Demande P1 :** schémas 200 + règles de blocage si écarts non justifiés.

---

### 3.8 Classification d’écritures

| Méthode | Route | Statut | Usage |
|---------|-------|--------|-------|
| `POST` | `/v1/admin/accounting/entries/{id}/classify` | ❌ MANQUANT | Affecter compte comptable / centre de coût |
| `POST` | `/v1/admin/ledger/{id}/classify` | ❌ MANQUANT | *(alias possible)* |

**Body suggéré :**

```json
{
  "account_code": "706100",
  "cost_center": "FR-CI-ABJ",
  "note": "Reclassement manuel"
}
```

**Demande P2.**

---

### 3.9 Extournes

| Méthode | Route | Statut | Usage |
|---------|-------|--------|-------|
| `POST` | `/v1/admin/ledger/{id}/reverse` | ✅ EXISTANT 🔌 | Créer écriture inverse |
| `POST` | `/v1/admin/accounting/entries/{id}/reverse` | ❌ MANQUANT | **Ne pas créer** — utiliser `ledger/{id}/reverse` |

**Body `POST /v1/admin/ledger/{id}/reverse` (attendu) :**

```json
{
  "reason": "Erreur de saisie — doublon recharge",
  "justification_ref": "TICKET-4521",
  "require_second_approval": true
}
```

**Réponse :** nouvelle écriture `entry_type=reversal` + référence à l’écriture source.

**Demande P1 :** documenter schéma + règle double validation si montant &gt; seuil.

---

### 3.10 Rapports & exports (`/compta/exports`)

| Méthode | Route | Statut | Usage |
|---------|-------|--------|-------|
| `GET` | `/v1/admin/ledger/export` | ✅ EXISTANT 🔌 | Export ledger |
| `GET` | `/v1/admin/reports/export` | ✅ EXISTANT 🔌 | Export rapports génériques |
| `POST` | `/v1/admin/accounting/entries/export` | ❌ MANQUANT | Export comptable paramétré *(ou fusionner avec ledger/export)* |
| `GET` | `/v1/admin/accounting/reports/monthly-summary` | ❌ MANQUANT | Synthèse mensuelle |
| `GET` | `/v1/admin/accounting/reports/daily-controls` | ❌ MANQUANT | Contrôles quotidiens |
| `GET` | `/v1/franchise/ledger/export` | ❌ MANQUANT | Export franchise |

**Query params export :**

`from`, `to`, `franchise_id`, `entry_type`, `format` (`csv|xlsx`), `include_metadata` (`true|false`)

**Demande P2 :** rapports mensuels et contrôles quotidiens.

---

### 3.11 Consultation lecture seule (réutilisation admin)

| Méthode | Route | Statut | Accès compta |
|---------|-------|--------|--------------|
| `GET` | `/v1/admin/finance/transactions` | ✅ | Lecture ✅ |
| `GET` | `/v1/admin/withdrawals` | ✅ | Lecture ✅ (sans approve) |
| `GET` | `/v1/admin/withdrawals/{id}` | ✅ | Lecture ✅ |
| `GET` | `/v1/admin/finance/driver-transfers` | ✅ | Lecture ✅ |
| `GET` | `/v1/admin/finance/driver-transfers/stats` | ✅ | Lecture ✅ |
| `GET` | `/v1/admin/orders/{id}` | ✅ | Lecture ✅ |
| `GET` | `/v1/admin/bonus-awards` | ✅ | Lecture ✅ |

| Méthode | Route | Statut | Accès compta |
|---------|-------|--------|--------------|
| `POST` | `/v1/admin/withdrawals/{id}/approve` | ✅ | 🚫 Interdit |
| `POST` | `/v1/admin/withdrawals/{id}/reject` | ✅ | 🚫 Interdit |
| `POST` | `/v1/admin/finance/driver-recharge` | — | 🚫 Interdit |

---

### 3.12 Settlements & payouts (consultation)

| Méthode | Route | Statut | Usage compta |
|---------|-------|--------|--------------|
| `GET` | `/v1/admin/settlement-runs` | ✅ EXISTANT | Suivi reversements |
| `POST` | `/v1/admin/settlement-runs` | ✅ EXISTANT | 🚫 Création trésorerie |
| `PATCH` | `/v1/admin/settlement-runs/{id}` | ✅ EXISTANT | 🚫 Modification |
| `POST` | `/v1/admin/settlement-runs/{id}/approve` | ✅ EXISTANT | 🚫 Approbation |
| `GET` | `/v1/admin/payouts` | ✅ EXISTANT | Liste payouts |
| `POST` | `/v1/admin/payouts/{id}/approve` | ✅ EXISTANT | 🚫 Approbation |
| `GET` | `/v1/franchises/{id}/settlements` | ✅ EXISTANT | Settlements franchise |
| `GET` | `/v1/partners/{id}/settlements` | ✅ EXISTANT | Settlements partenaire |

---

## 4. Auth & permissions (backend)

Permissions à exposer dans RBAC (rôle `ACCOUNTANT`) :

| Permission | Routes concernées |
|------------|-------------------|
| `finance.ledger.view` | `GET /v1/admin/ledger`, `…/export`, `…/{id}` |
| `finance.transactions.view` | `GET /v1/admin/finance/transactions` |
| `finance.wallets.view` | `GET /v1/admin/finance/wallets`, wallets par entité |
| `finance.commissions.view` | `GET /v1/admin/finance/commissions` |
| `finance.reconciliation.view` | Toutes routes réconciliation GET |
| `accounting.entries.classify` | `POST …/classify` |
| `accounting.periods.close` | `POST …/periods/close` |
| `accounting.periods.lock` | `POST …/periods/{id}/lock` |
| `accounting.export` | `GET …/export`, `…/reports/*` |
| `accounting.reverse` | `POST /v1/admin/ledger/{id}/reverse` |

**Demande P1 :** créer rôle `ACCOUNTANT` + permissions ci-dessus dans `GET /v1/admin/roles` / seed migrations.

---

## 5. Matrice synthèse — toutes les routes compta

### 5.1 Centrale (`/compta`)

| Route | GET | POST | PATCH | Statut |
|-------|-----|------|-------|--------|
| `/v1/admin/ledger` | ✅ | — | — | À brancher |
| `/v1/admin/ledger/{id}` | ❌ | — | — | À créer |
| `/v1/admin/ledger/export` | ✅ | — | — | À brancher |
| `/v1/admin/ledger/{id}/reverse` | — | ✅ | — | À brancher |
| `/v1/admin/accounting/dashboard` | ❌ | — | — | À créer |
| `/v1/admin/accounting/flows` | ❌ | — | — | À créer |
| `/v1/admin/accounting/periods` | ✅ | — | — | À brancher |
| `/v1/admin/accounting/periods/close` | — | ✅ | — | À brancher |
| `/v1/admin/accounting/periods/{id}/lock` | — | ❌ | — | À créer |
| `/v1/admin/accounting/entries/{id}/classify` | — | ❌ | — | À créer |
| `/v1/admin/accounting/reconciliation/mm` | ❌ | — | — | À créer |
| `/v1/admin/accounting/reconciliation/card` | ❌ | — | — | À créer |
| `/v1/admin/accounting/reports/monthly-summary` | ❌ | — | — | À créer |
| `/v1/admin/accounting/reports/daily-controls` | ❌ | — | — | À créer |
| `/v1/admin/cash-reconciliations` | ✅ | — | — | À brancher |
| `/v1/admin/cash-reconciliations/{id}/review` | — | ✅ | — | À brancher |
| `/v1/admin/finance/*` (listes) | ✅ | — | — | Réutiliser |
| `/v1/admin/reports/export` | ✅ | — | — | À brancher |

### 5.2 Franchise (`/franchise/compta`)

| Route | Statut |
|-------|--------|
| `GET /v1/franchise/finance/commissions` | ✅ À brancher |
| `GET /v1/franchise/finance/reconciliation` | ✅ À brancher |
| `GET /v1/franchises/{id}/ledger` | ✅ À brancher |
| `GET /v1/franchises/{id}/reconciliation` | ✅ À brancher |
| `GET /v1/franchise/accounting/periods` | ❌ À créer |
| `POST /v1/franchise/accounting/periods/close` | ❌ À créer |
| `GET /v1/franchise/ledger/export` | ❌ À créer |

---

## 6. Priorisation demandes backend

| Priorité | Demande | Routes / champs |
|----------|---------|-----------------|
| **P0** | Schémas 200 documentés pour ledger, wallets, periods | `GET /v1/admin/ledger`, wallets |
| **P0** | `balance_bucket` sur ledger + 2 soldes sur wallets | Tous endpoints wallet + ledger |
| **P1** | Brancher source de vérité ledger (remplacer fallback transactions) | `GET /v1/admin/ledger` |
| **P1** | Dashboard compta | `GET /v1/admin/accounting/dashboard` |
| **P1** | Breakdown finance sur détail course | `GET /v1/admin/orders/{id}` |
| **P1** | Clôtures avec règles de blocage | `periods/close`, `periods/{id}/lock` |
| **P1** | Rôle `ACCOUNTANT` + permissions | Auth / RBAC |
| **P2** | Réconciliation MM + carte | `/accounting/reconciliation/mm`, `/card` |
| **P2** | Agrégation flux entrées/sorties | `GET /v1/admin/accounting/flows` |
| **P2** | Rapports mensuels + contrôles quotidiens | `/accounting/reports/*` |
| **P2** | Classification écritures | `POST …/classify` |
| **P3** | Portail franchise compta complet | Routes `/v1/franchise/accounting/*`, export |

---

## 7. Alignement front (à faire après réponses backend)

| Fichier / zone | Action |
|----------------|--------|
| `src/core/api/links.ts` | Ajouter bloc `LINKS.admin.v1.accounting` |
| `src/features/compta/api/` | Services + queries React Query |
| `src/features/finance/pages/LedgerListPage.tsx` | Basculer sur `GET /v1/admin/ledger` |
| `src/portals/compta/` | Shell + navigation |
| `src/app/(compta)/compta/` | Routes Next.js |
| Permissions | `usePermission('accounting.*')` |

---

## 8. Vérification locale

Ré-auditer contre Swagger :

```bash
node scripts/check-finance-swagger.mjs
```

Probe routes compta (à étendre) :

```bash
node -e "
const routes = [
  'GET /v1/admin/ledger',
  'GET /v1/admin/accounting/dashboard',
  'GET /v1/admin/accounting/periods',
  'POST /v1/admin/accounting/periods/close',
  'GET /v1/admin/cash-reconciliations',
];
fetch('https://api.upjunoo-dev.tech/docs/json')
  .then(r => r.json())
  .then(s => {
    const paths = Object.keys(s.paths);
    for (const r of routes) {
      const [m, p] = r.split(' ');
      const found = paths.find(x => x.replace(/\{[^}]+\}/g,'{id}') === p.replace(/\{[^}]+\}/g,'{id}'));
      console.log(found && s.paths[found][m.toLowerCase()] ? 'OK' : '--', r);
    }
  });
"
```

---

## 9. Documents liés

| Document | Lien |
|----------|------|
| Contexte interface compta | `docs/INTERFACE-COMPTABLE-CONTEXT.md` |
| Finance global | `docs/FINANCE-CONTEXT.md` |
| Spec métier compta | `docs/module_finance/06-comptabilite.md` |
| Audit finance admin | `docs/ROUTES-BACKEND-ABSENTES-FINANCE-ADMIN.md` |

---

## 10. Historique

| Date | Version | Changement |
|------|---------|------------|
| 2026-06-16 | 1.0 | Création — audit Swagger v0.4.0 + spec portail `/compta` |
