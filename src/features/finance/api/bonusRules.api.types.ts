export interface ApiBonusRuleTier {
  min_trips?: number;
  minTrips?: number;
  reward_xof?: number;
  rewardXof?: number;
}

export interface ApiBonusRuleItem {
  id: string;
  name?: string;
  scope?: string;
  metric?: string;
  period?: string;
  payout_model?: string;
  payoutModel?: string;
  counted_service_types?: string[];
  countedServiceTypes?: string[];
  tiers?: ApiBonusRuleTier[];
  funded_by?: string;
  fundedBy?: string;
  priority?: number;
  active?: boolean;
  status?: string;
  threshold_value?: number;
  thresholdValue?: number;
  reward_xof?: number;
  rewardXof?: number;
  effective_from?: string;
  effectiveFrom?: string;
  effective_to?: string;
  effectiveTo?: string;
  franchise_id?: string | null;
  franchiseId?: string | null;
  partner_id?: string | null;
  partnerId?: string | null;
  metadata?: {
    label?: string;
    source?: string;
    [key: string]: unknown;
  } | null;
  valid_from?: string;
  valid_to?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiBonusRulesListResponse {
  status?: string;
  generatedAt?: string;
  message?: string;
  rules?: ApiBonusRuleItem[];
  items?: ApiBonusRuleItem[];
  pagination?: import("@/core/api/v1Pagination").ApiV1Pagination;
}

export interface ApiBonusRuleUpsertBody {
  scope: string;
  franchise_id?: string | null;
  partner_id?: string | null;
  period: string;
  payout_model: string;
  counted_service_types: string[];
  tiers: Array<{ min_trips: number; reward_xof: number }>;
  funded_by: string;
  priority: number;
  active: boolean;
  metadata?: { label?: string };
}

export interface ApiBonusRuleMutationResponse {
  status?: string;
  message?: string;
  rule?: ApiBonusRuleItem;
  rules?: ApiBonusRuleItem[];
}
