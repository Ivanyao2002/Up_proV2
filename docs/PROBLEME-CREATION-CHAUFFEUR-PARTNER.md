# Problème — Création chauffeur partenaire (`PARTNER_DRIVER_AUTH_CREATE_FAILED`)

> **Date** : 15 juin 2026  
> **Environnement** : `https://api.upjunoo-dev.tech` (proxy local `/upjunoo-api`)  
> **Contexte** : wizard création véhicule + chauffeur (binôme), back-office admin ou partenaire

---

## Symptôme observé

Lors de la création d’un chauffeur couplée à un véhicule, l’appel suivant échoue **systématiquement** avec un numéro « nouveau » :

```http
POST /v1/partners/{partnerId}/drivers
Content-Type: application/json
X-Client-Type: back-office
Authorization: Bearer <JWT admin ou partenaire>
```

**Exemple réel :**

```
POST http://localhost:3000/upjunoo-api/v1/partners/71a1aad7-ad23-41ca-a6d0-b904d5953271/drivers
→ HTTP 400 Bad Request
```

```json
{
  "status": "error",
  "generatedAt": "2026-06-15T16:48:33.378Z",
  "error": {
    "code": "PARTNER_DRIVER_AUTH_CREATE_FAILED",
    "message": "Phone number already registered by another user"
  }
}
```

**Ressenti utilisateur** : quel que soit le numéro saisi (même jamais utilisé auparavant), la création chauffeur est refusée.

---

## Ce que fait le front avant cet appel

### 1. Saisie du numéro (wizard binôme)

Fichier : `VehicleCreateDriverSection.tsx`

- L’indicatif vient du pays du partenaire (ex. `+225` pour Côte d’Ivoire).
- Le numéro local est converti en **international** : `buildInternationalPhone(dialCode, local)`  
  Ex. saisie `07 12 34 56 78` → `+225712345678`.

### 2. Vérification OTP (obligatoire en mode API v1)

Fichier : `driverOtp.service.ts`

| Étape | Route | Body envoyé |
|-------|--------|-------------|
| Envoi code | `POST /v1/auth/driver/resend-otp` | `{ countryCode: "CI", phone: "0712345678" }` — **format local avec 0** |
| Vérification | `POST /v1/auth/driver/verify-otp` | `{ countryCode: "CI", phone: "0712345678", code: "123456" }` |

L’OTP peut réussir alors que la création échoue ensuite : ce sont **deux étapes distinctes** côté backend.

### 3. Création du véhicule puis du chauffeur

Fichier : `vehicleCreateFlow.ts` → `partnerDrivers.v1.service.ts`

1. `POST /v1/vehicles` — création véhicule (souvent OK).
2. Upload documents véhicule (signed-url → PUT → `…/vehicles/{id}/documents`) si pièces jointes.
3. `POST /v1/partners/{partnerId}/drivers` — **échec ici**.

**Body typique envoyé par le front :**

```json
{
  "firstName": "Jean",
  "lastName": "Kouassi",
  "phone": "+225712345678",
  "email": "driver.2257123456781739456123456@placeholder.upjunoo.dev",
  "password": "Upjunoo@Dev2026!",
  "rideCategoryCode": "ECO"
}
```

Points importants :

- `phone` est au format **E.164** (`+225…`), pas le format local utilisé pour l’OTP.
- `email` est généré automatiquement si l’utilisateur n’en saisit pas (`driver.{digits}.{timestamp}@placeholder.upjunoo.dev`).
- `password` est **fixe en dev** (`Upjunoo@Dev2026!`) pour tous les chauffeurs créés via le back-office.

---

## Interprétation de l’erreur API

| Champ | Signification |
|-------|----------------|
| `PARTNER_DRIVER_AUTH_CREATE_FAILED` | L’étape **création compte Auth** (Supabase / couche identité) a échoué **avant** ou **pendant** la création de la fiche `driver` en base métier. |
| `Phone number already registered by another user` | Le numéro est déjà présent dans le référentiel **auth** (ou équivalent), rattaché à **un autre** `user_id` — pas forcément à un chauffeur actif visible dans le back-office. |

Ce n’est **pas** une erreur de validation front (format JSON, champs manquants). Le backend a bien reçu la requête et a tenté de créer l’identité.

---

## Pourquoi « tous les numéros » semblent pris

Plusieurs causes possibles, souvent cumulatives en environnement **dev** :

### A. Numéro déjà en base Auth (cause la plus probable)

Le même numéro peut déjà exister sous une autre entité :

- compte **client** (`POST /v1/auth/client/register`) ;
- chauffeur créé lors d’un **test précédent** (même échoué partiellement) ;
- compte **admin / partenaire / franchise** de test ;
- seed de données GN (ex. chauffeurs `+2250501…` dans la base dev).

Le back-office liste les chauffeurs **métier**, pas tous les comptes Auth : un numéro peut être « pris » sans apparaître dans l’UI.

### B. Désynchronisation format OTP vs création

| Flux | Format `phone` |
|------|----------------|
| OTP chauffeur | Local `0712345678` + `countryCode: CI` |
| Création partenaire | International `+225712345678` |

Si le backend normalise mal (double `0`, `225` sans `+`, etc.), il peut :

- considérer des numéros différents comme identiques ;
- ou avoir créé un enregistrement Auth à l’étape OTP qui bloque la création complète.

**À vérifier côté API** : une seule clé de unicité normalisée E.164 pour OTP, register et `POST …/drivers`.

### C. Effet des tests répétés

Chaque tentative de `POST …/drivers` peut laisser un **user Auth orphelin** si :

- l’Auth est créée puis l’insert `driver` échoue ;
- ou l’OTP enregistre le numéro sans finaliser le profil chauffeur.

Après quelques essais sur la même plage (`07…`, `05…`), beaucoup de numéros deviennent « déjà enregistrés ».

### D. Écart front mineur (normalisation)

- `partnerDriversService.create()` normalise le téléphone (`normalizePhoneE164`).
- `createWithDocuments()` — utilisé par le **wizard véhicule** — **ne repasse pas** par cette normalisation (le numérique UI est déjà en `+225…` en principe).

Impact limité si l’UI formate correctement, mais à aligner pour éviter des doubles formats.

---

## Ordre des appels réseau (création binôme complète)

```
[Utilisateur] Saisie chauffeur + OTP OK
       ↓
POST /v1/vehicles                          → 201 véhicule
       ↓
POST /v1/uploads/signed-url + PUT Supabase   → pièces véhicule (optionnel)
POST …/vehicles/{id}/documents
       ↓
POST /v1/partners/{id}/drivers             → 400 PARTNER_DRIVER_AUTH_CREATE_FAILED  ← bloquant
       ↓
(upload documents chauffeur — non exécuté si étape précédente échoue)
```

Si le véhicule est créé mais le chauffeur non : **véhicule orphelin** sans conducteur assigné.

---

## Pistes de diagnostic (équipe backend)

1. **Rechercher le numéro en base Auth** (Supabase `auth.users` ou table équivalente) pour les variantes :
   - `+225712345678`
   - `225712345678`
   - `0712345678`
2. **Tracer** `POST /v1/partners/{id}/drivers` : à quelle sous-étape exacte `PARTNER_DRIVER_AUTH_CREATE_FAILED` est levé.
3. **Vérifier** si `driver/resend-otp` + `driver/verify-otp` créent déjà un user Auth sans driver métier.
4. **Tester** avec un numéro hors plages seed (ex. `+225999887766`) jamais utilisé en dev.
5. **Documenter** le format `phone` attendu dans le Swagger (`E.164` vs local + `countryCode`).

---

## Pistes de diagnostic (équipe front / QA)

1. Onglet Réseau : copier le body exact de `POST …/drivers` (champ `phone`, `email`).
2. Confirmer que l’OTP a bien répondu **200** sur `driver/verify-otp` juste avant.
3. Vérifier que le `partnerId` dans l’URL correspond au partenaire sélectionné dans le wizard admin.
4. Ne pas réutiliser les numéros des chauffeurs seed (`Chauffeur GN …` dans la liste admin).

---

## Demandes backend suggérées

| # | Demande | Bénéfice |
|---|---------|----------|
| B1 | Message d’erreur enrichi : `existingUserType` (CLIENT / DRIVER / ADMIN) + `normalizedPhone` | Comprendre pourquoi le numéro est pris |
| B2 | Aligner OTP et création sur **un seul** format (`phoneE164` ou `countryCode` + `phone`) | Éviter faux positifs « already registered » |
| B3 | Idempotence ou « rattacher chauffeur existant au partenaire » si le user Auth existe déjà | Reprendre après échec partiel |
| B4 | Rollback Auth si l’insert `driver` échoue après création user | Éviter de « consommer » des numéros en dev |
| B5 | Endpoint admin dev : libérer / réinitialiser un numéro de test | QA plus fluide |

---

## Contournements temporaires

| Action | Détail |
|--------|--------|
| Numéro vraiment vierge | Utiliser une plage non seedée, ex. `+22599xxxxxxxx` |
| Sandbox OTP | Code `000000` si `DEV_OTP_CODE` actif — ne garantit pas la création driver |
| Créer sans chauffeur | Décocher « Créer chauffeur » → véhicule seul, assignation plus tard |
| Mode mock | `NEXT_PUBLIC_USE_MOCKS=true` → pas d’appel API réel (dev UI uniquement) |

---

## Fichiers front concernés

| Fichier | Rôle |
|---------|------|
| `src/features/fleet/api/partnerDrivers.v1.service.ts` | `POST …/partners/{id}/drivers` |
| `src/features/partner/api/drivers.service.ts` | `createWithDocuments` → appel ci-dessus |
| `src/features/fleet/api/vehicleCreateFlow.ts` | Enchaînement véhicule → chauffeur → documents |
| `src/features/partner/components/VehicleCreateDriverSection.tsx` | Saisie téléphone international |
| `src/features/fleet/api/driverOtp.service.ts` | OTP chauffeur (format local) |
| `src/features/fleet/components/fleet-pair-wizard/FleetPairCreateWizard.tsx` | Wizard complet |

---

## Résumé en une phrase

Le front envoie correctement la requête de création chauffeur, mais le **backend refuse de créer le compte Auth** car le numéro est déjà connu dans le référentiel identité — souvent à cause de **tests précédents**, de **données seed**, ou d’un **décalage de format** entre l’OTP et la création — ce qui donne l’impression que « tous les numéros » sont bloqués.

---

## Référence Swagger

- `POST /v1/partners/{id}/drivers` — création chauffeur rattaché au partenaire  
- `POST /v1/auth/driver/resend-otp` / `driver/verify-otp` — vérification téléphone  
- [Swagger live](https://api.upjunoo-dev.tech/docs)
