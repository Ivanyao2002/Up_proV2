# Portails de connexion UpJunoo Pro — Profils & périmètres

> **Date** : 19 juin 2026  
> **Projet** : `Up_prov2` — back-office web  
> **Hub** : [`/login`](http://localhost:3000/login)

Ce document décrit **chaque interface de connexion**, le **profil utilisateur** associé, ce qu’il est amené à faire au quotidien, et les **routes principales** du portail.

---

## Vue d’ensemble

| Portail | Login | Dashboard | Profil API (`user_type`) | Scope |
|---------|-------|-----------|--------------------------|-------|
| **Administrateur** | `/admin/login` | `/admin/dashboard` | `ADMIN` | Plateforme globale |
| **Comptabilité** | `/compta/login` | `/compta` | `ACCOUNTANT` / `COMPTA` | Pays / comptable |
| **Support** | `/support/login` | `/support` | `SUPPORT` | Plateforme (support) |
| **Reporting** | `/reporting/login` | `/reporting` | `REPORTING` | Plateforme (lecture) |
| **Partenaire** | `/partner/login` | `/partner/dashboard` | `PARTNER` | Flotte (`owner`) |
| **Franchise** | `/franchise/login` | `/franchise/dashboard` | `FRANCHISE` | Territoire |
| **Dispatch** | `/dispatch/login` | `/dispatch/console` | `DRIVER` (compte dispatch) | Zones assignées |

**Note** : un compte **admin** peut aussi se connecter aux portails **Compta**, **Support** et **Reporting** (accès transversal siège). Les comptes dédiés n’ont accès qu’à leur portail.

---

## 1. Administrateur central

**Interface plan recette** : n°01 — Administration globale + paramétrage (fusionné).

### Qui se connecte ?

- Super-admin, exploitation, conformité, direction
- Toute personne avec `user_type = ADMIN`

### Ce qu’il fait

| Domaine | Actions principales |
|---------|---------------------|
| **Opérations** | Dashboard global, carte live, courses, dispatch manuel, forensic GPS |
| **Réseau** | Franchises, partenaires, zones, comptables |
| **Flotte** | Chauffeurs, véhicules, KYC, clients B2C/B2B |
| **Finance** | Wallets (lecture), transactions, retraits, commissions, réconciliation |
| **Marketing** | Promos, campagnes, bannières |
| **Support** | Tickets, chat (via module admin `/admin/support/*`) |
| **Paramétrage** | Tarifs, calibration dispatch, rôles, audit, plafonds finance |

### Routes clés

- `/admin/dashboard` — KPI plateforme
- `/admin/ops/*` — opérations temps réel
- `/admin/network/*` — réseau
- `/admin/finance/*` — finance opérationnelle
- `/admin/settings/*` — paramétrage et audit

### Règle métier importante

Le central **ne recharge pas** les wallets chauffeurs (UC-FIN01). Supervision financière en lecture ; recharges = partenaire ou franchise.

---

## 2. Comptabilité

**Interface plan recette** : n°03 — Finance / compta.

### Qui se connecte ?

- Comptable provisionné (`ACCOUNTANT` / `COMPTA`)
- Admin siège (accès transversal)

### Ce qu’il fait

| Module | Actions |
|--------|---------|
| **Journal & flux** | Écritures ledger, entrées/sorties, extournes |
| **Commissions** | Prélèvements plateforme, bénéfices |
| **Portefeuilles** | Consultation soldes (retirable / service) |
| **Réconciliation** | Écarts cash, paiements |
| **Clôtures** | Périodes comptables, verrouillage |
| **Exports** | CSV journal et rapports agrégés |

### Routes clés

- `/compta` — tableau de bord comptable
- `/compta/ledger`, `/compta/flows`, `/compta/reconciliation`
- `/compta/periods` — clôtures
- `/compta/exports` — téléchargements CSV

---

## 3. Support *(nouveau portail)*

**Interface plan recette** : n°02 — Support + n°08 — Suivi anomalies (regroupés).

### Qui se connecte ?

- Agent support (`user_type = SUPPORT`)
- Admin siège (accès transversal)

### Ce qu’il fait

| Module | Actions |
|--------|---------|
| **Tickets** | Traiter réclamations, priorités, résolution litiges (UC-S01) |
| **Chat franchises** | Répondre aux franchises en temps réel |
| **Centre anomalies** | Registre des écarts recette / production |
| **Journal d’audit** | Consulter actions sensibles (connexions, KYC, paramètres) |
| **Forensic GPS** | Analyser trajectoire course (via litige ou fiche course) |

### Ce qu’il ne fait pas

- Pas de paramétrage tarifs / commissions
- Pas de validation retraits ou recharges wallet
- Pas de création franchise / partenaire

### Routes clés

| Route | Écran |
|-------|-------|
| `/support` | Tableau de bord support |
| `/support/tickets` | Liste tickets & litiges |
| `/support/chat` | Conversations franchises |
| `/support/anomalies` | Hub anomalies |
| `/support/anomalies/audit` | Journal d’audit |

### Compte pilote (recette)

À provisionner côté backend : `user_type = SUPPORT`, email dédié support.

---

## 4. Reporting *(nouveau portail)*

**Interface plan recette** : n°06 — Reporting consolidé + exports (slide 21 — 22 rapports).

### Qui se connecte ?

- Analyste reporting / contrôle de gestion (`user_type = REPORTING`)
- Admin siège (accès transversal)

### Ce qu’il fait

| Module | Actions |
|--------|---------|
| **Tableau de bord** | Vue synthèse reporting, raccourcis |
| **Activité consolidée** | KPI courses, chauffeurs, clients, alertes |
| **Exports** | CSV journal comptable, rapports agrégés mensuels |
| **Sources finance** | Lecture tableaux admin finance (transactions, wallets, réconciliation) |

### Ce qu’il ne fait pas

- Pas d’actions d’exploitation (assignation course, suspension chauffeur)
- Pas de validation financière (approbation retrait)
- Pas de modification paramètres

### Routes clés

| Route | Écran |
|-------|-------|
| `/reporting` | Tableau de bord reporting |
| `/reporting/activity` | KPI activité multi-services |
| `/reporting/exports` | Téléchargements CSV |
| Liens lecture | `/admin/finance/*`, `/admin/dashboard` (admin ou droits étendus) |

### Indicateurs couverts (plan slide 21)

Activité totale · par service · zone · franchise · partenaire · recettes · commissions · wallets · recharges · incidents · taux annulation · exports CSV/Excel.

---

## 5. Partenaire

**Interface plan recette** : n°04 — Propriétaire de flotte.

### Qui se connecte ?

- Gérant de flotte (`PARTNER`), après validation admin (UC-P01)

### Ce qu’il fait

- Rattacher chauffeurs & véhicules (UC-P02)
- Suivre activité : dashboard, carte live, courses
- **Recharger ses chauffeurs** en cascade (UC-FIN01 voie 2.c)
- Wallet propre : consultation, retrait
- Fret, location (si modules actifs), rapports période
- Chat support

### Écarts connus (cf. rapport 16/06)

- Top-up wallet partenaire (Mobile Money / CB) : **à développer**
- RBAC membres équipe : hors V1

### Routes clés

- `/partner/dashboard`, `/partner/drivers`, `/partner/fleet`
- `/partner/wallet`, `/partner/wallet/driver-transfers`
- `/partner/reports`, `/partner/freight`, `/partner/rental`

---

## 6. Franchise

**Interface plan recette** : n°05 — Supervision territoriale.

### Qui se connecte ?

- Responsable franchise (`FRANCHISE`)

### Ce qu’il fait

- Superviser partenaires et chauffeurs de sa zone
- Valider KYC, gérer bonus zone (UC-FR01/02)
- Recharges partenaires, reporting local
- Carte live et opérations territoire

### Routes clés

- `/franchise/dashboard`, `/franchise/partners`, `/franchise/drivers`
- `/franchise/wallet`, `/franchise/support`

---

## 7. Dispatch

**Hors les 8 interfaces du plan** — console d’exploitation terrain.

### Qui se connecte ?

- Opérateur dispatch (`DRIVER` côté API auth dispatch, ou compte dispatcher)

### Ce qu’il fait

- Console d’assignation manuelle
- File d’attente courses, candidats chauffeurs
- Carte temps réel zone assignée

### Routes clés

- `/dispatch/console`
- `/dispatch/map`

---

## Matrice plan recette ↔ portails Up_prov2

| # Plan | Interface attendue | Portail Up_prov2 |
|--------|-------------------|------------------|
| 01 | Admin central | `/admin` |
| 02 | Support | `/support` *(nouveau)* |
| 03 | Finance | `/compta` |
| 04 | Partenaire | `/partner` |
| 05 | Franchise | `/franchise` |
| 06 | Reporting | `/reporting` *(nouveau)* |
| 07 | Paramétrage | `/admin/settings` |
| 08 | Suivi anomalies | `/support/anomalies` |
| — | Dispatch | `/dispatch` |

---

## Création des comptes (backend)

| Profil | `user_type` API | Portail login |
|--------|-----------------|---------------|
| Support | `SUPPORT` | `/support/login` |
| Reporting | `REPORTING` | `/reporting/login` |
| Comptable | `ACCOUNTANT` | `/compta/login` |
| Admin | `ADMIN` | `/admin/login` (ou portails siège) |

En attendant les types API dédiés, les comptes **admin** peuvent tester les portails Support et Reporting.

### Fichiers techniques

| Sujet | Fichier |
|-------|---------|
| Hub login | `src/app/login/page.tsx` |
| Routes auth | `src/core/auth/authRoutes.ts` |
| Mapping API | `src/features/auth/api/auth.mapper.ts` |
| Nav support | `src/portals/support/supportNav.ts` |
| Nav reporting | `src/portals/reporting/reportingNav.ts` |
| Middleware | `src/middleware.ts` |

---

## Schéma des flux

```
                    ┌─────────────┐
                    │   /login    │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
     ┌──────────┐   ┌──────────┐   ┌──────────┐
     │  Siège   │   │  Terrain │   │  Ops     │
     └────┬─────┘   └────┬─────┘   └────┬─────┘
          │              │              │
   admin · compta   partner ·      dispatch
   support ·        franchise
   reporting
```

---

*Document de référence produit — à mettre à jour lors de l’ajout de types API `SUPPORT` et `REPORTING` côté backend.*
