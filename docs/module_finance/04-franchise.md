# 04 — Franchise locale

> Socle : `README.md`. La franchise est l'entité opérationnelle **du pays** : elle gère le compte local Mobile Money, les reversements locaux, les bonus locaux, la trésorerie et la comptabilité locales, et recharge chauffeurs/partenaires.

---

## A. BACKEND

### A.1 Tables
- `franchises` (EXISTANT) : `id`, `country_id` (scoping géographique), `code`, `name`, `legal_name`, `currency` (XOF), `timezone` (Africa/Abidjan), `status`, `metadata`. → **compte local Mobile Money** et **sous-compte Canada (carte)** stockés dans `metadata` (ou colonnes dédiées si formalisé : `local_account_id`, `canada_sub_account_id`).
- `franchise_members` (EXISTANT) : staff de la franchise.
- `franchise_settings` (EXISTANT) : config locale par `setting_type` (general/pricing/dispatch/weather…) → y stocker overrides **plafonds retrait**, **seuils wallet**, etc.
- `franchise_territory_requests` (EXISTANT) : demandes d'extension de territoire.
- `partners` (rattachés via `franchise_id`), `drivers` (via `franchise_id`).
- `wallets` (owner_type='FRANCHISE'), `commission_rules` (scope FRANCHISE), `bonus_rules` (scope FRANCHISE), `withdrawal_requests`, `payouts`, `ledger_entries`.

### A.2 Logiques
| Logique | Détail | Statut |
|---|---|---|
| **Compte local = Mobile Money uniquement** | Les recharges MM créditent le compte local franchise ; les paiements **carte** vont au **sous-compte Canada** du pays (jamais le compte local). | À FORMALISER (routage) |
| **Part de commission franchise** | `franchise_rate` crédite le wallet franchise. | EXISTANT (crédit) |
| **Recharge chauffeurs / partenaires** | `rechargeOwnerWallet(franchiseId, …)` → crédit WITHDRAWABLE du bénéficiaire. | EXISTANT |
| **Reversements locaux** | Partenaires, bonus payables, remboursements, charges locales → sorties du compte local. | EXISTANT (infra) — à activer |
| **Override commission/bonus/plafonds** | Règles locales prioritaires sur le global. | EXISTANT (commission) / NOUVEAU (bonus) |
| **Validation retrait selon seuil** | La franchise valide les retraits sous un seuil ; au-dessus → Admin. | À AJOUTER (seuil paramétrable) |

### A.3 Endpoints (back-office franchise scoped — EXISTANTS)
| Méthode | Endpoint | Rôle |
|---|---|---|
| `GET` | `/v1/franchise/me` | Contexte franchise |
| `GET` | `/v1/franchise/partners` | Partenaires du pays |
| `GET` | `/v1/franchise/drivers` | Chauffeurs du pays |
| `GET` | `/v1/franchise/finance` | Vue finance locale |
| `GET` | `/v1/franchise/finance/commissions` | Ledger commissions |
| `GET` | `/v1/franchise/finance/withdrawals` | Retraits à traiter |
| `GET\|POST` | `/v1/franchise/finance/driver-recharge` | Recharger un chauffeur |
| `GET\|POST` | `/v1/franchise/finance/partner-recharge` | Recharger un partenaire |
| `GET` | `/v1/franchise/finance/driver-transfers` / `partner-transfers` | Transferts wallet |
| `GET` | `/v1/franchise/territory` + `POST /territory/extension-request` | Territoire |
| `GET` | `/v1/franchise/marketing/*`, `/pricing`, `/support/*`, `/ops/*`, `/livemap`, `/clients` | Exploitation locale |

À ajouter : `GET|POST /v1/franchise/finance/bonus-rules` (cf. `01-bonus-engine.md`), `POST /v1/franchise/withdrawals/:id/approve|reject` (selon seuil).

### A.4 Permissions
Rôle scope `FRANCHISE` (`user_roles.scope_ref = franchise_id`) : `franchise.dashboard.view`, `franchise.partners.view`, + finance (`finance.withdrawals.view/approve`, `finance.recharge.create`, `finance.bonus.manage`). **Isolation par `franchise_id`** (via `franchise_members`).

---

## B. BACK-OFFICE FRANCHISE (web)

Écrans :
- **Dashboard franchise** : Mobile Money collecté, recharges wallets, commissions générées/débitées, parts (franchise/partenaire/fiscalité/centrale due), bonus, reversements, retraits, chauffeurs bloqués, wallets insuffisants, solde compte local, paiements en attente.
- **Finance** : ledger commissions, retraits (valider/rejeter sous seuil), recharges chauffeurs/partenaires, transferts.
- **Bonus** : règles locales (override) + campagnes locales + versements (`driver_bonus_awards` du pays).
- **Partenaires & chauffeurs** : liste, statut, modération KYC.
- **Territoire** : zones, demande d'extension.
- **Marketing / pricing / support / ops** : exploitation locale.

> **Le compte local ne reçoit pas les flux carte** (routés vers le sous-compte Canada, suivis par la Centrale). La franchise a une **visibilité comptable** carte mais ne gère pas la trésorerie carte.

---

## C. APP FRONT-END
- La franchise est un acteur **back-office uniquement** (pas d'app mobile dédiée).

---

## D. Règles clés
- Franchise scoping = **par pays** (`country_id`).
- Compte local = **Mobile Money + sorties locales** uniquement.
- Carte = sous-compte Canada (Centrale).
- Overrides locaux (commission/bonus/plafonds) **prioritaires** sur le global, **paramétrables**.

## E. Récap NOUVEAU / À ALIGNER / EXISTANT
- **NOUVEAU** : règles de bonus locales, validation retrait par seuil, formalisation compte local/sous-compte Canada.
- **À ALIGNER** : routage MM vs carte, dashboard finance enrichi (2 soldes).
- **EXISTANT** : franchises, settings, scoped back-office, recharges, territoire, commission overrides.
