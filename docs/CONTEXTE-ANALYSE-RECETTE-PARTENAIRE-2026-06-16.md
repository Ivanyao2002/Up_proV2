# Contexte — Analyse Plan de recette vs back-office Partenaire

> **Date** : 16 juin 2026  
> **Auteur** : COULIBALY ZIE ROMARIC (avec assistance IA — session Cursor)  
> **Projet** : UpJunoo Pro (`Up_prov2`)  
> **Jalon métier visé** : journée de test réel du **dimanche 21 juin 2026** (plan officiel recette & déploiement)

---

## 1. Pourquoi ce travail a été fait

Suite à l’analyse **Admin & Compta** ([`CONTEXTE-ANALYSE-RECETTE-ADMIN-COMPTA-2026-06-16.md`](./CONTEXTE-ANALYSE-RECETTE-ADMIN-COMPTA-2026-06-16.md)), la même méthodologie a été appliquée au **portail Partenaire** (`/partner`), interface **#04** du plan de recette.

Le plan (slides **5.5**, **9–10**, **13**, **20**, **39**) définit le partenaire comme **acteur central de la chaîne wallet** :

```
Mobile Money / Carte → Wallet partenaire → Wallets chauffeurs (cascade)
```

Contrairement au central (qui ne doit pas recharger les chauffeurs — UC-FIN01), le partenaire **doit** pouvoir alimenter son wallet puis recharger sa flotte. Il faut mesurer si le front actuel couvre ce scénario avant le 21 juin.

---

## 2. Méthodologie

1. **Extraction** des slides partenaire du PDF plan → `docs/_extract-plan-partenaire.txt`.
2. **Lecture** navigation et routes :
   - `src/portals/partner/partnerNav.ts` (~40 entrées, plusieurs commentées)
   - `src/app/(partner)/partner/**` (~40 pages)
3. **Croisement** code métier : `PartnerWalletPage`, `PartnerDriverRechargeModal`, fret, location, `PartnerModuleGuard`.
4. **Comparaison** avec les **13 fonctionnalités** slide 5.5, reporting slide 20, UC-P01, UC-P02, UC-FIN01.
5. **Priorisation** P0 / P1 / P2.

**Analyse et documentation uniquement** — aucune modification de code.

---

## 3. Livrables produits

| Fichier | Rôle | Public |
|---------|------|--------|
| [`docs/ANALYSE-PLAN-RECETTE-PARTENAIRE.md`](./ANALYSE-PLAN-RECETTE-PARTENAIRE.md) | Analyse détaillée : inventaires, 13 fonctions, UC, checklist jour J | Équipe technique, chef de projet |
| [`docs/RAPPORT_COULIBALY_ZIE_ROMARIC-PARTENAIRE-16062026.html`](./RAPPORT_COULIBALY_ZIE_ROMARIC-PARTENAIRE-16062026.html) | Rapport visuel 6 pages (style UPJUNOO) — imprimable PDF | Direction, recette, comité Go/No-Go |
| [`docs/_extract-plan-partenaire.txt`](./_extract-plan-partenaire.txt) | Texte extrait slides partenaire / franchise / UC-P | Référence interne |
| Ce fichier | Contexte, synthèse, suite | Reprise session, handover |

**Documents liés (autres portails)** :

- [`docs/ANALYSE-PLAN-RECETTE-ADMIN-COMPTA.md`](./ANALYSE-PLAN-RECETTE-ADMIN-COMPTA.md)
- [`docs/CONTEXTE-ANALYSE-RECETTE-ADMIN-COMPTA-2026-06-16.md`](./CONTEXTE-ANALYSE-RECETTE-ADMIN-COMPTA-2026-06-16.md)

---

## 4. Synthèse des conclusions

### Niveau de préparation estimé — Partenaire

| Périmètre | Score | Commentaire |
|-----------|-------|-------------|
| **13 fonctionnalités** slide 5.5 | **~75 %** | 8 OK, 3 partielles, 2 absentes (top-up MM/CB) |
| **Flotte & opérations** | **~85 %** | Dashboard, map, courses, chauffeurs, véhicules |
| **Finance cascade** | **~75 %** | Recharge chauffeur OK ; **alimentation wallet partenaire absente** |
| **Multiservices** (fret, location) | **~65 %** | UI présente ; flux plan à valider |
| **Reporting slide 20** | **~70 %** | Reports + performance ; KYC pending hors nav |
| **Réclamations** | **~50 %** | Chat support sans workflow UC-S01 |

### Points alignés avec le plan

- Rattachement chauffeurs & véhicules (UC-P02) — CRUD complet.
- Suivi activité : dashboard, carte live, courses, performance.
- Revenus & commissions : wallet, revenue, ledger, settlements.
- **Recharge cascade chauffeurs** : `PartnerDriverRechargeModal` + historique `driver-transfers` (UC-FIN01 voie 2.c).
- Documents chauffeur / véhicule / partenaire.
- Fret (offres) et location (avec guard module).
- Prise de commande taxi + livraison (`bookings/new`).

### Écarts critiques (P0 — avant le 21 juin)

1. **Recharge wallet partenaire Mobile Money + Carte** (slides 5.5, 13) — **aucune UI** dans `PartnerWalletPage` ; API `LINKS.partner.wallet` sans endpoint top-up côté front.
2. **UC-P02 cloisonnement** — à prouver en test avec **2 comptes partenaires** (plan : 3–5 pilotes).
3. **Fret UC-F01** — le plan décrit demande **client** → devis partenaire ; le front gère surtout des **offres** partenaire → clarifier le scénario recette.

### Écarts importants (P1)

- Pages **KYC / pending** (`/partner/drivers/pending`, `/partner/fleet/pending`) **hors navigation**.
- **Livreurs** : pas de vue dédiée (livraison via service `delivery` dans bookings).
- **Réclamations** : chat seulement, pas de tickets structurés UC-S01.
- Exports rapports Excel/PDF à valider.

---

## 5. Décisions attendues de l’équipe

| Sujet | Options | Impact recette |
|-------|---------|----------------|
| Top-up wallet partenaire | Développer UI MM/CB ou crédit manuel backend documenté | UC-FIN01 voies 2.a/2.b pass/fail |
| Flux fret | Offres partenaire vs demandes client entrantes | UC-F01 |
| KYC pending | Réactiver entrées nav ou URL documentée | Conformité slide 20 |
| Go/No-Go 21 juin | Accepter écarts P2 (RBAC membres, GPS) | Périmètre réaliste |

---

## 6. Suite recommandée

1. **Arbitrage produit** sur top-up wallet partenaire (bloquant UC-FIN01).
2. **Préparer 2 comptes partenaires** pour test cloisonnement UC-P02.
3. Exécuter la **checklist** section 9 de `ANALYSE-PLAN-RECETTE-PARTENAIRE.md` le 21/06.
4. Enchaîner avec analyse **Franchise** (même méthodo) si besoin.
5. Mettre à jour ce contexte après correctifs front.

---

## 7. Références

- Plan source : `docs/PLAN DE RECETTE ET DEPLOIEMENT.pdf`
- Nav partenaire : `src/portals/partner/partnerNav.ts`
- Wallet : `src/features/partner/pages/PartnerWalletPage.tsx`
- API : `src/core/api/links.ts` → `partner`
- Analyse admin/compta : `docs/ANALYSE-PLAN-RECETTE-ADMIN-COMPTA.md`

---

*Document de contexte — à joindre aux livrables d’analyse Partenaire du 16/06/2026.*
