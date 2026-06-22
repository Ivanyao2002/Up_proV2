/**
 * Audit complet du Portail Partenaire
 *
 * Teste toutes les pages, menus, filtres, pagination, et détecte :
 *   - Pages qui crashent (erreur JS, spinner infini, "introuvable")
 *   - APIs qui retournent 4xx/5xx
 *   - Éléments UI manquants (tableaux vides alors que données attendues, etc.)
 *   - Filtres / pagination non fonctionnels
 *   - Améliorations suggérées
 *
 * Usage :
 *   node scripts/audit-portal-partner.mjs
 *   BASE_URL=http://localhost:3000 node scripts/audit-portal-partner.mjs
 *
 * Variables d'environnement :
 *   BASE_URL        (défaut http://localhost:3000)
 *   PARTNER_EMAIL   (défaut dev.partner@upjunoo-dev.tech)
 *   PARTNER_PASSWORD(défaut Upjunoo@Dev2026!)
 *   CHROME_PATH     (détecté automatiquement)
 *   HEADLESS        (défaut "true" — mettre "false" pour voir le navigateur)
 *   OUT_DIR         (défaut scripts/audit-results/)
 */

import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const BASE_URL   = process.env.BASE_URL       ?? "http://localhost:3000";
const EMAIL      = process.env.PARTNER_EMAIL   ?? "dev.partner@upjunoo-dev.tech";
const PASSWORD   = process.env.PARTNER_PASSWORD ?? "Upjunoo@Dev2026!";
const HEADLESS   = process.env.HEADLESS !== "false";
const OUT_DIR    = process.env.OUT_DIR
  ? path.resolve(process.env.OUT_DIR)
  : path.resolve(__dirname, "audit-results");

function resolveChromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA ?? "", "Google\\Chrome\\Application\\chrome.exe"),
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  return candidates.find((p) => p && fs.existsSync(p)) ?? candidates[0];
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const SHOTS_DIR = path.join(OUT_DIR, "screenshots");
fs.mkdirSync(SHOTS_DIR, { recursive: true });

// ─── Résultats globaux ────────────────────────────────────────────────────────
const results = {
  summary: { ok: 0, warn: 0, error: 0, total: 0 },
  pages: [],
  apiErrors: [],
  improvements: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function log(level, msg) {
  const icon = level === "ok" ? "✅" : level === "warn" ? "⚠️ " : "❌";
  console.log(`${icon} ${msg}`);
}

function addResult(page, status, checks, shot = null) {
  results.pages.push({ page, status, checks, screenshot: shot });
  results.summary[status]++;
  results.summary.total++;
}

async function screenshot(page, name) {
  const file = path.join(SHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

async function waitForStable(page, timeout = 8000) {
  await page.waitForFunction(
    () => !document.querySelector('[data-loading="true"], .animate-pulse:not([data-ok])'),
    { timeout }
  ).catch(() => {});
  await new Promise(r => setTimeout(r, 600));
}

async function getConsoleErrors(page) {
  const errors = [];
  page.on("console", msg => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

async function collectApiErrors(page) {
  const apiErrs = [];
  page.on("response", res => {
    const url = res.url();
    const status = res.status();
    if (url.includes("/upjunoo-api/") && status >= 400) {
      apiErrs.push({ url: url.replace(BASE_URL, ""), status });
    }
  });
  return apiErrs;
}

async function hasText(page, text) {
  return page.evaluate(t =>
    !!document.body?.innerText?.includes(t), text
  );
}

async function hasSelector(page, sel) {
  return page.evaluate(s =>
    !!document.querySelector(s), sel
  );
}

async function getTableRowCount(page) {
  return page.evaluate(() => {
    const rows = document.querySelectorAll("tbody tr");
    return rows.length;
  });
}

async function navigate(page, url, label) {
  const consoleErrors = [];
  const apiErrors = [];
  const handler = msg => { if (msg.type() === "error") consoleErrors.push(msg.text()); };
  const resHandler = res => {
    const u = res.url();
    const s = res.status();
    if (u.includes("/upjunoo-api/") && s >= 400) {
      apiErrors.push({ url: u.replace(BASE_URL, ""), status: s });
    }
  };
  page.on("console", handler);
  page.on("response", resHandler);

  await page.goto(`${BASE_URL}${url}`, { waitUntil: "networkidle2", timeout: 20000 })
    .catch(() => {});
  await waitForStable(page);

  page.off("console", handler);
  page.off("response", resHandler);

  return { consoleErrors, apiErrors };
}

// ─── Login ────────────────────────────────────────────────────────────────────
async function login(page) {
  console.log("\n🔐 Connexion...");
  await page.goto(`${BASE_URL}/partner/login`, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 800));

  async function setField(selector, value) {
    const el = await page.$(selector);
    if (!el) return;
    await el.click();
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await page.$eval(selector, node => { node.value = ""; });
    await el.type(value, { delay: 25 });
  }

  await setField('input[type="email"]', EMAIL);
  await setField('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');

  const deadline = Date.now() + 20000;
  let url = page.url();
  while (Date.now() < deadline && url.includes("/login")) {
    await new Promise(r => setTimeout(r, 500));
    url = page.url();
  }

  if (url.includes("/login")) {
    await page.screenshot({ path: path.join(OUT_DIR, "_login-error.png") }).catch(() => {});
    throw new Error(`Login échoué — toujours sur ${url}`);
  }
  await new Promise(r => setTimeout(r, 1500));
  console.log(`   → Connecté (${url})`);
}

// ─── Tests par page ───────────────────────────────────────────────────────────

async function testPage(page, { path: pagePath, label, checks }) {
  console.log(`\n📄 ${label} (${pagePath})`);
  const { consoleErrors, apiErrors } = await navigate(page, pagePath, label);

  const pageChecks = [];
  let worst = "ok";

  const setStatus = (s) => {
    if (s === "error") worst = "error";
    else if (s === "warn" && worst !== "error") worst = "warn";
  };

  // Vérifier crash / page vide
  const crashed = await hasText(page, "introuvable") || await hasText(page, "Something went wrong");
  if (crashed) {
    pageChecks.push({ check: "Page crash / 404", status: "error", detail: "Texte d'erreur détecté" });
    setStatus("error");
  } else {
    pageChecks.push({ check: "Page charge sans crash", status: "ok" });
  }

  // API errors
  if (apiErrors.length) {
    for (const e of apiErrors) {
      pageChecks.push({ check: `API ${e.status}`, status: e.status >= 500 ? "error" : "warn", detail: e.url });
      setStatus(e.status >= 500 ? "error" : "warn");
      if (!results.apiErrors.find(x => x.url === e.url)) results.apiErrors.push(e);
    }
  }

  // Console errors (filtrer les erreurs non-critiques)
  const criticalConsole = consoleErrors.filter(e =>
    !e.includes("favicon") &&
    !e.includes("Mapbox") &&
    !e.includes("mapbox") &&
    !e.includes("net::ERR_") &&
    !e.includes("Failed to load resource")
  );
  if (criticalConsole.length) {
    pageChecks.push({ check: "Erreurs console JS", status: "warn", detail: criticalConsole.slice(0, 3).join(" | ") });
    setStatus("warn");
  }

  // Checks spécifiques à la page
  for (const c of (checks ?? [])) {
    const result = await c(page);
    pageChecks.push(result);
    setStatus(result.status);
  }

  const shot = await screenshot(page, label.replace(/[^a-z0-9]/gi, "_").toLowerCase());
  addResult(`${label} (${pagePath})`, worst, pageChecks, path.basename(shot));

  const icon = worst === "ok" ? "✅" : worst === "warn" ? "⚠️ " : "❌";
  console.log(`   ${icon} ${worst.toUpperCase()} — ${pageChecks.length} checks`);
  pageChecks.filter(c => c.status !== "ok").forEach(c =>
    console.log(`      └─ ${c.status === "error" ? "❌" : "⚠️ "} ${c.check}${c.detail ? ": " + c.detail : ""}`)
  );
}

// ─── Checks réutilisables ─────────────────────────────────────────────────────

const checkTableLoads = async (page) => {
  const rows = await getTableRowCount(page);
  const hasEmpty = await hasText(page, "Aucun") || await hasText(page, "aucune");
  return {
    check: "Tableau de données",
    status: rows > 0 ? "ok" : "warn",
    detail: rows > 0 ? `${rows} ligne(s)` : hasEmpty ? "Vide (message 'Aucun' affiché)" : "0 ligne, pas de message vide",
  };
};

const checkFiltersExist = (filterTexts) => async (page) => {
  const found = [];
  const missing = [];
  for (const t of filterTexts) {
    const has = await hasText(page, t) || await hasSelector(page, `[placeholder*="${t}" i]`);
    if (has) found.push(t); else missing.push(t);
  }
  return {
    check: "Filtres présents",
    status: missing.length === 0 ? "ok" : "warn",
    detail: missing.length ? `Absents: ${missing.join(", ")}` : found.join(", "),
  };
};

const checkPaginationExists = async (page) => {
  const has = await hasSelector(page, 'button[aria-label*="page" i], nav[aria-label*="pagination" i], [data-pagination], button:has-text("Suivant"), button:has-text("Précédent")')
    .catch(() => false);
  const hasNext = await page.evaluate(() =>
    !!Array.from(document.querySelectorAll("button")).find(b =>
      b.textContent?.trim().match(/suivant|next|›|»/i)
    )
  );
  return {
    check: "Pagination",
    status: hasNext ? "ok" : "warn",
    detail: hasNext ? "Bouton suivant présent" : "Pas de pagination détectée (données peut-être < 1 page)",
  };
};

const checkKpiCards = async (page) => {
  const count = await page.evaluate(() =>
    document.querySelectorAll('[class*="kpi"], [class*="stat-card"], [class*="KpiCard"]').length
  );
  const hasNull = await hasText(page, "null");
  return {
    check: "KPI Cards",
    status: hasNull ? "error" : count > 0 ? "ok" : "warn",
    detail: hasNull ? "Valeur 'null' affichée dans un KPI" : `${count} card(s) détectée(s)`,
  };
};

const checkNoNullValues = async (page) => {
  const hasNull = await hasText(page, "null");
  const hasUndefined = await page.evaluate(() =>
    document.body.innerText.includes("undefined")
  );
  return {
    check: "Pas de valeurs null/undefined affichées",
    status: (hasNull || hasUndefined) ? "error" : "ok",
    detail: hasNull ? "'null' détecté dans le DOM" : hasUndefined ? "'undefined' détecté" : "OK",
  };
};

const checkDetailLink = (linkSel) => async (page) => {
  const href = await page.evaluate(sel => {
    const el = document.querySelector(sel);
    return el?.getAttribute("href") ?? el?.closest("a")?.getAttribute("href") ?? null;
  }, linkSel);
  return {
    check: "Lien vers page détail",
    status: href ? "ok" : "warn",
    detail: href ? `→ ${href}` : "Aucun lien trouvé",
  };
};

const checkFormInputs = (labels) => async (page) => {
  const missing = [];
  for (const label of labels) {
    const has = await page.evaluate(l =>
      !!Array.from(document.querySelectorAll("label, [placeholder], input, textarea, select"))
        .find(el => el.textContent?.includes(l) || el.placeholder?.includes(l)),
      label
    );
    if (!has) missing.push(label);
  }
  return {
    check: "Champs de formulaire",
    status: missing.length === 0 ? "ok" : "warn",
    detail: missing.length ? `Absents: ${missing.join(", ")}` : "Tous présents",
  };
};

// ─── Définition de toutes les pages à tester ──────────────────────────────────

const PAGES_TO_TEST = [
  // ── Dashboard ──
  {
    path: "/partner/dashboard",
    label: "Dashboard",
    checks: [
      checkKpiCards,
      checkNoNullValues,
      async (page) => {
        const hasChart = await hasSelector(page, "canvas, svg[class*='chart'], [class*='Chart']");
        return { check: "Graphique flux", status: hasChart ? "ok" : "warn", detail: hasChart ? "Présent" : "Absent" };
      },
    ],
  },

  // ── Courses / Orders ──
  {
    path: "/partner/orders",
    label: "Courses (Orders)",
    checks: [
      checkTableLoads,
      checkNoNullValues,
      checkFiltersExist(["Statut", "Recherche", "Date"]),
      checkPaginationExists,
      async (page) => {
        const hasPaymentCol = await hasText(page, "Paiement") || await hasText(page, "payment");
        return { check: "Colonne Paiement", status: hasPaymentCol ? "ok" : "warn", detail: hasPaymentCol ? "Présente" : "Absente (PA-TRIPS manquant)" };
      },
      async (page) => {
        const hasClientCol = await hasText(page, "Client");
        return { check: "Colonne Client", status: hasClientCol ? "ok" : "warn", detail: hasClientCol ? "Présente" : "Absente (PA-TRIPS manquant)" };
      },
    ],
  },

  // ── Bookings ──
  {
    path: "/partner/bookings",
    label: "Réservations (Bookings)",
    checks: [
      checkTableLoads,
      checkNoNullValues,
      checkFiltersExist(["Statut", "Recherche"]),
      checkPaginationExists,
    ],
  },
  {
    path: "/partner/bookings/new",
    label: "Nouvelle réservation",
    checks: [
      checkNoNullValues,
      checkFormInputs(["Client", "Départ", "Destination"]),
    ],
  },
  {
    path: "/partner/bookings/recurring",
    label: "Réservations récurrentes",
    checks: [checkTableLoads, checkNoNullValues],
  },

  // ── Chauffeurs ──
  {
    path: "/partner/drivers",
    label: "Liste chauffeurs",
    checks: [
      checkTableLoads,
      checkNoNullValues,
      checkFiltersExist(["Statut", "Recherche"]),
      checkPaginationExists,
      async (page) => {
        const hasName = await page.evaluate(() => {
          const rows = document.querySelectorAll("tbody tr");
          if (!rows.length) return null;
          const text = rows[0]?.innerText ?? "";
          return text.includes("null") ? false : true;
        });
        return {
          check: "Noms chauffeurs affichés",
          status: hasName === false ? "error" : hasName === null ? "warn" : "ok",
          detail: hasName === false ? "'null' dans une ligne" : hasName === null ? "Tableau vide" : "OK",
        };
      },
    ],
  },
  {
    path: "/partner/drivers/pending",
    label: "Chauffeurs en attente",
    checks: [checkTableLoads, checkNoNullValues],
  },
  {
    path: "/partner/drivers/new",
    label: "Nouveau chauffeur",
    checks: [
      checkNoNullValues,
      checkFormInputs(["Prénom", "Nom", "Téléphone"]),
    ],
  },

  // ── Flotte / Véhicules ──
  {
    path: "/partner/fleet",
    label: "Liste véhicules",
    checks: [
      checkTableLoads,
      checkNoNullValues,
      checkFiltersExist(["Statut", "Recherche"]),
      checkPaginationExists,
    ],
  },
  {
    path: "/partner/fleet/pending",
    label: "Véhicules en attente",
    checks: [checkTableLoads, checkNoNullValues],
  },
  {
    path: "/partner/fleet/new",
    label: "Nouveau véhicule",
    checks: [
      checkNoNullValues,
      checkFormInputs(["Plaque", "Marque", "Modèle"]),
    ],
  },

  // ── Performances ──
  {
    path: "/partner/performance",
    label: "Performances",
    checks: [
      checkTableLoads,
      checkNoNullValues,
      checkKpiCards,
      async (page) => {
        const hasTabs = await hasText(page, "Véhicules") && await hasText(page, "Chauffeurs");
        return { check: "Onglets Véhicules/Chauffeurs", status: hasTabs ? "ok" : "warn", detail: hasTabs ? "Présents" : "Absents" };
      },
      async (page) => {
        const hasMetrics = await hasText(page, "Courses") || await hasText(page, "Revenue") || await hasText(page, "km");
        return { check: "Colonnes métriques", status: hasMetrics ? "ok" : "warn", detail: hasMetrics ? "Présentes" : "Absentes (performance API retourne 0)" };
      },
    ],
  },

  // ── Carte live ──
  {
    path: "/partner/map",
    label: "Carte live flotte",
    checks: [
      checkNoNullValues,
      async (page) => {
        await new Promise(r => setTimeout(r, 2000));
        const hasMap = await hasSelector(page, ".mapboxgl-canvas, canvas, [class*='map']");
        return { check: "Carte Mapbox", status: hasMap ? "ok" : "warn", detail: hasMap ? "Canvas présent" : "Carte non chargée" };
      },
      async (page) => {
        const hasStats = await hasText(page, "En ligne") || await hasText(page, "En course");
        return { check: "Stats live (drivers_online)", status: hasStats ? "ok" : "warn", detail: hasStats ? "Présentes" : "Absentes (PA-MAP-01)" };
      },
    ],
  },

  // ── Portefeuille ──
  {
    path: "/partner/wallet",
    label: "Portefeuille",
    checks: [
      checkNoNullValues,
      checkKpiCards,
      async (page) => {
        const hasBalance = await hasText(page, "FCFA") || await hasText(page, "Solde");
        return { check: "Solde affiché", status: hasBalance ? "ok" : "warn", detail: hasBalance ? "Présent" : "Absent" };
      },
    ],
  },
  {
    path: "/partner/wallet/driver-transfers",
    label: "Wallet — Transferts chauffeurs",
    checks: [
      checkTableLoads,
      checkNoNullValues,
      checkPaginationExists,
      async (page) => {
        const hasDriverName = await page.evaluate(() => {
          const cells = document.querySelectorAll("tbody td");
          return Array.from(cells).some(c => c.textContent?.match(/^[A-Z][a-z]+ [A-Z]/));
        });
        return {
          check: "Noms chauffeurs dans transferts",
          status: hasDriverName ? "ok" : "warn",
          detail: hasDriverName ? "Noms affichés" : "Noms absents (PA-DTRANS-02 — metadata.driverName null)",
        };
      },
      async (page) => {
        const hasMois = await hasText(page, "mois") || await hasText(page, "Mois");
        const hasZero = await page.evaluate(() => {
          const els = Array.from(document.querySelectorAll('[class*="kpi"], [class*="card"]'));
          return els.some(el => el.textContent?.includes("0 FCFA") && el.textContent?.includes("mois"));
        });
        return {
          check: "KPI 'Ce mois'",
          status: hasZero ? "warn" : hasMois ? "ok" : "warn",
          detail: hasZero ? "Affiche 0 FCFA (PA-DTRANS-03 — monthAmountXof absent)" : hasMois ? "Présent" : "Absent",
        };
      },
    ],
  },
  {
    path: "/partner/wallet/ledger",
    label: "Wallet — Grand livre",
    checks: [checkTableLoads, checkNoNullValues, checkPaginationExists],
  },
  {
    path: "/partner/wallet/revenue",
    label: "Wallet — Revenus",
    checks: [
      checkTableLoads,
      checkNoNullValues,
      async (page) => {
        const isLedger = await hasText(page, "Entrée") || await hasText(page, "Sortie") || await hasText(page, "entry_type");
        return {
          check: "Format revenus (pas ledger)",
          status: isLedger ? "warn" : "ok",
          detail: isLedger ? "Affiche un ledger brut au lieu d'un résumé (PA-P2-10)" : "OK",
        };
      },
    ],
  },
  {
    path: "/partner/wallet/settlements",
    label: "Wallet — Règlements",
    checks: [
      checkNoNullValues,
      async (page) => {
        const has500 = await hasText(page, "500") || await hasText(page, "erreur") || await hasText(page, "Erreur");
        return {
          check: "Pas d'erreur 500",
          status: has500 ? "error" : "ok",
          detail: has500 ? "Erreur 500 visible (PA-P2-9 — column payouts.partner_id)" : "OK",
        };
      },
    ],
  },

  // ── Fret ──
  {
    path: "/partner/freight",
    label: "Fret",
    checks: [checkTableLoads, checkNoNullValues, checkPaginationExists],
  },
  {
    path: "/partner/freight/zones",
    label: "Zones fret",
    checks: [checkNoNullValues],
  },

  // ── Location ──
  {
    path: "/partner/rental",
    label: "Location",
    checks: [checkTableLoads, checkNoNullValues],
  },

  // ── Shifts ──
  {
    path: "/partner/shifts",
    label: "Plannings / Shifts",
    checks: [
      checkTableLoads,
      checkNoNullValues,
      async (page) => {
        const hasCreate = await hasText(page, "Nouveau") || await hasText(page, "Créer") || await hasSelector(page, 'button[class*="primary"]');
        return { check: "Bouton création shift", status: hasCreate ? "ok" : "warn", detail: hasCreate ? "Présent" : "Absent" };
      },
    ],
  },

  // ── Sécurité ──
  {
    path: "/partner/safety",
    label: "Sécurité",
    checks: [checkTableLoads, checkNoNullValues],
  },

  // ── Tracking ──
  {
    path: "/partner/tracking",
    label: "Tracking GPS",
    checks: [checkNoNullValues],
  },

  // ── Membres ──
  {
    path: "/partner/members",
    label: "Membres équipe",
    checks: [checkTableLoads, checkNoNullValues],
  },

  // ── Rapports ──
  {
    path: "/partner/reports",
    label: "Rapports",
    checks: [checkNoNullValues],
  },

  // ── Support ──
  {
    path: "/partner/support",
    label: "Support",
    checks: [checkNoNullValues],
  },
  {
    path: "/partner/support/notifications",
    label: "Support — Notifications",
    checks: [checkTableLoads, checkNoNullValues],
  },

  // ── GPS Devices ──
  {
    path: "/partner/gps-devices",
    label: "Boîtiers GPS",
    checks: [checkTableLoads, checkNoNullValues],
  },

  // ── Profil ──
  {
    path: "/partner/profile",
    label: "Profil partenaire",
    checks: [
      checkNoNullValues,
      async (page) => {
        const hasName = await hasText(page, "Partenaire") || await hasText(page, "Nom");
        return { check: "Infos profil", status: hasName ? "ok" : "warn", detail: hasName ? "Présentes" : "Absentes" };
      },
    ],
  },
];

// ─── Test pages de détail (avec ID réel) ─────────────────────────────────────

async function testDetailPages(page) {
  // Driver detail — récupérer le premier lien depuis la liste
  console.log("\n📄 Pages détail (navigation depuis liste)");

  const detailTests = [
    {
      listPath: "/partner/drivers",
      linkSel: 'tbody tr:first-child a[href*="/partner/drivers/"]',
      label: "Détail chauffeur",
      checks: [
        checkKpiCards,
        checkNoNullValues,
        async (p) => {
          const hasTabs = await hasText(p, "Aperçu") && await hasText(p, "Documents");
          return { check: "Onglets Aperçu/Documents", status: hasTabs ? "ok" : "warn", detail: hasTabs ? "Présents" : "Absents" };
        },
        async (p) => {
          const hasWallet = await hasText(p, "Portefeuille") || await hasText(p, "FCFA");
          return { check: "Bloc portefeuille", status: hasWallet ? "ok" : "warn", detail: hasWallet ? "Présent" : "Absent" };
        },
        async (p) => {
          const hasAccept = await hasText(p, "acceptation") || await hasText(p, "Acceptation");
          const hasNull = await hasText(p, "null");
          return {
            check: "KPI Taux d'acceptation",
            status: hasNull ? "error" : hasAccept ? "warn" : "warn",
            detail: hasNull ? "'null %' affiché — bug front corrigé, API null" : hasAccept ? "Affiché (valeur API null → '—')" : "Non trouvé",
          };
        },
      ],
    },
    {
      listPath: "/partner/fleet",
      linkSel: 'tbody tr:first-child a[href*="/partner/fleet/"]',
      label: "Détail véhicule",
      checks: [checkNoNullValues, checkKpiCards],
    },
    {
      listPath: "/partner/orders",
      linkSel: 'tbody tr:first-child a[href*="/partner/orders/"]',
      label: "Détail course",
      checks: [checkNoNullValues],
    },
    {
      listPath: "/partner/bookings",
      linkSel: 'tbody tr:first-child a[href*="/partner/bookings/"]',
      label: "Détail réservation",
      checks: [checkNoNullValues],
    },
  ];

  for (const dt of detailTests) {
    const { consoleErrors, apiErrors } = await navigate(page, dt.listPath, dt.label);
    await waitForStable(page);

    const href = await page.evaluate(sel => {
      const el = document.querySelector(sel);
      return el?.getAttribute("href") ?? null;
    }, dt.linkSel);

    if (!href) {
      console.log(`   ⚠️  ${dt.label} — aucun lien trouvé dans la liste (table vide?)`);
      addResult(`${dt.label} (détail)`, "warn", [{ check: "Lien détail", status: "warn", detail: "Aucune ligne dans le tableau" }]);
      continue;
    }

    const { consoleErrors: c2, apiErrors: a2 } = await navigate(page, href, dt.label);
    const allApiErrors = [...apiErrors, ...a2];
    const allConsoleErrors = [...consoleErrors, ...c2].filter(e =>
      !e.includes("favicon") && !e.includes("Mapbox") && !e.includes("mapbox")
    );

    const pageChecks = [];
    let worst = "ok";
    const setStatus = s => {
      if (s === "error") worst = "error";
      else if (s === "warn" && worst !== "error") worst = "warn";
    };

    for (const ae of allApiErrors) {
      pageChecks.push({ check: `API ${ae.status}`, status: ae.status >= 500 ? "error" : "warn", detail: ae.url });
      setStatus(ae.status >= 500 ? "error" : "warn");
    }
    if (allConsoleErrors.length) {
      pageChecks.push({ check: "Console JS errors", status: "warn", detail: allConsoleErrors.slice(0, 2).join(" | ") });
      setStatus("warn");
    }

    for (const c of (dt.checks ?? [])) {
      const r = await c(page);
      pageChecks.push(r);
      setStatus(r.status);
    }

    const shot = await screenshot(page, `detail_${dt.label.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`);
    addResult(`${dt.label} (${href})`, worst, pageChecks, path.basename(shot));
    const icon = worst === "ok" ? "✅" : worst === "warn" ? "⚠️ " : "❌";
    console.log(`   ${icon} ${dt.label} → ${href}`);
    pageChecks.filter(c => c.status !== "ok").forEach(c =>
      console.log(`      └─ ${c.status === "error" ? "❌" : "⚠️ "} ${c.check}${c.detail ? ": " + c.detail : ""}`)
    );
  }
}

// ─── Test filtres interactifs ─────────────────────────────────────────────────

async function testFilters(page) {
  console.log("\n🔍 Test filtres interactifs");

  const filterTests = [
    {
      path: "/partner/drivers",
      label: "Filtre chauffeurs — Statut",
      action: async (p) => {
        const sel = await p.$('select, [role="combobox"]');
        if (!sel) return { check: "Filtre statut", status: "warn", detail: "Sélecteur non trouvé" };
        await sel.click();
        await new Promise(r => setTimeout(r, 500));
        const options = await p.evaluate(() =>
          Array.from(document.querySelectorAll('[role="option"], option')).map(o => o.textContent?.trim())
        );
        return { check: "Filtre statut — options", status: options.length > 1 ? "ok" : "warn", detail: options.slice(0, 4).join(", ") };
      },
    },
    {
      path: "/partner/orders",
      label: "Filtre courses — Recherche texte",
      action: async (p) => {
        const input = await p.$('input[type="search"], input[placeholder*="echerche" i], input[placeholder*="iltrer" i]');
        if (!input) return { check: "Champ recherche", status: "warn", detail: "Non trouvé" };
        await input.type("test", { delay: 50 });
        await new Promise(r => setTimeout(r, 800));
        const rows = await getTableRowCount(p);
        await input.click({ clickCount: 3 });
        await p.keyboard.press("Backspace");
        return { check: "Champ recherche", status: "ok", detail: `Filtre actif — ${rows} résultat(s)` };
      },
    },
    {
      path: "/partner/fleet",
      label: "Filtre flotte — Statut",
      action: async (p) => {
        const buttons = await p.evaluate(() =>
          Array.from(document.querySelectorAll('button')).filter(b => b.textContent?.match(/Tous|Approuvé|En attente|Actif/i)).map(b => b.textContent?.trim())
        );
        return { check: "Boutons filtre statut", status: buttons.length > 0 ? "ok" : "warn", detail: buttons.join(", ") || "Absents" };
      },
    },
  ];

  for (const ft of filterTests) {
    await navigate(page, ft.path, ft.label);
    await waitForStable(page);
    const result = await ft.action(page);
    console.log(`   ${result.status === "ok" ? "✅" : "⚠️ "} ${ft.label}: ${result.detail}`);
    addResult(ft.label, result.status, [result]);
  }
}

// ─── Suggestions d'amélioration ───────────────────────────────────────────────

function buildImprovements() {
  const improvements = [
    { priority: "P1", category: "Bug front", item: "Taux d'acceptation affiche 'null %' si acceptance_rate_pct=null — corriger l'affichage en '—'" },
    { priority: "P1", category: "Bug front", item: "Soldes 'Retirable / Service' affichent '0 FCFA' si wallet absent de l'API — masquer si null" },
    { priority: "P1", category: "Bug API", item: "GET /wallet/settlements → HTTP 500 (column payouts.partner_id)" },
    { priority: "P1", category: "Bug API", item: "GET /wallet/driver-transfers retourne entrées mixtes (ride_commission, etc.) — filtrer backend" },
    { priority: "P2", category: "Données manquantes", item: "Driver detail — vehicle.brand/model absents (brand_id/model_id non résolus)" },
    { priority: "P2", category: "Données manquantes", item: "Driver detail — wallet.withdrawable_balance_xof absent" },
    { priority: "P2", category: "Données manquantes", item: "Driver performance — métriques à 0 (calcul non implémenté)" },
    { priority: "P2", category: "Données manquantes", item: "Vehicle performance — brand/model null" },
    { priority: "P2", category: "Données manquantes", item: "Driver transfers — metadata.driverName absent → ID affiché à la place du nom" },
    { priority: "P2", category: "Données manquantes", item: "Driver transfers stats — monthTransfers/monthAmountXof absents → KPI 'Ce mois' à 0" },
    { priority: "P2", category: "Carte live", item: "drivers[].location absent → tous les chauffeurs superposés au centre" },
    { priority: "P2", category: "Carte live", item: "Socket.io temps réel absent → refresh HTTP uniquement" },
    { priority: "P3", category: "UX amélioration", item: "Ajouter export CSV sur toutes les pages avec DataTable" },
    { priority: "P3", category: "UX amélioration", item: "Ajouter filtre 'période' sur les pages de performance" },
    { priority: "P3", category: "UX amélioration", item: "Ajouter indicateur temps réel (badge 'Live') sur la carte" },
    { priority: "P3", category: "UX amélioration", item: "Ajouter résumé KPI en haut des pages courses/chauffeurs/véhicules" },
    { priority: "P3", category: "UX amélioration", item: "Permettre le tri des colonnes dans tous les DataTable" },
    { priority: "P3", category: "UX amélioration", item: "Ajouter skeleton loader sur les KPI cards (éviter le flash '0')" },
  ];
  return improvements;
}

// ─── Génération du rapport HTML ───────────────────────────────────────────────

function generateReport() {
  const improvements = buildImprovements();
  const date = new Date().toLocaleString("fr-FR");

  const statusBadge = s =>
    s === "ok"    ? `<span style="background:#10b98120;color:#059669;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600">✅ OK</span>` :
    s === "warn"  ? `<span style="background:#f5930020;color:#d97706;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600">⚠️ WARN</span>` :
                    `<span style="background:#ef444420;color:#dc2626;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600">❌ ERROR</span>`;

  const priBadge = p =>
    p === "P1" ? `<span style="background:#ef444420;color:#dc2626;padding:1px 6px;border-radius:4px;font-size:11px;font-weight:700">P1</span>` :
    p === "P2" ? `<span style="background:#f5930020;color:#d97706;padding:1px 6px;border-radius:4px;font-size:11px;font-weight:700">P2</span>` :
                 `<span style="background:#6b728020;color:#4b5563;padding:1px 6px;border-radius:4px;font-size:11px;font-weight:700">P3</span>`;

  const pagesHtml = results.pages.map(p => `
    <tr>
      <td style="padding:10px 12px;font-weight:500;color:#1e293b">${p.page}</td>
      <td style="padding:10px 12px;text-align:center">${statusBadge(p.status)}</td>
      <td style="padding:10px 12px">
        ${p.checks.filter(c => c.status !== "ok").map(c => `
          <div style="font-size:12px;color:${c.status==="error"?"#dc2626":"#d97706"};margin:1px 0">
            ${c.status==="error"?"❌":"⚠️"} <strong>${c.check}</strong>${c.detail ? ` — ${c.detail}` : ""}
          </div>`).join("") || '<span style="font-size:12px;color:#6b7280">Tous les checks OK</span>'}
      </td>
      ${p.screenshot ? `<td style="padding:10px 12px"><a href="screenshots/${p.screenshot}" style="font-size:11px;color:#0ea5e9" target="_blank">📸 voir</a></td>` : "<td></td>"}
    </tr>`).join("");

  const apiHtml = results.apiErrors.length
    ? results.apiErrors.map(e => `
      <tr>
        <td style="padding:8px 12px;font-family:monospace;font-size:12px;color:#1e293b">${e.url}</td>
        <td style="padding:8px 12px;text-align:center">${statusBadge(e.status >= 500 ? "error" : "warn")}</td>
        <td style="padding:8px 12px;font-weight:700;color:${e.status>=500?"#dc2626":"#d97706"}">${e.status}</td>
      </tr>`).join("")
    : `<tr><td colspan="3" style="padding:16px;text-align:center;color:#6b7280">Aucune erreur API détectée ✅</td></tr>`;

  const improvHtml = improvements.map(i => `
    <tr>
      <td style="padding:8px 12px;text-align:center">${priBadge(i.priority)}</td>
      <td style="padding:8px 12px;font-size:12px;color:#6b7280">${i.category}</td>
      <td style="padding:8px 12px;font-size:13px;color:#1e293b">${i.item}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Audit Portail Partenaire — ${date}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f8fafc; color: #334155; }
  .cover { background: linear-gradient(135deg, #0f2d3d 0%, #134e4a 100%); color: #fff; padding: 60px 48px; }
  .cover h1 { font-size: 32px; font-weight: 800; letter-spacing: -0.5px; }
  .cover .sub { margin-top: 8px; font-size: 16px; opacity: 0.7; }
  .stat-row { display: flex; gap: 16px; margin-top: 32px; flex-wrap: wrap; }
  .stat { background: rgba(255,255,255,0.1); border-radius: 12px; padding: 16px 24px; min-width: 120px; }
  .stat .n { font-size: 32px; font-weight: 800; }
  .stat .l { font-size: 12px; opacity: 0.7; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
  .stat.ok .n { color: #6ee7b7; }
  .stat.warn .n { color: #fcd34d; }
  .stat.err .n { color: #fca5a5; }
  .content { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
  h2 { font-size: 20px; font-weight: 700; color: #0f172a; margin: 40px 0 16px; border-left: 4px solid #0d9488; padding-left: 12px; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
  thead tr { background: #f1f5f9; }
  th { padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
  tbody tr:hover { background: #f8fafc; }
  tbody tr { border-top: 1px solid #f1f5f9; }
  .footer { margin-top: 48px; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; }
</style>
</head>
<body>
<div class="cover">
  <h1>🔍 Audit Portail Partenaire</h1>
  <div class="sub">Généré le ${date} · ${BASE_URL}</div>
  <div class="stat-row">
    <div class="stat ok"><div class="n">${results.summary.ok}</div><div class="l">Pages OK</div></div>
    <div class="stat warn"><div class="n">${results.summary.warn}</div><div class="l">Avertissements</div></div>
    <div class="stat err"><div class="n">${results.summary.error}</div><div class="l">Erreurs</div></div>
    <div class="stat"><div class="n">${results.summary.total}</div><div class="l">Total testé</div></div>
    <div class="stat"><div class="n">${results.apiErrors.length}</div><div class="l">Erreurs API</div></div>
  </div>
</div>

<div class="content">
  <h2>📋 Résultats par page</h2>
  <table>
    <thead><tr><th>Page</th><th>Statut</th><th>Problèmes détectés</th><th>Capture</th></tr></thead>
    <tbody>${pagesHtml}</tbody>
  </table>

  <h2>🔴 Erreurs API détectées</h2>
  <table>
    <thead><tr><th>URL</th><th>Statut</th><th>Code HTTP</th></tr></thead>
    <tbody>${apiHtml}</tbody>
  </table>

  <h2>🚀 Améliorations suggérées</h2>
  <table>
    <thead><tr><th>Priorité</th><th>Catégorie</th><th>Action</th></tr></thead>
    <tbody>${improvHtml}</tbody>
  </table>
</div>
<div class="footer">Audit généré automatiquement · node scripts/audit-portal-partner.mjs</div>
</body>
</html>`;

  const reportPath = path.join(OUT_DIR, "rapport-audit-portail.html");
  fs.writeFileSync(reportPath, html, "utf-8");
  return reportPath;
}

// ─── Génération du rapport JSON ───────────────────────────────────────────────
function saveJson() {
  const jsonPath = path.join(OUT_DIR, "rapport-audit-portail.json");
  fs.writeFileSync(jsonPath, JSON.stringify({ ...results, improvements: buildImprovements() }, null, 2), "utf-8");
  return jsonPath;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═".repeat(60));
  console.log("  AUDIT PORTAIL PARTENAIRE");
  console.log(`  ${BASE_URL}`);
  console.log(`  Résultats → ${OUT_DIR}`);
  console.log("═".repeat(60));

  const browser = await puppeteer.launch({
    executablePath: resolveChromePath(),
    headless: HEADLESS,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--window-size=1440,900"],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  try {
    await login(page);

    // Test toutes les pages
    console.log("\n" + "─".repeat(60));
    console.log("  PHASE 1 — Pages principales");
    console.log("─".repeat(60));
    for (const pageConf of PAGES_TO_TEST) {
      await testPage(page, pageConf);
    }

    // Test pages de détail
    console.log("\n" + "─".repeat(60));
    console.log("  PHASE 2 — Pages détail");
    console.log("─".repeat(60));
    await testDetailPages(page);

    // Test filtres interactifs
    console.log("\n" + "─".repeat(60));
    console.log("  PHASE 3 — Filtres interactifs");
    console.log("─".repeat(60));
    await testFilters(page);

  } catch (err) {
    console.error("\n❌ ERREUR FATALE:", err.message);
  } finally {
    await browser.close();
  }

  // Rapport final
  const htmlPath = generateReport();
  const jsonPath = saveJson();

  console.log("\n" + "═".repeat(60));
  console.log("  RÉSULTATS FINAUX");
  console.log("═".repeat(60));
  console.log(`  ✅ OK      : ${results.summary.ok}`);
  console.log(`  ⚠️  WARN    : ${results.summary.warn}`);
  console.log(`  ❌ ERROR   : ${results.summary.error}`);
  console.log(`  📡 API err : ${results.apiErrors.length}`);
  console.log(`\n  📄 Rapport HTML : ${htmlPath}`);
  console.log(`  📋 Rapport JSON : ${jsonPath}`);
  console.log(`  📸 Captures     : ${SHOTS_DIR}`);
  console.log("═".repeat(60));
}

main().catch(console.error);
