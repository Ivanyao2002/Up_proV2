# Écarts API — Live Map Franchise

**Portail :** Franchise  
**Franchise ID :** `1bb2bff7-edcc-496d-a87a-4126c19be278`  
**Date :** 2026-06-19

---

## 🔴 Problème 1 — Socket temps réel refusé pour le token franchise

### Symptôme

La page `/franchise/map` affiche en permanence :

> **Temps réel indisponible · snapshot HH:MM**

Les logs navigateur montrent :

```
[FranchiseLiveMapSocket] join_denied
{ room: 'admin:live-map', code: 'ADMIN_REQUIRED', message: 'Admin JWT required for live map room' }
```

Pattern de reconnexion cyclique observé (connect → join_denied → disconnect → reconnect toutes ~25s).

### Cause

La route `GET /v1/franchise/livemap` ne retourne **pas** de champ `meta.realtime` dans sa réponse.  
Le frontend applique alors un fallback hardcodé avec :

```
room: "admin:live-map"
event: "admin:live:locations"
```

Le backend rejette le token franchise sur ce room avec `ADMIN_REQUIRED`.

### Ce que fait l'admin (référence)

La route `GET /v1/admin/live-map` retourne :

```json
{
  "meta": {
    "realtime": {
      "transport": "socket.io",
      "url": "https://api.upjunoo-dev.tech",
      "room": "admin:live-map",
      "event": "admin:live:locations",
      "joinPayload": { "room": "admin:live-map" }
    }
  }
}
```

Le socket admin se connecte avec ces paramètres → ça fonctionne.

### Action demandée au backend

> **Exposer `meta.realtime` dans la réponse de `GET /v1/franchise/livemap`** avec les paramètres socket franchise :

```json
{
  "meta": {
    "realtime": {
      "transport": "socket.io",
      "url": "https://api.upjunoo-dev.tech",
      "room": "franchise:live-map",
      "event": "franchise:live:locations",
      "joinPayload": { "room": "franchise:live-map" }
    }
  }
}
```

> **Confirmer que le room `franchise:live-map` est bien implémenté côté backend socket** et accepte les tokens JWT franchise.

**Priorité :** 🔴 HAUTE

---

## 🟠 Problème 2 — `meta.realtime` absent de la réponse

### Endpoint concerné

```
GET /v1/franchise/livemap
```

### Symptôme

La réponse ne contient aucun champ `meta` ou `meta.realtime`.  
Sans ce champ, le frontend ne peut pas savoir sur quel room/event socket se connecter.

### Action demandée au backend

> Ajouter le bloc `meta.realtime` à la réponse (voir structure ci-dessus).  
> C'est déjà fait pour `GET /v1/admin/live-map` — aligner le comportement.

**Priorité :** 🟠 MOYENNE (bloquant pour le temps réel, la carte fonctionne en mode snapshot HTTP polling 30s)

---

## État actuel du frontend (workaround)

En attendant la correction backend, le frontend injecte un fallback :

```
room: "franchise:live-map"
event: "franchise:live:locations"
```

Si le backend expose `meta.realtime`, il sera utilisé automatiquement en priorité.  
Le mode snapshot HTTP (refresh toutes les 30s) reste actif comme fallback si le socket échoue.

---

*Rapport produit le 2026-06-19*
