/**
 * Capture automatiquement les écrans du Portail Partenaire pour le guide utilisateur.
 *
 * Pré-requis :
 *   1. Lancer le serveur dev : npm run dev  (http://localhost:3000)
 *   2. Lancer ce script :       node scripts/capture-partner-screenshots.mjs
 *
 * Les captures sont enregistrées dans guide-pdf/captures/.
 *
 * Variables d'environnement optionnelles :
 *   BASE_URL        (défaut http://localhost:3000)
 *   PARTNER_EMAIL   (défaut contact@cocodyexpress.ci)
 *   PARTNER_PASSWORD(défaut demo)
 *   CHROME_PATH     (défaut Chrome Windows standard)
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

const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 2 };

/** Pages capturées par navigation directe (URL). */
const PAGES = [
  { file: "02-dashboard.png", path: "/partner/dashboard", label: "Tableau de bord" },
  { file: "03-vehicles-list.png", path: "/partner/fleet", label: "Liste des véhicules" },
  { file: "06-drivers-list.png", path: "/partner/drivers", label: "Liste des chauffeurs" },
  { file: "08-live-map.png", path: "/partner/map", label: "Carte live" },
  { file: "09-reservations.png", path: "/partner/bookings", label: "Réservations" },
  { file: "10-trips.png", path: "/partner/orders", label: "Courses" },
  { file: "11-freight-list.png", path: "/partner/freight", label: "Offres de fret" },
  { file: "13-rental-bookings.png", path: "/partner/rental", label: "Réservations location" },
  { file: "15-performance.png", path: "/partner/performance", label: "Performance" },
  { file: "16-wallet.png", path: "/partner/wallet", label: "Portefeuille" },
];

/** Pages détail : aller sur la liste puis cliquer le 1er lien correspondant. */
const DETAIL_PAGES = [
  {
    file: "04-vehicle-detail.png",
    listPath: "/partner/fleet",
    linkPattern: "/partner/fleet/",
    label: "Détail véhicule",
  },
  {
    file: "07-driver-detail.png",
    listPath: "/partner/drivers",
    linkPattern: "/partner/drivers/",
    label: "Détail chauffeur",
  },
  {
    file: "12-freight-detail.png",
    listPath: "/partner/freight",
    linkPattern: "/partner/freight/",
    label: "Détail offre de fret",
  },
  {
    file: "14-rental-detail.png",
    listPath: "/partner/rental",
    linkPattern: "/partner/rental/",
    label: "Détail location",
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function dismissOverlays(page) {
  // Ferme d'éventuels toasts / overlays react-hot-toast
  await page.evaluate(() => {
    document
      .querySelectorAll("[data-sonner-toast], .go2072408551, [role='status']")
      .forEach((el) => el.remove());
  }).catch(() => {});
}

async function capture(page, file, label) {
  await sleep(1200); // laisse le temps aux requêtes/animations
  await dismissOverlays(page);
  const out = path.join(OUT_DIR, file);
  await page.screenshot({ path: out, fullPage: true });
  console.log(`  ✅ ${label} → ${file}`);
}

async function login(page) {
  console.log("🔐 Connexion au portail partenaire…");
  await page.goto(`${BASE_URL}/partner/login`, { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(800);

  // Capture la page de login avant soumission
  await capture(page, "01-login.png", "Page de connexion");

  // Remplit les champs en les vidant d'abord complètement
  async function setField(selector, value) {
    const el = await page.$(selector);
    if (!el) return;
    await el.click();
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyA");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    // Vide aussi via DOM au cas où
    await page.$eval(selector, (node) => {
      node.value = "";
    });
    await el.type(value, { delay: 25 });
  }

  await setField('input[type="email"]', EMAIL);
  await setField('input[type="password"]', PASSWORD);

  await page.click('button[type="submit"]');

  // Navigation client-side Next.js : on attend que l'URL quitte /login
  const deadline = Date.now() + 20000;
  let url = page.url();
  while (Date.now() < deadline && url.includes("/login")) {
    await sleep(500);
    url = page.url();
  }

  if (url.includes("/login")) {
    // Capture debug pour diagnostiquer (message d'erreur éventuel)
    await page.screenshot({ path: path.join(OUT_DIR, "_login-error.png") }).catch(() => {});
    const bodyText = await page.evaluate(() => document.body.innerText).catch(() => "");
    throw new Error(
      `Échec de connexion (toujours sur ${url}). Identifiants ${EMAIL}/****. ` +
        `Texte page: ${bodyText.slice(0, 200).replace(/\n/g, " ")}`
    );
  }
  // Laisse le dashboard se charger
  await page.waitForNetworkIdle({ timeout: 30000 }).catch(() => {});
  console.log(`  ✅ Connecté → ${url}`);
}

async function captureDirectPages(page) {
  for (const p of PAGES) {
    console.log(`📸 ${p.label} (${p.path})`);
    try {
      await page.goto(`${BASE_URL}${p.path}`, { waitUntil: "networkidle2", timeout: 60000 });
      await capture(page, p.file, p.label);
    } catch (err) {
      console.warn(`  ⚠️  Impossible de capturer ${p.path}: ${err.message}`);
    }
  }
}

async function captureDetailPages(page) {
  for (const d of DETAIL_PAGES) {
    console.log(`📸 ${d.label} (depuis ${d.listPath})`);
    try {
      await page.goto(`${BASE_URL}${d.listPath}`, { waitUntil: "networkidle2", timeout: 60000 });

      // Attend que les lignes react-query soient rendues : polling du lien détail
      const findHref = () =>
        page.evaluate((pattern) => {
          const a = Array.from(document.querySelectorAll("a")).find((el) => {
            const href = el.getAttribute("href") ?? "";
            return (
              href.includes(pattern) &&
              !href.endsWith("/pending") &&
              !href.endsWith("/new") &&
              href !== pattern
            );
          });
          return a ? a.getAttribute("href") : null;
        }, d.linkPattern);

      let href = null;
      const detailDeadline = Date.now() + 10000;
      while (Date.now() < detailDeadline && !href) {
        href = await findHref();
        if (!href) await sleep(500);
      }

      if (!href) {
        console.warn(`  ⚠️  Aucun élément détail trouvé pour ${d.linkPattern}`);
        continue;
      }

      await page.goto(`${BASE_URL}${href}`, { waitUntil: "networkidle2", timeout: 60000 });
      await capture(page, d.file, d.label);
    } catch (err) {
      console.warn(`  ⚠️  Impossible de capturer ${d.label}: ${err.message}`);
    }
  }
}

async function captureAssignModal(page) {
  console.log("📸 Modal d'assignation (recherche d'un véhicule sans chauffeur)");
  try {
    await page.goto(`${BASE_URL}/partner/fleet`, { waitUntil: "networkidle2", timeout: 60000 });

    // Récupère tous les liens de détail véhicule
    const hrefs = await (async () => {
      const deadline = Date.now() + 10000;
      let list = [];
      while (Date.now() < deadline && list.length === 0) {
        list = await page.evaluate(() =>
          Array.from(document.querySelectorAll("a"))
            .map((a) => a.getAttribute("href") ?? "")
            .filter(
              (h) =>
                h.includes("/partner/fleet/") &&
                !h.endsWith("/pending") &&
                !h.endsWith("/new")
            )
        );
        if (list.length === 0) await sleep(500);
      }
      return [...new Set(list)];
    })();

    for (const href of hrefs) {
      await page.goto(`${BASE_URL}${href}`, { waitUntil: "networkidle2", timeout: 60000 });
      await sleep(1200);

      // Cherche le bouton "Assigner un chauffeur"
      const clicked = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button")).find((b) =>
          b.textContent?.includes("Assigner un chauffeur")
        );
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });

      if (clicked) {
        await sleep(1000); // attend l'ouverture de la modal + chargement liste
        await dismissOverlays(page);
        const out = path.join(OUT_DIR, "05-assign-modal.png");
        await page.screenshot({ path: out, fullPage: true });
        console.log(`  ✅ Modal d'assignation → 05-assign-modal.png (véhicule ${href})`);
        return;
      }
    }

    console.warn(
      "  ⚠️  Aucun véhicule sans chauffeur trouvé — modal d'assignation non capturée."
    );
  } catch (err) {
    console.warn(`  ⚠️  Impossible de capturer la modal d'assignation: ${err.message}`);
  }
}

(async () => {
  if (!fs.existsSync(CHROME_PATH)) {
    console.error(`❌ Chrome introuvable: ${CHROME_PATH}`);
    console.error("   Définissez CHROME_PATH vers votre exécutable Chrome.");
    process.exit(1);
  }

  console.log(`🌐 Base URL : ${BASE_URL}`);
  console.log(`📁 Sortie   : ${OUT_DIR}\n`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    defaultViewport: VIEWPORT,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);

    await login(page);
    await captureDirectPages(page);
    await captureDetailPages(page);
    await captureAssignModal(page);

    console.log(`\n✅ Captures terminées dans ${OUT_DIR}`);
  } catch (err) {
    console.error(`\n❌ Erreur : ${err.message}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
