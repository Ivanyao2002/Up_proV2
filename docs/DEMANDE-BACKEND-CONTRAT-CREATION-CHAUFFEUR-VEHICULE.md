# Demande backend — Contrat unifié création franchise + partenaire + chauffeur + véhicule

> **Date :** 2026-06-16  
> **Émetteur :** équipe front UpJunoo (admin + portail partenaire)  
> **Objectif :** aligner **formulaires**, **payloads API** et **Swagger** sur un même référentiel de champs, règles et nomenclatures.  
> **Swagger :** [https://api.upjunoo-dev.tech/docs](https://api.upjunoo-dev.tech/docs)

---

## 1. Contexte

Aujourd’hui, la création **chauffeur + véhicule** passe par un wizard unique (`FleetPairCreateWizard`) :

| Portail | Écran | Fichier |
|---------|-------|---------|
| Admin | `/admin/fleet/vehicles/new` | `VehicleCreatePage.tsx` |
| Partenaire | `/partner/fleet/new` | `PartnerVehicleCreatePage.tsx` |

Le front enchaîne plusieurs appels HTTP (OTP → véhicule → documents → chauffeur → documents → assignation).  
Voir aussi : `docs/FLOW-CREATION-CHAUFFEUR-VEHICULE.md`.

**Problème :** les champs affichés, les noms de propriétés et les règles de validation **ne sont pas homogènes** entre les portails (admin / franchise / partenaire) et l’API. Le front compense avec des mappings, placeholders et variantes de body.

Nous demandons au backend de **confirmer ou corriger** le contrat canonique ci-dessous pour l’onboarding “réseau” complet :

- **Franchise**
- **Partenaire**
- **Chauffeur**
- **Véhicule**

---

## 2. Ce que le front collecte aujourd’hui (formulaires)

### 2.0 Franchise (création côté Admin)

Le front collecte (écran création franchise) :

| Champ UI | Obligatoire | Notes |
|----------|-------------|-------|
| `name` | Oui | Nom franchise |
| `city` / `city_id` | Oui | Ville catalogue |
| `status` | Oui | `pending` ou `active` |
| `contact_email` | Oui | Sert aussi de login portail franchise |
| `contact_phone` | Oui | Téléphone contact |
| `admin_password` | Oui | Mot de passe admin franchise (portail) |
| `country_code` | Non | Dérivé de la ville (si dispo) |
| `franchise_id` | Optionnel/tech | Contournement dev : “seed franchise” si API exige une base existante |

**Point de confusion actuel :** selon le mode/feature backend, la création passe soit par `POST /v1/admin/franchises`, soit par `POST /v1/auth/franchise/register` (voir § 3.0).

### 2.0bis Partenaire (création côté Admin / Franchise)

Le front collecte (admin network partners) :

| Champ UI | Obligatoire | Notes |
|----------|-------------|-------|
| `name` | Oui | Utilisé comme `legalName` + `tradeName` |
| `franchise_id` | Oui | ID franchise |
| `city` / `city_id` | Oui | Ville catalogue |
| `contact_email` | Oui | Contact partenaire |
| `contact_phone` | Recommandé | Optionnel côté API |
| `address` | Optionnel | Adresse |
| `status` | Optionnel | Statut |
| `partner_type` | Optionnel | Type partenaire |
| `commission_rate` | Optionnel | Commission par défaut |

### 2.1 Chauffeur (commun admin + partenaire)

| Champ UI | Obligatoire | Notes |
|----------|-------------|-------|
| `first_name` | Oui | Prénom |
| `last_name` | Oui | Nom |
| `phone` | Oui | Format international (`+225…`) |
| OTP téléphone | Oui (v1) | Vérification avant submit |
| `zone` | Non | Présent dans le modèle front, **non envoyé** à l’API actuelle |
| ~~`email`~~ | — | **Retiré du formulaire** — le front génère un placeholder si l’API l’exige encore |

**Documents chauffeur (wizard) :**

| Pièce UI | Recto / verso | Obligatoire KYC (UI) |
|----------|---------------|----------------------|
| CNI | Oui | Oui |
| Permis | Oui | Oui |
| Selfie | Non | Oui |

### 2.2 Véhicule — variante **Admin**

| Champ UI | Obligatoire | Source |
|----------|-------------|--------|
| `partnerId` | Oui | Liste partenaires |
| `categoryCode` | Oui | Catalogue `GET /v1/catalog/vehicle-categories` |
| `brandCode` | Oui | Catalogue `GET /v1/catalog/vehicle-brands` |
| `modelCode` | Oui | Catalogue `GET /v1/catalog/vehicle-brands/{code}/models` |
| `colorCode` | Oui | Catalogue `GET /v1/catalog/vehicle-colors` |
| `manufactureYear` | Oui | Saisie numérique |
| `seatsCount` | Oui (UI) | 1–12 places |
| `plateNumber` | Non | Saisie ou extraction IA |

### 2.3 Véhicule — variante **Partenaire**

| Champ UI | Obligatoire | Source |
|----------|-------------|--------|
| `brand` | Oui | Texte libre |
| `model` | Oui | Texte libre |
| `color` | Oui | Texte libre |
| `category` | Oui | Enum UI : `taxi`, `delivery`, `van`, `premium` |
| `year` | Oui | Saisie numérique |
| `plate` | Non | Texte libre |

**Documents véhicule (wizard) :**

| Pièce UI | Recto / verso | Obligatoire KYC (UI) |
|----------|---------------|----------------------|
| Carte grise / équivalent | Oui | Oui |
| Assurance | Non | Non |
| Visite technique | Non | Non |

---

## 3. Ce que le front envoie aujourd’hui (API)

### 3.0 Création Franchise (admin)

Selon la configuration, le front sait appeler deux approches :

#### Option A — Endpoint “admin create” (attendu)

- `POST /v1/admin/franchises`
- Body (camelCase, d’après le service front) :
  - `name`
  - `cityId`
  - `contactEmail`
  - `contactPhone`
  - `adminPassword`
  - `adminFirstName`
  - `adminLastName`
  - `status`
  - optionnel : `countryCode`

#### Option B — Auth “register portail franchise” (utilisé si `franchise_id` fourni)

- `POST /v1/auth/franchise/register`
- Body :
  - `email` (contact)
  - `password` (admin_password)
  - `phone` (optionnel)
  - `firstName`, `lastName`
  - `cityId`
  - `franchiseId` (seed / franchise existante)
  - `franchiseName`
  - optionnel : `devBypass: true` (dev)

**Demande backend (franchise) :**
- Confirmer **l’endpoint canonique** de création franchise (A ou B, ou les 2 avec un rôle différent).
- Confirmer si la création franchise “from scratch” est supportée (sans `franchiseId` seed).
- Documenter les schémas `200` et les erreurs (ex. cityId invalide, email déjà pris, etc.).

### 3.0bis Création Partenaire

Le front crée des partenaires via :

#### Admin (plateforme)
- `POST /v1/partners`
- Body (actuel) :
  - `franchiseId`
  - `legalName`
  - `tradeName`
  - `cityId`
  - `contactEmail`
  - optionnels : `contactPhone`, `partnerType`, `commissionRate`, `address`, `status`

#### Franchise portal (si applicable)
- `POST /v1/franchises/{franchiseId}/partners`
- Body (actuel, plutôt “legacy-like” / non standardisé) :
  - `name`
  - `contact_email`
  - `contact_phone`
  - `city`
  - optionnel : `trade_name`, `legal_name`, `address`

**Demande backend (partenaire) :**
- Unifier la création partenaire sur **un seul schéma canonique** (camelCase + cityId + franchiseId).
- Indiquer si `POST /v1/franchises/{franchiseId}/partners` doit être conservé, déprécié ou aligné sur `POST /v1/partners`.
- Confirmer les champs métier additionnels (ex. `registration_number`, `tax_id`) : création ou enrichissement ultérieur ?

### 3.1 OTP chauffeur (avant création)

| Étape | Route | Body actuel |
|-------|-------|-------------|
| Envoi | `POST /v1/auth/driver/resend-otp` | `{ countryCode, phone }` — `phone` = **numéro local** |
| Vérification | `POST /v1/auth/driver/verify-otp` | `{ countryCode, phone, code }` |

**Question :** l’OTP vérifié est-il **persisté côté serveur** et lié au numéro pour autoriser `POST /v1/partners/{id}/drivers` sans re-envoyer de preuve ?

---

### 3.2 Création véhicule

**Route utilisée :** `POST /v1/vehicles`

**Body admin (codes catalogue) :**

```json
{
  "partnerId": "uuid",
  "categoryCode": "ECO",
  "brandCode": "PEUGEOT",
  "modelCode": "301",
  "colorCode": "GRAY",
  "manufactureYear": 2018,
  "seatsCount": 4,
  "plateNumber": "2789KB01"
}
```

**Body partenaire (texte libre — mapping front actuel) :**

```json
{
  "partnerId": "uuid",
  "categoryCode": "ECO",
  "brand": "Peugeot",
  "model": "301",
  "color": "Gris",
  "manufactureYear": 2018,
  "plateNumber": "2789KB01"
}
```

**Écart identifié :** admin envoie `brandCode` / `modelCode` / `colorCode`, partenaire envoie `brand` / `model` / `color` en texte.  
**Demande :** un seul format canonique (codes catalogue **ou** libellés avec résolution serveur).

---

### 3.3 Création chauffeur

**Route utilisée (cas nominal backoffice) :** `POST /v1/partners/{partnerId}/drivers`

**Body actuel :**

```json
{
  "firstName": "Jean",
  "lastName": "Kouassi",
  "phone": "+2250700000000",
  "email": "driver.0700000000.1718539200000@placeholder.upjunoo.dev",
  "password": "Upjunoo@Dev2026!",
  "rideCategoryCode": "ECO"
}
```

**Routes alternatives encore présentes dans le code (non utilisées si `partnerId` fourni) :**

| Route | Usage |
|-------|-------|
| `POST /v1/auth/driver/register` | Inscription + token chauffeur |
| `POST /v1/drivers/onboarding/start` | Onboarding profil chauffeur |
| `PATCH /v1/drivers/me` | Rattachement partenaire |
| `POST /v1/partners/{id}/members` | Lien user ↔ partenaire |

**Questions :**

1. **`email`** est-il encore obligatoire ? Si non, peut-on le retirer du contrat (le front ne le collecte plus) ?
2. **`password`** : qui le définit en création backoffice ? Mot de passe temporaire généré serveur ? OTP comme premier facteur ?
3. **`rideCategoryCode`** : doit-il être aligné sur `categoryCode` du véhicule ou sur une catégorie course distincte ?
4. **`zone`** : champ métier attendu ? Si oui, quel nom API et à quelle étape ?

---

### 3.4 Upload documents (chauffeur + véhicule)

Workflow actuel (par fichier) :

1. `POST /v1/uploads/signed-url`
2. `PUT <signedUrl>` (binaire)
3. `POST /v1/partners/{partnerId}/drivers/{driverId}/documents`  
   ou `POST /v1/partners/{partnerId}/vehicles/{vehicleId}/documents`

**Body d’attachement — le front tente plusieurs variantes faute de schéma unique :**

```json
{ "uploadId": "…", "documentTypeCode": "ID_CARD_FRONT" }
{ "upload_id": "…", "document_type_code": "ID_CARD_FRONT" }
{ "uploadId": "…", "storageRef": "…", "documentTypeCode": "…" }
```

**Mapping types document front → API (partiel) :**

| UI front | Code API envoyé aujourd’hui |
|----------|----------------------------|
| CNI recto | `ID_CARD_FRONT` |
| CNI verso | `ID_CARD_FRONT` ⚠️ (même code) |
| Permis recto | `DRIVER_LICENSE_FRONT` |
| Permis verso | `DRIVER_LICENSE_FRONT` ⚠️ |
| Selfie | `PROFILE_PHOTO` |
| Carte grise recto | `REGISTRATION_CARD` |
| Carte grise verso | `REGISTRATION_CARD` ⚠️ |
| Assurance | `INSURANCE` |
| Visite technique | **non mappé** — erreur front si fichier fourni |

**Demande :** liste officielle depuis `GET /v1/catalog/document-types` avec :

- codes **recto / verso** distincts si nécessaire ;
- champ `side` (`FRONT` / `BACK`) dans le body d’attachement ;
- documents **obligatoires** à la création vs à l’approbation KYC.

---

### 3.5 Assignation chauffeur ↔ véhicule

**Route :** `POST /v1/partners/{partnerId}/vehicles/{vehicleId}/assign-driver`

**Body — variantes testées par le front :**

```json
{ "driverId": "uuid" }
{ "driver_id": "uuid" }
```

**Demande :** une seule forme canonique + schéma réponse `200` documenté.

---

## 4. Proposition de contrat unifié (à valider backend)

### 4.1 Principes

| Sujet | Proposition |
|-------|-------------|
| Casse JSON | **camelCase** exclusivement (`firstName`, `plateNumber`, …) |
| Identifiants véhicule | **Codes catalogue** (`brandCode`, `modelCode`, `colorCode`, `categoryCode`) |
| Téléphone | **E.164** en entrée (`+2250700000000`) ; OTP peut accepter local + `countryCode` |
| Email | **Optionnel** ou supprimé en création backoffice |
| Mot de passe | Généré **côté serveur** ou flow « première connexion par OTP » |
| Documents | Types depuis **catalogue document-types** ; recto/verso explicites |
| Création couplée | Soit flow multi-étapes actuel **documenté**, soit **un endpoint bundle** (voir § 5) |

---

### 4.1bis Franchise — schéma cible `FranchiseCreateInput`

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `name` | string | Oui | Nom franchise |
| `cityId` | string | Oui | UUID ville catalogue |
| `contactEmail` | string | Oui | Login + contact |
| `contactPhone` | string | Oui | Contact |
| `status` | `pending` \| `active` | Oui | Statut initial |
| `adminPassword` | string | ? | À confirmer (idéalement généré serveur / invitation) |
| `adminFirstName` | string | Oui | Admin franchise |
| `adminLastName` | string | Oui | Admin franchise |
| `countryCode` | string | Non | ISO (CI, TG, …) |

**Question :** doit-on séparer la création “entité franchise” et la création “compte portail franchise” ?

### 4.1ter Partenaire — schéma cible `PartnerCreateInput`

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `franchiseId` | string | Oui | Parent franchise |
| `cityId` | string | Oui | UUID ville catalogue |
| `legalName` | string | Oui | Raison sociale |
| `tradeName` | string | Oui | Nom commercial |
| `contactEmail` | string | Oui | Contact |
| `contactPhone` | string | Non | Contact |
| `partnerType` | string | Non | Type partenaire |
| `commissionRate` | number | Non | Commission par défaut |
| `address` | string | Non | Adresse |
| `status` | string | Non | Statut |
| `registrationNumber` | string | Non | RCCM / registre |
| `taxId` | string | Non | NIF |

**Question :** quels champs sont requis à la création vs complétés ensuite (KYC partenaire / conformité) ?

### 4.2 Schéma cible — `DriverCreateInput`

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `firstName` | string | Oui | Prénom |
| `lastName` | string | Oui | Nom |
| `phone` | string | Oui | E.164 |
| `countryCode` | string | Oui si OTP | Ex. `CI` |
| `rideCategoryCode` | string | ? | Catégorie course (lien avec véhicule ?) |
| `zoneId` ou `zoneCode` | string | Non | Zone d’exploitation si métier |
| `email` | string | Non | À confirmer si déprécié |

**Réponse minimale attendue :**

```json
{
  "driver": {
    "id": "uuid",
    "userId": "uuid",
    "partnerId": "uuid",
    "accountStatus": "pending"
  }
}
```

---

### 4.3 Schéma cible — `VehicleCreateInput`

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `partnerId` | string | Oui | Partenaire propriétaire |
| `categoryCode` | string | Oui | Code catalogue |
| `brandCode` | string | Oui | Code catalogue |
| `modelCode` | string | Oui | Code catalogue |
| `colorCode` | string | Oui | Code catalogue |
| `manufactureYear` | number | Oui | Année fabrication |
| `seatsCount` | number | ? | Places assises |
| `plateNumber` | string | Non | Immatriculation |
| `vin` | string | Non | Si applicable |

**Réponse minimale attendue :**

```json
{
  "vehicle": {
    "id": "uuid",
    "partnerId": "uuid",
    "status": "pending",
    "plateNumber": "2789KB01"
  }
}
```

---

### 4.4 Schéma cible — `DocumentAttachInput`

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `uploadId` | string | Oui | Retour `signed-url` |
| `documentTypeCode` | string | Oui | Catalogue |
| `side` | `FRONT` \| `BACK` | Non | Si recto/verso |
| `storageRef` | string | Non | Si requis par le stockage |

---

### 4.5 Schéma cible — `AssignDriverInput`

| Champ | Type | Obligatoire |
|-------|------|-------------|
| `driverId` | string | Oui |

---

## 5. Questions ouvertes pour le backend

### Flow & endpoints

1. **Garder le flow multi-étapes** (6–15 requêtes) ou proposer un endpoint unique du type  
   `POST /v1/partners/{partnerId}/fleet-pairs` avec véhicule + chauffeur + documents en une transaction ?
2. L’**ordre** véhicule → chauffeur → assignation est-il imposé ou peut-on créer le chauffeur d’abord ?
3. Existe-t-il un statut intermédiaire **brouillon** (véhicule sans chauffeur) avant validation KYC ?

4. Franchise/Partenaire : y a-t-il un flow “invitation” (email OTP / lien) plutôt qu’un `adminPassword` en clair ?

### Validation métier

5. Quels champs sont **bloquants à la création** vs **bloquants à l’approbation** (KYC) pour :
   - franchise
   - partenaire
   - chauffeur
   - véhicule
6. `seatsCount` est-il obligatoire pour certains `categoryCode` ?
7. `plateNumber` unique par pays / partenaire / réseau ?
8. Un chauffeur peut-il être créé **sans véhicule** depuis le backoffice ? (aujourd’hui : non côté UI)

### OTP & sécurité

9. Durée de validité de la preuve OTP après `verify-otp` ?
10. Le backoffice admin peut-il créer un chauffeur **sans OTP** avec un rôle `ADMIN` ?
11. Le mot de passe chauffeur doit-il être **retiré** du payload backoffice ?
12. Franchise : `adminPassword` est-il vraiment requis côté API, ou doit-on passer par invitation / reset password ?

### Catalogues

13. Confirmer la liste des `categoryCode` officiels (`ECO`, `CONFORT`, `PREMIUM`, …) et le mapping avec les catégories UI partenaire (`taxi`, `delivery`, …).
14. Confirmer la liste complète des `documentTypeCode` et les paires recto/verso.
15. `GET /v1/catalog/document-types` expose-t-il `requiredForDriver`, `requiredForVehicle`, `allowsVerso` ?

### Swagger

16. Documenter les schémas **200** pour :
    - création franchise (`POST /v1/admin/franchises` ou `POST /v1/auth/franchise/register`)
    - création partenaire (`POST /v1/partners` et/ou `POST /v1/franchises/{id}/partners`)
    - `POST /v1/vehicles`
    - `POST /v1/partners/{id}/drivers`
    - `POST /v1/partners/{id}/vehicles/{vehicleId}/assign-driver`
    - `POST /v1/partners/{id}/drivers/{driverId}/documents`
    - `POST /v1/partners/{id}/vehicles/{vehicleId}/documents`
    - `POST /v1/uploads/signed-url`
17. Supprimer les alias snake_case si camelCase est la norme.

---

## 6. Écarts actuels à corriger (côté front une fois contrat validé)

| Écart | Action front prévue |
|-------|---------------------|
| Admin : codes catalogue / Partenaire : texte libre | Unifier sur **codes catalogue** partout |
| `zone` collecté mais non envoyé | Envoyer ou retirer du formulaire |
| Email placeholder | Retirer si backend n’exige plus `email` |
| Mot de passe dev en dur | Retirer du payload si généré serveur |
| `technical_inspection` non mappé | Mapper selon catalogue backend |
| Recto/verso même `documentTypeCode` | Utiliser codes ou champ `side` officiel |
| Bodies upload / assign en double | Une seule variante camelCase |
| `rideCategoryCode` par défaut `ECO` | Aligner sur `categoryCode` véhicule |

---

## 7. Livrables attendus du backend

Merci de nous retourner :

1. **Table de vérité** : champ → obligatoire / optionnel → type → endpoint → règle de validation.
2. **Exemples JSON** complets (request + response 200) pour le flow nominal.
3. **Mise à jour Swagger** v0.5+ avec schémas 200.
4. **Décision** : flow multi-étapes conservé ou endpoint bundle.
5. **Liste document-types** finale avec recto/verso et obligation KYC.

---

## 8. Références code front

| Sujet | Fichier |
|-------|---------|
| Wizard UI | `src/features/fleet/components/fleet-pair-wizard/FleetPairCreateWizard.tsx` |
| Formulaire chauffeur | `src/features/partner/components/VehicleCreateDriverSection.tsx` |
| Payload véhicule admin | `src/features/fleet/api/adminVehicles.api.types.ts` |
| Payload véhicule partenaire | `src/features/fleet/api/adminVehicles.mapper.ts` (`mapPartnerFreeTextToApiBody`) |
| Création chauffeur v1 | `src/features/fleet/api/partnerDrivers.v1.service.ts` |
| Orchestration | `src/features/fleet/api/vehicleCreateFlow.ts` |
| Types documents | `src/features/fleet/api/documentTypeCodes.v1.ts` |
| Flow détaillé | `docs/FLOW-CREATION-CHAUFFEUR-VEHICULE.md` |

---

## 9. Modèle de réponse souhaité (template)

```markdown
### Chauffeur — champs validés
| Champ API | Obligatoire | Type | Note |
|-----------|-------------|------|------|

### Véhicule — champs validés
| Champ API | Obligatoire | Type | Note |
|-----------|-------------|------|------|

### Documents — codes validés
| documentTypeCode | side | Obligatoire création | Obligatoire approbation |
|------------------|------|----------------------|-------------------------|

### Décision flow
- [ ] Multi-étapes (liste ordonnée des routes)
- [ ] Endpoint bundle : POST …

### Exemple nominal
(request / response JSON)
```
