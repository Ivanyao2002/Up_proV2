# Demande backend — enrichir `candidates[]` / `offers[]` du dispatch avec les infos lisibles chauffeur & véhicule

**Date :** 24 juin 2026
**Portails concernés :** Admin (détail course, console dispatch), Franchise, Partenaire
**Environnement observé :** préprod LIVE (`api.upjunoo-dev.tech`)
**Priorité :** moyenne–haute — bloque l'affichage des chauffeurs candidats dans le suivi de dispatch

---

## 1. Résumé de la demande

Dans le détail d'une course, le bloc `metadata.dispatch` expose la liste des chauffeurs **candidats** (`candidates[]`) et des **offres** envoyées (`offers[]`). Ces entrées ne contiennent **que des identifiants** (`driverId`, `userId`, `vehicleId`) et des données de scoring — **aucune information lisible** (nom du chauffeur, téléphone, photo, libellé véhicule, plaque, catégorie).

Conséquence : le back-office ne peut afficher **ni le nom du chauffeur, ni son véhicule** pour les candidats/offres. Il est obligé de retomber sur un **UUID tronqué** (« Chauffeur d2c36d98 »).

**Demande :** dénormaliser dans **chaque** `candidate` et `offer` les mêmes informations lisibles que celles déjà présentes dans le bloc `order.driver` (et `order.driver.vehicle`).

---

## 2. Où le problème se voit (front)

Le front possède déjà les infos riches pour **le chauffeur assigné** (bloc `order.driver`), mais **pas** pour les candidats/offres. Le mapper est donc contraint à un repli UUID :

```ts
// src/features/ops/api/adminOrderDetail.mapper.ts → mapDispatchOffers()
driver_name:
  driverName && (offers.length === 1 || offer.driverId === assignedDriverId)
    ? driverName                                   // OK seulement pour l'assigné
    : offer.driverId
      ? `Chauffeur ${offer.driverId.slice(0, 8)}`   // ⚠️ repli UUID pour les autres
      : "Chauffeur",
```

**Type front concerné** (à étendre une fois la donnée disponible) :
`src/features/ops/api/adminOrderDetail.api.types.ts → ApiAdminOrderDispatchOffer`

**Écrans impactés :**
- Détail course admin → panneau « Recherche de chauffeur / offres »
- Console dispatch / forensic course
- Équivalents Franchise & Partenaire (même structure `metadata.dispatch`)

---

## 3. État actuel (payload reçu)

Chaque entrée de `candidates[]` (et `offers[]`) ressemble à ceci — **identifiants uniquement** :

```jsonc
"candidates": [
  {
    "score": 0.639,
    "userId": "cde8ed10-22b1-4a8b-84be-fee1e3123eb8",
    "driverId": "eb0619d2-77ce-475f-9933-d442886749a0",
    "vehicleId": "a44fe6f2-c374-4ac3-af8e-26713edd8c10",
    "ratingAvg": 5,
    "distanceKm": 0.01,
    "etaMinutes": 4.5,
    "activeOrderId": null,
    "chainEligible": false,
    "dispatchLocation": { "latitude": 5.3872155, "longitude": -3.9606638 },
    "reliabilityScore": null,
    "rideCategoryCode": "ECO",
    "scoringBreakdown": { "...": "..." },
    "walletBalanceXof": 2320,
    "locationRecordedAt": "2026-06-23T18:36:24.211+00:00"
    // ❌ aucun nom, téléphone, photo, libellé véhicule, plaque
  }
]
```

À l'inverse, le bloc `order.driver` (chauffeur assigné) contient déjà tout ce qu'il faut :

```jsonc
"driver": {
  "id": "d2c36d98-1fda-4e66-865c-b8f19e381243",
  "driverCode": null,
  "name": "VENANCE KASSI",
  "displayName": "VENANCE KASSI",
  "phone": "+2250170928528",
  "photoUrl": null,
  "rating": 3.5,
  "ratingAvg": 3.5,
  "vehicle": {
    "id": "43484634-9164-48b0-8a75-a083ceb62764",
    "model": "Haojue HJ150",
    "brandCode": null,
    "colorCode": "Noir",
    "categoryCode": "MOTO",
    "plate": "7398KP03",
    "year": 2021
  }
}
```

**Objectif :** appliquer le même niveau de détail à **chaque** candidat et offre.

---

## 4. Comportement attendu (payload souhaité)

Ajouter dans chaque `candidate` / `offer` un sous-objet **`driver`** et **`vehicle`** (mêmes clés que le bloc `order.driver` pour la cohérence) :

```jsonc
"candidates": [
  {
    "score": 0.639,
    "userId": "cde8ed10-22b1-4a8b-84be-fee1e3123eb8",
    "driverId": "eb0619d2-77ce-475f-9933-d442886749a0",
    "vehicleId": "a44fe6f2-c374-4ac3-af8e-26713edd8c10",
    "ratingAvg": 5,
    "distanceKm": 0.01,
    "etaMinutes": 4.5,
    "activeOrderId": null,
    "chainEligible": false,
    "dispatchLocation": { "latitude": 5.3872155, "longitude": -3.9606638 },
    "rideCategoryCode": "ECO",

    // ===== AJOUTS DEMANDÉS =====
    "driver": {
      "id": "eb0619d2-77ce-475f-9933-d442886749a0",
      "driverCode": null,
      "name": "VENANCE KASSI",
      "displayName": "VENANCE KASSI",
      "phone": "+2250170928528",
      "photoUrl": null
    },
    "vehicle": {
      "id": "a44fe6f2-c374-4ac3-af8e-26713edd8c10",
      "brand": "Haojue",
      "model": "HJ150",
      "plate": "7398KP03",
      "colorCode": "Noir",
      "categoryCode": "MOTO"
    }
  }
]
```

> **Note de forme :** des **champs à plat** (`driverName`, `driverDisplayName`, `driverPhone`, `driverPhotoUrl`, `vehicleLabel`, `vehiclePlate`, `vehicleCategoryCode`) conviennent aussi. Nous **préférons les sous-objets `driver` / `vehicle`** pour rester identiques au bloc `order.driver` déjà existant (un seul format à mapper côté front).

---

## 5. Champs demandés (détail)

### Sous-objet `driver` (par candidate/offer)

| Champ | Type | Obligatoire | Remarque |
|-------|------|-------------|----------|
| `id` | string (uuid) | ✅ | = `driverId` |
| `displayName` | string | ✅ | **prioritaire pour l'affichage** |
| `name` | string | ⬜ | si différent de `displayName` |
| `phone` | string | ✅ | contact opérateur |
| `driverCode` | string \| null | ⬜ | code interne si dispo |
| `photoUrl` | string \| null | ⬜ | avatar |

### Sous-objet `vehicle` (par candidate/offer)

| Champ | Type | Obligatoire | Remarque |
|-------|------|-------------|----------|
| `id` | string (uuid) | ✅ | = `vehicleId` |
| `model` | string | ✅ | ex. `HJ150` |
| `brand` / `brandCode` | string \| null | ⬜ | marque |
| `plate` | string | ✅ | immatriculation |
| `colorCode` | string \| null | ⬜ | couleur |
| `categoryCode` | string \| null | ✅ | ex. `MOTO`, `ECO` |

> Conserver tels quels les champs déjà présents (`score`, `etaMinutes`, `distanceKm`, `ratingAvg`, `scoringBreakdown`, `walletBalanceXof`, `status`, `wave`, `offerId`, `expiresAt`, `receivedAt`, `timedOutAt`…). **Aucun champ existant à retirer ni renommer.**

---

## 6. Endpoints / emplacements concernés

Le même bloc `dispatch` (avec `offers[]` + `candidates[]`) apparaît à plusieurs endroits — l'enrichissement doit s'appliquer **partout** :

| Endpoint | Chemin du tableau |
|----------|-------------------|
| `GET /v1/admin/orders/{orderId}` | `order.dispatch.dispatch.candidates[]` et `.offers[]` |
| `GET /v1/admin/orders/{orderId}` | `order.ride.metadata.dispatch.candidates[]` et `.offers[]` |
| `GET /v1/admin/orders` (liste) | `rides[].metadata.dispatch.candidates[]` et `.offers[]` |
| `GET /v1/admin/live-map` | idem si le bloc dispatch y est exposé |

Idéalement, **un seul sérialiseur partagé** pour `candidate`/`offer` afin de garantir le même format sur toutes ces routes.

---

## 7. Critères d'acceptation

- [ ] Chaque `candidate` et chaque `offer` contient un sous-objet `driver` avec au minimum `id`, `displayName`, `phone`.
- [ ] Chaque `candidate` et chaque `offer` contient un sous-objet `vehicle` avec au minimum `id`, `model`, `plate`, `categoryCode`.
- [ ] Format **identique** entre `candidates[]`, `offers[]` et le bloc `order.driver` existant.
- [ ] Appliqué sur les routes du §6.
- [ ] Aucun champ existant supprimé/renommé (rétrocompatibilité).
- [ ] Valeurs nulles tolérées (`photoUrl`, `driverCode`, `colorCode` peuvent être `null`).

---

## 8. Impact si livré

- Le back-office affichera le **vrai nom du chauffeur + son véhicule** pour chaque candidat/offre (au lieu de « Chauffeur d2c36d98 »).
- Suppression du repli UUID dans `mapDispatchOffers` (front) → suivi de dispatch lisible (qui a été sollicité, qui a accepté/expiré, avec quel véhicule).
- Aucune requête front supplémentaire (pas de N+1 pour résoudre chaque `driverId`).
