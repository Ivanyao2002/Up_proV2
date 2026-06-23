# Module Finance UpJunoo Pro — contexte complet

> **Document de référence** pour l’équipe front, produit et backend.  
> **Projet** : UpJunoo Pro — back-office (`Up_prov2`)  
> **Dernière mise à jour** : 2 juin 2026  
> **Sources métier** :
> - `docs/CAHIER DES CHARGES TECHNIQUE  MODULE FINANCE.docx`
> - `docs/DOC  FINANCE SYNTHESE.pdf` (export PDF du même cahier, 72 pages)

---

## 1. Objet de ce document

Ce fichier consolide **tout ce qui a été compris et analysé** sur le module Finance :

1. Le **modèle économique** décrit dans le cahier des charges.
2. Les **règles de calcul** (commission, Charges & R&D, routage des flux).
3. Ce qui est **déjà implémenté** dans Up_prov2 (pages, APIs, mocks).
4. Ce qui **manque** ou n’est que partiellement couvert.
5. Les **priorités** discutées pour la suite (front vs backend).

Il sert de contexte unique avant d’écrire des specs, des demandes backend ou d’implémenter des écrans.

---

## 2. Périmètre du module Finance (cahier des charges)

Le cahier décrit un module **multi-pays, multi-franchises, multi-partenaires, multi-services** couvrant :

| Domaine | Contenu |
|---------|---------|
| Wallets | Chauffeur, partenaire, bonus, client promo, client électronique (futur) |
| Rechargements | Mobile Money, carte bancaire, recharge partenaire, manuel |
| Commissions | Moteur de calcul, débit wallet, répartition multi-acteurs |
| Trésorerie | Compte local franchise, encaissements MM, reversements |
| Comptabilité | Ledger, écritures, clôtures, extournes |
| Consolidation | Centrale UPJUNOO, sous-comptes Canada par pays |
| Reporting | Dashboards par profil (Direction, franchise, trésorerie, compta…) |
| Contrôle | Audit, réconciliation, statuts financiers, incidents |

**Services concernés** : Taxi/VTC, livraison, location, fret urbain, services pro et extensions futures.

**Destinataires du cahier** : Direction, Finance, Développement, Produit, Exploitation, Trésorerie, Comptabilité, Franchises, Partenaires, Audit.

---

## 3. Modèle économique central : prépayé + cash terrain

### 3.1 Principe fondamental

UPJUNOO PRO fonctionne en **modèle prépayé de service** combiné au **paiement cash direct au chauffeur** :

```
Client paie en cash → Chauffeur reçoit 100 % du cash
                              ↓
         UPJUNOO ne collecte PAS le cash de la course
                              ↓
    Commission débitée du wallet PRÉPAYÉ du chauffeur
                              ↓
    Répartition interne (fiscalité, franchise, partenaire, Centrale, R&D)
         UNIQUEMENT si le débit wallet a réussi
```

### 3.2 Trois notions à ne jamais confondre

Le cahier impose un affichage **séparé** partout (écrans, rapports, dashboards) :

| Notion | Définition | Exemple (course 10 000 FCFA) |
|--------|------------|------------------------------|
| **Recette chauffeur** | Cash reçu du client pour la course | Chauffeur reçoit 10 000 FCFA |
| **Recharge wallet** | Prépaiement pour couvrir les futures commissions | Chauffeur recharge 5 000 FCFA |
| **Commission UPJUNOO** | Montant calculé sur la course, débité du wallet | 15 % = 1 500 FCFA débités du wallet |

### 3.3 Règle de contrôle wallet

Avant toute répartition de commission :

```
Commission à prélever = Montant brut course × Taux commission

Condition : Solde wallet avant ≥ Commission à prélever
```

- **Si OK** → débit wallet → écriture ledger → répartition.
- **Si KO** → incident financier, blocage/limitation chauffeur, recharge obligatoire, **pas de répartition validée**.

Statuts recommandés côté moteur :
- `COMMISSION_DEBITED` (succès)
- `INSUFFICIENT_WALLET`, `COMMISSION_PENDING`, `COMMISSION_FAILED`, `DISPUTED` (incidents)

### 3.4 Indicateurs obligatoires à l’affichage (cahier §21)

| Indicateur | Définition |
|------------|------------|
| Montant brut de la course | Total payé par le client |
| Cash reçu par le chauffeur | Montant physique reçu |
| Recharge wallet | Prépaiement d’accès au service |
| Solde wallet avant commission | Disponible avant débit |
| Commission à prélever | Calculée sur la course |
| Solde wallet après commission | Reste après débit |
| Impact économique net chauffeur | Cash reçu − commission consommée sur wallet |
| Commission reconnue UPJUNOO | Rattachée à une course + débit réussi |
| Encaissement MM | Recharge/paiement sur compte local franchise |
| Encaissement carte | Paiement sur sous-compte Canada du pays |

---

## 4. Modèle de commission

### 4.1 Taux de référence (15 % de la recette brute)

| Acteur | Taux sur recette brute | Rôle |
|--------|------------------------|------|
| Fiscalité / obligations locales | 2,3 % | Taxes, conformité |
| Franchise locale | 3,0 % | Exploitation territoriale |
| Partenaire opérationnel | 4,0 % | Flottes, partenaires terrain |
| Centrale UPJUNOO | 5,7 % | Technologie, marque, support |
| **Total commission** | **15,0 %** | Commission globale |

Formule : `Commission totale = Montant brut course × 15 %`

### 4.2 Contribution Charges & R&D (40 %)

Sur **chaque part théorique** de chaque acteur, une contribution de **40 %** alimente le pot **Charges & R&D** (technologie, hébergement, maintenance, support, développement, R&D, exploitation système).

```
Charges & R&D acteur = Part théorique × 40 %
Net distribuable acteur = Part théorique × 60 %
```

**Ce n’est pas** 40 % en moins sur toute la course, mais 40 % prélevés **sur la part de chaque acteur**.

#### Exemple chiffré — course 35 000 FCFA

Commission totale : **5 250 FCFA** (15 %)

**Étape 1 — Parts théoriques**

| Acteur | Taux | Part théorique |
|--------|------|----------------|
| Fiscalité | 2,3 % | 805 FCFA |
| Franchise | 3,0 % | 1 050 FCFA |
| Partenaire | 4,0 % | 1 400 FCFA |
| Centrale | 5,7 % | 1 995 FCFA |

**Étape 2 — Application Charges & R&D**

| Acteur | Théorique | Charges & R&D (40 %) | Net reçu (60 %) |
|--------|-----------|----------------------|-----------------|
| Fiscalité | 805 | 322 | 483 |
| Franchise | 1 050 | 420 | 630 |
| Partenaire | 1 400 | 560 | 840 |
| Centrale | 1 995 | 798 | 1 197 |
| **Total** | **5 250** | **2 100** | **3 150** |

Le chauffeur paie toujours **5 250 FCFA** complets ; la contribution 40/60 concerne la **ventilation interne** après collecte.

### 4.3 Conditions de répartition (cahier §41)

La répartition n’est exécutée que si **toutes** ces conditions sont remplies :

- course validée ;
- montant brut connu ;
- chauffeur, franchise, partenaire identifiés ;
- règle de commission active trouvée ;
- wallet disponible et solde suffisant ;
- **débit wallet réussi** ;
- écriture ledger générée.

---

## 5. Wallets, comptes et routage des flux

### 5.1 Types de wallets (cahier §5)

| Code | Nom | Rôle |
|------|-----|------|
| **WS-CH** | Wallet Service Chauffeur | Prépayé — commissions débitées ici |
| **WS-PA** | Wallet Service Partenaire | Recharge flotte, reversements |
| **WB-CH** | Wallet Bonus Chauffeur | Bonus séparés des commissions |
| **WC-PROMO** | Wallet Client Promotionnel | Crédits promo (phase actuelle) |
| **WC-EL** | Wallet Client Électronique | Recharge client (phase future) |

Wallets internes de traçabilité : WL-BONUS, WL-FEES, WL-RESERVE, WL-SUSPENSE, WL-REFUND, etc.

### 5.2 Comptes financiers

| Compte | Reçoit | Ne reçoit pas |
|--------|--------|---------------|
| **Compte local franchise** | Mobile Money (recharges) | Paiements carte |
| **Sous-compte Canada / pays** | Paiements carte du pays | Mobile Money |

### 5.3 Tableau de routage (cahier §36)

| Type de flux | Source | Destination | Responsable |
|--------------|--------|-------------|-------------|
| Paiement cash course | Client | Chauffeur | Hors UPJUNOO |
| Commission course cash | Wallet chauffeur | Ledger UPJUNOO | Automatique |
| Recharge MM chauffeur/partenaire | Opérateur MM | Compte local franchise | Trésorerie franchise |
| Paiement carte | Utilisateur | Sous-compte Canada pays | Centrale |
| Reversement partenaire | Compte local | Partenaire | Franchise |

### 5.4 Canaux de recharge wallet chauffeur

- Mobile Money → compte local franchise
- Carte bancaire → sous-compte Canada dédié au pays
- Recharge partenaire (MM ou carte selon canal)
- Opération manuelle validée
- Autres canaux futurs

---

## 6. Acteurs et interfaces (cahier §2 et §10)

### 6.1 Acteurs

| Acteur | Rôle finance |
|--------|--------------|
| **Client** | Paie cash (actuel) ; wallet promo ; paiement digital (futur) |
| **Chauffeur** | Reçoit cash, recharge wallet, paie commissions via wallet |
| **Partenaire** | Recharge flotte, suit commissions, demande reversement |
| **Franchise** | Trésorerie locale, comptabilité locale, reversements |
| **Centrale UPJUNOO** | Consolidation multi-pays, cartes, audit groupe |
| **Trésorerie franchise** | Encaissements/décaissements réels (MM, pas carte) |
| **Comptabilité franchise** | Ledger, clôtures, exports (ne paie pas) |
| **Admin Finance** | Paramétrage taux, seuils, règles, simulation |
| **Support** | Consultation transactions (ne modifie pas les règles commission) |

### 6.2 Séparation Trésorerie / Comptabilité (cahier §101)

- **Trésorerie** : exécute les mouvements financiers (encaissements, décaissements, preuves, soldes).
- **Comptabilité** : constate, classe, rapproche, verrouille les écritures.
- **Règle clé** : la trésorerie ne gère pas les encaissements carte (Centrale via Canada).

---

## 7. Workflows principaux (cahier §8 — 15 use cases)

| # | Use case | Résumé |
|---|----------|--------|
| 1 | Recharge wallet chauffeur MM | Callback opérateur, idempotence, crédit WS-CH, ledger |
| 2 | Recharge wallet partenaire MM | Idem + recharges groupées (mère/filles) |
| 3 | Paiement/recharge carte | Passerelle → sous-compte Canada |
| 4 | Contrôle accès chauffeur | Vérification solde wallet |
| 5 | Course cash + débit commission | Calcul → contrôle wallet → débit → ledger → répartition |
| 6 | Paiement digital client | Futur |
| 7 | Bonus chauffeur | Crédit WB-CH |
| 8 | Wallet client promotionnel | Crédits promo |
| 9 | Retrait chauffeur | Sortie wallet chauffeur |
| 10 | Reversement partenaire | Décaissement depuis compte local |
| 11 | Reversement part Centrale | Part Centrale due |
| 12 | Réconciliation locale MM | Rapprochement opérateur vs ledger |
| 13 | Réconciliation Centrale carte | Rapprochement passerelle vs Canada |
| 14 | Remboursement | Client, chauffeur ou partenaire |
| 15 | Extourne / correction | Toute correction passe par extourne |

---

## 8. Phases de développement (cahier §110)

| Phase | Contenu |
|-------|---------|
| **Phase 1 — Socle** | WS-CH, recharge MM, contrôle solde, débit commission, Commission Engine, ledger, interfaces chauffeur/trésorerie/compta, dashboard Direction, audit |
| **Phase 2 — Extension** | Wallet partenaire, recharge flotte, reversement partenaire, bonus, wallet promo, réconciliation locale, extournes, litiges |
| **Phase 3 — Centrale** | Sous-comptes Canada, paiements carte, dashboard Centrale, consolidation multi-pays, réconciliation carte, audit franchise |
| **Phase 4 — Avancé** | Wallet client digital, paiement client digital, retrait automatisé, scoring financier, alertes prédictives |

---

## 9. Règles essentielles — synthèse cahier (§112)

1. Le client paie le chauffeur en cash — UPJUNOO ne collecte pas ce cash.
2. La recharge wallet = solde prépayé d’accès au service.
3. La commission est débitée **à chaque course validée**.
4. Pas de répartition sans débit wallet réussi.
5. Mobile Money → compte local franchise.
6. Carte → sous-compte Canada du pays.
7. Wallet client actuel = promotionnel ; wallet rechargeable = futur.
8. Franchises indépendantes localement ; Centrale = visibilité consolidée.
9. Trésorerie exécute ; Comptabilité constate et verrouille.
10. Toute correction = extourne.
11. Toute opération sensible = auditée.

---

## 10. Architecture API Up_prov2 (dual mode)

Le back-office fonctionne en **deux modes** selon les flags :

| Mode | Préfixe | Usage |
|------|---------|-------|
| **Legacy MSW** | `/api/v2/admin/finance/*`, `/franchise/finance/*`, `/partner/wallet/*` | Mocks locaux |
| **API v1** | `/v1/admin/finance/*`, `/v1/partners/:id/*`, `/v1/franchise/finance/*` | Swagger live |

Helpers : `useLegacyAdminApi()`, `useLegacyPortalApi()` dans `src/core/api/v1AdminMode.ts`.

Répertoire central des chemins : `src/core/api/links.ts`.

---

## 11. Ce qui est implémenté dans Up_prov2 (juin 2026)

### 11.1 Admin — routes et pages

| Route | Page | Service API |
|-------|------|-------------|
| `/admin/finance` | `AdminFinanceDashboardPage` | `GET /v1/admin/finance/dashboard` |
| `/admin/finance/transactions` | `TransactionsListPage` | `GET /v1/admin/finance/transactions` |
| `/admin/finance/transactions/[id]` | `TransactionDetailPage` | `GET .../transactions/:id` |
| `/admin/finance/commissions` | `CommissionsListPage` | `GET /v1/admin/finance/commissions` |
| `/admin/finance/commission-rules` | `CommissionRulesListPage` | `GET/POST /v1/admin/commission-rules` |
| `/admin/finance/commission-rules/new` | `CommissionRuleCreatePage` | `POST .../commission-rules` |
| `/admin/finance/commission-rules/[id]/edit` | `CommissionRuleEditPage` | `PATCH .../commission-rules/:id` |
| `/admin/finance/reconciliation` | `ReconciliationListPage` | `GET /v1/admin/finance/reconciliation` |
| `/admin/finance/withdrawals` | `WithdrawalsListPage` | `GET /v1/admin/withdrawals` |
| `/admin/finance/withdrawals/[id]` | `WithdrawalDetailPage` | approve/reject |
| `/admin/finance/driver-transfers` | `AdminDriverTransfersPage` | `GET /v1/admin/finance/driver-transfers` |
| `/admin/finance/wallets` | `WalletsListPage` | `GET /v1/admin/finance/wallets` — **hors nav** |

**Nav admin** : `src/portals/admin/adminNav.ts` (permissions `finance.transactions.view`, `finance.withdrawals.approve`).

**Feature principale** : `src/features/finance/` (~51 fichiers : pages, services, mappers, composants dashboard).

### 11.2 Franchise — routes et pages

| Route | Page | API |
|-------|------|-----|
| `/franchise/finance` | `FranchiseFinancePage` | `GET /franchise/finance` |
| `/franchise/finance/commissions` | `FranchiseCommissionsListPage` | `GET /franchise/finance/commissions` |
| `/franchise/finance/reconciliation` | `FranchiseReconciliationListPage` | `GET /franchise/finance/reconciliation` |
| `/franchise/finance/driver-transfers` | `FranchiseDriverTransfersPage` | stats + liste + `POST driver-recharge` |
| `/franchise/finance/partner-transfers` | `FranchisePartnerTransfersPage` | stats + liste + `POST partner-recharge` |

**Feature** : `src/features/franchise/api/finance.service.ts`, modals recharge.

### 11.3 Partenaire — wallet (pas de segment `/finance`)

| Route | Page | API |
|-------|------|-----|
| `/partner/wallet` | `PartnerWalletPage` | `GET /v1/partners/:id/wallet` |
| `/partner/wallet/ledger` | `PartnerLedgerPage` | `GET /v1/partners/:id/ledger` |
| `/partner/wallet/driver-transfers` | `PartnerDriverTransfersPage` | stats + recharge |

Composants : `PartnerWalletWithdrawModal`, `PartnerDriverRechargeModal`, `DriverRechargeModal` (partagé).

### 11.4 Embarqué (hors module finance dédié)

| Zone | Contenu finance |
|------|-----------------|
| `/admin/fleet/drivers/[id]` | Solde wallet + transactions chauffeur |
| `/admin/network/partners/[id]` | Wallet + ledger + panel règles commission |
| `/admin/network/franchises/[id]` | Wallet + ledger franchise |
| `/admin/ops/trips/[id]` | Une ligne « Commission plateforme » (`commission_fcfa`) |
| `/admin/settings/integrations` | Config Paydunya (`PaydunyaConfigCard`) |
| Pricing | `/admin/settings/pricing`, `/franchise/pricing` — tarification courses (lié mais distinct du moteur commission wallet) |

### 11.5 Règles de commission (front)

Fichiers : `CommissionRuleForm.tsx`, `CommissionRuleRatesForm.tsx`, `commissionRules.service.ts`.

Champs paramétrables :
- `platform_rate`, `driver_rate`, `fiscality_rate`
- Pool franchise / partenaire (modes `partner-led` ou `dual`)
- Scope : `global`, `franchise`, `partner`
- Types de service : RIDE, DELIVERY, DELIVERY_CARGO, RENTAL, FREIGHT
- Base : `FINAL_PRICE` ou `GROSS_AMOUNT`

**Pas de mock MSW** pour commission-rules — nécessite backend v1 réel.

### 11.6 Mocks MSW

| Handler | Fichier | Données |
|---------|---------|---------|
| Admin finance | `src/mocks/handlers/finance.handlers.ts` | dashboard, transactions, wallets, commissions, reconciliation, withdrawals, driver-transfers |
| Franchise finance | `src/mocks/handlers/franchise.handlers.ts` | overview, commissions, reconciliation, driver/partner transfers |
| Partner wallet | `src/mocks/handlers/partner.handlers.ts` | wallet, driver-transfers, withdraw, recharge |

Données seed : `src/mocks/data/finance-*.json`, `wallet-partner.json`, `withdrawals.json`, etc.

---

## 12. Mapping cahier ↔ Up_prov2 — couverture

### 12.1 Légende

| Statut | Signification |
|--------|---------------|
| ✅ | Couvert (page + API) |
| 🟡 | Partiel |
| ❌ | Absent |

### 12.2 Synthèse par domaine

| Domaine cahier | Admin | Franchise | Partenaire | Statut global |
|----------------|-------|-----------|------------|---------------|
| Dashboard finance | ✅ | ✅ | 🟡 KPI wallet | 🟡 |
| Wallets (consultation) | 🟡 hors nav | 🟡 overview | ✅ | 🟡 |
| Recharges chauffeurs (manuelles) | ✅ | ✅ | ✅ | ✅ |
| Recharges MM opérateur (callback) | ❌ | ❌ | ❌ | ❌ |
| Commissions (listes) | ✅ | ✅ | 🟡 | 🟡 |
| Règles commission (CRUD) | ✅ v1 | ❌ | 🟡 panel admin | 🟡 |
| Débit commission par course (UI) | 🟡 1 champ | ❌ | ❌ | 🟡 |
| Charges & R&D 40 % | ❌ | ❌ | ❌ | ❌ |
| Ledger | 🟡 transactions | ❌ | ✅ | 🟡 |
| Réconciliation | ✅ | ✅ | 🟡 API seule | 🟡 |
| Retraits partenaire | ✅ validation | ❌ | ✅ demande | 🟡 |
| Retrait chauffeur | ❌ | ❌ | ❌ | ❌ |
| Bonus chauffeur | ❌ | ❌ | ❌ | ❌ |
| Trésorerie franchise (espace dédié) | — | ❌ | — | ❌ |
| Comptabilité franchise (espace dédié) | — | ❌ | — | ❌ |
| Consolidation Centrale / Canada | 🟡 dashboard | — | — | 🟡 |
| Extournes / remboursements | ❌ | ❌ | ❌ | ❌ |
| App chauffeur (recharge, historique) | — | — | — | ❌ hors back-office |

### 12.3 Couverture par phase cahier

| Phase | Couverture back-office Up_prov2 |
|-------|----------------------------------|
| Phase 1 — Socle | ~60 % : dashboard, recharges manuelles, règles, listes, wallet lecture |
| Phase 2 — Extension | ~30 % : retraits partenaire, réconciliation basique, transferts franchise↔partenaire |
| Phase 3 — Centrale | ~15 % : dashboard multi-franchise partiel |
| Phase 4 — Avancé | 0 % |

---

## 13. Écarts prioritaires identifiés

Ordre discuté pour rapprocher le front du cahier :

| # | Écart | Type | Priorité |
|---|-------|------|----------|
| 1 | Détail course : cash / wallet avant-après / statut commission / répartition | Front + API | P0 |
| 2 | Charges & R&D 40 % absent des écrans | Front (calcul) + API | P1 |
| 3 | Parcours recharge Mobile Money (callback, idempotence) | Backend + app chauffeur | P0 backend |
| 4 | Interfaces Trésorerie / Comptabilité franchise séparées | Gros chantier UI | P2 |
| 5 | Retrait chauffeur | Backend + UI | P2 |
| 6 | Bonus WB-CH | Backend + UI | P2 |
| 7 | Extournes et remboursements | Backend + UI | P2 |
| 8 | Routage carte → sous-compte Canada (UI) | Backend + UI | P3 |
| 9 | Simulation commission (admin) | Front + API | P1 |
| 10 | Statuts incident wallet (`INSUFFICIENT_WALLET`, etc.) | Backend + UI | P0 |

---

## 14. Plan d’action discuté (non encore implémenté)

### Bucket A — Front seul (sans attendre backend)

- Panneau finance sur détail course avec labels cahier (placeholders si champs API absents).
- Enrichissement fiche chauffeur : solde, alerte, lien recharge.
- Labels et colonnes commissions (théorique vs net 60 % si taux connus).
- Remettre `/admin/finance/wallets` en nav si pertinent.

### Bucket B — Front + API existante

- Brancher champs commission détaillés si Swagger les expose sur order/trip.
- Page revenus partenaire si `GET /v1/partners/:id/revenue` stabilisé.
- Filtres date sur réconciliation (pattern `DateRangeFilter` déjà utilisé ailleurs).

### Bucket C — Backend requis (documenter dans `DEMANDES-FINANCE-*.md`)

- Payload commission par course (wallet before/after, split, rd_contribution, status).
- Endpoints ledger franchise, trésorerie, extournes.
- Parcours recharge MM complet.
- Statuts commission et incidents financiers.

---

## 15. Fichiers clés du codebase

```
src/features/finance/                    # Module admin finance
src/features/franchise/api/finance.*     # Finance franchise
src/features/partner/api/wallet.*        # Wallet partenaire
src/features/fleet/pages/DriverDetailPage.tsx  # Wallet chauffeur admin
src/features/ops/pages/TripDetailPage.tsx      # Commission course (partiel)
src/core/api/links.ts                    # LINKS.admin.v1.finance, partner.wallet, etc.
src/mocks/handlers/finance.handlers.ts
src/mocks/handlers/franchise.handlers.ts
src/mocks/handlers/partner.handlers.ts
src/shared/wallet/DriverRechargeModal.tsx
src/shared/lib/commissionRateCoupling.ts
src/portals/admin/adminNav.ts
src/portals/franchise/franchiseNav.ts
src/portals/partner/partnerNav.ts
```

---

## 16. Points d’attention techniques

1. **`LINKS.admin.finance.dashboard`** pointe vers `/admin/finance/dashboard` mais la route UI est **`/admin/finance`**.
2. **Retraits v1** : `/v1/admin/withdrawals` — pas sous `/v1/admin/finance/withdrawals`.
3. **Commission rules** : v1 only, pas de handler MSW.
4. **Partner ledger** : pas de mock legacy — mode v1 API.
5. **Paydunya** : config admin settings, pas de parcours recharge carte complet.
6. **Pricing vs commission** : modules distincts (tarification course vs moteur commission wallet).

---

## 17. Documents liés

| Document | Lien |
|----------|------|
| Cahier des charges source | `docs/CAHIER DES CHARGES TECHNIQUE  MODULE FINANCE.docx` |
| Export PDF | `docs/DOC  FINANCE SYNTHESE.pdf` |
| API Swagger context | `docs/API-SWAGGER-CONTEXT.md` |
| Écarts API v1 | `docs/API-ECARTS-V1.md`, `docs/ECARTS-API-V1-BACKOFFICE.md` |
| Paydunya / moyens paiement | `docs/dispatcher_caracteristique_for_front.md` § PAY-METHOD |
| Demandes backend finance | **À créer** : `docs/DEMANDES-FINANCE-*.md` |

---

## 18. Conclusion

Le module Finance du cahier des charges est **le cœur économique** d’UPJUNOO PRO : modèle cash + wallet prépayé, débit commission automatique, répartition multi-acteurs avec contribution Charges & R&D, séparation trésorerie/comptabilité, consolidation Centrale.

**Up_prov2** couvre aujourd’hui surtout le **pilotage back-office** (dashboards, listes, règles commission, recharges manuelles, retraits partenaire, réconciliation basique). Le **moteur opérationnel** (débit à la course, MM callback, incidents wallet, extournes, trésorerie/compta séparées) reste largement **backend + apps terrain**.

Ce document doit être mis à jour à chaque :
- nouvelle page finance implémentée ;
- réponse backend sur les endpoints finance ;
- évolution du cahier des charges ou du Swagger.
