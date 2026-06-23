# Rapports d'activité UpJunoo Pro — contexte & procédure

Document de référence pour générer les rapports journaliers du back-office : captures automatiques Playwright, HTML brandé, export PDF.

## Objectif

Produire chaque jour (ou à la fin d'une session de travail) un livrable client :

| Livrable | Chemin | Format |
|----------|--------|--------|
| Captures PNG | `docs/rapport-activite-YYYY-MM-DD/screenshots/` | 21 écrans admin |
| Manifeste | `docs/rapport-activite-YYYY-MM-DD/manifest.json` | Résultat des captures |
| Rapport HTML | `docs/RAPPORT-DDMMYYYY.html` | 10 pages, teal/or |
| Rapport PDF | `docs/RAPPORT-DDMMYYYY.pdf` | Export A4 imprimable |

**Modèles de référence :** `docs/RAPPORT-08062026.html`, `docs/RAPPORT-09062026.html`

## Prérequis

1. **Serveur local** : `npm run dev` sur `http://localhost:3000`
2. **API live** : `USE_MOCKS=false` (auth réelle via proxy `/upjunoo-api`)
3. **Playwright** (une fois par machine) :
   ```bash
   npm install --no-save playwright
   npx playwright install chromium
   ```
4. **Compte admin dev** (défaut du script) :
   - Email : `dev.admin@upjunoo-dev.tech`
   - Mot de passe : `Upjunoo@Dev2026!`
   - Surcharge : variables `DEV_ADMIN_EMAIL` / `DEV_ADMIN_PASSWORD`

## Workflow complet (agent ou humain)

### 1. Préparer le contenu métier

Renseigner ou mettre à jour `docs/DEMANDES-YYYY-MM-DD.md` avec :

- Tâches réalisées (IDs, statuts)
- Endpoints intégrés vs bloqués
- Demandes backend P0/P1

### 2. Lancer les captures automatiques

```bash
# Terminal 1 — serveur
npm run dev

# Terminal 2 — captures (date du jour)
node scripts/capture-activity-screenshots.mjs 2026-06-09
```

Le script :

1. Se connecte à `/admin/login`
2. Parcourt **15 pages statiques** (listes, dashboards)
3. Ouvre **6 pages dynamiques** (premier lien détail depuis chaque liste)
4. Sauvegarde les PNG en `docs/rapport-activite-YYYY-MM-DD/screenshots/`
5. Écrit `manifest.json` avec succès/échecs

**Variables utiles :**

```bash
SCREENSHOT_BASE_URL=http://localhost:3000 node scripts/capture-activity-screenshots.mjs 2026-06-09
REPORT_DATE=2026-06-09 node scripts/capture-activity-screenshots.mjs
```

### 3. Créer le HTML du rapport

Copier le dernier rapport (`RAPPORT-09062026.html`) vers `docs/RAPPORT-DDMMYYYY.html` et adapter :

| Section | Contenu à mettre à jour |
|---------|-------------------------|
| Couverture | Date, titre du jour, focus |
| Page 2 | KPIs, % intégration, tableau domaines |
| Page 3 | Tâches réalisées (depuis DEMANDES) |
| Page 4 | Endpoints intégrés |
| Pages 5–9 | Blocs `<img src="rapport-activite-YYYY-MM-DD/screenshots/XX-....png">` |
| Page 10 | Reste à faire |

**Convention chemins images** (relatifs depuis `docs/`) :

```html
<img src="rapport-activite-2026-06-09/screenshots/01-dashboard.png" alt="Dashboard"/>
```

**Numérotation captures :**

| Slug | Écran |
|------|-------|
| `01-dashboard` … `15-marketing-campagnes` | Pages listes / formulaires |
| `20-course-detail` … `25-retrait-detail` | Fiches détail (depuis listes) |

### 4. Générer le PDF

```bash
node docs/generate-rapport-pdf.mjs RAPPORT-09062026
```

Produit `docs/RAPPORT-09062026.pdf` via Chrome/Edge headless (Windows) ou Puppeteer.

Ouvrir le HTML dans le navigateur pour prévisualiser avant PDF.

## Structure des fichiers

```
docs/
├── RAPPORT-ACTIVITE-CONTEXT.md      ← ce fichier
├── DEMANDES-YYYY-MM-DD.md           ← contenu métier du jour
├── RAPPORT-DDMMYYYY.html            ← rapport final
├── RAPPORT-DDMMYYYY.pdf
├── generate-rapport-pdf.mjs         ← export PDF
└── rapport-activite-YYYY-MM-DD/
    ├── manifest.json
    └── screenshots/
        ├── 01-dashboard.png
        ├── ...
        └── 25-retrait-detail.png

scripts/
└── capture-activity-screenshots.mjs ← Playwright headless
```

## Pages capturées (script actuel)

### Statiques (`STATIC_PAGES`)

| Slug | Route admin |
|------|-------------|
| `01-dashboard` | `/admin/dashboard` |
| `02-carte-live` | `/admin/ops/map` |
| `03-courses-liste` | `/admin/ops/trips` |
| `04-franchises-liste` | `/admin/network/franchises` |
| `05-partenaires-liste` | `/admin/network/partners` |
| `06-chauffeurs-liste` | `/admin/fleet/drivers` |
| `07-vehicules-liste` | `/admin/fleet/vehicles` |
| `08-kyc-file` | `/admin/fleet/kyc` |
| `09-finance-dashboard` | `/admin/finance` |
| `10-transactions-liste` | `/admin/finance/transactions` |
| `11-retraits-liste` | `/admin/finance/withdrawals` |
| `12-marketing-bannieres` | `/admin/marketing/banners` |
| `13-marketing-banniere-new` | `/admin/marketing/banners/new` |
| `14-marketing-promos` | `/admin/marketing/promos` |
| `15-marketing-campagnes` | `/admin/marketing/campaigns` |

### Dynamiques (`DYNAMIC_PAGES`)

Premier lien « détail » cliqué depuis la liste associée.

| Slug | Liste source |
|------|--------------|
| `20-course-detail` | `/admin/ops/trips` |
| `21-partenaire-detail` | `/admin/network/partners` |
| `22-franchise-detail` | `/admin/network/franchises` |
| `23-chauffeur-detail` | `/admin/fleet/drivers` |
| `24-transaction-detail` | `/admin/finance/transactions` |
| `25-retrait-detail` | `/admin/finance/withdrawals` |

## Ajouter une nouvelle page au script

Éditer `scripts/capture-activity-screenshots.mjs` :

```javascript
// Page fixe
{ slug: "16-support-tickets", path: "/admin/support/tickets", label: "Tickets support" },

// Page détail (depuis liste)
{
  slug: "26-ticket-detail",
  listPath: "/admin/support/tickets",
  linkSelector: 'a[href^="/admin/support/tickets/"]',
  label: "Détail ticket",
},
```

Puis ajouter le bloc capture correspondant dans le HTML du rapport.

## Charte graphique HTML

Reprendre le CSS inline des rapports existants :

- Couleur primaire : `#016d71` (teal)
- Accent : `#f8bb10` (or)
- Police : Inter (Google Fonts)
- Format page : A4 (`210mm × 297mm`), `page-break-after: always`
- Classes : `.cover`, `.kpi`, `.capture`, `.badge-ok`, `.badge-warn`, etc.

## Dépannage

| Problème | Cause probable | Solution |
|----------|----------------|----------|
| `ERR` login | Dev server arrêté | `npm run dev` |
| `SKIP` détail | Liste vide en API | Vérifier données dev ou mock |
| Images cassées dans PDF | Mauvais chemin relatif | Chemins depuis `docs/`, pas absolus |
| Playwright introuvable | Non installé | `npm install --no-save playwright` + `npx playwright install chromium` |
| Timeout réseau | API lente | Relancer ; vérifier proxy API |
| Page login dans capture | Session expirée | Relancer le script (re-login auto) |

## Checklist livraison

- [ ] `DEMANDES-YYYY-MM-DD.md` à jour
- [ ] `npm run dev` actif pendant les captures
- [ ] `manifest.json` : 21/21 OK (ou erreurs documentées)
- [ ] `RAPPORT-DDMMYYYY.html` : date, KPIs, captures, reste à faire
- [ ] `RAPPORT-DDMMYYYY.pdf` généré et lisible
- [ ] Pas de secrets dans les fichiers commités

## Commandes récapitulatives

```bash
# Exemple pour le 10 juin 2026
npm run dev
node scripts/capture-activity-screenshots.mjs 2026-06-10
# → éditer docs/RAPPORT-10062026.html (copie du modèle précédent)
node docs/generate-rapport-pdf.mjs RAPPORT-10062026
```
