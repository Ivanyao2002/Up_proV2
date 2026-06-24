# Réponse — Nom du gérant à la création partenaire (`legal_form = COMPANY`)

> **Destinataire :** équipe front UpJunoo Pro (`Up_prov2`)
> **De :** équipe API UpJunoo
> **Date :** 2026-06-22
> **Statut :** ✅ **LIVRÉ + DÉPLOYÉ LIVE** sur `api.upjunoo-dev.tech` — validé E2E (17/17)
> **Réf. demande :** [`DEMANDE-BACKEND-PARTENAIRE-NOM-GERANT.md`](./DEMANDE-BACKEND-PARTENAIRE-NOM-GERANT.md)
> **Contrat détaillé :** [`PARTENAIRE-PERSONNE-PHYSIQUE-MORALE.md`](./PARTENAIRE-PERSONNE-PHYSIQUE-MORALE.md) §4.6

---

## 1. Ce qui est livré (P0 + P1 + P2)

| Phase | Demandé | Livré |
|-------|---------|-------|
| **P0** | `manager_first_name` / `manager_last_name` en POST/PATCH + lecture GET | ✅ |
| **P1** | `manager_display_name` calculé + recherche `search` | ✅ |
| **P2** | Repli `firstName`/`lastName` → gérant si `COMPANY` sans `manager_*` | ✅ |

Persistance : **colonnes dédiées** sur `partners` (Option A) — `manager_first_name`, `manager_last_name`
(migration `115`). `manager_display_name` est **calculé côté API**.

---

## 2. Champs acceptés (création + modification)

Acceptés en **camelCase** et **snake_case** :

| Champ | Type | Notes |
|-------|------|-------|
| `managerFirstName` / `manager_first_name` | string | Prénom du gérant |
| `managerLastName` / `manager_last_name` | string | Nom du gérant |
| `managerFullName` / `manager_full_name` (alias `manager_name`) | string | Une ligne — scindé sur le 1er espace |

**Décisions (à câbler côté front) :**

1. **`INDIVIDUAL` + `manager_*` → ignoré silencieusement** (pas de 400). Le partenaire *est* la personne.
   → Pas besoin de gérer un nouveau code d'erreur. (Le code suggéré `PARTNER_MANAGER_NOT_APPLICABLE`
   n'a **pas** été implémenté : champ ignoré plutôt que rejeté, aligné sur le modèle « informatif non bloquant ».)
2. **`COMPANY` sans `manager_*` → autorisé** (non bloquant, comme les documents). La pièce
   `MANAGER_ID_CARD` reste, elle, requise pour un **dossier complet**.
3. **PATCH granulaire** : envoyer uniquement `managerLastName` met à jour le nom **sans effacer**
   le prénom. Repasser en `legal_form = INDIVIDUAL` **purge** le gérant.

---

## 3. Exemples

### Création personne morale — `POST /v1/admin/partners`
```jsonc
{
  "legal_name": "Transports Soleil SARL",
  "trade_name": "Soleil Express",
  "partner_type": "FLEET",
  "legal_form": "COMPANY",
  "managerFirstName": "Amadou",
  "managerLastName": "Diallo",
  "email": "contact@soleil.ci",
  "password": "MotDePasse123"
}
```
→ **201**, `partner.manager_first_name = "Amadou"`, `partner.manager_last_name = "Diallo"`.

### Changement de gérant — `PATCH /v1/admin/partners/:id`
```jsonc
{ "managerLastName": "Traoré" }
```
→ **200**, `manager_display_name = "Amadou Traoré"` (prénom conservé).

### Lecture (`GET /v1/admin/partners`, `…/:id`, `/v1/partners/:id`, franchise)
```jsonc
{
  "manager_first_name": "Amadou",
  "manager_last_name": "Diallo",
  "manager_display_name": "Amadou Diallo"
}
```
Pour `INDIVIDUAL` : `manager_* = null`.

---

## 4. Routes couvertes

| Méthode | Route | manager_* écriture | manager_display_name lecture |
|---------|-------|:---:|:---:|
| `POST` | `/v1/admin/partners` | ✅ | ✅ |
| `PATCH` | `/v1/admin/partners/:id` | ✅ | — |
| `GET` | `/v1/admin/partners` (liste) | — | ✅ + recherche `?search=` |
| `GET` | `/v1/admin/partners/:id` | — | ✅ |
| `POST` | `/v1/partners` (self-service) | ✅ | — |
| `PATCH` | `/v1/partners/:id` | ✅ | — |
| `GET` | `/v1/partners/:id` | — | ✅ |
| `GET` | `/v1/franchises/:id/partners` (+ détail) | — | ✅ |

Swagger (`/docs`) : description de `POST /v1/partners` mise à jour.

---

## 5. Intégration front attendue

1. `PartnerCreateForm.tsx` : si `COMPANY` → bloc **« Prénom / Nom du gérant »**.
2. `partners.service.ts` : envoyer `managerFirstName` / `managerLastName` (remplacer l'usage ambigu
   de `firstName`/`lastName`, qui reste le profil du **compte portail**).
3. Liste / fiche partenaire (admin **et** franchise) : afficher `manager_display_name`.
4. La recherche back-office trouve déjà un partenaire par nom de gérant.

---

## 6. Critères d'acceptation — état

- [x] `POST … COMPANY + manager_*` → **201** persisté
- [x] `GET …/:id` renvoie `manager_*` + `manager_display_name`
- [x] `INDIVIDUAL + manager_*` → **ignoré** (tranché : ignoré, pas 400 — documenté)
- [x] `search` trouve par nom de gérant
- [x] Swagger + contrat mis à jour
- [x] `MANAGER_ID_CARD` toujours requis pour dossier `COMPANY` complet (inchangé)
