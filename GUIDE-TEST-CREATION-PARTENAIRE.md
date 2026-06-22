# Guide de test — Création partenaire franchise

> **Date :** 2026-06-22  
> **Objectif :** Tester la création de partenaires avec les deux formes juridiques  
> **Page :** `/franchise/partners/new`  
> **Fonctionnalités :** Personne physique / Personne morale + upload signé

---

## 1. Prérequis

- **Accès franchise** avec permissions de création partenaires
- **Documents de test** pour les personnes morales :
  - RCCM (PDF/IMG)
  - Statuts (PDF/IMG)
  - DFE (PDF/IMG)
  - Pièce d'identité gérant (recto + verso)

---

## 2. Test 1 — Personne physique (INDIVIDUAL)

### 2.1. Scénario de test

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Accéder à `/franchise/partners/new` | Formulaire chargé, forme par défaut "Personne physique" |
| 2 | Remplir les champs obligatoires | Tous les champs validés |
| 3 | Vérifier que section gérant est masquée | Pas de section "Informations du gérant" |
| 4 | Vérifier section documents | Message "Aucun document obligatoire" |
| 5 | Cliquer "Créer le partenaire" | Partenaire créé, redirection vers fiche |
| 6 | Vérifier la fiche partenaire | Status "pending", forme "INDIVIDUAL" |

### 2.2. Données de test

```json
{
  "name": "Jean Dupont",
  "trade_name": "Transport Express",
  "legal_form": "INDIVIDUAL",
  "partner_type": "FLEET",
  "contact_email": "jean.dupont@test.com",
  "password": "password123",
  "contact_phone": "07 12 34 56 78",
  "city": "Abidjan",
  "commission_rate": 4
}
```

### 2.3. Points de validation

- ✅ Pas de section gérant affichée
- ✅ Pas de documents requis
- ✅ Création réussie sans upload
- ✅ Redirection vers fiche partenaire
- ✅ Payload contient `legal_form: "INDIVIDUAL"`

---

## 3. Test 2 — Personne morale (COMPANY)

### 3.1. Scénario de test

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Accéder à `/franchise/partners/new` | Formulaire chargé |
| 2 | Sélectionner "Personne morale" | Section gérant apparaît |
| 3 | Remplir les infos gérant | Champs prénom/nom du gérant |
| 4 | Remplir les champs obligatoires | Tous les champs validés |
| 5 | Uploader les 4 documents requis | RCCM, Statuts, DFE, Pièce gérant (recto/verso) |
| 6 | Vérifier validation documents | Bouton activé seulement si tous docs présents |
| 7 | Cliquer "Créer le partenaire" | Création + upload des documents |
| 8 | Vérifier progression upload | Message "Upload des documents en cours..." |
| 9 | Vérifier succès final | Redirection vers fiche partenaire |

### 3.2. Données de test

```json
{
  "name": "Transports Soleil",
  "trade_name": "Soleil Express",
  "legal_name": "Transports Soleil SARL",
  "legal_form": "COMPANY",
  "partner_type": "FLEET",
  "manager_first_name": "Amadou",
  "manager_last_name": "Diallo",
  "contact_email": "contact@soleil.ci",
  "password": "password123",
  "contact_phone": "07 12 34 56 78",
  "city": "Abidjan",
  "commission_rate": 4
}
```

### 3.3. Documents requis

| Document | Code API | Fichier test |
|----------|----------|--------------|
| RCCM | `BUSINESS_REGISTRATION` | `rccm.pdf` |
| Statuts | `COMPANY_STATUTES` | `statuts.pdf` |
| DFE | `TAX_REGISTRATION_DFE` | `dfe.pdf` |
| Pièce gérant recto | `MANAGER_ID_CARD` | `id_front.jpg` |
| Pièce gérant verso | `MANAGER_ID_CARD` | `id_back.jpg` |

### 3.4. Points de validation

- ✅ Section gérant affichée conditionnellement
- ✅ 4 documents obligatoires demandés
- ✅ Validation documents fonctionnelle
- ✅ Upload signé déclenché après création
- ✅ Progression upload affichée
- ✅ Documents attachés au partenaire
- ✅ Redirection après upload réussi

---

## 4. Tests d'erreur

### 4.1. Champs manquants

| Test | Action | Résultat attendu |
|------|--------|------------------|
| Email invalide | Entrer "email@invalid" | Erreur de validation |
| Mot de passe court | "123" | Erreur "min 6 caractères" |
| Taux commission hors limites | "150" | Erreur "entre 0 et 100" |

### 4.2. Documents COMPANY manquants

| Test | Action | Résultat attendu |
|------|--------|------------------|
| RCCM manquant | Uploader 3/4 documents | Bouton désactivé, message erreur |
| Pièce gérant verso manquant | Uploader sans verso | Bouton désactivé |

### 4.3. Erreurs upload

| Test | Action | Résultat attendu |
|------|--------|------------------|
| Fichier trop volumineux | Uploader >10MB | Erreur upload |
| Format non supporté | Uploader .exe | Erreur upload |
| Network error | Déconnexion internet | Erreur upload avec retry |

---

## 5. Validation backend

### 5.1. Payload envoyé

Vérifier dans la console du navigateur :

```javascript
// Personne physique
{
  "name": "Jean Dupont",
  "legal_form": "INDIVIDUAL",
  "partner_type": "FLEET",
  // ... autres champs
}

// Personne morale
{
  "name": "Transports Soleil",
  "legal_form": "COMPANY", 
  "partner_type": "FLEET",
  "manager_first_name": "Amadou",
  "manager_last_name": "Diallo",
  // ... autres champs
}
```

### 5.2. Routes appelées

- **Création partenaire** : `POST /v1/franchises/{franchiseId}/partners`
- **Upload signed-url** : `POST /v1/uploads/signed-url`
- **Attachement documents** : `POST /v1/franchises/{franchiseId}/partners/{partnerId}/documents`

---

## 6. Tests de performance

| Métrique | Cible |
|----------|-------|
| Temps création partenaire | < 3s |
| Upload document (5MB) | < 10s |
| Upload multiple documents | < 30s total |

---

## 7. Checklist de validation finale

- [ ] Personne physique créée sans documents
- [ ] Personne morale créée avec 4 documents
- [ ] Upload signé fonctionnel
- [ ] Progression upload affichée
- [ ] Gestion erreurs fonctionnelle
- [ ] Redirection vers fiche partenaire
- [ ] Données correctes en base
- [ ] Documents attachés au partenaire

---

## 8. Rapport de test

**Date du test :** _______________  
**Testeur :** _______________  
**Environnement :** Développement / Staging / Production  

| Test | Statut | Notes |
|------|--------|-------|
| Personne physique | ✅ / ❌ | |
| Personne morale | ✅ / ❌ | |
| Upload documents | ✅ / ❌ | |
| Gestion erreurs | ✅ / ❌ | |
| Performance | ✅ / ❌ | |

**Issues identifiées :**
1. _________________________
2. _________________________
3. _________________________

**Recommandations :**
1. _________________________
2. _________________________
