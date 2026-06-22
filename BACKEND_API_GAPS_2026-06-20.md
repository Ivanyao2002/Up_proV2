# Écarts API Backend — 2026-06-20

**Franchise ID de référence :** `1bb2bff7-edcc-496d-a87a-4126c19be278`  
**Date :** 2026-06-20

> Fichier compatible avec `audit-gaps-franchise.mjs`.  
> Usage : `node scripts/audit-gaps-franchise.mjs --token=<JWT> --gaps=BACKEND_API_GAPS_2026-06-20.md --var sample_freight_id=<uuid_course_fret> --var sample_taxi_id=<uuid_course_taxi>`

---

## CHECK-001 · GET /v1/franchises/{franchiseId}/orders/{orderId} — Course Taxi

**Type :** donnee_manquante  
**Méthode :** GET  
**URL :** /v1/franchises/{{franchiseId}}/orders/{{sample_taxi_id}}  
**Variables :**
- franchiseId = 1bb2bff7-edcc-496d-a87a-4126c19be278
- sample_taxi_id = {{sample_taxi_id}}

**Assert :**
- status_http: 200
- json.status: ok
- json.order: exists
- json.order.timeline: exists
- json.order.timeline: is_object

**Symptôme :** Vérifier que le détail d'une course standard retourne bien la timeline  
**Notes :** Fournir `--var sample_taxi_id=<uuid>` au lancement

---

## CHECK-002 · GET /v1/franchises/{franchiseId}/orders/{orderId} — Course Fret

**Type :** valeur_vide  
**Méthode :** GET  
**URL :** /v1/franchises/{{franchiseId}}/orders/{{sample_freight_id}}  
**Variables :**
- franchiseId = 1bb2bff7-edcc-496d-a87a-4126c19be278
- sample_freight_id = {{sample_freight_id}}

**Assert :**
- status_http: 200
- json.status: ok
- json.order: exists

**Symptôme :** Retourne `RIDE_NOT_FOUND` pour toutes les courses de type fret. Le backend cherche uniquement dans la table `rides`, pas dans `freight_orders`.  
**Notes :** Fournir `--var sample_freight_id=<uuid>` — ID d'une course fret visible dans la liste

---

## CHECK-003 · GET /v1/franchises/{franchiseId}/orders — Liste des courses

**Type :** nouvelle_route  
**Méthode :** GET  
**URL :** /v1/franchises/{{franchiseId}}/orders?page=1&limit=10  
**Variables :**
- franchiseId = 1bb2bff7-edcc-496d-a87a-4126c19be278

**Assert :**
- status_http: 200
- json.status: ok
- json.orders: exists
- json.orders: not_empty
- json.pagination: exists

**Symptôme :** Valider que la liste des courses retourne bien des données  
**Notes :** Si `orders` est vide, vérifier que des courses existent bien en base pour cette franchise

---

## CHECK-004 · GET /v1/franchises/{franchiseId}/safety/sos/Dashboard

**Type :** valeur_nulle  
**Méthode :** GET  
**URL :** /v1/franchises/{{franchiseId}}/safety/sos/Dashboard  
**Variables :**
- franchiseId = 1bb2bff7-edcc-496d-a87a-4126c19be278

**Assert :**
- status_http: 200
- json.status: ok
- json.dashboard: exists
- json.dashboard.stats: exists
- json.dashboard.activeIncidents: exists

**Symptôme :** Tous les compteurs stats à 0 et `activeIncidents: []` alors que des incidents SOS existent en base. Cause suspectée : filtre `franchiseId` mal jointé dans la requête SQL.  
**Notes :** Vérifier côté backend que la jointure sur `franchise_id` couvre bien les incidents liés aux partenaires/chauffeurs de la franchise

---

## CHECK-005 · GET /v1/franchises/{franchiseId}/safety/sos — Liste incidents

**Type :** valeur_vide  
**Méthode :** GET  
**URL :** /v1/franchises/{{franchiseId}}/safety/sos?page=1&limit=25  
**Variables :**
- franchiseId = 1bb2bff7-edcc-496d-a87a-4126c19be278

**Assert :**
- status_http: 200
- json.status: ok
- json.incidents: exists
- json.incidents: not_empty
- json.pagination: exists
- json.pagination.total: not_zero

**Symptôme :** `incidents: []` et `pagination.total: 0` alors que des incidents SOS existent. Même cause que CHECK-004 : filtre `franchiseId` non résolu en base.  
**Notes :** Même correctif backend que CHECK-004 — les deux routes partagent probablement la même requête SQL défectueuse
