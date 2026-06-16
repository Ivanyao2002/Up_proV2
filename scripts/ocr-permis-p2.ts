import fs from "node:fs";
import { classifyDocumentFromText } from "../src/app/api/admin/assistant/onboarding/classifyDocument";

const img =
  "C:/Users/c.romaric/.cursor/projects/c-Users-c-romaric-Documents-DEV-Up-prov2/assets/c__Users_c.romaric_AppData_Roaming_Cursor_User_workspaceStorage_219f3f571564536540922556a7c48935_images_permis_p2-e64b0067-0ccf-4dfe-9b17-f542ee2d0187.png";

async function main() {
  if (!fs.existsSync(img)) {
    console.error("Image introuvable:", img);
    process.exit(1);
  }

  const buf = fs.readFileSync(img);
  const form = new FormData();
  form.append("file", new Blob([buf], { type: "image/png" }), "permis_p2.png");

  const paddle = process.env.PADDLE_OCR_BASE_URL ?? "https://uat.upjunoo.com/ocr-api";
  const res = await fetch(`${paddle}/ocr`, { method: "POST", body: form });
  const data = await res.json();
  const text =
    (typeof data.full_text === "string" && data.full_text) ||
    (Array.isArray(data.lines)
      ? data.lines.map((l: { text?: string }) => l.text ?? "").join("\n")
      : "");

  console.log("=== OCR TEXT ===");
  console.log(text);
  console.log("\n=== CLASSIFICATION ===");
  console.log(JSON.stringify(classifyDocumentFromText(text), null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
