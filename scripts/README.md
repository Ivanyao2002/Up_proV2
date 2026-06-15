# Scripts de Test et Audit

Ce dossier contient les scripts utilitaires pour tester, auditer et valider l'API backend.

## Scripts disponibles

### `test-tab-features.mjs` - Test complet d'un onglet/portail

Script pour tester toutes les fonctionnalités d'un onglet ou portail spécifique.

**Usage:**
```bash
node scripts/test-tab-features.mjs <portail> [section]
```

**Exemples:**
```bash
# Tester tout le portail admin
node scripts/test-tab-features.mjs admin

# Tester seulement la section finance du portail admin
node scripts/test-tab-features.mjs admin finance

# Tester le portail franchise
node scripts/test-tab-features.mjs franchise

# Tester seulement la section marketing du portail franchise
node scripts/test-tab-features.mjs franchise marketing

# Tester le portail partner
node scripts/test-tab-features.mjs partner fleet

# Tester le portail dispatch
node scripts/test-tab-features.mjs dispatch console
```

**Portails et sections disponibles:**
- **admin**: operations, network, fleet, finance, marketing, support, settings
- **franchise**: territoire, flotte, finance, marketing, support
- **partner**: fleet, activite, finance, support
- **dispatch**: console

**Rapport généré:**
Le script génère automatiquement un rapport Markdown (`test-report-{portail}-{section}-{timestamp}.md`) avec:
- ✅ Fonctionnalités qui fonctionnent correctement
- ⚠️ Fonctionnalités partielles (réponses vides, permissions manquantes)
- ❌ Endpoints manquants (404, 501)
- 🐛 Bugs détectés (erreurs 500)
- 📊 Problèmes de données (listes vides, champs manquants)

**Variables d'environnement:**
```bash
NEXT_PUBLIC_API_URL=https://api.upjunoo-dev.tech  # URL de l'API
TEST_ADMIN_EMAIL=dev.admin@upjunoo-dev.tech        # Email de test
TEST_ADMIN_PASSWORD=Upjunoo@Dev2026!              # Mot de passe de test
REPORT_FILE=mon-rapport.md                        # Chemin du rapport personnalisé
```

---

### `audit-backend-demandes.mjs` - Audit des demandes backend

Vérifie si les demandes listées dans BACKEND-DEMANDES-V1.md sont satisfaites.

**Usage:**
```bash
node scripts/audit-backend-demandes.mjs
```

---

### `audit-swagger-gaps.mjs` - Comparaison Swagger vs API live

Compare les chemins définis dans SWAGGER.md avec les endpoints réellement disponibles.

**Usage:**
```bash
node scripts/audit-swagger-gaps.mjs
```

---

### `diff-swagger-live.mjs` - Diff entre Swagger et implémentation

Identifie les écarts entre la spécification Swagger et l'implémentation réelle.

**Usage:**
```bash
node scripts/diff-swagger-live.mjs
```

---

### `test-order-detail-routes.mjs` - Test des routes de détail des commandes

Teste les différentes routes de détail pour une commande.

**Usage:**
```bash
node scripts/test-order-detail-routes.mjs
```

---

### `test-partners-api.mjs` - Test de l'API partenaires

Tests spécifiques pour les endpoints partenaires.

**Usage:**
```bash
node scripts/test-partners-api.mjs
```

---

### `test-v1-api.mjs` - Test général de l'API v1

Tests généraux pour valider l'API v1.

**Usage:**
```bash
node scripts/test-v1-api.mjs
```

---

### `capture-activity-screenshots.mjs` - Capture de screenshots

Utilitaire pour capturer des screenshots des pages d'activité.

**Usage:**
```bash
node scripts/capture-activity-screenshots.mjs
```

---

## Configuration commune

Tous les scripts utilisent les variables d'environnement suivantes:

| Variable | Défaut | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://api.upjunoo-dev.tech` | URL de base de l'API |
| `TEST_ADMIN_EMAIL` | `dev.admin@upjunoo-dev.tech` | Email pour l'authentification |
| `TEST_ADMIN_PASSWORD` | `Upjunoo@Dev2026!` | Mot de passe pour l'authentification |

## Exécution avec des variables personnalisées

```bash
# Exemple avec API locale
NEXT_PUBLIC_API_URL=http://localhost:3001 node scripts/test-tab-features.mjs admin

# Exemple avec rapport personnalisé
REPORT_FILE=rapport-admin.md node scripts/test-tab-features.mjs admin finance
```
