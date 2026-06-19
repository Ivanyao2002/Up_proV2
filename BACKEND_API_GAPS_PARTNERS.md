# BACKEND_API_GAPS_PARTNERS.md
## Rapport d'Écarts API - Section Partenaires (Franchise)

**Date début :** 2026-06-18  
**Franchise ID :** `1bb2bff7-edcc-496d-a87a-4126c19be278`  
**Token :** dev.franchise@upjunoo-dev.tech

---

## 🎯 Endpoints Swagger déclarés

| Méthode | Route | Rôle |
|---------|-------|------|
| `GET` | `/v1/franchises/{id}/partners` | Liste des partenaires |
| `GET` | `/v1/franchises/{id}/partners/{partnerId}` | Détail d'un partenaire |
| `PATCH` | `/v1/franchises/{id}/partners/{partnerId}` | Modifier un partenaire |
| `DELETE` | `/v1/franchises/{id}/partners/{partnerId}` | Supprimer un partenaire |
| `GET` | `/v1/franchises/{id}/partners/{partnerId}/drivers` | Chauffeurs du partenaire |
| `GET` | `/v1/franchises/{id}/partners/{partnerId}/orders` | Courses du partenaire |
| `GET` | `/v1/franchises/{id}/partners/{partnerId}/commissions` | Commissions du partenaire |

---

## 🆕 Création de Partenaire — Route et Payload

**Formulaire :** `/franchise/partners/new`

**Route utilisée (mode actuel) :**
```
POST /v1/partners
```
> ⚠️ Route **globale**, pas franchise-spécifique. Le `franchiseId` est injecté dans le body.  
> En mode legacy : `POST /v1/franchises/{franchiseId}/partners`

**Body envoyé (camelCase) :**
```json
{
  "franchiseId": "1bb2bff7-edcc-496d-a87a-4126c19be278",
  "legalName": "Dénomination légale",
  "tradeName": "Nom commercial",
  "cityId": "d80a0f88-fea5-41e4-8fb8-4e82a8a2758c",
  "email": "contact@partenaire.com",
  "contactEmail": "contact@partenaire.com",
  "password": "••••••",
  "contactPhone": "07 12 34 56 78",
  "phone": "07 12 34 56 78",
  "address": "Rue, quartier…",
  "commissionRate": 15
}
```

**Champs du formulaire → Body API :**

| Champ formulaire | Champ API | Obligatoire |
|---|---|---|
| Nom commercial (`name`) | `tradeName` | ✅ |
| Raison sociale (`legal_name`) | `legalName` | ✅ (fallback sur `name`) |
| Email de connexion | `email` + `contactEmail` | ✅ |
| Mot de passe | `password` | ✅ |
| Téléphone | `contactPhone` + `phone` | ✅ |
| Ville | `cityId` (résolu via catalogue) | ✅ |
| Adresse | `address` | ❌ optionnel |
| Taux de commission (%) | `commissionRate` | ❌ optionnel |

**⚠️ Champs formulaire NON envoyés à l'API :**
- **CNI Recto / Verso** — uploadés localement, aucun endpoint de dépôt de document partenaire implémenté
- **RCC (Registre de Commerce)** — idem

**Fix attendu backend :** Endpoint de dépôt de documents partenaire :  
`POST /v1/franchises/{id}/partners/{partnerId}/documents`  
Ou accepter les fichiers directement dans le body de création (multipart).

**Réponse attendue :**
```json
{
  "status": "ok",
  "partner": { "id": "...", ... },
  "account": { "loginEmail": "contact@partenaire.com" }
}
```

---

## ✅ Ce qui FONCTIONNE

| Route | Statut | Notes |
|-------|--------|-------|
| `GET /v1/franchises/{id}/partners` | ✅ | Liste retournée |
| `GET /v1/franchises/{id}/partners/{partnerId}` | ✅ | Détail retourné avec `stats` |
| `GET /v1/franchises/{id}/partners/{partnerId}/drivers` | ✅ | Items retournés (3 chauffeurs) |
| `PATCH /v1/franchises/{id}/partners/{partnerId}` | ✅ | Modification fonctionne |
| `DELETE /v1/franchises/{id}/partners/{partnerId}` | ✅ | Suppression fonctionne |

---

## ❌ Bugs Confirmés

### Bug 1 — `fullName: "Chauffeur"` générique sur `/partners/{id}/drivers`

**Endpoint :** `GET /v1/franchises/{id}/partners/{partnerId}/drivers`

**Symptôme :**  
Le champ `fullName` retourne toujours `"Chauffeur"` pour tous les drivers, quel que soit le chauffeur réel.

**Réponse observée :**
```json
{
  "id": "4917585a-2ece-4c6b-9ac9-75d266c26219",
  "fullName": "Chauffeur",
  "first_name": null,
  "last_name": null,
  "user_id": "e4401a46-4dcc-496d-99ae-89e4d85e66ff"
}
```

**Impact :** Le nom du chauffeur ne peut pas être affiché dans la liste.

**Fix temporaire frontend :** Fallback sur `driver_code` puis `id.slice(0,8)` quand `fullName === "Chauffeur"`.

**Fix attendu backend :** Retourner le vrai nom du chauffeur dans `fullName` (depuis le profil `user_id`) ou exposer `first_name` / `last_name`.

---

### Bug 2 — Zone non retournée sur `/partners/{id}/drivers`

**Endpoint :** `GET /v1/franchises/{id}/partners/{partnerId}/drivers`

**Symptôme :**  
Aucun des champs `zoneName`, `metadata.zoneLabel`, `metadata.zone`, `city_id` (résolu) ne permet d'afficher une zone lisible. La colonne **Zone** affiche `—` pour tous les chauffeurs.

**Fix attendu backend :** Retourner `zoneName` (label lisible) dans la réponse des chauffeurs d'un partenaire.

---

### Bug 3 — `account_status: "active"` non standard

**Endpoint :** `GET /v1/franchises/{id}/partners/{partnerId}/drivers`

**Symptôme :**  
Le champ `account_status` retourne `"active"` alors que la valeur standard de la plateforme est `"approved"`.

**Réponse observée :** `account_status: "active"`, `approval_status: "approved"`

**Fix temporaire frontend :** `"active"` est mappé vers `"approved"` dans le mapper.

**Fix attendu backend :** Harmoniser `account_status` avec les valeurs `"approved" | "pending" | "suspended" | "banned"` utilisées partout ailleurs.

---

## ❌ Bug Confirmé — Règles de commission inaccessibles avec token franchise

**Endpoint :** `GET /v1/admin/commission-rules`

**Symptôme :**  
Le composant `PartnerCommissionRulesPanel` (identique à l'admin) appelle `GET /v1/admin/commission-rules` pour charger les règles de commission. Avec un token franchise, cet endpoint retourne probablement `403 FORBIDDEN` ou `401`.

**Impact :** La tab **Commissions** du partenaire franchise affiche "Aucune règle franchise" au lieu des règles configurées.

**Fix temporaire frontend :** Affichage dégradé — les KPI stats et le tableau d'historique des commissions restent visibles.

**Fix attendu backend :** Exposer un endpoint franchise pour les règles de commission :  
`GET /v1/franchises/{franchiseId}/commission-rules`  
Ou autoriser `GET /v1/admin/commission-rules` avec un token franchise (lecture seule).

---

## ❌ Bug Confirmé — Suspendre / Réactiver partenaire non connecté

**Boutons concernés :** "Suspendre" et "Réactiver" sur la page détail partenaire franchise.

**Symptôme :**  
Les boutons ouvrent une modale de confirmation mais `onConfirm` ne fait que fermer la modale — aucun appel API n'est effectué. Le statut du partenaire ne change pas.

**Cause :**  
- Pas de méthode `suspend` / `activate` dans `franchisePartnersService`  
- Pas de hook `useSuspendFranchisePartner` / `useActivateFranchisePartner` dans `partners.queries.ts`  
- Les endpoints backend ne sont pas encore confirmés

**Endpoints Swagger déclarés (non testés) :**
```
POST /v1/franchises/{id}/partners/{partnerId}/suspend
POST /v1/franchises/{id}/partners/{partnerId}/activate
```

**Fix frontend à faire** (après confirmation backend) :
1. Ajouter `suspend(id)` et `activate(id)` dans `franchisePartnersService`
2. Ajouter `useSuspendFranchisePartner` et `useActivateFranchisePartner` dans `partners.queries.ts`
3. Connecter les mutations dans `FranchisePartnerDetailPage`

---

## ⚠️ À Tester

| Action | Route | Statut |
|--------|-------|--------|
| Suspendre un partenaire | `POST /v1/franchises/{id}/partners/{partnerId}/suspend` | ❓ Endpoint non testé |
| Réactiver un partenaire | `POST /v1/franchises/{id}/partners/{partnerId}/activate` | ❓ Endpoint non testé |
| Courses du partenaire | `GET /v1/franchises/{id}/partners/{partnerId}/orders` | ❓ À tester |
| Commissions du partenaire | `GET /v1/franchises/{id}/partners/{partnerId}/commissions` | ❓ À tester |
| Règles de commission | `GET /v1/admin/commission-rules` avec token franchise | ❓ 403 attendu |
| Stats partenaire (`trips_count`, `revenue`) | champs dans `GET .../partners/{id}` | ❓ Valeurs à 0 ? |

---

## 📊 Structure observée — `/partners/{partnerId}/drivers` item

```json
{
  "id": "4917585a-2ece-4c6b-9ac9-75d266c26219",
  "user_id": "e4401a46-4dcc-496d-99ae-89e4d85e66ff",
  "partner_id": "71a1aad7-ad23-41ca-a6d0-b904d5953271",
  "franchise_id": "1bb2bff7-edcc-496d-a87a-4126c19be278",
  "city_id": "d80a0f88-fea5-41e4-8fb8-4e82a8a2758c",
  "fullName": "Chauffeur",              ← toujours générique ❌
  "account_status": "active",           ← non standard ⚠️
  "approval_status": "approved",
  "availability_status": "offline",
  "kyc_status": "approved",
  "onboarding_status": "started",
  "ride_category_code": "ECO",
  "total_completed_orders": 0,
  "rating_avg": null,
  "driver_code": null,
  "zoneName": null,                     ← zone manquante ❌
  "metadata": {
    "adoptedBy": "partner.portal",
    "transferredAt": "2026-06-16T16:54:56.338Z"
  }
}
```

---

## 🎯 Recommandations Backend — Priorité HAUTE

1. **`fullName`** — Retourner le vrai prénom/nom du chauffeur (résolution via `user_id`)
2. **`zoneName`** — Exposer le label de zone lisible dans la liste des chauffeurs d'un partenaire
3. **`account_status`** — Harmoniser les valeurs avec `"approved" | "pending" | "suspended" | "banned"`

## 🎯 Recommandations Backend — Priorité MOYENNE

4. Confirmer si `/suspend` et `/activate` existent pour les partenaires
5. Confirmer que `trips_count` dans `GET .../partners/{id}` reflète bien les courses terminées

---

## Questions pour le Backend

- [ ] Pourquoi `fullName: "Chauffeur"` générique ? Le nom n'est-il pas stocké dans le profil chauffeur ?
- [ ] `zoneName` est-il disponible dans une autre relation à joindre ?
- [ ] Les valeurs `account_status` seront-elles normalisées vers `approved/pending/suspended/banned` ?
- [ ] Existe-t-il un endpoint `/partners/{id}/suspend` et `/partners/{id}/activate` ?
- [ ] `trips_count` dans le détail partenaire — compte-t-il les courses terminées ou toutes ?

---

*Rapport mis à jour au fil des tests*
