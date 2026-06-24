# Demande backend — Enrichir les réponses API avec des objets lisibles (pas seulement des IDs)

> **Date :** 2026-06-16  
> **Émetteur :** équipe front UpJunoo (admin, franchise, partenaire)  
> **Objectif :** éviter d'afficher des UUID bruts dans le back-office et réduire les appels de résolution côté front.  
> **Swagger :** [https://api.upjunoo-dev.tech/docs](https://api.upjunoo-dev.tech/docs)

---

## 1. Contexte

Dans de nombreuses réponses API, le backend renvoie des **identifiants seuls** (`partner_id`, `order_id`, `wallet_id`, `owner_name` = UUID…) sans les **libellés** nécessaires à l'affichage.

Le front doit alors :
- soit afficher l'UUID tel quel (mauvaise UX),
- soit refaire des appels `GET /v1/...` pour résoudre chaque entité (N+1, lenteur, complexité des mappers).

**Demande :** pour chaque relation métier exposée dans une réponse, renvoyer un **objet enrichi** `{ id, …champs d'affichage }` en plus (ou à la place) du simple `*_id` plat.

---

## 2. Principe général — pattern `Summary`

### Convention proposée

Pour toute entité référencée dans une réponse :

| Niveau | Contenu | Usage front |
|--------|---------|-------------|
| `*_id` (optionnel) | UUID | navigation, filtres, mutations |
| Objet `summary` | `id` + champs lisibles | affichage UI, exports, listes |

**Nommage :** camelCase canonique en lecture (comme déjà documenté dans `REPONSE-BACKEND-CONTRAT-CREATION-CHAUFFEUR-VEHICULE-2026-06-16.md`). Les alias snake_case restent tolérés si besoin legacy.

### Champs d'affichage minimum par type

| Entité | Objet | Champs minimum pour l'UI |
|--------|-------|--------------------------|
| **Course / commande** | `order` | `id`, `ref` (référence humaine), `serviceType`, `status` |
| **Partenaire** | `partner` | `id`, `tradeName`, `status` |
| **Franchise** | `franchise` | `id`, `name`, `code` |
| **Chauffeur** | `driver` | `id`, `displayName`, `driverCode`, `phone` |
| **Client** | `client` | `id`, `displayName`, `phone` |
| **Véhicule** | `vehicle` | `id`, `label` (ex. « Peugeot 301 · AB-123-CD »), `plateNumber` |
| **Wallet** | `wallet` | `id`, `ownerType`, `owner` (objet selon le type) |
| **Propriétaire wallet** | `wallet.owner` | `id`, `displayName`, `type` (`platform` \| `driver` \| `partner` \| `franchise`) |

> **Règle :** `displayName` (ou `label` / `ref`) ne doit **jamais** être un UUID brut. Si aucun libellé métier n'existe, utiliser un fallback explicite (`"Plateforme UpJunoo"`, `TR-{8 premiers chars}`, etc.).

---

## 3. Exemple concret — transaction finance (problème actuel)

### Appel

```http
GET /v1/admin/finance/transactions/d9d3ee64-eb46-4dfa-b60f-2321408b0e12
Authorization: Bearer <JWT admin>
X-Client-Type: back-office
```

### Réponse actuelle (extrait problématique)

```json
{
  "status": "ok",
  "transaction": {
    "id": "d9d3ee64-eb46-4dfa-b60f-2321408b0e12",
    "order_id": "b98f562b-8728-41ba-987b-1543dbb76664",
    "partner_id": null,
    "partner_name": null,
    "franchise_id": null,
    "franchise_name": null,
    "owner_name": "00000000-0000-0000-0000-000000000001",
    "wallet": {
      "id": "c9bc9479-d302-4036-ae54-8cdb2a358c98",
      "ownerType": "platform",
      "owner": {
        "id": "00000000-0000-0000-0000-000000000001",
        "displayName": "00000000-0000-0000-0000-000000000001"
      }
    },
    "order": {
      "id": "b98f562b-8728-41ba-987b-1543dbb76664",
      "ref": "b98f562b-8728-41ba-987b-1543dbb76664",
      "serviceType": "DELIVERY_CARGO"
    },
    "commissionBreakdown": null
  }
}
```

### Ce que voit l'utilisateur dans le back-office

| Champ UI | Valeur affichée | Problème |
|----------|-----------------|----------|
| Partenaire | `—` | `partner` absent alors que la course a un partenaire |
| Propriétaire | `00000000-0000-0000-0000-000000000001` | UUID au lieu de « Plateforme UpJunoo » |
| Course | `b98f562b-8728-41ba-987b-1543dbb76664` | `order.ref` = copie de l'UUID, pas une référence humaine |
| Commission | (section vide) | `commissionBreakdown` null alors que `metadata` contient des montants |

Le front affiche `order.ref ?? order_id` (`TransactionDetailPage.tsx`) — si `ref` est l'UUID, l'utilisateur voit l'UUID.

---

## 4. Réponse attendue (exemple cible)

```json
{
  "status": "ok",
  "transaction": {
    "id": "d9d3ee64-eb46-4dfa-b60f-2321408b0e12",
    "entry_type": "ride_commission",
    "direction": "credit",
    "amount_xof": 164,
    "service_type": "DELIVERY_CARGO",
    "description": "Commission plateforme DELIVERY_CARGO",
    "status": "posted",
    "posted_at": "2026-06-16T12:21:50.525+00:00",

    "wallet": {
      "id": "c9bc9479-d302-4036-ae54-8cdb2a358c98",
      "ownerType": "platform",
      "owner": {
        "id": "00000000-0000-0000-0000-000000000001",
        "type": "platform",
        "displayName": "Plateforme UpJunoo"
      }
    },

    "order": {
      "id": "b98f562b-8728-41ba-987b-1543dbb76664",
      "ref": "TR-B98F562B",
      "orderReference": "TR-88421",
      "serviceType": "DELIVERY_CARGO",
      "status": "completed"
    },

    "partner": {
      "id": "71a1aad7-ad23-41ca-a6d0-b904d5953271",
      "tradeName": "Partner Dev Abidjan",
      "status": "active"
    },

    "franchise": {
      "id": "1bb2bff7-edcc-496d-a87a-4126c19be278",
      "name": "Franchise Abidjan",
      "code": "ABJ"
    },

    "driver": {
      "id": "7abb2329-7404-4224-b347-fb6297480e6b",
      "displayName": "Kevine Boudalha",
      "driverCode": null,
      "phone": "+2250500808585"
    },

    "commissionBreakdown": {
      "grossAmountXof": 2050,
      "driverAmountXof": 1743,
      "partnerAmountXof": 82,
      "platformAmountXof": 117,
      "fiscalityAmountXof": 47,
      "franchiseAmountXof": 62
    }
  }
}
```

### Règles pour `order.ref`

Le front utilise déjà cette logique de fallback (`adminOrder.shared.ts`) :

```ts
// Si order_reference existe → l'utiliser
// Sinon → TR-{8 premiers caractères de l'UUID en majuscules}
```

Le backend devrait **toujours** peupler `order.ref` (ou `orderReference`) avec :
1. `orders.order_reference` si présent en base, **ou**
2. le fallback `TR-{id.slice(0,8).toUpperCase()}`

**Ne jamais** renvoyer `ref: <uuid complet>`.

### Règles pour les wallets `platform`

Pour `ownerType: "platform"`, le propriétaire système (`00000000-0000-0000-0000-000000000001`) doit avoir :

```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "type": "platform",
  "displayName": "Plateforme UpJunoo"
}
```

Idem pour `owner_name` au niveau racine si ce champ plat est conservé.

---

## 5. Périmètre — endpoints prioritaires

### Priorité 1 — Finance admin

| Route | Enrichissements attendus |
|-------|--------------------------|
| `GET /v1/admin/finance/transactions` | `wallet.owner`, `order`, `partner`, `franchise`, `driver`, `commissionBreakdown` sur **chaque ligne** |
| `GET /v1/admin/finance/transactions/{id}` | idem en détail |
| `GET /v1/admin/finance/wallets` | `owner` avec `displayName`, `franchise`, `partner` si applicable |
| `GET /v1/admin/finance/withdrawals` | `beneficiary` / `owner` lisible |

### Priorité 2 — Portefeuilles chauffeur / partenaire

| Route | Enrichissements attendus |
|-------|--------------------------|
| `GET /v1/drivers/{id}` → `wallet.recentMovements[]` | `order.ref`, libellé course, pas d'UUID en `label` contextuel |
| `GET /v1/partners/{id}/wallet/...` | idem |

### Priorité 3 — Fleet & ops

| Route | Enrichissements attendus |
|-------|--------------------------|
| `GET /v1/partners/{id}/vehicles/{vehicleId}` | `driver` peuplé (cf. `PROBLEME-TRANSFERT-CHAUFFEUR-LIAISON-VEHICULE-2026-06-16.md`) |
| `GET /v1/admin/orders` / détail | déjà partiellement OK ; harmoniser `ref` / `order_reference` |
| Listes chauffeurs, véhicules, partenaires | `partner.tradeName`, `vehicle.label`, `driver.displayName` sur les lignes |

---

## 6. Ce que le front consomme déjà

Le mapper finance est prêt à exploiter ces objets (`adminFinance.api.types.ts`, `adminFinance.mapper.ts`) :

```ts
// Déjà prévus côté front — à alimenter côté backend
partner?: { id?, tradeName?, name? }
franchise?: { id?, name? }
wallet?: { ownerType?, owner?: { id?, displayName?, driverCode? } }
order?: { id?, ref?, serviceType? }
commissionBreakdown?: { grossAmountXof?, driverAmountXof?, ... }
```

Le front résout l'affichage ainsi :

```ts
partner_name: item.partner?.tradeName ?? item.partner_name ?? "—"
owner_name: item.wallet?.owner?.displayName ?? item.owner_name ?? "—"
order_ref: item.order?.ref  // utilisé tel quel dans les liens UI
```

**Si les objets sont correctement peuplés, aucun changement front majeur n'est nécessaire** — l'UI s'améliore immédiatement.

---

## 7. Anti-patterns à éviter

| Anti-pattern | Exemple | Correction |
|--------------|---------|------------|
| `ref` = UUID | `"ref": "b98f562b-8728-…"` | `order_reference` ou `TR-B98F562B` |
| `displayName` = UUID | `"displayName": "00000000-…"` | `"Plateforme UpJunoo"` |
| `owner_name` = UUID | champ racine avec l'ID | nom lisible ou objet `wallet.owner` |
| Objet `null` alors que l'ID existe | `partner: null` + course liée | joindre le partenaire de la commande |
| Doublon incohérent | `partner_name: "Foo"` mais `partner: null` | une seule source de vérité : l'objet |
| Champs plats obsolètes sans objet | `franchise_id` seul | ajouter `franchise: { id, name }` |

Les champs plats (`partner_id`, `partner_name`, `owner_name`) peuvent être **conservés** pour compatibilité, mais doivent être **cohérents** avec les objets enrichis (même valeur, pas d'UUID en `*_name`).

---

## 8. Modèle de référence — types partagés suggérés

À documenter dans Swagger comme schémas réutilisables :

```yaml
OrderSummary:
  type: object
  required: [id, ref]
  properties:
    id: { type: string, format: uuid }
    ref: { type: string, description: "Référence humaine (TR-… ou order_reference)" }
    orderReference: { type: string, nullable: true }
    serviceType: { type: string }
    status: { type: string }

PartnerSummary:
  type: object
  required: [id, tradeName]
  properties:
    id: { type: string, format: uuid }
    tradeName: { type: string }
    status: { type: string }

WalletOwnerSummary:
  type: object
  required: [id, type, displayName]
  properties:
    id: { type: string, format: uuid }
    type: { enum: [platform, driver, partner, franchise, client] }
    displayName: { type: string }
    driverCode: { type: string, nullable: true }
    phone: { type: string, nullable: true }

CommissionBreakdown:
  type: object
  properties:
    grossAmountXof: { type: integer }
    driverAmountXof: { type: integer }
    partnerAmountXof: { type: integer }
    platformAmountXof: { type: integer }
    fiscalityAmountXof: { type: integer }
    franchiseAmountXof: { type: integer }
```

---

## 9. Questions pour le backend

1. **`order_reference`** est-il stocké en base pour toutes les commandes ? Si oui, pourquoi `order.ref` renvoie-t-il l'UUID dans les transactions ?
2. **`commissionBreakdown`** peut-il être systématiquement renseigné pour les `entry_type` de type commission (données déjà dans `metadata`) ?
3. Pour le wallet **plateforme**, quel libellé canonique adopter (`Plateforme UpJunoo`, `UpJunoo`, autre) ?
4. Les jointures (partenaire / franchise / chauffeur d'une commande) peuvent-elles être faites **côté serveur** au moment de la lecture transaction, sans N+1 côté front ?
5. Extension globale : validez-vous le pattern `Summary` pour **toutes** les réponses admin v1 à terme ?

---

## 10. Critères d'acceptation

- [ ] `GET /v1/admin/finance/transactions/{id}` : `order.ref` ≠ UUID complet
- [ ] Wallet `platform` : `owner.displayName` = libellé lisible, jamais UUID
- [ ] Transaction liée à une course : `order`, `partner`, `franchise`, `driver` peuplés quand les données existent
- [ ] `commissionBreakdown` présent sur les transactions de commission
- [ ] Liste transactions : mêmes enrichissements que le détail (pas de régression liste vs détail)
- [ ] Swagger mis à jour avec les schémas `*Summary`
- [ ] Tests : au moins un cas plateforme, un cas chauffeur, un cas partenaire

---

## 11. Références front

| Fichier | Rôle |
|---------|------|
| `src/features/finance/api/adminFinance.api.types.ts` | Types attendus |
| `src/features/finance/api/adminFinance.mapper.ts` | Résolution `partner_name`, `owner_name`, `order_ref` |
| `src/features/finance/pages/TransactionDetailPage.tsx` | Écran impacté |
| `src/features/admin/api/adminOrder.shared.ts` | Fallback `orderRef()` |
| `docs/PROBLEME-TRANSFERT-CHAUFFEUR-LIAISON-VEHICULE-2026-06-16.md` | Cas lié véhicule / chauffeur |
