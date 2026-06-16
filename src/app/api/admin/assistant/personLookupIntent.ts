import type { AdminEntityKey } from "@/features/assistant/catalog/adminEntities";
import { isValidEntityFindQuery } from "@/features/assistant/lib/firstEntityIntent";

function cleanQuery(raw: string): string {
  return raw
    .trim()
    .replace(/[?.!]+$/g, "")
    .replace(/^(?:le|la|les|l['']|du|de|des|un|une)\s+/i, "")
    .trim();
}

function inferEntity(text: string): AdminEntityKey {
  if (/chauffeur|conducteur/i.test(text)) return "drivers";
  if (/client|cliente|utilisateur/i.test(text)) return "clients";
  if (/partenaire/i.test(text)) return "partners";
  if (/véhicule|vehicule|voiture|plaque/i.test(text)) return "vehicles";
  if (/franchise/i.test(text)) return "franchises";
  return "clients";
}

const PERSON_LOOKUP_PATTERNS = [
  /(?:je\s+(?:veux|voudrais)\s+)?(?:voir|afficher|ouvrir|consulte(?:r)?|montre(?:r)?)\s+(?:les\s+)?(?:infos?|informations?|fiche|détails?|details?|profil)\s+(?:de|du|d['']|sur)\s+(.+)/i,
  /(?:infos?|informations?|fiche|détails?|details?|profil)\s+(?:de|du|d['']|sur)\s+(.+)/i,
  /(?:qui est|c'est qui)\s+(.+)/i,
];

/** « Je veux voir les infos de N'Dja Fabrice » sans mot-clé « client ». */
export function matchPersonLookupIntent(
  text: string
): { entity: AdminEntityKey; query: string } | null {
  for (const pattern of PERSON_LOOKUP_PATTERNS) {
    const match = text.match(pattern);
    const query = cleanQuery(match?.[1] ?? "");
    if (query.length >= 2 && isValidEntityFindQuery(query)) {
      return { entity: inferEntity(text), query };
    }
  }
  return null;
}
