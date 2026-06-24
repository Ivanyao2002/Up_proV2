# Audit métier — Interface comptable UpJunoo

> **Date :** 2026-06-16  
> **Objectif :** comprendre le **métier réel** de la comptable actuelle, comparer avec les **flows déjà codés** dans UpJunoo Pro, identifier les **écarts** et prioriser les corrections.  
> **Public :** produit, comptabilité, développement  
> **Références :** `docs/INTERFACE-COMPTABLE-CONTEXT.md`, `docs/ROUTES-BACKEND-INTERFACE-COMPTABLE.md`

---

## 1. Comment mener l’entretien (30 à 60 min)

### Format recommandé

1. **5 min** — Contexte UpJunoo (cash chauffeur + wallet prépayé + commission)
2. **15 min** — Présentation de ce qui existe déjà (section 2 ci-dessous)
3. **30 min** — Questions métier (section 3) — une thématique à la fois
4. **10 min** — Priorisation des écarts (section 4)

### Règles d’animation

- Demander des **exemples concrets** (« Montre-moi la dernière clôture de juin »)
- Noter les **outils actuels** (Excel, logiciel compta, relevés MM, banque)
- Distinguer **ce qu’elle fait** vs **ce que la trésorerie / l’admin fait**
- Ne pas défendre l’app : chercher les **frictions** et les **contournements**

### Documents à avoir sous la main

- Capture du portail `/compta` (ou démo live)
- Un exemple de course cash + commission
- Un exemple de recharge MM + retrait partenaire
- `docs/module_finance/README.md` (modèle 2 soldes) — optionnel, en annexe

---

## 2. Ce qu’on lui présente déjà (état applicatif)

> À montrer en démo avant les questions. Adapter si l’environnement de test diffère.

### 2.1 Modèle économique affiché

| Notion | Où c’est visible |
|--------|-------------------|
| Client paie le chauffeur **en cash** (100 %) | Fiche course `/admin/ops/trips/{id}` — panneau Finance |
| Commission prélevée du **wallet** chauffeur | Idem + liste commissions |
| **2 soldes** : retirable / service (non retirable) | Fiches chauffeur, partenaire, franchise, liste portefeuilles |
| Ledger **immuable** (pas de suppression) | Journal comptable — extourne uniquement |

### 2.2 Portail comptable `/compta` (dédié)

| Écran | Route | Ce qu’on peut faire aujourd’hui |
|-------|-------|--------------------------------|
| Tableau de bord | `/compta` | KPI crédits/débits jour, commissions mois, retraits pending (info) |
| Flux entrées / sorties | `/compta/flows` | Agrégation par nature de mouvement |
| Journal comptable | `/compta/ledger` | Liste ledger, filtres direction / bucket / nature / franchise, **export**, **extourne** |
| Commissions & bénéfices | `/compta/commissions` | Liste commissions (lecture) |
| Portefeuilles | `/compta/wallets` | Soldes par acteur (retirable / service si API les fournit) |
| Réconciliation | `/compta/reconciliation` | Paiements + panneau cash reconciliations |
| Clôtures & périodes | `/compta/periods` | Liste périodes, clôture jour / mois |
| Transactions | `/compta/transactions` | Consultation |
| Retraits | `/compta/withdrawals` | **Lecture seule** (pas d’approbation) |
| Recharges chauffeurs | `/compta/recharges` | **Lecture seule** |
| Rapports & exports | `/compta/exports` | Export ledger / rapports |

**Message clé :** le portail compta est pensé **constat + rapprochement + clôture**, pas exécution des paiements.

### 2.3 Finance admin `/admin/finance` (opérationnel — hors périmètre compta)

| Écran | Action possible | Hors rôle compta ? |
|-------|-----------------|-------------------|
| Retraits | Approuver / rejeter | Oui — trésorerie |
| Recharges chauffeurs | Créer une recharge | Oui — trésorerie |
| Règles commission / bonus | Paramétrer les taux | Oui — admin |
| Plafonds finance | Modifier seuils | Oui — admin |

### 2.4 Fiches opérationnelles enrichies

| Fiche | Données finance visibles |
|-------|--------------------------|
| Chauffeur | Wallet 2 soldes, historique transactions, lien recharges |
| Partenaire / Franchise | Wallet, mouvements récents |
| Course | Recette brute, cash chauffeur, commission, wallet avant/après (si API) |

### 2.5 Ce qui n’est **pas** encore fait (être transparent)

- Dashboard compta **métier** dédié (`/v1/admin/accounting/dashboard` absent)
- Réconciliation **Mobile Money** relevé ↔ compte local franchise (workflow complet)
- Réconciliation **carte / Canada**
- Verrouillage explicite de période (`periods/{id}/lock`)
- Classification comptable des écritures (compte / centre de coût)
- Rôle `ACCOUNTANT` séparé avec permissions fines
- Portail `/franchise/compta` (compta locale franchise)
- Rapports mensuels / contrôles quotidiens automatisés

---

## 3. Questionnaire métier — ce qu’on lui pose

### Bloc A — Son rôle et son quotidien

1. Peux-tu décrire **une journée type** ? À quelle heure tu commences, quelles sont les 3 premières choses que tu consultes ?
2. Quelle est **ta frontière** avec la trésorerie / l’admin ? Qu’est-ce que **tu ne fais jamais** (valider un virement, approuver un retrait…) ?
3. Sur quels **outils** tu travailles aujourd’hui ? (Excel, Sage, Odoo, relevés opérateur MM, banque, WhatsApp…)
4. Tu travailles plutôt en **central** (toutes franchises) ou **par franchise / pays** ?
5. Qui te **demande quoi** en priorité ? (Direction, franchise, audit, fiscalité…)

### Bloc B — Comprendre l’argent (alignement modèle UpJunoo)

6. Quand un chauffeur reçoit **10 000 FCFA cash** d’une course, **comment tu le vois** dans tes écritures ? (Recette ? Hors bilan ? Autre ?)
7. La **commission UPJUNOO** (15 % débitée du wallet), tu la constates **quand** ? À la course ? À la fin de journée ? En fin de mois ?
8. Connais-tu la différence entre :
   - argent **rechargé** par le chauffeur (Mobile Money) ;
   - argent **offert** par la plateforme (bonus / crédit service non retirable) ?
9. Est-ce que tu as besoin de voir les **2 soldes** séparément, ou un seul solde total te suffit ?
10. Que fais-tu quand le wallet chauffeur est **insuffisant** ou **négatif** ? Est-ce un incident comptable pour toi ?

### Bloc C — Journal comptable (ledger)

11. Qu’est-ce que tu appelles ton **journal** aujourd’hui ? Une export API, un Excel, le logiciel compta ?
12. Quelles **colonnes** sont indispensables sur chaque ligne ? (date, libellé, débit, crédit, compte, tiers, référence course, franchise…)
13. Tu as besoin de filtrer par **nature** ? (commission, recharge, retrait, bonus, extourne…)
14. Une écriture te suffit en **débit/crédit classique**, ou tu veux voir **qui** est débité/crédité (chauffeur, partenaire, centrale, fiscalité) ?
15. À quelle **fréquence** tu consultes le journal ? (temps réel, fin de journée, hebdo, mensuel)
16. Le journal qu’on te montre (`/compta/ledger`) — **il manque quoi** par rapport à ce que tu utilises ?

### Bloc D — Commissions et répartition des bénéfices

17. Comment tu **ventiles** la commission aujourd’hui ? (Centrale, franchise, partenaire, fiscalité — connais-tu les taux 5,7 % / 3 % / 4 % / 2,3 % ?)
18. Tu as besoin du détail **par course** ou seulement des **totaux par période** ?
19. Les **bonus chauffeurs** (performance hebdo), tu les comptabilises comment ? Même compte que les recharges ?
20. Le concept **Charges & R&D 40 %** sur chaque part — est-ce pertinent pour toi ou hors périmètre ?
21. L’écran commissions (`/compta/commissions`) + le panneau finance course — **qu’est-ce qui manque** pour ton reporting ?

### Bloc E — Portefeuilles (wallets)

22. Tu suis les soldes **chauffeur**, **partenaire**, **franchise** séparément ?
23. À quelle fréquence tu **rapproches** le solde affiché avec ton calcul manuel ?
24. Les **retraits en attente** doivent-ils **réduire** le solde disponible dans ton vue compta ?
25. L’écran portefeuilles — tu préfères une **liste globale** ou par **franchise / partenaire** ?

### Bloc F — Réconciliation

26. Décris ton processus de **réconciliation Mobile Money** : relevé opérateur → compte local → écritures. **Étape par étape.**
27. À quelle fréquence ? (quotidien, hebdo)
28. Comment tu traites un **écart** ? (montant, date, doublon) — qui valide ? quel justificatif ?
29. Fais-tu une réconciliation **cash terrain** (courses) ou seulement MM / digital ?
30. Y a-t-il une réconciliation **carte bancaire / compte Canada** dans ton périmètre ?
31. Avant de **clôturer** un mois, quelles lignes doivent être **100 % rapprochées** ?
32. L’écran réconciliation actuel (paiements + cash) — **ça couvre quoi** de ton process ? **Qu’est-ce qui manque** ?

### Bloc G — Retraits et recharges (consultation)

33. Tu as besoin de **voir** les retraits en attente sans les approuver ?
34. Pour une recharge chauffeur (partenaire ou MM), quelles infos tu veux ? (date, montant, canal, référence PayDunya, franchise…)
35. Tu rapproches les **recharges manuelles partenaire** avec quoi ?

### Bloc H — Clôtures et verrouillage

36. Tu clôtures à quel **rythme** ? (jour, semaine, mois)
37. Décris la **checklist** avant clôture mensuelle — point par point.
38. Après clôture, peut-on encore **modifier** des écritures chez toi ? Ou tout passe par **extourne** ?
39. Le **verrouillage** : est-ce une action distincte de la clôture ?
40. Qui **signe** ou valide une clôture ? (toi seule, double validation, direction)
41. Les boutons « Clôturer journée / mois » — **quels contrôles** tu attends avant que le système accepte ?

### Bloc I — Extournes et corrections

42. Donne un **exemple réel** d’erreur corrigée le mois dernier — comment tu l’as traitée ?
43. Extourne = **écriture inverse** sans effacer l’originale — est-ce conforme à ta pratique ?
44. À partir de quel **montant** ou type d’erreur, tu exiges une **double validation** ?
45. Quels **motifs** tu veux obligatoires ? (liste fermée ou texte libre)
46. Le modal extourne du ledger — **il manque quoi** ? (pièce jointe, N° ticket, lien course…)

### Bloc J — Exports et reporting

47. Quels **exports** tu produis chaque mois ? (format : CSV, Excel, FEC, PDF)
48. Pour **qui** ? (expert-comptable, direction, franchise, fisc)
49. Quels **filtres** à l’export ? (période, franchise, nature, compte)
50. As-tu besoin d’un **rapport mensuel standard** (1 page synthèse) ou seulement des fichiers bruts ?
51. Les **contrôles quotidiens** — lesquels sont non négociables ? (liste top 5)

### Bloc K — Organisation, droits, friction

52. Si tu n’avais qu’**un écran** dans l’app, lequel ?
53. Quelles actions tu fais **encore hors UpJunoo** parce que l’app ne le permet pas ?
54. Qu’est-ce qui te fait **perdre le plus de temps** aujourd’hui ?
55. Y a-t-il des **indicateurs** que la direction te demande et que tu calcules à la main ?
56. Le portail `/compta` séparé de `/admin/finance` — **ça te convient** ou tu préfères un seul menu ?

### Bloc L — Validation de notre flow (carte de chaleur)

Pour chaque ligne, demander : **OK / Partiel / Manquant / Inutile**

| Flow applicatif | OK ? | Commentaire comptable |
|-----------------|------|------------------------|
| Voir journal ledger + filtres | | |
| Exporter le ledger | | |
| Extourner une écriture | | |
| Voir commissions par période | | |
| Voir détail finance d’une course | | |
| Voir wallets 2 soldes | | |
| Réconciliation paiements | | |
| Réconciliation cash | | |
| Clôture jour / mois | | |
| Consultation retraits (sans approuver) | | |
| Consultation recharges | | |
| Dashboard KPI compta | | |
| Flux entrées/sorties agrégés | | |

---

## 4. Grille de capture des écarts (à remplir pendant l’entretien)

| # | Écart identifié | Gravité (H/M/B) | Côté (métier / UI / API) | Action proposée |
|---|-----------------|-----------------|--------------------------|-----------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

**Gravité :**
- **H** — bloque la clôture ou la conformité
- **M** — contournement manuel (Excel) systématique
- **B** — confort / cosmétique

---

## 5. Synthèse post-entretien (template)

### 5.1 Flow métier réel (schéma à compléter)

```
[Relevé MM / banque / cash]
        ↓
[Rapprochement ? outil ?]
        ↓
[Écriture / export ledger]
        ↓
[Contrôles quotidiens ?]
        ↓
[Clôture période ?]
        ↓
[Export expert-comptable / direction]
```

### 5.2 Top 5 priorités produit

1. …
2. …
3. …
4. …
5. …

### 5.3 Décisions à trancher

- [ ] Portail `/compta` seul vs fusion avec admin finance
- [ ] Compta centrale vs compta franchise séparée
- [ ] Charges & R&D 40 % dans les écrans ou hors scope
- [ ] Double validation extournes — seuil et workflow

---

## 6. Annexe — pitch 2 minutes modèle UpJunoo (pour la comptable)

> À adapter à l’oral.

« Chez UpJunoo, le client paie le chauffeur **en cash** : l’argent ne passe pas par nous. En revanche, à chaque course, on **prélève une commission** du **portefeuille prépayé** du chauffeur. Ce portefeuille a **deux compartiments** : l’argent qu’il a **rechargé** (retirable) et les **crédits offerts** par la plateforme (non retirable, utilisés en priorité pour payer les commissions). Tout mouvement génère une ligne dans un **journal immuable** : on ne supprime jamais, on **extourne** si erreur. Ton rôle dans l’app, c’est de **voir, rapprocher, clôturer et exporter** — pas d’approuver les paiements. On veut comprendre **ton process actuel** pour que l’écran colle à ton métier. »

---

## 7. Documents liés

| Document | Usage |
|----------|-------|
| `docs/INTERFACE-COMPTABLE-CONTEXT.md` | Vision cible portail compta |
| `docs/ROUTES-BACKEND-INTERFACE-COMPTABLE.md` | Contrat API |
| `docs/module_finance/06-comptabilite.md` | Spec métier comptabilité |
| `docs/FINANCE-CONTEXT.md` | Contexte finance global |
