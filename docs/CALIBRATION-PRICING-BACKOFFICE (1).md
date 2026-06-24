# Calibration du moteur de prix — Référence backoffice (UPJUNOO)

> But : permettre au backoffice (et à l'IA qui le pilote) de **calibrer chaque paramètre du prix VTC / livraison** sans toucher au code.
> **Rien n'est figé en dur** : tous les barèmes, multiplicateurs, paliers, seuils et plages horaires listés ici sont stockés en base et modifiables à chaud.
> Source de vérité du code : `src/modules/pricing/` (config = `pricing.config.ts`, service = `pricing.config.service.ts`, calcul = `pricing.service.ts` + `pricing.engine.ts`).

---

## 0. Ce qu'il faut comprendre avant de calibrer

Le prix affiché à l'utilisateur **n'est jamais un nombre figé**. Il est recalculé à chaque devis selon cette chaîne :

```
prix_base (palier de distance)
   × multiplicateur contexte = trafic × météo × férié    ← plafonné à priceCapGlobal
   × surge (zone chaude OU tension offre/demande)        ← plafonné à priceCapGlobal
   + prime catégorie (Confort / Confort+ / Premium)
   → arrondi (roundStepXof)                              = "parité Yango"
   × (1 − décote concurrentielle %)                      = prix client
   + péage éventuel (non décoté)                         = PRIX FINAL
```

C'est pourquoi un même trajet peut passer de 4 600 à 10 300 F : ce n'est pas la destination, c'est le produit `contexte × surge` qui monte en heure de pointe / pénurie de chauffeurs.
Le **contexte** intègre désormais aussi un **coefficient jour férié** (×1,2–1,3 selon la fête) — voir §7.5. Les **jours ouvrables / weekend** ne sont pas une option à part : ils se règlent via le champ `days[]` des profils d'heures de pointe (§7.4).

> **Tout ce qui suit est calibrable.** Chaque coefficient de cette chaîne a un champ dédié.

---

## 1. Où vit la configuration

| Élément | Valeur |
|---|---|
| Table | `system_settings` |
| Clé | `pricing.config` |
| Format | JSON (document multi-pays, voir §3) |
| Cache | Redis `pricing:config:document`, **TTL 60 s** → un changement met **≤ 60 s** à se propager |
| Repli si vide | `buildDefaultPricingConfigDocument()` (valeurs par défaut codées comme **graine**, pas comme verrou) |

Trois autres jeux de données **adjacents** influencent le prix mais ne sont **pas** dans `pricing.config` (voir §8) :
- table `zones` → niveau de chaleur (`heatLevel`) et centre des zones
- tables `ref_toll_gates` / `ref_toll_gate_tariffs` → péages par classe de véhicule
- table `ref_holidays` → **jours fériés** (date + `coefficient` de majoration) — gérée via `/v1/admin/holidays` (§8.5)

---

## 2. Contrat HTTP (endpoints admin)

Préfixe API : **`/v1`** — toutes ces routes exigent un **JWT admin** (`requireAdmin`).

| Méthode | Route | Usage |
|---|---|---|
| `GET` | `/v1/admin/pricing-config?countryCode=CI` | Lire la config + la **vue résolue effective** |
| `GET` | `/v1/admin/settings/pricing?countryCode=CI` | Alias identique au précédent |
| `PUT` | `/v1/admin/pricing-config` | **Remplacer tout** le document (body = document complet) |
| `PATCH` | `/v1/admin/pricing-config/countries/:countryCode` | **Fusion partielle** d'un pays (recommandé pour calibrer) |

### Jours fériés (table `ref_holidays`)

| Méthode | Route | Usage |
|---|---|---|
| `GET` | `/v1/admin/holidays?countryCode=CI` | Lister les fériés (filtre pays optionnel). |
| `POST` | `/v1/admin/holidays` | Créer un férié : `{ countryCode, date:"YYYY-MM-DD", label, coefficient }`. |
| `PATCH` | `/v1/admin/holidays/:id` | Modifier (date / label / coefficient / active / countryCode). |
| `DELETE` | `/v1/admin/holidays/:id` | Désactiver (soft-delete `active=false`). |

> `countryCode` (ex. `CI`) est résolu en `country_id` côté serveur — tu n'as pas à manipuler l'UUID pays.
> Propagation : le moteur recharge les fériés au plus tard **≤ 60 s** après l'écriture.

### Réponse du GET (structure)

```jsonc
{
  "settingKey": "pricing.config",
  "schemaVersion": 3,
  "document":     { "...": "le JSON stocké (global + countries)" },
  "fromDatabase": true,            // false = on sert encore la graine par défaut
  "seedTemplate": { "...": "document par défaut complet (référence/reset)" },
  "effective":    { "...": "config RÉSOLUE pour countryCode (global ⊕ pays, prête à l'emploi)" }
}
```

- **`document`** = ce que tu édites.
- **`effective`** = ce que le moteur applique réellement pour ce pays (après fusion global → pays + valeurs par défaut). **C'est la vue à afficher dans l'UI** pour montrer les valeurs en vigueur.
- **`seedTemplate`** = gabarit complet par défaut, utile pour un bouton « réinitialiser ».

### Recommandation d'écriture

- Pour **calibrer un pays** sans risque : `PATCH /v1/admin/pricing-config/countries/CI` avec **uniquement les champs modifiés** (fusion profonde côté serveur).
- Pour un **reset global** ou un import complet : `PUT /v1/admin/pricing-config` avec le document entier.
- Après écriture, le cache est **invalidé automatiquement**.

---

## 3. Structure du document & héritage global → pays

```jsonc
{
  "schemaVersion": 3,
  "global":  { /* PricingCountryLayer : valeurs par défaut tous pays */ },
  "countries": {
    "CI": { /* surcharge Côte d'Ivoire (uniquement les champs à changer) */ },
    "SN": { /* ... */ }
  }
}
```

Règle de résolution pour un pays donné (`mergeCountryLayers`) :

1. On part de `global`.
2. On **fusionne en profondeur** `countries[CODE]` par-dessus (objet par objet).
3. **Exception `tripBands`** : si le pays définit un tableau `tripBands`, il **remplace entièrement** celui de `global` (pas de fusion élément par élément — c'est un remplacement de tableau).
4. Champs absents → valeur par défaut de la graine.

Pays pré-câblés (UEMOA) : `CI, SN, BF, ML, GN, TG, BJ`. Par défaut seul **CI** a des surcharges (primes & tarifs inter-villes calibrés Abidjan) ; les autres héritent de `global`.
Pays par défaut si non résolu : **`CI`** (`DEFAULT_COUNTRY_CODE`).

> **Résolution du pays d'un devis** : `countryCode` explicite → sinon `metadata.countryCode` → sinon déduit du `cityId` (`ref_cities.country_id`) → sinon `CI`.

### Conventions de saisie (tolérances du parseur)

- Les clés acceptent **camelCase** et **snake_case** (`perKmXof` ou `per_km_xof`).
- Booléens : `true/false`, ou `"true"/"false"`, ou `1/0`.
- Catégories : `CONFORTPLUS` / `CONFORT_PLUS` sont normalisés en **`CONFORT+`**. Les clés catégorie sont mises en **MAJUSCULES**.
- Valeur non numérique ou manquante → **repli sur la valeur par défaut** (jamais d'erreur, jamais 0 silencieux).

---

## 4. Paramètres généraux (niveau `global` ou `countries.CODE`)

| Champ | Type | Défaut | Plage utile | Effet sur le prix |
|---|---|---|---|---|
| `enabled` | bool | `true` | — | `false` = désactive le moteur paliers/zones et repasse en calcul « legacy » (barème unique). **Ne pas désactiver** en prod. |
| `competitorUndercutPct` | number (%) | `20` | **0 – 40** (borné) | Décote appliquée à la parité. 20 = on facture 80 % de la parité. ↑ = moins cher. |
| `roundStepXof` | number | `50` | 25 / 50 / 100 | Pas d'arrondi du prix final (arrondi **au supérieur**). |
| `priceCapGlobal` | number | `2.5` | 1.5 – 3.0 | **Plafond absolu** de tous les multiplicateurs (contexte, surge, et leur produit). Le garde-fou anti-explosion. |
| `hybridRoutingEnabled` | bool | `true` | — | Active le routage hybride (distance/durée réelle). N'agit pas directement sur le barème. |
| `defaultApproach.approachKm` | number (km) | `1.5` | 0 – 5 | Distance chauffeur→client facturée en prise en charge si non fournie par l'app. |
| `defaultApproach.approachMin` | number (min) | `4` | 0 – 15 | Idem en minutes. |
| `trafficMultipliers` | map | voir §5 | — | Coefficients prix selon le niveau de trafic. |
| `weatherMultipliers` | map | voir §5 | — | Coefficients prix selon la météo. |
| `tripBands[]` | tableau | voir §6 | — | **Le cœur du barème** : paliers de distance. |
| `zonePolicy` | objet | voir §7.1 | — | Détection « même zone » / hyper-local. |
| `hotZonePolicy` | objet | voir §7.2 | — | Zones chaudes (surge géographique). |
| `supplyDemandPolicy` | objet | voir §7.3 | — | Surge tension offre/demande. |
| `trafficPolicy` | objet | voir §7.4 | — | Heures de pointe, baseline urbaine, inférence trafic. **Jours ouvrables/weekend ici** (`days[]`). |
| `holidayPolicy` | objet | voir §7.5 | — | Majoration jour férié (coefficient lu dans `ref_holidays`). |

---

## 5. Multiplicateurs trafic & météo

Maps `niveau → coefficient`. **Tu peux ajouter/retirer des clés librement** (clés en minuscules).

### `trafficMultipliers` (défaut)

| Clé | Défaut | Sens |
|---|---|---|
| `fluid` | `0.95` | Circulation fluide (léger rabais) |
| `normal` | `1` | Référence |
| `dense` | `1.2` | Trafic dense |
| `blocked` | `1.45` | Embouteillé |

### `weatherMultipliers` (défaut)

| Clé | Défaut | Sens |
|---|---|---|
| `clear` | `1` | Dégagé |
| `rain` | `1.15` | Pluie |
| `storm` | `1.35` | Orage |
| `heat` | `1.1` | Forte chaleur |

> Contexte final = `min( trafficMult × weatherMult , priceCapGlobal )`.
> La **météo** est résolue automatiquement (service météo sur le point de prise en charge) ; le **niveau de trafic** dépend de `trafficPolicy` (§7.4).

---

## 6. `tripBands[]` — le barème par palier de distance (**le plus important**)

C'est ici qu'on calibre le prix « de base ». Le moteur choisit **un seul** palier selon la distance (et la notion de même zone). Ordre d'évaluation = ordre du tableau.

### Sélection du palier (`resolveTripBand`)

- Un palier avec `sameZoneRequired: true` ne s'active que si : `distanceKm ≤ zonePolicy.sameZoneMaxDistanceKm` **ET** (`distanceKm ≤ maxDistanceKm`) **ET** (départ/arrivée dans la même zone **OU** repli durée si `hyperLocalDurationFallbackEnabled` et `durée ≤ hyperLocalMaxDurationMin`).
- Un palier « normal » s'active si `minDistanceKm ≤ distanceKm ≤ maxDistanceKm` (bornes `null` = pas de borne).
- Si rien ne matche → **dernier palier** du tableau.

### Champs d'un palier

| Champ | Type | Sens |
|---|---|---|
| `id` | string | Identifiant (`hyper_local`, `short`, `long`, `intercity`…). Sert aussi à la logique : **`intercity` neutralise le surge** (cf. §9). |
| `label` | string | Libellé affichable. |
| `minDistanceKm` | number\|null | Borne basse (km). `null`/absent = pas de borne basse. |
| `maxDistanceKm` | number\|null | Borne haute (km). `null` = illimité (le dernier palier). |
| `sameZoneRequired` | bool | `true` = palier réservé aux trajets intra-zone (hyper-local). |
| `tariffs` | objet | Barème du palier (table ci-dessous). |
| `categoryPremiumsXof` | map | Prime **forfaitaire** ajoutée par catégorie (ECO toujours 0). |

### `tariffs` d'un palier

| Champ | Type | Sens |
|---|---|---|
| `baseFareXof` | XOF | Prise en charge fixe du palier. |
| `perKmXof` | XOF/km | Tarif kilométrique. |
| `perMinuteXof` | XOF/min | Tarif horaire (sur durée **facturée**, après multiplicateur durée). |
| `minimumFareXof` | XOF | Plancher (le prix avant décote ne descend jamais sous `minimumFare + prime`). |
| `pickupBaseXof` | XOF | Part fixe de l'approche chauffeur. |
| `pickupPerKmXof` | XOF/km | Part km de l'approche. |
| `pickupPerMinuteXof` | XOF/min | Part min de l'approche. |

### Valeurs par défaut des 4 paliers (graine)

| id | distance | base | /km | /min | min | pickupBase | pickup/km | pickup/min |
|---|---|---|---|---|---|---|---|---|
| `hyper_local` | ≤ 4 km, même zone | 300 | 50 | 18 | 0 | 300 | 30 | 10 |
| `short` | ≤ 8 km | 600 | 180 | 40 | 0 | 500 | 50 | 15 |
| `long` | 8 – 25 km | 500 | 145 | 30 | 0 | 500 | 50 | 15 |
| `intercity` | > 25 km | 500 | 175 | 28 | 0 | 500 | 50 | 15 |

**Surcharge CI en vigueur** (dans `countries.CI`) :
- `intercity` → `perKmXof: 270`, `perMinuteXof: 32` (calibré Abidjan↔intérieur).
- Primes catégorie ajustées (voir ci-dessous).

### `categoryPremiumsXof` — primes forfaitaires par catégorie

Ajoutées **après** le multiplicateur, **avant** la décote (donc la prime est elle aussi décotée de `competitorUndercutPct`).

Catégories reconnues : `ECO` (toujours 0), `CONFORT`, `CONFORT+`, `PREMIUM`.

| Palier | ECO | CONFORT | CONFORT+ | PREMIUM | Contexte |
|---|---|---|---|---|---|
| `hyper_local` (défaut) | 0 | 100 | 200 | 400 | générique |
| `short` / `long` (défaut UEMOA) | 0 | 200 | 300 | 1200 | générique |
| `long` **CI** | 0 | 200 | 300 | **1800** | calibré Abidjan |
| `intercity` (défaut UEMOA) | 0 | 1200 | 3300 | 13500 | générique |
| `intercity` **CI** | 0 | **3200** | **5900** | **17300** | calibré Abidjan |

> Tu peux **ajouter des catégories** (ex. `"VAN": 2500`) : la clé est libre, mise en MAJUSCULES, `CONFORTPLUS`→`CONFORT+`.

---

## 7. Politiques dynamiques (surge & trafic)

### 7.1 `zonePolicy` — détection de zone / hyper-local

| Champ | Type | Défaut | Effet |
|---|---|---|---|
| `enabled` | bool | `true` | Active la détection même-zone (palier hyper-local). |
| `sameZoneMaxDistanceKm` | km | `4` | Distance max pour considérer un trajet « intra-zone ». |
| `zoneMatchRadiusKm` | km | `2.5` | Rayon de rattachement d'un point à la zone la plus proche. |
| `hyperLocalDurationFallbackEnabled` | bool | `true` | Autorise l'hyper-local même hors même-zone si trajet très court. |
| `hyperLocalMaxDurationMin` | min | `6` | Seuil de durée du repli ci-dessus. |

### 7.2 `hotZonePolicy` — zones chaudes (surge géographique)

| Champ | Type | Défaut | Effet |
|---|---|---|---|
| `enabled` | bool | `true` | Active le surge par zone chaude. |
| `zoneMatchRadiusKm` | km | `2.5` | Rayon de rattachement à une zone chaude. |
| `heatMultipliers` | map `0..5 → coef` | `{0:1, 1:1.1, 2:1.2, 3:1.3, 4:1.45, 5:1.6}` | Coefficient prix par niveau de chaleur. Clés bornées **0 à 5**. |
| `incrementPerHeatLevel` | number | `0.1` | Coef de repli si un niveau n'est pas dans la map : `1 + niveau × increment`. |
| `combineMode` | enum | `max` | Comment combiner surge zone et surge offre/demande (voir §9). Valeurs : `max`, `multiply`, `heat_only`, `supply_demand_only`. |
| `useLiveDemandHeat` | bool | `true` | Recalcule le niveau de chaleur depuis le ratio demande/offre **live** (prend le max avec le niveau stocké en base de la zone). |
| `liveHeatRatioTiers` | tableau | `[{0.5→0},{1→2},{1.5→3},{2→4},{999→5}]` | Conversion ratio→niveau de chaleur live. Trié par `maxRatio` croissant. |

> Le **niveau de chaleur « statique » d'une zone** se règle dans la table `zones` (`config_json.heatLevel`), pas ici — voir §8.

### 7.3 `supplyDemandPolicy` — surge tension offre/demande

| Champ | Type | Défaut | Effet |
|---|---|---|---|
| `enabled` | bool | `true` | Active le surge offre/demande. |
| `pendingLookbackMin` | min | `15` | Fenêtre de comptage des demandes récentes (rides + livraisons en `requested/dispatching/no_driver`). |
| `supplyRadiusKm` | km | `5` | Rayon autour du départ pour compter demandes **et** chauffeurs disponibles. |
| `ratioTiers` | tableau | voir ci-dessous | Conversion `ratio = demandes/chauffeurs` → multiplicateur. |

`ratioTiers` par défaut (trié par `maxRatio` croissant ; on prend le premier palier dont `ratio ≤ maxRatio`) :

| maxRatio | multiplier |
|---|---|
| 1 | 1 |
| 1.5 | 1.1 |
| 2 | 1.2 |
| 3 | 1.3 |
| 999 | 1.38 |

### 7.4 `trafficPolicy` — heures de pointe & inférence trafic

| Champ | Type | Défaut | Effet |
|---|---|---|---|
| `enabled` | bool | `true` | Active toute la logique trafic. `false` = trafic = `defaultTrafficLevel` brut. |
| `autoResolve` | bool | `true` | `true` = le serveur décide le trafic (ignore `metadata.traffic` envoyé par l'app). |
| `defaultTrafficLevel` | string | `normal` | Niveau de base si aucune règle ne matche (doit exister dans `trafficMultipliers`). |
| `urbanBaselineEnabled` | bool | `true` | Gonfle la **durée** des trajets urbains longs. |
| `urbanBaselineMinDistanceKm` | km | `5` | Seuil de distance pour appliquer la baseline urbaine. |
| `urbanBaselineDurationMultiplier` | number | `1.35` | Multiplicateur de **durée** appliqué (≥ seuil). |
| `inferFromSupplyDemand` | bool | `true` | Déduit `dense`/`blocked` du ratio offre/demande. |
| `supplyDenseRatioThreshold` | number | `1.2` | Ratio ≥ → trafic `dense`. |
| `supplyBlockedRatioThreshold` | number | `2` | Ratio ≥ → trafic `blocked`. |
| `maxDurationMultiplier` | number | `1.6` | **Plafond** du multiplicateur de durée (toutes sources cumulées). |
| `peakHourProfiles[]` | tableau | voir ci-dessous | Profils d'heures de pointe (par zone/horaire). |

> ⚠️ Si une source trafic **temps réel** (Mapbox) fournit la durée, le multiplicateur de durée retombe à **1** (on ne re-gonfle pas une durée déjà réelle).

#### Champs d'un `peakHourProfile`

| Champ | Type | Sens |
|---|---|---|
| `id` | string | Identifiant du profil. |
| `label` | string | Libellé. |
| `hours` | number[] | Heures concernées (0–23). Vide = toutes. |
| `days` | number[] (option) | Jours concernés (0 = dimanche … 6 = samedi). Vide = tous. |
| `zoneCode` / `zoneCodes` | string / string[] | Zone(s) de départ ciblée(s) (code zone en MAJUSCULES). Vide = toutes zones. |
| `trafficLevel` | string | Niveau de trafic forcé (`dense`, `blocked`…) → utilise son coef de `trafficMultipliers`. |
| `durationMultiplier` | number | Multiplicateur de **durée** du profil (le plus élevé gagne si plusieurs matchent). |
| `priceMultiplier` | number\|null | Si défini, **force** le coef prix du profil au lieu de celui de `trafficLevel`. |

#### Profils par défaut (graine)

| id | zone | heures | trafficLevel | durationMult |
|---|---|---|---|---|
| `abidjan_morning` | (toutes) | 7,8,9 | dense | 1.35 |
| `abidjan_evening` | (toutes) | 17,18,19 | dense | 1.40 |
| `plateau_peak` | PLATEAU | 7-9 / 17-19 | dense | 1.35 |
| `cocody_peak` | COCODY | 7-9 / 17-19 | dense | 1.30 |
| `adjame_peak` | ADJAME | 7-9 / 17-19 | **blocked** | 1.45 |
| `yopougon_peak` | YOPOUGON | 7-9 / 17-19 | dense | 1.25 |

> 🗓️ **Jours ouvrables vs weekend** : c'est le champ `days[]` d'un profil qui le porte (0 = dimanche … 6 = samedi).
> Un profil sans `days` s'applique **tous les jours**. Exemples :
> - Pointe **uniquement en semaine** → `"days": [1,2,3,4,5]`.
> - Profil **weekend** (tarif/ETA différents) → `"days": [0,6]`.
> Le moteur compare le jour de la semaine de l'instant du devis (`scheduledAt` si fourni, sinon maintenant).

### 7.5 `holidayPolicy` — majoration jour férié

Active une majoration les jours fériés. Le **coefficient vient de la table `ref_holidays`** (par date, par pays), pas de `pricing.config` : on calibre *quand* et *de combien* dans `ref_holidays` (§8.5), et *si la mécanique est active* ici.

| Champ | Type | Défaut | Effet |
|---|---|---|---|
| `enabled` | bool | `true` | Active la lecture de `ref_holidays` et l'application du coefficient. `false` = jamais de majoration férié. |
| `applyToDelivery` | bool | `true` | Applique aussi la majoration aux livraisons (`DELIVERY_CARGO`). `false` = VTC seulement. |
| `maxCoefficient` | number | `2` | **Plafond** du coefficient férié (garde-fou anti-saisie : un `coefficient` de 5 en base sera ramené à 2). |

**Comment ça s'applique** : si la date du devis (fuseau du pays) correspond à un férié **actif**, son `coefficient` multiplie le **multiplicateur de contexte** (au même titre que trafic/météo). Il reste donc **borné par `priceCapGlobal`** — un férié ne peut pas faire exploser un prix déjà tendu (pointe + pluie + pénurie).

- Hors férié → coefficient `1` (aucun effet).
- Les fériés sont des **dates fixes** (Noël, Fête Nationale…). Les **fêtes mobiles** (Aïd, Lundi de Pâques, Ascension…) doivent être **saisies à leur date** chaque année via `/v1/admin/holidays`.
- Champs exposés dans la réponse d'estimation : `context.holidayApplied`, `context.holidayCoefficient`, `context.holidayLabel`.

---

## 8. Données adjacentes qui touchent le prix (hors `pricing.config`)

### 8.1 Zones — `zones` (niveau de chaleur statique + géométrie)

| Colonne | Sens |
|---|---|
| `code` | Code zone (référencé par `peakHourProfiles.zoneCode` et la détection). |
| `label` | Libellé. |
| `city_id` | Ville (filtre de résolution). |
| `active` | Doit être `true` pour être prise en compte. |
| `config_json.center.{lat,lng}` | Centre de la zone (rattachement par rayon). |
| `config_json.heatLevel` | **Niveau de chaleur 0–5** de la zone (surge géographique statique). |

> Pour « chauffer » manuellement un quartier (ex. aéroport un soir d'événement) : monter `heatLevel` de la zone → `hotZoneMultiplier` correspondant via `heatMultipliers`.

### 8.2 Péages — `ref_toll_gates` + `ref_toll_gate_tariffs`

Ajoutés au prix **en pass-through** (non décotés) si `PRICING_TOLL_PASSTHROUGH_ENABLED` et que l'itinéraire traverse un poste.

| Table / colonne | Sens |
|---|---|
| `ref_toll_gates.code / label` | Poste de péage. |
| `ref_toll_gates.geometry` | Tracé du poste (détection sur l'itinéraire). |
| `ref_toll_gates.amount_xof` | Montant historique (repli). |
| `ref_toll_gates.active` | Actif. |
| `ref_toll_gate_tariffs.vehicle_class` | **Classe de véhicule** (1, 2, …). |
| `ref_toll_gate_tariffs.amount_xof` | Montant pour cette classe. |
| `ref_toll_gate_tariffs.effective_from / effective_to` | Période de validité (on lit le dernier tarif effectif ; repli classe 1 puis `amount_xof` du poste). |

### 8.3 Barème « legacy » — `pricing_rules` (CRUD admin `/v1/admin/pricing-rules`)

Utilisé uniquement quand le moteur paliers est **désactivé** (`enabled:false`) ou pour `DELIVERY_CARGO` sans paliers. Colonnes : `base_fare_xof`, `per_km_xof`, `per_minute_xof`, `minimum_fare_xof`, `service_type`, `category_code`, `active`, `priority`, `effective_from`. En usage normal VTC, **ce n'est pas la source du prix** (les `tripBands` priment).

### 8.4 Variables d'environnement (bornes globales — serveur)

Ces valeurs servent de **défaut** quand la config DB ne les fixe pas ; la config DB **prime** toujours.

| Variable | Défaut | Rôle |
|---|---|---|
| `PRICE_CAP_GLOBAL` | `2.5` | Plafond multiplicateurs (= `priceCapGlobal` par défaut). |
| `PRICING_COMPETITOR_UNDERCUT_PCT` | `20` | Décote par défaut (borné 0–40). |
| `PRICING_HYBRID_ROUTING_ENABLED` | — | Routage hybride par défaut. |
| `PRICING_TOLL_PASSTHROUGH_ENABLED` | — | Active l'ajout des péages. |
| `DEFAULT_COUNTRY_CODE` | `CI` | Pays par défaut. |
| `SURGE_RECOMPUTE_INTERVAL` | `30` | Fréquence (s) de recalcul du surge en arrière-plan. |

### 8.5 Jours fériés — `ref_holidays` (majoration de prix)

La **mécanique** (on/off, livraison, plafond) est dans `holidayPolicy` (§7.5) ; le **calendrier et le montant** sont ici. Gérée via `/v1/admin/holidays` (§2).

| Colonne | Sens |
|---|---|
| `country_id` | Pays (résolu depuis `countryCode` côté API). |
| `date` | Date du férié (`YYYY-MM-DD`). Comparée à la date locale du devis. |
| `label` | Libellé (ex. « Fête Nationale »). Renvoyé dans `context.holidayLabel`. |
| `coefficient` | **Multiplicateur de prix** ce jour-là (ex. `1.30`). Borné par `holidayPolicy.maxCoefficient`. `1` = neutre. |
| `active` | Doit être `true` pour s'appliquer (le DELETE le passe à `false`). |

**Fériés CI 2026 déjà en base** : Jour de l'An (×1,25), Fête du Travail (×1,20), Fête Nationale 7 août (×1,30), Assomption (×1,20), Toussaint (×1,20), Noël (×1,30).
⚠️ Les **fêtes mobiles** (Aïd el-Fitr/Kébir, Lundi de Pâques, Ascension, Pentecôte…) ne sont **pas** pré-remplies : les ajouter chaque année à leur date.

---

## 9. La formule exacte, étape par étape

Pour un **VTC** avec moteur paliers actif (cas normal) :

1. **Pays** résolu (`countryCode` → `metadata` → `cityId` → `CI`).
2. **Config** = `global` ⊕ `countries[pays]` (fusion profonde, tripBands remplacés si présents).
3. **Route** : `distanceKm`, `durée_base` (routing réel ou itinéraire imposé).
4. **Météo** résolue sur le point de départ → `weatherMult`.
5. **Zones** : zone départ/arrivée, `sameZone`, `heatLevel` de la zone de départ.
6. **Offre/demande** : `demandes` (rides+livraisons récentes ≤ `supplyRadiusKm`) / `chauffeurs dispos` → `ratio` → `surge_offre_demande` (via `ratioTiers`).
7. **Trafic** : niveau (auto/défaut → profil de pointe matchant `hours[]`/`days[]` → inférence offre/demande) ; `durationMultiplier` (baseline urbaine + profil, plafonné `maxDurationMultiplier`, =1 si durée temps réel) ; `priceTrafficMult`. **`contexte = min(priceTrafficMult × weatherMult , priceCapGlobal)`**.
   7bis. **Férié** (§7.5) : si la date locale du devis est un férié actif et `holidayPolicy.enabled` → `contexte = min(contexte × coefficient_férié , priceCapGlobal)`.
8. **Durée facturée** = `durée_base × durationMultiplier`.
9. **Chaleur live** : `heatLevel = max(heatLevel_zone, niveau_depuis_ratio)` → `hotZoneMultiplier` (via `heatMultipliers`).
10. **Surge combiné** = `combineSurge(surge_offre_demande, hotZoneMultiplier)` selon `combineMode`, plafonné `priceCapGlobal`.
11. **Palier** = `resolveTripBand(distance, durée_base, zone)`. **Si `intercity` → surge forcé à 1** (la rareté urbaine du départ ne doit pas multiplier 200 km de route ; météo/trafic restent appliqués).
12. **Sous-total** (catégorie ECO) = `base + round(distance×perKm) + round(durée_fact×perMin) + round(pickupBase + approachKm×pickupPerKm + approachMin×pickupPerMin)`.
13. **Multiplicateur combiné** = `min( contexte × surge , priceCapGlobal )` — *le plafond s'applique au **produit**, pas à chaque facteur, pour éviter un cap²*. Rappel : `contexte = trafic × météo × férié` (étapes 7 & 7bis).
14. **Parité** = `roundStep( max( sous-total × mult + prime_catégorie , minimumFare + prime_catégorie ) , roundStepXof )`.
15. **Prix client** = `roundStep( parité × (1 − competitorUndercutPct/100) , roundStepXof )`.
16. **+ Péage** (si applicable) : ajouté au prix **et** à la parité, **non décoté**.

> Livraison `DELIVERY_CARGO` : chemin « legacy » (barème unique `pricing_rules` ou repli interne), sans paliers ni surge zone — seuls contexte et surge offre/demande s'appliquent.

---

## 10. Exemple chiffré (le trajet Cocody → Bingerville)

Données : **19,7 km**, durée facturée **48 min**, catégorie **Confort**, palier **`long`** (CI), `roundStep` 50, décote 20 %.

Sous-total ECO :
```
base 500 + (19,7×145=2 857) + (48×30=1 440) + pickup(500 + 1,5×50 + 4×15 = 635) = 5 432
```

| Conditions | mult combiné | Parité ECO | Prix ECO | Prix Confort (+200 prime) |
|---|---|---|---|---|
| Heure creuse, chauffeurs dispos | **1,0** | 5 432 → 5 450 | **≈ 4 350** | ≈ 4 550 |
| Pointe matin + surge (≈ ×2,33) | **2,33** | ≈ 12 680 | **≈ 10 150** | **≈ 10 300** |

C'est exactement l'écart observé. Les leviers pour le réduire : baisser `durationMultiplier`/`priceMultiplier` du profil `abidjan_morning`, abaisser `heatMultipliers`, durcir les seuils `supplyDense/BlockedRatioThreshold`, ou baisser `priceCapGlobal`.

---

## 11. Exemples de payloads prêts à l'emploi

### A. Adoucir l'heure de pointe du matin (CI)

`PATCH /v1/admin/pricing-config/countries/CI`
```json
{
  "trafficPolicy": {
    "peakHourProfiles": [
      { "id": "abidjan_morning", "label": "Abidjan pointe matin", "hours": [7,8,9],
        "trafficLevel": "dense", "durationMultiplier": 1.2, "priceMultiplier": 1.1 }
    ]
  }
}
```
> ⚠️ `peakHourProfiles` est un **tableau positionnel** : pour n'en modifier qu'un, renvoie la **liste complète** dans l'ordre voulu (sinon les profils suivants gardent leurs valeurs par index mais l'ordre compte).

### B. Plafonner plus bas le surge global (CI)

```json
{ "priceCapGlobal": 2.0 }
```

### C. Réduire la décote (facturer plus cher) (CI)

```json
{ "competitorUndercutPct": 12 }
```

### D. Recalibrer le palier « long » (CI)

```json
{
  "tripBands": [
    { "id": "hyper_local", "label": "Hyper-local (même zone, ≤4 km)", "maxDistanceKm": 4, "sameZoneRequired": true,
      "tariffs": { "baseFareXof": 300, "perKmXof": 50, "perMinuteXof": 18, "minimumFareXof": 0, "pickupBaseXof": 300, "pickupPerKmXof": 30, "pickupPerMinuteXof": 10 },
      "categoryPremiumsXof": { "ECO": 0, "CONFORT": 100, "CONFORT+": 200, "PREMIUM": 400 } },
    { "id": "short", "label": "Court inter-quartiers (≤8 km)", "maxDistanceKm": 8, "sameZoneRequired": false,
      "tariffs": { "baseFareXof": 600, "perKmXof": 180, "perMinuteXof": 40, "minimumFareXof": 0, "pickupBaseXof": 500, "pickupPerKmXof": 50, "pickupPerMinuteXof": 15 },
      "categoryPremiumsXof": { "ECO": 0, "CONFORT": 200, "CONFORT+": 300, "PREMIUM": 1200 } },
    { "id": "long", "label": "Long urbain (8–25 km)", "maxDistanceKm": 25, "sameZoneRequired": false,
      "tariffs": { "baseFareXof": 500, "perKmXof": 130, "perMinuteXof": 28, "minimumFareXof": 0, "pickupBaseXof": 500, "pickupPerKmXof": 50, "pickupPerMinuteXof": 15 },
      "categoryPremiumsXof": { "ECO": 0, "CONFORT": 200, "CONFORT+": 300, "PREMIUM": 1800 } },
    { "id": "intercity", "label": "Inter-villes (>25 km)", "minDistanceKm": 25, "maxDistanceKm": null, "sameZoneRequired": false,
      "tariffs": { "baseFareXof": 500, "perKmXof": 270, "perMinuteXof": 32, "minimumFareXof": 0, "pickupBaseXof": 500, "pickupPerKmXof": 50, "pickupPerMinuteXof": 15 },
      "categoryPremiumsXof": { "ECO": 0, "CONFORT": 3200, "CONFORT+": 5900, "PREMIUM": 17300 } }
  ]
}
```
> Rappel : `tripBands` **remplace tout le tableau** — toujours renvoyer les 4 paliers.

### E. Couper temporairement tout le surge (mode « prix plancher »)

```json
{
  "hotZonePolicy": { "enabled": false },
  "supplyDemandPolicy": { "enabled": false }
}
```

### F. Profil de pointe **uniquement en semaine** (jours ouvrables)

`PATCH /v1/admin/pricing-config/countries/CI` — ajoute `days` au profil (semaine = lun→ven).
```json
{
  "trafficPolicy": {
    "peakHourProfiles": [
      { "id": "abidjan_morning", "label": "Abidjan pointe matin (semaine)", "hours": [7,8,9], "days": [1,2,3,4,5], "trafficLevel": "dense", "durationMultiplier": 1.35 },
      { "id": "abidjan_evening", "label": "Abidjan pointe soir (semaine)", "hours": [17,18,19], "days": [1,2,3,4,5], "trafficLevel": "dense", "durationMultiplier": 1.40 }
    ]
  }
}
```
> Pour un tarif **weekend** distinct, ajoute un profil avec `"days": [0,6]`.

### G. Régler la mécanique des jours fériés (`holidayPolicy`)

```json
{ "holidayPolicy": { "enabled": true, "applyToDelivery": true, "maxCoefficient": 1.5 } }
```

### H. Ajouter / modifier un jour férié (table `ref_holidays`, pas `pricing.config`)

Créer (ex. Aïd el-Kébir 2026, +25 %) :
`POST /v1/admin/holidays`
```json
{ "countryCode": "CI", "date": "2026-05-27", "label": "Aïd el-Kébir", "coefficient": 1.25 }
```
Modifier le coefficient de la Fête Nationale :
`PATCH /v1/admin/holidays/:id`
```json
{ "coefficient": 1.35 }
```
Désactiver un férié : `DELETE /v1/admin/holidays/:id`.

---

## 12. Garde-fous & pièges à connaître

- **Plafond `priceCapGlobal`** borne chaque multiplicateur **et** leur produit → impossible d'exploser au-delà (×2,5 par défaut).
- **Cache 60 s** : un changement n'est pas instantané (≤ 1 min).
- **`tripBands` = remplacement de tableau**, pas une fusion : renvoyer toujours la liste complète.
- **`peakHourProfiles` positionnel** : l'ordre et l'index comptent ; renvoyer la liste entière.
- **`intercity` neutralise le surge** (par `id`) : si tu renommes ce palier, tu perds cette protection inter-villes. **Garde l'`id` `intercity`.**
- **ECO est toujours la base** (prime 0) : les autres catégories sont des primes *additionnelles*, décotées comme le reste.
- **Décote bornée 0–40 %** côté défaut env ; la config DB peut fixer la valeur effective.
- **`heatMultipliers`** : clés bornées 0–5 ; au-delà, repli `1 + niveau × incrementPerHeatLevel`.
- **Jour férié = contexte, pas surge** : le coefficient férié entre dans `contexte` et reste **borné par `priceCapGlobal`** ; en conditions déjà extrêmes (pointe + pluie + pénurie) il peut être « absorbé » par le plafond (comportement voulu, anti-explosion).
- **Férié ≠ `pricing.config`** : le *coefficient* et la *date* vivent dans `ref_holidays` (via `/v1/admin/holidays`) ; `holidayPolicy` ne fait qu'activer/borner la mécanique. Les **fêtes mobiles** sont à saisir chaque année.
- **Jours ouvrables/weekend** = champ `days[]` d'un `peakHourProfile` (0=dim…6=sam), pas un réglage séparé. Profil sans `days` = tous les jours.
- **Toujours valider** après calibration : relire `effective` via `GET /v1/admin/pricing-config?countryCode=CI` et comparer un devis réel (`context.holidayApplied` indique si un férié a joué).

---

### Fichiers de code de référence
- `src/modules/pricing/pricing.config.ts` — schéma, défauts, normalisation
- `src/modules/pricing/pricing.config.service.ts` — lecture/écriture/cache, endpoints admin
- `src/modules/pricing/pricing.service.ts` — orchestration du devis
- `src/modules/pricing/pricing.engine.ts` — calcul barème, parité, décote
- `src/modules/pricing/pricing.traffic.ts` — trafic/heures de pointe (`days[]`/`hours[]`)
- `src/modules/pricing/pricing.holiday.ts` — jours fériés (resolver prix + CRUD admin)
- `src/modules/pricing/surge.service.ts` — surge offre/demande
- `src/modules/pricing/pricing.zone.ts` / `pricing.hotzone.ts` — zones & chaleur
- `src/modules/routing/toll-detection.ts` — péages
- `src/modules/admin/admin.routes.ts` — routes admin pricing (`/admin/pricing-config`) + fériés (`/admin/holidays`)
- `migrations/103_ref_holidays_timestamps.sql` — timestamps sur `ref_holidays`
</content>
</invoke>
