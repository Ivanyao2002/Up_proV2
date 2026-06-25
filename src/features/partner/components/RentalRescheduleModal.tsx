"use client";

import { useState } from "react";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import { Button } from "@/shared/ui/Button";
import type { RentalReschedulePayload } from "../api/rental.service";

/** Proposer un autre créneau de location (DB-RENT-16). */
export function RentalRescheduleModal({
  offerRef,
  defaultPickup,
  defaultReturn,
  isPending,
  onConfirm,
  onClose,
}: {
  offerRef?: string;
  defaultPickup?: string;
  defaultReturn?: string;
  isPending?: boolean;
  onConfirm: (data: RentalReschedulePayload) => void;
  onClose: () => void;
}) {
  const [pickup, setPickup] = useState(defaultPickup?.slice(0, 16) ?? "");
  const [ret, setRet] = useState(defaultReturn?.slice(0, 16) ?? "");
  const [reason, setReason] = useState("");

  const valid = pickup && ret && new Date(ret) > new Date(pickup);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-overlay" onClick={onClose} />
        <div className="relative w-full max-w-md rounded-card bg-surface p-6 shadow-card">
          <h2 className="mb-1 text-lg font-semibold">Replanifier</h2>
          {offerRef && <p className="mb-4 text-sm text-muted">{offerRef}</p>}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Nouvelle prise en charge</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Nouveau retour</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                value={ret}
                onChange={(e) => setRet(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Motif (optionnel)</label>
              <input
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isPending}>
              Annuler
            </Button>
            <Button
              disabled={isPending || !valid}
              onClick={() =>
                onConfirm({ pickup_date: pickup, return_date: ret, reason: reason || undefined })
              }
            >
              {isPending ? "En cours..." : "Proposer ce créneau"}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
