# Bugs Backend — Module Franchise

> **Backlog backend uniquement** — Dernière mise à jour : **2026-06-12**

---

## 🔴 Bugs à implémenter (14)

| ID | Sévérité | Section | Route | Problème |
|----|----------|---------|-------|----------|
| MANQUE-011 | 🔴?? HIGH | Partenaires | `GET /v1/franchises/{id}/partners/{pid}/drivers` | Route inexistante — Tab Chauffeurs vide |
| MANQUE-012 | 🔴?? HIGH | Partenaires | `GET /v1/franchises/{id}/partners/{pid}/orders` | Route inexistante — Tab Courses vide |
| MANQUE-013 | 🔴?? HIGH | Partenaires | `GET /v1/franchises/{id}/partners/{pid}/commissions` | Route inexistante — Tab Commissions vide |
| MANQUE-014 | 🔴?? HIGH | Chauffeurs | `POST /v1/franchises/{id}/drivers` | Route inexistante — Création chauffeur impossible |
| MANQUE-015 | 🔴?? HIGH | Chauffeurs | `POST /v1/franchises/{id}/drivers/{id}/suspend` | Route inexistante — Suspension impossible |
| MANQUE-016 | 🔴?? HIGH | Chauffeurs | `POST /v1/franchises/{id}/drivers/{id}/activate` | Route inexistante — Réactivation impossible |
| MANQUE-017 | 🔴?? HIGH | Chauffeurs | `DELETE /v1/franchises/{id}/drivers/{id}` | Route inexistante — Suppression impossible |
| MANQUE-018 | 🔴?? HIGH | Chauffeurs | `PATCH /v1/franchises/{id}/drivers/{id}` | Route inexistante — Modification impossible |
| MANQUE-023 | �?? HIGH | Clients | `GET /v1/franchise/clients` | Champs manquants — KPI incomplète |
| MANQUE-024 | 🔴?? HIGH | Réconciliation | `GET /v1/franchise/finance/reconciliation` | Retourne `items: []` vides |
| MANQUE-025 | 🔴?? HIGH | Courses | `GET /v1/franchises/{id}/orders` | `pagination.total` ignore filtre `service` |
| MANQUE-019 | 🟡 MEDIUM | Chauffeurs | `GET /v1/franchises/{id}/drivers/{id}` | Champs stats manquants (trips, rating, wallet...) |
| MANQUE-020 | 🟡 MEDIUM | Dashboard | `GET /v1/franchise/dashboard` | Champs KPI manquants (trends, weekly_flow...) |
| MANQUE-022 | 🟡 MEDIUM | Finance | `GET /v1/franchise/finance` | Champs réconciliation manquants |

**⚠️ Bloquant pour la production :** MANQUE-014 à 018 (CRUD chauffeur complet manquant)

---

## �?? Notes pour le backend

### MANQUE-011 à 013 — Sous-routes Partenaires
Routes manquantes pour les tabs du détail partenaire. Frontend prêt (`useFranchisePartnerDrivers`, `useFranchisePartnerOrders`, `useFranchisePartnerCommissions`).

### MANQUE-014 à 018 — CRUD Chauffeur
Routes essentielles manquantes :
- `POST /v1/franchises/{id}/drivers` — Création
- `PATCH /v1/franchises/{id}/drivers/{id}` — Modification  
- `DELETE /v1/franchises/{id}/drivers/{id}` — Suppression
- `POST /v1/franchises/{id}/drivers/{id}/suspend` — Suspension
- `POST /v1/franchises/{id}/drivers/{id}/activate` — Réactivation

### MANQUE-019 à 022 — Champs manquants
Les endpoints existent mais retournent des données incomplètes. Voir les types TypeScript pour la liste complète des champs attendus.

### MANQUE-024 — Réconciliation vide
`GET /v1/franchise/finance/reconciliation` retourne `items: []` et `entries: []` — besoin de peupler la base ou corriger la requête.

### MANQUE-025 — Pagination filtrée
`GET /v1/franchises/{id}/orders?service=RIDE` retourne les bonnes données mais `pagination.total` compte tous les enregistrements sans tenir compte du filtre.

