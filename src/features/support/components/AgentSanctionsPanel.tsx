"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { formatDateTime } from "@/shared/lib/format";
import type {
  AgentApplicableSanctionType,
  AgentSanction,
  AgentSanctionType,
} from "../api/agentTicket.types";

const SANCTION_LABELS: Record<AgentSanctionType, string> = {
  warning       : "Avertissement",
  surveillance  : "Mise sous surveillance",
  quality_points: "Retrait de points qualité",
  suspension    : "Suspension temporaire",
};

const AGENT_SANCTION_OPTIONS: AgentApplicableSanctionType[] = [
  "warning",
  "surveillance",
];

interface Props {
  sanctions : AgentSanction[];
  readOnly  : boolean;
  noTrip    : boolean;
  isPending : boolean;
  onApply   : (type: AgentApplicableSanctionType, reason: string) => void;
}

export function AgentSanctionsPanel({ sanctions, readOnly, noTrip, isPending, onApply }: Props) {
  const [open, setOpen]     = useState(false);
  const [type, setType]     = useState<AgentApplicableSanctionType>("warning");
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
          noTrip ? (
            <span className="text-xs italic text-muted" title="Escaladez vers l'admin avec les infos véhicule fournies par le client">
              Escalader vers admin
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-xs text-teal hover:underline"
            >
              + Appliquer
            </button>
          )
        )}
      </div>

      {/* Applied list */}
      {sanctions.length === 0 && !open && (
        noTrip ? (
          <div className="mt-3 rounded-lg bg-amber-500/8 border border-amber-500/20 px-3 py-2.5">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Aucune course liée à cette réclamation
            </p>
            <p className="mt-1 text-xs text-muted">
              Si le client vous fournit les infos du véhicule (plaque, nom du chauffeur, référence de course), escaladez le ticket vers l'admin en indiquant ces informations dans le motif. L'admin appliquera la sanction.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted">Aucune sanction appliquée.</p>
        )
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
              onChange={(e) => setType(e.target.value as AgentApplicableSanctionType)}
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
              placeholder="Motif de la sanction…"
              className="mt-1 w-full resize-none rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none ring-teal/30 focus:ring-2"
            />
            <p className={`mt-1 text-xs ${reason.trim().length < 10 ? "text-amber-500" : "text-teal"}`}>
              {reason.trim().length}/10 caractères minimum
            </p>
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
