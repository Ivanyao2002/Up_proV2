export const BONUS_API_SCOPES = ["GLOBAL", "FRANCHISE", "PARTNER"] as const;
export type BonusApiScope = (typeof BONUS_API_SCOPES)[number];

export const BONUS_SCOPE_OPTIONS = [
  { value: "GLOBAL" as const, label: "Globale (plateforme)" },
  { value: "FRANCHISE" as const, label: "Franchise" },
  { value: "PARTNER" as const, label: "Partenaire" },
];

export const BONUS_PERIOD_OPTIONS = [
  { value: "WEEKLY", label: "Hebdomadaire" },
  { value: "MONTHLY", label: "Mensuelle" },
  { value: "DAILY", label: "Quotidienne" },
] as const;

export const BONUS_PAYOUT_OPTIONS = [
  { value: "HIGHEST_TIER", label: "Palier le plus élevé atteint" },
  { value: "CUMULATIVE", label: "Cumul de tous les paliers atteints" },
  { value: "FIRST_TIER", label: "Premier palier atteint uniquement" },
] as const;

export const BONUS_SERVICE_TYPES = [
  { value: "RIDE", label: "Taxi / Course" },
  { value: "DELIVERY", label: "Livraison" },
  { value: "DELIVERY_CARGO", label: "Livraison cargo" },
  { value: "RENTAL", label: "Location" },
  { value: "FREIGHT", label: "Fret" },
] as const;

export const BONUS_FUNDED_BY_OPTIONS = [
  { value: "CENTRAL", label: "Plateforme (centrale)" },
  { value: "FRANCHISE", label: "Franchise" },
  { value: "PARTNER", label: "Partenaire" },
] as const;

export function defaultFundedByForScope(scope: BonusApiScope): string {
  if (scope === "FRANCHISE") return "FRANCHISE";
  if (scope === "PARTNER") return "PARTNER";
  return "CENTRAL";
}
