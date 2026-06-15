import fs from "node:fs";
import path from "node:path";
import { extractWithRulesFromOcr } from "../src/app/api/document-extract/rulesParser";

const ASSETS =
  "C:/Users/c.romaric/.cursor/projects/c-Users-c-romaric-Documents-DEV-Up-prov2/assets";

async function ocrFile(filePath: string): Promise<string> {
  const buf = fs.readFileSync(filePath);
  const form = new FormData();
  form.append("file", new Blob([buf]), path.basename(filePath));
  const res = await fetch("https://uat.upjunoo.com/ocr-api/ocr", { method: "POST", body: form });
  const data = await res.json();
  return (
    data.full_text ||
    (Array.isArray(data.lines) ? data.lines.map((l: { text?: string }) => l.text ?? "").join("\n") : "")
  );
}

function findAsset(fragment: string): string | null {
  if (!fs.existsSync(ASSETS)) return null;
  const hit = fs.readdirSync(ASSETS).find((f) => f.includes(fragment));
  return hit ? path.join(ASSETS, hit) : null;
}

async function main() {
  const pairs = [
    ["carte_grise_other", "carte_grise_other"],
    ["carte_grise_2", "carte_grise_2"],
    ["PART-2561", "PART-2561"],
  ];
  for (const [label, frag] of pairs) {
    const p = findAsset(frag);
    if (!p) {
      console.log(label, "— fichier absent");
      continue;
    }
    const text = await ocrFile(p);
    const solo = extractWithRulesFromOcr("registration", text);
    console.log(`\n=== ${label} (seul) ===`);
    console.log("OCR:", text.replace(/\s+/g, " ").slice(0, 200));
    console.log("vehicle:", solo.vehicle);
  }

  const other = findAsset("carte_grise_other");
  const verso = findAsset("carte_grise_2");
  if (other && verso) {
    const combined = `${await ocrFile(other)}\n\n---\n\n${await ocrFile(verso)}`;
    const merged = extractWithRulesFromOcr("registration", combined);
    console.log("\n=== recto other + verso 2 (concaténé comme l'API) ===");
    console.log("vehicle:", merged.vehicle);
  }
}

main().catch(console.error);
