/**
 * Recapture ciblée : carte live, liste chauffeurs, détail chauffeur.
 * Viewport identique aux maquettes fournies (1280×800, sans scroll).
 */
import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.PARTNER_EMAIL ?? "dev.partner@upjunoo-dev.tech";
const PASSWORD = process.env.PARTNER_PASSWORD ?? "Upjunoo@Dev2026!";

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

const CHROME_PATH = resolveChromePath();
const OUT_DIR = path.resolve(ROOT, "guide-pdf", "captures");
fs.mkdirSync(OUT_DIR, { recursive: true });

// Viewport large comme dans les maquettes
const VIEWPORT = { width: 1440, height: 860, deviceScaleFactor: 2 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function dismissOverlays(page) {
  await page.evaluate(() => {
    document
      .querySelectorAll("[data-sonner-toast], .go2072408551, [role='status']")
      .forEach((el) => el.remove());
  }).catch(() => {});
}

async function login(page) {
  console.log("🔐 Connexion…");
  await page.goto(`${BASE_URL}/partner/login`, { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(800);

  async function setField(selector, value) {
    const el = await page.$(selector);
    if (!el) return;
    await el.click();
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await page.$eval(selector, (node) => { node.value = ""; });
    await el.type(value, { delay: 25 });
  }

  await setField('input[type="email"]', EMAIL);
  await setField('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');

  const deadline = Date.now() + 35000;
  let url = page.url();
  while (Date.now() < deadline && url.includes("/login")) {
    await sleep(600);
    url = page.url();
  }
  if (url.includes("/login")) {
    const dbg = path.join(OUT_DIR, "_login-error-targeted.png");
    await page.screenshot({ path: dbg }).catch(() => {});
    const txt = await page.evaluate(() => document.body.innerText).catch(() => "");
    throw new Error(`Échec de connexion (${url}). ${txt.slice(0, 300).replace(/\n/g, " ")}`);
  }
  await page.waitForNetworkIdle({ timeout: 30000 }).catch(() => {});
  console.log(`  ✅ Connecté → ${url}`);
}

async function capturePage(page, url, file, label, waitMs = 2500) {
  console.log(`📸 ${label}…`);
  await page.goto(`${BASE_URL}${url}`, { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(waitMs);
  await dismissOverlays(page);
  const out = path.join(OUT_DIR, file);
  // fullPage: false → capture exactement le viewport visible (comme les maquettes)
  await page.screenshot({ path: out, fullPage: false });
  console.log(`  ✅ ${label} → ${file}`);
}

async function captureDriverDetail(page) {
  console.log("📸 Détail chauffeur (depuis la liste)…");
  await page.goto(`${BASE_URL}/partner/drivers`, { waitUntil: "networkidle2", timeout: 60000 });

  // Attend les lignes
  const findHref = () =>
    page.evaluate(() => {
      const a = Array.from(document.querySelectorAll("a")).find((el) => {
        const href = el.getAttribute("href") ?? "";
        return href.includes("/partner/drivers/") && href !== "/partner/drivers/";
      });
      return a ? a.getAttribute("href") : null;
    });

  let href = null;
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline && !href) {
    href = await findHref();
    if (!href) await sleep(500);
  }

  if (!href) {
    // Fallback : cherche le bouton "Voir" et clique dessus
    const clicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button, a")).find(
        (el) => el.textContent?.trim() === "Voir"
      );
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (!clicked) { console.warn("  ⚠️  Aucun chauffeur trouvé"); return; }
    await sleep(2000);
    await page.waitForNetworkIdle({ timeout: 10000 }).catch(() => {});
  } else {
    await page.goto(`${BASE_URL}${href}`, { waitUntil: "networkidle2", timeout: 60000 });
  }

  await sleep(2500);
  await dismissOverlays(page);
  const out = path.join(OUT_DIR, "07-driver-detail.png");
  await page.screenshot({ path: out, fullPage: false });
  console.log(`  ✅ Détail chauffeur → 07-driver-detail.png`);
}

(async () => {
  if (!fs.existsSync(CHROME_PATH)) {
    console.error(`❌ Chrome introuvable: ${CHROME_PATH}`);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    defaultViewport: VIEWPORT,
    args: ["--no-sandbox", "--disable-setuid-sandbox", `--window-size=${VIEWPORT.width},${VIEWPORT.height}`],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);

    await login(page);

    // Carte live — attendre plus longtemps pour le chargement Mapbox
    await capturePage(page, "/partner/map", "08-live-map.png", "Carte live", 4000);

    // Liste chauffeurs
    await capturePage(page, "/partner/drivers", "06-drivers-list.png", "Liste des chauffeurs", 2000);

    // Détail chauffeur
    await captureDriverDetail(page);

    console.log(`\n✅ Recaptures terminées dans ${OUT_DIR}`);
  } catch (err) {
    console.error(`\n❌ Erreur : ${err.message}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
