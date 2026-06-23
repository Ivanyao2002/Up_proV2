# Note — Alignement « Assistance » app mobile ↔ dashboard support

**De :** équipe Web (dashboard support — `Up_proV2`)
**Pour :** dev app mobile (`upjunoo-pro-app`)
**Objet :** 3 écarts de contrat sur les **litiges** et le **chat support** entre l'app cliente et le back-office.

Le dashboard agent et l'app tapent la **même API** (`/v1`). Les routes sont alignées ✅. Les écarts sont sur les **valeurs envoyées** par l'app, que le dashboard ne relit pas avec le même vocabulaire.

> **État côté Web :** le dashboard a été aligné sur l'**enum canonique** et ne contient **plus aucune traduction** des anciens codes mobile (`billing`, `route`, …). Une simple garde valide les valeurs canoniques et protège l'UI contre `null`/valeurs inattendues. **Conséquence : dès que l'app envoie les codes canoniques ci-dessous, tout est aligné (affichage *et* filtrage serveur).** Tant que l'app envoie les anciens codes, ils retombent sur `other`/`open` côté dashboard — d'où l'importance des correctifs ci-dessous.

---

## 🔴 1. Codes de catégorie de litige (`POST /v1/disputes`)

L'app envoie des `code` que le back-office n'utilise pas. Merci d'envoyer le **vocabulaire canonique** ci-dessous (les libellés FR affichés à l'utilisateur peuvent rester ce que vous voulez, seul le `code` envoyé doit changer) :

| App envoie actuellement | ❌ | Code canonique à envoyer ✅ | Libellé dashboard |
|---|---|---|---|
| `billing`           | → | `payment`   | Facturation |
| `driver_behavior`   | → | `behavior`  | Comportement |
| `route`             | → | `service`   | Trajet |
| `service_quality`   | → | `service`   | Trajet |
| `other`             | = | `other`     | Autre |
| *(manquant)*        |   | `logistics` | Livraison (colis/livraison) |
| *(manquant)*        |   | `app`       | Bug application |

Enum canonique complet : `payment | behavior | service | logistics | app | other`.

📍 Fichier concerné : `app/profile/disputes.tsx` → constante `CATEGORIES` (remplacer les `code`).

```tsx
// AVANT ❌
const CATEGORIES = [
  { code: 'billing',          label: 'Facturation' },
  { code: 'driver_behavior',  label: 'Comportement du chauffeur' },
  { code: 'route',            label: 'Itinéraire' },
  { code: 'service_quality',  label: 'Qualité du service' },
  { code: 'other',            label: 'Autre' },
];

// APRÈS ✅  (seul le `code` change, les labels FR restent libres)
const CATEGORIES = [
  { code: 'payment',   label: 'Facturation' },
  { code: 'behavior',  label: 'Comportement du chauffeur' },
  { code: 'service',   label: 'Trajet' },
  { code: 'logistics', label: 'Livraison' },
  { code: 'app',       label: 'Application' },
  { code: 'other',     label: 'Autre' },
];
```

---

## 🔴 2. Champ du corps des messages de ticket (`POST /v1/support/tickets/:id/messages`)

- **App envoie :** `{ "message": "..." }`
- **Dashboard agent envoie :** `{ "content": "...", "type": "message" }`

Le champ attendu est **`content`** (et non `message`). Avec `message`, le contenu risque d'arriver **vide** côté agent. Merci d'envoyer :

```json
{ "content": "texte du client" }
```

📍 Fichier concerné : `lib/api/services/misc.ts` → `supportApi.reply` (renommer `message` → `content`).

```ts
// AVANT ❌
reply: (id: string, message: string) =>
  api.post<any>(`/support/tickets/${id}/messages`, { message }),

// APRÈS ✅
reply: (id: string, content: string) =>
  api.post<any>(`/support/tickets/${id}/messages`, { content }),
```

➡️ À confirmer ensemble sur le Swagger quel champ le backend lit réellement, pour décider qui change (app ou backend). Le dashboard, lui, est déjà sur `content`.

---

## 🟠 3. Vocabulaire des statuts de litige (affichage)

- **App connaît :** `open, pending, resolved, closed, rejected`
- **Dashboard/backend utilisent :** `open, in_progress, resolved, closed, escalated`

Conséquences aujourd'hui dans l'app :
- un litige passé en `in_progress` ou `escalated` par l'agent retombe sur le fallback et s'affiche **« Ouvert »** au client (information fausse) ;
- `pending` / `rejected` n'existent pas côté backend.

Le backend renvoie l'enum **`open | in_progress | resolved | closed | escalated`**. Merci de mapper **tous** ces codes dans `STATUS_META`.

> **Côté client, on simplifie le vocabulaire métier.** `escalated` est un état **interne** (le ticket est monté d'un niveau en interne) — ça ne veut rien dire pour le client, qui doit juste comprendre que « c'est en cours de traitement ». On affiche donc **« En cours »** pour `in_progress` **et** `escalated`. L'agent, lui, continue de voir « Escaladé » dans le dashboard.

| Code backend | Libellé client (mobile) |
|---|---|
| `open`        | Ouvert |
| `in_progress` | En cours |
| `escalated`   | **En cours** (escalade masquée au client) |
| `resolved`    | Résolu |
| `closed`      | Clôturé |

📍 Fichier concerné : `app/profile/disputes.tsx` → constante `STATUS_META` (mapper `escalated` → « En cours », pas « Escaladé »).

```ts
// AVANT ❌  (pending/rejected n'existent pas ; in_progress/escalated absents → fallback "Ouvert")
const STATUS_META = {
  open:     { label: 'Ouvert',  color: Palette.warning },
  pending:  { label: 'En cours', color: Palette.warning },
  resolved: { label: 'Résolu',  color: Palette.success },
  closed:   { label: 'Clôturé', color: Palette.gray400 },
  rejected: { label: 'Rejeté',  color: Palette.error },
};

// APRÈS ✅
const STATUS_META = {
  open:        { label: 'Ouvert',  color: Palette.warning },
  in_progress: { label: 'En cours', color: Palette.warning },
  escalated:   { label: 'En cours', color: Palette.warning }, // escalade interne masquée au client
  resolved:    { label: 'Résolu',  color: Palette.success },
  closed:      { label: 'Clôturé', color: Palette.gray400 },
};
```

---

## 🟡 Améliorations recommandées (non bloquantes)

1. **Statut des tickets dans l'écran Assistance** (`app/profile/support.tsx`) : actuellement réduit à `t.status === 'open' ? 'Ouvert' : 'Fermé'`, donc `in_progress` / `resolved` / `escalated` s'affichent tous « Fermé ». Mapper l'enum complet avec la **même simplification client** que les litiges :

   ```ts
   // AVANT ❌
   sublabel={`${t.status === 'open' ? 'Ouvert' : 'Fermé'}${t.date ? ` · ${t.date}` : ''}`}

   // APRÈS ✅  (un seul libellé client par code backend)
   const TICKET_STATUS_LABEL: Record<string, string> = {
     open: 'Ouvert',
     in_progress: 'En cours',
     escalated: 'En cours',   // escalade interne masquée au client
     resolved: 'Résolu',
     closed: 'Clôturé',
   };
   // …
   sublabel={`${TICKET_STATUS_LABEL[t.status] ?? 'Ouvert'}${t.date ? ` · ${t.date}` : ''}`}
   ```

2. **`trip_id` sur la création de litige** : l'app n'envoie pas `trip_id` dans `POST /v1/disputes`. Le dashboard sait afficher le trajet lié (`TripSummaryPanel`) — l'envoyer donne le contexte à l'agent.

3. **Historique + temps réel du chat ticket** (`support.tsx`) : `openChat()` réinitialise le fil au seul message de bienvenue et ne charge jamais `GET /v1/support/tickets/:id/messages`. Il n'y a pas non plus d'abonnement socket → les réponses de l'agent n'apparaissent pas en direct. Charger l'historique à l'ouverture et s'abonner au socket (le dashboard publie déjà via Socket.IO).

---

## ✅ Checklist mobile (à cocher avant merge)

**Bloquant**
- [ ] `app/profile/disputes.tsx` — `CATEGORIES`: codes → `payment | behavior | service | logistics | app | other`
- [ ] `app/profile/disputes.tsx` — `STATUS_META`: codes → `open | in_progress | escalated | resolved | closed` (et `escalated` libellé « En cours »)
- [ ] `lib/api/services/misc.ts` — `supportApi.reply`: body `{ message }` → `{ content }` *(confirmer le champ sur le Swagger)*

**Recommandé**
- [ ] `app/profile/support.tsx` — libellé statut ticket via map complète (plus de `open ? … : 'Fermé'`)
- [ ] `app/profile/disputes.tsx` — envoyer `trip_id` dans `POST /v1/disputes` quand le litige concerne une course
- [ ] `app/profile/support.tsx` — charger `GET /v1/support/tickets/:id/messages` à l'ouverture + abonnement socket

---

## Référence — contrat canonique (côté Web)

- Catégories litige : `src/features/disputes/api/dispute.types.ts` (`DisputeCategory`)
- Statuts litige : `DisputeStatus`
- Corps message ticket agent : `src/features/support/api/agentTicket.service.ts` → `{ content, type }`
- Garde de normalisation côté Web : `src/features/disputes/api/dispute.mapper.ts` (valide les valeurs canoniques, ne traduit plus aucun code mobile)
