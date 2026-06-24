/**
 * Génère le HTML du guide utilisateur à partir du manifest de captures.
 * Usage: node scripts/build-user-guide.mjs admin|compta
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GUIDE_CSS } from "./guide-styles.mjs";
import { getGuidePages, getGuidePortalMeta } from "./guide-portal-config.mjs";
import { sortGuideModules } from "./guide-nav-order.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function groupPages(pages) {
  const groups = new Map();
  for (const p of pages) {
    if (!groups.has(p.group)) groups.set(p.group, []);
    groups.get(p.group).push(p);
  }
  return groups;
}

function buildCover(meta, portal, manifest, pageCount) {
  const ok = manifest?.results?.filter((r) => r.ok).length ?? pageCount;
  const total = manifest?.results?.length ?? pageCount;
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `
<div class="page">
  <div class="header">
    <h1>${esc(meta.title)}</h1>
    <div class="meta">${esc(meta.subtitle)} · Généré le ${esc(date)}</div>
  </div>
  <div class="stats-grid">
    <div class="stat-card"><h3>${total}</h3><p>Écrans documentés</p></div>
    <div class="stat-card"><h3>${ok}</h3><p>Captures réussies</p></div>
    <div class="stat-card"><h3>${portal === "admin" ? "8" : "4"}</h3><p>Sections menu</p></div>
  </div>
  <div class="summary-box">
    <h4>Objectif du document</h4>
    <ul>
      <li>Présenter les écrans du portail <strong>${esc(portal)}</strong> dans l'ordre du menu latéral.</li>
      <li>Illustrer chaque page avec une capture d'écran et les actions principales.</li>
      <li>Faciliter l'onboarding des équipes admin et comptabilité UpJunoo.</li>
    </ul>
  </div>
  <div class="alert-box">
    <strong>Connexion :</strong> utilisez les identifiants fournis par votre administrateur.
    URL de connexion : <code>${esc(manifest?.baseUrl ?? "https://uat.upjunoo.com/pro")}${esc(getGuidePortalMeta(portal).loginPath)}</code>
  </div>
  <div class="footer">UpJunoo Pro · Guide utilisateur · Document interne</div>
</div>`;
}

function buildToc(pages) {
  const groups = groupPages(pages);
  let toc = `<div class="page"><div class="header"><h1>Sommaire</h1><div class="meta">Navigation par section</div></div>`;
  for (const [group, items] of groups) {
    toc += `<div class="toc-group">${esc(group)}</div>`;
    for (const item of items) {
      toc += `<div class="toc-item"><span>${esc(item.label)}</span><span>${esc(item.path)}</span></div>`;
    }
  }
  toc += `<div class="footer">UpJunoo Pro · Sommaire</div></div>`;
  return toc;
}

function buildSectionPages(pages, manifestBySlug, outputDir) {
  const groups = groupPages(pages);
  const chunks = [];
  let current = `<div class="page"><div class="header"><h1>Écrans détaillés</h1><div class="meta">Captures et mode d'emploi</div></div>`;
  let blocks = 0;

  for (const [group, items] of groups) {
    current += `<div class="section"><div class="section-title">${esc(group)}</div>`;
    for (const item of items) {
      const cap = manifestBySlug.get(item.slug);
      const imgRel = cap?.file ? `${outputDir}/${cap.file}` : null;
      const imgAbs = imgRel
        ? path.join(ROOT, "guide-pdf", outputDir, "screenshots", `${item.slug}.png`)
        : null;
      const imgExists = imgAbs && fs.existsSync(imgAbs);

      current += `<div class="capture-block">
        <h3>${esc(item.label)}</h3>
        <div class="capture-path">${esc(item.path)}</div>
        <p style="font-size:12px;margin-bottom:8px;">${esc(item.objectif)}</p>
        <ul class="usage-list">${item.usage.map((u) => `<li>${esc(u)}</li>`).join("")}</ul>`;

      if (imgExists) {
        current += `<img class="capture-img" src="${esc(imgRel)}" alt="${esc(item.label)}"/>`;
      } else if (cap?.ok === false) {
        current += `<div class="capture-missing">Capture indisponible — ${esc(cap.error ?? "erreur")}</div>`;
      } else {
        current += `<div class="capture-missing">Capture non générée — relancer le script de capture.</div>`;
      }
      current += `</div>`;
      blocks += 1;

      if (blocks >= 2) {
        current += `</div><div class="footer">UpJunoo Pro · ${esc(group)}</div></div>`;
        chunks.push(current);
        current = `<div class="page"><div class="header"><h1>Écrans détaillés (suite)</h1></div><div class="section">`;
        blocks = 0;
      }
    }
    current += `</div>`;
  }

  current += `<div class="footer">UpJunoo Pro · Fin du guide</div></div>`;
  chunks.push(current);
  return chunks.join("\n");
}

function buildLoginPage(meta) {
  return `
<div class="page">
  <div class="header"><h1>Connexion au portail</h1><div class="meta">${esc(meta.loginPath)}</div></div>
  <div class="summary-box">
    <h4>Étapes</h4>
    <ul>
      <li>Ouvrir l'URL de connexion du portail.</li>
      <li>Saisir votre adresse e-mail professionnelle.</li>
      <li>Saisir votre mot de passe et valider.</li>
      <li>Vous êtes redirigé vers ${esc(meta.homePath)}.</li>
    </ul>
  </div>
  <div class="footer">UpJunoo Pro · Connexion</div>
</div>`;
}

export function buildGuideHtml(portal, manifest) {
  const meta = getGuidePortalMeta(portal);
  let pages = getGuidePages(portal);
  pages = sortGuideModules(
    pages.map((p) => ({ ...p, portal, path: p.path, group: p.group, label: p.label }))
  );

  const manifestBySlug = new Map(
    (manifest?.results ?? []).map((r) => [r.slug, r])
  );

  const dateTag = new Date().toISOString().slice(0, 10);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${esc(meta.title)} — ${dateTag}</title>
  <style>${GUIDE_CSS}</style>
</head>
<body>
${buildCover(meta, portal, manifest, pages.length)}
${buildToc(pages)}
${buildLoginPage(meta)}
${buildSectionPages(pages, manifestBySlug, meta.outputDir)}
</body>
</html>`;
}

function main() {
  const portal = process.argv[2];
  if (portal !== "admin" && portal !== "compta") {
    console.error("Usage: node scripts/build-user-guide.mjs admin|compta");
    process.exit(1);
  }

  const meta = getGuidePortalMeta(portal);
  const guideDir = path.join(ROOT, "guide-pdf", meta.outputDir);
  const manifestPath = path.join(guideDir, "manifest.json");

  let manifest = null;
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  }

  const html = buildGuideHtml(portal, manifest);
  const outHtml = path.join(ROOT, "guide-pdf", meta.htmlName);
  fs.mkdirSync(path.dirname(outHtml), { recursive: true });
  fs.writeFileSync(outHtml, html, "utf8");
  console.log(`HTML généré : ${outHtml}`);
}

main();
