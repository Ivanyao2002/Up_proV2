# Admin — Comptables & Portail comptabilité (par pays)

> Endpoints réels `/v1` pour : **(A)** l'admin qui **crée/gère un comptable depuis son dashboard**
> (exactement comme il crée une franchise), et **(B)** le **portail comptable** `/v1/compta/*` où le
> comptable suit/gère les finances de **son pays uniquement**.
>
> Retour : [../README.md](../README.md) · Conventions : [../00-CONVENTIONS.md](../00-CONVENTIONS.md) ·
> Auth & portails : [../01-AUTH-PORTAILS.md](../01-AUTH-PORTAILS.md) ·
> Finance admin : [finance.md](finance.md)

**Modèle** : un comptable = un compte de connexion + une ligne `user_roles{ role=ACCOUNTANT, country_id }`.
Il ne possède **aucune entité** (ni franchise ni partenaire) ; son **unique périmètre est le PAYS**, porté
par son rôle. Le pays appliqué côté portail est **toujours dérivé du rôle**, jamais d'un paramètre client.
Il y a **un comptable par pays**.

Montants = entiers **XOF**.

---

## A. Côté ADMIN — créer/gérer un comptable

**Auth** : `authenticate` + `requireAdmin` (tout `/v1/admin/*`).

> ℹ️ Même logique de provisioning que `POST /v1/admin/franchises` : créer le compte de connexion →
> profil → rôle scopé. La seule différence : pas d'entité métier à créer, juste le **pays**.

### `POST /v1/admin/accountants` — Créer un comptable
- **Body** :
  - `email: string` (requis) — identifiant de connexion au portail.
  - `password: string` (requis).
  - `firstName: string` (requis), `lastName: string` (requis).
  - `countryId: uuid` **ou** `countryCode: string` (ex `"CI"`) — **requis** (le pays géré).
  - `phone: string` (optionnel).
- **Réponse `201`** :
  ```json
  {
    "userId": "uuid",
    "portalLoginEmail": "compta.ci@upjunoo.com",
    "country": { "id": "uuid", "code": "CI", "name": "Côte d'Ivoire" },
    "profile": { "...": "profil créé (user_type=ACCOUNTANT)" }
  }
  ```
- **Effets** : compte auth (email confirmé) + profil (`user_type=ACCOUNTANT`, `country_id`) + rôle
  `ACCOUNTANT` rattaché au pays. **Rollback transactionnel** si une étape échoue.
- **Erreurs** : `400 ADMIN_ACCOUNTANT_FIELDS_REQUIRED` (champs manquants),
  `400 ADMIN_ACCOUNTANT_COUNTRY_REQUIRED` (ni countryId ni countryCode),
  `404 COUNTRY_NOT_FOUND`, `400 ADMIN_ACCOUNTANT_AUTH_CREATE_FAILED` (email déjà pris / mdp faible),
  `500 ADMIN_ACCOUNTANT_ROLE_MISSING` (rôle ACCOUNTANT absent en base).

### `GET /v1/admin/accountants` — Liste des comptables
- **Query** : `page`, `limit` (≤100), `search` (email/nom), `countryId` (filtre pays).
- **Réponse** : `{ items[], accountants[], pagination }`. Chaque item :
  `{ userId, email, phone, firstName, lastName, displayName, status, createdAt, country{ id, code, name } }`.

### `GET /v1/admin/accountants/:id` — Détail d'un comptable
- **Path** : `id` = `userId`. **Réponse** : item ci-dessus + `active` + `metadata`.
- **Erreur** : `404 ACCOUNTANT_NOT_FOUND`.

### `POST /v1/admin/accountants/:id/suspend` — Suspendre
- Passe `profiles.status=suspended` → l'accès API est bloqué (`403 ACCOUNT_BLOCKED`). **Réponse** : `{ user }`.

### `POST /v1/admin/accountants/:id/activate` — Réactiver
- Repasse `status=active`. **Réponse** : `{ user }`.

---

## B. Côté COMPTABLE — portail `/v1/compta/*`

**Auth** : `authenticate` + `requireAccountant` (rôle `ACCOUNTANT` **ou** admin).
- Comptable → forcé sur **son** pays (un comptable sans pays rattaché ⇒ `403 ACCOUNTANT_COUNTRY_UNSET`).
- Admin → **tous pays** par défaut, ou un pays précis via `?countryId=<uuid>`.
- Un non-comptable/non-admin ⇒ `403 ACCOUNTANT_REQUIRED`.

> Le portail **réutilise le service finance** : mêmes données que `/v1/admin/ledger` &
> `/v1/admin/accounting/*`, mais **filtrées par pays**.

### `GET /v1/compta/me` — Identité + pays du comptable
- **Réponse (comptable)** : `{ accountant: { userId, email, firstName, lastName, status, country{id,code,name}, active } }`.
- **Réponse (admin)** : `{ admin: { userId, role:"ADMIN", allCountries }, country }`.

### `GET /v1/compta/dashboard` — KPIs comptables du pays
- **Réponse** : `{ period{ label, status, country_id }, entries_today{ credit_xof, debit_xof, count },
  commissions{ debited, pending, failed }, reconciliation{ open_gaps, unjustified_gaps },
  withdrawals_pending_count, wallets_below_dispatch_min, reversals_this_month, generated_at }`.
  Tout est agrégé **sur le pays** du comptable.

### `GET /v1/compta/ledger` — Grand-livre (scopé pays)
- **Query** : `page`, `limit`, `walletId`/`ownerType`+`ownerId`, `entryType`, `bucket`, `serviceType`,
  `direction`, `from`, `to`. **Réponse** : `{ entries[], pagination }`.

### `GET /v1/compta/ledger/export` — Export CSV (scopé pays)
- Mêmes filtres. Réponse `text/csv` (entêtes `x-export-rows`, `x-export-truncated`), plafond 10 000 lignes.

### `GET /v1/compta/ledger/:id` — Détail d'une écriture
- `404 LEDGER_ENTRY_NOT_FOUND` si l'écriture n'est pas dans le pays du comptable (pas de divulgation).
- **Réponse** : `{ entry(+owner, order), owner, order, reversal, original }`.

### `POST /v1/compta/ledger/:id/reverse` — Extourne
- **Body** : `reason: string` (requis). Écriture inverse + marquage `reversed` (aucune suppression).
- `404` si hors pays ; `409 LEDGER_ALREADY_REVERSED` / `400 LEDGER_IS_REVERSAL`.

### `GET /v1/compta/periods` — Périodes comptables du pays
- **Query** : `periodType` (`MONTH`|`DAY`). **Réponse** : `{ periods[] }` (filtrées par pays).

### `POST /v1/compta/periods/close` — Clôturer une période
- **Body** : `period` (ex `"2026-06"`, requis), `periodType` (`MONTH` défaut). La période est **scopée pays**
  (le `franchiseId` éventuel est ignoré). **Réponse** : `{ period }`.
- `409 PERIOD_ALREADY_CLOSED` / `409 PERIOD_LOCKED`.

### `GET /v1/compta/periods/:id` — Détail + contrôles de clôture
- **Réponse** : `{ period, checks{ open_cash_reconciliations, unjustified_gaps, open_withdrawals } }`.
  `404` si la période n'est pas dans le pays du comptable.

### `POST /v1/compta/periods/:id/lock` — Verrouillage définitif
- **Body** : `force: boolean` (défaut `false`). Bloqué s'il reste des écarts non justifiés / retraits ouverts
  (sauf `force=true`). **Réponse** : `{ period, status, checks, blocked, blockers[], forced }`.

---

## Notes d'intégration front
- Le dashboard admin **réutilise le même formulaire que « créer une franchise »** (email + mdp + nom +
  prénom), en remplaçant la ville/franchise par un **sélecteur de pays** → `POST /v1/admin/accountants`.
- Le portail comptable est un **portail distinct** (login email/mdp du comptable) ; il n'a **jamais** de
  token admin et ne voit que les routes `/v1/compta/*`.
- Référentiel pays : `GET /v1/catalog/countries` (codes/uuid) pour alimenter le sélecteur.
- Visible dans Swagger : tag **`09b - Comptabilité (portail)`** (routes `/compta`) et **`11 - Admin`**
  (routes `/admin/accountants`). Spec JSON : `GET /docs/json`.
