# Demande backend — relever le plafond de pagination `limit` des routes liste (max 100 → 500)

**Date :** 24 juin 2026
**Portails concernés :** Admin, Franchise, Partenaire, Compta (toutes les listes paginées v1)
**Environnement observé :** préprod LIVE (`api.upjunoo-dev.tech`)
**Priorité :** moyenne — bloque l'affichage de plus de 100 lignes par page

---

## 1. Résumé du problème

Le back-office propose désormais des tailles de page jusqu'à **500 lignes** (sélecteur « Lignes / page » : 10 / 25 / 50 / 100 / **250 / 500**).

Mais quand l'opérateur choisit **250** ou **500**, le tableau **retombe systématiquement sur 100**.

**Cause :** le front envoie correctement `?limit=500`, mais l'API **plafonne `limit` à 100** et renvoie `pagination.limit: 100`. Le front reflète fidèlement cette valeur → le sélecteur revient à 100.

**Demande :** relever la borne maximale de `limit` à **500** (au lieu de 100) sur les routes liste v1, et **renvoyer la valeur réellement appliquée** dans `pagination.limit`.

---

## 2. Reproduction

```http
GET /v1/admin/orders?page=1&limit=500
Authorization: Bearer <JWT admin>
```

**Observé :**

```jsonc
{
  "status": "ok",
  "rides": [ /* … au plus 100 éléments … */ ],
  "pagination": {
    "page": 1,
    "limit": 100,        // ❌ on a demandé 500, le serveur renvoie 100
    "total": 342,
    "totalPages": 4
  }
}
```

**Attendu :**

```jsonc
{
  "status": "ok",
  "rides": [ /* … jusqu'à 500 éléments … */ ],
  "pagination": {
    "page": 1,
    "limit": 500,        // ✅ valeur demandée appliquée et renvoyée
    "total": 342,
    "totalPages": 1
  }
}
```

---

## 3. Côté front (déjà prêt)

Le front **n'écrête pas** : il transmet `limit` tel quel et se contente d'afficher ce que le serveur renvoie.

```ts
// src/core/api/v1Pagination.ts → buildV1ListQuery()
const limit = params.per_page ?? 25;
qs.set("limit", String(limit));            // envoie limit=500 sans clamp
```

```ts
// src/core/api/v1Pagination.ts → mapV1PaginationToMeta()
const perPage = pagination?.limit ?? fallback?.per_page ?? 25;  // recopie pagination.limit
```

La valeur affichée du sélecteur = `pagination.limit` renvoyé par l'API. **Rien à changer côté front** une fois le plafond serveur relevé.

---

## 4. Comportement attendu (règle)

| Cas | Attendu |
|-----|---------|
| `limit` absent | défaut **25** (inchangé) |
| `1 ≤ limit ≤ 500` | renvoyer **jusqu'à `limit`** éléments |
| `limit > 500` | borner à **500** (garde-fou) et renvoyer `pagination.limit: 500` |
| Dans tous les cas | `pagination.limit` = **valeur réellement appliquée** |

> **Important :** ne pas seulement « accepter » `limit=500` mais bien **renvoyer jusqu'à 500 lignes** et **échoer la valeur appliquée** dans `pagination.limit` (le front s'en sert pour caler le sélecteur).

---

## 5. Endpoints concernés

Toutes les **routes liste paginées v1** (même format `page` + `limit`). Au minimum :

| Domaine | Endpoint |
|---------|----------|
| Courses | `GET /v1/admin/orders` |
| Chauffeurs | `GET /v1/admin/drivers` |
| Véhicules | `GET /v1/admin/vehicles` |
| Clients | `GET /v1/admin/clients` |
| Finance | `GET /v1/admin/transactions`, `/withdrawals`, `/wallets`, `/commissions` |
| Réseau | `GET /v1/admin/franchises`, `/partners`, `/zones`, staff/comptables |
| Support | `GET /v1/admin/support/tickets`, audit |
| Franchise | équivalents `GET /v1/franchise/...` |
| Partenaire | équivalents `GET /v1/partner/...` |

> Idéalement, le plafond `limit` est défini **au niveau du middleware/validation de pagination partagé**, pour que toutes les routes liste en bénéficient d'un coup.

---

## 6. Critères d'acceptation

- [ ] `GET /v1/admin/orders?limit=500` renvoie jusqu'à **500** `rides` et `pagination.limit: 500`.
- [ ] `GET /v1/admin/orders?limit=250` renvoie jusqu'à **250** `rides` et `pagination.limit: 250`.
- [ ] `limit` absent → défaut 25 (inchangé).
- [ ] `limit > 500` → borné à 500, `pagination.limit: 500`.
- [ ] Même règle appliquée aux autres routes liste du §5.
- [ ] `total` / `totalPages` recalculés en cohérence avec le `limit` appliqué.

---

## 7. Impact si livré

- Les sélecteurs **250 / 500** du back-office fonctionnent (le tableau ne retombe plus sur 100).
- Moins de pagination manuelle pour les opérateurs sur les grosses listes (courses, chauffeurs, transactions).
- Aucune modification front nécessaire (déjà compatible).

---

## 8. Notes de prudence

- Conserver un **garde-fou à 500** (ne pas autoriser `limit` illimité) pour éviter des réponses trop lourdes.
- Vérifier la performance des requêtes à 500 (index, jointures `driver`/`partner`/`franchise` déjà présentes dans la réponse courses).
- Pas de changement de contrat attendu sur les autres champs de `pagination` (`page`, `total`, `totalPages`).
