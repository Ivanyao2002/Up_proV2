const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  cni: "CNI",
  license: "Permis",
  registration: "Carte grise",
};

const KNOWN_WARNING_TRANSLATIONS: [RegExp, string][] = [
  [
    /partial.*incomplete|incomplete.*analysis/i,
    "Analyse partielle ou incomplète.",
  ],
  [
    /invalid json|json.*invalid/i,
    "Format JSON invalide — saisissez les champs manuellement.",
  ],
];

/** Hint sous le champ année quand la valeur vient de la carte grise (pattern text-muted du wizard). */
export const YEAR_EXTRACTION_FIELD_HINT =
  "Correspond à la 1ʳᵉ mise en circulation sur la carte grise, pas à l'année de fabrication.";

const WARNING_NOISE_PATTERNS: RegExp[] = [
  /^Texte extrait via PaddleOCR/i,
  /année.*mise en circulation|first registration.*manufacturing/i,
  /^Champ « .* » à vérifier \(confiance/i,
];

/** Normalise les avertissements IA (souvent en anglais) vers le français. */
export function localizeExtractionWarning(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return trimmed;

  for (const [pattern, french] of KNOWN_WARNING_TRANSLATIONS) {
    if (pattern.test(trimmed)) return french;
  }

  const prefixed = trimmed.match(/^([a-z_]+):\s*(.+)$/i);
  if (prefixed) {
    const [, type, rest] = prefixed;
    const label = DOCUMENT_TYPE_LABELS[type.toLowerCase()] ?? type;
    return `${label} : ${localizeExtractionWarning(rest)}`;
  }

  return trimmed;
}

/** Retire les messages informatifs / redondants avant affichage dans la bannière. */
export function consolidateExtractionWarnings(warnings: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of warnings) {
    const msg = localizeExtractionWarning(raw);
    if (!msg) continue;
    if (WARNING_NOISE_PATTERNS.some((pattern) => pattern.test(msg))) continue;
    if (seen.has(msg)) continue;
    seen.add(msg);
    result.push(msg);
  }

  return result;
}
