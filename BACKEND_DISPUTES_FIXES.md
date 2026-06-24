# Litiges & Chat support — écarts API / temps réel à corriger (backend)

> Contexte : le frontend support (`/support/disputes/:id` et `/support/tickets`) ne
> peut pas afficher correctement les conversations car les réponses réelles ne
> correspondent pas au contrat documenté dans `BACKEND_SUPPORT_API.md`
> (§ `GET /v1/disputes/:id` ligne 278, et § temps réel chat/litiges).
> Observé en prod-dev le 2026-06-22 sur `https://api.upjunoo-dev.tech`.
>
> **Résumé :** Bugs 1–3 = litiges, Bug 4 = chat tickets. Checklist consolidée en fin de document.
>
> **À partager aussi avec le dev mobile** — points qui le concernent directement :
> - **Bug 3** : événements socket litiges (`dispute:message` / `dispute:updated`),
>   room `user:{userId}`, join via `emit("join", userId)` — même convention que le chat.
>   Le mobile filtre par `disputeId` ; un seul event à écouter (la réponse IA arrive
>   aussi via `dispute:message` avec `sender: "ai"`).
> - **Bug 4 Symptôme A** : l'app mobile doit **afficher les messages dont
>   `sender`/`role = "agent"`** (et `system` / `ai`), pas seulement ceux du client.
> - **Forme des messages** (litiges et chat) : `{ id, sender, sender_name, content,
>   created_at, + ai_confidence/ai_sources si sender="ai" }`.
> - **Filet de sécurité conseillé** : polling de secours (~3 s) tant que la fiabilité
>   socket n'est pas validée des deux côtés.

---

## 🔴 Bug 1 — `GET /v1/disputes/:id` renvoie la **liste** au lieu du litige

**Endpoint :** `GET /v1/disputes/{id}`

### Réponse actuelle (incorrecte)
Le paramètre `:id` est ignoré. L'API renvoie **tous** les litiges dans un tableau,
et **sans** les champs `description` ni `messages` :

```json
{
  "data": [
    {
      "id": "38cdf890-f890-415f-bbc1-aac1028a3d85",
      "subject": "E2E deploy 114",
      "category": "payment",
      "status": "in_progress",
      "reporter_name": "Dev Support",
      "reporter_phone": "+2250700000051",
      "trip_id": null,
      "trip_ref": null,
      "assigned_to": "Dev Support",
      "assigned_to_id": "34c2a523-6e34-4af9-ad4a-16baea65ed76",
      "created_at": "2026-06-22T16:24:24.312569+00:00",
      "updated_at": "2026-06-22T17:16:47.901+00:00"
      // ❌ pas de "description"
      // ❌ pas de "messages"
    }
    // ❌ + tous les autres litiges
  ]
}
```

### Réponse attendue (contrat `BACKEND_SUPPORT_API.md:278`)
Un **seul** litige (celui correspondant à `:id`), **à plat**, **avec** `description`
**et** `messages[]` :

```json
{
  "id": "38cdf890-f890-415f-bbc1-aac1028a3d85",
  "subject": "E2E deploy 114",
  "description": "double debit test",
  "category": "payment",
  "status": "in_progress",
  "reporter_name": "Dev Support",
  "reporter_phone": "+2250700000051",
  "trip_id": null,
  "trip_ref": null,
  "assigned_to": "Dev Support",
  "assigned_to_id": "34c2a523-6e34-4af9-ad4a-16baea65ed76",
  "created_at": "2026-06-22T16:24:24.312569+00:00",
  "updated_at": "2026-06-22T17:16:47.901+00:00",
  "messages": [
    {
      "id": "a0e51adf-451e-42a1-8eda-c4196af28066",
      "sender": "system",
      "sender_name": "Système",
      "content": "Litige ouvert via l'application mobile.",
      "created_at": "2026-06-22T16:24:24Z"
    }
  ]
}
```

**Impact :** au chargement de la page d'un litige, le fil de discussion est vide
et la description manque, car l'API ne les envoie jamais sur cet endpoint.

**À corriger :**
1. Filtrer par `:id` et renvoyer **un objet** (pas un tableau).
2. Inclure `description`.
3. Inclure `messages[]` (mêmes champs que ci-dessus + `ai_confidence` / `ai_sources` si `sender: "ai"`).

---

## 🟠 Bug 2 — Enveloppe de réponse incohérente entre endpoints

Le contrat décrit une réponse **à plat** (l'objet `DisputeDetail` directement).
Or chaque endpoint utilise une enveloppe différente :

| Endpoint | Enveloppe actuelle | Attendu (doc) |
|----------|--------------------|---------------|
| `GET /v1/disputes/:id` | `{ "data": [ ... ] }` | objet à plat |
| `PATCH /v1/disputes/:id/assign` | `{ "status": "ok", "message": "...", "dispute": { ... } }` | objet à plat |

Exemple réel de `assign` (les données sont **correctes**, mais imbriquées dans `dispute`) :

```json
{
  "status": "ok",
  "generatedAt": "2026-06-22T17:27:57.568Z",
  "message": "Opération réussie.",
  "dispute": {
    "id": "38cdf890-...",
    "description": "double debit test",
    "status": "in_progress",
    "assigned_to": "Dev Support",
    "assigned_to_id": "34c2a523-...",
    "messages": [ /* avec le message système + message d'accueil agent */ ]
  }
}
```

**À corriger :** uniformiser. Soit tout à plat (conforme à la doc), soit la **même**
enveloppe partout pour `assign` / `resolve` / `close` / `escalate`. Le frontend
attend la forme à plat décrite dans `BACKEND_SUPPORT_API.md`.

---

## 🟠 Bug 3 — Temps réel : message client (mobile) non reçu côté dashboard

**Symptôme :** un message envoyé par l'agent arrive bien sur le mobile, mais un
message envoyé depuis le mobile **n'apparaît pas** sur le dashboard support.

Le frontend écoute désormais les events `dispute:message` / `dispute:updated`
(room `user:{userId}`, cf. BACKEND_SUPPORT_API.md §7). Pour que le dashboard se
mette à jour, le backend doit **émettre `dispute:message` vers la room de l'agent
assigné** (pas seulement vers le client) à chaque nouveau message, avec le payload :

```json
{ "disputeId": "…", "message": { "id": "…", "sender": "user", "sender_name": "…", "content": "…", "created_at": "…" } }
```

> Tant que `GET /v1/disputes/:id` ne renvoie pas `messages` (Bug 1), le socket est
> le **seul** canal qui alimente le fil côté dashboard — son émission fiable est donc
> indispensable.

---

## 🟠 Bug 4 — Chat tickets (`/support/tickets`) : temps réel partiel

Endpoints concernés : `GET/POST /v1/support/chat/:id` + event Socket.IO `chat:message`
(payload `{ conversationId, message }`, room `user:{userId}`).

### Symptôme A — messages agent non affichés côté mobile
Les messages envoyés depuis le dashboard apparaissent bien côté agent, mais **pas
sur l'app mobile**. À vérifier côté backend/mobile :
- le backend émet-il `chat:message` vers la room du **client** (`user:{clientId}`)
  quand l'agent répond ?
- la réponse de `GET /v1/support/chat/:id` inclut-elle bien les messages avec
  `sender`/`role = "agent"` (et le mobile les rend-il) ?

### Symptôme B — seul le 1er message client arrive sur le dashboard
À la réception, **le premier** message client met bien à jour le dashboard, mais
**les suivants non**. Le frontend écoute `chat:message` et invalide le cache à chaque
event reçu (logique vérifiée OK côté front). À vérifier côté backend :
- le backend émet-il `chat:message` vers la room de **l'agent assigné** à **chaque**
  message (et pas seulement au premier / à la création de la conversation) ?
- la room de l'agent reste-t-elle bien jointe après le premier event (pas de
  déconnexion / changement de room côté serveur) ?

Payload attendu à chaque message (dans les deux sens) :

```json
{ "conversationId": "…", "message": { "id": "…", "sender": "agent|user", "sender_name": "…", "content": "…", "created_at": "…" } }
```

---

## Récapitulatif — checklist backend

- [ ] `GET /v1/disputes/:id` renvoie **un seul** litige (filtré par `:id`), pas la liste.
- [ ] Ajouter `description` à la réponse de `GET /v1/disputes/:id`.
- [ ] Ajouter `messages[]` à la réponse de `GET /v1/disputes/:id`.
- [ ] Uniformiser l'enveloppe (`assign`/`resolve`/`close`/`escalate` ↔ `GET :id`) — viser la forme à plat de la doc.
- [ ] Vérifier que `resolve` / `close` / `escalate` renvoient bien le `DisputeDetail` à jour (ou au moins un statut clair).
- [ ] Émettre `dispute:message` vers la room de **l'agent assigné** à chaque message (pas seulement vers le mobile client).
- [ ] Émettre `dispute:updated` vers l'agent à l'assignation / résolution / clôture / escalade.
- [ ] Chat tickets : émettre `chat:message` vers la room du **client** quand l'agent répond (affichage mobile).
- [ ] Chat tickets : émettre `chat:message` vers la room de **l'agent** à **chaque** message client (pas seulement le premier).

> Note frontend : un mapper de tolérance ([`dispute.mapper.ts`](src/features/disputes/api/dispute.mapper.ts))
> déballe déjà `dispute` / `data` et retrouve l'élément par `id` pour ne pas planter.
> Ce contournement pourra être retiré une fois les points ci-dessus corrigés.
