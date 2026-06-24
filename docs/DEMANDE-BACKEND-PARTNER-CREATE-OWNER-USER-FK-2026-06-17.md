# Erreur backend — `POST /v1/partners` · violation FK `partners_owner_user_id_fkey`

> **Date :** 2026-06-17  
> **Émetteur :** équipe front UpJunoo Pro (`Up_prov2`)  
> **Destinataire :** équipe backend  
> **Environnement :** local — proxy front `http://localhost:3000/upjunoo-api/v1/partners`  
> **Swagger :** [https://api.upjunoo-dev.tech/docs](https://api.upjunoo-dev.tech/docs)  
> **Référence contrat création partenaire :** `docs/CONTRAT-CREATION-COMPTE-PARTENAIRE-EMAIL-PASSWORD.md`

---

## 1. Résumé

La création d’un partenaire depuis le backoffice (**admin** ou **franchise**) échoue en **HTTP 500** avec le code `PARTNER_CREATE_FAILED`, alors que le body respecte le contrat documenté (`email`, `password`, `franchiseId`, `cityId`, etc.).

**Cause probable côté base :** insertion dans `partners` avec un `owner_user_id` qui **n’existe pas** (ou pas encore) dans la table référencée par la contrainte `partners_owner_user_id_fkey` — typiquement un problème d’**ordre des opérations** ou d’**échec silencieux** de la création du compte utilisateur propriétaire.

---

## 2. Requête observée

| Élément | Valeur |
|---------|--------|
| **Méthode** | `POST` |
| **URL (via proxy Next)** | `http://localhost:3000/upjunoo-api/v1/partners` |
| **URL API réelle** | `POST /v1/partners` |
| **Statut HTTP** | `500 Internal Server Error` |

### Body envoyé (extrait)

```json
{
  "franchiseId": "1bb2bff7-edcc-496d-a87a-4126c19be278",
  "legalName": "UPJUNOO FRET2",
  "tradeName": "UPJUNOO FRET2",
  "cityId": "d80a0f88-fea5-41e4-8fb8-4e82a8a2758c",
  "email": "upfret2@upjunoo.com",
  "password": "123456789",
  "contactEmail": "upfret2@upjunoo.com",
  "contactPhone": "+225501020304",
  "phone": "+225501020304",
  "address": "rue des jardin",
  "partnerType": "FREIGHT",
  "commissionRate": 3
}
```

### Réponse API

```json
{
  "status": "error",
  "generatedAt": "2026-06-17T13:22:00.169Z",
  "error": {
    "code": "PARTNER_CREATE_FAILED",
    "message": "insert or update on table \"partners\" violates foreign key constraint \"partners_owner_user_id_fkey\""
  }
}
```

---

## 3. Contexte front

### Écran concerné

- Admin : `/admin/network/partners/new` — `PartnerCreatePage.tsx`
- Franchise : `/franchise/partners/new` — `FranchisePartnerNewPage.tsx`

Les deux flux appellent **`POST /v1/partners`** (franchise ne passe plus par une route franchise fantôme).

### Mapping front → API

Fichier : `src/features/network/api/partners.service.ts`

| Champ UI | Champ API envoyé |
|----------|------------------|
| Nom / raison sociale | `legalName`, `tradeName` |
| Franchise | `franchiseId` |
| Ville (catalogue) | `cityId` |
| Email portail | `email`, `contactEmail` |
| Mot de passe portail | `password` |
| Téléphone | `contactPhone`, `phone` |
| Adresse | `address` |
| Type partenaire | `partnerType` (`FREIGHT`, `FLEET`, etc.) |
| Taux commission | `commissionRate` |

Le front **n’envoie pas** `owner_user_id` : ce champ est censé être **rempli par le backend** après création du compte `PARTNER_USER`.

---

## 4. Comportement attendu (contrat métier)

D’après `docs/CONTRAT-CREATION-COMPTE-PARTENAIRE-EMAIL-PASSWORD.md`, `POST /v1/partners` doit être **atomique** :

```
1. Créer l'utilisateur Auth (PARTNER_USER) — email + password
2. Créer l'entité partners avec owner_user_id = id du user créé
3. Créer le profil partenaire
4. Assigner le rôle PARTNER_ADMIN
```

En cas d'échec à une étape → **rollback complet** (pas de partenaire orphelin, pas de user sans partner).

**Réponse attendue :** `201` avec :

```json
{
  "status": "success",
  "partner": { "id": "…", "owner_user_id": "…", … },
  "account": {
    "userId": "…",
    "loginEmail": "upfret2@upjunoo.com"
  }
}
```

---

## 5. Analyse de l'erreur SQL

### Contrainte violée

```
partners_owner_user_id_fkey
```

Signification : la colonne `partners.owner_user_id` référence une clé primaire d'une autre table (souvent `users.id` ou `auth.users.id`), et la valeur insérée **n'existe pas** dans cette table au moment du `INSERT`.

### Scénarios probables côté backend

| # | Scénario | Symptôme |
|---|----------|----------|
| **A** | `INSERT partners` **avant** création effective du user | FK violation systématique |
| **B** | User créé dans **Auth** (Supabase) mais **pas** dans table `users` applicative | `owner_user_id` pointe vers un ID absent de `users` |
| **C** | Mauvais ID récupéré après création Auth (null, UUID vide, mauvaise variable) | FK violation |
| **D** | Transaction partielle : rollback user raté, insert partner avec ancien `owner_user_id` | Intermittent |
| **E** | Email déjà existant → échec user masqué par message générique FK | Devrait être `409` / `PARTNER_EMAIL_ALREADY_EXISTS` |

---

## 6. Ce que le front a déjà vérifié

| Point | Statut |
|-------|--------|
| `email` et `password` présents dans le body | OK |
| `cityId` = UUID catalogue valide | OK |
| `franchiseId` = UUID franchise valide | OK |
| `partnerType` = `FREIGHT` (valeur Swagger) | OK |
| Envoi de `owner_user_id` par le front | Non — pas attendu |
| Proxy `/upjunoo-api` altère le body | Non — body identique côté API |

**Conclusion front :** le payload est conforme au contrat documenté. L'erreur est **côté orchestration backend / base** lors du provisionnement du compte propriétaire.

---

## 7. Demandes au backend

### P0 — Corriger le flux de création

1. **Garantir l'ordre** : user applicatif (+ Auth si séparé) **créé et commité** avant `INSERT INTO partners`.
2. **Vérifier** que `owner_user_id` inséré = `users.id` (ou table référencée par la FK), pas seulement l'ID Auth si les tables divergent.
3. **Transaction atomique** : si `INSERT partners` échoue, supprimer / rollback le user créé.

### P1 — Erreurs explicites (ne pas masquer en 500 générique)

| Situation | Code HTTP | Code métier suggéré |
|-----------|-----------|---------------------|
| Email déjà utilisé | `409` | `PARTNER_EMAIL_ALREADY_EXISTS` |
| Franchise introuvable | `404` | `FRANCHISE_NOT_FOUND` |
| Ville introuvable | `404` | `CITY_NOT_FOUND` |
| Échec création user | `422` | `PARTNER_USER_PROVISION_FAILED` |
| Violation FK (bug interne) | `500` | `PARTNER_CREATE_FAILED` + log détaillé **sans** exposer SQL en prod |

### P2 — Documentation & tests

1. Documenter dans Swagger le flux `owner_user_id` et la réponse `account.userId`.
2. Test d'intégration : `POST /v1/partners` avec body identique à la section 2 → `201` + login `POST /v1/auth/partner/login` fonctionnel.
3. Test régression : types `FLEET`, `FREIGHT`, `RENTAL`, `MIXED`.

---

## 8. Reproduction

```bash
# Prérequis : token admin ou franchise valide
curl -X POST "https://api.upjunoo-dev.tech/v1/partners" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "franchiseId": "1bb2bff7-edcc-496d-a87a-4126c19be278",
    "legalName": "UPJUNOO FRET2",
    "tradeName": "UPJUNOO FRET2",
    "cityId": "d80a0f88-fea5-41e4-8fb8-4e82a8a2758c",
    "email": "upfret2@upjunoo.com",
    "password": "123456789",
    "contactEmail": "upfret2@upjunoo.com",
    "contactPhone": "+225501020304",
    "phone": "+225501020304",
    "address": "rue des jardin",
    "partnerType": "FREIGHT",
    "commissionRate": 3
  }'
```

**Résultat actuel :** `500` + `PARTNER_CREATE_FAILED` + message FK.

**Résultat attendu :** `201` + `partner.id` + `account.loginEmail`.

---

## 9. Impact produit

| Impact | Détail |
|--------|--------|
| **Bloquant** | Impossible de créer un nouveau partenaire depuis admin et franchise |
| **Workaround** | Aucun côté front — création manuelle en base ou script backend |
| **Fréquence** | Reproductible à chaque tentative avec compte email nouveau |

---

## 10. Fichiers front liés

| Fichier | Rôle |
|---------|------|
| `src/features/network/api/partners.service.ts` | Construction body `POST /v1/partners` |
| `src/features/network/api/adminPartners.api.types.ts` | Types `ApiPartnerCreateBody` |
| `src/features/network/pages/PartnerCreatePage.tsx` | Formulaire admin |
| `src/features/franchise/pages/FranchisePartnerNewPage.tsx` | Formulaire franchise |
| `src/core/api/links.ts` | `LINKS.v1.partners.create` → `/v1/partners` |
| `docs/CONTRAT-CREATION-COMPTE-PARTENAIRE-EMAIL-PASSWORD.md` | Contrat attendu |

---

## 11. Checklist validation (backend)

- [ ] `POST /v1/partners` retourne `201` avec le body de la section 2
- [ ] Ligne `partners` créée avec `owner_user_id` valide (FK OK)
- [ ] Ligne `users` (ou équivalent) existe pour cet `owner_user_id`
- [ ] `POST /v1/auth/partner/login` avec `email` + `password` → `200`
- [ ] En cas d'email dupliqué → `409` explicite, pas `500` FK
- [ ] Logs serveur : plus de `partners_owner_user_id_fkey` sur création nominale

---

## 12. Historique

| Date | Auteur | Action |
|------|--------|--------|
| 2026-06-17 | Front UpJunoo Pro | Signalement erreur `PARTNER_CREATE_FAILED` / FK `partners_owner_user_id_fkey` |
