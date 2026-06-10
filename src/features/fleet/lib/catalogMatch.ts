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
