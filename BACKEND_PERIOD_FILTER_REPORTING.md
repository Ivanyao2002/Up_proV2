# Alignement backend — Filtre de période dynamique (Reporting)

**Date :** 2026-06-22
**Portail concerné :** `/reporting` (tous les sous-modules : Overview, Activite, Finance, Qualite, Gouvernance)
**Priorite :** Haute — le frontend envoie deja ces parametres

---

## Contexte

Le portail Reporting dispose desormais d'un filtre de periode dynamique. A chaque appel, le frontend envoie une plage de dates principale et, optionnellement, une periode de comparaison. Le fuseau horaire est fixe a `Africa/Abidjan` (UTC+0) — aucun sélecteur n'est expose dans l'UI pour l'instant.

Le backend **doit** accepter ces parametres et adapter ses agregations en consequence.

---

## 1. Parametres de requete attendus

Ces parametres s'appliquent aux **5 endpoints** suivants :

| Endpoint |
|----------|
| `GET /v1/reporting/overview` |
| `GET /v1/reporting/activity` |
| `GET /v1/reporting/finance` |
| `GET /v1/reporting/quality` |
| `GET /v1/reporting/governance` |

### Parametres

| Parametre | Type | Obligatoire | Exemple | Description |
|-----------|------|-------------|---------|-------------|
| `date_from` | `string (YYYY-MM-DD)` | Non (defaut : 1er du mois courant) | `2026-06-01` | Debut de la periode principale |
| `date_to` | `string (YYYY-MM-DD)` | Non (defaut : aujourd'hui) | `2026-06-22` | Fin de la periode principale (inclusive) |
| `timezone` | `string (IANA)` | Non — toujours `Africa/Abidjan` | `Africa/Abidjan` | Fixe a UTC+0. Accepter le parametre mais ne pas valider d'autres valeurs pour l'instant |
| `comparison_date_from` | `string (YYYY-MM-DD)` | Non | `2026-05-10` | Debut de la periode de comparaison |
| `comparison_date_to` | `string (YYYY-MM-DD)` | Non | `2026-05-31` | Fin de la periode de comparaison (inclusive) |

---

## 2. Interpretation des dates (`timezone = Africa/Abidjan`, UTC+0)

`date_from` et `date_to` sont des **dates sans heure**. Avec `Africa/Abidjan` (UTC+0), la conversion est directe — pas de decalage :

```
date_from  →  {date_from}T00:00:00Z   (minuit UTC)
date_to    →  {date_to}T23:59:59Z     (fin de journee UTC)
```

**Exemple :**

```
date_from = "2026-06-01"  →  borne_inf = 2026-06-01T00:00:00Z
date_to   = "2026-06-22"  →  borne_sup = 2026-06-22T23:59:59Z
```

> Le parametre `timezone` est transmis meme si UTC+0 ne genere pas de decalage, afin de rester coherent avec le contrat API et preparer une extension future (Nigeria, Kenya, France…) sans changement de signature.

---

## 3. Comportement avec une periode de comparaison

Quand `comparison_date_from` et `comparison_date_to` sont presents, le backend doit calculer les KPIs **pour les deux periodes** et renseigner `previous_value` et `change_pct` d'apres la periode de comparaison.

### Formule

```
change_pct = ((valeur_principale - valeur_comparaison) / valeur_comparaison) * 100
```

Arrondi a 1 decimale. Retourner `null` si `valeur_comparaison = 0`.

### Sans periode de comparaison

Si `comparison_date_from/to` sont absents :

- Option A : retourner `previous_value: null` et `change_pct: null`
- Option B : calculer automatiquement la periode precedente de meme duree

Le frontend affiche "vs periode precedente" si aucune comparaison n'est fournie, et les vraies dates si elles sont presentes.

---

## 4. Structure de reponse — champ `period`

Tous les endpoints de reporting renvoient un objet `ReportingBase`. Le champ `period` doit **repercuter la periode recue**, y compris les champs de comparaison si fournis :

```json
{
  "period": {
    "date_from": "2026-06-01",
    "date_to": "2026-06-22",
    "timezone": "Africa/Abidjan",
    "comparison_date_from": "2026-05-10",
    "comparison_date_to": "2026-05-31"
  },
  "scope": {},
  "generated_at": "2026-06-22T10:00:00Z",
  "kpis": {}
}
```

`comparison_date_from` et `comparison_date_to` sont omis dans `period` si non fournis dans la requete.

---

## 5. Exemple de requete complete

**Avec periode de comparaison :**
```http
GET /v1/reporting/overview?date_from=2026-06-01&date_to=2026-06-22&timezone=Africa%2FAbidjan&comparison_date_from=2026-05-10&comparison_date_to=2026-05-31
Authorization: Bearer <token>
```

**Sans periode de comparaison (cas le plus courant) :**
```http
GET /v1/reporting/overview?date_from=2026-06-01&date_to=2026-06-22&timezone=Africa%2FAbidjan
Authorization: Bearer <token>
```

### Reponse attendue (extrait KPIs) :

```json
{
  "period": {
    "date_from": "2026-06-01",
    "date_to": "2026-06-22",
    "timezone": "Africa/Abidjan",
    "comparison_date_from": "2026-05-10",
    "comparison_date_to": "2026-05-31"
  },
  "kpis": {
    "total_activity": {
      "value": 1240,
      "previous_value": 1105,
      "change_pct": 12.2
    },
    "gmv": {
      "value": 8450000,
      "previous_value": 7600000,
      "change_pct": 11.2,
      "currency": "XOF"
    },
    "active_clients": {
      "value": 340,
      "previous_value": 310,
      "change_pct": 9.7
    },
    "complaint_rate": {
      "value": 2.1,
      "previous_value": 2.8,
      "change_pct": -25.0
    }
  }
}
```

---

## 6. Valeurs par defaut si parametres absents

| Parametre absent | Comportement attendu |
|-----------------|----------------------|
| `date_from` | 1er jour du mois courant (UTC+0) |
| `date_to` | Aujourd'hui (UTC+0) |
| `timezone` | `Africa/Abidjan` |
| `comparison_date_from` + `comparison_date_to` | `previous_value` et `change_pct` calcules sur la periode precedente de meme duree, ou `null` |

---

## 7. Coexistence avec les autres filtres

Ces parametres s'ajoutent aux filtres existants (`service`, `country_code`, `zone_id`, `franchise_id`, `partner_id`, `group_by`). La periode definit la **fenetre temporelle** ; les autres filtres reduisent le **perimetre metier** a l'interieur de cette fenetre.

---

## 8. Codes d'erreur attendus

| Cas | Code HTTP | Message suggere |
|-----|-----------|-----------------|
| `date_from` ou `date_to` au format invalide | `400` | `"date_from doit etre au format YYYY-MM-DD"` |
| `date_from > date_to` | `400` | `"date_from doit etre anterieure a date_to"` |
| `comparison_date_from > comparison_date_to` | `400` | `"comparison_date_from doit etre anterieure a comparison_date_to"` |

---

## 9. Checklist backend

- [ ] Accepter `date_from` et `date_to` (query params) sur les 5 endpoints
- [ ] Accepter `timezone` — ignorer les valeurs autres que `Africa/Abidjan` pour l'instant, ou defaulter silencieusement
- [ ] Accepter `comparison_date_from` et `comparison_date_to` (optionnels) sur les 5 endpoints
- [ ] Interpreter `date_from` comme `{date}T00:00:00Z` et `date_to` comme `{date}T23:59:59Z`
- [ ] Calculer `previous_value` et `change_pct` depuis la periode de comparaison quand fournie
- [ ] Retourner `comparison_date_from/to` dans le champ `period` de la reponse si fournis
- [ ] Valider le format `YYYY-MM-DD` — retourner `400` si invalide
- [ ] Valider que `date_from <= date_to` — retourner `400` si invalide
