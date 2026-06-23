# Demande backend — Provisionnement utilisateurs portails siège

> **Date** : 19 juin 2026  
> **Demandeur** : Équipe front UpJunoo Pro (`Up_prov2`)  
> **Priorité** : **P0** (recette portails Support & Reporting — jalon 21/06)  
> **Références front** :
> - `docs/PORTAILS-LOGIN-PROFILS.md`
> - `src/features/network/api/adminAccountants.*` (modèle comptable)
> - `src/features/auth/api/auth.mapper.ts` (mapping `user_type` → portail)
> - Portails : `/compta/login`, `/support/login`, `/reporting/login`

---

## 1. Contexte

Le back-office expose désormais **7 portails** de connexion. Trois profils **siège** nécessitent des comptes dédiés, distincts de l’admin global :

| Profil | Portail login | `user_type` attendu | Rôle métier |
|--------|---------------|---------------------|-------------|
| **Comptable** | `/compta/login` | `ACCOUNTANT` ou `COMPTA` | Finance, journal, clôtures, exports |
| **Agent support** | `/support/login` | `SUPPORT` | Tickets, chat franchises, anomalies, audit |
| **Analyste reporting** | `/reporting/login` | `REPORTING` | Tableaux consolidés, exports CSV (lecture seule) |

Aujourd’hui :

- Le front **comptable** est prêt (`/admin/network/accountants`, `/compta/*`) mais les routes `LINKS.admin.v1.accountants` ne sont pas encore dans `links.ts` — **à confirmer / livrer côté API**.
- Les portails **Support** et **Reporting** sont branchés en UI ; seuls des comptes **ADMIN** peuvent s’y connecter en attendant les types API dédiés.
- Le plan de recette (slide 26) prévoit **7 comptes centraux** : super-admin, exploitation, finance, **support**, conformité, **reporting**, direction.

**Objectif backend** : permettre à un **admin** de créer, lister, suspendre et réactiver des utilisateurs pour chaque portail siège, sur le **même modèle que les comptables**.

---

## 2. Principe recommandé

### Option A — Routes miroir par profil (recommandée, cohérente avec comptables)

Trois namespaces admin, structure identique :

```
/v1/admin/accountants   ← existant ou à finaliser
/v1/admin/support-agents  ← nouveau
/v1/admin/reporting-users ← nouveau
```

**Avantages** : permissions fines, payloads adaptés par métier, évolution indépendante.

### Option B — Route générique « staff portail »

```
POST /v1/admin/portal-users
{ "portalRole": "ACCOUNTANT" | "SUPPORT" | "REPORTING", ... }
```

**Avantages** : un seul CRUD. **Inconvénient** : validation et champs métier plus complexes.

> **Demande** : livrer au minimum l’**option A** pour `SUPPORT` et `REPORTING`, en alignant `ACCOUNTANT` si pas encore stable.

---

## 3. Routes admin — CRUD (par profil)

Toutes les routes ci-dessous :

- **Auth** : `Authorization: Bearer <token admin>`  
- **Header** : `X-Client-Type: back-office`  
- **Scope** : réservé `user_type = ADMIN` (ou permission `network.staff.manage`)

### 3.1 Comptables (référence — à confirmer)

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/v1/admin/accountants` | Liste paginée |
| `GET` | `/v1/admin/accountants/{userId}` | Fiche |
| `POST` | `/v1/admin/accountants` | Création |
| `POST` | `/v1/admin/accountants/{userId}/suspend` | Suspension |
| `POST` | `/v1/admin/accountants/{userId}/activate` | Réactivation |

### 3.2 Agents support (à créer)

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/v1/admin/support-agents` | Liste paginée |
| `GET` | `/v1/admin/support-agents/{userId}` | Fiche |
| `POST` | `/v1/admin/support-agents` | Création |
| `POST` | `/v1/admin/support-agents/{userId}/suspend` | Suspension |
| `POST` | `/v1/admin/support-agents/{userId}/activate` | Réactivation |

### 3.3 Utilisateurs reporting (à créer)

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/v1/admin/reporting-users` | Liste paginée |
| `GET` | `/v1/admin/reporting-users/{userId}` | Fiche |
| `POST` | `/v1/admin/reporting-users` | Création |
| `POST` | `/v1/admin/reporting-users/{userId}/suspend` | Suspension |
| `POST` | `/v1/admin/reporting-users/{userId}/activate` | Réactivation |

### Query params liste (commun)

```
?page=1&limit=25&search=email@...&status=active|suspended
```

### Réponse liste (format unifié)

```json
{
  "items": [
    {
      "userId": "uuid",
      "email": "agent.support@upjunoo-dev.tech",
      "phone": "+2250700000000",
      "firstName": "Awa",
      "lastName": "Koné",
      "displayName": "Awa Koné",
      "status": "active",
      "active": true,
      "createdAt": "2026-06-19T10:00:00.000Z",
      "country": { "id": "uuid", "code": "CI", "name": "Côte d'Ivoire }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 1,
    "totalPages": 1
  }
}
```

> Le champ `country` est **obligatoire pour ACCOUNTANT** (scope pays). **Optionnel** pour SUPPORT et REPORTING (scope plateforme globale), sauf si vous imposez un périmètre pays.

---

## 4. Corps de création — `POST`

### 4.1 Comptable (existant front)

```json
{
  "email": "compta.ci@upjunoo-dev.tech",
  "password": "MotDePasseSecurise8!",
  "firstName": "Marie",
  "lastName": "Diallo",
  "phone": "+2250102030405",
  "countryId": "uuid-pays",
  "countryCode": "CI"
}
```

### 4.2 Agent support

```json
{
  "email": "support@upjunoo-dev.tech",
  "password": "MotDePasseSecurise8!",
  "firstName": "Awa",
  "lastName": "Koné",
  "phone": "+2250700000000"
}
```

**Effets attendus côté base** :

- Création `auth.users` + `profiles` avec `user_type = SUPPORT`
- Aucun lien `partner_id` / `franchise_id`
- Permissions back-office limitées au périmètre support (voir §6)

### 4.3 Utilisateur reporting

```json
{
  "email": "reporting@upjunoo-dev.tech",
  "password": "MotDePasseSecurise8!",
  "firstName": "Ibrahim",
  "lastName": "Touré",
  "phone": "+2250500000000"
}
```

**Effets attendus** :

- `profiles.user_type = REPORTING`
- Accès **lecture seule** finance / reporting (pas de validation retrait, pas de paramétrage)

### Réponse création (commun)

```json
{
  "userId": "uuid",
  "portalLoginEmail": "support@upjunoo-dev.tech",
  "userType": "SUPPORT",
  "portalLoginPath": "/support/login",
  "country": null
}
```

---

## 5. Auth — login & session

### 5.1 Login (existant)

`POST /v1/auth/login` — inchangé.

Le front envoie email + password depuis le portail cible (`compta`, `support`, `reporting`).  
**Comportement attendu** :

| `profiles.user_type` | Portail autorisé | Refus si autre portail |
|----------------------|------------------|------------------------|
| `ACCOUNTANT` / `COMPTA` | `/compta/login` uniquement | Oui |
| `SUPPORT` | `/support/login` uniquement | Oui |
| `REPORTING` | `/reporting/login` uniquement | Oui |
| `ADMIN` | Tous portails siège + `/admin/login` | — |

Réponse login — champs requis :

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "userType": "SUPPORT",
  "profile": {
    "id": "uuid",
    "email": "support@upjunoo-dev.tech",
    "user_type": "SUPPORT",
    "first_name": "Awa",
    "last_name": "Koné",
    "display_name": "Awa Koné"
  }
}
```

### 5.2 Me — routes portail dédiées

| Route | Profil | Usage front |
|-------|--------|-------------|
| `GET /v1/compta/me` | Comptable ou admin | `ComptaTopbar`, scope pays |
| `GET /v1/support/me` | Support ou admin | **À créer** — `SupportTopbar`, périmètre |
| `GET /v1/reporting/me` | Reporting ou admin | **À créer** — `ReportingTopbar` |

Exemple `GET /v1/support/me` :

```json
{
  "supportAgent": {
    "userId": "uuid",
    "email": "support@upjunoo-dev.tech",
    "firstName": "Awa",
    "lastName": "Koné",
    "displayName": "Awa Koné",
    "status": "active",
    "active": true
  },
  "admin": null
}
```

Si l’appelant est admin en visite transitoire :

```json
{
  "supportAgent": null,
  "admin": { "userId": "uuid", "role": "ADMIN", "allCountries": true }
}
```

---

## 6. Permissions & garde-fous métier

Le front applique des permissions côté nav (RBAC léger). L’API doit **refuser** les actions hors périmètre (403), pas seulement masquer l’UI.

### 6.1 SUPPORT — autorisé

- `GET/POST/PATCH` tickets : `/v1/support/tickets`, litiges
- Chat : `/v1/chat/conversations*`
- Audit : `GET /v1/admin/audit-log` (lecture)
- Courses : `GET /v1/admin/orders/{id}`, forensic GPS (lecture)
- **Interdit** : paramétrage tarifs, validation retraits, recharge wallet, suppression réseau

### 6.2 REPORTING — autorisé

- Dashboard : `GET /v1/admin/dashboard` (lecture)
- Finance : `GET /v1/admin/finance/*` (lecture)
- Exports : `GET /v1/compta/ledger/export`, `GET /v1/compta/reports/export`
- **Interdit** : toute mutation finance (approve withdrawal, reverse ledger, etc.)

### 6.3 ACCOUNTANT — autorisé

- Namespace `/v1/compta/*` (déjà documenté dans `comptaRouteRegistry.ts`)
- Scope **pays** via `country_id` du comptable

---

## 7. Comptes pilotes recette (21/06)

À créer en préprod :

| Email suggéré | `user_type` | Portail |
|---------------|-------------|---------|
| `dev.compta@upjunoo-dev.tech` | `ACCOUNTANT` | `/compta/login` |
| `dev.support@upjunoo-dev.tech` | `SUPPORT` | `/support/login` |
| `dev.reporting@upjunoo-dev.tech` | `REPORTING` | `/reporting/login` |

Mot de passe : procédure dev documentée (hors repo).

---

## 8. Critères d’acceptation

### 8.1 Création

- [ ] Admin crée un agent support via `POST /v1/admin/support-agents`
- [ ] L’agent se connecte sur `/support/login` avec `user_type = SUPPORT`
- [ ] Un compte `PARTNER` ne peut **pas** se connecter sur `/support/login` (erreur 401/403 explicite)
- [ ] Idem reporting avec `POST /v1/admin/reporting-users` + `/reporting/login`

### 8.2 Cycle de vie

- [ ] Suspendre un agent → login refusé + message métier
- [ ] Réactiver → login à nouveau possible

### 8.3 Auth me

- [ ] `GET /v1/support/me` renvoie le profil support
- [ ] `GET /v1/reporting/me` renvoie le profil reporting

### 8.4 Cloisonnement API

- [ ] Agent support : `POST /v1/admin/withdrawals/{id}/approve` → **403**
- [ ] Analyste reporting : mêmes mutations finance → **403**
- [ ] Lecture `GET /v1/admin/finance/transactions` → **200** pour reporting

### 8.5 Swagger

- [ ] Tag dédié **Admin — Staff portails** (ou 3 tags) documenté sur `api.upjunoo-dev.tech/docs`

---

## 9. Intégration front (après livraison API)

Le front branchera :

| Profil | Fichiers à créer / étendre |
|--------|---------------------------|
| Support | `adminSupportAgents.service.ts`, pages `/admin/network/support-agents`, `links.ts` |
| Reporting | `adminReportingUsers.service.ts`, pages `/admin/network/reporting-users` |
| Compta | Finaliser `LINKS.admin.v1.accountants` dans `links.ts` |

Modèle à copier : `src/features/network/api/adminAccountants.*` + `AccountantCreatePage.tsx`.

Navigation admin (à ajouter) :

```
/admin/network/accountants      ← Comptables
/admin/network/support-agents   ← Agents support
/admin/network/reporting-users ← Analystes reporting
```

---

## 10. Priorisation

| ID | Sujet | Priorité |
|----|-------|----------|
| STAFF-01 | CRUD `support-agents` + `user_type=SUPPORT` | **P0** |
| STAFF-02 | CRUD `reporting-users` + `user_type=REPORTING` | **P0** |
| STAFF-03 | `GET /v1/support/me` et `GET /v1/reporting/me` | **P0** |
| STAFF-04 | Garde-fous 403 mutations hors périmètre | **P0** |
| STAFF-05 | Stabiliser / documenter `/v1/admin/accountants` | **P1** |
| STAFF-06 | Option B route générique `portal-users` | P2 (si refacto) |

---

## 11. Questions ouvertes pour l’équipe backend

1. **Nommage** : `support-agents` vs `support-users` vs entrée dans `/v1/admin/users` avec filtre `role` ?
2. **Pays** : les agents support/reporting sont-ils **multi-pays** (plateforme) ou rattachés à un `country_id` ?
3. **Permissions** : table `role_permissions` existante ou dérivées de `user_type` en dur ?
4. **Comptables** : route définitive confirmée (`/v1/admin/accountants`) ? État actuel en préprod ?
5. **Réinitialisation mot de passe** : réutiliser `POST /v1/auth/forgot-password` pour les 3 profils ?

---

*Document prêt à transmettre à l’équipe API — merci de répondre avec les routes Swagger finales pour branchement front.*
