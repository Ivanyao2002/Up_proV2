import type {
  DocumentExtractionResult,
  ExtractionDocumentType,
} from "@/features/fleet/lib/documentExtraction.types";
import { resolveColorSlug } from "@/shared/lib/vehicleMapIcons";

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

/** Plaque récente CI : AA-544-VQ-01 · ancien format : CI-4012-AA-01 */
const PLATE_PATTERNS = [
  /\bIMMATRICULATION\s*[:\-]?\s*([A-Z]{2}[\s-]\d{3}[\s-][A-Z]{2}[\s-]\d{2})\b/i,
  /\bNUMERO\s*D['']?\s*IMMATRICULATION\s*[:\-]?\s*([A-Z]{2}[\s-]\d{3}[\s-][A-Z]{2}[\s-]\d{2})\b/i,
  /\b([A-Z]{2}[\s-]\d{3}[\s-][A-Z]{2}[\s-]\d{2})\b/,
  /\b(CI[\s-]?\d{3,4}[\s-]?[A-Z]{1,3}[\s-]?\d{2})\b/i,
];

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

const VEHICLE_LABEL_LINES =
  /^(MARQUE|MODELE|TYPE|COULEUR|GENRE|GENTE|ENERGIE|CARROSSERIE|USAGE|PUISSANCE|CYLINDREE|PLACES|IMMATRICULATION|NUMERO)/i;

/** Valeurs carte grise qui ne sont pas une marque (erreurs OCR fréquentes incluses). */
const SKIP_BRAND_VALUES = new Set([
  "GENRE",
  "GENTE",
  "VOITURE",
  "VOITURES",
  "AUTOMOBILE",
  "AUTO",
  "PRIVE",
  "PRIVEE",
  "PUBLIC",
  "ESSENCE",
  "DIESEL",
  "ELECTRIQUE",
  "HYBRIDE",
  "GPL",
  "CARROSSERIE",
  "USAGE",
  "TYPE",
  "COMMERCIAL",
  "COMMERCIALE",
  "MARQUE",
  "MODELE",
  "COULEUR",
  "COND",
  "INT",
  "PTS",
  "PLACES",
  "ASSISES",
  "MISE",
  "CIRCULATION",
  "IMMATRICULATION",
  "EDITION",
  "IDENTITE",
  "PROPRIETAIRE",
  "MINISTERE",
  "TRANSPORTS",
  "REPUBLIQUE",
  "COTE",
  "IVOIRE",
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

function isPlausibleVehicleValue(value: string): boolean {
  const v = cleanToken(value);
  if (v.length < 1 || v.length > 40) return false;
  if (VEHICLE_LABEL_LINES.test(v)) return false;
  return /[A-Za-zÀ-ÿ0-9]/.test(v);
}

function isPlausibleBrand(value: string): boolean {
  if (!isPlausibleVehicleValue(value)) return false;
  const u = upper(cleanToken(value));
  const first = u.split(/[\s\-_/]+/).filter(Boolean)[0] ?? u;
  if (SKIP_BRAND_VALUES.has(u) || SKIP_BRAND_VALUES.has(first)) return false;
  if (u.length < 2) return false;
  return true;
}

function valueAfterLabelWithin(
  text: string,
  specs: { labelOnly: RegExp; inline?: RegExp }[],
  validate: (v: string) => boolean,
  maxLookahead = 4
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
        for (let j = i + 1; j <= i + maxLookahead && j < lines.length; j += 1) {
          const candidate = lines[j]!;
          if (validate(candidate)) return cleanToken(candidate);
        }
      }
    }
  }
  return null;
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

function formatModel(value: string): string {
  const v = cleanToken(value);
  if (/^[A-Z0-9][A-Z0-9\-./]*$/i.test(v)) return v.toUpperCase();
  return titleCase(v);
}

function normalizePlate(raw: string): string {
  const parts = raw.replace(/\s+/g, "-").toUpperCase().split("-").filter(Boolean);
  if (parts[0] === "CI" && parts.length >= 3) {
    return `CI-${parts.slice(1).join("-")}`;
  }
  return parts.join("-");
}

function extractPlate(ocrText: string): string | undefined {
  for (const re of PLATE_PATTERNS) {
    const m = ocrText.match(re);
    if (m?.[1]) return normalizePlate(m[1]);
  }
  return undefined;
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

function extractColorFromOcr(ocrText: string): string | undefined {
  const fromLabel =
    valueAfterLabel(
      ocrText,
      [
        {
          labelOnly: /^COULEUR\s*$/i,
          inline: /^COULEUR\s*[:\-]\s*(.+)$/i,
        },
      ],
      isPlausibleVehicleValue
    ) ??
    singleLineValue(ocrText, /^COULEUR\s*[:\-]\s*(.+)$/i) ??
    singleLineValue(ocrText, /^COULEUR\s+(.+)$/i);

  if (fromLabel && resolveColorSlug(fromLabel)) {
    return titleCase(fromLabel);
  }

  const lines = ocrText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i += 1) {
    if (!/^COULEUR\b/i.test(lines[i]!)) continue;
    for (let j = i + 1; j <= i + 3 && j < lines.length; j += 1) {
      const candidate = lines[j]!;
      if (resolveColorSlug(candidate)) return titleCase(candidate);
    }
  }

  const window = upper(ocrText);
  const couleurIdx = window.indexOf("COULEUR");
  if (couleurIdx >= 0) {
    const slice = window.slice(couleurIdx, couleurIdx + 120);
    const word = slice.match(
      /\b(BLANC|BLANCHE|NOIR|NOIRE|GRIS|GRISE|ARGENT|ROUGE|BLEU|BLEUE|VERT|VERTE|JAUNE|ORANGE|MARRON)\b/
    )?.[1];
    if (word) return titleCase(word);
  }

  return undefined;
}

function extractBrandFromOcr(ocrText: string): string | undefined {
  const brandSpecs = [
    {
      labelOnly: /^MARQUE\s*$/i,
      inline: /^MARQUE\s*[:\-]\s*(.+)$/i,
    },
  ];

  return (
    valueAfterLabelWithin(ocrText, brandSpecs, isPlausibleBrand) ??
    (() => {
      const inline = singleLineValue(ocrText, /^MARQUE\s*[:\-]\s*(.+)$/i);
      return inline && isPlausibleBrand(inline) ? inline : undefined;
    })()
  );
}

function parseVehicleFromOcr(ocrText: string): {
  plate?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  warnings: string[];
} {
  const warnings: string[] = [];

  const plate = extractPlate(ocrText);

  const brand = extractBrandFromOcr(ocrText);

  const model =
    valueAfterLabel(
      ocrText,
      [
        {
          labelOnly: /^TYPE\s+COMMERCIAL(?:E)?\s*$/i,
          inline: /^TYPE\s+COMMERCIAL(?:E)?\s*[:\-]\s*(.+)$/i,
        },
        {
          labelOnly: /^MODELE\s*$/i,
          inline: /^MODELE\s*[:\-]\s*(.+)$/i,
        },
      ],
      isPlausibleVehicleValue
    ) ??
    singleLineValue(ocrText, /^TYPE\s+COMMERCIAL(?:E)?\s*[:\-]\s*(.+)$/i) ??
    singleLineValue(ocrText, /^MODELE\s*[:\-]\s*(.+)$/i);

  const color = extractColorFromOcr(ocrText);

  let year: number | undefined;
  const yearPatterns = [
    /(?:1ERE|PREMIERE)\s*MISE\s*EN\s*CIRCULATION\s*[:\-]?\s*(\d{2})[/.-](\d{2})[/.-](\d{4})/i,
    /DATE\s*DE\s*(?:1ERE|PREMIERE)\s*MISE\s*EN\s*CIRCULATION\s*[:\-]?\s*(\d{2})[/.-](\d{2})[/.-](\d{4})/i,
    /MISE\s*EN\s*CIRCULATION\s*[:\-]?\s*(\d{2})[/.-](\d{2})[/.-](\d{4})/i,
    /(\d{2})[/.-](\d{2})[/.-](20\d{2})/,
  ];
  for (const re of yearPatterns) {
    const m = ocrText.match(re);
    const y = m?.[3];
    if (y && /^20\d{2}$/.test(y)) {
      year = parseInt(y, 10);
      break;
    }
  }

  if (!plate) warnings.push("Immatriculation non détectée — saisie manuelle.");
  if (!brand) warnings.push("Marque non détectée — saisie manuelle.");
  if (!model) warnings.push("Modèle non détecté — saisie manuelle.");
  if (!color) warnings.push("Couleur non détectée — saisie manuelle.");
  if (!year) warnings.push("Année de mise en circulation non détectée — saisie manuelle.");

  return {
    plate,
    brand: brand ? titleCase(brand) : undefined,
    model: model ? formatModel(model) : undefined,
    year,
    color: color ?? undefined,
    warnings,
  };
}

function confidenceFromFields(found: number, expected: number): number {
  if (expected <= 0) return 0;
  return Math.min(1, Math.max(0.35, found / expected));
}

export function extractWithRulesFromOcr(
  documentType: ExtractionDocumentType,
  ocrText: string
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
    const v = parseVehicleFromOcr(trimmed);
    const found = [v.plate, v.brand, v.model, v.year, v.color].filter(Boolean).length;
    return {
      documentType,
      vehicle: {
        plate: v.plate ?? null,
        brand: v.brand ?? null,
        model: v.model ?? null,
        year: v.year ?? null,
        color: v.color ?? null,
        confidence: confidenceFromFields(found, 5),
      },
      warnings: v.warnings,
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
