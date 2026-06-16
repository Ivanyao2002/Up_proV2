import type {
  DocumentExtractionResult,
  ExtractionDocumentType,
  VehicleIdentitySubtype,
} from "@/features/fleet/lib/documentExtraction.types";
import {
  parseVehicleFields,
  vehicleFieldsToExtractionResult,
} from "./vehicleDocumentParsers";

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function upper(text: string): string {
  return normalize(text).toUpperCase();
}

const NNI_RE = /\b(\d{10,11})\b/;

const SKIP_NAME_TOKENS = new Set([
  "NOM",
  "PRENOM",
  "PRENOMS",
  "NOMS",
  "SEXE",
  "M",
  "F",
  "NE",
  "LE",
  "A",
  "NATIONALITE",
  "IVOIRIENNE",
  "IVOIRIEN",
  "DATE",
  "LIEU",
  "NAISSANCE",
  "TAILLE",
  "PROFESSION",
  "DOMICILE",
  "CARTE",
  "NATIONALE",
  "IDENTITE",
  "REPUBLIQUE",
  "COTE",
  "IVOIRE",
  "MINISTERE",
  "INTERIEUR",
  "SECURITE",
]);

function cleanToken(raw: string): string {
  return raw
    .replace(/[|:;,.]+$/g, "")
    .replace(/^[^A-Za-zÀ-ÿ0-9'’\-]+/, "")
    .trim();
}

function isPlausibleName(value: string): boolean {
  const v = cleanToken(value);
  if (v.length < 2 || v.length > 40) return false;
  const u = upper(v);
  if (SKIP_NAME_TOKENS.has(u)) return false;
  if (/^\d+$/.test(v)) return false;
  if (!/[A-Za-zÀ-ÿ]/.test(v)) return false;
  return true;
}

/** Extrait valeur après libellé (ligne suivante ou même ligne). */
function valueAfterLabel(
  text: string,
  specs: { labelOnly: RegExp; inline?: RegExp }[],
  validate: (v: string) => boolean = isPlausibleName
): string | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    for (const spec of specs) {
      if (spec.inline) {
        const inline = line.match(spec.inline);
        if (inline?.[1] && validate(inline[1])) {
          return cleanToken(inline[1]);
        }
      }
      if (spec.labelOnly.test(line)) {
        const next = lines[i + 1];
        if (next && validate(next)) return cleanToken(next);
      }
    }
  }
  return null;
}

function singleLineValue(text: string, inline: RegExp): string | undefined {
  for (const line of text.split(/\r?\n/)) {
    const m = line.trim().match(inline);
    if (m?.[1]) return cleanToken(m[1]);
  }
  return undefined;
}

function parseMrzNames(text: string): { last_name?: string; first_name?: string } {
  const n = upper(text);

  const line3 = n.match(/([A-Z]{2,})<<([A-Z<]{2,})/);
  if (line3) {
    const last = line3[1]!.replace(/<+/g, " ").trim();
    const first = line3[2]!.replace(/<+/g, " ").trim();
    if (isPlausibleName(last) && isPlausibleName(first)) {
      return { last_name: titleCase(last), first_name: titleCase(first) };
    }
  }

  const mrzMatch = n.match(/IDCIV[A-Z0-9<]{4,}<<([A-Z<]+)<<([A-Z<]+)/);
  if (mrzMatch) {
    const last = mrzMatch[1]!.replace(/<+/g, " ").trim();
    const first = mrzMatch[2]!.replace(/<+/g, " ").trim();
    if (isPlausibleName(last) && isPlausibleName(first)) {
      return { last_name: titleCase(last), first_name: titleCase(first) };
    }
  }

  return {};
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s'-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function parseDriverFromOcr(ocrText: string): {
  first_name?: string;
  last_name?: string;
  document_number?: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  const mrz = parseMrzNames(ocrText);

  const last_name =
    valueAfterLabel(ocrText, [
      {
        labelOnly: /^NOM(?:\s+DE\s+FAMILLE)?\s*$/i,
        inline: /^NOM(?:\s+DE\s+FAMILLE)?\s*[:\-]\s*(.+)$/i,
      },
    ]) ?? mrz.last_name;

  const first_name =
    valueAfterLabel(ocrText, [
      {
        labelOnly: /^PRENOMS?(\s*\([Ss]\))?\s*$/i,
        inline: /^PRENOMS?(\s*\([Ss]\))?\s*[:\-]\s*(.+)$/i,
      },
    ]) ?? mrz.first_name;

  const nniLine = ocrText.match(/NNI\s*[:\-]?\s*(\d{10,11})/i);
  const cniRef = ocrText.match(/\bCI\s*(\d{9,12})\b/i);
  const document_number =
    nniLine?.[1] ??
    (cniRef ? `CI${cniRef[1]}` : undefined) ??
    ocrText.match(/NUMERO\s*(?:DU\s*)?(?:PIECE|DOCUMENT|CNI)\s*[:\-]?\s*(\d{10,11})/i)?.[1] ??
    ocrText.match(NNI_RE)?.[1];

  const permisNo = ocrText.match(
    /(?:N[°O]|NUMERO)\s*(?:DU\s*)?PERMIS(?:\s*DE\s*CONDUIRE)?\s*[:\-]?\s*([A-Z0-9\-]{5,24})/i
  )?.[1];

  if (!last_name) warnings.push("Nom non détecté — saisie manuelle.");
  if (!first_name) warnings.push("Prénom non détecté — saisie manuelle.");
  if (!document_number && !permisNo) {
    warnings.push("Numéro de document non détecté — saisie manuelle.");
  }

  return {
    last_name: last_name ? titleCase(last_name) : undefined,
    first_name: first_name ? titleCase(first_name) : undefined,
    document_number: document_number ?? permisNo ?? undefined,
    warnings,
  };
}

function confidenceFromFields(found: number, expected: number): number {
  if (expected <= 0) return 0;
  return Math.min(1, Math.max(0.35, found / expected));
}

export function extractWithRulesFromOcr(
  documentType: ExtractionDocumentType,
  ocrText: string,
  vehicleSubtype?: VehicleIdentitySubtype | null
): DocumentExtractionResult {
  const trimmed = ocrText.trim();
  if (!trimmed) {
    return {
      documentType,
      warnings: ["OCR vide — vérifiez la qualité de la photo."],
      error: "Aucun texte OCR",
    };
  }

  if (documentType === "registration") {
    const parsed = parseVehicleFields(trimmed, vehicleSubtype);
    const extracted = vehicleFieldsToExtractionResult(parsed);
    return {
      documentType,
      vehicle: extracted.vehicle,
      vehicleSubtype: extracted.vehicleSubtype,
      warnings: extracted.warnings,
      error: null,
    };
  }

  const d = parseDriverFromOcr(trimmed);
  const found = [d.first_name, d.last_name, d.document_number].filter(Boolean).length;
  return {
    documentType,
    driver: {
      first_name: d.first_name ?? null,
      last_name: d.last_name ?? null,
      document_number: d.document_number ?? null,
      confidence: confidenceFromFields(found, 3),
    },
    warnings: d.warnings,
    error: null,
  };
}
