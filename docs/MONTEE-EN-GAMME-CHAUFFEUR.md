# Guide d'intégration — Montée en gamme d'un chauffeur (back-office)

> **Portails concernés** : Admin (`/v1/admin/*`) et Franchise (`/v1/franchises/*`, `/v1/franchise/*`).
> **Statut backend** : déployé en production, validé E2E le 2026-06-24.
> **Public** : équipe front back-office (Up_pro / portail franchise).

---

## 1. TL;DR

Le back-office peut changer la **gamme** d'un chauffeur (ex. `ECO` → `CONFORT` / `CONFORT+` / `PREMIUM`) via le champ **`ride_category_code`** sur la route de mise à jour du chauffeur.

```http
PATCH /v1/admin/drivers/{driverId}
Authorization: Bearer <token_admin>
Content-Type: application/json

{ "ride_category_code": "CONFORT" }
```

- Si la gamme demandée **dépasse la catégorie réelle du véhicule** du chauffeur → la requête est **refusée** (`422`).
  Pour passer outre, renvoyer **`"force": true`**.
- La valeur est **validée** (catégorie inconnue → `400`).
- Tout changement est **tracé** (journal d'audit) et ajuste automatiquement la livraison.

> ⚠️ **Le chauffeur ne peut PAS faire cette montée en gamme lui-même** depuis l'app (garde anti-fraude tarifaire). Le back-office est la **seule** voie légitime.

---

## 2. Contexte métier

Chaque chauffeur porte une **gamme** (`ride_category_code`) qui détermine :
- les **courses VTC** qu'il peut recevoir (un chauffeur `CONFORT` reçoit `CONFORT` + `ECO`, etc.) ;
- et, par ricochet, son éligibilité **livraison**.

Un chauffeur **ne peut pas** se hisser tout seul vers une gamme supérieure à celle de son véhicule (sinon il capterait une facturation premium sans le véhicule correspondant = fraude tarifaire). Cette montée est une **décision back-office** : c'est un agent admin ou franchise qui l'acte, en connaissance de cause.

---

## 3. Hiérarchie des gammes & valeurs admises

### Gammes RIDE (VTC) — ordonnées
```
ECO  <  CONFORT  <  CONFORT+  <  PREMIUM
 1        2           3            4
```
Passer d'un rang inférieur à un rang supérieur = **montée en gamme** (gardée).
Passer d'un rang supérieur à un rang inférieur = **descente** (toujours autorisée, pas de `force`).

### Valeurs acceptées par `ride_category_code`
Le catalogue complet (renvoyé dans le `400` en cas d'erreur) :

| Code           | Type        | Fait de la livraison ? |
|----------------|-------------|------------------------|
| `ECO`          | VTC + livraison | ✅ oui (voiture express) |
| `CONFORT`      | VTC pur     | ❌ non |
| `CONFORT+`     | VTC pur     | ❌ non |
| `PREMIUM`      | VTC pur     | ❌ non |
| `MOTO`         | Livraison   | ✅ oui (express moto) |
| `TRICYCLE`     | Fret        | ✅ oui (cargo) |
| `FOURGON`      | Fret        | ✅ oui (cargo) |
| `CAMION`       | Fret        | ✅ oui (cargo) |

> `CONFORT+` est aussi accepté écrit `CONFORT_PLUS` (normalisé automatiquement).
> Pour la **montée en gamme VTC** (le cas d'usage de ce guide), seules `ECO / CONFORT / CONFORT+ / PREMIUM` sont pertinentes.

---

## 4. Les routes disponibles

| Portail | Méthode + Path | Auth (préHandler) | Param chauffeur |
|---|---|---|---|
| **Admin** | `PATCH /v1/admin/drivers/{id}` | `authenticate` + `requireAdmin` | `{id}` = driverId |
| **Franchise** | `PATCH /v1/franchises/{id}/drivers/{driverId}` | `franchiseAuth` | `{id}` = franchiseId, `{driverId}` = driverId |
| **Franchise (scoped)** | `PATCH /v1/franchise/drivers/{id}` | session franchise (franchiseId déduit du JWT) | `{id}` = driverId |

> Les 3 routes partagent **exactement** la même logique de validation, de garde `force` et d'audit.
> La franchise ne peut agir que sur **ses** chauffeurs (sinon `404`).

---

## 5. Schéma de la requête

### Champ qui nous intéresse
| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `ride_category_code` | `string` | oui (pour ce cas) | gamme cible — voir §3. Accepté aussi en `rideCategoryCode` (camelCase). |
| `force` | `boolean` | non | `true` pour outrepasser la garde de compatibilité véhicule. Accepté aussi en `forceUpgrade`. Défaut : `false`. |

> Les deux conventions de nommage sont acceptées partout : `ride_category_code` **ou** `rideCategoryCode`, `force` **ou** `forceUpgrade`.

### Autres champs acceptables sur la même route (rappel)
La route met à jour un chauffeur de façon générale ; tu peux combiner plusieurs champs dans un seul PATCH.

**Admin** (`PATCH /v1/admin/drivers/{id}`) accepte aussi : `approvalStatus`, `availabilityStatus`, `kycStatus`, `cityId`, `partnerId`, `franchiseId`, `currentVehicleId` (camel ou snake_case).

**Franchise** accepte aussi : `first_name`, `last_name`, `email`, `phone`, `accepts_cash`, `accepts_wallet`, `partner_id`, `availability_status`.

> Pour une montée en gamme « pure », envoyer **uniquement** `ride_category_code` (+ éventuellement `force`).

---

## 6. Le mécanisme de garde (check + force)

```
        ┌─────────────────────────────────────────────┐
        │ PATCH ... { ride_category_code: "CONFORT" }  │
        └───────────────────────┬─────────────────────┘
                                │
                  La valeur est-elle une catégorie connue ?
                    │ non                         │ oui
                    ▼                              ▼
            400 INVALID_RIDE_CATEGORY    La gamme dépasse-t-elle
            (+ liste `allowed`)          la catégorie du véhicule ?
                                            │ non              │ oui
                                            ▼                  ▼
                                         200 OK         force === true ?
                                       (écrit la gamme)   │ non        │ oui
                                                          ▼            ▼
                                        422 UPGRADE_REQUIRES_FORCE   200 OK
                                        (+ vehicleCategory, target)  (montée forcée
                                                                      + audit force_upgrade)
```

**Règle de compatibilité** : la gamme cible est comparée à la **catégorie réelle du véhicule courant** du chauffeur (`ref_vehicle_categories` du véhicule rattaché ; à défaut de véhicule → plancher `ECO`).
- cible ≤ catégorie véhicule → autorisé sans `force` ;
- cible > catégorie véhicule → `422` sans `force`, autorisé avec `force: true`.

> Une **descente** (CONFORT → ECO) ou un **maintien** ne déclenchent jamais le `422`.

---

## 7. Codes de réponse & comportement UI

Toutes les réponses suivent l'enveloppe standard :
```jsonc
// succès
{ "status": "ok", "generatedAt": "...", "message": "...", "driver": { /* ... */ } }
// erreur
{ "status": "error", "generatedAt": "...", "message": "...",
  "error": { "code": "...", "message": "...", "details": { /* ... */ } } }
```

| HTTP | `error.code` | Cause | Que faire côté UI |
|---|---|---|---|
| **200** | — | Gamme appliquée | Rafraîchir la fiche chauffeur ; afficher la nouvelle gamme. |
| **400** | `INVALID_RIDE_CATEGORY` | Valeur non reconnue | Afficher `error.details.allowed` (liste fermée) ; idéalement, **proposer un `<select>`** des gammes valides plutôt qu'une saisie libre. |
| **422** | `DRIVER_CATEGORY_UPGRADE_REQUIRES_FORCE` | La gamme dépasse le véhicule | Afficher une **confirmation** : « Le véhicule de ce chauffeur est en gamme **{vehicleCategory}**. Confirmer la montée vers **{target}** ? » → si l'agent confirme, **renvoyer la même requête avec `force: true`**. |
| **400** | `ADMIN_DRIVER_PATCH_EMPTY` / `DRIVER_UPDATE_EMPTY` | Aucun champ valide envoyé | Vérifier que le payload contient bien `ride_category_code`. |
| **404** | `DRIVER_NOT_FOUND` / scope franchise | Chauffeur introuvable / hors périmètre franchise | Vérifier le `driverId` (et qu'il appartient bien à la franchise). |
| **401 / 403** | `ADMIN_REQUIRED`, etc. | Token absent / rôle insuffisant | Re-login ; vérifier le rôle (admin ou membre franchise). |

### Détails utiles dans les erreurs
- `422` → `error.details = { "vehicleCategory": "ECO", "target": "CONFORT" }` — sert à composer le message de confirmation.
- `400 INVALID_RIDE_CATEGORY` → `error.details = { "allowed": ["CAMION","CONFORT","CONFORT+","ECO","FOURGON","MOTO","PREMIUM","TRICYCLE"] }`.

---

## 8. Effets de bord automatiques

Quand la nouvelle gamme est du **VTC pur** (`CONFORT`, `CONFORT+`, `PREMIUM`), le backend met automatiquement **`accepts_delivery = false`** dans les préférences du chauffeur (un véhicule confort ne fait pas de livraison). C'est la même règle que côté app chauffeur.

> ⚠️ **Asymétrie à connaître** : repasser ensuite le chauffeur en `ECO` **ne réactive PAS** `accepts_delivery` automatiquement. Si l'agent veut que le chauffeur reprenne la livraison après une redescente en `ECO`, il doit réactiver la préférence livraison explicitement (champ `accepts_delivery`).

---

## 9. Traçabilité (audit)

Chaque changement de gamme est journalisé dans `audit_log` (consultable via `GET /v1/admin/audit-log`) :

| `action` | Quand |
|---|---|
| `driver.ride_category.change` | Changement sans dépassement (ou descente) |
| `driver.ride_category.force_upgrade` | Montée forcée (`force: true` au-dessus du véhicule) |

`metadata` enregistré : `{ from, to, vehicle_category, forced, source }` et `actor_user_id` = l'agent qui a agi (`source` = `admin` ou `franchise`).

> Aucun changement de gamme n'est silencieux : on sait toujours **qui** a monté **quel** chauffeur, **depuis/vers** quelle gamme, et si c'était forcé.

---

## 10. Workflow UX recommandé (en 2 temps)

```
1. L'agent choisit la gamme cible dans un <select> (ECO/CONFORT/CONFORT+/PREMIUM).
2. PATCH sans `force`.
   ├─ 200 → succès, on rafraîchit la fiche.
   ├─ 400 → valeur invalide (ne devrait pas arriver avec un <select>).
   └─ 422 → on AFFICHE une modale de confirmation :
            « Le véhicule est en gamme {vehicleCategory}. Forcer la montée vers {target} ? »
            ├─ Annuler → on ne fait rien.
            └─ Confirmer → PATCH avec `force: true` → 200.
```

Ce parcours évite les montées en gamme accidentelles (le `422` agit comme garde-fou) tout en laissant l'agent décider en dernier ressort.

---

## 11. Exemples complets (curl)

> Remplacer `$TOKEN` par un token admin et `$DID` par l'`id` du chauffeur.

### a) Catégorie invalide → 400
```bash
curl -X PATCH "https://api.upjunoo-dev.tech/v1/admin/drivers/$DID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"ride_category_code":"BANANE"}'
```
```json
{ "status":"error","error":{ "code":"INVALID_RIDE_CATEGORY",
  "details":{ "allowed":["CAMION","CONFORT","CONFORT+","ECO","FOURGON","MOTO","PREMIUM","TRICYCLE"] } } }
```

### b) Montée au-dessus du véhicule, sans force → 422
```bash
curl -X PATCH "https://api.upjunoo-dev.tech/v1/admin/drivers/$DID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"ride_category_code":"CONFORT"}'
```
```json
{ "status":"error","error":{ "code":"DRIVER_CATEGORY_UPGRADE_REQUIRES_FORCE",
  "details":{ "vehicleCategory":"ECO","target":"CONFORT" } } }
```

### c) Montée forcée → 200
```bash
curl -X PATCH "https://api.upjunoo-dev.tech/v1/admin/drivers/$DID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"ride_category_code":"CONFORT","force":true}'
```
```json
{ "status":"ok","message":"Opération réussie.",
  "driver":{ "id":"...","ride_category_code":"CONFORT", "...":"..." } }
```

### d) Redescente (toujours autorisée, sans force) → 200
```bash
curl -X PATCH "https://api.upjunoo-dev.tech/v1/admin/drivers/$DID" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"ride_category_code":"ECO"}'
```

### e) Variante Franchise
```bash
curl -X PATCH "https://api.upjunoo-dev.tech/v1/franchises/$FID/drivers/$DID" \
  -H "Authorization: Bearer $FRANCHISE_TOKEN" -H "Content-Type: application/json" \
  -d '{"ride_category_code":"CONFORT","force":true}'
```

---

## 12. FAQ / cas limites

**Le chauffeur n'a pas de véhicule rattaché ?**
La catégorie de référence retombe sur le plancher `ECO`. Toute cible > `ECO` exigera donc `force: true`.

**Différence entre `CONFORT` (gamme) et la catégorie du véhicule ?**
La **gamme** (`ride_category_code`) est ce que le chauffeur peut **vendre/recevoir** ; la **catégorie véhicule** (`ref_vehicle_categories`) est l'**ancre physique** servant à valider la cohérence. La garde compare la première à la seconde.

**Forcer une montée a-t-il un risque ?**
Le chauffeur recevra des courses de la gamme forcée même si son véhicule ne « colle » pas. C'est une décision assumée par l'agent (d'où la confirmation + l'audit `force_upgrade`).

**Puis-je changer la gamme et d'autres champs en même temps ?**
Oui, le PATCH accepte plusieurs champs. La validation/garde ne s'applique qu'à `ride_category_code`.

**Et le self-service chauffeur (app) ?**
`PATCH /drivers/me` et `PATCH /vehicles/:id` restent **bloqués** sur toute montée (`403 DRIVER_CATEGORY_UPGRADE_FORBIDDEN`). Seul le back-office passe.

---

## 13. Références backend (pour l'équipe API)

| Élément | Fichier |
|---|---|
| Helper partagé (validation + garde + parité + audit) | `src/shared/driver-ride-category.ts` |
| Hiérarchie des gammes RIDE | `src/modules/dispatch/ride-category.ts` (`rideTierRank`, `isRideTierUpgrade`) |
| Garde combinée RIDE + livraison | `src/modules/dispatch/delivery-category.ts` (`isCategoryUpgrade`) |
| Câblage Admin | `src/modules/admin/admin.lists.service.ts` (`patchAdminDriverFull`) |
| Câblage Franchise | `src/modules/franchises/franchises.service.ts` (`updateDriver`) |
| Câblage Franchise scoped | `src/modules/backoffice/backoffice.scoped.service.ts` (`updateFranchiseDriverScoped`) |
| Doc Swagger | `src/config/openapi.route-docs.ts` (PATCH `/v1/admin/drivers/{id}`) |

---

*Dernière mise à jour : 2026-06-24.*
