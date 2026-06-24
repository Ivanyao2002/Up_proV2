# Demande backend — Zone exclusive chauffeur & mode « Retour à la maison »

> **Date :** 2026-06-16  
> **Émetteur :** équipe produit / front UpJunoo (app chauffeur + backoffice admin)  
> **Objectif :** permettre au chauffeur de **limiter son activité à une zone précise** et/ou d’**enchaîner des courses vers sa zone domicile** — avec impact sur le **moteur de dispatch**.  
> **Swagger :** [https://api.upjunoo-dev.tech/docs](https://api.upjunoo-dev.tech/docs)

---

## 1. Contexte

Deux besoins terrain récurrents pour les chauffeurs :

| Besoin | Exemple concret |
|--------|-----------------|
| **Zone exclusive** | « Je veux rouler **uniquement à Marcory** ce soir » |
| **Retour à la maison** | « Je suis à **Yopougon**, j’habite **Grand-Bassam** — je veux prendre des courses **au fil de la route** pour me rapprocher de chez moi » |

Ces préférences doivent **filtrer les offres dispatch** (le chauffeur ne reçoit que les courses éligibles) et être **visibles / configurables** depuis l’app chauffeur, avec lecture côté backoffice (fiche chauffeur, console dispatch).

---

## 2. État actuel (constat API)

Sur `GET /v1/drivers/{id}`, la table `driver_preferences` expose déjà :

```json
{
  "driver_preferences": {
    "preferred_zones": [],
    "blocked_zones": [],
    "max_distance_km": null,
    "accepts_rides": true,
    "auto_accept": false
  }
}
```

| Champ existant | Usage supposé | Implémenté dans le dispatch ? |
|----------------|---------------|-------------------------------|
| `preferred_zones` | Zones favorisées | **À confirmer** — souvent vide, sémantique floue |
| `blocked_zones` | Zones à éviter | **À confirmer** |
| `max_distance_km` | Distance max pickup | **À confirmer** |

**Manques identifiés :**

- Pas de mode **« zone unique / exclusive »** (un seul périmètre strict).
- Pas de **domicile** (`home_zone`, `home_location`).
- Pas de mode **« retour à la maison »** (`heading_home`, destination filter).
- Pas de route documentée `PATCH /v1/drivers/me/preferences` (ou équivalent) pour ces champs.
- Pas de visibilité dispatch (logs : pourquoi une offre a été refusée / non envoyée).

**Demande :** implémenter si absent, ou **documenter et brancher** si partiellement présent.

---

## 3. Fonctionnalité 1 — Zone exclusive (rouler dans une zone précise)

### 3.1 User story

> En tant que chauffeur, je veux activer un mode **« Je roule uniquement dans cette zone »** (ex. Marcory) afin de ne recevoir **aucune offre** dont le pickup ou la destination est hors de cette zone.

### 3.2 Comportement attendu

| Règle | Détail |
|-------|--------|
| Activation | Le chauffeur choisit **une zone** du catalogue (`ref_zones` / zones franchise) |
| Mode exclusif | Tant que le mode est actif, **seules** les commandes dont le **pickup** (et optionnellement la **destination**) est **dans le polygone de la zone** sont proposées |
| Hors zone | Aucune offre dispatch ; le chauffeur reste `online` mais « en attente zone » |
| Désactivation | Retour au comportement normal (toute la ville / `preferred_zones` si défini) |
| Cumul | Si `blocked_zones` contient Marcory **et** mode exclusif Marcory → erreur de config à refuser à la sauvegarde |

### 3.3 Exemple — Marcory uniquement

```
Chauffeur : online à Marcory
Mode      : exclusive_zone = Marcory

Course A : pickup Cocody, dropoff Plateau     → ❌ non proposée
Course B : pickup Marcory, dropoff Treichville → ✅ proposée
Course C : pickup Marcory, dropoff Marcory     → ✅ proposée
```

### 3.4 Champs API proposés

Extension de `driver_preferences` (ou sous-objet dédié) :

```json
{
  "zoneFilterMode": "exclusive",
  "exclusiveZoneId": "uuid-zone-marcory",
  "exclusiveZone": {
    "id": "uuid-zone-marcory",
    "label": "Marcory",
    "cityId": "uuid-abidjan"
  },
  "zoneFilterActive": true,
  "zoneFilterActivatedAt": "2026-06-16T18:00:00Z"
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `zoneFilterMode` | `off` \| `preferred` \| `exclusive` | `off` = pas de filtre ; `preferred` = boost zones listées ; `exclusive` = une seule zone obligatoire |
| `exclusiveZoneId` | UUID \| null | Zone unique si mode `exclusive` |
| `preferredZoneIds` | UUID[] | Remplace ou complète `preferred_zones` (harmoniser nommage) |
| `blockedZoneIds` | UUID[] | Remplace ou complète `blocked_zones` |
| `zoneFilterActive` | boolean | Filtre actuellement appliqué par le dispatch |

> **Question backend :** `preferred_zones` actuel = tableau de quoi (IDs, slugs, noms) ? Merci d’unifier en **UUID zone**.

### 3.5 Règles dispatch

À intégrer dans le matching **avant** l’envoi d’offre :

```
SI driver.zoneFilterMode == 'exclusive' ET driver.zoneFilterActive :
  SI pickup NOT IN polygon(exclusiveZoneId) :
    EXCLURE chauffeur des candidats
  OPTION (configurable) :
    SI dropoff NOT IN polygon(exclusiveZoneId) :
      EXCLURE chauffeur
```

Paramètre global dispatch (`dispatch-config`) suggéré :

| Paramètre | Description |
|-----------|-------------|
| `exclusiveZoneCheckPickup` | `true` — filtrer sur pickup |
| `exclusiveZoneCheckDropoff` | `false` par défaut — si `true`, destination aussi dans la zone |

---

## 4. Fonctionnalité 2 — Retour à la maison (heading home)

### 4.1 User story

> En tant que chauffeur, je suis à **Yopougon** et j’habite **Grand-Bassam**. Je veux activer **« Retour à la maison »** pour n’accepter que des courses qui me **rapprochent** de chez moi, étape par étape, jusqu’à arriver dans ma zone domicile.

### 4.2 Comportement attendu (inspiré « destination filter » / « along my route »)

| Étape | Comportement |
|-------|--------------|
| Configuration domicile | Le chauffeur enregistie une fois son **domicile** : zone Grand-Bassam et/ou point GPS (lat/lng) |
| Activation mode | Il active « Retour à la maison » depuis l’app (en ligne) |
| Filtrage offres | Le dispatch ne propose que les courses dont la **destination** (ou le trajet) **réduit la distance** vers le domicile |
| Enchaînement | Après chaque course, recalcul position → nouvelles offres toujours « vers la maison » |
| Arrivée | Quand le chauffeur entre dans le polygone `home_zone` (ou rayon `home_radius_km`), le mode peut **se désactiver auto** + notification |
| Désactivation manuelle | Le chauffeur coupe le mode à tout moment |

### 4.3 Exemple — Yopougon → Grand-Bassam

```
Position actuelle : Yopougon
Domicile          : Grand-Bassam (zone ou point enregistré)
Mode              : heading_home = active

Course 1 : Yopougon → Marcory
  → Destination au sud-est, vers Bassam → ✅ proposée (rapproche)

Course 2 : Yopougon → Cocody
  → Destination au nord, s’éloigne de Bassam → ❌ non proposée

Course 3 : Marcory → Port-Bouët
  → Continue vers le littoral / Bassam → ✅ proposée

Course 4 : après plusieurs courses, chauffeur dans zone Grand-Bassam
  → Mode auto-désactivé « Vous êtes rentré chez vous »
```

### 4.4 Algorithme de filtrage (à valider / implémenter côté backend)

**Proposition minimale (MVP) :**

```
home = driver.homeLocation ou centroid(homeZoneId)
current = driver.lastKnownLocation

POUR chaque commande candidate :
  d_before = distance(current, home)
  d_after  = distance(order.dropoff, home)

  SI d_after < d_before - minProgressMeters :
    ÉLIGIBLE (la course rapproche du domicile)
  SINON :
    NON ÉLIGIBLE
```

**Proposition avancée (V2) :**

- Vérifier que le **dropoff** est dans un **corridor** (buffer autour du segment `current → home`).
- Score de pertinence : plus la réduction de distance est grande, plus le chauffeur est prioritaire.
- Limiter le **détour max** : `maxDetourKm` ou `maxDetourMinutes` (paramètre chauffeur ou global).

### 4.5 Champs API proposés

```json
{
  "homeZoneId": "uuid-zone-grand-bassam",
  "homeLocation": {
    "lat": 5.2921,
    "lng": -3.7432,
    "label": "Domicile — Grand-Bassam"
  },
  "homeRadiusKm": 2,
  "headingHomeEnabled": true,
  "headingHomeActivatedAt": "2026-06-16T21:15:00Z",
  "headingHomeConfig": {
    "minProgressMeters": 500,
    "maxDetourKm": 8,
    "autoDisableOnArrival": true
  },
  "homeZone": {
    "id": "uuid-zone-grand-bassam",
    "label": "Grand-Bassam"
  }
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `homeZoneId` | UUID \| null | Zone domicile (catalogue zones) |
| `homeLocation` | `{ lat, lng, label? }` | Point précis domicile (optionnel si zone suffit) |
| `homeRadiusKm` | number | Rayon d’arrivée « chez soi » pour auto-off |
| `headingHomeEnabled` | boolean | Mode retour actif |
| `headingHomeActivatedAt` | ISO datetime | Début de session « retour » |
| `headingHomeConfig.minProgressMeters` | number | Gain minimal vers domicile pour accepter une course |
| `headingHomeConfig.maxDetourKm` | number | Détour max autorisé |
| `headingHomeConfig.autoDisableOnArrival` | boolean | Désactivation auto en zone domicile |

### 4.6 Cumul avec zone exclusive

| Combinaison | Comportement suggéré |
|-------------|---------------------|
| Exclusive Marcory seul | Uniquement courses dans Marcory |
| Retour maison seul | Courses vers Grand-Bassam depuis position actuelle |
| **Les deux actifs** | **Intersection** : courses dans Marcory **ET** qui rapprochent de Bassam — ou **interdire** la combinaison (erreur 400 à l’activation) |

> **Question produit / backend :** autoriser les deux modes simultanés ou mutuellement exclusifs ?

---

## 5. Routes API demandées

### 5.1 App chauffeur (driver)

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/v1/drivers/me/preferences` | Lire préférences (zone + domicile + modes) |
| `PATCH` | `/v1/drivers/me/preferences` | Mettre à jour préférences |
| `PUT` | `/v1/drivers/me/home` | Enregistrer / modifier domicile |
| `POST` | `/v1/drivers/me/zone-filter/activate` | Activer zone exclusive `{ zoneId, mode }` |
| `POST` | `/v1/drivers/me/zone-filter/deactivate` | Désactiver filtre zone |
| `POST` | `/v1/drivers/me/heading-home/activate` | Activer retour à la maison |
| `POST` | `/v1/drivers/me/heading-home/deactivate` | Désactiver retour |

> Alternative acceptable : tout passer par un seul `PATCH …/preferences` si les actions sont idempotentes.

### 5.2 Backoffice / admin

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/v1/drivers/{id}` | Inclure `driver_preferences` enrichi (zones avec libellés) |
| `GET` | `/v1/admin/drivers/{id}/dispatch-eligibility` | Debug : pourquoi le chauffeur reçoit / ne reçoit pas d’offres |
| `GET` | `/v1/catalog/zones?cityId=…` | Liste zones pour picker app chauffeur |

### 5.3 Dispatch / logs

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/v1/dispatch/{serviceType}/{orderId}/logs` | Lignes du type `DRIVER_EXCLUDED_ZONE_FILTER`, `DRIVER_EXCLUDED_HEADING_HOME` |
| — | Moteur dispatch | Appliquer filtres à chaque vague d’offres |

---

## 6. Exemples de payloads

### 6.1 Activer zone exclusive Marcory

```http
PATCH /v1/drivers/me/preferences
Authorization: Bearer <JWT chauffeur>
Content-Type: application/json

{
  "zoneFilterMode": "exclusive",
  "exclusiveZoneId": "uuid-zone-marcory",
  "zoneFilterActive": true
}
```

**Réponse 200 :**

```json
{
  "status": "ok",
  "preferences": {
    "zoneFilterMode": "exclusive",
    "exclusiveZoneId": "uuid-zone-marcory",
    "exclusiveZone": { "id": "uuid-zone-marcory", "label": "Marcory" },
    "zoneFilterActive": true,
    "headingHomeEnabled": false
  }
}
```

### 6.2 Configurer domicile + activer retour à la maison

```http
PUT /v1/drivers/me/home
{
  "homeZoneId": "uuid-zone-grand-bassam",
  "homeLocation": { "lat": 5.2921, "lng": -3.7432, "label": "Domicile" },
  "homeRadiusKm": 2
}
```

```http
POST /v1/drivers/me/heading-home/activate
{
  "minProgressMeters": 500,
  "maxDetourKm": 10,
  "autoDisableOnArrival": true
}
```

### 6.3 Réponse fiche chauffeur admin (enrichie)

```json
{
  "driver": { "id": "…", "availability_status": "online" },
  "driver_preferences": {
    "zoneFilterMode": "exclusive",
    "exclusiveZone": { "id": "…", "label": "Marcory" },
    "zoneFilterActive": true,
    "headingHomeEnabled": false,
    "homeZone": { "id": "…", "label": "Grand-Bassam" },
    "homeLocation": { "lat": 5.2921, "lng": 3.7432, "label": "Domicile" }
  },
  "dispatchContext": {
    "lastLocation": { "lat": 5.35, "lng": -4.05, "zoneLabel": "Yopougon" },
    "distanceToHomeKm": 18.4,
    "eligibleForOffers": true,
    "activeFilters": ["exclusive_zone:marcory"]
  }
}
```

---

## 7. Impact backoffice (lecture / config)

Le backoffice **ne configure pas** ces préférences à la place du chauffeur (sauf admin support), mais doit **voir** :

| Écran | Affichage |
|-------|-----------|
| Fiche chauffeur admin | Mode actif : « Zone exclusive : Marcory » / « Retour maison → Grand-Bassam » |
| Console dispatch | Badge sur chauffeur : filtres actifs |
| Détail course / forensic | Logs exclusion candidats |
| Paramètres dispatch | Seuils globaux (`minProgressMeters`, `maxDetourKm`, check pickup/dropoff) |

Permissions RBAC suggérées :

- `drivers.preferences.view` — lecture admin
- `drivers.preferences.override` — support (désactiver mode bloquant)

---

## 8. Règles métier & limites

| Règle | Proposition |
|-------|-------------|
| Chauffeur `offline` | Peut configurer domicile ; modes actifs mis en pause |
| Course en cours | Impossible de changer `exclusiveZoneId` jusqu’à fin course |
| Zone invalide | `exclusiveZoneId` doit appartenir à la ville/franchise du chauffeur |
| Domicile non défini | `heading-home/activate` → `400 HOME_NOT_CONFIGURED` |
| Fraude / abus | Limiter nombre d’activations / jour (optionnel) |
| Performance | Calcul distance en batch ; index spatial zones |

---

## 9. Questions ouvertes pour le backend

1. `preferred_zones` / `blocked_zones` existants : **format**, **usage dispatch réel** aujourd’hui ?
2. Zone exclusive : filtre sur **pickup seul** ou **pickup + dropoff** ?
3. Retour maison : algorithme **MVP** (distance au domicile) ou **corridor** dès V1 ?
4. Les deux modes peuvent-ils être **actifs en même temps** ?
5. Domicile : une zone, un point GPS, ou **les deux** (zone + point dans la zone) ?
6. Auto-désactivation à l’arrivée : notification push — événement à documenter ?
7. Historique : conserver les sessions « retour maison » pour stats (durée, nb courses) ?
8. Paramètres global vs par franchise (`dispatch-config` / `driver-config`) ?

---

## 10. Critères d’acceptation

### Zone exclusive

- [ ] Le chauffeur peut activer **une zone unique** (ex. Marcory).
- [ ] Aucune offre hors zone (selon règle pickup/dropoff validée).
- [ ] Désactivation immédiate côté dispatch.
- [ ] Fiche admin affiche le mode actif avec libellé zone.

### Retour à la maison

- [ ] Le chauffeur peut enregistrer son domicile (Grand-Bassam).
- [ ] En mode actif depuis Yopougon, seules les courses **rapprochant** du domicile sont proposées.
- [ ] Après enchaînement de courses, le chauffeur peut atteindre sa zone domicile.
- [ ] Auto-désactivation optionnelle à l’arrivée.
- [ ] Logs dispatch explicites (`HEADING_HOME_EXCLUDED`, etc.).

### Technique

- [ ] Routes documentées Swagger avec exemples 200 / 400.
- [ ] Objets zone enrichis (`id` + `label`), pas UUID seuls.
- [ ] Tests : Marcory exclusif ; Yopougon → Bassam ; combinaison modes.

---

## 11. Priorisation suggérée

| ID | Priorité | Sujet |
|----|----------|-------|
| **ZONE-EXCLUSIVE-01** | **P0** | Mode zone unique + filtre dispatch pickup |
| **HEADING-HOME-01** | **P0** | Domicile + filtre distance vers domicile (MVP) |
| **HEADING-HOME-02** | P1 | Corridor / détour max / score |
| **DISPATCH-LOGS-01** | P1 | Raisons d’exclusion dans logs |
| **ADMIN-VIEW-01** | P1 | Affichage backoffice fiche chauffeur |

---

## 12. Références

| Sujet | Fichier / doc |
|-------|----------------|
| Préférences chauffeur (API) | `GET /v1/drivers/{id}` → `driver_preferences` |
| Zones réseau | Admin zones, `ref_zones`, polygones |
| Dispatch & zones actives | `docs/dispatcher_caracteristique_for_front.md` |
| Enrichissement libellés | `docs/DEMANDE-BACKEND-ENRICHISSEMENT-ENTITES-LISIBLES-2026-06-16.md` |
| Liens API chauffeur | `src/core/api/links.ts` → `DRIVERS_V1_BASE`, `drivers.me` |

---

## Livrables attendus de l’équipe backend

1. Confirmation **existe / n’existe pas** pour `preferred_zones`, `blocked_zones` dans le dispatch.
2. Spécification **zone exclusive** (champs + règles + exemples Marcory).
3. Spécification **retour à la maison** (algorithme + exemple Yopougon → Grand-Bassam).
4. Routes CRUD / activate-deactivate documentées Swagger.
5. Format des **logs dispatch** pour exclusions.
6. Délais ou phasing MVP vs V2.

---

*Document rédigé pour transmission à l’équipe backend UpJunoo. Les exemples Marcory, Yopougon et Grand-Bassam sont illustratifs (Abidjan) ; le modèle doit fonctionner pour toute ville du réseau.*
