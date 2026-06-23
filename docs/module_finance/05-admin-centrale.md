# 05 — Admin Centrale (Plateforme)

> Socle : `README.md`. La Centrale supervise l'écosystème global : paramétrage (commissions, bonus, plafonds, config paiement), franchises, droits (RBAC), consolidation multi-pays, settlements, réconciliation carte.

---

## A. BACKEND

### A.1 Périmètre
La Centrale = utilisateurs `ADMIN` / `SUPER_ADMIN` (scope `platform`). Visibilité **globale** (toutes franchises, tous pays, tous flux). Wallet `PLATFORM` (owner_id constant).

### A.2 Tables pilotées
- `commission_rules` (CRUD global + visibilité des overrides) — **paramétrage des taux**.
- `bonus_rules` (CRUD global + campagnes) — **paramétrage des paliers de bonus**.
- `system_settings` : `finance.withdrawal.caps` (**plafonds retrait** 10k/30k), `driver.wallet.config` (seuils dispatch/alerte), config dispatch, paydunya, pricing, weather.
- `franchises` (CRUD), `partners` (activation/suspension), `drivers` (approbation/ban).
- `roles`, `permissions`, `role_permissions`, `user_roles` — **RBAC**.
- `withdrawal_requests` (approbation au-dessus du seuil franchise), `payouts`, `settlement_runs`.
- `ledger_entries`, `payment_transactions`, `payment_webhook_events` (consolidation/réconciliation).

### A.3 Endpoints (back-office admin — EXISTANTS + à ajouter)
| Domaine | Endpoints | Statut |
|---|---|---|
| Dashboard global | `GET /v1/admin/dashboard`, `live-map/live-drivers/live-orders` | EXISTANT |
| Finance | `GET /v1/admin/finance/dashboard\|transactions\|wallets\|commissions\|reconciliation` | EXISTANT |
| Commission rules | `GET\|POST\|PATCH /v1/admin/commission-rules[/:id]` | EXISTANT |
| **Bonus rules** | `GET\|POST\|PATCH /v1/admin/bonus-rules[/:id]`, `GET /v1/admin/bonus-awards` | **NOUVEAU** |
| **Plafonds retrait** | `GET\|PUT /v1/admin/settings/finance-caps` | **NOUVEAU** |
| Retraits | `GET /v1/admin/withdrawals[/:id]`, `POST …/approve\|reject` | EXISTANT (compléter) |
| Payouts / settlements | `GET /v1/admin/payouts`, `/settlement-runs`, `POST …/approve` | EXISTANT (infra) |
| Franchises | `GET\|POST\|PATCH\|DELETE /v1/admin/franchises[/:id]` | EXISTANT |
| Partenaires | `GET /v1/admin/partners[/:id]`, `POST …/activate\|suspend` | EXISTANT |
| KYC chauffeurs | `GET /v1/admin/kyc/queue`, `POST …/approve\|reject` | EXISTANT |
| RBAC | `GET\|POST /v1/admin/roles[/:id/permissions]`, `/permissions`, `POST /v1/admin/users/:id/roles` | EXISTANT |
| Configs globales | `GET\|PUT /v1/admin/{dispatch,weather,pricing,paydunya,delivery-cargo}-config` | EXISTANT |
| Rotation chauffeurs | `GET /v1/admin/driver-rotation/status\|partners` | EXISTANT |
| Catalogue | `GET\|POST\|PATCH\|DELETE /v1/admin/catalog/:resource` | EXISTANT |

### A.4 Permissions
`SUPER_ADMIN` = tout. `ADMIN_OPS` etc. = sous-ensembles via `role_permissions`. Toute action de paramétrage est **auditée** (qui/quand/ancienne/nouvelle valeur/motif).

---

## B. BACK-OFFICE ADMIN (web)

### Écrans finance & paramétrage
- **Dashboard Direction** : CA brut généré, cash estimé reçu chauffeurs, commissions débitées, parts (centrale/franchise/partenaire/fiscalité), bonus versés, paiements carte par pays, sous-comptes Canada, montants transférés/dus, franchises actives/en retard, anomalies, taux de commission effectivement débité.
- **Paramétrage commissions** : éditer `commission_rules` (taux par service/catégorie/franchise/zone, dates d'effet, priorité). Simulation avant activation.
- **Paramétrage bonus** : éditer `bonus_rules` globales + campagnes, voir coûts.
- **Plafonds & seuils** : retrait/jour (10k chauffeur / 30k partenaire), seuils dispatch/alerte.
- **Retraits & payouts** : file d'attente, approbation au-dessus du seuil, settlement runs.
- **Réconciliation** : MM locale (par franchise) + carte (sous-comptes Canada).
- **RBAC** : rôles, permissions, affectation aux utilisateurs.
- **Franchises / partenaires / chauffeurs** : création, activation, modération.
- **Audit** : journal des opérations sensibles.

---

## C. APP FRONT-END
- Acteur **back-office uniquement** (pas d'app mobile).

---

## D. Règles clés
- **Rien en dur** : tous les taux, paliers, plafonds, seuils sont éditables ici (avec override possible par franchise).
- Toute modification de paramètre financier = **historisée** + (optionnel) **double validation** selon seuil.
- La Centrale **consolide** mais n'exécute pas les paiements locaux (séparation des rôles).
- Les paiements **carte** et **sous-comptes Canada** par pays sont **suivis par la Centrale**.

## E. Récap NOUVEAU / À ALIGNER / EXISTANT
- **NOUVEAU** : bonus-rules global + awards, écran plafonds retrait, consolidation bonus.
- **À ALIGNER** : dashboard finance (2 soldes, bonus), endpoints withdrawals admin complets.
- **EXISTANT** : commission-rules, franchises, RBAC, configs, settlements, réconciliation, rotation.
