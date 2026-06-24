# Bug backend — Dépôt de documents partenaire (personne morale) depuis la franchise → PARTNER_ACCESS_DENIED

> **Date :** 2026-06-22
> **Émetteur :** équipe front UpJunoo (`Up_proV2`)
> **Destinataire :** équipe backend / API
> **Priorité :** **P0** — bloque l'onboarding des partenaires *personne morale* depuis le portail franchise
> **Contexte front :** `src/features/franchise/pages/FranchisePartnerNewPage.tsx`, `src/features/franchise/api/partnerDocuments.service.ts`
> **Contrat de référence :** `PARTENAIRE-PERSONNE-PHYSIQUE-MORALE.md` (§3, §5.4, §7, §10)

---

## 1. Symptôme observé

Lors de la création d'un partenaire **personne morale** (`legal_form = COMPANY`) depuis le portail **franchise**, la création du partenaire réussit, mais le **dépôt des 4 documents obligatoires** échoue.

| Étape | Action | Méthode | URL | Résultat |
|-------|--------|---------|-----|----------|
| 1 | Créer le partenaire | `POST` | `/v1/partners` | ✅ OK (renvoie `partner.id` + `account`) |
| 2 | Obtenir l'URL d'upload | `POST` | `/v1/uploads/signed-url` | ✅ OK |
| 3 | **Rattacher le document** | `POST` | `/v1/partners/{partnerId}/documents` | ❌ **403 `PARTNER_ACCESS_DENIED`** |

**Réponse backend (étape 3) :**
```json
{
    "status": "error",
    "generatedAt": "2026-06-22T21:29:51.547Z",
    "message": "Accès partenaire refusé",
    "error": {
        "code": "PARTNER_ACCESS_DENIED",
        "message": "Accès partenaire refusé"
    }
}
```

**Contexte d'appel (headers) :** token de scope **franchise** — `X-Scope: franchise`, `X-Franchise-Id: <id>`.
**Corps envoyé à l'étape 3 :** `{ "uploadId": "…", "document_type_code": "BUSINESS_REGISTRATION" }` (idem pour `COMPANY_STATUTES`, `TAX_REGISTRATION_DFE`, `MANAGER_ID_CARD`).

---

## 2. Analyse

1. La route `POST /v1/partners/{id}/documents` est gardée par un contrôle de propriété partenaire :
   elle n'autorise que le **partenaire lui-même** (compte propriétaire) — confirmé par le portail
   partenaire qui utilise la même route avec succès (`src/features/partner/api/profile.service.ts`).
2. Le token **franchise** n'est pas reconnu comme propriétaire du partenaire qu'elle vient pourtant
   de créer → `PARTNER_ACCESS_DENIED`.
3. **Incohérence dans le contrat** `PARTENAIRE-PERSONNE-PHYSIQUE-MORALE.md` :
   - **§5.4** : « La création d'un partenaire et **le dépôt de documents ne sont pas ouverts au
     portail franchise** : ils passent par l'Admin ou par le partenaire lui-même. »
   - **§10 (Récap pour le front, Admin / Franchise)**, point 3 : « Si morale, après création :
     afficher la checklist des documents … et **permettre l'upload (flux signed-url → documents)**. »
   - **§7** : « Ces routes `/v1/partners/:id/...` restent accessibles à la **franchise propriétaire**
     du partenaire (garde inchangée). »

   → §7 et §10 disent que la franchise propriétaire **peut** déposer les documents ; §5.4 dit le
   contraire. Le comportement réel (`PARTNER_ACCESS_DENIED`) suit §5.4. **Il faut trancher.**

---

## 3. Ce que le front fait aujourd'hui (workaround en place)

Pour ne pas perdre le partenaire créé ni risquer un doublon :
- La création (`POST /v1/partners`) est conservée.
- L'échec de dépôt de documents est rendu **non bloquant** : on redirige vers la fiche du partenaire
  et on affiche un avertissement (« documents à déposer par le partenaire ou un administrateur »).

C'est un palliatif. Tant que le backend ne tranche pas, **un partenaire morale créé depuis la
franchise reste au dossier documentaire incomplet** (`documentsSummary.isComplete = false`).

---

## 4. Actions demandées au backend (par ordre de préférence)

### Option A (recommandée, aligne sur §7/§10) — Autoriser la franchise propriétaire
Étendre la garde de `POST /v1/partners/{id}/documents` **et** `GET /v1/partners/{id}/documents`
pour autoriser : `admin` **OU** le partenaire propriétaire **OU** la **franchise dont
`partner.franchise_id == X-Franchise-Id`**.
→ Le front réutilise tel quel le flux `signed-url` → `POST /v1/partners/{id}/documents`.

### Option B (alternative) — Route franchise dédiée
Exposer `POST /v1/franchises/{franchiseId}/partners/{partnerId}/documents`
(miroir de `POST /v1/admin/partners/{id}/documents`), gardée par le scope franchise.
→ Préciser le corps attendu (`uploadId` + `document_type_code` ?).

### Option C (si dépôt franchise refusé par décision produit)
Confirmer **officiellement** que le dépôt de documents partenaire est réservé à l'admin et au
self-service partenaire. Dans ce cas :
- Mettre à jour le contrat (corriger le §10 qui demande l'upload côté franchise).
- Le front **retirera** les champs d'upload du formulaire franchise et n'affichera que la checklist
  (lecture seule) + un message indiquant qui doit fournir les pièces.

---

## 5. Questions de confirmation

1. **`POST /v1/partners` est-il la bonne route de création pour une franchise ?** Aujourd'hui elle
   fonctionne (partenaire + compte créés). À confirmer comme route canonique côté franchise (vs
   l'ancienne `POST /v1/franchises/{id}/partners` qui renvoyait `PARTNER_USER_PROVISION_FAILED`).
2. **Le partenaire créé par une franchise est-il bien rattaché** avec `partner.franchise_id =`
   franchise appelante (pour les contrôles de propriété) ?
3. **Pièce du gérant `MANAGER_ID_CARD` recto/verso** : faut-il un paramètre `side`/`FRONT`/`BACK`
   dans le corps de `…/documents`, ou deux dépôts successifs avec le même `document_type_code`
   suffisent-ils (sans que le second écrase le premier) ?

---

## 6. Impact utilisateur

| Fonctionnalité | Impact |
|----------------|--------|
| Création partenaire **personne physique** (franchise) | ✅ OK (aucun document requis) |
| Création partenaire **personne morale** (franchise) | ⚠️ Partenaire créé mais **dossier documentaire vide** |
| Conformité KYC partenaire morale | ❌ Bloquée tant que les 4 pièces ne sont pas déposables |

---

## 7. Documents liés

| Document | Lien |
|----------|------|
| Contrat personne physique/morale | `PARTENAIRE-PERSONNE-PHYSIQUE-MORALE.md` |
| Réponse nom du gérant | `REPONSE-DEMANDE-PARTENAIRE-NOM-GERANT.md` |
| Bug création — champs manquants (résolu) | `BACKEND-BUG-FRANCHISE-PARTNER-CREATION-FIELDS.md` |
| Bug création — user provision (route franchise) | `BACKEND-BUG-PARTNER-USER-PROVISION-FAILED.md` |
| Page front | `src/features/franchise/pages/FranchisePartnerNewPage.tsx` |
| Service documents front | `src/features/franchise/api/partnerDocuments.service.ts` |

---

## 8. Historique

| Date | Heure | Erreur | Étape | Statut |
|------|-------|--------|-------|--------|
| 2026-06-22 | 19:03 | `PARTNER_TYPE_REQUIRED` (400) | création | ✅ Résolu (champs envoyés) |
| 2026-06-22 | 19:54 | `PARTNER_USER_PROVISION_FAILED` (500) | création via `/v1/franchises/:id/partners` | ✅ Contourné (bascule sur `POST /v1/partners`) |
| 2026-06-22 | 21:29 | `PARTNER_ACCESS_DENIED` (403) | dépôt documents `POST /v1/partners/:id/documents` | 🔄 En attente backend |
