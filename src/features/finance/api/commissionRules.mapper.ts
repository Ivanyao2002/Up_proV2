import {
  COMMISSION_REFERENCE,
  roundCommissionRate,
} from "@/shared/lib/commissionRateCoupling";
import type { CommissionRuleScopeKind } from "./commissionRules.constants";
import type { ApiCommissionRule } from "./commissionRules.api.types";

export interface CommissionRule {
  id: string;
  franchise_id: string | null;
  partner_id: string | null;
  city_id: string | null;
  service_type: string;
  category_code: string;
  rule_name: string;
  platform_rate: number;
  franchise_rate: number;
  partner_rate: number;
  driver_rate: number;
  fiscality_rate: number;
  platform_fixed_xof: number;
  franchise_fixed_xof: number;
  partner_fixed_xof: number;
  driver_fixed_xof: number;
  fiscality_fixed_xof: number;
  basis: string;
  active: boolean;
  priority: number;
  effective_from: string;
  effective_to: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function ruleScopeKey(rule: Pick<CommissionRule, "service_type" | "category_code" | "city_id">): string {
  return `${rule.service_type}::${rule.category_code}::${rule.city_id ?? ""}`;
}

export function getCommissionRuleScopeKind(
  rule: Pick<CommissionRule, "franchise_id" | "partner_id">
): CommissionRuleScopeKind {
  if (rule.partner_id) return "partner";
  if (rule.franchise_id) return "franchise";
  return "global";
}

export function emptyCommissionRuleDraft(): CommissionRule {
  const now = new Date().toISOString();
  return {
    id: "",
    franchise_id: null,
    partner_id: null,
    city_id: null,
    service_type: "RIDE",
    category_code: "ECO",
    rule_name: "",
    platform_rate: COMMISSION_REFERENCE.PLATFORM,
    franchise_rate: COMMISSION_REFERENCE.FRANCHISE_MAX,
    partner_rate: COMMISSION_REFERENCE.PARTNER_MAX,
    driver_rate: 0,
    fiscality_rate: COMMISSION_REFERENCE.FISCALITY,
    platform_fixed_xof: 0,
    franchise_fixed_xof: 0,
    partner_fixed_xof: 0,
    driver_fixed_xof: 0,
    fiscality_fixed_xof: 0,
    basis: "FINAL_PRICE",
    active: true,
    priority: 10,
    effective_from: now,
    effective_to: null,
    metadata: {},
    created_at: now,
    updated_at: now,
  };
}

export function suggestCommissionRuleName(
  serviceType: string,
  categoryCode: string
): string {
  const stamp = new Date()
    .toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, "");
  return `Commission ${serviceType} ${categoryCode} ${stamp}`.toUpperCase();
}

export function validateCommissionRuleForm(input: {
  ruleName: string;
  serviceType: string;
  categoryCode: string;
  scopeKind: CommissionRuleScopeKind;
  franchiseId: string | null;
  partnerId: string | null;
  poolError: string | null;
  partnerScopedWithoutBase?: boolean;
}): string[] {
  const errors: string[] = [];
  if (!input.ruleName.trim()) errors.push("Le nom de la règle est requis.");
  if (!input.serviceType.trim()) errors.push("Le type de service est requis.");
  if (!input.categoryCode.trim()) errors.push("La catégorie est requise.");
  if (input.scopeKind === "franchise" && !input.franchiseId?.trim()) {
    errors.push("Sélectionnez une franchise.");
  }
  if (input.scopeKind === "partner") {
    if (!input.franchiseId?.trim()) errors.push("Sélectionnez une franchise.");
    if (!input.partnerId?.trim()) errors.push("Sélectionnez un partenaire.");
    if (input.partnerScopedWithoutBase) {
      errors.push(
        "Aucune règle franchise de référence pour ce service / catégorie — créez d'abord la règle franchise."
      );
    }
  }
  if (input.poolError) errors.push(input.poolError);
  return errors;
}

export function mapApiCommissionRule(item: ApiCommissionRule): CommissionRule {
  return {
    id: item.id,
    franchise_id: item.franchise_id ?? null,
    partner_id: item.partner_id ?? null,
    city_id: item.city_id ?? null,
    service_type: item.service_type ?? "RIDE",
    category_code: item.category_code ?? "—",
    rule_name: item.rule_name ?? "Règle commission",
    platform_rate: item.platform_rate ?? 0,
    franchise_rate: item.franchise_rate ?? 0,
    partner_rate: item.partner_rate ?? 0,
    driver_rate: item.driver_rate ?? 0,
    fiscality_rate: item.fiscality_rate ?? 0,
    platform_fixed_xof: item.platform_fixed_xof ?? 0,
    franchise_fixed_xof: item.franchise_fixed_xof ?? 0,
    partner_fixed_xof: item.partner_fixed_xof ?? 0,
    driver_fixed_xof: item.driver_fixed_xof ?? 0,
    fiscality_fixed_xof: item.fiscality_fixed_xof ?? 0,
    basis: item.basis ?? "FINAL_PRICE",
    active: item.active ?? true,
    priority: item.priority ?? 0,
    effective_from: item.effective_from ?? new Date().toISOString(),
    effective_to: item.effective_to ?? null,
    metadata: item.metadata ?? {},
    created_at: item.created_at ?? new Date().toISOString(),
    updated_at: item.updated_at ?? new Date().toISOString(),
  };
}

export function findFranchiseDefaultRule(
  rules: CommissionRule[],
  franchiseId: string,
  scopeKey: string
): CommissionRule | undefined {
  return rules
    .filter(
      (r) =>
        r.franchise_id === franchiseId &&
        !r.partner_id &&
        ruleScopeKey(r) === scopeKey &&
        r.active
    )
    .sort((a, b) => b.priority - a.priority)[0];
}

export function findPartnerOverrideRule(
  rules: CommissionRule[],
  franchiseId: string,
  partnerId: string,
  scopeKey: string
): CommissionRule | undefined {
  return rules
    .filter(
      (r) =>
        r.franchise_id === franchiseId &&
        r.partner_id === partnerId &&
        ruleScopeKey(r) === scopeKey
    )
    .sort((a, b) => b.priority - a.priority)[0];
}

export interface PartnerCommissionDraft {
  scopeKey: string;
  baseRule: CommissionRule;
  partnerRule: CommissionRule | null;
  partner_rate: number;
  franchise_rate: number;
}

export function buildPartnerCommissionDrafts(
  rules: CommissionRule[],
  franchiseId: string,
  partnerId: string
): PartnerCommissionDraft[] {
  const franchiseDefaults = rules.filter(
    (r) => r.franchise_id === franchiseId && !r.partner_id && r.active
  );

  return franchiseDefaults.map((baseRule) => {
    const scopeKey = ruleScopeKey(baseRule);
    const partnerRule = findPartnerOverrideRule(
      rules,
      franchiseId,
      partnerId,
      scopeKey
    );
    const partner_rate = partnerRule?.partner_rate ?? baseRule.partner_rate;
    const franchise_rate = baseRule.franchise_rate;

    return {
      scopeKey,
      baseRule,
      partnerRule: partnerRule ?? null,
      partner_rate,
      franchise_rate,
    };
  });
}

export function buildPartnerRuleUpsertBody(
  draft: PartnerCommissionDraft,
  franchiseId: string,
  partnerId: string,
  partnerRate: number
): import("./commissionRules.api.types").ApiCommissionRuleUpsertBody {
  const { baseRule, partnerRule } = draft;
  const franchiseRate = baseRule.franchise_rate;

  return {
    franchise_id: franchiseId,
    partner_id: partnerId,
    city_id: baseRule.city_id,
    service_type: baseRule.service_type,
    category_code: baseRule.category_code,
    rule_name: partnerRule?.rule_name ?? `${baseRule.rule_name} — partenaire`,
    platform_rate: baseRule.platform_rate,
    franchise_rate: franchiseRate,
    partner_rate: roundCommissionRate(partnerRate),
    driver_rate: baseRule.driver_rate,
    fiscality_rate: baseRule.fiscality_rate,
    platform_fixed_xof: baseRule.platform_fixed_xof,
    franchise_fixed_xof: baseRule.franchise_fixed_xof,
    partner_fixed_xof: baseRule.partner_fixed_xof,
    driver_fixed_xof: baseRule.driver_fixed_xof,
    fiscality_fixed_xof: baseRule.fiscality_fixed_xof,
    basis: baseRule.basis,
    active: true,
    priority: Math.max(baseRule.priority + 10, (partnerRule?.priority ?? 0) || 30),
    metadata: {
      ...baseRule.metadata,
      partner_override: true,
      base_rule_id: baseRule.id,
    },
  };
}
