# Rapport d'Écarts API — Recette du 2026-06-19

**Portail :** Franchise  
**Franchise ID :** `1bb2bff7-edcc-496d-a87a-4126c19be278`  
**Token de test :** `dev.franchise@upjunoo-dev.tech`  
**Date :** 2026-06-19

---

## 🔴 COURSES

### 1. Détail d'une course de type FRET — 501 Not Implemented

**Endpoint utilisé :**
```
GET /v1/franchises/{id}/orders/{orderId}
```

**Symptôme :**  
Pour les courses de type **fret**, la page détail retourne une erreur `501 Not Implemented`.  
Les courses de type standard (ride) fonctionnent normalement.

**Impact :** La page détail est inaccessible pour toutes les courses fret.

**Action demandée au backend :**
> Implémenter `GET /v1/franchises/{id}/orders/{orderId}` pour le type `fret` (actuellement non géré).  
> Retourner la même structure que pour les rides, avec les champs spécifiques fret (`cargo_type`, `weight_kg`, etc.) si disponibles.

**Priorité :** 🔴 HAUTE

---

### 2. (Rappel) Timeline absente dans la réponse franchise

Déjà signalé dans `BACKEND_API_GAPS_TRIPS_FRANCHISE_V2.md`.  
Le champ `timeline` est absent de la réponse `GET /v1/franchises/{id}/orders/{orderId}`.

**Priorité :** 🔴 HAUTE

---

### 3. (Rappel) Liste incomplète — 14 courses au lieu de 21

Déjà signalé dans `BACKEND_API_GAPS_TRIPS_FRANCHISE_V2.md`.  
La franchise voit 14 courses, l'admin en voit 21 pour la même franchise.

**Priorité :** 🔴 HAUTE

---

## 🔴 CHAUFFEURS

### 1. Routes d'actions — DRIVER_NOT_FOUND

**Endpoints concernés :**
```
POST /v1/franchise/drivers/{id}/suspend
POST /v1/franchise/drivers/{id}/activate
PATCH /v1/franchise/drivers/{id}/availability
POST /v1/franchise/drivers/{id}/transfer
DELETE /v1/franchise/drivers/{id}
PATCH /v1/franchise/drivers/{id}
```

**Erreur retournée pour toutes ces routes :**
```json
{
  "status": "error",
  "generatedAt": "2026-06-19T12:44:20.224Z",
  "message": "Chauffeur introuvable",
  "error": {
    "code": "DRIVER_NOT_FOUND",
    "message": "Chauffeur introuvable"
  }
}
```

**Symptôme :**  
Le `driverId` utilisé est valide (visible en liste, page détail accessible), mais les routes d'actions retournent `DRIVER_NOT_FOUND`.  
Hypothèse : ces routes contextuelles (`/v1/franchise/drivers/{id}/...`) requièrent que le chauffeur soit directement lié à la franchise, pas via un partenaire intermédiaire.

**Action demandée au backend :**
> - Corriger le scope de résolution du `driverId` pour les routes contextuelle franchise  
> — **OU** —  
> - Migrer vers les routes explicites avec `franchiseId` :  
>   ```
>   POST /v1/franchises/{franchiseId}/drivers/{driverId}/suspend
>   POST /v1/franchises/{franchiseId}/drivers/{driverId}/activate
>   PATCH /v1/franchises/{franchiseId}/drivers/{driverId}/availability
>   POST /v1/franchises/{franchiseId}/drivers/{driverId}/transfer
>   DELETE /v1/franchises/{franchiseId}/drivers/{driverId}
>   PATCH /v1/franchises/{franchiseId}/drivers/{driverId}
>   ```

**Priorité :** 🔴 HAUTE — Toutes les actions chauffeur sont bloquées

---

### 2. Validation / Rejet de documents KYC chauffeur — Route manquante

**Besoin :**
```
POST /v1/franchises/{franchiseId}/drivers/{driverId}/kyc/{documentId}/approve
POST /v1/franchises/{franchiseId}/drivers/{driverId}/kyc/{documentId}/reject
Body reject: { "reason": "string" }
```

**Statut :** ❌ Route non documentée, non disponible côté franchise.

**Impact :** La franchise ne peut pas valider ou rejeter les documents KYC de ses chauffeurs depuis le portail.

**Action demandée au backend :**
> Créer les endpoints de validation/rejet de documents KYC pour le scope franchise.

**Priorité :** 🔴 HAUTE

---

### 3. (Rappel) Liste incomplète — 7 chauffeurs admin vs 3 franchise

Déjà signalé dans `BACKEND_API_GAPS_DRIVERS_FRANCHISE.md`.  
`GET /v1/franchise/drivers` retourne 3 chauffeurs. L'admin en voit 7 pour la même franchise.

**Priorité :** 🔴 HAUTE

---

## 🔴 PARTENAIRES

### 1. Création de partenaire — Route inexistante

**Endpoint attendu :**
```
POST /v1/franchises/{franchiseId}/partners
```

**Statut :** ❌ Route non implémentée côté franchise.

**Contournement actuel :** Le frontend utilise `POST /v1/partners` (route globale) avec `franchiseId` dans le body — comportement non garanti.

**Action demandée au backend :**
> Implémenter `POST /v1/franchises/{franchiseId}/partners` avec le payload :
```json
{
  "tradeName": "Nom commercial",
  "legalName": "Raison sociale",
  "email": "contact@partenaire.com",
  "password": "...",
  "contactPhone": "07 12 34 56 78",
  "cityId": "uuid",
  "address": "...",
  "commissionRate": 15
}
```

**Priorité :** 🔴 HAUTE

---

### 2. Règles de commission — Impossible de charger

**Endpoint admin utilisé :**
```
GET /v1/admin/commission-rules
```

**Symptôme :** Avec un token franchise, cet endpoint retourne `403 FORBIDDEN`.  
Le message affiché à l'utilisateur : *"Impossible de charger les règles de commission."*

**Action demandée au backend :**
> Exposer un endpoint franchise pour les règles de commission :
```
GET /v1/franchises/{franchiseId}/commission-rules
```
> Ou autoriser `GET /v1/admin/commission-rules` en lecture seule avec token franchise.

**Priorité :** 🟠 MOYENNE

---

### 3. Liste des chauffeurs d'un partenaire incomplète

**Endpoint :** `GET /v1/franchises/{id}/partners/{partnerId}/drivers`

**Symptôme :**  
La liste retourne les chauffeurs mais avec des données incomplètes :
- `fullName` retourne toujours `"Chauffeur"` générique (prénom/nom réels absents)
- `zoneName: null` — la zone n'est pas renseignée
- `account_status: "active"` (non standard — valeur attendue : `"approved"`)

**Action demandée au backend :**
> 1. Résoudre le vrai nom (`first_name` / `last_name`) depuis le profil `user_id`
> 2. Enrichir `zoneName` depuis la ville associée
> 3. Harmoniser `account_status` avec `"approved" | "pending" | "suspended" | "banned"`

**Priorité :** 🔴 HAUTE

---

### 4. Actions partenaire (suspend / activate) — Erreurs

**Endpoints :**
```
POST /v1/franchises/{id}/partners/{partnerId}/suspend
POST /v1/franchises/{id}/partners/{partnerId}/activate
```

**Symptôme :** Ces routes retournent des erreurs (statut exact à confirmer).  
Le frontend a les boutons en place mais les actions échouent.

**Action demandée au backend :**
> Confirmer et corriger `POST /v1/franchises/{id}/partners/{partnerId}/suspend` et `.../activate`.

**Priorité :** 🔴 HAUTE

---

## � VÉHICULES

### 1. Approuver / Rejeter un véhicule — Erreurs

**Endpoints :**
```
POST /v1/franchises/{franchiseId}/fleet/vehicles/{vehicleId}/approve
POST /v1/franchises/{franchiseId}/fleet/vehicles/{vehicleId}/reject
```
**Symptôme :** Ces actions retournent des erreurs (statut exact à préciser lors des tests).  
Le frontend appelle ces routes — les boutons sont en place mais les mutations échouent.

**Action demandée au backend :**
> Confirmer et corriger ces endpoints pour le scope franchise.

**Priorité :** 🔴 HAUTE

---

### 2. Supprimer un véhicule — Route à confirmer / en erreur

**Endpoint :**
```
DELETE /v1/franchises/{franchiseId}/fleet/vehicles/{vehicleId}
```
**Symptôme :** La suppression retourne une erreur. Le frontend appelle cette route depuis la page détail.

**Action demandée au backend :**
> Implémenter ou corriger `DELETE /v1/franchises/{franchiseId}/fleet/vehicles/{vehicleId}` pour le scope franchise.

**Priorité :** 🔴 HAUTE

---

### 3. Modifier un véhicule — Route manquante

**Endpoint attendu :**
```
PATCH /v1/franchises/{franchiseId}/fleet/vehicles/{vehicleId}
```
**Statut :** ❌ Route non disponible — structure frontend prête en attente.

**Priorité :** 🟠 MOYENNE

---

## � CLIENTS

### 1. Suspendre / Réactiver un client — Erreurs

**Endpoints :**
```
POST /v1/franchises/{franchiseId}/clients/{clientId}/suspend
POST /v1/franchises/{franchiseId}/clients/{clientId}/activate
```

**Symptôme :** Ces actions retournent des erreurs (statut exact à préciser lors des tests).  
Le frontend appelle actuellement les routes contextuelles :
```
POST /v1/franchise/clients/{clientId}/suspend
POST /v1/franchise/clients/{clientId}/activate
```
Ces routes échouent avec le token franchise.

**Action demandée au backend :**
> Implémenter ou corriger les routes suspend/activate pour les clients dans le scope franchise, sous la forme :
```
POST /v1/franchises/{franchiseId}/clients/{clientId}/suspend
POST /v1/franchises/{franchiseId}/clients/{clientId}/activate
```

**Priorité :** 🔴 HAUTE

---

## 📊 Tableau récapitulatif — Priorités

| # | Domaine | Problème | Priorité |
|---|---------|----------|:--------:|
| 1 | Courses | Détail fret → 501 Not Implemented | 🔴 HAUTE |
| 2 | Courses | Timeline absente dans réponse franchise | 🔴 HAUTE |
| 3 | Courses | Liste incomplète (14 vs 21) | 🔴 HAUTE |
| 4 | Chauffeurs | Routes d'actions → DRIVER_NOT_FOUND | 🔴 HAUTE |
| 5 | Chauffeurs | Validation/rejet KYC — route manquante | 🔴 HAUTE |
| 6 | Chauffeurs | Liste incomplète (3 vs 7) | 🔴 HAUTE |
| 7 | Partenaires | Création partenaire — route inexistante | 🔴 HAUTE |
| 8 | Partenaires | Liste chauffeurs partenaire incomplète | 🔴 HAUTE |
| 9 | Partenaires | suspend / activate → erreurs | 🔴 HAUTE |
| 10 | Partenaires | Règles commission — 403 avec token franchise | 🟠 MOYENNE |
| 11 | Véhicules | Approuver / Rejeter → erreurs | 🔴 HAUTE |
| 12 | Véhicules | Supprimer → erreur | 🔴 HAUTE |
| 13 | Véhicules | Modifier — route manquante | 🟠 MOYENNE |
| 14 | Clients | Suspendre / Réactiver → erreurs | � HAUTE |

---

*Rapport produit le 2026-06-19 — consolidation de tous les écarts observés en recette*
