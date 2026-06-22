"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import { formatFCFA } from "@/shared/lib/format";
import { usePartnerWalletTopUp } from "../api/wallet.queries";

interface PartnerWalletTopUpModalProps {
  open: boolean;
  onClose: () => void;
}

export function PartnerWalletTopUpModal({ open, onClose }: PartnerWalletTopUpModalProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"mobile_money" | "card">("mobile_money");
  const topUp = usePartnerWalletTopUp();

  if (!open) return null;

  const parsed = Number(amount.replace(/\s/g, ""));
  const valid = parsed > 0;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button
          type="button"
          className="absolute inset-0 bg-overlay animate-fade-up"
          aria-label="Fermer"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal
          className="relative w-full max-w-md rounded-card bg-surface p-6 shadow-card animate-fade-up"
        >
          <h2 className="text-lg font-semibold text-heading">Alimenter mon compte</h2>
          <p className="mt-1 text-sm text-muted">
            Créditer le portefeuille partenaire pour pouvoir recharger les chauffeurs.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMethod("mobile_money")}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                method === "mobile_money"
                  ? "border-teal bg-teal/10 text-teal-dark"
                  : "border-border bg-surface text-muted hover:bg-muted/10"
              }`}
            >
              Mobile Money
            </button>
            <button
              type="button"
              onClick={() => setMethod("card")}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                method === "card"
                  ? "border-teal bg-teal/10 text-teal-dark"
                  : "border-border bg-surface text-muted hover:bg-muted/10"
              }`}
            >
              Carte bancaire
            </button>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-medium">Montant (FCFA)</span>
            <input
              type="number"
              min={1000}
              step={500}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              placeholder="Ex: 50 000"
            />
          </label>

          {method === "card" && (
            <p className="mt-3 rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
              Le paiement par carte nécessite l&apos;intégration d&apos;un fournisseur de paiement.
            </p>
          )}

          {method === "mobile_money" && (
            <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
              Vous serez redirigé vers la page de paiement Mobile Money une fois le montant validé.
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button
              disabled={!valid || topUp.isPending}
              onClick={() => {
                if (!valid) return;
                topUp.mutate(
                  { amount_fcfa: parsed, method },
                  {
                    onSuccess: () => {
                      setAmount("");
                      onClose();
                    },
                  }
                );
              }}
            >
              {topUp.isPending ? "Envoi…" : `Alimenter ${parsed > 0 ? formatFCFA(parsed) : ""}`}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
