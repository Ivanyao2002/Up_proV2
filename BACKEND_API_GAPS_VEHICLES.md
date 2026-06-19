# API Gaps — Véhicules Partenaire (Franchise)

> Rapport des écarts entre la réalité API et les besoins frontend pour la gestion des véhicules d'un partenaire depuis le portail franchise.

---

## 📋 Endpoints Confirmés

| Méthode | Route | Statut | Notes |
|---------|-------|--------|-------|
| `GET` | `/v1/partners/{partnerId}/vehicles` | ✅ Fonctionne | Liste avec labels inline |
| `GET` | `/v1/vehicles/{vehicleId}` | ✅ Fonctionne | Détail avec brand/model/color/driver enrichis |

---

## ✅ Structure Réponse Liste — `/v1/partners/{partnerId}/vehicles`

```json
{
  "status": "ok",
  "items": [
    {
      "id": "bc11be7d-...",
      "partner_id": "71a1aad7-...",
      "driver_id": "aebee3a2-...",
      "plate_number": "1234 AB 01",
      "brand_id": "c7377813-...",
      "model_id": "c4da3554-...",
      "category_id": "4c67cefb-...",
      "status": "approved",
      "manufacture_year": 2018,
      "seats_count": 5,
      "brandLabel": "Toyota",
      "modelLabel": "Corolla",
      "categoryCode": "ECO",
      "partnerName": "Partner Dev Abidjan",
      "documentsSummary": {
        "requiredCount": 2,
        "uploadedCount": 1,
        "approvedCount": 0,
        "pendingCount": 1,
        "missingCount": 1,
        "missingTypes": ["INSURANCE"],
        "isComplete": false
      },
      "driverSummary": {
        "hasAssignedDriver": true,
        "driverId": "aebee3a2-..."
      },
      "complianceStatus": "incomplete_documents"
    }
  ],
  "counters": {
    "total": 9, "approved": 9, "pending": 0,
    "assigned": 4, "unassigned": 5
  },
  "pagination": { "page": 1, "limit": 25, "total": 9 }
}
```

**Points notables :**
- Labels `brandLabel`, `modelLabel`, `categoryCode`, `partnerName` directement dans l'item → pas besoin de lookups catalogue
- `driverSummary.hasAssignedDriver` indique si un chauffeur est affecté (mais pas son nom)
- `documentsSummary` et `complianceStatus` disponibles pour affichage compliance

---

## ✅ Structure Réponse Détail — `GET /v1/vehicles/{vehicleId}`

```json
{
  "status": "ok",
  "vehicle": {
    "id": "bc11be7d-...",
    "plate_number": "1234 AB 01",
    "manufacture_year": 2018,
    "seats_count": 5,
    "status": "approved",
    "brand": { "code": "TOYOTA", "label": "Toyota" },
    "model": { "code": "COROLLA", "label": "Corolla" },
    "color": { "code": "GRIS", "label": "Gris", "hex": "#808080" },
    "category": { "code": "ECO", "label": "Economique" },
    "label": "Toyota Corolla · 1234 AB 01",
    "partner": { "tradeName": "Partner Dev Abidjan" },
    "driver": {
      "id": "aebee3a2-...",
      "displayName": "Awa Kone",
      "profile": { "firstName": "Awa", "lastName": "Kone" },
      "approvalStatus": "approved",
      "availabilityStatus": "offline"
    },
    "documents": [
      {
        "id": "82e59364-...",
        "document_type_code": "REGISTRATION_CARD",
        "document_type_label": "Carte grise",
        "file_url": "https://...",
        "status": "pending",
        "submitted_at": "2026-06-18T16:44:15.925198+00:00"
      }
    ],
    "documentsSummary": { "requiredCount": 2, "uploadedCount": 1, "isComplete": false }
  }
}
```

---

## ❌ Endpoints Manquants — Actions sur Véhicule (Franchise)

### MODIFIER un véhicule

**Endpoint attendu :**
```
PATCH /v1/franchises/{franchiseId}/partners/{partnerId}/vehicles/{vehicleId}
```
ou
```
PATCH /v1/vehicles/{vehicleId}
```

**Statut :** ❓ Non testé — pas de route franchise documentée  
**Payload attendu :**
```json
{
  "plateNumber": "1234 AB 01",
  "brandCode": "TOYOTA",
  "modelCode": "COROLLA",
  "colorCode": "GRIS",
  "manufactureYear": 2018,
  "seatsCount": 5
}
```

**Fix frontend :** Formulaire de modification structuré mais soumission bloquée (TODO commenté) jusqu'à confirmation backend.

---

### SUPPRIMER un véhicule

**Endpoint attendu :**
```
DELETE /v1/franchises/{franchiseId}/partners/{partnerId}/vehicles/{vehicleId}
```
ou
```
DELETE /v1/vehicles/{vehicleId}
```

**Statut :** ❓ Non testé  
**Fix frontend :** Bouton Supprimer avec modale de confirmation, mutation no-op jusqu'à confirmation backend.

---

### ASSIGNER / DÉSASSIGNER un chauffeur

**Endpoint existant admin :**
```
POST /v1/partners/{partnerId}/vehicles/{vehicleId}/assign-driver
```

**Statut côté franchise :** ❓ Non testé avec token franchise  
**Fix frontend :** Action non implémentée dans le portail franchise.

---

### APPROUVER / REJETER un véhicule

**Statut :** Ces actions sont **admin uniquement** — le portail franchise ne doit pas les exposer.

---

## ⚠️ À Tester

| Action | Route | Statut |
|--------|-------|--------|
| Modifier un véhicule | `PATCH /v1/vehicles/{id}` | ❓ À tester avec token franchise |
| Supprimer un véhicule | `DELETE /v1/vehicles/{id}` | ❓ À tester avec token franchise |
| Assigner un chauffeur | `POST /v1/partners/{id}/vehicles/{vid}/assign-driver` | ❓ À tester avec token franchise |
| Uploader un document | `POST /v1/partners/{id}/vehicles/{vid}/documents` | ❓ À tester |

---

## 🔧 Structure Frontend Préparée (En Attente Backend)

**Fichiers concernés :**
- `src/features/franchise/api/partners.service.ts` — `getVehicles` ✅ implémenté
- `src/features/franchise/api/partners.queries.ts` — `useFranchisePartnerVehicles` ✅ implémenté
- `src/features/franchise/pages/FranchisePartnerDetailPage.tsx` — `TabVehicles` ✅ implémentée

**TODO une fois les endpoints confirmés :**
1. Ajouter `updateVehicle(vehicleId, payload)` dans `partners.service.ts`
2. Ajouter `deleteVehicle(vehicleId)` dans `partners.service.ts`
3. Ajouter `useUpdateFranchisePartnerVehicle` et `useDeleteFranchisePartnerVehicle` dans `partners.queries.ts`
4. Connecter les mutations dans `TabVehicles` (boutons Modifier + Supprimer)
5. Ajouter les endpoints dans `LINKS.franchise.v1` dans `links.ts`

---

## 📝 Observations Supplémentaires

- **`color` absent en liste** : la liste ne retourne pas `colorLabel` — la couleur n'est disponible qu'en détail via `color.label`
- **`driver.displayName` absent en liste** : `driverSummary` indique juste `hasAssignedDriver: true` sans le nom — le nom du chauffeur nécessite un appel supplémentaire ou l'API doit enrichir l'item liste
- **`counters`** disponibles : `assigned`, `unassigned`, `approved` → peuvent alimenter des KpiCards en haut de la tab Véhicules
