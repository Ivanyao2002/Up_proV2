/** Valeurs Swagger `POST /v1/partners` — en attente d'un catalogue API dédié. */
export const PARTNER_TYPES = ["FLEET", "FREIGHT", "RENTAL", "MIXED"] as const;

export type PartnerType = (typeof PARTNER_TYPES)[number];

export const DEFAULT_PARTNER_TYPE: PartnerType = "FLEET";

/** Taux commission partenaire par défaut (cahier finance — part partenaire 4 %). */
export const DEFAULT_PARTNER_COMMISSION_RATE_PERCENT = 4;

export const PARTNER_TYPE_OPTIONS: {
  value: PartnerType;
  label: string;
  hint: string;
}[] = [
  {
    value: "FLEET",
    label: "Flotte (FLEET)",
    hint: "Chauffeurs et véhicules — taxi, VTC, livraison",
  },
  {
    value: "FREIGHT",
    label: "Fret (FREIGHT)",
    hint: "Transport de marchandises, corridors et devis",
  },
  {
    value: "RENTAL",
    label: "Location (RENTAL)",
    hint: "Location de véhicules avec offres et caution",
  },
  {
    value: "MIXED",
    label: "Multi-services (MIXED)",
    hint: "Flotte + fret et/ou location",
  },
];

const LABELS: Record<PartnerType, string> = {
  FLEET: "Flotte",
  FREIGHT: "Fret",
  RENTAL: "Location",
  MIXED: "Multi-services",
};

export function isPartnerType(value: string): value is PartnerType {
  return (PARTNER_TYPES as readonly string[]).includes(value);
}

export function normalizePartnerType(value?: string | null): PartnerType | undefined {
  const key = value?.trim().toUpperCase();
  if (!key || !isPartnerType(key)) return undefined;
  return key;
}

export function formatPartnerTypeLabel(value?: string | null): string {
  const normalized = normalizePartnerType(value);
  if (normalized) return LABELS[normalized];
  if (value?.trim()) return value.trim();
  return "—";
}
