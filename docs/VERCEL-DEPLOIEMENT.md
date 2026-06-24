# Contexte — Déploiement Vercel (UpJunoo Pro)

Document de référence pour l’équipe front **Up_prov2** : hébergement, variables d’environnement, et flux Git → Vercel.

---

## Projet Vercel

| Élément | Valeur |
|--------|--------|
| **Projet** | `up-prov2` |
| **Équipe Vercel** | `coulromarics-projects` |
| **URL production** | [https://up-prov2.vercel.app](https://up-prov2.vercel.app) |
| **Stack** | Next.js 15 (App Router) — détection automatique |
| **Build** | `npm run build` |
| **Dépôt Git** | `https://github.com/smartromaric/Up_proV2` |

Dashboard : [vercel.com/coulromarics-projects/up-prov2](https://vercel.com/coulromarics-projects/up-prov2)

---

## Règle principale : chaque push déclenche un déploiement

Le dépôt GitHub est (ou doit être) **connecté** au projet Vercel.

```
git commit → git push → Vercel build automatique → URL mise à jour
```

| Branche / événement | Comportement Vercel |
|---------------------|---------------------|
| Push sur **`main`** | Déploiement **Production** (`up-prov2.vercel.app`) |
| Push sur autre branche | Déploiement **Preview** (URL unique par commit) |
| Pull Request ouverte | Preview + commentaire Vercel sur la PR |

**Conséquence :** tout ce qui est mergé ou poussé sur `main` est visible en prod après le build (1–3 min). Pas besoin de `vercel --prod` manuel si le lien Git est actif.

> Si la connexion GitHub a échoué à la création du projet, la reconnecter dans **Settings → Git** sur Vercel. Sans ce lien, seul `vercel --prod` en local déploie.

---

## Variables d’environnement

Configurées dans **Project → Settings → Environment Variables** (ou CLI `vercel env`).

### Obligatoires (Production + Preview recommandé)

| Variable | Exemple prod | Rôle |
|----------|--------------|------|
| `NEXT_PUBLIC_API_URL` | `https://api.upjunoo-dev.tech` | Base API |
| `NEXT_PUBLIC_USE_MOCKS` | `false` | Désactive MSW |
| `NEXT_PUBLIC_USE_REAL_AUTH` | `true` | Auth Supabase /v1 |
| `NEXT_PUBLIC_APP_NAME` | `UpJunoo Pro` | Titre app |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | `pk.eyJ...` | Carte Mapbox (live, zones) |

### À ne pas mettre en prod

- `NEXT_PUBLIC_DEV_ADMIN_EMAIL` / `NEXT_PUBLIC_DEV_ADMIN_PASSWORD` — réservés au dev local (`.env.local`).

### Point critique : `NEXT_PUBLIC_*` = build time

Les variables préfixées `NEXT_PUBLIC_` sont **incluses dans le bundle JavaScript au moment du build**.  
Modifier une variable sur Vercel **sans redéployer** ne change rien côté navigateur.

**Après toute modification d’env :**

1. Vérifier la valeur (dashboard ou `vercel env pull .env.check --environment=production`)
2. Redéployer : push sur `main` **ou** `vercel --prod`

Cas vécu : `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` enregistré vide → carte sans Mapbox en prod malgré config locale OK.

---

## Mapbox en production

1. Token **non vide** sur Vercel (voir ci-dessus + redeploy).
2. **Restrictions URL** sur [account.mapbox.com/access-tokens](https://account.mapbox.com/access-tokens/) :
   - `https://up-prov2.vercel.app/*`
   - `https://*.vercel.app/*` (previews)

Sans ces URLs, les tuiles Mapbox renvoient 401 en prod.

---

## API backend (CORS)

Le front appelle l’API **depuis le navigateur**. Le backend doit autoriser :

- `https://up-prov2.vercel.app`
- `https://*.vercel.app` (previews)

Sinon : login OK en local, échec réseau en prod.

---

## Workflow développeur

### Déploiement standard (recommandé)

```bash
git add .
git commit -m "feat: …"
git push origin main
# → Vercel build + prod automatique
```

Suivre l’état : onglet **Deployments** sur Vercel ou notification GitHub.

### Déploiement manuel (secours)

```bash
npm i -g vercel          # une fois
vercel login             # une fois
vercel link              # une fois, si pas déjà lié

vercel --prod            # force un deploy production depuis la machine locale
```

### Gestion des variables (CLI)

```bash
# Ajouter
vercel env add NEXT_PUBLIC_API_URL production

# Corriger une valeur
vercel env update NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN production --value "pk.…" -y

# Lister
vercel env ls production

# Télécharger pour vérif locale (ne pas committer le fichier généré)
vercel env pull .env.vercel.production --environment=production
```

---

## Build local avant push (optionnel)

```bash
npm run build
```

Le build Vercel ignore le lint (`eslint.ignoreDuringBuilds` dans `next.config.ts`) mais **vérifie TypeScript**. Un échec `tsc` bloque le deploy.

---

## Fichiers sensibles

| Fichier | Git | Vercel |
|---------|-----|--------|
| `.env.local` | ❌ jamais | — |
| `.env.example` | ✅ modèle sans secrets | — |
| `.vercel/` | ❌ (config locale CLI) | — |

---

## Checklist post-déploiement

- [ ] [https://up-prov2.vercel.app/login](https://up-prov2.vercel.app/login) — page charge
- [ ] `/admin/login` — connexion compte dev / prod
- [ ] `/admin/ops/map` — Mapbox + chauffeurs (pas grille CSS fallback)
- [ ] `/admin/network/zones` — carte zones
- [ ] Console navigateur : pas d’erreur CORS ni 401 Mapbox

---

## Résumé pour l’agent / l’équipe

1. **Prod = chaque push sur `main`** (si Git connecté à Vercel).
2. **Env `NEXT_PUBLIC_*`** → toujours **rebuild** après changement.
3. **Mapbox** → token rempli + URLs Vercel autorisées sur le token.
4. **API** → CORS domaine Vercel côté backend.
5. Secours local : `vercel --prod` après `vercel login` + projet lié.

---

*Dernière mise à jour : juin 2026 — projet `up-prov2` / repo `Up_proV2`.*
