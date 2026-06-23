/**
 * Génère le rapport de corrections du Portail Partenaire en HTML brandé,
 * dans le style de rapport-corrections.pdf (couverture teal + cartes par anomalie).
 *
 * Usage: node scripts/build-corrections-pdf.mjs
 * Sortie: guide-pdf/rapport-corrections-portail-partenaire.html
 *         (puis convertir via scripts/html-to-pdf.mjs)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "guide-pdf");
fs.mkdirSync(OUT_DIR, { recursive: true });
const SHOTS = path.join(__dirname, "audit-results", "screenshots");

// Mapping fiche N° → capture d'écran (fichier dans audit-results/screenshots)
const SHOT_MAP = {
  "01": "freight_detail.png",
  "02": "zones_fret.png",
  "03": "zone_create_modal.png",
  "04": "tracking_gps.png",
  "05": "wallet_topup_modal.png",
  "06": "wallet___revenus.png",
  "07": "carte_live_flotte.png",
  "08": "rapports.png",
  "09": "profil_partenaire.png",
  "10": "wallet___r_glements.png",
  "11": "performances.png",
  "12": "liste_v_hicules.png",
  "13": "liste_chauffeurs.png",
  "14": "portefeuille.png",
  "15": "support.png",
  "16": "profil_partenaire.png",
  "17": "freight_detail.png",
  "18": "freight_detail.png",
  "19": "fret.png",
  "20": "freight_create_form.png",
  "21": "plannings___shifts.png",
  "22": "carte_live_flotte.png",
  "23": "tracking_gps.png",
  "24": "wallet___revenus.png",
  "25": "courses__orders_.png",
  "26": "courses__orders_.png",
  "27": "detail_d_tail_v_hicule.png",
  "28": "support___notifications.png",
  "29": "support.png",
};

function shotDataUri(n) {
  const file = SHOT_MAP[n];
  if (!file) return null;
  const p = path.join(SHOTS, file);
  if (!fs.existsSync(p)) {
    console.warn("⚠️  capture manquante :", file);
    return null;
  }
  const b64 = fs.readFileSync(p).toString("base64");
  return `data:image/png;base64,${b64}`;
}

const meta = {
  date: "23 juin 2026",
  perimetre:
    "Portail Partenaire — 41 pages, tous les modules (Ma Flotte, Opportunités, Activité, Finance, Support, Compte)",
  methode:
    "Test runtime automatisé (Puppeteer : login + navigation + filtres + pages détail, 37 routes) + revue de code exhaustive des composants de page et des services API",
  destinataire: "Équipe front web (+ backend pour les points ⚙️ API)",
};

const runtime = [
  ["Pages chargées sans crash", "37 / 37"],
  ["Pages OK", "17"],
  ["Pages avec avertissement", "19"],
  ["Pages en erreur (valeur undefined affichée)", "1 (Rapports)"],
  ["Erreurs API observées", "1 × HTTP 403 (/v1/admin/kyc/documents depuis le Profil)"],
  ["Filtres interactifs testés", "Statut chauffeurs ✅ · Recherche courses ✅ · Statut flotte ✅"],
];

// severity: HAUTE | MOYENNE | BASSE
const findings = [
  {
    n: "01", sev: "HAUTE",
    title: "Page « Détail offre de fret » totalement cassée (imports inexistants)",
    area: "Opportunités → Fret · route /partner/freight/[id]",
    constat: "PartnerFreightDetailPage.tsx:9 importe usePartnerFreightOfferDetail et useUpdateFreightOfferStatus qui n'existent pas dans freight.queries.ts (seuls usePartnerFreightOffers, useCreateFreightOffer, useUpdateFreightOffer, useDeleteFreightOffer sont exportés). Aucune route detail n'existe non plus dans LINKS.partner.freight. L'import échoue → composant indéfini.",
    repro: ["Naviguer en URL directe vers /partner/freight/&lt;un-id&gt;.", "La page ne charge pas (module non résolu / composant undefined)."],
    attendu: "La page charge l'offre via un hook réel et permet les transitions de statut.",
    correction: "Créer usePartnerFreightOfferDetail(id) (+ route detail dans LINKS.partner.freight) et useUpdateFreightOfferStatus(). Sinon supprimer la page si non utilisée.",
  },
  {
    n: "02", sev: "HAUTE",
    title: "Page « Zones & Couloirs » entièrement mockée",
    area: "Opportunités → Fret · route /partner/freight/zones",
    constat: "Le tableau est alimenté par un tableau zones codé en dur (PartnerFreightZonesPage.tsx:38-56, commentaire « Mock data pour démonstration ») : « Abidjan Zone 1 » et « Abidjan - Yamoussoukro ». Les stats sont aussi en dur (« Zones actives = 1 », « Couloirs actifs = 1 »). Aucun appel API.",
    repro: ["Ouvrir /partner/freight/zones.", "Toujours les 2 mêmes lignes fictives, quel que soit le partenaire connecté."],
    attendu: "Lister les zones/couloirs réels du partenaire via une API.",
    correction: "Créer un service/queries freight-zones et remplacer le mock par usePartnerFreightZones(table.listParams).",
  },
  {
    n: "03", sev: "HAUTE",
    title: "Création / édition / suppression de zone fret sans effet",
    area: "Opportunités → Fret · route /partner/freight/zones",
    constat: "Formulaire « Nouvelle zone » : le &lt;form&gt; n'a pas de onSubmit et le bouton « Créer » aucun onClick ni type=submit. Suppression : le ConfirmModal a onConfirm={() => setShowDelete(null)} → ferme seulement le modal. Édition : le bouton ouvre setShowEdit(z) mais showEdit n'est jamais consommé (aucun modal rendu).",
    repro: ["« Nouvelle zone » → remplir → « Créer » : rien ne se passe.", "« Supprimer » → confirmer : la ligne reste.", "Icône d'édition : rien ne s'ouvre."],
    attendu: "Création/édition/suppression réelles via mutations, fermeture du modal au succès.",
    correction: "Brancher onSubmit + useCreateFreightZone, une mutation delete dans onConfirm, et rendre un modal d'édition consommant showEdit.",
  },
  {
    n: "04", sev: "HAUTE",
    title: "Page « Tracking GPS » entièrement mockée + carte non fonctionnelle",
    area: "Ma Flotte → Tracking · route /partner/tracking",
    constat: "missions est un tableau codé en dur (PartnerTrackingPage.tsx:48-81, « Mock data ») avec 2 missions fictives. DataTable reçoit data={missions} / isLoading={false}. La « Carte en temps réel » est un placeholder gris ; « Voir carte » ne fait que setSelectedMission et affiche une adresse texte, sans carte.",
    repro: ["Ouvrir /partner/tracking : toujours les 2 mêmes missions fictives.", "Cliquer « Voir carte » : aucune carte n'apparaît.", "La barre de recherche ne filtre rien (mock jamais filtré)."],
    attendu: "Missions réelles via API, recherche fonctionnelle, carte interactive affichant la position.",
    correction: "Remplacer le mock par un hook de requête réel + composant carte ; en attendant, afficher un état « à venir » plutôt que de fausses données.",
  },
  {
    n: "05", sev: "MOYENNE",
    title: "« Alimenter mon compte » — endpoint backend OK, bug front : payload manquant + flux PSP non implémenté",
    area: "Finance → Portefeuille · route /partner/wallet",
    constat: "✅ Reclassé bug FRONT (vérifié le 23/06 sur Swagger live). POST /v1/partners/{id}/wallet/top-up EXISTE et répond 200 — le commentaire wallet.service.ts:439-441 (« endpoint inexistant ») est OBSOLÈTE. Bug entièrement front : aucun payload envoyé, aucune redirection PSP implémentée (mobile_money : « Vous serez redirigé… » reste lettre morte). Le backend est prêt à recevoir l'appel.",
    repro: ["/partner/wallet → « Alimenter mon compte » → saisir un montant → « Alimenter ».", "L'appel n'aboutit pas : payload manquant côté front / flux PSP non implémenté."],
    attendu: "Le modal envoie un payload valide à POST /v1/partners/{id}/wallet/top-up et gère la réponse PSP (redirection Mobile Money / carte).",
    correction: "Supprimer le commentaire obsolète wallet.service.ts:439-441. Implémenter le payload (montant, méthode mobile_money|card, MSISDN). Implémenter le flux PSP (redirection ou confirmation). Demande DB-06 : obtenir la documentation du contrat de l'endpoint auprès du backend.",
  },
  {
    n: "06", sev: "HAUTE",
    title: "Recherche et pagination des « Revenus » totalement inertes",
    area: "Finance → Revenus · route /partner/wallet/revenue",
    constat: "✅ Reclassé bug FRONT (vérifié le 23/06 sur Swagger live). Le backend supporte la pagination et la recherche : GET /v1/partners/{id}/revenue accepte ?page&per_page&search et renvoie {totalXof, entries, pagination} → 200 confirmé. Bug entièrement front : usePartnerRevenuePaginated(params) ignore son argument params — la queryFn appelle partnerWalletService.revenue(ownerId!) (wallet.queries.ts:134) sans buildListQuery ni aucun paramètre (wallet.service.ts:428-429). La page câble table.search et serverPaginationFromMeta : la barre met à jour l'état mais ni search, ni page, ni per_page ne sont transmis à l'API.",
    repro: ["/partner/wallet/revenue → saisir un texte dans « Description, type… » : la liste ne change pas.", "Changer de page : aucune requête filtrée n'est envoyée."],
    attendu: "La recherche filtre les mouvements ; la pagination charge les pages suivantes.",
    correction: "Faire accepter params à partnerWalletService.revenue (append via buildListQuery), puis revenue(ownerId!, params). Sinon masquer recherche/pagination tant que l'API n'est pas paginée.",
  },
  {
    n: "07", sev: "HAUTE",
    title: "Position GPS fictive pour les chauffeurs sans coordonnées",
    area: "Ma Flotte → Carte live · route /partner/map",
    constat: "Dans mapApiPartnerLiveMapToData, si un chauffeur n'a pas de coordonnées, un point factice est généré autour du centre d'Abidjan (partnerLiveMap.mapper.ts:312-317) puis poussé dans drivers[] et affiché comme un chauffeur réellement localisé, sans indicateur « position inconnue ».",
    repro: ["Ouvrir /partner/map avec un chauffeur sans position GPS (offline / jamais géolocalisé).", "Il apparaît près du centre d'Abidjan alors que sa position est inconnue."],
    attendu: "Les chauffeurs sans coordonnées réelles ne doivent pas être placés à une position inventée (exclus des markers ou marqués distinctement).",
    correction: "Si coords est null, omettre le chauffeur des markers (le garder dans la liste latérale avec « Position inconnue ») ou ajouter un flag has_location: false.",
  },
  {
    n: "08", sev: "MOYENNE",
    title: "Rapports : « undefined % » affiché quand le taux d'acceptation manque",
    area: "Activité → Rapports · route /partner/reports",
    constat: "La colonne « Acceptation » rend `${r.acceptance_rate_pct} %` (PartnerReportsPage.tsx:57). Quand l'API ne renvoie pas acceptance_rate_pct, la cellule affiche littéralement « undefined % » (seule page en ERROR du test runtime).",
    repro: ["Ouvrir /partner/reports.", "La colonne « Acceptation » affiche « undefined % » sur les lignes sans valeur."],
    attendu: "Afficher « — » (ou « 0 % ») quand la valeur est absente.",
    correction: "r.acceptance_rate_pct != null ? `${r.acceptance_rate_pct} %` : \"—\".",
  },
  {
    n: "09", sev: "MOYENNE",
    title: "Profil : 403 — bug front : mauvaise route appelée (endpoint partenaire disponible)",
    area: "Compte → Profil · route /partner/profile",
    constat: "✅ Reclassé bug FRONT (vérifié le 23/06 sur Swagger live). GET /v1/partners/{id}/documents EXISTE et répond 200 (renvoie {legalForm, requiredDocumentTypes, documents}). Bug front : PartnerDocumentsSection réutilise le panneau network/PartnerDocumentsPanel qui appelle fetchAdminKycDocuments({ subject_type: \"PARTNER\" }) → GET /v1/admin/kyc/documents (partnerDocuments.service.ts:44). Un token partenaire n'a pas accès à la route admin → HTTP 403 (observé au runtime). Il suffit de basculer sur la route partenaire existante.",
    repro: ["Ouvrir /partner/profile, section « Documents légaux ».", "Console réseau : 403 sur /v1/admin/kyc/documents?subject_type=PARTNER."],
    attendu: "La section documents utilise GET /v1/partners/{id}/documents (200) et affiche les pièces réelles du partenaire.",
    correction: "Basculer l'appel de GET /v1/admin/kyc/documents vers GET /v1/partners/{id}/documents. Mettre à jour PartnerDocumentsPanel (ou créer une variante rôle partenaire) pour utiliser partnerProfileService.listDocuments au lieu de fetchAdminKycDocuments.",
  },
  {
    n: "10", sev: "MOYENNE",
    title: "Acomptes : bug front — catch silencieux masque l'état réel (endpoint backend OK)",
    area: "Finance → Acomptes · route /partner/wallet/settlements",
    constat: "✅ Reclassé bug FRONT (vérifié le 23/06 sur Swagger live + sonde runtime). GET /v1/partners/{id}/settlements répond 200 et renvoie {items:[], pagination} — l'endpoint fonctionne. Bug front : partnerWalletService.settlements entoure l'appel d'un try/catch silencieux (wallet.service.ts:421-425, commentaire « endpoint cassé backend — PAYOUTS_FETCH_FAILED ») — ce commentaire est OBSOLÈTE. En cas d'exception (réseau, token, etc.) le catch renvoie une liste vide sans erreur ; la page affiche « Aucun acompte » comme un résultat normal, masquant tout incident réel.",
    repro: ["Ouvrir /partner/wallet/settlements → « Aucun acompte disponible » s'affiche même si des acomptes existent (catch silencieux masque la réponse réelle)."],
    attendu: "Les erreurs réseau / API remontent normalement (affichage du bloc d'erreur existant). Si l'API retourne items=[], afficher « Aucun acompte pour cette période ».",
    correction: "Supprimer le commentaire obsolète wallet.service.ts:421-425. Laisser remonter les exceptions réelles (supprimer le try/catch ou ré-throw). Brancher les params de recherche sur le service (voir N°06 pour le pattern buildListQuery).",
  },
  {
    n: "11", sev: "MOYENNE",
    title: "Performances : agrégation et recherche limitées au 1er lot serveur",
    area: "Ma Flotte → Performance · route /partner/performance",
    constat: "useFleetPerformance(dateRange.listParams) ne reçoit que date_from/date_to, sans per_page → limite par défaut backend. La page n'a aucune pagination et la recherche est purement client-side sur data.data. Au-delà de la taille de page par défaut, des affectations manquent au tableau, aux KPI et à la recherche. (Runtime : 0 ligne / 0 KPI / onglets absents.)",
    repro: ["Flotte > 25 véhicules/chauffeurs → comparer total réel vs tableau/KPI de /partner/performance : des lignes manquent, totaux sous-évalués."],
    attendu: "Charger toutes les affectations de la période avant agrégation/recherche.",
    correction: "Passer un per_page élevé (ex. 200) ou itérer la pagination dans partnerPerformanceService.fleet (comme fetchVehicleDriverAssignments qui utilise déjà { per_page: 200 }).",
  },
  {
    n: "12", sev: "MOYENNE",
    title: "Liste véhicules : colonne « Chauffeur affecté » vide malgré une affectation",
    area: "Ma Flotte → Véhicules · route /partner/fleet",
    constat: "resolveDriverName(item) ne lit qu'un objet imbriqué item.driver (adminVehicles.mapper.ts:29-33), or l'API ne renvoie que driver_id. driver_name reste null → la colonne affiche « — » (PartnerVehiclesListPage.tsx:105) même pour un véhicule avec driver_id.",
    repro: ["Assigner un chauffeur à un véhicule → ouvrir /partner/fleet.", "Colonne « Chauffeur affecté » reste « — » alors que la fiche détail montre le chauffeur."],
    attendu: "Afficher le nom du chauffeur (ou « Assigné ») quand driver_id est présent.",
    correction: "Dans resolveDriverName, prendre en compte driver_id (lookup chauffeurs ou repli « Assigné »).",
  },
  {
    n: "13", sev: "MOYENNE",
    title: "Chauffeurs : KPI « En ligne / En course / Hors ligne » calculés sur la page courante",
    area: "Ma Flotte → Chauffeurs · route /partner/drivers",
    constat: "kpiOnline/kpiInTrip/kpiOffline sont calculés par rows.filter(...) (PartnerDriversListPage.tsx:85-87) où rows est la page paginée courante (per_page=25). Les cartes sont présentées comme des totaux flotte ; seul « Total chauffeurs » utilise meta.total.",
    repro: ["Avoir > 25 chauffeurs → la carte « En ligne » est incohérente avec le total ; changer de page modifie les KPI."],
    attendu: "Les KPI reflètent toute la flotte (totaux serveur).",
    correction: "Faire fournir les compteurs par l'API et les consommer (comme les counters de la page Courses).",
  },
  {
    n: "14", sev: "MOYENNE",
    title: "Rapprochement cash : colonnes « Chauffeur » et « Note » toujours en repli",
    area: "Finance → Portefeuille · route /partner/wallet",
    constat: "mapCashReconciliationItem ne mappe jamais driver_name et force note: undefined (wallet.service.ts:164). La colonne « Chauffeur » affiche l'UUID brut (r.driver_name ?? r.driver_id) et la colonne « Note » toujours « — ».",
    repro: ["/partner/wallet, section « Rapprochement des encaissements cash » : Chauffeur = identifiant, Note = « — »."],
    attendu: "Nom du chauffeur lisible et note réelle (ou retirer la colonne Note tant que l'API ne la fournit pas).",
    correction: "Récupérer driver_name (jointure/metadata) et mapper note ; à défaut résoudre le nom et retirer « Note ».",
  },
  {
    n: "15", sev: "MOYENNE",
    title: "Chat support sans temps réel (ni polling ni socket)",
    area: "Support → Chat · routes /partner/support/chat/[id], /conversations/[id]",
    constat: "usePartnerSupportChat (support.queries.ts:25-32) et useChatConversation n'ont aucun refetchInterval ni socket. Les messages entrants n'apparaissent qu'après l'envoi d'un message (invalidation onSuccess) ou un rechargement manuel.",
    repro: ["Ouvrir une conversation ; un message envoyé côté agent n'apparaît pas tant qu'on n'envoie pas un message / ne recharge pas."],
    attendu: "Réception quasi temps réel (polling court ou WebSocket).",
    correction: "Ajouter refetchInterval (10-15 s) sur les queries de chat ou brancher un canal socket ; a minima un bouton « Rafraîchir ».",
  },
  {
    n: "16", sev: "MOYENNE",
    title: "Profil : cases « Notifications » décoratives (non persistées)",
    area: "Compte → Profil · route /partner/profile",
    constat: "Les checkboxes « Notifications email/SMS/Rapports hebdo » n'ont ni state ni onChange (PartnerProfilePage.tsx:283-294) ; un texte admet « Ces paramètres seront synchronisés avec l'API prochainement ». Toute modification est perdue au rechargement.",
    repro: ["/partner/profile → Paramètres → cocher/décocher → recharger : l'état revient au défaut."],
    attendu: "Préférences lues et persistées via l'API.",
    correction: "Brancher sur state + mutation de préférences, ou masquer tant que l'API n'existe pas.",
  },
  {
    n: "17", sev: "MOYENNE",
    title: "Détail fret : workflow de statut incompatible avec l'API",
    area: "Opportunités → Fret · route /partner/freight/[id]",
    constat: "handleStatusChange envoie des statuts comme transit/assigned/pickup/delivered, mais UpdateFreightOfferPayload n'autorise que « accepted | rejected » et FreightOfferStatus = pending|accepted|rejected|completed|cancelled (freight.service.ts:6,74-77).",
    repro: ["Sur une offre, cliquer « Démarrer transit » → envoie status:'transit' inconnu de l'API."],
    attendu: "Le workflow UI correspond aux statuts réellement supportés.",
    correction: "Aligner FreightOfferStatus, statusFlow et UpdateFreightOfferPayload (et les boutons) sur le même ensemble.",
  },
  {
    n: "18", sev: "MOYENNE",
    title: "Détail fret : boutons « Assigner véhicule » et « POD » sans modal",
    area: "Opportunités → Fret · route /partner/freight/[id]",
    constat: "Les boutons appellent setShowAssign(true) / setShowPod(true) (l.69/75) mais ces états ne sont jamais consommés (aucun modal rendu). Le bloc « Tracking GPS » est un placeholder statique.",
    repro: ["Cliquer « Assigner véhicule » / « Confirmer livraison (POD) » : rien ne s'ouvre."],
    attendu: "Ouverture d'un formulaire d'assignation / de POD et carte de tracking réelle.",
    correction: "Implémenter les modals Assign/POD + mutations ; remplacer le placeholder GPS par une vraie carte.",
  },
  {
    n: "19", sev: "MOYENNE",
    title: "Liste fret : aucune navigation vers le détail",
    area: "Opportunités → Fret · route /partner/freight",
    constat: "Les lignes n'ont aucun lien vers /partner/freight/[id] (colonnes l.35-89, aucune cellule cliquable). La page détail (par ailleurs cassée, cf. N° 01) est inatteignable depuis la liste.",
    repro: ["/partner/freight → cliquer une ligne/référence : aucun lien."],
    attendu: "La référence/la ligne ouvre le détail.",
    correction: "Envelopper la cellule ref dans &lt;Link href={`/partner/freight/${o.id}`}&gt; (comme pour les bookings).",
  },
  {
    n: "20", sev: "MOYENNE",
    title: "Création fret : coordonnées GPS saisies à la main (pas de carte)",
    area: "Opportunités → Fret · route /partner/freight",
    constat: "Le formulaire de création exige origin_lat/lng et destination_lat/lng en saisie numérique manuelle (l.271-286, champs required), alors qu'un BookingLocationPicker existe déjà ailleurs.",
    repro: ["« Nouvelle offre » → l'utilisateur doit taper des latitudes/longitudes à la main."],
    attendu: "Sélection origine/destination via carte ou recherche d'adresse renvoyant les coordonnées.",
    correction: "Réutiliser BookingLocationPicker / SimplePinMap.",
  },
  {
    n: "21", sev: "MOYENNE",
    title: "Planning shifts : aucun bouton de création (page en lecture seule)",
    area: "Activité → Planning shifts · route /partner/shifts",
    constat: "Aucun bouton « Nouveau shift » (PageHeader sans actions) alors que partnerShiftsService.create + CreateShiftPayload existent (shifts.service.ts:41-48,80-86). La planification est impossible côté UI (runtime : « Bouton création shift : Absent »).",
    repro: ["Ouvrir /partner/shifts : impossible de créer/planifier un shift."],
    attendu: "Pouvoir créer/éditer un shift depuis la page.",
    correction: "Ajouter un bouton + modal de création branché sur useCreateShift.",
  },
  {
    n: "22", sev: "MOYENNE",
    title: "Carte live : « temps d'attente moyen » codé en dur à 0",
    area: "Ma Flotte → Carte live · route /partner/map",
    constat: "Le mapper fixe avg_wait_min: 0 en dur (partnerLiveMap.mapper.ts:396), affiché tel quel par LiveMapStatsBar.",
    repro: ["/partner/map : l'indicateur « temps d'attente moyen » affiche toujours 0 min."],
    attendu: "Vraie valeur backend, ou masquer l'indicateur tant que la donnée n'existe pas.",
    correction: "Lire response.stats.avgWaitMin ou retirer l'indicateur.",
  },
  {
    n: "23", sev: "MOYENNE",
    title: "Tracking : recherche sans effet et « Voir carte » sans carte",
    area: "Ma Flotte → Tracking · route /partner/tracking",
    constat: "TableFiltersBar est câblé sur table.search mais missions (mock) n'est jamais filtré. « Voir carte » ne fait que setSelectedMission ; aucune carte (placeholder gris). (Lié au N° 04.)",
    repro: ["/partner/tracking → taper dans la recherche : aucun filtrage. « Voir carte » : pas de carte."],
    attendu: "Recherche filtrante + carte interactive.",
    correction: "Filtrer par la recherche et intégrer une vraie carte (après branchement API du N° 04).",
  },
  {
    n: "24", sev: "MOYENNE",
    title: "Revenus : méta de pagination synthétique (« page suivante » factice)",
    area: "Finance → Revenus · route /partner/wallet/revenue",
    constat: "last_page = hasMore ? page+1 : page fabriqué côté front (PartnerRevenuePage.tsx:36). Comme le service ne transmet jamais la page (cf. N° 06), le contrôle affiche « page suivante » mais le clic ne charge rien.",
    repro: ["/partner/wallet/revenue avec dataset > limite : « page suivante » présente mais sans effet."],
    attendu: "Pagination réelle reflétant les pages serveur.",
    correction: "Brancher la pagination sur une API réellement paginée (voir N° 06).",
  },
  {
    n: "25", sev: "BASSE",
    title: "Courses & Réservations : statut de paiement affiché en code technique brut",
    area: "Routes /partner/orders et /partner/bookings",
    constat: "La colonne « Paiement » rend b.payment_status ?? « — » brut (PartnerOrdersListPage.tsx:91, PartnerBookingsListPage.tsx:99) → l'utilisateur voit « pending » / « paid » au lieu de « En attente » / « Payé ». La page détail formate via formatPaymentStatus.",
    repro: ["Une course/réservation avec payment_status='paid' affiche « paid » dans la colonne Paiement."],
    attendu: "Libellé localisé cohérent avec la page détail.",
    correction: "Extraire formatPaymentStatus dans shared/lib et l'appliquer dans les cellules.",
  },
  {
    n: "26", sev: "BASSE",
    title: "Courses : impossible d'afficher tout l'historique (preset « Tout » désactivé)",
    area: "Ma Flotte → Courses · route /partner/orders",
    constat: "Filtre de dates initialisé à defaultPreset: '7d' (l.26) ET preset « Tout » désactivé via showAllDatePreset={false} (l.165). La liste est toujours bornée, sans option pour lever la borne.",
    repro: ["Ouvrir /partner/orders : seules les courses des 7 derniers jours sont visibles ; aucun bouton « Tout »."],
    attendu: "Pouvoir afficher toutes les courses.",
    correction: "Activer showAllDatePreset ou exposer un preset couvrant tout l'historique.",
  },
  {
    n: "27", sev: "BASSE",
    title: "Détail véhicule : repli forçant « 0 places » et « carte grise en attente »",
    area: "Ma Flotte → Véhicules · route /partner/fleet/[id]",
    constat: "Si getById échoue, le repli force seats: 0 et registration_document.status: 'pending' (vehicles.service.ts:281-305) → fiche affichant « Places : 0 » et carte grise « en attente » même pour un véhicule approuvé. (Runtime : « Détail véhicule — 0 KPI card ».)",
    repro: ["Provoquer l'échec de l'endpoint détail : la fiche montre 0 places et carte grise « en attente » de façon trompeuse."],
    attendu: "Ne pas inventer de statut ; afficher « — » / le vrai statut.",
    correction: "Ne pas forcer pending si approval_status === 'approved' ; « Places : — » si inconnu.",
  },
  {
    n: "28", sev: "BASSE",
    title: "Notifications : pas de rafraîchissement temps réel + pas de bouton reset",
    area: "Support → Notifications · route /partner/support/notifications",
    constat: "useNotificationsList n'a aucun refetchInterval ni socket (notifications.queries.ts:11-16) → une nouvelle notification n'apparaît pas sans rechargement. La TableFiltersBar ne reçoit pas hasActiveFilters/onReset. Contexte : le rapport API v9 confirme l'absence de Socket.io (notifications + carte live) — le front fonctionne en polling/refresh HTTP.",
    repro: ["/partner/support/notifications : pas de bouton reset après recherche ; une nouvelle notification serveur n'apparaît pas sans rechargement."],
    attendu: "Rafraîchissement périodique (ou socket) + bouton reset cohérent.",
    correction: "Ajouter refetchInterval et useListFiltersReset.",
  },
  {
    n: "29", sev: "BASSE",
    title: "Divers contrôles cosmétiques / code mort",
    area: "Support, Fret, Chauffeurs, Rapports, Shifts",
    constat: "• Chat course : barre de recherche sans bouton reset (hasActiveFilters/onReset absents). • Zones fret : état de recherche initialisé mais TableFiltersBar jamais rendu ni appliqué (code mort). • Création chauffeur seul (/partner/drivers/new) : simple redirection vers /partner/fleet/new — à confirmer comme voulu. • Rapports : aucune action « Générer un rapport » (lecture seule + export CSV générique). • Shifts : la recherche dépend entièrement du support backend de ?search= (aucun filtrage client de secours).",
    repro: ["Voir chaque sous-point ci-dessus."],
    attendu: "Barres de filtres harmonisées, pas de code mort, intentions produit confirmées.",
    correction: "Harmoniser via useListFiltersReset, supprimer le code mort, confirmer les choix produit.",
  },
];

const fonctionnels =
  "Connexion, Tableau de bord, listes Chauffeurs/Véhicules/Courses (recherche + filtres statut/date câblés à l'API), détail chauffeur (édition, recharge, upload KYC, mise en ligne/suspension), détail course, assignation chauffeur↔véhicule, création véhicule+chauffeur, Wallet (retrait, transferts chauffeurs), Membres (CRUD complet), Location (création + actions statut), Réservations (création avec map picker géoloc, annulation), Boîtiers GPS (CRUD), pages SOS (polling 30 s + acknowledge/resolve), upload de documents profil.";

const counts = { HAUTE: 0, MOYENNE: 0, BASSE: 0 };
findings.forEach((f) => counts[f.sev]++);

const sevColor = {
  HAUTE: "#ef4444",
  MOYENNE: "#f59e0b",
  BASSE: "#eab308",
};

const esc = (s) => String(s);
const REPORTER = "Yao Ivan · Équipe Front";
const cardFooter = `<div class="footer"><span>UPJUNOO — Rapport de corrections de recette · Portail Partenaire</span><span class="rep">Rapporteur : ${REPORTER}</span><span>Confidentiel · usage interne</span></div>`;

function sevBadge(sev) {
  return `<span class="sev" style="background:${sevColor[sev]}">${sev}</span>`;
}

function findingCard(f) {
  const uri = shotDataUri(f.n);
  const shotHtml = uri
    ? `<figure class="shot"><img src="${uri}" alt="capture ${f.n}"/><figcaption>Capture réelle · ${esc(SHOT_MAP[f.n])}</figcaption></figure>`
    : "";
  return `
  <section class="page card">
    <div class="card-head">
      <div class="num">N° ${f.n}</div>
      ${sevBadge(f.sev)}
    </div>
    <h2>${esc(f.title)}</h2>
    <p class="area">${esc(f.area)}</p>
    ${shotHtml}
    <div class="row"><div class="lbl">CONSTAT</div><div class="val">${esc(f.constat)}</div></div>
    <div class="row"><div class="lbl">ÉTAPES POUR REPRODUIRE</div><div class="val"><ol>${f.repro.map((r) => `<li>${esc(r)}</li>`).join("")}</ol></div></div>
    <div class="row"><div class="lbl">COMPORTEMENT ATTENDU</div><div class="val">${esc(f.attendu)}</div></div>
    <div class="row correction"><div class="lbl">CORRECTION PROPOSÉE</div><div class="val">${esc(f.correction)}</div></div>
    ${cardFooter}
  </section>`;
}

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport de corrections — Portail Partenaire</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --teal-1: #0f3d3a; --teal-2: #134e4a; --teal-3: #0d9488;
    --ink: #1e293b; --muted: #64748b; --line: #e2e8f0; --bg: #f8fafc;
    --gold: #f5b301;
  }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: var(--ink); background: #fff; font-size: 13px; line-height: 1.5; }
  .page { page-break-after: always; min-height: 297mm; padding: 18mm 16mm; position: relative; }
  .page:last-child { page-break-after: avoid; }

  /* ── Cover ── */
  .cover { background: linear-gradient(135deg, var(--teal-1) 0%, var(--teal-2) 70%); color: #fff; display: flex; flex-direction: column; }
  .cover .brand { display: flex; align-items: center; gap: 14px; margin-bottom: 40px; }
  .cover .logo { width: 52px; height: 52px; border-radius: 12px; background: rgba(255,255,255,.12); display:flex; align-items:center; justify-content:center; }
  .cover .logo span { font-size: 26px; }
  .cover .brand-name { font-size: 26px; font-weight: 800; letter-spacing: 1px; }
  .cover .brand-name b { color: var(--gold); }
  .cover .tag { display:inline-block; border:1px solid rgba(255,255,255,.3); border-radius: 999px; padding: 6px 16px; font-size: 11px; letter-spacing: 2px; font-weight: 700; color: rgba(255,255,255,.85); margin-bottom: 28px; width: fit-content; }
  .cover h1 { font-size: 48px; font-weight: 800; line-height: 1.05; letter-spacing: -1px; margin-bottom: 20px; }
  .cover h1 b { color: var(--gold); }
  .cover .lead { font-size: 16px; max-width: 620px; opacity: .85; line-height: 1.6; }
  .cover .meta { margin-top: auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; border-top: 1px solid rgba(255,255,255,.18); padding-top: 22px; }
  .cover .meta .k { font-size: 10px; letter-spacing: 1.5px; color: var(--gold); font-weight: 700; margin-bottom: 4px; }
  .cover .meta .v { font-size: 13px; opacity: .92; }
  .cover .circle { position: absolute; top: -120px; right: -120px; width: 420px; height: 420px; border-radius: 50%; background: rgba(255,255,255,.05); }

  /* ── Summary ── */
  .sum h2.sec { font-size: 22px; font-weight: 800; color: var(--teal-2); margin-bottom: 18px; padding-bottom: 10px; border-bottom: 3px solid var(--teal-3); }
  .stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 20px 0 30px; }
  .stat { border: 1px solid var(--line); border-radius: 14px; padding: 16px 18px; }
  .stat .n { font-size: 34px; font-weight: 800; }
  .stat .l { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; margin-top: 2px; }
  .stat.h { background:#fef2f2; border-color:#fecaca; } .stat.h .n { color:#dc2626; }
  .stat.m { background:#fffbeb; border-color:#fde68a; } .stat.m .n { color:#d97706; }
  .stat.b { background:#fefce8; border-color:#fef08a; } .stat.b .n { color:#a16207; }
  table.kv { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  table.kv td { padding: 9px 12px; border-bottom: 1px solid var(--line); font-size: 12.5px; }
  table.kv td:first-child { color: var(--muted); width: 55%; }
  table.kv td:last-child { font-weight: 600; text-align: right; }
  .note { background: var(--bg); border-left: 4px solid var(--teal-3); padding: 14px 16px; border-radius: 8px; font-size: 12.5px; color: #334155; }

  /* ── Cards ── */
  .card { padding-top: 14mm; }
  .card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
  .card .num { font-size: 13px; font-weight: 800; color: var(--teal-3); letter-spacing: 1px; }
  .sev { color: #fff; font-size: 11px; font-weight: 800; letter-spacing: 1px; padding: 4px 14px; border-radius: 999px; }
  .card h2 { font-size: 21px; font-weight: 800; color: var(--teal-1); line-height: 1.15; margin-bottom: 5px; }
  .card .area { font-size: 12px; color: var(--teal-3); font-weight: 600; margin-bottom: 12px; }
  .shot { margin: 0 0 12px; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: #0f172a; box-shadow: 0 4px 14px rgba(15,23,42,.12); }
  .shot img { display: block; width: 100%; max-height: 95mm; object-fit: cover; object-position: top; }
  .shot figcaption { font-size: 10px; color: var(--muted); padding: 5px 12px; background: var(--bg); border-top: 1px solid var(--line); }
  .row { display: grid; grid-template-columns: 150px 1fr; gap: 14px; padding: 9px 0; border-top: 1px solid var(--line); }
  .row .lbl { font-size: 10px; font-weight: 800; letter-spacing: .8px; color: var(--muted); padding-top: 2px; }
  .row .val { font-size: 12px; color: var(--ink); line-height: 1.45; }
  .row .val ol { margin: 0; padding-left: 16px; }
  .row .val li { margin-bottom: 2px; }
  .row.correction { background: linear-gradient(90deg, #ecfdf5, #fff); border-radius: 10px; border-top: none; border-left: 4px solid var(--teal-3); padding: 11px 14px; margin-top: 7px; }
  .row.correction .lbl { color: var(--teal-3); }

  .footer { position: absolute; bottom: 10mm; left: 16mm; right: 16mm; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8; border-top: 1px solid var(--line); padding-top: 8px; }
  .footer .rep { color: var(--teal-3); font-weight: 700; }
</style>
</head>
<body>

<!-- COVER -->
<section class="page cover">
  <div class="circle"></div>
  <div class="brand">
    <div class="logo"><span>≣</span></div>
    <div class="brand-name">UP<b>JUNOO</b></div>
  </div>
  <div class="tag">● RECETTE · TEST GRANDEUR NATURE</div>
  <h1>Rapport de <b>corrections</b><br>Portail Partenaire</h1>
  <p class="lead">Anomalies relevées en recette du portail partenaire web, captures de code à l'appui, avec piste de correction pour chaque point — à destination de l'équipe front web.</p>
  <div class="meta">
    <div><div class="k">DATE</div><div class="v">${meta.date}</div></div>
    <div><div class="k">PÉRIMÈTRE</div><div class="v">Portail Partenaire · 41 pages</div></div>
    <div><div class="k">RAPPORTEUR</div><div class="v">Yao Ivan · Équipe Front</div></div>
  </div>
</section>

<!-- SUMMARY -->
<section class="page sum">
  <h2 class="sec">Résumé du test &amp; tableau de bord</h2>
  <p style="margin-bottom:16px;color:#334155">${meta.methode}.</p>

  <div class="stat-row">
    <div class="stat h"><div class="n">${counts.HAUTE}</div><div class="l">Anomalies HAUTE</div></div>
    <div class="stat m"><div class="n">${counts.MOYENNE}</div><div class="l">Anomalies MOYENNE</div></div>
    <div class="stat b"><div class="n">${counts.BASSE}</div><div class="l">Anomalies BASSE</div></div>
  </div>

  <h3 style="font-size:14px;font-weight:800;color:var(--teal-2);margin-bottom:8px">Résultats du test runtime</h3>
  <table class="kv">
    ${runtime.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}
  </table>

  <div class="note">
    <b>Bilan global :</b> aucune page ne plante, l'ossature et les listes principales (chauffeurs, véhicules, courses, wallet) sont fonctionnelles. Les anomalies se concentrent sur <b>3 pages bâties sur des données mockées</b> (Tracking, Zones fret, Détail fret), <b>des actions de paiement/création non câblées</b> (top-up wallet, création de zone/shift, POD fret), et <b>des écarts d'affichage</b> (libellés bruts, valeurs <i>undefined</i>, position GPS inventée).
  </div>

  <h3 style="font-size:14px;font-weight:800;color:var(--teal-2);margin:22px 0 8px">Modules vérifiés FONCTIONNELS</h3>
  <p style="font-size:12px;color:#475569">${fonctionnels}</p>

  ${cardFooter}
</section>

${findings.map(findingCard).join("\n")}

</body>
</html>`;

const htmlPath = path.join(OUT_DIR, "rapport-corrections-portail-partenaire.html");
fs.writeFileSync(htmlPath, html, "utf-8");
console.log("✅ HTML généré :", htmlPath);
