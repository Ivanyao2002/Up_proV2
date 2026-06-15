/**
 * Debug classification chat onboarding — OCR Paddle + classifyDocumentFromText
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Compile TS on the fly via tsx if available, else dynamic import built — use child process
const { classifyDocumentFromText } = await import(
  "../src/app/api/admin/assistant/onboarding/classifyDocument.ts"
);

const PADDLE = process.env.PADDLE_OCR_BASE_URL ?? "https://uat.upjunoo.com/ocr-api";
const ASSETS = path.join(
  ROOT,
  "..",
  ".cursor",
  "projects",
  "c-Users-c-romaric-Documents-DEV-Up-prov2",
  "assets"
);

const FILES = [
  { name: "carte_grise.png", pattern: "carte_grise-dd6ddb8f" },
  { name: "permis_p1.png", pattern: "permis_p1" },
  { name: "id_part2.png", pattern: "id_part2" },
  { name: "id_part1.png", pattern: "id_part1" },
  { name: "carte_grise_2.png", pattern: "carte_grise_2" },
  { name: "permis_p2.png", pattern: "permis_p2" },
];

function findAsset(pattern) {
  if (!fs.existsSync(ASSETS)) return null;
  return fs.readdirSync(ASSETS).find((f) => f.includes(pattern)) ?? null;
}

async function ocrFile(filePath) {
  const buf = fs.readFileSync(filePath);
  const form = new FormData();
  form.append("file", new Blob([buf]), path.basename(filePath));
  const res = await fetch(`${PADDLE}/ocr`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`OCR HTTP ${res.status}`);
  const data = await res.json();
  if (typeof data.full_text === "string" && data.full_text.trim()) return data.full_text.trim();
  if (Array.isArray(data.lines)) return data.lines.map((l) => l.text ?? "").filter(Boolean).join("\n");
  return JSON.stringify(data).slice(0, 500);
}

console.log("Paddle:", PADDLE);
console.log("Assets:", ASSETS, fs.existsSync(ASSETS) ? "OK" : "MISSING\n");

for (const { name, pattern } of FILES) {
  const asset = findAsset(pattern);
  if (!asset) {
    console.log(`\n=== ${name} — fichier introuvable (${pattern}) ===`);
    continue;
  }
  const full = path.join(ASSETS, asset);
  console.log(`\n=== ${name} ===`);
  let text = "";
  try {
    text = await ocrFile(full);
  } catch (e) {
    console.log("OCR error:", e.message);
    continue;
  }
  const preview = text.replace(/\s+/g, " ").slice(0, 280);
  console.log("OCR preview:", preview);
  const cls = classifyDocumentFromText(text);
  console.log("Classification:", JSON.stringify(cls));
}
