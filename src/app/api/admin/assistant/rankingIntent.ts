export type RankingEntity = "drivers" | "clients" | "partners" | "franchises";

export type RankingMetric =
  | "completed_orders"
  | "cancelled_orders"
  | "trips_count"
  | "wallet_balance"
  | "rating"
  | "revenue"
  | "driver_count";

export interface RankingScope {
  type: "franchise" | "partner";
  query: string;
}

export interface RankingQuery {
  entity: RankingEntity;
  metric: RankingMetric;
  scope?: RankingScope;
  limit: number;
}

function cleanScope(raw: string): string {
  return raw
    .replace(/\s+(?:avec|ayant|qui|que|pour|le|la|plus).*$/i, "")
    .replace(/[?.!]+$/g, "")
    .trim();
}

function isRankingQuestion(text: string): boolean {
  return (
    /(?:qui est|quelle?|quels?|top\s+\d*|classement|meilleur|meilleure|plus (?:de|grand|gros|important|élevé|eleve)|ranking|comparer|compare)/i.test(
      text
    ) ||
    /(?:nombre|nb)\s+de\s+courses/i.test(text) ||
    /faute(?:s)?\s+(?:de|du|des|à|a)/i.test(text)
  );
}

function extractScope(text: string): RankingScope | undefined {
  const franchiseMatch = text.match(
    /franchise\s+(?:de|du|d[''])\s*([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9\s'-]{2,60})/i
  );
  if (franchiseMatch?.[1]) {
    return { type: "franchise", query: cleanScope(franchiseMatch[1]) };
  }

  const partnerMatch = text.match(
    /partenaire\s+(?:de|du|d[''])?\s*([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9\s'-]{2,50})/i
  );
  if (partnerMatch?.[1] && !/partenaire.*(?:top|meilleur|classement)/i.test(text)) {
    return { type: "partner", query: cleanScope(partnerMatch[1]) };
  }

  return undefined;
}

function detectEntity(text: string, scope?: RankingScope): RankingEntity {
  if (/client/i.test(text)) return "clients";
  if (/partenaire/i.test(text) && !scope) {
    if (/top|classement|meilleur|plus (?:de|performant|grand)/i.test(text)) {
      return "partners";
    }
  }
  if (/franchise/i.test(text) && !/chauffeur|conducteur|client/i.test(text)) {
    return "franchises";
  }
  if (/chauffeur|conducteur|driver/i.test(text)) return "drivers";
  if (/partenaire/i.test(text)) return "partners";
  if (/franchise/i.test(text)) return "franchises";
  return "drivers";
}

function detectMetric(text: string, entity: RankingEntity): RankingMetric {
  if (/faute|responsab|fautif/i.test(text)) {
    return entity === "clients" ? "cancelled_orders" : "cancelled_orders";
  }
  if (/annul/i.test(text)) return "cancelled_orders";
  if (/wallet|solde|argent|portefeuille|fcfa/i.test(text) && entity === "clients") {
    return "wallet_balance";
  }
  if (/note|satisfaction|étoile|etoile|rating|avis/i.test(text)) return "rating";
  if (/ca|chiffre|revenu|gagn|recette/i.test(text)) return "revenue";
  if (/chauffeur/i.test(text) && entity === "partners") return "driver_count";
  if (/course|trip|commande|activité|activite/i.test(text)) {
    return entity === "clients" ? "trips_count" : "completed_orders";
  }
  if (entity === "clients") return "trips_count";
  if (entity === "franchises" || entity === "partners") return "driver_count";
  return "completed_orders";
}

export function matchRankingQuery(text: string): RankingQuery | null {
  const t = text.trim();
  if (!t || !isRankingQuestion(t)) return null;

  const scope = extractScope(t);
  const entity = detectEntity(t, scope);
  const metric = detectMetric(t, entity);

  const limitMatch = t.match(/top\s+(\d{1,2})/i);
  const limit = limitMatch ? Math.min(10, Math.max(3, parseInt(limitMatch[1]!, 10))) : 5;

  return { entity, metric, scope, limit };
}
