/**
 * Découverte automatique des routes Next.js (fichiers page.tsx sous src/app).
 * Fusion avec les métadonnées manuelles du guide.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, "..", "src", "app");

const PORTAL_PREFIXES = ["admin", "compta", "franchise", "partner", "dispatch"];

const SECTION_LABELS = {
  dashboard: "Tableau de bord",
  ops: "OPÉRATIONS",
  network: "RÉSEAU",
  fleet: "FLOTTE",
  finance: "FINANCE",
  marketing: "MARKETING",
  support: "SUPPORT",
  settings: "PARAMÈTRES",
  clients: "CLIENTS",
  trips: "COURSES",
  map: "CARTE",
  sos: "SÉCURITÉ",
  territory: "TERRITOIRE",
  zones: "ZONES",
  partners: "PARTENAIRES",
  drivers: "CHAUFFEURS",
  pricing: "TARIFICATION",
  promos: "PROMOTIONS",
  bookings: "RÉSERVATIONS",
  wallet: "PORTEFEUILLE",
  orders: "COMMANDES",
  members: "MEMBRES",
  performance: "PERFORMANCE",
  safety: "SÉCURITÉ",
  freight: "FRET",
  shifts: "PLANNINGS",
  reports: "RAPPORTS",
  profile: "PROFIL",
  console: "CONSOLE",
  book: "RÉSERVATION",
  flows: "FLUX",
  ledger: "JOURNAL",
  commissions: "COMMISSIONS",
  wallets: "PORTEFEUILLES",
  reconciliation: "RÉCONCILIATION",
  periods: "PÉRIODES",
  transactions: "TRANSACTIONS",
  withdrawals: "RETRAITS",
  recharges: "RECHARGES",
  exports: "EXPORTS",
  login: "CONNEXION",
  "forgot-password": "MOT DE PASSE",
};

const SEGMENT_LABELS = {
  new: "Création",
  edit: "Modification",
  pending: "En attente",
  moderation: "Modération",
  recurring: "Récurrentes",
  forensic: "Analyse forensique",
  incidents: "Incidents",
  banners: "Bannières",
  campaigns: "Campagnes",
  promos: "Codes promo",
  accountants: "Comptables",
  franchises: "Franchises",
  partners: "Partenaires",
  zones: "Zones",
  drivers: "Chauffeurs",
  vehicles: "Véhicules",
  kyc: "KYC",
  clients: "Clients",
  trips: "Courses",
  transactions: "Transactions",
  withdrawals: "Retraits",
  wallets: "Portefeuilles",
  ledger: "Journal comptable",
  commissions: "Commissions",
  reconciliation: "Réconciliation",
  "driver-transfers": "Recharges chauffeurs",
  "partner-transfers": "Transferts partenaires",
  "commission-rules": "Règles de commission",
  "bonus-rules": "Règles de bonus",
  "finance-caps": "Plafonds finance",
  "dispatch-rules": "Règles de dispatch",
  dispatchers: "Dispatchers",
  pricing: "Tarification",
  roles: "Rôles",
  weather: "Météo",
  general: "Général",
  integrations: "Intégrations",
  audit: "Audit",
  tickets: "Tickets",
  chat: "Chat",
  disputes: "Litiges",
  crisis: "Gestion de crise",
  dispatch: "Dispatch",
  map: "Carte",
  territory: "Territoire",
  bookings: "Réservations",
  fleet: "Flotte",
  orders: "Commandes",
  members: "Membres",
  performance: "Performance",
  safety: "Sécurité",
  freight: "Fret",
  "gps-devices": "Boîtiers GPS",
  shifts: "Plannings",
  reports: "Rapports",
  profile: "Profil",
  console: "Console",
  book: "Réservation",
  flows: "Flux financiers",
  periods: "Périodes",
  recharges: "Recharges",
  exports: "Exports",
  login: "Connexion",
  "forgot-password": "Mot de passe oublié",
};

function walkPageFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkPageFiles(full, acc);
    } else if (entry.name === "page.tsx") {
      acc.push(full);
    }
  }
  return acc;
}

function filePathToRoute(filePath) {
  const rel = path.relative(APP_DIR, path.dirname(filePath));
  if (!rel || rel === ".") return "/";

  const segments = rel
    .split(path.sep)
    .filter((s) => !(s.startsWith("(") && s.endsWith(")")));

  const route = "/" + segments.join("/");
  return route.replace(/\/+/g, "/");
}

function detectPortal(route) {
  const first = route.split("/").filter(Boolean)[0];
  if (PORTAL_PREFIXES.includes(first)) return first;
  return "public";
}

function detectGroup(route, portal) {
  const parts = route.split("/").filter(Boolean);
  const start = portal === "public" ? 0 : 1;
  const section = parts[start];
  if (!section || section === "login" || section === "forgot-password") {
    return "CONNEXION";
  }
  if (section === "dashboard") return "TABLEAU DE BORD";
  return SECTION_LABELS[section] ?? section.replace(/-/g, " ").toUpperCase();
}

function humanizeSegment(seg) {
  if (seg.startsWith("[") && seg.endsWith("]")) {
    const name = seg.slice(1, -1);
    if (name === "id") return "Détail";
    return `Détail (${name})`;
  }
  return SEGMENT_LABELS[seg] ?? seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildLabel(route) {
  const parts = route.split("/").filter(Boolean);
  const meaningful = parts.filter((p) => !p.startsWith("["));
  if (meaningful.length === 0) return "Accueil";

  const last = parts[parts.length - 1];
  if (last.startsWith("[")) {
    const parent = parts[parts.length - 2];
    return `${humanizeSegment(parent)} — détail`;
  }
  return humanizeSegment(last);
}

function routeToSlug(route) {
  return route
    .replace(/^\//, "")
    .replace(/\//g, "-")
    .replace(/\[|\]/g, "")
    .replace(/-+/g, "-")
    .replace(/-$/, "") || "home";
}

function isDynamic(route) {
  return route.includes("[");
}

/**
 * Stratégie de résolution pour routes dynamiques.
 * @returns {{ listPath: string, buildPath: (href: string) => string, linkSelector: string } | null}
 */
export function getDynamicResolveStrategy(route) {
  if (!isDynamic(route)) return null;

  const parts = route.split("/").filter(Boolean);
  const dynIndex = parts.findIndex((p) => p.startsWith("["));
  if (dynIndex < 0) return null;

  const listParts = parts.slice(0, dynIndex);
  const listPath = "/" + listParts.join("/");
  const afterDynamic = parts.slice(dynIndex + 1);
  const suffix = afterDynamic.length ? "/" + afterDynamic.join("/") : "";

  const prefix = listPath + "/";
  const exclude = ["/new", "/edit", "/pending", "/moderation", "/recurring", "/forensic"]
    .map((x) => `:not([href*="${x}"])`)
    .join("");

  return {
    listPath,
    linkSelector: `a[href^="${prefix}"]${exclude}`,
    buildPath: (href) => {
      const base = href.replace(/\/$/, "");
      const dynSeg = parts[dynIndex];
      if (dynSeg === "[id]" || dynSeg.startsWith("[")) {
        const id = base.split("/").pop();
        let resolved = prefix + id;
        if (suffix) resolved += suffix;
        return resolved;
      }
      return base + suffix;
    },
  };
}

export function discoverAppRoutes() {
  const files = walkPageFiles(APP_DIR);
  const routes = files
    .map((f) => filePathToRoute(f))
    .sort((a, b) => a.localeCompare(b, "fr"));

  return routes.map((route) => {
    const portal = detectPortal(route);
    return {
      portal,
      group: detectGroup(route, portal),
      label: buildLabel(route),
      path: route,
      slug: routeToSlug(route),
      objectif: `Écran ${buildLabel(route).toLowerCase()} — ${route}`,
      usage: [
        `Ouvrir la page ${route}.`,
        "Utiliser les filtres, actions et formulaires disponibles à l'écran.",
        "Consulter les détails via les liens de la liste ou les onglets de la fiche.",
      ],
      dynamic: isDynamic(route),
      resolve: getDynamicResolveStrategy(route),
    };
  });
}

/**
 * Fusionne les routes découvertes avec les entrées manuelles (objectif, usage enrichis).
 * Les entrées manuelles priment sur les auto-générées pour un même path.
 */
export function mergeGuideModules(discovered, manual = []) {
  const manualByPath = new Map(manual.map((m) => [m.path, m]));
  const seen = new Set();

  const merged = discovered.map((auto) => {
    const manualEntry = manualByPath.get(auto.path);
    seen.add(auto.path);
    if (manualEntry) {
      return { ...auto, ...manualEntry, slug: manualEntry.slug ?? auto.slug };
    }
    return auto;
  });

  for (const m of manual) {
    if (!seen.has(m.path)) merged.push(m);
  }

  return merged.sort((a, b) => {
    const portalOrder = ["admin", "compta", "franchise", "partner", "dispatch", "public"];
    const pa = portalOrder.indexOf(a.portal);
    const pb = portalOrder.indexOf(b.portal);
    if (pa !== pb) return pa - pb;
    if (a.group !== b.group) return a.group.localeCompare(b.group, "fr");
    return a.path.localeCompare(b.path, "fr");
  });
}
