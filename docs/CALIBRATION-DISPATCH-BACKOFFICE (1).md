# Calibration du Dispatcher — Référence backoffice (UPJUNOO)

> But : permettre au backoffice (et à l'IA qui le pilote) de **calibrer toute l'attribution des courses / livraisons** (qui reçoit l'offre, dans quel rayon, combien de temps, dans quel ordre, avec quel score) **sans toucher au code**.
> **Rien n'est figé en dur** : tous les rayons, délais, vagues, poids de score, seuils, presets et profils trafic listés ici sont stockés en base et modifiables à chaud.
> Source de vérité du code : `src/modules/dispatch/` (config = `dispatch.config.service.ts` + `dispatch.defaults.ts` + `strategies/config.ts`, types = `dispatch.types.ts`, moteur = `dispatch.service.ts`).

---

## 0. Comment fonctionne le dispatcher (à lire avant de calibrer)

Quand un client commande, voici le cycle de vie :

```
commande créée (status: requested)
   └─► start dispatch (status: dispatching)
        │
        ├─ VAGUE 1 : cherche les chauffeurs dans un rayon (maxRadiusKm)
        │     ├─ filtre l'éligibilité (en ligne, KYC, véhicule, catégorie, zone, solde…)   ← §8
        │     ├─ calcule un SCORE pour chaque candidat éligible                            ← §9
        │     ├─ trie par score décroissant
        │     └─ pousse l'offre : 1 chauffeur à la fois (séquentiel) ou en lot (batch)     ← §6.5
        │            └─ le chauffeur a `offerTtlSeconds` pour accepter
        │                 ├─ ACCEPTE → commande assigned, fin                              ✅
        │                 └─ refuse / ne répond pas → chauffeur suivant de la file
        │
        ├─ (si personne) attend `waveIntervalSec`, puis VAGUE 2 (rayon élargi)
        │     … jusqu'à `maxWaves`
        │
        └─ si aucune vague n'aboutit (ou `globalTimeoutSec` atteint) → status: no_driver  ❌
```

Tout ce qui est en **gras dans ce schéma est calibrable**. C'est exactement ce qui fait qu'une course est trouvée vite, lentement, ou pas du tout.

---

## 1. Où vit la configuration

| Élément | Valeur |
|---|---|
| Table | `system_settings` |
| Clé | `dispatch.config` |
| Format | JSON (document multi-pays **× 2 services** : `RIDE` et `DELIVERY_CARGO`, voir §3) |
| Cache | Redis `dispatch:config:document`, **TTL 60 s** → un changement met **≤ 60 s** à se propager |
| Repli si vide | `buildSeedDispatchConfigDocument()` (graine `legacy`, pas un verrou) |

⚠️ **Deux couches de réglage cohabitent** :
1. **Cette config DB** (`dispatch.config`) → tout ce qui est métier/stratégie. **C'est l'objet de ce document.**
2. **Les variables d'environnement `DISPATCH_*`** (serveur) → kill-switches et filets opérationnels qui **ne se changent PAS depuis le backoffice** (nécessitent un redéploiement). Listées en §10 pour que tu saches ce qui est hors de ta portée backoffice.

> 🟢 **En prod aujourd'hui**, le dispatch tourne en **preset `full`** (pas `legacy` qui est la graine par défaut). **Toujours lire `effective` via le GET admin** (§2) pour voir les vraies valeurs en vigueur, pas les valeurs de la graine.

---

## 2. Contrat HTTP (endpoints admin)

Préfixe API : **`/v1`** — JWT **admin** requis.

### Configuration (calibration)

| Méthode | Route | Usage |
|---|---|---|
| `GET` | `/v1/admin/dispatch-config?countryCode=CI` | Lire la config + **vue résolue effective** + **planning des vagues** |
| `PUT` | `/v1/admin/dispatch-config` | **Remplacer tout** le document |
| `PATCH` | `/v1/admin/dispatch-config/countries/:countryCode` | **Fusion partielle d'un pays** (recommandé) |

### Réponse du GET (structure)

```jsonc
{
  "settingKey": "dispatch.config",
  "schemaVersion": 2,
  "document":     { "...": "le JSON stocké (global + countries, par service)" },
  "seedTemplate": { "...": "gabarit par défaut (reset)" },
  "effective": {                         // ← LA VUE À AFFICHER : ce que le moteur applique vraiment
    "countryCode": "CI",
    "RIDE":           { "...": "config RIDE résolue" },
    "DELIVERY_CARGO": { "...": "config livraison résolue" }
  },
  "waveSchedule": {                      // ← le rayon réel à chaque vague, déjà calculé
    "RIDE":           [ { "wave": 1, "radiusKm": 2 }, { "wave": 2, "radiusKm": 4 } ],
    "DELIVERY_CARGO": [ ... ]
  }
}
```

- **`effective`** = ce que le dispatcher applique réellement (après preset + fusion global → pays + bornes). **C'est ça qu'affiche le backoffice.**
- **`waveSchedule`** = le rayon de chaque vague, déjà calculé → idéal pour montrer « voici où le système va chercher ».

### Supervision (lecture seule, utile pour « voir le changement »)

| Méthode | Route | Usage |
|---|---|---|
| `GET` | `/v1/admin/dispatch-capacity?countryCode=CI` | Audit capacité : combien de chauffeurs en ligne / éligibles / indexés, par zone. |
| `POST` | `/v1/admin/dispatch-fleet-hygiene` | Réconciliation présence (purge index GEO orphelins). `dryRun:true` par défaut. |
| `GET` | `/v1/dispatch/:serviceType/:orderId/status` | État dispatch d'une commande (vague en cours, offres). |
| `GET` | `/v1/dispatch/:serviceType/:orderId/logs` | **Journal des offres/exclusions** d'une commande → pour comprendre pourquoi tel chauffeur n'a pas reçu (voir §8). |
| `GET` | `/v1/dispatch/config/defaults?countryCode=CI` | Config par défaut résolue (sans auth admin). |

### Opérationnel (déclenché par les apps, pas le backoffice)

`POST /v1/dispatch/rides/:rideId/start` · `…/deliveries/:deliveryId/start` · `…/:serviceType/:orderId/retry` · `…/offers/:offerId/{received,accept,reject}`.

### Recommandation d'écriture

- **Calibrer un pays** sans risque : `PATCH /v1/admin/dispatch-config/countries/CI`.
  ⚠️ Le body **doit être structuré par service** : `{ "RIDE": { … }, "DELIVERY_CARGO": { … } }` (le PATCH ne fusionne que ces deux clés).
- **Reset / import complet** : `PUT /v1/admin/dispatch-config` avec le document entier.
- Après écriture, le cache est **invalidé automatiquement**.

---

## 3. Structure du document & héritage

```jsonc
{
  "schemaVersion": 2,
  "global": {
    "RIDE":           { /* réglages course, tous pays */ },
    "DELIVERY_CARGO": { /* réglages livraison, tous pays */ }
  },
  "countries": {
    "CI": { "RIDE": { /* surcharge course CI */ }, "DELIVERY_CARGO": { /* … */ } },
    "SN": { "RIDE": { … }, "DELIVERY_CARGO": { … } }
  }
}
```

Résolution pour un (pays, service) donné (`mergeServiceLayers`) :
1. On part de `global[service]`.
2. On **fusionne en profondeur** `countries[PAYS][service]` par-dessus.
3. Champs absents → valeur de la graine code (`DEFAULT_DISPATCH_CONFIG`).
4. **Les tableaux sont REMPLACÉS, pas fusionnés** : `traffic.zoneProfiles` et `urgency.metadataFlags` → renvoie toujours la liste complète.

**Résolution du pays d'une commande** : `countryCode` explicite → `metadata.countryCode` → `order.country_code` → déduit du `cityId` (`ref_cities.country_id`) → défaut **`CI`**.

### Conventions de saisie (tolérances du parseur)
- camelCase uniquement pour les clés de stratégie (`maxRadiusKm`, `waveIntervalSec`…).
- Booléens stricts pour les `enabled` : `true`/`false`.
- Valeur invalide/manquante → **repli sur le défaut** (jamais d'erreur, jamais 0 silencieux), puis **bornage** (min/max — voir colonnes « borne »).

---

## 4. Les 3 presets de stratégie (`strategies.preset`)

Un preset = un paquet de réglages cohérents. Tu choisis une base, puis tu surcharges champ par champ.

| Preset | Esprit | Routing | Scoring | Offres | Anti-refus / fairness | Trafic | Auto-assign / heatmap / batch / repositionnement |
|---|---|---|---|---|---|---|---|
| `legacy` | Simple, robuste | haversine (vol d'oiseau) | legacy (distance/note/fiabilité) | **batch** (lot de 8) | désactivés | désactivé | tous désactivés |
| `pro` | Routier + intelligent | OSRM (route réelle) | dynamic | **sequential** (1 à la fois) | activés | activé (profils zone) | auto-assign/heatmap/batch off |
| `full` | Tout activé (**prod**) | OSRM | dynamic | sequential (file 15) | activés | activé (+ live + météo) | **tous activés** |

> Le preset pose les valeurs de base ; **chaque champ reste surchargé individuellement** par ta config. Ex. preset `full` + tu mets `wave.maxWaves: 3` → tu gardes tout `full` mais avec 3 vagues.

---

## 5. Réglages de recherche de base (par service)

Niveau : `global.RIDE`, `global.DELIVERY_CARGO`, ou `countries.CI.RIDE`, etc.

| Champ | Type | Défaut | Borne | Effet |
|---|---|---|---|---|
| `maxRadiusKm` | km | `2` | — | **Rayon de la vague 1.** Plus grand = plus de chauffeurs trouvés vite, mais plus loin du client. |
| `candidateLimit` | n | `8` (RIDE) / `10` (CARGO) | — | Nombre max de candidats retenus après scoring. |
| `driverSearchLimit` | n | `500` | 1 – 5000 | Plafond brut de chauffeurs scannés par requête géo. |
| `minDriverWalletBalanceXof` | XOF | `0` | ≥ 0 | **Solde minimum** du wallet chauffeur pour être éligible (0 = pas de filtre). |
| `offerTtlSeconds` | s | `12` | — | **Temps laissé au chauffeur pour accepter** une offre avant de passer au suivant. |
| `autoAssign` | bool | `false` | — | Raccourci legacy (préférer `strategies.autoAssign`, §6.6). |
| `weights` | objet | — | — | Poids du **scoring legacy** (§6.4). |

---

## 6. Le détail de chaque bloc

### 6.1 `wave` — les vagues de recherche

Rayon vague N = `min( maxRadiusKm + (N-1) × radiusIncrementKm , maxRadiusKmCap )`.

| Champ | Type | Défaut | Borne | Effet |
|---|---|---|---|---|
| `radiusIncrementKm` | km | `2` | — | Élargissement du rayon à chaque nouvelle vague. |
| `maxRadiusKmCap` | km | `4` | — | **Plafond absolu** du rayon (même après plusieurs vagues). |
| `maxWaves` | n | `2` | ≥ 1 | Nombre de vagues avant `no_driver` / passe urgence. |
| `waveIntervalSec` | s | `12` | — | Délai entre deux vagues si personne n'a accepté. |
| `globalTimeoutSec` | s | `120` | — | **Timeout global** : au-delà, `no_driver` (2 min côté client). |

> Exemple par défaut : vague 1 = 2 km, vague 2 = 4 km (plafonné), 2 vagues, 12 s entre elles, 120 s max.
> Pour « chercher plus loin » : monter `maxRadiusKm`, `radiusIncrementKm`, `maxRadiusKmCap` et `maxWaves`.

### 6.2 `chain` — chaînage (offrir une course à un chauffeur bientôt libre)

Permet d'offrir une nouvelle course à un chauffeur **encore en course** mais proche de sa dépose (évite les trous d'activité).

| Champ | Type | Défaut | Borne | Effet |
|---|---|---|---|---|
| `tripMaxEtaMinutes` | min | `5` | ≥ 0 | ETA restant max sur la course en cours pour devenir chaînable. |
| `tripMinProgress` | 0–1 | `0.5` | 0.1 – 1 | Progression min (repli si ETA indispo) : 0.5 = mi-parcours. |
| `radiusBonusKm` | km | `2` | ≥ 0 | Rayon élargi pour les chauffeurs en chaînage. |
| `emergencyEnabled` | bool | `false`* | — | Dernière passe assouplie si personne n'a accepté. *(normalisé : `true` sauf si explicitement `false`)* |
| `emergencyTripMaxEtaMinutes` | min | `8` | ≥ 0 | ETA restant assoupli en urgence. |
| `emergencyTripMinProgress` | 0–1 | `0.35` | 0.1 – 1 | Progression assouplie en urgence. |
| `emergencyRadiusBonusKm` | km | `4` | ≥ 0 | Rayon bonus supplémentaire en urgence. |

### 6.3 `strategies.routing` — calcul de distance/ETA chauffeur→client

| Champ | Type | Défaut (full) | Valeurs | Effet |
|---|---|---|---|---|
| `mode` | enum | `osrm` | `haversine`, `osrm`, `mapbox`, `hybrid` | Méthode de calcul. `haversine` = vol d'oiseau (rapide, approximatif) ; `osrm`/`mapbox` = route réelle ; `hybrid` = mixte. |
| `fallbackToHaversine` | bool | `true` | — | Repli vol d'oiseau si le routeur échoue. |
| `maxEtaMinutes` | min | `20` (full) / `0` | ≥ 0 | ETA max chauffeur→pickup pour rester éligible. **`0` = pas de filtre ETA** (legacy). |

### 6.4 `weights` (scoring **legacy**) & `strategies.scoring` (scoring **dynamic**)

Le score classe les candidats éligibles. Deux modes (`strategies.scoring.mode`) :

**Mode `legacy`** (utilise `weights` au niveau service) :

| Champ | Défaut RIDE | Défaut CARGO | Effet |
|---|---|---|---|
| `weights.distance` | `0.7` | `0.75` | Poids de la proximité. |
| `weights.rating` | `0.2` | `0.15` | Poids de la note chauffeur. |
| `weights.reliability` | `0.1` | `0.1` | Poids de la fiabilité. |

**Mode `dynamic`** (`strategies.scoring.dynamic`, défaut `pro`/`full`) :

| Champ | Défaut | Effet |
|---|---|---|
| `proximity` | `0.35` | Proximité (ETA si dispo, sinon distance). |
| `rating` | `0.2` | Note moyenne /5. |
| `reliability` | `0.15` | Score de fiabilité. |
| `acceptRate` | `0.15` | Taux d'acceptation (7 derniers jours). |
| `idleBonus` | `0.1` | Bonus chauffeur inactif (jusqu'à 30 min). |
| `refusalPenalty` | `0.05` | Pénalité de refus (soustraite). |
| `chainPenalty` | `0.05` | Pénalité si le candidat est en chaînage. |

> Formules exactes en §9.

### 6.5 `strategies.offers` — comment l'offre est poussée

| Champ | Type | Défaut (full) | Valeurs / Borne | Effet |
|---|---|---|---|---|
| `mode` | enum | `sequential` | `sequential`, `batch` | **`sequential`** = 1 chauffeur à la fois (le meilleur d'abord, façon Yango) ; **`batch`** = on offre à plusieurs en même temps (premier qui accepte gagne). |
| `batchSize` | n | `8` | ≥ 1 | Nombre d'offres simultanées en mode batch. |
| `sequentialQueueSize` | n | `15` (full) / `12` | ≥ 1 | Taille de la file d'attente en mode séquentiel. |

### 6.6 `strategies.autoAssign` — attribution automatique du meilleur

| Champ | Type | Défaut (full) | Borne | Effet |
|---|---|---|---|---|
| `enabled` | bool | `true` (full) / `false` | — | Si un candidat domine nettement, on l'assigne **sans offre interactive**. |
| `minScoreGap` | n | `0.18` (full) / `0.15` | ≥ 0 | Écart de score min entre le 1ᵉʳ et le 2ᵉ pour auto-assigner. |
| `maxEtaMinutes` | min | `4` | ≥ 1 | ETA max du candidat pour être auto-assignable. |

### 6.7 `strategies.heatmap` — élargir le rayon là où la demande est forte

| Champ | Type | Défaut (full) | Borne | Effet |
|---|---|---|---|---|
| `enabled` | bool | `true` (full) | — | Active le bonus de rayon basé sur la demande locale récente. |
| `radiusBonusKm` | km | `2` | ≥ 0 | Bonus de rayon si forte demande (≥ 8 demandes dans 2 km → plein bonus ; ≥ 4 → demi-bonus). |
| `lookbackHours` | h | `168` | ≥ 1 | Fenêtre d'analyse de la demande (168 h = 7 j). |

### 6.8 `strategies.fairness` — répartir équitablement les courses

| Champ | Type | Défaut (pro/full) | Borne | Effet |
|---|---|---|---|---|
| `enabled` | bool | `true` | — | Pénalise les chauffeurs qui prennent trop de courses/heure (anti-monopole). |
| `maxAssignmentsPerHour` | n | `6` | ≥ 1 | Seuil au-delà duquel la pénalité s'applique. |
| `penaltyPerExtraAssignment` | n | `0.08` | ≥ 0 | Malus de score par course excédentaire. |

### 6.9 `strategies.penalties` — pénaliser les refus / non-réponses

| Champ | Type | Défaut (pro/full) | Borne | Effet |
|---|---|---|---|---|
| `enabled` | bool | `true` | — | Active la pénalité de refus. |
| `scoreReductionPerRefusal` | n | `0.12` | ≥ 0 | Malus de score appliqué après seuil de refus consécutifs. |
| `penaltyTtlMinutes` | min | `2` | ≥ 1 | Durée de vie de la pénalité. |
| `consecutiveRefusalThreshold` | n | `3` | ≥ 1 | Nombre de refus/timeouts consécutifs avant d'appliquer le malus. |

### 6.10 `strategies.urgency` — commandes prioritaires

| Champ | Type | Défaut (pro/full) | Borne | Effet |
|---|---|---|---|---|
| `enabled` | bool | `true` | — | Active le traitement urgent (rayon + intervalle accélérés). |
| `waveIntervalSec` | s | `4` | ≥ 1 | Intervalle de vague raccourci pour les commandes urgentes. |
| `radiusBonusKm` | km | `2` | ≥ 0 | Rayon bonus pour les commandes urgentes. |
| `emergencyChainEarly` | bool | `true` (full) / `false` | — | Active le chaînage d'urgence dès le départ. |
| `metadataFlags` | string[] | `['urgent','priority','vip']` | — | Flags `metadata` qui marquent une commande urgente. **(tableau remplacé)** |

> Une commande est « urgente » si `metadata[flag] === true`, `metadata.priority === flag`, ou `metadata.priority` ∈ `{high, urgent}`.

### 6.11 `strategies.scheduled` — courses programmées (créneaux)

| Champ | Type | Défaut | Borne | Effet |
|---|---|---|---|---|
| `enabled` | bool | `true` | — | Active le dispatch différé. **No-op pour les commandes immédiates** (elles passent direct). |
| `leadTimeMinutes` | min | `30` | ≥ 5 | On commence à dispatcher une course programmée X min avant l'heure prévue. |

### 6.12 `strategies.reposition` — inviter les chauffeurs inactifs à se déplacer

| Champ | Type | Défaut (full) | Borne | Effet |
|---|---|---|---|---|
| `enabled` | bool | `true` (full) | — | Notifie les chauffeurs inactifs proches d'une zone de demande. |
| `idleMinutesThreshold` | min | `10` | ≥ 1 | Inactivité min avant de notifier. |
| `demandRadiusKm` | km | `5` | ≥ 1 | Rayon de la demande (la notif touche jusqu'à 3× ce rayon). |

### 6.13 `strategies.batchMatching` — appariement par lots (haute charge)

| Champ | Type | Défaut (full) | Borne | Effet |
|---|---|---|---|---|
| `enabled` | bool | `true` (full) | — | Apparie plusieurs commandes en une passe (réserve les chauffeurs). |
| `maxOrdersPerPass` | n | `25` | ≥ 1 | Commandes traitées par passe. |
| `holdTtlSeconds` | s | `90` | ≥ 30 | Durée de réservation d'un chauffeur pendant l'appariement. |

### 6.14 `strategies.geoIndex` — index géographique Redis

| Champ | Type | Défaut (pro/full) | Effet |
|---|---|---|---|
| `enabled` | bool | `true` (pro/full) | Utilise l'index GEO Redis (`drivers:geo`) pour trouver les chauffeurs proches (rapide, scalable). Désactivé = scan DB. |
| `key` | string | `drivers:geo` | Nom de la clé Redis. **Ne pas changer** sans raison. |

### 6.15 `strategies.traffic` — trafic, heures de pointe & météo (impact ETA/rayon)

> ⚠️ Ce bloc agit sur le **dispatch** (ETA et rayon de recherche), **distinct** du moteur de **prix** (qui a sa propre config `pricing.config`). Calibrer ici ne change PAS le prix, et inversement.

| Champ | Type | Défaut (full) | Borne | Effet |
|---|---|---|---|---|
| `enabled` | bool | `true` (pro/full) / `false` | — | Active l'ajustement trafic. |
| `useZoneProfiles` | bool | `true` | — | Applique les profils par zone/heure. |
| `useLiveTraffic` | bool | `true` (full) / `false` | — | Utilise la durée trafic live du routeur. |
| `maxEtaMultiplier` | n | `1.8` (full) / `1.6` | ≥ 1 | **Plafond** du multiplicateur d'ETA (anti-explosion). |
| `levels` | map | `{fluid:0.95, normal:1, dense:1.25, blocked:1.5}` | — | Multiplicateur d'ETA selon `metadata.traffic`. |
| `zoneProfiles[]` | tableau | profils CI (voir ci-dessous) | — | Profils par zone + plage horaire. **(tableau remplacé)** |
| `weather` | map | (optionnel) | — | Profils météo `{clear,rain,storm,heat}` → `{etaMultiplier, radiusBonusKm}`. |

**Champs d'un `zoneProfile`** : `zoneCode` (ou `zoneId`), `hours[]` (0–23), `days[]` (0=dim…6=sam), `etaMultiplier` (≥1), `radiusBonusKm` (≥0), `label`.

**Profils CI par défaut** (`pro`/`full`) :

| zoneCode | heures | etaMultiplier | radiusBonusKm |
|---|---|---|---|
| PLATEAU | 7-9 / 17-19 | 1.35 | 1 |
| COCODY | 7-9 / 17-19 | 1.3 | 1 |
| ADJAME | 7-9 / 17-19 | 1.45 | 1.5 |
| YOPOUGON | 7-9 / 17-19 | 1.25 | 0.5 |

> 🗓️ **Jours ouvrables vs weekend** (identique au pricing) : c'est le champ `days[]` du `zoneProfile` (0=dim…6=sam), comparé au jour courant (`matchesHourDay`, [`strategies/traffic.ts`](../../src/modules/dispatch/strategies/traffic.ts)). Profil sans `days` = tous les jours.
> - Pointe **en semaine seulement** → `"days": [1,2,3,4,5]`.
> - Profil **weekend** (rayon/ETA différents) → `"days": [0,6]`.
>
> 🎌 **Jours fériés** : **pas de notion de férié au dispatch, et c'est voulu.** Le dispatch agit sur l'**ETA** et le **rayon**, pas sur le prix. Le `coefficient` de `ref_holidays` est un multiplicateur de **prix** (côté `pricing.config`, voir `docs/pricing/…` §7.5) — l'appliquer à l'ETA serait un contresens (un férié = trafic plutôt plus fluide). Si un jour tu veux un **comportement de dispatch** spécifique aux fériés (ex. élargir le rayon parce que moins de chauffeurs en ligne), ce serait un `zoneProfile` dédié à activer ce jour-là (ou une évolution à spécifier) — ce n'est **pas** branché aujourd'hui.

---

## 7. Le cycle complet, étape par étape (ce que fait le moteur)

1. **Résolution** pays + service + config effective (preset + global ⊕ pays).
2. **Différé ?** Si la commande a un `scheduledAt` futur, on attend `leadTimeMinutes` avant l'heure (sinon dispatch immédiat). (§6.11)
3. **Urgence ?** Si flag urgent → rayon + intervalle accélérés. (§6.10)
4. **Trafic ?** Calcule `etaMultiplier` et `radiusBonusKm` (profil zone/heure + météo, plafonné `maxEtaMultiplier`). (§6.15)
5. **Heatmap ?** Bonus de rayon si forte demande locale. (§6.7)
6. **Vague N** : rayon = base + (N-1)×increment + bonus, plafonné `maxRadiusKmCap`.
7. **Recherche** des chauffeurs dans le rayon (index GEO Redis ou DB), limité à `driverSearchLimit`.
8. **Filtre d'éligibilité** (la « ladder », §8) : chaque chauffeur non éligible est **exclu avec une raison journalisée**.
9. **Scoring** des éligibles (§9), tri décroissant, top `candidateLimit`.
10. **Plan d'offre** : auto-assign si un candidat domine (§6.6), sinon `sequential` (1 à 1) ou `batch` (§6.5).
11. **Offre poussée** (socket + push) avec `offerTtlSeconds` pour répondre.
12. **Réponse** : accept → `assigned` ✅ ; reject/timeout → suivant ; (pénalité de refus si activée, §6.9).
13. **Fin de vague** sans succès → attendre `waveIntervalSec` → vague suivante (jusqu'à `maxWaves`).
14. **Échec global** (toutes vagues vides ou `globalTimeoutSec`) → `no_driver` ❌ (fermeture immédiate).

---

## 8. Éligibilité chauffeur — qui est considéré (la « ladder »)

À chaque vague, un chauffeur trouvé dans le rayon est **gardé seulement s'il passe tous ces filtres**. Chaque exclusion est **journalisée** (visible via `GET …/logs`) avec sa `reason` — c'est l'outil n°1 pour comprendre « pourquoi personne n'a reçu ».

**Pré-filtres SQL** (le chauffeur doit déjà être) :
- `availability_status` ∈ `{online, available}`
- `approval_status = approved`

**Filtres candidat** (raisons d'exclusion, dans l'ordre) :

| `reason` journalisée | Signification | Réglage lié |
|---|---|---|
| `batch_hold` | Réservé par un appariement batch en cours | `strategies.batchMatching` |
| `already_offered` | Déjà offert pour cette commande | — |
| `kyc_not_approved` | KYC non approuvé | (statut chauffeur) |
| `missing_vehicle` | Pas de véhicule courant | (profil chauffeur) |
| `vehicle_not_eligible` | Véhicule incompatible avec le service/catégorie | (catalogue véhicule) |
| `driver_busy_on_trip` / `chain_deferred_emergency` | En course, non chaînable (ou différé urgence) | `strategies.chain` (§6.2) |
| `missing_location` | Pas de position récente connue | (index GEO / app) |
| `eta_too_high` | ETA chauffeur→pickup > `routing.maxEtaMinutes` | `strategies.routing.maxEtaMinutes` |
| `wallet_insufficient` | Solde wallet < seuil | `minDriverWalletBalanceXof` |
| `rides_not_enabled` | Chauffeur a désactivé les courses (`accepts_rides=false`) | *préférence chauffeur* |
| `category_not_eligible` | Catégorie course non couverte (Eco/Confort/…) | *classes de service chauffeur* |
| `delivery_not_enabled` | Chauffeur n'accepte pas les livraisons | *préférence chauffeur* |
| `payment_method_not_accepted` | Mode de paiement de la commande refusé par le chauffeur | *préférence chauffeur* |
| `max_distance_exceeded` | Pickup au-delà de la distance max acceptée | *préférence chauffeur* `max_distance_km` |
| `zone_blocked` | Pickup dans une zone bloquée par le chauffeur | *préférence chauffeur* `blocked_zones` |
| `zone_filter_excluded` | Zone exclusive : pickup (et éventuellement dropoff) hors zone choisie | *préférence chauffeur* + env `DISPATCH_ZONE_CHECK_DROPOFF` |
| `heading_home_excluded` | Filtre « retour maison » : la course n'éloigne pas du domicile | *préférence chauffeur* + env `DISPATCH_HEADING_HOME_SCORE_WEIGHT` |
| `outside_radius` | Hors du rayon de la vague | `maxRadiusKm` / `wave` |

> 🔑 **Important** : la catégorie (`category_not_eligible`), le paiement, les zones (exclusive/bloquées), la distance max et le « retour maison » dépendent de **préférences que le CHAUFFEUR règle dans son app** (table `driver_preferences` + `driver_service_classes`). Le backoffice ne les calibre pas via `dispatch.config` ; il peut seulement **activer/désactiver le mécanisme global** via les variables d'env `DISPATCH_DRIVER_ZONE_FILTERS` / `DISPATCH_ZONE_CHECK_DROPOFF` (§10).

**Matrice catégorie course (RIDE)** — un chauffeur d'une catégorie peut servir : Eco→Eco ; Confort→Confort+Eco ; Confort+→Confort+/Confort/Eco ; Premium→Premium/Confort+. *(Surclassée par les classes de service multiples si le chauffeur en a activé.)*

---

## 9. Le scoring exact (formules)

`distanceScore = clamp01(1 − distance / rayon_effectif)` ; `clamp01(x)` borne 0–1.

**Mode legacy** :
```
score = distanceScore × weights.distance
      + (rating/5) × weights.rating
      + reliability × weights.reliability
      + bonus_préférence
```

**Mode dynamic** :
```
proximityScore = (ETA & maxEtaMinutes>0) ? clamp01(1 − ETA/maxEtaMinutes) : clamp01(1 − distance/rayon)
score = clamp01(
      proximityScore × proximity
    + (rating/5)     × rating
    + reliability    × reliability
    + acceptRate     × acceptRate
    + (idleMin/30)   × idleBonus
    + bonus_préférence
    − refusalPenalty
    − chainPenalty )
```
`bonus_préférence` = `preferredZoneBoost` (env `DISPATCH_PREFERRED_ZONE_BOOST`, défaut 0.08) + score « retour maison » (pondéré par env `DISPATCH_HEADING_HOME_SCORE_WEIGHT`, défaut 0.15).
La pénalité fairness (§6.8) est soustraite ensuite : `score_final = max(0, score − fairnessPenalty)`.

---

## 10. Variables d'environnement (hors backoffice — redéploiement requis)

Ces réglages **ne sont pas dans `dispatch.config`** : ils se changent côté serveur (`.env` server1) et nécessitent un redéploiement. Listés pour que le backoffice sache ce qu'il **ne peut pas** changer à chaud.

| Variable | Défaut | Rôle |
|---|---|---|
| `DISPATCH_LOCK_TTL` | `30` | TTL (s) du verrou anti-double-dispatch d'une commande. |
| `DISPATCH_WORKER_CONCURRENCY` | `20` | Commandes dispatchées en parallèle par le worker (max 200). |
| `DISPATCH_REDIS_STATE_ENABLED` | `true` | Persistance de l'état dispatch « chaud » en Redis (reprise rapide). |
| `DISPATCH_REDIS_STATE_TTL_SEC` | `600` | TTL (s) de cet état chaud. |
| `DISPATCH_NO_DRIVER_TTL_MINUTES` | `10` | Filet : ferme une commande résiduelle restée `no_driver` (0 = off). |
| `DISPATCH_AUTOSTART_GRACE_SECONDS` | `30` | Filet : amorce une commande restée `requested` non démarrée (0 = off). |
| `DISPATCH_REQUESTED_TTL_MINUTES` | `15` | Ferme en `cancelled` une commande `requested` abandonnée (0 = off). |
| `DISPATCH_DRIVER_ZONE_FILTERS` | `true` | **Kill-switch** des filtres zone exclusive / retour maison / bloquées / distance max. |
| `DISPATCH_ZONE_CHECK_DROPOFF` | `false` | Zone exclusive : vérifie aussi la destination (sinon pickup seul). |
| `DISPATCH_PREFERRED_ZONE_BOOST` | `0.08` | Bonus de score si pickup en zone favorite du chauffeur. |
| `DISPATCH_HEADING_HOME_SCORE_WEIGHT` | `0.15` | Poids du score « retour maison ». |
| `DISPATCH_HIDE_DROPOFF` | `false` | Masque la destination dans l'offre (anti-cherry-picking ; garde tripDistance/Duration). |
| `DISPATCH_AUDIT_SLACK_ENABLED` (+ `_WEBHOOK_URL`, `_CHANNEL`, `_MAX_DRIVERS`, `_TIMEOUT_MS`) | `false` | Audit ops Slack du dispatcher (jamais bloquant). |

---

## 11. Realtime — comment le backoffice « voit » l'effet

Le dispatcher émet des events socket (pont `DispatchRealtimeBridge`) — utiles pour un tableau live backoffice :

| Cible | Event / payload | Contenu |
|---|---|---|
| Chauffeur | `emitOfferToDriver` | Offre : `offerId`, `expiresAt`, `distanceKm` (chauffeur→pickup), `score`, `pickup`, `dropoff` (ou `null` si masqué), `tripDistanceKm`, `tripDurationMin`, `categoryCode`, `client` (prénom+note), `chainEligible`. |
| Client | `emitOrderUpdate` | Statut commande : `status`, `previousStatus`, `wave`, `finalStatus`, `closed`, **`cancelledBy`** (`system`/`client`/`driver`). |
| Admin | `emitAdminOrderUpdate` | Miroir admin du même update → **alimente la carte live backoffice**. |
| Chauffeur | `cancelOfferForDriver` | Annulation d'offre (`offerId`, `orderId`). |

> Pour **vérifier une calibration** : change la config → attends ≤ 60 s → relance une commande de test → lis `GET …/status` + `GET …/logs` (les rayons/vagues/exclusions reflètent la nouvelle config) et observe `waveSchedule` dans le GET admin.

---

## 12. Clés Redis (pour debug / supervision)

| Clé | Rôle |
|---|---|
| `dispatch:config:document` | Cache config (TTL 60 s). |
| `drivers:geo` | Index GEO des chauffeurs en ligne (recherche de proximité). |
| `dispatch:lock:{service}:{orderId}` | Verrou anti-double-dispatch. |
| `dispatch:offered:{service}:{orderId}` | Chauffeurs déjà offerts pour la commande. |
| `dispatch:state:{service}:{orderId}` | État dispatch chaud (reprise). |
| `dispatch:offer:driver:{userId}` | Dernière offre poussée à un chauffeur (rejeu à la reconnexion). |
| `dispatch:penalty:{driverId}` / `dispatch:refusals:{driverId}` | Pénalités / streak de refus. |
| `dispatch:fairness:{hour}:{driverId}` | Compteur d'attributions horaires (fairness). |
| `dispatch:heatmap:cells` | Heatmap de demande (bonus rayon). |
| `dispatch:batch:hold:{driverId}` | Réservation batch. |
| `dispatch:reposition:notified:{driverId}` | Anti-spam notif repositionnement. |

---

## 13. Exemples de payloads prêts à l'emploi

> ⚠️ Le PATCH par pays attend un body **structuré par service** : `{ "RIDE": {...}, "DELIVERY_CARGO": {...} }`.

### A. Chercher plus large et plus longtemps (course CI)

`PATCH /v1/admin/dispatch-config/countries/CI`
```json
{
  "RIDE": {
    "maxRadiusKm": 3,
    "wave": { "radiusIncrementKm": 2.5, "maxRadiusKmCap": 8, "maxWaves": 3, "waveIntervalSec": 10, "globalTimeoutSec": 150 }
  }
}
```

### B. Laisser plus de temps au chauffeur pour accepter

```json
{ "RIDE": { "offerTtlSeconds": 18 } }
```

### C. Passer en attribution par lot (plusieurs chauffeurs en même temps)

```json
{ "RIDE": { "strategies": { "offers": { "mode": "batch", "batchSize": 5 } } } }
```

### D. Activer le preset complet et durcir l'auto-assign

```json
{ "RIDE": { "strategies": { "preset": "full", "autoAssign": { "enabled": true, "minScoreGap": 0.2, "maxEtaMinutes": 5 } } } }
```

### E. Recalibrer les poids du score dynamique (favoriser la proximité)

```json
{
  "RIDE": { "strategies": { "scoring": { "mode": "dynamic",
    "dynamic": { "proximity": 0.45, "rating": 0.15, "reliability": 0.15, "acceptRate": 0.15, "idleBonus": 0.1, "refusalPenalty": 0.05, "chainPenalty": 0.05 } } } } }
```

### F. Ajouter / remplacer les profils trafic (tableau complet)

```json
{
  "RIDE": { "strategies": { "traffic": {
    "enabled": true, "useZoneProfiles": true, "maxEtaMultiplier": 1.8,
    "zoneProfiles": [
      { "zoneCode": "PLATEAU",  "hours": [7,8,9,17,18,19], "etaMultiplier": 1.4, "radiusBonusKm": 1.5, "label": "Plateau pointe" },
      { "zoneCode": "COCODY",   "hours": [7,8,9,17,18,19], "etaMultiplier": 1.3, "radiusBonusKm": 1,   "label": "Cocody pointe" },
      { "zoneCode": "AEROPORT", "hours": [22,23,0,1,2,3,4,5], "etaMultiplier": 1.2, "radiusBonusKm": 2, "label": "Aéroport nuit" }
    ] } } } }
```

### G. Adoucir / désactiver les pénalités de refus

```json
{ "RIDE": { "strategies": { "penalties": { "enabled": false } } } }
```

### H. Calibrer la livraison différemment de la course

```json
{ "DELIVERY_CARGO": { "maxRadiusKm": 4, "candidateLimit": 12, "wave": { "maxWaves": 3, "maxRadiusKmCap": 10 } } }
```

---

## 14. Garde-fous & pièges à connaître

- **Bornage automatique** : chaque champ est borné (colonnes « borne »). Ex. `scheduled.leadTimeMinutes` jamais < 5, `batchMatching.holdTtlSeconds` jamais < 30, `traffic.maxEtaMultiplier` jamais < 1, `driverSearchLimit` ∈ 1–5000. Une valeur hors borne est **ramenée**, pas rejetée.
- **Cache 60 s** : un changement n'est pas instantané (≤ 1 min).
- **PATCH structuré par service** : toujours `{ "RIDE": {...}, "DELIVERY_CARGO": {...} }` — un body « à plat » est ignoré.
- **Tableaux remplacés, pas fusionnés** : `traffic.zoneProfiles` et `urgency.metadataFlags` → renvoyer la liste complète.
- **Le preset pose une base** : changer `preset` réécrit les défauts de tous les blocs ; tes surcharges champ-par-champ restent appliquées par-dessus.
- **Prod = preset `full`** : ne pas supposer `legacy` ; lire `effective`.
- **Trafic dispatch ≠ trafic prix** : `strategies.traffic` agit sur l'ETA/rayon du dispatch, **pas** sur le prix (qui a sa propre config `pricing.config`). Calibrer les deux séparément.
- **Filtres « zone/retour maison/paiement/catégorie »** dépendent de **préférences chauffeur** (app), pas de `dispatch.config`. Le backoffice ne peut que les activer/désactiver globalement via les env `DISPATCH_DRIVER_ZONE_FILTERS` / `DISPATCH_ZONE_CHECK_DROPOFF`.
- **Vérifier après calibration** : `GET /v1/admin/dispatch-config?countryCode=CI` (`effective` + `waveSchedule`), puis une commande test → `GET …/logs` pour voir les exclusions réelles.

---

### Fichiers de code de référence
- `src/modules/dispatch/dispatch.config.service.ts` — lecture/écriture/cache, merge, endpoints admin
- `src/modules/dispatch/dispatch.defaults.ts` — valeurs par défaut, calcul du rayon par vague
- `src/modules/dispatch/strategies/config.ts` — presets (legacy/pro/full), normalisation & bornes
- `src/modules/dispatch/dispatch.types.ts` — schéma complet des types
- `src/modules/dispatch/dispatch.service.ts` — moteur (vagues, éligibilité, scoring, offres) — ~2650 l.
- `src/modules/dispatch/strategies/{scoring,offers,penalties,fairness,heatmap,reposition,traffic,geo-index,routing,scheduled,batch-matching}.ts`
- `src/modules/dispatch/dispatch.realtime.ts` — events socket
- `src/modules/dispatch/dispatch.redis.ts` — clés Redis
- `src/modules/dispatch/ride-category.ts` — matrice d'éligibilité catégorie
- `src/modules/admin/admin.routes.ts` (≈ l.1087–1152) — routes admin
- `src/config/env.ts` (≈ l.254–306) — variables d'environnement dispatch
</content>
