"use client";

import { formatFCFA } from "@/shared/lib/format";
import { getPaymentLabel } from "@/shared/lib/paymentLabels";
import type { TripDetail, TripFinanceSnapshot } from "@/shared/types";

interface TripFinancePanelProps {
  trip: Pick<
    TripDetail,
    | "amount_fcfa"
    | "commission_fcfa"
    | "driver_earning_fcfa"
    | "payment_method"
    | "finance"
  >;
  className?: string;
}

function CommissionStatusPill({ status }: { status?: string }) {
  if (!status?.trim()) return null;
  const normalized = status.toLowerCase();
  const label =
    normalized === "debited" || normalized === "completed"
      ? "Commission débitée"
      : normalized === "pending"
        ? "Commission en attente"
        : normalized === "failed"
          ? "Échec commission"
          : status;

  const tone =
    normalized === "debited" || normalized === "completed"
      ? "bg-teal/15 text-teal-dark"
      : normalized === "pending"
        ? "bg-amber-50 text-amber-800"
        : normalized === "failed"
          ? "bg-red-50 text-red-700"
          : "bg-navy/10 text-muted";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {label}
    </span>
  );
}

function BreakdownRow({ label, value }: { label: string; value?: number }) {
  if (value == null || value <= 0) return null;
  return (
    <div className="flex justify-between text-muted">
      <dt>{label}</dt>
      <dd className="tabular-nums text-foreground">{formatFCFA(value)}</dd>
    </div>
  );
}

function commissionPartsTotal(
  breakdown: NonNullable<TripFinanceSnapshot["commission_breakdown"]>
): number {
  return (
    (breakdown.fiscality_fcfa ?? 0) +
    (breakdown.franchise_fcfa ?? 0) +
    (breakdown.partner_fcfa ?? 0) +
    (breakdown.platform_fcfa ?? 0)
  );
}

function resolveDriverNetFcfa(
  trip: TripFinancePanelProps["trip"],
  breakdown: NonNullable<TripFinanceSnapshot["commission_breakdown"]>
): number | undefined {
  if (breakdown.driver_fcfa != null && breakdown.driver_fcfa > 0) {
    return breakdown.driver_fcfa;
  }
  if (trip.driver_earning_fcfa > 0) return trip.driver_earning_fcfa;
  const gross = trip.finance?.cash_received_fcfa ?? trip.amount_fcfa;
  const commission = commissionPartsTotal(breakdown);
  if (gross > 0 && commission > 0 && gross > commission) {
    return gross - commission;
  }
  return undefined;
}

function hasBreakdown(finance?: TripFinanceSnapshot): boolean {
  const b = finance?.commission_breakdown;
  if (!b) return false;
  return (
    (b.platform_fcfa ?? 0) > 0 ||
    (b.franchise_fcfa ?? 0) > 0 ||
    (b.partner_fcfa ?? 0) > 0 ||
    (b.fiscality_fcfa ?? 0) > 0
  );
}

export function TripFinancePanel({ trip, className = "" }: TripFinancePanelProps) {
  const finance = trip.finance;
  const cashReceived = finance?.cash_received_fcfa ?? trip.amount_fcfa;
  const breakdown = finance?.commission_breakdown;
  const showBreakdown = hasBreakdown(finance);
  const driverNetFcfa =
    breakdown && showBreakdown ? resolveDriverNetFcfa(trip, breakdown) : undefined;

  return (
    <div
      className={`rounded-card border border-border bg-surface p-5 shadow-card ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Finance course
        </p>
        <CommissionStatusPill status={finance?.commission_status} />
      </div>

      <p className="mt-2 text-3xl font-semibold tabular-nums text-heading">
        {formatFCFA(trip.amount_fcfa)}
      </p>
      <p className="mt-0.5 text-xs text-muted">Recette brute (tarif course)</p>

      <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-muted">
          <dt>Espèces reçues chauffeur</dt>
          <dd className="tabular-nums font-medium text-foreground">
            {formatFCFA(cashReceived)}
          </dd>
        </div>
        <p className="text-[11px] text-muted">
          Le chauffeur encaisse 100 % en espèces ; la commission est débitée du portefeuille.
        </p>

        {showBreakdown ? (
          <>
            <p className="pt-1 text-xs font-medium uppercase tracking-wider text-muted">
              Répartition commission
            </p>
            <BreakdownRow label="Fiscalité" value={breakdown?.fiscality_fcfa} />
            <BreakdownRow label="Franchise" value={breakdown?.franchise_fcfa} />
            <BreakdownRow label="Partenaire" value={breakdown?.partner_fcfa} />
            <BreakdownRow label="Plateforme" value={breakdown?.platform_fcfa} />
            {driverNetFcfa != null && driverNetFcfa > 0 ? (
              <div className="flex justify-between border-t border-border pt-2 text-muted">
                <dt className="font-medium text-foreground">Chauffeur (net)</dt>
                <dd className="tabular-nums font-semibold text-teal-dark">
                  {formatFCFA(driverNetFcfa)}
                </dd>
              </div>
            ) : null}
            <p className="text-[11px] text-muted">
              Montant conservé par le chauffeur après débit de la commission sur son portefeuille.
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-between text-muted">
              <dt>Commission totale</dt>
              <dd className="tabular-nums text-foreground">
                {formatFCFA(trip.commission_fcfa)}
              </dd>
            </div>
            <div className="flex justify-between text-muted">
              <dt>Gain chauffeur (net)</dt>
              <dd className="tabular-nums font-medium text-teal-dark">
                {formatFCFA(trip.driver_earning_fcfa)}
              </dd>
            </div>
          </>
        )}

        {(finance?.wallet_before_fcfa != null || finance?.wallet_after_fcfa != null) && (
          <>
            <p className="pt-2 text-xs font-medium uppercase tracking-wider text-muted">
              Portefeuille chauffeur
            </p>
            {finance.wallet_before_fcfa != null && (
              <div className="flex justify-between text-muted">
                <dt>Solde avant course</dt>
                <dd className="tabular-nums text-foreground">
                  {formatFCFA(finance.wallet_before_fcfa)}
                </dd>
              </div>
            )}
            {finance.wallet_after_fcfa != null && (
              <div className="flex justify-between text-muted">
                <dt>Solde après commission</dt>
                <dd className="tabular-nums font-medium text-foreground">
                  {formatFCFA(finance.wallet_after_fcfa)}
                </dd>
              </div>
            )}
          </>
        )}

        <div className="flex justify-between border-t border-border pt-2 text-muted">
          <dt>Paiement</dt>
          <dd className="text-foreground">{getPaymentLabel(trip.payment_method)}</dd>
        </div>
      </dl>
    </div>
  );
}
