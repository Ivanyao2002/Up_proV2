import { resolveColorSlug } from "@/shared/lib/vehicleMapIcons";

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/** Résout un libellé extrait vers un `code` catalogue (marque, modèle, couleur). */
export function matchCatalogCode(
  items: { code: string; label: string }[],
  extracted?: string | null
): string {
  if (!extracted?.trim() || !items.length) return "";

  const target = normalizeToken(extracted);
  const exact = items.find(
    (item) =>
      normalizeToken(item.code) === target ||
      normalizeToken(item.label) === target
  );
  if (exact) return exact.code;

  const partial = items.find((item) => {
    const label = normalizeToken(item.label);
    return label.includes(target) || target.includes(label);
  });
  return partial?.code ?? "";
}

/** Résout une marque extraite (Suzuki, SUZUKI, etc.) vers un code catalogue. */
export function matchBrandCatalogCode(
  items: { code: string; label: string }[],
  extracted?: string | null
): string {
  const direct = matchCatalogCode(items, extracted);
  if (direct) return direct;

  if (!extracted?.trim() || !items.length) return "";

  const target = normalizeToken(extracted);
  const targetFirst = target.split(/[\s\-_/]+/).filter(Boolean)[0] ?? target;

  const byToken = items.find((item) => {
    const code = normalizeToken(item.code);
    const label = normalizeToken(item.label);
    const labelFirst = label.split(/[\s\-_/]+/).filter(Boolean)[0] ?? label;
    return (
      code === targetFirst ||
      labelFirst === targetFirst ||
      code.startsWith(targetFirst) ||
      targetFirst.startsWith(code) ||
      label.includes(target) ||
      target.includes(labelFirst)
    );
  });

  return byToken?.code ?? "";
}

/** Résout une couleur extraite (ROUGE, Red, etc.) vers un code catalogue. */
export function matchColorCatalogCode(
  items: { code: string; label: string }[],
  extracted?: string | null
): string {
  const direct = matchCatalogCode(items, extracted);
  if (direct) return direct;

  const slug = resolveColorSlug(extracted);
  if (!slug || !items.length) return "";

  const bySlug = items.find((item) => {
    const code = normalizeToken(item.code);
    const label = normalizeToken(item.label);
    return (
      code === slug ||
      label === slug ||
      label.startsWith(slug) ||
      slug.startsWith(label) ||
      resolveColorSlug(item.code) === slug ||
      resolveColorSlug(item.label) === slug
    );
  });

  return bySlug?.code ?? "";
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i]![0] = i;
  for (let j = 0; j <= n; j += 1) dp[0]![j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + cost);
    }
  }
  return dp[m]![n]!;
}

const MODEL_OCR_ALIASES: Record<string, string> = {
  dzre: "dzire",
  dz1re: "dzire",
  dziree: "dzire",
};

/** Résout un modèle extrait (DZRE, DZIRE…) vers un code catalogue. */
export function matchModelCatalogCode(
  items: { code: string; label: string }[],
  extracted?: string | null
): string {
  const direct = matchCatalogCode(items, extracted);
  if (direct) return direct;

  if (!extracted?.trim() || !items.length) return "";

  const tokens = extracted
    .trim()
    .split(/[\s\-_/]+/)
    .filter((t) => t.length >= 2);
  for (const token of tokens) {
    const fromToken = matchCatalogCode(items, token);
    if (fromToken) return fromToken;
  }

  const target = normalizeToken(extracted);
  const alias = MODEL_OCR_ALIASES[target];
  if (alias) {
    const fromAlias = matchCatalogCode(items, alias);
    if (fromAlias) return fromAlias;
  }

  if (target.length < 3) return "";

  let best: { code: string; distance: number } | null = null;
  for (const item of items) {
    const label = normalizeToken(item.label);
    const code = normalizeToken(item.code);
    for (const candidate of [label, code]) {
      if (!candidate || Math.abs(candidate.length - target.length) > 2) continue;
      const distance = levenshtein(target, candidate);
      if (distance > 2) continue;
      if (!best || distance < best.distance) {
        best = { code: item.code, distance };
      }
    }
  }

  return best?.code ?? "";
}
