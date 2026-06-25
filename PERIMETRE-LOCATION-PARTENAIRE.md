# UPJUNOO PRO LOCATION — Périmètre Partenaire (Loueur) à implémenter

> Analyse des deux cahiers (`UPJUNOO Location Fret-1` — offre technique & financière, et `UPJUNOO_PRO_Location_Fret_Presentation` — cahier des charges fonctionnel Tome 1) pour faire ressortir le **périmètre Partenaire de la plateforme LOCATION**.
>
> **Contexte projet** : tout ce qui existe aujourd'hui (`src/features/partner/**`) couvre le métier **VTC** (chauffeurs, flotte, courses, shifts, assignation, live map…). Le métier **Location** doit être construit à neuf. L'amorce actuelle (`rental.service.ts`, `PartnerRentalPage.tsx`, `PartnerRentalDetailPage.tsx`) n'est qu'une coquille : une seule ressource `rental-offers`, des statuts simplifiés, et une **réutilisation de la flotte/chauffeurs VTC** — elle ne couvre pas le cahier des charges.

| | |
|---|---|
| **Périmètre** | UPJUNOO PRO LOCATION — Portail **Partenaire (Loueur)** |
| **Sources** | Offre technique §1, §2.2, §4 · Cahier des charges Tome 1 §3, §4.2, §5 · Workflows p.17, p.20, p.21 |
| **Hors périmètre de ce doc** | Portail **Client** Location, plateforme **Fret & Logistique**, back-office Franchise/Centrale (mentionnés en annexe pour les dépendances) |

---

## 1. Lecture du cahier — ce que doit faire le Partenaire Loueur

Le workflow Partenaire Loueur (cahier p.17) impose la chaîne complète :

```
Onboarding KYB + compte reversement
   → Configuration offre (flotte, tarifs, conditions)
   → Gestion disponibilités (calendrier)
   → Réception réservation (à confirmer)
   → Accepter ? ── Non → Refuser + motif (fin)
                └─ Oui → Confirmer + planifier remise
   → Check-in (état départ + photos)
   → Suivi location (incidents / prolongations)
   → Check-out (état retour + photos)
   → Calcul extras (retard, km, dommages)
   → Clôture réservation + facture finale
   → Reversement net (après commissions)
```

Les paiements/commissions/holds et le support/litiges sont des **socles communs** Location ⇄ Fret (workflows p.20 et p.21).

---

## 2. Modules à implémenter (Partenaire Loueur)

### 2.1 Onboarding / Activation (KYB) — *cahier §3.1*
- Profil société : RCCM/registre, contacts, **zones** d'activité.
- Compte de reversement (RIB / mobile money selon configuration).
- Validation **KYB avant activation production** (cycle : création → KYB → validation → activation module **Location**).
- Paramètres loueur par défaut : règles **caution, pénalités, validation, délais, livraison**.

> **Existant** : flux VTC d'onboarding/documents partenaire (`PartnerProfilePage`, `PartnerDocumentsSection`). À **réutiliser** mais avec activation du **module Location** distincte (cf. `PartnerModuleGuard`).

### 2.2 Gestion de la flotte de location (catalogue) — *cahier §3.2*
Ressource **distincte** des véhicules VTC (sémantique et attributs différents).
- Véhicule / **engin** : caractéristiques, photos, **catégorie** (Voiture, SUV, Utilitaire, Bus, Moto, Engin), capacité, **options activables** (chauffeur, livraison, accessoires).
- Documents obligatoires : assurance, carte grise, visite technique (selon catégorie) + **dates d'expiration** (→ alertes).
- **Statuts véhicule** : `disponible / réservé / en cours / maintenance / indisponible`.

> **Existant** : flotte VTC (`catalog.service.ts`, `vehicles.service.ts`, `PartnerVehiclesListPage`, `PartnerVehicleCreatePage`) avec workflow d'**approbation** orienté VTC. La page rental actuelle **réutilise `usePartnerVehiclesList("approved")`** → à remplacer par une flotte location dédiée (tarifs jour/semaine/mois, caution, km, carburant…).

### 2.3 Disponibilités & calendrier — *cahier §3.3*  🔴 **Inexistant**
- **Calendrier par véhicule**.
- Blocage de périodes (maintenance / indisponibilité).
- Gestion de la **saisonnalité** (haute / basse saison).

### 2.4 Tarification & conditions — *cahier §3.4*  🔴 **Quasi inexistant** (seul `price_fcfa` brut existe)
- Prix : **jour / semaine / mois**.
- Promotions (code promo / pourcentage — option).
- Options : chauffeur, livraison, accessoires (avec frais).
- Conditions contractuelles : **caution**, assurance (avec franchise), **km inclus / illimité + coût dépassement**, pénalités (retard/annulation/dommages), **carburant** (plein/plein), restrictions (zone/usage/interdictions).

### 2.5 Gestion des réservations — *cahier §3.5*  🟠 **Partiel**
- **File de traitement** par état : `à confirmer (délai limite)` / `confirmées` / `en cours` / `à clôturer`.
- Actions : **accepter / refuser (motif obligatoire)**, **replanifier** (proposer un autre créneau), **annuler (selon barème)**.
- Communication client : **via ticket / support** (pas de chat libre).

> **Existant** : `PartnerRentalPage` liste les offres + transitions confirm/reject/start/complete/cancel. Manquent : **file par échéance/délai limite**, **replanification**, **barème d'annulation**, motif de refus *obligatoire* à la confirmation.

### 2.6 États des lieux renforcés (check-in / check-out) — *cahier §3.6*  🔴 **Inexistant**
Aujourd'hui le check-in/out n'est qu'un **changement de statut**. Le cahier exige des **états des lieux avec preuves** :
- **Check-in** : photos état départ (**obligatoires**), km, carburant, accessoires remis, commentaire + signature/validation (option).
- **Check-out** : photos état retour (**obligatoires**), km, carburant, dommages, **calcul automatique des extras** (retard heures/jours, dépassement km, dommages/nettoyage), **génération facture finale**.

### 2.7 Incidents & litiges — *cahier §3.7*  🔴 **Inexistant côté Location**
- Déclaration incident (dégâts, sinistre, non-retour) + pièces jointes + commentaire.
- **Ouverture ticket automatique**.
- Statut : `en analyse / arbitrage / résolu`.

> **Existant** : socle support/litiges VTC (`features/support`, `features/disputes`, `PartnerSupportChat*`). À **brancher** sur l'entité réservation Location (workflow commun p.21).

### 2.8 Caution : restitution / retenue — *cahier §2.9 (déclenché côté partenaire)*  🔴 **Inexistant**
- Restitution **automatique** selon règles si check-out validé + absence de litige dans le délai.
- En cas de **retenue** : motif détaillé + preuves (photos/rapport) ; procédure de **contestation via ticket**.

### 2.9 Finance & reversements — *cahier §3.8 / workflow p.20*  🟠 **Existant VTC à étendre**
- Tableau recettes : **brut encaissé**, commissions UPJUNOO PRO (+ zone si applicable), frais de paiement/taxes, **net partenaire**.
- Reversements : `en attente / payés / bloqués (litige/hold)`.
- Relevés téléchargeables + **export CSV**.
- Calcul auto commissions/frais/taxes → **ledger** → payout (J+1 / hebdo / à la demande).

> **Existant** : `PartnerRevenuePage`, `PartnerLedgerPage`, `PartnerSettlementsPage`, `PartnerWalletPage`. À **réutiliser** en filtrant/agrégeant les flux **Location** (hold lié à caution/litige).

### 2.10 GPS pendant location active — *offre §1.2 & §2.2*  🟠 **Socle VTC réutilisable**
- Carte temps réel (position, horodatage, état signal) + historique du trajet **borné à la période de location**.
- Alertes : sortie de zone, arrêt prolongé, perte de signal, retard.
- Inventaire dispositifs + **affectation dispositif → véhicule** ; export preuve trajet (PDF/CSV) ; **journalisation des accès** (audit).

> **Existant** : `PartnerGpsDevicesPage`, `gps.service.ts`, `PartnerLiveMapPage`, hooks live map. À **réutiliser** avec visibilité limitée à la fenêtre de location.

### 2.11 Alertes & notifications Partenaire — *cahier §4.2*
- Réservation à confirmer (délai/échéance), client en retard au retrait, retour en retard.
- Check-in/out incomplet (photos manquantes).
- **Document véhicule expirant** (assurance, visite, carte grise).
- Reversement prêt / reversement bloqué (litige).

---

## 3. Modèle de statuts Location — *cahier §5*

À implémenter comme machine à états (validation **serveur** des transitions — offre §4.2) :

```
Brouillon
→ En attente paiement
→ En attente confirmation partenaire (si applicable)
→ Confirmée
→ Prête (retrait/livraison)
→ En cours (location active)
→ Retour prévu
→ À clôturer (check-out en attente validation)
→ Clôturée
→ Annulée / Remboursée
→ Bloquée (litige)
```

> **Écart** : le `RentalOfferStatus` actuel (`pending / confirmed / rejected / active / completed / cancelled`) ne couvre **pas** : `awaiting_payment`, `ready`, `return_due`, `to_close`, `refunded`, `blocked`. Modèle à refondre.

---

## 4. Synthèse écart (existant VTC/amorce → cible Location)

| Module | État actuel | Action |
|---|---|---|
| Onboarding / KYB | ✅ VTC | Réutiliser + activation module Location |
| Flotte location (catalogue) | 🟠 réutilise flotte VTC | **Créer** ressource flotte location dédiée |
| Disponibilités / calendrier | 🔴 absent | **Créer** |
| Tarification jour/semaine/mois + conditions | 🔴 `price_fcfa` brut | **Créer** modèle tarifaire + conditions |
| Réservations (file, replanif, barème) | 🟠 transitions basiques | **Étendre** |
| États des lieux check-in/out + preuves | 🔴 simple statut | **Créer** (photos, km, carburant, extras) |
| Facture finale + calcul extras | 🔴 absent | **Créer** |
| Incidents & litiges | 🔴 absent (Location) | **Brancher** socle support/disputes |
| Caution restitution/retenue | 🔴 absent | **Créer** |
| Finance & reversements | 🟠 VTC | **Étendre** flux Location + hold caution |
| GPS période active | 🟠 VTC | **Réutiliser** (visibilité bornée) |
| Alertes partenaire | 🔴 absent (Location) | **Créer** |
| Machine à états (11 statuts) | 🔴 6 statuts | **Refondre** |

🔴 à construire · 🟠 partiel/à étendre · ✅ réutilisable

---

## 5. Cartographie technique proposée (`src/features/partner`)

Conserver les conventions existantes (`api/*.service.ts` + `*.queries.ts`, `pages/`, `components/`, `LINKS` dans `src/core/api/links.ts`).

**API / services à créer ou étendre**
- `api/rental.service.ts` — refondre `RentalOffer` (statuts cibles, montants détaillés, options, conditions).
- `api/rentalFleet.service.ts` — flotte location (catégories, photos, docs, statuts).
- `api/rentalPricing.service.ts` — tarifs jour/semaine/mois, promos, conditions.
- `api/rentalAvailability.service.ts` — calendrier, blocages, saisonnalité.
- `api/rentalInspection.service.ts` — états des lieux check-in/out + extras + facture finale.
- `api/rentalDeposit.service.ts` — caution (restitution/retenue/contestation).
- Réutiliser : `gps.*`, `support.*`/`disputes`, `wallet/ledger/settlements`, `profile/documents`.

**Pages à créer / refondre**
- `PartnerRentalPage` (file de traitement par état + KPI) — refonte.
- `PartnerRentalDetailPage` (timeline statuts, check-in/out, extras, caution, ticket, GPS) — refonte profonde.
- `PartnerRentalFleetPage` + `PartnerRentalVehicleCreatePage`.
- `PartnerRentalCalendarPage` (disponibilités).
- `PartnerRentalPricingPage` (tarifs & conditions).

**Endpoints `LINKS.partner.rental`** : aujourd'hui seulement `list/create/update/delete` sur `rental-offers`. À étendre (flotte, calendrier, pricing, inspections check-in/out, caution, finance location). → **Dépendance backend** à formaliser (voir §6).

---

## 6. Dépendances & hypothèses backend (à confirmer)

1. **Endpoints Location dédiés** au-delà de `rental-offers` (flotte location, calendrier/dispo, pricing, inspections, caution, finance). Le service actuel note déjà *« Pas d'endpoint GET détail »* et *« Pas d'endpoint stats »* → contraintes à lever.
2. **Validation serveur des transitions de statut** et des **calculs financiers** (commissions, cautions, holds) — exigence offre §4.2.
3. **Upload/sanitation** des preuves (photos check-in/out, documents, rapports caution).
4. **Connecteur GPS** (webhooks/polling) avec rétention paramétrable et **audit des accès**.
5. **Génération PDF** : contrat de location, reçu, facture finale (le forfait exclut SMS/email/push & PSP — offre §6).

---

*Rapport établi par Yao Ivan · Équipe Front.*
