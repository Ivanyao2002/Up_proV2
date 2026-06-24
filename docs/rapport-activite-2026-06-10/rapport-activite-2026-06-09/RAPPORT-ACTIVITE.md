# Rapport d'activité — UpJunoo Pro Back-office

**Date :** 9 juin 2026  
**Projet :** UpJunoo Pro (portail admin)  
**Environnement :** `localhost:3000` · API `api.upjunoo-dev.tech`

---

## Synthèse de la journée

Intégration et stabilisation du back-office admin : branchement API v1 (marketing, finance, wallet chauffeur), corrections UX (carte live, listes après suppression, libellé véhicule), enrichissement réseau (franchise, partenaire) et documentation des demandes backend restantes.

| Domaine | Livrables principaux |
|---------|---------------------|
| **Flotte / KYC** | Documents recto/verso chauffeur, wallet sur fiche chauffeur |
| **Finance** | Fiches détail transaction et retrait, dashboard finance |
| **Marketing** | Migration routes v1 (promos, campagnes, bannières) |
| **Réseau** | Contact franchise, suppression partenaire, activate/suspend |
| **Opérations** | Navigation carte live → course/chauffeur, libellé véhicule course |
| **Technique** | DELETE sans body JSON, cache listes après suppression, URL retour login |
| **Documentation** | `DEMANDES-2026-06-09.md` (MK-BAN-01, UX-LIST-DELETE-01, OR-TRACK-01) |

---

## Captures d'écran

> Dossier : `docs/rapport-activite-2026-06-09/screenshots/`  
> Génération : `node scripts/capture-activity-screenshots.mjs` (Playwright)

### Opérations

| Écran | Capture |
|-------|---------|
| Tableau de bord | ![Dashboard](./screenshots/01-dashboard.png) |
| Carte live | ![Carte live](./screenshots/02-carte-live.png) |
| Liste courses | ![Courses](./screenshots/03-courses-liste.png) |
| Détail course | ![Détail course](./screenshots/20-course-detail.png) |

### Réseau

| Écran | Capture |
|-------|---------|
| Liste franchises | ![Franchises](./screenshots/04-franchises-liste.png) |
| Détail franchise | ![Détail franchise](./screenshots/22-franchise-detail.png) |
| Liste partenaires | ![Partenaires](./screenshots/05-partenaires-liste.png) |
| Détail partenaire | ![Détail partenaire](./screenshots/21-partenaire-detail.png) |

### Flotte

| Écran | Capture |
|-------|---------|
| Liste chauffeurs | ![Chauffeurs](./screenshots/06-chauffeurs-liste.png) |
| Détail chauffeur (KYC) | ![Détail chauffeur](./screenshots/23-chauffeur-detail.png) |
| Liste véhicules | ![Véhicules](./screenshots/07-vehicules-liste.png) |
| File KYC | ![KYC](./screenshots/08-kyc-file.png) |

### Finance

| Écran | Capture |
|-------|---------|
| Dashboard finance | ![Finance](./screenshots/09-finance-dashboard.png) |
| Transactions | ![Transactions](./screenshots/10-transactions-liste.png) |
| Détail transaction | ![Détail transaction](./screenshots/24-transaction-detail.png) |
| Retraits | ![Retraits](./screenshots/11-retraits-liste.png) |
| Détail retrait | ![Détail retrait](./screenshots/25-retrait-detail.png) |

### Marketing

| Écran | Capture |
|-------|---------|
| Bannières | ![Bannières](./screenshots/12-marketing-bannieres.png) |
| Nouvelle bannière | ![Nouvelle bannière](./screenshots/13-marketing-banniere-new.png) |
| Codes promo | ![Promos](./screenshots/14-marketing-promos.png) |
| Campagnes | ![Campagnes](./screenshots/15-marketing-campagnes.png) |

---

## Détail des réalisations

### 1. Intégrations API v1

- **Marketing** : listes promos, campagnes, bannières via `/v1/admin/marketing/…` (remplace les routes mock `/api/v2`).
- **Finance** : pages détail transaction (`/admin/finance/transactions/{id}`) et retrait (`/admin/finance/withdrawals/{id}`).
- **Wallet chauffeur** : solde et ledger sur la fiche chauffeur admin.

### 2. Réseau

- **Franchise** : affichage email/téléphone contact (`metadata.contactEmail` / `contactPhone`).
- **Partenaire** : boutons activer / suspendre / supprimer sur la fiche détail.
- **Suppression partenaire** : `DELETE /v1/admin/partners/{id}` (correction header HTTP sans body JSON).

### 3. Opérations

- **Carte live** : liens « Voir la course » / « Voir le chauffeur » — navigation client-side + URL de retour après login.
- **Détail course** : correction affichage véhicule (`[object Object]` → libellé correct type « Toyota Yaris · BF-… »).

### 4. UX / technique

- **Listes après suppression** : helper `refreshListCachesAfterDelete` (partenaires + franchises).
- **Auth** : paramètre `?from=` conservé après expiration de session.

### 5. Documentation backend

Fichier `docs/DEMANDES-2026-06-09.md` enrichi :

- **MK-BAN-01** — bannières sans image, POST création cassé, pas d'upload.
- **UX-LIST-DELETE-01** — rafraîchissement listes après DELETE.
- **OR-TRACK-01** — suivi trajectoire dynamique chauffeur (demande backend).

---

## Points en attente (backend)

| ID | Sujet |
|----|-------|
| MK-BAN-01 | Image bannière + correction table `app_banners` |
| PA-STATUS-01 | Activation partenaire côté API |
| FLT-COMPLIANCE-01 | Filtres complétude documents en liste |
| OR-TRACK-01 | Phases navigation + trajectoire GPS |

---

## Rejouer les captures

```bash
# Terminal 1 — serveur dev
npm run dev

# Terminal 2 — captures (21 écrans)
node scripts/capture-activity-screenshots.mjs
```

Variables optionnelles : `SCREENSHOT_BASE_URL`, `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PASSWORD`.

---

*Rapport généré automatiquement — 9 juin 2026*
