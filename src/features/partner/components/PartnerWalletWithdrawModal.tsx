"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { formatFCFA } from "@/shared/lib/format";
import { usePartnerWalletWithdraw } from "../api/wallet.queries";

interface PartnerWalletWithdrawModalProps {
  open: boolean;
  availableFcfa: number;
  onClose: () => void;
}

export function PartnerWalletWithdrawModal({
  open,
  availableFcfa,
  onClose,
}: PartnerWalletWithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const withdraw = usePartnerWalletWithdraw();

  if (!open) return null;

  const parsed = Number(amount.replace(/\s/g, ""));
  const valid = parsed > 0 && parsed <= availableFcfa;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-navy/40"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        className="relative w-full max-w-md rounded-card bg-surface p-6 shadow-card"
      >
        <h2 className="text-lg font-semibold text-navy">Demander un retrait</h2>
        <p className="mt-1 text-sm text-muted">
          Disponible : {formatFCFA(availableFcfa)}
        </p>

        <label className="mt-4 block">
          <span className="text-sm font-medium">Montant (FCFA)</span>
          <input
            type="number"
            min={1000}
            max={availableFcfa}
            step={500}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            placeholder="Ex. 50000"
          />
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            disabled={!valid || withdraw.isPending}
            onClick={() => {
              if (!valid) return;
              withdraw.mutate(parsed, {
                onSuccess: () => {
                  setAmount("");
                  onClose();
                },
              });
            }}
          >
            {withdraw.isPending ? "Envoi…" : "Confirmer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
