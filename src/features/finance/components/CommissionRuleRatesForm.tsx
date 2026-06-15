"use client";

import {
  COMMISSION_REFERENCE,
  commissionActorsTotal,
  formatRatePercent,
  parseRatePercentInput,
  validateFranchisePartnerRates,
} from "@/shared/lib/commissionRateCoupling";

interface CommissionRuleRatesFormProps {
  platformRate: number;
  driverRate: number;
  fiscalityRate: number;
  partnerRate: number;
  franchiseRate: number;
  franchiseEditable?: boolean;
  partnerEditable?: boolean;
  onPartnerRateChange: (rate: number) => void;
  onFranchiseRateChange?: (rate: number) => void;
  disabled?: boolean;
}

export function CommissionRuleRatesForm({
  platformRate,
  driverRate,
  fiscalityRate,
  partnerRate,
  franchiseRate,
  franchiseEditable = true,
  partnerEditable = true,
  onPartnerRateChange,
  onFranchiseRateChange,
  disabled = false,
}: CommissionRuleRatesFormProps) {
  const ratesError = validateFranchisePartnerRates(
    franchiseRate,
    partnerRate,
    platformRate,
    fiscalityRate
  );
  const commissionTotal = commissionActorsTotal(
    platformRate,
    franchiseRate,
    partnerRate,
    fiscalityRate
  );
  const franchiseMaxPct = Math.round(COMMISSION_REFERENCE.FRANCHISE_MAX * 10_000);
  const partnerMaxPct = Math.round(COMMISSION_REFERENCE.PARTNER_MAX * 10_000);
  const franchisePct = Math.round(franchiseRate * 10_000);
  const partnerPct = Math.round(partnerRate * 10_000);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-canvas/50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
          Autres parts (lecture seule)
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <RateDisplay label="Plateforme (Centrale)" value={platformRate} readonly />
          <RateDisplay label="Chauffeur" value={driverRate} readonly />
          <RateDisplay label="Fiscalité" value={fiscalityRate} readonly />
        </div>
        <p className="mt-3 text-xs text-muted">
          Chaque taux s&apos;applique sur la <strong>recette brute</strong>. La
          commission totale UPJUNOO est de{" "}
          {formatRatePercent(COMMISSION_REFERENCE.TOTAL)} : fiscalité + franchise
          + partenaire + plateforme — pas la somme franchise + partenaire seule.
        </p>
      </div>

      <div className="rounded-lg border border-teal/20 bg-teal/5 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">
            Parts franchise et partenaire
          </p>
          <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-teal-dark">
            Commission totale : {formatRatePercent(commissionTotal)} /{" "}
            {formatRatePercent(COMMISSION_REFERENCE.TOTAL)}
          </span>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <RateDisplay
            label={`Franchise (max ${formatRatePercent(COMMISSION_REFERENCE.FRANCHISE_MAX)})`}
            value={franchiseRate}
            readonly={!franchiseEditable}
            emphasized={franchiseEditable}
          />
          <RateDisplay
            label={`Partenaire (max ${formatRatePercent(COMMISSION_REFERENCE.PARTNER_MAX)})`}
            value={partnerRate}
            readonly={!partnerEditable}
            emphasized={partnerEditable}
          />
        </div>

        {franchiseEditable && onFranchiseRateChange ? (
          <>
            <label className="block text-xs font-medium text-muted">
              Curseur franchise — {formatRatePercent(franchiseRate)}
            </label>
            <input
              type="range"
              min={0}
              max={franchiseMaxPct}
              step={1}
              value={franchisePct}
              disabled={disabled}
              className="mt-2 w-full accent-teal"
              onChange={(e) =>
                onFranchiseRateChange(Number(e.target.value) / 10_000)
              }
            />
          </>
        ) : null}

        {partnerEditable ? (
          <>
            <label className="mt-3 block text-xs font-medium text-muted">
              Curseur partenaire — {formatRatePercent(partnerRate)}
            </label>
            <input
              type="range"
              min={0}
              max={partnerMaxPct}
              step={1}
              value={partnerPct}
              disabled={disabled}
              className="mt-2 w-full accent-teal"
              onChange={(e) =>
                onPartnerRateChange(Number(e.target.value) / 10_000)
              }
            />
          </>
        ) : null}

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {franchiseEditable && onFranchiseRateChange ? (
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Franchise (%)
              </span>
              <input
                type="text"
                inputMode="decimal"
                disabled={disabled}
                className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm tabular-nums"
                value={(franchiseRate * 100).toFixed(2)}
                onChange={(e) => {
                  const parsed = parseRatePercentInput(e.target.value);
                  if (parsed != null) onFranchiseRateChange(parsed);
                }}
              />
            </label>
          ) : (
            <RateDisplay label="Franchise" value={franchiseRate} readonly emphasized />
          )}

          {partnerEditable ? (
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Partenaire (%)
              </span>
              <input
                type="text"
                inputMode="decimal"
                disabled={disabled}
                className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm tabular-nums"
                value={(partnerRate * 100).toFixed(2)}
                onChange={(e) => {
                  const parsed = parseRatePercentInput(e.target.value);
                  if (parsed != null) onPartnerRateChange(parsed);
                }}
              />
            </label>
          ) : (
            <RateDisplay label="Partenaire" value={partnerRate} readonly emphasized />
          )}
        </div>

        {ratesError ? (
          <p className="mt-2 text-xs text-red-600">{ratesError}</p>
        ) : (
          <p className="mt-2 text-xs text-muted">
            Référence cahier : franchise{" "}
            {formatRatePercent(COMMISSION_REFERENCE.FRANCHISE_MAX)}, partenaire{" "}
            {formatRatePercent(COMMISSION_REFERENCE.PARTNER_MAX)}, fiscalité{" "}
            {formatRatePercent(COMMISSION_REFERENCE.FISCALITY)}, plateforme{" "}
            {formatRatePercent(COMMISSION_REFERENCE.PLATFORM)} → total{" "}
            {formatRatePercent(COMMISSION_REFERENCE.TOTAL)}.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-dashed border-border bg-canvas/30 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Ventilation commission ({formatRatePercent(COMMISSION_REFERENCE.TOTAL)})
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <RateSummaryItem label="Fiscalité" value={fiscalityRate} />
          <RateSummaryItem label="Franchise" value={franchiseRate} />
          <RateSummaryItem label="Partenaire" value={partnerRate} />
          <RateSummaryItem label="Plateforme" value={platformRate} />
        </dl>
        <p className="mt-2 text-xs text-muted">
          Chauffeur ({formatRatePercent(driverRate)}) : hors commission UPJUNOO
          (cash client).
        </p>
      </div>
    </div>
  );
}

function RateDisplay({
  label,
  value,
  readonly = false,
  emphasized = false,
}: {
  label: string;
  value: number;
  readonly?: boolean;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        emphasized
          ? "border-teal/30 bg-teal/5"
          : readonly
            ? "border-border bg-navy/[0.03] opacity-90"
            : "border-border bg-canvas"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
        {readonly ? " · lecture seule" : ""}
      </p>
      <p
        className={`mt-1 text-sm font-semibold tabular-nums ${
          emphasized ? "text-teal-dark" : "text-foreground"
        }`}
      >
        {formatRatePercent(value)}
      </p>
    </div>
  );
}

function RateSummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-[10px] text-muted">{label}</dt>
      <dd className="font-semibold tabular-nums text-foreground">
        {formatRatePercent(value)}
      </dd>
    </div>
  );
}
