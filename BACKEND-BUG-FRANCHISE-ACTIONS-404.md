# Bug backend — Actions franchise (Partners/Vehicles/Clients) → 404 `ROUTE_NOT_FOUND`

> **Date :** 2026-06-22  
> **Émetteur :** équipe front UpJunoo  
> **Destinataire :** équipe backend / API  
> **Priorité :** **P0** — blocage actions critiques portail franchise  
> **Swagger :** [https://api.upjunoo-dev.tech/docs](https://api.upjunoo-dev.tech/docs) — OpenAPI v **0.4.0**  
> **Contexte front :** `src/features/franchise/api/*`

---

## 1. Symptômes observés

Plusieurs actions CRUD échouent avec 404 `ROUTE_NOT_FOUND` sur les entités franchise :

### 1.1. Partenaires

| Page | Action | Méthode | URL | Status | Code erreur |
|------|--------|---------|-----|--------|-------------|
| `/franchise/partners/29f5e319-ee35-4836-b5b3-d75bd58ecf3e` | Suspendre | `POST` | `/v1/franchises/{franchiseId}/partners/{id}/suspend` | 404 | `ROUTE_NOT_FOUND` |
| `/franchise/partners/29f5e319-ee35-4836-b5b3-d75bd58ecf3e` | Modifier | `PATCH` | `/v1/franchises/{franchiseId}/partners/{id}` | 404 | `ROUTE_NOT_FOUND` |
| `/franchise/partners/29f5e319-ee35-4836-b5b3-d75bd58ecf3e` | Supprimer | `DELETE` | `/v1/franchises/{franchiseId}/partners/{id}` | 404 | `ROUTE_NOT_FOUND` |

**Réponse backend :**
```json
{
  "status": "error",
  "generatedAt": "2026-06-22T16:30:00.034Z",
  "message": "Ressource introuvable.",
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "Ressource introuvable."
  }
}
```

### 1.2. Véhicules

| Page | Action | Méthode | URL | Status | Code erreur |
|------|--------|---------|-----|--------|-------------|
| `/franchise/fleet/vehicles/2c8784d8-ff38-4629-82b2-4096c030d4f1` | Approuver | `POST` | `/v1/franchises/{franchiseId}/vehicles/{id}/approve` | 404 | `VEHICLE_FETCH_FAILED` |
| `/franchise/fleet/vehicles/2c8784d8-ff38-4629-82b2-4096c030d4f1` | Rejeter | `POST` | `/v1/franchises/{franchiseId}/vehicles/{id}/reject` | 404 | `VEHICLE_FETCH_FAILED` |
| `/franchise/fleet/vehicles/2c8784d8-ff38-4629-82b2-4096c030d4f1` | Supprimer | `DELETE` | `/v1/franchises/{franchiseId}/vehicles/{id}` | 404 | `VEHICLE_FETCH_FAILED` |

**Réponse backend :**
```json
{
  "status": "error",
  "generatedAt": "2026-06-22T16:32:49.376Z",
  "message": "Échec de la récupération — véhicule",
  "error": {
    "code": "VEHICLE_FETCH_FAILED",
    "message": "Échec de la récupération — véhicule"
  }
}
```

### 1.3. Clients

| Page | Action | Méthode | URL | Status | Code erreur |
|------|--------|---------|-----|--------|-------------|
| `/franchise/clients/16a470a0-b157-46be-8231-31207db52393` | Suspendre | `POST` | `/v1/franchises/{franchiseId}/customers/{id}/suspend` | 404 | `ROUTE_NOT_FOUND` |

**Réponse backend :**
```json
{
  "status": "error",
  "generatedAt": "2026-06-22T16:34:20.022Z",
  "message": "Ressource introuvable.",
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "Ressource introuvable."
  }
}
```

---

## 2. Analyse des patterns

### 2.1. Pattern commun

Toutes les erreurs suivent le même schéma :
- **Lecture** : `GET` fonctionne (les pages s'affichent correctement)
- **Écriture** : `POST/PATCH/DELETE` échouent en 404
- **Routes** : Utilisent `/v1/franchises/{franchiseId}/...` avec ID explicite

### 2.2. Routes front actuellement utilisées

Fichiers concernés :
- `src/features/franchise/api/partners.service.ts`
- `src/features/franchise/api/franchiseVehicles.service.ts` 
- `src/features/franchise/api/clients.service.ts`

| Entité | Lecture (fonctionne) | Écriture (échoue) |
|--------|---------------------|-------------------|
| **Partners** | `GET /v1/franchise/partners` | `POST/PATCH/DELETE /v1/franchises/{id}/partners/{id}` |
| **Vehicles** | `GET /v1/franchise/fleet/vehicles` | `POST/PATCH/DELETE /v1/franchises/{id}/vehicles/{id}` |
| **Clients** | `GET /v1/franchise/customers` | `POST/PATCH/DELETE /v1/franchises/{id}/customers/{id}` |

---

## 3. Ce que dit le Swagger (v0.4.0)

### 3.1. Partenaires

**Famille A — session franchise (tag `11 - Franchise`) :**
```
GET    /v1/franchise/partners
GET    /v1/franchise/partners/{id}
PATCH  /v1/franchise/partners/{id}
DELETE /v1/franchise/partners/{id}
POST   /v1/franchise/partners/{id}/suspend
POST   /v1/franchise/partners/{id}/activate
```

**Famille B — ID explicite (tag `99 - Autres modules`) :**
```
GET    /v1/franchises/{id}/partners
POST   /v1/franchises/{id}/partners
GET    /v1/franchises/{id}/partners/{partnerId}
PATCH  /v1/franchises/{id}/partners/{partnerId}
DELETE /v1/franchises/{id}/partners/{partnerId}
```

### 3.2. Véhicules

**Famille A — session franchise :**
```
GET    /v1/franchise/fleet/vehicles
GET    /v1/franchise/fleet/vehicles/{id}
POST   /v1/franchise/fleet/vehicles/{id}/approve
POST   /v1/franchise/fleet/vehicles/{id}/reject
DELETE /v1/franchise/fleet/vehicles/{id}
```

**Famille B — ID explicite :**
```
GET    /v1/franchises/{id}/vehicles
POST   /v1/franchises/{id}/vehicles
GET    /v1/franchises/{id}/vehicles/{vehicleId}
PATCH  /v1/franchises/{id}/vehicles/{vehicleId}
DELETE /v1/franchises/{id}/vehicles/{vehicleId}
```

### 3.3. Clients

**Famille A — session franchise :**
```
GET    /v1/franchise/customers
GET    /v1/franchise/customers/{id}
PATCH  /v1/franchise/customers/{id}
DELETE /v1/franchise/customers/{id}
POST   /v1/franchise/customers/{id}/suspend
POST   /v1/franchise/customers/{id}/activate
```

**Famille B — ID explicite :**
```
GET    /v1/franchises/{id}/customers
POST   /v1/franchises/{id}/customers
GET    /v1/franchises/{id}/customers/{customerId}
PATCH  /v1/franchises/{id}/customers/{customerId}
DELETE /v1/franchises/{id}/customers/{customerId}
```

---

## 4. Conclusion audit

| Verdict | Détail |
|---------|--------|
| **Problème principal** | **Backend** — incohérence entre routes lecture (famille A) et écriture (famille B) |
| **Problème secondaire** | **Front** — utilisation incohérente des familles de routes |

Le front utilise :
- **Lecture** : famille A (session) → fonctionne
- **Écriture** : famille B (ID explicite) → échoue

**Causes probables :**
1. **Routes famille B non implémentées** ou implémentées incorrectement
2. **Double implémentation** avec logiques de recherche différentes
3. **Permissions/rôles** différents entre familles A et B
4. **Tags Swagger** différents → implémentations séparées

---

## 5. Actions demandées au backend

### P0 — Implémenter/corriger les routes famille B

#### 5.1. Partenaires
```bash
POST   /v1/franchises/{id}/partners/{partnerId}/suspend
POST   /v1/franchises/{id}/partners/{partnerId}/activate  
PATCH  /v1/franchises/{id}/partners/{partnerId}
DELETE /v1/franchises/{id}/partners/{partnerId}
```

#### 5.2. Véhicules  
```bash
POST   /v1/franchises/{id}/vehicles/{vehicleId}/approve
POST   /v1/franchises/{id}/vehicles/{vehicleId}/reject
DELETE /v1/franchises/{id}/vehicles/{vehicleId}
```

#### 5.3. Clients
```bash
POST   /v1/franchises/{id}/customers/{customerId}/suspend
POST   /v1/franchises/{id}/customers/{customerId}/activate
PATCH  /v1/franchises/{id}/customers/{customerId}
DELETE /v1/franchises/{id}/customers/{customerId}
```

### P0 — Cas de test minimal (Partenaires)
```bash
Given: utilisateur franchise connecté, franchise_id = 1bb2bff7-edcc-496d-a87a-4126c19be278
And:   GET /v1/franchise/partners contient partner_id = 29f5e319-ee35-4836-b5b3-d75bd58ecf3e
When:  POST /v1/franchises/1bb2bff7-edcc-496d-a87a-4126c19be278/partners/29f5e319-ee35-4836-b5b3-d75bd58ecf3e/suspend
Then:  HTTP 200, partenaire suspendu
```

### P1 — Documenter schémas Swagger

Ajouter les réponses 200/400/403/404 pour toutes les routes famille B.

### P1 — Harmoniser logiques métier

Les familles A et B doivent partager la même source de vérité et les mêmes permissions.

---

## 6. Plan de reproduction (backend / QA)

```bash
# 1. Login franchise
TOKEN=$(curl -s -X POST https://api.upjunoo-dev.tech/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Client-Type: back-office" \
  -d '{"email":"dev.franchise.bf@upjunoo-dev.tech","password":"***"}' \
  | jq -r '.accessToken')

# 2. Résoudre franchise_id
FRANCHISE_ID=$(curl -s https://api.upjunoo-dev.tech/v1/franchises/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Client-Type: back-office" | jq -r '.id')

# 3. Vérifier lecture (fonctionne)
curl -s "https://api.upjunoo-dev.tech/v1/franchise/partners?limit=200" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Client-Type: back-office" | jq '.items[] | select(.id=="29f5e319-ee35-4836-b5b3-d75bd58ecf3e")'

# 4. Tester écriture famille B (BUG)
curl -s -X POST \
  "https://api.upjunoo-dev.tech/v1/franchises/$FRANCHISE_ID/partners/29f5e319-ee35-4836-b5b3-d75bd58ecf3e/suspend" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Client-Type: back-office" | jq .

# 5. Tester écriture famille A (alternative)
curl -s -X POST \
  "https://api.upjunoo-dev.tech/v1/franchise/partners/29f5e319-ee35-4836-b5b3-d75bd58ecf3e/suspend" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Client-Type: back-office" | jq .
```

---

## 7. Correctif front (workaround)

En attendant le backend, basculer les écritures vers famille A :

| Fichier | Action |
|---------|--------|
| `partners.service.ts` | Utiliser `/v1/franchise/partners/{id}/*` au lieu de `/v1/franchises/{franchiseId}/partners/{id}/*` |
| `franchiseVehicles.service.ts` | Utiliser `/v1/franchise/fleet/vehicles/{id}/*` au lieu de `/v1/franchises/{franchiseId}/vehicles/{id}/*` |
| `clients.service.ts` | Utiliser `/v1/franchise/customers/{id}/*` au lieu de `/v1/franchises/{franchiseId}/customers/{id}/*` |

Routes déjà définies dans `links.ts` :
```ts
// Franchise session routes
partnerByIdCtx: (id: string) => `/v1/franchise/partners/${id}`,
vehicleByIdCtx: (id: string) => `/v1/franchise/fleet/vehicles/${id}`,
customerByIdCtx: (id: string) => `/v1/franchise/customers/${id}`,
```

---

## 8. Impact utilisateur

| Entité | Actions impactées | Sévérité |
|--------|-------------------|----------|
| **Partenaires** | Suspendre, modifier, supprimer | **Critique** |
| **Véhicules** | Approuver, rejeter, supprimer | **Critique** |
| **Clients** | Suspendre | **Moyen** |
| **Lecture** | Consulter fiches | **OK** |

---

## 9. Documents liés

| Document | Lien |
|----------|------|
| Bug chauffeurs (similaire) | `BACKEND-BUG-FRANCHISE-DRIVER-PATCH-404.md` |
| Services front | `src/features/franchise/api/*.service.ts` |
| Liens API | `src/core/api/links.ts` |

---

## 10. Historique

| Date | Version | Changement |
|------|---------|------------|
| 2026-06-22 | 1.0 | Audit 404 actions franchise (partners/vehicles/clients) |
