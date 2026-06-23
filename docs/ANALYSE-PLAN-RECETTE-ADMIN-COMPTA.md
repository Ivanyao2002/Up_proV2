# Analyse détaillée — Plan de recette vs back-office Admin & Compta

> **Date** : 16 juin 2026  
> **Projet** : UpJunoo Pro (`Up_prov2`)  
> **Sources** :
> - `docs/PLAN DE RECETTE ET DEPLOIEMENT.pdf` / `.pptx` (59 slides, v1.0, jalon test réel **21 juin 2026**)
> - Code front : `src/portals/admin/adminNav.ts`, `src/portals/compta/comptaNav.ts`, routes `src/app/(admin)` et `src/app/(compta)`
> - Compléments API : `docs/BACKEND-RESPONSES-DISPATCH-METEO.md`, `docs/RAPPORT-ECARTS-API-BACKEND.md`

**Objectif** : comparer ce que le plan de recette attend pour le **Central / Siège** et le profil **Finance / Compta**, avec ce qui existe réellement dans le back-office web.

---

## Légende des statuts

| Symbole | Signification |
|---------|---------------|
| ✅ | Présent et aligné avec le plan (écran + route + intention métier) |
| ⚠️ | Présent mais partiel, mock, hors nav, ou écart fonctionnel |
| ❌ | Absent ou non conforme au plan |
| 🔗 | Couvert par un autre portail (partenaire / franchise / mobile) |
| 📋 | À valider en test réel (UI OK, API / données à confirmer) |

---

## 1. Cadre du plan de recette

### 1.1 Jalon et périmètre

- **Journée test réel** : dimanche 21 juin 2026 — 40 engins, ~90 comptes, 4 services (VTC, livraison, fret, location).
- **Objectif** : valider exploitation multiservices, cloisonnement des profils, cohérence financière, migration sans perte de données.
- **5 niveaux de recette** (slide 28) : technique → fonctionnelle → financière → opérationnelle → reporting.

### 1.2 Huit interfaces web attendues (slide 24)

| # | Interface plan | Rôle attendu |
|---|----------------|--------------|
| 01 | **Administrateur central** | Vue globale, supervision tous services |
| 02 | **Support** | Réclamations, chat, escalades |
| 03 | **Finance** | Wallets, commissions, exports, cohérence |
| 04 | **Partenaire** | Flotte, recharges cascade |
| 05 | **Franchise** | Zone, reporting local, bonus |
| 06 | **Reporting** | Tableaux consolidés, exports |
| 07 | **Paramétrage** | Tarifs, commissions, bonus, zones |
| 08 | **Suivi anomalies** | Registre anomalies recette / production |

### 1.3 Sept comptes centraux attendus (slide 26)

Super-admin · exploitation · finance · support · conformité · reporting · direction (lecture seule).

### 1.4 Règle financière stricte (slides 15, 37 — UC-FIN01)

> **Le central NE recharge PAS les wallets des chauffeurs ni des livreurs.**  
> Supervision financière en **lecture seule**. Recharges = partenaire (cascade), franchise (bonus), ou auto-recharge chauffeur/livreur.

**Test négatif obligatoire** : aucune action de recharge depuis l’interface centrale.

### 1.5 Dix-huit fonctions Central / Siège (slide 15)

| # | Fonction attendue |
|---|-------------------|
| 01 | Administration globale |
| 02 | Supervision tous services |
| 03 | Gestion des franchises |
| 04 | Gestion des partenaires |
| 05 | Gestion des chauffeurs |
| 06 | Gestion des livreurs |
| 07 | Gestion des clients |
| 08 | Paramétrage des tarifs |
| 09 | Paramétrage commissions |
| 10 | Paramétrage règles bonus |
| 11 | Paramétrage zones |
| 12 | Supervision wallets (**lecture seule**) |
| 13 | Gestion réclamations |
| 14 | Reporting consolidé |
| 15 | Export financier |
| 16 | Audit des opérations |
| 17 | Gestion droits & rôles |
| 18 | Conformité & logs |

### 1.6 Vingt-deux rapports consolidés attendus (slide 21)

Activité totale · par service · zone · franchise · partenaire · chauffeur · livreur · recettes brutes · commissions (plateforme / partenaire / franchise) · wallets & soldes · recharges · débits · transactions · incidents · réclamations · taux annulation / acceptation / finalisation · audit & logs · conformité · **exports CSV / Excel**.

### 1.7 Vingt-neuf use cases de recette (slide 29)

| Bloc | UC | Sujet |
|------|-----|-------|
| Transversaux | UC-01 → UC-03 | Compte client, reconnexion, rôles & droits |
| Transport | UC-T01 → UC-T05 | Demande, acceptation, cycle complet, annulations |
| Livraison | UC-L01 → UC-L04 | Missions livraison |
| Fret | UC-F01 → UC-F02 | Devis partenaire, affectation |
| Location | UC-LO01 → UC-LO02 | Réservation véhicule |
| Finance | UC-FIN01 → UC-FIN04 | Recharge, commission, répartition, solde insuffisant |
| Partenaires | UC-P01 → UC-P02 | Création / validation, rattachement flotte |
| Franchise | UC-FR01 → UC-FR02 | Supervision zone, bonus auto |
| Central | UC-C01 → UC-C03 | Dashboard, reporting multiservices, réclamations |
| Support | UC-S01 | Cycle réclamation complet |
| Admin | UC-A01 (a/b/c) | Tarifs, commissions, gabarit bonus |
| Audit | UC-AU01 | Journal inviolable, exports auditeur |

---

## 2. Correspondance interfaces plan ↔ portails Up_prov2

| Interface plan | Implémentation `Up_prov2` | URL / entrée | Écart |
|----------------|---------------------------|--------------|-------|
| 01 Admin central | Portail **Admin** | `/admin`, login `/admin/login` | Fusionné avec paramétrage et partie support |
| 02 Support | Module dans Admin | `/admin/support/*` | Pas de portail `/support` dédié |
| 03 Finance | Portail **Compta** | `/compta`, login `/compta/login` | + lien croisé vers `/admin/finance` |
| 04 Partenaire | Portail Partner | `/partner` | Hors périmètre ce doc |
| 05 Franchise | Portail Franchise | `/franchise` | Hors périmètre ce doc |
| 06 Reporting | Dashboards + exports | `/admin/dashboard`, `/compta/exports` | Pas de portail `/reporting` |
| 07 Paramétrage | Admin Settings | `/admin/settings/*` | Intégré admin |
| 08 Suivi anomalies | Partiel | `/admin/settings/audit` | Pas de registre anomalies recette |
| — Exploitation dispatch | Portail Dispatch | `/dispatch/login` | Non listé dans les 8 interfaces du plan |
| — Comptables (admin réseau) | Admin réseau | `/admin/network/accountants` | Non dans le plan, utile pour compta |

**Synthèse** : le plan décrit **8 silos UI** ; `Up_prov2` regroupe en **2 portails principaux** (admin + compta) + dispatch/partner/franchise séparés.

---

## 3. Inventaire détaillé — Portail Admin

Référence navigation : `src/portals/admin/adminNav.ts`  
Routes : `src/app/(admin)/admin/**`

### 3.1 OPÉRATIONS

| Écran | Route | Plan / UC lié | Statut | Commentaire |
|-------|-------|---------------|--------|-------------|
| Tableau de bord | `/admin/dashboard` | UC-C01 | ⚠️ | Filtre **franchise** uniquement ; pas filtres service / zone / partenaire demandés UC-C01 |
| Carte live | `/admin/ops/map` | Supervision centrale | ✅ | Carte chauffeurs / viewport API |
| Courses | `/admin/ops/trips` | UC-T02, UC-C02 | ✅ 📋 | Liste + détail `/trips/[id]` + forensic |
| SOS Guardian | `/admin/ops/sos` | Incidents (rapport #16) | ✅ | Incidents + détail |
| **Dispatch** | `/admin/ops/dispatch` | Exploitation | ⚠️ | **Page existe, entrée sidebar commentée** |
| **Mode crise** | `/admin/ops/crisis` | Exploitation | ⚠️ | **Page existe, entrée sidebar commentée** |

### 3.2 RÉSEAU

| Écran | Route | Plan (slide 15) | Statut | Commentaire |
|-------|-------|-----------------|--------|-------------|
| Franchises | `/admin/network/franchises` | #03 | ✅ | CRUD + fiche + partenaires rattachés |
| Zones | `/admin/network/zones` | #11 | ✅ | Création, surge, carte OSM |
| Partenaires | `/admin/network/partners` | #04 | ✅ | UC-P01 validation centrale |
| Comptables | `/admin/network/accountants` | — | ✅ | Gestion comptes compta (hors plan, cohérent UC-03) |

### 3.3 FLOTTE

| Écran | Route | Plan (slide 15) | Statut | Commentaire |
|-------|-------|-----------------|--------|-------------|
| Chauffeurs | `/admin/fleet/drivers` | #05 | ✅ | Fiche détaillée, KYC, wallet |
| Véhicules | `/admin/fleet/vehicles` | — | ✅ | |
| File KYC | `/admin/fleet/kyc` | Conformité | ✅ | |
| Clients | `/admin/fleet/clients` | #07 | ✅ | Visibilité comptes clients |
| **Livreurs** | — | #06 | ❌ | **Pas d’écran dédié** ; livreurs non distingués des chauffeurs côté admin |

### 3.4 FINANCE (admin)

| Écran | Route | Plan / UC | Statut | Commentaire |
|-------|-------|-----------|--------|-------------|
| Finance générale | `/admin/finance` | #14, UC-C02 | ✅ | Hub KPI finance |
| Transactions | `/admin/finance/transactions` | #15, UC-FIN | ✅ | Détail transaction |
| Retraits | `/admin/finance/withdrawals` | — | ✅ | Validation retraits (action admin) |
| Portefeuilles | `/admin/finance/wallets` | #12 lecture seule | ⚠️ | Consultation OK ; règle « lecture seule stricte » brouillée par recharges admin |
| Ledger comptable | `/admin/finance/ledger` | Export / audit | ✅ | |
| **Recharges chauffeurs** | `/admin/finance/driver-transfers` | UC-FIN01 | ❌ | **`AdminDriverRechargeModal` — recharge depuis central** → **non conforme plan** |
| Commissions | `/admin/finance/commissions` | UC-FIN02/03 | ✅ 📋 | |
| Règles commission | `/admin/finance/commission-rules` | UC-A01b | ✅ | |
| Règles bonus | `/admin/finance/bonus-rules` | UC-A01c, UC-FR02 | ⚠️ | UI présente ; moteur bonus auto à valider API |
| Réconciliation | `/admin/finance/reconciliation` | Cohérence financière | ✅ 📋 | |

### 3.5 MARKETING

| Écran | Route | Plan | Statut |
|-------|-------|------|--------|
| Codes promo | `/admin/marketing/promos` | — | ✅ (hors plan détaillé) |
| Campagnes | `/admin/marketing/campaigns` | — | ✅ |
| Bannières | `/admin/marketing/banners` | — | ✅ |

### 3.6 SUPPORT

| Écran | Route | Plan / UC | Statut | Commentaire |
|-------|-------|-----------|--------|-------------|
| Tickets | `/admin/support/tickets` | UC-C03, UC-S01 | ✅ | |
| Chat | `/admin/support/chat` | UC-S01 | ✅ | |
| Litiges | `/admin/support/disputes/[id]` | UC-S01 | ⚠️ | Pas dans la nav ; workflow remboursement finance non guidé |
| SLA 24h / 4h / 72h | — | UC-S01 | ❌ | Non implémenté en UI |

### 3.7 PARAMÈTRES

| Écran | Route | Plan / UC | Statut | Commentaire |
|-------|-------|-----------|--------|-------------|
| **Dispatchers** | `/admin/settings/dispatchers` | Exploitation | ⚠️ | **Pages existent, nav commentée** |
| Règles dispatch | `/admin/settings/dispatch-rules` | Paramétrage | ⚠️ | Encore sur **mock legacy** ; API réelle = `dispatch-config` (voir doc backend) |
| Rôles | `/admin/settings/roles` | UC-03, #17 | ✅ | |
| Tarification | `/admin/settings/pricing` | UC-A01a | ⚠️ | UI OK ; couverture fret/location à valider |
| Plafonds finance | `/admin/settings/finance-caps` | — | ✅ (extension) |
| Intégrations | `/admin/settings/integrations` | Services externes §13.5 | ✅ | PayDunya, lien météo |
| Météo | `/admin/settings/weather` | — | ⚠️ | UI partielle vs schéma API complet |
| Audit | `/admin/settings/audit` | UC-AU01, #18 | ⚠️ | Page présente ; inviolabilité = backend |
| Général | `/admin/settings/general` | #01 | ✅ | |

### 3.8 Pages admin hors navigation (accessibles par URL)

| Route | Usage |
|-------|--------|
| `/admin/ops/dispatch` | Console dispatch |
| `/admin/ops/crisis` | Mode crise |
| `/admin/settings/dispatchers` | Comptes dispatchers |
| `/admin/support/disputes/[id]` | Détail litige |

---

## 4. Inventaire détaillé — Portail Compta

Référence navigation : `src/portals/compta/comptaNav.ts`  
Login : `/compta/login` — rôle `compta` / comptable (`ACCOUNTANT`).

### 4.1 COMPTABILITÉ

| Écran | Route | Plan / UC | Statut | Commentaire |
|-------|-------|-----------|--------|-------------|
| Tableau de bord | `/compta` | Profil Finance, UC-C02 | ✅ | KPI, périmètre pays, vigilance |
| Flux entrées / sorties | `/compta/flows` | Reporting #15 | ✅ | Agrégation par nature |
| Journal comptable | `/compta/ledger` | Export comptable | ✅ | Contre-passation (`ReverseLedgerModal`) |
| Commissions & bénéfices | `/compta/commissions` | UC-FIN03 | ✅ 📋 | Ventilation parts |
| Portefeuilles | `/compta/wallets` | #12 consultation | ✅ | Lecture |
| Réconciliation | `/compta/reconciliation` | Cohérence financière | ✅ | |
| Clôtures & périodes | `/compta/periods` | — | ✅ | Clôture période comptable (action métier) |

### 4.2 CONSULTATION

| Écran | Route | Plan | Statut | Commentaire |
|-------|-------|------|--------|-------------|
| Transactions | `/compta/transactions` | #15 | ✅ | |
| Retraits | `/compta/withdrawals` | — | ✅ | **`readOnly`** — pas d’approbation depuis compta |
| Recharges chauffeurs | `/compta/recharges` | UC-FIN01 | ✅ | Consultation historique uniquement |

### 4.3 ACTIONS

| Écran | Route | Plan | Statut | Commentaire |
|-------|-------|------|--------|-------------|
| Rapports & exports | `/compta/exports` | #15, #22 | ⚠️ | CSV local ; **Excel/PDF** demandés slide 21 pas systématiques |
| Finance opérationnelle | `/admin/finance` (lien) | — | ⚠️ | **Sort du silo compta** → mélange rôles si permissions larges |

### 4.4 Positionnement compta vs plan

Le dashboard compta indique explicitement : *« consultation et clôture comptable — sans exécution des paiements »* → **aligné** avec le rôle Finance du plan (UC-03, profil auditeur partiel).

**Écarts compta** :

- Pas de portail **conformité / auditeur** séparé (UC-AU01 reste côté admin).
- Pas de reporting **opérationnel multiservices** (courses, livraisons, fret, location).
- Workflow **réclamation → validation finance → crédit wallet** (UC-S01) non visible dans compta.
- Les **7 sous-comptes centraux** ne sont pas différenciés en UI (un login compta générique en dev).

---

## 5. Matrice — 18 fonctions Central (slide 15)

| # | Fonction plan | Admin | Compta | Note |
|---|---------------|-------|--------|------|
| 01 | Administration globale | ✅ `settings/general` | — | |
| 02 | Supervision tous services | ⚠️ trips + map | — | Fret/location/livraison peu visibles |
| 03 | Franchises | ✅ | — | |
| 04 | Partenaires | ✅ | — | |
| 05 | Chauffeurs | ✅ | — | |
| 06 | Livreurs | ❌ | — | Pas d’écran dédié |
| 07 | Clients | ✅ | — | |
| 08 | Tarifs | ✅ `settings/pricing` | — | |
| 09 | Commissions | ✅ `commission-rules` | ✅ consultation | |
| 10 | Règles bonus | ✅ `bonus-rules` | — | Moteur auto UC-FR02 à valider |
| 11 | Zones | ✅ `network/zones` | — | |
| 12 | Wallets lecture seule | ⚠️ | ✅ | **Admin peut recharger** → écart majeur |
| 13 | Réclamations | ✅ support | — | SLA absent |
| 14 | Reporting consolidé | ⚠️ dashboard | ⚠️ exports | 22 rapports non tous couverts |
| 15 | Export financier | ⚠️ | ✅ exports | Formats limités |
| 16 | Audit | ✅ `settings/audit` | — | |
| 17 | Rôles & droits | ✅ `settings/roles` | — | RBAC API partiel |
| 18 | Conformité & logs | ⚠️ | — | Rétention 12 mois = backend |

---

## 6. Matrice — 29 use cases × back-office

Légende : **Admin** · **Compta** · **—** (hors back-office web : mobile / autre portail)

| UC | Intitulé | Criticité | Admin | Compta | Écart principal |
|----|----------|-----------|-------|--------|-----------------|
| UC-01 | Création compte client | Critique | ⚠️ | — | Visibilité client OK ; création = app mobile |
| UC-02 | Reconnexion existant | Critique | ✅ | ✅ | Logins séparés admin / compta |
| UC-03 | Rôles & droits | Critique | ⚠️ | ✅ | Cloisonnement à tester ; permissions front ≠ API |
| UC-T01 | Demande course | Critique | ⚠️ | — | Suivi course OK ; création = app client |
| UC-T02 | Acceptation chauffeur | Critique | ✅ | — | Détail course + statuts |
| UC-T03 | Cycle complet course | Critique | ✅ | — | Commission visible finance |
| UC-T04 | Annulation client | Majeure | ✅ | — | |
| UC-T05 | Annulation chauffeur | Majeure | ✅ | — | |
| UC-L01–04 | Livraison | — | ⚠️ | — | Peu de spécificité livreur admin |
| UC-F01–02 | Fret | — | 🔗 | — | `PartnerFreightPage` partenaire |
| UC-LO01–02 | Location | — | ❌ | — | Pas d’UI admin location |
| UC-FIN01 | Recharge wallet | Critique | ❌ | ✅ | **Admin recharge = violation plan** |
| UC-FIN02 | Débit commission | Critique | ✅ | ✅ | |
| UC-FIN03 | Répartition parts | Critique | ✅ | ✅ | 📋 valider chiffres terrain |
| UC-FIN04 | Solde insuffisant | Critique | ⚠️ | — | Règle dispatch `minDriverWalletBalanceXof` |
| UC-P01 | Validation partenaire | Majeure | ✅ | — | |
| UC-P02 | Rattachement flotte | Critique | ✅ | — | |
| UC-FR01 | Supervision franchise | Critique | 🔗 | — | Portail `/franchise` |
| UC-FR02 | Bonus auto franchise | Critique | ⚠️ | — | `bonus-rules` ; cron à valider |
| UC-C01 | Dashboard central | Critique | ⚠️ | — | Filtres incomplets |
| UC-C02 | Reporting multiservices | Critique | ⚠️ | ⚠️ | Ventilation 4 services incomplète |
| UC-C03 | Réclamations central | Majeure | ✅ | — | |
| UC-S01 | Cycle réclamation | Majeure | ⚠️ | ⚠️ | Pas de workflow finance guidé |
| UC-A01a | Param tarifs | Critique | ✅ | — | |
| UC-A01b | Param commissions | Critique | ✅ | — | |
| UC-A01c | Gabarit bonus | Critique | ⚠️ | — | Garde-fous plages KPI à valider |
| UC-AU01 | Audit inviolable | Critique | ⚠️ | — | Export + test négatif modification logs |

---

## 7. Vingt-deux rapports consolidés (slide 21) — couverture

| # | Rapport attendu | Où aujourd’hui | Statut |
|---|-----------------|----------------|--------|
| 01 | Activité totale plateforme | `/admin/dashboard` | ⚠️ |
| 02 | Activité par service | Dashboard / finance | ⚠️ |
| 03 | Activité par zone | — | ❌ |
| 04 | Activité par franchise | Dashboard (filtre franchise) | ⚠️ |
| 05 | Activité par partenaire | Partiel réseau | ⚠️ |
| 06 | Activité par chauffeur | Fiche chauffeur | ⚠️ |
| 07 | Activité par livreur | — | ❌ |
| 08 | Recettes brutes | Finance / compta | ✅ 📋 |
| 09 | Commissions plateforme | `/admin/finance/commissions` | ✅ |
| 10 | Commissions partenaires | idem | ✅ 📋 |
| 11 | Commissions franchises | idem | ✅ 📋 |
| 12 | Wallets & soldes | wallets admin + compta | ✅ |
| 13 | Recharges wallet | driver-transfers, compta/recharges | ✅ |
| 14 | Débits | transactions / ledger | ✅ |
| 15 | Transactions | transactions | ✅ |
| 16 | Incidents | SOS admin | ✅ |
| 17 | Réclamations | support tickets | ✅ |
| 18 | Taux annulation | — | ❌ |
| 19 | Taux acceptation | — | ❌ |
| 20 | Taux finalisation | — | ❌ |
| 21 | Audit & logs | settings/audit | ⚠️ |
| 22 | Conformité + exports CSV/Excel | compta/exports | ⚠️ |

---

## 8. Multiservices — écart transversal

Le plan centre la recette sur **4 services**. Côté admin :

| Service | Attendu recette | Back-office admin |
|---------|-----------------|-------------------|
| Transport VTC | UC-T01–05 | ✅ Courses, carte, chauffeurs |
| Livraison | UC-L01–04 | ⚠️ Pas de vue livreur dédiée |
| Fret urbain | UC-F01–02 | 🔗 Portail partenaire |
| Location | UC-LO01–02 | ❌ Pas d’écran admin |

**Impact UC-C02** (reporting multiservices) : difficile à valider entièrement depuis l’admin actuel.

---

## 9. Écarts critiques (bloquants recette 21 juin)

### P0 — Conformité métier

1. **Recharge chauffeur depuis admin** (`/admin/finance/driver-transfers` + `AdminDriverRechargeModal`)  
   → Contredit **UC-FIN01** et la règle stricte slide 15.  
   **Action** : désactiver recharge côté admin OU faire valider une dérogation produit écrite.

2. **Dispatch & dispatchers masqués** dans la sidebar alors que le plan suppose une **équipe exploitation centrale** le jour J.  
   **Action** : réactiver les entrées nav ou documenter un autre accès (portail `/dispatch`).

3. **Règles dispatch sur mock** (`/admin/settings/dispatch-rules`) alors que la source de vérité API est `dispatch-config`.  
   **Action** : brancher avant test réel (cf. `BACKEND-RESPONSES-DISPATCH-METEO.md`).

### P1 — Couverture recette

4. Dashboard central : ajouter filtres **service, zone, partenaire** (UC-C01).  
5. Reporting : indicateurs **taux annulation / acceptation / finalisation** (#18–20).  
6. Support : workflow **réclamation → finance → crédit wallet** (UC-S01).  
7. Compta : exports **Excel/PDF** en plus du CSV.  
8. Séparer clairement **permissions admin finance** vs **compta lecture seule** (lien `/admin/finance` depuis compta).

### P2 — Hors jalon immédiat

9. Écran **livreurs** admin.  
10. Module **location** et **fret** côté central.  
11. Portail **reporting** et **suivi anomalies** dédiés.  
12. **7 sous-profils centraux** en UI (exploitation, conformité, direction RO).

---

## 10. Checklist rapide — jour de test (admin + compta)

### Avant le 21 juin

- [ ] Comptes : `dev.admin@…`, `comptable@…`, franchise, partenaires pilotes créés
- [ ] Décision écrite : recharge admin chauffeur OUI/NON
- [ ] Dispatch visible et testé (`/admin/ops/dispatch` ou `/dispatch`)
- [ ] `dispatch-config` branché (pas seulement mock dispatch-rules)
- [ ] Exports compta testés sur un échantillon de transactions réelles

### Scénarios admin à enchaîner

1. UC-03 : login admin → vérifier menus selon permissions  
2. UC-T02/T03 : course visible dans `/admin/ops/trips` pendant cycle mobile  
3. UC-P01 : valider partenaire depuis `/admin/network/partners`  
4. UC-A01 : modifier tarif / commission, vérifier sur nouvelle course  
5. UC-C03 / UC-S01 : ticket support → traitement → clôture  
6. UC-FIN01 **test négatif** : confirmer que central ne peut pas recharger (ou noter écart)  
7. UC-AU01 : action sensible → trace dans `/admin/settings/audit`

### Scénarios compta à enchaîner

1. Login `/compta/login` — périmètre pays affiché  
2. UC-FIN02/03 : commission course test visible dans commissions + ledger  
3. Réconciliation sans écart sur lot de test  
4. Clôture période (dry-run si possible)  
5. Export CSV depuis flows / ledger / exports  
6. Retraits en **lecture seule** (pas de bouton approbation)

---

## 11. Fichiers de référence code

| Sujet | Fichier |
|-------|---------|
| Nav admin | `src/portals/admin/adminNav.ts` |
| Nav compta | `src/portals/compta/comptaNav.ts` |
| Dashboard admin | `src/features/ops/pages/AdminDashboardPage.tsx` |
| Dashboard compta | `src/features/compta/pages/ComptaDashboardPage.tsx` |
| Recharge admin (écart) | `src/features/finance/pages/AdminDriverTransfersPage.tsx` |
| Retraits compta RO | `src/features/compta/pages/ComptaWithdrawalsPage.tsx` |
| Permissions auth | `src/features/auth/api/auth.permissions.ts` |
| Plan source | `docs/PLAN DE RECETTE ET DEPLOIEMENT.pdf` |

---

## 12. Synthèse exécutive

| Dimension | Admin | Compta |
|-----------|-------|--------|
| **Couverture globale plan** | ~70 % des fonctions Central | ~85 % du profil Finance |
| **Points forts** | Réseau, flotte, finance riche, support, paramétrage | Lecture, journal, périodes, réconciliation, exports |
| **Risque recette #1** | Recharge chauffeur central | Lien vers admin finance |
| **Risque recette #2** | Multiservices / reporting incomplet | Formats export |
| **Risque recette #3** | Dispatch masqué | Pas de workflow réclamation |

Le back-office **couvre le socle** attendu pour une recette Central + Finance, mais **plusieurs exigences formelles du plan** (règle recharge, 22 rapports, 4 services, 8 interfaces, 29 UC complets) nécessitent des **arbitrages produit** ou des **correctifs avant le 21 juin**.

---

*Document généré pour l’équipe UpJunoo Pro — à mettre à jour après chaque correction front ou décision produit sur les écarts P0.*
