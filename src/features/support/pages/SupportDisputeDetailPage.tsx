"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { Timeline, type TimelineItem } from "@/shared/ui/Timeline";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import type { ResolveDisputePayload } from "../api/disputes.service";
import { useDisputeDetail, useResolveDispute } from "../api/disputes.queries";

interface SupportDisputeDetailPageProps {
  disputeId: string;
}

export function SupportDisputeDetailPage({ disputeId }: SupportDisputeDetailPageProps) {
  const [showResolve, setShowResolve] = useState(false);
  const [outcome, setOutcome] = useState<ResolveDisputePayload["outcome"]>("partial_refund");
  const [refundFcfa, setRefundFcfa] = useState("");
  const [note, setNote] = useState("");

  const { data, isLoading, isError } = useDisputeDetail(disputeId);
  const resolve = useResolveDispute(disputeId);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Litige introuvable.{" "}
        <Link href="/admin/support/tickets" className="text-teal underline">
          Retour aux tickets
        </Link>
      </p>
    );
  }

  const timelineItems: TimelineItem[] = data.timeline.map((e) => ({
    id: e.id,
    label: e.label,
    description: e.description ? `${e.description} · ${e.actor}` : e.actor,
    at: e.at,
    variant: "default" as const,
  }));

  const isResolved = data.status === "resolved";

  const submitResolve = () => {
    resolve.mutate(
      {
        outcome,
        note: note.trim() || undefined,
        refund_fcfa:
          outcome === "partial_refund" && refundFcfa
            ? Number(refundFcfa)
            : outcome === "full_refund"
              ? data.amount_disputed_fcfa
              : undefined,
      },
      { onSuccess: () => setShowResolve(false) }
    );
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={data.subject}
        breadcrumb={["Admin", "Support", data.id]}
        actions={
          !isResolved ? (
            <Button disabled={resolve.isPending} onClick={() => setShowResolve(true)}>
              Résoudre le litige
            </Button>
          ) : (
            <span className="rounded-full bg-teal/15 px-3 py-1 text-xs font-medium text-teal-dark">
              Résolu
            </span>
          )
        }
      />

      <p className="mb-6 text-sm">
        <Link href="/admin/support/tickets" className="text-teal hover:underline">
          ← Retour aux tickets
        </Link>
        {" · "}
        <span className="text-muted">Ticket {data.ticket_id}</span>
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <h2 className="text-sm font-semibold text-heading">Description</h2>
            <p className="mt-3 text-sm text-muted">{data.description}</p>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <h2 className="text-sm font-semibold text-heading">Historique</h2>
            <div className="mt-4">
              <Timeline items={timelineItems} />
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <h2 className="text-sm font-semibold text-heading">Pièces jointes</h2>
            <ul className="mt-3 divide-y divide-border">
              {data.evidence.map((ev) => (
                <li key={ev.id} className="flex justify-between py-3 text-sm first:pt-0">
                  <span className="text-foreground">{ev.label}</span>
                  <span className="text-xs text-muted">{formatDateTime(ev.uploaded_at)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card text-sm">
            <h3 className="font-semibold text-heading">Détails</h3>
            <dl className="mt-3 space-y-2 text-muted">
              <div className="flex justify-between gap-2">
                <dt>Signaleur</dt>
                <dd className="text-foreground">{data.reporter_name}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Franchise</dt>
                <dd className="text-foreground">{data.franchise_name}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Course</dt>
                <dd>
                  <Link
                    href={`/admin/ops/trips/${data.trip_id}`}
                    className="text-teal hover:underline"
                  >
                    {data.trip_ref}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Montant litigieux</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {formatFCFA(data.amount_disputed_fcfa)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Créé le</dt>
                <dd className="text-foreground">{formatDateTime(data.created_at)}</dd>
              </div>
            </dl>
          </div>

          <Link href={`/admin/ops/trips/${data.trip_id}/forensic`}>
            <Button variant="secondary" className="w-full !text-xs">
              Voir forensic GPS
            </Button>
          </Link>
        </aside>
      </div>

      {showResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
          <div className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-card">
            <h2 className="text-lg font-semibold text-heading">Résoudre le litige</h2>
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="text-sm font-medium">Décision</span>
                <select
                  value={outcome}
                  onChange={(e) =>
                    setOutcome(e.target.value as ResolveDisputePayload["outcome"])
                  }
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                >
                  <option value="full_refund">Remboursement intégral</option>
                  <option value="partial_refund">Remboursement partiel</option>
                  <option value="rejected">Réclamation rejetée</option>
                  <option value="standard">Résolution standard</option>
                </select>
              </label>
              {outcome === "partial_refund" && (
                <label className="block">
                  <span className="text-sm font-medium">Montant remboursé (FCFA)</span>
                  <input
                    type="number"
                    min={0}
                    max={data.amount_disputed_fcfa}
                    value={refundFcfa}
                    onChange={(e) => setRefundFcfa(e.target.value)}
                    placeholder={String(Math.round(data.amount_disputed_fcfa / 2))}
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                  />
                </label>
              )}
              <label className="block">
                <span className="text-sm font-medium">Note interne</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Motif de la décision…"
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowResolve(false)}>
                Annuler
              </Button>
              <Button disabled={resolve.isPending} onClick={submitResolve}>
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
