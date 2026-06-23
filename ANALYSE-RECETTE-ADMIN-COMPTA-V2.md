# Analyse v2 — Back-office Admin & Compta vs Plan de recette UPJUNOO PRO

> **Date** : 23 juin 2026 (J+2 du planning — phase « Retest des corrections »)
> **Source de vérité** : `PLAN DE RECETTE ET DEPLOIEMENT.pdf` (59 slides, v1.0, jalon test réel 21 juin 2026)
> **Méthode** : audit multi-agents (11 dimensions) confronté au code réel, puis **vérification adversariale** de chaque écart (tentative de réfutation), puis contrôle de complétude.
> **Résultat brut** : 98 écarts examinés → **97 confirmés**, 1 réfuté, + 8 ajouts de complétude.

Cette v2 remplace `ANALYSE-PLAN-RECETTE-ADMIN-COMPTA.md` (basée sur un OCR dégradé). Chaque écart est vérifié dans le code avec preuve `fichier:ligne`.

---

## 0. Synthèse exécutive

| Sévérité | Nb | Signification |
|----------|----|----------------|
| **P0** | 25 | Bloquant recette / non-conformité métier stricte → à corriger avant Go production |
| **P1** | 40 | Couverture recette importante |
| **P2** | 32 | Hors jalon immédiat / cosmétique / défense en profondeur |

**Les 25 P0 se regroupent en 8 causes racines :**

1. **Recharge centrale active** (admin + compta) — viole la règle stricte slide 15 / UC-FIN01 *(6 P0)*
2. **RBAC factice** — permissions codées en dur par portail, rôle serveur ignoré *(4 P0)*
3. **Paramétrage tarifs/bonus non conforme** — pas de versioning, 2/4 services, gabarit KPI & moteur bonus absents *(6 P0)*
4. **Reporting non ventilé par service** — UC-C01/UC-C02 *(2 P0)*
5. **Journal d'audit accès non cloisonné** — UC-AU01 *(1 P0)*
6. **Réclamation → validation finance → crédit wallet absent** — UC-S01 *(2 P0)*
7. **Écran livreur dédié absent** — fonction Central #06 *(1 P0)*
8. **Exports serveur tronqués à la page courante** — #22 *(1 P0)*

> ⚠️ Aggravant transverse : **aucun harnais de test n'existe** dans le projet (`package.json` sans script `test`, 0 fichier `.spec/.test`). Le « test négatif obligatoire » UC-FIN01 ne peut pas être verrouillé.

---

## 1. Écarts P0 — bloquants (par cause racine)

### P0-A · Recharge des wallets chauffeurs depuis le central (règle stricte slide 15 / UC-FIN01)

> *Le central NE recharge PAS les wallets des chauffeurs ni des livreurs. Supervision financière en lecture seule. Aucune action de recharge ne doit être disponible depuis l'interface centrale. **Test négatif obligatoire.***

La chaîne d'écriture est **complète et live** (pas un mock) : bouton → modal → mutation → `POST /v1/partners/{id}/wallet/driver-recharge`.

| # | Écart | Portail | Preuve |
|---|-------|---------|--------|
| A1 | Bouton « Nouvelle recharge » + `AdminDriverRechargeModal` exécutent un transfert réel | admin | [AdminDriverTransfersPage.tsx:155](src/features/finance/pages/AdminDriverTransfersPage.tsx#L155), [AdminDriverRechargeModal.tsx:118](src/features/finance/components/AdminDriverRechargeModal.tsx#L118), [driverRecharge.v1.service.ts:51](src/features/finance/api/driverRecharge.v1.service.ts#L51) |
| A2 | Pipeline service+mutation+endpoint câblé côté admin | admin | [driverTransfers.queries.ts:24](src/features/finance/api/driverTransfers.queries.ts#L24), [adminDriverRecharge.service.ts:41](src/features/finance/api/adminDriverRecharge.service.ts#L41) |
| A3 | Lien « Recharger un chauffeur » sur la fiche chauffeur | admin | [DriverDetailPage.tsx:452](src/features/fleet/pages/DriverDetailPage.tsx#L452) |
| A4 | `ComptaWithdrawalsPage` ré-exporte la page admin avec **Approuver/Rejeter actifs** (exécution de versement) | compta | [ComptaWithdrawalsPage.tsx:5](src/features/compta/pages/ComptaWithdrawalsPage.tsx#L5), [WithdrawalsListPage.tsx:150](src/features/finance/pages/WithdrawalsListPage.tsx#L150) |
| A5 | `ComptaRechargesPage` ré-exporte la page admin → bouton recharge exécutable depuis compta | compta | [ComptaRechargesPage.tsx:5](src/features/compta/pages/ComptaRechargesPage.tsx#L5) |
| A6 | Le rôle compta possède `finance.withdrawals.approve` (droit d'exécuter le versement) | compta | [auth.permissions.ts:37](src/features/auth/api/auth.permissions.ts#L37) |
| A7 | Aucun test négatif (et aucun harnais de test) | transverse | `package.json` sans script `test` ; 0 `*.spec/*.test` |
| A8 | Raccourcis vers l'écran recharge persistent (quick links, assistant, nav) | admin | [FinanceQuickLinks.tsx:13](src/features/finance/components/FinanceQuickLinks.tsx#L13), [adminNav.ts:151](src/portals/admin/adminNav.ts#L151) |

**Correctif** : supprimer du back-office (admin **et** compta) tout chemin d'écriture wallet (bouton, modal, mutation, raccourcis) ; ne laisser que des vues consultation lecture seule ; retirer `finance.withdrawals.approve` de `COMPTA_PORTAL_PERMISSIONS` ; rendre `ComptaWithdrawalsPage` réellement read-only ; ajouter un test négatif après mise en place d'un runner.

### P0-B · RBAC factice — gouvernance des droits non fonctionnelle (fonction #17, slide 26)

| # | Écart | Preuve |
|---|-------|--------|
| B1 | Permissions déterminées par le **portail** (`defaultPermissions(portal)`), pas par le rôle serveur. `data.role`/`data.permissions` renvoyés par l'API sont **ignorés** | [auth.mapper.ts:205](src/features/auth/api/auth.mapper.ts#L205), [auth.types.ts:44](src/features/auth/api/auth.types.ts#L44) |
| B2 | Édition des permissions d'un rôle **non persistée** en mode réel (v1) : le PATCH n'envoie que `{label, description}`, `permission_groups` est droppé → faux succès UI | [roles.service.ts:92](src/features/settings/api/roles.service.ts#L92), [RoleDetailPage.tsx:89](src/features/settings/pages/RoleDetailPage.tsx#L89) |
| B3 | Les **7 sous-profils centraux** (super-admin, exploitation, finance, support, conformité, reporting, direction RO) ne sont pas différenciés : tout admin reçoit le set complet | [auth.mapper.ts:37](src/features/auth/api/auth.mapper.ts#L37), [auth.permissions.ts:2](src/features/auth/api/auth.permissions.ts#L2) |
| B4 | Le champ `permissions[]` de l'API jamais lu (set statique mock) | [authStore.ts:39](src/core/auth/authStore.ts#L39) |

**Correctif** : alimenter `user.permissions` depuis `data.permissions`/`data.role` au login, avec `defaultPermissions(portal)` en simple fallback ; introduire un profil « direction » lecture seule ; consommer `permission_groups` dans le mapper et le PATCH.

### P0-C · Paramétrage tarifs / commissions / bonus (UC-A01, UC-FR02 — slides 42 & 44)

| # | Écart | Preuve |
|---|-------|--------|
| C1 | **Tarifs sans versioning ni date d'application** : édition en place (PATCH) qui écrase la grille, anciens tarifs non conservés. `effective_from/to` exposés par l'API mais jamais alimentés | [adminPricing.mapper.ts:182](src/features/settings/api/adminPricing.mapper.ts#L182), [pricing.service.ts:191](src/features/settings/api/pricing.service.ts#L191) |
| C2 | **Tarification = 2/4 services** : seuls VTC + livraison ; Fret et Location absents du select et du mapper | [PricingForm.tsx:186](src/features/settings/components/PricingForm.tsx#L186), [adminPricing.mapper.ts:23](src/features/settings/api/adminPricing.mapper.ts#L23) |
| C3 | **Gabarit KPI bonus à plages absent** : les règles ne gèrent qu'un seul KPI (nb courses → palier), aucune note/acceptation/annulation ni borne min-max | [bonusRules.types.ts:4](src/features/finance/api/bonusRules.types.ts#L4), [BonusRuleForm.tsx:331](src/features/finance/components/BonusRuleForm.tsx#L331) |
| C4 | **Garde-fou central des plages absent** : une franchise peut fixer n'importe quelle valeur, aucune validation de bornage | [bonusRules.form.ts:63](src/features/finance/api/bonusRules.form.ts#L63) |
| C5 | **Moteur de bonus auto (cron) non branché** : `POST /v1/admin/bonus/run-evaluation` existe côté API mais n'est câblé nulle part ; aucun déclencheur/supervision côté admin | [bonusRules.service.ts:29](src/features/finance/api/bonusRules.service.ts#L29) |
| C6 | **Rapport bonus + éligibles/non-éligibles + crédit wallet absent** : `GET /v1/admin/bonus-awards` déclaré mais jamais consommé | [links.ts:303](src/core/api/links.ts#L303) |

**Note conformité (P1 associé)** : le garde-fou commissions n'est pas un plafond « cumul ≤ 100 % » mais une **égalité forcée à 15 %** excluant la part chauffeur ([commissionRateCoupling.ts:56](src/shared/lib/commissionRateCoupling.ts#L56)) → à clarifier avec le plan (UC-A01b).

### P0-D · Reporting non ventilé par service (UC-C01 / UC-C02 — slide 41 / slide 8)

| # | Écart | Preuve |
|---|-------|--------|
| D1 | **Aucun filtre SERVICE** sur le dashboard central (seul franchise) | [AdminDashboardPage.tsx:50](src/features/ops/pages/AdminDashboardPage.tsx#L50), [dashboard.service.ts:31](src/features/ops/api/dashboard.service.ts#L31) |
| D2 | **Aucune ventilation par service** dans finance/reporting/compta (GMV, commissions, flux, transactions consolidés toutes prestations) | [index.ts:1118](src/shared/types/index.ts#L1118), [TransactionsListPage.tsx:33](src/features/finance/pages/TransactionsListPage.tsx#L33) |

**Correctif** : ajouter une dimension `by_service[]` aux agrégats dashboard/finance + filtres/colonnes service.

### P0-E · Journal d'audit — accès non cloisonné (UC-AU01 — slide 45)

| # | Écart | Preuve |
|---|-------|--------|
| E1 | La route `/admin/settings/audit` n'a **aucune garde de permission** : tout compte du portail admin y accède par URL. `PermissionGuard` existe mais n'est branché nulle part | [SettingsAuditPage.tsx:15](src/features/settings/pages/SettingsAuditPage.tsx#L15), [PermissionGuard.tsx:12](src/core/auth/PermissionGuard.tsx#L12) |

### P0-F · Réclamation → finance → crédit wallet (UC-S01 / UC-C03 — slides 41 & 43)

| # | Écart | Preuve |
|---|-------|--------|
| F1 | **Aucune validation FINANCE ni crédit wallet** dans la résolution de litige : l'agent support saisit un remboursement et déclenche un POST direct, sans étape d'approbation finance ni matérialisation du crédit | [SupportDisputeDetailPage.tsx:54](src/features/support/pages/SupportDisputeDetailPage.tsx#L54), [disputes.service.ts:34](src/features/support/api/disputes.service.ts#L34) |
| F2 | **Litiges/remboursements totalement absents du portail compta** (aucune file de validation, aucune traçabilité crédit wallet) | [comptaNav.ts:3](src/portals/compta/comptaNav.ts#L3) |

### P0-G · Écran livreur dédié (fonction Central #06 — slide 15 / profil slide 19)

| # | Écart | Preuve |
|---|-------|--------|
| G1 | **Aucune route/page/nav/role « livreur »** : les livreurs sont confondus avec les chauffeurs. `delivery` n'existe que comme type de course/véhicule, jamais comme opérateur supervisable. Profil 7 indicateurs livreur absent | [adminNav.ts:88](src/portals/admin/adminNav.ts#L88), [index.ts:3](src/shared/types/index.ts#L3) |

### P0-H · Exports serveur tronqués (#22 — slide 21)

| # | Écart | Preuve |
|---|-------|--------|
| H1 | L'export CSV/Excel n'exporte que **la page courante** (pagination serveur) : audit, ledger, transactions… → l'utilisateur croit exporter l'intégralité mais n'obtient que ~20-50 lignes. Trompeur pour un export de conformité | [DataTable.tsx:201](src/shared/ui/DataTable.tsx#L201), [SettingsAuditPage.tsx:79](src/features/settings/pages/SettingsAuditPage.tsx#L79) |

---

## 2. Écarts P1 — couverture recette (40)

### Admin — fonctions Central

| Réf | Écart | Statut | Preuve |
|-----|-------|--------|--------|
| #02 Supervision services | KPIs non ventilés par service | partial | [dashboard.api.types.ts:55](src/features/ops/api/dashboard.api.types.ts#L55) |
| #03 Franchises | Pas d'action suspendre/réactiver une franchise | partial | [FranchiseDetailPage.tsx:145](src/features/network/pages/FranchiseDetailPage.tsx#L145) |
| #05/#06 Flotte | Liste flotte sans filtre/colonne service (impossible d'isoler livreurs) | partial | [DriversListPage.tsx:38](src/features/fleet/pages/DriversListPage.tsx#L38) |
| #08 Tarifs | Couverture fret/location (cf. P0-C2) | — | — |
| #11 Zones | Création zone + édition polygone désactivées hors mode legacy (lecture seule en v1) | partial | [v1AdminMode.ts:4](src/core/api/v1AdminMode.ts#L4), [ZonesListPage.tsx:119](src/features/network/pages/ZonesListPage.tsx#L119) |
| #13 Réclamations | Tickets admin en lecture seule : pas de détail/réponse/changement statut/assignation | partial | [tickets.service.ts:25](src/features/support/api/tickets.service.ts#L25) |
| #15 Export financier | Ledger = simple alias de la liste transactions (pas de débit/crédit/solde, export = page courante) | partial | [LedgerListPage.tsx:6](src/features/finance/pages/LedgerListPage.tsx#L6) |
| #16 Audit | Pas d'IP, pas de diff avant/après, pas de hash d'intégrité | partial | [settingsExtended.service.ts:23](src/features/settings/api/settingsExtended.service.ts#L23) |
| #16 Audit | Filtres absents (type d'action/profil/période/IP), recherche texte seule | partial | [SettingsAuditPage.tsx:16](src/features/settings/pages/SettingsAuditPage.tsx#L16) |
| #16 Audit | Export PDF absent ; export limité à la page courante | partial | [DataTable.tsx:228](src/shared/ui/DataTable.tsx#L228) |
| #16 Audit | Couverture des événements journalisés non vérifiable (mock partiel, aucune écriture front) | partial | [settings.handlers.ts:464](src/mocks/handlers/settings.handlers.ts#L464) |
| #17 Rôles | Détail de rôle vide en v1 (matrice de droits non peuplée) | partial | [adminRoles.mapper.ts:33](src/features/settings/api/adminRoles.mapper.ts#L33) |
| #18 Conformité & logs | Aucune surface dédiée (le seul « log » = audit, la seule « conformité » = KYC chauffeur) | absent | [adminNav.ts:222](src/portals/admin/adminNav.ts#L222) |
| RBAC enforcement | Aucune garde de permission par route ; middleware = cookie booléen | partial | [middleware.ts:40](src/middleware.ts#L40) |
| Recharge découvrabilité | Raccourcis recharge centrale persistent | non_conforme | (cf. A8) |

### Paramétrage / RBAC

| Réf | Écart | Statut | Preuve |
|-----|-------|--------|--------|
| UC-A01b | Garde-fou cumul = égalité 15 % (pas ≤ 100 %), part chauffeur exclue, % plateforme non saisissable | non_conforme | [commissionRateCoupling.ts:56](src/shared/lib/commissionRateCoupling.ts#L56) |
| UC-03 paramétrage | Entrées Dispatchers/Intégrations/Météo commentées ; Audit/Général gardés par `settings.dispatchers.view` (permission erronée) | partial | [adminNav.ts:225](src/portals/admin/adminNav.ts#L225) |
| Slide 26 | Comptes Conformité/Auditeur & Direction RO absents du provisioning | absent | [adminStaff.config.ts](src/features/network/api/adminStaff.config.ts) |

### Compta

| Réf | Écart | Statut | Preuve |
|-----|-------|--------|--------|
| UC-03 compta | Lien « Finance opérationnelle » → `/admin/finance` (pont compta→admin pour un admin connecté) | partial | [comptaNav.ts:83](src/portals/compta/comptaNav.ts#L83) |

### Audit

| Réf | Écart | Statut |
|-----|-------|--------|
| UC-AU01 | Profil AUDITEUR lecture seule inexistant | absent |

### Support

| Réf | Écart | Statut | Preuve |
|-----|-------|--------|--------|
| UC-S01 | SLA (24h/4h/72h/5j) ni calculés ni affichés ni suivis | absent | [tickets.service.ts:12](src/features/support/api/tickets.service.ts#L12) |
| UC-S01 | Catégories de réclamation non structurées (string libre, pas d'enum, pas de filtre) | partial | [tickets.service.ts:15](src/features/support/api/tickets.service.ts#L15) |
| UC-S01 | Pas de fiche ticket : ni assignation, ni transition « En cours », ni chat/mail rattaché | absent | [SupportTicketsListPage.tsx:125](src/features/support/pages/SupportTicketsListPage.tsx#L125) |
| UC-S01 | Litiges hors navigation (accès URL ou lien conditionnel) | partial | [adminNav.ts:206](src/portals/admin/adminNav.ts#L206) |

### Interfaces / Reporting / Multiservices

| Réf | Écart | Statut | Preuve |
|-----|-------|--------|--------|
| Interface 08 | Registre d'anomalies recette/production absent du portail admin | absent | [SupportAnomaliesPage.tsx:8](src/features/support/pages/SupportAnomaliesPage.tsx#L8) |
| Interface 06 | Reporting non accessible/supervisé depuis l'admin (portail séparé) | partial | [adminNav.ts:81](src/portals/admin/adminNav.ts#L81) |
| Reporting #06/22 | Portail reporting = façade de 4 liens vers `/admin/*`, titre « 22 rapports » trompeur | non_conforme | [ReportingDashboardPage.tsx:27](src/features/reporting/pages/ReportingDashboardPage.tsx#L27) |
| UC-C01 | Filtre ZONE absent du dashboard central | absent | [AdminDashboardPage.tsx:50](src/features/ops/pages/AdminDashboardPage.tsx#L50) |
| UC-C01 | Filtre PARTENAIRE absent du dashboard central | absent | [dashboard.queries.ts:9](src/features/ops/api/dashboard.queries.ts#L9) |
| UC-C02 | « Activité consolidée » annonce 4 services mais affiche des KPIs 100 % agrégés | non_conforme | [ReportingActivityPage.tsx:42](src/features/reporting/pages/ReportingActivityPage.tsx#L42) |
| UC-C02 | Exports reporting/compta sans dimension service | partial | [ReportingExportsPage.tsx:80](src/features/reporting/pages/ReportingExportsPage.tsx#L80) |
| Service FRET | Aucune UI admin dédiée + détails cargo non affichés sur la fiche course | partial | [TripDetailPage.tsx:1](src/features/ops/pages/TripDetailPage.tsx#L1) |
| Service LOCATION | Aucune UI admin (réservations/contrats) | absent | [adminNav.ts:5](src/portals/admin/adminNav.ts#L5) |
| Rapport #16 Incidents | Pas de rapport consolidé dans reporting (existe en SOS ops, cf. réfuté) | absent | [ReportingExportsPage.tsx](src/features/reporting/pages/ReportingExportsPage.tsx) |
| Rapports #01-#11, #18-#21 | Majorité des 22 rapports absents/partiels (voir §5) | — | — |

---

## 3. Écarts P2 — hors jalon immédiat (32, extraits)

- **Compta exports PDF** : CSV + Excel OK (via tables), **PDF manquant** (slide 40) → [ComptaExportsPage.tsx](src/features/compta/pages/ComptaExportsPage.tsx) *(sévérité abaissée après vérif : Excel existe bien)*.
- **#12 permission Portefeuilles** : gardé par `finance.transactions.view` au lieu de `finance.wallets.view` → [adminNav.ts:142](src/portals/admin/adminNav.ts#L142).
- **#09/#10 permission** : commission-rules/bonus-rules gardés par `finance.transactions.view` (pas de permission de config dédiée).
- **#04 Partenaires** : pas de file de validation centralisée (symétrie KYC manquante).
- **#01 Administration globale** : pas de gestion centralisée des comptes admins.
- **#17 création rôle** : pas de sélection de permissions à la création.
- **UC-03 exploitation** : Dispatch/Mode crise commentés dans la nav admin (doublons orphelins ; Mode crise dans aucune nav).
- **Cloisonnement compta** : breadcrumbs « Admin/Finance » et liens cross-portail dans les pages réutilisées.
- **UC-FIN02** : répartition transaction omet part franchise + fiscalité ; commissions compta sans ventilation 4 voies.
- **UC-C01 export**, **UC-AU01 rétention 12 mois (indication UI)**, **#22 conformité globale**, **rapport incidents exports**, **résolution litige (motif rejet, horodatage, notif émetteur)**, **livraison admin (vue dédiée)**.

---

## 4. Matrice — 18 fonctions Central (slide 15)

| # | Fonction | Statut | Sévérité |
|---|----------|--------|----------|
| 01 | Administration globale | partiel (pas de gestion comptes admin) | P2 |
| 02 | Supervision tous services | partiel (pas de ventilation service) | P1 |
| 03 | Gestion franchises | partiel (pas suspend/réactiver) | P1 |
| 04 | Gestion partenaires | partiel (pas de file validation) | P2 |
| 05 | Gestion chauffeurs | OK (filtre service manquant) | P1 |
| 06 | **Gestion livreurs** | **absent** | **P0** |
| 07 | Gestion clients | OK | — |
| 08 | **Paramétrage tarifs** | **non conforme** (pas versioning, 2/4 services) | **P0** |
| 09 | Paramétrage commissions | non conforme (garde-fou cumul) | P1 |
| 10 | **Paramétrage règles bonus** | **absent** (gabarit KPI, garde-fou, moteur) | **P0** |
| 11 | Paramétrage zones | partiel (édition hors legacy désactivée) | P1 |
| 12 | **Supervision wallets (lecture seule)** | **non conforme** (recharge active) | **P0** |
| 13 | Gestion réclamations | partiel (tickets lecture seule) | P1 |
| 14 | Reporting consolidé | partiel (hors admin) | P2 |
| 15 | Export financier | partiel (ledger alias, export tronqué) | P1 |
| 16 | Audit des opérations | partiel + **accès non protégé** | **P0** / P1 |
| 17 | **Gestion droits & rôles** | **non conforme** (RBAC factice + non persisté) | **P0** |
| 18 | Conformité & logs | absent | P1 |

---

## 5. Matrice — 22 rapports consolidés (slide 21)

| # | Rapport | Statut | Sév. |
|---|---------|--------|------|
| 01 | Activité totale plateforme | partial | P1 |
| 02 | Activité par service | **absent** | P1 |
| 03 | Activité par zone | partial | P1 |
| 04 | Activité par franchise | partial | P1 |
| 05 | Activité par partenaire | **absent** | P1 |
| 06 | Activité par chauffeur | **absent** | P1 |
| 07 | Activité par livreur | **absent** | P1 |
| 08 | Recettes brutes | partial | P2 |
| 09 | Commissions plateforme | partial | P1 |
| 10 | Commissions partenaires | **absent** | P1 |
| 11 | Commissions franchises | partial | P2 |
| 12 | Wallets & soldes | partial | P2 |
| 13 | Recharges wallet | partial | P2 |
| 14 | Débits | partial | P2 |
| 15 | Transactions | partial | P2 |
| 16 | Incidents | existe en SOS ops (export consolidé OK) ; **absent du reporting** | P1 |
| 17 | Réclamations | partial | P2 |
| 18 | **Taux d'annulation** | **absent** | P1 |
| 19 | **Taux d'acceptation** | **absent** | P1 |
| 20 | **Taux de finalisation** | **absent** | P1 |
| 21 | Audit & logs | partial | P1 |
| 22 | Conformité + exports CSV/Excel | non conforme ; **exports serveur tronqués** | **P0** / P1 |

---

## 6. Écart réfuté (transparence)

- **Rapport #16 Incidents — « aucun rapport exportable »** : **RÉFUTÉ**. La page SOS ([SosIncidentsListView.tsx:200](src/features/safety/components/SosIncidentsListView.tsx#L200)) fournit un tableau consolidé des incidents avec export CSV **et** Excel actifs et filtres statut/sévérité. Réserve mineure (P2) : l'export ne porte que sur la page courante. *(Le manque réel = pas de rapport incidents dans le module reporting, traité en P1 §5.)*

---

## 7. Plan d'action priorisé (côté front)

**Sprint conformité (P0 — avant Go production)**
1. Neutraliser toute recharge/exécution wallet en admin & compta + retirer `finance.withdrawals.approve` du compta + rendre Retraits/Recharges compta read-only (A1–A8).
2. Brancher le RBAC sur l'API (`data.permissions`/`data.role`) + persister `permission_groups` (B1–B4).
3. Tarifs : versioning + date d'application + couverture 4 services (C1–C2).
4. Bonus : gabarit KPI à plages + garde-fou central + brancher run-evaluation + page bonus-awards (C3–C6).
5. Dashboard/finance : filtre + ventilation par service (D1–D2).
6. Protéger la route audit par `PermissionGuard` (E1).
7. Workflow réclamation → validation finance → crédit wallet + file compta (F1–F2).
8. Écran livreur dédié (G1).
9. Exports serveur complets (par période/filtre) au lieu de la page courante (H1).
10. Mettre en place un runner de tests + test négatif UC-FIN01 (A7).

**Sprint couverture (P1)** : voir §2 — supervision par service, tickets éditables, SLA, filtres dashboard zone/partenaire, audit (IP/diff/filtres/PDF), conformité & logs, rapports de taux #18-20, registre anomalies, reporting consolidé dans l'admin.

**Backlog (P2)** : voir §3.

---

*Document généré le 23 juin 2026 par audit multi-agents vérifié. À mettre à jour après chaque correctif P0.*
