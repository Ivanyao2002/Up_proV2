/**
 * Pipeline complet : captures → HTML → PDF pour admin et/ou compta.
 * Usage:
 *   node scripts/generate-user-guides.mjs admin compta
 *   node scripts/generate-user-guides.mjs admin
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getGuidePortalMeta } from "./guide-portal-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function run(cmd, args, label) {
  console.log(`\n===== ${label} =====\n`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", shell: true });
  if (r.status !== 0) {
    console.error(`Échec: ${label}`);
    process.exit(r.status ?? 1);
  }
}

function ensurePlaywright() {
  try {
    import.meta.resolve("playwright");
    return;
  } catch {
    console.log("Installation Playwright (one-shot)…");
    run("npm", ["install", "--no-save", "playwright"], "npm install playwright");
    run("npx", ["playwright", "install", "chromium"], "playwright install chromium");
  }
}

function main() {
  const portals = process.argv.slice(2).filter((p) => p === "admin" || p === "compta");
  const targets = portals.length ? portals : ["admin", "compta"];

  fs.mkdirSync(path.join(ROOT, "guide-pdf"), { recursive: true });
  ensurePlaywright();

  for (const portal of targets) {
    const meta = getGuidePortalMeta(portal);
    run("node", [`scripts/capture-user-guide-screenshots.mjs`, portal], `Captures ${portal}`);
    run("node", [`scripts/build-user-guide.mjs`, portal], `HTML ${portal}`);
    run(
      "node",
      [
        "scripts/html-to-pdf.mjs",
        path.join("guide-pdf", meta.htmlName),
        path.join("guide-pdf", meta.pdfName),
      ],
      `PDF ${portal}`
    );
    console.log(`\n✅ ${portal}: guide-pdf/${meta.htmlName} + guide-pdf/${meta.pdfName}\n`);
  }
}

main();
