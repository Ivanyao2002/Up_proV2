# Écarts API — <Sujet>

> Copier ce template pour chaque nouveau rapport de gaps.
> Chaque CHECK est un bloc indépendant. Le script `audit-gaps-franchise.mjs` les exécute tous.

**Franchise ID de référence :** `1bb2bff7-edcc-496d-a87a-4126c19be278`  
**Date :** YYYY-MM-DD

---

## Types disponibles

| Type | Quand l'utiliser |
|------|-----------------|
| `route_manquante` | La route n'existe pas ou retourne 404/501 |
| `donnee_manquante` | La route répond mais un champ est absent |
| `valeur_vide` | Un tableau ou objet est vide alors qu'il ne devrait pas l'être |
| `valeur_nulle` | Un champ est null/0 alors qu'il devrait avoir une valeur |
| `structure` | Un champ a le mauvais type (string au lieu d'array, etc.) |
| `nouvelle_route` | Nouvelle route à tester / valider |

## Asserts disponibles

```
status_http: 200          → code HTTP exact
json.status: ok           → valeur littérale exacte
json.monChamp: exists     → champ présent et non null
json.monChamp: not_empty  → tableau/string non vide
json.monChamp: not_zero   → nombre différent de 0
json.monChamp: is_array   → c'est bien un tableau
json.monChamp: is_object  → c'est bien un objet
json.a.b.c: exists        → accès imbriqué
```

---

## CHECK-001 · GET /v1/exemple/{franchiseId}/resource

**Type :** nouvelle_route  
**Méthode :** GET  
**URL :** /v1/exemple/{{franchiseId}}/resource?page=1&limit=10  
**Variables :**
- franchiseId = 1bb2bff7-edcc-496d-a87a-4126c19be278

**Assert :**
- status_http: 200
- json.status: ok
- json.data: exists
- json.data: not_empty
- json.pagination: exists

**Symptôme :** Décrire ici ce qui se passe actuellement  
**Notes :** Informations complémentaires pour le backend

---

## CHECK-002 · GET /v1/exemple/{franchiseId}/resource/{id}

**Type :** donnee_manquante  
**Méthode :** GET  
**URL :** /v1/exemple/{{franchiseId}}/resource/{{sample_id}}  
**Variables :**
- franchiseId = 1bb2bff7-edcc-496d-a87a-4126c19be278
- sample_id = {{sample_id}}

**Assert :**
- status_http: 200
- json.status: ok
- json.item: exists
- json.item.timeline: exists
- json.item.timeline: is_object

**Symptôme :** Le champ timeline est absent de la réponse  
**Notes :** Fournir --var sample_id=<uuid> au lancement du script

---

## CHECK-003 · POST /v1/exemple/{franchiseId}/action

**Type :** route_manquante  
**Méthode :** POST  
**URL :** /v1/exemple/{{franchiseId}}/action  
**Variables :**
- franchiseId = 1bb2bff7-edcc-496d-a87a-4126c19be278

**Assert :**
- status_http: 200
- json.status: ok

**Symptôme :** La route retourne 404  
**Notes :** Body optionnel — ajouter section **Body :** si nécessaire
