import { parseSummaryTarget } from "./summaryIntent";

function cleanName(raw: string): string {
  return raw
    .trim()
    .replace(/[?.!]+$/g, "")
    .replace(/^(?:le|la|les|du|de|des|un|une|ce|cette|mon|ma)\s+/i, "")
    .trim();
}

/** Extrait un nom ou identifiant chauffeur depuis une commande d'action ou de recherche. */
export function extractDriverNameQuery(text: string): string | null {
  const target = parseSummaryTarget(`résume le chauffeur ${text}`);
  if (target?.entity === "drivers") {
    const q = cleanName(target.query);
    if (q.length >= 2) return q;
  }

  const patterns = [
    /approuv(?:er|e)\s+(?:le\s+)?compte\s+(?:de|du|pour)\s+([A-Za-zÀ-ÿ0-9''\-\s]{2,40})/i,
    /(?:compte|dossier)\s+(?:de|du|pour)\s+([A-Za-zÀ-ÿ0-9''\-\s]{2,40})/i,
    /(?:documents?\s+kyc|kyc\s+documents?)\s+(?:de|du|pour)\s+([A-Za-zÀ-ÿ0-9''\-\s]{2,40})/i,
    /approuv(?:er|e)\s+(?:les\s+)?(?:documents?\s+)?kyc\s+(?:de|du|pour)\s+([A-Za-zÀ-ÿ0-9''\-\s]{2,40})/i,
    /kyc\s+(?:de|du|pour)\s+([A-Za-zÀ-ÿ0-9''\-\s]{2,40})/i,
    /(?:chauffeur|conducteur)\s+([A-Za-zÀ-ÿ0-9''\-\s]{2,40})/i,
    /(?:au|à)\s+(?:chauffeur|conducteur)\s+([A-Za-zÀ-ÿ0-9''\-\s]{2,40})/i,
    /(?:pour|de)\s+([A-Za-zÀ-ÿ0-9''\-\s]{2,40})/i,
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (!m?.[1]) continue;
    const q = cleanName(m[1].split(/\s*,|\s+pui|\s+puis|\s+si\s+/i)[0] ?? "");
    if (
      q.length >= 2 &&
      !/^(?:en attente|suspendu|ligne|online|offline|le|la)$/i.test(q)
    ) {
      return q;
    }
  }

  return null;
}

export function isActionIntent(text: string): boolean {
  return /valid(er|e)|approuv(er|e)|rejett(er|e)|refus(er|e)|recharg(er|e)|suspend(re|re)?|activ(er|e)|réactiv(er|e)|hors ligne|offline|mettre en ligne|dossier|compte/i.test(
    text
  );
}
