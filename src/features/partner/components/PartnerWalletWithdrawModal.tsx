"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { formatFCFA } from "@/shared/lib/format";
import { usePartnerWalletWithdraw } from "../api/wallet.queries";

const DEFAULT_DAILY_CAP = 30_000;

interface PartnerWalletWithdrawModalProps {
  open: boolean;
  availableFcfa: number;
  /** Plafond journalier paramétrable (défaut 30 000 XOF) */
  dailyCapFcfa?: number;
  /** Montant déjà retiré aujourd'hui */
  todayWithdrawnFcfa?: number;
  onClose: () => void;
}

export function PartnerWalletWithdrawModal({
  open,
  availableFcfa,
  dailyCapFcfa = DEFAULT_DAILY_CAP,
  todayWithdrawnFcfa = 0,
  onClose,
}: PartnerWalletWithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const withdraw = usePartnerWalletWithdraw();

  if (!open) return null;

  const remainingCapToday = Math.max(0, dailyCapFcfa - todayWithdrawnFcfa);
  const maxAllowed = Math.min(availableFcfa, remainingCapToday);
  const parsed = Number(amount.replace(/\s/g, ""));
  const valid = parsed > 0 && parsed <= maxAllowed;

  const errorMsg =
    parsed > availableFcfa
      ? "Montant supérieur au solde disponible"
      : parsed > remainingCapToday
      ? `Plafond journalier atteint (max ${formatFCFA(remainingCapToday)} restant aujourd'hui)`
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-overlay"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        className="relative w-full max-w-md rounded-card bg-surface p-6 shadow-card"
      >
        <h2 className="text-lg font-semibold text-heading">Demander un retrait</h2>
        <p className="mt-1 text-sm text-muted">
          Disponible : {formatFCFA(availableFcfa)}
        </p>

        <div className="mt-3 flex gap-4 rounded-lg bg-muted/10 px-4 py-2 text-xs text-muted">
          <span>Plafond / jour : <strong className="text-foreground">{formatFCFA(dailyCapFcfa)}</strong></span>
          <span>Retiré aujourd'hui : <strong className="text-foreground">{formatFCFA(todayWithdrawnFcfa)}</strong></span>
          <span>Reste : <strong className={remainingCapToday <= 0 ? "text-red-600" : "text-teal-dark"}>{formatFCFA(remainingCapToday)}</strong></span>
        </div>

        {remainingCapToday <= 0 ? (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Plafond journalier atteint. Vous pourrez retirer à nouveau demain.
          </p>
        ) : (
          <label className="mt-4 block">
            <span className="text-sm font-medium">Montant (FCFA)</span>
            <input
              type="number"
              min={1000}
              max={maxAllowed}
              step={500}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              placeholder={`Max ${formatFCFA(maxAllowed)}`}
            />
            {parsed > 0 && errorMsg && (
              <p className="mt-1 text-xs text-red-600">{errorMsg}</p>
            )}
          </label>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            disabled={!valid || withdraw.isPending || remainingCapToday <= 0}
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
