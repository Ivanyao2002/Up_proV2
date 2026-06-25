"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { formatFCFA } from "@/shared/lib/format";
import { notificationService } from "@/core/http/notificationService";
import { useReleaseDeposit, useWithholdDeposit } from "../api/rentalDeposit.queries";
import { RentalDepositWithholdModal } from "./RentalDepositWithholdModal";
import type { RentalOffer, RentalDepositStatus } from "../api/rental.service";

const STATUS_META: Record<RentalDepositStatus, { label: string; color: string }> = {
  none: { label: "Aucune", color: "bg-gray-100 text-gray-600" },
  held: { label: "Bloquée", color: "bg-amber-100 text-amber-700" },
  released: { label: "Restituée", color: "bg-green-100 text-green-700" },
  withheld: { label: "Retenue", color: "bg-red-100 text-red-700" },
};

export function RentalDepositPanel({ offer }: { offer: RentalOffer }) {
  const release = useReleaseDeposit();
  const withhold = useWithholdDeposit();
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [showWithhold, setShowWithhold] = useState(false);

  const amount = offer.deposit_fcfa ?? 0;
  const status: RentalDepositStatus = offer.deposit_status ?? "held";
  const meta = STATUS_META[status];
  const settled = status === "released" || status === "withheld";

  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-heading">Caution</h2>
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${meta.color}`}>
          {meta.label}
        </span>
      </div>

      <div className="flex justify-between">
        <span className="text-sm text-muted">Montant</span>
        <span className="text-sm font-semibold text-teal">{formatFCFA(amount)}</span>
      </div>

      {settled ? (
        <p className="mt-3 text-xs text-muted">
          {status === "released"
            ? "La caution a été restituée au client."
            : "Une retenue a été appliquée. Le client peut contester via un ticket."}
        </p>
      ) : (
        <>
          <div className="mt-4 space-y-2">
            <Button
              variant="secondary"
              className="w-full"
              disabled={release.isPending}
              onClick={() => setConfirmRelease(true)}
            >
              Restituer la caution
            </Button>
            <Button
              variant="secondary"
              className="w-full text-red-600"
              disabled={amount <= 0}
              onClick={() => setShowWithhold(true)}
            >
              Retenir une partie
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted">
            En cas de retenue, le client peut contester via un ticket de support.
          </p>
        </>
      )}

      {confirmRelease && (
        <ConfirmModal
          open
          title="Restituer la caution"
          message={`Restituer ${formatFCFA(amount)} au client ?`}
          confirmLabel="Restituer"
          cancelLabel="Annuler"
          onConfirm={() => {
            release.mutate(
              { offerId: offer.id },
              {
                onSuccess: () => notificationService.success("Caution restituée"),
                onError: () => notificationService.error("Restitution impossible."),
              }
            );
            setConfirmRelease(false);
          }}
          onCancel={() => setConfirmRelease(false)}
        />
      )}

      {showWithhold && (
        <RentalDepositWithholdModal
          depositAmount={amount}
          isPending={withhold.isPending}
          onConfirm={(data) =>
            withhold.mutate(
              { offerId: offer.id, data },
              {
                onSuccess: () => {
                  notificationService.success("Retenue enregistrée");
                  setShowWithhold(false);
                },
                onError: () => notificationService.error("Retenue impossible."),
              }
            )
          }
          onClose={() => setShowWithhold(false)}
        />
      )}
    </div>
  );
}
