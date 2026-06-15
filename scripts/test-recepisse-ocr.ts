import fs from "node:fs";
import path from "node:path";
import { classifyDocumentFromText } from "../src/app/api/admin/assistant/onboarding/classifyDocument";
import { parseVehicleFields } from "../src/app/api/document-extract/vehicleDocumentParsers";
import { extractTextFromPaddleResponse } from "../src/app/api/document-extract/paddleOcrClient";

const IMG =
  process.argv[2] ||
  "C:/Users/c.romaric/.cursor/projects/c-Users-c-romaric-Documents-DEV-Up-prov2/assets/c__Users_c.romaric_AppData_Roaming_Cursor_User_workspaceStorage_219f3f571564536540922556a7c48935_images_image-71bf114a-bdb5-4bae-b278-e520e1409051.png";

async function main() {
  const buf = fs.readFileSync(IMG);
  console.log("Fichier:", path.basename(IMG), `(${Math.round(buf.length / 1024)} Ko)`);

  const baseUrl = "https://uat.upjunoo.com/ocr-api";
  const form = new FormData();
  form.append("file", new Blob([buf], { type: "image/png" }), "recepisse.png");

  const res = await fetch(`${baseUrl}/ocr`, { method: "POST", body: form });
  const json = JSON.parse(await res.text()) as {
    line_count?: number;
    lines?: Array<{ text?: string; confidence?: number }>;
  };

  const text = extractTextFromPaddleResponse(json);
  console.log("HTTP:", res.status, "| lignes:", json.line_count, "| chars:", text.length);

  console.log("\n--- Lignes OCR ---");
  for (const [i, l] of (json.lines ?? []).entries()) {
    const conf = l.confidence != null ? ` (${Math.round(l.confidence * 100)}%)` : "";
    console.log(`${String(i + 1).padStart(2)}. ${l.text ?? ""}${conf}`);
  }

  console.log("\n--- Attendu sur le document ---");
  console.log("Marque: CHANGAN | Type: A2ABR | Couleur: NOIR");
  console.log("Plaque WW-CI: 2025-55429 | VIN: LS5A2ABR8TD922384 | Places: 5");

  console.log("\n--- Classification ---");
  console.log(classifyDocumentFromText(text));

  console.log("\n--- Extraction récépissé ---");
  console.log(JSON.stringify(parseVehicleFields(text, "recepisse_ww"), null, 2));
}

main().catch(console.error);
