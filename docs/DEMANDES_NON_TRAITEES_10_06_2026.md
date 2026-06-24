# Demandes backend non traitées — 10 juin 2026

> **Document de transmission équipe API** — sujets encore ouverts ou partiels au **10/06/2026** (réaudit Swagger live v0.4.0 + probes API).  
> Swagger : [api.upjunoo-dev.tech/docs](https://api.upjunoo-dev.tech/docs)  
> Vérification : `node scripts/check-demandes-swagger.mjs` · `node scripts/audit-backend-demandes.mjs`  
> Demandes **traitées / fermées** : voir [DEMANDES-2026-06-10.md](./DEMANDES-2026-06-10.md)

---

## Synthèse réaudit (10/06/2026 — soir)

| Statut | IDs |
|--------|-----|
| **Non traité** | PA-01/02, PA-DOC-01, BINOME-UPLOAD-01, DR-AVAIL-01, DR-PARTNER-SUGGEST-01, FN-TRANS-LABELS-01, MK-BAN-01, SOS-DETAIL-01, SWAGGER-DOC-01, IMG-01 |
| **Partiel** | OR-TRACK-01 (`tracking` présent, pas d'historique GPS), FN-TRANS-01 (`filterOptions` OK, libellés franchise UUID), FLT-VEHICLE-DETAIL-01 |
| **Traité (retiré de ce fichier)** | FLT-COMPLIANCE-01, ZN-GEO-01 → voir fichier principal |

---

## Tableau des demandes ouvertes

| ID | Priorité | Résumé | Réaudit |
|----|----------|--------|---------|
| **BINOME-UPLOAD-01** / **FLT-UPLOAD-01** | Haute | Multipart upload KYC + pièces véhicule (wizard binôme) | ✗ 0 multipart dans Swagger |
| **PA-DOC-01** | Haute | Documents société partenaire (RCCM) | ✗ |
| **PA-01 / PA-02** | Haute | `franchiseName` / `cityLabel` null sur liste partenaires | ✗ confirmé audit |
| **FN-TRANS-LABELS-01** | Haute | `franchise.name` = UUID sur transactions | ✗ |
| **FN-TRANS-01** | Haute | Filtres + enrichissement liste transactions | ~ `filterOptions` OK |
| **OR-TRACK-01** | Haute | Trajectoire GPS dynamique (pas ligne droite) | ~ `tracking` partiel |
| **MK-BAN-01** | Haute | Bannières : upload image + POST création | ✗ POST non retesté |
| **DR-AVAIL-01** | Haute | Routes suspend / activate / availability chauffeur admin | ✗ PATCH non doc, pas /suspend |
| **DR-PARTNER-SUGGEST-01** | Haute | `suggestedPartner` à la création chauffeur | ✗ absent spec |
| **SOS-DETAIL-01** | Haute | Libellés FR `{ value, label }` sur SOS | ? 0 incident en base |
| **FLT-VEHICLE-DETAIL-01** | Moyenne | Objet `color` sur détail véhicule | ~ souvent absent |
| **SWAGGER-DOC-01** | Moyenne | Documenter params, multipart, réponses admin | ✗ |
| **IMG-01** | Moyenne | Images seed Supabase HTTP 400 | ✗ audit |

---

## Détail par demande

## SOS-DETAIL-01 — Détail incident SOS : objets `{ value, label }` et libellés français

### Contexte

Fiche admin : `/admin/ops/sos/incidents/{id}` — `SosIncidentDetailPage`  
Route : `GET /v1/admin/safety/sos/{id}`

La route répond **HTTP 200** et renvoie `incident`, `locations`, `events`, `notifications`, `tracking`.  
**Problème** : la plupart des champs sont des **codes techniques** (`escalated`, `critical`, `sos.detected.gps_signal_lost`) sans libellé lisible. Le front doit hardcoder des tables de traduction (`sosLabels.ts`, `adminSos.mapper.ts`) et certaines clés ne sont **pas couvertes**.

### Route concernée

```http
GET /v1/admin/safety/sos/1763b6d3-f3a9-4f13-bcdb-9f4f2a1af152
Authorization: Bearer {token_admin}
```

Proxy dev :

```http
GET /upjunoo-api/v1/admin/safety/sos/1763b6d3-f3a9-4f13-bcdb-9f4f2a1af152
```

### Constat API (10 juin 2026) — incident `1763b6d3-…`

Réponse réelle (structure actuelle) :

| Bloc | Présent | Manque pour l’UI |
|------|---------|------------------|
| `incident.status` | `"escalated"` | Pas de `statusLabel` (« Escaladé ») |
| `incident.severity` | `"critical"` | Pas de `severityLabel` (« Critique ») |
| `incident.trigger` | `"manual_button"` | Pas de `triggerLabel` (« Bouton SOS ») |
| `incident.actor_type` | `"CLIENT"` | Pas de `actorTypeLabel` (« Client ») |
| `incident.incident_type` | `"emergency"` | Pas de libellé |
| `incident.risk_factors[]` | codes bruts | Pas de `riskFactors[]` avec labels |
| `incident.client_id` | UUID seul | Pas d’objet `client { id, displayName, phone }` |
| `incident.driver_id` | `null` | Idem `driver`, `order`, `partner`, `franchise` |
| `events[].event_type` | codes techniques | Pas de `label` / `labelFr` par event |
| `events[].new_status` | `"active"` | Pas de `newStatusLabel` (« Actif ») |
| `notifications[]` | `recipient_type`, `channel`, `status` | Pas de libellés FR |
| `tracking` | OK (`trackingUrl`, `expiresAt`) | — |

### Affichage front actuel (dégradé)

Sans libellés API, la timeline affiche par exemple :

| Event API | Affichage actuel (fallback front) | Attendu UI |
|-----------|-----------------------------------|------------|
| `sos.detected.gps_signal_lost` | **`sos · detected · gps_signal_lost`** | **Signal GPS perdu détecté** |
| `sos.notifications_queued` | **`sos · notifications_queued`** | **Notifications mises en file** |
| `sos.created` | **Alerte déclenchée** (hardcodé front) | Alerte déclenchée |
| Description `sos.created` | `Smoke public safety tracking · → active` | `Smoke public safety tracking · → Actif` |

→ Les events non listés dans `adminSos.mapper.ts` tombent sur `type.replaceAll(".", " · ")`, d’où les libellés anglais/techniques.

### Demande backend — pattern `{ value, label }`

Pour chaque enum ou code métier, renvoyer **le code stable** (`value`) **et** le libellé d’affichage (`label`) en français.

**Convention** (alignée catalogue véhicules / compliance) :

```json
{
  "value": "escalated",
  "label": "Escaladé"
}
```

Ou champs parallèles rétrocompatibles : `status` + `statusLabel`, `event_type` + `label`.

### Réponse cible — extrait `incident` enrichi

```json
{
  "status": "ok",
  "generatedAt": "2026-06-10T10:01:49.357Z",
  "incident": {
    "id": "1763b6d3-f3a9-4f13-bcdb-9f4f2a1af152",
    "status": "escalated",
    "statusLabel": "Escaladé",
    "severity": "critical",
    "severityLabel": "Critique",
    "trigger": "manual_button",
    "triggerLabel": "Bouton SOS",
    "actor_type": "CLIENT",
    "actorTypeLabel": "Client",
    "incident_type": "emergency",
    "incidentTypeLabel": "Urgence",
    "risk_score": 100,
    "escalation_level": 3,
    "silent_mode": true,
    "silentModeLabel": "Mode silencieux",
    "risk_factors": [
      "no_order_context",
      "critical_severity",
      "silent_mode",
      "night_time",
      "gps_signal_lost"
    ],
    "riskFactors": [
      { "value": "no_order_context", "label": "Hors course" },
      { "value": "critical_severity", "label": "Sévérité critique" },
      { "value": "silent_mode", "label": "Mode silencieux" },
      { "value": "night_time", "label": "Heure nocturne" },
      { "value": "gps_signal_lost", "label": "Signal GPS perdu" }
    ],
    "client_id": "791c763a-4785-4c3a-be89-9de1eadb418b",
    "client": {
      "id": "791c763a-4785-4c3a-be89-9de1eadb418b",
      "displayName": "Client smoke test",
      "phone": "+2250700000000"
    },
    "driver": null,
    "order": null,
    "partner": null,
    "franchise": null,
    "assigned_to": null,
    "assignedTo": null,
    "acknowledged_by": null,
    "acknowledgedBy": null,
    "resolved_by": null,
    "resolvedBy": null,
    "latitude": 5.3601,
    "longitude": -4.0083,
    "triggered_at": "2026-06-08T22:01:24.685713+00:00",
    "metadata": {
      "request": {
        "message": "Smoke public safety tracking",
        "device": {
          "platform": "ios",
          "platformLabel": "iOS",
          "appVersion": "smoke",
          "batteryLevel": 42,
          "networkType": "4g",
          "networkTypeLabel": "4G"
        }
      }
    }
  }
}
```

### Réponse cible — `events[]` enrichis

```json
{
  "events": [
    {
      "id": "1614f62f-3932-4cc0-9616-2687823a4444",
      "event_type": "sos.detected.gps_signal_lost",
      "label": "Signal GPS perdu détecté",
      "description": "Scan sécurité périodique · GPS perdu depuis 101 s",
      "old_status": null,
      "new_status": null,
      "payload": {
        "reason": "periodic_safety_scan",
        "reasonLabel": "Scan sécurité périodique",
        "riskScore": 100,
        "diagnostics": { "gpsLostSeconds": 101 }
      },
      "created_at": "2026-06-08T22:03:06.020737+00:00"
    },
    {
      "id": "b104c60f-2173-445e-af80-8c4e35f858d2",
      "event_type": "sos.notifications_queued",
      "label": "Notifications mises en file",
      "description": "Admin central, contacts de confiance : 0",
      "payload": {
        "centralAdmin": true,
        "centralAdminLabel": "Équipe admin centrale",
        "trustedContacts": 0
      },
      "created_at": "2026-06-08T22:01:24.762664+00:00"
    },
    {
      "id": "c5cf26b5-67d9-4c07-85e9-01f751922bc3",
      "event_type": "sos.created",
      "label": "Alerte déclenchée",
      "description": "Smoke public safety tracking",
      "old_status": null,
      "oldStatusLabel": null,
      "new_status": "active",
      "newStatusLabel": "Actif",
      "payload": {
        "message": "Smoke public safety tracking",
        "riskScore": 92,
        "silentMode": true,
        "trackingUrl": "https://upjunoo.app/t/safety/227f7b21-091c-4c8d-aaea-f7955a2a7ab2"
      },
      "created_at": "2026-06-08T22:01:24.712855+00:00"
    }
  ]
}
```

**Rendu timeline attendu** (ordre anti-chronologique) :

```
Signal GPS perdu détecté
08/06/2026 22:03

Notifications mises en file
08/06/2026 22:01

Alerte déclenchée
Smoke public safety tracking · → Actif
08/06/2026 22:01
```

### Réponse cible — `notifications[]` enrichies

```json
{
  "notifications": [
    {
      "id": "3031df6d-ceed-4e1e-b1cb-a91040c9afd3",
      "recipient_type": "CENTRAL_ADMIN",
      "recipientTypeLabel": "Admin central",
      "channel": "IN_APP",
      "channelLabel": "Dans l'application",
      "status": "queued",
      "statusLabel": "En file d'attente",
      "user_id": "07d201ee-9ace-431c-a04f-cd7498a3c26a",
      "user": {
        "id": "07d201ee-9ace-431c-a04f-cd7498a3c26a",
        "displayName": "Dev Admin"
      },
      "created_at": "2026-06-08T22:01:24.732594+00:00"
    }
  ]
}
```

### Table de libellés événements (`events[].label`) — à porter côté API

| `event_type` | `label` (FR) |
|--------------|--------------|
| `sos.created` | Alerte déclenchée |
| `sos.acknowledged` | Prise en charge |
| `sos.escalated` | Escalade |
| `sos.resolved` | Incident clôturé |
| `sos.cancelled` | Alerte annulée |
| `sos.location_updated` | Position mise à jour |
| `sos.notifications_queued` | Notifications mises en file |
| `sos.detected.gps_signal_lost` | Signal GPS perdu détecté |
| `sos.safety_check_failed` | Contrôle sécurité échoué |
| `sos.safety_check_ok` | Contrôle sécurité OK |

### Table statuts incident (`statusLabel` / `newStatusLabel`)

| `value` | `label` |
|---------|---------|
| `active` | Actif |
| `acknowledged` | Pris en charge |
| `escalated` | Escaladé |
| `resolved` | Résolu |
| `cancelled` | Annulé |

### Table sévérité (`severityLabel`)

| `value` | `label` |
|---------|---------|
| `low` | Faible |
| `medium` | Moyen |
| `high` | Élevé |
| `critical` | Critique |

### Table facteurs de risque (`riskFactors[].label`)

| `value` | `label` |
|---------|---------|
| `no_order_context` | Hors course |
| `critical_severity` | Sévérité critique |
| `silent_mode` | Mode silencieux |
| `night_time` | Heure nocturne |
| `gps_signal_lost` | Signal GPS perdu |
| `high_risk_score` | Score de risque élevé |

### Objets liés à embarquer (éviter N+1)

Quand les IDs sont renseignés, joindre des objets `{ id, displayName, … }` :

| Champ ID | Objet embarqué | Champs minimaux |
|----------|----------------|-----------------|
| `client_id` | `client` | `id`, `displayName`, `phone` |
| `driver_id` | `driver` | `id`, `displayName`, `driverCode`, `phone` |
| `order_id` | `order` | `id`, `ref`, `status`, `statusLabel` |
| `partner_id` | `partner` | `id`, `tradeName` |
| `franchise_id` | `franchise` | `id`, `name` |
| `assigned_to` | `assignedTo` | `id`, `displayName` |
| `acknowledged_by` | `acknowledgedBy` | `id`, `displayName` |
| `resolved_by` | `resolvedBy` | `id`, `displayName` |
| `events[].actor_user_id` | `actor` | `id`, `displayName` |

### Même enrichissement sur la liste et le dashboard

Appliquer les mêmes champs `*Label` et objets embarqués sur :

- `GET /v1/admin/safety/sos` → chaque item de `incidents[]`
- `GET /v1/admin/safety/sos/dashboard` → `activeIncidents[]`

→ Éviter que la liste affiche des codes bruts alors que le détail serait enrichi.

### Contournement front actuel

| Fichier | Rôle |
|---------|------|
| `src/features/safety/lib/sosLabels.ts` | Traduction partielle statuts, triggers, risk_factors |
| `src/features/safety/api/adminSos.mapper.ts` | `mapEventLabel` — ~8 event types seulement |
| Fallback | `event_type.replaceAll(".", " · ")` → libellés illisibles |

Dès que l’API renvoie `events[].label` et `*Label`, le front utilisera **prioritairement** les libellés serveur.

### Ticket backend synthétique (copier-coller)

> **Titre** : Enrichir `GET /v1/admin/safety/sos/{id}` avec libellés FR et objets embarqués  
>  
> **Contexte** : La fiche SOS admin affiche des codes techniques en timeline (`sos · detected · gps_signal_lost`) et des statuts bruts (`→ active`). Exemple incident `1763b6d3-f3a9-4f13-bcdb-9f4f2a1af152`.  
>  
> **Acceptance criteria** :
> 1. `incident` : `statusLabel`, `severityLabel`, `triggerLabel`, `actorTypeLabel`, `riskFactors[]` avec `{ value, label }`
> 2. `events[]` : champ `label` (FR) + `newStatusLabel` / `oldStatusLabel` quand applicable + `description` lisible
> 3. `notifications[]` : `recipientTypeLabel`, `channelLabel`, `statusLabel`
> 4. Objets embarqués `client`, `driver`, `order`, `partner`, `franchise` quand IDs présents
> 5. Même enrichissement sur liste + dashboard SOS
> 6. Conserver les champs codes existants (`status`, `event_type`, …) pour rétrocompatibilité
> 7. Swagger mis à jour

---


---

## BINOME-UPLOAD-01 — Upload documents KYC chauffeur + pièces véhicule (création binôme admin)

> Alias backlog 9 juin : **FLT-UPLOAD-01** — même sujet.

### Contexte

Le back-office admin permet de créer un **binôme chauffeur + véhicule** via un wizard (`FleetPairCreateWizard`) qui collecte :

| Sujet | Documents collectés UI |
|-------|------------------------|
| **Chauffeur** | CNI (recto/verso), permis (recto/verso), selfie |
| **Véhicule** | Carte grise (recto/verso), assurance, visite technique |

**Constat réseau (10 juin 2026)** — seul du **JSON** part vers l’API UpJunoo :

```http
POST /v1/vehicles
→ {"partnerId","categoryCode","brandCode","modelCode","colorCode","manufactureYear","seatsCount","plateNumber"}

POST /v1/auth/driver/register
→ {"phone","firstName","lastName","email","password"}
```

Puis enchaînement front (sans images) :

```http
POST /v1/drivers/onboarding/start
POST /v1/partners/{partnerId}/members
POST /v1/vehicles/{vehicleId}/assign-driver
```

La réponse `driver/register` indique déjà dans `nextSteps` :

```json
["POST /v1/drivers/onboarding/start", "POST /v1/kyc/documents", "POST /v1/vehicles"]
```

→ Les documents sont **prévus** comme étape séparée, mais le contrat d’upload n’est **pas exploitable** côté admin aujourd’hui.

### Mise à jour réaudit — **partiel**

Routes désormais présentes dans le Swagger live (v0.4.0) :

| Route | Statut |
|-------|--------|
| `POST /v1/partners/{id}/fleet-pairs` | Exposée |
| `POST /v1/partners/{id}/drivers/{driverId}/documents` | Exposée |
| `POST /v1/partners/{id}/vehicles/{vehicleId}/documents` | Exposée |
| `GET /v1/uploads/buckets` | HTTP 200 — retourne `buckets` + `flow` |
| `POST /v1/kyc/documents` | Route listée |

**Toujours manquant** : aucun `multipart/form-data` ni `documentTypeCode` documenté dans OpenAPI → le wizard ne peut pas encore envoyer les fichiers de façon contractuelle.

### État front

| Élément | Statut |
|---------|--------|
| Collecte fichiers wizard (recto/verso) | OK |
| Extraction IA pré-remplissage | OK — `POST /api/document-extract` (Next.js → OpenRouter), **hors API UpJunoo** |
| Envoi KYC vers UpJunoo | **Non branché** — `createDriverWithDocumentsViaV1` : TODO explicite |
| Envoi pièces véhicule v1 | **Non branché** — `applyVehicleCreateFlow` : upload uniquement en mode legacy |
| Mode legacy | Envoie `{ type, filename }` sans binaire |

Fichiers concernés :

- `src/features/fleet/components/fleet-pair-wizard/FleetPairCreateWizard.tsx`
- `src/features/fleet/api/vehicleCreateFlow.ts`
- `src/features/fleet/api/partnerDrivers.v1.service.ts`
- `src/features/fleet/api/adminVehicles.service.ts`

### Besoin produit

Après création du binôme, les documents uploadés dans le wizard doivent être **stockés et visibles** dans :

- Fiche chauffeur → onglet KYC (`GET /v1/admin/kyc/documents`)
- Fiche véhicule → pièces / validation

---

### 1. Upload KYC chauffeur

**Route existante (à documenter + valider)** : `POST /v1/kyc/documents`

**Contrat demandé** :

```http
POST /v1/kyc/documents
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `documentTypeCode` | string | oui | Aligné sur `GET /v1/catalog/document-types?subject=DRIVER` |
| `side` | string | non | `RECTO` \| `VERSO` (CNI, permis) |
| `file` | binary | oui | `image/jpeg`, `image/png`, `application/pdf` |
| `driverId` | uuid | ? | **Requis si appel admin** (JWT admin agit pour le chauffeur) |

**Réponse cible (201)** :

```json
{
  "status": "created",
  "document": {
    "id": "uuid",
    "driverId": "uuid",
    "documentTypeCode": "CNI",
    "side": "RECTO",
    "fileUrl": "https://…",
    "status": "pending",
    "uploadedAt": "2026-06-10T12:00:00.000Z"
  }
}
```

**Correspondance codes front → API** (à confirmer) :

| Front (`driverDocuments`) | API (`documentTypeCode` suggéré) |
|---------------------------|----------------------------------|
| `cni` | `CNI` |
| `license` | `DRIVER_LICENSE` |
| `selfie` | `SELFIE` |

**Questions backend** :

1. Qui peut appeler la route ? JWT **chauffeur** seul, JWT **admin** + `driverId`, JWT **partenaire** + `driverId` ?
2. Recto/verso : **un fichier par requête** (2 appels CNI) ou un seul appel multi-fichiers ?
3. Table de correspondance exacte avec `GET /v1/catalog/document-types`.

---

### 2. Upload pièces véhicule

**Route à créer ou documenter** (absente du Swagger exploitable admin v1) :

```http
POST /v1/vehicles/{vehicleId}/documents
Authorization: Bearer <admin ou partner token>
Content-Type: multipart/form-data
```

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `documentTypeCode` | string | oui | ex. `REGISTRATION`, `INSURANCE`, `TECHNICAL_INSPECTION` |
| `side` | string | non | `RECTO` \| `VERSO` (carte grise) |
| `file` | binary | oui | image ou PDF |

**Réponse cible (201)** :

```json
{
  "status": "created",
  "document": {
    "id": "uuid",
    "vehicleId": "uuid",
    "documentTypeCode": "REGISTRATION",
    "side": "RECTO",
    "fileUrl": "https://…",
    "validationStatus": "pending",
    "uploadedAt": "2026-06-10T12:00:00.000Z"
  }
}
```

**Correspondance codes front → API** (à confirmer) :

| Front (`pieces`) | API (`documentTypeCode` suggéré) |
|------------------|----------------------------------|
| `registration` | `REGISTRATION` |
| `insurance` | `INSURANCE` |
| `technical_inspection` | `TECHNICAL_INSPECTION` |

**Alternative acceptable** : workflow en 2 temps — `POST /v1/files` (binaire) puis liaison `{ fileId, documentTypeCode, side }` sur le véhicule ou le chauffeur. Préciser le standard UpJunoo.

---

### 3. Séquence cible (création binôme admin)

```
1. POST /v1/vehicles                              → vehicleId
2. POST /v1/auth/driver/register                  → userId + session chauffeur (optionnel)
3. POST /v1/drivers/onboarding/start              → driverId
4. POST /v1/partners/{partnerId}/members          → liaison partenaire
5. POST /v1/kyc/documents  (× N fichiers)        → CNI recto, CNI verso, permis…, selfie
6. POST /v1/vehicles/{vehicleId}/documents (× M)  → carte grise, assurance…
7. POST /v1/vehicles/{vehicleId}/assign-driver
```

Le front enchaînera les étapes **5** et **6** automatiquement dès que le contrat est stable.

---

### 4. Critères d’acceptation

- [ ] Upload `multipart/form-data` fonctionnel en dev pour CNI recto + selfie chauffeur
- [ ] Documents visibles via `GET /v1/admin/kyc/documents` (filtre `driverId` ou équivalent)
- [ ] Pièces véhicule visibles sur `GET /v1/partners/{partnerId}/vehicles/{vehicleId}` (`documents[]` ou route dédiée)
- [ ] Swagger mis à jour : `requestBody` multipart + exemples curl
- [ ] **Admin peut uploader pour un chauffeur créé depuis le BO** (sans session chauffeur obligatoire)
- [ ] Codes `documentTypeCode` alignés avec `GET /v1/catalog/document-types`
- [ ] Taille max fichier + formats acceptés documentés

---

### 5. Exemples curl (à valider backend)

```bash
# KYC — CNI recto
curl -X POST "https://api.upjunoo-dev.tech/v1/kyc/documents" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "driverId=a66a8cde-5e87-47f1-a681-8eb6611be0e6" \
  -F "documentTypeCode=CNI" \
  -F "side=RECTO" \
  -F "file=@cni-recto.jpg"

# Pièce véhicule — carte grise recto
curl -X POST "https://api.upjunoo-dev.tech/v1/vehicles/{vehicleId}/documents" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "documentTypeCode=REGISTRATION" \
  -F "side=RECTO" \
  -F "file=@carte-grise-recto.jpg"
```

---

### Point bloquant front

Sans réponse sur **qui authentifie l’upload KYC en contexte admin** (token admin + `driverId` vs token chauffeur du `register`), le wizard ne peut pas persister les images côté UpJunoo.

Le message UI « pièces enregistrées » peut être **trompeur** tant que l’API n’est pas branchée.

### Ticket backend synthétique (copier-coller)

> **Titre** : Upload documents KYC + pièces véhicule — création binôme admin  
>  
> **Contexte** : Le wizard admin collecte CNI, permis, selfie, carte grise, etc. Aujourd’hui seuls `POST /v1/vehicles` et `POST /v1/auth/driver/register` partent en JSON — aucune image persistée. `POST /v1/kyc/documents` existe mais contrat non documenté ; pas de route v1 claire pour pièces véhicule.  
>  
> **Acceptance criteria** :
> 1. Contrat `multipart/form-data` pour `POST /v1/kyc/documents` (types, recto/verso, auth admin)
> 2. Route upload pièces véhicule (`POST /v1/vehicles/{id}/documents` ou workflow `POST /v1/files`)
> 3. Documents visibles admin KYC + fiche véhicule
> 4. Table correspondance `documentTypeCode` ↔ catalogue
> 5. Swagger + exemples curl à jour

---


---

## DR-PARTNER-SUGGEST-01 — Partenaire le plus éligible suggéré à la création chauffeur (binôme admin)

### Contexte produit

Lors de la **création d’un binôme chauffeur + véhicule** depuis l’admin (`FleetPairCreateWizard`, `/admin/fleet/pairs/create`), l’opérateur doit aujourd’hui **choisir manuellement** un partenaire dans une liste déroulante alimentée par `GET /v1/admin/partners` (ou contexte franchise).

```tsx
// FleetPairCreateWizard.tsx — variante admin
<option value="">— Choisir un partenaire —</option>
{props.partners.map((p) => (
  <option key={p.id} value={p.id}>{p.name} · {p.city}</option>
))}
```

**Problème UX** :

- Liste potentiellement longue (dizaines de partenaires multi-pays).
- Aucune indication de **quel partenaire est le plus adapté** pour rattacher un nouveau chauffeur.
- Risque d’erreur (mauvais partenaire, franchise incompatible, partenaire inactif ou non éligible).
- Ralentit le parcours alors que l’objectif produit est d’**assigner automatiquement le partenaire le plus éligible** quand l’admin crée un chauffeur sans choix explicite.

### Besoin

Le **backend** doit déterminer et exposer le **partenaire le plus éligible** pour la création d’un chauffeur, afin que le front puisse :

1. **Pré-sélectionner** ce partenaire à l’ouverture du wizard (meilleure expérience par défaut).
2. Afficher un **libellé explicite** (« Partenaire recommandé » + raison courte).
3. Permettre à l’admin de **changer** manuellement si besoin (le choix suggéré n’est pas bloquant).

### Critères d’éligibilité attendus (à formaliser côté API)

Le score / tri devrait tenir compte au minimum de :

| Critère | Exemple |
|---------|---------|
| Statut partenaire | `approved` / actif uniquement |
| Périmètre franchise | Aligné sur la franchise de l’admin connecté ou filtre carte / zone |
| Capacité flotte | Partenaire avec place pour un chauffeur supplémentaire (si règle métier) |
| Wallet / conformité | Partenaire sans blocage financier ou compliance |
| Proximité géographique | Même ville / zone que le véhicule ou l’admin (optionnel) |
| Activité récente | Préférer un partenaire opérationnel (courses récentes, chauffeurs actifs) |

→ La **règle exacte** est à définir par le backend ; le front consommera un résultat **déjà calculé**, pas de heuristique locale.

### Options d’exposition API (au choix backend)

**Option A — champ sur une route existante** (recommandée pour le wizard) :

```http
GET /v1/admin/partners?suggestedFor=driver_create&franchiseId={uuid}&cityId={uuid}
```

Réponse enrichie :

```json
{
  "status": "ok",
  "items": [ /* liste paginée habituelle */ ],
  "suggestedPartner": {
    "id": "82214755-93d3-4b64-9311-c1747ceacb96",
    "name": "AL BARAKAH",
    "city": "Abidjan",
    "eligibilityScore": 92,
    "reason": "Partenaire actif · même franchise · capacité flotte disponible"
  }
}
```

**Option B — route dédiée** :

```http
GET /v1/admin/partners/suggested?context=driver_create&franchiseId={uuid}
```

**Option C — enrichir `GET /v1/admin/filter-options`** :

Ajouter `filterOptions.suggestedPartnerForDriverCreate` pour réutiliser le même endpoint que les autres filtres admin.

**Option D — réponse création** :

Retourner `suggestedPartnerId` dans `POST /v1/partners/{id}/fleet-pairs` ou `POST /v1/drivers/onboarding/start` — utile en secours, moins pratique pour pré-remplir le formulaire **avant** soumission.

### Comportement front attendu dès livraison API

| Étape | Comportement |
|-------|--------------|
| Ouverture wizard admin | Appel suggestion → pré-remplissage `partnerId` |
| Affichage | Badge « Recommandé » + `reason` sous le sélecteur |
| Override admin | Changement manuel toujours possible ; trace `source: "manual" \| "suggested"` en interne |
| Échec suggestion | Fallback actuel : liste complète, aucune pré-sélection |

Fichiers front à brancher :

- `src/features/fleet/components/fleet-pair-wizard/FleetPairCreateWizard.tsx`
- Page hôte admin création binôme (chargement partenaires)
- `src/features/network/api/partners.service.ts` ou service dédié `suggestedPartner`

### Critères d’acceptation backend

- [ ] Endpoint documenté Swagger avec critères d’éligibilité décrits
- [ ] Un seul `suggestedPartner` stable par contexte (`driver_create` + filtres franchise/ville si fournis)
- [ ] Partenaire suggéré **toujours** dans la liste des partenaires éligibles (création ne doit pas échouer)
- [ ] Champ `reason` ou `reasonCode` + `reasonLabel` en français pour l’UI
- [ ] Si aucun partenaire éligible : réponse explicite `{ suggestedPartner: null, reason: "…" }` (pas d’erreur 500)
- [ ] Cohérence avec `POST /v1/partners/{id}/members` et flux binôme existant

### Ticket backend synthétique (copier-coller)

> **Titre** : Suggérer le partenaire le plus éligible à la création chauffeur (binôme admin)  
>  
> **Contexte** : Le wizard admin `FleetPairCreateWizard` impose aujourd’hui un choix manuel parmi tous les partenaires. Pour une meilleure UX, l’API doit renvoyer le partenaire **le plus éligible** à pré-sélectionner lors de l’ajout automatique d’un partenaire à la création d’un chauffeur.  
>  
> **Acceptance criteria** :
> 1. Exposer `suggestedPartner` (id, name, reason) sur `GET /v1/admin/partners` (query `suggestedFor=driver_create`) ou route dédiée
> 2. Règles d’éligibilité documentées (statut, franchise, capacité, compliance)
> 3. `reason` lisible en français pour le back-office
> 4. Swagger + exemple de réponse
> 5. Cas vide géré (`suggestedPartner: null`)

---


---

## FN-TRANS-LABELS-01 — Libellés franchise / partenaire sur transactions finance

### Contexte

Fiche détail transaction admin : `GET /v1/admin/finance/transactions/{id}`  
Page front : `/admin/finance/transactions/[id]` — `transactionsService.getById`.

L’API embarque désormais les objets `franchise`, `partner` et `wallet` (progrès vs **FN-TRANS-01** du 9 juin), mais les **libellés affichables sont incorrects** : le backend recopie l’**UUID** dans les champs `name` / `tradeName`.

### Exemple live (10 juin 2026)

```http
GET /v1/admin/finance/transactions/de90a3bc-2eb8-44c8-934e-0b0c7253520c
```

```json
{
  "status": "ok",
  "transaction": {
    "id": "de90a3bc-2eb8-44c8-934e-0b0c7253520c",
    "entry_type": "driver_earning",
    "amount_xof": 960,
    "franchise_id": "1bb2bff7-edcc-496d-a87a-4126c19be278",
    "franchise_name": null,
    "partner_id": "71a1aad7-ad23-41ca-a6d0-b904d5953271",
    "partner_name": null,
    "owner_name": "DEV-DRV-001",
    "franchise": {
      "id": "1bb2bff7-edcc-496d-a87a-4126c19be278",
      "name": "1bb2bff7-edcc-496d-a87a-4126c19be278"
    },
    "partner": {
      "id": "71a1aad7-ad23-41ca-a6d0-b904d5953271",
      "tradeName": "71a1aad7-ad23-41ca-a6d0-b904d5953271"
    },
    "wallet": {
      "ownerType": "driver",
      "owner": { "displayName": "DEV-DRV-001" }
    }
  }
}
```

### Problème

| Champ | Attendu | Reçu |
|-------|---------|------|
| `franchise.name` | `UPJUNOO Togo` (nom franchise) | **UUID** = `franchise.id` |
| `partner.tradeName` | `Nom commercial partenaire` | **UUID** = `partner.id` |
| `franchise_name` | Libellé plat (rétrocompat) | `null` |
| `partner_name` | Libellé plat | `null` |

→ L’UI affichait l’UUID en colonne Franchise / Partenaire (illisible).

### Contournement front (livré)

`adminFinance.mapper.ts` : ignore tout libellé égal à un UUID (`resolveEntityDisplayName`) — affiche « — » en attendant la correction API.

### Demande backend

1. Joindre les **vrais libellés** depuis les tables `franchises` / `partners` :
   - `franchise.name` = nom franchise (ex. `UPJUNOO Togo`)
   - `partner.tradeName` = nom commercial (ex. `TOGO EXPRESS`)
2. Remplir aussi les champs plats `franchise_name` et `partner_name` (rétrocompat liste).
3. Appliquer sur **liste** `GET /v1/admin/finance/transactions` **et** **détail** `GET /v1/admin/finance/transactions/{id}`.
4. Règle : `name` / `tradeName` **ne doivent jamais** être identiques à `id` sauf donnée réellement absente (alors omettre ou `null`).

### Ticket backend synthétique

> **Titre** : Libellés franchise / partenaire sur transactions finance (pas d’UUID dans `name`)  
>  
> **Contexte** : Détail transaction `de90a3bc-…` — `franchise.name` et `partner.tradeName` contiennent l’UUID au lieu du nom. `franchise_name` / `partner_name` null.  
>  
> **Acceptance criteria** :
> 1. `franchise.name` et `partner.tradeName` = libellés métier lisibles
> 2. `franchise_name` / `partner_name` peuplés en liste + détail
> 3. Jointure SQL correcte sur `franchise_id` / `partner_id`
> 4. Swagger mis à jour

---


---

## PA-DOC-01 — Documents société partenaire (RCCM)

### Problème

Le catalogue impose un **registre de commerce** pour les partenaires, mais aucune route ne permet de le déposer au niveau **société**.

### Exemple catalogue

```http
GET /v1/catalog/document-types?subject=PARTNER
```

```json
{
  "code": "BUSINESS_REGISTRATION",
  "label": "Registre de commerce",
  "subject": "PARTNER",
  "required": true
}
```

### Constat routes

| Route | Statut |
|-------|--------|
| `POST /v1/partners/{id}/documents` | **404** |
| `POST /v1/partners/{id}/drivers/{driverId}/documents` | Existe — docs **chauffeur** uniquement |
| `POST /v1/partners/{id}/vehicles/{vehicleId}/documents` | Existe — docs **véhicule** uniquement |

**Ce que tu vois** : partenaire créé sans dossier société, pas d’upload RCCM, pas de badge « dossier incomplet ».

### Demande backend

1. `POST /v1/partners/{id}/documents` (multipart ou `{ documentTypeCode, fileId }`).
2. `GET /v1/partners/{id}/documents` — liste pièces société + statut validation.
3. Enrichir `GET /v1/admin/partners` et `GET /v1/partners/{id}` avec `documentsSummary` (`missingTypes: ["BUSINESS_REGISTRATION"]`).
4. Workflow validation admin (`approve` / `reject` document société).

### Ticket backend synthétique

> **Titre** : Upload et suivi documents société partenaire (RCCM)  
> **Acceptance** : POST + GET documents partenaire · `documentsSummary` en liste/détail · alignement catalogue `BUSINESS_REGISTRATION`

---


---

## PA-01 / PA-02 — `franchiseName` & `cityLabel` sur liste partenaires

### Problème

`GET /v1/admin/partners` renvoie des partenaires avec `franchise_id` / `city_id` renseignés, mais les **libellés affichables** sont absents.

### Exemple audit (dev)

```json
{
  "id": "89a9da23-ad4b-4938-8206-2d0a61c3f556",
  "tradeName": "TOGO EXPRESS",
  "franchiseId": "82781966-5ca5-4a67-9147-1a6dd245e31d",
  "cityId": "699c9300-09c3-4d22-b787-ca7d81e4433f",
  "franchiseName": null,
  "cityLabel": null
}
```

**Ce que tu vois** : colonnes Franchise et Ville affichent « — » sur `/admin/network/partners`, alors que le partenaire est bien rattaché en base.

**Contournement front actuel** : résolution partielle via cache catalogue (`catalogLookup.service.ts`) — N requêtes, fragile hors liste paginée.

### Demande backend

Joindre sur chaque item de `GET /v1/admin/partners` :

```json
{
  "franchiseName": "UPJUNOO Togo",
  "cityLabel": "Lomé",
  "franchise": { "id": "…", "name": "UPJUNOO Togo" },
  "city": { "id": "…", "label": "Lomé" }
}
```

### Ticket backend synthétique

> **Titre** : Peupler `franchiseName` et `cityLabel` sur liste partenaires admin  
> **Acceptance** : libellés non null quand `franchise_id` / `city_id` présents · objets embarqués optionnels · Swagger mis à jour

---


---

## FN-TRANS-01 — Transactions finance : filtres + enrichissement liste

> Complément de **FN-TRANS-LABELS-01** (libellés UUID corrigés séparément).

### Problème

Page `/admin/finance/transactions` — liste OK (240 mouvements) mais **pas de filtre franchise/partenaire** et champs plats souvent `null`.

### Exemple item (9 juin 2026)

```json
{
  "id": "9646332c-ce24-4892-9afd-8f657f802f81",
  "entry_type": "ride_commission",
  "amount_xof": 930,
  "franchise_name": null,
  "owner_name": "DEV-DRV-001",
  "order_id": "b090fb1f-520c-4b77-8053-91d18e0ad1b0"
}
```

**Ce que tu vois** : colonne Franchise « — », impossibilité de filtrer « tout ce qui concerne UPJUNOO Togo » ou un partenaire précis.

### Demande backend

**Filtres query** sur `GET /v1/admin/finance/transactions` :

| Paramètre | Usage |
|-----------|--------|
| `franchiseId` | Mouvements liés à une franchise |
| `partnerId` | Mouvements liés à un partenaire |
| `entryType` / `direction` | Type et sens |
| `orderId` | Mouvements d’une course |
| `from` / `to` | Plage de dates |

**`filterOptions`** en réponse :

```json
{
  "filterOptions": {
    "franchises": [{ "id": "…", "name": "UPJUNOO Togo" }],
    "partners": [{ "id": "…", "name": "TOGO EXPRESS" }]
  }
}
```

Enrichir chaque item avec objets `franchise`, `partner`, `wallet.owner` (voir aussi FN-TRANS-LABELS-01 pour les libellés).

### Ticket backend synthétique

> **Titre** : Filtres franchise/partenaire + `filterOptions` sur transactions finance admin  
> **Acceptance** : query `franchiseId` / `partnerId` fonctionnels · `filterOptions` en réponse · `franchise_name` / `partner_name` peuplés (pas UUID)

---


---

## OR-TRACK-01 — Suivi dynamique trajectoire chauffeur

### Problème

Sur la fiche course, la carte trace une **ligne droite** pickup → destination. Un seul point GPS temps réel — pas de distinction « en route vers le client » vs « client à bord vers destination ».

### Exemple API actuel

```json
{
  "location": {
    "latitude": 5.316463,
    "longitude": -4.013689,
    "metadata": { "routeProgress": 0.705, "segmentIndex": 2 }
  }
}
```

**Manque** : `navigationPhase` (`to_pickup` | `at_pickup` | `to_dropoff` | `completed`), historique `trajectory[]`, `order.tracking` non vide sur `GET /v1/admin/orders/{id}`.

**Ce que tu vois** : segment droit sur `TripRoutePreview` — pas le chemin réellement parcouru par le véhicule.

### Demande backend

1. `navigationPhase` + `navigationPhaseLabel` + `target` + `etaSeconds` sur `GET /v1/locations/orders/{serviceType}/{orderId}`.
2. `GET /v1/locations/orders/{serviceType}/{orderId}/trajectory` — points GPS par phase.
3. `GET /v1/admin/orders/{id}` — `order.tracking` complet (non vide).
4. WebSocket : `order.tracking.update` + `order.navigation.phase_changed`.
5. Corriger `GET /v1/orders/{serviceType}/{orderId}/tracking` (404 en dev).

### Ticket backend synthétique

> **Titre** : Trajectoire course — phases pickup/dropoff + historique GPS  
> **Acceptance** : `navigationPhase` stable · route trajectory · tracking admin rempli · WS phase_changed

Fichiers front : `TripRoutePreview.tsx`, `useTripDriverLiveLocation.ts`, `liveMap.mapper.ts`.

---


---

## MK-BAN-01 — Bannières marketing (image + création admin)

### Problème

Les bannières sont des **images** sur l’app mobile client. Le formulaire admin (`/admin/marketing/banners/new`) n’a **pas de champ image** et le POST échoue.

### Exemple live (9 juin 2026)

```http
POST /v1/admin/marketing/banners
Body: { "title": "Promo été", "placement": "home_hero", "status": "draft" }
→ HTTP 400 MARKETING_BANNER_CREATE_FAILED
   "Could not find the 'code' column of 'app_banners' in the schema cache"
```

| Route | Résultat |
|-------|----------|
| `GET /v1/admin/marketing/banners` | **200** — liste OK |
| `POST /v1/admin/marketing/banners` | **400** — schéma DB cassé |
| Upload image (`…/banners/upload`, `/v1/media/upload`) | **404** |

**Ce que tu vois** : formulaire sans upload, création impossible même sans image.

### Demande backend

1. Corriger table/ORM `app_banners` (colonne `code`).
2. Documenter POST : champs obligatoires + **`image_url`** (ou upload multipart).
3. Exposer upload fichier si nécessaire (`POST /v1/admin/marketing/banners/upload`).
4. Enrichir GET liste avec `image_url` pour miniature admin + app client (`GET /v1/app-banners`).

### Ticket backend synthétique

> **Titre** : Bannières marketing — corriger POST + upload image app client  
> **Acceptance** : POST sans erreur `app_banners.code` · champ image documenté · `image_url` en GET liste

Fichiers front : `MarketingBannerNewPage.tsx`, `marketing.service.ts`.

---


---

## FLT-VEHICLE-DETAIL-01 — Objet `color` sur détail véhicule

### Contexte

Fiche véhicule admin / partenaire : le champ `color_id` (UUID) est parfois renseigné sans objet `color` exploitable (`label`, `code`, `hex`).

### Route concernée

```http
GET /v1/partners/{partnerId}/vehicles/{vehicleId}
Authorization: Bearer {token}
```

### Demande

Embarquer l’objet catalogue (aligné `GET /v1/catalog/vehicle-colors`) :

```json
{
  "vehicle": {
    "id": "…",
    "plate_number": "AB-123-CD",
    "color_id": "0f7fbeef-d532-468e-9dbc-0fc8d9ec27be",
    "color": {
      "id": "0f7fbeef-d532-468e-9dbc-0fc8d9ec27be",
      "code": "RED",
      "label": "Rouge",
      "hex": "#CC0000"
    }
  }
}
```

### Ticket backend synthétique

> **Titre** : Joindre `color { id, code, label, hex }` sur le détail véhicule  
> **Acceptance** : présent quand `color_id` renseigné · Swagger mis à jour · pas de régression `documents[]`

---


---

## DR-AVAIL-01 — Actions compte & disponibilité chauffeur admin

### Contexte

Le front admin expose désormais : mise en ligne / hors ligne, suspension et réactivation (liste bulk + fiche détail).
Swagger **v0.4.0** ne documente pas de routes dédiées ; le front utilise `PATCH /v1/admin/drivers/{id}` avec
`account_status`, `approval_status`, `availability_status`.

### Demande backend

| Action | Route suggérée |
|--------|----------------|
| Suspendre | `POST /v1/admin/drivers/{id}/suspend` |
| Réactiver | `POST /v1/admin/drivers/{id}/activate` |
| Disponibilité | `PATCH /v1/admin/drivers/{id}/availability` body `{ "status": "online" \| "offline" }` |

Documenter les champs acceptés sur le `PATCH` existant en attendant.

Fichiers front : `driverAdminActions.service.ts`, `DriversListPage.tsx`, `DriverDetailPage.tsx`.

---


---

## SWAGGER-DOC-01 — Documentation OpenAPI manquante

### Contexte

OpenAPI live **v0.4.0** (531 paths) — nombreuses routes **sans** `parameters` ni schémas de réponse documentés.

### Priorités documentation

| Route / sujet | À documenter |
|---------------|--------------|
| `GET /v1/admin/live-map` | Champs `vehicleColorCode`, `meta.withRecentLocation`, `stats` vs snapshot |
| `GET /v1/admin/drivers` | Query `account_status`, `availability`, `zone`, `search` |
| `POST /v1/kyc/documents` | `multipart/form-data`, `documentTypeCode`, `side`, auth admin |
| `POST /v1/partners/{id}/vehicles/{vehicleId}/documents` | Idem multipart |
| `GET /v1/admin/partners` | Futur `suggestedPartner` (DR-PARTNER-SUGGEST-01) |
| `GET /v1/admin/finance/transactions/{id}` | `franchise.name`, `partner.tradeName` (FN-TRANS-LABELS-01) |
| Réponses franchise | `partnersCount`, `driversCount` |

### Ticket backend synthétique

> **Titre** : Compléter Swagger v0.4.0 — params query + requestBody multipart + schémas réponse admin

---

---

## IMG-01 — Images seed Supabase inaccessibles

### Contexte

Certaines URLs `file_url` KYC (seed Supabase) renvoient **HTTP 400** alors que l'API les expose.

### Réaudit 10/06/2026

- Audit `audit-backend-demandes.mjs` : **manquant** (profile-photo.jpg inaccessible)
- Bloque l'aperçu documents en dev pour certains seeds

### Ticket backend synthétique

> **Titre** : Corriger URLs seed KYC Supabase ou régénérer fichiers publics  
> **Acceptance** : `file_url` accessibles en HTTPS 200 pour documents seed


---

## Références

Voir [DEMANDES-2026-06-10.md](./DEMANDES-2026-06-10.md) § Références.
