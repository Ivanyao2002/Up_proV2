# Partenaire : personne physique / personne morale

> Statut : **DÉPLOYÉ LIVE server1** le 2026-06-22 (migration 113 appliquée + code rebuild api/worker). Validé E2E.
> Public : back-office **Admin** + portail **Franchise** (+ rappel portail Partenaire).

---

## 1. En résumé

Un partenaire peut désormais être déclaré comme **personne physique** ou **personne morale**.
Ce choix est porté par un nouveau champ **`legal_form`** sur la table `partners` :

| Valeur `legal_form` | Signification        | Documents exigés |
|---------------------|----------------------|------------------|
| `INDIVIDUAL`        | Personne **physique** | Aucun document obligatoire |
| `COMPANY`           | Personne **morale**   | 4 documents obligatoires (voir §3) |

- **Valeur par défaut** : `INDIVIDUAL` (si le champ n'est pas envoyé).
- **Les partenaires existants** ont tous été mis en `INDIVIDUAL` — aucun document ne leur est réclamé rétroactivement. Il faut les repasser en `COMPANY` à la main (PATCH) pour activer l'exigence documentaire.
- ⚠️ **Ne pas confondre** avec `partner_type` (`FLEET` / `FREIGHT` / `RENTAL`), qui décrit l'**activité** du partenaire, pas sa **forme juridique**. Les deux champs sont indépendants.

Le mécanisme est **informatif (non bloquant)** : un partenaire morale incomplet n'est **pas** empêché d'être créé ou activé. L'état du dossier est exposé via `documentsSummary` pour que le back-office le réclame côté UI.

---

## 2. Le champ `legal_form`

- Colonne : `partners.legal_form` `varchar(20) NOT NULL DEFAULT 'INDIVIDUAL'`, contrainte `CHECK (legal_form IN ('INDIVIDUAL','COMPANY'))`.
- Accepté en entrée sous deux graphies : **`legal_form`** ou **`legalForm`** (camelCase), insensible à la casse côté valeur (`company` → `COMPANY`).
- Une valeur hors liste renvoie une erreur explicite : `400 PARTNER_LEGAL_FORM_INVALID`.

---

## 3. Documents exigés pour une personne morale

Quand `legal_form = COMPANY`, le dossier réclame **4 documents** (table `ref_document_types`, sujet `PARTNER`) :

| `document_type_code`     | Libellé                                  | Recto/Verso |
|--------------------------|------------------------------------------|-------------|
| `BUSINESS_REGISTRATION`  | Registre de commerce (RCCM)              | —           |
| `COMPANY_STATUTES`       | Statuts de la société                    | —           |
| `TAX_REGISTRATION_DFE`   | Déclaration Fiscale d'Existence (DFE)    | —           |
| `MANAGER_ID_CARD`        | Pièce d'identité du gérant               | FRONT, BACK |

Pour une personne physique (`INDIVIDUAL`), **aucun** de ces documents n'est requis.

> ⚠️ **Le front ne doit pas coder ces 4 codes en dur** : la liste dépend de `legal_form` et peut évoluer. Lire dynamiquement :
> - `GET /v1/partners/:id/documents` → renvoie `legalForm`, `requiredDocumentTypes[]` (code + libellé) et `documentsSummary` ;
> - ou `GET /v1/admin/partners/:id` → `partner.documentsSummary.missingTypes` (codes encore manquants).

> Les documents sont stockés dans `kyc_documents` (sujet `PARTNER`) et passent par le même moteur de conformité que les chauffeurs/véhicules. L'état est résumé dans l'objet `documentsSummary` (voir §6).

---

## 4. Côté ADMIN (back-office)

### 4.1 Créer un partenaire

`POST /v1/admin/partners` — rôle **admin**.

```jsonc
// Corps
{
  "legal_name": "Transports Soleil SARL",
  "trade_name": "Soleil",
  "partner_type": "FLEET",        // FLEET | FREIGHT | RENTAL (obligatoire)
  "legal_form": "COMPANY",        // INDIVIDUAL | COMPANY (défaut INDIVIDUAL)
  "email": "contact@soleil.ci",   // obligatoire (compte de connexion)
  "password": "MotDePasse123",    // obligatoire (min 6)
  "city_id": "…",                  // optionnel
  "franchise_id": "…"              // optionnel
}
```

```jsonc
// Réponse 201 (champs utiles)
{
  "partnerId": "…",
  "userId": "…",
  "portalLoginEmail": "contact@soleil.ci",
  "partner": { "id": "…", "legal_form": "COMPANY", "partner_type": "FLEET", … }
}
```

### 4.2 Modifier la forme juridique d'un partenaire existant

`PATCH /v1/admin/partners/:id` — rôle **admin**.

```jsonc
{ "legal_form": "COMPANY" }   // ou "INDIVIDUAL"
```

> C'est l'opération à utiliser pour requalifier les partenaires existants (tous initialisés en `INDIVIDUAL`).

### 4.3 Lister les partenaires (avec filtre)

`GET /v1/admin/partners` — rôle **admin**.

- Chaque item contient **`legal_form`** et **`documentsSummary`** (calculé selon la forme).
- Nouveau filtre : **`?legalForm=COMPANY`** (ou `INDIVIDUAL`) — alias `?legal_form=`.
- Filtres combinables avec les existants : `status`, `partnerType`, `franchiseId`, `cityId`, `countryId`, `search`.

### 4.4 Détail d'un partenaire

`GET /v1/admin/partners/:id` — rôle **admin**.

La réponse contient `partner.legal_form` et `partner.documentsSummary` :

```jsonc
{
  "partner": {
    "legal_form": "COMPANY",
    "documentsSummary": {
      "requiredCount": 4,
      "uploadedCount": 0,
      "approvedCount": 0,
      "pendingCount": 0,
      "rejectedCount": 0,
      "missingCount": 4,
      "missingTypes": ["BUSINESS_REGISTRATION","COMPANY_STATUTES","TAX_REGISTRATION_DFE","MANAGER_ID_CARD"],
      "isComplete": false,
      "hasAnyDocument": false
    }
  }
}
```

> Pour une personne physique, `requiredCount = 0` et `isComplete = true` (rien à fournir).

### 4.5 Déposer les documents d'une personne morale

Flux en 2 temps (identique au KYC chauffeur) :

1. **Obtenir une URL d'upload** : `POST /v1/uploads/signed-url`
   ```jsonc
   { "purpose": "kyc", "filename": "rccm.pdf", "documentTypeCode": "BUSINESS_REGISTRATION" }
   ```
   → renvoie un `id` (= `uploadId`) + une URL signée pour téléverser le fichier.

2. **Enregistrer le document sur le partenaire** : `POST /v1/admin/partners/:id/documents`
   ```jsonc
   { "uploadId": "…", "document_type_code": "BUSINESS_REGISTRATION" }
   ```
   (alternative à `uploadId` : `fileUrls` / `storageRef`.)

Répéter pour chacun des 4 codes (`BUSINESS_REGISTRATION`, `COMPANY_STATUTES`, `TAX_REGISTRATION_DFE`, `MANAGER_ID_CARD`).
Le `documentsSummary` se met à jour automatiquement (`missingTypes` se vide, `isComplete` passe à `true` une fois les 4 docs **approuvés**).

---

## 5. Côté FRANCHISE (portail franchise)

La franchise a une visibilité **scopée à son périmètre**.

### 5.1 Lister ses partenaires

`GET /v1/franchises/:id/partners` — rôle **franchise**.

- Chaque item contient **`legal_form`** et **`documentsSummary`** (même contenu qu'en §4.3).
- Filtre **`?legalForm=COMPANY`** disponible.
- C'est la vue où la franchise repère les personnes morales au dossier incomplet (`documentsSummary.isComplete = false`).

### 5.2 Détail d'un partenaire

`GET /v1/franchises/:id/partners/:partnerId` — rôle **franchise**.

- La réponse expose `legal_form`.
- Le suivi documentaire détaillé (`documentsSummary`) reste consultable via la **liste** (§5.1).

### 5.3 Actions

- `POST /v1/franchises/:id/partners/:partnerId/suspend` — suspendre.
- `POST /v1/franchises/:id/partners/:partnerId/activate` — activer.

> La **création** d'un partenaire et le **dépôt de documents** ne sont **pas** ouverts au portail franchise : ils passent par l'Admin (§4) ou par le partenaire lui-même (§7). La franchise consulte et suspend/active.

---

## 6. L'objet `documentsSummary`

Présent dans les listes et détails partenaire :

| Champ            | Sens |
|------------------|------|
| `requiredCount`  | Nombre de documents obligatoires pour cette forme (`4` morale, `0` physique). |
| `uploadedCount`  | Types de documents effectivement déposés. |
| `approvedCount` / `pendingCount` / `rejectedCount` | Répartition par statut de validation. |
| `missingCount` / `missingTypes` | Documents obligatoires manquants (codes). |
| `isComplete`     | `true` si tous les documents requis sont **approuvés** (et aucun manquant/rejeté/en attente). |
| `hasAnyDocument` | `true` si au moins un document a été déposé. |

---

## 7. Rappel — côté PARTENAIRE (self-service)

- `POST /v1/partners` (utilisateur authentifié) : crée le partenaire **+ son compte de connexion**, accepte aussi `legal_form`. Réponse : `{ partner, account: { userId, loginEmail } }`.
- `GET /v1/partners/:id/documents` : renvoie `legalForm`, `requiredDocumentTypes[]` (codes + libellés à demander), `documents[]` et `documentsSummary`.
- `POST /v1/partners/:id/documents` : dépose un document (même flux `uploadId` + `document_type_code` qu'en §4.5).

> Ces routes `/v1/partners/:id/...` restent accessibles à la **franchise propriétaire** du partenaire (garde inchangée).

---

## 8. Codes d'erreur

| Code                          | HTTP | Cause |
|-------------------------------|------|-------|
| `PARTNER_LEGAL_FORM_INVALID`  | 400  | `legal_form` hors `INDIVIDUAL` / `COMPANY`. |
| `PARTNER_LEGAL_NAME_REQUIRED` | 400  | `legal_name` manquant à la création. |
| `PARTNER_TYPE_REQUIRED` / `PARTNER_TYPE_INVALID` | 400 | `partner_type` manquant/invalide (inchangé). |
| `PARTNER_CONTACT_EMAIL_REQUIRED` / `PARTNER_PASSWORD_REQUIRED` | 400 | email/mot de passe requis (création admin). |

---

## 9. Détails techniques (pour mémoire)

- **Migration** : `migrations/113_partners_legal_form.sql` (additive, idempotente)
  - `partners.legal_form` (+ CHECK + index `idx_partners_legal_form`).
  - `ref_document_types.legal_form` : `NULL` = requis pour tous ; `'COMPANY'` = requis morale uniquement.
  - `BUSINESS_REGISTRATION` reclassé en `COMPANY`-only + seed des 3 autres docs morale.
- **Code** :
  - `src/shared/compliance-summary.ts` — `loadRequiredDocumentTypes(subject, legalForm?)` filtre par forme (cache par sujet+forme).
  - `src/modules/partners/partners.service.ts` — création/modif persistent `legal_form` ; détail & liste de documents conditionnés à la forme.
  - `src/modules/admin/admin.lists.service.ts` — `listAdminPartners` (select + filtre `legalForm` + `documentsSummary` par forme), `getAdminPartnerDetail`, `patchAdminPartner`.
- **Comportement** : informatif (non bloquant). Pour rendre l'activation bloquante tant que le dossier morale est incomplet, c'est une évolution séparée à demander.
- **Écart connu** : le **détail** partenaire côté franchise renvoie `legal_form` mais pas `documentsSummary` (disponible en liste). À aligner si besoin.

---

## 10. Récap pour le front (Admin / Franchise)

1. Ajouter un sélecteur **« Personne physique / Personne morale »** au formulaire de création → envoyer `legalForm` (ou `legal_form`).
2. Si **morale**, après création : afficher la checklist des documents lue dynamiquement (`requiredDocumentTypes` ou `documentsSummary.missingTypes`) et permettre l'upload (flux `signed-url` → `documents`).
3. Afficher un badge dossier (`documentsSummary.isComplete`) dans la fiche **et** la liste.
4. Requalifier les partenaires existants (tous `INDIVIDUAL`) en `COMPANY` via `PATCH` au cas par cas.
