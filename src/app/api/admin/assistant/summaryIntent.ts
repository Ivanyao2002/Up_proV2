import type { AdminEntityKey } from "@/features/assistant/catalog/adminEntities";
import { normalizePlate } from "./detectIntent";

export interface SummaryTarget {
  entity: AdminEntityKey;
  query: string;
}

function cleanSummaryQuery(raw: string): string {
  return raw
    .replace(/[?.!]+$/g, "")
    .replace(/^(?:le|la|les|du|de|des|un|une|ci)\s+/i, "")
    .trim();
}

function isGenericSummaryQuery(query: string): boolean {
  return /^(?:actuel|actuelle|cette fiche|fiche actuelle|ici|ouvert|en cours|liste|premier|première)$/i.test(
    query.trim()
  );
}

/** Extrait l'entité + critère de recherche depuis « résume le chauffeur Kouassi ». */
export function parseSummaryTarget(text: string): SummaryTarget | null {
  const t = text.trim();
  if (!t) return null;

  const phoneMatch = t.match(/(\+?\d{10,15})/);
  if (phoneMatch && /chauffeur|conducteur|r[eé]sum|synth/i.test(t)) {
    return { entity: "drivers", query: phoneMatch[1]! };
  }

  const plate = normalizePlate(t.match(/\b([A-Z]{2}-[A-Z0-9-]{4,})\b/i)?.[1] ?? "");
  if (plate && /véhicule|vehicule|voiture|plate|r[eé]sum|synth/i.test(t)) {
    return { entity: "vehicles", query: plate };
  }

  const entityPatterns: Array<{ entity: AdminEntityKey; patterns: RegExp[] }> = [
    {
      entity: "drivers",
      patterns: [
        /(?:r[eé]sum|synth[eè]se|situation|état|etat).*?(?:chauffeur|conducteur)\s+(.+)/i,
        /(?:chauffeur|conducteur)\s+(.+?)\s*(?:\?|$)/i,
      ],
    },
    {
      entity: "vehicles",
      patterns: [
        /(?:r[eé]sum|synth[eè]se).*?(?:véhicule|vehicule|voiture)\s+(.+)/i,
        /(?:véhicule|vehicule|voiture)\s+(.+?)\s*(?:\?|$)/i,
      ],
    },
    {
      entity: "partners",
      patterns: [
        /(?:r[eé]sum|synth[eè]se).*?(?:partenaire|partner)\s+(.+)/i,
        /(?:partenaire|partner)\s+(.+?)\s*(?:\?|$)/i,
      ],
    },
    {
      entity: "trips",
      patterns: [
        /(?:r[eé]sum|synth[eè]se).*?(?:course|trip)\s+(.+)/i,
        /(?:course|trip)\s+(.+?)\s*(?:\?|$)/i,
      ],
    },
    {
      entity: "clients",
      patterns: [
        /(?:r[eé]sum|synth[eè]se|voir|afficher).*?(?:client|cliente)\s+(.+)/i,
        /(?:client|cliente)\s+(.+?)\s*(?:\?|$)/i,
        /(?:infos?|informations?|fiche|détails?)\s+(?:de|du|d['']|sur)\s+(.+)/i,
      ],
    },
    {
      entity: "transactions",
      patterns: [
        /(?:r[eé]sum|synth[eè]se).*?(?:transaction)\s+(.+)/i,
      ],
    },
    {
      entity: "withdrawals",
      patterns: [
        /(?:r[eé]sum|synth[eè]se).*?(?:retrait)\s+(.+)/i,
      ],
    },
  ];

  for (const { entity, patterns } of entityPatterns) {
    for (const re of patterns) {
      const m = t.match(re);
      const rawQuery = m?.[1]?.trim();
      if (!rawQuery) continue;
      const query = cleanSummaryQuery(rawQuery);
      if (query.length >= 2 && !isGenericSummaryQuery(query)) {
        if (entity === "drivers" && /^(?:véhicule|vehicule|partenaire|course|client)/i.test(query)) {
          continue;
        }
        return { entity, query };
      }
    }
  }

  return null;
}

export function isGenericSummaryRequest(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (t === "resume" || t === "résumé" || t === "resumé" || t === "synthèse") return true;
  return /cette fiche|fiche actuelle|fiche ouverte|actuel|actuelle|\bici\b|premier de la liste/i.test(
    text
  );
}

export function matchAnalyticsIntent(text: string): string | null {
  if (
    /partenaire.*(plus performant|le plus performant|meilleur|top|classement)|quel partenaire.*(performant|meilleur|plus)|compare.*partenaires|classement.*partenaires/i.test(
      text
    )
  ) {
    return "partner_performance";
  }
  if (
    /chauffeur.*(plus actif|meilleur|top|plus performant)|quel chauffeur.*(actif|meilleur)/i.test(
      text
    )
  ) {
    return "driver_performance";
  }
  if (
    /partenaire.*(ca|chiffre|revenu|gagn)|classement.*ca|top.*ca|meilleur ca/i.test(
      text
    )
  ) {
    return "partner_revenue";
  }
  return null;
}
