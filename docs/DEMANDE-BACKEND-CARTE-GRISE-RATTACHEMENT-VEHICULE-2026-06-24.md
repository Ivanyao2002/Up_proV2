# Demande backend — la carte grise est rattachée au chauffeur mais pas au véhicule

**Date :** 24 juin 2026
**Portails concernés :** Admin, Partenaire (fiche véhicule, KYC véhicule)
**Environnement observé :** préprod LIVE (`api.upjunoo-dev.tech`)
**Priorité :** haute — un véhicule conforme apparaît « non conforme » (carte grise manquante)

---

## 1. Résumé du problème

La **carte grise** (`VEHICLE_REGISTRATION` / libellé « Carte grise ») est bien **uploadée**, mais elle est **rattachée au chauffeur** (`subject_type: "DRIVER"`) au lieu d'être rattachée au **véhicule**.

Conséquence : l'endpoint **véhicule** ne la voit pas. Il renvoie `documents: []` et déclare la carte grise **manquante** (`missingTypes: ["REGISTRATION_CARD", …]`), alors que le document existe et est consultable depuis la fiche chauffeur.

Deux écarts à corriger :

1. **Rattachement** : le document est lié au **DRIVER**, pas au **VEHICLE**.
2. **Code de type** : côté KYC chauffeur c'est `VEHICLE_REGISTRATION`, côté résumé véhicule c'est `REGISTRATION_CARD` — **deux codes différents pour le même document**.

---

## 2. Cas concret

| Élément | Valeur |
|---------|--------|
| Partenaire | `71a1aad7-ad23-41ca-a6d0-b904d5953271` |
| Véhicule | `51c6e57f-93d9-416b-8b58-4f0bfdc33572` (Suzuki Dzire · AA-345-AF) |
| Chauffeur assigné | `d2c36d98-1fda-4e66-865c-b8f19e381243` (VENANCE KASSI) |
| Document carte grise | `81b66443-160c-4280-bee6-025adab02a2a` |

Le véhicule a bien `driver_id = d2c36d98…` et le chauffeur a bien `current_vehicle_id = 51c6e57f…` → **le lien chauffeur ↔ véhicule existe**.

---

## 3. Données observées

### 3.1 Endpoint véhicule → carte grise **manquante**

`GET /v1/partners/71a1aad7-…/vehicles/51c6e57f-…`

```jsonc
"vehicle": {
  "id": "51c6e57f-93d9-416b-8b58-4f0bfdc33572",
  "driver_id": "d2c36d98-1fda-4e66-865c-b8f19e381243",
  "plate_number": "AA-345-AF",
  "documents": [],                       // ❌ vide
  "documentsSummary": {
    "requiredCount": 2,
    "uploadedCount": 0,
    "approvedCount": 0,
    "missingCount": 2,
    "missingTypes": ["REGISTRATION_CARD", "INSURANCE"],   // ❌ carte grise déclarée manquante
    "isComplete": false,
    "hasAnyDocument": false
  }
}
```

### 3.2 Endpoint chauffeur → la **même** carte grise est bien là, rattachée au DRIVER

`GET …/drivers/d2c36d98-…` → `kycDocuments[]` :

```jsonc
{
  "id": "81b66443-160c-4280-bee6-025adab02a2a",
  "subject_type": "DRIVER",                               // ⚠️ rattachée au chauffeur
  "subject_id": "d2c36d98-1fda-4e66-865c-b8f19e381243",
  "document_type_code": "VEHICLE_REGISTRATION",           // ⚠️ code différent de REGISTRATION_CARD
  "document_type_label": "Carte grise",
  "document_group": "VEHICLE_REGISTRATION",
  "status": "pending",
  "submitted_at": "2026-06-23T13:13:46.719227+00:00",
  "file_url": "https://…/VEHICLE_REGISTRATION/…-vehicle_registration.jpg"
}
```

> Le document **existe**, il est **uploadé** (status `pending`), il est **consultable** — mais l'endpoint véhicule l'ignore.

---

## 4. Analyse

La carte grise est, par nature, un **document du véhicule** (immatriculation du véhicule, pas du chauffeur). Or :

- Elle est enregistrée avec `subject_type = DRIVER` / `subject_id = driverId` (pendant l'onboarding chauffeur).
- L'endpoint véhicule cherche les documents du véhicule (`subject = VEHICLE` / `vehicleId`) → ne trouve rien.
- Même si le rattachement était corrigé, le **code diffère** : `VEHICLE_REGISTRATION` (KYC) ≠ `REGISTRATION_CARD` (résumé véhicule) → le `documentsSummary` ne le réconcilierait toujours pas.

---

## 5. Comportement attendu

Quand une carte grise (`VEHICLE_REGISTRATION` / `REGISTRATION_CARD`) est uploadée pour un chauffeur **rattaché à un véhicule** :

1. **Rattacher le document au véhicule** : soit le stocker avec `subject_type = VEHICLE` / `subject_id = vehicleId`, soit l'exposer via le véhicule par résolution du chauffeur assigné (`driver_id`/`current_vehicle_id`).
2. **Unifier le code de type** : `VEHICLE_REGISTRATION` et `REGISTRATION_CARD` doivent désigner le même document (alias ou code unique), pour que le matching fonctionne.
3. **Refléter le document dans `documentsSummary` du véhicule** : la carte grise doit compter comme **présente** (`uploadedCount ≥ 1`, retirée de `missingTypes`, `hasAnyDocument: true`).

### Résultat attendu pour le cas concret

```jsonc
"documents": [ { "document_type_code": "REGISTRATION_CARD", "status": "pending", "...": "..." } ],
"documentsSummary": {
  "requiredCount": 2,
  "uploadedCount": 1,                       // ✅ carte grise comptée
  "missingCount": 1,
  "missingTypes": ["INSURANCE"],            // ✅ seule l'assurance reste manquante
  "hasAnyDocument": true,
  "isComplete": false
}
```

> Note : `INSURANCE` est, lui, **réellement** absent (non présent dans les documents du chauffeur) — il doit rester manquant. Seule la carte grise est concernée par ce bug.

---

## 6. Critères d'acceptation

- [ ] La carte grise uploadée pour un chauffeur rattaché à un véhicule est **visible** dans `vehicle.documents[]`.
- [ ] `documentsSummary` du véhicule **ne liste plus** `REGISTRATION_CARD` dans `missingTypes` quand le document existe.
- [ ] `uploadedCount` / `hasAnyDocument` du véhicule reflètent la présence de la carte grise.
- [ ] Les codes `VEHICLE_REGISTRATION` et `REGISTRATION_CARD` sont **réconciliés** (un seul code, ou alias mappé des deux côtés).
- [ ] `INSURANCE` reste correctement signalé comme manquant tant qu'il n'est pas fourni.
- [ ] Cohérence vérifiée sur le cas : véhicule `51c6e57f-…` / chauffeur `d2c36d98-…`.

---

## 7. Questions ouvertes pour le backend

- La carte grise doit-elle être **stockée** sous `subject = VEHICLE`, ou **résolue dynamiquement** via le chauffeur assigné ? (préférence produit : rattachée au véhicule, car elle suit le véhicule, pas le chauffeur).
- En cas de **changement de véhicule** du chauffeur, la carte grise doit suivre le **véhicule** (et non rester sur le chauffeur). À confirmer.
- Quel code de type fait référence : `VEHICLE_REGISTRATION` ou `REGISTRATION_CARD` ? (uniformiser le référentiel des `document_type_code`).

---

## 8. Impact si livré

- Les fiches véhicule (admin + partenaire) affichent correctement la conformité documentaire.
- Plus de faux « carte grise manquante » sur des véhicules pourtant en règle.
- Cohérence entre la vue chauffeur (KYC) et la vue véhicule (documents).
