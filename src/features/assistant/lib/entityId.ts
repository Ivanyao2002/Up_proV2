/** Identifiant technique (UUID ou numérique) — pas une requête textuelle. */
export function isValidEntityId(id: string): boolean {
  const value = id.trim();
  if (!value || value.length > 64) return false;
  if (/FIND_ENTITY|LIST_ENTITY|OPEN_ENTITY|NAVIGATE/i.test(value)) return false;
  if (/[{}='"`]/.test(value)) return false;
  return /^[0-9a-f-]{8,}$/i.test(value) || /^\d+$/.test(value);
}

/** Récupère une requête FIND_ENTITY mal sérialisée par le LLM dans un champ id. */
export function parseMalformedFindId(
  raw: string
): { query: string } | null {
  const trimmed = raw.trim();
  const patterns = [
    /FIND_ENTITY\s*\{?\s*query\s*=\s*['"]([^'"]+)['"]/i,
    /FIND_ENTITY\s*\{?\s*query\s*:\s*['"]([^'"]+)['"]/i,
    /query\s*[:=]\s*['"]([^'"]+)['"]/i,
  ];
  for (const re of patterns) {
    const match = trimmed.match(re);
    const query = match?.[1]?.trim();
    if (query && query.length >= 2) return { query };
  }
  return null;
}
