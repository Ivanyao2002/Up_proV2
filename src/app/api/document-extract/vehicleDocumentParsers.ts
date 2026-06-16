import type { VehicleIdentitySubtype } from "@/features/fleet/lib/documentExtraction.types";
import {
  confidenceFromVehicleFields,
  extractBrandFromOcr,
  extractColorFromOcr,
  extractModelFromOcr,
  extractPlate,
  extractYearFromOcr,
  extractVignetteYearFromOcr,
  formatModel,
  normalize,
  parseCarteGriseFromOcr,
  singleLineValue,
  titleCase,
  upper,
  type ParsedVehicleFields,
  valueAfterLabel,
  isPlausibleVehicleValue,
} from "./vehicleOcrShared";

export function isRecepisseWwDoc(ocrText: string): boolean {
  const n = upper(normalize(ocrText));
  if (n.includes("RECEPISSE") && (n.includes("WW-CI") || n.includes("WW CI") || n.includes("SERIE WW"))) {
    return true;
  }
  if (n.includes("RECEPISSE") && n.includes("IMMATRICULATION") && n.includes("SERIE")) {
    return true;
  }
  if (n.includes("RECEPISSE D IMMATRICULATION") && n.includes("SERIE")) {
    return true;
  }
  return false;
}

function extractRecepisseWwPlate(ocrText: string): string | undefined {
  const patterns = [
    /NUMERO\s*(?:DE\s*LA\s*)?SERIE\s*WW[\s-]*CI[^\d\n]{0,48}(\d{4})\s*[/\-.]\s*(\d{3,8})/i,
    /SERIE\s*WW[\s-]*CI[^\d\n]{0,48}(\d{4})\s*[/\-.]\s*(\d{3,8})/i,
    /\bWW[\s-]*CI[\s-]*(\d{4})[\s/\-](\d{3,8})\b/i,
  ];
  for (const re of patterns) {
    const m = ocrText.match(re);
    if (m?.[1] && m?.[2]) {
      return `WW-CI-${m[1]}-${m[2]}`;
    }
  }
  if (isRecepisseWwDoc(ocrText)) {
    const loose = ocrText.match(/\b(20\d{2})\s*[/\-.]\s*(\d{4,6})\b/);
    if (loose?.[1] && loose?.[2]) {
      return `WW-CI-${loose[1]}-${loose[2]}`;
    }
  }
  return undefined;
}

function extractRecepisseType(ocrText: string): string | undefined {
  return (
    valueAfterLabel(
      ocrText,
      [
        {
          labelOnly: /^TYPE\s*$/i,
          inline: /^TYPE\s*[:\-]?\s*(.+)$/i,
        },
      ],
      isPlausibleVehicleValue
    ) ??
    singleLineValue(ocrText, /^TYPE\s+([A-Z0-9][A-Z0-9\s\-]{1,24})$/i) ??
    upper(ocrText).match(/\bTYPE\s+([A-Z]{1,3}\s?[A-Z]?\d{2,4})\b/)?.[1]?.trim()
  );
}

export const VEHICLE_IDENTITY_PRIORITY: Record<VehicleIdentitySubtype, number> = {
  carte_grise: 0,
  autorisation_provisoire: 1,
  recepisse_ww: 2,
  visite_technique: 3,
  vignette: 4,
  assurance: 5,
};

export function vehicleIdentityPriority(subtype?: VehicleIdentitySubtype | null): number {
  if (!subtype) return 99;
  return VEHICLE_IDENTITY_PRIORITY[subtype] ?? 99;
}

export function isAutorisationProvisoireDoc(ocrText: string): boolean {
  const n = upper(normalize(ocrText));
  if (n.includes("CARTE GRISE") || n.includes("CERTIFICAT D'IMMATRICULATION")) {
    return false;
  }
  if (
    n.includes("AUTORISATION PROVISOIRE") ||
    n.includes("AUTORISATION PROVISOIRE DE CIRCULER")
  ) {
    return true;
  }
  if (n.includes("AUTORISATION") && n.includes("PROVISOIRE")) return true;
  if (n.includes("AUTORISATION") && n.includes("CIRCULER") && n.includes("TRANSPORTS")) {
    return true;
  }
  if (n.includes("PROVISOIRE") && n.includes("CIRCULER") && n.includes("TRANSPORTS")) {
    return true;
  }
  if (
    n.includes("INFORMATIONS SUR LE VEHICULE") &&
    (n.includes("NUMERO DE CHASSIS") || n.includes("NUMERO DE CHRONO")) &&
    n.includes("TRANSPORTS")
  ) {
    return true;
  }
  return false;
}

export function detectVehicleSubtype(ocrText: string): VehicleIdentitySubtype {
  const n = upper(ocrText);

  if (isAutorisationProvisoireDoc(ocrText)) {
    return "autorisation_provisoire";
  }
  if (isRecepisseWwDoc(ocrText)) {
    return "recepisse_ww";
  }

  if (
    n.includes("CARTE GRISE") ||
    n.includes("CERTIFICAT D'IMMATRICULATION") ||
    n.includes("CERTIFICAT D IMMATRICULATION")
  ) {
    return "carte_grise";
  }
  if (n.includes("RECEPISSE") && (n.includes("WW-CI") || n.includes("SERIE WW"))) {
    return "recepisse_ww";
  }
  if (
    n.includes("CERTIFICAT DE CONTROLE TECHNIQUE") ||
    n.includes("CONTROLE TECHNIQUE") ||
    n.includes("VISITE TECHNIQUE")
  ) {
    return "visite_technique";
  }
  if (n.includes("VIGNETTE MOTO") || (n.includes("VIGNETTE") && n.includes("DGI"))) {
    return "vignette";
  }
  if (
    n.includes("ATTESTATION D'ASSURANCE") ||
    n.includes("ATTESTATION D ASSURANCE") ||
    (n.includes("ASSURANCE") && n.includes("IMMATRICULATION"))
  ) {
    return "assurance";
  }

  return "carte_grise";
}

function parseVignetteFromOcr(ocrText: string): ParsedVehicleFields {
  const warnings: string[] = [];
  const plate = extractPlate(ocrText, [
    {
      labelOnly: /^IMMATRICULATION\s*$/i,
      inline: /^IMMATRICULATION\s*[:\-]?\s*(.+)$/i,
    },
  ]);
  const brand = extractBrandFromOcr(ocrText);
  const year = extractVignetteYearFromOcr(ocrText);
  const modelRaw =
    valueAfterLabel(
      ocrText,
      [
        {
          labelOnly: /^TYPE\s*$/i,
          inline: /^TYPE\s*[:\-]\s*(.+)$/i,
        },
      ],
      (v) => isPlausibleVehicleValue(v) && upper(v) !== "NA"
    ) ?? singleLineValue(ocrText, /^TYPE\s*[:\-]\s*(.+)$/i);

  const model =
    modelRaw && upper(modelRaw) !== "NA" ? formatModel(modelRaw) : undefined;

  if (!plate) warnings.push("Immatriculation non détectée — saisie manuelle.");
  if (!brand) warnings.push("Marque non détectée — saisie manuelle.");
  if (!year) warnings.push("Date de mise en circulation non détectée — saisie manuelle.");
  if (!model) warnings.push("Type/modèle absent sur la vignette — saisie manuelle si besoin.");

  return {
    plate,
    brand: brand ? titleCase(brand) : undefined,
    model,
    year,
    warnings,
  };
}

function parseRecepisseWwFromOcr(ocrText: string): ParsedVehicleFields {
  const warnings: string[] = [];
  const plate = extractRecepisseWwPlate(ocrText);
  const brand = extractBrandFromOcr(ocrText);
  const model = extractRecepisseType(ocrText);
  const color = extractColorFromOcr(ocrText);

  if (!plate) warnings.push("Numéro de série WW-CI non détecté — saisie manuelle.");
  if (!brand) {
    warnings.push(
      "Marque manuscrite souvent mal lue par l'OCR — vérifiez ou saisissez manuellement."
    );
  }
  if (!model) warnings.push("Type non détecté — saisie manuelle.");
  if (!color) warnings.push("Couleur non détectée — saisie manuelle.");
  warnings.push(
    "Récépissé WW-CI : pas d'année de mise en circulation — saisissez-la si connue."
  );

  return {
    plate,
    brand: brand ? titleCase(brand) : undefined,
    model: model ? model.replace(/\s+/g, " ").trim().toUpperCase() : undefined,
    color: color ?? undefined,
    warnings,
  };
}

function parseAssuranceFromOcr(ocrText: string): ParsedVehicleFields {
  const warnings: string[] = [];
  const plate = extractPlate(ocrText, [
    {
      labelOnly: /^IMMATRICULATION\s*(?:OU\s*NUMERO\s*DE\s*CHASSIS)?\s*$/i,
      inline:
        /^IMMATRICULATION\s*(?:OU\s*NUMERO\s*DE\s*CHASSIS)?\s*[:\-]?\s*(.+)$/i,
    },
  ]);
  const brand = extractBrandFromOcr(ocrText);
  const model =
    extractModelFromOcr(ocrText) ??
    valueAfterLabel(
      ocrText,
      [
        {
          labelOnly: /^MODELE\s*$/i,
          inline: /^MODELE\s*[:\-]\s*(.+)$/i,
        },
      ],
      isPlausibleVehicleValue
    ) ??
    undefined;

  if (!plate) warnings.push("Immatriculation non détectée — saisie manuelle.");
  if (!brand) warnings.push("Marque non détectée — saisie manuelle.");
  if (!model) warnings.push("Modèle non détecté — saisie manuelle.");
  warnings.push(
    "Document assurance seul : année et couleur souvent absentes — carte grise ou équivalent recommandé."
  );

  return {
    plate,
    brand: brand ? titleCase(brand) : undefined,
    model: model ? formatModel(model) : undefined,
    warnings,
  };
}

function parseVisiteTechniqueFromOcr(ocrText: string): ParsedVehicleFields {
  const warnings: string[] = [];
  const plate = extractPlate(ocrText);
  const brand = extractBrandFromOcr(ocrText);
  const model = extractModelFromOcr(ocrText);
  const year = extractYearFromOcr(ocrText);

  if (!plate) warnings.push("Immatriculation non détectée — saisie manuelle.");
  if (!brand) warnings.push("Marque non détectée — saisie manuelle.");
  if (!model) warnings.push("Type/modèle non détecté — saisie manuelle.");
  if (!year) warnings.push("Année de mise en circulation non détectée — saisie manuelle.");

  return {
    plate,
    brand: brand ? titleCase(brand) : undefined,
    model: model ? formatModel(model) : undefined,
    year,
    warnings,
  };
}

function parseAutorisationProvisoireFromOcr(ocrText: string): ParsedVehicleFields {
  const warnings: string[] = [];
  const plate = extractPlate(ocrText, [
    {
      labelOnly: /^IMMATRICULATION\s*$/i,
      inline: /^IMMATRICULATION\s*[:\-]?\s*(.+)$/i,
    },
  ]);
  const brand = extractBrandFromOcr(ocrText);
  const model =
    extractModelFromOcr(ocrText) ??
    singleLineValue(ocrText, /^MODELE\s+(.+)$/i) ??
    upper(ocrText).match(/\bMODELE\s+([A-Z0-9][A-Z0-9\-]{1,12})\b/)?.[1];
  const color = extractColorFromOcr(ocrText);

  if (!plate) warnings.push("Immatriculation non détectée — saisie manuelle.");
  if (!brand) warnings.push("Marque non détectée — saisie manuelle.");
  if (!model) warnings.push("Modèle non détecté — saisie manuelle.");
  if (!color) warnings.push("Couleur non détectée — saisie manuelle.");
  warnings.push(
    "Autorisation provisoire : pas d'année de mise en circulation — saisissez-la si connue."
  );

  return {
    plate,
    brand: brand ? titleCase(brand) : undefined,
    model: model ? formatModel(model) : undefined,
    color: color ?? undefined,
    warnings,
  };
}

export function parseVehicleFields(
  ocrText: string,
  subtype?: VehicleIdentitySubtype | null
): ParsedVehicleFields & { vehicleSubtype: VehicleIdentitySubtype } {
  const trimmed = ocrText.trim();
  const resolved = subtype ?? detectVehicleSubtype(trimmed);

  switch (resolved) {
    case "vignette":
      return { ...parseVignetteFromOcr(trimmed), vehicleSubtype: resolved };
    case "recepisse_ww":
      return { ...parseRecepisseWwFromOcr(trimmed), vehicleSubtype: resolved };
    case "assurance":
      return { ...parseAssuranceFromOcr(trimmed), vehicleSubtype: resolved };
    case "visite_technique":
      return { ...parseVisiteTechniqueFromOcr(trimmed), vehicleSubtype: resolved };
    case "autorisation_provisoire":
      return { ...parseAutorisationProvisoireFromOcr(trimmed), vehicleSubtype: resolved };
    case "carte_grise":
    default:
      return { ...parseCarteGriseFromOcr(trimmed), vehicleSubtype: "carte_grise" };
  }
}

export function vehicleFieldsToExtractionResult(
  parsed: ParsedVehicleFields & { vehicleSubtype: VehicleIdentitySubtype }
) {
  return {
    vehicle: {
      plate: parsed.plate ?? null,
      brand: parsed.brand ?? null,
      model: parsed.model ?? null,
      year: parsed.year ?? null,
      color: parsed.color ?? null,
      confidence: confidenceFromVehicleFields(parsed),
    },
    vehicleSubtype: parsed.vehicleSubtype,
    warnings: parsed.warnings,
  };
}

export function vehicleIdentityLabel(subtype: VehicleIdentitySubtype): string {
  const labels: Record<VehicleIdentitySubtype, string> = {
    carte_grise: "Carte grise",
    vignette: "Vignette moto",
    recepisse_ww: "Récépissé WW-CI",
    assurance: "Assurance (identité véhicule)",
    visite_technique: "Visite technique (identité véhicule)",
    autorisation_provisoire: "Autorisation provisoire",
  };
  return labels[subtype];
}

export function isVehicleIdentitySubtypeText(ocrText: string): VehicleIdentitySubtype | null {
  if (isAutorisationProvisoireDoc(ocrText)) {
    return "autorisation_provisoire";
  }
  if (isRecepisseWwDoc(ocrText)) {
    return "recepisse_ww";
  }
  const n = upper(normalize(ocrText));
  if (n.includes("VIGNETTE MOTO") || (n.includes("VIGNETTE") && n.includes("DGI"))) {
    return "vignette";
  }
  return null;
}
