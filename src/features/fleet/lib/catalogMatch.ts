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
