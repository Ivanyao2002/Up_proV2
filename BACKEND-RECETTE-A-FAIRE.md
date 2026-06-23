# Backend — travaux requis pour la conformité au Plan de recette (Admin & Compta)

> **Date** : 23 juin 2026
> **Contexte** : audit `ANALYSE-RECETTE-ADMIN-COMPTA-V2.md`. Ce document liste **uniquement** ce qui ne peut pas être réglé côté front et nécessite une intervention backend (contrat d'API, modèle de données, cron, garanties d'intégrité).
> **Décisions produit déjà prises** (à acter ici) :
> - **A-admin (recharge centrale)** : on **laisse la recharge côté admin en l'état** pour l'instant → reste une **non-conformité connue** vs slide 15 / UC-FIN01. Voir §2.
> - **B (RBAC)** : on **laisse le RBAC en l'état** pour l'instant → voir §1 (ce que le backend devra exposer le jour où on le branche).
> - **A-compta** : corrigé côté front (lecture seule) → pas de tâche backend bloquante, voir §2.

Légende priorité : **P0** = bloquant conformité · **P1** = couverture recette · **P2** = backlog.

---

## 1. RBAC réel par compte — fonction Central #17 / slide 26 *(P0, laissé en l'état côté front)*

**Décision** : le front continue d'utiliser `defaultPermissions(portal)` (set figé par portail). À terme, pour activer un vrai RBAC, le backend doit fournir :

1. **Login / `me`** : retourner pour l'utilisateur connecté
   - `role` (slug du sous-profil central : `super_admin`, `exploitation`, `finance`, `support`, `conformite`, `reporting`, `direction_ro`)
   - `permissions: string[]` (permissions effectives du compte)
   Le front lit déjà ces champs (`auth.types.ts:42-44`) mais les **ignore** (`auth.mapper.ts:205`). Une fois le contrat stabilisé, on remplacera `defaultPermissions(portal)` par `data.permissions` (fallback portail si vide).
2. **Rôles** :
   - `GET /v1/admin/roles/:id` doit renvoyer `permission_groups` (actuellement absent → la matrice de droits est vide en prod, `adminRoles.mapper.ts:33`).
   - `PATCH/POST /v1/admin/roles` doivent **accepter et persister** `permission_groups` (aujourd'hui le front ne peut envoyer que `label/description`, `roles.service.ts:92`).
3. **Provisioning** des 7 comptes centraux + profil **auditeur lecture seule** + **direction RO** (cf. §8 et UC-AU01). Aujourd'hui seuls `accountant/support/reporting` sont provisionnables (`adminStaff.config.ts`).

> Tant que ce contrat n'est pas livré, modifier un rôle dans l'UI n'a **aucun effet réel** sur les droits, et tout admin reçoit l'intégralité des permissions.

---

## 2. Règle financière stricte — recharge & exécution *(UC-FIN01 / slide 15)*

- **A-compta (FAIT côté front)** : retraits et recharges du portail compta passés en **lecture seule**, retrait de `finance.withdrawals.approve` des permissions compta. Aucune action backend bloquante.
- **A-admin (laissé en l'état — non-conformité connue)** : l'admin peut toujours déclencher une recharge (`POST /v1/partners/{id}/wallet/driver-recharge`). Le plan l'**interdit** depuis l'interface centrale.
  - **À acter** : soit une **dérogation produit écrite**, soit une **garde côté serveur** refusant tout `driver-recharge` initié par un acteur central (rôle admin/central), pour que la règle soit appliquée même si le bouton existe.
- **Test négatif obligatoire UC-FIN01** : aujourd'hui impossible (aucun harnais de test dans le repo). À planifier après décision sur A-admin.

---

## 3. Paramétrage tarifs / commissions / bonus *(UC-A01, UC-FR02 — slides 42 & 44)*

### 3.1 Tarifs — versioning *(P0)*
Le front va ajouter le champ **Date d'application** (`effective_from`) et l'envoyer. Backend requis pour :
- **Conserver l'historique** des grilles (ne pas écraser via PATCH) : créer une nouvelle version au lieu de modifier en place, et exposer l'historique (`effective_from`/`effective_to` par version).
- Appliquer la nouvelle grille **aux nouvelles courses uniquement**, anciennes courses sur l'ancien tarif.

### 3.2 Tarifs — 4 services *(P0)*
Le front va ajouter `freight` (Fret) et `rental` (Location) au sélecteur. Backend requis pour :
- **Accepter et stocker** des grilles tarifaires pour les services `FREIGHT` et `RENTAL` (aujourd'hui l'API ne mappe que `RIDE`/`DELIVERY`).

### 3.3 Commissions — garde-fou *(P1, décision produit)*
Le front impose aujourd'hui une **égalité à 15 %** (et exclut la part chauffeur), alors que le plan parle d'un **garde-fou cumul ≤ 100 %** avec saisie libre des trois parts (plateforme/partenaire/franchise).
- **À trancher** : confirmer la règle métier réelle. Si « ≤ 100 % », adapter la validation (front + backend) pour autoriser la saisie libre et ne plafonner qu'au cumul.

### 3.4 Bonus — gabarit KPI à plages *(P0)*
Le modèle actuel ne gère qu'un seul KPI (nb courses → palier). Le plan exige un **gabarit KPI à plages min/max** sur 4 KPI : nb courses (30-80), note (4.0-5.0), acceptation (80-95 %), annulation (2-10 %).
- **Backend requis** : étendre le modèle `bonus rule` pour porter ces 4 KPI avec bornes min/max (`bonusRules.api.types.ts` ne connaît que `min_trips/reward_xof`).
- **Garde-fou central** : empêcher une franchise de sortir des plages globales définies par le central (validation serveur).

### 3.5 Bonus — moteur automatique *(P0)*
Le front va brancher le déclencheur manuel et la page de résultats **si les endpoints existent**. Backend requis pour :
- **`POST /v1/admin/bonus/run-evaluation`** : confirmer le contrat (params période, réponse) + le **cron de fin de période**.
- **`GET /v1/admin/bonus-awards`** : confirmer le contrat (liste des crédits par chauffeur, montant, période, règle source, statut **éligible / non-éligible**) — déclaré dans `links.ts:303` mais jamais alimenté.
- **Crédit wallet automatique** + notification chauffeur + logs d'audit horodatés (UC-FR02).

---

## 4. Reporting multiservices & 22 rapports *(UC-C01 / UC-C02 — slides 21 & 41)*

### 4.1 Ventilation par service *(P0)*
Le front ne peut pas ventiler des données qu'il ne reçoit pas. Backend requis pour :
- **Dashboard central** : accepter un filtre `service` et renvoyer un agrégat **`by_service[]`** (VTC/livraison/fret/location) — aujourd'hui l'API ne gère que `franchiseId/partnerId/cityId` (`dashboard.api.types.ts:44-53`).
- **Finance** : agrégats `by_service[]` (GMV, commissions, flux) — `AdminFinanceDashboard` n'a que `by_franchise` + `payment_mix`.
- *(Le filtre service sur la liste Transactions est traité côté front : `service_type` est déjà mappé.)*

### 4.2 Rapports de taux *(P1)*
Exposer les indicateurs **#18 taux d'annulation, #19 taux d'acceptation, #20 taux de finalisation** (par service/zone/franchise/période). Inexistants côté API.

### 4.3 Rapports manquants *(P1)*
Exposer en endpoints consolidés exportables : **#02** activité par service, **#05** par partenaire, **#06** par chauffeur, **#07** par livreur, **#10** commissions partenaires, **#16** incidents (rapport reporting), **#22** conformité globale.

### 4.4 Exports serveur complets *(P0 — #22)*
Aujourd'hui l'export CSV/Excel ne porte que sur **la page courante** (pagination serveur). Backend requis pour :
- Endpoints d'**export complet filtré** (blob CSV/Excel/PDF) pour : journal d'audit, ledger, transactions, rapports agrégés. Le front a déjà `downloadBlob` et l'utilise pour le ledger compta (`ledgerExport`) → généraliser le même pattern.

---

## 5. Audit & conformité *(UC-AU01 — slide 45)*

- **Attributs manquants** *(P1)* : `AuditLogEntry` doit porter **IP**, **user_agent**, **valeur avant / valeur après**, et un **identifiant d'intégrité (hash)** (`settingsExtended.service.ts:23`).
- **Inviolabilité** *(P0 côté garantie)* : garantir l'audit **append-only** côté serveur (aucune modification rétroactive, même super-admin ; toute tentative journalisée).
- **Filtres** *(P1)* : accepter les query params `type d'action`, `profil/role`, `date_from/date_to`, `IP` (le front sait déjà sérialiser `date_from/date_to/type`).
- **Émission des événements** *(P1)* : garantir qu'**chaque action sensible** (connexions admin, modifs tarifs/commissions, recharges, bonus, suspensions, validations partenaires/franchises, modifs rôles, exports financiers, accès données perso, réclamation+dédommagement) génère bien une entrée d'audit.
- **Rétention 12 mois** *(P2)* : exposer la politique (le front affichera l'indication).
- **Profil auditeur** : cf. §1 / §8.

---

## 6. Réclamations & litiges *(UC-S01 / UC-C03 — slides 41 & 43)*

- **Workflow validation finance + crédit wallet** *(P0)* : la résolution de litige avec dédommagement doit passer par un **statut intermédiaire « En attente validation finance »**, une **approbation côté finance/compta**, puis un **crédit wallet** matérialisé (transaction). Aujourd'hui l'agent support exécute un POST direct sans validation ni crédit (`disputes.service.ts:34`).
- **Visibilité compta** *(P0)* : endpoints pour que le portail compta **liste et valide** les remboursements issus de litiges (file de validation + traçabilité crédit wallet).
- **Tickets admin** *(P1)* : exposer côté admin les endpoints **détail / réponse / changement de statut / assignation** (ils existent pour la franchise : `supportTicketById`, `supportTicketReply` — `links.ts:534-535` ; l'admin n'a que la liste).
- **SLA** *(P1)* : porter sur tickets/disputes les **échéances** (prise en charge 24h, 1ʳᵉ réponse 4h, résolution 72h, escalade 5j) pour calcul/affichage côté front.
- **Catégories** *(P1)* : exposer un **enum** des 7 catégories (course non effectuée, surfacturation, comportement, colis endommagé/perdu, wallet incorrect, commission contestée, autre).

---

## 7. Livreurs & multiservices *(fonction #06 / UC-C02)*

- **Opérateur livreur distinct** *(P0)* : modéliser un **type d'opérateur** (chauffeur VTC vs livreur) et exposer les **7 indicateurs livreur** (nb livraisons, montants encaissés, commissions, solde wallet, statuts livraisons, historique, réclamations — slide 19). Le front pourra alors créer l'écran dédié. *(Le filtre/colonne par catégorie est ajouté côté front via `ride_category_code` déjà mappé.)*
- **Location admin** *(P1)* : endpoints de supervision Location (réservations, véhicules loués, contrats) — aujourd'hui uniquement côté partenaire.
- **Fret admin** *(P1)* : exposer/confirmer les données cargo (`freight_cargo`) pour affichage sur la fiche course admin.

---

## 8. Divers backend *(P1/P2)*

- **#03 Franchises** : endpoints **suspendre / réactiver** une franchise (existent pour les partenaires). *(P1)*
- **#11 Zones** : livrer l'**API v1 admin** de création de zone + édition du polygone (aujourd'hui éditable **seulement en mode legacy/mock**, lecture seule en prod). *(P1)*
- **#18 Conformité & logs** : définir le périmètre (logs sécurité/système, exports réglementaires, registre RGPD) + endpoints. *(P1)*
- **#08 Suivi anomalies** : endpoint + modèle pour un **registre d'anomalies** recette/production (origine, statut, escalade). *(P1)*
- **7 comptes centraux** : provisioning des profils **conformité/auditeur** et **direction lecture seule** (cf. §1). *(P1)*

---

## 9. Récapitulatif des dépendances front → backend

| Chantier front livré | Débloqué pleinement par |
|----------------------|-------------------------|
| Champ date tarif | §3.1 (versioning/historique serveur) |
| Sélecteur 4 services tarifs | §3.2 (accepter FREIGHT/RENTAL) |
| Déclencheur bonus + page awards | §3.5 (contrats `run-evaluation` / `bonus-awards`) |
| Filtre service Transactions | §4.1 (filtre/agrégat backend pour le dashboard & finance) |
| Filtre/colonne livreur (flotte) | §7 (type opérateur + 7 indicateurs) |
| Filtres journal d'audit | §5 (query params + champs IP/diff) |
| Garde permission route audit | §1 (permissions réelles par compte) |

---

*À mettre à jour conjointement avec `ANALYSE-RECETTE-ADMIN-COMPTA-V2.md` après chaque livraison backend.*
