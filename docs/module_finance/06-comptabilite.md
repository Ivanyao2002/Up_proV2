# 06 — Comptabilité (Back-office comptable)

> Socle : `README.md`. La Comptabilité **constate, classe, rapproche et verrouille** les écritures. Elle **n'exécute pas** les paiements (séparation Trésorerie/Comptabilité). **Toute** transaction doit être tracée ici.

---

## A. BACKEND

### A.1 Source de vérité : `ledger_entries` (immuable)
- **Toute** opération d'argent y écrit une (ou plusieurs) ligne(s) sous un `txn_id` commun.
- **Aucune suppression** ; correction = **extourne** (`entry_type='reversal'`, écriture inverse).
- Colonnes (cf. socle §8) + **ajout `balance_bucket`** (`WITHDRAWABLE` / `NON_WITHDRAWABLE`) pour rattacher chaque mouvement au bon sous-solde.

### A.2 Écritures type — course cash (commission prélevée)
Pour une course validée, commission C, dont prise service Cs et prise retirable Cr (C = Cs + Cr) :

| Compte (wallet/owner) | direction | montant | bucket | entry_type |
|---|---|---|---|---|
| Chauffeur (WS-CH) | debit | Cs | NON_WITHDRAWABLE | ride_commission |
| Chauffeur (WS-CH) | debit | Cr | WITHDRAWABLE | ride_commission |
| Centrale (PLATFORM) | credit | platform + fiscalité | — | ride_commission |
| Franchise | credit | part franchise | — | ride_commission |
| Partenaire | credit | part partenaire | bucket WITHDRAWABLE | ride_commission |

> Équilibre : Σ débits chauffeur = Σ crédits bénéficiaires (= commission). Idempotence par `idempotency_key`.

### A.3 Autres écritures
| Opération | direction / bucket | entry_type |
|---|---|---|
| Recharge MM | credit / WITHDRAWABLE | wallet_recharge |
| Crédit de service offert | credit / NON_WITHDRAWABLE | service_credit / welcome_bonus |
| Bonus hebdo | credit / WITHDRAWABLE | performance_bonus |
| Retrait (à l'approbation) | debit / WITHDRAWABLE | withdrawal |
| Frais d'annulation | debit (cascade) | cancellation_fee |
| Extourne | inverse | reversal |

### A.4 Réconciliation (EXISTANT à étendre)
- `payment-reconciliation.service.ts` : rapproche `payment_transactions` ↔ statut PayDunya réel (jobs sur paiements bloqués > 2 min), puis fulfillment idempotent.
- `cash_reconciliations` (table + endpoints `/v1/cash-reconciliations`) : rapprochement cash.
- **Réconciliation locale Mobile Money** : relevé MM ↔ compte local franchise ↔ ledger franchise (matching référence/montant/date).
- **Réconciliation Centrale carte** : relevé sous-compte Canada ↔ transactions carte ↔ ledger central pays (matching référence/pays/devise).
- Écarts → anomalie → justification obligatoire → **verrouillage** de période.

### A.5 Endpoints comptables
| Méthode | Endpoint | Statut |
|---|---|---|
| `GET` | `/v1/admin/finance/transactions` / `wallets` / `commissions` | EXISTANT |
| `GET` | `/v1/admin/finance/reconciliation` | EXISTANT |
| `GET` | `/v1/franchise/finance/commissions` | EXISTANT |
| `GET` | `/v1/cash-reconciliations[/:id]`, `POST` | EXISTANT |
| `GET` | `/v1/admin/ledger` (consultation ledger filtrée) | À AJOUTER |
| `POST` | `/v1/admin/accounting/periods/close` | À AJOUTER |
| `POST` | `/v1/admin/accounting/entries/:id/reverse` (extourne) | À AJOUTER |
| `POST` | `/v1/admin/accounting/entries/export` (exports comptables) | À AJOUTER |

### A.6 Permissions (séparation des rôles)
Rôle **Comptabilité** : `finance.ledger.view`, `accounting.entries.classify`, `accounting.periods.close`, `accounting.export`, `accounting.reverse`. **PAS** : exécution de paiement, modification de wallet, modification de taux. (La **Trésorerie** exécute les mouvements ; la Comptabilité constate.)

---

## B. BACK-OFFICE COMPTABLE (web)

### Écrans
- **Ledger** : toutes les écritures, filtres par nature (`entry_type`), période, franchise, chauffeur, partenaire, **bucket**.
- **Écritures par nature / période / franchise** : commissions, bonus, recharges, retraits, reversements, fiscalité, charges, extournes.
- **Réconciliation** : MM locale + carte Canada, statut (en cours / validé / rejeté), écarts à justifier.
- **Clôtures** : journalières & mensuelles, **verrouillage** des périodes validées.
- **Exports comptables** : CSV/Excel par période/franchise.
- **Extournes** : création d'écriture inverse (motif + justificatif obligatoires, double validation pour montants sensibles).
- **Dashboard compta** : écritures en attente/validées/verrouillées, opérations extournées, taxes à déclarer, provisions, écarts non justifiés.

### Contrôles quotidiens / mensuels (à exposer)
- Quotidiens : recharges confirmées/créditées, commissions calculées/débitées/échouées, wallets insuffisants, retraits, reversements, frais, doublons, transactions en attente, écarts de solde, chauffeurs bloqués, incidents commission.
- Mensuels : totaux (recettes brutes, cash reçu, recharges, commissions débitées, parts, fiscalité, bonus), soldes wallets/bancaires, écritures non rapprochées, clôtures, exports, transferts Centrale, anomalies non résolues.

---

## C. APP FRONT-END
- Acteur **back-office uniquement**.

---

## D. Règles clés (traçabilité — exigence forte)
- **Toute** transaction (recharge, commission, bonus, retrait, crédit de service, frais, extourne) **écrit dans `ledger_entries`** → rien hors ledger.
- **Immuabilité** : jamais d'UPDATE/DELETE sur une écriture validée ; correction = extourne.
- Chaque écriture porte : ID course/chauffeur/partenaire/franchise/pays, montant brut, cash reçu, solde avant/après, règle appliquée, **bucket**, statut, source, déclencheur (cf. socle §8).
- **Séparation** Trésorerie (exécute) / Comptabilité (constate, classe, verrouille).
- Réconciliation **obligatoire** avant clôture ; écarts **justifiés** ; périodes **verrouillées**.

## E. Récap NOUVEAU / À ALIGNER / EXISTANT
- **NOUVEAU** : `balance_bucket` sur ledger, endpoints ledger/clôture/extourne/export, écritures bonus & crédit de service.
- **À ALIGNER** : écriture commission en 2 lignes (cascade), réconciliation MM/carte formalisée.
- **EXISTANT** : `ledger_entries`, réconciliation paiements, cash_reconciliations, finance admin/franchise.
