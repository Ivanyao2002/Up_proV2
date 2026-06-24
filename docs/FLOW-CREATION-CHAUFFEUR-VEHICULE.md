# Flow de création d'un chauffeur et de son véhicule (Admin / Fleet)

Ce document décrit l'enchaînement des étapes et des routes HTTP appelées quand on crée **un chauffeur rattaché à un partenaire** puis **le véhicule** (et on **assigne** le chauffeur au véhicule).

Le flow est orchestré par le wizard `FleetPairCreateWizard` (mode `admin`) via `applyVehicleCreateFlow(...)`.

> Note : selon le mode API activé (`useLegacyAdminApi()`), certains endpoints “admin” changent (section *Legacy* en bas).

---

## 0. Pré-requis (données saisies dans le wizard)

### Partenaire & véhicule
- `partnerId` (choisi dans le wizard)
- `categoryCode`
- `brandCode`, `modelCode`, `colorCode`
- `manufactureYear`
- `seatsCount` (optionnel côté payload v1, mais présent dans le wizard admin)
- `plateNumber` (optionnel)

### Chauffeur
- `first_name`, `last_name`
- `phone` (format international + OTP)
- Téléversement KYC :
  - documents chauffeur (CNI, permis, selfie, etc. selon `documents.*`)

### OTP (option activée par défaut en mode admin v1)
- Le wizard exige `driverPhoneVerified === true` si `requirePhoneOtp` est actif.

---

## 1. Vérification du téléphone chauffeur (OTP)

Le composant `DriverPhoneOtpBlock` utilise :

1. **Envoi OTP**
   - `POST /v1/auth/driver/resend-otp`
   - Body (schéma):
     - `countryCode`: ex. `CI`
     - `phone`: *numéro local* dérivé du téléphone saisi

2. **Vérification OTP**
   - `POST /v1/auth/driver/verify-otp`
   - Body (schéma):
     - `countryCode`
     - `phone`: numéro local
     - `code`: OTP (digits, min 4)

Si l’OTP n’est pas vérifiée, la création chauffeur v1 côté partenaire échoue (contrôle `phoneVerified !== true`).

---

## 2. Création du véhicule

La création du véhicule appelle :

- `POST /v1/vehicles`
- Body (`ApiV1VehicleCreateBody`):
  - `partnerId`
  - `categoryCode`
  - `brandCode`, `modelCode`, `colorCode`
  - `manufactureYear`
  - `seatsCount` (optionnel)
  - `plateNumber` (optionnel)

Réponse attendue :
- `vehicle.id` (identifiant du véhicule)

---

## 3. Upload des pièces du véhicule (KYC/pieces)

Le wizard upload les “pieces” du véhicule via :

1. **Signed URL (stockage)**
   - `POST /v1/uploads/signed-url`
   - Body (schéma):
     - `purpose: "kyc"`
     - `fileName`, `filename`
     - `contentType`, `mimeType`
     - `documentTypeCode`

2. **PUT fichier** (vers l’URL signée retournée)
   - `PUT <signedUrl>`
   - Body : binaire du fichier

3. **Enregistrement du document pour le véhicule**
   - `POST /v1/partners/{partnerId}/vehicles/{vehicleId}/documents`
   - Body (le code tente plusieurs formes selon ce qui est renvoyé) :
     - `uploadId` + `documentTypeCode`
     - ou `upload_id` + `document_type_code`
     - et éventuellement avec `storageRef` (si fourni dans la réponse signed-url)

---

## 4. Création du chauffeur (rattaché au partenaire) + upload documents

Une fois le véhicule créé, `applyVehicleCreateFlow(...)` crée le chauffeur et le rattache au même `partnerId`.

### 4.1 Création chauffeur (via API “partners”)

Comme un `partnerId` est fourni, la création utilise :

- `POST /v1/partners/{partnerId}/drivers`
- Body (schéma):
  - `firstName`, `lastName`
  - `phone` (téléphone normalisé)
  - `email` (ou un email placeholder si absent)
  - `password` (valeur interne de dev côté code)
  - `rideCategoryCode` (par défaut : `ECO` ou venant du contexte)

Réponse :
- `driver.id` (identifiant du chauffeur)

### 4.2 Upload documents chauffeur

Pour chaque document chauffeur, le code exécute le même workflow signed-url :

1. `POST /v1/uploads/signed-url`
2. `PUT <signedUrl>` (binaire)
3. `POST /v1/partners/{partnerId}/drivers/{driverId}/documents`
   - Body : `uploadId/documentTypeCode` (ou variantes `upload_id/document_type_code` + `storageRef` si présent)

---

## 5. Assignation du chauffeur au véhicule

Enfin, `applyVehicleCreateFlow(...)` assigne le chauffeur au véhicule :

- `POST /v1/partners/{partnerId}/vehicles/{vehicleId}/assign-driver`
- Body (le code tente 2 variantes) :
  - `driverId`
  - ou `driver_id`

Réponse :
- contient typiquement l’objet `vehicle` (ou `assignment.vehicle`) permettant de finir l’écran “véhicule avec chauffeur”.

---

## Legacy (si mode legacy activé)

Quand `useLegacyAdminApi()` est vrai :

1. Les documents véhicule peuvent passer par :
   - `POST /admin/fleet/vehicles/{vehicleId}/documents`
   - (et documents chauffeur via endpoints “partner” legacy si besoin)

2. L’assignation chauffeur au véhicule peut passer par :
   - `POST /admin/fleet/vehicles/{vehicleId}/assign-driver`
   - Body :
     - `driver_id`
     - `driver_name`

Le reste (création v1 vs legacy, signed-url, etc.) dépend de la combinaison des flags utilisés dans les services.

---

## Où regarder dans le code

- Wizard : `src/features/fleet/components/fleet-pair-wizard/FleetPairCreateWizard.tsx`
- Orchestration création+assign : `src/features/fleet/api/vehicleCreateFlow.ts`
- Création véhicule : `src/features/fleet/api/adminVehicles.service.ts`
- OTP chauffeur : `src/features/fleet/api/driverOtp.service.ts` (+ `DriverPhoneOtpBlock.tsx`)
- Création chauffeur (v1) : `src/features/fleet/api/partnerDrivers.v1.service.ts`
- Upload signed-url + attachement docs :
  - `src/features/fleet/api/kycDocumentUpload.v1.service.ts`

