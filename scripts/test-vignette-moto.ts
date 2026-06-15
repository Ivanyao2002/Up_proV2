import fs from "node:fs";
import { parseVehicleFields } from "../src/app/api/document-extract/vehicleDocumentParsers";

const img =
  "C:/Users/c.romaric/.cursor/projects/c-Users-c-romaric-Documents-DEV-Up-prov2/assets/c__Users_c.romaric_AppData_Roaming_Cursor_User_workspaceStorage_219f3f571564536540922556a7c48935_images_vignette_moto2-9572007e-0d29-49ad-a853-b9493bce8e28.png";

async function main() {
  const buf = fs.readFileSync(img);
  const form = new FormData();
  form.append("file", new Blob([buf], { type: "image/png" }), "vignette_moto2.png");
  console.log("file size:", buf.length);
  const res = await fetch("https://uat.upjunoo.com/ocr-api/ocr", { method: "POST", body: form });
  const raw = await res.text();
  console.log("status:", res.status, "body:", raw.slice(0, 500));
  const data = JSON.parse(raw) as {
    full_text?: string;
    lines?: { text?: string }[];
  };
  const text =
    data.full_text ||
    (Array.isArray(data.lines) ? data.lines.map((l: { text?: string }) => l.text ?? "").join("\n") : "");

  console.log("=== OCR ===\n");
  console.log(text);
  console.log("\n=== PARSED ===\n");
  console.log(JSON.stringify(parseVehicleFields(text, "vignette"), null, 2));
}

main().catch(console.error);
