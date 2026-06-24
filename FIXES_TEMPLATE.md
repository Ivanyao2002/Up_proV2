# Correctifs Frontend — <Sujet>

> Copier ce template pour chaque nouveau fichier de correctifs.
> Le script `apply-frontend-fixes.mjs` applique chaque bloc FIX dans l'ordre.

**Date :** YYYY-MM-DD  
**Contexte :** Décrire le contexte des correctifs

---

## Actions disponibles

| Action | Effet |
|--------|-------|
| `replace` | Remplace la première occurrence du texte **Recherche** par **Remplacement** |
| `replace_all` | Remplace toutes les occurrences |
| `insert_after` | Insère **Remplacement** juste après l'ancre **Recherche** |
| `insert_before` | Insère **Remplacement** juste avant l'ancre **Recherche** |
| `delete_lines` | Supprime le texte **Recherche** |
| `create_file` | Crée un nouveau fichier avec le contenu **Contenu** |

> **Note :** Les chemins de fichiers sont relatifs à la racine du projet (`src/...`).  
> **Astuce :** Ajouter `**Skip :** raison` pour ignorer un FIX sans le supprimer.

---

## CHECK de référence

Indiquer ici le fichier d'audit associé si applicable :  
`node scripts/apply-frontend-fixes.mjs --fixes=FIXES_<sujet>.md [--dry-run]`

---

## FIX-001 · Description du correctif

**Fichier :** src/features/franchise/api/monService.ts  
**Action :** replace  
**Raison :** Explication de pourquoi ce changement est nécessaire

**Recherche :**
```
texte exact à remplacer dans le fichier
(respecter l'indentation exacte)
```

**Remplacement :**
```
nouveau texte
```

---

## FIX-002 · Ajouter un import manquant

**Fichier :** src/features/franchise/api/monService.ts  
**Action :** insert_after  
**Raison :** Import manquant pour le nouveau type

**Recherche :**
```
import { apiClient } from "@/core/http/apiClient";
```

**Remplacement :**
```
import { monNouveauModule } from "@/shared/lib/monModule";
```

---

## FIX-003 · Créer un nouveau fichier

**Fichier :** src/features/franchise/api/nouveauService.ts  
**Action :** create_file  
**Raison :** Service manquant pour la nouvelle fonctionnalité

**Contenu :**
```
export const nouveauService = {
  getData: async () => {
    // TODO: implémenter
  },
};
```

---

## FIX-004 · Correctif désactivé temporairement

**Fichier :** src/features/franchise/api/autreService.ts  
**Action :** replace  
**Skip :** En attente de la correction backend CHECK-002 — ne pas appliquer avant validation
**Raison :** Dépend du fix backend SOS

**Recherche :**
```
// ancien code
```

**Remplacement :**
```
// nouveau code
```
