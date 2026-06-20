"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { formatDateTime } from "@/shared/lib/format";
import type {
  AgentSanctionType,
  TicketSanction,
  SanctionType,
} from "../api/support.api.contract";

const SANCTION_LABELS: Record<SanctionType, string> = {
  warning       : "Avertissement",
  surveillance  : "Mise sous surveillance",
  quality_points: "Retrait de points qualité",
  suspension    : "Suspension temporaire",
};

const AGENT_SANCTION_OPTIONS: AgentSanctionType[] = [
  "warning",
  "surveillance",
];

interface Props {
  sanctions : TicketSanction[];
  readOnly  : boolean;
  isPending : boolean;
  onApply   : (type: AgentSanctionType, reason: string) => void;
}

export function AgentSanctionsPanel({ sanctions, readOnly, isPending, onApply }: Props) {
  const [open, setOpen]     = useState(false);
  const [type, setType]     = useState<AgentSanctionType>("warning");
  const [reason, setReason] = useState("");

  function handleSubmit() {
    if (!reason.trim()) return;
    onApply(type, reason.trim());
    setReason("");
    setOpen(false);
  }

  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-heading">Sanctions</h3>
        {!readOnly && !open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs text-teal hover:underline"
          >
            + Appliquer
          </button>
        )}
      </div>

      {/* Applied list */}
      {sanctions.length === 0 && !open && (
        <p className="mt-3 text-xs text-muted">Aucune sanction appliquée.</p>
      )}
      {sanctions.length > 0 && (
        <ul className="mt-3 space-y-2">
          {sanctions.map((s) => (
            <li key={s.id} className="rounded-lg bg-canvas px-3 py-2 text-xs">
              <p className="font-medium text-foreground">{SANCTION_LABELS[s.type]}</p>
              <p className="mt-0.5 text-muted">{s.reason}</p>
              <p className="mt-0.5 text-muted">
                {s.applied_by} · {formatDateTime(s.applied_at)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* Inline form */}
      {open && (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-foreground">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AgentSanctionType)}
              className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none ring-teal/30 focus:ring-2"
            >
              {AGENT_SANCTION_OPTIONS.map((k) => (
                <option key={k} value={k}>{SANCTION_LABELS[k]}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">
              Retrait de points et suspension : escalade vers Administration.
            </p>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-foreground">Motif</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Motif de la sanction (min. 10 caractères)…"
              className="mt-1 w-full resize-none rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none ring-teal/30 focus:ring-2"
            />
          </label>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" className="!text-xs" onClick={() => { setOpen(false); setReason(""); }}>
              Annuler
            </Button>
            <Button
              className="!text-xs"
              disabled={reason.trim().length < 10 || isPending}
              onClick={handleSubmit}
            >
              {isPending ? "Envoi…" : "Confirmer"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
