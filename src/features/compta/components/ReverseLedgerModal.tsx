"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import type { LedgerEntry } from "../api/compta.types";

interface ReverseLedgerModalProps {
  entry: LedgerEntry | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (payload: { reason: string; justification_ref?: string }) => void;
}

export function ReverseLedgerModal({
  entry,
  isPending,
  onClose,
  onConfirm,
}: ReverseLedgerModalProps) {
  const [reason, setReason] = useState("");
  const [justificationRef, setJustificationRef] = useState("");

  if (!entry) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button
          type="button"
          className="absolute inset-0 bg-overlay"
          aria-label="Fermer"
          onClick={onClose}
        />
        <div className="relative w-full max-w-lg rounded-card bg-surface p-6 shadow-card">
          <h2 className="text-lg font-semibold text-heading">Extourner l&apos;écriture</h2>
          <p className="mt-2 text-sm text-muted">
            Réf. {entry.txn_id ?? entry.id.slice(0, 8)} — {entry.amount_xof.toLocaleString("fr-CI")}{" "}
            FCFA
          </p>
          <div className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-foreground">Motif *</span>
              <textarea
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Erreur de saisie, doublon recharge…"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-foreground">Référence ticket</span>
              <input
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm"
                value={justificationRef}
                onChange={(e) => setJustificationRef(e.target.value)}
                placeholder="TICKET-4521"
              />
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isPending}>
              Annuler
            </Button>
            <Button
              className="!bg-red-600 hover:!bg-red-700"
              disabled={isPending || reason.trim().length < 5}
              onClick={() =>
                onConfirm({
                  reason: reason.trim(),
                  justification_ref: justificationRef.trim() || undefined,
                })
              }
            >
              {isPending ? "Extourne…" : "Confirmer l'extourne"}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
