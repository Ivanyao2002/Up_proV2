/** Métadonnées modules — guide d'utilisation UpJunoo Pro */

import { discoverAppRoutes, mergeGuideModules } from "./discover-app-routes.mjs";
import { sortGuideModules } from "./guide-nav-order.mjs";

export const REPORT_META = {
  title: "Guide d'utilisation — UpJunoo Pro",
  subtitle: "Portails Administrateur et Comptabilité · captures d'écran environnement DEV",
  version: "1.0",
  date: "17 juin 2026",
  environment: "https://api.upjunoo-dev.tech",
  appUrl: process.env.GUIDE_APP_URL ?? "http://localhost:3000",
};

export const DEMO_ACCOUNTS = [
  {
    portal: "Administrateur",
    loginUrl: "/admin/login",
    email: "dev.admin@upjunoo-dev.tech",
    password: "Upjunoo@Dev2026!",
    scope: "Plateforme globale — tous les modules admin",
  },
  {
    portal: "Comptable",
    loginUrl: "/compta/login",
    email: "comptable@upjunoo-dev.tech",
    password: "123456789",
    scope: "Finances et comptabilité — périmètre pays du comptable",
  },
  {
    portal: "Franchise",
    loginUrl: "/franchise/login",
    email: process.env.TEST_FRANCHISE_EMAIL ?? "dev.franchise.bf@upjunoo-dev.tech",
    password: process.env.TEST_FRANCHISE_PASSWORD ?? "Upjunoo@Dev2026!",
    scope: "Territoire franchise — opérations, flotte, finance locale",
  },
  {
    portal: "Partenaire",
    loginUrl: "/partner/login",
    email: process.env.TEST_PARTNER_EMAIL ?? "contact@cocodyexpress.ci",
    password: process.env.TEST_PARTNER_PASSWORD ?? "demo",
    scope: "Flotte partenaire — chauffeurs, véhicules, wallet",
  },
  {
    portal: "Dispatch",
    loginUrl: "/dispatch/login",
    email: process.env.TEST_DISPATCH_EMAIL ?? "aya.kone@upjunoo.ci",
    password: process.env.TEST_DISPATCH_PASSWORD ?? "demo",
    scope: "Console dispatch — réservation et assignation manuelle",
  },
];

export const PORTAL_META = {
  admin: { title: "Portail Administrateur", accountPortal: "Administrateur" },
  compta: { title: "Portail Comptabilité", accountPortal: "Comptable" },
  franchise: { title: "Portail Franchise", accountPortal: "Franchise" },
  partner: { title: "Portail Partenaire", accountPortal: "Partenaire" },
  dispatch: { title: "Portail Dispatch", accountPortal: "Dispatch" },
  public: { title: "Pages publiques", accountPortal: null },
};

/** Routes exclues du guide (sous-pages dynamiques non pertinentes). */
export const GUIDE_EXCLUDED_PATHS = new Set([
  "/admin/settings/dispatchers/[id]",
]);

/** Portails inclus par défaut dans le guide. */
export const GUIDE_DEFAULT_PORTALS = (process.env.GUIDE_PORTALS ?? "admin,compta")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);

function applyGuideFilters(modules) {
  const portalSet = new Set(GUIDE_DEFAULT_PORTALS);
  return modules.filter(
    (m) => portalSet.has(m.portal) && !GUIDE_EXCLUDED_PATHS.has(m.path)
  );
}

/** Métadonnées enrichies manuellement (fusionnées avec la découverte auto des routes). */
export const GUIDE_MODULES_MANUAL = [
  {
    portal: "admin",
    group: "OPÉRATIONS",
    label: "Accueil administrateur",
    path: "/admin",
    slug: "admin",
    capturePath: "/admin/dashboard",
    objectif:
      "Point d'entrée du portail administrateur — vue tableau de bord après connexion.",
    usage: [
      "Se connecter via /admin/login.",
      "Accéder au tableau de bord : KPI courses, flux, alertes et activité réseau.",
      "Naviguer vers les modules via le menu latéral.",
    ],
  },
  // ——— ADMIN ———
  {
    portal: "admin",
    group: "Connexion",
    label: "Connexion administrateur",
    path: "/admin/login",
    slug: "admin-login",
    objectif: "Accéder au portail administrateur de la plateforme.",
    usage: [
      "Ouvrir l'URL de connexion admin.",
      "Saisir l'email et le mot de passe du compte administrateur.",
      "Cliquer sur « Se connecter » — redirection vers le tableau de bord.",
    ],
  },
  {
    portal: "admin",
    group: "OPÉRATIONS",
    label: "Tableau de bord",
    path: "/admin/dashboard",
    slug: "admin-dashboard",
    objectif: "Vue synthétique de l'activité réseau (courses, chauffeurs, indicateurs clés).",
    usage: [
      "Consulter les KPI du jour : courses, chauffeurs en ligne, tendances.",
      "Accéder rapidement aux sections opérationnelles via le menu latéral.",
    ],
  },
  {
    portal: "admin",
    group: "OPÉRATIONS",
    label: "Carte live",
    path: "/admin/ops/map",
    slug: "admin-map",
    objectif: "Suivre en temps réel la position des chauffeurs et l'activité sur la carte.",
    usage: [
      "Zoomer / déplacer la carte pour explorer une zone.",
      "Cliquer sur un marqueur chauffeur pour voir son statut.",
      "Utiliser les filtres franchise / partenaire si disponibles.",
    ],
  },
  {
    portal: "admin",
    group: "OPÉRATIONS",
    label: "Courses",
    path: "/admin/ops/trips",
    slug: "admin-trips",
    objectif: "Lister, filtrer et ouvrir le détail de toutes les courses du réseau.",
    usage: [
      "Filtrer par statut, service, zone ou période.",
      "Cliquer sur une ligne pour ouvrir la fiche course (trajet, client, chauffeur, finance).",
      "Exporter la liste si besoin d'analyse externe.",
    ],
  },
  {
    portal: "admin",
    group: "OPÉRATIONS",
    label: "SOS Guardian",
    path: "/admin/ops/sos",
    slug: "admin-sos",
    objectif: "Surveiller les alertes SOS et incidents sécurité chauffeurs.",
    usage: [
      "Consulter les incidents actifs et leur localisation.",
      "Ouvrir le détail d'un incident pour le traitement.",
    ],
  },
  {
    portal: "admin",
    group: "RÉSEAU",
    label: "Franchises",
    path: "/admin/network/franchises",
    slug: "admin-franchises",
    objectif: "Gérer les franchises du réseau (création, statut, territoire).",
    usage: [
      "Lister les franchises actives / suspendues.",
      "Créer une franchise : email portail, mot de passe, ville.",
      "Ouvrir une fiche pour modifier ou consulter les partenaires rattachés.",
    ],
  },
  {
    portal: "admin",
    group: "RÉSEAU",
    label: "Zones",
    path: "/admin/network/zones",
    slug: "admin-zones",
    objectif: "Définir les zones géographiques (polygones) utilisées pour le dispatch et la tarification.",
    usage: [
      "Consulter la carte des zones par ville.",
      "Créer ou éditer une zone : nom, polygone, franchise associée.",
    ],
  },
  {
    portal: "admin",
    group: "RÉSEAU",
    label: "Partenaires",
    path: "/admin/network/partners",
    slug: "admin-partners",
    objectif: "Gérer les partenaires flotte (taxi, livraison, location…).",
    usage: [
      "Créer un partenaire : raison sociale, commission, compte portail.",
      "Suspendre / activer un partenaire.",
      "Accéder aux chauffeurs et véhicules du partenaire depuis sa fiche.",
    ],
  },
  {
    portal: "admin",
    group: "RÉSEAU",
    label: "Comptables",
    path: "/admin/network/accountants",
    slug: "admin-accountants",
    objectif: "Créer et gérer les comptes du portail comptabilité (un comptable par pays).",
    usage: [
      "Créer un comptable : email, mot de passe, pays géré.",
      "Suspendre ou réactiver un accès comptable.",
    ],
  },
  {
    portal: "admin",
    group: "FLOTTE",
    label: "Chauffeurs",
    path: "/admin/fleet/drivers",
    slug: "admin-drivers",
    objectif: "Liste et fiches chauffeurs : KYC, disponibilité, wallet, historique.",
    usage: [
      "Filtrer par zone, statut compte, disponibilité, conformité.",
      "Ouvrir une fiche : onglets KYC, activité, wallet.",
      "Approuver, suspendre ou transférer un chauffeur vers un autre partenaire.",
    ],
  },
  {
    portal: "admin",
    group: "FLOTTE",
    label: "Véhicules",
    path: "/admin/fleet/vehicles",
    slug: "admin-vehicles",
    objectif: "Parc véhicules : immatriculation, catégorie, chauffeur assigné.",
    usage: [
      "Rechercher par plaque ou partenaire.",
      "Créer un véhicule et l'assigner à un chauffeur.",
    ],
  },
  {
    portal: "admin",
    group: "FLOTTE",
    label: "File KYC",
    path: "/admin/fleet/kyc",
    slug: "admin-kyc",
    objectif: "Valider les documents d'identité et permis en attente.",
    usage: [
      "Traiter la file par ordre d'ancienneté.",
      "Approuver ou rejeter document par document avec motif.",
    ],
  },
  {
    portal: "admin",
    group: "FLOTTE",
    label: "Clients",
    path: "/admin/fleet/clients",
    slug: "admin-clients",
    objectif: "Consulter les comptes passagers et leur historique.",
    usage: [
      "Rechercher un client par nom ou téléphone.",
      "Ouvrir la fiche pour voir les courses passées.",
    ],
  },
  {
    portal: "admin",
    group: "FINANCE",
    label: "Finance générale",
    path: "/admin/finance",
    slug: "admin-finance",
    objectif: "Hub finance : synthèse soldes, flux et accès aux sous-modules.",
    usage: [
      "Vue d'ensemble des indicateurs financiers.",
      "Naviguer vers transactions, retraits, portefeuilles, etc.",
    ],
  },
  {
    portal: "admin",
    group: "FINANCE",
    label: "Transactions",
    path: "/admin/finance/transactions",
    slug: "admin-transactions",
    objectif: "Journal des mouvements financiers (crédits, débits, paiements).",
    usage: [
      "Filtrer par type, période, montant.",
      "Ouvrir une transaction pour le détail et la réconciliation.",
    ],
  },
  {
    portal: "admin",
    group: "FINANCE",
    label: "Retraits",
    path: "/admin/finance/withdrawals",
    slug: "admin-withdrawals",
    objectif: "Traiter les demandes de retrait chauffeurs et partenaires.",
    usage: [
      "Filtrer les retraits en attente.",
      "Approuver ou rejeter avec justification.",
    ],
  },
  {
    portal: "admin",
    group: "FINANCE",
    label: "Portefeuilles",
    path: "/admin/finance/wallets",
    slug: "admin-wallets",
    objectif: "Soldes des portefeuilles par acteur (chauffeur, partenaire, franchise).",
    usage: [
      "Rechercher un portefeuille par propriétaire.",
      "Consulter solde disponible / non retirable.",
    ],
  },
  {
    portal: "admin",
    group: "FINANCE",
    label: "Ledger comptable",
    path: "/admin/finance/ledger",
    slug: "admin-ledger",
    objectif: "Grand-livre comptable admin (écritures débit/crédit).",
    usage: [
      "Filtrer par bucket, type d'écriture, période.",
      "Exporter pour contrôle comptable.",
    ],
  },
  {
    portal: "admin",
    group: "FINANCE",
    label: "Recharges chauffeurs",
    path: "/admin/finance/driver-transfers",
    slug: "admin-driver-transfers",
    objectif: "Recharger le wallet d'un chauffeur depuis le back-office.",
    usage: [
      "Sélectionner chauffeur et montant.",
      "Confirmer la recharge — mouvement tracé au ledger.",
    ],
  },
  {
    portal: "admin",
    group: "FINANCE",
    label: "Commissions",
    path: "/admin/finance/commissions",
    slug: "admin-commissions",
    objectif: "Suivi des commissions prélevées sur les courses.",
    usage: [
      "Analyser les commissions par période ou partenaire.",
    ],
  },
  {
    portal: "admin",
    group: "FINANCE",
    label: "Réconciliation",
    path: "/admin/finance/reconciliation",
    slug: "admin-reconciliation",
    objectif: "Rapprocher les flux cash / mobile money avec le ledger.",
    usage: [
      "Identifier les écarts non justifiés.",
      "Marquer les écarts comme traités.",
    ],
  },
  {
    portal: "admin",
    group: "MARKETING",
    label: "Codes promo",
    path: "/admin/marketing/promos",
    slug: "admin-promos",
    objectif: "Créer et gérer les codes promotionnels.",
    usage: [
      "Définir montant ou pourcentage, validité, usage max.",
    ],
  },
  {
    portal: "admin",
    group: "SUPPORT",
    label: "Tickets",
    path: "/admin/support/tickets",
    slug: "admin-tickets",
    objectif: "File de tickets support utilisateurs.",
    usage: [
      "Assigner et clôturer les demandes.",
    ],
  },
  {
    portal: "admin",
    group: "SUPPORT",
    label: "Chat",
    path: "/admin/support/chat",
    slug: "admin-chat",
    objectif: "Messagerie support en temps réel.",
    usage: [
      "Répondre aux conversations clients / chauffeurs.",
    ],
  },
  {
    portal: "admin",
    group: "PARAMÈTRES",
    label: "Règles de dispatch",
    path: "/admin/settings/dispatch-rules",
    slug: "admin-dispatch-rules",
    objectif: "Configurer le moteur de dispatch (vagues, priorités, zones).",
    usage: [
      "Ajuster les paramètres globaux et par pays.",
    ],
  },
  {
    portal: "admin",
    group: "PARAMÈTRES",
    label: "Tarification",
    path: "/admin/settings/pricing",
    slug: "admin-pricing",
    objectif: "Grilles tarifaires par zone et catégorie véhicule.",
    usage: [
      "Créer / modifier une règle de prix.",
      "Tester l'impact sur une estimation.",
    ],
  },
  {
    portal: "admin",
    group: "PARAMÈTRES",
    label: "Rôles",
    path: "/admin/settings/roles",
    slug: "admin-roles",
    objectif: "Gestion RBAC — permissions par rôle admin.",
    usage: [
      "Créer un rôle et cocher les permissions module par module.",
    ],
  },

  // ——— COMPTA ———
  {
    portal: "compta",
    group: "Connexion",
    label: "Connexion comptable",
    path: "/compta/login",
    slug: "compta-login",
    objectif: "Accéder au portail comptabilité (périmètre pays).",
    usage: [
      "Saisir l'email et le mot de passe du compte comptable.",
      "Après connexion : accès limité aux finances du pays assigné.",
    ],
  },
  {
    portal: "compta",
    group: "COMPTABILITÉ",
    label: "Tableau de bord comptable",
    path: "/compta",
    slug: "compta-dashboard",
    objectif: "KPIs comptables du pays : entrées/sorties, commissions, écarts.",
    usage: [
      "Vérifier la période en cours et son statut (ouverte / clôturée).",
      "Surveiller retraits en attente et wallets sous le minimum dispatch.",
    ],
  },
  {
    portal: "compta",
    group: "COMPTABILITÉ",
    label: "Flux entrées / sorties",
    path: "/compta/flows",
    slug: "compta-flows",
    objectif: "Visualiser les flux financiers entrants et sortants du pays.",
    usage: [
      "Filtrer par période et type de flux.",
      "Analyser les tendences crédit vs débit.",
    ],
  },
  {
    portal: "compta",
    group: "COMPTABILITÉ",
    label: "Journal comptable",
    path: "/compta/ledger",
    slug: "compta-ledger",
    objectif: "Grand-livre filtré sur le pays du comptable.",
    usage: [
      "Consulter les écritures avec filtres wallet, direction, service.",
      "Exporter en CSV pour logiciel comptable externe.",
      "Extourner une écriture erronée (avec motif obligatoire).",
    ],
  },
  {
    portal: "compta",
    group: "COMPTABILITÉ",
    label: "Commissions & bénéfices",
    path: "/compta/commissions",
    slug: "compta-commissions",
    objectif: "Suivi des commissions et marges sur le périmètre pays.",
    usage: [
      "Vérifier commissions débitées vs en attente.",
    ],
  },
  {
    portal: "compta",
    group: "COMPTABILITÉ",
    label: "Portefeuilles",
    path: "/compta/wallets",
    slug: "compta-wallets",
    objectif: "Soldes portefeuilles des acteurs du pays.",
    usage: [
      "Rechercher un wallet par chauffeur ou partenaire.",
    ],
  },
  {
    portal: "compta",
    group: "COMPTABILITÉ",
    label: "Réconciliation",
    path: "/compta/reconciliation",
    slug: "compta-reconciliation",
    objectif: "Écarts de rapprochement cash / paiements.",
    usage: [
      "Traiter les écarts ouverts.",
      "Justifier ou corriger avant clôture de période.",
    ],
  },
  {
    portal: "compta",
    group: "COMPTABILITÉ",
    label: "Clôtures & périodes",
    path: "/compta/periods",
    slug: "compta-periods",
    objectif: "Clôturer et verrouiller une période comptable mensuelle.",
    usage: [
      "Vérifier les contrôles (retraits ouverts, écarts).",
      "Clôturer la période puis verrouiller définitivement.",
    ],
  },
  {
    portal: "compta",
    group: "CONSULTATION",
    label: "Transactions",
    path: "/compta/transactions",
    slug: "compta-transactions",
    objectif: "Liste des transactions du pays (lecture).",
    usage: [
      "Filtrer et exporter pour contrôle.",
    ],
  },
  {
    portal: "compta",
    group: "CONSULTATION",
    label: "Retraits",
    path: "/compta/withdrawals",
    slug: "compta-withdrawals",
    objectif: "Demandes de retrait sur le périmètre pays.",
    usage: [
      "Suivre les retraits en attente de validation admin.",
    ],
  },
  {
    portal: "compta",
    group: "CONSULTATION",
    label: "Recharges chauffeurs",
    path: "/compta/recharges",
    slug: "compta-recharges",
    objectif: "Historique des recharges wallet chauffeurs.",
    usage: [
      "Contrôler les recharges effectuées sur la période.",
    ],
  },
  {
    portal: "compta",
    group: "ACTIONS",
    label: "Rapports & exports",
    path: "/compta/exports",
    slug: "compta-exports",
    objectif: "Générer des exports comptables (CSV, rapports période).",
    usage: [
      "Choisir le type d'export et la période.",
      "Télécharger le fichier pour archivage ou expert-comptable.",
    ],
  },
];

/** Toutes les routes app (auto) + enrichissements manuels, filtrées admin + compta. */
export const GUIDE_MODULES = sortGuideModules(
  applyGuideFilters(
    mergeGuideModules(discoverAppRoutes(), GUIDE_MODULES_MANUAL)
  )
);
