# Backend — APIs support a implementer

**Date :** 2026-06-22
**Destinataire :** Dev Backend
**Note :** Toutes les routes existantes (`GET /v1/support/tickets`, dashboard, chat, audit-log) ont ete verifiees en live le 2026-06-22 et fonctionnent correctement. Ce document liste uniquement ce qui reste a faire.

---

## Ce qui reste a implementer

| # | Priorite | Type | Travail |
|---|----------|------|---------|
| 1 | 🔴 Urgent | 🆕 Creer | `POST /v1/support/tickets/:id/compensations/:compId/cancel` |
| 2 | 🔴 Urgent | 🔧 Modifier | `POST /v1/support/tickets/:id/compensations` — accepter `expires_at` |
| 3 | 🔴 Urgent | 🔧 Modifier | `GET /v1/support/tickets/:id` — retourner `expires_at` + `cancelled_at` sur les compensations |
| 4 | 🔴 Urgent | 🔧 Corriger | `POST /v1/support/tickets` — codes d'erreur distincts par champ |
| 5 | 🔴 Urgent | 🆕 Creer | API Litiges — `POST/GET /v1/disputes` + detail + assign/message/resolve/close/**escalate** + events Socket.IO (`dispute:message`, `dispute:updated`) |
| 6 | 🟡 Important | 🆕 Creer | `POST /v1/auth/devices` — enregistrer token push mobile |
| 7 | 🟡 Important | 🆕 Creer | Logique push notifications FCM/APNs |
| 8 | 🟢 Expansion | 🆕 Creer | **Assistant IA RAG** — reponse automatique avant prise en charge par un agent |

---

## 1. 🆕 Annuler un geste commercial

```
POST /v1/support/tickets/:id/compensations/:compId/cancel
```

**Auth :** Agent support assigne au ticket.

**Body :** vide `{}`.

**Logique :**
1. Verifier que le ticket existe et que l'agent est assigne
2. Verifier que `compId` appartient au ticket
3. Verifier que `cancelled_at` est null (pas deja annule)
4. Mettre `cancelled_at = NOW()` sur la compensation
5. Invalider le code promo dans le systeme de promotion
6. Ajouter entree audit log : `category: "compensation"`, `action: "compensation.cancelled"`

**Reponse 200 :**
```json
{ "ok": true }
```

**Erreurs :**

| Code | Erreur | Cas |
|------|--------|-----|
| `404` | `TICKET_NOT_FOUND` | Ticket inexistant |
| `404` | `COMPENSATION_NOT_FOUND` | `compId` inexistant ou n'appartient pas au ticket |
| `409` | `COMPENSATION_ALREADY_CANCELLED` | Deja annule |
| `403` | `FORBIDDEN` | Agent non assigne au ticket |

---

## 2. 🔧 Ajouter `expires_at` a la creation de compensation

```
POST /v1/support/tickets/:id/compensations
```

**Ajout au body :** champ `expires_at` optionnel.

**Body apres modification :**
```json
{
  "type": "fixed_discount",
  "discount_value": 2000,
  "expires_at": "2026-07-15T23:59:59Z"
}
```

**Validation `expires_at` :** ISO 8601, doit etre dans le futur. Si absent : pas de date limite.

**Schema de reponse attendu (retourner ces champs systematiquement) :**
```json
{
  "id": "comp_abc123",
  "type": "fixed_discount",
  "discount_value": 2000,
  "promo_code": "PROMO-KR72XA",
  "expires_at": "2026-07-15T23:59:59Z",
  "cancelled_at": null,
  "created_at": "2026-06-22T13:00:00Z",
  "created_by": "Aya Kone"
}
```

> `cancelled_at` doit etre present (`null` par defaut) — le backoffice en a besoin pour detecter l'annulation.

---

## 3. 🔧 Retourner `expires_at` et `cancelled_at` sur les compensations

Partout ou des compensations sont retournees (`GET /v1/support/tickets/:id`, etc.), le schema doit inclure ces deux champs.

**Avant (insuffisant) :**
```json
{ "id": "...", "type": "fixed_discount", "discount_value": 2000, "promo_code": "...", "created_at": "...", "created_by": "..." }
```

**Apres :**
```json
{ "id": "...", "type": "fixed_discount", "discount_value": 2000, "promo_code": "...", "expires_at": null, "cancelled_at": null, "created_at": "...", "created_by": "..." }
```

---

## 4. 🔧 Codes d'erreur distincts sur la creation de ticket

```
POST /v1/support/tickets
```

**Probleme :** Actuellement, `category` manquant, `category` invalide et `subject` manquant retournent tous le meme code `SUPPORT_DESCRIPTION_REQUIRED`. Le mobile ne peut pas afficher le bon message sous le bon champ.

**Comportement attendu :**

| Cause | Code HTTP | Code erreur |
|-------|-----------|-------------|
| `category` absent ou null | `422` | `CATEGORY_REQUIRED` |
| `category` valeur invalide | `422` | `CATEGORY_INVALID` |
| `subject` absent ou vide | `422` | `SUBJECT_REQUIRED` |

---

## 5. 🆕 Enregistrer le token push mobile

```
POST /v1/auth/devices
```

**Auth :** Utilisateur connecte (client, chauffeur, livreur).

**Body :**
```json
{
  "push_token": "ExponentPushToken[xxxxxx]",
  "platform": "ios"
}
```

| Champ | Requis | Valeurs |
|-------|--------|---------|
| `push_token` | Oui | Token Expo / FCM / APNs |
| `platform` | Oui | `ios` ou `android` |

**Logique :** Stocker ou mettre a jour le token pour l'utilisateur. Gerer plusieurs devices par utilisateur (ancien + nouveau telephone).

**Reponse 200 :**
```json
{ "ok": true }
```

---

## 6. 🆕 Push notifications FCM / APNs — logique interne

Pas un endpoint expose, mais une logique a implementer dans le service de messagerie.

**Pre-requis :** Token push disponible via `POST /v1/auth/devices` (voir #5).

**Declencheurs et contenu :**

| Evenement backend | Message push | Payload data |
|------------------|-------------|--------------|
| Agent envoie un `message` | "Reponse de notre equipe support" + apercu | `{ type: "support_message", ticket_id, chat_id, message_preview }` |
| `PATCH .../resolve` | "Votre reclamation a ete resolue" | `{ type: "ticket_resolved", ticket_id }` |
| `POST .../escalate` | "Votre reclamation est en cours de traitement" | `{ type: "ticket_escalated", ticket_id }` |
| `POST .../compensations` | "Un geste commercial vous a ete accorde — code : {promo_code}" | `{ type: "compensation_applied", ticket_id, promo_code }` |

**Integration :**
1. Firebase Admin SDK (recommande) : `admin.messaging().send({ token, data, notification })`
2. Pour iOS : configurer APNs dans Firebase Console

---

---

## 7. 🆕 API Litiges (disputes) — module separe

Les litiges soumis depuis l'app mobile client ne passent pas par `/v1/support/tickets`. Ils ont leur propre domaine pour pouvoir etre traites separement dans le backoffice (liste, detail, workflow propre).

### Endpoints a creer

| Methode | Route | Description | Auth |
|---------|-------|-------------|------|
| `POST` | `/v1/disputes` | Creer un litige (mobile client) | Utilisateur connecte |
| `GET` | `/v1/disputes` | Lister les litiges (backoffice) | Agent support / Admin |
| `GET` | `/v1/disputes/:id` | Detail d'un litige (backoffice) | Agent support / Admin |
| `PATCH` | `/v1/disputes/:id/assign` | S'assigner le litige | Agent support |
| `PATCH` | `/v1/disputes/:id/resolve` | Marquer comme resolu | Agent support |
| `PATCH` | `/v1/disputes/:id/close` | Cloturer | Agent support |
| `PATCH` | `/v1/disputes/:id/escalate` | Escalader au niveau superieur | Agent support |
| `POST` | `/v1/disputes/:id/messages` | Echanger avec le client | Agent support |

---

### `POST /v1/disputes` — creation depuis le mobile

**Body :**
```json
{
  "category": "payment",
  "subject": "Double debit sur ma course",
  "description": "J'ai ete debite deux fois pour la meme course.",
  "trip_id": "trip_abc123"
}
```

| Champ | Requis | Valeurs | Note |
|-------|--------|---------|------|
| `category` | Oui | `payment`, `behavior`, `service`, `logistics`, `app`, `other` | Valeur technique, jamais le libelle |
| `subject` | Oui | string | Texte saisi par l'utilisateur |
| `description` | Non | string | Detail optionnel |
| `trip_id` | Non | string | Present si le litige est lie a une course precise |

**Reponse 201 :**
```json
{
  "id": "dispute_xyz",
  "status": "open",
  "category": "payment",
  "subject": "Double debit sur ma course",
  "created_at": "2026-06-22T14:00:00Z"
}
```

**Erreurs :**

| Code | Erreur | Cas |
|------|--------|-----|
| `422` | `CATEGORY_REQUIRED` | `category` absent ou null |
| `422` | `CATEGORY_INVALID` | Valeur de `category` non reconnue |
| `422` | `SUBJECT_REQUIRED` | `subject` absent ou vide |

---

### `GET /v1/disputes` — liste backoffice

**Query params :**

| Param | Type | Valeurs |
|-------|------|---------|
| `status` | string | `open`, `in_progress`, `resolved`, `closed`, `escalated` |
| `category` | string | `payment`, `behavior`, `service`, `logistics`, `app`, `other` |
| `search` | string | Recherche sur le sujet ou le nom du declarant |
| `page` | number | Debut a 1 |
| `per_page` | number | Defaut : 20 |

**Schema de reponse :**
```json
{
  "data": [
    {
      "id": "DSP-001",
      "subject": "Double debit sur ma course",
      "category": "payment",
      "status": "open",
      "reporter_name": "Kouame Koffi",
      "reporter_phone": "+225 07 12 34 56",
      "trip_id": "trip_abc",
      "trip_ref": "TR-88421",
      "assigned_to": null,
      "assigned_to_id": null,
      "created_at": "2026-06-22T14:00:00Z",
      "updated_at": "2026-06-22T14:00:00Z"
    }
  ],
  "meta": { "total": 42, "current_page": 1, "per_page": 20, "last_page": 3 }
}
```

---

### `GET /v1/disputes/:id` — detail

**Reponse 200 :** Tous les champs de la liste + tableau `messages`.

```json
{
  "id": "DSP-001",
  "subject": "Double debit sur ma course",
  "description": "J'ai ete debite deux fois pour la meme course.",
  "category": "payment",
  "status": "open",
  "reporter_name": "Kouame Koffi",
  "reporter_phone": "+225 07 12 34 56",
  "trip_id": "trip_abc",
  "trip_ref": "TR-88421",
  "assigned_to": null,
  "assigned_to_id": null,
  "created_at": "2026-06-22T14:00:00Z",
  "updated_at": "2026-06-22T14:00:00Z",
  "messages": [
    {
      "id": "msg_001",
      "sender": "system",
      "sender_name": "Systeme",
      "content": "Litige ouvert via l'application mobile.",
      "created_at": "2026-06-22T14:00:00Z"
    },
    {
      "id": "msg_002",
      "sender": "user",
      "sender_name": "Kouame Koffi",
      "content": "Pouvez-vous me rembourser ?",
      "created_at": "2026-06-22T14:05:00Z"
    }
  ]
}
```

Valeurs `sender` : `"system"` | `"user"` | `"agent"` | `"ai"` (assistant IA — voir #8).

---

### `PATCH /v1/disputes/:id/assign`

**Auth :** Agent support.
**Body :** aucun.

**Logique :**
1. Assigne l'agent authentifie (`assigned_to_id`, `assigned_to`).
2. Passe `status` de `open` a `in_progress`.
3. **Desactive l'assistant IA** sur ce litige (il ne repond plus, voir #8).
4. Ajoute un message systeme : _« {agent} a pris en charge le litige. »_
5. **Envoie automatiquement un message d'accueil predefini** de la part de l'agent (`sender: "agent"`) — c'est ce qui marque le passage robot → humain cote client.

**Message d'accueil automatique (template) :**
```
Bonjour {reporter_name}, je suis {agent_name} de l'equipe support Up Junoo.
Je prends en charge votre demande. Pouvez-vous m'en dire un peu plus sur ce
qui s'est passe afin que je puisse vous aider au mieux ?
```

> Ce message doit etre pousse au client comme un message agent normal (socket + push). Le client voit ainsi immediatement qu'un humain a pris le relais.

**Reponse 200 :** Objet `DisputeDetail` complet mis a jour (incluant le message systeme **et** le message d'accueil dans `messages`).

---

### `POST /v1/disputes/:id/messages`

**Auth :** Agent support assigne.

**Body :**
```json
{ "content": "Nous avons bien recu votre signalement." }
```

**Reponse 201 :**
```json
{
  "id": "msg_003",
  "sender": "agent",
  "sender_name": "Aya Kone Support",
  "content": "Nous avons bien recu votre signalement.",
  "created_at": "2026-06-22T15:00:00Z"
}
```

**Erreur :** `422 CONTENT_REQUIRED` si `content` vide.

---

### `PATCH /v1/disputes/:id/resolve` et `PATCH /v1/disputes/:id/close`

**Auth :** Agent support assigne.
**Body :** aucun.
**Logique :** Passe le statut en `resolved` ou `closed` (terminal). Ajoute un message systeme. Aucune mutation possible apres.
**Reponse 200 :** `{ "ok": true }`

---

### `PATCH /v1/disputes/:id/escalate`

**Auth :** Agent support (assignation **non requise** — un agent peut escalader un litige qu'il ne prend pas en charge s'il depasse son niveau).
**Body :** aucun.
**Logique :** Passe le statut en `escalated` (terminal pour le support N1). Le litige sort de la file de premier niveau et est transmis a une equipe superieure. Ajoute un message systeme.
**Reponse 200 :** `{ "ok": true }`

---

### Machine d'etat des litiges

```
open  ──► assign   ──► in_progress ──► resolve  ──► resolved   (terminal)
      │                            └─► close    ──► closed     (terminal)
      └──────────────────────────────► escalate ──► escalated  (terminal N1)
```

> `escalate` est accessible depuis `open` (sans assignation) **et** depuis `in_progress`.

---

### Temps reel — Socket.IO (litiges)

> ⚠️ Point souleve par le dev mobile : le contrat ne nommait pas les events socket. Voici les noms a implementer. **S'aligner sur la convention existante du chat support** (`chat:message` / `ticket:updated`, room `user:{userId}`, join via `emit("join", userId)`).

**Connexion / room :**
```
socket.emit("join", userId)   // le client rejoint sa room "user:{userId}"
```

**Events emis par le backend :**

| Event | Payload | Quand |
|-------|---------|-------|
| `dispute:message` | `{ disputeId, message }` | Tout nouveau message sur le litige (sender `user` / `agent` / `ai` / `system`) |
| `dispute:updated` | `{ disputeId, status, assignedToId, assignedToName, updatedAt }` | Assignation, resolution, cloture, escalade |

`message` suit le schema de `GET /v1/disputes/:id` → `messages[]` (avec `sender`, `sender_name`, `content`, `created_at`, + `ai_confidence` / `ai_sources` si `sender: "ai"`).

**Important :**
- **Pas d'event `dispute:ai-reply` separe.** La reponse de l'assistant IA arrive via `dispute:message` avec `message.sender === "ai"`. Le mobile filtre sur le sender — un seul event a ecouter.
- Le message d'accueil automatique de l'agent (a l'assignation) part aussi via `dispute:message` (`sender: "agent"`), suivi d'un `dispute:updated` (`status: "in_progress"`).
- Le mobile filtre par `disputeId`. Un polling de secours (3 s) cote mobile reste recommande en filet tant que la fiabilite socket n'est pas validee.

---

## 8. 🆕 Assistant IA RAG — premiere ligne avant prise en charge

### Objectif

Quand un client ouvre un litige (ou une reclamation) et qu'**aucun agent n'est encore assigne**, un assistant IA repond automatiquement pour :
- accuser reception immediatement (ne pas laisser le client sans reponse),
- repondre aux questions simples a partir d'une base de connaissances (RAG),
- recolter des informations utiles a l'agent.

Des qu'un agent s'assigne le litige, **l'IA se desactive** et l'humain prend la main. Les messages IA restent visibles dans le fil (cote client et cote agent).

### Principe RAG

```
message client
   │
   ▼
[1] Recherche semantique dans la base de connaissances (embeddings)
       — FAQ, politiques de remboursement, conditions d'annulation, regles tarifaires
   │
   ▼
[2] Construction du prompt :
       contexte course (trip_id → montant, statut, chauffeur)
       + extraits pertinents de la base
       + historique du fil
   │
   ▼
[3] Appel LLM (Claude recommande : claude-sonnet)
   │
   ▼
[4] Reponse stockee comme message `sender: "ai"` + push au client
```

### Endpoints

| Methode | Route | Description | Declencheur |
|---------|-------|-------------|-------------|
| (auto) | — | Generer une reponse IA | A la creation du litige et a chaque message client tant que `assigned_to_id` est null |
| `POST` | `/v1/disputes/:id/ai-reply` | Forcer une reponse IA (debug/admin) | Manuel |
| `POST` | `/v1/support/kb/documents` | Ingerer un document dans la base de connaissances | Admin |
| `GET` | `/v1/support/kb/documents` | Lister les documents de la base | Admin |

### Declenchement automatique

L'IA repond automatiquement quand **toutes** ces conditions sont vraies :
1. `assigned_to_id` est `null` (aucun agent n'a pris la main)
2. le statut est `open`
3. le dernier message provient du client (`sender: "user"`)

Des qu'un agent s'assigne (`assigned_to_id` non null) → l'IA ne repond plus, meme si le client ecrit a nouveau. L'assignation declenche en plus l'envoi automatique du **message d'accueil de l'agent** (voir `PATCH /v1/disputes/:id/assign`) qui signale au client le passage robot → humain.

### Message IA — schema

```json
{
  "id": "msg_ai_001",
  "sender": "ai",
  "sender_name": "Assistant IA",
  "content": "Bonjour, je suis l'assistant Up Junoo. En attendant qu'un agent prenne en charge votre litige, je peux deja verifier...",
  "ai_confidence": 0.82,
  "ai_sources": ["kb_remboursement_double_debit", "trip_TR-88421"],
  "created_at": "2026-06-22T14:01:00Z"
}
```

| Champ | Description |
|-------|-------------|
| `sender` | Toujours `"ai"` |
| `ai_confidence` | Score 0–1 — sous un seuil (ex. 0.5), l'IA dit qu'un agent va prendre le relais plutot que d'inventer |
| `ai_sources` | IDs des documents/ressources utilises (tracabilite, anti-hallucination) |

### Garde-fous (obligatoires)

- **Ne jamais** promettre un remboursement, un geste commercial ou une sanction — ce sont des decisions d'agent.
- Sous le seuil de confiance, repondre : _« Je transmets votre demande a un agent qui vous repondra rapidement. »_
- Toujours grounded sur `ai_sources` — si aucune source pertinente, ne pas inventer.
- L'IA n'a **aucun** droit de mutation (pas d'assign, resolve, close, compensation).

### Base de connaissances initiale (a ingerer)

| Document | Contenu |
|----------|---------|
| `kb_double_debit` | Procedure en cas de double debit |
| `kb_annulation` | Conditions d'annulation et frais |
| `kb_objet_oublie` | Que faire en cas d'objet oublie |
| `kb_comportement_chauffeur` | Process de signalement chauffeur |
| `kb_delais_remboursement` | Delais et modalites de remboursement |
| `kb_livraison` | Colis endommage / non livre |

### Audit

Chaque reponse IA produit une entree audit : `category: "ai"`, `action: "ai.replied"`, avec `ai_confidence` et `ai_sources` en metadata.

---

## Schemas de reference

### Compensation (schema complet attendu)

```json
{
  "id": "comp_xyz",
  "type": "fixed_discount",
  "discount_value": 2000,
  "promo_code": "PROMO-KR72XA",
  "expires_at": "2026-07-15T23:59:59Z",
  "cancelled_at": null,
  "created_at": "2026-06-22T13:00:00Z",
  "created_by": "Aya Kone"
}
```

| `type` | `discount_value` | Description |
|--------|-----------------|-------------|
| `percentage_discount` | % (1–100) | Reduction en pourcentage |
| `fixed_discount` | Montant FCFA | Reduction fixe |
| `free_service` | absent | Prochain service offert |

### Audit log — entrees attendues

| Action | `category` | `action` |
|--------|-----------|----------|
| Ticket assigne | `ticket` | `ticket.assigned` |
| Message envoye | `ticket` | `ticket.message_sent` |
| Note interne | `ticket` | `ticket.note_added` |
| Sanction appliquee | `sanction` | `sanction.applied` |
| Compensation appliquee | `compensation` | `compensation.applied` |
| Compensation annulee | `compensation` | `compensation.cancelled` |
| Ticket resolu | `ticket` | `ticket.resolved` |
| Ticket cloture | `ticket` | `ticket.closed` |
| Ticket escalade | `escalation` | `ticket.escalated` |
| Litige escalade | `escalation` | `dispute.escalated` |
| Reponse assistant IA | `ai` | `ai.replied` |
