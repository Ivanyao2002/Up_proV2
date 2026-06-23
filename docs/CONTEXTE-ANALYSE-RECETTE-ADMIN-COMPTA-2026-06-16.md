# Contexte — Analyse Plan de recette vs back-office Admin & Compta

> **Date** : 16 juin 2026  
> **Auteur** : COULIBALY ZIE ROMARIC (avec assistance IA — session Cursor)  
> **Projet** : UpJunoo Pro (`Up_prov2`)  
> **Jalon métier visé** : journée de test réel du **dimanche 21 juin 2026** (plan officiel recette & déploiement)

---

## 1. Pourquoi ce travail a été fait

L’équipe dispose d’un document projet officiel — **« Plan complet de recette, test réel, déploiement & migration en production »** (`docs/PLAN DE RECETTE ET DEPLOIEMENT.pdf`, 59 slides) — qui décrit :

- les **8 interfaces web** attendues (admin central, support, finance, partenaire, franchise, reporting, paramétrage, suivi anomalies) ;
- les **18 fonctions** du profil Central / Siège ;
- les **29 use cases** de recette (UC-01 à UC-AU01) ;
- les **22 rapports consolidés** ;
- une **règle métier stricte** : le central **ne recharge pas** les wallets chauffeurs/livreurs (UC-FIN01).

Le back-office Next.js (`Up_prov2`) a évolué de façon autonome (portails `/admin`, `/compta`, `/partner`, `/franchise`, `/dispatch`). Avant le test du 21 juin, il fallait **mesurer l’écart** entre ce que le plan exige et ce que le front expose réellement — en particulier pour **Admin** et **Compta**, les deux portails du siège.

---

## 2. Méthodologie

1. **Extraction** du PDF/PPTX plan de recette (59 slides) en texte exploitable.
2. **Lecture** de la navigation et des routes réelles :
   - `src/portals/admin/adminNav.ts`
   - `src/portals/compta/comptaNav.ts`
   - `src/app/(admin)/admin/**` (75 pages)
   - `src/app/(compta)/compta/**` (11 modules)
3. **Croisement** avec le code métier (ex. `AdminDriverRechargeModal`, retraits compta en `readOnly`).
4. **Comparaison** use case par use case et fonction par fonction.
5. **Priorisation** des écarts en P0 (bloquant recette), P1, P2.

Aucune modification de code n’a été faite dans cette phase : **analyse et documentation uniquement**.

---

## 3. Livrables produits

| Fichier | Rôle | Public |
|---------|------|--------|
| [`docs/ANALYSE-PLAN-RECETTE-ADMIN-COMPTA.md`](./ANALYSE-PLAN-RECETTE-ADMIN-COMPTA.md) | Analyse détaillée (~457 lignes) : inventaires écran par écran, matrices UC, 22 rapports, checklist jour J | Équipe technique, chef de projet |
| [`docs/RAPPORT_COULIBALY_ZIE_ROMARIC-16062026.html`](./RAPPORT_COULIBALY_ZIE_ROMARIC-16062026.html) | Rapport visuel 6 pages (style UPJUNOO : couverture teal/or, KPI, tableaux, priorités) — imprimable en PDF | Direction, recette, comité Go/No-Go |
| [`docs/_extract-plan-recette.txt`](./_extract-plan-recette.txt) | Texte brut extrait du PDF plan (support interne) | Référence rapide |
| Ce fichier | **Contexte** : pourquoi, comment, quoi retenir, suite | Onboarding, reprise de session IA, handover |

---

## 4. Synthèse des conclusions

### Niveau de préparation estimé

| Périmètre | Score | Commentaire |
|-----------|-------|-------------|
| Portail **Admin** vs 18 fonctions Central | **~70 %** | Socle solide (réseau, flotte, finance, support, paramétrage) |
| Portail **Compta** vs profil Finance | **~85 %** | Bien aligné : consultation, journal, périodes, réconciliation |
| **Reporting** (22 rapports slide 21) | **~55 %** | KPI partiels ; taux annulation/acceptation/finalisation absents |
| **Multiservices** (VTC, livraison, fret, location) | **~45 %** | Admin centré VTC ; fret → partenaire ; location absente |

### Points alignés avec le plan

- Réseau : franchises, zones, partenaires (+ gestion comptables).
- Flotte : chauffeurs, véhicules, KYC, clients.
- Opérations : dashboard, carte live, courses, SOS.
- Finance admin : transactions, commissions, règles, réconciliation, retraits.
- Compta : flux, ledger, commissions, wallets, périodes, exports CSV, retraits **lecture seule**.
- Support : tickets et chat dans l’admin.
- Paramétrage : tarifs, commissions, bonus, rôles, audit, intégrations, météo.

### Écarts critiques (P0 — avant le 21 juin)

1. **UC-FIN01** — Le plan interdit la recharge wallet chauffeur depuis le central ; l’admin a `/admin/finance/driver-transfers` avec modal de recharge → **non conforme** tant qu’aucune dérogation produit n’est actée.
2. **Dispatch** — Pages `/admin/ops/dispatch` et `/admin/settings/dispatchers` **existent** mais entrées **commentées** dans `adminNav.ts` → exploitation centrale peu visible le jour J.
3. **Règles dispatch** — UI sur mock `settings/dispatch-rules` ; API réelle = `dispatch-config` (documenté dans `BACKEND-RESPONSES-DISPATCH-METEO.md`).

### Écarts importants (P1)

- Dashboard admin : filtre franchise seulement (plan UC-C01 demande service, zone, partenaire).
- Reporting multiservices incomplet (UC-C02).
- Workflow réclamation → validation finance → crédit wallet (UC-S01) non guidé.
- Exports compta surtout CSV (plan demande aussi Excel/PDF).
- Lien compta → `/admin/finance` qui peut brouiller la séparation des rôles.

---

## 5. Décisions attendues de l’équipe

| Sujet | Options | Impact recette |
|-------|---------|----------------|
| Recharge chauffeur admin | Désactiver UI / garder avec dérogation écrite | UC-FIN01 pass/fail |
| Dispatch dans la nav | Réactiver sidebar ou documenter accès `/dispatch` | Exploitation jour J |
| Brancher `dispatch-config` | Remplacer mock avant test | Paramétrage dispatch fiable |
| Go/No-Go 21 juin | Accepter écarts P2 (livreurs, location, reporting) | Périmètre recette réaliste |

---

## 6. Suite recommandée (hors scope analyse)

1. **Arbitrage produit** sur UC-FIN01 (recharge central).
2. **Correctifs front P0** : nav dispatch, dispatch-config v1.
3. **Exécuter la checklist** section 10 de `ANALYSE-PLAN-RECETTE-ADMIN-COMPTA.md` le 21/06.
4. **Tenir un registre anomalies** (interface #08 du plan — aujourd’hui seulement audit partiel).
5. Mettre à jour ce contexte et le rapport HTML après chaque correction.

---

## 7. Références

- Plan source : `docs/PLAN DE RECETTE ET DEPLOIEMENT.pdf`
- API dispatch/météo : `docs/BACKEND-RESPONSES-DISPATCH-METEO.md`
- Écarts API globaux : `docs/RAPPORT-ECARTS-API-BACKEND.md`
- Nav admin : `src/portals/admin/adminNav.ts`
- Nav compta : `src/portals/compta/comptaNav.ts`

---

*Document de contexte — à joindre aux livrables d’analyse du 16/06/2026 pour toute reprise de travail (humaine ou IA).*
