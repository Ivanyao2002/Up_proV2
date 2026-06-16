"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/Button";
import { validatePartnerRate } from "@/shared/lib/commissionRateCoupling";
import { COMMISSION_SERVICE_TYPE_LABELS } from "../api/commissionRules.constants";
import {
  buildPartnerCommissionDrafts,
  buildPartnerRuleUpsertBody,
} from "../api/commissionRules.mapper";
import {
  useCommissionRulesList,
  useSaveCommissionRule,
} from "../api/commissionRules.queries";
import { CommissionRuleRatesForm } from "./CommissionRuleRatesForm";

interface PartnerCommissionRulesPanelProps {
  partnerId: string;
  franchiseId: string;
  franchiseName: string;
  partnerName: string;
}

export function PartnerCommissionRulesPanel({
  partnerId,
  franchiseId,
  franchiseName,
  partnerName,
}: PartnerCommissionRulesPanelProps) {
  const { data: rules = [], isLoading, isError } = useCommissionRulesList();
  const saveRule = useSaveCommissionRule();
  const [draftRates, setDraftRates] = useState<Record<string, number>>({});

  const drafts = useMemo(
    () => buildPartnerCommissionDrafts(rules, franchiseId, partnerId),
    [rules, franchiseId, partnerId]
  );

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-card bg-navy/10" />;
  }

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger les règles de commission.
      </p>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center">
        <p className="font-medium text-foreground">Aucune règle franchise</p>
        <p className="mt-2 text-sm text-muted">
          Aucune règle par défaut pour{" "}
          <Link
            href={`/admin/network/franchises/${franchiseId}`}
            className="text-teal hover:underline"
          >
            {franchiseName}
          </Link>
          . Créez d&apos;abord des règles sur la page{" "}
          <Link
            href="/admin/finance/commission-rules"
            className="text-teal hover:underline"
          >
            Règles commission
          </Link>
          .
        </p>
      </div>
    );
  }

  const handleSave = (scopeKey: string) => {
    const draft = drafts.find((d) => d.scopeKey === scopeKey);
    if (!draft) return;
    const partnerRate = draftRates[scopeKey] ?? draft.partner_rate;
    if (validatePartnerRate(partnerRate)) return;

    saveRule.mutate({
      id: draft.partnerRule?.id ?? null,
      body: buildPartnerRuleUpsertBody(
        draft,
        franchiseId,
        partnerId,
        partnerRate
      ),
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Ajustez la part <strong className="text-foreground">{partnerName}</strong>{" "}
        (max référence cahier) pour{" "}
        <strong className="text-foreground">{franchiseName}</strong>. Les taux
        plateforme, chauffeur, fiscalité et franchise restent ceux de la règle
        franchise.
      </p>

      <div className="space-y-3">
        {drafts.map((draft, index) => {
          const partnerRate = draftRates[draft.scopeKey] ?? draft.partner_rate;
          const hasOverride = Boolean(draft.partnerRule);
          const poolError = validatePartnerRate(partnerRate);
          const serviceLabel =
            COMMISSION_SERVICE_TYPE_LABELS[draft.baseRule.service_type] ??
            draft.baseRule.service_type;

          return (
            <details
              key={draft.scopeKey}
              className="group rounded-card border border-border bg-surface p-4 shadow-card"
              open={index === 0}
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-heading">
                    {draft.baseRule.rule_name}
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    {serviceLabel} · {draft.baseRule.category_code}
                    {hasOverride ? " · règle partenaire active" : " · défaut franchise"}
                  </p>
                </div>
                <span className="mt-0.5 shrink-0 text-xs font-medium text-teal">
                  <span className="group-open:hidden">Voir</span>
                  <span className="hidden group-open:inline">Masquer</span>
                </span>
              </summary>

              <div className="mt-4 space-y-4">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    disabled={Boolean(poolError) || saveRule.isPending}
                    onClick={() => handleSave(draft.scopeKey)}
                  >
                    {saveRule.isPending ? "Enregistrement…" : "Enregistrer"}
                  </Button>
                </div>

                <CommissionRuleRatesForm
                  platformRate={draft.baseRule.platform_rate}
                  driverRate={draft.baseRule.driver_rate}
                  fiscalityRate={draft.baseRule.fiscality_rate}
                  franchiseRate={draft.franchise_rate}
                  partnerRate={partnerRate}
                  franchiseEditable={false}
                  partnerEditable
                  onPartnerRateChange={(rate) =>
                    setDraftRates((prev) => ({ ...prev, [draft.scopeKey]: rate }))
                  }
                  disabled={saveRule.isPending}
                />
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
