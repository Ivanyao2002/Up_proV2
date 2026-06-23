# Problème — Liaison chauffeur / véhicule cassée après transfert de partenaire

> **Date** : 16 juin 2026  
> **Environnement** : `https://api.upjunoo-dev.tech` (proxy local `/upjunoo-api`)  
> **Contexte** : transfert d'un chauffeur (et de son véhicule) d'un partenaire source vers un partenaire cible via le back-office admin ou franchise

---

## Symptôme observé

Après un **transfert de chauffeur** vers un autre partenaire, la liaison **véhicule → chauffeur** n'est plus visible côté API :

- Sur le **détail véhicule**, `driver_id` est `null` et l'objet `driver` est absent.
- Sur le **détail chauffeur**, `current_vehicle_id` pointe toujours correctement vers le véhicule transféré.

La relation est donc **unidirectionnelle** (chauffeur → véhicule) au lieu d'être **bidirectionnelle** (chauffeur ↔ véhicule), ce qui empêche l'affichage du chauffeur assigné sur la fiche véhicule.

---

## Reproduction (cas réel du 16/06/2026)

### Contexte du transfert

| Entité | ID |
|--------|-----|
| Chauffeur | `7abb2329-7404-4224-b347-fb6297480e6b` (Kevine Boudalha) |
| Véhicule | `d6186736-9180-4f7d-b369-4b510b3ebfec` (Peugeot 301 · 2789KB01) |
| Partenaire cible | `71a1aad7-ad23-41ca-a6d0-b904d5953271` (Partner Dev Abidjan) |
| Partenaire source | `c84a2470-4194-4820-838a-0ccfced18774` (d'après `metadata.transferredFrom`) |
| Date transfert | `2026-06-16T16:19:45.123Z` |

Le transfert a bien mis à jour `partner_id` sur le chauffeur et le véhicule (métadonnées `transferredAt`, `transferredFrom`, `transferredTo` présentes sur les deux entités).

### 1. Détail véhicule — chauffeur absent

```http
GET /v1/partners/71a1aad7-ad23-41ca-a6d0-b904d5953271/vehicles/d6186736-9180-4f7d-b369-4b510b3ebfec
Authorization: Bearer <JWT admin>
X-Client-Type: back-office
```

→ **HTTP 200 OK**

```json
{
  "status": "ok",
  "vehicle": {
    "id": "d6186736-9180-4f7d-b369-4b510b3ebfec",
    "partner_id": "71a1aad7-ad23-41ca-a6d0-b904d5953271",
    "driver_id": null,
    "plate_number": "2789KB01",
    "status": "approved",
    "metadata": {
      "transferredAt": "2026-06-16T16:19:45.123Z",
      "transferredBy": "1aed72f8-5ac4-4f68-a152-3705551006c5",
      "transferredTo": "71a1aad7-ad23-41ca-a6d0-b904d5953271",
      "transferredFrom": "c84a2470-4194-4820-838a-0ccfced18774"
    },
    "driver": null
  }
}
```

**Problème** : `driver_id` est `null` alors que le chauffeur `7abb2329-7404-4224-b347-fb6297480e6b` est toujours rattaché à ce véhicule.

### 2. Détail chauffeur — véhicule toujours lié

```http
GET /v1/drivers/7abb2329-7404-4224-b347-fb6297480e6b
Authorization: Bearer <JWT admin>
X-Client-Type: back-office
```

→ **HTTP 200 OK**

```json
{
  "status": "ok",
  "driver": {
    "id": "7abb2329-7404-4224-b347-fb6297480e6b",
    "partner_id": "71a1aad7-ad23-41ca-a6d0-b904d5953271",
    "current_vehicle_id": "d6186736-9180-4f7d-b369-4b510b3ebfec",
    "metadata": {
      "transferredAt": "2026-06-16T16:19:45.123Z",
      "transferredFrom": "c84a2470-4194-4820-838a-0ccfced18774",
      "transferredTo": "71a1aad7-ad23-41ca-a6d0-b904d5953271"
    }
  },
  "vehicle": {
    "id": "d6186736-9180-4f7d-b369-4b510b3ebfec",
    "model": "Peugeot 301",
    "plate": "2789KB01"
  }
}
```

**Constat** : côté chauffeur, la liaison vers le véhicule est intacte (`current_vehicle_id` + objet `vehicle` enrichi).

---

## Incohérence de données

| Champ | Entité chauffeur | Entité véhicule | Attendu |
|-------|------------------|-----------------|---------|
| `drivers.current_vehicle_id` | `d6186736-…` | — | OK |
| `vehicles.driver_id` | — | `null` | Devrait être `7abb2329-…` |
| Objet `driver` dans réponse véhicule | — | `null` | Devrait contenir le chauffeur |
| `partner_id` (les deux) | `71a1aad7-…` | `71a1aad7-…` | OK |

Le transfert met à jour le **partenaire** sur les deux entités, mais **ne resynchronise pas** `vehicles.driver_id` avec `drivers.current_vehicle_id`.

---

## Route de transfert concernée

Le front appelle :

```http
POST /v1/partners/{sourcePartnerId}/drivers/{driverId}/transfer
Content-Type: application/json

{
  "targetPartnerId": "<uuid partenaire cible>",
  "target_partner_id": "<uuid partenaire cible>"
}
```

Référence front : `src/features/fleet/api/driverTransfer.service.ts`  
Route : `LINKS.v1.partners.transferDriver(partnerId, driverId)`

**Hypothèse** : le handler backend de transfert met à jour `drivers.partner_id` et `vehicles.partner_id`, conserve `drivers.current_vehicle_id`, mais **réinitialise ou n'actualise pas** `vehicles.driver_id`.

---

## Comportement attendu

Lors d'un transfert chauffeur + véhicule(s) :

1. `drivers.partner_id` → nouveau partenaire
2. `vehicles.partner_id` → nouveau partenaire (pour les véhicules transférés)
3. **`vehicles.driver_id`** → doit rester (ou être réécrit) avec l'ID du chauffeur transféré si une liaison existait avant le transfert
4. `drivers.current_vehicle_id` → inchangé si le véhicule est transféré avec le chauffeur

Les deux sens de la relation doivent rester cohérents :

```
drivers.current_vehicle_id  ←→  vehicles.driver_id
```

Comme lors d'une assignation normale (`POST /v1/partners/{id}/vehicles/{vehicleId}/assign-driver` ou équivalent).

---

## Impact front / back-office

- **Fiche véhicule** (admin, franchise, partenaire) : section « Chauffeur assigné » vide alors qu'un chauffeur est actif sur ce véhicule.
- **Listes véhicules** : colonne chauffeur potentiellement vide si basée sur `driver_id` / jointure `vehicles.driver_id`.
- **Dispatch / ops** : risque de ne pas retrouver le binôme chauffeur-véhicule depuis la fiche véhicule.
- **Pas d'impact immédiat** sur la fiche chauffeur ni sur le portefeuille (wallet toujours rattaché au chauffeur).

---

## Contournement temporaire (workaround)

1. Depuis la fiche chauffeur, réassigner manuellement le véhicule (si l'UI le permet).
2. Ou appeler l'endpoint d'assignation chauffeur → véhicule après le transfert pour resynchroniser `vehicles.driver_id`.

---

## Correction backend suggérée

Dans le service de transfert (`POST …/drivers/{id}/transfer`), après le changement de `partner_id` :

```sql
-- Pour chaque véhicule transféré avec le chauffeur
UPDATE vehicles
SET driver_id = :driverId,
    updated_at = now()
WHERE id = :vehicleId
  AND (driver_id IS NULL OR driver_id = :driverId);
```

Alternativement, si le transfert **doit** détacher le chauffeur du véhicule, alors `drivers.current_vehicle_id` devrait aussi être mis à `null` — ce qui n'est pas le cas aujourd'hui et confirme qu'il s'agit d'un oubli de mise à jour, pas d'une déliaison intentionnelle.

---

## Checklist de validation post-fix

- [ ] Après transfert, `GET /v1/partners/{id}/vehicles/{vehicleId}` retourne `driver_id` = ID du chauffeur et un objet `driver` peuplé.
- [ ] `GET /v1/drivers/{driverId}` conserve `current_vehicle_id` inchangé.
- [ ] Transfert sans véhicule : `driver_id` reste `null` sur les véhicules non transférés.
- [ ] Transfert avec plusieurs véhicules : chaque véhicule transféré a le bon `driver_id` (si liaison préexistante).
- [ ] Régression : création binôme chauffeur + véhicule (flow wizard) — liaison bidirectionnelle toujours OK.

---

## Références

- Flow transfert front : `src/features/fleet/api/driverTransfer.service.ts`, `DriverTransferModal.tsx`
- Pages concernées : `DriverDetailPage.tsx`, `FranchiseDriverDetailPage.tsx`
- Problème connexe création binôme : `docs/PROBLEME-CREATION-CHAUFFEUR-PARTNER.md`
- Contrat création chauffeur/véhicule : `docs/REPONSE-BACKEND-CONTRAT-CREATION-CHAUFFEUR-VEHICULE-2026-06-16.md`
