# Création d'un compte partenaire avec **email + mot de passe** (et connexion)

> **Date :** 2026-06-16
> **Émetteur :** équipe backend UpJunoo
> **Pour :** front backoffice admin + portail franchise
> **Sujet :** créer un partenaire **avec identifiants de connexion** (email + mot de passe), puis se connecter au portail partenaire avec ces mêmes identifiants.
> **Base de vérité :** code source `upjunoo-backend` (branche `security/hardening`)

---

## 1. Le problème constaté

> « Le backoffice ne voit pas l'attribut pour la création du mail + mot de passe du partenaire. »

C'est un **manque côté formulaire front**, **pas** un manque backend. Le backend **exige déjà** `email` + `password` à la création d'un partenaire. Tant que le formulaire backoffice n'envoie pas ces deux champs, l'appel échoue avec :

```json
{ "error": { "code": "PARTNER_CONTACT_EMAIL_REQUIRED", "message": "email is required to provision the partner login account" } }
```
ou
```json
{ "error": { "code": "PARTNER_PASSWORD_REQUIRED", "message": "password is required to provision the partner login account" } }
```

**→ Action front : ajouter un champ `email` et un champ `password` (mot de passe) au formulaire de création partenaire, et les envoyer dans le body.**

---

## 2. Comment ça marche (vue d'ensemble)

```
[Admin / Franchise]                         [Backend]                       [Partenaire]
      │                                          │                                │
      │  POST /v1/partners                       │                                │
      │  { legalName, email, password, ... }     │                                │
      │─────────────────────────────────────────▶                                │
      │                                          │ 1. crée user Auth (PARTNER_USER)│
      │                                          │ 2. crée l'entité partner        │
      │                                          │ 3. crée le profil               │
      │                                          │ 4. assigne rôle PARTNER_ADMIN   │
      │  201 { partner, account:{userId,         │                                │
      │        loginEmail} }                      │                                │
      ◀──────────────────────────────────────────                                │
      │                                          │                                │
      │   (on communique email + mot de passe au partenaire)                      │
      │ ─────────────────────────────────────────────────────────────────────────▶
      │                                          │   POST /v1/auth/partner/login   │
      │                                          │   { email, password }           │
      │                                          ◀─────────────────────────────────
      │                                          │   200 { session, role, ... }    │
      │                                          │─────────────────────────────────▶
```

La création est **atomique** : si une étape échoue (email déjà pris, etc.), tout est annulé (rollback complet, pas de compte ni d'entité orphelins).

Réf. code : [partners.routes.ts](src/modules/partners/partners.routes.ts#L42) → [partners.service.ts `createPartnerWithAccount`](src/modules/partners/partners.service.ts#L491).

---

## 3. Endpoint de **création** : `POST /v1/partners`

- **Auth :** Bearer token d'un admin (ou franchise) connecté.
- **Effet :** crée un **utilisateur Auth `PARTNER_USER`** (`email_confirm: true`, donc connectable **immédiatement**, pas de mail de confirmation à valider), l'entité `partners` (ce nouvel utilisateur en est l'`owner`), le profil, et le rôle `PARTNER_ADMIN`.

### Champs du body

| Champ (camelCase) | Alias acceptés | Obligatoire | Type | Note |
|-------------------|----------------|-------------|------|------|
| `legalName` | `legal_name`, `name`, `tradeName`, `trade_name` | **Oui** | string | Raison sociale / nom du partenaire |
| **`email`** | `contactEmail`, `contact_email` | **Oui** | string | **Login du portail partenaire** |
| **`password`** | `adminPassword`, `admin_password` | **Oui** | string | **Min. 6 caractères**. Mot de passe de connexion |
| `phone` | `contactPhone`, `contact_phone` | Non | string | Téléphone contact (et du compte Auth) |
| `firstName` | `first_name`, `adminFirstName`, `admin_first_name` | Non | string | Prénom du gérant |
| `lastName` | `last_name`, `adminLastName`, `admin_last_name` | Non | string | Nom du gérant |
| `franchiseId` | `franchise_id` | Non | string | Rattachement franchise |
| `cityId` | `city_id` | Non | string | Ville |
| `tradeName` | `trade_name` | Non | string | Nom commercial (défaut = `legalName`) |
| `partnerType` | `partner_type` | Non | enum | `FLEET` (défaut) \| `FREIGHT` \| `RENTAL` \| `MIXED` |
| `commissionRate` | `commission_rate` | Non | number | Commission par défaut |
| `address` | — | Non | string | Adresse |
| `taxId` | `tax_id` | Non | string | NIF |
| `registrationNumber` | `registration_number` | Non | string | RCCM |
| `metadata` | — | Non | object | Métadonnées libres |

> ⚠️ **Les 3 champs en gras (`legalName`, `email`, `password`) sont bloquants.** Tout le reste est optionnel.

### Exemple — requête

```http
POST /v1/auth/partner/login HTTP/1.1   ← (login, voir §4)

POST /v1/partners HTTP/1.1
Authorization: Bearer <token-admin>
Content-Type: application/json

{
  "legalName": "Transport Kouassi SARL",
  "email": "partenaire.kouassi@upjunoo.com",
  "password": "Partenaire@2026",
  "phone": "+2250700000000",
  "firstName": "Jean",
  "lastName": "Kouassi",
  "franchiseId": "9b1f…",
  "cityId": "3a2c…",
  "partnerType": "FLEET"
}
```

### Exemple — réponse `201`

```json
{
  "partner": {
    "id": "uuid-partner",
    "legal_name": "Transport Kouassi SARL",
    "trade_name": "Transport Kouassi SARL",
    "owner_user_id": "uuid-user",
    "franchise_id": "9b1f…",
    "city_id": "3a2c…",
    "partner_type": "FLEET",
    "contact_email": "partenaire.kouassi@upjunoo.com",
    "contact_phone": "+2250700000000",
    "status": "pending",
    "created_at": "2026-06-16T…"
  },
  "account": {
    "userId": "uuid-user",
    "loginEmail": "partenaire.kouassi@upjunoo.com"
  }
}
```

➡️ **`account.loginEmail`** est l'identifiant que le partenaire utilisera pour se connecter. Le mot de passe est celui envoyé dans la requête (à communiquer au partenaire de façon sécurisée).

### Erreurs possibles

| Code | HTTP | Cause |
|------|------|-------|
| `PARTNER_LEGAL_NAME_REQUIRED` | 400 | `legalName` manquant |
| `PARTNER_CONTACT_EMAIL_REQUIRED` | 400 | `email` manquant |
| `PARTNER_PASSWORD_REQUIRED` | 400 | `password` manquant |
| `PARTNER_PASSWORD_TOO_SHORT` | 400 | mot de passe < 6 caractères |
| `PARTNER_AUTH_CREATE_FAILED` | 400 | email déjà utilisé / création compte Auth refusée |
| `AUTH_REQUIRED` | 401 | appelant non authentifié |

---

## 4. Endpoint de **connexion** : `POST /v1/auth/partner/login`

Le partenaire (ou le portail partenaire) se connecte avec **email + mot de passe**.

- **Auth :** public (c'est l'endpoint de login lui-même).
- **Body :**

| Champ | Obligatoire | Note |
|-------|-------------|------|
| `email` | **Oui** *(ou `phone`)* | L'email de connexion (= `account.loginEmail`) |
| `password` | **Oui** | Le mot de passe défini à la création |

> Variante : on peut se connecter avec `{ phone, password }` (l'email est résolu côté serveur). Et `POST /v1/auth/login` (sans `/partner`) accepte aussi `email + password` sans préciser le rôle.

### Exemple — requête

```http
POST /v1/auth/partner/login HTTP/1.1
Content-Type: application/json

{
  "email": "partenaire.kouassi@upjunoo.com",
  "password": "Partenaire@2026"
}
```

### Exemple — réponse `200`

```json
{
  "role": "PARTNER_USER",
  "userType": "PARTNER_USER",
  "permissions": [ "…" ],
  "session": {
    "access_token": "eyJ…",
    "refresh_token": "…",
    "expires_at": 1718…,
    "token_type": "bearer"
  },
  "profile": { "user_type": "PARTNER_USER", "email": "partenaire.kouassi@upjunoo.com" },
  "partner": { "id": "uuid-partner", "legal_name": "Transport Kouassi SARL" }
}
```

➡️ Le front stocke `session.access_token` et l'envoie en `Authorization: Bearer …` sur les appels suivants.

### Erreurs possibles

| Code | HTTP | Cause |
|------|------|-------|
| `AUTH_LOGIN_INVALID` | 400 | `email` (ou `phone`) et/ou `password` manquant |
| `AUTH_LOGIN_FAILED` | 401 | identifiants invalides |

---

## 5. Ce que le front doit faire (checklist)

- [ ] **Formulaire création partenaire** : ajouter un champ **Email** et un champ **Mot de passe** (+ confirmation conseillée).
- [ ] Envoyer `email` et `password` (≥ 6 caractères) dans le body de `POST /v1/partners`, en plus de `legalName`.
- [ ] À la réussite, afficher / communiquer `account.loginEmail` + le mot de passe saisi.
- [ ] **Portail partenaire** : écran de connexion → `POST /v1/auth/partner/login` avec `{ email, password }`, puis stocker `session.access_token`.
- [ ] Gérer les codes d'erreur `PARTNER_*` (création) et `AUTH_LOGIN_*` (connexion) ci-dessus.

---

## 6. Notes & recommandations

- **Pas de mail de confirmation** : le compte est créé avec `email_confirm: true` → le partenaire peut se connecter **dès la création**.
- **Force du mot de passe** : minimum **6 caractères** côté backend (règle actuelle). Le front peut imposer une règle plus stricte (ex. ≥ 8, majuscule/chiffre) côté UI.
- **Mot de passe oublié** : un flow de reset existe (`POST /v1/auth/password/forgot` avec `{ email }`). À utiliser plutôt que de recréer un compte.
- **Symétrie franchise** : ce comportement est identique à la création de franchise (`POST /v1/admin/franchises`), qui exige aussi `adminPassword`. Le partenaire suit le même modèle « entité + compte portail créés ensemble ».
- **Sécurité** : transmettre le mot de passe initial au partenaire par un canal sûr ; idéalement, prévoir à terme un flow d'invitation (lien / OTP) plutôt qu'un mot de passe en clair saisi par l'admin. *(évolution backend possible — à arbitrer)*

---

*Document généré à partir du code source (branche `security/hardening`). Le code fait foi ; le Swagger sera resynchronisé sur ce contrat.*
