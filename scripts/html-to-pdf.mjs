/**
 * Converts an HTML file to PDF using puppeteer-core + local Chrome.
 * Usage: node scripts/html-to-pdf.mjs <input.html> [output.pdf]
 */
import puppeteer from "puppeteer-core";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const inputArg = process.argv[2];
if (!inputArg) {
  console.error("Usage: node scripts/html-to-pdf.mjs <input.html> [output.pdf]");
  process.exit(1);
}

const inputPath = path.resolve(inputArg);
const outputPath = process.argv[3]
  ? path.resolve(process.argv[3])
  : inputPath.replace(/\.html$/i, ".pdf");

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

if (!fs.existsSync(inputPath)) {
  console.error("File not found:", inputPath);
  process.exit(1);
}

console.log(`📄 Converting: ${path.basename(inputPath)}`);
console.log(`💾 Output:     ${outputPath}`);

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const page = await browser.newPage();
await page.goto(`file:///${inputPath.replace(/\\/g, "/")}`, {
  waitUntil: "networkidle0",
  timeout: 30000,
});

// Patch: remove page-break-after on last .page, ensure no blank trailing pages
await page.addStyleTag({
  content: `
    .page:last-child { page-break-after: avoid !important; }
    @media print {
      .page { page-break-after: auto !important; }
      .page:last-child { page-break-after: avoid !important; }
    }
  `,
});

await page.pdf({
  path: outputPath,
  format: "A4",
  printBackground: true,
  margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
});

await browser.close();
console.log(`✅ PDF generated: ${outputPath}`);
