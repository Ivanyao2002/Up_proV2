"use client";

import {
  inferLedgerOwnerLabel,
  ledgerEntryAccent,
  ledgerEntryTitle,
  ledgerEntryTypeLabel,
  ledgerServiceTypeLabel,
} from "../api/compta.mapper";
import type { LedgerEntry } from "../api/compta.types";

const ACCENT_STYLES = {
  teal: "bg-teal/10 text-teal-dark ring-teal/20",
  gold: "bg-amber-50 text-amber-800 ring-amber-200/60",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200/60",
} as const;

function entryGlyph(entry: LedgerEntry): string {
  const type = entry.entry_type.toLowerCase();
  if (type.includes("commission")) return "%";
  if (type.includes("recharge")) return "↗";
  if (type.includes("bonus") || type.includes("welcome")) return "★";
  if (type.includes("withdrawal")) return "↓";
  if (type.includes("reversal")) return "⟲";
  return "•";
}

export function ComptaLedgerEntryCell({ entry }: { entry: LedgerEntry }) {
  const accent = ledgerEntryAccent(entry);
  const owner = inferLedgerOwnerLabel(entry);
  const service =
    entry.service_type && ledgerServiceTypeLabel(entry.service_type) !== "—"
      ? ledgerServiceTypeLabel(entry.service_type)
      : null;

  return (
    <div className="flex min-w-[220px] max-w-md items-center gap-3 py-0.5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ring-1 ${ACCENT_STYLES[accent]}`}
        aria-hidden
      >
        {entryGlyph(entry)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{ledgerEntryTitle(entry)}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-surface-hover px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
            {ledgerEntryTypeLabel(entry.entry_type)}
          </span>
          {owner ? (
            <span className="rounded-md border border-border/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80">
              {owner}
            </span>
          ) : null}
          {service ? (
            <span className="rounded-md border border-teal/20 bg-teal/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-teal-dark">
              {service}
            </span>
          ) : null}
          {entry.order_id ? (
            <span className="font-mono text-[10px] text-muted">#{entry.order_id.slice(0, 8)}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
