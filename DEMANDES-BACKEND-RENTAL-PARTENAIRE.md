# UPJUNOO — Demandes Backend · Module LOCATION (Partenaire / Loueur)

> Demandes backend pour le portail **Partenaire LOCATION**. Deux natures de besoins :
> **Partie A** — écarts **confirmés dans le code front** sur l'unique endpoint existant (`rental-offers`), que le front contourne aujourd'hui par des palliatifs.
> **Partie B** — **endpoints manquants** pour couvrir le périmètre du cahier des charges (Tome 1 §3–§5), aujourd'hui non implémentés côté API.
>
> Référence fonctionnelle : [PERIMETRE-LOCATION-PARTENAIRE.md](PERIMETRE-LOCATION-PARTENAIRE.md).

| | |
|---|---|
| **Date** | 25 juin 2026 |
| **Module** | UPJUNOO PRO LOCATION — Portail Partenaire |
| **Endpoint existant** | `/v1/partners/{partnerId}/rental-offers` (GET list, POST, PATCH, DELETE) |
| **Base proposée** | `/v1/partners/{partnerId}/rental/*` pour les nouvelles ressources |
| **Source du constat** | Revue du code front (`src/features/partner/api/rental.service.ts`, `rental.queries.ts`, `pages/PartnerRental*.tsx`) — **non encore sondé en runtime** |
| **Rapporteur** | Yao Ivan · Équipe Front |

> ⚠️ **Statut de vérification** : contrairement au rapport *Courses*, les points ci-dessous sont **confirmés par lecture du code** (palliatifs front en place), **pas** par sonde runtime authentifiée. Les points marqués *« à confirmer en runtime »* doivent être validés contre l'API réelle avant chiffrage.

---

# Partie A — Écarts sur l'endpoint existant `rental-offers`

## 🔴 DB-RENT-01 (P0) — Pas d'endpoint de détail d'une réservation

- **Demande** : exposer `GET /v1/partners/{partnerId}/rental-offers/{offerId}` renvoyant l'offre complète.
- **Constat (code)** : `rental.service.ts` commente explicitement *« Pas d'endpoint GET détail côté backend : on dérive l'offre depuis la liste. »* — `getById()` charge `…/rental-offers?per_page=200` puis fait un `.find()` côté client.
  ```ts
  // rental.service.ts
  getById: async (partnerId, offerId) => {
    const response = await apiClient.get(`${LINKS.partner.rental.list(partnerId)}?per_page=200`);
    return mapRentalResponse(response).data.find(o => o.id === offerId || o.ref === offerId) ?? null;
  }
  ```
- **Impact** : la page détail (`PartnerRentalDetailPage`) télécharge jusqu'à 200 réservations pour en afficher **une** ; toute offre au-delà du rang 200 est **introuvable**. Charge réseau et risque de faux « introuvable ».
- **Réponse attendue** : endpoint de détail dédié, renvoyant l'offre + objets liés (véhicule, client, conditions, états des lieux, caution — cf. Partie B).

## 🔴 DB-RENT-02 (P0) — Pas d'endpoint de statistiques / compteurs

- **Demande** : exposer `GET /v1/partners/{partnerId}/rental-offers/stats` (ou `counters` dans la réponse liste) avec la ventilation par statut + agrégats financiers.
- **Constat (code)** : `PartnerRentalPage` commente *« Pas d'endpoint stats : on charge toute la liste et on calcule le dashboard côté client. »* — KPI (total, en attente, en cours, revenus, cautions) recalculés sur `per_page: 200`.
- **Impact** : KPI **plafonnés à 200** réservations et faux dès que le volume dépasse la page chargée ; impossible d'afficher des totaux fiables.
- **Réponse attendue** :
  ```jsonc
  {
    "counters": { "total": 0, "pending": 0, "confirmed": 0, "ready": 0,
                  "active": 0, "to_close": 0, "completed": 0,
                  "cancelled": 0, "blocked": 0 },
    "revenue_fcfa": 0,            // confirmées + en cours + clôturées
    "deposits_held_fcfa": 0       // cautions bloquées (locations actives)
  }
  ```
  Compteurs calculés sur le **même périmètre filtré** que la liste (mêmes `status`/`search`/`date_from`/`date_to`).

## 🟠 DB-RENT-03 (P1) — Filtres, tri et pagination serveur sur la liste

- **Demande** : honorer sur `GET /rental-offers` les paramètres déjà émis par le socle `buildListQuery` : `page`, `per_page`, `search`, `status`, `sort`, `order`, `date_from`, `date_to`.
- **Constat (code)** : le front **contourne** en chargeant `per_page: 200` puis filtre/trie/recherche **côté client** (`PartnerRentalPage` → `statusFilter`, `searchTerm`). Le filtrage serveur n'est donc pas utilisé aujourd'hui.
- **Champs de tri attendus** : `ref`, `client_name`, `vehicle_label`, `pickup_date`, `return_date`, `price_fcfa`, `status`, `created_at` (défaut `created_at desc`).
- **Champs de recherche** : `ref`, `client_name`, `client_phone`, `vehicle_label`, `pickup_location`.
- **À confirmer en runtime** : comportement réel de `per_page`/`status`/`sort` (cf. écarts identiques relevés sur *Courses* : `per_page` figé à 20, `counters` non filtrés).
- **Réponse attendue** : pagination/tri/filtre appliqués **côté SQL** sur l'ensemble du résultat, permettant au front de retirer ses palliatifs `per_page: 200`.

## 🟠 DB-RENT-04 (P1) — Modèle de statuts incomplet & transitions validées serveur

- **Demande** : aligner le statut sur les **11 états** du cahier (Tome 1 §5) et **valider les transitions côté serveur** (offre technique §4.2).
- **Constat (code)** : `RentalOfferStatus` = `pending | confirmed | rejected | active | completed | cancelled`. Manquent : `draft`, `awaiting_payment`, `ready` (prête retrait/livraison), `return_due` (retour prévu), `to_close` (check-out en attente validation), `refunded`, `blocked` (litige).
- **Réponse attendue** : énumération cible ci-dessous + refus de toute transition illégale (ex. `completed → active`).
  ```
  draft → awaiting_payment → awaiting_confirmation → confirmed → ready
        → active → return_due → to_close → completed
        | cancelled | refunded | blocked
  ```

## 🟠 DB-RENT-05 (P1) — Motif obligatoire au refus / annulation

- **Demande** : rendre `rejection_reason` **obligatoire** sur `PATCH` vers `rejected`, et accepter un `cancellation_reason` + barème sur `cancelled` (cahier §3.5).
- **Constat (code)** : `UpdateRentalOfferPayload` accepte `rejection_reason?` mais aucune contrainte ; le front envoie le statut sans imposer de motif.
- **Réponse attendue** : `422` si motif absent lors d'un refus ; persistance et restitution du motif dans le détail.

---

# Partie B — Endpoints manquants (périmètre cible)

> Aucun de ces modules n'existe côté API aujourd'hui. Priorités proposées pour un MVP Location aligné sur le workflow Partenaire (cahier p.17).

## 🔴 DB-RENT-10 (P0) — Flotte de location dédiée

Ressource **distincte** de la flotte VTC (attributs propres : tarifs, caution, km, carburant). Le front réutilise aujourd'hui par défaut `usePartnerVehiclesList("approved")`, ce qui est un palliatif.

- `GET / POST /v1/partners/{partnerId}/rental/vehicles`
- `GET / PATCH / DELETE …/rental/vehicles/{vehicleId}`
- `PATCH …/rental/vehicles/{vehicleId}/status` → `disponible | réservé | en_cours | maintenance | indisponible`
- **Champs** : catégorie (`voiture|suv|utilitaire|bus|moto|engin`), marque/modèle, capacité, transmission, photos[], options activables (chauffeur/livraison/accessoires), documents (assurance, carte grise, visite) **avec dates d'expiration**.

## 🔴 DB-RENT-11 (P0) — Tarification & conditions

- `GET / PUT …/rental/vehicles/{vehicleId}/pricing`
- **Champs** : `price_day_fcfa`, `price_week_fcfa`, `price_month_fcfa`, `deposit_fcfa`, `km_included` (int|null=illimité), `km_extra_fcfa`, `fuel_policy` (`full_to_full|other`), assurance + franchise, pénalités (retard/annulation/dommages), restrictions (zone/usage), promotions (code/%) optionnel.
- Le **calcul du prix** d'une réservation (durée × tarif + options + caution) doit être fait **côté serveur** (offre §4.2) et renvoyé dans le devis/récapitulatif.

## 🔴 DB-RENT-12 (P0) — Disponibilités & calendrier

- `GET …/rental/vehicles/{vehicleId}/availability?from=&to=` → créneaux libres/occupés.
- `POST / DELETE …/rental/vehicles/{vehicleId}/blocks` → blocage maintenance/indisponibilité.
- Gestion **saisonnalité** (haute/basse saison) — optionnel MVP+.
- Le serveur doit **refuser une réservation** chevauchant une période déjà réservée/bloquée.

## 🔴 DB-RENT-13 (P0) — États des lieux check-in / check-out

- `POST …/rental-offers/{offerId}/check-in`
  - **Champs** : `photos[]` (**obligatoires**), `km_start`, `fuel_start`, `accessories[]`, `comment?`, `signature?`. Déclenche la transition `confirmed/ready → active`.
- `POST …/rental-offers/{offerId}/check-out`
  - **Champs** : `photos[]` (**obligatoires**), `km_end`, `fuel_end`, `damages[]`.
  - Le serveur **calcule les extras** : retard (heures/jours), dépassement km, dommages/nettoyage → renvoie le détail facturable. Transition `active → to_close`.
- **Upload/sanitation** des photos requis (offre §4.2).

## 🔴 DB-RENT-14 (P0) — Facture finale & clôture

- `POST …/rental-offers/{offerId}/close` → génère la **facture finale** (base + extras), passe en `completed`, déclenche le calcul de reversement.
- `GET …/rental-offers/{offerId}/documents` → contrat de location (PDF), reçu, facture finale, POD états des lieux.

## 🔴 DB-RENT-15 (P0) — Caution : restitution / retenue

- `POST …/rental-offers/{offerId}/deposit/release` → restitution (auto si check-out validé + absence de litige dans le délai).
- `POST …/rental-offers/{offerId}/deposit/withhold` → retenue : `amount_fcfa`, `reason` (**obligatoire**), `proofs[]`.
- Contestation via **ticket** (réutilise le socle support/litiges).

## 🟠 DB-RENT-16 (P1) — Réservations : file de traitement & actions

- `GET …/rental-offers?queue=to_confirm|confirmed|active|to_close` (file avec **délai limite** par item).
- `POST …/rental-offers/{offerId}/reschedule` → proposer un autre créneau (`pickup_date`, `return_date`).
- Annulation **selon barème** (montant de pénalité calculé serveur).

## 🟠 DB-RENT-17 (P1) — Finance & reversements (flux Location)

- `GET …/rental/finance/summary` → brut encaissé, commissions UPJUNOO (+ zone), frais/taxes, **net partenaire**.
- `GET …/rental/settlements?status=pending|paid|hold` + **export CSV**.
- **Hold** automatique du reversement si litige bloquant ou caution en contestation (workflow p.20).

## 🟠 DB-RENT-18 (P1) — Incidents, GPS & alertes

- **Incidents** : `POST …/rental-offers/{offerId}/incidents` (type `panne|accident|dommage|non_retour|retard`, pièces jointes) → **ouverture ticket automatique**, statut `en_analyse|arbitrage|resolu`.
- **GPS** : réutiliser le socle GPS VTC mais **visibilité bornée à la fenêtre de location** + **audit des accès** (offre §1.2 / §4.2).
- **Alertes partenaire** (cahier §4.2) : réservation à confirmer (échéance), retard retrait/retour, check-in/out incomplet (photos manquantes), **document véhicule expirant**, reversement prêt/bloqué.

---

## Récapitulatif

| Réf. | Priorité | Point | Nature |
|---|---|---|---|
| DB-RENT-01 | 🔴 P0 | Endpoint détail réservation | Écart endpoint existant |
| DB-RENT-02 | 🔴 P0 | Endpoint stats / counters | Écart endpoint existant |
| DB-RENT-03 | 🟠 P1 | Filtres/tri/pagination serveur | Écart endpoint existant |
| DB-RENT-04 | 🟠 P1 | 11 statuts + transitions validées | Écart endpoint existant |
| DB-RENT-05 | 🟠 P1 | Motif obligatoire refus/annulation | Écart endpoint existant |
| DB-RENT-10 | 🔴 P0 | Flotte location dédiée | Endpoint manquant |
| DB-RENT-11 | 🔴 P0 | Tarification & conditions | Endpoint manquant |
| DB-RENT-12 | 🔴 P0 | Disponibilités & calendrier | Endpoint manquant |
| DB-RENT-13 | 🔴 P0 | États des lieux check-in/out | Endpoint manquant |
| DB-RENT-14 | 🔴 P0 | Facture finale & clôture | Endpoint manquant |
| DB-RENT-15 | 🔴 P0 | Caution restitution/retenue | Endpoint manquant |
| DB-RENT-16 | 🟠 P1 | File de traitement & replanif | Endpoint manquant |
| DB-RENT-17 | 🟠 P1 | Finance & reversements Location | Endpoint manquant |
| DB-RENT-18 | 🟠 P1 | Incidents · GPS · alertes | Endpoint manquant |

---

*Rapport établi par Yao Ivan · Équipe Front.*
