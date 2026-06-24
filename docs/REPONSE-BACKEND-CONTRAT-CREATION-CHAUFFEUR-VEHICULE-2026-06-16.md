# Réponse backend — Contrat unifié création franchise + partenaire + chauffeur + véhicule

> **Date :** 2026-06-16
> **Émetteur :** équipe backend UpJunoo
> **En réponse à :** `DEMANDE-BACKEND-CONTRAT-CREATION-CHAUFFEUR-VEHICULE.md` (front admin + portail partenaire)
> **Base de vérité :** code source `upjunoo-backend` (branche `security/hardening`, commit `913804c`)
> **Swagger :** https://api.upjunoo-dev.tech/docs

---

## 0. TL;DR — décisions backend

| Sujet | Décision |
|-------|----------|
| **Casse JSON** | camelCase **canonique**. Les alias snake_case sont **acceptés en entrée partout** (tolérance legacy), mais les **réponses sortent en snake_case** (colonnes DB). À terme on documente camelCase, on garde snake_case en lecture. |
| **Identifiants véhicule** | **Codes catalogue** (`brandCode`, `modelCode`, `colorCode`, `categoryCode`) via `POST /v1/vehicles`. Le texte libre n'existe que sur la route partenaire historique → à abandonner côté front. |
| **Email chauffeur** | **Optionnel / supprimable.** L'identité chauffeur est la **téléphone (E.164)**. Plus besoin du placeholder. |
| **Password chauffeur** | **À retirer du payload backoffice.** Aucun champ `password` n'est lu par `POST /v1/partners/{id}/drivers`. Le mot de passe se définit plus tard via OTP (`verify-otp`). |
| **OTP** | Preuve **Redis, TTL 5 min, usage unique**, liée au numéro. Elle **n'autorise pas** une création backoffice ultérieure — les deux flux sont indépendants. Le backoffice crée **sans OTP** (gate = rôle PARTNER/ADMIN). |
| **Documents** | Catalogue `GET /v1/catalog/document-types`. Recto/verso = **codes distincts** (`_FRONT` / `_BACK`), **pas** de champ `side` à l'attachement. |
| **Création véhicule** | **Auto-approuvée** (`status: 'approved'`) depuis commit `913804c`. Plus de gate `pending` bloquant le dispatch. |
| **Flow** | **Multi-étapes conservé** (pas de bundle transactionnel à ce stade). Ordre **non imposé** ; le chauffeur peut être créé en premier, ou créé avec son véhicule. Voir §6. |
| **Franchise from-scratch** | Supportée via `POST /v1/admin/franchises` (admin). `POST /v1/auth/franchise/register` sert à **rattacher un user** à une franchise **existante**, pas à la créer. |
| **`POST /v1/franchises/{id}/partners`** | **N'existe pas.** Le front tape une route fantôme. Créer le partenaire via `POST /v1/partners` avec `franchiseId`. |

---

## 1. Franchise — champs validés

### Endpoint canonique : `POST /v1/admin/franchises`
- **Auth :** `authenticate` + `requireAdmin` (rôle ADMIN plateforme uniquement).
- **Effet :** crée **atomiquement** l'entité `franchises` **+** le user portail (auth.users) **+** `profiles` **+** `franchise_members` **+** rôle `FRANCHISE_ADMIN`. Rollback complet si une étape échoue.
- Réf. code : [admin.routes.ts](src/modules/admin/admin.routes.ts) (≈ L432) → [admin.franchises.service.ts](src/modules/admin/admin.franchises.service.ts) (≈ L153).

| Champ API (camelCase) | Alias acceptés | Obligatoire | Type | Note |
|-----------------------|----------------|-------------|------|------|
| `name` | `franchiseName`, `franchise_name` | **Oui** | string | Génère `code` si absent |
| `cityId` | `city_id` | **Oui** | string (UUID) | Doit exister dans `ref_cities` → sinon `CITY_NOT_FOUND` (404) |
| `contactEmail` | `contact_email`, `email` | **Oui** | string | Login portail + `support_email` |
| `contactPhone` | `contact_phone`, `phone` | **Oui** | string | `support_phone` + phone du user auth |
| `adminPassword` | `admin_password`, `password` | **Oui** *(voir Q12)* | string | Mot de passe admin portail. **Pas encore de flow invitation.** |
| `adminFirstName` | `admin_first_name`, `firstName`, `first_name` | **Oui** | string | |
| `adminLastName` | `admin_last_name`, `lastName`, `last_name` | **Oui** | string | |
| `legalName` | `legal_name` | Non | string | Défaut = `name` |
| `code` | — | Non | string | Auto-slug si absent |
| `status` | — | Non | string | Défaut `'pending'` (`pending` \| `active`) |
| `countryCode` | `country_code` | Non | string | ISO (CI, TG…). Sinon dérivé de la ville |
| `countryId` | `country_id` | Non | string | Sinon résolu via `cityId` |
| `metadata` | — | Non | object | Augmenté serveur (`createdFrom`) |

**Réponse `201` :**
```json
{
  "franchiseId": "uuid",
  "userId": "uuid",
  "memberId": "uuid",
  "portalLoginEmail": "contact@franchise.com",
  "franchise": { "...": "entité enrichie" },
  "member": { "...": "franchise_members" },
  "profile": { "...": "profiles" }
}
```

**Erreurs :** `ADMIN_FRANCHISE_NAME_REQUIRED` / `ADMIN_FRANCHISE_CITY_REQUIRED` / `ADMIN_FRANCHISE_ADMIN_REQUIRED` (400) · `CITY_NOT_FOUND` / `COUNTRY_NOT_FOUND` (404) · `ADMIN_FRANCHISE_AUTH_CREATE_FAILED` (email déjà pris, 400) · `ADMIN_FRANCHISE_CREATE_FAILED` (400).

### Option B : `POST /v1/auth/franchise/register` (≠ création from-scratch)
- **Public.** **Ne crée pas** l'entité franchise — elle **doit déjà exister** (`franchiseId` requis). Crée le **user portail** et le rattache (`franchise_members`).
- À utiliser **uniquement** pour ajouter un compte portail à une franchise existante. Ce n'est **pas** le chemin de création réseau.

> **Réponse aux questions §3.0 / §4.1bis :**
> - Endpoint canonique de création = **`POST /v1/admin/franchises`** (A). B = rattachement user, rôle différent.
> - Création « from scratch » sans seed = **oui, supportée par A** (pas besoin de `franchiseId` préexistant).
> - Séparer entité / compte portail ? **Non aujourd'hui** : A fait les deux atomiquement.

---

## 2. Partenaire — champs validés

### Endpoint canonique : `POST /v1/partners`
- **Auth :** `authenticate`. Le **user authentifié devient `owner_user_id`** (pas de création de compte auth séparé ici).
- Réf. code : [partners.routes.ts](src/modules/partners/partners.routes.ts) (≈ L36) → [partners.service.ts](src/modules/partners/partners.service.ts) (≈ L410).

| Champ API (camelCase) | Alias acceptés | Obligatoire | Type | Note |
|-----------------------|----------------|-------------|------|------|
| `legalName` | `legal_name` | **Oui** | string | Sinon `PARTNER_LEGAL_NAME_REQUIRED` (400) |
| `tradeName` | `trade_name` | Non | string | Défaut = `legalName` |
| `franchiseId` | `franchise_id` | Non | string | Rattachement franchise (pas de FK check au service) |
| `cityId` | `city_id` | Non | string | |
| `contactEmail` | `contact_email` | Non | string | |
| `contactPhone` | `contact_phone` | Non | string | |
| `partnerType` | `partner_type` | Non | enum | `FLEET` (défaut) \| `FREIGHT` \| `RENTAL` \| `MIXED`. Valeur invalide → fallback `FLEET` |
| `commissionRate` | `commission_rate` | Non | number | Pas de borne min/max validée |
| `taxId` | `tax_id` | Non | string | NIF — enrichissement ultérieur OK |
| `registrationNumber` | `registration_number` | Non | string | RCCM — enrichissement ultérieur OK |
| `address` | — | Non | string | |
| `settings` | — | Non | object | |
| `metadata` | — | Non | object | |

- `status` **n'est pas réglable** à la création (défaut `'pending'`).
- **Réponse `201` :** `{ "partner": { ...colonnes snake_case... } }`.

> **Réponse aux questions §3.0bis / §4.1ter :**
> - **Schéma canonique unique** = `POST /v1/partners` (camelCase + `cityId` + `franchiseId`).
> - **`POST /v1/franchises/{franchiseId}/partners` n'existe pas** → à **supprimer côté front**. Pour rattacher : passer `franchiseId` dans `POST /v1/partners`, ou `PATCH /v1/partners/:id`.
> - Champs requis à la création : **`legalName` seul**. Tout le reste (`registrationNumber`, `taxId`, `cityId`, contacts…) est optionnel / complété ensuite.

---

## 3. Chauffeur — champs validés

### Endpoint backoffice canonique : `POST /v1/partners/{partnerId}/drivers`
- **Auth :** `authenticate` + `requirePartnerAccess` → rôle **PARTNER_USER ou ADMIN**.
- **Identité = téléphone (E.164).** Si un compte existe déjà pour ce numéro → **adoption** par le partenaire courant (plus de blocage dur `DRIVER_ALREADY_EXISTS`). Conflit seulement si le numéro appartient à un compte **non-DRIVER** (`DRIVER_PROFILE_ALREADY_EXISTS`, 409).
- Réf. code : [partners.routes.ts](src/modules/partners/partners.routes.ts) (≈ L164) → [partners.service.ts](src/modules/partners/partners.service.ts) (≈ L1441, `createDriver`).

| Champ API | Alias acceptés | Obligatoire | Type | Note |
|-----------|----------------|-------------|------|------|
| `phone` | — | **Oui** | string | E.164 normalisé (`+225…`, `225…` ou local) |
| `firstName` | `first_name` | **Oui** | string | |
| `lastName` | `last_name` | **Oui** | string | |
| `rideCategoryCode` | `ride_category_code` | Non | string | **Défaut `ECO`** |
| `zone` | — | Non | string | **Accepté** → stocké dans `metadata.zone` / `metadata.zoneLabel` |
| `vehicleId` | `vehicle_id` | Non | string | Si fourni → assignation véhicule à la création |
| `franchiseId` | `franchise_id` | Non | string | |
| `email` | — | **Non** | string | **Plus utilisé comme identité.** Si absent → dérivé `{digits}@phone.upjunoo.app`. **Retirer le placeholder.** |
| ~~`password`~~ | — | **Ignoré** | — | **Aucun champ password lu ici.** Le retirer du payload. |
| `metadata` | — | Non | object | Fusionné avec valeurs système |

**Réponse `201` :**
```json
{
  "driver": {
    "id": "uuid",
    "user_id": "uuid",
    "partner_id": "uuid",
    "ride_category_code": "ECO",
    "approval_status": "pending",
    "kyc_status": "pending",
    "onboarding_status": "in_progress",
    "current_vehicle_id": null
  },
  "profile": { "user_type": "DRIVER", "phone": "+225…", "email": "…@phone.upjunoo.app" }
}
```

**Erreurs :** `DRIVER_FIRST_NAME_REQUIRED` / `DRIVER_LAST_NAME_REQUIRED` / `DRIVER_PHONE_REQUIRED` (400) · `PARTNER_DRIVER_AUTH_CREATE_FAILED` (400) · `DRIVER_PROFILE_ALREADY_EXISTS` (409) · `PARTNER_ARCHIVED` (410).

> **Réponses aux questions §3.3 :**
> 1. **`email` obligatoire ?** Non → **retirable du contrat**.
> 2. **`password` :** ni client ni payload. Défini plus tard par le chauffeur via OTP (`verify-otp` accepte un `password` optionnel ≥ 8). En backoffice, aucun mot de passe n'est requis.
> 3. **`rideCategoryCode` :** catégorie **course** du chauffeur (défaut `ECO`), distincte du `categoryCode` véhicule. **Logiquement on recommande de l'aligner** sur la catégorie du véhicule, mais ce n'est pas contraint serveur.
> 4. **`zone` :** champ accepté, nom API = **`zone`**, à l'étape création chauffeur (rangé dans `metadata`). Pas encore de référentiel zones lié.

### Routes alternatives (mobile / self-onboarding — pas pour le backoffice)
`POST /v1/auth/driver/register`, `POST /v1/drivers/onboarding/start`, `PATCH /v1/drivers/me`, `POST /v1/partners/{id}/members` existent mais **ne sont pas le chemin backoffice**. Quand `partnerId` est fourni, **utiliser uniquement** `POST /v1/partners/{partnerId}/drivers`.

---

## 4. OTP chauffeur — comportement réel

| Étape | Route | Body |
|-------|-------|------|
| Envoi | `POST /v1/auth/driver/phone` (alias `…/resend-otp`) | `{ countryCode, phone }` |
| Vérif | `POST /v1/auth/driver/verify-otp` | `{ countryCode, phone, code, password? }` |

- **Stockage :** Redis, clé par numéro normalisé. **TTL 300 s (5 min)**, **usage unique** (supprimé à la vérif). Rate-limit : 5 tentatives / 15 min, cooldown 60 s, 5 SMS / h.
- **`verify-otp` renvoie une session** (`access_token` + `user` + `profile` + `driver`), pas un « ticket OTP » réutilisable.
- Réf. code : [auth.otp-phone.service.ts](src/modules/auth/auth.otp-phone.service.ts), [auth.driver.service.ts](src/modules/auth/auth.driver.service.ts).

> **Réponses aux questions §3.1 / §5 (OTP & sécurité) :**
> - **L'OTP vérifié est-il persisté pour autoriser `POST /partners/{id}/drivers` ?** **Non.** L'OTP est consommé et volatil ; il **n'est pas** lié à une création backoffice ultérieure. Les deux flux sont indépendants.
> - **Q9 — durée de validité de la preuve :** 5 min, usage unique (rien à « rejouer » après).
> - **Q10 — admin sans OTP :** **Oui.** Le backoffice (PARTNER/ADMIN) crée des chauffeurs **sans OTP**. L'OTP est réservé au self-onboarding de l'app chauffeur.
> - **Q11 — retirer le password backoffice :** **Oui**, à retirer.

---

## 5. Véhicule — champs validés

### Endpoint canonique : `POST /v1/vehicles` (codes catalogue)
- **Auth :** `authenticate`. `partnerId` / `driverId` déduits du driver de l'appelant si absents.
- **Statut à la création : `'approved'`** (auto-approbation, commit `913804c`) — le véhicule ne bloque plus le dispatch ; suspension/rejet possible ensuite via back-office.
- **Résolution serveur :** les codes sont résolus en UUID (`resolveBrand/Model/Color/Category`). **Le texte libre n'est pas accepté ici.**
- Réf. code : [vehicles.routes.ts](src/modules/vehicles/vehicles.routes.ts) (≈ L35) → [vehicles.service.ts](src/modules/vehicles/vehicles.service.ts) (≈ L120).

| Champ API | Alias acceptés | Obligatoire | Type | Note |
|-----------|----------------|-------------|------|------|
| `plateNumber` | `plate_number` | **Oui** | string | Normalisé (maj, sans espaces). ⚠️ **Pas de contrainte d'unicité DB** (doublons possibles — voir Q7) |
| `brandCode` | `brand_code`, `brandId`, `brand_id` | **Oui** | string | Résolu via catalogue |
| `modelCode` | `model_code`, `modelId`, `model_id` | **Oui** | string | Résolu via catalogue (lié à la marque) |
| `colorCode` | `color_code`, `colorId`, `color_id` | Non | string | |
| `categoryCode` | `category_code`, `categoryId`, `category_id` | Non | string | |
| `manufactureYear` | `manufacture_year` | Non | int | |
| `seatsCount` | `seats_count` | Non | int | **Pas obligatoire**, pas d'enforcement par catégorie (voir Q6) |
| `maxWeightKg` | `max_weight_kg` | Non | number | |
| `vin` | — | Non | string | |
| `partnerId` | `partner_id` | Non | string | Sinon déduit |
| `driverId` | `driver_id` | Non | string | Sinon = driver appelant |
| `status` | — | Non | string | Défaut `'approved'` |
| `metadata` | — | Non | object | |

**Réponse `201` :** `{ "vehicle": { ... } }` (renvoie de nombreux alias : `plate_number`/`plateNumber`/`plate`, `brand`/`brandLabel`/`brandRef`, `category`/`categoryCode`/`categoryRef`, `year`, `vehicleLabel`…).

**Erreurs :** `VEHICLE_PLATE_REQUIRED` · `VEHICLE_BRAND_REQUIRED` · `VEHICLE_MODEL_REQUIRED` (400) · `VEHICLE_CREATE_FAILED` (400).

### Route partenaire historique : `POST /v1/partners/{partnerId}/vehicles` (texte libre) — à **abandonner**
- Accepte `brand` / `model` / `color` / `category` en **texte libre** (stockés en `metadata`, **non liés au catalogue**), `driver_id` **requis** (véhicule + chauffeur créés ensemble), `plate` optionnel, `status` défaut `'pending'`.
- C'est **l'écart §3.2** signalé par le front. **Recommandation : le front migre tout sur `POST /v1/vehicles` (codes).** Cette route restera tolérée mais ne sera pas la cible.

> **Réponses aux questions §3.2 / §5 (validation métier) :**
> - **Format canonique :** **codes catalogue** via `POST /v1/vehicles`.
> - **Q6 — `seatsCount` obligatoire selon catégorie ?** Non (aucun enforcement aujourd'hui).
> - **Q7 — `plateNumber` unique ?** **Non contraint** actuellement → doublons possibles. *(Backlog backend : ajouter une contrainte d'unicité par pays/réseau si requis.)*
> - **Q8 — chauffeur sans véhicule depuis backoffice ?** **Oui** côté API (`POST /v1/partners/{id}/drivers` sans `vehicleId`). Seul l'écran partenaire couple les deux.
> - **Statut brouillon ?** Pas de statut « draft » dédié ; à la place le véhicule naît `approved` (route `/v1/vehicles`) ou `pending` (route partenaire).

---

## 6. Assignation chauffeur ↔ véhicule

- **Route :** `POST /v1/partners/{partnerId}/vehicles/{vehicleId}/assign-driver` (partnerAuth) — ou `POST /v1/vehicles/{vehicleId}/assign-driver` (authenticate).
- **Body canonique :** `{ "driverId": "uuid" }` (l'alias `driver_id` est aussi accepté).
- **Réponse `200` :** `{ "assignment": {...}, "vehicle": {...} }`. Effets : insert `vehicle_assignments` (status `active`) + maj `vehicle.driver_id` + `driver.current_vehicle_id`.
- Réf. code : [partners.service.ts](src/modules/partners/partners.service.ts) (≈ L1795).

---

## 7. Uploads & documents

### 7.1 `POST /v1/uploads/signed-url`
- **Body :** `purpose` (**requis** : `avatar` \| `kyc` \| `vehicle` \| `delivery-proof` \| `ride-proof` \| `support` \| `misc`), `filename?`, `contentType?`, `sizeBytes?`, `documentTypeCode?`, `vehicleId?`, `orderId?` (alias snake_case acceptés).
- **Réponse `201` :**
```json
{
  "upload": {
    "id": "base64url(bucket|path)",
    "uploadId": "même valeur",
    "bucket": "upjunoo-kyc",
    "path": "…",
    "storageRef": "bucket/path",
    "signedUrl": "https://… (PUT, 2h)",
    "method": "PUT",
    "expiresInSeconds": 7200,
    "metadata": { "persistHint": "…" }
  }
}
```
- **À persister côté front :** `storageRef` **ou** `uploadId` (les deux sont rejouables à l'attachement).
- Réf. code : [uploads.routes.ts](src/modules/uploads/uploads.routes.ts) (≈ L58) → [uploads.service.ts](src/modules/uploads/uploads.service.ts) (≈ L101).

### 7.2 Attachement document (chauffeur / véhicule)
- **Chauffeur :** `POST /v1/partners/{id}/drivers/{driverId}/documents` (défaut `DRIVER_LICENSE`).
- **Véhicule :** `POST /v1/partners/{id}/vehicles/{vehicleId}/documents` (défaut `VEHICLE_DOCUMENT`) · `…/vehicles/{vehicleId}/registration` (défaut `VEHICLE_REGISTRATION`).

**Body canonique unique :**

| Champ | Alias | Obligatoire | Note |
|-------|-------|-------------|------|
| `uploadId` | `upload_id` | **Oui** *(ou `storageRef`/`fileUrl`/`fileUrls`)* | Réf. du `signed-url` |
| `documentTypeCode` | `document_type_code` | Recommandé | Sinon défaut selon route |
| `storageRef` | `storage_ref` | Alternatif | `bucket/path` |
| `fileUrl` / `fileUrls` | `file_url` / `file_urls` | Alternatif | URL(s) |
| `expiresAt` | `expires_at` | Non | ISO 8601 |
| `metadata` | — | Non | |

- ⚠️ **Pas de champ `side` à l'attachement.** Le recto/verso passe par des **codes distincts** (`_FRONT` / `_BACK`). Le champ `side` n'existe que sur la sous-ressource `kyc_photo_control_files` (contrôles photo KYC), pas ici.
- **Réponse `201` :** `{ "document": { status: "pending", … } }`.

---

## 8. Catalogues réels

### 8.1 `GET /v1/catalog/vehicle-categories`
Codes canoniques (source : `migrations/013_vehicle_catalog_complete_ci.sql`) :

| `categoryCode` | Libellé | Service types |
|----------------|---------|---------------|
| `ECO` | Économique | RIDE |
| `CONFORT` | Confort | RIDE, DELIVERY_CARGO |
| `CONFORT_PLUS` | Confort + | RIDE, DELIVERY_CARGO, RENTAL |
| `PREMIUM` | Premium | RIDE, RENTAL |
| `MOTO` | Moto / scooter | DELIVERY_CARGO |
| `TRICYCLE` | Tricycle | DELIVERY_CARGO |
| `FOURGON` | Fourgon | DELIVERY_CARGO, FREIGHT, RENTAL |
| `CAMION` | Camion | FREIGHT |

> **Q13 — mapping UI partenaire `taxi/delivery/van/premium` :** il n'y a **pas** de codes `taxi`/`delivery`/`van` en base. Mapping recommandé : `taxi → ECO/CONFORT`, `premium → PREMIUM`, `van → FOURGON`, `delivery → MOTO/TRICYCLE/FOURGON` selon le gabarit. **Le front doit envoyer le `categoryCode` réel.**

Brands / models / colors : `GET /v1/catalog/vehicle-brands`, `…/vehicle-brands/{brandCode}/models`, `…/vehicle-colors` (le code, pas l'UUID, en lookup ; l'UUID est résolu serveur à l'enregistrement).

### 8.2 `GET /v1/catalog/document-types?subject=DRIVER`
Chaque item : `{ id, subject, code, label, required, sides[], expires, active }`.
**Catalogue réellement seedé (migrations 048 + 049) — tous `subject = DRIVER` :**

| `documentTypeCode` | Libellé | `sides` | `required` | `active` |
|--------------------|---------|---------|-----------|----------|
| `DRIVER_LICENSE_FRONT` | Permis (recto) | `[FRONT]` | true | ✅ |
| `DRIVER_LICENSE_BACK` | Permis (verso) | `[BACK]` | true | ✅ |
| `ID_CARD_FRONT` | Pièce d'identité (recto) | `[FRONT]` | true | ✅ |
| `ID_CARD_BACK` | Pièce d'identité (verso) | `[BACK]` | true | ✅ |
| `PROFILE_PHOTO` | Photo profil (selfie) | `[SELFIE]` | true | ✅ |
| `REGISTRATION_CARD` | Carte grise | `[]` | false | ✅ |
| `INSURANCE` | Assurance véhicule | `[]` | false | ✅ |
| `DRIVER_LICENSE` | Permis (legacy) | `[FRONT,BACK]` | false | ❌ (inactif) |
| `ID_CARD` | CNI (legacy) | `[FRONT,BACK]` | false | ❌ (inactif) |

> **Réponses aux questions §3.4 / §5 (catalogues) :**
> - **Q14/Q15 :** le catalogue expose bien `required` et `sides[]` (et `expires`, `active`). Il **n'y a pas** de `requiredForDriver`/`requiredForVehicle`/`allowsVerso` — utiliser `required` + `sides`. Pas de filtre `side` au POST : **un code par face**.
> - **Carte grise recto/verso :** aujourd'hui **un seul code `REGISTRATION_CARD`** (pas de recto/verso distinct). Si le recto/verso carte grise est requis, **on ajoutera** `REGISTRATION_CARD_FRONT/_BACK` (à arbitrer).
> - **Visite technique :** **non catalogué** → ne pas l'envoyer tant que le code (`TECHNICAL_INSPECTION`) n'est pas seedé. *(Backlog backend.)*
> - ⚠️ **Écart à corriger backend :** carte grise & assurance sont catégorisées `subject = DRIVER`, et les routes véhicule utilisent des codes `VEHICLE_REGISTRATION`/`VEHICLE_DOCUMENT` **absents du catalogue**. À unifier (subject `VEHICLE` + codes catalogués). En attendant, pour la **carte grise** utiliser **`REGISTRATION_CARD`**, pour l'**assurance** **`INSURANCE`**.
> - **Documents requis :** à l'**approbation KYC** (compliance) les requis véhicule = `REGISTRATION_CARD` + `INSURANCE` ; chauffeur = `PROFILE_PHOTO`, `DRIVER_LICENSE_FRONT/BACK`, `ID_CARD_FRONT/BACK`. **À la création : aucun document n'est bloquant** (véhicule auto-approuvé, chauffeur `pending`).

---

## 9. Mapping document-types front → API (corrigé)

| UI front | `documentTypeCode` correct | Remarque |
|----------|----------------------------|----------|
| CNI recto | `ID_CARD_FRONT` | |
| CNI verso | `ID_CARD_BACK` | ✅ corrige le doublon |
| Permis recto | `DRIVER_LICENSE_FRONT` | |
| Permis verso | `DRIVER_LICENSE_BACK` | ✅ corrige le doublon |
| Selfie | `PROFILE_PHOTO` | |
| Carte grise | `REGISTRATION_CARD` | un seul code (pas de recto/verso catalogué) |
| Assurance | `INSURANCE` | |
| Visite technique | *(non catalogué)* | à ne pas envoyer pour l'instant |

---

## 10. Exemple nominal complet (request → response)

**1) OTP (mobile uniquement — backoffice n'en a pas besoin)**
```http
POST /v1/auth/driver/phone        { "countryCode": "CI", "phone": "0700000000" }
POST /v1/auth/driver/verify-otp   { "countryCode": "CI", "phone": "0700000000", "code": "123456" }
```

**2) Chauffeur (backoffice)**
```http
POST /v1/partners/{partnerId}/drivers
{ "firstName": "Jean", "lastName": "Kouassi", "phone": "+2250700000000", "rideCategoryCode": "ECO", "zone": "Cocody" }
→ 201 { "driver": { "id": "…", "approval_status": "pending" }, "profile": { "user_type": "DRIVER" } }
```

**3) Véhicule (codes)**
```http
POST /v1/vehicles
{ "partnerId": "uuid", "categoryCode": "ECO", "brandCode": "PEUGEOT", "modelCode": "301",
  "colorCode": "GRIS", "manufactureYear": 2018, "seatsCount": 4, "plateNumber": "2789KB01" }
→ 201 { "vehicle": { "id": "…", "status": "approved", "plate_number": "2789KB01" } }
```

**4) Upload + attachement document (par fichier)**
```http
POST /v1/uploads/signed-url   { "purpose": "kyc", "documentTypeCode": "ID_CARD_FRONT", "contentType": "image/jpeg" }
→ 201 { "upload": { "uploadId": "…", "storageRef": "…", "signedUrl": "…" } }
PUT  <signedUrl>  (binaire)
POST /v1/partners/{partnerId}/drivers/{driverId}/documents
{ "uploadId": "…", "documentTypeCode": "ID_CARD_FRONT" }
→ 201 { "document": { "status": "pending" } }
```

**5) Assignation**
```http
POST /v1/partners/{partnerId}/vehicles/{vehicleId}/assign-driver   { "driverId": "uuid" }
→ 200 { "assignment": { "status": "active" }, "vehicle": { "driver_id": "uuid" } }
```

---

## 11. Décision flow (réponse §5.1–5.4)

- [x] **Multi-étapes conservé** (pas de bundle transactionnel `POST /fleet-pairs` à ce stade).
  Ordre recommandé : **chauffeur → véhicule → upload docs → attach → assignation**.
- **Ordre non imposé** (Q2) : le chauffeur peut être créé en premier ; `POST /vehicles` peut aussi auto-assigner via `driverId`, et `POST /partners/{id}/drivers` via `vehicleId`.
- **Pas de bundle** prévu maintenant ; si le besoin se confirme, candidat = `POST /v1/partners/{partnerId}/fleet-pairs`. *(À arbitrer produit.)*

---

## 12. Écarts backend à traiter (backlog, transparence)

| # | Écart | Action backend |
|---|-------|----------------|
| 1 | Route partenaire véhicule en **texte libre** vs `/v1/vehicles` en **codes** | Front migre sur codes ; backend pourra upgrader la route partenaire pour résoudre les codes |
| 2 | `status` véhicule incohérent (`approved` sur `/vehicles`, `pending` sur route partenaire) | Aligner sur `approved` |
| 3 | `plateNumber` **non unique** | Ajouter contrainte d'unicité (pays/réseau) |
| 4 | Doc types **véhicule absents du catalogue** (`VEHICLE_REGISTRATION`/`VEHICLE_DOCUMENT` non seedés) + carte grise/assurance en `subject DRIVER` | Seeder `subject = VEHICLE` + codes officiels (+ `TECHNICAL_INSPECTION`, recto/verso carte grise si requis) |
| 5 | Alias snake_case partout | Documenter camelCase comme canon, garder snake_case en lecture |
| 6 | Flow invitation franchise/partenaire (vs `adminPassword` en clair) | À concevoir (Q4/Q12) |

---

## 13. Synthèse — table de vérité par endpoint

| Méthode | Path | Auth | Crée |
|---------|------|------|------|
| POST | `/v1/admin/franchises` | ADMIN | Franchise + compte portail (atomique) |
| POST | `/v1/auth/franchise/register` | public | User rattaché à franchise **existante** |
| POST | `/v1/partners` | authenticated | Partenaire (owner = user courant) |
| POST | `/v1/partners/{partnerId}/drivers` | PARTNER/ADMIN | Chauffeur (identité = phone) |
| POST | `/v1/vehicles` | authenticated | Véhicule (**codes**, auto-`approved`) |
| POST | `/v1/uploads/signed-url` | authenticated | URL signée PUT |
| POST | `/v1/partners/{id}/drivers/{driverId}/documents` | PARTNER/ADMIN | Document chauffeur |
| POST | `/v1/partners/{id}/vehicles/{vehicleId}/documents` | PARTNER/ADMIN | Document véhicule |
| POST | `/v1/partners/{id}/vehicles/{vehicleId}/assign-driver` | PARTNER/ADMIN | Assignation |

---

*Document généré à partir du code source (branche `security/hardening`). Pour toute divergence avec le Swagger live, le code fait foi ; le Swagger sera resynchronisé sur ce contrat (livrable §7.3 de la demande).*
