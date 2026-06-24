# Demande backend — Notifications opérationnelles depuis le back-office

> **Date** : juin 2026  
> **Demandeur** : Équipe front UpJunoo Pro (`Up_prov2`)  
> **Priorité** : **P1** — communication ops → chauffeurs / clients  
> **Références front existantes** :
> - `src/features/support/api/notifications.service.ts` — boîte de réception (`GET /v1/notifications`)
> - `src/features/support/api/pushExpo.service.ts` — test push Expo (`POST /v1/notifications/push/test`)
> - `src/features/support/pages/NotificationsInboxPage.tsx` — inbox partenaire / support
> - `src/features/support/pages/PushExpoTestPage.tsx` — écran test push (dev/recette)

---

## 1. Contexte et besoin métier

Le back-office doit pouvoir **envoyer des notifications** aux utilisateurs mobiles (chauffeurs, clients) et, le cas échéant, aux portails web (partenaire, franchise), **depuis une action opérateur**.

### Exemples concrets

| Scénario | Audience | Message type |
|----------|----------|--------------|
| Rappel mise en ligne | Chauffeurs **hors ligne** d’une zone / franchise | « Forte demande à Cocody — passez en ligne pour recevoir des courses » |
| Alerte météo / crise | Tous les chauffeurs d’un pays | « Pluie forte — roulez prudemment » |
| Info client | Tous les clients ou segment | « Promo week-end -10 % » |
| Message ciblé | **Un** chauffeur ou **un** client | « Votre document KYC expire dans 3 jours » |
| Groupe métier | Chauffeurs `approval_status=approved` + `availability_status=offline` | Campagne de réactivation |
| Broadcast global | Tous les chauffeurs **ou** tous les clients | Annonce plateforme |

**Principe** : le **back-office lance** ; les **destinataires reçoivent** (push mobile + entrée dans leur inbox in-app).

---

## 2. État actuel côté API (constat front)

### Déjà consommé

| Méthode | Route | Rôle |
|---------|-------|------|
| `GET` | `/v1/notifications` | Liste des notifications **du user connecté** |
| `GET` | `/v1/notifications/unread-count` | Compteur non lues |
| `PATCH` | `/v1/notifications/{id}/read` | Marquer lue |
| `PATCH` | `/v1/notifications/read-all` | Tout marquer lu |
| `GET` | `/v1/notifications/push-config` | Config Expo (recette) |
| `POST` | `/v1/notifications/push/test` | Push de **test** (utilisateur courant ?) |

### Manquant pour le produit

- Routes **admin** pour **créer / envoyer** une notification vers une audience
- Segmentation (groupe, filtres métier)
- Historique des campagnes envoyées depuis le BO
- Statistiques d’envoi (envoyé, délivré, échec, ouvert)
- Templates ou au minimum `type` / `category` standardisés

---

## 3. Objectif backend

Mettre en place un **module de notifications sortantes** (`outbound` / `campaigns`) permettant à un opérateur authentifié **admin** (et éventuellement franchise selon périmètre) de :

1. Envoyer à **tout le monde** d’un type d’utilisateur (broadcast)
2. Envoyer à **une personne** (userId / driverId / clientId)
3. Envoyer à un **groupe** (filtres ou liste d’IDs)
4. Persister la notification dans l’**inbox** de chaque destinataire
5. Déclencher le **push mobile** (Expo / FCM) quand un device token est enregistré
6. Tracer l’envoi pour audit et support

---

## 4. Modèle de données suggéré

### 4.1 Notification (inbox destinataire)

Aligné sur ce que le front lit déjà (`NotificationItem`) :

```ts
{
  id: string;
  title: string;
  body: string;
  type: string;              // ex. "ops.broadcast", "ops.driver_go_online", "promo"
  read: boolean;
  data?: Record<string, unknown>;  // deep link, action, metadata
  created_at: string;
  updated_at: string;
}
```

**Extension recommandée** (optionnelle, rétrocompatible) :

```ts
{
  priority?: "low" | "normal" | "high";
  channel?: "in_app" | "push" | "both";
  campaign_id?: string;      // lien vers campagne ops
  action?: {
    label?: string;          // ex. "Passer en ligne"
    deeplink?: string;       // ex. "upjunoo://driver/go-online"
    url?: string;
  };
}
```

### 4.2 Campagne / envoi ops (nouveau)

```ts
{
  id: string;
  title: string;
  body: string;
  type: string;
  audience: AudienceSpec;
  channels: ("in_app" | "push")[];
  status: "draft" | "scheduled" | "sending" | "sent" | "failed" | "cancelled";
  created_by: { user_id: string; display_name: string };
  created_at: string;
  scheduled_at?: string;
  sent_at?: string;
  stats?: {
    targeted: number;
    inbox_created: number;
    push_sent: number;
    push_failed: number;
  };
}
```

### 4.3 Audience (`AudienceSpec`)

```ts
type AudienceSpec =
  | { mode: "broadcast"; user_type: "DRIVER" | "CLIENT" | "PARTNER" | "ALL_MOBILE" }
  | { mode: "user"; user_id: string }
  | { mode: "users"; user_ids: string[] }
  | { mode: "driver"; driver_id: string }
  | { mode: "drivers"; driver_ids: string[] }
  | { mode: "client"; client_id: string }
  | { mode: "segment"; user_type: "DRIVER" | "CLIENT"; filters: SegmentFilters };

interface SegmentFilters {
  country_code?: string;
  franchise_id?: string;
  partner_id?: string;
  zone_id?: string;
  city_id?: string;
  availability_status?: ("online" | "offline" | "on_trip" | "paused")[];
  approval_status?: string;
  account_status?: string;
  // extensible
}
```

---

## 5. Routes API proposées

Toutes les routes **d’envoi / gestion campagnes** : auth **admin** (JWT `ADMIN` / permissions dédiées).  
Header recommandé : `X-Client-Type: back-office`.

### 5.1 Envoi immédiat (actions rapides)

#### Broadcast

```http
POST /v1/admin/notifications/broadcast
Content-Type: application/json

{
  "user_type": "DRIVER",
  "title": "Forte demande",
  "body": "Passez en ligne pour profiter des courses en cours.",
  "type": "ops.driver_go_online",
  "channels": ["in_app", "push"],
  "data": {
    "deeplink": "upjunoo://driver/go-online"
  },
  "segment": {
    "availability_status": ["offline", "paused"],
    "franchise_id": "uuid-franchise"
  }
}
```

**Réponse 202** (traitement async si gros volume) :

```json
{
  "status": "ok",
  "campaign_id": "uuid-campaign",
  "targeted_count": 142,
  "message": "Campagne en cours d'envoi"
}
```

#### Une personne

```http
POST /v1/admin/notifications/send
{
  "user_id": "uuid-user",
  "title": "Document KYC",
  "body": "Votre permis expire bientôt.",
  "type": "ops.kyc_reminder",
  "channels": ["in_app", "push"]
}
```

Alias acceptables : `driver_id`, `client_id` si résolution user côté backend.

#### Groupe (liste d’IDs)

```http
POST /v1/admin/notifications/send-batch
{
  "user_ids": ["uuid-1", "uuid-2", "uuid-3"],
  "title": "Réunion partenaire",
  "body": "Rappel : point ops demain 9h.",
  "type": "ops.announcement",
  "channels": ["in_app", "push"]
}
```

#### Groupe (segment / filtres)

```http
POST /v1/admin/notifications/send-segment
{
  "user_type": "DRIVER",
  "filters": {
    "country_code": "CI",
    "availability_status": ["offline"],
    "franchise_id": "uuid-franchise"
  },
  "title": "Mettez-vous en ligne",
  "body": "30+ courses en attente dans votre zone.",
  "type": "ops.driver_go_online",
  "channels": ["in_app", "push"],
  "data": { "deeplink": "upjunoo://driver/go-online" }
}
```

### 5.2 Prévisualisation audience (avant envoi)

```http
POST /v1/admin/notifications/audience-preview
{
  "user_type": "DRIVER",
  "filters": {
    "availability_status": ["offline"],
    "franchise_id": "uuid-franchise"
  }
}
```

**Réponse** :

```json
{
  "count": 87,
  "sample": [
    { "user_id": "…", "driver_id": "…", "display_name": "Jean K.", "has_push_token": true }
  ]
}
```

Indispensable pour éviter d’envoyer à 10 000 personnes par erreur.

### 5.3 Historique & suivi campagnes

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/v1/admin/notifications/campaigns` | Liste paginée des envois ops |
| `GET` | `/v1/admin/notifications/campaigns/{id}` | Détail + stats |
| `POST` | `/v1/admin/notifications/campaigns` | Créer brouillon (optionnel) |
| `POST` | `/v1/admin/notifications/campaigns/{id}/send` | Envoyer un brouillon / programmé |
| `POST` | `/v1/admin/notifications/campaigns/{id}/cancel` | Annuler si `scheduled` |

### 5.4 Templates (option phase 2)

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/v1/admin/notifications/templates` | Modèles prédéfinis |
| `POST` | `/v1/admin/notifications/templates` | CRUD templates ops |

Exemples de templates :

| `type` | Titre | Usage |
|--------|-------|-------|
| `ops.driver_go_online` | Demande de mise en ligne | Chauffeurs offline |
| `ops.weather_alert` | Alerte météo | Broadcast chauffeurs zone |
| `ops.promo_client` | Promotion | Clients segment |
| `ops.document_expiry` | Document à renouveler | 1 chauffeur |

### 5.5 Routes destinataires (inchangées / à stabiliser)

Les apps **mobile chauffeur** et **mobile client** continuent de consommer :

```http
GET  /v1/notifications
GET  /v1/notifications/unread-count
PATCH /v1/notifications/{id}/read
PATCH /v1/notifications/read-all
```

**Enregistrement device token** (si pas déjà en place) :

```http
POST /v1/notifications/devices
{
  "provider": "expo",
  "token": "ExponentPushToken[…]",
  "platform": "ios" | "android",
  "app": "driver" | "client"
}
```

---

## 6. Canaux de livraison

| Canal | Comportement |
|-------|--------------|
| **`in_app`** | Créer une ligne inbox par destinataire → visible dans l’app / portail |
| **`push`** | Envoi Expo (déjà amorcé via `/push/test`) si token enregistré |
| **`both`** (défaut ops) | Inbox + push |

**Règles** :
- Si pas de token push : inbox quand même + `push_failed` incrémenté (pas d’erreur bloquante campagne)
- Push : respecter rate limits Expo / file d’attente async pour broadcast > 500 destinataires
- Contenu : `title` max 80 car., `body` max 500 car. (à valider)

---

## 7. Permissions & sécurité

| Permission suggérée | Actions |
|---------------------|---------|
| `notifications.view` | Lire historique campagnes |
| `notifications.send.targeted` | Envoi 1 personne / batch < N |
| `notifications.send.segment` | Envoi segment filtré |
| `notifications.send.broadcast` | Broadcast pays / global |
| `notifications.templates.manage` | CRUD templates |

**Garde-fous** :
- Broadcast global : réservé `SUPER_ADMIN` ou double validation (phase 2)
- Audit log : qui a envoyé quoi, à combien, quand (`category: notification_campaign`)
- Idempotence : header `Idempotency-Key` sur POST send pour éviter double clic BO
- Rate limit : ex. max 3 broadcast / heure / franchise

---

## 8. Intégration front prévue (après livraison API)

### Écrans back-office à créer

| Écran | Route admin suggérée | API |
|-------|----------------------|-----|
| Centre notifications | `/admin/ops/notifications` | liste campagnes |
| Nouvelle notification | `/admin/ops/notifications/new` | preview + send |
| Rappel chauffeurs offline | action depuis liste chauffeurs | `send-segment` avec filtres préremplis |
| Fiche chauffeur | bouton « Envoyer notification » | `send` avec `driver_id` |

### Fichiers front à créer / étendre

```
src/features/notifications/
├── api/
│   ├── adminNotifications.api.types.ts
│   ├── adminNotifications.mapper.ts
│   ├── adminNotifications.service.ts
│   ├── adminNotifications.queries.ts
│   └── adminNotifications.keys.ts
├── pages/
│   ├── AdminNotificationsCampaignsPage.tsx
│   └── AdminNotificationComposePage.tsx
└── components/
    ├── AudiencePreviewPanel.tsx
    └── NotificationComposeForm.tsx
```

`LINKS.admin.v1.notifications.*` dans `core/api/links.ts`.

### Apps mobiles (hors scope front BO, mais dépendance)

- Afficher push + inbox (déjà partiellement via `/v1/notifications`)
- Gérer `data.deeplink` pour actions (« Passer en ligne »)
- Enregistrer le token device au login

---

## 9. Exemples de payloads métier

### 9.1 Chauffeurs hors ligne — mise en ligne

```json
{
  "user_type": "DRIVER",
  "filters": {
    "availability_status": ["offline", "paused"],
    "approval_status": "approved",
    "franchise_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "title": "Courses disponibles",
  "body": "De nombreuses demandes dans votre secteur. Passez en ligne maintenant.",
  "type": "ops.driver_go_online",
  "channels": ["in_app", "push"],
  "data": {
    "deeplink": "upjunoo://driver/go-online",
    "franchise_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### 9.2 Tous les clients d’un pays

```json
{
  "user_type": "CLIENT",
  "filters": { "country_code": "CI" },
  "title": "Offre spéciale",
  "body": "-15 % sur votre prochaine course avec le code UPJUNOO15",
  "type": "ops.promo",
  "channels": ["in_app", "push"],
  "data": { "promo_code": "UPJUNOO15" }
}
```

### 9.3 Un chauffeur précis (depuis fiche admin)

```json
{
  "driver_id": "driver-uuid",
  "title": "Complétez votre dossier",
  "body": "Photo permis floue — merci de la recharger.",
  "type": "ops.kyc_reminder",
  "channels": ["in_app", "push"],
  "data": { "deeplink": "upjunoo://driver/kyc" }
}
```

---

## 10. Critères d’acceptation (recette)

### 10.1 Envoi ciblé (1 user)

1. Admin envoie via `POST /send` à un chauffeur test.
2. `GET /v1/notifications` côté chauffeur (JWT chauffeur) → notification présente, `read: false`.
3. Push reçu sur device avec token enregistré.
4. `PATCH …/read` → `read: true`.

### 10.2 Segment chauffeurs offline

1. `audience-preview` avec `availability_status: ["offline"]` → count cohérent.
2. `send-segment` → inbox créée pour chaque cible.
3. Chauffeurs **online** exclus du segment.

### 10.3 Broadcast

1. Broadcast `user_type: DRIVER` + filtre pays → pas de clients dans les cibles.
2. Campagne visible dans `GET /admin/notifications/campaigns`.
3. Stats `targeted` / `push_sent` renseignées.

### 10.4 Sécurité

1. JWT partenaire / chauffeur → `403` sur routes `/admin/notifications/*`.
2. Utilisateur sans permission `notifications.send.broadcast` → `403` sur broadcast.

### 10.5 Non-régression

1. `POST /v1/notifications/push/test` continue de fonctionner (recette).
2. Inbox partenaire existante (`PartnerNotificationsPage`) inchangée.

---

## 11. Questions ouvertes pour le backend

1. **Provider push** : Expo uniquement ou aussi FCM natif ?
2. **Résolution IDs** : le front envoie `driver_id` ou faut-il toujours `user_id` ?
3. **Volume max** par campagne et stratégie async (job queue) ?
4. **Programmation** (`scheduled_at`) : phase 1 ou 2 ?
5. **Franchise** : peut-elle envoyer à **ses** chauffeurs seulement (`POST /v1/franchise/notifications/send-segment`) ?
6. **SMS / email** : hors scope phase 1 ?
7. **Deep links** : schéma officiel `upjunoo://` par app ?

---

## 12. Phasage suggéré

| Phase | Livrable |
|-------|----------|
| **P1** | `send`, `send-segment`, `audience-preview`, inbox + push, historique campagnes basique |
| **P2** | Templates, programmation, stats détaillées (ouvert / cliqué) |
| **P3** | Franchise scope, SMS, A/B, double validation broadcast |

---

## 13. Message court pour l’équipe backend

> Nous avons besoin de routes **admin** pour envoyer des notifications depuis le back-office : à **tout le monde**, à **une personne**, ou à un **groupe** (liste d’IDs ou segment métier, ex. chauffeurs hors ligne). Chaque envoi doit créer une entrée **inbox** (`/v1/notifications`) et déclencher un **push mobile** (Expo) si un token existe. Le front a déjà l’inbox et un endpoint de test push ; il manque la couche **outbound / campagnes** côté admin avec preview d’audience et historique.

---

*Document rédigé côté front Upjunoo backoffice — à valider avec l’équipe mobile (deep links, tokens) et l’équipe backend (schéma DB, queue async).*
