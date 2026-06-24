# Architecture — `create-react-vite-app-kit`

> Stack : **JavaScript** · **Vite** · **React 19** · **Redux Toolkit** · **RTK Query** · **Axios** · **React Router** · **Tailwind 4** · **shadcn/ui**

---

## 1. Lancer un projet (CLI)

```bash
npx create-react-vite-app-kit mon-projet
cd mon-projet
npm run dev
```

### Ce que fait le générateur

```text
npx create-react-vite-app-kit mon-projet
        │
        ├─► 1. Copie templates/react-vite/ → ./mon-projet/
        ├─► 2. Renomme "name" dans package.json
        └─► 3. Lance npm install
```

```text
create-react-vite-app-kit/          ← package npm (le « lanceur »)
├── bin/
│   └── index.js                    ← script CLI (copie + install)
├── templates/
│   └── react-vite/                 ← squelette copié dans le nouveau projet
│       ├── public/
│       ├── src/
│       ├── package.json
│       ├── vite.config.js
│       └── ...
└── package.json
```

---

## 2. Arborescence complète du projet généré

Légende :

- `[kit]` = présent dans le template npm actuel
- `[+]` = ajout recommandé pour une équipe débutante (à intégrer au kit)
- `[fix]` = correction technique à appliquer dans le kit

```text
mon-projet/
│
├── public/                                    [kit]
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   │
│   ├── app/                                   [+]  Couche « assemblage » (évite un App.jsx fourre-tout)
│   │   ├── App.jsx                            [+]  Point d’entrée UI : providers + router
│   │   ├── router.jsx                         [+]  Agrège toutes les routes des features
│   │   ├── providers.jsx                      [+]  Redux, PersistGate, Toaster, ErrorBoundary
│   │   └── layouts/
│   │       ├── AppLayout.jsx                  [+]  Shell connecté (sidebar + header)
│   │       └── AuthLayout.jsx                 [+]  Shell pages login (centré, minimal)
│   │
│   ├── assets/                                [kit]
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   │
│   ├── core/                                  [kit]  Infrastructure — on y touche rarement
│   │   │
│   │   ├── api/
│   │   │   └── apiSlice.js                    [kit]  RTK Query racine (endpoints injectés par feature)
│   │   │
│   │   ├── auth/
│   │   │   ├── authSlice.js                   [kit]  Token, user, isAuthenticated
│   │   │   ├── authSelectors.js               [kit]  selectCurrentUser, selectAccessToken…
│   │   │   └── useAuth.js                     [kit]  Hook lecture session
│   │   │
│   │   ├── config/
│   │   │   └── env.js                         [+]  Lecture VITE_* (API_URL, REFRESH_URL)
│   │   │
│   │   ├── error/
│   │   │   └── AppErrorBoundary.jsx           [kit]  Catch erreurs React [fix] import Button corrigé
│   │   │
│   │   ├── http/
│   │   │   ├── axiosInstance.js               [kit]  Instance Axios (baseURL = VITE_API_URL)
│   │   │   ├── axiosBaseQuery.js              [kit]  Pont RTK Query → Axios [fix] utiliser `data`
│   │   │   └── interceptors/
│   │   │       ├── request.js                 [kit]  Injecte Bearer token
│   │   │       └── response.js                [kit]  Refresh token + file d’attente [fix] URL .env
│   │   │
│   │   ├── redux/
│   │   │   └── reduxQueryErrorMiddleware.js   [kit]  Toasts sur erreurs API (sauf 401/404)
│   │   │
│   │   └── store/
│   │       └── store.js                         [kit]  Store Redux + persist (whitelist: auth)
│   │
│   ├── shared/                                [kit]  Réutilisable par ≥ 2 features
│   │   ├── components/
│   │   │   └── ui/
│   │   │       ├── button.jsx                 [kit]  shadcn
│   │   │       └── sonner.jsx                 [kit]  Toasts
│   │   ├── hooks/                             [+]  Hooks transverses (ex. usePermission)
│   │   ├── lib/
│   │   │   └── utils.js                       [kit]  cn() Tailwind
│   │   └── utils/
│   │       └── parseApiError.js               [kit]  Message d’erreur lisible
│   │
│   ├── features/                              [kit]  Une feature = un domaine métier
│   │   │
│   │   ├── _template/                         [+]  Dossier à copier pour chaque nouvelle feature
│   │   │   ├── api/
│   │   │   │   └── featureApi.js.example
│   │   │   ├── pages/
│   │   │   │   └── FeatureListPage.jsx.example
│   │   │   ├── routes/
│   │   │   │   └── feature.routes.jsx.example
│   │   │   └── index.js.example
│   │   │
│   │   ├── auth/                              [kit]  Authentification (UI + appels login)
│   │   │   ├── api/
│   │   │   │   └── authApi.js                 [kit]  login, me, logout (injectEndpoints)
│   │   │   ├── components/
│   │   │   │   └── LoginForm.jsx              [+]  Formulaire login (react-hook-form + zod)
│   │   │   ├── guards/
│   │   │   │   └── RequireAuth.jsx            [+]  Redirige vers /login si non connecté
│   │   │   ├── pages/
│   │   │   │   └── LoginPage.jsx              [+]  Page login complète
│   │   │   ├── routes/
│   │   │   │   └── auth.routes.jsx            [kit]  Routes /login [+] branchées dans router
│   │   │   ├── schemas/
│   │   │   │   └── auth.schema.js             [kit]  Validation Zod email / password
│   │   │   └── index.js                       [kit]  Exports publics (hooks, routes, pages)
│   │   │
│   │   └── dashboard/                         [+]  Exemple minimal « page protégée »
│   │       ├── pages/
│   │       │   └── DashboardPage.jsx          [+]  Écran factice post-login
│   │       ├── routes/
│   │       │   └── dashboard.routes.jsx       [+]
│   │       └── index.js                       [+]
│   │
│   ├── main.jsx                               [kit]  Bootstrap React [+] délègue à app/providers
│   ├── index.css                              [kit]  Styles globaux + Tailwind
│   └── App.css                                [kit]  [+] à supprimer ou vider (fini la démo Vite)
│
├── .env.example                               [kit]  [+] documenter VITE_API_URL + VITE_REFRESH_URL
├── components.json                            [kit]  Config shadcn
├── eslint.config.js                           [kit]
├── index.html                                 [kit]
├── jsconfig.json                              [kit]  Alias @ → src/
├── package.json                               [kit]
├── vite.config.js                             [kit]  Alias @ + plugins React + Tailwind
└── README.md                                  [kit]  Règles d’architecture feature-based
```

---

## 3. Rôle de chaque niveau

```text
                    ┌─────────────────────────────────────┐
                    │              app/                    │
                    │  Router, layouts, assemblage global  │
                    └──────────────────┬──────────────────┘
                                       │ importe
           ┌───────────────────────────┼───────────────────────────┐
           ▼                           ▼                           ▼
    ┌─────────────┐            ┌─────────────┐            ┌─────────────────┐
    │   core/     │            │  shared/    │            │   features/     │
    │  technique  │◄───────────│  réutilisé  │───────────►│    métier       │
    │ HTTP, auth  │  import    │  ≥2 features│   import   │ login, clients… │
    └─────────────┘            └─────────────┘            └─────────────────┘
```

| Dossier | Rôle | Qui modifie ? |
|---------|------|----------------|
| `app/` | Router, layouts, providers | Référent front (peu souvent) |
| `core/` | HTTP, tokens, store, erreurs globales | Référent front uniquement |
| `shared/` | UI et utils partagés | Tous (si vraiment réutilisé 2+) |
| `features/` | Écrans et logique métier | Toute l’équipe, au quotidien |

---

## 4. Règle d’import (à afficher en équipe)

```text
┌────────────────────────────────────────────────────────────────┐
│  Où mettre un nouveau fichier ?                                 │
├────────────────────────────────────────────────────────────────┤
│  1. Écran / logique métier        →  features/<nom>/           │
│  2. Composant utilisé 2+ fois     →  shared/                   │
│  3. HTTP, token, store global     →  core/                     │
│  4. Routes + layouts globaux        →  app/                     │
│  5. INTERDIT : features/A importe features/B                    │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Flux applicatif (parcours débutant)

```text
main.jsx
   └── app/providers.jsx
          ├── Redux Provider + PersistGate
          ├── AppErrorBoundary
          ├── Toaster (sonner)
          └── app/App.jsx
                 └── app/router.jsx
                        ├── /login          → features/auth/pages/LoginPage
                        ├── /dashboard      → features/dashboard (RequireAuth)
                        └── *               → redirect /dashboard ou /login
```

### Flux API (une seule pile à retenir)

```text
Page / Composant
      │
      ▼
features/*/api/*Api.js          ← useLoginMutation(), useGetClientsQuery()
      │
      ▼
core/api/apiSlice.js            ← injectEndpoints
      │
      ▼
core/http/axiosBaseQuery.js
      │
      ▼
core/http/axiosInstance.js
      │
      ├── interceptors/request.js    → Bearer token
      └── interceptors/response.js   → refresh 401 + retry
      │
      ▼
Backend (VITE_API_URL)
```

### Où vit l’état ?

```text
┌─────────────────────┬──────────────────────────────────────────┐
│ Données serveur     │ RTK Query (features/*/api/)              │
│ Session (token)     │ core/auth/authSlice (+ redux-persist)    │
│ Filtres, modale, UI │ useState / hook local dans la feature    │
└─────────────────────┴──────────────────────────────────────────┘

Règle équipe : « Redux = auth seulement. Le reste = React normal. »
```

---

## 6. Anatomie d’une feature (modèle à copier)

Chaque nouvelle feature suit la même forme. Pas besoin de tout remplir dès le jour 1.

```text
features/clients/
│
├── api/
│   └── clientsApi.js           # GET liste, POST création… (injectEndpoints)
│
├── components/                 # UI propre à cette feature seulement
│   └── ClientTable.jsx
│
├── hooks/                      # Logique réutilisable dans la feature
│   └── useClientFilters.js
│
├── pages/                      # Pages assemblées (route → page)
│   ├── ClientsListPage.jsx
│   └── ClientDetailPage.jsx
│
├── routes/
│   └── clients.routes.jsx      # Export des <Route> de la feature
│
├── schemas/                    # Validation Zod des formulaires
│   └── client.schema.js
│
└── index.js                    # SEUL point d’export public de la feature
```

**Étapes pour ajouter `clients` :**

1. Copier `features/_template/` → `features/clients/`
2. Créer `api/clientsApi.js`
3. Créer `pages/ClientsListPage.jsx`
4. Créer `routes/clients.routes.jsx`
5. Enregistrer les routes dans `app/router.jsx`
6. Exporter le nécessaire dans `index.js`

---

## 7. Fichiers racine expliqués

| Fichier | Rôle |
|---------|------|
| `vite.config.js` | Build Vite, alias `@` → `src/`, plugins React + Tailwind |
| `jsconfig.json` | Autocomplétion IDE pour l’alias `@/` |
| `components.json` | Config shadcn (chemins composants UI) |
| `.env.example` | Variables : `VITE_API_URL`, `VITE_REFRESH_URL` |
| `package.json` | Scripts : `dev`, `build`, `lint`, `preview` |

---

## 8. Corrections prioritaires dans le kit (checklist mainteneur)

| # | Fichier | Action |
|---|---------|--------|
| 1 | `core/http/axiosBaseQuery.js` | Passer `data: body` à Axios (pas `body`) |
| 2 | `core/http/interceptors/response.js` | URL refresh depuis `import.meta.env.VITE_REFRESH_URL` |
| 3 | `core/error/AppErrorBoundary.jsx` | Import `@/shared/components/ui/button` |
| 4 | `src/App.jsx` | Remplacer démo Vite par délégation vers `app/` |
| 5 | `app/router.jsx` | Créer + brancher auth + dashboard |
| 6 | `features/auth/` | LoginPage + LoginForm + RequireAuth |
| 7 | `features/_template/` | Modèle copiable pour nouvelles features |
| 8 | `.env.example` | Documenter les variables obligatoires |

---
## 10. Résumé en une phrase

Le lanceur **copie un squelette** ; l’équipe travaille surtout dans **`features/`** ; **`core/`** gère HTTP et auth ; **`app/`** assemble routes et layouts ; **`shared/`** ne contient que ce qui est vraiment commun.
