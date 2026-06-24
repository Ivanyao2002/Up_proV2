# Analyse détaillée — Plan de recette vs back-office Partenaire

> **Date** : 16 juin 2026  
> **Projet** : UpJunoo Pro (`Up_prov2`)  
> **Sources** :
> - `docs/PLAN DE RECETTE ET DEPLOIEMENT.pdf` / `.pptx` (slides 5.5, 9–10, 13, 20, 39 — UC-P01, UC-P02, UC-FIN01, UC-F01, UC-LO)
> - Code front : `src/portals/partner/partnerNav.ts`, routes `src/app/(partner)/partner/**`
> - Compléments : `docs/ANALYSE-PLAN-RECETTE-ADMIN-COMPTA.md`, `src/core/api/links.ts` (`LINKS.partner`)

**Objectif** : comparer ce que le plan de recette attend du **profil Partenaire** (interface #04) avec le portail `/partner` réel.

---

## Légende des statuts

| Symbole | Signification |
|---------|---------------|
| ✅ | Présent et aligné avec le plan |
| ⚠️ | Présent mais partiel, hors nav, ou écart fonctionnel |
| ❌ | Absent ou non conforme au plan |
| 🔗 | Couvert par l’admin (validation centrale) ou l’app mobile |
| 📋 | À valider en test réel (UI OK, API / données à confirmer) |

---

## 1. Cadre plan — profil Partenaire

### 1.1 Rôle attendu (slides 5.5, 9–10, 20)

Le partenaire est **propriétaire de flotte** : il rattache chauffeurs et véhicules, supervise l’activité, gère son **wallet propre**, recharge ses chauffeurs **en cascade**, traite fret et location selon son périmètre.

**Chaîne financière attendue (slide 13)** :

```
Mobile Money / Carte bancaire → Wallet partenaire → Wallets chauffeurs (cascade)
```

Le central **ne recharge pas** les chauffeurs ; le partenaire est l’acteur clé de la voie 2 (UC-FIN01).

### 1.2 Treize fonctionnalités principales (slide 5.5)

| # | Fonctionnalité plan | Portail / acteur |
|---|---------------------|------------------|
| 01 | Création compte partenaire | Admin (UC-P01) |
| 02 | Validation par admin central | Admin |
| 03 | Rattachement chauffeurs & véhicules | Partenaire (UC-P02) |
| 04 | Suivi activité chauffeurs & flotte | Partenaire |
| 05 | Suivi revenus, commissions, performance | Partenaire |
| 06 | Reporting par période & service | Partenaire |
| 07 | Gestion documents véhicule / chauffeur | Partenaire |
| 08 | Recharge wallet partenaire — Mobile Money | Partenaire |
| 09 | Recharge wallet partenaire — Carte (CB/Visa) | Partenaire |
| 10 | Recharge chauffeurs flotte (cascade) | Partenaire (UC-FIN01) |
| 11 | Réception & traitement demandes fret + devis | Partenaire (UC-F01) |
| 12 | Validation demandes location | Partenaire (UC-LO) |
| 13 | Communication central & réclamations | Partenaire + support |

### 1.3 Reporting attendu (slide 20 — profil Partenaire)

- Nb chauffeurs / véhicules rattachés  
- Nb de courses par chauffeur  
- Montant total d’activité & commissions dues/prélevées  
- Performance par période · activité par service  
- Statuts chauffeurs / véhicules · indicateurs de conformité  

### 1.4 Use cases recette liés

| UC | Sujet | Criticité |
|----|-------|-----------|
| UC-P01 | Création & validation partenaire | Majeure |
| UC-P02 | Rattachement chauffeur / véhicule + cloisonnement | **Critique** |
| UC-FIN01 | Recharge wallet (3 voies dont cascade partenaire) | **Critique** |
| UC-F01 | Fret : demande → devis → affectation | Majeure |
| UC-LO01/02 | Location : réservation → validation | Majeure |
| UC-S01 | Réclamations (émetteur partenaire) | Majeure |

---

## 2. Correspondance interface plan ↔ portail Up_prov2

| Interface plan (#04) | Implémentation | URL | Écart |
|----------------------|----------------|-----|-------|
| **Partenaire** | Portail Partner | `/partner`, login `/partner/login` | Un seul portail ; pas de sous-profils exploitation/commercial |
| Validation centrale | Admin réseau | `/admin/network/partners` | 🔗 Hors portail partenaire (normal) |
| Reporting dédié | Page Rapports | `/partner/reports` | ⚠️ Pas de portail reporting séparé |
| Réclamations formelles | Support chat | `/partner/support/chat` | ⚠️ Pas de module tickets type admin |

**Note** : `partnerNav.ts` indique *« pas de RBAC granulaire en V1 (scope owner implicite) »* — le plan suppose un périmètre cloisonné par `partner_id`, pas des rôles fins côté UI.

---

## 3. Inventaire détaillé — Portail Partenaire

Référence : `src/portals/partner/partnerNav.ts`  
Routes : `src/app/(partner)/partner/**` (~40 pages)

### 3.1 MA FLOTTE

| Écran | Route | Plan / UC | Statut | Commentaire |
|-------|-------|-----------|--------|-------------|
| Tableau de bord | `/partner/dashboard` | Reporting slide 20 | ✅ | KPI revenus, courses, chauffeurs, wallet, graphique |
| Véhicules | `/partner/fleet` | UC-P02, #07 | ✅ | Liste + création + fiche |
| **Véhicules à valider** | `/partner/fleet/pending` | Conformité | ⚠️ | **Page existe, nav commentée** |
| Chauffeurs | `/partner/drivers` | UC-P02 | ✅ | CRUD, fiche détaillée |
| **Chauffeurs KYC** | `/partner/drivers/pending` | Conformité | ⚠️ | **Page existe, nav commentée** |
| **Réservations** | `/partner/bookings` | UC-LO | ⚠️ | **Page existe, nav commentée** |
| Courses | `/partner/orders` | Suivi activité | ✅ 📋 | Liste + détail `/orders/[id]` |
| Carte live | `/partner/map` | Suivi flotte | ✅ | `PartnerDriverLiveMap` |
| Performance | `/partner/performance` | #05, reporting | ✅ 📋 | API `vehicle-performance`, `driver-performance` |
| Balises GPS | `/partner/gps-devices` | Extension | ✅ | Hors plan détaillé |
| Sécurité / SOS | `/partner/safety` | Incidents | ✅ | |

### 3.2 OPPORTUNITÉS (multiservices)

| Écran | Route | Plan / UC | Statut | Commentaire |
|-------|-------|-----------|--------|-------------|
| Offres de fret | `/partner/freight` | UC-F01, #11 | ⚠️ | Gestion **offres** partenaire ; flux **demande client → devis** du plan à valider |
| Détail fret | `/partner/freight/[id]` | UC-F01 | ⚠️ | POD, statuts — pas le circuit complet slide 11 |
| Zones & couloirs fret | `/partner/freight/zones` | Fret | ✅ | Module guard `freight` |
| Réservations location | `/partner/rental` | UC-LO, #12 | ⚠️ | UI présente ; `PartnerModuleGuard` si module inactif |

### 3.3 ACTIVITÉ

| Écran | Route | Plan | Statut | Commentaire |
|-------|-------|------|--------|-------------|
| Nouvelle course | `/partner/bookings/new` | Prise de commande | ✅ | Taxi + **livraison** (`delivery`) |
| Courses récurrentes | `/partner/bookings/recurring` | — | ✅ | Extension |
| Planning shifts | `/partner/shifts` | — | ✅ | Extension |
| Rapports | `/partner/reports` | #06, slide 20 | ✅ 📋 | Périodes, courses, revenus, commissions |

### 3.4 FINANCE

| Écran | Route | Plan / UC | Statut | Commentaire |
|-------|-------|-----------|--------|-------------|
| Portefeuille | `/partner/wallet` | Wallet propre | ⚠️ | Consultation + retrait + **cascade chauffeur** ; **pas de top-up MM/CB** |
| Recharges chauffeurs | `/partner/wallet/driver-transfers` | UC-FIN01 #10 | ✅ | `PartnerDriverRechargeModal`, historique |
| Acomptes | `/partner/wallet/settlements` | — | ✅ | |
| Revenus | `/partner/wallet/revenue` | #05 | ✅ | |
| Grand livre | `/partner/wallet/ledger` | — | ✅ | |

**Écart majeur UC-FIN01** : aucune UI pour **recharger le wallet partenaire** via Orange/MTN/Moov/Wave ou carte (voies 2.a et 2.b du plan). API `LINKS.partner.wallet` : `get`, `withdraw`, `driverRecharge` — **pas d’endpoint top-up documenté côté front**.

### 3.5 SUPPORT & COMPTE

| Écran | Route | Plan #13 | Statut | Commentaire |
|-------|-------|----------|--------|-------------|
| Chat support | `/partner/support/chat` | Réclamations | ⚠️ | Chat oui ; pas workflow UC-S01 complet |
| Notifications | `/partner/support/notifications` | — | ✅ | |
| Chat course | `/partner/support/conversations` | — | ✅ | |
| Mon profil | `/partner/profile` | UC-P01 (infos) | ✅ | Documents partenaire |
| Membres équipe | `/partner/members` | — | ✅ | API `partners/{id}/members` |

### 3.6 Pages hors navigation

| Route | Usage |
|-------|--------|
| `/partner/fleet/pending` | Véhicules en attente validation |
| `/partner/drivers/pending` | Chauffeurs KYC en attente |
| `/partner/bookings` | Liste réservations |
| `/partner/bookings/[id]` | Détail réservation |
| `/partner/tracking` | Suivi (tracking) |

---

## 4. Matrice — 13 fonctionnalités slide 5.5

| # | Fonctionnalité | Statut | Où / commentaire |
|---|----------------|--------|------------------|
| 01 | Création compte | 🔗 | Admin `partners/new` |
| 02 | Validation central | 🔗 | Admin fiche partenaire |
| 03 | Rattachement chauffeurs & véhicules | ✅ | `drivers/new`, `fleet/new`, UC-P02 |
| 04 | Suivi activité flotte | ✅ | dashboard, map, orders |
| 05 | Revenus & commissions | ✅ | wallet, revenue, performance |
| 06 | Reporting période & service | ⚠️ | `/partner/reports` — exports à valider |
| 07 | Documents véhicule / chauffeur | ✅ | `PartnerDocumentsSection`, API documents |
| 08 | Recharge wallet MM | ❌ | **Manquant** |
| 09 | Recharge wallet CB/Visa | ❌ | **Manquant** |
| 10 | Recharge cascade chauffeurs | ✅ | UC-FIN01 voie 2.c |
| 11 | Fret + devis | ⚠️ | Offres fret ; flux demande client non évident |
| 12 | Validation location | ⚠️ | `/partner/rental` + guard module |
| 13 | Com. central & réclamations | ⚠️ | Chat support ; pas tickets structurés |

**Score fonctionnalités plan** : **~8/13 pleinement couvertes**, **3 partielles**, **2 absentes** (top-up wallet).

---

## 5. Matrice — use cases × portail partenaire

| UC | Intitulé | Partenaire | Admin | Écart principal |
|----|----------|------------|-------|-----------------|
| UC-P01 | Création & validation | ⚠️ accès post-validation | ✅ | Création côté admin |
| UC-P02 | Rattachement + cloisonnement | ✅ 📋 | ✅ | Test négatif autre partenaire |
| UC-FIN01 | Recharge wallet | ⚠️ cascade seulement | ❌ central | **Top-up MM/CB absent** |
| UC-FIN02–03 | Commission / répartition | ✅ 📋 | — | Visible wallet / revenue |
| UC-F01 | Fret urbain | ⚠️ | — | Devis client → partenaire |
| UC-LO01–02 | Location | ⚠️ | — | Module optionnel |
| UC-L01–04 | Livraison | ⚠️ | — | Via `bookings/new` delivery, pas vue livreur |
| UC-S01 | Réclamation | ⚠️ | — | Chat sans workflow finance |
| UC-T01–05 | Transport VTC | ✅ 📋 | — | orders + bookings |

---

## 6. Reporting slide 20 — couverture

| Indicateur attendu | Où aujourd’hui | Statut |
|--------------------|----------------|--------|
| Nb chauffeurs / véhicules rattachés | Dashboard, listes | ✅ |
| Nb courses par chauffeur | Performance, reports | ⚠️ |
| Montant activité & commissions | Revenue, wallet, reports | ✅ 📋 |
| Performance par période & service | `/partner/reports` | ⚠️ |
| Statuts chauffeurs / véhicules | Listes ; pending hors nav | ⚠️ |
| Indicateurs conformité (KYC) | `drivers/pending`, `fleet/pending` | ⚠️ hors nav |
| Export CSV/Excel/PDF | Reports / tables | 📋 à valider |

---

## 7. API & intégration (aperçu)

Namespace principal : `/v1/partners/{partnerId}/…` (`LINKS.partner`).

| Domaine | Endpoints branchés | Statut |
|---------|-------------------|--------|
| Dashboard | `GET …/dashboard` | ✅ |
| Chauffeurs | CRUD, documents, trips, wallet tx | ✅ |
| Véhicules | CRUD, documents, assign-driver | ✅ |
| Wallet | get, ledger, revenue, withdraw, driver-recharge | ✅ |
| Wallet top-up | — | ❌ non branché front |
| Fret | freight-offers CRUD | ⚠️ |
| Location | rental API (`rental.service.ts`) | ⚠️ |
| Courses | trips/orders, bookings | ✅ |
| Membres | members CRUD | ✅ |

---

## 8. Écarts critiques (bloquants recette 21 juin)

### P0 — Conformité métier

1. **Recharge wallet partenaire (MM + CB)** — slides 5.5, 13, UC-FIN01 voies 2.a/2.b  
   **Action** : UI top-up + API PayDunya / mobile money OU scénario recette avec crédit manuel backend documenté.

2. **UC-P02 cloisonnement** — test négatif obligatoire : partenaire A ne voit pas flotte partenaire B  
   **Action** : exécuter en préprod avec 2 comptes pilotes (plan : 3–5 partenaires).

3. **Fret UC-F01** — le plan décrit demande **client** → réception partenaire → **devis** → affectation  
   **Action** : valider si `PartnerFreightPage` (offres) couvre le scénario ou s’il manque un flux « demandes entrantes ».

### P1 — Couverture recette

4. Réactiver ou documenter **KYC pending** (`drivers/pending`, `fleet/pending`) pour conformité slide 20.  
5. **Livraisons** : pas de vue livreur dédiée ; seulement service `delivery` dans bookings.  
6. **Réclamations** : enrichir support (catégories UC-S01) ou lien vers admin tickets.  
7. Exports rapports **Excel/PDF** si exigés jour J.

### P2 — Hors jalon immédiat

8. RBAC membres équipe (rôles fins au sein du partenaire).  
9. GPS / tracking comme différenciateur (hors plan strict).  
10. Portail reporting autonome.

---

## 9. Checklist recette — portail partenaire (21/06)

### Avant le test

- [ ] Compte `dev.partner@upjunoo-dev.tech` validé par admin  
- [ ] 2e partenaire pilote pour test cloisonnement UC-P02  
- [ ] Wallet partenaire avec solde test (procédure top-up définie)  
- [ ] Modules `freight` et `rental` activés si test UC-F01 / UC-LO  

### Scénarios partenaire

1. **UC-P02** : créer chauffeur + véhicule → course → visible uniquement sur ce compte  
2. **UC-FIN01** : cascade recharge chauffeur depuis wallet partenaire → historique `driver-transfers`  
3. **UC-FIN01 négatif** : tenter recharge sans solde → message d’erreur  
4. **Dashboard** : KPI cohérents avec une course test  
5. **Orders** : suivi course temps réel aligné client/chauffeur  
6. **Fret** : créer offre / traiter demande (selon flux retenu)  
7. **Location** : réservation si module actif  
8. **Reports** : export période avec chiffres terrain  
9. **Support** : ouvrir chat → réponse support  
10. **Cloisonnement** : login partenaire B → ne voit pas données partenaire A  

---

## 10. Fichiers de référence

| Sujet | Fichier |
|-------|---------|
| Nav partenaire | `src/portals/partner/partnerNav.ts` |
| Dashboard | `src/features/partner/pages/PartnerDashboardPage.tsx` |
| Wallet + cascade | `src/features/partner/pages/PartnerWalletPage.tsx` |
| Recharge chauffeur | `src/features/partner/components/PartnerDriverRechargeModal.tsx` |
| Fret | `src/features/partner/pages/PartnerFreightPage.tsx` |
| Location | `src/features/partner/pages/PartnerRentalPage.tsx` |
| Guard modules | `src/features/partner/components/PartnerModuleGuard.tsx` |
| Liens API | `src/core/api/links.ts` → `partner` |
| Plan source | `docs/PLAN DE RECETTE ET DEPLOIEMENT.pdf` |

---

## 11. Synthèse exécutive

| Dimension | Score | Commentaire |
|-----------|-------|-------------|
| **Flotte & opérations** | **~85 %** | Dashboard, map, courses, chauffeurs, véhicules solides |
| **Finance cascade** | **~75 %** | Recharge chauffeur OK ; **top-up wallet partenaire absent** |
| **Multiservices** | **~65 %** | Fret + location présents mais flux plan à valider |
| **Reporting & conformité** | **~70 %** | Reports + performance ; KYC pending masqué |
| **Réclamations** | **~50 %** | Chat seulement |

Le portail partenaire est **le plus aligné** du back-office sur la chaîne **wallet cascade** (rôle central du plan), mais **incomplet** sur l’**alimentation du wallet partenaire** (Mobile Money / carte), point **critique** pour UC-FIN01 et la slide 13.

---

*Document généré pour l’équipe UpJunoo Pro — à mettre à jour après correctifs front ou arbitrages produit.*
