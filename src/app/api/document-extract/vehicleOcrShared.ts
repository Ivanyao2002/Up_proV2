import { resolveColorSlug } from "@/shared/lib/vehicleMapIcons";

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function upper(text: string): string {
  return normalize(text).toUpperCase();
}

export function cleanToken(raw: string): string {
  return raw
    .replace(/[|:;,.]+$/g, "")
    .replace(/^[^A-Za-zÀ-ÿ0-9'’\-]+/, "")
    .trim();
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s'-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatModel(value: string): string {
  const v = cleanToken(value);
  if (/^[A-Z0-9][A-Z0-9\-./]*$/i.test(v)) return v.toUpperCase();
  return titleCase(v);
}

const VEHICLE_LABEL_LINES =
  /^(MARQUE|MODELE|TYPE|COULEUR|GENRE|GENTE|ENERGIE|CARROSSERIE|USAGE|PUISSANCE|CYLINDREE|PLACES|IMMATRICULATION|NUMERO)/i;

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
  "NA",
]);

export function isPlausibleVehicleValue(value: string): boolean {
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

export function valueAfterLabelWithin(
  text: string,
  specs: { labelOnly: RegExp; inline?: RegExp }[],
  validate: (v: string) => boolean,
  maxLookahead = 4
): string | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    const lineNorm = upper(line);
    for (const spec of specs) {
      if (spec.inline) {
        const inline = line.match(spec.inline) ?? lineNorm.match(spec.inline);
        if (inline?.[1] && validate(inline[1])) {
          return cleanToken(inline[1]);
        }
      }
      if (spec.labelOnly.test(line) || spec.labelOnly.test(lineNorm)) {
        for (let j = i + 1; j <= i + maxLookahead && j < lines.length; j += 1) {
          const candidate = lines[j]!;
          if (validate(candidate)) return cleanToken(candidate);
        }
      }
    }
  }
  return null;
}

export function valueAfterLabel(
  text: string,
  specs: { labelOnly: RegExp; inline?: RegExp }[],
  validate: (v: string) => boolean = isPlausibleVehicleValue
): string | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    const lineNorm = upper(line);
    for (const spec of specs) {
      if (spec.inline) {
        const inline = line.match(spec.inline) ?? lineNorm.match(spec.inline);
        if (inline?.[1] && validate(inline[1])) {
          return cleanToken(inline[1]);
        }
      }
      if (spec.labelOnly.test(line) || spec.labelOnly.test(lineNorm)) {
        const next = lines[i + 1];
        if (next && validate(next)) return cleanToken(next);
      }
    }
  }
  return null;
}

export function singleLineValue(text: string, inline: RegExp): string | undefined {
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    const m = trimmed.match(inline) ?? upper(trimmed).match(inline);
    if (m?.[1]) return cleanToken(m[1]);
  }
  return undefined;
}

const SKIP_PLATE_VALUES = new Set([
  "CENTRE",
  "STATION",
  "VALIDITE",
  "MAYELIA",
  "MARQUE",
  "ENERGIE",
  "ESSENCE",
  "VIGNETTE",
  "PUISSANCE",
  "MOBIL",
  "DATE",
  "TYPE",
  "NA",
  "DGI",
  "MOTO",
  "SERIE",
  "NSERIE",
  "NCC",
]);

const PLATE_PATTERNS = [
  /\bIMMATRICULATION[\s\S]{0,80}?\b(STM\d{10,})\b/i,
  /\b(STM\d{10,})\b/i,
  /\bIMMATRICULATION\s*[:\-]?\s*([A-Z]{2}[\s-]?\d{3}[\s-]?[A-Z]{2}[\s-]?\d{2})\b/i,
  /\bNUMERO\s*D['']?\s*IMMATRICULATION\s*[:\-]?\s*([A-Z]{2}[\s-]?\d{3}[\s-]?[A-Z]{2}[\s-]?\d{2})\b/i,
  /\bNUMERO\s*D['']?\s*IMMATRICULATION\s*[:\-]?\s*(\d{3,4}[\s-]?[A-Z]{2}[\s-]?\d{2})\b/i,
  /\bIMMATRICULATION\s*[:\-]?\s*(\d{3,4}[\s-]?[A-Z]{2}[\s-]?\d{2})\b/i,
  /\b([A-Z]{2}[\s-]?\d{3}[\s-]?[A-Z]{2}[\s-]?\d{2})\b/,
  /\b([A-Z]{2}\d{3}[A-Z]{2}\d{2})\b/,
  /\b(\d{4}[A-Z]{2}\d{2})\b/,
  /\b(\d{3}[A-Z]{2}\d{2})\b/,
  /\b(CI[\s-]?\d{3,4}[\s-]?[A-Z]{1,3}[\s-]?\d{2})\b/i,
  /\b(ABO\d{6,12})\b/i,
  /\b(WW[\s-]?CI[\s-]?\d{6,12})\b/i,
  /\b([A-Z]{2}\d{3}[A-Z]{2})\b/,
];

function tryNormalizePlateRaw(raw: string): string | undefined {
  const compact = raw
    .replace(/\s+/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  const packedNew = compact.match(/^([A-Z]{2})(\d{3})([A-Z]{2})(\d{2})$/);
  if (packedNew) {
    return `${packedNew[1]}-${packedNew[2]}-${packedNew[3]}-${packedNew[4]}`;
  }

  const oldPacked = compact.match(/^(\d{3,4})([A-Z]{2})(\d{2})$/);
  if (oldPacked) {
    return `${oldPacked[1]}-${oldPacked[2]}-${oldPacked[3]}`;
  }

  const ciPacked = compact.match(/^CI(\d{3,4})([A-Z]{1,3})(\d{2})$/);
  if (ciPacked) {
    return `CI-${ciPacked[1]}-${ciPacked[2]}-${ciPacked[3]}`;
  }

  const moto = compact.match(/^(ABO\d{6,12})$/);
  if (moto) return moto[1];

  const ww = compact.match(/^WWCI(\d{6,12})$/);
  if (ww) return `WW-CI-${ww[1]}`;

  const midPlate = compact.match(/^([A-Z]{2})(\d{3})([A-Z]{2})$/);
  if (midPlate) {
    return `${midPlate[1]}-${midPlate[2]}-${midPlate[3]}`;
  }

  return undefined;
}

function normalizePlate(raw: string): string {
  const fromCompact = tryNormalizePlateRaw(raw);
  if (fromCompact) return fromCompact;

  const parts = raw.replace(/\s+/g, "-").toUpperCase().split("-").filter(Boolean);
  if (parts[0] === "CI" && parts.length >= 3) {
    return `CI-${parts.slice(1).join("-")}`;
  }
  return parts.join("-");
}

function isPlausiblePlateValue(value: string): boolean {
  const v = cleanToken(value);
  if (v.length < 5 || v.length > 24) return false;
  const u = upper(v);
  if (SKIP_PLATE_VALUES.has(u)) return false;
  if (/^STM\d{10,}$/i.test(v)) return true;
  return tryNormalizePlateRaw(v) !== undefined || /^[A-Z0-9][A-Z0-9\s-]{4,}$/i.test(v);
}

export function extractPlate(ocrText: string, extraLabelSpecs?: {
  labelOnly: RegExp;
  inline?: RegExp;
}[]): string | undefined {
  for (const re of PLATE_PATTERNS) {
    const m = ocrText.match(re);
    if (m?.[1]) {
      const norm = tryNormalizePlateRaw(m[1]) ?? normalizePlate(m[1]);
      if (norm) return norm;
    }
  }

  const labelSpecs = [
    {
      labelOnly: /^NUMERO\s*D['']?\s*IMMATRICULATION\s*$/i,
      inline: /^NUMERO\s*D['']?\s*IMMATRICULATION\s*[:\-]?\s*(.+)$/i,
    },
    {
      labelOnly: /^IMMATRICULATION\s*$/i,
      inline: /^IMMATRICULATION\s*[:\-]?\s*(.+)$/i,
    },
    ...(extraLabelSpecs ?? []),
  ];

  const fromLabel = valueAfterLabelWithin(ocrText, labelSpecs, isPlausiblePlateValue, 6);
  if (fromLabel) {
    return tryNormalizePlateRaw(fromLabel) ?? normalizePlate(fromLabel);
  }

  return undefined;
}

export function extractBrandFromOcr(ocrText: string): string | undefined {
  const brandSpecs = [
    {
      labelOnly: /^MARQUE\s*$/i,
      inline: /^MARQUE\s*[:\-]?\s*(.+)$/i,
    },
  ];

  return (
    valueAfterLabelWithin(ocrText, brandSpecs, isPlausibleBrand) ??
    (() => {
      const inline =
        singleLineValue(ocrText, /^MARQUE\s*[:\-]\s*(.+)$/i) ??
        singleLineValue(ocrText, /^MARQUE\s+(.+)$/i) ??
        singleLineValue(ocrText, /^MARQUE([A-Z0-9][A-Z0-9\-]{1,20})$/i);
      return inline && isPlausibleBrand(inline) ? inline : undefined;
    })() ??
    extractKnownBrandToken(ocrText)
  );
}

const KNOWN_VEHICLE_BRANDS = [
  "SUZUKI",
  "TOYOTA",
  "HYUNDAI",
  "KIA",
  "PEUGEOT",
  "RENAULT",
  "NISSAN",
  "HONDA",
  "MITSUBISHI",
  "FORD",
  "CHEVROLET",
  "MERCEDES",
  "BMW",
  "VOLKSWAGEN",
  "APSONIC",
  "KTM",
  "YAMAHA",
  "BAJAJ",
  "TVS",
  "KAPANOU",
];

/** Repère une marque connue dans le texte (utile pour champs manuscrits). */
export function extractKnownBrandToken(ocrText: string): string | undefined {
  const n = upper(ocrText);
  for (const brand of KNOWN_VEHICLE_BRANDS) {
    if (new RegExp(`\\b${brand}\\b`).test(n)) {
      return titleCase(brand);
    }
  }
  return undefined;
}

export function extractColorFromOcr(ocrText: string): string | undefined {
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
    const slice = window.slice(couleurIdx, couleurIdx + 80);
    const word = slice.match(
      /\b(BLANC|BLANCHE|NOIR|NOIRE|GRIS|GRISE|ARGENT|ROUGE|BLEU|BLEUE|VERT|VERTE|JAUNE|ORANGE|MARRON)\b/
    )?.[1];
    if (word) return titleCase(word);
  }

  const compact = window.match(
    /\bCOULEUR\s*[:\-]?\s*(BLANC|BLANCHE|NOIR|NOIRE|GRIS|GRISE|ARGENT|ROUGE|BLEU|BLEUE|VERT|VERTE|JAUNE|ORANGE|MARRON)\b/
  )?.[1];
  if (compact) return titleCase(compact);

  return undefined;
}

const YEAR_PATTERNS = [
  /(?:1ERE|PREMIERE)\s*MISE\s*EN\s*CIRCULATION\s*[:\-]?\s*(\d{2})[/.-](\d{2})[/.-](\d{4})/i,
  /DATE\s*DE\s*(?:1ERE|PREMIERE)\s*MISE\s*EN\s*CIRCULATION\s*[:\-]?\s*(\d{2})[/.-](\d{2})[/.-](\d{4})/i,
  /DATE\s*MISE\s*EN\s*CC\.?\s*[:\-]?\s*(\d{2})[/.-](\d{2})[/.-](\d{4})/i,
  /MISE\s*EN\s*CIRC(?:ULATION)?\.?\s*[:\-]?\s*(\d{2})[/.-](\d{2})[/.-](\d{4})/i,
];

export function extractYearFromOcr(ocrText: string): number | undefined {
  for (const re of YEAR_PATTERNS) {
    const m = ocrText.match(re);
    const y = m?.[3];
    if (y && /^20\d{2}$/.test(y)) {
      return parseInt(y, 10);
    }
  }
  return undefined;
}

/** Année de mise en circulation sur vignette DGI (dates souvent sur plusieurs lignes OCR). */
export function extractVignetteYearFromOcr(ocrText: string): number | undefined {
  const fromStandard = extractYearFromOcr(ocrText);
  if (fromStandard) return fromStandard;

  const lines = ocrText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i += 1) {
    if (!/DATE\s*MISE\s*EN\s*CC/i.test(lines[i]!)) continue;
    let lastYear: number | undefined;
    for (let j = i + 1; j <= i + 8 && j < lines.length; j += 1) {
      const m = lines[j]!.match(/^(\d{2})[/.-](\d{2})[/.-](20\d{2})$/);
      if (m?.[3]) lastYear = parseInt(m[3], 10);
      if (/^(MARQUE|NCC|NSERIE|VIGNETTE|TYPE)\b/i.test(lines[j]!)) break;
    }
    if (lastYear) return lastYear;
  }
  return undefined;
}

export function extractModelFromOcr(
  ocrText: string,
  extraSpecs?: { labelOnly: RegExp; inline?: RegExp }[]
): string | undefined {
  const specs = [
    {
      labelOnly: /^TYPE\s+COMMERCIAL(?:E)?\s*$/i,
      inline: /^TYPE\s+COMMERCIAL(?:E)?\s*[:\-]\s*(.+)$/i,
    },
    {
      labelOnly: /^MODELE\s*$/i,
      inline: /^MODELE\s*[:\-]?\s*(.+)$/i,
    },
    {
      labelOnly: /^TYPE\s*$/i,
      inline: /^TYPE\s*[:\-]\s*(.+)$/i,
    },
    ...(extraSpecs ?? []),
  ];

  return (
    valueAfterLabel(ocrText, specs, isPlausibleVehicleValue) ??
    singleLineValue(ocrText, /^TYPE\s+COMMERCIAL(?:E)?\s*[:\-]\s*(.+)$/i) ??
    singleLineValue(ocrText, /^MODELE\s*[:\-]?\s*(.+)$/i) ??
    singleLineValue(ocrText, /^TYPE\s*[:\-]\s*(.+)$/i)
  );
}

export type ParsedVehicleFields = {
  plate?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  warnings: string[];
};

export function parseCarteGriseFromOcr(ocrText: string): ParsedVehicleFields {
  const warnings: string[] = [];
  const plate = extractPlate(ocrText);
  const brand = extractBrandFromOcr(ocrText);
  const model = extractModelFromOcr(ocrText);
  const color = extractColorFromOcr(ocrText);
  const year = extractYearFromOcr(ocrText);

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

export function confidenceFromVehicleFields(
  fields: Pick<ParsedVehicleFields, "plate" | "brand" | "model" | "year" | "color">
): number {
  const found = [fields.plate, fields.brand, fields.model, fields.year, fields.color].filter(
    Boolean
  ).length;
  if (found <= 0) return 0;
  return Math.min(1, Math.max(0.35, found / 5));
}
