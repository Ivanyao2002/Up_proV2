# Module Finance UPJUNOO PRO — Socle transversal

> Document de référence pour **toutes** les équipes (Backend, Back-office, App front-end, Comptabilité).
> Il définit le modèle commun (wallets, commissions, bonus, retraits, traçabilité). Les docs par entité s'y réfèrent.
>
> Règle d'or du projet : **rien n'est en dur, tout est paramétrable** (pourcentages, paliers de bonus, plafonds de retrait, seuils). Et **aucune table n'est dupliquée** : on étend l'existant.

---

## 0. Index des documents

| Fichier | Pour qui | Contenu |
|---|---|---|
| `README.md` (ce doc) | Tous | Modèle des 2 soldes, cascade commission, recharge, retraits, paramétrabilité, ledger, mapping sur l'existant |
| `01-bonus-engine.md` | Backend, Back-office, App | Moteur de bonus hebdomadaire de performance |
| `02-chauffeur.md` | Backend, App chauffeur | Tout le périmètre chauffeur |
| `03-partenaire.md` | Backend, Back-office partenaire | Flotte, recharges, reversements, retraits partenaire |
| `04-franchise.md` | Backend, Back-office franchise | Gestion locale pays |
| `05-admin-centrale.md` | Backend, Back-office admin | Paramétrage global, consolidation |
| `06-comptabilite.md` | Backend, Back-office compta | Ledger, écritures, réconciliation, exports |

---

## 1. Principe métier (à ne jamais casser)

1. Le client paie la course **en cash au chauffeur**. Le chauffeur garde **100 % du cash**. UPJUNOO ne touche pas ce cash.
2. La **commission UPJUNOO** est **prélevée du portefeuille prépayé du chauffeur** après chaque course/mission validée.
3. La répartition de commission (franchise / partenaire / centrale / fiscalité) n'est **comptabilisée que si le prélèvement a réussi** (écriture dans le ledger).
4. Toute opération d'argent est tracée dans le **ledger immuable** (`ledger_entries`) — jamais de suppression, correction uniquement par **extourne**.

---

## 2. Le modèle des DEUX soldes (cœur du système)

Chaque chauffeur (et chaque partenaire) possède **un seul wallet** (`wallets`, déjà existant) mais avec **deux sous-soldes** :

| Sous-solde | Colonne (à ajouter) | Alimenté par | Peut être négatif ? | Retirable ? | Sert à |
|---|---|---|---|---|---|
| **Solde de service (NON-retirable)** — « compte bonus » | `non_withdrawable_balance_xof` | Bonus/crédits **offerts** par UPJUNOO/Admin/Franchise (crédit de bienvenue, crédits de service, promos) | **NON, jamais < 0** | Non | Payer les commissions **en priorité** |
| **Portefeuille RETIRABLE** | `withdrawable_balance_xof` | **Recharges Mobile Money** + **bonus hebdo de performance** | **OUI** (peut descendre sous 0) | Oui (plafonné/jour) | Recevoir l'argent ; payer les commissions quand le solde de service est épuisé ; retraits |

> Le « total affiché » au chauffeur = `non_withdrawable_balance_xof + withdrawable_balance_xof`.
> On conserve la colonne existante `balance_cached_xof` = **total** (maintenue automatiquement) pour la rétro-compatibilité et l'affichage global.

### 2.1 Pourquoi deux soldes ?
- L'argent **offert** par la plateforme (crédit de service) ne doit **pas** pouvoir être retiré → solde non-retirable.
- L'argent que le chauffeur **gagne** (bonus de performance) ou **recharge** lui appartient → solde retirable.
- Les commissions « grignotent » d'abord les crédits offerts (pour ne pas pénaliser le chauffeur), puis son argent.

---

## 3. Cascade de prélèvement de la commission

À chaque course validée, on calcule la commission via `commission_rules` (cf. §6), puis on prélève selon cette **cascade** :

```
commission_a_prelever = montant_commission   (ex. 1 500 F)

ÉTAPE 1 — solde de service (non-retirable) d'abord
  prise_service   = min(commission_a_prelever, non_withdrawable_balance_xof)
  non_withdrawable_balance_xof -= prise_service        (≥ 0 garanti)

ÉTAPE 2 — le reste sur le portefeuille retirable
  reste = commission_a_prelever - prise_service
  withdrawable_balance_xof -= reste                    (PEUT devenir négatif)
```

**Le solde de service ne descend JAMAIS sous 0.** Seul le portefeuille retirable peut être négatif.

### 3.1 Exemple (commission 1 500 F)
- Solde de service = 500 F, retirable = 0 F.
- Étape 1 : on prend 500 du service → service = 0.
- Étape 2 : reste 1 000 → retirable = **−1 000 F**.

### 3.2 Recharge après solde négatif
La recharge va **entièrement sur le portefeuille retirable**. Combler le négatif est automatique (simple addition) :

```
withdrawable_balance_xof += montant_recharge
```
- Retirable = −1 000, recharge 3 000 → retirable = **+2 000** (le déficit de 1 000 est récupéré, il reste 2 000).

### 3.3 Écritures ledger générées (par commission)
Pour une commission qui touche les deux soldes, on écrit **2 lignes de débit** sous le même `txn_id` :

| Ligne | `direction` | `amount_xof` | `balance_bucket` (col. à ajouter) | `entry_type` | `idempotency_key` |
|---|---|---|---|---|---|
| Débit service | `debit` | prise_service | `NON_WITHDRAWABLE` | `ride_commission` | `commission:{svc}:{orderId}:driver_debit:NON_WITHDRAWABLE` |
| Débit retirable | `debit` | reste | `WITHDRAWABLE` | `ride_commission` | `commission:{svc}:{orderId}:driver_debit:WITHDRAWABLE` |

Puis les **crédits** vers les bénéficiaires (centrale/franchise/partenaire/fiscalité) comme aujourd'hui (cf. `postOrderCommissionLedger`).

> Si l'étape 1 prend tout (commission ≤ solde de service), on n'écrit qu'**une** ligne (`NON_WITHDRAWABLE`). Si le solde de service est à 0, on n'écrit qu'**une** ligne (`WITHDRAWABLE`).

---

## 4. Recharge (top-up)

- Canal : **Mobile Money via PayDunya** (existant : `wallet_recharges` + `payment_transactions` + IPN webhook `POST /v1/payments/webhooks/paydunya`).
- Destination : **portefeuille retirable** (`balance_bucket = WITHDRAWABLE`).
- Idempotent (clé `payment_fulfill:{paymentTransactionId}`).
- Le wallet n'est crédité **qu'après confirmation** de l'opérateur (IPN), jamais à l'initiation.
- Le compte local franchise est crédité côté trésorerie (cf. `06-comptabilite.md`).

---

## 5. Retraits & plafonds journaliers (paramétrables)

Le retrait se fait **uniquement depuis le portefeuille RETIRABLE** (jamais le solde de service).

| Acteur | Plafond / jour (par défaut, **paramétrable**) | Table |
|---|---|---|
| **Chauffeur** | **0 → 10 000 XOF / jour** | `withdrawal_requests` (existant) |
| **Partenaire** | **0 → 30 000 XOF / jour** | `withdrawal_requests` (existant) |

Règles :
- Jour = **jour calendaire**, fuseau de la franchise (`Africa/Abidjan` par défaut), reset à 00:00.
- Plafond stocké en config : `system_settings` clé `finance.withdrawal.caps` (défaut global) + override par franchise (`franchise_settings`) + override par entité (drivers/partners `metadata`).
- Contrôle à la création (`createWithdrawal`) : `SUM(montants des retraits du jour en statut pending/approved/processing/paid) + montant_demandé ≤ plafond`.
- Le montant demandé ne peut pas dépasser le **solde retirable disponible** (`withdrawable_balance_xof − retraits en attente`).
- Workflow : `pending → approved (débit ledger atomique) → processing → paid` (ou `rejected`). Le débit du wallet se fait à l'**approbation** (existant : `approveWithdrawalWithDebit`).

---

## 6. Commissions — paramétrables (déjà en place, à aligner)

La table **`commission_rules` existe déjà** et est **paramétrable** (scopes + priorité + dates d'effet). On ne crée **rien de nouveau**, on l'utilise.

### 6.1 Colonnes de paramétrage (existantes)
`franchise_id`, `partner_id`, `zone_id`, `service_type`, `category_code`, `rule_scope` (GLOBAL/FRANCHISE/PARTNER/ZONE/CATEGORY), `calculation_base`, `priority`, `active`, `effective_from`, `effective_to`, et les taux :
`platform_rate`, `franchise_rate`, `partner_rate`, `driver_rate`, `fiscality_rate` (+ équivalents `*_fixed_xof`, `min_driver_gain_xof`, `max_platform_commission_xof`, `toll_excluded`).

### 6.2 Taux par défaut déjà seedés (migration `002`, alignés au cahier des charges)
| Catégorie | platform | franchise | partner | fiscality | **driver** | prélevé |
|---|---|---|---|---|---|---|
| ECO / CONFORT / MOTO / EXPRESS / NATIONALE / défaut | 5,7 % | 3 % | 4 % | 2,3 % | **85 %** | **15 %** |
| CONFORT_PLUS / CARGO / EXPRESS_CARGO | 7,7 % | 3 % | 4 % | 2,3 % | 83 % | 17 % |
| PREMIUM | 8,7 % | 3 % | 4 % | 2,3 % | 82 % | 18 % |

> **Conforme au document** (15 % de base = 5,7 + 3 + 4 + 2,3). Les variantes Confort+/Premium sont des sur-mesures déjà prévus. **Tout est modifiable** depuis le back-office Admin (et par franchise via override).
>
> Le « Charges & R&D 40 % » du cahier des charges n'est **pas** dans le modèle actuel. Il est **optionnel** : si voulu, l'ajouter comme paramètre (`rd_rate`) sur `commission_rules` ou comme ventilation interne de la part Centrale. À décider par l'Admin Finance — **ne pas câbler en dur**.

### 6.3 Sélection de la règle
`postOrderCommissionLedger` choisit la règle active la plus prioritaire correspondant à (service_type, category_code, franchise, partner, zone). **Inchangé.** Le **seul** changement de code = la **cascade des 2 soldes** au moment du débit chauffeur (§3).

---

## 7. Tout est paramétrable — où ?

| Paramètre | Source de config | Override |
|---|---|---|
| Taux de commission | `commission_rules` | par franchise / partner / zone / catégorie / période |
| Paliers de bonus | `bonus_rules` (nouvelle table, cf. `01-bonus-engine.md`) | global → franchise → campagne admin |
| Plafonds de retrait | `system_settings` (`finance.withdrawal.caps`) | franchise (`franchise_settings`) + entité |
| Seuil min. wallet pour dispatch | `system_settings` (`driver.wallet.config`, existant) | franchise |
| Seuils d'alerte solde faible | `system_settings` (`driver.wallet.config`, existant) | franchise |
| Jour de début de semaine bonus | `drivers.bonus_week_start_dow` (défaut = jour d'inscription) | le chauffeur lui-même |

**Aucune valeur monétaire/pourcentage ne doit être en dur dans le code.** Toute lecture passe par la config (avec cache Redis comme l'existant).

---

## 8. Ledger & traçabilité comptable

Source de vérité unique : **`ledger_entries`** (immuable). **Chaque** mouvement d'argent y écrit une ligne (recharge, commission, bonus, retrait, crédit de service, extourne…).

### 8.1 Colonnes existantes (reprises)
`id`, `txn_id`, `wallet_id`, `direction` (debit/credit), `amount_xof`, `entry_type`, `service_type`, `source_type`, `source_id`, `idempotency_key` (UNIQUE), `status`, `posted_at`, `description`, `metadata`, `created_at`.

### 8.2 Colonne à AJOUTER
- **`balance_bucket`** VARCHAR(20) : `WITHDRAWABLE` | `NON_WITHDRAWABLE` → attribue chaque mouvement au bon sous-solde (indispensable pour reconstituer les 2 soldes et pour la compta).

### 8.3 `entry_type` standardisés
`wallet_recharge`, `ride_commission`, `withdrawal`, `performance_bonus`, `service_credit` (crédit offert non-retirable), `welcome_bonus`, `referral_bonus`, `cancellation_fee`, `reversal` (extourne).

### 8.4 Reconstitution des soldes
- `non_withdrawable_balance_xof` = Σ(credits) − Σ(debits) sur `balance_bucket = NON_WITHDRAWABLE`.
- `withdrawable_balance_xof` = Σ(credits) − Σ(debits) sur `balance_bucket = WITHDRAWABLE`.
- Les colonnes `*_balance_xof` sont des **caches** maintenus atomiquement ; le ledger reste la vérité (réconciliation possible à tout moment).

---

## 9. Statuts financiers (alignés au cahier des charges)

Transactions : `INITIATED, PENDING, PROCESSING, SUCCESS, FAILED, CANCELLED, REVERSED, REFUNDED, PARTIALLY_REFUNDED, DISPUTED, RECONCILED, LOCKED, TRANSFERRED, APPROVED, REJECTED`.
Commission : `INSUFFICIENT_WALLET` (info, **ne bloque pas** le prélèvement dans notre modèle car le retirable absorbe), `COMMISSION_PENDING, COMMISSION_DEBITED, COMMISSION_FAILED`.

> Différence avec le PDF : dans le PDF, wallet insuffisant ⇒ blocage et **pas** de prélèvement. Dans **notre** modèle, le prélèvement réussit toujours (le retirable passe négatif), et le chauffeur est **bloqué au dispatch** tant que son total est sous le seuil minimum (cf. `driver.wallet.config`). La commission est donc **toujours recouvrée**.

---

## 10. Mise en conformité de l'existant (no duplicate tables)

### 10.1 Tables RÉUTILISÉES telles quelles
`commission_rules`, `order_commission_allocations`, `wallet_recharges`, `wallet_recharge_batches`, `payment_transactions`, `payment_webhook_events`, `withdrawal_requests`, `payouts`, `settlement_runs`, `franchises`, `franchise_settings`, `partners`, `drivers`, `roles`/`permissions`/`role_permissions`/`user_roles`, `system_settings`.

### 10.2 Tables ÉTENDUES (ALTER, pas de nouvelle table)
| Table | Ajout |
|---|---|
| `wallets` | `withdrawable_balance_xof NUMERIC(15,2) DEFAULT 0`, `non_withdrawable_balance_xof NUMERIC(15,2) DEFAULT 0` (garder `balance_cached_xof` = total) |
| `ledger_entries` | `balance_bucket VARCHAR(20)` |
| `drivers` | `bonus_week_start_dow SMALLINT` (0=dimanche … 6=samedi ; défaut = jour de `created_at`) |
| `withdrawal_requests` | rien si déjà complet ; sinon `destination_type`, `destination_identifier` (déjà présents) |

### 10.3 Tables NOUVELLES (domaine bonus, non dupliquées)
| Table | Rôle |
|---|---|
| `bonus_rules` | Paliers de bonus paramétrables (global / franchise / campagne) |
| `driver_bonus_awards` | Trace d'évaluation + versement hebdo par chauffeur (idempotent) |

### 10.4 RPC à mettre à jour
- **`update_wallet_balance_atomic`** → remplacer/compléter par des fonctions qui ciblent un **bucket** et garantissent le **plancher 0 sur le non-retirable** :
  - `wallet_apply_movement(p_wallet_id, p_bucket, p_delta)` : met à jour le bon sous-solde + `balance_cached_xof`. Refuse de faire passer `non_withdrawable_balance_xof < 0`.
  - `wallet_debit_commission_cascade(p_wallet_id, p_amount)` : applique l'étape 1 puis 2 et **retourne** `{ from_service, from_withdrawable }` (pour écrire les 2 lignes ledger).

### 10.5 Backfill (migration de l'existant « pour le faire revenir sur la ligne »)
1. `UPDATE wallets SET withdrawable_balance_xof = COALESCE(balance_cached_xof,0), non_withdrawable_balance_xof = 0;` (l'argent historique vient de recharges ⇒ retirable).
2. `UPDATE ledger_entries SET balance_bucket = 'WITHDRAWABLE' WHERE balance_bucket IS NULL;` (sauf crédits de service connus → `NON_WITHDRAWABLE`).
3. Vérifier la cohérence : pour chaque wallet, somme ledger par bucket == colonnes cache.

### 10.6 Code à adapter
- `postOrderCommissionLedger` (finance.service.ts) → utiliser la **cascade** (§3) au lieu d'un débit unique.
- `createWithdrawal` → ajouter le **contrôle de plafond/jour** + retrait uniquement sur `withdrawable_balance_xof`.
- `rechargeMyWallet` / `fulfillWalletRecharge` → créditer le bucket `WITHDRAWABLE`.
- **Nouveau** worker bonus (cron) → cf. `01-bonus-engine.md`.

---

## 11. Récapitulatif des tables (vue d'ensemble)

```
wallets (1/owner)            ── EXISTANT, étendu : +withdrawable_balance_xof, +non_withdrawable_balance_xof
ledger_entries (immuable)    ── EXISTANT, étendu : +balance_bucket
commission_rules             ── EXISTANT, paramétrable, déjà aligné
order_commission_allocations ── EXISTANT
wallet_recharges             ── EXISTANT (recharge → bucket WITHDRAWABLE)
withdrawal_requests          ── EXISTANT (+ contrôle plafond/jour, source = WITHDRAWABLE)
payouts / settlement_runs    ── EXISTANT (reversements automatisés, phase ultérieure)
bonus_rules                  ── NOUVEAU (paliers paramétrables)
driver_bonus_awards          ── NOUVEAU (trace hebdo idempotente)
drivers                      ── EXISTANT (+ bonus_week_start_dow)
franchises / franchise_settings / partners / *_members ── EXISTANT
roles / permissions / role_permissions / user_roles    ── EXISTANT (RBAC)
```

---

## 12. Sécurité & audit (rappel transversal)

- Toute opération sensible (crédit/débit manuel, modif taux, validation retrait/reversement, extourne, modif config) → **journalisée** (qui, quand, IP, ancienne/nouvelle valeur, motif) et soumise aux **permissions** (`role_permissions`).
- Idempotence sur **toutes** les écritures d'argent (clé `idempotency_key`).
- Webhooks PayDunya **fail-closed** (signature SHA-512 vérifiée).
- Séparation **Trésorerie** (exécute les mouvements) / **Comptabilité** (constate, classe, verrouille) — cf. `06-comptabilite.md`.
