# Bug backend — Actions KYC & Clients franchise → 404 `ROUTE_NOT_FOUND`

> **Date :** 2026-06-22  
> **Émetteur :** équipe front UpJunoo  
> **Destinataire :** équipe backend / API  
> **Priorité :** **P0** — blocage actions critiques KYC et clients franchise  
> **Swagger :** [https://api.upjunoo-dev.tech/docs](https://api.upjunoo-dev.tech/docs) — OpenAPI v **0.4.0**  
> **Contexte front :** `src/features/franchise/api/*`

---

## 1. Symptômes observés

### 1.1. KYC Documents (Chauffeurs)

| Page | Action | Méthode | URL | Status | Code erreur |
|------|--------|---------|-----|--------|-------------|
| `/franchise/drivers/8e7a80a1-6cc8-4940-9db0-daf57025643e` | Valider document | `POST` | `/upjunoo-api/v1/admin/kyc/documents/{id}/approve` | 404 | `ROUTE_NOT_FOUND` |
| `/franchise/drivers/8e7a80a1-6cc8-4940-9db0-daf57025643e` | Rejeter document | `POST` | `/upjunoo-api/v1/admin/kyc/documents/{id}/reject` | 404 | `ROUTE_NOT_FOUND` |

**Problème :** Le front utilise les routes admin (`/v1/admin/kyc/documents/*`) au lieu des routes franchise.

### 1.2. Clients

| Page | Action | Méthode | URL | Status | Code erreur |
|------|--------|---------|-----|--------|-------------|
| `/franchise/clients/16a470a0-b157-46be-8231-31207db52393` | Suspendre | `POST` | `/v1/franchise/clients/{id}/suspend` | 404 | `ROUTE_NOT_FOUND` |

**Réponse backend :**
```json
{
  "status": "error",
  "generatedAt": "2026-06-22T17:47:40.686Z",
  "message": "Ressource introuvable.",
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "Ressource introuvable."
  }
}
```

---

## 2. Analyse des patterns

### 2.1. Pattern KYC Documents

**Problème identifié :** Le front appelle les routes admin au lieu des routes franchise

| Action | Route actuelle (incorrecte) | Route attendue (franchise) |
|--------|-----------------------------|----------------------------|
| Valider | `POST /v1/admin/kyc/documents/{id}/approve` | `POST /v1/franchise/kyc/documents/{id}/approve` |
| Rejeter | `POST /v1/admin/kyc/documents/{id}/reject` | `POST /v1/franchise/kyc/documents/{id}/reject` |

### 2.2. Pattern Clients

**Problème identifié :** Route franchise non implémentée ou incorrecte

| Action | Route appelée | Status attendu |
|--------|---------------|----------------|
| Suspendre | `POST /v1/franchise/clients/{id}/suspend` | 200 (actuellement 404) |

---

## 3. Ce que dit le Swagger (v0.4.0)

### 3.1. KYC Documents

**Famille A — admin (tag `02 - Admin`) :**
```
POST /v1/admin/kyc/documents/{id}/approve
POST /v1/admin/kyc/documents/{id}/reject
```

**Famille B — franchise (tag `11 - Franchise`) :**
```
POST /v1/franchise/kyc/documents/{id}/approve
POST /v1/franchise/kyc/documents/{id}/reject
```

**Note :** Les deux familles existent mais le front utilise la famille A (admin) depuis le contexte franchise.

### 3.2. Clients

**Famille A — session franchise (tag `11 - Franchise`) :**
```
GET    /v1/franchise/customers
GET    /v1/franchise/customers/{id}
PATCH  /v1/franchise/customers/{id}
DELETE /v1/franchise/customers/{id}
POST   /v1/franchise/customers/{id}/suspend
POST   /v1/franchise/customers/{id}/activate
```

**Famille B — ID explicite (tag `99 - Autres modules`) :**
```
GET    /v1/franchises/{id}/customers
POST   /v1/franchises/{id}/customers
GET    /v1/franchises/{id}/customers/{customerId}
PATCH  /v1/franchises/{id}/customers/{customerId}
DELETE /v1/franchises/{id}/customers/{customerId}
```

**Signal d'alerte :** La route `POST /v1/franchise/customers/{id}/suspend` est documentée mais retourne 404.

---

## 4. Conclusion audit

| Verdict | Détail |
|---------|--------|
| **Problème principal KYC** | **Front** — utilisation routes admin au lieu franchise |
| **Problème principal Clients** | **Backend** — route franchise non implémentée |
| **Problème secondaire** | Incohérence entre documentation Swagger et implémentation réelle |

---

## 5. Actions demandées au backend

### P0 — Implémenter/corriger les routes KYC franchise

**Routes à vérifier/corriger :**
```bash
POST /v1/franchise/kyc/documents/{id}/approve
POST /v1/franchise/kyc/documents/{id}/reject
```

**Cas de test minimal :**
```bash
Given: utilisateur franchise connecté
And:   document KYC ID = 635780df-c153-4a5e-9968-6ebb31b17f52
When:  POST /v1/franchise/kyc/documents/635780df-c153-4a5e-9968-6ebb31b17f52/approve
Then:  HTTP 200, document approuvé
```

### P0 — Implémenter la route suspension clients

**Route à implémenter :**
```bash
POST /v1/franchise/customers/{id}/suspend
```

**Cas de test minimal :**
```bash
Given: utilisateur franchise connecté
And:   client ID = 16a470a0-b157-46be-8231-31207db52393
When:  POST /v1/franchise/customers/16a470a0-b157-46be-8231-31207db52393/suspend
Then:  HTTP 200, client suspendu
```

### P1 — Vérifier cohérence Swagger vs implémentation

Toutes les routes documentées dans le Swagger doivent être implémentées et fonctionnelles.

---

## 6. Correctif front (workaround)

### 6.1. KYC Documents

Fichiers concernés :
- `src/features/franchise/api/drivers.service.ts`
- `src/features/franchise/api/drivers.queries.ts`

**Action :** Utiliser les routes franchise au lieu des routes admin

```ts
// Au lieu de :
LINKS.admin.kyc.documentApprove(documentId)
LINKS.admin.kyc.documentReject(documentId)

// Utiliser :
LINKS.franchise.kyc.documentApprove(documentId)
LINKS.franchise.kyc.documentReject(documentId)
```

### 6.2. Clients

Si les routes franchise ne sont pas implémentées, basculer vers famille B :

```ts
// Au lieu de :
LINKS.franchise.customerByIdCtx(customerId) + '/suspend'

// Utiliser :
LINKS.franchise.v1.customerSuspend(customerId)
```

---

## 7. Plan de reproduction (backend / QA)

### 7.1. Test KYC Documents

```bash
# 1. Login franchise
TOKEN=$(curl -s -X POST https://api.upjunoo-dev.tech/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Client-Type: back-office" \
  -d '{"email":"dev.franchise.bf@upjunoo-dev.tech","password":"***"}' \
  | jq -r '.accessToken')

# 2. Tester route franchise KYC (BUG attendu)
curl -s -X POST \
  "https://api.upjunoo-dev.tech/v1/franchise/kyc/documents/635780df-c153-4a5e-9968-6ebb31b17f52/approve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Client-Type: back-office" | jq .

# 3. Tester route admin KYC (fonctionne mais mauvais contexte)
curl -s -X POST \
  "https://api.upjunoo-dev.tech/v1/admin/kyc/documents/635780df-c153-4a5e-9968-6ebb31b17f52/approve" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Client-Type: back-office" | jq .
```

### 7.2. Test Clients

```bash
# 1. Login franchise (même token)

# 2. Tester suspension client (BUG)
curl -s -X POST \
  "https://api.upjunoo-dev.tech/v1/franchise/customers/16a470a0-b157-46be-8231-31207db52393/suspend" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Client-Type: back-office" | jq .

# 3. Vérifier lecture client (fonctionne)
curl -s "https://api.upjunoo-dev.tech/v1/franchise/customers/16a470a0-b157-46be-8231-31207db52393" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Client-Type: back-office" | jq .
```

---

## 8. Impact utilisateur

| Entité | Actions impactées | Sévérité |
|--------|-------------------|----------|
| **KYC Chauffeurs** | Valider/Rejeter documents | **Critique** |
| **Clients** | Suspendre | **Critique** |
| **Lecture** | Consulter fiches | **OK** |

---

## 9. Documents liés

| Document | Lien |
|----------|------|
| Bug actions franchise (précédent) | `BACKEND-BUG-FRANCHISE-ACTIONS-404.md` |
| Bug chauffeurs (similaire) | `BACKEND-BUG-FRANCHISE-DRIVER-PATCH-404.md` |
| Services front | `src/features/franchise/api/*.service.ts` |
| Liens API | `src/core/api/links.ts` |

---

## 10. Historique

| Date | Version | Changement |
|------|---------|------------|
| 2026-06-22 | 1.0 | Audit 404 KYC documents & clients suspension — portail franchise |
