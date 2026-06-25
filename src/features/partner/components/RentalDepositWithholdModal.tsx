"use client";

import { useState } from "react";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import { Button } from "@/shared/ui/Button";
import { formatFCFA } from "@/shared/lib/format";
import { RentalPhotoUploader } from "./RentalPhotoUploader";
import type { RentalDepositWithholdPayload } from "../api/rentalDeposit.service";

const inputClass = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm";

/** Retenue de caution : montant + motif obligatoire + preuves (DB-RENT-15). */
export function RentalDepositWithholdModal({
  depositAmount,
  isPending,
  onConfirm,
  onClose,
}: {
  depositAmount: number;
  isPending?: boolean;
  onConfirm: (data: RentalDepositWithholdPayload) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState<string>(String(depositAmount || ""));
  const [reason, setReason] = useState("");
  const [proofs, setProofs] = useState<File[]>([]);

  const amountNum = Number(amount);
  const valid =
    reason.trim().length > 0 &&
    amountNum > 0 &&
    amountNum <= depositAmount;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-overlay" onClick={onClose} />
        <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-card bg-surface p-6 shadow-card">
          <h2 className="mb-1 text-lg font-semibold">Retenir une partie de la caution</h2>
          <p className="mb-4 text-sm text-muted">
            Caution disponible : {formatFCFA(depositAmount)}
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Montant à retenir (FCFA) *</label>
              <input
                type="number"
                min="0"
                max={depositAmount}
                className={inputClass}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {amountNum > depositAmount && (
                <p className="mt-1 text-xs text-red-600">
                  Le montant dépasse la caution disponible.
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Motif (obligatoire)</label>
              <textarea
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Détail des dommages / frais justifiant la retenue…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Preuves (photos / rapport)</label>
              <RentalPhotoUploader files={proofs} onChange={setProofs} min={0} />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isPending}>
              Annuler
            </Button>
            <Button
              className="!bg-red-600 hover:!bg-red-700"
              disabled={isPending || !valid}
              onClick={() =>
                onConfirm({
                  amount_fcfa: amountNum,
                  reason: reason.trim(),
                  proofs: proofs.map((f) => f.name),
                })
              }
            >
              {isPending ? "En cours..." : "Confirmer la retenue"}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
