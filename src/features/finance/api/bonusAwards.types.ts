export type BonusAwardStatus = "eligible" | "ineligible" | "paid" | "pending";

export interface BonusAward {
  id: string;
  driverId: string | null;
  driverName: string;
  driverPhone: string | null;
  /** Montant attribué en FCFA. */
  amountXof: number;
  /** Libellé lisible de la période évaluée. */
  periodLabel: string;
  periodStart: string | null;
  periodEnd: string | null;
  ruleId: string | null;
  ruleName: string;
  /** True si le chauffeur a atteint le palier requis. */
  eligible: boolean;
  status: BonusAwardStatus;
  reason: string | null;
  metricValue: number | null;
  thresholdValue: number | null;
  awardedAt: string | null;
}

export interface BonusRunEvaluationResult {
  evaluated: number;
  awarded: number;
  skipped: number;
  totalAmountXof: number;
  message: string;
}
