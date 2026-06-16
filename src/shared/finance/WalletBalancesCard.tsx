"use client";

import type { ReactNode } from "react";
import { formatFCFA } from "@/shared/lib/format";
import {
  resolveWalletBalances,
  type WalletBalancesInput,
} from "./walletBalances";

interface WalletBalancesCardProps {
  title?: string;
  balances: WalletBalancesInput;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function WalletBalancesCard({
  title = "Portefeuille",
  balances,
  actions,
  footer,
  className = "",
}: WalletBalancesCardProps) {
  const resolved = resolveWalletBalances(balances);

  return (
    <div
      className={`rounded-card border border-border bg-surface p-5 shadow-card ${className}`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{title}</p>

      <p className="mt-2 text-2xl font-semibold tabular-nums text-heading">
        {formatFCFA(resolved.total_fcfa)}
      </p>

      {resolved.is_legacy_single_balance ? (
        <p className="mt-1 text-xs text-muted">
          Solde unique — le détail retirable / non retirable sera affiché lorsque l&apos;API
          l&apos;exposera.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/80 bg-navy/[0.02] px-3 py-2.5">
            <p className="text-xs font-medium text-muted">Retirable</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-teal-dark">
              {formatFCFA(resolved.withdrawable_fcfa)}
            </p>
          </div>
          <div className="rounded-lg border border-border/80 bg-navy/[0.02] px-3 py-2.5">
            <p className="text-xs font-medium text-muted">Non retirable</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
              {formatFCFA(resolved.non_withdrawable_fcfa)}
            </p>
            <p className="mt-0.5 text-[11px] text-muted">Bonus, commissions créditées…</p>
          </div>
        </div>
      )}

      {resolved.pending_fcfa != null && resolved.pending_fcfa > 0 && (
        <p className="mt-3 text-sm text-amber-700">
          {formatFCFA(resolved.pending_fcfa)} en attente de retrait
        </p>
      )}

      {actions ? <div className="mt-4">{actions}</div> : null}
      {footer ? <div className="mt-4 border-t border-border pt-4">{footer}</div> : null}
    </div>
  );
}
