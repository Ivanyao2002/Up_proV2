"use client";

import { useState } from "react";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import { Button } from "@/shared/ui/Button";

/**
 * Modale de motif obligatoire pour un refus ou une annulation (DB-RENT-05).
 * `variant` ne change que les libellés.
 */
export function RentalRejectModal({
  offerRef,
  variant = "reject",
  isPending,
  onConfirm,
  onClose,
}: {
  offerRef?: string;
  variant?: "reject" | "cancel";
  isPending?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const labels =
    variant === "cancel"
      ? { title: "Annuler la réservation", action: "Annuler la réservation" }
      : { title: "Refuser la réservation", action: "Refuser" };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-overlay" onClick={onClose} />
        <div className="relative w-full max-w-md rounded-card bg-surface p-6 shadow-card">
          <h2 className="mb-1 text-lg font-semibold">{labels.title}</h2>
          {offerRef && <p className="mb-4 text-sm text-muted">{offerRef}</p>}
          <label className="mb-1 block text-sm font-medium">Motif (obligatoire)</label>
          <textarea
            rows={3}
            autoFocus
            className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            placeholder="Précisez le motif communiqué au client…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isPending}>
              Fermer
            </Button>
            <Button
              className="!bg-red-600 hover:!bg-red-700"
              disabled={isPending || reason.trim().length === 0}
              onClick={() => onConfirm(reason.trim())}
            >
              {isPending ? "En cours..." : labels.action}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
