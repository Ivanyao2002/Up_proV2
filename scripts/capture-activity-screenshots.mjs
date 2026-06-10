/**
 * Captures d'écran pour rapport d'activité — nécessite `npm run dev` sur :3000
 * Usage: node scripts/capture-activity-screenshots.mjs [YYYY-MM-DD]
 * Exemple: node scripts/capture-activity-screenshots.mjs 2026-06-09
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const reportDate =
  process.argv[2] ??
  process.env.REPORT_DATE ??
  new Date().toISOString().slice(0, 10);

if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
  console.error("Date invalide. Utiliser YYYY-MM-DD, ex. 2026-06-09");
  process.exit(1);
}

const REPORT_DIR = path.join(ROOT, "docs", `rapport-activite-${reportDate}`);
const OUT_DIR = path.join(REPORT_DIR, "screenshots");
const BASE = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.DEV_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech";
const PASSWORD = process.env.DEV_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!";

const STATIC_PAGES = [
  { slug: "01-dashboard", path: "/admin/dashboard", label: "Tableau de bord" },
  { slug: "02-carte-live", path: "/admin/ops/map", label: "Carte live" },
  { slug: "03-courses-liste", path: "/admin/ops/trips", label: "Liste courses" },
  { slug: "04-franchises-liste", path: "/admin/network/franchises", label: "Liste franchises" },
  { slug: "05-partenaires-liste", path: "/admin/network/partners", label: "Liste partenaires" },
  { slug: "06-chauffeurs-liste", path: "/admin/fleet/drivers", label: "Liste chauffeurs" },
  { slug: "07-vehicules-liste", path: "/admin/fleet/vehicles", label: "Liste véhicules" },
  { slug: "08-kyc-file", path: "/admin/fleet/kyc", label: "File KYC" },
  { slug: "09-finance-dashboard", path: "/admin/finance", label: "Finance — tableau de bord" },
  { slug: "10-transactions-liste", path: "/admin/finance/transactions", label: "Transactions" },
  { slug: "11-retraits-liste", path: "/admin/finance/withdrawals", label: "Retraits" },
  { slug: "12-marketing-bannieres", path: "/admin/marketing/banners", label: "Bannières" },
  { slug: "13-marketing-banniere-new", path: "/admin/marketing/banners/new", label: "Nouvelle bannière" },
  { slug: "14-marketing-promos", path: "/admin/marketing/promos", label: "Codes promo" },
  { slug: "15-marketing-campagnes", path: "/admin/marketing/campaigns", label: "Campagnes" },
];

const DYNAMIC_PAGES = [
  {
    slug: "20-course-detail",
    listPath: "/admin/ops/trips",
    linkSelector: 'a[href^="/admin/ops/trips/"]:not([href*="forensic"])',
    label: "Détail course",
  },
  {
    slug: "21-partenaire-detail",
    listPath: "/admin/network/partners",
    linkSelector: 'a[href^="/admin/network/partners/"]:not([href*="/edit"]):not([href*="/new"]):not([href*="/drivers"])',
    label: "Détail partenaire",
  },
  {
    slug: "22-franchise-detail",
    listPath: "/admin/network/franchises",
    linkSelector: 'a[href^="/admin/network/franchises/"]:not([href*="/edit"]):not([href*="/new"]):not([href*="/partners"])',
    label: "Détail franchise",
  },
  {
    slug: "23-chauffeur-detail",
    listPath: "/admin/fleet/drivers",
    linkSelector: 'a[href^="/admin/fleet/drivers/"]',
    label: "Détail chauffeur",
  },
  {
    slug: "24-transaction-detail",
    listPath: "/admin/finance/transactions",
    linkSelector: 'a[href^="/admin/finance/transactions/"]',
    label: "Détail transaction",
  },
  {
    slug: "25-retrait-detail",
    listPath: "/admin/finance/withdrawals",
    linkSelector: 'a[href^="/admin/finance/withdrawals/"]',
    label: "Détail retrait",
  },
];

async function waitForPageReady(page) {
  await page.waitForLoadState("networkidle", { timeout: 25_000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

async function login(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 30_000 });
  await waitForPageReady(page);
}

async function capture(page, slug, url, label, results) {
  try {
    await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);
    const file = path.join(OUT_DIR, `${slug}.png`);
    await page.screenshot({ path: file, fullPage: true });
    results.push({ slug, label, url, file: `screenshots/${slug}.png`, ok: true });
    console.log(`OK  ${slug} — ${label}`);
  } catch (error) {
    results.push({
      slug,
      label,
      url,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.warn(`ERR ${slug} — ${label}:`, error);
  }
}

async function captureFromList(page, spec, results) {
  try {
    await page.goto(`${BASE}${spec.listPath}`, { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);
    const link = page.locator(spec.linkSelector).first();
    const count = await link.count();
    if (count === 0) {
      results.push({
        slug: spec.slug,
        label: spec.label,
        url: spec.listPath,
        ok: false,
        error: "Aucun lien détail trouvé dans la liste",
      });
      console.warn(`SKIP ${spec.slug} — liste vide`);
      return;
    }
    const href = await link.getAttribute("href");
    if (!href) throw new Error("href manquant");
    await capture(page, spec.slug, href, spec.label, results);
  } catch (error) {
    results.push({
      slug: spec.slug,
      label: spec.label,
      url: spec.listPath,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.warn(`ERR ${spec.slug}:`, error);
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const results = [];

  console.log(`Base URL: ${BASE}`);
  console.log(`Sortie: ${OUT_DIR}\n`);

  await login(page);

  for (const item of STATIC_PAGES) {
    await capture(page, item.slug, item.path, item.label, results);
  }

  for (const item of DYNAMIC_PAGES) {
    await captureFromList(page, item, results);
  }

  await browser.close();

  const manifest = {
    reportDate,
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    results,
  };
  await writeFile(
    path.join(REPORT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  const ok = results.filter((r) => r.ok).length;
  console.log(`\nTerminé: ${ok}/${results.length} captures réussies.`);
  process.exit(ok === 0 ? 0 : ok > 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
