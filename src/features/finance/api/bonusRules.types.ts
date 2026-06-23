export type BonusRuleScope = "driver" | "partner" | "franchise" | "platform";
export type BonusRuleStatus = "active" | "draft" | "archived";

export interface BonusRuleTier {
  minTrips: number;
  rewardXof: number;
}

export interface BonusRule {
  id: string;
  name: string;
  /** Valeur brute API : GLOBAL, FRANCHISE, PARTNER… */
  rawScope: string;
  scope: BonusRuleScope;
  period: string;
  payoutModel: string;
  metric: string;
  tiers: BonusRuleTier[];
  /** Palier le plus élevé — rétrocompat affichage / export */
  thresholdValue: number;
  rewardXof: number;
  status: BonusRuleStatus;
  countedServiceTypes: string[];
  fundedBy?: string;
  priority?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  franchiseId?: string | null;
  partnerId?: string | null;
}
