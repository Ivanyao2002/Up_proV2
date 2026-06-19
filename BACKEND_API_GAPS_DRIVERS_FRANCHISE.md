# Rapport Backend — Écarts API Chauffeurs (Franchise vs Admin)

**Date :** 2026-06-18  
**Portail concerné :** Franchise  
**Auteur :** Frontend (Cascade)

---

## 1. Liste des chauffeurs incomplète

### Symptôme
L'admin affiche **7 chauffeurs** pour la franchise `1bb2bff7-edcc-496d-a87a-4126c19be278`, mais le portail franchise n'en retourne que **3**.

### Endpoint utilisé côté franchise
```
GET /v1/franchise/drivers
```
*(route contextuelle — le franchiseId est résolu depuis le token JWT)*

### Endpoint admin de référence
```
GET /v1/admin/drivers?franchise_id=1bb2bff7-edcc-496d-a87a-4126c19be278
```

### Hypothèses
- La route contextuelle `/v1/franchise/drivers` applique un filtre supplémentaire non documenté (ex : seulement les chauffeurs `active`, exclut les `suspended`, filtre par partenaire direct, etc.)
- La pagination par défaut pourrait différer
- Un scope de permission restreint les chauffeurs visibles selon le rôle `franchise`

### Action demandée au backend
> S'assurer que `GET /v1/franchise/drivers` retourne **tous** les chauffeurs appartenant à la franchise (quel que soit leur statut), avec le même périmètre que l'endpoint admin filtré par `franchise_id`.

---

## 2. Détail chauffeur — Données incomplètes

### Symptôme
Le portail franchise appelle `/v1/franchise/drivers/{driverId}` mais la réponse est bien moins riche que la réponse admin.

### Endpoint utilisé côté franchise
```
GET /v1/franchise/drivers/{driverId}
```
ou
```
GET /v1/franchises/{franchiseId}/drivers/{driverId}
```

### Endpoint admin de référence
```
GET /v1/admin/drivers/{driverId}
```

### Données présentes dans la réponse admin mais absentes (ou partielles) côté franchise

| Champ | Présent admin | Présent franchise | Notes |
|---|:---:|:---:|---|
| `profile` (firstName, lastName, phone, email, avatarUrl) | ✅ | ❓ | Profil complet de l'utilisateur |
| `vehicle` + `vehicles[]` (brand, color, model, plate, year, status) | ✅ | ❓ | Détail véhicule assigné |
| `partner` (tradeName, partnerType, status) | ✅ | ❓ | Partenaire du chauffeur |
| `city` (name, slug, countryId) | ✅ | ❓ | Ville d'opération |
| `wallet` (balances, recentMovements) | ✅ | ❌ | Solde et mouvements récents du portefeuille |
| `wallet.recentMovements[]` | ✅ | ❌ | Historique transactions |
| `performance` (ratingAvg, cancellationRate, totalCompletedOrders) | ✅ | ❓ | Stats de performance |
| `summary` (nom complet, vehicle inline) | ✅ | ❓ | Résumé enrichi |
| `preferences` (auto_accept, accepts_rides, accepts_delivery, etc.) | ✅ | ❌ | Préférences chauffeur |
| `kycDocuments[]` (avec file_url, status, document_type_label) | ✅ | ❌ | Documents KYC |
| `partnerName`, `zoneName`, `vehicleLabel` | ✅ | ❓ | Champs dénormalisés pratiques |
| `driver.metadata` (approvedAt, transferredAt, etc.) | ✅ | ❓ | Métadonnées internes |
| `driver.availability_status` | ✅ | ❓ | Statut de disponibilité |
| `driver.suspension_reason` | ✅ | ❓ | Raison de suspension |

### Structure de référence attendue (réponse admin)
```json
{
  "status": "ok",
  "driver": { /* champs driver complets */ },
  "profile": { "firstName": "...", "lastName": "...", "phone": "...", "email": "..." },
  "vehicle": { "id": "...", "label": "Peugeot 301 · 2789KB01", "brand": {}, "color": {} },
  "vehicles": [ /* liste véhicules */ ],
  "partner": { "id": "...", "tradeName": "...", "status": "active" },
  "city": { "id": "...", "name": "Abidjan", "slug": "abidjan" },
  "wallet": {
    "balance_fcfa": 3469,
    "withdrawable_balance_xof": 3469,
    "non_withdrawable_balance_xof": 0,
    "recentMovements": [ /* dernières transactions */ ]
  },
  "performance": { "ratingAvg": 5, "totalCompletedOrders": 2 },
  "kycDocuments": [ /* documents avec file_url */ ],
  "preferences": { /* préférences app chauffeur */ },
  "partnerName": "UPJUNOO FRET2",
  "zoneName": "Abidjan",
  "vehicleLabel": "Peugeot 301 · 2789KB01"
}
```

### Action demandée au backend
> L'endpoint `GET /v1/franchise/drivers/{driverId}` (ou `GET /v1/franchises/{id}/drivers/{driverId}`) doit retourner la **même structure enrichie** que l'endpoint admin, avec le champ `viewerRole: "franchise"`.

---

## 3. Actions manquantes — Routes non disponibles côté franchise

Le frontend utilise actuellement des routes de contournement ou des endpoints admin pour les actions suivantes. Il faut des routes dédiées sous le scope franchise.

### 3.1 Mise en ligne / Hors ligne d'un chauffeur

**Besoin :**
```
PATCH /v1/franchises/{franchiseId}/drivers/{driverId}/availability
Body: { "availability": "online" | "offline" }
```
ou
```
POST /v1/franchises/{franchiseId}/drivers/{driverId}/go-online
POST /v1/franchises/{franchiseId}/drivers/{driverId}/go-offline
```

**Actuellement :** Le frontend tente un `PATCH` sur `/v1/franchises/{franchiseId}/drivers/{driverId}` avec `{ availability_status, availability }` — à confirmer si cette route accepte ce champ.

---

### 3.2 Transfert d'un chauffeur vers un autre partenaire

**Besoin :**
```
POST /v1/franchises/{franchiseId}/drivers/{driverId}/transfer
Body: {
  "target_partner_id": "uuid",
  "reason"?: "string"
}
```

**Actuellement :** Le frontend utilise une route admin de transfert (`/v1/admin/drivers/{id}/transfer`) — non autorisée pour le rôle franchise.

---

### 3.3 Modification d'un chauffeur

**Besoin :**
```
PATCH /v1/franchises/{franchiseId}/drivers/{driverId}
Body: {
  "first_name"?: "string",
  "last_name"?: "string",
  "phone"?: "string",
  "email"?: "string",
  "ride_category_code"?: "string",
  "accepts_cash"?: boolean,
  "accepts_wallet"?: boolean
}
```

**Actuellement :** Le frontend appelle `PATCH /v1/franchises/{franchiseId}/drivers/{driverId}` — à confirmer si la route accepte ces champs et retourne le driver mis à jour.

---

### 3.4 Suspension / Réactivation d'un chauffeur

**Besoin :**
```
POST /v1/franchises/{franchiseId}/drivers/{driverId}/suspend
Body: { "reason"?: "string" }

POST /v1/franchises/{franchiseId}/drivers/{driverId}/activate
```

**Actuellement :** Le frontend appelle ces routes — à confirmer qu'elles existent et sont autorisées pour le rôle franchise.

---

### 3.5 Suppression d'un chauffeur

**Besoin :**
```
DELETE /v1/franchises/{franchiseId}/drivers/{driverId}
```

**Actuellement :** Le frontend appelle cette route — à confirmer l'autorisation pour le rôle franchise et la politique de suppression (soft delete ?).

---

## 4. Résumé des priorités

| # | Problème | Impact | Priorité |
|---|---|---|:---:|
| 1 | Liste incomplète (7 → 3) | Liste chauffeurs tronquée | 🔴 Haute |
| 2 | Détail chauffeur sans wallet ni KYC | Page détail dégradée | 🔴 Haute |
| 3 | Routes suspend / activate | Actions clés bloquées | 🔴 Haute |
| 4 | Route transfer franchise | Transfert non fonctionnel | 🟠 Moyenne |
| 5 | Route PATCH update | Modification partielle | 🟠 Moyenne |
| 6 | Route DELETE | Suppression non confirmée | 🟡 Basse |

---

## 5. Questions pour le backend

1. **Pourquoi `/v1/franchise/drivers` retourne-t-il moins de chauffeurs** que `/v1/admin/drivers?franchise_id=...` ? Y a-t-il un filtre de statut ou de scope implicite ?
2. **`GET /v1/franchise/drivers/{id}`** retourne-t-il la même structure que l'endpoint admin (avec `profile`, `wallet`, `vehicle`, `kycDocuments`) ?
3. **Les routes `POST .../suspend` et `POST .../activate`** existent-elles pour le scope franchise ? Sont-elles dans le Swagger ?
4. **La route `POST .../transfer`** existe-t-elle pour le scope franchise ou seulement admin ?
5. **Le `PATCH /v1/franchises/{id}/drivers/{driverId}`** accepte-t-il la mise à jour des champs profil (prénom, nom, téléphone) ?
