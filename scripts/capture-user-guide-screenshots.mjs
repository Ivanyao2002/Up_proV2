/**
 * Captures Playwright pour guides utilisateur (admin / compta).
 * Usage: node scripts/capture-user-guide-screenshots.mjs admin|compta
 * Prérequis: npm run dev (localhost:3000 ou :3001)
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  getGuideCredentials,
  getGuidePages,
  getGuidePortalMeta,
} from "./guide-portal-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}

async function probeBase(base) {
  const probe = base.includes("uat.upjunoo.com")
    ? `${base}/admin/login`
    : `${base}/admin/login`;
  try {
    const res = await fetch(probe, { signal: AbortSignal.timeout(10_000), redirect: "follow" });
    const html = await res.text();
    const hasLoginForm =
      /type=["']email["']/.test(html) && /type=["']password["']/.test(html);
    return hasLoginForm;
  } catch {
    return false;
  }
}

async function resolveBaseUrl() {
  const candidates = [
    process.env.GUIDE_BASE_URL,
    process.env.SCREENSHOT_BASE_URL,
    "https://uat.upjunoo.com/pro",
    "http://localhost:3001",
    "http://localhost:3000",
  ].filter(Boolean);

  for (const base of candidates) {
    if (await probeBase(base)) return base;
  }
  return "https://uat.upjunoo.com/pro";
}

function normalizePath(pathname) {
  return pathname.replace(/^\/pro(?=\/|$)/, "") || "/";
}

function pathMatchesPortal(pathname, portal) {
  const p = normalizePath(pathname);
  if (portal === "admin") {
    return p.startsWith("/admin") && !p.includes("/login");
  }
  return p.startsWith("/compta") && !p.includes("/login");
}

async function waitReady(page) {
  await page.waitForLoadState("networkidle", { timeout: 25_000 }).catch(() => {});
  await page.waitForTimeout(1000);
}

async function login(page, base, portal, creds) {
  const meta = getGuidePortalMeta(portal);
  const loginUrl = `${base}${meta.loginPath}`;
  await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector('input[type="email"]', { timeout: 60_000 });
  await page.fill('input[type="email"]', creds.email);
  const pwd = page.locator('input[type="password"]').first();
  await pwd.waitFor({ timeout: 15_000 });
  await pwd.fill(creds.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => pathMatchesPortal(url.pathname, portal), {
    timeout: 45_000,
  });
  await waitReady(page);
}

async function capture(page, base, item, outDir, results) {
  try {
    await page.goto(`${base}${item.path}`, { waitUntil: "domcontentloaded" });
    await waitReady(page);
    const file = path.join(outDir, `${item.slug}.png`);
    await page.screenshot({ path: file, fullPage: true });
    results.push({
      ...item,
      file: `screenshots/${item.slug}.png`,
      ok: true,
    });
    console.log(`OK  ${item.slug} — ${item.label}`);
  } catch (error) {
    results.push({
      ...item,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.warn(`ERR ${item.slug}:`, error);
  }
}

async function main() {
  loadEnvLocal();
  const portal = process.argv[2];
  if (portal !== "admin" && portal !== "compta") {
    console.error("Usage: node scripts/capture-user-guide-screenshots.mjs admin|compta");
    process.exit(1);
  }

  const meta = getGuidePortalMeta(portal);
  const guideDir = path.join(ROOT, "guide-pdf", meta.outputDir);
  const outDir = path.join(guideDir, "screenshots");
  await mkdir(outDir, { recursive: true });

  const base = await resolveBaseUrl();
  const creds = getGuideCredentials(portal);
  const pages = getGuidePages(portal);

  console.log(`Portail: ${portal}`);
  console.log(`Base URL: ${base}`);
  console.log(`Email: ${creds.email}`);
  console.log(`Pages: ${pages.length}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const results = [];

  await login(page, base, portal, creds);

  for (const item of pages) {
    await capture(page, base, item, outDir, results);
  }

  await browser.close();

  const manifest = {
    portal,
    generatedAt: new Date().toISOString(),
    baseUrl: base,
    loginEmail: creds.email,
    results,
  };

  await writeFile(
    path.join(guideDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  const ok = results.filter((r) => r.ok).length;
  console.log(`\nTerminé: ${ok}/${results.length} captures.`);
  process.exit(ok > 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
