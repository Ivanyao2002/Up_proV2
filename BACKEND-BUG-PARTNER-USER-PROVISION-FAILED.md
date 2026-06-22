# Bug backend — Création partenaire → USER PROVISION FAILED

> **Date :** 2026-06-22  
> **Émetteur :** équipe front UpJunoo  
> **Destinataire :** équipe backend / API  
> **Priorité :** **P0** — blocage création partenaire franchise  
> **Contexte front :** `src/features/franchise/pages/FranchisePartnerNewPage.tsx`

---

## 1. Symptôme observé

### 1.1. Erreur backend

| Page | Action | Méthode | URL | Status | Code erreur |
|------|--------|---------|-----|--------|-------------|
| `/franchise/partners/new` | Créer partenaire | `POST` | `/v1/franchises/{franchiseId}/partners` | 500 | `PARTNER_USER_PROVISION_FAILED` |

**Réponse backend :**
```json
{
  "status": "error",
  "generatedAt": "2026-06-22T19:54:22.880Z",
  "message": "Une erreur est survenue. Réessayez plus tard.",
  "error": {
    "code": "PARTNER_USER_PROVISION_FAILED",
    "message": "Une erreur est survenue. Réessayez plus tard."
  }
}
```

---

## 2. Analyse du problème

### 2.1. Nature de l'erreur

`PARTNER_USER_PROVISION_FAILED` indique que :
- ✅ Le partenaire a été créé avec succès (champs `partner_type`, `legal_form` OK)
- ❌ La création du compte utilisateur associé a échoué

### 2.2. Flux attendu

1. **Création partenaire** → `partners` table ✅
2. **Création compte utilisateur** → `users` table ❌
3. **Association compte-partenaire** → `user_partner` table ❌

### 2.3. Causes possibles

| Hypothèse | Description | Vérification |
|-----------|-------------|--------------|
| **Email déjà existant** | L'email `contact_email` existe déjà dans `users` | Vérifier si `eliphase_bletro@gmail.net` existe déjà |
| **Contrainte unique** | Violation d'une contrainte DB sur email/username | Checker logs DB |
| **Service user down** | Microservice de gestion des utilisateurs indisponible | Vérifier health des services |
| **Permission insuffisante** | La franchise n'a pas les droits de créer des users | Vérifier permissions franchise |
| **Password hash failure** | Erreur lors du hash du mot de passe | Vérifier format password reçu |
| **Transaction rollback** | Erreur dans une étape secondaire qui annule tout | Checker logs de transaction |

---

## 3. Payload envoyé (confirmé correct)

```json
{
  "name": "ELIPHASE BLETRO",
  "trade_name": "",
  "legal_name": "ELIE VCT",
  "contact_email": "eliphase_bletro@gmail.net",
  "password": "123456789",
  "contact_phone": "0102010201",
  "city": "Abidjan",
  "address": "KOUMASSI",
  "commission_rate": 4,
  "legal_form": "INDIVIDUAL",
  "manager_first_name": "",
  "manager_last_name": "",
  "partner_type": "FLEET"
}
```

**✅ Tous les champs requis sont présents**

---

## 4. Actions demandées au backend

### P0 — Investigation immédiate

1. **Logs détaillés** : Extraire les logs complets de l'erreur pour identifier la cause exacte
2. **Vérification email** : Confirmer si `eliphase_bletro@gmail.net` existe déjà en base
3. **Health check** : Vérifier l'état du service de gestion des utilisateurs
4. **Permissions** : Confirmer que la franchise a les droits de créer des comptes utilisateurs

### P0 — Tests de diagnostic

```sql
-- Vérifier si l'email existe déjà
SELECT id, email, created_at FROM users WHERE email = 'eliphase_bletro@gmail.net';

-- Vérifier les derniers partenaires créés
SELECT id, name, contact_email, created_at FROM partners 
WHERE created_at > NOW() - INTERVAL '1 hour' 
ORDER BY created_at DESC;
```

### P0 — Test manuel

```bash
curl -X POST https://api.upjunoo-dev.tech/v1/franchises/{franchiseId}/partners \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "contact_email": "test.unique.' + $(date +%s) + '@example.com",
    "password": "password123",
    "partner_type": "FLEET",
    "legal_form": "INDIVIDUAL"
  }'
```

---

## 5. Impact utilisateur

| Fonctionnalité | Impact |
|----------------|--------|
| Création partenaire franchise | **Totalement bloquée** |
| Onboarding nouveaux partenaires | **Bloqué** |
| Activité commerciale franchise | **Impactée** |

---

## 6. Historique des erreurs

| Date | Erreur | Cause | Résolution |
|------|--------|-------|------------|
| 2026-06-22 19:03 | `PARTNER_TYPE_REQUIRED` | Champs manquants | ✅ Corrigé |
| 2026-06-22 19:54 | `PARTNER_USER_PROVISION_FAILED` | User creation failed | 🔄 En cours |

---

## 7. Workaround front (temporaire)

Si l'erreur persiste, envisager :
- Message explicite à l'utilisateur : "Erreur technique, contactez le support"
- Bouton "Réessayer" avec le même payload
- Formulaire de contact support intégré

---

## 8. Documents liés

| Document | Lien |
|----------|------|
| Création partenaire champs manquants | `BACKEND-BUG-FRANCHISE-PARTNER-CREATION-FIELDS.md` |
| Spécification partenaire physique/morale | `PARTENAIRE-PERSONNE-PHYSIQUE-MORALE.md` |
| Page création partenaire | `src/features/franchise/pages/FranchisePartnerNewPage.tsx` |

---

## 9. Suivi

**Date création :** 2026-06-22 19:55  
**Statut :** En attente investigation backend  
**Assigné :** Équipe backend/API  

**Prochaine étape :** Investigation logs et test avec email unique
