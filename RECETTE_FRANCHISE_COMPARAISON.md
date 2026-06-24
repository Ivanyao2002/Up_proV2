# Comparaison Plan de Recette ↔ Implémentation Franchise

> **Source** : « PLAN DE RECETTE ET DEPLOIEMENT — UPJUNOO PRO v1.0 — Juin 2026 »
> **Périmètre analysé** : Module Franchise (`src/features/franchise/`) — back-office web
> **Date d'analyse** : 18 juin 2026
> **Mise à jour** : 18 juin 2026 — Décisions de prise en charge intégrées

---

## Légende

| Statut | Signification |
|---|---|
| ✅ Implémenté | Page/composant/service présent et fonctionnel |
| ⚠️ Partiel | Présent mais incomplet ou manquant des sous-fonctionnalités clés |
| ❌ Absent | Décrit dans le plan, non trouvé dans le code |
| 🟢 À faire | **Pris en charge** — à implémenter |
| ⬜ Non retenu | Hors scope pour cette itération |

---

## 1. Tableau de bord (UC-FR01 partiel)

**Attendu par le plan** (§5.6, §10, UC-FR01) :
- Vue consolidée de la zone
- Nb partenaires actifs, chauffeurs actifs, livreurs actifs, clients actifs
- Courses réalisées, livraisons réalisées, fret, locations
- Chiffre d'activité, commissions zone, taux d'annulation
- Incidents, réclamations
- Rafraîchissement temps réel

**Implémenté** : `FranchiseDashboardPage.tsx`

| Indicateur | Statut |
|---|---|
| Partenaires actifs | ✅ `data.partners_count` |
| Chauffeurs en ligne / total | ✅ `data.drivers_online / drivers_total` |
| Courses aujourd'hui + trend | ✅ `HeroTripsTodayKpi` + `trips_today_trend_pct` |
| Courses terminées | ✅ `data.trips_completed_today` |
| Flux 7 jours (revenus + courses) | ✅ Graphique barre custom |
| Retraits en attente | ✅ `FranchisePendingWithdrawalsKpi` |
| KYC à modérer | ✅ Bandeau d'alerte → lien vers modération |
| Live refresh indicator | ✅ `LiveRefreshIndicator` |
| **Livreurs actifs** | 🟢 À faire |
| **Clients actifs** | 🟢 À faire |
| **Livraisons réalisées** | 🟢 À faire |
| **Fret réalisé** | ⬜ Non retenu |
| **Locations réalisées** | ⬜ Non retenu |
| **Taux d'annulation** | 🟢 À faire |
| **Incidents en cours** | 🟢 À faire |
| **Réclamations en cours** | 🟢 À faire |

**Verdict** : ⚠️ Partiel — 6/8 indicateurs manquants pris en charge. Fret et Locations hors scope pour cette itération.

---

## 2. Gestion & paramétrage de zone (UC-FR01)

**Attendu** : Gestion d'une zone géographique, paramétrage, visualisation cartographique, demande d'extension

**Implémenté** :

| Fonctionnalité | Fichier | Statut |
|---|---|---|
| Carte territoire avec zones | `FranchiseTerritoryPage.tsx` + `FranchiseTerritoryMap` | ✅ |
| KPI zones : zones actives, partenaires, chauffeurs, superficie | `FranchiseTerritoryPage.tsx` | ✅ |
| Demande d'extension de zone | `FranchiseTerritoryExtensionPage.tsx` | ✅ |
| Liste des zones avec filtre type (standard/surge/aéroport) | `FranchiseZonesPage.tsx` | ✅ |
| Carte interactive (AbidjanZonesMap + hot zones) | `FranchiseZonesPage.tsx` | ✅ |
| **Paramétrage des règles de zone** | — | 🟢 À faire |
| **Activation/désactivation d'une zone** | — | 🟢 À faire |

**Verdict** : ⚠️ Partiel — visualisation excellente. Paramétrage + activation/désactivation pris en charge.

---

## 3. Suivi des partenaires (UC-FR01, §10)

**Attendu** : Suivi partenaires de la zone, nb chauffeurs, revenus, commissions, statuts

**Implémenté** :

| Fonctionnalité | Fichier | Statut |
|---|---|---|
| Liste partenaires | `FranchisePartnersListPage.tsx` | ✅ |
| Détail partenaire (profil, flotte, activité) | `FranchisePartnerDetailPage.tsx` | ✅ |
| Création partenaire | `FranchisePartnerNewPage.tsx` | ✅ |
| Transferts vers partenaires | `FranchisePartnerTransfersPage.tsx` | ✅ |
| **Cloisonnement** (franchise voit uniquement sa zone) | Via contexte auth | ✅ (filtrage API) |
| **Reporting partenaire par période** | Présent dans détail | ✅ |

**Verdict** : ✅ Bien couvert.

---

## 4. Suivi des chauffeurs (UC-FR01, §7, §10)

**Attendu** : Suivi chauffeurs zone, KYC, suspension/réactivation, historique, wallet

**Implémenté** :

| Fonctionnalité | Fichier | Statut |
|---|---|---|
| Liste chauffeurs | `FranchiseDriversListPage.tsx` | ✅ |
| Détail chauffeur (profil, documents, wallet, historique) | `FranchiseDriverDetailPage.tsx` | ✅ |
| Création chauffeur | `FranchiseDriverNewPage.tsx` | ✅ |
| File KYC (documents en attente) | `FranchiseKycQueuePage.tsx` | ✅ |
| Modération KYC | `FranchiseKycModerationPage.tsx` | ✅ |
| Transferts wallet vers chauffeurs | `FranchiseDriverTransfersPage.tsx` | ✅ |
| **Livreurs (profil distinct)** | — | 🟢 À faire — pages liste + détail à créer |

**Verdict** : ⚠️ Partiel — chauffeurs VTC couverts. Section livreurs prise en charge.

---

## 5. Suivi des clients (§6, UC-FR01)

**Attendu** : Consultation des clients actifs de la zone

**Implémenté** :

| Fonctionnalité | Fichier | Statut |
|---|---|---|
| Liste clients | `franchise/clients/page.tsx` → `clients.service.ts` | ✅ |
| Détail client | `franchise/clients/[id]/page.tsx` | ✅ |
| **Nb clients actifs dans dashboard** | — | 🟢 À faire (intégration au dashboard) |

**Verdict** : ⚠️ Partiel — pages présentes mais pas intégrées aux KPI du dashboard.

---

## 6. Suivi courses & livraisons (§5.1, §5.2, UC-FR01)

**Attendu** : Suivi des courses VTC + livraisons + fret + locations de la zone

**Implémenté** :

| Fonctionnalité | Fichier | Statut |
|---|---|---|
| Liste des courses | `FranchiseTripsListPage.tsx` | ✅ |
| Détail course | `FranchiseTripDetailPage.tsx` | ✅ |
| **Liste des livraisons** | — | 🟢 À faire |
| **Suivi fret** | — | ⬜ Non retenu |
| **Suivi location** | — | ⬜ Non retenu |

**Verdict** : ⚠️ Partiel — VTC couvert. Livraisons prises en charge. Fret et Location hors scope pour cette itération.

---

## 7. Flotte / Véhicules (§5.4, §5.5)

**Attendu** : Gestion des véhicules rattachés à la franchise/zone

**Implémenté** :

| Fonctionnalité | Fichier | Statut |
|---|---|---|
| Liste véhicules | `FranchiseVehiclesListPage.tsx` | ✅ |
| Détail véhicule (docs, statut, chauffeur lié) | `FranchiseVehicleDetailPage.tsx` | ✅ |

**Verdict** : ✅ Couvert.

---

## 8. Finance — Commissions zone (§5.6, UC-FIN03, UC-FR01)

**Attendu** : Perception commissions zone, répartition plateforme/partenaire/franchise, reporting financier, export

**Implémenté** :

| Fonctionnalité | Fichier | Statut |
|---|---|---|
| Vue finance principale (solde, disponible, retraits) | `FranchiseFinancePage.tsx` | ✅ |
| Recharge partenaire depuis solde franchise | `FranchisePartnerRechargeModal` | ✅ |
| Stats recharges chauffeurs & partenaires | `finance.queries.ts` | ✅ |
| Mouvements / transactions récentes | `FranchiseFinancePage.tsx` | ✅ |
| Liste commissions par partenaire + filtres | `FranchiseCommissionsListPage.tsx` | ✅ |
| Export CSV commissions | ✅ `exportFileName="commissions-partenaires-franchise"` | ✅ |
| Réconciliation (attendu vs reçu, écarts) | `FranchiseReconciliationListPage.tsx` | ✅ |
| Transferts chauffeurs | `FranchiseDriverTransfersPage.tsx` | ✅ |
| Transferts partenaires | `FranchisePartnerTransfersPage.tsx` | ✅ |
| **Répartition détaillée plateforme/partenaire/franchise/central** | — | ⚠️ Visible via commissions mais pas de ventilation explicite par tiers |
| **Export PDF** | — | ⬜ Non retenu pour cette itération |
| **Export Excel (.xlsx)** | — | 🟢 À faire |

**Verdict** : ⚠️ Bien couvert fonctionnellement. Export Excel pris en charge. Export PDF hors scope.

---

## 9. Moteur de bonus performance (UC-FR02) — CRITIQUE

**Attendu (UC-FR02 — Critique)** :
| Sous-fonctionnalité | Décision |
|---|---|
| Paramétrage seuils KPI (nb courses, note ≥ 4.5, acceptation ≥ 90%, annulation ≤ 5%) | 🟢 À faire |
| Enveloppe budgétaire bonus (% des commissions) | 🟢 À faire |
| Grille de montants par palier | 🟢 À faire |
| Bouton activation/désactivation du moteur | 🟢 À faire |
| Calcul automatique en fin de période (cron backend) | ⬜ Non retenu (côté backend, hors scope front) |
| Crédit wallet chauffeur automatique | 🟢 À faire (déclenchement manuel via interface) |
| Notification push chauffeur "Bonus reçu" | ⬜ Non retenu (backend) |
| Rapport bonus exportable | 🟢 À faire |
| Logs d'audit horodatés | 🟢 À faire |
| Wallet franchise débité du total | 🟢 À faire (affiché dans finance) |

**Implémenté** : ❌ ABSENT — **🟢 PRIS EN CHARGE**

Recherche dans tout le dossier `src/features/franchise/` : aucune occurrence de `bonus`, `performance`, `reversement`, `moteur`, `kpi` (hors drivers.service.ts — 1 occurrence non liée).

**Verdict** : Module entièrement à créer. Pris en charge — partie front-office (paramétrage, rapport, logs, déclenchement manuel). La partie cron backend (calcul automatique + push notification) est hors scope front.

---

## 10. Reporting opérationnel (UC-FR01 — 14 indicateurs)

**Attendu** : 14 indicateurs zone + exports CSV/Excel/PDF par jour/semaine/mois/période personnalisée

**Implémenté** :

| Indicateur | Statut |
|---|---|
| Activité globale zone | ⚠️ Partiel (dashboard courses uniquement) |
| Nb partenaires actifs | ✅ Dashboard |
| Nb chauffeurs actifs | ✅ Dashboard |
| Nb livreurs actifs | 🟢 À faire |
| Nb clients actifs | 🟢 À faire |
| Courses réalisées | ✅ |
| Livraisons réalisées | 🟢 À faire |
| Demandes fret | ⬜ Non retenu |
| Locations | ⬜ Non retenu |
| Chiffre d'activité | ⚠️ Revenus 7j disponibles |
| Commissions zone | ✅ Via commissions page |
| Taux d'annulation | 🟢 À faire |
| Incidents | 🟢 À faire (intégration dashboard) |
| Réclamations | 🟢 À faire (intégration dashboard) |
| Exports par période (jour/semaine/mois/perso) | ⚠️ Présent via filtres DateRange |
| Export PDF | ⬜ Non retenu |
| Export Excel | 🟢 À faire |

**Verdict** : ⚠️ Reporting financier bien construit. 6 indicateurs manquants pris en charge. Fret, Locations et PDF hors scope.

---

## 11. Gestion des incidents zone / SOS (§5.6 — Fonctionnalité 12)

**Attendu** : Gestion incidents zone, escalade vers central

**Implémenté** :

| Fonctionnalité | Fichier | Statut |
|---|---|---|
| Centre SOS Guardian (incidents actifs, KPI sévérité) | `FranchiseSosGuardianPage.tsx` | ✅ |
| Liste incidents SOS | `FranchiseSosIncidentsListPage.tsx` | ✅ |
| Détail incident SOS (risk score, risk factors, escalade) | `FranchiseSosIncidentDetailPage.tsx` | ✅ |
| Rafraîchissement auto 30s | ✅ |
| **Bouton escalade explicite vers central** | 🟢 À faire — bouton à ajouter dans le détail incident |

**Verdict** : ✅ Très bien couvert côté SOS. Bouton escalade explicite pris en charge.

---

## 12. Support (UC-S01, §5.6 — Fonctionnalité 13)

**Attendu** : Escalade vers central, gestion réclamations

**Implémenté** :

| Fonctionnalité | Fichier | Statut |
|---|---|---|
| Liste tickets support | `FranchiseSupportTicketsPage.tsx` | ✅ |
| Détail ticket | `FranchiseSupportTicketDetailPage.tsx` | ✅ |
| Chat support (liste + détail) | `FranchiseSupportChatListPage.tsx` + `ChatDetailPage.tsx` | ✅ |
| **Cycle complet réclamation (statuts, dédommagement wallet)** | 🟢 À faire — cycle statuts + crédit wallet à compléter |

**Verdict** : ⚠️ Partiel — infrastructure support présente. Cycle complet UC-S01 pris en charge.

---

## 13. Marketing (§5.6 — non explicitement cité mais présent)

> Le plan de recette ne mentionne pas explicitement le marketing dans le périmètre franchise.

**Implémenté** :

| Fonctionnalité | Fichier | Statut |
|---|---|---|
| Banners (liste + création) | `FranchiseBannersListPage` + `BannerNewPage` | ✅ |
| Campagnes (liste + création) | `FranchiseCampaignsListPage` + `CampaignNewPage` | ✅ |
| Promos (liste + détail + création) | `FranchisePromosPage` + `PromoDetail` + `PromoNew` | ✅ |

**Verdict** : ✅ Module marketing complet, non requis par le plan de recette mais présent en plus-value.

---

## 14. Pricing (§5.6 — non explicitement cité)

> Le plan cite le paramétrage des tarifs comme domaine Central (UC-A01a), pas Franchise.

**Implémenté** :

| Fonctionnalité | Fichier | Statut |
|---|---|---|
| Liste grilles tarifaires | `FranchisePricingPage.tsx` | ✅ |
| Création/édition grille | `FranchisePricingNewPage` + `PricingEditPage` | ✅ |

**Verdict** : 🟢 Pris en charge — les droits de modification seront verrouillés côté franchise (lecture seule), conformément au plan (paramétrage tarifs = Central uniquement).

---

## 15. Carte live / Supervision temps réel (UC-FR01)

**Attendu** : Supervision activité terrain en temps réel

**Implémenté** :

| Fonctionnalité | Fichier | Statut |
|---|---|---|
| Carte live des engins | `FranchiseLiveMapPage.tsx` | ✅ |
| Filtres partenaire | `FranchiseLiveMapPartnerFilter` | ✅ |

**Verdict** : ✅ Couvert.

---

## 16. Paramètres / Settings

**Implémenté** :

| Fonctionnalité | Fichier | Statut |
|---|---|---|
| Paramètres généraux (nom plateforme, email support, city, devise, versions app, maintenance) | `FranchiseSettingsGeneralPage.tsx` | ✅ |
| Paramètres météo | `FranchiseSettingsWeatherPage.tsx` | ✅ |

**Verdict** : ✅ Couvert.

---

## Synthèse globale

### Couverture par use case du plan de recette

| Use Case | Intitulé | Criticité | Statut | Décision |
|---|---|---|---|---|
| **UC-FR01** | Supervision d'une zone franchise | Critique | ⚠️ Partiel | 🟢 Complété (sans fret/locations) |
| **UC-FR02** | Reversement automatique bonus performance | Critique | ❌ ABSENT | 🟢 Pris en charge (front uniquement) |
| **UC-FIN03** | Répartition plateforme/partenaire/franchise/central | Critique | ⚠️ Partiel | ⬜ Non retenu |
| **UC-C03** | Gestion réclamations (escalade) | Majeure | ⚠️ Partiel | 🟢 Pris en charge |
| **UC-S01** | Cycle complet réclamation support | Majeure | ⚠️ Partiel | 🟢 Pris en charge |
| **UC-03** | Cloisonnement des droits par zone | Critique | ✅ | — |

---

### Plan de développement retenu

#### 🟢 À implémenter

| # | Fonctionnalité | Priorité |
|---|---|---|
| 1 | **UC-FR02 — Moteur bonus** : page paramétrage KPI + enveloppe + grille paliers + activation + déclenchement manuel + rapport + logs | 🔴 P0 |
| 2 | **Suivi livreurs** : pages liste + détail livreur dans le portail franchise | 🔴 P0 |
| 3 | **Dashboard** : livreurs actifs, clients actifs, livraisons réalisées, taux annulation, incidents, réclamations | 🟠 P1 |
| 4 | **Liste livraisons franchise** : onglet livraisons dans le suivi de zone | 🟠 P1 |
| 5 | **Export Excel (.xlsx)** sur toutes les DataTable | 🟡 P2 |
| 6 | **Paramétrage zone** : activation/désactivation de zone | 🟡 P2 |
| 7 | **Pricing franchise** : verrouillage lecture seule (droits franchise ≠ central) | 🟡 P2 |
| 8 | **SOS** : bouton escalade explicite vers central dans détail incident | 🔵 P3 |
| 9 | **Support UC-S01** : cycle réclamation complet (statuts + crédit wallet dédommagement) | 🔵 P3 |

#### ⬜ Hors scope (non retenus)

| Fonctionnalité | Raison |
|---|---|
| Calcul cron automatique bonus (backend) | Côté backend — hors front |
| Notification push "Bonus reçu" (backend) | Côté backend — hors front |
| Suivi fret depuis portail franchise | Non retenu pour cette itération |
| Suivi location depuis portail franchise | Non retenu pour cette itération |
| Fret / Locations dans dashboard | Non retenu |
| Export PDF | Non retenu |
| Ventilation 4 tiers UC-FIN03 explicite | Non retenu |

---

### Points forts conservés

- ✅ **Cloisonnement zone** : la franchise ne voit que son périmètre
- ✅ **KYC / modération chauffeurs** : file complète avec modération
- ✅ **Finance** : solde, recharges cascade, commissions, réconciliation, transferts
- ✅ **SOS Guardian** : centre de sécurité temps réel très complet
- ✅ **Carte live** : supervision terrain opérationnelle
- ✅ **Territoire** : carte zones + extension
- ✅ **Support** : tickets + chat
