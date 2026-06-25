# UPJUNOO — Demandes Backend · Page Courses (Partenaire)

> Écarts confirmés sur l'endpoint liste des courses du portail partenaire, relevés lors de la revue UX/pagination de la page **Courses**. Le front a été corrigé pour ce qui était corrigeable côté client ; les 3 points ci-dessous **nécessitent une intervention backend**.

| | |
|---|---|
| **Date** | 25 juin 2026 |
| **Endpoint concerné** | `GET /v1/partners/{partnerId}/trips` |
| **Exemple sondé** | `…/trips?page=1&per_page=25&date_from=2026-06-19&date_to=2026-06-25` → `200 OK` |
| **partner_id** | `71a1aad7-ad23-41ca-a6d0-b904d5953271` |
| **Vérification** | Sonde runtime authentifiée (compte `dev.partner`, Chrome headless via le portail) — chaque paramètre piloté depuis l'UI et requête/réponse capturées le 25/06 |
| **Rapporteur** | Yao Ivan · Équipe Front |

> ✅ **Filtres confirmés fonctionnels** : **Période** (`date_from`/`date_to`) et **Statut** (toutes les valeurs `completed/cancelled/assigned/matching/requested/in_progress` sont honorées — testé : `cancelled`→74, `completed`→22, les autres→0 légitimement). Les 4 points ci-dessous sont les écarts **confirmés en runtime**.

---

## Contexte

La page Courses consomme `GET /v1/partners/{id}/trips`. La réponse renvoie `items`, `counters` et `pagination`. Trois incohérences empêchent un comportement correct de la pagination, des compteurs et du tri. Le front envoie déjà les paramètres attendus (`per_page`, `sort`, `order`) — il ne reste qu'à les honorer côté API.

---

## 🔴 DB-CRS-01 (P0) — `per_page` ignoré (limite figée à 20)

- **Demande** : respecter le paramètre `per_page` de la requête dans `pagination.limit` (valeurs attendues : 10, 25, 50, 100…).
- **Constat** : la requête envoie `per_page=25`, mais la réponse renvoie `"pagination": { "limit": 20, … }` et exactement **20 items**. La limite est **figée à 20** quelle que soit la valeur demandée.
  ```jsonc
  // Requête : ...&per_page=25
  "pagination": { "page": 1, "limit": 20, "total": 95, "hasMore": true }
  ```
- **✅ Confirmé en runtime** : requête pilotée `per_page=50` → réponse `"limit": 20`, 20 items. La limite reste figée à 20.
- **Impact** : le sélecteur « Lignes / page » est inopérant — choisir 25/50/100 n'a aucun effet, l'API renvoie toujours 20. (Le front a été corrigé pour **afficher honnêtement** la limite réelle, mais ne peut pas la changer.)
- **Réponse attendue** : `pagination.limit === per_page` (avec un plafond raisonnable, ex. `max 100`, documenté).

---

## 🔴 DB-CRS-02 (P0) — `counters` non filtrés par la plage de dates

- **Demande** : calculer les `counters` sur le **même périmètre filtré** que `items`/`pagination` (mêmes `date_from`/`date_to`/`status`/`search`).
- **Constat** : sur une requête filtrée `date_from=2026-06-19&date_to=2026-06-25`, les deux totaux divergent :
  ```jsonc
  "counters":   { "total": 101, "completed": 24, "cancelled": 77, "in_progress": 0, "requested": 0 }, // 24+77 = 101
  "pagination": { "total": 95, … }                                                                     // liste filtrée = 95
  ```
  Les `counters` semblent **globaux** (non filtrés par date) alors que la liste paginée l'est → l'écran affiche **101** dans les cartes KPI et **95** dans la liste.
- **Impact** : incohérence visible à l'utilisateur (KPI « Total courses » 101 vs « 95 courses enregistrées »). Impossible à réconcilier proprement côté front sans afficher un faux total.
- **Réponse attendue** : `counters.total` doit égaler `pagination.total` pour un même jeu de filtres, et la ventilation par statut doit refléter ce périmètre filtré.

---

## 🟠 DB-CRS-03 (P1) — Tri serveur (`sort` / `order`)

- **Demande** : accepter `?sort=<champ>&order=<asc|desc>` sur `GET /trips`.
- **Champs de tri attendus par le front** :
  | `sort` | Colonne UI |
  |---|---|
  | `ref` | Réf. |
  | `client_name` | Client |
  | `driver_name` | Chauffeur |
  | `amount_fcfa` | Montant |
  | `status` | Statut |
  | `created_at` | Créée le (tri par défaut, `desc`) |
- **Constat** : le tri ne peut se faire que sur la page affichée (20 lignes), ce qui est trompeur — le front a donc **désactivé le tri client** et l'a remplacé par un tri serveur. Le front envoie désormais `?sort=…&order=…`, mais il faut **confirmer que l'API les prend en compte** (sinon le tri reste sans effet visible).
- **Réponse attendue** : tri appliqué côté SQL sur l'ensemble du résultat filtré, avec `order` par défaut `desc` si non précisé. Confirmer la **liste exacte des champs triables** supportés.

---

## Récapitulatif

| Réf. | Priorité | Point | État front |
|---|---|---|---|
| DB-CRS-01 | 🔴 P0 | Honorer `per_page` (limite figée à 20) | Prêt — envoie `per_page`, affiche la limite réelle |
| DB-CRS-02 | 🔴 P0 | `counters` filtrés par dates (101 ≠ 95) | Prêt — affichera les compteurs corrigés tels quels |
| DB-CRS-03 | 🟠 P1 | Tri serveur `sort`/`order` | Prêt — envoie déjà `?sort=&order=` |

---

*Rapport établi par Yao Ivan · Équipe Front.*
