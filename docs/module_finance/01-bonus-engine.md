# 01 — Moteur de Bonus hebdomadaire de performance

> Voir le socle : `README.md`. Ce document détaille le **bonus de performance** (par nombre de courses) — **inexistant aujourd'hui**, entièrement à créer, **100 % paramétrable**.

---

## 1. Règle métier (validée)

- Le bonus est calculé **par semaine**, le décompte démarrant à compter de la **date d'inscription** du chauffeur.
- **Par défaut**, la semaine commence le **jour de la semaine où le chauffeur s'est inscrit** ; le chauffeur **peut paramétrer** ce jour de début.
- Paliers **par défaut** (modifiables) :

| Courses dans la semaine | Bonus |
|---|---|
| **10 courses** | **2 500 FCFA** |
| **15 courses** | **4 000 FCFA** |
| **20 courses** | **6 000 FCFA** |

- **Modèle de versement : palier le plus haut atteint** (1 seul versement). Ex. 23 courses ⇒ **6 000 F** (pas 2 500 + 4 000 + 6 000).
- Le bonus est **versé sur le portefeuille RETIRABLE** du chauffeur (`balance_bucket = WITHDRAWABLE`) → il devient de l'**argent retirable**.
- Les paliers sont **configurables dans le back-office** et **ajoutables** selon le besoin de l'**Admin** (global) ou de la **Franchise** (locale).

### Exemples de versement (palier max)
```
 9 courses  ⇒ 0 F
12 courses  ⇒ 2 500 F
17 courses  ⇒ 4 000 F
23 courses  ⇒ 6 000 F
```

---

## 2. Fenêtre hebdomadaire (calcul de la semaine)

- `bonus_week_start_dow` (colonne ajoutée sur `drivers`) = jour de début de semaine (0 = dimanche … 6 = samedi).
  - **Défaut à l'inscription** : `EXTRACT(DOW FROM drivers.created_at)`.
  - Le chauffeur peut le modifier (1 changement / semaine max recommandé, pour éviter l'abus — paramétrable).
- Une **semaine** = fenêtre glissante de 7 jours `[period_start 00:00 → period_end 00:00)` dans le fuseau de la franchise (`Africa/Abidjan` par défaut).
- Les courses sont comptées par leur **date de complétion** (`completed_at` / `delivered_at`) dans la fenêtre.

> **Décompte des courses** : il n'existe **pas** de compteur `completed_orders` sur `drivers`. On compte à la volée depuis `rides` (et `deliveries` si inclus) avec statut terminé. Quels services comptent = paramètre `counted_service_types` de la règle (défaut recommandé : `['RIDE','DELIVERY_CARGO']`, ajustable).

---

## 3. Évaluation & versement (cron)

Un **worker planifié** (réutiliser l'infra `maintenance`/cron existante) tourne **quotidiennement** :

```
POUR chaque chauffeur dont la semaine se clôture aujourd'hui (today == period_end) :
  1. period_start, period_end ← fenêtre de la semaine qui vient de se terminer
  2. trips ← COUNT(courses terminées de ce chauffeur dans [period_start, period_end)
                filtré par counted_service_types)
  3. rule  ← bonus_rule active applicable (cf. §5, résolution global→franchise→campagne)
  4. tier  ← palier le plus haut de rule.tiers tel que trips >= tier.min_trips
  5. SI tier existe ET montant > 0 :
       - INSERT driver_bonus_awards (idempotent sur (driver_id, period_start))
       - écrire ledger_entry : credit, bucket=WITHDRAWABLE, entry_type='performance_bonus'
       - wallet_apply_movement(wallet, 'WITHDRAWABLE', +tier.reward_xof)
       - notifier le chauffeur ("Bonus de X F crédité 🎉")
     SINON :
       - INSERT driver_bonus_awards status='skipped' (trace, pas de crédit)
```

- **Idempotence** : `idempotency_key = bonus:{driver_id}:{period_start}` → un seul versement par chauffeur et par semaine, même si le job repasse.
- **Source de financement** : le bonus est une **charge** (compte interne `WL-BONUS` / part Centrale ou Franchise selon qui finance la campagne) → écriture comptable miroir (cf. `06-comptabilite.md`).

---

## 4. Tables

### 4.1 `bonus_rules` (NOUVELLE)
Paliers paramétrables, sur le modèle de `commission_rules` (scopes + priorité + dates d'effet).

| Colonne | Type | Description |
|---|---|---|
| `id` | UUID PK | |
| `scope` | VARCHAR(20) | `GLOBAL` \| `FRANCHISE` \| `PARTNER` |
| `franchise_id` | UUID FK null | si scope FRANCHISE |
| `partner_id` | UUID FK null | si scope PARTNER |
| `period` | VARCHAR(20) | `WEEKLY` (extensible) |
| `payout_model` | VARCHAR(20) | `HIGHEST_TIER` (défaut) \| `CUMULATIVE` |
| `counted_service_types` | TEXT[] | services comptés (défaut `['RIDE','DELIVERY_CARGO']`) |
| `tiers` | JSONB | `[{ "min_trips":10,"reward_xof":2500 }, {15,4000}, {20,6000}]` |
| `funded_by` | VARCHAR(20) | `CENTRAL` \| `FRANCHISE` \| `PARTNER` (qui supporte la charge) |
| `priority` | INTEGER | la plus prioritaire (la plus basse/haute selon convention) gagne |
| `active` | BOOLEAN | |
| `effective_from` / `effective_to` | TIMESTAMPTZ | période de validité |
| `metadata` | JSONB | libellé campagne, conditions extra |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

> Les **paliers ajoutables** = simple édition du tableau `tiers` (JSONB) → aucun déploiement code. L'Admin peut créer une `bonus_rule` `GLOBAL`, une Franchise une règle `FRANCHISE` qui **override** localement, ou une **campagne** ponctuelle (effective_from/to).

### 4.2 `driver_bonus_awards` (NOUVELLE — traçabilité)

| Colonne | Type | Description |
|---|---|---|
| `id` | UUID PK | |
| `driver_id` | UUID FK | |
| `wallet_id` | UUID FK | |
| `bonus_rule_id` | UUID FK | règle appliquée |
| `period_start` / `period_end` | TIMESTAMPTZ | fenêtre évaluée |
| `trips_counted` | INTEGER | nb de courses comptées |
| `tier_reached_min_trips` | INTEGER null | palier atteint |
| `reward_xof` | NUMERIC(12,2) | montant versé (0 si skip) |
| `status` | VARCHAR(20) | `paid` \| `skipped` \| `reversed` |
| `ledger_entry_id` | BIGINT FK null | lien ledger |
| `idempotency_key` | VARCHAR(200) UNIQUE | `bonus:{driver_id}:{period_start}` |
| `created_at` | TIMESTAMPTZ | |

### 4.3 `drivers` (EXISTANTE — ajout)
- `bonus_week_start_dow SMALLINT` (0–6, défaut = jour d'inscription).

---

## 5. Résolution de la règle applicable

Pour un chauffeur (franchise F, partenaire P), à la date D :
1. Filtrer `bonus_rules` actives, `effective_from ≤ D < effective_to`.
2. Priorité : `PARTNER` (P) > `FRANCHISE` (F) > `GLOBAL`, départage par `priority`.
3. La 1ère qui matche fournit `tiers`, `payout_model`, `counted_service_types`, `funded_by`.

> Si aucune règle active : **pas de bonus** (pas d'erreur).

---

## 6. Backend — endpoints

### Chauffeur (App)
| Méthode | Endpoint | Rôle |
|---|---|---|
| `GET` | `/v1/drivers/me/bonus` | Statut semaine en cours : `{ period_start, period_end, trips_counted, next_tier, current_reward_projection, week_start_dow }` |
| `GET` | `/v1/drivers/me/bonus/history` | Historique des `driver_bonus_awards` |
| `PUT` | `/v1/drivers/me/bonus/settings` | Modifier `bonus_week_start_dow` (validé : 1 changement/semaine) |

### Back-office (Admin / Franchise)
| Méthode | Endpoint | Permission |
|---|---|---|
| `GET` | `/v1/admin/bonus-rules` | `finance.bonus.view` |
| `POST` | `/v1/admin/bonus-rules` | `finance.bonus.manage` |
| `PATCH` | `/v1/admin/bonus-rules/:id` | `finance.bonus.manage` |
| `GET` | `/v1/admin/bonus-awards` | `finance.bonus.view` (filtre franchise/partner/période) |
| `GET` | `/v1/franchise/finance/bonus-rules` | scope franchise (lecture + création locale) |
| `POST` | `/v1/franchise/finance/bonus-rules` | `franchise.bonus.manage` |

---

## 7. Back-office — écrans

**Admin Centrale & Franchise** :
- Liste des règles de bonus (global + locales) avec paliers, période, financeur, statut.
- Éditeur de paliers (ajouter/retirer une ligne `{min_trips, reward_xof}`, glisser-déposer).
- Création de **campagne** (dates d'effet, scope, financeur).
- Tableau des **versements** (`driver_bonus_awards`) : chauffeur, semaine, courses, palier, montant, statut, lien ledger.
- KPI : coût total des bonus / semaine / franchise, nb de chauffeurs récompensés, distribution par palier.

---

## 8. App front-end — écran chauffeur « Mes bonus »

- **Barre de progression** vers le prochain palier (ex. `12 / 15 courses → 4 000 F`).
- Compteur de courses de la semaine en cours + temps restant avant clôture.
- Réglage du **jour de début de semaine** (sélecteur, défaut = jour d'inscription).
- Historique des bonus reçus (montant, date, crédité sur portefeuille retirable).
- Notification push à chaque versement.

**Règles UX** :
- Toujours afficher que le bonus est **retirable**.
- Ne jamais afficher de bonus « garanti » avant clôture : c'est une **projection** (palier max atteignable).

---

## 9. Anti-abus & cas limites (paramétrable)

- **1 versement / chauffeur / semaine** (idempotence forte).
- Courses **annulées / frauduleuses** non comptées (statut terminé légitime uniquement).
- Changement de `bonus_week_start_dow` limité (défaut : 1/semaine) pour éviter de « rejouer » des semaines.
- Chauffeur **suspendu/banni** au moment de la clôture → award `skipped` (paramétrable).
- Extourne possible (`status='reversed'` + ledger inverse) si fraude détectée a posteriori.

---

## 10. Récap « rien en dur »

| Élément | Paramètre | Où |
|---|---|---|
| Paliers (10/15/20 → 2500/4000/6000) | `tiers` | `bonus_rules` (JSONB) |
| Modèle de versement | `payout_model` | `bonus_rules` |
| Services comptés | `counted_service_types` | `bonus_rules` |
| Qui finance | `funded_by` | `bonus_rules` |
| Période | `period` | `bonus_rules` |
| Jour de début de semaine | `bonus_week_start_dow` | `drivers` (réglable par le chauffeur) |
| Override local | `scope=FRANCHISE/PARTNER` | `bonus_rules` |
