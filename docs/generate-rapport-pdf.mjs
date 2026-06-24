/**
 * Génère RAPPORT-ACTIVITE-UPJUNOO-PRO.pdf depuis le HTML.
 * Windows : Chrome/Edge headless (sans dépendance npm).
 * Sinon : npx -p puppeteer node docs/generate-rapport-pdf.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseName = process.argv[2] ?? "RAPPORT-ACTIVITE-UPJUNOO-PRO";
const htmlPath = path.join(__dirname, `${baseName}.html`);
const pdfPath = path.join(__dirname, `${baseName}.pdf`);

if (!fs.existsSync(htmlPath)) {
  console.error(`Fichier introuvable : ${htmlPath}`);
  process.exit(1);
}
const fileUri = "file:///" + htmlPath.replace(/\\/g, "/");

const browsers = [
  path.join(process.env.ProgramFiles ?? "", "Google/Chrome/Application/chrome.exe"),
  path.join(
    process.env["ProgramFiles(x86)"] ?? "",
    "Microsoft/Edge/Application/msedge.exe"
  ),
  path.join(process.env.ProgramFiles ?? "", "Microsoft/Edge/Application/msedge.exe"),
].filter((p) => fs.existsSync(p));

if (browsers.length > 0) {
  const exe = browsers[0];
  const r = spawnSync(
    exe,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      `--print-to-pdf=${pdfPath}`,
      fileUri,
    ],
    { encoding: "utf8", timeout: 120_000 }
  );
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    process.exit(1);
  }
  console.log("PDF créé :", pdfPath);
  process.exit(0);
}

const puppeteer = await import("puppeteer").then((m) => m.default);
const browser = await puppeteer.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(fileUri, { waitUntil: "networkidle0", timeout: 120_000 });
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  console.log("PDF créé :", pdfPath);
} finally {
  await browser.close();
}
