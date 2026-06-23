# 03 — Partenaire opérationnel (Fleet)

> Socle : `README.md`. Le partenaire supervise une **flotte** de chauffeurs rattachés, peut recharger leurs wallets, reçoit une **part de commission**, demande des **reversements**, et peut **retirer** (plafond 30 000 F/jour).

---

## A. BACKEND

### A.1 Tables
- `partners` (EXISTANT) : `id`, `franchise_id` (rattachement), `partner_type` (FLEET/RENTAL/FREIGHT/MIXED), `status` (pending/active/suspended/archived), `accepting_drivers`, et colonnes commission/payout : `commission_ride_pct`, `payout_scheduled_pct`, `payout_instant_pct`, `reload_pct`, `metadata`.
- `partner_members` (EXISTANT) : utilisateurs rattachés au partenaire (staff).
- `drivers.partner_id` (EXISTANT, NOT NULL) : rattachement chauffeur→partenaire.
- `driver_assignment_rotation` + vue `partner_driver_rotation_status` (EXISTANT) : rotation d'attribution des chauffeurs.
- `wallets` (owner_type='PARTNER') : **2 sous-soldes** comme le chauffeur. La **part de commission partenaire** est créditée sur le bucket **WITHDRAWABLE** (argent dû au partenaire).
- `withdrawal_requests`, `payouts`, `settlement_runs`, `ledger_entries` (EXISTANT).

### A.2 Logiques
| Logique | Détail | Statut |
|---|---|---|
| **Part de commission** | À chaque course d'un chauffeur rattaché, `partner_rate` (commission_rules) crédite le wallet partenaire (bucket WITHDRAWABLE). | EXISTANT (crédit) — vérifier bucket |
| **Recharge de ses chauffeurs** | Le partenaire recharge le wallet de ses chauffeurs rattachés (crédit WITHDRAWABLE du chauffeur). Recharge groupée = 1 transaction mère + N filles. | **À AJOUTER** (endpoint partner-level ; existant côté franchise) |
| **Reversement partenaire** | Versement de la part due vers le partenaire (depuis compte local franchise). | EXISTANT (infra payouts/settlement) — à activer |
| **Retrait partenaire** | Depuis WITHDRAWABLE, **plafond 0–30 000 XOF/jour** (paramétrable). | **À AJOUTER** (cap) |
| **Rattachement** | Un partenaire n'agit **que** sur ses chauffeurs (`drivers.partner_id = partner.id`). | EXISTANT |

### A.3 Endpoints (back-office partenaire scoped + à ajouter)
| Méthode | Endpoint | Rôle | Statut |
|---|---|---|---|
| `GET` | `/v1/partner/me` | Contexte partenaire | EXISTANT |
| `GET` | `/v1/partner/drivers` | Ses chauffeurs | EXISTANT |
| `GET` | `/v1/partner/orders` | Courses de sa flotte | EXISTANT |
| `GET` | `/v1/partner/dashboard` | Tableau de bord | EXISTANT |
| `GET` | `/v1/partner/revenue` | Revenus / part de commission | EXISTANT |
| `GET` | `/v1/partner/wallet` | Son wallet (2 soldes) | À ALIGNER (2 soldes) |
| `POST` | `/v1/partner/drivers/:id/recharge` | Recharger un chauffeur rattaché | NOUVEAU |
| `POST` | `/v1/partner/recharge-batches` | Recharge groupée (mère + filles) | NOUVEAU |
| `POST` | `/v1/partner/withdrawals` | Demander un retrait (cap 30k/j) | NOUVEAU |
| `GET` | `/v1/partner/withdrawals` | Ses retraits | NOUVEAU |
| `POST` | `/v1/partner/reversements` | Demander un reversement de sa part | NOUVEAU (ou via withdrawal) |

### A.4 Permissions
Rôle `PARTNER_USER` (scope `PARTNER`, `user_roles.scope_ref = partner_id`) : `partner.dashboard.view`, `partner.drivers.view`, `partner.revenue.view` (+ à ajouter `partner.recharge.create`, `partner.withdrawals.create`). Isolation stricte par `partner_id`.

---

## B. BACK-OFFICE PARTENAIRE (web)

Le partenaire est principalement un utilisateur **back-office** (gestionnaire de flotte). Écrans :

| Écran | Endpoint | Permission |
|---|---|---|
| Dashboard flotte (courses, revenus, chauffeurs actifs/bloqués) | `/v1/partner/dashboard` | `partner.dashboard.view` |
| Mes chauffeurs (statut, solde wallet, performance) | `/v1/partner/drivers` | `partner.drivers.view` |
| Recharger un / plusieurs chauffeurs | `/v1/partner/drivers/:id/recharge`, `/recharge-batches` | `partner.recharge.create` |
| Mes revenus / part de commission (par chauffeur, période) | `/v1/partner/revenue` | `partner.revenue.view` |
| Mon wallet (solde retirable / service), demandes de retrait | `/v1/partner/wallet`, `/v1/partner/withdrawals` | `partner.wallet.view` |
| Demande de reversement | `/v1/partner/reversements` | `partner.payout.request` |
| Bonus locaux (si campagne partenaire) | `/v1/franchise|admin/bonus-rules` (lecture) | `finance.bonus.view` |

**Visibilité franchise** : la franchise voit toutes les recharges et reversements de ses partenaires (cf. `04-franchise.md`).

---

## C. APP FRONT-END

- Le partenaire utilise principalement le **back-office web**. Une app dédiée n'est pas requise en phase 1.
- Si une app partenaire existe (staff terrain) : mêmes écrans que le back-office (dashboard flotte, recharge d'un chauffeur, suivi revenus, retrait).

---

## D. Règles clés
- Le partenaire **ne recharge que ses chauffeurs rattachés**.
- Les recharges groupées produisent **une transaction mère + des transactions filles** (toutes au ledger).
- Chaque mouvement est **journalisé** ; la franchise a la visibilité.
- Le retrait partenaire sort du **WITHDRAWABLE** uniquement, **plafonné 30 000 F/jour** (paramétrable).

## E. Récap NOUVEAU / À ALIGNER / EXISTANT
- **NOUVEAU** : recharge de ses chauffeurs (endpoint partner-level), retraits partenaire + cap 30k/j, reversement self-service.
- **À ALIGNER** : wallet partenaire en 2 soldes, part de commission sur bucket WITHDRAWABLE.
- **EXISTANT** : partners, rattachement chauffeurs, rotation, dashboard/revenue scoped, infra payouts.
