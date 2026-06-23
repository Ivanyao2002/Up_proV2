# 02 — Chauffeur (Driver)

> Socle : `README.md`. Bonus : `01-bonus-engine.md`.
> Le chauffeur est l'acteur central : il reçoit le cash, recharge son wallet, paie les commissions, gagne des bonus, et peut retirer son argent retirable.

---

## A. BACKEND

### A.1 Tables
- `drivers` (EXISTANT) : `id`, `user_id`, `partner_id` (NOT NULL), `franchise_id`, `city_id`, `driver_code`, `status` (pending/approved/suspended/banned), `availability_status` (offline/online/busy), `allowed_service_types`, `allowed_ride_category_codes`, `wallet_id`, métriques (`rating_avg`, `completion_rate`…). **Ajout** : `bonus_week_start_dow`.
- `wallets` (EXISTANT, owner_type='DRIVER') : **2 sous-soldes** `non_withdrawable_balance_xof` (service/offert) + `withdrawable_balance_xof` (retirable) + `balance_cached_xof` (total). Cf. socle §2.
- `ledger_entries`, `commission_rules`, `order_commission_allocations`, `wallet_recharges`, `withdrawal_requests`, `driver_bonus_awards` (cf. socle + bonus).

### A.2 Logiques clés
| Logique | Détail | Statut |
|---|---|---|
| **Débit commission** | Cascade 2 soldes (service d'abord, puis retirable qui peut passer négatif). `postOrderCommissionLedger`. | **À ALIGNER** (aujourd'hui débit unique) |
| **Recharge** | Mobile Money/PayDunya → crédit **WITHDRAWABLE**. Crédité après IPN. | **À ALIGNER** (bucket) |
| **Retrait** | Depuis **WITHDRAWABLE** uniquement, **plafond 0–10 000 XOF/jour** (paramétrable). | **À AJOUTER** (cap) |
| **Bonus hebdo** | Crédité **WITHDRAWABLE**, palier max atteint. | **NOUVEAU** |
| **Accès dispatch** | Bloqué si total < seuil min (`driver.wallet.config`, existant). Le chauffeur reste prélevable même négatif, mais ne reçoit plus de courses tant qu'il ne recharge pas. | EXISTANT (seuil) |
| **Frais d'annulation** | Débit via `chargeWalletFee` (cascade aussi). | À ALIGNER (cascade) |

### A.3 Endpoints (existants + à ajouter)
| Méthode | Endpoint | Rôle | Statut |
|---|---|---|---|
| `GET` | `/v1/wallets/me` | Solde (renvoyer **les 2 soldes** + total + pending retrait) | À ALIGNER |
| `GET` | `/v1/wallets/me/ledger` | Historique mouvements (avec `balance_bucket`) | À ALIGNER |
| `POST` | `/v1/wallets/me/recharge` | Initier recharge MM (→ checkout PayDunya) | EXISTANT |
| `GET` | `/v1/wallets/recharges/me` | Historique recharges | EXISTANT |
| `POST` | `/v1/withdrawals` | Demander un retrait (contrôle solde retirable + **plafond/jour**) | À ALIGNER |
| `GET` | `/v1/withdrawals` | Mes demandes de retrait | EXISTANT |
| `GET` | `/v1/earnings/driver/me` | Gains (cash reçu, commissions, bonus, net) | EXISTANT |
| `GET` | `/v1/commissions/orders/:serviceType/:orderId` | Détail commission d'une course | EXISTANT |
| `GET` | `/v1/drivers/me/bonus` | Statut bonus semaine | NOUVEAU |
| `PUT` | `/v1/drivers/me/bonus/settings` | Régler jour de début de semaine | NOUVEAU |
| `GET` | `/v1/receipts/:id` | Reçu de transaction | EXISTANT |

### A.4 Permissions
- Rôle `DRIVER` : `driver.orders.view` (+ scopes finance « ses données » uniquement). **Jamais** d'accès aux données d'un autre chauffeur (IDOR : le wallet est toujours résolu depuis l'utilisateur authentifié).

---

## B. BACK-OFFICE (vu par Franchise / Partenaire / Admin)

Le chauffeur **n'a pas** de back-office. Il est **géré/visualisé** par d'autres acteurs :

| Écran | Qui | Endpoint | Permission |
|---|---|---|---|
| Fiche chauffeur (profil, KYC, statut, wallet) | Admin, Franchise, Partenaire (ses chauffeurs) | `/v1/admin/drivers/:id`, `/v1/franchise/drivers/:id`, `/v1/partner/drivers/:id` | `fleet.drivers.view` / scope |
| Wallet & ledger du chauffeur | Admin, Franchise, Partenaire | `/v1/admin/finance/wallets?owner=DRIVER&id=…` | `finance.*.view` |
| Recharger le wallet d'un chauffeur | Franchise, Partenaire (ses chauffeurs) | `POST /v1/franchise/finance/driver-recharge` (EXISTANT) ; `POST /v1/partner/drivers/:id/recharge` (À AJOUTER) | `finance.recharge.create` |
| Valider/rejeter un retrait | Franchise (selon seuil), Admin | `POST /v1/admin/withdrawals/:id/approve|reject` | `finance.withdrawals.approve` |
| Bonus du chauffeur | Admin, Franchise | `/v1/admin/bonus-awards?driver=…` | `finance.bonus.view` |

> **Recharge par recharge offerte (crédit de service non-retirable)** : un crédit offert (bienvenue, geste commercial) se fait via une écriture `entry_type='service_credit'`, `balance_bucket='NON_WITHDRAWABLE'`, soumise à permission + audit.

---

## C. APP FRONT-END (App Chauffeur)

### C.1 Écran « Portefeuille »
Afficher **clairement séparés** :
- **Solde retirable** (gros chiffre) + bouton **Retirer**.
- **Solde de service (non-retirable)** + libellé « sert à payer les commissions, non retirable ».
- **Total**.
- Indicateur si solde retirable **négatif** (ex. « −1 000 F à régulariser, rechargez »).
- Statut compte : **Actif / Bloqué** (si total < seuil dispatch).

### C.2 Recharge
- Choix opérateur (Orange/Wave/MTN/Moov via PayDunya), saisie montant → redirection checkout.
- Message : « La recharge va sur votre **portefeuille retirable** et règle d'abord tout solde négatif. »
- Statut en attente jusqu'à confirmation opérateur (IPN).

### C.3 Historique des courses (obligatoire — cahier des charges)
Pour chaque course, afficher **ligne par ligne** :
| Élément | Valeur |
|---|---|
| Montant course | payé par le client |
| Cash reçu | 100 % au chauffeur |
| Solde **avant** commission | (service + retirable) |
| Commission prélevée | dont part service / part retirable |
| Solde **après** commission | |
| Statut | Réussi / Incident |

### C.4 Retrait
- Saisie montant (≤ solde retirable disponible, **≤ plafond restant du jour 10 000 F**).
- Affichage du **plafond restant aujourd'hui**.
- Choix destination Mobile Money. Suivi du statut (pending → payé / rejeté).

### C.5 Bonus
- Cf. `01-bonus-engine.md` §8 (progression vers palier, jour de début, historique, push).

### C.6 Alertes & notifications
`recharge réussie/échouée`, `commission débitée`, `solde faible`, `solde insuffisant / compte bloqué`, `recharge obligatoire`, `bonus reçu`, `retrait validé/rejeté`.

### C.7 Règles UX transversales
- Ne **jamais** mélanger « cash reçu » et « solde wallet » (3 notions distinctes : cash, recharge, commission).
- Toujours montrer que la commission **n'est pas** prise sur le cash mais sur le wallet.
- Le bonus est **retirable** ; le crédit de service ne l'est pas.

---

## D. Récap NOUVEAU / À ALIGNER / EXISTANT (chauffeur)
- **NOUVEAU** : bonus hebdo, réglage jour de semaine, affichage 2 soldes.
- **À ALIGNER** : cascade commission, bucket recharge, plafond retrait, `/wallets/me` renvoie 2 soldes.
- **EXISTANT** : recharge PayDunya, withdrawal workflow, earnings, commission par course, seuil dispatch.
