#!/usr/bin/env node
/**
 * Génère le guide HTML avec captures d'écran (Puppeteer).
 * Usage: node scripts/generate-user-guide-report.mjs
 * Env: GUIDE_APP_URL=http://localhost:3000
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import {
  DEMO_ACCOUNTS,
  GUIDE_MODULES,
  REPORT_META,
} from "./guide-modules.data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SCREENSHOTS_DIR = path.join(ROOT, "docs", "guide-screenshots");
const OUTPUT_HTML = path.join(
  ROOT,
  "docs",
  "GUIDE-UTILISATION-MODULES-UPJUNOO.html"
);

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(
    process.env.LOCALAPPDATA ?? "",
    "Google",
    "Chrome",
    "Application",
    "chrome.exe"
  ),
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function fillLoginForm(page, email, password) {
  await page.waitForSelector('input[type="email"]', { timeout: 20_000 });
  await page.evaluate(
    (em, pw) => {
      const setVal = (selector, value) => {
        const el = document.querySelector(selector);
        if (!el) return;
        const proto =
          el instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
        const desc = Object.getOwnPropertyDescriptor(proto, "value");
        if (desc?.set) desc.set.call(el, value);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      };
      setVal('input[type="email"]', em);
      setVal('input[type="password"]', pw);
    },
    email,
    password
  );
}

async function clearSession(page) {
  const cookies = await page.cookies();
  if (cookies.length) await page.deleteCookie(...cookies);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function login(page, portal, account) {
  const base = REPORT_META.appUrl.replace(/\/$/, "");
  await page.goto(`${base}${account.loginUrl}`, {
    waitUntil: "networkidle2",
    timeout: 60_000,
  });
  await fillLoginForm(page, account.email, account.password);
  const loginPath = account.loginUrl;
  await Promise.all([
    page
      .waitForFunction(
        (path) => !window.location.pathname.includes(path.replace(/^\//, "")),
        { timeout: 45_000 },
        loginPath
      )
      .catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await new Promise((r) => setTimeout(r, 2500));
  const url = page.url();
  if (url.includes("/login")) {
    console.warn(`⚠ Connexion ${portal} peut avoir échoué — URL: ${url}`);
  } else {
    console.log(`✓ Connecté ${portal} → ${url}`);
  }
}

async function captureModule(page, mod, results) {
  const base = REPORT_META.appUrl.replace(/\/$/, "");
  const fileName = `${mod.slug}.png`;
  const filePath = path.join(SCREENSHOTS_DIR, fileName);
  const relPath = `guide-screenshots/${fileName}`;

  try {
    await page.goto(`${base}${mod.path}`, {
      waitUntil: "networkidle2",
      timeout: 60_000,
    });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: filePath, fullPage: false });
    results.push({ ...mod, screenshot: relPath, captureOk: true });
    console.log(`  📸 ${mod.label}`);
  } catch (err) {
    console.warn(`  ✗ ${mod.label}: ${err.message}`);
    results.push({ ...mod, screenshot: null, captureOk: false, error: err.message });
  }
}

function buildHtml(results) {
  const adminModules = results.filter((m) => m.portal === "admin");
  const comptaModules = results.filter((m) => m.portal === "compta");

  function renderModuleSection(modules, portalTitle) {
    const groups = [...new Set(modules.map((m) => m.group))];
    return groups
      .map((group) => {
        const items = modules.filter((m) => m.group === group);
        const cards = items
          .map((m) => {
            const img = m.screenshot
              ? `<figure class="shot"><img src="${escapeHtml(m.screenshot)}" alt="${escapeHtml(m.label)}" loading="lazy" /><figcaption>Capture — ${escapeHtml(m.path)}</figcaption></figure>`
              : `<div class="shot shot-missing">Capture non disponible${m.error ? ` (${escapeHtml(m.error)})` : ""}</div>`;
            const steps = m.usage
              .map((s) => `<li>${escapeHtml(s)}</li>`)
              .join("");
            return `
        <article class="module-card" id="${escapeHtml(m.slug)}">
          <header>
            <span class="module-group">${escapeHtml(group)}</span>
            <h3>${escapeHtml(m.label)}</h3>
            <p class="path"><code>${escapeHtml(m.path)}</code></p>
          </header>
          <p class="objectif"><strong>Objectif :</strong> ${escapeHtml(m.objectif)}</p>
          ${img}
          <div class="usage">
            <h4>Guide d'utilisation</h4>
            <ol>${steps}</ol>
          </div>
        </article>`;
          })
          .join("\n");
        return `
      <section class="group-section">
        <h2 class="group-title">${escapeHtml(group)}</h2>
        ${cards}
      </section>`;
      })
      .join("\n");
  }

  const tocAdmin = adminModules
    .map(
      (m) =>
        `<li><a href="#${escapeHtml(m.slug)}">${escapeHtml(m.group)} — ${escapeHtml(m.label)}</a></li>`
    )
    .join("");
  const tocCompta = comptaModules
    .map(
      (m) =>
        `<li><a href="#${escapeHtml(m.slug)}">${escapeHtml(m.group)} — ${escapeHtml(m.label)}</a></li>`
    )
    .join("");

  const accountsTable = DEMO_ACCOUNTS.map(
    (a) => `
    <tr>
      <td>${escapeHtml(a.portal)}</td>
      <td><code>${escapeHtml(a.loginUrl)}</code></td>
      <td><code>${escapeHtml(a.email)}</code></td>
      <td><code>${escapeHtml(a.password)}</code></td>
      <td>${escapeHtml(a.scope)}</td>
    </tr>`
  ).join("");

  const captured = results.filter((r) => r.captureOk).length;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(REPORT_META.title)}</title>
  <style>
    :root {
      --navy: #0f172a;
      --teal: #0d9488;
      --teal-dark: #0f766e;
      --muted: #64748b;
      --border: #e2e8f0;
      --bg: #f8fafc;
      --surface: #ffffff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      color: var(--navy);
      background: var(--bg);
    }
    .cover {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 3rem 2rem;
      background: linear-gradient(145deg, #0f172a 0%, #134e4a 100%);
      color: #fff;
      page-break-after: always;
    }
    .cover h1 { font-size: 2.25rem; font-weight: 700; margin: 0 0 0.5rem; max-width: 720px; }
    .cover .sub { font-size: 1.1rem; opacity: 0.9; margin-bottom: 2rem; }
    .cover .meta { font-size: 0.9rem; opacity: 0.75; }
    .cover .logo { font-size: 2.5rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 1.5rem; color: #5eead4; }
    main { max-width: 960px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
    h2.portal-title {
      font-size: 1.75rem;
      color: var(--teal-dark);
      border-bottom: 3px solid var(--teal);
      padding-bottom: 0.5rem;
      margin: 3rem 0 1.5rem;
      page-break-before: always;
    }
    h2.portal-title:first-of-type { page-break-before: auto; margin-top: 0; }
    .group-title {
      font-size: 1.2rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
      margin: 2rem 0 1rem;
    }
    .module-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(15,23,42,0.06);
      page-break-inside: avoid;
    }
    .module-card header h3 { margin: 0.25rem 0; font-size: 1.35rem; }
    .module-group {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--teal-dark);
      background: #ccfbf1;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }
    .path { margin: 0.35rem 0 0; font-size: 0.85rem; color: var(--muted); }
    .objectif { margin: 1rem 0; }
    .shot {
      margin: 1rem 0;
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      background: #f1f5f9;
    }
    .shot img { width: 100%; height: auto; display: block; }
    .shot figcaption {
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
      color: var(--muted);
      background: var(--surface);
      border-top: 1px solid var(--border);
    }
    .shot-missing {
      padding: 3rem;
      text-align: center;
      color: var(--muted);
      font-style: italic;
    }
    .usage h4 { margin: 0 0 0.5rem; font-size: 0.95rem; }
    .usage ol { margin: 0; padding-left: 1.25rem; }
    .usage li { margin-bottom: 0.35rem; }
    .toc {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem 2rem;
      margin-bottom: 2rem;
    }
    .toc h2 { margin-top: 0; font-size: 1.25rem; }
    .toc ul { columns: 2; gap: 2rem; padding-left: 1.25rem; }
    .toc a { color: var(--teal-dark); text-decoration: none; }
    .toc a:hover { text-decoration: underline; }
    table.accounts {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
      margin: 1rem 0 2rem;
    }
    table.accounts th, table.accounts td {
      border: 1px solid var(--border);
      padding: 0.6rem 0.75rem;
      text-align: left;
    }
    table.accounts th { background: #f1f5f9; font-weight: 600; }
    .summary-box {
      background: #ecfdf5;
      border: 1px solid #99f6e4;
      border-radius: 8px;
      padding: 1rem 1.25rem;
      margin-bottom: 2rem;
      font-size: 0.9rem;
    }
    @media print {
      body { background: #fff; }
      .cover { min-height: auto; padding: 4rem 2rem; }
      .module-card { box-shadow: none; }
      .toc ul { columns: 1; }
    }
  </style>
</head>
<body>
  <header class="cover">
    <div class="logo">UpJunoo Pro</div>
    <h1>${escapeHtml(REPORT_META.title)}</h1>
    <p class="sub">${escapeHtml(REPORT_META.subtitle)}</p>
    <p class="meta">
      Version ${escapeHtml(REPORT_META.version)} · ${escapeHtml(REPORT_META.date)}<br />
      API : ${escapeHtml(REPORT_META.environment)} · App : ${escapeHtml(REPORT_META.appUrl)}<br />
      ${captured} / ${results.length} captures générées
    </p>
  </header>

  <main>
    <div class="summary-box">
      <strong>Résumé :</strong> ce document décrit l'utilisation de chaque module du back-office
      <em>Administrateur</em> et du portail <em>Comptabilité</em>, avec captures d'écran prises sur
      l'environnement de développement. Les identifiants de démonstration sont listés ci-dessous.
    </div>

    <section id="comptes">
      <h2>Comptes de démonstration</h2>
      <table class="accounts">
        <thead>
          <tr>
            <th>Portail</th>
            <th>URL connexion</th>
            <th>Email</th>
            <th>Mot de passe</th>
            <th>Périmètre</th>
          </tr>
        </thead>
        <tbody>${accountsTable}</tbody>
      </table>
    </section>

    <nav class="toc" id="sommaire">
      <h2>Sommaire — Portail Administrateur</h2>
      <ul>${tocAdmin}</ul>
      <h2 style="margin-top:2rem">Sommaire — Portail Comptable</h2>
      <ul>${tocCompta}</ul>
    </nav>

    <h2 class="portal-title" id="portail-admin">Portail Administrateur</h2>
    ${renderModuleSection(adminModules, "Administrateur")}

    <h2 class="portal-title" id="portail-compta">Portail Comptabilité</h2>
    ${renderModuleSection(comptaModules, "Comptable")}

    <footer style="margin-top:3rem;padding-top:1.5rem;border-top:1px solid var(--border);color:var(--muted);font-size:0.85rem;text-align:center;">
      Document généré automatiquement — UpJunoo Pro · ${escapeHtml(REPORT_META.date)}
    </footer>
  </main>
</body>
</html>`;
}

async function main() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const chrome = findChrome();
  if (!chrome) {
    console.error(
      "Chrome introuvable. Définissez CHROME_PATH ou installez Google Chrome."
    );
    process.exit(1);
  }

  console.log(`Chrome: ${chrome}`);
  console.log(`App: ${REPORT_META.appUrl}`);
  console.log(`Screenshots → ${SCREENSHOTS_DIR}`);

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  const results = [];

  const adminAccount = DEMO_ACCOUNTS.find((a) => a.portal === "Administrateur");
  const comptaAccount = DEMO_ACCOUNTS.find((a) => a.portal === "Comptable");

  const adminModules = GUIDE_MODULES.filter((m) => m.portal === "admin");
  const comptaModules = GUIDE_MODULES.filter((m) => m.portal === "compta");

  console.log("\n——— ADMIN ———");
  await login(page, "admin", adminAccount);
  for (const mod of adminModules) {
    await captureModule(page, mod, results);
  }

  console.log("\n——— COMPTA ———");
  await clearSession(page);
  await login(page, "compta", comptaAccount);
  for (const mod of comptaModules) {
    await captureModule(page, mod, results);
  }

  await browser.close();

  const html = buildHtml(results);
  fs.writeFileSync(OUTPUT_HTML, html, "utf8");
  console.log(`\n✅ Rapport HTML : ${OUTPUT_HTML}`);
  console.log(`   Captures : ${results.filter((r) => r.captureOk).length}/${results.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
