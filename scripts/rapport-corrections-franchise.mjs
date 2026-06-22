#!/usr/bin/env node
/**
 * Rapport de corrections — Portail Franchise
 * Parcourt toutes les pages du portail franchise, détecte les anomalies,
 * capture les screenshots et génère un rapport Markdown.
 *
 * Usage: node scripts/rapport-corrections-franchise.mjs
 * Prérequis: npm run dev sur :3000 + playwright installé (npx playwright install chromium)
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const BASE = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.FRANCHISE_EMAIL ?? "dev.franchise@upjunoo-dev.tech";
const PASSWORD = process.env.FRANCHISE_PASSWORD ?? "Upjunoo@Dev2026!";
const REPORT_DIR = path.join(ROOT, "RAPPORT");
const SCREENSHOTS_DIR = path.join(REPORT_DIR, "screenshots");

// ─── Liste exhaustive des pages franchise ────────────────────────────────────
const STATIC_PAGES = [
  { slug: "01-dashboard",               path: "/franchise/dashboard",                   label: "Dashboard" },
  { slug: "02-carte-live",              path: "/franchise/map",                         label: "Carte live" },
  { slug: "03-courses-liste",           path: "/franchise/trips",                       label: "Courses — liste" },
  { slug: "04-drivers-liste",           path: "/franchise/drivers",                     label: "Chauffeurs — liste" },
  { slug: "05-drivers-moderation",      path: "/franchise/drivers/moderation",          label: "Chauffeurs — modération" },
  { slug: "06-fleet-vehicles",          path: "/franchise/fleet/vehicles",              label: "Flotte — véhicules" },
  { slug: "07-fleet-kyc",               path: "/franchise/fleet/kyc",                   label: "Flotte — KYC" },
  { slug: "08-partners-liste",          path: "/franchise/partners",                    label: "Partenaires — liste" },
  { slug: "09-partners-new",            path: "/franchise/partners/new",                label: "Partenaires — nouveau" },
  { slug: "10-clients-liste",           path: "/franchise/clients",                     label: "Clients — liste" },
  { slug: "11-finance",                 path: "/franchise/finance",                     label: "Finance — tableau de bord" },
  { slug: "12-finance-commissions",     path: "/franchise/finance/commissions",         label: "Finance — commissions" },
  { slug: "13-finance-driver-transfers",path: "/franchise/finance/driver-transfers",    label: "Finance — virements chauffeurs" },
  { slug: "14-finance-partner-transfers",path: "/franchise/finance/partner-transfers",  label: "Finance — virements partenaires" },
  { slug: "15-finance-reconciliation",  path: "/franchise/finance/reconciliation",      label: "Finance — réconciliation" },
  { slug: "16-marketing-banners",       path: "/franchise/marketing/banners",           label: "Marketing — bannières" },
  { slug: "17-marketing-banners-new",   path: "/franchise/marketing/banners/new",       label: "Marketing — nouvelle bannière" },
  { slug: "18-marketing-campaigns",     path: "/franchise/marketing/campaigns",         label: "Marketing — campagnes" },
  { slug: "19-marketing-campaigns-new", path: "/franchise/marketing/campaigns/new",     label: "Marketing — nouvelle campagne" },
  { slug: "20-promos-liste",            path: "/franchise/promos",                      label: "Promos — liste" },
  { slug: "21-promos-new",              path: "/franchise/promos/new",                  label: "Promos — nouveau" },
  { slug: "22-pricing-liste",           path: "/franchise/pricing",                     label: "Tarification — liste" },
  { slug: "23-pricing-new",             path: "/franchise/pricing/new",                 label: "Tarification — nouveau" },
  { slug: "24-territory",               path: "/franchise/territory",                   label: "Territoire" },
  { slug: "25-zones",                   path: "/franchise/zones",                       label: "Zones" },
  { slug: "26-sos-incidents",           path: "/franchise/sos/incidents",               label: "SOS — incidents" },
  { slug: "27-support-tickets",         path: "/franchise/support/tickets",             label: "Support — tickets" },
  { slug: "28-support-chat",            path: "/franchise/support/chat",                label: "Support — chat" },
  { slug: "29-settings-general",        path: "/franchise/settings/general",            label: "Paramètres — général" },
  { slug: "30-settings-weather",        path: "/franchise/settings/weather",            label: "Paramètres — météo" },
];

// Pages dynamiques : on navigue vers la liste et on clique sur le 1er item
const DYNAMIC_PAGES = [
  {
    slug: "40-course-detail",
    listPath: "/franchise/trips",
    linkSelector: 'a[href^="/franchise/trips/"]:not([href="/franchise/trips"])',
    label: "Course — détail",
  },
  {
    slug: "41-driver-detail",
    listPath: "/franchise/drivers",
    linkSelector: 'a[href^="/franchise/drivers/"]:not([href*="moderation"])',
    label: "Chauffeur — détail",
  },
  {
    slug: "42-vehicle-detail",
    listPath: "/franchise/fleet/vehicles",
    linkSelector: 'a[href^="/franchise/fleet/vehicles/"]',
    label: "Véhicule — détail",
  },
  {
    slug: "43-partner-detail",
    listPath: "/franchise/partners",
    linkSelector: 'a[href^="/franchise/partners/"]:not([href*="/new"])',
    label: "Partenaire — détail",
  },
  {
    slug: "44-client-detail",
    listPath: "/franchise/clients",
    linkSelector: 'a[href^="/franchise/clients/"]',
    label: "Client — détail",
  },
  {
    slug: "45-sos-incident-detail",
    listPath: "/franchise/sos/incidents",
    linkSelector: 'a[href^="/franchise/sos/incidents/"]',
    label: "SOS — détail incident",
  },
  {
    slug: "46-support-ticket-detail",
    listPath: "/franchise/support/tickets",
    linkSelector: 'a[href^="/franchise/support/tickets/"]',
    label: "Support — détail ticket",
  },
  {
    slug: "47-support-chat-detail",
    listPath: "/franchise/support/chat",
    linkSelector: 'a[href^="/franchise/support/chat/"]',
    label: "Support — conversation chat",
  },
  {
    slug: "48-pricing-detail",
    listPath: "/franchise/pricing",
    linkSelector: 'a[href^="/franchise/pricing/"]:not([href*="/new"])',
    label: "Tarification — détail",
  },
  {
    slug: "49-promo-detail",
    listPath: "/franchise/promos",
    linkSelector: 'a[href^="/franchise/promos/"]:not([href*="/new"])',
    label: "Promo — détail",
  },
];

// ─── Détection d'anomalies ────────────────────────────────────────────────────
const BUG_PATTERNS = [
  // Erreurs JS / Next.js
  { type: "error",   selector: "#__next-error, [data-nextjs-dialog], .nextjs-error-overlay",  desc: "Erreur Next.js (overlay d'erreur visible)" },
  { type: "error",   selector: "body:has(h2:text('Application error'))",                       desc: "Erreur application critique" },
  // Textes d'erreur génériques
  { type: "error",   selector: '[class*="error"]:visible, [class*="Error"]:visible',           desc: "Composant d'erreur visible" },
  // Spinners bloqués (page vide avec loader)
  { type: "loading", selector: '[class*="spinner"]:visible, [class*="Spinner"]:visible, [class*="loading"]:visible, [class*="Loading"]:visible', desc: "Spinner de chargement bloqué (données jamais chargées)" },
  // Contenu vide — aucune ligne dans une table attendue
  { type: "empty",   selector: '[class*="empty"]:visible, [class*="Empty"]:visible, td:text("Aucun"), td:text("No data"), p:text("Aucun résultat")', desc: "Contenu vide ou aucun résultat" },
  // Toast d'erreur
  { type: "toast",   selector: '[class*="toast"][class*="error"]:visible, [data-type="error"]:visible', desc: "Toast d'erreur affiché" },
  // 404 / 403
  { type: "http",    selector: 'h1:text("404"), h1:text("403"), h2:text("404"), h2:text("403"), h1:text("Not Found"), h1:text("Unauthorized")', desc: "Page 404 / 403 / Not Found" },
  // Redirection vers login (non authentifié)
  { type: "auth",    selector: null, urlMatch: /\/franchise\/login/, desc: "Redirigé vers la page de login (non authentifié)" },
  // Données undefined / NaN affichées
  { type: "data",    selector: 'text="undefined", text="NaN", text="null"', desc: "Valeur indéfinie (undefined / NaN / null) affichée" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function waitReady(page) {
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

async function login(page) {
  await page.goto(`${BASE}/franchise/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/franchise\/dashboard/, { timeout: 30_000 });
  await waitReady(page);
  console.log("✓ Connecté au portail franchise");
}

async function detectBugs(page) {
  const bugs = [];

  // Vérification par URL (ex: redirection vers login)
  const currentUrl = page.url();
  for (const pattern of BUG_PATTERNS) {
    if (pattern.urlMatch && pattern.urlMatch.test(currentUrl)) {
      bugs.push(pattern.desc);
    }
  }

  // Vérification par sélecteur CSS / texte
  for (const pattern of BUG_PATTERNS) {
    if (!pattern.selector) continue;
    try {
      const el = page.locator(pattern.selector).first();
      const visible = await el.isVisible({ timeout: 1500 }).catch(() => false);
      if (visible) {
        bugs.push(pattern.desc);
      }
    } catch {
      // sélecteur invalide ou timeout — on ignore
    }
  }

  // Vérification console errors (erreurs JS capturées)
  // (les erreurs console sont collectées via listener sur la page)
  return bugs;
}

async function capturePage(page, slug, url, label, consoleErrors) {
  const result = { slug, label, url, bugs: [], screenshotFile: null, ok: true };

  try {
    await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded" });
    await waitReady(page);

    const bugs = await detectBugs(page);

    // Ajout des erreurs console JS pertinentes
    const relevant = consoleErrors.filter(
      (e) => !e.includes("favicon") && !e.includes("hot-update") && !e.includes("_next/static")
    );
    if (relevant.length > 0) {
      bugs.push(`Erreurs console JS : ${relevant.slice(0, 3).join(" | ")}`);
    }

    // On capture si anomalie OU si page vide de contenu principal
    const bodyText = await page.evaluate(() => document.body?.innerText?.trim() ?? "");
    const isMeaningfullyEmpty = bodyText.length < 80;
    if (isMeaningfullyEmpty) {
      bugs.push("Page vide ou presque vide (moins de 80 caractères visibles)");
    }

    if (bugs.length > 0) {
      const file = path.join(SCREENSHOTS_DIR, `${slug}.png`);
      await page.screenshot({ path: file, fullPage: true });
      result.screenshotFile = `screenshots/${slug}.png`;
      result.bugs = bugs;
      result.ok = false;
      console.log(`  ✗ ${slug} — ${bugs.length} anomalie(s) détectée(s)`);
    } else {
      console.log(`  ✓ ${slug} — OK`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.bugs = [`Erreur script : ${msg}`];
    result.ok = false;
    try {
      const file = path.join(SCREENSHOTS_DIR, `${slug}.png`);
      await page.screenshot({ path: file, fullPage: true }).catch(() => {});
      result.screenshotFile = `screenshots/${slug}.png`;
    } catch {}
    console.warn(`  ✗ ${slug} — erreur : ${msg}`);
  }

  // Reset console errors for next page
  consoleErrors.length = 0;
  return result;
}

async function captureDynamicPage(page, spec, consoleErrors) {
  const result = { slug: spec.slug, label: spec.label, url: spec.listPath, bugs: [], screenshotFile: null, ok: true };

  try {
    await page.goto(`${BASE}${spec.listPath}`, { waitUntil: "domcontentloaded" });
    await waitReady(page);

    const link = page.locator(spec.linkSelector).first();
    const count = await link.count();
    if (count === 0) {
      result.bugs = ["Aucun lien de détail trouvé dans la liste (liste vide ou sélecteur non concordant)"];
      result.ok = false;
      const file = path.join(SCREENSHOTS_DIR, `${spec.slug}.png`);
      await page.screenshot({ path: file, fullPage: true });
      result.screenshotFile = `screenshots/${spec.slug}.png`;
      console.log(`  ✗ ${spec.slug} — liste vide`);
      return result;
    }

    const href = await link.getAttribute("href");
    if (!href) throw new Error("href manquant sur le lien détail");

    return await capturePage(page, spec.slug, href, spec.label, consoleErrors);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.bugs = [`Erreur script : ${msg}`];
    result.ok = false;
    try {
      const file = path.join(SCREENSHOTS_DIR, `${spec.slug}.png`);
      await page.screenshot({ path: file, fullPage: true }).catch(() => {});
      result.screenshotFile = `screenshots/${spec.slug}.png`;
    } catch {}
    console.warn(`  ✗ ${spec.slug} — erreur : ${msg}`);
    return result;
  }
}

function generateMarkdown(results, date) {
  const broken = results.filter((r) => !r.ok);
  const ok = results.filter((r) => r.ok);

  let md = `# Rapport de corrections — Portail Franchise\n\n`;
  md += `**Date :** ${date}  \n`;
  md += `**Base URL :** ${BASE}  \n`;
  md += `**Pages testées :** ${results.length}  \n`;
  md += `**Pages avec anomalies :** ${broken.length}  \n`;
  md += `**Pages OK :** ${ok.length}  \n\n`;
  md += `---\n\n`;

  if (broken.length === 0) {
    md += `## ✅ Aucune anomalie détectée\n\nToutes les pages fonctionnent correctement.\n`;
    return md;
  }

  md += `## Pages avec anomalies (${broken.length})\n\n`;

  for (const r of broken) {
    md += `### ${r.label}\n\n`;
    md += `**Route :** \`${r.url}\`  \n`;
    if (r.screenshotFile) {
      md += `**Capture :** ![${r.label}](${r.screenshotFile})\n\n`;
    }
    md += `**Anomalies détectées :**\n\n`;
    for (const bug of r.bugs) {
      md += `- ${bug}\n`;
    }
    md += `\n---\n\n`;
  }

  if (ok.length > 0) {
    md += `## Pages OK (${ok.length})\n\n`;
    for (const r of ok) {
      md += `- ✅ \`${r.url}\` — ${r.label}\n`;
    }
  }

  return md;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  await mkdir(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text().slice(0, 200));
    }
  });
  page.on("pageerror", (err) => {
    consoleErrors.push(`[pageerror] ${String(err).slice(0, 200)}`);
  });

  console.log(`\nBase URL : ${BASE}`);
  console.log(`Sortie   : ${REPORT_DIR}\n`);

  await login(page);

  const results = [];

  console.log("\n── Pages statiques ─────────────────────────────────────────────");
  for (const item of STATIC_PAGES) {
    const r = await capturePage(page, item.slug, item.path, item.label, consoleErrors);
    results.push(r);
  }

  console.log("\n── Pages dynamiques (détails) ───────────────────────────────────");
  for (const item of DYNAMIC_PAGES) {
    const r = await captureDynamicPage(page, item, consoleErrors);
    results.push(r);
  }

  await browser.close();

  const date = new Date().toISOString().slice(0, 10);
  const md = generateMarkdown(results, date);
  const mdPath = path.join(REPORT_DIR, `rapport-corrections-franchise-${date}.md`);
  await writeFile(mdPath, md, "utf8");

  const broken = results.filter((r) => !r.ok).length;
  console.log(`\n${"─".repeat(60)}`);
  console.log(`Terminé : ${results.length - broken}/${results.length} pages OK`);
  console.log(`Anomalies : ${broken} page(s)`);
  console.log(`Rapport : ${mdPath}`);
  console.log(`${"─".repeat(60)}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
