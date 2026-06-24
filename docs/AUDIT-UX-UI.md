# Audit UX/UI — UpJunoo Backoffice

> **Pour le Claude qui implémente :** ce document est un brief d'exécution. Il liste **82 constats** issus d'un audit du code réel, organisés par priorité. Chaque constat indique le(s) fichier(s) avec lignes, le problème, et la correction attendue. Traite-les dans l'ordre des priorités (P0 → P1 → P2). Avant chaque correction, **lis le fichier ciblé** : le code a pu évoluer depuis l'audit (daté du 2026-06-22). Vérifie que le problème existe toujours, puis corrige. Coche les cases `[ ]` au fur et à mesure.

## Contexte projet

- **Stack** : Next.js 15 (App Router, Turbopack), React 19, TailwindCSS 3.4, Zustand, TanStack Query, Leaflet/Mapbox, socket.io-client, react-hot-toast.
- **Domaine** : plateforme de transport / VTC (Abidjan, Côte d'Ivoire).
- **Architecture** :
  - `src/app/` — pages App Router. Groupes : `(admin)`, `(partner)`, `(franchise)` + dispatch/compta/reporting/support. `new/` = formulaires de création, `[id]/` = détails.
  - `src/portals/` — shells par portail, navigation (`*Nav.ts`), sidebar/topbar partagés.
  - `src/shared/ui/` — bibliothèque de composants (DataTable, KpiCard, Button, modals, filtres, pills, skeletons…).
  - `src/styles/` — design tokens (`tokens.css`, `theme.css`, `motion.css`, `kpi-cards.css`).
  - `src/features/` — logique métier par domaine (ops, network, safety, finance, fleet, marketing…).
- **Conventions importantes** : tokens CSS mappés dans `tailwind.config.ts` (navy/teal, surface, border), dark mode via `[data-theme="dark"]`, formatage `fr-CI`.

## Notes par dimension (état initial /10)

| Dimension | Note | Dimension | Note |
|---|---|---|---|
| Responsive | 7 | Tableaux | 6 |
| Design system | 6 | Navigation | 6 |
| Finition | 6 | Formulaires | 5 |
| Feedback / états | 5 | UX métier | 5 |
| **Accessibilité** | **4** | | |

**Thème dominant** : plusieurs éléments d'UI « mentent » à l'opérateur (CTA morts, échecs silencieux, données page-courante présentées comme globales). Priorité = fiabiliser ces comportements avant l'esthétique.

---

# 🔴 P0 — Bugs UX critiques (l'UI trompe l'opérateur)

Quasiment tous des quick-wins à fort impact. À faire en premier.

- [ ] **1. `apiWithNotify.post` ne lève pas d'erreur sur réponse non-OK**
  - **Fichier** : `src/core/http/apiClient.ts:159-177`
  - **Problème** : sur HTTP 4xx/5xx, `handleApiResponse` renvoie `false` et la fonction retourne `null` sans `throw`. La mutation TanStack Query passe donc en `onSuccess`. Conséquence sur les modals SOS (`src/features/safety/components/SosIncidentDetailView.tsx:345-353` et `:399-407`) : le toast d'erreur s'affiche mais le `onSuccess` ferme le modal → l'opérateur croit l'action faite.
  - **Correction** : faire `throw` dans `apiWithNotify.post` (et les autres verbes) quand `handleApiResponse` renvoie `false`, comme dans le bloc `catch`. Vérifier tous les consommateurs d'`apiWithNotify` pour qu'ils gèrent `onError`.

- [ ] **2. Bouton « Annuler la course » sans handler**
  - **Fichier** : `src/features/ops/pages/TripDetailPage.tsx:77-81`
  - **Problème** : le bouton (statuts requested/matching/assigned/in_progress) n'a aucun `onClick` → clic sans effet sur un flux sensible.
  - **Correction** : câbler à une mutation d'annulation avec `ConfirmModal` (motif requis), ou retirer le bouton tant que l'action n'existe pas. Pas de CTA mort.

- [ ] **3. Création marketing qui échoue en silence (pas d'`onError`)**
  - **Fichiers** : `src/features/marketing/api/marketing.queries.ts:28-76` ; `src/features/marketing/pages/MarketingPromoNewPage.tsx:36-49` ; `MarketingCampaignNewPage.tsx:35-46`
  - **Problème** : mutations promo/campagne/bannière n'ont qu'un `onSuccess`. Sur erreur API, aucun message, le bouton se réactive → perte de saisie silencieuse.
  - **Correction** : ajouter `onError` (`notificationService.error(message)`) à chaque mutation et/ou afficher `create.isError` dans le formulaire. S'aligner sur le pattern `try/catch + setErrors` de `PartnerCreateForm.tsx:278-282`.

- [ ] **4. `scopeLabel` (périmètre tenant) codé en dur et trompeur**
  - **Fichiers** : `src/portals/partner/PartnerShell.tsx:22` ; `src/portals/franchise/FranchiseShell.tsx:21` ; `src/portals/admin/Topbar.tsx:24-26`
  - **Problème** : tout partenaire voit « Ma flotte · Cocody Express », toute franchise « Pays · Côte d'Ivoire ». Le repère de contexte central ment.
  - **Correction** : brancher `scopeLabel` sur les vraies données user/tenant (`useAuthStore` + entité associée). Le portail dispatch le fait déjà : `Dispatch · ${zones}` (`src/portals/dispatch/DispatchShell.tsx:20`) → généraliser ce pattern.

- [ ] **5. Tri de colonnes : trie seulement la page visible en pagination serveur**
  - **Fichiers** : `src/shared/ui/DataTable.tsx:154-171` ; pages Partner (Orders/Vehicles/Drivers/Performance) avec `sortKey` + `serverPagination`
  - **Problème** : `[...data].sort` ne porte que sur la page courante (25 lignes). Cliquer « Montant » réordonne 25 lignes sur N. Erreur de décision silencieuse.
  - **Correction** : (a) propager `sort`/`order` au serveur via `useServerTableState` + refetch ; OU (b) désactiver visuellement le tri (pas de flèches cliquables) quand `serverPagination` est actif. Documenter que `sortKey` est réservé au mode client.

- [ ] **6. Export : ne porte que sur la page courante en pagination serveur**
  - **Fichiers** : `src/shared/ui/DataTable.tsx:202-203` ; `src/shared/lib/tableExport.ts:11-16`
  - **Problème** : `handleExport` exporte `data` = page affichée. Cliquer « Excel » sur 5 000 transactions sort 25 lignes alors que le compteur affiche 5 000. Grave en compta/réconciliation.
  - **Correction** : en mode serveur, appeler un endpoint d'export serveur respectant les filtres (`downloadBlob` existe déjà dans `tableExport.ts:67`), OU refetch toutes les pages, OU a minima afficher « Export limité à la page affichée (N lignes) » et désactiver l'export complet.

- [ ] **7. Jargon technique / texte de dev exposé en prod (réconciliation)**
  - **Fichier** : `src/features/finance/pages/ReconciliationListPage.tsx:163-168`
  - **Problème** : affiche « POST /v1/admin/payments/reconcile-batch … alimenté par le mock v2 » à l'opérateur finance.
  - **Correction** : remplacer par une explication métier (« Rapprochement automatique des paiements PayDunya. Cliquez pour relancer les paiements en attente. ») et supprimer toute référence endpoint/mock.

- [ ] **8. Bouton « ⌘K Rechercher » inerte (recherche globale inexistante)**
  - **Fichier** : `src/portals/admin/Topbar.tsx:17-23`
  - **Problème** : `<button>` sans `onClick`, sans raccourci, aucune palette de commandes dans le code. Promesse non tenue.
  - **Correction (P0 minimal)** : retirer le bouton. **(Voir aussi chantier P2-nav pour l'implémenter réellement.)**

---

# 🔴🟠 P0 bis — Flux métier critiques (SOS / finance)

- [ ] **9. SOS : impossible d'appeler la victime depuis l'incident** *(constat le plus grave)*
  - **Fichiers** : `src/features/safety/components/SosIncidentDetailView.tsx:254-315` ; `src/features/safety/api/sos.types.ts:24-57`
  - **Problème** : `SosIncident` n'expose aucun téléphone client/chauffeur ; la fiche affiche des IDs tronqués. Sur un flux vie/mort, joindre la personne est impossible.
  - **Correction** : exposer `client_phone` et `driver_phone` dans `SosIncidentDetail` ; afficher de gros boutons « Appeler le client » / « Appeler le chauffeur » (lien `tel:`) + nom complet. Idéalement le contact d'urgence (guardian) si l'API le fournit.

- [ ] **10. SOS : panneau d'action prioritaire absent en haut de fiche**
  - **Fichier** : `src/features/safety/components/SosIncidentDetailView.tsx:110-138`
  - **Problème** : actions critiques reléguées dans le PageHeader, pas de hiérarchie d'urgence ; `age_minutes`/`last_location_age_minutes` pas mis en avant ; statut « GPS perdu » absent du détail.
  - **Correction** : barre d'urgence sticky en tête (« Déclenché il y a X min », dernier GPS il y a Y min en rouge si >5 min, score risque, CTA « Prendre en charge » proéminent). Reprendre les `attention_flags` de `SosActiveIncidentCard`.

- [ ] **11. SOS : carte de détail sans rafraîchissement de la position live**
  - **Fichiers** : `src/features/safety/components/SosIncidentDetailView.tsx:188-193` ; `src/features/safety/api/sos.queries.ts:29-36`
  - **Problème** : polling 30s mais carte reçoit lat/lng figée, rien n'indique la fraîcheur ni ne recentre sur le dernier point.
  - **Correction** : afficher l'horodatage + ancienneté du dernier point GPS, recentrer automatiquement à chaque refresh, abaisser l'intervalle à 10-15s pour incidents actifs/escaladés, distinguer point initial vs courant.

- [ ] **12. Réconciliation finance : aucune action de résolution des écarts**
  - **Fichier** : `src/features/finance/pages/ReconciliationListPage.tsx:60-133`
  - **Problème** : une ligne « Écart détecté » n'offre aucune action ; seul bouton global « Réconcilier PayDunya (batch) » relance tout en aveugle.
  - **Correction** : colonne d'action par ligne (ouvrir la transaction `order_id`, marquer résolu/ignoré, relancer un paiement précis), trier les écarts en haut par défaut.

- [ ] **13. Détail retrait : pas de garde-fou si solde < montant**
  - **Fichiers** : `src/features/finance/pages/WithdrawalDetailPage.tsx:81-92`, `:148-157` ; `WithdrawalsListPage.tsx:228-242`
  - **Problème** : montant et solde affichés côte à côte mais aucune alerte quand `amount_fcfa > wallet_balance_fcfa` avant approbation → risque financier.
  - **Correction** : mettre en évidence (rouge + message) le dépassement, désactiver/avertir dans la `ConfirmModal`, afficher le solde **retirable** plutôt que brut.

---

# 🟠 P1 — Accessibilité (note 4/10, la plus faible)

- [ ] **14. Aucun piégeage du focus dans les modals et la lightbox** *(critique a11y)*
  - **Fichiers** : `src/shared/ui/ConfirmModal.tsx:29-60` ; `RejectReasonModal.tsx:40-77` ; `DocumentLightbox.tsx:93-229` ; drawer mobile `src/portals/shared/PortalSidebar.tsx:54`
  - **Problème** : le focus reste en arrière-plan, l'utilisateur clavier sort du modal avec Tab ; pas de focus initial ni de restauration. Blocage WCAG 2.4.3 / 2.1.2.
  - **Correction** : créer un hook `useFocusTrap` (ou intégrer Radix Dialog) appliqué dans `ModalPortal` + `DocumentLightbox` : mémoriser `document.activeElement`, focus initial, boucle Tab/Shift+Tab dans `role="dialog"`, restauration à la fermeture.

- [ ] **15. Aucun style `:focus-visible` global ; `Button` sans anneau de focus** *(critique a11y)*
  - **Fichiers** : `src/app/globals.css` (aucun `:focus-visible`) ; `src/shared/ui/Button.tsx:26` ; `PortalSidebar.tsx:101` ; `Tabs.tsx:24`
  - **Correction** : ajouter dans `globals.css` une règle globale `a:focus-visible, button:focus-visible, [role="button"]:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 2px solid var(--color-teal); outline-offset: 2px; }`. Ajouter `focus-visible:ring-2 focus-visible:ring-teal` sur `Button` et les liens de `PortalSidebar`/`Tabs`. Ne jamais utiliser `focus:outline-none` sans ring de substitution.

- [ ] **16. Onglets (`Tabs`) non navigables au clavier, non liés au panneau**
  - **Fichiers** : `src/shared/ui/Tabs.tsx:14-38` ; consommateurs : `DriverDetailPage.tsx:313`, `PartnerDetailPage.tsx`, `ZoneDetailPage.tsx`, `AdminVehicleDetailPage.tsx`
  - **Problème** : pas de flèches gauche/droite, pas de `tabIndex` roving, pas d'`aria-controls`, contenus sans `role="tabpanel"`/`aria-labelledby`.
  - **Correction** : implémenter le pattern WAI-ARIA Tabs (flèches + Home/End, `tabIndex={active?0:-1}`, `id`+`aria-controls`), envelopper chaque contenu dans `<div role="tabpanel" aria-labelledby=… tabIndex={0}>`.

- [ ] **17. Labels de filtres non associés (`<span>` au lieu de `<label>`)**
  - **Fichiers** : `src/shared/ui/FilterField.tsx:19-25` ; `SelectFilter.tsx:33` ; `SearchInput.tsx:17`
  - **Problème** : pas de nom accessible sur les `<select>`/recherche. WCAG 1.3.1 / 4.1.2 / 3.3.2.
  - **Correction** : `<label htmlFor={id}>` + `id` via `useId` propagé au contrôle. Rapide : `aria-label={label}` sur `SelectFilter` et `SearchInput`.

- [ ] **18. `PhoneInput` : liste de pays inaccessible au clavier**
  - **Fichier** : `src/shared/ui/PhoneInput.tsx:94-144`
  - **Correction** : `aria-haspopup="listbox"`, `aria-expanded`, `aria-label` sur le bouton ; `role="listbox"`/`role="option"`/`aria-selected` ; navigation flèches + Entrée + Échap ; focus dans la liste à l'ouverture.

- [ ] **19. Contraste insuffisant du token `muted`** *(quick-win)*
  - **Fichier** : `src/styles/tokens.css:21` (`--color-muted: #878a99` sur blanc ≈ **2,9:1**, min AA 4,5)
  - **Problème** : utilisé partout (en-têtes DataTable, labels filtres, breadcrumb, scopeLabel).
  - **Correction** : assombrir vers `#6b7280`/`#5b6270`. Vérifier aussi la variante dark (`#a3adbe` sur `#161d28`). Éviter le texte informatif en `text-[10px]` (labels filtres → `text-xs` mini).

- [ ] **20. En-têtes de tri du DataTable non actionnables au clavier** *(quick-win)*
  - **Fichier** : `src/shared/ui/DataTable.tsx:304-309`
  - **Correction** : mettre le contenu du `<th>` triable dans un `<button>` interne (ou `role="button"`+`tabIndex={0}`+`onKeyDown` Entrée/Espace) + `aria-label` « Trier par {col.header} ».

- [ ] **21. Lignes de tableau cliquables sans équivalent clavier**
  - **Fichier** : `src/shared/ui/DataTable.tsx:341-358`
  - **Correction** : préférer un vrai `<Link>` dans la 1re cellule vers la fiche détail (meilleur pour nouvel onglet) ; sinon `tabIndex={0}`+`role="button"`+`aria-label`+`onKeyDown`.

- [ ] **22. Lightbox : zoom/fermeture inaccessibles au clavier, focus non géré**
  - **Fichier** : `src/shared/ui/DocumentLightbox.tsx:66-76`, `:110-141`
  - **Correction** : focus initial sur Fermer/dialog, focus trap, restauration à la fermeture ; raccourcis `+`/`-` pour le zoom.

- [ ] **23. Absence de skip-link vers le contenu principal** *(quick-win)*
  - **Fichier** : `src/portals/shared/PortalShellLayout.tsx:54-85`
  - **Correction** : `<a href="#main-content" class="sr-only focus:not-sr-only …">Aller au contenu principal</a>` en tête + `id="main-content" tabIndex={-1}` sur `<main>`. Définir l'utilitaire `sr-only` dans `globals.css`.

- [ ] **24. Compteur de notifications non annoncé, alertes SOS audio-only** *(quick-win)*
  - **Fichiers** : `src/portals/shared/NotificationBellButton.tsx:33-37` ; `AdminSosSoundListener.tsx` ; `src/shared/lib/sosNotificationSound.ts`
  - **Correction** : inclure le compteur dans l'`aria-label` du lien (`Notifications, ${unread} non lues`) ; région `aria-live="polite"` pour notifs, `role="alert"`/`aria-live="assertive"` pour SOS, en complément du son (WCAG 1.4.2 / 4.1.3).

- [ ] **25. `aria-modal` mal valorisé, dialog sans `aria-labelledby`** *(quick-win)*
  - **Fichiers** : `src/shared/ui/ConfirmModal.tsx:38-43` ; `RejectReasonModal.tsx:49-54`
  - **Correction** : `aria-modal="true"`, `id` sur le `<h2>` + `aria-labelledby` sur `role="dialog"`.

- [ ] **26. Groupes de navigation repliables sans `aria-controls`** *(quick-win)*
  - **Fichier** : `src/portals/shared/PortalSidebar.tsx:74-93`
  - **Correction** : `id` sur l'`<ul>` + `aria-controls={id}` sur le bouton de groupe.

---

# 🟠 P1 — Tableaux, filtres & feedback (efficacité opérateur)

- [ ] **27. Filtres non persistés dans l'URL (perte au refresh, non partageables)**
  - **Fichiers** : `src/shared/hooks/useInitialUrlFilter.ts:19-28` ; `useServerTableState.ts:16-18`
  - **Problème** : filtres/recherche/page en `useState` local ; F5 réinitialise tout, impossible de partager un lien « transactions échouées franchise X page 3 », bouton Précédent ne restaure rien.
  - **Correction** : faire de `useServerTableState` le miroir de l'URL (`useSearchParams` + `router.replace` shallow) pour `page`, `per_page`, `search` (debouncé) et filtres principaux.

- [ ] **28. Aucun état d'erreur intégré au DataTable (message rouge nu)**
  - **Fichiers** : `DriversListPage.tsx:243-247` ; `TransactionsListPage.tsx:186-190` (motif répété sur ~37 pages)
  - **Problème** : early-return d'un `<p className="text-red-600">` qui efface PageHeader + filtres, sans « Réessayer ».
  - **Correction** : ajouter `isError`/`errorMessage`/`onRetry` au DataTable (ligne d'erreur dans le `tbody` en gardant header+filtres + bouton « Réessayer » branché sur `refetch`). Créer un composant `ErrorState` partagé (sur le modèle d'`EmptyState`) et remplacer les `<p>` rouges. (Voir aussi constat #36.)

- [ ] **29. État vide ne distingue pas « aucune donnée » de « aucun résultat filtre »**
  - **Fichiers** : `src/shared/ui/DataTable.tsx:325-333` ; ~30 pages sans `emptyDescription`
  - **Correction** : passer `hasActiveFilters` au DataTable ; si filtres actifs → « Aucun résultat pour ces filtres » + bouton « Réinitialiser les filtres » (`onReset`). `DriversListPage.tsx:302` le fait à la main → généraliser dans le composant.

- [ ] **30. Pas de colonnes figées : tableaux larges illisibles au scroll horizontal**
  - **Fichiers** : `src/shared/ui/DataTable.tsx:282-285` ; tables 8 colonnes (`DriversListPage`, `TransactionsListPage`)
  - **Correction** : option `stickyFirstColumn` (+ colonne sélection) via `position: sticky; left: 0` + fond `surface`. Prioriser les listes > 6 colonnes.

- [ ] **31. Sélection limitée à la page courante, pas de « tout sélectionner le résultat »**
  - **Fichiers** : `src/shared/ui/DataTable.tsx:173-183` ; `DriversListPage.tsx:181`
  - **Correction** : préciser « Tout sélectionner (page) » dans l'`aria-label` ; quand `allSelected` et `total>pageSize`, bannière « Sélectionner les X correspondant aux filtres » déclenchant une sélection serveur.

- [ ] **32. `SearchInput` sans icône, sans clear, sans indicateur de saisie** *(quick-win)*
  - **Fichier** : `src/shared/ui/SearchInput.tsx:16-24`
  - **Correction** : icône loupe à gauche, bouton clear explicite, petit spinner « recherche… » quand `value !== debouncedSearch` ou `isFetching` (réseau lent Abidjan).

- [ ] **33. `DateRangeFilter` : presets limités à 7j, pas de validation** *(quick-win)*
  - **Fichier** : `src/shared/ui/DateRangeFilter.tsx:15-21`, `:81-101`
  - **Correction** : ajouter presets « 30j », « Ce mois », « Mois dernier » ; valider/normaliser la plage custom ; afficher le `rangeLabel` même pour les presets.

- [ ] **34. Son SOS et dashboard partagent la même `queryKey` avec intervalles différents**
  - **Fichiers** : `src/features/safety/hooks/useSosIncomingSound.ts:72-78` (15s) ; `src/features/safety/api/sos.queries.ts:14-20` (30s) ; listeners montés dans les 3 shells
  - **Problème** : un seul cache par clé → intervalle effectif et comportement background non déterministes, double charge réseau.
  - **Correction** : clé dédiée pour le polling sonore (`[...sosKeys.dashboard(), 'sound']`) OU réutiliser exactement la config de `useSosDashboard` OU centraliser le polling dans un seul hook.

- [ ] **35. Modals sans gestion du focus ni de la touche Échap**
  - **Fichiers** : `ConfirmModal.tsx:29-60` ; `RejectReasonModal.tsx:41-78` ; modals inline SOS `SosIncidentDetailView.tsx:320-357`, `:359-414`
  - **Correction** : appliquer le `useFocusTrap`/`useModalDismiss` du constat #14 (Échap, focus initial, restauration). Idéalement remplacer les modals inline SOS par `ConfirmModal`/`RejectReasonModal`.

- [ ] **36. États d'erreur réseau pauvres et non actionnables (faux retry)**
  - **Fichiers** : pattern sur ~50 pages (`FranchisesListPage.tsx:107-109`, `SosIncidentsListView.tsx:154-158`, `SosGuardianView.tsx:33-39`) ; faux retry par navigation `FranchiseDashboardPage.tsx:26-35`
  - **Correction** : composant `ErrorState` partagé (message contextualisé selon code, bouton « Réessayer » → `query.refetch()`). Optionnel : afficher le cache avec bandeau « données potentiellement obsolètes ».

- [ ] **37. `EmptyState` générique pas exploité : vides muets sans action**
  - **Fichiers** : `src/shared/ui/EmptyState.tsx:10-30` (supporte action) vs DataTable sans CTA `:325-333`
  - **Correction** : slot d'action dans le vide du DataTable (« Réinitialiser les filtres » si `hasActiveFilters`, sinon « Créer X ») ; enrichir l'icône contextuelle.

- [ ] **38. Toasts : position dupliquée + pas de garde anti-empilement** *(quick-win)*
  - **Fichiers** : `src/app/providers/AppProviders.tsx:18` ; `src/core/http/notificationService.ts:55-115`
  - **Correction** : centraliser style/position dans `<Toaster toastOptions>`, retirer le `position` systématique (override explicite uniquement), définir `gutter` + nombre max de toasts visibles.

- [ ] **39. Temps réel SOS = polling, libellé d'intervalle incohérent**
  - **Fichiers** : `src/features/safety/api/sos.realtime.ts:1-4` (15s) ; libellé « 30 secondes » `SosGuardianView.tsx:26`
  - **Correction** : aligner les libellés sur l'intervalle réel, ajouter un `LiveRefreshIndicator` au centre SOS, envisager un canal socket (comme la carte live).

- [ ] **40. Absence quasi totale de mises à jour optimistes** *(gros chantier)*
  - **Fichiers** : `onMutate`/`setQueryData` dans seulement 4 fichiers ; mutations SOS `sos.queries.ts:45-60`
  - **Correction** : ajouter optimistic updates (`onMutate` + `setQueryData` + rollback `onError`) sur les actions fréquentes (changement statut, acknowledge, prise/refus). À défaut, état « Enregistrement… » + spinner inline plutôt qu'un simple bouton désactivé.

---

# 🟠 P1 — Formulaires (réduction d'erreurs)

- [ ] **41. Aucune protection contre la perte de saisie (pas de garde navigation/`beforeunload`)**
  - **Fichiers** : transversal ; cas critique `FleetPairCreateWizard.tsx` (long, multi-étapes, documents)
  - **Correction** : hook `useUnsavedChanges` branché sur `window.beforeunload` + interception de la navigation Next (Annuler/retour). Optionnel : persister un brouillon (infra `onboardingFileStore` IndexedDB déjà présente dans `assistant/lib`).

- [ ] **42. Validation au submit seulement, erreurs non rattachées aux champs**
  - **Fichiers** : `PartnerCreateForm.tsx:178-220`, `:305-311` ; `StaffCreatePage.tsx:46-61` ; `FleetPairCreateWizard.tsx:453-485`, `:549-555`
  - **Problème** : erreurs en bloc `string[]` en haut, sans `aria-invalid`/`aria-describedby`/focus sur premier champ fautif/`role="alert"`.
  - **Correction** : associer chaque erreur à son champ (`aria-invalid`+`aria-describedby`), focus sur le 1er champ invalide, `role="alert"` sur le bandeau, validation au blur pour email/mot de passe/téléphone.

- [ ] **43. Aucune validation taille/format réel des documents téléversés**
  - **Fichiers** : `DocumentUploadRow.tsx:57-66` ; `DocumentRectoVersoRow.tsx:75-81` ; consommateurs `DocumentsStep.tsx`
  - **Problème** : seulement `accept="image/*,.pdf"`, aucun contrôle taille/MIME → échec tardif au submit serveur (combiné au #1, potentiellement silencieux).
  - **Correction** : dans `onSelect`, valider taille (≤ 5-8 Mo) et type (jpeg/png/pdf), rejeter avec message inline, afficher la contrainte (« JPG/PNG/PDF, max 8 Mo »). Centraliser dans un util partagé.

- [ ] **44. Wizard multi-étapes peu accessible / non navigable au clavier**
  - **Fichiers** : `src/shared/ui/WizardStepper.tsx:14-71` ; `FleetPairCreateWizard.tsx:546-555`
  - **Correction** : déplacer le focus vers le titre de la nouvelle étape (`tabIndex=-1`) + `aria-live` à chaque `setStepId` ; texte caché « Étape terminée/en cours » sur les pastilles ; permettre de revenir à une étape validée.

- [ ] **45. Pas de validation de cohérence des plages de dates (campagnes/promos)** *(quick-win)*
  - **Fichiers** : `MarketingCampaignNewPage.tsx:80-101` ; `MarketingPromoNewPage.tsx:110-119`
  - **Correction** : `min={values.starts_at}` sur Fin, `min={aujourd'hui}` sur expiration + validation au submit.

- [ ] **46. Pas de validation/normalisation du format de plaque ivoirienne**
  - **Fichier** : `FleetPairCreateWizard.tsx:856-870` (placeholder `AB-452-CI`)
  - **Correction** : normaliser à la saisie (majuscules, espaces), valider les formats CI (ancien `1234 AB 01`, nouveau `AB-452-CI`, provisoires `WW`), aide de format + message inline.

- [ ] **47. Pas d'autofocus sur le premier champ des formulaires** *(quick-win)*
  - **Fichiers** : transversal (`StaffCreatePage.tsx:115`, `PartnerCreateForm.tsx:320`, `MarketingPromoNewPage.tsx:53`)
  - **Correction** : `autoFocus` (ou focus via ref au montage) sur le 1er champ pertinent, sauf si select dépendant d'un chargement async.

- [ ] **48. Longueur min de mot de passe incohérente entre portails** *(quick-win)*
  - **Fichiers** : `StaffCreatePage.tsx:16` (8) ; `PartnerCreateForm.tsx:198-199` (6) ; `PasswordMatchIndicator.tsx:3` (6)
  - **Correction** : constante unique de politique mot de passe partagée, alignée sur l'exigence backend la plus stricte.

- [ ] **49. Messages de validation approximatifs / champ « recommandé » bloquant** *(quick-win)*
  - **Fichiers** : `FleetPairCreateWizard.tsx:559` (faute « n'hesitez ») ; `PartnerCreateForm.tsx:204-206`, `:222-225` (« Le téléphone est recommandé. » mais bloque le submit)
  - **Correction** : corriger le libellé ; rendre le téléphone réellement optionnel OU le présenter comme requis (aligner message et comportement).

---

# 🔵 P2 — Navigation & architecture de l'information

- [ ] **50. Recherche globale ⌘K réelle** *(gros chantier — sinon retirer, cf. #8)*
  - **Fichier** : `src/portals/admin/Topbar.tsx:17-23`
  - **Correction** : palette de commandes (ex. `cmdk`) déclenchée par Cmd/Ctrl+K, indexant la navigation du portail puis (V2) les entités (courses par ID, chauffeurs, franchises, partenaires).

- [ ] **51. Fil d'Ariane non cliquable**
  - **Fichier** : `src/shared/ui/PageHeader.tsx:11-18` (`breadcrumb.join(" / ")`)
  - **Correction** : type `breadcrumb` → `{ label: string; href?: string }[]`, segments intermédiaires en `<Link>`, dernier non cliquable (compat ascendante avec strings).

- [ ] **52. Tous les onglets navigateur = « UpJunoo Pro »**
  - **Fichier** : `src/app/layout.tsx:14-21`
  - **Correction** : `metadata.title.template` (« %s · UpJunoo ») + title par page (server) ou hook côté client pour les pages `"use client"` ; prioriser courses/fiches/carte/KYC.

- [ ] **53. Aucune page 404 ni état « non autorisé » explicite**
  - **Fichier** : `src/core/auth/AuthGuard.tsx:58-64` (pas de `not-found.tsx`)
  - **Correction** : créer `src/app/not-found.tsx` à la charte (AppLogo + message + bouton retour) ; état « Accès refusé » explicite dans `AuthGuard` au lieu du spinner infini.

- [ ] **54. Cloche de notifications absente des portails admin/franchise/dispatch** *(quick-win)*
  - **Fichiers** : `Topbar.tsx:28-38` ; `FranchiseShell.tsx:18-25` ; `NotificationBellButton.tsx:10` (href figé `/partner/...`)
  - **Correction** : ajouter `NotificationBellButton` aux topbars admin/franchise/dispatch avec `href` paramétré par portail.

- [ ] **55. Logique d'état actif = longue chaîne de `if` codés en dur** *(gros chantier)*
  - **Fichier** : `src/portals/shared/navActive.ts:1-217`
  - **Correction** : déclarer le matching dans `NavItem` (`match: 'exact'|'prefix'` ou `activePaths: (string|RegExp)[]`) et rendre `isNavItemActive` générique.

- [ ] **56. Libellés de menu ambigus (groupe SUPPORT partenaire)** *(quick-win)*
  - **Fichier** : `src/portals/partner/partnerNav.ts:164-184` (« Chat » vs « Chat course »)
  - **Correction** : « Chat support » vs « Messages course » ; cohérence du vocabulaire entre portails.

- [ ] **57. Pas de switch direct entre portails (multi-rôles)**
  - **Fichiers** : `src/app/login/page.tsx:50-77` ; `PortalTopbar.tsx:34-44`
  - **Correction** : sélecteur de portail dans la topbar (sur le badge de rôle) pour les users dont le rôle autorise plusieurs portails (`canAccessPortal`), sans déconnexion.

---

# 🔵 P2 — Design system (cohérence & dette)

- [ ] **58. ~9 composants `Pill` quasi identiques → un primitif `Badge`**
  - **Fichiers** : `StatusPill.tsx`, `EntityStatusPill.tsx`, `TransactionStatusPill.tsx`, `VehicleApprovalPill.tsx`, `ServicePill.tsx`, `ZoneTypePill.tsx`, `DriverPills.tsx`, `src/features/compta/components/ComptaPeriodStatusPill.tsx`
  - **Correction** : créer `Badge`/`Pill` avec props `tone` (neutral|success|warning|danger|info) et `size` ; réécrire les pills métier comme de fines maps `status → {label, tone}`.

- [ ] **59. Couleurs sémantiques non tokenisées → dark mode cassé**
  - **Fichiers** : `tokens.css` (aucun success/warning/danger) ; `EntityStatusPill.tsx:9-13`, `TransactionStatusPill.tsx:9-13`, `VehicleApprovalPill.tsx:10-15`, `DriverPills.tsx:10-15`
  - **Problème** : `bg-amber-50`/`bg-red-50` (182 occurrences) clairs uniquement → pastilles délavées en dark, contrairement aux teal tokenisées.
  - **Correction** : tokens `--color-success/-soft`, `--color-warning/-soft`, `--color-danger/-soft` (valeurs clair + dark), mappés dans Tailwind, remplacer les `bg-amber-50 text-amber-700` par `bg-warning-soft text-warning`.

- [ ] **60. 8 composants Hero KPI dupliquent le wrapper gradient**
  - **Fichiers** : `HeroKpi.tsx:26`, `ComptaHeroKpi.tsx:33`, `FinanceHeroKpi.tsx`, `HeroTripsTodayKpi.tsx`, `AdminTripsListHero.tsx`, `PricingCalibrationHero.tsx`, `DispatchCalibrationHero.tsx`
  - **Correction** : extraire `HeroKpiShell` (gradient, grain, orbes, padding) dans `src/shared/ui` ; tokeniser le gradient (`--color-hero-from`, `--shadow-hero`).

- [ ] **61. Échelle de rayons incohérente (`rounded-card` 375× vs `rounded-lg` 470×)** *(gros chantier)*
  - **Fichiers** : `tailwind.config.ts:45-48` ; `DataTable.tsx:225` vs `Button.tsx:26`
  - **Correction** : échelle complète (`--radius-sm` contrôles, `--radius-md`, `--radius-card`, `--radius-hero`), règle « cartes = `rounded-card`, contrôles = `radius-sm` », migration par catégorie.

- [ ] **62. Couleurs hex codées en dur dans la logique (statuts carte, métier)**
  - **Fichiers** : `src/features/ops/lib/liveMapAvailabilityColors.ts:9-12`, `:25-28` ; `theme.css:181` ; `kpi-cards.css:96-141` ; `HeroKpi.tsx:26`
  - **Correction** : centraliser les couleurs de statut/dispo en tokens (`--color-status-online`…), référer côté Mapbox (via `getComputedStyle`) et classes ; remplacer `rgba(64,81,137,…)` par `color-mix(in srgb, var(--color-navy) X%)`.

- [ ] **63. Composant `Tabs` partagé pas utilisé partout (onglets ad-hoc)**
  - **Fichiers** : `src/shared/ui/Tabs.tsx` ; `.tabs-scroll` `globals.css:38-46`
  - **Correction** : migrer les onglets inline des pages `[id]` vers `<Tabs>` ; documenter `Tabs` comme seul moyen autorisé.

- [ ] **64. Densité/hauteur de ligne non standardisées hors DataTable**
  - **Fichiers** : `DataTable.tsx:135` ; vues ad-hoc (support, compta)
  - **Correction** : tokens d'espacement de densité / classe `.row-compact` ; classe `.panel` partagée pour les paddings (comme `.page-main`).

- [ ] **65. Variantes `KpiCard` mortes / aliasées** *(quick-win)*
  - **Fichier** : `src/shared/ui/KpiCard.tsx:1-126` (navy/teal/ocean/aurora/pearl → alias)
  - **Correction** : réduire `KpiVariant` aux 4 variantes réelles (midnight, deep-teal, slate, charcoal), supprimer `VARIANT_ALIASES` et les doublons.

---

# 🔵 P2 — Finition & micro-interactions

- [ ] **66. Aucun spinner de chargement sur les boutons (`Button` sans prop `loading`)**
  - **Fichiers** : `src/shared/ui/Button.tsx:1-32` ; usages `AdminLoginPage.tsx:62-64`, `DataTable.tsx:238`, `:247`
  - **Correction** : prop `loading?: boolean` → spinner (`svg animate-spin`) à gauche du label, bouton désactivé, largeur conservée. Créer aussi un composant `Spinner` réutilisable. Remplacer les patterns « texte… » ad-hoc.

- [ ] **67. Pas d'anneau focus-visible sur `Button` ni la navigation** *(quick-win — recoupe #15)*
  - **Fichiers** : `Button.tsx:26` ; `PortalSidebar.tsx:77`, `:101` ; `ThemeToggle.tsx:20`

- [ ] **68. Ouverture/fermeture des groupes de nav abrupte (pas d'animation de hauteur)**
  - **Fichier** : `src/portals/shared/PortalSidebar.tsx:92-127`
  - **Correction** : animer la hauteur (`grid-template-rows 0fr→1fr` + `overflow-hidden`, ou `max-height`) avec `--ease-premium` ~200ms ; neutraliser sous `prefers-reduced-motion`.

- [ ] **69. Animation fade-up/stagger inégale + stagger limité à `nth-child(5)`**
  - **Fichiers** : `AdminDashboardPage.tsx:40`, `:71` ; `src/styles/motion.css:7-21`
  - **Correction** : wrapper `<PageEnter>` uniformisant fade-up+stagger ; étendre les délais au-delà de 5 (variable CSS `--i` + `animation-delay: calc(var(--i)*50ms)`).

- [ ] **70. `transition-all` sur `Button` (coût repaint, durée non tokenisée)** *(quick-win)*
  - **Fichiers** : `Button.tsx:26` ; `DataTable.tsx:343` (`duration-120` non standard)
  - **Correction** : `transition-[transform,background-color,opacity,box-shadow] duration-150 ease-premium` ; harmoniser les durées sur une échelle de tokens.

- [ ] **71. Bouton primaire : hover via `opacity` (effet délavé)** *(quick-win)*
  - **Fichier** : `src/shared/ui/Button.tsx:10-11`
  - **Correction** : `hover:bg-teal-dark` (token `--color-teal-dark` existe) au lieu de `hover:opacity-90`, garder `active:scale-[0.98]`.

---

# 🔵 P2 — UX métier (dispatch / KYC / carte / crise)

- [ ] **72. Dispatch : file non re-triée par urgence côté client**
  - **Fichier** : `src/features/ops/pages/DispatchConsolePage.tsx:300-311`, QueueCard `:34-66`, sélection `:165`
  - **Correction** : trier par `waiting_min` décroissant, style d'alerte (bordure/badge rouge) au-delà d'un seuil (>10 min), sélectionner par défaut la course la plus urgente.

- [ ] **73. Dispatch : chauffeurs candidats non triés par pertinence** *(quick-win)*
  - **Fichier** : `src/features/ops/pages/DispatchConsolePage.tsx:360-370`
  - **Correction** : trier par ETA croissant, remonter les « online » assignables, présélectionner le meilleur candidat.

- [ ] **74. KYC : rejet global avec motif codé en dur** *(quick-win)*
  - **Fichier** : `src/features/fleet/pages/DriverDetailPage.tsx:533-544` (envoie toujours « Documents non conformes »)
  - **Correction** : utiliser `RejectReasonModal` pour le rejet global, OU forcer le rejet document par document (déjà bien fait, plus actionnable).

- [ ] **75. KYC : pas de validation côte-à-côte recto/verso en grand**
  - **Fichiers** : `src/shared/ui/KycDocumentGroupCard.tsx:212-226` ; `DocumentPreviewThumbnail.tsx:127-145`
  - **Correction** : lightbox « document » recto+verso côte à côte avec zoom/pan + actions Valider/Rejeter ; `object-contain` au lieu d'`object-cover` (ne pas couper les pièces d'identité).

- [ ] **76. Carte live : panneau chauffeurs sans recherche ni sync carte/liste**
  - **Fichier** : `src/features/ops/components/LiveMapDriversPanel.tsx:164-275`
  - **Correction** : champ recherche (nom/immatriculation) + filtre dispo ; synchroniser survol/clic ligne ↔ highlight + recentrage marqueur.

- [ ] **77. Mode crise : surge global sans garde-fou ni aperçu d'impact**
  - **Fichier** : `src/features/ops/pages/CrisisModePage.tsx:81-175`
  - **Correction** : `ConfirmModal` récapitulant l'impact quand `active=true` ou `pause_dispatch=true` (« suspendre le dispatch pour TOUS les territoires + surge x1.5 »), afficher la portée (courses/zones affectées).

- [ ] **78. SOS : clôture définitive sans double sécurité** *(quick-win)*
  - **Fichier** : `src/features/safety/components/SosIncidentDetailView.tsx:359-414`
  - **Correction** : rendre les notes obligatoires pour `false_alarm`/`other`, récapitulatif/typage visuel de la résolution avant validation.

---

# 🔵 P2 — Responsive (tablette terrain)

- [ ] **79. Cibles tactiles des boutons-icônes sous 44px** *(quick-win)*
  - **Fichiers** : `ThemeToggle.tsx:20`, `NotificationBellButton.tsx:17`, `MobileNavToggle.tsx:11` (tous `h-9 w-9` = 36px)
  - **Correction** : `h-11 w-11` (44px) sous `lg` ; prioriser `MobileNavToggle` (seule porte d'accès à la nav sur mobile).

- [ ] **80. DataTable : pas de vue carte/empilée sur mobile** *(gros chantier — recoupe #30)*
  - **Fichier** : `src/shared/ui/DataTable.tsx:282-380`
  - **Correction** : pour les tables consultées sur tablette (dispatch/courses/SOS), prop `renderCard` optionnel / mode `mobileCards` sous `md`, ou a minima figer la 1re colonne.

- [ ] **81. Pas d'export `viewport` explicite (themeColor mobile)** *(quick-win)*
  - **Fichier** : `src/app/layout.tsx:14-21`
  - **Correction** : `export const viewport: Viewport = { width:'device-width', initialScale:1, themeColor:[{media:'(prefers-color-scheme: dark)', color:'#0b1220'}, {media:'(prefers-color-scheme: light)', color:'#ffffff'}] }`.

- [ ] **82. Modals non plein écran sur mobile / inputs sans hauteur tactile**
  - **Fichiers** : `ConfirmModal.tsx:31-41`, `RejectReasonModal.tsx:42-52` ; `DispatchBookRidePage.tsx:90-145`
  - **Correction** : pour les modals avec formulaire, bottom-sheet plein largeur sous `sm` (`items-end sm:items-center`, `w-full max-w-md rounded-t-card sm:rounded-card max-h-[90vh] overflow-y-auto`) ; classe de champ partagée `min-h-[44px]`.

---

# Recommandations design system transverses

Ces primitifs/règles bénéficient à plusieurs constats à la fois — bons points de départ structurants :

1. **Tokens sémantiques** clair/dark : success / warning / danger / info (+ variantes `-soft`). → débloque #59, #58, #62.
2. **Composant `Badge` unique** (props `tone`/`size`). → remplace les ~9 pills (#58).
3. **Règle `:focus-visible` globale** + ring sur `Button`/liens. → #15, #67.
4. **`Button` enrichi** : prop `loading` + spinner, hover par teinte, transitions ciblées. → #66, #70, #71.
5. **Composants `ErrorState` + `EmptyState` actionnables** (modèle commun). → #28, #36, #37, #29.
6. **`HeroKpiShell`** réutilisable (gradient/grain/orbes tokenisés). → #60.
7. **`Tabs` unique** conforme WAI-ARIA, imposé partout. → #16, #63.
8. **Hook `useFocusTrap`/`useModalDismiss`** appliqué à tous les modals + lightbox. → #14, #22, #35.
9. **Constantes centralisées** : politique mot de passe, contraintes upload, formats (plaque, téléphone). → #43, #46, #48.
10. **`useServerTableState` miroir de l'URL** + tri/export/sélection serveur. → #5, #6, #27, #31.

---

*Audit généré le 2026-06-22 — 82 constats sur 9 dimensions (design system, navigation, formulaires, tableaux, feedback, accessibilité, responsive, finition, UX métier). Vérifier l'existence de chaque problème dans le code avant correction.*
