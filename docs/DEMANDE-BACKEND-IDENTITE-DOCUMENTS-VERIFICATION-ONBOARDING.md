# Demande backend — Identité documentaire, date de naissance, genre & route de vérification (onboarding chauffeur / véhicule)

> **Date :** 2026-06-16  
> **Émetteur :** équipe front UpJunoo (admin + portail partenaire)  
> **En complément de :**  
> - `DEMANDE-BACKEND-CONTRAT-CREATION-CHAUFFEUR-VEHICULE.md`  
> - `REPONSE-BACKEND-CONTRAT-CREATION-CHAUFFEUR-VEHICULE-2026-06-16.md`  
> **Objectif :** stocker et contrôler les **numéros de pièces** (CNI, permis, carte grise), la **date de naissance** et le **genre** du chauffeur, avec une **route de pré-vérification** appelable avant création chauffeur ou véhicule.  
> **Swagger :** [https://api.upjunoo-dev.tech/docs](https://api.upjunoo-dev.tech/docs)

---

## 1. Contexte

### 1.1 État actuel (confirmé par le backend)

À la création chauffeur (`POST /v1/partners/{partnerId}/drivers`), l’API ne collecte que :

| Champ | Stocké |
|-------|--------|
| `firstName`, `lastName`, `phone` | Oui |
| `rideCategoryCode`, `zone`, `vehicleId` | Oui (optionnel) |
| **Numéro CNI** | **Non** |
| **Numéro permis** | **Non** |
| **Date de naissance** | **Non** |
| **Genre** | **Non** |

Les documents (CNI, permis, selfie) sont uploadés **séparément** en fichiers (`ID_CARD_FRONT`, `ID_CARD_BACK`, `DRIVER_LICENSE_FRONT`, etc.) **sans métadonnée texte** (pas de `documentNumber`, pas de `expiresAt` structuré côté attachement).

Pour le véhicule (`POST /v1/vehicles`) :

| Champ | Stocké | Unicité |
|-------|--------|---------|
| `plateNumber` | Oui | **Non contrainte** (doublons possibles — Q7 réponse backend) |
| `vin` | Oui (optionnel) | Non documenté |
| **Numéro carte grise** | **Non** | — |

### 1.2 Ce que le front fait déjà (sans persistance API)

Le wizard `FleetPairCreateWizard` et le pipeline d’extraction IA (`/api/document-extract`) lisent déjà sur les images :

| Source | Champs extraits localement |
|--------|---------------------------|
| CNI | `first_name`, `last_name`, `document_number` |
| Permis | `first_name`, `last_name`, `document_number` |
| Carte grise | `plate`, `brand`, `model`, `year`, `color` |

**Aujourd’hui ces valeurs servent uniquement au préremplissage UI** — elles ne sont **pas envoyées** au backend (sauf `firstName` / `lastName` / `plateNumber` saisis manuellement).

### 1.3 Besoin métier

1. **Traçabilité KYC** : conserver les numéros officiels des pièces, pas seulement les scans.
2. **Anti-doublon** : empêcher qu’un même chauffeur (CNI ou permis déjà en base) ou le même véhicule (plaque / carte grise) soit réinscrit sous un autre partenaire ou un autre téléphone.
3. **Cohérence** : comparer les numéros saisis/extraits avec ceux lus sur les documents lors de la revue KYC.
4. **UX backoffice** : retourner les conflits **avant** le submit final (étape « vérification » du wizard), pas seulement en `409` après coup.

---

## 2. Demande — nouveaux champs chauffeur

### 2.1 Champs à ajouter sur `POST /v1/partners/{partnerId}/drivers`

| Champ API (camelCase) | Alias snake_case | Obligatoire | Type | Description |
|-----------------------|------------------|-------------|------|-------------|
| `idCardNumber` | `id_card_number` | **Recommandé** *(phase 1 : optionnel, phase 2 : requis backoffice)* | string | Numéro de la carte nationale d’identité (normalisé, voir §5) |
| `driverLicenseNumber` | `driver_license_number` | **Recommandé** | string | Numéro du permis de conduire |
| `dateOfBirth` | `date_of_birth` | **Recommandé** | string (ISO `YYYY-MM-DD`) | Date de naissance |
| `gender` | — | **Recommandé** | enum | `MALE` \| `FEMALE` \| `OTHER` \| `UNSPECIFIED` |

**Stockage suggéré :**

- Colonnes dédiées sur `drivers` et/ou `profiles` (indexables, requêtables).
- Copie dans `metadata` **déconseillée** comme seule source (difficile à indexer / dédoublonner).

**Réponse enrichie (`GET` chauffeur, fiche admin) :** exposer les mêmes champs en lecture (masquage partiel optionnel en liste, complet en détail admin).

### 2.2 Champs à ajouter sur `PATCH /v1/partners/{partnerId}/drivers/{driverId}`

Mêmes champs, pour correction après extraction IA ou saisie manuelle avant approbation KYC.

### 2.3 Métadonnées document (complément fichier)

Lors de l’attachement document (`POST …/drivers/{driverId}/documents`), accepter en option :

```json
{
  "uploadId": "…",
  "documentTypeCode": "ID_CARD_FRONT",
  "documentNumber": "CI0123456789",
  "issuedAt": "2019-03-15",
  "expiresAt": "2029-03-14",
  "metadata": {
    "extractionSource": "ai",
    "extractionConfidence": 0.92
  }
}
```

| Champ | Obligatoire | Note |
|-------|-------------|------|
| `documentNumber` | Non | Doit être **cohérent** avec `idCardNumber` / `driverLicenseNumber` du profil si les deux sont fournis |
| `issuedAt` / `expiresAt` | Non | ISO 8601 date |

**Règle métier proposée :** si `idCardNumber` est envoyé à la création chauffeur **et** `documentNumber` sur `ID_CARD_FRONT`, ils doivent être **identiques après normalisation** — sinon `IDENTITY_DOCUMENT_NUMBER_MISMATCH` (400).

---

## 3. Demande — nouveaux champs véhicule

### 3.1 Champs à ajouter sur `POST /v1/vehicles`

| Champ API | Alias | Obligatoire | Type | Description |
|-----------|-------|-------------|------|-------------|
| `registrationNumber` | `registration_number` | Optionnel *(recommandé si carte grise fournie)* | string | Numéro de certificat / carte grise (hors plaque) |
| `vin` | — | Déjà existant | string | À indexer en unicité si renseigné |

### 3.2 Unicité plaque

Confirmer et implémenter une contrainte d’unicité sur `plateNumber` **par pays** (ou par `countryCode` du partenaire / franchise) — le backend a signalé l’absence de contrainte comme dette (Q7).

---

## 4. Demande — route de vérification pré-création

### 4.1 Endpoint proposé (canonique)

```http
POST /v1/partners/{partnerId}/onboarding/verify
```

**Auth :** `authenticate` + `requirePartnerAccess` (PARTNER_USER \| ADMIN).

**Rôle :** contrôle **non destructif** (aucune écriture) exécuté **avant** `POST …/drivers` ou `POST /v1/vehicles`. Le front l’appellera à la fin de l’étape « identité » du wizard (bouton « Vérifier » ou debounce avant submit).

### 4.2 Body (les blocs `driver` et `vehicle` sont indépendants — un seul peut être envoyé)

```json
{
  "driver": {
    "phone": "+2250700000000",
    "idCardNumber": "CI0123456789",
    "driverLicenseNumber": "PERMIS-2024-001234",
    "dateOfBirth": "1990-05-12",
    "gender": "MALE",
    "firstName": "Jean",
    "lastName": "Kouassi"
  },
  "vehicle": {
    "plateNumber": "2789KB01",
    "vin": "VF3XXXXXXXXXXXXXX",
    "registrationNumber": "CG-2020-987654"
  },
  "excludeDriverId": "uuid-optionnel",
  "excludeVehicleId": "uuid-optionnel"
}
```

`excludeDriverId` / `excludeVehicleId` : utiles en **édition** (ne pas se détecter soi-même comme doublon).

### 4.3 Réponse `200` — tout est OK

```json
{
  "ok": true,
  "driver": {
    "eligible": true,
    "checks": []
  },
  "vehicle": {
    "eligible": true,
    "checks": []
  }
}
```

### 4.4 Réponse `200` — conflits détectés (pas d’erreur HTTP si simple pré-check UI)

```json
{
  "ok": false,
  "driver": {
    "eligible": false,
    "checks": [
      {
        "field": "idCardNumber",
        "code": "ID_CARD_ALREADY_REGISTERED",
        "severity": "blocking",
        "message": "Ce numéro de CNI est déjà associé à un chauffeur actif.",
        "existing": {
          "driverId": "uuid",
          "partnerId": "uuid",
          "partnerName": "Fleet Abidjan",
          "approvalStatus": "approved"
        }
      },
      {
        "field": "driverLicenseNumber",
        "code": "LICENSE_ALREADY_REGISTERED",
        "severity": "blocking",
        "message": "Ce numéro de permis est déjà enregistré.",
        "existing": { "driverId": "uuid" }
      }
    ]
  },
  "vehicle": {
    "eligible": false,
    "checks": [
      {
        "field": "plateNumber",
        "code": "PLATE_ALREADY_REGISTERED",
        "severity": "blocking",
        "message": "Cette immatriculation existe déjà.",
        "existing": { "vehicleId": "uuid", "plateNumber": "2789KB01" }
      }
    ]
  }
}
```

### 4.5 Réponse `400` — données invalides

Ex. date de naissance future, genre inconnu, format CNI invalide.

```json
{
  "error": "ONBOARDING_VERIFY_VALIDATION_FAILED",
  "details": [
    { "field": "driver.dateOfBirth", "code": "DATE_OF_BIRTH_IN_FUTURE" },
    { "field": "driver.gender", "code": "GENDER_INVALID" }
  ]
}
```

### 4.6 Matrice des contrôles demandés

| Champ | Contrôle | Sévérité | Note |
|-------|----------|----------|------|
| `phone` | Existe déjà (profil non-DRIVER) | blocking | Aligné sur `DRIVER_PROFILE_ALREADY_EXISTS` |
| `phone` | Existe déjà (chauffeur autre partenaire) | **warning** ou blocking *(à arbitrer)* | Adoption vs blocage |
| `idCardNumber` | Unicité réseau | blocking | Index unique normalisé |
| `driverLicenseNumber` | Unicité réseau | blocking | Index unique normalisé |
| `dateOfBirth` | Âge minimum légal (ex. ≥ 18 ans) | blocking | Paramétrable par pays |
| `gender` | Valeur enum valide | blocking | |
| `plateNumber` | Unicité par pays | blocking | |
| `vin` | Unicité si renseigné | blocking | |
| `registrationNumber` | Unicité si renseigné | blocking | |
| `firstName` + `lastName` + `dateOfBirth` | Doublon « probable » (fuzzy) | **warning** | Non bloquant, pour alerte ops |

### 4.7 Route alternative admin (sans `partnerId`)

Si besoin côté admin global :

```http
POST /v1/admin/onboarding/verify
```

Même body, sans scope partenaire implicite ; les conflits remontent sur tout le réseau.

### 4.8 Réplication à la création (fail-fast)

Les **mêmes règles** doivent s’appliquer sur :

- `POST /v1/partners/{partnerId}/drivers` (si champs identité fournis)
- `POST /v1/vehicles`

Codes d’erreur HTTP proposés :

| Code HTTP | Code métier | Cas |
|-----------|-------------|-----|
| 409 | `ID_CARD_ALREADY_REGISTERED` | CNI déjà utilisée |
| 409 | `LICENSE_ALREADY_REGISTERED` | Permis déjà utilisé |
| 409 | `PLATE_ALREADY_REGISTERED` | Plaque déjà utilisée |
| 409 | `VIN_ALREADY_REGISTERED` | VIN déjà utilisé |
| 409 | `REGISTRATION_NUMBER_ALREADY_REGISTERED` | Carte grise déjà utilisée |
| 400 | `DRIVER_UNDERAGE` | Âge < minimum |
| 400 | `IDENTITY_DOCUMENT_NUMBER_MISMATCH` | Numéro profil ≠ numéro sur document attaché |

---

## 5. Règles de normalisation (proposition)

Le backend doit **normaliser avant comparaison et stockage** :

| Champ | Règle |
|-------|-------|
| `idCardNumber` | Uppercase, supprimer espaces / tirets / points |
| `driverLicenseNumber` | Uppercase, supprimer espaces |
| `plateNumber` | Uppercase, supprimer espaces *(déjà partiellement fait)* |
| `vin` | Uppercase, 17 caractères alphanumériques |
| `registrationNumber` | Uppercase, alphanumérique compact |
| `dateOfBirth` | UTC date `YYYY-MM-DD`, refuser heure |
| `gender` | Enum strict |

Documenter ces règles dans Swagger pour que le front puisse pré-valider côté client.

---

## 6. Intégration front prévue

### 6.1 Wizard chauffeur + véhicule

Ordre cible :

```
1. Scan / upload documents (IA extrait numéros + identité)
2. Formulaire identité (prénom, nom, téléphone, CNI n°, permis n°, date naissance, genre)
3. POST …/onboarding/verify  ← NOUVEAU
4. Si ok → création véhicule + chauffeur + uploads + assignation
5. Si conflit → afficher les checks (bloquants vs warnings)
```

### 6.2 Champs UI à ajouter (backoffice)

| Champ UI | Source | Envoi API |
|----------|--------|-----------|
| Numéro CNI | IA CNI + édition manuelle | `idCardNumber` |
| Numéro permis | IA permis + édition manuelle | `driverLicenseNumber` |
| Date de naissance | IA CNI + saisie | `dateOfBirth` |
| Genre | Saisie (liste déroulante) | `gender` |

Le front étendra aussi le prompt IA CNI pour extraire `date_of_birth` et `gender` (aujourd’hui seuls prénom, nom et `document_number` sont demandés).

### 6.3 Exemple nominal complet (avec nouveaux champs)

```http
POST /v1/partners/{partnerId}/onboarding/verify
{
  "driver": {
    "phone": "+2250700000000",
    "idCardNumber": "CI0123456789",
    "driverLicenseNumber": "PERMIS2024001234",
    "dateOfBirth": "1990-05-12",
    "gender": "MALE",
    "firstName": "Jean",
    "lastName": "Kouassi"
  },
  "vehicle": {
    "plateNumber": "2789KB01",
    "registrationNumber": "CG2020987654"
  }
}
→ 200 { "ok": true, … }

POST /v1/partners/{partnerId}/drivers
{
  "firstName": "Jean",
  "lastName": "Kouassi",
  "phone": "+2250700000000",
  "idCardNumber": "CI0123456789",
  "driverLicenseNumber": "PERMIS2024001234",
  "dateOfBirth": "1990-05-12",
  "gender": "MALE",
  "rideCategoryCode": "ECO"
}
→ 201 { "driver": { "id": "…", "kyc_status": "pending" } }

POST /v1/vehicles
{
  "partnerId": "uuid",
  "categoryCode": "ECO",
  "brandCode": "PEUGEOT",
  "modelCode": "301",
  "colorCode": "GRIS",
  "manufactureYear": 2018,
  "plateNumber": "2789KB01",
  "registrationNumber": "CG2020987654"
}
→ 201 { "vehicle": { "id": "…" } }
```

---

## 7. Questions ouvertes pour le backend

| # | Question |
|---|----------|
| Q1 | Les champs identité sont-ils **obligatoires à la création backoffice** ou seulement à l’**approbation KYC** ? |
| Q2 | Un chauffeur existant (même CNI) peut-il être **adopté** par un autre partenaire (comme le téléphone) ou faut-il **bloquer** ? |
| Q3 | Faut-il une **unicité globale** ou **par franchise / pays** ? |
| Q4 | Où stocker : table `drivers`, `profiles`, ou table dédiée `driver_identity_documents` ? |
| Q5 | Le numéro CNI / permis doit-il être **masqué** dans les listes API (RGPD) ? Ex. `CI01****6789` |
| Q6 | Âge minimum conducteur : fixe (18 ans) ou paramètre `ref_countries.min_driver_age` ? |
| Q7 | La route `verify` doit-elle aussi contrôler la **cohérence prénom/nom** entre CNI et permis (warning) ? |
| Q8 | Faut-il indexer `registrationNumber` séparément de `plateNumber` (carte grise CI : les deux coexistent) ? |
| Q9 | En self-onboarding mobile (`POST /v1/auth/driver/register`), mêmes champs et mêmes contrôles ? |
| Q10 | Historique : que faire si un chauffeur change de CNI (renouvellement) — mise à jour avec audit trail ? |

---

## 8. Phasage proposé

| Phase | Backend | Front |
|-------|---------|-------|
| **P0** | Route `POST …/onboarding/verify` + unicité `plateNumber`, `idCardNumber`, `driverLicenseNumber` | Appel verify avant submit ; champs formulaire |
| **P1** | Champs sur `POST …/drivers` + `POST /v1/vehicles` + codes 409 | Envoi des champs à la création |
| **P2** | `documentNumber` à l’attachement + cohérence profil/document | Envoi metadata après upload |
| **P3** | Warnings fuzzy (nom + date naissance), masquage RGPD, paramètres par pays | Alertes ops dans le wizard |

---

## 9. Critères d’acceptation

- [ ] Swagger documente les nouveaux champs chauffeur / véhicule et la route `onboarding/verify`.
- [ ] Un doublon de CNI ou de permis renvoie un conflit explicite **avant** création (verify) et **à** la création (409).
- [ ] Un doublon de plaque renvoie un conflit explicite.
- [ ] `dateOfBirth` et `gender` sont persistés et lisibles sur la fiche chauffeur admin.
- [ ] Les numéros sont normalisés de façon déterministe (même entrée → même clé d’unicité).
- [ ] Les alias snake_case restent acceptés en entrée (cohérent avec le contrat existant).

---

## 10. Références front (implémentation actuelle)

| Élément | Fichier |
|---------|---------|
| Wizard création paire chauffeur/véhicule | `src/features/fleet/components/fleet-pair-wizard/FleetPairCreateWizard.tsx` |
| Extraction IA (CNI, permis, carte grise) | `src/app/api/document-extract/` |
| Types champs extraits | `src/features/fleet/lib/documentExtraction.types.ts` |
| Upload documents KYC | `src/features/fleet/api/kycDocumentUpload.v1.service.ts` |
| Flow HTTP | `docs/FLOW-CREATION-CHAUFFEUR-VEHICULE.md` |

---

*Document rédigé par l’équipe front — en attente de validation / arbitrage backend.*
