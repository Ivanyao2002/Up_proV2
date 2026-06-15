#!/usr/bin/env node
/**
 * Script de test complet pour un onglet/portail spécifique
 * Usage: node scripts/test-tab-features.mjs <portail> [section]
 * 
 * Exemples:
 *   node scripts/test-tab-features.mjs admin
 *   node scripts/test-tab-features.mjs franchise finance
 *   node scripts/test-tab-features.mjs partner fleet
 * 
 * Portails disponibles: admin, franchise, partner, dispatch
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";
const EMAIL = process.env.TEST_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech";
const PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!";
const FRANCHISE_EMAIL = process.env.TEST_FRANCHISE_EMAIL ?? "dev.franchise.bf@upjunoo-dev.tech";
const FRANCHISE_PASSWORD = process.env.TEST_FRANCHISE_PASSWORD ?? "Upjunoo@Dev2026!";
const REPORT_FILE = process.env.REPORT_FILE ?? null;

/** Routes qui exigent un token franchise (FRANCHISE_ACCESS_REQUIRED) */
const FRANCHISE_ONLY_PREFIXES = [
  "/v1/franchise/",
  "/v1/franchises/me",
];

// Configuration des endpoints par onglet/section
const TAB_ENDPOINTS = {
  admin: {
    operations: {
      label: "OPÉRATIONS",
      paths: [
        { method: "GET", path: "/v1/admin/dashboard", name: "Tableau de bord" },
        { method: "GET", path: "/v1/admin/live-map", name: "Carte live" },
        { method: "GET", path: "/v1/admin/orders?page=1&limit=10", name: "Liste des courses" },
        { method: "GET", path: "/v1/admin/orders/{orderId}", name: "Détail course", sampleId: true },
      ]
    },
    network: {
      label: "RÉSEAU",
      paths: [
        { method: "GET", path: "/v1/admin/franchises?page=1&limit=10", name: "Liste franchises" },
        { method: "GET", path: "/v1/admin/franchises/{id}", name: "Détail franchise", sampleId: true },
        { method: "GET", path: "/v1/franchises/{id}/partners?page=1&limit=10", name: "Partenaires d'une franchise", sampleId: true },
        { method: "GET", path: "/v1/franchises/{id}/drivers?page=1&limit=10", name: "Chauffeurs d'une franchise", sampleId: true },
        { method: "GET", path: "/v1/franchises/{id}/orders?page=1&limit=10", name: "Commandes d'une franchise", sampleId: true },
        { method: "GET", path: "/v1/franchises/{id}/revenue", name: "Revenus franchise", sampleId: true },
        { method: "GET", path: "/v1/admin/partners?page=1&limit=10", name: "Liste partenaires" },
        { method: "GET", path: "/v1/partners/{id}", name: "Détail partenaire", sampleId: true },
        { method: "GET", path: "/v1/admin/zones?page=1&limit=10", name: "Liste zones" },
      ]
    },
    fleet: {
      label: "FLOTTE",
      paths: [
        { method: "GET", path: "/v1/admin/drivers?page=1&limit=10", name: "Liste chauffeurs" },
        { method: "GET", path: "/v1/admin/drivers?search=test&page=1&limit=10", name: "Recherche chauffeurs" },
        { method: "GET", path: "/v1/drivers/{id}", name: "Détail chauffeur", sampleId: true },
        { method: "GET", path: "/v1/admin/vehicles?page=1&limit=10", name: "Liste véhicules" },
        { method: "GET", path: "/v1/admin/kyc/documents?page=1&limit=10", name: "File KYC" },
        { method: "GET", path: "/v1/admin/kyc/queue", name: "Queue KYC" },
        { method: "GET", path: "/v1/admin/users?page=1&limit=10", name: "Liste clients" },
        { method: "GET", path: "/v1/admin/users/{id}", name: "Détail client", sampleId: true },
      ]
    },
    finance: {
      label: "FINANCE",
      paths: [
        { method: "GET", path: "/v1/admin/finance/dashboard", name: "Dashboard finance" },
        { method: "GET", path: "/v1/admin/reports/finance", name: "Rapport finance" },
        { method: "GET", path: "/v1/admin/finance/transactions?page=1&limit=10", name: "Transactions" },
        { method: "GET", path: "/v1/admin/withdrawals?page=1&limit=10", name: "Retraits" },
        { method: "GET", path: "/v1/admin/finance/wallets?page=1&limit=10", name: "Portefeuilles" },
        { method: "GET", path: "/v1/admin/finance/driver-transfers/stats", name: "Stats recharges chauffeurs" },
        { method: "GET", path: "/v1/admin/finance/driver-transfers?page=1&limit=10", name: "Recharges chauffeurs" },
        { method: "GET", path: "/v1/admin/finance/commissions?page=1&limit=10", name: "Commissions" },
        { method: "GET", path: "/v1/admin/commission-rules", name: "Règles de commission" },
        { method: "GET", path: "/v1/admin/finance/reconciliation?page=1&limit=10", name: "Réconciliation" },
        { method: "GET", path: "/v1/admin/cash-reconciliations?page=1&limit=10", name: "Cash reconciliations" },
        { method: "GET", path: "/v1/wallets/recharge-batches?page=1&limit=10", name: "Batch recharges" },
      ]
    },
    marketing: {
      label: "MARKETING",
      paths: [
        { method: "GET", path: "/v1/admin/promotions?page=1&limit=10", name: "Codes promo" },
        { method: "GET", path: "/v1/admin/marketing/promos?page=1&limit=10", name: "Promos (mock)" },
        { method: "GET", path: "/v1/campaigns?page=1&limit=10", name: "Campagnes" },
        { method: "GET", path: "/v1/admin/marketing/campaigns?page=1&limit=10", name: "Campagnes (mock)" },
        { method: "GET", path: "/v1/app-banners?page=1&limit=10", name: "Bannières" },
        { method: "GET", path: "/v1/admin/marketing/banners?page=1&limit=10", name: "Bannières (mock)" },
      ]
    },
    support: {
      label: "SUPPORT",
      paths: [
        { method: "GET", path: "/v1/support/tickets?page=1&limit=10", name: "Tickets support" },
        { method: "GET", path: "/v1/admin/support/tickets?page=1&limit=10", name: "Tickets (mock)" },
      ]
    },
    settings: {
      label: "PARAMÈTRES",
      paths: [
        { method: "GET", path: "/v1/admin/dispatchers?page=1&limit=10", name: "Dispatchers" },
        { method: "GET", path: "/v1/admin/settings/dispatch-rules", name: "Règles dispatch (mock)" },
        { method: "GET", path: "/v1/admin/dispatch-config", name: "Config dispatch" },
        { method: "GET", path: "/v1/admin/roles?page=1&limit=10", name: "Rôles" },
        { method: "GET", path: "/v1/admin/settings/roles?page=1&limit=10", name: "Rôles (mock)" },
        { method: "GET", path: "/v1/admin/pricing-rules?page=1&limit=10", name: "Règles tarification" },
        { method: "GET", path: "/v1/admin/settings/integrations", name: "Intégrations (mock)" },
        { method: "GET", path: "/v1/admin/paydunya-config", name: "Config Paydunya" },
        { method: "GET", path: "/v1/admin/weather-config", name: "Config météo" },
        { method: "GET", path: "/v1/admin/audit-log?page=1&limit=10", name: "Audit log" },
        { method: "GET", path: "/v1/admin/settings/audit?page=1&limit=10", name: "Audit (mock)" },
        { method: "GET", path: "/v1/admin/settings/general", name: "Paramètres généraux" },
      ]
    }
  },
  
  franchise: {
    territoire: {
      label: "TERRITOIRE",
      paths: [
        { method: "GET", path: "/v1/franchise/dashboard", name: "Dashboard franchise" },
        { method: "GET", path: "/v1/franchises/me", name: "Info franchise courante" },
        { method: "GET", path: "/v1/franchises/{id}", name: "Détail franchise", sampleId: true },
        { method: "GET", path: "/v1/franchise/livemap", name: "Carte live" },
        { method: "GET", path: "/v1/franchises/{id}/orders?page=1&limit=10", name: "Liste courses franchise", sampleId: true },
        { method: "GET", path: "/v1/franchises/{id}/orders/{orderId}", name: "Détail course franchise", sampleId: true },
        { method: "GET", path: "/v1/franchises/{id}/territory", name: "Carte territoire", sampleId: true },
        { method: "GET", path: "/v1/franchise/pricing", name: "Tarification franchise" },
        { method: "POST", path: "/v1/franchise/pricing", name: "Créer tarification" },
        { method: "GET", path: "/v1/franchise/dispatch/orders", name: "Console dispatch" },
        { method: "POST", path: "/v1/franchise/territory/extension-request", name: "Demande extension territoire", body: { zone_ids: ["zone-test-1"], notes: "Test" } },
      ]
    },
    flotte: {
      label: "FLOTTE",
      paths: [
        { method: "GET", path: "/v1/franchises/{id}/partners?page=1&limit=10", name: "Liste partenaires franchise", sampleId: true },
        { method: "GET", path: "/v1/franchises/{id}/partners/{partnerId}", name: "Détail partenaire franchise", sampleId: true },
        { method: "GET", path: "/v1/franchises/{id}/drivers?page=1&limit=10", name: "Liste chauffeurs franchise", sampleId: true },
        { method: "GET", path: "/v1/franchises/{id}/drivers/{driverId}", name: "Détail chauffeur franchise", sampleId: true },
        { method: "GET", path: "/v1/franchise/drivers/moderation?page=1&limit=10", name: "Modération KYC" },
        { method: "POST", path: "/v1/admin/drivers/{driverId}/approve", name: "Approuver KYC chauffeur", sampleId: true, body: { note: "test" } },
        { method: "POST", path: "/v1/admin/drivers/{driverId}/reject", name: "Rejeter KYC chauffeur", sampleId: true, body: { reason: "test" } },
        { method: "GET", path: "/v1/franchise/clients?page=1&limit=10", name: "Clients franchise" },
        { method: "GET", path: "/v1/admin/kyc/documents?subject_id={driverId}&subject_type=DRIVER", name: "Documents KYC chauffeur", sampleId: true },
      ]
    },
    finance: {
      label: "FINANCE",
      paths: [
        { method: "GET", path: "/v1/franchise/finance", name: "Dashboard finance franchise" },
        { method: "GET", path: "/v1/franchises/{id}/wallet", name: "Wallet franchise", sampleId: true },
        { method: "GET", path: "/v1/franchises/{id}/ledger?limit=5", name: "Ledger franchise", sampleId: true },
        { method: "GET", path: "/v1/franchise/finance/commissions", name: "Liste commissions franchise" },
        { method: "GET", path: "/v1/franchise/finance/commissions/{id}", name: "Détail commission", sampleId: true },
        { method: "GET", path: "/v1/franchise/finance/reconciliation", name: "Liste réconciliation franchise" },
        { method: "GET", path: "/v1/franchise/finance/reconciliation/{id}", name: "Détail réconciliation", sampleId: true },
        { method: "GET", path: "/v1/franchise/finance/partner-transfers", name: "Recharges partenaires" },
        { method: "GET", path: "/v1/franchise/finance/driver-transfers", name: "Recharges chauffeurs" },
        { method: "GET", path: "/v1/partners/{partnerId}/wallet", name: "Wallet partenaire (pour recharges)", sampleId: true },
        { method: "GET", path: "/v1/partners/{partnerId}/ledger?limit=5", name: "Ledger partenaire", sampleId: true },
      ]
    },
    marketing: {
      label: "MARKETING",
      paths: [
        { method: "GET", path: "/v1/franchise/promos", name: "Liste codes promo" },
        { method: "GET", path: "/v1/franchise/promos/{id}", name: "Détail code promo", sampleId: true },
        { method: "POST", path: "/v1/franchise/promos", name: "Créer code promo" },
        { method: "GET", path: "/v1/franchise/marketing/campaigns", name: "Liste campagnes" },
        { method: "POST", path: "/v1/franchise/marketing/campaigns", name: "Créer campagne" },
        { method: "GET", path: "/v1/franchise/marketing/banners", name: "Liste bannières" },
        { method: "POST", path: "/v1/franchise/marketing/banners", name: "Créer bannière" },
      ]
    },
    support: {
      label: "SUPPORT",
      paths: [
        { method: "GET", path: "/v1/franchise/support/tickets", name: "Liste tickets support" },
        { method: "GET", path: "/v1/franchise/support/tickets/{id}", name: "Détail ticket support", sampleId: true },
        { method: "POST", path: "/v1/franchise/support/tickets/{id}/messages", name: "Répondre ticket", sampleId: true },
        { method: "GET", path: "/v1/franchise/support/chat", name: "Liste chats support" },
        { method: "GET", path: "/v1/franchise/support/chat/{id}", name: "Détail chat", sampleId: true },
        { method: "POST", path: "/v1/franchise/support/chat/{id}/messages", name: "Répondre chat", sampleId: true },
      ]
    }
  },
  
  partner: {
    fleet: {
      label: "MA FLOTTE",
      paths: [
        { method: "GET", path: "/v1/partner/dashboard", name: "Dashboard partenaire" },
        { method: "GET", path: "/v1/partner/fleet?page=1&limit=10", name: "Véhicules" },
        { method: "GET", path: "/v1/partner/fleet/pending?page=1&limit=10", name: "Véhicules à valider" },
        { method: "GET", path: "/v1/partner/drivers?page=1&limit=10", name: "Chauffeurs" },
        { method: "GET", path: "/v1/partner/drivers/pending?page=1&limit=10", name: "Chauffeurs KYC" },
        { method: "GET", path: "/v1/partner/bookings?page=1&limit=10", name: "Courses" },
        { method: "GET", path: "/v1/partner/map", name: "Carte live" },
      ]
    },
    activite: {
      label: "ACTIVITÉ",
      paths: [
        { method: "GET", path: "/v1/partner/bookings/recurring", name: "Courses récurrentes" },
        { method: "GET", path: "/v1/partner/shifts", name: "Planning shifts" },
        { method: "GET", path: "/v1/partner/reports", name: "Rapports" },
      ]
    },
    finance: {
      label: "FINANCE",
      paths: [
        { method: "GET", path: "/v1/partners/{id}/wallet", name: "Wallet partenaire", sampleId: true },
        { method: "GET", path: "/v1/partners/{id}/ledger?limit=5", name: "Ledger partenaire", sampleId: true },
        { method: "GET", path: "/v1/partner/wallet/driver-transfers", name: "Recharges chauffeurs" },
      ]
    },
    support: {
      label: "SUPPORT",
      paths: [
        { method: "GET", path: "/v1/partner/support/chat", name: "Chat support" },
      ]
    }
  },
  
  dispatch: {
    console: {
      label: "DISPATCH",
      paths: [
        { method: "GET", path: "/v1/dispatch/console", name: "Console dispatch" },
        { method: "POST", path: "/v1/dispatch/book", name: "Réserver course", body: { test: true } },
        { method: "GET", path: "/v1/dispatch/map", name: "Carte live" },
        { method: "GET", path: "/v1/dispatch/{serviceType}/{orderId}/status", name: "Statut course", sampleId: true },
        { method: "GET", path: "/v1/dispatch/{serviceType}/{orderId}/logs", name: "Logs course", sampleId: true },
      ]
    }
  }
};

// IDs échantillon pour les tests
let sampleIds = {
  orderId: null,
  franchiseId: null,
  partnerId: null,       // toujours scopé à la franchise
  driverId: null,        // toujours scopé à la franchise
  userId: null,
  vehicleId: null,
  serviceType: "RIDE"
};

// Résultats des tests
const results = {
  ok: [],
  partial: [],
  failed: [],
  missing: [],
  bugs: [],
  dataIssues: []
};

async function request(path, { method = "GET", token, body } = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Client-Type": "back-office",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  
  const url = `${API_URL}${path}`;
  const startTime = Date.now();
  
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const latency = Date.now() - startTime;
    const text = await res.text();
    let json = null;
    
    try { 
      json = text ? JSON.parse(text) : null; 
    } catch { 
      json = { raw: text.slice(0, 200) }; 
    }
    
    return { 
      status: res.status, 
      ok: res.ok, 
      json, 
      latency,
      error: res.status >= 400 ? (json?.error?.message || json?.message || text.slice(0, 100)) : null
    };
  } catch (e) {
    return { 
      status: 0, 
      ok: false, 
      json: null, 
      latency: Date.now() - startTime,
      error: `Network error: ${e.message}`
    };
  }
}

function substitutePath(path) {
  return path
    .replace(/\{orderId\}/g, sampleIds.orderId || "00000000-0000-0000-0000-000000000001")
    .replace(/\{id\}/g, sampleIds.franchiseId || sampleIds.partnerId || sampleIds.driverId || sampleIds.userId || "00000000-0000-0000-0000-000000000001")
    .replace(/\{franchiseId\}/g, sampleIds.franchiseId || "00000000-0000-0000-0000-000000000001")
    .replace(/\{partnerId\}/g, sampleIds.partnerId || sampleIds.franchiseId || "00000000-0000-0000-0000-000000000001")
    .replace(/\{driverId\}/g, sampleIds.driverId || sampleIds.franchiseId || "00000000-0000-0000-0000-000000000001")
    .replace(/\{userId\}/g, sampleIds.userId || "00000000-0000-0000-0000-000000000001")
    .replace(/\{vehicleId\}/g, sampleIds.vehicleId || "00000000-0000-0000-0000-000000000001")
    .replace(/\{serviceType\}/g, sampleIds.serviceType || "RIDE");
}

async function collectSampleIds(token) {
  console.log("\n📊 Collecte des IDs échantillon...\n");

  // 1. Franchise — base de tout le scoping
  const frRes = await request("/v1/admin/franchises?page=1&limit=5", { token });
  const franchises = frRes.json?.items || frRes.json?.franchises || [];
  if (franchises.length > 0) {
    sampleIds.franchiseId = franchises[0].id;

    // 2. Partenaires SCOPÉS à cette franchise (évite les 404 sur /franchises/{id}/partners/{partnerId})
    const frPartnersRes = await request(`/v1/franchises/${sampleIds.franchiseId}/partners?page=1&limit=5`, { token });
    const frPartners = frPartnersRes.json?.items || frPartnersRes.json?.partners || [];
    if (frPartners.length > 0) {
      sampleIds.partnerId = frPartners[0].id;
    }

    // 3. Chauffeurs SCOPÉS à cette franchise
    const frDriversRes = await request(`/v1/franchises/${sampleIds.franchiseId}/drivers?page=1&limit=5`, { token });
    const frDrivers = frDriversRes.json?.items || frDriversRes.json?.drivers || [];
    if (frDrivers.length > 0) {
      sampleIds.driverId = frDrivers[0].id;
    }

    // 4. Commandes SCOPÉES à cette franchise
    const frOrdersRes = await request(`/v1/franchises/${sampleIds.franchiseId}/orders?page=1&limit=5`, { token });
    const frOrders = frOrdersRes.json?.items || frOrdersRes.json?.rides || [];
    if (frOrders.length > 0) {
      sampleIds.orderId = frOrders[0].id;
      sampleIds.serviceType = frOrders[0].service_type || frOrders[0].serviceType || "RIDE";
    }
  }

  // 5. Fallback orderId depuis admin global
  if (!sampleIds.orderId) {
    const ordersRes = await request("/v1/admin/orders?page=1&limit=5", { token });
    const rides = ordersRes.json?.rides || ordersRes.json?.items || [];
    if (rides.length > 0) {
      sampleIds.orderId = rides[0].id;
      sampleIds.serviceType = rides[0].service_type || rides[0].serviceType || "RIDE";
    }
  }

  // 6. userId depuis admin/users
  const usRes = await request("/v1/admin/users?page=1&limit=5", { token });
  const users = usRes.json?.users || usRes.json?.items || [];
  if (users.length > 0) {
    sampleIds.userId = users[0].id;
  }

  // 7. vehicleId depuis admin/vehicles
  const veRes = await request("/v1/admin/vehicles?page=1&limit=10", { token });
  const vehicles = veRes.json?.items || veRes.json?.vehicles || [];
  if (vehicles.length > 0) {
    sampleIds.vehicleId = vehicles[0].id;
  }

  console.log("IDs collectés:", sampleIds);
  console.log("");
}

async function testEndpoint(token, endpoint, sectionName, franchiseToken) {
  // Utiliser le token franchise pour les routes qui l'exigent
  const resolvedToken = franchiseToken && FRANCHISE_ONLY_PREFIXES.some(p => endpoint.path.startsWith(p))
    ? franchiseToken
    : token;
  const fullPath = substitutePath(endpoint.path);
  const result = await request(fullPath, { 
    method: endpoint.method, 
    token: resolvedToken, 
    body: endpoint.body 
  });
  
  const usedFranchiseToken = resolvedToken === franchiseToken;
  const testResult = {
    section: sectionName,
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    fullPath,
    status: result.status,
    ok: result.ok,
    latency: result.latency,
    error: result.error,
    tokenUsed: usedFranchiseToken ? "franchise" : "admin",
    hasData: result.json && (Array.isArray(result.json) ? result.json.length > 0 : Object.keys(result.json).length > 0),
    dataKeys: result.json ? Object.keys(result.json).slice(0, 10) : [],
    sample: result.json ? JSON.stringify(result.json).slice(0, 150) : null
  };
  
  if (result.ok) {
    if (testResult.hasData) {
      results.ok.push(testResult);
    } else {
      results.partial.push({ ...testResult, reason: "Réponse vide ou sans données" });
    }
  } else if (result.status === 404) {
    results.missing.push({ ...testResult, reason: "Endpoint non trouvé (404)" });
  } else if (result.status === 501) {
    results.missing.push({ ...testResult, reason: "Non implémenté (501)" });
  } else if (result.status === 500) {
    results.bugs.push({ ...testResult, reason: "Erreur serveur (500) - BUG" });
  } else if (result.status === 403) {
    results.partial.push({ ...testResult, reason: "Accès interdit (403) - problème de permissions" });
  } else if (result.status === 401) {
    results.failed.push({ ...testResult, reason: "Non authentifié (401)" });
  } else {
    results.failed.push({ ...testResult, reason: `Erreur ${result.status}: ${result.error}` });
  }
  
  if (result.ok && result.json) {
    const data = result.json;
    const items = data.items || data.data || data.results || data;
    if (Array.isArray(items) && items.length === 0) {
      results.dataIssues.push({
        ...testResult,
        reason: "Liste vide retournée (pas de données en base)"
      });
    }
  }
  
  return testResult;
}

function printResult(test) {
  const icon = test.ok ? "✅" : test.status === 404 ? "❌" : test.status === 500 ? "🐛" : "⚠️";
  const statusStr = test.status === 0 ? "NETWORK" : String(test.status);
  const tokenTag = test.tokenUsed === "franchise" ? " [🔑franchise]" : " [🔑admin]";
  console.log(`${icon} [${test.method}] ${test.name}${tokenTag}`);
  console.log(`   Path: ${test.path}`);
  console.log(`   Status: ${statusStr} (${test.latency}ms)`);
  if (test.error) {
    console.log(`   Error: ${test.error.slice(0, 100)}`);
  }
  if (test.reason && !test.ok) {
    console.log(`   Note: ${test.reason}`);
  }
  console.log("");
}

function generateReport(portal, section) {
  const now = new Date().toISOString();
  const totalTests = results.ok.length + results.partial.length + results.failed.length + results.missing.length;
  
  let report = `# Rapport de Test - ${portal.toUpperCase()}${section ? ` / ${section}` : ""}\n\n`;
  report += `**Date:** ${now}\n`;
  report += `**API:** ${API_URL}\n`;
  report += `**Compte admin:** ${EMAIL}\n`;
  report += `**Compte franchise:** ${FRANCHISE_EMAIL}\n`;
  report += `**Total tests:** ${totalTests}\n\n`;
  
  report += `## Résumé\n\n`;
  report += `- ✅ **Fonctionne:** ${results.ok.length}\n`;
  report += `- ⚠️ **Partiel:** ${results.partial.length}\n`;
  report += `- ❌ **Manquant:** ${results.missing.length}\n`;
  report += `- 🐛 **Bugs:** ${results.bugs.length}\n`;
  report += `- ⚠️ **Échecs:** ${results.failed.length}\n`;
  report += `- 📊 **Données:** ${results.dataIssues.length}\n\n`;
  
  const addSection = (title, items, icon) => {
    if (items.length === 0) return "";
    let s = `## ${icon} ${title} (${items.length})\n\n`;
    for (const test of items) {
      s += `### ${test.name}\n`;
      s += `- **Endpoint:** \`${test.method} ${test.path}\`\n`;
      s += `- **Status:** ${test.status}\n`;
      s += `- **Token:** ${test.tokenUsed ?? "admin"}\n`;
      if (test.reason) s += `- **Problème:** ${test.reason}\n`;
      if (test.sample) s += `- **Réponse:** \`${test.sample}\`\n`;
      s += `\n`;
    }
    return s;
  };
  
  report += addSection("Fonctionne correctement", results.ok, "✅");
  report += addSection("Fonctionnel mais incomplet", results.partial, "⚠️");
  report += addSection("Endpoints manquants", results.missing, "❌");
  report += addSection("Bugs détectés", results.bugs, "🐛");
  report += addSection("Échecs", results.failed, "⚠️");
  report += addSection("Problèmes de données", results.dataIssues, "📊");
  
  if (results.bugs.length > 0) {
    report += `## Priorité: Bugs à corriger\n\n`;
    for (const test of results.bugs) {
      report += `- Corriger 500 sur \`${test.path}\` (${test.name})\n`;
    }
    report += `\n`;
  }
  
  if (results.missing.length > 0) {
    report += `## À implémenter\n\n`;
    for (const test of results.missing) {
      report += `- Implémenter \`${test.path}\` (${test.name})\n`;
    }
    report += `\n`;
  }
  
  return report;
}

async function main() {
  const args = process.argv.slice(2);
  const portal = args[0]?.toLowerCase();
  const section = args[1]?.toLowerCase();
  
  if (!portal || !["admin", "franchise", "partner", "dispatch"].includes(portal)) {
    console.error("Usage: node scripts/test-tab-features.mjs <portail> [section]");
    console.error("Portails: admin, franchise, partner, dispatch");
    console.error("\nSections:");
    for (const [p, sections] of Object.entries(TAB_ENDPOINTS)) {
      console.error(`  ${p}: ${Object.keys(sections).join(", ")}`);
    }
    process.exit(1);
  }
  
  const portalSections = TAB_ENDPOINTS[portal];
  if (section && !portalSections[section]) {
    console.error(`Section "${section}" non trouvée pour ${portal}`);
    console.error(`Disponibles: ${Object.keys(portalSections).join(", ")}`);
    process.exit(1);
  }
  
  console.log(`\n🚀 Test de ${portal.toUpperCase()}${section ? ` / ${section}` : ""} - ${API_URL}\n`);
  
  // Login admin
  const login = await request("/v1/auth/login", {
    method: "POST",
    body: { email: EMAIL, password: PASSWORD },
  });
  const token = login.json?.accessToken ?? login.json?.session?.access_token ?? null;
  if (!token) {
    console.error("❌ Login admin failed", login.status, login.json);
    process.exit(1);
  }
  console.log(`✅ Authentifié (admin: ${EMAIL})`);

  // Login franchise
  let franchiseToken = null;
  const franchiseLogin = await request("/v1/auth/franchise/login", {
    method: "POST",
    body: { email: FRANCHISE_EMAIL, password: FRANCHISE_PASSWORD },
  });
  franchiseToken = franchiseLogin.json?.accessToken ?? franchiseLogin.json?.session?.access_token ?? null;
  if (franchiseToken) {
    const franchiseId = franchiseLogin.json?.franchise?.id ?? franchiseLogin.json?.franchiseId ?? "?";
    console.log(`✅ Authentifié (franchise: ${FRANCHISE_EMAIL} — id: ${franchiseId})`);
  } else {
    console.warn(`⚠️  Login franchise échoué (${franchiseLogin.status}) — les routes /v1/franchise/* utiliseront le token admin`);
  }
  console.log("");
  
  // Collecter IDs échantillon
  await collectSampleIds(token);
  
  // Exécuter les tests
  const sectionsToTest = section ? { [section]: portalSections[section] } : portalSections;
  
  for (const [sectionName, sectionData] of Object.entries(sectionsToTest)) {
    console.log(`\n📁 ${sectionData.label}\n${"=".repeat(40)}`);
    
    for (const endpoint of sectionData.paths) {
      await testEndpoint(token, endpoint, sectionName, franchiseToken);
    }
  }
  
  // Afficher résultats
  console.log("\n\n" + "=".repeat(60));
  console.log("📊 RÉSULTATS");
  console.log("=".repeat(60) + "\n");
  
  const total = results.ok.length + results.partial.length + results.failed.length + results.missing.length + results.bugs.length;
  
  console.log(`✅ Fonctionne:        ${results.ok.length}/${total}`);
  console.log(`⚠️  Partiel:           ${results.partial.length}/${total}`);
  console.log(`❌ Manquant:          ${results.missing.length}/${total}`);
  console.log(`🐛 Bugs (500):        ${results.bugs.length}/${total}`);
  console.log(`⚠️  Échecs:            ${results.failed.length}/${total}`);
  console.log(`📊 Problèmes données: ${results.dataIssues.length}/${total}\n`);
  
  // Détails par catégorie
  if (results.bugs.length > 0) {
    console.log("\n🐛 BUGS À CORRIGER:");
    console.log("-".repeat(40));
    for (const test of results.bugs) printResult(test);
  }
  
  if (results.missing.length > 0) {
    console.log("\n❌ ENDPOINTS MANQUANTS:");
    console.log("-".repeat(40));
    for (const test of results.missing) printResult(test);
  }
  
  if (results.dataIssues.length > 0) {
    console.log("\n📊 DONNÉES MANQUANTES EN BASE:");
    console.log("-".repeat(40));
    for (const test of results.dataIssues) printResult(test);
  }
  
  // Générer et sauvegarder rapport
  const report = generateReport(portal, section);
  
  if (REPORT_FILE) {
    const reportPath = path.isAbsolute(REPORT_FILE) ? REPORT_FILE : path.join(PROJECT_ROOT, REPORT_FILE);
    fs.writeFileSync(reportPath, report);
    console.log(`\n📝 Rapport sauvegardé: ${reportPath}\n`);
  } else {
    const defaultReportFile = `test-report-${portal}${section ? `-${section}` : ""}-${Date.now()}.md`;
    const reportPath = path.join(PROJECT_ROOT, defaultReportFile);
    fs.writeFileSync(reportPath, report);
    console.log(`\n📝 Rapport sauvegardé: ${reportPath}\n`);
  }
  
  console.log("✅ Test terminé\n");
}

main().catch(console.error);

