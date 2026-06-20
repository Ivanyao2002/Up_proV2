# API du module Reporting

## 1. Objectif

Le module Reporting fournit une vue consolidée et en lecture seule des données
de la plateforme. Il couvre les 22 indicateurs attendus dans le plan de recette :
activité, finance, performance opérationnelle, qualité, audit et conformité.

Base URL : `/v1/reporting`

Authentification : `Authorization: Bearer <token>`

Rôles autorisés :

- `reporting`
- `admin`
- `direction`

Permissions :

- `reporting.dashboard.view`
- `reporting.activity.view`
- `reporting.finance.view`
- `reporting.quality.view`
- `reporting.governance.view`
- `reporting.exports.view`

Le rôle Reporting peut consulter et exporter les agrégats. Il ne peut ni
modifier une course, ni valider une opération financière, ni traiter une
réclamation.

## 2. Périmètre fonctionnel

### Tableau de bord

- indicateurs principaux de la période ;
- comparaison avec la période précédente ;
- évolution temporelle ;
- répartition par service ;
- alertes de qualité et de conformité.

### Activité consolidée

- activité totale de la plateforme ;
- activité par service, zone, franchise et partenaire ;
- performance des chauffeurs et livreurs ;
- volumes créés, acceptés, terminés et annulés ;
- taux d’acceptation, d’annulation et de finalisation.

### Finance analytique

- recettes brutes ou GMV ;
- commissions plateforme, partenaires et franchises ;
- soldes wallets ;
- recharges et débits ;
- transactions par statut et moyen de paiement.

Ce domaine affiche des agrégats analytiques. Les écritures comptables, les
rapprochements et les validations restent dans le module Comptabilité.

### Qualité

- incidents ;
- réclamations ;
- délais de prise en charge et de résolution ;
- taux d’incident et de réclamation ;
- répartition par niveau de gravité et catégorie.

### Gouvernance

- activité d’audit ;
- opérations sensibles ;
- conformité des chauffeurs, livreurs, véhicules, partenaires et franchises ;
- documents expirés ou proches de l’expiration.

### Exports

- catalogue des rapports disponibles ;
- génération CSV ou XLSX ;
- historique et statut des exports ;
- téléchargement sécurisé du fichier généré.

## 3. Filtres communs

Les filtres suivants sont applicables aux routes analytiques :

| Paramètre | Type | Description |
|---|---|---|
| `date_from` | `YYYY-MM-DD` | Début inclus de la période |
| `date_to` | `YYYY-MM-DD` | Fin incluse de la période |
| `timezone` | chaîne IANA | Fuseau utilisé pour les regroupements journaliers |
| `service` | `taxi`, `delivery`, `freight`, `rental` | Service concerné |
| `country_code` | chaîne ISO 3166-1 alpha-2 | Pays |
| `zone_id` | UUID | Zone |
| `franchise_id` | UUID | Franchise |
| `partner_id` | UUID | Partenaire |
| `group_by` | `day`, `week`, `month` | Granularité des séries |

Règles :

- la période par défaut est le mois en cours ;
- `timezone` vaut `Africa/Abidjan` par défaut ;
- la période maximale d’une requête interactive est de 366 jours ;
- les filtres sont cumulables ;
- un identifiant hors du périmètre autorisé retourne `403`;
- les dates et heures retournées sont au format ISO 8601 UTC.

Exemple :

```http
GET /v1/reporting/activity?date_from=2026-06-01&date_to=2026-06-30&service=taxi&group_by=day
```

## 4. Définitions des indicateurs

Les mêmes formules doivent être utilisées dans l’interface, les exports et les
réponses API.

| Indicateur | Définition |
|---|---|
| Activité totale | Nombre de demandes créées pendant la période |
| Activité terminée | Nombre de demandes au statut final `completed` |
| GMV / recettes brutes | Somme des montants payés des demandes terminées, hors recharges wallet |
| Commission plateforme | Somme des commissions plateforme comptabilisées |
| Commission partenaire | Somme des commissions partenaires comptabilisées |
| Commission franchise | Somme des commissions franchises comptabilisées |
| Taux d’annulation | `cancelled / (completed + cancelled) * 100` |
| Taux d’acceptation | `offres acceptées / offres envoyées * 100` |
| Taux de finalisation | `completed / demandes acceptées * 100` |
| Chauffeur ou livreur actif | Profil ayant terminé au moins une mission pendant la période |
| Client actif | Client ayant créé au moins une demande pendant la période |
| Taux de réclamation | `tickets créés / demandes terminées * 100` |
| Délai moyen de prise en charge | Moyenne entre création et première assignation d’un ticket |
| Délai moyen de résolution | Moyenne entre création et résolution d’un ticket |
| Taux de conformité | `entités conformes / entités contrôlées * 100` |

Les montants sont retournés en unités monétaires entières, sans décimales, avec
le code devise associé.

## 5. Format commun des réponses

Chaque réponse analytique rappelle le périmètre effectivement appliqué.

```json
{
  "period": {
    "date_from": "2026-06-01",
    "date_to": "2026-06-30",
    "timezone": "Africa/Abidjan",
    "comparison_date_from": "2026-05-01",
    "comparison_date_to": "2026-05-31"
  },
  "scope": {
    "service": null,
    "country_code": null,
    "zone_id": null,
    "franchise_id": null,
    "partner_id": null
  },
  "generated_at": "2026-06-20T10:45:00Z"
}
```

Une variation est exprimée en pourcentage. Elle vaut `null` lorsque la période
de comparaison ne permet pas un calcul fiable.

```json
{
  "value": 1250,
  "previous_value": 1100,
  "change_pct": 13.64
}
```

## 6. Routes analytiques

### 6.1 Options de filtres

```http
GET /v1/reporting/filter-options
```

Retourne uniquement les dimensions accessibles à l’utilisateur connecté.

```json
{
  "services": [
    { "value": "taxi", "label": "VTC" },
    { "value": "delivery", "label": "Livraison" },
    { "value": "freight", "label": "Fret" },
    { "value": "rental", "label": "Location" }
  ],
  "countries": [
    { "code": "CI", "name": "Côte d’Ivoire" }
  ],
  "zones": [
    { "id": "zone_uuid", "name": "Abidjan Centre", "country_code": "CI" }
  ],
  "franchises": [
    { "id": "franchise_uuid", "name": "Franchise Abidjan", "zone_id": "zone_uuid" }
  ],
  "partners": [
    {
      "id": "partner_uuid",
      "name": "Partenaire Démo",
      "franchise_id": "franchise_uuid"
    }
  ]
}
```

### 6.2 Synthèse du tableau de bord

```http
GET /v1/reporting/overview
```

Permission : `reporting.dashboard.view`

Réponse :

```json
{
  "period": {},
  "scope": {},
  "generated_at": "2026-06-20T10:45:00Z",
  "kpis": {
    "total_activity": {
      "value": 12450,
      "previous_value": 11280,
      "change_pct": 10.37
    },
    "completed_activity": {
      "value": 10840,
      "previous_value": 9960,
      "change_pct": 8.84
    },
    "gmv": {
      "value": 184500000,
      "currency": "XOF",
      "previous_value": 169200000,
      "change_pct": 9.04
    },
    "platform_commission": {
      "value": 22140000,
      "currency": "XOF",
      "previous_value": 20304000,
      "change_pct": 9.04
    },
    "active_drivers": {
      "value": 842,
      "previous_value": 790,
      "change_pct": 6.58
    },
    "active_clients": {
      "value": 6310,
      "previous_value": 5982,
      "change_pct": 5.48
    },
    "cancellation_rate": {
      "value": 6.8,
      "previous_value": 7.4,
      "change_pct": -8.11
    },
    "complaint_rate": {
      "value": 1.7,
      "previous_value": 1.9,
      "change_pct": -10.53
    }
  },
  "activity_series": [
    {
      "bucket": "2026-06-01",
      "created": 420,
      "completed": 372,
      "cancelled": 28,
      "gmv": 6150000,
      "currency": "XOF"
    }
  ],
  "service_breakdown": [
    {
      "service": "taxi",
      "activity": 7800,
      "completed": 7010,
      "gmv": 109000000,
      "currency": "XOF"
    }
  ],
  "alerts": [
    {
      "code": "CANCELLATION_RATE_HIGH",
      "severity": "warning",
      "label": "Taux d’annulation supérieur au seuil",
      "value": 12.4,
      "threshold": 10,
      "dimension": {
        "type": "franchise",
        "id": "franchise_uuid",
        "label": "Franchise Abidjan"
      }
    }
  ]
}
```

### 6.3 Activité consolidée

```http
GET /v1/reporting/activity
```

Permission : `reporting.activity.view`

Paramètres supplémentaires :

| Paramètre | Valeurs |
|---|---|
| `dimension` | `service`, `country`, `zone`, `franchise`, `partner`, `driver`, `deliverer` |
| `page` | entier positif |
| `per_page` | entier de 1 à 100 |
| `sort` | `activity`, `completed`, `gmv`, `acceptance_rate`, `cancellation_rate`, `completion_rate` |
| `order` | `asc`, `desc` |

Réponse :

```json
{
  "period": {},
  "scope": {},
  "generated_at": "2026-06-20T10:45:00Z",
  "summary": {
    "created": 12450,
    "accepted": 11620,
    "in_progress": 180,
    "completed": 10840,
    "cancelled": 790,
    "acceptance_rate": 84.2,
    "cancellation_rate": 6.79,
    "completion_rate": 93.29
  },
  "series": [
    {
      "bucket": "2026-06-01",
      "created": 420,
      "accepted": 391,
      "completed": 372,
      "cancelled": 28
    }
  ],
  "ranking": {
    "dimension": "franchise",
    "data": [
      {
        "id": "franchise_uuid",
        "label": "Franchise Abidjan",
        "activity": 4200,
        "completed": 3810,
        "gmv": 62000000,
        "currency": "XOF",
        "acceptance_rate": 87.4,
        "cancellation_rate": 5.8,
        "completion_rate": 94.1
      }
    ],
    "meta": {
      "total": 12,
      "per_page": 25,
      "current_page": 1,
      "last_page": 1
    }
  }
}
```

Pour les dimensions `driver` et `deliverer`, la réponse doit rester paginée et
ne doit exposer aucune donnée personnelle inutile.

### 6.4 Finance analytique

```http
GET /v1/reporting/finance
```

Permission : `reporting.finance.view`

Réponse :

```json
{
  "period": {},
  "scope": {},
  "generated_at": "2026-06-20T10:45:00Z",
  "currency": "XOF",
  "kpis": {
    "gross_revenue": 184500000,
    "platform_commission": 22140000,
    "partner_commission": 12915000,
    "franchise_commission": 9225000,
    "wallet_balance": 98500000,
    "wallet_topups": 42800000,
    "wallet_debits": 36100000,
    "transactions_count": 18620
  },
  "series": [
    {
      "bucket": "2026-06-01",
      "gross_revenue": 6150000,
      "platform_commission": 738000,
      "partner_commission": 430500,
      "franchise_commission": 307500,
      "wallet_topups": 1420000,
      "wallet_debits": 1180000
    }
  ],
  "transactions": {
    "by_status": [
      { "status": "completed", "count": 17820, "amount": 213500000 },
      { "status": "pending", "count": 620, "amount": 7800000 },
      { "status": "failed", "count": 180, "amount": 2150000 }
    ],
    "by_payment_method": [
      { "payment_method": "cash", "count": 8200, "amount": 74500000 },
      { "payment_method": "wallet", "count": 6280, "amount": 68700000 },
      { "payment_method": "mobile_money", "count": 4140, "amount": 70300000 }
    ]
  },
  "commission_breakdown": [
    {
      "dimension_type": "franchise",
      "dimension_id": "franchise_uuid",
      "dimension_label": "Franchise Abidjan",
      "gross_revenue": 62000000,
      "platform_commission": 7440000,
      "partner_commission": 4340000,
      "franchise_commission": 3100000
    }
  ]
}
```

Si plusieurs devises sont sélectionnées, le backend ne doit pas additionner les
montants sans conversion explicite. Il retourne un bloc par devise.

### 6.5 Qualité, incidents et réclamations

```http
GET /v1/reporting/quality
```

Permission : `reporting.quality.view`

Réponse :

```json
{
  "period": {},
  "scope": {},
  "generated_at": "2026-06-20T10:45:00Z",
  "kpis": {
    "incidents_count": 96,
    "critical_incidents_count": 8,
    "complaints_count": 184,
    "complaint_rate": 1.7,
    "average_first_assignment_minutes": 6.4,
    "average_resolution_minutes": 148.2,
    "resolved_within_sla_rate": 91.5
  },
  "incidents_by_severity": [
    { "severity": "info", "count": 32 },
    { "severity": "warning", "count": 56 },
    { "severity": "critical", "count": 8 }
  ],
  "complaints_by_category": [
    { "category": "payment", "count": 74 },
    { "category": "behavior", "count": 45 },
    { "category": "service", "count": 39 },
    { "category": "logistics", "count": 18 },
    { "category": "app", "count": 8 }
  ],
  "series": [
    {
      "bucket": "2026-06-01",
      "incidents": 4,
      "complaints": 7,
      "resolved_complaints": 6,
      "average_resolution_minutes": 132.5
    }
  ],
  "ranking": [
    {
      "dimension_type": "franchise",
      "dimension_id": "franchise_uuid",
      "dimension_label": "Franchise Abidjan",
      "completed_activity": 3810,
      "incidents": 28,
      "complaints": 61,
      "complaint_rate": 1.6
    }
  ]
}
```

Cette route consomme les données du module Support mais ne remplace pas ses
routes de traitement des tickets.

### 6.6 Audit et conformité

```http
GET /v1/reporting/governance
```

Permission : `reporting.governance.view`

Réponse :

```json
{
  "period": {},
  "scope": {},
  "generated_at": "2026-06-20T10:45:00Z",
  "audit": {
    "events_count": 4820,
    "sensitive_events_count": 74,
    "failed_actions_count": 19,
    "events_by_category": [
      { "category": "finance", "count": 820 },
      { "category": "support", "count": 610 },
      { "category": "authentication", "count": 920 },
      { "category": "administration", "count": 2470 }
    ]
  },
  "compliance": {
    "global_rate": 93.4,
    "entities_checked": 1840,
    "entities_compliant": 1718,
    "documents_expired": 42,
    "documents_expiring_soon": 96,
    "by_entity_type": [
      {
        "entity_type": "driver",
        "checked": 1120,
        "compliant": 1045,
        "compliance_rate": 93.3
      },
      {
        "entity_type": "vehicle",
        "checked": 720,
        "compliant": 673,
        "compliance_rate": 93.5
      }
    ]
  }
}
```

Le reporting retourne uniquement des agrégats. Le détail des événements reste
accessible depuis les journaux d’audit des modules concernés, selon les
permissions de l’utilisateur.

## 7. Routes d’export

Les exports sont générés de manière asynchrone. Une requête de longue durée ne
doit pas maintenir une connexion HTTP ouverte jusqu’à la création du fichier.

### 7.1 Catalogue des rapports

```http
GET /v1/reporting/reports
```

Permission : `reporting.exports.view`

Rapports minimaux :

| Code | Contenu |
|---|---|
| `platform_activity` | Activité totale |
| `activity_by_service` | Activité par service |
| `activity_by_zone` | Activité par zone |
| `activity_by_franchise` | Activité par franchise |
| `activity_by_partner` | Activité par partenaire |
| `driver_performance` | Performance chauffeurs |
| `deliverer_performance` | Performance livreurs |
| `financial_summary` | Recettes et commissions |
| `wallets` | Soldes wallets |
| `wallet_topups` | Recharges |
| `wallet_debits` | Débits |
| `transactions` | Transactions |
| `incidents` | Incidents |
| `complaints` | Réclamations |
| `operational_rates` | Acceptation, annulation et finalisation |
| `audit_summary` | Synthèse d’audit |
| `compliance_summary` | Conformité globale |

Réponse :

```json
{
  "data": [
    {
      "code": "activity_by_franchise",
      "label": "Activité par franchise",
      "description": "Volumes, GMV et taux opérationnels par franchise.",
      "formats": ["csv", "xlsx"],
      "available_filters": [
        "date_from",
        "date_to",
        "service",
        "country_code",
        "zone_id",
        "franchise_id"
      ]
    }
  ]
}
```

### 7.2 Créer un export

```http
POST /v1/reporting/exports
Content-Type: application/json
```

Permission : `reporting.exports.view`

Body :

```json
{
  "report_code": "activity_by_franchise",
  "format": "xlsx",
  "filters": {
    "date_from": "2026-06-01",
    "date_to": "2026-06-30",
    "service": null,
    "country_code": "CI",
    "zone_id": null,
    "franchise_id": null,
    "partner_id": null,
    "timezone": "Africa/Abidjan"
  }
}
```

Réponse `202 Accepted` :

```json
{
  "id": "export_uuid",
  "report_code": "activity_by_franchise",
  "format": "xlsx",
  "status": "queued",
  "created_at": "2026-06-20T10:45:00Z"
}
```

### 7.3 Lister les exports

```http
GET /v1/reporting/exports?page=1&per_page=25&status=ready
```

Statuts : `queued`, `processing`, `ready`, `failed`, `expired`

Réponse :

```json
{
  "data": [
    {
      "id": "export_uuid",
      "report_code": "activity_by_franchise",
      "report_label": "Activité par franchise",
      "format": "xlsx",
      "status": "ready",
      "created_by": {
        "id": "user_uuid",
        "name": "Analyste Reporting"
      },
      "created_at": "2026-06-20T10:45:00Z",
      "completed_at": "2026-06-20T10:45:12Z",
      "expires_at": "2026-06-27T10:45:12Z",
      "file_size_bytes": 284620,
      "error_message": null
    }
  ],
  "meta": {
    "total": 18,
    "per_page": 25,
    "current_page": 1,
    "last_page": 1
  }
}
```

### 7.4 Consulter un export

```http
GET /v1/reporting/exports/:id
```

Cette route sert au polling tant que le statut vaut `queued` ou `processing`.

### 7.5 Télécharger un export

```http
GET /v1/reporting/exports/:id/download
```

Le téléchargement est autorisé uniquement si :

- l’export appartient à l’utilisateur courant ou celui-ci possède une
  permission d’administration ;
- le statut vaut `ready`;
- le fichier n’est pas expiré.

Le backend peut répondre avec le fichier ou avec une URL signée de courte durée.

## 8. Temps réel

Socket.IO n’est pas nécessaire pour les tableaux analytiques.

Pour les exports, le frontend utilise le polling de
`GET /v1/reporting/exports/:id`. Un événement temps réel
`reporting:export_updated` peut être ajouté plus tard, mais il ne fait pas
partie du MVP.

## 9. Erreurs

Format :

```json
{
  "message": "La période demandée dépasse 366 jours.",
  "code": "REPORTING_PERIOD_TOO_LARGE",
  "errors": {
    "date_to": ["Réduisez la période ou utilisez un export."]
  }
}
```

| Code | HTTP | Description |
|---|---:|---|
| `REPORTING_INVALID_FILTERS` | 422 | Filtres incompatibles ou invalides |
| `REPORTING_PERIOD_TOO_LARGE` | 422 | Période interactive supérieure à 366 jours |
| `REPORTING_SCOPE_DENIED` | 403 | Périmètre non autorisé |
| `REPORT_NOT_FOUND` | 404 | Code rapport inconnu |
| `EXPORT_NOT_FOUND` | 404 | Export inexistant ou non accessible |
| `EXPORT_NOT_READY` | 409 | Fichier pas encore disponible |
| `EXPORT_EXPIRED` | 410 | Fichier supprimé après expiration |
| `EXPORT_FORMAT_NOT_SUPPORTED` | 422 | Format indisponible pour ce rapport |
| `EXPORT_GENERATION_FAILED` | 500 | Échec de génération |

## 10. Règles backend

- les agrégats doivent provenir de données validées et persistées ;
- les routes Reporting ne doivent déclencher aucune mutation métier ;
- le contrôle de périmètre est appliqué côté backend ;
- chaque export enregistre son auteur, ses filtres et sa date de génération ;
- les valeurs affichées et exportées utilisent exactement les mêmes formules ;
- les recharges wallet ne sont jamais comptées dans le GMV ;
- les commissions sont calculées depuis les écritures comptabilisées, pas à
  partir d’une estimation frontend ;
- les données personnelles sont exclues des agrégats et limitées dans les
  exports ;
- les résultats fréquents peuvent être mis en cache, avec `generated_at`
  permettant d’indiquer leur fraîcheur ;
- les requêtes lourdes utilisent des tables d’agrégats, vues matérialisées ou
  traitements asynchrones ;
- toute génération et tout téléchargement d’export doit être audité.

## 11. Priorités d’implémentation

### MVP

1. `GET /v1/reporting/filter-options`
2. `GET /v1/reporting/overview`
3. `GET /v1/reporting/activity`
4. `GET /v1/reporting/finance`
5. `GET /v1/reporting/quality`
6. `GET /v1/reporting/reports`
7. `POST /v1/reporting/exports`
8. `GET /v1/reporting/exports`
9. `GET /v1/reporting/exports/:id`
10. `GET /v1/reporting/exports/:id/download`

### Phase 2

1. `GET /v1/reporting/governance`
2. rapports enregistrés par utilisateur ;
3. envoi planifié par email ;
4. comparaison automatique entre plusieurs franchises ou périodes ;
5. événement temps réel de fin d’export.

## 12. Résumé des routes

| Méthode | Route | Usage |
|---|---|---|
| `GET` | `/v1/reporting/filter-options` | Dimensions accessibles |
| `GET` | `/v1/reporting/overview` | Tableau de bord |
| `GET` | `/v1/reporting/activity` | Activité et performance |
| `GET` | `/v1/reporting/finance` | Finance analytique |
| `GET` | `/v1/reporting/quality` | Incidents et réclamations |
| `GET` | `/v1/reporting/governance` | Audit et conformité |
| `GET` | `/v1/reporting/reports` | Catalogue des rapports |
| `POST` | `/v1/reporting/exports` | Générer un export |
| `GET` | `/v1/reporting/exports` | Historique des exports |
| `GET` | `/v1/reporting/exports/:id` | Statut d’un export |
| `GET` | `/v1/reporting/exports/:id/download` | Télécharger un export |
