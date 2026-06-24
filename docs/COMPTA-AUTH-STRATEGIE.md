# Strategie auth comptable (provisoire -> cible)

Date: 2026-06-17

## Objectif

Permettre la comptabilite:
- au niveau plateforme (centrale),
- au niveau franchise,

avec un utilisateur dedie et des privileges strictement comptables.

## Approche recommandee

Ne pas dupliquer par "type de personne", mais par:
- role fonctionnel: `ACCOUNTANT`
- scope d'acces: `platform` ou `franchise`
- permissions fines: `accounting.*`, `finance.*.view`

Option RBAC simple:
- `ACCOUNTANT_PLATFORM`
- `ACCOUNTANT_FRANCHISE`

## Etat actuel (temporaire)

- Le portail `/compta/*` existe.
- Le login comptable `/compta/login` existe (ajoute dans cette iteration).
- Pour l'instant, l'authentification utilise le flux `admin` (portail admin).
- Le but est de livrer le parcours comptable sans bloquer sur la route de login comptable backend.

## Cible backend

1. Ajouter une route de login comptable dediee (ou un claim role/scope sur login existant).
2. Exposer les roles/permissions comptables.
3. Restreindre par scope:
   - comptable plateforme -> routes admin comptables globales
   - comptable franchise -> routes franchise comptables

## Impact front prevu

Quand le backend auth comptable sera pret:
- changer le portail de login de `/compta/login` vers le portail comptable dedie,
- remplacer progressivement les routes admin qui ne doivent pas etre visibles en franchise,
- garder la meme UX avec filtrage par scope et permission.

## Routes a utiliser selon scope

### Scope plateforme (centrale)
- `/v1/admin/ledger`
- `/v1/admin/accounting/periods`
- `/v1/admin/cash-reconciliations`
- `/v1/admin/finance/reconciliation`
- `/v1/admin/reports/export`

### Scope franchise
- `/v1/franchise/finance/reconciliation`
- `/v1/franchises/{id}/ledger`
- routes `franchise/accounting/*` (a completer cote backend)

## Decision provisoire validee

- On garde le login admin sous le capot pour le portail comptable
- mais on expose une entree UX dediee: `/compta/login`
- pour preparer la bascule vers le vrai login comptable sans refonte UI.
