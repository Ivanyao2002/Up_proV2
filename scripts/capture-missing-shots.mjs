/**
 * Capture les écrans manquants pour le rapport de corrections :
 *  - Détail offre de fret (page cassée → preuve N°01)
 *  - Modal "Alimenter mon compte" ouvert (N°05)
 *  - Modal "Nouvelle zone" ouvert (N°03)
 *  - Formulaire "Nouvelle offre" de fret ouvert (N°20)
 *
 * Usage: node scripts/capture-missing-shots.mjs
 */
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.PARTNER_EMAIL ?? "dev.partner@upjunoo-dev.tech";
const PASSWORD = process.env.PARTNER_PASSWORD ?? "Upjunoo@Dev2026!";
const SHOTS = path.join(__dirname, "audit-results", "screenshots");
fs.mkdirSync(SHOTS, { recursive: true });

function chrome() {
  const c = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA ?? "", "Google\\Chrome\\Application\\chrome.exe"),
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  return c.find((p) => p && fs.existsSync(p));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickByText(page, selector, text) {
  return page.evaluate(
    (sel, t) => {
      const el = Array.from(document.querySelectorAll(sel)).find((e) =>
        e.textContent?.toLowerCase().includes(t.toLowerCase())
      );
      if (el) { el.click(); return true; }
      return false;
    },
    selector,
    text
  );
}

const browser = await puppeteer.launch({
  executablePath: chrome(),
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
page.setDefaultTimeout(20000);

async function shot(name) {
  const f = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: f });
  console.log("📸", name);
}

try {
  // Login
  await page.goto(`${BASE_URL}/partner/login`, { waitUntil: "networkidle2" });
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
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline && page.url().includes("/login")) await sleep(500);
  await sleep(1500);
  console.log("→ connecté", page.url());

  // NB : la page Détail fret déclenche une erreur de build (dev overlay) qui
  // persiste dans la session → on la capture EN DERNIER.

  // 1) Modal "Alimenter mon compte"
  await page.goto(`${BASE_URL}/partner/wallet`, { waitUntil: "networkidle2" }).catch(() => {});
  await sleep(1500);
  await clickByText(page, "button", "Alimenter");
  await sleep(900);
  await shot("wallet_topup_modal");

  // 2) Modal "Nouvelle zone"
  await page.goto(`${BASE_URL}/partner/freight/zones`, { waitUntil: "networkidle2" }).catch(() => {});
  await sleep(1200);
  let zoneOpened = await clickByText(page, "button", "Nouvelle zone");
  if (!zoneOpened) zoneOpened = await clickByText(page, "button", "zone");
  await sleep(900);
  await shot("zone_create_modal");

  // 3) Formulaire "Nouvelle offre" de fret
  await page.goto(`${BASE_URL}/partner/freight`, { waitUntil: "networkidle2" }).catch(() => {});
  await sleep(1200);
  let opened = await clickByText(page, "button", "Nouvelle offre");
  if (!opened) opened = await clickByText(page, "button", "offre");
  await sleep(900);
  await shot("freight_create_form");

  // 4) Détail fret — EN DERNIER (déclenche le build error qui prouve N°01)
  let freightId = await page.evaluate(() => {
    const a = document.querySelector('a[href*="/partner/freight/"]');
    if (a) return a.getAttribute("href").split("/").pop();
    return null;
  });
  if (!freightId) freightId = "00000000-0000-0000-0000-000000000001";
  await page.goto(`${BASE_URL}/partner/freight/${freightId}`, { waitUntil: "networkidle2" }).catch(() => {});
  await sleep(1800);
  await shot("freight_detail");

  console.log("✅ captures terminées");
} catch (e) {
  console.error("❌", e.message);
} finally {
  await browser.close();
}
