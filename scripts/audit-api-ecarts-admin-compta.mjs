/**
 * Audit API — portails Admin + Compta
 * Analyse les **réponses JSON brutes** (pas les attentes UI / mappers front).
 * Génère docs/RAPPORT-ECARTS-API-BACKEND.md
 *
 * Usage: node scripts/audit-api-ecarts-admin-compta.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";
const OUT_FILE = path.join(ROOT, "docs", "RAPPORT-ECARTS-API-BACKEND.md");

const ACCOUNTS = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech",
    password: process.env.TEST_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!",
  },
  compta: {
    email: process.env.TEST_COMPTA_EMAIL ?? "comptable@upjunoo-dev.tech",
    password: process.env.TEST_COMPTA_PASSWORD ?? "123456789",
  },
};

/** @type {{ portal: string, route: string, label: string, endpoints: { method: string, path: string, query?: string, idSource?: string, idFrom?: string, legacy?: boolean }[], role: 'admin'|'compta' }[]} */
const PAGES = [
  { portal: "admin", route: "/admin/dashboard", label: "Tableau de bord ops", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/dashboard" },
  ]},
  { portal: "admin", route: "/admin/finance", label: "Dashboard finance", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/finance/dashboard" },
  ]},
  { portal: "admin", route: "/admin/finance/transactions", label: "Transactions", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/finance/transactions", query: "page=1&limit=10" },
  ]},
  { portal: "admin", route: "/admin/finance/wallets", label: "Wallets", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/finance/wallets", query: "page=1&limit=10" },
  ]},
  { portal: "admin", route: "/admin/finance/commissions", label: "Commissions", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/finance/commissions", query: "page=1&limit=10" },
    { method: "GET", path: "/v1/admin/filter-options" },
  ]},
  { portal: "admin", route: "/admin/finance/withdrawals", label: "Retraits", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/withdrawals", query: "page=1&limit=10" },
  ]},
  { portal: "admin", route: "/admin/finance/reconciliation", label: "Réconciliation", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/finance/reconciliation" },
  ]},
  { portal: "admin", route: "/admin/finance/ledger", label: "Grand livre", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/ledger", query: "page=1&limit=10" },
  ]},
  { portal: "admin", route: "/admin/finance/driver-transfers", label: "Virements chauffeurs", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/finance/driver-transfers/stats" },
    { method: "GET", path: "/v1/admin/finance/driver-transfers", query: "page=1&limit=10" },
  ]},
  { portal: "admin", route: "/admin/finance/commission-rules", label: "Règles commission", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/commission-rules" },
  ]},
  { portal: "admin", route: "/admin/finance/bonus-rules", label: "Règles bonus", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/bonus-rules" },
  ]},
  { portal: "admin", route: "/admin/fleet/drivers", label: "Liste chauffeurs", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/drivers", query: "page=1&limit=10" },
  ]},
  { portal: "admin", route: "/admin/fleet/drivers/{id}", label: "Fiche chauffeur", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/drivers", query: "page=1&limit=1", idSource: "drivers" },
    { method: "GET", path: "/v1/drivers/{id}", idFrom: "drivers" },
    { method: "GET", path: "/v1/admin/kyc/documents", query: "page=1&limit=5" },
  ]},
  { portal: "admin", route: "/admin/fleet/kyc", label: "File KYC", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/kyc/queue" },
    { method: "GET", path: "/v1/admin/kyc/documents", query: "page=1&limit=10" },
  ]},
  { portal: "admin", route: "/admin/fleet/clients", label: "Clients B2C/B2B", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/users", query: "page=1&limit=10" },
  ]},
  { portal: "admin", route: "/admin/fleet/vehicles", label: "Véhicules", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/vehicles", query: "page=1&limit=10" },
  ]},
  { portal: "admin", route: "/admin/ops/trips", label: "Courses", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/orders", query: "page=1&limit=10&service=taxi" },
    { method: "GET", path: "/v1/admin/filter-options" },
  ]},
  { portal: "admin", route: "/admin/ops/trips/{id}", label: "Détail course", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/orders", query: "page=1&limit=1&service=taxi", idSource: "orders" },
    { method: "GET", path: "/v1/admin/orders/{id}", idFrom: "orders" },
  ]},
  { portal: "admin", route: "/admin/ops/map", label: "Carte live", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/live-map" },
    { method: "GET", path: "/v1/catalog/vehicle-colors" },
  ]},
  { portal: "admin", route: "/admin/ops/sos", label: "SOS Guardian dashboard", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/safety/sos/dashboard" },
  ]},
  { portal: "admin", route: "/admin/ops/sos/incidents", label: "Liste incidents SOS", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/safety/sos", query: "page=1&limit=10" },
  ]},
  { portal: "admin", route: "/admin/ops/dispatch", label: "Console dispatch", role: "admin", endpoints: [
    { method: "GET", path: "/admin/ops/dispatch", legacy: true },
  ]},
  { portal: "admin", route: "/admin/ops/crisis", label: "Mode crise", role: "admin", endpoints: [
    { method: "GET", path: "/admin/ops/crisis", legacy: true },
  ]},
  { portal: "admin", route: "/admin/network/franchises", label: "Franchises", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/franchises", query: "page=1&limit=10" },
  ]},
  { portal: "admin", route: "/admin/network/partners", label: "Partenaires", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/partners", query: "page=1&limit=10" },
  ]},
  { portal: "admin", route: "/admin/network/zones", label: "Zones", role: "admin", endpoints: [
    { method: "GET", path: "/v1/zones" },
    { method: "GET", path: "/v1/geo/hot-zones" },
  ]},
  { portal: "admin", route: "/admin/network/accountants", label: "Comptables", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/accountants", query: "page=1&limit=10" },
  ]},
  { portal: "admin", route: "/admin/marketing/promos", label: "Promos marketing", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/marketing/promos" },
  ]},
  { portal: "admin", route: "/admin/marketing/campaigns", label: "Campagnes", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/marketing/campaigns" },
  ]},
  { portal: "admin", route: "/admin/marketing/banners", label: "Bannières", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/marketing/banners" },
  ]},
  { portal: "admin", route: "/admin/settings/dispatchers", label: "Dispatchers", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/dispatchers" },
  ]},
  { portal: "admin", route: "/admin/settings/dispatch-rules", label: "Règles dispatch", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/dispatch-config", query: "countryCode=CI" },
  ]},
  { portal: "admin", route: "/admin/settings/pricing", label: "Tarification", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/pricing-rules" },
    { method: "GET", path: "/v1/admin/pricing-config" },
  ]},
  { portal: "admin", route: "/admin/settings/roles", label: "Rôles", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/roles" },
  ]},
  { portal: "admin", route: "/admin/settings/weather", label: "Config météo", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/weather-config" },
  ]},
  { portal: "admin", route: "/admin/settings/general", label: "Paramètres généraux", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/settings/general" },
  ]},
  { portal: "admin", route: "/admin/settings/integrations", label: "Intégrations", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/paydunya-config" },
    { method: "GET", path: "/admin/settings/integrations", legacy: true },
  ]},
  { portal: "admin", route: "/admin/settings/audit", label: "Journal audit", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/audit-log", query: "page=1&limit=10" },
  ]},
  { portal: "admin", route: "/admin/settings/finance-caps", label: "Plafonds finance", role: "admin", endpoints: [
    { method: "GET", path: "/v1/admin/settings/finance-caps" },
  ]},
  { portal: "admin", route: "/admin/support/tickets", label: "Tickets support", role: "admin", endpoints: [
    { method: "GET", path: "/v1/support/tickets", query: "page=1&limit=10" },
  ]},
  { portal: "admin", route: "/admin/support/chat", label: "Chat support", role: "admin", endpoints: [
    { method: "GET", path: "/v1/chat/conversations" },
  ]},
  { portal: "compta", route: "/compta", label: "Dashboard compta", role: "compta", endpoints: [
    { method: "GET", path: "/v1/compta/me" },
    { method: "GET", path: "/v1/compta/dashboard" },
  ]},
  { portal: "compta", route: "/compta/ledger", label: "Grand livre compta", role: "compta", endpoints: [
    { method: "GET", path: "/v1/compta/ledger", query: "page=1&limit=10" },
    { method: "GET", path: "/v1/compta/filter-options" },
  ]},
  { portal: "compta", route: "/compta/flows", label: "Flux compta", role: "compta", endpoints: [
    { method: "GET", path: "/v1/compta/ledger", query: "page=1&limit=10" },
  ]},
  { portal: "compta", route: "/compta/transactions", label: "Transactions compta", role: "compta", endpoints: [
    { method: "GET", path: "/v1/compta/ledger", query: "page=1&limit=10" },
  ]},
  { portal: "compta", route: "/compta/wallets", label: "Wallets compta", role: "compta", endpoints: [
    { method: "GET", path: "/v1/compta/wallets", query: "page=1&limit=10" },
  ]},
  { portal: "compta", route: "/compta/commissions", label: "Commissions compta", role: "compta", endpoints: [
    { method: "GET", path: "/v1/compta/commissions", query: "page=1&limit=10" },
  ]},
  { portal: "compta", route: "/compta/withdrawals", label: "Retraits compta", role: "compta", endpoints: [
    { method: "GET", path: "/v1/compta/withdrawals", query: "page=1&limit=10" },
  ]},
  { portal: "compta", route: "/compta/reconciliation", label: "Réconciliation compta", role: "compta", endpoints: [
    { method: "GET", path: "/v1/compta/reconciliation" },
    { method: "GET", path: "/v1/compta/cash-reconciliations", query: "page=1&limit=10" },
  ]},
  { portal: "compta", route: "/compta/recharges", label: "Recharges / virements", role: "compta", endpoints: [
    { method: "GET", path: "/v1/compta/driver-transfers/stats" },
    { method: "GET", path: "/v1/compta/driver-transfers", query: "page=1&limit=10" },
  ]},
  { portal: "compta", route: "/compta/periods", label: "Périodes comptables", role: "compta", endpoints: [
    { method: "GET", path: "/v1/compta/periods" },
    { method: "GET", path: "/v1/compta/dashboard" },
  ]},
  { portal: "compta", route: "/compta/exports", label: "Exports", role: "compta", endpoints: [
    { method: "GET", path: "/v1/compta/ledger/export", query: "format=csv", binary: true },
    { method: "GET", path: "/v1/compta/reports/export", binary: true },
  ]},
];

/** Nulls volontaires dans les payloads (filtres non appliqués, scope vide, etc.) */
const NULL_OK_PATTERNS = [
  /\.applied\./,
  /\.scope\./,
  /\.filters\.(from|to|search|date|timezone|serviceType)$/,
  /^(from|to|search|franchiseId|partnerId|cityId|zoneId|countryCode|citySlug|status)$/,
  /franchiseIds$/,
  /cityIds$/,
  /countryId$/,
  /last_sync_at$/,
  /support_email$/,
  /support_phone$/,
  /partner_id$/,
  /franchise_id$/,
  /file_url$/,
  /fileUrl$/,
];

async function request(path, { method = "GET", token, body } = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Client-Type": "back-office",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _parseError: true, _raw: text.slice(0, 400) };
  }
  return { status: res.status, ok: res.ok, json, contentType: res.headers.get("content-type") };
}

async function login(role) {
  const { email, password } = ACCOUNTS[role];
  const res = await request("/v1/auth/login", {
    method: "POST",
    body: { email, password },
  });
  const token =
    res.json?.accessToken ??
    res.json?.session?.access_token ??
    res.json?.data?.accessToken ??
    null;
  return { token, loginStatus: res.status, loginJson: res.json };
}

function getByPath(obj, dotPath) {
  if (!obj || !dotPath) return undefined;
  return dotPath.split(".").reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
}

function isNullOk(path) {
  const leaf = path.split(".").pop() ?? path;
  return NULL_OK_PATTERNS.some((re) => re.test(path) || re.test(leaf));
}

function typeLabel(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return `array[${v.length}]`;
  if (typeof v === "object") return `object{${Object.keys(v).length}}`;
  return typeof v;
}

/** Profil lisible du payload brut */
function profilePayload(json) {
  if (!json || typeof json !== "object") {
    return { summary: String(json), lists: [], envelope: null };
  }

  const topKeys = Object.keys(json);
  const envelope = json.status ?? json.success ?? null;

  /** @type {{ path: string, length: number }[]} */
  const lists = [];

  function walk(obj, prefix, depth) {
    if (depth > 3 || !obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      lists.push({ path: prefix || "(root)", length: obj.length });
      return;
    }
    for (const [k, v] of Object.entries(obj)) {
      const p = prefix ? `${prefix}.${k}` : k;
      if (Array.isArray(v)) lists.push({ path: p, length: v.length });
      else if (v && typeof v === "object") walk(v, p, depth + 1);
    }
  }
  walk(json, "", 0);

  const summaryParts = topKeys.map((k) => `${k}: ${typeLabel(json[k])}`);
  return {
    summary: summaryParts.join(", "),
    lists: lists.slice(0, 12),
    envelope: envelope != null ? String(envelope) : null,
  };
}

function extractListArrays(json) {
  if (!json || typeof json !== "object") return [];
  const found = [];
  const keys = [
    "items", "rides", "orders", "drivers", "users", "documents", "withdrawals",
    "transactions", "entries", "incidents", "wallets", "commissions", "franchises",
    "partners", "vehicles", "data", "alerts", "roles", "zones",
  ];
  for (const k of keys) {
    if (Array.isArray(json[k])) found.push({ key: k, items: json[k] });
  }
  for (const [k, v] of Object.entries(json)) {
    if (k === "dashboard" && v && typeof v === "object") {
      for (const [dk, dv] of Object.entries(v)) {
        if (Array.isArray(dv)) found.push({ key: `dashboard.${dk}`, items: dv });
        if (dv && typeof dv === "object" && Array.isArray(dv.items)) {
          found.push({ key: `dashboard.${dk}.items`, items: dv.items });
        }
      }
    }
    if (v && typeof v === "object" && !Array.isArray(v) && Array.isArray(v.items)) {
      if (!found.some((f) => f.key === `${k}.items`)) {
        found.push({ key: `${k}.items`, items: v.items });
      }
    }
  }
  return found;
}

function extractId(item) {
  if (!item || typeof item !== "object") return null;
  return item.id ?? item.orderId ?? item.driverId ?? item.userId ?? null;
}

function errorCode(json) {
  return json?.error?.code ?? json?.code ?? json?.error?.message ?? json?.message ?? null;
}

function isNotImplemented(json, status) {
  return status === 501 || json?.error?.code === "NOT_IMPLEMENTED";
}

/** Analyse cohérence interne du JSON brut — sans référence au front */
function analyzeRawPayload(json, endpointPath) {
  /** @type {{ type: string, gravite: string, detail: string, action: string }[]} */
  const anomalies = [];

  if (!json || json._parseError) {
    anomalies.push({
      type: "parse",
      gravite: "haute",
      detail: "Réponse non-JSON ou corps vide",
      action: "Renvoyer application/json valide",
    });
    return anomalies;
  }

  if (json.status && json.status !== "ok" && json.status !== "success") {
    anomalies.push({
      type: "envelope",
      gravite: "haute",
      detail: `Envelope \`status\` = "${json.status}"`,
      action: "Corriger statut ou renvoyer erreur HTTP appropriée",
    });
  }

  if (json.error && !json.status) {
    anomalies.push({
      type: "envelope",
      gravite: "haute",
      detail: `Objet \`error\` présent : ${JSON.stringify(json.error).slice(0, 120)}`,
      action: "Utiliser code HTTP 4xx/5xx + envelope d'erreur standard",
    });
  }

  // —— Dashboard admin : cohérence interne ——
  const dash = json.dashboard;
  if (dash?.summary) {
    const rb = dash.summary.ridesBreakdownToday;
    if (rb?.byStatus && typeof rb.total === "number") {
      const sum =
        (rb.byStatus.inProgress ?? rb.inProgress ?? 0) +
        (rb.byStatus.completed ?? rb.completed ?? 0) +
        (rb.byStatus.cancelled ?? rb.cancelled ?? 0);
      if (sum !== rb.total) {
        anomalies.push({
          type: "coherence",
          gravite: "moyenne",
          detail: `dashboard.summary.ridesBreakdownToday : total=${rb.total} ≠ somme statuts=${sum}`,
          action: "Aligner total et byStatus dans le même payload",
        });
      }
    }

    const kycPending = dash.summary.kyc?.pendingReview;
    const kycAlert = dash.alerts?.find((a) => a.code === "KYC_PENDING");
    if (typeof kycPending === "number" && kycAlert && kycAlert.count !== kycPending) {
      anomalies.push({
        type: "coherence",
        gravite: "moyenne",
        detail: `KYC : summary.kyc.pendingReview=${kycPending} ≠ alerts[KYC_PENDING].count=${kycAlert.count}`,
        action: "Synchroniser compteurs KYC dans la même réponse",
      });
    }

    const driversPending = dash.summary.drivers?.pendingApproval;
    const driversAlert = dash.alerts?.find((a) => a.code === "DRIVERS_PENDING_APPROVAL");
    if (typeof driversPending === "number" && driversAlert && driversAlert.count !== driversPending) {
      anomalies.push({
        type: "coherence",
        gravite: "moyenne",
        detail: `Chauffeurs : summary.drivers.pendingApproval=${driversPending} ≠ alert.count=${driversAlert.count}`,
        action: "Synchroniser compteurs chauffeurs",
      });
    }
  }

  if (dash?.recentActivity?.pagination) {
    const pag = dash.recentActivity.pagination;
    const len = dash.recentActivity.items?.length ?? 0;
    if (pag.total > 0 && len === 0) {
      anomalies.push({
        type: "coherence",
        gravite: "haute",
        detail: `recentActivity.pagination.total=${pag.total} mais items=[]`,
        action: "Renvoyer les items ou corriger total",
      });
    }
    if (pag.total === 0 && len > 0) {
      anomalies.push({
        type: "coherence",
        gravite: "moyenne",
        detail: `recentActivity.pagination.total=0 mais ${len} item(s) présents`,
        action: "Corriger pagination.total",
      });
    }
  }

  // —— Listes paginées ——
  const listArrays = extractListArrays(json);
  const pagination =
    json.pagination ??
    json.meta?.pagination ??
    json.pageInfo ??
    null;

  /** Listes métier sans id (alertes, options filtre, séries graphiques…) */
  const NO_ID_LISTS = /(\.alerts$|^alerts$|\.labels$|\.series$|\.options\.|filterOptions|franchise_options|payment_mix|chart_)/;

  for (const { key, items } of listArrays) {
    if (!Array.isArray(items) || items.length === 0) continue;

    const needsId = !NO_ID_LISTS.test(key);
    if (needsId) {
      const nullIds = items.filter((it) => it && (it.id === null || it.id === undefined)).length;
      if (nullIds > 0) {
        anomalies.push({
          type: "integrite",
          gravite: "haute",
          detail: `${key} : ${nullIds}/${items.length} ligne(s) sans \`id\``,
          action: "Toute entité listée doit avoir un identifiant",
        });
      }
    }

    for (const item of items.slice(0, 5)) {
      if (!item || typeof item !== "object") continue;
      for (const [field, val] of Object.entries(item)) {
        if (val !== null) continue;
        const p = `${key}[].${field}`;
        if (isNullOk(p) || isNullOk(field)) continue;
        if (["id", "status", "email", "ref", "type", "created_at", "createdAt"].includes(field)) {
          anomalies.push({
            type: "null_critique",
            gravite: "haute",
            detail: `${p} = null (id=${extractId(item) ?? "?"})`,
            action: `Peupler \`${field}\` ou documenter nullable dans Swagger`,
          });
        }
      }
    }
  }

  if (pagination) {
    const total = pagination.total ?? pagination.totalCount;
    const mainList = listArrays.find((l) => l.key === "items") ?? listArrays[0];
    if (typeof total === "number" && mainList) {
      if (total > 0 && mainList.items.length === 0) {
        anomalies.push({
          type: "coherence",
          gravite: "haute",
          detail: `pagination.total=${total} mais liste \`${mainList.key}\` vide`,
          action: "Aligner pagination et contenu",
        });
      }
    }
    if (pagination.page != null && pagination.limit != null && mainList) {
      const expectedMax = pagination.limit;
      if (mainList.items.length > expectedMax) {
        anomalies.push({
          type: "coherence",
          gravite: "moyenne",
          detail: `${mainList.items.length} items > limit=${expectedMax}`,
          action: "Respecter limit dans la réponse paginée",
        });
      }
    }
  }

  // Doublons de listes (items + alias métier)
  const itemLists = listArrays.filter((l) =>
    ["items", "wallets", "commissions", "transactions", "drivers", "orders", "rides"].includes(
      l.key.split(".").pop() ?? l.key
    )
  );
  if (itemLists.length >= 2) {
    const lengths = itemLists.map((l) => `${l.key}:${l.items.length}`);
    const uniqueLengths = new Set(itemLists.map((l) => l.items.length));
    if (uniqueLengths.size > 1 && itemLists.every((l) => l.items.length > 0)) {
      anomalies.push({
        type: "structure",
        gravite: "basse",
        detail: `Plusieurs listes racine avec tailles différentes : ${lengths.join(", ")}`,
        action: "Documenter si alias (items vs wallets) ou unifier le contrat",
      });
    }
  }

  return anomalies;
}

/** @type {Map<string, any>} */
const idCache = new Map();

async function resolveEndpoint(ep, token, role) {
  let path = ep.path;
  if (ep.idFrom && path.includes("{id}")) {
    const id = idCache.get(`${role}:${ep.idFrom}`);
    if (!id) {
      return { resolvedPath: path, skipped: true, reason: `Pas d'id extrait pour ${ep.idFrom}` };
    }
    path = path.replace("{id}", encodeURIComponent(String(id)));
  }
  const qs = ep.query ? `?${ep.query}` : "";
  const fullPath = `${path}${qs}`;
  const res = await request(fullPath, { token });

  if (ep.idSource && res.ok) {
    const lists = extractListArrays(res.json);
    const first = lists[0]?.items?.[0];
    const id = extractId(first);
    if (id) idCache.set(`${role}:${ep.idSource}`, id);
  }

  return { ...res, resolvedPath: fullPath, skipped: false, legacy: ep.legacy ?? false };
}

function statusLabel(result) {
  if (result.skipped) return "skip";
  if (result.ok) return "ok";
  if (isNotImplemented(result.json, result.status)) return "501";
  if (result.status === 403) return "403";
  if (result.status === 404) return "404";
  if (result.status === 401) return "401";
  return "erreur";
}

async function auditPage(page, token) {
  const endpointResults = [];
  const anomalies = [];

  for (const ep of page.endpoints) {
    const result = await resolveEndpoint(ep, token, page.role);
    const label = statusLabel(result);
    const profile = result.ok && result.json ? profilePayload(result.json) : null;

    endpointResults.push({
      method: ep.method,
      path: result.resolvedPath ?? ep.path,
      httpStatus: result.skipped ? "—" : result.status,
      statut: label,
      legacy: result.legacy,
      binary: ep.binary ?? false,
      payload: ep.binary
        ? { summary: result.contentType ?? "binaire", lists: [], envelope: null }
        : profile,
    });

    if (result.skipped) {
      anomalies.push({
        type: "skip",
        gravite: "info",
        detail: result.reason,
        action: "Vérifier données seed ou liste vide",
      });
      continue;
    }

    if (!result.ok) {
      const gravite = result.legacy ? "moyenne" : "haute";
      anomalies.push({
        type: result.legacy ? "legacy_absent" : isNotImplemented(result.json, result.status) ? "501" : "http",
        gravite,
        detail: result.legacy
          ? `Route legacy MSW absente du backend : HTTP ${result.status}`
          : `HTTP ${result.status} — ${errorCode(result.json) ?? "sans message"}`,
        action: result.legacy
          ? "Migrer vers /v1/... ou implémenter sur l'API live"
          : "Implémenter ou corriger route + droits JWT",
      });
      continue;
    }

    if (ep.binary) {
      const ct = result.contentType ?? "";
      if (!result.ok) continue;
      if (!ct.includes("csv") && !ct.includes("octet") && !ct.includes("spreadsheet")) {
        anomalies.push({
          type: "content-type",
          gravite: "basse",
          detail: `Export : Content-Type inattendu (${ct || "vide"})`,
          action: "text/csv ou application/octet-stream pour les exports",
        });
      }
      continue;
    }

    const rawIssues = analyzeRawPayload(result.json, result.resolvedPath);
    for (const a of rawIssues) {
      anomalies.push(a);
    }
  }

  const v1Results = endpointResults.filter((e) => !e.legacy);
  const pageStatus =
    v1Results.length === 0
      ? endpointResults.every((e) => e.statut === "ok")
        ? "ok"
        : endpointResults.some((e) => e.statut === "ok")
          ? "partiel"
          : "ko"
      : v1Results.every((e) => e.statut === "ok")
        ? anomalies.filter((a) => a.gravite === "haute").length === 0
          ? "ok"
          : "partiel"
        : v1Results.some((e) => e.statut === "ok")
          ? "partiel"
          : "ko";

  return { ...page, endpointResults, anomalies, pageStatus };
}

function graviteIcon(g) {
  if (g === "haute") return "🔴";
  if (g === "moyenne") return "🟠";
  if (g === "basse") return "🟡";
  return "⚪";
}

function buildMarkdown(adminLogin, comptaLogin, adminPages, comptaPages) {
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");
  const allPages = [...adminPages, ...comptaPages];
  const totalAnomalies = allPages.reduce((s, p) => s + p.anomalies.length, 0);
  const highAnomalies = allPages.reduce(
    (s, p) => s + p.anomalies.filter((a) => a.gravite === "haute").length,
    0
  );

  let md = `# Rapport écarts API — Back-office Admin & Compta

> **Date :** ${now}  
> **API :** ${API_URL}  
> **Swagger :** https://api.upjunoo-dev.tech/docs  
> **Généré par :** \`node scripts/audit-api-ecarts-admin-compta.mjs\`

---

## Comptes utilisés

| Portail | Email | Login |
|---------|-------|-------|
| Admin | \`${ACCOUNTS.admin.email}\` | ${adminLogin.token ? "✅ OK" : `❌ HTTP ${adminLogin.loginStatus}`} |
| Compta | \`${ACCOUNTS.compta.email}\` | ${comptaLogin.token ? "✅ OK" : `❌ HTTP ${comptaLogin.loginStatus}`} |

---

## Synthèse

| Indicateur | Valeur |
|------------|--------|
| Pages auditées | ${allPages.length} (${adminPages.length} admin + ${comptaPages.length} compta) |
| Anomalies totales | ${totalAnomalies} |
| Anomalies haute gravité | ${highAnomalies} |

**Méthode :** analyse des **payloads JSON bruts** renvoyés par l'API (HTTP, envelope, cohérence interne, intégrité des listes).  
Les \`null\` dans les filtres non appliqués (\`filters.applied.*\`) et les relations optionnelles (\`franchise_id\`, etc.) ne sont **pas** signalés.

**Légende gravité :**
- 🔴 haute — réponse invalide, incohérence bloquante, entité sans \`id\`
- 🟠 moyenne — route legacy absente, compteurs incohérents dans le même JSON
- 🟡 basse — structure dupliquée, content-type

---

`;

  for (const [portalName, pages] of [
    ["Admin", adminPages],
    ["Compta", comptaPages],
  ]) {
    md += `## Portail ${portalName}\n\n`;

    for (const page of pages) {
      const statusBadge =
        page.pageStatus === "ok" ? "✅" : page.pageStatus === "partiel" ? "⚠️" : "❌";

      md += `### ${statusBadge} ${page.label}\n\n`;
      md += `- **Route UI :** \`${page.route}\`\n`;
      md += `- **Statut :** ${page.pageStatus}\n\n`;

      md += `**Endpoints testés**\n\n`;
      md += `| Méthode | Endpoint | HTTP | Statut | Payload (racine) |\n`;
      md += `|---------|----------|------|--------|------------------|\n`;
      for (const ep of page.endpointResults) {
        const legacyTag = ep.legacy ? " _(legacy)_" : "";
        const payloadShort = ep.payload
          ? ep.payload.summary.slice(0, 90).replace(/\|/g, "\\|") + (ep.payload.summary.length > 90 ? "…" : "")
          : "—";
        md += `| ${ep.method} | \`${ep.path}\`${legacyTag} | ${ep.httpStatus} | ${ep.statut} | ${payloadShort} |\n`;
      }
      md += `\n`;

      if (page.endpointResults.some((e) => e.payload?.lists?.length)) {
        md += `**Tableaux dans la réponse**\n\n`;
        for (const ep of page.endpointResults) {
          if (!ep.payload?.lists?.length) continue;
          const lists = ep.payload.lists.map((l) => `\`${l.path}\` (${l.length})`).join(", ");
          md += `- \`${ep.path}\` : ${lists}\n`;
        }
        md += `\n`;
      }

      if (page.anomalies.length === 0) {
        md += `_Aucune anomalie détectée dans les payloads bruts._\n\n`;
        md += `---\n\n`;
        continue;
      }

      md += `**Anomalies (payload brut)**\n\n`;
      md += `| Gravité | Type | Détail | Action suggérée |\n`;
      md += `|---------|------|--------|------------------|\n`;
      for (const a of page.anomalies) {
        md += `| ${graviteIcon(a.gravite)} ${a.gravite} | ${a.type} | ${a.detail.replace(/\|/g, "\\|")} | ${a.action} |\n`;
      }
      md += `\n---\n\n`;
    }
  }

  md += `## Actions prioritaires backend\n\n`;

  const high = [];
  for (const p of allPages) {
    for (const a of p.anomalies) {
      if (a.gravite === "haute") high.push({ ...a, route: p.route });
    }
  }

  if (high.length === 0) {
    md += `_Aucune anomalie haute sur les endpoints /v1._\n`;
  } else {
    high.slice(0, 20).forEach((a, i) => {
      md += `${i + 1}. **${a.detail}** — \`${a.route}\`\n`;
    });
  }

  md += `\n---\n\n`;
  md += `## Notes méthodologie\n\n`;
  md += `- Audit **lecture seule** (GET) sur \`${API_URL}\`.\n`;
  md += `- Chaque ligne du tableau « Payload (racine) » décrit les **clés réellement renvoyées** (ex. \`status: string, dashboard: object{9}\`).\n`;
  md += `- Les \`null\` dans \`filters.applied\` (aucun filtre actif) sont **normaux** — voir exemple \`GET /v1/admin/dashboard\`.\n`;
  md += `- Routes \`/admin/...\` sans \`/v1\` = appels legacy MSW encore présents dans le front ; marquées _(legacy)_ si 404.\n`;
  md += `- Relancer : \`node scripts/audit-api-ecarts-admin-compta.mjs\`\n`;

  return md;
}

async function main() {
  console.log(`\n=== Audit payloads API Admin + Compta — ${API_URL} ===\n`);

  const adminLogin = await login("admin");
  const comptaLogin = await login("compta");

  if (!adminLogin.token || !comptaLogin.token) {
    console.error("Échec login", { admin: adminLogin.loginStatus, compta: comptaLogin.loginStatus });
    process.exit(1);
  }

  console.log("Login admin OK");
  console.log("Login compta OK\n");

  const adminPages = [];
  const comptaPages = [];

  for (const page of PAGES) {
    const token = page.role === "admin" ? adminLogin.token : comptaLogin.token;
    process.stdout.write(`  ${page.route} … `);
    const result = await auditPage(page, token);
    console.log(result.pageStatus, `(${result.anomalies.length} anomalies)`);
    if (page.portal === "admin") adminPages.push(result);
    else comptaPages.push(result);
  }

  const md = buildMarkdown(adminLogin, comptaLogin, adminPages, comptaPages);
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, md, "utf8");

  console.log(`\n✅ Rapport écrit : ${OUT_FILE}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
