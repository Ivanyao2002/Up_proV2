import fs from "node:fs";
import { classifyDocumentFromText } from "../src/app/api/admin/assistant/onboarding/classifyDocument";
import { parseVehicleFields } from "../src/app/api/document-extract/vehicleDocumentParsers";

const img =
  "C:/Users/c.romaric/.cursor/projects/c-Users-c-romaric-Documents-DEV-Up-prov2/assets/c__Users_c.romaric_AppData_Roaming_Cursor_User_workspaceStorage_219f3f571564536540922556a7c48935_images_recepiss_-d1fdd622-f65e-438c-8672-c46519737216.png";

async function main() {
  const buf = fs.readFileSync(img);
  const form = new FormData();
  form.append("file", new Blob([buf]), "recepisse.png");
  const res = await fetch("https://uat.upjunoo.com/ocr-api/ocr", {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  console.log("HTTP", res.status, "line_count:", data.line_count, "keys:", Object.keys(data));
  const text =
    data.full_text ||
    (Array.isArray(data.lines) ? data.lines.map((l: { text?: string }) => l.text ?? "").join("\n") : "");

  console.log("=== OCR ===");
  console.log(text);
  console.log("\n=== CLASSIFY ===", classifyDocumentFromText(text));
  console.log("\n=== EXTRACT recepisse ===", parseVehicleFields(text, "recepisse_ww"));
  console.log("\n=== EXTRACT auto ===", parseVehicleFields(text));
}

main().catch(console.error);
