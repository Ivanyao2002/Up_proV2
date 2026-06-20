"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";

export type ActionModalKind = "resolve" | "close" | "escalate";

const CONFIG: Record<
  ActionModalKind,
  { title: string; placeholder: string; noteRequired: boolean; confirmLabel: string; confirmCls: string; hint?: string }
> = {
  resolve: {
    title       : "Résoudre le ticket",
    placeholder : "Résumé de la résolution (optionnel)…",
    noteRequired: false,
    confirmLabel: "Résoudre",
    confirmCls  : "",
  },
  close: {
    title       : "Clôturer le ticket",
    placeholder : "Motif de clôture (optionnel)…",
    noteRequired: false,
    confirmLabel: "Clôturer",
    confirmCls  : "",
  },
  escalate: {
    title       : "Escalader vers Administration / Central",
    placeholder : "Motif d'escalade…",
    noteRequired: true,
    confirmLabel: "Escalader",
    confirmCls  : "bg-red-600 hover:opacity-90",
    hint        : "Le ticket sera transmis à l'équipe centrale. Cette action ne peut pas être annulée.",
  },
};

interface Props {
  kind      : ActionModalKind;
  isPending : boolean;
  onConfirm : (note?: string) => void;
  onCancel  : () => void;
}

export function AgentActionModal({ kind, isPending, onConfirm, onCancel }: Props) {
  const [note, setNote] = useState("");
  const cfg = CONFIG[kind];

  function handleConfirm() {
    if (cfg.noteRequired && !note.trim()) return;
    onConfirm(note.trim() || undefined);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
      <div className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-card">
        <h2 className="text-lg font-semibold text-heading">{cfg.title}</h2>

        {cfg.hint && (
          <p className="mt-2 text-sm text-muted">{cfg.hint}</p>
        )}

        <div className="mt-4">
          <label className="block">
            <span className="text-sm font-medium text-foreground">
              Note{cfg.noteRequired ? "" : " (optionnel)"}
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={cfg.placeholder}
              className="mt-1 w-full resize-none rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            className={cfg.confirmCls}
            disabled={isPending || (cfg.noteRequired && !note.trim())}
            onClick={handleConfirm}
          >
            {isPending ? "Envoi…" : cfg.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
