# Interface Comptable UpJunoo Pro — contexte produit & technique

> **Date :** 2026-06-16  
> **Projet :** UpJunoo Pro — back-office (`Up_prov2`)  
> **Public :** Produit, front, backend, comptabilité, finance  
> **Swagger :** [https://api.upjunoo-dev.tech/docs](https://api.upjunoo-dev.tech/docs)  
> **Sources métier :**
> - `docs/FINANCE-CONTEXT.md`
> - `docs/module_finance/README.md` (modèle 2 soldes, ledger immuable)
> - `docs/module_finance/06-comptabilite.md` (périmètre comptable)
> - `docs/ROUTES-BACKEND-INTERFACE-COMPTABLE.md` (contrat API détaillé)

---

## 1. Objet de ce document

Ce fichier définit **ce qu’est l’interface comptable**, **pour qui**, **ce qu’elle fait et ne fait pas**, et **comment elle s’articule** avec le module Finance admin existant.

Il sert de référence unique avant :
- d’implémenter le portail `/compta` ;
- de rédiger des specs d’écrans ;
- de valider les contrats API avec le backend.

**Document complémentaire routes :** `docs/ROUTES-BACKEND-INTERFACE-COMPTABLE.md`.

---

## 2. Principe fondamental : Comptabilité ≠ Trésorerie

Le cahier des charges impose une **séparation stricte des rôles** :

| Comptabilité | Trésorerie / Admin finance opérationnel |
|--------------|----------------------------------------|
| **Constate** les mouvements (entrées / sorties) | **Exécute** les paiements (Mobile Money, virements) |
| **Classe** les écritures dans le ledger | **Approuve** ou **rejette** les retraits |
| **Rapproche** (opérateur MM, cash, carte) | **Recharge** manuellement les wallets |
| **Exporte** (CSV, Excel, rapports périodiques) | **Paramètre** les taux commission, bonus, plafonds |
| **Clôture** et **verrouille** une période | **Corrige** via extourne (souvent avec validation compta) |

```
Mouvement d'argent (terrain / MM / retrait)
        │
        ├── Trésorerie : exécution, validation opérationnelle
        │
        └── Comptabilité : écriture ledger, classification, rapprochement, clôture
```

**Règle d’or :** toute opération d’argent doit finir dans `ledger_entries` (immuable). La comptabilité ne modifie jamais un wallet directement.

---

## 3. Modèle économique à afficher (rappel)

L’interface comptable doit rendre visibles les **trois notions distinctes** du cahier :

| Notion | Définition | Exemple (course 10 000 FCFA) |
|--------|------------|------------------------------|
| **Recette chauffeur** | Cash reçu du client | 10 000 FCFA |
| **Recharge wallet** | Prépaiement pour couvrir les commissions | +5 000 FCFA crédités (retirable) |
| **Commission UPJUNOO** | Prélevée du wallet prépayé | 15 % = 1 500 FCFA débités |

### Deux sous-soldes par wallet

| Sous-solde | Colonne API | Alimenté par | Retirable ? |
|------------|-------------|--------------|-------------|
| **Service (non retirable)** | `non_withdrawable_balance_xof` | Crédits offerts (promo, bienvenue) | Non |
| **Retirable** | `withdrawable_balance_xof` | Recharges MM + bonus performance | Oui (plafond/jour) |

Chaque écriture ledger porte un **`balance_bucket`** : `WITHDRAWABLE` ou `NON_WITHDRAWABLE`.

### Cascade commission (affichage compta)

Pour une commission C :
1. Prélèvement d’abord sur le solde **service** (jamais &lt; 0).
2. Le reste sur le solde **retirable** (peut devenir négatif).

→ Peut générer **1 ou 2 lignes ledger** (`ride_commission`) sous le même `txn_id`.

---

## 4. Périmètre du portail comptable

### 4.1 Deux portails distincts (recommandé)

| Portail | Route UI | Scope | Utilisateur type |
|---------|----------|-------|------------------|
| **Compta centrale** | `/compta/*` | Plateforme (toutes franchises) | Comptable UPJUNOO |
| **Compta franchise** | `/franchise/compta/*` | Une franchise | Comptable local franchise |

**Ne pas confondre** avec `/admin/finance/*` :
- L’admin finance = pilotage opérationnel + paramétrage + validation retraits.
- Le portail compta = **consultation, rapprochement, clôture, export** (lecture seule sur les actions de paiement).

### 4.2 État actuel du codebase (2026-06-16)

| Élément | Statut |
|---------|--------|
| Portail `/compta` dédié | ❌ Absent |
| Rôle `ACCOUNTANT` / permissions `accounting.*` | ❌ Absent du front |
| Page « Ledger comptable » admin | 🟡 Existe sous `/admin/finance/ledger` mais appelle `transactions` en fallback |
| Menu Finance admin | ✅ Dashboard, transactions, retraits, wallets, commissions, réconciliation |
| Composants partagés finance | ✅ `WalletBalancesCard`, `TripFinancePanel` |

**Décision produit :** le portail `/compta` réutilise les composants finance existants (`DataTable`, filtres date, `WalletBalancesCard`, etc.) mais avec un **menu réduit** et des **permissions dédiées**.

---

## 5. Arborescence des écrans

### 5.1 Menu comptable (7 sections + consultation)

```
COMPTABILITÉ
├── 1. Tableau de bord          → KPI, alertes, écarts ouverts
├── 2. Flux entrées / sorties   → Agrégation par nature et période
├── 3. Journal comptable        → ledger_entries (immuable)
├── 4. Commissions & bénéfices  → Ventilation multi-acteurs
├── 5. Portefeuilles            → 2 soldes par acteur
├── 6. Réconciliation           → MM, cash, carte, paiements
└── 7. Clôtures & verrouillage  → Périodes journalières / mensuelles

CONSULTATION (lecture seule)
├── 8. Transactions détaillées
├── 9. Retraits (sans bouton approuver)
├── 10. Recharges chauffeurs / partenaires
└── 11. Fiches liées (course, chauffeur, partenaire, franchise)

ACTIONS COMPTABLES
├── 12. Extournes               → Écriture inverse (motif obligatoire)
└── 13. Rapports & exports      → CSV / Excel / synthèses
```

### 5.2 Détail par écran

#### 1 — Tableau de bord (`/compta`)

**Objectif :** vue d’ensemble avant clôture.

| KPI | Source |
|-----|--------|
| Écritures du jour (crédit / débit) | Ledger |
| Commissions débitées / en attente / échouées | Ledger + statuts commission |
| Écarts de réconciliation non justifiés | Réconciliation |
| Période en cours (ouverte / clôturée / verrouillée) | Accounting periods |
| Retraits en attente (info, pas d’action) | Withdrawals |
| Wallets sous seuil dispatch | Wallets + config |
| Extournes du mois | Ledger `entry_type=reversal` |

#### 2 — Flux entrées / sorties (`/compta/flows`)

**Objectif :** voir **tout l’argent qui entre et sort**, agrégé.

Colonnes suggérées : date, nature (`entry_type`), franchise, montant entrées, montant sorties, solde net période, bucket.

Filtres : période, franchise, service, `entry_type`, `balance_bucket`.

#### 3 — Journal comptable (`/compta/ledger`)

**Objectif :** source de vérité — toutes les lignes `ledger_entries`.

| Colonne | Champ API |
|---------|-----------|
| Date | `posted_at` |
| Réf. transaction | `txn_id` |
| Nature | `entry_type` |
| Direction | `direction` (debit/credit) |
| Montant | `amount_xof` |
| Bucket | `balance_bucket` |
| Wallet / propriétaire | `wallet_id`, owner résolu |
| Course / source | `source_type`, `source_id` |
| Statut | `status` |
| Description | `description` |

Actions : voir détail, exporter, **extourner** (si permission).

**API cible :** `GET /v1/admin/ledger` (pas `finance/transactions`).

#### 4 — Commissions & bénéfices (`/compta/commissions`)

**Objectif :** ventilation des parts (fiscalité, franchise, partenaire, centrale).

- Liste : `GET /v1/admin/finance/commissions`
- Détail course : breakdown sur `GET /v1/admin/orders/{id}` (`commission_breakdown`)

Affichage recommandé par course :
- Montant brut, cash chauffeur, commission totale
- Parts : fiscalité 2,3 %, franchise 3 %, partenaire 4 %, centrale 5,7 %
- Statut : `COMMISSION_DEBITED`, `COMMISSION_FAILED`, etc.

#### 5 — Portefeuilles (`/compta/wallets`)

**Objectif :** état des soldes à une date (ou temps réel).

- Liste : `GET /v1/admin/finance/wallets`
- Colonnes : acteur, franchise, total, **retirable**, **non retirable**, pending retraits
- Liens vers ledger filtré par `wallet_id`

#### 6 — Réconciliation (`/compta/reconciliation`)

Trois onglets :

| Onglet | Contenu |
|--------|---------|
| **Paiements** | `GET /v1/admin/finance/reconciliation` — PayDunya / `payment_transactions` |
| **Cash** | `GET /v1/admin/cash-reconciliations` — rapprochement cash terrain |
| **Mobile Money** | *(à venir)* relevé MM ↔ compte local franchise ↔ ledger |
| **Carte Canada** | *(à venir)* sous-compte Canada ↔ transactions carte |

Workflow : écart détecté → justification obligatoire → validation → condition de clôture.

#### 7 — Clôtures (`/compta/periods`)

**Objectif :** fermer et verrouiller une période comptable.

- Liste périodes : `GET /v1/admin/accounting/periods`
- Clôturer : `POST /v1/admin/accounting/periods/close`
- Verrouiller : `POST /v1/admin/accounting/periods/{id}/lock` *(à créer)*

Règles :
- Impossible de clôturer si écarts non justifiés.
- Période verrouillée = ledger en lecture seule (sauf extourne avec double validation).

#### 8–11 — Consultation lecture seule

Réutilise les listes admin existantes **sans actions d’approbation** :
- Transactions, retraits, recharges, liens vers fiches opérationnelles.

#### 12 — Extournes (`/compta/reversals` ou action depuis ledger)

- Déclenchement : `POST /v1/admin/ledger/{id}/reverse`
- Motif + justificatif obligatoires
- Double validation si montant &gt; seuil configurable
- Génère `entry_type=reversal` (écriture inverse, pas de suppression)

#### 13 — Rapports & exports (`/compta/exports`)

- Export ledger : `GET /v1/admin/ledger/export`
- Rapports génériques : `GET /v1/admin/reports/export`
- Synthèses mensuelles / contrôles quotidiens *(routes dédiées à créer)*

---

## 6. Contrôles comptables (quotidiens & mensuels)

### 6.1 Contrôles quotidiens

À exposer sur le dashboard ou une page « Contrôles » :

- Recharges confirmées vs créditées sur wallet
- Commissions calculées / débitées / échouées
- Wallets insuffisants ou négatifs (retirable)
- Retraits du jour (pending / paid)
- Reversements partenaire
- Frais d’annulation
- Doublons `idempotency_key`
- Transactions en attente (`PENDING`, `PROCESSING`)
- Écarts de solde (cache wallet vs somme ledger)
- Chauffeurs bloqués au dispatch (solde sous seuil)
- Incidents commission

### 6.2 Contrôles mensuels (avant clôture)

- Totaux : recettes brutes, cash reçu chauffeurs, recharges, commissions débitées
- Parts : centrale, franchise, partenaire, fiscalité
- Bonus versés (`performance_bonus`)
- Soldes wallets et comptes bancaires / MM
- Écritures non rapprochées
- Clôtures effectuées
- Exports générés
- Transferts vers Centrale
- Anomalies non résolues

---

## 7. Permissions & RBAC

### 7.1 Rôle proposé : `ACCOUNTANT`

| Permission | Action |
|------------|--------|
| `finance.ledger.view` | Consulter le journal |
| `finance.transactions.view` | Consulter transactions |
| `finance.wallets.view` | Consulter portefeuilles |
| `finance.commissions.view` | Consulter commissions |
| `finance.reconciliation.view` | Consulter réconciliation |
| `accounting.entries.classify` | Classer une écriture |
| `accounting.periods.close` | Clôturer une période |
| `accounting.periods.lock` | Verrouiller une période |
| `accounting.export` | Exporter rapports |
| `accounting.reverse` | Créer une extourne |

### 7.2 Interdictions explicites

Le comptable **ne doit pas** avoir :

- `finance.withdrawals.approve` / `reject`
- `finance.driver-recharge.create`
- `commission-rules.*` (écriture)
- `bonus-rules.*` (écriture)
- `settings.finance-caps.*` (écriture)
- Toute action sur la flotte, KYC, dispatch

### 7.3 Variante franchise

Même rôle avec scope `franchise_id` :
- Ledger et réconciliation **filtrés territoire**
- Pas de visibilité sur les autres franchises
- Clôture locale (si autorisée par la centrale)

---

## 8. Types d’écritures (`entry_type`)

Standardisés dans `docs/module_finance/README.md` §8.3 :

| `entry_type` | Description |
|--------------|-------------|
| `wallet_recharge` | Recharge Mobile Money → bucket WITHDRAWABLE |
| `ride_commission` | Commission course (1 ou 2 lignes cascade) |
| `withdrawal` | Retrait approuvé |
| `performance_bonus` | Bonus hebdomadaire |
| `service_credit` | Crédit offert non retirable |
| `welcome_bonus` | Crédit bienvenue |
| `referral_bonus` | Parrainage |
| `cancellation_fee` | Frais d’annulation |
| `reversal` | Extourne (écriture inverse) |

---

## 9. Mapping écrans ↔ code existant

| Écran compta | Réutilisation possible | Nouveau à créer |
|--------------|------------------------|-----------------|
| Dashboard | `FinanceDashboardPage` (partiel) | `ComptaDashboardPage` |
| Flux | — | `ComptaFlowsPage` |
| Ledger | `TransactionsListPage`, `LedgerListPage` | Brancher vrai ledger + filtres bucket |
| Commissions | `CommissionsListPage` | Enrichir breakdown |
| Portefeuilles | `WalletsListPage` | Menu compta, permissions |
| Réconciliation | `ReconciliationListPage` | Onglets cash / MM / carte |
| Clôtures | — | `AccountingPeriodsPage` |
| Extournes | — | Modal + `ReverseEntryModal` |
| Exports | — | `ComptaExportsPage` |

**Structure code suggérée :**

```
src/features/compta/
  pages/
    ComptaDashboardPage.tsx
    ComptaLedgerPage.tsx
    ComptaFlowsPage.tsx
    ComptaCommissionsPage.tsx
    ComptaWalletsPage.tsx
    ComptaReconciliationPage.tsx
    ComptaPeriodsPage.tsx
    ComptaExportsPage.tsx
  api/
    compta.service.ts
    compta.queries.ts
    compta.keys.ts
src/portals/compta/
  comptaNav.ts
  ComptaShell.tsx
```

---

## 10. Phases d’implémentation

### Phase 1 — Socle (sans attendre toutes les routes)

- Portail `/compta` + shell + navigation
- Ledger branché sur `GET /v1/admin/ledger`
- Portefeuilles (liste existante, permissions compta)
- Commissions (liste existante)
- Consultation retraits / recharges (lecture seule)

### Phase 2 — Opérations comptables

- Clôtures (`accounting/periods`)
- Export ledger
- Extournes (`ledger/{id}/reverse`)
- Réconciliation cash (`cash-reconciliations`)

### Phase 3 — Enrichissement métier

- Dashboard compta dédié
- Flux entrées/sorties agrégés
- Réconciliation MM + carte
- Rapports mensuels / contrôles quotidiens
- Classification d’écritures
- Portail `/franchise/compta`

### Phase 4 — Conformité avancée

- Verrouillage période
- Double validation extournes sensibles
- Export FEC / formats comptables externes
- Consolidation Centrale / Canada

---

## 11. Écarts connus (dépendances backend)

| Écart | Impact compta | Priorité |
|-------|---------------|----------|
| `balance_bucket` absent du ledger | Filtres cascade impossibles | P0 |
| 2 soldes absents des wallets | Écran portefeuilles incomplet | P0 |
| Schémas 200 non documentés (Swagger) | Intégration front difficile | P0 |
| `GET /v1/admin/accounting/dashboard` absent | Dashboard vide | P1 |
| Breakdown commission sur `orders/{id}` absent | Commissions par course incomplètes | P1 |
| Réconciliation MM / carte non formalisée | Onglets réconciliation vides | P1 |
| Rôle `ACCOUNTANT` non exposé auth | Portail non sécurisable | P1 |

Détail routes : `docs/ROUTES-BACKEND-INTERFACE-COMPTABLE.md`.

---

## 12. Documents liés

| Document | Lien |
|----------|------|
| Contexte finance global | `docs/FINANCE-CONTEXT.md` |
| Socle 2 soldes + ledger | `docs/module_finance/README.md` |
| Spec comptabilité métier | `docs/module_finance/06-comptabilite.md` |
| Routes API compta | `docs/ROUTES-BACKEND-INTERFACE-COMPTABLE.md` |
| Routes finance admin (audit) | `docs/ROUTES-BACKEND-ABSENTES-FINANCE-ADMIN.md` |
| Admin centrale | `docs/module_finance/05-admin-centrale.md` |

---

## 13. Conclusion

L’interface comptable est un **portail dédié** centré sur la **traçabilité**, le **rapprochement** et la **clôture** — pas sur l’exécution des paiements.

Le socle API existe en partie (`ledger`, `periods/close`, `reverse`, `export`, `cash-reconciliations`). Le chantier principal consiste à :
1. **Brancher** ces routes dans un portail `/compta` sécurisé ;
2. **Enrichir** les payloads (`balance_bucket`, 2 soldes, breakdown commission) ;
3. **Créer** les routes manquantes (dashboard, réconciliation MM/carte, rapports, verrouillage période) ;
4. **Séparer** les permissions compta vs trésorerie.

Ce document doit être mis à jour à chaque nouvel écran compta implémenté ou réponse backend sur les endpoints comptables.
