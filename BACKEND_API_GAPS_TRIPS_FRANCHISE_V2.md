# BACKEND_API_GAPS_TRIPS_V2.md
## Rapport d'Écarts API — Courses Franchise (Round 2)

**Date:** 2026-06-18  
**Portail concerné:** Franchise  
**Token de test:** `dev.franchise@upjunoo-dev.tech`  
**Franchise ID:** `1bb2bff7-edcc-496d-a87a-4126c19be278`

---

## 🔴 Problème 1 — Liste incomplète : Admin voit 21 courses, Franchise voit 14

### Constat

| Portail | Route | Total retourné |
|---------|-------|----------------|
| Admin | `GET /v1/admin/orders?franchise_id=...` | **21 courses** |
| Franchise | `GET /v1/franchise/orders` | **14 courses** |
| Franchise | `GET /v1/franchises/{uuid}/orders` | **14 courses** |

Les 7 courses manquantes ne sont pas visibles côté franchise, quel que soit l'endpoint utilisé.

### Hypothèses à vérifier côté backend

1. **Filtre de statut implicite** — L'endpoint franchise filtre peut-être automatiquement certains statuts (`pending`, `requested`, `in_progress`...) sans le documenter.
2. **Filtre de rôle trop restrictif** — La query SQL applique un filtre `franchise_id = X` mais certaines courses ont `franchise_id = null` (voir Problème 3 ci-dessous) et sont donc exclues côté franchise mais visibles en admin.
3. **Scope temporel** — Les 14 courses retournées sont-elles filtrées sur une période alors que l'admin voit tout ?

### Ce qu'on attend

La franchise doit voir **toutes les courses opérées dans son territoire**, quel que soit leur statut et leur `franchise_id` (y compris `null` si la course appartient à sa zone).

### Question pour le backend

> **Pourquoi `GET /v1/franchise/orders` retourne 14 courses alors que l'admin en voit 21 pour la même franchise ? Quel filtre ou scope est appliqué différemment ?**

---

## 🔴 Problème 2 — Champ `timeline` absent dans la réponse franchise

### Constat

L'endpoint admin `GET /v1/admin/orders/{id}` retourne un objet `timeline` complet :

```json
"timeline": {
  "current": "completed",
  "steps": [
    { "status": "requested",   "at": "2026-06-16T11:25:14.203Z", "done": true,  "current": false },
    { "status": "dispatching", "at": null,                        "done": true,  "current": false },
    { "status": "accepted",    "at": "2026-06-16T11:28:05.639Z", "done": true,  "current": false },
    { "status": "arrived",     "at": "2026-06-16T11:30:12.771Z", "done": true,  "current": false },
    { "status": "in_progress", "at": "2026-06-16T11:30:13.443Z", "done": true,  "current": false },
    { "status": "completed",   "at": "2026-06-16T11:32:38.577Z", "done": true,  "current": true  }
  ],
  "statusChain": ["requested", "dispatching", "accepted", "arrived", "in_progress", "completed"]
}
```

L'endpoint franchise `GET /v1/franchises/{uuid}/orders/{orderId}` **ne retourne pas ce champ** (absent ou `null`).

### Impact frontend

Le composant `Timeline` de la page détail course franchise affiche une timeline vide. Le mapper lit `(order as any).timeline` et reçoit `undefined` → retourne `[]`.

### Structure attendue

Le champ `timeline` doit être inclus dans la réponse de `GET /v1/franchises/{uuid}/orders/{orderId}` avec exactement la même structure que l'admin :

```typescript
timeline: {
  current: string;            // statut actuel
  steps: Array<{
    status: string;           // ex: "requested", "dispatching", "accepted"...
    at: string | null;        // timestamp ISO ou null si non atteint
    done: boolean;
    current: boolean;
  }>;
  statusChain: string[];      // séquence ordonnée des statuts
}
```

### Question pour le backend

> **Pourquoi `GET /v1/franchises/{uuid}/orders/{orderId}` ne retourne pas le champ `timeline` alors que l'admin le reçoit ? Peut-on l'inclure dans la réponse franchise ?**

---

## 🟡 Problème 3 (rappel) — `franchise_id: null` sur toutes les courses

Déjà signalé dans `BACKEND_API_GAPS_OPERATION.md`. Toutes les courses retournées par `/v1/franchise/orders` ont `franchise_id: null`.

Ce problème est **probablement lié au Problème 1** : si les courses sont stockées sans `franchise_id`, le backend ne peut pas filtrer correctement par franchise, ce qui explique le compte différent entre admin et franchise.

---

## ✅ Récapitulatif des demandes backend

| # | Priorité | Demande |
|---|----------|---------|
| 1 | 🔴 HAUTE | Expliquer pourquoi la franchise voit 14 courses au lieu de 21 — quel filtre est appliqué ? |
| 2 | 🔴 HAUTE | Inclure le champ `timeline` dans `GET /v1/franchises/{uuid}/orders/{orderId}` |
| 3 | 🔴 HAUTE | Corriger le `franchise_id: null` sur les courses (root cause probable du Problème 1) |
| 4 | 🟡 MOYENNE | Confirmer le comportement attendu des filtres `?status=` et `?service=` (ils semblent ignorés) |

---

*Rapport produit le 2026-06-18 — à transmettre au backend avant développement frontend de la page détail course*
