import {
  BONUS_API_SCOPES,
  defaultFundedByForScope,
  type BonusApiScope,
} from "./bonusRules.constants";
import type { ApiBonusRuleUpsertBody } from "./bonusRules.api.types";
import type { BonusRule, BonusRuleTier } from "./bonusRules.types";

export interface BonusRuleFormDraft {
  label: string;
  scope: BonusApiScope;
  franchiseId: string;
  partnerId: string;
  period: string;
  payoutModel: string;
  countedServiceTypes: string[];
  tiers: BonusRuleTier[];
  fundedBy: string;
  priority: number;
  active: boolean;
}

export function emptyBonusRuleDraft(): BonusRuleFormDraft {
  return {
    label: "",
    scope: "GLOBAL",
    franchiseId: "",
    partnerId: "",
    period: "WEEKLY",
    payoutModel: "HIGHEST_TIER",
    countedServiceTypes: ["RIDE", "DELIVERY_CARGO"],
    tiers: [{ minTrips: 10, rewardXof: 2500 }],
    fundedBy: "CENTRAL",
    priority: 100,
    active: true,
  };
}

export function bonusRuleToFormDraft(rule: BonusRule): BonusRuleFormDraft {
  const scope = BONUS_API_SCOPES.includes(rule.rawScope as BonusApiScope)
    ? (rule.rawScope as BonusApiScope)
    : "GLOBAL";

  return {
    label: rule.name,
    scope,
    franchiseId: rule.franchiseId ? String(rule.franchiseId) : "",
    partnerId: rule.partnerId ? String(rule.partnerId) : "",
    period: rule.period,
    payoutModel: rule.payoutModel,
    countedServiceTypes: rule.countedServiceTypes.length
      ? [...rule.countedServiceTypes]
      : ["RIDE"],
    tiers: rule.tiers.length
      ? rule.tiers.map((tier) => ({ ...tier }))
      : [{ minTrips: 10, rewardXof: 2500 }],
    fundedBy: rule.fundedBy ?? defaultFundedByForScope(scope),
    priority: rule.priority ?? 100,
    active: rule.status === "active",
  };
}

export function validateBonusRuleForm(draft: BonusRuleFormDraft): string[] {
  const errors: string[] = [];

  if (!draft.label.trim()) {
    errors.push("Le libellé de la règle est requis.");
  }

  if (draft.scope === "FRANCHISE" && !draft.franchiseId.trim()) {
    errors.push("Sélectionnez une franchise pour une règle franchise.");
  }

  if (draft.scope === "PARTNER") {
    if (!draft.franchiseId.trim()) {
      errors.push("Sélectionnez une franchise pour une règle partenaire.");
    }
    if (!draft.partnerId.trim()) {
      errors.push("Sélectionnez un partenaire pour une règle partenaire.");
    }
  }

  if (!draft.countedServiceTypes.length) {
    errors.push("Sélectionnez au moins un type de service comptabilisé.");
  }

  if (!draft.tiers.length) {
    errors.push("Ajoutez au moins un palier bonus.");
  }

  const minTripsSet = new Set<number>();
  for (const [index, tier] of draft.tiers.entries()) {
    if (!Number.isFinite(tier.minTrips) || tier.minTrips <= 0) {
      errors.push(`Palier ${index + 1} : le nombre de courses doit être > 0.`);
    }
    if (!Number.isFinite(tier.rewardXof) || tier.rewardXof <= 0) {
      errors.push(`Palier ${index + 1} : la récompense doit être > 0 FCFA.`);
    }
    if (minTripsSet.has(tier.minTrips)) {
      errors.push(`Palier ${index + 1} : seuil de courses en doublon (${tier.minTrips}).`);
    }
    minTripsSet.add(tier.minTrips);
  }

  const sorted = [...draft.tiers].sort((a, b) => a.minTrips - b.minTrips);
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].rewardXof < sorted[i - 1].rewardXof) {
      errors.push(
        "Les récompenses doivent croître avec le nombre de courses (palier supérieur ≥ palier inférieur)."
      );
      break;
    }
  }

  if (!Number.isFinite(draft.priority) || draft.priority < 0) {
    errors.push("La priorité doit être un nombre positif ou nul.");
  }

  return errors;
}

function normalizeTiers(tiers: BonusRuleTier[]) {
  return [...tiers]
    .sort((a, b) => a.minTrips - b.minTrips)
    .map((tier) => ({
      min_trips: Math.round(tier.minTrips),
      reward_xof: Math.round(tier.rewardXof),
    }));
}

export function bonusRuleFormToCreateBody(
  draft: BonusRuleFormDraft
): ApiBonusRuleUpsertBody {
  return {
    scope: draft.scope,
    franchise_id:
      draft.scope === "GLOBAL" ? null : draft.franchiseId.trim() || null,
    partner_id:
      draft.scope === "PARTNER" ? draft.partnerId.trim() || null : null,
    period: draft.period,
    payout_model: draft.payoutModel,
    counted_service_types: draft.countedServiceTypes,
    tiers: normalizeTiers(draft.tiers),
    funded_by: draft.fundedBy.trim() || defaultFundedByForScope(draft.scope),
    priority: Math.round(draft.priority),
    active: draft.active,
    metadata: { label: draft.label.trim() },
  };
}

export function bonusRuleFormToUpdateBody(
  draft: BonusRuleFormDraft
): ApiBonusRuleUpsertBody {
  return bonusRuleFormToCreateBody(draft);
}
