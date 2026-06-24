# Demande backend — Configuration pricing complète depuis le backoffice

> **Date :** 2026-06-16  
> **Émetteur :** équipe front UpJunoo (admin, franchise, partenaire)  
> **Objectif :** le backoffice doit pouvoir **lire, créer, modifier, désactiver et auditer** l’intégralité des paramètres qui influencent le **prix client**, l’**estimation**, le **surge** et la **répartition post-course** — sans redeployer le front ni le backend.  
> **Swagger :** [https://api.upjunoo-dev.tech/docs](https://api.upjunoo-dev.tech/docs)

---

## 1. Contexte

Le prix d’une course UpJunoo dépend de plusieurs couches :

```
Estimation client / prix final
        │
        ├── Grille tarifaire (base, km, minute, minimum, frais fixes…)
        ├── Multiplicateurs (nuit, pluie, férié, surge zone…)
        ├── Contexte (zone, ville, franchise, partenaire, catégorie véhicule, service)
        └── Règles de commission (après course — liées au montant brut)
```

Aujourd’hui, le backoffice ne couvre qu’**une fraction** de ces paramètres. Le front compense avec des mocks, des valeurs par défaut et des champs non branchés.

**Demande :** merci de répondre point par point avec le **contrat JSON réel**, les **routes CRUD**, les **règles de fusion** et les **limites métier** pour que l’admin puisse **tout contrôler depuis l’UI**.

---

## 2. État actuel côté front (constat)

| Zone backoffice | Route UI | API branchée | Limite actuelle |
|-----------------|----------|--------------|-----------------|
| Grilles tarifaires (admin) | `/admin/settings/pricing` | `GET/POST/PATCH /v1/admin/pricing-rules` | Formulaire **réduit** (6 champs) ; pas de `GET …/{id}` |
| Grilles tarifaires (franchise) | `/franchise/pricing` | `GET/POST/PATCH /v1/franchises/{id}/pricing-rules` | Même formulaire réduit ; création franchise **partiellement** branchée |
| Règles commission | `/admin/finance/commission-rules` | `GET/POST/PATCH /v1/admin/commission-rules` | Mieux couvert, mais **séparé** du pricing course |
| Détail course | `/admin/ops/trips/{id}` | `GET /v1/admin/orders/{id}` | Bloc `pricing` / `receipt` **non documenté** ; fallback commission 15 % en dur côté front |
| Surge dispatch | Règles dispatch + zones | `dispatch-config`, zones | Surge zone ≠ surge tarifaire — pas unifié |
| Bonus performance | Non implémenté | — | Spec dans `docs/module_finance/01-bonus-engine.md` |
| Catalogue catégories | Hardcodé `ECO, CONFORT…` | `GET /v1/catalog/ride-categories` ? | À confirmer |

### Champs API `pricing-rules` **non exposés** dans le formulaire actuel

Le type front `ApiV1PricingRuleItem` connaît déjà ces champs — **l’UI ne les édite pas** :

| Champ API | Description | Éditable UI ? |
|-----------|-------------|---------------|
| `per_minute_xof` | Tarif à la minute (attente / course) | ❌ |
| `waiting_per_minute_xof` | Attente chauffeur | ❌ |
| `cancellation_fee_xof` | Frais d’annulation | ❌ |
| `night_multiplier` | Multiplicateur nuit | ⚠️ fusionné en un seul « surge » |
| `rain_multiplier` | Multiplicateur pluie | ❌ |
| `holiday_multiplier` | Multiplicateur jour férié | ❌ |
| `airport_fee_xof` | Supplément aéroport | ❌ |
| `toll_handling` | Gestion péages | ❌ |
| `delivery_mode_code` | Mode livraison | ❌ |
| `vehicle_type_code` | Type véhicule | ❌ |
| `effective_from` / `effective_to` | Période de validité | ❌ |
| `priority` | Priorité de résolution | ❌ |
| `metadata` | Extensions | ❌ |

### Services UI vs API

| Front `PricingForm` | API `service_type` |
|---------------------|-------------------|
| `taxi` → `RIDE` | OK |
| `delivery` → `DELIVERY` | OK |
| — | `DELIVERY_CARGO`, `FREIGHT`, `RENTAL` **absents du formulaire** |

---

## 3. Vision produit — ce que le backoffice doit pouvoir faire

### Admin central

- Voir **toutes** les grilles tarifaires (filtres : franchise, ville, zone, service, catégorie, statut).
- Créer / modifier / désactiver / dupliquer une règle.
- Définir **tous** les composants du prix (base, km, minute, minimum, frais, multiplicateurs).
- Gérer les **périodes d’effet** et la **priorité** entre règles concurrentes.
- Prévisualiser le **prix estimé** pour un trajet test (simulateur).
- Voir quelle règle a été **appliquée** sur une course passée (audit / debug).
- Configurer le **surge dynamique** (manuel, météo, zone, créneau horaire).
- Lier pricing et **commission** (montant brut → répartition) de façon traçable.

### Franchise

- Gérer les grilles **de son périmètre** (sans voir les autres franchises).
- Proposer des overrides locaux soumis à validation admin (workflow à définir).

### Partenaire (optionnel P2)

- Consulter les grilles applicables à sa flotte.
- Override partenaire si autorisé par la franchise.

---

## 4. Demande générale à l’équipe backend

Pour **chaque paramètre pricing**, merci de fournir :

1. **Nom du champ** (camelCase canonique + alias snake_case acceptés en entrée)
2. **Type**, **unité** (XOF, %, km, minute), **défaut**, **min/max**
3. **Périmètre** : `global` | `country` | `city` | `franchise` | `zone` | `partner` | `serviceType` | `categoryCode`
4. **Priorité de fusion** entre règles concurrentes
5. **Routes** lecture + écriture + **exemple JSON 200 complet**
6. **Règles de validation** (ex. `minimum_fare_xof >= base_fare_xof`)
7. **Audit log** à chaque modification
8. Impact **temps réel** vs cache / redémarrage

---

## PRICING-CONF-01 — Grilles tarifaires (`pricing-rules`)

### Routes existantes (à compléter / documenter)

| Méthode | Route | Statut front | Besoin |
|---------|-------|--------------|--------|
| `GET` | `/v1/admin/pricing-rules` | ✅ Branché | Filtres serveur (`franchiseId`, `cityId`, `zoneId`, `serviceType`, `active`) |
| `POST` | `/v1/admin/pricing-rules` | ✅ Branché | Valider body complet |
| `PATCH` | `/v1/admin/pricing-rules/{id}` | ✅ Branché | Tous les champs patchables |
| `GET` | `/v1/admin/pricing-rules/{id}` | ❌ **Manquant** | Le front charge toute la liste (limit 500) — **à ajouter** |
| `DELETE` | `/v1/admin/pricing-rules/{id}` | ❌ Non branché | Soft delete ou `active: false` ? |
| `POST` | `/v1/admin/pricing-rules/{id}/duplicate` | ❌ | Dupliquer une grille |
| `GET` | `/v1/franchises/{franchiseId}/pricing-rules` | ✅ Franchise | Même schéma, scope franchise |

### Routes supplémentaires demandées

| Méthode | Route | Besoin |
|---------|-------|--------|
| `GET` | `/v1/admin/pricing-config` | Document versionné global (comme `dispatch-config`) |
| `PUT` | `/v1/admin/pricing-config` | Paramètres transverses (arrondi, devise, TVA affichée…) |
| `PATCH` | `/v1/admin/pricing-config/countries/{code}` | Override pays |
| `PATCH` | `/v1/admin/pricing-config/franchises/{id}` | Defaults franchise |
| `PATCH` | `/v1/admin/pricing-config/zones/{zoneId}` | Surge / override zone |
| `GET` | `/v1/admin/pricing-rules/effective?…` | **Preview** règle résolue pour un contexte |
| `POST` | `/v1/admin/pricing-rules/simulate` | Calcul prix estimé (voir §7) |
| `GET` | `/v1/admin/orders/{orderId}/pricing-breakdown` | Détail ligne à ligne du prix appliqué |

---

## PRICING-PARAMS-01 — Paramètres configurables (liste exhaustive demandée)

> Merci de confirmer : **existe en base** | **en dur dans le code** | **à exposer**

### A. Composants du prix (grille)

| Paramètre | Description | Unité | Exemple |
|-----------|-------------|-------|---------|
| `baseFareXof` | Prise en charge | XOF | 500 |
| `perKmXof` | Par kilomètre | XOF/km | 350 |
| `perMinuteXof` | Par minute de course | XOF/min | 50 |
| `minimumFareXof` | Prix plancher | XOF | 1500 |
| `waitingPerMinuteXof` | Attente chauffeur | XOF/min | 75 |
| `cancellationFeeXof` | Annulation tardive | XOF | 500 |
| `airportFeeXof` | Supplément aéroport | XOF | 1000 |
| `tollHandling` | `included` \| `added_to_fare` \| `reimbursed` | enum | — |
| `roundingMode` | `nearest_50` \| `nearest_100` \| `ceil` | enum | nearest_100 |
| `roundingStepXof` | Pas d’arrondi | XOF | 100 |

### B. Multiplicateurs dynamiques

| Paramètre | Description | Unité |
|-----------|-------------|-------|
| `nightMultiplier` | Créneau nuit | × |
| `nightStartHour` / `nightEndHour` | Plage horaire nuit | HH:mm |
| `rainMultiplier` | Pluie (météo) | × |
| `holidayMultiplier` | Jours fériés | × |
| `surgeMultiplier` | Surge manuel / zone | × |
| `maxSurgeMultiplier` | Plafond surge | × |
| `surgeStep` | Incrément surge auto | × |

> **Question :** le `rain_multiplier` est-il piloté par `weather-config` ? Lien à documenter.

### C. Contexte d’application (scopes)

| Paramètre | Description |
|-----------|-------------|
| `franchiseId` | Franchise propriétaire |
| `cityId` | Ville |
| `zoneId` | Zone géographique (nullable = règle ville) |
| `partnerId` | Override partenaire (nullable) |
| `serviceType` | `RIDE`, `DELIVERY`, `DELIVERY_CARGO`, `FREIGHT`, `RENTAL` |
| `categoryCode` | `ECO`, `CONFORT`, `CONFORT+`, `PREMIUM`, … |
| `deliveryModeCode` | Mode livraison si applicable |
| `vehicleTypeCode` | Type véhicule si applicable |
| `ruleName` | Libellé admin |
| `active` | Actif / brouillon |
| `priority` | Résolution si plusieurs règles matchent |
| `effectiveFrom` / `effectiveTo` | Validité temporelle |

### D. Formule de calcul (à documenter par le backend)

Merci de fournir la **formule exacte** utilisée en production :

```
Prix estimé = f(
  distance_km,
  duration_min,
  waiting_min,
  base_fare,
  per_km,
  per_minute,
  multipliers[],
  fees[],
  minimum_fare,
  rounding
)
```

Exemple attendu dans la réponse backend :

```
estimated = max(
  minimum_fare,
  base_fare + (distance_km × per_km) + (duration_min × per_minute)
) × night_multiplier × rain_multiplier × surge_multiplier
  + airport_fee + tolls
→ arrondi(rounding_step)
```

### E. Commission (liée au pricing — périmètre distinct mais couplé)

Les **règles commission** (`/v1/admin/commission-rules`) s’appliquent sur le **montant brut** de la course. Le backoffice les gère déjà partiellement.

| Besoin | Détail |
|--------|--------|
| Lien pricing → commission | Sur une course, afficher **quelle grille pricing** + **quelle règle commission** ont été appliquées |
| Cohérence | Si `category_code` ou `service_type` diffère entre pricing et commission, quelle règle prime ? |
| Taux fixes + % | Déjà en API (`platform_rate`, `platform_fixed_xof`, …) — confirmer calcul combiné |

Référence cahier des charges : taux 15 % (fiscalité 2,3 % + franchise 3 % + partenaire 4 % + plateforme 5,7 %) — `docs/FINANCE-CONTEXT.md`.

### F. Promotions, codes promo, remises (à confirmer existence)

| Paramètre / entité | Description |
|--------------------|-------------|
| `promo_codes` | Code réduction client |
| `discountPercent` / `discountFixedXof` | Remise |
| `maxDiscountXof` | Plafond |
| `eligibleServiceTypes` | Services concernés |
| `fundedBy` | `platform` \| `franchise` \| `partner` |
| Impact commission | La commission se calcule sur le brut **avant** ou **après** remise ? |

> Si non implémenté : merci de le confirmer pour ne pas prévoir d’écrans fantômes.

### G. Bonus performance (hors prix course, mais module « rémunération »)

Spec front : `docs/module_finance/01-bonus-engine.md`.  
À traiter dans une phase séparée mais **mentionné** pour vision globale « tout contrôler depuis le backoffice ».

---

## PRICING-RESOLUTION-01 — Matrice de fusion des règles

Merci de documenter l’ordre de résolution quand plusieurs grilles matchent :

**Proposition (à valider / corriger) :**

```
1. partner + zone + service + category  (plus spécifique)
2. partner + city + service + category
3. franchise + zone + service + category
4. franchise + city + service + category
5. city + service + category
6. country + service + category
7. global + service + category
```

Pour chaque niveau : critère `priority` (entier) puis `effective_from` le plus récent.

**Route demandée :**

```http
GET /v1/admin/pricing-rules/effective
  ?pickupLat=5.35&pickupLng=-4.00
  &serviceType=RIDE
  &categoryCode=ECO
  &franchiseId=…
  &partnerId=…
  &at=2026-06-16T20:00:00Z
```

**Réponse attendue :**

```json
{
  "status": "ok",
  "resolvedRule": { "id": "…", "ruleName": "Ride ECO Cocody" },
  "resolvedFrom": ["global", "countries.CI", "franchises.xxx", "zones.cocody"],
  "components": {
    "baseFareXof": 500,
    "perKmXof": 350,
    "minimumFareXof": 1500,
    "nightMultiplier": 1.2
  },
  "multipliersApplied": ["night"]
}
```

---

## PRICING-SIMULATE-01 — Simulateur backoffice

Route demandée pour l’écran admin « Tester un tarif » :

```http
POST /v1/admin/pricing-rules/simulate
Content-Type: application/json

{
  "pickup": { "lat": 5.3599, "lng": -3.9876 },
  "dropoff": { "lat": 5.3200, "lng": -4.0200 },
  "serviceType": "RIDE",
  "categoryCode": "ECO",
  "franchiseId": "uuid",
  "partnerId": null,
  "scheduledAt": "2026-06-16T22:30:00Z",
  "weatherCode": "rain",
  "distanceKm": 8.5,
  "durationMin": 22
}
```

**Réponse attendue :**

```json
{
  "status": "ok",
  "estimatedPriceXof": 3850,
  "finalPriceXof": 3900,
  "breakdown": {
    "baseFareXof": 500,
    "distanceFareXof": 2975,
    "timeFareXof": 0,
    "subtotalXof": 3475,
    "nightMultiplier": 1.2,
    "surgeMultiplier": 1.0,
    "feesXof": 0,
    "minimumApplied": false,
    "roundingXof": 25
  },
  "appliedRuleId": "uuid",
  "appliedCommissionRuleId": "uuid",
  "commissionPreview": {
    "grossAmountXof": 3900,
    "totalCommissionXof": 585,
    "driverNetXof": 3315
  }
}
```

---

## PRICING-ORDER-01 — Traçabilité sur une course

Sur `GET /v1/admin/orders/{orderId}`, le front a besoin d’un bloc **`pricing`** structuré (au lieu d’un `Record<string, unknown>` opaque) :

```json
{
  "pricing": {
    "estimatedPriceXof": 3850,
    "finalPriceXof": 3900,
    "currency": "XOF",
    "appliedRule": {
      "id": "uuid",
      "ruleName": "Ride ECO Cocody",
      "franchiseId": "uuid",
      "zoneId": "uuid",
      "serviceType": "RIDE",
      "categoryCode": "ECO"
    },
    "breakdown": {
      "baseFareXof": 500,
      "perKmXof": 350,
      "distanceKm": 8.5,
      "distanceFareXof": 2975,
      "multipliers": {
        "night": 1.2,
        "rain": 1.0,
        "surge": 1.0
      },
      "fees": {
        "airportXof": 0,
        "tollXof": 0,
        "cancellationXof": 0
      },
      "minimumFareXof": 1500,
      "roundingXof": 25
    },
    "commissionRule": {
      "id": "uuid",
      "ruleName": "Commission CI standard"
    },
    "commissionBreakdown": {
      "grossAmountXof": 3900,
      "platformAmountXof": 222,
      "franchiseAmountXof": 117,
      "partnerAmountXof": 156,
      "fiscalityAmountXof": 90,
      "driverAmountXof": 3315
    }
  }
}
```

---

## PRICING-UI-01 — Écrans backoffice à alimenter

| Écran | Route | Contenu après réponse backend |
|-------|-------|-------------------------------|
| Liste grilles | `/admin/settings/pricing` | Filtres serveur, tous services, statuts |
| Création grille | `/admin/settings/pricing/new` | Formulaire **complet** (§5) |
| Édition grille | `/admin/settings/pricing/[id]` | Tous champs + période validité + priorité |
| Simulateur | `/admin/settings/pricing/simulate` (nouveau) | POST simulate |
| Config globale | Onglet dans pricing settings | `pricing-config` document |
| Overrides zone | Fiche zone réseau | Section tarifs + surge |
| Overrides franchise | Fiche franchise | Section pricing |
| Overrides partenaire | Fiche partenaire | Section pricing (lecture / édition selon RBAC) |
| Détail course | `/admin/ops/trips/[id]` | Bloc pricing breakdown structuré |
| Règles commission | `/admin/finance/commission-rules` | Lien explicite vers grille pricing associée |

### Permissions RBAC demandées

| Permission | Action |
|------------|--------|
| `settings.pricing.view` | Lecture grilles |
| `settings.pricing.edit` | Création / modification |
| `settings.pricing.simulate` | Simulateur |
| `settings.pricing.delete` | Désactivation / suppression |
| `settings.pricing.config` | Document global `pricing-config` |
| `finance.commission_rules.view` | Lecture commissions |
| `finance.commission_rules.edit` | Édition commissions |

---

## PRICING-SCHEMA-01 — Schéma JSON cible (proposition front)

```json
{
  "status": "ok",
  "generatedAt": "2026-06-16T12:00:00.000Z",
  "settingKey": "pricing.config",
  "schemaVersion": 1,
  "document": {
    "global": {
      "roundingMode": "nearest_100",
      "roundingStepXof": 100,
      "maxSurgeMultiplier": 3.0,
      "defaultCurrency": "XOF"
    },
    "countries": {
      "CI": {
        "nightStartHour": "22:00",
        "nightEndHour": "06:00"
      }
    },
    "franchises": {},
    "zones": {}
  },
  "items": [
    {
      "id": "uuid",
      "ruleName": "Ride ECO Cocody",
      "franchiseId": "uuid",
      "franchise": { "id": "uuid", "name": "Franchise Abidjan" },
      "cityId": "uuid",
      "city": { "id": "uuid", "name": "Abidjan" },
      "zoneId": "uuid",
      "zone": { "id": "uuid", "label": "Cocody" },
      "serviceType": "RIDE",
      "categoryCode": "ECO",
      "baseFareXof": 500,
      "perKmXof": 350,
      "perMinuteXof": 50,
      "minimumFareXof": 1500,
      "waitingPerMinuteXof": 75,
      "cancellationFeeXof": 500,
      "airportFeeXof": 1000,
      "tollHandling": "added_to_fare",
      "nightMultiplier": 1.2,
      "rainMultiplier": 1.15,
      "holidayMultiplier": 1.1,
      "priority": 10,
      "effectiveFrom": "2026-01-01T00:00:00Z",
      "effectiveTo": null,
      "active": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-06-16T00:00:00Z"
    }
  ]
}
```

> **Enrichissement demandé** : objets `franchise`, `city`, `zone` avec libellés (cf. `DEMANDE-BACKEND-ENRICHISSEMENT-ENTITES-LISIBLES-2026-06-16.md`) — pas d’UUID seuls dans les listes.

---

## PRICING-GAPS-01 — Écarts bloquants actuels (à corriger côté backend)

| # | Problème | Impact |
|---|----------|--------|
| 1 | Pas de `GET /v1/admin/pricing-rules/{id}` | Le front charge 500 règles pour éditer une fiche |
| 2 | Champs API non patchables depuis le front | `rain_multiplier`, `per_minute_xof`, etc. inaccessibles |
| 3 | `pricing` sur détail commande non structuré | Impossible d’afficher le détail tarifaire réel |
| 4 | Pas de simulateur | Admin ne peut pas tester un changement avant activation |
| 5 | Pas de doc formule + fusion | Risque d’écarts front / moteur réel |
| 6 | Services incomplets en UI | `DELIVERY_CARGO`, `FREIGHT`, `RENTAL` non gérés |
| 7 | Surge dispatch vs surge pricing | Deux systèmes — besoin d’alignement ou doc claire |
| 8 | Franchise create pricing | Body franchise ≠ body admin — harmoniser |
| 9 | Pas de DELETE / duplicate | Gestion cycle de vie incomplet |
| 10 | Commission fallback 15 % en dur (front) | `adminOrderDetail.mapper.ts` si API silencieuse |

---

## Questions ouvertes pour le backend

1. **Où vit la vérité du calcul prix** ? Service dédié, module orders, ou fonction SQL ?
2. **Estimation client** (`estimated_price_xof`) utilise-t-elle exactement les mêmes règles que le prix final ?
3. **Qui peut modifier** une grille : admin seul ou aussi franchise (avec workflow) ?
4. **`toll_handling`** : valeurs enum et impact sur le prix affiché chauffeur ?
5. **Météo** : `rain_multiplier` auto depuis `weather-config` ou manuel uniquement ?
6. **Promo codes** : existent-ils ? Sinon roadmap ?
7. **Historique** : versionning des grilles (voir ancienne version appliquée à une course du passé) ?
8. **Validation** : règles métier à l’enregistrement (min ≥ base, somme multiplicateurs ≤ maxSurge, etc.) ?
9. **Catalogue** : `category_code` et `service_type` — liste fermée ou catalogue dynamique ?
10. **`schemaVersion`** et politique de migration pour `pricing-config` ?

---

## Critères d’acceptation (livrable backend)

- [ ] `GET /v1/admin/pricing-rules/{id}` documenté avec exemple JSON complet
- [ ] Tous les champs de `pricing_rules` en base listés avec type et writable
- [ ] Formule de calcul documentée + exemple chiffré
- [ ] Matrice de fusion / priorité documentée
- [ ] `GET …/effective` ou équivalent pour preview contexte
- [ ] `POST …/simulate` pour test backoffice
- [ ] Bloc `pricing` structuré sur `GET /v1/admin/orders/{id}`
- [ ] Objets enrichis (`franchise`, `city`, `zone`) dans les listes
- [ ] Swagger mis à jour (request + response 200, pas seulement 401/403)
- [ ] Confirmation RBAC par action
- [ ] Événements audit-log sur create / update / deactivate

---

## Priorisation suggérée

| ID | Priorité | Sujet | Bloquant front |
|----|----------|-------|----------------|
| **PRICING-GAPS-01 #1** | **P0** | GET by id + filtres liste | Fiche édition fiable |
| **PRICING-PARAMS-01 A–C** | **P0** | Tous champs grille exposés | Formulaire complet |
| **PRICING-ORDER-01** | **P0** | Pricing breakdown commande | Détail course |
| **PRICING-RESOLUTION-01** | **P1** | Matrice fusion + effective | Debug admin |
| **PRICING-SIMULATE-01** | **P1** | Simulateur | Test avant prod |
| **PRICING-CONF-01** | **P1** | `pricing-config` document | Paramètres globaux |
| **PRICING-PARAMS-01 F** | **P2** | Promos | Si existant |
| **PRICING-UI franchise/partner** | **P2** | Overrides locaux | Portails |

---

## Références front (implémentation après réponse)

| Sujet | Fichiers |
|-------|----------|
| Types API pricing | `src/features/settings/api/adminPricing.api.types.ts` |
| Mapper | `src/features/settings/api/adminPricing.mapper.ts` |
| Service admin | `src/features/settings/api/pricing.service.ts` |
| Service franchise | `src/features/franchise/api/pricing.service.ts` |
| Formulaire | `src/features/settings/components/PricingForm.tsx` |
| Liste admin | `src/features/settings/pages/PricingListPage.tsx` |
| Règles commission | `src/features/finance/api/commissionRules.*` |
| Détail course / finance | `src/features/ops/api/adminOrderDetail.mapper.ts` |
| Finance contexte | `docs/FINANCE-CONTEXT.md` |
| Enrichissement entités | `docs/DEMANDE-BACKEND-ENRICHISSEMENT-ENTITES-LISIBLES-2026-06-16.md` |
| Dispatch / surge zones | `docs/dispatcher_caracteristique_for_front.md` |

---

## Livrables attendus de l’équipe backend

1. **Réponse structurée** (markdown ou OpenAPI) : liste **exhaustive** des paramètres pricing réels.
2. **Exemple copiable** `GET /v1/admin/pricing-rules` et `GET …/{id}`.
3. **Formule de calcul** + 2 exemples chiffrés (course jour, course nuit pluie).
4. **Spécification** simulate + effective + pricing sur commande.
5. **Matrice de fusion** pricing + lien avec commission rules.
6. **Roadmap** promo / bonus si hors périmètre immédiat.

---

*Document rédigé pour transmission à l’équipe / IA backend UpJunoo. Toute évolution de schéma doit incrémenter `schemaVersion` et préciser la rétrocompatibilité.*
