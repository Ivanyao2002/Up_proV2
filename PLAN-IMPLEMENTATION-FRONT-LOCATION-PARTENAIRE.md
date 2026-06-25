# UPJUNOO PRO LOCATION — Plan d'implémentation Front (Partenaire / Loueur)

> Plan séquencé pour construire le portail **Partenaire LOCATION** côté front.
> Réfs : [PERIMETRE-LOCATION-PARTENAIRE.md](PERIMETRE-LOCATION-PARTENAIRE.md) (périmètre) · [DEMANDES-BACKEND-RENTAL-PARTENAIRE.md](DEMANDES-BACKEND-RENTAL-PARTENAIRE.md) (contrats API).

## Principe directeur : **mock-first / contract-first**

Les endpoints Location (hors `rental-offers`) **n'existent pas encore** côté backend. Pour ne pas bloquer le front :
1. On fige les **contrats TypeScript** (types + payloads) à partir du doc de demandes backend.
2. On branche des **handlers MSW** (`src/mocks/handlers/partner.handlers.ts`) qui simulent ces contrats.
3. Le front se développe et se teste contre les mocks ; le basculement vers l'API réelle se fait sans toucher aux pages (seuls les `*.service.ts` pointent vers de vrais endpoints).

> Chaque lot livre une **verticale testable** (UI + service + mock), pas une couche horizontale.

## Conventions repo (à respecter)

| Élément | Emplacement / pattern |
|---|---|
| Pages | `src/features/partner/pages/PartnerRental*.tsx` |
| Services / queries | `src/features/partner/api/*.service.ts` + `*.queries.ts` (React Query) |
| Routes (app-router) | `src/app/(partner)/partner/rental/**` |
| Endpoints | `src/core/api/links.ts` → `LINKS.partner.rental.*` |
| Navigation | `src/portals/partner/partnerNav.ts` |
| Garde de module | `<PartnerModuleGuard module="rental">` (déjà supporté) |
| Mocks | `src/mocks/handlers/partner.handlers.ts` |
| UI partagée | `PageHeader`, `DataTable`, `KpiCard`, `FilterChips`, `TableFiltersBar`, `ConfirmModal`, `ModalPortal` |
| Hooks tableau | `useServerTableState`, `useListFiltersReset` |
| Format | `formatFCFA`, `formatDateTime` (`@/shared/lib/format`) |
| Scope | `useScope()` → `ownerId`, `hasModule()` |

---

## LOT 0 — Fondations & contrats *(socle, non visible)*

**Objectif** : poser le squelette technique commun à tous les lots.

- **Modèle de statuts** : créer `src/features/partner/lib/rentalStatus.ts`
  - `RentalStatus` (11 états — cf. DB-RENT-04), `STATUS_CONFIG` (label + couleur), `ALLOWED_TRANSITIONS` (machine à états), `nextActions(status)`.
- **Types & LINKS** :
  - Étendre `LINKS.partner.rental` (`detail`, `stats`, `vehicles`, `pricing`, `availability`, `checkIn`, `checkOut`, `close`, `deposit`, `incidents`, `finance`).
  - Refondre `rental.service.ts` : `RentalOffer` enrichi (montants détaillés, options, conditions, états des lieux, caution), `getById` → vrai endpoint détail.
- **Navigation** : remplacer l'entrée unique par un **groupe dédié** dans `partnerNav.ts` :
  ```
  group: "LOCATION"  (visible si hasModule("rental"))
    - Réservations        /partner/rental
    - Flotte location     /partner/rental/fleet
    - Calendrier          /partner/rental/calendar
    - Tarifs & conditions /partner/rental/pricing
    - Finance location    /partner/rental/finance
  ```
  (NB : la nav ne filtre pas encore par module — prévoir un filtrage `hasModule` à l'affichage, ou conserver `permission: "partner.rental.view"`.)
- **Mocks** : amorcer un dataset Location dans `partner.handlers.ts` (offres + flotte + tarifs in-memory).

**DoD** : `npm run build` + lint OK ; nav affiche le groupe Location ; toutes les pages des lots suivants peuvent importer le modèle de statuts.

---

## LOT 1 — Flotte de location dédiée  *(P0 — DB-RENT-10)*

**Objectif** : catalogue véhicules/engins propre à la Location (≠ flotte VTC).

| Fichier | Action |
|---|---|
| `api/rentalFleet.service.ts` | **créer** — CRUD + `setStatus` |
| `api/rentalFleet.queries.ts` | **créer** |
| `pages/PartnerRentalFleetPage.tsx` | **créer** — liste (DataTable + KPI + filtres catégorie/statut) |
| `pages/PartnerRentalVehicleCreatePage.tsx` | **créer** — formulaire (catégorie, photos, capacité, options, documents + expirations) |
| `pages/PartnerRentalVehicleDetailPage.tsx` | **créer** — détail + statut `disponible/réservé/en_cours/maintenance/indisponible` |
| `app/(partner)/partner/rental/fleet/{page,[id]/page,new/page}.tsx` | **créer** routes |

S'inspirer de `PartnerVehiclesListPage` / `PartnerVehicleCreatePage` (mêmes composants), **sans** le workflow d'approbation VTC.

**DoD** : créer/éditer un véhicule location, changer son statut, voir ses documents et alertes d'expiration (badge).

---

## LOT 2 — Tarification, conditions & disponibilités  *(P0 — DB-RENT-11/12)*

**Objectif** : rendre une offre « réservable » (prix + règles + calendrier).

| Fichier | Action |
|---|---|
| `api/rentalPricing.service.ts` + `.queries.ts` | **créer** — `GET/PUT pricing` par véhicule |
| `api/rentalAvailability.service.ts` + `.queries.ts` | **créer** — `availability`, `blocks` |
| `pages/PartnerRentalPricingPage.tsx` | **créer** — tarifs jour/semaine/mois, caution, km inclus/illimité + dépassement, carburant, pénalités, restrictions, promos |
| `pages/PartnerRentalCalendarPage.tsx` | **créer** — calendrier par véhicule, blocage périodes (maintenance/indispo), saisonnalité |
| `components/RentalPricingForm.tsx`, `RentalCalendar.tsx` | **créer** |

**DoD** : éditer un barème complet ; bloquer une période ; visualiser disponibilités. (Calcul du prix = serveur — le front affiche le devis renvoyé.)

---

## LOT 3 — Réservations : file de traitement & cycle de décision  *(refonte — DB-RENT-01/02/03/04/05/16)*

**Objectif** : refondre la gestion des réservations sur les 11 statuts + actions complètes.

| Fichier | Action |
|---|---|
| `pages/PartnerRentalPage.tsx` | **refondre** — file de traitement par onglet (`à confirmer / confirmées / en cours / à clôturer`), KPI via endpoint `stats`, tri/filtre **serveur** (retirer le palliatif `per_page: 200` + filtrage client) |
| `pages/PartnerRentalDetailPage.tsx` | **refondre** — timeline statuts, actions contextuelles (`nextActions`), affectation véhicule **flotte location**, panneau client/conditions |
| `components/RentalRejectModal.tsx` | **créer** — refus avec **motif obligatoire** |
| `components/RentalRescheduleModal.tsx` | **créer** — proposer un autre créneau |
| `api/rental.service.ts` | **étendre** — `reschedule`, `stats`, motif obligatoire |

**DoD** : accepter/refuser (motif requis), replanifier, annuler (barème), naviguer la file ; KPI fiables (non plafonnés) ; tri/pagination serveur effectifs.

---

## LOT 4 — Exécution : check-in / check-out + facture finale  *(P0 — DB-RENT-13/14)*

**Objectif** : états des lieux renforcés avec preuves et calcul des extras.

| Fichier | Action |
|---|---|
| `api/rentalInspection.service.ts` + `.queries.ts` | **créer** — `checkIn`, `checkOut` (renvoie extras calculés) |
| `components/RentalCheckInModal.tsx` | **créer** — photos **obligatoires**, km, carburant, accessoires, commentaire/signature |
| `components/RentalCheckOutModal.tsx` | **créer** — photos **obligatoires**, km/carburant retour, dommages → affiche extras (retard, dépassement km, dommages) |
| `components/RentalPhotoUploader.tsx` | **créer** — upload multi-photos (réutiliser le pattern docs VTC si dispo) |
| `pages/PartnerRentalDetailPage.tsx` | **brancher** modales + bloc « État des lieux » + « Facture finale » |

**DoD** : check-in bloque sans photos ; check-out calcule et affiche les extras ; clôture génère la facture finale (lien PDF).

---

## LOT 5 — Caution : restitution / retenue / contestation  *(P0 — DB-RENT-15)*

| Fichier | Action |
|---|---|
| `api/rentalDeposit.service.ts` + `.queries.ts` | **créer** — `release`, `withhold` |
| `components/RentalDepositPanel.tsx` | **créer** — état caution (bloquée/restituée/retenue) |
| `components/RentalDepositWithholdModal.tsx` | **créer** — retenue : montant, **motif obligatoire**, preuves ; lien ticket de contestation |

**DoD** : restituer ou retenir une caution avec justificatifs ; ouverture ticket de contestation (réutilise le socle support).

---

## LOT 6 — Finance, incidents, GPS & alertes  *(P1 — DB-RENT-17/18)*

**Objectif** : clôturer la boucle (reversement) et brancher les socles communs.

- **Finance Location** : `api/rentalFinance.service.ts` + `pages/PartnerRentalFinancePage.tsx` — brut/commissions/frais/net, reversements (en attente/payés/hold), export CSV. *Réutiliser au maximum* `PartnerRevenuePage`/`PartnerSettlementsPage`/`PartnerLedgerPage` filtrés Location.
- **Incidents** : `components/RentalIncidentModal.tsx` → ouverture ticket auto (socle `features/support` / `features/disputes`).
- **GPS** : réutiliser `PartnerLiveMapPage` / `gps.*` avec **visibilité bornée à la fenêtre de location** ; intégrer une carte dans le détail réservation active.
- **Alertes partenaire** (cahier §4.2) : réservation à confirmer (échéance), retard retrait/retour, check-in/out incomplet, **document véhicule expirant**, reversement prêt/bloqué → via `PartnerNotificationsPage`.

**DoD** : tableau finance Location cohérent ; déclaration d'incident → ticket ; carte GPS sur location active ; alertes visibles.

---

## Séquencement & dépendances

```
LOT 0 ─┬─ LOT 1 ─┬─ LOT 2 ──┐
       │         └──────────┤
       └─ LOT 3 ────────────┼─ LOT 4 ─ LOT 5 ─ LOT 6
                            (LOT 3 a besoin de la flotte L1 pour l'affectation)
```

- **L0** prérequis de tout.
- **L1** avant **L2** (tarifs/calendrier s'accrochent à un véhicule) et avant **L3** (affectation).
- **L4** après **L3** (check-in part d'une réservation `confirmed/ready`).
- **L5** après **L4** (caution libérée au check-out validé).
- **L6** transverse, peut démarrer en parallèle dès L3 pour la finance.

## Estimation indicative (front, mock-first)

| Lot | Charge front |
|---|---|
| L0 Fondations | ~1 j |
| L1 Flotte | ~2 j |
| L2 Tarifs + calendrier | ~2–3 j |
| L3 Réservations (refonte) | ~3 j |
| L4 Check-in/out + facture | ~3 j |
| L5 Caution | ~1–2 j |
| L6 Finance/incidents/GPS/alertes | ~2–3 j |

> Hypothèse : socles VTC (GPS, support, wallet, upload docs) réutilisables tels quels. Le basculement mock → API réelle dépend de la livraison des endpoints (Partie B du doc de demandes backend).

## Risques

- **Dérive de contrat** si l'API réelle diverge des mocks → garder un seul point de vérité (`*.service.ts`) et typer strictement.
- **Réutilisation flotte VTC** : ne pas mélanger les deux référentiels véhicules (sémantique/statuts différents).
- **Calculs financiers** (extras, caution, commissions) : **toujours côté serveur** ; le front ne fait qu'afficher (offre §4.2).

---

*Plan établi par Yao Ivan · Équipe Front.*
