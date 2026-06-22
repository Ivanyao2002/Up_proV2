"use client";

import { Button } from "@/shared/ui/Button";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import { formatDateTime, formatFCFA } from "@/shared/lib/format";
import {
  formatLedgerDetailLines,
  inferLedgerOwnerLabel,
  ledgerBreakdownItems,
  ledgerEntryTitle,
  ledgerEntryTypeLabel,
  ledgerServiceTypeLabel,
  ledgerSourceTypeLabel,
  ledgerStatusLabel,
} from "../api/compta.mapper";
import type { LedgerEntry } from "../api/compta.types";

interface ComptaLedgerDetailSheetProps {
  entry: LedgerEntry | null;
  onClose: () => void;
  onReverse?: (entry: LedgerEntry) => void;
}

function bucketLabel(bucket?: string): string {
  if (!bucket) return "—";
  return bucket === "WITHDRAWABLE" ? "Retirable" : "Service";
}

export function ComptaLedgerDetailSheet({
  entry,
  onClose,
  onReverse,
}: ComptaLedgerDetailSheetProps) {
  if (!entry) return null;

  const breakdown = ledgerBreakdownItems(entry);
  const amountItems = breakdown.filter((item) => item.isAmount);
  const refItems = breakdown.filter((item) => !item.isAmount);
  const canReverse =
    entry.status === "posted" && entry.entry_type !== "reversal";

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex justify-end">
        <button
          type="button"
          className="absolute inset-0 bg-overlay/80 backdrop-blur-[2px]"
          aria-label="Fermer"
          onClick={onClose}
        />
        <aside
          className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl animate-fade-up"
          role="dialog"
          aria-labelledby="ledger-detail-title"
        >
          <div className="border-b border-border bg-gradient-to-br from-teal/8 via-surface to-surface px-6 py-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-teal">
                  {ledgerEntryTypeLabel(entry.entry_type)}
                </p>
                <h2 id="ledger-detail-title" className="mt-1 text-lg font-semibold leading-snug text-foreground">
                  {ledgerEntryTitle(entry)}
                </h2>
                <p className="mt-1 text-xs text-muted">{formatDateTime(entry.posted_at)}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-muted transition hover:bg-surface-hover hover:text-foreground"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p
                  className={`text-3xl font-bold tabular-nums tracking-tight ${
                    entry.direction === "credit" ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {entry.direction === "credit" ? "+" : "−"}
                  {formatFCFA(entry.amount_xof)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {entry.direction === "credit" ? "Crédit" : "Débit"} · {bucketLabel(entry.balance_bucket)}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  entry.status === "posted"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-amber-50 text-amber-800"
                }`}
              >
                {ledgerStatusLabel(entry.status)}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <section className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted">Contexte</h3>
              <dl className="divide-y divide-border/60 rounded-xl border border-border bg-surface-hover/30">
                {inferLedgerOwnerLabel(entry) ? (
                  <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                    <dt className="text-muted">Compte</dt>
                    <dd className="font-medium text-right">{inferLedgerOwnerLabel(entry)}</dd>
                  </div>
                ) : null}
                {entry.service_type ? (
                  <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                    <dt className="text-muted">Service</dt>
                    <dd className="font-medium text-right">{ledgerServiceTypeLabel(entry.service_type)}</dd>
                  </div>
                ) : null}
                {entry.source_type ? (
                  <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                    <dt className="text-muted">Source</dt>
                    <dd className="text-right text-foreground/90">{ledgerSourceTypeLabel(entry.source_type)}</dd>
                  </div>
                ) : null}
                {entry.franchise_name && entry.franchise_name !== "—" ? (
                  <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                    <dt className="text-muted">Franchise</dt>
                    <dd className="text-right">{entry.franchise_name}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            {amountItems.length > 0 ? (
              <section className="mt-6 space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted">Ventilation</h3>
                <div className="grid grid-cols-2 gap-2">
                  {amountItems.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-border bg-surface px-3 py-3 shadow-sm"
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{item.label}</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {refItems.length > 0 ? (
              <section className="mt-6 space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted">Références</h3>
                <dl className="space-y-2">
                  {refItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start justify-between gap-3 rounded-lg bg-surface-hover/40 px-3 py-2.5 text-xs"
                    >
                      <dt className="shrink-0 text-muted">{item.label}</dt>
                      <dd className="break-all text-right font-mono text-foreground/85">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            <section className="mt-6 space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted">Identifiants</h3>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between gap-3 rounded-lg border border-dashed border-border px-3 py-2">
                  <dt className="text-muted">Écriture</dt>
                  <dd className="font-mono text-foreground/80">{entry.id.slice(0, 13)}…</dd>
                </div>
                {entry.order_id ? (
                  <div className="flex justify-between gap-3 rounded-lg border border-dashed border-border px-3 py-2">
                    <dt className="text-muted">Course</dt>
                    <dd className="font-mono text-foreground/80">{entry.order_id.slice(0, 13)}…</dd>
                  </div>
                ) : null}
              </dl>
            </section>
          </div>

          <div className="flex gap-2 border-t border-border bg-surface px-6 py-4">
            {canReverse && onReverse ? (
              <Button
                variant="secondary"
                className="flex-1"
                data-row-action
                onClick={() => onReverse(entry)}
              >
                Extourner
              </Button>
            ) : null}
            <Button variant="primary" className="flex-1" data-row-action onClick={onClose}>
              Fermer
            </Button>
          </div>
        </aside>
      </div>
    </ModalPortal>
  );
}

/** Export CSV — conserve le détail complet. */
export function ledgerEntryExportLine(entry: LedgerEntry): string {
  return [
    ledgerEntryTitle(entry),
    inferLedgerOwnerLabel(entry),
    entry.direction,
    entry.amount_xof,
    ledgerStatusLabel(entry.status),
    formatLedgerDetailLines(entry).join("; "),
  ]
    .filter(Boolean)
    .join(" | ");
}
