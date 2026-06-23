# Bug backend — Création partenaire franchise → champs manquants

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
| `/franchise/partners/new` | Créer partenaire | `POST` | `/v1/franchises/{franchiseId}/partners` | 400 | `PARTNER_TYPE_REQUIRED` |

**Réponse backend :**
```json
{
  "status": "error",
  "generatedAt": "2026-06-22T19:03:08.689Z",
  "message": "Une information obligatoire est manquante.",
  "error": {
    "code": "PARTNER_TYPE_REQUIRED",
    "message": "Une information obligatoire est manquante."
  }
}
```

### 1.2. Payload réellement envoyé par le front

```json
{
  "address": "KOUMASSI",
  "cityId": "d80a0f88-fea5-41e4-8fb8-4e82a8a2758c",
  "commissionRate": 4,
  "contactEmail": "eliphasebletro@gmail.net",
  "contactPhone": "0102010201",
  "email": "eliphasebletro@gmail.net",
  "franchiseId": "1bb2bff7-edcc-496d-a87a-4126c19be278",
  "legalName": "VTC",
  "password": "123456789",
  "phone": "0102010201",
  "tradeName": "ELIPHASE"
}
```

**Problème :** Les champs `partner_type` et `legal_form` sont **absents** du payload !

---

## 2. Analyse du problème

### 2.1. Champs obligatoires manquants

Selon la documentation `PARTENAIRE-PERSONNE-PHYSIQUE-MORALE.md` §4.1 :

| Champ attendu par backend | Valeur dans payload | Statut |
|---------------------------|--------------------|--------|
| `partner_type` | **Manquant** | ❌ Obligatoire |
| `legal_form` | **Manquant** | ❌ Optionnel mais requis pour logique |

### 2.2. Mapping incorrect des noms de champs

Le front utilise des noms de champs en **camelCase** mais le payload montre des champs en **camelCase** avec des inconsistances :

| Champ front | Champ payload | Attendu par backend |
|-------------|---------------|---------------------|
| `partner_type` | **Manquant** | `partner_type` |
| `legal_form` | **Manquant** | `legal_form` |
| `contact_email` | `contactEmail` | `contact_email` ? |
| `commission_rate` | `commissionRate` | `commission_rate` ? |

**Hypothèse :** Le front envoie les champs en camelCase mais le backend attend snake_case.

---

## 3. Ce que le front essaie d'envoyer

Le formulaire contient bien les champs requis :

```typescript
const EMPTY_FORM: CreatePartnerPayload = {
  name: "",
  trade_name: "",
  legal_name: "",
  contact_email: "",
  password: "",
  contact_phone: "",
  city: "",
  address: "",
  commission_rate: DEFAULT_PARTNER_COMMISSION_RATE_PERCENT,
  legal_form: "INDIVIDUAL",           // ✅ Défini
  manager_first_name: "",
  manager_last_name: "",
  partner_type: "FLEET",              // ✅ Défini
};
```

**Mais ces champs n'arrivent pas au backend !**

---

## 4. Actions demandées au backend

### P0 — Clarifier le format des champs attendus

**Question :** Le backend attend-il les champs en :

1. **snake_case** : `partner_type`, `legal_form`, `contact_email`, `commission_rate`
2. **camelCase** : `partnerType`, `legalForm`, `contactEmail`, `commissionRate`
3. **Les deux** avec conversion automatique ?

### P0 — Vérifier la transformation du payload

Le service front utilise :
```typescript
createPartner.mutate(payloadToSend, {
  onSuccess: (partner) => { /* ... */ },
});
```

**À vérifier côté backend :**
- Le payload arrive-t-il tel quel ?
- Y a-t-il un middleware qui transforme les champs ?
- La route franchise `/v1/franchises/{id}/partners` utilise-t-elle le même format que `/v1/admin/partners` ?

### P0 — Tester avec payload manuel

Pour diagnostic, tester manuellement :

```bash
curl -X POST https://api.upjunoo-dev.tech/v1/franchises/{franchiseId}/partners \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Partenaire",
    "partner_type": "FLEET",
    "legal_form": "INDIVIDUAL",
    "contact_email": "test@example.com",
    "password": "password123"
  }'
```

---

## 5. Correctif potentiel côté front

En attendant clarification backend, je peux forcer l'envoi en snake_case :

```typescript
const payloadToSend = {
  name: form.name,
  trade_name: form.trade_name,
  legal_name: form.legal_name,
  contact_email: form.contact_email,
  password: form.password,
  contact_phone: form.contact_phone,
  city: form.city,
  address: form.address,
  commission_rate: form.commission_rate,
  legal_form: form.legal_form,
  manager_first_name: form.manager_first_name,
  manager_last_name: form.manager_last_name,
  partner_type: form.partner_type,  // Forcer l'inclusion
};
```

---

## 6. Impact utilisateur

| Fonctionnalité | Impact |
|----------------|--------|
| Création partenaire franchise | **Totalement bloquée** |
| Formulaire personne morale/physique | **Non testable** |
| Gestion documents COMPANY | **Non testable** |

---

## 7. Documents liés

| Document | Lien |
|----------|------|
| Spécification partenaire physique/morale | `PARTENAIRE-PERSONNE-PHYSIQUE-MORALE.md` |
| Page création partenaire franchise | `src/features/franchise/pages/FranchisePartnerNewPage.tsx` |
| Service partenaire franchise | `src/features/franchise/api/partners.service.ts` |

---

## 8. Historique

| Date | Version | Changement |
|------|---------|------------|
| 2026-06-22 | 1.0 | Analyse payload manquant `partner_type` et `legal_form` — création partenaire franchise |
